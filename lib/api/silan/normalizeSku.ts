export function normalizeSku(s: string): string {
  // 1. Verifica se ci sono spazi interni PRIMA di pulire
  const hasInternalSpaces = /\s/.test(s.trim().replace(/^\s+|\s+$/g, ''))

  // 2. Pulizia: accenti, simboli, tutto maiuscolo
  let cleaned = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accenti
    .replace(/[^\w\-]/g, '') // solo A-Z, 0-9, _ e -
    .toUpperCase()
    .trim()

  // 3. Aggiunta asterisco finale se aveva spazi interni
  return hasInternalSpaces ? `${cleaned}*` : cleaned
}
