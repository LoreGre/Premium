import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { getMongoCollection } from '@/lib/mongo/client'

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth

  try {
    const prodotti = await getMongoCollection('prodotti')

    const [categorie, colori, taglie] = await Promise.all([
      prodotti.distinct('category_name'),
      prodotti.distinct('colore'),
      prodotti.distinct('taglia')
    ])

    return NextResponse.json({
      category_name: categorie.filter((v): v is string => typeof v === 'string' && v.trim() !== '').sort(),
      colore: colori.filter((v): v is string => typeof v === 'string' && v.trim() !== '').sort(),
      taglia: taglie.filter((v): v is string => typeof v === 'string' && v.trim() !== '').sort(), // ✅ aggiunto
    })
  } catch (err) {
    console.error('Errore fetch filters:', err)
    return NextResponse.json({ error: 'Errore durante il recupero dei filtri' }, { status: 500 })
  }
}
  