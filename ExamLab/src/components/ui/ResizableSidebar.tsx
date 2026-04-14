import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface ResizableSidebarProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
  side?: 'left' | 'right';
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export function ResizableSidebar({
  children,
  title,
  onClose,
  side = 'right',
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 800,
  storageKey,
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

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
    } else {
      setIsMaximized(true);
    }
  };

  const currentWidth = isMaximized ? effectiveMax : width;

  return (
    <div className="flex shrink-0" style={{ order: side === 'right' ? 1 : -1 }}>
      {/* Resize Handle */}
      <div
        data-testid="resize-handle"
        className={`w-1 cursor-col-resize flex items-center justify-center bg-slate-300 dark:bg-slate-600 hover:bg-violet-400 dark:hover:bg-violet-500 transition-colors ${
          side === 'right' ? 'order-first' : 'order-last'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <div className="w-0.5 h-6 bg-slate-400 dark:bg-slate-500 rounded-full" />
      </div>

      {/* Sidebar Content */}
      <div
        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-y-auto flex flex-col"
        style={{ width: currentWidth, borderLeftWidth: side === 'right' ? 0 : 1, borderRightWidth: side === 'left' ? 0 : 1 }}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
