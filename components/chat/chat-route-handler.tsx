'use server'

import { ObjectId } from 'mongodb'
import { getSessionHistoryMongo } from './chat-sessions'
import { generateChatResponse } from './chat-response'
import { fallbackNoEntities, fallbackNoProducts, fallbackContextShift, fallbackNoIntent } from './chat-fallback'
import { shouldUseOnlySkuSearch, getSkuValues, findProductsBySku } from './chat-search-sku'
import { searchHybridMongo } from './chat-search-mongo'
import type { ChatMessage, ExtractedEntity, ProductItem, FallbackSource, ChatAIResponse } from './types'
import { logger } from '@/lib/logger'


function getMergedContext(
  history: ChatMessage[],
  currentEntities: ExtractedEntity[],
  currentProducts: ProductItem[]
): {
  mergedEntities: ExtractedEntity[]
  mergedProducts: ProductItem[]
  mergedMessages: ChatMessage[]
} {
  // 1. Entità unificate (senza duplicati logici)
  const mergedEntities = [...new Map(
    [...(history.flatMap(m => m.entities || [])), ...currentEntities]
      .map(e => [`${e.type}:${String(e.value).toLowerCase()}`, e])
  ).values()]

  // 2. Prodotti raccomandati nei messaggi precedenti (solo assistant)
  const pastRecommended = history
    .filter(m => m.role === 'assistant')
    .flatMap(m => m.products?.filter(p => p.isRecommended) || [])

  // 3. Deduplica: prodotti nuovi + suggeriti in precedenza
  const mergedProducts = [...new Map(
    [...pastRecommended, ...currentProducts].map(p => [p.sku, p])
  ).values()]

  // 4. Messaggi ordinati dal più vecchio al più recente
  const mergedMessages = [...history]

  return {
    mergedEntities,
    mergedProducts,
    mergedMessages
  }
}

export async function handleChatProductSearch(params: {
  message: string
  sessionId: string
  sessionObjectId: ObjectId
  userId: string
  entities: ExtractedEntity[]
  embedding: number[]
}): Promise<{
  aiResponse: ChatAIResponse
  products: ProductItem[]
  mergedEntities: ExtractedEntity[]
  responseSource: FallbackSource | 'standard-response'
}> {
  const { message, sessionId, entities, embedding } = params
  const history = await getSessionHistoryMongo(sessionId, 5)

  // 🔀 Merge sempre subito
  const { mergedEntities } = getMergedContext(history, entities, [])

  // 🆕 SKU search deve usare mergedEntities
  if (shouldUseOnlySkuSearch(mergedEntities)) {
    logger.debug('[ChatHandler] SKU-only request – dopo il merge')

    const skus = getSkuValues(mergedEntities)
    const products = await findProductsBySku(skus)

    if (products.length === 0) {
      logger.warn('[ChatHandler] Nessun prodotto trovato – fallback noProducts (SKU only)')
      const aiResponse = await fallbackNoProducts({ message, embedding, history, entities: mergedEntities })
      return {
        aiResponse,
        products: [],
        mergedEntities,
        responseSource: 'fallback-no-products'
      }
    }

    const merged = getMergedContext(history, entities, products)

    const aiResponse = await generateChatResponse({
      message,
      entities: merged.mergedEntities,
      products: merged.mergedProducts,
      messages: merged.mergedMessages
    })

    return {
      aiResponse,
      products,
      mergedEntities: merged.mergedEntities,
      responseSource: 'standard-response'
    }
  }

  // ⛔️ NO ENTITIES
  if (
    mergedEntities.length === 0 ||
    !mergedEntities.some(e => e.type === 'terms')
  ) {
    logger.warn('[ChatHandler] Nessuna entità o nessun terms – fallback noEntities')
    const aiResponse = await fallbackNoEntities({ message, embedding, history })
    return {
      aiResponse,
      products: [],
      mergedEntities: [],
      responseSource: 'fallback-no-entities'
    }
  }

  // 🔍 RICERCA IBRIDA
  const queryFromTerms = mergedEntities
    .filter(e => e.type === 'terms')
    .flatMap(e => e.value)

  const queryFromAttributes = mergedEntities
    .filter(e => e.type === 'attributes')
    .flatMap(e => e.value)

  const searchQuery = [...queryFromTerms, ...queryFromAttributes].join(' ').trim() || 'prodotto'
  const products = await searchHybridMongo(embedding, searchQuery, mergedEntities, 5, 1, 1)

  if (products.length === 0) {
    logger.warn('[ChatHandler] Nessun prodotto trovato – fallback noProducts')
    const aiResponse = await fallbackNoProducts({ message, embedding, history, entities: mergedEntities })
    return {
      aiResponse,
      products: [],
      mergedEntities,
      responseSource: 'fallback-no-products'
    }
  }

  const merged = getMergedContext(history, entities, products)

  let aiResponse = await generateChatResponse({
    message,
    entities: merged.mergedEntities,
    products: merged.mergedProducts,
    messages: merged.mergedMessages
  })

  let responseSource: FallbackSource | 'standard-response' = 'standard-response'

  if (!aiResponse.intent || aiResponse.intent === 'other') {
    logger.warn('[ChatHandler] Intento non rilevato – fallback noIntent')
    aiResponse = await fallbackNoIntent({
      message,
      embedding,
      history,
      entities: merged.mergedEntities
    })
    responseSource = 'fallback-no-intent'
  }

  return {
    aiResponse,
    products,
    mergedEntities: merged.mergedEntities,
    responseSource
  }
}
