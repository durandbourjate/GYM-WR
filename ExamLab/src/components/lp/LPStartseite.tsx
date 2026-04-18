import { useState, useEffect, useMemo, Suspense } from 'react'
import { lazyMitRetry } from '../../utils/lazyMitRetry'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.ts'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore.ts'
import { useFragenbankStore } from '../../store/fragenbankStore.ts'
import { useStammdatenStore } from '../../store/stammdatenStore.ts'
import { useLPNavigationStore } from '../../store/lpUIStore.ts'
import { useFavoritenStore } from '../../store/favoritenStore.ts'
import { useLPRouteSync } from '../../hooks/useLPRouteSync.ts'
import { useLPNavigation } from '../../hooks/useLPNavigation.ts'
import { apiService } from '../../services/apiService.ts'
import type { PruefungsConfig } from '../../types/pruefung.ts'
import type { TrackerDaten, TrackerPruefungSummary } from '../../types/tracker.ts'
import { formatDatum } from '../../utils/zeit.ts'
import { getFachFarbe } from '../../utils/ueben/fachFarben.ts'
import { bestimmePruefungsStatus, statusLabel, statusFarbe, korrekturLabel, erstelleDemoTrackerDaten } from '../../utils/trackerUtils.ts'
import { LPAppHeaderContainer } from './LPAppHeaderContainer'
import LPSkeleton from './LPSkeleton.tsx'
import UebungsToolView from './UebungsToolView.tsx'
import TrackerSection from './TrackerSection.tsx'
import { einrichtungsPruefung } from '../../data/einrichtungsPruefung.ts'
import { einrichtungsFragen } from '../../data/einrichtungsFragen.ts'
import { einrichtungsUebung } from '../../data/einrichtungsUebung.ts'
import { einrichtungsUebungFragen } from '../../data/einrichtungsUebungFragen.ts'
import { speichereConfig, speichereFrage } from '../../services/fragenbankApi.ts'
import { MultiDurchfuehrenDashboard } from './durchfuehrung/MultiDurchfuehrenDashboard.tsx'
import DurchfuehrenDashboard from './durchfuehrung/DurchfuehrenDashboard.tsx'
import Button from '../ui/Button.tsx'

import { leereUebung } from './vorbereitung/configVorlagen'

// Lazy-loaded Komponenten: Werden erst bei Bedarf geladen (spart ~400KB beim Initial Load)
// lazyMitRetry: bei Chunk-Hash-Mismatch nach Deploy automatischer Page-Reload.
const PruefungsComposer = lazyMitRetry(() => import('./vorbereitung/PruefungsComposer.tsx'))
const FragenBrowser = lazyMitRetry(() => import('./fragenbank/FragenBrowser.tsx'))
const HilfeSeite = lazyMitRetry(() => import('./HilfeSeite.tsx'))
const EinstellungenPanel = lazyMitRetry(() => import('../settings/EinstellungenPanel.tsx'))
const AnalyseDashboard = lazyMitRetry(() => import('./ueben/AnalyseDashboard.tsx'))

