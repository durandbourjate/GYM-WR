import { useState } from 'react'
import type { Lernziel } from '../../types/pool'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'
import { lernzielStatus } from '../../utils/ueben/mastery'
import { getFachFarbe } from '../../utils/ueben/fachFarben'

interface Props {
  lernziele: Lernziel[]
  fortschritte: Record<string, FragenFortschritt>
  onSchliessen: () => void
  onThemaUeben: (thema: string) => void
}

/**
 * Lernziele-Akkordeon — nach Vorbild der Übungspools.
 * Struktur: Fach (aufklappbar) → Thema (aufklappbar) → Lernziele mit Status
 */
export default function LernzieleAkkordeon({ lernziele, fortschritte, onSchliessen, onThemaUeben }: Props) {
  const [offeneFaecher, setOffeneFaecher] = useState<Set<string>>(new Set())
  const [offeneThemen, setOffeneThemen] = useState<Set<string>>(new Set())

  // Gruppierung: Fach → Thema → { meta: LZ[], unterthemen: { ut: LZ[] } }
  interface ThemaGruppe { meta: Lernziel[]; unterthemen: Record<string, Lernziel[]> }
  const fachMap: Record<string, Record<string, ThemaGruppe>> = {}
  for (const lz of lernziele) {
    if (lz.aktiv === false) continue
    const fach = lz.fach || 'Andere'
    const thema = lz.thema || 'Allgemein'
    if (!fachMap[fach]) fachMap[fach] = {}
    if (!fachMap[fach][thema]) fachMap[fach][thema] = { meta: [], unterthemen: {} }
    if (lz.unterthema) {
      if (!fachMap[fach][thema].unterthemen[lz.unterthema]) fachMap[fach][thema].unterthemen[lz.unterthema] = []
      fachMap[fach][thema].unterthemen[lz.unterthema].push(lz)
    } else {
      fachMap[fach][thema].meta.push(lz)
    }
  }

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

  function renderLernzielListe(liste: Lernziel[], fp: Record<string, FragenFortschritt>) {
    return liste.map(lz => {
      const status = lernzielStatus(lz, fp)
      return (
        <div key={lz.id} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 shrink-0">
            {status === 'gemeistert' ? '✅' : status === 'gefestigt' ? '🔵' : status === 'inArbeit' ? '🟡' : '🏁'}
          </span>
          <span className={`flex-1 ${status === 'gemeistert' ? 'line-through text-slate-400' : 'dark:text-slate-300'}`}>
            {lz.text}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
            {lz.bloom}
          </span>
        </div>
      )
    })
  }

  if (lernziele.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onSchliessen}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold dark:text-white">🏁 Lernziele</h2>
            <button onClick={onSchliessen} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 text-xl">✕</button>
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
          <h2 className="text-lg font-bold dark:text-white">🏁 Alle Lernziele</h2>
          <button onClick={onSchliessen} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 text-xl">✕</button>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {faecher.map(fach => {
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
                    <span>{fachOffen ? '▲' : '▼'}</span>
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
                                  className="text-xs px-2 py-0.5 rounded text-white transition-colors cursor-pointer"
                                  style={{ backgroundColor: farbe }}
                                >
                                  Fragen ▶
                                </span>
                              )}
                              <span className="text-slate-400">{themaOffen ? '▲' : '▼'}</span>
                            </div>
                          </button>

                          {/* Inhalt (aufgeklappt): Meta-LZ + Unterthemen */}
                          {themaOffen && (
                            <div className="bg-slate-50 dark:bg-slate-900/30 px-4 py-2 pl-10 space-y-2">
                              {/* Pool-übergreifende Lernziele (ohne Unterthema) */}
                              {gruppe.meta.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Übergeordnet</p>
                                  {renderLernzielListe(gruppe.meta, fortschritte)}
                                </div>
                              )}
                              {/* Unterthemen mit ihren Lernzielen */}
                              {utKeys.map(ut => (
                                <div key={ut} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium dark:text-slate-300">{ut}</p>
                                    <span className="text-[10px] text-slate-400">{gruppe.unterthemen[ut].length} LZ</span>
                                  </div>
                                  {renderLernzielListe(gruppe.unterthemen[ut], fortschritte)}
                                </div>
                              ))}
                              <button
                                onClick={() => onThemaUeben(thema)}
                                className="w-full mt-2 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                                style={{ backgroundColor: farbe }}
                              >
                                ▶ Fragen zu «{thema}» üben
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
 * Wird von ThemaKarte über 🏁 Button geöffnet.
 */
export function LernzieleMiniModal({ thema, fach, lernziele, fortschritte, onSchliessen, onUeben }: {
  thema: string
  fach: string
  lernziele: Lernziel[]
  fortschritte: Record<string, FragenFortschritt>
  onSchliessen: () => void
  onUeben: () => void
}) {
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
            <h3 className="font-semibold dark:text-white text-sm">{thema}</h3>
          </div>
          <button onClick={onSchliessen} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 mb-4">
          {meta.length > 0 && (
            <div className="space-y-1.5">
              {meta.map(lz => renderLZ(lz, fortschritte))}
            </div>
          )}
          {utKeys.map(ut => (
            <div key={ut}>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{ut}</p>
              <div className="space-y-1.5">
                {utGruppen[ut].map(lz => renderLZ(lz, fortschritte))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onUeben}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors shrink-0"
          style={{ backgroundColor: farbe }}
        >
          ▶ Fragen zu «{thema}» üben
        </button>
      </div>
    </div>
  )
}

/** Einzelnes Lernziel rendern (für Mini-Modal) */
function renderLZ(lz: Lernziel, fortschritte: Record<string, FragenFortschritt>) {
  const status = lernzielStatus(lz, fortschritte)
  return (
    <div key={lz.id} className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 shrink-0">
        {status === 'gemeistert' ? '✅' : status === 'gefestigt' ? '🔵' : status === 'inArbeit' ? '🟡' : '🏁'}
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
