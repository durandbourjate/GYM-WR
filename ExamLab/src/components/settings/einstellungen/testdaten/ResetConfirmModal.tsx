import { Loader2 } from 'lucide-react'

interface Props {
  offen: boolean
  loading?: boolean
  onAbbrechen: () => void
  onBestaetigen: () => void
}

export default function ResetConfirmModal({ offen, loading = false, onAbbrechen, onBestaetigen }: Props) {
  if (!offen) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Testdaten zurücksetzen?
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
          Alle Testdaten werden gelöscht und neu erzeugt. Eigene Änderungen am Testkurs
          (zusätzliche Prüfungen, Antworten, …) gehen dauerhaft verloren. Echtdaten sind
          nicht betroffen.
        </p>
        {loading && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 inline-flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            Reset läuft auf dem Backend (kann bis ~60s dauern) — Modal schliesst nach Erfolg automatisch.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
            disabled={loading}
            onClick={onAbbrechen}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-1.5"
            disabled={loading}
            onClick={onBestaetigen}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            {loading ? 'Wird zurückgesetzt…' : 'Endgültig zurücksetzen'}
          </button>
        </div>
      </div>
    </div>
  )
}
