import type { SpeicherStatus } from '../../../hooks/useSpeicherStatus'

interface Props {
  status: SpeicherStatus
  /** Label im Idle-Zustand (z.B. "Profil speichern") */
  idleLabel: string
  /** Click-Handler — sollte `speichern(...)` aus useSpeicherStatus aufrufen */
  onClick: () => void
}

/**
 * Speicher-Button mit 3 sichtbaren Zuständen (idle / laeuft / gespeichert).
 * 'fehler'-Status wird vom Caller separat gerendert (Caller hat die
 * detaillierte Fehler-Message-Quelle, z.B. Store-Fehler).
 */
export default function SpeicherButton({ status, idleLabel, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={status === 'laeuft'}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
        status === 'laeuft'
          ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-wait'
          : status === 'gespeichert'
          ? 'bg-green-600 text-white'
          : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100'
      }`}
    >
      {status === 'laeuft' ? 'Speichern...' : status === 'gespeichert' ? '✓ Gespeichert' : idleLabel}
    </button>
  )
}
