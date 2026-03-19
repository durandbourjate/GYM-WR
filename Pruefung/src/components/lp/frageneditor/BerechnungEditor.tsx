import type { BerechnungFrage } from '../../../types/fragen.ts'
import { Abschnitt } from './EditorBausteine.tsx'

interface BerechnungEditorProps {
  ergebnisse: BerechnungFrage['ergebnisse']
  setErgebnisse: (e: BerechnungFrage['ergebnisse']) => void
  rechenwegErforderlich: boolean
  setRechenwegErforderlich: (v: boolean) => void
  hilfsmittel: string
  setHilfsmittel: (v: string) => void
}

export default function BerechnungEditor({ ergebnisse, setErgebnisse, rechenwegErforderlich, setRechenwegErforderlich, hilfsmittel, setHilfsmittel }: BerechnungEditorProps) {
  function updateErgebnis(index: number, partial: Partial<BerechnungFrage['ergebnisse'][0]>): void {
    const neu = [...ergebnisse]
    neu[index] = { ...neu[index], ...partial }
    setErgebnisse(neu)
  }

  function addErgebnis(): void {
    const nextId = String(ergebnisse.length + 1)
    setErgebnisse([...ergebnisse, { id: nextId, label: '', korrekt: 0, toleranz: 0, einheit: '' }])
  }

  function removeErgebnis(index: number): void {
    if (ergebnisse.length <= 1) return
    setErgebnisse(ergebnisse.filter((_, i) => i !== index))
  }

  return (
    <Abschnitt titel="Berechnungs-Parameter">
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={rechenwegErforderlich}
            onChange={(e) => setRechenwegErforderlich(e.target.checked)}
            className="rounded"
          />
          Rechenweg erforderlich
        </label>
        <div className="flex-1">
          <input
            type="text"
            value={hilfsmittel}
            onChange={(e) => setHilfsmittel(e.target.value)}
            placeholder="Erlaubte Hilfsmittel (z.B. Taschenrechner)"
            className="input-field"
          />
        </div>
      </div>

      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
        Erwartete Ergebnisse
      </label>
      <div className="space-y-2">
        {/* Spalten-Header */}
        {ergebnisse.length > 0 && (
          <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="flex-1 min-w-0">Bezeichnung</span>
            <span className="w-20 text-center">Ergebnis</span>
            <span className="w-20 text-center">±Toleranz</span>
            <span className="w-16 text-center">Einheit</span>
            <span className="w-7" />
          </div>
        )}
        {ergebnisse.map((erg, i) => (
          <div key={erg.id} className="flex items-start gap-2">
            <input
              type="text"
              value={erg.label}
              onChange={(e) => updateErgebnis(i, { label: e.target.value })}
              placeholder="z.B. Gewinn"
              className="input-field flex-1 min-w-0"
            />
            <input
              type="number"
              value={erg.korrekt}
              onChange={(e) => updateErgebnis(i, { korrekt: parseFloat(e.target.value) || 0 })}
              placeholder="Korrekt"
              className="input-field w-20 text-center font-mono shrink-0"
              title="Korrekte Antwort"
            />
            <input
              type="number"
              value={erg.toleranz}
              onChange={(e) => updateErgebnis(i, { toleranz: parseFloat(e.target.value) || 0 })}
              placeholder="±Tol."
              className="input-field w-20 text-center shrink-0"
              title="Toleranz"
              min={0}
            />
            <input
              type="text"
              value={erg.einheit ?? ''}
              onChange={(e) => updateErgebnis(i, { einheit: e.target.value || undefined })}
              placeholder="Einh."
              className="input-field w-16 shrink-0"
              title="Einheit"
            />
            {ergebnisse.length > 1 && (
              <button
                onClick={() => removeErgebnis(i)}
                className="mt-1.5 w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {ergebnisse.length < 8 && (
        <button
          onClick={addErgebnis}
          className="mt-2 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          + Ergebnis hinzufügen
        </button>
      )}
    </Abschnitt>
  )
}
