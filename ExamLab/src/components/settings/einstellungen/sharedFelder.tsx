export function CheckboxChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
        checked
          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-400'
      }`}
    >
      {checked && '✓ '}{label}
    </button>
  )
}

export function SettingsField({ label, value, onChange, multiline, readonly, hinweis }: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  readonly?: boolean
  hinweis?: string
}) {
  const baseClass = `w-full text-sm rounded-lg border px-3 py-2 transition-colors ${
    readonly
      ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-400'
  }`

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readonly}
          rows={3}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readonly}
          className={baseClass}
        />
      )}
      {hinweis && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hinweis}</p>}
    </div>
  )
}
