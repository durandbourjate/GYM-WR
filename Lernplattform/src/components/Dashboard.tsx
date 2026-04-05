import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGruppenStore } from '../store/gruppenStore'
import { useUebungsStore } from '../store/uebungsStore'
import { useFortschrittStore } from '../store/fortschrittStore'
import { useAuftragStore } from '../store/auftragStore'
import { useNavigationStore } from '../store/navigationStore'
import { fragenAdapter } from '../adapters/appsScriptAdapter'
import { berechneEmpfehlungen } from '../utils/empfehlungen'
import type { Frage } from '../types/fragen'
import type { ThemenFortschritt } from '../types/fortschritt'
import type { Empfehlung } from '../types/auftrag'
import { berechneSterne, sterneText } from '../utils/gamification'
import { useLernKontext } from '../hooks/useLernKontext'
import { getFachFarbe } from '../utils/fachFarben'

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

export default function Dashboard() {
  const { user } = useAuthStore()
  const { aktiveGruppe } = useGruppenStore()
  const { starteSession } = useUebungsStore()
  const { ladeFortschritt, getThemenFortschritt, fortschritte } = useFortschrittStore()
  const { ladeAuftraege, auftraege } = useAuftragStore()
  const { navigiere } = useNavigationStore()
  const { sichtbareFaecher, fachFarben } = useLernKontext()
  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)

  // Navigation: Fachbereich → Thema → Filter → Übung starten
  const [aktiverFach, setAktiverFach] = useState<string | null>(null)
  const [aktivesThema, setAktivesThema] = useState<string | null>(null)

  // Filter innerhalb eines Themas (Chips wie pool.html)
  const [unterthemaFilter, setUnterthemaFilter] = useState<Set<string>>(new Set())
  const [schwierigkeitFilter, setSchwierigkeitFilter] = useState<Set<number>>(new Set())
  const [typFilter, setTypFilter] = useState<Set<string>>(new Set())

  useEffect(() => {
    ladeFortschritt()
    ladeAuftraege()
  }, [ladeFortschritt, ladeAuftraege])

  useEffect(() => {
    if (!aktiveGruppe) return
    const ladeThemen = async () => {
      setLaden(true)
      const fragen = await fragenAdapter.ladeFragen(aktiveGruppe.id)
      setAlleFragen(fragen)
      setLaden(false)
    }
    ladeThemen()
  }, [aktiveGruppe])

  // Themen-Infos: Fach → Thema → { unterthemen, fragen, fortschritt }
  const themenMap = useMemo(() => {
    const map: Record<string, ThemenInfo[]> = {}
    const fachThema: Record<string, Record<string, Frage[]>> = {}

    for (const f of alleFragen) {
      const fach = f.fach || 'Andere'
      const thema = f.thema || 'Allgemein'
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

  // Sichtbare Themen (abhängig vom Fach-Filter)
  const sichtbareThemenListe = useMemo(() => {
    if (aktiverFach) return themenMap[aktiverFach] || []
    return Object.values(themenMap).flat()
  }, [themenMap, aktiverFach])

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

  // Empfehlungen
  const empfehlungen: Empfehlung[] = useMemo(() => {
    if (!user || alleFragen.length === 0) return []
    return berechneEmpfehlungen(alleFragen, fortschritte, auftraege, user.email)
  }, [alleFragen, fortschritte, auftraege, user])

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
      <main className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Hallo {user?.vorname || 'dort'}!
        </h2>

        {/* Empfehlungen */}
        {!aktivesThema && empfehlungen.length > 0 && (
          <div className="mb-6 space-y-2">
            {empfehlungen.map((e, i) => (
              <button
                key={i}
                onClick={() => handleStarte(e.fach, e.thema)}
                className={`w-full text-left p-4 rounded-xl shadow-sm border min-h-[48px] transition-shadow hover:shadow-md
                  ${e.typ === 'auftrag' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
                  ${e.typ === 'luecke' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : ''}
                  ${e.typ === 'festigung' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                `}
              >
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
                  {e.typ === 'auftrag' ? 'Auftrag' : e.typ === 'luecke' ? 'Empfohlen' : 'Festigung'}
                </div>
                <div className="font-medium dark:text-white">{e.titel}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{e.beschreibung}</div>
              </button>
            ))}
          </div>
        )}

        {laden ? (
          <p className="text-gray-500">Themen werden geladen...</p>
        ) : alleFragen.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm text-gray-500">
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
                      : { borderColor: '#e2e8f0', color: farbe }
                    }
                  >
                    {fach}
                  </button>
                )
              })}
            </div>

            {/* Thema-Karten Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {sichtbareThemenListe.map(info => {
                const farbe = getFachFarbe(info.fach, fachFarben)
                return (
                  <button
                    key={`${info.fach}-${info.thema}`}
                    onClick={() => { setAktivesThema(info.thema); setAktiverFach(info.fach) }}
                    className="text-left p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors min-h-[48px]"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-semibold dark:text-white text-sm leading-tight">{info.thema}</span>
                      <span className="shrink-0 w-3 h-3 rounded-full mt-1" style={{ backgroundColor: farbe }} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{info.fragen.length} Fragen</span>
                      {info.unterthemen.length > 0 && <span>{info.unterthemen.length} Unterthemen</span>}
                      <span>{sterneText(berechneSterne(info.fortschritt.quote))}</span>
                    </div>
                    <FortschrittsBalken fortschritt={info.fortschritt} />
                  </button>
                )
              })}
            </div>
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
  const verfuegbareSchwierigkeiten = [...new Set(themaDetail.fragen.map(f => f.schwierigkeit ?? 2))].sort()
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
      {verfuegbareTypen.length > 1 && (
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors cursor-pointer select-none"
      style={aktiv
        ? { backgroundColor: farbe, color: '#fff', borderColor: farbe }
        : { borderColor: '#e2e8f0', color: '#475569' }
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
      {fortschritt.neu > 0 && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">{fortschritt.neu}</span>}
    </div>
  )
}
