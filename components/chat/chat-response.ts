'use server'

import { OpenAI } from 'openai'
import type { ProductItem, ChatAIResponse, ChatMessage, ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

export async function generateChatResponse({
  message,
  products,
  contextMessages,
  entities
}: {
  message: string
  products: ProductItem[]
  contextMessages?: ChatMessage[]
  entities?: ExtractedEntity[]
}): Promise<ChatAIResponse> {

  const entityBlock = Array.isArray(entities) && entities.length
    ? '🔸 ENTITIES:\n' + entities.map(e =>
        Array.isArray(e.value)
          ? `- ${e.type}: ${e.value.join(', ')}`
          : `- ${e.type}: ${e.value}`
      ).join('\n')
    : ''

  const userTurns = contextMessages?.filter(m => m.role === 'user')
    .map(m => `🧑‍💬 ${m.content}`) ?? []

  const recs = contextMessages?.filter(m => m.role === 'assistant' && m.recommended?.length)
    .flatMap(m => m.recommended!.map(r => `🤖 suggerito: ${r.sku} → ${r.reason}`)) ?? []

  const historyBlock = [...userTurns, ...recs].length
    ? '🔸 CONVERSATION_HISTORY:\n' + [...userTurns, ...recs].join('\n')
    : ''

  const productBlock = products.length
    ? products.map(p =>
        `- ${p.name} (${p.unit_price.toFixed(2)}€), SKU: ${p.sku}, Categoria: ${
          Array.isArray(p.category_name)
            ? p.category_name.join(' / ')
            : p.category_name || 'N/A'
        }, Disponibilità: ${(p.qty ?? 0) > 0 ? 'Disponibile' : 'Esaurito'}`
      ).join('\n')
    : 'Nessun prodotto disponibile.'

  const prompt = `
🔸 USER_GOAL:
${message}

${entityBlock}

${historyBlock}

🔸 PRODUCT_CONTEXT:
${productBlock}

🔸 CONSTRAINTS:
- Usa un tono cordiale e diretto rivolto all'utente (dare del TU)
- La summary deve parlare direttamente all'utente, **non usare mai "L'utente ha chiesto..."**
- Suggerisci massimo 4 prodotti (solo se presenti e disponibili)
- Se non ci sono prodotti disponibili, informa l’utente e suggerisci alternative pertinenti
- Se è un confronto tra prodotti, segnala chiaramente quali SKU sono trovati e quali no
- Motiva ogni prodotto suggerito (campo "reason")
- Classifica l'intento tra: info, purchase, compare, clarify, other

🔸 FORMAT_OUTPUT:
{
  "summary": "...",
  "recommended": [
    { "sku": "...", "reason": "..." }
  ],
  "intent": "...",
  "entities": [
    { "type": "...", "value": "..." }
  ]
}

Rispondi solo con JSON valido. Nessun testo extra.
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente esperto di prodotti promozionali. Rispondi solo in JSON valido.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) throw new Error('Risposta AI vuota')

  try {
    const parsed = JSON.parse(rawContent)

    if (!products.length && parsed.recommended?.length) {
      logger.warn('⚠️ AI ha restituito raccomandazioni senza prodotti', {
        recommended: parsed.recommended
      })
    }

    logger.info('Risposta AI generata', {
      summary: parsed.summary,
      intent: parsed.intent,
      nRecommended: parsed.recommended.length
    })

    return parsed
  } catch (err) {
    logger.error('Parsing JSON risposta AI fallito', { rawContent, error: err })
    throw new Error('Risposta AI non in JSON')
  }
}
