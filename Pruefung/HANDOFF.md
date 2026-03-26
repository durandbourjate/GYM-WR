# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

---

## Offene Punkte (nächste Session)

- **Manuelle Punktevergabe** — Korrektur-Tab noch nicht live getestet
- **SEB / iPad** — SEB weiterhin deaktiviert (`sebErforderlich: false`)
- **Zeichnen Text-Werkzeug** — Grundfunktion live testen (Rotation, Grösse, Fett)
- **Apps Script Code aktualisieren** — Session 19 Änderungen (Safety-Net entfernt, Individual-Beenden Batch-Write) in apps-script-code.js. User muss Code kopieren und neu bereitstellen.

### Session 19 — 4 Bugfixes + 1 UX (26.03.2026 Abend)

| Task | Beschreibung | Root Cause | Fix | Dateien |
|------|-------------|------------|-----|---------|
| B39a | **Material-PDF nicht volle Höhe im Split-Modus** | `MaterialInhalt` nutzte `h-full` (percentage height), aber Parent hatte Höhe via Flex, nicht explizit → `h-full` löste zu 0px auf. 5× vorher gefixt (B29, B36, B38, T4) — immer am Symptom. | Durchgehende Flex-Kette: Content-Wrapper → `flex flex-col`, alle Kind-Container `flex-1 min-h-0` statt `h-full`. Layout.tsx Breiten-Fix (war 55%+55%=110%). | MaterialPanel.tsx, Layout.tsx |
| B39b | **PDF in Frage 10 lädt nicht (endloser Spinner)** | `PDFFrage.tsx` `if-else if` Kette: Wenn `ladeDriveFile()` fehlschlug, kein Fallback auf `pdfUrl`/`pdfDateiname`. Renderer blieb `idle` → Spinner endlos. | Sequentielle Fallback-Kette: Base64 → Drive → URL → Dateiname. Neuer `ladeFehler`-State verhindert endlosen Spinner. | PDFFrage.tsx |
| B38 | **"Beenden" hängt** (LP-seitig, trotz Batch-Write) | Safety-Net in `beendePruefungEndpoint` blockierte Response: Las+schrieb Antworten-Sheet NACH Config-Update, aber gleichzeitige Heartbeat-Schreibzugriffe (25+ SuS) blockierten via implizitem Spreadsheet-Lock. | Safety-Net komplett entfernt. Response sofort nach Config-Update. Heartbeats der SuS erkennen `beendetUm` und lösen Abgabe clientseitig aus. + Individual-Beenden auf Batch-Write umgestellt. | apps-script-code.js |
| U33 | **KontrollStufe Toggle kaum sichtbar** | iPad-Hinweis + Toggle hatten identisches Styling (`text-xs text-blue-600`). Toggle sah aus wie Info-Text. | Titel "Kontrollstufe ▼" klickbar. Details als 4-Spalten-Grid unter den Stufen-Buttons mit Bullet Points. iPad-Hinweis nur im aufgeklappten Zustand. | KontrollStufeSelect.tsx |
| Fix | **Einrichtungsprüfung Material-URL fehlte** | Material hatte `dateiname` aber kein `url` → MaterialPanel konnte nichts laden. | `url: './materialien/witzsammlung.pdf'` hinzugefügt. | einrichtungsPruefung.ts |

### Geänderte Dateien (6 Dateien, Session 19)

```
src/components/lp/KontrollStufeSelect.tsx           — U33 (Spalten-Layout)
src/components/MaterialPanel.tsx                     — B39a (Flex-Kette)
src/components/Layout.tsx                            — B39a (Breiten-Fix)
src/components/fragetypen/PDFFrage.tsx                — B39b (Fallback-Kette + ladeFehler)
src/data/einrichtungsPruefung.ts                     — Fix (Material-URL)
apps-script-code.js                                  — B38 (Safety-Net entfernt, Individual Batch-Write)
```

### Hinweis
**Apps Script aktualisieren:** Code in Editor einfügen → Bereitstellen → Bereitstellungen verwalten → Stift-Icon → "Neue Version" → Bereitstellen. URL bleibt gleich.

### Weiteres (niedrigere Priorität)

- **Manuelle Punktevergabe** — Korrektur-Tab noch nicht live getestet
- **SEB / iPad** — SEB weiterhin deaktiviert (`sebErforderlich: false`)
- **Zeichnen Text-Werkzeug** — Grundfunktion live testen (Rotation, Grösse, Fett)
- **Apps Script Code aktualisieren** — B36 (Entsperrung Race) + B38 (Batch-Write) bereitgestellt? User muss **neue Bereitstellung** erstellen (nicht nur speichern).

### Session 18 — 5 Bugfixes aus Klassentest (26.03.2026 Nachmittag)

| Bug | Beschreibung | Fix | Dateien |
|-----|-------------|-----|---------|
| B37 | **SuS Reload = Datenverlust** (config/fragen nicht persistiert → Fehlerscreen → zuruecksetzen löscht Antworten) | Recovery-Ladescreen in Layout.tsx: lädt config+fragen vom Backend, behält Antworten. Neue Store-Action `setConfigUndFragen`. Bestätigungsdialog vor Reset. ✅ **FUNKTIONIERT** | Layout.tsx, App.tsx, pruefungStore.ts |
| B39 | **PDF lädt nicht** (Material-Split + PDF-Frage) | CSS-Fix `h-0` → `min-h-0` + iframe `absolute inset-0` zurück. ⚠️ **NICHT GELÖST** — siehe offene Punkte oben (B39a, B39b) | MaterialPanel.tsx, Layout.tsx |
| B35 | **Kontrollstufe 'locker' sperrt** nach 3 Tab-Wechseln | Guard in `registriereVerstoss`: `'locker'` return wie `'keine'`. `onKontrollStufeOverride` implementiert (war No-Op). | useLockdown.ts, Layout.tsx |
| B36 | **LP-Entsperrung Race** (Heartbeat überschreibt LP-Unlock) | Im Heartbeat: wenn `entsperrt=true`, Client-lockdownMeta ignorieren + `gesperrt=false` forcieren. | apps-script-code.js |
| B38 | **"Beenden" hängt** (50+ einzelne setValue-Calls) | Backend: Batch-Write. Frontend: 30s-Timeout. ⚠️ **NICHT GELÖST** — zusätzliche Root Cause: `pruefungApi.ts` nutzt raw `fetch()` ohne Timeout. Siehe offene Punkte oben. | apps-script-code.js, BeendenDialog.tsx, pruefungApi.ts |

### Erledigt (26.03.2026)
- ~~K1~~ `.env.local` + GitHub Secret korrekt ✅
- ~~K2~~ `ANTWORTEN_MASTER_ID` gesetzt ✅
- ~~U13~~ Ergebnisse + Korrektur im Auswertung-Tab ✅
- ~~P1~~ Performance optimiert ✅
- ~~B35~~ Fortschritt 0% Fix ✅
- ~~B36~~ Material-PDF Höhe ✅
- ~~B37~~ Demo-PDF URL ✅
- ~~U33~~ Lösch-Bestätigung ✅
- ~~U34~~ Tab-öffnen Button entfernt ✅
- ~~U35~~ Vollbild nach Abgabe verlassen ✅
- ~~Cleanup~~ Fallback-Code + Alias-Funktionen entfernt ✅
- ~~Material-Link~~ Blauer Link entfernt + Button-Touch-Target ✅
- ~~Material-Höhe~~ CSS-Kette überarbeitet (h-full+overflow-hidden) ✅
- ~~PDF-Laden~~ pdfDriveFileId vor pdfUrl priorisiert ✅
- ~~Text-Rotation~~ Selektierte Texte rotierbar via UPDATE_COMMAND ✅
- ~~Text-Formatierung~~ S/M/L/XL + Bold in Toolbar ✅

---

## Session 26.03.2026 (17) — Material + Zeichnen Text-Formatierung

### Status: ERLEDIGT (6 Tasks)

| Task | Beschreibung | Datei(en) |
|------|-------------|-----------|
| U36 | **Blauer Material-Link entfernt**: Duplizierte den Header-Button. Material-Button Touch-Target auf 44px vergrössert. | Layout.tsx |
| B38 | **Material-Panel Höhe**: CSS-Kette überarbeitet — `h-full` + `overflow-hidden` + `style.minHeight:0` auf allen Ebenen. Alle Inhalt-Container (PDF, Video, Link) auf `h-full flex flex-col overflow-hidden` vereinheitlicht. | MaterialPanel.tsx |
| B39 | **PDF in Frage**: `pdfDriveFileId` wird jetzt VOR `pdfUrl` geprüft (CORS-Vermeidung via Apps Script Proxy). Async/await mit Cleanup. | PDFFrage.tsx |
| U37 | **Text-Rotation selektiert**: Neuer Reducer-Action `UPDATE_COMMAND` im Drawing Engine. Selektierte Texte können direkt rotiert werden. | useDrawingEngine.ts, ZeichnenCanvas.tsx, ZeichnenFrage.tsx |
| U38 | **Text-Grösse UI**: S/M/L/XL Buttons (14/18/24/32px) in Toolbar. Wirkt auf neue und selektierte Texte. | ZeichnenToolbar.tsx, ZeichnenFrage.tsx, ZeichnenCanvas.tsx |
| U39 | **Text Bold**: Fett-Toggle (B-Button) in Toolbar. `fett`-Attribut auf DrawCommand, `font: bold Npx sans-serif`. | ZeichnenTypes.ts, useDrawingEngine.ts, ZeichnenToolbar.tsx |

