import { Check } from 'lucide-react'
import type { Frage, FrageSummary } from '../../../../types/fragen-storage'

/** Pool-Badges: Zeigt Quelle und Status von Pool-Fragen */
export default function PoolBadges({ frage }: { frage: Frage | FrageSummary }) {
  if (frage.quelle !== 'pool') return null
  return (
    <span className="inline-flex gap-1">
      {frage.poolUpdateVerfuegbar && (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse">
          Update
        </span>
      )}
      {frage.pruefungstauglich ? (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          Prüfungstauglich
        </span>
      ) : frage.poolGeprueft ? (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 inline-flex items-center gap-1">
          Pool <Check className="w-2.5 h-2.5" aria-hidden="true" />
        </span>
      ) : (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
          Pool / ungeprüft
        </span>
      )}
    </span>
  )
}
