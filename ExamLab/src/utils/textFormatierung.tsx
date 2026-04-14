import type { ReactNode } from 'react'

/** Formatiert Text mit **fett** Markdown zu React-Elementen und wandelt \n in Zeilenumbrueche */
export function formatFragetext(text: string): ReactNode[] {
  const zeilen = text.split('\n')
  const ergebnis: ReactNode[] = []

  for (let z = 0; z < zeilen.length; z++) {
    if (z > 0) ergebnis.push(<br key={`br-${z}`} />)

    const teile = zeilen[z].split(/(\*\*[^*]+\*\*)/)
    for (let i = 0; i < teile.length; i++) {
      const teil = teile[i]
      if (teil.startsWith('**') && teil.endsWith('**')) {
        ergebnis.push(
          <strong key={`${z}-${i}`} className="font-semibold">
            {teil.slice(2, -2)}
          </strong>
        )
      } else {
        ergebnis.push(<span key={`${z}-${i}`}>{teil}</span>)
      }
    }
  }

  return ergebnis
}
