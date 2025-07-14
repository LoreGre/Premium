import { createClient } from '@/lib/supabase/client'
import type { ProductItem } from './types'

type ChatApiResponse = {
  content: string
  products?: ProductItem[]
  intent?: string
}

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatApiResponse> {
  const supabase = createClient()

  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Utente non autenticato')
  }

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

  if (!data.content) {
    throw new Error('La risposta della chat è vuota')
  }

  return {
    content: data.content,
    products: data.products || [],
    intent: data.intent
  }
}
