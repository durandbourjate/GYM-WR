import type { BildbeschriftungFrage } from '../../../../../types/fragen-storage'
import { toAssetUrl } from '../../../../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'

export default function BildbeschriftungDruck({ frage }: { frage: BildbeschriftungFrage }) {
  const beschriftungen = frage.beschriftungen || []
  const bildQuelle = ermittleBildQuelle(frage)
  return (
    <div className="space-y-3">
      {bildQuelle && (
        <div className="relative inline-block">
          <img src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)} alt="Bildbeschriftung" className="max-w-full rounded border border-slate-300 print:border-slate-400" />
          {/* Nummerierte Marker auf dem Bild */}
          {beschriftungen.map((b, i) => (
            <div
              key={b.id}
              className="absolute w-5 h-5 rounded-full bg-slate-700 print:bg-black text-white text-[9px] font-bold flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${b.position.x}%`, top: `${b.position.y}%` }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}
      {/* Antwortlinien */}
      {beschriftungen.map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-200 print:bg-slate-300 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
          <div className="druck-linie flex-1" />
        </div>
      ))}
    </div>
  )
}
