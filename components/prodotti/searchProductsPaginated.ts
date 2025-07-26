import { getMongoCollection } from '@/lib/mongo/client'
import type { ProductItem } from '@/app/(dashboard)/prodotti/page'
import { Document } from 'mongodb'

export type SearchProductsParams = {
  search?: string
  limit?: number
  offset?: number
  sortBy?: keyof ProductItem
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, string[]>
}

export async function searchProductsPaginated({
  search = '',
  limit = 50,
  offset = 0,
  sortBy = 'name',
  sortDir = 'asc',
  filters = {}
}: SearchProductsParams): Promise<{ data: ProductItem[]; total: number }> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')

  const pipeline: Document[] = []

  const filterConditions: Record<string, unknown> = {}
  Object.entries(filters).forEach(([field, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      filterConditions[field] = { $in: values }
    }
  })

  const query = search.trim()
  const hasQuery = query.length > 0
  const hasFilters = Object.keys(filterConditions).length > 0

  if (hasQuery) {
    pipeline.push({
      $search: {
        index: 'prodotti_index',
        text: {
          query,
          path: ['sku', 'name', 'description', 'category_name', 'colore'],
          fuzzy: {
            maxEdits: 1,
            prefixLength: 2
          }
        }
      }
    })
    if (hasFilters) pipeline.push({ $match: filterConditions })
  } else {
    if (hasFilters) pipeline.push({ $match: filterConditions })
  }

  pipeline.push({
    $facet: {
      data: [
        { $sort: { [sortBy]: sortDir === 'desc' ? -1 : 1 } },
        { $skip: offset },
        { $limit: limit },
        {
          $project: {
            sku: 1,
            name: 1,
            description: 1,
            unit_price: 1,
            qty: 1,
            source: 1,
            category_name: 1,
            thumbnail: 1,
            link: 1,
            colore: 1,
            taglia: 1
          }
        }
      ],
      total: [{ $count: 'count' }]
    }
  })

  const results = await prodotti.aggregate(pipeline, { allowDiskUse: true }).toArray()
  const response = results[0] || {}

  return {
    data: response.data || [],
    total: response.total?.[0]?.count || 0
  }
}
