# Design-Spec: Tastatur-/Screenreader-Zugänglichkeit der Bild-Fragetypen

**Datum:** 2026-06-02
**Status:** Design (vor Plan-Phase)
**Betroffene Fragetypen:** Hotspot, DragDrop-Bild, PDF-Annotation

---

## 1. Kontext & Problem

Die bild-basierten SuS-Fragetypen sind ausschliesslich per Maus/Touch bedienbar — Antworten werden durch Klicken/Tippen aufs Bild gesetzt. Per Tastatur und Screenreader (SR) sind sie nicht bedienbar. Verifiziert am Code (02.06.2026):

- `src/components/fragetypen/HotspotFrage.tsx` — 3 Klick-Handler, **0** Tastatur-Affordances.
- `src/components/fragetypen/DragDropBildFrage.tsx` — 3 Klick-Handler, **0** Tastatur-Affordances (aber bereits ein Tap-Select-Place-Flow vorhanden).
- `src/components/fragetypen/pdf/PDFSeite.tsx` — 7 Klick-Handler, 1 Tastatur-Handler (das Text-Input-Overlay).

## 2. Ziel, Anspruch & Nicht-Ziele

**Ziel:** Tastatur- und Screenreader-Bedienbarkeit für die drei Bild-Fragetypen, ohne Touch/Pointer/44px-Verhalten zu verändern und ohne Lösungs-Leak.

**Anspruch (entschieden):** **Proaktive WCAG-Härtung.** Es gibt aktuell keine:n konkrete:n SuS mit Hilfstechnik. Bar = solide Tastatur-Bedienbarkeit + korrekter Accessibility-Baum; ein voller VoiceOver-Lauf ist wünschenswert, aber nicht Voraussetzung. Bei technisch nicht keyboardbaren Interaktionen (Freihand) sind pragmatische Grenzen mit gleichwertiger Alternative akzeptabel.

**Nicht-Ziele (bewusst, keine Lücken):**
- Keine 1:1-Nachbildung freier Bild-Lokalisierung für Screenreader (für Blinde grundsätzlich nicht gleichwertig möglich → diskrete Region-Auswahl ist der Ersatz).
- Keine vollständige Tastatur-Parität für **PDF-Freihand** (technisch unmöglich) → Text-Notiz als gleichwertige Alternative.
- Keine zuverlässige Tastatur-**Caret-Auswahl** im PDF.js-Textlayer für Textmarker/Etikett → zurückgestellt, Text-Notiz als Ersatz.
- Kein Umbau von Antwort-Schema, Korrektur-Logik oder Storage.

## 3. Scope & getroffene Entscheidungen

Alle drei Fragetypen (entschieden). Drei Entscheidungen aus der Brainstorming-Phase:

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Anspruch | Proaktive WCAG-Härtung | kein:e konkrete:r SuS; bestes Aufwand/Nutzen |
| Scope | Alle drei Typen inkl. PDF | vollständige Abdeckung, PDF mit Alternative |
| Hotspot-Eingabe | **Beides kombiniert** | Region-Auswahl (SR-Pfad) **und** Pfeil-Cursor (sehende Tastatur-Nutzer) |

## 4. Architektur

### Geteilte Bausteine (neu)

| Baustein | Ort | Zweck |
|---|---|---|
| `aktivierbar(onAktivieren)` *(reine Util)* | `src/utils/a11y/aktivierbar.ts` | liefert `{ role:'button', tabIndex:0, onKeyDown }` — macht ein `<div>` per Enter/Space bedienbar. DRY statt 3×-Duplikat. |
| `useBildKoordinatenCursor({ disabled, schritt })` | `src/hooks/a11y/useBildKoordinatenCursor.ts` | hält Cursor-Position (x/y %), Pfeiltasten verschieben (Shift = fein/grob, Clamp 0–100), Enter platziert; liefert State + KeyHandler + sichtbares Fadenkreuz-Element. |
| `useSrAnsage()` | `src/hooks/a11y/useSrAnsage.tsx` | lokale visually-hidden `aria-live="polite"`/`aria-atomic`-Region + `ansage(text)`. Lokal statt global (immer nur eine Frage aktiv → YAGNI). |

