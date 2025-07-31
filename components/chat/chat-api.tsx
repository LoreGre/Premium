import { createClient } from '@/lib/supabase/client'
import type { ChatApiResponse } from './types'

type ChatApiRequest = {
  message: string
  sessionId: string
}

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatApiResponse> {
  // Auth Supabase
  const supabase = createClient()
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Utente non autenticato')
  }

  const requestPayload: ChatApiRequest = { message, sessionId }

  let data: ChatApiResponse | null = null

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(requestPayload)
    })

    if (!res.ok) {
      const errorDetail = await res.text()
      throw new Error(`Errore API ${res.status}: ${errorDetail}`)
    }

    data = await res.json()
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Errore nella richiesta o nella risposta della chat'
    )
  }

  // Validazione minima della risposta
  if (!data || !data.summary || typeof data.summary !== 'string') {
    throw new Error('La risposta della chat è vuota o non valida')
  }

  return {
    summary: data.summary,
    recommended: Array.isArray(data.recommended) ? data.recommended : [],
    products: Array.isArray(data.products) ? data.products : [],
    intent: data.intent,
    _id: data._id,
    source: data.source
  }
}
