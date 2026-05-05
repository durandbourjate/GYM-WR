import type { JSX } from 'react'

export type SaveStatus = 'sauber' | 'sync-läuft' | 'entwurf' | 'verbindungsproblem' | 'server-down'

interface Props {
  status: SaveStatus
  fehlendePflichtfelder?: string[]
  onErneutVersuchen?: () => void
}

const STATUS_CONFIG: Record<SaveStatus, { text: string; classes: string }> = {
  'sauber': {
    text: '✓ Gespeichert',
    classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  'sync-läuft': {
    text: 'Speichert…',
    classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  'entwurf': {
    text: 'Entwurf',
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  },
  'verbindungsproblem': {
    text: 'Verbindungsproblem — wird wiederholt',
    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  },
  'server-down': {
    text: 'Server nicht erreichbar',
    classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  },
}

export default function SaveStatusIndikator({
  status,
  fehlendePflichtfelder,
  onErneutVersuchen,
}: Props): JSX.Element {
  const cfg = STATUS_CONFIG[status]
  const zeigePflichtListe = status === 'entwurf' && (fehlendePflichtfelder?.length ?? 0) > 0
  const zeigeRetry = status === 'server-down' && !!onErneutVersuchen

  return (
    <div role="status" aria-live="polite" className="inline-flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.classes}`}
        >
          {cfg.text}
        </span>
        {zeigeRetry && (
          <button
            type="button"
            onClick={onErneutVersuchen}
            className="text-xs underline text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
          >
            Erneut versuchen
          </button>
        )}
      </div>
      {zeigePflichtListe && (
        <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5 ml-2">
          {fehlendePflichtfelder!.map((feld) => (
            <li key={feld}>{feld}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
