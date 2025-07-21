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
import { logger } from '@/lib/logger'


export async function POST(req: Request) {

  try {
    const supabase = createAdminClient()

    // 1. Autenticazione utente
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

    // 2. Parsing payload
    const { message, sessionId } = await req.json()
    logger.info('Payload ricevuto', { message, sessionId })

    if (!message || !sessionId) {
      logger.warn('Messaggio o sessione mancanti nel payload')
      return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    }

    // 3. Embedding del messaggio
    const embedding = await getEmbedding(message)
    logger.info('Embedding generato', { preview: embedding.slice(0, 5) })

    // 4. Salva messaggio utente
    const userMessageId = await saveMessage({
      sessionId,
      userId: user.id,
      role: 'user',
      content: message,
      embedding,
      intent: null,
    })
    logger.info('Messaggio utente salvato', { userMessageId })

    // 5. Ricerca prodotti ibrida
    const hybridResults = await searchHybridFallback(message, 5)
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

    const skus = products.map(p => p.sku)
    logger.info('Prodotti trovati', { skus, productsCount: products.length })

    // 6. Genera risposta AI
    const aiResponse = await generateChatResponse(message, products)
    logger.info('Risposta AI generata', { aiResponse })

    // 7. Salva messaggio AI
    const aiMessageId = await saveMessage({
      sessionId,
      userId: user.id,
      role: 'assistant',
      content: aiResponse,
      intent: 'suggestion'
    })
    logger.info('Messaggio AI salvato', { aiMessageId })

    // 8. Salva prodotti associati
    await saveMessageProducts(aiMessageId, skus)
    logger.info('Prodotti associati salvati al messaggio AI', { aiMessageId, skus })

    // 9. Risposta finale
    return NextResponse.json({
      content: aiResponse,
      products,
      intent: 'suggestion'
    })
  } catch (err) {
    logger.error('Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
