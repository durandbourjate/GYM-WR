import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'
import BildContainer from './shared/BildContainer'

export default function DragDropBildFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const zones = frage.zones || []
  const dragLabels = frage.dragLabels || []

  // Zuordnung: Label-ID → Zone-ID
  const [zuordnungen, setZuordnungen] = useState<Record<string, string>>({})
  // Aktuell ausgewähltes Label (Tap-to-Select, Tap-to-Place — Regel #18)
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(null)

  const handleLabelKlick = (labelId: string) => {
    if (disabled || feedbackSichtbar) return
    if (ausgewaehlt === labelId) {
      setAusgewaehlt(null) // Deselect
    } else {
      setAusgewaehlt(labelId)
    }
  }

  const handleZoneKlick = (zoneId: string) => {
    if (disabled || feedbackSichtbar || !ausgewaehlt) return
    setZuordnungen({ ...zuordnungen, [ausgewaehlt]: zoneId })
    setAusgewaehlt(null)
  }

  const entferneZuordnung = (labelId: string) => {
    if (disabled || feedbackSichtbar) return
    const neu = { ...zuordnungen }
    delete neu[labelId]
    setZuordnungen(neu)
  }

  const istVollstaendig = dragLabels.some(l => zuordnungen[l.id])

  const handleAbsenden = () => {
    if (!istVollstaendig || disabled) return
    onAntwort({ typ: 'dragdrop_bild', zuordnungen })
  }

  const zugeordneteLabels = (zoneId: string) =>
    dragLabels.filter(l => zuordnungen[l.id] === zoneId)

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Waehle ein Label, dann klicke auf die passende Zone im Bild.
      </p>

      {/* Bild mit Zones */}
      {frage.bild && (
        <BildContainer src={frage.bild.src} alt={frage.bild.alt}>
          {() => (
            <>
              {zones.map((z) => {
                const labelsInZone = zugeordneteLabels(z.id)
                return (
                  <div
                    key={z.id}
                    onClick={() => handleZoneKlick(z.id)}
                    className={`absolute border-2 rounded transition-colors
                      ${ausgewaehlt ? 'border-blue-400 bg-blue-100/30 cursor-pointer hover:bg-blue-200/40' : 'border-gray-400/50 bg-gray-100/20'}
                      ${disabled || feedbackSichtbar ? 'cursor-default' : ''}
                    `}
                    style={{
                      left: `${z.x}%`, top: `${z.y}%`,
                      width: `${z.w}%`, height: `${z.h}%`,
                      touchAction: 'none',
                    }}
                  >
                    {/* Labels in dieser Zone */}
                    <div className="absolute inset-0 flex flex-wrap gap-0.5 p-0.5 items-start content-start overflow-hidden">
                      {labelsInZone.map((l) => {
                        const istKorrekt = feedbackSichtbar && l.zone === z.id
                        return (
                          <span
                            key={l.id}
                            className={`text-xs px-1 py-0.5 rounded whitespace-nowrap
                              ${feedbackSichtbar
                                ? (istKorrekt ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200')
                                : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'}
                            `}
                          >
                            {l.text}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </BildContainer>
      )}

      {/* Label-Chips */}
      <div className="flex flex-wrap gap-2">
        {dragLabels.map((l) => {
          const istZugeordnet = !!zuordnungen[l.id]
          const istAusgewaehlt = ausgewaehlt === l.id
          const korrektZone = feedbackSichtbar && l.zone
          const istKorrekt = feedbackSichtbar && zuordnungen[l.id] === korrektZone

          return (
            <button
              key={l.id}
              onClick={() => istZugeordnet && !feedbackSichtbar ? entferneZuordnung(l.id) : handleLabelKlick(l.id)}
              disabled={disabled && !feedbackSichtbar}
              className={`px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors border-2
                ${istAusgewaehlt ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-300' : ''}
                ${istZugeordnet && !istAusgewaehlt && !feedbackSichtbar ? 'border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through' : ''}
                ${!istZugeordnet && !istAusgewaehlt ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400' : ''}
                ${feedbackSichtbar && istKorrekt ? 'border-green-400 bg-green-50 dark:bg-green-900/30' : ''}
                ${feedbackSichtbar && !istKorrekt && istZugeordnet ? 'border-red-400 bg-red-50 dark:bg-red-900/30' : ''}
              `}
            >
              <span className="dark:text-white">{l.text}</span>
              {istZugeordnet && !feedbackSichtbar && (
                <span className="ml-1 text-xs text-gray-400">✕</span>
              )}
            </button>
          )
        })}
      </div>

      {!disabled && istVollstaendig && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.erklaerung} />}
    </div>
  )
}
