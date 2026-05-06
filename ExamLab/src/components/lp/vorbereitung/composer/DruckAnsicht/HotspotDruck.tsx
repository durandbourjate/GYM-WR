import type { HotspotFrage } from '../../../../../types/fragen-storage'
import { toAssetUrl } from '../../../../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'

export default function HotspotDruck({ frage }: { frage: HotspotFrage }) {
  const bildQuelle = ermittleBildQuelle(frage)
  return (
    <div className="space-y-2">
      {bildQuelle && (
        <img src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)} alt="Hotspot-Bild" className="max-w-full rounded border border-slate-300 print:border-slate-400" />
      )}
      <p className="text-sm text-slate-600 print:text-black">
        Markiere {frage.bereiche?.length || 1} Stelle{(frage.bereiche?.length || 1) > 1 ? 'n' : ''} auf dem Bild.
      </p>
    </div>
  )
}
