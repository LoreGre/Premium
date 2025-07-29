# Project Premium snapshot - Mar 29 Lug 2025 15:08:52 CEST

## Directory tree

.
├── app
│   ├── (dashboard)
│   │   ├── chats
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── clienti
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── fornitori
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── offerte
│   │   │   └── page.tsx
│   │   └── prodotti
│   │       ├── actions.ts
│   │       └── page.tsx
│   ├── api
│   │   ├── chat
│   │   │   ├── feedback
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── chats
│   │   │   ├── [id]
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── prodotti
│   │   │   ├── filtri
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   └── silan
│   │       ├── qty
│   │       │   └── route.ts
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── login
│   │   └── page.tsx
│   └── page.tsx
├── components
│   ├── chat
│   │   ├── chat-actions.ts
│   │   ├── chat-api.tsx
│   │   ├── chat-container.tsx
│   │   ├── chat-embedding.tsx
│   │   ├── chat-exctract-entities.tsx
│   │   ├── chat-input.tsx
│   │   ├── chat-message-item.tsx
│   │   └── types.ts
│   ├── form
│   │   ├── form-dynamic.tsx
│   │   ├── login-form.tsx
│   │   └── multi-select.tsx
│   ├── layout
│   │   ├── app-sidebar.tsx
│   │   ├── nav-main.tsx
│   │   ├── nav-secondary.tsx
│   │   ├── site-footer.tsx
│   │   └── site-header.tsx
│   ├── prodotti
│   │   └── searchProductsPaginated.ts
│   ├── table
│   │   ├── data-table-dynamic-server.tsx
│   │   └── data-table-dynamic.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   ├── ui
│   │   ├── alert-dialog.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── command.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle-group.tsx
│   │   ├── toggle.tsx
│   │   └── tooltip.tsx
│   └── view
│       └── view-dynamic.tsx
├── components.json
├── eslint.config.mjs
├── hooks
│   ├── use-mobile.ts
│   └── use-notify.ts
├── lib
│   ├── api
│   │   └── silan
│   │       ├── constants.ts
│   │       ├── log.ts
│   │       ├── logSkipped.ts
│   │       ├── mongo
│   │       │   ├── updateQty.ts
│   │       │   └── upsert.ts
│   │       ├── normalizeSku.ts
│   │       ├── openai
│   │       │   └── createEbeddingFromText.ts
│   │       ├── parseRow.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   ├── auth
│   │   └── requireAuthUser.ts
│   ├── data
│   │   └── countries.ts
│   ├── logger.ts
│   ├── mongo
│   │   └── client.ts
│   ├── supabase
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   └── server.ts
│   ├── types
│   │   └── prodotto.ts
│   ├── utils
│   │   ├── forms.ts
│   │   └── view.ts
│   └── utils.ts
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── project_snapshot.md
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.svg
│   ├── next.svg
│   ├── placeholder.png
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── tsconfig.json
└── update-env.sh

41 directories, 117 files

## File list & contents (.ts/.tsx only)


---
### ./middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map(({ name, value }) => ({ name, value })),
        setAll: () => {}     // ← NON scrive i cookie
      }
    }
  )

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*']
}


---
### ./app/layout.tsx

// layout.tsx

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AI Product Assistant | Premium",
  description: "Generated by Lorenzo Greppi",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}

---
### ./app/api/prodotti/filtri/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { getMongoCollection } from '@/lib/mongo/client'

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth

  try {
    const prodotti = await getMongoCollection('prodotti')

    // Tipizziamo esplicitamente Promise.all per evitare errori TS
    const [fornitori, categorieRaw, colori, taglie]: [string[], string[], string[], string[]] = await Promise.all([
      prodotti.distinct('supplier'),
      prodotti.aggregate([
        { $unwind: '$category_name' },
        { $match: { category_name: { $type: 'string' } } },
        { $group: { _id: '$category_name' } },
        { $project: { _id: 0, name: '$_id' } } // 👈 Cambiato quisu
      ]).toArray().then(arr => arr.map(el => el.name)), // 👈 Ricaviamo l’array di stringhe
      prodotti.distinct('colore'),
      prodotti.distinct('taglia')
    ])    

    // Filtri comuni per tutte le categorie testuali
    const filterStrings = (arr: unknown[]): string[] =>
      arr
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
        .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      supplier: filterStrings(fornitori),
      category_name: filterStrings(categorieRaw),
      colore: filterStrings(colori),
      taglia: filterStrings(taglie)
    })
  } catch (err) {
    console.error('Errore fetch filters:', err)
    return NextResponse.json({ error: 'Errore durante il recupero dei filtri' }, { status: 500 })
  }
}

---
### ./app/api/prodotti/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { getMongoCollection } from '@/lib/mongo/client'
import { logger } from '@/lib/logger'
import { searchProductsPaginated } from '@/components/prodotti/searchProductsPaginated'
import type { SearchProductsParams } from '@/components/prodotti/searchProductsPaginated'

/**
 * POST /api/prodotti
 * Ricerca paginata e filtrata dei prodotti
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth

  try {
    const body = await req.json() as SearchProductsParams

    const result = await searchProductsPaginated({
      search: body.search || '',
      limit: body.limit || 50,
      offset: body.offset || 0,
      sortBy: body.sortBy,
      sortDir: body.sortDir,
      filters: body.filters,
    })

    return NextResponse.json(result)
  } catch (err) {
    logger.error('Errore /api/prodotti [POST]', { error: err })
    return NextResponse.json({ error: 'Errore fetch prodotti' }, { status: 500 })
  }
}

/**
 * DELETE /api/prodotti
 * Elimina prodotti in base agli SKU forniti
 */
export async function DELETE(req: Request) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth

  try {
    const { skus } = await req.json()

    if (!Array.isArray(skus)) {
      return NextResponse.json({ error: 'Payload malformato: skus deve essere un array' }, { status: 400 })
    }

    console.log('🔍 SKU da eliminare:', skus)

    const collection = await getMongoCollection('prodotti')
    const result = await collection.deleteMany({ sku: { $in: skus } })

    console.log(`🗑️ Eliminati ${result.deletedCount} prodotti`)

    return NextResponse.json({ success: true, deleted: result.deletedCount })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore durante eliminazione di prodotti'
    console.error('❌ Errore /api/prodotti [DELETE]:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

---
### ./app/api/chat/feedback/route.ts

import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { updateMessageFeedback } from '@/components/chat/chat-actions'
import { logger } from '@/lib/logger'

const validRatings = ['positive', 'negative', 'neutral'] as const

export async function POST(req: Request) {
  try {
    // Autenticazione unica via utility
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth

    const { messageId, rating, comment } = await req.json()

    if (!messageId || !rating) {
      logger.warn('Dati mancanti nel feedback')
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    if (!validRatings.includes(rating)) {
      logger.warn('Rating non valido nel feedback', { rating })
      return NextResponse.json({ error: 'Rating non valido' }, { status: 400 })
    }

    if (typeof messageId !== 'string' || messageId.length !== 24) {
      logger.warn('messageId non valido', { messageId })
      return NextResponse.json({ error: 'ID messaggio non valido' }, { status: 400 })
    }

    await updateMessageFeedback(messageId, { rating, comment })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Errore API feedback', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

---
### ./app/api/chat/route.ts

import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { getEmbedding } from '@/components/chat/chat-embedding'
import {
  saveMessageMongo,
  generateChatResponse,
  getSessionHistoryMongo,
  getProductsByEntitiesAI
} from '@/components/chat/chat-actions'
import type { ChatAIResponse } from '@/components/chat/types'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    // AUTH PROTEZIONE
    const auth = await requireAuthUser(req)
    if ('status' in auth) return auth
    const { user } = auth

    logger.info('Utente autenticato', { userId: user.id })

    const { message, sessionId } = await req.json()
    logger.info('Payload ricevuto', { message, sessionId })

    if (!message || !sessionId) {
      logger.warn('Messaggio o sessione mancanti nel payload')
      return NextResponse.json({ error: 'Messaggio o sessione mancanti' }, { status: 400 })
    }

    const sessionObjectId = new ObjectId(sessionId)

    const embedding = await getEmbedding(message)
    logger.info('Embedding generato', { preview: embedding.slice(0, 5) })

    const userMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'user',
      content: message,
      embedding,
      createdAt: new Date().toISOString()
    })
    logger.info('Messaggio utente salvato', { userMessageId })

    const history = await getSessionHistoryMongo(sessionId, 5)

    const { products } = await getProductsByEntitiesAI(message, embedding, 10)
    logger.info('Prodotti trovati', { productsCount: products.length, skus: products.map(p => p.sku) })

    const aiResponse: ChatAIResponse = await generateChatResponse({
      message,
      products,
      contextMessages: history,
    })

    logger.info('Risposta AI generata', {
      intent: aiResponse.intent,
      nRecommended: aiResponse.recommended.length
    })

    const aiMessageId = await saveMessageMongo({
      session_id: sessionObjectId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse.summary,
      recommended: aiResponse.recommended,
      intent: aiResponse.intent ?? 'suggestion',
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      createdAt: new Date().toISOString()
    })
    logger.info('Messaggio AI salvato', { aiMessageId })

    return NextResponse.json({
      summary: aiResponse.summary,
      recommended: aiResponse.recommended,
      products: products.filter(p => aiResponse.recommended.some(r => r.sku === p.sku)),
      intent: aiResponse.intent ?? 'suggestion',
      entities: Array.isArray(aiResponse.entities) ? aiResponse.entities : [],
      _id: aiMessageId?.toString()
    })
  } catch (err) {
    logger.error('Errore in /api/chat', { error: (err as Error).message })
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

---
### ./app/api/chats/route.ts

import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getMongoCollection } from '@/lib/mongo/client'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProductItem } from '@/components/chat/types'

export async function GET(req: Request) {
  const auth = await requireAuthUser(req)
  if ('status' in auth) return auth
  const { user } = auth

  try {
    logger.info('Inizio GET /api/chat-sessions', { userId: user.id })

    // 1. Recupero tutte le sessioni chat
    const chatSessions = await getMongoCollection('chat_sessions')
    const allSessions = await chatSessions
      .find({})
      .sort({ updatedAt: -1 }) // -1 = ordine decrescente
      .toArray()

    logger.info('Sessioni chat caricate', { count: allSessions.length })

    // 2. Prendo tutti gli user Supabase
    const userIds = [...new Set(allSessions.map(s => s.user_id))]
    const supabase = createAdminClient()
    const { data: usersList, error } = await supabase.auth.admin.listUsers()

    if (error || !usersList?.users) {
      logger.error('Errore fetch utenti supabase', { error: error || 'usersList missing' })
      return NextResponse.json({ error: 'Errore utenti' }, { status: 500 })
    }

    const usersData = usersList.users.filter(u => userIds.includes(u.id))

    // 3. Recupero tutti i messaggi una volta sola
    const chatMessages = await getMongoCollection('chat_messages')
    const allMessages = await chatMessages
      .find({ session_id: { $in: allSessions.map(s => new ObjectId(s._id)) } })
      .project({ session_id: 1, role: 1, content: 1, products: 1 })
      .toArray()

    // 4. Mappo la risposta
    const sessionsWithDetails = allSessions.map(session => {
      const sessionIdStr = session._id.toString()
      const sessionMessages = allMessages.filter(msg =>
        msg.session_id.toString() === sessionIdStr
      )

      const firstMsg = sessionMessages.find(m => m.role === 'user')

      const allProducts: ProductItem[] = sessionMessages
        .flatMap(msg => msg.products || [])
        .filter(p => p?.sku)

      const deduped = Object.values(
        allProducts.reduce((acc, p) => {
          acc[p.sku] = p
          return acc
        }, {} as Record<string, ProductItem>)
      )

      const userData = usersData.find(u => u.id === session.user_id)

      return {
        _id: sessionIdStr,
        user_id: session.user_id,
        email: userData?.email || '—',
        updatedAt: session.updatedAt || new Date(session.createdAt).toISOString(),
        firstMessage: firstMsg?.content
          ? firstMsg.content.slice(0, 60) + (firstMsg.content.length > 60 ? '…' : '')
          : '',
        products: deduped.map(p => p.sku)
      }
    })

    logger.info('Risposta finale inviata', { count: sessionsWithDetails.length })
    return NextResponse.json(sessionsWithDetails)
  } catch (err) {
    logger.error('Errore API chat-sessions', { error: err })
    return NextResponse.json({ error: 'Errore generico' }, { status: 500 })
  }
}

---
### ./app/api/chats/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getMongoCollection } from '@/lib/mongo/client'
import { requireAuthUser } from '@/lib/auth/requireAuthUser'
import { logger } from '@/lib/logger'
import { ObjectId } from 'mongodb'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthUser(req)
  if (!('user' in auth)) return auth

  const { user } = auth
  const id = params.id

  if (!id) {
    return NextResponse.json({ error: 'ID mancante' }, { status: 400 })
  }

  const sessionId = new ObjectId(id)
  const sessions = await getMongoCollection('chat_sessions')
  const messages = await getMongoCollection('chat_messages')

  try {
    const res = await sessions.deleteOne({ _id: sessionId, user_id: user.id })

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: 'Nessuna sessione trovata' }, { status: 404 })
    }

    const msgResult = await messages.deleteMany({ session_id: sessionId })

    logger.info('Sessione e messaggi eliminati', {
      sessionId: id,
      deletedMessages: msgResult.deletedCount,
      userId: user.id
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Errore eliminazione sessione e messaggi', err)
    return NextResponse.json({ error: 'Errore durante la cancellazione' }, { status: 500 })
  }
}

