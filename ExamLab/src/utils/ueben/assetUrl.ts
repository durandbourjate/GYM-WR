/** Base-URL für Pool-Bilder (Uebungen/Uebungspools auf GitHub Pages) */
const POOL_IMG_BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'

/** Löst relative Asset-Pfade korrekt auf (berücksichtigt Vite base path + Pool-Bilder) */
export function resolveAssetUrl(pfad: string): string {
  if (!pfad) return pfad
  // Bereits absolute URL (http/https/blob/data) → unverändert
  if (/^(https?:|blob:|data:)/.test(pfad)) return pfad
  // Pool-Bild-Pfade → auf Uebungen-Verzeichnis auflösen
  if (pfad.startsWith('img/') || pfad.startsWith('pool-bilder/')) {
    return POOL_IMG_BASE_URL + pfad
  }
  // Führenden Slash entfernen (falls noch vorhanden)
  const bereinigt = pfad.replace(/^\//, '')
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${bereinigt}`
}
