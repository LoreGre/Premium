import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { getMongoCollection } from '@/lib/mongo/client'

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth

  try {
    const prodotti = await getMongoCollection('prodotti')

    // Tipizziamo esplicitamente Promise.all per evitare errori TS
    const [fornitori, categorieRaw, colori, taglie]: [string[], string[], string[], string[]] = await Promise.all([
      prodotti.distinct('supplier'),
      prodotti.aggregate([
        { $unwind: '$category_name' },
        { $match: { category_name: { $type: 'string' } } },
        { $group: { _id: '$category_name' } },
        { $project: { _id: 0, name: '$_id' } } // 👈 Cambiato quisu
      ]).toArray().then(arr => arr.map(el => el.name)), // 👈 Ricaviamo l’array di stringhe
      prodotti.distinct('colore'),
      prodotti.distinct('taglia')
    ])    

    // Filtri comuni per tutte le categorie testuali
    const filterStrings = (arr: unknown[]): string[] =>
      arr
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
        .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      supplier: filterStrings(fornitori),
      category_name: filterStrings(categorieRaw),
      colore: filterStrings(colori),
      taglia: filterStrings(taglie)
    })
  } catch (err) {
    console.error('Errore fetch filters:', err)
    return NextResponse.json({ error: 'Errore durante il recupero dei filtri' }, { status: 500 })
  }
}
