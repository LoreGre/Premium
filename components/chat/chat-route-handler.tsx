'use server'
import { ObjectId } from 'mongodb'
import { buildEmbeddingText } from './chat-build-embedding'
import { getEmbedding } from './chat-get-embedding'
import { getSessionHistoryMongo } from './chat-sessions'
import { generateChatResponse } from './chat-response'
import { fallbackNoEntities, fallbackNoProducts, fallbackContextShift, fallbackNoIntent } from './chat-fallback'
import { detectContextShift } from './chat-detect-context'
import { shouldUseOnlySkuSearch, getSkuValues, findProductsBySku } from './chat-search-sku'
import { searchHybridMongo, filterProductsByEntities } from './chat-search-mongo'
import type {
  ChatAIResponse,
  ExtractedEntity,
  ProductItem,
  FallbackSource
} from './types'
import { logger } from '@/lib/logger'

export async function handleChatProductSearch(params: {
  message: string
  sessionId: string
  sessionObjectId: ObjectId
  userId: string
  entities: ExtractedEntity[]
}): Promise<{
  aiResponse: ChatAIResponse
  products: ProductItem[]
  mergedEntities: ExtractedEntity[]
  responseSource: FallbackSource | 'standard-response'
}> {
  const { message, sessionId, entities } = params

  // Step 1 – Recupera cronologia conversazione
  const history = await getSessionHistoryMongo(sessionId, 10)

  // Step 2 – Ramo solo SKU
  if (shouldUseOnlySkuSearch(entities)) {
    const skus = getSkuValues(entities)
    const products = await findProductsBySku(skus)

    const aiResponse = await generateChatResponse({
      message,
      products,
      contextMessages: history,
      entities
    })

    return {
      aiResponse,
      products,
      mergedEntities: entities,
      responseSource: 'standard-response'
    }
  }

  // Step 3 – Embedding + Hybrid search
  const embeddingText = buildEmbeddingText(message, entities)
  const embedding = await getEmbedding(embeddingText)

  const contextShift = detectContextShift(history, entities)
  const mergedEntities = [...new Map(
    [...history.flatMap(m => m.entities || []), ...entities]
      .map(e => [`${e.type}:${String(e.value).toLowerCase()}`, e])
  ).values()]

  if (contextShift) {
    logger.warn('[ChatHandler] Context shift rilevato')
    const aiResponse = await fallbackContextShift({ message, embedding, history, entities: mergedEntities })
    return {
      aiResponse,
      products: [],
      mergedEntities,
      responseSource: 'fallback-context-shift'
    }
  }

  if (mergedEntities.length === 0) {
    logger.warn('[ChatHandler] Nessuna entità – fallback noEntities')
    const aiResponse = await fallbackNoEntities({ message, embedding, history })
    return {
      aiResponse,
      products: [],
      mergedEntities: [],
      responseSource: 'fallback-no-entities'
    }
  }

  const queryText = mergedEntities
    .filter(e => ['terms', 'attributes', 'color', 'supplier'].includes(e.type))
    .flatMap(e => Array.isArray(e.value) ? e.value : [e.value])
    .join(' ')

  const rawProducts = await searchHybridMongo(embedding, queryText, 10, 1, 1)
  const products = filterProductsByEntities(rawProducts, mergedEntities)

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

  // Step 4 – Risposta AI
  let aiResponse = await generateChatResponse({
    message,
    products,
    contextMessages: history,
    entities: mergedEntities
  })

  let responseSource: FallbackSource | 'standard-response' = 'standard-response'

  if (!aiResponse.intent || aiResponse.intent === 'other') {
    logger.warn('[ChatHandler] Intento non rilevato – fallback noIntent')
    aiResponse = await fallbackNoIntent({
      message,
      embedding,
      history,
      entities: mergedEntities
    })
    responseSource = 'fallback-no-intent'
  }

  return {
    aiResponse,
    products,
    mergedEntities,
    responseSource
  }
}
