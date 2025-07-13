import { getMongoClient } from '@/lib/mongo/client'
import { normalizeSku } from '../normalizeSku'
import { logError } from '../logError'
import { logSkippedRow } from '../logSkipped'
import {
  MONGO_DB_NAME,
  MONGO_COLLECTION_PRODOTTI,
  LOG_TYPE_MONGO_ERROR,
} from '../constants'
import type { QtyUpdateRow } from '../types'

export async function updateQtyInMongo(rows: QtyUpdateRow[]): Promise<void> {
  const client = await getMongoClient()
  const db = client.db(MONGO_DB_NAME)
  const col = db.collection(MONGO_COLLECTION_PRODOTTI)

  for (const row of rows) {
    try {
      const normalized = normalizeSku(row.sku)

      if (!normalized) {
        await logSkippedRow({
          reason: 'SKU vuoto dopo normalizzazione',
          raw: row.raw ?? { sku: row.sku, name: '' },
        })
        continue
      }

      const result = await col.updateOne(
        { normalized_sku: normalized },
        {
          $set: {
            qty: row.qty,
            updated_at: new Date(),
          },
        }
      )

      if (result.matchedCount === 0) {
        await logSkippedRow({
          reason: 'SKU non trovato in MongoDB',
          raw: row.raw ?? { sku: row.sku, name: '' },
        })
      }
    } catch (err) {
      await logError({
        type: LOG_TYPE_MONGO_ERROR,
        sku: row.sku,
        message: 'MongoDB qty update failed',
        extra: {
          message: err instanceof Error ? err.message : JSON.stringify(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
      })
    }
  }
}
