import { useState, useEffect } from 'react'
import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Formel-Antwort (LaTeX via KaTeX) */
export default function FormelAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'formel' }> | undefined }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (!antwort?.latex) return
    import('katex').then((katex) => {
      try {
        setHtml(katex.default.renderToString(antwort.latex, { throwOnError: false, displayMode: true }))
      } catch {
        setHtml('')
      }
    })
  }, [antwort?.latex])

  if (!antwort?.latex) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">Eingegebene Formel:</span>
      {html ? (
        <div className="mt-1" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code className="text-sm text-slate-700 dark:text-slate-200 block mt-1">{antwort.latex}</code>
      )}
    </div>
  )
}
