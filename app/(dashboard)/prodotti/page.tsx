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
  source: string
  category_name?: string
  thumbnail: string
  colore?: string
}

const columnTypes: Record<keyof ProductItem, ColumnDefinition> = {
  sku:           { type: 'string' },
  name:          { type: 'string', label: 'Nome' },
  unit_price:    { type: 'number', label: 'Prezzo' },
  qty:           { type: 'number', label: 'Qta' },
  source:        { type: 'string', label: 'Fornitore' },
  category_name: { type: 'string', label: 'Categoria', flags: ['filter'] },
  thumbnail:     { type: 'image', label: 'Immagine' },
  colore:        { type: 'string', label: 'Colore', flags: ['filter'] },
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
    { name: 'source', label: 'Fornitore', type: 'text' },
    { name: 'category_name', label: 'Categoria', type: 'list' },
    { name: 'colore', label: 'Colore', type: 'list' },
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
