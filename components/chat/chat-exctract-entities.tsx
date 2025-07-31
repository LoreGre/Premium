'use server'

import { OpenAI } from 'openai'
import type { ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

export async function extractEntitiesLLM(text: string): Promise<ExtractedEntity[]> {
  const prompt = `
  Estrai entità strutturate dalla frase utente seguente, interpretando correttamente anche forme al plurale, femminili, abbreviate o colloquiali (es. "rosse", "10 pezzi", "XL", "midocean", "bluette").
  Considera che di solito nel catalogo category è molto poco flessibile.
  Invece name e description possono accettare stringhe lunghe molto ricercabili.

  TIPI DI ENTITÀ:
  - sku: codice prodotto (es. "5071", "MO8422", "AR1010")
  - quantity: quantità richiesta o minima (es. "10", "almeno 100", "200", "10 pezzi", "una cinquantina")
  - color: nome del colore (es. "rosso", "blu", "giallo", "rosse", "rosa acceso")
  - size: taglia (es. "S", "M", "L", "XL", "extra large")

  - category: categoria standard e formale del prodotto, corrispondente alle classificazioni usate nel catalogo (es. "maglietta", "penna", "zaino", "tazze", "borracce").
    Questa entità è solitamente rigida e meno soggetta a variazioni.

  - name: nome commerciale, marchio o denominazione specifica del prodotto. Può includere descrizioni sintetiche o termini più liberi usati per identificare un prodotto (es. "borraccia termica", "zaino trekking", "penne stilografiche").

  - description: parole chiave o frasi brevi che descrivono caratteristiche, qualità o funzionalità del prodotto. Viene estratta da descrizioni più lunghe e può includere aggettivi o attributi rilevanti (es. "resistente", "con filtro integrato", "leggero").

  - supplier: nome del fornitore o marchio (es. "MidOcean", "GiftLine", "HiGift")

  - other: qualsiasi altra informazione strutturata utile che non rientra nelle categorie sopra.

  
  FORMAT OUTPUT:
  Restituisci solo un oggetto JSON valido con questo formato:
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
      { "type": "name", "value": "penne" },
      { "type": "description", "value": "penne" },
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

  Input: "Cerco una borraccia termica resistente"
  Output:
  {
    "entities": [
      { "type": "category", "value": "borracce" },
      { "type": "name", "value": "borraccia termica" },
      { "type": "description", "value": "resistente" }
    ]
  }

Frase input utente:
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
    max_tokens: 800
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
