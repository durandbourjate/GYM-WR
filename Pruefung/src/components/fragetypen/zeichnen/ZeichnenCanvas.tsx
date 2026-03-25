import { useEffect, useRef, useState, useCallback } from 'react';
import type { CanvasConfig } from '../../../types/fragen';
import type { Tool, DrawCommand, Point } from './ZeichnenTypes';
import { GROESSE_PRESETS, generiereCommandId } from './ZeichnenTypes';
import { useDrawingEngine, findeCommandBeiPunkt } from './useDrawingEngine';
import { usePointerEvents } from './usePointerEvents';

// ============================================================
// Props
// ============================================================

interface ZeichnenCanvasProps {
  canvasConfig: CanvasConfig;
  aktivesTool: Tool;
  aktiveFarbe: string;
  stiftBreite?: number;
  initialDaten?: string;
  onDatenChange: (daten: string) => void;
  onPNGExport: (png: string) => void;
  disabled: boolean;
}

// Text-Overlay-Zustand
interface TextOverlay {
  sichtbar: boolean;
  logischX: number;
  logischY: number;
  cssLeft: number;
  cssTop: number;
  text: string;
}

const TEXT_OVERLAY_LEER: TextOverlay = {
  sichtbar: false,
  logischX: 0,
  logischY: 0,
  cssLeft: 0,
  cssTop: 0,
  text: '',
};

// ============================================================
// Hilfsfunktion: Canvas-Dimensionen aus Config ermitteln
// ============================================================

function berechneDimensionen(
  canvasConfig: CanvasConfig,
  hintergrundbild: HTMLImageElement | null
): { breite: number; hoehe: number } {
  const preset = canvasConfig.groessePreset;

  if (preset === 'auto' && hintergrundbild) {
    return { breite: hintergrundbild.naturalWidth, hoehe: hintergrundbild.naturalHeight };
  }

  if (preset && preset !== 'auto' && GROESSE_PRESETS[preset]) {
    return GROESSE_PRESETS[preset];
  }

  if (canvasConfig.breite && canvasConfig.hoehe) {
    return { breite: canvasConfig.breite, hoehe: canvasConfig.hoehe };
  }

  // Fallback: mittel
  return GROESSE_PRESETS['mittel'];
}

// ============================================================
// Debounce-Hilfsfunktion
// ============================================================

function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

// ============================================================
// Hauptkomponente
// ============================================================

