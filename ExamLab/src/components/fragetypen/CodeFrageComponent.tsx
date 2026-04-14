/**
 * SuS-Ansicht: Code-Editor-Fragetyp.
 * Editierbarer CodeMirror-Editor mit Syntax-Highlighting.
 * Lazy-loaded: CodeMirror wird erst bei Bedarf geladen.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { CodeFrage } from '../../types/fragen.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import FrageText from '../shared/FrageText.tsx'

interface Props {
  frage: CodeFrage
}

/** Lädt die passende Sprach-Extension */
async function ladeSprache(sprache: string) {
  switch (sprache) {
    case 'python': case 'py':
      return (await import('@codemirror/lang-python')).python()
    case 'javascript': case 'js':
      return (await import('@codemirror/lang-javascript')).javascript()
    case 'typescript': case 'ts':
      return (await import('@codemirror/lang-javascript')).javascript({ typescript: true })
    case 'sql':
      return (await import('@codemirror/lang-sql')).sql()
    case 'html':
      return (await import('@codemirror/lang-html')).html()
    case 'css':
      return (await import('@codemirror/lang-css')).css()
    case 'java':
      return (await import('@codemirror/lang-java')).java()
    default:
      return null
  }
}

export default function CodeFrageComponent({ frage }: Props) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<import('@codemirror/view').EditorView | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [geladen, setGeladen] = useState(false)

  const aktuellerCode = antwort?.typ === 'code' ? antwort.code : (frage.starterCode ?? '')

  // Ref für aktuelle Werte (verhindert stale closure)
  const frageIdRef = useRef(frage.id)
  frageIdRef.current = frage.id

  const speichereCode = useCallback((code: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onAntwort({ typ: 'code', code })
    }, 300)
  }, [onAntwort])

  useEffect(() => {
    if (!containerRef.current) return
    let abgebrochen = false

    async function init() {
      const [{ EditorView, lineNumbers, keymap }, { EditorState }, oneDarkModule, { indentWithTab }] = await Promise.all([
        import('@codemirror/view'),
        import('@codemirror/state'),
        import('@codemirror/theme-one-dark'),
        import('@codemirror/commands'),
      ])

      if (abgebrochen || !containerRef.current) return

      const extensions = [
        lineNumbers(),
        keymap.of([indentWithTab]),
        EditorView.theme({
          '&': { fontSize: '14px', borderRadius: '8px', minHeight: '200px' },
          '.cm-gutters': { borderRight: 'none', paddingRight: '4px' },
          '.cm-content': { padding: '12px 8px', minHeight: '180px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            speichereCode(update.state.doc.toString())
          }
        }),
      ]

      // Read-only wenn disabled
      if (disabled) {
        extensions.push(EditorView.editable.of(false))
        extensions.push(EditorState.readOnly.of(true))
      }

      // Dark-Mode
      const istDark = document.documentElement.classList.contains('dark')
      if (istDark) {
        extensions.push(oneDarkModule.oneDark)
      }

      // Sprach-Extension
      const sprachExt = await ladeSprache(frage.sprache)
      if (sprachExt) extensions.push(sprachExt)

      if (abgebrochen || !containerRef.current) return

      const state = EditorState.create({ doc: aktuellerCode, extensions })
      const view = new EditorView({ state, parent: containerRef.current })
      viewRef.current = view
      setGeladen(true)
    }

    init()

    return () => {
      abgebrochen = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
      viewRef.current?.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id, frage.sprache, disabled])

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
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
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-mono">
          {frage.sprache}
        </span>
      </div>

      {/* Fragetext */}
      <FrageText text={frage.fragetext} />

      {/* Code-Editor */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Code-Eingabe ({frage.sprache})
        </label>
        <div
          ref={containerRef}
          className={`rounded-lg border-2 overflow-hidden min-h-[200px] ${
            disabled
              ? 'border-slate-200 dark:border-slate-700 opacity-75'
              : aktuellerCode.trim()
                ? 'border-slate-300 dark:border-slate-600'
                : 'border-violet-400 dark:border-violet-500'
          }`}
          onClick={() => {
            // iOS: Focus auf CodeMirror via direkte User-Geste (Keyboard öffnet sich)
            if (viewRef.current && !disabled) {
              viewRef.current.focus()
            }
          }}
        >
          {!geladen && (
            <pre className="p-3 text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 min-h-[200px]">
              {aktuellerCode || 'Editor wird geladen...'}
            </pre>
          )}
        </div>
      </div>

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
