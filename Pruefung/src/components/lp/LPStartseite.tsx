import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { useFragenbankStore } from '../../store/fragenbankStore.ts'
import { useStammdatenStore } from '../../store/stammdatenStore.ts'
import { useLPNavigationStore } from '../../store/lpNavigationStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PruefungsConfig } from '../../types/pruefung.ts'
import type { TrackerDaten, TrackerPruefungSummary } from '../../types/tracker.ts'
import { formatDatum } from '../../utils/zeit.ts'
import { getFachFarbe } from '../../utils/ueben/fachFarben.ts'
import { bestimmePruefungsStatus, statusLabel, statusFarbe, korrekturLabel, erstelleDemoTrackerDaten } from '../../utils/trackerUtils.ts'
import LPHeader from './LPHeader.tsx'
import LPSkeleton from './LPSkeleton.tsx'
import PruefungsComposer, { leereUebung } from './vorbereitung/PruefungsComposer.tsx'
import FragenBrowser from './fragenbank/FragenBrowser.tsx'
import HilfeSeite from './HilfeSeite.tsx'
import UebungsToolView from './UebungsToolView.tsx'
import TrackerSection from './TrackerSection.tsx'
import { einrichtungsPruefung } from '../../data/einrichtungsPruefung.ts'
import { einrichtungsFragen } from '../../data/einrichtungsFragen.ts'
import { einrichtungsUebung } from '../../data/einrichtungsUebung.ts'
import { einrichtungsUebungFragen } from '../../data/einrichtungsUebungFragen.ts'
import { speichereConfig, speichereFrage } from '../../services/fragenbankApi.ts'
import EinstellungenPanel from '../settings/EinstellungenPanel.tsx'
import AnalyseDashboard from './ueben/AnalyseDashboard.tsx'

