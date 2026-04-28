import type { RichtigFalschFrage } from '../../types/fragen'
import { Abschnitt } from '../components/EditorBausteine'
import type { FeldStatus } from '../pflichtfeldValidation'

interface RichtigFalschEditorProps {
  aussagen: RichtigFalschFrage['aussagen']
  setAussagen: (a: RichtigFalschFrage['aussagen']) => void
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  titelRechts?: React.ReactNode
  /** Erklärungen den SuS in der Korrektur-Einsicht zeigen */
  erklaerungSichtbar?: boolean
  setErklaerungSichtbar?: (v: boolean) => void
  /** Pflichtfeld-Status der Aussagen-Section (Bundle H Phase 3) */
  feldStatusAussagen?: FeldStatus
}

function pflichtCls(status: FeldStatus | undefined): string {
  return status === 'pflicht-leer'
    ? 'border border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40 rounded-lg p-3'
    : 'border border-slate-200 dark:border-slate-700 rounded-lg p-3'
}

export default function RichtigFalschEditor({ aussagen, setAussagen, titelRechts, erklaerungSichtbar, setErklaerungSichtbar, feldStatusAussagen }: RichtigFalschEditorProps) {
  function updateAussage(index: number, partial: Partial<RichtigFalschFrage['aussagen'][0]>): void {
    const neu = [...aussagen]
    neu[index] = { ...neu[index], ...partial }
    setAussagen(neu)
  }

  function addAussage(): void {
    const nextId = String(aussagen.length + 1)
    setAussagen([...aussagen, { id: nextId, text: '', korrekt: true }])
  }

  function removeAussage(index: number): void {
    if (aussagen.length <= 2) return
    setAussagen(aussagen.filter((_, i) => i !== index))
  }

  return (
    <Abschnitt titel="Aussagen (Richtig/Falsch)" titelRechts={titelRechts}>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        Geben Sie die Aussagen ein und markieren Sie, ob sie richtig oder falsch sind.
      </p>
      <div data-testid="rf-aussagen-section" className={`space-y-2 ${pflichtCls(feldStatusAussagen)}`}>
        {aussagen.map((a, i) => (
          <div key={a.id} className="flex items-start gap-2">
            {/* Richtig/Falsch Toggle */}
            <button
              onClick={() => updateAussage(i, { korrekt: !a.korrekt })}
              className={`mt-1.5 px-2 py-0.5 text-xs rounded-full border-2 font-medium shrink-0 cursor-pointer transition-colors
                ${a.korrekt
                  ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300'
                  : 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300'
                }`}
              title={a.korrekt ? 'Richtig (klicken für Falsch)' : 'Falsch (klicken für Richtig)'}
            >
              {a.korrekt ? 'R' : 'F'}
            </button>

            {/* Aussagentext */}
            <input
              type="text"
              value={a.text}
              onChange={(e) => updateAussage(i, { text: e.target.value })}
              placeholder={`Aussage ${i + 1}...`}
              className="input-field input-pflicht flex-1"
            />

            {/* Erklärung (optional) */}
            <input
              type="text"
              value={a.erklaerung ?? ''}
              onChange={(e) => updateAussage(i, { erklaerung: e.target.value || undefined })}
              placeholder="Erklärung (optional)"
              className="input-field-narrow w-40"
            />

            {/* Entfernen */}
            {aussagen.length > 2 && (
              <button
                onClick={() => removeAussage(i)}
                className="mt-1.5 w-6 h-6 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {aussagen.length < 12 && (
        <button
          onClick={addAussage}
          className="mt-2 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          + Aussage hinzufügen
        </button>
      )}

      {/* Erklärung-Sichtbarkeit Toggle */}
      {setErklaerungSichtbar && (
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={erklaerungSichtbar ?? false}
            onChange={(e) => setErklaerungSichtbar(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          Erklärungen den SuS in der Korrektur-Einsicht zeigen
        </label>
      )}
    </Abschnitt>
  )
}
