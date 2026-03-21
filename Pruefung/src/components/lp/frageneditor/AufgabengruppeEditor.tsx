import { useState } from 'react'
import { Abschnitt } from './EditorBausteine.tsx'

interface AufgabengruppeEditorProps {
  kontext: string
  setKontext: (v: string) => void
  teilaufgabenIds: string[]
  setTeilaufgabenIds: (ids: string[]) => void
  titelRechts?: React.ReactNode
}

/** Editor fuer Aufgabengruppen: Kontext-Text und Teilaufgaben-Verwaltung per ID */
export default function AufgabengruppeEditor({
  kontext,
  setKontext,
  teilaufgabenIds,
  setTeilaufgabenIds,
  titelRechts,
}: AufgabengruppeEditorProps) {
  const [neueId, setNeueId] = useState('')

  function handleHinzufuegen() {
    const id = neueId.trim()
    if (!id || teilaufgabenIds.includes(id)) return
    setTeilaufgabenIds([...teilaufgabenIds, id])
    setNeueId('')
  }

  function handleEntfernen(id: string) {
    setTeilaufgabenIds(teilaufgabenIds.filter((tid) => tid !== id))
  }

  function handleHoch(index: number) {
    if (index <= 0) return
    const neu = [...teilaufgabenIds]
    ;[neu[index - 1], neu[index]] = [neu[index], neu[index - 1]]
    setTeilaufgabenIds(neu)
  }

  function handleRunter(index: number) {
    if (index >= teilaufgabenIds.length - 1) return
    const neu = [...teilaufgabenIds]
    ;[neu[index], neu[index + 1]] = [neu[index + 1], neu[index]]
    setTeilaufgabenIds(neu)
  }

  return (
    <>
      {/* Kontext */}
      <Abschnitt titel="Kontext / Ausgangslage *" titelRechts={titelRechts}>
        <textarea
          value={kontext}
          onChange={(e) => setKontext(e.target.value)}
          rows={6}
          placeholder="Gemeinsamer Kontext fuer alle Teilaufgaben (z.B. Fallbeispiel, Geschaeftsfall, Textquelle)..."
          className="input-field resize-y"
        />
      </Abschnitt>

      {/* Teilaufgaben */}
      <Abschnitt titel="Teilaufgaben">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Teilaufgaben werden separat in der Fragenbank erstellt und hier per ID verknuepft. Die Reihenfolge bestimmt die Nummerierung (a, b, c, ...).
        </p>

        {/* Liste */}
        {teilaufgabenIds.length > 0 && (
          <div className="space-y-1 mb-3">
            {teilaufgabenIds.map((id, i) => (
              <div
                key={id}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 w-6">
                  {String.fromCharCode(97 + i)})
                </span>
                <code className="text-sm text-slate-700 dark:text-slate-200 flex-1 font-mono truncate">
                  {id}
                </code>
                {/* Reihenfolge-Buttons */}
                <button
                  onClick={() => handleHoch(i)}
                  disabled={i === 0}
                  className="px-1.5 py-0.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Nach oben"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleRunter(i)}
                  disabled={i === teilaufgabenIds.length - 1}
                  className="px-1.5 py-0.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Nach unten"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleEntfernen(id)}
                  className="px-1.5 py-0.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded cursor-pointer"
                  title="Entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Neue ID hinzufuegen */}
        <div className="flex gap-2">
          <input
            type="text"
            value={neueId}
            onChange={(e) => setNeueId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleHinzufuegen() } }}
            placeholder="Frage-ID eingeben (z.B. bwl-mc-a1b2)..."
            className="input-field flex-1"
          />
          <button
            onClick={handleHinzufuegen}
            disabled={!neueId.trim() || teilaufgabenIds.includes(neueId.trim())}
            className="px-3 py-1.5 text-sm font-medium text-white bg-slate-700 dark:bg-slate-300 dark:text-slate-800 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Hinzufuegen
          </button>
        </div>

        {teilaufgabenIds.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Mindestens 1 Teilaufgabe erforderlich.
          </p>
        )}
      </Abschnitt>
    </>
  )
}
