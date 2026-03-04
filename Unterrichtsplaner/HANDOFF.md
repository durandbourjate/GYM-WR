# Unterrichtsplaner – Handoff v3.83

## Status: ✅ v3.83 — 5/5 Tasks erledigt (04.03.2026)

---

## Ergebnis v3.83

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| F1 | Bug | Recht fehlt im Semesterbalken (Jahresübersicht) — Case-Mismatch `Recht` → `RECHT` | ✅ |
| F2 | Feature | Sonderwochen: Filterwirkung nach GYM-Stufe und TaF im Planer | ✅ |
| F3 | UX | Sequenzbalken-Klick wählt Sequenz im Detailmenü vor | ✅ |
| F4 | Feature | Separate Importoptionen auf Startseite | ✅ |
| F5 | Data | Sonderwochen-Daten gemäss IW-Plan SJ 25/26 | ✅ |

### Änderungsdetails

**F1 — Recht im Semesterbalken:**
- **Ursache:** `stoffverteilungPresets.ts` verwendete `Recht` als Key, aber `WR_CATEGORIES` definiert `RECHT` (Grossbuchstaben). `sv.weights['RECHT']` ergab `undefined` → Balken zeigte 0.
- `stoffverteilungPresets.ts`: Alle `Recht` → `RECHT` Keys korrigiert (SF- und EF-Presets)
- `ZoomMultiYearView.tsx` `entriesToRows()`: Normalisierung aller Weight-Keys auf Uppercase, damit auch bereits gespeicherte Daten mit Mixed-Case korrekt angezeigt werden

**F2 — Sonderwochen Stufen-/TaF-Filter:**
- **Problem:** `gymLevel`-Feld wurde nur zum Berechnen von `excludedCourseIds` im SettingsPanel genutzt, aber nicht dynamisch in `applySettingsToWeekData()` geprüft.
- `settingsStore.ts` `applySettingsToWeekData()`: Dynamische gymLevel-Filterung hinzugefügt
  - `alle` → alle Kurse (bisheriges Verhalten)
  - `GYM1`–`GYM5` → nur Kurse mit passender `stufe`
  - `TaF` → nur Kurse mit TaF-Klassennamen (enthält f/s)
- Zwei Filterebenen: gymLevel (1.) + courseFilter (2.) müssen beide erfüllt sein
- `colToCourse` Map für direkten CourseConfig-Zugriff pro Spalte

**F3 — Sequenzbalken-Klick wählt Sequenz vor:**
- **Problem:** `editingSequenceId` wurde auf `parentSeq.id` gesetzt (z.B. `"seq-abc"`), aber `FlatBlockCard` erwartet `"seq-abc-0"` (mit Block-Index). → Sequenz nie als aktiv erkannt.
- `WeekRows.tsx`: Beide Klick-Handler (Sequenzbalken + Label) setzen jetzt den korrekten Block-Key `"${seqId}-${blockIdx}"` basierend auf der angeklickten Woche
- SequencePanel scrollt automatisch zur aktiven Sequenz und klappt sie auf

**F4 — Separate Importoptionen auf Startseite:**
- `PlannerTabs.tsx` `WelcomeScreen`: Aufklappbare Sektion «Einzelne Rubriken importieren» mit 6 Import-Buttons (2×3 Grid)
- Rubriken: Schulferien, Sonderwochen, Stundenplan/Kurse, Fachbereiche, Lehrplanziele, Beurteilungsregeln
- Jeder Button öffnet File-Picker (JSON, CSV/TXT je nach Rubrik) und zeigt ✅ nach erfolgreichem Import
- Einzel-Imports überschreiben entsprechende Felder aus der Gesamtkonfiguration
- Bestehender «Gesamtkonfiguration importieren»-Button bleibt erhalten

**F5 — Sonderwochen-Daten gemäss IW-Plan SJ 25/26:**
- `iwPresets.ts`: Komplett überarbeitet — 19 Einträge gemäss IW_Plan_SJ_25_26_250710.pdf
- `sonderwochen_hofwil_2526.json`: Identische Daten als JSON-Preset
- KW38: +TaF-Eintrag, Labels aktualisiert (SOL-Projekt, Franzaufenthalt/Kompensation)
- KW14: Labels aktualisiert (EF-Woche statt Ergänzungsfach, Französisch/Englisch statt Maturvorbereitung)
- KW25: Geo+Sport (GYM1) + Wirtschaftswoche (GYM2) separat statt zusammen
- KW27: TaF+GYM2 aufgesplittet (Spezialwoche TaF + MINT), GYM4/GYM5 entfernt
- Kollegiumstagung, Prüfungswochen und andere Nicht-IW-Einträge entfernt

