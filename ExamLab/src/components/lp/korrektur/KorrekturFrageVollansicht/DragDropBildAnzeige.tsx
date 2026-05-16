import { Check, X } from 'lucide-react'
import type { DragDropBildFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import { toAssetUrl } from '../../../../utils/assetUrl'
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from '../../../../utils/ueben/fragetypNormalizer'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'

/** DragDrop-Bild-Antwort mit Bild + Zonen + Labels */
export default function DragDropBildAnzeige({ frage: frageRaw, antwort: antwortRaw }: { frage: DragDropBildFrage; antwort: Extract<Antwort, { typ: 'dragdrop_bild' }> | undefined }) {
  const frage = normalisiereDragDropBild(frageRaw)
  const antwort = antwortRaw ? normalisiereDragDropAntwort(antwortRaw, frage) : undefined
  const labelMap = new Map(frage.labels.map(l => [l.id, l]))
  const bildQuelle = ermittleBildQuelle(frage)
  const bildSrc = bildQuelle ? mediaQuelleZuImgSrc(bildQuelle, toAssetUrl) : null
  function texteInZone(zoneId: string): string[] {
    if (!antwort) return []
    return Object.entries(antwort.zuordnungen)
      .filter(([, zid]) => zid === zoneId)
      .map(([lid]) => (labelMap.get(lid)?.text ?? '').trim())
      .filter(Boolean)
  }
  function istKorrekt(zone: typeof frage.zielzonen[number], texte: string[]): boolean {
    const sollSet = new Set(zone.korrekteLabels.map(s => s.trim().toLowerCase()))
    return texte.some(t => sollSet.has(t.toLowerCase()))
  }
  return (
    <div className="mt-2">
      {bildSrc && (
        <div className="relative inline-block">
          <img src={bildSrc} alt="Drag & Drop" className="max-w-full rounded" />
          {/* Zielzonen mit platzierten Labels */}
          {frage.zielzonen.filter(z => Array.isArray(z.punkte) && z.punkte.length >= 3).map((zone) => {
            const texte = texteInZone(zone.id)
            const hatAntwort = texte.length > 0
            const korrekt = istKorrekt(zone, texte)
            const xs = zone.punkte.map(p => p.x), ys = zone.punkte.map(p => p.y)
            const minX = Math.min(...xs), minY = Math.min(...ys)
            const breite = Math.max(...xs) - minX, hoehe = Math.max(...ys) - minY
            return (
              <div key={zone.id} className={`absolute border-2 flex items-center justify-center ${
                !hatAntwort ? 'border-dashed border-slate-400/60'
                : korrekt ? 'border-green-500 bg-green-500/15'
                : 'border-red-500 bg-red-500/15'
              }`} style={{ left: `${minX}%`, top: `${minY}%`, width: `${breite}%`, height: `${hoehe}%` }}>
                {hatAntwort && (
                  <span className={`text-xs font-medium px-1 rounded ${korrekt ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {texte.join(', ')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      {/* Textliste als Zusatzinfo */}
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
        {frage.zielzonen.map((zone, idx) => {
          const texte = texteInZone(zone.id)
          const hatAntwort = texte.length > 0
          const korrekt = istKorrekt(zone, texte)
          const erwartet = zone.korrekteLabels.join(' / ')
          return (
            <div key={zone.id} className="text-sm flex items-center gap-2">
              <span className="shrink-0 inline-flex items-center">{hatAntwort ? (korrekt ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <X className="w-3.5 h-3.5" aria-hidden="true" />) : '—'}</span>
              <span className="text-slate-500 dark:text-slate-400">{zone.label || `Zone ${idx + 1}`}:</span>
              <span className="text-slate-700 dark:text-slate-200">{hatAntwort ? texte.join(', ') : 'Nicht platziert'}</span>
              {!korrekt && hatAntwort && <span className="text-xs text-slate-400">Erwartet: {erwartet}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
