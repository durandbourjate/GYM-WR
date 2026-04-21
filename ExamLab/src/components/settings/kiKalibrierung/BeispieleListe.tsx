import { useState, useEffect } from 'react'
import { kalibrierungApi, type KIFeedbackEintragLP } from '../../../services/kalibrierungApi'

type Filter = {
  aktion?: string
  fachbereich?: string
  status?: string
  nurWichtige?: boolean
  von?: string
  bis?: string
}

const AKTION_LABELS: Record<string, string> = {
  generiereMusterloesung: 'Musterlösung',
  klassifiziereFrage: 'Klassifikation',
  bewertungsrasterGenerieren: 'Bewertungsraster',
  korrigiereFreitext: 'Freitext-Korrektur',
}

export default function BeispieleListe({ email }: { email: string }) {
  const [eintraege, setEintraege] = useState<KIFeedbackEintragLP[]>([])
  const [gesamt, setGesamt] = useState(0)
  const [seite, setSeite] = useState(0)
  const [filter, setFilter] = useState<Filter>({ status: 'qualifiziert' })
  const [lade, setLade] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    setLade(true)
    setFehler(null)
    // status='qualifiziert' wird Frontend-seitig nachgefiltert (Backend kennt den Status nicht)
    const backendFilter: Record<string, unknown> = { ...filter }
    if (filter.status === 'qualifiziert') delete backendFilter.status
    kalibrierungApi.listeFeedbacks(email, backendFilter, seite, 50)
      .then(r => {
        if (!r) { setFehler('Liste konnte nicht geladen werden'); return }
        setEintraege(r.eintraege)
        setGesamt(r.gesamt)
      })
      .catch(() => setFehler('Netzwerkfehler beim Laden'))
      .finally(() => setLade(false))
  }, [email, filter, seite])

  // Frontend-nachfiltern für status='qualifiziert'
  const angezeigt = filter.status === 'qualifiziert'
    ? eintraege.filter(e => e.qualifiziert && e.aktiv)
    : eintraege

  const seitenZahl = Math.max(1, Math.ceil(gesamt / 50))

  function getVorschau(e: KIFeedbackEintragLP): string {
    const input = e.inputJson
    const ft = typeof input.fragetext === 'string' ? input.fragetext : ''
    return ft.length > 60 ? ft.slice(0, 60) + '…' : (ft || '—')
  }

  return (
    <div className="space-y-3">
      {/* Filter-Leiste */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
        <select value={filter.aktion ?? ''}
          onChange={e => { setFilter(f => ({ ...f, aktion: e.target.value || undefined })); setSeite(0) }}
          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm">
          <option value="">Alle Aktionen</option>
          {Object.entries(AKTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select value={filter.fachbereich ?? ''}
          onChange={e => { setFilter(f => ({ ...f, fachbereich: e.target.value || undefined })); setSeite(0) }}
          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm">
          <option value="">Alle Fächer</option>
          <option value="VWL">VWL</option>
          <option value="BWL">BWL</option>
          <option value="Recht">Recht</option>
          <option value="Informatik">Informatik</option>
        </select>

        <select value={filter.status ?? 'qualifiziert'}
          onChange={e => { setFilter(f => ({ ...f, status: e.target.value || undefined })); setSeite(0) }}
          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm">
          <option value="">Alle</option>
          <option value="qualifiziert">Qualifiziert</option>
          <option value="geschlossen">Geschlossen</option>
          <option value="ignoriert">Verworfen</option>
          <option value="offen">Offen</option>
        </select>

        <label className="flex items-center gap-1 text-sm dark:text-slate-200">
          <input type="checkbox" checked={filter.nurWichtige ?? false}
            onChange={e => { setFilter(f => ({ ...f, nurWichtige: e.target.checked })); setSeite(0) }} />
          nur &#x2B50;
        </label>

        <input type="date" value={filter.von ?? ''}
          onChange={e => { setFilter(f => ({ ...f, von: e.target.value || undefined })); setSeite(0) }}
          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm"
          title="Von-Datum" />
        <input type="date" value={filter.bis ?? ''}
          onChange={e => { setFilter(f => ({ ...f, bis: e.target.value || undefined })); setSeite(0) }}
          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm"
          title="Bis-Datum" />
      </div>

      {/* Status-Zeile */}
      {lade && <p className="text-sm text-slate-500 dark:text-slate-400">Lädt…</p>}
      {fehler && <p className="text-sm text-red-500">{fehler}</p>}

      {/* Tabelle */}
      {!lade && !fehler && (
        <>
          {angezeigt.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
              Keine Einträge gefunden mit den aktuellen Filtern.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-2 font-medium">Datum</th>
                    <th className="py-2 pr-2 font-medium">Aktion</th>
                    <th className="py-2 pr-2 font-medium">Fach/Bloom</th>
                    <th className="py-2 pr-2 font-medium">Vorschau</th>
                    <th className="py-2 pr-2 font-medium">Diff</th>
                    <th className="py-2 pr-2 font-medium">Status</th>
                    <th className="py-2 pr-2 font-medium">&#x2B50;</th>
                    <th className="py-2 pr-2 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {angezeigt.map(e => (
                    <tr key={e.feedbackId} className={`border-b border-slate-100 dark:border-slate-700 ${e.aktiv ? '' : 'opacity-50'}`}>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {new Date(e.zeitstempel).toLocaleDateString('de-CH')}
                      </td>
                      <td className="py-2 pr-2">
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 dark:text-slate-200">
                          {AKTION_LABELS[e.aktion] ?? e.aktion}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {e.fachbereich}{e.bloom ? ' · ' + e.bloom : ''}
                      </td>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-200 max-w-xs truncate">
                        {getVorschau(e)}
                      </td>
                      <td className="py-2 pr-2 text-xs text-slate-500 dark:text-slate-400">
                        {typeof e.diffScore === 'number' ? e.diffScore.toFixed(2) : '—'}
                      </td>
                      <td className="py-2 pr-2 text-xs">
                        <span className="dark:text-slate-300">{e.status}</span>
                      </td>
                      <td className="py-2 pr-2">
                        {e.wichtig ? '★' : ''}
                      </td>
                      <td className="py-2 pr-2 text-xs text-slate-400 italic">
                        (Task 20b)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {gesamt} Einträge · Seite {seite + 1} / {seitenZahl}
            </span>
            <div className="flex gap-1">
              <button disabled={seite === 0} onClick={() => setSeite(s => s - 1)}
                className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200">
                &#x2039;
              </button>
              <button disabled={(seite + 1) >= seitenZahl} onClick={() => setSeite(s => s + 1)}
                className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200">
                &#x203A;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
