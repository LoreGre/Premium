import { MongoClient, Db, Collection, Document } from 'mongodb'

let client: MongoClient | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client

  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not defined in environment variables')

  client = new MongoClient(uri)
  await client.connect()
  return client
}

export async function getMongoDb(dbName?: string): Promise<Db> {
  const mongoClient = await getMongoClient()
  return mongoClient.db(dbName || process.env.MONGO_DB_NAME)
}

export async function getMongoCollection<T extends Document = Document>(
  name: string,
  dbName?: string
): Promise<Collection<T>> {
  const db = await getMongoDb(dbName)
  return db.collection<T>(name)
}
