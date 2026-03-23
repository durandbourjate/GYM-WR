# Stifteingabe / Zeichnen — Design Spec

> Neuer Fragetyp `visualisierung` (Untertyp `zeichnen`) für die Prüfungsplattform.
> Stand: 23.03.2026

## Zusammenfassung

Flexibler Zeichnen-Fragetyp, der Freihand-Zeichnungen, Bild-Beschriftungen und handschriftliche Eingaben auf einem HTML5 Canvas ermöglicht. Optimiert für Trackpad/Maus-Bedienung (Formen + Text als primäre Tools), mit Stifteingabe als Bonus für Tablet-User.

## Entscheide

| Entscheid | Wahl | Begründung |
|-----------|------|------------|
| Einsatzzweck | Kombination (Freihand, Beschriftung, Handschrift) | Maximale Flexibilität für verschiedene Fächer |
| Geräte | Gemischt (iPad, Laptop, Android, Finger-Fallback) | Schulrealität — gemischte Geräte |
| Eingabe-Priorität | Formen + Text first, Freihand als Ergänzung | Trackpad/Maus ist häufiger als Stift |
| Technik | Native HTML5 Canvas + TypeScript | 0 KB neue Dependencies, volle Kontrolle, PWA-freundlich |
| Hintergrundbild | Kernfeature v1 | Häufigster Anwendungsfall (Schema beschriften) |
| PDF als Hintergrund | Nur Bilder (PNG/JPG/SVG) in v1, PDF-Annotationstyp in v2 | PDF→PNG braucht PDF.js (~400 KB) — widerspricht 0-Dependency-Ziel |
| Korrektur | Textfeld + Sprachkommentar + Bild-Annotation + KI-Vorschlag | Vollständiges Toolkit, KI immer optional |
| Toolbar-Layout | Horizontal/Vertikal automatisch + manueller Toggle | Optimal für Laptop (horizontal) und Tablet Hochformat (vertikal) |

## Komponentenstruktur

### Neue Dateien

```
src/components/fragetypen/
  ZeichnenFrage.tsx              — SuS-Ansicht (Haupt-Komponente)
  zeichnen/
    ZeichnenCanvas.tsx           — Canvas-Rendering + Event-Handling
    ZeichnenToolbar.tsx          — Werkzeugleiste (Tools, Farben, Undo/Redo)
    ZeichnenTypes.ts             — Typen (DrawCommand, Tool, CanvasState)
    useDrawingEngine.ts          — Hook: Command-Stack, Undo/Redo, Rendering
    usePointerEvents.ts          — Hook: Touch/Maus/Stift-Events normalisiert

src/components/lp/frageneditor/
  ZeichnenEditor.tsx             — LP-Editor (Canvas-Config, Hintergrundbild)

src/components/lp/korrektur/
  ZeichnenKorrektur.tsx          — LP-Korrekturansicht (Annotation + KI)
```

### Integration in bestehende Dateien

- `Layout.tsx` → `case 'visualisierung'` → `<ZeichnenFrage />`
- `FragenEditor.tsx` → Route zu `ZeichnenEditor`
- `KorrekturDashboard.tsx` → Zeichnungen anzeigen + Korrektur
- `apps-script-code.js` → KI-Korrektur-Aktion für Bilder
- `fragen.ts` → `CanvasConfig` erweitern
- `exportUtils.ts` → PNG in PDF-Export einbetten

### Dateigrössen-Strategie

- `ZeichnenCanvas.tsx` + `useDrawingEngine.ts`: je ~300-400 Zeilen (grösste Dateien)
- Alle anderen: unter 200 Zeilen
- Kein File über 500 Zeilen

## Datenmodell

### CanvasConfig (erweitert, in `fragen.ts`)

```typescript
export interface CanvasConfig {
  breite: number;                      // Default: 800 (Preset 'mittel')
  hoehe: number;                       // Default: 600 (Preset 'mittel')
  koordinatensystem: boolean;          // Default: false
  achsenBeschriftung?: { x: string; y: string };
  werkzeuge: ('stift' | 'linie' | 'pfeil' | 'text' | 'rechteck')[];
  // Neue Felder (alle optional mit Defaults):
  hintergrundbild?: string;            // Drive-URL oder base64. Default: undefined (kein Bild)
  hintergrundbildId?: string;          // Drive File ID. Default: undefined
  groessePreset?: 'klein' | 'mittel' | 'gross' | 'auto';  // Default: 'mittel'
  radierer?: boolean;                  // Default: true
  farben?: string[];                   // Default: ['#000000', '#ef4444', '#3b82f6', '#22c55e']
}
```

**Rückwärtskompatibilität:** Alle neuen Felder sind optional. Bestehende `VisualisierungFrage`-Records (falls vorhanden) in Google Sheets parsen weiterhin korrekt — fehlende Felder erhalten die oben dokumentierten Defaults zur Laufzeit.

