import { useMemo } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { LueckentextFrage as LueckentextFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'

interface Props {
  frage: LueckentextFrageType
}

/** Fisher-Yates-Shuffle mit stabilem Seed-Key (frage.id + lueckenId) */
function shuffleOptionen(optionen: string[], stableKey: string): string[] {
  // Einfacher deterministischer Pseudo-Shuffle basierend auf Key-Hash
  const seed = stableKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const arr = [...optionen]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * (i + 1)) % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function LueckentextFrage({ frage }: Props) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const config = usePruefungStore((s) => s.config)
  const rechtschreibpruefungAktiv = config?.rechtschreibpruefung !== false
  const rechtschreibSprache = config?.rechtschreibSprache ?? 'de'

  const eintraege: Record<string, string> =
    antwort?.typ === 'lueckentext' ? antwort.eintraege : {}

  // Gemischte Dropdown-Optionen einmalig pro Frage berechnen
  const gemischteOptionen = useMemo(() => {
    const result: Record<string, string[]> = {}
    for (const luecke of (frage.luecken ?? [])) {
      if (luecke.dropdownOptionen && luecke.dropdownOptionen?.length > 0) {
        result[luecke.id] = shuffleOptionen(luecke.dropdownOptionen, `${frage.id}-${luecke.id}`)
      }
    }
    return result
  }, [frage.id, frage.luecken])

  function handleChange(lueckenId: string, wert: string) {
    if (disabled) return
    const neueEintraege = { ...eintraege, [lueckenId]: wert }
    onAntwort({ typ: 'lueckentext', eintraege: neueEintraege })
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
            const dropdownOpts = gemischteOptionen[lueckenId]

            if (dropdownOpts) {
              // Dropdown-Modus
              return (
                <select
                  key={i}
                  value={wert}
                  onChange={(e) => handleChange(lueckenId, e.target.value)}
                  disabled={disabled}
                  className={`inline-block mx-1 px-2 py-1 text-base border-b-2 outline-none transition-colors text-slate-800 dark:text-slate-100 bg-transparent cursor-pointer
                    ${disabled
                      ? 'border-slate-300 dark:border-slate-600 opacity-75'
                      : wert
                        ? 'border-slate-400 dark:border-slate-500'
                        : 'border-violet-400 dark:border-violet-500 focus:border-indigo-500 dark:focus:border-indigo-400'
                    }
                  `}
                >
                  <option value="">– wählen –</option>
                  {dropdownOpts.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )
            }

            // Texteingabe-Modus (Standard)
            return (
              <input
                key={i}
                type="text"
                value={wert}
                onChange={(e) => handleChange(lueckenId, e.target.value)}
                disabled={disabled}
                placeholder={`Lücke ${lueckenId}`}
                spellCheck={rechtschreibpruefungAktiv}
                lang={rechtschreibSprache}
                className={`inline-block mx-1 px-3 py-1 w-48 text-base border-b-2 outline-none transition-colors text-slate-800 dark:text-slate-100
                  ${disabled
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

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
