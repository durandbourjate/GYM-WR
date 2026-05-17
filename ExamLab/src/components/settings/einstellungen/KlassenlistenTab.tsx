import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useKlassenlistenStore } from '../../../store/klassenlistenStore'
import { useAuthStore } from '../../../store/authStore'
import { useTestdatenSichtbar } from '../../../hooks/useTestdatenSichtbar'
import { filtereTestdatenWennDeaktiviert } from '../../../utils/testdaten/filter'
import { normalizeForSuche } from '../../../utils/sucheEngine'

/**
 * Klassenlisten-Tab in EinstellungenPanel (Cluster C.2 / löst F.4 OoS auf).
 *
 * Daten aus klassenlistenStore (LP-only). Bei Mount mit `ladeStatus === 'idle'`
 * triggert lade(email). URL-Pre-Fill via `?suche=<term>` (analog Cluster C.3
 * Pattern); zusätzlich `?schueler=<email>` highlightet eine bestimmte Zeile.
 */
export default function KlassenlistenTab() {
  const eintraege = useKlassenlistenStore(s => s.daten)
  const ladeStatus = useKlassenlistenStore(s => s.ladeStatus)
  const lade = useKlassenlistenStore(s => s.lade)
  const email = useAuthStore(s => s.user?.email)
  const testdatenSichtbar = useTestdatenSichtbar()

  const [searchParams, setSearchParams] = useSearchParams()
  const [suchtext, setSuchtext] = useState(searchParams.get('suche') ?? '')
  const [filterKlasse, setFilterKlasse] = useState('')
  const initialSchueler = searchParams.get('schueler')
  const lastSeenSucheParam = useRef<string | null>(null)
  const highlightRef = useRef<HTMLTableRowElement | null>(null)

  // Pre-Fill aus URL + Cleanup (?suche= entfernen, ?schueler= behalten für Highlight)
  useEffect(() => {
    const s = searchParams.get('suche')
    if (!s || s === lastSeenSucheParam.current) return
    lastSeenSucheParam.current = s
    setSuchtext(s)
    const next = new URLSearchParams(searchParams)
    next.delete('suche')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // Lazy-Load bei Mount
  useEffect(() => {
    if (ladeStatus === 'idle' && email) lade(email)
  }, [ladeStatus, email, lade])

  // Schüler-Highlight scrollIntoView (nach Render mit Daten)
  useEffect(() => {
    if (initialSchueler && highlightRef.current && typeof highlightRef.current.scrollIntoView === 'function') {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [initialSchueler, eintraege])

  const verfuegbareKlassen = useMemo(() => {
    if (!eintraege) return []
    const klassen = new Set(eintraege.map(e => e.klasse))
    return Array.from(klassen).sort()
  }, [eintraege])

  const gefiltert = useMemo(() => {
    if (!eintraege) return []
    const sichtbar = filtereTestdatenWennDeaktiviert(eintraege, testdatenSichtbar)
    const n = normalizeForSuche(suchtext)
    return sichtbar.filter(e => {
      if (filterKlasse && e.klasse !== filterKlasse) return false
      if (!n) return true
      return (
        normalizeForSuche(`${e.vorname} ${e.name}`).includes(n) ||
        normalizeForSuche(e.email).includes(n) ||
        normalizeForSuche(e.klasse).includes(n)
      )
    })
  }, [eintraege, suchtext, filterKlasse, testdatenSichtbar])

  if (ladeStatus !== 'fertig') {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input
          type="search"
          placeholder="Suche Schüler/E-Mail/Klasse …"
          value={suchtext}
          onChange={e => setSuchtext(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700"
        />
        <select
          value={filterKlasse}
          onChange={e => setFilterKlasse(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700"
        >
          <option value="">Alle Klassen</option>
          {verfuegbareKlassen.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{gefiltert.length} von {eintraege?.length ?? 0} Schüler/innen</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-left">
            <tr>
              <th className="px-3 py-2">Vorname</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">E-Mail</th>
              <th className="px-3 py-2">Klasse</th>
              <th className="px-3 py-2">Kurs</th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map(e => {
              const isHighlight = !!initialSchueler && e.email === initialSchueler
              return (
                <tr
                  key={e.email}
                  ref={isHighlight ? highlightRef : undefined}
                  className={`border-t border-slate-200 dark:border-slate-700 ${isHighlight ? 'bg-violet-100 dark:bg-violet-900/30' : ''}`}
                >
                  <td className="px-3 py-2">{e.vorname}</td>
                  <td className="px-3 py-2">{e.name}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{e.email}</td>
                  <td className="px-3 py-2">{e.klasse}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{e.kurs ?? ''}</td>
                </tr>
              )
            })}
            {gefiltert.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500 italic">Keine Schüler/innen mit aktuellem Filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
