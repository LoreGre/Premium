'use client'

import type { FallbackSource } from './types'

export function FallbackNotice({ source }: { source: FallbackSource }) {
  const fallbackMap: Record<
    FallbackSource,
    { icon: string; label: string; action?: () => void; actionLabel?: string }
  > = {
    'fallback-no-entities': {
      icon: '❓',
      label: 'Richiesta poco chiara',
    },
    'fallback-no-products': {
      icon: '📦',
      label: 'Nessun prodotto trovato',
    },
    'fallback-context-shift': {
      icon: '🔄',
      label: 'Cambio argomento rilevato',
      action: () => window.location.reload(),
      actionLabel: 'Ricomincia la chat'
    },
    'fallback-no-intent': {
      icon: '🤔',
      label: 'Intento non chiaro',
    }
  }

  const fallback = fallbackMap[source]
  if (!fallback) return null

  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1 italic">
      <span>{fallback.icon}</span>
      <span>{fallback.label}</span>
      {fallback.action && (
        <button
          onClick={fallback.action}
          className="ml-2 underline text-blue-700 hover:text-blue-900 text-xs"
        >
          {fallback.actionLabel}
        </button>
      )}
    </p>
  )
}
