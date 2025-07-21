'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getMongoClient } from '@/lib/mongo/client'
import { OpenAI } from 'openai'
import { getEmbedding } from './chat-embedding'
import type { ProductItem } from './types'
import { logger } from '@/lib/logger'

const supabase = createAdminClient()
const openai = new OpenAI()

export async function createChatSession(userId?: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ user_id: userId ?? null }])
    .select('id')
    .single()

  if (error) {
    logger.error('Errore creazione sessione', { error })
    throw new Error(`Errore creazione sessione: ${error.message}`)
  }
  logger.info('Sessione creata', { userId, sessionId: data.id })
  return data.id as string
}

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

  if (error) {
    logger.error('Errore salvataggio messaggio', { error })
    throw new Error(`Errore salvataggio messaggio: ${error.message}`)
  }
  logger.info('Messaggio salvato', { sessionId, role, messageId: data.id })
  return data.id as string
}

export async function saveMessageProducts(messageId: string, skus: string[]) {
  if (skus.length === 0) return

  const rows = skus.map((sku) => ({ message_id: messageId, sku }))
  const { error } = await supabase.from('chat_products').insert(rows)

  if (error) {
    logger.error('Errore salvataggio prodotti', { error })
    throw new Error(`Errore salvataggio prodotti: ${error.message}`)
  }
  logger.info('Prodotti associati salvati', { messageId, skus })
}

export async function searchByVectorMongo(queryVector: number[], limit = 5): Promise<(ProductItem & { score: number })[]> {
  const client = await getMongoClient()
  const db = client.db('Premium')

  const results = await db.collection('prodotti').aggregate([
    {
      $vectorSearch: {
        index: 'prodotti_vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: 100,
        limit
      }
    },
    {
      $project: {
        sku: 1,
        name: 1,
        description: 1,
        price: '$unit_price',
        qty: 1,
        available: { $gt: ['$qty', 0] },
        supplier: '$source',
        category_name: 1,
        thumbnail: 1,
        link: 1,
        colore: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).toArray()

  return results as (ProductItem & { score: number })[]
}

export async function searchByTextMongo(query: string, limit = 5): Promise<(ProductItem & { score: number })[]> {
  const client = await getMongoClient()
  const db = client.db('Premium')

  const results = await db.collection('prodotti').aggregate([
    {
      $search: {
        index: 'prodotti_index',
        text: {
          query,
          path: ['name', 'description', 'category_name', 'colore'],
          fuzzy: { maxEdits: 2 }
        }
      }
    },
    { $limit: limit },
    {
      $project: {
        sku: 1,
        name: 1,
        description: 1,
        price: '$unit_price',
        qty: 1,
        available: { $gt: ['$qty', 0] },
        supplier: '$source',
        category_name: 1,
        thumbnail: 1,
        link: 1,
        colore: 1,
        score: { $meta: 'searchScore' }
      }
    }
  ]).toArray()

  return results as (ProductItem & { score: number })[]
}

type ProductHybridResult = ProductItem & {
  vectorScore?: number
  textScore?: number
  hybridScore: number
}

export async function searchHybridFallback(query: string, limit = 5): Promise<ProductHybridResult[]> {
  const embedding = await getEmbedding(query)

  const [vectorResults, textResults] = await Promise.all([
    searchByVectorMongo(embedding, limit * 2),
    searchByTextMongo(query, limit * 2)
  ])

  const merged: Record<string, ProductHybridResult> = {}

  for (const v of vectorResults) {
    merged[v.sku] = {
      sku: v.sku,
      name: v.name,
      description: v.description ?? '',
      price: v.price ?? 0,
      available: v.available ?? false,
      qty: v.qty,
      supplier: v.supplier ?? '',
      category_name: v.category_name ?? '',
      thumbnail: v.thumbnail ?? '',
      link: v.link ?? '',
      colore: v.colore ?? '',
      vectorScore: v.score,
      hybridScore: v.score * 3
    }
  }

  for (const t of textResults) {
    if (merged[t.sku]) {
      merged[t.sku].textScore = t.score
      merged[t.sku].hybridScore += t.score
    } else {
      merged[t.sku] = {
        sku: t.sku,
        name: t.name,
        description: t.description ?? '',
        price: t.price ?? 0,
        available: t.available ?? false,
        qty: t.qty,
        supplier: t.supplier ?? '',
        category_name: t.category_name ?? '',
        thumbnail: t.thumbnail ?? '',
        link: t.link ?? '',
        colore: t.colore ?? '',
        vectorScore: t.score,
        hybridScore: t.score * 3
      }
    }
  }

  const final = Object.values(merged)
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit)

  logger.info('[searchHybridFallback] risultati finali', { count: final.length, skus: final.map(x => x.sku) })
  return final
}

export async function generateChatResponse(
  message: string,
  products: ProductItem[]
): Promise<string> {
  const productList = products
    .map((p) => `- ${p.name} (€${p.price})`)
    .join('\n')

  const prompt = `
Rispondi all'utente in modo amichevole e professionale, come se fossi un esperto di gadget aziendali pronto ad aiutare con dei consigli. 
Hai ricevuto questa richiesta:

"${message}"

Tra i prodotti che puoi proporre ci sono:
${productList}

Suggerisci alcuni tra questi articoli, motivando brevemente perché potrebbero essere adatti alla richiesta dell’utente. Non limitarti a elencarli: fai una raccomandazione utile, naturale e personalizzata. Evita di sembrare un robot.
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Sei un assistente esperto di prodotti promozionali aziendali. Parla in modo chiaro, utile e naturale. Il tuo obiettivo è consigliare all'utente i gadget più adatti alle sue esigenze.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 600
  })

  const content = completion.choices[0]?.message?.content

  if (!content) {
    logger.error('Risposta AI vuota o malformata')
    throw new Error('Risposta AI vuota o malformata')
  }

  logger.info('Risposta AI generata')
  return content
}
