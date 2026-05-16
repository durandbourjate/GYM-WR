/**
 * BatchConfirmModal — Cluster D Phase 4 Confirm-Dialog für Bulk-Update (15.05.2026).
 *
 * Zeigt geänderte Felder vor dem Apply gebündelt an:
 *  - Skalar-Felder (fachbereich/bloom/status) → ÜBERSCHRIEBEN
 *  - Array-Felder (gefaesse/semester/lernzielIds) → ebenfalls ÜBERSCHRIEBEN
 *    (Backend speichert sie als comma-joined-String und ersetzt den alten Wert,
 *    siehe `apps-script-code.js#updateFrageMitPatch_` Z.1053-1055).
 *  - Tags je nach `tagsModus`:
 *      hinzufuegen → grün
 *      ersetzen    → rot
 *      entfernen   → orange
 *  - Yellow-Warnung wenn `sichtbarCount < anzahl`.
 *
 * Hilfsfunktion `tagsModusAusPatch` wird exportiert für Tests + Konsumenten.
 */
import { useMemo } from 'react'
import type { FragenBulkPatch, TagsModus } from '@shared/types/fragen-core'
import { bloomLabel } from '@shared/editor/fachUtils'
import BaseDialog from '../../ui/BaseDialog'
import Button from '../../ui/Button'
import { TYPO } from '../../../styles/typografie'

interface Props {
  patch: FragenBulkPatch
  anzahl: number
  sichtbarCount: number
  tagsModus: TagsModus
  /** Caller resolvet aus tagsStore: tagNamen für die im Patch enthaltenen Tag-IDs. */
  tagNamen: string[]
  onBestaetigen: () => void
  onAbbrechen: () => void
}

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

interface FeldEintrag {
  key: string
  label: string
  wert: string
}

function fachbereichLabel(fb: string): string {
  // Fachbereich-Token bleibt User-sichtbar (kein zentraler Mapper vorhanden).
  return fb
}

function statusLabel(s: 'draft' | 'sammlung'): string {
  return s === 'draft' ? 'Entwurf' : 'Sammlung'
}

function felderAusPatch(patch: FragenBulkPatch): FeldEintrag[] {
  const out: FeldEintrag[] = []
  if (patch.fachbereich !== undefined) {
    out.push({ key: 'fachbereich', label: 'Fachbereich', wert: fachbereichLabel(patch.fachbereich) })
  }
  if (patch.bloom !== undefined) {
    out.push({ key: 'bloom', label: 'Bloom-Stufe', wert: `${patch.bloom} — ${bloomLabel(patch.bloom)}` })
  }
  if (patch.status !== undefined) {
    out.push({ key: 'status', label: 'Status', wert: statusLabel(patch.status) })
  }
  if (patch.gefaesse !== undefined) {
    out.push({ key: 'gefaesse', label: 'Gefässe', wert: patch.gefaesse.length === 0 ? '(leer)' : patch.gefaesse.join(', ') })
  }
  if (patch.semester !== undefined) {
    out.push({ key: 'semester', label: 'Semester', wert: patch.semester.length === 0 ? '(leer)' : patch.semester.join(', ') })
  }
  if (patch.lernzielIds !== undefined) {
    out.push({ key: 'lernzielIds', label: 'Lernziele', wert: patch.lernzielIds.length === 0 ? '(leer)' : `${patch.lernzielIds.length} Lernziele` })
  }
  return out
}

function tagIdsAusPatch(patch: FragenBulkPatch, modus: TagsModus): string[] {
  if (modus === 'ersetzen') return patch.tagsErsetzen ?? []
  if (modus === 'entfernen') return patch.tagsEntfernen ?? []
  return patch.tagsHinzufuegen ?? []
}

