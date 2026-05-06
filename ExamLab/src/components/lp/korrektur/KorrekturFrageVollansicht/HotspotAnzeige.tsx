import type { HotspotFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import { toAssetUrl } from '../../../../utils/assetUrl'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'
import { KeineAntwort } from './util'

/** Hotspot-Antwort mit Bild + Markierungen */
export default function HotspotAnzeige({ frage, antwort }: { frage: HotspotFrage; antwort: Extract<Antwort, { typ: 'hotspot' }> | undefined }) {
  const bildQuelle = ermittleBildQuelle(frage)
  const bildSrc = bildQuelle ? mediaQuelleZuImgSrc(bildQuelle, toAssetUrl) : null
  if (!antwort) return <>{bildSrc && <img src={bildSrc} alt="Hotspot" className="max-w-full rounded mt-2" />}<KeineAntwort /></>
  return (
    <div className="mt-2">
      {bildSrc && (
        <div className="relative inline-block">
          <img src={bildSrc} alt="Hotspot" className="max-w-full rounded" />
          {/* Korrekte Bereiche als SVG-Polygone (grün gestrichelt) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {(frage.bereiche ?? []).filter(b => Array.isArray(b.punkte) && b.punkte.length >= 3).map((b) => (
              <polygon
                key={b.id}
                points={b.punkte.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(34,197,94,0.15)"
                stroke="#22c55e"
                strokeWidth="0.4"
                strokeDasharray="1,0.7"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {/* Bereich-Labels (als HTML, damit Text nicht skaliert wird) */}
          {(frage.bereiche ?? []).filter(b => Array.isArray(b.punkte) && b.punkte.length >= 3).map((b) => {
            const xs = b.punkte.map(p => p.x), ys = b.punkte.map(p => p.y)
            const cx = xs.reduce((s, v) => s + v, 0) / xs.length
            const cy = ys.reduce((s, v) => s + v, 0) / ys.length
            return (
              <span
                key={b.id + '-label'}
                className="absolute text-[10px] text-green-600 dark:text-green-400 bg-white/80 dark:bg-slate-800/80 px-1 rounded pointer-events-none"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
              >
                {b.label}
              </span>
            )
          })}
          {/* SuS-Klicks (rot) */}
          {antwort.klicks?.map((klick, i) => (
            <div key={i} className="absolute w-4 h-4 -ml-2 -mt-2 bg-red-500 rounded-full border-2 border-white opacity-80" style={{ left: `${klick.x}%`, top: `${klick.y}%` }} />
          ))}
        </div>
      )}
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {antwort.klicks?.length ?? 0} Markierungen gesetzt
      </div>
    </div>
  )
}
