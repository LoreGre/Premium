# Chat Snapshot - Gio 31 Lug 2025 14:59:45 CEST

## Directory tree (./components/chat/)

./components/chat/
├── chat-api.tsx
├── chat-build-embedding.tsx
├── chat-container.tsx
├── chat-detect-context.ts
├── chat-exctract-entities.tsx
├── chat-fallback.ts
├── chat-feedback.ts
├── chat-get-embedding.tsx
├── chat-get-products.ts
├── chat-input.tsx
├── chat-message-item.tsx
├── chat-response.ts
├── chat-save.ts
├── chat-search-mongo.ts
├── chat-sessions.ts
└── types.ts

1 directory, 16 files

## File list & contents (.ts/.tsx only)


---
### ./components/chat/chat-container.tsx

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
        _id: res._id
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

---
### ./components/chat/chat-search-mongo.ts

'use server'

import { getMongoCollection } from '@/lib/mongo/client'
import type { ProductItem } from './types'
import { logger } from '@/lib/logger'

export async function vectorMongoSearch(
  embedding: number[],
  limit = 10
): Promise<ProductItem[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')
  
    const pipeline = [
      {
        $vectorSearch: {
          index: 'prodotti_vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          sku: 1,
          name: 1,
          description: 1,
          thumbnail: 1,
          color: 1,
          size: 1,
          supplier: 1,
          category_name: 1,
          unit_price: 1,
          qty: 1,
          score: 1
        }
      }
    ]
  
    const results = await prodotti.aggregate<ProductItem>(pipeline).toArray()
  
    logger.info('[vectorMongoSearch] Risultati vector search', {
      count: results.length
    })
  
    return results
  }
---
### ./components/chat/chat-detect-context.ts

import type { ChatMessage, ExtractedEntity } from './types'

export function detectContextShift(history: ChatMessage[], currentEntities: ExtractedEntity[]): boolean {
    const currentTerms = new Set(
      currentEntities.filter(e => e.type === 'terms').flatMap(e => e.value as string[])
    )
  
    const pastTerms = new Set(
      history.flatMap(m =>
        m.role === 'user'
          ? (m.entities ?? [])
              .filter(e => e.type === 'terms')
              .flatMap(e => e.value as string[])
          : []
      )
    )
  
    const overlap = [...currentTerms].filter(term => pastTerms.has(term))
    return overlap.length === 0 && currentTerms.size > 0 && pastTerms.size > 0
  }
  
---
### ./components/chat/chat-exctract-entities.tsx

'use server'

