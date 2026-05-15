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
import type { Tag } from '../types/tags'
import { useTagsStore } from '../store/tagsStore'

type TagFeld = string | Tag
type FrageMitTags = {
  tagIds?: string[]
  tags?: TagFeld[]
}

/**
 * Liefert die Tag-Namen einer Frage als string[]. Nutzt zuerst `tagIds` +
 * tagsStore-Lookup, fällt zurück auf legacy `tags`-Array.
 *
 * NICHT-reaktiv: nutzt `useTagsStore.getState()`. Für render-time Subscribe
 * den Hook direkt verwenden.
 */
export function tagNamenFuerFrage(frage: FrageMitTags): string[] {
  const ids = frage.tagIds
  if (ids && ids.length > 0) {
    const namen = useTagsStore.getState().getByIds(ids).map(t => t.name)
    if (namen.length > 0) return namen
  }
  const legacy = frage.tags ?? []
  return legacy.map(t => (typeof t === 'string' ? t : t.name))
}

/**
 * Cluster H Phase 2: Convenience-Helper für die 5 Stellen, die nach
 * "einrichtung"/"einführung"-Tag filtern (Demo-Modus-Kennzeichnung).
 */
export function istEinrichtungsfrage(frage: FrageMitTags): boolean {
  const namen = tagNamenFuerFrage(frage)
  return namen.some(n => n === 'einrichtung' || n === 'einführung')
}
