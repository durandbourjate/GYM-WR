import { AlertTriangle, Check, Info, X, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { useToastStore, type ToastVariant } from '@gymhofwil/shared'

const VARIANT_STYLES: Record<ToastVariant, string> = {
  error:   'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
  success: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  info:    'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
}

const VARIANT_ICONS: Record<ToastVariant, ComponentType<LucideProps>> = {
  error:   AlertTriangle,
  success: Check,
  info:    Info,
  warning: AlertTriangle,
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 max-w-md pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto px-4 py-3 rounded-md shadow-lg border flex items-start gap-2 ${VARIANT_STYLES[t.variant]}`}
        >
          {(() => { const Icon = VARIANT_ICONS[t.variant]; return <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> })()}
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Toast schliessen"
            className="ml-2 opacity-70 hover:opacity-100 inline-flex items-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
