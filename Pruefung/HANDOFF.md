# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Offene Punkte

- **SEB / iPad** — SEB weiterhin deaktiviert (`sebErforderlich: false`)
- ~~Fragenbank im Composer "nicht gefunden"~~ ✅ 27.03.2026
- **Apps Script Deploy nötig** — Session 29 + 30 enthalten Backend-Änderungen
- **Tier 2 Features (später):** Diktat, GeoGebra/Desmos, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox)
- **Übungspools ↔ Prüfungstool** — Lern-Analytik, Login, KI-Empfehlungen (eigenes Designprojekt)
- **Bewertungsraster-Vertiefung** — Überfachliche Kriterien, kriterienbasiertes KI-Feedback
- **TaF Phasen-UI** — klassenTyp-Feld vorhanden, UI für Phasen-Auswahl noch nicht

---

## Session 31 — 12 Demo-Prüfungs-Bugs (28.03.2026)

Bugfixes aus dem ersten Demo-Test aller neuen Fragetypen.

| # | Bug | Fix |
|---|-----|-----|
| 1 | PDF Text-Tool: Extra "Text Einfügen"-Klick | ToolbarDropdown: onIconClick aktiviert Werkzeug direkt, ▾ nur für Optionen |
| 2 | PDF Farben überlappen, kein Farbwechsel selektierter Elemente | Farbkreise 28px + Rand, onFarbeWechsel aktualisiert selektierte Annotation |
| 3 | PDF Doppelklick-Deselect hängt | editierendeAnnotation bei Klick ausserhalb beendet |
| 4 | Navigation-Leiste scrollt weg | sticky top-0 mit eigenem Container + Schatten |
| 5 | Demo: Sperre bei Verstössen | istDemoModus-Flag in useLockdown — nur Warnung, keine Sperre |
| 6 | Frage 16 "Letzte Aufgabe" | Text zu "Feature-Check!" geändert |
| 7 | Sortierung nur Pfeile | HTML5 Drag&Drop + Drag-Handle (⠿) + visuelles Feedback |
| 8 | Hotspot/Bildbeschriftung/DragDrop: Bilder nicht geladen | Wikipedia-URLs → lokale SVG-Bilder in public/demo-bilder/ |
| 9 | Audio-Aufnahme verlässt Vollbild + Verstoss | Schonfrist-Event (8s) vor getUserMedia + Vollbild-Wiederherstellung |
| 10 | Code-Editor: Tab wechselt Button | indentWithTab aus @codemirror/commands |

**Dateien:** 10 geändert, 3 neue SVGs (`public/demo-bilder/`). 161 Tests grün.

---

## Session 30 — Plattform-Öffnung für alle Fachschaften (28.03.2026)

Grosse Architektur-Generalisierung + 10 neue Features/Fragetypen. 5 Pläne umgesetzt.

### Strang 1: Architektur-Generalisierung

| # | Feature | Details |
|---|---------|---------|
| 1 | **SchulConfig** | Zentrale Config (Schulname, Domains, Fächer, Gefässe, Tags) als Zustand-Store. Hardcodierte Fallback-Werte. Backend-Endpoint `ladeSchulConfig`. |
| 2 | **fachbereich → fach + tags** | `Fachbereich`-Enum entfernt. Neues `fach: string` + `tags: Tag[]` (3 Ebenen: Fachschaft, Querschnitt, Persönlich). ~45 Dateien migriert. |
| 3 | **fachschaft → fachschaften** | LP kann mehrere Fachschaften haben (`string[]`). AuthUser, LPInfo, authStore angepasst. |
| 4 | **Branding konfigurierbar** | Login-Logo, Schulname, Domains, PDF-Header, SEB-Titel aus schulConfig statt hardcodiert. |
| 5 | **Gefässe erweiterbar** | `Gefaess`-Enum → `string` mit Validierung gegen Config. FF (Freifach) hinzugefügt. |
| 6 | **Fragetypen-Sichtbarkeit** | LP kann Fragetypen ein-/ausblenden (localStorage). FiBu-Typen nur für WR-Fachschaft. |
| 7 | **Punkte ↔ Bewertungsraster** | Gesamtpunkte automatisch aus Raster-Summe berechnet. Punkte-Feld read-only bei Raster. |
| 8 | **klassenTyp** | `'regel' | 'taf'` Feld auf PruefungsConfig (UI für Phasen-Auswahl später). |
| 9 | **Backend-Migration** | `migriereFachbereich_()` Endpoint, `fachschaftZuFach_()`, fach-Feld in allen Endpoints. |

