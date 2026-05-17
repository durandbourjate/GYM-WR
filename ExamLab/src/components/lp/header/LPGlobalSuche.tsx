import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSucheIndex } from '../../../hooks/useSucheIndex'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useKeyboardNavigation } from '../../../hooks/useKeyboardNavigation'
import { useClickOutside } from '../../../hooks/useClickOutside'
import { fuehreSucheAus } from '../../../utils/sucheEngine'
import { SAMMELVIEW_ROUTE_BUILDERS } from '../../../utils/sucheAdapter'
import { QUELLEN_REIHENFOLGE } from '../../../types/suche'
import type { SucheTreffer, SucheQuelle } from '../../../types/suche'
import { QuellSektion, EmptyState } from '../../shared/header/sucheUI'

const DEBOUNCE_MS = 300

/**
 * LP-spezifische globale Suche im App-Header (Cluster C).
 * Sucht über 6 Quellen: Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen.
 * SuS-Pfad nutzt weiterhin die bestehende `GlobalSuche` dumb-Komponente (Scope-Guard).
 */
export function LPGlobalSuche() {
  const [query, setQuery] = useState('')
  const [istOffen, setIstOffen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const index = useSucheIndex()

  const ergebnis = useMemo(() => fuehreSucheAus(debouncedQuery, index), [debouncedQuery, index])

  // Cmd+K / Ctrl+K — fokussiert Input (Pattern aus alter GlobalSuche)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Click-Outside schliesst Dropdown
  const closeDropdown = useCallback(() => setIstOffen(false), [])
  useClickOutside(containerRef, closeDropdown)

  const trefferKlick = useCallback(
    (t: SucheTreffer) => {
      navigate(t.navigation.route)
      setIstOffen(false)
      setQuery('')
    },
    [navigate],
  )

  const alleAnzeigen = useCallback(
    (q: SucheQuelle) => {
      navigate(SAMMELVIEW_ROUTE_BUILDERS[q](debouncedQuery))
      setIstOffen(false)
      setQuery('')
    },
    [navigate, debouncedQuery],
  )

  const { activeIndex, handleKeyDown, reset: resetActiveIndex } = useKeyboardNavigation({
    itemCount: ergebnis.treffer.length,
    onEnter: (idx) => {
      const t = ergebnis.treffer[idx]
      if (t) trefferKlick(t)
    },
    onEscape: () => setIstOffen(false),
  })

  // Reset activeIndex bei Query-Change
  useEffect(() => {
    resetActiveIndex()
  }, [debouncedQuery, resetActiveIndex])

  let flatOffset = 0

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIstOffen(true)
          }}
          onFocus={() => setIstOffen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Suche …"
          className="w-64 pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          aria-label="Globale Suche"
        />
      </div>

      {istOffen && debouncedQuery.length >= 2 && (
        <div className="absolute top-full mt-1 right-0 w-96 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 z-50">
          {ergebnis.treffer.length === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            QUELLEN_REIHENFOLGE.map((quelle) => {
              const sektion = ergebnis.treffer.filter((t) => t.quelle === quelle)
              if (sektion.length === 0) return null
              const offset = flatOffset
              flatOffset += sektion.length
              return (
                <QuellSektion
                  key={quelle}
                  quelle={quelle}
                  treffer={sektion}
                  gesamtCount={ergebnis.proQuelleGesamt[quelle]}
                  activeFlatIndex={activeIndex}
                  flatOffset={offset}
                  onTrefferKlick={trefferKlick}
                  onAlleAnzeigen={alleAnzeigen}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
