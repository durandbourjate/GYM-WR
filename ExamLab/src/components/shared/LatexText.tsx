/**
 * Wrapper-Komponente für HTML-Inhalte mit LaTeX-Rendering.
 * Lazy-loaded KaTeX: zeigt zunächst den Rohtext an, rendert LaTeX sobald KaTeX geladen ist.
 * Nutzt $$...$$ für Display-Modus und $...$ für Inline-Modus.
 */
import { useState, useEffect } from 'react'
import { istKatexGeladen, ladeKatexAsync, renderLatexSync } from '../../utils/latexRenderer.ts'

interface LatexTextProps {
  html: string
  className?: string
}

/** Prüft ob der Text LaTeX-Delimiters enthält */
function enthaeltLatex(text: string): boolean {
  return /\$[^$]/.test(text)
}

export default function LatexText({ html, className }: LatexTextProps) {
  const [fertig, setFertig] = useState(istKatexGeladen())

  useEffect(() => {
    if (fertig || !enthaeltLatex(html)) return
    ladeKatexAsync().then(() => setFertig(true))
  }, [html, fertig])

  const gerenderterHtml = fertig ? renderLatexSync(html) : html

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: gerenderterHtml }}
    />
  )
}
