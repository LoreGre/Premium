'use server'

import { OpenAI } from 'openai'
import type { ProductItem, ChatAIResponse, ChatMessage, ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

// ===============================
// 5. GENERAZIONE RISPOSTA AI (Prompt dinamico + output JSON)
// ===============================

const openai = new OpenAI()

/**
 * Costruisce prompt, chiama GPT-4o e restituisce output JSON parsed
 * @param message - domanda utente
 * @param products - prodotti da proporre
 * @param history - memoria breve (optional)
 * @returns oggetto ChatAIResponse
 */
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
    ? '🔸 ENTITIES:\n' + entities.map(e => `- ${e.type}: ${e.value}`).join('\n')
    : ''

    const historyBlock = Array.isArray(contextMessages) && contextMessages.length
    ? '🔸 CONVERSATION_HISTORY:\n' +
        contextMessages.map(h => `[${h.role}] ${h.content}`).join('\n')
    : ''

    const productBlock = products.length
    ? products.map(p =>
        `- ${p.name} (${p.unit_price}€), SKU: ${p.sku}, Categoria: ${
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
- Suggerisci massimo 4 prodotti (solo se presenti e disponibili)
- Se non ci sono prodotti disponibili, informa l’utente e suggerisci prodotti alternativi pertinenti
- Se l'utente ha chiesto un confronto tra più prodotti (SKU o descrizioni) e solo alcuni sono disponibili, segnala chiaramente quali SKU sono stati trovati e quali no
- Motiva la scelta per ciascun prodotto suggerito (campo "reason")
- Classifica l'intento tra info, purchase, support, greeting, feedback, compare, other

🔸 FORMAT_OUTPUT:

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
    Rispondi solo con JSON valido senza testo aggiuntivo.

    Esempio di output:

    {
      "summary": "Ti consiglio questi prodotti disponibili per la tua ricerca.",
      "recommended": [
        { "sku": "S17000-BK-M", "reason": "Ottimo rapporto qualità-prezzo e disponibile in magazzino" },
        { "sku": "S00577-BN-L", "reason": "Colore e taglia corrispondono alle tue preferenze" }
      ],
      "intent": "purchase",
      "entities": [
        { "type": "category", "value": "penne" }
      ]
    }
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente esperto di prodotti promozionali. Rispondi solo in JSON valido.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) throw new Error('Risposta AI vuota')

  let parsed: ChatAIResponse
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    logger.error('Parsing JSON risposta AI fallito', { rawContent })
    throw new Error('Risposta AI non in JSON')
  }

  if (!products.length && parsed.recommended?.length) {
    logger.warn('⚠️ AI ha restituito raccomandazioni senza prodotti', { recommended: parsed.recommended })
  }  

  logger.info('Risposta AI generata', {
    summary: parsed.summary,
    intent: parsed.intent,
    nRecommended: parsed.recommended.length
  })

  return parsed
}