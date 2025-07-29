import { OpenAI } from 'openai'
import type { ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

export async function extractEntitiesLLM(text: string): Promise<ExtractedEntity[]> {
  const prompt = `
Estrai entità strutturate dalla frase utente seguente.

TIPI DI ENTITÀ:
- sku: codice prodotto (es. "5071", "MO8422", "AR1010")
- quantity: quantità richiesta o minima (es. "10", "almeno 100", "200")
- color: nome del colore (es. "rosso", "blu", "giallo")
- size: taglia (es. "S", "M", "L", "XL")
- category: categoria prodotto (es. "maglietta", "penna", "zaino")
- supplier: nome del fornitore (es. "MidOcean", "GiftLine")
- other: qualsiasi altra informazione strutturata utile

FORMAT OUTPUT:
Devi restituire solo un oggetto JSON valido nel formato:
{
  "entities": [
    { "type": "sku", "value": "MO8422" },
    { "type": "quantity", "value": "100" }
  ]
}

ESEMPI DI INPUT/OUTPUT:

Input: "Vorrei 100 penne blu MO8422"
Output:
{
  "entities": [
    { "type": "quantity", "value": "100" },
    { "type": "category", "value": "penne" },
    { "type": "color", "value": "blu" },
    { "type": "sku", "value": "MO8422" }
  ]
}

Input: "Avete prodotti di MidOcean taglia L?"
Output:
{
  "entities": [
    { "type": "supplier", "value": "MidOcean" },
    { "type": "size", "value": "L" }
  ]
}

Frase utente:
"""
${text}
"""
  `.trim()

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Sei un estrattore di entità strutturate. Rispondi sempre e solo con JSON valido nel formato richiesto.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    max_tokens: 600
  })

  const content = res.choices?.[0]?.message?.content
  logger.info('[extractEntitiesLLM] Raw response content', { content })

  if (!content) throw new Error('Risposta LLM vuota')

  try {
    const parsed = JSON.parse(content)
    if (!parsed.entities || !Array.isArray(parsed.entities)) throw new Error('Formato entità non valido')
    logger.info('[extractEntitiesLLM] Entità estratte con successo', {
      input: text,
      entities: parsed.entities
    })
    return parsed.entities as ExtractedEntity[]
  } catch (err) {
    logger.error('Parsing fallito in extractEntitiesLLM', {
      input: text,
      content,
      error: err
    })
    return []
  }
}
