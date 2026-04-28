import { useState, useCallback, useMemo } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { DragDropBildFrage as DragDropBildFrageType } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { toAssetUrl } from '../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'
import { istZoneWohlgeformt } from '../../utils/zonen/migriereZone.ts'
import { ZoneLabel } from '@shared/ui/ZoneLabel'

interface Props {
  frage: DragDropBildFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

/** Bounding-Box aus Polygon-Punkten — SuS sieht Zone als Rechteck (Phase 2). */
function zoneBBox(punkte: { x: number; y: number }[]): { x: number; y: number; breite: number; hoehe: number } {
  if (!Array.isArray(punkte) || punkte.length === 0) return { x: 0, y: 0, breite: 0, hoehe: 0 }
  const xs = punkte.map(p => p.x), ys = punkte.map(p => p.y)
  const minX = Math.min(...xs), minY = Math.min(...ys)
  return { x: minX, y: minY, breite: Math.max(...xs) - minX, hoehe: Math.max(...ys) - minY }
}

export default function DragDropBildFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  // Error-Boundary: Zonen müssen im neuen Format (punkte[]) vorliegen
  const zonenUngueltig =
    Array.isArray(frage.zielzonen) && frage.zielzonen.length > 0 &&
    frage.zielzonen.some(z => !istZoneWohlgeformt(z))
  if (zonenUngueltig) {
    return (
      <div className="p-4 rounded border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
        Diese Frage konnte nicht geladen werden. Bitte LP informieren.
      </div>
    )
  }
  if (modus === 'loesung') {
    return <DragDropBildLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <DragDropBildAufgabe frage={frage} />
}

function DragDropBildAufgabe({ frage }: { frage: DragDropBildFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const bildQuelle = ermittleBildQuelle(frage)

  // Antwort-Schema: zuordnungen[labelText] = zoneId (wie in korrektur.ts erwartet).
  // Ein Label liegt in höchstens einer Zone; eine Zone kann beliebig viele Labels halten.
  const zuordnungen: Record<string, string> =
    antwort?.typ === 'dragdrop_bild' ? antwort.zuordnungen : {}

  // Pool-Dedupe (Bundle H Phase 9.2): case-sensitive, getrimmt.
  const dedupedLabels = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of (frage.labels ?? [])) {
      const l = (typeof raw === 'string' ? raw : (raw as { text?: string })?.text ?? '').trim()
      if (!l) continue
      if (seen.has(l)) continue
      seen.add(l)
      out.push(l)
    }
    return out
  }, [frage.labels])

  // Dragging State (Desktop: HTML5 DnD, Touch: Tap-to-select + Tap-to-place)
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const labelZone = (label: string): string | undefined => zuordnungen[label]
  const labelsInZone = (zoneId: string): string[] =>
    dedupedLabels.filter(l => zuordnungen[l] === zoneId)
  const verfuegbareLabels = dedupedLabels.filter(l => !labelZone(l))

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
                style={(() => {
                  const b = zoneBBox(zone.punkte)
                  return {
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.breite}%`,
                    height: `${b.hoehe}%`,
                  }
                })()}
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

function DragDropBildLoesung({ frage, antwort }: { frage: DragDropBildFrageType; antwort: Antwort | null }) {
  const bildQuelle = ermittleBildQuelle(frage)
  const zuordnungen: Record<string, string> =
    antwort?.typ === 'dragdrop_bild' ? antwort.zuordnungen : {}

  const zielzonen = frage.zielzonen ?? []

  // Pool-Dedupe (Bundle H Phase 9.2): case-sensitive, getrimmt.
  const alleLabels = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of (frage.labels ?? [])) {
      const l = (typeof raw === 'string' ? raw : (raw as { text?: string })?.text ?? '').trim()
      if (!l) continue
      if (seen.has(l)) continue
      seen.add(l)
      out.push(l)
    }
    return out
  }, [frage.labels])

  function labelsInZone(zoneId: string): string[] {
    return alleLabels.filter(l => zuordnungen[l] === zoneId)
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
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Bild mit Zielzonen-BBox + ZoneLabel */}
      <div className="relative block w-full max-w-2xl">
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

          {/* SVG-Overlay: Polygon-Rahmen pro Zone */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {zielzonen.map((z) => {
              const istKorrekt = zuordnungen[z.korrektesLabel] === z.id
              const points = (z.punkte ?? []).map(p => `${p.x},${p.y}`).join(' ')
              return (
                <polygon
                  key={z.id}
                  points={points}
                  fill={istKorrekt ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.08)'}
                  stroke={istKorrekt ? '#16a34a' : '#dc2626'}
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>

          {/* ZoneLabel pro Zone, zentriert in der BBox */}
          {zielzonen.map((z) => {
            const istKorrekt = zuordnungen[z.korrektesLabel] === z.id
            const susLabels = labelsInZone(z.id)
            const susAntwort = susLabels.length > 0 ? susLabels.join(', ') : undefined
            const bb = zoneBBox(z.punkte)
            const centerX = bb.x + bb.breite / 2
            const centerY = bb.y + bb.hoehe / 2
            return (
              <div
                key={z.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${centerX}%`, top: `${centerY}%` }}
              >
                <ZoneLabel
                  variant={istKorrekt ? 'korrekt' : 'falsch'}
                  susAntwort={istKorrekt ? z.korrektesLabel : susAntwort}
                  korrekteAntwort={z.korrektesLabel}
                  placeholder="leer gelassen"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Erklärungen pro Zone */}
      {zielzonen.some((z) => !!z.erklaerung) && (
        <div className="flex flex-col gap-2">
          {zielzonen.map((z, i) => {
            if (!z.erklaerung) return null
            return (
              <div
                key={z.id}
                className="pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400"
              >
                {'\u{1F4A1}'} <strong>Zone {i + 1} ({z.korrektesLabel}):</strong> {z.erklaerung}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
