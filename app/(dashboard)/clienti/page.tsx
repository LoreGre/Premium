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
