import { useState, useCallback, useEffect } from 'react'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import type { PruefungsNachricht } from '../types/monitoring.ts'
import { usePruefungsMonitoring } from '../hooks/usePruefungsMonitoring.ts'
import { usePruefungsUX } from '../hooks/usePruefungsUX.ts'
import { useTabKonflikt } from '../hooks/useTabKonflikt.ts'
import { istImSEB } from '../services/sebService.ts'
import Timer from './Timer.tsx'
import VerbindungsStatus from './VerbindungsStatus.tsx'
import AutoSaveIndikator from './AutoSaveIndikator.tsx'
import FragenNavigation from './FragenNavigation.tsx'
import AbgabeDialog from './AbgabeDialog.tsx'
import ThemeToggle from './ThemeToggle.tsx'
import MaterialPanel from './MaterialPanel.tsx'
import MCFrage from './fragetypen/MCFrage.tsx'
import FreitextFrage from './fragetypen/FreitextFrage.tsx'
import LueckentextFrage from './fragetypen/LueckentextFrage.tsx'
import ZuordnungFrage from './fragetypen/ZuordnungFrage.tsx'
import RichtigFalschFrage from './fragetypen/RichtigFalschFrage.tsx'
import BerechnungFrage from './fragetypen/BerechnungFrage.tsx'
import type { Frage, MCFrage as MCFrageType, FreitextFrage as FreitextFrageType, LueckentextFrage as LueckentextFrageType, ZuordnungFrage as ZuordnungFrageType, RichtigFalschFrage as RichtigFalschFrageType, BerechnungFrage as BerechnungFrageType } from '../types/fragen.ts'
import { findeAbschnitt } from '../utils/abschnitte.ts'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const aktuelleFrageIndex = usePruefungStore((s) => s.aktuelleFrageIndex)
  const antworten = usePruefungStore((s) => s.antworten)
  const markierungen = usePruefungStore((s) => s.markierungen)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const naechsteFrage = usePruefungStore((s) => s.naechsteFrage)
  const vorherigeFrage = usePruefungStore((s) => s.vorherigeFrage)
  const toggleMarkierung = usePruefungStore((s) => s.toggleMarkierung)
  const [zeigAbgabeDialog, setZeigAbgabeDialog] = useState(false)
  const [zeigMaterial, setZeigMaterial] = useState(false)
  const [tabKonfliktGeschlossen, setTabKonfliktGeschlossen] = useState(false)
  const [zeitAbgelaufen, setZeitAbgelaufen] = useState(false)

  // Tab-Konflikterkennung
  const tabKonflikt = useTabKonflikt(config?.id ?? null)

  // Monitoring: Auto-Save (lokal + remote), Heartbeat, Focus-Detection, Online/Offline
  usePruefungsMonitoring()

  // UX: beforeunload-Warnung, Tastaturnavigation, Escape
  const handleAbgabeDialogSchliessen = useCallback(() => setZeigAbgabeDialog(false), [])
  const handleAbgabeDialogOeffnen = useCallback(() => setZeigAbgabeDialog(true), [])
  usePruefungsUX({
    onAbgabeDialogOeffnen: handleAbgabeDialogOeffnen,
    onAbgabeDialogSchliessen: handleAbgabeDialogSchliessen,
  })

  // LP-Nachrichten für SuS
  const [lpNachrichten, setLpNachrichten] = useState<PruefungsNachricht[]>([])
  const [geschlosseneNachrichten, setGeschlosseneNachrichten] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!user || !config || abgegeben) return

    const pruefungId = config.id
    const email = user.email

    async function pollNachrichten() {
      const result = await apiService.ladeNachrichten(pruefungId, email)
      if (result.length > 0) {
        setLpNachrichten(result)
      }
    }

    pollNachrichten()
    const interval = setInterval(pollNachrichten, 10000)
    return () => clearInterval(interval)
  }, [user, config, abgegeben])

  const ungelesenNachrichten = lpNachrichten.filter((n) => !geschlosseneNachrichten.has(n.id))

  if (!config || fragen.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Keine Prüfungsdaten vorhanden.</p>
          <button
            onClick={() => {
              usePruefungStore.getState().zuruecksetzen()
              window.location.reload()
            }}
            className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Zurück zum Start
          </button>
        </div>
      </div>
    )
  }

  const aktuelleFrage = fragen[aktuelleFrageIndex]
  const istMarkiert = aktuelleFrage ? !!markierungen[aktuelleFrage.id] : false

  // Abschnitt-Kontext für aktuelle Frage
  const abschnittInfo = findeAbschnitt(config, aktuelleFrageIndex, fragen)

  // Fortschritt: Anzahl beantworteter Fragen
  const beantwortetAnzahl = fragen.filter((f) => !!antworten[f.id]).length
  const fortschrittProzent = fragen.length > 0 ? (beantwortetAnzahl / fragen.length) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* SEB-Warnung */}
      {/* SEB-Warnung — absichtlich nicht schliessbar */}
      {config.sebErforderlich && !istImSEB() && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Diese Prüfung sollte im Safe Exam Browser (SEB) geschrieben werden. Du verwendest einen normalen Browser.
          </p>
        </div>
      )}

      {/* Tab-Konflikt-Warnung */}
      {tabKonflikt && !tabKonfliktGeschlossen && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-300 dark:border-red-700 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Achtung:</strong> Diese Prüfung ist in einem anderen Tab geöffnet. Bitte nur in einem Tab arbeiten.
          </p>
          <button
            onClick={() => setTabKonfliktGeschlossen(true)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-lg leading-none cursor-pointer"
            title="Warnung schliessen"
          >
            &times;
          </button>
        </div>
      )}

      {/* LP-Nachrichten */}
      {ungelesenNachrichten.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-300 dark:border-blue-700 px-4 py-2 space-y-1">
          {ungelesenNachrichten.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200 min-w-0">
                <span className="flex-shrink-0 font-medium">Lehrperson:</span>
                <span className="break-words min-w-0">{n.text}</span>
                <span className="flex-shrink-0 text-xs text-blue-500 dark:text-blue-400 tabular-nums mt-0.5">
                  {new Date(n.zeitpunkt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => setGeschlosseneNachrichten((prev) => new Set(prev).add(n.id))}
                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 text-lg leading-none flex-shrink-0 cursor-pointer"
                title="Nachricht schliessen"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header — alle Steuerungen */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 py-2 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Links: Zurück / Frage X/Y / Weiter */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={vorherigeFrage}
              disabled={aktuelleFrageIndex === 0}
              title="Vorherige Frage"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              &larr;
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300 tabular-nums min-w-[4rem] text-center font-medium">
              {aktuelleFrageIndex + 1} / {fragen.length}
            </span>
            <button
              onClick={naechsteFrage}
              disabled={aktuelleFrageIndex === fragen.length - 1}
              title="Nächste Frage"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              &rarr;
            </button>
          </div>

          {/* Mitte: Timer + AutoSave */}
          <div className="flex items-center gap-2">
            <AutoSaveIndikator />
            <Timer onZeitAbgelaufen={() => setZeitAbgelaufen(true)} />
          </div>

          {/* Rechts: Material + Markieren + Abgeben + Status + Theme */}
          <div className="flex items-center gap-1.5">
            {/* Material-Button (nur wenn Materialien vorhanden) */}
            {config.materialien && config.materialien.length > 0 && (
              <button
                onClick={() => setZeigMaterial(true)}
                title="Material anzeigen"
                className={`px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer hidden sm:flex items-center gap-1
                  ${zeigMaterial
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                    : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden md:inline">Material</span>
              </button>
            )}

            {aktuelleFrage && (
              <button
                onClick={() => toggleMarkierung(aktuelleFrage.id)}
                title={istMarkiert ? 'Markierung entfernen' : 'Als unsicher markieren'}
                className={`px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer hidden sm:flex items-center gap-1
                  ${istMarkiert
                    ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                    : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span>?</span>
                <span className="hidden md:inline">{istMarkiert ? 'Markiert' : 'Unsicher'}</span>
              </button>
            )}

            {!abgegeben && (
              <button
                onClick={() => setZeigAbgabeDialog(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 dark:bg-slate-600 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Abgeben
              </button>
            )}

            <VerbindungsStatus />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: Markieren + Material */}
        <div className="sm:hidden mt-1.5 flex items-center gap-2">
          {aktuelleFrage && (
            <button
              onClick={() => toggleMarkierung(aktuelleFrage.id)}
              className={`px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer flex items-center gap-1
                ${istMarkiert
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                  : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                }
              `}
            >
              <span>?</span>
              <span>{istMarkiert ? 'Markiert' : 'Unsicher'}</span>
            </button>
          )}
          {config.materialien && config.materialien.length > 0 && (
            <button
              onClick={() => setZeigMaterial(true)}
              className="px-2 py-1 text-xs rounded-lg border border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Material</span>
            </button>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {config.titel}
          </span>
        </div>
        {/* Fortschrittsbalken */}
        <div className="h-1 bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full bg-slate-500 dark:bg-slate-400 transition-all duration-500"
            style={{ width: `${fortschrittProzent}%` }}
          />
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-auto">
          {user && (
            <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
              {user.email && user.email !== 'demo@example.com' && (
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
              )}
            </div>
          )}
          <FragenNavigation />
        </aside>

        {/* Fragenbereich */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {/* Abschnitt-Header */}
            {abschnittInfo && abschnittInfo.istErsteFrage && (
              <div className="mb-5 pb-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {abschnittInfo.abschnitt.titel}
                </h2>
                {abschnittInfo.abschnitt.beschreibung && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {abschnittInfo.abschnitt.beschreibung}
                  </p>
                )}
              </div>
            )}

            {/* Abschnitt-Kontext (kompakt, wenn nicht erste Frage) */}
            {abschnittInfo && !abschnittInfo.istErsteFrage && (
              <div className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                {abschnittInfo.abschnitt.titel} · Frage {abschnittInfo.positionImAbschnitt + 1} von {abschnittInfo.abschnitt.fragenIds.length}
              </div>
            )}

            {aktuelleFrage && <div key={aktuelleFrage.id}>{renderFrage(aktuelleFrage)}</div>}

            {/* Mobile Navigation (Kacheln) */}
            <div className="md:hidden mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <FragenNavigation />
            </div>
          </div>
        </main>
      </div>

      {/* Zeitablauf-Banner */}
      {zeitAbgelaufen && abgegeben && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 dark:bg-red-700 text-white px-4 py-3 text-center z-30">
          <p className="font-semibold">Die Zeit ist abgelaufen — Ihre Prüfung wurde automatisch abgegeben.</p>
          <p className="text-sm text-red-100 mt-1">Ihre Antworten wurden gespeichert. Sie können das Fenster schliessen.</p>
        </div>
      )}

      {/* Abgabe-Dialog */}
      {zeigAbgabeDialog && (
        <AbgabeDialog onSchliessen={() => setZeigAbgabeDialog(false)} />
      )}

      {/* Material-Panel */}
      {zeigMaterial && config.materialien && config.materialien.length > 0 && (
        <MaterialPanel
          materialien={config.materialien}
          onSchliessen={() => setZeigMaterial(false)}
        />
      )}
    </div>
  )
}

function renderFrage(frage: Frage) {
  switch (frage.typ) {
    case 'mc':
      return <MCFrage frage={frage as MCFrageType} />
    case 'freitext':
      return <FreitextFrage frage={frage as FreitextFrageType} />
    case 'lueckentext':
      return <LueckentextFrage frage={frage as LueckentextFrageType} />
    case 'zuordnung':
      return <ZuordnungFrage frage={frage as ZuordnungFrageType} />
    case 'richtigfalsch':
      return <RichtigFalschFrage frage={frage as RichtigFalschFrageType} />
    case 'berechnung':
      return <BerechnungFrage frage={frage as BerechnungFrageType} />
    default:
      return (
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-center">
          Fragetyp «{frage.typ}» wird in einer späteren Phase implementiert.
        </div>
      )
  }
}
