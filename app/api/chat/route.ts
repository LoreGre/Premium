import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbedding } from '@/components/chat/chat-embedding'
import {
    saveMessage,
    findSimilarProductsMongo,
    generateChatResponse,
    saveMessageProducts
  } from '@/components/chat/chat-actions'

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient()

    // 1. Autenticazione utente
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 })
    }

    // 2. Parsing payload
    const { message, sessionId } = await req.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    }

    // 3. Embedding del messaggio
    const embedding = await getEmbedding(message)

    // 4. Salva messaggio utente
    const userMessageId = await saveMessage({
      sessionId,
      userId: user.id,
      role: 'user',
      content: message,
      embedding,
      intent: null,
    })
    console.log('Messaggio utente salvato con ID:', userMessageId)

    // 5. Cerca prodotti simili su MongoDB
    const { products, skus } = await findSimilarProductsMongo(message, 5)

    // 6. Genera risposta AI
    const aiResponse = await generateChatResponse(message, products)

    // 7. Salva messaggio AI
    const aiMessageId = await saveMessage({
      sessionId,
      userId: user.id,
      role: 'assistant',
      content: aiResponse,
      intent: 'suggestion', // placeholder, da classifier futuro
    })

    // 8. Salva prodotti associati
    await saveMessageProducts(aiMessageId, skus)

    // 9. Risposta finale
    return NextResponse.json({
      content: aiResponse,
      products,
      intent: 'suggestion'
    })
  } catch (err) {
    console.error('Errore in /api/chat:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
