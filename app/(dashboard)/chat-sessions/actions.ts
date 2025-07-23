import { createClient } from '@/lib/supabase/client'
import type { ChatSessionRow } from './page'

const supabase = createClient()

export async function fetchChatSessions(): Promise<ChatSessionRow[]> {
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) throw new Error(sessionError.message)
  if (!data.session) throw new Error('Sessione non trovata')

  const token = data.session.access_token

  const res = await fetch('/api/chat-sessions', {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) throw new Error('Errore caricamento sessioni')
  return res.json()
}

export async function deleteChatSession(id: string): Promise<void> {
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) throw new Error(sessionError.message)
  if (!data.session) throw new Error('Sessione non trovata')

  const token = data.session.access_token

  const res = await fetch(`/api/chat-sessions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) throw new Error('Errore eliminazione sessione')
}
