'use client'

import { createClient } from '@/lib/supabase/client'
import { Supplier } from './page'

const supabase = createClient()

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('fornitori')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchSupplierCategories(): Promise<{ label: string; value: string }[]> {
  const { data, error } = await supabase
    .from('categorie_fornitore')
    .select('label')
    .order('label', { ascending: true })

  if (error) throw new Error(error.message)

  return data?.map((c) => ({ label: c.label, value: c.label })) ?? []
}


export async function upsertSupplier(data: Partial<Supplier>) {
  const { id, ...rest } = data

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw new Error(userError.message)
  if (!user) throw new Error('Utente non autenticato')

  const input = {
    ...rest,
    user_id: user.id,
  }

  if (id) {
    // UPDATE
    const { error, data: result } = await supabase
      .from('fornitori')
      .update(input)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  } else {
    // INSERT
    const { error, data: result } = await supabase
      .from('fornitori')
      .insert([input])
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  }

}
export async function deleteSupplier(id: number) {
  const { error } = await supabase
    .from('fornitori')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}





