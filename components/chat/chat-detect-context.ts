import type { ChatMessage, ExtractedEntity } from './types'

export function detectContextShift(history: ChatMessage[], currentEntities: ExtractedEntity[]): boolean {
    const currentTerms = new Set(
      currentEntities.filter(e => e.type === 'terms').flatMap(e => e.value as string[])
    )
  
    const pastTerms = new Set(
      history.flatMap(m =>
        m.role === 'user'
          ? (m.entities ?? [])
              .filter(e => e.type === 'terms')
              .flatMap(e => e.value as string[])
          : []
      )
    )
  
    const overlap = [...currentTerms].filter(term => pastTerms.has(term))
    return overlap.length === 0 && currentTerms.size > 0 && pastTerms.size > 0
  }
  