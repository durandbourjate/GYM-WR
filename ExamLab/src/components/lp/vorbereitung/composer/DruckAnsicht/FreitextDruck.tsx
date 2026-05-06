import type { FreitextFrage } from '../../../../../types/fragen-storage'

export default function FreitextDruck({ frage }: { frage: FreitextFrage }) {
  const zeilen = frage.laenge === 'kurz' ? 4 : frage.laenge === 'lang' ? 14 : 8
  return (
    <div className="space-y-0">
      {Array.from({ length: zeilen }).map((_, i) => (
        <div key={i} className="druck-linie" />
      ))}
    </div>
  )
}
