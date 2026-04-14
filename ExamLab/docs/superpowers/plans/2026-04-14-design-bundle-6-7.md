# Design-Bundle (Bundle 6+7) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einheitliches Design-System für ExamLab — TabBar, ResizableSidebar, KI-Buttons, Violett-Fokus, Kontrast-Fixes.

**Architecture:** 4 neue/erweiterte Shared Components (TabBar, ResizableSidebar, Button ki-Variante, CSS-Klassen), dann schrittweise Migration aller 7 Tab-Stellen und EinstellungenPanel. ResizableSidebar wird mit frischer Pointer-Event-Logik implementiert (NICHT `usePanelResize` importieren — dieser Hook nutzt veraltete mouse-only Events).

**Branch:** `feature/design-system` (per Regression-Prevention-Regeln, kein direktes Committen auf main)

**Scope-Abgrenzung:** Frageneditor-Sidebar und Korrektur-Sidebar werden in diesem Bundle NICHT auf ResizableSidebar umgestellt — nur EinstellungenPanel als erster Anwender. Weitere Sidebar-Migrationen folgen in späteren Sessions.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Zustand

**Spec:** `docs/superpowers/specs/2026-04-14-design-bundle-6-7-design.md`

---

## Dateistruktur

| Aktion | Pfad | Verantwortung |
|--------|------|---------------|
| Create | `src/components/ui/TabBar.tsx` | Shared Pill-Tab-Komponente |
| Create | `src/components/ui/TabBar.test.tsx` | Tests für TabBar |
| Create | `src/components/ui/ResizableSidebar.tsx` | Shared resizable Sidebar |
| Create | `src/components/ui/ResizableSidebar.test.tsx` | Tests für ResizableSidebar |
| Modify | `src/components/ui/Button.tsx` | ki-Variante hinzufügen |
| Modify | `src/index.css` | `.input-pflicht`, Focus-Ring violett |
| Modify | `src/components/lp/LPHeader.tsx` | Tabs → TabBar |
| Modify | `src/components/settings/EinstellungenPanel.tsx` | Slide-Over → ResizableSidebar + TabBar |
| Modify | `src/components/ueben/admin/AdminDashboard.tsx` | Tabs → TabBar (ACHTUNG: nicht unter lp/) |
| Modify | `src/components/lp/vorbereitung/PruefungsComposer.tsx` | Tabs → TabBar |
| Modify | `src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` | Tabs → TabBar |
| Modify | `src/components/ueben/admin/AdminDashboard.tsx` | Tabs → TabBar |
| Modify | `src/components/ueben/admin/AdminSettings.tsx` | Tabs → TabBar |
| Modify | `src/components/lp/korrektur/KorrekturDashboard.tsx` | Toggle → TabBar |
| Modify | `packages/shared/src/editor/ki/KIBausteine.tsx` | KI-Blau/Grau Styling |
| Modify | `src/components/lp/korrektur/KorrekturFragenAnsicht.tsx` | Punkte-Feld violett |
| Modify | `src/components/lp/korrektur/KorrekturFrageZeile.tsx` | Punkte-Feld violett |
| Modify | `src/components/lp/korrektur/PDFKorrektur.tsx` | Punkte-Feld violett |
| Modify | `src/components/lp/korrektur/ZeichnenKorrektur.tsx` | Punkte-Feld violett |

---

## Task 0: Feature-Branch erstellen

- [ ] **Step 1: Branch erstellen**

```bash
cd ExamLab && git checkout -b feature/design-system
```

---

## Task 1: CSS-Grundlagen

**Files:**
- Modify: `ExamLab/src/index.css`

- [ ] **Step 1: `.input-pflicht` Klasse hinzufügen**

In `index.css` nach der `.input-field-narrow` Definition (ca. Zeile 67):

```css
.input-pflicht {
  @apply border-2 border-violet-500 bg-violet-50 focus:ring-violet-500 focus:border-violet-500;
}
.dark .input-pflicht {
  @apply bg-[#2d2040] border-violet-500 focus:ring-violet-500;
}
```

