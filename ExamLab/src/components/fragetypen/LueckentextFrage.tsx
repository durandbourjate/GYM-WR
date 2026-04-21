import { useMemo } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { LueckentextFrage as LueckentextFrageType, Luecke } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { ZoneLabel } from '@shared/ui/ZoneLabel'

interface Props {
  frage: LueckentextFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function LueckentextFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <LueckentextLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <LueckentextAufgabe frage={frage} />
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

function LueckentextAufgabe({ frage }: { frage: LueckentextFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const config = usePruefungStore((s) => s.config)
  const rechtschreibpruefungAktiv = config?.rechtschreibpruefung !== false
  const rechtschreibSprache = config?.rechtschreibSprache ?? 'de'

  const eintraege: Record<string, string> =
    antwort?.typ === 'lueckentext' ? antwort.eintraege : {}

  // Gemischte Dropdown-Optionen einmalig pro Frage berechnen (key = luecke.id)
  const gemischteOptionen = useMemo(() => {
    const result: Record<string, string[]> = {}
    for (const luecke of (frage.luecken ?? [])) {
      if (luecke.dropdownOptionen && luecke.dropdownOptionen?.length > 0) {
        result[luecke.id] = shuffleOptionen(luecke.dropdownOptionen, `${frage.id}-${luecke.id}`)
      }
    }
    return result
  }, [frage.id, frage.luecken])

  // Mapping Platzhalter-Nummer (aus {0}, {1}) → tatsächliche Lücken-ID
  // Pool-Converter vergibt Zufalls-IDs, der Text nutzt aber Index-basierte {0}/{1}.
  // Index im luecken[]-Array entspricht der Platzhalter-Nummer.
  function lueckeVon(nummer: string): { id: string } | undefined {
    const index = parseInt(nummer, 10)
    if (Number.isNaN(index)) return undefined
    return (frage.luecken ?? [])[index]
  }

  function handleChange(lueckenId: string, wert: string) {
    if (disabled) return
    const neueEintraege = { ...eintraege, [lueckenId]: wert }
    onAntwort({ typ: 'lueckentext', eintraege: neueEintraege })
  }

  // Text mit Lücken rendern — unterstützt beide Platzhalter-Formate: {0} (Pool) und {{0}} (Legacy)
  const teile = frage.textMitLuecken.split(/(\{\{\d+\}\}|\{\d+\})/)

  // Fragetext nicht doppelt anzeigen, wenn er identisch zu textMitLuecken ist (Pool-Daten)
  const fragetextZeigen = frage.fragetext && frage.fragetext.trim() !== frage.textMitLuecken.trim()

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

      {/* Fragetext (sticky: bleibt beim Scrollen sichtbar) — nur wenn ≠ textMitLuecken */}
      {fragetextZeigen && (
        <div
          className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
        />
      )}

      {/* Text mit Inline-Inputs */}
      <div className="text-base leading-loose text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        {teile.map((teil, i) => {
          const match = teil.match(/^\{\{?(\d+)\}\}?$/)
          if (match) {
            const luecke = lueckeVon(match[1])
            if (!luecke) return <span key={i}>{teil}</span>
            const lueckenId = luecke.id
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
            const lueckenNummer = parseInt(match[1], 10) + 1
            return (
              <input
                key={i}
                type="text"
                value={wert}
                onChange={(e) => handleChange(lueckenId, e.target.value)}
                disabled={disabled}
                placeholder={`Lücke ${lueckenNummer}`}
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

function istLueckeKorrekt(luecke: Luecke, eingabe: string): boolean {
  const trimmed = eingabe.trim()
  if (!trimmed) return false
  const korrekt = Array.isArray(luecke.korrekteAntworten) ? luecke.korrekteAntworten : []
  if (korrekt.length === 0) return false
  return korrekt.some(ka =>
    luecke.caseSensitive ? trimmed === ka.trim() : trimmed.toLowerCase() === ka.trim().toLowerCase()
  )
}

function LueckentextLoesung({ frage, antwort }: { frage: LueckentextFrageType; antwort: Antwort | null }) {
  const eintraege: Record<string, string> =
    antwort?.typ === 'lueckentext' ? antwort.eintraege : {}

  const teile = frage.textMitLuecken.split(/(\{\{\d+\}\}|\{\d+\})/)

  const fragetextZeigen =
    frage.fragetext && frage.fragetext.trim() !== frage.textMitLuecken.trim()

  function lueckeVon(nummer: string): Luecke | undefined {
    const index = parseInt(nummer, 10)
    if (Number.isNaN(index)) return undefined
    return (frage.luecken ?? [])[index]
  }

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

      {fragetextZeigen && (
        <div
          className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
        />
      )}

      {/* Text mit Inline-ZoneLabels (line-height: 2.2 damit zweizeilige Labels passen) */}
      <div
        className="text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700"
        style={{ lineHeight: 2.2 }}
      >
        {teile.map((teil, i) => {
          const match = teil.match(/^\{\{?(\d+)\}\}?$/)
          if (match) {
            const luecke = lueckeVon(match[1])
            if (!luecke) return <span key={i}>{teil}</span>
            const eingabe = eintraege[luecke.id] ?? ''
            const istKorrekt = istLueckeKorrekt(luecke, eingabe)
            const korrekteAntwort = luecke.korrekteAntworten?.[0] ?? ''
            return (
              <span key={i} className="inline-block align-middle mx-1">
                <ZoneLabel
                  variant={istKorrekt ? 'korrekt' : 'falsch'}
                  susAntwort={eingabe || undefined}
                  korrekteAntwort={korrekteAntwort}
                  placeholder="leer gelassen"
                />
              </span>
            )
          }
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(teil) }} />
        })}
      </div>

      {/* Erklärungen pro Lücke */}
      {(frage.luecken ?? []).some((l) => !!l.erklaerung) && (
        <div className="flex flex-col gap-2">
          {(frage.luecken ?? []).map((luecke, index) => {
            if (!luecke.erklaerung) return null
            return (
              <div
                key={luecke.id}
                className="pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400"
              >
                {'\u{1F4A1}'} <strong>Lücke {index + 1}:</strong> {luecke.erklaerung}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
