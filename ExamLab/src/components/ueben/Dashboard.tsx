import { useEffect, useState, useRef } from 'react'
import { Shuffle, RotateCw, Star, Lock } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUebenAuthStore } from '../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
import { useUebenFortschrittStore } from '../../store/ueben/fortschrittStore'
import { useUebenAuftragStore } from '../../store/ueben/auftragStore'
import { useUebenNavigationStore } from '../../store/ueben/navigationStore'
import { useDashboardLoad } from '../../hooks/ueben/useDashboardLoad'
import { useSuSNavigation } from '../../hooks/ueben/useSuSNavigation'
import { useThemenKomputationen } from '../../hooks/ueben/useThemenKomputationen'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { preWarmFragen } from '../../services/preWarmApi'
import type { Frage } from '../../types/ueben/fragen'
import { useUebenKontext } from '../../hooks/ueben/useUebenKontext'
import { getFachFarbe } from '../../utils/ueben/fachFarben'
import { useThemenSichtbarkeitStore } from '../../store/ueben/themenSichtbarkeitStore'
import { useUebenSettingsStore } from '../../store/ueben/settingsStore'
import { ThemaKarteMitPreWarm } from './ThemaKarteMitPreWarm'
import { EmpfehlungsKarte } from './EmpfehlungsKarte'
import SuSAnalyse from './SuSAnalyse'
import { ThemaDetailView } from './dashboard/ThemaDetailView'
import type { DeepLinkZiel } from '../../hooks/ueben/useDeepLinkAktivierung'
import type { ThemaQuelle } from '../../types/ueben/uebung'
import type { ThemenStatus } from '../../types/ueben/themenSichtbarkeit'
import type { ThemenInfo } from '../../hooks/ueben/useThemenKomputationen'
import MixSessionDialog from './MixSessionDialog'
import UebungsEinsicht from './UebungsEinsicht'
import { LernzieleMiniModal } from './LernzieleAkkordeon'
import { TYPO } from '../../styles/typografie'

interface DashboardProps {
  deepLinkZiel?: DeepLinkZiel | null
}

