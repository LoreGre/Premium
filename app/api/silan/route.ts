import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Papa from 'papaparse'
import { parseRow } from '@/lib/api/silan/parseRow'
import { upsertProdottoMongo } from '@/lib/api/silan/mongo/upsert'
import { RowCSV } from '@/lib/api/silan/types'
import { logInfo } from '@/lib/api/silan/log' // ✅ importa logInfo

// CONFIG
const BUCKET = 'csv-files'
const CSV_PATH = 'silan_master_file_full.csv'
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
  })

  const rows = parsed.data.slice(offset, offset + limit)

  const result = {
    offset,
    limit,
    count: rows.length,
    inserted: [] as string[],
    updated: [] as string[],
    skipped: [] as string[],
    invalid: [] as string[],
  }

  for (const row of rows) {
    const parsedRow = await parseRow(row)
    if (!parsedRow) {
      result.invalid.push(row.sku || 'N/A')
      continue
    }
  
    const { prodotto, content_hash } = parsedRow
    const status = await upsertProdottoMongo({ prodotto, content_hash })
  
    if (status === 'inserted') result.inserted.push(prodotto.sku)
    else if (status === 'updated') result.updated.push(prodotto.sku)
    else result.skipped.push(prodotto.sku)
  }

  // ✅ Log finale riepilogativo
  await logInfo({
    type: 'batch_upsert',
    message: `Batch completato - offset: ${offset}, limit: ${limit}`,
    extra: {
      inserted: result.inserted.length,
      updated: result.updated.length,
      skipped: result.skipped.length,
      invalid: result.invalid.length,
      total: result.count,
    },
  })

  const nextOffset = offset + limit
  const next = rows.length === limit

  return NextResponse.json({
    success: true,
    ...result,
    nextOffset,
    next,
  })

}
