import type {
  PDFAnnotation, PDFHighlightAnnotation, PDFKommentarAnnotation,
  PDFFreihandAnnotation, PDFLabelAnnotation, PDFTextAnnotation,
} from '../PDFTypes.ts'
import type { PDFSeitenInfo } from '../PDFTypes.ts'
import { findeSpanRectsRelativ, berechneFallbackRects } from './pdfSelection.ts'

// --- SVG overlay rendering ---

export function renderSVGOverlay(
  annotationen: PDFAnnotation[],
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
  selectedAnnotationId?: string | null,
): React.ReactNode[] {
  const elements: React.ReactNode[] = []

  for (const ann of annotationen) {
    switch (ann.werkzeug) {
      case 'highlighter':
        elements.push(...renderHighlight(ann, seitenInfo, textLayer))
        break
      case 'label':
        elements.push(...renderLabel(ann, seitenInfo, textLayer))
        break
      case 'kommentar':
        elements.push(renderKommentarMarker(ann, seitenInfo))
        break
      case 'freihand':
        elements.push(renderFreihand(ann, seitenInfo, ann.id === selectedAnnotationId))
        break
      case 'text':
        elements.push(renderTextAnnotation(ann, seitenInfo, ann.id === selectedAnnotationId))
        break
    }
  }

  return elements
}

function renderHighlight(
  ann: PDFHighlightAnnotation,
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
): React.ReactNode[] {
  // Use text items to compute approximate rects if no DOM available
  const rects = textLayer
    ? findeSpanRectsRelativ(textLayer, ann.textRange.startOffset, ann.textRange.endOffset)
    : berechneFallbackRects(ann.textRange, seitenInfo)

  return rects.map((r, i) => (
    <rect
      key={`hl-${ann.id}-${i}`}
      data-annotation-id={ann.id}
      x={r.x} y={r.y} width={r.w} height={r.h}
      fill={ann.farbe} fillOpacity={0.35}
      className="pointer-events-auto cursor-pointer"
    />
  ))
}

function renderLabel(
  ann: PDFLabelAnnotation,
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
): React.ReactNode[] {
  const rects = textLayer
    ? findeSpanRectsRelativ(textLayer, ann.textRange.startOffset, ann.textRange.endOffset)
    : berechneFallbackRects(ann.textRange, seitenInfo)

  const nodes: React.ReactNode[] = rects.map((r, i) => (
    <rect
      key={`lbl-${ann.id}-${i}`}
      data-annotation-id={ann.id}
      x={r.x} y={r.y} width={r.w} height={r.h}
      fill={ann.farbe} fillOpacity={0.25}
      stroke={ann.farbe} strokeWidth={1}
      className="pointer-events-auto cursor-pointer"
    />
  ))

  // Add a small badge at the start of the first rect
  if (rects.length > 0) {
    const first = rects[0]
    nodes.push(
      <g key={`lbl-badge-${ann.id}`} data-annotation-id={ann.id}
        className="pointer-events-auto cursor-pointer">
        <rect x={first.x} y={first.y - 14} width={50} height={14}
          rx={3} fill={ann.farbe} />
        <text x={first.x + 4} y={first.y - 3}
          fontSize={9} fill="white" fontWeight="bold">
          {ann.kategorieId.slice(0, 8)}
        </text>
      </g>
    )
  }

  return nodes
}

function renderKommentarMarker(
  ann: PDFKommentarAnnotation,
  seitenInfo: PDFSeitenInfo,
): React.ReactNode {
  const cx = ann.position.x * seitenInfo.breite
  const cy = ann.position.y * seitenInfo.hoehe
  return (
    <g key={`kom-${ann.id}`} data-annotation-id={ann.id}
      className="pointer-events-auto cursor-pointer">
      <circle cx={cx} cy={cy} r={8} fill="#3b82f6" fillOpacity={0.8} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight="bold" fill="white">
        K
      </text>
    </g>
  )
}

function renderFreihand(
  ann: PDFFreihandAnnotation,
  seitenInfo: PDFSeitenInfo,
  selected = false,
): React.ReactNode {
  let punkte: { x: number; y: number }[]
  try {
    punkte = JSON.parse(ann.zeichnungsDaten)
  } catch {
    return null
  }
  if (punkte.length < 2) return null

  const d = punkte
    .map((p, i) => {
      const px = p.x * seitenInfo.breite
      const py = p.y * seitenInfo.hoehe
      return i === 0 ? `M${px},${py}` : `L${px},${py}`
    })
    .join(' ')

  // Bounding Box für Selection-Rahmen
  const nodes: React.ReactNode[] = []

  if (selected) {
    const xs = punkte.map(p => p.x * seitenInfo.breite)
    const ys = punkte.map(p => p.y * seitenInfo.hoehe)
    const minX = Math.min(...xs) - 4
    const minY = Math.min(...ys) - 4
    const maxX = Math.max(...xs) + 4
    const maxY = Math.max(...ys) + 4
    nodes.push(
      <rect
        key={`fh-sel-${ann.id}`}
        x={minX} y={minY} width={maxX - minX} height={maxY - minY}
        fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4,2" rx={3}
        className="pointer-events-none"
      />
    )
  }

  nodes.push(
    <path
      key={`fh-${ann.id}`}
      data-annotation-id={ann.id}
      d={d}
      fill="none"
      stroke={ann.farbe}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-auto cursor-pointer"
    />
  )

  return <g key={`fh-g-${ann.id}`}>{nodes}</g>
}

function renderTextAnnotation(
  ann: PDFTextAnnotation,
  seitenInfo: PDFSeitenInfo,
  selected = false,
): React.ReactNode {
  const px = ann.position.x * seitenInfo.breite
  const py = ann.position.y * seitenInfo.hoehe
  const fontSize = ann.groesse || 18

  return (
    <g key={`txt-${ann.id}`} data-annotation-id={ann.id}>
      {/* Selektions-Rahmen */}
      {selected && (
        <rect
          x={px - 4}
          y={py - fontSize - 2}
          width={fontSize * 0.6 * ann.text.length + 8}
          height={fontSize + 6}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4,2"
          rx={3}
          transform={ann.rotation ? `rotate(${ann.rotation}, ${px}, ${py})` : undefined}
        />
      )}
      <text
        data-annotation-id={ann.id}
        x={px}
        y={py}
        fill={ann.farbe}
        fontSize={fontSize}
        fontFamily="sans-serif"
        fontWeight={ann.fett ? 'bold' : 'normal'}
        className="pointer-events-auto cursor-pointer"
        style={{ userSelect: 'none' }}
        transform={ann.rotation ? `rotate(${ann.rotation}, ${px}, ${py})` : undefined}
      >
        {ann.text}
      </text>
    </g>
  )
}
