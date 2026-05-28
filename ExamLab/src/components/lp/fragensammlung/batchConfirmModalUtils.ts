/**
 * Hilfsfunktionen für BatchConfirmModal — extrahiert für only-export-components.
 *
 * Bei React-Component-Files erzwingt Fast Refresh, dass nur Components exportiert
 * werden. Non-Component-Helpers wie `tagsModusAusPatch` leben deswegen separat.
 */
import type { FragenBulkPatch, TagsModus } from '@shared/types/fragen-core'

/**
 * Defense-in-Depth (Cluster D Cleanup SP-1, 16.05.2026): leitet TagsModus
 * aus dem Patch ab, falls die Props-Übergabe nicht mit dem Patch übereinstimmt
 * (z.B. wenn der Caller den Modus aus verschiedenen Quellen liest, oder bei
 * einer Race-Condition zwischen `setPendingTagsModus` und `setPendingPatch`).
 *
 * Leitet aus dem Patch (mutually exclusive Tag-Modi) den aktiven TagsModus ab.
 * Default `hinzufuegen` analog batchDiff#berechnePatch — gilt auch wenn kein
 * Tag-Feld gesetzt ist (dann ist die Tag-Sektion eh ausgeblendet).
 */
export function tagsModusAusPatch(patch: FragenBulkPatch): TagsModus {
  if (patch.tagsErsetzen !== undefined) return 'ersetzen'
  if (patch.tagsEntfernen !== undefined) return 'entfernen'
  return 'hinzufuegen'
}
