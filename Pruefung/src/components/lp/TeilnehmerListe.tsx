import { useState, useMemo } from 'react'
import type { Teilnehmer } from '../../types/pruefung'

interface Props {
  teilnehmer: Teilnehmer[]
  onToggle: (email: string) => void
  onManuellHinzufuegen: (email: string) => void
  abgewaehlte: Set<string>
}

export default function TeilnehmerListe({ teilnehmer, onToggle, onManuellHinzufuegen, abgewaehlte }: Props) {
  const [manuelleEmail, setManuelleEmail] = useState('')
  const [zugeklappt, setZugeklappt] = useState<Set<string>>(new Set())

  const handleHinzufuegen = () => {
    const email = manuelleEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    onManuellHinzufuegen(email)
    setManuelleEmail('')
  }

  // Nach Klasse gruppieren
  const gruppen = useMemo(() => {
    const map = new Map<string, Teilnehmer[]>()
    for (const t of teilnehmer) {
      const klasse = t.klasse || '—'
      if (!map.has(klasse)) map.set(klasse, [])
      map.get(klasse)!.push(t)
    }
    // Alphabetisch nach Klasse sortieren
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([klasse, schueler]) => ({
        klasse,
        schueler: schueler.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)),
      }))
  }, [teilnehmer])

  const toggleGruppe = (klasse: string) => {
    setZugeklappt((prev) => {
      const neu = new Set(prev)
      if (neu.has(klasse)) neu.delete(klasse)
      else neu.add(klasse)
      return neu
    })
  }

  const aktiveInGruppe = (schueler: Teilnehmer[]): number =>
    schueler.filter((t) => !abgewaehlte.has(t.email)).length

  return (
    <div className="space-y-3">
      {/* Zähler */}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Ausgewählt: <strong>{teilnehmer.filter((t) => !abgewaehlte.has(t.email)).length}</strong> von {teilnehmer.length} SuS
      </p>

      {/* Gruppierte Liste */}
      <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        {gruppen.map(({ klasse, schueler }) => {
          const istZu = zugeklappt.has(klasse)
          const aktive = aktiveInGruppe(schueler)
          return (
            <div key={klasse}>
              {/* Klassen-Header (collapsible) */}
              <button
                type="button"
                onClick={() => toggleGruppe(klasse)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer sticky top-0 z-[1]"
              >
                <span className="text-xs text-slate-400 transition-transform duration-150" style={{ transform: istZu ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {klasse}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {aktive}/{schueler.length}
                </span>
              </button>

              {/* SuS-Einträge */}
              {!istZu && (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {schueler.map((t) => (
                    <label
                      key={t.email}
                      className="flex items-center gap-3 px-3 py-1.5 pl-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!abgewaehlte.has(t.email)}
                        onChange={() => onToggle(t.email)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                        {t.name}, {t.vorname}
                      </span>
                      {t.einladungGesendet && (
                        <span title="Einladung gesendet" className="text-xs">✉️</span>
                      )}
                      {t.quelle === 'manuell' && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">manuell</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Manuell hinzufügen */}
      <div className="flex gap-2">
        <input
          type="email"
          value={manuelleEmail}
          onChange={(e) => setManuelleEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleHinzufuegen()}
          placeholder="E-Mail manuell hinzufügen..."
          className="flex-1 text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
        <button
          type="button"
          onClick={handleHinzufuegen}
          disabled={!manuelleEmail.trim() || !manuelleEmail.includes('@')}
          className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
        >
          + Hinzufügen
        </button>
      </div>
    </div>
  )
}
