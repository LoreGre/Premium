import { OpenAI } from 'openai'

const openai = new OpenAI()
const EMBEDDING_MODEL = 'text-embedding-3-small'


export async function getEmbedding(text: string): Promise<number[]> {
  // Sanitize: newline, lower, trim, collapse spaces
  const input = text.replace(/\n/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim()

  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input
  })

  const embedding = res.data?.[0]?.embedding

  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Embedding non generato o malformato da OpenAI')
  }

  return embedding
}
