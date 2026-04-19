import { useState, useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { DragDropBildFrage as DragDropBildFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { toAssetUrl } from '../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'

interface Props {
  frage: DragDropBildFrageType
}

export default function DragDropBildFrage({ frage }: Props) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const bildQuelle = ermittleBildQuelle(frage)

  // Antwort-Schema: zuordnungen[labelText] = zoneId (wie in korrektur.ts erwartet).
  // Ein Label liegt in höchstens einer Zone; eine Zone kann beliebig viele Labels halten.
  const zuordnungen: Record<string, string> =
    antwort?.typ === 'dragdrop_bild' ? antwort.zuordnungen : {}

  // Dragging State (Desktop: HTML5 DnD, Touch: Tap-to-select + Tap-to-place)
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const labelZone = (label: string): string | undefined => zuordnungen[label]
  const labelsInZone = (zoneId: string): string[] =>
    (frage.labels ?? []).filter(l => zuordnungen[l] === zoneId)
  const verfuegbareLabels = (frage.labels ?? []).filter(l => !labelZone(l))

  const platzieren = useCallback((label: string, zoneId: string) => {
    onAntwort({
      typ: 'dragdrop_bild',
      zuordnungen: { ...zuordnungen, [label]: zoneId },
    })
  }, [zuordnungen, onAntwort])

  const entfernen = useCallback((label: string) => {
    const neu = { ...zuordnungen }
    delete neu[label]
    onAntwort({ typ: 'dragdrop_bild', zuordnungen: neu })
  }, [zuordnungen, onAntwort])

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
    platzieren(draggingLabel, zoneId)
    setDraggingLabel(null)
  }, [draggingLabel, disabled, platzieren])

  const handleZoneKlick = useCallback((zoneId: string) => {
    if (disabled) return
    if (selectedLabel) {
      platzieren(selectedLabel, zoneId)
      setSelectedLabel(null)
    }
  }, [disabled, selectedLabel, platzieren])

  const handleLabelInZoneKlick = useCallback((e: React.MouseEvent, label: string) => {
    if (disabled) return
    e.stopPropagation() // Verhindert Zone-Click (der würde selectedLabel platzieren)
    entfernen(label)
  }, [disabled, entfernen])

  const handleLabelTap = useCallback((label: string) => {
    if (disabled) return
    setSelectedLabel(prev => prev === label ? null : label) // Toggle
  }, [disabled])

  const alleZugeordnet = verfuegbareLabels.length === 0

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

      {/* Bild mit Zielzonen — feste Container-Breite, damit SVGs ohne explizite width-Attribute
          (nur viewBox) sichtbar sind statt auf 0 zu kollabieren */}
      <div className={`relative block w-full max-w-2xl ${!disabled && !alleZugeordnet ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`} style={{ touchAction: 'manipulation' }}>
        <div className="relative overflow-hidden w-full">
          {bildQuelle && (
            <img
              src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)}
              alt="Drag & Drop Bild"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          )}

          {/* Zielzonen — enthalten 0..N Labels, vertikal gestapelt */}
          {(frage.zielzonen ?? []).map((zone) => {
            const labels = labelsInZone(zone.id)
            const istBelegt = labels.length > 0
            const istDragOver = dragOverZone === zone.id

            return (
              <div
                key={zone.id}
                className={`absolute flex flex-col items-center justify-center gap-1 p-1 rounded transition-colors select-none overflow-auto
                  ${istBelegt
                    ? 'bg-blue-500/20 border-2 border-blue-500 dark:bg-blue-400/20 dark:border-blue-400'
                    : istDragOver
                      ? 'bg-green-500/20 border-2 border-green-500 border-dashed dark:bg-green-400/20 dark:border-green-400'
                      : 'bg-slate-500/10 border-2 border-dashed border-slate-400 dark:border-slate-500'
                  }
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
              >
                {labels.map(label => (
                  <span
                    key={label}
                    onClick={(e) => handleLabelInZoneKlick(e, label)}
                    className={`px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-slate-800 dark:text-slate-100 shadow-sm text-xs truncate max-w-full
                      ${!disabled ? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:ring-1 hover:ring-red-400' : ''}
                    `}
                    title={!disabled ? 'Klicken zum Entfernen' : undefined}
                  >
                    {label}
                  </span>
                ))}
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
          {(frage.zielzonen ?? []).map((zone) => {
            const labels = labelsInZone(zone.id)
            return (
              <div key={zone.id} className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">Zone:</span>
                <span>{labels.length > 0 ? labels.join(', ') : '(leer)'}</span>
              </div>
            )
          })}
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