### Geänderte Dateien (8 Dateien, diese Session)

```
src/components/Layout.tsx                          — U36 (Link entfernt, Button-Touch)
src/components/MaterialPanel.tsx                   — B38 (Höhe-Fix)
src/components/fragetypen/PDFFrage.tsx              — B39 (DriveFileId-Priorität)
src/components/fragetypen/ZeichnenFrage.tsx         — U37-U39 (State + Handler)
src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx — U37-U39 (Props + Engine)
src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx — U38-U39 (UI-Buttons)
src/components/fragetypen/zeichnen/ZeichnenTypes.ts — U39 (fett-Attribut)
src/components/fragetypen/zeichnen/useDrawingEngine.ts — U37+U39 (UPDATE_COMMAND + fett)
```

---

## Session 26.03.2026 (16) — Bugfixes + UX aus Live-Tests (Runde 4) + Cleanup

### Status: ERLEDIGT (7 Tasks)

| Task | Beschreibung | Datei(en) |
|------|-------------|-----------|
| B35 | **Fortschritt 0%**: `beantworteteFragen` zählt jetzt nur nicht-leere Antworten. `gesamtFragen` nutzt `alleFragen` (inkl. Aufgabengruppen-Teilfragen). | usePruefungsMonitoring.ts |
| B36 | **Material-PDF Höhe**: iframe in `position: absolute` Container → volle Bildschirmhöhe. Fix für PDF und Link-Typ. | MaterialPanel.tsx |
| B37 | **Demo-PDF F10**: `pdfUrl` auf Fedlex OR-PDF gesetzt (war leer). | demoFragen.ts |
| U33 | **Lösch-Bestätigung**: `window.confirm()` vor Alles-Löschen im Zeichnen-Tool. | ZeichnenToolbar.tsx |
| U34 | **Tab-öffnen Button entfernt**: "In neuem Tab öffnen" im Material-Panel entfernt + ungenutzter Import. | MaterialPanel.tsx |
| U35 | **Vollbild nach Abgabe**: `document.exitFullscreen()` in AbgabeDialog, Timer, Layout (useEffect). | AbgabeDialog.tsx, Timer.tsx, Layout.tsx |
| Cleanup | **Fallback-Code entfernt**: 3 Fallback-Blöcke (alte DriveApp-Einzel-Dateien) + 3 Alias-Funktionen aus Apps Script entfernt. Alle Aufrufe auf direkte Funktionen umgestellt. | apps-script-code.js |

### Geänderte Dateien (8 Dateien)

```
src/hooks/usePruefungsMonitoring.ts                — B35 (Fortschritt-Zählung)
src/components/MaterialPanel.tsx                   — B36 (PDF-Höhe) + U34 (Button entfernt)
src/data/demoFragen.ts                             — B37 (pdfUrl)
src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx — U33 (confirm)
src/components/AbgabeDialog.tsx                    — U35 (exitFullscreen)
src/components/Timer.tsx                           — U35 (exitFullscreen)
src/components/Layout.tsx                          — U35 (exitFullscreen useEffect)
apps-script-code.js                                — Cleanup (Fallbacks + Aliase entfernt)
```

### Hinweis
**Apps Script aktualisieren:** Code in Editor einfügen → Bereitstellen → Bereitstellungen verwalten → Stift-Icon → "Neue Version" → Bereitstellen. URL bleibt gleich.

---

## Session 26.03.2026 (15) — Performance-Optimierung (P1)

### Status: ERLEDIGT (4 Tasks)

| Task | Beschreibung | Datei(en) |
|------|-------------|-----------|
| P1a | **Neuer Backend-Endpoint `ladeEinzelConfig`** — Lädt nur eine Config statt alle (~50KB→~1KB). Shared Helper `mapConfigRow()` für `ladeAlleConfigs` und `ladeEinzelConfig`. | apps-script-code.js |
| P1b | **Frontend API-Funktion** `ladeEinzelConfig` via `getJson` | pruefungApi.ts, apiService.ts |
| P1c | **Config aus `ladePruefung` übernehmen** — Initialer Load spart separaten Config-Call. Config-Polling nur noch in Vorbereitung/Lobby (30s statt 15s, leichtgewichtig). | DurchfuehrenDashboard.tsx |
| P1d | **Polling-Frequenzen optimiert** — Monitoring: 5s (Live) / 15s (sonst). Nachrichten: 20s statt 10s. Config: 30s nur in Vorb./Lobby. Spart ~40% Connection-Slots → Buttons reagieren schneller. | DurchfuehrenDashboard.tsx |

### Geänderte Dateien (4 Dateien)

```
apps-script-code.js                               — P1a (ladeEinzelConfig + mapConfigRow)
src/services/pruefungApi.ts                        — P1b (ladeEinzelConfig Funktion)
src/services/apiService.ts                         — P1b (Export)
src/components/lp/DurchfuehrenDashboard.tsx        — P1c+P1d (Config-Load + Polling)
```

### Hinweis
**Apps Script aktualisieren:** Code in Editor einfügen → Bereitstellungen verwalten → Stift → "Neue Version" → Bereitstellen. URL bleibt gleich.

---

## Session 26.03.2026 (14) — Bugfixes + UX aus Live-Tests (Runde 3)

### Status: ERLEDIGT (12 Tasks)

**Plan:** `docs/superpowers/plans/2026-03-26-session14-bugfixes-ux.md`

### Block 0: Cleanup

| Fix | Beschreibung |
|-----|-------------|
| HTML | `button > button` Nesting-Warnung in VorbereitungPhase (Kurs-Accordion) → innerer Button zu `<span role="button">` |
| Blur-Fix | Textfeld bei Bild/Zeichnen verschwand nach ~0.5s — Race-Condition: Canvas-Click löste `onBlur` aus. Fix: 400ms Guard nach Overlay-Öffnung (ZeichnenCanvas.tsx) |
| Duplizieren | Button "Duplizieren" im Composer tat nichts — useState-Initialisierung ignoriert neue Props. Fix: `key={composerKey}` erzwingt Remount bei Duplizierung (LPStartseite.tsx) |
| Doppel-Save | Duplizieren erzeugte 2 Kopien — Race zwischen manuellem Speichern und Autosave-Timer. Beide sahen `id:''`, generierten je eine zufällige ID. Fix: (1) handleSpeichern bricht Autosave-Timer ab, (2) vorherigePruefungRef wird in handleSpeichernIntern mit `zuSpeichern` aktualisiert statt stale closure |
| Materialien | `ladeAlleConfigs` + `ladePruefung` im Backend gaben `materialien` nicht zurück → Duplikat hatte keine Materialien, SuS sahen keine. Fix: `materialien: safeJsonParse(row.materialien, [])` in beide Funktionen (apps-script-code.js) |

### Block 0b: Session 15 — 8 Fixes aus Klassentest 26.03.

| Task | Beschreibung | Datei(en) |
|------|-------------|-----------|
| T1 | VorschauTab: Bild/PDF-Platzhalter für fehlende Fragetypen | VorschauTab.tsx |
| T2 | KontrollStufeSelect: Ausklappbare Details pro Stufe | KontrollStufeSelect.tsx |
| T3 | LobbyPhase: Prüfungs-URL anzeigen (wie Vorbereitung) | LobbyPhase.tsx |
| T4 | Material-PDF volle Höhe: Flex-Kette repariert (Split + Overlay + MaterialInhalt) | MaterialPanel.tsx |
| T5 | Bild Undo/Clear: Engine-Aktionen über `onEngineActions`-Callback exponiert | ZeichnenCanvas.tsx, ZeichnenFrage.tsx |
| T6 | iPad PDF-Annotation: Mouse→Pointer Events + `touch-action:none` | PDFSeite.tsx |
| T7 | iPad Tastatur bei Freitext: `user-select:text` Override in `.ProseMirror` (Lockdown setzt `user-select:none` auf body) | index.css |
| T8 | **Antworten-System auf Master-Spreadsheet umgestellt.** Google Workspace blockierte DriveApp-Schreiboperationen → Heartbeat/Save scheiterten für neue Prüfungen. Komplett-Refactor: Statt separate Dateien pro Prüfung nutzt das System jetzt ein zentrales Spreadsheet (`ANTWORTEN_MASTER_ID`) mit Tabs pro Prüfung (`Antworten_`, `Korrektur_`, `Nachrichten_`). 3 neue Helper (`getOrCreateAntwortenSheet/KorrekturSheet/NachrichtenSheet`), 18+ DriveApp-Stellen ersetzt, Fallback auf alte Dateien im Ordner für Migration. |
| T8b | **Duplikation bereinigt:** `handleDuplizieren` resettet jetzt alle Session-Felder (teilnehmer, beendetUm, durchfuehrungId, zeitverlaengerungen, sebAusnahmen, erlaubteKlasse). `handleSpeichernIntern`: `erlaubteKlasse === '—'` wird als leer behandelt. |
| T9 | **speichereConfig Partial-Update Fix:** Backend überschrieb nicht-gesendete Felder mit Defaults (z.B. abschnitte→[]). Fix: Nur explizit gesendete Felder werden geschrieben (`config.hasOwnProperty()`). |
| T10 | **Multi-Duplikat Race-Condition Fix:** 3 statt 1 Kopie beim Duplizieren. Root cause: Autosave-Timer liest stale Closure mit `id:''`, generiert jeweils neue ID. Fix: `pruefungRef.current` statt Closure + `speichertRef` Guard gegen parallele Saves. |

