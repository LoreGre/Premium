import { createClient } from '@/lib/supabase/client'
import type { ProductItem } from './types'

/**
 * Ritorna la risposta AI e i prodotti consigliati dalla chat
 */
type ChatApiResponse = {
  summary: string
  recommended: { sku: string; reason: string }[]
  products: ProductItem[]
  intent?: string
}

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatApiResponse> {
  // AUTH con Supabase
  const supabase = createClient()
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Utente non autenticato')
  }

  // CHIAMATA API
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ message, sessionId })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Errore API ${res.status}: ${errorText}`)
  }

  let data: ChatApiResponse
  try {
    data = await res.json()
  } catch {
    throw new Error('Risposta JSON non valida dalla API')
  }

  // Validazione: deve esserci almeno un summary
  if (!data.summary) {
    throw new Error('La risposta della chat è vuota')
  }

  return {
    summary: data.summary,
    recommended: data.recommended || [],
    products: data.products || [],
    intent: data.intent
  }
}
