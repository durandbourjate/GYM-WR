export function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-3">
        {titel}
      </h3>
      {children}
    </div>
  )
}

export function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      {children}
    </div>
  )
}
