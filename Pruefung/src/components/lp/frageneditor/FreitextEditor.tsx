import { useState } from 'react'
import { Abschnitt, Feld } from './EditorBausteine.tsx'

interface FreitextEditorProps {
  laenge: 'kurz' | 'mittel' | 'lang'
  setLaenge: (v: 'kurz' | 'mittel' | 'lang') => void
  placeholder: string
  setPlaceholder: (v: string) => void
  minWoerter?: number
  setMinWoerter: (v: number | undefined) => void
  maxWoerter?: number
  setMaxWoerter: (v: number | undefined) => void
}

export default function FreitextEditor({ laenge, setLaenge, placeholder, setPlaceholder, minWoerter, setMinWoerter, maxWoerter, setMaxWoerter }: FreitextEditorProps) {
  const [zeigeAutokorrekturInfo, setZeigeAutokorrekturInfo] = useState(false)

  return (
    <Abschnitt titel="Freitext-Optionen">
      <div className="grid grid-cols-2 gap-3">
        <Feld label="Erwartete Länge">
          <select value={laenge} onChange={(e) => setLaenge(e.target.value as 'kurz' | 'mittel' | 'lang')} className="input-field">
            <option value="kurz">Kurz (1-3 Sätze)</option>
            <option value="mittel">Mittel (1 Absatz)</option>
            <option value="lang">Lang (mehrere Absätze)</option>
          </select>
        </Feld>
        <Feld label="Hilfstext (Placeholder)">
          <input type="text" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Hinweis für SuS..." className="input-field" />
        </Feld>
      </div>
      {/* Autokorrektur-Hinweis (kompakt) */}
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => setZeigeAutokorrekturInfo(true)}
          className="underline hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
        >
          Autokorrektur ausschalten?
        </button>
      </div>
      {zeigeAutokorrekturInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setZeigeAutokorrekturInfo(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Autokorrektur deaktivieren</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Die Browser-Autokorrektur (Rechtschreibprüfung, rote Unterstriche) kann pro Prüfung deaktiviert werden — z.B. für Diktate oder Sprachprüfungen.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Einstellung unter: <strong>Prüfung bearbeiten → Konfiguration → Rechtschreibprüfung</strong>
            </p>
            <button
              type="button"
              onClick={() => setZeigeAutokorrekturInfo(false)}
              className="px-4 py-2 text-sm rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-3">
        <Feld label="Min. Wörter (optional)">
          <input
            type="number"
            min={0}
            value={minWoerter ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
              setMinWoerter(val !== undefined && !isNaN(val) ? val : undefined)
            }}
            placeholder="z.B. 50"
            className="input-field"
          />
        </Feld>
        <Feld label="Max. Wörter (optional)">
          <input
            type="number"
            min={0}
            value={maxWoerter ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
              setMaxWoerter(val !== undefined && !isNaN(val) ? val : undefined)
            }}
            placeholder="z.B. 200"
            className="input-field"
          />
        </Feld>
      </div>
    </Abschnitt>
  )
}