### Strang 2: Neue Features

| # | Feature | Typ | Details |
|---|---------|-----|---------|
| A1 | **Wörterzähler** | Erweiterung | Min/Max-Wortlimit für Freitext. Amber/Rot-Warnung bei Unter-/Überschreitung. |
| A2 | **Inline-Choice** | Erweiterung | Lückentext mit Dropdown-Optionen. `dropdownOptionen?: string[]` pro Lücke. Auto-Korrektur unverändert. |
| A3 | **Rechtschreibprüfung** | Erweiterung | LP deaktiviert pro Prüfung. Sprach-Dropdown (de/fr/en/it). `spellCheck`+`lang` Attribute. |
| A4 | **Rich-Text-Panel** | Erweiterung | `typ: 'richtext'` im Material-System. DOMPurify-Sanitierung, prose-Styling. |
| A5 | **LaTeX in Aufgaben** | LP-Tool | `$...$` / `$$...$$` in Fragentext. KaTeX lazy-loaded (259KB separater Chunk). LatexText-Komponente. |
| A6 | **Code in Aufgaben** | LP-Tool | CodeMirror read-only Blöcke. 7 Sprachen. Light/Dark Theme. Lazy-loaded. |
| B1 | **Sortierung** | Neuer Fragetyp | Reihenfolge per ↑/↓-Buttons. Auto-Korrektur mit Teilpunkten. |
| B2 | **Hotspot** | Neuer Fragetyp | Klickbereiche auf Bild (Rechteck/Kreis). %-basierte Koordinaten. Auto-Korrektur. |
| B3 | **Bildbeschriftung** | Neuer Fragetyp | Textfelder auf Bild positioniert. Case-insensitiv mit Alternativen. Auto-Korrektur. |
| C1 | **Medien-Einbettung** | Feature | Audio/Video direkt in Fragen. MedienPlayer mit Abspiel-Limit. |
| C2 | **Audio-Aufnahme** | Neuer Fragetyp | MediaRecorder API. WebM/Opus. Base64-Speicherung. Manuelle Korrektur. |
| C4 | **Drag & Drop Bild** | Neuer Fragetyp | Labels auf Bildzonen ziehen. HTML5 Drag API. Distraktoren. Auto-Korrektur. |
| D1 | **Code-Editor** | Neuer Fragetyp | CodeMirror editable. 7 Sprachen. Starter-Code. Manuelle + KI-Korrektur. |
| D2 | **Formel-Editor** | Neuer Fragetyp | LaTeX-Eingabe + KaTeX-Vorschau. Symbolleiste. Auto-Korrektur (normalisiert). |

**Fragetypen total:** 13 → 20 (7 neue: sortierung, hotspot, bildbeschriftung, audio, dragdrop_bild, code, formel)

**Dependencies neu:** KaTeX (~259KB, lazy), CodeMirror 6 (~150KB, lazy)

**Tests:** 161 (von 131 auf 161, +30 neue Tests)

**Spec:** `docs/superpowers/specs/2026-03-28-oeffnung-plattform-design.md`
**Pläne:** `docs/superpowers/plans/2026-03-28-architektur-generalisierung.md`, `docs/superpowers/plans/2026-03-28-quick-wins-a1-a4.md`

**Wichtig:** Apps Script muss neu deployed werden für schulConfig-Endpoint + fach-Feld + Migration.

---

## Session 29 — Sicherheit, Fachbereich, Autokorrektur, KI-Vorschlag (27.03.2026)

