import { useRef, useEffect } from 'react'
import type { LueckentextFrage } from '../../types/fragen-core'
import { Abschnitt, Feld } from '../components/EditorBausteine'
import type { FeldStatus } from '../pflichtfeldValidation'

interface LueckentextEditorProps {
  textMitLuecken: string
  setTextMitLuecken: (v: string) => void
  luecken: LueckentextFrage['luecken']
  setLuecken: (v: LueckentextFrage['luecken']) => void
  /** Antwort-Modus: Freitext (SuS tippt) oder Dropdown (SuS wählt aus Optionen) */
  lueckentextModus: 'freitext' | 'dropdown'
  setLueckentextModus: (v: 'freitext' | 'dropdown') => void
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  titelRechts?: React.ReactNode
  /** Pflichtfeld-Status der Lücken-Section (Bundle H Phase 3) */
  feldStatusLuecken?: FeldStatus
  /** Pflichtfeld-Status des Lückentext-Felds (Bundle H Phase 3) */
  feldStatusTextMitLuecken?: FeldStatus
}

function pflichtCls(status: FeldStatus | undefined): string {
  return status === 'pflicht-leer'
    ? 'border border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40 rounded-lg p-3'
    : 'border border-slate-200 dark:border-slate-700 rounded-lg p-3'
}

/**
 * Platzhalter-Regex: akzeptiert sowohl `{N}` (alte/importierte Fragen) als
 * auch `{{N}}` (kanonisch). SuS-Renderer nutzt dasselbe Pattern.
 */
const PLATZHALTER_REGEX = /\{\{?(\d+)\}\}?/g

/** Normalisiert `{N}` → `{{N}}` idempotent, ohne `{{N}}` zu `{{{{N}}}}` zu machen. */
function normalisierePlatzhalter(text: string): string {
  return text.replace(PLATZHALTER_REGEX, '{{$1}}')
}

