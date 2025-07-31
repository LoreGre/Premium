import type { ExtractedEntity } from './types'

export function buildEmbeddingText(message: string, entities: ExtractedEntity[]): string {
  const entityParts = entities.map(e => `${e.type}: ${e.value}`)
  return [message, ...entityParts].join(' | ')
}
