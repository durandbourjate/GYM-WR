export const POOL_IMG_BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'

/** Erzeugt eine UUID v4 (kryptografisch einfach, ohne externe Abhängigkeit) */
export function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Erstellt das ISO-Datum für jetzt */
export function jetzt(): string {
  return new Date().toISOString()
}
