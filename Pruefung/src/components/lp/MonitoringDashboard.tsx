import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import { erstelleDemoMonitoring } from '../../data/demoMonitoring.ts'
import { demoFragen } from '../../data/demoFragen.ts'
import type { MonitoringDaten, SchuelerStatus, PruefungsNachricht } from '../../types/monitoring.ts'
import type { SchuelerAbgabe } from '../../types/korrektur.ts'
import type { Frage } from '../../types/fragen.ts'
import ThemeToggle from '../ThemeToggle.tsx'
import SchuelerZeile from './SchuelerZeile.tsx'
import { typLabel } from '../../utils/fachbereich.ts'

type Sortierung = 'name' | 'status' | 'fortschritt' | 'unterbrechungen'
type Filter = 'alle' | 'aktiv' | 'inaktiv' | 'abgegeben' | 'nicht-gestartet'
type MonitoringAnsicht = 'sus' | 'fragen'

export default function MonitoringDashboard({ pruefungId }: { pruefungId: string | null }) {
  const user = useAuthStore((s) => s.user)
  const abmelden = useAuthStore((s) => s.abmelden)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [daten, setDaten] = useState<MonitoringDaten | null>(null)
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [sortierung, setSortierung] = useState<Sortierung>('name')
  const [filter, setFilter] = useState<Filter>('alle')
  const [aufgeklappteSchueler, setAufgeklappteSchueler] = useState<Set<string>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [ansicht, setAnsicht] = useState<MonitoringAnsicht>('sus')

  // Abgaben + Fragen (einmalig geladen, nicht bei jedem Refresh)
  const [abgaben, setAbgaben] = useState<Record<string, SchuelerAbgabe>>({})
  const [fragen, setFragen] = useState<Frage[]>([])
  const abgabenGeladen = useRef(false)

  // Nachrichten (LP → SuS)
  const [nachrichten, setNachrichten] = useState<PruefungsNachricht[]>([])

  // Nachrichten laden
  const ladeNachrichten = useCallback(async () => {
    if (!user || istDemoModus || !apiService.istKonfiguriert() || !pruefungId) return
    const result = await apiService.ladeNachrichten(pruefungId, user.email)
    setNachrichten(result)
  }, [user, istDemoModus, pruefungId])

  // Nachrichten initial + periodisch laden (alle 10s)
  useEffect(() => {
    ladeNachrichten()
    const interval = setInterval(ladeNachrichten, 10000)
    return () => clearInterval(interval)
  }, [ladeNachrichten])

  // Daten laden (Backend oder Demo)
  const ladeDaten = useCallback(async () => {
    if (!user) return

    // Demo-Modus oder kein Backend → Demo-Daten
    if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId) {
      setDaten(erstelleDemoMonitoring())
      setLadeStatus('fertig')
      return
    }

    const result = await apiService.ladeMonitoring(pruefungId, user.email)
    if (result) {
      // Backend liefert minimale Daten — fehlende Felder mit Defaults ergänzen
      const mappedResult = {
        ...result,
        gesamtSus: result.gesamtSus ?? result.schueler?.length ?? 0,
        schueler: ((result.schueler || []) as unknown as Record<string, unknown>[]).map((s) => ({
          email: s.email || '',
          name: s.name || s.email || '',
          status: s.status || (s.istAbgegeben === 'true' || s.istAbgegeben === true ? 'abgegeben' : 'nicht-gestartet'),
          letzterHeartbeat: s.letzterHeartbeat || null,
          letzterSave: s.letzterSave || null,
          beantworteteFragen: Number(s.beantworteteFragen) || 0,
          gesamtFragen: Number(s.gesamtFragen) || 0,
          abgabezeit: s.abgabezeit || null,
          startzeit: s.startzeit || null,
          heartbeats: Number(s.heartbeats) || 0,
          netzwerkFehler: Number(s.netzwerkFehler) || 0,
          autoSaveCount: Number(s.autoSaveCount) || 0,
          unterbrechungen: Array.isArray(s.unterbrechungen) ? s.unterbrechungen : [],
          sebVersion: s.sebVersion || undefined,
          browserInfo: s.browserInfo || undefined,
        })),
      }
      setDaten(mappedResult as MonitoringDaten)
      setLadeStatus('fertig')
    } else {
      setLadeStatus('fehler')
    }
  }, [user, istDemoModus, pruefungId])

  // Initialer Ladevorgang
  useEffect(() => {
    ladeDaten()
  }, [ladeDaten])

  // Auto-Refresh (alle 5s)
  useEffect(() => {
    if (!autoRefresh || ladeStatus === 'fehler') return

    const interval = setInterval(ladeDaten, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, ladeStatus, ladeDaten])

  // Abgaben + Fragen einmalig laden (für Fragen-Fortschritt)
  useEffect(() => {
    if (abgabenGeladen.current || !user) return

    async function ladeAbgabenUndFragen() {
      if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId) {
        // Demo-Modus: Demo-Fragen verwenden, Abgaben leer lassen
        setFragen(demoFragen.slice(0, 7)) // Passend zu gesamtFragen=7 in Demo
        abgabenGeladen.current = true
        return
      }

      const [abgabenResult, pruefungResult] = await Promise.all([
        apiService.ladeAbgaben(pruefungId, user!.email),
        apiService.ladePruefung(pruefungId, user!.email),
      ])

      if (abgabenResult) setAbgaben(abgabenResult)
      if (pruefungResult?.fragen) setFragen(pruefungResult.fragen)
      abgabenGeladen.current = true
    }

    ladeAbgabenUndFragen()
  }, [user, istDemoModus, pruefungId])

  // Detail-Zeile aufklappen/zuklappen
  function toggleDetail(email: string): void {
    setAufgeklappteSchueler((prev) => {
      const next = new Set(prev)
      if (next.has(email)) {
        next.delete(email)
      } else {
        next.add(email)
      }
      return next
    })
  }

  // Sortieren
  function sortiere(schueler: SchuelerStatus[]): SchuelerStatus[] {
    return [...schueler].sort((a, b) => {
      switch (sortierung) {
        case 'name':
          return a.name.localeCompare(b.name, 'de')
        case 'status': {
          const reihenfolge: Record<string, number> = { 'inaktiv': 0, 'aktiv': 1, 'nicht-gestartet': 2, 'abgegeben': 3 }
          return (reihenfolge[a.status] ?? 4) - (reihenfolge[b.status] ?? 4)
        }
        case 'fortschritt':
          return ((b.beantworteteFragen || 0) / (b.gesamtFragen || 1)) - ((a.beantworteteFragen || 0) / (a.gesamtFragen || 1))
        case 'unterbrechungen':
          return (b.unterbrechungen || []).length - (a.unterbrechungen || []).length
        default:
          return 0
      }
    })
  }

  // Filtern
  function filtre(schueler: SchuelerStatus[]): SchuelerStatus[] {
    if (filter === 'alle') return schueler
    return schueler.filter((s) => s.status === filter)
  }

  if (ladeStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Monitoring wird geladen...</p>
      </div>
    )
  }

  if (ladeStatus === 'fehler' || !daten) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xl">!</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Monitoring-Daten konnten nicht geladen werden.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => { window.history.pushState({}, '', window.location.pathname); window.location.reload() }}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
            <button
              onClick={ladeDaten}
              className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Erneut versuchen
            </button>
            <button
              onClick={abmelden}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Null-Guard: daten könnte null sein wenn ladeStatus noch "laden" ist
  if (!daten) return null

  const gefilterteSchueler = sortiere(filtre(daten.schueler))

  // Zusammenfassung berechnen
  const zusammenfassung = {
    aktiv: daten.schueler.filter((s) => s.status === 'aktiv').length,
    inaktiv: daten.schueler.filter((s) => s.status === 'inaktiv').length,
    abgegeben: daten.schueler.filter((s) => s.status === 'abgegeben').length,
    nichtGestartet: daten.schueler.filter((s) => s.status === 'nicht-gestartet').length,
    mitUnterbrechungen: daten.schueler.filter((s) => (s.unterbrechungen || []).length > 0).length,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.history.pushState({}, '', window.location.pathname); window.location.reload() }}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Prüfungs-Monitoring
              </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {daten.pruefungTitel}
              {istDemoModus && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                  Demo
                </span>
              )}
            </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-Refresh pausieren' : 'Auto-Refresh aktivieren'}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5
                ${autoRefresh
                  ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                  : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              Live
            </button>

            {/* Manueller Refresh */}
            <button
              onClick={ladeDaten}
              title="Jetzt aktualisieren"
              className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ↻
            </button>

            {/* User-Info + Abmelden */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {user.name}
                </span>
                <button
                  onClick={abmelden}
                  title="Abmelden"
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Abmelden
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Zusammenfassung */}
      <div className="max-w-6xl mx-auto w-full px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <StatusKarte label="Aktiv" wert={zusammenfassung.aktiv} farbe="green" />
          <StatusKarte label="Inaktiv" wert={zusammenfassung.inaktiv} farbe="amber" />
          <StatusKarte label="Abgegeben" wert={zusammenfassung.abgegeben} farbe="slate" />
          <StatusKarte label="Nicht gestartet" wert={zusammenfassung.nichtGestartet} farbe="gray" />
          <StatusKarte label="Unterbrechungen" wert={zusammenfassung.mitUnterbrechungen} farbe="red" />
        </div>

        {/* Ansicht-Toggle: SuS / Fragen */}
        <div className="flex gap-1 mb-4">
          {(['sus', 'fragen'] as MonitoringAnsicht[]).map((a) => (
            <button
              key={a}
              onClick={() => setAnsicht(a)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer
                ${ansicht === a
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
            >
              {a === 'sus' ? 'SuS' : 'Fragen'}
            </button>
          ))}
        </div>

        {ansicht === 'sus' && <>
        {/* Filter + Sortierung */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter:</span>
          {(['alle', 'aktiv', 'inaktiv', 'abgegeben', 'nicht-gestartet'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer capitalize
                ${filter === f
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              {f === 'nicht-gestartet' ? 'Nicht gestartet' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}

          <span className="text-xs text-slate-300 dark:text-slate-600 mx-1">|</span>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sortierung:</span>
          {([
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status' },
            { key: 'fortschritt', label: 'Fortschritt' },
            { key: 'unterbrechungen', label: 'Unterbrechungen' },
          ] as { key: Sortierung; label: string }[]).map((s) => (
            <button
              key={s.key}
              onClick={() => setSortierung(s.key)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer
                ${sortierung === s.key
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Tabelle */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Tabellen-Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_0.5fr] gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Name</span>
            <span>Status</span>
            <span>Fortschritt</span>
            <span>Letzter Save</span>
            <span>Heartbeat</span>
            <span className="text-center">Info</span>
          </div>

          {/* Zeilen */}
          {gefilterteSchueler.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
              Keine SuS mit diesem Filter gefunden.
            </div>
          ) : (
            gefilterteSchueler.map((schueler) => (
              <SchuelerZeile
                key={schueler.email}
                schueler={schueler}
                aufgeklappt={aufgeklappteSchueler.has(schueler.email)}
                onToggle={() => toggleDetail(schueler.email)}
                zeitverlaengerung={daten?.zeitverlaengerungen?.[schueler.email]}
                antworten={abgaben[schueler.email]?.antworten}
                fragen={fragen}
                pruefungId={pruefungId ?? undefined}
                lpEmail={user?.email}
                nachrichten={nachrichten}
                onNachrichtGesendet={ladeNachrichten}
              />
            ))
          )}
        </div>
        </>}

        {ansicht === 'fragen' && (
          <FragenFortschritt fragen={fragen} abgaben={abgaben} gesamtSus={daten.gesamtSus} />
        )}

        {/* Footer mit letztem Update */}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
          Letzte Aktualisierung: {new Date(daten.aktualisiert).toLocaleTimeString('de-CH')}
          {' · '}
          {daten.gesamtSus} SuS total
          {autoRefresh && ' · Auto-Refresh alle 5s'}
        </p>
      </div>
    </div>
  )
}

/** Aggregierte Fragen-Fortschrittsansicht */
function FragenFortschritt({ fragen, abgaben, gesamtSus }: {
  fragen: Frage[]
  abgaben: Record<string, SchuelerAbgabe>
  gesamtSus: number
}) {
  // Für jede Frage zählen, wie viele SuS sie beantwortet haben
  const abgabenListe = Object.values(abgaben)
  const total = abgabenListe.length || gesamtSus || 1

  const fragenStats = fragen.map((frage) => {
    const beantwortet = abgabenListe.filter((a) => a.antworten?.[frage.id] != null).length
    const prozent = Math.round((beantwortet / total) * 100)
    return { frage, beantwortet, total, prozent }
  })

  if (fragen.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
        Keine Fragen geladen.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1.5fr_0.5fr] gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <span>Frage</span>
        <span>Typ</span>
        <span>Beantwortet</span>
        <span className="text-right">%</span>
      </div>

      {fragenStats.map(({ frage, beantwortet, total: t, prozent }) => (
        <div
          key={frage.id}
          className="grid grid-cols-[2fr_1fr_1.5fr_0.5fr] gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/50 items-center text-sm"
        >
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate" title={frage.id}>
            {frage.id}
          </span>
          <span className="inline-flex">
            <span className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {typLabel(frage.typ)}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all"
                style={{ width: `${prozent}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
              {beantwortet} / {t}
            </span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums text-right font-medium">
            {prozent}%
          </span>
        </div>
      ))}
    </div>
  )
}

/** Kompakte Status-Karte für die Zusammenfassung */
function StatusKarte({ label, wert, farbe }: { label: string; wert: number; farbe: string }) {
  const farbKlassen: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    slate: 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300',
    gray: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  }

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${farbKlassen[farbe] || farbKlassen.slate}`}>
      <div className="text-2xl font-bold tabular-nums">{wert}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}