- [ ] **Step 2: Focus-Ring global auf Violett umstellen**

In `.input-field` (Zeile 55-56): `focus:ring-slate-400` → `focus:ring-violet-500`
In `.input-field` dark (Zeile 58-59): `focus:ring-slate-500` → `focus:ring-violet-500`
In `.input-field-narrow` (Zeile 63-64): identisch ändern

- [ ] **Step 3: Elevation Dark-Mode-Fixes hinzufügen**

Dark Mode Schatten sind auf dunklem Hintergrund kaum sichtbar. In `index.css` globale Dark-Mode-Anpassungen für Karten/Panels:

```css
/* Dark Mode Elevation Fixes */
.dark .shadow-sm {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.dark .shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

Zusätzlich: Prüfen ob Karten in Dark Mode genügend Border haben (`border-slate-700`).

- [ ] **Step 4: Build prüfen**

```bash
cd ExamLab && npx tsc -b && npm run build
```
Expected: Grün (reine CSS-Änderungen)

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "Design-System: CSS-Grundlagen — .input-pflicht + violetter Focus-Ring"
```

---

## Task 2: TabBar-Komponente

**Files:**
- Create: `ExamLab/src/components/ui/TabBar.tsx`
- Create: `ExamLab/src/components/ui/TabBar.test.tsx`

- [ ] **Step 1: Test schreiben**

```typescript
// TabBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from './TabBar';

const tabs = [
  { id: 'a', label: 'Tab A' },
  { id: 'b', label: 'Tab B' },
  { id: 'c', label: 'Tab C' },
];

describe('TabBar', () => {
  it('rendert alle Tabs', () => {
    render(<TabBar tabs={tabs} activeTab="a" onTabChange={() => {}} />);
    expect(screen.getByText('Tab A')).toBeDefined();
    expect(screen.getByText('Tab B')).toBeDefined();
    expect(screen.getByText('Tab C')).toBeDefined();
  });

  it('markiert aktiven Tab mit aria-selected', () => {
    render(<TabBar tabs={tabs} activeTab="b" onTabChange={() => {}} />);
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    expect(tabB.getAttribute('aria-selected')).toBe('true');
  });

  it('ruft onTabChange bei Klick', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={tabs} activeTab="a" onTabChange={onChange} />);
    fireEvent.click(screen.getByText('Tab C'));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('ignoriert Klick auf disabled Tab', () => {
    const onChange = vi.fn();
    const disabledTabs = [...tabs, { id: 'd', label: 'Disabled', disabled: true }];
    render(<TabBar tabs={disabledTabs} activeTab="a" onTabChange={onChange} />);
    fireEvent.click(screen.getByText('Disabled'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('unterstützt Pfeiltasten-Navigation', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={tabs} activeTab="a" onTabChange={onChange} />);
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    fireEvent.keyDown(tabA, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Step 2: Test läuft und scheitert**

```bash
cd ExamLab && npx vitest run src/components/ui/TabBar.test.tsx
```
Expected: FAIL (TabBar existiert nicht)

- [ ] **Step 3: TabBar implementieren**

```typescript
// TabBar.tsx
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
    // Focus den neuen Tab
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
      return `${base} bg-violet-500 text-white font-semibold shadow-sm`;
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
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/ui/TabBar.test.tsx
```
Expected: 5 Tests PASS

- [ ] **Step 5: tsc + Build**

```bash
cd ExamLab && npx tsc -b && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/TabBar.tsx src/components/ui/TabBar.test.tsx
git commit -m "Design-System: TabBar-Komponente — Pill-Tabs mit Violett-Akzent"
```

---

## Task 3: Tabs migrieren — LPHeader

**Files:**
- Modify: `ExamLab/src/components/lp/LPHeader.tsx`

- [ ] **Step 1: LPHeader.tsx lesen**

Datei lesen, aktuelle Tab-Implementierung verstehen (Zeilen 104-132). Verstehen wie `modus` und die Favoriten-Direktnavigation funktionieren.

- [ ] **Step 2: Manuelle Tab-Buttons durch TabBar ersetzen**

Die manuell gestylten Tabs (pruefung/uebung/fragensammlung) durch `<TabBar>` ersetzen. Favoriten bleibt ein separater Link/Button (ist kein Modus). Die `onTabChange`-Funktion mapped auf den bestehenden `setModus` Callback.

- [ ] **Step 3: tsc + Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```
Expected: Alles grün

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/LPHeader.tsx
git commit -m "Design-System: LPHeader Tabs → TabBar"
```

---

## Task 4: Tabs migrieren — EinstellungenPanel + AdminDashboard + AdminSettings

**Files:**
- Modify: `ExamLab/src/components/settings/EinstellungenPanel.tsx`
- Modify: `ExamLab/src/components/ueben/admin/AdminDashboard.tsx`
- Modify: `ExamLab/src/components/ueben/admin/AdminSettings.tsx`

- [ ] **Step 1: Dateien lesen**

Alle drei Dateien lesen. Aktuelle Tab-Logik und State-Variablen verstehen.

- [ ] **Step 2: EinstellungenPanel Tabs → TabBar**

Underline-Tabs (`border-b-2`) durch `<TabBar size="sm">` ersetzen. State-Variable `tab` bleibt, nur das Rendering ändert sich.

- [ ] **Step 3: AdminDashboard Tabs → TabBar**

Underline-Tabs durch `<TabBar size="sm">` ersetzen. Beachte: `ansicht` ist ein discriminated union — `onTabChange` mapped auf `setAnsicht({ typ: id })`.

- [ ] **Step 4: AdminSettings Tabs → TabBar**

Bestehende Pill-Tabs (eigene Implementierung mit `bg-slate-100 rounded-xl`) durch `<TabBar size="sm">` ersetzen.

- [ ] **Step 5: tsc + Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/EinstellungenPanel.tsx src/components/ueben/admin/AdminDashboard.tsx src/components/ueben/admin/AdminSettings.tsx
git commit -m "Design-System: EinstellungenPanel + AdminDashboard + AdminSettings → TabBar"
```

