# Plan: Übungstool-Integration v2

## Context

Fusion abgeschlossen (Phasen 0–6). Übungstool-Tab im Prüfungstool funktioniert (Gruppenauswahl, AdminDashboard). Backend gemergt (ein Apps Script). Jetzt: UX-Verfeinerung und Feature-Ausbau.

## Übersicht

| # | Aufgabe | Aufwand | Priorität |
|---|---------|---------|-----------|
| A | SuS-Header konsistent (Prüfungs- + Lernplattform-URL) | klein | hoch |
| B | Build-Timestamp statt v1.0 | klein | hoch |
| C | Übungstool-Dashboard UI-Redesign (LP-Sicht) | mittel | hoch |
| D | "Neue Frage" Button | klein | hoch |
| E | Formatives Durchführen im Übungstool | gross | mittel |
| F | Fach-Filter dynamisch + konfigurierbar | mittel | tief |

---

## A: SuS-Header konsistent

**Problem:** SuS-Header in `/Pruefung/` (KorrekturListe) und `/Lernplattform/` (AppShell) sehen unterschiedlich aus.

**Ziel:** Gleiche Button-Reihenfolge, gleiche Buttons (Hilfe, Feedback, Theme, Name, Abmelden ganz rechts).

**Dateien:**
- `ExamLab/src/components/sus/KorrekturListe.tsx` — bereits teilweise gefixt (FeedbackButton + Abmelden rechts)
- `ExamLab/src/components/lernen/layout/AppShell.tsx` — bereits gefixt
- Prüfen: `ExamLab/src/components/Startbildschirm.tsx` (SuS-Startseite vor Prüfung)
- Prüfen: Login-Screens beider Apps

**Massnahme:** Alle SuS-Header-Varianten inventarisieren und vereinheitlichen. Idealerweise eine gemeinsame `SuSHeader`-Komponente extrahieren.

---

## B: Build-Timestamp statt v1.0

**Problem:** `APP_VERSION` in `version.ts` ist hardcoded `'v1.0'`. Wird nie aktualisiert.

**Ziel:** Bei jedem Build automatisch aktuelles Datum anzeigen (z.B. "05.04.2026").

**Umsetzung:**
- `__BUILD_TIMESTAMP__` existiert bereits in vite.config.ts (define)
- `version.ts` ändern: `export const APP_VERSION = __BUILD_TIMESTAMP__` → formatiert als Datum
- Oder: Neues `__BUILD_DATE__` define mit `new Date().toLocaleDateString('de-CH')` → "05.04.2026"
- LPHeader.tsx zeigt es neben dem Titel an

**Dateien:**
- `ExamLab/vite.config.ts` — define ergänzen
- `ExamLab/src/version.ts` — auf Build-Timestamp umstellen
- `ExamLab/src/components/lp/LPHeader.tsx` — zeigt Version

---

## C: Übungstool-Dashboard UI-Redesign (LP-Sicht)

**Problem:** Aktuell wird das AdminDashboard 1:1 aus der alten Lernplattform gerendert — mit eigenem "Admin-Dashboard" Titel, Fragenbank-Tab (redundant), ohne Gruppen-Dropdown im richtigen Ort.

**Ziel-Layout:**
```
Kopfzeile: [Übungstool <timestamp> | Neue Frage | Prüfungstool | Fragenbank | Hilfe | 💬 | System | Abmelden]
           [Gruppe: SF WR 29c ▾ — 0 Lernende · 1 Admin · 2206 Fragen]
Tabs:      [Übersicht | Aufträge | Einstellungen | Übung durchführen]
Content:   (je nach Tab)
```

**Änderungen:**
1. `UebungsToolView.tsx` — Gruppen-Dropdown in den Info-Bereich integrieren (nicht separater Bereich)
2. `AdminDashboard.tsx` (lernen) — "Admin-Dashboard" Titel entfernen, Fragenbank-Tab entfernen
3. "Neue Frage" Button in LPStartseite (Übungsmodus) → öffnet Fragenbank mit neuem Frage-Editor
4. Neuer Tab "Übung durchführen" (zunächst Platzhalter, wird in E implementiert)

