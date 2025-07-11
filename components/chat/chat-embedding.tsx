import { OpenAI } from 'openai'

const openai = new OpenAI()

/**
 * Genera l'embedding vettoriale per una stringa testuale
 * @param text stringa da convertire
 * @returns numero[] (embedding vettoriale)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const input = text.replace(/\n/g, ' ') // OpenAI consiglia di rimuovere newline

  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input
  })

  return res.data[0].embedding
}
