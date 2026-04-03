import { useState, useEffect, useRef } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function FormelFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const [latex, setLatex] = useState('')
  const [hinweisIndex, setHinweisIndex] = useState(0)
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

  const hinweise = frage.hinweise || []

  return (
    <div className="space-y-3">
      {/* Hinweise */}
      {hinweise.length > 0 && hinweisIndex < hinweise.length && (
        <div className="space-y-2">
          {hinweise.slice(0, hinweisIndex + 1).map((h, i) => (
            <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
              💡 {h}
            </div>
          ))}
          {hinweisIndex < hinweise.length - 1 && !disabled && (
            <button
              onClick={() => setHinweisIndex(hinweisIndex + 1)}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              Naechster Hinweis
            </button>
          )}
        </div>
      )}

      {/* LaTeX-Eingabe */}
      <input
        type="text"
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        disabled={disabled}
        autoFocus
        placeholder="LaTeX-Formel eingeben, z.B. \frac{a}{b}"
        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-base focus:border-blue-500 focus:outline-none"
      />

      {/* Live-Preview */}
      {latex.trim() && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vorschau:</p>
          <div ref={previewRef} className="text-lg text-center dark:text-white min-h-[40px]" />
        </div>
      )}

      {!disabled && latex.trim() && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && (
        <div className="space-y-2">
          {/* Korrekte Formel */}
          {frage.korrekt && typeof frage.korrekt === 'string' && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-200">Korrekte Formel: </span>
              <code className="text-blue-700 dark:text-blue-300 font-mono">{frage.korrekt}</code>
            </div>
          )}
          {korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.erklaerung} />}
        </div>
      )}
    </div>
  )
}