| # | Feature | Details |
|---|---------|---------|
| 1 | **"KI-Korrektur" → "Autokorrektur"** | Button und Texte umbenannt (KorrekturAktionsLeiste, KorrekturDashboard, HilfeSeite, korrekturApi). "KI:" Label dynamisch nach Quelle (Auto/KI). |
| 2 | **Fachbereich nur bei WR** | Fachbereich-Dropdown nur bei LP-Fachschaft WR. Neue Werte: 'Informatik', 'Allgemein'. Default aus Fachschaft abgeleitet. Filter nur bei mehreren Fachbereichen. |
| 3 | **Tests erweitert (46→89)** | Neues `fachbereich.test.ts` (26 Tests). Erweiterte korrekturUtils + autoKorrektur Tests. |
| 4 | **Rate-Limiting Schülercode** | Max 5 Fehlversuche/15 Min pro E-Mail via CacheService. Counter bei Erfolg zurückgesetzt. |
| 5 | **Session-Tokens für SuS** | `generiereSessionToken_()` bei Login (UUID, 3h TTL). `validiereSessionToken_()` in speichereAntworten + heartbeat. Frontend sendet Token automatisch (apiClient). |
| 6 | **Auth-Audit** | Alle 18 LP-Endpoints haben `istZugelasseneLP()`-Checks ✅ |
| 7 | **KI-Anonymisierung** | DATENSCHUTZ-Kommentar-Guards in batchKorrektur, korrigiereZeichnung, korrigierePDFAnnotation. Verifiziert: Keine Schüler-Identifikatoren in Claude-Prompts. |
| 8 | **KI-Vorschlag Freitext** | Neuer Backend-Case `korrigiereFreitext` in kiAssistentEndpoint. Frontend: "KI-Vorschlag"-Button in KorrekturFrageZeile (amber, nur bei Freitext). onUpdate erweitert um kiPunkte/kiBegruendung/quelle. |

**Backend-Dateien:** `apps-script-code.js` (Rate-Limiting, Session-Tokens, korrigiereFreitext, DATENSCHUTZ-Guards)
**Frontend-Dateien:** `KorrekturAktionsLeiste.tsx`, `KorrekturDashboard.tsx`, `KorrekturFrageZeile.tsx`, `KorrekturSchuelerZeile.tsx`, `useKorrekturActions.ts`, `HilfeSeite.tsx`, `korrekturApi.ts`, `MetadataSection.tsx`, `FragenBrowserHeader.tsx`, `FragenEditor.tsx`, `fachbereich.ts`, `fragen.ts`, `auth.ts`, `apiClient.ts`, `klassenlistenApi.ts`, `LoginScreen.tsx`
**Tests:** `fachbereich.test.ts` (neu), `korrekturUtils.test.ts`, `autoKorrektur.test.ts`

**Wichtig:** Apps Script muss neu deployed werden für Rate-Limiting, Session-Tokens und KI-Freitext-Endpoint.

---

## Session 28 — Backend-Performance + Fragenbank-Store (27.03.2026)

| # | Feature | Details |
|---|---------|---------|
| 1 | **Backend CacheService** | Globaler Cache für Configs, Fragenbank, Tracker (TTL 5 Min). Versions-Counter invalidiert bei Writes. Auto-Chunking für >90KB Daten. Sichtbarkeits-Filter NACH Cache-Lesen. |
| 2 | **Cache-Invalidierung** | `doPost` invalidiert Cache bei allen schreibenden Aktionen (speichereConfig, speichereFrage, beendePruefung, etc.) |
| 3 | **fragenbankStore.ts** | Zustand-Store: Fragenbank 1× beim Login laden, von Composer + FragenBrowser + Dashboard geteilt. Kein 3-facher API-Call mehr. |
| 4 | **"laden..." statt "nicht gefunden"** | AbschnitteTab + VorschauTab zeigen Lade-Status während Fragenbank noch lädt |
| 5 | **LP-Info Optimierung** | `ladeAlleConfigs` + `ladeFragenbank` nutzen `istSichtbarMitLP`/`ermittleRechtMitLP` (LP-Info 1× vorladen) |
| 6 | **Timeouts zurückgesetzt** | 60s→30s (Standard) für alle API-Calls — mit Cache nicht mehr nötig |

