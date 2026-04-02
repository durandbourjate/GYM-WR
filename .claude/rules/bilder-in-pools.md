# Bilder in Übungspools — Lessons Learned

> Diese Regeln gelten für ALLE Aufgaben in pool.html die Bilder verwenden:
> hotspot, bildbeschriftung, dragdrop_bild, zeichnen (sample), und Bilder in Fragetexten.

## Häufige Fehler (Session 49–51, 01.–02.04.2026)

### 1. Doppeltes Bild-Rendering
**Problem:** `renderImg()` wurde sowohl im TYPE_HANDLER als auch im allgemeinen Frage-Renderer aufgerufen → Bild erschien zweimal.
**Regel:** Bild-Typen (hotspot, bildbeschriftung, dragdrop_bild) rendern ihr Bild IMMER selbst im TYPE_HANDLER. Der allgemeine Renderer (`renderQuestion`) darf bei diesen Typen KEIN `renderImg()` aufrufen. Prüfe die Bedingung in `renderQuestion` wenn neue Bild-Typen hinzukommen.

### 2. SVG-Pfade relativ vs. absolut
**Problem:** SVGs in Pool-Configs mit relativen Pfaden (`img/konjunktur.svg`) funktionierten lokal aber nicht auf GitHub Pages, weil der Base-Path anders ist.
**Regel:** SVG-Pfade in Pool-Configs IMMER relativ zum Pool-Root angeben (`Uebungen/Uebungspools/img/...` vom Repo-Root). Am besten: Pfade testen mit `npm run preview` (simuliert GitHub Pages).

### 3. CSS-Variable `--c-card` fehlte
**Problem:** Bild-Typen nutzten `var(--c-card)` für Hintergründe, aber die Variable war im Pool-CSS nicht definiert → transparenter Hintergrund, unlesbarer Text.
**Regel:** Neue CSS Custom Properties die in TYPE_HANDLERS gebraucht werden MÜSSEN im `:root`-Block von pool.html definiert sein. Checkliste: `--c-card`, `--c-primary`, `--c-bg`, `--c-text`, `--c-border`.

### 4. Hotspot prüfte ALLE Klicks statt nur korrekte
**Problem:** `answerHotspot` zählte alle platzierten Marker als korrekt, auch die auf falschen Positionen.
**Regel:** Hotspot-Auswertung muss korrekte Hotspots mit den SuS-Klicks matchen (Distanz < Radius). Überschüssige Klicks = Abzug. Nie einfach `clicks.length >= hotspots.length` als Kriterium.

### 5. DragDrop: Nur ein Label pro Zone erlaubt
**Problem:** Erste Implementation liess nur 1 Label pro Zone zu. Einige Aufgaben brauchen aber mehrere Labels in derselben Zone.
**Regel:** DragDrop-Zonen müssen IMMER mehrere Labels akzeptieren können. Die Zuordnung `label.zone` ist die Korrektur-Referenz, nicht die Zone-Kapazität.

### 6. Zeichnen: Weiter-Button fehlte nach Beantwortung
**Problem:** Nach dem Zeichnen einer Antwort blieb der Weiter-Button unsichtbar, weil `answerOpen()` keinen Return-Wert hatte.
**Regel:** Jeder TYPE_HANDLER mit offenem Antwort-Feld (zeichnen, code, open) braucht eine `answerOpen()`-Funktion die einen nicht-leeren String zurückgibt wenn beantwortet.

### 7. Fachbereich-Farben fehlten bei interaktiven Elementen
**Problem:** Buttons, Marker, Labels in Bild-Typen nutzten generisches Grau statt der Fachbereich-Farbe.
**Regel:** Alle interaktiven Elemente (Buttons, Labels, Marker, Highlights) müssen `var(--c-primary)` und verwandte Farb-Variablen nutzen, nicht hardcodierte Farben.

## Checkliste: Neue Bild-Aufgabe erstellen

Beim Erstellen einer neuen Pool-Config mit Bild-Fragen diese Punkte prüfen:

- [ ] Bild-Pfad existiert und ist relativ zum Pool-Root korrekt
- [ ] SVG/PNG getestet (beide funktionieren, SVG bevorzugt für Skalierung)
- [ ] Bild wird NUR einmal gerendert (nicht doppelt durch renderImg + TYPE_HANDLER)
- [ ] Koordinaten in Prozent (0–100), nicht in Pixel (responsive!)
- [ ] Touch-Kompatibilität: Tap-to-Place funktioniert (kein Drag auf Mobile nötig)
- [ ] Fachbereich-Farbe (`--c-primary`) für interaktive Elemente verwendet
- [ ] Alle benötigten CSS-Variablen im `:root` definiert
- [ ] Pool im Browser getestet (nicht nur im Code angeschaut)

## SVG-Erstellung für Pools

- Format: Viewbox-basiert (nicht fixe Pixel), z.B. `viewBox="0 0 800 500"`
- Schrift: System-Fonts (`font-family: system-ui`) — keine eingebetteten Fonts
- Farben: Neutrale Farben (grau/schwarz/weiss) — Fachbereich-Farbe kommt via CSS
- Dateigrösse: < 50 KB pro SVG (bei > 100 KB: Pfade vereinfachen)
- Pfad: `Uebungen/Uebungspools/img/{fach}/{dateiname}.svg`
