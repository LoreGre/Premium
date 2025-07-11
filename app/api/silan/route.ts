//curl -v -X POST 'http://premium.local:3000/api/silan?offset=0&limit=500' \
//-H "x_api_key: 4hRD3xGJqx4ktjeHWtyVrapg2i7a35T5PKrMxFoI1IBVwBvPge5eQ3AJchr7r9dl" \
//-H "x_mode: live" \
//-H "Content-Type: application/json"
'use server'

import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import Papa from 'papaparse'
import crypto from 'crypto'
import { Readable } from 'stream'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeSku } from '@/lib/utils' // ✅ nuova funzione centralizzata

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

type RowCSV = {
  sku: string
  name: string
  description?: string
  unit_price?: string
  tier_qty_1?: string
  tier_price_1?: string
  tier_qty_2?: string
  tier_price_2?: string
  msrp?: string
  qty_increments?: string
  category_name?: string
  url_key?: string
  link?: string
  type?: string
  parent_sku?: string
  taglia?: string
  colore?: string
  configurable_attributes?: string
  weight?: string
  image?: string
  small_image?: string
  thumbnail?: string
  media_gallery?: string
  visibility?: string
  attribute_set?: string
}

type ProdottoRow = {
  sku: string
  name: string
  description?: string
  unit_price?: string
  tier_qty_1?: number
  tier_price_1?: string
  tier_qty_2?: number
  tier_price_2?: string
  msrp?: string
  qty_increments?: number
  category_name?: string
  url_key?: string
  link?: string
  type?: string
  parent_sku?: string
  taglia?: string
  colore?: string
  configurable_attributes?: string
  weight?: string
  image?: string
  small_image?: string
  thumbnail?: string
  media_gallery?: string
  visibility?: string
  attribute_set?: string
  fornitore: string
  updated_at: string
}

