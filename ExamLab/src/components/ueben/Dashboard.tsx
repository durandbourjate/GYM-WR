import { useEffect, useState, useMemo, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useUebenAuthStore } from '../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
import { useUebenFortschrittStore } from '../../store/ueben/fortschrittStore'
import { useUebenAuftragStore } from '../../store/ueben/auftragStore'
import { useUebenNavigationStore } from '../../store/ueben/navigationStore'
import { useSuSNavigation } from '../../hooks/ueben/useSuSNavigation'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { berechneEmpfehlungen } from '../../utils/ueben/empfehlungen'
import type { Frage } from '../../types/ueben/fragen'
import type { ThemenFortschritt } from '../../types/ueben/fortschritt'
import type { Empfehlung } from '../../types/ueben/auftrag'
import { berechneSterne, sterneText } from '../../utils/ueben/gamification'
import { useUebenKontext } from '../../hooks/ueben/useUebenKontext'
import { getFachFarbe } from '../../utils/ueben/fachFarben'
import { poolTitel } from '../../utils/poolTitelMapping'
import { useThemenSichtbarkeitStore } from '../../store/ueben/themenSichtbarkeitStore'
import { useUebenSettingsStore } from '../../store/ueben/settingsStore'
import { ThemaKarte } from './ThemaKarte'
import { EmpfehlungsKarte } from './EmpfehlungsKarte'
import SuSAnalyse from './SuSAnalyse'
import type { DeepLinkZiel } from '../../hooks/ueben/useDeepLinkAktivierung'
import type { ThemaQuelle } from '../../types/ueben/uebung'
import MixSessionDialog from './MixSessionDialog'
import UebungsEinsicht from './UebungsEinsicht'
import { LernzieleMiniModal } from './LernzieleAkkordeon'

const SCHWIERIGKEIT_LABELS: Record<number, string> = { 1: 'Einfach', 2: 'Mittel', 3: 'Schwer' }
const SCHWIERIGKEIT_STERNE: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

const TYP_LABELS: Record<string, string> = {
  mc: 'Multiple Choice', multi: 'Multi', tf: 'Richtig/Falsch', fill: 'Lückentext', calc: 'Berechnung',
  sort: 'Zuordnung', sortierung: 'Sortierung', zuordnung: 'Paare',
  open: 'Freitext', formel: 'Formel', pdf: 'PDF-Annotation',
  buchungssatz: 'Buchungssatz', tkonto: 'T-Konto', bilanz: 'Bilanz', kontenbestimmung: 'Kontenbestimmung',
  hotspot: 'Hotspot', bildbeschriftung: 'Bildbeschriftung', dragdrop_bild: 'Drag & Drop',
  gruppe: 'Aufgabengruppe', zeichnen: 'Zeichnen', audio: 'Audio', code: 'Code',
  richtigfalsch: 'Richtig/Falsch', lueckentext: 'Lückentext', berechnung: 'Berechnung',
  freitext: 'Freitext', visualisierung: 'Zeichnen', bilanzstruktur: 'Bilanz',
  aufgabengruppe: 'Aufgabengruppe',
}

interface ThemenInfo {
  fach: string
  thema: string
  unterthemen: string[]
  fragen: Frage[]
  fortschritt: ThemenFortschritt
}

interface DashboardProps {
  deepLinkZiel?: DeepLinkZiel | null
}

