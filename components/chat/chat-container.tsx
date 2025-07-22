'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createChatSession } from './chat-actions'
import { ChatInput } from './chat-input'
import { ChatMessageItem } from './chat-message-item'
import { sendChatMessage } from './chat-api'
import type { ChatMessage } from './types'

// Tipo locale per il client
export type UIMessage = Omit<ChatMessage, 'session_id'> & {
  session_id: string
  _ui_id: string
}

export function ChatContainer() {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll automatico
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Inizializzazione sessione
  useEffect(() => {
    const supabase = createClient()
    let active = true

    const initSession = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        console.error('Utente non autenticato')
        setAuthError('⚠️ Utente non autenticato. Effettua il login.')
        return
      }

      const newSessionId = await createChatSession(data.user.id)
      if (active) setSessionId(newSessionId)
    }

    initSession()
    return () => { active = false }
  }, [])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return

    const timestamp = new Date().toISOString()
    const uid = `${Date.now()}-${Math.random()}`

    const userMessage: UIMessage = {
      _ui_id: `user-${uid}`,
      session_id: sessionId,
      user_id: 'me',
      role: 'user',
      content: text,
      createdAt: timestamp
    }

    const loadingMessage: UIMessage = {
      _ui_id: `loading-${uid}`,
      session_id: sessionId,
      user_id: 'assistant',
      role: 'assistant',
      content: 'Sto cercando i migliori prodotti per te...',
      createdAt: timestamp
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setIsLoading(true)

    try {
      const res = await sendChatMessage(text, sessionId)

      const aiMessage: UIMessage = {
        _ui_id: `ai-${uid}`,
        session_id: sessionId,
        user_id: 'assistant',
        role: 'assistant',
        content: res.summary,
        products: res.products,
        intent: res.intent,
        recommended: res.recommended,
        createdAt: new Date().toISOString()
      }

      setMessages(prev =>
        prev.filter(m => m._ui_id !== loadingMessage._ui_id).concat(aiMessage)
      )
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

      setMessages(prev =>
        prev.filter(m => m._ui_id !== loadingMessage._ui_id).concat(errorMessage)
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-40">
          {authError && (
            <div className="text-red-500 text-center">{authError}</div>
          )}

          {messages.map(msg => (
            <ChatMessageItem key={msg._ui_id} message={msg} />
          ))}

          <div ref={scrollRef} className="h-1" />
        </div>
      </div>

      <div className="w-full border-t bg-background">
        {sessionId ? (
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        ) : (
          <div className="p-4 text-center text-gray-500">
            {authError || 'Caricamento sessione...'}
          </div>
        )}
      </div>
    </>
  )
}
