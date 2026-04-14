# Design-Spec: Design-Bundle (Bundle 6+7)

> Zusammengelegtes Bundle für einheitliches Design-System in ExamLab.
> Umfasst N4, N8, N20, N21 aus der UX-Task-Liste.

---

## 1. Überblick

ExamLab hat über 100 Sessions organisch wachsende UI-Patterns angesammelt. Buttons verschwinden im Hintergrund, Sidebars verhalten sich unterschiedlich, Tabs sind inkonsistent, und es fehlt ein klares Farbsignal für "Hier bist du dran". Dieses Bundle führt ein einheitliches Design-System ein.

### Ziele
- Einheitliche Shared Components (TabBar, ResizableSidebar, Button-Varianten, InputField)
- Klare visuelle Hierarchie durch Elevation und Farb-Rollen
- Violett als durchgängiges "Focus/Aktiv"-Signal (LP + SuS)
- KI-Buttons blau nur wenn API aktiv, sonst dezent grau
- Konsistenz zwischen Light und Dark Mode

### Nicht im Scope
- Kein komplettes Redesign (Spacing, Typography-Scale, Layout-Grundstruktur bleiben)
- Keine neuen Fachbereich-Farben
- Keine neuen Fragetypen oder Features

---

## 2. Farb-Rollen

### 2.1 Funktionsfarben

| Rolle | Farbe | Light | Dark | Verwendung |
|-------|-------|-------|------|------------|
| **Violett** | violet-500 | #8b5cf6 | #8b5cf6 (identisch) | Navigation-Tabs aktiv, Focus-Ring, Pflichtfelder, Wizard-Schritte |
| **Violett-Feld BG** | custom | #faf5ff (violet-50) | #2d2040 | Hintergrund von violett umrahmten Feldern |
| **KI-Blau** (aktiv) | blue-600/400 | #2563eb Text, #eff6ff BG, #93c5fd Border | #60a5fa Text, #1e2a3f BG, #3b82f6 Border | KI-Buttons wenn API eingerichtet |
| **KI-Grau** (inaktiv) | slate | wie secondary Button | wie secondary Button dark | KI-Buttons wenn keine API |
| **Primary** | slate-800/200 | #262626 bg, white text | #e5e5e5 bg, #262626 text | Hauptaktionen (Speichern, Bestätigen) |
| **Secondary** | white/slate | white bg, #d4d4d4 border | #262626 bg, #404040 border | Nebenaktionen (Abbrechen) |
| **Fachbereich** | unverändert | orange/blau/grün/grau | unverändert | Nur in Badges |

### 2.2 Kontrast-Werte (aktualisiert)

| Element | Light | Dark |
|---------|-------|------|
| Inaktive Tabs | #404040 (slate-700) | #d4d4d4 (slate-300) |
| Icons (✕, ⤢, etc.) | #525252 (slate-600) | #d4d4d4 (slate-300) |
| Labels | #525252 (slate-600) | #d4d4d4 (slate-300) |
| Placeholder-Text | #a3a3a3 (slate-400) | #737373 (slate-500) |

### 2.3 Elevation

| Stufe | Light | Dark | Verwendung |
|-------|-------|------|------------|
| Flat | keiner, nur border | keiner, nur border (slate-700) | Input-Felder, inaktive Elemente |
| Subtle | shadow-sm | shadow-sm + border slate-700 | Buttons (secondary), Karten |
| Card | shadow (0 1px 3px) | shadow (stärker: 0 2px 4px rgba(0,0,0,0.3)) + border slate-700 | Content-Karten, Sidebar |
| Modal | shadow-xl | shadow-xl (stärker) + border slate-600 | Dialoge, Overlays |

> Dark Mode: Schatten sind auf dunklem Hintergrund weniger sichtbar. Daher in Dark Mode stärkere Schatten + zusätzliche Border als Fallback.

---

## 3. Shared Components

### 3.1 TabBar (NEU)

Pill-Tabs mit violettem Akzent. Ersetzt alle individuellen Tab-Implementierungen.

**Props:**
```typescript
interface TabBarProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  size?: 'sm' | 'md'; // sm = Sidebar, md = Header
}
```

**Styling:**
- Container: `bg-slate-200 dark:bg-[#2a2a2a] p-[3px] rounded-lg` (md) / `rounded-md` (sm)
- Aktive Pill: `bg-violet-500 text-white font-semibold rounded-md shadow-sm`
- Inaktive: `text-slate-700 dark:text-slate-300`
- Hover (inaktiv): `hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors`
- Violett ist in beiden Modi identisch: #8b5cf6

