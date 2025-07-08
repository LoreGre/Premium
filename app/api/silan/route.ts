import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import Papa from 'papaparse'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

type RowCSV = {
  sku: string
  name: string
  description?: string
  unit_price?: string
  category_name?: string
  taglia?: string
  colore?: string
  parent_sku?: string
  type?: string
  visibility?: string
}

type EmbeddingRow = {
  fornitore: string
  content: string
  content_hash: string
  embedding: number[]
  sku: string
  parent_sku?: string
  unit_price?: string
  category_name?: string
  taglia?: string
  colore?: string
  type?: string
  visibility?: string
  updated_at: string
}

type ProdottoRow = {
  sku: string
  name: string
  description?: string
  unit_price?: string
  category_name?: string
  taglia?: string
  colore?: string
  parent_sku?: string
  type?: string
  visibility?: string
  fornitore: string
  updated_at: string
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.EMBEDDING_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const fornitore = 'silan'
    const filename = `${fornitore}_master_file_full.csv`

    // 📥 1. Scarica CSV da Supabase Storage
    const { data: file, error: downloadError } = await supabase.storage
      .from('csv-files')
      .download(filename)

    if (downloadError || !file) {
      console.error('❌ Errore download CSV:', downloadError)
      return NextResponse.json({ error: 'Errore download CSV' }, { status: 500 })
    }

    // 📄 2. Parse CSV
    const text = await file.text()
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseResult.errors.length > 0) {
      console.error('❌ Errori di parsing CSV:', parseResult.errors)
      return NextResponse.json({
        error: 'Parsing CSV fallito',
        details: parseResult.errors,
      }, { status: 400 })
    }

    const rows = parseResult.data as RowCSV[]
    const rowsToUpsert: EmbeddingRow[] = []
    const rowsProdottiToUpsert: ProdottoRow[] = []
    const skippedInvalid: { row: number; reason: string }[] = []
    const skippedError: { sku: string; reason: string }[] = []

    // 🧹 3. Validazione righe base
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // header + base-0
      if (!row.sku || !row.name) {
        const reason = !row.sku ? 'SKU mancante' : 'Name mancante'
        skippedInvalid.push({ row: rowNumber, reason })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'invalid',
          row_number: rowNumber,
          sku: row.sku || null,
          message: reason,
        })
      }
    }

    // 🎯 4. Filtra valide + limit 500
    const filteredRows = rows.filter(r => r.sku && r.name).slice(0, 500)

    for (const row of filteredRows) {
      const nome = row.name?.trim() || ''
      const descrizione = row.description?.trim() || ''
      const prezzo = row.unit_price?.trim() || ''
      const categoria = row.category_name?.trim() || ''
      const taglia = row.taglia?.trim() || ''
      const colore = row.colore?.trim() || ''

      const content = `Prodotto: ${nome}. Categoria: ${categoria}. Prezzo: ${prezzo}€. Taglia: ${taglia}. Colore: ${colore}. ${descrizione}`
      const content_hash = hashContent(content)

      try {
        // 🔁 Verifica se già presente
        const { data: existing } = await supabase
          .from('embedding_prodotti')
          .select('content_hash')
          .eq('sku', row.sku)
          .eq('fornitore', fornitore)
          .single()

        if (existing?.content_hash === content_hash) {
          console.log(`🔁 SKU ${row.sku} non modificato, saltato`)
          continue
        }

        let embedding: number[] = []

        if (process.env.NEXT_PUBLIC_ENV === 'Loc') {
          console.log('⚠️ Ambiente Loc - uso embedding mock')
          embedding = Array(1536).fill(0.001 * Math.random())
        } else {
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: content,
          })
          embedding = embeddingResponse.data[0].embedding
        }

        // 🔄 Upsert embedding
        rowsToUpsert.push({
          fornitore,
          content,
          content_hash,
          embedding,
          sku: row.sku,
          parent_sku: row.parent_sku,
          unit_price: row.unit_price,
          category_name: row.category_name,
          taglia: row.taglia,
          colore: row.colore,
          type: row.type,
          visibility: row.visibility,
          updated_at: new Date().toISOString(),
        })

        // 📦 Upsert prodotto visuale
        rowsProdottiToUpsert.push({
          sku: row.sku,
          name: row.name,
          description: row.description,
          unit_price: row.unit_price,
          category_name: row.category_name,
          taglia: row.taglia,
          colore: row.colore,
          parent_sku: row.parent_sku,
          type: row.type,
          visibility: row.visibility,
          fornitore,
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'Errore generico'
        console.error(`❌ Errore su SKU ${row.sku}:`, reason)
        skippedError.push({ sku: row.sku || '(sconosciuto)', reason })

        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'embedding_error',
          row_number: null,
          sku: row.sku || null,
          message: reason,
        })
      }
    }

    // 💾 5. Upsert su embedding_prodotti
    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('embedding_prodotti')
        .upsert(rowsToUpsert, { onConflict: 'fornitore,sku' })

      if (upsertError) {
        console.error('❌ Errore upsert embedding_prodotti:', upsertError)
        return NextResponse.json({ error: 'Errore upsert embedding_prodotti' }, { status: 500 })
      }

      console.log(`✅ Embedding completati: ${rowsToUpsert.length}`)
    }

    // 💾 6. Upsert su prodotti
    if (rowsProdottiToUpsert.length > 0) {
      const { error: prodottiError } = await supabase
        .from('prodotti')
        .upsert(rowsProdottiToUpsert, { onConflict: 'sku' })

      if (prodottiError) {
        console.error('❌ Errore upsert prodotti:', prodottiError)
        return NextResponse.json({ error: 'Errore upsert prodotti' }, { status: 500 })
      }

      console.log(`📦 Prodotti aggiornati: ${rowsProdottiToUpsert.length}`)
    }

    await supabase.from('embedding_logs').insert({
      fornitore,
      filename,
      type: 'run_summary',
      row_number: null,
      sku: null,
      message: `Run completata: ${rowsToUpsert.length} embedding, ${skippedInvalid.length} invalidi, ${skippedError.length} errori`
    })

    return NextResponse.json({
      success: true,
      count: rowsToUpsert.length,
      skippedInvalid,
      skippedError,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore imprevisto'
    console.error('❌ Errore imprevisto:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
