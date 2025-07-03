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
import { cn } from '@/lib/utils/common'

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

          <div className="max-h-[200px] overflow-y-auto space-y-1">
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
