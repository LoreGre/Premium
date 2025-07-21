'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import { OpenAI } from 'openai'
import type { ProductItem, ChatAIResponse, ChatMessage, ChatSession } from './types'
import { logger } from '@/lib/logger'

// ===============================
// 1. SESSIONI CHAT
// ===============================

/**
 * Crea una nuova sessione chat per uno user
 * @param userId - id univoco utente autenticato
 * @returns sessionId MongoDB come stringa
 */
export async function createChatSession(userId: string): Promise<string> {
  const sessions = await getMongoCollection<ChatSession>('chat_sessions')
  const now = new Date().toISOString()
  const res = await sessions.insertOne({
    user_id: userId,
    createdAt: now
  })
  logger.info('Sessione creata', { userId, sessionId: res.insertedId.toString() })
  return res.insertedId.toString()
}

// ===============================
// 2. CRUD MESSAGGI CHAT
// ===============================

/**
 * Salva un messaggio nella collection chat_messages
 * @param msg - oggetto messaggio parziale (verifica che tutti i campi obbligatori siano presenti)
 * @returns id del messaggio appena salvato (string)
 */
export async function saveMessageMongo(msg: Partial<ChatMessage>): Promise<string> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')
  const toInsert: ChatMessage = {
    session_id: msg.session_id!,
    user_id: msg.user_id!,
    role: msg.role!,
    content: msg.content!,
    createdAt: msg.createdAt || new Date().toISOString(),
    products: msg.products,
    recommended: msg.recommended,
    intent: msg.intent,
    embedding: msg.embedding,
    feedback: msg.feedback,
  }
  const { insertedId } = await messages.insertOne(toInsert)
  logger.info('Messaggio salvato su Mongo', { role: msg.role, session_id: msg.session_id, messageId: insertedId })
  return insertedId.toString()
}

// ===============================
// 3. HISTORY CONVERSAZIONE (memoria breve)
// ===============================

/**
 * Restituisce la history della sessione (solo role+content)
 * Usato per "memoria breve" del prompt
 * @param sessionId - id della sessione
 * @param limit - quanti messaggi vuoi recuperare (default 5)
 */
export async function getSessionHistoryMongo(sessionId: string, limit = 5) {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')
  const history = await messages
    .find({ session_id: sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
  // Solo { role, content } e ordinati dal più vecchio al più nuovo
  return history.reverse().map(m => ({ role: m.role, content: m.content }))
}

// ===============================
// 4. RICERCA PRODOTTI HYBRID (Vector + Text)
// ===============================

/**
 * Ricerca prodotti tramite vector search su Mongo
 */
export async function searchByVectorMongo(queryVector: number[], limit = 5): Promise<(ProductItem & { score: number })[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')
  const results = await prodotti.aggregate([
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
        price: 1,
        qty: 1,
        available: 1,
        supplier: 1,
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

/**
 * Ricerca prodotti tramite text search su Mongo
 */
export async function searchByTextMongo(query: string, limit = 5): Promise<(ProductItem & { score: number })[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')
  const results = await prodotti.aggregate([
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
        price: 1,
        qty: 1,
        available: 1,
        supplier: 1,
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

/**
 * Ricerca Hybrid combinata (vector + text + ranking)
 */
type ProductHybridResult = ProductItem & {
  vectorScore?: number
  textScore?: number
  hybridScore: number
}

export async function searchHybridMongo(
  query: string,
  embedding: number[],
  limit = 5
): Promise<ProductHybridResult[]> {
  const [vectorResults, textResults] = await Promise.all([
    searchByVectorMongo(embedding, limit * 2),
    searchByTextMongo(query, limit * 2)
  ])
  const merged: Record<string, ProductHybridResult> = {}
  for (const v of vectorResults) {
    merged[v.sku] = {
      ...v,
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
        ...t,
        textScore: t.score,
        hybridScore: t.score * 3
      }
    }
  }
  const final = Object.values(merged)
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit)
  logger.info('[searchHybridMongo] risultati finali', { count: final.length, skus: final.map(x => x.sku) })
  return final
}

// ===============================
// 5. GENERAZIONE RISPOSTA AI (Prompt dinamico + output JSON)
// ===============================

const openai = new OpenAI()

/**
 * Costruisce prompt, chiama GPT-4o e restituisce output JSON parsed
 * @param message - domanda utente
 * @param products - prodotti da proporre
 * @param history - memoria breve (optional)
 * @returns oggetto ChatAIResponse
 */
export async function generateChatResponse({
  message,
  products,
  history
}: {
  message: string
  products: ProductItem[]
  history?: { role: string, content: string }[]
}): Promise<ChatAIResponse> {
  const prompt = `
🔸 USER_GOAL:
${message}

${history && history.length
  ? '🔸 CONVERSATION_HISTORY:\n' +
    history.map(h => `[${h.role}] ${h.content}`).join('\n') +
    '\n'
  : ''
}
🔸 PRODUCT_CONTEXT:
${products.map((p) =>
  `- ${p.name} (${p.price}€), SKU: ${p.sku}, Categoria: ${p.category_name}`).join('\n')}

🔸 CONSTRAINTS:
- Suggerisci massimo 3 prodotti
- Motiva la scelta per ciascuno (campo "reason")

🔸 FORMAT_OUTPUT:
{
  "summary": "...",
  "recommended": [
    { "sku": "...", "reason": "..." }
  ]
}
Rispondi solo in JSON valido.
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente esperto di prodotti promozionali. Rispondi solo in JSON valido.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 600
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) throw new Error('Risposta AI vuota')
  logger.info('Risposta AI raw', { rawContent })

  let parsed: ChatAIResponse
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    logger.error('Parsing JSON risposta AI fallito', { rawContent })
    throw new Error('Risposta AI non in JSON')
  }
  logger.info('Risposta AI generata', { summary: parsed.summary, nRecommended: parsed.recommended.length })
  return parsed
}

// ===============================
// 6. FEEDBACK SU MESSAGGIO (aggiornamento)
// ===============================

/**
 * Aggiorna il feedback di un messaggio (PATCH)
 * @param messageId - Mongo ObjectId del messaggio
 * @param feedback - oggetto feedback ({ rating, comment?, timestamp })
 */
export async function updateMessageFeedback(
  messageId: string,
  feedback: { rating: 'positive' | 'negative' | 'neutral', comment?: string }
): Promise<void> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')
  const timestamp = new Date().toISOString()
  await messages.updateOne(
    { _id: new ObjectId(messageId) },
    { $set: { feedback: { ...feedback, timestamp } } }
  )
  logger.info('Feedback aggiornato', { messageId, feedback })
}
