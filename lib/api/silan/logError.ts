import { createAdminClient } from '@/lib/supabase/admin'

export async function logError(params: {
  type: string
  sku?: string
  message: string
  extra?: Record<string, unknown>
}) {
  const supabase = createAdminClient()

  await supabase.from('log_error').insert({
    fornitore: 'Silan',
    type: params.type,
    sku: params.sku || null,
    message: params.message,
    extra: params.extra || {},
  })

  console.error(`[ERROR] ${params.type} - ${params.sku || 'N/A'} - ${params.message}`)
}
