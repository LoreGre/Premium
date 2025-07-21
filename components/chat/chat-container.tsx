'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createChatSession } from './chat-actions'
import { ChatInput } from './chat-input'
import { ChatMessageItem } from './chat-message-item'
import { sendChatMessage } from './chat-api'
import type { ChatMessage } from './types'

// Tipo che estende ChatMessage solo per gestire key React
type UIMessage = ChatMessage & { _ui_id: string }

export function ChatContainer() {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll sempre in fondo ai messaggi
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Init sessione chat all'avvio (con userId auth Supabase)
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
    const uid = `${Date.now()}-${Math.random()}`

    // Messaggio utente (solo per UI/React)
    const userMessage: UIMessage = {
      _ui_id: `user-${uid}`,
      session_id: sessionId,
      user_id: 'me',
      role: 'user',
      content: text,
      createdAt: timestamp
    }

    setMessages((prev) => [...prev, userMessage])

    // Messaggio di loading AI (solo per UI)
    const loadingMessage: UIMessage = {
      _ui_id: `loading-${uid}`,
      session_id: sessionId,
      user_id: 'assistant',
      role: 'assistant',
      content: 'Sto cercando i migliori prodotti per te...',
      createdAt: timestamp
    }

    setMessages((prev) => [...prev, loadingMessage])
    setIsLoading(true)

    try {
      const res = await sendChatMessage(text, sessionId)
      // res: { summary, recommended, products, intent }

      setMessages((prev) =>
        prev.filter((m) => m._ui_id !== loadingMessage._ui_id)
      )

      const aiMessage: UIMessage = {
        _ui_id: `ai-${uid}`,
        session_id: sessionId,
        user_id: 'assistant',
        role: 'assistant',
        content: res.summary,
        products: res.products || undefined,
        intent: res.intent || undefined,
        recommended: res.recommended || undefined,
        createdAt: new Date().toISOString()
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error(err)

      const errorMessage: UIMessage = {
        _ui_id: `error-${uid}`,
        session_id: sessionId,
        user_id: 'assistant',
        role: 'assistant',
        content: '⚠️ Ops! Qualcosa è andato storto. Riprova.',
        createdAt: new Date().toISOString()
      }

      setMessages((prev) => [
        ...prev.filter((m) => m._ui_id !== loadingMessage._ui_id),
        errorMessage
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
          {messages.map((msg) => (
            <ChatMessageItem key={msg._ui_id} message={msg} />
          ))}
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
