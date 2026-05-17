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
import { useFragensammlungStore } from '../../../store/fragensammlungStore'
import { useAuthStore } from '../../../store/authStore'

const DEBOUNCE_MS = 300

/**
 * LP-spezifische globale Suche im App-Header (Cluster C).
 * Sucht über 6 Quellen: Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen.
 * SuS-Pfad nutzt weiterhin die bestehende `GlobalSuche` dumb-Komponente (Scope-Guard).
 */
export function LPGlobalSuche() {
  const [query, setQuery] = useState('')
  const [istOffen, setIstOffen] = useState(false)
  const [volltextAktiv, setVolltextAktiv] = useState(false)
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const index = useSucheIndex()

  // Volltext-Daten aus fragensammlungStore
  const fragenVoll = useFragensammlungStore(s => s.fragen)
  const sammlungStatus = useFragensammlungStore(s => s.status)
  const ladeAlleDetails = useFragensammlungStore(s => s.ladeAlleDetails)
  const email = useAuthStore(s => s.user?.email)

  const volltextLaedt = sammlungStatus === 'summary_laden' || sammlungStatus === 'detail_laden'
  // 'fertig' deckt auch den Fall ab, dass die LP-Sammlung leer ist (keine Re-Trigger-Schleife).
  const volltextBereit = fragenVoll.length > 0 || sammlungStatus === 'fertig'

  // Lazy-Load: nur triggern wenn Toggle AN, noch nicht geladen, nicht aktuell ladend, und LP-User.
  // `sammlungStatus` als Dep, weil ladeAlleDetails im Store frueh-returnt wenn status !== 'summary_fertig' —
  // bei status='idle' (App-Mount vor ladeSummaries) erneut feuern sobald status auf 'summary_fertig' wechselt.
  useEffect(() => {
    if (volltextAktiv && !volltextBereit && !volltextLaedt && sammlungStatus === 'summary_fertig' && email) {
      ladeAlleDetails(email)
    }
  }, [volltextAktiv, volltextBereit, volltextLaedt, sammlungStatus, email, ladeAlleDetails])

  const ergebnis = useMemo(
    () => fuehreSucheAus(
      debouncedQuery,
      { ...index, fragenVoll: volltextAktiv && volltextBereit ? fragenVoll : undefined },
      { volltext: volltextAktiv && volltextBereit },
    ),
    [debouncedQuery, index, volltextAktiv, volltextBereit, fragenVoll],
  )

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
      <div className="flex items-center gap-2">
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
        <button
          type="button"
          onClick={() => setVolltextAktiv((v) => !v)}
          aria-pressed={volltextAktiv}
          title="Sucht zusätzlich in Fragetext und Musterlösung. Langsamer."
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 ${
            volltextAktiv
              ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-200'
              : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Volltext
        </button>
      </div>

      {istOffen && debouncedQuery.length >= (volltextAktiv ? 3 : 2) && (
        <div className="absolute top-full mt-1 right-0 w-96 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 z-50">
          {volltextAktiv && volltextLaedt && (
            <div className="px-4 py-2 text-xs text-violet-600 dark:text-violet-300 border-b border-slate-200 dark:border-slate-700">
              Volltext wird vorbereitet …
            </div>
          )}
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
