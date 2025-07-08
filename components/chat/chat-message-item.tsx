'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatMessage } from './types'

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl p-4 mb-4',
          isUser
            ? 'bg-primary text-white rounded-br-none dark:bg-white dark:text-black'
            : 'bg-muted text-muted-foreground rounded-bl-none'
        )}
      >
        <p className="whitespace-pre-line">{message.content}</p>

        {(message.products?.length ?? 0) > 0 && (
            <div className="mt-4 space-y-4">
            {(message.products ?? []).map((product) => (
              <div
                key={product.sku}
                className="border rounded-xl p-4 flex items-center gap-4 bg-background shadow-sm"
              >
                <Image
                  src={product.thumb_url}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.price.toFixed(2)} € · {product.supplier}
                  </p>
                  <p className="text-xs mt-1 text-green-600">
                    {product.available ? 'Disponibile' : 'Non disponibile'}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  ➕ Aggiungi
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}