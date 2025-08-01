

import { getMongoCollection } from '@/lib/mongo/client'
import type { ProductItem, ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

/* 🔹 VECTOR SEARCH (già esistente) */
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
    { $sort: { score: -1 } },
    { $limit: limit },
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
  logger.info('[vectorMongoSearch] Risultati vector search', { count: results.length })
  return results
}

/* 🔹 TEXT SEARCH (Atlas $search) */
export async function textMongoSearch(
  query: string,
  limit = 10
): Promise<ProductItem[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')

  const pipeline = [
    {
      $search: {
        index: 'prodotti_text_index',
        text: {
          query,
          path: ['name', 'description', 'category_name', 'supplier', 'color']
        }
      }
    },
    { $limit: limit },
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
        score: { $meta: 'searchScore' }
      }
    }
  ]

  const results = await prodotti.aggregate<ProductItem>(pipeline).toArray()
  logger.info('[textMongoSearch] Risultati text search', { count: results.length })
  return results
}

/* 🔀 HYBRID SEARCH (vector + text fusion) */
export async function searchHybridMongo(
  embedding: number[],
  query: string,
  limit = 10,
  vectorPriority = 0,
  textPriority = 0
): Promise<ProductItem[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')

  const vectorPipeline = [
    { $vectorSearch: {
        index: 'prodotti_vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 100,
        limit
    }},
    { $group: { _id: null, docs: { $push: "$$ROOT" } } },
    { $unwind: { path: "$docs", includeArrayIndex: "rank" } },
    { $addFields: {
        vs_score: {
          $divide: [1.0, { $add: ["$rank", vectorPriority, 1] }]
        }
    }},
    { $project: {
        vs_score: 1,
        _id: "$docs._id",
        sku: "$docs.sku",
        name: "$docs.name",
        description: "$docs.description",
        thumbnail: "$docs.thumbnail",
        color: "$docs.color",
        size: "$docs.size",
        supplier: "$docs.supplier",
        category_name: "$docs.category_name",
        unit_price: "$docs.unit_price",
        qty: "$docs.qty"
    }}
  ]

  const textPipeline = [
    { $search: {
        index: 'prodotti_text_index',
        text: {
          query,
          path: ['name', 'description', 'category_name', 'supplier', 'color']
        }
    }},
    { $limit: limit },
    { $group: { _id: null, docs: { $push: "$$ROOT" } } },
    { $unwind: { path: "$docs", includeArrayIndex: "rank" } },
    { $addFields: {
        ts_score: {
          $divide: [1.0, { $add: ["$rank", textPriority, 1] }]
        }
    }},
    { $project: {
        ts_score: 1,
        _id: "$docs._id",
        sku: "$docs.sku",
        name: "$docs.name",
        description: "$docs.description",
        thumbnail: "$docs.thumbnail",
        color: "$docs.color",
        size: "$docs.size",
        supplier: "$docs.supplier",
        category_name: "$docs.category_name",
        unit_price: "$docs.unit_price",
        qty: "$docs.qty"
    }}
  ]

  const pipeline = [
    ...vectorPipeline,
    {
      $unionWith: {
        coll: 'prodotti',
        pipeline: textPipeline
      }
    },
    {
      $group: {
        _id: "$_id",
        sku: { $first: "$sku" },
        name: { $first: "$name" },
        description: { $first: "$description" },
        thumbnail: { $first: "$thumbnail" },
        color: { $first: "$color" },
        size: { $first: "$size" },
        supplier: { $first: "$supplier" },
        category_name: { $first: "$category_name" },
        unit_price: { $first: "$unit_price" },
        qty: { $first: "$qty" },
        vs_score: { $max: "$vs_score" },
        ts_score: { $max: "$ts_score" }
      }
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
        score: {
          $add: [
            { $ifNull: ["$vs_score", 0] },
            { $ifNull: ["$ts_score", 0] }
          ]
        }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]

  const results = await prodotti.aggregate<ProductItem>(pipeline).toArray()
  logger.info('[searchHybridMongo] Risultati hybrid search', { count: results.length })
  return results
}

/* 🧹 FILTRO post-search basato su entità */
export function filterProductsByEntities(
  products: ProductItem[],
  entities: ExtractedEntity[]
): ProductItem[] {
  const colors = entities.filter(e => e.type === 'color').map(e => e.value.toLowerCase())
  const sizes = entities.filter(e => e.type === 'size').map(e => e.value.toUpperCase())

  return products.filter(p => {
    const colorOk = colors.length === 0 || (p.color && colors.includes(p.color.toLowerCase()))
    const sizeOk = sizes.length === 0 || (p.size && sizes.includes(p.size.toUpperCase()))
    return colorOk && sizeOk
  })
}