type EmbeddingRow = {
  fornitore: string
  content: string
  content_hash: string
  embedding: number[]
  sku: string
  updated_at: string
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x_api_key')
    if (apiKey !== process.env.PREMIUM_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const fornitore = 'silan'
    const filename = `${fornitore}_master_file_full.csv`

    const url = new URL(req.url)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const limit = parseInt(url.searchParams.get('limit') || '500', 10)
    const end = offset + limit

    console.time(`🟢 Batch offset ${offset}`)
    console.log(`🟢 START – offset ${offset} / limit ${limit}`)

    const { data: file, error: downloadError } = await supabase.storage
      .from('csv-files')
      .download(filename)

    if (downloadError || !file) {
      console.error('❌ Errore download CSV:', downloadError)
      return NextResponse.json({ error: 'Errore download CSV' }, { status: 500 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = Readable.fromWeb(file.stream() as any)
    const rows: RowCSV[] = []
    let rowIndex = 0

    await new Promise((resolve, reject) => {
      const allRows: RowCSV[] = []
    
      Papa.parse(stream, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as RowCSV[]
          const slice = data.slice(offset, offset + limit)
          rows.push(...slice)
          console.log(`📦 Letti ${data.length} totali, batch: ${slice.length} da offset ${offset}`)
          resolve(null)
        },
        error: (err) => {
          console.error('❌ Errore parsing CSV:', err)
          reject(err)
        }
      })
    })    

    const rowsToUpsert: EmbeddingRow[] = []
    const rowsProdottiToUpsert: ProdottoRow[] = []
    const skippedInvalid: { row: number; reason: string }[] = []
    const skippedError: { sku: string; reason: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = offset + i + 2
      if (!row.sku || !row.name) {
        const reason = !row.sku ? 'SKU mancante' : 'Name mancante'
        console.warn(`⚠️ Riga ${rowNumber} saltata: ${reason}`)
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

    const filteredRows = rows.filter(r => r.sku && r.name)

    for (const row of filteredRows) {
      const sku = normalizeSku(row.sku)
      const nome = row.name?.trim() || ''
      const descrizione = row.description?.trim() || ''
      const prezzo = row.unit_price?.trim() || ''
      const categoria = row.category_name?.trim() || ''
      const taglia = row.taglia?.trim() || ''
      const colore = row.colore?.trim() || ''

      const chunks = [
        `Prodotto: ${nome}`,
        categoria && `Categoria: ${categoria}`,
        prezzo && `Prezzo: ${prezzo}€`,
        taglia && `Taglia: ${taglia}`,
        colore && `Colore: ${colore}`,
        descrizione && descrizione
      ].filter(Boolean)

      const content = chunks.join('. ')
      const content_hash = hashContent(content)

      try {
        const { data: existing } = await supabase
          .from('embedding_prodotti')
          .select('content_hash')
          .eq('sku', sku)
          .eq('fornitore', fornitore)
          .single()

        if (existing?.content_hash === content_hash) {
          console.warn(`⚠️ SKU ${sku} identico, nessun aggiornamento necessario`)
          continue
        }

        let embedding: number[] = []
        const mode = req.headers.get('x_mode')?.toLowerCase()
        const isMock = mode !== 'live'

        if (isMock) {
          embedding = Array(1536).fill(0.001 * Math.random())
          console.warn(`⚠️ SKU ${sku} – embedding mockato (x_mode diverso da live)`)
        } else {
          try {
            const embeddingResponse = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: content,
            })
            embedding = embeddingResponse.data[0].embedding
          } catch (err) {
            const reason = err instanceof Error ? err.message : 'Errore embedding sconosciuto'
            console.error(`❌ OpenAI error on SKU ${sku}:`, reason)
            skippedError.push({ sku, reason })
            await supabase.from('embedding_logs').insert({
              fornitore,
              filename,
              type: 'embedding_error',
              row_number: null,
              sku,
              message: reason,
            })
            continue
          }
        }

        rowsToUpsert.push({
          fornitore,
          content,
          content_hash,
          embedding,
          sku,
          updated_at: new Date().toISOString(),
        })

        const prodotto: Partial<ProdottoRow> = {
          sku,
          name: row.name,
          fornitore,
          updated_at: new Date().toISOString(),
        }

        const optionalFields = [
          'description', 'unit_price', 'tier_price_1', 'tier_price_2', 'msrp',
          'category_name', 'url_key', 'link', 'type', 'parent_sku',
          'taglia', 'colore', 'configurable_attributes', 'weight',
          'image', 'small_image', 'thumbnail', 'media_gallery',
          'visibility', 'attribute_set'
        ] as const

        for (const field of optionalFields) {
          const value = row[field]
          if (value && typeof value === 'string') {
            prodotto[field] = value.trim()
          }
        }

        const numericFields: (keyof ProdottoRow)[] = ['tier_qty_1', 'tier_qty_2', 'qty_increments']
        for (const field of numericFields) {
          const raw = (row as Record<string, string | undefined>)[field]
          if (raw && !isNaN(Number(raw))) {
            (prodotto as Record<string, unknown>)[field] = Number(raw)
          }
        }

        rowsProdottiToUpsert.push(prodotto as ProdottoRow)
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

    const uniqueEmbeddingMap = new Map<string, EmbeddingRow>()
    for (const row of rowsToUpsert) {
      uniqueEmbeddingMap.set(`${row.fornitore}__${row.sku}`, row)
    }

    const uniqueProdottiMap = new Map<string, ProdottoRow>()
    for (const row of rowsProdottiToUpsert) {
      uniqueProdottiMap.set(row.sku, row)
    }

    const deduplicatedEmbedding = Array.from(uniqueEmbeddingMap.values())
    const deduplicatedProdotti = Array.from(uniqueProdottiMap.values())

    if (deduplicatedEmbedding.length > 0) {
      const { error: upsertError } = await supabase
        .from('embedding_prodotti')
        .upsert(deduplicatedEmbedding, { onConflict: 'fornitore,sku' })

      if (upsertError) {
        console.error('❌ Errore upsert embedding_prodotti:', upsertError)
        return NextResponse.json({ error: 'Errore upsert embedding_prodotti' }, { status: 500 })
      }
    }

    if (deduplicatedProdotti.length > 0) {
      const { error: prodottiError } = await supabase
        .from('prodotti')
        .upsert(deduplicatedProdotti, { onConflict: 'sku' })

      if (prodottiError) {
        console.error('❌ Errore upsert prodotti:', prodottiError)
        return NextResponse.json({ error: 'Errore upsert prodotti' }, { status: 500 })
      }
    }

    await supabase.from('embedding_logs').insert({
      fornitore,
      filename,
      type: 'run_summary',
      row_number: null,
      sku: null,
      message: `Blocco da offset ${offset} a ${end} – ${rowsToUpsert.length} embedding, ${skippedInvalid.length} invalidi, ${skippedError.length} errori`
    })

    const hasNext = rowIndex >= end

    console.timeEnd(`🟢 Batch offset ${offset}`)
    console.log(`✅ END – offset ${offset}`)

    return NextResponse.json({
      success: true,
      count: rowsToUpsert.length,
      skippedInvalid,
      skippedError,
      next: hasNext,
      offset,
      nextOffset: hasNext ? end : null,
      limit,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore imprevisto'
    console.error('❌ Errore imprevisto:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
