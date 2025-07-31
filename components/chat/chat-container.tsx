'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createChatSession, getSessionHistoryMongo } from './chat-sessions'
import { ChatInput } from './chat-input'
import { ChatMessageItem } from './chat-message-item'
import { sendChatMessage } from './chat-api'
import type { UIMessage } from './types'

type ChatContainerProps = {
  sessionId?: string
}

export function ChatContainer({ sessionId: initialSessionId }: ChatContainerProps) {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null)
  const [authError, setAuthError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll automatico
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Caricamento messaggi se sessionId è fornito da props
  const [invalidSession, setInvalidSession] = useState(false)

  useEffect(() => {
    const loadMessages = async () => {
      if (!initialSessionId) return
      try {
        const rawMessages = await getSessionHistoryMongo(initialSessionId)
  
        if (!rawMessages || rawMessages.length === 0) {
          setInvalidSession(true)
          return
        }
  
        const uiMessages: UIMessage[] = rawMessages.map((msg) => ({
          ...msg,
          session_id: msg.session_id.toString(),
          _id: msg._id.toString(),
          _ui_id: `from-db-${msg._id.toString()}`,
        }))
  
        setMessages(uiMessages)
      } catch (err) {
        console.error('Errore nel caricamento dei messaggi:', err)
        setInvalidSession(true)
      }
    }
  
    loadMessages()
  }, [initialSessionId])
  
  

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    let currentSessionId = sessionId

    // Crea sessione SOLO al primo messaggio, se non esiste
    if (!currentSessionId) {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        setAuthError('⚠️ Utente non autenticato. Effettua il login.')
        return
      }

      currentSessionId = await createChatSession(data.user.id)
      setSessionId(currentSessionId)
    }

    const timestamp = new Date().toISOString()
    const uid = `${Date.now()}-${Math.random()}`

    const userMessage: UIMessage = {
      _ui_id: `user-${uid}`,
      session_id: currentSessionId,
      user_id: 'me',
      role: 'user',
      content: text,
      createdAt: timestamp
    }

    const loadingMessage: UIMessage = {
      _ui_id: `loading-${uid}`,
      session_id: currentSessionId,
      user_id: 'assistant',
      role: 'assistant',
      content: '',
      createdAt: timestamp,
      isTyping: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setIsLoading(true)

    try {
      const res = await sendChatMessage(text, currentSessionId)

      const aiMessage: UIMessage = {
        _ui_id: `ai-${uid}`,
        session_id: currentSessionId,
        user_id: 'assistant',
        role: 'assistant',
        content: res.summary,
        products: res.products,
        intent: res.intent,
        recommended: res.recommended,
        createdAt: new Date().toISOString(),
        _id: res._id,
        source: res.source 
      }

      setMessages(prev =>
        prev.filter(m => m._ui_id !== loadingMessage._ui_id).concat(aiMessage)
      )
    } catch (err) {
      console.error(err)

      const errorMessage: UIMessage = {
        _ui_id: `error-${uid}`,
        session_id: currentSessionId!,
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

          {invalidSession && (
            <div className="text-red-500 text-center py-4">
              ⚠️ La sessione specificata non esiste o è stata eliminata.
            </div>
          )}

          {messages.map(msg => (
            <ChatMessageItem key={msg._ui_id} message={msg} />
          ))}

          <div ref={scrollRef} className="h-1" />
        </div>
      </div>

      <div className="w-full border-t bg-background">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </>
  )
}
