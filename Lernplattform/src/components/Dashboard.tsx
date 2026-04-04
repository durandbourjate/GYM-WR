import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGruppenStore } from '../store/gruppenStore'
import { useUebungsStore } from '../store/uebungsStore'
import { useFortschrittStore } from '../store/fortschrittStore'
import { useAuftragStore } from '../store/auftragStore'
import { useNavigationStore } from '../store/navigationStore'
import { fragenAdapter } from '../adapters/appsScriptAdapter'
import { berechneEmpfehlungen } from '../utils/empfehlungen'
import type { Frage, FrageTyp } from '../types/fragen'
import type { ThemenFortschritt } from '../types/fortschritt'
import type { Empfehlung } from '../types/auftrag'
import { berechneSterne, sterneText } from '../utils/gamification'
import { useLernKontext } from '../hooks/useLernKontext'
import { getFachFarbe } from '../utils/fachFarben'

// Schwierigkeits-Labels
const SCHWIERIGKEIT_LABELS: Record<number, string> = { 1: 'Einfach', 2: 'Mittel', 3: 'Schwer' }

// Typ-Labels (Kurzform)
const TYP_LABELS: Record<string, string> = {
  mc: 'MC', multi: 'Multi', tf: 'R/F', fill: 'Lücken', calc: 'Berechnung',
  sort: 'Zuordnung', sortierung: 'Sortierung', zuordnung: 'Paare',
  open: 'Freitext', formel: 'Formel', pdf: 'PDF',
  buchungssatz: 'Buchungssatz', tkonto: 'T-Konto', bilanz: 'Bilanz', kontenbestimmung: 'Kontenb.',
  hotspot: 'Hotspot', bildbeschriftung: 'Beschriftung', dragdrop_bild: 'DragDrop',
  gruppe: 'Gruppe', zeichnen: 'Zeichnen', audio: 'Audio', code: 'Code',
  // Shared Typ-Namen (kanonisch)
  richtigfalsch: 'R/F', lueckentext: 'Lücken', berechnung: 'Berechnung',
  freitext: 'Freitext', visualisierung: 'Zeichnen', bilanzstruktur: 'Bilanz',
  aufgabengruppe: 'Gruppe',
}