export function ZeichnenCanvas({
  canvasConfig,
  aktivesTool,
  aktiveFarbe,
  stiftBreite = 2,
  initialDaten,
  onDatenChange,
  onPNGExport,
  disabled,
}: ZeichnenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hintergrundbild laden
  const [hintergrundbild, setHintergrundbild] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!canvasConfig.hintergrundbild) {
      setHintergrundbild(null);
      return;
    }
    const img = new Image();
    img.onload = () => setHintergrundbild(img);
    img.src = canvasConfig.hintergrundbild;
  }, [canvasConfig.hintergrundbild]);

  // Canvas-Dimensionen berechnen
  const { breite: logischeBreite, hoehe: logischeHoehe } = berechneDimensionen(
    canvasConfig,
    hintergrundbild
  );

  // Drawing Engine
  const engine = useDrawingEngine({
    hintergrundbild,
    breite: logischeBreite,
    hoehe: logischeHoehe,
  });

  // Text-Overlay-Zustand
  const [textOverlay, setTextOverlay] = useState<TextOverlay>(TEXT_OVERLAY_LEER);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Zustand für Drag (Auswahl-Werkzeug)
  const letzterPunktRef = useRef<Point | null>(null);

  // ============================================================
  // Daten laden wenn initialDaten sich ändert (Fragen-Wechsel)
  // ============================================================

  useEffect(() => {
    if (initialDaten) {
      engine.ladeDaten(initialDaten);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDaten]);

  // ============================================================
  // Render-Loop: bei State-Änderungen neu zeichnen
  // ============================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Canvas-Hintergrund immer weiss
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // DPR-Skalierung für scharfe Darstellung
    ctx.save();
    ctx.scale(dpr, dpr);
    engine.render(ctx);
    ctx.restore();
  }, [engine.state, engine, hintergrundbild]);

  // ============================================================
  // PNG-Export: onPNGExport-Callback via Ref bedienen
  // ============================================================

  // Ref für stabilen Zugriff auf engine.exportierePNG
  const exportiereRef = useRef(engine.exportierePNG);
  exportiereRef.current = engine.exportierePNG;

  const onPNGExportRef = useRef(onPNGExport);
  onPNGExportRef.current = onPNGExport;

  // Export-Funktion wird von der Elternkomponente über onPNGExport-Trigger ausgelöst
  // Wird über useImperativeHandle nicht benötigt — Eltern nutzt onPNGExport-Callback
  // Canvas-Element ist über canvasRef zugänglich

  // ============================================================
  // Auto-Save: debounced onDatenChange bei Commands-Änderung
  // ============================================================

  const onDatenChangeRef = useRef(onDatenChange);
  onDatenChangeRef.current = onDatenChange;

  const serializiereRef = useRef(engine.serialisiere);
  serializiereRef.current = engine.serialisiere;

  const debouncedSave = useDebounce(
    useCallback(() => {
      onDatenChangeRef.current(serializiereRef.current());
    }, []),
    400
  );

  useEffect(() => {
    debouncedSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state.commands]);

  // ============================================================
  // Text-Overlay: abschliessen (Enter / Blur)
  // ============================================================

  const textAbschliessen = useCallback(
    (abbrechen = false) => {
      setTextOverlay(prev => {
        if (!prev.sichtbar) return prev;

        if (!abbrechen && prev.text.trim().length > 0) {
          // Cast nötig weil Omit<DrawCommand, 'id'> die Union nicht verteilt
          engine.addCommand({
            typ: 'text',
            position: { x: prev.logischX, y: prev.logischY },
            text: prev.text.trim(),
            farbe: aktiveFarbe,
            groesse: 18,
          } as Omit<DrawCommand, 'id'>);
        }

        return TEXT_OVERLAY_LEER;
      });
    },
    [aktiveFarbe, engine]
  );

  // Text-Input Auto-Focus wenn Overlay erscheint
  // Mehrfacher Versuch wegen iOS/Tablet-Einschränkungen bei programmatischem Focus
  useEffect(() => {
    if (textOverlay.sichtbar && textInputRef.current) {
      // Sofort versuchen
      textInputRef.current.focus();
      // Fallback nach kurzer Verzögerung (iOS braucht manchmal einen Frame)
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [textOverlay.sichtbar]);

  // ============================================================
  // Pointer-Event-Handler
  // ============================================================

  const handleStart = useCallback(
    (punkt: Point, _pointerType: string) => {
      letzterPunktRef.current = punkt;

      switch (aktivesTool) {
        case 'auswahl': {
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt);
          engine.selektiere(gefunden);
          break;
        }

        case 'stift': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'stift',
            punkte: [punkt],
            farbe: aktiveFarbe,
            breite: stiftBreite,
          };
          engine.updateAktiverCommand(cmd);
          break;
        }

        case 'radierer': {
          // Objekt-Radierer: Objekt unter Cursor finden und löschen
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt);
          if (gefunden) engine.loescheById(gefunden);
          break;
        }

        case 'linie': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'linie',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
          };
          engine.updateAktiverCommand(cmd);
          break;
        }

        case 'pfeil': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'pfeil',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
          };
          engine.updateAktiverCommand(cmd);
          break;
        }

        case 'rechteck': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'rechteck',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gefuellt: false,
          };
          engine.updateAktiverCommand(cmd);
          break;
        }

        case 'text': {
          // Text-Overlay anzeigen an geklickter Stelle (prozentual positioniert)
          const cssLeft = (punkt.x / logischeBreite) * 100;
          const cssTop = ((punkt.y - 18) / logischeHoehe) * 100;

          setTextOverlay({
            sichtbar: true,
            logischX: punkt.x,
            logischY: punkt.y,
            cssLeft,
            cssTop,
            text: '',
          });
          break;
        }
      }
    },
    [aktivesTool, aktiveFarbe, stiftBreite, engine, logischeBreite, logischeHoehe]
  );

  const handleMove = useCallback(
    (punkt: Point, _pointerType: string) => {
      switch (aktivesTool) {
        case 'auswahl': {
          if (engine.state.selektierterCommand === null) break;
          const letzter = letzterPunktRef.current;
          if (!letzter) break;
          const dx = punkt.x - letzter.x;
          const dy = punkt.y - letzter.y;
          engine.verschiebeSelektierten(dx, dy);
          letzterPunktRef.current = punkt;
          break;
        }

        case 'stift': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'stift') break;
          engine.updateAktiverCommand({
            ...aktiver,
            punkte: [...aktiver.punkte, punkt],
          });
          break;
        }

        case 'radierer': {
          // Objekt-Radierer: Objekt unter Cursor beim Bewegen löschen
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt);
          if (gefunden) engine.loescheById(gefunden);
          break;
        }

        case 'linie': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'linie') break;
          engine.updateAktiverCommand({ ...aktiver, bis: punkt });
          break;
        }

        case 'pfeil': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'pfeil') break;
          engine.updateAktiverCommand({ ...aktiver, bis: punkt });
          break;
        }

        case 'rechteck': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'rechteck') break;
          engine.updateAktiverCommand({ ...aktiver, bis: punkt });
          break;
        }

        case 'text':
          // Kein Verhalten beim Bewegen im Text-Modus
          break;
      }
    },
    [aktivesTool, engine]
  );

  const handleEnd = useCallback(
    (punkt: Point, _pointerType: string) => {
      switch (aktivesTool) {
        case 'auswahl': {
          letzterPunktRef.current = null;
          break;
        }

        case 'stift': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'stift') break;
          const mitEndpunkt = {
            ...aktiver,
            punkte: [...aktiver.punkte, punkt],
          };
          engine.addCommand(mitEndpunkt as Omit<DrawCommand, 'id'>);
          engine.updateAktiverCommand(null);
          break;
        }

        case 'radierer':
          // Objekt-Radierer: nichts zu finalisieren
          break;

        case 'linie': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'linie') break;
          engine.addCommand({ ...aktiver, bis: punkt } as Omit<DrawCommand, 'id'>);
          engine.updateAktiverCommand(null);
          break;
        }

        case 'pfeil': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'pfeil') break;
          engine.addCommand({ ...aktiver, bis: punkt } as Omit<DrawCommand, 'id'>);
          engine.updateAktiverCommand(null);
          break;
        }

        case 'rechteck': {
          const aktiver = engine.state.aktiverCommand;
          if (!aktiver || aktiver.typ !== 'rechteck') break;
          engine.addCommand({ ...aktiver, bis: punkt } as Omit<DrawCommand, 'id'>);
          engine.updateAktiverCommand(null);
          break;
        }

        case 'text':
          // Text wird über Overlay-Input abgeschlossen
          break;
      }
    },
    [aktivesTool, engine]
  );

  // Pointer Events registrieren
  usePointerEvents({
    canvasRef,
    aktivesTool,
    breite: logischeBreite,
    hoehe: logischeHoehe,
    disabled,
    onStart: handleStart,
    onMove: handleMove,
    onEnd: handleEnd,
  });

  // ============================================================
  // Cursor je nach Werkzeug
  // ============================================================

  function cursorFuerTool(tool: Tool): string {
    switch (tool) {
      case 'auswahl':   return 'default';
      case 'stift':     return 'crosshair';
      case 'linie':     return 'crosshair';
      case 'pfeil':     return 'crosshair';
      case 'rechteck':  return 'crosshair';
      case 'text':      return 'text';
      case 'radierer':  return 'cell';
      default:          return 'default';
    }
  }

  // ============================================================
  // Canvas-Attribute (DPR-aware)
  // ============================================================

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const canvasBreite = Math.round(logischeBreite * dpr);
  const canvasHoehe  = Math.round(logischeHoehe * dpr);

  // ============================================================
  // Tastatur-Shortcuts: Delete-Taste zum Löschen selektierter Elemente
  // ============================================================

  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Nur wenn kein Input-Feld fokussiert ist
        const ziel = e.target as HTMLElement;
        if (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA') return;
        if (engine.state.selektierterCommand !== null) {
          engine.loescheSelektierten();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, engine]);

  // ============================================================
  // PNG-Export via canvasRef (von Elternkomponente aufrufbar)
  // ============================================================

  // Elternkomponente übergibt onPNGExport — wir rufen ihn proaktiv beim ersten
  // Render nicht auf, sondern stellen den Canvas via Ref bereit.
  // Export kann auch über canvasRef.current direkt erfolgen.
  // Für die "Export on demand"-Variante: Eltern ruft eine per forwardRef
  // exponierte Methode auf. Hier vereinfacht: Export-Trigger über Effect.
  // Da die Aufgabe sagt "onPNGExport is called by the parent", delegieren wir:
  // Elternkomponente kann engine.exportierePNG(canvasRef.current) aufrufen.
  // Alternativ: canvasRef wird geforwardet.

  // ============================================================
  // Render
  // ============================================================

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

      {/* Text-Eingabe-Overlay — kein onBlur (Touch-Geräte verlieren sonst Focus) */}
      {textOverlay.sichtbar && (
        <div
          style={{
            position: 'absolute',
            left: `${textOverlay.cssLeft}%`,
            top: `${textOverlay.cssTop}%`,
            zIndex: 20,
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <input
            ref={textInputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="sentences"
            value={textOverlay.text}
            onChange={e =>
              setTextOverlay(prev => ({ ...prev, text: e.target.value }))
            }
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                textAbschliessen(false);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                textAbschliessen(true);
              }
              e.stopPropagation();
            }}
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
            placeholder="Text eingeben…"
          />
          <button
            type="button"
            onClick={() => textAbschliessen(false)}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 600,
              minHeight: '32px',
            }}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => textAbschliessen(true)}
            style={{
              background: '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              cursor: 'pointer',
              minHeight: '32px',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// canvasRef-Zugriff für PNG-Export von aussen ermöglichen
// ============================================================

// Hilfsfunktion: Export-Trigger ohne imperatives Handle
export function exportiereCanvasAlsPNG(canvas: HTMLCanvasElement | null): string {
  if (!canvas) return '';
  return canvas.toDataURL('image/png');
}
