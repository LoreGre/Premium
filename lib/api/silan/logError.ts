import { FORNITORE } from './constants'

interface LogErrorParams {
  type: string
  sku?: string
  message: string
  extra?: Record<string, unknown>
}

export async function logError(params: LogErrorParams) {
  const log = {
    fornitore: FORNITORE,
    type: params.type,
    sku: params.sku || 'N/A',
    message: params.message,
    extra: params.extra,
    timestamp: new Date().toISOString(),
  }

  console.error(`[ERROR] ${log.type} - ${log.sku} - ${log.message}`)
}
