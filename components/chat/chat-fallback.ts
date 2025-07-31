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
  const { message } = params

    const prompt = `
    L'utente ha scritto:
    "${message}"
    
    Non sono state rilevate entità strutturate.
    
    📌 Obiettivo:
    - Rispondi direttamente all'utente usando il TU.
    - Invitalo gentilmente a spiegare meglio che tipo di prodotto sta cercando.
    - Guida l'utente con una domanda semplice per aiutarlo a fornire dettagli (es. cosa cerca: prodotto, colore, quantità, taglia...)
    - Non proporre prodotti generici.
    - Tono cordiale e naturale, da assistente conversazionale
    - Usa emoji se serve
    
    Rispondi con JSON:
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
      .join('\n') || '—'
  }

  Non abbiamo trovato prodotti nel DB!
  
  📌 Obiettivo:
  - **Nella summary, parla direttamente all'utente. Non usare mai frasi come "L'utente ha chiesto..."**
  - Informare l'utente che non ci sono prodotti compatibili.
  - Guida l'utente con una domanda semplice per aiutarlo a fornire dettagli (es. cosa cerca: prodotto, colore, quantità, taglia...)
  - Non proporre prodotti generici
  - Usa emoji se serve
  - Tono cordiale e naturale, da assistente conversazionale
  
  Rispondi in formato JSON:
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

    const prompt = `
    Messaggio utente:
    "${message}"
    
    Entità trovate:
    ${JSON.stringify(entities ?? [])}
    
    Conversazione recente:
    ${
      (history ?? [])
        .filter(m => m.role === 'user')
        .slice(-2)
        .map(m => `- ${m.content}`)
        .join('\n') || '—'
    }

    Non abbiamo capito l'intento!
    
    📌 Obiettivo:
    - **Nella summary, parla direttamente all'utente. Non usare mai frasi come "L'utente ha chiesto..."**
    - Guida l’utente con una domanda utile per capire cosa cerca: tipologia di prodotto, colore, quantità o altri dettagli.
    - L'obiettivo è ottenere un messaggio con entità utili per avviare una ricerca prodotti.
    - Non proporre prodotti generici
    - Usa emoji se serve
    - Tono cordiale e naturale, da assistente conversazionale
    
    Rispondi con JSON:
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

    const prompt = `
    Messaggio utente:
    "${message}"
    
    Messaggi precedenti:
    ${
      (history ?? [])
        .filter(m => m.role === 'user')
        .slice(-2)
        .map(m => `- ${m.content}`)
        .join('\n') || '—'
    }
    
    Entità rilevate:
    ${JSON.stringify(entities ?? [])}

    L'utente ha cambiato completamente contesto nella stessa conversazione!
    
    📌 Obiettivo:
    - **Nella summary, parla direttamente all'utente. Non usare mai frasi come "L'utente ha chiesto..."**
    - Invita l’utente ad aprire una nuova chat per una ricerca più precisa.
    - Non proporre prodotti generici
    - Usa emoji se serve
    - Tono cordiale e naturale, da assistente conversazionale
    
    Rispondi in formato JSON:
    {
      "summary": "...",
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