**Backend-Dateien:** `apps-script-code.js` (Cache-System: `cacheGet_`, `cachePut_`, `cacheInvalidieren_` + optimierte Endpoints)
**Frontend-Dateien:** `fragenbankStore.ts` (neu), `LPStartseite.tsx`, `PruefungsComposer.tsx`, `FragenBrowser.tsx`, `AbschnitteTab.tsx`, `VorschauTab.tsx`, `fragenbankApi.ts`, `trackerApi.ts`, `apiClient.ts`

**Wichtig:** Apps Script muss neu deployed werden. Erster Login nach Deploy = Cold Cache (langsam wie bisher). Ab zweitem Login/Reload = Cache-Hit (<5s).

---

## Session 27 — Demo-Daten, Auth-Bugfix, Code-Hygiene (27.03.2026)

| # | Feature | Details |
|---|---------|---------|
| 1 | **LP-Auth-Bugfix** | `ladeLehrpersonen()` nutzte Dummy-Email `check@gymhofwil.ch` → Backend blockierte mit "Nicht autorisiert". Fix: Echte User-Email durchreichen von `anmelden()` → `ladeUndCacheLPs(email)` → `ladeLehrpersonen(email)` |
| 2 | **Demo-Korrekturdaten** | Neue `demoKorrektur.ts`: Beispiel Beat (35/40, korrigiert, Note 5.5) + Brunner Hans (abgegeben, offen). KorrekturDashboard zeigt im Demo-Modus realistische Auswertung |
| 3 | **Demo-Lockdown-Verstösse** | Keller David: 3/3 gesperrt mit Entsperren-Button. Weber Felix: 1/3 amber Warnung. Einrichtungsprüfung: `kontrollStufe: 'standard'` |
| 4 | **Code-Hygiene** | Dummy-Email-Fallback entfernt (lpApi.ts). pruefungApi.ts: `return false` statt stille `true`-Simulation. Persönliche Email aus demoLPs entfernt. PDFKorrektur: TODO-Placeholder → echter `kiAssistent('korrigierePDF')`-Call |
| 5 | **Collapsible-Harmonisierung** | ▼ rechtsbündig für grosse Sections (Ergebnis-Übersicht, Aufgabengruppe, SchülerZeile). ▶ links für Inline-Toggles (Notenskala, Fragen-Analyse, Teilnehmer, KontrollStufe) |

**Dateien geändert:** `demoKorrektur.ts` (neu), `demoMonitoring.ts`, `einrichtungsPruefung.ts`, `authStore.ts`, `lpApi.ts`, `pruefungApi.ts`, `useKorrekturDaten.ts`, `PDFKorrektur.tsx`, `PDFEditor.tsx`, 4 Collapsible-Komponenten

---

## Session 26 — Multi-Teacher Frontend-UI komplett (27.03.2026)

| # | Feature | Details |
|---|---------|---------|
| 1 | LP-Liste laden | `ladeUndCacheLPs()` exportiert, FragenEditor + VorbereitungPhase laden LP-Liste dynamisch |
| 2 | API-Wrapper | `sharingApi.ts`: `setzeBerechtigungen()`, `dupliziereFrage()`, `duplizierePruefung()` |
| 3 | Duplikat-Buttons | Copy-Icon in DetailKarte + KompaktZeile (FragenBrowser), "Duplizieren" in PruefungsKarte |
| 4 | Rechte-Badges | Bearbeiter (blau) / Betrachter (grau) in DetailKarte + KompaktZeile, `_recht` vom Backend |
| 5 | Prüfungs-Sharing | BerechtigungenEditor in VorbereitungPhase (Privat/Fachschaft/Schule + individuelle LP) |
| 6 | Demo-Modus | Duplikat-Button erstellt lokale Kopie, Demo-LPs für Dropdown, Demo-Fragen mit _recht-Badges |
| 7 | Hilfe-Seite | Neue Kategorie "Zusammenarbeit" (Rollen, Sichtbarkeit, Duplizieren, Badges) |

**Multi-Teacher Phase 5 jetzt komplett:** Backend + Frontend fertig. Alle 4 offenen Punkte (LP-Liste, Duplikat, Badges, Sharing-UI) erledigt.

---

## Multi-Teacher-Architektur (27.03.2026)

Zentralisierte Multi-LP-Vorbereitung (2–50 LP am Hofwil).

