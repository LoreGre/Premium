'use server'

import { getMongoCollection } from '@/lib/mongo/client'
import type { ProductItem, ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

export async function vectorMongoSearch(
  embedding: number[],
  limit = 10
): Promise<ProductItem[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')
  
    const pipeline = [
      {
        $vectorSearch: {
          index: 'prodotti_vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          sku: 1,
          name: 1,
          description: 1,
          thumbnail: 1,
          color: 1,
          size: 1,
          supplier: 1,
          category_name: 1,
          unit_price: 1,
          qty: 1,
          score: 1
        }
      }
    ]
  
    const results = await prodotti.aggregate<ProductItem>(pipeline).toArray()
  
    logger.info('[vectorMongoSearch] Risultati vector search', {
      count: results.length
    })
  
    return results
  }