### Block 1: Bugfixes (4 Tasks)

| Bug | Beschreibung | Fix |
|-----|-------------|-----|
| B33 | Demo-Prüfung sperrt nach 3 Verstössen | Guard `if (effektiv === 'keine') return` in `registriereVerstoss` (useLockdown.ts) |
| B34 | SuS-Startbildschirm erkennt Freischaltung nicht | Heartbeat-Phase `'aktiv'`/`'live'` löst Freischaltung aus + HeartbeatResponse-Type erweitert |
| B29 | Material PDF halbe Höhe (wiederholt) | iframe `min-h-0` statt `min-h-[200px]` — flex-1 kann jetzt korrekt füllen |
| B25 | PDF Text-Annotationen nicht editierbar via Doppelklick | `closest()` → manuelle DOM-Traversierung für SVG/HTML-Kompatibilität |

### Block 2: UX-Verbesserungen (7 Tasks)

| Feature | Beschreibung |
|---------|-------------|
| U25 Markieren Standardfarbe Gelb | STANDARD_HIGHLIGHT_FARBEN umgeordnet: Pastell zuerst (Gelb Default). Auto-Wechsel Schwarz/Gelb bei Werkzeug-Change |
| U27 Textfeld 90°-Rotation | Neues `rotation?` Feld auf DrawCommand + PDFTextAnnotation. ⟳-Toggle in beiden Toolbars, 0→90→180→270 |
| U28 Textfeld-Icons vereinheitlicht | Bild: ✓/✕ Buttons entfernt → Enter/Escape/Blur wie PDF |
| U29 ZeitzuschlagEditor entfernt | Aus LobbyPhase entfernt (Inline-Badge im Live-Tab reicht) |
| U30 Auto-geprüft | Auto-korrigierbare Fragetypen (MC, R/F, Lückentext, Buchungssätze, etc.) als `geprueft: true` nach Laden |
| U31 Frage-für-Frage Korrektur | Neuer Toggle SuS-Ansicht ↔ Fragen-Ansicht. Neue Komponente `KorrekturFragenAnsicht.tsx` |
| U32 Multi-Prüfungs-Auswertung | Auswertung-Tab im MultiDurchfuehrenDashboard mit Tabs pro Prüfung/Kurs |

### Geschlossen (aus Tests bestätigt)
- ~~B25~~ PDF Text editierbar ✅ | ~~B29~~ Material PDF Höhe ✅ | ~~B33~~ Demo keine Sperre ✅ | ~~B34~~ Freischaltung ✅
- ~~U25~~ Gelb Default ✅ | ~~U27~~ Rotation ✅ | ~~U28~~ Textfeld ✅ | ~~U29~~ Zeitzuschlag ✅ | ~~U30~~ Auto-geprüft ✅ | ~~U31~~ Fragen-Korrektur ✅ | ~~U32~~ Multi-Tabs ✅

### Geänderte Dateien (18 Dateien)

```
src/hooks/useLockdown.ts                               — B33 (effektiv==='keine' Guard)
src/types/monitoring.ts                                — B34 (HeartbeatResponse Phase erweitert)
src/components/Startbildschirm.tsx                     — B34 (Phase-basierte Freischaltung)
src/components/MaterialPanel.tsx                       — B29 (min-h-0 statt min-h-[200px])
src/components/fragetypen/pdf/PDFSeite.tsx             — B25 (DOM-Traversierung statt closest) + U27 (Rotation)
src/components/fragetypen/pdf/PDFTypes.ts              — U25 (Farben umgeordnet)
src/components/fragetypen/pdf/PDFToolbar.tsx           — U27 (Rotation-Toggle)
src/components/fragetypen/pdf/PDFViewer.tsx            — U27 (textRotation Prop)
src/components/fragetypen/PDFFrage.tsx                 — U25 (Auto-Farbwechsel) + U27 (Rotation)
src/components/fragetypen/zeichnen/ZeichnenTypes.ts   — U27 (rotation auf DrawCommand)
src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx  — U28 (Buttons entfernt) + U27 (Rotation)
src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx — U27 (Rotation-Toggle)
src/components/fragetypen/zeichnen/useDrawingEngine.ts — U27 (Canvas Rotation)
src/components/fragetypen/ZeichnenFrage.tsx            — U27 (textRotation State)
src/types/fragen.ts                                    — U27 (PDFTextAnnotation rotation)
src/components/lp/LobbyPhase.tsx                       — U29 (ZeitzuschlagEditor entfernt)
src/components/lp/DurchfuehrenDashboard.tsx            — U29 (onConfigUpdate Prop entfernt)
src/components/lp/KorrekturDashboard.tsx               — U30 (Auto-geprüft) + U31 (Modus-Toggle)
src/components/lp/KorrekturFragenAnsicht.tsx           — U31 (NEU: Frage-für-Frage Komponente)
src/components/lp/MultiDurchfuehrenDashboard.tsx       — U32 (Auswertung-Tab mit Prüfungs-Tabs)
src/components/lp/VorbereitungPhase.tsx                — HTML button-nesting Fix (Kurs-Accordion)
src/components/lp/PruefungsComposer.tsx                — T10 (pruefungRef + speichertRef gegen Race)
apps-script-code.js                                    — T8 (Master-Spreadsheet) + T9 (Partial Update)
```

---

## Session 25.03.2026 (13) — Bugfixes + UX aus Live-Tests (Runde 2)

### Status: ERLEDIGT (12 Tasks + 5 Nachbesserungen)

**Plan:** `docs/superpowers/plans/scalable-prancing-chipmunk.md`

### Block 1: Bugfixes (4 Tasks)

| Bug | Beschreibung | Fix |
|-----|-------------|-----|
| B31 | Verstösse/Gerät/Kontrolle in Live-Tab immer "—" | Root cause: `const headers` → `let headers` in heartbeat() (const-Reassignment crashte Lockdown-Schreibung) |
| B28 | SuS "Verbunden" vor Lobby-Eröffnung | 3-State Wartescreen: verbinde → Server erreichbar → Verbunden. Backend sendet `phase` im Heartbeat |
| B32 | Bilanz Kontenfelder Overflow | `min-w-0 truncate` auf Select, `overflow-hidden` auf BilanzSeite-Container |
| B26 | Zeichnen Toolbar vertikal mitten im Screen | `flex-row` Wrapper: Toolbar links neben Canvas, `sticky top-20` |

### Block 2: UX-Verbesserungen (8 Tasks)

| Feature | Beschreibung |
|---------|-------------|
| U21 Fragen-Navigation Farben | Beantwortet=grün, Offen=violett, Unsicher=amber |
| U14 Zeitzuschlag Lobby + Live | Inline-Badge ⏱+N′ pro SuS in Lobby. Live: Info-Badge=solid blau, +5 Button=outline klein |
| U24 Kontrollstufe "Keine" | 4. Stufe ⚪ Keine — keine Einschränkungen (für Übungen) |
| U18 Zeitzuschlag Auswertung | Zeit+-Spalte in BeendetPhase-Tabelle mit ⏱+N′ Badge |
| U22 Canvas vergrösserbar | ⊞/⊟ Toggle über Zeichenfläche, max-w-3xl ↔ max-w-none |
| U23 PDF-Toolbar vertikal | Layout-Toggle ⇅/⇆ in PDFToolbar, flex-row Wrapper in PDFFrage |
| U17 Demo-Prüfung | Nur Einrichtungsprüfung (Musterprüfung entfernt), kontrollStufe 'keine', Resultate-Button entfernt |

### Block 3: Farbschema-Harmonisierung (5 Nachbesserungen)

Alle 13 Fragetypen konsistent: **Leer = violett**, **Ausgefüllt = neutral**, **Gewählt = nur Symbol farbig**

| Fragetyp | Leer | Gewählt/Ausgefüllt |
|----------|------|--------------------|
| MC | Violetter Container | Nur grüner Kreis, Button neutral |
| R/F | Violette Karte | Nur ✓ grüner / ✗ roter Kreis (wie MC) |
| Zuordnung | Violette Zeile + Select | Nur Dropdown grün |
| Freitext | Violetter Rahmen (auch bei Focus) | Neutral (slate) |
| Lückentext | Violette Unterstriche | Neutral |
| Berechnung | Violette Inputs + Textarea | Neutral |
| Buchungssatz | Violett: KontenSelect + Betrag | Neutral |
| TKonto | Violett: KontenSelect + Betrag + GF-Nr + Saldo + Seite | Neutral |
| Kontenbestimmung | Violett: Kategorie + Seite Selects | Neutral |
| Bilanz/ER | Violett: Seite-wählen + Kontenhauptgruppe + Konto + Betrag + Bilanzsumme | Neutral |
| Zeichnen/PDF | n/a (Canvas/Annotationen) | n/a |

### Geschlossen (aus Tests bestätigt)
- ~~B24~~ Text-Tool ✅ | ~~B27~~ PDF Spiegelung ✅ | ~~B30~~ Fragen-Navigation ✅
- ~~U12~~ SuS-Direktauswahl ✅ | ~~U15~~ Farbpalette ✅ | ~~U19~~ MC Auto-Confirm ✅ | ~~U20~~ Kurs einklappbar ✅

### Geänderte Dateien (25 Dateien)

