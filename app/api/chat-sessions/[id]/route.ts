import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { logger } from '@/lib/logger'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth
  const { user } = auth

  try {
    const sessionId = params.id
    const sessionObjectId = new ObjectId(sessionId)

    logger.info('Eliminazione sessione richiesta', { sessionId, userId: user.id })

    const chatSessions = await getMongoCollection('chat_sessions')
    const chatMessages = await getMongoCollection('chat_messages')

    const res = await chatSessions.deleteOne({ _id: sessionObjectId })

    if (res.deletedCount === 0) {
      logger.warn('Sessione non trovata', { sessionId })
      return NextResponse.json({ error: 'Sessione non trovata' }, { status: 404 })
    }

    const deleteMessages = await chatMessages.deleteMany({ session_id: sessionObjectId })
    logger.info('Messaggi eliminati per sessione', {
      sessionId,
      deletedMessages: deleteMessages.deletedCount
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Errore eliminazione sessione', { error: err })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