---

## Ergebnis v3.82

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| E1 | UX | UE-Buttons: «i» durch ↑ ersetzt → UE nach oben + unten verschieben (swap) | ✅ |
| E2 | Feature | «✕ Alle»-Button in allen 6 Einstellungsrubriken (Kopfzeile) | ✅ |
| E3 | Bug | Konfiguration-Import-Bug gefixt (flexibler Parser), Labels vereinheitlicht (📤/📥) | ✅ |
| E4 | Feature | Drag & Drop cross-column: UE in beliebige Zelle verschieben (150ms/5px Schwelle) | ✅ |
| E5 | Data | Fach-Dropdown: 21 Einzelfächer statt Gruppen-Presets in `<optgroup>` | ✅ |
| E6 | Feature | Startscreen: «📥 Gesamtkonfiguration importieren» Button mit Vorschau | ✅ |
| E7 | Feature | Sonderwochen: `courseFilter` pro Sonderwoche mit Checkbox-UI + Schnellauswahl | ✅ |

### Änderungsdetails

**E3 — Import-Bug + Labels:**
- `SettingsPanel.tsx`: Konfiguration-Import-Handler flexibilisiert — akzeptiert jetzt Partial-JSON (courses, holidays, specialWeeks, subjects einzeln oder kombiniert), merged statt überschreibt
- Planerdaten-Labels «⬇ Export» / «⬆ Import» → «📤 Exportieren» / «📥 Importieren»

**E2 — «Alle entfernen»:**
- `SectionActions` Komponente um `onClearAll` + `itemCount` erweitert
- Alle 6 Rubriken (Fachbereiche, Kurse, Sonderwochen, Ferien, Lehrplanziele, Beurteilungsregeln) haben «✕ Alle» Button
- Button disabled wenn leer, Bestätigungs-Dialog vor Löschung

**E1 — UE-Buttons ↑/↓:**
- `WeekRows.tsx`: «i»-Button entfernt, «↑»-Button hinzugefügt
- Beide nutzen `swapLessons` für positionsbasierten Tausch
- Erster Eintrag: ↑ disabled, letzter: ↓ disabled

**E5 — Einzelfächer:**
- `subjectPresets.ts` komplett überarbeitet: 21 Einzelfach-Presets statt 6 Gruppen
- IDs: vwl, bwl, recht, biologie, chemie, physik, deutsch, englisch, franzoesisch, italienisch, latein, spanisch, geschichte, geografie, philosophie, bg, musik, sport, mathematik, informatik + leer
- Farben gemäss Spec im HANDOFF

**E7 — Sonderwochen courseFilter:**
- `SpecialWeekConfig` um `courseFilter?: string[]` erweitert (settingsStore.ts)
- UI: Toggle «Nur für bestimmte Kurse anzeigen» → Checkbox-Liste + Schnellauswahl (Alle GYM2, Alle SF, Alle)
- `applySettingsToWeekData`: courseFilter wird beim Rendern respektiert

**E6 — Startscreen Sammlung-Import:**
- `PlannerTabs.tsx/WelcomeScreen`: «📥 Gesamtkonfiguration importieren» Button mit File-Picker
- Zeigt ✅ + Dateiname nach erfolgreichem Import
- Bei Erstellen → Konfiguration in initialSettings übernommen inkl. weekData-Generierung

**E4 — Cross-Column Drag & Drop:**
- `plannerStore.ts`: neue `moveLessonToColumn()` Funktion (verschiebt UE + LessonDetail + Sequenz-Update)
- `WeekRows.tsx`: Drag-Erkennung 150ms Timer ODER 5px Bewegung
- Cross-Column-Drop: Target-Highlight (blauer Rahmen) für alle Spalten
- Same-Column: weiterhin swap/moveLessonToEmpty

---

## Originalauftrag v3.82 (04.03.2026)

