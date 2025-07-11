import type { ProductItem } from './types'

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<{
  content: string
  products?: ProductItem[]
}> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
