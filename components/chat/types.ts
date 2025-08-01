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