```
apps-script-code.js                            — B31 (const→let), B28 (phase in Heartbeat-Response)
src/App.tsx                                     — Demo: einrichtungsPruefung statt demoPruefung, Resultate-Button entfernt
src/types/lockdown.ts                          — U24 (KontrollStufe um 'keine')
src/types/monitoring.ts                        — B28 (HeartbeatResponse.phase), U24 (kontrollStufe)
src/types/pruefung.ts                          — U24 (kontrollStufe um 'keine')
src/services/pruefungApi.ts                    — B28 (phase parsen)
src/data/einrichtungsPruefung.ts               — kontrollStufe: 'keine'
src/components/Startbildschirm.tsx             — B28 (3-State), U24 (kein Vollbild bei 'keine')
src/components/FragenNavigation.tsx            — U21 (grün beantwortet, Legende)
src/components/shared/KontenSelect.tsx         — Violett leer, neutral ausgefüllt (alle FiBu)
src/components/fragetypen/FreitextFrage.tsx    — Violett leer (auch bei Focus), neutral ausgefüllt
src/components/fragetypen/LueckentextFrage.tsx — Violett leer, neutral ausgefüllt
src/components/fragetypen/MCFrage.tsx          — Nur grüner Kreis, violetter Container
src/components/fragetypen/RichtigFalschFrage.tsx — Grüner/roter Kreis-Icon, violette Karte
src/components/fragetypen/ZuordnungFrage.tsx   — Nur Dropdown grün, violette Zeile
src/components/fragetypen/BerechnungFrage.tsx  — Violett Inputs + Textarea
src/components/fragetypen/BuchungssatzFrage.tsx — Violett Betrag-Inputs, neutral Label
src/components/fragetypen/TKontoFrage.tsx      — Violett alle Inputs, Saldo-Seite startet leer
src/components/fragetypen/KontenbestimmungFrage.tsx — Violett Kategorie/Seite Selects
src/components/fragetypen/BilanzERFrage.tsx    — B32 + Violett Seite/Gruppe/Summe
src/components/fragetypen/ZeichnenFrage.tsx    — B26 (flex-row), U22 (vergrösserbar)
src/components/fragetypen/pdf/PDFToolbar.tsx   — U23 (vertikal + Farben vertikal)
src/components/fragetypen/PDFFrage.tsx         — U23 (flex-row bei vertikal)
src/components/lp/*                            — U14, U18, U24, Demo-Config
src/hooks/useLockdown.ts                       — U24 ('keine' deaktiviert alles)
```

### Apps Script: Änderungen nötig!

→ User muss apps-script-code.js in Apps Script Editor kopieren + neue Bereitstellung erstellen

---

## Session 25.03.2026 (12) — Bugfixes + UX aus Live-Tests

### Status: ERLEDIGT (11 Tasks)

**Plan:** `docs/superpowers/plans/drifting-sniffing-scott.md`

### Block 1: Kritische Bugs (4 Tasks)

| Bug | Beschreibung | Fix |
|-----|-------------|-----|
| B19 | Verstoss-Sperre: LP sieht nichts im Dashboard | Lockdown-Felder (gesperrt, verstossZaehler, verstoesse, geraet) fehlten im DurchfuehrenDashboard Mapping + apps-script neue Row-Init |
| B21 | Beenden → SuS bleibt auf Gesperrt-Overlay | SperreOverlay-Bedingung: nicht rendern wenn beendetUm oder abgegeben |
| B22 | Erzwungene Abgabe "0 Punkte" + SuS noch aktiv | Server-seitiges Safety-Net: beendePruefung sofort markiert alle als abgegeben; ladeMonitoring: beendet-lp Status |
| B18 | Material PDF halbe Höhe (wiederholt) | `min-h-0` im Overlay-Modus von MaterialPanel.tsx |

### Block 2: UX-Bugs (3 Tasks)

| Bug | Beschreibung | Fix |
|-----|-------------|-----|
| B23 | Violett-Hervorhebung invertiert | Offen = violett (Aufmerksamkeit), Beantwortet = neutral + ✓, Unsicher = amber |
| B20 | Autosave-Zähler zeigt 0 | autoSaveCount wird nun via Heartbeat ans Backend gesendet |
| B17 | Verbindungs-Bestätigung zu früh | Neutrales Grau statt Blau ✓, "Verbindung hergestellt" statt "Verbunden" |

### Block 3: UX-Verbesserungen (4 Tasks)

| Feature | Beschreibung |
|---------|-------------|
| U9 Individuelles Beenden | ✕-Button pro Schüler im Live-Monitoring → BeendenDialog mit einzelnerSuS |
| U10 MC Auto-Confirm | Automatisch korrigierbare Fragen (MC, Zuordnung, etc.) werden als geprueft vorgewählt |
| U7 Nachteilsausgleich Lobby | ZeitzuschlagEditor (kompakt, collapsible) in LobbyPhase integriert |
| U11 Kurs-Auswahl einklappbar | Collapsible Section in VorbereitungPhase mit SuS-Zähler im Header |

### Geänderte Dateien

```
src/components/lp/DurchfuehrenDashboard.tsx — Lockdown-Felder Mapping (B19)
src/components/Layout.tsx                   — SperreOverlay-Bedingung (B21)
src/components/MaterialPanel.tsx            — min-h-0 Overlay-Modus (B18)
src/components/FragenNavigation.tsx         — Violett-Hervorhebung (B23)
src/components/FragenUebersicht.tsx         — Violett-Hervorhebung (B23)
src/components/Startbildschirm.tsx          — Neutrale Verbindungs-Message (B17)
src/services/pruefungApi.ts                 — autoSaveCount im Heartbeat (B20)
src/hooks/usePruefungsMonitoring.ts         — autoSaveCount übergeben (B20)
src/components/lp/AktivPhase.tsx            — Individuelles Beenden X-Button (U9)
src/components/lp/LobbyPhase.tsx            — Nachteilsausgleich + onConfigUpdate (U7)
src/components/lp/VorbereitungPhase.tsx     — Kurs-Auswahl einklappbar (U11)
apps-script-code.js                         — B19 (Row-Init), B20 (autoSaveCount), B22 (Safety-Net + beendet-lp), U10 (auto-bewertet)
```

### Apps Script: Änderungen nötig!

→ User muss apps-script-code.js in Apps Script Editor kopieren + neue Bereitstellung erstellen

---

## Session 25.03.2026 (11) — Bugfixes + UX-Verbesserungen

### Status: ERLEDIGT (14 Tasks)

**Spec:** `docs/superpowers/specs/2026-03-25-session11-bugs-ux-design.md`
**Plan:** `docs/superpowers/plans/2026-03-25-session11-bugfixes-ux.md`

### Block A: Bugfixes (8 Tasks)

| Bug | Beschreibung | Fix |
|-----|-------------|-----|
| B6/B16 | Aufgabengruppe Zählung + Navigation (Teilfragen doppelt im Index) | `fragen[]` (Navigation) + `alleFragen[]` (inkl. Teilfragen) getrennt. 10 Dateien. |
| B7 | Abgabe-Count Mismatch | Durch B6-Fix mit erledigt — AbgabeDialog nutzt nun `istVollstaendigBeantwortet()` |
| B10 | Zeichnen Text-Tool verschwindet nach 0.5s | `usePointerEvents` Guard + stopPropagation auf Text-Overlay |
| B11 | PDF Text-Annotationen nicht editierbar | Doppelklick → Edit-Mode in `PDFSeite.tsx` |
| B12 | Zeichnen Toolbar vertikal buggy | `max-h-full overflow-y-auto` + Spacer nur horizontal |
| B13 | PDF Spiegelung | Zoom-Clamping (0.25–3) + `touchAction: pan-x pan-y` |
| B14 | SuS grün vor Lobby | Verbindungsstatus blau statt grün in Warteraum |
| B15 | Material nicht volle Höhe | `h-0` Trick auf Main-Container in Layout.tsx |
| B8 | Button-Feedback | War bereits vorhanden (freischaltenLaedt) |
| B9 | Material-Icon / Anhänge fehlen | `FrageAnhaenge` in Layout + AufgabengruppeFrage eingebaut |

### Block B: UX-Verbesserungen (6 Tasks)

| Feature | Beschreibung |
|---------|-------------|
| U1 Kurs-Auswahl | Komplett-Rewrite: `ausgewaehlteSuS: Set<string>`, Indeterminate-Checkbox, SuS immer sichtbar, Direktauswahl |
| U2 Auswertung-Tab | Ergebnisse + Korrektur zu 1 Tab zusammengelegt (Accordion), URL-Fallback |
| U3 Zeitzuschlag inline | Pro Schüler-Zeile im Live-Monitoring: "+5" Button, Countdown bei Überzeit |
| U4 Farbpalette | 9 Farben (5 kräftig + 4 Pastell), Schwarz Default, Zeichnen + PDF |
| U5 Lobby-Monitoring | Gerät, Kontrollstufe, SEB-Badge in Lobby sichtbar |
| U6 Demo-Prüfung | PDF + Zeichnen Fragetypen ergänzt, Abschnitte A-F |

### Geänderte Dateien (Kern)

