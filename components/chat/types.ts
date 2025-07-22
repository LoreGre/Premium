import type { ObjectId } from 'mongodb'

// ------------------ PRODOTTI ------------------
export type ProductItem = {
  sku: string
  name: string
  description: string
  price: number
  available: boolean
  qty?: number
  supplier: string
  category_name?: string
  thumbnail: string
  link?: string
  colore?: string
  score?: number
}

// ------------------ ENTITÀ ------------------
export type ExtractedEntity = {
  type: 'color' | 'size' | 'category' | 'sku' | 'quantity' | 'supplier' | 'other'
  value: string | number
}

// ------------------ RISPOSTA AI ------------------
export type ChatAIResponse = {
  summary: string
  recommended: {
    sku: string
    reason: string
  }[]
  intent?: 'info' | 'purchase' | 'support' | 'greeting' | 'feedback' | 'compare' | 'other'
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
export type UIMessage = Omit<ChatMessage, 'session_id'> & {
  session_id: string
  _ui_id: string
}

// ------------------ SESSIONE CHAT ------------------
export type ChatSession = {
  _id?: ObjectId
  user_id: string
  createdAt: string
  updatedAt?: string
}

// ------------------ CONTESTO CONVERSAZIONALE ------------------
export type ChatContext = {
  messages: ChatMessage[]
  sessionId: string
}
