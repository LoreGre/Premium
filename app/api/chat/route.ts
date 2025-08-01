import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { extractEntitiesLLM } from '@/components/chat/chat-exctract-entities'
import { saveMessageMongo } from '@/components/chat/chat-save'
import { handleChatProductSearch } from '@/components/chat/chat-route-handler'
import { buildEmbeddingText } from '@/components/chat/chat-build-embedding'
import { getEmbedding } from '@/components/chat/chat-get-embedding'
import { getSessionHistoryMongo } from '@/components/chat/chat-sessions'
import { detectContextShift } from '@/components/chat/chat-detect-context'
import { SaveChatMessageParams } from '@/components/chat/chat-save'
import { fallbackContextShift } from '@/components/chat/chat-fallback'
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

    // 🔍 Estrai entità
    const entities = await extractEntitiesLLM(message)

    // 🔁 Carica history PRIMA di salvare il messaggio corrente
    const history = await getSessionHistoryMongo(sessionId, 5)

    // ✏️ Costruisci embedding
    const embeddingText = buildEmbeddingText(message, entities)
    const embedding = await getEmbedding(embeddingText)

    // ✅ Logica context shift ora corretta
    const contextShifted = detectContextShift(history, entities)
    if (contextShifted) {
      logger.warn('[ChatHandler] Context shift rilevato – attivo fallback')

      const aiResponse = await fallbackContextShift({
        message,
        embedding,
        history,
        entities
      })

      // Salva risposta fallback come assistant
      const aiMessageId = await saveMessageMongo({
        session_id: sessionObjectId,
        user_id: user.id,
        role: 'assistant',
        content: aiResponse.summary,
        intent: aiResponse.intent ?? 'clarify',
        products: [],
        entities: aiResponse.entities ?? [],
        createdAt: new Date().toISOString(),
        source: 'fallback-context-shift'
      })

      return NextResponse.json({
        summary: aiResponse.summary,
        products: [],
        intent: aiResponse.intent ?? 'clarify',
        entities: aiResponse.entities ?? [],
        _id: aiMessageId?.toString(),
        source: 'fallback-context-shift'
      })
    }

    // 💾 Salva messaggio utente
    const messageData: SaveChatMessageParams = {
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'user',
      content: message,
      embedding,
      entities,
      createdAt: new Date().toISOString(),
    }
    await saveMessageMongo(messageData)

    // 🤖 Genera risposta AI
    const {
      aiResponse,
      responseSource
    } = await handleChatProductSearch({
      message,
      sessionId,
      sessionObjectId,
      userId: user.id,
      entities,
      embedding
    })
    logger.debug('Risposta AI', { aiResponse })

    // 💾 Salva risposta AI
    const aiMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse.summary,
      intent: aiResponse.intent ?? 'suggestion',
      products: aiResponse.products,
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      createdAt: new Date().toISOString()
    })

    logger.debug('Messaggio AI salvato', { aiMessageId })

    // ✅ Risposta JSON al client
    return NextResponse.json({
      summary: aiResponse.summary,
      products: aiResponse.products,
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
