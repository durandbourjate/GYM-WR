import { useState } from 'react'
import type { PDFAnnotationsWerkzeug, PDFToolbarWerkzeug, PDFKategorie, ZoomStufe } from './PDFTypes.ts'
import { ZOOM_STUFEN, STANDARD_HIGHLIGHT_FARBEN } from './PDFTypes.ts'
import ToolbarDropdown from '../../shared/ToolbarDropdown.tsx'
import Tooltip from '../../ui/Tooltip.tsx'

/** Inline SVG Radierer-Icon (identisch mit ZeichnenToolbar) */
function RadiererIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0l5.18 5.18a2 2 0 0 1 0 2.82L14 20" />
      <path d="M6 12l4 4" />
    </svg>
  );
}

/** Stift-Stärken (wie ZeichnenToolbar) */
const STIFT_STAERKEN = [
  { label: 'Dünn', wert: 1 },
  { label: 'Mittel', wert: 2 },
  { label: 'Dick', wert: 4 },
] as const;

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
  onAllesLoeschen?: () => void
  stiftBreite?: number
  onStiftBreiteChange?: (b: number) => void
  stiftGestrichelt?: boolean
  onStiftGestricheltChange?: (g: boolean) => void
  textRotation?: 0 | 90 | 180 | 270
  onTextRotationChange?: (r: 0 | 90 | 180 | 270) => void
  textGroesse?: number
  onTextGroesseChange?: (g: number) => void
  textFett?: boolean
  onTextFettChange?: (f: boolean) => void
  hatSelektierteTextAnnotation?: boolean
}

