import { useState, useMemo } from 'react'
import type { Teilnehmer } from '../../../types/pruefung'

/** Alle geladenen SuS (für Suche über alle Kurse) */
export interface AlleSuS {
  email: string
  name: string
  vorname: string
  klasse: string
}

interface Props {
  teilnehmer: Teilnehmer[]
  onToggle: (email: string) => void
  onManuellHinzufuegen: (email: string) => void
  onSuSHinzufuegen?: (sus: AlleSuS) => void
  abgewaehlte: Set<string>
  alleSuS?: AlleSuS[]
  /** Zeitzuschläge (Email → Minuten) */
  zeitverlaengerungen?: Record<string, number>
  /** Callback bei Zeitzuschlag-Änderung */
  onZeitzuschlagChange?: (email: string, minuten: number | null) => void
}

export default function TeilnehmerListe({ teilnehmer, onToggle, onManuellHinzufuegen, onSuSHinzufuegen, abgewaehlte, alleSuS = [], zeitverlaengerungen = {}, onZeitzuschlagChange }: Props) {
  const [manuelleEmail, setManuelleEmail] = useState('')
  const [zugeklappt, setZugeklappt] = useState<Set<string>>(new Set())
  const [suchText, setSuchText] = useState('')

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

  // Suchfilter: Teilnehmer-Liste filtern
  const suchLower = suchText.trim().toLowerCase()
  const gefilterteGruppen = suchLower
    ? gruppen.map((g) => ({
        ...g,
        schueler: g.schueler.filter((t) =>
          `${t.name} ${t.vorname} ${t.email} ${t.klasse}`.toLowerCase().includes(suchLower)),
      })).filter((g) => g.schueler.length > 0)
    : gruppen

  // SuS aus anderen Kursen die noch nicht Teilnehmer sind (für Suche)
  const teilnehmerEmails = useMemo(() => new Set(teilnehmer.map((t) => t.email)), [teilnehmer])
  const suchVorschlaege = useMemo(() => {
    if (!suchLower || alleSuS.length === 0) return []
    return alleSuS
      .filter((s) => !teilnehmerEmails.has(s.email) && `${s.name} ${s.vorname} ${s.email} ${s.klasse}`.toLowerCase().includes(suchLower))
      .slice(0, 10)
  }, [suchLower, alleSuS, teilnehmerEmails])

  return (
    <div className="space-y-3">
      {/* Zähler + Alle/Keine + Suchfeld */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ausgewählt: <strong>{teilnehmer.filter((t) => !abgewaehlte.has(t.email)).length}</strong> von {teilnehmer.length} SuS
        </p>
        {teilnehmer.length > 0 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => { for (const t of teilnehmer) { if (abgewaehlte.has(t.email)) onToggle(t.email) } }}
              className="text-xs px-2 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer"
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => { for (const t of teilnehmer) { if (!abgewaehlte.has(t.email)) onToggle(t.email) } }}
              className="text-xs px-2 py-0.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
            >
              Keine
            </button>
          </div>
        )}
        <input
          type="text"
          value={suchText}
          onChange={(e) => setSuchText(e.target.value)}
          placeholder="🔍 Suchen..."
          className="flex-1 text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Suchergebnisse: SuS die noch nicht Teilnehmer sind */}
      {suchVorschlaege.length > 0 && onSuSHinzufuegen && (
        <div className="border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
          <div className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700">
            Weitere SuS hinzufügen:
          </div>
          {suchVorschlaege.map((s) => (
            <button
              key={s.email}
              type="button"
              onClick={() => { onSuSHinzufuegen(s); setSuchText('') }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer"
            >
              <span className="text-blue-500">+</span>
              <span>{s.name}, {s.vorname}</span>
              <span className="text-xs text-slate-400 ml-auto">{s.klasse}</span>
            </button>
          ))}
        </div>
      )}

      {/* Gruppierte Liste */}
      <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        {gefilterteGruppen.map(({ klasse, schueler }) => {
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
                <span className="text-[10px] text-slate-400 dark:text-slate-500 transition-transform duration-150" style={{ transform: istZu ? 'rotate(0deg)' : 'rotate(90deg)', display: 'inline-block' }}>
                  ▶
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
                      className={`flex items-center gap-3 px-3 py-2 pl-6 cursor-pointer transition-colors ${
                        abgewaehlte.has(t.email)
                          ? 'bg-slate-100/50 dark:bg-slate-800/30 opacity-60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!abgewaehlte.has(t.email)}
                        onChange={() => onToggle(t.email)}
                        className="w-4 h-4 shrink-0 accent-green-600 cursor-pointer"
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
                      {/* Zeitzuschlag inline — editierbares Feld */}
                      {onZeitzuschlagChange && !abgewaehlte.has(t.email) && (
                        <div className="flex items-center gap-1 ml-auto shrink-0" onClick={(e) => e.preventDefault()}>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">+</span>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            step={5}
                            value={zeitverlaengerungen[t.email] ?? ''}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value)
                              onZeitzuschlagChange(t.email, val && val > 0 ? val : null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-12 px-1 py-0.5 text-xs text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 tabular-nums"
                            title="Zusatzzeit in Minuten (leer = keine)"
                          />
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Min.</span>
                        </div>
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
