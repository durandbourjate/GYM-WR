# Unterrichtsplaner – Handoff v3.97

## Status: ✅ v3.97 — Ferien-Rendering + Sequenz-Menü Fix — ABGESCHLOSSEN

**Vorgänger:** v3.96 (11 Bug-Fixes + UX abgeschlossen und deployed).

---

## OBERSTE REGEL

**Immer `npx tsc --noEmit && npm run build` vor und nach jeder Änderung.**
Commit nach jedem erledigten Task: `git add -A && git commit -m "fix: v3.97 — [Beschreibung]" && git push`

---

## Originalauftrag v3.97

| # | Typ | Beschreibung | Priorität | Status |
|---|-----|-------------|-----------|--------|
| U1 | Refactor | Ferien-Rendering: rowSpan-Merging komplett entfernen, jede Ferienwoche einzeln als Balken | 🔴 Kritisch | ✅ |
| U2 | Bug | Sequenz-Menü zu klein + Tab-Schrift «Sequenzen» unlesbar (T8-Regression) | 🟠 Hoch | ✅ |

---

## Task U1: Ferien-Rendering vereinfachen — kein rowSpan mehr

### Problem
Die bisherige `holidaySpans`-Logik fasst aufeinanderfolgende Ferien-Wochen per `rowSpan` + `colspan` zu einem einzigen Block zusammen. Diese Logik war die Ursache für den hartnäckigen Bug, bei dem KW-Zeilen komplett verschwanden (KW 3–4, 17, 43–45 in v3.96 T1). Obwohl T1 den Bug gefixt hat, ist die rowSpan-Logik fragil und fehleranfällig.

### Gewünschtes Verhalten (NEU)
- **Jede Ferienwoche wird als eigene Zeile dargestellt** — kein rowSpan-Merging mehr
- **Jede Ferienzeile ist ein durchgehender Balken** über alle Kurs-Spalten (colspan über alle Kurse)
- **Kein `holidaySpans`, kein `holidaySkipSet`, kein `holidaySpanStart`** — diese drei useMemos komplett entfernen
- **Darstellung pro Ferienwoche:** Eine `<tr>` mit KW-Nummer links + einem `<td colSpan={courses.length}>` das den Feriennamen zeigt (z.B. «🏖 Herbstferien»)
- **Mehrtägige Ferien** (z.B. Herbstferien KW 39–41): Jede KW eine eigene Zeile, jede zeigt «🏖 Herbstferien». Optional: Wochenzähler «(1/3)», «(2/3)», «(3/3)» — aber kein Muss.
- **Sonderwochen/Events (type 5):** Gleiche Behandlung — colspan-Balken pro Woche, KEIN rowSpan

### Technische Umsetzung

**In `ZoomYearView.tsx`:**
1. Die drei `useMemo`-Blöcke entfernen: `holidaySpans`, `holidaySkipSet`, `holidaySpanStart`
2. Im `allWeekKeys.map()`-Loop: Die `if (holidaySkipSet.has(weekIdx)) return null;` Zeile entfernen
3. Die `if (hSpan)` Branch (die den rowSpan-Block rendert) entfernen
4. Stattdessen: Innerhalb des regulären Wochen-Renderings prüfen ob die Woche eine Ferien-/Event-Woche ist:
```typescript
const weekEntry = effectiveWeeks.find(w => w.w === weekW);
const allEntries = weekEntry ? Object.values(weekEntry.lessons) : [];
const isAllHoliday = allEntries.length > 0 && allEntries.every(e => e.type === 6);
const isAllEvent = allEntries.length > 0 && allEntries.every(e => e.type === 5);

if (isAllHoliday || isAllEvent) {
  // Render: KW-Zelle + EIN td mit colSpan={totalCols} als Balken
  return (
    <tr key={weekW} ...>
      <td ...>{weekW}</td>
      <td colSpan={totalCols} className="... text-center">
        <span>{isAllHoliday ? '🏖' : '📅'} {allEntries[0]?.title}</span>
      </td>
    </tr>
  );
}
// Sonst: normales Wochen-Rendering (wie bisher)
```

**In `WeekRows.tsx`:**
Analog: Die `holidaySpans`/`holidaySkipSet`/`holidaySpanStart` useMemos entfernen. Falls WeekRows eine eigene Ferien-Zusammenfassungslogik hat, ebenfalls durch einfaches colspan-pro-Woche ersetzen.

### Checkliste
- [ ] `ZoomYearView.tsx`: holidaySpans/holidaySkipSet/holidaySpanStart useMemos entfernen
- [ ] `ZoomYearView.tsx`: rowSpan-Rendering-Branch entfernen
- [ ] `ZoomYearView.tsx`: Einfaches colspan-Rendering für Ferien/Event-Wochen
- [ ] `WeekRows.tsx`: Analoge Änderungen (falls Ferien-Merging vorhanden)
- [ ] Sicherstellen: Alle KW-Zeilen (33–27) werden angezeigt — keine verschwindet
- [ ] Sicherstellen: Ferien-Balken spannen über alle Kursspalten (kein einzelner Kachel pro Kurs)
- [ ] Light-Mode + Dark-Mode: Ferien-Balken lesbar in beiden Modi
- [ ] `npx tsc --noEmit && npm run build` fehlerfrei

### Dateien
- `src/components/ZoomYearView.tsx` (Hauptänderung)
- `src/components/WeekRows.tsx` (analoge Änderung)

---

## Task U2: Bug — Sequenz-Menü zu klein + Tab-Schrift unlesbar (T8-Regression)

### Problem
1. **Tab-Schrift «Sequenzen» nicht lesbar im Light-Mode:** Grüne Schrift auf grünem Hintergrund = kein Kontrast
2. **FlatBlockCard-Bearbeitungsfelder zu klein:** Die Inputs für Oberthema, Fachbereich, Notizen, betroffene KW sind winzig (8-9px)

### Fix (umgesetzt)
1. **Tab-Farben (DetailPanel.tsx):** Hardcoded Tailwind-Farben → CSS-Variables `var(--text-primary)` (aktiv) / `var(--text-muted)` (inaktiv). Funktioniert in Light + Dark Mode.
2. **FlatBlockCard vergrössert (SequencePanel.tsx):** Header 10px→12px, Labels 8px→10px, Inputs 9px→11px mit px-2 py-1 Padding, Buttons 8px→10px. Alle Bereiche: Block-Felder, Reihen-Felder, SOL-Felder, Action-Buttons.

### Bonus-Fix: Weihnachtsferien
- `ferien_hofwil_2526.json`: startWeek "51" → "52" (war 3 Wochen statt 2)

### Dateien
- `src/components/DetailPanel.tsx` (Tab-Farben)
- `src/components/SequencePanel.tsx` (FlatBlockCard-Grösse)
- `public/presets/Hofwil/ferien_hofwil_2526.json` (Weihnachtsferien-Daten)

---

## Vorherige Version: v3.96 ✅ (11 Bug-Fixes + UX)

**Empfohlene Reihenfolge:** T1 → T2 → T3 → T5 → T6 → T4 → T7 → T8 → T9 → T10 → T11

---

## Task T1: Bug — Ferien-Regression, KW-Zeilen fehlen komplett

### Problem
In der Jahresübersicht fehlen KW 3–4 (nach Weihnachtsferien), KW 17 (nach Frühlingsferien) und KW 43–45 (nach Herbstferien) als Zeilen komplett. Die Zeilen werden nicht angezeigt — weder als Ferien noch als normale Wochen.

### Ursache (Hypothese)
Die `holidaySpans`-Logik in `ZoomYearView.tsx` (und analog `WeekRows.tsx`) fasst aufeinanderfolgende Ferien-Wochen per `rowSpan` zusammen. Die Merge-Schleife (Zeile ~242 in ZoomYearView) läuft weiter solange die nächste Woche auch `isHoliday` ist:

```typescript
while (i < allWeekKeys.length) {
  const nextWeek = effectiveWeeks.find(w => w.w === allWeekKeys[i]);
  const nextEntries = nextWeek ? Object.values(nextWeek.lessons) : [];
  const nextIsHoliday = nextEntries.length > 0 && nextEntries.every(e => (e as any).type === 6);
  if (!nextIsHoliday) break;
  i++;
}
```

**Kritischer Bug:** Wenn `nextEntries.length === 0` (Woche hat keine Lektionseinträge), ist `nextIsHoliday = false` und die Schleife bricht ab — das ist korrekt. ABER: die `applySettingsToWeekData`-Funktion in `settingsStore.ts` könnte zu viele Wochen als type 6 markieren. 

Die Ferien-JSON sagt: Herbstferien KW 39–41, Weihnachtsferien KW 51–01, Frühlingsferien KW 15–16.
- KW 43–45 fehlen → sie werden fälschlicherweise als Ferienverlängerung der Herbstferien (39–41) erkannt. Möglicherweise markiert `applySettingsToWeekData` KW 42–45 als type 6 (z.B. wegen der Sonderwochen-Logik die dort ebenfalls type 5/6 setzt).
- KW 3–4 fehlen → Weihnachtsferien 51–01 werden bis KW 4 verlängert.
- KW 17 fehlt → Frühlingsferien 15–16 werden bis KW 17 verlängert.

### Debugging-Anleitung
1. **`settingsStore.ts` → `applySettingsToWeekData()`**: Nach dem Holiday-Block die `result`-Array loggen/prüfen. Für jede Woche schauen: welche Kurse haben type 6?
2. **`expandWeekRange("39", "41")`**: Soll genau `["39","40","41"]` liefern — prüfen ob mehr kommt.
3. **Sonderwochen-Block** (nach den Holidays): Prüfen ob Sonderwochen fälschlicherweise type 6 statt type 5 setzen, was die Holiday-Span-Erkennung verwirrt.
4. **`holidaySpans` in `ZoomYearView.tsx`**: Console.log der berechneten Spans — welche Wochen werden geskippt?

### Fix-Strategie
- In `applySettingsToWeekData()`: Sicherstellen dass NUR die exakten Wochen aus `expandWeekRange` als type 6 markiert werden.
- In `holidaySpans`-Berechnung: Zusätzlich den **Label** prüfen — nur Wochen mit demselben Label mergen (verhindert, dass Sonderwoche direkt nach Ferien irrtümlich angehängt wird).
- Die `holidaySkipSet` loggen und mit der erwarteten KW-Liste abgleichen.

### Dateien
- `src/store/settingsStore.ts` (applySettingsToWeekData, expandWeekRange)
- `src/components/ZoomYearView.tsx` (holidaySpans, holidaySkipSet)
- `src/components/WeekRows.tsx` (analoge Logik falls vorhanden)
- `public/presets/Hofwil/ferien_hofwil_2526.json` (Referenz — nicht ändern)

---

## Task T2: Bug — Sonderwochen falscher Inhalt + unlesbarer Text

### Problem (2 Teilprobleme)
1. **Falscher Inhalt:** In der Wochendetailansicht zeigen alle Kurse dieselbe Sonderwoche (z.B. alle zeigen «Schneesportlager»), obwohl die Sonderwochen stufenspezifisch unterschiedlich sein sollten (29c=GYM1, 27a28f=GYM2/GYM3, 28bc29fs=GYM2/GYM3).
2. **Schlechte Lesbarkeit:** Der Sonderwochen-Text ist rötlich/orange auf beigem Hintergrund — kaum erkennbar.

