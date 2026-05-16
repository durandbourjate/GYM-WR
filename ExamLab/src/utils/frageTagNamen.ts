/**
 * Cluster H Phase 3 (17.05.2026): Helpers für Tag-Namen-Auflösung aus `tagIds` via tagsStore.
 *
 * Phase 3 entfernt den `frage.tags`-Fallback — `tagIds` ist Single-Source-of-Truth.
 * Bei leeren tagIds liefert der Helper ein leeres Array zurück.
 *
 * Hook-Form: Render-Time-Komponenten sollen `useTagsStore(s => ...)` direkt
 * benutzen für Re-Render bei Tag-Rename. Diese Helpers sind für Pure-Helpers,
 * useEffect-Bodies und useMemo-Bodies (wo getState() pragmatisch akzeptabel ist).
 */
import type { Tag as SharedTag } from '@shared/types/tag'
import { useTagsStore } from '../store/tagsStore'

export type FrageMitTags = {
  tagIds: string[]
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
 * Cluster H Phase 3 (17.05.2026): Single Source of Truth ist tagIds + tagsStore.
 * Bei leeren tagIds oder leerem Store-Lookup → leeres Array.
 */
export function tagNamenFromStore(
  frage: FrageMitTags,
  store: { getByIds: (ids: string[]) => SharedTag[] },
): string[] {
  if (!frage.tagIds || frage.tagIds.length === 0) return []
  return store.getByIds(frage.tagIds).map(t => t.name)
}

/**
 * Liefert die Tag-Namen einer Frage als string[] via tagsStore-Lookup.
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
