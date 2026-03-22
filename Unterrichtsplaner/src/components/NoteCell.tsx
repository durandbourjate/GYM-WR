import { useState, useRef, useEffect } from 'react';
import { usePlannerStore, ZOOM_LEVELS, zs } from '../store/plannerStore';

/* Inline editable note cell for expanded note column */

export function NoteCell({ weekW, col, cellHeight }: { weekW: string; col: number; cellHeight: number }) {
  const { lessonDetails, updateLessonDetail, weekData, noteColWidth: ncw, columnZoom } = usePlannerStore();
  const nZoomCfg = ZOOM_LEVELS[columnZoom] || ZOOM_LEVELS[2];
  const nz = (base: number) => zs(base, nZoomCfg);
  const detail = lessonDetails[`${weekW}-${col}`];
  const notes = detail?.notes || '';
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(notes);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Check if this week has an entry at all
  const weekEntry = weekData.find(w => w.w === weekW);
  const entry = weekEntry?.lessons[col];
  if (!entry) return <td className="border-b border-slate-900/40 bg-slate-950/30" style={{ width: ncw, minWidth: ncw, maxWidth: ncw, height: cellHeight }} />;

  const displayNotes = notes;

  useEffect(() => { setText(notes); }, [notes]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  if (editing) {
    return (
      <td className="border-b border-slate-900/40 bg-slate-900/60 p-0 border-l border-gray-800/50"
        style={{ width: ncw, minWidth: ncw, maxWidth: ncw, height: cellHeight, verticalAlign: 'top' }}>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (text !== notes) updateLessonDetail(weekW, col, { notes: text || undefined });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setEditing(false); setText(notes); }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); setEditing(false);
              if (text !== notes) updateLessonDetail(weekW, col, { notes: text || undefined });
            }
          }}
          className="w-full h-full bg-transparent text-slate-300 leading-tight p-1 outline-none resize-none border border-indigo-500/50 rounded-sm"
          style={{ fontSize: nz(8) }}
        />
      </td>
    );
  }

  return (
    <td
      className="border-b border-slate-900/40 bg-slate-950/30 p-0 cursor-text border-l border-gray-800/50"
      style={{ width: ncw, minWidth: ncw, maxWidth: ncw, height: cellHeight, verticalAlign: 'top' }}
      onClick={() => setEditing(true)}
      title={displayNotes || 'Klick für Notiz'}
    >
      {displayNotes ? (
        <div className="text-gray-300 leading-tight p-1 overflow-hidden whitespace-pre-line" style={{ fontSize: nz(8), maxHeight: cellHeight }}>
          {displayNotes}
        </div>
      ) : (
        <div className="text-gray-700 p-1 italic" style={{ fontSize: nz(7) }}>…</div>
      )}
    </td>
  );
}