---
### ./app/api/silan/route.ts

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Papa from 'papaparse'
import { parseRow } from '@/lib/api/silan/parseRow'
import { upsertProdottoMongo } from '@/lib/api/silan/mongo/upsert'
import { RowCSV } from '@/lib/api/silan/types'
import { logger } from '@/lib/logger'


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
    logger.warn('Unauthorized API key')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(CSV_PATH)

  if (error || !data) {
    logger.error('Failed to load CSV', { error })
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

    const { prodotto } = parsedRow
    const status = await upsertProdottoMongo({ prodotto })

    if (status === 'inserted') result.inserted.push(prodotto.sku)
    else if (status === 'updated') result.updated.push(prodotto.sku)
    else result.skipped.push(prodotto.sku)
  }

  logger.info({
    type: 'batch_upsert',
    message: `Batch completato - offset: ${offset}, limit: ${limit}`,
    inserted: result.inserted.length,
    updated: result.updated.length,
    skipped: result.skipped.length,
    invalid: result.invalid.length,
    total: result.count,
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

---
### ./app/api/silan/qty/route.ts

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Papa from 'papaparse'
import { updateQtyInMongo } from '@/lib/api/silan/mongo/updateQty'
import type { QtyUpdateRow, RowCSV } from '@/lib/api/silan/types'
import { logger } from '@/lib/logger'


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
    logger.warn('Unauthorized API key')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(CSV_PATH)

  if (error || !data) {
    logger.error('Failed to load CSV', { error })
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

  logger.info({
    type: 'batch_qty_update',
    message: `Batch qty completato - offset: ${offset}, limit: ${limit}`,
    valid: validRows.length,
    invalid: invalid.length,
    total: rawRows.length,
  })

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

---
### ./app/(dashboard)/clienti/actions.ts

'use client'

import { createClient } from '@/lib/supabase/client'
import { Customer } from './page'

const supabase = createClient()

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('clienti')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertCustomer(data: Partial<Customer>) {
  const { id, ...rest } = data

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw new Error(userError.message)
  if (!user) throw new Error('Utente non autenticato')

  const input = {
    ...rest,
    user_id: user.id,
  }

  if (id) {
    // UPDATE
    const { error, data: result } = await supabase
      .from('clienti')
      .update(input)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  } else {
    // INSERT
    const { error, data: result } = await supabase
      .from('clienti')
      .insert([input])
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  }

}

export async function deleteCustomer(id: number) {
  const { error } = await supabase
    .from('clienti')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}


export async function fetchCustomerCategories(): Promise<{ label: string; value: string }[]> {
  const { data, error } = await supabase
    .from('categorie')
    .select('label')
    .order('label', { ascending: true })

  if (error) throw new Error(error.message)

  return data?.map((c) => ({ label: c.label, value: c.label })) ?? []
}
---
### ./app/(dashboard)/clienti/page.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { fetchCustomers, upsertCustomer, deleteCustomer, fetchCustomerCategories } from './actions'
import { useNotify } from '@/hooks/use-notify'
import { FormDynamic, FormField } from '@/components/form/form-dynamic'
import { DataTableDynamic } from '@/components/table/data-table-dynamic'
import { availableCountries } from '@/lib/data/countries'
import { openDrawerForm } from '@/lib/utils/forms'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export type Customer = {
  id: number
  denominazione: string
  codice_sdi?: string
  referente?: string
  partita_iva?: string
  codice_fiscale?: string
  paese?: string
  indirizzo?: string
  comune?: string
  cap?: string
  provincia?: string
  telefono?: string
  email?: string
  pec?: string
  note?: string
  categorie?: string[]
  user_id?: string
  created_at?: string
  updated_at?: string
}

/* ------------------------------------------------------------------ */
/* UI constants                                                       */
/* ------------------------------------------------------------------ */

const columnTypes = {
  denominazione: { type: 'string' as const },
  email:        { type: 'email'  as const },
  telefono:     { type: 'phone'  as const },
  categorie:    { type: 'list'   as const, flags: ['filter'] },
  paese:        { type: 'string'   as const, flags: ['filter'] },
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function CustomersPage() {
  const { success, error } = useNotify()
  const errorRef = useRef(error)
  errorRef.current = error
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([])
  const [loading,   setLoading]   = useState(true)

  const customerFormFields: FormField[] = [
    { name: 'denominazione', label: 'Denominazione', type: 'text', required: true },
    { name: 'codice_sdi',    label: 'Codice destinatario SDI', type: 'text', validation: 'sdi_code'},
    { name: 'referente',     label: 'Referente', type: 'text' },
    { name: 'partita_iva',   label: 'Partita IVA', type: 'text', validation: 'piva'},
    { name: 'codice_fiscale',label: 'Codice fiscale', type: 'text', validation: 'cf'},
    { name: 'paese',         label: 'Paese', type: 'select',
      options: availableCountries.map(c => ({ label: c, value: c })) },
    { name: 'indirizzo',     label: 'Indirizzo', type: 'text' },
    { name: 'comune',        label: 'Comune', type: 'text' },
    { name: 'cap',           label: 'CAP', type: 'text', validation: 'cap'},
    { name: 'provincia',     label: 'Provincia', type: 'text', validation: 'provincia'},
    { name: 'telefono',      label: 'Telefono', type: 'phone' },
    { name: 'email',         label: 'E-mail', type: 'email' },
    { name: 'pec',           label: 'PEC', type: 'email' },
    { name: 'note',          label: 'Note', type: 'textarea' },
    { name: 'categorie',     label: 'Categorie', type: 'multiselect', options: categories, placeholder: 'Seleziona categorie...' },
  ]

  /* ---------- fetch iniziale ---------- */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([fetchCustomers(), fetchCustomerCategories()])
      .then(([customersResult, categoriesResult]) => {
        if (cancelled) return;

        if (customersResult.status === 'fulfilled') {
          setCustomers(customersResult.value);
        } else {
          console.error('Errore fetchCustomers:', customersResult.reason);
          if (typeof errorRef.current === 'function') errorRef.current('Errore', 'Impossibile caricare i clienti');
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategories(categoriesResult.value);
        } else {
          console.error('Errore fetchCustomerCategories:', categoriesResult.reason);
          if (typeof errorRef.current === 'function') errorRef.current('Errore', 'Impossibile caricare le categorie');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);
  


  /* ---------- drawer form state ---------- */
  const [drawerForm, setDrawerForm] = useState<{
    open: boolean
    title: string
    fields: FormField[]
    onSubmit: (data: Partial<Customer>) => void
    defaultValues?: Partial<Customer>
  }>({ open: false, title: '', fields: [], onSubmit: () => {} })

  /* ====================== RENDER ====================== */
  return (
    <main className="p-2">
      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
      ) : (
        <DataTableDynamic<Customer>
          data={customers}
          title="Clienti"
          columnTypes={columnTypes}
          filters={{
            categorie: categories.map(c => c.value),
            paese: availableCountries,
          }}
          /* ---------- ADD ---------- */
          onAdd={() =>
            openDrawerForm(setDrawerForm, {
              title: 'Aggiungi Cliente',
              fields: customerFormFields,
              onSubmit: async (data) => {
                try {
                  await upsertCustomer(data)
                  setDrawerForm({ open: false, title: '', fields: [], onSubmit: () => {} })
                  const updatedCustomers = await fetchCustomers()
                  setCustomers(updatedCustomers)
                  success('Cliente aggiunto', `Hai aggiunto "${data.denominazione}"`)
                } catch (e) {
                  console.error('Errore inserimento:', e)
                  error('Errore', 'Impossibile salvare il Cliente')
                }
              },
            })
          }
          /* ---------- EDIT ---------- */
          onEdit={(row) => {
            const original = row.original
            openDrawerForm(setDrawerForm, {
              title: `Modifica Cliente: ${original.denominazione ?? ''}`,
              fields: customerFormFields,
              onSubmit: async (data) => {
                try {
                  await upsertCustomer({ ...original, ...data })
                  setDrawerForm({ open: false, title: '', fields: [], onSubmit: () => {} })
                  const updatedCustomers = await fetchCustomers()
                  setCustomers(updatedCustomers)
                  success('Cliente aggiornato', `Hai modificato "${original.denominazione}"`)
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'Errore sconosciuto'
                  console.error('Errore modifica:', msg)
                  error('Errore', msg)
                }
              },
              defaultValues: original,
            })
          }}
          onDelete={async (items) => {
            try {
              await Promise.all(items.map(i => deleteCustomer(i.id)))
              setDrawerForm({ open: false, title: '', fields: [], onSubmit: () => {} })
              const updatedCustomers = await fetchCustomers()
              setCustomers(updatedCustomers)
              success('Eliminazione completata', `${items.length} elemento/i rimossi`)
            } catch (e) {
              console.error('Errore eliminazione:', e)
              error('Errore', 'Impossibile eliminare i clienti selezionati')
            }
          }}
        />
      )}

      <FormDynamic
        key={drawerForm.defaultValues
          ? `edit-${drawerForm.defaultValues.id ?? JSON.stringify(drawerForm.defaultValues)}`
          : `add-${drawerForm.open}`}
        open={drawerForm.open}
        onOpenChange={(open) => setDrawerForm(prev => ({ ...prev, open }))}
        title={drawerForm.title}
        fields={drawerForm.fields}
        onSubmit={drawerForm.onSubmit}
        defaultValues={
          drawerForm.defaultValues
            ? Object.fromEntries(
                Object.entries(drawerForm.defaultValues)
                  .filter(([, v]) => typeof v === 'string' || Array.isArray(v))
                  .map(([k, v]) => [k, Array.isArray(v) ? v : String(v)])
              )
            : undefined
        }
      />
    </main>
  )
}

---
### ./app/(dashboard)/prodotti/actions.ts

'use client'

import { createClient } from '@/lib/supabase/client'
import type { ProductItem } from './page'

export type QueryParams = {
  search?: string
  filters?: Record<string, string[]>
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export async function fetchProducts(params: QueryParams): Promise<{ data: ProductItem[]; total: number }> {
  const supabase = createClient()
  const { data: sessionData, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  if (!sessionData.session) throw new Error('Sessione non trovata')

  const token = sessionData.session.access_token

  const res = await fetch(`/api/prodotti`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params),
    cache: 'no-store'
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Errore API Fetch Prodotti:', errText)
    throw new Error('Errore fetch prodotti')
  }
  
  return res.json()
}

export async function deleteProducts(skus: string[]): Promise<void> {
  const supabase = createClient()
  const { data: sessionData, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  if (!sessionData.session) throw new Error('Sessione non trovata')

  const token = sessionData.session.access_token

  const res = await fetch(`/api/prodotti`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ skus }), // ✅ wrap con chiave
    cache: 'no-store'
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Errore API Delete:', errText)
    throw new Error('Errore eliminazione prodotti')
  }
}

---
### ./app/(dashboard)/prodotti/page.tsx

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchProducts, deleteProducts } from './actions'
import { useNotify } from '@/hooks/use-notify'
import { DataTableDynamicServer } from '@/components/table/data-table-dynamic-server'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { ViewDynamic, ViewField } from '@/components/view/view-dynamic'
import { openViewDrawer } from '@/lib/utils/view'
import type { ColumnDefinition } from '@/components/table/data-table-dynamic-server'

export type ProductItem = {
  sku: string
  name: string
  unit_price: number
  qty?: number
  supplier: string
  category_name?: string[] // ✅ aggiornato per array
  thumbnail: string
  colore?: string
  taglia?: string // ✅ aggiunto
}

const columnTypes: Record<keyof ProductItem, ColumnDefinition> = {
  sku:           { type: 'string' },
  name:          { type: 'string', label: 'Nome' },
  unit_price:    { type: 'number', label: 'Prezzo' },
  qty:           { type: 'number', label: 'Qta' },
  supplier:       { type: 'string', label: 'Fornitore', flags: ['filter'] },
  category_name: { type: 'list', label: 'Categoria', flags: ['filter'] },
  thumbnail:     { type: 'image', label: 'Immagine' },
  colore:        { type: 'string', label: 'Colore', flags: ['filter'] },
  taglia:        { type: 'string', label: 'Taglia', flags: ['filter'] }, // ✅ aggiunto
}

const fetchFilters = async (): Promise<Record<string, string[]>> => {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Token non disponibile')

  const res = await fetch('/api/prodotti/filtri', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Errore fetch filtri')
  return res.json()
}

export default function ProdottiPage() {
  const { success, error } = useNotify()
  const errorRef = useRef(error)
  errorRef.current = error

  const [products, setProducts] = useState<ProductItem[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const [viewer, setViewer] = useState<{
    open: boolean
    title: string
    data: Partial<ProductItem>
  }>({ open: false, title: '', data: {} })

  useEffect(() => {
    fetchFilters()
      .then(setFilters)
      .catch((e) => {
        console.error('Errore fetch filtri:', e)
        errorRef.current?.('Errore', 'Impossibile caricare i filtri')
      })
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchProducts({
        search: debouncedSearch,
        filters: activeFilters,
        limit: pageSize,
        offset: pageIndex * pageSize
      })
      setProducts(res.data)
      setTotal(res.total)
    } catch (e) {
      console.error('Errore fetch prodotti:', e)
      errorRef.current?.('Errore', 'Impossibile caricare i prodotti')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeFilters, pageIndex, pageSize])

  useEffect(() => {
    fetchData()
  }, [fetchData])  

  const handleResetAll = () => {
    setSearch('')
    setDebouncedSearch('')
    setActiveFilters({})
    setPageIndex(0)
  }

  const viewFields: ViewField[] = [
    { name: 'sku', label: 'SKU', type: 'text' },
    { name: 'name', label: 'Nome', type: 'text' },
    { name: 'unit_price', label: 'Prezzo', type: 'text' },
    { name: 'qty', label: 'Quantità', type: 'text' },
    { name: 'supplier', label: 'Fornitore', type: 'list' },
    { name: 'category_name', label: 'Categoria', type: 'list' },
    { name: 'colore', label: 'Colore', type: 'list' },
    { name: 'taglia', label: 'Taglia', type: 'list' },
    { name: 'link', label: 'Link', type: 'link' },
    { name: 'thumbnail', label: 'Immagine', type: 'image' },
  ]

  return (
    <main className="p-2">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTableDynamicServer<ProductItem>
          title="Prodotti"
          data={products}
          total={total}
          search={search}
          onSearchChange={(val) => {
            setSearch(val)
            setPageIndex(0)
          }}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPageIndex(0)
          }}
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={(filters) => {
            setActiveFilters(filters)
            setPageIndex(0)
          }}
          onResetFilters={handleResetAll}
          columnTypes={columnTypes}
          onView={(row) =>
            openViewDrawer(setViewer, {
              title: `${row.original.name}`,
              data: row.original
            })
          }
          onDelete={async (items) => {
            try {
              const skus = items.map((item) => item.sku)
              await deleteProducts(skus)
              await fetchData()
              success('Eliminazione completata')
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Errore eliminazione'
              console.error(err)
              errorRef.current?.('Errore', message)
            }
          }}
        />
      )}

      <ViewDynamic
        open={viewer.open}
        onOpenChange={(open) => setViewer((prev) => ({ ...prev, open }))}
        title={viewer.title}
        values={viewer.data}
        fields={viewFields}
      />
    </main>
  )
}

---
### ./app/(dashboard)/fornitori/actions.ts

'use client'

import { createClient } from '@/lib/supabase/client'
import { Supplier } from './page'

const supabase = createClient()

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('fornitori')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertSupplier(data: Partial<Supplier>) {
  const { id, ...rest } = data

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw new Error(userError.message)
  if (!user) throw new Error('Utente non autenticato')

  const input = {
    ...rest,
    user_id: user.id,
  }

  if (id) {
    // UPDATE
    const { error, data: result } = await supabase
      .from('fornitori')
      .update(input)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  } else {
    // INSERT
    const { error, data: result } = await supabase
      .from('fornitori')
      .insert([input])
      .select()

    if (error) throw new Error(error.message)
    return result[0]
  }

}
export async function deleteSupplier(id: number) {
  const { error } = await supabase
    .from('fornitori')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}


export async function fetchSupplierCategories(): Promise<{ label: string; value: string }[]> {
  const { data, error } = await supabase
    .from('categorie')
    .select('label')
    .order('label', { ascending: true })

  if (error) throw new Error(error.message)

  return data?.map((c) => ({ label: c.label, value: c.label })) ?? []
}


---
### ./app/(dashboard)/fornitori/page.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { fetchSuppliers, upsertSupplier, deleteSupplier, fetchSupplierCategories } from './actions'
import { useNotify } from '@/hooks/use-notify'
import { FormDynamic, FormField } from '@/components/form/form-dynamic'
import { DataTableDynamic } from '@/components/table/data-table-dynamic'
import { availableCountries } from '@/lib/data/countries'
import { openDrawerForm } from '@/lib/utils/forms'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export type Supplier = {
  id: number
  denominazione: string
  codice_sdi?: string
  referente?: string
  partita_iva?: string
  codice_fiscale?: string
  paese?: string
  indirizzo?: string
  comune?: string
  cap?: string
  provincia?: string
  telefono?: string
  email?: string
  pec?: string
  note?: string
  categorie?: string[]
  user_id?: string
  created_at?: string
  updated_at?: string
}

/* ------------------------------------------------------------------ */
/* UI constants                                                       */
/* ------------------------------------------------------------------ */

const columnTypes = {
  denominazione: { type: 'string' as const },
  email:        { type: 'email'  as const },
  telefono:     { type: 'phone'  as const },
  categorie:    { type: 'list'   as const, flags: ['filter'] },
  paese:        { type: 'string'   as const, flags: ['filter'] },
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function SuppliersPage() {
  const { success, error } = useNotify()
  const errorRef = useRef(error)
  errorRef.current = error
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([])
  const [loading,   setLoading]   = useState(true)

  const supplierFormFields: FormField[] = [
    { name: 'denominazione', label: 'Denominazione', type: 'text', required: true },
    { name: 'codice_sdi',    label: 'Codice destinatario SDI', type: 'text', validation: 'sdi_code'},
    { name: 'referente',     label: 'Referente', type: 'text' },
    { name: 'partita_iva',   label: 'Partita IVA', type: 'text', validation: 'piva'},
    { name: 'codice_fiscale',label: 'Codice fiscale', type: 'text', validation: 'cf'},
    { name: 'paese',         label: 'Paese', type: 'select',
      options: availableCountries.map(c => ({ label: c, value: c })) },
    { name: 'indirizzo',     label: 'Indirizzo', type: 'text' },
    { name: 'comune',        label: 'Comune', type: 'text' },
    { name: 'cap',           label: 'CAP', type: 'text', validation: 'cap'},
    { name: 'provincia',     label: 'Provincia', type: 'text', validation: 'provincia'},
    { name: 'telefono',      label: 'Telefono', type: 'phone' },
    { name: 'email',         label: 'E-mail', type: 'email' },
    { name: 'pec',           label: 'PEC', type: 'email' },
    { name: 'note',          label: 'Note', type: 'textarea' },
    { name: 'categorie',     label: 'Categorie', type: 'multiselect', options: categories, placeholder: 'Seleziona categorie...' },
  ]

  /* ---------- fetch iniziale ---------- */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([fetchSuppliers(), fetchSupplierCategories()])
      .then(([suppliersResult, categoriesResult]) => {
        if (cancelled) return;

        if (suppliersResult.status === 'fulfilled') {
          setSuppliers(suppliersResult.value);
        } else {
          console.error('Errore fetchSuppliers:', suppliersResult.reason);
          if (typeof errorRef.current === 'function') errorRef.current('Errore', 'Impossibile caricare i fornitori');
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategories(categoriesResult.value);
        } else {
          console.error('Errore fetchSupplierCategories:', categoriesResult.reason);
          if (typeof errorRef.current === 'function') errorRef.current('Errore', 'Impossibile caricare le categorie');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);
  


  /* ---------- drawer form state ---------- */
  const [drawerForm, setDrawerForm] = useState<{
    open: boolean
    title: string
    fields: FormField[]
    onSubmit: (data: Partial<Supplier>) => void
    defaultValues?: Partial<Supplier>
  }>({ open: false, title: '', fields: [], onSubmit: () => {} })

  /* ====================== RENDER ====================== */
  return (
    <main className="p-2">
      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
      ) : (
        <DataTableDynamic<Supplier>
          data={suppliers}
          title="Fornitori"
          columnTypes={columnTypes}
          filters={{
            categorie: categories.map(c => c.value),
            paese: availableCountries,
          }}
          /* ---------- ADD ---------- */
          onAdd={() =>
            openDrawerForm(setDrawerForm, {
              title: 'Aggiungi Fornitore',
              fields: supplierFormFields,
              onSubmit: async (data) => {
                try {
                  await upsertSupplier(data)
                  setDrawerForm({ open: false, title: '', fields: [], onSubmit: () => {} })
                  const updatedSuppliers = await fetchSuppliers()
                  setSuppliers(updatedSuppliers)
                  success('Fornitore aggiunto', `Hai aggiunto "${data.denominazione}"`)
                } catch (e) {
                  console.error('Errore inserimento:', e)
                  error('Errore', 'Impossibile salvare il Fornitore')
                }
              },
            })
          }
          /* ---------- EDIT ---------- */
          onEdit={(row) => {
            const original = row.original
            openDrawerForm(setDrawerForm, {
              title: `Modifica Fornitore: ${original.denominazione ?? ''}`,
              fields: supplierFormFields,
              onSubmit: async (data) => {
                try {
                  await upsertSupplier({ ...original, ...data })
                  setDrawerForm({ open: false, title: '', fields: [], onSubmit: () => {} })
                  const updatedSuppliers = await fetchSuppliers()
                  setSuppliers(updatedSuppliers)
                  success('Fornitore aggiornato', `Hai modificato "${original.denominazione}"`)
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'Errore sconosciuto'
                  console.error('Errore modifica:', msg)
                  error('Errore', msg)
                }
              },
              defaultValues: original,
            })
          }}
          onDelete={async (items) => {
            try {
              await Promise.all(items.map(i => deleteSupplier(i.id)))
              setDrawerForm({ open: false, title: '', fields: [], onSubmit: () => {} })
              const updatedSuppliers = await fetchSuppliers()
              setSuppliers(updatedSuppliers)
              success('Eliminazione completata', `${items.length} elemento/i rimossi`)
            } catch (e) {
              console.error('Errore eliminazione:', e)
              error('Errore', 'Impossibile eliminare i fornitori selezionati')
            }
          }}
        />
      )}

      <FormDynamic
        key={drawerForm.defaultValues
          ? `edit-${drawerForm.defaultValues.id ?? JSON.stringify(drawerForm.defaultValues)}`
          : `add-${drawerForm.open}`}
        open={drawerForm.open}
        onOpenChange={(open) => setDrawerForm(prev => ({ ...prev, open }))}
        title={drawerForm.title}
        fields={drawerForm.fields}
        onSubmit={drawerForm.onSubmit}
        defaultValues={
          drawerForm.defaultValues
            ? Object.fromEntries(
                Object.entries(drawerForm.defaultValues)
                  .filter(([, v]) => typeof v === 'string' || Array.isArray(v))
                  .map(([k, v]) => [k, Array.isArray(v) ? v : String(v)])
              )
            : undefined
        }
      />
    </main>
  )
}

---
### ./app/(dashboard)/dashboard/[id]/page.tsx

// app/(dashboard)/dashboard/[id]/page.tsx

'use client'

import { useParams } from 'next/navigation'
import { ChatContainer } from '@/components/chat/chat-container'

export default function ChatPage() {
  const { id } = useParams()

  if (!id || typeof id !== 'string') {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        ⚠️ ID sessione mancante o non valido.
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <ChatContainer sessionId={id} />
    </div>
  )
}

---
### ./app/(dashboard)/dashboard/page.tsx

'use client'

import { ChatContainer } from '@/components/chat/chat-container'

export default function DashboardPage() {
  return (
    <div className="relative h-full flex flex-col">
      <ChatContainer />
    </div>
  )
}

---
### ./app/(dashboard)/layout.tsx

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        {/* ⚠️ Scroll solo dentro il main */}
        <div className="flex flex-1 flex-col h-[100dvh] overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          {/* se vuoi reinserire il footer */}
          <SiteFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


---
### ./app/(dashboard)/chats/actions.ts

import { createClient } from '@/lib/supabase/client'
import type { ChatSessionRow } from './page'

const supabase = createClient()

export async function fetchChatSessions(): Promise<ChatSessionRow[]> {
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) throw new Error(`Errore Supabase: ${sessionError.message}`)
  if (!data.session) throw new Error('Sessione utente non trovata')

  const token = data.session.access_token

  const res = await fetch('/api/chats', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    let errorMsg = `Errore caricamento sessioni (${res.status})`
    try {
      const errData = await res.json()
      errorMsg += `: ${errData?.error || JSON.stringify(errData)}`
    } catch (parseError) {
      const fallbackText = await res.text().catch(() => 'Risposta non leggibile')
      errorMsg += `: ${fallbackText}`
    }
    console.error('❌ fetchChatSessions error:', errorMsg)
    throw new Error(errorMsg)
  }

  return res.json()
}

export async function deleteChatSession(id: string): Promise<void> {
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) throw new Error(sessionError.message)
  if (!data.session) throw new Error('Sessione non trovata')

  const token = data.session.access_token

  const res = await fetch(`/api/chats/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`❌ Errore eliminazione sessione (${res.status}):`, errText)
    throw new Error(`Errore eliminazione sessione (${res.status})`)
  }
}

---
### ./app/(dashboard)/chats/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchChatSessions, deleteChatSession } from './actions'
import { useNotify } from '@/hooks/use-notify'
import { DataTableDynamic } from '@/components/table/data-table-dynamic'
import type { Row } from '@tanstack/react-table'

export type ChatSessionRow = {
  _id: string
  user_id: string
  email: string
  updatedAt: string
  firstMessage: string
}

const columnTypes = {
  email:        { type: 'email' as const, label: 'Utente' },
  updatedAt:    { type: 'dateTime' as const, label: 'Data' },
  firstMessage: { type: 'string' as const, label: 'Messaggio' },
  products:      { type: 'list' as const, label: 'Prodotti' },
}

export default function ChatSessionsPage() {
  const { success, error } = useNotify()
  const errorRef = useRef(error)
  errorRef.current = error

  const [sessions, setSessions] = useState<ChatSessionRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
  
    fetchChatSessions()
      .then(data => { if (!cancelled) setSessions(data) })
      .catch(e => {
        console.error('Errore fetchChatSessions:', e)
        errorRef.current('Errore', 'Impossibile caricare le sessioni chat')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
  
    return () => { cancelled = true }
  }, []) // solo array vuoto!  

  return (
    <main className="p-2">
      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
      ) : (
        <DataTableDynamic<ChatSessionRow>
          data={sessions}
          title="Chats"
          columnTypes={columnTypes}
          onAdd={() => window.location.assign('/dashboard')} // 👈 AGGIUNTO
          // onEdit riceve Row<ChatSessionRow>, devi usare .original
          onEdit={(row: Row<ChatSessionRow>) =>
            window.location.assign(`/dashboard/${row.original._id}`)
          }
          // onDelete riceve array di oggetti puri
          onDelete={async (rows: ChatSessionRow[]) => {
            try {
              await Promise.all(rows.map((row) => deleteChatSession(row._id)))
              setSessions(await fetchChatSessions())
              success('Sessione eliminata', 'Sessione rimossa')
            } catch (e) {
              console.error('Errore fetchChatSessions:', e)
              error('Errore', 'Impossibile eliminare una o più sessioni')
            }
          }}
        />
      )}
    </main>
  )
}
---
### ./app/(dashboard)/offerte/page.tsx

// app/(dashboard)/offerte/page.tsx
export default function OffertePage() {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-40 space-y-6">
    <h1 className="text-2xl font-bold">Generazione Offerta Intelligente</h1>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum nisl eu fringilla luctus.
      Suspendisse ut placerat leo. In nec massa ut leo vestibulum consequat at vel libero. Vestibulum ante
      ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
    </p>
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <h2 className="text-xl font-semibold">Sezione {i + 1}</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi sed metus in lorem fermentum
          accumsan. Aenean dapibus, neque a fringilla tincidunt, orci sapien hendrerit elit, ac pretium leo
          velit sed est. Sed a metus suscipit, dapibus eros in, pharetra leo. Integer ac tincidunt nisi.
          Vestibulum viverra feugiat nunc nec tincidunt. Pellentesque ut risus a elit lobortis tincidunt.
          Donec luctus rutrum libero, et pulvinar nibh egestas nec.
        </p>
        <p>
          Curabitur vel orci vel orci dignissim lacinia. Cras porta luctus nunc, sed pretium est semper
          tincidunt. Suspendisse potenti. Sed condimentum imperdiet ipsum, sed fermentum orci convallis ac.
          Integer accumsan sem sed velit ultricies, ac hendrerit velit lobortis.
        </p>
      </div>
    ))}
  </div>
  
  )
}

---
### ./app/page.tsx

// page.tsx

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')  // o la pagina che vuoi

  return null  // Non serve renderizzare nulla
}

---
### ./app/login/page.tsx

// app/login/page.tsx

'use client'
import { LoginForm } from "@/components/form/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}


---
### ./next-env.d.ts

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

---
### ./components/theme-provider.tsx

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

---
### ./components/ui/alert-dialog.tsx

"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

---
### ./components/ui/tabs.tsx

"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

---
### ./components/ui/card.tsx

import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

---
### ./components/ui/popover.tsx

"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

---
### ./components/ui/chart.tsx

"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color || item.payload.fill || item.color

          return (
            <div
              key={item.dataKey}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean
    nameKey?: string
  }) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={cn(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

---
### ./components/ui/sheet.tsx

"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

---
### ./components/ui/scroll-area.tsx

"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }

---
### ./components/ui/label.tsx

"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }

---
### ./components/ui/sonner.tsx

"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

---
### ./components/ui/drawer.tsx

"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

---
### ./components/ui/tooltip.tsx

"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

---
### ./components/ui/breadcrumb.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

---
### ./components/ui/command.tsx

"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("overflow-hidden p-0", className)}
        showCloseButton={showCloseButton}
      >
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

---
### ./components/ui/toggle-group.tsx

"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }

---
### ./components/ui/avatar.tsx

"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }

---
### ./components/ui/dialog.tsx

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

---
### ./components/ui/badge.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

---
### ./components/ui/sidebar.tsx

"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

---
### ./components/ui/table.tsx

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

---
### ./components/ui/separator.tsx

"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }

---
### ./components/ui/button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

---
### ./components/ui/toggle.tsx

"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }

---
### ./components/ui/checkbox.tsx

"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

---
### ./components/ui/dropdown-menu.tsx

"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}

---
### ./components/ui/select.tsx

"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

---
### ./components/ui/textarea.tsx

import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

---
### ./components/ui/input.tsx

import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

---
### ./components/ui/skeleton.tsx

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

---
### ./components/prodotti/searchProductsPaginated.ts

import { getMongoCollection } from '@/lib/mongo/client'
import type { ProductItem } from '@/app/(dashboard)/prodotti/page'
import { Document } from 'mongodb'

export type SearchProductsParams = {
  search?: string
  limit?: number
  offset?: number
  sortBy?: keyof ProductItem
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, string[]>
}

export async function searchProductsPaginated({
  search = '',
  limit = 50,
  offset = 0,
  sortBy = 'name',
  sortDir = 'asc',
  filters = {}
}: SearchProductsParams): Promise<{ data: ProductItem[]; total: number }> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')

  const pipeline: Document[] = []

  const filterConditions: Record<string, unknown> = {}
  Object.entries(filters).forEach(([field, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      filterConditions[field] = { $in: values }
    }
  })

  const query = search.trim()
  const hasQuery = query.length > 0
  const hasFilters = Object.keys(filterConditions).length > 0

  if (hasQuery) {
    pipeline.push({
      $search: {
        index: 'prodotti_index',
        text: {
          query,
          path: ['sku', 'name', 'description', 'category_name', 'colore'],
          fuzzy: {
            maxEdits: 1,
            prefixLength: 2
          }
        }
      }
    })
    if (hasFilters) pipeline.push({ $match: filterConditions })
  } else {
    if (hasFilters) pipeline.push({ $match: filterConditions })
  }

  pipeline.push({
    $facet: {
      data: [
        { $sort: { [sortBy]: sortDir === 'desc' ? -1 : 1 } },
        { $skip: offset },
        { $limit: limit },
        {
          $project: {
            sku: 1,
            name: 1,
            description: 1,
            unit_price: 1,
            qty: 1,
            supplier: 1,
            category_name: 1,
            thumbnail: 1,
            link: 1,
            colore: 1,
            taglia: 1
          }
        }
      ],
      total: [{ $count: 'count' }]
    }
  })

  const results = await prodotti.aggregate(pipeline, { allowDiskUse: true }).toArray()
  const response = results[0] || {}

  return {
    data: response.data || [],
    total: response.total?.[0]?.count || 0
  }
}

---
### ./components/form/multi-select.tsx

'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"
import { ScrollArea } from '@/components/ui/scroll-area'

export type MultiSelectOption = {
  label: string
  value: string
}

type MultiSelectProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleziona...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const filtered = React.useMemo(
    () =>
      options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  )

  const toggle = (val: string) => {
    onChange(
      value.includes(val)
        ? value.filter((v) => v !== val)
        : [...value, val]
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-sm"
          >
            {value.length > 0
              ? `${value.length} selezionate`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-3 space-y-2">
          <Input
            placeholder="Cerca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />

          {value.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-xs text-red-500 hover:underline"
            >
              Cancella selezione
            </button>
          )}

          <ScrollArea className="h-[200px] pr-2">
            <div className="space-y-1">
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nessun risultato
                </div>
              )}
              {filtered.map((option) => {
                const selected = value.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-accent',
                      selected && 'bg-accent'
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center size-4 rounded border border-muted shrink-0',
                        selected && 'bg-primary'
                      )}
                    >
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {option.label}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((val) => {
            const opt = options.find((o) => o.value === val)
            return (
              <Badge
                key={val}
                variant="outline"
                className="text-sm pr-1 pl-2 py-1 flex items-center gap-1"
              >
                {opt?.label ?? val}
                <button
                  type="button"
                  onClick={() =>
                    onChange(value.filter((v) => v !== val))
                  }
                  className="hover:bg-muted rounded p-0.5"
                  aria-label="Rimuovi"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

---
### ./components/form/login-form.tsx

'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
//import { use } from "react"

import Image from 'next/image'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // 1. Stati
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // 2. Funzione submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard") // redirect dopo login ok
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex justify-center">
        <Image
          src="/logo.svg"
          alt="Premium S.r.l."
          width={0}
          height={0}
          sizes="40vw"
          style={{ width: '40%', height: 'auto' }}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 3. Collega handleSubmit */}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                {/* 4. Collega email state */}
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {/* 4.Forgot your password? */}
                  </a>
                </div>
                {/* 4. Collega password state */}
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* 5. Mostra errore */}
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="flex flex-col gap-3">
               <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Accesso in corso..." : "Login"}
                </Button>

                {/* Mantieni o rimuovi login Google come preferisci */}
                {/* <Button variant="outline" className="w-full">
                  Login with Google
                </Button> */}
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
             {/*  Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>*/}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

---
### ./components/form/form-dynamic.tsx

'use client'

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller } from 'react-hook-form'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect } from '@/components/form/multi-select'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type FormField = {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'multiselect'
  required?: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
  validation?: string
}

type FormDynamicProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  fields: FormField[]
  defaultValues?: Record<string, string | string[]>
  onSubmit: (data: Record<string, string | string[]>) => void
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export function FormDynamic({
  open,
  onOpenChange,
  title = 'Inserisci dati',
  description,
  fields,
  onSubmit,
  defaultValues = {},
}: FormDynamicProps) {
  const VALIDATORS: Record<string, z.ZodTypeAny> = {
    sdi_code: z.string().regex(/^[A-Z0-9]{7}$/, 'Codice SDI non valido'),
    provincia: z.string().regex(/^[A-Z]{2}$/, 'Provincia non valida'),
    piva: z.string().regex(/^[0-9]{11}$/, 'Partita IVA non valida'),
    cf: z.string().regex(/^[A-Z0-9]{16}$/i, 'Codice fiscale non valido'),
    cap: z.string().regex(/^[0-9]{5}$/, 'CAP non valido'),
  }

  const shape: Record<string, z.ZodTypeAny> = {}
  fields.forEach((field) => {
    let base: z.ZodTypeAny

    if (field.type === 'multiselect') {
      if (field.required) {
        base = z.array(z.string()).min(1, 'Campo obbligatorio')
      } else {
        base = z.array(z.string()).optional()
      }
    } else if (field.required && field.validation && VALIDATORS[field.validation]) {
      const validator = VALIDATORS[field.validation]
      base = z.string()
        .min(1, 'Campo obbligatorio')
        .superRefine((val, ctx) => {
          if (val && !validator.safeParse(val).success) {
            const msg = validator.safeParse(val).error?.issues?.[0]?.message || 'Campo non valido'
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg })
          }
        })
    } else if (field.required) {
      base = z.string().min(1, 'Campo obbligatorio')
    } else if (field.validation && VALIDATORS[field.validation]) {
      const validator = VALIDATORS[field.validation]
      base = z.string().optional().superRefine((val, ctx) => {
        if (val && val !== '' && !validator.safeParse(val).success) {
          const msg = validator.safeParse(val).error?.issues?.[0]?.message || 'Campo non valido'
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg })
        }
      })
    } else {
      base = z.string().optional()
    }

    shape[field.name] = base
  })
  const schema = z.object(shape)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const internalSubmit = (data: Record<string, string | string[]>) => {
    onSubmit(data)
    reset()
    onOpenChange(false)
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl p-0">
        <form onSubmit={handleSubmit(internalSubmit)} className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mb-6">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>

                {field.type === 'textarea' && (
                  <Textarea id={field.name} {...register(field.name)} />
                )}

                {field.type === 'select' && (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: ctl }) => (
                      <Select
                        value={ctl.value as string}
                        onValueChange={(val) => ctl.onChange(val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona…" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}

                {['text', 'email', 'phone'].includes(field.type) && (
                  <Input id={field.name} type={field.type} {...register(field.name)} />
                )}

                {field.type === 'multiselect' && (
                  <Controller
                    name={field.name}
                    control={control}
                    defaultValue={[]}
                    render={({ field: ctl }) => (
                      <MultiSelect
                        options={field.options || []}
                        value={ctl.value ?? []}
                        onChange={ctl.onChange}
                        placeholder={field.placeholder || 'Seleziona...'}
                      />
                    )}
                  />
                )}

                {errors[field.name] && (
                  <p className="text-sm text-red-500">
                    {(errors[field.name]?.message as string) || 'Campo non valido'}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SheetFooter className="px-6 py-4 border-t">
            <Button type="submit">Salva</Button>
            <SheetClose asChild>
              <Button variant="outline" type="button" onClick={() => reset(defaultValues)}>
                Annulla
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

---
### ./components/chat/chat-container.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createChatSession, getSessionHistoryMongo } from './chat-actions'
import { ChatInput } from './chat-input'
import { ChatMessageItem } from './chat-message-item'
import { sendChatMessage } from './chat-api'
import type { UIMessage } from './types'

type ChatContainerProps = {
  sessionId?: string
}

export function ChatContainer({ sessionId: initialSessionId }: ChatContainerProps) {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null)
  const [authError, setAuthError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll automatico
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Caricamento messaggi se sessionId è fornito da props
  const [invalidSession, setInvalidSession] = useState(false)

  useEffect(() => {
    const loadMessages = async () => {
      if (!initialSessionId) return
      try {
        const rawMessages = await getSessionHistoryMongo(initialSessionId)
  
        if (!rawMessages || rawMessages.length === 0) {
          setInvalidSession(true)
          return
        }
  
        const uiMessages: UIMessage[] = rawMessages.map((msg) => ({
          ...msg,
          session_id: msg.session_id.toString(),
          _id: msg._id.toString(),
          _ui_id: `from-db-${msg._id.toString()}`,
        }))
  
        setMessages(uiMessages)
      } catch (err) {
        console.error('Errore nel caricamento dei messaggi:', err)
        setInvalidSession(true)
      }
    }
  
    loadMessages()
  }, [initialSessionId])
  
  

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    let currentSessionId = sessionId

    // Crea sessione SOLO al primo messaggio, se non esiste
    if (!currentSessionId) {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        setAuthError('⚠️ Utente non autenticato. Effettua il login.')
        return
      }

      currentSessionId = await createChatSession(data.user.id)
      setSessionId(currentSessionId)
    }

    const timestamp = new Date().toISOString()
    const uid = `${Date.now()}-${Math.random()}`

    const userMessage: UIMessage = {
      _ui_id: `user-${uid}`,
      session_id: currentSessionId,
      user_id: 'me',
      role: 'user',
      content: text,
      createdAt: timestamp
    }

    const loadingMessage: UIMessage = {
      _ui_id: `loading-${uid}`,
      session_id: currentSessionId,
      user_id: 'assistant',
      role: 'assistant',
      content: '',
      createdAt: timestamp,
      isTyping: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setIsLoading(true)

    try {
      const res = await sendChatMessage(text, currentSessionId)

      const aiMessage: UIMessage = {
        _ui_id: `ai-${uid}`,
        session_id: currentSessionId,
        user_id: 'assistant',
        role: 'assistant',
        content: res.summary,
        products: res.products,
        intent: res.intent,
        recommended: res.recommended,
        createdAt: new Date().toISOString(),
        _id: res._id
      }

      setMessages(prev =>
        prev.filter(m => m._ui_id !== loadingMessage._ui_id).concat(aiMessage)
      )
    } catch (err) {
      console.error(err)

      const errorMessage: UIMessage = {
        _ui_id: `error-${uid}`,
        session_id: currentSessionId!,
        user_id: 'assistant',
        role: 'assistant',
        content: '⚠️ Ops! Qualcosa è andato storto. Riprova.',
        createdAt: new Date().toISOString()
      }

      setMessages(prev =>
        prev.filter(m => m._ui_id !== loadingMessage._ui_id).concat(errorMessage)
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-40">
          {authError && (
            <div className="text-red-500 text-center">{authError}</div>
          )}

          {invalidSession && (
            <div className="text-red-500 text-center py-4">
              ⚠️ La sessione specificata non esiste o è stata eliminata.
            </div>
          )}

          {messages.map(msg => (
            <ChatMessageItem key={msg._ui_id} message={msg} />
          ))}

          <div ref={scrollRef} className="h-1" />
        </div>
      </div>

      <div className="w-full border-t bg-background">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </>
  )
}

---
### ./components/chat/chat-exctract-entities.tsx

import { OpenAI } from 'openai'
import type { ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

export async function extractEntitiesLLM(text: string): Promise<ExtractedEntity[]> {
  const prompt = `
Estrai entità strutturate dalla frase utente seguente.

TIPI DI ENTITÀ:
- sku: codice prodotto (es. "5071", "MO8422", "AR1010")
- quantity: quantità richiesta o minima (es. "10", "almeno 100", "200")
- color: nome del colore (es. "rosso", "blu", "giallo")
- size: taglia (es. "S", "M", "L", "XL")
- category: categoria prodotto (es. "maglietta", "penna", "zaino")
- supplier: nome del fornitore (es. "MidOcean", "GiftLine")
- other: qualsiasi altra informazione strutturata utile

FORMAT OUTPUT:
Devi restituire solo un oggetto JSON valido nel formato:
{
  "entities": [
    { "type": "sku", "value": "MO8422" },
    { "type": "quantity", "value": "100" }
  ]
}

ESEMPI DI INPUT/OUTPUT:

Input: "Vorrei 100 penne blu MO8422"
Output:
{
  "entities": [
    { "type": "quantity", "value": "100" },
    { "type": "category", "value": "penne" },
    { "type": "color", "value": "blu" },
    { "type": "sku", "value": "MO8422" }
  ]
}

Input: "Avete prodotti di MidOcean taglia L?"
Output:
{
  "entities": [
    { "type": "supplier", "value": "MidOcean" },
    { "type": "size", "value": "L" }
  ]
}

Frase utente:
"""
${text}
"""
  `.trim()

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Sei un estrattore di entità strutturate. Rispondi sempre e solo con JSON valido nel formato richiesto.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    max_tokens: 600
  })

  const content = res.choices?.[0]?.message?.content
  logger.info('[extractEntitiesLLM] Raw response content', { content })

  if (!content) throw new Error('Risposta LLM vuota')

  try {
    const parsed = JSON.parse(content)
    if (!parsed.entities || !Array.isArray(parsed.entities)) throw new Error('Formato entità non valido')
    logger.info('[extractEntitiesLLM] Entità estratte con successo', {
      input: text,
      entities: parsed.entities
    })
    return parsed.entities as ExtractedEntity[]
  } catch (err) {
    logger.error('Parsing fallito in extractEntitiesLLM', {
      input: text,
      content,
      error: err
    })
    return []
  }
}

---
### ./components/chat/chat-message-item.tsx

'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Eye, ShoppingCart, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UIMessage } from './types' // 👈 usa UIMessage (tipizzato per il client)

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0s]" />
      <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
    </div>
  )
}

export function ChatMessageItem({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'

  const initial =
    message.feedback?.rating === 'positive'
      ? 'positive'
      : message.feedback?.rating === 'negative'
      ? 'negative'
      : undefined

  const [feedback, setFeedback] = useState<'positive' | 'negative' | undefined>(initial)

  const supabase = createClient()

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  const products = message.products ?? []
  const reasons: Record<string, string> =
    message.recommended?.reduce((acc, rec) => {
      acc[rec.sku] = rec.reason
      return acc
    }, {} as Record<string, string>) || {}

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    setFeedback(rating)

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        console.error('Utente non autenticato per feedback')
        return
      }

      const res = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messageId: message._id,
          rating,
          comment: '' // opzionale
        })
      })

      if (!res.ok) {
        console.error('Errore nel salvataggio del feedback')
      }
    } catch (error) {
      console.error('Errore di rete nel feedback', error)
    }
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl p-4 mb-4',
          isUser
            ? 'bg-primary text-white rounded-br-none dark:bg-white dark:text-black'
            : 'bg-muted text-muted-foreground rounded-bl-none'
        )}
        title={message.createdAt ?? undefined}
      >
        {message.isTyping ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-line">{message.content}</p>
        )}


        {formattedTime && (
          <p className="text-[10px] mt-1 text-right opacity-60">{formattedTime}</p>
        )}

        {!isUser && products.length > 0 && (
          <div className="mt-4 space-y-4">
            {products.map((product) => (
              console.log('Product:', product),
              <div
                key={product.sku}
                title={`SKU: ${product.sku}`}
                className="relative border rounded-xl p-4 flex items-start gap-4 bg-background shadow-sm"
              >
                <div className="flex-1 pr-20">
                  <div className="flex gap-4">
                    <Image
                      src={product.thumbnail || '/placeholder.png'}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(product.unit_price ?? 0).toFixed(2)} € · {product.supplier}
                      </p>

                      {product.taglia && (
                        <p className="text-xs text-muted-foreground">
                          Taglia: <span className="font-medium">{product.taglia}</span>
                        </p>
                      )}
                      <p className={cn(
                        "text-xs mt-1 font-medium",
                        (product.qty ?? 0) > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ({product.qty ?? 0}) {(product.qty ?? 0) > 0 ? 'Disponibile' : 'Non disponibile'}
                      </p>
                      {reasons[product.sku] && (
                        <p className="text-xs mt-1 text-blue-700 italic">
                          <span className="font-semibold">Motivo:</span> {reasons[product.sku]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 flex flex-row gap-1">
                  {product.link && (
                    <a href={product.link} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 bg-background/70 backdrop-blur-sm border border-border"
                        aria-label="Vedi prodotto"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button
                    size="icon"
                    className="w-8 h-8 border border-border"
                    onClick={() => console.log(`Aggiunto ${product.sku}`)}
                    aria-label="Aggiungi al carrello"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isUser && !message.isTyping && (
          <div className="flex gap-2 mt-2 items-center">
            {!feedback ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-green-100"
                  aria-label="Feedback positivo"
                  onClick={() => handleFeedback('positive')}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-red-100"
                  aria-label="Feedback negativo"
                  onClick={() => handleFeedback('negative')}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <span className="text-xs opacity-70 pl-1">
                {feedback === 'positive' ? 'Grazie per il feedback 👍' : 'Grazie per il feedback 👎'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

---
### ./components/chat/chat-api.tsx

import { createClient } from '@/lib/supabase/client'
import type { ChatApiResponse } from './types'

type ChatApiRequest = {
  message: string
  sessionId: string
}

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatApiResponse> {
  // Auth Supabase
  const supabase = createClient()
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Utente non autenticato')
  }

  const requestPayload: ChatApiRequest = { message, sessionId }

  let data: ChatApiResponse | null = null

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(requestPayload)
    })

    if (!res.ok) {
      const errorDetail = await res.text()
      throw new Error(`Errore API ${res.status}: ${errorDetail}`)
    }

    data = await res.json()
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Errore nella richiesta o nella risposta della chat'
    )
  }

  // Validazione minima della risposta
  if (!data || !data.summary || typeof data.summary !== 'string') {
    throw new Error('La risposta della chat è vuota o non valida')
  }

  return {
    summary: data.summary,
    recommended: Array.isArray(data.recommended) ? data.recommended : [],
    products: Array.isArray(data.products) ? data.products : [],
    intent: data.intent,
    _id: data._id // <-- ora arriva dal backend
  }
}

---
### ./components/chat/types.ts

import type { ObjectId } from 'mongodb'

// ------------------ PRODOTTI ------------------
export type ProductItem = {
  sku: string
  name: string
  description: string
  unit_price: number
  qty?: number
  supplier: string
  category_name?: string[] // aggiornato qui
  thumbnail: string
  link?: string
  colore?: string
  taglia?: string
  score?: number
}

// ------------------ ENTITÀ ------------------
export type ExtractedEntity = {
  type: 'color' | 'size' | 'category' | 'sku' | 'quantity' | 'supplier' | 'other'
  value: string | number
}

// ------------------ RISPOSTA AI ------------------
export type ChatAIResponse = {
  summary: string
  recommended: {
    sku: string
    reason: string
  }[]
  intent?: 'info' | 'purchase' | 'support' | 'greeting' | 'feedback' | 'compare' | 'other'
  entities?: ExtractedEntity[]
}

// ------------------ FEEDBACK UTENTE ------------------
export type Feedback = {
  rating: 'positive' | 'negative' | 'neutral'
  comment?: string
  timestamp: string
}

// ------------------ MESSAGGIO CHAT (DB) ------------------
export type ChatMessage = {
  _id?: ObjectId
  session_id: ObjectId
  user_id: string
  role: 'user' | 'assistant'
  content: string
  products?: ProductItem[]
  recommended?: { sku: string; reason: string }[]
  intent?: string
  embedding?: number[]
  feedback?: Feedback
  entities?: ExtractedEntity[]
  createdAt: string
}

// ------------------ MESSAGGIO CHAT (UI) ------------------
export type UIMessage = Omit<ChatMessage, 'session_id' | '_id'> & {
  session_id: string
  _ui_id: string
  _id?: string // <-- solo string!
  isTyping?: boolean
}

// ------------------ SESSIONE CHAT ------------------
export type ChatSession = {
  _id?: ObjectId
  user_id: string
  createdAt: string
  updatedAt?: string
}

// ------------------ CONTESTO CONVERSAZIONALE ------------------
export type ChatContext = {
  messages: ChatMessage[]
  sessionId: string
}

// ------------------ RISPOSTA API CHAT (FRONTEND) ------------------
export type ChatApiResponse = {
  summary: string
  recommended: { sku: string; reason: string }[]
  products: ProductItem[]
  intent?: string
  _id?: string // <-- AGGIUNGI QUESTO!
}
---
### ./components/chat/chat-actions.ts

'use server'

import { ObjectId } from 'mongodb'
import type { Filter } from 'mongodb'
import { getMongoCollection } from '@/lib/mongo/client'
import { OpenAI } from 'openai'
import type { ProductItem, ChatAIResponse, ChatMessage, ChatSession, ChatContext, ExtractedEntity } from './types'
import { extractEntitiesLLM } from './chat-exctract-entities'
import { logger } from '@/lib/logger'


function cleanMongoObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object' && value._bsontype === 'ObjectID') {
      return value.toString()
    }
    return value
  }))
}

// ===============================
// 1. SESSIONI CHAT
// ===============================

/**
 * Crea una nuova sessione chat per uno user
 * @param userId - id univoco utente autenticato
 * @returns sessionId MongoDB come stringa
 */
export async function createChatSession(userId: string): Promise<string> {
  const sessions = await getMongoCollection<ChatSession>('chat_sessions')
  const now = new Date().toISOString()
  const res = await sessions.insertOne({
    user_id: userId,
    createdAt: now,
    updatedAt: now
  })
  logger.info('Sessione creata', { userId, sessionId: res.insertedId.toString() })
  return res.insertedId.toString()
}

// ===============================
// 2. CRUD MESSAGGI CHAT
// ===============================

/**
 * Salva un messaggio nella collection chat_messages
 * @param msg - oggetto messaggio parziale (verifica che tutti i campi obbligatori siano presenti)
 * @returns id del messaggio appena salvato (string)
 */
export async function saveMessageMongo(msg: Partial<ChatMessage>): Promise<string> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')

  const toInsert: ChatMessage = {
    session_id: typeof msg.session_id === 'string' ? new ObjectId(msg.session_id) : msg.session_id!,
    user_id: msg.user_id!,
    role: msg.role!,
    content: msg.content!,
    createdAt: msg.createdAt || new Date().toISOString(),
    products: msg.products,
    recommended: msg.recommended,
    intent: msg.intent,
    embedding: msg.embedding,
    feedback: msg.feedback,
    entities: msg.entities
  }

  const { insertedId } = await messages.insertOne(toInsert)

  const sessions = await getMongoCollection<ChatSession>('chat_sessions')
  await sessions.updateOne(
    { _id: toInsert.session_id },
    { $set: { updatedAt: new Date().toISOString() } }
  )

  logger.info('Messaggio salvato su Mongo', {
    role: msg.role,
    session_id: toInsert.session_id.toString(),
    messageId: insertedId.toString()
  })

  return insertedId.toString()
}



// ===============================
// 3. HISTORY CONVERSAZIONE (memoria breve)
// ===============================

/**
 * Restituisce la history della sessione (solo role+content)
 * Usato per "memoria breve" del prompt
 * @param sessionId - id della sessione
 * @param limit - quanti messaggi vuoi recuperare (default 5)
 */
export async function getSessionHistoryMongo(sessionId: string, limit = 10) {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')
  const history = await messages
    .find({ session_id: new ObjectId(sessionId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()

  return history.reverse().map(cleanMongoObject) // ✅ fix qui
}


// ===============================
// 4. RICERCA PRODOTTI HYBRID (Vector + Text)
// ===============================

/**
 * Ricerca prodotti tramite vector search su Mongo
 */
export async function searchByVectorMongo(queryVector: number[], limit = 5): Promise<(ProductItem & { score: number })[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')
  const results = await prodotti.aggregate([
    {
      $vectorSearch: {
        index: 'prodotti_vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: 100,
        limit
      }
    },
    {
      $project: {
        sku: 1,
        name: 1,
        description: 1,
        unit_price: 1,
        qty: 1,
        supplier: 1,
        category_name: 1,
        thumbnail: 1,
        link: 1,
        colore: 1,
        taglia: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).toArray()
  return results as (ProductItem & { score: number })[]
}

/**
 * Ricerca prodotti tramite text search su Mongo
 */
export async function searchByTextMongo(query: string, limit = 5): Promise<(ProductItem & { score: number })[]> {
  const prodotti = await getMongoCollection<ProductItem>('prodotti')
  const results = await prodotti.aggregate([
    {
      $search: {
        index: 'prodotti_index',
        text: {
          query,
          path: ['name', 'description', 'category_name', 'colore'],
          fuzzy: { maxEdits: 2 }
        }
      }
    },
    { $limit: limit },
    {
      $project: {
        sku: 1,
        name: 1,
        description: 1,
        unit_price: 1,
        qty: 1,
        supplier: 1,
        category_name: 1,
        thumbnail: 1,
        link: 1,
        colore: 1,
        taglia: 1,
        score: { $meta: 'searchScore' }
      }
    }
  ]).toArray()
  return results as (ProductItem & { score: number })[]
}

/**
 * Ricerca Hybrid combinata (vector + text + ranking)
 */
type ProductHybridResult = ProductItem & {
  vectorScore?: number
  textScore?: number
  hybridScore: number
}

export async function searchHybridMongo(
  query: string,
  embedding: number[],
  limit = 5
): Promise<ProductHybridResult[]> {
  const [vectorResults, textResults] = await Promise.all([
    searchByVectorMongo(embedding, limit * 2),
    searchByTextMongo(query, limit * 2)
  ])
  const merged: Record<string, ProductHybridResult> = {}
  for (const v of vectorResults) {
    merged[v.sku] = {
      ...v,
      vectorScore: v.score,
      hybridScore: v.score * 3
    }
  }
  for (const t of textResults) {
    if (merged[t.sku]) {
      merged[t.sku].textScore = t.score
      merged[t.sku].hybridScore += t.score
    } else {
      merged[t.sku] = {
        ...t,
        textScore: t.score,
        hybridScore: t.score * 3
      }
    }
  }
  const final = Object.values(merged)
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit)
  logger.info('[searchHybridMongo] risultati finali', { count: final.length, skus: final.map(x => x.sku) })
  return final
}

// ===============================
// 5. GENERAZIONE RISPOSTA AI (Prompt dinamico + output JSON)
// ===============================

const openai = new OpenAI()

/**
 * Costruisce prompt, chiama GPT-4o e restituisce output JSON parsed
 * @param message - domanda utente
 * @param products - prodotti da proporre
 * @param history - memoria breve (optional)
 * @returns oggetto ChatAIResponse
 */
export async function generateChatResponse({
  message,
  products,
  contextMessages,
  entities
}: {
  message: string
  products: ProductItem[]
  contextMessages?: ChatMessage[]
  entities?: ExtractedEntity[]
}): Promise<ChatAIResponse> {

  const entityBlock = Array.isArray(entities) && entities.length
    ? '🔸 ENTITIES:\n' + entities.map(e => `- ${e.type}: ${e.value}`).join('\n')
    : ''

  const historyBlock = Array.isArray(contextMessages) && contextMessages.length
    ? '🔸 CONVERSATION_HISTORY:\n' +
      contextMessages.map(h => `[${h.role}] ${h.content}`).join('\n')
    : ''

    const productBlock = products.length
    ? products.map(p =>
        `- ${p.name} (${p.unit_price}€), SKU: ${p.sku}, Categoria: ${
          Array.isArray(p.category_name)
            ? p.category_name.join(' / ')
            : p.category_name || 'N/A'
        }`).join('\n')
    : 'Nessun prodotto disponibile.'
  

  const prompt = `
🔸 USER_GOAL:
${message}

${entityBlock}

${historyBlock}

🔸 PRODUCT_CONTEXT:
${productBlock}

🔸 CONSTRAINTS:
- Suggerisci massimo 4 prodotti (solo se presenti)
- Se non ci sono prodotti disponibili, non suggerire nulla
- Motiva la scelta per ciascun prodotto (campo "reason")
- Classifica l'intento tra info, purchase, support, greeting, feedback, compare, other

🔸 FORMAT_OUTPUT:
{
  "summary": "...",
  "recommended": [
    { "sku": "...", "reason": "..." }
  ],
  "intent": "...",
  "entities": [{"type": "...", "value": "..."}]
}
Rispondi solo in JSON valido.
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente esperto di prodotti promozionali. Rispondi solo in JSON valido.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) throw new Error('Risposta AI vuota')

  let parsed: ChatAIResponse
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    logger.error('Parsing JSON risposta AI fallito', { rawContent })
    throw new Error('Risposta AI non in JSON')
  }

  // Sanity check: se non ci sono prodotti, non devono esserci raccomandazioni
  if (!products.length && parsed.recommended?.length) {
    parsed.recommended = []
    logger.warn('Nessun prodotto disponibile, ma il modello ha suggerito comunque raccomandazioni', { message })
  }

  // PATCH: fallback confronto parziale se uno SKU non trovato
  if (
    parsed.intent === 'compare' &&
    (!parsed.recommended || parsed.recommended.length === 0) &&
    products.length > 0 &&
    entities?.some(e => e.type === 'sku')
  ) {
    const requestedSKUs = entities
  .filter(e => e.type === 'sku')
  .map(e => String(e.value))

  const foundSKUs = products.map(p => String(p.sku))
  const missingSKUs = requestedSKUs.filter(sku => !foundSKUs.includes(sku))


    parsed.recommended = products.map(p => ({
      sku: p.sku,
      reason: 'Prodotto disponibile per il confronto'
    }))

    parsed.summary += ` Solo alcuni prodotti sono stati trovati: ${foundSKUs.join(', ')}. `
    if (missingSKUs.length) {
      parsed.summary += `Non ho trovato: ${missingSKUs.join(', ')}.`
    }

    logger.info('[generateChatResponse] Confronto parziale ricostruito', {
      found: foundSKUs,
      missing: missingSKUs
    })
  }

  logger.info('Risposta AI generata', {
    summary: parsed.summary,
    intent: parsed.intent,
    nRecommended: parsed.recommended.length
  })

  return parsed
}


