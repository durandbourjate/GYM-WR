import { useState, useEffect, useRef, useCallback } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PDFFrage as PDFFrageTyp } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachbereich.ts'
import { usePDFRenderer } from './pdf/usePDFRenderer.ts'
import { usePDFAnnotations } from './pdf/usePDFAnnotations.ts'
import { PDFToolbar } from './pdf/PDFToolbar.tsx'
import { PDFViewer } from './pdf/PDFViewer.tsx'
import type { PDFToolbarWerkzeug, ZoomStufe } from './pdf/PDFTypes.ts'
import type { PDFAnnotation } from './pdf/PDFTypes.ts'
import { STANDARD_HIGHLIGHT_FARBEN } from './pdf/PDFTypes.ts'

interface Props {
  frage: PDFFrageTyp
}

const AUTOSAVE_DEBOUNCE_MS = 2000

export default function PDFFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const user = useAuthStore((s) => s.user)

  // PDF renderer
  const renderer = usePDFRenderer()

  // Load saved annotations from store
  const gespeicherteAntwort = antworten[frage.id]
  const gespeicherteAnnotationen: PDFAnnotation[] =
    gespeicherteAntwort?.typ === 'pdf' ? gespeicherteAntwort.annotationen : []

  // Annotations hook
  const {
    annotationen, setAnnotationen,
    hinzufuegen, loeschen, editieren,
    undo, redo, kannUndo, kannRedo,
    fuerSeite: _fuerSeite,
  } = usePDFAnnotations(gespeicherteAnnotationen)

  // Toolbar state
  const [aktivesWerkzeug, setAktivesWerkzeug] = useState<PDFToolbarWerkzeug>('auswahl')
  const [aktiveFarbe, setAktiveFarbe] = useState<string>(STANDARD_HIGHLIGHT_FARBEN[0])

  // Werkzeug-abhängige Standardfarbe: Pastell für Highlight, Schwarz für Stift/Text
  useEffect(() => {
    if (aktivesWerkzeug === 'freihand' || aktivesWerkzeug === 'text') {
      setAktiveFarbe(prev => {
        const pastell = ['#FEF08A', '#FBCFE8', '#BAE6FD', '#BBF7D0']
        return pastell.includes(prev) ? '#000000' : prev
      })
    } else if (aktivesWerkzeug === 'highlighter') {
      setAktiveFarbe(prev => {
        const kraeftig = ['#000000', '#DC2626', '#2563EB', '#16A34A', '#F59E0B']
        return kraeftig.includes(prev) ? '#FEF08A' : prev
      })
    }
  }, [aktivesWerkzeug])

  const [aktiveKategorieId, setAktiveKategorieId] = useState<string | undefined>(
    frage.kategorien?.[0]?.id,
  )
  const [zoom, setZoom] = useState<ZoomStufe>(1)
  const [textRotation, setTextRotation] = useState<0 | 90 | 180 | 270>(0)
  const [toolbarLayout, setToolbarLayout] = useState<'horizontal' | 'vertikal'>('horizontal')

  // Refs for stale-closure safety
  const frageIdRef = useRef(frage.id)
  frageIdRef.current = frage.id
  const annotationenRef = useRef(annotationen)
  annotationenRef.current = annotationen

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Load PDF ---
  useEffect(() => {
    if (frage.pdfBase64) {
      renderer.ladePDF({ base64: frage.pdfBase64 })
    } else if (frage.pdfUrl) {
      renderer.ladePDF({ url: frage.pdfUrl })
    } else if (frage.pdfDriveFileId && apiService.istKonfiguriert()) {
      // PDF aus Google Drive via Apps Script Proxy laden (vermeidet CORS)
      apiService.ladeDriveFile(frage.pdfDriveFileId, user?.email ?? '').then((result) => {
        if (result?.base64) {
          renderer.ladePDF({ base64: result.base64 })
        }
      })
    } else if (frage.pdfDateiname) {
      // Fallback: lokale Datei im materialien-Ordner
      renderer.ladePDF({ url: `./materialien/${frage.pdfDateiname}` })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  // --- Sync annotations from store on frage change ---
  useEffect(() => {
    const antwort = antworten[frage.id]
    const saved: PDFAnnotation[] = antwort?.typ === 'pdf' ? antwort.annotationen : []
    setAnnotationen(saved)

    return () => {
      // Flush pending debounce on unmount / frage change
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
        setAntwort(frageIdRef.current, {
          typ: 'pdf',
          annotationen: annotationenRef.current,
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  // --- Auto-save: debounced ---
  useEffect(() => {
    // Skip the initial render (annotations loaded from store)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      setAntwort(frageIdRef.current, {
        typ: 'pdf',
        annotationen,
      })
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotationen])

  // --- Handlers ---
  const handleAnnotationHinzufuegen = useCallback((a: PDFAnnotation) => {
    hinzufuegen(a)
  }, [hinzufuegen])

  const handleAnnotationLoeschen = useCallback((id: string) => {
    loeschen(id)
  }, [loeschen])

  const handleAnnotationEditieren = useCallback((id: string, updates: Partial<PDFAnnotation>) => {
    editieren(id, updates)
  }, [editieren])

  // Determine page count: use renderer state if ready, otherwise frage metadata
  const seitenAnzahl = renderer.state.status === 'ready'
    ? renderer.state.seitenAnzahl
    : frage.seitenAnzahl

  // --- Render ---

  // Loading state — sofort Spinner zeigen (kein weisses leeres Feld)
  if (renderer.state.status === 'loading' || (renderer.state.status === 'idle' && (frage.pdfBase64 || frage.pdfUrl || frage.pdfDriveFileId || frage.pdfDateiname))) {
    return (
      <div className="flex flex-col gap-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
            {frage.fachbereich}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            PDF
          </span>
        </div>
        {/* Fragetext */}
        <div
          className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
        />
        {/* Lade-Platzhalter */}
        <div className="flex items-center justify-center gap-2 p-8 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
          <span className="inline-block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400">PDF wird geladen...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (renderer.state.status === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          PDF konnte nicht geladen werden: {renderer.state.fehler ?? 'Unbekannter Fehler'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Badges */}
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
          PDF
        </span>
      </div>

      {/* Fragetext (sticky) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-14 z-10"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Toolbar + Viewer Container */}
      <div className={toolbarLayout === 'vertikal' ? 'flex flex-row gap-2' : 'flex flex-col gap-4'}>
        {/* Toolbar (hidden when submitted) */}
        {!abgegeben && (
          <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 ${toolbarLayout === 'vertikal' ? 'flex-shrink-0 self-start sticky top-20' : ''}`}>
            <PDFToolbar
              aktivesWerkzeug={aktivesWerkzeug}
              onWerkzeugWechsel={setAktivesWerkzeug}
              erlaubteWerkzeuge={frage.erlaubteWerkzeuge}
              kategorien={frage.kategorien}
              aktiveFarbe={aktiveFarbe}
              onFarbeWechsel={setAktiveFarbe}
              aktiveKategorieId={aktiveKategorieId}
              onKategorieWechsel={setAktiveKategorieId}
              zoom={zoom}
              onZoomWechsel={setZoom}
              kannUndo={kannUndo}
              kannRedo={kannRedo}
              onUndo={undo}
              onRedo={redo}
              annotationCount={annotationen.length}
              readOnly={abgegeben}
              layout={toolbarLayout}
              onLayoutToggle={() => setToolbarLayout(l => l === 'horizontal' ? 'vertikal' : 'horizontal')}
              textRotation={textRotation}
              onTextRotationChange={setTextRotation}
            />
          </div>
        )}

        {/* PDF Viewer */}
        <div className={toolbarLayout === 'vertikal' ? 'flex-1 min-w-0' : 'w-full'}>
        <PDFViewer
        renderer={renderer}
        seitenAnzahl={seitenAnzahl}
        zoom={zoom}
        annotationen={annotationen}
        aktivesWerkzeug={aktivesWerkzeug}
        aktiveFarbe={aktiveFarbe}
        kategorien={frage.kategorien}
        aktiveKategorieId={aktiveKategorieId}
        textRotation={textRotation}
        onAnnotationHinzufuegen={handleAnnotationHinzufuegen}
        onAnnotationLoeschen={handleAnnotationLoeschen}
        onAnnotationEditieren={handleAnnotationEditieren}
        readOnly={abgegeben}
      />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{abgegeben ? 'Abgegeben' : 'Auto-Save aktiv'}</span>
        <span>
          {seitenAnzahl} {seitenAnzahl === 1 ? 'Seite' : 'Seiten'} &middot; {annotationen.length}{' '}
          {annotationen.length === 1 ? 'Annotation' : 'Annotationen'}
        </span>
      </div>
    </div>
  )
}
