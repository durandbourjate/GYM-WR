import { useState } from 'react'
import FeedbackModal, { type FeedbackContext } from './FeedbackModal'
import Tooltip from '../ui/Tooltip'

interface Props {
  context: FeedbackContext
  variant: 'icon' | 'text' | 'link'
  label?: string
}

export default function FeedbackButton({ context, variant, label }: Props) {
  const [open, setOpen] = useState(false)

  const defaultLabel = label || 'Rückmeldung'

  return (
    <>
      {variant === 'icon' && (
        <Tooltip text="Rückmeldung geben">
          <button
            onClick={() => setOpen(true)}
            className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            💬
          </button>
        </Tooltip>
      )}

      {variant === 'text' && (
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          💬 {defaultLabel}
        </button>
      )}

      {variant === 'link' && (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          ⚠️ {defaultLabel}
        </button>
      )}

      <FeedbackModal
        isOpen={open}
        onClose={() => setOpen(false)}
        context={context}
      />
    </>
  )
}
