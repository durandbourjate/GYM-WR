# Design-Trio: Editor-Header, Übersichts-Icons, Lernziele bis Unterthema

- **Datum:** 2026-05-21
- **Status:** Genehmigt (User-Approval pro Teil-Design)
- **Kontext:** Drei unabhängige UI-Verbesserungen in ExamLab aus User-Beobachtungen.

Die drei Teile sind unabhängig voneinander und können einzeln umgesetzt, getestet
und gemergt werden.

---

## Teil #2 — Editor-Header «Prüfung bearbeiten»

### Problem
`PruefungsComposer` rendert `AppHeader` (via `LPAppHeaderContainer`) mit
`breadcrumbs` (Prüfungstitel), `statusText` (Speicher-Status) und `aktionsButtons`
(«Duplizieren» + «Speichern» als Text-Buttons). Diese fixen Zonen links und rechts
quetschen die zentrale `TabKaskade` (globale L1-Navigation) im `flex-1`-Mittelteil
ein — nur ein kleiner Teil des Headers zeigt die eigentlichen Tabs.

### Lösung
Klare Trennung von globalem Chrome (Header-Zeile) und Editor-Chrome (zweite Zeile):

- **Header-Zeile** (`AppHeader`): bleibt rein global — Logo, «Zurück», `TabKaskade`,
  Suche, Optionen-Menü. `PruefungsComposer` reicht `breadcrumbs`, `statusText` und
  `aktionsButtons` NICHT mehr an `LPAppHeaderContainer`. Die `TabKaskade` bekommt
  damit die volle Header-Breite.
- **Editor-Leiste** (zweite Zeile in `PruefungsComposer` — die bestehende
  Tab-Zeile wird ausgebaut):
  - Links: Prüfungstitel (kompakt, `truncate` bei Überlänge) + die bestehenden
    Editor-Tabs (`TabBar`: Einstellungen / Abschnitte & Fragen (N) / Vorschau /
    Analyse).
  - Rechts: Speicher-Status (kompakt) + Aktionen als Icon-Buttons mit
    `title`-Tooltip und 44 px Touch-Target: Speichern (`Save`), Duplizieren
    (`Copy`), Löschen (`Trash2`).

Die «Mouseover-L1»-Idee entfällt — bei voller Breite ist die `TabKaskade` nicht
mehr eng.

### Betroffene Dateien
- `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx` — Header-Aufruf
  entschlacken (drei Props weglassen), zweite Zeile zur Editor-Leiste ausbauen.
- `AppHeader` / `LPAppHeaderContainer` — unverändert (`breadcrumbs`, `statusText`,
  `aktionsButtons` sind bereits optionale Props).
- Die Lösch-Logik (`handleLoeschPruefung` / `setZeigLoeschPruefung`) existiert im
  Composer bereits — das `Trash2`-Icon verdrahtet sie nur in die Editor-Leiste.

### Komponenten-Schnitt
Die Editor-Leiste wird als eigene Komponente extrahiert (z.B.
`PruefungsComposerLeiste`), damit `PruefungsComposer` nicht weiter wächst. Inputs:
Prüfungstitel, aktiver Tab + `onTabChange`, Speicher-Status, Aktions-Callbacks
(`onSpeichern`, `onDuplizieren`, `onLoeschen`), `gesamtFragen` für das Tab-Label.

---

## Teil #3 — Aktions-Icons in der Prüfungs-/Übungs-Übersicht

### Problem
`PruefungsKarte` zeigt «Duplizieren» und «Bearbeiten» als ausgeschriebene
Text-Buttons. Ein Lösch-Button fehlt vollständig. Das ist inkonsistent zur
Fragensammlung (`DetailKarte`), die kompakte Icon-Buttons nutzt.

### Lösung
In `PruefungsKarte`:
- «Duplizieren» (Text) → `Copy`-Icon-Button.
- «Bearbeiten» (Text) → `Pencil`-Icon-Button.
- Neuer `Trash2`-Lösch-Icon-Button → ruft ein neues `onLoeschen`-Prop, mit
  Bestätigungsdialog.
