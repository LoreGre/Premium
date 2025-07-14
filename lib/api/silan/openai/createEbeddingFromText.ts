import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function createEmbeddingFromText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  if (!response.data[0]?.embedding) {
    throw new Error('Embedding response malformed or empty')
  }  

  return response.data[0].embedding
}
