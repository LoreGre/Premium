// app/(dashboard)/dashboard/[id]/page.tsx

'use client'

import { useParams } from 'next/navigation'
import { ChatContainer } from '@/components/chat/chat-container'

export default function ChatPage() {
  const { id } = useParams()

  if (!id || typeof id !== 'string') {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        ⚠️ ID sessione mancante o non valido.
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <ChatContainer sessionId={id} />
    </div>
  )
}
