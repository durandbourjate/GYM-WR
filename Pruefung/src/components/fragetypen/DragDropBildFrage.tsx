import { useState, useCallback } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { DragDropBildFrage as DragDropBildFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'

interface Props {
  frage: DragDropBildFrageType
}

export default function DragDropBildFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)

  const aktuelleAntwort = antworten[frage.id]
  const zuordnungen: Record<string, string> =
    aktuelleAntwort?.typ === 'dragdrop_bild' ? aktuelleAntwort.zuordnungen : {}

  // Dragging State
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)

  // Labels, die bereits einer Zone zugeordnet sind
  const zugeordneteLabels = new Set(Object.values(zuordnungen))

  // Verfuegbare Labels (Pool)
  const verfuegbareLabels = frage.labels.filter(l => !zugeordneteLabels.has(l))

  const handleDragStart = useCallback((label: string) => {
    if (abgegeben) return
    setDraggingLabel(label)
  }, [abgegeben])

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
    if (!draggingLabel || abgegeben) return

    // Wenn Zone bereits belegt ist, altes Label zurueck in Pool
    const neueZuordnungen = { ...zuordnungen }
    neueZuordnungen[zoneId] = draggingLabel
    setAntwort(frage.id, { typ: 'dragdrop_bild', zuordnungen: neueZuordnungen })
    setDraggingLabel(null)
  }, [draggingLabel, abgegeben, zuordnungen, setAntwort, frage.id])

  const handleZoneKlick = useCallback((zoneId: string) => {
    if (abgegeben) return
    // Label aus Zone entfernen (zurueck in Pool)
    if (zuordnungen[zoneId]) {
      const neueZuordnungen = { ...zuordnungen }
      delete neueZuordnungen[zoneId]
      setAntwort(frage.id, { typ: 'dragdrop_bild', zuordnungen: neueZuordnungen })
    }
  }, [abgegeben, zuordnungen, setAntwort, frage.id])

  const alleZugeordnet = frage.zielzonen.every(z => zuordnungen[z.id])

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
          {frage.zielzonen.length} {frage.zielzonen.length === 1 ? 'Zone' : 'Zonen'}
        </span>
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Bild mit Zielzonen */}
      <div className={`relative inline-block ${!abgegeben && !alleZugeordnet ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`}>
        <div className="relative">
          <img
            src={frage.bildUrl}
            alt="Drag & Drop Bild"
            className="max-w-full rounded-lg select-none"
            style={{ objectFit: 'contain' }}
            draggable={false}
          />

          {/* Zielzonen */}
          {frage.zielzonen.map((zone) => {
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
                  ${!abgegeben && istBelegt ? 'cursor-pointer hover:bg-red-500/10 hover:border-red-400' : ''}
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
                title={istBelegt && !abgegeben ? 'Klicken zum Entfernen' : undefined}
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
      {!abgegeben && (
        <div className="flex flex-wrap gap-2">
          {verfuegbareLabels.length > 0 ? (
            verfuegbareLabels.map((label, idx) => (
              <div
                key={`${label}-${idx}`}
                draggable={!abgegeben}
                onDragStart={() => handleDragStart(label)}
                onDragEnd={() => setDraggingLabel(null)}
                className={`px-3 py-1.5 text-sm rounded-lg border cursor-grab select-none transition-all
                  ${draggingLabel === label
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm'
                  }
                  active:cursor-grabbing
                `}
              >
                {label}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              Alle Labels zugeordnet.
            </p>
          )}
        </div>
      )}

      {/* Abgegeben: Zuordnungen anzeigen */}
      {abgegeben && (
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
          {frage.zielzonen.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2">
              <span className="text-slate-400">Zone:</span>
              <span>{zuordnungen[zone.id] || '(leer)'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
