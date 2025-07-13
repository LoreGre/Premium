# 🧱 Silan MongoDB Integration (Batch Import)

Integrazione completa per ingest del file `silan_master_file_full.csv` su MongoDB.

---

## ✅ Componenti realizzati

### 📁 `/lib/api/silan`
| File | Funzione |
|------|----------|
| `parseRow.ts` | Converte `RowCSV` in `ProdottoMongo`, valida e logga skipped |
| `upsertMongo.ts` | Upsert su Mongo con controllo `content_hash` |
| `validators.ts` | Safe parse + pulizia stringhe, array, immagini |
| `logSkipped.ts` | Log di righe scartate (`sku`, `campo`, `motivo`) |
| `logError.ts` | Log centralizzato errori Mongo/Elastic/Pinecone |
| `normalizeSku.ts` | Pulizia SKU coerente (accents, simboli, uppercase) |
| `types.ts` | Tipi condivisi (RowCSV, ProdottoMongo, ecc.) |
| `constants.ts` | Costanti globali (fornitore, collezioni, modelli, fallback) |

---

### 📁 `/lib/mongo`
| File | Funzione |
|------|----------|
| `client.ts` | Singleton per connessione a MongoDB tramite `MONGODB_URI` |

---

### 📁 `/app/api/silan/route.ts`
Endpoint REST per import batch:


#### Headers:
- `x_api_key`: autenticazione con `PREMIUM_SECRET_TOKEN`

#### Flusso:
1. Scarica file da Supabase Storage (`csv-files/silan/silan_master_file_full.csv`)
2. Parsa e valida ogni riga (`parseRow`)
3. Upsert su Mongo se `content_hash` è nuovo
4. Risponde con esito: `inserted`, `updated`, `skipped`, `invalid`

#### Chiamata:
curl -X POST 'http://premium.local:3000/api/silan?offset=0&limit=100' \
  -H 'Content-Type: application/json' \
  -H 'x_api_key: 4hRD3xGJqx4ktjeHWtyVrapg2i7a35T5PKrMxFoI1IBVwBvPge5eQ3AJchr7r9dl' \
  -H 'x_mode: live'