import { OpenAI } from 'openai'
import type { ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

export async function extractEntitiesLLM(text: string): Promise<ExtractedEntity[]> {
  const prompt = `
Estrai entità strutturate dalla frase utente seguente, interpretando correttamente anche forme al plurale, femminili, abbreviate o colloquiali (es. "rosse", "10 pezzi", "XL", "midocean", "bluette").

L'obiettivo è identificare con precisione i concetti chiave rilevanti per la ricerca nel catalogo prodotti.

📌 NOTA IMPORTANTE:
- L'entità **terms** è una lista di parole o frasi chiave che rappresentano ciò che l'utente vuole trovare (es. "borraccia", "zaino trekking", "penna personalizzata"). Verranno usate come query testuale o semantica nei campi \`name\`, \`description\` e \`category_name\`.
- Non includere aggettivi o caratteristiche tecniche nei \`terms\`. Questi devono essere inseriti nell'entità **attributes** (es. "termica", "colorata", "resistente").

🧠 ENTITÀ SUPPORTATE:
- \`sku\`: codice prodotto (es. "MO8422", "5071", "AR1010")
- \`quantity\`: quantità richiesta o minima (es. "10", "almeno 100", "10 pezzi", "una cinquantina")
- \`color\`: colore rilevante (es. "rosso", "blu", "rosse", "rosa acceso", "bluette")
- \`size\`: taglia (es. "S", "M", "L", "XL", "extra large")
- \`supplier\`: nome del fornitore o marchio (es. "MidOcean", "GiftLine")
- \`terms\`: array di keyword utili per la ricerca testuale e semantica nei campi \`name\`, \`description\`, \`category_name\`
- \`attributes\`: array di attributi, aggettivi o caratteristiche rilevanti non centrali (es. "resistente", "leggero", "con filtro"), da usare in \`description\`
- \`other\`: qualsiasi altra informazione utile strutturata non compresa sopra

📦 ESEMPIO schema database (MongoDB collection "prodotti"):
{
  "_id": {
    "$oid": "6888f71d3a3162e53a9712e8"
  },
  "sku": "AR1249-16",
  "name": "Bussola nautica",
  "description": "Bussola nautica in alluminio in confezione di latta.",
  "supplier": "MidOcean",
  "category_name": [
    "Ufficio & Scrittura",
    "Accessori ufficio",
    "Luci da tavolo"
  ],
  "thumbnail": "https://cdn1.midocean.com/image/700X700/ar1249-16.jpg",
  "link": "",
  "qty": 2858,
  "unit_price": 3.68,
  "content_hash": "bb42544494b0139f922b314597fb7d9184e7e9389f6d3903d045476fdd9dc1e4",
  "embedding": [
    -0.024253117, 0.0013268577, 0.046131495, ...
	....
  ],
  "ToUpdate": 0,
  "color": "Argento",
  "size": ""
}

🧾 FORMAT OUTPUT:
Devi rispondere **solo** con un oggetto JSON valido, come questo:
{
  "entities": [
    { "type": "sku", "value": "MO8422" },
    { "type": "color", "value": "blu" },
    { "type": "terms", "value": ["penna", "blu"] },
    { "type": "attributes", "value": ["resistente", "impermeabile", "termico", "leggero"] },
    { "type": "quantity", "value": 100 }
  ]
}

✅ ESEMPI:

Input: "Vorrei 100 penne blu MO8422"
Output:
{
  "entities": [
    { "type": "quantity", "value": 100 },
    { "type": "color", "value": "blu" },
    { "type": "sku", "value": "MO8422" },
    { "type": "terms", "value": ["penne", "blu"] }
  ]
}

Input: "Cerco una borraccia termica resistente"
Output:
{
  "entities": [
    { "type": "terms", "value": ["borraccia"] },
    { "type": "attributes", "value": ["termica", "resistente"] }
  ]
}

Input: "Avete prodotti di MidOcean taglia L?"
Output:
{
  "entities": [
    { "type": "supplier", "value": "MidOcean" },
    { "type": "size", "value": "L" }
  ]
}

🧑‍💼 Frase utente:
"""
${text}
"""
`.trim()

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Sei un estrattore di entità strutturate. Rispondi sempre e solo con JSON valido nel formato richiesto.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    max_tokens: 800
  })

  const content = res.choices?.[0]?.message?.content
  logger.info('[extractEntitiesLLM] Raw response content', { content })

  if (!content) throw new Error('Risposta LLM vuota')

  try {
    const parsed = JSON.parse(content)
    if (!parsed.entities || !Array.isArray(parsed.entities)) throw new Error('Formato entità non valido')
    logger.info('[extractEntitiesLLM] Entità estratte con successo', {
      input: text,
      entities: parsed.entities
    })
    return parsed.entities as ExtractedEntity[]
  } catch (err) {
    logger.error('Parsing fallito in [extractEntitiesLLM]', {
      input: text,
      content,
      error: err
    })
    return []
  }
}

---
### ./components/chat/chat-fallback.ts

// chat-fallback.ts

'use server'

import { OpenAI } from 'openai'
import type { ChatMessage, ExtractedEntity, ChatAIResponse } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

type FallbackParams = {
  message: string
  embedding?: number[]
  history?: ChatMessage[]
  entities?: ExtractedEntity[]
}

// 🔁 Nessuna entità estratta
export async function fallbackNoEntities(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, history } = params

  const lastTurns = (history ?? [])
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => `- ${m.content}`)
    .join('\n')

  const prompt = `
L'utente ha inviato il seguente messaggio:
"${message}"

Negli ultimi messaggi ha detto:
${lastTurns || '— (nessun messaggio precedente rilevante) —'}

Non sono state rilevate entità strutturate. L'obiettivo è:
- Chiedere chiarimenti utili per identificare ciò che cerca
- Non suggerire prodotti generici a caso
- Restituire una risposta breve e gentile che stimoli l'utente a specificare meglio

Rispondi in questo formato JSON:
{
  "summary": "...",
  "recommended": [],
  "intent": "clarify",
  "entities": []
}`.trim()

  return await getLLMResponse(prompt)
}

