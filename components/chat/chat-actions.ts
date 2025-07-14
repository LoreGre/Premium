'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getMongoClient } from '@/lib/mongo/client'
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
  embedding,
  userId,
  intent = null
}: {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  embedding?: number[]
  userId?: string
  intent?: string | null
}) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        session_id: sessionId,
        user_id: userId ?? null,
        role,
        content,
        embedding,
        intent,
        created_at: new Date().toISOString()
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

// 4. Trova prodotti semanticamente simili da MongoDB Atlas
export async function findSimilarProductsMongo(
  text: string,
  limit = 5
): Promise<{ products: ProductItem[]; embedding: number[]; skus: string[] }> {
  const embedding = await getEmbedding(text)
  const client = await getMongoClient()
  const db = client.db() // usa default database

  const prodotti = await db.collection('prodotti_silan')
    .aggregate([
      {
        $search: {
          index: 'embedding_index',
          knnBeta: {
            vector: embedding,
            path: 'embedding',
            k: limit
          }
        }
      },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          sku: 1,
          name: 1,
          description: 1,
          price: 1,
          qty: 1,
          available: 1,
          supplier: 1,
          category_name: 1,
          thumb_url: 1,
          link: 1
        }
      }
    ])
    .toArray()

  const skus = prodotti.map((p) => p.sku)
  return { products: prodotti as ProductItem[], embedding, skus }
}

// 5. Genera la risposta AI basata sui prodotti trovati
export async function generateChatResponse(
  message: string,
  products: ProductItem[]
): Promise<string> {
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

  const content = completion.choices[0]?.message?.content

  if (!content) {
    throw new Error('Risposta AI vuota o malformata')
  }

  return content
}