```
src/store/pruefungStore.ts          — alleFragen + fragen Trennung
src/App.tsx                         — resolveFragenFuerPruefung returns both arrays
src/components/Layout.tsx           — Material-Höhe, FrageAnhaenge
src/components/Startbildschirm.tsx  — Blauer Verbindungsstatus
src/components/AbgabeDialog.tsx     — istVollstaendigBeantwortet
src/components/FragenNavigation.tsx — alleFragen für Status-Check
src/components/lp/KursAuswahl.tsx   — Komplett-Rewrite (Indeterminate)
src/components/lp/VorbereitungPhase.tsx — ausgewaehlteSuS State-Modell
src/components/lp/DurchfuehrenDashboard.tsx — 4 Tabs, Auswertung-Accordion
src/components/lp/AktivPhase.tsx    — Inline-Zeitzuschlag + startTimestamp
src/components/lp/BeendetPhase.tsx  — onWeiterZurKorrektur entfernt
src/components/lp/LobbyPhase.tsx    — Gerät/Kontrolle/SEB Badges
src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx  — Text-Tool Fix
src/components/fragetypen/zeichnen/usePointerEvents.ts — textOverlay Guard
src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx — Vertikal-Fix + Farben
src/components/fragetypen/zeichnen/ZeichnenTypes.ts    — STANDARD_FARBEN
src/components/fragetypen/pdf/PDFSeite.tsx    — Text-Edit Doppelklick
src/components/fragetypen/pdf/PDFViewer.tsx   — touchAction
src/components/fragetypen/pdf/PDFTypes.ts     — STANDARD_HIGHLIGHT_FARBEN
src/components/fragetypen/pdf/usePDFRenderer.ts — Zoom-Clamping
src/data/demoFragen.ts              — PDF + Zeichnen Fragen
```

### Apps Script: Keine Änderungen nötig

---

## Session 25.03.2026 (10) — Multi-Prüfung + Soft-Lockdown (komplett)

### Status: ERLEDIGT (alle 12 Tasks)

**Spec:** `docs/superpowers/specs/2026-03-25-multi-pruefung-soft-lockdown-design.md`
**Plan:** `docs/superpowers/plans/2026-03-25-multi-pruefung-soft-lockdown.md`

### Zwei Features

1. **Multi-Prüfungs-Dashboard:** LP kann mehrere Prüfungen parallel in einem Tab überwachen (Use-Case: Nachprüfungstermin). URL: `?ids=pruefung-a,pruefung-b`. Live-Zusammenfassung + Einzelansicht pro Prüfung.

2. **Soft-Lockdown (3 Stufen):** SEB-unabhängige Sicherheit mit automatischer Geräteerkennung.
   - 🟢 **Locker:** Nur Logging + Warnung (Übungen)
   - 🟡 **Standard (Default):** Copy/Paste-Block, Vollbild, Rechtsklick, DevTools gesperrt, 3 Verstösse → Sperre
   - 🔴 **Streng:** Sofort-Pause bei Vollbild-Verlust, SEB empfohlen
   - iPad: automatisches Downgrade (kein Vollbild möglich)
   - SuS sieht Warnung mit Zähler bei jedem Verstoss
   - LP muss bei Sperre entsperren
   - LP sieht Verstösse, Gerät, Kontrolle live im Monitoring

### Alle 12 Tasks erledigt

- **Task 1:** `src/types/lockdown.ts` + `src/hooks/useGeraetErkennung.ts` — Types + Geräteerkennung
- **Task 2:** `src/hooks/useLockdown.ts` — Zentral-Hook (Copy/Paste, Vollbild, DevTools, Verstoss-Zähler, Split-View)
- **Task 3:** `src/components/VerstossOverlay.tsx` + `src/components/SperreOverlay.tsx` — SuS-Overlays
- **Task 4:** `src/components/Layout.tsx` + `src/components/Startbildschirm.tsx` — Lockdown-Integration + Vollbild beim Start
- **Task 5:** Types erweitert: `PruefungsConfig.kontrollStufe`, `SchuelerStatus` Lockdown-Felder, `HeartbeatResponse` Override-Felder, `Unterbrechung.typ` erweitert
- **Task 6:** `src/services/pruefungApi.ts` — Heartbeat mit lockdownMeta, 2 neue API-Funktionen (entsperreSuS, setzeKontrollStufe)
- **Task 7:** `apps-script-code.js` — Heartbeat speichert Lockdown-Daten, ladeMonitoring gibt Lockdown-Felder zurück, 2 neue Endpoints (entsperreSuS, setzeKontrollStufe), speichereConfig mit kontrollStufe
- **Task 8:** `src/components/lp/KontrollStufeSelect.tsx` + VorbereitungPhase-Integration — Segmented Control (Locker/Standard/Streng) in LP-Vorbereitung
- **Task 9:** `src/components/lp/AktivPhase.tsx` — Verstoss-Spalte mit Zähler/Tooltip, Entsperren-Button, Kontrollstufe-Anzeige, Geräteerkennung
- **Task 10:** `src/components/lp/MultiDurchfuehrenDashboard.tsx` + App.tsx `?ids=` — Multi-Prüfungs-Übersicht mit Live-Zusammenfassung + Einzelansicht
- **Task 11:** `src/hooks/usePruefungsMonitoring.ts` — visibilitychange → Lockdown-Verstoss, Heartbeat sendet Lockdown-Daten, LP-Entsperrung/Override via Heartbeat-Response
- **Task 12:** Build + HANDOFF + Commit + Push

### Neue Dateien

```
src/types/lockdown.ts                              — KontrollStufe, GeraetTyp, Verstoss, LockdownState
src/hooks/useGeraetErkennung.ts                    — Geräteerkennung (Laptop/Tablet) + Fullscreen-Check
src/hooks/useLockdown.ts                           — Zentral-Hook (Copy/Paste, Vollbild, DevTools, Zähler, Sperre)
src/components/VerstossOverlay.tsx                 — SuS-Warnung bei Verstoss
src/components/SperreOverlay.tsx                   — SuS-Sperre bei max Verstössen
src/components/lp/KontrollStufeSelect.tsx          — Segmented Control für Kontrollstufe
src/components/lp/MultiDurchfuehrenDashboard.tsx   — Multi-Prüfungs-Dashboard
docs/superpowers/specs/2026-03-25-multi-pruefung-soft-lockdown-design.md
docs/superpowers/plans/2026-03-25-multi-pruefung-soft-lockdown.md
```

### Geänderte Dateien

```
src/types/pruefung.ts                  — kontrollStufe Feld
src/types/monitoring.ts                — SchuelerStatus Lockdown-Felder + HeartbeatResponse Override
src/types/antworten.ts                 — Unterbrechung.typ erweitert
src/components/Layout.tsx              — useLockdown Hook + Overlays + Lockdown-Callbacks an Monitoring
src/components/Startbildschirm.tsx     — Vollbild beim Prüfungsstart
src/services/pruefungApi.ts            — heartbeat mit lockdownMeta, entsperreSuS, setzeKontrollStufe
src/services/apiService.ts             — neue Funktionen exportiert
src/hooks/usePruefungsMonitoring.ts    — Lockdown-Callbacks, Heartbeat mit Lockdown-Daten, Tab-Wechsel
src/components/lp/VorbereitungPhase.tsx — KontrollStufeSelect eingebaut
src/components/lp/AktivPhase.tsx       — Verstoss-Spalte, Gerät, Kontrolle, Entsperren
src/App.tsx                            — ?ids= Multi-Dashboard-Routing
apps-script-code.js                    — Lockdown-Daten in Heartbeat, ladeMonitoring, 2 Endpoints, Config
```

### Apps Script manuell aktualisieren!

`apps-script-code.js` wurde erweitert. Bitte:
1. Code in den Apps Script Editor kopieren
2. Bereitstellungen verwalten → bestehende Version aktualisieren (Stift-Icon)
3. **NICHT** "Neue Bereitstellung" (ändert URL)

---

## Session 25.03.2026 (9) — LP-Test-Feedback Runde 4

### Erledigt (6 Fixes)
- **B1: Zeichnen Text-Tool:** `onBlur` komplett entfernt (verursachte Focus-Verlust auf Touch). Stattdessen ✓/✕ Buttons neben dem Input. Wrapper-Div mit `stopPropagation` verhindert Canvas-Interaktion.
- **B2: Zeitzuschlag editierbar:** Fix 15min → Input-Feld (0-120 Min., Schritt 5). Leer = keine Zusatzzeit.
- **B3: Auto-Punktevergabe:** `setKorrektur` im Effect nutzt jetzt `setState`-Callback statt Closure-Variable → behebt Race Condition wenn `korrektur` nach `autoErgebnisseAlle` lädt.
- **B4: SuS-Checkboxen in Kursauswahl:** Individuelle Checkboxen neben jedem Schülernamen in der Kursübersicht. Abgewählte SuS werden transparent dargestellt.
- **B5: Material-Panel volle Höhe:** `overflow-auto` → `min-h-0` im Content-Container, damit `flex-1` auf iframe/PDF korrekt wirkt.
- **B9: Korrektur-Button:** "Weiter zur Korrektur →" in die Aktions-Zeile verschoben (nicht mehr auf eigener Zeile).

### Noch offen (späterer Pass)
- **B6: MC nicht als gelöst angezeigt** — Aufgabengruppe/Teilfragen-Zählung prüfen
- **B7: Abgabe-Count Mismatch** — Navigation vs. Abgabe-Dialog zählen unterschiedlich
- **B8: Button-Feedback SuS-Seite** — Freischalten, Material-Toggle, etc.
- **Material-Icon Referenz** — Frage referenziert 📋-Icon, Prüfung zeigt es nicht