**Accessibility:**
- Container: `role="tablist"`
- Tabs: `role="tab"`, `aria-selected={aktiv}`, `tabIndex={aktiv ? 0 : -1}`
- Keyboard: Pfeiltasten links/rechts zum Navigieren, Enter/Space zum Aktivieren

**Hinweis:** Ersetzt bewusst das bisherige Underline-Tab-Pattern durch Pill-Tabs. Alle Stellen werden gleichzeitig migriert um Inkonsistenz zu vermeiden.

**Datei:** `src/components/ui/TabBar.tsx`

**Ersetzt Tabs in:** LPHeader, EinstellungenPanel, AdminDashboard, PruefungsComposer (falls vorhanden), und alle weiteren Stellen mit manuellen Tabs.

### 3.2 ResizableSidebar (NEU)

Einheitliches Sidebar-Pattern mit Drag-Resize und Maximize.

**Props:**
```typescript
interface ResizableSidebarProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
  side?: 'left' | 'right';  // Default: 'right'
  defaultWidth?: number;     // Default: 400
  minWidth?: number;         // Default: 300
  maxWidth?: number;         // Default: 800
  storageKey?: string;       // localStorage Key für persistente Breite
}
```

**Verhalten:**
- Side-by-side Layout (kein Overlay) — Hauptinhalt passt sich an via CSS Flex
- Drag-Handle (4px, slate-300 dark:slate-600) mit Dot-Indikator
- Maximize-Button (⤢) zieht Sidebar auf maxWidth
- Schliessen-Button (✕)
- Breite wird in localStorage gespeichert (pro storageKey)
- Animation: keine (sofort, weil resize)
- Min-Hauptinhalt: Sidebar maxWidth wird dynamisch gekappt auf `viewport - 300px`, damit Hauptinhalt immer mindestens 300px breit bleibt

**Layout-Integration:**
Die Sidebar wird als Flex-Child neben dem Hauptinhalt gerendert. Der Eltern-Container braucht `display: flex`. Das bisherige Overlay-Pattern (fixed + backdrop) entfällt komplett — kein Backdrop, kein z-index-Stacking. Die Sidebar schiebt den Inhalt zur Seite.

**Datei:** `src/components/ui/ResizableSidebar.tsx`

**Ersetzt:** EinstellungenPanel Slide-Over, Frageneditor-Sidebar, Korrektur-Sidebar (schrittweise).

### 3.3 Button — Neue Variante "ki"

Bestehende `Button.tsx` erweitern um KI-Variante.

