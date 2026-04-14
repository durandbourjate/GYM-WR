import { useRef, type ReactNode, type KeyboardEvent } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  size?: 'sm' | 'md';
}

export function TabBar({ tabs, activeTab, onTabChange, size = 'md' }: TabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const enabledTabs = tabs.filter(t => !t.disabled);

  const handleKeyDown = (e: KeyboardEvent, tab: Tab) => {
    const currentIndex = enabledTabs.findIndex(t => t.id === tab.id);
    let nextIndex = -1;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange(tab.id);
      return;
    } else {
      return;
    }

    e.preventDefault();
    onTabChange(enabledTabs[nextIndex].id);
    const buttons = containerRef.current?.querySelectorAll('[role="tab"]:not([aria-disabled="true"])');
    (buttons?.[nextIndex] as HTMLElement)?.focus();
  };

  const containerClass = size === 'sm'
    ? 'flex gap-0.5 bg-slate-200 dark:bg-[#2a2a2a] p-[3px] rounded-md'
    : 'flex gap-1 bg-slate-200 dark:bg-[#2a2a2a] p-[3px] rounded-lg';

  const tabClass = (tab: Tab) => {
    const isActive = tab.id === activeTab;
    const base = size === 'sm'
      ? 'px-3 py-1.5 text-xs rounded transition-colors cursor-pointer'
      : 'px-4 py-2 text-sm rounded-md transition-colors cursor-pointer';

    if (tab.disabled) {
      return `${base} text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50`;
    }
    if (isActive) {
      return `${base} bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-sm`;
    }
    return `${base} text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600`;
  };

  return (
    <div ref={containerRef} role="tablist" className={containerClass}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTab}
          aria-disabled={tab.disabled || undefined}
          tabIndex={tab.id === activeTab ? 0 : -1}
          className={tabClass(tab)}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab)}
        >
          {tab.icon && <span className="mr-1.5 shrink-0">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
