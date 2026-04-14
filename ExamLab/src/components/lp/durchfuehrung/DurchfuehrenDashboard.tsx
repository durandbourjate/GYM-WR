import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { TabBar } from '../../ui/TabBar'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { erstelleDemoMonitoring } from '../../../data/demoMonitoring.ts'
import { demoFragen } from '../../../data/demoFragen.ts'
import { einrichtungsPruefung } from '../../../data/einrichtungsPruefung.ts'
import { einrichtungsUebung } from '../../../data/einrichtungsUebung.ts'
import { einrichtungsUebungFragen } from '../../../data/einrichtungsUebungFragen.ts'

// Eingebaute Versionen für Einrichtungsprüfung/-übung (Fallback wenn Backend-Config veraltet)
const eingebauteVersionen: Record<string, { config: PruefungsConfig; fragen: Frage[] }> = {
  'einrichtung-uebung': { config: einrichtungsUebung, fragen: einrichtungsUebungFragen },
  [einrichtungsPruefung.id]: { config: einrichtungsPruefung, fragen: demoFragen },
}
import type { MonitoringDaten, PruefungsNachricht } from '../../../types/monitoring.ts'
import type { SchuelerAbgabe } from '../../../types/korrektur.ts'
import type { Frage } from '../../../types/fragen.ts'
import LPHeader from '../LPHeader.tsx'
import EinstellungenPanel from '../../settings/EinstellungenPanel.tsx'
import FragenBrowser from '../fragenbank/FragenBrowser.tsx'
import HilfeSeite from '../HilfeSeite.tsx'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { PruefungsPhase } from '../../../types/monitoring'
import { bestimmePhase } from '../../../utils/phase'
import { exportiereTeilnahmeCSV, downloadCSV } from '../../../utils/exportUtils'
import VorbereitungPhase from '../vorbereitung/VorbereitungPhase'
import LobbyPhase from './LobbyPhase'
import AktivPhase from './AktivPhase'
import BeendetPhase from './BeendetPhase'
import KorrekturDashboard from '../korrektur/KorrekturDashboard'

type DurchfuehrenTab = 'vorbereitung' | 'lobby' | 'live' | 'auswertung'

const TAB_CONFIG: { key: DurchfuehrenTab; label: string; icon: string }[] = [
  { key: 'vorbereitung', label: 'Vorbereitung', icon: '⚙️' },
  { key: 'lobby', label: 'Lobby', icon: '🟡' },
  { key: 'live', label: 'Live', icon: '🟢' },
  { key: 'auswertung', label: 'Auswertung', icon: '✏️' },
]

// Phase → Tab Mapping
function phaseZuTab(phase: PruefungsPhase): DurchfuehrenTab {
  switch (phase) {
    case 'vorbereitung': return 'vorbereitung'
    case 'lobby': return 'lobby'
    case 'aktiv': return 'live'
    case 'beendet': return 'auswertung'
  }
}

// Tab-Reihenfolge für Vergleich
const TAB_REIHENFOLGE: DurchfuehrenTab[] = ['vorbereitung', 'lobby', 'live', 'auswertung']

function tabIndex(tab: DurchfuehrenTab): number {
  return TAB_REIHENFOLGE.indexOf(tab)
}

// Prüft ob ein Tab basierend auf der aktuellen Phase verfügbar ist
function istTabVerfuegbar(tab: DurchfuehrenTab, phase: PruefungsPhase): boolean {
  const aktuellerTabIndex = tabIndex(phaseZuTab(phase))
  const zielIndex = tabIndex(tab)
  // Auswertung immer verfügbar (LP muss jederzeit korrigieren können)
  if (tab === 'auswertung') return true
  return zielIndex <= aktuellerTabIndex
}

// URL-Fallback: Alte Tab-Namen auf neuen Namen mappen
function normalisiereUrlTab(raw: string | null): DurchfuehrenTab | null {
  if (!raw) return null
  if (raw === 'ergebnisse' || raw === 'korrektur') return 'auswertung'
  if (TAB_REIHENFOLGE.includes(raw as DurchfuehrenTab)) return raw as DurchfuehrenTab
  return null
}

function formatDauer(ms: number): string {
  const totalSekunden = Math.floor(ms / 1000)
  const stunden = Math.floor(totalSekunden / 3600)
  const minuten = Math.floor((totalSekunden % 3600) / 60)
  const sekunden = totalSekunden % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return stunden > 0
    ? `${pad(stunden)}:${pad(minuten)}:${pad(sekunden)}`
    : `${pad(minuten)}:${pad(sekunden)}`
}