### Canvas-Grösse Presets

| Preset | Breite × Höhe | Anwendungsfall |
|--------|--------------|----------------|
| Klein | 600 × 400 | Beschriftung, einfache Skizze |
| Mittel | 800 × 600 | Standard |
| Gross | 1200 × 800 | Komplexe Diagramme |
| Auto | Aus Hintergrundbild | Übernimmt Bild-Dimensionen |

### DrawCommand (in `ZeichnenTypes.ts`)

```typescript
type DrawCommand =
  | { id: string; typ: 'stift'; punkte: Point[]; farbe: string; breite: number }
  | { id: string; typ: 'linie'; von: Point; bis: Point; farbe: string; breite: number }
  | { id: string; typ: 'pfeil'; von: Point; bis: Point; farbe: string; breite: number }
  | { id: string; typ: 'rechteck'; von: Point; bis: Point; farbe: string; breite: number; gefuellt: boolean }
  | { id: string; typ: 'text'; position: Point; text: string; farbe: string; groesse: number }
  | { id: string; typ: 'radierer'; punkte: Point[]; breite: number }

interface Point { x: number; y: number; druck?: number }
```

Jeder Command hat eine eindeutige `id` (UUID oder Timestamp-basiert). Wird für Selektion, Hit-Testing und gezieltes Löschen benötigt.

### Antwort-Speicherung (in `antworten.ts`, bereits vordefiniert)

```typescript
{ typ: 'visualisierung'; daten: string; bildLink?: string }
```

- `daten`: JSON-String der `DrawCommand[]` — für Undo/Replay/Weiterbearbeiten
- `bildLink`: PNG-Export als base64 — für Korrektur/PDF-Export/KI-Analyse
- Auto-Save: Debounced alle 2 Sekunden (Commands + PNG)

## SuS-Ansicht (ZeichnenFrage)

### Layout

```
┌─────────────────────────────────────────────┐
│ Badges: [BWL] [K3 – Anwenden] [4 Punkte]   │
├─────────────────────────────────────────────┤
│ Fragetext                                    │
├─────────────────────────────────────────────┤
│ Toolbar: [↖ ✏️ ╱ → ▭ T 🧹] | [● ● ● ●] | [↩ ↪] | [Alles löschen] | [⇅ Toggle] │
├─────────────────────────────────────────────┤
│                                             │
│              Canvas                          │
│         (ggf. mit Hintergrundbild)          │
│                                             │
├─────────────────────────────────────────────┤
│ Auto-Save aktiv              700 × 450 px   │
└─────────────────────────────────────────────┘
```

### Toolbar-Layout

- **Horizontal (oben):** Standard bei breitem Viewport (Laptop, Querformat)
- **Vertikal (links):** Standard bei hohem Viewport (Tablet Hochformat)
- **Automatischer Wechsel** basierend auf Viewport-Verhältnis
- **Manueller Toggle-Button** zum Umschalten

### Werkzeuge

| Tool | Icon | Beschreibung | Trackpad-tauglich |
|------|------|-------------|-------------------|
| Auswahl | ↖ | Standard-Tool. Klick = selektieren, Drag = verschieben | ★★★ |
| Freihand | ✏️ | Freies Zeichnen/Schreiben | ★☆☆ |
| Linie | ╱ | Gerade Linie (Klick + Drag) | ★★★ |
| Pfeil | → | Pfeil (Klick + Drag) | ★★★ |
| Rechteck | ▭ | Rechteck (Klick + Drag) | ★★★ |
| Text | T | Klick → Textfeld → Tastatureingabe → Enter | ★★★ |
| Radierer | 🧹 | Bereiche löschen | ★★☆ |

### Interaktion

- **Standard-Tool:** Auswahl (↖) — kein versehentliches Zeichnen
- **Text-Tool:** Klick auf Canvas → Textfeld erscheint → Tastatureingabe → Enter bestätigt
- **Formen:** Klick + Drag → Form-Vorschau → Loslassen fixiert
- **Freihand:** Pointer-Down → Zeichnen → Pointer-Up → Command gespeichert
- **Auswahl:** Klick auf Element → selektiert (Bounding-Box sichtbar). Drag = verschieben. Eck-Handles = skalieren. Delete-Taste = Command aus Array entfernen (neuer Undo-Eintrag). Keine Mehrfachselektion in v1.
- **Hit-Testing:** Pro Command-Typ: Stift/Radierer = Punkt-in-Pfad (Toleranz 8px), Linie/Pfeil = Abstand zur Linie (<8px), Rechteck = Punkt-in-Bounding-Box, Text = Punkt-in-Bounding-Box. Oberstes Element (letzter Command) gewinnt.
- **Keyboard:** Ctrl+Z Undo, Ctrl+Y Redo, Delete löscht Selektion, Escape deselektiert
- **Touch:** Finger = Zeichnen/Interagieren. Zwei-Finger Pan/Zoom nur wenn Canvas grösser als Viewport ist (sonst: normales Page-Scrolling). `touch-action: none` nur auf dem Canvas-Element selbst.
- **Stift:** Drucksensitivität für variable Strichbreite (via `pressure` aus PointerEvent)
- **Nach Abgabe:** Canvas wird readonly, Toolbar verschwindet

