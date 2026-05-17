// ExamLab/src/components/lp/fragensammlung/fragenbrowser/LoeschBestaetigungsDialog.tsx
import { typLabel } from '../../../../utils/fachUtils.ts'
import { TYPO } from '../../../../styles/typografie'

interface LoeschKandidat {
  id: string
  fachbereich: string
  typ: string
  fragetext?: string
}

interface Props {
  kandidat: LoeschKandidat | null
  onAbbrechen: () => void
  onBestaetigen: () => void | Promise<void>
}

export default function LoeschBestaetigungsDialog({ kandidat, onAbbrechen, onBestaetigen }: Props) {
  if (!kandidat) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 pointer-events-auto" onClick={onAbbrechen}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className={`${TYPO.h2} mb-2 text-slate-800 dark:text-slate-100`}>Frage löschen?</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          <strong>{kandidat.id}</strong> · {kandidat.fachbereich} · {typLabel(kandidat.typ)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {kandidat.fragetext?.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120) || ''}
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mb-4">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onAbbrechen}
            className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            onClick={() => void onBestaetigen()}
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            Endgültig löschen
          </button>
        </div>
      </div>
    </div>
  )
}
