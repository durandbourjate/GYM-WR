import type { ReactNode } from 'react'
import type { HighlightStelle } from '../types/suche'

/**
 * Baut JSX-Array aus Text und Highlight-Stellen.
 * XSS-sicher by-construction (React escaped Text-Children automatisch — kein dangerouslySetInnerHTML).
 */
export function highlight(
  text: string,
  stellen: HighlightStelle[] | undefined,
  feld: 'titel' | 'subTitel',
): ReactNode[] {
  const relevante = (stellen ?? [])
    .filter(s => s.feld === feld)
    .sort((a, b) => a.start - b.start)
  if (relevante.length === 0) return [text]

  const teile: ReactNode[] = []
  let cursor = 0
  relevante.forEach((s, i) => {
    if (s.start > cursor) teile.push(text.slice(cursor, s.start))
    teile.push(
      <mark
        key={i}
        className="bg-yellow-200 dark:bg-yellow-700/50 font-semibold rounded px-0.5"
      >
        {text.slice(s.start, s.end)}
      </mark>,
    )
    cursor = s.end
  })
  if (cursor < text.length) teile.push(text.slice(cursor))
  return teile
}
