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

    // 📥 1. Scarica file da Supabase
    const { data: file, error: downloadError } = await supabase.storage
      .from('csv-files')
      .download(filename)

    if (downloadError || !file) {
      console.error('❌ Errore download CSV:', downloadError)
      return NextResponse.json({ error: 'Errore download CSV' }, { status: 500 })
    }

    const text = await file.text()

    // 📤 2. Parsea CSV
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
    const batch: { sku: string; qty: number }[] = []
    const skippedInvalid: { row: number; reason: string }[] = []
    const skippedError: { sku: string; reason: string }[] = []

    // 🧠 3. Costruisci batch
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i]
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

      batch.push({ sku, qty })
    }

    // 🗃 4. Upsert unico
    const { error: upsertError } = await supabase
      .from('prodotti')
      .upsert(batch, { onConflict: 'sku' })

    if (upsertError) {
      console.error('❌ Errore upsert batch:', upsertError)
      return NextResponse.json({ error: 'Errore upsert prodotti', details: upsertError }, { status: 500 })
    }

    // 📝 5. Logging finale
    await supabase.from('embedding_logs').insert({
      fornitore,
      filename,
      type: 'stock_run_summary',
      row_number: null,
      sku: null,
      message: `Run completata: ${batch.length} aggiornati, ${skippedInvalid.length} invalidi`,
    })

    // ✅ 6. Risposta finale
    return NextResponse.json({
      success: true,
      updated: batch.length,
      skippedInvalid,
      skippedError, // sempre vuoto in questa versione
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore imprevisto'
    console.error('❌ Errore imprevisto:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
