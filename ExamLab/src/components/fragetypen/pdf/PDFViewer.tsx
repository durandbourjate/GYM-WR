import { useRef, useState, useEffect, useCallback } from 'react'
import { PDFSeite } from './PDFSeite.tsx'
import type { PDFAnnotation, PDFToolbarWerkzeug, PDFKategorie, ZoomStufe } from './PDFTypes.ts'
import type { usePDFRenderer } from './usePDFRenderer.ts'

interface Props {
  renderer: ReturnType<typeof usePDFRenderer>
  seitenAnzahl: number
  zoom: ZoomStufe
  annotationen: PDFAnnotation[]
  aktivesWerkzeug: PDFToolbarWerkzeug
  aktiveFarbe: string
  kategorien?: PDFKategorie[]
  aktiveKategorieId?: string
  onAnnotationHinzufuegen: (a: PDFAnnotation) => void
  onAnnotationLoeschen: (id: string) => void
  onAnnotationEditieren?: (id: string, updates: Partial<PDFAnnotation>) => void
  textRotation?: 0 | 90 | 180 | 270
  textGroesse?: number
  textFett?: boolean
  selectedAnnotation?: string | null
  onSelectedAnnotationChange?: (id: string | null) => void
  readOnly?: boolean
}

/** A4 base dimensions in PDF points */
const A4_BREITE = 595
const A4_HOEHE = 842

export function PDFViewer({
  renderer, seitenAnzahl, zoom, annotationen, aktivesWerkzeug, aktiveFarbe,
  kategorien, aktiveKategorieId, textRotation, textGroesse, textFett,
  selectedAnnotation: selectedAnnotationProp, onSelectedAnnotationChange,
  onAnnotationHinzufuegen, onAnnotationLoeschen,
  onAnnotationEditieren, readOnly,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sichtbareSeiten, setSichtbareSeiten] = useState<Set<number>>(new Set([0]))
  const sentinelRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Scaled placeholder dimensions
  const placeholderBreite = Math.round(A4_BREITE * zoom)
  const placeholderHoehe = Math.round(A4_HOEHE * zoom)

  // IntersectionObserver: track which page sentinels are visible
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        setSichtbareSeiten((prev) => {
          const next = new Set(prev)
          for (const entry of entries) {
            const seite = Number((entry.target as HTMLElement).dataset.seite)
            if (entry.isIntersecting) {
              next.add(seite)
            } else {
              next.delete(seite)
            }
          }
          return next
        })
      },
      { root: container, rootMargin: '200px 0px' },
    )

    // Observe all sentinel elements
    for (const [, el] of sentinelRefs.current) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [seitenAnzahl])

  // Register sentinel ref callback
  const setSentinelRef = useCallback((seitenNr: number, el: HTMLDivElement | null) => {
    if (el) {
      sentinelRefs.current.set(seitenNr, el)
    } else {
      sentinelRefs.current.delete(seitenNr)
    }
  }, [])

  // Determine which pages to render: visible + 1 buffer on each side
  const gerenderteSeiten = new Set<number>()
  for (const seite of sichtbareSeiten) {
    gerenderteSeiten.add(seite)
    if (seite > 0) gerenderteSeiten.add(seite - 1)
    if (seite < seitenAnzahl - 1) gerenderteSeiten.add(seite + 1)
  }

  // Build page array
  const seiten = Array.from({ length: seitenAnzahl }, (_, i) => i)

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto overflow-x-hidden bg-slate-200 dark:bg-slate-900 rounded-lg"
      style={{ maxHeight: '85vh', touchAction: 'pan-x pan-y' }}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        {seiten.map((seitenNr) => {
          const sollRendern = gerenderteSeiten.has(seitenNr)
          const seitenAnnotationen = annotationen.filter((a) => a.seite === seitenNr)

          return (
            <div
              key={seitenNr}
              ref={(el) => setSentinelRef(seitenNr, el)}
              data-seite={seitenNr}
              style={{ minWidth: placeholderBreite, minHeight: placeholderHoehe }}
            >
              {sollRendern ? (
                <PDFSeite
                  seitenNr={seitenNr}
                  zoom={zoom}
                  renderer={renderer}
                  annotationen={seitenAnnotationen}
                  aktivesWerkzeug={aktivesWerkzeug}
                  aktiveFarbe={aktiveFarbe}
                  kategorien={kategorien}
                  aktiveKategorieId={aktiveKategorieId}
                  textRotation={textRotation}
                  textGroesse={textGroesse}
                  textFett={textFett}
                  selectedAnnotation={selectedAnnotationProp}
                  onSelectedAnnotationChange={onSelectedAnnotationChange}
                  onAnnotationHinzufuegen={onAnnotationHinzufuegen}
                  onAnnotationLoeschen={onAnnotationLoeschen}
                  onAnnotationEditieren={onAnnotationEditieren}
                  readOnly={readOnly}
                />
              ) : (
                <div
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center"
                  style={{ width: placeholderBreite, height: placeholderHoehe }}
                >
                  <span className="text-slate-400 dark:text-slate-500 text-sm">
                    Seite {seitenNr + 1}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