// Werkzeug-Definitionen werden jetzt einzeln inline gerendert

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
  layout,
  onLayoutToggle,
  onAllesLoeschen,
  stiftBreite = 2,
  onStiftBreiteChange,
  stiftGestrichelt = false,
  onStiftGestricheltChange,
  textRotation = 0,
  onTextRotationChange,
  textGroesse = 18,
  onTextGroesseChange,
  textFett = false,
  onTextFettChange,
  hatSelektierteTextAnnotation = false,
}: Props) {
  const isHorizontal = (layout ?? 'vertikal') === 'horizontal'
  const [zeigeLoeschenDialog, setZeigeLoeschenDialog] = useState(false)

  if (readOnly) return null

  const hatFreihand = (erlaubteWerkzeuge || []).includes('freihand')

  const zeigeKategorieSelect =
    aktivesWerkzeug === 'label' && kategorien && kategorien.length > 0

  const btnKlassen = (aktiv: boolean) =>
    [
      'min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors',
      aktiv
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400'
        : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300',
    ].join(' ')

  const separatorKlassen = isHorizontal
    ? 'w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1'
    : 'h-px w-6 bg-slate-300 dark:bg-slate-600 my-1'

  return (
    <div
      role="toolbar"
      aria-label="PDF-Werkzeuge"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className={`flex gap-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg ${isHorizontal ? 'flex-wrap items-center' : 'flex-col items-center'}`}
    >
      {/* Layout-Toggle (erstes Element) */}
      {onLayoutToggle && (
        <Tooltip text={isHorizontal ? 'Vertikal anordnen' : 'Horizontal anordnen'}>
          <button
            type="button"
            onClick={onLayoutToggle}
            className={btnKlassen(false)}
          >
            {isHorizontal ? '⇅' : '⇆'}
          </button>
        </Tooltip>
      )}

      {/* Auswahl */}
      <Tooltip text="Auswahl">
        <button
          type="button"
          aria-pressed={aktivesWerkzeug === 'auswahl'}
          onClick={() => onWerkzeugWechsel('auswahl')}
          className={btnKlassen(aktivesWerkzeug === 'auswahl')}
        >
          ↖
        </button>
      </Tooltip>

      {/* Markieren */}
      {(erlaubteWerkzeuge || []).includes('highlighter') && (
        <Tooltip text="Markieren">
          <button type="button" aria-pressed={aktivesWerkzeug === 'highlighter'}
            onClick={() => onWerkzeugWechsel('highlighter')} className={btnKlassen(aktivesWerkzeug === 'highlighter')}>
            <span className="inline-block w-4 h-1.5 bg-yellow-400 rounded-sm align-middle" />
          </button>
        </Tooltip>
      )}

      {/* Text-Werkzeug:
          - Annotation ausgewählt → Properties INLINE (kein Dropdown → kein Tool-Switch, kein Deselektions-Bug)
          - Nichts ausgewählt → Dropdown öffnet + aktiviert 'text'-Werkzeug */}
      {hatSelektierteTextAnnotation ? (
        // Inline-Properties für selektierte Text-Annotation
        <div className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-center'} gap-0.5`}>
          {/* T-Label (visueller Indikator, kein Tool-Switch) */}
          <Tooltip text="Selektierte Textannotation">
            <span
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400"
            >T</span>
          </Tooltip>
          {/* Grösse */}
          {([{ label: 'S', px: 14 }, { label: 'M', px: 18 }, { label: 'L', px: 24 }, { label: 'XL', px: 32 }] as const).map(({ label, px }) => (
            <Tooltip key={label} text={`Grösse ${px}px`}>
              <button type="button"
                onClick={() => onTextGroesseChange?.(px)}
                className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-xs font-medium transition-colors ${textGroesse === px ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
              >{label}</button>
            </Tooltip>
          ))}
          {/* Fett */}
          <Tooltip text={textFett ? 'Fett aus' : 'Fett ein'}>
            <button type="button"
              onClick={() => onTextFettChange?.(!textFett)}
              className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-sm font-bold transition-colors ${textFett ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >B</button>
          </Tooltip>
          {/* Rotation */}
          <Tooltip text={`Rotation: ${textRotation}° (klicken zum Drehen)`}>
            <button type="button"
              onClick={() => onTextRotationChange?.(((textRotation + 90) % 360) as 0 | 90 | 180 | 270)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >⟳{textRotation > 0 ? `${textRotation}°` : ''}</button>
          </Tooltip>
        </div>
      ) : (
        // Kein Text ausgewählt: Dropdown zum Konfigurieren + Aktivieren des Text-Werkzeugs
        <ToolbarDropdown
          icon="T"
          label="Text"
          aktiv={aktivesWerkzeug === 'text'}
          horizontal={isHorizontal}
          onOpen={() => onWerkzeugWechsel('text')}
        >
          <div className="flex flex-col gap-1 min-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">Grösse</span>
            <div className="flex gap-0.5 px-1">
              {([{ label: 'S', px: 14 }, { label: 'M', px: 18 }, { label: 'L', px: 24 }, { label: 'XL', px: 32 }] as const).map(({ label, px }) => (
                <button key={label} type="button" onClick={() => onTextGroesseChange?.(px)}
                  className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-xs font-medium transition-colors ${textGroesse === px ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >{label}</button>
              ))}
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-600 my-0.5" />
            <div className="flex gap-1 px-1">
              <button type="button" onClick={() => onTextFettChange?.(!textFett)}
                className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-sm transition-colors ${textFett ? 'bg-slate-200 dark:bg-slate-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >B</button>
              <button type="button" onClick={() => onTextRotationChange?.(((textRotation + 90) % 360) as 0 | 90 | 180 | 270)}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                >⟳{textRotation > 0 ? ` ${textRotation}°` : ''}</button>
            </div>
          </div>
        </ToolbarDropdown>
      )}

      {/* Kommentar */}
      {(erlaubteWerkzeuge || []).includes('kommentar') && (
        <Tooltip text="Kommentar">
          <button type="button" aria-pressed={aktivesWerkzeug === 'kommentar'}
            onClick={() => onWerkzeugWechsel('kommentar')} className={btnKlassen(aktivesWerkzeug === 'kommentar')}>
            💬
          </button>
        </Tooltip>
      )}

      {/* Freihand als Stift-Menü (Stärke + Gestrichelt) */}
      {hatFreihand && (
        <ToolbarDropdown
          icon={<span style={{ fontSize: stiftBreite > 2 ? 18 : 14 }}>✏️</span>}
          label="Freihand"
          aktiv={aktivesWerkzeug === 'freihand'}
          horizontal={isHorizontal}
          onOpen={() => onWerkzeugWechsel('freihand')}
        >
          <div className="flex flex-col gap-1 min-w-[120px]">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">Stärke</span>
            {STIFT_STAERKEN.map(({ label, wert }) => (
              <button
                key={wert}
                type="button"
                onClick={() => {
                  onStiftBreiteChange?.(wert);
                  onWerkzeugWechsel('freihand');
                }}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                  stiftBreite === wert && aktivesWerkzeug === 'freihand'
                    ? 'bg-slate-200 dark:bg-slate-600 font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                <span className="inline-block rounded-full bg-current" style={{ width: wert * 3, height: wert * 3 }} />
                {label}
              </button>
            ))}
            <div className="h-px bg-slate-200 dark:bg-slate-600 my-1" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">Stil</span>
            <button
              type="button"
              onClick={() => { onStiftGestricheltChange?.(false); onWerkzeugWechsel('freihand'); }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${!stiftGestrichelt ? 'bg-slate-200 dark:bg-slate-600 font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span className="inline-block w-6 h-0.5 bg-current" /> Durchgehend
            </button>
            <button
              type="button"
              onClick={() => { onStiftGestricheltChange?.(true); onWerkzeugWechsel('freihand'); }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${stiftGestrichelt ? 'bg-slate-200 dark:bg-slate-600 font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span className="inline-block w-6 border-t-2 border-dashed border-current" /> Gestrichelt
            </button>
          </div>
        </ToolbarDropdown>
      )}

      {/* Radierer */}
      <Tooltip text="Radierer">
        <button
          type="button"
          aria-pressed={aktivesWerkzeug === 'radierer'}
          onClick={() => onWerkzeugWechsel('radierer')}
          className={btnKlassen(aktivesWerkzeug === 'radierer')}
        >
          <RadiererIcon />
        </button>
      </Tooltip>

      <div className={separatorKlassen} aria-hidden="true" />

      {/* Farben-Menü (Dropdown) */}
      <ToolbarDropdown
        icon={<span className="block rounded-full" style={{ width: 18, height: 18, backgroundColor: aktiveFarbe }} />}
        label="Farbe"
        horizontal={isHorizontal}
      >
        <div className="grid grid-cols-3 gap-2" style={{ minWidth: 156 }}>
          {STANDARD_HIGHLIGHT_FARBEN.map((farbe) => (
            <Tooltip text={farbe}>
              <button
                key={farbe}
                type="button"
                onClick={() => onFarbeWechsel(farbe)}
                className={[
                  'w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-all',
                  aktiveFarbe === farbe ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110',
                ].join(' ')}
              >
                <span className="block rounded-full border border-slate-300 dark:border-slate-500" style={{ width: 30, height: 30, backgroundColor: farbe }} />
              </button>
            </Tooltip>
          ))}
        </div>
      </ToolbarDropdown>

      {/* Kategorie-Select */}
      {zeigeKategorieSelect && onKategorieWechsel && (
        <>
          <div className={separatorKlassen} aria-hidden="true" />
          <select
            value={aktiveKategorieId ?? ''}
            onChange={(e) => onKategorieWechsel(e.target.value)}
            className="min-h-[44px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm px-2"
            aria-label="Kategorie wählen"
          >
            <option value="" disabled>Kategorie...</option>
            {kategorien!.map((kat) => (
              <option key={kat.id} value={kat.id}>{kat.label}</option>
            ))}
          </select>
        </>
      )}

      <div className={separatorKlassen} aria-hidden="true" />

      {/* Undo / Redo */}
      <div role="group" aria-label="Verlauf" className={`flex gap-0.5 ${isHorizontal ? '' : 'flex-col'}`}>
        <Tooltip text="Rückgängig">
          <button type="button" onClick={onUndo} disabled={!kannUndo}
            className={`${btnKlassen(false)} ${!kannUndo ? 'opacity-40 cursor-not-allowed' : ''}`}>↩</button>
        </Tooltip>
        <Tooltip text="Wiederherstellen">
          <button type="button" onClick={onRedo} disabled={!kannRedo}
            className={`${btnKlassen(false)} ${!kannRedo ? 'opacity-40 cursor-not-allowed' : ''}`}>↪</button>
        </Tooltip>
      </div>

      <div className={separatorKlassen} aria-hidden="true" />

      {/* Zoom */}
      <select
        value={zoom}
        onChange={(e) => onZoomWechsel(Number(e.target.value) as ZoomStufe)}
        className="min-h-[44px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm px-2"
        aria-label="Zoom-Stufe"
      >
        {ZOOM_STUFEN.map((stufe) => (
          <option key={stufe} value={stufe}>{Math.round(stufe * 100)}%</option>
        ))}
      </select>

      {isHorizontal && <div className="flex-1" aria-hidden="true" />}

      {/* Alles löschen */}
      {onAllesLoeschen && (
        <Tooltip text="Alles löschen">
          <button
            type="button"
            onClick={() => setZeigeLoeschenDialog(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm transition-colors bg-red-50 dark:bg-red-950 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900"
          >
            🗑
          </button>
        </Tooltip>
      )}

      {/* Annotation-Zähler */}
      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums" aria-label={`${annotationCount} Annotationen`}>
        {annotationCount} {annotationCount === 1 ? 'Annotation' : 'Annotationen'}
      </span>

      {/* Bestätigungsdialog */}
      {zeigeLoeschenDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setZeigeLoeschenDialog(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Alle Annotationen löschen?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">Alle Annotationen werden unwiderruflich entfernt.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setZeigeLoeschenDialog(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                Abbrechen
              </button>
              <button type="button" onClick={() => { onAllesLoeschen!(); setZeigeLoeschenDialog(false) }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
