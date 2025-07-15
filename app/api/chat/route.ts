import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbedding } from '@/components/chat/chat-embedding'
import {
  saveMessage,
  generateChatResponse,
  saveMessageProducts
} from '@/components/chat/chat-actions'
import { searchHybridFallback } from '@/components/chat/chat-actions'

import type { ProductItem } from '@/components/chat/types'

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient()

    // 1. Autenticazione utente
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.log('Token mancante')
      return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log('Utente non autenticato o errore auth:', authError)
      return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 })
    }
    console.log('Utente autenticato:', user.id)

    // 2. Parsing payload
    const { message, sessionId } = await req.json()
    console.log('Payload ricevuto:', { message, sessionId })

    if (!message || !sessionId) {
      console.log('Messaggio o sessione mancanti nel payload')
      return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    }

    // 3. Embedding del messaggio
    const embedding = await getEmbedding(message)
    console.log('Embedding generato (preview):', embedding.slice(0, 5))

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

    // 5. Ricerca prodotti ibrida
    const hybridResults = await searchHybridFallback(message, 5)
    const products: ProductItem[] = hybridResults.map(p => ({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      colore: p.colore || '',
      price: 0,
      available: true,
      supplier: '',
      thumb_url: ''
    }))
    const skus = products.map(p => p.sku)
    console.log('Prodotti trovati:', products)
    console.log('SKU prodotti:', skus)

    // 6. Genera risposta AI
    const aiResponse = await generateChatResponse(message, products)
    console.log('Risposta AI generata:', aiResponse)

    // 7. Salva messaggio AI
    const aiMessageId = await saveMessage({
      sessionId,
      userId: user.id,
      role: 'assistant',
      content: aiResponse,
      intent: 'suggestion'
    })
    console.log('Messaggio AI salvato con ID:', aiMessageId)

    // 8. Salva prodotti associati
    await saveMessageProducts(aiMessageId, skus)
    console.log('Prodotti associati salvati al messaggio AI')

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