/** Startseite für Lehrpersonen: Prüfungen verwalten + erstellen */
export default function LPStartseite() {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Multi-Dashboard: ?ids=abc,def → Vollbild-Dashboard für mehrere Prüfungen
  const multiIds = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('ids')?.split(',').filter(Boolean) ?? []
  }, [])
  if (multiIds.length > 1) {
    return <MultiDurchfuehrenDashboard pruefungIds={multiIds} />
  }

  // Einzel-Durchführen: ?id=X → DurchfuehrenDashboard (Start/Lobby/Monitoring/Korrektur
  // je nach Phase). Wird von den Karten-Buttons "Prüfung starten"/"Übung starten"/
  // "Auswerten" aufgerufen (LPStartseite.PruefungsKarte → <a href={pathname}?id={id}>).
  const singleId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('id')
  }, [])
  if (singleId) {
    return <DurchfuehrenDashboard pruefungId={singleId} />
  }

  // Navigation aus dem Store
  const ansicht = useLPNavigationStore(s => s.ansicht)
  const modus = useLPNavigationStore(s => s.modus)
  const listenTab = useLPNavigationStore(s => s.listenTab)
  const uebungsTab = useLPNavigationStore(s => s.uebungsTab)
  const zeigHilfe = useLPNavigationStore(s => s.zeigHilfe)
  const zeigEinstellungen = useLPNavigationStore(s => s.zeigEinstellungen)
  const composerKey = useLPNavigationStore(s => s.composerKey)
  // Navigation via React Router (URL-basiert)
  const {
    setModus,
    zurueckZumDashboard,
    navigiereZuComposer,
  } = useLPNavigation()

  // UI-State bleibt im Store (Panels, Keys)
  const neuerComposerKey = useLPNavigationStore(s => s.neuerComposerKey)

  // Bundle 13 I: URL-basierte Kurs-Auswahl für Üben-Übungen
  const navigate = useNavigate()
  const { kursId: urlKursId } = useParams<{ kursId?: string }>()
  const gruppen = useUebenGruppenStore(s => s.gruppen)
  const aktiverKursId = urlKursId
  const aktiverKurs = useMemo(
    () => gruppen.find(g => g.id === aktiverKursId),
    [gruppen, aktiverKursId]
  )

  // Invaliden Kurs → Redirect auf erste Gruppe + Toast
  const [kursNichtGefundenToast, setKursNichtGefundenToast] = useState<string | null>(null)
  useEffect(() => {
    if (urlKursId && !aktiverKurs && gruppen.length > 0) {
      const zielName = gruppen[0].name
      navigate(`/uebung/kurs/${gruppen[0].id}`, { replace: true })
      setKursNichtGefundenToast(`Kurs "${urlKursId}" nicht gefunden — zu ${zielName} umgeleitet`)
    }
  }, [urlKursId, aktiverKurs, gruppen, navigate])

  // Toast nach 4s automatisch ausblenden
  useEffect(() => {
    if (!kursNichtGefundenToast) return
    const t = setTimeout(() => setKursNichtGefundenToast(null), 4000)
    return () => clearTimeout(t)
  }, [kursNichtGefundenToast])

  // localStorage: letzten Kurs merken
  useEffect(() => {
    if (aktiverKursId) {
      try { localStorage.setItem('examlab-ueben-letzter-kurs', aktiverKursId) } catch { /* */ }
    }
  }, [aktiverKursId])
  const toggleHilfe = useLPNavigationStore(s => s.toggleHilfe)
  const toggleEinstellungen = useLPNavigationStore(s => s.toggleEinstellungen)
  const setZeigEinstellungen = useLPNavigationStore(s => s.setZeigEinstellungen)

  // Lokaler State (Daten, nicht Navigation)
  const [configs, setConfigs] = useState<PruefungsConfig[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [backendFehler, setBackendFehler] = useState(false)
  const [editConfig, setEditConfig] = useState<PruefungsConfig | null>(null)
  const [multiDashboardOffen, setMultiDashboardOffen] = useState(false)
  const [multiDashboardAuswahl, setMultiDashboardAuswahl] = useState<Set<string>>(new Set())
  const [trackerDaten, setTrackerDaten] = useState<TrackerDaten | null>(null)

  // Such- und Filterstate
  const [suchtext, setSuchtext] = useState('')
  const [filterFach, setFilterFach] = useState<string[]>([])
  const [filterTyp, setFilterTyp] = useState<string | null>(null)
  const [filterGefaess, setFilterGefaess] = useState<string | null>(null)
  const [sortierung, setSortierung] = useState<'datum' | 'titel' | 'klasse'>('datum')
  const [filterStatus, setFilterStatus] = useState<'alle' | 'aktiv' | 'archiviert'>('aktiv')

  const hatAktiveFilter = suchtext.length > 0 || filterFach.length > 0 || filterTyp !== null || filterGefaess !== null || filterStatus !== 'aktiv'

  // Verfügbare Fachbereiche und Gefässe dynamisch aus configs
  const verfuegbareFachbereiche = useMemo(() => {
    const faecher = new Set<string>()
    for (const c of configs) for (const fb of c.fachbereiche) faecher.add(fb)
    return [...faecher].sort()
  }, [configs])

  const verfuegbareGefaesse = useMemo(() => {
    const gefaesse = new Set<string>()
    for (const c of configs) if (c.gefaess) gefaesse.add(c.gefaess)
    return [...gefaesse].sort()
  }, [configs])

  // Generische Filter-Funktion für Configs (Prüfungen + Übungen)
  function filtereConfigs(basisConfigs: PruefungsConfig[]): PruefungsConfig[] {
    let result = [...basisConfigs]
    // Status-Filter (Archiv)
    if (filterStatus === 'aktiv') {
      result = result.filter(c => !c.beendetUm)
    } else if (filterStatus === 'archiviert') {
      result = result.filter(c => !!c.beendetUm)
    }
    // Suche
    if (suchtext) {
      const q = suchtext.toLowerCase()
      result = result.filter(c =>
        c.titel.toLowerCase().includes(q) ||
        c.klasse.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    }
    // Fachbereich
    if (filterFach.length > 0) {
      result = result.filter(c => filterFach.some(f => c.fachbereiche.includes(f)))
    }
    // Typ
    if (filterTyp) {
      result = result.filter(c => c.typ === filterTyp)
    }
    // Gefäss
    if (filterGefaess) {
      result = result.filter(c => c.gefaess === filterGefaess)
    }
    // Sortierung
    result.sort((a, b) => {
      if (sortierung === 'datum') return b.datum.localeCompare(a.datum)
      if (sortierung === 'titel') return a.titel.localeCompare(b.titel)
      return a.klasse.localeCompare(b.klasse)
    })
    return result
  }

  // Gefilterte Prüfungen (summativ)
  const summativeConfigs = useMemo(() => configs.filter(c => c.typ !== 'formativ'), [configs])
  const gefilterteConfigs = useMemo(() => filtereConfigs(summativeConfigs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summativeConfigs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus])

  // Gefilterte Übungen (formativ)
  const formativeConfigs = useMemo(() => configs.filter(c => c.typ === 'formativ'), [configs])
  const gefilterteUebungen = useMemo(() => filtereConfigs(formativeConfigs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formativeConfigs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus])

  // Favoriten aus dem neuen Store
  const favoriten = useFavoritenStore(s => s.favoriten)
  const aktiveConfigId = useLPNavigationStore(s => s.aktiveConfigId)
  const deepLinkFrageId = useLPNavigationStore(s => s.deepLinkFrageId)
  const clearDeepLinkFrageId = useLPNavigationStore(s => s.clearDeepLinkFrageId)

  // Favoriten-Configs (nur existierende IDs, nach Datum sortiert)
  const favoritenConfigIds = useMemo(() => new Set(
    favoriten.filter(f => f.typ === 'pruefung' || f.typ === 'uebung').map(f => f.ziel)
  ), [favoriten])
  const favoritenConfigs = useMemo(() => {
    if (favoritenConfigIds.size === 0) return []
    return configs.filter(c => favoritenConfigIds.has(c.id)).sort((a, b) => b.datum.localeCompare(a.datum))
  }, [configs, favoritenConfigIds])

  // Favoriten-Prüfungen und -Übungen getrennt
  const favoritenPruefungen = useMemo(() => favoritenConfigs.filter(c => c.typ !== 'formativ'), [favoritenConfigs])
  const favoritenUebungen = useMemo(() => favoritenConfigs.filter(c => c.typ === 'formativ'), [favoritenConfigs])

  // Letzte 5 (nach Datum, nur ohne aktive Filter)
  const letzteFuenf = useMemo(() => {
    if (hatAktiveFilter || summativeConfigs.length <= 5) return []
    return [...summativeConfigs].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 5)
  }, [summativeConfigs, hatAktiveFilter])

  function toggleFachFilter(fach: string): void {
    setFilterFach(prev => prev.includes(fach) ? prev.filter(f => f !== fach) : [...prev, fach])
  }

  // Einrichtungsprüfung ins Backend synchronisieren (einmalig)
  // localStorage-Guard verhindert Duplikate bei Reloads
  const SYNC_KEY = 'einrichtung-sync-v5'
  const SYNC_VERSION = `${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}-${einrichtungsFragen.length}`

  /** Sync-Helper: Fragen einzeln (seriell) speichern um Backend nicht zu überlasten.
   *  Vorher: 5er-Batches parallel → 10+ gleichzeitige Requests → Backend-Stau.
   *  Jetzt: 1 Request nach dem anderen, mit 200ms Pause dazwischen. */
  async function syncFragenSeriell(email: string, fragen: typeof einrichtungsFragen): Promise<void> {
    for (const frage of fragen) {
      await speichereFrage(email, frage)
      // Kleine Pause um Backend nicht zu überlasten
      await new Promise(r => setTimeout(r, 200))
    }
  }

  async function syncEinrichtungsPruefung(email: string, _backendConfigs: PruefungsConfig[]): Promise<void> {
    // Guard: Nur localStorage-basiert (Backend-Check entfernt — Config kann
    // im Backend existieren während Fragen fehlen)
    try { if (localStorage.getItem(SYNC_KEY) === SYNC_VERSION) return } catch { /* ignore */ }

    console.log('[LP] Einrichtungsprüfung sync starten...')
    try {
      // Config speichern
      await speichereConfig(email, { ...einrichtungsPruefung, erstelltVon: email })
      // Fragen seriell speichern (verhindert Backend-Überlastung)
      await syncFragenSeriell(email, einrichtungsFragen)
      // Guard setzen — nicht nochmal syncen
      try { localStorage.setItem(SYNC_KEY, SYNC_VERSION) } catch { /* ignore */ }
      console.log(`[LP] Einrichtungsprüfung sync fertig (${einrichtungsFragen.length} Fragen)`)
    } catch (error) {
      console.error('[LP] Einrichtungsprüfung sync fehlgeschlagen:', error)
    }
  }

  // Einführungsübung ins Backend synchronisieren (einmalig)
  const UEBUNG_SYNC_KEY = 'einrichtung-uebung-sync-v5'
  const UEBUNG_SYNC_VERSION = `${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}-${einrichtungsUebungFragen.length}`

  async function syncEinrichtungsUebung(email: string, _backendConfigs: PruefungsConfig[]): Promise<void> {
    // Guard: Nur localStorage-basiert (Backend-Check entfernt — Punktzahl allein
    // reicht nicht, da Config stimmen kann aber Fragen fehlen)
    try { if (localStorage.getItem(UEBUNG_SYNC_KEY) === UEBUNG_SYNC_VERSION) return } catch { /* ignore */ }

    console.log('[LP] Einführungsübung sync starten...')
    try {
      await speichereConfig(email, { ...einrichtungsUebung, erstelltVon: email })
      // Fragen seriell speichern (verhindert Backend-Überlastung)
      await syncFragenSeriell(email, einrichtungsUebungFragen)
      try { localStorage.setItem(UEBUNG_SYNC_KEY, UEBUNG_SYNC_VERSION) } catch { /* ignore */ }
      console.log(`[LP] Einführungsübung sync fertig (${einrichtungsUebungFragen.length} Fragen)`)
    } catch (error) {
      console.error('[LP] Einführungsübung sync fehlgeschlagen:', error)
    }
  }

  // Alle Prüfungs-Configs + Tracker-Daten laden
  useEffect(() => {
    async function lade(): Promise<void> {
      if (!user) return

      if (istDemoModus || !apiService.istKonfiguriert()) {
        // Demo-Daten
        setConfigs(demoConfigs())
        setTrackerDaten(erstelleDemoTrackerDaten())
        setLadeStatus('fertig')
        return
      }

      // Stammdaten + LP-Profil parallel laden (Fire-and-forget, blockiert nicht)
      const { ladeStammdaten, ladeLPProfil } = useStammdatenStore.getState()
      ladeStammdaten(user.email)
      ladeLPProfil(user.email).then(() => {
        // Backend-Favoriten in den neuen favoritenStore übernehmen (Legacy-Migration)
        const profil = useStammdatenStore.getState().lpProfil
        if (profil?.favoriten && profil.favoriten.length > 0) {
          const { favoriten: lokal } = useFavoritenStore.getState()
          if (lokal.length === 0) {
            // Nur migrieren wenn lokal leer (Erstmigration)
            const migriert = profil.favoriten.map((f: { id?: string; titel?: string; screen?: string; params?: { configId?: string } }, i: number) => ({
              typ: (f.params?.configId ? (f.screen === 'uebung' ? 'uebung' : 'pruefung') : 'ort') as 'ort' | 'pruefung' | 'uebung' | 'frage',
              ziel: f.params?.configId ?? `/${f.screen ?? 'pruefung'}`,
              label: f.titel || '',
              sortierung: i,
            }))
            useFavoritenStore.setState({ favoriten: migriert })
          }
        }
      })

      // Configs + Fragenbank-Summaries parallel laden (schnell ~3-5s)
      // TrackerDaten separat im Hintergrund (langsam ~6-8s, blockiert UI nicht)
      useFragenbankStore.getState().lade(user.email)
      const configResult = await apiService.ladeAlleConfigs(user.email)

      if (configResult) {
        setConfigs(configResult)
        setBackendFehler(false)
        // Einrichtungsprüfung/-übung: nur einmal pro Browser-Session syncen
        // WICHTIG: Verzögert + seriell um Backend nicht zu überlasten (Session 91 Fix)
        // Nicht starten wenn LP gerade eine Durchführung hat (SuS-Saves haben Priorität)
        const SYNC_DONE_KEY = 'examlab-sync-done'
        const istDurchfuehrung = window.location.search.includes('id=')
        if (!sessionStorage.getItem(SYNC_DONE_KEY) && !istDurchfuehrung) {
          // 10s Verzögerung damit Dashboard-Laden + LP-Monitoring Vorrang haben
          setTimeout(async () => {
            try {
              // Seriell: erst Prüfung, dann Übung (nicht parallel!)
              await syncEinrichtungsPruefung(user.email, configResult)
              await syncEinrichtungsUebung(user.email, configResult)
              sessionStorage.setItem(SYNC_DONE_KEY, '1')
              const neueConfigs = await apiService.ladeAlleConfigs(user.email)
              if (neueConfigs) setConfigs(neueConfigs)
            } catch (err) {
              console.warn('[LP] Sync fehlgeschlagen, wird beim nächsten Mount erneut versucht:', err)
            }
          }, 10_000)
        }
      } else {
        console.warn("[LP] Configs nicht ladbar — Composer bleibt nutzbar")
        setConfigs([])
        setBackendFehler(true)
      }

      // Dashboard sofort interaktiv zeigen (Tracker lädt im Hintergrund)
      setLadeStatus("fertig")

      // TrackerDaten im Hintergrund nachladen (non-blocking, ~6-8s)
      apiService.ladeTrackerDaten(user.email).then(trackerResult => {
        if (trackerResult) setTrackerDaten(trackerResult)
      }).catch(err => console.warn('[LP] Tracker-Laden fehlgeschlagen:', err))
    }
    lade()
  }, [user, istDemoModus])

  // URL → Store Sync (ersetzt den alten hashchange-Listener)
  useLPRouteSync()

  // Deep Link: Config via aktiveConfigId öffnen (nachdem Configs geladen)
  // aktiveConfigId wird per useLPRouteSync aus der URL gesetzt
  useEffect(() => {
    if (ladeStatus !== 'fertig' || !aktiveConfigId || ansicht === 'composer') return
    const config = configs.find(c => c.id === aktiveConfigId)
    if (!config) return
    setEditConfig(config)
    // navigiereZuComposer nicht nötig — URL ist bereits korrekt (Router hat hierher navigiert)
    useLPNavigationStore.getState().navigiereZuComposer(config.titel || 'Bearbeiten', config.id)
  }, [ladeStatus, aktiveConfigId, configs])

  function handleNeue(): void {
    setEditConfig(null)
    navigiereZuComposer('Neue Prüfung')
  }

  function handleNeueUebung(): void {
    setEditConfig({ ...leereUebung })
    neuerComposerKey()
    navigiereZuComposer('Neue Übung')
  }

  function handleBearbeiten(config: PruefungsConfig): void {
    setEditConfig(config)
    navigiereZuComposer(config.titel || 'Bearbeiten', config.id)
  }

  function handleDuplizieren(config: PruefungsConfig): void {
    const kopie: PruefungsConfig = {
      ...config,
      id: '',
      titel: `${config.titel} (Kopie)`,
      datum: new Date().toISOString().split('T')[0],
      freigeschaltet: false,
      erlaubteKlasse: '',
      teilnehmer: [],
      beendetUm: undefined,
      durchfuehrungId: undefined,
      zeitverlaengerungen: {},
      sebAusnahmen: [],
    }
    setEditConfig(kopie)
    neuerComposerKey()
    navigiereZuComposer(`${config.titel} (Kopie)`)
  }

  function handleZurueck(): void {
    zurueckZumDashboard()
    // Configs neu laden
    setLadeStatus('laden')
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      apiService.ladeAlleConfigs(user.email).then((result) => {
        if (result) setConfigs(result)
        setLadeStatus('fertig')
      })
    } else {
      setConfigs(demoConfigs())
      setLadeStatus('fertig')
    }
  }

  // pruefungsUrl(id) wird von Durchführen-Link verwendet (→ DurchfuehrenDashboard)
  // const pruefungsUrl = (id: string) => `${window.location.origin}${window.location.pathname}?id=${id}`

  // Tracker-Summary für eine Prüfung finden (nach ID matchen)
  function findeTrackerSummary(pruefungId: string): TrackerPruefungSummary | undefined {
    if (!trackerDaten) return undefined
    return trackerDaten.pruefungen.find((p) => p.pruefungId === pruefungId)
  }

  // Skeleton während Laden — nicht beim Composer (direkter Aufruf möglich)
  if (ladeStatus !== 'fertig' && ansicht !== 'composer') return <LPSkeleton />

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header nur im Dashboard-Modus — Composer hat eigenen Header */}
      {ansicht !== 'composer' && (
        <LPAppHeaderContainer
          onHilfe={toggleHilfe}
          onFeedback={() => {}}
          onEinstellungen={() => toggleEinstellungen()}
        />
      )}

      {/* Toast: Kurs nicht gefunden */}
      {kursNichtGefundenToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 bg-amber-50 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 px-4 py-2 rounded-lg shadow-lg text-sm max-w-sm animate-in fade-in"
        >
          <span className="mr-2">⚠️</span>{kursNichtGefundenToast}
        </div>
      )}

      {/* Flex-Row: Hauptinhalt + optionale Sidebar */}
      <div className="flex flex-1 overflow-hidden">
      {/* Scrollbarer Hauptinhalt */}
      <div className="flex-1 overflow-y-auto">

      {ansicht === 'composer' && (
        <Suspense fallback={<LazyFallback />}>
          <PruefungsComposer key={composerKey} config={editConfig} onZurueck={handleZurueck} onDuplizieren={handleDuplizieren} />
        </Suspense>
      )}

      {/* Dashboard-Inhalte — nur wenn nicht im Composer */}
      {ansicht !== 'composer' && modus === 'uebung' && (
        <>
          {/* Tab-Content */}
          {uebungsTab === 'uebungen' && <UebungsToolView aktiverKursId={aktiverKursId} onFachKlick={() => setModus('fragensammlung')} />}

          {uebungsTab === 'durchfuehren' && (
            <main className="p-6">
              {ladeStatus === 'laden' && (
                <p className="text-slate-500 dark:text-slate-400 text-center py-12">Übungen werden geladen...</p>
              )}
              {ladeStatus === 'fertig' && formativeConfigs.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Noch keine Übungen</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">Erstellen Sie Ihre erste formative Übung.</p>
                  <Button variant="primary" size="md" onClick={handleNeueUebung}>
                    + Neue Übung erstellen
                  </Button>
                </div>
              )}
              {ladeStatus === 'fertig' && formativeConfigs.length > 0 && (
                <div className="space-y-3">
                  {/* Such- und Filterleiste (analog Prüfen) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {verfuegbareFachbereiche.map(fb => {
                        const farbe = getFachFarbe(fb, {})
                        const aktiv = filterFach.includes(fb)
                        return (
                          <button
                            key={fb}
                            onClick={() => toggleFachFilter(fb)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                              !aktiv ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500' : ''
                            }`}
                            style={aktiv ? { backgroundColor: farbe + '20', color: farbe, borderColor: farbe + '60' } : undefined}
                          >
                            {fb}
                          </button>
                        )
                      })}
                      {verfuegbareGefaesse.length > 0 && <>
                        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                        {verfuegbareGefaesse.map(g => (
                          <button
                            key={g}
                            onClick={() => setFilterGefaess(filterGefaess === g ? null : g)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                              filterGefaess === g
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </>}
                      <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                      {(['aktiv', 'archiviert', 'alle'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                            filterStatus === s
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
                          }`}
                        >
                          {s === 'aktiv' ? 'Aktiv' : s === 'archiviert' ? 'Archiviert' : 'Alle'}
                        </button>
                      ))}
                      <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                      <select
                        value={sortierung}
                        onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <option value="datum">Neueste zuerst</option>
                        <option value="titel">Nach Titel</option>
                        <option value="klasse">Nach Klasse</option>
                      </select>
                      {hatAktiveFilter && (
                        <button
                          onClick={() => { setSuchtext(''); setFilterFach([]); setFilterTyp(null); setFilterGefaess(null); setFilterStatus('aktiv') }}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        >
                          Zurücksetzen
                        </button>
                      )}
                      <Button variant="primary" size="sm" onClick={handleNeueUebung} className="ml-auto whitespace-nowrap">
                        + Neue Übung
                      </Button>
                    </div>
                  </div>

                  {/* Zähler */}
                  <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    {hatAktiveFilter
                      ? `${gefilterteUebungen.length} von ${formativeConfigs.length} Übungen`
                      : `${formativeConfigs.length} Übung${formativeConfigs.length !== 1 ? 'en' : ''}`}
                  </h2>

                  {/* Favoriten-Sektion für Übungen */}
                  {!hatAktiveFilter && favoritenUebungen.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                        <span>⭐</span> Favoriten
                      </h3>
                      {favoritenUebungen.map(c => (
                        <PruefungsKarte key={`fav-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
                      ))}
                      <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
                    </div>
                  )}

                  {gefilterteUebungen.map(c => (
                    <PruefungsKarte key={c.id} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
                  ))}
                </div>
              )}
            </main>
          )}

          {uebungsTab === 'analyse' && <Suspense fallback={<LazyFallback />}><AnalyseDashboard /></Suspense>}
        </>
      )}

      {/* Prüfen-Ansicht */}
      {ansicht !== 'composer' && modus === 'pruefung' && <>
      {/* Content */}
      <main className="p-6">
        {ladeStatus === 'laden' && (
          <p className="text-slate-500 dark:text-slate-400 text-center py-12">
            Prüfungen werden geladen...
          </p>
        )}

        {ladeStatus === "fertig" && backendFehler && !istDemoModus && (
          <div className="mb-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <span className="text-slate-400 shrink-0 mt-0.5">ⓘ</span>
            <span>Backend nicht erreichbar — bestehende Prüfungen konnten nicht geladen werden. Der Composer ist trotzdem nutzbar.</span>
          </div>
        )}

        {/* Tracker-Ansicht */}
        {ladeStatus === 'fertig' && listenTab === 'tracker' && (
          trackerDaten ? (
            <TrackerSection trackerDaten={trackerDaten} />
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
              Keine Tracker-Daten verfügbar.
            </p>
          )
        )}

        {/* Prüfungen-Ansicht */}
        {listenTab === 'pruefungen' && ladeStatus === 'fertig' && summativeConfigs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Noch keine Prüfungen
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Erstellen Sie Ihre erste digitale Prüfung.
            </p>
            <Button variant="primary" size="md" onClick={handleNeue}>
              + Neue Prüfung erstellen
            </Button>
          </div>
        )}

        {listenTab === 'pruefungen' && ladeStatus === 'fertig' && summativeConfigs.length > 0 && (
          <div className="space-y-3">
            {/* Such- und Filterleiste */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {verfuegbareFachbereiche.map(fb => {
                  const farbe = getFachFarbe(fb, {})
                  const aktiv = filterFach.includes(fb)
                  return (
                    <button
                      key={fb}
                      onClick={() => toggleFachFilter(fb)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                        !aktiv ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500' : ''
                      }`}
                      style={aktiv ? { backgroundColor: farbe + '20', color: farbe, borderColor: farbe + '60' } : undefined}
                    >
                      {fb}
                    </button>
                  )
                })}
                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                {verfuegbareGefaesse.map(g => (
                  <button
                    key={g}
                    onClick={() => setFilterGefaess(filterGefaess === g ? null : g)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                      filterGefaess === g
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                {(['aktiv', 'archiviert', 'alle'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                      filterStatus === s
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
                    }`}
                  >
                    {s === 'aktiv' ? 'Aktiv' : s === 'archiviert' ? 'Archiviert' : 'Alle'}
                  </button>
                ))}
                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <select
                  value={sortierung}
                  onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="datum">Neueste zuerst</option>
                  <option value="titel">Nach Titel</option>
                  <option value="klasse">Nach Klasse</option>
                </select>
                {hatAktiveFilter && (
                  <button
                    onClick={() => { setSuchtext(''); setFilterFach([]); setFilterTyp(null); setFilterGefaess(null); setFilterStatus('aktiv') }}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Zurücksetzen
                  </button>
                )}
                <Button variant="primary" size="sm" onClick={handleNeue} className="ml-auto whitespace-nowrap">
                  + Neue Prüfung
                </Button>
              </div>
            </div>

            {/* Zähler + Multi-Dashboard */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                {hatAktiveFilter
                  ? `${gefilterteConfigs.length} von ${summativeConfigs.length} Prüfungen`
                  : `${summativeConfigs.length} Prüfungen`}
              </h2>
              {summativeConfigs.length > 1 && (
                <button
                  onClick={() => {
                    setMultiDashboardAuswahl(new Set())
                    setMultiDashboardOffen(true)
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Multi-Dashboard
                </button>
              )}
            </div>

            {/* Multi-Dashboard Dialog */}
            {multiDashboardOffen && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold dark:text-white">Prüfungen für Multi-Dashboard wählen</h3>
                  <button onClick={() => setMultiDashboardOffen(false)} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">✕</button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {summativeConfigs.map(c => (
                    <label key={c.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={multiDashboardAuswahl.has(c.id)}
                        onChange={() => {
                          const neu = new Set(multiDashboardAuswahl)
                          if (neu.has(c.id)) neu.delete(c.id)
                          else neu.add(c.id)
                          setMultiDashboardAuswahl(neu)
                        }}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="dark:text-slate-200">{c.titel}</span>
                      <span className="text-xs text-slate-400 ml-auto">{c.klasse}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setMultiDashboardOffen(false)} className="text-xs px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400">Abbrechen</button>
                  <button
                    disabled={multiDashboardAuswahl.size < 2}
                    onClick={() => {
                      const ids = [...multiDashboardAuswahl].join(',')
                      window.open(`${import.meta.env.BASE_URL}pruefung/monitoring?ids=${ids}`, '_blank')
                      setMultiDashboardOffen(false)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 disabled:opacity-40 hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
                  >
                    Dashboard öffnen ({multiDashboardAuswahl.size} Prüfungen)
                  </button>
                </div>
              </div>
            )}

            {/* Favoriten-Sektion (nur wenn Favoriten vorhanden und kein aktiver Filter) */}
            {!hatAktiveFilter && favoritenPruefungen.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span>⭐</span> Favoriten
                </h3>
                {favoritenPruefungen.map(c => (
                  <PruefungsKarte key={`fav-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
                ))}
                <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
              </div>
            )}

            {/* Zuletzt-Sektion (nur ohne Filter und wenn >5 Prüfungen) */}
            {letzteFuenf.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  Zuletzt
                </h3>
                {letzteFuenf.map(c => (
                  <PruefungsKarte key={`recent-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
                ))}
                <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide pt-1">
                  Alle Prüfungen
                </h3>
              </div>
            )}

            {/* Hauptliste */}
            {gefilterteConfigs.length === 0 && hatAktiveFilter && (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                Keine Prüfungen entsprechen den Filtern.
              </p>
            )}
            {gefilterteConfigs.map(c => (
              <PruefungsKarte key={c.id} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
            ))}
          </div>
        )}
      </main>

      </>}

      {/* Fragensammlung als Vollseiteninhalt */}
      {ansicht !== 'composer' && modus === 'fragensammlung' && (
        <main className="p-6">
          <Suspense fallback={<LazyFallback />}>
            <FragenBrowser
              inline
              onHinzufuegen={() => {}}
              onSchliessen={() => useLPNavigationStore.getState().zurueck()}
              bereitsVerwendet={[]}
              initialEditFrageId={deepLinkFrageId ?? undefined}
              onFrageAktualisiert={() => { clearDeepLinkFrageId() }}
            />
          </Suspense>
        </main>
      )}

      </div>{/* Ende Scrollbarer Hauptinhalt */}

      {/* Einstellungen Sidebar */}
      {zeigEinstellungen && (
        <Suspense fallback={<LazyFallback />}>
          <EinstellungenPanel
          initialTab={useLPNavigationStore.getState().einstellungenTab ?? undefined}
          onSchliessen={() => {
            setZeigEinstellungen(false)
            // Zurück zum aktuellen Modus-Dashboard
            zurueckZumDashboard()
          }}
        />
        </Suspense>
      )}
      </div>{/* Ende Flex-Row */}

      {/* Hilfe Overlay (alle Modi) */}
      {zeigHilfe && (
        <Suspense fallback={<LazyFallback />}>
          <HilfeSeite onSchliessen={toggleHilfe} />
        </Suspense>
      )}
    </div>
  )
}

/** Fallback-Spinner für lazy-geladene Komponenten */
function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin h-6 w-6 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full" />
    </div>
  )
}

/** Prüfungskarte — wiederverwendbar für Zuletzt-Sektion und Hauptliste */
function PruefungsKarte({ config: c, onBearbeiten, onDuplizieren, trackerSummary }: {
  config: PruefungsConfig
  onBearbeiten: (c: PruefungsConfig) => void
  onDuplizieren: (c: PruefungsConfig) => void
  trackerSummary?: TrackerPruefungSummary
}) {
  const toggleFavorit = useFavoritenStore(s => s.toggleFavorit)
  const istFavoritFn = useFavoritenStore(s => s.istFavorit)
  const istFav = istFavoritFn(c.id)
  const [linkKopiert, setLinkKopiert] = useState(false)
  const kopiereLink = async () => {
    const screen = c.typ === 'formativ' ? 'uebung' : 'pruefung'
    const url = `${window.location.origin}${window.location.pathname}#/${screen}/${c.id}`
    try { await navigator.clipboard.writeText(url) } catch {
      const input = document.createElement('input')
      input.value = url; document.body.appendChild(input); input.select()
      document.execCommand('copy'); document.body.removeChild(input)
    }
    setLinkKopiert(true); setTimeout(() => setLinkKopiert(false), 2000)
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <button
          onClick={() => toggleFavorit({ typ: c.typ === 'formativ' ? 'uebung' : 'pruefung', ziel: c.id, label: c.titel })}
          className="mt-0.5 text-lg leading-none cursor-pointer hover:scale-110 transition-transform shrink-0"
          title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          {istFav ? '⭐' : '☆'}
        </button>
        <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{c.titel}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <span>{c.klasse}</span>
          <span>·</span>
          <span>{formatDatum(c.datum)}</span>
          <span>·</span>
          <span>{c.dauerMinuten} Min.</span>
          <span>·</span>
          <span>{c.gesamtpunkte} P.</span>
          <span>·</span>
          <span>{c.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)} Fragen</span>
          {c.fachbereiche.map((fb) => {
            const farbe = getFachFarbe(fb, {})
            return (
              <span
                key={fb}
                className="px-1.5 py-0.5 text-xs rounded"
                style={{ backgroundColor: farbe + '20', color: farbe }}
              >
                {fb}
              </span>
            )
          })}
        </div>
        {/* Tracker-Badges */}
        {trackerSummary && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <TrackerBadge summary={trackerSummary} />
          </div>
        )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`${window.location.pathname}?id=${c.id}`}
          className={c.beendetUm
            ? 'px-4 py-2 text-xs font-medium text-white dark:text-slate-800 bg-slate-800 dark:bg-slate-200 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors'
            : 'px-4 py-2 text-xs font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors'}
        >
          {c.beendetUm ? 'Auswerten' : c.typ === 'formativ' ? 'Übung starten' : 'Prüfung starten'}
        </a>
        <button
          onClick={kopiereLink}
          className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
          title="SuS-Link kopieren"
        >
          {linkKopiert ? '✓' : '🔗'}
        </button>
        <button
          onClick={() => onDuplizieren(c)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Duplizieren
        </button>
        <button
          onClick={() => onBearbeiten(c)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Bearbeiten
        </button>
      </div>
    </div>
  )
}

/** Tracker-Badges für eine Prüfungskarte: Teilnahme, Korrektur, Durchschnitt, Status */
function TrackerBadge({ summary: s }: { summary: TrackerPruefungSummary }) {
  const status = bestimmePruefungsStatus(s)
  return (
    <>
      {/* Status-Punkt + Label */}
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span className={`w-2 h-2 rounded-full ${statusFarbe(status)}`} />
        {statusLabel(status)}
      </span>
      {/* Teilnahme */}
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {s.eingereicht}/{s.teilnehmerGesamt} eingereicht
      </span>
      {/* Korrektur */}
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {korrekturLabel(s)}
      </span>
      {/* Durchschnitt */}
      {s.durchschnittNote !== null && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          &#216; {s.durchschnittNote.toFixed(1)}
        </span>
      )}
    </>
  )
}

/** Demo-Konfigurationen für den Demo-Modus — Einrichtungsprüfung + Einführungsübung */
function demoConfigs(): PruefungsConfig[] {
  return [einrichtungsPruefung, einrichtungsUebung]
}
