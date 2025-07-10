//curl -v -X POST 'http://premium.local:3000/api/silan/qty?limit=500' \
//-H "x_api_key: 4hRD3xGJqx4ktjeHWtyVrapg2i7a35T5PKrMxFoI1IBVwBvPge5eQ3AJchr7r9dl" \
//-H "Content-Type: application/json"

import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createAdminClient } from '@/lib/supabase/admin'

type RowQuantita = {
  sku: string
  qty: string
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x_api_key')
    if (apiKey !== process.env.PREMIUM_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const fornitore = 'silan'
    const filename = 'silan_stock_price_full.csv'

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '500')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 1. Scarica file CSV
    const { data: file, error: downloadError } = await supabase.storage
      .from('csv-files')
      .download(filename)

    if (downloadError || !file) {
      console.error('❌ Errore download CSV:', downloadError)
      return NextResponse.json({ error: 'Errore download CSV' }, { status: 500 })
    }

    const text = await file.text()

    // 2. Parse CSV
    const parseResult = Papa.parse<RowQuantita>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
    })

    if (parseResult.errors.length > 0) {
      console.error('❌ Errori parsing CSV:', parseResult.errors)
      return NextResponse.json({
        error: 'Parsing CSV fallito',
        details: parseResult.errors,
      }, { status: 400 })
    }

    const allRows = parseResult.data
    const slice = allRows.slice(offset, offset + limit)

    const skippedInvalid: { row: number; reason: string }[] = []
    const skippedError: { sku: string; reason: string }[] = []
    let updated = 0

    const validRows = slice.map((row, i) => {
      const rowNumber = offset + i + 2
      const sku = row.sku?.trim()
      const qty = parseInt(row.qty)

      if (!sku || isNaN(qty)) {
        const reason = !sku ? 'SKU mancante' : 'Quantità non valida'
        skippedInvalid.push({ row: rowNumber, reason })
        return null
      }

      return { sku, qty, rowNumber }
    }).filter(Boolean) as { sku: string; qty: number; rowNumber: number }[]

    // 3. Prendi tutti gli SKU
    const { data: existingSkus } = await supabase
      .from('prodotti')
      .select('sku')

    const skuSet = new Set((existingSkus || []).map((r) => r.sku))

    // 4. Update
    for (const row of validRows) {
      if (!skuSet.has(row.sku)) {
        skippedError.push({ sku: row.sku, reason: 'SKU non presente in tabella prodotti' })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'stock_error',
          row_number: row.rowNumber,
          sku: row.sku,
          message: 'SKU non presente in tabella prodotti',
        })
        continue
      }

      const { error } = await supabase
        .from('prodotti')
        .update({ qty: row.qty })
        .eq('sku', row.sku)

      if (error) {
        skippedError.push({ sku: row.sku, reason: error.message })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'stock_error',
          row_number: row.rowNumber,
          sku: row.sku,
          message: error.message,
        })
      } else {
        updated++
      }
    }

    // 5. Fine
    const nextOffset = offset + limit
    const next = nextOffset < allRows.length

    // 6. Log finale
    await supabase.from('embedding_logs').insert({
      fornitore,
      filename,
      type: 'stock_run_summary',
      row_number: null,
      sku: null,
      message: `Run completata: ${updated} aggiornati, ${skippedInvalid.length} invalidi, ${skippedError.length} errori`,
    })
    
    return NextResponse.json({
      success: true,
      updated,
      skippedInvalid,
      skippedError,
      next,
      nextOffset: next ? nextOffset : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore imprevisto'
    console.error('❌ Errore imprevisto:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
