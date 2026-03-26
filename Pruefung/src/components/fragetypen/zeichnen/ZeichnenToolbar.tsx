import type { Tool, ToolbarLayout } from './ZeichnenTypes';

interface ZeichnenToolbarProps {
  aktivesTool: Tool;
  onToolChange: (tool: Tool) => void;
  aktiveFarbe: string;
  onFarbeChange: (farbe: string) => void;
  verfuegbareWerkzeuge: string[];
  verfuegbareFarben: string[];
  radiererAktiv: boolean;
  layout: ToolbarLayout;
  onLayoutToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAllesLoeschen: () => void;
  kannUndo: boolean;
  kannRedo: boolean;
  disabled: boolean;
  textRotation?: 0 | 90 | 180 | 270;
  onTextRotationChange?: (r: 0 | 90 | 180 | 270) => void;
}

const TOOL_DEFS: { id: Tool; icon: string; label: string; configKey?: string }[] = [
  { id: 'auswahl', icon: '↖', label: 'Auswahl' },
  { id: 'stift', icon: '✏️', label: 'Freihand', configKey: 'stift' },
  { id: 'linie', icon: '╱', label: 'Linie', configKey: 'linie' },
  { id: 'pfeil', icon: '→', label: 'Pfeil', configKey: 'pfeil' },
  { id: 'rechteck', icon: '▭', label: 'Rechteck', configKey: 'rechteck' },
  { id: 'text', icon: 'T', label: 'Text', configKey: 'text' },
  { id: 'radierer', icon: '🧹', label: 'Radierer' },
];

export function ZeichnenToolbar({
  aktivesTool,
  onToolChange,
  aktiveFarbe,
  onFarbeChange,
  verfuegbareWerkzeuge,
  verfuegbareFarben,
  radiererAktiv,
  layout,
  onLayoutToggle,
  onUndo,
  onRedo,
  onAllesLoeschen,
  kannUndo,
  kannRedo,
  disabled,
  textRotation = 0,
  onTextRotationChange,
}: ZeichnenToolbarProps) {
  const isHorizontal = layout === 'horizontal';

  // Filter tools based on config
  const sichtbareTools = TOOL_DEFS.filter((def) => {
    if (def.id === 'auswahl') return true;
    if (def.id === 'radierer') return radiererAktiv;
    if (def.configKey) return (verfuegbareWerkzeuge || []).includes(def.configKey);
    return false;
  });

  const containerKlassen = [
    'flex items-center gap-1.5 p-1',
    isHorizontal ? 'flex-row flex-wrap' : 'flex-col max-h-full overflow-y-auto',
    disabled ? 'pointer-events-none opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const separatorKlassen = isHorizontal
    ? 'w-px h-6 bg-slate-200 dark:bg-slate-600 self-center'
    : 'h-px w-6 bg-slate-200 dark:bg-slate-600 self-center';

  return (
    <div
      role="toolbar"
      aria-label="Zeichenwerkzeuge"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className={containerKlassen}
    >
      {/* Werkzeug-Gruppe */}
      <div
        role="group"
        aria-label="Werkzeuge"
        className={`flex gap-0.5 bg-slate-100 dark:bg-slate-700 rounded-md p-0.5 ${isHorizontal ? 'flex-row' : 'flex-col'}`}
      >
        {sichtbareTools.map((def) => {
          const aktiv = aktivesTool === def.id;
          return (
            <button
              key={def.id}
              role="button"
              aria-pressed={aktiv}
              title={def.label}
              onClick={() => onToolChange(def.id)}
              className={[
                'min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors',
                aktiv
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100'
                  : 'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300',
              ].join(' ')}
            >
              {def.icon}
            </button>
          );
        })}
      </div>

      {/* Trennlinie */}
      <div className={separatorKlassen} aria-hidden="true" />

      {/* Farb-Gruppe */}
      <div
        role="group"
        aria-label="Farben"
        className={`flex gap-1 items-center ${isHorizontal ? 'flex-row' : 'flex-col'}`}
      >
        {verfuegbareFarben.map((farbe) => {
          const aktiv = aktiveFarbe === farbe;
          return (
            <button
              key={farbe}
              role="button"
              aria-pressed={aktiv}
              aria-label={`Farbe ${farbe}`}
              title={farbe}
              onClick={() => onFarbeChange(farbe)}
              className={[
                'min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-all',
                aktiv ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:scale-110',
              ].join(' ')}
            >
              <span
                className="block rounded-full"
                style={{ width: 22, height: 22, backgroundColor: farbe }}
              />
            </button>
          );
        })}
      </div>

      {/* Text-Rotation (nur bei Text-Werkzeug) */}
      {aktivesTool === 'text' && onTextRotationChange && (
        <button
          type="button"
          onClick={() => onTextRotationChange(((textRotation + 90) % 360) as 0 | 90 | 180 | 270)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
          title={`Rotation: ${textRotation}°`}
        >
          ⟳{textRotation > 0 ? ` ${textRotation}°` : ''}
        </button>
      )}

      {/* Trennlinie */}
      <div className={separatorKlassen} aria-hidden="true" />

      {/* Undo/Redo */}
      <div
        role="group"
        aria-label="Verlauf"
        className={`flex gap-0.5 ${isHorizontal ? 'flex-row' : 'flex-col'}`}
      >
        <button
          role="button"
          title="Rückgängig"
          onClick={onUndo}
          disabled={!kannUndo}
          className={[
            'min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm transition-colors',
            'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300',
            !kannUndo ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        >
          ↩
        </button>
        <button
          role="button"
          title="Wiederherstellen"
          onClick={onRedo}
          disabled={!kannRedo}
          className={[
            'min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm transition-colors',
            'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300',
            !kannRedo ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        >
          ↪
        </button>
      </div>

      {/* Spacer — nur horizontal, damit flex-1 den Container vertikal nicht sprengt */}
      {isHorizontal && <div className="flex-1" aria-hidden="true" />}

      {/* Layout-Toggle */}
      <button
        role="button"
        title={isHorizontal ? 'Vertikal anordnen' : 'Horizontal anordnen'}
        onClick={onLayoutToggle}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm transition-colors bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400"
      >
        {isHorizontal ? '⇅' : '⇆'}
      </button>

      {/* Alles löschen */}
      <button
        role="button"
        title="Alles löschen"
        onClick={onAllesLoeschen}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm transition-colors bg-red-50 dark:bg-red-950 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900"
      >
        🗑
      </button>
    </div>
  );
}
