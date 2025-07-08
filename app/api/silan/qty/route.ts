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

    const { data: file, error: downloadError } = await supabase.storage
      .from('csv-files')
      .download(filename)

    if (downloadError || !file) {
      console.error('❌ Errore download CSV:', downloadError)
      return NextResponse.json({ error: 'Errore download CSV' }, { status: 500 })
    }

    const text = await file.text()
    const parseResult = Papa.parse(text, {
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

    const rows = parseResult.data as RowQuantita[]
    let updated = 0
    const skippedInvalid: { row: number; reason: string }[] = []
    const skippedError: { sku: string; reason: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2
      const sku = row.sku?.trim()
      const qty = parseInt(row.qty)

      if (!sku || isNaN(qty)) {
        const reason = !sku ? 'SKU mancante' : 'Quantità non valida'
        skippedInvalid.push({ row: rowNumber, reason })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'stock_error',
          row_number: rowNumber,
          sku: sku || null,
          message: reason,
        })
        continue
      }

      const { data: existing, error: lookupError } = await supabase
        .from('prodotti')
        .select('sku')
        .eq('sku', sku)
        .maybeSingle()

      if (lookupError || !existing) {
        skippedError.push({ sku, reason: 'SKU non trovato in prodotti' })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'stock_error',
          row_number: rowNumber,
          sku,
          message: 'SKU non trovato in prodotti',
        })
        continue
      }

      const { error: updateError } = await supabase
        .from('prodotti')
        .update({ qty })
        .eq('sku', sku)

      if (updateError) {
        skippedError.push({ sku, reason: updateError.message })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'stock_error',
          row_number: rowNumber,
          sku,
          message: updateError.message,
        })
      } else {
        updated++
      }
    }

    await supabase.from('embedding_logs').insert({
      fornitore,
      filename,
      type: 'stock_run_summary',
      row_number: null,
      sku: null,
      message: `Run completata: ${updated} aggiornati, ${skippedInvalid.length} invalidi, ${skippedError.length} errori`
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