export default function DurchfuehrenDashboard({ pruefungId }: { pruefungId: string | null }) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Tab-State (mit Fallback für alte URL-Parameter ?tab=ergebnisse / ?tab=korrektur)
  const urlTab = normalisiereUrlTab(new URLSearchParams(window.location.search).get('tab'))
  const [activeTab, setActiveTab] = useState<DurchfuehrenTab>(urlTab ?? 'vorbereitung')
  const letztePhaseRef = useRef<PruefungsPhase>('vorbereitung')

  // Data-State (aus MonitoringDashboard)
  const [daten, setDaten] = useState<MonitoringDaten | null>(null)
  const [zeigFragenbank, setZeigFragenbank] = useState(false)
  const [zeigHilfe, setZeigHilfe] = useState(false)
  const [zeigEinstellungen, setZeigEinstellungen] = useState(false)
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Abgaben + Fragen (einmalig geladen)
  const [abgaben, setAbgaben] = useState<Record<string, SchuelerAbgabe>>({})
  const [fragen, setFragen] = useState<Frage[]>([])
  const abgabenGeladen = useRef(false)

  // Nachrichten (LP → SuS)
  const [_nachrichten, setNachrichten] = useState<PruefungsNachricht[]>([])

  // Auswertung: Ergebnis-Übersicht Accordion (offen wenn keine Korrektur gestartet)
  const [ergebnisOffen, setErgebnisOffen] = useState(true)

  // Config der Prüfung
  const [config, setConfig] = useState<PruefungsConfig | null>(null)

  // Phase früh ableiten (wird in Polling-Effekten als Dependency gebraucht)
  const phase: PruefungsPhase = config && daten
    ? bestimmePhase(config, daten.schueler)
    : 'vorbereitung'

  // Zentral: Nur Teilnehmer aus dem Monitoring anzeigen (nicht-eingeladene SuS ausfiltern)
  const teilnehmerEmails = useMemo(() => {
    if (!config?.teilnehmer?.length) return null // null = kein Filter (Kompatibilität)
    return new Set(config.teilnehmer.map((t) => t.email.toLowerCase()))
  }, [config?.teilnehmer])
  const gefilterteSchueler = useMemo(() => {
    if (!daten) return []
    if (!teilnehmerEmails) return daten.schueler
    return daten.schueler.filter((s) => teilnehmerEmails.has(s.email.toLowerCase()))
  }, [daten, teilnehmerEmails])

  // Loading-State für Freischalten-Button
  const [freischaltenLaedt, setFreischaltenLaedt] = useState(false)

  // AbortController für Monitoring-Polling (Overlap-Schutz)
  const monitoringAbortRef = useRef<AbortController | null>(null)

  // Verbindungsfehler-Tracking (Ref statt State → kein useCallback-Rebuild)
  const fehlerCountRef = useRef(0)
  const [zeigeVerbindungsBanner, setZeigeVerbindungsBanner] = useState(false)

  // Timer für aktive Phase
  const [startTimestamp] = useState(() => Date.now())
  const [dauer, setDauer] = useState('')

  // Nachrichten laden
  const ladeNachrichten = useCallback(async () => {
    if (!user || istDemoModus || !apiService.istKonfiguriert() || !pruefungId || pruefungId === 'demo') return
    const result = await apiService.ladeNachrichten(pruefungId, user.email)
    setNachrichten(result)
  }, [user, istDemoModus, pruefungId])

  useEffect(() => {
    ladeNachrichten()
    const interval = setInterval(ladeNachrichten, 20000)
    return () => clearInterval(interval)
  }, [ladeNachrichten])

  // Daten laden (mit Overlap-Schutz: vorherigen Request abbrechen)
  const ladeDaten = useCallback(async () => {
    if (!user) return
    if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId || pruefungId === 'demo') {
      setDaten(erstelleDemoMonitoring())
      setLadeStatus('fertig')
      return
    }
    // Vorherigen laufenden Request abbrechen
    monitoringAbortRef.current?.abort()
    const controller = new AbortController()
    monitoringAbortRef.current = controller
    const result = await apiService.ladeMonitoring(pruefungId, user.email, { signal: controller.signal })
    // Abgebrochene Requests ignorieren (nicht als Fehler werten)
    if (controller.signal.aborted) return
    // Verbindungsfehler erkennen: result ist null bei Timeout/Netzwerkfehler
    // ABER: Beim ersten Laden ist null normal (kein Antworten-Sheet in Vorbereitungsphase)
    if (!result && !istDemoModus && ladeStatus !== 'laden') {
      fehlerCountRef.current++
      if (fehlerCountRef.current >= 3) {
        setZeigeVerbindungsBanner(true)
      }
      return // Bestehende Daten sichtbar lassen, nicht mit leeren überschreiben
    }
    // Erfolg → Fehlerzähler zurücksetzen
    if (result) {
      fehlerCountRef.current = 0
      if (zeigeVerbindungsBanner) setZeigeVerbindungsBanner(false)
    }
    // result kann null sein wenn noch kein Antworten-Sheet existiert (Vorbereitungsphase)
    // → Leere Monitoring-Daten statt Fehler, damit die LP normal weiterarbeiten kann
    const effectiveResult = result || { pruefungTitel: '', schueler: [], gesamtSus: 0 }
    const mappedResult = {
      ...effectiveResult,
      gesamtSus: effectiveResult.gesamtSus ?? (effectiveResult.schueler as unknown[])?.length ?? 0,
      schueler: (((effectiveResult.schueler || []) as unknown as Record<string, unknown>[]).map((s) => ({
        email: s.email || '',
        name: s.name || s.email || '',
        status: (s.abgabezeit || s.istAbgabe === 'true' || s.istAbgegeben === 'true' || s.istAbgegeben === true) ? 'abgegeben' : (s.status || 'nicht-gestartet'),
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
        aktuelleFrage: typeof s.aktuelleFrage === 'number' ? s.aktuelleFrage : (s.aktuelleFrage != null && s.aktuelleFrage !== '' ? Number(s.aktuelleFrage) : null),
        // Lockdown-Felder (B19-Fix: fehlten im Mapping)
        geraet: (s.geraet as 'laptop' | 'tablet' | 'unbekannt') || undefined,
        vollbild: s.vollbild === true || s.vollbild === 'true',
        kontrollStufe: (s.kontrollStufe as 'keine' | 'locker' | 'standard' | 'streng') || undefined,
        verstossZaehler: Number(s.verstossZaehler) || 0,
        gesperrt: s.gesperrt === true || s.gesperrt === 'true',
        verstoesse: Array.isArray(s.verstoesse) ? s.verstoesse : (typeof s.verstoesse === 'string' ? (() => { try { return JSON.parse(s.verstoesse as string) } catch { return [] } })() : []),
      }))),
    }
    setDaten(mappedResult as MonitoringDaten)
    setLadeStatus('fertig')
  }, [user, istDemoModus, pruefungId])

  useEffect(() => { ladeDaten() }, [ladeDaten])

  // Auto-Refresh: 5s in Live-Phase (kritisch), 15s sonst (spart Connections für Button-Clicks)
  useEffect(() => {
    if (!autoRefresh || ladeStatus === 'fehler') return
    const intervallMs = phase === 'aktiv' ? 5000 : 15000
    const interval = setInterval(ladeDaten, intervallMs)
    return () => clearInterval(interval)
  }, [autoRefresh, ladeStatus, ladeDaten, phase])

  // Abgaben + Fragen + Config einmalig laden (ladePruefung gibt beides zurück)
  useEffect(() => {
    if (abgabenGeladen.current || !user) return
    async function ladeAbgabenUndFragen() {
      if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId || pruefungId === 'demo') {
        setFragen(demoFragen)
        abgabenGeladen.current = true
        return
      }
      const [abgabenResult, pruefungResult] = await Promise.all([
        apiService.ladeAbgaben(pruefungId, user!.email),
        apiService.ladePruefung(pruefungId, user!.email),
      ])
      if (abgabenResult) setAbgaben(abgabenResult)

      // Einrichtungsprüfung/-übung: Eingebaute Config + Fragen verwenden
      if (pruefungResult && eingebauteVersionen[pruefungId]) {
        const eingebaut = eingebauteVersionen[pruefungId]
        pruefungResult.config = { ...eingebaut.config, freigeschaltet: pruefungResult.config.freigeschaltet, durchfuehrungId: pruefungResult.config.durchfuehrungId, beendetUm: pruefungResult.config.beendetUm, teilnehmer: pruefungResult.config.teilnehmer }
        pruefungResult.fragen = eingebaut.fragen
      }

      if (pruefungResult?.fragen) setFragen(pruefungResult.fragen)
      // Config aus ladePruefung übernehmen (spart separaten ladeAlleConfigs-Call)
      if (pruefungResult?.config) {
        setConfig(pruefungResult.config)
        // Beendete Prüfung → direkt Auswertung-Tab anzeigen (statt Vorbereitung)
        // Nur wenn beendetUm gesetzt UND freigeschaltet (= nicht zurueckgesetzt fuer neue Durchfuehrung)
        if (pruefungResult.config.beendetUm && pruefungResult.config.freigeschaltet && !urlTab) {
          setActiveTab('auswertung')
        }
      }
      abgabenGeladen.current = true
    }
    ladeAbgabenUndFragen()
  }, [user, istDemoModus, pruefungId])

  // Config: Demo-Modus — Einrichtungsprüfung verwenden (kein hardcodiertes Demo-Config)
  useEffect(() => {
    if (!user || !pruefungId) return
    if (istDemoModus || pruefungId === 'demo') {
      setConfig({ ...einrichtungsPruefung, freigeschaltet: true })
    }
  }, [user, pruefungId, istDemoModus])

  // Config periodisch aktualisieren (leichtgewichtig via ladeEinzelConfig)
  // Nur in Vorbereitung/Lobby — dort ändert sich Config (Freischaltung, Teilnehmer)
  useEffect(() => {
    if (!user || !pruefungId || istDemoModus || pruefungId === 'demo') return
    if (phase !== 'vorbereitung' && phase !== 'lobby') return
    const ladeConfig = async () => {
      try {
        const found = await apiService.ladeEinzelConfig(pruefungId, user.email)
        if (found) setConfig(found)
      } catch { /* ignore */ }
    }
    // Nicht sofort laden — initialer Load kommt aus ladePruefung (oben)
    const interval = setInterval(ladeConfig, 30000)
    return () => clearInterval(interval)
  }, [user, pruefungId, istDemoModus, phase])

  // Phase-Wechsel → Tab automatisch vorwärts setzen
  useEffect(() => {
    const neuerTab = phaseZuTab(phase)
    if (tabIndex(neuerTab) > tabIndex(phaseZuTab(letztePhaseRef.current))) {
      setActiveTab(neuerTab)
    }
    letztePhaseRef.current = phase
  }, [phase])

  // Timer für aktive Phase
  useEffect(() => {
    if (phase !== 'aktiv') { setDauer(''); return }
    const updateDauer = () => setDauer(formatDauer(Date.now() - startTimestamp))
    updateDauer()
    const interval = setInterval(updateDauer, 1000)
    return () => clearInterval(interval)
  }, [phase, startTimestamp])

  // Tab wechseln + URL aktualisieren
  function wechsleTab(tab: DurchfuehrenTab) {
    if (!istTabVerfuegbar(tab, phase)) return
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }

  // Zurück zur Startseite
  const zurueck = () => {
    window.history.pushState({}, '', window.location.pathname)
    window.location.reload()
  }

  // Lade-Screens
  if (ladeStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Wird geladen...</p>
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
          <p className="text-slate-700 dark:text-slate-300 mb-4">Daten konnten nicht geladen werden.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={zurueck} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">← Zurück</button>
            <button onClick={ladeDaten} className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer">Erneut versuchen</button>
          </div>
        </div>
      </div>
    )
  }

  const titel = config?.titel || daten.pruefungTitel || pruefungId || (config?.typ === 'formativ' ? 'Übung' : 'Prüfung')

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <LPHeader
        titel={config?.typ === 'formativ' ? 'Übung durchführen' : 'Prüfung durchführen'}
        untertitel={`${titel}${istDemoModus ? ' (Demo)' : ''}`}
        zurueck={zurueck}
        aktionsButtons={
          <>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5
                ${autoRefresh
                  ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                  : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              Live
            </button>
            <button
              onClick={ladeDaten}
              className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ↻
            </button>
            {/* Timer in aktiver Phase */}
            {phase === 'aktiv' && dauer && (
              <span className="text-sm font-mono text-slate-600 dark:text-slate-300">⏱ {dauer}</span>
            )}
            {phase === 'beendet' && config?.beendetUm && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Beendet: {new Date(config.beendetUm).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </>
        }
        onFragensammlung={() => { setZeigHilfe(false); setZeigEinstellungen(false); setZeigFragenbank(!zeigFragenbank) }}
        onHilfe={() => { setZeigFragenbank(false); setZeigEinstellungen(false); setZeigHilfe(!zeigHilfe) }}
        onEinstellungen={() => { setZeigFragenbank(false); setZeigHilfe(false); setZeigEinstellungen(!zeigEinstellungen) }}
        fragensammlungOffen={zeigFragenbank}
        hilfeOffen={zeigHilfe}
      />

      {/* Flex-Row: Hauptinhalt + optionale Sidebar */}
      <div className="flex flex-1 overflow-hidden">
      {/* Scrollbarer Hauptinhalt */}
      <div className="flex-1 overflow-y-auto">

      {/* === Verbindungsfehler-Banner === */}
      {zeigeVerbindungsBanner && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-2 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>Verbindung unterbrochen — wird automatisch erneut versucht...</span>
        </div>
      )}

      {/* === Tab-Leiste === */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto w-full px-4 py-2">
          <TabBar
            tabs={TAB_CONFIG.map(({ key, label, icon }) => {
              const istAktuellePhase = phaseZuTab(phase) === key
              return {
                id: key,
                label: `${icon} ${label}`,
                disabled: !istTabVerfuegbar(key, phase),
                icon: istAktuellePhase && activeTab !== key
                  ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  : undefined,
              }
            })}
            activeTab={activeTab}
            onTabChange={(id) => wechsleTab(id as DurchfuehrenTab)}
            size="md"
          />
        </div>
      </div>

      {/* === Tab-Content === */}
      {config && (
        <div className="max-w-7xl mx-auto w-full px-4 py-4 space-y-4 flex-1">
          {/* Vorbereitung: hidden statt unmount, damit State erhalten bleibt bei "Zurück" */}
          <div className={activeTab === 'vorbereitung' ? '' : 'hidden'}>
            <VorbereitungPhase
              config={config}
              onTeilnehmerGesetzt={(teilnehmer) => {
                setConfig({ ...config, teilnehmer })
              }}
              onWeiterZurLobby={() => wechsleTab('lobby')}
              onConfigUpdate={async (updates) => {
                const neueConfig = { ...config, ...updates }
                setConfig(neueConfig)
                if (user && !istDemoModus && apiService.istKonfiguriert()) {
                  await apiService.speichereConfig(user.email, neueConfig)
                }
              }}
            />
          </div>

          {activeTab === 'lobby' && daten && (
            <LobbyPhase
              config={config}
              schuelerStatus={daten.schueler}
              freischaltenLaedt={freischaltenLaedt}
              onFreischalten={async () => {
                if (!user || freischaltenLaedt) return
                // Optimistic UI: sofort freigeschaltet anzeigen
                setFreischaltenLaedt(true)
                setConfig({ ...config, freigeschaltet: true })
                const erfolg = await apiService.schaltePruefungFrei(config.id, user.email)
                setFreischaltenLaedt(false)
                if (!erfolg) {
                  // Rollback bei Fehler
                  setConfig({ ...config, freigeschaltet: false })
                }
              }}
              onZurueck={async () => {
                if (user) {
                  await apiService.setzeTeilnehmer(user.email, config.id, [])
                  setConfig({ ...config, teilnehmer: [] })
                }
              }}
              onAkzeptieren={async (email, name) => {
                const neueTeilnehmer = [
                  ...(config.teilnehmer ?? []),
                  { email, name, vorname: '', klasse: '—', quelle: 'manuell' as const },
                ]
                if (user) {
                  await apiService.setzeTeilnehmer(user.email, config.id, neueTeilnehmer)
                  setConfig({ ...config, teilnehmer: neueTeilnehmer })
                }
              }}
              onEntfernen={async (email) => {
                const neueTeilnehmer = (config.teilnehmer ?? []).filter((t) => t.email !== email)
                if (user) {
                  await apiService.setzeTeilnehmer(user.email, config.id, neueTeilnehmer)
                  setConfig({ ...config, teilnehmer: neueTeilnehmer })
                }
              }}
            />
          )}

          {activeTab === 'live' && daten && (
            <AktivPhase
              config={config}
              schuelerStatus={gefilterteSchueler}
              startTimestamp={startTimestamp}
              onConfigUpdate={async (updates) => {
                const neueConfig = { ...config, ...updates }
                setConfig(neueConfig)
                if (user && !istDemoModus && apiService.istKonfiguriert()) {
                  await apiService.speichereConfig(user.email, neueConfig)
                }
              }}
              onBeenden={() => {
                // Config als beendet markieren → Phase wechselt sofort zu 'beendet'
                if (config) {
                  setConfig({ ...config, beendetUm: new Date().toISOString() })
                }
                ladeDaten()
              }}
            />
          )}

          {activeTab === 'auswertung' && daten && pruefungId && (
            <div className="space-y-4">
              {/* Ergebnis-Übersicht (Accordion) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setErgebnisOffen(!ergebnisOffen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span>⏹</span>
                    <span>Ergebnis-Übersicht</span>
                  </span>
                  <span className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${ergebnisOffen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {ergebnisOffen && (
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
                    <BeendetPhase
                      config={config}
                      schuelerStatus={gefilterteSchueler}
                      fragen={fragen}
                      abgaben={abgaben}
                      onExportieren={() => {
                        const csv = exportiereTeilnahmeCSV(config, gefilterteSchueler)
                        if (csv) {
                          const dateiname = `${config.titel || config.id}_Teilnahme_${new Date().toISOString().slice(0, 10)}.csv`
                          downloadCSV(csv, dateiname)
                        }
                      }}
                      onNeueDurchfuehrung={async () => {
                        if (!user) return
                        const erfolg = await apiService.resetPruefung(config.id, user.email)
                        if (erfolg) {
                          // Alles zurücksetzen: Phase-Tracking, Daten, Config
                          letztePhaseRef.current = 'vorbereitung'
                          abgabenGeladen.current = false
                          setDaten({ pruefungId: config.id, pruefungTitel: '', schueler: [], gesamtSus: 0, aktualisiert: new Date().toISOString() })
                          setAbgaben({})
                          setFragen([])
                          // Config zurücksetzen: lokal + Backend
                          // Kontrollstufe abhängig vom Prüfungstyp
                          const defaultKontrollStufe = config.typ === 'formativ' ? 'locker' as const : 'standard' as const
                          const resetConfig = {
                            ...config,
                            freigeschaltet: false,
                            beendetUm: undefined,
                            teilnehmer: [],
                            sebAusnahmen: [],
                            zeitverlaengerungen: {},
                            kontrollStufe: defaultKontrollStufe,
                            durchfuehrungId: crypto.randomUUID(),
                          }
                          setConfig(resetConfig)
                          // URL-Parameter ?tab=... löschen (verhindert Tab-Sprung zu Auswertung)
                          const url = new URL(window.location.href)
                          url.searchParams.delete('tab')
                          window.history.replaceState({}, '', url.toString())
                          setActiveTab('vorbereitung')
                          // Reset ans Backend senden, dann frische Config laden
                          try {
                            await apiService.speichereConfig(user!.email, resetConfig)
                          } catch { /* ignore — lokaler Reset greift trotzdem */ }
                          try {
                            const frisch = await apiService.ladeEinzelConfig(config.id, user!.email)
                            if (frisch) setConfig(frisch)
                          } catch { /* ignore */ }
                          ladeDaten()
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Korrektur-Dashboard (immer sichtbar) */}
              <KorrekturDashboard pruefungId={pruefungId} eingebettet config={config} />
            </div>
          )}
        </div>
      )}

      {/* Config noch nicht geladen */}
      {!config && (
        <div className="max-w-7xl mx-auto w-full px-4 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            Prüfungskonfiguration wird geladen…
          </p>
        </div>
      )}

      </div>{/* Ende Scrollbarer Hauptinhalt */}

      {/* Einstellungen Sidebar */}
      {zeigEinstellungen && (
        <EinstellungenPanel onSchliessen={() => setZeigEinstellungen(false)} />
      )}
      </div>{/* Ende Flex-Row */}

      {/* Fragenbank Overlay */}
      {zeigFragenbank && (
        <FragenBrowser
          onHinzufuegen={() => {}}
          onSchliessen={() => setZeigFragenbank(false)}
          bereitsVerwendet={[]}
        />
      )}

      {/* Hilfe Overlay */}
      {zeigHilfe && (
        <HilfeSeite onSchliessen={() => setZeigHilfe(false)} />
      )}
    </div>
  )
}
