# PDF-Fragetyp — Design-Spec

> Neuer Fragetyp `pdf` für die Prüfungsplattform. SuS annotieren, kommentieren und zeichnen direkt auf PDF-Dokumenten im Browser.

## Überblick

Die LP lädt ein PDF hoch (z.B. Zeitungsartikel, Gesetzestext, literarischer Text). SuS bearbeiten es mit 4 Werkzeugen: Text-Highlighter, Kommentare, Freihand-Zeichnung und Label-Zuordnung. Die Korrektur erfolgt manuell mit optionalem KI-Vorschlag via Claude.

**Abgrenzung:** "PDF als Aufgabenblatt" (PDF anzeigen + separate Freitext-/MC-Fragen) wird über die bestehende Anhang-Infrastruktur (`FrageAnhaenge.tsx`) abgedeckt und ist nicht Teil dieses Fragetyps.

## Architektur-Entscheidung

**PDF.js + eigener Annotation-Layer (Ansatz A).**

- PDF.js (`pdfjs-dist`) rendert das PDF in Canvas-Elemente
- SVG-Layer für Highlights, Kommentar-Marker und Labels (DOM-basiert, klickbar)
- Canvas-Layer für Freihand-Zeichnungen (nutzt bestehenden `useDrawingEngine`)
- PDF.js Text-Layer für native Text-Selektion

Verworfen: Annotation-Libraries (Annotorious etc.) — zu viele Dependencies, zu komplex für Schulkontext, schwieriger anpassbar.

## Datenmodell

### Fragetyp (`types/fragen.ts`)

```typescript
interface PDFFrage extends FrageBase {
  typ: 'pdf'
  fragetext: string

  // PDF-Quelle
  pdfDriveFileId: string
  pdfBase64?: string              // Offline-Fallback
  pdfDateiname: string
  seitenAnzahl: number

  // LP-Konfiguration
  kategorien?: PDFKategorie[]
  erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]  // Min. 1 erforderlich
  musterloesungAnnotationen?: PDFAnnotation[]
}

interface PDFKategorie {
  id: string
  label: string                   // z.B. "Metapher", "Antithese"
  farbe: string                   // Hex
  beschreibung?: string           // Tooltip für SuS
}

// Werkzeuge die Annotationen erzeugen (persistiert)
type PDFAnnotationsWerkzeug = 'highlighter' | 'kommentar' | 'freihand' | 'label'

// Toolbar-Werkzeuge (inkl. Meta-Tools die keine Annotationen erzeugen)
type PDFToolbarWerkzeug = PDFAnnotationsWerkzeug | 'radierer' | 'auswahl'
```

**Entscheidung:** Kein `untertyp`-Feld. Der ursprünglich geplante Untertyp `'bearbeitung'` (Zeichnen auf PDF) ist ein Subset von `'annotation'` mit `erlaubteWerkzeuge: ['freihand']`. Die LP konfiguriert die verfügbaren Werkzeuge direkt — ein separater Untertyp ist unnötig.

### Annotation-Daten — Discriminated Union (`types/fragen.ts`)

```typescript
// Gemeinsame Basis
interface PDFAnnotationBase {
  id: string
  seite: number                   // 0-basiert
  zeitstempel: string
}

// Discriminated Union — jede Variante trägt nur ihre relevanten Felder
type PDFAnnotation =
  | PDFHighlightAnnotation
  | PDFKommentarAnnotation
  | PDFFreihandAnnotation
  | PDFLabelAnnotation

interface PDFHighlightAnnotation extends PDFAnnotationBase {
  werkzeug: 'highlighter'
  textRange: PDFTextRange
  farbe: string
}

interface PDFKommentarAnnotation extends PDFAnnotationBase {
  werkzeug: 'kommentar'
  position: { x: number; y: number }  // Relativ (0–1) zur Seitengrösse
  kommentarText: string
}

interface PDFFreihandAnnotation extends PDFAnnotationBase {
  werkzeug: 'freihand'
  zeichnungsDaten: string         // JSON-serialisierter DrawCommand[]
  farbe: string
}

interface PDFLabelAnnotation extends PDFAnnotationBase {
  werkzeug: 'label'
  textRange: PDFTextRange
  kategorieId: string             // Referenz auf PDFKategorie
  farbe: string                   // Übernommen von Kategorie
}

interface PDFTextRange {
  /** Zeichenposition im konkatienierten page.getTextContent().items[].str */
  startOffset: number
  endOffset: number
  /** Kopie des selektierten Texts (für Anzeige ohne PDF-Neurendering) */
  text: string
}
```

