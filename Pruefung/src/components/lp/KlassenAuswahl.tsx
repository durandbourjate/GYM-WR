import { useMemo } from 'react'

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
  // Erkennung: Falls die meisten "Klassen" E-Mails sind (fehlerhafte Daten),
  // alle SuS unter einer Sammelgruppe zeigen
  const bereinigtGruppen = useMemo(() => {
    const emailGruppen = gruppen.filter((g) => g.klasse.includes('@'))
    if (emailGruppen.length > gruppen.length / 2) {
      // Fehlerhafte Daten: Klasse enthält E-Mails statt Klassennamen
      // → Alle SuS unter "Alle Schüler" zusammenfassen
      const alleSus = gruppen.flatMap((g) => g.schueler)
      return [{ klasse: 'Alle Schüler', schueler: alleSus }]
    }
    return gruppen
  }, [gruppen])

  const alleAusgewaehlt = bereinigtGruppen.every((g) => ausgewaehlteKlassen.has(g.klasse))
  const keineAusgewaehlt = bereinigtGruppen.every((g) => !ausgewaehlteKlassen.has(g.klasse))

  return (
    <div className="space-y-2">
      {/* Alle/Keine Buttons bei >2 Klassen */}
      {bereinigtGruppen.length > 2 && (
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              if (!alleAusgewaehlt) {
                for (const g of bereinigtGruppen) {
                  if (!ausgewaehlteKlassen.has(g.klasse)) onToggleKlasse(g.klasse)
                }
              }
            }}
            disabled={alleAusgewaehlt}
            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline"
          >
            Alle auswählen
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            type="button"
            onClick={() => {
              if (!keineAusgewaehlt) {
                for (const g of bereinigtGruppen) {
                  if (ausgewaehlteKlassen.has(g.klasse)) onToggleKlasse(g.klasse)
                }
              }
            }}
            disabled={keineAusgewaehlt}
            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline"
          >
            Keine
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {bereinigtGruppen.map((g) => (
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
    </div>
  )
}

export type { KlassenGruppe }
