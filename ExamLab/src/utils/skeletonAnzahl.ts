/**
 * Liest eine als String in localStorage abgelegte Anzahl.
 * Toleriert fehlende Keys, garbled values, negative Zahlen und Werte über `max`.
 *
 * Verwendung: Skeleton-Komponenten wie LPCardsSkeleton speichern die letzte
 * gesehene Anzahl Konfigurationen, damit der Skeleton beim nächsten Login
 * layout-akkurat ist.
 */
export function leseGespeicherteAnzahl(key: string, fallback: number, max: number = 12): number {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    const n = parseInt(v, 10)
    if (!Number.isFinite(n)) return fallback
    if (n < 0) return 0
    if (n > max) return max
    return n
  } catch {
    return fallback
  }
}

/**
 * Schreibt eine Anzahl als String in localStorage.
 * Schluckt Errors silent (z.B. Privacy-Modus, Quota voll) — die persistierte
 * Anzahl ist nur ein UX-Hint, kein kritisches Datum.
 */
export function schreibeGespeicherteAnzahl(key: string, wert: number): void {
  try {
    localStorage.setItem(key, String(wert))
  } catch {
    // localStorage nicht verfügbar (Privacy-Modus) oder Quota voll — silent
  }
}
