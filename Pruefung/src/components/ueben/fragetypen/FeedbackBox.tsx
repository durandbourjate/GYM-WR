import { useMemo } from 'react'
import { zufaelligesLob, zufaelligerTrost } from '../../../utils/ueben/gamification'

interface Props {
  korrekt: boolean
  erklaerung?: string
}

export default function FeedbackBox({ korrekt, erklaerung }: Props) {
  const text = useMemo(() => korrekt ? zufaelligesLob() : zufaelligerTrost(), [korrekt])

  return (
    <div className={`p-4 rounded-xl mt-2 ${korrekt
      ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    }`}>
      <p className="font-medium text-base">{text}</p>
      {erklaerung && <p className="mt-1 text-sm opacity-80">{erklaerung}</p>}
    </div>
  )
}
