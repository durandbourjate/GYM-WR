/** Safe Exam Browser (SEB) Erkennung und Integration */

/** Prüft ob die App im SEB läuft (User-Agent Check) */
export function istImSEB(customSuffix?: string): boolean {
  const ua = navigator.userAgent
  // SEB fügt "SEB" oder einen custom Suffix zum User-Agent hinzu
  if (ua.includes('SEB')) return true
  if (customSuffix && ua.includes(customSuffix)) return true
  return false
}

/** SEB-Version aus User-Agent extrahieren */
export function sebVersion(): string | undefined {
  const ua = navigator.userAgent
  const match = ua.match(/SEB\/(\d+\.\d+\.\d+)/)
  return match ? match[1] : undefined
}

/** Browser-Info für Meta-Daten */
export function browserInfo(): string {
  return navigator.userAgent.slice(0, 200)
}
