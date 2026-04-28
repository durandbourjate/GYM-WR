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
import { istEingabeLeer } from '../../utils/ueben/leereEingabenDetektor.ts'
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from '../../utils/ueben/fragetypNormalizer'
import { gruppiereStacks, naechsteFreieLabelId } from '../../utils/dragdropBildUtils'

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

function DragDropBildAufgabe({ frage: frageRaw }: { frage: DragDropBildFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frageRaw.id)
  const bildQuelle = ermittleBildQuelle(frageRaw)

  // Bundle J Mount-Time-Normalisierung: Pre-Migration (string[]-labels, korrektesLabel) → neues Format
  const frage = useMemo(() => normalisiereDragDropBild(frageRaw), [frageRaw])
  const normAntwort = useMemo(
    () => antwort?.typ === 'dragdrop_bild'
      ? normalisiereDragDropAntwort(antwort, frage)
      : { typ: 'dragdrop_bild' as const, zuordnungen: {} as Record<string, string> },
    [antwort, frage],
  )
  const zuordnungen = normAntwort.zuordnungen
  const labelMap = useMemo(() => new Map(frage.labels.map(l => [l.id, l])), [frage.labels])
  const stacks = useMemo(() => gruppiereStacks(frage.labels, zuordnungen), [frage.labels, zuordnungen])

  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  // Tap-to-Select speichert die konkrete Label-ID (deterministisch via naechsteFreieLabelId)
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null)

  function platzierteIdsInZone(zoneId: string): string[] {
    return Object.entries(zuordnungen).filter(([, zid]) => zid === zoneId).map(([lid]) => lid)
  }

  const platzieren = useCallback((labelId: string, zoneId: string) => {
    onAntwort({
      typ: 'dragdrop_bild',
      zuordnungen: { ...zuordnungen, [labelId]: zoneId },
    })
  }, [zuordnungen, onAntwort])

  const entfernen = useCallback((labelId: string) => {
    const neu = { ...zuordnungen }
    delete neu[labelId]
    onAntwort({ typ: 'dragdrop_bild', zuordnungen: neu })
  }, [zuordnungen, onAntwort])

  const handleDragStart = useCallback((labelId: string) => {
    if (disabled) return
    setDraggingLabelId(labelId)
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZone(zoneId)
  }, [])

  const handleDragLeave = useCallback(() => setDragOverZone(null), [])

  const handleDrop = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZone(null)
    if (!draggingLabelId || disabled) return
    platzieren(draggingLabelId, zoneId)
    setDraggingLabelId(null)
  }, [draggingLabelId, disabled, platzieren])

  const handleZoneKlick = useCallback((zoneId: string) => {
    if (disabled) return
    if (selectedLabelId) {
      platzieren(selectedLabelId, zoneId)
      setSelectedLabelId(null)
    }
  }, [disabled, selectedLabelId, platzieren])

  const handlePlatziertKlick = useCallback((e: React.MouseEvent, labelId: string) => {
    if (disabled) return
    e.stopPropagation()
    entfernen(labelId)
  }, [disabled, entfernen])

  const tapStack = useCallback((text: string) => {
    if (disabled) return
    const id = naechsteFreieLabelId(frage.labels, text, zuordnungen)
    if (!id) return
    // Toggle: zweiter Tap auf denselben Stack-Text deselect
    setSelectedLabelId(prev => (prev && labelMap.get(prev)?.text === text) ? null : id)
  }, [disabled, frage.labels, zuordnungen, labelMap])

  const violettOutline = !feedbackSichtbar && istEingabeLeer(frageRaw, antwort, 'gesamt')
    ? 'border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40'
    : 'border-transparent'

  const selectedText = selectedLabelId ? labelMap.get(selectedLabelId)?.text : null

  return (
    <div className="flex flex-col gap-5">
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

      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      <div data-testid="dragdrop_bild-input-area" className={`relative block w-full max-w-2xl rounded-xl border ${violettOutline} p-1`} style={{ touchAction: 'manipulation' }}>
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

          {(frage.zielzonen ?? []).map((zone) => {
            const platzierteIds = platzierteIdsInZone(zone.id)
            const istBelegt = platzierteIds.length > 0
            const istDragOver = dragOverZone === zone.id

            return (
              <div
                key={zone.id}
                data-testid={`zone-${zone.id}`}
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
                  return { left: `${b.x}%`, top: `${b.y}%`, width: `${b.breite}%`, height: `${b.hoehe}%` }
                })()}
                onDragOver={(e) => handleDragOver(e, zone.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, zone.id)}
                onClick={() => handleZoneKlick(zone.id)}
              >
                {platzierteIds.map(lid => (
                  <span
                    key={lid}
                    data-testid={`platziert-${lid}`}
                    onClick={(e) => handlePlatziertKlick(e, lid)}
                    className={`px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-slate-800 dark:text-slate-100 shadow-sm text-xs truncate max-w-full
                      ${!disabled ? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:ring-1 hover:ring-red-400' : ''}
                    `}
                    title={!disabled ? 'Klicken zum Entfernen' : undefined}
                  >
                    {labelMap.get(lid)?.text ?? ''}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {!disabled && selectedText && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
          &laquo;{selectedText}&raquo; ausgewählt — tippe auf eine Zone zum Platzieren
        </p>
      )}
      {!disabled && (
        <div className="flex flex-wrap gap-2" data-testid="pool">
          {stacks.length > 0 ? (
            stacks.map(s => {
              const istSelektiert = selectedLabelId !== null && labelMap.get(selectedLabelId)?.text === s.text
              const draggingId = draggingLabelId !== null && labelMap.get(draggingLabelId)?.text === s.text ? draggingLabelId : null
              const dragKandidatId = naechsteFreieLabelId(frage.labels, s.text, zuordnungen)
              return (
                <div
                  key={s.text}
                  data-testid={`pool-stack-${s.text}`}
                  draggable={!disabled && !!dragKandidatId}
                  onDragStart={() => dragKandidatId && handleDragStart(dragKandidatId)}
                  onDragEnd={() => setDraggingLabelId(null)}
                  onClick={() => tapStack(s.text)}
                  aria-pressed={istSelektiert}
                  className={`px-3 py-1.5 text-sm rounded-lg border cursor-grab select-none transition-all
                    ${istSelektiert
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 ring-2 ring-green-400 dark:ring-green-500'
                      : draggingId
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 opacity-60'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm'
                    }
                    active:cursor-grabbing
                  `}
                >
                  {s.text}{s.anzahl > 1 ? ` ×${s.anzahl}` : ''}
                  {istSelektiert && <span className="ml-1 text-green-600 dark:text-green-400">&#x2713;</span>}
                </div>
              )
            })
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              Alle Labels zugeordnet. Auf Zone tippen zum Entfernen.
            </p>
          )}
        </div>
      )}

      {disabled && (
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
          {(frage.zielzonen ?? []).map((zone) => {
            const texte = platzierteIdsInZone(zone.id)
              .map(lid => labelMap.get(lid)?.text ?? '')
              .filter(Boolean)
            return (
              <div key={zone.id} className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">Zone:</span>
                <span>{texte.length > 0 ? texte.join(', ') : '(leer)'}</span>
              </div>
            )
          })}
        </div>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '✓ Richtig!' : '✗ Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}

function DragDropBildLoesung({ frage: frageRaw, antwort: antwortRaw }: { frage: DragDropBildFrageType; antwort: Antwort | null }) {
  const bildQuelle = ermittleBildQuelle(frageRaw)
  const frage = useMemo(() => normalisiereDragDropBild(frageRaw), [frageRaw])
  const normAntwort = useMemo(
    () => antwortRaw?.typ === 'dragdrop_bild'
      ? normalisiereDragDropAntwort(antwortRaw, frage)
      : { typ: 'dragdrop_bild' as const, zuordnungen: {} as Record<string, string> },
    [antwortRaw, frage],
  )
  const zuordnungen = normAntwort.zuordnungen
  const zielzonen = frage.zielzonen ?? []
  const labelMap = useMemo(() => new Map(frage.labels.map(l => [l.id, l])), [frage.labels])

  function texteInZone(zoneId: string): string[] {
    return Object.entries(zuordnungen)
      .filter(([, zid]) => zid === zoneId)
      .map(([lid]) => (labelMap.get(lid)?.text ?? '').trim())
      .filter(Boolean)
  }
  function istZoneKorrekt(zone: typeof zielzonen[number]): boolean {
    const sollSet = new Set(zone.korrekteLabels.map(s => s.trim().toLowerCase()))
    return texteInZone(zone.id).some(t => sollSet.has(t.toLowerCase()))
  }

  return (
    <div className="flex flex-col gap-5">
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

      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

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

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {zielzonen.map((z) => {
              const istKorrekt = istZoneKorrekt(z)
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

          {zielzonen.map((z) => {
            const texte = texteInZone(z.id)
            const istKorrekt = istZoneKorrekt(z)
            const susAntwort = texte.length > 0 ? texte.join(', ') : undefined
            const erwartet = z.korrekteLabels.join(' / ')
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
                  susAntwort={istKorrekt ? erwartet : susAntwort}
                  korrekteAntwort={erwartet}
                  placeholder="leer gelassen"
                />
              </div>
            )
          })}
        </div>
      </div>

      {zielzonen.some((z) => !!z.erklaerung) && (
        <div className="flex flex-col gap-2">
          {zielzonen.map((z, i) => {
            if (!z.erklaerung) return null
            return (
              <div
                key={z.id}
                className="pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400"
              >
                {'\u{1F4A1}'} <strong>Zone {i + 1} ({z.korrekteLabels.join(' / ')}):</strong> {z.erklaerung}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
