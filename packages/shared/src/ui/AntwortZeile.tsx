import { type ReactNode } from 'react'

type AntwortZeileProps = {
  marker: 'ja' | 'nein' | 'leer'
  variant: 'korrekt' | 'falsch' | 'neutral'
  label: ReactNode
  erklaerung?: string
  zusatz?: ReactNode
}

const VARIANT_CLASSES: Record<AntwortZeileProps['variant'], string> = {
  korrekt: 'border-green-600 bg-green-50 dark:bg-green-950/20',
  falsch: 'border-red-600 bg-red-50 dark:bg-red-950/20',
  neutral: 'border-slate-200 dark:border-slate-700',
}

const MARKER_TEXT: Record<AntwortZeileProps['marker'], string> = {
  ja: '✓',
  nein: '✗',
  leer: '',
}

const MARKER_COLOR: Record<AntwortZeileProps['marker'], string> = {
  ja: 'text-green-600',
  nein: 'text-red-600',
  leer: '',
}

export function AntwortZeile({ marker, variant, label, erklaerung, zusatz }: AntwortZeileProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 my-1.5 ${VARIANT_CLASSES[variant]}`}
      data-testid="antwort-zeile"
    >
      <span
        className={`marker-${marker} ${MARKER_COLOR[marker]} font-bold w-5 text-center shrink-0`}
        aria-hidden={true}
      >
        {MARKER_TEXT[marker]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{label}</div>
        {zusatz && <div className="text-sm">{zusatz}</div>}
        {erklaerung && (
          <div className="mt-1.5 pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400">
            {'\u{1F4A1}'} {erklaerung}
          </div>
        )}
      </div>
    </div>
  )
}
