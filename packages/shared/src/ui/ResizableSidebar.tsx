import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

// Modul-lokaler Zähler: jede neu geöffnete overlay-Sidebar bekommt den nächsthöheren z-Index.
// Startet bei 50 (unter Dialogen/Toasts), zählt bei jedem Mount hoch.
let nextOverlayZIndex = 50;

interface ResizableSidebarProps {
  children: ReactNode;
  onClose: () => void;
  /** 'layout' = im flex-layout (Einstellungen), 'overlay' = fixed + Backdrop */
  mode?: 'layout' | 'overlay';
  /** Wenn gesetzt: eingebauter Header mit Title + Maximieren + Schliessen */
  title?: string;
  side?: 'left' | 'right';
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  /** Nur für overlay: App-Header-Höhe (Sidebar beginnt darunter) */
  topOffset?: number;
  /** Nur für overlay: expliziter z-Index. Wenn nicht gesetzt, auto-increment (zuletzt geöffnet = zuoberst). */
  zIndex?: number;
  /** ESC schliesst. Default true. */
  closeOnEsc?: boolean;
  /** Klick auf Backdrop schliesst (nur overlay). Default true. */
  closeOnBackdrop?: boolean;
}

/**
 * ResizableSidebar — gemeinsame Sidebar-Komponente für ExamLab.
 *
 * Zwei Modi:
 * - **layout**: sitzt im flex-Layout (z.B. EinstellungenPanel rechts neben Hauptinhalt).
 * - **overlay**: fixed + Backdrop über Hauptinhalt (Frageneditor, Hilfe, Fragensammlung).
 *
 * Beide Modi: Resize per Drag-Handle (violetter Hover), ESC + ggf. Klick-daneben schliessen.
 */
export function ResizableSidebar({
  children,
  onClose,
  mode = 'layout',
  title,
  side = 'right',
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 2000,
  storageKey,
  topOffset = 0,
  zIndex,
  closeOnEsc = true,
  closeOnBackdrop = true,
}: ResizableSidebarProps) {
  // Breite aus localStorage laden oder Default verwenden
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`sidebar-${storageKey}`);
        if (saved) return Math.max(minWidth, Math.min(maxWidth, Number(saved)));
      } catch { /* ignorieren */ }
    }
    return defaultWidth;
  });

  const [isMaximized, setIsMaximized] = useState(false);

  // Auto-z-Index: beim ersten Render wird der nächste Zähler-Wert geholt.
  // So liegt die zuletzt geöffnete overlay-Sidebar immer zuoberst.
  const [autoZIndex] = useState(() => {
    if (mode !== 'overlay') return 0;
    nextOverlayZIndex += 1;
    return nextOverlayZIndex;
  });
  const effectiveZIndex = zIndex ?? autoZIndex;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Dynamisches Max: Viewport - 300px Mindestbreite Hauptinhalt
  const effectiveMax = Math.min(maxWidth, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 300);

  // localStorage speichern
  useEffect(() => {
    if (storageKey && !isMaximized) {
      try {
        localStorage.setItem(`sidebar-${storageKey}`, String(width));
      } catch { /* quota */ }
    }
  }, [width, storageKey, isMaximized]);

  // ESC zum Schliessen
  useEffect(() => {
    if (!closeOnEsc) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [closeOnEsc, onClose]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = side === 'right'
      ? startX.current - e.clientX
      : e.clientX - startX.current;
    const newWidth = Math.max(minWidth, Math.min(effectiveMax, startWidth.current + delta));
    setWidth(newWidth);
    setIsMaximized(false);
  }, [side, minWidth, effectiveMax]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const toggleMaximize = () => setIsMaximized(v => !v);
  const currentWidth = isMaximized ? effectiveMax : width;

  // Resize-Handle (einheitlicher Stil über beide Modi)
  const resizeHandleClass = `${mode === 'overlay' ? 'absolute top-0 bottom-0' : 'flex items-center justify-center'} w-1 cursor-col-resize z-10 bg-slate-300 dark:bg-slate-600 hover:bg-violet-400 dark:hover:bg-violet-500 active:bg-violet-500 dark:active:bg-violet-600 transition-colors ${
    mode === 'overlay'
      ? (side === 'right' ? 'left-0' : 'right-0')
      : (side === 'right' ? 'order-first' : 'order-last')
  }`;

  const resizeHandle = (
    <div
      data-testid="resize-handle"
      className={resizeHandleClass}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }}
      title="Breite anpassen"
    >
      {mode === 'layout' && <div className="w-0.5 h-6 bg-slate-400 dark:bg-slate-500 rounded-full" />}
    </div>
  );

  const header = title ? (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleMaximize}
          aria-label="Maximieren"
          className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
          title={isMaximized ? 'Verkleinern' : 'Maximieren'}
        >
          {isMaximized ? '⤡' : '⤢'}
        </button>
        <button
          onClick={onClose}
          aria-label="Schliessen"
          className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;

  // Layout-Modus: sitzt im flex-layout
  if (mode === 'layout') {
    return (
      <div className="flex shrink-0" style={{ order: side === 'right' ? 1 : -1 }}>
        {resizeHandle}
        <div
          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-y-auto flex flex-col"
          style={{ width: currentWidth, borderLeftWidth: side === 'right' ? 0 : 1, borderRightWidth: side === 'left' ? 0 : 1 }}
        >
          {header}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    );
  }

  // Overlay-Modus: fixed + Backdrop
  return (
    <div
      className="fixed inset-0 flex pointer-events-none"
      style={{ zIndex: effectiveZIndex }}
    >
      <div
        className="absolute left-0 right-0 bottom-0 bg-black/40 pointer-events-auto"
        style={{ top: topOffset }}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={`absolute bottom-0 bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto overflow-hidden ${side === 'right' ? 'right-0' : 'left-0'}`}
        style={{ top: topOffset, width: currentWidth, maxWidth: '90vw' }}
        onWheel={(e) => e.stopPropagation()}
      >
        {resizeHandle}
        {header}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
