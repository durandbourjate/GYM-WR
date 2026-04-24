import { useState, useRef, useCallback, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

interface UseResizableHandleOptions {
  defaultWidth: number;
  minWidth: number;
  /** Fester Max-Wert. Für viewport-dynamische Maxima beim Mount berechnen und reingeben. */
  maxWidth?: number;
  /** Seite an der der Drag-Handle sitzt. Handle-Bewegung in Handle-Richtung = grösser. */
  side?: 'left' | 'right';
  /** Wenn gesetzt: Breite wird unter `sidebar-${storageKey}` persistiert. */
  storageKey?: string;
}

interface UseResizableHandleReturn {
  width: number;
  setWidth: (w: number) => void;
  onPointerDown: (e: ReactPointerEvent) => void;
  isDragging: boolean;
}

/**
 * Shared Drag-to-Resize-Hook für Sidebar-/Panel-Breiten.
 * Konsumenten: ResizableSidebar, Layout-aside (SuS-Prüfung), MaterialPanel.
 *
 * Verhalten identisch zum bisherigen Custom-Code in den 3 Komponenten:
 * - Drag setzt document.body cursor+userSelect während der Aktion
 * - pointerup persistiert in localStorage wenn storageKey gesetzt
 * - unmount während Drag räumt Listener + Body-Styles auf
 */
export function useResizableHandle({
  defaultWidth,
  minWidth,
  maxWidth,
  side = 'right',
  storageKey,
}: UseResizableHandleOptions): UseResizableHandleReturn {
  const effectiveMaxWidth = maxWidth ?? Number.MAX_SAFE_INTEGER;

  const [width, setWidth] = useState(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(`sidebar-${storageKey}`);
        if (raw !== null) {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            return Math.max(minWidth, Math.min(effectiveMaxWidth, parsed));
          }
        }
      } catch {
        /* ignore */
      }
    }
    return defaultWidth;
  });

  const [isDragging, setIsDragging] = useState(false);

  // Refs für Drag-State (vermeidet Re-Render-Schleifen)
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const latestWidthRef = useRef(width);
  const sideRef = useRef(side);
  const storageKeyRef = useRef(storageKey);
  const minWidthRef = useRef(minWidth);
  const maxWidthRef = useRef(effectiveMaxWidth);
  const handlersRef = useRef<{
    move: ((ev: MouseEvent) => void) | null;
    up: (() => void) | null;
  }>({ move: null, up: null });

  // Refs aktualisieren bei Options-Änderung
  useEffect(() => {
    sideRef.current = side;
  }, [side]);
  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);
  useEffect(() => {
    minWidthRef.current = minWidth;
  }, [minWidth]);
  useEffect(() => {
    maxWidthRef.current = effectiveMaxWidth;
  }, [effectiveMaxWidth]);
  useEffect(() => {
    latestWidthRef.current = width;
  }, [width]);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = latestWidthRef.current;

    const handleMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const diff =
        sideRef.current === 'right'
          ? ev.clientX - startXRef.current
          : startXRef.current - ev.clientX;
      const next = Math.max(
        minWidthRef.current,
        Math.min(maxWidthRef.current, startWidthRef.current + diff)
      );
      latestWidthRef.current = next;
      setWidth(next);
    };
    const handleUp = () => {
      draggingRef.current = false;
      setIsDragging(false);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      handlersRef.current = { move: null, up: null };
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (storageKeyRef.current) {
        try {
          localStorage.setItem(`sidebar-${storageKeyRef.current}`, String(latestWidthRef.current));
        } catch {
          /* ignore */
        }
      }
    };
    handlersRef.current = { move: handleMove, up: handleUp };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // Cleanup bei Unmount während Drag
  useEffect(() => {
    return () => {
      if (draggingRef.current) {
        const { move, up } = handlersRef.current;
        if (move) document.removeEventListener('pointermove', move);
        if (up) document.removeEventListener('pointerup', up);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, []);

  return { width, setWidth, onPointerDown, isDragging };
}
