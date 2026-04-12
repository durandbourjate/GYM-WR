import { useRef, useEffect, useId, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'

interface BaseDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  footer?: ReactNode
}

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
} as const

export default function BaseDialog({ open, onClose, title, maxWidth = 'md', children, footer }: BaseDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const contentId = useId()
  useFocusTrap(dialogRef)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      data-testid="dialog-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={contentId}
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full ${MAX_WIDTH_CLASSES[maxWidth]}`}
      >
        {title && (
          <h2 id={titleId} className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {title}
          </h2>
        )}
        <div id={contentId}>{children}</div>
        {footer && <div className="mt-6 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  )
}
