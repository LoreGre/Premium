import type { RowCSV, ProdottoMongo } from './types'
import { normalizeSku } from './normalizeSku'
import {
  cleanString,
  safeParseFloat,
  safeParseInt,
  splitAndCleanArray,
  isValidImageUrl,
  buildMediaGallery,
} from './validators'
import { FORNITORE, DEFAULT_QTY, DEFAULT_TYPE, DEFAULT_ATTRIBUTE_SET } from './constants'
import { logSkippedRow } from './logSkipped'
import crypto from 'crypto'

type ParseResult = {
  prodotto: ProdottoMongo
  content_hash: string
}

export async function parseRow(row: RowCSV): Promise<ParseResult | undefined> {
  try {
    const rawSku = row.sku?.trim()
    if (!rawSku) {
      await logSkippedRow({ reason: 'Missing SKU', raw: row, field: 'sku' })
      return undefined
    }
    const sku = normalizeSku(rawSku)

    const name = cleanString(row.name)
    if (!name) {
      await logSkippedRow({ reason: 'Missing name', raw: row, field: 'name' })
      return undefined
    }

    const description = cleanString(row.description, name)

    const unit_price = safeParseFloat(row.unit_price)
    if (!unit_price) {
      await logSkippedRow({ reason: 'Invalid unit_price', raw: row, field: 'unit_price' })
      return undefined
    }

    const qty = safeParseInt(row.qty) ?? DEFAULT_QTY

    const tier_qty_1 = safeParseInt(row.tier_qty_1)
    const tier_price_1 = safeParseFloat(row.tier_price_1)
    const tier_price = tier_qty_1 && tier_price_1
      ? { qty: tier_qty_1, price: tier_price_1 }
      : undefined

    const category_name = cleanString(row.category_name)
    if (!category_name) {
      await logSkippedRow({ reason: 'Missing category_name', raw: row, field: 'category_name' })
      return undefined
    }

    const media_gallery = buildMediaGallery(
      row.media_gallery,
      row.image,
      row.small_image,
      row.thumbnail
    )

    const prodotto: ProdottoMongo = {
      sku,
      name,
      name_eng: cleanString(row.name_eng),
      description,
      unit_price,
      tier_price_1: tier_price,
      msrp: safeParseFloat(row.msrp),
      qty_increments: safeParseInt(row.qty_increments),
      category_name,
      url_key: cleanString(row.url_key),
      link: cleanString(row.link),
      type: cleanString(row.type, DEFAULT_TYPE) as ProdottoMongo['type'],
      parent_sku: cleanString(row.parent_sku),
      simples_skus: [],
      grouped_skus: [],
      cs_skus: [],
      us_skus: [],
      image: isValidImageUrl(row.image) ? row.image : undefined,
      small_image: isValidImageUrl(row.small_image) ? row.small_image : undefined,
      thumbnail: isValidImageUrl(row.thumbnail) ? row.thumbnail : undefined,
      media_gallery,
      visibility: cleanString(row.visibility),
      attribute_set: cleanString(row.attribute_set, DEFAULT_ATTRIBUTE_SET),
      taglia: cleanString(row.taglia),
      colore: cleanString(row.colore),
      configurable_attributes: splitAndCleanArray(row.configurable_attributes),
      weight: safeParseFloat(row.weight),
      qty,
      source: FORNITORE,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const content = [
      prodotto.name,
      prodotto.description,
      `Categoria: ${prodotto.category_name}`,
      prodotto.colore && `Colore: ${prodotto.colore}`,
      prodotto.taglia && `Taglia: ${prodotto.taglia}`,
    ]
      .filter(Boolean)
      .join('\n')

    const content_hash = crypto.createHash('sha256').update(content).digest('hex')

    return { prodotto, content_hash }
  } catch (err: unknown) {
    console.error('ParseRow Error:', err)
    await logSkippedRow({
      reason: 'Unexpected parse error',
      raw: row,
    })
    return undefined
  }
}