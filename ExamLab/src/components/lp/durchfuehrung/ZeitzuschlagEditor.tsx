import { useState } from 'react'
import type { Teilnehmer } from '../../../types/pruefung'

interface Props {
  /** Aktuell gesetzte Zeitverlängerungen (E-Mail → Zusatzminuten) */
  zeitverlaengerungen: Record<string, number>
  /** Teilnehmer-Liste (für Dropdown statt freier E-Mail-Eingabe) */
  teilnehmer?: Teilnehmer[]
  /** Callback wenn sich die Zeitverlängerungen ändern */
  onChange: (zeitverlaengerungen: Record<string, number>) => void
  /** Kompakter Modus für Live-Phase (kein Info-Text, kleinere Abstände) */
  kompakt?: boolean
}

export default function ZeitzuschlagEditor({ zeitverlaengerungen, teilnehmer, onChange, kompakt }: Props) {
  const [ausgewaehlteSuS, setAusgewaehlteSuS] = useState('')
  const [neueMinuten, setNeueMinuten] = useState(15)

  const eintraege = Object.entries(zeitverlaengerungen).sort(([a], [b]) => a.localeCompare(b))

  // SuS die noch keinen Zuschlag haben (für Dropdown)
  const verfuegbareSuS = (teilnehmer ?? []).filter(
    (t) => !(t.email in zeitverlaengerungen)
  )

  function hinzufuegen() {
    if (!ausgewaehlteSuS) return
    onChange({ ...zeitverlaengerungen, [ausgewaehlteSuS]: neueMinuten })
    setAusgewaehlteSuS('')
    setNeueMinuten(15)
  }

  function entfernen(email: string) {
    const kopie = { ...zeitverlaengerungen }
    delete kopie[email]
    onChange(kopie)
  }

  function minutenAendern(email: string, minuten: number) {
    if (minuten < 1 || minuten > 120) return
    onChange({ ...zeitverlaengerungen, [email]: minuten })
  }

  // Name für E-Mail finden (aus Teilnehmer-Liste)
  function nameZuEmail(email: string): string {
    const t = teilnehmer?.find((s) => s.email === email)
    if (t) return `${t.vorname} ${t.name}`.trim() || email
    return email
  }

  return (
    <div className={kompakt ? 'space-y-2' : 'space-y-4'}>
      {!kompakt && (
        <>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Zeitzuschläge (Nachteilsausgleich)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Individuelle Zeitverlängerungen für SuS mit Nachteilsausgleich.
            Die zusätzlichen Minuten werden zur regulären Prüfungsdauer addiert.
          </p>
        </>
      )}

      {/* Bestehende Einträge */}
      {eintraege.length > 0 && (
        <div className="space-y-1.5">
          {eintraege.map(([email, minuten]) => (
            <div
              key={email}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm"
            >
              <span className="flex-1 text-slate-700 dark:text-slate-200 truncate" title={email}>
                {nameZuEmail(email)}
              </span>
              <input
                type="number"
                value={minuten}
                onChange={(e) => minutenAendern(email, parseInt(e.target.value) || 0)}
                min={1}
                max={120}
                className="w-16 px-2 py-0.5 text-xs text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">Min.</span>
              <button
                type="button"
                onClick={() => entfernen(email)}
                className="w-6 h-6 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer transition-colors flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Neuen Eintrag hinzufügen */}
      {verfuegbareSuS.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            {!kompakt && <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">SuS</label>}
            <select
              value={ausgewaehlteSuS}
              onChange={(e) => setAusgewaehlteSuS(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">SuS auswählen…</option>
              {verfuegbareSuS.map((s) => (
                <option key={s.email} value={s.email}>
                  {s.vorname} {s.name} ({s.klasse})
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            {!kompakt && <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Minuten</label>}
            <input
              type="number"
              value={neueMinuten}
              onChange={(e) => setNeueMinuten(parseInt(e.target.value) || 0)}
              min={1}
              max={120}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-center"
            />
          </div>
          <button
            type="button"
            onClick={hinzufuegen}
            disabled={!ausgewaehlteSuS}
            className="px-3 py-1.5 text-sm font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            +
          </button>
        </div>
      )}

      {/* Hinweis wenn alle SuS einen Zuschlag haben */}
      {verfuegbareSuS.length === 0 && eintraege.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Alle Teilnehmenden haben einen Zeitzuschlag.
        </p>
      )}

      {/* Hinweis wenn keine Teilnehmer */}
      {(!teilnehmer || teilnehmer.length === 0) && eintraege.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Erst Teilnehmende auswählen, dann Zeitzuschläge vergeben.
        </p>
      )}
    </div>
  )
}
