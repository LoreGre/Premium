import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import Papa from 'papaparse'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key')

    if (apiKey !== process.env.EMBEDDING_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const fornitore = 'silan'

    // 📥 1. Scarica CSV da Supabase Storage
    const { data: file, error: downloadError } = await supabase.storage
      .from('csv-files')
      .download(`${fornitore}_master_file_full.csv`)

    if (downloadError || !file) {
      console.error('❌ Errore download CSV:', downloadError)
      return NextResponse.json({ error: 'Errore download CSV' }, { status: 500 })
    }

    // 📄 2. Leggi e parsa il CSV
    const text = await file.text()
    
    interface RowCSV {
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
    
    let rows = Papa.parse<RowCSV>(text, { header: true }).data

    // 🎯 3. Filtra 50 righe con `sku` e `name`
    rows = rows
      .filter(r => r.sku && r.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, 50)

    const rowsToUpsert = []

    for (const row of rows) {
      const nome = row.name?.trim() || ''
      const descrizione = row.description?.trim() || ''
      const prezzo = row.unit_price?.trim() || ''
      const categoria = row.category_name?.trim() || ''
      const taglia = row.taglia?.trim() || ''
      const colore = row.colore?.trim() || ''
    
      const content = `Prodotto: ${nome}. Categoria: ${categoria}. Prezzo: ${prezzo}€. Taglia: ${taglia}. Colore: ${colore}. ${descrizione}`
    
      let embedding: number[] = []
    
      try {
        if (process.env.NEXT_PUBLIC_ENV === 'Loc') {
          console.log('⚠️ Ambiente Loc - uso embedding mock')
          embedding = Array(1536).fill(0.001 * Math.random()) // finto embedding
        } else {
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: content,
          })
          embedding = embeddingResponse.data[0].embedding
        }
    
        rowsToUpsert.push({
          fornitore,
          content,
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
      } catch (err) {
        console.error('❌ Errore generazione embedding:', err)
      }
    }

    // 💾 4. Inserisci batch su Supabase
    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('offerte_embeddings')
        .upsert(rowsToUpsert, {
          onConflict: 'fornitore,sku',
        })

      if (upsertError) {
        console.error('❌ Errore upsert batch:', upsertError)
        return NextResponse.json({ error: 'Errore upsert Supabase' }, { status: 500 })
      }

      console.log(`✅ Embedding completati: ${rowsToUpsert.length}`)
      return NextResponse.json({ success: true, count: rowsToUpsert.length })
    } else {
      return NextResponse.json({ warning: 'Nessun embedding generato' }, { status: 200 })
    }

  } catch (err) {
    console.error('❌ Errore imprevisto:', err)
    return NextResponse.json({ error: 'Errore imprevisto' }, { status: 500 })
  }
}