// ❌ Entità presenti ma nessun prodotto trovato
export async function fallbackNoProducts(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, entities, history } = params

  const prompt = `
Messaggio utente:
"${message}"

Entità trovate:
${JSON.stringify(entities ?? [])}

Contesto precedente:
${
    (history ?? [])
      .filter(m => m.role === 'user')
      .slice(-1)
      .map(m => `- ${m.content}`)
      .join('\n') || '—'}

Obiettivo:
- Informare l'utente che al momento non ci sono prodotti compatibili
- Eventualmente suggerire di modificare quantità, colori o tipo prodotto
- Restituire una risposta strutturata come JSON:

{
  "summary": "...",
  "recommended": [],
  "intent": "clarify",
  "entities": [...]
}`.trim()

  return await getLLMResponse(prompt)
}

// ❓ Nessun intento rilevabile (caso futuro)
export async function fallbackNoIntent(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, history, entities } = params

  const lastTurns = (history ?? [])
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => `- ${m.content}`)
    .join('\n')

  const prompt = `
Messaggio utente:
"${message}"

Entità trovate:
${JSON.stringify(entities ?? [])}

Conversazione recente:
${lastTurns || '—'}

Obiettivo:
- L'intento dell'utente non è chiaro (es. domanda troppo vaga, ambigua o incompleta)
- Restituire un chiarimento strutturato in JSON:

{
  "summary": "...",
  "recommended": [],
  "intent": "clarify",
  "entities": [...]
}`.trim()

  return await getLLMResponse(prompt)
}

// 🔄 Cambio completo di argomento (contesto incoerente con la sessione)
export async function fallbackContextShift(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, history, entities } = params

  const lastTurns = (history ?? [])
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => `- ${m.content}`)
    .join('\n')

    const prompt = `
    Messaggio utente:
    "${message}"
    
    Messaggi precedenti:
    ${lastTurns || '—'}
    
    Entità rilevate:
    ${JSON.stringify(entities ?? [])}
    
    Il messaggio indica un cambio completo di argomento rispetto alla conversazione precedente.
    
    Obiettivo:
    - Informare l'utente che il nuovo argomento non è compatibile con la sessione corrente
    - Suggerire gentilmente di aprire una nuova chat per mantenere coerenza e risultati rilevanti
    - Rispondere in questo formato:
    
    {
      "summary": "Hai cambiato completamente argomento. Per cercare un nuovo tipo di prodotto, ti consiglio di aprire una nuova chat.",
      "recommended": [],
      "intent": "clarify",
      "entities": [...]
    }`.trim()
    

  return await getLLMResponse(prompt)
}

// 🧠 Core LLM invoker
async function getLLMResponse(prompt: string): Promise<ChatAIResponse> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente AI che restituisce sempre un JSON valido e strutturato per l’interfaccia utente.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 600
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Risposta fallback LLM vuota')

  try {
    return JSON.parse(content)
  } catch (err) {
    logger.error('[fallback] Parsing fallito', { content, error: err })
    throw new Error('Fallback LLM non ha restituito JSON valido')
  }
}

---
### ./components/chat/chat-message-item.tsx

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
---
### ./components/chat/chat-get-embedding.tsx

import { OpenAI } from 'openai'

const openai = new OpenAI()
const EMBEDDING_MODEL = 'text-embedding-3-small'


export async function getEmbedding(text: string): Promise<number[]> {
  // Sanitize: newline, lower, trim, collapse spaces
  const input = text.replace(/\n/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim()

  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input
  })

  const embedding = res.data?.[0]?.embedding

  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Embedding non generato o malformato da OpenAI')
  }

  return embedding
}

---
### ./components/chat/chat-api.tsx

import { createClient } from '@/lib/supabase/client'
import type { ChatApiResponse } from './types'

