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
    sdi_code: z.string().length(7, 'Il codice SDI deve essere di 7 caratteri'),
    provincia: z.string().length(2, 'La provincia deve essere di 2 lettere').regex(/^[A-Za-z]{2}$/, 'Provincia non valida'),
    piva: z.string().regex(/^[0-9]{11}$/, 'Partita IVA non valida'),
    cf: z.string().regex(/^[A-Z0-9]{16}$/i, 'Codice fiscale non valido'),
    cap: z.string().regex(/^[0-9]{5}$/, 'CAP non valido'),
  }

  const shape: Record<string, z.ZodTypeAny> = {}
  fields.forEach((field) => {
    const base = field.validation && VALIDATORS[field.validation]
      ? VALIDATORS[field.validation]
      : field.type === 'multiselect'
        ? z.array(z.string()).min(field.required ? 1 : 0, 'Seleziona almeno una categoria')
        : field.type === 'select'
          ? z.string().min(field.required ? 1 : 0, 'Campo obbligatorio')
          : field.type === 'email'
            ? z.string().email('Email non valida')
            : z.string()
    shape[field.name] = field.required
      ? base
      : z.preprocess(
          val => (val === '' ? undefined : val),
          base.optional()
        )
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
