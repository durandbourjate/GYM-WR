import type { KontrollStufe } from '../../types/lockdown'

interface Props {
  value: KontrollStufe
  onChange: (stufe: KontrollStufe) => void
  disabled?: boolean
}

const STUFEN: { key: KontrollStufe; label: string; icon: string; beschreibung: string }[] = [
  { key: 'locker', label: 'Locker', icon: '🟢', beschreibung: 'Nur Logging + Warnung' },
  { key: 'standard', label: 'Standard', icon: '🟡', beschreibung: 'Copy/Paste-Block, Vollbild, 3 Verstösse → Sperre' },
  { key: 'streng', label: 'Streng', icon: '🔴', beschreibung: 'Sofort-Pause bei Verstoss, SEB empfohlen' },
]

export function KontrollStufeSelect({ value, onChange, disabled }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        Kontrollstufe
      </label>
      <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
        {STUFEN.map((s) => {
          const istAktiv = value === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => !disabled && onChange(s.key)}
              disabled={disabled}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                istAktiv
                  ? 'bg-blue-600 text-white'
                  : disabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
              } ${s.key !== 'locker' ? 'border-l border-slate-300 dark:border-slate-600' : ''}`}
            >
              {s.icon} {s.label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {STUFEN.find(s => s.key === value)?.beschreibung}
      </p>
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
        Auf iPads wird die Stufe automatisch angepasst (kein Vollbild möglich).
      </p>
    </div>
  )
}
