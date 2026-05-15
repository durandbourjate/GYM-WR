/**
 * Cluster H Phase 2: Helpers für Tag-Namen-Auflösung aus `tagIds` via tagsStore.
 *
 * Hintergrund: Nach Phase 1 ist `frage.tagIds: string[]` der primäre Wire-Vertrag,
 * `frage.tags` (string|Tag)[] bleibt als Legacy für Rollback bis Phase 3.
 *
 * Diese Helpers liefern Tag-Namen aus tagIds via `useTagsStore.getState()`.
 * Bei leeren tagIds (alter Daten-State) Fallback auf legacy `tags`.
 *
 * Hook-Form: Render-Time-Komponenten sollen `useTagsStore(s => ...)` direkt
 * benutzen für Re-Render bei Tag-Rename. Diese Helpers sind für Pure-Helpers,
 * useEffect-Bodies und useMemo-Bodies (wo getState() pragmatisch akzeptabel ist).
 */
import type { Tag as SharedTag } from '@shared/types/tag'
import type { Tag as LegacyTag } from '../types/tags'
import { useTagsStore } from '../store/tagsStore'

type TagFeld = string | LegacyTag
export type FrageMitTags = {
  tagIds?: string[]
  tags?: TagFeld[]
}

/** Tags die eine Demo-/Einrichtungsfrage markieren — siehe `istEinrichtungsfrage`. */
const EINRICHTUNGS_TAGS = new Set(['einrichtung', 'einführung'])

/**
 * Pure-Helper-Variante von `tagNamenFuerFrage` für Hook-Selektoren.
 * Nimmt den Tags-Slice-State explizit als Param (statt via getState()),
 * damit Render-Body-Aufrufer reaktiv bleiben:
 *
 *   const tagNamen = useTagsStore(s => tagNamenFromStore(frage, s))
 *
 * Single Source of Truth für Lookup-Reihenfolge: tagIds → tagsStore → Legacy-tags-Fallback.
 */
export function tagNamenFromStore(
  frage: FrageMitTags,
  store: { getByIds: (ids: string[]) => SharedTag[] },
): string[] {
  const ids = frage.tagIds
  if (ids && ids.length > 0) {
    const namen = store.getByIds(ids).map(t => t.name)
    if (namen.length > 0) return namen
  }
  const legacy = frage.tags ?? []
  return legacy.map(t => (typeof t === 'string' ? t : t.name))
}

/**
 * Liefert die Tag-Namen einer Frage als string[]. Nutzt zuerst `tagIds` +
 * tagsStore-Lookup, fällt zurück auf legacy `tags`-Array bei leeren tagIds
 * ODER leerem Lookup-Result (z.B. Store noch nicht geladen).
 *
 * NICHT-reaktiv: nutzt `useTagsStore.getState()`. Für render-time Subscribe
 * `tagNamenFromStore` mit `useTagsStore(s => ...)` verwenden.
 */
export function tagNamenFuerFrage(frage: FrageMitTags): string[] {
  return tagNamenFromStore(frage, useTagsStore.getState())
}

/**
 * Cluster H Phase 2: Convenience-Helper für die Stellen, die nach
 * "einrichtung"/"einführung"-Tag filtern (Demo-Modus-Kennzeichnung).
 */
export function istEinrichtungsfrage(frage: FrageMitTags): boolean {
  return tagNamenFuerFrage(frage).some(n => EINRICHTUNGS_TAGS.has(n))
}
