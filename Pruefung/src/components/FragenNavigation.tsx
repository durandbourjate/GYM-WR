import { usePruefungStore } from '../store/pruefungStore.ts'
import { fachbereichFarbe } from '../utils/fachbereich.ts'
import type { PruefungsAbschnitt } from '../types/pruefung.ts'

export default function FragenNavigation() {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
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
              const istBeantwortet = !!antworten[frageId]
              const istMarkiert = !!markierungen[frageId]

              // Status: Icons + dezente Farbe
              let bgClass: string
              let statusIcon: string | null = null

              if (istMarkiert) {
                bgClass = 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                statusIcon = '?'
              } else if (istBeantwortet) {
                bgClass = 'bg-green-50 text-green-800 border border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                statusIcon = '\u2713'
              } else {
                bgClass = 'bg-white text-slate-500 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-500'
              }

              return (
                <button
                  key={frageId}
                  onClick={() => navigiere(idx)}
                  title={frage ? `${frage.fachbereich}: ${frage.thema}` : frageId}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center relative
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
          <span className="w-3 h-3 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 inline-block" /> Offen
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-600 dark:text-green-400 font-bold">{'\u2713'}</span> Beantwortet
        </span>
        <span className="flex items-center gap-1">
          <span className="text-amber-600 dark:text-amber-400 font-bold">?</span> Unsicher
        </span>
      </div>

      {/* Übersicht-Button */}
      <button
        onClick={() => setPhase('uebersicht')}
        className="mt-2 text-sm text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
      >
        Übersicht anzeigen
      </button>

      {/* Fachbereich-Info der aktuellen Frage */}
      {fragen[aktuelleFrageIndex] && (
        <div className="mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${fachbereichFarbe(fragen[aktuelleFrageIndex].fachbereich)}`}>
            {fragen[aktuelleFrageIndex].fachbereich}
          </span>
        </div>
      )}
    </div>
  )
}


