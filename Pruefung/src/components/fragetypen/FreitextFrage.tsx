import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { FreitextFrage as FreitextFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachbereich.ts'

interface Props {
  frage: FreitextFrageType
}

/** Tiptap-Extension: --> automatisch zu → konvertieren */
const ArrowReplace = Extension.create({
  name: 'arrowReplace',
  addInputRules() {
    return [
      {
        // Matcht --> am Ende einer Eingabe
        find: /-->\s$/,
        handler: ({ state, range, chain }) => {
          const { tr } = state
          tr.insertText('\u2192 ', range.from, range.to)
          chain().run()
        },
      },
      {
        find: /<--\s$/,
        handler: ({ state, range, chain }) => {
          const { tr } = state
          tr.insertText('\u2190 ', range.from, range.to)
          chain().run()
        },
      },
      {
        find: /==>\s$/,
        handler: ({ state, range, chain }) => {
          const { tr } = state
          tr.insertText('\u21D2 ', range.from, range.to)
          chain().run()
        },
      },
    ]
  },
})

export default function FreitextFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  // Ref für aktuelle frage.id — verhindert stale closure im onUpdate-Callback
  const frageIdRef = useRef(frage.id)
  frageIdRef.current = frage.id

  const aktuelleAntwort = antworten[frage.id]
  const gespeicherterText =
    aktuelleAntwort?.typ === 'freitext' ? aktuelleAntwort.text : ''

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Antwort eingeben...',
      }),
      ArrowReplace,
    ],
    content: gespeicherterText,
    editable: !abgegeben,
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        const html = ed.getHTML()
        // frageIdRef statt frage.id aus Closure → immer aktuell
        setAntwort(frageIdRef.current, { typ: 'freitext', text: html, formatierung: 'html' })
      }, 300) // 300ms statt 500ms — kürzeres Fenster für Datenverlust
    },
  })

  // Sync editor content bei Fragewechsel + Cleanup für Debounce
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentContent = editor.getHTML()
      if (currentContent !== gespeicherterText && gespeicherterText) {
        editor.commands.setContent(gespeicherterText)
      } else if (!gespeicherterText && currentContent !== '<p></p>') {
        editor.commands.clearContent()
      }
    }
    // Cleanup: bei Fragewechsel oder Unmount pending Debounce sofort flushen
    return () => {
      if (debounceRef.current && editor && !editor.isDestroyed) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
        const html = editor.getHTML()
        setAntwort(frageIdRef.current, { typ: 'freitext', text: html, formatierung: 'html' })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — Nur bei Fragewechsel triggern
  }, [frage.id])

  // Auto-Focus: Cursor automatisch ins Textfeld
  useEffect(() => {
    if (editor && !editor.isDestroyed && !abgegeben) {
      // Kleiner Delay damit der DOM fertig gerendert ist
      const timer = setTimeout(() => editor.commands.focus('end'), 100)
      return () => clearTimeout(timer)
    }
  }, [frage.id, editor, abgegeben])

  // Wort- und Zeichenzähler
  const text = editor?.getText() ?? ''
  const zeichenAnzahl = text.length
  const wortAnzahl = text.trim() ? text.trim().split(/\s+/).length : 0
  const zeichenUeberschritten = frage.maxZeichen ? zeichenAnzahl > frage.maxZeichen : false

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.laenge === 'kurz' ? '1–3 Sätze' : frage.laenge === 'mittel' ? 'Absatz' : 'Ausführlich'}
        </span>
      </div>

      {/* Fragetext (sticky: bleibt beim Scrollen sichtbar) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-14 z-10"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Toolbar */}
      {editor && !abgegeben && (
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <ToolbarButton
            aktiv={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Überschrift"
          >
            Ü
          </ToolbarButton>
          <span className="w-px bg-slate-300 dark:bg-slate-600 mx-0.5" />
          <ToolbarButton
            aktiv={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Fett"
          >
            <strong>F</strong>
          </ToolbarButton>
          <ToolbarButton
            aktiv={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Kursiv"
          >
            <em>K</em>
          </ToolbarButton>
          <ToolbarButton
            aktiv={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Unterstrichen"
          >
            <u>U</u>
          </ToolbarButton>
          <span className="w-px bg-slate-300 dark:bg-slate-600 mx-0.5" />
          <ToolbarButton
            aktiv={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Aufzählung"
          >
            •
          </ToolbarButton>
          <ToolbarButton
            aktiv={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Nummerierte Liste"
          >
            1.
          </ToolbarButton>
        </div>
      )}

      {/* Editor — volle Breite, auto-grow */}
      <div className={`tiptap-editor w-full border-2 rounded-xl
        ${abgegeben
          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-75'
          : zeichenAnzahl > 0
            ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:border-slate-500 dark:focus-within:border-slate-400'
            : 'border-violet-400 dark:border-violet-500 bg-white dark:bg-slate-900'
        }`}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Zähler */}
      <div className="flex justify-end gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>{wortAnzahl} {wortAnzahl === 1 ? 'Wort' : 'Wörter'}</span>
        <span className={zeichenUeberschritten ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
          {zeichenAnzahl}{frage.maxZeichen ? ` / ${frage.maxZeichen}` : ''} Zeichen
        </span>
      </div>
    </div>
  )
}

function ToolbarButton({
  aktiv,
  onClick,
  title,
  children,
}: {
  aktiv: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors cursor-pointer
        ${aktiv
          ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      {children}
    </button>
  )
}
