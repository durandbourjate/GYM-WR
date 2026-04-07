import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { useFragenbankStore } from '../../store/fragenbankStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PruefungsConfig } from '../../types/pruefung.ts'
import type { TrackerDaten, TrackerPruefungSummary } from '../../types/tracker.ts'
import { formatDatum } from '../../utils/zeit.ts'
import { getFachFarbe } from '../../utils/ueben/fachFarben.ts'
import { bestimmePruefungsStatus, statusLabel, statusFarbe, korrekturLabel, erstelleDemoTrackerDaten } from '../../utils/trackerUtils.ts'
import LPHeader from './LPHeader.tsx'
import PruefungsComposer, { leereUebung } from './vorbereitung/PruefungsComposer.tsx'
import FragenBrowser from './fragenbank/FragenBrowser.tsx'
import HilfeSeite from './HilfeSeite.tsx'
import UebungsToolView from './UebungsToolView.tsx'
import TrackerSection from './TrackerSection.tsx'
// demoPruefung entfernt — nur noch Einrichtungsprüfung im Demo-Modus
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

  const [configs, setConfigs] = useState<PruefungsConfig[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [backendFehler, setBackendFehler] = useState(false)
  const [ansicht, setAnsicht] = useState<'liste' | 'composer'>('liste')
  const [editConfig, setEditConfig] = useState<PruefungsConfig | null>(null)
  const [composerKey, setComposerKey] = useState(0)
  const [zeigHilfe, setZeigHilfe] = useState(false)
  const [zeigEinstellungen, setZeigEinstellungen] = useState(false)
  const [modus, setModusRaw] = useState<'pruefung' | 'uebung' | 'fragensammlung'>(() => {
    try {
      const gespeichert = sessionStorage.getItem('lp-modus')
      if (gespeichert === 'pruefung' || gespeichert === 'uebung' || gespeichert === 'fragensammlung') return gespeichert
    } catch { /* ignore */ }
    return 'pruefung'
  })
  const [vorherigerModus, setVorherigerModus] = useState<'pruefung' | 'uebung'>('pruefung')
  const setModus = (m: 'pruefung' | 'uebung' | 'fragensammlung') => {
    // Vorherigen Nicht-Fragensammlung-Modus merken für Zurück-Navigation
    if (m === 'fragensammlung' && modus !== 'fragensammlung') {
      setVorherigerModus(modus === 'uebung' ? 'uebung' : 'pruefung')
    }
    setModusRaw(m)
    try { sessionStorage.setItem('lp-modus', m) } catch { /* ignore */ }
  }
  const [listenTab, setListenTab] = useState<'pruefungen' | 'tracker'>('pruefungen')
  const [uebungsTab, setUebungsTab] = useState<'uebungen' | 'durchfuehren' | 'analyse'>('durchfuehren')
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
  const SYNC_KEY = 'einrichtung-sync-v2'
  const SYNC_VERSION = `${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}`

  async function syncEinrichtungsPruefung(email: string, backendConfigs: PruefungsConfig[]): Promise<void> {
    // Guard: Bereits für diese Version synchronisiert?
    try { if (localStorage.getItem(SYNC_KEY) === SYNC_VERSION) return } catch { /* ignore */ }

    const backendVersion = backendConfigs.find(c => c.id === einrichtungsPruefung.id)
    // Sync wenn: nicht vorhanden ODER Punktzahl/Typ anders
    if (backendVersion && backendVersion.gesamtpunkte === einrichtungsPruefung.gesamtpunkte && backendVersion.typ === einrichtungsPruefung.typ) {
      // Bereits aktuell — Guard setzen und fertig
      try { localStorage.setItem(SYNC_KEY, SYNC_VERSION) } catch { /* ignore */ }
      return
    }

    console.log('[LP] Einrichtungsprüfung sync starten...', backendVersion ? 'update' : 'neu')
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
  const UEBUNG_SYNC_KEY = 'einrichtung-uebung-sync-v2'
  const UEBUNG_SYNC_VERSION = `${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}`

  async function syncEinrichtungsUebung(email: string, backendConfigs: PruefungsConfig[]): Promise<void> {
    try { if (localStorage.getItem(UEBUNG_SYNC_KEY) === UEBUNG_SYNC_VERSION) return } catch { /* ignore */ }

    const backendVersion = backendConfigs.find(c => c.id === einrichtungsUebung.id)
    if (backendVersion && backendVersion.gesamtpunkte === einrichtungsUebung.gesamtpunkte) {
      try { localStorage.setItem(UEBUNG_SYNC_KEY, UEBUNG_SYNC_VERSION) } catch { /* ignore */ }
      return
    }

    console.log('[LP] Einführungsübung sync starten...', backendVersion ? 'update' : 'neu')
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
        // Einrichtungsprüfung + Einführungsübung im Hintergrund synchronisieren
        Promise.all([
          syncEinrichtungsPruefung(user.email, configResult),
          syncEinrichtungsUebung(user.email, configResult),
        ]).then(() => {
          // Nach Sync: Configs IMMER neu laden (typ könnte sich geändert haben)
          apiService.ladeAlleConfigs(user.email).then(r => { if (r) setConfigs(r) })
        })
      } else {
        console.warn("[LP] Configs nicht ladbar — Composer bleibt nutzbar")
        setConfigs([])
        setBackendFehler(true)
      }

      if (trackerResult) {
        setTrackerDaten(trackerResult)
      }

      setLadeStatus("fertig")
    }
    lade()
  }, [user, istDemoModus])

  function handleNeue(): void {
    setEditConfig(null)
    setAnsicht('composer')
  }

  function handleNeueUebung(): void {
    setEditConfig({ ...leereUebung })
    setComposerKey(k => k + 1)
    setAnsicht('composer')
  }

  function handleBearbeiten(config: PruefungsConfig): void {
    setEditConfig(config)
    setAnsicht('composer')
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
    setComposerKey(k => k + 1)  // Composer komplett neu mounten
    setAnsicht('composer')
  }

  function handleZurueck(): void {
    setAnsicht('liste')
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

  if (ansicht === 'composer') {
    return <PruefungsComposer key={composerKey} config={editConfig} onZurueck={handleZurueck} onDuplizieren={handleDuplizieren} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <LPHeader
        untertitel={user ? `${user.name} · Lehrperson` : undefined}
        modus={modus}
        onModusChange={setModus}
        aktionsButtons={
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
        onEinstellungen={() => setZeigEinstellungen(true)}
        onHilfe={() => { setZeigHilfe(!zeigHilfe) }}
        hilfeOffen={zeigHilfe}
      />

      {/* Übungstool-Ansicht */}
      {modus === 'uebung' && (
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
      {modus === 'pruefung' && <>
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

            {/* Zähler */}
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {hatAktiveFilter
                ? `${gefilterteConfigs.length} von ${summativeConfigs.length} Prüfungen`
                : `${summativeConfigs.length} Prüfungen`}
            </h2>

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
      {modus === 'fragensammlung' && (
        <main className="p-6">
          <FragenBrowser
            inline
            onHinzufuegen={() => {}}
            onSchliessen={() => setModus(vorherigerModus)}
            bereitsVerwendet={[]}
          />
        </main>
      )}

      {/* Hilfe Overlay (alle Modi) */}
      {zeigHilfe && (
        <HilfeSeite onSchliessen={() => setZeigHilfe(false)} />
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
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4">
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
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`${window.location.pathname}?id=${c.id}`}
          className="px-4 py-2 text-xs font-medium text-white dark:text-slate-800 bg-slate-800 dark:bg-slate-200 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          {c.beendetUm ? 'Auswerten' : c.typ === 'formativ' ? 'Übung starten' : 'Durchführen'}
        </a>
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

/** Demo-Konfigurationen für den Demo-Modus — nur Einrichtungsprüfung */
function demoConfigs(): PruefungsConfig[] {
  return [einrichtungsPruefung]
}
