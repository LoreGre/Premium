import type { ProdottoMongo } from '../types'
import { getMongoClient } from '@/lib/mongo/client'
import {
  MONGO_DB_NAME,
  MONGO_COLLECTION_PRODOTTI,
  LOG_TYPE_MONGO_ERROR,
} from '../constants'
import { logError } from '../log'

type UpsertResult = 'inserted' | 'updated' | 'skipped'

export async function upsertProdottoMongo(params: {
  prodotto: ProdottoMongo
}): Promise<UpsertResult> {
  const { prodotto } = params

  try {
    const client = await getMongoClient()
    const db = client.db(MONGO_DB_NAME)
    const col = db.collection<ProdottoMongo>(MONGO_COLLECTION_PRODOTTI)

    const existing = await col.findOne<{ content_hash?: string }>({ sku: prodotto.sku })

    if (existing && existing.content_hash === prodotto.content_hash) {
      return 'skipped'
    }

    const now = new Date()
    const { created_at, ...prodottoSenzaCreatedAt } = prodotto

    const result = await col.updateOne(
      { sku: prodotto.sku },
      {
        $set: {
          ...prodottoSenzaCreatedAt,
          updated_at: now,
        },
        $setOnInsert: {
          created_at,
        },
      },
      { upsert: true }
    )

    if (result.upsertedCount > 0) return 'inserted'
    if (result.modifiedCount > 0) return 'updated'
    return 'skipped'
  } catch (err) {
    await logError({
      type: LOG_TYPE_MONGO_ERROR,
      sku: prodotto.sku,
      message: 'MongoDB upsert failed',
      extra: {
        message: err instanceof Error ? err.message : JSON.stringify(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
    })
    throw err
  }
}
