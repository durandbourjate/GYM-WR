# Unterrichtsplaner – Handoff v3.87

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