### Geänderte Dateien
```
src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx  — Text-Overlay mit Buttons statt onBlur
src/components/lp/TeilnehmerListe.tsx                  — Zeitzuschlag Input-Feld
src/components/lp/KorrekturDashboard.tsx               — Auto-Korrektur setState-Callback
src/components/lp/KursAuswahl.tsx                      — SuS-Checkboxen + abgewaehlte/onToggleSuS Props
src/components/lp/VorbereitungPhase.tsx                — abgewaehlte/onToggleSuS an KursAuswahl
src/components/MaterialPanel.tsx                       — Split-Inhalt min-h-0
src/components/lp/BeendetPhase.tsx                     — Korrektur-Button in Aktions-Zeile
```

---

## Session 25.03.2026 (8) — Auto-Korrektur Fix + Button-Loading

### Erledigt

- **F10: Auto-Korrektur übernimmt Punkte:** Frontend-Auto-Korrektur (MC, R/F, Lückentext, Zuordnung, Berechnung) wird jetzt automatisch in `kiPunkte` geschrieben wenn noch keine Punkte vergeben sind. Kein KI-Batch nötig für deterministische Fragetypen.
- **F8: Button-Feedback:** Loading-States für alle langsamen API-Buttons:
  - KorrekturDashboard: "KI-Korrektur starten", "Einsicht freigeben", "PDF freigeben", "Ergebnisse freigeben"
  - AktivPhase: "Prüfung beenden" (direkter Path bei 0 aktiven SuS)
  - Alle Buttons zeigen "Wird..." Text und sind während des API-Calls disabled

### Geänderte Dateien
```
src/components/lp/KorrekturDashboard.tsx  — Auto-Korrektur → Bewertungen + aktionLaeuft State
src/components/lp/AktivPhase.tsx          — beendenLaeuft State für direkten Beenden-Button
```

---

## Session 25.03.2026 (7) — Login-Reset, Material-Fix, SuS-Benachrichtigung

### Erledigt

- **F4: Smart Login-Reset:** Bei jedem Login wird geprüft ob die Prüfung bereits abgegeben oder beendet wurde. Nur dann wird der State aufgeräumt. Bei laufender Prüfung bleibt der State erhalten → SuS können sich nach Browser-Crash wieder einloggen.
- **F7: Material-Button verschwindet:** Bug in `speichereConfig()` (Apps Script) — `materialien` wurde bei jedem Config-Save mit `[]` überschrieben wenn das Frontend-Objekt kein `materialien`-Feld enthielt. Fix: `materialien` wird nur noch geschrieben wenn explizit vorhanden.
- **F12: SuS-Benachrichtigung bei Freigabe:** `korrekturFreigebenEndpoint` sendet jetzt automatisch E-Mail an alle Teilnehmer wenn Einsicht freigegeben wird. E-Mail enthält Link zur App.

### Apps Script Änderungen (manuell kopieren!)
- `korrekturFreigebenEndpoint`: E-Mail-Versand an SuS bei Einsicht-Freigabe
- `speichereConfig`: `materialien` nur schreiben wenn explizit im Config-Objekt vorhanden

### Geänderte Dateien
```
src/store/authStore.ts     — resetPruefungState() (smart: nur bei abgegeben/beendet)
apps-script-code.js        — korrekturFreigebenEndpoint + speichereConfig Fix
```

---

## Session 25.03.2026 (6) — LP-Test-Feedback Runde 3

### Erledigt (9 Fixes)

- **F1: Checkboxen sichtbar:** `w-4 h-4 accent-green-600` statt unsichtbare native Checkboxen. Abgewählte SuS visuell abgeblendet.
- **F2: Zeitzuschlag inline:** ⏱-Button direkt in jeder SuS-Zeile der TeilnehmerListe. Klick → +15 Min. Kein separates Menü mehr.
- **F3: SuS-State bei Zurück:** VorbereitungPhase wird mit `hidden` statt `{condition && ...}` gerendert → State bleibt bei Tab-Wechsel erhalten.
- **F5: Zeichnen Text-Tool:** Pointer-Capture deaktiviert bei Text-Tool (verhinderte Focus-Raub). onBlur-Timer auf 300ms erhöht.
- **F6: PDF Text-Werkzeug immer verfügbar:** 'text' wird unabhängig von `erlaubteWerkzeuge` in der Toolbar angezeigt.
- **F9: Ergebnisse → Korrektur:** "Weiter zur Korrektur →"-Button prominent im Ergebnisse-Tab.
- **F10: Debug-Logging Zuordnung:** `console.log` zeigt paare vs. zuordnungen zum Debuggen.
- **F11: Zeichnung in Korrektur:** `datenAlsBildLink()` komplett neu geschrieben — rendert jetzt alle Typen (stift, linie, pfeil, rechteck, text) statt nur 'linie'. DAS war der Bug warum Zeichnungen nicht angezeigt wurden.
- **ZeitzuschlagEditor entfernt** aus VorbereitungPhase (ersetzt durch inline).

### Nicht gefixt (Klärung nötig)
- **F4 (Warteraum):** SuS kommt direkt zu "Prüfung starten" — wahrscheinlich Stale-Cache. War mit Inkognito-Fenster behoben. Service Worker autoUpdate ist aktiv.
- **F7 (Material-Button):** Button rendert nur wenn `config.materialien.length > 0`. Prüfe ob die Test-Prüfung Materialien hat.
- **F8 (Button-Feedback):** Für einen späteren Pass — alle API-Calls brauchen Loading-States auf den Buttons.
- **F12 (SuS-Einsicht):** SuS öffnet die App OHNE `?id=...` → sieht KorrekturListe → klickt auf Prüfung → sieht Korrektur-Einsicht. Voraussetzung: Einsicht muss von LP freigegeben sein UND SuS muss eingeloggt sein.

### Geänderte Dateien
```
src/components/lp/TeilnehmerListe.tsx        — Checkboxen sichtbar + Zeitzuschlag inline
src/components/lp/VorbereitungPhase.tsx      — ZeitzuschlagEditor entfernt, Zeitzuschlag via TeilnehmerListe
src/components/lp/DurchfuehrenDashboard.tsx  — VorbereitungPhase hidden statt unmount + Korrektur-Button
src/components/lp/BeendetPhase.tsx           — "Weiter zur Korrektur" Button
src/components/lp/ZeichnenKorrektur.tsx      — datenAlsBildLink komplett neu (alle DrawCommand-Typen)
src/components/fragetypen/zeichnen/usePointerEvents.ts — Kein setPointerCapture bei text-Tool
src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx  — onBlur-Timer 300ms
src/components/fragetypen/pdf/PDFToolbar.tsx — Text immer in Toolbar
src/utils/autoKorrektur.ts                   — Debug-Logging für Zuordnung
```

---

## Session 25.03.2026 (5) — LP-Test-Feedback Runde 2

### Erledigt (10 Tasks in 3 Clustern)

**Cluster 1 — Quick-Fixes:**
- **Beenden ohne Popup (0 aktive SuS):** Kein Dialog mehr. AktivPhase ruft API direkt auf.
- **Beenden-Dialog vereinfacht:** 2-Schritt-Bestätigung → 1 Schritt (Modus wählen + direkt beenden).
- **Auto-Geprüft:** Punkte ändern, Kommentar schreiben, Audio aufnehmen → Frage automatisch als geprüft markiert.
- **Konsistentes Korrektur-Layout:** Alle 3 Fragetypen (Standard/Zeichnen/PDF) haben identische Bewertungszeile: `[Punkte] [= X Pkt.] [🎤 Audio] [☑ Geprüft]`
- **Korrektur-Status auto-update:** `korrekturStatus` wechselt automatisch zu `review-fertig` wenn alle Fragen geprüft. Wechselt zurück wenn Geprüft entfernt wird.
- **Freigabe-Banner:** Grünes Banner erscheint wenn alle SuS korrigiert sind, mit prominentem "Ergebnisse freigeben"-Button.

**Cluster 2 — Material-Panel & PDF:**
- **Material-Panel grösser:** Split-Modus von 45% auf 55% Breite, min-w 400px.
- **PDF-Ladeindikator:** Spinner + Text sofort sichtbar (kein weisses Feld mehr). Fragetext wird während Laden bereits angezeigt.
- **Zeichnen Text-Tool:** Robusterer Focus (Doppel-Versuch für iOS), `stopPropagation` auf Input, höherer z-Index, besserer visueller Kontrast.

**Cluster 3 — PDF-Textannotation:**
- **Neuer Annotationstyp `text`:** Klick auf PDF → Textfeld an Klickposition → Text direkt auf PDF sichtbar (SVG `<text>`-Element).
- Text-Werkzeug in PDFToolbar hinzugefügt, Farbpicker für Text-Farbe.
- `PDFTextAnnotation`-Typ in `types/fragen.ts` (position, text, farbe, groesse, fett).

### Neue/Geänderte Dateien
```
src/components/lp/AktivPhase.tsx            — Beenden-Bypass bei 0 SuS
src/components/lp/BeendenDialog.tsx          — 1-Schritt-Dialog (komplett neu geschrieben)
src/components/lp/KorrekturFrageZeile.tsx    — Auto-Geprüft + Layout (Audio neben Geprüft)
src/components/lp/ZeichnenKorrektur.tsx      — Auto-Geprüft + Layout
src/components/lp/PDFKorrektur.tsx           — Auto-Geprüft + Layout + text-Zähler
src/components/lp/KorrekturDashboard.tsx     — Status-Auto-Update + Freigabe-Banner
src/components/MaterialPanel.tsx             — 55% Breite
src/components/fragetypen/PDFFrage.tsx        — Spinner statt weisses Feld
src/components/fragetypen/pdf/PDFSeite.tsx    — Text-Overlay + renderTextAnnotation
src/components/fragetypen/pdf/PDFToolbar.tsx  — Text-Werkzeug + Farbpicker
src/components/fragetypen/pdf/PDFTypes.ts     — PDFTextAnnotation Export
src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx — Robusterer Text-Focus
src/types/fragen.ts                          — PDFTextAnnotation Typ
```

