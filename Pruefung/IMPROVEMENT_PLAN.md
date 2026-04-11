# ExamLab — Verbesserungsplan (6 Sessions) — ✅ ABGESCHLOSSEN

> 55 Punkte aus User-Testing vom 10.04.2026, aufgeteilt in 6 selbstständige Session-Pakete.
> **Status: ALLE 6 SESSIONS ERLEDIGT** (Sessions 67, 70, 79, 88, 89, 90)
> Jede Session beginnt mit diesem Plan + HANDOFF.md lesen.

---

## Abhängigkeiten

```
Session 1 (Editor-Crashes)     Session 3 (Navigation)     Session 4 (Stammdaten)
        |                              |                       |       |
        v                              |                       v       v
Session 2 (Üben-Crashes)        (unabhängig)            Session 5  Session 6
                                                        (Teile)    (Teile)
```

**Empfohlene Reihenfolge:** 1 → 2 → 3 → 4 → 5 → 6
Sessions 1+3 oder 1+4 können parallel laufen.

---

## SESSION 1: Fragensammlung-Editor Crashes (6 Fragetypen)

**Branch:** `fix/editor-array-undefined-crashes`
**Geschätzt:** 1 Session

### Problem
6 Fragetypen crashen beim Öffnen im Fragensammlung-Editor mit `undefined.map`/`.join`/`.length`. Ursache: Array-Felder (`luecken`, `beschriftungen`, `bereiche`, etc.) kommen als `undefined` aus dem Backend, und die Editoren initialisieren keinen Fallback.

### Betroffene Dateien + Crash-Stellen

| Fragetyp | Editor-Datei | Crashendes Feld | Fehler |
|---|---|---|---|
| Lückentext | `packages/shared/src/editor/typen/LueckentextEditor.tsx` | `luecken` | `.join` auf undefined |
| Bildbeschriftung | `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` | `beschriftungen` | `.map` auf undefined |
| Drag&Drop | `packages/shared/src/editor/typen/DragDropBildEditor.tsx` | `zielzonen`, `labels` | `.length` auf undefined |
| Hotspot | `packages/shared/src/editor/typen/HotspotEditor.tsx` | `bereiche` | `.length` auf undefined |
| Kontenbestimmung | `packages/shared/src/editor/typen/KontenbestimmungEditor.tsx` | `aufgaben` | `.map` auf undefined |
| T-Konto | `packages/shared/src/editor/typen/TKontoEditor.tsx` | `konten`, `geschaeftsfaelle` | `.map` auf undefined |

### Lösungsansatz

**Schicht 1 — Zentral in `SharedFragenEditor.tsx`:**
- Alle `useState`-Initialisierer für Array-Felder mit `?? []` absichern
- Pattern: `useState((frage as LueckentextFrage).luecken ?? [])`
- Datei: `packages/shared/src/editor/SharedFragenEditor.tsx` (ca. Zeile 200+)

**Schicht 2 — Defensiv in jedem Editor:**
- Am Verwendungsort `(feld ?? []).map(...)` statt `feld.map(...)`
- Schützt gegen Regressions falls Editor ausserhalb SharedFragenEditor verwendet wird

### Zusätzlich: Dropdown-Verhalten vereinheitlichen
- `FragenBrowserHeader.tsx`: Typ- und Fach-Dropdown zeigen nach Auswahl nur die gewählte Option
- **Fix:** Alle Dropdowns auf Häkchen-Pattern umstellen (wie Thema/Unterthema/Bloom/Status)
- Entweder Custom-Select-Komponente oder konsistentes `<select>` mit "Alle"-Option als Reset

### Verifizierung
- [ ] `npx tsc -b` + `npx vitest run` + `npm run build`
- [ ] Jeder der 6 Fragetypen: Neue Frage erstellen → kein Crash
- [ ] Jeder der 6 Fragetypen: Bestehende Frage öffnen → kein Crash
- [ ] Typ wechseln (MC → Lückentext etc.) → kein Crash
- [ ] Dropdown-Verhalten konsistent (Häkchen überall)

---

## SESSION 2: Üben-Modus Fragetyp-Crashes + Korrektur-Bug

**Branch:** `fix/ueben-fragetypen-korrektur`
**Geschätzt:** 1–2 Sessions (viele einzelne Bugs)
**Abhängigkeit:** Session 1 idealerweise zuerst (gleiche Domain), aber Code-Pfade unabhängig

