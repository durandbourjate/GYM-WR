import { useState, useEffect, useRef } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function FormelFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf FormelFrage (shared discriminated union)
  if (frage.typ !== 'formel') return null
  const formel = frage

  const [latex, setLatex] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const katexLoaded = useRef(false)

  // KaTeX lazy laden und Preview rendern
  useEffect(() => {
    if (!previewRef.current || !latex.trim()) {
      if (previewRef.current) previewRef.current.innerHTML = ''
      return
    }

    const renderPreview = async () => {
      try {
        if (!katexLoaded.current) {
          // CSS laden
          if (!document.querySelector('link[href*="katex"]')) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
            document.head.appendChild(link)
          }
          // JS laden via Script-Tag (CDN, kein npm-Dependency nötig)
          if (!(window as unknown as Record<string, unknown>).katex) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script')
              script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
              script.onload = () => resolve()
              script.onerror = reject
              document.head.appendChild(script)
            })
          }
          katexLoaded.current = true
        }
        const katexLib = (window as unknown as Record<string, unknown>).katex as { render: (tex: string, el: HTMLElement, opts: Record<string, unknown>) => void }
        if (previewRef.current && katexLib) {
          katexLib.render(latex, previewRef.current, {
            throwOnError: false,
            displayMode: true,
          })
        }
      } catch {
        if (previewRef.current) {
          previewRef.current.textContent = latex
        }
      }
    }

    const timer = setTimeout(renderPreview, 300)
    return () => clearTimeout(timer)
  }, [latex])

  const handleAbsenden = () => {
    if (!latex.trim() || disabled) return
    onAntwort({ typ: 'formel', latex: latex.trim() })
  }

  return (
    <div className="space-y-3">
      {/* LaTeX-Eingabe */}
      <input
        type="text"
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        disabled={disabled}
        autoFocus
        placeholder="LaTeX-Formel eingeben, z.B. \frac{a}{b}"
        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-base focus:border-slate-500 focus:outline-none"
      />

      {/* Live-Preview */}
      {latex.trim() && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vorschau:</p>
          <div ref={previewRef} className="text-lg text-center dark:text-white min-h-[40px]" />
        </div>
      )}

      {!disabled && latex.trim() && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && (
        <div className="space-y-2">
          {/* Korrekte Formel */}
          {formel.korrekteFormel && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/20 text-sm">
              <span className="font-medium text-slate-800 dark:text-slate-200">Korrekte Formel: </span>
              <code className="text-slate-700 dark:text-slate-300 font-mono">{formel.korrekteFormel}</code>
            </div>
          )}
          {korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
        </div>
      )}
    </div>
  )
}
