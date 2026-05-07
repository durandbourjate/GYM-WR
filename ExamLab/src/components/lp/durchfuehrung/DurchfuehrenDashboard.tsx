import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { TabBar } from '../../ui/TabBar'
import DurchfuehrenVorbereitungSkeleton from '../skeletons/DurchfuehrenVorbereitungSkeleton'
import DurchfuehrenSusReihenSkeleton from '../skeletons/DurchfuehrenSusReihenSkeleton'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { schreibeGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'
import type { PruefungsNachricht } from '../../../types/monitoring.ts'
import { LPAppHeaderContainer } from '../LPAppHeaderContainer'
import EinstellungenPanel from '../../settings/EinstellungenPanel.tsx'
import FragenBrowser from '../fragensammlung/FragenBrowser.tsx'
import HilfeSeite from '../HilfeSeite.tsx'
import type { PruefungsPhase } from '../../../types/monitoring'
import { bestimmePhase } from '../../../utils/phase'
import { exportiereTeilnahmeCSV, downloadCSV } from '../../../utils/exportUtils'
import VorbereitungPhase from '../vorbereitung/VorbereitungPhase'
import LobbyPhase from './LobbyPhase'
import AktivPhase from './AktivPhase'
import BeendetPhase from './BeendetPhase'
import KorrekturDashboard from '../korrektur/KorrekturDashboard'
import { useDurchfuehrenMonitoring } from '../../../hooks/useDurchfuehrenMonitoring'
import { useDurchfuehrenLoad } from '../../../hooks/useDurchfuehrenLoad'
import {
  useDurchfuehrenPhasenTab,
  phaseZuTab,
  istTabVerfuegbar,
  normalisiereUrlTab,
  type DurchfuehrenTab,
} from '../../../hooks/useDurchfuehrenPhasenTab'

const TAB_CONFIG: { key: DurchfuehrenTab; label: string; icon: string }[] = [
  { key: 'vorbereitung', label: 'Vorbereitung', icon: '⚙️' },
  { key: 'lobby', label: 'Lobby', icon: '🟡' },
  { key: 'live', label: 'Live', icon: '🟢' },
  { key: 'auswertung', label: 'Auswertung', icon: '✏️' },
]

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

  // urlTab: synchron aus location lesen (kein State, einmal pro Render OK)
  const urlTab = normalisiereUrlTab(new URLSearchParams(window.location.search).get('tab'))

  // Phase als useState statt per-render-Computation, damit alle Hook-Inputs reaktiv sind.
  // Ohne das gibt es Hook-Input-Zirkularität: phase aus config+daten (Load+Monitoring),
  // aber die brauchen phase selbst. useState + Sync-Effect löst das sauber.
  const [phase, setPhase] = useState<PruefungsPhase>('vorbereitung')

  // Hook-Reihenfolge: PhasenTab → Load → Monitoring
  //   PhasenTab muss vor Load kommen, weil Load setActiveTab als Argument braucht.
  const { activeTab, setActiveTab, wechsleTab } = useDurchfuehrenPhasenTab({ phase, urlTab, user, pruefungId })
  const { abgaben, setAbgaben, fragen, setFragen, config, setConfig, abgabenGeladenRef } =
    useDurchfuehrenLoad({ user, pruefungId, istDemoModus, phase, urlTab, setActiveTab })
  const { daten, ladeStatus, autoRefresh, setAutoRefresh, zeigeVerbindungsBanner, ladeDaten, setDaten } =
    useDurchfuehrenMonitoring({ user, pruefungId, istDemoModus, phase })

  // Phase-Sync: ersetzt die alte per-render-Computation.
  useEffect(() => {
    const neuePhase: PruefungsPhase = config && daten ? bestimmePhase(config, daten.schueler) : 'vorbereitung'
    setPhase(neuePhase)
  }, [config, daten])

  // Data-State (aus MonitoringDashboard)
  const [zeigFragenbank, setZeigFragenbank] = useState(false)
  const [zeigHilfe, setZeigHilfe] = useState(false)
  const [zeigEinstellungen, setZeigEinstellungen] = useState(false)

  // Nachrichten (LP → SuS)
  const [_nachrichten, setNachrichten] = useState<PruefungsNachricht[]>([])

  // Auswertung: Ergebnis-Übersicht Accordion (offen wenn keine Korrektur gestartet)
  const [ergebnisOffen, setErgebnisOffen] = useState(true)

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

  // G.f.2 — letzter geschriebener Wert für localStorage-Persist (verhindert redundante Writes)
  const letzteGeschriebeneAnzahlRef = useRef<number | null>(null)

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

  // G.f.2 — SuS-Anzahl pro pruefungId persistieren für layout-akkurates Skeleton
  useEffect(() => {
    if (ladeStatus !== 'fertig' || !pruefungId) return
    const anzahl = daten?.schueler?.length ?? 0
    if (anzahl <= 0) return
    if (letzteGeschriebeneAnzahlRef.current === anzahl) return
    schreibeGespeicherteAnzahl(`examlab-lp-letzte-sus-anzahl-${pruefungId}`, anzahl)
    letzteGeschriebeneAnzahlRef.current = anzahl
  }, [ladeStatus, daten?.schueler?.length, pruefungId])

  // Timer für aktive Phase
  useEffect(() => {
    if (phase !== 'aktiv') { setDauer(''); return }
    const updateDauer = () => setDauer(formatDauer(Date.now() - startTimestamp))
    updateDauer()
    const interval = setInterval(updateDauer, 1000)
    return () => clearInterval(interval)
  }, [phase, startTimestamp])

  // Zurück zur Startseite
  const zurueck = () => {
    window.history.pushState({}, '', window.location.pathname)
    window.location.reload()
  }

  // Skeleton- vs. Voll-Layout entscheiden — bei 'laden' zeigt Tab-Content den Skeleton
  const istLadenOderConfigFehlt = ladeStatus === 'laden' || !config

  // Tab-spezifischer Skeleton — als Variable, damit der JSX-Switch unten 1-stufig bleibt (code-quality.md)
  const tabSkeleton = activeTab === 'vorbereitung'
    ? <DurchfuehrenVorbereitungSkeleton />
    : <DurchfuehrenSusReihenSkeleton pruefungId={pruefungId} />

  // Fehler-Screen nur bei explizitem Fehler-Status (oder daten=null nach erfolgreichem Lade-Abschluss)
  if (ladeStatus === 'fehler' || (ladeStatus === 'fertig' && !daten)) {
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

  const titel = config?.titel || daten?.pruefungTitel || pruefungId || (config?.typ === 'formativ' ? 'Übung' : 'Prüfung')

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <LPAppHeaderContainer
        onHilfe={() => { setZeigFragenbank(false); setZeigEinstellungen(false); setZeigHilfe(!zeigHilfe) }}
        onEinstellungen={() => { setZeigFragenbank(false); setZeigHilfe(false); setZeigEinstellungen(!zeigEinstellungen) }}
        onZurueck={zurueck}
        untertitel={`${titel}${istDemoModus ? ' (Demo)' : ''}`}
        aktionsButtons={
          <>
            <button
              disabled={istLadenOderConfigFehlt}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
                istLadenOderConfigFehlt ? 'cursor-not-allowed opacity-50 border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500' :
                autoRefresh
                  ? 'cursor-pointer bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                  : 'cursor-pointer border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${autoRefresh && !istLadenOderConfigFehlt ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              Live
            </button>
            <button
              disabled={istLadenOderConfigFehlt}
              onClick={ladeDaten}
              className={`px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg transition-colors ${
                istLadenOderConfigFehlt ? 'cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-500'
                                        : 'cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              ↻
            </button>
            {/* Timer in aktiver Phase — bleibt unverändert */}
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
                disabled: istLadenOderConfigFehlt || !istTabVerfuegbar(key, phase),
                icon: !istLadenOderConfigFehlt && istAktuellePhase && activeTab !== key
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
      <div className="max-w-7xl mx-auto w-full px-4 py-4 space-y-4 flex-1">
        {ladeStatus === 'laden' ? tabSkeleton : !config ? (
          /* Lade fertig, aber Config fehlt — Inline-Hinweis (verhindert Endlos-Skeleton) */
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Prüfungskonfiguration konnte nicht geladen werden.
            </p>
            <button
              onClick={ladeDaten}
              className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Erneut versuchen
            </button>
          </div>
        ) : (
          /* Echter Tab-Content — config UND daten sind hier garantiert da */
          <>
            {/* Vorbereitung: hidden statt unmount, damit State erhalten bleibt bei "Zurück" */}
            <div className={activeTab === 'vorbereitung' ? '' : 'hidden'}>
              <VorbereitungPhase
                config={config!}
                onTeilnehmerGesetzt={(teilnehmer) => {
                  setConfig({ ...config!, teilnehmer })
                }}
                onWeiterZurLobby={() => wechsleTab('lobby')}
                onConfigUpdate={async (updates) => {
                  const neueConfig = { ...config!, ...updates }
                  setConfig(neueConfig)
                  if (user && !istDemoModus && apiService.istKonfiguriert()) {
                    await apiService.speichereConfig(user.email, neueConfig)
                  }
                }}
              />
            </div>

            {activeTab === 'lobby' && daten && (
              <LobbyPhase
                config={config!}
                schuelerStatus={daten.schueler}
                freischaltenLaedt={freischaltenLaedt}
                onFreischalten={async () => {
                  if (!user || freischaltenLaedt) return
                  // Optimistic UI: sofort freigeschaltet anzeigen
                  setFreischaltenLaedt(true)
                  setConfig({ ...config!, freigeschaltet: true })
                  const erfolg = await apiService.schaltePruefungFrei(config!.id, user.email)
                  setFreischaltenLaedt(false)
                  if (!erfolg) {
                    // Rollback bei Fehler
                    setConfig({ ...config!, freigeschaltet: false })
                  }
                }}
                onZurueck={async () => {
                  if (user) {
                    await apiService.setzeTeilnehmer(user.email, config!.id, [])
                    setConfig({ ...config!, teilnehmer: [] })
                  }
                }}
                onAkzeptieren={async (email, name) => {
                  const neueTeilnehmer = [
                    ...(config!.teilnehmer ?? []),
                    { email, name, vorname: '', klasse: '—', quelle: 'manuell' as const },
                  ]
                  if (user) {
                    await apiService.setzeTeilnehmer(user.email, config!.id, neueTeilnehmer)
                    setConfig({ ...config!, teilnehmer: neueTeilnehmer })
                  }
                }}
                onEntfernen={async (email) => {
                  const neueTeilnehmer = (config!.teilnehmer ?? []).filter((t) => t.email !== email)
                  if (user) {
                    await apiService.setzeTeilnehmer(user.email, config!.id, neueTeilnehmer)
                    setConfig({ ...config!, teilnehmer: neueTeilnehmer })
                  }
                }}
              />
            )}

            {activeTab === 'live' && daten && (
              <AktivPhase
                config={config!}
                schuelerStatus={gefilterteSchueler}
                startTimestamp={startTimestamp}
                onConfigUpdate={async (updates) => {
                  const neueConfig = { ...config!, ...updates }
                  setConfig(neueConfig)
                  if (user && !istDemoModus && apiService.istKonfiguriert()) {
                    await apiService.speichereConfig(user.email, neueConfig)
                  }
                }}
                onBeenden={() => {
                  // Config als beendet markieren → Phase wechselt sofort zu 'beendet'
                  if (config) {
                    setConfig({ ...config!, beendetUm: new Date().toISOString() })
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
                        config={config!}
                        schuelerStatus={gefilterteSchueler}
                        fragen={fragen}
                        abgaben={abgaben}
                        onExportieren={() => {
                          const csv = exportiereTeilnahmeCSV(config!, gefilterteSchueler)
                          if (csv) {
                            const dateiname = `${config!.titel || config!.id}_Teilnahme_${new Date().toISOString().slice(0, 10)}.csv`
                            downloadCSV(csv, dateiname)
                          }
                        }}
                        onNeueDurchfuehrung={async () => {
                          if (!user) return
                          const erfolg = await apiService.resetPruefung(config!.id, user.email)
                          if (erfolg) {
                            // Alles zurücksetzen: Daten, Config
                            // (Phase-Tracking-Reset entfällt — letztePhaseRef ist jetzt im
                            // useDurchfuehrenPhasenTab-Hook gekapselt; der hook-interne
                            // Phase-Watch-Effect verarbeitet den 'beendet'→'vorbereitung'-Wechsel
                            // automatisch ohne Auto-Forward, weil idx 0 ≤ idx 3.)
                            abgabenGeladenRef.current = false
                            setDaten({ pruefungId: config!.id, pruefungTitel: '', schueler: [], gesamtSus: 0, aktualisiert: new Date().toISOString() })
                            setAbgaben({})
                            setFragen([])
                            // Config zurücksetzen: lokal + Backend
                            // Kontrollstufe abhängig vom Prüfungstyp
                            const defaultKontrollStufe = config!.typ === 'formativ' ? 'locker' as const : 'standard' as const
                            const resetConfig = {
                              ...config!,
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
                              const frisch = await apiService.ladeEinzelConfig(config!.id, user!.email)
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
                <KorrekturDashboard pruefungId={pruefungId} eingebettet config={config!} />
              </div>
            )}
          </>
        )}
      </div>

      </div>{/* Ende Scrollbarer Hauptinhalt */}

      {/* Einstellungen Sidebar */}
      {zeigEinstellungen && (
        <EinstellungenPanel onSchliessen={() => setZeigEinstellungen(false)} />
      )}
      </div>{/* Ende Flex-Row */}

      {/* Fragensammlung Overlay */}
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
