'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage, ChatSession, FallbackSource } from './types'
import { logger } from '@/lib/logger'

export type SaveChatMessageParams = {
  session_id: string | ObjectId
  user_id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  embedding?: number[]
  products?: ChatMessage['products']
  intent?: string
  feedback?: ChatMessage['feedback']
  entities?: ChatMessage['entities']
  source?: FallbackSource
}

export async function saveMessageMongo(params: SaveChatMessageParams): Promise<string> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')

  const sessionObjectId = typeof params.session_id === 'string'
    ? new ObjectId(params.session_id)
    : params.session_id

  const baseMessage: ChatMessage = {
    session_id: sessionObjectId,
    user_id: params.user_id,
    role: params.role,
    content: params.content,
    createdAt: params.createdAt ?? new Date().toISOString(),
    products: params.products,
    intent: params.intent,
    embedding: params.embedding,
    feedback: params.feedback,
    entities: params.entities,
    source: params.source
  }

  // 🔍 Rimuove i campi undefined/null
  const toInsert = Object.fromEntries(
    Object.entries(baseMessage).filter(([, value]) => value !== undefined && value !== null)
  ) as ChatMessage  

  const { insertedId } = await messages.insertOne(toInsert)

  // ⏱️ aggiorna updatedAt nella sessione
  const sessions = await getMongoCollection<ChatSession>('chat_sessions')
  await sessions.updateOne(
    { _id: sessionObjectId },
    { $set: { updatedAt: new Date().toISOString() } }
  )

  logger.info('Messaggio salvato su Mongo', {
    role: toInsert.role,
    session_id: sessionObjectId.toString(),
    messageId: insertedId.toString()
  })

  return insertedId.toString()
}
