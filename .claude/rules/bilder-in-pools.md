# Bilder, Zeichnen & PDF — Lessons Learned

> Gesammelte Fehler aus 20+ Sessions (Session 20–51).
> Gilt für Übungspools (pool.html) UND Prüfungstool (React-Komponenten).

---

## A) Übungspools (pool.html) — Bild-Fragetypen

### 1. Doppeltes Bild-Rendering
**Problem:** `renderImg()` wurde sowohl im TYPE_HANDLER als auch im allgemeinen Renderer aufgerufen → Bild erschien zweimal. (S51)
**Regel:** Bild-Typen (hotspot, bildbeschriftung, dragdrop_bild) rendern ihr Bild IMMER selbst im TYPE_HANDLER. `renderQuestion` darf bei diesen Typen KEIN `renderImg()` aufrufen.

### 2. SVG-Pfade relativ vs. absolut
**Problem:** Relative Pfade (`img/konjunktur.svg`) funktionieren lokal aber nicht auf GitHub Pages. (S49)
**Regel:** Pfade testen mit `npm run preview` (simuliert GitHub Pages Base-Path).

### 3. CSS-Variable `--c-card` fehlte
**Problem:** Bild-Typen nutzten `var(--c-card)` aber die Variable war nicht definiert → transparenter Hintergrund. (S51)
**Regel:** Neue CSS Custom Properties MÜSSEN im `:root` definiert sein. Checkliste: `--c-card`, `--c-primary`, `--c-bg`, `--c-text`, `--c-border`.

### 4. Hotspot-Auswertung zu grosszügig
**Problem:** `answerHotspot` zählte alle Marker als korrekt, auch falsch platzierte. (S51)
**Regel:** Korrekte Hotspots mit SuS-Klicks per Distanz matchen (< Radius). Überschüssige Klicks = Abzug.

### 5. DragDrop: Nur ein Label pro Zone
**Problem:** Erste Implementation liess nur 1 Label pro Zone zu. (S51)
**Regel:** Zonen MÜSSEN mehrere Labels akzeptieren. `label.zone` ist Korrektur-Referenz, nicht Zone-Kapazität.

### 6. Zeichnen: Weiter-Button unsichtbar
**Problem:** `answerOpen()` gab keinen Wert zurück → Button blieb versteckt. (S51)
**Regel:** Jeder TYPE_HANDLER mit offenem Feld (zeichnen, code, open) braucht `answerOpen()` mit nicht-leerem Return wenn beantwortet.

### 7. Fachbereich-Farben fehlten
**Problem:** Interaktive Elemente nutzten generisches Grau statt Fachbereich-Farbe. (S51)
**Regel:** Alle interaktiven Elemente MÜSSEN `var(--c-primary)` nutzen, nicht hardcodierte Farben.

### 8. Wikipedia-URLs statt lokale Bilder
**Problem:** Demo-Fragen referenzierten Wikipedia-URLs die durch CSP blockiert wurden. (S31)
**Regel:** Bilder IMMER lokal im Repo speichern (`public/demo-bilder/` oder `img/`). Keine externen URLs in Produktionsdaten.

---

## B) Prüfungstool — Zeichnen / Drawing Engine

### 9. Striche gehen bei schneller Eingabe verloren
**Problem:** React Re-Renders verschluckten `pointerdown`-Events. 2s-Debounce im ZeichnenFrage-Store führte zu Datenverlust bei Fragewechsel. (S23, S24, S44, S49)
**Lösung:** Ref-basierter Stift-Buffer + `requestAnimationFrame`-Rendering. Store-Debounce auf 400ms reduziert.
**Regel:** Zeichnen-Input NIEMALS über React-State routen. Pointer-Events immer über Refs/Canvas-Direktzugriff verarbeiten. Store-Updates nur für Persistenz (debounced).

### 10. RDP-Toleranz zu hoch (Stifteingabe iPad)
**Problem:** Ramer-Douglas-Peucker Vereinfachung mit Toleranz 1.5 entfernte zu viele Punkte → Buchstaben unlesbar. (S37)
**Lösung:** Toleranz 1.5 → 0.8. iPad-spezifisch: Touch-Hit-Test 8px → 16px.
**Regel:** RDP-Toleranz unter 1.0 halten. Touch-Targets mindestens 16px (Finger vs. Maus).

### 11. Rotierter Text nicht anwählbar
**Problem:** Hit-Test nutzte AABB ohne inverse Rotation → rotierte Elemente nicht klickbar. (S22)
**Regel:** Bei Hit-Tests für transformierte Elemente immer inverse Transformation vor AABB-Prüfung anwenden.

### 12. Alles-Löschen verlässt Vollbild
**Problem:** `window.confirm()` popup zwingt Chrome aus dem Vollbild. (S24)
**Regel:** In Prüfungen KEIN `window.confirm()` oder `window.prompt()` verwenden — immer React-Modale.

---

## C) Prüfungstool — PDF-Annotation & Viewer

