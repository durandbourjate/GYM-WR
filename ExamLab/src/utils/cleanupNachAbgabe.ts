import { clearIndexedDB } from '../services/autoSave'
import { usePruefungStore } from '../store/pruefungStore'

/**
 * Räumt localStorage und IndexedDB nach erfolgreicher Prüfungsabgabe auf.
 * Synchron aufrufbar (IndexedDB-Clear ist fire-and-forget).
 * Muss in ALLEN Abgabe-Pfaden aufgerufen werden:
 * - Freiwillige Abgabe (AbgabeDialog)
 * - Demo-Abgabe (AbgabeDialog, Demo-Pfad)
 * - LP-erzwungenes Beenden (Timer autoAbgabe)
 */
export function cleanupNachAbgabe(storeKey: string): void {
  clearIndexedDB(storeKey).catch(() => {})
  // Zustand persist-Storage leeren (verhindert dass persist den Key sofort wieder schreibt)
  usePruefungStore.persist.clearStorage()
  try {
    localStorage.removeItem(`pruefung-abgabe-${storeKey}`)
  } catch {
    // ignorieren — localStorage könnte in SEB eingeschränkt sein
  }
}
