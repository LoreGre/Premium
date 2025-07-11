'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createChatSession } from './chat-actions'
import { ChatInput } from './chat-input'
import { ChatMessageItem } from './chat-message-item'
import { ProductBubble } from './chat-product-bubble'
import { sendChatMessage } from './chat-api'
import type { ChatMessage } from './types'

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
  
    return () => {
      active = false
    }
  }, [])  

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return

    // Aggiunge messaggio utente
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    }
    setMessages((prev) => [...prev, userMessage])

    // Mostra placeholder mentre carica
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: 'Sto cercando i migliori prodotti per te...'
    }
    setMessages((prev) => [...prev, loadingMessage])
    setIsLoading(true)

    try {
      const res = await sendChatMessage(text, sessionId)

      // Rimuove loading
      setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id))

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.content,
        products: res.products || undefined
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== loadingMessage.id),
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Ops! Qualcosa è andato storto. Riprova.'
        }
      ])
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