---

## Task 5: Tabs migrieren — PruefungsComposer + DurchfuehrenDashboard + KorrekturDashboard

**Files:**
- Modify: `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx`
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturDashboard.tsx`

- [ ] **Step 1: Dateien lesen**

Alle drei Dateien lesen. PruefungsComposer hat Pill-Tabs mit Border + disabled State. DurchfuehrenDashboard hat ARIA-Attribute (bereits vorhanden, TabBar bringt die mit). KorrekturDashboard hat ein 2-Button-Toggle.

- [ ] **Step 2: PruefungsComposer Tabs → TabBar**

Custom Pill-Tabs durch `<TabBar size="sm">` ersetzen. `disabled`-Prop für den Analyse-Tab nutzen.

- [ ] **Step 3: DurchfuehrenDashboard Tabs → TabBar**

Underline-Tabs + ARIA durch `<TabBar size="sm">` ersetzen. Phase-Indikator (pulsing green dot) als `icon` im Tab-Objekt übergeben.

- [ ] **Step 4: KorrekturDashboard Toggle → TabBar**

2-Button-Toggle durch `<TabBar size="sm">` ersetzen mit 2 Tabs (Schüler / Frage).

- [ ] **Step 5: tsc + Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/lp/vorbereitung/PruefungsComposer.tsx src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx src/components/lp/korrektur/KorrekturDashboard.tsx
git commit -m "Design-System: PruefungsComposer + DurchfuehrenDashboard + KorrekturDashboard → TabBar"
```

---

## Task 6: ResizableSidebar-Komponente

**Files:**
- Create: `ExamLab/src/components/ui/ResizableSidebar.tsx`
- Create: `ExamLab/src/components/ui/ResizableSidebar.test.tsx`

- [ ] **Step 1: Resize-Logik planen**

