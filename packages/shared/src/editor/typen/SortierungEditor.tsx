import { useState } from 'react'

interface Props {
  elemente: string[]
  setElemente: React.Dispatch<React.SetStateAction<string[]>>
  teilpunkte: boolean
  setTeilpunkte: (v: boolean) => void
}

export default function SortierungEditor({ elemente, setElemente, teilpunkte, setTeilpunkte }: Props) {
  const [textInput, setTextInput] = useState(elemente.join('\n'))

  function handleTextChange(text: string) {
    setTextInput(text)
    const zeilen = text.split('\n').filter(z => z.trim())
    setElemente(zeilen.map(z => z.trim()))
  }

  function handleElementHoch(index: number) {
    if (index === 0) return
    const neu = [...elemente]
    ;[neu[index], neu[index - 1]] = [neu[index - 1], neu[index]]
    setElemente(neu)
    setTextInput(neu.join('\n'))
  }

  function handleElementRunter(index: number) {
    if (index >= elemente.length - 1) return
    const neu = [...elemente]
    ;[neu[index], neu[index + 1]] = [neu[index + 1], neu[index]]
    setElemente(neu)
    setTextInput(neu.join('\n'))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          Elemente in korrekter Reihenfolge (eines pro Zeile)
        </label>
        <textarea
          value={textInput}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Element 1&#10;Element 2&#10;Element 3&#10;..."
        />
      </div>

      {/* Vorschau der Reihenfolge */}
      {elemente.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Vorschau (korrekte Reihenfolge):
          </p>
          <div className="space-y-1.5">
            {elemente.map((el, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{el}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleElementHoch(i)}
                    disabled={i === 0}
                    className="px-1.5 py-0.5 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {'\u2191'}
                  </button>
                  <button
                    onClick={() => handleElementRunter(i)}
                    disabled={i === elemente.length - 1}
                    className="px-1.5 py-0.5 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {'\u2193'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teilpunkte Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={teilpunkte}
          onChange={(e) => setTeilpunkte(e.target.checked)}
          className="rounded border-slate-300 dark:border-slate-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">
          Teilpunkte erlauben (Punkte pro Element an korrekter Position)
        </span>
      </label>
    </div>
  )
}
