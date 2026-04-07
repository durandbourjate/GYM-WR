/**
 * localStorage-Migration: lernplattform-* → ueben-*
 *
 * SuS die sich vor der Umbenennung eingeloggt hatten, haben noch
 * den alten Key. Diese Funktion kopiert den Wert auf den neuen Key
 * und entfernt den alten — einmalig, idempotent.
 */

const MIGRATION_MAP: Record<string, string> = {
  'lernplattform-auth': 'ueben-auth',
  'lernplattform-fortschritt': 'ueben-fortschritt',
  'lernplattform-auftraege': 'ueben-auftraege',
  'lernplattform-theme': 'ueben-theme',
}

let migrationAusgefuehrt = false

/**
 * Führt die Migration aller bekannten Keys durch.
 * Sicher aufzurufen: überschreibt nie einen bereits vorhandenen neuen Key.
 */
export function migriereLernplattformKeys(): void {
  if (migrationAusgefuehrt) return
  migrationAusgefuehrt = true

  try {
    for (const [alterKey, neuerKey] of Object.entries(MIGRATION_MAP)) {
      const alterWert = localStorage.getItem(alterKey)
      if (alterWert === null) continue

      // Nur migrieren wenn der neue Key noch nicht existiert
      const neuerWert = localStorage.getItem(neuerKey)
      if (neuerWert === null) {
        localStorage.setItem(neuerKey, alterWert)
      }

      // Alten Key immer entfernen (auch wenn neuer schon existiert)
      localStorage.removeItem(alterKey)
    }
  } catch {
    // localStorage nicht verfügbar — ignorieren
  }
}