**WICHTIG:** NICHT den bestehenden `usePanelResize` Hook importieren — dieser nutzt veraltete `mousemove`/`mouseup` Events (kein Touch-Support). ResizableSidebar bekommt frische Pointer-Event-Logik (`onPointerDown` → globale `pointermove`/`pointerup` Listener).

- [ ] **Step 2: Test schreiben**

```typescript
// ResizableSidebar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResizableSidebar } from './ResizableSidebar';

describe('ResizableSidebar', () => {
  it('rendert Titel und Inhalt', () => {
    render(
      <ResizableSidebar title="Einstellungen" onClose={() => {}}>
        <p>Inhalt</p>
      </ResizableSidebar>
    );
    expect(screen.getByText('Einstellungen')).toBeDefined();
    expect(screen.getByText('Inhalt')).toBeDefined();
  });

  it('rendert Schliessen- und Maximize-Buttons', () => {
    render(
      <ResizableSidebar title="Test" onClose={() => {}}>
        <p>X</p>
      </ResizableSidebar>
    );
    // Schliessen-Button
    expect(screen.getByLabelText('Schliessen')).toBeDefined();
    // Maximize-Button
    expect(screen.getByLabelText('Maximieren')).toBeDefined();
  });

  it('ruft onClose bei Klick auf Schliessen', () => {
    const onClose = vi.fn();
    render(
      <ResizableSidebar title="Test" onClose={onClose}>
        <p>X</p>
      </ResizableSidebar>
    );
    screen.getByLabelText('Schliessen').click();
    expect(onClose).toHaveBeenCalled();
  });

  it('hat einen Resize-Handle', () => {
    render(
      <ResizableSidebar title="Test" onClose={() => {}}>
        <p>X</p>
      </ResizableSidebar>
    );
    expect(screen.getByTestId('resize-handle')).toBeDefined();
  });
});
```

- [ ] **Step 3: Test scheitert**

```bash
cd ExamLab && npx vitest run src/components/ui/ResizableSidebar.test.tsx
```

- [ ] **Step 4: ResizableSidebar implementieren**

Komponente mit:
- Props: `children, title, onClose, side='right', defaultWidth=400, minWidth=300, maxWidth=800, storageKey`
- Drag-Handle mit `onPointerDown` → `onPointerMove` → `onPointerUp` (globale Events)
- Maximize-Toggle (zwischen `defaultWidth` und `maxWidth`)
- `maxWidth` dynamisch gekappt auf `window.innerWidth - 300`
- localStorage Persistenz für Breite
- Styling: `bg-white dark:bg-slate-800`, Handle `bg-slate-300 dark:bg-slate-600`
- Icons: ⤢ (Maximize), ✕ (Close) mit `aria-label`

- [ ] **Step 5: Tests grün + tsc + Build**

```bash
cd ExamLab && npx vitest run src/components/ui/ResizableSidebar.test.tsx && npx tsc -b && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ResizableSidebar.tsx src/components/ui/ResizableSidebar.test.tsx
git commit -m "Design-System: ResizableSidebar-Komponente — Drag-Resize + Maximize"
```

---

## Task 7: EinstellungenPanel auf ResizableSidebar umstellen

**Files:**
- Modify: `ExamLab/src/components/settings/EinstellungenPanel.tsx`

- [ ] **Step 1: Datei lesen (aktueller Stand nach Task 4)**

EinstellungenPanel hat jetzt TabBar, aber noch das alte Slide-Over Layout (`fixed inset-0 max-w-lg`).

- [ ] **Step 2: Layout umstellen**

- `fixed inset-0 z-[70] flex justify-end` + Backdrop (`bg-black/30`) entfernen
- Stattdessen: `<ResizableSidebar title="Einstellungen" onClose={onClose} storageKey="einstellungen-breite">`
- `animate-slide-in-right` Klasse entfernen
- `mt-14` (Header-Offset) prüfen — ResizableSidebar sollte volle Höhe unter Header haben

**Eltern-Container identifizieren:** EinstellungenPanel wird gerendert in:
- `src/components/lp/LPStartseite.tsx` — Hauptseite LP
- `src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` — Prüfungsdurchführung

