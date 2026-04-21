import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { FreitextFrage as FreitextFrageType } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { MusterloesungsBlock } from '@shared/ui/MusterloesungsBlock'

interface Props {
  frage: FreitextFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
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

export default function FreitextFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <FreitextLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <FreitextAufgabe frage={frage} />
}

function FreitextAufgabe({ frage }: { frage: FreitextFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const config = usePruefungStore((s) => s.config)
  const rechtschreibpruefungAktiv = config?.rechtschreibpruefung !== false
  const rechtschreibSprache = config?.rechtschreibSprache ?? 'de'
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  // Ref für aktuelle frage.id — verhindert stale closure im onUpdate-Callback
  const frageIdRef = useRef(frage.id)
  frageIdRef.current = frage.id

  const gespeicherterText =
    antwort?.typ === 'freitext' ? antwort.text : ''

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
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none',
        spellcheck: rechtschreibpruefungAktiv ? 'true' : 'false',
        lang: rechtschreibSprache,
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        const html = ed.getHTML()
        // frageIdRef statt frage.id aus Closure → immer aktuell
        onAntwort({ typ: 'freitext', text: html, formatierung: 'html' })
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
        onAntwort({ typ: 'freitext', text: html, formatierung: 'html' })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — Nur bei Fragewechsel triggern
  }, [frage.id])

  // Auto-Focus: Cursor automatisch ins Textfeld
  useEffect(() => {
    if (editor && !editor.isDestroyed && !disabled) {
      // Kleiner Delay damit der DOM fertig gerendert ist
      const timer = setTimeout(() => editor.commands.focus('end'), 100)
      return () => clearTimeout(timer)
    }
  }, [frage.id, editor, disabled])

  // Wort- und Zeichenzähler
  const text = editor?.getText() ?? ''
  const zeichenAnzahl = text.length
  const wortAnzahl = text.trim() ? text.trim().split(/\s+/).length : 0
  const zeichenUeberschritten = frage.maxZeichen ? zeichenAnzahl > frage.maxZeichen : false
  const woerterZuWenig = frage.minWoerter ? wortAnzahl < frage.minWoerter && wortAnzahl > 0 : false
  const woerterZuViele = frage.maxWoerter ? wortAnzahl > frage.maxWoerter : false

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
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Toolbar */}
      {editor && !disabled && (
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

      {/* Editor — volle Breite, auto-grow, min-height für leichtes Antippen auf iPad */}
      <div
        className={`tiptap-editor w-full border-2 rounded-xl min-h-[120px]
          ${disabled
            ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-75'
            : zeichenAnzahl > 0
              ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:border-slate-500 dark:focus-within:border-slate-400'
              : 'border-violet-400 dark:border-violet-500 bg-white dark:bg-slate-900'
          }`}
        spellCheck={rechtschreibpruefungAktiv}
        lang={rechtschreibSprache}
        onClick={() => {
          // iOS: programmatischer Focus funktioniert nicht ohne User-Geste.
          // Dieser onClick ist eine direkte User-Geste → iOS erlaubt Keyboard-Öffnung.
          if (editor && !editor.isDestroyed && !disabled && !editor.isFocused) {
            editor.commands.focus('end')
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}

      {/* Zähler */}
      <div className="flex flex-wrap justify-end gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className={
          woerterZuViele ? 'text-red-600 dark:text-red-400 font-semibold' :
          woerterZuWenig ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
        }>
          {wortAnzahl}
          {(frage.minWoerter || frage.maxWoerter) ? (
            frage.minWoerter && frage.maxWoerter
              ? ` / ${frage.minWoerter}–${frage.maxWoerter}`
              : frage.minWoerter
                ? ` / min. ${frage.minWoerter}`
                : ` / max. ${frage.maxWoerter}`
          ) : ''} {wortAnzahl === 1 ? 'Wort' : 'Wörter'}
          {woerterZuViele && <span className="ml-1">(zu viele)</span>}
          {woerterZuWenig && <span className="ml-1">(zu wenige)</span>}
        </span>
        <span className={zeichenUeberschritten ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
          {zeichenAnzahl}{frage.maxZeichen ? ` / ${frage.maxZeichen}` : ''} Zeichen
        </span>
      </div>
    </div>
  )
}

function FreitextLoesung({ frage, antwort }: { frage: FreitextFrageType; antwort: Antwort | null }) {
  const text = antwort?.typ === 'freitext' ? antwort.text : ''
  const selbstbewertung = antwort?.typ === 'freitext' ? antwort.selbstbewertung : undefined
  const istKorrekt = selbstbewertung === 'korrekt'
  const variant: 'korrekt' | 'falsch' = istKorrekt ? 'korrekt' : 'falsch'
  const rahmen = istKorrekt
    ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
    : 'border-red-600 bg-red-50 dark:bg-red-950/20'

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
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* SuS-Antwort in Read-Only-Rahmen */}
      <div className={`w-full border-2 rounded-xl p-4 ${rahmen}`}>
        <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
          Deine Antwort
        </div>
        {text ? (
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <p className="text-slate-500 italic text-sm">Keine Antwort abgegeben.</p>
        )}
      </div>

      {/* Musterloesungs-Block */}
      {frage.musterlosung && (
        <MusterloesungsBlock variant={variant}>
          <p>{frage.musterlosung}</p>
        </MusterloesungsBlock>
      )}
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