export default function Dashboard({ deepLinkZiel }: DashboardProps = {}) {
  const { user } = useUebenAuthStore()
  const { aktiveGruppe } = useUebenGruppenStore()
  const { starteSession } = useUebenUebungsStore()
  const { ladeFortschritt, getThemenFortschritt, fortschritte, lernziele } = useUebenFortschrittStore()
  const { ladeAuftraege, auftraege } = useUebenAuftragStore()
  const { zuUebung } = useSuSNavigation()
  const { sichtbareFaecher, fachFarben } = useUebenKontext()
  const { freischaltungen, ladeFreischaltungen, getStatus, getAktiveUnterthemen } = useThemenSichtbarkeitStore()
  const { einstellungen } = useUebenSettingsStore()
  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)
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

  useEffect(() => {
    ladeFortschritt()
    if (aktiveGruppe) ladeAuftraege(aktiveGruppe.id)
  }, [ladeFortschritt, ladeAuftraege, aktiveGruppe])

  useEffect(() => {
    if (!aktiveGruppe) return
    const ladeThemen = async () => {
      setLaden(true)
      const fragen = await uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
      setAlleFragen(fragen)
      setLaden(false)
    }
    ladeThemen()
    ladeFreischaltungen(aktiveGruppe.id)
  }, [aktiveGruppe, ladeFreischaltungen])

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

  // Themen-Infos: Fach → Thema → { unterthemen, fragen, fortschritt }
  const themenMap = useMemo(() => {
    const map: Record<string, ThemenInfo[]> = {}
    const fachThema: Record<string, Record<string, Frage[]>> = {}

    for (const f of alleFragen) {
      const themaRaw = f.thema || 'Allgemein'
      const poolId = (f as { poolId?: string }).poolId || ''
      const hatUnterthema = !!(f as { unterthema?: string }).unterthema
      const tags = (f.tags || []) as (string | { name: string })[]

      // Einrichtungsfragen komplett ausblenden — ausser im Demo-Modus, wo sie der einzige Inhalt sind
      const istDemo = useAuthStore.getState().istDemoModus
      if (!istDemo) {
        if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung')) continue
        if (themaRaw === 'Einrichtung' || themaRaw === 'Einrichtungstest') continue
      }

      const fach = f.fach || 'Andere'

      let thema = themaRaw
      // Pool-Fragen: Pool-Titel aus fester Mapping-Tabelle, Topic-Label = Unterthema
      if (!hatUnterthema && poolId) {
        const poolMetaId = poolId.split(':')[0]
        const titel = poolTitel(poolMetaId)
        if (titel) {
          thema = titel
          ;(f as { unterthema?: string }).unterthema = themaRaw
        }
      }

      if (sichtbareFaecher.length > 0 && !sichtbareFaecher.includes(fach)) continue
      if (!fachThema[fach]) fachThema[fach] = {}
      if (!fachThema[fach][thema]) fachThema[fach][thema] = []
      fachThema[fach][thema].push(f)
    }

    for (const [fach, themen] of Object.entries(fachThema)) {
      map[fach] = Object.entries(themen).map(([thema, fragen]) => {
        const unterthemen = [...new Set(
          fragen.map(f => (f as { unterthema?: string }).unterthema).filter(Boolean)
        )].sort() as string[]
        return { fach, thema, unterthemen, fragen, fortschritt: getThemenFortschritt(fragen) }
      }).sort((a, b) => a.thema.localeCompare(b.thema))
    }
    return map
  }, [alleFragen, getThemenFortschritt, sichtbareFaecher])

  const verfuegbareFaecher = useMemo(() => Object.keys(themenMap).sort(), [themenMap])

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

  // Sichtbare Themen (abhängig vom Fach-Filter + Sichtbarkeitsfilter)
  const sichtbareThemenListe = useMemo(() => {
    const alleFachThemen = aktiverFach ? (themenMap[aktiverFach] || []) : Object.values(themenMap).flat()

    // Wenn keine Freischaltungen existieren → alle anzeigen (Fallback)
    if (freischaltungen.length === 0) return alleFachThemen

    // Wenn "Alle Themen anzeigen" aktiv → alles zeigen
    if (alleThemenAnzeigen) return alleFachThemen

    // Nur aktive + abgeschlossene Themen anzeigen (nicht_freigeschaltet nur bei "Alle Themen")
    let gefiltert = alleFachThemen
      .filter(info => {
        const status = getStatus(info.fach, info.thema)
        return status === 'aktiv' || status === 'abgeschlossen'
      })
      .map(info => {
        // Unterthemen-Filter: Wenn nur bestimmte Unterthemen aktiv → Fragen filtern
        const aktiveUT = getAktiveUnterthemen(info.fach, info.thema)
        if (!aktiveUT || aktiveUT.length === 0) return info // Alle Unterthemen aktiv
        const gefilterteFragen = info.fragen.filter(f => {
          const ut = (f as { unterthema?: string }).unterthema
          return !ut || aktiveUT.includes(ut) // Fragen ohne Unterthema immer zeigen
        })
        if (gefilterteFragen.length === 0) return null // Keine Fragen übrig → Thema ausblenden
        const gefilteterteUnterthemen = info.unterthemen.filter(ut => aktiveUT.includes(ut))
        return { ...info, fragen: gefilterteFragen, unterthemen: gefilteterteUnterthemen, fortschritt: getThemenFortschritt(gefilterteFragen) }
      })
      .filter((info): info is ThemenInfo => info !== null)

    // Suchtext: Themen + Unterthemen + Fachtitel durchsuchen
    if (suchtext.trim()) {
      const lower = suchtext.toLowerCase().trim()
      gefiltert = (alleThemenAnzeigen ? alleFachThemen : gefiltert).filter(info =>
        info.thema.toLowerCase().includes(lower) ||
        info.fach.toLowerCase().includes(lower) ||
        info.unterthemen.some(ut => ut.toLowerCase().includes(lower)) ||
        info.fragen.some(f => ('fragetext' in f && typeof f.fragetext === 'string') ? f.fragetext.toLowerCase().includes(lower) : false)
      )
    }

    return gefiltert
  }, [themenMap, aktiverFach, freischaltungen, alleThemenAnzeigen, getStatus, suchtext])

  // Letzte Übung pro Thema (für Sortierung "Zuletzt geübt")
  const letzteUebungProThema = useMemo(() => {
    const map = new Map<string, string>() // "fach|thema" → ISO-Timestamp
    for (const f of Object.values(fortschritte)) {
      if (!f.letzterVersuch) continue
      for (const thema of sichtbareThemenListe) {
        const gehoertZuThema = thema.fragen.some(frage => frage.id === f.fragenId)
        if (gehoertZuThema) {
          const key = `${thema.fach}|${thema.thema}`
          const bisheriger = map.get(key)
          if (!bisheriger || f.letzterVersuch > bisheriger) {
            map.set(key, f.letzterVersuch)
          }
        }
      }
    }
    return map
  }, [sichtbareThemenListe, fortschritte])

  // Themen in Sektionen aufteilen (aktuelle, freigegebene nach Fach, weitere)
  const themenSektionen = useMemo(() => {
    const aktuelle: ThemenInfo[] = []
    const freigegebeneNachFach = new Map<string, ThemenInfo[]>()
    const weitere: ThemenInfo[] = []

    for (const t of sichtbareThemenListe) {
      const status = freischaltungen.length > 0 ? getStatus(t.fach, t.thema) : 'abgeschlossen'
      if (status === 'aktiv') {
        aktuelle.push(t)
      } else if (status === 'abgeschlossen') {
        const liste = freigegebeneNachFach.get(t.fach) ?? []
        liste.push(t)
        freigegebeneNachFach.set(t.fach, liste)
      } else if (status === 'nicht_freigeschaltet') {
        weitere.push(t)
      }
    }

    const sortiereFn = (a: ThemenInfo, b: ThemenInfo) => {
      if (sortierung === 'zuletztGeuebt') {
        const tA = letzteUebungProThema.get(`${a.fach}|${a.thema}`) ?? ''
        const tB = letzteUebungProThema.get(`${b.fach}|${b.thema}`) ?? ''
        if (tA !== tB) return tB.localeCompare(tA) // neueste zuerst
      }
      return a.thema.localeCompare(b.thema)
    }

    aktuelle.sort(sortiereFn)
    for (const [, themen] of freigegebeneNachFach) {
      themen.sort(sortiereFn)
    }
    weitere.sort(sortiereFn)

    const faecherSortiert = [...freigegebeneNachFach.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    return { aktuelle, faecherSortiert, weitere }
  }, [sichtbareThemenListe, freischaltungen, sortierung, letzteUebungProThema, getStatus])

  // Aktives Thema-Detail
  const themaDetail = useMemo(() => {
    if (!aktivesThema) return null
    return sichtbareThemenListe.find(t => t.thema === aktivesThema) || null
  }, [sichtbareThemenListe, aktivesThema])

  // Gefilterte Fragen im aktiven Thema
  const gefilterteFragen = useMemo(() => {
    if (!themaDetail) return []
    return themaDetail.fragen.filter(f => {
      if (unterthemaFilter.size > 0 && !unterthemaFilter.has((f as { unterthema?: string }).unterthema || '')) return false
      if (schwierigkeitFilter.size > 0 && !schwierigkeitFilter.has(f.schwierigkeit ?? 2)) return false
      if (typFilter.size > 0 && !typFilter.has(f.typ)) return false
      return true
    })
  }, [themaDetail, unterthemaFilter, schwierigkeitFilter, typFilter])

  // Empfehlungen (erweitert: Freischaltungen + LP-Fokus)
  const empfehlungen: Empfehlung[] = useMemo(() => {
    if (!user || alleFragen.length === 0) return []
    return berechneEmpfehlungen(
      alleFragen, fortschritte, auftraege, user.email,
      freischaltungen, einstellungen || undefined,
    )
  }, [alleFragen, fortschritte, auftraege, user, freischaltungen, einstellungen])

  const handleStarte = (fach: string, thema: string, fragenOverride?: Frage[]) => {
    if (!aktiveGruppe || !user) return
    // Gesperrtes Thema → freiwilliges Üben ohne Tracking
    const istFreiwillig = freischaltungen.length > 0 && getStatus(fach, thema) === 'nicht_freigeschaltet'
    starteSession(aktiveGruppe.id, user.email, fach, thema, fragenOverride, 'standard', undefined, istFreiwillig)
    zuUebung(thema)
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
    zuUebung('mix')
    setMixDialogOffen(false)
  }

  const handleStarteRepetition = () => {
    if (!aktiveGruppe || !user) return
    starteSession(aktiveGruppe.id, user.email, 'Repetition', 'Schwächen trainieren', undefined, 'repetition')
    zuUebung('repetition')
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

  return (
    <div>
      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-bold dark:text-white mb-3">
          Hallo {user?.vorname || 'dort'}!
        </h2>
        <div className="flex items-center mb-4">
          {/* Tab-Wechsel: Themen | Mein Fortschritt — linksbündig analog LP */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setDashboardTab('themen')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dashboardTab === 'themen'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Themen
            </button>
            <button
              onClick={() => setDashboardTab('fortschritt')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dashboardTab === 'fortschritt'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Mein Fortschritt
            </button>
            <button
              onClick={() => setDashboardTab('ergebnisse')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dashboardTab === 'ergebnisse'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Ergebnisse
            </button>
          </div>
        </div>

        {dashboardTab === 'ergebnisse' ? (
          <UebungsEinsicht />
        ) : dashboardTab === 'fortschritt' ? (
          <SuSAnalyse />
        ) : (
          <>
        {/* Empfehlungen */}
        {!aktivesThema && empfehlungen.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Für dich empfohlen</h3>
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
              <span>🔀</span> Gemischte Übung
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
              <span>🔄</span> Repetition
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
                    onClick={() => setAktiverFach(aktiverFach === fach ? null : fach)}
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1.5">
                    <span>★</span> Aktuelle Themen
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {themenSektionen.aktuelle.map(info => (
                      <ThemaKarte
                        key={`${info.fach}-${info.thema}`}
                        thema={info.thema}
                        fach={info.fach}
                        anzahlFragen={info.fragen.length}
                        anzahlUnterthemen={info.unterthemen.length}
                        fortschritt={info.fortschritt}
                        themenStatus="aktiv"
                        fachFarben={fachFarben}
                        onClick={() => { setAktivesThema(info.thema); setAktiverFach(info.fach) }}
                        anzahlLernziele={lernziele.filter(lz => lz.aktiv !== false && lz.fach === info.fach && (lz.thema === info.thema || lz.thema?.includes(info.thema) || info.thema?.includes(lz.thema))).length}
                        onLernzieleKlick={() => setLzMiniModal({ fach: info.fach, thema: info.thema })}
                      />
                    ))}
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
                        {themen.map(info => (
                          <ThemaKarte
                            key={`${info.fach}-${info.thema}`}
                            thema={info.thema}
                            fach={info.fach}
                            anzahlFragen={info.fragen.length}
                            anzahlUnterthemen={info.unterthemen.length}
                            fortschritt={info.fortschritt}
                            themenStatus="abgeschlossen"
                            fachFarben={fachFarben}
                            onClick={() => { setAktivesThema(info.thema); setAktiverFach(info.fach) }}
                            anzahlLernziele={lernziele.filter(lz => lz.aktiv !== false && lz.fach === info.fach && (lz.thema === info.thema || lz.thema?.includes(info.thema) || info.thema?.includes(lz.thema))).length}
                            onLernzieleKlick={() => setLzMiniModal({ fach: info.fach, thema: info.thema })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Weitere Themen (nicht freigeschaltet) */}
              {themenSektionen.weitere.length > 0 && (
                <div className="opacity-60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                    <span>🔒</span> Weitere Themen
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {themenSektionen.weitere.map(info => (
                      <ThemaKarte
                        key={`${info.fach}-${info.thema}`}
                        thema={info.thema}
                        fach={info.fach}
                        anzahlFragen={info.fragen.length}
                        anzahlUnterthemen={info.unterthemen.length}
                        fortschritt={info.fortschritt}
                        themenStatus="nicht_freigeschaltet"
                        fachFarben={fachFarben}
                        onClick={() => { setAktivesThema(info.thema); setAktiverFach(info.fach) }}
                        anzahlLernziele={lernziele.filter(lz => lz.aktiv !== false && lz.fach === info.fach && (lz.thema === info.thema || lz.thema?.includes(info.thema) || info.thema?.includes(lz.thema))).length}
                        onLernzieleKlick={() => setLzMiniModal({ fach: info.fach, thema: info.thema })}
                      />
                    ))}
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

// ===================== THEMA-DETAIL VIEW (Pool-Stil) =====================

interface ThemaDetailProps {
  themaDetail: ThemenInfo
  gefilterteFragen: Frage[]
  unterthemaFilter: Set<string>
  schwierigkeitFilter: Set<number>
  typFilter: Set<string>
  onToggleUnterthema: (v: string) => void
  onToggleSchwierigkeit: (v: number) => void
  onToggleTyp: (v: string) => void
  onToggleAlleUnterthemen: () => void
  onToggleAlleSchwierigkeiten: () => void
  onToggleAlleTypen: () => void
  onZurueck: () => void
  onStarte: () => void
  fachFarben: Record<string, string>
}

function ThemaDetailView({
  themaDetail, gefilterteFragen,
  unterthemaFilter, schwierigkeitFilter, typFilter,
  onToggleUnterthema, onToggleSchwierigkeit, onToggleTyp,
  onToggleAlleUnterthemen, onToggleAlleSchwierigkeiten, onToggleAlleTypen,
  onZurueck, onStarte, fachFarben,
}: ThemaDetailProps) {
  const farbe = getFachFarbe(themaDetail.fach, fachFarben)
  // Immer alle 3 Schwierigkeitsstufen anzeigen (Pool-Fragen haben diff 1-3)
  const verfuegbareSchwierigkeiten = [1, 2, 3]
  const verfuegbareTypen = [...new Set(themaDetail.fragen.map(f => f.typ))].sort()
  const filterAktiv = unterthemaFilter.size > 0 || schwierigkeitFilter.size > 0 || typFilter.size > 0

  return (
    <div className="space-y-4">
      {/* Header mit Zurück */}
      <div className="flex items-center gap-3">
        <button
          onClick={onZurueck}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          ←
        </button>
        <div>
          <h3 className="text-lg font-bold dark:text-white">{themaDetail.thema}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: farbe }} />
            <span>{themaDetail.fach}</span>
            <span>·</span>
            <span>{themaDetail.fragen.length} Fragen</span>
          </div>
        </div>
      </div>

      {/* Fortschritt */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <FortschrittsBalken fortschritt={themaDetail.fortschritt} />
        <div className="flex justify-between mt-2">
          <MasteryBadges fortschritt={themaDetail.fortschritt} />
          <span className="text-sm">{sterneText(berechneSterne(themaDetail.fortschritt.quote))}</span>
        </div>
      </div>

      {/* Unterthema-Chips */}
      {themaDetail.unterthemen.length > 0 && (
        <FilterSection
          titel="Unterthemen"
          emoji="📚"
          onToggleAlle={onToggleAlleUnterthemen}
        >
          {themaDetail.unterthemen.map(ut => {
            const anzahl = themaDetail.fragen.filter(f => (f as { unterthema?: string }).unterthema === ut).length
            return (
              <Chip
                key={ut}
                label={ut}
                count={anzahl}
                aktiv={unterthemaFilter.has(ut)}
                farbe={farbe}
                onClick={() => onToggleUnterthema(ut)}
              />
            )
          })}
        </FilterSection>
      )}

      {/* Schwierigkeits-Chips */}
      <FilterSection titel="Schwierigkeit" emoji="📊" onToggleAlle={onToggleAlleSchwierigkeiten}>
        {verfuegbareSchwierigkeiten.map(s => {
          const anzahl = themaDetail.fragen.filter(f => (f.schwierigkeit ?? 2) === s).length
          return (
            <Chip
              key={s}
              label={`${SCHWIERIGKEIT_STERNE[s] || '⭐'} ${SCHWIERIGKEIT_LABELS[s] || `Stufe ${s}`}`}
              count={anzahl}
              aktiv={schwierigkeitFilter.has(s)}
              farbe={farbe}
              onClick={() => onToggleSchwierigkeit(s)}
            />
          )
        })}
      </FilterSection>

      {/* Fragetyp-Chips */}
      {verfuegbareTypen.length > 0 && (
        <FilterSection titel="Fragetyp" emoji="✏️" onToggleAlle={onToggleAlleTypen}>
          {verfuegbareTypen.map(t => {
            const anzahl = themaDetail.fragen.filter(f => f.typ === t).length
            return (
              <Chip
                key={t}
                label={TYP_LABELS[t] || t}
                count={anzahl}
                aktiv={typFilter.has(t)}
                farbe={farbe}
                onClick={() => onToggleTyp(t)}
              />
            )
          })}
        </FilterSection>
      )}

      {/* Info-Balken + Start-Button */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {filterAktiv
              ? `${gefilterteFragen.length} von ${themaDetail.fragen.length} Fragen ausgewählt`
              : `${themaDetail.fragen.length} Fragen verfügbar`
            }
          </span>
          <button
            onClick={onStarte}
            disabled={gefilterteFragen.length === 0}
            className="px-6 py-2.5 rounded-xl font-semibold text-white transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: gefilterteFragen.length > 0 ? farbe : undefined }}
          >
            Übung starten
          </button>
        </div>
      </div>
    </div>
  )
}

// ===================== SHARED COMPONENTS =====================

function FilterSection({ titel, emoji, children, onToggleAlle }: {
  titel: string; emoji: string; children: React.ReactNode; onToggleAlle: () => void
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {emoji} {titel}
        </h4>
        <button
          onClick={onToggleAlle}
          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 transition-colors"
        >
          Alle ⇄
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}

function Chip({ label, count, aktiv, farbe, onClick }: {
  label: string; count?: number; aktiv: boolean; farbe: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors cursor-pointer select-none ${
        !aktiv ? 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600' : ''
      }`}
      style={aktiv
        ? { backgroundColor: farbe, color: '#fff', borderColor: farbe }
        : undefined
      }
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] font-mono ${aktiv ? 'opacity-80' : 'text-slate-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function FortschrittsBalken({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  const gemeistertPct = (fortschritt.gemeistert / fortschritt.gesamt) * 100
  const gefestigtPct = (fortschritt.gefestigt / fortschritt.gesamt) * 100
  const uebenPct = (fortschritt.ueben / fortschritt.gesamt) * 100

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex mt-2">
      {gemeistertPct > 0 && <div className="bg-green-500 h-2" style={{ width: `${gemeistertPct}%` }} />}
      {gefestigtPct > 0 && <div className="bg-blue-400 h-2" style={{ width: `${gefestigtPct}%` }} />}
      {uebenPct > 0 && <div className="bg-yellow-400 h-2" style={{ width: `${uebenPct}%` }} />}
    </div>
  )
}

function MasteryBadges({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  return (
    <div className="flex items-center gap-1 text-xs">
      {fortschritt.gemeistert > 0 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{fortschritt.gemeistert}</span>}
      {fortschritt.gefestigt > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{fortschritt.gefestigt}</span>}
      {fortschritt.ueben > 0 && <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">{fortschritt.ueben}</span>}
      {fortschritt.neu > 0 && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">{fortschritt.neu}</span>}
    </div>
  )
}
