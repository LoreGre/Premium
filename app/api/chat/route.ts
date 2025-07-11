import { NextResponse } from 'next/server'
import {
  saveMessage,
  findSimilarProducts,
  generateChatResponse,
  saveMessageProducts
} from '@/components/chat/chat-actions'

export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    // Trova prodotti simili (embedding + query)
    const { products, embedding, skus } = await findSimilarProducts(message)

    // Salva messaggio utente
    await saveMessage({
      sessionId,
      role: 'user',
      content: message,
      embedding
    })

    // Genera risposta AI
    const response = await generateChatResponse(message, products) ?? ''

    // Salva risposta AI
    const assistantMessageId = await saveMessage({
        sessionId,
        role: 'assistant',
        content: response
    })

    // Salva prodotti associati alla risposta
    await saveMessageProducts(assistantMessageId, skus)

    return NextResponse.json({
      content: response,
      products
    })
} catch (err) {
    console.error('Errore API Chat:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