type ChatApiRequest = {
  message: string
  sessionId: string
}

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatApiResponse> {
  // Auth Supabase
  const supabase = createClient()
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Utente non autenticato')
  }

  const requestPayload: ChatApiRequest = { message, sessionId }

  let data: ChatApiResponse | null = null

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(requestPayload)
    })

    if (!res.ok) {
      const errorDetail = await res.text()
      throw new Error(`Errore API ${res.status}: ${errorDetail}`)
    }

    data = await res.json()
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Errore nella richiesta o nella risposta della chat'
    )
  }

  // Validazione minima della risposta
  if (!data || !data.summary || typeof data.summary !== 'string') {
    throw new Error('La risposta della chat è vuota o non valida')
  }

  return {
    summary: data.summary,
    recommended: Array.isArray(data.recommended) ? data.recommended : [],
    products: Array.isArray(data.products) ? data.products : [],
    intent: data.intent,
    _id: data._id // <-- ora arriva dal backend
  }
}

---
### ./components/chat/chat-save.ts

'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage, ChatSession } from './types'
import { logger } from '@/lib/logger'



export async function saveMessageMongo(msg: Partial<ChatMessage>): Promise<string> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')

  const toInsert: ChatMessage = {
    session_id: typeof msg.session_id === 'string' ? new ObjectId(msg.session_id) : msg.session_id!,
    user_id: msg.user_id!,
    role: msg.role!,
    content: msg.content!,
    createdAt: msg.createdAt || new Date().toISOString(),
    products: msg.products,
    recommended: msg.recommended,
    intent: msg.intent,
    embedding: msg.embedding,
    feedback: msg.feedback,
    entities: msg.entities
  }

  const { insertedId } = await messages.insertOne(toInsert)

  const sessions = await getMongoCollection<ChatSession>('chat_sessions')
  await sessions.updateOne(
    { _id: toInsert.session_id },
    { $set: { updatedAt: new Date().toISOString() } }
  )

  logger.info('Messaggio salvato su Mongo', {
    role: msg.role,
    session_id: toInsert.session_id.toString(),
    messageId: insertedId.toString()
  })

  return insertedId.toString()
}
---
### ./components/chat/chat-feedback.ts

'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage } from './types'
import { logger } from '@/lib/logger'


export async function updateMessageFeedback(
    messageId: string,
    feedback: { rating: 'positive' | 'negative' | 'neutral', comment?: string }
  ): Promise<void> {
    const messages = await getMongoCollection<ChatMessage>('chat_messages')
    const timestamp = new Date().toISOString()
    await messages.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { feedback: { ...feedback, timestamp } } }
    )
    logger.info('Feedback aggiornato', { messageId, feedback })
  }
---
### ./components/chat/types.ts

import type { ObjectId } from 'mongodb'

// ------------------ PRODOTTI ------------------
export type ProductItem = {
  sku: string
  name: string
  description: string
  unit_price: number
  qty?: number
  supplier: string
  category_name?: string[] // aggiornato qui
  thumbnail: string
  link?: string
  color?: string
  size?: string
  score?: number
}

// ------------------ ENTITÀ ------------------
export type ExtractedEntity =
  | { type: 'sku'; value: string }
  | { type: 'quantity'; value: number }
  | { type: 'color'; value: string }
  | { type: 'size'; value: string }
  | { type: 'supplier'; value: string }
  | { type: 'terms'; value: string[] }
  | { type: 'attributes'; value: string[] }
  | { type: 'other'; value: string | number }


// ------------------ RISPOSTA AI ------------------
export type ChatAIResponse = {
  summary: string
  recommended: {
    sku: string
    reason: string
  }[]
  intent?: 'info' | 'purchase' | 'compare' | 'clarify' | 'other'
  entities?: ExtractedEntity[]
}

// ------------------ FEEDBACK UTENTE ------------------
export type Feedback = {
  rating: 'positive' | 'negative' | 'neutral'
  comment?: string
  timestamp: string
}

// ------------------ MESSAGGIO CHAT (DB) ------------------
export type ChatMessage = {
  _id?: ObjectId
  session_id: ObjectId
  user_id: string
  role: 'user' | 'assistant'
  content: string
  products?: ProductItem[]
  recommended?: { sku: string; reason: string }[]
  intent?: string
  embedding?: number[]
  feedback?: Feedback
  entities?: ExtractedEntity[]
  createdAt: string
}

