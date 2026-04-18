import { lazy, type ComponentType } from 'react'

/**
 * Lazy-Loader mit automatischem Reload bei Chunk-Load-Fehler.
 *
 * Hintergrund: Nach einem Deploy verweist der gecachte `index.html` im Browser
 * auf alte Chunk-Hashes, die auf dem Server nicht mehr existieren → 404 →
 * `Failed to fetch dynamically imported module`. Dieser Wrapper fängt den
 * Fehler ab und lädt die Seite neu — danach hat der Browser frisches HTML
 * mit den neuen Hashes.
 *
 * Schutz vor Reload-Loop: sessionStorage-Flag verhindert, dass dauerhaft
 * fehlschlagende Imports (echter Bug, nicht nur Cache) eine Endlos-Schleife
 * auslösen. Bei erfolgreichem Import wird der Flag wieder gelöscht.
 */
const RELOAD_KEY = 'examlab-lazy-retry-done'

export function lazyMitRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
) {
  return lazy<T>(() =>
    importFn()
      .then((mod) => {
        sessionStorage.removeItem(RELOAD_KEY)
        return mod
      })
      .catch((err) => {
        const alreadyTried = sessionStorage.getItem(RELOAD_KEY)
        if (!alreadyTried) {
          sessionStorage.setItem(RELOAD_KEY, '1')
          console.warn('[ExamLab] Chunk-Load fehlgeschlagen, lade Seite neu...', err)
          window.location.reload()
          return new Promise<{ default: T }>(() => {})
        }
        console.error('[ExamLab] Chunk-Load nach Reload weiterhin fehlerhaft.', err)
        throw err
      }),
  )
}
