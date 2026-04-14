import BaseDialog from '../../ui/BaseDialog'

interface Props {
  offen: boolean
  onSchliessen: () => void
  onSenden: () => void
  status: 'idle' | 'senden' | 'fertig'
  ergebnis: { erfolg: string[]; fehler: string[] } | null
  anzahlEmpfaenger: number
}

export default function FeedbackDialog({ offen, onSchliessen, onSenden, status, ergebnis, anzahlEmpfaenger }: Props) {
  return (
    <BaseDialog
      open={offen}
      onClose={onSchliessen}
      title={status === 'fertig' ? 'Versand abgeschlossen' : status === 'idle' ? 'Feedback versenden?' : undefined}
      maxWidth="sm"
    >
      {status === 'idle' && (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            PDFs werden generiert und an {anzahlEmpfaenger} SuS per E-Mail versendet.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onSchliessen}
              className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium text-sm"
            >
              Abbrechen
            </button>
            <button
              onClick={onSenden}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 rounded-lg transition-colors cursor-pointer font-medium text-sm"
            >
              Senden
            </button>
          </div>
        </>
      )}
      {status === 'senden' && (
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-3 border-4 border-slate-200 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-300">PDFs werden erstellt und versendet...</p>
        </div>
      )}
      {status === 'fertig' && ergebnis && (
        <>
          <p className="text-sm text-green-700 dark:text-green-400 mb-1">
            ✓ {ergebnis.erfolg.length} erfolgreich versendet
          </p>
          {ergebnis.fehler.length > 0 && (
            <p className="text-sm text-red-700 dark:text-red-400 mb-1">
              ✗ {ergebnis.fehler.length} fehlgeschlagen
            </p>
          )}
          <button
            onClick={onSchliessen}
            className="mt-4 w-full py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg cursor-pointer font-medium text-sm"
          >
            Schliessen
          </button>
        </>
      )}
    </BaseDialog>
  )
}