### 13. PDF Endloser Spinner
**Problem:** `usePDFRenderer.ladePDF()` schluckte Fehler ohne `throw` → Fallback-Kette kaputt. (S20)
**Regel:** Fehler in async Lade-Funktionen immer re-thrown. State auf 'error' setzen UND Exception propagieren.

### 14. PDF Canvas Race Condition
**Problem:** Mehrere gleichzeitige Render-Tasks bei schnellem Zoom/Seitenwechsel → Flackern, Abstürze. (S34)
**Lösung:** `renderTask.cancel()` vor neuem Render + `RenderingCancelledException` fangen.
**Regel:** Canvas-Rendering immer mit Cancellation-Pattern. Vorherigen Task abbrechen bevor neuer startet.

### 15. PDF Scroll neben Viewer möglich
**Problem:** `overflow-auto` erlaubte horizontales Scrollen ausserhalb des PDF. (S42)
**Regel:** PDF-Container immer `overflow-y-auto overflow-x-hidden`.

### 16. Material-PDF lädt nicht (sandbox)
**Problem:** `sandbox`-Attribut auf iframe blockierte Chrome PDF-Plugin. (S20)
**Regel:** KEIN `sandbox`-Attribut auf iframes die PDFs laden. Chrome braucht Plugins-Zugriff.

### 17. PDF-Toolbar: Text-Tool Extra-Klick
**Problem:** Icon-Klick öffnete Dropdown statt Werkzeug zu aktivieren. (S31)
**Regel:** Toolbar-Icons aktivieren Werkzeug direkt. Nur ▾-Chevron öffnet Optionen.

---

## D) Touch / iPad / Mobile

### 18. DragDrop Touch-Events als Scroll interpretiert
**Problem:** HTML5 Drag API funktioniert nicht auf Touch-Geräten. Browser scrollt statt zu draggen. (S36, S37)
**Lösung:** `touchAction: 'none'` / `touchAction: 'manipulation'` + Tap-to-Select → Tap-to-Place Mechanismus.
**Regel:** KEIN HTML5 Drag API für Touch-Geräte. Immer Pointer Events + `touchAction: none`. Tap-basierte Alternative für alle Drag-Interaktionen.

### 19. Touch-Targets zu klein
**Problem:** 36px Buttons nicht zuverlässig mit Finger treffbar. (S35)
**Regel:** Alle interaktiven Elemente mindestens 44×44px (WCAG). Im Prüfungstool: `min-h-[44px]`.

### 20. PDF touchAction nicht für alle Werkzeuge
**Problem:** `touchAction: 'none'` war nur für Stift gesetzt → Highlight/Text/Kommentar verschoben PDF statt zu annotieren. (S36)
**Regel:** `touchAction: 'none'` für ALLE aktiven Zeichenwerkzeuge, nicht nur Freihand.

---

## E) CSP (Content-Security-Policy)

### 21. frame-src blockiert lokale + Drive PDFs
**Problem:** CSP in `index.html` hatte kein `'self'` in `frame-src` → lokale PDFs geblockt. Google-Drive-PDFs fehlten ebenfalls. (S37, S38, S40)
**Lösung:** `frame-src 'self' *.googleusercontent.com drive.google.com docs.google.com blob:`
**Regel:** Bei neuen Medienquellen (Drive, externe Services) IMMER CSP prüfen. `frame-src`, `img-src`, `connect-src` alle relevant.

