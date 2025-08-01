import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { extractEntitiesLLM } from '@/components/chat/chat-exctract-entities'
import { saveMessageMongo } from '@/components/chat/chat-save'
import { handleChatProductSearch } from '@/components/chat/chat-route-handler'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth
    const { user } = auth

    const { message, sessionId } = await req.json()
    if (!message || !sessionId) return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    if (!ObjectId.isValid(sessionId)) throw new Error('ID di sessione non valido')
    const sessionObjectId = new ObjectId(sessionId)

    const entities = await extractEntitiesLLM(message)
    const {
      aiResponse,
      products,
      responseSource
    } = await handleChatProductSearch({ message, sessionId, sessionObjectId, userId: user.id, entities })

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

    return NextResponse.json({
      summary: aiResponse.summary,
      recommended: aiResponse.recommended,
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      intent: aiResponse.intent ?? 'suggestion',
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      _id: aiMessageId?.toString(),
      source: responseSource
    })
  } catch (err) {
    logger.error('[POST] Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
