import { useState, useEffect, useRef, useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { VisualisierungFrage } from '../../types/fragen.ts'
import type { CanvasConfig } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { ZeichnenCanvas } from './zeichnen/ZeichnenCanvas.tsx'
import { ZeichnenToolbar } from './zeichnen/ZeichnenToolbar.tsx'
import { STANDARD_FARBEN } from './zeichnen/ZeichnenTypes.ts'
import type { Tool, ToolbarLayout, DrawCommand, CommandId } from './zeichnen/ZeichnenTypes.ts'

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
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

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

  // Text-Rotation (0°, 90°, 180°, 270°)
  const [textRotation, setTextRotation] = useState<0 | 90 | 180 | 270>(0)

  // Text-Grösse (S=14, M=18, L=24, XL=32)
  const [textGroesse, setTextGroesse] = useState<number>(18)

  // Text-Fett
  const [textFett, setTextFett] = useState<boolean>(false)

  // Stift-Stärke + Stil
  const [stiftBreite, setStiftBreite] = useState<number>(2)
  const [stiftGestrichelt, setStiftGestrichelt] = useState<boolean>(false)

  // Toolbar-Layout: aus localStorage laden (Standard: horizontal)
  const [toolbarLayout, setToolbarLayout] = useState<ToolbarLayout>(() => {
    try {
      const saved = localStorage.getItem(TOOLBAR_LAYOUT_KEY)
      if (saved === 'vertikal' || saved === 'horizontal') return saved
    } catch { /* ignorieren */ }
    return 'vertikal'
  })

  // Canvas vergrössern/verkleinern
  const [canvasGross, setCanvasGross] = useState(false)

  // Aktuell geladene Daten aus Store (beim Fragewechsel synchronisieren)
  const gespeicherteDaten =
    antwort?.typ === 'visualisierung' ? antwort.daten : undefined

  // Ref für aktuellen frage.id (stale-closure-safe in Callbacks)
  const frageIdRef = useRef(frage.id)
  frageIdRef.current = frage.id

  // Ref für letzten Daten-Stand (für PNG-Export + Inaktivitäts-Save)
  const aktuellerDatenRef = useRef<string>(gespeicherteDaten ?? '')

  // Inaktivitäts-Timer (10s ohne Änderung → PNG-Export)
  const inaktivitaetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // PNG-Export-Callback (wird von ZeichnenCanvas via onPNGExport geliefert)
  const handlePNGExport = useCallback((png: string) => {
    onAntwort({
      typ: 'visualisierung',
      daten: aktuellerDatenRef.current,
      bildLink: png,
    })
  }, [onAntwort])

  // B47 Root-Cause-Fix: Sofort in Store schreiben (kein 2s-Debounce mehr).
  // Der 400ms-Debounce im Canvas schützt bereits vor zu häufiger Serialisierung.
  // Das alte 2s-Debounce verursachte Datenverlust: Remote-Save oder Fragewechsel
  // lesen den Store, der noch veraltete Daten enthält.
  const handleDatenChange = useCallback((daten: string) => {
    aktuellerDatenRef.current = daten
    onAntwort({ typ: 'visualisierung', daten })

    // Inaktivitäts-Timer zurücksetzen (10s → PNG-Export)
    if (inaktivitaetRef.current) clearTimeout(inaktivitaetRef.current)
    inaktivitaetRef.current = setTimeout(() => {
      inaktivitaetRef.current = null
      // PNG-Export wird durch ZeichnenCanvas selbst ausgelöst; hier nur Store-Save sicherstellen
      onAntwort({ typ: 'visualisierung', daten: aktuellerDatenRef.current })
    }, INAKTIVITAET_TIMEOUT_MS)
  }, [onAntwort])

  // Fragewechsel-Sync: Store-Daten laden + pending Debounce flushen
  useEffect(() => {
    // Cleanup: beim Verlassen der Frage pending Inaktivitäts-Timer flushen
    return () => {
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
  const updateCommandRef = useRef<((id: CommandId, updates: Partial<DrawCommand>) => void) | null>(null)
  const kannUndoRef = useRef(false)
  const kannRedoRef = useRef(false)
  const selektierterCommandRef = useRef<CommandId | null>(null)
  const commandsRef = useRef<DrawCommand[]>([])

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

  // Engine-Aktionen von ZeichnenCanvas empfangen (Undo/Redo/Clear + Selektion)
  const handleEngineActions = useCallback((actions: {
    undo: () => void;
    redo: () => void;
    allesLoeschen: () => void;
    kannUndo: boolean;
    kannRedo: boolean;
    updateCommand: (id: string, updates: Partial<DrawCommand>) => void;
    selektierterCommand: string | null;
    commands: DrawCommand[];
  }) => {
    undoRef.current = actions.undo
    redoRef.current = actions.redo
    clearRef.current = actions.allesLoeschen
    updateCommandRef.current = actions.updateCommand
    kannUndoRef.current = actions.kannUndo
    kannRedoRef.current = actions.kannRedo
    selektierterCommandRef.current = actions.selektierterCommand
    commandsRef.current = actions.commands
    setUndoState(n => n + 1)
  }, [])

  // Selektierter Text-Command (für Rotation/Grösse-Buttons bei Selektion)
  const selektierterCmd = selektierterCommandRef.current
    ? commandsRef.current.find(c => c.id === selektierterCommandRef.current)
    : null
  const istTextSelektiert = selektierterCmd?.typ === 'text'

  // Rotation-Handler: aktualisiert selektierten Text ODER setzt Default für neuen Text
  const handleTextRotation = useCallback((r: 0 | 90 | 180 | 270) => {
    if (selektierterCommandRef.current && commandsRef.current.find(c => c.id === selektierterCommandRef.current && c.typ === 'text')) {
      updateCommandRef.current?.(selektierterCommandRef.current, { rotation: r || undefined })
    }
    setTextRotation(r)
  }, [])

  // Grösse-Handler: aktualisiert selektierten Text ODER setzt Default
  const handleTextGroesse = useCallback((g: number) => {
    if (selektierterCommandRef.current && commandsRef.current.find(c => c.id === selektierterCommandRef.current && c.typ === 'text')) {
      updateCommandRef.current?.(selektierterCommandRef.current, { groesse: g })
    }
    setTextGroesse(g)
  }, [])

  // Fett-Handler: aktualisiert selektierten Text ODER setzt Default
  const handleTextFett = useCallback((f: boolean) => {
    if (selektierterCommandRef.current && commandsRef.current.find(c => c.id === selektierterCommandRef.current && c.typ === 'text')) {
      updateCommandRef.current?.(selektierterCommandRef.current, { fett: f || undefined })
    }
    setTextFett(f)
  }, [])

  // C1: Farb-Handler — aktualisiert selektiertes Element ODER setzt Default
  const handleFarbeChange = useCallback((farbe: string) => {
    if (selektierterCommandRef.current) {
      const cmd = commandsRef.current.find(c => c.id === selektierterCommandRef.current)
      if (cmd && 'farbe' in cmd) {
        updateCommandRef.current?.(selektierterCommandRef.current, { farbe } as Partial<import('./zeichnen/ZeichnenTypes').DrawCommand>)
      }
    }
    setAktiveFarbe(farbe)
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

      {/* Toolbar + Canvas Container */}
      <div className={toolbarLayout === 'vertikal' ? 'flex flex-row gap-2' : 'flex flex-col gap-4'}>
        {/* Toolbar (nur wenn nicht disabled) */}
        {!disabled && (
          <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 ${toolbarLayout === 'vertikal' ? 'flex-shrink-0 self-start' : ''}`}>
            <ZeichnenToolbar
              aktivesTool={aktivesTool}
              onToolChange={setAktivesTool}
              aktiveFarbe={aktiveFarbe}
              onFarbeChange={handleFarbeChange}
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
              disabled={disabled}
              textRotation={istTextSelektiert && selektierterCmd.typ === 'text' ? (selektierterCmd.rotation ?? 0) : textRotation}
              onTextRotationChange={handleTextRotation}
              textGroesse={istTextSelektiert && selektierterCmd.typ === 'text' ? selektierterCmd.groesse : textGroesse}
              onTextGroesseChange={handleTextGroesse}
              textFett={istTextSelektiert && selektierterCmd.typ === 'text' ? (selektierterCmd.fett ?? false) : textFett}
              onTextFettChange={handleTextFett}
              istTextSelektiert={istTextSelektiert}
              stiftBreite={stiftBreite}
              onStiftBreiteChange={setStiftBreite}
              stiftGestrichelt={stiftGestrichelt}
              onStiftGestricheltChange={setStiftGestrichelt}
            />
          </div>
        )}

        {/* Vergrössern-Button + Zeichenfläche */}
        <div className={`overflow-x-auto ${toolbarLayout === 'vertikal' ? 'flex-1 min-w-0' : 'w-full'} ${canvasGross ? 'max-w-none' : 'max-w-3xl'}`}>
          {!disabled && (
            <button
              type="button"
              onClick={() => setCanvasGross(!canvasGross)}
              className="mb-1 text-xs px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
            >
              {canvasGross ? '⊟ Verkleinern' : '⊞ Vergrössern'}
            </button>
          )}
          <ZeichnenCanvas
            canvasConfig={canvasConfig}
            aktivesTool={aktivesTool}
            aktiveFarbe={aktiveFarbe}
            stiftBreite={stiftBreite}
            stiftGestrichelt={stiftGestrichelt}
            textRotation={textRotation}
            textGroesse={textGroesse}
            textFett={textFett}
            initialDaten={gespeicherteDaten}
            onDatenChange={handleDatenChange}
            onPNGExport={handlePNGExport}
            disabled={disabled}
            onEngineActions={handleEngineActions}
            onTextCommit={() => setTextRotation(0)}
          />
        </div>
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
        <span>{disabled ? 'Abgegeben' : 'Auto-Save aktiv'}</span>
        <span>{canvasConfig.breite} × {canvasConfig.hoehe} px</span>
      </div>

      {/* Trigger für Undo-State-Tracking (unused output suppressed) */}
      <span className="hidden" aria-hidden="true">{undoState}</span>

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