### Problem A: 8+ Fragetypen crashen oder funktionieren nicht im Üben-Modus

| # | Fragetyp | Symptom | Ursache | Fix-Ansatz |
|---|---|---|---|---|
| 1 | Kontenbestimmung | React Error #31 | `kontenauswahl.konten` enthält Objekte `{nr, name}` statt Strings → `{nr: k, name: k}` wraps nochmal → Objekt in JSX | Normalisierung: `typeof k === 'string' ? {nr:k, name:k} : k` |
| 2 | Buchungssatz | React Error #31 | Gleiche kontenauswahl-Normalisierung | Shared `normalizeKonten()` Utility |
| 3 | T-Konto | Dropdown leer, Prüfen macht nichts | kontenauswahl leer + fehlende geschaeftsfaelle | Normalisierung + Fallback-Daten |
| 4 | Bilanz | Klick wählt alle, nur Zahlen ohne Namen | Toggle-Logik fehlerhaft + `k.name` nicht angezeigt | Display + Click-Handler fixen |
| 5 | Drag&Drop | React Error #31 | `labels` enthält `{id, text, zone}` Objekte → direkt gerendert | Normalisierung: `.text` extrahieren |
| 6 | Bildbeschriftung | Bild nicht beschriftbar | `beschriftungen` undefined oder Interaktion nicht verdrahtet | Array-Init + Event-Handler prüfen |
| 7 | Hotspot | Klick funktioniert nicht | `bereiche` undefined oder Click-Handler fehlt | Array-Init + Click-Handler prüfen |
| 8 | Zeichnen | Keine Lösung zum Vergleichen | `musterloesungBild` nicht gerendert im Feedback | Musterlösung-Anzeige einbauen |
| 9 | Aufgabengruppe | Nur Fragetext, keine Teilaufgaben | `teilaufgaben` undefined oder nicht aufgelöst | Daten-Loading prüfen |

**Betroffene Dateien:** `src/components/ueben/fragetypen/*.tsx` + `src/components/ueben/fragetypen/shared/KontenSelect.tsx`

**Shared Utility erstellen:** `src/utils/ueben/normalizeKonten.ts`
```typescript
export function normalizeKonten(konten: unknown[]): {nr: string, name: string}[] {
  return (konten || []).map(k =>
    typeof k === 'string' ? { nr: k, name: k } : k as {nr: string, name: string}
  )
}
```

### Problem B: Korrektur-Loading Crash

- **Datei:** `src/components/lp/korrektur/useKorrekturDaten.ts`
- **Symptom:** `Cannot read properties of undefined (reading 'map')` nach Prüfungsabgabe
- **Ursache:** `Object.values(abgabenResult).map(...)` ohne Null-Check (ca. Zeile 133)
- **Fix:** Defensive Guards: `abgabenResult ? Object.values(abgabenResult).map(...) : []`
- **Zusätzlich:** Prüfen warum `abgabenResult` undefined sein kann (API-Fehler? Timing?)

### Problem C: Backup-Export "Keine gespeicherten Daten"

- **Datei:** `src/services/autoSave.ts` (IndexedDB)
- **Prüfen:** Wird IndexedDB korrekt beschrieben? Stimmt der Store-Name? Race Condition beim Lesen?

### Problem D: Bilanz & Erfolgsrechnung

- Bilanz und ER sind strukturell unterschiedlich → **separate Fragetypen sinnvoll**
- Bilanz hat Aktiven/Passiven-Seiten, ER hat Aufwand/Ertrag
- Kombination über Aufgabengruppe möglich
- **In dieser Session:** Bilanz-Bug fixen. ER als neuen Fragetyp nur einplanen/Typ definieren, nicht voll implementieren

### Verifizierung
- [ ] `npx tsc -b` + `npx vitest run` + `npm run build`
- [ ] **Im Browser testen** (Chrome-in-Chrome, echte Daten):
  - Kontenbestimmung: Dropdown zeigt "Nr Name", Auswahl + Prüfen funktioniert
  - Buchungssatz: Dropdown + Buchung erfassen funktioniert
  - T-Konto: Dropdown gefüllt, Prüfen reagiert
  - Bilanz: Namen sichtbar, Einzelklick wählt nur ein Konto
  - Drag&Drop: Labels als Text, Platzierung funktioniert
  - Bildbeschriftung: Bild annotierbar
  - Hotspot: Klick registriert
  - Zeichnen: Musterlösung im Feedback sichtbar
  - Aufgabengruppe: Teilaufgaben sichtbar + lösbar
