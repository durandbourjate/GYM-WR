import { useEffect, useRef } from 'react';
import type { Point, Tool } from './ZeichnenTypes';

interface UsePointerEventsOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  aktivesTool: Tool;
  breite: number;  // Logische Canvas-Breite
  hoehe: number;   // Logische Canvas-Höhe
  disabled: boolean;
  /** Ref auf den aktuellen textOverlay.sichtbar-Wert — verhindert, dass ein pointerdown
   *  den Text-Overlay-Modus beendet, während das Eingabefeld offen ist. */
  textOverlaySichtbarRef: React.RefObject<boolean>;
  onStart: (punkt: Point, pointerType: string) => void;
  onMove: (punkt: Point, pointerType: string) => void;
  onEnd: (punkt: Point, pointerType: string) => void;
}

/**
 * Normalisiert Canvas-Pointer-Events über Maus, Touch und Stift.
 * Wandelt Display-Pixel in logische Canvas-Koordinaten um,
 * extrahiert Druckwert bei Stifteingabe und verhindert Scroll-Hijacking.
 */
export function usePointerEvents({
  canvasRef,
  aktivesTool,
  breite,
  hoehe,
  disabled,
  textOverlaySichtbarRef,
  onStart,
  onMove,
  onEnd,
}: UsePointerEventsOptions): void {
  // Referenz ob gerade ein Strich aktiv ist (verhindert spurious pointermove-Events)
  const istAmZeichnenRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scroll-Hijacking durch Touch-Gesten verhindern
    canvas.style.touchAction = 'none';

    /**
     * Display-Pixel → Logische Canvas-Koordinaten.
     * Berücksichtigt CSS-Skalierung des Canvas-Elements.
     */
    function konvertiereKoordinaten(event: PointerEvent): Point {
      const rect = canvas!.getBoundingClientRect();
      const x = (event.offsetX / rect.width) * breite;
      const y = (event.offsetY / rect.height) * hoehe;

      // Druckwert: Stift liefert 0.0–1.0, Maus defaultet auf 0.5
      const druck = event.pointerType === 'mouse'
        ? 0.5
        : event.pressure;

      return { x, y, druck };
    }

    function handlePointerDown(event: PointerEvent): void {
      if (disabled) return;

      // Text-Overlay ist offen: pointerdown ignorieren, damit das Eingabefeld stabil bleibt.
      // Das Overlay schliesst sich über Enter, Escape oder Klick ausserhalb.
      if (textOverlaySichtbarRef.current) return;

      // Text-Tool: Kein Pointer-Capture, sonst kann das Text-Input keinen Focus bekommen
      if (aktivesTool !== 'text') {
        canvas!.setPointerCapture(event.pointerId);
      }

      istAmZeichnenRef.current = true;

      const punkt = konvertiereKoordinaten(event);
      onStart(punkt, event.pointerType);
    }

    function handlePointerMove(event: PointerEvent): void {
      if (disabled) return;
      if (!istAmZeichnenRef.current) return;

      const punkt = konvertiereKoordinaten(event);
      onMove(punkt, event.pointerType);
    }

    function handlePointerUp(event: PointerEvent): void {
      if (disabled) return;
      if (!istAmZeichnenRef.current) return;

      istAmZeichnenRef.current = false;

      // Pointer-Capture freigeben — verhindert dass naechster pointerdown verschluckt wird
      try { canvas!.releasePointerCapture(event.pointerId); } catch { /* bereits freigegeben */ }

      const punkt = konvertiereKoordinaten(event);
      onEnd(punkt, event.pointerType);
    }

    function handlePointerCancel(event: PointerEvent): void {
      if (!istAmZeichnenRef.current) return;

      istAmZeichnenRef.current = false;

      try { canvas!.releasePointerCapture(event.pointerId); } catch { /* bereits freigegeben */ }

      const punkt = konvertiereKoordinaten(event);
      onEnd(punkt, event.pointerType);
    }

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      // touch-action zurücksetzen beim Cleanup
      canvas.style.touchAction = '';
    };
  }, [canvasRef, aktivesTool, disabled, breite, hoehe, textOverlaySichtbarRef, onStart, onMove, onEnd]);
}
