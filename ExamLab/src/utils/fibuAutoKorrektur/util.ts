/** Normalisiert einen String für Vergleiche (lowercase, trimmed) */
export function norm(s: string): string {
  return s.toLowerCase().trim()
}

/** Prüft ob zwei Konten-Sets die gleichen Nummern enthalten (reihenfolge-unabhängig) */
export function kontenSetGleich(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortA = [...a].sort()
  const sortB = [...b].sort()
  return sortA.every((v, i) => v === sortB[i])
}

/** Prüft ob zwei Arrays in gleicher Reihenfolge sind */
export function gleicheReihenfolge(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}
