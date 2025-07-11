export type ProductItem = {
  sku: string
  name: string
  price: number
  available: boolean
  supplier: string
  thumb_url: string
  link?: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: ProductItem[]
}