- [ ] LP Korrektur laden nach SuS-Abgabe → kein Crash
- [ ] Backup-Export: Daten vorhanden nach Auto-Save

---

## SESSION 3: Navigation & Kopfzeile

**Branch:** `feature/navigation-breadcrumbs`
**Geschätzt:** 1 Session
**Abhängigkeit:** Unabhängig von Sessions 1–2

### Probleme
1. Zurück-Button springt zur ersten Ebene statt einen Schritt zurück
2. Kopfzeile verschwindet in Unteransichten (z.B. Prüfung bearbeiten)
3. Klick auf "ExamLab" geht nicht immer zum Start
4. SuS-Üben: Kein Zurück von Gruppenauswahl zur Startseite
5. SuS: Ganzer Bildschirm leer beim Laden (keine Kopfzeile)

### Architektur-Analyse
- **Üben-Modus hat bereits einen History-Stack:** `src/store/ueben/navigationStore.ts` mit `screenHistory`, `navigiere()`, `zurueck()`
- **LP-Modus hat keinen Stack:** `App.tsx` nutzt flache `useState`-Phase, `LPHeader.tsx` bekommt `zurueck`-Callback vom Parent
- **Problem:** Jede Parent-Komponente entscheidet individuell was "zurück" heisst → kein konsistentes Stack-Verhalten

### Lösungsansatz

**Phase 1: LP Navigation Store erstellen**
- Neue Datei: `src/store/lpNavigationStore.ts`
- Gleiches Pattern wie `ueben/navigationStore.ts`
- Screen-Typen: `'dashboard' | 'pruefungVorbereitung' | 'pruefungBearbeiten' | 'korrektur' | 'fragensammlung' | 'multiDashboard'`
- Breadcrumb-Daten: `{screen, titel, unterTitel?}[]`
- `navigiere(screen, titel)`, `zurueck()`, `kannZurueck()`, `zurückZuStart()`

**Phase 2: App.tsx LP-Sektion refactoren**
- `useState`-basierte Phase-Verwaltung → LP Navigation Store
- Alle `setAnsicht()`-Aufrufe → `navigiere()`

**Phase 3: Persistente Kopfzeile**
- `LPHeader.tsx` refactoren:
  - Immer sichtbar (über dem Screen-Switch rendern)
  - Breadcrumb anzeigen: "Prüfen > Einrichtungsprüfung > Vorschau"
  - Zurück-Button liest `kannZurueck()` und ruft `zurueck()` auf
  - ExamLab-Logo: `zurückZuStart()` — immer zum Dashboard
  - Tabs (Prüfen/Üben/Fragensammlung) immer sichtbar auf Dashboard-Ebene

**Phase 4: SuS-Navigation fixen**
- `GruppenAuswahl.tsx`: Zurück-Button zur Startseite verdrahten
- `SuSStartseite.tsx`: ExamLab-Klick → Start

**Phase 5: LP-Favoriten (Grundstruktur)**
- ⭐-Button in der Kopfzeile neben dem Breadcrumb-Titel
- Klick fügt aktuellen "Ort" (Screen + Parameter) zu Favoriten hinzu
- Favoriten-Dropdown (⭐ in Kopfzeile) zeigt gespeicherte Orte
- Persistenz: localStorage (später Backend)
- Konzept wie Google Drive: Nicht Ordner, sondern "App-Orte" favorisieren
- Store: `src/store/favoritenStore.ts` mit `{id, titel, screen, params}[]`

**Phase 6: Loading-Skeleton**
- `SuSLoadingSkeleton`-Komponente: Header-Bar + pulsierende Karten-Platzhalter
- Als Suspense-Fallback in `main.tsx` und `SuSStartseite.tsx`

### Betroffene Dateien
- `src/store/lpNavigationStore.ts` (neu)
- `src/store/favoritenStore.ts` (neu)
- `src/App.tsx` (LP-Sektion refactoren)
- `src/components/lp/LPHeader.tsx` (Breadcrumb, persistente Kopfzeile, Favoriten-⭐)
- `src/components/lp/LPStartseite.tsx` (navigiere statt Callbacks)
- `src/components/ueben/GruppenAuswahl.tsx` (Zurück-Button)
- `src/components/sus/SuSStartseite.tsx` (Skeleton, ExamLab-Link)

