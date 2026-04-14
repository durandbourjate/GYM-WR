/** Gemeinsame UI-Bausteine für den Prüfungs-Composer */

export function Section({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">
        {titel}
      </h3>
      {children}
    </div>
  )
}

export function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

export function Toggle({ label, beschreibung, aktiv, onChange }: {
  label: string
  beschreibung: string
  aktiv: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{beschreibung}</p>
      </div>
      <button
        onClick={() => onChange(!aktiv)}
        className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative
          ${aktiv ? 'bg-slate-800 dark:bg-slate-200' : 'bg-slate-300 dark:bg-slate-600'}
        `}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-800 transition-transform shadow-sm
            ${aktiv ? 'left-[18px]' : 'left-0.5'}
          `}
        />
      </button>
    </div>
  )
}

export function MiniCard({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{wert}</div>
    </div>
  )
}
