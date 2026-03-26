import { useState, type ReactNode } from 'react'
import type { PDFAnnotationsWerkzeug, PDFToolbarWerkzeug, PDFKategorie, ZoomStufe } from './PDFTypes.ts'
import { ZOOM_STUFEN, STANDARD_HIGHLIGHT_FARBEN } from './PDFTypes.ts'

type ToolbarLayout = 'horizontal' | 'vertikal'

interface Props {
  aktivesWerkzeug: PDFToolbarWerkzeug
  onWerkzeugWechsel: (w: PDFToolbarWerkzeug) => void
  erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]
  kategorien?: PDFKategorie[]
  aktiveFarbe: string
  onFarbeWechsel: (f: string) => void
  aktiveKategorieId?: string
  onKategorieWechsel?: (id: string) => void
  zoom: ZoomStufe
  onZoomWechsel: (z: ZoomStufe) => void
  kannUndo: boolean
  kannRedo: boolean
  onUndo: () => void
  onRedo: () => void
  annotationCount: number
  readOnly?: boolean
  layout?: ToolbarLayout
  onLayoutToggle?: () => void
  textRotation?: 0 | 90 | 180 | 270
  onTextRotationChange?: (r: 0 | 90 | 180 | 270) => void
  textGroesse?: number
  onTextGroesseChange?: (g: number) => void
  textFett?: boolean
  onTextFettChange?: (f: boolean) => void
  hatSelektierteTextAnnotation?: boolean
}

const WERKZEUG_DEFS: { id: PDFAnnotationsWerkzeug; icon: string | ReactNode; label: string }[] = [
  { id: 'highlighter', icon: <span className="inline-block w-4 h-1.5 bg-yellow-400 rounded-sm align-middle" />, label: 'Markieren' },
  { id: 'text', icon: 'T', label: 'Text einfügen' },
  { id: 'kommentar', icon: '💬', label: 'Kommentar' },
  { id: 'freihand', icon: '✏️', label: 'Freihand' },
  { id: 'label', icon: '🏷', label: 'Kategorie zuweisen' },
]

