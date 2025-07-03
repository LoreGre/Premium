'use client'

import { useEffect, useState } from 'react'
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([])
  const [loading,   setLoading]   = useState(true)

  const supplierFormFields: FormField[] = [
    { name: 'denominazione', label: 'Denominazione', type: 'text', required: true },
    { name: 'codice_sdi',    label: 'Codice destinatario SDI', type: 'text' },
    { name: 'referente',     label: 'Referente', type: 'text' },
    { name: 'partita_iva',   label: 'Partita IVA', type: 'text' },
    { name: 'codice_fiscale',label: 'Codice fiscale', type: 'text' },
    { name: 'paese',         label: 'Paese', type: 'select',
      options: availableCountries.map(c => ({ label: c, value: c })) },
    { name: 'indirizzo',     label: 'Indirizzo', type: 'text' },
    { name: 'comune',        label: 'Comune', type: 'text' },
    { name: 'cap',           label: 'CAP', type: 'text' },
    { name: 'provincia',     label: 'Provincia', type: 'text' },
    { name: 'telefono',      label: 'Telefono', type: 'phone' },
    { name: 'email',         label: 'E-mail', type: 'email' },
    { name: 'pec',           label: 'PEC', type: 'email' },
    { name: 'note',          label: 'Note', type: 'textarea' },
    { name: 'categorie',     label: 'Categorie', type: 'multiselect', options: categories, placeholder: 'Seleziona categorie...' },
  ]

  /* ---------- fetch iniziale ---------- */
  useEffect(() => {
    Promise.all([fetchSuppliers(), fetchSupplierCategories()])
      .then(([suppliersData, categoriesData]) => {
        setSuppliers(suppliersData)
        setCategories(categoriesData)
      })
      .catch((e) => {
        console.error('Errore iniziale:', e)
        error('Errore', 'Impossibile caricare fornitori o categorie')
      })
      .finally(() => setLoading(false))
  }, [error])


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
                  error('Errore', 'Impossibile salvare il fornitore')
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

      {/* Drawer form – rimontato grazie alla key */}
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