// ===============================
// 6. FEEDBACK SU MESSAGGIO (aggiornamento)
// ===============================

/**
 * Aggiorna il feedback di un messaggio (PATCH)
 * @param messageId - Mongo ObjectId del messaggio
 * @param feedback - oggetto feedback ({ rating, comment?, timestamp })
 */
export async function updateMessageFeedback(
  messageId: string,
  feedback: { rating: 'positive' | 'negative' | 'neutral', comment?: string }
): Promise<void> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')
  const timestamp = new Date().toISOString()
  await messages.updateOne(
    { _id: new ObjectId(messageId) },
    { $set: { feedback: { ...feedback, timestamp } } }
  )
  logger.info('Feedback aggiornato', { messageId, feedback })
}


export async function getConversationContext(sessionId: string, embedding: number[], limit = 5): Promise<ChatContext> {
  const messages = await getMongoCollection<ChatMessage>('chat_messages')

  const contextMessages = await messages.aggregate([
    {
      $vectorSearch: {
        index: 'chat_messages_vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 100,
        limit: 20
      }
    },
    {
      $match: { session_id: new ObjectId(sessionId) }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 1,
        content: 1,
        role: 1,
        session_id: 1,
        user_id: 1,
        createdAt: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).toArray() as ChatMessage[] // 👈 cast esplicito

  return {
    sessionId,
    messages: contextMessages
  }
}


/**
 * Estrae entità dal messaggio utente tramite AI,
 * costruisce la query su tutti i campi strutturati (sku, quantity, color, size, category, supplier...),
 * cerca prodotti nel DB in modo filtrato,
 * e fa fallback automatico sulla search ibrida se non trova nulla.
 */
export async function getProductsByEntitiesAI(
  message: string,
  embedding: number[],
  maxResults = 10
): Promise<{ products: ProductItem[]; entities: ExtractedEntity[] }> {
  // Step 1 – Estrazione entità tramite OpenAI
  const entities = await extractEntitiesLLM(message)
  logger.info('[getProductsByEntitiesAI] Entità estratte', { entities })

  // Step 2 – Costruzione query Mongo a partire dalle entità
  const query: Filter<ProductItem> = {}

  const safeEntities = Array.isArray(entities) ? entities : []
  for (const e of safeEntities) {
    if (e.type === 'sku' && typeof e.value === 'string') {
      if (!query.sku) query.sku = { $in: [] }
      ;(query.sku as { $in: string[] }).$in.push(e.value)
    }

    if (e.type === 'quantity' && typeof e.value === 'string') {
      const match = e.value.match(/\d+/) // estrae primo numero
      const n = match ? Number(match[0]) : NaN
      if (!isNaN(n)) {
        query.qty = { $gte: n }
      }
    }

    if (e.type === 'color' && typeof e.value === 'string') {
      query.colore = e.value
    }

    if (e.type === 'size' && typeof e.value === 'string') {
      query.taglia = e.value
    }

    if (e.type === 'category' && typeof e.value === 'string') {
      query.category_name = { $in: [e.value] }
    }    

    if (e.type === 'supplier' && typeof e.value === 'string') {
      query.supplier = e.value // 👈 mapping corretto
    }
  }

  // Step 3 – Esecuzione query strutturata
  let products: ProductItem[] = []

  if (Object.keys(query).length > 0) {
    const prodottiColl = await getMongoCollection<ProductItem>('prodotti')
    products = await prodottiColl.find(query).limit(maxResults).toArray()
    logger.info('[getProductsByEntitiesAI] Prodotti trovati con query strutturata', {
      count: products.length,
      query
    })
  }

  // Step 4 – Fallback a ricerca ibrida se nessun prodotto trovato
  if (!products.length) {
    logger.info('[getProductsByEntitiesAI] Nessun prodotto trovato, fallback a searchHybridMongo')
    const hybridResults = await searchHybridMongo(message, embedding, maxResults)

    // 🔍 Filtro opzionale su supplier se presente tra le entità
    const supplierEntity = safeEntities.find(e => e.type === 'supplier' && typeof e.value === 'string')
    if (supplierEntity) {
      products = hybridResults.filter(p => p.supplier === supplierEntity.value)
      logger.info('[getProductsByEntitiesAI] Filtrati per supplier nel fallback', {
        supplier: supplierEntity.value,
        filteredCount: products.length
      })
    } else {
      products = hybridResults
    }
  }

  return { products, entities }
}

---
### ./components/chat/chat-embedding.tsx

import { OpenAI } from 'openai'

const openai = new OpenAI()
const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * Genera embedding vettoriale per testo (sanitize incluso)
 * @param text - testo da embeddare
 * @returns number[] embedding OpenAI
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // Sanitize: newline, lower, trim, collapse spaces
  const input = text.replace(/\n/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim()

  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input
  })

  const embedding = res.data?.[0]?.embedding

  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Embedding non generato o malformato da OpenAI')
  }

  return embedding
}

