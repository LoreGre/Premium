import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateMessageFeedback } from '@/components/chat/chat-actions'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient()
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      logger.warn('Token mancante nel feedback')
      return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      logger.warn('Utente non autenticato per feedback', { authError })
      return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 })
    }

    const { messageId, rating, comment } = await req.json()

    if (!messageId || !rating) {
      logger.warn('Dati mancanti nel feedback')
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    await updateMessageFeedback(messageId, { rating, comment })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Errore API feedback', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
