import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getMongoCollection } from '@/lib/mongo/client'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProductItem } from '@/components/chat/types'

export async function GET(req: Request) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth
  const { user } = auth

  try {
    logger.info('Inizio GET /api/chat-sessions', { userId: user.id })

    // 1. Recupero tutte le sessioni chat
    const chatSessions = await getMongoCollection('chat_sessions')
    const allSessions = await chatSessions
      .find({})
      .sort({ updatedAt: -1 }) // -1 = ordine decrescente
      .toArray()

    logger.info('Sessioni chat caricate', { count: allSessions.length })

    // 2. Prendo tutti gli user Supabase
    const userIds = [...new Set(allSessions.map(s => s.user_id))]
    const supabase = createAdminClient()
    const { data: usersList, error } = await supabase.auth.admin.listUsers()

    if (error || !usersList?.users) {
      logger.error('Errore fetch utenti supabase', { error: error || 'usersList missing' })
      return NextResponse.json({ error: 'Errore utenti' }, { status: 500 })
    }

    const usersData = usersList.users.filter(u => userIds.includes(u.id))

    // 3. Recupero tutti i messaggi una volta sola
    const chatMessages = await getMongoCollection('chat_messages')
    const allMessages = await chatMessages
      .find({ session_id: { $in: allSessions.map(s => new ObjectId(s._id)) } })
      .project({ session_id: 1, role: 1, content: 1, products: 1 })
      .toArray()

    // 4. Mappo la risposta
    const sessionsWithDetails = allSessions.map(session => {
      const sessionIdStr = session._id.toString()
      const sessionMessages = allMessages.filter(msg =>
        msg.session_id.toString() === sessionIdStr
      )

      const firstMsg = sessionMessages.find(m => m.role === 'user')

      const allProducts: ProductItem[] = sessionMessages
        .flatMap(msg => msg.products || [])
        .filter(p => p?.sku)

      const deduped = Object.values(
        allProducts.reduce((acc, p) => {
          acc[p.sku] = p
          return acc
        }, {} as Record<string, ProductItem>)
      )

      const userData = usersData.find(u => u.id === session.user_id)

      return {
        _id: sessionIdStr,
        user_id: session.user_id,
        email: userData?.email || '—',
        updatedAt: session.updatedAt || new Date(session.createdAt).toISOString(),
        firstMessage: firstMsg?.content
          ? firstMsg.content.slice(0, 60) + (firstMsg.content.length > 60 ? '…' : '')
          : '',
        products: deduped.map(p => p.sku)
      }
    })

    logger.info('Risposta finale inviata', { count: sessionsWithDetails.length })
    return NextResponse.json(sessionsWithDetails)
  } catch (err) {
    logger.error('Errore API chat-sessions', { error: err })
    return NextResponse.json({ error: 'Errore generico' }, { status: 500 })
  }
}
