import { createClient } from '@/lib/supabase/client'
import type { ProductItem } from './types'

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<{
  content: string
  products?: ProductItem[]
}> {
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
    throw new Error(`Errore API: ${res.statusText}`)
  }

  const data = await res.json()

  return {
    content: data.content,
    products: data.products || []
  }
}