### Verifizierung
- [ ] LP: Dashboard → Prüfung bearbeiten → Vorschau → Zurück → Vorschau (nicht Dashboard)
- [ ] LP: Mehrere Ebenen tief → Zurück geht Schritt für Schritt
- [ ] LP: Kopfzeile immer sichtbar mit Breadcrumb
- [ ] LP: ExamLab-Logo → immer Dashboard
- [ ] LP: ⭐ fügt aktuellen Ort zu Favoriten hinzu, Dropdown zeigt sie
- [ ] SuS-Üben: Gruppenauswahl hat Zurück → Startseite
- [ ] SuS: Laden zeigt Skeleton, nie leerer Bildschirm

---

## SESSION 4: Einstellungen-Menü + Stammdaten + Hardcoded-Audit

**Branch:** `feature/einstellungen-stammdaten`
**Geschätzt:** 1–2 Sessions
**Abhängigkeit:** Unabhängig. Apps Script Deploy nötig.

### Problem
- Einstellungen-Panel ist Platzhalter mit "Pool-Themen migrieren"-Button
- Admin-Email hardcoded: `user?.email === 'yannick.durand@gymhofwil.ch'`
- Einrichtungsprüfung: Kurs `sf-wr-27a28f` in 5+ Dateien hardcoded
- Fächer/Fachschaften als statische Mappings in `fachUtils.ts`
- Dropdowns (Klassen, Kurse, Fächer, Gefässe) brauchen einheitliche Stammdaten vom Admin

### Lösungsansatz

**Phase 1: Stammdaten-Datenmodell + Backend**

Neuer Typ in `src/types/stammdaten.ts`:
```typescript
interface Stammdaten {
  admins: string[]                    // E-Mails der Admins
  klassen: string[]                   // z.B. ['27a', '28bc29fs', '29c', '30s']
  kurse: KursDefinition[]             // {id, name, fach, gefaess, klassen}
  faecher: FachDefinition[]           // {id, name, fachbereich, kuerzel}
  gefaesse: string[]                  // z.B. ['SF', 'EWR', 'EF', 'IN']
  fachschaften: FachschaftDefinition[] // {id, name, faecherIds}
}
```

Apps Script Endpoints in `apps-script-code.js`:
- `ladeStammdaten()` — liest aus neuem "Stammdaten"-Sheet
- `speichereStammdaten(daten)` — nur für Admins
- `speichereLPProfil(profil)` — LP speichert eigene Kurse/Fächer

Neuer Store: `src/store/stammdatenStore.ts` — lädt einmal, cached.

**Phase 2: Einstellungen-Panel umbauen**

`src/components/settings/EinstellungenPanel.tsx` komplett umschreiben:

| Tab | Inhalt | Wer |
|-----|--------|-----|
| **Mein Profil** | Kurse (Multi-Select Dropdown), Gefässe, Fächer, Fachschaft | Jede LP |
| **Admin** | Klassen, Kurse, Fächer, Gefässe, Fachschaften CRUD | Nur Admins |

- "Pool-Themen migrieren"-Button entfernen
- Admin-Check: `stammdaten.admins.includes(user.email)` statt hardcoded
- Alle Eingaben als Dropdowns aus Stammdaten (keine Freitext-Eingabe für Strukturdaten)

**Phase 3: Hardcoded-Werte ersetzen**

| Datei | Was | Durch |
|-------|-----|-------|
| `EinstellungenPanel.tsx:19` | `=== 'yannick.durand@gymhofwil.ch'` | `stammdaten.admins.includes(...)` |
| `einrichtungsPruefung.ts` | `'sf-wr-27a28f'` | `DEMO_KURS_ID` aus `demoConfig.ts` |
| `einrichtungsUebung.ts` | `'sf-wr-27a28f'` | `DEMO_KURS_ID` |
| `demoKorrektur.ts` | `'sf-wr-27a28f'` | `DEMO_KURS_ID` |
| `trackerUtils.ts:6` | `klasse: '27a28f'` | `DEMO_KURS_ID` |
| `fachUtils.ts` | `FACHSCHAFT_ZU_FACH` statisch | Fallback auf Stammdaten |
| `useFragenFilter.ts` | `SCHUL_FACHBEREICHE` statisch | Aus Stammdaten laden |

Neue Datei: `src/data/demoConfig.ts` — extrahiert Demo-Konstanten

**Phase 4: Prüfung/Übung bearbeiten — Einstellungen-Sub-Tab**

