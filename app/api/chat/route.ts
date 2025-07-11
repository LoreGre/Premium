import { NextResponse } from 'next/server'
import {
  saveMessage,
  findSimilarProducts,
  generateChatResponse,
  saveMessageProducts
} from '@/components/chat/chat-actions'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json()

    if (!message || !sessionId) {
      console.error('[API] Messaggio o sessione mancante')
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Recupera token Bearer dall'header Authorization
    const authHeader = req.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      console.error('[API] Token non trovato')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Recupera utente da token
    const { data, error } = await supabase.auth.getUser(accessToken)
    const user = data?.user

    if (error || !user) {
      console.error('[API] Errore nel recupero utente:', error?.message)
      return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 })
    }

    const userId = user.id

    // Cerca prodotti simili
    const { products, embedding, skus } = await findSimilarProducts(message)

    // Salva messaggio utente
    await saveMessage({
      sessionId,
      role: 'user',
      content: message,
      embedding,
      userId
    })

    // Genera risposta AI
    const response = await generateChatResponse(message, products) ?? ''

    // Salva messaggio AI
    const assistantMessageId = await saveMessage({
      sessionId,
      role: 'assistant',
      content: response,
      userId
    })

    // Salva prodotti suggeriti
    await saveMessageProducts(assistantMessageId, skus)

    return NextResponse.json({
      content: response,
      products
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('[API] ERRORE:', error.message, error.stack)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
