import { createClient } from '@/lib/supabase/client'
import type { ChatSessionRow } from './page'

const supabase = createClient()

export async function fetchChatSessions(): Promise<ChatSessionRow[]> {
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) throw new Error(`Errore Supabase: ${sessionError.message}`)
  if (!data.session) throw new Error('Sessione utente non trovata')

  const token = data.session.access_token

  const res = await fetch('/api/chats', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    let errorMsg = `Errore caricamento sessioni (${res.status})`
    try {
      const errData = await res.json()
      errorMsg += `: ${errData?.error || JSON.stringify(errData)}`
    } catch (parseError) {
      const fallbackText = await res.text().catch(() => 'Risposta non leggibile')
      errorMsg += `: ${fallbackText}`
    }
    console.error('❌ fetchChatSessions error:', errorMsg)
    throw new Error(errorMsg)
  }

  return res.json()
}

export async function deleteChatSession(id: string): Promise<void> {
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) throw new Error(sessionError.message)
  if (!data.session) throw new Error('Sessione non trovata')

  const token = data.session.access_token

  const res = await fetch(`/api/chats/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`❌ Errore eliminazione sessione (${res.status}):`, errText)
    throw new Error(`Errore eliminazione sessione (${res.status})`)
  }
}
