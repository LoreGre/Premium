import { OpenAI } from 'openai'

const openai = new OpenAI()

/**
 * Genera l'embedding vettoriale per una stringa testuale
 * @param text stringa da convertire
 * @returns numero[] (embedding vettoriale)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const input = text.replace(/\n/g, ' ').trim()

  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input
  })

  const embedding = res.data?.[0]?.embedding

  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Embedding non generato o malformato da OpenAI')
  }

  return embedding
}
