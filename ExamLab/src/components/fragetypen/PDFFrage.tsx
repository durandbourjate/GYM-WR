import { useState, useEffect, useRef, useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PDFFrage as PDFFrageTyp } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { toAssetUrl } from '../../utils/assetUrl.ts'
import { ermittlePdfQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuIframeSrc } from '@shared/utils/mediaQuelleUrl'
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
  const { antwort: adapterAntwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const user = useAuthStore((s) => s.user)

  // PDF renderer
  const renderer = usePDFRenderer()

  // Load saved annotations from store
  const gespeicherteAnnotationen: PDFAnnotation[] =
    adapterAntwort?.typ === 'pdf' ? (adapterAntwort.annotationen ?? []) : []

  // Annotations hook
  const {
    annotationen, setAnnotationen,
    hinzufuegen, loeschen, editieren,
    allesLoeschen,
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

  // Stift-Stärke + Stil (für Freihand-Annotationen)
  const [stiftBreite, setStiftBreite] = useState<number>(2)
  const [stiftGestrichelt, setStiftGestrichelt] = useState<boolean>(false)

  const [aktiveKategorieId, setAktiveKategorieId] = useState<string | undefined>(
    frage.kategorien?.[0]?.id,
  )
  const [zoom, setZoom] = useState<ZoomStufe>(1.25)
  const [textRotation, setTextRotation] = useState<0 | 90 | 180 | 270>(0)
  const [textGroesse, setTextGroesse] = useState(18)
  const [textFett, setTextFett] = useState(false)
  const [toolbarLayout, setToolbarLayout] = useState<'horizontal' | 'vertikal'>(() => {
    try {
      const saved = localStorage.getItem('pdf-toolbar-layout')
      if (saved === 'vertikal' || saved === 'horizontal') return saved
    } catch { /* ignorieren */ }
    return 'vertikal'
  })
  const [ladeFehler, setLadeFehler] = useState<string | null>(null)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)

  // Refs for stale-closure safety
  const frageIdRef = useRef(frage.id)
  frageIdRef.current = frage.id
  const annotationenRef = useRef(annotationen)
  annotationenRef.current = annotationen

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Load PDF ---
  // Sequentielle Fallback-Kette: Drive → URL → Dateiname → Base64
  // Wenn eine Quelle fehlschlägt, wird die nächste versucht (kein stummer Abbruch)
  useEffect(() => {
    let abgebrochen = false

    async function ladePDFAsync() {
      setLadeFehler(null)
      const quelle = ermittlePdfQuelle(frage)

      // Drive: Backend-Proxy (CORS-sicher), liefert base64 zurück
      if (quelle?.typ === 'drive' && apiService.istKonfiguriert()) {
        try {
          const result = await apiService.ladeDriveFile(quelle.driveFileId, user?.email ?? '')
          if (abgebrochen) return
          if (result?.base64) {
            await renderer.ladePDF({ base64: result.base64 })
            return
          }
          console.warn('[PDFFrage] Drive-Load lieferte kein base64, versuche Fallback...')
        } catch (err) {
          if (abgebrochen) return
          console.warn('[PDFFrage] Drive-Load fehlgeschlagen, versuche Fallback:', err)
        }
      }

      // Inline: base64 direkt ohne Netzwerk
      if (quelle?.typ === 'inline') {
        try {
          await renderer.ladePDF({ base64: quelle.base64 })
          return
        } catch (err) {
          if (abgebrochen) return
          console.warn('[PDFFrage] Inline-Load fehlgeschlagen:', err)
        }
      }

      // Pool/App/Extern: direkte URL (aufgelöst via MediaQuelle-Resolver)
      if (quelle && (quelle.typ === 'pool' || quelle.typ === 'app' || quelle.typ === 'extern')) {
        try {
          if (abgebrochen) return
          await renderer.ladePDF({ url: mediaQuelleZuIframeSrc(quelle, toAssetUrl) })
          return
        } catch (err) {
          if (abgebrochen) return
          console.warn('[PDFFrage] URL-Load fehlgeschlagen, versuche Fallback:', err)
        }
      }

      // Fallback: Lokale Datei aus pdfDateiname (Alt-Daten ohne pdfUrl)
      if (frage.pdfDateiname) {
        try {
          if (abgebrochen) return
          await renderer.ladePDF({ url: toAssetUrl(`./materialien/${frage.pdfDateiname}`) })
          return
        } catch (err) {
          console.error('[PDFFrage] Alle PDF-Quellen fehlgeschlagen:', err)
        }
      }

      if (!abgebrochen) {
        console.error('[PDFFrage] Kein PDF geladen — keine Quelle verfügbar')
        setLadeFehler('Alle PDF-Quellen fehlgeschlagen. Bitte Lehrperson informieren.')
      }
    }

    ladePDFAsync()
    return () => { abgebrochen = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  // --- Sync annotations from store on frage change ---
  useEffect(() => {
    const saved: PDFAnnotation[] = adapterAntwort?.typ === 'pdf' ? (adapterAntwort.annotationen ?? []) : []
    setAnnotationen(saved)

    return () => {
      // Flush pending debounce on unmount / frage change
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
        onAntwort({
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
      onAntwort({
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

  // Lade-Fehler (alle Quellen fehlgeschlagen)
  if (ladeFehler) {
    return (
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {ladeFehler}
        </div>
      </div>
    )
  }

  // Loading state — sofort Spinner zeigen (kein weisses leeres Feld)
  if (renderer.state.status === 'loading' || (renderer.state.status === 'idle' && !ladeFehler && (frage.pdfBase64 || frage.pdfUrl || frage.pdfDriveFileId || frage.pdfDateiname))) {
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
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Toolbar + Viewer Container */}
      <div className={toolbarLayout === 'vertikal' ? 'flex flex-row gap-2' : 'flex flex-col gap-4'}>
        {/* Toolbar (hidden when submitted) */}
        {!disabled && (
          <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 ${toolbarLayout === 'vertikal' ? 'flex-shrink-0 self-start' : ''}`}>
            <PDFToolbar
              aktivesWerkzeug={aktivesWerkzeug}
              onWerkzeugWechsel={setAktivesWerkzeug}
              erlaubteWerkzeuge={frage.erlaubteWerkzeuge}
              kategorien={frage.kategorien}
              aktiveFarbe={aktiveFarbe}
              onFarbeWechsel={(farbe) => {
                setAktiveFarbe(farbe)
                // Farbe auf selektierte Annotation anwenden
                if (selectedAnnotation) {
                  handleAnnotationEditieren(selectedAnnotation, { farbe })
                }
              }}
              aktiveKategorieId={aktiveKategorieId}
              onKategorieWechsel={setAktiveKategorieId}
              zoom={zoom}
              onZoomWechsel={setZoom}
              kannUndo={kannUndo}
              kannRedo={kannRedo}
              onUndo={undo}
              onRedo={redo}
              annotationCount={annotationen.length}
              readOnly={disabled}
              layout={toolbarLayout}
              onLayoutToggle={() => setToolbarLayout(l => {
                const neu = l === 'horizontal' ? 'vertikal' : 'horizontal'
                try { localStorage.setItem('pdf-toolbar-layout', neu) } catch { /* ignorieren */ }
                return neu
              })}
              onAllesLoeschen={allesLoeschen}
              stiftBreite={stiftBreite}
              onStiftBreiteChange={setStiftBreite}
              stiftGestrichelt={stiftGestrichelt}
              onStiftGestricheltChange={setStiftGestrichelt}
              textRotation={selectedAnnotation
                ? ((annotationen.find(a => a.id === selectedAnnotation) as { rotation?: number } | undefined)?.rotation ?? 0) as 0 | 90 | 180 | 270
                : textRotation}
              onTextRotationChange={(r) => {
                if (selectedAnnotation) {
                  handleAnnotationEditieren(selectedAnnotation, { rotation: r || undefined })
                } else {
                  setTextRotation(r)
                }
              }}
              textGroesse={selectedAnnotation
                ? ((annotationen.find(a => a.id === selectedAnnotation) as { groesse?: number } | undefined)?.groesse ?? 18)
                : textGroesse}
              onTextGroesseChange={(g) => {
                if (selectedAnnotation) {
                  handleAnnotationEditieren(selectedAnnotation, { groesse: g })
                } else {
                  setTextGroesse(g)
                }
              }}
              textFett={selectedAnnotation
                ? ((annotationen.find(a => a.id === selectedAnnotation) as { fett?: boolean } | undefined)?.fett ?? false)
                : textFett}
              onTextFettChange={(f) => {
                if (selectedAnnotation) {
                  handleAnnotationEditieren(selectedAnnotation, { fett: f })
                } else {
                  setTextFett(f)
                }
              }}
              hatSelektierteTextAnnotation={!!selectedAnnotation && annotationen.some(a => a.id === selectedAnnotation && a.werkzeug === 'text')}
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
        textGroesse={textGroesse}
        textFett={textFett}
        selectedAnnotation={selectedAnnotation}
        onSelectedAnnotationChange={setSelectedAnnotation}
        onAnnotationHinzufuegen={handleAnnotationHinzufuegen}
        onAnnotationLoeschen={handleAnnotationLoeschen}
        onAnnotationEditieren={handleAnnotationEditieren}
        readOnly={disabled}
      />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{disabled ? 'Abgegeben' : 'Auto-Save aktiv'}</span>
        <span>
          {seitenAnzahl} {seitenAnzahl === 1 ? 'Seite' : 'Seiten'} &middot; {annotationen.length}{' '}
          {annotationen.length === 1 ? 'Annotation' : 'Annotationen'}
        </span>
      </div>

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
