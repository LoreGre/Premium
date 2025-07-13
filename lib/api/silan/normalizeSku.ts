/**
 * Normalizza lo SKU:
 * - Rimuove accenti (es. è → e)
 * - Rimuove simboli non ammessi
 * - Uppercase coerente
 * - Mantiene solo A-Z, 0-9, -, _
 */
export function normalizeSku(raw: string): string {
    return raw
      .normalize('NFD')                             // separa lettere da accenti
      .replace(/[\u0300-\u036f]/g, '')              // rimuove accenti
      .replace(/[^A-Z0-9_-]/gi, '')                 // rimuove simboli non ammessi
      .toUpperCase()
  }
  