import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.ts'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore.ts'
import { useLPNavigationStore } from '../../store/lpUIStore.ts'
import { useFavoritenStore } from '../../store/favoritenStore.ts'
import { useLPRouteSync } from '../../hooks/useLPRouteSync.ts'
import { useLPNavigation } from '../../hooks/useLPNavigation.ts'
import { useLPConfigFiltering } from '../../hooks/useLPConfigFiltering.ts'
import { useTestdatenSichtbar } from '../../hooks/useTestdatenSichtbar.ts'
import { useLPFavoriten } from '../../hooks/useLPFavoriten.ts'
import { useLPDashboardData } from '../../hooks/useLPDashboardData.ts'
import { useToast } from '../../hooks/useToast'
import type { PruefungsConfig } from '../../types/pruefung.ts'
import { LPAppHeaderContainer } from './LPAppHeaderContainer'
import UebungsToolView from './UebungsToolView.tsx'
import { useDraftStore } from '../../store/draftStore.ts'
import { MultiDurchfuehrenDashboard } from './durchfuehrung/MultiDurchfuehrenDashboard.tsx'
import DurchfuehrenDashboard from './durchfuehrung/DurchfuehrenDashboard.tsx'
import LazyFallback from '../ui/LazyFallback'
import { lazyMitRetry } from '../../utils/lazyMitRetry'
import { leereUebung } from './vorbereitung/configVorlagen'
import { LPUebungenAnsicht } from './startseite/LPUebungenAnsicht'
import { LPPruefungenAnsicht } from './startseite/LPPruefungenAnsicht'
import { PageTitle } from '../shared/PageTitle'

// Lazy-loaded Komponenten: Werden erst bei Bedarf geladen (spart ~400KB beim Initial Load)
// lazyMitRetry: bei Chunk-Hash-Mismatch nach Deploy automatischer Page-Reload.
const PruefungsComposer = lazyMitRetry(() => import('./vorbereitung/PruefungsComposer.tsx'))
const FragenBrowser = lazyMitRetry(() => import('./fragensammlung/FragenBrowser.tsx'))
const PapierkorbView = lazyMitRetry(() => import('./papierkorb/PapierkorbView.tsx'))
const HilfeSeite = lazyMitRetry(() => import('./HilfeSeite.tsx'))
const EinstellungenPanel = lazyMitRetry(() => import('../settings/EinstellungenPanel.tsx'))
const AnalyseDashboard = lazyMitRetry(() => import('./ueben/AnalyseDashboard.tsx'))

/**
 * Startseite für Lehrpersonen. Dispatcher: basierend auf URL-Query rendert entweder
 * Multi-Durchführen, Einzel-Durchführen oder das normale Dashboard.
 *
 * Wrapper-Pattern statt früherer `useMemo(..., [])`-Early-Returns: beim URL-Wechsel
 * (L1-Tab-Klick Üben/Fragensammlung) wird der Sub-Tree neu gemountet, Hook-Order in
 * LPStartseiteInner bleibt stabil (verhindert React-#310 bei Wechsel zwischen
 * Durchführen-Modus und Liste).
 */
export default function LPStartseite() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const multiIds = params.get('ids')?.split(',').filter(Boolean) ?? []
  const singleId = params.get('id')

  if (multiIds.length > 1) {
    return <MultiDurchfuehrenDashboard pruefungIds={multiIds} />
  }
  if (singleId) {
    return <DurchfuehrenDashboard pruefungId={singleId} />
  }
  return <LPStartseiteInner />
}

