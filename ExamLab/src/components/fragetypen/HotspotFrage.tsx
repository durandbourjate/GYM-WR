import { useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { HotspotFrage as HotspotFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { toAssetUrl } from '../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'
import { istZoneWohlgeformt } from '../../utils/zonen/migriereZone.ts'

interface Props {
  frage: HotspotFrageType
}

export default function HotspotFrage({ frage }: Props) {
  // Error-Boundary: Zonen müssen im neuen Format (punkte[]) vorliegen
  const zonenUngueltig =
    Array.isArray(frage.bereiche) && frage.bereiche.length > 0 &&
    frage.bereiche.some(b => !istZoneWohlgeformt(b))
  if (zonenUngueltig) {
    return (
      <div className="p-4 rounded border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
        Diese Frage konnte nicht geladen werden. Bitte LP informieren.
      </div>
    )
  }
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const bildQuelle = ermittleBildQuelle(frage)

  const geklickt: { x: number; y: number }[] =
    antwort?.typ === 'hotspot' ? antwort.klicks : []

  const handleKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    let neueKlicks: { x: number; y: number }[]
    if (frage.mehrfachauswahl) {
      neueKlicks = [...geklickt, { x, y }]
    } else {
      neueKlicks = [{ x, y }]
    }
    onAntwort({ typ: 'hotspot', klicks: neueKlicks })
  }, [disabled, frage.id, frage.mehrfachauswahl, geklickt, onAntwort])

  function handleZuruecksetzen() {
    if (disabled) return
    onAntwort({ typ: 'hotspot', klicks: [] })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        {frage.mehrfachauswahl && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            Mehrfachauswahl
          </span>
        )}
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Bild mit Klickbereichen — feste Container-Breite, damit SVGs ohne explizite width-Attribute
          (nur viewBox) sichtbar sind statt auf 0 zu kollabieren */}
      <div className={`relative block w-full max-w-2xl ${!disabled && geklickt.length === 0 ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`}>
        <div
          className={`relative overflow-hidden w-full ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-crosshair'}`}
          onClick={handleKlick}
        >
          {bildQuelle && (
            <img
              src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)}
              alt="Hotspot-Bild"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          )}

          {/* Klick-Marker */}
          {geklickt.map((pos, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-800 shadow-md pointer-events-none"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            />
          ))}
        </div>
      </div>

      {/* Zuruecksetzen-Button */}
      {!disabled && geklickt.length > 0 && (
        <button
          onClick={handleZuruecksetzen}
          className="self-start px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
        >
          Auswahl zurucksetzen
        </button>
      )}

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
