import type { ObjectId } from 'mongodb'

// ============================
// TIPO PRODOTTO
// ============================

/**
 * Descrive un prodotto suggerito o ricercato nella chat
 */
export type ProductItem = {
  sku: string                    // Codice univoco del prodotto
  name: string                   // Nome del prodotto
  description: string            // Descrizione testuale
  price: number                  // Prezzo unitario
  available: boolean             // Disponibilità stock (>0)
  qty?: number                   // Quantità disponibile (opzionale)
  supplier: string               // Nome o codice fornitore
  category_name?: string         // Categoria prodotto (opzionale)
  thumbnail: string              // URL thumbnail immagine prodotto
  link?: string                  // Link esterno pagina prodotto (opzionale)
  colore?: string                // Colore (opzionale)
  score?: number                 // Score ranking da search (opzionale, per ranking)
}

// ============================
// OUTPUT AI (JSON RAGIONATO)
// ============================

/**
 * Struttura della risposta AI in formato JSON, ottimizzata per ragionamento e UI
 */
export type ChatAIResponse = {
  summary: string                              // Riepilogo/testo naturale AI (intro risposta)
  recommended: {                               // Prodotti raccomandati (max 3 tipicamente)
    sku: string                                // SKU prodotto raccomandato
    reason: string                             // Motivazione testuale scelta
  }[]
  intent?: string                              // (Futuro) intent classificato AI (es: richiesta, saluto, feedback)
}

// ============================
// FEEDBACK UTENTE
// ============================

/**
 * Feedback strutturato dell’utente su una risposta assistant (per analytics/training)
 */
export type Feedback = {
  rating: 'positive' | 'negative' | 'neutral'  // Valutazione espressa (es. thumbs up/down/neutral)
  comment?: string                             // Testo libero utente (opzionale)
  timestamp: string                            // Quando il feedback è stato lasciato (ISO)
}

// ============================
// MESSAGGIO CHAT
// ============================

/**
 * Messaggio salvato su MongoDB (user o assistant)
 */
export type ChatMessage = {
  _id?: ObjectId                                  // Mongo ObjectId (opzionale su insert/read)
  session_id: string                            // Id sessione chat (collega alla sessione/thread)
  user_id: string                               // User id associato (owner o AI)
  role: 'user' | 'assistant'                    // Ruolo: utente umano o AI
  content: string                               // Testo messaggio (prompt user o summary AI)
  products?: ProductItem[]                      // Prodotti menzionati/suggeriti (opzionale)
  recommended?: { sku: string; reason: string }[] // Raccomandazioni assistant (solo AI)
  intent?: string                               // Intent (classificazione, opzionale)
  embedding?: number[]                          // Embedding vettoriale del messaggio (per vector search)
  feedback?: Feedback                           // Eventuale feedback lasciato dall’utente
  createdAt: string                             // Timestamp ISO (quando salvato)
}

// ============================
// SESSIONE CHAT
// ============================

/**
 * Sessione (thread) chat, una per utente/conversazione
 */
export type ChatSession = {
  _id?: string                                  // Mongo ObjectId sessione (opzionale)
  user_id: string                               // User id proprietario della sessione
  createdAt: string                             // Timestamp ISO creazione sessione
}
