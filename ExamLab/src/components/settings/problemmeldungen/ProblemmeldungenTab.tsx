import { useState, useEffect, useCallback } from 'react'
import type { Problemmeldung } from '../../../types/problemmeldung'
import type { FilterConfig } from './filterLogik'
import { filterMeldungen } from './filterLogik'
import { listeProblemmeldungen, toggleProblemmeldung } from '../../../services/problemmeldungenApi'
import ProblemmeldungenFilter from './ProblemmeldungenFilter'
import ProblemmeldungZeile from './ProblemmeldungZeile'
import { useDeepLink } from './useDeepLink'

interface Props {
  email: string
  istAdmin: boolean
  onSchliessen: () => void
}

export default function ProblemmeldungenTab({ email, istAdmin, onSchliessen }: Props) {
  const [meldungen, setMeldungen] = useState<Problemmeldung[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterConfig>({
    status: 'offen',
    typ: 'alle',
    nurMeine: false,
  })

  const oeffneDeepLink = useDeepLink(onSchliessen)

  useEffect(() => {
    let abgebrochen = false
    listeProblemmeldungen(email)
      .then(data => { if (!abgebrochen) setMeldungen(data) })
      .catch(e => { if (!abgebrochen) setFehler(String(e?.message || e)) })
    return () => { abgebrochen = true }
  }, [email])

  const toggleErledigt = useCallback(async (id: string, neuerWert: boolean) => {
    // Optimistisches Update
    setMeldungen(prev => prev ? prev.map(m => m.id === id ? { ...m, erledigt: neuerWert } : m) : prev)
    const ok = await toggleProblemmeldung(email, id, neuerWert)
    if (!ok) {
      // Revert bei Fehler
      setMeldungen(prev => prev ? prev.map(m => m.id === id ? { ...m, erledigt: !neuerWert } : m) : prev)
      setFehler('Toggle fehlgeschlagen. Bitte erneut versuchen.')
      setTimeout(() => setFehler(null), 3000)
    }
  }, [email])

  if (fehler && meldungen === null) {
    return <div className="p-4 text-sm text-red-600 dark:text-red-400">Fehler beim Laden: {fehler}</div>
  }
  if (meldungen === null) {
    return <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Lade Meldungen…</div>
  }

  const gefiltert = filterMeldungen(meldungen, filter)

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">
        Problemmeldungen
      </h3>
      {fehler && <div className="mb-3 p-2 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">{fehler}</div>}
      <ProblemmeldungenFilter
        config={filter}
        onChange={patch => setFilter(prev => ({ ...prev, ...patch }))}
        istAdmin={istAdmin}
      />
      {gefiltert.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">
          {meldungen.length === 0 ? 'Keine Meldungen vorhanden.' : 'Keine Meldungen passen zum Filter.'}
        </p>
      ) : (
        gefiltert.map(m => (
          <ProblemmeldungZeile
            key={m.id}
            meldung={m}
            toggleErledigt={toggleErledigt}
            onOeffne={oeffneDeepLink}
            istAdmin={istAdmin}
          />
        ))
      )}
    </div>
  )
}
