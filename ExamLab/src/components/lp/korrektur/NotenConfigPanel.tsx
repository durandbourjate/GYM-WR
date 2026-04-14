import type { NotenConfig } from '../../../types/pruefung.ts'
import { berechneNote } from '../../../utils/korrekturUtils.ts'

interface Props {
  notenConfig: NotenConfig
  setNotenConfig: React.Dispatch<React.SetStateAction<NotenConfig>>
  maxPunkte: number
  offen: boolean
  toggleOffen: () => void
}

export default function NotenConfigPanel({ notenConfig, setNotenConfig, maxPunkte, offen, toggleOffen }: Props) {
  return (
    <div className="mb-6">
      <button
        onClick={toggleOffen}
        className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <span className={`inline-block transition-transform ${offen ? 'rotate-90' : ''}`}>&#9654;</span>
        Notenskala
      </button>
      {offen && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Punkte für Note 6
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={notenConfig.punkteFuerSechs || maxPunkte}
                  onChange={(e) => setNotenConfig((prev) => ({ ...prev, punkteFuerSechs: parseFloat(e.target.value) || 0 }))}
                  min={1}
                  max={maxPunkte}
                  step={0.5}
                  className="w-20 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  title="Benötigte Punkte für die Maximalnote 6"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  / {maxPunkte} Max.
                  {notenConfig.punkteFuerSechs > 0 && notenConfig.punkteFuerSechs < maxPunkte && (
                    <span className="ml-1">
                      ({Math.round(notenConfig.punkteFuerSechs / maxPunkte * 100)}%)
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                Standard: Maximum. Heruntersetzen um eine «mildere» Skala zu verwenden.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Rundung
              </label>
              <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
                {([0.1, 0.25, 0.5, 1] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setNotenConfig((prev) => ({ ...prev, rundung: r }))}
                    className={`flex-1 px-2 py-1.5 text-xs transition-colors cursor-pointer border-l first:border-l-0 border-slate-300 dark:border-slate-600
                      ${notenConfig.rundung === r
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    title={`Auf ${r === 1 ? 'ganze' : r === 0.5 ? 'halbe' : r === 0.25 ? 'Viertel-' : 'Zehntel-'}Noten runden`}
                  >
                    {r === 1 ? 'Ganze' : r === 0.5 ? 'Halbe' : r === 0.25 ? 'Viertel' : 'Zehntel'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Vorschau der Notenskala */}
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Vorschau</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
              {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((pct) => {
                const p = maxPunkte * pct / 100
                const note = berechneNote(p, maxPunkte, notenConfig)
                const farbe = note >= 4 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                return (
                  <span key={pct}>
                    {pct}% → <span className={farbe}>{note.toFixed(notenConfig.rundung < 0.5 ? 2 : 1)}</span>
                  </span>
                )
              })}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Formel: Note = 1 + 5 × (Punkte / {notenConfig.punkteFuerSechs > 0 ? notenConfig.punkteFuerSechs : maxPunkte})
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
