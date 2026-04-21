import type { AktionErgebnis } from '../useKIAssistent'

/** Einzelner KI-Aktions-Button mit Lade-, Hinweis- und Tooltip-State */
export function InlineAktionButton({ label, tooltip, hinweis, disabled, ladend, onClick, kiAktiv = true }: {
  label: string
  /** Hilfetext bei Mouseover */
  tooltip?: string
  hinweis?: string
  disabled: boolean
  ladend: boolean
  onClick: () => void
  /** KI-Styling aktiv (blau) oder inaktiv (slate). Default: true */
  kiAktiv?: boolean
}) {
  const enabledClasses = kiAktiv
    ? 'border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-[#1e2a3f] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-[#253650]'
    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer inline-flex items-center gap-1.5
          ${disabled
            ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : enabledClasses
          }`}
      >
        {ladend ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Wird generiert...</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </button>
      {hinweis && !ladend && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{hinweis}</p>
      )}
    </div>
  )
}

/** Ergebnis-Anzeige mit Vorschau, Uebernehmen/Verwerfen-Buttons und optionalem Stern-Toggle */
export function ErgebnisAnzeige({ ergebnis, vorschauKey, zusatzKey, renderVorschau, onUebernehmen, onVerwerfen, wichtig, onWichtigToggle }: {
  ergebnis: AktionErgebnis
  vorschauKey: string
  zusatzKey?: string
  renderVorschau?: (daten: Record<string, unknown>) => React.ReactNode
  onUebernehmen: () => void
  onVerwerfen: () => void
  /** Ist dieses Ergebnis als wichtiges Trainings-Beispiel markiert? */
  wichtig?: boolean
  /** Wenn gesetzt: Stern-Toggle wird angezeigt */
  onWichtigToggle?: () => void
}) {
  if (ergebnis.fehler) {
    return (
      <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">{ergebnis.fehler}</p>
        <button onClick={onVerwerfen} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1 cursor-pointer">
          Schliessen
        </button>
      </div>
    )
  }

  if (!ergebnis.daten) return null

  return (
    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg space-y-2">
      {renderVorschau ? (
        renderVorschau(ergebnis.daten)
      ) : (
        <>
          {typeof ergebnis.daten[vorschauKey] === 'string' && (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {ergebnis.daten[vorschauKey] as string}
            </p>
          )}
          {typeof ergebnis.daten[vorschauKey] === 'boolean' && (
            <p className={`text-sm font-medium ${ergebnis.daten[vorschauKey] ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {ergebnis.daten[vorschauKey] ? 'Korrekt' : 'Verbesserung noetig'}
            </p>
          )}
        </>
      )}
      {zusatzKey && typeof ergebnis.daten[zusatzKey] === 'string' && ergebnis.daten[zusatzKey] && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          {ergebnis.daten[zusatzKey] as string}
        </p>
      )}
      <div className="flex gap-2 pt-1 items-center">
        <button
          onClick={onUebernehmen}
          title="Vorschlag in die Frage uebernehmen"
          className="px-3 py-1 text-xs font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Uebernehmen
        </button>
        <button
          onClick={onVerwerfen}
          title="Vorschlag verwerfen"
          className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          Verwerfen
        </button>
        {onWichtigToggle && (
          <button
            type="button"
            onClick={onWichtigToggle}
            className={wichtig
              ? 'text-amber-500 hover:text-amber-600 text-lg leading-none cursor-pointer'
              : 'text-slate-400 hover:text-amber-400 text-lg leading-none cursor-pointer'
            }
            title={wichtig
              ? 'Als wichtiges Trainings-Beispiel markiert (Klick = entfernen)'
              : 'Als wichtiges Trainings-Beispiel markieren — fliesst priorisiert in kuenftige KI-Vorschlaege'
            }
            aria-label={wichtig ? 'Stern entfernen' : 'Als wichtig markieren'}
          >
            {wichtig ? '★' : '☆'}
          </button>
        )}
      </div>
    </div>
  )
}
