import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbedding } from '@/components/chat/chat-embedding'
import {
  saveMessageMongo,
  generateChatResponse,
  getSessionHistoryMongo,
  searchHybridMongo
} from '@/components/chat/chat-actions'
import type { ProductItem, ChatAIResponse } from '@/components/chat/types'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient()
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      logger.warn('Token mancante')
      return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      logger.warn('Utente non autenticato o errore auth', { authError })
      return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 })
    }

    logger.info('Utente autenticato', { userId: user.id })

    const { message, sessionId } = await req.json()
    logger.info('Payload ricevuto', { message, sessionId })

    if (!message || !sessionId) {
      logger.warn('Messaggio o sessione mancanti nel payload')
      return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    }

    const sessionObjectId = new ObjectId(sessionId)

    const embedding = await getEmbedding(message)
    logger.info('Embedding generato', { preview: embedding.slice(0, 5) })

    const userMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'user',
      content: message,
      embedding,
      createdAt: new Date().toISOString()
    })
    logger.info('Messaggio utente salvato', { userMessageId })

    const history = await getSessionHistoryMongo(sessionId, 5)

    const hybridResults = await searchHybridMongo(message, embedding, 10)
    const products: ProductItem[] = hybridResults.map(p => ({
      sku: p.sku,
      name: p.name,
      description: p.description,
      price: p.price,
      available: p.available,
      qty: p.qty,
      supplier: p.supplier,
      category_name: p.category_name,
      thumbnail: p.thumbnail,
      link: p.link,
      colore: p.colore,
      score: p.hybridScore
    }))
    logger.info('Prodotti trovati', { productsCount: products.length, skus: products.map(p => p.sku) })

    const aiResponse: ChatAIResponse = await generateChatResponse({
      message,
      products,
      contextMessages: history,
    })

    logger.info('Risposta AI generata', {
      intent: aiResponse.intent,
      nRecommended: aiResponse.recommended.length
    })

    const aiMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse.summary,
      recommended: aiResponse.recommended,
      intent: aiResponse.intent ?? 'suggestion',
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      entities: aiResponse.entities,
      createdAt: new Date().toISOString()
    })
    logger.info('Messaggio AI salvato', { aiMessageId })

    return NextResponse.json({
      summary: aiResponse.summary,
      recommended: aiResponse.recommended,
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      intent: aiResponse.intent ?? 'suggestion',
      entities: aiResponse.entities ?? []
    })
  } catch (err) {
    logger.error('Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
