'use server'

import { OpenAI } from 'openai'
import type { ExtractedEntity } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

export async function extractEntitiesLLM(text: string): Promise<ExtractedEntity[]> {
  const prompt = `
Estrai entità strutturate dalla frase utente seguente, interpretando correttamente anche forme al plurale, femminili, abbreviate o colloquiali (es. "rosse", "10 pezzi", "XL", "midocean", "bluette").

L'obiettivo è identificare con precisione i concetti chiave rilevanti per la ricerca nel catalogo prodotti.

📌 NOTA IMPORTANTE:
- L'entità **terms** è una lista di parole o frasi chiave che rappresentano ciò che l'utente vuole trovare (es. "borraccia", "zaino trekking", "penna personalizzata"). Verranno usate come query testuale o semantica nei campi \`name\`, \`description\` e \`category_name\`.
- Non includere aggettivi o caratteristiche tecniche nei \`terms\`. Questi devono essere inseriti nell'entità **attributes** (es. "termica", "colorata", "resistente").

🧠 ENTITÀ SUPPORTATE:
- \`sku\`: codice prodotto (es. "MO8422", "5071", "AR1010")
- \`quantity\`: quantità richiesta o minima (es. "10", "almeno 100", "10 pezzi", "una cinquantina")
- \`color\`: colore rilevante (es. "rosso", "blu", "rosse", "rosa acceso", "bluette")
- \`size\`: taglia (es. "S", "M", "L", "XL", "extra large")
- \`supplier\`: nome del fornitore o marchio (es. "MidOcean", "GiftLine")
- \`terms\`: array di keyword utili per la ricerca testuale e semantica nei campi \`name\`, \`description\`, \`category_name\`
- \`attributes\`: array di attributi, aggettivi o caratteristiche rilevanti non centrali (es. "resistente", "leggero", "con filtro"), da usare in \`description\`
- \`other\`: qualsiasi altra informazione utile strutturata non compresa sopra

📦 ESEMPIO schema database (MongoDB collection "prodotti"):
{
  "_id": {
    "$oid": "6888f71d3a3162e53a9712e8"
  },
  "sku": "AR1249-16",
  "name": "Bussola nautica",
  "description": "Bussola nautica in alluminio in confezione di latta.",
  "supplier": "MidOcean",
  "category_name": [
    "Ufficio & Scrittura",
    "Accessori ufficio",
    "Luci da tavolo"
  ],
  "thumbnail": "https://cdn1.midocean.com/image/700X700/ar1249-16.jpg",
  "link": "",
  "qty": 2858,
  "unit_price": 3.68,
  "content_hash": "bb42544494b0139f922b314597fb7d9184e7e9389f6d3903d045476fdd9dc1e4",
  "embedding": [
    -0.024253117, 0.0013268577, 0.046131495, ...
	....
  ],
  "ToUpdate": 0,
  "color": "Argento",
  "size": ""
}

🧾 FORMAT OUTPUT:
Devi rispondere **solo** con un oggetto JSON valido, come questo:
{
  "entities": [
    { "type": "sku", "value": "MO8422" },
    { "type": "color", "value": "blu" },
    { "type": "terms", "value": ["penna", "blu"] },
    { "type": "attributes", "value": ["resistente", "impermeabile", "termico", "leggero"] },
    { "type": "quantity", "value": 100 }
  ]
}

✅ ESEMPI:

Input: "Vorrei 100 penne blu MO8422"
Output:
{
  "entities": [
    { "type": "quantity", "value": 100 },
    { "type": "color", "value": "blu" },
    { "type": "sku", "value": "MO8422" },
    { "type": "terms", "value": ["penne", "blu"] }
  ]
}

Input: "Cerco una borraccia termica resistente"
Output:
{
  "entities": [
    { "type": "terms", "value": ["borraccia"] },
    { "type": "attributes", "value": ["termica", "resistente"] }
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

🧑‍💼 Frase utente:
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
    logger.error('Parsing fallito in [extractEntitiesLLM]', {
      input: text,
      content,
      error: err
    })
    return []
  }
}
