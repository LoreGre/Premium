export type Product = {
    sku: string
    name: string
    price: number
    available: boolean
    supplier: string
    thumb_url: string
  }
  
  export type ChatMessage = {
    id: string
    role: 'user' | 'assistant'
    content: string
    products?: Product[]
  }
  