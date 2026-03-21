import { useState, useMemo } from 'react'

interface KlassenGruppe {
  klasse: string
  schueler: Array<{ email: string; name: string; vorname: string; klasse: string; kurs?: string }>
}

/** Kurs = Sheet-Name (z.B. "28bc29fs"), enthält mehrere Klassen */
interface KursGruppe {
  kurs: string
  klassen: KlassenGruppe[]
  gesamtSuS: number
}

interface Props {
  gruppen: KlassenGruppe[]
  ausgewaehlteKlassen: Set<string>
  onToggleKlasse: (klasse: string) => void
}

export default function KlassenAuswahl({ gruppen, ausgewaehlteKlassen, onToggleKlasse }: Props) {
  const [zugeklappt, setZugeklappt] = useState<Set<string>>(new Set())

  // Nach Kurs gruppieren (falls kurs-Feld vorhanden)
  const kursGruppen = useMemo((): KursGruppe[] => {
    // Prüfe ob kurs-Feld in den Daten vorhanden ist
    const hatKurs = gruppen.some((g) => g.schueler.some((s) => s.kurs))
    if (!hatKurs) {
      // Kein kurs-Feld → alles unter einem Kurs
      return [{ kurs: '', klassen: gruppen, gesamtSuS: gruppen.reduce((s, g) => s + g.schueler.length, 0) }]
    }

    // Kurse aus den SuS-Daten extrahieren
    const kursMap = new Map<string, Set<string>>()
    for (const g of gruppen) {
      for (const s of g.schueler) {
        const kurs = s.kurs || '—'
        if (!kursMap.has(kurs)) kursMap.set(kurs, new Set())
        kursMap.get(kurs)!.add(g.klasse)
      }
    }

    return Array.from(kursMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([kurs, klassenIds]) => {
        const klassen = gruppen.filter((g) => klassenIds.has(g.klasse))
        return {
          kurs,
          klassen: klassen.sort((a, b) => a.klasse.localeCompare(b.klasse)),
          gesamtSuS: klassen.reduce((s, g) => s + g.schueler.length, 0),
        }
      })
  }, [gruppen])

  const toggleKurs = (kurs: string) => {
    setZugeklappt((prev) => {
      const neu = new Set(prev)
      if (neu.has(kurs)) neu.delete(kurs)
      else neu.add(kurs)
      return neu
    })
  }

  const toggleAlleKlassenInKurs = (kursGruppe: KursGruppe) => {
    const alleAusgewaehlt = kursGruppe.klassen.every((g) => ausgewaehlteKlassen.has(g.klasse))
    for (const g of kursGruppe.klassen) {
      if (alleAusgewaehlt) {
        // Alle abwählen
        if (ausgewaehlteKlassen.has(g.klasse)) onToggleKlasse(g.klasse)
      } else {
        // Alle auswählen
        if (!ausgewaehlteKlassen.has(g.klasse)) onToggleKlasse(g.klasse)
      }
    }
  }

  // Wenn nur 1 Kurs ohne Namen → flache Ansicht (kein Kurs-Header)
  const flacheAnsicht = kursGruppen.length === 1 && !kursGruppen[0].kurs

  return (
    <div className="space-y-2">
      {flacheAnsicht ? (
        // Flache Ansicht: nur Klassen-Buttons
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {gruppen.map((g) => (
            <KlassenButton
              key={g.klasse}
              gruppe={g}
              ausgewaehlt={ausgewaehlteKlassen.has(g.klasse)}
              onToggle={() => onToggleKlasse(g.klasse)}
            />
          ))}
        </div>
      ) : (
        // Kurs-gruppierte Ansicht
        <div className="space-y-3">
          {kursGruppen.map((kg) => {
            const istZu = zugeklappt.has(kg.kurs)
            const ausgewaehlteInKurs = kg.klassen.filter((g) => ausgewaehlteKlassen.has(g.klasse)).length
            const alleAusgewaehlt = ausgewaehlteInKurs === kg.klassen.length

            return (
              <div key={kg.kurs} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {/* Kurs-Header */}
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/70">
                  <button
                    type="button"
                    onClick={() => toggleKurs(kg.kurs)}
                    className="flex-1 flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span
                      className="text-xs text-slate-400 transition-transform duration-150"
                      style={{ transform: istZu ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                    >
                      ▼
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {kg.kurs}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {kg.klassen.length} Klassen · {kg.gesamtSuS} SuS
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAlleKlassenInKurs(kg)}
                    className="px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    title={alleAusgewaehlt ? 'Alle Klassen abwählen' : 'Alle Klassen auswählen'}
                  >
                    {alleAusgewaehlt ? 'Keine' : 'Alle'}
                  </button>
                </div>

                {/* Klassen-Buttons */}
                {!istZu && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2">
                    {kg.klassen.map((g) => (
                      <KlassenButton
                        key={g.klasse}
                        gruppe={g}
                        ausgewaehlt={ausgewaehlteKlassen.has(g.klasse)}
                        onToggle={() => onToggleKlasse(g.klasse)}
                      />
                    ))}
                  </div>
                )}

                {/* Zusammenfassung wenn zugeklappt */}
                {istZu && ausgewaehlteInKurs > 0 && (
                  <div className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 border-t border-slate-200 dark:border-slate-700">
                    {ausgewaehlteInKurs}/{kg.klassen.length} Klassen ausgewählt
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Einzelner Klassen-Button */
function KlassenButton({ gruppe, ausgewaehlt, onToggle }: {
  gruppe: KlassenGruppe
  ausgewaehlt: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer
        ${ausgewaehlt
          ? 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-200'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
    >
      <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs
        ${ausgewaehlt
          ? 'bg-blue-500 border-blue-500 text-white'
          : 'border-slate-300 dark:border-slate-500'
        }`}>
        {ausgewaehlt ? '✓' : ''}
      </span>
      <span className="font-medium">{gruppe.klasse}</span>
      <span className="text-xs opacity-70">({gruppe.schueler.length})</span>
    </button>
  )
}

export type { KlassenGruppe }
