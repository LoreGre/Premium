'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage, ChatSession } from './types'
import { logger } from '@/lib/logger'


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
    session_id: typeof msg.session_id === 'string' ? new ObjectId(msg.session_id) : msg.session_id!,
    user_id: msg.user_id!,
    role: msg.role!,
    content: msg.content!,
    createdAt: msg.createdAt || new Date().toISOString(),
    products: msg.products,
    recommended: msg.recommended,
    intent: msg.intent,
    embedding: msg.embedding,
    feedback: msg.feedback,
    entities: msg.entities
  }

  const { insertedId } = await messages.insertOne(toInsert)

  const sessions = await getMongoCollection<ChatSession>('chat_sessions')
  await sessions.updateOne(
    { _id: toInsert.session_id },
    { $set: { updatedAt: new Date().toISOString() } }
  )

  logger.info('Messaggio salvato su Mongo', {
    role: msg.role,
    session_id: toInsert.session_id.toString(),
    messageId: insertedId.toString()
  })

  return insertedId.toString()
}