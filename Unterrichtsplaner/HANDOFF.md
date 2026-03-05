# Unterrichtsplaner – Handoff v3.86

## Status: ✅ v3.86 — 1/1 Tasks erledigt

---

## Originalauftrag v3.86 — Import-Kompatibilität

| # | Typ | Beschreibung |
|---|-----|-------------|
| I1 | Bug | Import-Kompatibilität: ältere Planerdaten führen zu Spalten-Mismatch, fehlenden Ferien und falschem Verhalten |

---

## Task I1: Bug — Import-Kompatibilität älterer Konfigurationen

Durch Code-Analyse wurden 4 strukturelle Probleme gefunden die auftreten wenn ältere JSON-Exporte importiert werden. Diese Bugs erklären mehrere bisher schwer reproduzierbare Fehler.

---

### Problem 1 — Spalten-ID Mismatch (kritisch)

**Ursache:** `configToCourses()` in `settingsStore.ts` weist Spalten-IDs ab 100 aufwärts zu (`colCounter = 100`), ignoriert dabei das `col`-Feld im `CourseConfig`-Objekt. Ältere Planerdaten (z.B. `planner_backup_SJ2526.json`) verwenden aber die originalen niedrigen IDs (2, 4, 6, 11, 13...) aus der hardcodierten `COURSES`-Tabelle.

**Folge:** UEs aus einem alten Export landen nach Import in falschen oder nicht existierenden Spalten. Das Backup zeigt z.B. `"11": { title: "Kennenlernen SF WR" }` — nach Re-Import über neue Konfiguration zeigt Spalte 11 nichts, weil der neue Code Spalte 11 nicht kennt (er beginnt bei 100).

**Fix:**
- `CourseConfig` hat bereits ein `col?`-Feld in `kurse_duy_2526.json` — dieses Feld in `configToCourses()` respektieren
- Wenn `c.col` definiert ist → diesen Wert als Spalten-ID verwenden statt `colCounter++`
- Falls `c.col` fehlt (ältere Configs) → Fallback auf `colCounter++` (bisheriges Verhalten)
- Das `col`-Feld zu `CourseConfig` Interface in `settingsStore.ts` als optional hinzufügen: `col?: number`
- Beim Import einer Planerdatei (weekData): Spalten-IDs der UEs mit den tatsächlichen `col`-Werten der geladenen Kurse abgleichen — eine Migrations-Map erstellen: `oldColId → newColId`

```typescript
// In configToCourses():
return configs.map((c, i) => ({
  id: c.id,
  col: c.col ?? (100 + i), // bevorzuge explizites col-Feld
  cls: c.cls,
  // ...
}));
```

---

### Problem 2 — `version`-Feld Mismatch

**Ursache:** Planerdaten-Exports (weekData) enthalten `meta.version: "2.9"` (String im `meta`-Objekt). `PlannerSettings` erwartet `version: number` (Zahl im Root-Objekt). Das sind zwei völlig verschiedene Felder die nichts miteinander zu tun haben — der Import-Handler kann deshalb nicht erkennen ob ein altes oder neues Format vorliegt.

**Folge:** Kein Versions-Check möglich → keine Migration → stille Fehler beim Import.

**Fix:**
- Im Import-Handler: beide Formate erkennen:
  - `data.meta?.version` → Planerdaten-Format (weekData Export)
  - `data.version` → Settings-Format (Konfiguration Export)
- Explizite Typ-Guards: `isPlannerDataExport(data)` vs `isPlannerSettingsExport(data)`
- Toast-Meldung wenn Format unbekannt: «Unbekanntes Import-Format — bitte aktuellen Export verwenden»

```typescript
function isPlannerDataExport(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'meta' in data && 'weeks' in data;
}
function isPlannerSettingsExport(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'version' in data && 'courses' in data;
}
```

---

### Problem 3 — `expandWeekRange` bricht bei Jahreswechsel (Weihnachtsferien)

**Ursache:** `expandWeekRange(start, end)` in `applySettingsToWeekData()` sucht `startIdx = allWeekIds.indexOf(start)` und `endIdx = allWeekIds.indexOf(end)`. Das Array `allWeekIds` läuft von KW 33 bis KW 27 (chronologisch übers Schuljahr). KW 52 hat Index ~19, KW 01 hat Index ~20 — das funktioniert **nur wenn das Jahr exakt 52 Wochen hat und KW 01 direkt nach KW 52 im Array steht**.

Wenn die Ferien-Konfiguration `startWeek: '52'` und `endWeek: '01'` hat, aber das Array so aufgebaut ist dass `indexOf('01') < indexOf('52')` (z.B. bei falsch sortierten oder fehlenden Wochen), gibt die Funktion ein leeres Array zurück → Weihnachtsferien werden nie angewendet.

**Fix:** `expandWeekRange` robuster machen:
```typescript
const expandWeekRange = (start: string, end: string): string[] => {
  const startIdx = allWeekIds.indexOf(start);
  const endIdx = allWeekIds.indexOf(end);
  if (startIdx === -1) return [];
  // Jahreswechsel: endIdx < startIdx → bis Ende + ab Anfang
  if (endIdx !== -1 && endIdx >= startIdx) {
    return allWeekIds.slice(startIdx, endIdx + 1);
  }
  // Jahreswechsel oder endIdx nicht gefunden: alle Wochen ab startIdx bis endIdx (zyklisch)
  if (endIdx !== -1 && endIdx < startIdx) {
    return [...allWeekIds.slice(startIdx), ...allWeekIds.slice(0, endIdx + 1)];
  }
  // endIdx nicht im Array → nur startIdx
  return [allWeekIds[startIdx]];
};
```

