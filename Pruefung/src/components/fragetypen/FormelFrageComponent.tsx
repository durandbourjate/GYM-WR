/**
 * SuS-Ansicht: Formel-Editor-Fragetyp (LaTeX mit KaTeX-Vorschau).
 * Text-Input für LaTeX-Eingabe mit Live-Vorschau und Symbol-Toolbar.
 * Kein MathLive — schlanke Lösung mit KaTeX.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { FormelFrage } from '../../types/fragen.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { ladeKatexAsync, istKatexGeladen } from '../../utils/latexRenderer.ts'
import FrageText from '../shared/FrageText.tsx'
import Tooltip from '../ui/Tooltip.tsx'

interface Props {
  frage: FormelFrage
}

/** Symbol-Gruppen für die Toolbar */
const SYMBOLE = [
  { gruppe: 'Hoch/Tief', symbole: [
    { label: 'x\u00B2', einfuegen: '^{2}' },
    { label: 'x\u207F', einfuegen: '^{n}' },
    { label: 'x\u2099', einfuegen: '_{n}' },
    { label: 'x\u1D62', einfuegen: '_{i}' },
  ]},
  { gruppe: 'Griechisch', symbole: [
    { label: '\u03B1', einfuegen: '\\alpha' },
    { label: '\u03B2', einfuegen: '\\beta' },
    { label: '\u03B3', einfuegen: '\\gamma' },
    { label: '\u03B4', einfuegen: '\\delta' },
    { label: '\u03C0', einfuegen: '\\pi' },
    { label: '\u03C3', einfuegen: '\\sigma' },
    { label: '\u03BC', einfuegen: '\\mu' },
    { label: '\u03BB', einfuegen: '\\lambda' },
  ]},
  { gruppe: 'Operatoren', symbole: [
    { label: '\u00B1', einfuegen: '\\pm' },
    { label: '\u2260', einfuegen: '\\neq' },
    { label: '<', einfuegen: '<' },
    { label: '>', einfuegen: '>' },
    { label: '\u2264', einfuegen: '\\leq' },
    { label: '\u2265', einfuegen: '\\geq' },
    { label: '=', einfuegen: '=' },
    { label: '\u221E', einfuegen: '\\infty' },
    { label: '\u2248', einfuegen: '\\approx' },
    { label: '\u00D7', einfuegen: '\\times' },
    { label: '\u00F7', einfuegen: '\\div' },
    { label: '\u2192', einfuegen: '\\rightarrow' },
  ]},
  { gruppe: 'Klammern', symbole: [
    { label: '()', einfuegen: '\\left( \\right)' },
    { label: '[]', einfuegen: '\\left[ \\right]' },
    { label: '||', einfuegen: '\\left| \\right|' },
  ]},
  { gruppe: 'Funktionen', symbole: [
    { label: '\u221A', einfuegen: '\\sqrt{}' },
    { label: '\u2211', einfuegen: '\\sum_{i=1}^{n}' },
    { label: '\u222B', einfuegen: '\\int_{a}^{b}' },
    { label: 'a/b', einfuegen: '\\frac{}{}' },
    { label: 'lim', einfuegen: '\\lim_{x \\to }' },
    { label: 'log', einfuegen: '\\log' },
    { label: 'ln', einfuegen: '\\ln' },
  ]},
]

