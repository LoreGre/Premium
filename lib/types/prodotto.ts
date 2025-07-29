// lib/types/prodotto.ts

export type ProdottoMongo = {
    sku: string
    name: string
    description: string
    unit_price: number
    qty: number
    source: string
    category_name: string[] // ✅ ora è un array di stringhe
  
    // UI & AI
    thumbnail?: string
    link: string
    colore?: string
    taglia?: string
  
    // AI & versioning
    content_hash?: string
    embedding?: number[]
  
  }