| # | Typ | Beschreibung |
|---|-----|-------------|
| E1 | UX | UE-Buttons: «i»-Icon durch Pfeil-oben ersetzen → UE nach oben + unten verschieben |
| E2 | Feature | «Alle entfernen»-Button bei allen Einstellungsrubriken |
| E3 | Bug | «Konfiguration Importieren» führt zu Fehlermeldung; inkonsistente Button-Bezeichnungen |
| E4 | Feature | Drag & Drop: UE in beliebige Zelle (anderer Kurs + andere KW) verschieben |
| E5 | Data | Fach-Dropdown aufteilen: Einzelfächer statt Gruppen (VWL/BWL/Recht, Bio/Chemie/Physik etc.) |
| E6 | Feature | Startscreen: Gesamtkonfiguration direkt beim Erstellen importierbar (Sammlung-Import) |
| E7 | Feature | Sonderwochen: Sichtbarkeit pro Kurs konfigurierbar (nur relevante Kurse) |

**Empfohlene Reihenfolge:** E3 → E2 → E1 → E5 → E7 → E6 → E4

---

### Task E1: UX — UE-Buttons: «i» durch Pfeil-oben ersetzen

**Betrifft:** UE-Inline-Buttons (erscheinen beim Hover/Fokus auf einer UE-Kachel)

**Ist-Zustand (Screenshot):**
`[Neue UE] [+] [↓] [i]`

**Problem:** Der «i»-Button hat eine unklare Funktion. Der «↓»-Button verschiebt die UE nach unten, aber es gibt keinen Pfeil nach oben.

**Ziel:**
`[Neue UE] [+] [↑] [↓]`

- «i»-Button komplett entfernen
- Neuen «↑»-Button hinzufügen (verschiebt UE um eine Position nach oben innerhalb der Spalte)
- «↓»-Button bleibt (verschiebt nach unten)
- Tooltip: «Nach oben verschieben» / «Nach unten verschieben»
- An erster Position: ↑-Button deaktiviert (disabled, gegraut)
- An letzter Position: ↓-Button deaktiviert

**Hinweis:** Die Pfeil-Buttons lösen die Funktion «UE innerhalb einer Spalte verschieben» aus — das ist der einfache Weg. Drag & Drop über Spalten hinweg kommt separat (E4).

---

### Task E2: Feature — «Alle entfernen»-Button bei allen Einstellungsrubriken

**Betrifft:** Alle Rubriken in `SettingsPanel` (Fachbereiche, Kurse, Ferien, Sonderwochen, Lehrplanziele, Beurteilungsregeln)

**Ist-Zustand:** Kein «Alle entfernen»-Button vorhanden. Jeder Eintrag muss einzeln gelöscht werden.

**Ziel:** In der Kopfzeile jeder Rubrik einen kompakten «✕ Alle»-Button ergänzen.

**Reihenfolge Kopfzeile (neu):**
```
[Rubrik-Titel (N)]  [+]  [💾]  [📂]  [⬆]  [✕ Alle]  [▼]
```

**Verhalten:**
- Klick → Bestätigungs-Dialog: «Alle X Einträge entfernen?» → [Abbrechen] / [Alle entfernen]
- Nach Bestätigung: Array wird auf `[]` gesetzt, Toast «X Einträge entfernt»
- Button graut aus (disabled) wenn Rubrik bereits leer ist

**Gilt für alle 6 Rubriken** (auch Fachbereiche — leerer Zustand ist seit D2 crashfrei).

---

### Task E3: Bug — «Konfiguration Importieren» Fehlermeldung + inkonsistente Button-Bezeichnungen

**Betrifft:** `SettingsPanel` → Rubrik «💾 Daten & Sammlung», Abschnitt «Konfiguration»

**Problem 1 — Fehlermeldung:**
Der «📥 Importieren»-Button im Konfiguration-Abschnitt führt zu einer Fehlermeldung. Vermutlich liest der Handler ein falsches Format oder die JSON-Struktur stimmt nicht mit dem erwarteten Format überein.

**Problem 2 — Inkonsistente Bezeichnungen:**
- Konfiguration: «📤 Exportieren» / «📥 Importieren»
- Planerdaten: «⬇️ Export» / «⬆️ Import»
- Sammlung: «💾 Speichern» / «📂 Laden»

**Lösung:**
1. Fehlermeldung beim Konfiguration-Import debuggen und beheben:
   - Format der exportierten Konfiguration mit dem Import-Handler abgleichen
   - Falls nötig: Format-Migration oder flexibler Parser (unterstützt altes + neues Format)
2. Bezeichnungen vereinheitlichen — durchgängig:
   - «📤 Exportieren» / «📥 Importieren» (ausgeschriebene Verben, konsistent in allen 3 Abschnitten)

**Hinweis:** Konfiguration-Export und -Import betreffen `courses`, `holidays`, `specialWeeks`, `subjects`, `curriculumGoals`, `assessmentRules`. Format prüfen ob es einem `PlannerSettings`-Subset entspricht oder ein eigenes `ConfigExport`-Interface hat.

