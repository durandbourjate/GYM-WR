type Props = {
  variant: 'korrekt' | 'falsch' | 'neutral'
  susAntwort?: string
  korrekteAntwort?: string
  placeholder?: string
}

export function ZoneLabel({ variant, susAntwort, korrekteAntwort, placeholder }: Props) {
  if (variant === 'korrekt') {
    return (
      <div className="inline-flex px-2 py-0.5 rounded border border-green-600 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-semibold leading-tight">
        {susAntwort}
      </div>
    )
  }
  if (variant === 'falsch') {
    return (
      <div className="inline-flex flex-col items-start px-2 py-1 rounded border border-red-600 bg-white dark:bg-slate-800 gap-0.5 leading-tight">
        <span className="text-green-700 dark:text-green-400 font-bold text-xs">
          {korrekteAntwort}
        </span>
        <span className="text-red-700 dark:text-red-400 text-sm">
          {susAntwort || <em className="text-slate-500 italic">{placeholder ?? 'leer gelassen'}</em>}
        </span>
      </div>
    )
  }
  return (
    <div className="inline-flex px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-xs">
      {susAntwort}
    </div>
  )
}
