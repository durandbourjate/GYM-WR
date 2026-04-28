import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onUebernehmen: (zeilen: string[], modus: 'append' | 'replace') => void
}

export default function BulkPasteModal({ open, onClose, onUebernehmen }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')
  const [modus, setModus] = useState<'append' | 'replace'>('append')

  useEffect(() => {
    if (!open) return
    setText('')
    setModus('append')
    textareaRef.current?.focus()
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  function handleUebernehmen(): void {
    const zeilen = text.split('\n').map((z) => z.trim()).filter(Boolean)
    onUebernehmen(zeilen, modus)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-paste-modal-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-slate-800 dark:text-slate-100">
        <h2 id="bulk-paste-modal-title" className="text-lg font-semibold mb-3">
          Mehrere Einträge einfügen
        </h2>
        <p className="text-sm mb-2 text-slate-600 dark:text-slate-300">
          Eine Zeile pro Eintrag. Leere Zeilen werden ignoriert.
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none mb-3"
          placeholder={'Eintrag 1\nEintrag 2\nEintrag 3\n...'}
        />
        <div className="mb-4 space-y-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="bulk-paste-modus"
              value="append"
              checked={modus === 'append'}
              onChange={() => setModus('append')}
              className="border-slate-300 dark:border-slate-600"
            />
            <span>Anhängen</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="bulk-paste-modus"
              value="replace"
              checked={modus === 'replace'}
              onChange={() => setModus('replace')}
              className="border-slate-300 dark:border-slate-600"
            />
            <span>Ersetzen</span>
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleUebernehmen}
            className="px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer"
          >
            Übernehmen
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
