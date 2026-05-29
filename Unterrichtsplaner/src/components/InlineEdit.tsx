import { useState, useRef, useEffect } from 'react';
import { usePlannerStore, ZOOM_LEVELS, zs } from '../store/plannerStore';

export function InlineEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { columnZoom } = usePlannerStore();
  const ieZoom = ZOOM_LEVELS[columnZoom] || ZOOM_LEVELS[2];
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(text);
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => onSave(text)}
      className="w-full bg-slate-700 text-slate-100 border border-indigo-400 rounded px-1 py-0.5 outline-none"
      style={{ fontSize: zs(9, ieZoom), minHeight: zs(20, ieZoom) }}
    />
  );
}
