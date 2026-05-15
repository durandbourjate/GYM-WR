/**
 * TagsListe — Hauptansicht der Tag-Verwaltung (Cluster H Phase 2 C3).
 *
 * Pragmatische Variante (siehe Sub-Task C Hinweise):
 * - Inline-Action-Buttons statt 3-Punkte-Menu (Edit, Mergen-Modus-Toggle,
 *   Archivieren, Hard-Delete) — reduziert UI-Komplexität ohne semantischen
 *   Verlust.
 * - „Mergen starten"-Button (admin-only) wechselt in einen Multi-Select-Modus
 *   mit Checkboxen je Zeile + Floating-Bar oben mit „Mergen…"-Button, der
 *   das MergeTagsModal öffnet. Admin definiert dort den Master.
 * - Hard-Delete-Button nur sichtbar wenn `verwendung === 0`.
 *
 * Verwendungs-Anzahl: clientseitig aus `fragensammlungStore.summaries.tagIds`.
 */
import { useMemo, useState } from 'react'
import { Archive, Edit2, Trash2, Combine, X } from 'lucide-react'
import { useTagsStore } from '../../../../store/tagsStore'
import { useFragensammlungStore } from '../../../../store/fragensammlungStore'
import { useToastStore } from '../../../../store/toastStore'
import { archiviereTag, hardDeleteTag } from '../../../../services/tagsApi'
import type { Tag } from '@shared/types/tag'
import { TagFarbeChip } from './TagFarbeChip'
import { TagEditModal } from './TagEditModal'
import { MergeTagsModal } from './MergeTagsModal'
import BaseDialog from '../../../ui/BaseDialog'
import Button from '../../../ui/Button'

interface Props {
  email: string
  istAdmin: boolean
  zeigeArchivierte: boolean
  onToggleArchivierte: (next: boolean) => void
}

