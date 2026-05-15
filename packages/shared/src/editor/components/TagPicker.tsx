/**
 * TagPicker — Combobox-Stil (Cluster H Phase 2 B2 + 15.05.2026 UX-Refactor):
 * Selektierte Tags als entfernbare Chips/Pills, dahinter ein Such-Input. Beim
 * Fokus/Tippen klappt ein Dropdown mit gefilterten Vorschlägen auf. Quick-Erstellen
 * via Enter oder explizitem „+ X anlegen"-Eintrag im Dropdown. Klick ausserhalb
 * oder Esc schliesst das Dropdown.
 *
 * Wichtig: Lebt in `packages/shared/`, darf KEINE direkten Imports aus
 * `ExamLab/src/` machen (reverse dependency = Build-Bruch). useClickOutside
 * ist deshalb inline implementiert (~8 Z. useEffect mit document-Listener).
 *
 * `FARBE_KLASSEN` ist hier inline dupliziert (auch in `TagFarbeChip`). Plan-Phase-
 * Empfehlung Cluster H: Duplikat akzeptieren (8 Z., semantisch eindeutig).
 */
import { useState, useMemo, useRef, useEffect } from 'react'
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
  const [offen, setOffen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Click-outside + Esc schliessen Dropdown.
  useEffect(() => {
    if (!offen) return
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOffen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [offen])

  const tagById = useMemo(() => {
    const map = new Map<string, Tag>()
    alleTags.forEach((t) => map.set(t.id, t))
    return map
  }, [alleTags])

  const selektierteTags = useMemo(
    () => tagIds.map((id) => tagById.get(id)).filter((t): t is Tag => !!t),
    [tagIds, tagById],
  )

  const gefiltert = useMemo(() => {
    const q = suche.toLowerCase().trim()
    const liste = alleTags.filter((t) => !tagIds.includes(t.id) && (q ? t.name.toLowerCase().includes(q) : true))
    return [...liste].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
  }, [alleTags, suche, tagIds])

  const exakterTreffer = useMemo(() => {
    const q = suche.toLowerCase().trim()
    if (!q) return null
    return alleTags.find((t) => t.name.toLowerCase() === q) ?? null
  }, [alleTags, suche])

  const maxErreicht = tagIds.length >= maxTags

  function addTag(id: string) {
    if (tagIds.includes(id) || maxErreicht) return
    onChange([...tagIds, id])
    setSuche('')
    // Fokus bleibt im Input — User kann sofort den nächsten Tag tippen.
    inputRef.current?.focus()
  }

  function removeTag(id: string) {
    onChange(tagIds.filter((tid) => tid !== id))
  }

  async function handleQuickErstellen() {
    if (!suche.trim() || creating || maxErreicht) return
    setCreating(true)
    try {
      const neuerTag = await onErstelleNeu(suche.trim())
      if (!tagIds.includes(neuerTag.id) && !maxErreicht) {
        onChange([...tagIds, neuerTag.id])
      }
      setSuche('')
      inputRef.current?.focus()
    } finally {
      setCreating(false)
    }
  }

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (exakterTreffer && !tagIds.includes(exakterTreffer.id)) {
        addTag(exakterTreffer.id)
      } else if (suche.trim() && !exakterTreffer) {
        void handleQuickErstellen()
      }
    } else if (e.key === 'Backspace' && !suche && tagIds.length > 0) {
      // Backspace bei leerem Input entfernt den letzten Chip.
      onChange(tagIds.slice(0, -1))
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Chip-Zeile + Input — alles in einer flex-wrap-Reihe */}
      <div
        onClick={() => { inputRef.current?.focus(); setOffen(true) }}
        className="flex flex-wrap items-center gap-1 min-h-[38px] px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 cursor-text"
      >
        {selektierteTags.map((t) => (
          <span
            key={t.id}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${FARBE_KLASSEN[t.farbe]}`}
          >
            {t.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(t.id) }}
              aria-label={`Tag ${t.name} entfernen`}
              className="ml-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full px-1 cursor-pointer leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={suche}
          onChange={(e) => { setSuche(e.target.value); setOffen(true) }}
          onFocus={() => setOffen(true)}
          onKeyDown={handleInputKey}
          placeholder={selektierteTags.length === 0 ? 'Tag suchen oder neu anlegen…' : ''}
          disabled={maxErreicht && !suche}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm py-0.5 disabled:cursor-not-allowed"
        />
      </div>

      {/* Dropdown */}
      {offen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 shadow-lg">
          {gefiltert.length === 0 && !suche.trim() && (
            <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
              Keine weiteren Tags verfügbar.
            </p>
          )}
          {gefiltert.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addTag(t.id)}
              disabled={maxErreicht}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${FARBE_KLASSEN[t.farbe]}`}>
                {t.name}
              </span>
            </button>
          ))}
          {!exakterTreffer && suche.trim() && (
            <button
              type="button"
              onClick={() => void handleQuickErstellen()}
              disabled={creating || maxErreicht}
              className="w-full px-3 py-1.5 text-sm text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-left disabled:opacity-50 disabled:cursor-not-allowed border-t border-slate-200 dark:border-slate-700"
            >
              + „{suche.trim()}" anlegen
            </button>
          )}
        </div>
      )}

      {maxErreicht && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          Maximal {maxTags} Tags pro Frage erreicht.
        </p>
      )}
    </div>
  )
}