---
### ./components/chat/chat-input.tsx

'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="sticky bottom-0 w-full border-t bg-background px-4 pt-4">
      <div className="max-w-3xl mx-auto relative">
        <Textarea
          placeholder="Scrivi qui la tua richiesta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] resize-none pr-12"
          disabled={disabled}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2"
          onClick={handleSend}
          disabled={disabled}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

---
### ./components/layout/nav-main.tsx

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const path = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = path === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={isActive ? "bg-accent/50" : ""}
                >
                  <Link
                    href={item.url}
                    className="flex w-full items-center px-4 py-2 text-sm focus:outline-none focus:ring-2"
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

---
### ./components/layout/site-header.tsx

"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { usePathname } from "next/navigation"


function getTitleFromPath(path: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/offerte": "Offerte",
    "/clienti": "Clienti",
    "/fornitori": "Fornitori",
    "/chats": "Chats",
    "/prodotti": "Prodotti",
  }
  return map[path] ?? "Area Riservata"
}


export function SiteHeader() {
  const pathname = usePathname()
  const title = getTitleFromPath(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
---
### ./components/layout/site-footer.tsx

"use client"

export function SiteFooter() {
  const env = process.env.NEXT_PUBLIC_ENV?.toUpperCase()
  const branch = process.env.NEXT_PUBLIC_GIT_COMMIT_REF
  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA

  return (
    <footer className="w-full py-4 px-2 text-center text-xs text-muted-foreground font-mono">
      <span className="inline-block rounded bg-muted px-2 py-1">
        Ver: {env} | {branch} @ {commit?.slice(0, 7)}
      </span>
    </footer>
  )
}

---
### ./components/layout/app-sidebar.tsx

"use client"

import * as React from "react"
import Link from "next/link"
import Image from 'next/image'
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  IconDashboard,
  IconListDetails,
  IconUsers,
  IconBuildingStore,
  IconLogout,
  IconMessageDots,
  IconPackage
} from "@tabler/icons-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  
    // 🔒 Elimina i cookie Supabase (client-side)
    document.cookie = 'sb-access-token=; Max-Age=0; Path=/;'
    document.cookie = 'sb-refresh-token=; Max-Age=0; Path=/;'
  
    router.push("/login")
  }
  

  const data = {
    navMain: [
      { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
      { title: "Chats", url: "/chats", icon: IconMessageDots },
      { title: "Prodotti", url: "/prodotti", icon: IconPackage },
      { title: "Offerte",    url: "/offerte", icon: IconListDetails },
      { title: "Clienti",    url: "/clienti", icon: IconUsers },
      { title: "Fornitori",  url: "/fornitori", icon: IconBuildingStore },
    ],
    navSecondary: [
      { title: "Logout", icon: IconLogout, onClick: handleLogout },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Premium S.r.l."
                width={0}
                height={0}
                sizes="50vw"
                style={{ width: '50%', height: 'auto' }}
              />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}

---
### ./components/layout/nav-secondary.tsx

"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url?: string
    icon: Icon
    onClick?: () => void
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.url ? (
                <a
                  href={item.url}
                  onClick={item.onClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent focus:outline-none focus:ring-2"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent focus:outline-none focus:ring-2"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </button>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

---
### ./components/table/data-table-dynamic.tsx

'use client'


import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  VisibilityState,
  Row,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
  IconDotsVertical,
  IconRefresh,
} from '@tabler/icons-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'


export type GenericObject = Record<string, unknown>

export type ColumnType =
  | { type: 'string' }
  | { type: 'email' }
  | { type: 'phone' }
  | { type: 'list'; flags?: string[] }
  | { type: 'dateTime' } // 👈 aggiunto

export interface DataTableDynamicProps<
  T extends Record<string, unknown> = GenericObject
> {
  data: T[]
  title?: string
  filters?: Record<string, string[]>
  columnTypes: Record<string, ColumnType>
  onAdd?: () => void
  onEdit?: (row: Row<T>) => void
  onDelete?: (items: T[]) => void
}


export function DataTableDynamic<
  T extends Record<string, unknown> = GenericObject
>({
  data,
  title = 'Table',
  filters = {},
  columnTypes,
  onAdd,
  onEdit,
  onDelete,
}: DataTableDynamicProps<T>) {

  const [globalFilter, setGlobalFilter] = React.useState('')
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string[]>
  >({})
  const [itemsToDelete, setItemsToDelete] = React.useState<T[]>([])   // invece di T | null
  const [dialogOpen, setDialogOpen] = React.useState(false)



  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setGlobalFilter(value), 250)
  }


  const filteredData = React.useMemo(() => {
    return data.filter((item) =>
      Object.entries(filterValues).every(([key, selected]) => {
        if (!selected?.length) return true

        const field = item[key as keyof T]

        if (Array.isArray(field)) {
          return selected.some((v) =>
            (field as unknown[]).includes(v as unknown)
          )
        }
        return selected.includes(String(field))
      })
    )
  }, [data, filterValues])


  const columns = React.useMemo<ColumnDef<T>[]>(() => {
    if (data.length === 0) return []

    const dynamic = Object.entries(columnTypes).map(([key, cfg]) => ({
      accessorKey: key,
      header: 'label' in cfg && typeof cfg.label === 'string'
      ? cfg.label
      : key.charAt(0).toUpperCase() + key.slice(1),
      
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const v = getValue() as string

        if (cfg.type === 'email')
          return (
            <a href={`mailto:${v}`} className="text-blue-600 underline">
              {v}
            </a>
          )

        if (cfg.type === 'phone')
          return (
            <a href={`tel:${v}`} className="text-blue-600 underline">
              {v}
            </a>
          )
        
        if (cfg.type === 'dateTime') {
          const date = new Date(v)
          if (isNaN(date.getTime())) return '—'
          return date.toLocaleString('it-IT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        }

        if (cfg.type === 'list')
          return (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(v) &&
                v.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
            </div>
          )

        return v
      },
    }))

    const selectCol: ColumnDef<T> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="size-4"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="size-4"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    const actionCol: ColumnDef<T> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onEdit?.(row)}>
                Modifica
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={() => {
                  setItemsToDelete([item])
                  setDialogOpen(true)        // 🆕 apre il dialogo
                }}
              >
                Cancella
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
    }

    return [selectCol, ...dynamic, actionCol]
  }, [data, columnTypes, onEdit])


  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, columnVisibility, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  })

  return (
    <div className="space-y-4">

      <div className="space-y-2 px-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="text"
              placeholder="Cerca..."
              className="w-[200px]"
              onChange={handleSearchChange}
              defaultValue={globalFilter}
            />

            {Object.entries(filters).map(([key, options]) => (
                <DropdownMenu key={key}>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
                        <span className="truncate">
                        {filterValues[key]?.length
                            ? `(${filterValues[key].length}) selezionat*`
                            : `Seleziona ${key.charAt(0).toUpperCase() + key.slice(1)}`}
                        </span>
                        <IconChevronDown className="ml-2 size-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-60 max-h-64 overflow-auto">
                    {options.map((option) => (
                        <DropdownMenuCheckboxItem
                        key={option}
                        checked={filterValues[key]?.includes(option) ?? false}
                        onCheckedChange={(checked) => {
                            setFilterValues((prev) => {
                            const prevSelected = prev[key] ?? []
                            const newSelected = checked
                                ? [...prevSelected, option]
                                : prevSelected.filter((val) => val !== option)
                            return { ...prev, [key]: newSelected }
                            })
                        }}
                        >
                        {option}
                        </DropdownMenuCheckboxItem>
                    ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ))}

            <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                disabled={Object.values(filterValues).every((arr) => !arr?.length)}
                onClick={() => setFilterValues({})}
                >
                <IconRefresh className="mr-2 size-4" />
                Azzera Filtri
            </Button>

          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {table.getSelectedRowModel().rows.length > 0 && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
                onClick={() => {
                  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
                  if (selected.length === 0) return
                  setItemsToDelete(selected)   // 👈 array di elementi
                  setDialogOpen(true)          // apre il dialogo
                }}
              >
                Elimina Selezionate ({table.getSelectedRowModel().rows.length})
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns className="mr-2 size-4" />
                  Colonne
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      className="capitalize"
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="bg-black text-white border-black hover:bg-white hover:text-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-black dark:hover:text-white"
              onClick={onAdd}
            >
              <IconPlus className="mr-2 size-4" />
              Aggiungi
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border mx-4">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="capitalize cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc"
                      ? " ↑"
                      : header.column.getIsSorted() === "desc"
                      ? " ↓"
                      : ""}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
                  Nessun risultato trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Righe per pagina
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger id="rows-per-page" className="w-20" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-medium">
            Pagina {table.getState().pagination.pageIndex + 1} di {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronsRight className="size-4" />
          </Button>

          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Elimina fornitore</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione è irreversibile. Vuoi davvero eliminare{' '}
                  {itemsToDelete.length === 1 ? (
                    <strong>
                      {
                        ('denominazione' in itemsToDelete[0] &&
                        typeof itemsToDelete[0]['denominazione'] === 'string'
                          ? (itemsToDelete[0]['denominazione'] as string)
                          : 'questo elemento')
                      }
                    </strong>
                  ) : (
                    <strong>{itemsToDelete.length} elementi</strong>
                  )}
                  ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        if (itemsToDelete.length) onDelete?.(itemsToDelete)
                        setItemsToDelete([])
                        setDialogOpen(false)
                      }}
                  >
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </div>
  )
}

---
### ./components/table/data-table-dynamic-server.tsx

'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
  CellContext,
  VisibilityState,
  Row,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
  IconDotsVertical,
  IconRefresh,
} from '@tabler/icons-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { X } from 'lucide-react'

