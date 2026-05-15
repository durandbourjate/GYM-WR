/**
 * Cluster D Phase 3a — Pure-Diff-Modul für Batch-Edit.
 *
 * Berechnet aus dem Editor-Form-State einen `FragenBulkPatch`, der nur die
 * vom User explizit „dirty" gesetzten Felder enthält. `undefined`-Werte gelten
 * als „nicht angefasst" und werden NICHT ins Patch übernommen.
 *
 * Single-Source-of-Truth-Pattern: `FragenBulkPatch` + `TagsModus` leben in
 * `@shared/types/fragen-core` und werden hier nur konsumiert — Wire-Vertrag
 * zwischen Editor (Sub-Task 5) und Service-Wrapper (Sub-Task 1, Phase 1b).
 */
import type {
  Fachbereich,
  BloomStufe,
  FragenBulkPatch,
  TagsModus,
} from '../types/fragen-core'

export type { FragenBulkPatch, TagsModus }

/** Input für `berechnePatch`. Pro Feld: `undefined` = nicht dirty (überspringen). */
export interface BatchFormDiffInput {
  fachbereich: Fachbereich | undefined
  bloom: BloomStufe | undefined
  status: 'draft' | 'sammlung' | undefined
  gefaesse: string[] | undefined
  semester: string[] | undefined
  lernzielIds: string[] | undefined
  /** Immer ein Array. Leer = keine Tag-Operation (No-Op trotz `tagsModus`). */
  tagIds: string[]
}

/**
 * Baut ein FragenBulkPatch aus dem dirty-Form-State.
 *
 * - `undefined`-Werte werden übersprungen (User hat das Feld nie angefasst).
 * - `tagIds` ist immer ein Array; leer → kein Tag-Patch erzeugt.
 * - `tagsModus` bestimmt, welches der drei mutually-exclusive Tag-Felder
 *   gesetzt wird (`tagsHinzufuegen` / `tagsErsetzen` / `tagsEntfernen`).
 */
export function berechnePatch(
  form: BatchFormDiffInput,
  tagsModus: TagsModus,
): FragenBulkPatch {
  const patch: FragenBulkPatch = {}
  if (form.fachbereich !== undefined) patch.fachbereich = form.fachbereich
  if (form.bloom !== undefined) patch.bloom = form.bloom
  if (form.status !== undefined) patch.status = form.status
  if (form.gefaesse !== undefined) patch.gefaesse = form.gefaesse
  if (form.semester !== undefined) patch.semester = form.semester
  if (form.lernzielIds !== undefined) patch.lernzielIds = form.lernzielIds
  if (form.tagIds.length > 0) {
    if (tagsModus === 'hinzufuegen') patch.tagsHinzufuegen = form.tagIds
    else if (tagsModus === 'ersetzen') patch.tagsErsetzen = form.tagIds
    else patch.tagsEntfernen = form.tagIds
  }
  return patch
}
