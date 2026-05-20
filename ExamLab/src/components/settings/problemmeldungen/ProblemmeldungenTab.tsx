import { useState, useEffect, useCallback } from 'react'
import type { Problemmeldung } from '../../../types/problemmeldung'
import type { FilterConfig } from './filterLogik'
import { filterMeldungen } from './filterLogik'
import { listeProblemmeldungen, toggleProblemmeldung, loescheProblemmeldung } from '../../../services/problemmeldungenApi'
import ProblemmeldungenFilter from './ProblemmeldungenFilter'
import ProblemmeldungZeile from './ProblemmeldungZeile'
import { useDeepLink } from './useDeepLink'
import { optimisticDelete } from '../../../utils/optimisticDelete'
import { useToast } from '@gymhofwil/shared'
import { TYPO } from '../../../styles/typografie'
import { TabStarToggle } from '../../lp/TabStarToggle'

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
  const [loeschKandidat, setLoeschKandidat] = useState<Problemmeldung | null>(null)
  const toast = useToast()

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

  const bestaetigeLoeschen = useCallback(async () => {
    if (!loeschKandidat) return
    const meldung = loeschKandidat
    setLoeschKandidat(null)
    await optimisticDelete({
      optimisticRemove: () => setMeldungen(prev => prev ? prev.filter(m => m.id !== meldung.id) : prev),
      backendCall: () => loescheProblemmeldung(email, meldung.id),
      rollback: () => setMeldungen(prev => prev ? [meldung, ...prev] : prev),
      onSuccess: () => toast.success('Problemmeldung gelöscht'),
      onError: () => toast.error('Konnte nicht gelöscht werden — bitte erneut versuchen'),
    })
  }, [loeschKandidat, email, toast])

  // Header bleibt in allen Pfaden sichtbar (Cluster E.4: TabStarToggle darf nicht in Early-Returns versteckt sein)
  const header = (
    <div className="flex items-center justify-between mb-4">
      <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100`}>
        Problemmeldungen
      </h2>
      <TabStarToggle tabId="problemmeldungen" surface="einstellungen" label="Problemmeldungen" />
    </div>
  )

  if (fehler && meldungen === null) {
    return (
      <div>
        {header}
        <div className="p-4 text-sm text-red-600 dark:text-red-400">Fehler beim Laden: {fehler}</div>
      </div>
    )
  }
  if (meldungen === null) {
    return (
      <div>
        {header}
        <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Lade Meldungen…</div>
      </div>
    )
  }

  const gefiltert = filterMeldungen(meldungen, filter)

  return (
    <div>
      {header}
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
            onLoeschen={istAdmin ? setLoeschKandidat : undefined}
            istAdmin={istAdmin}
          />
        ))
      )}
      {loeschKandidat && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
          onClick={() => setLoeschKandidat(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Problemmeldung löschen?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Diese Aktion ist nicht rückgängig zu machen. Die Meldung wird endgültig aus dem Sheet entfernt.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLoeschKandidat(null)}
                className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={bestaetigeLoeschen}
                className="px-3 py-1.5 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
