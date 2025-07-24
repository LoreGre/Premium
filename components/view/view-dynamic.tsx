'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'

export type ViewField = {
  name: string
  label: string
  type?: 'text' | 'image' | 'email' | 'phone' | 'link' | 'list' | 'date'
}

type ViewDynamicProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  fields: ViewField[]
  values: Record<string, any>
}

export function ViewDynamic({ open, onOpenChange, title = 'Dettagli', fields, values }: ViewDynamicProps) {
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

                  {field.type === 'image' ? (
                    <img
                      src={value}
                      alt={field.label}
                      className="rounded shadow h-40 object-contain"
                    />
                  ) : field.type === 'email' ? (
                    <a href={`mailto:${value}`} className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                      {value}
                    </a>
                  ) : field.type === 'phone' ? (
                    <a href={`tel:${value}`} className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                      {value}
                    </a>
                  ) : field.type === 'link' ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                      {value}
                    </a>
                  ) : field.type === 'list' ? (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(value) ? value : String(value).split(',')).map((item: any, i: number) => (
                        <span
                          key={i}
                          className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {item.trim()}
                        </span>
                      ))}
                    </div>                  
                  ) : field.type === 'date' ? (
                    <div className="text-sm">
                      {new Date(value).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap break-words">{String(value)}</div>
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
