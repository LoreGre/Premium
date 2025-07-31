'use server'

import type { ProductItem, ChatMessage, ExtractedEntity } from './types'
import { vectorMongoSearch } from './chat-search-mongo'
import { logger } from '@/lib/logger'

function mergeEntitiesAcrossTurns(
  history: ChatMessage[],
  currentEntities: ExtractedEntity[]
): ExtractedEntity[] {
  const entityMap = new Map<string, ExtractedEntity>()

  for (const msg of history) {
    if (msg.role !== 'user') continue
    const pastEntities = msg.entities || []
    for (const ent of pastEntities) {
      const key = `${ent.type}:${String(ent.value).toLowerCase()}`
      entityMap.set(key, ent)
    }
  }

  for (const ent of currentEntities) {
    const key = `${ent.type}:${String(ent.value).toLowerCase()}`
    entityMap.set(key, ent)
  }

  return Array.from(entityMap.values())
}

export async function getProducts(
  message: string,
  embedding: number[],
  history: ChatMessage[],
  entities: ExtractedEntity[],
  maxResults = 10
): Promise<{ products: ProductItem[]; entities: ExtractedEntity[] }> {
  const mergedEntities = mergeEntitiesAcrossTurns(history, entities)
  logger.info('[getProducts] Entità finali dopo fusione', { entities: mergedEntities })

  if (mergedEntities.length === 0) {
    logger.warn('[getProducts] Nessuna entità trovata')
    return { products: [], entities: [] }
  }

  const products = await vectorMongoSearch(
    embedding,
    maxResults
  )
  logger.info('[getProducts] Prodotti trovati con vectorMongoSearch', {
    count: products.length
  })

  return { products, entities: mergedEntities }
}
