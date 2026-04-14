import { useState, useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { DragDropBildFrage as DragDropBildFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'

interface Props {
  frage: DragDropBildFrageType
}

export default function DragDropBildFrage({ frage }: Props) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const zuordnungen: Record<string, string> =
    antwort?.typ === 'dragdrop_bild' ? antwort.zuordnungen : {}

  // Dragging State (Desktop: HTML5 DnD, Touch: Tap-to-select + Tap-to-place)
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  // Tap-Select: Label wurde per Touch ausgewählt, wartet auf Zone-Tap
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  // Labels, die bereits einer Zone zugeordnet sind
  const zugeordneteLabels = new Set(Object.values(zuordnungen))

  // Verfuegbare Labels (Pool)
  const verfuegbareLabels = (frage.labels ?? []).filter(l => !zugeordneteLabels.has(l))

  const handleDragStart = useCallback((label: string) => {
    if (disabled) return
    setDraggingLabel(label)
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZone(zoneId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverZone(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZone(null)
    if (!draggingLabel || disabled) return

    // Wenn Zone bereits belegt ist, altes Label zurueck in Pool
    const neueZuordnungen = { ...zuordnungen }
    neueZuordnungen[zoneId] = draggingLabel
    onAntwort({ typ: 'dragdrop_bild', zuordnungen: neueZuordnungen })
    setDraggingLabel(null)
  }, [draggingLabel, disabled, zuordnungen, onAntwort, frage.id])

  const handleZoneKlick = useCallback((zoneId: string) => {
    if (disabled) return
    // Tap-to-place: Wenn ein Label ausgewählt ist, in diese Zone platzieren
    if (selectedLabel) {
      const neueZuordnungen = { ...zuordnungen }
      neueZuordnungen[zoneId] = selectedLabel
      onAntwort({ typ: 'dragdrop_bild', zuordnungen: neueZuordnungen })
      setSelectedLabel(null)
      return
    }
    // Label aus Zone entfernen (zurueck in Pool)
    if (zuordnungen[zoneId]) {
      const neueZuordnungen = { ...zuordnungen }
      delete neueZuordnungen[zoneId]
      onAntwort({ typ: 'dragdrop_bild', zuordnungen: neueZuordnungen })
    }
  }, [disabled, zuordnungen, onAntwort, frage.id, selectedLabel])

  /** Label per Touch auswählen (Tap-to-select) */
  const handleLabelTap = useCallback((label: string) => {
    if (disabled) return
    setSelectedLabel(prev => prev === label ? null : label) // Toggle
  }, [disabled])

  const alleZugeordnet = (frage.zielzonen ?? []).every(z => zuordnungen[z.id])

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
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {(frage.zielzonen ?? []).length} {(frage.zielzonen ?? []).length === 1 ? 'Zone' : 'Zonen'}
        </span>
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Bild mit Zielzonen */}
      <div className={`relative inline-block ${!disabled && !alleZugeordnet ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`} style={{ touchAction: 'manipulation' }}>
        <div className="relative overflow-hidden w-fit max-w-full">
          <img
            src={frage.bildUrl}
            alt="Drag & Drop Bild"
            className="block max-w-full rounded-lg select-none"
            style={{ objectFit: 'contain' }}
            draggable={false}
          />

          {/* Zielzonen */}
          {(frage.zielzonen ?? []).map((zone) => {
            const istBelegt = !!zuordnungen[zone.id]
            const istDragOver = dragOverZone === zone.id

            return (
              <div
                key={zone.id}
                className={`absolute flex items-center justify-center text-xs font-medium rounded transition-colors select-none
                  ${istBelegt
                    ? 'bg-blue-500/20 border-2 border-blue-500 dark:bg-blue-400/20 dark:border-blue-400'
                    : istDragOver
                      ? 'bg-green-500/20 border-2 border-green-500 border-dashed dark:bg-green-400/20 dark:border-green-400'
                      : 'bg-slate-500/10 border-2 border-dashed border-slate-400 dark:border-slate-500'
                  }
                  ${!disabled && istBelegt ? 'cursor-pointer hover:bg-red-500/10 hover:border-red-400' : ''}
                `}
                style={{
                  left: `${zone.position.x}%`,
                  top: `${zone.position.y}%`,
                  width: `${zone.position.breite}%`,
                  height: `${zone.position.hoehe}%`,
                }}
                onDragOver={(e) => handleDragOver(e, zone.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, zone.id)}
                onClick={() => handleZoneKlick(zone.id)}
                title={istBelegt && !disabled ? 'Klicken zum Entfernen' : undefined}
              >
                {istBelegt && (
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-slate-800 dark:text-slate-100 shadow-sm text-xs truncate max-w-full">
                    {zuordnungen[zone.id]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Label-Pool */}
      {!disabled && selectedLabel && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
          &laquo;{selectedLabel}&raquo; ausgewählt — tippe auf eine Zone zum Platzieren
        </p>
      )}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          {verfuegbareLabels.length > 0 ? (
            verfuegbareLabels.map((label, idx) => (
              <div
                key={`${label}-${idx}`}
                draggable={!disabled}
                onDragStart={() => handleDragStart(label)}
                onDragEnd={() => setDraggingLabel(null)}
                onClick={() => handleLabelTap(label)}
                className={`px-3 py-1.5 text-sm rounded-lg border cursor-grab select-none transition-all
                  ${selectedLabel === label
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 ring-2 ring-green-400 dark:ring-green-500'
                    : draggingLabel === label
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm'
                  }
                  active:cursor-grabbing
                `}
              >
                {label}
                {selectedLabel === label && <span className="ml-1 text-green-600 dark:text-green-400">&#x2713;</span>}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              Alle Labels zugeordnet. Auf Zone tippen zum Entfernen.
            </p>
          )}
        </div>
      )}

      {/* Abgegeben: Zuordnungen anzeigen */}
      {disabled && (
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
          {(frage.zielzonen ?? []).map((zone) => (
            <div key={zone.id} className="flex items-center gap-2">
              <span className="text-slate-400">Zone:</span>
              <span>{zuordnungen[zone.id] || '(leer)'}</span>
            </div>
          ))}
        </div>
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
