'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatMessageItem } from '@/components/chat/chat-message-item'
import type { ChatMessage } from '@/components/chat/types'

export default function DashboardPage() {
  const [messages] = useState<ChatMessage[]>(() =>
    Array.from({ length: 80 }).map((_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: i % 2 === 0
        ? `Messaggio utente numero ${i + 1}`
        : `Risposta dell'assistente numero ${i + 1}\n\nLorem ipsum dolor sit amet...`,
    }))
  )

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="relative h-full flex flex-col">
      {/* scroll SOLO qui */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-40">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} />
          ))}
          <div ref={scrollRef} className="h-1" />
        </div>
      </div>

      {/* FISSO in fondo al contenuto, non alla viewport */}
      <div className="w-full border-t bg-background">
        <ChatInput />
      </div>
    </div>
  )
}
