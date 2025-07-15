export type ProductItem = {
  sku: string
  name: string
  description?: string
  price: number
  available: boolean
  qty?: number
  supplier: string
  category_name?: string
  thumb_url: string
  link?: string
  score?: number;
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: ProductItem[]
  intent?: string
  createdAt: string // ISO format
}

