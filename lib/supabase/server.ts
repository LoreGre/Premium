import { createServerClient } from '@supabase/ssr'
import { nextCookiesAdapter } from './cookies-adapter'

export const createServerClientWrapper = async () => {
  const cookieStorage = await nextCookiesAdapter()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStorage
    }
  )
}
