interface KlassenGruppe {
  klasse: string
  schueler: Array<{ email: string; name: string; vorname: string; klasse: string }>
}

interface Props {
  gruppen: KlassenGruppe[]
  ausgewaehlteKlassen: Set<string>
  onToggleKlasse: (klasse: string) => void
}

export default function KlassenAuswahl({ gruppen, ausgewaehlteKlassen, onToggleKlasse }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {gruppen.map((g) => (
        <button
          key={g.klasse}
          type="button"
          onClick={() => onToggleKlasse(g.klasse)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer
            ${ausgewaehlteKlassen.has(g.klasse)
              ? 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-200'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
        >
          <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs
            ${ausgewaehlteKlassen.has(g.klasse)
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-slate-300 dark:border-slate-500'
            }`}>
            {ausgewaehlteKlassen.has(g.klasse) ? '✓' : ''}
          </span>
          <span className="font-medium">{g.klasse}</span>
          <span className="text-xs opacity-70">({g.schueler.length})</span>
        </button>
      ))}
    </div>
  )
}

export type { KlassenGruppe }
