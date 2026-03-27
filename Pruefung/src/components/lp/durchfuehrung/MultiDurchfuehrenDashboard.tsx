import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { apiService } from '../../../services/apiService'
import type { MonitoringDaten, SchuelerStatus } from '../../../types/monitoring'
import DurchfuehrenDashboard from './DurchfuehrenDashboard'
import KorrekturDashboard from '../korrektur/KorrekturDashboard'
import ThemeToggle from '../../ThemeToggle'

interface Props {
  pruefungIds: string[]
}

type MultiTab = 'live' | 'einzeln' | 'auswertung'

export function MultiDurchfuehrenDashboard({ pruefungIds }: Props) {
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<MultiTab>('live')
  const [selectedPruefung, setSelectedPruefung] = useState<string>(pruefungIds[0])
  const [monitoringDaten, setMonitoringDaten] = useState<Map<string, MonitoringDaten>>(new Map())
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [auswertungPruefung, setAuswertungPruefung] = useState<string>(pruefungIds[0])

  // Paralleles Polling für Live-Monitoring
  const ladeAlleDaten = useCallback(async () => {
    if (!user) return
    const results = await Promise.allSettled(
      pruefungIds.map(id => apiService.ladeMonitoring(id, user.email))
    )
    const neueMap = new Map<string, MonitoringDaten>()
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        neueMap.set(pruefungIds[i], r.value as MonitoringDaten)
      }
    })
    setMonitoringDaten(neueMap)
    setLadeStatus('fertig')
  }, [pruefungIds, user])

  useEffect(() => {
    ladeAlleDaten()
    const interval = setInterval(ladeAlleDaten, 5000)
    return () => clearInterval(interval)
  }, [ladeAlleDaten])

  // Zusammenfassung über alle Prüfungen
  const alleSchueler: SchuelerStatus[] = []
  const zusammenfassung = { gesamt: 0, aktiv: 0, abgegeben: 0, nichtGestartet: 0, gesperrt: 0 }

  monitoringDaten.forEach((daten) => {
    daten.schueler.forEach((s) => {
      alleSchueler.push(s)
      zusammenfassung.gesamt++
      if (s.status === 'aktiv' || s.status === 'inaktiv') zusammenfassung.aktiv++
      else if (s.status === 'abgegeben' || s.status === 'beendet-lp') zusammenfassung.abgegeben++
      else if (s.status === 'nicht-gestartet') zusammenfassung.nichtGestartet++
      if (s.gesperrt) zusammenfassung.gesperrt++
    })
  })

  if (activeTab === 'auswertung') {
    return (
      <div>
        {/* Tab-Leiste */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            ← Multi-Übersicht
          </button>
          <div className="flex gap-1">
            {pruefungIds.map((id) => {
              const daten = monitoringDaten.get(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAuswertungPruefung(id)}
                  className={`text-xs px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    auswertungPruefung === id
                      ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {daten?.pruefungTitel || id}
                </button>
              )
            })}
          </div>
        </div>
        <KorrekturDashboard pruefungId={auswertungPruefung} eingebettet />
      </div>
    )
  }

  if (activeTab === 'einzeln') {
    return (
      <div>
        {/* Tab-Leiste */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            ← Multi-Übersicht
          </button>
          <div className="flex gap-1">
            {pruefungIds.map((id) => {
              const daten = monitoringDaten.get(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedPruefung(id)}
                  className={`text-xs px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    selectedPruefung === id
                      ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {daten?.pruefungTitel || id}
                </button>
              )
            })}
          </div>
        </div>
        <DurchfuehrenDashboard pruefungId={selectedPruefung} />
      </div>
    )
  }

  // Live-Tab: Zusammengefasstes Monitoring
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Multi-Überwachung ({pruefungIds.length} Prüfungen)
          </h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            ladeStatus === 'laden' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {ladeStatus === 'laden' ? 'Laden...' : 'Live'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('einzeln')}
            className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Einzelansicht →
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auswertung')}
            className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Auswertung →
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Zusammenfassungs-Badges */}
        <div className="flex flex-wrap gap-3">
          <Badge label="Gesamt" value={zusammenfassung.gesamt} />
          <Badge label="Aktiv" value={zusammenfassung.aktiv} color="blue" />
          <Badge label="Abgegeben" value={zusammenfassung.abgegeben} color="green" />
          <Badge label="Nicht gestartet" value={zusammenfassung.nichtGestartet} color="slate" />
          {zusammenfassung.gesperrt > 0 && (
            <Badge label="Gesperrt" value={zusammenfassung.gesperrt} color="red" />
          )}
        </div>

        {/* Pro Prüfung gruppierte SuS-Liste */}
        {pruefungIds.map((id) => {
          const daten = monitoringDaten.get(id)
          if (!daten) return (
            <div key={id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-slate-400">Lade {id}...</p>
            </div>
          )

          const aktive = daten.schueler.filter(s => s.status === 'aktiv' || s.status === 'inaktiv').length
          const abgegeben = daten.schueler.filter(s => s.status === 'abgegeben' || s.status === 'beendet-lp').length
          const gesperrte = daten.schueler.filter(s => s.gesperrt).length

          return (
            <div key={id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Prüfungs-Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">{daten.pruefungTitel || id}</h2>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {aktive} aktiv
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      {abgegeben} abgegeben
                    </span>
                    {gesperrte > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                        🔒 {gesperrte} gesperrt
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPruefung(id); setActiveTab('einzeln') }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Details →
                </button>
              </div>

              {/* Kompakte SuS-Tabelle */}
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
                    <th className="px-3 py-1.5">Name</th>
                    <th className="px-3 py-1.5">Status</th>
                    <th className="px-3 py-1.5">Verstösse</th>
                    <th className="px-3 py-1.5">Fortschritt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {daten.schueler.map((s) => {
                    const fortschrittProzent = s.gesamtFragen > 0
                      ? Math.round((s.beantworteteFragen / s.gesamtFragen) * 100)
                      : 0
                    return (
                      <tr key={s.email} className={s.gesperrt ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-200">{s.name || s.email}</td>
                        <td className="px-3 py-1.5 text-xs">{statusBadge(s.status)}</td>
                        <td className="px-3 py-1.5 text-xs">
                          {s.gesperrt ? (
                            <span className="text-red-600 font-bold">🔒 {s.verstossZaehler ?? 0}</span>
                          ) : (s.verstossZaehler ?? 0) > 0 ? (
                            <span className="text-amber-600 font-semibold">⚠️ {s.verstossZaehler}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-16">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${fortschrittProzent}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">{fortschrittProzent}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper-Komponenten

function Badge({ label, value, color = 'slate' }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }
  return (
    <div className={`px-3 py-1.5 rounded-lg ${colors[color] || colors.slate}`}>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs ml-1.5">{label}</span>
    </div>
  )
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
