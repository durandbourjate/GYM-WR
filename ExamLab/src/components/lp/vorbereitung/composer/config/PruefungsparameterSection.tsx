import type { PruefungsConfig } from '../../../../../types/pruefung.ts'
import { Section, Field } from '../ComposerUI.tsx'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
  /** Berechnete Gesamtpunkte aus Fragen (wenn verfügbar) */
  berechnetePunkte?: number
}

export default function PruefungsparameterSection({ pruefung, updatePruefung, berechnetePunkte }: Props) {
  return (
    <Section titel={pruefung.typ === 'formativ' ? 'Übungsparameter' : 'Prüfungsparameter'}>
      {/* Zeitmodus */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Zeitmodus</label>
        <div className="flex gap-1">
          {(['countdown', 'open-end'] as const).map((m) => (
            <button
              key={m}
              onClick={() => updatePruefung({ zeitModus: m })}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                ${(pruefung.zeitModus ?? 'countdown') === m
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
            >
              {m === 'countdown' ? 'Countdown' : 'Open-End'}
            </button>
          ))}
        </div>
        {(pruefung.zeitModus ?? 'countdown') === 'open-end' && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Kein Zeitlimit. Beenden Sie die {pruefung.typ === 'formativ' ? 'Übung' : 'Prüfung'} manuell im Monitoring.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(pruefung.zeitModus ?? 'countdown') !== 'open-end' && (
        <Field label="Dauer (Minuten)">
          <input
            type="number"
            value={pruefung.dauerMinuten}
            onChange={(e) => updatePruefung({ dauerMinuten: parseInt(e.target.value) || 0 })}
            min={5}
            max={300}
            className="input-field"
          />
        </Field>
        )}

        {/* Typ-Dropdown ausgeblendet — wird automatisch über den Modus (Prüfen/Üben) gesetzt */}

        {pruefung.typ !== 'formativ' && (
        <Field label="Gesamtpunkte">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={berechnetePunkte ?? pruefung.gesamtpunkte}
              onChange={(e) => updatePruefung({ gesamtpunkte: parseInt(e.target.value) || 0 })}
              readOnly={berechnetePunkte !== undefined}
              min={0}
              className={`input-field ${berechnetePunkte !== undefined ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
            />
            {berechnetePunkte !== undefined && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">auto</span>
            )}
          </div>
        </Field>
        )}
      </div>
    </Section>
  )
}
