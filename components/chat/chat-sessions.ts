'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage, ChatSession } from './types'
import { logger } from '@/lib/logger'


function cleanMongoObject<T>(obj: T): T {
return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object' && value._bsontype === 'ObjectID') {
    return value.toString()
    }
    return value
}))
}


export async function createChatSession(userId: string): Promise<string> {
    const sessions = await getMongoCollection<ChatSession>('chat_sessions')
    const now = new Date().toISOString()
    const res = await sessions.insertOne({
      user_id: userId,
      createdAt: now,
      updatedAt: now
    })
    logger.info('Sessione creata', { userId, sessionId: res.insertedId.toString() })
    return res.insertedId.toString()
  }



export async function getSessionHistoryMongo(sessionId: string, limit = 10) {
    const messages = await getMongoCollection<ChatMessage>('chat_messages')
    const history = await messages
      .find({ session_id: new ObjectId(sessionId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  
    return history.reverse().map(cleanMongoObject) // ✅ fix qui
  }
  