export default function Dashboard({ deepLinkZiel }: DashboardProps = {}) {
  const { user } = useUebenAuthStore()
  const { aktiveGruppe } = useUebenGruppenStore()
  const { starteSession } = useUebenUebungsStore()
  const { getThemenFortschritt, fortschritte, lernziele } = useUebenFortschrittStore()
  const { auftraege } = useUebenAuftragStore()
  const { openUebung } = useSuSNavigation()
  const { sichtbareFaecher, fachFarben } = useUebenKontext()
  const { freischaltungen, getStatus, getAktiveUnterthemen } = useThemenSichtbarkeitStore()
  const { einstellungen } = useUebenSettingsStore()
  const { alleFragen, laden } = useDashboardLoad(aktiveGruppe)
  const [alleThemenAnzeigen, setAlleThemenAnzeigen] = useState(false)
  // A4: Welche Fach-Sektionen sind eingeklappt (Default: alle offen)
  const [eingeklappteFaecher, setEingeklappteFaecher] = useState<Set<string>>(() => {
    try {
      const gespeichert = localStorage.getItem('examlab-ueben-fach-collapsed')
      if (gespeichert) return new Set(JSON.parse(gespeichert) as string[])
    } catch { /* ignorieren */ }
    return new Set()
  })
  const toggleFachEinklappen = (fach: string): void => {
    setEingeklappteFaecher(prev => {
      const neu = new Set(prev)
      if (neu.has(fach)) neu.delete(fach)
      else neu.add(fach)
      try { localStorage.setItem('examlab-ueben-fach-collapsed', JSON.stringify([...neu])) } catch { /* ignorieren */ }
      return neu
    })
  }
  const [sortierung, setSortierung] = useState<'alphabetisch' | 'zuletztGeuebt'>(() => {
    try {
      const gespeichert = localStorage.getItem('examlab-ueben-sortierung')
      if (gespeichert === 'zuletztGeuebt') return 'zuletztGeuebt'
    } catch { /* ignorieren */ }
    return 'alphabetisch'
  })

  const handleSortierungAendern = (neu: 'alphabetisch' | 'zuletztGeuebt') => {
    setSortierung(neu)
    try { localStorage.setItem('examlab-ueben-sortierung', neu) } catch { /* ignorieren */ }
  }
  const [dashboardTab, setDashboardTab] = useState<'themen' | 'fortschritt' | 'ergebnisse'>('themen')
  const location = useLocation()

  // Sync dashboardTab mit URL (L2-Tabs im neuen Header)
  useEffect(() => {
    const p = location.pathname
    if (p.includes('/fortschritt') && dashboardTab !== 'fortschritt') setDashboardTab('fortschritt')
    else if (p.includes('/ergebnisse') && dashboardTab !== 'ergebnisse') setDashboardTab('ergebnisse')
    else if (p === '/sus/ueben' || p === '/sus/ueben/' || p.startsWith('/sus/ueben/kurs/')) {
      if (dashboardTab !== 'themen') setDashboardTab('themen')
    }
  }, [location.pathname, dashboardTab])

  const [lzMiniModal, setLzMiniModal] = useState<{ fach: string; thema: string } | null>(null)

  // Navigation: Fachbereich → Thema → Filter → Übung starten
  const [aktiverFach, setAktiverFach] = useState<string | null>(null)
  const [aktivesThema, setAktivesThema] = useState<string | null>(null)

  // Deep-Link: Automatisch zum Thema navigieren wenn Ziel vorhanden
  const deepLinkVerarbeitet = useRef(false)

  // SuS-Suchfeld
  const [suchtext, setSuchtext] = useState('')

  // Filter innerhalb eines Themas (Chips wie pool.html)
  const [unterthemaFilter, setUnterthemaFilter] = useState<Set<string>>(new Set())
  const [schwierigkeitFilter, setSchwierigkeitFilter] = useState<Set<number>>(new Set())
  const [typFilter, setTypFilter] = useState<Set<string>>(new Set())

  // Deep-Link: Nach dem Laden direkt zum Thema navigieren
  useEffect(() => {
    if (deepLinkVerarbeitet.current || !deepLinkZiel || laden || alleFragen.length === 0) return
    deepLinkVerarbeitet.current = true

    // Fach + Thema setzen → Dashboard navigiert zur Thema-Detailansicht
    setAktiverFach(deepLinkZiel.fach)
    setAktivesThema(deepLinkZiel.thema)

    // Unterthema-Filter vorselektieren wenn angegeben
    if (deepLinkZiel.unterthema) {
      setUnterthemaFilter(new Set([deepLinkZiel.unterthema]))
    }

    console.log(`[DeepLink] Dashboard navigiert zu: ${deepLinkZiel.fach} / ${deepLinkZiel.thema}${deepLinkZiel.unterthema ? ` / ${deepLinkZiel.unterthema}` : ''}`)
  }, [deepLinkZiel, laden, alleFragen.length])

  const {
    themenMap,
    verfuegbareFaecher,
    themenSektionen,
    themaDetail,
    gefilterteFragen,
    empfehlungen,
  } = useThemenKomputationen({
    alleFragen,
    fortschritte,
    auftraege,
    user,
    freischaltungen,
    einstellungen,
    sichtbareFaecher,
    aktiverFach,
    aktivesThema,
    alleThemenAnzeigen,
    suchtext,
    unterthemaFilter,
    schwierigkeitFilter,
    typFilter,
    sortierung,
    getThemenFortschritt,
    getStatus,
    getAktiveUnterthemen,
  })

  // Lernziele-Deep-Link: Wenn aus LernzieleAkkordeon ein Thema gewählt wurde
  const deepLinkThema = useUebenNavigationStore((s) => s.deepLinkThema)
  useEffect(() => {
    if (!deepLinkThema || laden || alleFragen.length === 0) return
    const gefunden = Object.values(themenMap).flat().find(t => t.thema === deepLinkThema)
    if (gefunden) {
      setAktiverFach(gefunden.fach)
      setAktivesThema(gefunden.thema)
    }
    useUebenNavigationStore.getState().setDeepLinkThema(null)
  }, [deepLinkThema, laden, alleFragen.length, themenMap])

  const handleStarte = (fach: string, thema: string, fragenOverride?: Frage[]) => {
    if (!aktiveGruppe || !user) return
    // Gesperrtes Thema → freiwilliges Üben ohne Tracking
    const istFreiwillig = freischaltungen.length > 0 && getStatus(fach, thema) === 'nicht_freigeschaltet'
    starteSession(aktiveGruppe.id, user.email, fach, thema, fragenOverride, 'standard', undefined, istFreiwillig)
    openUebung(thema)
  }

  const handleStarteGefiltert = () => {
    if (!themaDetail || gefilterteFragen.length === 0) return
    handleStarte(themaDetail.fach, themaDetail.thema, gefilterteFragen)
  }

  // Mix/Repetition
  const hatFortschrittDaten = Object.keys(fortschritte).length > 0
  const [mixDialogOffen, setMixDialogOffen] = useState(false)

  const handleStarteMix = (quellen: ThemaQuelle[]) => {
    if (!aktiveGruppe || !user || quellen.length < 2) return
    starteSession(aktiveGruppe.id, user.email, 'Mix', 'Gemischte Übung', undefined, 'mix', quellen)
    openUebung('mix')
    setMixDialogOffen(false)
  }

  const handleStarteRepetition = () => {
    if (!aktiveGruppe || !user) return
    starteSession(aktiveGruppe.id, user.email, 'Repetition', 'Schwächen trainieren', undefined, 'repetition')
    openUebung('repetition')
  }

  const toggleChip = <T,>(set: Set<T>, setFn: (s: Set<T>) => void, val: T) => {
    const neu = new Set(set)
    if (neu.has(val)) neu.delete(val)
    else neu.add(val)
    setFn(neu)
  }

  const toggleAll = <T,>(set: Set<T>, setFn: (s: Set<T>) => void, alle: T[]) => {
    if (set.size === alle.length) setFn(new Set())
    else setFn(new Set(alle))
  }

  const zurueckZuThemen = () => {
    setAktivesThema(null)
    setAktiverFach(null) // A1: Nach Übung/Zurück "Alle" statt letzter Fach-Filter
    setUnterthemaFilter(new Set())
    setSchwierigkeitFilter(new Set())
    setTypFilter(new Set())
  }

  // Bundle G.a Trigger B/C: Hilfsfunktion für Pre-Warm via Frontend-Cache-Filter
  const preWarmThema = (fach: string, thema: string): void => {
    const gruppeId = aktiveGruppe?.id
    if (!gruppeId) return
    const cached = uebenFragenAdapter.getCachedFragen(gruppeId)
    if (!cached) return
    const fragenIds = cached
      .filter((f) => f.fach === fach && f.thema === thema)
      .map((f) => f.id)
    if (fragenIds.length > 0) {
      void preWarmFragen(fragenIds, gruppeId, fach)
    }
  }

  // Bundle T.e Phase 4 hotfix#1: DRY-Helper für ThemaKarteMitPreWarm
  // Closure über fachFarben/lernziele/setAktivesThema/setAktiverFach/setLzMiniModal/preWarmThema
  const renderThemaKarte = (info: ThemenInfo, status: ThemenStatus) => (
    <ThemaKarteMitPreWarm
      key={`${info.fach}-${info.thema}`}
      thema={info.thema}
      fach={info.fach}
      anzahlFragen={info.fragen.length}
      anzahlUnterthemen={info.unterthemen.length}
      fortschritt={info.fortschritt}
      themenStatus={status}
      fachFarben={fachFarben}
      onClick={() => { setAktivesThema(info.thema); setAktiverFach(info.fach) }}
      anzahlLernziele={lernziele.filter(lz => lz.aktiv !== false && lz.fach === info.fach && (lz.thema === info.thema || lz.thema?.includes(info.thema) || info.thema?.includes(lz.thema))).length}
      onLernzieleKlick={() => setLzMiniModal({ fach: info.fach, thema: info.thema })}
      onPreWarm={() => preWarmThema(info.fach, info.thema)}
    />
  )

  return (
    <div>
      <main className="max-w-5xl mx-auto p-6">
        <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100 mb-3`}>
          Hallo {user?.vorname || 'dort'}!
        </h2>
        {dashboardTab === 'ergebnisse' ? (
          <UebungsEinsicht />
        ) : dashboardTab === 'fortschritt' ? (
          <SuSAnalyse />
        ) : (
          <>
        {/* Empfehlungen */}
        {!aktivesThema && empfehlungen.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className={`${TYPO.caption} font-bold uppercase tracking-wider text-slate-400 mb-2`}>Für dich empfohlen</h3>
            {empfehlungen.map((e, i) => (
              <EmpfehlungsKarte
                key={i}
                empfehlung={e}
                fachFarben={fachFarben}
                onStarte={() => handleStarte(e.fach, e.thema)}
              />
            ))}
          </div>
        )}

        {/* Mix / Repetition Buttons + Suchfeld (A2: Suchfeld rechtsbündig in derselben Zeile) */}
        {!aktivesThema && !laden && alleFragen.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setMixDialogOffen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" /> Gemischte Übung
            </button>
            <button
              onClick={hatFortschrittDaten ? handleStarteRepetition : undefined}
              disabled={!hatFortschrittDaten}
              title={hatFortschrittDaten ? 'Schwächen gezielt trainieren' : 'Löse zuerst Übungen, um Repetitionsdaten zu sammeln'}
              className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium transition-all ${
                hatFortschrittDaten
                  ? 'text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm cursor-pointer'
                  : 'text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed'
              }`}
            >
              <RotateCw className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" /> Repetition
            </button>
            <input
              type="text"
              value={suchtext}
              onChange={e => setSuchtext(e.target.value)}
              placeholder="Thema, Fach oder Frage suchen..."
              className="ml-auto w-64 max-w-[40%] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            />
          </div>
        )}

        {/* Mix-Dialog */}
        {mixDialogOffen && (
          <MixSessionDialog
            themen={Object.values(themenMap).flat().map(t => ({ fach: t.fach, thema: t.thema, anzahl: t.fragen.length }))}
            fachFarben={fachFarben}
            onStarte={handleStarteMix}
            onSchliessen={() => setMixDialogOffen(false)}
          />
        )}

        {laden ? (
          <p className="text-slate-500">Themen werden geladen...</p>
        ) : alleFragen.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm text-slate-500">
            Noch keine Übungsfragen vorhanden.
          </div>
        ) : aktivesThema && themaDetail ? (
          /* ===================== THEMA-DETAIL (Pool-Stil Filter) ===================== */
          <ThemaDetailView
            themaDetail={themaDetail}
            gefilterteFragen={gefilterteFragen}
            unterthemaFilter={unterthemaFilter}
            schwierigkeitFilter={schwierigkeitFilter}
            typFilter={typFilter}
            onToggleUnterthema={(v) => toggleChip(unterthemaFilter, setUnterthemaFilter, v)}
            onToggleSchwierigkeit={(v) => toggleChip(schwierigkeitFilter, setSchwierigkeitFilter, v)}
            onToggleTyp={(v) => toggleChip(typFilter, setTypFilter, v)}
            onToggleAlleUnterthemen={() => toggleAll(unterthemaFilter, setUnterthemaFilter, themaDetail.unterthemen)}
            onToggleAlleSchwierigkeiten={() => {
              const alle = [...new Set(themaDetail.fragen.map(f => f.schwierigkeit ?? 2))]
              toggleAll(schwierigkeitFilter, setSchwierigkeitFilter, alle)
            }}
            onToggleAlleTypen={() => {
              const alle = [...new Set(themaDetail.fragen.map(f => f.typ))]
              toggleAll(typFilter, setTypFilter, alle)
            }}
            onZurueck={zurueckZuThemen}
            onStarte={handleStarteGefiltert}
            fachFarben={fachFarben}
          />
        ) : (
          /* ===================== THEMEN-ÜBERSICHT (Fach → Thema Karten) ===================== */
          <>
            {/* Fach-Filter Chips (links) + Alle-Themen-Toggle + Sortierung (rechts) — A3 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                onClick={() => setAktiverFach(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
                  !aktiverFach
                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400'
                }`}
              >
                Alle
              </button>
              {verfuegbareFaecher.map(fach => {
                const farbe = getFachFarbe(fach, fachFarben)
                return (
                  <button
                    key={fach}
                    onClick={() => {
                      const wirdAktiv = aktiverFach !== fach
                      setAktiverFach(wirdAktiv ? fach : null)
                      if (wirdAktiv && aktiveGruppe?.id) {
                        // Bundle G.a Trigger B
                        const gid = aktiveGruppe.id
                        const lastUsed = (() => {
                          try {
                            return localStorage.getItem(`examlab.lastUsedThema.${gid}.${fach}`)
                          } catch {
                            return null
                          }
                        })()
                        if (lastUsed) preWarmThema(fach, lastUsed)
                      }
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors"
                    style={aktiverFach === fach
                      ? { backgroundColor: farbe, color: '#fff', borderColor: farbe }
                      : { borderColor: '#e5e5e5', color: farbe }
                    }
                  >
                    {fach}
                  </button>
                )
              })}
              {/* Rechte Gruppe: Alle-Themen-Toggle + Sortier-Dropdown */}
              <div className="ml-auto flex items-center gap-2">
                {freischaltungen.length > 0 && (
                  <button
                    onClick={() => setAlleThemenAnzeigen(!alleThemenAnzeigen)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      alleThemenAnzeigen
                        ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-300 dark:text-slate-800 dark:border-slate-300'
                        : 'text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {alleThemenAnzeigen ? 'Nur freigeschaltete' : 'Alle Themen anzeigen'}
                  </button>
                )}
                <select
                  value={sortierung}
                  onChange={e => handleSortierungAendern(e.target.value as 'alphabetisch' | 'zuletztGeuebt')}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 focus:outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="alphabetisch">A–Z</option>
                  <option value="zuletztGeuebt">Zuletzt geübt</option>
                </select>
              </div>
            </div>

            {/* Thema-Karten nach Sektionen */}
            <div className="space-y-6">
              {/* Aktuelle Themen */}
              {themenSektionen.aktuelle.length > 0 && (
                <div>
                  <h3 className={`${TYPO.caption} font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1.5`}>
                    <Star className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true" /> Aktuelle Themen
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {themenSektionen.aktuelle.map(info => renderThemaKarte(info, 'aktiv'))}
                  </div>
                </div>
              )}

              {/* Freigegebene Themen nach Fach — A4: ein-/ausklappbar */}
              {themenSektionen.faecherSortiert.map(([fach, themen]) => {
                const eingeklappt = eingeklappteFaecher.has(fach)
                return (
                  <div key={fach}>
                    <button
                      type="button"
                      onClick={() => toggleFachEinklappen(fach)}
                      className="w-full flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer text-left"
                      aria-expanded={!eingeklappt}
                    >
                      <span className={`text-slate-400 transition-transform ${eingeklappt ? '' : 'rotate-90'}`}>▸</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getFachFarbe(fach, fachFarben) }} />
                      <span>{fach}</span>
                      <span className="text-slate-400 font-normal normal-case tracking-normal">({themen.length})</span>
                    </button>
                    {!eingeklappt && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {themen.map(info => renderThemaKarte(info, 'abgeschlossen'))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Weitere Themen (nicht freigeschaltet) */}
              {themenSektionen.weitere.length > 0 && (
                <div className="opacity-60">
                  <h3 className={`${TYPO.caption} font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5`}>
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Weitere Themen
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {themenSektionen.weitere.map(info => renderThemaKarte(info, 'nicht_freigeschaltet'))}
                  </div>
                </div>
              )}
            </div>

            {/* Lernziele Mini-Modal */}
            {lzMiniModal && (
              <LernzieleMiniModal
                fach={lzMiniModal.fach}
                thema={lzMiniModal.thema}
                lernziele={lernziele}
                fortschritte={fortschritte}
                onSchliessen={() => setLzMiniModal(null)}
                onUeben={() => {
                  setLzMiniModal(null)
                  setAktivesThema(lzMiniModal.thema)
                  setAktiverFach(lzMiniModal.fach)
                }}
              />
            )}
          </>
        )}
        </>
        )}
      </main>
    </div>
  )
}
