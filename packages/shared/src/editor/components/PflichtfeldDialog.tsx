import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  pflichtLeerFelder: string[]
  onSpeichern: () => void
  onAbbrechen: () => void
}

export default function PflichtfeldDialog({ open, pflichtLeerFelder, onSpeichern, onAbbrechen }: Props) {
  const abbrechenRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    abbrechenRef.current?.focus()
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAbbrechen()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onAbbrechen])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onAbbrechen()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pflichtfeld-dialog-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-slate-800 dark:text-slate-100">
        <h2 id="pflichtfeld-dialog-title" className="text-lg font-semibold mb-3">
          {pflichtLeerFelder.length} Pflichtfelder leer
        </h2>
        <p className="text-sm mb-2 text-slate-600 dark:text-slate-300">
          Diese Frage wird als nicht prüfungstauglich gespeichert:
        </p>
        <ul className="list-disc pl-5 mb-4 text-sm">
          {pflichtLeerFelder.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onSpeichern}
            className="px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer"
          >
            Speichern (nicht prüfungstauglich)
          </button>
          <button
            type="button"
            ref={abbrechenRef}
            onClick={onAbbrechen}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
