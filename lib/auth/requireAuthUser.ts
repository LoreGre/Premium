import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * Controlla autenticazione. 
 * Se fallisce, restituisce NextResponse 401; 
 * se ok, restituisce { user }
 */
export async function requireAuthUser(req: Request) {
  const supabase = createAdminClient()
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  // Raccolta informazioni per il log
  const url = req.url || 'unknown URL'
  const userAgent = req.headers.get('user-agent') || 'unknown user-agent'
  const ip = req.headers.get('x-forwarded-for') || 'unknown IP'

  if (!token) {
    logger.warn('Token mancante nella richiesta protetta', {
      url,
      userAgent,
      ip,
    })
    return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    logger.warn('Utente non autenticato o token invalido', {
      authError,
      url,
      userAgent,
      ip,
    })
    return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 })
  }

  return { user }
}
