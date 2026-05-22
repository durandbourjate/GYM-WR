import { useState, useRef, useEffect } from 'react'
import { CircleCheck, Circle, Flag, X, Play, ChevronUp, ChevronDown } from 'lucide-react'
import type { Lernziel } from '../../types/pool'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'
import { lernzielStatus } from '../../utils/ueben/mastery'
import { gruppiereLernziele } from '../../utils/lernzieleGruppierung'
import { getFachFarbe } from '../../utils/ueben/fachFarben'
import { TYPO } from '../../styles/typografie'
import { LernzielKarte } from './LernzielKarte'

interface Props {
  lernziele: Lernziel[]
  fortschritte: Record<string, FragenFortschritt>
  onSchliessen: () => void
  onThemaUeben: (thema: string) => void
  onLernzielUeben?: (lz: Lernziel) => void
}

/**
 * Einzelne Lernziel-Zeile — interaktiv wenn onKlick übergeben, sonst passiv.
 * Wird von LernzieleAkkordeon (Fach-Baum) und LernzieleMiniModal (Thema-Liste) genutzt.
 */
function LernzielZeile({ lz, fortschritte, onKlick }: {
  lz: Lernziel
  fortschritte: Record<string, FragenFortschritt>
  onKlick?: (lz: Lernziel) => void
}) {
  const status = lernzielStatus(lz, fortschritte)

  if (onKlick) {
    return (
      <div
        key={lz.id}
        role="button"
        tabIndex={0}
        onClick={() => onKlick(lz)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onKlick(lz)
          }
        }}
        className="flex items-start gap-2 text-sm rounded-lg px-2 py-1 -mx-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
      >
        <span className="mt-0.5 shrink-0">
          <LernzielStatusIcon status={status} />
        </span>
        <span className={`flex-1 ${status === 'gemeistert' ? 'line-through text-slate-400' : 'dark:text-slate-300'}`}>
          {lz.text}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
          {lz.bloom}
        </span>
      </div>
    )
  }

  return (
    <div key={lz.id} className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 shrink-0">
        <LernzielStatusIcon status={status} />
      </span>
      <span className={`flex-1 ${status === 'gemeistert' ? 'line-through text-slate-400' : 'dark:text-slate-300'}`}>
        {lz.text}
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
        {lz.bloom}
      </span>
    </div>
  )
}

/**
 * Lernziele-Akkordeon — nach Vorbild der Übungspools.
 * Struktur: Fach (aufklappbar) → Thema (aufklappbar) → Lernziele mit Status
 */