interface ThemenInfo {
  fach: string
  thema: string
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
  const { sichtbareFaecher, sichtbareThemen, fachFarben } = useLernKontext()
  const [themenInfo, setThemenInfo] = useState<Record<string, ThemenInfo[]>>({})
  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)

  // Filter-State
  const [fachFilter, setFachFilter] = useState<string | null>(null)
  const [schwierigkeitFilter, setSchwierigkeitFilter] = useState<number | null>(null)
  const [typFilter, setTypFilter] = useState<FrageTyp | null>(null)
  // Fächer default eingeklappt — wird nach dem Laden mit allen Fächern befüllt
  const [eingeklappteF, setEingeklappteF] = useState<Set<string> | null>(null)

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

      const fachMap: Record<string, Record<string, Frage[]>> = {}
      for (const f of fragen) {
        if (!fachMap[f.fach]) fachMap[f.fach] = {}
        if (!fachMap[f.fach][f.thema]) fachMap[f.fach][f.thema] = []
        fachMap[f.fach][f.thema].push(f)
      }

      const info: Record<string, ThemenInfo[]> = {}
      for (const [fach, themen] of Object.entries(fachMap)) {
        info[fach] = Object.entries(themen).map(([thema, fragen]) => ({
          fach, thema, fragen, fortschritt: getThemenFortschritt(fragen),
        }))
      }

      setThemenInfo(info)
      // Alle Fächer default eingeklappt (nur beim ersten Laden)
      if (eingeklappteF === null) {
        setEingeklappteF(new Set(Object.keys(info)))
      }
      setLaden(false)
    }
    ladeThemen()
  }, [aktiveGruppe, getThemenFortschritt])

  // Verfügbare Fächer, Typen, Schwierigkeiten aus den geladenen Fragen
  const verfuegbareFaecher = useMemo(() =>
    [...new Set(alleFragen.map(f => f.fach))].sort()
  , [alleFragen])

  const verfuegbareTypen = useMemo(() =>
    [...new Set(alleFragen.map(f => f.typ))].sort()
  , [alleFragen])

  const verfuegbareSchwierigkeiten = useMemo(() =>
    [...new Set(alleFragen.map(f => f.schwierigkeit ?? 2).filter(Boolean))].sort()
  , [alleFragen])

  // Gefilterte Themen
  const gefilterteThemen = useMemo(() => {
    const result: Record<string, ThemenInfo[]> = {}

    for (const [fach, themen] of Object.entries(themenInfo)) {
      // Kontext-Filter: nur sichtbare Fächer anzeigen (wenn gesetzt)
      if (sichtbareFaecher.length > 0 && !sichtbareFaecher.includes(fach)) continue
      // Benutzer-Filter: Fach-Filter aus der Filter-Leiste
      if (fachFilter && fach !== fachFilter) continue

      const sichtbareThemenFuerFach = sichtbareThemen[fach] ?? []

      const gefiltert = themen.filter(t => {
        // Kontext-Filter: nur sichtbare Themen anzeigen (wenn gesetzt)
        if (sichtbareThemenFuerFach.length > 0 && !sichtbareThemenFuerFach.includes(t.thema)) return false
        let fragen = t.fragen
        if (schwierigkeitFilter) fragen = fragen.filter(f => f.schwierigkeit === schwierigkeitFilter)
        if (typFilter) fragen = fragen.filter(f => f.typ === typFilter)
        return fragen.length > 0
      }).map(t => {
        // Fragen-Anzahl anpassen wenn Filter aktiv
        if (!schwierigkeitFilter && !typFilter) return t
        const fragen = t.fragen.filter(f => {
          if (schwierigkeitFilter && f.schwierigkeit !== schwierigkeitFilter) return false
          if (typFilter && f.typ !== typFilter) return false
          return true
        })
        return { ...t, fragen, fortschritt: getThemenFortschritt(fragen) }
      })

      if (gefiltert.length > 0) result[fach] = gefiltert
    }

    return result
  }, [themenInfo, fachFilter, schwierigkeitFilter, typFilter, getThemenFortschritt, sichtbareFaecher, sichtbareThemen])

  // Anzahl gefilterter Fragen
  const gefilterteAnzahl = useMemo(() =>
    Object.values(gefilterteThemen).flat().reduce((sum, t) => sum + t.fragen.length, 0)
  , [gefilterteThemen])

  const totalAnzahl = alleFragen.length

  const toggleFach = (fach: string) => {
    const basis = eingeklappteF || new Set<string>()
    const neu = new Set(basis)
    if (neu.has(fach)) neu.delete(fach)
    else neu.add(fach)
    setEingeklappteF(neu)
  }

  const filterAktiv = fachFilter || schwierigkeitFilter || typFilter
  const filterZuruecksetzen = () => {
    setFachFilter(null)
    setSchwierigkeitFilter(null)
    setTypFilter(null)
  }

  const empfehlungen: Empfehlung[] = useMemo(() => {
    if (!user || alleFragen.length === 0) return []
    return berechneEmpfehlungen(alleFragen, fortschritte, auftraege, user.email)
  }, [alleFragen, fortschritte, auftraege, user])

  const handleStarte = (fach: string, thema: string) => {
    if (!aktiveGruppe || !user) return
    starteSession(aktiveGruppe.id, user.email, fach, thema)
    navigiere('uebung')
  }

  return (
    <div>
      <main className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Hallo {user?.vorname || 'dort'}!
        </h2>

        {/* Empfehlungen */}
        {empfehlungen.length > 0 && (
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {e.typ === 'auftrag' ? 'Auftrag' : e.typ === 'luecke' ? 'Empfohlen' : 'Festigung'}
                  </span>
                </div>
                <div className="font-medium dark:text-white">{e.titel}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{e.beschreibung}</div>
              </button>
            ))}
          </div>
        )}

        {/* Filter-Leiste */}
        {!laden && totalAnzahl > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                {filterAktiv
                  ? `${gefilterteAnzahl} von ${totalAnzahl} Fragen`
                  : `Alle Themen (${totalAnzahl} Fragen)`}
              </h3>
              {filterAktiv && (
                <button onClick={filterZuruecksetzen} className="text-xs text-blue-500 hover:underline">
                  Filter zurücksetzen
                </button>
              )}
            </div>

            {/* Fach-Filter */}
            <div className="flex flex-wrap gap-1.5">
              {verfuegbareFaecher.map(fach => {
                const farbe = getFachFarbe(fach, fachFarben)
                return (
                  <button
                    key={fach}
                    onClick={() => setFachFilter(fachFilter === fach ? null : fach)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] border transition-colors"
                    style={fachFilter === fach
                      ? { backgroundColor: farbe + '1a', color: farbe, borderColor: farbe + '4d', outline: `1px solid ${farbe}` }
                      : undefined
                    }
                  >
                    {fach}
                  </button>
                )
              })}
            </div>

            {/* Schwierigkeits-Filter */}
            <div className="flex flex-wrap gap-1.5">
              {verfuegbareSchwierigkeiten.map(s => (
                <button
                  key={s}
                  onClick={() => setSchwierigkeitFilter(schwierigkeitFilter === s ? null : s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] border transition-colors
                    ${schwierigkeitFilter === s
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 ring-1 ring-purple-400'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400'}
                  `}
                >
                  {SCHWIERIGKEIT_LABELS[s] || `Stufe ${s}`}
                </button>
              ))}

              {/* Typ-Filter (kompakte Dropdown-Alternative wegen vieler Typen) */}
              <select
                value={typFilter || ''}
                onChange={(e) => setTypFilter(e.target.value ? e.target.value as FrageTyp : null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] border transition-colors cursor-pointer
                  ${typFilter
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'}
                `}
              >
                <option value="">Alle Typen</option>
                {verfuegbareTypen.map(t => (
                  <option key={t} value={t}>{TYP_LABELS[t] || t}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Themen-Browser */}
        {laden ? (
          <p className="text-gray-500">Themen werden geladen...</p>
        ) : Object.keys(gefilterteThemen).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-gray-500">
            <p>{filterAktiv ? 'Keine Themen für diesen Filter.' : 'Noch keine Übungsfragen vorhanden.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(gefilterteThemen).map(([fach, themen]) => {
              const istEingeklappt = eingeklappteF?.has(fach) ?? true
              const farbe = getFachFarbe(fach, fachFarben)

              return (
                <div key={fach}>
                  {/* Fach-Header (klickbar zum Ein-/Ausklappen) */}
                  <button
                    onClick={() => toggleFach(fach)}
                    className="w-full flex items-center justify-between p-3 rounded-xl mb-2 min-h-[48px] border transition-colors"
                    style={{ backgroundColor: farbe + '1a', borderColor: farbe + '4d' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold" style={{ color: farbe }}>
                        {fach}
                      </span>
                      <span className="text-xs text-gray-400">
                        {themen.length} Themen, {themen.reduce((s, t) => s + t.fragen.length, 0)} Fragen
                      </span>
                    </div>
                    <span className={`text-sm transition-transform ${istEingeklappt ? '' : 'rotate-180'}`}>
                      &#9660;
                    </span>
                  </button>

                  {/* Themen-Liste */}
                  {!istEingeklappt && (
                    <div className="grid gap-2 ml-1">
                      {themen.map(({ thema, fragen, fortschritt }) => (
                        <button
                          key={thema}
                          onClick={() => handleStarte(fach, thema)}
                          className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 min-h-[48px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium dark:text-white text-base">{thema}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm tracking-wide">{sterneText(berechneSterne(fortschritt.quote))}</span>
                              <span className="text-xs text-gray-400">{fragen.length}</span>
                              <MasteryBadges fortschritt={fortschritt} />
                            </div>
                          </div>
                          <FortschrittsBalken fortschritt={fortschritt} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function FortschrittsBalken({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  const gemeistertPct = (fortschritt.gemeistert / fortschritt.gesamt) * 100
  const gefestigtPct = (fortschritt.gefestigt / fortschritt.gesamt) * 100
  const uebenPct = (fortschritt.ueben / fortschritt.gesamt) * 100

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden flex">
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
