// extract-entities-llm.ts
import { OpenAI } from 'openai'
import type { ExtractedEntity } from './types'

const openai = new OpenAI()

export async function extractEntitiesLLM(text: string): Promise<ExtractedEntity[]> {
  const prompt = `
Estrai tutte le entità strutturate dalla seguente frase utente.
Le entità possibili sono:
- sku (codice prodotto, es. "5071", "5071_S30")
- quantity (quantità richiesta o minima, es. "10", "almeno 100", "200")
- color (nome colore, es. "blu", "rosso", "giallo")
- size (taglia, es. "L", "M", "XL", "S")
- category (categoria prodotto, es. "maglietta", "penna")
- supplier (fornitore, se indicato)
- other (qualsiasi altro campo rilevante)

Restituisci SOLO in JSON valido, come array di oggetti ExtractedEntity[].

Frase utente:
"""
${text}
"""
  `.trim()

  const res = await openai.chat.completions.create({
    model: 'gpt-4o', // puoi usare anche gpt-3.5-turbo per risparmiare
    messages: [
      { role: 'system', content: 'Sei un estrattore di entità strutturate. Rispondi solo in JSON valido.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: 'json_object' }, // forza il JSON
    max_tokens: 400
  })

  const content = res.choices?.[0]?.message?.content
  if (!content) throw new Error('Risposta LLM vuota')

  let parsed: ExtractedEntity[]
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Risposta LLM non in JSON')
  }
  return parsed
}