| Phase | Was | Status |
|-------|-----|--------|
| 1 | **LP-Verwaltung**: Lehrpersonen-Tab in CONFIGS-Sheet, `istZugelasseneLP()` ersetzt hardcodierte Allowlist (~40 Stellen), `ladeLehrpersonen` Endpoint, Frontend auth dynamisch | ✅ Code fertig |
| 2 | **Prüfungs-Isolation**: `erstelltVon` Feld, Filter in `ladeAlleConfigs()`, Ownership-Checks in `speichereConfig/loeschePruefung` | ✅ Code fertig |
| 3 | **Fachschaft-Sharing**: `geteilt: 'fachschaft'` Stufe, `fachschaftZuFachbereiche()` Mapping, Filter in `ladeFragenbank()`, 3-Wege-Select im Frageneditor | ✅ Code fertig |
| 4 | **Per-LP API Key**: `getApiKeyFuerLP()`, `callerEmail` Parameter in allen Claude-Calls | ✅ Code fertig |
| 5 | **Rechte-System**: Google-Docs-Modell (Inhaber/Bearbeiter/Betrachter), `hatRecht()`/`istSichtbar()`/`ermittleRecht()`, BerechtigungenEditor-Komponente, Duplikat-/Berechtigungs-Endpoints | ✅ Komplett (Backend + Frontend + Demo) |

**Aktivierung:** ✅ Lehrpersonen-Tab + erstelltVon-Backfill erledigt (27.03.2026). Apps Script deployed.

**Datenmodell Berechtigungen** (JSON-Array pro Frage/Prüfung):
```
berechtigungen: [
  { email: "*", recht: "betrachter" }                    // Schulweit
  { email: "fachschaft:WR", recht: "betrachter" }        // Fachschaft
  { email: "kollegin@gymhofwil.ch", recht: "bearbeiter" } // Individuell
]
```
Rollen: Inhaber (alles) > Bearbeiter (ändern, nicht löschen) > Betrachter (lesen + duplizieren).
API-Key-Kaskade: LP → Fachschaft (`_fachschaft_wr@intern`) → Schule (`_schule@intern`) → Global.

**Dateien geändert:**
- `apps-script-code.js` — ~100 Stellen (LP-Checks, Helpers, Endpoints, Filter, API-Key-Routing)
- `src/store/authStore.ts` — Dynamische LP-Liste statt Allowlist
- `src/types/auth.ts`, `pruefung.ts`, `fragen.ts` — Neue Felder
- `src/services/lpApi.ts` — Neuer Service
- `src/hooks/useFragenFilter.ts` — Erweiterte Filter
- `src/utils/fragenFactory.ts` — geteilt-Enum erweitert
- `src/components/lp/frageneditor/` — 3-Wege Sharing UI

---

## Session 25 — 8 UI-Fixes + KI-Prompt-Verbesserung (27.03.2026)

| # | Task | Fix |
|---|------|-----|
| B42 | PDF Text-Tool Fallback 16px | `\|\| 16` → `\|\| 18` (konsistent mit Default) |
| R/F | Richtig/Falsch Alignment | Buttons: `flex items-center justify-center gap-2` statt inline |
| FiBu | Bilanzsumme zu breit | `w-32` → `w-24` (gleich wie KontoRow) |
| FiBu | Bilanz Seite-Dropdown | 4 Optionen: Aktiven, Passiven, Aufwand, Ertrag |
| FiBu | Kontenhauptgruppe Freitext | Dropdown mit 11 KMU-Kontenhauptgruppen |
| FiBu | T-Konto Titel | Zentriert + Soll/Haben + (+)Zunahme/(−)Abnahme Dropdowns |
| iPad | PDF Stifteingabe | `touchAction: 'none'` auf Container bei Freihand |
| iPad | Auto-Tastatur | `requestAnimationFrame` statt `setTimeout` für iOS Focus |
| UX | Material Side-Panel | Drag-Resize am linken Rand (300px–80vw) |
| KI | Korrektur-Prompts | Gemeinsamer System-Prompt: 0.5-Schritte, Bloom-Stufe, Bewertungsraster, sachliche Begründung |

