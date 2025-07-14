'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createChatSession } from './chat-actions'
import { ChatInput } from './chat-input'
import { ChatMessageItem } from './chat-message-item'
import { ProductBubble } from './chat-product-bubble'
import { sendChatMessage } from './chat-api'
import type { ChatMessage } from './types'

// Funzione di logging su Supabase
async function logChatMessage(message: ChatMessage, sessionId: string) {
  const supabase = createClient()
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    role: message.role,
    content: message.content,
    products: message.products ?? null,
    intent: message.intent ?? null,
    created_at: message.createdAt
  })
}

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const initSession = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        console.error('Utente non autenticato')
        return
      }

      const sessionId = await createChatSession(data.user.id)
      if (active) setSessionId(sessionId)
    }

    initSession()
    return () => { active = false }
  }, [])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return

    const timestamp = new Date().toISOString()

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: timestamp
    }

    setMessages((prev) => [...prev, userMessage])
    await logChatMessage(userMessage, sessionId)

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: 'Sto cercando i migliori prodotti per te...',
      createdAt: timestamp
    }

    setMessages((prev) => [...prev, loadingMessage])
    setIsLoading(true)

    try {
      const res = await sendChatMessage(text, sessionId)

      setMessages((prev) =>
        prev.filter((m) => m.id !== loadingMessage.id)
      )

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.content,
        products: res.products || undefined,
        intent: res.intent || undefined,
        createdAt: new Date().toISOString()
      }

      setMessages((prev) => [...prev, aiMessage])
      await logChatMessage(aiMessage, sessionId)

    } catch (err) {
      console.error(err)

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Ops! Qualcosa è andato storto. Riprova.',
        createdAt: new Date().toISOString()
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== loadingMessage.id),
        errorMessage
      ])
      await logChatMessage(errorMessage, sessionId)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Area scrollabile */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-40">
          {messages.map((msg) =>
            msg.products?.length ? (
              <ProductBubble key={msg.id} products={msg.products} />
            ) : (
              <ChatMessageItem key={msg.id} message={msg} />
            )
          )}
          <div ref={scrollRef} className="h-1" />
        </div>
      </div>

      {/* Input sempre in fondo al contenuto */}
      <div className="w-full border-t bg-background">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </>
  )
}
