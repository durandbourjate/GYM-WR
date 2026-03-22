import { useEffect, useRef } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { SequencePanel } from './SequencePanel';
import { SettingsPanel } from './SettingsPanel';
import { CollectionPanel } from './CollectionPanel';
import { DetailsTab } from './detail/DetailsTab';
import { BatchEditTab } from './detail/BatchEditTab';

// Re-export for use in WeekRows etc.
export { CATEGORIES, getSubtypesForCategory, getEffectiveCategorySubtype, getCategoryLabel, getSubtypeLabel } from '../data/blockCategories';

// Switcher: show batch edit when multiple cells selected, else normal details
function BatchOrDetailsTab() {
  const { multiSelection } = usePlannerStore();
  if (multiSelection.length > 1) return <BatchEditTab />;
  return <DetailsTab />;
}

export function DetailPanel() {
  const {
    sidePanelOpen, setSidePanelOpen,
    sidePanelTab, setSidePanelTab,
    sequencePanelOpen,
  } = usePlannerStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // H6: Panel beim Öffnen/Tab-Wechsel nach oben scrollen
  useEffect(() => {
    if (!sidePanelOpen) return;
    requestAnimationFrame(() => {
      if (panelRef.current) {
        panelRef.current.scrollTop = 0;
        const scrollable = panelRef.current.querySelector('.overflow-y-auto');
        if (scrollable) (scrollable as HTMLElement).scrollTop = 0;
      }
    });
  }, [sidePanelOpen, sidePanelTab]);

  useEffect(() => {
    if (!sidePanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('table') || target.closest('.app-header')) return;
        setSidePanelOpen(false);
        usePlannerStore.getState().setEditingSequenceId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidePanelOpen, setSidePanelOpen]);

  const isOpen = sidePanelOpen || sequencePanelOpen;
  const { panelWidth, setPanelWidth } = usePlannerStore();
  const resizing = useRef(false);

  // Resize handle
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 320), 700);
      setPanelWidth(newWidth);
    };
    const onMouseUp = () => { resizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-0 bottom-0 bg-slate-850 border-l border-slate-600 z-[65] flex flex-col shadow-[-4px_0_16px_rgba(0,0,0,0.4)]"
      style={{ width: panelWidth, top: 'var(--toolbar-h, 44px)', background: 'var(--panel-bg)', overscrollBehavior: 'contain' }}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 z-10 transition-colors"
        onMouseDown={() => { resizing.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }}
      />
      <div className="px-3 py-2 border-b border-slate-600 flex items-center justify-between shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setSidePanelTab('details')}
            className={`px-2.5 py-1 rounded text-[13px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'details'
                ? 'bg-indigo-500/15 border-indigo-500/50'
                : 'border-transparent'
            }`}
            style={{ color: sidePanelTab === 'details' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            title="Lektionsdetails anzeigen"
          >
            📖 Unterrichtseinheit
          </button>
          <button
            onClick={() => setSidePanelTab('sequences')}
            className={`px-2.5 py-1 rounded text-[13px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'sequences'
                ? 'bg-green-500/15 border-green-500/50'
                : 'border-transparent'
            }`}
            style={{ color: sidePanelTab === 'sequences' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            title="Sequenzen verwalten"
          >
            ▧ Sequenzen
          </button>
          <button
            onClick={() => setSidePanelTab('collection')}
            className={`px-2.5 py-1 rounded text-[13px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'collection'
                ? 'bg-amber-500/15 border-amber-500/50'
                : 'border-transparent'
            }`}
            style={{ color: sidePanelTab === 'collection' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            title="Materialsammlung"
          >
            📚 Sammlung
          </button>
          <button
            onClick={() => setSidePanelTab('settings')}
            className={`px-2.5 py-1 rounded text-[13px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'settings'
                ? 'bg-gray-500/15 border-gray-500/50'
                : 'border-transparent'
            }`}
            style={{ color: sidePanelTab === 'settings' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            title="Einstellungen"
          >
            ⚙
          </button>
        </div>
        <button
          onClick={() => {
            setSidePanelOpen(false);
            usePlannerStore.getState().setSequencePanelOpen(false);
            usePlannerStore.getState().setEditingSequenceId(null);
          }}
          className="text-gray-400 hover:text-gray-200 cursor-pointer text-xs px-1"
          title="Panel schliessen (Esc)"
        >
          ✕
        </button>
      </div>
      {sidePanelTab === 'details' ? <BatchOrDetailsTab /> : sidePanelTab === 'sequences' ? <SequencePanel embedded /> : sidePanelTab === 'collection' ? <CollectionPanel /> : <SettingsPanel />}
    </div>
  );
}