### Drei harte Prinzipien (Leitplanken)

1. **Rein additiv.** Neue Handler kommen *neben* die bestehenden `onClick`/`onPointer`/`onDrag`/`onDrop`. Nichts wird entfernt oder umgebaut → Touch/Pointer/44px bleiben unangetastet (`.claude/rules/bilder-in-pools.md`).
2. **Antwort-State unverändert.** Jeder Tastatur-Pfad ruft dasselbe `onAntwort(...)` bzw. dieselben Annotation-Callbacks mit identischer Form wie der Maus-Pfad. Keine Änderung an Antwort-Typen, Korrektur-Logik, Storage → Prüfungsintegrität & Backend unberührt.
3. **Kein Lösungs-Leak.** Fokussierbare Steuerelemente tragen **neutrale/positionelle** Namen („Bereich 1 von 4, oben links"), nie das verräterische Antwort-Label. Nur die *Region-Existenz* wird sichtbar (bewusst akzeptiert). Fokus-Ringe nur bei `:focus-visible` → Maus-Nutzer sehen nichts.

## 5. Verdrahtung pro Fragetyp

### 5.1 DragDrop-Bild *(diskret — baut auf dem vorhandenen Tap-Flow auf)*

- **Label-Pool-Chips** → `aktivierbar(tapStack)`; behalten `aria-pressed`; Name = Chip-Text. (Auswahl-Toggle `tapStack` existiert bereits.)
- **Zonen** → werden `role="group"`, benannt „Zone N (leer / belegt: …)". Darin **als Geschwister, nicht verschachtelt**:
  - ein flächiger „In Zone N platzieren"-Button (Enter → `handleZoneKlick`),
  - die platzierten Chips als eigene „«X» entfernen"-Buttons (Enter → `entfernen`).
  - *Knackpunkt:* die platzierten Chips liegen aktuell **im** Zonen-`div`. Button-im-Button ist a11y-ungültig → Zone wird Container (`group`), Platzieren-Fläche und Entfernen-Chips sind Geschwister.
- **SR-Ansage:** „«Konjunktur» in Zone 2 platziert" / „… entfernt".
- Drag/Drop + Touch unverändert daneben.

### 5.2 Hotspot *(beide Pfade, koexistierend)*

- **Pfad sehend (Pfeil-Cursor):** Bild-Container wird `tabIndex=0`, `role="application"`, `aria-label` = Kurz-Anleitung. `useBildKoordinatenCursor`: Pfeil bewegt sichtbares Fadenkreuz, Enter setzt Markierung an Cursor-Position (ruft die bestehende `handleKlick`-Logik mit Cursor-x/y).
- **Pfad SR (Region-Auswahl):** je `bereich` ein transparentes, tabbares Overlay-Button, positioniert an dessen Bounding-Box; `aria-label` = „Bereich i von n, oben links" (neutral + Position aus Zentroid, **kein** Antwort-Label). Enter → Markierung im Zentroid.
  - *Knackpunkt:* die Overlays bekommen **`pointer-events: none`** → der freie Maus-Klick fällt unverändert durchs Overlay aufs Bild (Pointer-Pfad unberührt), die Overlays sind aber per **Tab** fokussier-/aktivierbar (Tastatur-Fokus ist unabhängig von `pointer-events`). So koexistieren beide Pfade.
- Beide Pfade schreiben dasselbe `onAntwort({ typ:'hotspot', klicks })`; `mehrfachauswahl`-Logik aus `handleKlick` wiederverwendet (single ersetzt, multi hängt an). **SR-Ansage:** „Markierung gesetzt (1 von …)". „Zurücksetzen" ist bereits ein echter Button.

### 5.3 PDF-Annotation *(Prüfungstool, pragmatisch)*

| Werkzeug | Tastatur-Lösung |
|---|---|
| **Toolbar** | echte Buttons, `aria-pressed` fürs aktive Werkzeug, `aria-label` (grösstenteils vorhanden → verifizieren) |
| **Auswahl + Radierer** | **Anmerkungs-Liste** (neues SR-Panel, `src/components/fragetypen/pdf/PDFAnmerkungsliste.tsx`): fokussierbare Einträge je Annotation („Kommentar bei …", „Textmarker auf «…»") + „Löschen"-Button. Deckt Selektieren **und** Löschen voll ab, SR-tauglich, additiv (berührt Canvas/Pointer nicht). |
| **Text + Kommentar** (Platzierung) | `useBildKoordinatenCursor` auf der fokussierten Seite → Position per Pfeil, Enter → das **bestehende** Text-Input-Overlay (hat `aria-label`+Enter/Escape) bzw. Kommentar-Popover (Fokusfalle ergänzen) |
| **Textmarker + Etikett** | hängen an Browser-Textauswahl im PDF.js-Textlayer; Caret-Auswahl per Tastatur über absolut positionierte Spans ist unzuverlässig → **dokumentierte Grenze**, Text-Notiz als Ersatz |
| **Freihand** | per Tastatur nicht möglich → **Alternative** (s. 5.4) |

### 5.4 Freihand-Alternative

Kein paralleles Antwort-System. Wenn per Tastatur gearbeitet wird und Freihand aktiv ist: Hinweis einblenden + auf die **Text-Notiz** als gleichwertige Annotation umlenken („Zeichnen ist per Tastatur nicht verfügbar — nutze die Text-Notiz"). Die Text-Annotation ist bereits Teil des Annotation-Modells → kein neues Schema, kein „separate but equal".

## 6. Edge-Cases & Fehlerverhalten

1. **disabled / readOnly / Lösungs-Modus:** neue Steuerelemente nicht fokussierbar (`tabIndex=-1` bzw. nicht gerendert) → kein toter Tab-Stopp. Lösungsansichten rendern bereits Text (Bereich-Liste, Zonen-Labels) → SR-lesbar.
2. **Fokus-Verwaltung nach Aktionen** (gegen „Fokus fällt auf `<body>`"): DragDropBild — nach Platzieren → Zone, nach Entfernen → Zone/Pool. Hotspot — Region-Pfad bleibt auf Region; Cursor-Pfad & Reset → Bild-Container. PDF-Liste — nach Löschen → nächster Eintrag / Überschrift.
3. **SR-Ansage-Politeness:** `polite` + `aria-atomic`. Pfeil-Cursor-Bewegung wird **nicht** pro Schritt angesagt (Spam); nur Platzieren/Entfernen/Löschen lösen je eine knappe Ansage aus.
4. **Kein Leak an Maus-Nutzer:** Fokus-Ringe der Region-Overlays nur bei `:focus-visible`.
5. **Fehlende/ungültige Daten:** keine Bildquelle / keine Bereiche / keine Zonen → keine fokussierbaren Overlays, Cursor-Hook no-op. Bestehende Error-Boundaries (`zonenUngueltig`) bleiben. Kein Crash bei leeren Arrays.
6. **mehrfachauswahl (Hotspot):** bestehende `handleKlick`-Logik; Ansage mit Zähler.
7. **Touch/Drag-Koexistenz:** `role`/`tabIndex` zusätzlich zu `draggable`/Pointer; 44px-Targets unverändert.

## 7. Test-Strategie & Verifikationsplan

**Unit (colocated `*.test.tsx`, jsdom):**
- Bausteine: `aktivierbar` (Enter/Space → `onAktivieren`, andere Tasten ignoriert); `useBildKoordinatenCursor` (Pfeil bewegt, Shift ändert Schritt, Enter platziert, Clamp 0–100); `useSrAnsage` (Region-Text aktualisiert).
- Pro Komponente: keydown → `onAntwort` mit korrektem Payload; ARIA-Attribute vorhanden; disabled/Lösung nicht fokussierbar.
- **Zahn-Tests:** Fokus fällt nach Platzieren/Entfernen nicht auf `<body>`; **No-Leak** (Region-`aria-label` ohne Antwort-Label); kein verschachteltes interaktives Element in der DragDropBild-Zone.

**Browser/Staging (unverzichtbar — jsdom deckt SR/Fokus/Layout nicht ab):**
- Tastatur-Durchlauf aller drei Typen: Tab-Reihenfolge, Enter/Space, Hotspot-Pfeil-Cursor, Fokus-Ringe (`:focus-visible`) in Light **und** Dark. Verifizierbar über die Preview-Browser-Tools (a11y-Baum per Snapshot, Key-Events per eval, Fokus-Ringe per Screenshot).
- **PDF: voller Regression-Prevention-Lauf** (echter LP+SuS-Login, PDF-Fragetyp end-to-end: setzen/löschen/Abgabe/Korrektur).
- Ideal, falls machbar: echter VoiceOver-Lauf (Mac).

**Gates vor Merge:** `npx tsc -b` · `npx vitest run` · `npm run build` · `npm run ci-check` (inkl. react-doctor — keine neuen a11y-Errors) → erst dann Browser-Test, Feature-Branch, kein Direkt-Commit auf `main`.

## 8. Sicherheit / Integrität

- Korrektheit **identisch** Maus- vs. Tastatur-Pfad (gleiches `onAntwort`, gleiche Bewertung).
- No-Leak-Invariante auch im DOM/aria der SuS-Sicht (kein Antwort-Label in fokussierbaren Elementen).
- Keine neue Persistenz sensibler Daten.
- PDF-Annotation auf kritischen Prüfungs-Pfaden → additive Änderungen + voller Regression-Prevention-Browser-Test vor Merge.

## 9. Entscheidungs-Log

- **Architektur:** Approach B (geteilte a11y-Hooks + in-widget) gewählt gegenüber A (inline/dupliziert) und C (paralleles Alt-UI). Das C-Element (Alternative) nur für PDF-Freihand.
- **Hotspot:** „beides kombiniert" (Region-Auswahl SR + Pfeil-Cursor sehend).
- **Bekannte pragmatische Grenzen:** PDF-Freihand (Alternative Text-Notiz), PDF-Textmarker/Etikett-Caret (zurückgestellt). Beide bewusst, nicht als Lücke.

## 10. Plan-Hinweise (aus Spec-Review 02.06.)

Drei advisory Punkte des Spec-Reviewers, in der Plan-Phase verbindlich zu fixieren (Werte als Vorschlag, in der Implementierung feinjustierbar):

1. **`useBildKoordinatenCursor`-Schritte explizit:** Default-Schritt **2 %** pro Pfeildruck, mit **Shift Feinschritt 0,5 %**, Clamp 0–100 %. Damit sind die Unit-Test-Assertions (Step/Clamp) eindeutig.
2. **Region-Positions-Phrase deterministisch:** Zentroid in ein **3×3-Drittel-Raster** mappen → vertikal {oben|Mitte|unten} × horizontal {links|Mitte|rechts} (z. B. „oben links"; reines „Mitte", wenn beide Achsen mittig). Verhindert, dass zwei Implementierende verschiedene Formulierungen ableiten.
3. **DragDropBild-Zonen-Refactor — Drop-Target bewahren:** `onDrop`/`onDragOver`/`onDragLeave` bleiben auf dem Zonen-Container (jetzt `role="group"`). Der flächige „platzieren"-Button ist ein Geschwister-Kind mit gleichem Footprint (`absolute inset-0`), die Entfernen-Chips liegen darüber. Eigener Plan-Schritt, da hier „rein additiv" am ehesten kippen könnte.
