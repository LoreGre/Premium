import type { ChatMessage, ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

export function detectContextShift(history: ChatMessage[], currentEntities: ExtractedEntity[]): boolean {
  const currentTerms = new Set(
    currentEntities.filter(e => e.type === 'terms').flatMap(e => e.value as string[])
  )

  const userMessages = history.filter(m => m.role === 'user')
  const lastUserMsg = userMessages[userMessages.length - 1] ?? null

  const pastTerms = new Set(
    (lastUserMsg?.entities ?? [])
      .filter(e => e.type === 'terms')
      .flatMap(e => e.value as string[])
  )

  const overlap = [...currentTerms].filter(term => pastTerms.has(term))

  logger.info('[ContextShift] currentTerms:', [...currentTerms])
  logger.info('[ContextShift] pastTerms:', [...pastTerms])
  logger.info('[ContextShift] overlap:', overlap)

  return (
    overlap.length === 0 &&
    currentTerms.size > 0 &&
    pastTerms.size > 0
  )
}
