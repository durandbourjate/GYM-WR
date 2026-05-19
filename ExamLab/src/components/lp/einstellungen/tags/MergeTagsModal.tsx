/**
 * MergeTagsModal — Mehrere Tags in einen Master-Tag mergen
 * (Cluster H Phase 2 C4b, admin-only).
 *
 * Backend-Vertrag: `apiMergeTags({ email, masterId, mergedIds })` re-writes
 * `tagIds` aller Fragen (Master bleibt erhalten, mergedIds werden gelöscht).
 *
 * Workflow:
 * 1. LP wählt aus den ausgewählten Tags den Master via Radio-Button.
 * 2. Anzeige der Verwendungs-Summe der zu mergenden (Nicht-Master-)Tags.
 * 3. Confirm → API-Call → entferneLokal für mergedIds → Re-Render mit
 *    Master + Toast.
 */
import { useMemo, useState } from 'react'
import { mergeTags } from '../../../../services/tagsApi'
import { useTagsStore } from '../../../../store/tagsStore'
import { useToastStore } from '@gymhofwil/shared'
import BaseDialog from '../../../ui/BaseDialog'
import Button from '../../../ui/Button'
import { TagFarbeChip } from './TagFarbeChip'

interface Props {
  email: string
  ausgewaehlteIds: string[]
  verwendungProTag: Map<string, number>
  onClose: () => void
  onErfolg: () => void
}

export function MergeTagsModal({ email, ausgewaehlteIds, verwendungProTag, onClose, onErfolg }: Props) {
  const getByIds = useTagsStore((s) => s.getByIds)
  const entferneLokal = useTagsStore((s) => s.entferneLokal)
  const toastAdd = useToastStore((s) => s.add)

  const tags = useMemo(() => getByIds(ausgewaehlteIds), [getByIds, ausgewaehlteIds])
  const [masterId, setMasterId] = useState<string>(() => tags[0]?.id ?? '')
  const [merged, setMerged] = useState(false)

  const master = tags.find((t) => t.id === masterId)
  const mergedIds = tags.filter((t) => t.id !== masterId).map((t) => t.id)
  const summeMerged = mergedIds.reduce((acc, id) => acc + (verwendungProTag.get(id) ?? 0), 0)

  const onMerge = async () => {
    if (!master || mergedIds.length === 0 || merged) return
    setMerged(true)
    try {
      const result = await mergeTags({ email, masterId: master.id, mergedIds })
      // mergedIds aus Lokal-Cache entfernen
      for (const id of mergedIds) entferneLokal(id)
      toastAdd(
        'success',
        `${mergedIds.length} Tags auf „${master.name}" gemerged${
          result.fragenAktualisiert ? ` — ${result.fragenAktualisiert} Fragen aktualisiert` : ''
        }.`,
      )
      onErfolg()
    } catch (e) {
      toastAdd('error', `Mergen fehlgeschlagen: ${String(e)}`)
      setMerged(false)
    }
  }

  return (
    <BaseDialog
      open
      onClose={onClose}
      title="Tags zusammenführen"
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={merged}>Abbrechen</Button>
          <Button
            variant="danger"
            onClick={() => void onMerge()}
            disabled={!master || mergedIds.length === 0}
            loading={merged}
          >
            Zusammenführen
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Wähle den <strong>Master-Tag</strong>. Alle anderen ausgewählten Tags werden gelöscht;
          ihre Frage-Referenzen werden auf den Master umgehängt.
        </p>

        <ul className="space-y-1 rounded border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
          {tags.map((tag) => {
            const verwendung = verwendungProTag.get(tag.id) ?? 0
            const istMaster = tag.id === masterId
            return (
              <li key={tag.id} className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800">
                <input
                  type="radio"
                  name="merge-master"
                  checked={istMaster}
                  onChange={() => setMasterId(tag.id)}
                  className="border-slate-300 dark:border-slate-600"
                  aria-label={`${tag.name} als Master wählen`}
                />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <TagFarbeChip farbe={tag.farbe} label={tag.name} size="sm" />
                  {istMaster && (
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-300">Master</span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {verwendung} {verwendung === 1 ? 'Frage' : 'Fragen'}
                </span>
              </li>
            )
          })}
        </ul>

        {master && mergedIds.length > 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>{summeMerged}</strong> {summeMerged === 1 ? 'Frage wird' : 'Fragen werden'} auf
            „<strong>{master.name}</strong>" umgehängt.
            {' '}{mergedIds.length} Tag{mergedIds.length === 1 ? '' : 's'} {mergedIds.length === 1 ? 'wird' : 'werden'} gelöscht.
          </p>
        )}
      </div>
    </BaseDialog>
  )
}
