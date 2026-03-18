import type { LueckentextFrage } from '../../../types/fragen.ts'
import { Abschnitt, Feld } from './EditorBausteine.tsx'

interface LueckentextEditorProps {
  textMitLuecken: string
  setTextMitLuecken: (v: string) => void
  luecken: LueckentextFrage['luecken']
  setLuecken: (v: LueckentextFrage['luecken']) => void
}

export default function LueckentextEditor({ textMitLuecken, setTextMitLuecken, luecken, setLuecken }: LueckentextEditorProps) {
  // Auto-parse Lücken aus Text
  function handleTextChange(text: string): void {
    setTextMitLuecken(text)
    const matches = text.match(/\{\{(\d+)\}\}/g)
    if (matches) {
      const ids = [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
      // Bestehende Lücken beibehalten, neue hinzufügen
      const neueLuecken = ids.map((id) => {
        const bestehend = luecken.find((l) => l.id === id)
        return bestehend ?? { id, korrekteAntworten: [''], caseSensitive: false }
      })
      setLuecken(neueLuecken)
    }
  }

  return (
    <Abschnitt titel="Lückentext">
      <Feld label="Text mit Lücken">
        <textarea
          value={textMitLuecken}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={4}
          placeholder="Verwenden Sie {{1}}, {{2}} etc. als Platzhalter für Lücken..."
          className="input-field resize-y font-mono text-sm"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Syntax: {'{{1}}'} = erste Lücke, {'{{2}}'} = zweite Lücke, etc.
        </p>
      </Feld>

      {luecken.length > 0 && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Korrekte Antworten pro Lücke
          </label>
          {luecken.map((luecke) => (
            <div key={luecke.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono w-8 shrink-0">
                {`{{${luecke.id}}}`}
              </span>
              <input
                type="text"
                value={luecke.korrekteAntworten.join(', ')}
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
          ))}
        </div>
      )}
    </Abschnitt>
  )
}