### Noch offen
- **PDF zeigt kein PDF:** Muss live getestet werden — evtl. DriveFileId nicht korrekt importiert oder Apps Script gibt kein Base64 zurück
- **Text-Formatierung erweitert:** Grössenauswahl (S/M/L/XL), Fett-Toggle, Rotation — Grundstruktur vorhanden, UI noch nicht in Toolbar
- **SEB testen** — nach diesen Fixes nochmal gezielt

---

## Offene Punkte

### ✅ Service Worker Cache — GELÖST (25.03.2026)

Umgestellt von `registerType: 'prompt'` auf `autoUpdate` mit `skipWaiting + clientsClaim`. SuS bekommen Updates automatisch. Build-Timestamp im Console-Log zur Verifikation. `?reset=true` als Notfall-Escape bleibt erhalten.

### 🟢 PDF-Frage: Laden via Google Drive

PDF wird via Apps Script Proxy (`ladeDriveFile` → Base64) geladen. SW-Problem gelöst, sollte jetzt funktionieren.

- `witzsammlung.pdf` ist in Google Drive hochgeladen (ID: `1Yi8WYN0HFm9iiVWYhsr-dn-1QO-5oyZy`)
- Apps Script hat `ladeDriveFile`-Endpoint (gibt Base64 zurück)
- Frontend nutzt `apiService.ladeDriveFile()` → `renderer.ladePDF({ base64 })`

### 🟡 Material-Panel

- `materialien`-Spalte existiert jetzt im Configs-Sheet
- Config importiert mit korrekten Daten (Witzsammlung PDF mit driveFileId)
- MaterialPanel.tsx unterstützt `driveFileId` → Google Drive Embed-URL
- **Debug-Logging am Fallback** (25.03): Wenn "Kein Inhalt" erscheint, zeigt Console + UI jetzt Typ/URL/DriveId an

### 🟡 Korrektur

- Korrektur-Tab ist jetzt **immer verfügbar** (nicht nur bei beendeten Prüfungen)
- Abgaben existieren im Backend (info.test@stud.gymhofwil.ch)
- KorrekturDashboard synthetisiert Schüler aus Abgaben wenn kein Korrektur-Sheet vorhanden
- **Manuelle Punktevergabe noch nicht getestet**

### ✅ SuS-Warteraum — VERBESSERT (25.03.2026)

Uhr-Icon statt Schloss, "WARTERAUM"-Label, blauer Rahmen, "Warte auf Freischaltung..."-Text. Klar unterscheidbar von Fehler- und SEB-Screens.

### ✅ SuS-Storage nach Prüfungsreset — GELÖST (25.03.2026)

`durchfuehrungId`-Mechanismus: LP-Reset generiert neue UUID im Backend. SuS vergleichen beim Laden — bei Mismatch wird State automatisch gelöscht. Info-Banner "Prüfung wurde zurückgesetzt". IndexedDB + RetryQueue werden bei Logout aufgeräumt.

### Zeichnen-Tool
- ✅ Toolbar horizontal als Default (vertikal überlappt Canvas)
- ✅ Objekt-Radierer statt Pixel-Radierer
- ✅ canvasConfig aus flachen Backend-Feldern rekonstruiert
- Text-Werkzeug: Grundfunktion vorhanden, aber noch nicht ausreichend getestet

### SEB / iPad
- SEB verursacht Probleme (Chrome-Crash, weisser Bildschirm, "veraltet")
- SuS haben jetzt "Ausnahme anfragen"-Button bei SEB-Blockierung
- **Empfehlung:** SEB vorerst deaktiviert lassen (`sebErforderlich: false`)

### Feature-Wünsche
- ✅ **Einzelne SuS an-/abwählen** — Checkboxen + "Alle/Keine"-Toggle existieren in TeilnehmerListe (25.03.2026)
- ✅ **Mehrere Prüfungen gleichzeitig** — Architektur unterstützt das bereits (State per pruefungId, sessionStorage tab-gebunden, APIs parametrisiert). Bestätigt durch Code-Audit 25.03.2026.

---

## Bekannte Architektur-Schwächen

### Google Sheets Spalten = Silent Data Loss
`speichereConfig` und `speichereFrage` schreiben nur in **existierende** Spalten. Wenn eine Spalte im Sheet-Header fehlt, werden Daten **stillschweigend verworfen**. Bei neuen Feldern immer prüfen ob die Spalte existiert.

### Apps Script Latenz
Jeder API-Call braucht 1-3 Sekunden (Cold Starts, Google-Infrastruktur). Optimistic UI ist implementiert für Freischalten und Lobby-Wechsel, aber das Grundproblem bleibt.

### Apps Script manuell aktualisieren
`apps-script-code.js` muss nach Änderungen manuell in den Apps Script Editor kopiert werden → "Bereitstellungen verwalten" → bestehende Version aktualisieren (Stift-Icon). **NICHT** "Neue Bereitstellung" (ändert URL!).

---

## Session 25.03.2026 (4) — Zeitzuschlag-Refactoring

### Erledigt
- **Zeitzuschlag von Composer → Durchführung verschoben:**
  - Neue `ZeitzuschlagEditor.tsx`-Komponente (wiederverwendbar, SuS-Dropdown statt E-Mail-Eingabe)
  - VorbereitungPhase: Zeitzuschlag nach Teilnehmer-Auswahl (mit SuS-Dropdown)
  - AktivPhase: Klappbarer "⏱ Zeitzuschläge"-Bereich, live editierbar während Prüfung
  - ConfigTab (Composer): Zeitzuschlag-Sektion entfernt
  - Speicherung via `speichereConfig()` bei jeder Änderung
- **Code-Quality-Rule:** `tsc -b` (statt `tsc --noEmit`) als Build-Check vor Commits verankert

### Neue/Geänderte Dateien
```
src/components/lp/ZeitzuschlagEditor.tsx  — NEU: Wiederverwendbarer Editor (Dropdown, kompakter Modus)
src/components/lp/VorbereitungPhase.tsx   — +onConfigUpdate Prop, ZeitzuschlagEditor eingebaut
src/components/lp/AktivPhase.tsx          — +onConfigUpdate Prop, klappbarer Zeitzuschlag-Bereich
src/components/lp/DurchfuehrenDashboard.tsx — onConfigUpdate verdrahtet (speichereConfig)
src/components/lp/composer/ConfigTab.tsx  — Zeitzuschlag-Sektion entfernt
.claude/rules/code-quality.md            — tsc -b Rule
```

### Offen
- **SEB nochmal testen** nach Login-Fixes, dann gezielt debuggen
- **F1-F15 Fixes live testen** (User testet nach Deploy)

---

## Session 25.03.2026 (3) — F1-F15 LP-Live-Test-Feedback

### Erledigt (12 Commits, 14 Tasks in 4 Clustern)
- **Cluster 1 — Korrektur:** Auto-Korrektur-Engine (9 Fragetypen), Vollansicht (Frage wie SuS + Musterlösung + Richtig/Falsch), PDF-Drive-Fallback, KI-ensureColumns
- **Cluster 2 — Resilienz:** Error-Banner bei Verbindungsverlust (statt Crash), Korrektur-Autosave (Debounce 3s + IndexedDB 10s)
- **Cluster 3 — Quick-Wins:** Lobby-Feedback, Polling 2s, Highlighter-Icon, PDF-min-height, Tab-Link nur LP, Beenden 1-Klick
- **Cluster 4 — Investigation:** Aufgabengruppe-beantwortet-Fix, Heartbeat mit beantworteteFragen, Korrektur-Status im Tracker

### Neue Dateien
```
src/utils/autoKorrektur.ts            — Auto-Korrektur für MC/RF/Lückentext/Zuordnung/Berechnung + FiBu-Delegation
src/hooks/useKorrekturAutoSave.ts     — Debounced Autosave + IndexedDB-Backup für Korrekturen
src/components/lp/KorrekturFrageVollansicht.tsx — Vollansicht: Frage + Antwort + Musterlösung + Auto-Korrektur
```

### Apps Script Änderungen (manuell kopieren!)
- `batchKorrektur`: `ensureColumns` für KI-Spalten
- `heartbeat`: schreibt `beantworteteFragen` ins Antworten-Sheet
- Neuer Endpoint: `ladeKorrekturStatus` (korrigiert/offen/gesamt)

### Spec + Plan
- `docs/superpowers/specs/2026-03-25-f1-f15-lp-live-test-feedback-design.md`
- `docs/superpowers/plans/2026-03-25-f1-f15-implementation.md`

---

## Session 25.03.2026 (2) — Production-Readiness Phase 0+1

