import { useEffect, useRef } from 'react'

interface DoppelteLabelEintrag {
  label: string
  zonenIndices: number[]
}

interface Props {
  open: boolean
  doppelteLabels: DoppelteLabelEintrag[]
  onSpeichern: () => void
  onAbbrechen: () => void
}

export default function DoppelteLabelDialog({ open, doppelteLabels, onSpeichern, onAbbrechen }: Props) {
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
      aria-labelledby="doppellabel-dialog-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl text-slate-800 dark:text-slate-100">
        <h2 id="doppellabel-dialog-title" className="text-lg font-semibold mb-3">
          Doppelte Zonen-Labels gefunden
        </h2>
        <p className="text-sm mb-3 text-slate-600 dark:text-slate-300">
          Im Übungs-Modus wird eine dieser Zonen falsch ausgewertet — der Korrektur-Algorithmus erkennt nur eine
          Zone pro Label-String. Die Multi-Zone-Akzeptanz folgt in einem späteren Bundle.
        </p>
        <ul className="list-disc pl-5 mb-4 text-sm">
          {doppelteLabels.map((d) => (
            <li key={d.label}>
              {`« ${d.label} »: Zone(n) #${d.zonenIndices.join(', #')}`}
            </li>
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
