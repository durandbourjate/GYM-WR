import { clearIndexedDB } from '../services/autoSave'

/**
 * Räumt localStorage und IndexedDB nach erfolgreicher Prüfungsabgabe auf.
 * Synchron aufrufbar (IndexedDB-Clear ist fire-and-forget).
 * Muss in ALLEN Abgabe-Pfaden aufgerufen werden:
 * - Freiwillige Abgabe (AbgabeDialog)
 * - Demo-Abgabe (AbgabeDialog, Demo-Pfad)
 * - LP-erzwungenes Beenden (Timer autoAbgabe)
 */
export function cleanupNachAbgabe(pruefungId: string): void {
  clearIndexedDB(pruefungId).catch(() => {})
  try {
    localStorage.removeItem(`pruefung-abgabe-${pruefungId}`)
    localStorage.removeItem(`pruefung-state-${pruefungId}`)
  } catch {
    // ignorieren — localStorage könnte in SEB eingeschränkt sein
  }
}
