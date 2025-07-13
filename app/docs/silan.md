# 🧱 Silan MongoDB Integration (Batch Import + Qty Update)

Integrazione completa per ingest del file `silan_master_file_full.csv` su MongoDB  
+ aggiornamento quantità (`qty`) da `silan_stock_price_full.csv`.

---

## ✅ Componenti realizzati

### 📁 `/lib/api/silan`
| File | Funzione |
|------|----------|
| `parseRow.ts` | Converte `RowCSV` in `ProdottoMongo`, valida e logga skipped |
| `mongo/upsert.ts` | Upsert su Mongo con controllo `content_hash` |
| `mongo/updateQty.ts` | Update solo campo `qty` se SKU esiste (nessun insert) |
| `validators.ts` | Safe parse + pulizia stringhe, array, immagini |
| `logSkipped.ts` | Log di righe scartate (`sku`, `campo`, `motivo`) |
| `logError.ts` | Log centralizzato errori Mongo/Elastic/Pinecone |
| `normalizeSku.ts` | Pulizia SKU coerente (accents, simboli, uppercase) |
| `types.ts` | Tipi condivisi (`RowCSV`, `ProdottoMongo`, `QtyUpdateRow`, ecc.) |
| `constants.ts` | Costanti globali (fornitore, collezioni, modelli, fallback) |

---

### 📁 `/lib/mongo`
| File | Funzione |
|------|----------|
| `client.ts` | Singleton per connessione a MongoDB tramite `MONGODB_URI` |

---

## 🌐 API REST

---

### 📍 `/app/api/silan/route.ts`

#### 🔄 Endpoint:
`POST /api/silan`

#### Headers:
- `x_api_key`: autenticazione con `PREMIUM_SECRET_TOKEN`

#### Query Params:
- `offset`: riga di partenza (default: 0)
- `limit`: numero righe da processare (default: 500)

#### Flusso:
1. Scarica file da Supabase (`csv-files/silan_master_file_full.csv`)
2. Parsa e valida ogni riga (`parseRow`)
3. Upsert su Mongo se `content_hash` è nuovo
4. Log di righe `invalid`, `skipped`, `inserted`, `updated`

#### Output JSON:
{
  "success": true,
  "offset": 0,
  "limit": 500,
  "count": 500,
  "inserted": ["ABC123"],
  "updated": ["XYZ987"],
  "skipped": ["DEF456"],
  "invalid": ["000000"],
  "nextOffset": 500
}

#### Chiamata:
curl -X POST 'http://premium.local:3000/api/silan?offset=0&limit=1' \
  -H 'Content-Type: application/json' \
  -H 'x_api_key: 4hRD3xGJqx4ktjeHWtyVrapg2i7a35T5PKrMxFoI1IBVwBvPge5eQ3AJchr7r9dl' \
  -H 'x_mode: live'


#### 📍 /app/api/silan/qty/route.ts
#### 🔄 Endpoint:

POST /api/silan/qty

Headers:

x_api_key: autenticazione con PREMIUM_SECRET_TOKEN
Query Params:

offset: riga di partenza (default: 0)
limit: numero righe da processare (default: 500)
Flusso:

Scarica file da Supabase (csv-files/silan_stock_price_full.csv)
Per ogni riga:
Valida sku e qty
Normalizza lo SKU
Esegue updateOne su normalized_sku
Se SKU non trovato → logSkipped
Log di invalid, qty update, non trovati

Output JSON:
{
  "success": true,
  "offset": 0,
  "limit": 500,
  "count": 498,
  "invalid": ["", "XXX000"],
  "nextOffset": 500
}

curl -X POST 'http://premium.local:3000/api/silan/qty?offset=0&limit=500' \
  -H 'x_api_key: 4hRD3xGJqx4ktjeHWtyVrapg2i7a35T5PKrMxFoI1IBVwBvPge5eQ3AJchr7r9dl'

