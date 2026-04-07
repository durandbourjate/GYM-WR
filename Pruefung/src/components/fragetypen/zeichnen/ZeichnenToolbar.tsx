import { useState } from 'react';
import type { Tool, ToolbarLayout } from './ZeichnenTypes';
import ToolbarDropdown from '../../shared/ToolbarDropdown';
import Tooltip from '../../ui/Tooltip';

/** Inline SVG Radierer-Icon */
function RadiererIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0l5.18 5.18a2 2 0 0 1 0 2.82L14 20" />
      <path d="M6 12l4 4" />
    </svg>
  );
}

/** Stift-Stärken */
const STIFT_STAERKEN = [
  { label: 'Dünn', wert: 1 },
  { label: 'Mittel', wert: 2 },
  { label: 'Dick', wert: 4 },
] as const;

/** Formen-Icons */
const FORM_ICONS: Record<string, string> = {
  linie: '╱',
  pfeil: '→',
  rechteck: '▭',
  ellipse: '○',
};

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
  stiftBreite?: number;
  onStiftBreiteChange?: (breite: number) => void;
  stiftGestrichelt?: boolean;
  onStiftGestricheltChange?: (gestrichelt: boolean) => void;
  textRotation?: 0 | 90 | 180 | 270;
  onTextRotationChange?: (r: 0 | 90 | 180 | 270) => void;
  textGroesse?: number;
  onTextGroesseChange?: (g: number) => void;
  textFett?: boolean;
  onTextFettChange?: (f: boolean) => void;
  istTextSelektiert?: boolean;
}