export type ColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'image'
  | 'email'
  | 'phone'
  | 'list'
  | 'dateTime'

  export type ColumnDefinition = {
    type: ColumnType
    label?: string
    flags?: ('filter')[]
  }

export interface DataTableDynamicServerProps<T extends Record<string, unknown>> {
  title: string
  data: T[]
  total: number
  search: string
  onSearchChange: (value: string) => void
  pageIndex: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  filters?: Record<string, string[]>
  activeFilters: Record<string, string[]>
  onFilterChange: (filters: Record<string, string[]>) => void
  onResetFilters?: () => void
  columnTypes: Record<keyof T, ColumnDefinition>
  onAdd?: () => void
  onEdit?: (row: Row<T>) => void
  onDelete?: (items: T[]) => void
  onView?: (row: { original: T }) => void
}

export function DataTableDynamicServer<T extends Record<string, unknown>>({
  title,
  data,
  total,
  search,
  onSearchChange,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  filters = {},
  activeFilters,
  onFilterChange,
  onResetFilters,
  columnTypes,
  onAdd,
  onEdit,
  onDelete,
  onView,
}: DataTableDynamicServerProps<T>) {
  const pagesCount = Math.ceil(total / pageSize)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [itemsToDelete, setItemsToDelete] = React.useState<T[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const columns = React.useMemo<ColumnDef<T>[]>(() => {
    const dynamic = Object.entries(columnTypes).map(([key, def]) => ({
      accessorKey: key,
      header:
        typeof def.label === 'string'
          ? def.label
          : key.charAt(0).toUpperCase() + key.slice(1),
      cell: (cell: CellContext<T, unknown>) => {
        const value = cell.getValue()
        switch (def.type) {
          case 'boolean':
            return value ? '✔️' : '—'
          case 'image':
            return typeof value === 'string' ? (
              <Image
                src={value}
                alt=""
                width={40}
                height={40}
                className="rounded object-contain"
              />
            ) : (
              '—'
            )
          case 'list':
            return Array.isArray(value) ? (
              value.map((v: string, i: number) => (
                <span
                  key={i}
                  className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {v}
                </span>
              ))
            ) : (
              '—'
            )
          case 'email':
            return typeof value === 'string' ? (
              <a href={`mailto:${value}`} className="underline text-blue-600">
                {value}
              </a>
            ) : (
              '—'
            )
          case 'phone':
            return typeof value === 'string' ? (
              <a href={`tel:${value}`} className="underline text-blue-600">
                {value}
              </a>
            ) : (
              '—'
            )
          case 'dateTime': {
            const d = new Date(value as string)
            return isNaN(d.getTime())
              ? '—'
              : d.toLocaleString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
          }
          default:
            return value ?? '—'
        }
      },
    }))  

    const selectCol: ColumnDef<T> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="size-4"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="size-4"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    const actionCol: ColumnDef<T> = {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            >
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {onView && <DropdownMenuItem onClick={() => onView({ original: row.original })}>Visualizza</DropdownMenuItem>}
            {onEdit && <DropdownMenuItem onClick={() => onEdit(row)}>Modifica</DropdownMenuItem>}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => {
                  setItemsToDelete([row.original])
                  setDialogOpen(true)
                }}>
                  Cancella
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectCol, ...dynamic, actionCol]
  }, [columnTypes, onView, onEdit, onDelete])

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      pagination: { pageIndex, pageSize }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater
      onPageChange(next.pageIndex)
      onPageSizeChange(next.pageSize)
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    manualPagination: true, // ✅ FIX FONDAMENTALE
  })  

  return (
    <div className="space-y-4">

        <div className="space-y-2 px-4">
            <div>
                <h1 className="text-xl font-semibold">{title}</h1>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-[200px]">
                <Input
                    type="text"
                    placeholder="Cerca..."
                    className="pr-8"
                    value={search}
                    onChange={(e) => {
                    onSearchChange(e.target.value)
                    onPageChange(0)
                    }}
                />
                {!!search && (
                    <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onSearchChange('')
                        onPageChange(0)
                      }}
                    aria-label="Cancella ricerca"                      
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-foreground hover:text-background transition"
                    >
                    <span className="text-xs font-bold"><X className="h-3.5 w-3.5" /></span>
                    </button>
                )}
                </div>

                {Object.entries(filters).map(([key, options]) => {
                const sorted = [...options].sort((a, b) => a.localeCompare(b))
                const label = columnTypes[key as keyof T]?.label ?? key
                return (
                    <DropdownMenu key={key}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
                        <span className="truncate">
                            {activeFilters[key]?.length
                            ? `(${activeFilters[key].length}) selezionat*`
                            : `Seleziona ${label}`}
                        </span>
                        <IconChevronDown className="ml-2 size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-60 max-h-64 overflow-auto">
                        {sorted.map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option}
                            checked={activeFilters[key]?.includes(option) ?? false}
                            onCheckedChange={(checked) => {
                            const current = activeFilters[key] ?? []
                            const updated = checked
                                ? [...current, option]
                                : current.filter((val) => val !== option)
                            onFilterChange({
                                ...activeFilters,
                                [key]: updated,
                            })
                            onPageChange(0)
                            }}
                        >
                            {option}
                        </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                    </DropdownMenu>
                )
                })}

                <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                disabled={Object.values(activeFilters).every((arr) => !arr?.length) && !search}
                onClick={() => {
                    if (typeof onResetFilters === 'function') {
                    onResetFilters()
                    } else {
                    // fallback per retrocompatibilità
                    onFilterChange({})
                    onSearchChange('')
                    }
                    onPageChange(0)
                }}
                >
                <IconRefresh className="mr-2 size-4" />
                Azzera Filtri
                </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                {table.getSelectedRowModel().rows.length > 0 && (
                    <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                    onClick={() => {
                        const selected = table.getSelectedRowModel().rows.map((r) => r.original)
                        if (selected.length === 0) return
                        setItemsToDelete(selected)
                        setDialogOpen(true)
                    }}
                    >
                    Elimina Selezionate ({table.getSelectedRowModel().rows.length})
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <IconLayoutColumns className="mr-2 size-4" />
                        Colonne
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                    {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((column) => {
                        const label = columnTypes[column.id as keyof T]?.label ?? column.id
                        return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                            }
                            className="capitalize"
                        >
                            {label}
                        </DropdownMenuCheckboxItem>
                        )
                    })}
                    </DropdownMenuContent>
                </DropdownMenu>
                {onAdd && (
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-black text-white border-black hover:bg-white hover:text-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-black dark:hover:text-white"
                    onClick={onAdd}
                >
                    <IconPlus className="mr-2 size-4" />
                    Aggiungi
                </Button>
                )}
                </div>

                
            </div>
    </div>

      <div className="overflow-hidden rounded-md border mx-4">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="capitalize cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc'
                      ? ' ↑'
                      : header.column.getIsSorted() === 'desc'
                      ? ' ↓'
                      : ''}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
                  Nessun risultato trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Righe per pagina
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger id="rows-per-page" className="w-20" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(0)}
            disabled={pageIndex === 0}
          >
            <IconChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            <IconChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-medium">
            Pagina {pageIndex + 1} di {pagesCount}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= pagesCount - 1}
          >
            <IconChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pagesCount - 1)}
            disabled={pageIndex >= pagesCount - 1}
          >
            <IconChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {onDelete && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare {itemsToDelete.length} elemento(i)?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onDelete(itemsToDelete)
                  setDialogOpen(false)
                  setItemsToDelete([])
                }}
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

