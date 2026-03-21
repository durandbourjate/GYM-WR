import { useState } from 'react'
import type { Teilnehmer } from '../../types/pruefung'

interface Props {
  teilnehmer: Teilnehmer[]
  onToggle: (email: string) => void
  onManuellHinzufuegen: (email: string) => void
  abgewaehlte: Set<string>
}

export default function TeilnehmerListe({ teilnehmer, onToggle, onManuellHinzufuegen, abgewaehlte }: Props) {
  const [manuelleEmail, setManuelleEmail] = useState('')

  const handleHinzufuegen = () => {
    const email = manuelleEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    onManuellHinzufuegen(email)
    setManuelleEmail('')
  }

  return (
    <div className="space-y-3">
      {/* Zähler */}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Ausgewählt: <strong>{teilnehmer.filter((t) => !abgewaehlte.has(t.email)).length}</strong> von {teilnehmer.length} SuS
      </p>

      {/* Liste */}
      <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
        {teilnehmer.map((t) => (
          <label
            key={t.email}
            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
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
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.klasse}</span>
            {t.einladungGesendet && (
              <span title="Einladung gesendet" className="text-xs">✉️</span>
            )}
            {t.quelle === 'manuell' && (
              <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">manuell</span>
            )}
          </label>
        ))}
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
