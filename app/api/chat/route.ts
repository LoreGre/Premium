import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { getEmbedding } from '@/components/chat/chat-embedding'
import {
  saveMessageMongo,
  generateChatResponse,
  getSessionHistoryMongo,
  getProductsByEntitiesAI
} from '@/components/chat/chat-actions'
import type { ChatAIResponse } from '@/components/chat/types'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    // AUTH PROTEZIONE
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth
    const { user } = auth

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

    const { products } = await getProductsByEntitiesAI(message, embedding, 10)
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
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      createdAt: new Date().toISOString()
    })
    logger.info('Messaggio AI salvato', { aiMessageId })

    return NextResponse.json({
      summary: aiResponse.summary,
      recommended: aiResponse.recommended,
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      intent: aiResponse.intent ?? 'suggestion',
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      _id: aiMessageId?.toString()
    })
  } catch (err) {
    logger.error('Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
