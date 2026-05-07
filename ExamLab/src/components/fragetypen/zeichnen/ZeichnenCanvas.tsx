import { useEffect, useRef, useCallback } from 'react'
import type { CanvasConfig } from '../../../types/fragen-storage'
import type { Tool, DrawCommand, Point } from './ZeichnenTypes'
import { generiereCommandId } from './ZeichnenTypes'
import { useDrawingEngine, findeCommandBeiPunkt } from './useDrawingEngine'
import { usePointerEvents } from './usePointerEvents'
import { useDebounce } from '../../../hooks/useDebounce'
import { useCanvasSetup } from './useCanvasSetup'
import { useTextOverlay } from './useTextOverlay'
import { useStiftRendering } from './useStiftRendering'

interface ZeichnenCanvasProps {
  canvasConfig: CanvasConfig
  aktivesTool: Tool
  aktiveFarbe: string
  stiftBreite?: number
  stiftGestrichelt?: boolean
  textRotation?: 0 | 90 | 180 | 270
  textGroesse?: number
  textFett?: boolean
  initialDaten?: string
  onDatenChange: (daten: string) => void
  onPNGExport: (png: string) => void
  disabled: boolean
  onEngineActions?: (actions: {
    undo: () => void
    redo: () => void
    allesLoeschen: () => void
    kannUndo: boolean
    kannRedo: boolean
    updateCommand: (id: string, updates: Partial<DrawCommand>) => void
    selektierterCommand: string | null
    commands: DrawCommand[]
  }) => void
  /** Wird nach dem Abschliessen eines Text-Overlays aufgerufen (Reset für Rotation etc.) */
  onTextCommit?: () => void
}