- "Fachbereiche" → "Fach" oder "Fächer" umbenennen
- Fach automatisch aus Fragen ableiten (nicht manuell wählen) — oder aus LP-Profil vorbelegen
- Gesamtpunkte: Summe aus Einzelfragen berechnen, nicht manuell editierbar
- Datum: Wenn leer → bei Durchführung automatisch setzen
- Klassen: Dropdown aus Stammdaten

### Verifizierung
- [ ] `npx tsc -b` + `npx vitest run` + `npm run build`
- [ ] Apps Script deployed mit neuen Endpoints
- [ ] Einstellungen: Kein "Pool-Themen migrieren"-Button
- [ ] Einstellungen: LP kann Kurse/Fächer/Gefässe/Fachschaft per Dropdown wählen
- [ ] Einstellungen: Admin-Tab nur für Admins sichtbar
- [ ] Admin: Kann Klassen/Kurse/Fächer/Gefässe/Fachschaften anlegen/bearbeiten
- [ ] Kein `yannick.durand@gymhofwil.ch` mehr im Quellcode (ausser demoConfig)
- [ ] Einrichtungsprüfung funktioniert weiterhin (nutzt DEMO_KURS_ID)
- [ ] Prüfung bearbeiten: "Fach" statt "Fachbereiche", Punkte automatisch

---

## SESSION 5: UX-Polish + Analyse-Verbesserungen

**Branch:** `feature/ux-polish`
**Geschätzt:** 1 Session
**Abhängigkeit:** Teile (Klassen-Dropdown) brauchen Session 4

### Aufgabenliste

**A) Prüfung/Übung bearbeiten — Analyse-Tab** (`AnalyseTab.tsx`, `analyseUtils.ts`)
| # | Änderung |
|---|----------|
| A1 | Farbcode-Legende hinzufügen (grün=ok, amber=Warnung, rot=Überschreitung, blau=KI) |
| A2 | Zeitbedarf-Balken: Pro Frage aufteilen statt ein grosser Balken |
| A3 | Taxonomie-Verteilung: Zugehörige Frage-Nummern in/neben Balken notieren |
| A4 | Fragetypen-Mix: Zugehörige Fragen auflisten |
| A5 | Gross-/Kleinschreibung Fragetypen vereinheitlichen (alles gross) |
| A6 | "gesch. Zeit" → "Zeitbedarf" umbenennen |
| A7 | Themen-Abdeckung: "einrichtung" vs "einrichtungstest" → vereinheitlichen |

**B) Prüfung bearbeiten — Vorschau** (`VorschauTab.tsx`)
| # | Änderung |
|---|----------|
| B1 | Statische Vorschau: Bilder/PDFs anzeigen (aktuell fehlen sie) |
| B2 | Vollständige druckbare Ansicht (wie PDF-Export) |
| B3 | Interaktive Vorschau = exakte SuS-Computer-Ansicht (bereits so, nur klar machen) |

**C) Prüfung bearbeiten — Abschnitte & Fragen** (`AbschnitteTab.tsx`)
| # | Änderung |
|---|----------|
| C1 | Drag-Handle (6 Punkte) + Pfeile: Alles einheitlich rechts anordnen |

**D) Material-Sidebar SuS**
| # | Änderung |
|---|----------|
| D1 | "Vollbild"-Button entfernen (Sidebar kleiner als Standard) |

**E) LP-Prüfen-Analyse** (Header-Komponenten)
| # | Änderung |
|---|----------|
| E1 | "Fehlende SuS" / "Noten-Stand pro Kurs" Header: Weiss bei Mouseover fixen (CSS hover) |

**F) SuS-Üben UX** (Dashboard, ThemaKarte, etc.)
| # | Änderung |
|---|----------|
| F1 | Empfohlen-Banner: `cursor-pointer` hinzufügen |
| F2 | Repetition-Button: Tooltip wenn keine Daten ("Löse zuerst Übungen") |
| F3 | "Alle Themen": Nicht-freigeschaltete anklickbar machen (Lock-Icon + Info) |
| F4 | Fragetyp-Buttons: Abkürzungen verständlicher (Kontenb. → Kontenbestimmung, MC → Multiple-Choice, R/F → Richtig/Falsch, Lücken → Lückentext). Tooltip mit vollem Namen |
| F5 | Lernziele-Button bei Fragen/Unterthemen/Themen überall verlinken (SuS + LP) |

