import { usePruefungStore } from '../store/pruefungStore'

export interface PruefungsRecoveryStatusProps {
  status: 'loading' | 'failed'
}

/**
 * Render-Sub-Komponente für die Recovery-Loading/Failed-Branches in Layout.tsx.
 * Beim Failed-Branch: User kann via Bestätigungs-Dialog zum Start zurück
 * (löscht Fortschritt, lädt Seite neu).
 */
export default function PruefungsRecoveryStatus({ status }: PruefungsRecoveryStatusProps) {
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Sitzung wird wiederhergestellt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-2">Prüfungsdaten konnten nicht wiederhergestellt werden.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Ihre bisherigen Antworten gehen beim Zurücksetzen verloren.</p>
        <button
          onClick={() => {
            if (window.confirm('Alle bisherigen Antworten gehen verloren. Fortfahren?')) {
              usePruefungStore.getState().reset()
              window.location.reload()
            }
          }}
          className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Zurück zum Start
        </button>
      </div>
    </div>
  )
}
