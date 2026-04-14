# ExamLab — UX-Verbesserungen aus Test (13.04.2026)

> Konsolidierte Task-Liste aus User-Test + bestehende offene Punkte aus HANDOFF.md.
> Dient als Grundlage für strukturiertes Vorgehen (Brainstorming → Plan → Umsetzung).

---

## Neue Tasks aus User-Test

### N1 — Favoriten-Menü: App-Struktur dynamisch abbilden
**Beschreibung:** Im Einstellungen-Panel soll die Favoriten-Verwaltung die komplette App-Struktur als "Inhaltsverzeichnis" darstellen — dynamisch generiert aus den tatsächlichen Routes/Bereichen. Pro Eintrag ein Stern-Toggle zum Hinzufügen/Entfernen als Favorit. Keine manuell gepflegte Dropdown-Liste.
**Betroffene Dateien:** FavoritenTab.tsx, favoritenStore.ts, Router.tsx (Route-Definitionen als Quelle)

### N2 — Favoriten-Tab + Home-Screen-Zugang
**Beschreibung:** 
- Klick auf ExamLab-Logo → Home-Screen (Willkommen/Favoriten)
- Neuer Tab "Favoriten" links von "Prüfen" in der Kopfzeile (damit Home jederzeit erreichbar)
- Stern-Icon in der Kopfzeile entfernen (redundant mit Tab)
**Betroffene Dateien:** LPHeader.tsx, Router.tsx

### N3 — Doppelte "Fragensammlung" im Header
**Beschreibung:** LP Home-Screen zeigt "Fragensammlung" zweimal im Header. Bug fixen.
**Betroffene Dateien:** LPHeader.tsx

### N4 — Einstellungs-Sidebar resizable
**Beschreibung:** Einstellungs-Sidebar soll wie andere Sidebars (z.B. Frageneditor) in der Grösse verstellbar sein. Prüfen ob ein gemeinsames Sidebar-Pattern existiert und ob EinstellungenPanel darauf umgestellt werden kann.
**Betroffene Dateien:** EinstellungenPanel.tsx, ggf. shared Sidebar-Komponente

### N5 — Bild-Löschen-Button repositionieren
**Beschreibung:** Der rote X-Kreis zum Löschen des hochgeladenen Bildes ist an nicht-intuitiver Position. An gängige Position verschieben (z.B. rechts oben am Bild).
**Betroffene Dateien:** BildUpload.tsx

### N6 — Doppeltes Bild bei Bildfragen entfernen
**Beschreibung:** Bei Bildfragen (Hotspot, Bildbeschriftung, DragDrop-Bild) wird das Bild oben kleiner und darunter nochmal grösser dargestellt. Die kleinere Version ist unnötige Duplikation — entfernen. Nur die grosse Version mit den Interaktionselementen zeigen.
**Betroffene Dateien:** HotspotEditor.tsx, BildbeschriftungEditor.tsx, DragDropBildEditor.tsx, SharedFragenEditor.tsx

### N7 — Bildfragen: Pins/Zonen violett
**Beschreibung:** Pins, Zonen und Rechtecke in Bild-Editoren sollen violett sein (konsistent mit SuS-Prüfungs-Hervorhebungen). Aktuell teilweise schwarz/weiss, z.T. schlecht lesbare violette Zahlen auf dunklem Hintergrund. Zahlen-Labels gut lesbar gestalten.
**Status:** Teilweise in S97 umgesetzt, aber laut User-Test noch nicht korrekt.
**Betroffene Dateien:** HotspotEditor.tsx, BildbeschriftungEditor.tsx, DragDropBildEditor.tsx

### N8 — Design-Schliff (Mockups nötig)
**Beschreibung:** App wirkt zu "flach" — Buttons kaum vom Hintergrund unterscheidbar, Schriftfarben inkonsistent. Generelles Design-Konzept schleifen. **Braucht Mockups** um verschiedene Szenarien einheitlich zu gestalten bevor Code geändert wird.
**Umfang:** App-weit, betrifft Buttons, Hintergründe, Schriftfarben, Kontraste.
**Vorgehen:** Zuerst Design-Mockups erstellen (HTML oder Figma), User-Feedback einholen, dann systematisch umsetzen.

