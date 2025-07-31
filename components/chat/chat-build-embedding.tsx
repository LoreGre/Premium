import type { ExtractedEntity } from './types'

export function buildEmbeddingText(message: string, entities: ExtractedEntity[]): string {
  const entityParts = entities.map(e =>
    Array.isArray(e.value)
      ? `${e.type}: ${e.value.join(', ')}`
      : `${e.type}: ${e.value}`
  )
  return [message, ...entityParts].join(' | ')
}
