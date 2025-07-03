import { cookies } from 'next/headers'
import type { SerializeOptions } from 'cookie'

export async function nextCookiesAdapter() {
  const store = await cookies()

  return {
    // Supabase SSR si aspetta un array di { name, value, options }
    getAll(): { name: string; value: string; options?: SerializeOptions }[] {
      return store.getAll().map(({ name, value }) => ({ name, value }))
    },
    // Vercel/Next ti permette di settare direttamente i cookie
    setAll(cookiesToSet: { name: string; value: string; options?: SerializeOptions }[]) {
      cookiesToSet.forEach(({ name, value, options }) => {
        store.set(name, value, options)
      })
    }
  }
}
