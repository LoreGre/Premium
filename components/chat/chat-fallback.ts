// chat-fallback.ts

'use server'

import { OpenAI } from 'openai'
import type { ChatMessage, ExtractedEntity, ChatAIResponse } from './types'
import { logger } from '@/lib/logger'

const openai = new OpenAI()

type FallbackParams = {
  message: string
  embedding?: number[]
  history?: ChatMessage[]
  entities?: ExtractedEntity[]
}

// 🔁 Nessuna entità estratta
export async function fallbackNoEntities(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, history } = params

  const lastTurns = (history ?? [])
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => `- ${m.content}`)
    .join('\n')

  const prompt = `
L'utente ha inviato il seguente messaggio:
"${message}"

Negli ultimi messaggi ha detto:
${lastTurns || '— (nessun messaggio precedente rilevante) —'}

Non sono state rilevate entità strutturate. L'obiettivo è:
- Chiedere chiarimenti utili per identificare ciò che cerca
- Non suggerire prodotti generici a caso
- Restituire una risposta breve e gentile che stimoli l'utente a specificare meglio

Rispondi in questo formato JSON:
{
  "summary": "...",
  "recommended": [],
  "intent": "clarify",
  "entities": []
}`.trim()

  return await getLLMResponse(prompt)
}

// ❌ Entità presenti ma nessun prodotto trovato
export async function fallbackNoProducts(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, entities, history } = params

  const prompt = `
Messaggio utente:
"${message}"

Entità trovate:
${JSON.stringify(entities ?? [])}

Contesto precedente:
${
    (history ?? [])
      .filter(m => m.role === 'user')
      .slice(-1)
      .map(m => `- ${m.content}`)
      .join('\n') || '—'}

Obiettivo:
- Informare l'utente che al momento non ci sono prodotti compatibili
- Eventualmente suggerire di modificare quantità, colori o tipo prodotto
- Restituire una risposta strutturata come JSON:

{
  "summary": "...",
  "recommended": [],
  "intent": "clarify",
  "entities": [...]
}`.trim()

  return await getLLMResponse(prompt)
}

// ❓ Nessun intento rilevabile (caso futuro)
export async function fallbackNoIntent(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, history, entities } = params

  const lastTurns = (history ?? [])
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => `- ${m.content}`)
    .join('\n')

  const prompt = `
Messaggio utente:
"${message}"

Entità trovate:
${JSON.stringify(entities ?? [])}

Conversazione recente:
${lastTurns || '—'}

Obiettivo:
- L'intento dell'utente non è chiaro (es. domanda troppo vaga, ambigua o incompleta)
- Restituire un chiarimento strutturato in JSON:

{
  "summary": "...",
  "recommended": [],
  "intent": "clarify",
  "entities": [...]
}`.trim()

  return await getLLMResponse(prompt)
}

// 🔄 Cambio completo di argomento (contesto incoerente con la sessione)
export async function fallbackContextShift(params: FallbackParams): Promise<ChatAIResponse> {
  const { message, history, entities } = params

  const lastTurns = (history ?? [])
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => `- ${m.content}`)
    .join('\n')

    const prompt = `
    Messaggio utente:
    "${message}"
    
    Messaggi precedenti:
    ${lastTurns || '—'}
    
    Entità rilevate:
    ${JSON.stringify(entities ?? [])}
    
    Il messaggio indica un cambio completo di argomento rispetto alla conversazione precedente.
    
    Obiettivo:
    - Informare l'utente che il nuovo argomento non è compatibile con la sessione corrente
    - Suggerire gentilmente di aprire una nuova chat per mantenere coerenza e risultati rilevanti
    - Rispondere in questo formato:
    
    {
      "summary": "Hai cambiato completamente argomento. Per cercare un nuovo tipo di prodotto, ti consiglio di aprire una nuova chat.",
      "recommended": [],
      "intent": "clarify",
      "entities": [...]
    }`.trim()
    

  return await getLLMResponse(prompt)
}

// 🧠 Core LLM invoker
async function getLLMResponse(prompt: string): Promise<ChatAIResponse> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente AI che restituisce sempre un JSON valido e strutturato per l’interfaccia utente.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 600
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Risposta fallback LLM vuota')

  try {
    return JSON.parse(content)
  } catch (err) {
    logger.error('[fallback] Parsing fallito', { content, error: err })
    throw new Error('Fallback LLM non ha restituito JSON valido')
  }
}