export default function FormelFrageComponent({ frage }: Props) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const aktuellerLatex = antwort?.typ === 'formel' ? antwort.latex : ''

  const [eingabe, setEingabe] = useState(aktuellerLatex)
  const [vorschauHtml, setVorschauHtml] = useState('')
  const [fehler, setFehler] = useState('')
  const [katexGeladen, setKatexGeladen] = useState(istKatexGeladen())
  const [undoStack, setUndoStack] = useState<string[]>([])

  // KaTeX laden
  useEffect(() => {
    if (!katexGeladen) {
      ladeKatexAsync().then(() => setKatexGeladen(true))
    }
  }, [katexGeladen])

  // Eingabe aus Store synchronisieren (bei Fragewechsel)
  useEffect(() => {
    setEingabe(aktuellerLatex)
  }, [frage.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Vorschau rendern (debounced)
  useEffect(() => {
    if (!katexGeladen || !eingabe.trim()) {
      setVorschauHtml('')
      setFehler('')
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const katex = await ladeKatexAsync()
        const render = katex.default || katex
        const html = render.renderToString(eingabe.trim(), {
          displayMode: true,
          throwOnError: true,
        })
        setVorschauHtml(html)
        setFehler('')
      } catch (err) {
        setFehler((err as Error).message || 'Ungültiger LaTeX-Ausdruck')
        setVorschauHtml('')
      }
    }, 150)

    return () => clearTimeout(timeout)
  }, [eingabe, katexGeladen])

  // Antwort speichern (debounced)
  const speichereAntwort = useCallback((latex: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onAntwort({ typ: 'formel', latex })
    }, 300)
  }, [onAntwort])

  function handleEingabe(value: string): void {
    setUndoStack(prev => [...prev.slice(-20), eingabe]) // Max 20 Schritte
    setEingabe(value)
    speichereAntwort(value)
  }

  function handleUndo(): void {
    if (undoStack.length === 0 || disabled) return
    const vorherigerWert = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setEingabe(vorherigerWert)
    speichereAntwort(vorherigerWert)
  }

  function symbolEinfuegen(symbol: string): void {
    if (disabled || !inputRef.current) return
    const input = inputRef.current
    const start = input.selectionStart ?? eingabe.length
    const end = input.selectionEnd ?? eingabe.length
    const neuerText = eingabe.slice(0, start) + symbol + eingabe.slice(end)
    setUndoStack(prev => [...prev.slice(-20), eingabe])
    setEingabe(neuerText)
    speichereAntwort(neuerText)
    // Cursor nach dem eingefügten Symbol positionieren
    setTimeout(() => {
      // Bei Platzhaltern {} den Cursor zwischen die Klammern setzen
      const klammernPos = symbol.indexOf('{}')
      const cursorPos = klammernPos >= 0 ? start + klammernPos + 1 : start + symbol.length
      input.setSelectionRange(cursorPos, cursorPos)
      input.focus()
    }, 0)
  }

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
      </div>

      {/* Fragetext */}
      <FrageText text={frage.fragetext} />

      {/* Symbol-Toolbar */}
      {!disabled && (
        <div className="flex flex-wrap gap-3 items-start">
          {/* Undo-Button */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="px-2 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded border border-slate-200 dark:border-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Tooltip text="Rückgängig"><span>↩</span></Tooltip>
          </button>
          {SYMBOLE.map(gruppe => (
            <div key={gruppe.gruppe} className="flex flex-wrap gap-1 items-center">
              <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">{gruppe.gruppe}:</span>
              {gruppe.symbole.map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => symbolEinfuegen(s.einfuegen)}
                  className="px-2 py-1 text-sm font-mono bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded border border-slate-200 dark:border-slate-600 transition-colors min-w-[32px] text-center"
                >
                  <Tooltip text={s.einfuegen}><span>{s.label}</span></Tooltip>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* LaTeX-Eingabe */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Formel (LaTeX)
        </label>
        <input
          ref={inputRef}
          type="text"
          value={eingabe}
          onChange={(e) => handleEingabe(e.target.value)}
          disabled={disabled}
          placeholder="z.B. \frac{a}{b} + \sqrt{c}"
          className={`w-full px-4 py-3 font-mono text-base border-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
            disabled
              ? 'border-slate-200 dark:border-slate-700 opacity-75 cursor-not-allowed'
              : eingabe.trim()
                ? 'border-slate-300 dark:border-slate-600'
                : 'border-violet-400 dark:border-violet-500'
          }`}
        />
      </div>

      {/* Vorschau */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 min-h-[60px] flex items-center justify-center">
        {fehler ? (
          <p className="text-red-500 text-sm">{fehler}</p>
        ) : vorschauHtml ? (
          <div
            className="text-xl text-slate-800 dark:text-slate-100"
            dangerouslySetInnerHTML={{ __html: vorschauHtml }}
          />
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-sm italic">
            {katexGeladen ? 'Vorschau erscheint hier...' : 'Formeln werden geladen...'}
          </p>
        )}
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
