import { useUebenKontext } from '../../../hooks/ueben/useUebenKontext'
import { t } from '../../../utils/ueben/anrede'

interface Props {
  istUnsicher: boolean
  feedbackSichtbar: boolean
  onToggleUnsicher: () => void
  onBeenden: () => void
}

export default function QuizActions({ istUnsicher, onToggleUnsicher, onBeenden }: Props) {
  const { anrede } = useUebenKontext()

  return (
    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
      <button
        onClick={onBeenden}
        className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] px-2"
      >
        {t('beenden', anrede)}
      </button>

      <button
        onClick={onToggleUnsicher}
        className={`text-sm min-h-[44px] px-3 py-1.5 rounded-lg transition-colors ${
          istUnsicher
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
        }`}
      >
        {istUnsicher ? '\uD83D\uDD16 Markiert' : `\uD83D\uDD16 ${t('unsicher', anrede)}`}
      </button>
    </div>
  )
}
