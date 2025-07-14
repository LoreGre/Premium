/*
curl -X POST 'http://premium.local:3000/api/chat/debug' \
  -H 'Content-Type: application/json' \
  -d '{
    "embedding": xxx,
    "limit": 5
  }'
*/


import { NextResponse } from 'next/server'
import { getMongoClient } from '@/lib/mongo/client'

export async function POST(req: Request) {
  try {
    const { embedding, limit = 5 } = await req.json()

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json({ error: 'Embedding mancante o non valido' }, { status: 400 })
    }

    const client = await getMongoClient()
    const db = client.db()

    const prodotti = await db.collection('prodotti_silan')
      .aggregate([
        {
          $search: {
            index: 'embedding_index',
            knnBeta: {
              vector: embedding,
              path: 'embedding',
              k: limit
            }
          }
        },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            sku: 1,
            name: 1,
            description: 1,
            price: 1,
            qty: 1,
            available: 1,
            supplier: 1,
            category_name: 1,
            thumb_url: 1,
            link: 1
          }
        }
      ])
      .toArray()

    return NextResponse.json({ products: prodotti })

  } catch (err) {
    console.error('Errore debug Mongo embedding:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