**KI-Prompt-Architektur:** Neuer `korrekturSystemPrompt()` (gemeinsam für Zeichnung + PDF). Frontend schickt `bloom`, `bewertungsraster`, `lernziel` an beide Endpoints. Apps Script muss neu deployed werden.

---

## Session 24 — Toolbar-Redesign + Zeichnen-Features + Fixes (27.03.2026)

Toolbar komplett neu gebaut: Alle Optionen als Modal-Dropdown-Menüs (Farben 3×3 Grid, Stift Stärke+Stil, Formen, Text Grösse+Fett+Rotation). Beide Toolbars (Zeichnen + PDF) konsequent harmonisiert. Default vertikal, Toggle als erstes Element.

| Bereich | Änderungen |
|---------|-----------|
| Toolbar-Menüs | Stift ▾ (3 Stärken + gestrichelt), Formen ▾ (Linie/Pfeil/Rechteck/Ellipse), Text ▾ (Grösse/Fett/Rotation), Farben ▾ (3×3 Grid) |
| ToolbarDropdown | Neue shared Komponente, Modal-Overlay (absolute), `components/shared/ToolbarDropdown.tsx` |
| Ellipse | Neuer DrawCommand-Typ, Rendering, Hit-Testing, Bounding-Box, im Editor wählbar |
| Gestrichelt | `gestrichelt?: boolean` auf Stift/Linie/Pfeil/Rechteck/Ellipse, `ctx.setLineDash()` |
| PDF-Toolbar | Stift-Menü (Stärke+Stil) + Farben-Menü + Alles-Löschen + SVG Radierer-Icon |
| Selektierte Elemente | Farbwechsel aktualisiert selektiertes Element (C1) |
| Layout | T-Konten Saldo + Bilanzsumme unter Betrag-Feldern ausgerichtet |
| Demo | Zweites PDF-Material (OR-Auszug), alle 6 Zeichenwerkzeuge in Demo-Frage |
| Fragenbank | Ellipse im CanvasConfig-Typ + ZeichnenEditor aufgenommen |

---

## Session 23 — 16 Bugfixes & UX aus Live-Test (27.03.2026)

| # | Task | Fix |
|---|------|-----|
| B47 | Zeichnen: Striche gehen bei kurzem Zeichnen verloren | Root-Cause: 2s-Debounce in ZeichnenFrage entfernt (Store-Update verzögert → Datenverlust bei Fragewechsel/Remote-Save). 400ms Canvas-Debounce reicht. |
| B48 | Alles-Löschen verlässt Vollbild (Chrome confirm-Popup) | React-Modal statt `window.confirm()` in ZeichnenToolbar.tsx |
| B49 | Neues Textfeld erbt Rotation vom letzten | `setTextRotation(0)` nach Text-Commit via onTextCommit-Callback |
| B50 | Fortschritt-Diskrepanz SuS 100% vs LP 89% | Heartbeat nutzt jetzt `istVollstaendigBeantwortet()` + sendet `gesamtFragen` |
| B51 | LP zeigt 0% nach Abgabe | Echter Fortschritt beibehalten + finaler Heartbeat vor Abgabe-Flag |
| B52 | Formatierung-Aufgabe zeigt HTML-Tags | DOMPurify-Rendering in FreitextAnzeige (KorrekturFrageVollansicht.tsx) |
| B53 | Auto-Korrektur markiert korrekt, vergibt keine Punkte | `lpPunkte = kiPunkte` bei auto-korrigierbaren Typen (KorrekturDashboard.tsx) |
| B54 | Kommentar ohne Punkte markiert als geprüft | `geprueft: true` nur wenn auch Punkte vorhanden (KorrekturFrageZeile.tsx) |
| U1 | Radierer-Icon (Besen → Radierer) | SVG Radierer-Icon in ZeichnenToolbar.tsx |
| U2 | FiBu Buchungssatz vereinfachen | Neues Format: "Soll-Konto an Haben-Konto Betrag" (Breaking Change, 13 Dateien) |
| U3 | FiBu T-Konten Saldo beidseitig | Saldo-Feld auf beiden Seiten, kein Dropdown (Breaking Change) |
| U4 | SuS-Übersicht: Punkte-Anzeige + Link oben | Keine "beantwortet/gesamt P." mehr, Übersicht-Link über Fragen-Kacheln |
| U5 | Fachbereich-Badge redundant | Fachbereich-Badge unten in Sidebar entfernt |
| U6 | Korrektur: Aufgabennummern fehlen | "Aufgabe N" als Label in KorrekturFrageZeile.tsx |
| U7 | Warnung bei leeren Punkten | Amber-Warnung + Einsicht-Freigabe blockiert + Export/Feedback mit Bestätigung |
| U8 | Beenden-Button nach Ende → grau | "Prüfung beendet ✓" wenn config.beendetUm gesetzt |