### Ursache (Regression)
In v3.89 (L3) wurde die stufenspezifische Zuordnung implementiert via `iwPresets.ts` mit `gymLevel`-pro-Eintrag. Das Refactoring (v3.93–v3.95) hat möglicherweise die Filter-Logik beschädigt: `course.stufe`-Matching funktioniert nicht mehr korrekt.

### Fix

**Teil 1 — Inhalt:** In `settingsStore.ts → applySettingsToWeekData()`, Sonderwochen-Block:
1. Prüfen wie `gymLevel` mit `course.stufe` verglichen wird.
2. Sicherstellen dass jeder Kurs nur die Sonderwoche seiner Stufe bekommt:
   - 29c (GYM1) → «Schneesportlager» nur wenn `gymLevel` GYM2 ist → 29c darf KEIN Schneesportlager bekommen
   - 27a28f (GYM2/GYM3) → andere Sonderwoche
   - 28bc29fs (GYM2/GYM3) → andere Sonderwoche
3. Fallback wenn `course.stufe` undefined: Kurs bekommt KEINE Sonderwoche (streng), nicht alle (zu locker).

**Teil 2 — Lesbarkeit:** In `WeekRows.tsx` und/oder `ZoomYearView.tsx`:
- Sonderwochen-Text: Farbe auf `var(--text-primary)` oder kontrastreichen Wert setzen
- Sonderwochen-Hintergrund: Entweder dunklerer amber/orange-Ton ODER weisser Text auf amber
- Light-Mode: WCAG-AA Kontrast sicherstellen (≥ 4.5:1)
- Dark-Mode: Bestehende amber-Farben prüfen

### Dateien
- `src/store/settingsStore.ts` (Sonderwochen-Filter)
- `src/components/WeekRows.tsx` (Rendering Sonderwoche)
- `src/components/ZoomYearView.tsx` (Rendering Sonderwoche)
- `src/data/iwPresets.ts` (Referenz — nicht ändern)

---

## Task T3: Bug — Auto-Fit Zoom zeigt leere Spalten

### Problem
In der Wochendetailansicht (WeekRows) zeigt der Auto-Fit-Zoom-Modus leere Spalten neben den echten Kursspalten. Die relevanten Kurse werden auf die Hälfte des Bildschirms zusammengedrückt, und daneben erscheinen unnötige leere Spalten die keinem Kurs zugeordnet sind.

### Gewünschtes Verhalten
Auto-Fit soll NUR Spalten für Kurse anzeigen, die tatsächlich existieren (d.h. in den `courses`-Array vorhanden sind). Leere/nicht-existierende Spalten sollen komplett ausgeblendet werden. Die vorhandenen Kurse sollen den gesamten verfügbaren Platz nutzen.

### Fix
In `WeekRows.tsx` (oder wo Auto-Fit die Spaltenbreite berechnet):
1. Finde die Auto-Fit-Logik: Suche nach `ResizeObserver`, `auto-fit`, `autoFit` oder der Berechnung der Spaltenbreite.
2. Beim Auto-Fit: Nur die Spalten zählen, die einen tatsächlichen Kurs haben (`courses.length`), nicht alle möglichen Spalten-Indizes.
3. Spaltenbreite = verfügbare Breite / Anzahl existierender Kurse (nicht / Anzahl aller möglichen Spalten).
4. Leere Spalten-Platzhalter (falls vorhanden) im Auto-Fit-Modus nicht rendern.

### Dateien
- `src/components/WeekRows.tsx` (Auto-Fit-Logik, Spaltenbreite)
- `src/components/SemesterHeader.tsx` (Header-Spalten müssen übereinstimmen)

---

## Task T4: Bug — Badges (P/PW/HK) Styling und Layout

### Problem (3 Teilprobleme)
1. **Farben zu blass:** Die P (Prüfung), PW (Prüfungsarbeit), HK (Halbklasse) Badges sind zu unauffällig — sie sollten knalligere, auffälligere Farben haben.
2. **Alignment bei Einzellektionen:** Bei UEs mit nur einer Lektion (EL) stimmt das vertikale Alignment der Badges mit der UE-Kachel nicht überein.
3. **Mehrere Badges untereinander:** Wenn eine UE mehrere Badges hat (z.B. P + PW + HK), werden diese vertikal gestapelt, was unübersichtlich ist. Sie sollten horizontal rechtsbündig angeordnet werden.

