/**
 * Einmalige Migration: Alte Hash-basierte Lesezeichen (#/pruefung/abc)
 * in Pfad-basierte URLs (/pruefung/abc) konvertieren für BrowserRouter.
 * Wird einmal beim App-Start aufgerufen, vor dem Router-Mount.
 */
let migrated = false

export function migrateHashBookmarks(basePath: string): void {
  if (migrated) return // Guard gegen mehrfache Ausführung (HMR)
  migrated = true
  const hash = window.location.hash
  if (hash.startsWith('#/')) {
    const path = hash.slice(1) // '#/pruefung/abc' → '/pruefung/abc'
    window.history.replaceState(null, '', basePath + path.slice(1))
  }
}