| B55 | Kontrollstufe locker: Verstösse nicht gezählt | Zähler hochzählen ohne Sperre (Logging im Monitoring sichtbar) |

**Breaking Changes:** FiBu-Typen Buchungssatz + T-Konten haben neues Datenformat (keine alten Prüfungen betroffen).

---

## Refactoring — lp/ Sub-Module + Vitest (27.03.2026)

Kein Funktionsumfang geändert — reine Wartbarkeits-Verbesserung. `tsc -b` + `npm run build` + 46 Tests grün.

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| `KorrekturDashboard.tsx` | 1007 Z. | 579 Z. (+ 5 Sub-Komponenten) |
| `App.tsx` | 341 Z. | 263 Z. |
| `Layout.tsx` | 588 Z. | 515 Z. |
| `components/lp/` | 35+ flache Dateien | 4 Sub-Module mit `index.ts` |
| Tests | 0 | 46 (4 Dateien) |

Sub-Module: `lp/korrektur/`, `lp/durchfuehrung/`, `lp/vorbereitung/`, `lp/fragenbank/`

Neue Dateien: `fragenResolver.ts` (löst zirkuläre Abhängigkeit App↔Layout), `FrageRenderer.tsx`, `AbgabeBestaetigung.tsx`, `useEditableList.ts`, `useLPNachrichten.ts`

---

## Session 22 — 4 Bugfixes aus Live-Test (26.03.2026 Nacht, 2. Runde)

| Task | Problem | Fix |
|------|---------|-----|
| B44 | Kontrollstufe auto-upgrade (LP setzt 'locker', SuS sieht 'standard') | Fallback `\|\| 'standard'` → `\|\| 'keine'` in Layout.tsx |
| B45 | Entsperren funktioniert nicht (sofortige Re-Sperre nach Entsperrung) | 5s Schonfrist + auto Vollbild-Wiederherstellung in useLockdown.ts |
| B46 | 'abgegeben' statt 'beendet-lp' bei LP-Beenden | `beendetUm` hat Vorrang vor `istAbgabe` in apps-script-code.js |
| B43 | Rotierter Text nicht anwählbar | Inverse Rotation vor AABB-Test in useDrawingEngine.ts |

---

## Session 21 — Scroll-Bug + Beenden-Button (26.03.2026 Nacht)

| Task | Problem | Fix |
|------|---------|-----|
| B41 | Fragetext überlappt Antwortbereich beim Scrollen | `sticky top-0 z-10` aus allen 12 Fragetypen entfernt |
| B38b | Beenden-Button hängt (nach Prüfung mit 0 aktiven SuS) | `setBeendenLaeuft(false)` + 30s Timeout in AktivPhase.tsx |

---

## Session 20 — Root-Cause-Fixes (26.03.2026 Abend)

| Task | Problem | Fix |
|------|---------|-----|
| B39b | PDF Endloser Spinner | `usePDFRenderer.ladePDF()` schluckte Fehler intern (kein `throw`) → Fallback-Kette kaputt. `throw e` nach `setState('error')`. |
| B39a | Material-PDF lädt nicht | `sandbox`-Attribut auf iframe blockierte Chrome PDF-Plugin → entfernt |
| B38 | Beenden hängt (Frontend) | Fehlender `.catch()` auf Promise-Chain in AktivPhase.tsx |
| B40 | Demo-Prüfung WR erscheint wieder | Hardcodierten Demo-Config in DurchfuehrenDashboard durch `einrichtungsPruefung` ersetzt |

