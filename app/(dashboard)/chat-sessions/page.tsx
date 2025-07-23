'use client'

import { useEffect, useState } from 'react'
import { fetchChatSessions, deleteChatSession } from './actions'
import { useNotify } from '@/hooks/use-notify'
import { DataTableDynamic } from '@/components/table/data-table-dynamic'
import type { Row } from '@tanstack/react-table'

export type ChatSessionRow = {
  _id: string
  user_id: string
  email: string
  updatedAt: string
  firstMessage: string
}

const columnTypes = {
  email:        { type: 'email' as const },
  updatedAt:    { type: 'string' as const },
  firstMessage: { type: 'string' as const },
}

export default function ChatSessionsPage() {
  const { success, error } = useNotify()
  const [sessions, setSessions] = useState<ChatSessionRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
  
    fetchChatSessions()
      .then(data => { if (!cancelled) setSessions(data) })
      .catch(e => {
        console.error('Errore fetchChatSessions:', e)
        error('Errore', 'Impossibile caricare le sessioni chat')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
  
    return () => { cancelled = true }
  }, []) // solo array vuoto!  

  return (
    <main className="p-2">
      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
      ) : (
        <DataTableDynamic<ChatSessionRow>
          data={sessions}
          title="Sessioni Chat AI"
          columnTypes={columnTypes}
          // onEdit riceve Row<ChatSessionRow>, devi usare .original
          onEdit={(row: Row<ChatSessionRow>) =>
            window.location.assign(`/dashboard/chat/${row.original._id}`)
          }
          // onDelete riceve array di oggetti puri
          onDelete={async (rows: ChatSessionRow[]) => {
            try {
              await Promise.all(rows.map((row) => deleteChatSession(row._id)))
              setSessions(await fetchChatSessions())
              success('Sessione eliminata', 'Sessione rimossa')
            } catch (e) {
              console.error('Errore fetchChatSessions:', e)
              error('Errore', 'Impossibile eliminare una o più sessioni')
            }
          }}
        />
      )}
    </main>
  )
}