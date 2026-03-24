import { useState, useRef, useEffect } from 'react'

interface Props {
  position: { x: number; y: number }
  initialText?: string
  onSave: (text: string) => void
  onCancel: () => void
}

export function PDFKommentarPopover({ position, initialText, onSave, onCancel }: Props) {
  const [text, setText] = useState(initialText ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  return (
    <div className="absolute z-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-2 w-56"
      style={{ left: position.x, top: position.y }}>
      <textarea ref={ref} value={text} onChange={e => setText(e.target.value)}
        className="w-full h-20 text-sm border border-slate-200 dark:border-slate-600 rounded p-1 resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        placeholder="Kommentar..." />
      <div className="flex justify-end gap-1 mt-1">
        <button onClick={onCancel} className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Abbrechen</button>
        <button onClick={() => text.trim() && onSave(text.trim())}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" disabled={!text.trim()}>
          Speichern
        </button>
      </div>
    </div>
  )
}