---
### ./components/view/view-dynamic.tsx

'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export type ViewField = {
  name: string
  label: string
  type?: 'text' | 'image' | 'email' | 'phone' | 'link' | 'list' | 'date'
}

type ViewValue = string | number | string[] | Date | null | undefined

type ViewDynamicProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  fields: ViewField[]
  values: Record<string, ViewValue>
}

export function ViewDynamic({
  open,
  onOpenChange,
  title = 'Dettagli',
  fields,
  values,
}: ViewDynamicProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mb-6">
            {fields.map((field) => {
              const value = values?.[field.name]
              if (value === undefined || value === null || value === '') return null

              return (
                <div key={field.name} className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    {field.label}
                  </Label>

                  {field.type === 'image' && typeof value === 'string' ? (
                    <Image
                      src={value}
                      alt={field.label}
                      width={300}
                      height={160}
                      className="rounded shadow object-contain h-40 w-auto"
                    />
                  ) : field.type === 'email' && typeof value === 'string' ? (
                    <a
                      href={`mailto:${value}`}
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {value}
                    </a>
                  ) : field.type === 'phone' && typeof value === 'string' ? (
                    <a
                      href={`tel:${value}`}
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {value}
                    </a>
                  ) : field.type === 'link' && typeof value === 'string' ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {value}
                    </a>
                  ) : field.type === 'list' ? (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(value) ? value : String(value).split(',')).map((item, i) => (
                        <span
                          key={i}
                          className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {item.toString().trim()}
                        </span>
                      ))}
                    </div>
                  ) : field.type === 'date' && typeof value === 'string' ? (
                    <div className="text-sm">
                      {new Date(value).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {String(value)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

---
### ./components/theme-toggle.tsx

"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // evita problemi di hydration mismatch

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  )
}

---
### ./hooks/use-notify.ts

'use client'

import { toast } from 'sonner'

export function useNotify() {
  return {
    success: (title: string, description?: string) =>
      toast.success(title, { description }),

    error: (title: string, description?: string) =>
      toast.error(title, { description }),

    info: (title: string, description?: string) =>
      toast.info(title, { description }),

    warning: (title: string, description?: string) =>
      toast.warning(title, { description }),
  }
}

---
### ./hooks/use-mobile.ts

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

---
### ./lib/types/prodotto.ts

// lib/types/prodotto.ts

export type ProdottoMongo = {
    sku: string
    name: string
    description: string
    unit_price: number
    qty: number
    source: string
    category_name: string[] // ✅ ora è un array di stringhe
  
    // UI & AI
    thumbnail?: string
    link: string
    colore?: string
    taglia?: string
  
    // AI & versioning
    content_hash?: string
    embedding?: number[]
  
  }
---
### ./lib/auth/requireAuthUser.ts

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * Controlla autenticazione. 
 * Se fallisce, restituisce NextResponse 401; 
 * se ok, restituisce { user }
 */
export async function requireAuthUser(req: Request) {
  const supabase = createAdminClient()
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  // Raccolta informazioni per il log
  const url = req.url || 'unknown URL'
  const userAgent = req.headers.get('user-agent') || 'unknown user-agent'
  const ip = req.headers.get('x-forwarded-for') || 'unknown IP'

  if (!token) {
    logger.warn('Token mancante nella richiesta protetta', {
      url,
      userAgent,
      ip,
    })
    return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    logger.warn('Utente non autenticato o token invalido', {
      authError,
      url,
      userAgent,
      ip,
    })
    return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 })
  }

  return { user }
}

---
### ./lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



---
### ./lib/utils/view.ts

export function openViewDrawer<T>(
  setState: React.Dispatch<React.SetStateAction<{
    open: boolean
    title: string
    data: Partial<T>
  }>>,
  config: {
    title: string
    data: Partial<T>
  }
) {
  setState({
    open: true,
    title: config.title,
    data: config.data,
  })
}

---
### ./lib/utils/forms.ts

import { FormField } from "@/components/form/form-dynamic"

export function openDrawerForm<T>(
  setState: React.Dispatch<React.SetStateAction<{
    open: boolean
    title: string
    fields: FormField[]
    onSubmit: (data: Partial<T>) => void
    defaultValues?: Partial<T>
  }>>,
  config: {
    title: string
    fields: FormField[]
    onSubmit: (data: Partial<T>) => void
    defaultValues?: Partial<T>
  }
) {
  setState({
    open: true,
    title: config.title,
    fields: config.fields,
    onSubmit: config.onSubmit,
    defaultValues: config.defaultValues,
  })
}
---
### ./lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  )
}

---
### ./lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
}