// ------------------ MESSAGGIO CHAT (UI) ------------------
export type UIMessage = Omit<ChatMessage, 'session_id' | '_id'> & {
  session_id: string
  _ui_id: string
  _id?: string // <-- solo string!
  isTyping?: boolean
  source?: 'standard-response' | 'fallback-no-entities' | 'fallback-no-products' | 'fallback-context-shift' | 'fallback-no-intent'
}

// ------------------ SESSIONE CHAT ------------------
export type ChatSession = {
  _id?: ObjectId
  user_id: string
  createdAt: string
  updatedAt?: string
}

// ------------------ RISPOSTA API CHAT (FRONTEND) ------------------
export type ChatApiResponse = {
  summary: string
  recommended: { sku: string; reason: string }[]
  products: ProductItem[]
  intent?: string
  _id?: string // <-- AGGIUNGI QUESTO!
}
---
### ./components/chat/chat-response.ts

'use server'

import { OpenAI } from 'openai'
import type { ProductItem, ChatAIResponse, ChatMessage, ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

export async function generateChatResponse({
  message,
  products,
  contextMessages,
  entities
}: {
  message: string
  products: ProductItem[]
  contextMessages?: ChatMessage[]
  entities?: ExtractedEntity[]
}): Promise<ChatAIResponse> {

  const entityBlock = Array.isArray(entities) && entities.length
    ? '🔸 ENTITIES:\n' + entities.map(e =>
        Array.isArray(e.value)
          ? `- ${e.type}: ${e.value.join(', ')}`
          : `- ${e.type}: ${e.value}`
      ).join('\n')
    : ''

  const userTurns = contextMessages?.filter(m => m.role === 'user')
    .map(m => `🧑‍💬 ${m.content}`) ?? []

  const recs = contextMessages?.filter(m => m.role === 'assistant' && m.recommended?.length)
    .flatMap(m => m.recommended!.map(r => `🤖 suggerito: ${r.sku} → ${r.reason}`)) ?? []

  const historyBlock = [...userTurns, ...recs].length
    ? '🔸 CONVERSATION_HISTORY:\n' + [...userTurns, ...recs].join('\n')
    : ''

  const productBlock = products.length
    ? products.map(p =>
        `- ${p.name} (${p.unit_price.toFixed(2)}€), SKU: ${p.sku}, Categoria: ${
          Array.isArray(p.category_name)
            ? p.category_name.join(' / ')
            : p.category_name || 'N/A'
        }, Disponibilità: ${(p.qty ?? 0) > 0 ? 'Disponibile' : 'Esaurito'}`
      ).join('\n')
    : 'Nessun prodotto disponibile.'

  const prompt = `
🔸 USER_GOAL:
${message}

${entityBlock}

${historyBlock}

🔸 PRODUCT_CONTEXT:
${productBlock}

🔸 CONSTRAINTS:
- Suggerisci massimo 4 prodotti (solo se presenti e disponibili)
- Se non ci sono prodotti disponibili, informa l’utente e suggerisci alternative pertinenti
- Se è un confronto tra prodotti, segnala chiaramente quali SKU sono trovati e quali no
- Motiva ogni prodotto suggerito (campo "reason")
- Classifica l'intento tra: info, purchase, compare, clarify, other

🔸 FORMAT_OUTPUT:
{
  "summary": "...",
  "recommended": [
    { "sku": "...", "reason": "..." }
  ],
  "intent": "...",
  "entities": [
    { "type": "...", "value": "..." }
  ]
}

Rispondi solo con JSON valido. Nessun testo extra.
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente esperto di prodotti promozionali. Rispondi solo in JSON valido.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) throw new Error('Risposta AI vuota')

  try {
    const parsed = JSON.parse(rawContent)

    if (!products.length && parsed.recommended?.length) {
      logger.warn('⚠️ AI ha restituito raccomandazioni senza prodotti', {
        recommended: parsed.recommended
      })
    }

    logger.info('Risposta AI generata', {
      summary: parsed.summary,
      intent: parsed.intent,
      nRecommended: parsed.recommended.length
    })

    return parsed
  } catch (err) {
    logger.error('Parsing JSON risposta AI fallito', { rawContent, error: err })
    throw new Error('Risposta AI non in JSON')
  }
}

---
### ./components/chat/chat-build-embedding.tsx

import type { ExtractedEntity } from './types'

export function buildEmbeddingText(message: string, entities: ExtractedEntity[]): string {
  const entityParts = entities.map(e =>
    Array.isArray(e.value)
      ? `${e.type}: ${e.value.join(', ')}`
      : `${e.type}: ${e.value}`
  )
  return [message, ...entityParts].join(' | ')
}

---
### ./components/chat/chat-get-products.ts

'use server'

import type { ProductItem, ChatMessage, ExtractedEntity } from './types'
import { vectorMongoSearch } from './chat-search-mongo'
import { logger } from '@/lib/logger'

function mergeEntitiesAcrossTurns(
  history: ChatMessage[],
  currentEntities: ExtractedEntity[]
): ExtractedEntity[] {
  const entityMap = new Map<string, ExtractedEntity>()

  for (const msg of history) {
    if (msg.role !== 'user') continue
    const pastEntities = msg.entities || []
    for (const ent of pastEntities) {
      const key = `${ent.type}:${String(ent.value).toLowerCase()}`
      entityMap.set(key, ent)
    }
  }

  for (const ent of currentEntities) {
    const key = `${ent.type}:${String(ent.value).toLowerCase()}`
    entityMap.set(key, ent)
  }

  return Array.from(entityMap.values())
}

export async function getProducts(
  message: string,
  embedding: number[],
  history: ChatMessage[],
  entities: ExtractedEntity[],
  maxResults = 10
): Promise<{ products: ProductItem[]; entities: ExtractedEntity[] }> {
  const mergedEntities = mergeEntitiesAcrossTurns(history, entities)
  logger.info('[getProducts] Entità finali dopo fusione', { entities: mergedEntities })

  if (mergedEntities.length === 0) {
    logger.warn('[getProducts] Nessuna entità trovata')
    return { products: [], entities: [] }
  }

  const products = await vectorMongoSearch(
    embedding,
    maxResults
  )
  logger.info('[getProducts] Prodotti trovati con vectorMongoSearch', {
    count: products.length
  })

  return { products, entities: mergedEntities }
}

---
### ./components/chat/chat-sessions.ts

'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage, ChatSession } from './types'
import { logger } from '@/lib/logger'


function cleanMongoObject<T>(obj: T): T {
return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object' && value._bsontype === 'ObjectID') {
    return value.toString()
    }
    return value
}))
}


export async function createChatSession(userId: string): Promise<string> {
    const sessions = await getMongoCollection<ChatSession>('chat_sessions')
    const now = new Date().toISOString()
    const res = await sessions.insertOne({
      user_id: userId,
      createdAt: now,
      updatedAt: now
    })
    logger.info('Sessione creata', { userId, sessionId: res.insertedId.toString() })
    return res.insertedId.toString()
  }



export async function getSessionHistoryMongo(sessionId: string, limit = 10) {
    const messages = await getMongoCollection<ChatMessage>('chat_messages')
    const history = await messages
      .find({ session_id: new ObjectId(sessionId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  
    return history.reverse().map(cleanMongoObject) // ✅ fix qui
  }
  
---
### ./components/chat/chat-input.tsx

'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="sticky bottom-0 w-full border-t bg-background px-4 pt-4">
      <div className="max-w-3xl mx-auto relative">
        <Textarea
          placeholder="Scrivi qui la tua richiesta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] resize-none pr-12"
          disabled={disabled}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2"
          onClick={handleSend}
          disabled={disabled}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

---
### ./app/api/chat/route.ts

import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { extractEntitiesLLM } from '@/components/chat/chat-exctract-entities'
import { buildEmbeddingText } from '@/components/chat/chat-build-embedding'
import { getEmbedding } from '@/components/chat/chat-get-embedding'
import { saveMessageMongo } from '@/components/chat/chat-save'
import { getSessionHistoryMongo } from '@/components/chat/chat-sessions'
import { getProducts } from '@/components/chat/chat-get-products'
import { detectContextShift } from '@/components/chat/chat-detect-context'
import { generateChatResponse } from '@/components/chat/chat-response'
import type { ChatAIResponse } from '@/components/chat/types'
import {fallbackNoEntities,fallbackNoProducts, fallbackContextShift, fallbackNoIntent} from '@/components/chat/chat-fallback'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    // Step 1 – Autenticazione utente
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth
    const { user } = auth
    logger.info('Utente autenticato', { userId: user.id })

    // Step 2 – Parsing input e validazione
    const { message, sessionId } = await req.json()
    logger.info('Payload ricevuto', { message, sessionId })

    if (!message || !sessionId) {
      logger.warn('Messaggio o sessione mancanti nel payload')
      return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    }

    if (!ObjectId.isValid(sessionId)) {
      throw new Error('ID di sessione non valido')
    }
    
    const sessionObjectId = new ObjectId(sessionId)

    // Step 3 – Estrazione entità dal messaggio utente
    const entities = await extractEntitiesLLM(message)
    logger.info('[POST] Entità estratte', { entities })

    // Step 4 – Costruzione testo strutturato per embedding
    const embeddingText = buildEmbeddingText(message, entities)
    logger.info('[POST] Testo embedding strutturato', { embeddingText })

    // Step 5 – Generazione embedding dal testo strutturato
    const embedding = await getEmbedding(embeddingText)
    logger.info('[POST] Embedding generato', { preview: embedding.slice(0, 5) })

    // Step 6 – Recupero cronologia messaggi recenti (ultimi 10)
    const history = await getSessionHistoryMongo(sessionId, 10)
    logger.info('[POST] History', { history })

    // Step 7 – Ricerca prodotti con entità + embedding + contesto
    const { products, entities: mergedEntities } = await getProducts(message, embedding, history, entities, 10)
    logger.info('[POST] Prodotti trovati', { count: products.length, skus: products.map(p => p.sku) })

    // Step 8 – Detect context shift
    const contextShift = detectContextShift(history, mergedEntities)

    let aiResponse: ChatAIResponse
    let responseSource = 'default'

    if (contextShift) {
      logger.warn('[POST] Cambio argomento rilevato – fallbackContextShift attivo')
      aiResponse = await fallbackContextShift({ message, embedding, history, entities: mergedEntities })
      responseSource = 'fallback-context-shift'
    } else if (mergedEntities.length === 0) {
      logger.warn('[POST] Nessuna entità trovata – fallbackNoEntities attivo')
      aiResponse = await fallbackNoEntities({ message, embedding, history })
      responseSource = 'fallback-no-entities'
    } else if (products.length === 0) {
      logger.warn('[POST] Nessun prodotto trovato – fallbackNoProducts attivo')
      aiResponse = await fallbackNoProducts({ message, embedding, history, entities: mergedEntities })
      responseSource = 'fallback-no-products'
    } else {
      aiResponse = await generateChatResponse({
        message,
        products,
        contextMessages: history,
        entities: mergedEntities
      })
      responseSource = 'standard-response'
    
      // 🔍 Controllo intenzione mancante
      if (!aiResponse.intent || aiResponse.intent === 'other') {
        logger.warn('[POST] Intento non rilevato – fallbackNoIntent attivo')
        aiResponse = await fallbackNoIntent({
          message,
          embedding,
          history,
          entities: mergedEntities
        })
        responseSource = 'fallback-no-intent'
      }
    }
    

    logger.info('[POST] Risposta AI finalizzata', {
      source: responseSource,
      intent: aiResponse.intent,
      nRecommended: aiResponse.recommended.length
    })

    // Step 9 – Salvataggio messaggio utente con entità ed embedding
    const userMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'user',
      content: message,
      embedding,
      entities: mergedEntities,
      createdAt: new Date().toISOString()
    })
    logger.info('[POST] Messaggio utente salvato', { userMessageId })

    // Step 10 – Salvataggio messaggio AI con raccomandazioni e entità
    const aiMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse.summary,
      recommended: aiResponse.recommended,
      intent: aiResponse.intent ?? 'suggestion',
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      createdAt: new Date().toISOString()
    })
    logger.info('[POST] Messaggio AI salvato', { aiMessageId })

    // Step 11 – Risposta JSON al client
    return NextResponse.json({
      summary: aiResponse.summary,
      recommended: aiResponse.recommended,
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      intent: aiResponse.intent ?? 'suggestion',
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      _id: aiMessageId?.toString()
    })

  } catch (err) {
    logger.error('[POST] Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
