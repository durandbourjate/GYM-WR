import { useState, useMemo } from 'react'
import type { SchuelerStatus } from '../../types/monitoring'
import type { PruefungsConfig } from '../../types/pruefung'
import { inaktivitaetsStufe } from '../../utils/phase'
import { useAuthStore } from '../../store/authStore'
import { apiService } from '../../services/apiService'
import ZusammenfassungsLeiste from './ZusammenfassungsLeiste'
import SusDetailPanel from './SusDetailPanel'
import BeendenDialog from './BeendenDialog'

type Sortierung = 'name' | 'klasse' | 'fortschritt' | 'status'
type QuickFilter = 'alle' | 'aktiv' | 'abgegeben' | 'nicht-erschienen'

interface Props {
  config: PruefungsConfig
  schuelerStatus: SchuelerStatus[]
  onBeenden: () => void
}

export default function AktivPhase({ config, schuelerStatus, onBeenden }: Props) {
  const user = useAuthStore((s) => s.user)
  const [sortierung, setSortierung] = useState<Sortierung>('name')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('alle')
  const [detailSus, setDetailSus] = useState<string | null>(null)
  const [zeigBeendenDialog, setZeigBeendenDialog] = useState(false)
  const [sebAusnahmenLokal, setSebAusnahmenLokal] = useState<Set<string>>(
    new Set(config.sebAusnahmen ?? [])
  )

  async function handleSebAusnahme(email: string): Promise<void> {
    if (!user) return
    const erfolg = await apiService.sebAusnahmeErlauben(config.id, user.email, email)
    if (erfolg) {
      setSebAusnahmenLokal((prev) => new Set(prev).add(email))
    }
  }

  const gefilterteSchueler = useMemo(() => {
    let liste = [...schuelerStatus]

    // Filter
    switch (quickFilter) {
      case 'aktiv':
        liste = liste.filter((s) => s.status === 'aktiv' || s.status === 'inaktiv')
        break
      case 'abgegeben':
        liste = liste.filter((s) => s.status === 'abgegeben' || s.status === 'beendet-lp')
        break
      case 'nicht-erschienen':
        liste = liste.filter((s) => s.status === 'nicht-gestartet')
        break
    }

    // Sortierung
    liste.sort((a, b) => {
      switch (sortierung) {
        case 'name': return (a.name || a.email).localeCompare(b.name || b.email)
        case 'klasse': return (a.klasse ?? '').localeCompare(b.klasse ?? '')
        case 'fortschritt':
          return (b.gesamtFragen > 0 ? b.beantworteteFragen / b.gesamtFragen : 0)
            - (a.gesamtFragen > 0 ? a.beantworteteFragen / a.gesamtFragen : 0)
        case 'status': return statusReihenfolge(a.status) - statusReihenfolge(b.status)
        default: return 0
      }
    })
    return liste
  }, [schuelerStatus, sortierung, quickFilter])

  const detailSchueler = detailSus ? schuelerStatus.find((s) => s.email === detailSus) : null

  return (
    <div className="space-y-4">
      {/* Zusammenfassung */}
      <ZusammenfassungsLeiste
        schueler={schuelerStatus}
        gesamtTeilnehmer={config.teilnehmer?.length ?? schuelerStatus.length}
      />

      {/* Filter + Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 text-xs">
          {(['alle', 'aktiv', 'abgegeben', 'nicht-erschienen'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setQuickFilter(f)}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors
                ${quickFilter === f
                  ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>

        <select
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as Sortierung)}
          className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <option value="name">Name (A-Z)</option>
          <option value="klasse">Klasse</option>
          <option value="fortschritt">Fortschritt</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Tabelle */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Klasse</th>
              <th className="px-3 py-2">Frage</th>
              <th className="px-3 py-2">Fortschritt</th>
              <th className="px-3 py-2">Status</th>
              {config.sebErforderlich && <th className="px-3 py-2">SEB</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {gefilterteSchueler.map((s) => {
              const stufe = inaktivitaetsStufe(s)
              const fortschrittProzent = s.gesamtFragen > 0
                ? Math.round((s.beantworteteFragen / s.gesamtFragen) * 100)
                : 0
              return (
                <tr
                  key={s.email}
                  onClick={() => setDetailSus(s.email)}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                    ${stufe === 'rot' ? 'bg-red-50 dark:bg-red-900/10' : ''}
                    ${stufe === 'orange' ? 'bg-amber-50 dark:bg-amber-900/10' : ''}
                    ${stufe === 'gelb' ? 'bg-yellow-50 dark:bg-yellow-900/5' : ''}
                  `}
                >
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200 font-medium">
                    {s.name || s.email}
                    {stufe && (
                      <span className="ml-1 text-xs" title={`Inaktiv seit >${{ gelb: '1', orange: '3', rot: '5' }[stufe]} Min.`}>
                        {{ gelb: '\uD83D\uDFE1', orange: '\uD83D\uDFE0', rot: '\uD83D\uDD34' }[stufe]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{s.klasse ?? '\u2014'}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {s.aktuelleFrage !== null && s.aktuelleFrage !== undefined
                      ? `${s.aktuelleFrage + 1}/${s.gesamtFragen}`
                      : '\u2014'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-20">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${fortschrittProzent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">{fortschrittProzent}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {statusBadge(s.status)}
                  </td>
                  {config.sebErforderlich && (
                    <td className="px-3 py-2 text-xs">
                      {s.sebVersion ? (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">SEB</span>
                      ) : sebAusnahmenLokal.has(s.email) ? (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Ausnahme</span>
                      ) : s.status !== 'nicht-gestartet' ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSebAusnahme(s.email) }}
                          className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer transition-colors"
                          title="SEB-Ausnahme für diesen SuS erlauben"
                        >
                          Kein SEB — Ausnahme?
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Abgabe-Zähler */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Abgegeben: {schuelerStatus.filter((s) => s.status === 'abgegeben').length} / {config.teilnehmer?.length ?? schuelerStatus.length}
      </p>

      {/* Beenden-Button */}
      <div className="flex justify-center pt-2 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setZeigBeendenDialog(true)}
          className="px-6 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer font-medium"
        >
          Prüfung beenden
        </button>
      </div>

      {/* Detail-Panel */}
      {detailSchueler && (
        <SusDetailPanel
          schueler={detailSchueler}
          onSchliessen={() => setDetailSus(null)}
        />
      )}

      {/* Beenden-Dialog */}
      {zeigBeendenDialog && (
        <BeendenDialog
          pruefungId={config.id}
          lpEmail={user?.email ?? ''}
          anzahlAktiv={schuelerStatus.filter((s) => s.status === 'aktiv').length}
          onBeendet={onBeenden}
          onAbbrechen={() => setZeigBeendenDialog(false)}
        />
      )}
    </div>
  )
}

function statusReihenfolge(status: SchuelerStatus['status']): number {
  switch (status) {
    case 'aktiv': return 0
    case 'inaktiv': return 1
    case 'nicht-gestartet': return 2
    case 'abgegeben': return 3
    case 'beendet-lp': return 4
    default: return 5
  }
}

function filterLabel(f: QuickFilter): string {
  switch (f) {
    case 'alle': return 'Alle'
    case 'aktiv': return 'Aktiv'
    case 'abgegeben': return 'Abgegeben'
    case 'nicht-erschienen': return 'Nicht erschienen'
  }
}

function statusBadge(status: SchuelerStatus['status']): React.JSX.Element {
  switch (status) {
    case 'aktiv':
      return <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Aktiv</span>
    case 'abgegeben':
      return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Abgegeben</span>
    case 'nicht-gestartet':
      return <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">Nicht da</span>
    case 'beendet-lp':
      return <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">Beendet</span>
    case 'inaktiv':
      return <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Inaktiv</span>
    default:
      return <span>{status}</span>
  }
}
