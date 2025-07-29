import { NextRequest, NextResponse } from 'next/server'
import { getMongoCollection } from '@/lib/mongo/client'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { logger } from '@/lib/logger'
import { ObjectId } from 'mongodb'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthUser(req)
  if (!('user' in auth)) return auth

  const { user } = auth
  const id = params.id

  if (!id) {
    return NextResponse.json({ error: 'ID mancante' }, { status: 400 })
  }

  const sessionId = new ObjectId(id)
  const sessions = await getMongoCollection('chat_sessions')
  const messages = await getMongoCollection('chat_messages')

  try {
    const res = await sessions.deleteOne({ _id: sessionId, user_id: user.id })

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: 'Nessuna sessione trovata' }, { status: 404 })
    }

    const msgResult = await messages.deleteMany({ session_id: sessionId })

    logger.info('Sessione e messaggi eliminati', {
      sessionId: id,
      deletedMessages: msgResult.deletedCount,
      userId: user.id
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Errore eliminazione sessione e messaggi', err)
    return NextResponse.json({ error: 'Errore durante la cancellazione' }, { status: 500 })
  }
}
