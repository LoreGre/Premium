// 🏷️ Identificatore statico del fornitore
export const FORNITORE = 'silan' as const

// 🧱 MongoDB
export const MONGO_DB_NAME = 'Premium'
export const MONGO_COLLECTION_PRODOTTI = 'prodotti' // ✅ collezione unificata
export const MONGO_COLLECTION_EMBEDDING = 'embedding_prodotti'
export const MONGO_COLLECTION_LOG = 'embedding_logs'

// 🔍 ElasticSearch
export const ELASTIC_INDEX_NAME = 'prodotti' // ✅ index unificato, filtrabile per `source` se serve

// 🧠 Pinecone
export const PINECONE_NAMESPACE = 'products' // ✅ namespace unico, filtrabile per `source`
export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const VECTOR_DIMENSION = 1536

// ✏️ Prompt AI – lunghezza minima per hashing del contenuto
export const MIN_CONTENT_LENGTH_FOR_HASH = 20

// ⚠️ Normalizzazioni e fallback
export const MAX_MEDIA_GALLERY_IMAGES = 10
export const DEFAULT_QTY = 0
export const DEFAULT_TYPE = 'simple'
export const DEFAULT_ATTRIBUTE_SET = 'default'

// 🛑 Tipi di errore per logging
export const LOG_TYPE_VALIDATION_ERROR = 'validation_error'
export const LOG_TYPE_MONGO_ERROR = 'mongo_error'
export const LOG_TYPE_ELASTIC_ERROR = 'elastic_error'
export const LOG_TYPE_PINECONE_ERROR = 'pinecone_error'
export const LOG_TYPE_SKIPPED_ROW = 'skipped_row'
export const LOG_TYPE_EMBEDDING_ERROR = 'embedding_error'

// 🧪 Modalità operative (es: test embedding)
export const LIVE_MODES = ['live', 'prod', 'production']
