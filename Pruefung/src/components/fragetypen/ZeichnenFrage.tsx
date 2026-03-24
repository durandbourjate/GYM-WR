import { useState, useEffect, useRef, useCallback } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { VisualisierungFrage } from '../../types/fragen.ts'
import type { CanvasConfig } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachbereich.ts'
import { ZeichnenCanvas } from './zeichnen/ZeichnenCanvas.tsx'
import { ZeichnenToolbar } from './zeichnen/ZeichnenToolbar.tsx'
import { STANDARD_FARBEN } from './zeichnen/ZeichnenTypes.ts'
import type { Tool, ToolbarLayout } from './zeichnen/ZeichnenTypes.ts'

interface Props {
  frage: VisualisierungFrage
}

const TOOLBAR_LAYOUT_KEY = 'zeichnen-toolbar-layout'
const INAKTIVITAET_TIMEOUT_MS = 10_000

/** Standard-CanvasConfig falls frage.canvasConfig undefined */
const defaultConfig: CanvasConfig = {
  breite: 800,
  hoehe: 600,
  koordinatensystem: false,
  werkzeuge: ['stift', 'linie', 'pfeil', 'text', 'rechteck'],
  radierer: true,
  farben: STANDARD_FARBEN,
}

/** Daten-Grösse-Warnschwellen (serialisierter JSON-String) */
const WARNSCHWELLE_AMBER = 40_000
const WARNSCHWELLE_ROT = 50_000

