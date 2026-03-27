import { useState, useRef, useEffect } from 'react'

/** Ein SuS-Eintrag aus der Klassenliste */
export interface KlassenlistenSuS {
  email: string
  name: string
  vorname: string
  klasse: string
  kurs?: string
}

/** Kurs = Sheet-Name (z.B. "28bc29fs", "EWR 29fs") mit allen zugehörigen SuS */
export interface KursGruppe {
  kurs: string
  schueler: KlassenlistenSuS[]
}

interface Props {
  kursGruppen: KursGruppe[]
  ausgewaehlteSuS: Set<string>
  onToggleKurs: (kurs: string) => void
  onToggleSuS: (email: string) => void
  onAlleAuswaehlen: () => void
  onKeineAuswaehlen: () => void
}

/** Indeterminate-Checkbox für Kurs-Header */
function KursCheckbox({ checked, indeterminate }: { checked: boolean; indeterminate: boolean }) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      readOnly
      className="w-4 h-4 shrink-0 accent-blue-600 cursor-pointer pointer-events-none"
    />
  )
}

export default function KursAuswahl({ kursGruppen, ausgewaehlteSuS = new Set<string>(), onToggleKurs, onToggleSuS, onAlleAuswaehlen, onKeineAuswaehlen }: Props) {
  const [zugeklappt, setZugeklappt] = useState<Set<string>>(new Set())

  const toggleDetails = (kurs: string) => {
    setZugeklappt((prev) => {
      const neu = new Set(prev)
      if (neu.has(kurs)) neu.delete(kurs)
      else neu.add(kurs)
      return neu
    })
  }

  if (kursGruppen.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Keine Kurse gefunden.</p>
  }

  return (
    <div className="space-y-2">
      {/* Alle / Keine */}
      <div className="flex gap-2 mb-1">
        <button
          type="button"
          onClick={onAlleAuswaehlen}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Alle
        </button>
        <button
          type="button"
          onClick={onKeineAuswaehlen}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Keine
        </button>
      </div>

      {/* Kurs-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {kursGruppen.map((kg) => {
          const emails = kg.schueler.map((s) => s.email)
          const anzahlAusgewaehlt = emails.filter((e) => ausgewaehlteSuS.has(e)).length
          const alleAusgewaehlt = anzahlAusgewaehlt === emails.length
          const keineAusgewaehlt = anzahlAusgewaehlt === 0
          const indeterminate = !alleAusgewaehlt && !keineAusgewaehlt
          const istOffen = !zugeklappt.has(kg.kurs)
          const klassen = [...new Set(kg.schueler.map((s) => s.klasse))].sort()

          return (
            <div
              key={kg.kurs}
              className={`rounded-lg border transition-colors overflow-hidden
                ${!keineAusgewaehlt
                  ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-600'
                  : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600'
                }`}
            >
              {/* Kurs-Header mit Checkbox */}
              <button
                type="button"
                onClick={() => onToggleKurs(kg.kurs)}
                className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20"
              >
                <KursCheckbox checked={alleAusgewaehlt} indeterminate={indeterminate} />
                <span className={`font-semibold text-sm ${!keineAusgewaehlt ? 'text-blue-800 dark:text-blue-200' : 'text-slate-700 dark:text-slate-200'}`}>
                  {kg.kurs}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                  {anzahlAusgewaehlt}/{kg.schueler.length} SuS
                </span>
              </button>

              {/* Details-Toggle */}
              <div className="border-t border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => toggleDetails(kg.kurs)}
                  className="w-full flex items-center gap-1 px-3 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  <span
                    className="transition-transform duration-150"
                    style={{ transform: istOffen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  >
                    ▼
                  </span>
                  <span>
                    {klassen.join(', ')}
                  </span>
                </button>

                {/* SuS-Liste (immer mit Checkboxen) */}
                {istOffen && (
                  <div className="px-3 pb-2 max-h-40 overflow-y-auto">
                    {klassen.map((kl) => {
                      const susInKlasse = kg.schueler.filter((s) => s.klasse === kl)
                      return (
                        <div key={kl} className="mt-1">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                            {kl} ({susInKlasse.length})
                          </div>
                          {susInKlasse.map((s) => {
                            const istAusgewaehlt = ausgewaehlteSuS.has(s.email)
                            return (
                              <label
                                key={s.email}
                                className={`flex items-center gap-1.5 pl-2 py-0.5 cursor-pointer text-xs transition-opacity ${
                                  !istAusgewaehlt ? 'opacity-40' : ''
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={istAusgewaehlt}
                                  onChange={() => onToggleSuS(s.email)}
                                  className="w-3 h-3 shrink-0 accent-green-600 cursor-pointer"
                                />
                                <span className="text-slate-600 dark:text-slate-300">
                                  {s.name} {s.vorname}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
