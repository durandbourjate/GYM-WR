/**
 * draftCache.ts — Bundle 3 Phase B.5
 *
 * Logout-Cleanup für Draft-IDB-Cache.
 * Löscht nur Keys mit 'draft:'-Prefix aus dem idb-keyval default-Store.
 * Andere Cache-Bereiche (lp-fragen-..., lp-fortschritt) bleiben unangetastet.
 *
 * S149-Pattern: idb-keyval's del() wartet intern auf tx.oncomplete bevor
 * es resolved. Solange alle del()-Calls awaited werden, ist die Privacy-
 * Invariante vor Hard-Nav (window.location.href) erfüllt.
 */
import { keys, del } from 'idb-keyval'

const DRAFT_KEY_PREFIX = 'draft:'

/**
 * Bundle 3: Löscht alle Draft-Cache-Einträge aus IDB (default-Store, Prefix 'draft:').
 * S149-Pattern: jeder del() awaited tx.oncomplete (idb-keyval-internal).
 * Sicher vor window.location.href Hard-Nav: alle Promises müssen vom Caller awaited werden,
 * dann erst Hard-Nav. Andere Cache-Bereiche (lp-fragen-..., lp-fortschritt) bleiben unangetastet.
 *
 * Wirft NICHT — defensives try/catch schluckt Fehler (Logout darf nicht eskalieren).
 */
export async function clearDraftIDBCache(): Promise<void> {
  try {
    const allKeys = await keys()
    const draftKeys = allKeys.filter((k): k is string =>
      typeof k === 'string' && k.startsWith(DRAFT_KEY_PREFIX)
    )
    // Sequenziell del() awaiten, damit jeder tx.oncomplete vor dem nächsten resolved.
    // Alternative Promise.all wäre OK, aber sequenziell erleichtert Debugging bei Fehlern.
    for (const key of draftKeys) {
      await del(key)
    }
  } catch (e) {
    console.warn('[Bundle 3] clearDraftIDBCache fehlgeschlagen:', e)
  }
}