### 22. MIME-Type Whitelist für Uploads
**Problem:** Ohne MIME-Type-Prüfung konnten beliebige Dateien hochgeladen werden. (S34)
**Regel:** Upload-Funktionen MÜSSEN Dateityp prüfen (Bilder: image/*, PDF: application/pdf, etc.).

---

---

## F) Inhaltliche Fehler beim Erstellen von Bild-Aufgaben

### 23. Bild enthält bereits die Lösung
**Problem:** SVGs für Hotspot/Bildbeschriftung/DragDrop zeigten Labels, Beschriftungen oder farbliche Hervorhebungen die die Antwort verraten.
**Regel:** Bilder für Aufgaben MÜSSEN neutral sein — keine Beschriftungen, keine Farbcodierungen, keine Pfeile die auf die Lösung zeigen. Das Bild zeigt nur die Grundstruktur. Die Lösung kommt AUSSCHLIESSLICH aus der Aufgabendefinition (hotspots[], labels[], zones[]).

### 24. Fachbereich-Farbcode nicht eingehalten
**Problem:** SVGs verwendeten eigene Farben statt des Fachbereich-Farbcodes (VWL=orange, BWL=blau, Recht=grün).
**Regel:** Bilder für Pools in neutralen Farben erstellen (grau, schwarz, weiss). Die Fachbereich-Akzentfarbe wird über CSS (`--c-primary`) auf die interaktiven Elemente angewendet, NICHT in die SVG eingebrannt. Wenn im SVG Farben nötig sind (z.B. Kurven in einem Diagramm), neutrale Farben verwenden die mit allen Fachbereichen funktionieren.

### 25. Bild zu überladen / zu komplex
**Problem:** SVGs mit zu vielen Details, Achsenbeschriftungen, Legenden, Hintergrund-Texturen → SuS können die relevanten Bereiche nicht identifizieren, Interaktionselemente sind schwer zu platzieren.
**Regel:** Bilder SIMPEL halten. Nur die Grundstruktur zeigen die für die Aufgabe nötig ist. Keine dekorativen Elemente, keine überflüssigen Beschriftungen. Faustregel: Wenn das Bild ausgedruckt auf einer Briefmarke noch verständlich wäre, ist die Komplexität richtig.

### 26. UI-Elemente verdecken wichtige Bildbereiche
**Problem:** Hotspot-Marker, DragDrop-Labels oder Bildbeschriftung-Textfelder lagen über wichtigen Teilen des Bildes (Text, Achsen, Datenpunkte) und machten diese unlesbar.
**Regel:** Beim Platzieren von Interaktionselementen (Hotspots, Labels, Zonen) sicherstellen dass keine wichtigen Bildteile verdeckt werden. Genügend Freiraum im SVG einplanen für Marker/Labels. Koordinaten so wählen, dass Elemente neben/über/unter dem relevanten Bereich liegen, nicht darauf.

---

## Checkliste: Neue Bild-Aufgabe (Pool)

**Inhaltlich:**
- [ ] Bild enthält NICHT die Lösung (keine Beschriftungen, keine farblichen Hinweise)
- [ ] Fachbereich-Farbcode eingehalten (neutrale Farben im Bild, Akzent via CSS)
- [ ] Bild ist simpel und nicht überladen (nur nötige Grundstruktur)
- [ ] Interaktionselemente verdecken keine wichtigen Bildbereiche
- [ ] Aufgabentext ist auch ohne Bild verständlich (Bild = Ergänzung, nicht alleiniger Kontext)

**Technisch:**
- [ ] Bild lokal im Repo (`img/{fach}/` oder `public/demo-bilder/`)
- [ ] SVG bevorzugt (viewBox-basiert, System-Fonts, < 50 KB)
- [ ] Pfad getestet mit `npm run preview`
- [ ] Bild wird NUR einmal gerendert (nicht doppelt)
- [ ] Koordinaten in Prozent (0–100), nicht Pixel
- [ ] Touch: Tap-to-Place statt Drag (kein HTML5 DnD)
- [ ] Fachbereich-Farbe `var(--c-primary)` für Interaktionselemente
- [ ] Alle CSS-Variablen im `:root` definiert
- [ ] Im Browser getestet (Chrome + idealerweise iPad/Touch)

## Checkliste: Zeichnen / PDF im Prüfungstool

- [ ] Pointer-Events über Refs, nicht React-State
- [ ] Canvas-Rendering mit Cancellation-Pattern
- [ ] `touchAction: 'none'` für alle aktiven Werkzeuge
- [ ] Touch-Targets ≥ 44px
- [ ] Kein `window.confirm()` / `window.prompt()` (React-Modale!)
- [ ] RDP-Toleranz < 1.0
- [ ] CSP geprüft wenn neue Quellen eingebunden werden
- [ ] Fehler in async Funktionen re-thrown (nicht verschluckt)

---

## G) Asset-URLs bei SPA-Routing (ExamLab, Session 115)

### 27. Relative URLs lösen gegen SPA-Route auf
**Problem:** Daten-Dateien wie `einrichtungsPruefung.ts` / `einrichtungsFragen.ts` verwendeten relative Pfade: `./materialien/witzsammlung.pdf`, `./demo-bilder/europa-karte.svg`. Bei einer SPA-Route wie `/sus/ueben/einrichtung-pruefung` löst der Browser `./materialien/…` gegen die aktuelle Seite auf → `/sus/ueben/materialien/witzsammlung.pdf` → 404 → GitHub Pages SPA-Fallback lieferte `index.html` → im iframe lud die App selbst (User sah "SuS-Üben-Website im PDF-Fenster"). (S115)

**Regel:** Asset-URLs in Daten-Dateien (PDFs, Bilder, SVGs) MÜSSEN beim Rendern durch `utils/assetUrl.ts::toAssetUrl(url)` geschickt werden. Die Utility:
- lässt absolute URLs (http/https/blob/data) unverändert
- absolutiert relative Pfade gegen `import.meta.env.BASE_URL` (z.B. `/GYM-WR-DUY/staging/`)

Alternativ: Beim Erstellen neuer Daten-Dateien absolute Pfade mit `import.meta.env.BASE_URL` bauen statt `./…`.

**Betroffene Komponenten (alle gefixt in S115):** `MaterialPanel.tsx` (iframe-src), `HotspotFrage.tsx`, `BildbeschriftungFrage.tsx`, `DragDropBildFrage.tsx`, `PDFFrage.tsx` (pdfUrl).

**Checkliste neue Bild/PDF-Komponente:**
- [ ] `toAssetUrl()` verwendet (nicht direkte `frage.bildUrl` / `material.url`)
- [ ] Bei SPA-Route `/sus/ueben/X` getestet dass Asset noch lädt
- [ ] Relative Pfade in Daten-Dateien sind akzeptabel SOLANGE sie durch `toAssetUrl()` gehen
