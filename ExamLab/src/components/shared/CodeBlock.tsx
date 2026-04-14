/**
 * Syntax-highlighted Code-Block mit lazy-loaded CodeMirror.
 * Read-only Darstellung für Aufgabenstellungen.
 * Unterstützt: python, javascript, sql, html, css, java.
 */
import { useEffect, useRef, useState } from 'react'

interface CodeBlockProps {
  code: string
  language: string
}

/** Lädt die passende Sprach-Extension für CodeMirror */
async function ladeSprache(sprache: string) {
  switch (sprache) {
    case 'python':
    case 'py':
      return (await import('@codemirror/lang-python')).python()
    case 'javascript':
    case 'js':
      return (await import('@codemirror/lang-javascript')).javascript()
    case 'typescript':
    case 'ts':
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

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<import('@codemirror/view').EditorView | null>(null)
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let abgebrochen = false

    async function init() {
      const [{ EditorView, lineNumbers }, { EditorState }, oneDarkModule] = await Promise.all([
        import('@codemirror/view'),
        import('@codemirror/state'),
        import('@codemirror/theme-one-dark'),
      ])

      if (abgebrochen || !containerRef.current) return

      const extensions = [
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        lineNumbers(),
        EditorView.theme({
          '&': { fontSize: '13px', borderRadius: '8px', overflow: 'hidden' },
          '.cm-gutters': { borderRight: 'none', paddingRight: '4px' },
          '.cm-content': { padding: '12px 8px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ]

      // Dark-Mode erkennen
      const istDark = document.documentElement.classList.contains('dark')
      if (istDark) {
        extensions.push(oneDarkModule.oneDark)
      }

      // Sprach-Extension laden
      const sprachExt = await ladeSprache(language)
      if (sprachExt) extensions.push(sprachExt)

      if (abgebrochen || !containerRef.current) return

      const state = EditorState.create({ doc: code, extensions })
      const view = new EditorView({ state, parent: containerRef.current })
      viewRef.current = view
      setGeladen(true)
    }

    init()

    return () => {
      abgebrochen = true
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [code, language])

  return (
    <div className="my-3">
      {language && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono uppercase">
          {language}
        </div>
      )}
      <div
        ref={containerRef}
        className={`rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden ${!geladen ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
      >
        {!geladen && (
          <pre className="p-3 text-sm font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
            {code}
          </pre>
        )}
      </div>
    </div>
  )
}
