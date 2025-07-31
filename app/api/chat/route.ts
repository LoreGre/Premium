import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { extractEntitiesLLM } from '@/components/chat/chat-exctract-entities'
import { buildEmbeddingText } from '@/components/chat/chat-build-embedding'
import { getEmbedding } from '@/components/chat/chat-get-embedding'
import { saveMessageMongo } from '@/components/chat/chat-save'
import { getSessionHistoryMongo } from '@/components/chat/chat-sessions'
import { getProducts } from '@/components/chat/chat-get-products'
import { detectContextShift } from '@/components/chat/chat-detect-context'
import { generateChatResponse } from '@/components/chat/chat-response'
import type { ChatAIResponse } from '@/components/chat/types'
import {fallbackNoEntities,fallbackNoProducts, fallbackContextShift, fallbackNoIntent} from '@/components/chat/chat-fallback'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    // Step 1 – Autenticazione utente
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth
    const { user } = auth
    logger.info('Utente autenticato', { userId: user.id })

    // Step 2 – Parsing input e validazione
    const { message, sessionId } = await req.json()
    logger.info('Payload ricevuto', { message, sessionId })

    if (!message || !sessionId) {
      logger.warn('Messaggio o sessione mancanti nel payload')
      return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    }

    if (!ObjectId.isValid(sessionId)) {
      throw new Error('ID di sessione non valido')
    }
    
    const sessionObjectId = new ObjectId(sessionId)

    // Step 3 – Estrazione entità dal messaggio utente
    const entities = await extractEntitiesLLM(message)
    logger.info('[POST] Entità estratte', { entities })

    // Step 4 – Costruzione testo strutturato per embedding
    const embeddingText = buildEmbeddingText(message, entities)
    logger.info('[POST] Testo embedding strutturato', { embeddingText })

    // Step 5 – Generazione embedding dal testo strutturato
    const embedding = await getEmbedding(embeddingText)
    logger.info('[POST] Embedding generato', { preview: embedding.slice(0, 5) })

    // Step 6 – Recupero cronologia messaggi recenti (ultimi 10)
    const history = await getSessionHistoryMongo(sessionId, 10)
    logger.info('[POST] History', { history })

    // Step 7 – Ricerca prodotti con entità + embedding + contesto
    const { products, entities: mergedEntities } = await getProducts(message, embedding, history, entities, 10)
    logger.info('[POST] Prodotti trovati', { count: products.length, skus: products.map(p => p.sku) })

    // Step 8 – Detect context shift
    const contextShift = detectContextShift(history, mergedEntities)

    let aiResponse: ChatAIResponse
    let responseSource = 'default'

    if (contextShift) {
      logger.warn('[POST] Cambio argomento rilevato – fallbackContextShift attivo')
      aiResponse = await fallbackContextShift({ message, embedding, history, entities: mergedEntities })
      responseSource = 'fallback-context-shift'
    } else if (mergedEntities.length === 0) {
      logger.warn('[POST] Nessuna entità trovata – fallbackNoEntities attivo')
      aiResponse = await fallbackNoEntities({ message, embedding, history })
      responseSource = 'fallback-no-entities'
    } else if (products.length === 0) {
      logger.warn('[POST] Nessun prodotto trovato – fallbackNoProducts attivo')
      aiResponse = await fallbackNoProducts({ message, embedding, history, entities: mergedEntities })
      responseSource = 'fallback-no-products'
    } else {
      aiResponse = await generateChatResponse({
        message,
        products,
        contextMessages: history,
        entities: mergedEntities
      })
      responseSource = 'standard-response'
    
      // 🔍 Controllo intenzione mancante
      if (!aiResponse.intent || aiResponse.intent === 'other') {
        logger.warn('[POST] Intento non rilevato – fallbackNoIntent attivo')
        aiResponse = await fallbackNoIntent({
          message,
          embedding,
          history,
          entities: mergedEntities
        })
        responseSource = 'fallback-no-intent'
      }
    }
    

    logger.info('[POST] Risposta AI finalizzata', {
      source: responseSource,
      intent: aiResponse.intent,
      nRecommended: aiResponse.recommended.length
    })

    // Step 9 – Salvataggio messaggio utente con entità ed embedding
    const userMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'user',
      content: message,
      embedding,
      entities: mergedEntities,
      createdAt: new Date().toISOString()
    })
    logger.info('[POST] Messaggio utente salvato', { userMessageId })

    // Step 10 – Salvataggio messaggio AI con raccomandazioni e entità
    const aiMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse.summary,
      recommended: aiResponse.recommended,
      intent: aiResponse.intent ?? 'suggestion',
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      createdAt: new Date().toISOString()
    })
    logger.info('[POST] Messaggio AI salvato', { aiMessageId })

    // Step 11 – Risposta JSON al client
    return NextResponse.json({
      summary: aiResponse.summary,
      recommended: aiResponse.recommended,
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      intent: aiResponse.intent ?? 'suggestion',
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      _id: aiMessageId?.toString()
    })

  } catch (err) {
    logger.error('[POST] Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
