import { useEffect, useState, useMemo, useRef } from 'react'
import { useUebenAuthStore } from '../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
import { useUebenFortschrittStore } from '../../store/ueben/fortschrittStore'
import { useUebenAuftragStore } from '../../store/ueben/auftragStore'
import { useUebenNavigationStore } from '../../store/ueben/navigationStore'
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

const SCHWIERIGKEIT_LABELS: Record<number, string> = { 1: 'Einfach', 2: 'Mittel', 3: 'Schwer' }
const SCHWIERIGKEIT_STERNE: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

const TYP_LABELS: Record<string, string> = {
  mc: 'MC', multi: 'Multi', tf: 'R/F', fill: 'Lücken', calc: 'Berechnung',
  sort: 'Zuordnung', sortierung: 'Sortierung', zuordnung: 'Paare',
  open: 'Freitext', formel: 'Formel', pdf: 'PDF',
  buchungssatz: 'Buchungssatz', tkonto: 'T-Konto', bilanz: 'Bilanz', kontenbestimmung: 'Kontenb.',
  hotspot: 'Hotspot', bildbeschriftung: 'Beschriftung', dragdrop_bild: 'DragDrop',
  gruppe: 'Gruppe', zeichnen: 'Zeichnen', audio: 'Audio', code: 'Code',
  richtigfalsch: 'R/F', lueckentext: 'Lücken', berechnung: 'Berechnung',
  freitext: 'Freitext', visualisierung: 'Zeichnen', bilanzstruktur: 'Bilanz',
  aufgabengruppe: 'Gruppe',
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
  const { ladeFortschritt, getThemenFortschritt, fortschritte } = useUebenFortschrittStore()
  const { ladeAuftraege, auftraege } = useUebenAuftragStore()
  const { navigiere } = useUebenNavigationStore()
  const { sichtbareFaecher, fachFarben } = useUebenKontext()
  const { freischaltungen, ladeFreischaltungen, getStatus } = useThemenSichtbarkeitStore()
  const { einstellungen } = useUebenSettingsStore()
  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)
  const [alleThemenAnzeigen, setAlleThemenAnzeigen] = useState(false)
  const [dashboardTab, setDashboardTab] = useState<'themen' | 'fortschritt'>('themen')

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

      // Einrichtungsfragen komplett ausblenden (Tutorial-Fragen, nicht für reguläres Üben)
      if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung')) continue
      if (themaRaw === 'Einrichtung' || themaRaw === 'Einrichtungstest') continue

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

  // Sichtbare Themen (abhängig vom Fach-Filter + Sichtbarkeitsfilter)
  const sichtbareThemenListe = useMemo(() => {
    const alleFachThemen = aktiverFach ? (themenMap[aktiverFach] || []) : Object.values(themenMap).flat()

    // Wenn keine Freischaltungen existieren → alle anzeigen (Fallback)
    if (freischaltungen.length === 0) return alleFachThemen

    // Wenn "Alle Themen anzeigen" aktiv → alles zeigen
    if (alleThemenAnzeigen) return alleFachThemen

    // Nur aktive + abgeschlossene Themen anzeigen
    let gefiltert = alleFachThemen.filter(info => {
      const status = getStatus(info.fach, info.thema)
      return status === 'aktiv' || status === 'abgeschlossen'
    })

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
    starteSession(aktiveGruppe.id, user.email, fach, thema, fragenOverride)
    navigiere('uebung')
  }

  const handleStarteGefiltert = () => {
    if (!themaDetail || gefilterteFragen.length === 0) return
    handleStarte(themaDetail.fach, themaDetail.thema, gefilterteFragen)
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
    setUnterthemaFilter(new Set())
    setSchwierigkeitFilter(new Set())
    setTypFilter(new Set())
  }

  return (
    <div>
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-white">
            Hallo {user?.vorname || 'dort'}!
          </h2>
          {/* Tab-Wechsel: Themen | Mein Fortschritt */}
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
          </div>
        </div>

        {dashboardTab === 'fortschritt' ? (
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
            {/* Suchfeld */}
            <div className="mb-4">
              <input
                type="text"
                value={suchtext}
                onChange={e => setSuchtext(e.target.value)}
                placeholder="Thema, Fach oder Frage suchen..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
              />
            </div>

            {/* Fach-Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
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
            </div>

            {/* Alle-Themen-Toggle (nur wenn Freischaltungen existieren) */}
            {freischaltungen.length > 0 && (
              <div className="flex justify-end mb-2">
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
              </div>
            )}

            {/* Thema-Karten Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {sichtbareThemenListe.map(info => (
                <ThemaKarte
                  key={`${info.fach}-${info.thema}`}
                  thema={info.thema}
                  fach={info.fach}
                  anzahlFragen={info.fragen.length}
                  anzahlUnterthemen={info.unterthemen.length}
                  fortschritt={info.fortschritt}
                  themenStatus={freischaltungen.length > 0 ? getStatus(info.fach, info.thema) : 'abgeschlossen'}
                  fachFarben={fachFarben}
                  onClick={() => { setAktivesThema(info.thema); setAktiverFach(info.fach) }}
                />
              ))}
            </div>
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
