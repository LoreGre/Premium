export function normalizeSku(s: string): string {
  // 1. Rimuovi accenti e simboli non consentiti, mantieni solo A-Z, 0-9, - e _
  const cleaned = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuovi segni diacritici
    .replace(/[^\w\-]/g, '') // mantieni solo lettere, numeri, _ e -
    .toUpperCase()
    .trim()

  // 2. Se ci sono spazi interni nell’originale → flagga con *
  const hasInternalSpaces = /\s/.test(s.trim().replace(/^\s+|\s+$/g, ''))

  return hasInternalSpaces ? `${cleaned}*` : cleaned
}
