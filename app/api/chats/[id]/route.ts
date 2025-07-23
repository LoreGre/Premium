import { NextRequest, NextResponse } from 'next/server'
import { getMongoCollection } from '@/lib/mongo/client'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { logger } from '@/lib/logger'
import { ObjectId } from 'mongodb'

export async function DELETE(req: NextRequest) {
  const auth = await requireAuthUser(req)
  if (!('user' in auth)) return auth

  const { user } = auth
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json({ error: 'ID mancante' }, { status: 400 })
  }

  const collection = await getMongoCollection('chat_sessions')
  const res = await collection.deleteOne({
    _id: new ObjectId(id),
    user_id: user.id,
  })

  if (res.deletedCount === 0) {
    return NextResponse.json({ error: 'Nessuna sessione trovata' }, { status: 404 })
  }

  logger.info('Sessione eliminata', { id, userId: user.id })

  return NextResponse.json({ success: true })
}
