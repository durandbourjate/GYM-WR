import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { LueckentextFrage as LueckentextFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'

interface Props {
  frage: LueckentextFrageType
}

export default function LueckentextFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)

  const aktuelleAntwort = antworten[frage.id]
  const eintraege: Record<string, string> =
    aktuelleAntwort?.typ === 'lueckentext' ? aktuelleAntwort.eintraege : {}

  function handleChange(lueckenId: string, wert: string) {
    if (abgegeben) return
    const neueEintraege = { ...eintraege, [lueckenId]: wert }
    setAntwort(frage.id, { typ: 'lueckentext', eintraege: neueEintraege })
  }

  // Text mit Lücken rendern
  const teile = frage.textMitLuecken.split(/(\{\{\d+\}\})/)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
      </div>

      {/* Fragetext (sticky: bleibt beim Scrollen sichtbar) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Text mit Inline-Inputs */}
      <div className="text-base leading-loose text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        {teile.map((teil, i) => {
          const match = teil.match(/^\{\{(\d+)\}\}$/)
          if (match) {
            const lueckenId = match[1]
            const wert = eintraege[lueckenId] ?? ''
            return (
              <input
                key={i}
                type="text"
                value={wert}
                onChange={(e) => handleChange(lueckenId, e.target.value)}
                disabled={abgegeben}
                placeholder={`Lücke ${lueckenId}`}
                className={`inline-block mx-1 px-3 py-1 w-48 text-base border-b-2 outline-none transition-colors text-slate-800 dark:text-slate-100
                  ${abgegeben
                    ? 'border-slate-300 dark:border-slate-600 bg-transparent opacity-75'
                    : wert
                      ? 'border-slate-400 dark:border-slate-500 bg-transparent'
                      : 'border-violet-400 dark:border-violet-500 bg-transparent focus:border-indigo-500 dark:focus:border-indigo-400'
                  }
                `}
              />
            )
          }
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(teil) }} />
        })}
      </div>
    </div>
  )
}
