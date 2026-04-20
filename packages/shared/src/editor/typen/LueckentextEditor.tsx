import { useRef } from 'react'
import type { LueckentextFrage } from '../../types/fragen'
import { Abschnitt, Feld } from '../components/EditorBausteine'

interface LueckentextEditorProps {
  textMitLuecken: string
  setTextMitLuecken: (v: string) => void
  luecken: LueckentextFrage['luecken']
  setLuecken: (v: LueckentextFrage['luecken']) => void
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  titelRechts?: React.ReactNode
}

export default function LueckentextEditor({ textMitLuecken, setTextMitLuecken, luecken, setLuecken, titelRechts }: LueckentextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-parse Lücken aus Text
  function handleTextChange(text: string): void {
    setTextMitLuecken(text)
    syncLueckenFromText(text, luecken, setLuecken)
  }

  /** Nächste freie Lücken-ID ermitteln */
  function naechsteId(): string {
    const matches = textMitLuecken.match(/\{\{(\d+)\}\}/g)
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
          value={textMitLuecken}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={4}
          placeholder="Text eingeben und Wörter markieren, um Lücken zu erstellen..."
          className="input-field resize-y font-mono text-sm"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Syntax: {'{{1}}'} = erste Lücke, {'{{2}}'} = zweite Lücke, etc.
        </p>
      </Feld>

      {luecken.length > 0 && (
        <div className="mt-3 space-y-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Korrekte Antworten pro Lücke
          </label>
          {luecken.map((luecke, lueckenIndex) => {
            // Defensive: korrekteAntworten kann bei alten/unvollständigen Pool-Fragen undefined sein
            const korrekteAntw = luecke.korrekteAntworten ?? []
            const dropdownText = luecke.dropdownOptionen?.join(', ') ?? ''
            const korrekteImDropdown =
              luecke.dropdownOptionen && luecke.dropdownOptionen.length > 0
                ? korrekteAntw.some((a) => luecke.dropdownOptionen!.includes(a))
                : true
            return (
              <div key={luecke.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono w-8 shrink-0" title={`ID: ${luecke.id}`}>
                    {`{{${lueckenIndex + 1}}}`}
                  </span>
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
                    className="input-field flex-1"
                  />
                </div>
                <div className="flex items-start gap-2 pl-10">
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
                    placeholder="Dropdown-Optionen (optional, Komma-getrennt)"
                    className="input-field flex-1 text-xs"
                  />
                </div>
                {luecke.dropdownOptionen && luecke.dropdownOptionen.length > 0 && !korrekteImDropdown && (
                  <p className="pl-10 text-xs text-amber-600 dark:text-amber-400">
                    Korrekte Antwort nicht in Dropdown-Optionen enthalten
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Abschnitt>
  )
}

// ---- Hilfsfunktionen ----

/** Lücken-Array mit Text synchronisieren (bestehende beibehalten, neue hinzufügen) */
function syncLueckenFromText(
  text: string,
  bisherigeLuecken: LueckentextFrage['luecken'],
  setLuecken: (v: LueckentextFrage['luecken']) => void,
): void {
  const matches = text.match(/\{\{(\d+)\}\}/g)
  if (matches) {
    const ids = [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
    const neueLuecken = ids.map((id) => {
      const bestehend = bisherigeLuecken.find((l) => l.id === id)
      return bestehend ?? { id, korrekteAntworten: [''], caseSensitive: false }
    })
    setLuecken(neueLuecken)
  }
}

/** Lücken-Array synchronisieren und zurückgeben (ohne Setter) */
function syncLueckenArray(
  text: string,
  bisherigeLuecken: LueckentextFrage['luecken'],
): LueckentextFrage['luecken'] {
  const matches = text.match(/\{\{(\d+)\}\}/g)
  if (!matches) return []
  const ids = [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
  return ids.map((id) => {
    const bestehend = bisherigeLuecken.find((l) => l.id === id)
    return bestehend ?? { id, korrekteAntworten: [''], caseSensitive: false }
  })
}
