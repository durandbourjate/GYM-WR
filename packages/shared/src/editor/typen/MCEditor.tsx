import type { MCOption } from '../../types/fragen'
import { Abschnitt } from '../components/EditorBausteine'
import type { FeldStatus } from '../pflichtfeldValidation'

interface MCEditorProps {
  optionen: MCOption[]
  setOptionen: (o: MCOption[]) => void
  mehrfachauswahl: boolean
  setMehrfachauswahl: (v: boolean) => void
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  titelRechts?: React.ReactNode
  /** Erklärungen den SuS in der Korrektur-Einsicht zeigen */
  erklaerungSichtbar?: boolean
  setErklaerungSichtbar?: (v: boolean) => void
  /** Pflichtfeld-Status der Optionen-Section (Bundle H Phase 3) */
  feldStatusOptionen?: FeldStatus
}

function pflichtCls(status: FeldStatus | undefined): string {
  return status === 'pflicht-leer'
    ? 'border border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40 rounded-lg p-3'
    : 'border border-slate-200 dark:border-slate-700 rounded-lg p-3'
}

export default function MCEditor({ optionen, setOptionen, mehrfachauswahl, setMehrfachauswahl, titelRechts, erklaerungSichtbar, setErklaerungSichtbar, feldStatusOptionen }: MCEditorProps) {
  function updateOption(index: number, partial: Partial<MCOption>): void {
    const neu = [...optionen]
    neu[index] = { ...neu[index], ...partial }
    setOptionen(neu)
  }

  function addOption(): void {
    const nextId = String.fromCharCode(97 + optionen.length) // a, b, c, ...
    setOptionen([...optionen, { id: nextId, text: '', korrekt: false }])
  }

  function removeOption(index: number): void {
    if (optionen.length <= 2) return
    setOptionen(optionen.filter((_, i) => i !== index))
  }

  return (
    <Abschnitt titel="Antwortoptionen" titelRechts={titelRechts}>
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={mehrfachauswahl}
            onChange={(e) => setMehrfachauswahl(e.target.checked)}
            className="rounded"
          />
          Mehrfachauswahl erlaubt
        </label>
      </div>

      <div data-testid="mc-optionen-section" className={`space-y-2 ${pflichtCls(feldStatusOptionen)}`}>
        {optionen.map((opt, i) => (
          <div key={opt.id} className="flex items-start gap-2">
            {/* Korrekt-Toggle */}
            <button
              onClick={() => updateOption(i, { korrekt: !opt.korrekt })}
              className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors
                ${opt.korrekt
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-slate-400 dark:border-slate-500 hover:border-green-400'
                }`}
              title={opt.korrekt ? 'Korrekt (klicken zum Entfernen)' : 'Als korrekt markieren'}
            >
              {opt.korrekt && <span className="text-xs">✓</span>}
            </button>

            {/* Option-Label (a, b, c, ...) */}
            <span className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-mono w-4 shrink-0">
              {String.fromCharCode(97 + i)})
            </span>

            {/* Text */}
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(i, { text: e.target.value })}
              placeholder={`Option ${String.fromCharCode(97 + i)}...`}
              className="input-field input-pflicht flex-1"
            />

            {/* Erklärung (optional) */}
            <input
              type="text"
              value={opt.erklaerung ?? ''}
              onChange={(e) => updateOption(i, { erklaerung: e.target.value || undefined })}
              placeholder="Erklärung (optional)"
              className="input-field-narrow w-40"
            />

            {/* Entfernen */}
            {optionen.length > 2 && (
              <button
                onClick={() => removeOption(i)}
                className="mt-1.5 w-6 h-6 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {optionen.length < 8 && (
        <button
          onClick={addOption}
          className="mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          + Option hinzufügen
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
