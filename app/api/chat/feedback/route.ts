import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { updateMessageFeedback } from '@/components/chat/chat-actions'
import { logger } from '@/lib/logger'

const validRatings = ['positive', 'negative', 'neutral'] as const

export async function POST(req: Request) {
  try {
    // Autenticazione unica via utility
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth

    const { messageId, rating, comment } = await req.json()

    if (!messageId || !rating) {
      logger.warn('Dati mancanti nel feedback')
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    if (!validRatings.includes(rating)) {
      logger.warn('Rating non valido nel feedback', { rating })
      return NextResponse.json({ error: 'Rating non valido' }, { status: 400 })
    }

    if (typeof messageId !== 'string' || messageId.length !== 24) {
      logger.warn('messageId non valido', { messageId })
      return NextResponse.json({ error: 'ID messaggio non valido' }, { status: 400 })
    }

    await updateMessageFeedback(messageId, { rating, comment })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Errore API feedback', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
