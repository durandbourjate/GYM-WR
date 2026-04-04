/**
 * LP-Editor für Formel-Fragetyp (LaTeX).
 * Korrekte Formel eingeben mit Live-Vorschau.
 * vergleichsModus ist vorerst auf 'exakt' fixiert.
 */
import { useState, useEffect } from 'react'
import { ladeKatexAsync, istKatexGeladen } from '../utils/latexRenderer'

interface FormelEditorProps {
  korrekteFormel: string
  setKorrekteFormel: (v: string) => void
  vergleichsModus: 'exakt'
  setVergleichsModus: (v: 'exakt') => void
}

export default function FormelEditor({
  korrekteFormel, setKorrekteFormel,
  vergleichsModus: _vergleichsModus, setVergleichsModus: _setVergleichsModus,
}: FormelEditorProps) {
  const [vorschauHtml, setVorschauHtml] = useState('')
  const [fehler, setFehler] = useState('')
  const [katexGeladen, setKatexGeladen] = useState(istKatexGeladen())

  // KaTeX laden
  useEffect(() => {
    if (!katexGeladen) {
      ladeKatexAsync().then(() => setKatexGeladen(true))
    }
  }, [katexGeladen])

  // Vorschau rendern
  useEffect(() => {
    if (!katexGeladen || !korrekteFormel.trim()) {
      setVorschauHtml('')
      setFehler('')
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const katex = await ladeKatexAsync()
        const render = katex.default || katex
        const html = render.renderToString(korrekteFormel.trim(), {
          displayMode: true,
          throwOnError: true,
        })
        setVorschauHtml(html)
        setFehler('')
      } catch (err) {
        setFehler((err as Error).message || 'Ungültiger LaTeX-Ausdruck')
        setVorschauHtml('')
      }
    }, 200)

    return () => clearTimeout(timeout)
  }, [korrekteFormel, katexGeladen])

  return (
    <div className="flex flex-col gap-4">
      {/* Korrekte Formel */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Korrekte Formel (LaTeX)
        </label>
        <input
          type="text"
          value={korrekteFormel}
          onChange={(e) => setKorrekteFormel(e.target.value)}
          placeholder="z.B. \frac{a^2 + b^2}{c}"
          className="input-field font-mono"
        />
      </div>

      {/* Vorschau */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Vorschau
        </label>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 min-h-[50px] flex items-center justify-center">
          {fehler ? (
            <p className="text-red-500 text-sm">{fehler}</p>
          ) : vorschauHtml ? (
            <div
              className="text-xl text-slate-800 dark:text-slate-100"
              dangerouslySetInnerHTML={{ __html: vorschauHtml }}
            />
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">
              {katexGeladen ? 'LaTeX-Formel eingeben...' : 'KaTeX wird geladen...'}
            </p>
          )}
        </div>
      </div>

      {/* Vergleichsmodus (deaktiviert, reserviert für später) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Vergleichsmodus
        </label>
        <select
          value="exakt"
          disabled
          className="input-field opacity-60 cursor-not-allowed"
        >
          <option value="exakt">Exakter Vergleich (normalisiert)</option>
        </select>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Symbolischer Vergleich wird in einer zukünftigen Version unterstützt.
        </p>
      </div>
    </div>
  )
}
