'use server'

import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import Papa from 'papaparse'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
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

    // 📥 1. Scarica il CSV
    const { data: file, error: downloadError } = await supabase.storage
      .from('csv-files')
      .download(filename)

    if (downloadError || !file) {
      console.error('❌ Errore download CSV:', downloadError)
      return NextResponse.json({ error: 'Errore download CSV' }, { status: 500 })
    }

    // 🧾 2. Parsing
    const text = await file.text()
    const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true })
    if (parseResult.errors.length > 0) {
      console.error('❌ Errori di parsing:', parseResult.errors)
      return NextResponse.json({ error: 'Parsing CSV fallito', details: parseResult.errors }, { status: 400 })
    }

    const rows = parseResult.data as Record<string, string>[]
    const skippedInvalid: { row: number; reason: string }[] = []
    const skippedError: { sku: string; reason: string }[] = []
    const rowsToEmbed: {
      content: string
      content_hash: string
      row: Record<string, string>
      prodotto: Record<string, any>
    }[] = []

    // 🧹 3. Prepara righe valide
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2
      if (!row.sku || !row.name) {
        skippedInvalid.push({ row: rowNumber, reason: 'SKU o name mancante' })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'invalid',
          row_number: rowNumber,
          sku: row.sku || null,
          message: 'SKU o name mancante',
        })
        continue
      }

      const MAX_DESC = 3000
      const MAX_FIELD = 10_000

      const contentFields = {
        name: row.name?.trim() || '',
        description: (row.description || '').slice(0, MAX_DESC).trim(),
        unit_price: row.unit_price?.trim() || '',
        category_name: row.category_name?.trim() || '',
        taglia: row.taglia?.trim() || '',
        colore: row.colore?.trim() || '',
      }

      const content = [
        `Prodotto: ${contentFields.name}`,
        contentFields.category_name && `Categoria: ${contentFields.category_name}`,
        contentFields.unit_price && `Prezzo: ${contentFields.unit_price}€`,
        contentFields.taglia && `Taglia: ${contentFields.taglia}`,
        contentFields.colore && `Colore: ${contentFields.colore}`,
        contentFields.description,
      ].filter(Boolean).join('. ')

      if (content.length > 100_000) {
        skippedInvalid.push({ row: rowNumber, reason: 'Contenuto troppo lungo' })
        await supabase.from('embedding_logs').insert({
          fornitore,
          filename,
          type: 'invalid',
          row_number: rowNumber,
          sku: row.sku,
          message: 'Contenuto troppo lungo',
        })
        continue
      }

      const content_hash = hashContent(content)
      const prodotto: Record<string, any> = {
        sku: row.sku,
        name: row.name,
        fornitore,
        updated_at: new Date().toISOString(),
      }

      const safeFields = [
        'description', 'unit_price', 'tier_price_1', 'tier_price_2', 'msrp',
        'category_name', 'url_key', 'link', 'type', 'parent_sku',
        'taglia', 'colore', 'configurable_attributes', 'weight',
        'image', 'small_image', 'thumbnail', 'media_gallery',
        'visibility', 'attribute_set',
      ]

      for (const field of safeFields) {
        const raw = row[field]
        if (raw && typeof raw === 'string') {
          prodotto[field] = raw.slice(0, MAX_FIELD).trim()
        }
      }

      const numericFields = ['tier_qty_1', 'tier_qty_2', 'qty_increments']
      for (const field of numericFields) {
        const val = row[field]
        if (val && !isNaN(Number(val))) {
          prodotto[field] = Number(val)
        }
      }

      rowsToEmbed.push({ row, content, content_hash, prodotto })
    }

    // 🧠 4. Controlla deduplica
    const { data: existing } = await supabase
      .from('embedding_prodotti')
      .select('sku, content_hash')
      .eq('fornitore', fornitore)

    const hashMap = new Map((existing || []).map(e => [e.sku, e.content_hash]))
    const toEmbedNow = rowsToEmbed.filter(r => hashMap.get(r.row.sku) !== r.content_hash)

    const mode = req.headers.get('x-mode')?.toLowerCase()
    const isMock = !mode || mode === 'mock'
    const maxBatch = 500

    const rowsToUpsert: any[] = []
    const prodottiToUpsert: any[] = []

    // 🔁 5. Embedding
    for (let i = 0; i < toEmbedNow.length; i += maxBatch) {
      const chunk = toEmbedNow.slice(i, i + maxBatch)
      const input = chunk.map(c => c.content)

      try {
        const embeddings = isMock
          ? input.map(() => Array(1536).fill(Math.random() * 0.001))
          : (await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input,
            })).data.map(d => d.embedding)

        for (let j = 0; j < chunk.length; j++) {
          const { row, content, content_hash, prodotto } = chunk[j]
          rowsToUpsert.push({
            fornitore,
            content,
            content_hash,
            embedding: embeddings[j],
            sku: row.sku,
            updated_at: new Date().toISOString(),
          })
          prodottiToUpsert.push(prodotto)
        }
      } catch (err) {
        console.error(`❌ Errore embedding batch ${i}:`, err)
        for (const c of chunk) {
          skippedError.push({ sku: c.row.sku, reason: 'Errore embedding batch' })
          await supabase.from('embedding_logs').insert({
            fornitore,
            filename,
            type: 'embedding_error',
            row_number: null,
            sku: c.row.sku,
            message: 'Errore embedding batch',
          })
        }
      }
    }

    // 💾 6. Scrivi su Supabase
    if (rowsToUpsert.length > 0) {
      const { error } = await supabase
        .from('embedding_prodotti')
        .upsert(rowsToUpsert, { onConflict: 'fornitore,sku' })
      if (error) throw new Error('Errore upsert embedding_prodotti')
    }

    if (prodottiToUpsert.length > 0) {
      const { error } = await supabase
        .from('prodotti')
        .upsert(prodottiToUpsert, { onConflict: 'sku' })
      if (error) throw new Error('Errore upsert prodotti')
    }

    await supabase.from('embedding_logs').insert({
      fornitore,
      filename,
      type: 'run_summary',
      row_number: null,
      sku: null,
      message: `✅ ${rowsToUpsert.length} embedding, ${skippedInvalid.length} invalidi, ${skippedError.length} errori`,
    })

    return NextResponse.json({
      success: true,
      embedded: rowsToUpsert.length,
      skippedInvalidCount: skippedInvalid.length,
      skippedErrorCount: skippedError.length,
    })

  } catch (err) {
    console.error('❌ Errore imprevisto:', err)
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
