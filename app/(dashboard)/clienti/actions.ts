'use client'

import { createClient } from '@/lib/supabase/client'
import { Customer } from './page'

const supabase = createClient()

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('clienti')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertCustomer(data: Partial<Customer>) {
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
      .from('clienti')
      .update(input)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  } else {
    // INSERT
    const { error, data: result } = await supabase
      .from('clienti')
      .insert([input])
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  }

}

export async function deleteCustomer(id: number) {
  const { error } = await supabase
    .from('clienti')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}


export async function fetchCustomerCategories(): Promise<{ label: string; value: string }[]> {
  const { data, error } = await supabase
    .from('categorie')
    .select('label')
    .order('label', { ascending: true })

  if (error) throw new Error(error.message)

  return data?.map((c) => ({ label: c.label, value: c.label })) ?? []
}