---
### ./lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
---
### ./lib/logger.ts

import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
})

---
### ./lib/api/silan/logSkipped.ts

import type { RowCSV } from './types'
import { LOG_TYPE_SKIPPED_ROW, FORNITORE } from './constants'

/**
 * Logga una riga CSV scartata per problemi di validazione o parsing.
 * Può essere esteso per loggare in Supabase o Mongo.
 */
export async function logSkippedRow(params: {
  reason: string
  raw: RowCSV
  field?: string
  error?: string
}) {
  const { reason, raw, field } = params

  const log = {
    fornitore: FORNITORE,
    type: LOG_TYPE_SKIPPED_ROW,
    sku: raw.sku || 'N/A',
    field: field || undefined,
    reason,
    raw,
    timestamp: new Date().toISOString(),
  }

  // Per ora: log in console (puoi sostituire con Supabase o Mongo log)
  console.warn(`[SKIPPED ROW] ${log.sku} – ${reason}${field ? ` [${field}]` : ''}`)
  // TODO: salva in Mongo o Supabase
}

---
### ./lib/api/silan/types.ts

export type RowCSV = {
  sku: string
  name: string
  name_eng?: string
  description?: string
  description_eng?: string
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
  qty?: string
}

export type ProdottoMongo = {
  sku: string
  name: string
  name_eng?: string
  description: string
  unit_price?: number
  tier_price_1?: {
    qty: number
    price: number
  }
  msrp?: number
  qty_increments?: number
  category_name: string
  url_key?: string
  link: string
  type: 'simple' | 'configurable' | string
  parent_sku?: string
  simples_skus?: string[]
  grouped_skus?: string[]
  cs_skus?: string[]
  us_skus?: string[]
  image?: string
  small_image?: string
  thumbnail?: string
  media_gallery?: string[]
  visibility?: string
  attribute_set?: string
  taglia?: string
  colore?: string
  configurable_attributes?: string[]
  weight?: number
  qty: number
  source: 'silan'
  content_hash?: string
  embedding?: number[]
  created_at: Date
  updated_at: Date
}

export type QtyUpdateRow = {
  sku: string
  qty: number
  raw?: RowCSV
}

export type ElasticDoc = {
  sku: string
  name: string
  description: string
  category_name: string
  taglia?: string
  colore?: string
  weight?: number
  unit_price: number
}

export type EmbeddingRow = {
  sku: string
  content: string
  vector: number[]
  model: string
  metadata: {
    category?: string
    taglia?: string
    colore?: string
    unit_price?: number
    weight?: number
  }
}

---
### ./lib/api/silan/constants.ts

// 🏷️ Identificatore statico del fornitore
export const FORNITORE = 'silan' as const

// 🧱 MongoDB
export const MONGO_DB_NAME = 'Premium'
export const MONGO_COLLECTION_PRODOTTI = 'prodotti'

// ⚠️ Normalizzazioni e fallback
export const DEFAULT_QTY = 0
export const DEFAULT_TYPE = 'simple'
export const DEFAULT_ATTRIBUTE_SET = 'default'

// 🛑 Tipi di errore per logging
export const LOG_TYPE_VALIDATION_ERROR = 'validation_error'
export const LOG_TYPE_MONGO_ERROR = 'mongo_error'
export const LOG_TYPE_SKIPPED_ROW = 'skipped_row'
export const LOG_TYPE_MONGO_OK = 'mongo_ok'

---
### ./lib/api/silan/parseRow.ts