export default function LueckentextEditor({ textMitLuecken, setTextMitLuecken, luecken, setLuecken, lueckentextModus, setLueckentextModus, titelRechts, feldStatusLuecken, feldStatusTextMitLuecken }: LueckentextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Einmalige Mount-Migration: alte `{N}`-Syntax → kanonisches `{{N}}`. Läuft nur
  // wenn Text bereits einfach-Klammer-Format enthält (also aus Pool-Import o.ä. stammt).
  useEffect(() => {
    if (!textMitLuecken) return
    const normalisiert = normalisierePlatzhalter(textMitLuecken)
    if (normalisiert !== textMitLuecken) {
      setTextMitLuecken(normalisiert)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-parse Lücken aus Text
  function handleTextChange(text: string): void {
    setTextMitLuecken(text)
    syncLueckenFromText(text, luecken, setLuecken)
  }

  /** Nächste freie Lücken-ID ermitteln */
  function naechsteId(): string {
    const matches = textMitLuecken.match(PLATZHALTER_REGEX)
    if (!matches) return '1'
    const ids = matches.map((m) => parseInt(m.replace(/[{}]/g, ''), 10))
    return String(Math.max(...ids) + 1)
  }

  /** Lücke einfügen: Markiertes Wort → {{N}} + korrekte Antwort setzen */
  function lueckeEinfuegen(): void {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const id = naechsteId()
    const platzhalter = `{{${id}}}`

    let neuerText: string
    let cursorPos: number

    if (start !== end) {
      // Text markiert → durch Platzhalter ersetzen und als korrekte Antwort speichern
      const markierterText = textMitLuecken.substring(start, end)
      neuerText = textMitLuecken.substring(0, start) + platzhalter + textMitLuecken.substring(end)
      cursorPos = start + platzhalter.length

      // Lücke mit korrekter Antwort anlegen
      const neueLuecke = { id, korrekteAntworten: [markierterText], caseSensitive: false }
      setTextMitLuecken(neuerText)
      // Sync bestehende + neue Lücke
      const aktualisiert = syncLueckenArray(neuerText, [...luecken, neueLuecke])
      setLuecken(aktualisiert)
    } else {
      // Nichts markiert → Platzhalter an Cursor-Position einfügen
      neuerText = textMitLuecken.substring(0, start) + platzhalter + textMitLuecken.substring(end)
      cursorPos = start + platzhalter.length

      setTextMitLuecken(neuerText)
      syncLueckenFromText(neuerText, luecken, setLuecken)
    }

    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(cursorPos, cursorPos)
    })
  }

  return (
    <Abschnitt titel="Lückentext" titelRechts={titelRechts}>
      <Feld label="Text mit Lücken">
        <div className="flex gap-2 mb-1">
          <button
            type="button"
            onClick={lueckeEinfuegen}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            title="Markiertes Wort als Lücke einfügen, oder leeren Platzhalter an Cursor-Position"
          >
            + Lücke einfügen
          </button>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">
            Wort markieren, dann klicken
          </span>
        </div>
        <textarea
          ref={textareaRef}
          data-testid="lueckentext-textarea"
          value={textMitLuecken}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={4}
          placeholder="Text eingeben und Wörter markieren, um Lücken zu erstellen..."
          className={`input-field resize-y font-mono text-sm ${
            feldStatusTextMitLuecken === 'pflicht-leer'
              ? 'border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40'
              : ''
          }`}
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Syntax: {'{{1}}'} = erste Lücke, {'{{2}}'} = zweite Lücke, etc.
        </p>
      </Feld>

      {luecken.length > 0 && (
        <div data-testid="lueckentext-luecken-section" className={`mt-3 space-y-3 ${pflichtCls(feldStatusLuecken)}`}>
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Antwort-Modus:</span>
            <div className="inline-flex rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setLueckentextModus('freitext')}
                className={`px-3 min-h-[44px] text-sm ${lueckentextModus === 'freitext' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'}`}
                aria-pressed={lueckentextModus === 'freitext'}
              >
                Freitext
              </button>
              <button
                type="button"
                onClick={() => setLueckentextModus('dropdown')}
                className={`px-3 min-h-[44px] text-sm ${lueckentextModus === 'dropdown' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'}`}
                aria-pressed={lueckentextModus === 'dropdown'}
              >
                Dropdown
              </button>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lueckentextModus === 'freitext' ? 'SuS tippt Antwort ein' : 'SuS wählt aus Dropdown-Optionen'}
            </span>
          </div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Antworten pro Lücke
          </label>
          {luecken.map((luecke, lueckenIndex) => {
            // Defensive: korrekteAntworten kann bei alten/unvollständigen Pool-Fragen undefined sein
            const korrekteAntw = luecke.korrekteAntworten ?? []
            const hatKorrekteAntwort = korrekteAntw.some((a) => a && a.trim().length > 0)
            const dropdownText = luecke.dropdownOptionen?.join(', ') ?? ''
            const korrekteImDropdown =
              luecke.dropdownOptionen && luecke.dropdownOptionen.length > 0
                ? korrekteAntw.some((a) => luecke.dropdownOptionen!.includes(a))
                : true
            return (
              <div key={luecke.id} className="flex items-start gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 first:border-t-0 first:pt-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono w-10 shrink-0 pt-2" title={`ID: ${luecke.id}`}>
                  {`{{${lueckenIndex + 1}}}`}
                </span>
                <div className="flex-1 space-y-1.5">
                  <div
                    data-modus-feld="freitext"
                    className={lueckentextModus === 'dropdown' ? 'opacity-50' : ''}
                  >
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-0.5">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 normal-case font-medium text-[10px]">Freitext</span>
                      Korrekte Antworten (Hauptantwort + Synonyme)
                    </label>
                    <input
                      type="text"
                      value={korrekteAntw.join(', ')}
                      onChange={(e) => {
                        const neu = luecken.map((l) =>
                          l.id === luecke.id
                            ? { ...l, korrekteAntworten: e.target.value.split(',').map((a) => a.trim()).filter(Boolean) }
                            : l
                        )
                        setLuecken(neu)
                      }}
                      placeholder="Korrekte Antworten (Komma-getrennt, z.B. Antwort1, Antwort2)"
                      className={`input-field w-full ${hatKorrekteAntwort ? '' : 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'}`}
                    />
                    {lueckentextModus === 'dropdown' && (
                      <p className="text-xs italic text-slate-500 dark:text-slate-400">
                        — inaktiv im Dropdown-Modus
                      </p>
                    )}
                    {!hatKorrekteAntwort && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Keine korrekte Antwort hinterlegt — diese Lücke wird bei SuS-Antworten immer als falsch bewertet.
                      </p>
                    )}
                  </div>
                  <div
                    data-modus-feld="dropdown"
                    className={lueckentextModus === 'freitext' ? 'opacity-50' : ''}
                  >
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-0.5">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 normal-case font-medium text-[10px]">Dropdown</span>
                      Auswahl-Optionen (1 Korrekte + 4 Distraktoren)
                    </label>
                    <input
                      type="text"
                      value={dropdownText}
                      onChange={(e) => {
                        const optionen = e.target.value.split(',').map((a) => a.trim()).filter(Boolean)
                        const neu = luecken.map((l) =>
                          l.id === luecke.id
                            ? { ...l, dropdownOptionen: optionen.length > 0 ? optionen : undefined }
                            : l
                        )
                        setLuecken(neu)
                      }}
                      placeholder="Dropdown-Optionen (1 Korrekte + 4 Distraktoren, Komma-getrennt)"
                      className="input-field w-full text-xs"
                    />
                    {lueckentextModus === 'freitext' && (
                      <p className="text-xs italic text-slate-500 dark:text-slate-400">
                        — inaktiv im Freitext-Modus
                      </p>
                    )}
                    {luecke.dropdownOptionen && luecke.dropdownOptionen.length > 0 && !korrekteImDropdown && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Korrekte Antwort nicht in Dropdown-Optionen enthalten
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Abschnitt>
  )
}

// ---- Hilfsfunktionen ----

/** IDs aus Text extrahieren: akzeptiert `{N}` und `{{N}}`, dedupliziert. */
function extrahiereIds(text: string): string[] {
  const matches = text.match(PLATZHALTER_REGEX)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
}

/**
 * Findet eine bestehende Lücke zur Platzhalter-ID und berücksichtigt dabei das
 * importierte ID-Format `luecke-N` (Pool-Fragen), damit bestehende
 * korrekteAntworten beim Tippen im Text nicht verloren gehen.
 */
function findeBestehendeLuecke(
  id: string,
  bisherigeLuecken: LueckentextFrage['luecken'],
): LueckentextFrage['luecken'][number] | undefined {
  return (
    bisherigeLuecken.find((l) => l.id === id) ??
    bisherigeLuecken.find((l) => l.id === `luecke-${id}`)
  )
}

/** Lücken-Array mit Text synchronisieren (bestehende beibehalten, neue hinzufügen) */
function syncLueckenFromText(
  text: string,
  bisherigeLuecken: LueckentextFrage['luecken'],
  setLuecken: (v: LueckentextFrage['luecken']) => void,
): void {
  const ids = extrahiereIds(text)
  if (ids.length === 0) return
  const neueLuecken = ids.map((id) => {
    const bestehend = findeBestehendeLuecke(id, bisherigeLuecken)
    return bestehend ? { ...bestehend, id } : { id, korrekteAntworten: [''], caseSensitive: false }
  })
  setLuecken(neueLuecken)
}

/** Lücken-Array synchronisieren und zurückgeben (ohne Setter) */
function syncLueckenArray(
  text: string,
  bisherigeLuecken: LueckentextFrage['luecken'],
): LueckentextFrage['luecken'] {
  const ids = extrahiereIds(text)
  return ids.map((id) => {
    const bestehend = findeBestehendeLuecke(id, bisherigeLuecken)
    return bestehend ? { ...bestehend, id } : { id, korrekteAntworten: [''], caseSensitive: false }
  })
}