export default function LernzieleAkkordeon({ lernziele, fortschritte, onSchliessen, onThemaUeben, onLernzielUeben }: Props) {
  const [offeneFaecher, setOffeneFaecher] = useState<Set<string>>(new Set())
  const [offeneThemen, setOffeneThemen] = useState<Set<string>>(new Set())
  const [gewaehltesLernziel, setGewaehltesLernziel] = useState<Lernziel | null>(null)

  // Gruppierung: Fach → Thema → { meta: LZ[], unterthemen: { ut: LZ[] } }
  const fachMap = gruppiereLernziele(lernziele.filter(lz => lz.aktiv !== false))

  const faecher = Object.keys(fachMap).sort()

  const toggleFach = (fach: string) => {
    setOffeneFaecher(prev => {
      const neu = new Set(prev)
      if (neu.has(fach)) neu.delete(fach)
      else neu.add(fach)
      return neu
    })
  }

  const toggleThema = (key: string) => {
    setOffeneThemen(prev => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }

  if (lernziele.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onSchliessen}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <h2 className={`${TYPO.h2} text-slate-800 dark:text-slate-100 inline-flex items-center gap-2`}><Flag className="w-5 h-5" /> Lernziele</h2>
            <button onClick={onSchliessen} aria-label="Schliessen" className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Lernziele werden von der Lehrperson definiert. Sobald Themen aktiviert sind, erscheinen hier die zugehörigen Lernziele.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onSchliessen}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className={`${TYPO.h2} text-slate-800 dark:text-slate-100 inline-flex items-center gap-2`}><Flag className="w-5 h-5" /> Alle Lernziele</h2>
          <button onClick={onSchliessen} aria-label="Schliessen" className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* Master-Detail-Swap: Lernziel-Detailkarte statt Fach-Liste */}
          {gewaehltesLernziel ? (
            <LernzielKarte
              lernziel={gewaehltesLernziel}
              fortschritte={fortschritte}
              // optional — AdminThemensteuerung nutzt das Akkordeon ohne Lernziel-Üben
              onUeben={onLernzielUeben ?? (() => {})}
              onZurueck={() => setGewaehltesLernziel(null)}
            />
          ) : faecher.map(fach => {
            const themen = fachMap[fach]
            const themenKeys = Object.keys(themen).sort()
            const fachOffen = offeneFaecher.has(fach)
            const farbe = getFachFarbe(fach, {})
            const anzahlLZ = themenKeys.reduce((s, t) => {
              const g = themen[t]; return s + g.meta.length + Object.values(g.unterthemen).reduce((s2, arr) => s2 + arr.length, 0)
            }, 0)

            return (
              <div key={fach} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {/* Fach-Header */}
                <button
                  onClick={() => toggleFach(fach)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: farbe }} />
                    <span className="font-semibold dark:text-white" style={{ color: farbe }}>{fach}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{themenKeys.length} Themen · {anzahlLZ} LZ</span>
                    {fachOffen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Themen (aufgeklappt) */}
                {fachOffen && (
                  <div className="border-t border-slate-100 dark:border-slate-700">
                    {themenKeys.map(thema => {
                      const themaKey = `${fach}::${thema}`
                      const themaOffen = offeneThemen.has(themaKey)
                      const gruppe = themen[thema]
                      const utKeys = Object.keys(gruppe.unterthemen).sort()
                      const totalLZ = gruppe.meta.length + utKeys.reduce((s, ut) => s + gruppe.unterthemen[ut].length, 0)

                      return (
                        <div key={thema} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                          {/* Thema-Header */}
                          <button
                            onClick={() => toggleThema(themaKey)}
                            className="w-full flex items-center justify-between px-4 py-2.5 pl-8 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <span className="text-sm font-medium dark:text-slate-200">{thema}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{totalLZ} LZ</span>
                              {!themaOffen && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onThemaUeben(thema) }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onThemaUeben(thema) } }}
                                  className="text-xs px-2 py-0.5 rounded text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                                  style={{ backgroundColor: farbe }}
                                >
                                  Fragen <Play className="w-3 h-3" />
                                </span>
                              )}
                              <span className="text-slate-400 inline-flex items-center">{themaOffen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                            </div>
                          </button>

                          {/* Inhalt (aufgeklappt): Meta-LZ + Unterthemen */}
                          {themaOffen && (
                            <div className="bg-slate-50 dark:bg-slate-900/30 px-4 py-2 pl-10 space-y-2">
                              {/* Pool-übergreifende Lernziele (ohne Unterthema) */}
                              {gruppe.meta.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Übergeordnet</p>
                                  {gruppe.meta.map(lz => (
                                    <LernzielZeile key={lz.id} lz={lz} fortschritte={fortschritte} onKlick={setGewaehltesLernziel} />
                                  ))}
                                </div>
                              )}
                              {/* Unterthemen mit ihren Lernzielen */}
                              {utKeys.map(ut => (
                                <div key={ut} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium dark:text-slate-300">{ut}</p>
                                    <span className="text-[10px] text-slate-400">{gruppe.unterthemen[ut].length} LZ</span>
                                  </div>
                                  {gruppe.unterthemen[ut].map(lz => (
                                    <LernzielZeile key={lz.id} lz={lz} fortschritte={fortschritte} onKlick={setGewaehltesLernziel} />
                                  ))}
                                </div>
                              ))}
                              <button
                                onClick={() => onThemaUeben(thema)}
                                className="w-full mt-2 py-2 rounded-lg text-sm font-medium text-white transition-colors inline-flex items-center justify-center gap-1.5"
                                style={{ backgroundColor: farbe }}
                              >
                                <Play className="w-4 h-4" /> Fragen zu «{thema}» üben
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Mini-Modal für Lernziele eines einzelnen Themas.
 * Wird von ThemaKarte über Flag-Button geöffnet.
 * Task 5: Klick auf eine Lernziel-Zeile öffnet LernzielKarte (Master-Detail-Swap).
 */
export function LernzieleMiniModal({ thema, fach, lernziele, fortschritte, onSchliessen, onUeben, onLernzielUeben, fokusUnterthema }: {
  thema: string
  fach: string
  lernziele: Lernziel[]
  fortschritte: Record<string, FragenFortschritt>
  onSchliessen: () => void
  onUeben?: () => void
  onLernzielUeben?: (lz: Lernziel) => void
  fokusUnterthema?: string
}) {
  // Alle Hooks MÜSSEN vor dem Early-Return stehen (Rules of Hooks + code-quality.md)
  const [gewaehltesLernziel, setGewaehltesLernziel] = useState<Lernziel | null>(null)

  // Refs für fokusUnterthema-Scroll — ein Ref pro Unterthema-Gruppe
  const utRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Fix 1: gewaehltesLernziel als Dependency + Guard, damit kein Scroll wenn Detail-Karte offen
  useEffect(() => {
    if (!fokusUnterthema || gewaehltesLernziel) return
    const el = utRefs.current[fokusUnterthema]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [fokusUnterthema, gewaehltesLernziel])

  const farbe = getFachFarbe(fach, {})
  const relevante = lernziele.filter(lz => lz.aktiv !== false && lz.fach === fach && (lz.thema === thema || lz.thema?.includes(thema) || thema?.includes(lz.thema)))

  if (relevante.length === 0) return null

  // Nach Unterthema gruppieren
  const meta = relevante.filter(lz => !lz.unterthema)
  const utGruppen: Record<string, typeof relevante> = {}
  for (const lz of relevante) {
    if (lz.unterthema) {
      if (!utGruppen[lz.unterthema]) utGruppen[lz.unterthema] = []
      utGruppen[lz.unterthema].push(lz)
    }
  }
  const utKeys = Object.keys(utGruppen).sort()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onSchliessen}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-5 max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: farbe }} />
            <h3 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100`}>{thema}</h3>
          </div>
          <button onClick={onSchliessen} aria-label="Schliessen" className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"><X className="w-4 h-4" /></button>
        </div>

        {/* Master-Detail-Swap: LernzielKarte statt Lernziel-Liste */}
        {gewaehltesLernziel ? (
          <div className="overflow-y-auto flex-1">
            <LernzielKarte
              lernziel={gewaehltesLernziel}
              fortschritte={fortschritte}
              // optional — AdminThemensteuerung nutzt das Mini-Modal ohne Lernziel-Üben
              onUeben={onLernzielUeben ?? (() => {})}
              onZurueck={() => setGewaehltesLernziel(null)}
            />
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 space-y-3 mb-4">
              {meta.length > 0 && (
                <div className="space-y-1.5">
                  {meta.map(lz => (
                    <LernzielZeile key={lz.id} lz={lz} fortschritte={fortschritte} onKlick={setGewaehltesLernziel} />
                  ))}
                </div>
              )}
              {utKeys.map(ut => (
                <div
                  key={ut}
                  ref={el => { utRefs.current[ut] = el }}
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{ut}</p>
                  <div className="space-y-1.5">
                    {utGruppen[ut].map(lz => (
                      <LernzielZeile key={lz.id} lz={lz} fortschritte={fortschritte} onKlick={setGewaehltesLernziel} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {onUeben && (
              <button
                onClick={onUeben}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors shrink-0 inline-flex items-center justify-center gap-1.5"
                style={{ backgroundColor: farbe }}
              >
                <Play className="w-4 h-4" /> Fragen zu «{thema}» üben
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** Status-Icon für Lernziel-Listen */
function LernzielStatusIcon({ status }: { status: ReturnType<typeof lernzielStatus> }) {
  if (status === 'gemeistert') return <CircleCheck className="w-4 h-4 text-green-500" aria-label="gemeistert" />
  if (status === 'gefestigt') return <Circle className="w-4 h-4 fill-blue-500 text-blue-500" aria-label="gefestigt" />
  if (status === 'inArbeit') return <Circle className="w-4 h-4 fill-yellow-500 text-yellow-500" aria-label="in Arbeit" />
  return <Flag className="w-4 h-4 text-slate-400" aria-label="offen" />
}
