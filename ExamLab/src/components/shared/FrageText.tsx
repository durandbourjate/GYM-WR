/**
 * Universelle Fragetext-Anzeige mit LaTeX- und Code-Block-Rendering.
 * Ersetzt die bisherigen dangerouslySetInnerHTML-Divs in Fragetyp-Komponenten.
 *
 * - Rendert Markdown (fett, kursiv, code, Zeilenumbrüche)
 * - Rendert LaTeX-Formeln ($...$ inline, $$...$$ display)
 * - Extrahiert ```sprache...``` Code-Blöcke und rendert sie mit CodeMirror
 */
import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { renderMarkdown } from '../../utils/markdown.ts'
import { istKatexGeladen, ladeKatexAsync, renderLatexSync } from '../../utils/latexRenderer.ts'

const CodeBlock = lazy(() => import('./CodeBlock.tsx'))

interface FrageTextProps {
  text: string
  className?: string
}

/** Standard-Klassen für Fragetext-Darstellung */
const DEFAULT_KLASSEN = 'text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700'

interface TextSegment {
  typ: 'html' | 'code'
  inhalt: string
  sprache?: string
}

/**
 * Teilt den Text in HTML-Segmente und Code-Blöcke auf.
 * Code-Blöcke werden mit ```sprache\n...\n``` markiert.
 */
function extrahiereSegmente(text: string): TextSegment[] {
  const segmente: TextSegment[] = []
  // Regex für Code-Blöcke: ```sprache\ncode\n```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let letzterIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text vor dem Code-Block
    if (match.index > letzterIndex) {
      segmente.push({
        typ: 'html',
        inhalt: text.slice(letzterIndex, match.index),
      })
    }
    // Code-Block
    segmente.push({
      typ: 'code',
      sprache: match[1] || 'text',
      inhalt: match[2].trim(),
    })
    letzterIndex = match.index + match[0].length
  }

  // Rest nach dem letzten Code-Block
  if (letzterIndex < text.length) {
    segmente.push({
      typ: 'html',
      inhalt: text.slice(letzterIndex),
    })
  }

  return segmente
}

/** Prüft ob der Text LaTeX-Delimiters enthält */
function enthaeltLatex(text: string): boolean {
  return /\$[^$]/.test(text)
}

/** Prüft ob der Text Code-Blöcke enthält */
function enthaeltCodeBloecke(text: string): boolean {
  return /```\w*\n/.test(text)
}

export default function FrageText({ text, className }: FrageTextProps) {
  const [katexGeladen, setKatexGeladen] = useState(istKatexGeladen())
  const hatLatex = enthaeltLatex(text)
  const hatCode = enthaeltCodeBloecke(text)

  useEffect(() => {
    if (katexGeladen || !hatLatex) return
    ladeKatexAsync().then(() => setKatexGeladen(true))
  }, [hatLatex, katexGeladen])

  const klassen = className ?? DEFAULT_KLASSEN

  // Einfacher Fall: kein Code, kein LaTeX → normales Markdown-Rendering
  if (!hatCode && !hatLatex) {
    return (
      <div
        className={klassen}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
      />
    )
  }

  // Einfacher Fall: LaTeX, aber kein Code → Markdown + LaTeX
  if (!hatCode) {
    let html = renderMarkdown(text)
    if (katexGeladen) {
      html = renderLatexSync(html)
    }
    return (
      <div
        className={klassen}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  // Komplexer Fall: Code-Blöcke (und evtl. LaTeX)
  const segmente = useMemo(() => extrahiereSegmente(text), [text])

  return (
    <div className={klassen}>
      {segmente.map((seg, i) => {
        if (seg.typ === 'code') {
          return (
            <Suspense key={i} fallback={
              <pre className="p-3 text-sm font-mono bg-slate-100 dark:bg-slate-800 rounded-lg my-2">
                {seg.inhalt}
              </pre>
            }>
              <CodeBlock code={seg.inhalt} language={seg.sprache ?? 'text'} />
            </Suspense>
          )
        }
        // HTML-Segment mit Markdown + optional LaTeX
        let html = renderMarkdown(seg.inhalt)
        if (hatLatex && katexGeladen) {
          html = renderLatexSync(html)
        }
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}

/** Re-Export der Standard-Klassen für externe Nutzung */
export { DEFAULT_KLASSEN as FRAGETEXT_KLASSEN }
