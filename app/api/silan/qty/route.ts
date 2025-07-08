import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createAdminClient } from '@/lib/supabase/admin'

type RowQuantita = {
  sku: string
  qty: string
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.EMBEDDING_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const fornitore = 'silan'
    const filename = 'silan_stock_price_full.csv'

    // 1. Scarica file
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

    const rawRows = parseResult.data
    const skippedInvalid: { row: number; reason: string }[] = []
    const skippedError: { sku: string; reason: string }[] = []
    let updated = 0

    // 3. Mappa SKU→qty validi
    const validRows = rawRows.map((row, i) => {
      const rowNumber = i + 2
      const sku = row.sku?.trim()
      const qty = parseInt(row.qty)

      if (!sku || isNaN(qty)) {
        const reason = !sku ? 'SKU mancante' : 'Quantità non valida'
        skippedInvalid.push({ row: rowNumber, reason })
        return null
      }

      return { sku, qty, rowNumber }
    }).filter(Boolean) as { sku: string; qty: number; rowNumber: number }[]

    if (validRows.length === 0) {
      return NextResponse.json({ success: false, updated: 0, skippedInvalid, skippedError })
    }

    // 4. Prendi tutti gli SKU esistenti
    const { data: existingSkus } = await supabase
      .from('prodotti')
      .select('sku')

    const skuSet = new Set((existingSkus || []).map((r) => r.sku))

    // 5. Per ogni riga valida, aggiorna solo se SKU esiste
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
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore imprevisto'
    console.error('❌ Errore imprevisto:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
