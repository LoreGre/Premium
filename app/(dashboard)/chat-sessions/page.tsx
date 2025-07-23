'use client'

import { useEffect, useRef, useState } from 'react'
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
  updatedAt:    { type: 'dateTime' as const, label: 'Data' },
  firstMessage: { type: 'string' as const, label: 'Messaggio' },
  products:      { type: 'list' as const, label: 'Prodotti' },
}

export default function ChatSessionsPage() {
  const { success, error } = useNotify()
  const errorRef = useRef(error)
  errorRef.current = error

  const [sessions, setSessions] = useState<ChatSessionRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
  
    fetchChatSessions()
      .then(data => { if (!cancelled) setSessions(data) })
      .catch(e => {
        console.error('Errore fetchChatSessions:', e)
        errorRef.current('Errore', 'Impossibile caricare le sessioni chat')
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
          title="Sessioni"
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