### Verifizierung
- [ ] Jede Änderung visuell in Light + Dark Mode prüfen
- [ ] Touch-Targets ≥ 44px
- [ ] `npx tsc -b` + `npm run build`
- [ ] Analyse-Tab: Farbcode sichtbar, Balken pro Frage, Fragen-Nummern in Taxonomie

---

## SESSION 6: Performance + Erweiterte Features

**Branch:** `feature/performance-features`
**Geschätzt:** 1–2 Sessions
**Abhängigkeit:** Problem-Melden-Kontext und Excel-Import unabhängig. Favoriten-Backend braucht Session 4.

### A) Performance: LP-Laden ~25 Sek.

**Diagnose-Schritte:**
1. Chrome DevTools Network-Tab: Welche API-Calls dauern wie lange?
2. `LPStartseite.tsx` analysieren: Welche Daten werden parallel/sequentiell geladen?
3. Bereits implementiert: Progressive Loading mit Summary/Detail-Split (Session 67)

**Mögliche Optimierungen:**
- Mehr `React.lazy()` Boundaries (aktuell nur App-Root)
- Suspense-Boundaries pro Dashboard-Sektion
- IndexedDB-Cache für Fragenbank mit Staleness-Check
- Stammdaten + Konfiguration zuerst laden (schnell), Fragenbank lazy
- `useDeferredValue` für Filter-Interaktionen

### B) SuS-Loading: Kein leerer Bildschirm

- Skeleton-Komponente mit Header-Bar + pulsierenden Karten
- Als Suspense-Fallback in `main.tsx` und pro Sektion
- Kopfzeile nie ausblenden während Laden

### C) Problem-Melden: Kontext automatisch mitschicken

- **Datei:** `src/components/shared/FeedbackModal.tsx`
- Bereits vorhanden: `context`-Prop mit `rolle`, `ort`, `frageId`, `frageText`
- **Erweitern:** `frageTyp`, `modus` (prüfung/üben/fragensammlung), `bildschirm`, `appVersion`, `gruppeId`
- An jeder Verwendungsstelle den Kontext aus den relevanten Stores befüllen
- SuS soll nicht manuell Frage-ID oder Typ eingeben müssen

### D) Excel-Import

- Umkehrung des bestehenden Excel-Exports
- Import-Dialog in LP-Startseite oder Fragensammlung
- Datei hochladen → Parsing → Vorschau → Bestätigung → Import
- Nutzt bestehende `speichereFrage`-Endpoints
- **Scope:** Prüfungs-/Übungs-Konfigurationen + Fragen-Daten
- In dieser Session: Grundstruktur + Parser, Feinschliff in Folge-Session

### E) Hintergrund-Prefetching

- Strategie: Nach Login sofort Kurs-Liste laden (schnell), dann im Hintergrund:
  - Fragenbank-Summaries prefetchen
  - Letzte 5 Prüfungen prefetchen
  - Themen-Sichtbarkeit laden
- Implementierung über `requestIdleCallback` oder `useEffect` mit Delay

### F) Lernziele überall

- Lernziele 🏁-Buttons in LP-Ansicht (Themensteuerung, Fragenbank) — aus HANDOFF offen
- Lernziele-Button bei Fragen, Unterthemen, Themen einheitlich verlinken
- Lernziele-Vollständigkeit: Fehlende Pools/Topics identifizieren

### Verifizierung
- [ ] LP-Ladezeit messbar verbessert (Ziel: <10 Sek., Chrome DevTools)
- [ ] SuS-Laden: Skeleton sichtbar, nie blank
- [ ] Problem-Melden: Formular enthält automatisch Frage-Kontext
- [ ] Excel-Import: Datei hochladen → Vorschau → Import → Fragen in Fragenbank
- [ ] Prefetching: Kein Blocking der UI, Daten verfügbar bei Navigation

---

## Querschnitts-Themen (in jeder Session beachten)

### Branching
- Immer Feature/Fix-Branch, nie direkt auf `main`
- `npx tsc -b && npx vitest run && npm run build` vor jedem Merge
- Browser-Test vor Merge (Chrome-in-Chrome)
- HANDOFF.md nach jeder Session aktualisieren

### Apps Script
- Sessions 2 + 4 + 6 brauchen Apps Script Deploy
- User muss Code in Apps Script Editor kopieren + neue Bereitstellung

### Reihenfolge bei Zeitmangel
Falls nicht alle 6 Sessions machbar: **1 → 2 → 3** sind die wichtigsten (Crashes + Navigation). Session 4 (Stammdaten) ist architektonisch am wertvollsten für die Zukunft.