Beide Eltern müssen ein Flex-Layout haben damit Side-by-Side funktioniert. Prüfen und ggf. anpassen: `<div className="flex flex-1 overflow-hidden">` um das Hauptcontent + Sidebar zu wrappen.

- [ ] **Step 3: tsc + Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Design-System: EinstellungenPanel → ResizableSidebar (Side-by-Side)"
```

---

## Task 8: Button ki-Variante + KI-Buttons Styling

**Files:**
- Modify: `ExamLab/src/components/ui/Button.tsx`
- Modify: `packages/shared/src/editor/ki/KIBausteine.tsx`

- [ ] **Step 1: Button.tsx lesen**

Aktuelle Varianten-Logik verstehen. Wo werden Farben definiert?

- [ ] **Step 2: ki-Variante zu Button.tsx hinzufügen**

Neuen Variant-Typ `'ki'` hinzufügen. Braucht zusätzlichen Prop `kiAktiv?: boolean` (Default: true).

**ACHTUNG:** Die bestehende `VARIANT_CLASSES`-Map ist ein `const`-Objekt. `kiAktiv` ist nicht in dessen Scope. Die Variant-Auflösung muss für `ki` als Funktion/inline-Berechnung umgebaut werden. Z.B.:

```typescript
const getVariantClasses = (variant: ButtonVariant, kiAktiv?: boolean) => {
  if (variant === 'ki') {
    return kiAktiv
      ? 'border border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-[#1e2a3f] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-[#253650]'
      : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700';
  }
  return VARIANT_CLASSES[variant];
};
```

- [ ] **Step 2b: Test für ki-Variante schreiben**

Falls `Button.test.tsx` existiert, dort ergänzen. Sonst neuen Test:

```typescript
it('rendert ki-Variante blau wenn kiAktiv', () => {
  const { container } = render(<Button variant="ki" kiAktiv>KI</Button>);
  expect(container.querySelector('button')?.className).toContain('blue');
});

