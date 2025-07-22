import { MongoClient, Db, Collection, Document } from 'mongodb'

let client: MongoClient | null = null

const MONGO_URI = process.env.MONGO_URI as string
const MONGO_DB_NAME = process.env.MONGO_DB_NAME as string

if (!MONGO_URI) throw new Error('MONGO_URI is not defined')
if (!MONGO_DB_NAME) throw new Error('MONGO_DB_NAME is not defined')

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
  }
  return client
}

export async function getMongoDb(dbName = MONGO_DB_NAME): Promise<Db> {
  const mongoClient = await getMongoClient()
  return mongoClient.db(dbName)
}

export async function getMongoCollection<T extends Document = Document>(
  name: string,
  dbName?: string
): Promise<Collection<T>> {
  const db = await getMongoDb(dbName)
  return db.collection<T>(name)
}
