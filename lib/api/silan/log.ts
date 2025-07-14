import { createAdminClient } from '@/lib/supabase/admin'

type LogParams = {
  type: string
  sku?: string
  message: string
  extra?: Record<string, unknown>
}

// Log generico (inserisce nella tabella 'log' e stampa su console)
export async function logInfo(params: LogParams) {
  const supabase = createAdminClient()

  await supabase.from('log').insert({
    fornitore: 'Silan',
    type: params.type,
    sku: params.sku || null,
    message: params.message,
    extra: params.extra || {},
  })

  console.log(`[INFO] ${params.type} - ${params.sku || 'N/A'} - ${params.message}`)
}

// Log errore (riutilizza logInfo e scrive anche su console)
export async function logError(params: LogParams) {
  await logInfo(params)
  console.error(`[ERROR] ${params.type} - ${params.sku || 'N/A'} - ${params.message}`)
}
