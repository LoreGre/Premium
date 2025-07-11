'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { OpenAI } from 'openai'
import { getEmbedding } from './chat-embedding'
import type { ProductItem } from './types'

const supabase = createAdminClient()
const openai = new OpenAI()

// 1. Crea una nuova sessione
export async function createChatSession(userId?: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ user_id: userId ?? null }])
    .select('id')
    .single()

  if (error) throw new Error(`Errore creazione sessione: ${error.message}`)
  return data.id as string
}

// 2. Salva un messaggio (user o assistant)
export async function saveMessage({
  sessionId,
  role,
  content,
  embedding
}: {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  embedding?: number[]
}) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        session_id: sessionId,
        role,
        content,
        embedding
      }
    ])
    .select('id')
    .single()

  if (error) throw new Error(`Errore salvataggio messaggio: ${error.message}`)
  return data.id as string
}

// 3. Salva prodotti suggeriti associati a un messaggio
export async function saveMessageProducts(messageId: string, skus: string[]) {
  if (skus.length === 0) return

  const rows = skus.map((sku) => ({ message_id: messageId, sku }))
  const { error } = await supabase.from('chat_products').insert(rows)

  if (error) throw new Error(`Errore salvataggio prodotti: ${error.message}`)
}

// 4. Trova prodotti semanticamente simili
export async function findSimilarProducts(query: string, limit = 5) {
  const embedding = await getEmbedding(query)

  const { data, error } = await supabase.rpc('product_match_embedding', {
    query_embedding: embedding,
    match_count: limit
  })

  if (error) throw new Error(`Errore ricerca embedding: ${error.message}`)

type MatchEmbeddingRow = { sku: string; similarity: number }
const skus = (data as MatchEmbeddingRow[]).map((row) => row.sku)
    
  const { data: products, error: prodError } = await supabase
    .from('prodotti')
    .select('*')
    .in('sku', skus)

  if (prodError) throw new Error(`Errore recupero prodotti: ${prodError.message}`)

  return { products: products as ProductItem[], embedding, skus }
}

// 5. Genera la risposta AI basata sui prodotti trovati
export async function generateChatResponse(message: string, products: ProductItem[]) {
  const productList = products
    .map((p) => `- ${p.name} (€${p.price})`)
    .join('\n')

  const prompt = `L'utente ha chiesto: "${message}". Suggerisci in modo naturale e professionale dei prodotti promozionali tra questi:\n\n${productList}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Sei un esperto di gadget aziendali.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 300
  })

  return completion.choices[0].message.content
}
