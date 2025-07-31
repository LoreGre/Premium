'use server'

import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import type { ChatMessage } from './types'
import { logger } from '@/lib/logger'


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