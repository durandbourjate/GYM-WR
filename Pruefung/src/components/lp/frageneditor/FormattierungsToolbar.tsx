import type { RefObject } from 'react'

interface FormattierungsToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (v: string) => void
}

/** Minimale Markdown-Formatierungsleiste für Textareas */
export default function FormattierungsToolbar({ textareaRef, value, onChange }: FormattierungsToolbarProps) {

  function wrapSelection(vorher: string, nachher: string): void {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end)

    let neuerText: string
    let cursorPos: number

    if (selected) {
      // Text markiert → umschliessen
      neuerText = value.substring(0, start) + vorher + selected + nachher + value.substring(end)
      cursorPos = start + vorher.length + selected.length + nachher.length
    } else {
      // Nichts markiert → Marker einfügen, Cursor dazwischen
      neuerText = value.substring(0, start) + vorher + nachher + value.substring(end)
      cursorPos = start + vorher.length
    }

    onChange(neuerText)
    // Cursor nach State-Update setzen
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(cursorPos, cursorPos)
    })
  }

  function insertPrefix(prefix: string): void {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end)

    let neuerText: string
    let cursorPos: number

    if (selected) {
      // Jede Zeile mit Prefix versehen
      const zeilen = selected.split('\n').map((z) => prefix + z).join('\n')
      neuerText = value.substring(0, start) + zeilen + value.substring(end)
      cursorPos = start + zeilen.length
    } else {
      neuerText = value.substring(0, start) + prefix + value.substring(end)
      cursorPos = start + prefix.length
    }

    onChange(neuerText)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(cursorPos, cursorPos)
    })
  }

  const btnClass = 'px-1.5 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer'

  return (
    <div className="flex gap-1 mb-1">
      <button
        type="button"
        onClick={() => wrapSelection('**', '**')}
        className={btnClass}
        title="Fett (Markdown: **text**)"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => wrapSelection('*', '*')}
        className={btnClass}
        title="Kursiv (Markdown: *text*)"
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        onClick={() => insertPrefix('- ')}
        className={btnClass}
        title="Liste (Markdown: - Element)"
      >
        Liste
      </button>
      <button
        type="button"
        onClick={() => wrapSelection('`', '`')}
        className={btnClass}
        title="Code (Markdown: `code`)"
      >
        Code
      </button>
    </div>
  )
}
