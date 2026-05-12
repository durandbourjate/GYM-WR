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
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-6">
          Alle Testdaten werden gelöscht und neu erzeugt. Eigene Änderungen am Testkurs
          (zusätzliche Prüfungen, Antworten, …) gehen dauerhaft verloren. Echtdaten sind
          nicht betroffen.
        </p>
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
            className="px-3 py-1.5 rounded text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            disabled={loading}
            onClick={onBestaetigen}
          >
            Endgültig zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}
