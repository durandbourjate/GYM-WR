import { useState } from 'react'
import type { Berechtigung, RechteStufe } from '../../types/auth.ts'
import type { LPInfo } from '../../services/lpApi.ts'

interface Props {
  berechtigungen: Berechtigung[]
  onChange: (b: Berechtigung[]) => void
  lpListe: LPInfo[]
  eigeneFachschaft?: string
  readOnly?: boolean
}

/** Leitet geteilt-Stufe aus berechtigungen ab */
function abgeleiteteGeteiltStufe(berechtigungen: Berechtigung[]): 'privat' | 'fachschaft' | 'schule' {
  if (berechtigungen.some(b => b.email === '*')) return 'schule'
  if (berechtigungen.some(b => b.email.startsWith('fachschaft:'))) return 'fachschaft'
  return 'privat'
}

/**
 * Wiederverwendbare Sharing-Komponente (Google-Docs-Modell).
 * Verwendet für Fragen und Prüfungen.
 */
export default function BerechtigungenEditor({ berechtigungen, onChange, lpListe, eigeneFachschaft, readOnly }: Props) {
  const [neueEmail, setNeueEmail] = useState('')
  const geteiltStufe = abgeleiteteGeteiltStufe(berechtigungen)

  // Individuelle Berechtigungen (ohne Spezialwerte)
  const individuelle = berechtigungen.filter(b => b.email !== '*' && !b.email.startsWith('fachschaft:'))

  function setzeSchnellStufe(stufe: 'privat' | 'fachschaft' | 'schule') {
    // Individuelle Berechtigungen beibehalten
    let neueB = individuelle.slice()
    if (stufe === 'schule') {
      neueB = [{ email: '*', recht: 'betrachter' as RechteStufe }, ...individuelle]
    } else if (stufe === 'fachschaft' && eigeneFachschaft) {
      neueB = [{ email: `fachschaft:${eigeneFachschaft}`, recht: 'betrachter' as RechteStufe }, ...individuelle]
    }
    onChange(neueB)
  }

  function aendereRecht(email: string, recht: RechteStufe) {
    onChange(berechtigungen.map(b => b.email === email ? { ...b, recht } : b))
  }

  function entferne(email: string) {
    onChange(berechtigungen.filter(b => b.email !== email))
  }

  function fuegeHinzu() {
    const email = neueEmail.trim().toLowerCase()
    if (!email || berechtigungen.some(b => b.email === email)) return
    const lp = lpListe.find(l => l.email === email)
    onChange([...berechtigungen, { email, recht: 'betrachter', name: lp?.name }])
    setNeueEmail('')
  }

  if (readOnly) {
    return (
      <div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {geteiltStufe === 'schule' ? 'Schulweit geteilt' : geteiltStufe === 'fachschaft' ? 'In Fachschaft geteilt' : 'Privat'}
          {individuelle.length > 0 && ` + ${individuelle.length} LP`}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Schnell-Toggle */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Sichtbarkeit</label>
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
          {(['privat', 'fachschaft', 'schule'] as const).map((stufe, i) => (
            <button
              key={stufe}
              onClick={() => setzeSchnellStufe(stufe)}
              className={`flex-1 px-3 py-1 text-xs transition-colors cursor-pointer ${i > 0 ? 'border-l border-slate-300 dark:border-slate-600' : ''} ${
                geteiltStufe === stufe
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {stufe === 'privat' ? 'Privat' : stufe === 'fachschaft' ? 'Fachschaft' : 'Schule'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {geteiltStufe === 'schule' ? 'Sichtbar für alle Lehrpersonen'
            : geteiltStufe === 'fachschaft' ? 'Sichtbar für LP der gleichen Fachschaft'
            : individuelle.length > 0 ? 'Geteilt mit einzelnen LP' : 'Nur für Sie sichtbar'}
        </p>
      </div>

      {/* Individuelle Berechtigungen */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Geteilt mit</label>
        {individuelle.length > 0 && (
          <div className="space-y-1 mb-2">
            {individuelle.map(b => {
              const lp = lpListe.find(l => l.email === b.email)
              return (
                <div key={b.email} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-slate-700 dark:text-slate-200 truncate">
                    {lp ? `${lp.name} (${lp.kuerzel})` : b.email}
                  </span>
                  <select
                    value={b.recht}
                    onChange={e => aendereRecht(b.email, e.target.value as RechteStufe)}
                    className="text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-0.5 text-slate-700 dark:text-slate-200"
                  >
                    <option value="betrachter">Betrachter</option>
                    <option value="bearbeiter">Bearbeiter</option>
                  </select>
                  <button onClick={() => entferne(b.email)} className="text-slate-400 hover:text-red-500 text-xs cursor-pointer">×</button>
                </div>
              )
            })}
          </div>
        )}

        {/* LP hinzufügen */}
        <div className="flex items-center gap-1">
          <select
            value={neueEmail}
            onChange={e => setNeueEmail(e.target.value)}
            className="flex-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-slate-700 dark:text-slate-200"
          >
            <option value="">+ LP hinzufügen...</option>
            {lpListe
              .filter(lp => !berechtigungen.some(b => b.email === lp.email))
              .map(lp => (
                <option key={lp.email} value={lp.email}>{lp.name} ({lp.kuerzel})</option>
              ))
            }
          </select>
          {neueEmail && (
            <button
              onClick={fuegeHinzu}
              className="text-xs px-2 py-1 rounded bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 cursor-pointer"
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
