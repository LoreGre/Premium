import { MongoClient } from 'mongodb'

let client: MongoClient

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client

  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  client = new MongoClient(uri)
  await client.connect()
  return client
}
