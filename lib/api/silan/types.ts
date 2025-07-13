export type RowCSV = {
    sku: string
    name: string
    name_eng?: string
    description?: string
    description_eng?: string
    unit_price?: string
    tier_qty_1?: string
    tier_price_1?: string
    tier_qty_2?: string
    tier_price_2?: string
    msrp?: string
    qty_increments?: string
    category_name?: string
    url_key?: string
    link?: string
    type?: string
    parent_sku?: string
    taglia?: string
    colore?: string
    configurable_attributes?: string
    weight?: string
    image?: string
    small_image?: string
    thumbnail?: string
    media_gallery?: string
    visibility?: string
    attribute_set?: string
    qty?: string
  }
  
  export type ProdottoMongo = {
    sku: string
    name: string
    name_eng?: string
    description: string
    unit_price: number
    tier_price_1?: {
      qty: number
      price: number
    }
    msrp?: number
    qty_increments?: number
    category_name: string
    url_key?: string
    link: string
    type: 'simple' | 'configurable' | string
    parent_sku?: string
    simples_skus?: string[]
    grouped_skus?: string[]
    cs_skus?: string[]
    us_skus?: string[]
    image?: string
    small_image?: string
    thumbnail?: string
    media_gallery?: string[]
    visibility?: string
    attribute_set?: string
    taglia?: string
    colore?: string
    configurable_attributes?: string[]
    weight?: number
    qty: number
    source: 'silan'
    created_at: Date
    updated_at: Date
  }
  
  export type ElasticDoc = {
    sku: string
    name: string
    description: string
    category_name: string
    taglia?: string
    colore?: string
    weight?: number
    unit_price: number
  }
  
  export type EmbeddingRow = {
    sku: string
    content: string
    vector: number[]
    model: string
    metadata: {
      category?: string
      taglia?: string
      colore?: string
      unit_price?: number
      weight?: number
    }
  }
  