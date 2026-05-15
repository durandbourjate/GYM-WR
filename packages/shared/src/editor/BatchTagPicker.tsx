/**
 * Cluster D Phase 3b — BatchTagPicker: 3-Modi-Radio + TagPicker-Slot.
 *
 * Wrappt im Batch-Modus den existierenden `tagPickerSlot` (Host-DI für TagPicker)
 * mit einer Radio-Auswahl (Hinzufügen/Ersetzen/Entfernen). Der Modus entscheidet,
 * in welches Feld des `FragenBulkPatch` die ausgewählten Tag-IDs landen
 * (tagsHinzufuegen / tagsErsetzen / tagsEntfernen — mutually exclusive).
 *
 * Einsatz: in `SharedFragenEditor` an der Stelle des bisherigen
 * `tagPickerSlot?.({ tagIds, onChange: setTagIds })`-Aufrufs, wenn `batchMode`
 * aktiv ist. Im Single-Edit-Modus wird diese Komponente NICHT verwendet —
 * dort rendert der bare TagPicker-Slot wie bisher (Backward-Compat absolut).
 *
 * DI-Pattern: `tagPickerSlot` ist eine Render-Prop. Der eigentliche TagPicker
 * lebt in der App-Schicht (tagsStore + tagsApi), nur die Pure-UI ist hier.
 */
import type React from 'react'
import type { TagsModus } from '../types/fragen-core'

interface Props {
  /** Aktuell ausgewählte Tag-IDs (UI-State, vom Host vermittelt) */
  tagIds: string[]
  /** Setter für Tag-IDs (vom Host als `onChange` an den TagPicker geroutet) */
  setTagIds: (ids: string[]) => void
  /** Aktuell gewählter Operations-Modus (Default `'hinzufuegen'`) */
  modus: TagsModus
  /** Setter für den Modus — Caller MUSS hier auch `tagIdsDirty=true` setzen,
   *  damit `berechnePatch` (siehe batchDiff.ts) den Modus-Wechsel als Diff erkennt. */
  setModus: (m: TagsModus) => void
  /** Render-Prop: liefert den eigentlichen TagPicker (App-Schicht). */
  tagPickerSlot: (props: { tagIds: string[]; onChange: (ids: string[]) => void }) => React.ReactNode
}

export default function BatchTagPicker({
  tagIds,
  setTagIds,
  modus,
  setModus,
  tagPickerSlot,
}: Props) {
  return (
    <div className="mt-3 ring-1 ring-violet-300 dark:ring-violet-700 rounded-lg p-2 bg-violet-50/30 dark:bg-violet-900/10">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tags</label>
      <fieldset className="flex flex-col gap-1 mb-3">
        <legend className="sr-only">Tag-Operations-Modus</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="tagsModus"
            checked={modus === 'hinzufuegen'}
            onChange={() => setModus('hinzufuegen')}
          />
          <span>Hinzufügen (bestehende bleiben)</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="tagsModus"
            checked={modus === 'ersetzen'}
            onChange={() => setModus('ersetzen')}
          />
          <span>Ersetzen (alle bestehenden Tags verlieren)</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="tagsModus"
            checked={modus === 'entfernen'}
            onChange={() => setModus('entfernen')}
          />
          <span>Entfernen (gewählte Tags raus, andere bleiben)</span>
        </label>
      </fieldset>
      {tagPickerSlot({ tagIds, onChange: setTagIds })}
    </div>
  )
}
