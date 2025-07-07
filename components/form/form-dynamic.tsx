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