import type { RowCSV, ProdottoMongo } from './types'
import { normalizeSku } from './normalizeSku'
import {
  cleanString,
  safeParseFloat,
  safeParseInt,
  splitAndCleanArray,
  isValidImageUrl,
  buildMediaGallery,
} from './validators'
import { FORNITORE, DEFAULT_QTY, DEFAULT_TYPE, DEFAULT_ATTRIBUTE_SET } from './constants'
import { logSkippedRow } from './logSkipped'
import crypto from 'crypto'
import { createEmbeddingFromText } from './openai/createEbeddingFromText'

type ParseResult = {
  prodotto: ProdottoMongo
}

export async function parseRow(row: RowCSV): Promise<ParseResult | undefined> {
  try {
    const rawSku = row.sku?.trim()
    if (!rawSku) {
      await logSkippedRow({ reason: 'Missing SKU', raw: row, field: 'sku' })
      return undefined
    }
    const sku = normalizeSku(rawSku)

    const name = cleanString(row.name)
    if (!name) {
      await logSkippedRow({ reason: 'Missing name', raw: row, field: 'name' })
      return undefined
    }

    const description = cleanString(row.description, name)

    const unit_price = safeParseFloat(row.unit_price)
    const type = cleanString(row.type, DEFAULT_TYPE) as ProdottoMongo['type']

    if (!unit_price && type !== 'grouped') {
      await logSkippedRow({ reason: 'Invalid unit_price', raw: row, field: 'unit_price' })
      return undefined
    }

    const qty = safeParseInt(row.qty) ?? DEFAULT_QTY

    const tier_qty_1 = safeParseInt(row.tier_qty_1)
    const tier_price_1 = safeParseFloat(row.tier_price_1)
    const tier_price = tier_qty_1 && tier_price_1
      ? { qty: tier_qty_1, price: tier_price_1 }
      : undefined

    let category_name = cleanString(row.category_name)
    if (!category_name) {
      category_name = 'Senza categoria'
      await logSkippedRow({
        reason: 'Missing category_name (fallback used)',
        raw: row,
        field: 'category_name'
      })
    }
    

    const media_gallery = buildMediaGallery(
      row.media_gallery,
      row.image,
      row.small_image,
      row.thumbnail
    )

    const prodotto: ProdottoMongo = {
      sku,
      name,
      name_eng: cleanString(row.name_eng),
      description,
      unit_price,
      tier_price_1: tier_price,
      msrp: safeParseFloat(row.msrp),
      qty_increments: safeParseInt(row.qty_increments),
      category_name,
      url_key: cleanString(row.url_key),
      link: cleanString(row.link),
      type: cleanString(row.type, DEFAULT_TYPE) as ProdottoMongo['type'],
      parent_sku: cleanString(row.parent_sku),
      simples_skus: [],
      grouped_skus: [],
      cs_skus: [],
      us_skus: [],
      image: isValidImageUrl(row.image) ? row.image : undefined,
      small_image: isValidImageUrl(row.small_image) ? row.small_image : undefined,
      thumbnail: isValidImageUrl(row.thumbnail) ? row.thumbnail : undefined,
      media_gallery,
      visibility: cleanString(row.visibility),
      attribute_set: cleanString(row.attribute_set, DEFAULT_ATTRIBUTE_SET),
      taglia: cleanString(row.taglia),
      colore: cleanString(row.colore),
      configurable_attributes: splitAndCleanArray(row.configurable_attributes),
      weight: safeParseFloat(row.weight),
      qty,
      source: FORNITORE,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const content = [
      prodotto.name,
      prodotto.description,
      `Categoria: ${prodotto.category_name}`,
      prodotto.colore && `Colore: ${prodotto.colore}`,
      prodotto.taglia && `Taglia: ${prodotto.taglia}`,
    ]
      .filter(Boolean)
      .join('\n')
    
    prodotto.content_hash = crypto.createHash('sha256').update(content).digest('hex')
    prodotto.embedding = await createEmbeddingFromText(content)
    
    return { prodotto }
    
  } catch (err: unknown) {
    console.error('ParseRow Error:', err)
    await logSkippedRow({
      reason: 'Unexpected parse error',
      raw: row,
      error: err instanceof Error ? err.message : JSON.stringify(err),
    })
    return undefined
  }
}
---
### ./lib/api/silan/validators.ts

/**
 * Parse sicuro di un float, restituisce undefined se invalido o <= 0 (es. prezzo)
 */
export function safeParseFloat(value?: string | null): number | undefined {
    if (!value) return undefined
    const parsed = parseFloat(value)
    return isNaN(parsed) || parsed <= 0 ? undefined : parsed
  }
  
  /**
   * Parse sicuro di un intero, restituisce undefined se invalido o < 0
   */
  export function safeParseInt(value?: string | null): number | undefined {
    if (!value) return undefined
    const parsed = parseInt(value)
    return isNaN(parsed) || parsed < 0 ? undefined : parsed
  }
  
  /**
   * Restituisce un array pulito da stringa CSV-like (es. "blu, rosso, verde")
   */
  export function splitAndCleanArray(value?: string, separator = ','): string[] {
    return value
      ? value.split(separator).map((v) => v.trim()).filter(Boolean)
      : []
  }
  
  /**
   * Valida se un'immagine è una URL assoluta http/https
   */
  export function isValidImageUrl(url?: string): url is string {
    return typeof url === 'string' && url.startsWith('http')
  }  
  
  /**
   * Fallback intelligente per immagini multiple
   */
  export function buildMediaGallery(...images: (string | undefined)[]): string[] {
    const cleaned = images
      .filter(isValidImageUrl)
      .map((v) => v.trim())
    return [...new Set(cleaned)].slice(0, 10)
  }
  
  /**
   * Stringa pulita, default fallback
   */
  export function cleanString(value?: string, fallback = ''): string {
    return value?.trim().replace(/\s+/g, ' ') || fallback
  }
  
---
### ./lib/api/silan/mongo/upsert.ts

import type { ProdottoMongo } from '../types'
import { getMongoClient } from '@/lib/mongo/client'
import {
  MONGO_DB_NAME,
  MONGO_COLLECTION_PRODOTTI,
  LOG_TYPE_MONGO_ERROR,
} from '../constants'
import { logError } from '../log'

type UpsertResult = 'inserted' | 'updated' | 'skipped'

export async function upsertProdottoMongo(params: {
  prodotto: ProdottoMongo
}): Promise<UpsertResult> {
  const { prodotto } = params

  try {
    const client = await getMongoClient()
    const db = client.db(MONGO_DB_NAME)
    const col = db.collection<ProdottoMongo>(MONGO_COLLECTION_PRODOTTI)

    const existing = await col.findOne<{ content_hash?: string }>({ sku: prodotto.sku })

    if (existing && existing.content_hash === prodotto.content_hash) {
      return 'skipped'
    }

    const now = new Date()
    const { created_at, ...prodottoSenzaCreatedAt } = prodotto

    const result = await col.updateOne(
      { sku: prodotto.sku },
      {
        $set: {
          ...prodottoSenzaCreatedAt,
          updated_at: now,
        },
        $setOnInsert: {
          created_at,
        },
      },
      { upsert: true }
    )

    if (result.upsertedCount > 0) return 'inserted'
    if (result.modifiedCount > 0) return 'updated'
    return 'skipped'
  } catch (err) {
    await logError({
      type: LOG_TYPE_MONGO_ERROR,
      sku: prodotto.sku,
      message: 'MongoDB upsert failed',
      extra: {
        message: err instanceof Error ? err.message : JSON.stringify(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
    })
    throw err
  }
}

---
### ./lib/api/silan/mongo/updateQty.ts

import { getMongoClient } from '@/lib/mongo/client'
import { normalizeSku } from '../normalizeSku'
import { logError } from '../log'
import { logSkippedRow } from '../logSkipped'
import {
  MONGO_DB_NAME,
  MONGO_COLLECTION_PRODOTTI,
  LOG_TYPE_MONGO_ERROR,
} from '../constants'
import type { QtyUpdateRow } from '../types'

export async function updateQtyInMongo(rows: QtyUpdateRow[]): Promise<void> {
  const client = await getMongoClient()
  const db = client.db(MONGO_DB_NAME)
  const col = db.collection(MONGO_COLLECTION_PRODOTTI)

  for (const row of rows) {
    try {
      const normalized = normalizeSku(row.sku)

      if (!normalized) {
        await logSkippedRow({
          reason: 'SKU vuoto dopo normalizzazione',
          raw: row.raw ?? { sku: row.sku, name: '' },
        })
        continue
      }

      const result = await col.updateOne(
        { sku: normalized }, // ✅ usa 'sku'
        {
          $set: {
            qty: row.qty,
            updated_at: new Date(),
          },
        }
      )      

      if (result.matchedCount === 0) {
        await logSkippedRow({
          reason: 'SKU non trovato in MongoDB',
          raw: row.raw ?? { sku: row.sku, name: '' },
        })
      }
    } catch (err) {
      await logError({
        type: LOG_TYPE_MONGO_ERROR,
        sku: row.sku,
        message: 'MongoDB qty update failed',
        extra: {
          message: err instanceof Error ? err.message : JSON.stringify(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
      })
    }
  }
}

---
### ./lib/api/silan/log.ts

import { createAdminClient } from '@/lib/supabase/admin'

type LogParams = {
  type: string
  sku?: string
  message: string
  extra?: Record<string, unknown>
}

// Log generico (inserisce nella tabella 'log' e stampa su console)
export async function logInfo(params: LogParams) {
  const supabase = createAdminClient()

  await supabase.from('log').insert({
    fornitore: 'Silan',
    type: params.type,
    sku: params.sku || null,
    message: params.message,
    extra: params.extra || {},
  })

  console.log(`[INFO] ${params.type} - ${params.sku || 'N/A'} - ${params.message}`)
}

// Log errore (riutilizza logInfo e scrive anche su console)
export async function logError(params: LogParams) {
  await logInfo(params)
  console.error(`[ERROR] ${params.type} - ${params.sku || 'N/A'} - ${params.message}`)
}

---
### ./lib/api/silan/normalizeSku.ts

export function normalizeSku(s: string): string {
  // 1. Flagga se ci sono spazi interni nell'originale (es: "AB 123")
  const hasInternalSpaces = /\s/.test(s.trim().replace(/^\S+|\S+$/g, ''))

  // 2. Rimuovi accenti e simboli non consentiti, mantieni solo A-Z, 0-9, - e _
  const cleaned = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuovi segni diacritici
    .replace(/[^\w\-]/g, '')         // mantieni solo A-Z, 0-9, _ e -
    .toUpperCase()
    .trim()

  return hasInternalSpaces ? `${cleaned}*` : cleaned
}

---
### ./lib/api/silan/openai/createEbeddingFromText.ts

import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function createEmbeddingFromText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  if (!response.data[0]?.embedding) {
    throw new Error('Embedding response malformed or empty')
  }  

  return response.data[0].embedding
}

---
### ./lib/mongo/client.ts

import { MongoClient, Db, Collection, Document } from 'mongodb'

let client: MongoClient | null = null

const MONGO_URI = process.env.MONGO_URI as string
const MONGO_DB_NAME = process.env.MONGO_DB_NAME as string

if (!MONGO_URI) throw new Error('MONGO_URI is not defined')
if (!MONGO_DB_NAME) throw new Error('MONGO_DB_NAME is not defined')

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
  }
  return client
}

export async function getMongoDb(dbName = MONGO_DB_NAME): Promise<Db> {
  const mongoClient = await getMongoClient()
  return mongoClient.db(dbName)
}

export async function getMongoCollection<T extends Document = Document>(
  name: string,
  dbName?: string
): Promise<Collection<T>> {
  const db = await getMongoDb(dbName)
  return db.collection<T>(name)
}

---
### ./lib/data/countries.ts

export const availableCountries: string[] = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua e Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaigian", "Bahamas",
  "Bahrein", "Bangladesh", "Barbados", "Bielorussia", "Belgio", "Belize", "Benin",
  "Bhutan", "Bolivia", "Bosnia ed Erzegovina", "Botswana", "Brasile", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Capo Verde", "Cambogia", "Camerun",
  "Canada", "Repubblica Centrafricana", "Ciad", "Cile", "Cina", "Colombia",
  "Comore", "Congo (Repubblica del Congo)", "Costa Rica", "Croazia", "Cuba", "Cipro",
  "Repubblica Ceca", "Repubblica Democratica del Congo", "Danimarca", "Gibuti",
  "Dominica", "Repubblica Dominicana", "Ecuador", "Egitto", "El Salvador",
  "Guinea Equatoriale", "Eritrea", "Estonia", "Eswatini", "Etiopia", "Figi",
  "Finlandia", "Francia", "Gabon", "Gambia", "Georgia", "Germania", "Ghana", "Grecia",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Ungheria", "Islanda", "India", "Indonesia", "Iran", "Iraq",
  "Irlanda", "Israele", "Italia", "Costa d’Avorio", "Giamaica", "Giappone", "Giordania",
  "Kazakistan", "Kenya", "Kiribati", "Kuwait", "Kirghizistan", "Laos", "Lettonia",
  "Libano", "Lesotho", "Liberia", "Libia", "Liechtenstein", "Lituania",
  "Lussemburgo", "Madagascar", "Malawi", "Malesia", "Maldive", "Mali", "Malta",
  "Isole Marshall", "Mauritania", "Mauritius", "Messico", "Micronesia",
  "Moldavia", "Monaco", "Mongolia", "Montenegro", "Marocco", "Mozambico",
  "Myanmar (Birmania)", "Namibia", "Nauru", "Nepal", "Paesi Bassi", "Nuova Zelanda",
  "Nicaragua", "Niger", "Nigeria", "Corea del Nord", "Macedonia del Nord", "Norvegia",
  "Oman", "Pakistan", "Palau", "Palestina", "Panama", "Papua Nuova Guinea",
  "Paraguay", "Perù", "Filippine", "Polonia", "Portogallo", "Qatar", "Romania",
  "Russia", "Ruanda", "Saint Kitts e Nevis", "Saint Lucia",
  "Saint Vincent e Grenadine", "Samoa", "San Marino", "Sao Tomé e Príncipe",
  "Arabia Saudita", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovacchia", "Slovenia", "Isole Salomone", "Somalia", "Sudafrica",
  "Corea del Sud", "Sudan del Sud", "Spagna", "Sri Lanka", "Sudan", "Suriname",
  "Svezia", "Svizzera", "Siria", "Taiwan", "Tagikistan", "Tanzania", "Thailandia",
  "Timor Est", "Togo", "Tonga", "Trinidad e Tobago", "Tunisia", "Turchia",
  "Turkmenistan", "Tuvalu", "Uganda", "Ucraina", "Emirati Arabi Uniti",
  "Regno Unito", "Stati Uniti", "Uruguay", "Uzbekistan", "Vanuatu",
  "Città del Vaticano", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
]

---
### ./next.config.ts

import 'dotenv/config' // <-- importa .env.local esplicitamente
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.silanpromozioni.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn1.midocean.com',
        pathname: '/**'
      }
    ]
  },
  env: {
    NEXT_PUBLIC_ENV: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_ENV || 'Loc',
    NEXT_PUBLIC_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_GIT_COMMIT_REF || 'local',
    NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || 'local',
  },
}

export default nextConfig


