

import { getMongoCollection } from '@/lib/mongo/client'
import type { ExtractedEntity, ProductItem } from './types'

export function shouldUseOnlySkuSearch(entities: ExtractedEntity[]): boolean {
  if (!entities.length) return false
  const types = new Set(entities.map(e => e.type))
  return types.size === 1 && types.has('sku')
}

export function getSkuValues(entities: ExtractedEntity[]): string[] {
  return entities
    .filter(e => e.type === 'sku')
    .map(e => e.value.toUpperCase()) // normalizziamo
}

export async function findProductsBySku(skus: string[]): Promise<ProductItem[]> {
  if (!skus.length) return []

  const prodotti = await getMongoCollection<ProductItem>('prodotti')

  const results = await prodotti
    .find({ sku: { $in: skus } })
    .project({
      sku: 1,
      name: 1,
      description: 1,
      thumbnail: 1,
      color: 1,
      size: 1,
      supplier: 1,
      category_name: 1,
      unit_price: 1,
      qty: 1
    })
    .toArray() as ProductItem[]

  return results
}