### N9 — Üben: Max. 5 aktuelle Themen, automatisch ältestes ablösen
**Beschreibung:** 
- Maximal 5 Themen gleichzeitig als "aktuell" markiert (statt 3).
- Bei Aktivierung eines 6. Themas: das älteste "aktuelle" Thema wird automatisch zu "freigegeben" (kein Popup nötig).
- Begriffe: "aktuell" (statt "aktiv"), "freigegeben" (statt "abgeschlossen"), ohne Status (= nicht freigeschaltet).
**Betroffene Dateien:** Dashboard.tsx (LP), themenStore oder UebenConfig, SuS-Dashboard

### N10 — Begriffe: "Aktiv" → "Aktuell", "Abgeschlossen" → "Freigegeben"
**Beschreibung:** Umbenennung in LP-Übungen:
- "aktive Themen" → "aktuelle Themen"  
- "abgeschlossene Themen" → "freigegebene Themen"
- Nicht freigegebene Themen: kein Label/Hinweis, einfach unsichtbar für SuS
**Betroffene Dateien:** Alle LP-Übungs-Komponenten, SuS-Dashboard

### N11 — SuS: Sortierung Themen
**Beschreibung:** 
- Aktuelle Themen zuoberst
- Darunter: freigegebene Themen nach Fach gruppiert, innerhalb Fach alphabetisch sortiert
**Betroffene Dateien:** SuS-Dashboard.tsx

### N12 — LP: Status-Differenzierung bei Themen
**Beschreibung:** Nicht freigegebene Themen visuell stärker von freigegebenen unterscheiden. An SuS-Sicht orientieren — wie sieht es aus wenn ein Thema für SuS nicht sichtbar ist? Das sollte für LP klar erkennbar sein.
**Betroffene Dateien:** LP-Dashboard/Themenliste

### N13 — Fach-Farbpunkte: Position konsistent (links)
**Beschreibung:** LP zeigt Fach-Farbpunkt links vom Themennamen, SuS zeigt ihn rechts. SuS-Ansicht an LP angleichen → Punkt immer links.
**Betroffene Dateien:** SuS-Dashboard/Themenliste

### N14 — Übungs-Einstellungen ins Einstellungen-Menü
**Beschreibung:** Die Tabs unter Üben→Übungen→Einstellungen sollen als eigener Tab "Übungen" ins globale Einstellungen-Panel in der Kopfzeile verschoben werden, mit den bestehenden Untertabs.
**Betroffene Dateien:** EinstellungenPanel.tsx, UebenEinstellungen-Komponenten, LPStartseite.tsx

### N15 — Prüfung/Übung durchführen: Layout-Umbau
**Beschreibung:**
- Suchfeld verkürzen und rechts neben die Tabs setzen (gleiche Zeile, flexible Breite)
- Tabs: "Übung durchführen" / "Übungen" / "Analyse" bzw. "Prüfung durchführen" / "Analyse"
- Filter-Zeile darunter
- "+Neue Prüfung"/"+Neue Übung" Button aus Kopfzeile → rechtsbündig in Filterzeile, hervorgehoben (wie "Übung starten")
- "Durchführen" → "Prüfung starten" (analog zu "Übung starten")
**Betroffene Dateien:** LPHeader.tsx, PruefungDurchfuehren.tsx, UebungDurchfuehren.tsx

### N16 — CTA-Buttons konsistent hervorheben
**Beschreibung:** "+Neue Frage" im Frageneditor, "+Neue Prüfung", "+Neue Übung" — alle primären Aktions-Buttons einheitlich hervorheben (gleicher Stil wie "Übung starten").
**Betroffene Dateien:** FragenBrowserHeader.tsx, diverse

### N17 — Frageneditor: "Fachbereich" → "Fach" (nur UI-Label)
**Beschreibung:** Im Dropdown "Gruppieren" steht "Fachbereich" statt "Fach". Nur das UI-Label ändern, NICHT die internen Variablen/Typen (395 Stellen, zu riskant).
**Betroffene Dateien:** FragenBrowserHeader.tsx (1 Stelle)

