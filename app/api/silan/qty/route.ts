import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Papa from 'papaparse'
import { updateQtyInMongo } from '@/lib/api/silan/mongo/updateQty'
import type { QtyUpdateRow, RowCSV } from '@/lib/api/silan/types'

// CONFIG
const BUCKET = 'csv-files'
const CSV_PATH = 'silan_stock_price_full.csv'
const API_KEY = process.env.PREMIUM_SECRET_TOKEN

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '500', 10)

  const key = req.headers.get('x_api_key')
  if (key !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(CSV_PATH)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to load CSV' }, { status: 500 })
  }

  const text = await data.text()
  const parsed = Papa.parse<RowCSV>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
  })

  const rawRows = parsed.data.slice(offset, offset + limit)

  const validRows: QtyUpdateRow[] = []
  const invalid: string[] = []

  for (const row of rawRows) {
    const sku = (row.sku || '').toString().trim()
    const qty = parseInt(row.qty || '')

    if (!sku || isNaN(qty)) {
      invalid.push(sku || 'N/A')
      continue
    }

    validRows.push({ sku, qty, raw: row })
  }

  await updateQtyInMongo(validRows)

  const nextOffset = offset + limit
  const next = rawRows.length === limit

  return NextResponse.json({
    success: true,
    offset,
    limit,
    count: validRows.length,
    invalid,
    nextOffset,
    next,
  })

}