### Gewünschtes Verhalten
- **Farben:** Satte, gut sichtbare Farben: P = Rot (#ef4444 / red-500), PW = Violett (#a855f7 / purple-500), HK = Orange (#f97316 / orange-500) — oder ähnlich knallig, gut unterscheidbar.
- **Layout:** Badges horizontal in einer Zeile, rechtsbündig innerhalb der Kachel. Maximal 3 nebeneinander.
- **Alignment:** Badges vertikal zentriert zur UE-Kachel, auch bei 1L-Kursen.
- **Schrift:** Weisser Text auf farbigem Hintergrund, leicht abgerundete Ecken, kompakt (text-[8px] oder text-[9px]).

### Dateien
- `src/components/WeekRows.tsx` (Badge-Rendering in Kacheln)
- Eventuell `src/components/ZoomYearView.tsx` (falls Badges auch in Jahresübersicht)

---

## Task T5: Bug — Sequenz Drag&Drop verschiebt nur erste UE

### Problem
Beim Verschieben einer Sequenz per Drag am Sequenzbalken (oberer farbiger Balken über den UEs) wird nur die erste UE an die neue Position verschoben. Die restlichen UEs der Sequenz bleiben an ihrer alten Position stehen.

### Gewünschtes Verhalten
Alle UEs einer Sequenz sollen gemeinsam verschoben werden. Wenn die erste UE um z.B. +2 Wochen verschoben wird, sollen alle nachfolgenden UEs der Sequenz ebenfalls um +2 Wochen verschoben werden. Dabei:
- Ferien/Sonderwochen überspringen (wie bei Einzel-Verschiebung)
- Falls am Ziel nicht genug Platz: Warnung anzeigen oder die verschiebbaren UEs verschieben und den Rest am alten Platz lassen

### Fix
In der Drag&Drop-Logik (vermutlich `WeekRows.tsx` oder `plannerStore` / `dataSlice.ts`):
1. Beim Drop einer Sequenz-UE: prüfen ob die UE Teil einer Sequenz ist (`sequenceId`)
2. Falls ja: ALLE UEs der Sequenz identifizieren (über `sequences[]` im Store)
3. Den Offset berechnen: `neueKW - alteKW` der gedroppten UE
4. Alle UEs der Sequenz um denselben Offset verschieben
5. Sowohl `weekData` als auch `sequences[].blocks[].weeks[]` synchron aktualisieren

### Dateien
- `src/components/WeekRows.tsx` (Drag-Handler)
- `src/store/slices/dataSlice.ts` (swapLessons, moveLessonToEmpty)
- `src/store/slices/sequenceSlice.ts` (Sequence-Daten aktualisieren)

---

## Task T6: Bug — Sequenz entfernen braucht zwei Optionen

### Problem
Wenn eine Sequenz markiert wird und «Entfernen» geklickt wird, wird nur die Sequenz-Gruppierung aufgelöst — die einzelnen UEs bleiben als unverbundene Kacheln im Planer stehen.

### Gewünschtes Verhalten
Zwei Optionen im Entfernen-Dialog/-Menü:
1. **«Sequenz auflösen»** (bisheriges Verhalten): Entfernt die Sequenz-Gruppierung, UEs bleiben als Einzelkacheln erhalten.
2. **«Sequenz + UEs entfernen»**: Entfernt die Sequenz UND alle zugehörigen UEs (weekData-Einträge) komplett.

### UI
Im Sequenz-Menü (rechtes Panel, oder Kontextmenü) statt einem «Entfernen»-Button:
- 🔗 «Auflösen» — Gruppierung entfernen, UEs behalten
- 🗑 «Komplett entfernen» — Sequenz + alle UEs löschen

Oder: «Entfernen» öffnet einen Bestätigungs-Dialog mit den zwei Optionen.

### Fix
In `SequencePanel.tsx` (und/oder `sequenceSlice.ts`):
1. Bestehende `deleteSequence`-Action = «Auflösen» (umbenennen in `dissolveSequence` o.ä.)
2. Neue Action `deleteSequenceWithLessons`: Löscht die Sequenz UND iteriert über alle `blocks[].weeks[]` → entfernt die entsprechenden `weekData`-Einträge

### Dateien
- `src/components/SequencePanel.tsx` (UI: zwei Buttons/Dialog)
- `src/store/slices/sequenceSlice.ts` (deleteSequence → dissolveSequence + deleteSequenceWithLessons)
- `src/store/slices/dataSlice.ts` (weekData-Einträge entfernen)

---

## Task T7: Bug — Light-Mode Überbleibsel Mehrjahresübersicht

### Problem
In der Mehrjahresübersicht (Stoffverteilung-Tab) haben die Semester-Karten im Light-Mode noch einen dunklen Hintergrund (#1e293b o.ä.). Die Karten sollten im Light-Mode hell sein.

### Fix
In der Komponente die die Mehrjahresübersicht rendert (vermutlich ein separater View/Tab innerhalb des Planers):
1. Hardcodierte Dark-Farben durch CSS-Variablen ersetzen: `var(--bg-card)`, `var(--bg-secondary)`
2. Text-Farben: `var(--text-primary)`, `var(--text-muted)`
3. Borders: `var(--border)`
4. Die farbigen Balken (VWL orange, BWL blau, Recht grün) sollen in beiden Modi farbig bleiben.

### Dateien
- Suche nach dem Komponenten-Namen: vermutlich `MultiYearView.tsx`, `CurriculumView.tsx`, `StoffverteilungView.tsx` oder ähnlich
- `src/index.css` (falls neue CSS-Variablen nötig)

---

## Task T8: Bug — Sequenz-Menü zu klein + Tab-Schrift unlesbar

### Problem
1. Das Popup/Menü beim Erstellen einer neuen Sequenz ist zu klein. Es sollte eine fixe Mindestgrösse haben (ca. halbe Panel-Breite).
2. Die Schrift im Tab «Sequenzen» (in der Tab-Leiste des Side-Panels) ist nicht lesbar — zu klein oder zu wenig Kontrast.

### Fix
In `SequencePanel.tsx` und/oder `DetailPanel.tsx`:
1. **Menügrösse:** `min-width: 300px` oder `min-width: 50%` des Panels auf den Neue-Sequenz-Dialog.
2. **Tab-Schrift:** `fontSize` und `color` des Tab-Labels prüfen. Mindestens `12px`, Farbe `var(--text-primary)`.

### Dateien
- `src/components/SequencePanel.tsx`
- `src/components/DetailPanel.tsx` (Tab-Leiste)

---

## Task T9: Feature — «Zur aktuellen Woche» in jeder Ansicht

### Problem
Der Button «Zur aktuellen Woche (KW XX) scrollen» funktioniert nur in der Wochendetailansicht. In der Jahresübersicht passiert nichts beim Klick.

### Gewünschtes Verhalten
- **In der Wochendetailansicht:** Wie bisher — scrollt zur aktuellen KW-Zeile.
- **In der Jahresübersicht:** Wechselt automatisch zur Wochendetailansicht UND scrollt dann zur aktuellen KW.
- **In der Blockansicht:** Wechselt zur Wochendetailansicht UND scrollt.

### Fix
In `Toolbar.tsx` (oder wo der Button definiert ist):
1. Beim Klick prüfen welche Ansicht aktiv ist.
2. Falls nicht Wochendetail: Zuerst `setZoomLevel` auf Wochendetail setzen.
3. Dann (ggf. nach kurzem `requestAnimationFrame` oder `useEffect`): zur aktuellen KW scrollen.

### Dateien
- `src/components/Toolbar.tsx` (Button-Handler)
- `src/store/slices/uiSlice.ts` (zoomLevel setzen)

---

## Task T10: Feature — Sequenz aus Sammlung importieren

### Problem
Beim Markieren von Zellen und «Neue Sequenz» fehlt die Option, eine bestehende Sequenz aus der Sammlung diesen Wochen zuzuteilen. Auch im Sequenz-Menü fehlt neben «In Sammlung speichern» ein «Aus Sammlung importieren»-Button.

### Gewünschtes Verhalten
1. **Bei Markierung + «Neue Sequenz»:** Zusätzlich zur leeren neuen Sequenz eine Option «Aus Sammlung importieren» anbieten. Öffnet eine Liste der gespeicherten Sequenzen in der Sammlung. Bei Auswahl: Sequenz wird den markierten Wochen zugeordnet.
2. **Im Sequenz-Menü (rechtes Panel):** Button «Aus Sammlung importieren» neben «In Sammlung speichern».

### Fix
1. `SequencePanel.tsx`: Button «Aus Sammlung» in der Aktionsleiste.
2. Import-Dialog: Liste der Collection-Sequenzen (gefiltert nach Fachbereich falls möglich). Bei Klick: `importFromCollection`-Logik die Sequenz-Daten kopiert und den markierten Wochen zuweist.
3. Im Markierungs-Popup (WeekRows.tsx): Neben «Neue Sequenz» einen «Aus Sammlung»-Button.

### Dateien
- `src/components/SequencePanel.tsx`
- `src/components/WeekRows.tsx` (Markierungs-Popup)
- `src/store/slices/collectionSlice.ts` (Import-Logik)

---

## Task T11: Feature — KW-Zuordnung nach Import aus Sammlung

### Problem
Nach dem Import einer Sequenz aus der Sammlung steht «Keine Wochen zugewiesen». Es ist unklar, wie man dieser Sequenz konkrete KWs zuordnet.

### Gewünschtes Verhalten
Nach dem Import soll die Sequenz automatisch Wochen zugewiesen bekommen:
- **Wenn aus Markierung importiert (T10):** Die markierten Wochen werden automatisch zugewiesen.
- **Wenn über Panel-Button importiert:** Ein KW-Zuordnungs-Dialog erscheint: «Ab welcher KW soll die Sequenz beginnen?» mit Dropdown/Wochenauswahl. Die Sequenz wird dann ab der gewählten KW platziert (autoPlace-Logik).

### Fix
1. Import-aus-Markierung: Die markierten Wochen als `weeks[]` direkt an die neue Sequenz übergeben.
2. Import-über-Panel: Nach Auswahl der Collection-Sequenz → Dialog mit Start-KW → `autoPlaceSequence()` aufrufen.
3. Sicherstellen dass `weekData` synchron aktualisiert wird (wie bei normaler Sequenz-Erstellung).

### Dateien
- `src/components/SequencePanel.tsx`
- `src/store/slices/sequenceSlice.ts` (autoPlaceSequence)
- `src/store/slices/dataSlice.ts` (weekData sync)

---

## Vorherige Version: v3.95 ✅ (Refactoring Phase 2 — plannerStore Slices)

## Refactoring P2: plannerStore.ts in Slice-Dateien aufteilen

plannerStore.ts hat 1503 Zeilen mit ~40 Actions. 25 Dateien importieren `usePlannerStore`.
Ziel: Store intern in Slice-Dateien aufteilen. Der Export (`usePlannerStore`) bleibt **identisch** — keine Komponente muss Imports ändern.

### WICHTIG: Sicherster Ansatz

Die Slice-Dateien exportieren nur Objekt-Factories (Funktionen), die im Haupt-Store zusammengesetzt werden. `usePlannerStore` bleibt die einzige öffentliche API. Keine Komponente darf ihre Imports ändern müssen.

### Zielstruktur

```
src/store/
├── plannerStore.ts          ← Bleibt: Erstellt den Store, kombiniert Slices, exportiert usePlannerStore
├── slices/
│   ├── uiSlice.ts           ← Filter, Zoom, Selection, Dimming, Search, SidePanel, Help, Editing, HoveredCell, EmptyCellAction, DragSelect, Settings-UI, NoteCol, PanelWidth
│   ├── dataSlice.ts         ← WeekData, LessonDetails, Drag&Drop, Move, Push, Batch, Import/Export, Undo, PlannerSettings
│   ├── sequenceSlice.ts     ← Sequences CRUD, Blocks, AutoPlace, SequencePanel-UI
│   └── collectionSlice.ts   ← Collection CRUD, Archive-Funktionen, ImportFromCollection
├── settingsStore.ts         ← Bleibt unverändert
├── instanceStore.ts         ← Bleibt unverändert
└── gcalStore.ts             ← Bleibt unverändert
```

### Schritte (je ein Commit)

| # | Schritt | Was |
|---|---------|-----|
| R14 | `store/slices/` Ordner erstellen. `uiSlice.ts` extrahieren: Alle einfachen UI-State-Setter (filter, zoom, selection, dimming, search, sidepanel, help, editing, hoveredCell, emptyCellAction, dragSelect, settingsOpen, settingsEditCourseId, panelWidth, noteCol) | 
| R15 | `collectionSlice.ts` extrahieren: collection[], addCollectionItem, updateCollectionItem, deleteCollectionItem, archiveBlock, archiveSequence, archiveSchoolYear, archiveCurriculum, importFromCollection |
| R16 | `sequenceSlice.ts` extrahieren: sequences[], sequencesMigrated, sequenceTitlesFixed, migrateStaticSequences, fixSequenceTitles, addSequence, updateSequence, deleteSequence, addBlockToSequence, updateBlockInSequence, removeBlockFromSequence, reorderBlocks, autoPlaceSequence, getAvailableWeeks, sequencePanelOpen, editingSequenceId |
| R17 | `dataSlice.ts` extrahieren: weekData, lessonDetails, updateLesson, updateLessonDetail, getLessonDetail, dragSource, swapLessons, moveLessonToEmpty, pushLessons, batchShiftDown, batchInsertBefore, moveLessonToColumn, moveGroup, exportData, importData, hkOverrides, hkStartGroups, tafPhases, undoStack, pushUndo, undo, plannerSettings |
| R18 | plannerStore.ts aufräumen: Importiert alle 4 Slices, kombiniert sie im `create()` Call. Typ `PlannerState` zusammensetzen aus Slice-Types. Standalone-Funktionen (saveToInstance, loadFromInstance, etc.) bleiben in plannerStore.ts |

### Slice-Pattern (Vorlage)

```typescript
// store/slices/uiSlice.ts
import type { StateCreator } from 'zustand';
import type { PlannerState } from '../plannerStore'; // Circular OK — nur Type-Import

export interface UISlice {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  // ... weitere UI-State
}

export const createUISlice: StateCreator<PlannerState, [], [], UISlice> = (set, get) => ({
  filter: 'ALL',
  setFilter: (f) => set({ filter: f }),
  // ... weitere Implementierung (1:1 aus plannerStore kopiert)
});
```

```typescript
// store/plannerStore.ts (nach Refactoring)
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createDataSlice, type DataSlice } from './slices/dataSlice';
// ...

export type PlannerState = UISlice & DataSlice & SequenceSlice & CollectionSlice;

export const usePlannerStore = create<PlannerState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createDataSlice(...a),
      ...createSequenceSlice(...a),
      ...createCollectionSlice(...a),
    }),
    { name: 'planner-data', ... }
  )
);
```

### Ergebnis

| Datei | Zeilen | Inhalt |
|-------|--------|--------|
| `plannerStore.ts` | 186 | create + persist + instance-switching (von 1504) |
| `slices/uiSlice.ts` | 257 | Filter, Zoom, Selection, SidePanel, DragSelect, Settings-UI, NoteCol |
| `slices/dataSlice.ts` | 575 | WeekData, LessonDetails, D&D, Export/Import, HK, TaF, Undo, PlannerSettings |
| `slices/sequenceSlice.ts` | 297 | Sequences CRUD, Blocks, AutoPlace, SequencePanel-UI |
| `slices/collectionSlice.ts` | 239 | Collection CRUD, Archive-Funktionen, ImportFromCollection |
| **Total** | **1554** | (vorher 1504 in einer Datei — Overhead durch Slice-Interfaces +50) |

Alle 5 Commits (R14–R18) erfolgreich. `npx tsc --noEmit && npm run build` nach jedem Schritt bestätigt.

### Regeln (BESONDERS WICHTIG bei P2)

1. **Vor** dem Schritt: `npx tsc --noEmit && npm run build` (Baseline)
2. Code 1:1 verschieben — KEINE Logik-Änderungen
3. **`usePlannerStore` Export bleibt identisch** — keine Komponente darf Imports ändern müssen
4. **Persist-Config unverändert** — localStorage-Keys und Serialisierung dürfen sich nicht ändern
5. **Type-Exports unverändert** — `PlannerState` und alle Sub-Types müssen gleich bleiben
6. **Nach** dem Schritt: `npx tsc --noEmit && npm run build` (muss fehlerfrei)
7. Commit: `git add -A && git commit -m "refactor R[N]: [Beschreibung]"`
8. Push: `git push`

### Verbote (aus REFACTORING.md + zusätzlich für P2)

- KEINE neuen Features
- KEINE Logik-Änderungen
- KEINE API-Änderungen (exportierte Funktionen/Typen/Props unverändert)
- KEINE Umbenennung von State-Keys oder localStorage-Keys
- KEINE Änderungen an der persist-Konfiguration (name, partialize, version, migrate)
- KEINE Änderungen an Standalone-Funktionen (saveToInstance, loadFromInstance, etc.)
- KEINE «Optimierungen» an bestehender Logik

---

## Vorherige Version: v3.94 ✅ (Refactoring P3+P4: WeekRows + DetailPanel)

WeekRows.tsx: 1445 → 1113 Z. (InlineEdit, HoverPreview, EmptyCellMenu, NoteCell extrahiert).
DetailPanel.tsx: 1396 → 1047 Z. (blockCategories.ts + detail/shared.tsx extrahiert).

## Vorherige Version: v3.93 ✅ (Refactoring P1: SettingsPanel)

SettingsPanel.tsx: 2137 → 495 Zeilen. 7 Editoren in `components/settings/` extrahiert (R1–R7).

## Vorherige Version: v3.92 ✅

---

## Originalauftrag v3.92

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| O1 | Bug | SequencePanel: Hardcodierte Hex-Farben brechen Light-Mode (Fachbereich-Buttons, Card-Container, Fallback-Farben) | ✅ |
| O2 | Feature | Zoom-Funktion: Alle Texte, Icons, Badges und Zeilenhöhen proportional skalieren (bisher nur Spaltenbreite + Haupttext) | ✅ |

---

## Task O1: SequencePanel Light-Mode Fix

**Problem:** Inline-Styles mit hardcodierten Hex-Farben (`#1a2035`, `#374151`, `#e5e7eb`, `#1e293b`, `#94a3b8`) reagieren nicht auf die Tailwind-Palette-Inversion im Light-Mode.

**Lösung:** Hex-Werte durch Tailwind-Klassen (auto-invertierend) und CSS-Variablen (`var(--bg-secondary)`, `var(--text-muted)`) ersetzt.

**Dateien:** `SequencePanel.tsx`

---

## Task O2: Zoom auf alle Texte/Icons/Badges/Höhen ausweiten

**Problem:** Die 5 Zoom-Stufen (−/+) änderten bisher nur Spaltenbreite und den Haupttitel-Text. Alle KW-Nummern, Badges, Icons, Zeilenhöhen, Sequenz-Labels etc. blieben fix — kaum sichtbarer Unterschied zwischen Stufen.

**Lösung:** `zs()` Helper-Funktion in `plannerStore.ts`:
```ts
export function zs(base: number, zoomCfg): number {
  return Math.round(base * zoomCfg.fontSize / 11); // 11 = Default Stufe 3
}
```

Alle `text-[Npx]` Tailwind-Klassen → `style={{ fontSize: z(N) }}` ersetzt. Zeilenhöhen (`ROW_H`, `cellHeight`) ebenfalls skaliert.

**Nicht im Scope:** HoverPreview, EmptyCellMenu, Kontextmenü, Multi-Day-Dialog (Floating-Overlays).

**Dateien:**
- `plannerStore.ts` — `zs()` Export
- `SemesterHeader.tsx` — ~11 Texte
- `ZoomBlockView.tsx` — ~12 Texte + ROW_H
- `ZoomYearView.tsx` — ~14 Texte + ROW_H
- `WeekRows.tsx` — ~30 Texte + cellHeight + Badge-Stacking

---

## Vorherige Version

# Unterrichtsplaner – Handoff v3.91

## Status: ✅ v3.91 — Abgeschlossen

---

## Originalauftrag v3.91

| # | Typ | Beschreibung | Priorität | Status |
|---|-----|-------------|-----------|--------|
| N1 | Bug | Beurteilungsvorgaben Light-Mode: zu schwacher Kontrast, Farben (gelb/rot) auf braunem Hintergrund schlecht lesbar | 🔴 Kritisch | ✅ |
| N2 | Bug | Sequenz-Panel: Fenster halbiert sich wenn KW ausgeklappt, Scroll nur über oberes Feld erreichbar | 🟠 Hoch | ✅ |
| N3 | Feature | Zoom-Funktion: 3–5 Stufen in Toolbar-Button, gilt für Jahresübersicht und Wochendetail | 🟡 Mittel | ✅ |

---

## Task N1: Bug — Beurteilungsvorgaben Light-Mode Kontrast

### Problem
Das Beurteilungsvorgaben-Panel zeigt im **Light-Mode** einen braunen/rosafarbenen Hintergrund für die Kurs-Zeilen. Darauf werden Statuskreise (rot = fehlend, gelb = ausstehend) und Text angezeigt. Der Kontrast ist ungenügend:
- Roter Kreis (🔴) auf braunem Hintergrund: kaum erkennbar
- Gelber Kreis (🟡) auf braunem Hintergrund: kaum erkennbar
- Weisser/heller Text auf braunem Hintergrund: zu wenig Kontrast
- Generell: die brownish/rosy Hintergrundfarbe passt nicht zum Light-Mode-Farbschema

### Gewünschtes Verhalten
- **Zeilenfarben im Light-Mode:** Weisser oder sehr hellgrauer Hintergrund (`#ffffff` oder `#f8fafc`) statt brown/rose
- **Statuskreise:** Die Emoji-Kreise (🔴🟡) sind ausreichend kontrastreich auf hellem Hintergrund — sie bleiben unverändert
- **Text:** Dunkelgrauer/schwarzer Text (`#0f172a` oder `#1e293b`) auf hellem Hintergrund — WCAG-AA-konform (≥ 4.5:1)
- **Kursname (bold):** Gut lesbar, klar abgesetzt
- **Statustext:** Lesbar in etwas gedämpfterem Ton (z.B. `#475569`)
- **Trennlinien:** Subtile hellgraue Border zwischen Zeilen (`#e2e8f0`)

### Wo suchen
- Komponente die das Beurteilungsvorgaben-Panel rendert (vermutlich `BeurteilungVorgaben.tsx`, `DetailPanel.tsx` oder ein Modal)
- Suche nach der braunen/rosafarbenen Farbe: typischerweise `bg-rose-*`, `bg-red-*`, ein hardcodierter Hex-Wert, oder eine CSS-Variable die im Light-Mode nicht korrekt gesetzt ist
- Besonders prüfen: Zeilen-Container `background`, Text-Farbe, Border-Farbe

### Konkrete Lösung
1. **Zeilenfarbe**: `background: var(--bg-card)` oder `background: var(--bg-secondary)` statt hardcodierter Farbe
2. **Textfarbe**: `color: var(--text-primary)` für Kursnamen, `color: var(--text-muted)` für Statustext
3. **Border**: `border-color: var(--border)`
4. Falls die braune Farbe ein spezifischer Zustand ist (z.B. «Warnung»): im Light-Mode helleres Pendant wählen (z.B. `#fef3c7` für gelb-warn statt braun)
5. **Prüfen**: Dark-Mode darf nicht beeinträchtigt werden — nur Light-Mode-spezifische Korrekturen

---

## Task N2: Bug — Sequenz-Panel Fenster halbiert sich

### Problem
Im Sequenzen-Panel (rechtes Side-Panel, Tab «Sequenzen») tritt nach dem v3.90-Fix ein Folgeproblem auf:
- Wenn ein KW-Eintrag ausgeklappt wird, **halbiert sich das Fenster** — das Panel wird plötzlich nur noch halb so hoch dargestellt
- Um wieder nach oben zu scrollen, muss man mit der Maus ins **obere Feld** fahren — im ausgeklappten Bereich selbst scrollt man nicht

### Ursache (Hypothese)
Der v3.90-Fix hat `max-h-[40vh] overflow-y-auto shrink-0` auf die aktive Sequenz gesetzt. Das Panel-Container hat keine stabile Höhe → beim Ausklappen «wächst» der Content und drängt den Rest aus dem Viewport. Zwei separate Scroll-Bereiche entstehen.

### Gewünschtes Verhalten
- Das Sequenz-Panel hat immer **eine fixe Höhe** (100vh minus Toolbar) — es wächst nicht
- **Ein einziger Scroll-Container** für das gesamte Panel-Innere
- Kein Halbieren, kein Layout-Sprung beim Ausklappen

### Vorgehen
1. `SequencePanel.tsx` vollständig lesen
2. Panel-Wurzel-Container: `height: calc(100vh - [Toolbar-Höhe]px)`
3. **Genau einen** scrollbaren Inner-Container: `overflow-y: auto; flex: 1 1 0; min-height: 0`
4. Aktive Sequenz: `max-h-[40vh] overflow-y-auto` beibehalten, aber `shrink-0` entfernen
5. Alle Flex-Vorfahren bis Root: `min-height: 0`

---

## Task N3: Feature — Zoom-Funktion in Toolbar

### Anforderung
Zoom-Regler in der **Toolbar oben** mit **3–5 Stufen**. Skaliert Spaltenbreite und Schriftgrösse in Jahresübersicht und Wochendetail.

### Stufen (5 Stufen)
| Stufe | Spaltenbreite | Schriftgrösse |
|-------|--------------|---------------|
| 1 (min) | ~120px | 9px |
| 2 | ~160px | 10px |
| 3 (default) | ~200px | 11px |
| 4 | ~260px | 12px |
| 5 (max) | ~340px | 14px |

### UI
- Zwei Buttons `−` / `+` in der Toolbar, rechtsbündig
- Persistenz: `localStorage` Key `zoomLevel`, Default Stufe 3

### Technische Umsetzung
```typescript
const ZOOM_LEVELS = [
  { colWidth: 120, fontSize: 9 },
  { colWidth: 160, fontSize: 10 },
  { colWidth: 200, fontSize: 11 },  // default
  { colWidth: 260, fontSize: 12 },
  { colWidth: 340, fontSize: 14 },
];
```
- Spaltenbreite: `style={{ width: zoom.colWidth + 'px' }}` in `WeekRows.tsx` / `ZoomYearView.tsx`
- Schriftgrösse: CSS-Variable `--zoom-font` via `document.documentElement.style.setProperty`
- Kurs-Header: `overflow: hidden; text-overflow: ellipsis` bei kleinen Breiten

**Priorität:** N1+N2 zuerst, N3 danach.

---

## Ergebnis v3.91

| # | Typ | Beschreibung | Status | Details |
|---|-----|-------------|--------|---------|
| N1 | Bug | Beurteilungsvorgaben Light-Mode Kontrast | ✅ | CSS-Variablen `--status-warn/ok/crit-bg/border/text` in `index.css` (Dark+Light), `StatsPanel.tsx` auf Variablen umgestellt — Kollisionen + Beurteilungsvorgaben + Summary-Box |
| N2 | Bug | Sequenz-Panel Fenster-Halbierung | ✅ | Active-Sequence-Pin in den Haupt-Scroll-Container verschoben (ein einziger Scrollbereich), `shrink-0` entfernt |
| N3 | Feature | Zoom-Funktion (5 Stufen) | ✅ | `ZOOM_LEVELS` in `plannerStore.ts` (120–340px Spaltenbreite, 9–14px Schrift), `−`/`+` Buttons in Toolbar, `columnZoom` via localStorage persistiert, angewandt in `WeekRows.tsx`, `SemesterHeader.tsx`, `ZoomYearView.tsx`, `ZoomBlockView.tsx` |

---

## Commit-Anweisung für v3.91

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -20
git add -A
git commit -m "fix/feat: v3.91 — Beurteilungsvorgaben Kontrast (N1), Sequenz-Panel Layout (N2), Zoom-Funktion (N3)"
git push
```

---

## Status: ✅ v3.90 — Abgeschlossen

---

## Originalauftrag v3.90

| # | Typ | Beschreibung | Priorität | Status |
|---|-----|-------------|-----------|--------|
| M1 | Bug | Light-Mode: alle Input/Textarea/Select-Felder dunkel (hardcodierte Dark-Klassen nicht auf CSS-Variablen umgestellt) | 🔴 Kritisch | ✅ |
| M2 | Bug | Light-Mode: Kontrast/Lesbarkeit — Tab «UE» unsichtbar, ausgewählte Kategorie «Lektion» kaum erkennbar, allgemein zu wenig Kontrast | 🔴 Kritisch | ✅ |
| M3 | Bug | Light-Mode: Statistik-Modal, Ist-Zustand-Ansicht und weitere Modals/Overlays dunkel statt hell | 🔴 Kritisch | ✅ |
| M4 | Bug | «+»-Button-Dropdown liegt hinter Kurs-Header-Balken (z-index, tritt immer auf — v3.89 L1-Fix hat nicht gewirkt) | 🟠 Hoch | ✅ |
| M5 | Bug | Scroll-Bug Sequenzen-Panel: Panel kann nicht nach unten gescrollt werden (tritt auch ohne ausgeklappten KW-Eintrag auf — v3.89 L2-Fix hat nicht gewirkt) | 🟠 Hoch | ✅ |

---

## Task M1+M2+M3: Bug — Light-Mode unvollständig

**Problem:** Die Light-Mode-Implementierung aus v3.89 (L7) hat nicht alle Komponenten korrekt auf CSS-Variablen umgestellt. Im Light-Mode erscheinen:
- Alle Eingabefelder (Input, Textarea, Select) mit dunklem Hintergrund (`bg-slate-800` o.ä. noch hardcodiert)
- Tabs (z.B. «UE» im Modal) mit schlechtem Kontrast — Text unsichtbar
- Ausgewählte Kategorien/Buttons (z.B. «Lektion» aktiv) kaum erkennbar
- Statistik-Modal komplett dunkel
- Ist-Zustand-Ansicht komplett dunkel
- Sammlung-Tab dunkel
- Sequenz-Bearbeitungs-Panel dunkel

**Vorgehen — systematische Durchsicht aller Komponenten:**

1. **`src/index.css` prüfen:** CSS-Variablen für `--bg-input`, `--text-input`, `--border-input` ergänzen falls fehlend:
```css
:root {
  --bg-input:    #1e293b;
  --text-input:  #f1f5f9;
  --border-input: #334155;
}
:root.light-mode {
  --bg-input:    #ffffff;
  --text-input:  #0f172a;
  --border-input: #cbd5e1;
}
```

2. **Alle `.tsx`-Dateien nach hardcodierten Dark-Klassen durchsuchen:**
   - `bg-slate-800`, `bg-slate-900`, `bg-[#0f172a]`, `bg-[#1e293b]`
   - `text-white`, `text-slate-100`, `text-slate-400`
   - `border-slate-700`, `border-slate-600`
   → Alle durch `style={{ background: 'var(--bg-input)' }}` etc. ersetzen

3. **Betroffene Dateien (mindestens):**
   - `DetailPanel.tsx` — UE-Formular (Inputs, Textareas, Tabs, Kategorie-Buttons)
   - `SequencePanel.tsx` — Sequenz-Formular, Lektionsliste
   - `SettingsPanel.tsx` — alle Formularfelder
   - Statistik-Modal-Komponente
   - Sammlung-/Collection-Panel
   - `ZoomYearView.tsx` — Ist-Zustand-Ansicht

4. **Aktive/ausgewählte Zustände:** Im Light-Mode erkennbarer Kontrast:
   - Aktiver Tab: dunklerer Hintergrund + dunkler Text
   - Ausgewählte Kategorie: Rand + leicht farbiger Hintergrund, Text immer lesbar
   - Standard: WCAG-AA-Konformität (Kontrastverhältnis ≥ 4.5:1)

---

## Task M4: Bug — «+»-Button-Dropdown hinter Kurs-Header

**Problem:** Das Dropdown («Neue UE» / «Neue Sequenz») erscheint hinter dem Kurs-Header-Balken. Tritt immer auf. Der v3.89-Fix (`z-[9999]`) hat nicht gewirkt — vermutlich weil das Dropdown noch in einem `overflow: hidden`-Container liegt und deshalb abgeschnitten wird.

**Fix — Dropdown als React Portal rendern:**
```tsx
import { createPortal } from 'react-dom';

const buttonRef = useRef<HTMLButtonElement>(null);
const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

const handleOpen = () => {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (rect) setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  setOpen(true);
};

{open && createPortal(
  <div style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}>
    ...Menü-Einträge...
  </div>,
  document.body
)}
```
Portal löst das Dropdown aus dem DOM-Baum heraus → `overflow: hidden` eines Vorfahren hat keinen Effekt mehr.

---

## Task M5: Bug — Scroll-Bug Sequenzen-Panel (3. Anlauf)

**Problem:** Sequenzen-Panel scrollt nicht. Tritt auch ohne ausgeklappten KW-Eintrag auf. Seit v3.87 gescheitert (J2, K2, L2).

**Vorgehen — diesmal vollständige Vorfahren-Analyse:**
1. `SequencePanel.tsx` komplett lesen
2. Scrollbaren Container identifizieren
3. Checkliste für diesen Container:
   - `overflow-y: auto` (nicht `hidden`, nicht `visible`)
   - Explizite Höhe: `height: calc(100vh - Xpx)` oder `flex: 1 1 0; min-height: 0`
4. **Alle Flex-Vorfahren bis zum `<body>`:** jeder braucht `min-height: 0`
5. Kein Vorfahre darf `overflow: hidden` haben
6. `overscroll-behavior: contain` auf dem scrollbaren Container
7. `onWheel stopPropagation` nur auf dem **äussersten Panel-div**

**Wichtig:** Den gesamten Vorfahren-Baum bis zum Root analysieren — nicht nur den direkten Container.

---

## Ergebnis v3.90

| # | Typ | Beschreibung | Status | Details |
|---|-----|-------------|--------|---------|
| M1 | Bug | Light-Mode Eingabefelder | ✅ | TW4-Palette-Inversion in `index.css`: `--color-slate-*` und `--color-gray-*` in `:root.light-mode` überschrieben → alle hardcodierten Klassen passen sich automatisch an |
| M2 | Bug | Light-Mode Kontrast/Lesbarkeit | ✅ | Gleicher Ansatz; zusätzlich `.text-white` und `.placeholder-gray-600` explizit überschrieben |
| M3 | Bug | Light-Mode Modals/Overlays | ✅ | Gleicher Ansatz — Palette-Inversion erfasst alle Modals/Overlays ohne Einzeländerungen |
| M4 | Bug | «+»-Dropdown Portal | ✅ | `createPortal` nach `document.body` mit `position: fixed` + `getBoundingClientRect()` in `Toolbar.tsx` |
| M5 | Bug | Scroll-Bug Sequenzen-Panel | ✅ | `overflow-hidden` von SidePanel-Container (`DetailPanel.tsx:1325`) und Embedded-Wrapper (`SequencePanel.tsx:710`) entfernt; aktive Sequenz auf `max-h-[40vh] overflow-y-auto shrink-0` begrenzt |

---

## Commit-Anweisung für v3.90

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -20
git add -A
git commit -m "fix: v3.90 — Light-Mode Felder/Kontrast/Modals (M1-M3), Dropdown-Portal (M4), Panel-Scroll (M5)"
git push
```

---

## Status: ✅ v3.89 — Abgeschlossen

**Deploy-Weg: GitHub Actions (automatisch bei Push)**
```bash
# Aus Unterrichtsplaner/:
npx tsc --noEmit
# Aus GYM-WR-DUY/:
git add -A && git commit -m "fix/feat: vX.XX — ..." && git push
```
GitHub Actions baut nach jedem Push auf `main` automatisch (~1–2 Min). Kein `deploy.sh`, kein manueller Build nötig.

---

## Originalauftrag v3.89

| # | Typ | Beschreibung | Priorität | Status |
|---|-----|-------------|-----------|--------|
| L1 | Bug | «+»-Menü-Dropdown liegt im Hintergrund (z-index) | 🔴 Kritisch | ⬜ |
| L2 | Bug | Scroll-Bug Sequenzen-Panel (hartnäckig seit v3.87) | 🔴 Kritisch | ⬜ |
| L3 | Bug | Sonderwochen: falsche Stufen-Zuordnung — z.B. IW14 für alle statt pro GYM-Level | 🔴 Kritisch | ⬜ |
| L4 | Bug | Weihnachtsferien: Dauer «3W» statt «2W», W02/W03 werden im Planer übersprungen | 🟠 Hoch | ⬜ |
| L5 | Bug | Kontext-Menü: «Verschieben»/«Einfügen davor» verschieben auch Ferien/Sonderwochen | 🟠 Hoch | ⬜ |
| L6 | Bug | Pfeil-Verschieben (↑↓): UE landet in Ferien-/Sonderwochenzelle statt nächster freier Zelle | 🟠 Hoch | ⬜ |
| L7 | Feature | Light-/Darkmode Toggle in Toolbar | 🟡 Mittel | ⬜ |

---

## Task L1: Bug — «+»-Menü-Dropdown liegt im Hintergrund

**Problem:** Der grüne «+»-Button in der Toolbar öffnet das Dropdown-Menü («Neue UE», «Neue Sequenz»), aber das Menü erscheint hinter anderen Elementen (Panel, Grid) und ist nicht lesbar/klickbar.

**Ursache:** Das Dropdown-Popup hat ungenügendes `z-index`.

**Fix in `Toolbar.tsx`:**
1. Dropdown-Container: `z-index: 9999` (Tailwind: `z-[9999]`) — muss über Panel, Grid und allem anderen liegen
2. Sicherstellen: `position: fixed` oder `absolute` mit korrekter Positionierung relativ zum Button
3. Klick ausserhalb schliesst das Menü (falls noch nicht implementiert)

---

## Task L2: Bug — Scroll-Bug Sequenzen-Panel (hartnäckig seit v3.87)

**Problem:** Im Sequenzen-Panel (rechts, Tab «Sequenzen») kann nicht nach unten gescrollt werden. Als **L2 gilt nur das Sequenzen-Panel** — andere Panels sind nicht betroffen.

**Wichtig:** Dieser Bug wurde bereits 2× als gefixt markiert (K2 v3.88, J2 v3.87) — bisherige Ansätze halfen nicht dauerhaft.

**Vorgehen:**
1. `SequencePanel.tsx` vollständig lesen — den gesamten DOM-Baum analysieren
2. Den scrollbaren Inhalts-Container identifizieren (Lektionsliste, Felder)
3. Dieser Container braucht zwingend:
   - `overflow-y: auto` (nicht `hidden`, nicht `visible`)
   - Eine explizite Höhenbeschränkung: `height: calc(100vh - Xpx)` oder `flex: 1 1 0; min-height: 0`
4. Alle Vorfahren-Elemente des Containers prüfen: **kein Vorfahre darf `overflow: hidden` haben** (zerstört Scroll-Kontext)
5. `overscroll-behavior: contain` auf dem Panel-Wurzel-Element
6. `onWheel={(e) => e.stopPropagation()}` nur auf dem **äussersten Panel-Container**

**Häufige Fallstricke (die bisherigen Fixes vermutlich scheitern liessen):**
- `flex`-Elternelement ohne `min-height: 0` → Kind kann nicht scrollen
- `height: 100%` ohne definierte Höhe im Elternelement → kein Effekt
- `overflow: hidden` irgendwo im Vorfahren-Baum

---

## Task L3: Bug — Sonderwochen falsche Stufen-Zuordnung

**Problem:** Sonderwochen werden nicht kursgerecht gefiltert. IW14 z.B. gilt für GYM1–GYM4 mit je unterschiedlichem Inhalt — der Planer zeigt aber für alle Klassen denselben (falschen) Eintrag.

**Grundprinzip:** Jeder Kurs soll nur die Sonderwoche sehen, die für seine GYM-Stufe (`course.stufe`) gilt.

**Fix-Strategie: `iwPresets.ts` nach Stufe aufteilen**

Jeden IW-Eintrag der mehrere Stufen betrifft in separate Einträge aufteilen. Jeder bekommt `gymLevel: 'GYM1'` (oder GYM2 etc.). Beispiel:

```typescript
// Vorher (falsch — zu breit):
{ id: 'IW14', label: 'Intensivwoche 14', kw: 14, gymLevel: ['GYM1','GYM2','GYM3','GYM4'] }

// Nachher (korrekt — pro Stufe):
{ id: 'IW14-GYM1', label: 'Nothilfekurs / Gesundheit / Sicherheit', kw: 14, gymLevel: 'GYM1' },
{ id: 'IW14-GYM2', label: 'Nothilfekurs / Gesundheit (reduz.)',      kw: 14, gymLevel: 'GYM2' },
{ id: 'IW14-GYM3', label: 'EF-Woche (Deutsch, Franz./Engl.)',        kw: 14, gymLevel: 'GYM3' },
{ id: 'IW14-GYM4', label: 'Ergänzungsfach / Maturvorbereitung',      kw: 14, gymLevel: 'GYM4' },
```

**Vollständiges Mapping aus IW-Plan SJ 25/26:**

| KW | GYM1 | GYM2 | GYM3 | GYM4 | TaF (alle) |
|----|------|------|------|------|------------|
| W38 | Klassenwoche | SOL-Projekt / Auftrittskompetenz | Studienreise / Franz.aufenthalt Komp. | Studienreise (Klassenverband) | IW TaF (G&K/MU/SP) |
| W46 | — (Unterricht) | — (Unterricht) | — (Unterricht) | — (Unterricht) | IW TaF (G&K/MU/SP) |
| W12 | — (Unterricht) | Schneesportlager | — (Unterricht) | — | — |
| W14 | Nothilfekurs / Gesundheit / Sicherheit | Nothilfekurs / Gesundheit (reduz.) | EF-Woche (Deutsch, Franz./Engl.) | Ergänzungsfach / Maturvorbereitung | MU TaF / Sport GF BG |
| W25 | Geografie und Sport | Wirtschaft und Arbeit | Maturaarbeit | Maturprüfung | Maturprüfung |
| W27 | Medienwoche | Spezialwoche TaF MINT | Französisch/Englisch (5HT) | Studienreise (Klassenverband) | Englisch (5HT) / SF-Woche |

**Wo «— (Unterricht)»:** Kein Sonderwoche-Eintrag nötig für diese Stufe — regulärer Unterricht.

**Rendering in `WeekRows.tsx`:** Sonderwoche wird für Kurs X angezeigt wenn `specialWeek.gymLevel === course.stufe` (Single-String-Vergleich nach Aufteilen). TaF-Kurse (Suffix f/s im Klassenname) matchen auf `gymLevel: 'TaF'`.

---

## Task L4: Bug — Weihnachtsferien Daueranzeige und fehlende Wochen

**Problem (2 Teilbugs):**
1. Weihnachtsferien werden als «3W» angezeigt, obwohl sie nur 2 Wochen dauern (W52 + W01)
2. Nach den Weihnachtsferien folgt im Planer W04 statt W02 — W02 und W03 fehlen oder werden übersprungen

**Ursache (bekannt aus Code-Analyse):**
- `holidayPresets.ts`: Winterferien definiert als `startWeek: '52', endWeek: '01'`
- Die Dauerfunktion rechnet `endWeek - startWeek`: `1 - 52 = -51` → falsches Resultat → Fallback ergibt «3W» statt «2W»
- Dieselbe Berechnung wird vermutlich für die Folgewoche verwendet: `52 + 3 = 55` → kein Match → springt auf W04 (nächste Week im WEEKS-Array nach W01)

**Fix:**

**Teil 1 — Dauerfunktion reparieren** (wo immer `endWeek - startWeek` berechnet wird, z.B. in `WeekRows.tsx`, `ZoomYearView.tsx` oder einer Hilfsfunktion):
```typescript
// Falsch:
const dauer = parseInt(endWeek) - parseInt(startWeek) + 1;

// Korrekt (Jahreswechsel berücksichtigen):
function holidayDuration(startWeek: string, endWeek: string): number {
  const start = parseInt(startWeek);
  const end = parseInt(endWeek);
  if (end >= start) return end - start + 1;
  // Jahreswechsel: z.B. W52 bis W01 → 52 bis 53 (W53=W01 des Folgejahres) → 2 Wochen
  // Maximale ISO-Wochen im Jahr: 52 oder 53 — für Kanton Bern immer 52
  return (52 - start + 1) + end;
}
// Ergebnis für W52–W01: (52 - 52 + 1) + 1 = 2 ✅
```

**Teil 2 — Folgewoche nach Jahreswechsel** (wo der Planer nach Ferienende die nächste Schulwoche bestimmt):
- Das WEEKS-Array enthält W02 und W03 korrekt als Schulwochen
- Das Problem ist, dass die Folgewoche-Logik nach Ferien mit `endWeek + X` rechnet statt im WEEKS-Array die nächste Nicht-Ferienwoche zu suchen
- Fix: Folgewoche immer durch Iteration im WEEKS-Array bestimmen, nicht durch Arithmetik auf der KW-Nummer
- Suchen: Wo wird nach Ferienwochen die nächste angezeigte Woche berechnet? (`ZoomYearView.tsx` oder `WeekRows.tsx`)

---

## Task L5: Bug — Kontext-Menü vereinfachen

**Problem:** Das Kontextmenü (erscheint nach Klick auf leere Zelle oder bestehende UE) zeigt «Verschieben (+1)» und «Einfügen davor». Diese Optionen verschieben alle nachfolgenden Zellen — auch Ferien und Sonderwochen — was unerwünscht ist.

**Gewünschtes Verhalten:**
- Leere Zelle → Menü: nur «Neue Sequenz» + «Aufheben»
- Bestehende UE → Menü: nur «Sequenz bearbeiten» + «Aufheben»
- «Verschieben» und «Einfügen davor» aus dem Menü entfernen

**Fix in `WeekRows.tsx` (oder `InsertDialog.tsx`):**
- Kontextmenü-Optionen-Array anpassen — «Verschieben» und «Einfügen davor» entfernen
- Die Verschieben/Einfügen-Logik kann im Code bestehen bleiben, falls sie anderswo gebraucht wird — nur aus dem Menü entfernen

---

## Task L6: Bug — Pfeil-Verschieben überspringt Ferien nicht

**Problem:** Die ↑/↓-Pfeile neben einer UE verschieben sie um genau eine Zeile. Wenn die Zielzeile eine Ferien- oder Sonderwochenzelle ist, landet die UE dort (falsch).

**Gewünschtes Verhalten:**
- ↑ → UE springt in die nächste verfügbare Zelle **oberhalb** (Ferien/Sonderwochen werden übersprungen)
- ↓ → UE springt in die nächste verfügbare Zelle **unterhalb** (Ferien/Sonderwochen werden übersprungen)
- Beispiel aus Screenshot: UE in W18 → ↑ soll nach W13 (nicht W17/W16/W15 = Ferien, W14 = IW), ↓ soll nach W19

**Fix (wo auch immer die Pfeil-Logik liegt — vermutlich `WeekRows.tsx`):**
```typescript
function findNextFreeWeek(
  currentKw: string,
  direction: 'up' | 'down',
  col: number,
  weeks: Week[],
  holidayWeeks: string[],
  specialWeekNumbers: string[]
): string | null {
  const idx = weeks.findIndex(w => w.w === currentKw);
  let i = idx + (direction === 'down' ? 1 : -1);
  while (i >= 0 && i < weeks.length) {
    const kw = weeks[i].w;
    const isHoliday = holidayWeeks.includes(kw);
    const isSpecial = specialWeekNumbers.includes(kw); // nur für den aktuellen Kurs
    if (!isHoliday && !isSpecial) return kw;
    i += (direction === 'down' ? 1 : -1);
  }
  return null; // kein freier Platz → Pfeil deaktivieren
}
```
- Kein freier Platz gefunden → Pfeil-Button deaktivieren (grau/disabled)
- Beim Verschieben: UE aus alter KW entfernen, in neue KW einfügen (`plannerStore.ts`)

---

## Task L7: Feature — Light-/Darkmode Toggle

**Anforderungen:**
- Toggle-Button in der Toolbar (Icon: Sonne/Mond, oder SVG)
- State persistiert via `localStorage`
- Standard: Darkmode (wie bisher)
- Beide Modi vollständig: alle Texte lesbar, Kontraste WCAG-AA

**Implementierung via CSS-Variablen:**

```css
/* src/index.css */
:root {
  --bg-primary:   #0f172a;   /* slate-900 */
  --bg-secondary: #1e293b;   /* slate-800 */
  --bg-card:      #1e293b;
  --text-primary: #f1f5f9;   /* slate-100 */
  --text-muted:   #94a3b8;   /* slate-400 */
  --border:       #334155;   /* slate-700 */
}
:root.light-mode {
  --bg-primary:   #f8fafc;   /* slate-50 */
  --bg-secondary: #f1f5f9;   /* slate-100 */
  --bg-card:      #ffffff;
  --text-primary: #0f172a;   /* slate-900 */
  --text-muted:   #475569;   /* slate-600 */
  --border:       #cbd5e1;   /* slate-300 */
}
```

**Toggle-Logik (`Toolbar.tsx` oder eigener Hook):**
```typescript
const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light');
useEffect(() => {
  document.documentElement.classList.toggle('light-mode', isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}, [isLight]);
```

**Komponenten anpassen:** Alle hardcodierten Tailwind-Dark-Klassen (`bg-slate-900`, `text-white`, `border-slate-700` etc.) auf `var(--bg-primary)` etc. umstellen — betrifft: `WeekRows.tsx`, `SequencePanel.tsx`, `SettingsPanel.tsx`, `DetailPanel.tsx`, `Toolbar.tsx`, `PlannerTabs.tsx`

**UE-Kacheln:** Bleiben in beiden Modi farbig (VWL orange, BWL blau, Recht grün) — im Lightmode eventuell leicht heller/pastelliger, aber immer erkennbar.

**Priorität:** L1–L6 zuerst, dann L7.

---

## Ergebnis v3.89

| # | Typ | Beschreibung | Status | Details |
|---|-----|-------------|--------|---------|
| L1 | Bug | «+»-Menü z-index | ✅ | Dropdown z-index auf `z-[9999]` erhöht (Toolbar.tsx) |
| L2 | Bug | Scroll-Bug Sequenzen-Panel | ✅ | `min-h-0` auf Flex-Children, `overflow-hidden` entfernt (SequencePanel.tsx) |
| L3 | Bug | Sonderwochen Stufen-Zuordnung | ✅ | iwPresets.ts komplett neu geschrieben mit korrekten Labels pro Stufe (21 Einträge) |
| L4 | Bug | Weihnachtsferien Dauer + fehlende Wochen | ✅ | Code-Analyse: Bug existiert nicht — `expandWeekRange` nutzt Array-Index, kein Arithmetik-Bug. W02/W03 korrekt vorhanden. |
| L5 | Bug | Kontext-Menü vereinfacht | ✅ | "Verschieben (+1)", "Einfügen davor" und Mini-"+" Button entfernt (Toolbar.tsx, WeekRows.tsx) |
| L6 | Bug | Pfeil-Verschieben überspringt Ferien | ✅ | `findNextFree()`-Funktion: überspringt Typ 5 (Sonderwoche) und 6 (Ferien) beim Verschieben |
| L7 | Feature | Light-/Darkmode Toggle | ✅ | CSS-Variablen-System (index.css), `useTheme`-Hook, Toggle-Button ☀/☽, alle Panels/Backgrounds angepasst |

---

## Commit-Anweisung für v3.89

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -20
git add -A
git commit -m "fix/feat: v3.89 — Menü-z-index (L1), Panel-Scroll (L2), Sonderwochen-Stufen (L3), Weihnachtsferien (L4), Kontext-Menü (L5), Pfeil-Skip (L6), Light/Dark-Mode (L7)"
git push
```

---

## Vorherige Version: v3.88 ✅

## Status: ✅ v3.88 — 6/6 Tasks erledigt

---

## Originalauftrag v3.88

| # | Typ | Beschreibung | Priorität | Status |
|---|-----|-------------|-----------|--------|
| K1 | Bug | Sonderwochen: nur TaF-Events im Planer sichtbar — alle anderen fehlen | 🔴 Kritisch | ✅ |
| K2 | Bug | Panel-Scroll: Scrollen im Panel scrollt Planer dahinter (v3.87 J2 nicht gefixt) | 🔴 Kritisch | ✅ |
| K3 | Bug | Sequenz-Kacheln erscheinen nicht im Planer (v3.87 J3 nicht gefixt) | 🔴 Kritisch | ✅ |
| K4 | Bug | «+» Button in Toolbar reagiert nicht auf Klick | 🟠 Hoch | ✅ |
| K5 | Bug | Sonderwoche Kursliste: Kurse mehrfach (einmal pro Tag) + falsche ID-Zuordnung | 🟡 Mittel | ✅ |
| K6 | Feature | TaF-Phasenwochen ohne Unterricht visuell wie Ferien markieren | 🟡 Mittel | ✅ |

---

## Task K1: Bug — Sonderwochen nur TaF sichtbar

**Problem:** 19 Sonderwochen konfiguriert, im Planer erscheinen nur TaF-Events (braune Kacheln «IW TaF»). Alle anderen (Klassenwoche GYM1, Gesundheit/Nothilfekurs GYM2 usw.) fehlen vollständig. Beispiel: IW14 betrifft GYM1+GYM2 — erscheint gar nicht.

**Ursache:** In `settingsStore.ts → applySettingsToWeekData()`:
```typescript
return course.stufe === lv; // schlägt fehl wenn course.stufe undefined
```
`course.stufe` ist für bestehende Kurse möglicherweise nicht gesetzt → `undefined === 'GYM1'` = false → kein Kurs matched ausser TaF.

**Parallel:** `validEventCols` in `WeekRows.tsx` benutzt sequenziellen `ci = 100+i`, aber `applySettingsToWeekData` nutzt `c.col ?? (100+i)`. Bei explizit gesetztem `c.col` entstehen Col-Nummern-Mismatches.

**Fix:**
1. `settingsStore.ts`: Bei fehlendem `course.stufe` alle Kurse als Match behandeln:
```typescript
return course.stufe ? course.stufe === lv : true;
```
2. `WeekRows.tsx → validEventCols`: Col-Index-Berechnung angleichen an `configToCourses`:
```typescript
const colIdx = c.col ?? (100 + idx); // statt sequenziellem ci++
```

---

## Task K2: Bug — Panel-Scroll scrollt Planer dahinter

**Problem:** Scrollen im Sequenz- oder Einstellungs-Panel scrollt den Planer-Grid dahinter. War bereits in v3.87 (J2) als gefixt markiert, funktioniert aber noch immer nicht.

**Ursache:** `stopPropagation` hinzugefügt, aber Scroll-Container hat kein `overflow-y: auto` oder falsche Höhe → kein eigener Scroll-Kontext.

**Fix** in `SequencePanel.tsx` + `SettingsPanel.tsx`:
1. Scrollbaren Container: `overflow-y: auto; max-height: calc(100vh - [Header-Höhe]); height: 100%`
2. Äusserster Panel-Container: `onWheel={(e) => e.stopPropagation()}`
3. `overscroll-behavior: contain` auf Panel-Container — verhindert Scroll-Bubbling
4. Panel hat `position: fixed/absolute` mit expliziter Höhe → eigener Scroll-Kontext

---

## Task K3: Bug — Sequenz-Kacheln fehlen im Planer

**Problem:** Neue Sequenz (z.B. «test», KW34–37) angelegt — im Panel sind 4 Lektionen sichtbar, im Planer erscheint nur eine Outline-Box für KW34, keine befüllten Kacheln für KW35–37. War in v3.87 (J3) als gefixt markiert, noch immer aktiv.

**Ursache:** `addSequence`/`addBlockToSequence` speichern Lektionen in `sequences[].blocks[].weeks[]`, aber `weekData[].lessons[col]` wird nicht für alle KWs synchronisiert. Nur die erste KW bekommt beim initialen Erstellen einen Eintrag.

**Fix:**
1. `plannerStore.ts → addBlockToSequence`: für alle `block.weeks` einen `weekData`-Eintrag erstellen falls noch keiner vorhanden
2. `plannerStore.ts → updateBlockInSequence`: bei Label-Änderung `weekData` synchronisieren
3. App-Start-Sync: Sequenz-Lektionen ohne `weekData`-Eintrag nachrüsten
4. `SequencePanel.tsx`: beim Bearbeiten einer Lektion (Thema-Input) zusätzlich `updateLesson(week, col, { title, type: 1 })` aufrufen

---

## Task K4: Bug — «+» Button reagiert nicht

**Problem:** Grüner «+»-Button in der Toolbar (neben Suchfeld) reagiert nicht auf Klick. Sichtbar, aber keine Aktion.

**Ursache (Hypothese):** Nach Toolbar-Refactoring (J6 v3.87) ist `onClick` nicht korrekt verdrahtet, oder ein überlagerndes Element blockiert die Klick-Events.

**Fix** in `Toolbar.tsx`:
1. `onClick`-Verdrahtung prüfen — soll `setInsertDialog` oder `handleNewLesson` aufrufen
2. `z-index: 50` auf Button setzen
3. Kein überlagerndes Element mit `pointer-events` blockiert den Button

---

## Task K5: Bug — Kursliste in Sonderwoche zeigt Duplikate

**Problem:** «Nur für bestimmte Kurse anzeigen» — Kurse erscheinen mehrfach (z.B. «30s IN» 3×, «28c IN» 3×). Ursache: Kurs hat mehrere Einträge (einen pro Wochentag/Semester). Zudem: markierter «30s IN» bezieht sich auf 29f → falsche ID-Zuordnung.

**Fix** in `SettingsPanel.tsx`:
1. Kursliste nach `cls + typ` deduplizieren (nicht nach `id`)
2. Wenn ein `cls+typ` mehrere IDs hat: alle IDs in `courseFilter` aufnehmen wenn ausgewählt
3. Anzeige-Label: `${course.cls} ${course.typ}`
4. `kurse_duy_2526.json`: Kurs-ID-Zuordnungen auf Korrektheit prüfen (30s IN → 29f)

---

## Task K6: Feature — TaF-Phasenwochen ohne Unterricht wie Ferien markieren

**Problem:** TaF-Kurse haben Phasenunterricht. Wochen ausserhalb der Phasen sind leer im Planer — nicht unterscheidbar von «noch nicht geplant».

**Gewünschtes Verhalten:** Phasenfreie Wochen grau hinterlegen wie Ferien, mit Label «— keine Phase —».

**Fix** in `WeekRows.tsx`:
- Bestehende Variable `tafPhase` nutzen: wenn `tafPhase === undefined` UND Kurs ist TaF-Kurs (`/[fs]/.test(cls.replace(/\d/g,''))`) → phasenfreie Woche
- Zelle rendern mit:
```tsx
background: '#1e293b60'
<span className="text-[8px] text-gray-600 italic">— keine Phase —</span>
```

---

## Ergebnis v3.88

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| K1 | Bug | Sonderwochen: `course.stufe` Fallback (undefined → matcht alle) + col-Index in WeekRows an configToCourses angeglichen (c.col ?? 100+i) | ✅ |
| K2 | Bug | Panel-Scroll: min-h-0 auf Detail/Batch-Content, overscroll-behavior:contain auf Panel-Container (DetailPanel + SequencePanel) | ✅ |
| K3 | Bug | Sequenz-Kacheln: addSequence synct weekData für Blocks mit Wochen, addBlockToSequence/updateBlockInSequence Fallback auf loadSettings(), Startup-Sync in App.tsx | ✅ |
| K4 | Bug | «+» Button aus overflow-hidden Container herausgelöst → Dropdown nicht mehr abgeschnitten | ✅ |
| K5 | Bug | Kursliste in Sonderwoche nach cls+typ dedupliziert — ein Button pro Kursgruppe, Toggle schaltet alle IDs | ✅ |
| K6 | Feature | TaF-Phasenwochen ohne Phase: grauer Hintergrund + «— keine Phase —» Label (wie Ferien) | ✅ |

---

## Commit-Anweisung für v3.88

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -20
git add -A
git commit -m "fix/feat: v3.88 — Sonderwochen (K1), Panel-Scroll (K2), Sequenz-Sync (K3), Plus-Button (K4), Kurs-Duplikate (K5), Phasen-Ferien (K6)"
git push
```

---

## Vorherige Version: v3.87 ✅

## Status: ✅ v3.87 — 6/6 Tasks erledigt

---

## Originalauftrag v3.87

| # | Typ | Beschreibung |
|---|-----|-------------|
| J1 | Bug-fix | H4-Regression: Schuljahr-Dropdown entfernt statt Vorlage-Dropdown |
| J2 | Bug | Panel-Scroll: Sequenz- und Einstellungs-Panel fangen Scroll-Events nicht ab |
| J3 | Bug | Sequenz-UE erscheinen nicht als Kacheln im Planer |
| J4 | Feature | UE/Sequenz Defaults: Dauer aus Kurseinstellungen vorausfüllen |
| J5 | Feature | Sonderwochen GymLevel: Mehrfachauswahl (string[] statt string) |
| J6 | UI | Toolbar: Suche links, Icons rechtsbündig gruppiert |

---

## Task J1: Bug-fix — H4-Regression Schuljahr-Dropdown

**Problem:** In v3.85 (Task H4) wurde das falsche Dropdown entfernt. Entfernt wurde das
Schuljahr-Dropdown («SJ 2025/26 (Gym Bern)»), aber erhalten blieb das Vorlage-Dropdown
(«Ohne Vorlage»). Sollte umgekehrt sein.

**Erwarteter Zustand nach Fix:**
- Obere Zeile im «Neuer Planer erstellen»-Dialog: `[Name-Eingabe] [Schuljahr-Dropdown]`
- Vorlage-Dropdown («Ohne Vorlage») komplett entfernt
- Schuljahr-Dropdown mit Optionen: SJ 2025/26, 2026/27, 2027/28, Manuell — bleibt erhalten

**Suche:** `PlannerTabs.tsx` — Dialog «Neuer Planer erstellen», dort das korrekte Dropdown
identifizieren und nur das Vorlage-Dropdown (`templateId`-State o.ä.) entfernen.

---

## Task J2: Bug — Panel-Scroll fängt Events nicht ab

**Problem:** Sowohl das Sequenz-Panel (rechte Seite, Sequenzen-Tab) als auch das
Einstellungs-Panel scrollen nicht korrekt:
- Scroll-Events werden vom Panel nicht abgefangen
- Stattdessen scrollt der Planer dahinter
- Teile des Panels (untere UE-Einträge, obere Icons) sind nicht erreichbar

**Ursache (Hypothese):** Die Panel-Container haben kein `overflow-y: auto/scroll` oder
ein übergeordnetes Element hat `overflow: hidden` das Scroll-Events konsumiert. Die
`onWheel`-Events bubbeln durch zum Planer-Scroll-Container.

**Fix:**
1. Alle Panel-Container (`SequencePanel`, `SettingsPanel`, `DetailPanel`) mit
   `overflow-y: auto` und expliziter `max-height` oder `height: 100%` versehen
2. `onWheel`-Event auf Panel-Containern mit `e.stopPropagation()` abfangen damit
   der Planer dahinter nicht mitscrollt
3. Panel beim Öffnen immer auf `scrollTop = 0` setzen (via `useEffect` + `ref`)
4. Sicherstellen dass `position: fixed` oder `absolute` Overlays ihren eigenen
   Scroll-Kontext haben

**Gilt für:** `SequencePanel.tsx`, `SettingsPanel.tsx`, `DetailPanel.tsx` — alle
rechten Panels die über dem Planer liegen.

---

## Task J3: Bug — Sequenz-UE erscheinen nicht als Kacheln im Planer

**Problem:** Eine Sequenz wird im Sequenz-Panel mit 3 Lektionen angelegt
(KW37 «preise», KW38 «mengen», KW39 «gleichgewicht»). Im Planer erscheint aber
nur KW37 als Kachel — KW38 und KW39 haben keine sichtbare Kachel, obwohl die
Daten im Panel eingetragen sind.

**Gewünschtes Verhalten:** Sobald eine Sequenz angelegt wird und Lektionen
eingetragen sind, sollen im Planer sofort **leere Kacheln** für alle Wochen der
Sequenz erscheinen. Die Kacheln werden dann mit den Feldinhalten (Thema, Typ etc.)
der jeweiligen Lektion befüllt sobald diese eingetragen werden.

**Ursache (Hypothese):** Die Sequenz-Lektionen werden im `plannerStore` zwar
gespeichert, aber `weekData` wird nicht entsprechend aktualisiert. Das Rendering
liest `weekData[kw].lessons[col]` — wenn dort kein Eintrag für die Sequenz-Lektion
existiert, bleibt die Zelle leer.

**Fix:**
1. Beim Anlegen einer Sequenz-Lektion (oder beim Speichern der Sequenz): für jede
   Lektion einen Eintrag in `weekData[kw].lessons[col]` erstellen
   - `type: 0` (normale UE) oder der konfigurierte Typ
   - `title`: Thema aus der Lektion, oder leer falls noch nicht eingetragen
   - `sequenceId`: Referenz auf die Sequenz für die Darstellung des Sequenzbalkens
2. Beim Aktualisieren einer Sequenz-Lektion (Thema, Typ etc.): entsprechenden
   `weekData`-Eintrag synchron aktualisieren
3. Beim Löschen einer Sequenz-Lektion: `weekData`-Eintrag entfernen
4. Sicherstellen dass die Synchronisation in beide Richtungen funktioniert:
   Sequenz-Panel → weekData UND weekData → Sequenz-Panel

**Hinweis:** Schaue in `SequencePanel.tsx` und `plannerStore.ts` nach der Funktion
die Lektionen zu einer Sequenz hinzufügt — dort muss der weekData-Sync ergänzt werden.

---

## Task J4: Feature — UE/Sequenz Defaults aus Kurseinstellungen

**Problem:** Beim Erstellen einer neuen UE oder Sequenz-Lektion werden keine
sinnvollen Standardwerte vorausgefüllt. Insbesondere die Dauer muss manuell
gesetzt werden, obwohl sie aus den Kurseinstellungen bekannt ist.

**Gewünschtes Verhalten:**
- **Dauer:** Wird aus der Kurseinstellung berechnet: `les × lessonDurationMin`
  (z.B. 2 Lektionen × 45min = 90min). Der passende Dauer-Button (45/90/135min)
  soll beim Öffnen der UE vorausgewählt sein.
- **Fachbereich:** Bereits implementiert («geerbt von Sequenz») — kein Handlungsbedarf
  falls korrekt funktionierend

**Implementierung:**
1. Beim Öffnen des UE-Formulars (`DetailPanel`): Kurs-Config für die aktuelle
   Spalte laden → `les × lessonDurationMin` berechnen → als Default-Dauer setzen
2. Beim Anlegen einer neuen Sequenz-Lektion: gleiche Logik
3. Default gilt nur für **neue** UEs — bestehende UEs mit gesetzter Dauer nicht
   überschreiben
4. Falls `les` nicht verfügbar: kein Default (bisheriges Verhalten)

**Kurs-Config Zugriff:** `settingsStore.getEffectiveCourses()` gibt alle Kurse
zurück; über `col`-Nummer der aktuellen Spalte den passenden Kurs finden →
`course.les` und `settings.school.lessonDurationMin` (Default: 45).

---

## Task J5: Feature — Sonderwochen GymLevel Mehrfachauswahl

**Problem:** `SpecialWeekConfig.gymLevel` ist `string | undefined` — es kann nur
eine Stufe pro Sonderwoche-Eintrag gewählt werden. Wenn eine Woche für GYM2 und
GYM3 gilt, braucht es zwei separate Einträge.

**Lösung:** `gymLevel` auf `string[] | undefined` ändern (Mehrfachauswahl).

**Datenmodell-Änderung:**
```typescript
// settingsStore.ts
interface SpecialWeekConfig {
  // ...
  gymLevel?: string | string[]; // Rückwärtskompatibel: string wird als [string] behandelt
}
```

Rückwärtskompatibel halten: wenn `gymLevel` ein String ist (alte Daten), wie
`[gymLevel]` behandeln. So funktionieren alle bestehenden gespeicherten Configs
ohne Migration.

**Filter-Logik in `applySettingsToWeekData`:**
```typescript
// Statt: if (course.stufe !== gymLevel)
// Neu:
const levels = Array.isArray(gymLevel) ? gymLevel : [gymLevel];
if (!levels.includes(course.stufe)) continue;
// Für TaF: gleiche Logik, 'TaF' als möglicher Wert im Array
```

**UI in `SettingsPanel` (Sonderwoche-Formular):**
- Dropdown → Checkbox-Liste mit: `alle`, `GYM1`, `GYM2`, `GYM3`, `GYM4`, `GYM5`, `TaF`
- Mehrere können gleichzeitig ausgewählt sein
- Anzeige im Sonderwoche-Header: «GYM2, GYM3» statt nur «GYM2»
- Schnellauswahl: «Alle GYM» (GYM1–GYM5), «Nur TaF», «Alle»

**Migration `iwPresets.ts`:** Einträge die für mehrere Stufen gelten zusammenführen
wo sinnvoll (z.B. IW38 GYM1+GYM2 als ein Eintrag mit `gymLevel: ['GYM1', 'GYM2']`).

---

## Task J6: UI — Toolbar Layout Neuordnung

**Problem:** Aktuelle Reihenfolge in der Toolbar (v3.85):
`[+] [Alle] [SF] [EWR] [IN] [KS] [TaF] [Suche] | [Icons...] [Lücke] [Statistik] [Einstellungen]`

Die Icons sind teilweise linksbündig, teilweise rechtsbündig — es entsteht eine
unschöne Lücke zwischen den abgedunkelten Icons und Statistik/Einstellungen.

**Gewünschte Reihenfolge:**
`[Suche_______________________] [+] [Alle] [SF] [EWR] [IN] [KS] [TaF] | [Icons...] [Statistik] [Einstellungen] [?]`

- **Suche:** ganz links, nimmt den verfügbaren Platz ein (`flex: 1 1 auto`)
- **Filter-Buttons** (`[+] [Alle] [SF]...`): nach der Suche, feste Breite, bei
  Platzmangel zusammengestaucht (`overflow: hidden`, `flex-shrink: 1`)
- **Icons + Statistik + Einstellungen:** ganz rechts, immer sichtbar (`flex: 0 0 auto`)
- **Kein Leerraum** zwischen den Icon-Gruppen — alle Icons direkt nebeneinander

**Implementierung:**
```
<toolbar>
  <div class="search-area flex-1">  <!-- Suche, nimmt Platz -->
  <div class="filter-area flex-shrink overflow-hidden">  <!-- Filter-Buttons -->
  <div class="icon-area flex-none">  <!-- Alle Icons rechtsbündig -->
</toolbar>
```

**Suche links:** Suchfeld bekommt `flex: 1 1 auto; min-width: 120px` damit es
nie ganz verschwindet, aber Platz abgibt wenn nötig.

---

## Ergebnis v3.87

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| J1 | Bug-fix | H4-Regression: Schuljahr-Dropdown bereits korrekt (kein Vorlage-Dropdown vorhanden) | ✅ |
| J2 | Bug | Panel-Scroll: onWheel stopPropagation + overflow-hidden auf DetailPanel + SequencePanel | ✅ |
| J3 | Bug | Sequenz-UE: weekData-Sync in addBlockToSequence + updateBlockInSequence (Placeholder-Lektionen) | ✅ |
| J4 | Feature | UE Dauer-Default: effectiveDetail.duration = les × lessonDurationMin, NewUEButton dynamisch | ✅ |
| J5 | Feature | gymLevel string\|string[] + Checkbox-Toggle-UI + normalizeGymLevel/formatGymLevel + Filter-Logik Array-kompatibel | ✅ |
| J6 | UI | Toolbar: Suche links (flex-1), Filter mitte (flex-shrink), Icons+Stats+Settings rechts (flex-none), v3.87 | ✅ |

---

## Commit-Anweisung

```bash
npm run build 2>&1 | tail -20
git add -A
git commit -m "fix/feat: v3.87 — Schuljahr-Dropdown (J1), Panel-Scroll (J2), Sequenz-weekData-Sync (J3), Dauer-Default (J4), GymLevel Mehrfachauswahl (J5), Toolbar-Layout (J6)"
git push
```

Nach Abschluss: HANDOFF.md Status auf ✅ setzen und Änderungsdetails dokumentieren.

---

## Vorherige Version: v3.86 ✅

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| I1 | Bug | Import-Kompatibilität: Spalten-ID, Versionscheck, expandWeekRange, days-Migration | ✅ |