### Farben

Standard-Palette: Schwarz (#000000), Rot (#ef4444), Blau (#3b82f6), Grün (#22c55e).
LP kann einzelne Farben deaktivieren.

## LP-Editor (ZeichnenEditor)

### Konfigurationsfelder

1. **Fragetext** — Tiptap-Editor (wie alle Fragetypen)
2. **Canvas-Grösse** — Dropdown: Klein / Mittel / Gross / Auto / Benutzerdefiniert
3. **Hintergrundbild** — Upload via `uploadMaterial()`, Vorschau, Entfernen-Button
   - Bildformate: PNG, JPG, SVG (kein PDF in v1 — PDF-Support kommt mit v2 Annotationstyp)
4. **Verfügbare Werkzeuge** — Checkboxes pro Tool (LP kann einschränken)
5. **Farben** — Aktivieren/Deaktivieren einzelner Farben
6. **Koordinatensystem** — Toggle + optionale Achsenbeschriftung (x/y)
7. **Vorschau** — Button öffnet Canvas im SuS-Modus zum Testen

### Musterlösung

- Optional: Musterlösungs-Bild hochladen ODER direkt auf Canvas zeichnen
- Gespeichert als `musterloesungBild?: string` auf dem `VisualisierungFrage`-Interface (nicht auf `CanvasConfig`, da Frage-Level)
- Wird für KI-Korrektur und LP-Vergleich verwendet

```typescript
// Erweiterung in fragen.ts
export interface VisualisierungFrage extends FrageBase {
  // ... bestehende Felder ...
  musterloesungBild?: string;  // base64 PNG oder Drive-URL
}
```

## Korrektur (ZeichnenKorrektur)

### Vier Korrektur-Wege

1. **Textfeld-Kommentar** — Standard. LP tippt Feedback als Text.
2. **Sprachkommentar** — Bestehende `uploadAudioKommentar()`-Funktion wiederverwenden.
3. **Bild-Annotation** — LP zeichnet auf SuS-Bild (rote Standardfarbe). Annotationen separat gespeichert.
4. **KI-Korrekturvorschlag** — Optional:
   - Button "KI-Vorschlag" sendet an Apps Script
   - Payload: SuS-PNG + Fragetext + Musterlösung + max. Punkte
   - Apps Script → Claude Sonnet (Vision)
   - Response: `{ punkte: number, begruendung: string }`
   - LP sieht Vorschlag + Begründung, kann übernehmen oder anpassen
   - Gleicher UX-Pattern wie `generiereFrageZuLernziel`

### Plus: Punktefeld

- Wie bei allen Fragetypen: numerisches Eingabefeld für Punkte

### PDF-Export

- SuS-Zeichnung als PNG-Bild in KorrekturPDFAnsicht einbetten
- LP-Annotationen als Overlay (optional)

## Apps Script Änderungen

### Neue Aktion: `korrigiereZeichnung`

```javascript
case 'korrigiereZeichnung':
  // Empfängt: { bild (base64 PNG), fragetext, musterloesungBild?, maxPunkte }
  // Ruft Claude Sonnet mit Vision auf
  // Gibt zurück: { punkte, begruendung }
```

### KI-Korrektur Details

**Prompt-Vorlage:**
```
Du bist ein Prüfungskorrektor. Bewerte die folgende Zeichnung/Beschriftung eines Schülers.

Frage: {fragetext}
Maximale Punkte: {maxPunkte}
{musterloesungBild ? "Eine Musterlösung ist als Vergleichsbild beigefügt." : ""}

Bewerte Vollständigkeit, Korrektheit und Qualität. Gib eine Punktzahl (0-{maxPunkte}) und eine kurze Begründung.
Antworte als JSON: { "punkte": number, "begruendung": string }
```

**Fehlerbehandlung:**
- Leere/fast leere Zeichnung → "Keine oder minimale Eingabe erkannt" (0 Punkte Vorschlag)
- Malformed LLM-Response → Fallback-Meldung "KI-Vorschlag konnte nicht generiert werden"
- `punkte` wird auf `[0, maxPunkte]` geclampt
- `begruendung` max. 500 Zeichen
- Rate-Limit: Max 1 KI-Aufruf pro Frage pro SuS (Button deaktiviert nach Aufruf, "Erneut" nur bei Fehler)

## Technische Details

### Pointer Events API

```typescript
// usePointerEvents.ts — normalisiert Touch, Maus und Stift
canvas.addEventListener('pointerdown', handleStart);
canvas.addEventListener('pointermove', handleMove);
canvas.addEventListener('pointerup', handleEnd);

// Stift-spezifisch:
event.pointerType   // 'mouse' | 'touch' | 'pen'
event.pressure      // 0.0 - 1.0 (nur bei Stift)
event.tiltX/tiltY   // Neigung (optional)
```

### Command-Stack (useDrawingEngine)

```typescript
interface CanvasState {
  commands: DrawCommand[];              // Aktueller Zustand
  redoStack: DrawCommand[];             // Rückgängig gemachte Commands (für Redo)
  aktiverCommand: DrawCommand | null;   // Gerade in Bearbeitung (Live-Preview)
}

// Undo: letzter Command von commands → redoStack (push)
// Redo: letzter Command von redoStack → commands (push)
// Neue Aktion: redoStack wird geleert (kein Redo nach neuer Eingabe)
// Max Undo-Tiefe: 50 Commands

// Rendering: Bei jeder Änderung kompletten Canvas neu zeichnen
// (Hintergrundbild → Commands in Reihenfolge → aktiver Command)
function render(ctx: CanvasRenderingContext2D, state: CanvasState) {
  ctx.clearRect(0, 0, breite, hoehe);
  zeichneHintergrundbild(ctx);
  state.commands.forEach(cmd => zeichneCommand(ctx, cmd));
  if (state.aktiverCommand) zeichneCommand(ctx, state.aktiverCommand);
}
```

### Auto-Save

- Debounced: 2 Sekunden nach letzter Änderung
- Speichert: `DrawCommand[]` als JSON-String → `daten` (nur Commands, kein PNG)
- **PNG-Export nur bei:** Fragenwechsel, Abgabe, oder nach 10 Sekunden Inaktivität → `bildLink`
- Grund: `canvas.toDataURL()` ist synchron und blockiert Main-Thread (50-200ms bei grossen Canvas)
- Pattern wie FreitextFrage: `setAntwort(frageId, { typ: 'visualisierung', daten, bildLink })`

### Datengrösse

Google Sheets Zellen haben ein 50'000-Zeichen-Limit. Freihand-Striche können sehr viele Punkte erzeugen.

**Gegenmassnahmen:**
- **Punkt-Vereinfachung:** Ramer-Douglas-Peucker-Algorithmus auf Freihand-Striche (Toleranz 1.5px) — reduziert Punktzahl um ~70% ohne sichtbaren Qualitätsverlust
- **Koordinaten runden:** Auf 1 Dezimalstelle (`123.4` statt `123.45678`)
- **Soft-Limit:** Warnung bei >40'000 Zeichen JSON-Grösse ("Zeichnung wird komplex — bitte vereinfachen")
- **Fallback:** Falls >50'000 Zeichen, nur PNG speichern (kein Weiterbearbeiten, aber Korrektur funktioniert)

### Responsive Canvas

- Canvas-Dimensionen sind logisch (aus CanvasConfig)
- Display-Skalierung via CSS (`width: 100%; max-width: ${breite}px`)
- `devicePixelRatio` für Retina/HiDPI
- Pointer-Koordinaten werden auf logische Koordinaten umgerechnet

## Dark Mode

- **Canvas-Fläche:** Bleibt immer weiss (Zeichnungen sind Inhalt, nicht UI)
- **Toolbar:** Adaptiert via Tailwind `dark:` Klassen (dunkler Hintergrund, helle Icons)
- **Badges/Status:** Standard dark:-Klassen wie bei allen Fragetypen
- **Farbpalette:** Bleibt unverändert in beiden Modi (Zeichnungsfarben sind inhaltlich, nicht thematisch)
- **Canvas-Border:** `border-slate-300 dark:border-slate-600`

## Barrierefreiheit

- Toolbar ist keyboard-navigierbar (Tab/Arrow-Keys zwischen Tools)
- Canvas hat `aria-label` mit Fragetext-Kontext
- Tool-Buttons haben `title`-Attribut (Tooltip)
- Mindestgrösse Touch-Targets: 44×44px (Toolbar-Buttons)

## v2 Ausblick

### PDF-Annotationstyp (`typ: 'dokument-annotation'`)

- Eigener Fragetyp mit PDF.js-Rendering
- Text-Highlighting (Wörter/Sätze markieren)
- Kommentar-Pins an Textstellen
- Freihand-Zeichnung auf PDF-Seiten
- Texteingabe als Annotation
- Anwendungsfall: Sprachfächer (Gedichtanalyse, Textkommentierung)
