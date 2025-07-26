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
