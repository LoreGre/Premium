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
