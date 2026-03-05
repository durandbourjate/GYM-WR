# Unterrichtsplaner – Handoff v3.88

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