it('rendert ki-Variante grau wenn nicht kiAktiv', () => {
  const { container } = render(<Button variant="ki" kiAktiv={false}>KI</Button>);
  expect(container.querySelector('button')?.className).not.toContain('blue');
  expect(container.querySelector('button')?.className).toContain('slate');
});
```

- [ ] **Step 3: KIBausteine.tsx lesen und Styling anpassen**

`InlineAktionButton` in `packages/shared/src/editor/ki/KIBausteine.tsx`: Slate-Styling durch KI-Blau ersetzen. Die Komponente bekommt einen `kiAktiv`-Prop der von `useKIAssistent` Hook durchgereicht wird (basierend auf `features.kiAssistent` aus EditorConfig).

Aktuelles Styling:
- `border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100`

Neues Styling (wenn kiAktiv):
- `border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-[#1e2a3f] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-[#253650]`

Wenn nicht kiAktiv: bestehende Slate-Farben beibehalten.

- [ ] **Step 4: tsc + Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx packages/shared/src/editor/ki/KIBausteine.tsx
git commit -m "Design-System: Button ki-Variante + KI-Buttons blau/grau"
```

---

## Task 9: Pflichtfelder violett — Frageneditor

**Files:**
- Modify: `packages/shared/src/editor/sections/FragetextSection.tsx`

- [ ] **Step 1: FragetextSection.tsx lesen**

Zeile 89: `<textarea ... className="input-field resize-y">`. Verstehen welche Felder Pflichtfelder sind.

- [ ] **Step 2: Pflichtfelder mit `.input-pflicht` markieren**

Fragetext-textarea: `className="input-field input-pflicht resize-y"` hinzufügen.

Prüfen ob es weitere Pflichtfelder gibt (Antwortoptionen, Punktzahl) und diese ebenfalls markieren. Nur Felder die zwingend ausgefüllt werden MÜSSEN bekommen `.input-pflicht`, optionale Felder (Hinweis, Material, Lernziel) bleiben normal.

- [ ] **Step 3: tsc + Build**

```bash
cd ExamLab && npx tsc -b && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/editor/sections/FragetextSection.tsx
git commit -m "Design-System: Pflichtfelder violett im Frageneditor"
```

---

## Task 10: Pflichtfelder violett — Korrektur-Punkte

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturFragenAnsicht.tsx`
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturFrageZeile.tsx`
- Modify: `ExamLab/src/components/lp/korrektur/PDFKorrektur.tsx`
- Modify: `ExamLab/src/components/lp/korrektur/ZeichnenKorrektur.tsx`

- [ ] **Step 1: Alle 4 Dateien lesen — Punkte-Inputs finden**

Zeilen:
- KorrekturFragenAnsicht.tsx: 419-431
- KorrekturFrageZeile.tsx: 249-267
- PDFKorrektur.tsx: 374-391
- ZeichnenKorrektur.tsx: 367-384

- [ ] **Step 2: Focus-Ring von Slate auf Violett ändern**

In allen 4 Dateien: `focus:ring-slate-400 dark:focus:ring-slate-500` → `focus:ring-violet-500`

Zusätzlich: Wenn ein Punkte-Feld noch NICHT bewertet ist (Wert ist leer/null), zusätzlich `border-violet-500 bg-violet-50 dark:bg-[#2d2040]` hinzufügen. Dafür den bestehenden State prüfen (ist der Wert gesetzt oder nicht?).

- [ ] **Step 3: tsc + Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/korrektur/
git commit -m "Design-System: Korrektur-Punkte violett hervorgehoben"
```

---

## Task 11: Kontrast-Fixes app-weit

**Files:**
- Diverse Dateien wo inaktive Tabs/Icons/Labels zu wenig Kontrast haben

- [ ] **Step 1: Alle Stellen mit `text-slate-500` und `text-slate-400` suchen**

```bash
cd ExamLab && grep -rn "text-slate-400\|text-slate-500" src/components/ --include="*.tsx" | head -50
```

Prüfen welche davon Labels, Icons oder UI-Text sind (nicht Placeholder — die bleiben bei slate-400).

- [ ] **Step 2: Kontrast korrigieren**

Regeln:
- Labels: `text-slate-600 dark:text-slate-300` (statt slate-500/400)
- Icons (✕, ⤢, Toolbar-Icons): `text-slate-600 dark:text-slate-300` (statt slate-400/500)
- Placeholder: bleiben bei `text-slate-400 dark:text-slate-500` (gewollt dezent)
- Inaktive Tabs: bereits über TabBar gelöst

Gezielt die wichtigsten Stellen korrigieren — nicht jede einzelne Stelle auf einmal. Fokus auf: Sidebar-Icons, Panel-Titel, Form-Labels.

- [ ] **Step 3: tsc + Build**

```bash
cd ExamLab && npx tsc -b && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Design-System: Kontrast-Fixes — Labels und Icons kräftiger"
```

---

## Task 12: Gesamttest + HANDOFF

- [ ] **Step 1: Alle Tests + Build**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```
Expected: Alles grün

- [ ] **Step 2: HANDOFF.md aktualisieren**

Neue Session 103 eintragen mit allen Änderungen. Bundle 6+7 als erledigt markieren in der "Offene Punkte" Tabelle.

- [ ] **Step 3: Browser-Test vorbereiten**

Test-Plan für visuellen Browser-Test erstellen:
- [ ] TabBar: Alle 7 Stellen prüfen (violette Pills, Hover, Keyboard)
- [ ] EinstellungenPanel: Resizable, Maximize, Side-by-Side
- [ ] KI-Buttons: Blau wenn API aktiv
- [ ] Pflichtfelder: Violetter Rahmen im Frageneditor
- [ ] Korrektur: Punkte-Felder violett
- [ ] Dark Mode: Alle obigen Punkte nochmal
- [ ] Kontrast: Labels und Icons gut lesbar

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Design-System: HANDOFF aktualisiert, Bundle 6+7 abgeschlossen"
```
