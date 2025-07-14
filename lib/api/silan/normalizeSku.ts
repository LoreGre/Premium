export function normalizeSku(s: string): string {
  // 1. Flagga se ci sono spazi interni nell'originale (es: "AB 123")
  const hasInternalSpaces = /\s/.test(s.trim().replace(/^\S+|\S+$/g, ''))

  // 2. Rimuovi accenti e simboli non consentiti, mantieni solo A-Z, 0-9, - e _
  const cleaned = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuovi segni diacritici
    .replace(/[^\w\-]/g, '')         // mantieni solo A-Z, 0-9, _ e -
    .toUpperCase()
    .trim()

  return hasInternalSpaces ? `${cleaned}*` : cleaned
}
