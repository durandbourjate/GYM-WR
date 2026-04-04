import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import type { DragDropBildFrage as DragDropBildFrageTyp } from '../../types/fragen'
import FeedbackBox from './FeedbackBox'
import BildContainer from './shared/BildContainer'

export default function DragDropBildFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing
  if (frage.typ !== 'dragdrop_bild') return null
  const ddFrage = frage as DragDropBildFrageTyp

  const zielzonen = ddFrage.zielzonen || []
  const labels = ddFrage.labels || []

  // Zuordnung: Label (string) → Zone-ID
  const [zuordnungen, setZuordnungen] = useState<Record<string, string>>({})
  // Aktuell ausgewähltes Label (Tap-to-Select, Tap-to-Place — Regel #18)
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(null)

  const handleLabelKlick = (label: string) => {
    if (disabled || feedbackSichtbar) return
    if (ausgewaehlt === label) {
      setAusgewaehlt(null) // Deselect
    } else {
      setAusgewaehlt(label)
    }
  }

  const handleZoneKlick = (zoneId: string) => {
    if (disabled || feedbackSichtbar || !ausgewaehlt) return
    setZuordnungen({ ...zuordnungen, [ausgewaehlt]: zoneId })
    setAusgewaehlt(null)
  }

  const entferneZuordnung = (label: string) => {
    if (disabled || feedbackSichtbar) return
    const neu = { ...zuordnungen }
    delete neu[label]
    setZuordnungen(neu)
  }

  const istVollstaendig = labels.some(l => zuordnungen[l])

  const handleAbsenden = () => {
    if (!istVollstaendig || disabled) return
    onAntwort({ typ: 'dragdrop_bild', zuordnungen })
  }

  const zugeordneteLabels = (zoneId: string) =>
    labels.filter(l => zuordnungen[l] === zoneId)

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Waehle ein Label, dann klicke auf die passende Zone im Bild.
      </p>

      {/* Bild mit Zones */}
      {ddFrage.bildUrl && (
        <BildContainer src={ddFrage.bildUrl} alt="DragDrop-Bild">
          {() => (
            <>
              {zielzonen.map((zone) => {
                const labelsInZone = zugeordneteLabels(zone.id)
                return (
                  <div
                    key={zone.id}
                    onClick={() => handleZoneKlick(zone.id)}
                    className={`absolute border-2 rounded transition-colors
                      ${ausgewaehlt ? 'border-blue-400 bg-blue-100/30 cursor-pointer hover:bg-blue-200/40' : 'border-gray-400/50 bg-gray-100/20'}
                      ${disabled || feedbackSichtbar ? 'cursor-default' : ''}
                    `}
                    style={{
                      left: `${zone.position.x}%`, top: `${zone.position.y}%`,
                      width: `${zone.position.breite}%`, height: `${zone.position.hoehe}%`,
                      touchAction: 'none',
                    }}
                  >
                    {/* Labels in dieser Zone */}
                    <div className="absolute inset-0 flex flex-wrap gap-0.5 p-0.5 items-start content-start overflow-hidden">
                      {labelsInZone.map((label) => {
                        const istKorrekt = feedbackSichtbar && zone.korrektesLabel === label
                        return (
                          <span
                            key={label}
                            className={`text-xs px-1 py-0.5 rounded whitespace-nowrap
                              ${feedbackSichtbar
                                ? (istKorrekt ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200')
                                : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'}
                            `}
                          >
                            {label}
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
        {labels.map((label) => {
          const istZugeordnet = !!zuordnungen[label]
          const istAusgewaehlt = ausgewaehlt === label
          // Finde die Zone, in die dieses Label korrekt gehört
          const korrekteZone = zielzonen.find(z => z.korrektesLabel === label)
          const istKorrekt = feedbackSichtbar && korrekteZone && zuordnungen[label] === korrekteZone.id

          return (
            <button
              key={label}
              onClick={() => istZugeordnet && !feedbackSichtbar ? entferneZuordnung(label) : handleLabelKlick(label)}
              disabled={disabled && !feedbackSichtbar}
              className={`px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors border-2
                ${istAusgewaehlt ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-300' : ''}
                ${istZugeordnet && !istAusgewaehlt && !feedbackSichtbar ? 'border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through' : ''}
                ${!istZugeordnet && !istAusgewaehlt ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400' : ''}
                ${feedbackSichtbar && istKorrekt ? 'border-green-400 bg-green-50 dark:bg-green-900/30' : ''}
                ${feedbackSichtbar && !istKorrekt && istZugeordnet ? 'border-red-400 bg-red-50 dark:bg-red-900/30' : ''}
              `}
            >
              <span className="dark:text-white">{label}</span>
              {istZugeordnet && !feedbackSichtbar && (
                <span className="ml-1 text-xs text-gray-400">✕</span>
              )}
            </button>
          )
        })}
      </div>

      {!disabled && istVollstaendig && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={ddFrage.musterlosung} />}
    </div>
  )
}
