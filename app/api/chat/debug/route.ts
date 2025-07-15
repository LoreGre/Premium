/*
curl -X POST 'http://premium.local:3000/api/chat/debug' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "cappelli blu",
    "limit": 5
  }'

  curl -X POST 'http://premium.local:3000/api/chat/debug' \
  -H 'Content-Type: application/json' \
  -d '{
    "embedding": [0.01, 0.02, 0.03, ...],
    "limit": 5
  }'

*/
import { NextResponse } from 'next/server'
import { getMongoClient } from '@/lib/mongo/client'

export async function POST(req: Request) {
  try {
    const client = await getMongoClient()
    const db = client.db('Premium')

    // Query test su "cappelli"
    const test = await db.collection('prodotti')
      .find({ name: /cappelli/i })
      .limit(5)
      .toArray()

    console.log('[DEBUG find cappelli]', test)

    return NextResponse.json({
      success: true,
      count: test.length,
      items: test
    })
  } catch (err) {
    console.error('[POST /api/chat/debug] Errore:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
