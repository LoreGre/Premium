/**
 * Parse sicuro di un float, restituisce undefined se invalido o <= 0 (es. prezzo)
 */
export function safeParseFloat(value?: string | null): number | undefined {
    if (!value) return undefined
    const parsed = parseFloat(value)
    return isNaN(parsed) || parsed <= 0 ? undefined : parsed
  }
  
  /**
   * Parse sicuro di un intero, restituisce undefined se invalido o < 0
   */
  export function safeParseInt(value?: string | null): number | undefined {
    if (!value) return undefined
    const parsed = parseInt(value)
    return isNaN(parsed) || parsed < 0 ? undefined : parsed
  }
  
  /**
   * Restituisce un array pulito da stringa CSV-like (es. "blu, rosso, verde")
   */
  export function splitAndCleanArray(value?: string, separator = ','): string[] {
    return value
      ? value.split(separator).map((v) => v.trim()).filter(Boolean)
      : []
  }
  
  /**
   * Valida se un'immagine è una URL assoluta http/https
   */
  export function isValidImageUrl(url?: string): url is string {
    return typeof url === 'string' && url.startsWith('http')
  }  
  
  /**
   * Fallback intelligente per immagini multiple
   */
  export function buildMediaGallery(...images: (string | undefined)[]): string[] {
    const cleaned = images
      .filter(isValidImageUrl)
      .map((v) => v.trim())
    return [...new Set(cleaned)].slice(0, 10)
  }
  
  /**
   * Stringa pulita, default fallback
   */
  export function cleanString(value?: string, fallback = ''): string {
    return value?.trim().replace(/\s+/g, ' ') || fallback
  }
  