---

### Task E4: Feature — Drag & Drop: UE in beliebige Zelle verschieben

**Betrifft:** Haupt-Planer-Ansicht (`WeekRows`), UE-Kacheln

**Ist-Zustand:** Drag & Drop existiert, aber:
- Beim Klicken + Ziehen auf eine UE werden stattdessen Zellen markiert (Lasso-Select)
- UE können nicht in eine andere Kurs-Spalte verschoben werden

**Ziel:**
1. **Drag-Erkennung:** Mousedown auf UE → kurzes Timeout (100–150ms) unterscheidet Klick von Drag-Start
   - Klick (< 150ms, keine Bewegung > 5px) → Zelle auswählen / Panel öffnen (bestehend)
   - Drag (> 150ms oder Mausbewegung > 5px) → UE-Drag startet
2. **Zellen markieren via Modifier-Keys:**
   - Shift-Klick → Bereich markieren
   - Command/Ctrl-Klick → Einzelne Zellen zur Auswahl hinzufügen
   - Normaler Klick (ohne Modifier, keine Drag-Bewegung) → Einzelzelle auswählen
3. **Drag-Verhalten:**
   - Ghost-Bild der UE folgt dem Mauszeiger
   - Gültige Drop-Targets: alle Wochen-Zellen aller Kursspalten (ausser Ferien/Sonderwochen-Zellen)
   - Hover über Drop-Target: Highlight (blauer Rahmen)
   - Drop → UE wird aus der Quell-Zelle entfernt und in die Ziel-Zelle eingefügt
   - Ziel-Kurs und Ziel-KW werden in der UE-Daten aktualisiert
4. **Zwischen Spalten:** Beim Verschieben in eine andere Kurs-Spalte → Kurs-ID der UE wird auf Ziel-Kurs aktualisiert

**Technisch:**
- `mousedown` auf UE → `isDraggingUE`-State starten (mit Timer)
- `mousemove` → wenn `isDraggingUE`: Ghost zeigen, Drop-Target berechnen
- `mouseup` → Drop ausführen oder abbrechen
- `e.preventDefault()` während Drag um Text-Selektion zu verhindern
- Bestehende `multiSelection`-Logik (Shift/Cmd-Klick) bleibt erhalten

---

### Task E5: Data — Fach-Dropdown: Einzelfächer statt Gruppen

**Betrifft:** `data/subjectPresets.ts`, Fachbereiche-Rubrik in `SettingsPanel`

**Ist-Zustand:** Das Dropdown zeigt Gruppen-Einträge:
- «W&R (VWL / BWL / Recht)» — lädt alle 3 auf einmal
- «Naturwissenschaften (Bio / Chemie / Physik)» — lädt alle 3 auf einmal

**Ziel:** Jedes Fach einzeln auswählbar:

```
── W&R ──
  VWL          (orange  #f97316)
  BWL          (blau    #3b82f6)
  Recht        (grün    #22c55e)
── Naturwissenschaften ──
  Biologie     (#16a34a)
  Chemie       (#dc2626)
  Physik       (#7c3aed)
── Sprachen ──
  Deutsch      (#1d4ed8)
  Englisch     (#0369a1)
  Französisch  (#0891b2)
  Italienisch  (#b45309)
  Latein       (#6b7280)
  Spanisch     (#ef4444)
── Geistes-/Sozialwiss. ──
  Geschichte   (#b45309)
  Geografie    (#0891b2)
  Philosophie  (#f59e0b)
── Gestalterisch ──
  Bildnerisches Gestalten  (#ec4899)
  Musik        (#8b5cf6)
  Sport        (#10b981)
── Mathe & Info ──
  Mathematik   (#1d4ed8)
  Informatik   (#6366f1)
── Andere ──
  Leer (Vorlage-Struktur)
```

**IDs:** `vwl`, `bwl`, `recht`, `biologie`, `chemie`, `physik`, `deutsch`, `englisch`, `franzoesisch`, `italienisch`, `latein`, `spanisch`, `geschichte`, `geografie`, `philosophie`, `bg`, `musik`, `sport`, `mathematik`, `informatik`

**Verhalten beim Laden:**
- Einzelfach-Auswahl → Dialog «Ergänzen» / «Ersetzen»
- Duplikat-Prüfung by `id` — Fach mit gleichem `id` wird übersprungen

