# Chat Snapshot - Ven  1 Ago 2025 17:09:04 CEST

## Directory tree (./components/chat/)

./components/chat/
├── chat-api.tsx
├── chat-build-embedding.tsx
├── chat-container.tsx
├── chat-detect-context.ts
├── chat-exctract-entities.tsx
├── chat-fallback-notice.tsx
├── chat-fallback.ts
├── chat-feedback.ts
├── chat-get-embedding.tsx
├── chat-input.tsx
├── chat-message-item.tsx
├── chat-response.ts
├── chat-route-handler.tsx
├── chat-save.ts
├── chat-search-mongo.ts
├── chat-search-sku.tsx
├── chat-sessions.ts
└── types.ts

1 directory, 18 files

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

---
### ./components/chat/chat-search-mongo.ts

import { getMongoCollection } from '@/lib/mongo/client'
import type { ProductItem, ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

export async function searchHybridMongo(
  embedding: number[],
  query: string,
  entities: ExtractedEntity[] = [],
  limit = 6,
  vectorPriority = 0,
  textPriority = 0
): Promise<ProductItem[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')

  const colors = entities
    .filter(e => e.type === 'color')
    .map(e => String(e.value).toLowerCase())

  const sizes = entities
    .filter(e => e.type === 'size')
    .map(e => String(e.value).toUpperCase())

  const vectorPipeline = [
    {
      $vectorSearch: {
        index: 'prodotti_vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 100,
        limit
      }
    },
    { $group: { _id: null, docs: { $push: '$$ROOT' } } },
    { $unwind: { path: '$docs', includeArrayIndex: 'rank' } },
    {
      $addFields: {
        vs_score: {
          $divide: [1.0, { $add: ['$rank', vectorPriority, 1] }]
        }
      }
    },
    {
      $project: {
        vs_score: 1,
        _id: '$docs._id',
        sku: '$docs.sku',
        name: '$docs.name',
        description: '$docs.description',
        thumbnail: '$docs.thumbnail',
        color: '$docs.color',
        size: '$docs.size',
        supplier: '$docs.supplier',
        category_name: '$docs.category_name',
        unit_price: '$docs.unit_price',
        qty: '$docs.qty'
      }
    }
  ]

  const textPipeline = [
    {
      $search: {
        index: 'prodotti_text_index',
        text: {
          query,
          path: ['name', 'description', 'category_name', 'supplier', 'color']
        }
      }
    },
    { $limit: limit },
    { $group: { _id: null, docs: { $push: '$$ROOT' } } },
    { $unwind: { path: '$docs', includeArrayIndex: 'rank' } },
    {
      $addFields: {
        ts_score: {
          $divide: [1.0, { $add: ['$rank', textPriority, 1] }]
        }
      }
    },
    {
      $project: {
        ts_score: 1,
        _id: '$docs._id',
        sku: '$docs.sku',
        name: '$docs.name',
        description: '$docs.description',
        thumbnail: '$docs.thumbnail',
        color: '$docs.color',
        size: '$docs.size',
        supplier: '$docs.supplier',
        category_name: '$docs.category_name',
        unit_price: '$docs.unit_price',
        qty: '$docs.qty'
      }
    }
  ]

  const pipeline = [
    ...vectorPipeline,
    {
      $unionWith: {
        coll: 'prodotti',
        pipeline: textPipeline
      }
    },
    {
      $group: {
        _id: '$_id',
        sku: { $first: '$sku' },
        name: { $first: '$name' },
        description: { $first: '$description' },
        thumbnail: { $first: '$thumbnail' },
        color: { $first: '$color' },
        size: { $first: '$size' },
        supplier: { $first: '$supplier' },
        category_name: { $first: '$category_name' },
        unit_price: { $first: '$unit_price' },
        qty: { $first: '$qty' },
        vs_score: { $max: '$vs_score' },
        ts_score: { $max: '$ts_score' }
      }
    },
    {
      $addFields: {
        colorBoost: {
          $cond: [
            { $in: [{ $toLower: '$color' }, colors] },
            0.2,
            0
          ]
        },
        sizeBoost: {
          $cond: [
            { $in: [{ $toUpper: '$size' }, sizes] },
            0.2,
            0
          ]
        }
      }
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
        score: {
          $add: [
            { $ifNull: ['$vs_score', 0] },
            { $ifNull: ['$ts_score', 0] },
            { $ifNull: ['$colorBoost', 0] },
            { $ifNull: ['$sizeBoost', 0] }
          ]
        }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]

  const results = await prodotti.aggregate<ProductItem>(pipeline).toArray()
  logger.info('[searchHybridMongo] Risultati hybrid search', { count: results.length })
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
- \`color\`: colore rilevante (in forma base maschile singolare, es. "rosso", "blu", "verde", "giallo"). Se l’utente scrive rosse, verdi, nera, bianche… restituisci sempre la forma standard.
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
  const { message } = params

    const prompt = `
    L'utente ha scritto:
    "${message}"
    
    Non sono state rilevate entità strutturate.
    
    📌 Obiettivo:
    - Rispondi direttamente all'utente usando il TU.
    - Invitalo gentilmente a spiegare meglio che tipo di prodotto sta cercando.
    - Guida l'utente con una domanda semplice per aiutarlo a fornire dettagli (es. cosa cerca: prodotto, colore, quantità, taglia...)
    - Non proporre prodotti generici.
    - Tono cordiale e naturale, da assistente conversazionale
    - Usa emoji se serve
    
    Rispondi con JSON:
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
      .join('\n') || '—'
  }

  Non abbiamo trovato prodotti nel DB!
  
  📌 Obiettivo:
  - **Nella summary, parla direttamente all'utente. Non usare mai frasi come "L'utente ha chiesto..."**
  - Informare l'utente che non ci sono prodotti compatibili.
  - Guida l'utente con una domanda semplice per aiutarlo a fornire dettagli (es. cosa cerca: prodotto, colore, quantità, taglia...)
  - Non proporre prodotti generici
  - Usa emoji se serve
  - Tono cordiale e naturale, da assistente conversazionale
  
  Rispondi in formato JSON:
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

    const prompt = `
    Messaggio utente:
    "${message}"
    
    Entità trovate:
    ${JSON.stringify(entities ?? [])}
    
    Conversazione recente:
    ${
      (history ?? [])
        .filter(m => m.role === 'user')
        .slice(-2)
        .map(m => `- ${m.content}`)
        .join('\n') || '—'
    }

    Non abbiamo capito l'intento!
    
    📌 Obiettivo:
    - **Nella summary, parla direttamente all'utente. Non usare mai frasi come "L'utente ha chiesto..."**
    - Guida l’utente con una domanda utile per capire cosa cerca: tipologia di prodotto, colore, quantità o altri dettagli.
    - L'obiettivo è ottenere un messaggio con entità utili per avviare una ricerca prodotti.
    - Non proporre prodotti generici
    - Usa emoji se serve
    - Tono cordiale e naturale, da assistente conversazionale
    
    Rispondi con JSON:
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

    const prompt = `
    Messaggio utente:
    "${message}"
    
    Messaggi precedenti:
    ${
      (history ?? [])
        .filter(m => m.role === 'user')
        .slice(-2)
        .map(m => `- ${m.content}`)
        .join('\n') || '—'
    }
    
    Entità rilevate:
    ${JSON.stringify(entities ?? [])}

    L'utente ha cambiato completamente contesto nella stessa conversazione!
    
    📌 Obiettivo:
    - **Nella summary, parla direttamente all'utente. Non usare mai frasi come "L'utente ha chiesto..."**
    - Invita l’utente ad aprire una nuova chat per una ricerca più precisa.
    - Non proporre prodotti generici
    - Usa emoji se serve
    - Tono cordiale e naturale, da assistente conversazionale
    
    Rispondi in formato JSON:
    {
      "summary": "...",
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
import { FallbackNotice } from './chat-fallback-notice'

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0s]" />
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
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
    <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
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

        {!isUser && products.length > 0 && (
          <div className="mt-4 space-y-4">
            {products.map((product) => (
              <div
                key={product.sku}
                title={`SKU: ${product.sku}`}
                className="relative border rounded-xl p-4 flex items-start gap-4 bg-background shadow-sm"
              >
                {product.isRecommended && (
                  <div className="absolute top-2 right-2 text-[12px] font-medium text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>⭐</span>
                    <span>AI</span>
                  </div>
                )}
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
                    <p className="font-medium flex items-center gap-1">
                      {product.name}
                    </p>
                      <p className="text-sm text-muted-foreground">
                        {(product.unit_price ?? 0).toFixed(2)} € · {product.supplier}
                      </p>
                      {/* badge container */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          SKU: {product.sku}
                        </span>

                        {product.color && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                            Colore: {product.color}
                          </span>
                        )}

                        {product.size && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            Taglia: {product.size}
                          </span>
                        )}

                        {product.reason && (
                          <p className="text-xs mt-1 text-blue-800 italic">
                            <span className="font-semibold">Motivo:</span> {product.reason}
                          </p>
                        )}
                      </div>
                      <p className={cn(
                        'text-xs mt-1 font-medium',
                        (product.qty ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        ({product.qty ?? 0}) {(product.qty ?? 0) > 0 ? 'Disponibile' : 'Non disponibile'}
                      </p>
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
      {!isUser &&
        message.intent === 'clarify' &&
        (!Array.isArray(message.products) || !message.products.some(p => p.isRecommended)) &&
        !!message.source && (
          <div className="flex justify-start max-w-[80%] pl-4 mt-[-0.25rem] mb-2">
            <FallbackNotice source={message.source} />
          </div>
      )}
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
    products: Array.isArray(data.products) ? data.products : [],
    intent: data.intent,
    _id: data._id,
    source: data.source
  }
}

---
### ./components/chat/chat-search-sku.tsx



import { getMongoCollection } from '@/lib/mongo/client'
import type { ExtractedEntity, ProductItem } from './types'

export function shouldUseOnlySkuSearch(entities: ExtractedEntity[]): boolean {
  if (!entities.length) return false
  const types = new Set(entities.map(e => e.type))
  return types.size === 1 && types.has('sku')
}

export function getSkuValues(entities: ExtractedEntity[]): string[] {
  return entities
    .filter(e => e.type === 'sku')
    .map(e => e.value.toUpperCase()) // normalizziamo
}

export async function findProductsBySku(skus: string[]): Promise<ProductItem[]> {
  if (!skus.length) return []

  const prodotti = await getMongoCollection<ProductItem>('prodotti')

  const results = await prodotti
    .find({ sku: { $in: skus } })
    .project({
      sku: 1,
      name: 1,
      description: 1,
      thumbnail: 1,
      color: 1,
      size: 1,
      supplier: 1,
      category_name: 1,
      unit_price: 1,
      qty: 1
    })
    .toArray() as ProductItem[]

  return results
}
---
### ./components/chat/chat-save.ts

'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage, ChatSession, FallbackSource } from './types'
import { logger } from '@/lib/logger'

export type SaveChatMessageParams = {
  session_id: string | ObjectId
  user_id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  embedding?: number[]
  products?: ChatMessage['products']
  intent?: string
  feedback?: ChatMessage['feedback']
  entities?: ChatMessage['entities']
  source?: FallbackSource
}

export async function saveMessageMongo(params: SaveChatMessageParams): Promise<string> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')

  const sessionObjectId = typeof params.session_id === 'string'
    ? new ObjectId(params.session_id)
    : params.session_id

  const baseMessage: ChatMessage = {
    session_id: sessionObjectId,
    user_id: params.user_id,
    role: params.role,
    content: params.content,
    createdAt: params.createdAt ?? new Date().toISOString(),
    products: params.products,
    intent: params.intent,
    embedding: params.embedding,
    feedback: params.feedback,
    entities: params.entities,
    source: params.source
  }

  // 🔍 Rimuove i campi undefined/null
  const toInsert = Object.fromEntries(
    Object.entries(baseMessage).filter(([, value]) => value !== undefined && value !== null)
  ) as ChatMessage  

  const { insertedId } = await messages.insertOne(toInsert)

  // ⏱️ aggiorna updatedAt nella sessione
  const sessions = await getMongoCollection<ChatSession>('chat_sessions')
  await sessions.updateOne(
    { _id: sessionObjectId },
    { $set: { updatedAt: new Date().toISOString() } }
  )

  logger.info('Messaggio salvato su Mongo', {
    role: toInsert.role,
    session_id: sessionObjectId.toString(),
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
  category_name?: string[] 
  thumbnail: string
  link?: string
  color?: string
  size?: string
  score?: number
  isRecommended?: boolean
  reason?: string
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
  products: ProductItem[] // ✅ AGGIUNGI QUESTO
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
  intent?: string
  embedding?: number[]
  feedback?: Feedback
  entities?: ExtractedEntity[]
  createdAt: string
  source?: FallbackSource
}

// ------------------ MESSAGGIO CHAT (UI) ------------------
export type UIMessage = Omit<ChatMessage, 'session_id' | '_id'> & {
  session_id: string
  _ui_id: string
  _id?: string // <-- solo string!
  isTyping?: boolean
  source?: FallbackSource
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
  products: ProductItem[]
  intent?: string
  _id?: string
  source?: FallbackSource
}

// ------------------ FALLBACK ------------------
export type FallbackSource =
  | 'fallback-no-entities'
  | 'fallback-no-products'
  | 'fallback-context-shift'
  | 'fallback-no-intent'
---
### ./components/chat/chat-fallback-notice.tsx

'use client'

import type { FallbackSource } from './types'

export function FallbackNotice({ source }: { source: FallbackSource }) {
  const fallbackMap: Record<
    FallbackSource,
    { icon: string; label: string; action?: () => void; actionLabel?: string }
  > = {
    'fallback-no-entities': {
      icon: '❓',
      label: 'Richiesta poco chiara',
    },
    'fallback-no-products': {
      icon: '📭',
      label: 'Nessun prodotto trovato',
    },
    'fallback-context-shift': {
      icon: '🔄',
      label: 'Cambio argomento rilevato',
      action: () => window.location.reload(),
      actionLabel: 'Ricomincia la chat'
    },
    'fallback-no-intent': {
      icon: '🤔',
      label: 'Intento non chiaro',
    }
  }

  const fallback = fallbackMap[source]
  if (!fallback) return null

  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1 italic">
      <span>{fallback.icon}</span>
      <span>{fallback.label}</span>
      {fallback.action && (
        <button
          onClick={fallback.action}
          className="ml-2 underline text-blue-700 hover:text-blue-900 text-xs"
        >
          {fallback.actionLabel}
        </button>
      )}
    </p>
  )
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
  messages,
  entities
}: {
  message: string
  products: ProductItem[]
  messages?: ChatMessage[]
  entities?: ExtractedEntity[]
}): Promise<ChatAIResponse> {

  type LLMResponse = Omit<ChatAIResponse, 'products'> & {
    recommended: { sku: string; reason: string }[]
  }

  const entityBlock = Array.isArray(entities) && entities.length
    ? '🔸 ENTITIES:\n' + entities.map(e =>
        Array.isArray(e.value)
          ? `- ${e.type}: ${e.value.join(', ')}`
          : `- ${e.type}: ${e.value}`
      ).join('\n')
    : ''

  const conversationTurns = messages?.map(m =>
    m.role === 'user'
      ? `🧑‍💬 ${m.content}`
      : m.products?.length
        ? m.products
            .filter(p => p.isRecommended)
            .map(p => `🤖 suggerito: ${p.sku} → ${p.reason ?? 'senza motivo'}`)
            .join('\n')
        : `🤖 ${m.content}`
  ).filter(Boolean) ?? []

  const historyBlock = conversationTurns.length
    ? '🔸 CONVERSATION_HISTORY:\n' + conversationTurns.join('\n')
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
- Usa un tono cordiale e diretto rivolto all'utente (dare del TU)
- La summary deve parlare direttamente all'utente, **non usare mai "L'utente ha chiesto..."**
- Suggerisci massimo 3 prodotti (solo se presenti e disponibili)
- Se non ci sono prodotti disponibili, informa l’utente e suggerisci alternative pertinenti
- Se è un confronto tra prodotti, segnala chiaramente quali SKU sono trovati e quali no
- Motiva ogni prodotto suggerito (campo "reason")
- Classifica l'intento tra: info, purchase, compare, clarify, other
- Se il messaggio non richiede un'azione specifica (es: mostrare prodotti, confrontare, comprare) → usa "other"
- Se la frase è generica, confusa, o riguarda strategie, fornitori, test, processi… → usa sempre "other"
- Se hai dubbi sull’intento, NON usare "info" per default. Usa "clarify" o "other".

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
    const parsed = JSON.parse(rawContent) as LLMResponse

    if (!products.length && parsed.recommended?.length) {
      logger.warn('⚠️ AI ha restituito raccomandazioni senza prodotti', {
        recommended: parsed.recommended
      })
    }

    const enrichedProducts = products.map(p => {
      const match = parsed.recommended.find(r => r.sku === p.sku)
      return match
        ? { ...p, isRecommended: true, reason: match.reason }
        : p
    })
    
    // 🔝 Metti i raccomandati in testa
    const sortedProducts = [
      ...enrichedProducts.filter(p => p.isRecommended),
      ...enrichedProducts.filter(p => !p.isRecommended)
    ]    


    logger.info('Risposta AI generata', {
      summary: parsed.summary,
      intent: parsed.intent,
      nRecommended: parsed.recommended.length
    })

    return {
      summary: parsed.summary,
      products: sortedProducts,
      intent: parsed.intent,
      entities: parsed.entities
    }

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
### ./components/chat/chat-route-handler.tsx

'use server'

import { ObjectId } from 'mongodb'
import { getSessionHistoryMongo } from './chat-sessions'
import { generateChatResponse } from './chat-response'
import { fallbackNoEntities, fallbackNoProducts, fallbackContextShift, fallbackNoIntent } from './chat-fallback'
import { detectContextShift } from './chat-detect-context'
import { shouldUseOnlySkuSearch, getSkuValues, findProductsBySku } from './chat-search-sku'
import { searchHybridMongo } from './chat-search-mongo'
import type { ChatMessage, ExtractedEntity, ProductItem, FallbackSource, ChatAIResponse } from './types'
import { logger } from '@/lib/logger'


function getMergedContext(
  history: ChatMessage[],
  currentEntities: ExtractedEntity[],
  currentProducts: ProductItem[]
): {
  mergedEntities: ExtractedEntity[]
  mergedProducts: ProductItem[]
  mergedMessages: ChatMessage[]
} {
  // 1. Entità unificate (senza duplicati logici)
  const mergedEntities = [...new Map(
    [...(history.flatMap(m => m.entities || [])), ...currentEntities]
      .map(e => [`${e.type}:${String(e.value).toLowerCase()}`, e])
  ).values()]

  // 2. Prodotti raccomandati nei messaggi precedenti (solo assistant)
  const pastRecommended = history
    .filter(m => m.role === 'assistant')
    .flatMap(m => m.products?.filter(p => p.isRecommended) || [])

  // 3. Deduplica: prodotti nuovi + suggeriti in precedenza
  const mergedProducts = [...new Map(
    [...pastRecommended, ...currentProducts].map(p => [p.sku, p])
  ).values()]

  // 4. Messaggi ordinati dal più vecchio al più recente
  const mergedMessages = [...history]

  return {
    mergedEntities,
    mergedProducts,
    mergedMessages
  }
}

export async function handleChatProductSearch(params: {
  message: string
  sessionId: string
  sessionObjectId: ObjectId
  userId: string
  entities: ExtractedEntity[]
  embedding: number[]
}): Promise<{
  aiResponse: ChatAIResponse
  products: ProductItem[]
  mergedEntities: ExtractedEntity[]
  responseSource: FallbackSource | 'standard-response'
}> {
  const { message, sessionId, entities, embedding } = params

  const history = await getSessionHistoryMongo(sessionId, 10)

  // 🔁 CAMBIO DI CONTESTO
  if (detectContextShift(history, entities)) {
    logger.warn('[ChatHandler] Context shift rilevato')
    const aiResponse = await fallbackContextShift({
      message,
      embedding,
      history,
      entities
    })
    return {
      aiResponse,
      products: [],
      mergedEntities: entities,
      responseSource: 'fallback-context-shift'
    }
  }

  // 🔀 Merge completo dopo il controllo context shift
  const { mergedEntities } = getMergedContext(history, entities, [])

  // 🔎 SOLO SKU
  if (shouldUseOnlySkuSearch(mergedEntities)) {
    const skus = getSkuValues(mergedEntities)
    const products = await findProductsBySku(skus)

    if (products.length === 0) {
      logger.warn('[ChatHandler] Nessun prodotto trovato – fallback noProducts')
      const aiResponse = await fallbackNoProducts({ message, embedding, history, entities: mergedEntities })
      return {
        aiResponse,
        products: [],
        mergedEntities,
        responseSource: 'fallback-no-products'
      }
    }
    const merged = getMergedContext(history, entities, products)

    const aiResponse = await generateChatResponse({
      message,
      entities: merged.mergedEntities,
      products: merged.mergedProducts,
      messages: merged.mergedMessages
    })

    return {
      aiResponse,
      products,
      mergedEntities: merged.mergedEntities,
      responseSource: 'standard-response'
    }
  }

  // ⛔️ Fallback se entità assenti o prive di termini
  if (
    mergedEntities.length === 0 ||
    !mergedEntities.some(e => e.type === 'terms')
  ) {
    logger.warn('[ChatHandler] Nessuna entità o nessun terms – fallback noEntities')
    const aiResponse = await fallbackNoEntities({ message, embedding, history })
    return {
      aiResponse,
      products: [],
      mergedEntities: [],
      responseSource: 'fallback-no-entities'
    }
  }

  // 🔍 RICERCA PRODOTTI
  // 🔤 Costruzione query testuale da entità terms
  const queryFromTerms = mergedEntities
  .filter(e => e.type === 'terms')
  .flatMap(e => e.value)

  const queryFromAttributes = mergedEntities
  .filter(e => e.type === 'attributes')
  .flatMap(e => e.value)

  const searchQuery = [...queryFromTerms, ...queryFromAttributes].join(' ').trim() || 'prodotto'
  const products = await searchHybridMongo(embedding, searchQuery, mergedEntities, 10, 1, 1)

  if (products.length === 0) {
    logger.warn('[ChatHandler] Nessun prodotto trovato – fallback noProducts')
    const aiResponse = await fallbackNoProducts({ message, embedding, history, entities: mergedEntities })
    return {
      aiResponse,
      products: [],
      mergedEntities,
      responseSource: 'fallback-no-products'
    }
  }

  const merged = getMergedContext(history, entities, products)

  let aiResponse = await generateChatResponse({
    message,
    entities: merged.mergedEntities,
    products: merged.mergedProducts,
    messages: merged.mergedMessages
  })

  let responseSource: FallbackSource | 'standard-response' = 'standard-response'

  if (!aiResponse.intent || aiResponse.intent === 'other') {
    logger.warn('[ChatHandler] Intento non rilevato – fallback noIntent')
    aiResponse = await fallbackNoIntent({
      message,
      embedding,
      history,
      entities: merged.mergedEntities
    })
    responseSource = 'fallback-no-intent'
  }

  return {
    aiResponse,
    products,
    mergedEntities: merged.mergedEntities,
    responseSource
  }
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
import { saveMessageMongo } from '@/components/chat/chat-save'
import { handleChatProductSearch } from '@/components/chat/chat-route-handler'
import { buildEmbeddingText } from '@/components/chat/chat-build-embedding'
import { getEmbedding } from '@/components/chat/chat-get-embedding'
import { SaveChatMessageParams } from '@/components/chat/chat-save'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth
    const { user } = auth

    const { message, sessionId } = await req.json()
    if (!message || !sessionId) return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    if (!ObjectId.isValid(sessionId)) throw new Error('ID di sessione non valido')
    const sessionObjectId = new ObjectId(sessionId)

    // 🔍 Estrai entità
    const entities = await extractEntitiesLLM(message)

    // ✏️ Costruisci embedding e salva subito il messaggio utente
    const embeddingText = buildEmbeddingText(message, entities)
    const embedding = await getEmbedding(embeddingText)

    const messageData: SaveChatMessageParams = {
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'user',
      content: message,
      embedding,
      entities,
      createdAt: new Date().toISOString(),
    }
    await saveMessageMongo(messageData)

    // 🤖 Genera risposta AI (usa embedding, entità, sessione)
    const {
      aiResponse,
      responseSource
    } = await handleChatProductSearch({
      message,
      sessionId,
      sessionObjectId,
      userId: user.id,
      entities,
      embedding
    })
    logger.debug('Risposta AI', { aiResponse })

   // 💾 Salva risposta AI
  const aiMessageId = await saveMessageMongo({
    session_id: sessionObjectId,
    user_id: user.id,
    role: 'assistant',
    content: aiResponse.summary,
    intent: aiResponse.intent ?? 'suggestion',
    products: aiResponse.products,
    entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
    createdAt: new Date().toISOString()
  })

  logger.debug('Messaggio AI salvato', { aiMessageId })

  // ✅ Risposta JSON al client
  return NextResponse.json({
    summary: aiResponse.summary,
    products: aiResponse.products,
    intent: aiResponse.intent ?? 'suggestion',
    entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
    _id: aiMessageId?.toString(),
    source: responseSource
  })
    
  } catch (err) {
    logger.error('[POST] Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

---
### ./app/api/chat/feedback/route.ts

import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { updateMessageFeedback } from '@/components/chat/chat-feedback'
import { logger } from '@/lib/logger'

const validRatings = ['positive', 'negative', 'neutral'] as const

export async function POST(req: Request) {
  try {
    // Autenticazione unica via utility
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth

    const { messageId, rating, comment } = await req.json()

    if (!messageId || !rating) {
      logger.warn('Dati mancanti nel feedback')
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    if (!validRatings.includes(rating)) {
      logger.warn('Rating non valido nel feedback', { rating })
      return NextResponse.json({ error: 'Rating non valido' }, { status: 400 })
    }

    if (typeof messageId !== 'string' || messageId.length !== 24) {
      logger.warn('messageId non valido', { messageId })
      return NextResponse.json({ error: 'ID messaggio non valido' }, { status: 400 })
    }

    await updateMessageFeedback(messageId, { rating, comment })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Errore API feedback', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
