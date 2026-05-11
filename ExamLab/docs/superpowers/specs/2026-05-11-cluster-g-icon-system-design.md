---
title: Cluster G — Icon-System Audit & Redesign
date: 2026-05-11
status: Spec-Review ausstehend
verwandt: Cluster E (Typografie/Konsistenz), Cluster B (Header-Redesign), Cluster D (Batch-Edit Toolbar)
---

# Cluster G — Icon-System Audit & Redesign

## 1. Zweck

ExamLab hat heute ein fragmentiertes Icon-Stil: ~28 Inline-SVGs (Lucide/Feather-ähnlich, strokeWidth 2), ~57 Emoji-Nutzungen für Status/Material/Navigation, keine Icon-Library, 20 Fragetypen ohne Icons. Resultat: visueller Stilbruch, OS-abhängige Emoji-Renderings, keine konsistente Designsprache.

Ziel: einheitliches, professionelles Icon-System auf Basis der **Lucide-Library** (`lucide-react`) mit 5 ExamLab-spezifischen Custom-Icons. Alle Emojis und Inline-SVGs werden durch konsistente Lucide-Icons + 5 Custom-Icons im Lucide-Stil ersetzt. Fragetypen bekommen erstmals Icons.

## 2. Begriffe

- **Lucide:** Open-Source Icon-Library, ~1500 outlined Icons im Feather-Stil (Fork). Default strokeWidth 2.
- **Custom-Icon:** ExamLab-spezifisches Icon im Lucide-Stil als React-Komponente (kein Library-Import). 5 Stück: `IconAbc`, `IconAB` (a_b), `IconAn` (_an_), `IconTKonto`, ggf. erweiterbar.
- **Größen-Skala:** 14 / 16 / 20 / 24 px (Tailwind: `w-3.5 h-3.5` / `w-4 h-4` / `w-5 h-5` / `w-6 h-6`).
- **Designsprache:** outlined, strokeWidth 2, currentColor, Lucide-Default-Geometrie.

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | Icon-Library: **Lucide** (`lucide-react`). | Stil-Match zu existierenden Copy/Trash-Icons. Industrie-Standard. Tree-Shaking, ~1KB/Icon. |
| 2 | **Alle Emojis durch Lucide ersetzen.** Inkl. Status, Material-Typen, Favoriten, Problemmeldungen. | Einheitlichkeit > vertraute Ampel. OS-unabhängig, Farb-kontrollierbar via Tailwind. |
| 3 | **5 Custom-Icons im Lucide-Stil** für ExamLab-spezifische Konzepte (Lückentext-Pattern, Buchungssatz-Pattern, Freitext-„abc", T-Konto-Layout). | Lucide hat keine Buchstaben-Icons. Eigene SVG-Komponenten mit strokeWidth=2, outlined. |
| 4 | Brand-Farbe: **Violet-500** (bestehend). Blue-500 reserviert für **KI-Features**. | Audit zeigte Violet als heutige Brand-Farbe. Blue für KI ist intentional gesetzt. |
| 5 | Status-Farb-Skala vereinheitlicht auf **500er** (green/yellow/red/blue). Backgrounds 100/900. | Tailwind-Default-Intensität. Beseitigt Inkonsistenz 500 (Ampel) vs 600 (Toast). |
| 6 | Info-Farbe: **Slate-500** statt Blue. | Blue exklusiv für KI. Info ist neutrale Information, slate passt. |
| 7 | Default-Icon-Farbe: `text-slate-500 dark:text-slate-400`. Hover-Aktion: `hover:text-violet-600`. Hover-Destruktiv: `hover:text-red-600`. | Audit-Bestandsfarben, keine neuen Farben. |
| 8 | Implementation: **direkter `lucide-react`-Import**, Custom-Icons als React-Komponenten in `src/components/ui/icons/`, Fragetyp-Mapping als Helper-Funktion. | Keine Wrapper-Indirektion. Tree-Shaking aktiv. React-/JSX-Konvention. |
| 9 | Stufen-Kontrolle (locker/standard/streng): einzige Stelle mit **gefüllten Kreisen** (Ampel-Metapher). Sonst keine filled Circles. | Ampel ist bekannte Semantik, hier sinnvoll. Andere Status nutzen semantische Icons (CheckCircle, AlertTriangle, etc.). |
| 10 | Migration: **sequentiell, surface by surface**. Kein Big-Bang. | Inkrementelle Reviews, isolierte Rollbacks, niedriges Regressionsrisiko. |
| 11 | strokeWidth: **2** überall (Lucide-Default). Keine Ausnahmen. | Eine Stärke = uniforme visuelle Sprache, keine Diskussionen pro Icon. |
| 12 | Größen-Skala fest: **14 / 16 / 20 / 24 px**. | Etabliert Hierarchie ohne Wildwuchs. |

## 4. Designsprache

### 4.1 Farb-Token (alle bereits im Code, keine neuen)

| Token | Light | Dark | Verwendung |
|---|---|---|---|
| **Primary / Brand / Hover-Aktion** | `violet-500` | `violet-500` | CTA-Buttons, Aktion-Hover |
| **Primary-Hover-Background** | `violet-600` | `violet-600` | Button hover bg |
| **Default Icon** | `slate-500` | `slate-400` | Listen-Icons, Standard |
| **Default Text** | `slate-700` | `slate-100` | Body-Text |
| **Destruktiv** | `red-500` | `red-500` | Trash, Delete, Reset |
| **Destruktiv-Hover** | `red-600` | `red-600` | Hover-State der Lösch-Buttons |
| **Erfolg / Locker (Stufe)** | `green-500` | `green-500` | CheckCircle, Ampel-grün |
| **Warnung / Standard (Stufe)** | `yellow-500` | `yellow-500` | AlertTriangle, Ampel-gelb |
| **Fehler / Streng (Stufe)** | `red-500` | `red-500` | AlertCircle, Ampel-rot |
| **Info** | `slate-500` | `slate-400` | Info-Icon (neutral) |
| **KI-Feature** | `blue-500` / `blue-600` | `blue-500` / `blue-600` | KI-Buttons, KI-Status |

### 4.2 Größen-Skala

| Size-Token | px | Tailwind | Verwendung |
|---|---|---|---|
| `xs` | 14 | `w-3.5 h-3.5` | Listen-Aktionen in dichten Tabellen (Copy/Trash in Fragensammlung-Zeile) |
| `sm` | 16 | `w-4 h-4` | Inline-Buttons mit Text-Label |
| `md` | 20 | `w-5 h-5` | Toolbar-Buttons, Tab-Icons, Navigation |
| `lg` | 24 | `w-6 h-6` | Hero-Icons, Section-Header, Empty-States |

## 5. Icon-Inventar

### 5.1 Header & Navigation

| Surface | Heute | Icon |
|---|---|---|
| Favoriten | kein Icon | `Star` |
| Prüfen | kein Icon | `SearchCheck` |
| Üben | 🎯 | `Dumbbell` |
| Fragensammlung | kein Icon | `List` |
| Papierkorb | Inline-SVG | `Trash2` |
| Globale Suche | Inline-SVG | `Search` |
| User-Menü | Initialen-Badge | `UserCircle` (+ optional Initialen-Fallback) |
| Einstellungen | kein Icon | `Settings` |
| Hilfe & Anleitung | ❓ | `HelpCircle` |

### 5.2 Aktion-Icons

| Aktion | Lucide | Default-Farbe | Hover |
|---|---|---|---|
| Duplizieren | `Copy` | `slate-500` | `violet-600` |
| Löschen | `Trash2` | `slate-500` | `red-600` |
| Bearbeiten | `Pencil` (oder `SquarePen`) | `slate-500` | `violet-600` |
| Speichern | `Save` | `slate-500` | `violet-600` |
| Schließen | `X` | `slate-500` | `red-600` (für Cancel) |
| Bestätigen | `Check` | `green-500` | `green-600` |
| Hinzufügen | `Plus` | `slate-500` | `violet-600` |
| Filter | `SlidersHorizontal` | `slate-500` | `violet-600` |
| Sortieren | `ArrowUpDown` | `slate-500` | `violet-600` |
| Aktualisieren | `RefreshCw` | `slate-500` | `violet-600` |
| Mehr (Kontextmenü) | `MoreHorizontal` | `slate-500` | `violet-600` |
| Download | `Download` | `slate-500` | `violet-600` |
| Upload | `Upload` | `slate-500` | `violet-600` |
| Anzeigen | `Eye` | `slate-500` | `violet-600` |
| Verbergen | `EyeOff` | `slate-500` | `violet-600` |
| Drag-Handle | `GripVertical` | `slate-400` | `slate-600` |

### 5.3 Status-Icons

| Status | Icon | Farbe |
|---|---|---|
| Stufe locker | `Circle` filled | `green-500` |
| Stufe standard | `Circle` filled | `yellow-500` |
| Stufe streng | `Circle` filled | `red-500` |
| Erfolg / Gespeichert | `CheckCircle2` | `green-500` |
| Lädt / Speichert | `Loader2` (spin) | `slate-500` |
| Fehler | `AlertCircle` | `red-500` |
| Warnung | `AlertTriangle` | `yellow-500` |
| Info (neutral) | `Info` | `slate-500` |
| Gesperrt (SEB/Lockdown) | `Lock` | `slate-500` |

### 5.4 Domain-Icons

| Domain | Icon |
|---|---|
| Kurs | `GraduationCap` |
| Klasse | `Users` |
| Schüler:in | `User` |
| Material PDF / Text | `FileText` |
| Material Link | `Link` |
| Material Video | `Video` |
| Material Audio | `Mic` |
| Termin / Datum | `Calendar` |
| Dauer / Timer | `Clock` |
| Favoriten-Eintrag | `Star` |
| Problemmeldung | `AlertCircle` (rot) |
| Idee / Vorschlag | `Lightbulb` (gelb) |

### 5.5 Fragetypen-Icons (20)

| Fragetyp | Icon | Quelle |
|---|---|---|
| Multiple Choice | `ListChecks` | Lucide |
| Richtig / Falsch | `ToggleLeft` | Lucide |
| Berechnung | `Calculator` | Lucide |
| Formel | `Sigma` | Lucide |
| PDF | `FileText` | Lucide |
| Audio | `AudioLines` | Lucide |
| Sortierung | `ArrowUpDown` | Lucide |
| Code | `Code` | Lucide |
| Bildbeschriftung | `Image` | Lucide |
| Drag & Drop Bild | `Move` | Lucide |
| Hotspot | `MousePointerClick` | Lucide |
| Zuordnung | `ArrowRightLeft` | Lucide |
| Aufgabengruppe | `Package` | Lucide |
| Bilanz / ER | `Columns2` | Lucide |
| Zeichnen / Visualisierung | `Brush` | Lucide |
| Kontenbestimmung | `FileSearch` | Lucide |
| **Freitext** | `IconAbc` | **Custom** |
| **Lückentext** | `IconAB` (a ___ b) | **Custom** |
| **Buchungssatz** | `IconAn` (___ an ___) | **Custom** |
| **T-Konto** | `IconTKonto` (T-Layout) | **Custom** |

## 6. Custom-Icons (5 React-Komponenten)

Alle in `src/components/ui/icons/CustomIcons.tsx`, im Lucide-Stil (strokeWidth=2, outlined, currentColor, viewBox 0 0 24 24).

### 6.1 `IconAbc` (Freitext)

```tsx
export const IconAbc = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="2.5" y="17" fontFamily="ui-sans-serif, system-ui"
      fontSize="11" fontWeight="700" fill="currentColor" stroke="none">abc</text>
    <path d="M2 21h20"/>
  </svg>
);
```

### 6.2 `IconAB` (Lückentext „a ___ b")

```tsx
export const IconAB = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="3" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="10" fontWeight="700" fill="currentColor" stroke="none">a</text>
    <text x="17" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="10" fontWeight="700" fill="currentColor" stroke="none">b</text>
    <path d="M9 18h6"/>
  </svg>
);
```

### 6.3 `IconAn` (Buchungssatz „___ an ___", Variante A₃)

```tsx
export const IconAn = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="12" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="11" fontWeight="700" fill="currentColor" stroke="none"
      textAnchor="middle">an</text>
    <path d="M1 20h4"/>
    <path d="M19 20h4"/>
  </svg>
);
```

### 6.4 `IconTKonto` (T-Konto-Layout)

```tsx
export const IconTKonto = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
  </svg>
);
```

### 6.5 Erweiterungs-Pattern

Falls künftig ExamLab-spezifische Konzepte ein Custom-Icon benötigen, wird die Komponente in `CustomIcons.tsx` ergänzt — selbe Konventionen (viewBox 24×24, strokeWidth=2, currentColor). Heute keine Reserve-Komponente implementieren.

## 7. Implementation

### 7.1 Dependency

```bash
npm install lucide-react
```

Versionierung: aktuelle stable major. Updates folgen Lucide-Release-Cadence.

### 7.2 Datei-Struktur

```
src/components/ui/icons/
├── CustomIcons.tsx          # IconAbc, IconAB, IconAn, IconTKonto
├── FragetypIcon.tsx         # Mapping-Komponente (Fragetyp → Icon)
└── index.ts                 # Re-Export
```

### 7.3 `FragetypIcon` (Mapping-Komponente)

```tsx
import { ListChecks, ToggleLeft, Calculator, Sigma, FileText, AudioLines,
         ArrowUpDown, Code, Image, Move, MousePointerClick, ArrowRightLeft,
         Package, Columns2, Brush, FileSearch, type LucideProps } from 'lucide-react';
import { IconAbc, IconAB, IconAn, IconTKonto } from './CustomIcons';
import type { Fragetyp } from '@/types/...';

const MAP: Record<Fragetyp, React.ComponentType<LucideProps>> = {
  mc: ListChecks,
  richtigfalsch: ToggleLeft,
  berechnung: Calculator,
  formel: Sigma,
  pdf: FileText,
  audio: AudioLines,
  sortierung: ArrowUpDown,
  code: Code,
  bildbeschriftung: Image,
  dragdrop_bild: Move,
  hotspot: MousePointerClick,
  zuordnung: ArrowRightLeft,
  aufgabengruppe: Package,
  bilanzstruktur: Columns2,
  visualisierung: Brush,
  kontenbestimmung: FileSearch,
  freitext: IconAbc,
  lueckentext: IconAB,
  buchungssatz: IconAn,
  tkonto: IconTKonto,
};

export function FragetypIcon({ typ, ...props }: { typ: Fragetyp } & LucideProps) {
  const Icon = MAP[typ];
  return <Icon {...props} />;
}
```

### 7.4 Direkter Lucide-Import (Standard-Verwendung)

```tsx
import { Trash2 } from 'lucide-react';

<button onClick={onDelete}>
  <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
</button>
```

### 7.5 Fragetyp-Verwendung

```tsx
import { FragetypIcon } from '@/components/ui/icons';

<FragetypIcon typ={frage.typ} className="w-5 h-5 text-slate-500" />
```

## 8. Migration-Strategie

Sequentiell, surface by surface, in separaten Sub-Bundles dieses Clusters:

### Phase 1: Foundation
- `npm install lucide-react`
- **Pre-Step: Fragetyp-Discriminator-Audit.** `Fragetyp`-Union-Type aus `src/types/` lesen und alle 20 Werte 1:1 mit dem `MAP`-Schlüssel-Set in Section 7.3 abgleichen. Drift wird hier aufgedeckt, nicht später (Bundle-3-Lehre `feedback_grep_anwesenheit_nicht_abwesenheit.md`).
- **Pre-Step: Bundle-Größen-Baseline.** `npm run build` vor Lucide-Install, dann nach Install + 1 Test-Import → Differenz dokumentieren als Audit-Punkt.
- `src/components/ui/icons/CustomIcons.tsx` + Tests
- `src/components/ui/icons/FragetypIcon.tsx` + Tests
- **Cross-Cluster-Garantie:** Phase 1 muss vor Beginn von Cluster A abgeschlossen sein, da Cluster A `IconAbc`/`IconAB` für die Lückentext-Buttons konsumiert.

### Phase 2: Header & Navigation
- App-Header: Favoriten, Prüfen, Üben, Fragensammlung, Papierkorb, Suche, User-Menü, Einstellungen, Hilfe
- Surface-Tests: jeder Tab/Button visuell verifizieren

### Phase 3: Aktion-Icons (Toolbars + Listen)
- Bestehende Inline-SVGs (Copy/Trash/Search/Close/Split/etc.) durch Lucide ersetzen
- Surfaces: FragenBrowser-Zeile, MaterialPanel, PruefungsComposer-Toolbar, etc.

### Phase 4: Status & Domain
- Toast-Container: CheckCircle/AlertCircle/AlertTriangle/Info statt Emojis
- Material-Panel: FileText/Link/Video/Mic statt 📄📝🔗🎬
- Favoriten-Liste: Star/ClipboardList/Target/HelpCircle statt 📍📝🎯❓
- Problemmeldungen: AlertCircle/Lightbulb statt 🔴💡
- Stufen-Kontrolle: Circle (filled) in 500-Farben statt 🟢🟡🔴 — fixe Größe `sm` (16 px / `w-4 h-4`) für inline-Status-Badges

### Phase 5: Fragetypen-Icons
- `FragetypIcon` einbinden in:
  - Fragensammlung-Listen (jede Zeile zeigt Fragetyp-Icon vor dem Titel)
  - Prüfungs-Composer-Frageliste
  - Übungs-Pool-Auswahl
  - Korrektur-Übersicht
  - Fragentyp-Filter-Dropdown
- Optional: Fragetyp-Filter-Chips bekommen Icon-Prefix

### Phase 6: Cleanup
- Lint-Regel `lint:no-emoji-in-source` aktivieren (Plan-Phase prüft Machbarkeit) — verhindert Re-Introduction von Emojis
- Lint-Regel `lint:no-inline-svg-icon` — verhindert neue Inline-SVGs ausser in CustomIcons.tsx
- Visuelle Regression-Tests: vor/nach-Screenshots der wichtigsten Surfaces

## 9. Edge-Cases & Fehlerfälle

- **Bundle-Größe:** `lucide-react` mit ~75 verwendeten Icons + tree-shaking ergibt ~75KB raw / ~25KB gzipped. Akzeptabel.
- **Custom-Icon-Font-Rendering:** Custom-Icons nutzen `<text>` mit Browser-System-Font. Auf manchen Plattformen leicht variierend in Letter-Spacing. Mitigiert durch `fontFamily="ui-sans-serif, system-ui"` (Default) und `font-weight=700` (visuelle Konstanz).
- **Stroke-Vererbung:** `<text fill="currentColor" stroke="none">` muss explizit gesetzt sein, sonst übernimmt der Text die Stroke-Properties vom umgebenden SVG.
- **Icon-Skalierung:** Bei sehr kleinen Größen (xs=14px) wird Lucide-2px-Stroke vom Browser gerendert mit minimalem Antialiasing — bleibt scharf.
- **Dark-Mode:** Alle Icons nutzen `currentColor`, Farbe wird via Tailwind-Klasse mit `dark:`-Variante gesetzt.
- **Custom-Icon-Größen <20px:** Text in IconAbc/IconAB/IconAn wird bei xs=14 sehr klein. Plan-Phase prüft visuell — falls unleserlich, separate Größen-Variante mit fetterem Text definieren.

## 10. Out-of-Scope (für späteren Cluster oder eigenes Spec)

- **Animierte Icons / Mikro-Interaktionen** (z.B. Loader-Bounce, Hover-Transitions). Bleibt simpel.
- **Icon-Sets pro Fach** (z.B. spezielle Mathe-Symbole). Nur die 20 generischen Fragetypen.
- **Iconography für Schul-Domäne** (Diplome, Zeugnisse, Notenrechner-Icons). Falls später nötig: Erweiterung von CustomIcons.
- **Manuelle Icon-Picker-UI für LP** (z.B. Themen-Icons frei wählbar). Heute nicht im Scope.
- **PWA-App-Icons / Favicon-Redesign.** Separate Sache.

## 11. Abhängigkeiten zu anderen Clustern

- **Cluster F (Testdaten):** Tab-Icon für „Testdaten"-Tab nutzt z.B. `FlaskConical` aus Lucide. Badge-Stil (gelb) verwendet `yellow-500` Token aus diesem Cluster.
- **Cluster E (Konsistenz):** Typografie-Tokens werden parallel definiert. Icon-Farben sind im Token-System dieses Clusters definiert; falls Cluster E eine zentrale Tokens-Datei (`src/styles/tokens.ts`) anlegt, werden die hier dokumentierten Farb-Tokens dorthin verschoben.
- **Cluster B (Header-Redesign):** Nutzt die Header-Icons (Üben/Dumbbell, Prüfen/SearchCheck, etc.) aus Phase 2. L2-Hover-Menüs nutzen MoreHorizontal / Plus.
- **Cluster D (Batch-Edit):** Toolbar-Buttons nutzen die Aktion-Icons (Trash2 für „Auswahl löschen", Tag für „Fach setzen", etc.).
- **Cluster A (Bug-Fixes):** Lückentext-Buttons (Freitext/Dropdown — vom User als „blau" beklagt) bekommen im Rahmen von A neue Icons aus diesem Inventar (`IconAbc` für Freitext, `IconAB` für Lückentext) und Farb-Tokens aus diesem Cluster.

## 12. Test-Strategie

### 12.1 Unit-Tests (Vitest)

- `FragetypIcon` rendert für jeden Fragetyp das richtige Icon (Snapshot-Test).
- `IconAbc`, `IconAB`, `IconAn`, `IconTKonto` rendern strukturell korrekte SVGs (Snapshot).
- Lucide-Icons werden nicht getestet (Library-Verantwortung).

### 12.2 Visuelle Tests

- Storybook oder ähnliche Komponenten-Galerie für alle Icons in allen Größen + Farben (Plan-Phase entscheidet ob Storybook-Setup neu eingeführt wird, oder eine simpler `/design`-Route in dev-mode).
- Vor/Nach-Screenshots der migrierten Surfaces (Header, Toolbars, Listen, Toast).

### 12.3 Browser-E2E (Live-Backend, echte Logins)

- LP-Login: jede Top-Tab-Navigation sichtbar mit neuem Icon, keine Emojis mehr in Listen.
- LP-Composer: Fragetypen-Liste zeigt Icons vor Titeln.
- SuS-Login (wr.test): Icons in Übungs-Sicht (Material-Typen, Status, Stufen-Kontrolle).
- Toast-Test: Erfolg/Warnung/Fehler/Info zeigen je das korrekte semantische Icon.

### 12.4 Lint-Gates (Phase 6)

- `lint:no-emoji-in-source` — grep über `src/` für Emoji-Codepoints, fail wenn gefunden. Whitelist für gerechtfertigte Ausnahmen (z.B. in JSDoc).
  - **Codepoint-Liste muss durch Plan-Phase-Pre-Audit ermittelt werden:** vollständiger grep durch `src/` mit Unicode-Range für Emojis (U+1F300–U+1FAFF u.a.), dann exhaustive Liste statt manueller Auswahl. Sonst Schutz-Lücken (z.B. ⭐ ⚠️ ✅ ❌ usw. bisher nicht in Beispiel-Liste aufgeführt).
- `lint:no-inline-svg-icon` — grep über `src/components/`, `src/pages/` für `<svg`-Inline-Tags ausserhalb von `src/components/ui/icons/`, fail bei Treffer.

## 13. Offene Punkte (vor Implementation klären)

- **Storybook-Setup:** für visuelle Icon-Galerie sinnvoll? Plan-Phase entscheidet (Aufwand vs Wert).
- **Lint-Regel-Implementation:** als ESLint-Custom-Rule oder als separater grep-basierter Lint-Script analog `lint:wire-contract`? Plan-Phase entscheidet.
- **Fragetyp-Identifier:** Die Strings in `MAP` (z.B. `'mc'`, `'lueckentext'`) müssen mit dem heutigen Fragetyp-Type-Discriminator übereinstimmen. Plan-Phase verifiziert.
- **`Testdaten`-Tab-Icon (für Cluster F):** Vorschlag `FlaskConical`. Final-Entscheidung in Cluster F Plan-Phase.
- **Icon-Größe für Custom-Icons bei xs=14px:** Plan-Phase rendert in Browser, prüft Lesbarkeit der Text-Elemente. Ggf. separate „compact"-Variante mit fetterem Stroke.
