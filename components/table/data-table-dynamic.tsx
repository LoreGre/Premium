'use client'

/* ------------------------------------------------------------------
 * DataTableDynamic v1.3.2  –  type-safe                       (TSX)
 * ------------------------------------------------------------------
 * - Nessuna modifica visuale / logica rispetto alla tua versione
 * - Tipizzazione generica <T extends Record<string, unknown>>
 * - onDelete tipizzata con T[]
 * - Accesso item[key] senza any
 * ------------------------------------------------------------------ */

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


/* ------------------------------------------------------------------ */
/* Tipi generici                                                      */
/* ------------------------------------------------------------------ */
export type GenericObject = Record<string, unknown>

export type ColumnType =
  | { type: 'string' }
  | { type: 'email' }
  | { type: 'phone' }
  | { type: 'list'; flags?: string[] }

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

/* ------------------------------------------------------------------ */
/* Componente                                                         */
/* ------------------------------------------------------------------ */
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
  /* ---------- state ---------- */
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


  /* ---------- debounce search ---------- */
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setGlobalFilter(value), 250)
  }

  /* ---------- filtering ---------- */
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

  /* ---------- columns ---------- */
  const columns = React.useMemo<ColumnDef<T>[]>(() => {
    if (data.length === 0) return []

    const dynamic = Object.entries(columnTypes).map(([key, cfg]) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
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

  /* ---------- table ---------- */
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
      {/* Header: title + filters/buttons */}
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
                            ? `${filterValues[key].length} selected`
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
