// 🏷️ Identificatore statico del fornitore
export const FORNITORE = 'silan' as const

// 🧱 MongoDB
export const MONGO_DB_NAME = 'Premium'
export const MONGO_COLLECTION_PRODOTTI = 'prodotti'

// ⚠️ Normalizzazioni e fallback
export const DEFAULT_QTY = 0
export const DEFAULT_TYPE = 'simple'
export const DEFAULT_ATTRIBUTE_SET = 'default'

// 🛑 Tipi di errore per logging
export const LOG_TYPE_VALIDATION_ERROR = 'validation_error'
export const LOG_TYPE_MONGO_ERROR = 'mongo_error'
export const LOG_TYPE_SKIPPED_ROW = 'skipped_row'
export const LOG_TYPE_MONGO_OK = 'mongo_ok'