**Text-Anchoring-Strategie:** Offsets sind Zeichenpositionen im konkatienierten String aller `TextItem.str`-Werte einer Seite aus `page.getTextContent()`. Diese Reihenfolge ist deterministisch und zoom-unabhängig. Bei der Anzeige wird der Text-Layer durchlaufen und die passenden Spans mit Highlight-Overlays versehen.

### Antwort-Typ (`types/antworten.ts`)

```typescript
| { typ: 'pdf'; annotationen: PDFAnnotation[] }
```

`PDFAnnotation` wird aus `types/fragen.ts` importiert (kanonische Location).

### Union-Typ erweitern

```typescript
// types/fragen.ts — Frage-Union
export type Frage = ... | PDFFrage;
```

### Factory erweitern (`utils/fragenFactory.ts`)

```typescript
// TypSpezifischeDaten
| { typ: 'pdf'; fragetext: string;
    pdfDriveFileId: string; pdfBase64?: string; pdfDateiname: string;
    seitenAnzahl: number; kategorien?: PDFKategorie[];
    erlaubteWerkzeuge: PDFAnnotationsWerkzeug[];
    musterloesungAnnotationen?: PDFAnnotation[] }
```

## Komponentenarchitektur

### Neue Dateien

```
src/components/fragetypen/pdf/
├── PDFTypes.ts                    — Re-export aus types/fragen.ts + komponent-lokale Types
├── usePDFRenderer.ts              — PDF.js laden, Seiten rendern, Text-Layer
├── usePDFAnnotations.ts           — Annotation-State, CRUD, Undo/Redo (globaler Stack)
├── PDFViewer.tsx                  — Scroll-Container, rendert alle Seiten
├── PDFSeite.tsx                   — Einzelne Seite: Canvas + Text-Layer + Annotation-Overlay
├── PDFToolbar.tsx                 — Werkzeugleiste
├── PDFKommentarPopover.tsx        — Kommentar-Eingabe-Popover
└── PDFKategorieChooser.tsx        — Label-Dropdown nach Text-Selektion

src/components/fragetypen/PDFFrage.tsx         — SuS-Ansicht
src/components/lp/frageneditor/PDFEditor.tsx   — LP-Editor
src/components/lp/PDFKorrektur.tsx             — Korrektur-Ansicht
```

**Type-Location:** Alle geteilten Types (`PDFFrage`, `PDFAnnotation`, `PDFKategorie`, etc.) leben kanonisch in `types/fragen.ts`. `PDFTypes.ts` im Komponentenordner re-exportiert diese und enthält nur komponent-interne Types (z.B. `PDFRenderState`, `PDFViewerProps`).

### Rendering-Stack pro Seite

```
PDFSeite
├── <canvas>                       PDF.js rendert Seiteninhalt
├── <div class="textLayer">        PDF.js Text-Layer (Selektion)
├── <svg>                          Highlight-Overlays + Kommentar-Marker + Label-Badges
└── <canvas>                       Freihand-Zeichnung (transparent)
```

- **SVG** für Highlights/Marker — DOM-basiert, klickbar, editierbar. Skalierung via `viewBox` (passt sich an Zoom an, kein Re-Render nötig).
- **Canvas** für Freihand — eine `useDrawingEngine`-Instanz **pro sichtbare Seite**. Canvas-Grösse passt sich an Zoom an (Re-Render bei Zoom-Wechsel, Koordinaten bleiben relativ 0–1).
- **Relative Koordinaten** (0–1) — skalierungsunabhängig für alle Annotation-Typen.

### Freihand pro Seite + Zoom

- Jede `PDFSeite` instanziiert einen eigenen `useDrawingEngine` Hook
- Koordinaten werden relativ (0–1) gespeichert, beim Rendern auf aktuelle Canvas-Grösse skaliert
- Bei Zoom-Wechsel: Canvas wird in neuer Auflösung neu gerendert, bestehende Strokes werden aus den relativen Koordinaten re-skaliert
- Freihand-Daten werden pro Seite als `PDFFreihandAnnotation` in der globalen `annotationen`-Liste gespeichert (mit `seite`-Index)
- Beim Laden: `annotationen.filter(a => a.seite === seitenNr && a.werkzeug === 'freihand')` → in den jeweiligen Drawing-Engine geladen

### Undo/Redo

**Globaler Stack** in `usePDFAnnotations.ts` — ein einzelner Undo-Stack über alle Seiten und alle Werkzeuge.

