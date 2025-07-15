'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Eye, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from './types'

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  const products = message.products ?? []

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl p-4 mb-4',
          isUser
            ? 'bg-primary text-white rounded-br-none dark:bg-white dark:text-black'
            : 'bg-muted text-muted-foreground rounded-bl-none'
        )}
        title={message.createdAt ?? undefined}
      >
        {/* Testo messaggio */}
        <p className="whitespace-pre-line">{message.content}</p>

        {/* Orario */}
        {formattedTime && (
          <p className="text-[10px] mt-1 text-right opacity-60">{formattedTime}</p>
        )}

        {/* Prodotti suggeriti (solo se assistant) */}
        {!isUser && products.length > 0 && (
          <div className="mt-4 space-y-4">
            {products.map((product) => (
              <div
                key={product.sku}
                title={`SKU: ${product.sku}`}
                className="relative border rounded-xl p-4 flex items-start gap-4 bg-background shadow-sm"
              >
                <div className="flex-1 pr-20">
                  <div className="flex gap-4">
                    <Image
                      src={product.thumbnail || '/placeholder.png'}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(product.price ?? 0).toFixed(2)} € · {product.supplier}
                      </p>
                      <p className="text-xs mt-1 text-green-600">
                        {product.available ? 'Disponibile' : 'Non disponibile'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 flex flex-row gap-1">
                  {product.link && (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 bg-background/70 backdrop-blur-sm border border-border"
                        aria-label="Vedi prodotto"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button
                    size="icon"
                    className="w-8 h-8 border border-border"
                    onClick={() => {
                      console.log(`Aggiunto ${product.sku}`)
                    }}
                    aria-label="Aggiungi al carrello"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