**Neue Variante:**
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ki';
```

**KI-Variante Styling:**
- **Wenn API aktiv:** `border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-[#1e2a3f] text-blue-600 dark:text-blue-400`
- **Wenn API inaktiv:** identisch mit `secondary` (slate-grau)
- Immer `cursor-pointer`

**Steuerung:** `kiAktiv`-Prop. Wird abgeleitet aus dem bestehenden Mechanismus:
- `istKonfiguriert()` in `apiClient.ts` prüft ob `VITE_APPS_SCRIPT_URL` gesetzt ist
- Fliesst über `EditorConfig.features.kiAssistent` und `EditorServices.istKIVerfuegbar()` in den `useKIAssistent`-Hook
- `InlineAktionButton` bekommt `kiAktiv` von oben durchgereicht (kein neuer Store nötig)

**Ersetzt:** Alle manuell gestylten KI-Buttons in `packages/shared/src/editor/ki/KIBausteine.tsx` (InlineAktionButton). Aufgelöst via `@shared` Alias aus `tsconfig.app.json` / `vite.config.ts`.

### 3.4 InputField — Violett-Modi (CSS-Klassen)

Bestehende `.input-field` CSS-Klasse in `index.css` erweitern. Kein neues React-Component — reine CSS-Utility-Klassen die manuell per `className` angewendet werden.

**Neue CSS-Klassen:**
- `.input-pflicht`: Violetter Rahmen (`border-2 border-violet-500`) + leichter violetter Hintergrund (`bg-violet-50 dark:bg-[#2d2040]`). Für Pflichtfelder.
- `.input-focus-violet`: Violetter Focus-Ring statt Standard-Blau. `focus:ring-violet-500 focus:border-violet-500`. Wird global auf `.input-field` angewendet (ersetzt den bestehenden blauen Focus-Ring).

**Anwendungsbereiche:**
1. **Frageneditor:** Pflichtfelder (Fragetext, Antwortoptionen, Punktzahl) → `pflicht`
2. **Frageneditor:** Aktives Feld → Focus-Ring violett
3. **Korrektur:** Punkte-Eingabefelder → `pflicht` (solange unbewertet)
4. **Wizards:** Aktueller Eingabebereich → `pflicht`

---

## 4. Anpassungen bestehender Komponenten

### 4.1 KI-Buttons (N20)

**Datei:** `packages/shared/src/editor/ki/KIBausteine.tsx` (via `@shared` Alias)

- `InlineAktionButton` Styling umstellen auf KI-Blau wenn `kiAktiv` Prop true
- `kiAktiv` wird von `useKIAssistent` Hook abgeleitet (basiert auf `istKonfiguriert()` aus `apiClient.ts`)
- `cursor-pointer` bereits vorhanden — bestätigt

### 4.2 EinstellungenPanel (N4)

**Datei:** `src/components/settings/EinstellungenPanel.tsx`

- Fixes Slide-Over (`fixed inset-0 max-w-lg`) ersetzen durch `ResizableSidebar`
- Interne Tabs ersetzen durch `TabBar size="sm"`
- `animate-slide-in-right` entfällt (ResizableSidebar hat kein Slide-In)

### 4.3 LPHeader Tabs

**Datei:** `src/components/lp/LPHeader.tsx`

- Manuelle Tab-Buttons ersetzen durch `TabBar size="md"`
- Aktiver Tab violett statt bisherigem Styling

### 4.4 AdminDashboard Tabs

**Datei:** `src/components/lp/AdminDashboard.tsx`

- Manuelle Tabs ersetzen durch `TabBar size="sm"`

### 4.5 Frageneditor

- Sidebar umstellen auf `ResizableSidebar`
- Pflichtfelder markieren mit `.input-pflicht`
- Focus-Ring violett

### 4.6 Korrektur

- Punkte-Eingabefelder mit `.input-pflicht` markieren (solange unbewertet)

---

## 5. Migrations-Reihenfolge

Reihenfolge nach Abhängigkeiten:

1. **CSS-Grundlagen** — `.input-pflicht`, `.input-focus-violet` in `index.css`, Elevation-Dark-Mode-Fixes
2. **TabBar** — Shared Component bauen, dann alle Tabs gleichzeitig migrieren (LPHeader, EinstellungenPanel, AdminDashboard)
3. **ResizableSidebar** — Shared Component bauen
4. **EinstellungenPanel** — Auf ResizableSidebar + TabBar umstellen (erster Anwender)
5. **KI-Buttons** — `InlineAktionButton` Styling anpassen (KI-Blau/Grau)
6. **Button ki-Variante** — `Button.tsx` erweitern
7. **Frageneditor** — Pflichtfelder violett, Sidebar auf ResizableSidebar
8. **Korrektur** — Punkte-Felder violett
9. **Kontrast-Fixes** — Inaktive Tabs, Icons, Labels app-weit prüfen

---

## 6. Dark Mode Mapping

Einheitliches Violett (#8b5cf6) in beiden Modi. Nur Hintergrund-/Text-Farben werden angepasst:

| Element | Light | Dark |
|---------|-------|------|
| Violett (Tabs, Rahmen) | #8b5cf6 | #8b5cf6 |
| Violett-Feld BG | #faf5ff | #2d2040 |
| KI-Blau Text | #2563eb | #60a5fa |
| KI-Blau BG | #eff6ff | #1e2a3f |
| Tab-Container BG | #e5e5e5 (slate-200) | #2a2a2a |
| Sidebar/Karten BG | white | #262626 (slate-800) |
| Primary Button | #262626 bg / white text | #e5e5e5 bg / #262626 text |

---

## 7. Nicht ändern

- Fachbereich-Farben (VWL orange, BWL blau, Recht grün, IN grau) — nur in Badges
- SuS-Prüfungsansicht — violett bereits implementiert, bleibt
- Bestehende Button-Varianten (primary, secondary, danger, ghost) — bleiben, ki kommt dazu
- Fragetyp-Komponenten — kein Styling-Change
- Apps Script Backend — nicht betroffen

---

## 8. Mockup-Referenz

Validierte Mockups im Brainstorm-Verzeichnis:
- `button-hierarchy.html` — Elevation + KI-Blau + Violett-Fokus (Option B gewählt)
- `violett-scope.html` — Alle 4 Bereiche gewählt (Pflichtfelder, Focus, Korrektur, Wizards)
- `sidebar-pattern.html` — Resizable + Maximize (Option C gewählt)
- `tabs-design-v2.html` — Violette Pill gefüllt (Option D gewählt)
- `gesamtbild-v3.html` — Gesamtbild Light + Dark mit korrigiertem Kontrast
- `violett-vergleich.html` — Gleiches Violett in beiden Modi (Option A gewählt)