**Technisch:** `subjectPresets.ts` überarbeiten — statt Gruppen-Presets → 21 Einzel-Presets mit `<optgroup>`. Das `<select>`-Dropdown bleibt, aber jede `<option>` entspricht einem Einzelfach.

---

### Task E6: Feature — Startscreen: Gesamtkonfiguration importieren

**Betrifft:** `WelcomeScreen` / `PlannerTabs.tsx` — Formular «Neuen Planer erstellen»

**Ist-Zustand:** Startscreen zeigt nur Name-Eingabe + «+ Neuen Planer erstellen» + Hinweis auf spätere Importe in Einstellungen.

**Ziel:** Einen «📥 Gesamtkonfiguration importieren»-Button direkt auf dem Startscreen:

```
[Name-Eingabe]
[📥 Gesamtkonfiguration importieren]   ← NEU
[+ Neuen Planer erstellen]
```

**Verhalten:**
- Klick → öffnet Datei-Picker (JSON)
- Erwartet dasselbe Format wie «Sammlung laden» (Gesamtkonfiguration-JSON)
- Wenn Datei geladen: Button zeigt ✅ + Dateiname («✅ konfiguration_sj2526.json»)
- Beim Klick «+ Neuen Planer erstellen» → geladene Konfiguration wird in `initialSettings` übernommen (Kurse, Ferien, Sonderwochen, Fachbereiche, Lehrplanziele, Beurteilungsregeln)
- Falls keine Datei geladen → Planer startet leer (bestehend)

**Format:** Identisch mit dem Export aus «💾 Daten & Sammlung → Sammlung → Speichern» (Gesamtkonfiguration-JSON).

**Hinweis:** C8 hat bereits Einzel-Import-Buttons (Ferien, Sonderwochen, Stundenplan, Beurteilungsregeln). E6 ergänzt einen übergeordneten Sammlung-Import, der alles auf einmal lädt. Die C8-Buttons bleiben für Einzel-Importe.

---

### Task E7: Feature — Sonderwochen: Sichtbarkeit pro Kurs konfigurierbar

**Betrifft:** Sonderwochen-Rubrik in `SettingsPanel`, Sonderwoche-Formular, `WeekRows`-Rendering

**Ist-Zustand:** Sonderwochen (z.B. «Schneesportlager GYM2») erscheinen in **allen** Kursspalten.

**Ziel:** Jede Sonderwoche kann auf bestimmte Kurse beschränkt werden.

**UI im Sonderwoche-Formular:**
```
[x] Nur für bestimmte Kurse anzeigen
    Wenn aktiviert: Checkbox-Liste aller konfigurierten Kurse
    □ 29c SF    □ 27a28f SF    □ 28bc29fs SF
    □ 27a KS    □ 28c IN       □ 29f IN
    □ 30s IN    □ 29fs EWR
    [Alle GYM2] [Alle SF] [Alle]  ← Schnellauswahl-Buttons
```

**Datenmodell:**
```typescript
interface SpecialWeekConfig {
  // bestehende Felder...
  courseFilter?: string[] // Array von Kurs-IDs; undefined/leer = alle Kurse
}
```

**Rendering in `WeekRows`:**
- Beim Rendern einer Kurs-Spalte: prüfen ob `specialWeek.courseFilter` definiert und nicht leer ist
- Falls ja: Sonderwoche nur anzeigen wenn `courseId` in `courseFilter` enthalten
- Falls `courseFilter` undefined oder leer: wie bisher alle Spalten

**Schnellauswahl-Buttons:**
- «Alle GYM2» → wählt alle Kurse mit `gymLevel === 'GYM2'` aus
- «Alle SF» → wählt alle Kurse mit `typ === 'SF'` aus
- «Alle» → alle Kurse auswählen (= Filter deaktivieren)

**Hinweis:** `SpecialWeekConfig` Typ in `types.ts` oder `settingsStore.ts` nachschauen und um `courseFilter?` ergänzen. Bestehende Sonderwochen ohne `courseFilter` bleiben unverändert sichtbar für alle.

---

### Commit-Anweisung

```bash
npm run build 2>&1 | tail -20
git add -A
git commit -m "v3.82: UE-Pfeil-oben (E1), Alle-entfernen (E2), Import-Bug (E3), Drag&Drop (E4), Einzelfächer (E5), Sammlung-Import Startscreen (E6), Sonderwoche-Kursfilter (E7)"
git push
# HANDOFF.md: Status auf ✅, alle Tasks dokumentieren
```