**Dateien:**
- `ExamLab/src/components/lp/UebungsToolView.tsx`
- `ExamLab/src/components/lp/LPStartseite.tsx` — "Neue Frage" Button im Übungsmodus
- `ExamLab/src/components/lernen/admin/AdminDashboard.tsx` — Layout anpassen
- Evtl. neue Komponente `ExamLab/src/components/lp/UebungsToolDashboard.tsx` als Ersatz

---

## D: "Neue Frage" Button

**Problem:** Im Übungsmodus fehlt der "Neue Frage"-Schnellzugang in der Kopfzeile.

**Ziel:** Analog zu "Neue Prüfung" im Prüfungsmodus → "+ Neue Frage" öffnet die Fragenbank.

**Umsetzung:**
- `LPStartseite.tsx` — im Übungsmodus `ansichtsButtons` anpassen: "Neue Frage" + "Prüfungstool"
- Klick auf "Neue Frage" → `setZeigFragenbank(true)` (gleiche Fragenbank wie im Prüfungstool)

**Dateien:**
- `ExamLab/src/components/lp/LPStartseite.tsx`

---

## E: Formatives Durchführen im Übungstool

**Problem:** Formative "Prüfungen" (ohne Noten) existieren im Prüfungstool. Logisch gehören sie ins Übungstool — LP leitet Übungen an, SuS üben angeleitet.

**Ziel:** Gemeinsames Durchführungs-Tool, Config-basiert:
- Im Prüfungstool: summativ, benotet, Lockdown möglich, Zeitlimit streng
- Im Übungstool: formativ, keine Noten, kein Lockdown, flexibler

**Architektur-Entscheid:**
- KEIN Duplizieren des Durchführungs-Codes (PruefungsComposer, DurchfuehrenDashboard, Lobby, Live-Monitoring etc.)
- Stattdessen: `istFormativ`-Flag das Verhalten steuert (kein Lockdown, keine Noten, kein SEB, vereinfachte Auswertung)
- Bestehende Komponenten erweitern: `PruefungsComposer` mit `formativ`-Modus, `DurchfuehrenDashboard` ohne Noten-Spalten etc.
- Im Übungstool: Tab "Übung durchführen" → Liste der formativ erstellten Übungen + "Neue Übung" Button → öffnet PruefungsComposer im formativ-Modus

**Dateien (geschätzt):**
- `PruefungsComposer.tsx` — formativ-Flag, gewisse Felder ausblenden
- `DurchfuehrenDashboard.tsx` — formativ-Modus (keine Noten)
- `LobbyPhase.tsx` — kein Lockdown-Config im formativ-Modus
- `KorrekturFrageVollansicht.tsx` — keine Benotung im formativ-Modus
- `UebungsToolDashboard.tsx` — Tab "Übung durchführen"
- Types: `PruefungsConfig` erweitern mit `istFormativ: boolean`

**Aufwand:** ~2-3 Sessions. Grösstes Feature.

---

## F: Fach-Filter dynamisch + konfigurierbar

**Problem:** VWL/BWL/Recht Filter-Badges auf LP-Startseite sind hardcoded.

**Ziel:** Dynamisch aus den Fächern der vorhandenen Prüfungen generieren. LP kann in Einstellungen konfigurieren welche angezeigt werden.

**Umsetzung:**
- Fächer aus `configs` (Prüfungsliste) extrahieren
- Zusätzlich: LP-Einstellungen für sichtbare Fächer (SchulConfig oder eigenes Setting)
- Filter-Badges dynamisch rendern

**Dateien:**
- `ExamLab/src/components/lp/LPStartseite.tsx`
- Evtl. `ExamLab/src/types/schulConfig.ts`

**Aufwand:** 1 Session. Tiefere Priorität.

---

## Empfohlene Reihenfolge

**Nächste Session:** A + B + C + D (UI-Anpassungen, ~1 Session)
**Danach:** E (Formatives Durchführen, ~2-3 Sessions)
**Später:** F (Fach-Filter, ~1 Session)
