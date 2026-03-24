import type { PDFKategorie } from './PDFTypes.ts'

interface Props {
  kategorien: PDFKategorie[]
  position: { x: number; y: number }
  onSelect: (kategorieId: string) => void
  onCancel: () => void
}

export function PDFKategorieChooser({ kategorien, position, onSelect, onCancel }: Props) {
  return (
    <div className="absolute z-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg py-1 min-w-40"
      style={{ left: position.x, top: position.y }}>
      {kategorien.map(k => (
        <button key={k.id} onClick={() => onSelect(k.id)}
          className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          title={k.beschreibung}>
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: k.farbe }} />
          {k.label}
        </button>
      ))}
      <button onClick={onCancel}
        className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
        Abbrechen
      </button>
    </div>
  )
}