export function ZeichnenCanvas({
  canvasConfig,
  aktivesTool,
  aktiveFarbe,
  stiftBreite = 2,
  stiftGestrichelt = false,
  textRotation = 0,
  textGroesse = 18,
  textFett = false,
  initialDaten,
  onDatenChange,
  onPNGExport,
  disabled,
  onEngineActions,
  onTextCommit,
}: ZeichnenCanvasProps) {
  const onTextCommitRef = useRef(onTextCommit)
  onTextCommitRef.current = onTextCommit

  // Canvas-Setup: refs + Hintergrundbild + Dimensionen
  const { canvasRef, containerRef, hintergrundbild, logischeBreite, logischeHoehe } = useCanvasSetup({ canvasConfig })

  // Drawing Engine
  const engine = useDrawingEngine({
    hintergrundbild,
    breite: logischeBreite,
    hoehe: logischeHoehe,
  })

  // Stift-Rendering (rAF-Loop + Buffer)
  // Destrukturiert für stabile Callback-Identity (sonst re-attached usePointerEvents pro Render)
  const {
    stiftBufferRef,
    stiftMetaRef,
    istAktivRef: stiftIstAktivRef,
    starteRendering: starteStiftRendering,
    stoppeRendering: stoppeStiftRendering,
  } = useStiftRendering({
    canvasRef,
    renderMitPreview: engine.renderMitPreview,
  })

  // Text-Overlay (State-Machine + Auto-Focus + Outside-Click)
  // Destrukturiert: alle Callbacks/Refs sind useCallback/useRef → stabile Identity
  const {
    sichtbar: textOverlaySichtbar,
    cssLeft: textOverlayCssLeft,
    cssTop: textOverlayCssTop,
    text: textOverlayText,
    setText: textOverlaySetText,
    oeffnen: textOverlayOeffnen,
    abschliessen: textOverlayAbschliessen,
    abschliessenViaBlur: textOverlayAbschliessenViaBlur,
    inputRef: textOverlayInputRef,
    sichtbarRef: textOverlaySichtbarRef,
  } = useTextOverlay({
    onCommit: ({ text, logischX, logischY }) => {
      engine.addCommand({
        typ: 'text',
        position: { x: logischX, y: logischY },
        text,
        farbe: aktiveFarbe,
        groesse: textGroesse,
        rotation: textRotation || undefined,
        fett: textFett || undefined,
      } as Omit<DrawCommand, 'id'>)
      onTextCommitRef.current?.()
    },
  })

  // Engine-Aktionen an Elternkomponente melden
  useEffect(() => {
    onEngineActions?.({
      undo: engine.undo,
      redo: engine.redo,
      allesLoeschen: engine.allesLoeschen,
      kannUndo: engine.kannUndo,
      kannRedo: engine.kannRedo,
      updateCommand: engine.updateCommand,
      selektierterCommand: engine.state.selektierterCommand,
      commands: engine.state.commands,
    })
  }, [engine.state.commands, engine.state.selektierterCommand, engine.undo, engine.redo, engine.allesLoeschen, engine.kannUndo, engine.kannRedo, engine.updateCommand, onEngineActions])

  // Zustand für Drag (Auswahl-Werkzeug)
  const letzterPunktRef = useRef<Point | null>(null)

  // Daten laden wenn initialDaten sich ändert (Fragen-Wechsel)
  useEffect(() => {
    if (initialDaten) {
      engine.ladeDaten(initialDaten)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDaten])

  // Render-Loop: bei State-Änderungen neu zeichnen.
  // Wenn die rAF-Loop aktiv ist, übernimmt sie das Rendering — kein doppeltes Zeichnen.
  // (deps byte-identisch zu Source: refs werden NICHT in deps geführt)
  useEffect(() => {
    if (stiftIstAktivRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    ctx.save()
    ctx.scale(dpr, dpr)
    engine.render(ctx)
    ctx.restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state, engine, hintergrundbild])

  // Auto-Save: debounced onDatenChange bei Commands-Änderung
  const onDatenChangeRef = useRef(onDatenChange)
  onDatenChangeRef.current = onDatenChange

  const serializiereRef = useRef(engine.serialisiere)
  serializiereRef.current = engine.serialisiere

  const debouncedSave = useDebounce(
    useCallback(() => {
      onDatenChangeRef.current(serializiereRef.current())
    }, []),
    400,
  )

  useEffect(() => {
    debouncedSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state.commands])

  // PNG-Export-Ref (von Parent über onPNGExport-Callback bedient — pre-existing toter Code, nicht im T.d-Scope)
  const exportiereRef = useRef(engine.exportierePNG)
  exportiereRef.current = engine.exportierePNG

  const onPNGExportRef = useRef(onPNGExport)
  onPNGExportRef.current = onPNGExport

  // Pointer-Event-Handler
  const handleStart = useCallback(
    (punkt: Point, _pointerType: string) => {
      letzterPunktRef.current = punkt

      switch (aktivesTool) {
        case 'auswahl': {
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt)
          engine.selektiere(gefunden)
          break
        }

        case 'stift': {
          const id = generiereCommandId()
          stiftBufferRef.current = [punkt]
          stiftMetaRef.current = {
            id,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gestrichelt: stiftGestrichelt || undefined,
          }
          starteStiftRendering()
          break
        }

        case 'radierer': {
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt)
          if (gefunden) engine.loescheById(gefunden)
          break
        }

        case 'linie': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'linie',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gestrichelt: stiftGestrichelt || undefined,
          }
          engine.updateAktiverCommand(cmd)
          break
        }

        case 'pfeil': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'pfeil',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gestrichelt: stiftGestrichelt || undefined,
          }
          engine.updateAktiverCommand(cmd)
          break
        }

        case 'rechteck':
        case 'ellipse': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: aktivesTool as 'rechteck' | 'ellipse',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gefuellt: false,
            gestrichelt: stiftGestrichelt || undefined,
          }
          engine.updateAktiverCommand(cmd)
          break
        }

        case 'text': {
          const cssLeft = (punkt.x / logischeBreite) * 100
          const cssTop = ((punkt.y - 18) / logischeHoehe) * 100
          textOverlayOeffnen({ logischX: punkt.x, logischY: punkt.y, cssLeft, cssTop })
          break
        }
      }
    },
    [aktivesTool, aktiveFarbe, stiftBreite, stiftGestrichelt, engine, logischeBreite, logischeHoehe, starteStiftRendering, textOverlayOeffnen],
  )

  const handleMove = useCallback(
    (punkt: Point, _pointerType: string) => {
      switch (aktivesTool) {
        case 'auswahl': {
          if (engine.state.selektierterCommand === null) break
          const letzter = letzterPunktRef.current
          if (!letzter) break
          const dx = punkt.x - letzter.x
          const dy = punkt.y - letzter.y
          engine.verschiebeSelektierten(dx, dy)
          letzterPunktRef.current = punkt
          break
        }

        case 'stift': {
          stiftBufferRef.current.push(punkt)
          break
        }

        case 'radierer': {
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt)
          if (gefunden) engine.loescheById(gefunden)
          break
        }

        case 'linie': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'linie') break
          engine.updateAktiverCommand({ ...aktiver, bis: punkt })
          break
        }

        case 'pfeil': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'pfeil') break
          engine.updateAktiverCommand({ ...aktiver, bis: punkt })
          break
        }

        case 'rechteck':
        case 'ellipse': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || (aktiver.typ !== 'rechteck' && aktiver.typ !== 'ellipse')) break
          engine.updateAktiverCommand({ ...aktiver, bis: punkt })
          break
        }

        case 'text':
          break
      }
    },
    [aktivesTool, engine],
  )

  const handleEnd = useCallback(
    (punkt: Point, _pointerType: string) => {
      switch (aktivesTool) {
        case 'auswahl': {
          letzterPunktRef.current = null
          break
        }

        case 'stift': {
          stoppeStiftRendering()
          stiftBufferRef.current.push(punkt)
          const meta = stiftMetaRef.current
          if (meta && stiftBufferRef.current.length > 0) {
            engine.addCommand({
              typ: 'stift',
              punkte: stiftBufferRef.current,
              farbe: meta.farbe,
              breite: meta.breite,
              gestrichelt: meta.gestrichelt,
            } as Omit<DrawCommand, 'id'>)
          }
          stiftBufferRef.current = []
          stiftMetaRef.current = null
          break
        }

        case 'radierer':
          break

        case 'linie': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'linie') break
          engine.addCommand({ ...aktiver, bis: punkt } as Omit<DrawCommand, 'id'>)
          break
        }

        case 'pfeil': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'pfeil') break
          engine.addCommand({ ...aktiver, bis: punkt } as Omit<DrawCommand, 'id'>)
          break
        }

        case 'rechteck':
        case 'ellipse': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || (aktiver.typ !== 'rechteck' && aktiver.typ !== 'ellipse')) break
          // Defensive: Omit<DrawCommand,'id'> verteilt sich nicht über Union (rechteck | ellipse)
          engine.addCommand({ ...aktiver, bis: punkt } as unknown as Omit<DrawCommand, 'id'>)
          break
        }

        case 'text':
          break
      }
    },
    [aktivesTool, engine, stoppeStiftRendering],
  )

  // Pointer Events registrieren
  usePointerEvents({
    canvasRef,
    aktivesTool,
    breite: logischeBreite,
    hoehe: logischeHoehe,
    disabled,
    textOverlaySichtbarRef,
    onStart: handleStart,
    onMove: handleMove,
    onEnd: handleEnd,
  })

  // Cursor je nach Werkzeug
  function cursorFuerTool(tool: Tool): string {
    switch (tool) {
      case 'auswahl':   return 'default'
      case 'stift':     return 'crosshair'
      case 'linie':     return 'crosshair'
      case 'pfeil':     return 'crosshair'
      case 'rechteck':  return 'crosshair'
      case 'ellipse':   return 'crosshair'
      case 'text':      return 'text'
      case 'radierer':  return 'cell'
      default:          return 'default'
    }
  }

  // Canvas-Attribute (DPR-aware)
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
  const canvasBreite = Math.round(logischeBreite * dpr)
  const canvasHoehe = Math.round(logischeHoehe * dpr)

  // Tastatur-Shortcuts: Delete-Taste zum Löschen selektierter Elemente
  useEffect(() => {
    if (disabled) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ziel = e.target as HTMLElement
        if (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA') return
        if (engine.state.selektierterCommand !== null) {
          engine.loescheSelektierten()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, engine])

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      style={{ width: '100%', maxWidth: `${logischeBreite}px` }}
    >
      <canvas
        ref={canvasRef}
        width={canvasBreite}
        height={canvasHoehe}
        style={{
          width: '100%',
          maxWidth: `${logischeBreite}px`,
          height: 'auto',
          display: 'block',
          cursor: disabled ? 'not-allowed' : cursorFuerTool(aktivesTool),
          backgroundColor: '#ffffff',
        }}
        className="border-2 border-slate-300 dark:border-slate-600 rounded"
        aria-label="Zeichenfläche"
      />

      {textOverlaySichtbar && (
        <div
          style={{
            position: 'absolute',
            left: `${textOverlayCssLeft}%`,
            top: `${textOverlayCssTop}%`,
            zIndex: 20,
          }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <input
            ref={textOverlayInputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="sentences"
            value={textOverlayText}
            onChange={e => textOverlaySetText(e.target.value)}
            onPointerDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                textOverlayAbschliessen(false)
              } else if (e.key === 'Escape') {
                e.preventDefault()
                textOverlayAbschliessen(true)
              }
              e.stopPropagation()
            }}
            onBlur={textOverlayAbschliessenViaBlur}
            style={{
              fontSize: '18px',
              fontFamily: 'sans-serif',
              color: aktiveFarbe,
              background: 'rgba(255,255,255,0.95)',
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              padding: '4px 8px',
              minWidth: '140px',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            placeholder="Text eingeben..."
          />
        </div>
      )}
    </div>
  )
}

// Hilfsfunktion: Export-Trigger ohne imperatives Handle
export function exportiereCanvasAlsPNG(canvas: HTMLCanvasElement | null): string {
  if (!canvas) return ''
  return canvas.toDataURL('image/png')
}
