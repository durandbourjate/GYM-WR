import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'
import BildContainer from './shared/BildContainer'

interface Klick {
  x: number  // Prozent
  y: number
}

export default function HotspotFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const hotspots = frage.hotspots || []
  const korrektIndices = (frage.korrekt as number[]) || []
  const maxKlicks = korrektIndices.length

  const [klicks, setKlicks] = useState<Klick[]>([])

  const handleKlick = (e: React.MouseEvent<HTMLDivElement>, bounds: { width: number; height: number }) => {
    if (disabled || feedbackSichtbar) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / bounds.width) * 100
    const y = ((e.clientY - rect.top) / bounds.height) * 100

    // Prüfe ob Klick auf bestehendem Marker (entfernen)
    const existing = klicks.findIndex(k => Math.hypot(k.x - x, k.y - y) < 3)
    if (existing >= 0) {
      setKlicks(klicks.filter((_, i) => i !== existing))
      return
    }

    // Max Klicks erreicht?
    if (klicks.length >= maxKlicks) return

    setKlicks([...klicks, { x, y }])
  }

  const handleAbsenden = () => {
    if (klicks.length === 0 || disabled) return
    onAntwort({ typ: 'hotspot', klicks })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Klicke auf {maxKlicks} Stelle{maxKlicks > 1 ? 'n' : ''} im Bild. Erneut klicken zum Entfernen.
      </p>

      {frage.bild && (
        <BildContainer src={frage.bild.src} alt={frage.bild.alt}>
          {(bounds) => (
            <div
              className="absolute inset-0 cursor-crosshair"
              style={{ touchAction: 'none' }}
              onClick={(e) => handleKlick(e, bounds)}
            >
              {/* SuS-Klicks */}
              {klicks.map((k, i) => {
                // Bei Feedback prüfen ob korrekt
                let markerClass = 'bg-blue-500 border-white'
                if (feedbackSichtbar) {
                  const istKorrekt = hotspots.some((hs, hi) =>
                    korrektIndices.includes(hi) && Math.hypot(hs.x - k.x, hs.y - k.y) < hs.r
                  )
                  markerClass = istKorrekt ? 'bg-green-500 border-white' : 'bg-red-500 border-white'
                }

                return (
                  <div
                    key={i}
                    className={`absolute w-6 h-6 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 ${markerClass}`}
                    style={{ left: `${k.x}%`, top: `${k.y}%` }}
                  />
                )
              })}

              {/* Korrekte Hotspots bei Feedback */}
              {feedbackSichtbar && korrektIndices.map((hi) => {
                const hs = hotspots[hi]
                if (!hs) return null
                return (
                  <div key={`correct-${hi}`} className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${hs.x}%`, top: `${hs.y}%` }}>
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-green-500 opacity-60" />
                    <span className="text-xs bg-green-500 text-white px-1 rounded mt-0.5 whitespace-nowrap">{hs.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </BildContainer>
      )}

      {!disabled && klicks.length > 0 && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.erklaerung} />}
    </div>
  )
}