export function PDFToolbar({
  aktivesWerkzeug,
  onWerkzeugWechsel,
  erlaubteWerkzeuge,
  kategorien,
  aktiveFarbe,
  onFarbeWechsel,
  aktiveKategorieId,
  onKategorieWechsel,
  zoom,
  onZoomWechsel,
  kannUndo,
  kannRedo,
  onUndo,
  onRedo,
  annotationCount,
  readOnly,
  layout = 'horizontal',
  onLayoutToggle,
  textRotation = 0,
  onTextRotationChange,
  textGroesse = 18,
  onTextGroesseChange,
  textFett = false,
  onTextFettChange,
  hatSelektierteTextAnnotation = false,
}: Props) {
  const isHorizontal = layout === 'horizontal'
  const [farbPickerOffen, setFarbPickerOffen] = useState(false)

  if (readOnly) return null

  const sichtbareWerkzeuge = WERKZEUG_DEFS.filter((def) =>
    // 'text' ist immer verfügbar (wie auswahl/radierer), andere nur wenn erlaubt
    def.id === 'text' || (erlaubteWerkzeuge || []).includes(def.id),
  )

  const zeigeFarbPicker =
    farbPickerOffen &&
    (aktivesWerkzeug === 'highlighter' || aktivesWerkzeug === 'freihand' || aktivesWerkzeug === 'text')

  const zeigeKategorieSelect =
    aktivesWerkzeug === 'label' && kategorien && kategorien.length > 0

  const btnKlassen = (aktiv: boolean) =>
    [
      'min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors',
      aktiv
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400'
        : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300',
    ].join(' ')

  return (
    <div
      role="toolbar"
      aria-label="PDF-Werkzeuge"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className={`flex gap-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg ${isHorizontal ? 'flex-wrap items-center' : 'flex-col items-center max-h-full overflow-y-auto'}`}
    >
      {/* Auswahl (immer sichtbar) */}
      <button
        aria-pressed={aktivesWerkzeug === 'auswahl'}
        title="Auswahl"
        onClick={() => {
          onWerkzeugWechsel('auswahl')
          setFarbPickerOffen(false)
        }}
        className={btnKlassen(aktivesWerkzeug === 'auswahl')}
      >
        ↖
      </button>

      {/* Annotations-Werkzeuge */}
      {sichtbareWerkzeuge.map((def) => (
        <button
          key={def.id}
          aria-pressed={aktivesWerkzeug === def.id}
          title={def.label}
          onClick={() => {
            onWerkzeugWechsel(def.id)
            if (def.id === 'highlighter' || def.id === 'freihand' || def.id === 'text') {
              setFarbPickerOffen(true)
            } else {
              setFarbPickerOffen(false)
            }
          }}
          className={btnKlassen(aktivesWerkzeug === def.id)}
        >
          {def.icon}
        </button>
      ))}

      {/* Radierer (immer sichtbar) */}
      <button
        aria-pressed={aktivesWerkzeug === 'radierer'}
        title="Radierer"
        onClick={() => {
          onWerkzeugWechsel('radierer')
          setFarbPickerOffen(false)
        }}
        className={btnKlassen(aktivesWerkzeug === 'radierer')}
      >
        🧹
      </button>

      {/* Separator */}
      <div className={isHorizontal ? 'w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1' : 'h-px w-6 bg-slate-300 dark:bg-slate-600 my-1'} aria-hidden="true" />

      {/* Farbpicker-Dropdown */}
      {zeigeFarbPicker && (
        <div
          role="group"
          aria-label="Farben"
          className={`flex gap-1 ${isHorizontal ? 'items-center' : 'flex-col items-center'}`}
        >
          {STANDARD_HIGHLIGHT_FARBEN.map((farbe) => (
            <button
              key={farbe}
              aria-pressed={aktiveFarbe === farbe}
              aria-label={`Farbe ${farbe}`}
              title={farbe}
              onClick={() => onFarbeWechsel(farbe)}
              className={[
                'min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-all',
                aktiveFarbe === farbe
                  ? 'ring-2 ring-blue-500 ring-offset-1'
                  : 'hover:scale-110',
              ].join(' ')}
            >
              <span
                className="block rounded-full"
                style={{ width: 22, height: 22, backgroundColor: farbe }}
              />
            </button>
          ))}
          <div className={isHorizontal ? 'w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1' : 'h-px w-6 bg-slate-300 dark:bg-slate-600 my-1'} aria-hidden="true" />
        </div>
      )}

      {/* Kategorie-Select */}
      {zeigeKategorieSelect && onKategorieWechsel && (
        <div role="group" aria-label="Kategorie" className="flex items-center">
          <select
            value={aktiveKategorieId ?? ''}
            onChange={(e) => onKategorieWechsel(e.target.value)}
            className="min-h-[44px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm px-2"
            aria-label="Kategorie wählen"
          >
            <option value="" disabled>
              Kategorie...
            </option>
            {kategorien!.map((kat) => (
              <option key={kat.id} value={kat.id}>
                {kat.label}
              </option>
            ))}
          </select>
          <div className={isHorizontal ? 'w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1' : 'h-px w-6 bg-slate-300 dark:bg-slate-600 my-1'} aria-hidden="true" />
        </div>
      )}

      {/* Text-Optionen (bei Text-Werkzeug oder selektierter Text-Annotation) */}
      {(aktivesWerkzeug === 'text' || hatSelektierteTextAnnotation) && (
        <>
          {/* Schriftgrösse S/M/L/XL */}
          {onTextGroesseChange && (
            <div role="group" aria-label="Schriftgrösse" className={`flex gap-0.5 ${isHorizontal ? '' : 'flex-col'}`}>
              {([{ label: 'S', px: 14 }, { label: 'M', px: 18 }, { label: 'L', px: 24 }, { label: 'XL', px: 32 }] as const).map(({ label, px }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onTextGroesseChange(px)}
                  className={btnKlassen(textGroesse === px)}
                  title={`Schriftgrösse ${label} (${px}px)`}
                  style={{ fontSize: Math.max(11, px * 0.6) }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {/* Fett-Toggle */}
          {onTextFettChange && (
            <button
              type="button"
              onClick={() => onTextFettChange(!textFett)}
              className={btnKlassen(textFett)}
              title={textFett ? 'Fett (aktiv)' : 'Fett'}
            >
              <span style={{ fontWeight: 'bold' }}>B</span>
            </button>
          )}
          {/* Rotation */}
          {onTextRotationChange && (
            <button
              type="button"
              onClick={() => onTextRotationChange(((textRotation + 90) % 360) as 0 | 90 | 180 | 270)}
              className={[
                btnKlassen(false),
                'border border-slate-300 dark:border-slate-600',
              ].join(' ')}
              title={`Rotation: ${textRotation}°`}
            >
              ⟳{textRotation > 0 ? ` ${textRotation}°` : ''}
            </button>
          )}
        </>
      )}

      {/* Undo / Redo */}
      <div role="group" aria-label="Verlauf" className="flex gap-0.5">
        <button
          title="Rückgängig"
          onClick={onUndo}
          disabled={!kannUndo}
          className={[
            btnKlassen(false),
            !kannUndo ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        >
          ↩
        </button>
        <button
          title="Wiederherstellen"
          onClick={onRedo}
          disabled={!kannRedo}
          className={[
            btnKlassen(false),
            !kannRedo ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        >
          ↪
        </button>
      </div>

      {/* Separator */}
      <div className={isHorizontal ? 'w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1' : 'h-px w-6 bg-slate-300 dark:bg-slate-600 my-1'} aria-hidden="true" />

      {/* Zoom-Dropdown */}
      <div role="group" aria-label="Zoom" className="flex items-center">
        <select
          value={zoom}
          onChange={(e) => onZoomWechsel(Number(e.target.value) as ZoomStufe)}
          className="min-h-[44px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm px-2"
          aria-label="Zoom-Stufe"
        >
          {ZOOM_STUFEN.map((stufe) => (
            <option key={stufe} value={stufe}>
              {Math.round(stufe * 100)}%
            </option>
          ))}
        </select>
      </div>

      {/* Spacer (nur horizontal) */}
      {isHorizontal && <div className="flex-1" aria-hidden="true" />}

      {/* Layout-Toggle */}
      {onLayoutToggle && (
        <button
          title={isHorizontal ? 'Vertikal anordnen' : 'Horizontal anordnen'}
          onClick={onLayoutToggle}
          className={btnKlassen(false)}
        >
          {isHorizontal ? '⇅' : '⇆'}
        </button>
      )}

      {/* Annotation-Zähler */}
      <span
        className="text-xs text-slate-500 dark:text-slate-400 tabular-nums"
        aria-label={`${annotationCount} Annotationen`}
      >
        {annotationCount} {annotationCount === 1 ? 'Annotation' : 'Annotationen'}
      </span>
    </div>
  )
}