- Jede Annotation-Aktion (hinzufügen, löschen, editieren) wird als Undo-Eintrag erfasst
- Freihand-Strokes werden als atomare Annotationen behandelt: ein Stroke = eine `PDFFreihandAnnotation`. Kein separater Undo-Stack im Drawing-Engine; stattdessen wird `useDrawingEngine` ohne eigenen Undo-Stack betrieben und der übergeordnete `usePDFAnnotations`-Stack verwaltet alles
- Undo geht seitenübergreifend in chronologischer Reihenfolge
- Max. 50 Undo-Schritte

### Wiederverwendung

| Bestehend | Nutzung |
|-----------|---------|
| `useDrawingEngine.ts` | Freihand-Zeichnung pro Seite (ohne internen Undo-Stack) |
| `ZeichnenToolbar.tsx` | Pattern für Toolbar-Layout |
| `uploadApi.ts` | PDF-Upload zu Google Drive |
| `MediaAnhang.tsx` | Pattern für Drive-File-Referenzen |
| `KorrekturPDFAnsicht.tsx` | Pattern für Druck-/Export-Ansicht |
| `rufeClaudeAufMitBild()` | KI-Korrektur in Apps Script |

## SuS-Ansicht

### Toolbar

```
[🖍 Highlighter ▼] [💬 Kommentar] [✏️ Freihand] [🏷 Label ▼] [⌫ Radierer] │ [↩ Undo] [↪ Redo] │ [🔍 Zoom ▼] │ 3 Annotationen
```

- Highlighter-Dropdown: Farbauswahl (oder Kategorie-Farben)
- Label-Dropdown: LP-definierte Kategorien
- Zoom-Dropdown: 75%, 100%, 125%, 150%
- Annotations-Zähler zeigt Fortschritt
- Nur Werkzeuge anzeigen die in `erlaubteWerkzeuge` konfiguriert sind
- Radierer immer verfügbar (sofern mindestens ein Werkzeug erlaubt ist)

### Werkzeug-Interaktionen

| Werkzeug | Interaktion |
|----------|-------------|
| Highlighter | Text selektieren → markiert in aktiver Farbe |
| Kommentar | Klick auf PDF-Stelle → Popover mit Textfeld → Marker-Icon bleibt |
| Freihand | Zeichnen/Unterstreichen auf der Seite (Stift, Linie) |
| Label | Text selektieren → Kategorie-Dropdown → farbiges Highlight mit Badge |
| Radierer | Klick auf Annotation → Löschen (mit Undo) |

### Scroll-Modus

- Alle Seiten untereinander in scrollbarem Container
- Intersection Observer: nur sichtbare Seiten + 1 Puffer rendern (Lazy)
- Zoom: 75%, 100% (Default), 125%, 150%

### Auto-Save

Debounced (2s) in Zustand Store, wie Zeichnen-Fragetyp.

## LP-Editor

### PDF-Upload

- Drag & Drop oder Datei-Auswahl (nur `.pdf`, max. 10 MB)
- Upload via `uploadApi.ts` → Google Drive
- Base64-Fallback automatisch generiert
- Vorschau mit Seitenanzahl nach Upload
- `seitenAnzahl` wird beim Upload aus PDF.js gelesen und gespeichert

### Werkzeug-Auswahl

- Checkboxen pro Werkzeug (Default: alle aktiv)
- Mindestens 1 Werkzeug muss aktiv sein (Validierung)
- Wenn "Label" deaktiviert → Kategorien-Bereich ausgeblendet

### Kategorien-Editor

- Liste: Label + Farbe + optionale Beschreibung
- "Kategorie hinzufügen"-Button
- 8 vordefinierte Farben
- Drag & Drop Reihenfolge
- Vorlagen-Button: "Stilmittel (Deutsch)", "Argumentationstypen", "Rechtsgrundlagen"
- Max. 20 Kategorien

### Musterlösung

- LP annotiert selbst auf dem PDF (gleiche Werkzeuge wie SuS)
- Gespeichert als `musterloesungAnnotationen`

### Validierung

| Regel | Fehler |
|-------|--------|
| Kein PDF hochgeladen | "Bitte PDF hochladen" |
| `erlaubteWerkzeuge` leer | "Mindestens ein Werkzeug auswählen" |
| `fragetext` leer | "Fragestellung eingeben" |
| Label aktiv aber keine Kategorien | Warnung (kein Fehler — SuS können nichts zuordnen) |
| PDF > 10 MB | "PDF darf max. 10 MB gross sein" |

## Korrektur

### Layout

```
┌──────────────────────┬──────────────────────┐
│                      │ Zusammenfassung      │
│   PDF mit SuS-       │ • 5 Highlights       │
│   Annotationen       │ • 3 Labels (2 ✓ 1 ✗) │
│   (read-only)        │ • 2 Kommentare       │
│                      ├──────────────────────┤
│                      │ LP-Bewertung         │
│                      │ [Punkte: ___/8]      │
│                      │ [Kommentar: ___]     │
│                      │ [Audio-Feedback]     │
│                      ├──────────────────────┤
│                      │ KI-Vorschlag         │
│                      │ Punkte + Begründung  │
│                      │ [Übernehmen]         │
└──────────────────────┴──────────────────────┘
```