export function TagsListe({ email, istAdmin, zeigeArchivierte, onToggleArchivierte }: Props) {
  const tags = useTagsStore((s) => s.tags)
  const upsertLokal = useTagsStore((s) => s.upsertLokal)
  const entferneLokal = useTagsStore((s) => s.entferneLokal)
  const summaries = useFragensammlungStore((s) => s.summaries)
  const toastAdd = useToastStore((s) => s.add)

  const [suche, setSuche] = useState('')
  const [editTag, setEditTag] = useState<Tag | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState<Tag | null>(null)
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<Tag | null>(null)
  const [mergeMode, setMergeMode] = useState(false)
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set())
  const [mergeModalOffen, setMergeModalOffen] = useState(false)

  // Verwendungs-Zähler je Tag-ID (clientseitig aus Summaries).
  const verwendungProTag = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of summaries) {
      if (!s.tagIds) continue
      for (const id of s.tagIds) map.set(id, (map.get(id) ?? 0) + 1)
    }
    return map
  }, [summaries])

  const sichtbareTags = useMemo(() => {
    const lower = suche.trim().toLowerCase()
    return tags
      .filter((t) => (lower ? t.name.toLowerCase().includes(lower) : true))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
  }, [tags, suche])

  // Mergen-Modus Helpers
  const toggleAuswahl = (id: string) => {
    setAuswahl((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const beendeMergeModus = () => {
    setMergeMode(false)
    setAuswahl(new Set())
  }

  const onArchivieren = async (tag: Tag) => {
    setArchiveConfirm(null)
    // Optimistic remove
    entferneLokal(tag.id)
    try {
      await archiviereTag({ email, id: tag.id })
      toastAdd('success', `Tag „${tag.name}" archiviert.`)
    } catch (e) {
      // Rollback
      upsertLokal(tag)
      toastAdd('error', `Archivieren fehlgeschlagen: ${String(e)}`)
    }
  }

  const onHardDelete = async (tag: Tag) => {
    setHardDeleteConfirm(null)
    entferneLokal(tag.id)
    try {
      await hardDeleteTag({ email, id: tag.id })
      toastAdd('success', `Tag „${tag.name}" endgültig gelöscht.`)
    } catch (e) {
      upsertLokal(tag)
      toastAdd('error', `Löschen fehlgeschlagen: ${String(e)}`)
    }
  }

  return (
    <div className="space-y-3">
      {/* Top-Leiste: Suche + Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Tag suchen…"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          className="flex-1 min-w-[160px] px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {istAdmin && (
          <label className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={zeigeArchivierte}
              onChange={(e) => onToggleArchivierte(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            Archivierte zeigen
          </label>
        )}
        {istAdmin && !mergeMode && (
          <Button variant="secondary" size="sm" icon={<Combine className="w-4 h-4" />} onClick={() => setMergeMode(true)}>
            Mergen…
          </Button>
        )}
      </div>

      {/* Floating-Bar im Mergen-Modus */}
      {mergeMode && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-violet-300 dark:border-violet-600
                        bg-violet-50 dark:bg-violet-900/30 px-3 py-2 text-sm text-violet-800 dark:text-violet-100">
          <span>{auswahl.size} ausgewählt — wähle ≥ 2 Tags und klicke „Mergen…"</span>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={auswahl.size < 2}
              onClick={() => setMergeModalOffen(true)}
            >
              Mergen…
            </Button>
            <Button variant="ghost" size="sm" icon={<X className="w-4 h-4" />} onClick={beendeMergeModus}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Tag-Liste */}
      {sichtbareTags.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {suche ? 'Keine Tags entsprechen der Suche.' : 'Noch keine Tags vorhanden.'}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded border border-slate-200 dark:border-slate-700">
          {sichtbareTags.map((tag) => {
            const verwendung = verwendungProTag.get(tag.id) ?? 0
            const ausgewaehlt = auswahl.has(tag.id)
            return (
              <li
                key={tag.id}
                className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {mergeMode && (
                  <input
                    type="checkbox"
                    checked={ausgewaehlt}
                    onChange={() => toggleAuswahl(tag.id)}
                    className="rounded border-slate-300 dark:border-slate-600"
                    aria-label={`${tag.name} für Merge auswählen`}
                  />
                )}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <TagFarbeChip farbe={tag.farbe} label={tag.name} size="sm" />
                  {tag.archiviert && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">(archiviert)</span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {verwendung} {verwendung === 1 ? 'Frage' : 'Fragen'}
                </span>

                {!mergeMode && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditTag(tag)}
                      className="p-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100
                                 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700"
                      title="Umbenennen / Farbe ändern"
                      aria-label={`${tag.name} bearbeiten`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {istAdmin && !tag.archiviert && (
                      <button
                        type="button"
                        onClick={() => setArchiveConfirm(tag)}
                        className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50
                                   dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30"
                        title="Archivieren"
                        aria-label={`${tag.name} archivieren`}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    {istAdmin && verwendung === 0 && (
                      <button
                        type="button"
                        onClick={() => setHardDeleteConfirm(tag)}
                        className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50
                                   dark:text-slate-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                        title="Endgültig löschen"
                        aria-label={`${tag.name} endgültig löschen`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Edit-Modal */}
      {editTag && (
        <TagEditModal
          email={email}
          tag={editTag}
          onClose={() => setEditTag(null)}
        />
      )}

      {/* Archivieren-Confirm */}
      <BaseDialog
        open={Boolean(archiveConfirm)}
        onClose={() => setArchiveConfirm(null)}
        title="Tag archivieren?"
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setArchiveConfirm(null)}>Abbrechen</Button>
            <Button
              variant="danger"
              onClick={() => { if (archiveConfirm) void onArchivieren(archiveConfirm) }}
            >
              Archivieren
            </Button>
          </>
        }
      >
        {archiveConfirm && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tag „<strong>{archiveConfirm.name}</strong>" wird ausgeblendet, bleibt aber an
            bestehenden Fragen referenziert. Aktion kann durch erneutes Laden mit „Archivierte zeigen"
            rückgängig gemacht werden.
          </p>
        )}
      </BaseDialog>

      {/* Hard-Delete-Confirm */}
      <BaseDialog
        open={Boolean(hardDeleteConfirm)}
        onClose={() => setHardDeleteConfirm(null)}
        title="Tag endgültig löschen?"
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setHardDeleteConfirm(null)}>Abbrechen</Button>
            <Button
              variant="danger"
              onClick={() => { if (hardDeleteConfirm) void onHardDelete(hardDeleteConfirm) }}
            >
              Endgültig löschen
            </Button>
          </>
        }
      >
        {hardDeleteConfirm && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tag „<strong>{hardDeleteConfirm.name}</strong>" wird unwiderruflich gelöscht.
            Da dieser Tag aktuell in keiner Frage verwendet wird, ist die Aktion sicher.
          </p>
        )}
      </BaseDialog>

      {/* Merge-Modal */}
      {mergeModalOffen && auswahl.size >= 2 && (
        <MergeTagsModal
          email={email}
          ausgewaehlteIds={Array.from(auswahl)}
          verwendungProTag={verwendungProTag}
          onClose={() => setMergeModalOffen(false)}
          onErfolg={() => {
            setMergeModalOffen(false)
            beendeMergeModus()
          }}
        />
      )}
    </div>
  )
}