/** Startseite für Lehrpersonen: Prüfungen verwalten + erstellen */
export default function LPStartseite() {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Navigation aus dem Store
  const ansicht = useLPNavigationStore(s => s.ansicht)
  const modus = useLPNavigationStore(s => s.modus)
  const listenTab = useLPNavigationStore(s => s.listenTab)
  const uebungsTab = useLPNavigationStore(s => s.uebungsTab)
  const zeigHilfe = useLPNavigationStore(s => s.zeigHilfe)
  const zeigEinstellungen = useLPNavigationStore(s => s.zeigEinstellungen)
  const composerKey = useLPNavigationStore(s => s.composerKey)
  const setModus = useLPNavigationStore(s => s.setModus)
  const setListenTab = useLPNavigationStore(s => s.setListenTab)
  const setUebungsTab = useLPNavigationStore(s => s.setUebungsTab)
  const zurueckZumDashboard = useLPNavigationStore(s => s.zurueckZumDashboard)
  const navigiereZuComposer = useLPNavigationStore(s => s.navigiereZuComposer)
  const neuerComposerKey = useLPNavigationStore(s => s.neuerComposerKey)
  const toggleHilfe = useLPNavigationStore(s => s.toggleHilfe)
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

  // Favoriten aus dem Store
  const favoriten = useLPNavigationStore(s => s.favoriten)

  // Favoriten-Configs (nur existierende IDs, nach Datum sortiert)
  const favoritenConfigs = useMemo(() => {
    if (favoriten.length === 0) return []
    return configs.filter(c => favoriten.includes(c.id)).sort((a, b) => b.datum.localeCompare(a.datum))
  }, [configs, favoriten])

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
  const SYNC_KEY = 'einrichtung-sync-v3'
  const SYNC_VERSION = `${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}-${einrichtungsFragen.length}`

  async function syncEinrichtungsPruefung(email: string, _backendConfigs: PruefungsConfig[]): Promise<void> {
    // Guard: Nur localStorage-basiert (Backend-Check entfernt — Config kann
    // im Backend existieren während Fragen fehlen)
    try { if (localStorage.getItem(SYNC_KEY) === SYNC_VERSION) return } catch { /* ignore */ }

    console.log('[LP] Einrichtungsprüfung sync starten...')
    try {
      // Config speichern
      await speichereConfig(email, { ...einrichtungsPruefung, erstelltVon: email })
      // Alle Fragen speichern (parallel in Batches von 5)
      for (let i = 0; i < einrichtungsFragen.length; i += 5) {
        const batch = einrichtungsFragen.slice(i, i + 5)
        await Promise.all(batch.map(f => speichereFrage(email, f)))
      }
      // Guard setzen — nicht nochmal syncen
      try { localStorage.setItem(SYNC_KEY, SYNC_VERSION) } catch { /* ignore */ }
      console.log(`[LP] Einrichtungsprüfung sync fertig (${einrichtungsFragen.length} Fragen)`)
    } catch (error) {
      console.error('[LP] Einrichtungsprüfung sync fehlgeschlagen:', error)
    }
  }

  // Einführungsübung ins Backend synchronisieren (einmalig)
  const UEBUNG_SYNC_KEY = 'einrichtung-uebung-sync-v3'
  const UEBUNG_SYNC_VERSION = `${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}-${einrichtungsUebungFragen.length}`

  async function syncEinrichtungsUebung(email: string, _backendConfigs: PruefungsConfig[]): Promise<void> {
    // Guard: Nur localStorage-basiert (Backend-Check entfernt — Punktzahl allein
    // reicht nicht, da Config stimmen kann aber Fragen fehlen)
    try { if (localStorage.getItem(UEBUNG_SYNC_KEY) === UEBUNG_SYNC_VERSION) return } catch { /* ignore */ }

    console.log('[LP] Einführungsübung sync starten...')
    try {
      await speichereConfig(email, { ...einrichtungsUebung, erstelltVon: email })
      for (let i = 0; i < einrichtungsUebungFragen.length; i += 5) {
        const batch = einrichtungsUebungFragen.slice(i, i + 5)
        await Promise.all(batch.map(f => speichereFrage(email, f)))
      }
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
      ladeLPProfil(user.email)

      // Configs, Tracker-Daten und Fragenbank parallel laden
      const fragenbankLade = useFragenbankStore.getState().lade(user.email)
      const [configResult, trackerResult] = await Promise.all([
        apiService.ladeAlleConfigs(user.email),
        apiService.ladeTrackerDaten(user.email),
        fragenbankLade,
      ])

      if (configResult) {
        setConfigs(configResult)
        setBackendFehler(false)
        // Einrichtungsprüfung/-übung: nur einmal pro Browser-Session syncen
        const SYNC_DONE_KEY = 'examlab-sync-done'
        if (!sessionStorage.getItem(SYNC_DONE_KEY)) {
          Promise.all([
            syncEinrichtungsPruefung(user.email, configResult),
            syncEinrichtungsUebung(user.email, configResult),
          ]).then(async () => {
            sessionStorage.setItem(SYNC_DONE_KEY, '1')
            const neueConfigs = await apiService.ladeAlleConfigs(user.email)
            if (neueConfigs) setConfigs(neueConfigs)
          }).catch(err => {
            console.warn('[LP] Sync fehlgeschlagen, wird beim nächsten Mount erneut versucht:', err)
          })
        }
      } else {
        console.warn("[LP] Configs nicht ladbar — Composer bleibt nutzbar")
        setConfigs([])
        setBackendFehler(true)
      }

      if (trackerResult) {
        setTrackerDaten(trackerResult)
      }

      setLadeStatus("fertig")

      // Hintergrund-Prefetch für Fragenbank-Details
      const schedulePrefetch = () => {
        const fbState = useFragenbankStore.getState()
        if (fbState.status === 'summary_fertig') {
          fbState.ladeAlleDetails(user.email)
        }
      }
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(schedulePrefetch)
      } else {
        setTimeout(schedulePrefetch, 2000)
      }
    }
    lade()
  }, [user, istDemoModus])

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
    navigiereZuComposer(config.titel || 'Bearbeiten')
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

  // Breadcrumbs aus dem Store
  const composerBreadcrumbs = ansicht === 'composer' ? useLPNavigationStore.getState().breadcrumbs : undefined

  // Skeleton während Laden — nicht beim Composer (direkter Aufruf möglich)
  if (ladeStatus !== 'fertig' && ansicht !== 'composer') return <LPSkeleton />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <LPHeader
        untertitel={user ? `${user.name} · Lehrperson` : undefined}
        modus={ansicht === 'composer' ? undefined : modus}
        onModusChange={ansicht === 'composer' ? undefined : setModus}
        zurueck={ansicht === 'composer' ? handleZurueck : undefined}
        breadcrumbs={composerBreadcrumbs}
        onHome={ansicht === 'composer' ? handleZurueck : undefined}
        aktionsButtons={
          ansicht === 'composer' ? undefined :
          modus === 'pruefung' ? (
            <button onClick={handleNeue} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
              + Neue Prüfung
            </button>
          ) : modus === 'uebung' ? (
            <button onClick={handleNeueUebung} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
              + Neue Übung
            </button>
          ) : undefined
        }
        onEinstellungen={ansicht === 'composer' ? undefined : () => setZeigEinstellungen(true)}
        onHilfe={ansicht === 'composer' ? undefined : toggleHilfe}
        hilfeOffen={zeigHilfe}
      />

      {ansicht === 'composer' && (
        <PruefungsComposer key={composerKey} config={editConfig} onZurueck={handleZurueck} onDuplizieren={handleDuplizieren} />
      )}

      {/* Dashboard-Inhalte — nur wenn nicht im Composer */}
      {ansicht !== 'composer' && modus === 'uebung' && (
        <>
          {/* Tab-Leiste */}
          <div className="px-6 pt-4">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
              <button
                onClick={() => setUebungsTab('durchfuehren')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  uebungsTab === 'durchfuehren'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Übung durchführen
              </button>
              <button
                onClick={() => setUebungsTab('uebungen')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  uebungsTab === 'uebungen'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Übungen
              </button>
              <button
                onClick={() => setUebungsTab('analyse')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  uebungsTab === 'analyse'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Analyse
              </button>
            </div>
          </div>

          {/* Tab-Content */}
          {uebungsTab === 'uebungen' && <UebungsToolView onFachKlick={() => setModus('fragensammlung')} />}

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
                  <button onClick={handleNeueUebung} className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer">
                    + Neue Übung erstellen
                  </button>
                </div>
              )}
              {ladeStatus === 'fertig' && formativeConfigs.length > 0 && (
                <div className="space-y-3">
                  {/* Such- und Filterleiste (analog Prüfen) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Suche nach Titel, Klasse oder ID..."
                        value={suchtext}
                        onChange={(e) => setSuchtext(e.target.value)}
                        className="input-field flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                      />
                      <select
                        value={sortierung}
                        onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 cursor-pointer"
                      >
                        <option value="datum">Neueste zuerst</option>
                        <option value="titel">Nach Titel</option>
                        <option value="klasse">Nach Klasse</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {verfuegbareFachbereiche.map(fb => {
                        const farbe = getFachFarbe(fb, {})
                        const aktiv = filterFach.includes(fb)
                        return (
                          <button
                            key={fb}
                            onClick={() => toggleFachFilter(fb)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                              !aktiv ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750' : ''
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
                                ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750'
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
                              ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750'
                          }`}
                        >
                          {s === 'aktiv' ? 'Aktiv' : s === 'archiviert' ? 'Archiviert' : 'Alle'}
                        </button>
                      ))}
                      {hatAktiveFilter && (
                        <button
                          onClick={() => { setSuchtext(''); setFilterFach([]); setFilterTyp(null); setFilterGefaess(null); setFilterStatus('aktiv') }}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        >
                          Zurücksetzen
                        </button>
                      )}
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

          {uebungsTab === 'analyse' && <AnalyseDashboard />}
        </>
      )}

      {/* Prüfen-Ansicht */}
      {ansicht !== 'composer' && modus === 'pruefung' && <>
      {/* Tab-Leiste */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          <button
            onClick={() => setListenTab('pruefungen')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              listenTab === 'pruefungen'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Prüfungen
          </button>
          <button
            onClick={() => setListenTab('tracker')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              listenTab === 'tracker'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Analyse
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="p-6">
        {ladeStatus === 'laden' && (
          <p className="text-slate-500 dark:text-slate-400 text-center py-12">
            Prüfungen werden geladen...
          </p>
        )}

        {ladeStatus === "fertig" && backendFehler && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            Backend nicht erreichbar — bestehende Prüfungen konnten nicht geladen werden.
            Der Composer ist trotzdem nutzbar.
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
            <button
              onClick={handleNeue}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              + Neue Prüfung erstellen
            </button>
          </div>
        )}

        {listenTab === 'pruefungen' && ladeStatus === 'fertig' && summativeConfigs.length > 0 && (
          <div className="space-y-3">
            {/* Such- und Filterleiste */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Suche nach Titel, Klasse oder ID..."
                  value={suchtext}
                  onChange={(e) => setSuchtext(e.target.value)}
                  className="input-field flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                />
                <select
                  value={sortierung}
                  onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 cursor-pointer"
                >
                  <option value="datum">Neueste zuerst</option>
                  <option value="titel">Nach Titel</option>
                  <option value="klasse">Nach Klasse</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {verfuegbareFachbereiche.map(fb => {
                  const farbe = getFachFarbe(fb, {})
                  const aktiv = filterFach.includes(fb)
                  return (
                    <button
                      key={fb}
                      onClick={() => toggleFachFilter(fb)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                        !aktiv ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750' : ''
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
                        ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750'
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
                        ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750'
                    }`}
                  >
                    {s === 'aktiv' ? 'Aktiv' : s === 'archiviert' ? 'Archiviert' : 'Alle'}
                  </button>
                ))}
                {hatAktiveFilter && (
                  <button
                    onClick={() => { setSuchtext(''); setFilterFach([]); setFilterTyp(null); setFilterGefaess(null); setFilterStatus('aktiv') }}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Zurücksetzen
                  </button>
                )}
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
                  <button onClick={() => setMultiDashboardOffen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">✕</button>
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
                      window.open(`${window.location.pathname}?ids=${ids}`, '_blank')
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
          <FragenBrowser
            inline
            onHinzufuegen={() => {}}
            onSchliessen={() => useLPNavigationStore.getState().zurueck()}
            bereitsVerwendet={[]}
          />
        </main>
      )}

      {/* Hilfe Overlay (alle Modi) */}
      {zeigHilfe && (
        <HilfeSeite onSchliessen={toggleHilfe} />
      )}

      {/* Einstellungen Panel */}
      {zeigEinstellungen && (
        <EinstellungenPanel onSchliessen={() => setZeigEinstellungen(false)} />
      )}
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
  const toggleFavorit = useLPNavigationStore(s => s.toggleFavorit)
  const favoriten = useLPNavigationStore(s => s.favoriten)
  const istFav = favoriten.includes(c.id)
  const [linkKopiert, setLinkKopiert] = useState(false)
  const kopiereLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${c.id}`
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
          onClick={() => toggleFavorit(c.id)}
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
          className="px-4 py-2 text-xs font-medium text-white dark:text-slate-800 bg-slate-800 dark:bg-slate-200 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          {c.beendetUm ? 'Auswerten' : c.typ === 'formativ' ? 'Übung starten' : 'Durchführen'}
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