export default function BatchConfirmModal({
  patch,
  anzahl,
  sichtbarCount,
  tagsModus,
  tagNamen,
  onBestaetigen,
  onAbbrechen,
}: Props) {
  /** Defense-in-Depth (SP-1): wenn der Caller einen tagsModus übergibt,
   *  der mit dem Patch nicht konsistent ist (z.B. `tagsModus='ersetzen'`,
   *  aber `patch.tagsHinzufuegen` gesetzt), ziehen wir den patch-derivierten
   *  Modus vor — sonst würde der User in der Confirm-Anzeige die falsche
   *  Sektion sehen (Verwechslungsgefahr „Hinzufügen" vs „Ersetzen"). */
  const effektiverModus = useMemo<TagsModus>(() => {
    const ausPatch = tagsModusAusPatch(patch)
    // Falls Tag-Felder im Patch fehlen → patch-derived ist 'hinzufuegen' (Default).
    // Dann hat der prop-Modus keinen Bezug zum Patch und wir behalten den prop-Wert
    // (z.B. Skalar-Patch ohne Tag-Felder: tagsModus='ersetzen' ist dann egal).
    const patchHatTags =
      patch.tagsHinzufuegen !== undefined ||
      patch.tagsErsetzen !== undefined ||
      patch.tagsEntfernen !== undefined
    if (!patchHatTags) return tagsModus
    // Patch hat Tag-Felder → patch-derived ist load-bearing. Mismatch overriden.
    return ausPatch
  }, [patch, tagsModus])
  const ueberschriebeneFelder = useMemo(() => felderAusPatch(patch), [patch])
  const tagIds = useMemo(() => tagIdsAusPatch(patch, effektiverModus), [patch, effektiverModus])
  const nichtSichtbar = Math.max(0, anzahl - sichtbarCount)

  return (
    <BaseDialog
      open
      onClose={onAbbrechen}
      title="Batch-Bearbeitung bestätigen"
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onAbbrechen}>Abbrechen</Button>
          <Button variant="primary" onClick={onBestaetigen}>Endgültig anwenden</Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <p>
          <strong>{anzahl}</strong> {anzahl === 1 ? 'Frage wird' : 'Fragen werden'} bearbeitet.
          {nichtSichtbar > 0 && (
            <>
              {' '}
              <strong className="text-yellow-600 dark:text-yellow-300">
                Achtung: {nichtSichtbar} davon {nichtSichtbar === 1 ? 'ist' : 'sind'} im aktuellen Filter nicht sichtbar.
              </strong>
            </>
          )}
        </p>

        {ueberschriebeneFelder.length > 0 && (
          <section data-testid="batch-confirm-ueberschriebene">
            <h3 className={TYPO.h2}>Diese Felder werden ÜBERSCHRIEBEN:</h3>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              {ueberschriebeneFelder.map((f) => (
                <li key={f.key}>
                  <strong>{f.label}:</strong> &rarr; „{f.wert}"
                </li>
              ))}
            </ul>
          </section>
        )}

        {effektiverModus === 'hinzufuegen' && tagIds.length > 0 && (
          <section
            data-testid="batch-confirm-tags-hinzufuegen"
            className="text-emerald-700 dark:text-emerald-300"
          >
            <h3 className={TYPO.h2}>Tags werden HINZUGEFÜGT:</h3>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              {tagNamen.map((n) => (
                <li key={n}>+ {n}</li>
              ))}
            </ul>
          </section>
        )}

        {effektiverModus === 'ersetzen' && (
          <section
            data-testid="batch-confirm-tags-ersetzen"
            className="text-red-700 dark:text-red-300"
          >
            <h3 className={TYPO.h2}>Tags werden vollständig ERSETZT:</h3>
            <p className="mt-1">
              Alle bestehenden Tags bei {anzahl} {anzahl === 1 ? 'Frage' : 'Fragen'} werden entfernt
              {tagIds.length > 0 ? ', dann diese neu gesetzt:' : '.'}
            </p>
            {tagIds.length > 0 && (
              <ul className="mt-1 ml-4 list-disc space-y-0.5">
                {tagNamen.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {effektiverModus === 'entfernen' && tagIds.length > 0 && (
          <section
            data-testid="batch-confirm-tags-entfernen"
            className="text-orange-700 dark:text-orange-300"
          >
            <h3 className={TYPO.h2}>Tags werden ENTFERNT (andere bleiben):</h3>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              {tagNamen.map((n) => (
                <li key={n}>&minus; {n}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </BaseDialog>
  )
}
