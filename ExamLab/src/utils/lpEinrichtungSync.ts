import { speichereConfig, speichereFrage } from '../services/fragensammlungApi'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsFragen } from '../data/einrichtungsFragen'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import { einrichtungsUebungFragen } from '../data/einrichtungsUebungFragen'
import type { Frage } from '../types/fragen-storage'

export const SYNC_KEY = 'einrichtung-sync-v5'
export const UEBUNG_SYNC_KEY = 'einrichtung-uebung-sync-v5'

export function getSyncVersion(): string {
  return `${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}-${einrichtungsFragen.length}`
}

export function getUebungSyncVersion(): string {
  return `${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}-${einrichtungsUebungFragen.length}`
}

/** Speichert Fragen seriell mit 200ms Pause — verhindert Backend-Stau. */
export async function syncFragenSeriell(email: string, fragen: Frage[]): Promise<void> {
  for (const frage of fragen) {
    await speichereFrage(email, frage)
    await new Promise(r => setTimeout(r, 200))
  }
}

/** Synchronisiert Einrichtungsprüfung. localStorage-Guard idempotent. */
export async function syncEinrichtungsPruefung(
  email: string,
  onError: (msg: string) => void
): Promise<void> {
  try { if (localStorage.getItem(SYNC_KEY) === getSyncVersion()) return } catch { /* ignore */ }

  console.log('[LP] Einrichtungsprüfung sync starten...')
  try {
    await speichereConfig(email, { ...einrichtungsPruefung, erstelltVon: email })
    await syncFragenSeriell(email, einrichtungsFragen)
    try { localStorage.setItem(SYNC_KEY, getSyncVersion()) } catch { /* ignore */ }
    console.log(`[LP] Einrichtungsprüfung sync fertig (${einrichtungsFragen.length} Fragen)`)
  } catch (error) {
    console.error('[LP] Einrichtungsprüfung sync fehlgeschlagen:', error)
    onError('Einrichtungsprüfung konnte nicht synchronisiert werden. Bitte Seite neu laden.')
  }
}

/** Synchronisiert Einführungsübung. localStorage-Guard idempotent. */
export async function syncEinrichtungsUebung(
  email: string,
  onError: (msg: string) => void
): Promise<void> {
  try { if (localStorage.getItem(UEBUNG_SYNC_KEY) === getUebungSyncVersion()) return } catch { /* ignore */ }

  console.log('[LP] Einführungsübung sync starten...')
  try {
    await speichereConfig(email, { ...einrichtungsUebung, erstelltVon: email })
    await syncFragenSeriell(email, einrichtungsUebungFragen)
    try { localStorage.setItem(UEBUNG_SYNC_KEY, getUebungSyncVersion()) } catch { /* ignore */ }
    console.log(`[LP] Einführungsübung sync fertig (${einrichtungsUebungFragen.length} Fragen)`)
  } catch (error) {
    console.error('[LP] Einführungsübung sync fehlgeschlagen:', error)
    onError('Einführungsübung konnte nicht synchronisiert werden. Bitte Seite neu laden.')
  }
}