### Erledigt
- **Phase 0 — Service Worker:** `autoUpdate` + `skipWaiting` + `clientsClaim`. Build-Timestamp (`__BUILD_TIMESTAMP__`). RetryQueue-DB im Reset aufgeräumt.
- **Phase 1.1 — remoteSaveVersion Bug:** Version wird jetzt erst nach erfolgreichem API-Call erhöht.
- **Phase 1.2 — Idempotenz-Key:** `requestId` (UUID) pro Save. Backend prüft `letzteRequestId` gegen Duplikate.
- **Phase 1.3 — Column Auto-Creation:** `ensureColumns()` Helper für alle 3 Speicher-Funktionen.
- **Phase 1.4 — safeJsonParse Logging:** `console.warn` bei Parse-Fehlern.
- **Phase 2.1 — IndexedDB bei Logout:** `clearIndexedDB()` + `clearQueue()` in `abmelden()`.
- **Phase 2.2 — durchfuehrungId:** LP-Reset generiert UUID, SuS erkennen stale State automatisch. Info-Banner.
- **Phase 2.3 — Reset-Benachrichtigung:** "Prüfung wurde zurückgesetzt" im Startbildschirm.

### Apps Script Änderungen (manuell kopieren!)
- `ensureColumns()` Helper
- `speichereAntworten`: Idempotenz + `ensureColumns`
- `speichereFrage` + `speichereConfig`: `ensureColumns`
- `safeJsonParse`: Warnung bei Fehler
- `resetPruefungEndpoint`: generiert `durchfuehrungId` (UUID)
- `ladePruefung`: gibt `durchfuehrungId` zurück

- **Phase 3.1 — Material-Panel:** Debug-Logging am Fallback (Typ/URL/DriveId in Console + UI)
- **Phase 3.2 — Warteraum:** Uhr-Icon, "WARTERAUM"-Label, blauer Rahmen

### Gesamtplan Phase 0-5 — KOMPLETT (25.03.2026)
Alle 6 Phasen des Production-Readiness-Plans abgeschlossen.

---

## Erster LP-Live-Test — Feedback (25.03.2026) — ✅ ALLE ERLEDIGT

### Kritisch (Datenverlust / Blocking)
| # | Problem | Status |
|---|---------|--------|
| F1 | **Verbindungsverlust LP** — Error-Banner statt Crash, bestehende Daten bleiben sichtbar | ✅ 25.03 |
| F2 | **Korrektur-Autosave** — Debounced (3s) + IndexedDB-Backup (10s) | ✅ 25.03 |

### Korrektur-Modus
| # | Problem | Status |
|---|---------|--------|
| F3 | **Musterlösungen** — Vollansicht mit Musterlösung (Text, Bild, FiBu-Struktur) | ✅ 25.03 |
| F4 | **Frage sichtbar** — Gleiche Ansicht wie SuS + Auto-Korrektur + Richtig/Falsch-Markierung | ✅ 25.03 |
| F5 | **KI-Punkte** — ensureColumns für KI-Spalten im Backend | ✅ 25.03 |
| F6 | **PDF in Korrektur** — Drive-Fallback wenn Base64 fehlt | ✅ 25.03 |

### UX-Verbesserungen
| # | Problem | Status |
|---|---------|--------|
| F7 | **Lobby-Feedback** — "Verbunden" mit grünem Status nach Heartbeat | ✅ 25.03 |
| F8 | **Schnellere Freischaltung** — Polling von 3s auf 2s | ✅ 25.03 |
| F9 | **LP-Fortschritt** — beantworteteFragen via Heartbeat (10s statt 30s) | ✅ 25.03 |
| F10 | **Highlighter-Icon** — Gelber Balken statt Kreide-Emoji | ✅ 25.03 |
| F11 | **PDF-Höhe** — min-h-[200px]/[300px] + responsive | ✅ 25.03 |
| F12 | **Tab-Link** — Nur für LP sichtbar (Rolle-Check) | ✅ 25.03 |
| F13 | **Aufgabengruppe beantwortet** — istVollstaendigBeantwortet prüft jetzt Teilaufgaben | ✅ 25.03 |
| F14 | **Beenden 1-Klick** — Vereinfachter Dialog wenn alle SuS abgegeben | ✅ 25.03 |
| F15 | **Korrektur-Status** — "X von Y korrigiert" im Tracker | ✅ 25.03 |

### Noch offene Feature-Wünsche (aus früherer Diskussion)
- ✅ **Zeitzuschlag (Nachteilsausgleich)** — Von Composer in Durchführung verschoben (25.03.2026)
- **SEB-Lösung** — Nach Login-Fixes nochmal testen, dann gezielt debuggen (nicht blind fixen)

---

## Session 25.03.2026 — Performance, Import-Tool, Bugfixes

### Erledigt
- **Performance:** Fetch-Timeout (30s), Optimistic UI (Freischalten, Lobby), Overlap-Schutz (Monitoring), paralleles Warteraum-Polling
- **Import-Tool:** `scripts/import-fragen.mjs` — generisches CLI für Fragen + Configs Import via API
- **Einrichtungsprüfung → Backend:** 18 Fragen + Config in Google Sheets importiert, `EINGEBAUTE_PRUEFUNGEN`-Sonderweg aus App.tsx entfernt
- **Zeichnen-Tool:** Objekt-Radierer, Toolbar horizontal, canvasConfig-Fallback
- **FiBu-Status:** Buchungssatz/TKonto/Kontenbestimmung/Bilanz haben eigene Validierung in `antwortStatus.ts`
- **Beenden-Dialog:** Vereinfacht bei 0 aktiven SuS (kein Auto-Beenden mehr)
- **SEB-Ausnahme:** SuS-Button "Ausnahme anfragen" im Startbildschirm
- **Korrektur-Tab:** Immer verfügbar (nicht nur bei `beendetUm`)
- **Aufgabengruppen:** Teilaufgaben werden in Store + Backend nachgeladen
- **Apps Script:** `getTypDaten` für PDF + Visualisierung, `ladeFragen` lädt Teilaufgaben, `speichereConfig` schreibt materialien + zeitModus, neuer `ladeDriveFile`-Endpoint
- **PDF in Drive:** witzsammlung.pdf hochgeladen, driveFileId importiert

### Problematik dieser Session
Viele reaktive Fixes ohne systematische Analyse. Feldnamen geraten (highlight vs highlighter, aktivSeite vs linkeSeite), fehlende Sheet-Spalten nicht geprüft, Service Worker Cache ignoriert. **Nächste Session: Erst vollständiges Audit, dann Fixes.**

### Apps Script Änderungen (manuell kopieren!)
- `getTypDaten`: cases für `pdf` und `visualisierung`
- `ladeFragen`: Aufgabengruppen-Teilaufgaben nachladen
- `speichereConfig`: `materialien` und `zeitModus` schreiben
- `ladePruefung`: `fachbereiche` parsen, `zeitModus` lesen
- `ladeAlleConfigs`: `zeitModus` lesen
- Neuer Endpoint: `ladeDriveFile` (GET, gibt Base64 zurück)

---

## Frühere Sessions

### 24.03.2026 (Session 4) — Erster Klassentest + Bugfix-Paket

Erster Live-Test mit Schülern. Login-Problem gelöst, dann umfangreiche Bugfixes.

### 24.03.2026 (Session 3) — Apps Script Deployment Fix

### 24.03.2026 (Session 2) — Backup-Export als Excel (v1.1)

### 24.03.2026 — PDF-Annotation (Neuer Fragetyp)

### 23.03.2026 — Zeichnen-Fragetyp

*Detaillierte Session-Logs: siehe Git-History.*

---

## Feature-Übersicht

| # | Feature | Datum |
|---|---------|-------|
| 1–7 | Basis (Auth, Fragen, Abgabe, Timer, Monitoring, AutoSave) | 17.03. |
| 8–14 | Warteraum, CSV-Export, Statistiken, Zeitzuschläge, Dark Mode, Login | 18.03. |
| 15–17 | Erweitertes Monitoring, Fragen-Dashboard, LP↔SuS Chat | 18.03. |
| 18–31 | UI/UX, Dateianhänge, KI-Assistent, SuS-Vorschau, Organisation | 19.03. |
| 32+ | FiBu-Fragetypen (5 Typen), Aufgabengruppen, Pool-Sync, RückSync | 20–21.03. |
| 33+ | Farbkonzept, Trennschärfe, Korrektur-Freigabe, Tool-Synergien | 22–24.03. |
| 34+ | Zeichnen-Fragetyp, PDF-Annotation | 23–24.03. |
| 35 | Backup-Export als Excel | 24.03. |
| 36 | Performance, Import-Tool, Einrichtungsprüfung via Backend | 25.03. |

---

## Neue Dateien (25.03.2026)

```
Pruefung/
├── scripts/
│   ├── import-fragen.mjs              — Generisches Import-CLI (Fragen + Configs)
│   ├── export-einrichtung.mjs         — Einrichtungsprüfung als JSON exportieren
│   └── data/
│       ├── einrichtungspruefung.json  — Alle 18 Fragen + Config
│       ├── fix-pdf-werkzeuge.json     — PDF mit korrekten Werkzeug-Namen
│       ├── fix-pdf-driveid.json       — PDF mit Drive-File-ID
│       └── fix-config-materialien.json — Config mit materialien
```

---

## Environment-Variablen

| Variable | Beschreibung | Wo setzen |
|----------|-------------|-----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client-ID | `.env.local` / GitHub Secrets |
| `VITE_APPS_SCRIPT_URL` | Apps Script Web-App URL | `.env.local` / GitHub Secrets |

Ohne diese Variablen: **Demo-Modus** (Schülercode + Demo-Prüfung).

## Google Workspace Setup

Alle 7 Teile erledigt (OAuth, Sheets, Apps Script, GitHub Actions, E2E, Fragenbank, KI-Korrektur). Details: `Google_Workspace_Setup.md`