---

### Problem 4 — `days`-Feld fehlt in älteren HolidayConfig-JSONs (Auffahrt/Pfingstmontag)

**Ursache:** Das `days`-Array in `HolidayConfig` wurde erst in v3.84 (G1-Fix) eingeführt. Ältere exportierte Konfigurationen haben dieses Feld nicht. Beim Import ist `holiday.days` dann `undefined` → `hasPartialDays` ist false → die ganze Woche wird als Ferienblock markiert statt nur der betroffene Tag.

**Folge:** Auffahrt (KW 21, nur Do) und Pfingstmontag (KW 22, nur Mo) markieren nach Import einer alten Konfiguration wieder die ganze Woche — obwohl G1 das eigentlich gefixt hat.

**Fix:** Beim Import einer `HolidayConfig` ohne `days`-Feld: heuristische Erkennung bekannter Einzel-Tag-Ferien:
```typescript
function migrateLegacyHoliday(h: HolidayConfig): HolidayConfig {
  if (h.days !== undefined) return h; // bereits korrekt
  // Bekannte Einzel-Tag-Feiertage erkennen
  if (h.startWeek === h.endWeek) {
    const label = h.label.toLowerCase();
    if (label.includes('auffahrt')) return { ...h, days: [4] }; // Donnerstag
    if (label.includes('pfingstmontag')) return { ...h, days: [1] }; // Montag
    if (label.includes('1. august') || label.includes('bundesfeier')) return { ...h, days: [1] };
    if (label.includes('neujahr')) return { ...h, days: [1] };
    if (label.includes('berchtoldstag')) return { ...h, days: [2] };
  }
  return h;
}
```
Diese Funktion beim Import (SettingsPanel Import-Handler) und beim Laden aus localStorage auf alle Holidays anwenden.

---

### Zusatz — `col`-Feld Dokumentation in `kurse_duy_2526.json`

Das `col`-Feld in `kurse_duy_2526.json` ist aktuell dokumentiert aber wird von `configToCourses()` ignoriert. Nach Fix von Problem 1 ist dieses Feld offiziell Teil des Formats. Die bestehenden `col`-Werte in der JSON sind korrekt und sollen beibehalten werden.

**Prüfe:** Ob `CourseConfig` Interface in `settingsStore.ts` das `col?`-Feld bereits hat — falls nicht, ergänzen.

---

## Ergebnis v3.86

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| I1 | Bug | Import-Kompatibilität: 4 Teilprobleme (Spalten-ID, Version, Jahreswechsel, days-Feld) | ✅ |

---

### Änderungen I1

**Problem 3 (expandWeekRange Jahreswechsel):**
- `settingsStore.ts` `expandWeekRange()`: Jahreswechsel-Logik — wenn `endIdx < startIdx`, wird zyklisch gewrappt (`slice(startIdx) + slice(0, endIdx+1)`). Weihnachtsferien KW 52→01 funktionieren jetzt korrekt.

**Problem 4 (days-Migration):**
- `settingsStore.ts`: Neue `migrateLegacyHoliday()` + `migrateHolidays()` Funktionen — erkennt bekannte Einzel-Tag-Feiertage (Auffahrt→Do, Pfingstmontag→Mo, etc.) und ergänzt `days`-Feld heuristisch.
- `loadSettings()`: Wendet Migration beim Laden aus localStorage an.
- `SettingsPanel.tsx`: Migration bei Holiday-Import und Gesamt-Settings-Import.

**Problem 1 (col-Feld in configToCourses):**
- `CourseConfig` Interface: `col?: number` Feld hinzugefügt.
- `configToCourses()`: Nutzt `c.col ?? (100 + i)` statt hart `colCounter++`.
- `applySettingsToWeekData()`: Alle 4 col-Mapping-Schleifen (allCols, colToDay, colToCourseId, colToCourse) verwenden dieselbe `c.col ?? (100 + i)` Logik.
- `plannerStore.ts` `importData()`: Baut Migrations-Map `oldCol → newCol` beim Planerdaten-Import. Mapped weekData-Einträge und lessonDetails-Keys auf neue col-IDs.

**Problem 2 (Versionscheck + Typ-Guards):**
- Planerdaten-Import: Erkennt Settings-Exporte (`courses` ohne `weekData`) und zeigt hilfreiche Fehlermeldung.
- Einstellungen-Import: Erkennt Planerdaten-Exporte (`weekData` ohne `courses`) und leitet auf richtigen Import-Bereich.
- Unbekannte Formate: Klare Fehlermeldung «Unbekanntes Import-Format».

---

## Commit-Anweisung

```bash
npm run build 2>&1 | tail -20
git add -A
git commit -m "fix: v3.86 — Import-Kompatibilität (Spalten-ID col-Feld, Versionscheck, expandWeekRange Jahreswechsel, HolidayConfig days-Migration)"
git push
```

Nach Abschluss: HANDOFF.md Status auf ✅ setzen, Änderungsdetails pro Teilproblem dokumentieren.

---

## Vorherige Version: v3.85 ✅

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| H1 | Bug-fix | Feriendauer-Label: KW 39–41 = 3W, KW 52–01 = 2W | ✅ |
| H2 | Bug-fix | Sonderwochen in gefilterten Spalten | ✅ |
| H3 | Bug-fix | Toolbar Layout + Panel-Scroll | ✅ |
| H4 | UI-fix | «Ohne Vorlage»-Dropdown entfernen | ✅ |
| H5 | Bug-fix | PW-Badge nur reine TaF-Klassen | ✅ |
| H6 | Bug-neu | Einstellungen-Panel Scroll-Bug | ✅ |
