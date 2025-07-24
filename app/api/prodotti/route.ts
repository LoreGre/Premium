import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { getMongoCollection } from '@/lib/mongo/client'
import { logger } from '@/lib/logger'
import { searchProductsPaginated } from '@/components/prodotti/searchProductsPaginated'
import type { SearchProductsParams } from '@/components/prodotti/searchProductsPaginated'

/**
 * POST /api/prodotti
 * Ricerca paginata e filtrata dei prodotti
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth

  try {
    const body = await req.json() as SearchProductsParams

    const result = await searchProductsPaginated({
      search: body.search || '', // ✅ corretto: usiamo `search`
      limit: body.limit || 50,
      offset: body.offset || 0,
      sortBy: body.sortBy,
      sortDir: body.sortDir,
      filters: body.filters,
    })

    return NextResponse.json(result)
  } catch (err) {
    logger.error('Errore /api/prodotti [POST]', { error: err })
    return NextResponse.json({ error: 'Errore fetch prodotti' }, { status: 500 })
  }
}

/**
 * DELETE /api/prodotti
 * Elimina prodotti in base agli SKU forniti
 */
export async function DELETE(req: Request) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth

  try {
    const { skus } = await req.json()

    if (!Array.isArray(skus)) {
      return NextResponse.json({ error: 'Payload malformato: skus deve essere un array' }, { status: 400 })
    }

    console.log('🔍 SKU da eliminare:', skus)

    const collection = await getMongoCollection('prodotti')
    const result = await collection.deleteMany({ sku: { $in: skus } })

    console.log(`🗑️ Eliminati ${result.deletedCount} prodotti`)

    return NextResponse.json({ success: true, deleted: result.deletedCount })
  } catch (err: any) {
    console.error('❌ Errore /api/prodotti [DELETE]:', err.message ?? err)
    return NextResponse.json({ error: err.message ?? 'Errore durante eliminazione di prodotti' }, { status: 500 })
  }
}