function LPStartseiteInner() {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)
  const toast = useToast()

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
    backToDashboard,
    openComposer,
  } = useLPNavigation()

  // UI-State bleibt im Store (Panels, Keys)
  const neuerComposerKey = useLPNavigationStore(s => s.neuerComposerKey)

  // Bundle 13 I: URL-basierte Kurs-Auswahl für Üben-Übungen
  const navigate = useNavigate()
  const { kursId: urlKursId, frageId: urlFrageId } = useParams<{ kursId?: string; frageId?: string }>()
  // Bug 4: Globale Suche navigiert auf `/fragensammlung?frage=<id>` (Query-Param,
  // nicht Path-Param). useParams sieht das nicht — daher zusätzlich aus Query lesen.
  const [queryParams, setQueryParams] = useSearchParams()
  const queryFrageId = queryParams.get('frage') || undefined
  const gruppen = useUebenGruppenStore(s => s.gruppen)
  const aktiverKursId = urlKursId
  const aktiverKurs = useMemo(
    () => gruppen.find(g => g.id === aktiverKursId),
    [gruppen, aktiverKursId]
  )

  // Invaliden Kurs → Redirect auf erste Gruppe + Toast
  useEffect(() => {
    if (urlKursId && !aktiverKurs && gruppen.length > 0) {
      const zielName = gruppen[0].name
      navigate(`/uebung/kurs/${gruppen[0].id}`, { replace: true })
      toast.warning(`Kurs "${urlKursId}" nicht gefunden — zu ${zielName} umgeleitet`)
    }
  }, [urlKursId, aktiverKurs, gruppen, navigate, toast])

  // localStorage: letzten Kurs merken
  useEffect(() => {
    if (aktiverKursId) {
      try { localStorage.setItem('examlab-ueben-letzter-kurs', aktiverKursId) } catch { /* */ }
    }
  }, [aktiverKursId])
  const toggleHilfe = useLPNavigationStore(s => s.toggleHilfe)
  const toggleEinstellungen = useLPNavigationStore(s => s.toggleEinstellungen)
  const setZeigEinstellungen = useLPNavigationStore(s => s.setZeigEinstellungen)

  // Cluster C: Deep-Link aus globaler Suche `?hilfe=<tabId>` öffnet HilfeSeite mit Tab voreingestellt.
  const [initialHilfeKategorie, setInitialHilfeKategorie] = useState<string | undefined>(undefined)
  useEffect(() => {
    const hilfeParam = queryParams.get('hilfe')
    if (hilfeParam && !zeigHilfe) {
      setInitialHilfeKategorie(hilfeParam)
      toggleHilfe()
      const next = new URLSearchParams(queryParams)
      next.delete('hilfe')
      setQueryParams(next, { replace: true })
    }
  }, [queryParams, zeigHilfe, toggleHilfe, setQueryParams])

  // Cluster C.2: Schüler-Search-Treffer navigiert zu /einstellungen?tab=klassenlisten&suche=...
  // LPStartseite triggert EinstellungenPanel-Open mit klassenlisten-Tab pre-selektiert.
  // `?suche=` + `?schueler=` werden vom KlassenlistenTab selber gelesen — hier nicht strippen.
  useEffect(() => {
    const tabParam = queryParams.get('tab')
    if (tabParam === 'klassenlisten' && !zeigEinstellungen) {
      setZeigEinstellungen(true, 'klassenlisten')
      const next = new URLSearchParams(queryParams)
      next.delete('tab')
      setQueryParams(next, { replace: true })
    }
  }, [queryParams, zeigEinstellungen, setZeigEinstellungen, setQueryParams])

  // UI-State (nicht Hook-extrahiert)
  const [editConfig, setEditConfig] = useState<PruefungsConfig | null>(null)
  const [multiDashboardOffen, setMultiDashboardOffen] = useState(false)
  const [multiDashboardAuswahl, setMultiDashboardAuswahl] = useState<Set<string>>(new Set())

  // Such- und Filterstate
  // Cluster C.3: ?suche= Pre-Fill — initial aus URL lesen, NUR für Pruefen/Üben-Modus.
  // Fragensammlung-Modus hat eigenen useFragenFilter-Hook der den Param selber liest;
  // dort darf LPStartseite NICHT vorher strippen (Race-Condition). Modus wird via
  // Route bestimmt (/pruefung, /uebung) — kein separater modus-Param mehr nötig.
  const [suchtext, setSuchtext] = useState(() => {
    const aktiv = useLPNavigationStore.getState().modus
    return aktiv === 'pruefung' || aktiv === 'uebung' ? (queryParams.get('suche') ?? '') : ''
  })
  const lastSeenSucheParam = useRef<string | null>(null)

  // Cluster C.3: ?suche=<term> URL-Param auswerten + cleanup für Pruefen/Üben.
  useEffect(() => {
    const suche = queryParams.get('suche')
    if (!suche || suche === lastSeenSucheParam.current) return

    const aktiverModus = useLPNavigationStore.getState().modus
    if (aktiverModus !== 'pruefung' && aktiverModus !== 'uebung') return  // Fragensammlung übernimmt selber

    lastSeenSucheParam.current = suche
    setSuchtext(suche)
    const next = new URLSearchParams(queryParams)
    next.delete('suche')
    setQueryParams(next, { replace: true })
  }, [queryParams, setQueryParams])
  const [filterFach, setFilterFach] = useState<string[]>([])
  const [filterTyp, setFilterTyp] = useState<string | null>(null)
  const [filterGefaess, setFilterGefaess] = useState<string | null>(null)
  const [sortierung, setSortierung] = useState<'datum' | 'titel' | 'klasse'>('datum')
  const [filterStatus, setFilterStatus] = useState<'alle' | 'aktiv' | 'archiviert'>('aktiv')

  // Daten-Hook (5 useState + grosser Lade-useEffect + reload + findeTrackerSummary)
  const {
    configs,
    configsLadeStatus,
    trackerLadeStatus,
    trackerDaten,
    backendFehler,
    findeTrackerSummary,
    reload,
  } = useLPDashboardData({ user, istDemoModus })

  // Cluster F.4: Testdaten-Sichtbarkeit (LP-Profil-Toggle)
  const testdatenSichtbar = useTestdatenSichtbar()

  // Filter-Hook (6 Memos + letzteFuenf + hatAktiveFilter)
  const {
    verfuegbareFachbereiche,
    verfuegbareGefaesse,
    summativeConfigs,
    gefilterteConfigs,
    formativeConfigs,
    gefilterteUebungen,
    letzteFuenf,
    hatAktiveFilter,
  } = useLPConfigFiltering({
    configs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus,
    testdatenSichtbar,
  })

  // Favoriten-Hook (4 Memos)
  const favoriten = useFavoritenStore(s => s.favoriten)
  const { favoritenPruefungen, favoritenUebungen } = useLPFavoriten(configs, favoriten)

  // URL → Store Sync (ersetzt den alten hashchange-Listener)
  useLPRouteSync()

  // Deep Link: Config via aktiveConfigId öffnen (nachdem Configs geladen)
  // aktiveConfigId wird per useLPRouteSync aus der URL gesetzt
  const aktiveConfigId = useLPNavigationStore(s => s.aktiveConfigId)
  const deepLinkFrageId = useLPNavigationStore(s => s.deepLinkFrageId)
  const clearDeepLinkFrageId = useLPNavigationStore(s => s.clearDeepLinkFrageId)
  useEffect(() => {
    if (configsLadeStatus !== 'fertig' || !aktiveConfigId || ansicht === 'composer') return
    const config = configs.find(c => c.id === aktiveConfigId)
    if (!config) return
    setEditConfig(config)
    // openComposer nicht nötig — URL ist bereits korrekt (Router hat hierher navigiert)
    useLPNavigationStore.getState().openComposer(config.titel || 'Bearbeiten', config.id)
  }, [configsLadeStatus, aktiveConfigId, configs, ansicht])

  // Bundle 3 P-C.4: beforeunload-Listener — warnt vor ungespeicherten Änderungen
  // Browser zeigt nur generischen Text (Phishing-Schutz), Dialog erscheint nur wenn
  // hatDirty() == true (min. ein aktiver Editor hat unsaved Changes).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useDraftStore.getState().hatDirty()) {
        e.preventDefault()
        e.returnValue = '' // Cross-Browser-Trigger für Confirm-Dialog
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  function toggleFachFilter(fach: string): void {
    setFilterFach(prev => prev.includes(fach) ? prev.filter(f => f !== fach) : [...prev, fach])
  }

  function resetFilter(): void {
    setSuchtext('')
    setFilterFach([])
    setFilterTyp(null)
    setFilterGefaess(null)
    setFilterStatus('aktiv')
  }

  function handleNeue(): void {
    setEditConfig(null)
    openComposer('Neue Prüfung')
  }

  function handleNeueUebung(): void {
    setEditConfig({ ...leereUebung })
    neuerComposerKey()
    openComposer('Neue Übung')
  }

  function handleBearbeiten(config: PruefungsConfig): void {
    setEditConfig(config)
    openComposer(config.titel || 'Bearbeiten', config.id)
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
    openComposer(`${config.titel} (Kopie)`)
  }

  function handleZurueck(): void {
    backToDashboard()
    reload()
  }

  const surfaceTitel = ({
    pruefung: 'Prüfen',
    uebung: 'Üben',
    fragensammlung: 'Fragensammlung',
    papierkorb: 'Papierkorb',
  } as const)[modus] ?? 'Übersicht'

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header nur im Dashboard-Modus — Composer hat eigenen Header */}
      {ansicht !== 'composer' && (
        <LPAppHeaderContainer
          onHilfe={toggleHilfe}
          onEinstellungen={() => toggleEinstellungen()}
        />
      )}

      {/* Flex-Row: Hauptinhalt + optionale Sidebar */}
      <div className="flex flex-1 overflow-hidden min-h-0">
      {/* Scrollbarer Hauptinhalt — bei Fragensammlung scrollt die virtualisierte Liste selbst,
          deshalb hier overflow-hidden + min-h-0, damit `h-full` der inneren Liste greift. */}
      <div className={`flex-1 min-h-0 ${ansicht !== 'composer' && modus === 'fragensammlung' ? 'overflow-hidden' : 'overflow-y-auto'}`}>

      {ansicht !== 'composer' && <PageTitle titel={surfaceTitel} />}

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
            <LPUebungenAnsicht
              configsLadeStatus={configsLadeStatus}
              formativeConfigs={formativeConfigs}
              gefilterteUebungen={gefilterteUebungen}
              favoritenUebungen={favoritenUebungen}
              hatAktiveFilter={hatAktiveFilter}
              verfuegbareFachbereiche={verfuegbareFachbereiche}
              verfuegbareGefaesse={verfuegbareGefaesse}
              filterFach={filterFach}
              toggleFachFilter={toggleFachFilter}
              filterGefaess={filterGefaess}
              setFilterGefaess={setFilterGefaess}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              sortierung={sortierung}
              setSortierung={setSortierung}
              resetFilter={resetFilter}
              handleNeueUebung={handleNeueUebung}
              handleBearbeiten={handleBearbeiten}
              handleDuplizieren={handleDuplizieren}
              findeTrackerSummary={findeTrackerSummary}
            />
          )}

          {uebungsTab === 'analyse' && <Suspense fallback={<LazyFallback />}><AnalyseDashboard /></Suspense>}
        </>
      )}

      {/* Prüfen-Ansicht */}
      {ansicht !== 'composer' && modus === 'pruefung' && (
        <LPPruefungenAnsicht
          configs={configs}
          configsLadeStatus={configsLadeStatus}
          trackerLadeStatus={trackerLadeStatus}
          trackerDaten={trackerDaten}
          backendFehler={backendFehler}
          istDemoModus={istDemoModus}
          listenTab={listenTab}
          verfuegbareFachbereiche={verfuegbareFachbereiche}
          verfuegbareGefaesse={verfuegbareGefaesse}
          summativeConfigs={summativeConfigs}
          gefilterteConfigs={gefilterteConfigs}
          letzteFuenf={letzteFuenf}
          favoritenPruefungen={favoritenPruefungen}
          hatAktiveFilter={hatAktiveFilter}
          filterFach={filterFach}
          toggleFachFilter={toggleFachFilter}
          filterGefaess={filterGefaess}
          setFilterGefaess={setFilterGefaess}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortierung={sortierung}
          setSortierung={setSortierung}
          resetFilter={resetFilter}
          multiDashboardOffen={multiDashboardOffen}
          setMultiDashboardOffen={setMultiDashboardOffen}
          multiDashboardAuswahl={multiDashboardAuswahl}
          setMultiDashboardAuswahl={setMultiDashboardAuswahl}
          handleNeue={handleNeue}
          handleBearbeiten={handleBearbeiten}
          handleDuplizieren={handleDuplizieren}
          findeTrackerSummary={findeTrackerSummary}
        />
      )}

      {/* Fragensammlung als Vollseiteninhalt — h-full + min-h-0 damit die virtualisierte
          Liste den verfügbaren Platz vollständig erhält und SELBST scrollt (nicht der äussere Wrapper). */}
      {ansicht !== 'composer' && modus === 'fragensammlung' && (
        <main className="h-full min-h-0 p-6 flex flex-col overflow-hidden">
          <Suspense fallback={<LazyFallback />}>
            <FragenBrowser
              inline
              onHinzufuegen={() => {}}
              onSchliessen={() => useLPNavigationStore.getState().back()}
              bereitsVerwendet={[]}
              initialEditFrageId={urlFrageId ?? queryFrageId ?? deepLinkFrageId ?? undefined}
              onFrageAktualisiert={() => { clearDeepLinkFrageId() }}
            />
          </Suspense>
        </main>
      )}

      {/* Papierkorb (Bundle 3 Phase E): Soft-Delete-Liste eigener Fragen */}
      {ansicht !== 'composer' && modus === 'papierkorb' && (
        <Suspense fallback={<LazyFallback />}>
          <PapierkorbView />
        </Suspense>
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
            backToDashboard()
          }}
        />
        </Suspense>
      )}
      </div>{/* Ende Flex-Row */}

      {/* Hilfe Overlay (alle Modi) */}
      {zeigHilfe && (
        <Suspense fallback={<LazyFallback />}>
          <HilfeSeite
            onSchliessen={() => { toggleHilfe(); setInitialHilfeKategorie(undefined) }}
            initialKategorie={initialHilfeKategorie}
          />
        </Suspense>
      )}
    </div>
  )
}