### KI-Korrektur

- Nutzt `rufeClaudeAufMitBild()` in Apps Script
- Input:
  - PDF-Seiten als Bilder: nur Seiten mit Annotationen, max. 5 Seiten, 150 DPI (ca. 200–400 KB/Seite)
  - SuS-Annotationen als JSON
  - Musterlösung als JSON
  - Bewertungsraster
- Output: Punktevorschlag + Begründung
- Annotationen werden **nicht** in die Bilder gerendert, sondern separat als JSON gesendet (effizienter, Claude kann Text und Bild korrelieren)

## Technische Details

### PDF.js Integration

- `pdfjs-dist` als npm-Dependency (nur Core, kein Viewer-UI)
- Worker: `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs'`
- Lazy-Loading: Dynamic Import, nur wenn PDF-Frage aktiv
- Rendering: `page.render()` + `page.getTextContent()`

### Zoom-Verhalten

- SVG-Annotations: `viewBox` skaliert automatisch, kein Re-Render nötig
- Freihand-Canvas: wird bei Zoom-Wechsel in neuer Auflösung neu gerendert (Koordinaten relativ → re-skaliert)
- Text-Layer: PDF.js re-rendert bei Zoom (native Funktion)
- Text-Selektions-Offsets bleiben gültig (basieren auf `getTextContent()`, nicht auf DOM-Positionen)

### Offline / SEB

- PDF-Base64 beim Prüfungsstart in IndexedDB gecacht
- Annotationen in Zustand Store + IndexedDB-Backup
- Kein externer Netzwerkzugriff während Prüfung nötig
- **Quota-Schutz:** Max. 2 PDF-Fragen pro Prüfung (Validierung im PruefungsComposer). Bei 2× 10 MB = ~26 MB Base64, innerhalb typischer IndexedDB-Limits (50 MB+)

### PDF-Ersetzung

Wenn die LP das PDF ersetzt (neuer Upload), wird `seitenAnzahl` aktualisiert. Bestehende `musterloesungAnnotationen` mit `seite`-Werten ausserhalb der neuen Seitenanzahl werden verworfen mit Warnung. SuS-Antworten einer laufenden Prüfung sind davon nicht betroffen (PDF wird bei Prüfungsstart gecacht).

### Datengrösse

- Annotationen: kompakt (Text-Ranges + Positionen = wenige KB)
- Freihand: Warnschwellen wie Zeichnen (40KB amber, 50KB rot) — pro Seite
- PDF-Base64: ~1.3x Dateigrösse (10MB PDF ≈ 13MB Base64)

### Dependency-Impact

- `pdfjs-dist`: ~500KB (tree-shakable, lazy-loaded)
- Keine weitere neue Dependency

## Geänderte bestehende Dateien

| Datei | Änderung |
|-------|----------|
| `types/fragen.ts` | `PDFFrage`, `PDFKategorie`, `PDFAnnotationsWerkzeug`, `PDFAnnotation` (Union) + Frage-Union |
| `types/antworten.ts` | Neuer Antwort-Typ `pdf` |
| `utils/fragenFactory.ts` | Factory-Case für `pdf` |
| `utils/editorUtils.ts` | Typ-Label "PDF-Annotation" |
| `utils/fachbereich.ts` | Typ-Label |
| `utils/fragenValidierung.ts` | Validierung: PDF vorhanden, mind. 1 Werkzeug, max. 2 PDF-Fragen |
| `store/pruefungStore.ts` | Auto-Save Case für `pdf`-Antwort |
| `components/Layout.tsx` | `case 'pdf'` Routing |
| `components/lp/frageneditor/sections/TypEditorDispatcher.tsx` | PDF-Editor Integration |
| `components/lp/frageneditor/FragenEditor.tsx` | State + Typ-Button |
| `components/lp/KorrekturDashboard.tsx` | PDF-Korrektur Routing |
| `components/lp/KorrekturSchuelerZeile.tsx` | PDF-Korrektur Routing |
| `components/lp/KorrekturPDFAnsicht.tsx` | PDF-Annotationen in Druck-PDF |
| `apps-script-code.js` | `korrigierePDFAnnotation()` Endpoint |
| `utils/exportUtils.ts` | Export-Text für PDF-Antworten |
| `package.json` | `pdfjs-dist` Dependency |
