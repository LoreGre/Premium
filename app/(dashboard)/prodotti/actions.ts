'use client'

import { createClient } from '@/lib/supabase/client'
import type { ProductItem } from './page'

export type QueryParams = {
  search?: string
  filters?: Record<string, string[]>
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export async function fetchProducts(params: QueryParams): Promise<{ data: ProductItem[]; total: number }> {
  const supabase = createClient()
  const { data: sessionData, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  if (!sessionData.session) throw new Error('Sessione non trovata')

  const token = sessionData.session.access_token

  const res = await fetch(`/api/prodotti`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params),
    cache: 'no-store'
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Errore API Fetch Prodotti:', errText)
    throw new Error('Errore fetch prodotti')
  }
  
  return res.json()
}

export async function deleteProducts(skus: string[]): Promise<void> {
  const supabase = createClient()
  const { data: sessionData, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  if (!sessionData.session) throw new Error('Sessione non trovata')

  const token = sessionData.session.access_token

  const res = await fetch(`/api/prodotti`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ skus }), // ✅ wrap con chiave
    cache: 'no-store'
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Errore API Delete:', errText)
    throw new Error('Errore eliminazione prodotti')
  }
}