const FORMEN_TOOLS: Tool[] = ['linie', 'pfeil', 'rechteck', 'ellipse'];

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
  stiftBreite = 2,
  onStiftBreiteChange,
  stiftGestrichelt = false,
  onStiftGestricheltChange,
  textRotation = 0,
  onTextRotationChange,
  textGroesse = 18,
  onTextGroesseChange,
  textFett = false,
  onTextFettChange,
  istTextSelektiert = false,
}: ZeichnenToolbarProps) {
  const [zeigeLoeschenDialog, setZeigeLoeschenDialog] = useState(false);
  const isHorizontal = layout === 'horizontal';

  // Verfügbare Formen aus Konfiguration
  const verfuegbareFormen = FORMEN_TOOLS.filter((t) =>
    t === 'ellipse' || (verfuegbareWerkzeuge || []).includes(t)
  );
  const istFormenAktiv = FORMEN_TOOLS.includes(aktivesTool);
  const aktiveFormIcon = FORM_ICONS[aktivesTool] ?? FORM_ICONS['rechteck'];

  const hatStift = (verfuegbareWerkzeuge || []).includes('stift');
  const hatText = (verfuegbareWerkzeuge || []).includes('text');

  const containerKlassen = [
    'flex items-center gap-1.5 p-1',
    isHorizontal ? 'flex-row flex-wrap' : 'flex-col',
    disabled ? 'pointer-events-none opacity-50' : '',
  ].filter(Boolean).join(' ');

  const btnKlassen = (aktiv: boolean) => [
    'min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors',
    aktiv
      ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100'
      : 'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300',
  ].join(' ');

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
      {/* Layout-Toggle (erstes Element) */}
      <Tooltip text={isHorizontal ? 'Vertikal anordnen' : 'Horizontal anordnen'}>
        <button
          type="button"
          onClick={onLayoutToggle}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm transition-colors bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400"
        >
          {isHorizontal ? '⇅' : '⇆'}
        </button>
      </Tooltip>

      <div className={separatorKlassen} aria-hidden="true" />

      {/* Auswahl */}
      <Tooltip text="Auswahl">
        <button type="button" onClick={() => onToolChange('auswahl')} className={btnKlassen(aktivesTool === 'auswahl')}>
          ↖
        </button>
      </Tooltip>

      {/* Stift-Menü (Stärke + Stil) — Klick aktiviert Stift + öffnet Optionen */}
      {hatStift && (
        <ToolbarDropdown
          icon={<span style={{ fontSize: stiftBreite > 2 ? 18 : 14 }}>✏️</span>}
          label="Freihand"
          aktiv={aktivesTool === 'stift'}
          horizontal={isHorizontal}
          onOpen={() => onToolChange('stift')}
        >
          <div className="flex flex-col gap-1 min-w-[120px]">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">Stärke</span>
            {STIFT_STAERKEN.map(({ label, wert }) => (
              <button
                key={wert}
                type="button"
                onClick={() => {
                  onStiftBreiteChange?.(wert);
                  onToolChange('stift');
                }}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                  stiftBreite === wert && aktivesTool === 'stift'
                    ? 'bg-slate-200 dark:bg-slate-600 font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                <span className="inline-block rounded-full bg-current" style={{ width: wert * 3, height: wert * 3 }} />
                {label}
              </button>
            ))}
            <div className="h-px bg-slate-200 dark:bg-slate-600 my-1" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">Stil</span>
            <button
              type="button"
              onClick={() => { onStiftGestricheltChange?.(false); onToolChange('stift'); }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${!stiftGestrichelt ? 'bg-slate-200 dark:bg-slate-600 font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span className="inline-block w-6 h-0.5 bg-current" /> Durchgehend
            </button>
            <button
              type="button"
              onClick={() => { onStiftGestricheltChange?.(true); onToolChange('stift'); }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${stiftGestrichelt ? 'bg-slate-200 dark:bg-slate-600 font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span className="inline-block w-6 border-t-2 border-dashed border-current" /> Gestrichelt
            </button>
          </div>
        </ToolbarDropdown>
      )}

      {/* Formen-Menü (Linie, Pfeil, Rechteck, Ellipse) */}
      {verfuegbareFormen.length > 0 && (
        <ToolbarDropdown
          icon={aktiveFormIcon}
          label="Formen"
          aktiv={istFormenAktiv}
          horizontal={isHorizontal}
          onOpen={() => { if (!istFormenAktiv) onToolChange('rechteck') }}
        >
          <div className="flex flex-col gap-0.5 min-w-[100px]">
            {verfuegbareFormen.map((formTool) => (
              <button
                key={formTool}
                type="button"
                onClick={() => onToolChange(formTool)}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                  aktivesTool === formTool
                    ? 'bg-slate-200 dark:bg-slate-600 font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                <span className="w-5 text-center">{FORM_ICONS[formTool]}</span>
                {formTool === 'linie' ? 'Linie' : formTool === 'pfeil' ? 'Pfeil' : formTool === 'rechteck' ? 'Rechteck' : 'Ellipse'}
              </button>
            ))}
          </div>
        </ToolbarDropdown>
      )}

      {/* Text-Menü (Klick aktiviert Text-Werkzeug + öffnet Optionen) */}
      {hatText && (
        <ToolbarDropdown
          icon="T"
          label="Text"
          aktiv={aktivesTool === 'text' || istTextSelektiert}
          horizontal={isHorizontal}
          onOpen={() => onToolChange('text')}
        >
          <div className="flex flex-col gap-1 min-w-[120px]" onClick={(e) => e.stopPropagation()}>
            {/* Grösse */}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">Grösse</span>
            <div className="flex gap-0.5 px-1">
              {([{ label: 'S', wert: 14 }, { label: 'M', wert: 18 }, { label: 'L', wert: 24 }, { label: 'XL', wert: 32 }] as const).map(({ label, wert }) => (
                <button key={label} type="button" onClick={() => onTextGroesseChange?.(wert)}
                  className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-xs font-medium transition-colors ${textGroesse === wert ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >{label}</button>
              ))}
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-600 my-0.5" />
            {/* Fett + Rotation */}
            <div className="flex gap-1 px-1">
              <button type="button" onClick={() => onTextFettChange?.(!textFett)}
                className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-sm transition-colors ${textFett ? 'bg-slate-200 dark:bg-slate-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >B</button>
              <button type="button" onClick={() => onTextRotationChange?.(((textRotation + 90) % 360) as 0 | 90 | 180 | 270)}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                >⟳{textRotation > 0 ? `${textRotation}°` : ''}</button>
            </div>
          </div>
        </ToolbarDropdown>
      )}

      {/* Radierer */}
      {radiererAktiv && (
        <Tooltip text="Radierer">
          <button type="button" onClick={() => onToolChange('radierer')} className={btnKlassen(aktivesTool === 'radierer')}>
            <RadiererIcon />
          </button>
        </Tooltip>
      )}

      <div className={separatorKlassen} aria-hidden="true" />

      {/* Farben-Menü */}
      <ToolbarDropdown
        icon={<span className="block rounded-full" style={{ width: 18, height: 18, backgroundColor: aktiveFarbe }} />}
        label="Farbe"
        horizontal={isHorizontal}
      >
        <div className="grid grid-cols-3 gap-2" style={{ minWidth: 156 }}>
          {verfuegbareFarben.map((farbe) => (
            <Tooltip text={farbe}>
              <button
                key={farbe}
                type="button"
                onClick={() => onFarbeChange(farbe)}
                className={[
                  'w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-all',
                  aktiveFarbe === farbe ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110',
                ].join(' ')}
              >
                <span className="block rounded-full border border-slate-300 dark:border-slate-500" style={{ width: 30, height: 30, backgroundColor: farbe }} />
              </button>
            </Tooltip>
          ))}
        </div>
      </ToolbarDropdown>

      <div className={separatorKlassen} aria-hidden="true" />

      {/* Undo/Redo */}
      <div role="group" aria-label="Verlauf" className={`flex gap-0.5 ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
        <Tooltip text="Rückgängig">
          <button type="button" onClick={onUndo} disabled={!kannUndo}
            className={`${btnKlassen(false)} ${!kannUndo ? 'opacity-40 cursor-not-allowed' : ''}`}>↩</button>
        </Tooltip>
        <Tooltip text="Wiederherstellen">
          <button type="button" onClick={onRedo} disabled={!kannRedo}
            className={`${btnKlassen(false)} ${!kannRedo ? 'opacity-40 cursor-not-allowed' : ''}`}>↪</button>
        </Tooltip>
      </div>

      {isHorizontal && <div className="flex-1" aria-hidden="true" />}

      {/* Alles löschen */}
      <Tooltip text="Alles löschen">
        <button
          type="button"
          onClick={() => setZeigeLoeschenDialog(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm transition-colors bg-red-50 dark:bg-red-950 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900"
        >
          🗑
        </button>
      </Tooltip>

      {/* Bestätigungsdialog */}
      {zeigeLoeschenDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setZeigeLoeschenDialog(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Alles löschen?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">Alle Zeichnungen werden unwiderruflich entfernt.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setZeigeLoeschenDialog(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                Abbrechen
              </button>
              <button type="button" onClick={() => { onAllesLoeschen(); setZeigeLoeschenDialog(false) }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
