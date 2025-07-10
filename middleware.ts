import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
//import { nextCookiesAdapter } from './lib/supabase/cookies-adapter'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: req.headers }
  })

  // Adapter read-only per i cookie
  const cookieStorage = {
    getAll: () => req.cookies.getAll().map(({ name, value }) => ({ name, value })),
    setAll: () => {} // NO-OP: non fa nulla!
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStorage
    }
  )

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*']
}