⚠️ Sessions 18–19 hatten Symptom-Fixes für B38/B39. S20 fand die eigentlichen Root Causes.

---

## Sessions 18–19 — Live-Test Bugfixes (26.03.2026)

| Task | Problem | Fix |
|------|---------|-----|
| B37 | SuS Reload = Datenverlust | Recovery-Ladescreen in Layout.tsx, neue Store-Action `setConfigUndFragen` |
| B35 | Kontrollstufe 'locker' sperrt nach 3 Verstössen | Guard `if (effektiv === 'keine') return` in useLockdown.ts |
| B36 | LP-Entsperrung Race (Heartbeat überschreibt LP-Unlock) | `entsperrt=true` → Client-lockdownMeta ignorieren in apps-script-code.js |
| B38 | Beenden hängt (Backend) | Batch-Write + 30s Timeout → Root Cause in S20 gefunden |
| B39 | PDF lädt nicht | CSS/iframe-Fixes → Root Cause in S20 gefunden |

---

## Sessions 12–17 — Live-Tests (25.–26.03.2026)

Alle Bugs behoben. Wichtige Architektur-Entscheide:

- **Antworten-Master-Spreadsheet (T8, S14):** Statt Einzeldateien pro Prüfung → zentrales Sheet (`ANTWORTEN_MASTER_ID`) mit Tabs `Antworten_`, `Korrektur_`, `Nachrichten_` pro Prüfung. Google Workspace blockierte DriveApp-Schreibzugriffe für neue Prüfungen.
- **Performance (P1, S15):** `ladeEinzelConfig`-Endpoint (~50KB→~1KB), Polling-Frequenzen (Monitoring: 5s/15s, Config: 30s), ~40% weniger Connections.
- **speichereConfig Partial-Update (T9, S14):** Nur explizit gesendete Felder werden geschrieben (`hasOwnProperty`-Guard) — verhindert, dass fehlende Felder mit Defaults überschrieben werden.
- **Autosave Race-Fix (T10, S14):** `pruefungRef.current` statt Closure-Variable + `speichertRef`-Guard gegen parallele Saves.
- **Farbsystem (S13):** Leer = violett (Aufmerksamkeit), Beantwortet = neutral + ✓, Unsicher = amber — gilt für alle 13 Fragetypen.

---

## Feature-Übersicht

| Datum | Features |
|-------|---------|
| 17.03. | Basis: Auth, Fragen, Abgabe, Timer, Monitoring, AutoSave |
| 18.03. | Warteraum, CSV-Export, Statistiken, Zeitzuschläge, Dark Mode |
| 19.03. | UI/UX, Dateianhänge, KI-Assistent, SuS-Vorschau, Organisation |
| 20.–21.03. | FiBu-Fragetypen (4 Typen), Aufgabengruppen, Pool-Sync, Rück-Sync |
| 22.–24.03. | Farbkonzept, Trennschärfe, Korrektur-Freigabe, Tool-Synergien, Kurs-Sync |
| 23.03. | Zeichnen-Fragetyp (Canvas, 7 Tools, KI-Korrektur) |
| 24.03. | PDF-Annotation, Backup-Export Excel, Erster Klassentest |
| 25.03. | Performance, Import-Tool, Master-Spreadsheet, Soft-Lockdown, Multi-Prüfungs-Dashboard |
| 26.03. | 5 Live-Test-Runden (22 Sessions), Session-Recovery, SEB-Vollintegration |
| 27.03. | Refactoring: Sub-Module, Vitest, 46 Tests |

---

## Environment-Variablen

| Variable | Beschreibung | Wo setzen |
|----------|-------------|-----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client-ID | `.env.local` / GitHub Secrets |
| `VITE_APPS_SCRIPT_URL` | Apps Script Web-App URL | `.env.local` / GitHub Secrets |

Ohne Variablen: **Demo-Modus** (Schülercode + Einrichtungsprüfung, 16 Fragen, alle 13 Fragetypen).

## Google Workspace Setup

Alle 7 Teile erledigt (OAuth, Sheets, Apps Script, GitHub Actions, E2E, Fragenbank, KI-Korrektur). Details: `Google_Workspace_Setup.md`
