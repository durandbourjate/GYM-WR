import type { DragDropBildFrage } from '../../../../../types/fragen-storage'
import { toAssetUrl } from '../../../../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { normalisiereDragDropBild } from '../../../../../utils/ueben/fragetypNormalizer'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'

export default function DragDropBildDruck({ frage: frageRaw }: { frage: DragDropBildFrage }) {
  const frage = normalisiereDragDropBild(frageRaw)
  const zielzonen = frage.zielzonen || []
  const labels = frage.labels || []
  const bildQuelle = ermittleBildQuelle(frage)
  return (
    <div className="space-y-3">
      {bildQuelle && (
        <div className="relative inline-block">
          <img src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)} alt="Drag & Drop" className="max-w-full rounded border border-slate-300 print:border-slate-400" />
          {/* Nummerierte Zielzonen auf dem Bild (Bounding-Box aus punkte[]) */}
          {zielzonen.filter(z => Array.isArray(z.punkte) && z.punkte.length >= 3).map((z, i) => {
            const xs = z.punkte.map(p => p.x), ys = z.punkte.map(p => p.y)
            const x = Math.min(...xs), y = Math.min(...ys)
            const b = Math.max(...xs) - x, h = Math.max(...ys) - y
            return (
              <div
                key={z.id}
                className="absolute border-2 border-dashed border-slate-500 print:border-black rounded flex items-center justify-center"
                style={{ left: `${x}%`, top: `${y}%`, width: `${b}%`, height: `${h}%` }}
              >
                <span className="text-xs font-bold text-slate-500 print:text-black">{String.fromCharCode(65 + i)}</span>
              </div>
            )
          })}
        </div>
      )}
      {/* Begriffe zum Zuordnen */}
      <div>
        <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Ordne folgende Begriffe den Zonen (A, B, C...) zu:</p>
        <div className="grid grid-cols-2 gap-1">
          {labels.map((label, i) => (
            <div key={label.id ?? i} className="flex items-center gap-2 text-sm">
              <span className="dark:text-white">{label.text}</span>
              <span className="text-slate-400">→ Zone ___</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
