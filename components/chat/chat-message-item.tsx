import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Eye, ShoppingCart, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UIMessage } from './types'

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0s]" />
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
    </div>
  )
}

function FallbackNotice({ source }: { source: string }) {
  const fallbackMessages: Record<string, string> = {
    'fallback-no-entities': 'Non ho capito bene. Puoi specificare meglio cosa stai cercando?',
    'fallback-no-products': 'Nessun prodotto trovato con queste caratteristiche.',
    'fallback-context-shift': 'Hai cambiato argomento. Ti consiglio di aprire una nuova chat.',
    'fallback-no-intent': 'Vuoi un consiglio, un confronto o delle informazioni?'
  }
  const msg = fallbackMessages[source] ?? null
  if (!msg) return null

  return (
    <div className="mt-4 text-sm text-yellow-900 bg-yellow-100 border border-yellow-300 rounded-xl px-4 py-3">
      ⚠️ {msg}
    </div>
  )
}

export function ChatMessageItem({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'

  const initial =
    message.feedback?.rating === 'positive'
      ? 'positive'
      : message.feedback?.rating === 'negative'
      ? 'negative'
      : undefined

  const [feedback, setFeedback] = useState<'positive' | 'negative' | undefined>(initial)

  const supabase = createClient()

  const products = message.products ?? []
  const reasons: Record<string, string> =
    message.recommended?.reduce((acc, rec) => {
      acc[rec.sku] = rec.reason
      return acc
    }, {} as Record<string, string>) || {}

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    setFeedback(rating)

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        console.error('Utente non autenticato per feedback')
        return
      }

      const res = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messageId: message._id,
          rating,
          comment: ''
        })
      })

      if (!res.ok) {
        console.error('Errore nel salvataggio del feedback')
      }
    } catch (error) {
      console.error('Errore di rete nel feedback', error)
    }
  }

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
        {message.isTyping ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-line">{message.content}</p>
        )}

        {message.intent === 'clarify' && (!message.recommended || message.recommended.length === 0) && (
          <FallbackNotice source={message.source ?? ''} />
        )}

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
                        {(product.unit_price ?? 0).toFixed(2)} € · {product.supplier}
                      </p>
                      {product.size && (
                        <p className="text-xs text-muted-foreground">
                          Taglia: <span className="font-medium">{product.size}</span>
                        </p>
                      )}
                      <p className={cn(
                        'text-xs mt-1 font-medium',
                        (product.qty ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        ({product.qty ?? 0}) {(product.qty ?? 0) > 0 ? 'Disponibile' : 'Non disponibile'}
                      </p>
                      {reasons[product.sku] && (
                        <p className="text-xs mt-1 text-blue-700 italic">
                          <span className="font-semibold">Motivo:</span> {reasons[product.sku]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 flex flex-row gap-1">
                  {product.link && (
                    <a href={product.link} target="_blank" rel="noopener noreferrer">
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
                    onClick={() => console.log(`Aggiunto ${product.sku}`)}
                    aria-label="Aggiungi al carrello"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isUser && !message.isTyping && (
          <div className="flex gap-2 mt-2 items-center">
            {!feedback ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-green-100"
                  aria-label="Feedback positivo"
                  onClick={() => handleFeedback('positive')}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-red-100"
                  aria-label="Feedback negativo"
                  onClick={() => handleFeedback('negative')}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <span className="text-xs opacity-70 pl-1">
                {feedback === 'positive' ? 'Grazie per il feedback 👍' : 'Grazie per il feedback 👎'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}