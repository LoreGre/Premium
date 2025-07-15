'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getMongoClient } from '@/lib/mongo/client'
import { OpenAI } from 'openai'
import { getEmbedding } from './chat-embedding'
import type { ProductItem } from './types'
import fs from 'fs'
import path from 'path'

const supabase = createAdminClient()
const openai = new OpenAI()

export async function createChatSession(userId?: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ user_id: userId ?? null }])
    .select('id')
    .single()

  if (error) throw new Error(`Errore creazione sessione: ${error.message}`)
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

  if (error) throw new Error(`Errore salvataggio messaggio: ${error.message}`)
  return data.id as string
}

export async function saveMessageProducts(messageId: string, skus: string[]) {
  if (skus.length === 0) return

  const rows = skus.map((sku) => ({ message_id: messageId, sku }))
  const { error } = await supabase.from('chat_products').insert(rows)

  if (error) throw new Error(`Errore salvataggio prodotti: ${error.message}`)
}

export async function searchByVectorMongo(queryVector: number[], limit = 5) {
  const client = await getMongoClient();
  const db = client.db('Premium');

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
        colore: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).toArray();

  console.log('[searchByVectorMongo] risultati:', results.length)
  return results;
}

export async function searchByTextMongo(query: string, limit = 5) {
  const client = await getMongoClient();
  const db = client.db('Premium');

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
        colore: 1,
        score: { $meta: 'searchScore' }
      }
    }
  ]).toArray();

  console.log('[searchByTextMongo] risultati:', results.length)
  return results;
}

type ProductHybridResult = {
  sku: string;
  name: string;
  description?: string;
  colore?: string;
  vectorScore?: number;
  textScore?: number;
  hybridScore: number;
}

export async function searchHybridFallback(query: string, limit = 5): Promise<ProductHybridResult[]> {
  const embedding = await getEmbedding(query)

  // Scrive su file per copia-incolla da terminale
  const outPath = path.resolve(process.cwd(), 'embedding.txt')
  fs.writeFileSync(outPath, JSON.stringify(embedding))

  console.log('[searchHybridFallback] embedding preview (prime 5):', embedding.slice(0, 5))
  console.log(`[searchHybridFallback] embedding completo salvato in: ${outPath}`)

  const [vectorResults, textResults] = await Promise.all([
    searchByVectorMongo(embedding, limit * 2),
    searchByTextMongo(query, limit * 2)
  ])

  const merged: Record<string, ProductHybridResult> = {}

  for (const v of vectorResults) {
    merged[v.sku] = {
      sku: v.sku,
      name: v.name,
      description: v.description,
      colore: v.colore,
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
        description: t.description,
        colore: t.colore,
        textScore: t.score,
        hybridScore: t.score
      }
    }
  }

  const final = Object.values(merged)
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit)

  console.log('[searchHybridFallback] risultati finali:', final.length)
  return final
}

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
    max_tokens: 600
  })

  const content = completion.choices[0]?.message?.content

  if (!content) {
    throw new Error('Risposta AI vuota o malformata')
  }

  return content
}


export async function debugHybridSearch(query: string, limit = 5) {
  const embedding = await getEmbedding(query)
  const outPath = path.resolve(process.cwd(), 'embedding.txt')
  fs.writeFileSync(outPath, JSON.stringify(embedding))
  console.log('[debugHybridSearch] embedding salvato in:', outPath)
  console.log('[debugHybridSearch] preview:', embedding.slice(0, 5))

  const [vectorResults, textResults] = await Promise.all([
    searchByVectorMongo(embedding, limit * 2),
    searchByTextMongo(query, limit * 2)
  ])

  console.log('\n[Vector Results]', vectorResults.length)
  for (const p of vectorResults) {
    console.log(`- ${p.sku} | ${p.name} | score: ${p.score}`)
  }

  console.log('\n[Text Results]', textResults.length)
  for (const p of textResults) {
    console.log(`- ${p.sku} | ${p.name} | score: ${p.score}`)
  }

  return { vectorResults, textResults, embedding }
}