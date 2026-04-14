import { usePruefungStore } from '../store/pruefungStore.ts'
import { istVollstaendigBeantwortet } from '../utils/antwortStatus.ts'
import type { PruefungsAbschnitt } from '../types/pruefung.ts'

export default function FragenNavigation() {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const alleFragen = usePruefungStore((s) => s.alleFragen)
  const aktuelleFrageIndex = usePruefungStore((s) => s.aktuelleFrageIndex)
  const antworten = usePruefungStore((s) => s.antworten)
  const markierungen = usePruefungStore((s) => s.markierungen)
  const navigiere = usePruefungStore((s) => s.navigiere)
  const setPhase = usePruefungStore((s) => s.setPhase)

  if (!config) return null

  // Fragen nach Abschnitten gruppieren
  let globalIndex = 0
  const abschnitteMitIndex: { abschnitt: PruefungsAbschnitt; startIndex: number }[] = []
  for (const abschnitt of config.abschnitte) {
    abschnitteMitIndex.push({ abschnitt, startIndex: globalIndex })
    globalIndex += abschnitt.fragenIds.length
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Übersicht-Link oben (U4) */}
      <button
        onClick={() => setPhase('uebersicht')}
        className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer text-left font-medium"
      >
        📋 Übersicht
      </button>

      {abschnitteMitIndex.map(({ abschnitt, startIndex }) => (
        <div key={abschnitt.titel}>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            {abschnitt.titel}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {abschnitt.fragenIds.map((frageId, i) => {
              const idx = startIndex + i
              const frage = fragen[idx]
              const istAktuell = idx === aktuelleFrageIndex
              const istBeantwortet = frage ? istVollstaendigBeantwortet(frage, antworten[frageId], alleFragen, antworten) : !!antworten[frageId]
              const istMarkiert = !!markierungen[frageId]

              // Status: Icons + dezente Farbe
              let bgClass: string
              let statusIcon: string | null = null

              if (istMarkiert) {
                bgClass = 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                statusIcon = '?'
              } else if (istBeantwortet) {
                // Beantwortet: grün (erledigt), Haken
                bgClass = 'bg-green-50 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                statusIcon = '\u2713'
              } else {
                // Offen: violett hervorgehoben (noch zu tun)
                bgClass = 'bg-violet-50 text-violet-800 border border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700'
              }

              return (
                <button
                  key={frageId}
                  onClick={() => navigiere(idx)}
                  title={frage ? `${frage.fachbereich}: ${frage.thema}` : frageId}
                  className={`w-11 h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center relative
                    ${istAktuell ? 'ring-2 ring-slate-500 ring-offset-1 dark:ring-slate-400 dark:ring-offset-slate-800' : ''}
                    ${bgClass}
                    hover:scale-110 cursor-pointer
                  `}
                >
                  {idx + 1}
                  {statusIcon && (
                    <span className={`absolute -top-1 -right-1 text-[10px] font-bold leading-none
                      ${istMarkiert ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}
                    `}>
                      {statusIcon}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Legende */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/30 inline-block" /> Offen
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 inline-block" /> <span className="text-green-600 dark:text-green-400 font-bold">{'\u2713'}</span> Beantwortet
        </span>
        <span className="flex items-center gap-1">
          <span className="text-amber-600 dark:text-amber-400 font-bold">?</span> Unsicher
        </span>
      </div>

    </div>
  )
}