export default function ZeichnenFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)

  // canvasConfig kann als verschachteltes Objekt oder als flache Felder auf der Frage kommen
  const rawFrage = frage as unknown as Record<string, unknown>
  const canvasConfig: CanvasConfig = frage.canvasConfig ?? {
    breite: (rawFrage.breite as number) || defaultConfig.breite,
    hoehe: (rawFrage.hoehe as number) || defaultConfig.hoehe,
    koordinatensystem: (rawFrage.koordinatensystem as boolean) ?? defaultConfig.koordinatensystem,
    werkzeuge: (rawFrage.werkzeuge as CanvasConfig['werkzeuge']) || defaultConfig.werkzeuge,
    hintergrundbild: (rawFrage.hintergrundBild as string) || undefined,
    radierer: (rawFrage.radierer as boolean) ?? defaultConfig.radierer,
    farben: (rawFrage.farben as string[]) || defaultConfig.farben,
  }
  const verfuegbareFarben = canvasConfig.farben ?? STANDARD_FARBEN

  // Aktives Werkzeug
  const [aktivesTool, setAktivesTool] = useState<Tool>('auswahl')

  // Aktive Farbe (erste aus Konfiguration)
  const [aktiveFarbe, setAktiveFarbe] = useState<string>(verfuegbareFarben[0] ?? '#000000')

  // Toolbar-Layout: aus localStorage oder automatisch aus Viewport-Verhältnis
  const [toolbarLayout, setToolbarLayout] = useState<ToolbarLayout>(() => {
    try {
      const gespeichert = localStorage.getItem(TOOLBAR_LAYOUT_KEY)
      if (gespeichert === 'horizontal' || gespeichert === 'vertikal') return gespeichert
    } catch {
      // localStorage nicht verfügbar
    }
    // Standard: immer horizontal (vertikal nur auf expliziten Wunsch)
    return 'horizontal'
  })

  // Aktuell geladene Daten aus Store (beim Fragewechsel synchronisieren)
  const gespeicherteAntwort = antworten[frage.id]
  const gespeicherteDaten =
    gespeicherteAntwort?.typ === 'visualisierung' ? gespeicherteAntwort.daten : undefined

  // Ref für aktuellen frage.id (stale-closure-safe in Callbacks)
  const frageIdRef = useRef(frage.id)
  frageIdRef.current = frage.id

  // Ref für letzten Daten-Stand (für PNG-Export + Inaktivitäts-Save)
  const aktuellerDatenRef = useRef<string>(gespeicherteDaten ?? '')

  // Debounce-Ref für 2s-Auto-Save
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inaktivitäts-Timer (10s ohne Änderung → PNG-Export)
  const inaktivitaetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // PNG-Export-Callback (wird von ZeichnenCanvas via onPNGExport geliefert)
  const handlePNGExport = useCallback((png: string) => {
    setAntwort(frageIdRef.current, {
      typ: 'visualisierung',
      daten: aktuellerDatenRef.current,
      bildLink: png,
    })
  }, [setAntwort])

  // Daten-Änderungs-Handler: debounced Save + Inaktivitäts-Reset
  const handleDatenChange = useCallback((daten: string) => {
    aktuellerDatenRef.current = daten

    // Debounced Store-Save (2s)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      setAntwort(frageIdRef.current, { typ: 'visualisierung', daten })
    }, 2000)

    // Inaktivitäts-Timer zurücksetzen (10s → PNG-Export)
    if (inaktivitaetRef.current) clearTimeout(inaktivitaetRef.current)
    inaktivitaetRef.current = setTimeout(() => {
      inaktivitaetRef.current = null
      // PNG-Export wird durch ZeichnenCanvas selbst ausgelöst; hier nur Store-Save sicherstellen
      setAntwort(frageIdRef.current, { typ: 'visualisierung', daten: aktuellerDatenRef.current })
    }, INAKTIVITAET_TIMEOUT_MS)
  }, [setAntwort])

  // Fragewechsel-Sync: Store-Daten laden + pending Debounce flushen
  useEffect(() => {
    // Cleanup: beim Verlassen der Frage pending Debounce sofort flushen
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
        setAntwort(frageIdRef.current, {
          typ: 'visualisierung',
          daten: aktuellerDatenRef.current,
        })
      }
      if (inaktivitaetRef.current) {
        clearTimeout(inaktivitaetRef.current)
        inaktivitaetRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — nur bei Fragewechsel
  }, [frage.id])

  // Layout-Wechsel: in localStorage persistieren
  const handleLayoutToggle = useCallback(() => {
    setToolbarLayout((prev) => {
      const neu: ToolbarLayout = prev === 'horizontal' ? 'vertikal' : 'horizontal'
      try {
        localStorage.setItem(TOOLBAR_LAYOUT_KEY, neu)
      } catch {
        // ignorieren
      }
      return neu
    })
  }, [])

  // Undo/Redo/Clear: diese werden über ZeichnenCanvas internen Zustand gesteuert
  // Da ZeichnenCanvas keinen imperativen Handle exponiert, brauchen wir einen
  // Zwischenzustand für Undo/Redo-Callbacks.
  // ZeichnenToolbar erhält onUndo/onRedo/onAllesLoeschen — diese werden
  // als Callbacks nach oben gereicht und dann an ZeichnenCanvas als Props
  // weitergegeben via useDrawingEngine.
  // Da ZeichnenCanvas den Drawing-Engine intern verwaltet, exponieren wir
  // die Aktionen über Refs auf Callback-Setter.
  const undoRef = useRef<(() => void) | null>(null)
  const redoRef = useRef<(() => void) | null>(null)
  const clearRef = useRef<(() => void) | null>(null)
  const kannUndoRef = useRef(false)
  const kannRedoRef = useRef(false)

  // Trigger-State damit Toolbar-Buttons re-rendern können
  const [undoState, setUndoState] = useState(0)

  const handleUndo = useCallback(() => {
    undoRef.current?.()
    setUndoState((n) => n + 1)
  }, [])

  const handleRedo = useCallback(() => {
    redoRef.current?.()
    setUndoState((n) => n + 1)
  }, [])

  const handleAllesLoeschen = useCallback(() => {
    clearRef.current?.()
    setUndoState((n) => n + 1)
  }, [])

  // Daten-Grösse für Warnanzeige
  const datenGroesse = aktuellerDatenRef.current.length

  return (
    <div className="flex flex-col gap-4">
      {/* Badges: fachbereich, bloom, punkte */}
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
          Zeichnen
        </span>
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Toolbar (nur wenn nicht abgegeben) */}
      {!abgegeben && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          <ZeichnenToolbar
            aktivesTool={aktivesTool}
            onToolChange={setAktivesTool}
            aktiveFarbe={aktiveFarbe}
            onFarbeChange={setAktiveFarbe}
            verfuegbareWerkzeuge={canvasConfig.werkzeuge}
            verfuegbareFarben={verfuegbareFarben}
            radiererAktiv={canvasConfig.radierer ?? true}
            layout={toolbarLayout}
            onLayoutToggle={handleLayoutToggle}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAllesLoeschen={handleAllesLoeschen}
            kannUndo={kannUndoRef.current}
            kannRedo={kannRedoRef.current}
            disabled={abgegeben}
          />
        </div>
      )}

      {/* Zeichenfläche */}
      <div className="w-full overflow-x-auto">
        <ZeichnenCanvas
          canvasConfig={canvasConfig}
          aktivesTool={aktivesTool}
          aktiveFarbe={aktiveFarbe}
          initialDaten={gespeicherteDaten}
          onDatenChange={handleDatenChange}
          onPNGExport={handlePNGExport}
          disabled={abgegeben}
        />
      </div>

      {/* Daten-Grösse-Warnung */}
      {datenGroesse > WARNSCHWELLE_ROT && (
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
          <span>Zeichnung sehr gross ({Math.round(datenGroesse / 1000)} KB). Bitte vereinfachen.</span>
        </div>
      )}
      {datenGroesse > WARNSCHWELLE_AMBER && datenGroesse <= WARNSCHWELLE_ROT && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          <span>Zeichnung wird gross ({Math.round(datenGroesse / 1000)} KB).</span>
        </div>
      )}

      {/* Status-Leiste */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{abgegeben ? 'Abgegeben' : 'Auto-Save aktiv'}</span>
        <span>{canvasConfig.breite} × {canvasConfig.hoehe} px</span>
      </div>

      {/* Trigger für Undo-State-Tracking (unused output suppressed) */}
      <span className="hidden" aria-hidden="true">{undoState}</span>
    </div>
  )
}