- Icon-Button-Stil analog `DetailKarte`: `p-2 rounded-md`, Icon `w-[18px] h-[18px]`,
  `title` + `aria-label`, hover-Akzentfarbe, 44 px Touch-Target.
- Primär-Button («Prüfung starten» / «Übung starten» / «Auswerten») und das
  bestehende «Link kopieren»-Icon bleiben unverändert.
- `onLoeschen`-Prop + Lösch-Handler + Bestätigungsdialog in beiden
  Eltern-Komponenten. Die Prüfungs-Lösch-API existiert bereits (vom
  `PruefungsComposer` genutzt) und wird wiederverwendet.

### Betroffene Dateien
- `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx`
- `ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx`
- `ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx`

---

## Teil #4 — Lernziele bis Unterthema

### Befund
Die Anzeige-Komponenten `LernzieleAkkordeon` und `LernzieleMiniModal` gruppieren
Lernziele **bereits nach `unterthema`** — der `Lernziel`-Typ aus
`ExamLab/src/types/pool.ts` hat ein `unterthema?: string`-Feld, und beide
Komponenten rendern eine Unterthema-Ebene, sobald Daten vorhanden sind.

Der Lernziel-Editor `LernzielTab` (Tab in den Einstellungen) bietet aber **kein
Unterthema-Feld**: sein lokaler `Lernziel`-Typ (Zeilen 7–14) und beide Formulare
(Erstellen + Edit) kennen nur Fach/Thema/Text/Bloom. Darum tragen alle im Editor
erfassten Lernziele kein Unterthema — und die Anzeige bleibt zwangsläufig auf der
Thema-Ebene.

### Lösung
- `LernzielTab.tsx`:
  - Lokalen `Lernziel`-Typ um `unterthema?: string` ergänzen.
  - Erstellen-Formular: Unterthema-Eingabefeld (optional, bei «Thema»).
  - Edit-Formular: Unterthema-Eingabefeld.
  - Listen-Gruppierung: Fach → Thema → Unterthema; Lernziele ohne Unterthema
    erscheinen unter einer «Übergeordnet»-Gruppe (analog `LernzieleAkkordeon`).
- Backend (`ExamLab/apps-script-code.js`): `speichereLernziel` und
  `aktualisiereLernziel` müssen `unterthema` mit-persistieren; sicherstellen, dass
  das Lernziel-Sheet eine `unterthema`-Spalte hat. Erfordert einen
  Apps-Script-Deploy.
- Anzeige (`LernzieleAkkordeon` / `LernzieleMiniModal`): keine Änderung — greift
  automatisch, sobald Lernziele ein Unterthema tragen.

### Betroffene Dateien
- `ExamLab/src/components/settings/LernzielTab.tsx`
- `ExamLab/apps-script-code.js` (`speichereLernziel`, `aktualisiereLernziel`,
  evtl. Sheet-Spalte `unterthema`)

---

## Testing

- **Alle drei:** vitest für neue/geänderte Logik (z.B. Gruppierungs-Helfer in #4),
  `tsc -b`, `npm run build`, die 9 Audit-Gates.
- **Browser-E2E auf Staging mit echtem LP-Login:**
  - #2: Header-Layout beim Prüfung-Bearbeiten — TabKaskade nicht mehr eingequetscht,
    Editor-Leiste mit Titel/Tabs/Status/Aktions-Icons.
  - #3: Icon-Aktionen in der Übersicht inkl. Löschen mit Bestätigung, in Prüfungs-
    UND Übungs-Ansicht.
  - #4: Lernziel mit Unterthema im Editor erstellen → im Akkordeon und Mini-Modal
    unter dem Unterthema sichtbar.
- #4 benötigt einen Apps-Script-Deploy für die Backend-Persistenz.

## Reihenfolge / Unabhängigkeit

Die drei Teile sind unabhängig. Empfohlene Reihenfolge: #3 (kleinste, reine
Frontend-Änderung), #2 (Frontend), #4 (Frontend + Backend-Deploy). Jeder Teil ist
einzeln mergebar.
