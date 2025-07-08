'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatMessageItem } from '@/components/chat/chat-message-item'
import { ProductBubble } from '@/components/chat/chat-product-bubble'
import type { ChatMessage } from '@/components/chat/types'
import type { ProductItem } from '@/components/chat/types'

const mockProducts: ProductItem[] = [
  {
    sku: '0139_S10',
    name: '0139 Agenda Giornaliera Fustellata',
    thumb_url: 'https://www.silanpromozioni.com/media/catalog/product/0/1/0139_s10.jpg',
    price: 1.85,
    supplier: 'silan',
    available: true,
    link: 'https://www.silanpromozioni.com/0139-agenda.html'
  },
  {
    sku: '0139_S20',
    name: '0139 Agenda Giornaliera Fustellata',
    thumb_url: 'https://www.silanpromozioni.com/media/catalog/product/0/1/0139_s20.jpg',
    price: 1.85,
    supplier: 'silan',
    available: true,
    link: 'https://www.silanpromozioni.com/0139-agenda.html'
  }
]

export default function DashboardPage() {
  const [messages] = useState<ChatMessage[]>(() =>
    Array.from({ length: 20 }).map((_, i) => {
      const isUser = i % 2 === 0
      const isProductMessage = !isUser && i % 4 === 1
    
      return {
        id: `msg-${i}`,
        role: isUser ? 'user' : 'assistant',
        content: isUser
          ? `Messaggio utente numero ${i + 1}`
          : isProductMessage
          ? ''
          : `Risposta dell'assistente numero ${i + 1}`,
        products: isProductMessage ? mockProducts : undefined
      } as ChatMessage
    })    
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

      {/* FISSO in fondo al contenuto, non alla viewport */}
      <div className="w-full border-t bg-background">
        <ChatInput />
      </div>
    </div>
  )
}