### N18 — Frageneditor: Icons bei Fragetypen entfernen
**Beschreibung:** In der Fragetyp-Auswahl im Frageneditor die Icons weglassen — nur Text.
**Betroffene Dateien:** FragenEditor / Fragetyp-Selector

### N19 — Bild-Persistenz bei Fragetyp-Wechsel
**Beschreibung:** Wenn im Frageneditor ein Bild hochgeladen wird und dann auf einen anderen Bild-Fragetyp gewechselt wird, soll das Bild erhalten bleiben (kein erneuter Upload nötig).
**Betroffene Dateien:** SharedFragenEditor.tsx, fragenbankStore.ts

### N20 — KI-Bild-Generator: UI-Fixes
**Beschreibung:**
- "SVG generieren" als echten Button darstellen (nicht Text) + cursor:pointer
- KI-Tab: violett → blau hinterlegen (KI = blau, konsistent)
- Alle KI-Buttons (generieren, verbessern etc.) in KI-Farbe (blau)
- Generell: cursor:pointer überall wo klickbar
**Betroffene Dateien:** BildMitGenerator.tsx, BildGeneratorPanel.tsx

### N21 — Violett für Eingabefelder (Konzeptfrage)
**Beschreibung:** Konzeptfrage: Soll die violette Hervorhebung von Eingabefeldern (wie in SuS-Prüfungen) auch in anderen Bereichen eingesetzt werden? Z.B. Frageneditor bei neuer Frage — Pflichtfelder violett umrahmen.
**Status:** Noch zu entscheiden. Als Teil von N8 (Design-Schliff) behandeln.

---

## Bestehende offene Punkte (aus HANDOFF)

### Bugs

| # | Bug | Status |
|---|-----|--------|
| B2 | Audio iPhone-Trigger (19s→4s) | Offen |
| B3 | Abgabe-Timeout | Offen |
| B4 | Fachkürzel stimmen nicht | Offen |

### Features / Architektur

| # | Thema | Status |
|---|-------|--------|
| A2 | KI-Bild-Generator Backend | Offen |
| V1 | Bilanzstruktur: Gewinn/Verlust | Offen |
| V3 | Testdaten-Generator | Offen |
| V8 | Ähnliche Fragen erkennen | Offen |

### Technische Schulden

| # | Thema | Status |
|---|-------|--------|
| T1 | 62 SVGs visuell prüfen | Offen |
| T2 | Excel-Import Feinschliff | Offen |

### Ausstehende Browser-Tests

| # | Test | Session |
|---|------|---------|
| BT1 | S93 Fixes (FiBu Prüfen-Button, Gesperrt, Zusammenfassung) | S93 |
| BT2 | Kontenbestimmung im Browser | S87 |
| BT3 | Buchungssatz + T-Konto Dropdowns | S87 |
| BT4 | Favoriten: Backend-Sync + Direktlinks | S86 |
| BT5 | LP Profil speichern | S88 |
| BT6 | Lernziele-Tab CRUD | S88 |
| BT7 | Bild-Editor: Upload + KI-Tab | S88 |

---

## Empfohlene Bündelung für Umsetzung

### Bundle 1 — Quick Wins (klein, isoliert) ✅ S98
N3, N17, N18, N13, N5, N10 (Begriffe)

### Bundle 2 — Favoriten-Redesign ✅ S99
N1 (dynamische Struktur), N2 (Tab + Home-Zugang)

### Bundle 3 — Übungs-Themen UX
N9 (5 aktuelle, auto-ablösen), N11 (SuS-Sortierung), N12 (LP Status-Differenzierung), N14 (Einstellungen verschieben)

### Bundle 4 — Layout-Umbau Durchführen
N15 (Tabs + Suche + Button), N16 (CTA-Buttons konsistent)

### Bundle 5 — Bildfragen-Editor
N6 (kein doppeltes Bild), N7 (violette Pins/Zonen), N19 (Bild-Persistenz)

### Bundle 6 — KI-UI
N20 (Buttons, Farben, Cursor)

### Bundle 7 — Design-Konzept (braucht Mockups zuerst)
N8 (genereller Design-Schliff), N21 (violette Eingabefelder), N4 (resizable Sidebar)
