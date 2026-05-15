/**
 * TagPicker — Suchbarer Picker mit Quick-Erstellen für Tag-Objekt-Modell
 * (Cluster H Phase 2 B2).
 *
 * Wichtig: Lebt in `packages/shared/`, darf aber KEINE direkten Imports aus
 * `ExamLab/src/` machen (reverse dependency = Build-Bruch). Lösung:
 * Dependency-Injection — der Picker erhält `alleTags` und `onErstelleNeu`
 * als Props, die der Caller (in ExamLab) aus tagsStore + tagsApi zusammenbaut.
 *
 * `FARBE_KLASSEN` ist hier inline dupliziert (auch in `TagFarbeChip`).
 * Plan-Phase-Empfehlung: Duplikat akzeptieren (8 Z., semantisch eindeutig),
 * Refactor zu Shared-Helper bei weiteren Surfaces.
 */
import { useState, useMemo } from 'react'
import type { Tag, TagFarbe } from '../../types/tag'

const FARBE_KLASSEN: Record<TagFarbe, string> = {
  slate:   'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  red:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200',
  amber:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200',
  sky:     'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200',
  violet:  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200',
  pink:    'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200',
  stone:   'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200',
}

interface Props {
  tagIds: string[]
  onChange: (neueIds: string[]) => void
  /** Alle verfügbaren Tags (vom Caller aus tagsStore geliefert, nicht-archivierte) */
  alleTags: Tag[]
  /** Callback für Quick-Erstellen — Caller ruft tagsApi.erstelleTag + upsertLokal */
  onErstelleNeu: (name: string) => Promise<Tag>
  maxTags?: number
}

export function TagPicker({ tagIds, onChange, alleTags, onErstelleNeu, maxTags = 8 }: Props) {
  const [suche, setSuche] = useState('')
  const [creating, setCreating] = useState(false)

  const gefiltert = useMemo(() => {
    const q = suche.toLowerCase().trim()
    const liste = q ? alleTags.filter((t) => t.name.toLowerCase().includes(q)) : alleTags
    // Cluster H Phase 2 Polish P2: alphabetisch (de, case-insensitive) — Store-Reihenfolge ist sonst Insertion-Order.
    return [...liste].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
  }, [alleTags, suche])

  const exakterTreffer = gefiltert.find((t) => t.name.toLowerCase() === suche.toLowerCase().trim())
  const istBereitsAusgewaehlt = (id: string) => tagIds.includes(id)

  function toggleTag(id: string) {
    if (istBereitsAusgewaehlt(id)) {
      onChange(tagIds.filter((tid) => tid !== id))
    } else if (tagIds.length < maxTags) {
      onChange([...tagIds, id])
    }
  }

  async function handleQuickErstellen() {
    if (!suche.trim() || creating) return
    setCreating(true)
    try {
      const neuerTag = await onErstelleNeu(suche.trim())
      if (!istBereitsAusgewaehlt(neuerTag.id) && tagIds.length < maxTags) {
        onChange([...tagIds, neuerTag.id])
      }
      setSuche('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800">
      <input
        type="text"
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !exakterTreffer && suche.trim()) {
            e.preventDefault()
            handleQuickErstellen()
          }
        }}
        placeholder="Tag suchen oder neu anlegen..."
        className="w-full mb-2 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm"
      />
      <div className="max-h-48 overflow-y-auto">
        {gefiltert.map((t) => (
          <label
            key={t.id}
            className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={istBereitsAusgewaehlt(t.id)}
              onChange={() => toggleTag(t.id)}
              className="w-4 h-4"
            />
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${FARBE_KLASSEN[t.farbe]}`}>
              {t.name}
            </span>
          </label>
        ))}
        {!exakterTreffer && suche.trim() && (
          <button
            onClick={handleQuickErstellen}
            disabled={creating || tagIds.length >= maxTags}
            className="w-full px-2 py-1 text-sm text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-left"
          >
            + "{suche.trim()}" anlegen
          </button>
        )}
      </div>
      {tagIds.length >= maxTags && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Maximal {maxTags} Tags pro Frage erreicht.
        </p>
      )}
    </div>
  )
}
