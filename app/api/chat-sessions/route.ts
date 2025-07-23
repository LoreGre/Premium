import { NextResponse } from 'next/server'
import { getMongoCollection } from '@/lib/mongo/client'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  // PROTEZIONE AUTH
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth
  const { user } = auth

  try {
    logger.info('Inizio GET /api/chat-sessions', { userId: user.id })

    // 1. Prendo tutte le sessioni chat da Mongo
    const chatSessions = await getMongoCollection('chat_sessions')
    const allSessions = await chatSessions.find({}).toArray()
    logger.info('Sessioni chat caricate', { count: allSessions.length })

    // 2. Estraggo tutti gli user_id unici
    const userIds = [...new Set(allSessions.map(s => s.user_id))]
    logger.info('UserId unici estratti', { userIds })

    // 3. Prendo tutti gli utenti Supabase Auth (admin)
    const supabase = createAdminClient()
    const { data: usersList, error } = await supabase.auth.admin.listUsers()
    logger.info('Risposta Supabase listUsers', { usersList, error })

    if (error || !usersList || !Array.isArray(usersList.users)) {
      logger.error('Errore fetch utenti supabase', { error: error || 'usersList missing or invalid' })
      return NextResponse.json({ error: 'Errore utenti' }, { status: 500 })
    }

    const usersData = usersList.users.filter(u => userIds.includes(u.id))
    logger.info('Utenti filtrati per sessioni', { utenti: usersData.map(u => ({ id: u.id, email: u.email })) })

    // 4. Prendo la collezione dei messaggi
    const chatMessages = await getMongoCollection('chat_messages')

    // 5. Preparo la risposta finale
    const sessionsWithDetails = await Promise.all(
      allSessions.map(async session => {
        // Email utente
        const user = usersData.find(u => u.id === session.user_id)

        // Primo messaggio utente per la sessione
        const firstMsg = await chatMessages.findOne(
          { session_id: session._id.toString(), role: 'user' },
          { sort: { createdAt: 1 } }
        )

        logger.info('Analisi sessione', {
          session_id: session._id.toString(),
          user_id: session.user_id,
          email: user?.email || '—',
          hasFirstMsg: !!firstMsg
        })

        return {
          _id: session._id.toString(),
          user_id: session.user_id,
          email: user?.email || '—',
          updatedAt: session.updatedAt || '',
          firstMessage: firstMsg?.content || ''
        }
      })
    )

    logger.info('Risposta finale inviata', { count: sessionsWithDetails.length })
    return NextResponse.json(sessionsWithDetails)
  } catch (err) {
    logger.error('Errore API chat-sessions', { error: err })
    return NextResponse.json({ error: 'Errore generico' }, { status: 500 })
  }
}
