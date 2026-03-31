# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Offene Punkte

- **SEB / iPad** — SEB weiterhin deaktiviert (`sebErforderlich: false`)
- ~~Fragenbank im Composer "nicht gefunden"~~ ✅ 27.03.2026
- ~~Apps Script Deploy nötig~~ ✅ 30.03.2026 — Session 33 + 34 deployed
- **Tier 2 Features (später):** Diktat, GeoGebra/Desmos, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox)
- **Übungspools ↔ Prüfungstool** — Lern-Analytik, Login, KI-Empfehlungen (eigenes Designprojekt)
- **Bewertungsraster-Vertiefung** — Überfachliche Kriterien, kriterienbasiertes KI-Feedback
- **TaF Phasen-UI** — klassenTyp-Feld vorhanden, UI für Phasen-Auswahl noch nicht
- ~~Bild-Upload für Hotspot/Bildbeschriftung/DragDrop~~ ✅ 28.03.2026
- ~~Aufgabengruppe Inline-Teilaufgaben~~ ✅ 28.03.2026
- **Verbleibende Security-Themen (nicht kritisch):**
  - ~~Rollen-Bypass via sessionStorage~~ ✅ 30.03.2026 — restoreSession() validiert Rolle aus E-Mail-Domain
  - Timer-Manipulation via localStorage (startzeit änderbar, aber Backend trackt Heartbeats)
  - Demo-Modus Bypass via sessionStorage (Lockdown deaktivierbar, nur relevant bei Kontrolle)
  - Rate Limiting auf API-Endpoints fehlt (DoS-Schutz)
  - Prompt Injection bei KI-Assistent (User-Input unsanitisiert an Claude)
  - `pruefung-state-*` in localStorage bleibt nach Abgabe (Zustand persist schreibt neu; wird bei Re-Login aufgeräumt)

---

## Session 38 — E2E-Test + KRITISCHER Bug-Fix (31.03.2026)

Vollständiger E2E-Test mit LP + SuS (Chrome-in-Chrome). Alle 23 Fragetypen gerendert ✅. Kritischer Datenverlust-Bug entdeckt und gefixt.

### KRITISCH: Race Condition — Heartbeat überschreibt Antworten

`heartbeat()` las die gesamte Sheet-Zeile (`getValues`), modifizierte nur Monitoring-Felder und schrieb die gesamte Zeile zurück (`setValues`). `speichereAntworten()` schrieb dazwischen Zelle-für-Zelle. Heartbeat überschrieb dabei die `antworten`-Spalte mit dem veralteten leeren Wert.

- Heartbeat: alle 10s, Auto-Save: alle 30s → min. 2 Heartbeats zwischen jedem Save
- Frontend meldete "Gespeichert ✓" (Backend gab `success: true`), aber Heartbeat löschte die Daten sofort wieder
- **Fix:** Vor Batch-Write im Heartbeat die geschützten Spalten (`antworten`, `version`, `letzterSave`, `istAbgabe`, `letzteRequestId`) frisch nachlesen

### Fix 2: Audio-Aufnahme "enthält keine Daten"

`recorder.start(1000)` mit timeslice produzierte leere Chunks → `blob.size === 0`. Zusätzlich: Permission-Dialog verzögert `getUserMedia`, User klickt nochmals → zweiter Recorder überschreibt `chunksRef`.

- **Fix:** `recorder.start()` ohne timeslice + Doppelklick-Guard + sofortiges `setStatus('recording')`
- **Verifiziert:** Audio-Player erscheint nach Stopp, Aufnahme abspielbar ✅

### Weitere Fixes

| # | Fix | Details |
|---|-----|---------|
| 1 | **TypeScript Build-Fehler** | `global` → `globalThis` in 2 Test-Dateien (3 Stellen), Type-Assertion für `result.optionen` |

### E2E-Test Ergebnis

| Test | Status |
|------|--------|
| LP Dashboard + Kurs-Auswahl | ✅ |
| Lobby → Live → SuS Warteraum | ✅ |
| Alle 23 Fragetypen rendern korrekt | ✅ |
| Navigation (Sidebar + Weiter/Zurück) | ✅ |
| Timer + Auto-Save Indikator | ✅ |
| Abgabe-Dialog (beantwortet/unbeantwortet) | ✅ |
| Bestätigungsseite (Name + E-Mail) | ✅ |
| LP Live-Monitoring (Status, Frage, %) | ✅ |
| LP Auswertung + Auto-Korrektur | ✅ |
| Musterlösung + Korrektur-Vollansicht | ✅ |
| **Antworten im Backend** | 🔴→✅ (nach Fix) |

### Apps Script Deploy nötig ✅ 31.03.2026

---

## Session 37 — ROOT CAUSE Fixes + Browser-Test + iPad (30–31.03.2026)

Systematischer Browser-Test (LP + SuS) + iPad-Test. Zwei kritische Root Causes gefunden und gefixt.

### ROOT CAUSE: LP bekam keine korrekt-Felder

`ladePruefung()` (Zeile 1060) wendete `bereinigeFrageFuerSuS_()` auf ALLE Requests an — auch LP. Die LP-Korrektur nutzt denselben Endpoint (`useKorrekturDaten.ts:116`), brauchte aber `korrekt` für:
- MCAnzeige (grün/rot Markierung)
- autoKorrigiere() (Punkteberechnung)
- Musterlösung-Anzeige

**Fix:** `istLP ? fragen : fragen.map(bereinigeFrageFuerSuS_)` — LP bekommt volle Daten, SuS weiterhin gestrippte.

### ROOT CAUSE: gesamtFragen nie im Heartbeat geschrieben

`heartbeat()` ignorierte `body.gesamtFragen` obwohl Frontend es alle 10s sendete. Nur `speichereAntworten()` schrieb es → nach Abgabe war der letzte Heartbeat-Wert 0.

**Fix:** `heartbeat()` schreibt jetzt `gesamtFragen` + Spalten-Migration.

### Weitere Fixes

| # | Fix | Details |
|---|-----|---------|
| 1 | **effektivePunkte() leere Strings** | Backend `lpPunkte: ''` als null behandelt |
| 2 | **useEffect Timing** | Abhängig von `korrektur` UND `autoErgebnisseAlle` (vorher nur autoErgebnisse → feuerte vor Datenladung) |
| 3 | **Abgabe-Status** | `istAbgabe === 'true'` → immer `'abgegeben'` (alte Logik verglich Zeitstempel falsch) |
| 4 | **Korrektur-Vollansicht** | Hotspot/Bildbeschriftung/DragDrop/PDF zeigen jetzt Bild + Kontext |
| 5 | **Fortschritt nach Abgabe** | 100%/✓ statt 0%/X/0 |
| 6 | **Audio iOS** | WebM/Opus → MP4/AAC Fallback + Blob-Validierung + URL.createObjectURL |
| 7 | **DragDrop Touch** | `touchAction: 'manipulation'` |
| 8 | **Stifteingabe** | RDP-Toleranz 1.5 → 0.8 |
| 9 | **Sticky Header iOS** | `overflow-hidden` von äusserem Container entfernt |
| 10 | **CSP frame-src** | `*.googleusercontent.com` für Material-PDFs |
| 11 | **Material-PDF Fallback** | "In neuem Tab öffnen" Link |
| 12 | **E2E-Smoke-Checklist** | `docs/e2e-smoke-test.md` mit 50+ Prüfpunkten |
| 13 | **6 neue Tests** | `effektivePunkte()` Edge Cases (167 total) |

### Browser-Verifiziert (31.03.2026)

| Test | Ergebnis |
|------|----------|
| Frage 1: C "23 Fragen" korrekt markiert | ✅ |
| Musterlösung in Korrektur sichtbar | ✅ |
| Auto-Korrektur: 1/1 Pkt. im Punkte-Feld | ✅ |
| Status "Abgegeben" (nicht "Erzwungen") | ✅ |
| Erzwungen: 0 in Ergebnis-Übersicht | ✅ |
| Fortschritt 4% erhalten nach Abgabe | ✅ |
| Frage 2/23 korrekt im Monitoring | ✅ |
| Heartbeat + Auto-Save funktioniert | ✅ |

### Offen (iPad — nach Deploy verifizieren)

| # | Problem | Status |
|---|---------|--------|
| ~~Audio-Aufnahme~~ | ~~Codec-Fallback deployed~~ ✅ 31.03.2026 — timeslice-Bug + Doppelklick-Guard gefixt, Desktop verifiziert |
| — | PDF-Annotation iPad | Touch-Probleme, nicht gefixt |
| — | Stifteingabe iPad | Toleranz reduziert, muss verifiziert werden |
| — | Material-PDFs | Google Drive Freigabe prüfen + Fallback-Link vorhanden |

**Tests:** 167 grün. `tsc -b` sauber. **Apps Script Deploy nötig.**

### Strang 1: Auto-Korrektur + Monitoring-Bugs

| # | Fix | Details |
|---|-----|---------|
| 1 | **effektivePunkte() leere Strings** | Backend schreibt `lpPunkte: ''` (leerer String). `??`-Operator behandelt '' nicht als null → Punkte zeigten 0. Neue `istPunkteGesetzt()`-Hilfsfunktion. |
| 2 | **useEffect Auto-Korrektur robuster** | `useKorrekturDaten.ts`: Prüft jetzt auch leere Strings als "nicht gesetzt". |
| 3 | **Abgabe-Status 'erzwungen'** | `apps-script-code.js`: `istAbgabe === 'true'` → Status immer `'abgegeben'`. Alte Logik verglich Zeitstempel falsch bei wiederholten Testläufen. |
| 4 | **gesamtFragen bei Abgabe** | `AbgabeDialog.tsx` + `Timer.tsx`: `gesamtFragen: fragen.length` bei Abgabe mitsenden → Monitoring zeigt korrekten Fortschritt. |
| 5 | **Fortschritt nach Abgabe** | `SchuelerZeile.tsx`: Zeigt 100%/✓ statt 0%/9/0 wenn `gesamtFragen = 0` aber abgegeben. |

### Strang 2: Korrektur-Vollansicht mit Bildern/PDFs

| # | Fix | Details |
|---|-----|---------|
| 6 | **HotspotAnzeige** | Bild + korrekte Bereiche (gestrichelt grün) + SuS-Klicks (rot). |
| 7 | **BildbeschriftungAnzeige** | Bild + Labels an Positionen mit ✓/✗ Farbcodierung + Textliste. |
| 8 | **DragDropBildAnzeige** | Bild + Zonen mit platzierten Labels (grün=korrekt, rot=falsch). |
| 9 | **PDFAnnotationAnzeige** | PDF als iframe/MediaAnhang + Annotationsinfo. |

### Strang 3: iPad-spezifische Fixes

| # | Fix | Details |
|---|-----|---------|
| 10 | **Audio iOS** | `AudioFrage.tsx`: WebM/Opus → MP4/AAC Fallback via `MediaRecorder.isTypeSupported()`. |
| 11 | **DragDrop Touch** | `DragDropBildFrage.tsx`: `touchAction: 'manipulation'` auf Container. Tap-to-select war implementiert, Touch-Events wurden aber vom Browser als Scroll interpretiert. |
| 12 | **Stifteingabe** | `useDrawingEngine.ts`: RDP-Vereinfachung 1.5 → 0.8 (weniger Buchstaben-Sprünge). |
| 13 | **Sticky Header** | `Layout.tsx`: `overflow-hidden` vom äusseren Container entfernt (bricht `position: sticky` auf iOS). |
| 14 | **Material-PDFs** | `index.html`: `*.googleusercontent.com` zu CSP `frame-src` hinzugefügt. |

### Strang 4: Tests + Dokumentation

| # | Feature | Details |
|---|---------|---------|
| 15 | **6 neue Tests** | `korrekturUtils.test.ts`: Edge Cases für `effektivePunkte()` (leere Strings, 0, undefined). |
| 16 | **E2E-Smoke-Checklist** | `docs/e2e-smoke-test.md`: 50+ manuelle Prüfpunkte für Regressionstests. |

### Offen (iPad — User-Verifikation nötig nach Deploy)

| # | Problem | Status |
|---|---------|--------|
| — | PDF-Annotation auf iPad | Fixes deployed (CSP + touchAction), muss am iPad verifiziert werden |
| — | Stifteingabe Qualität | RDP-Toleranz reduziert, muss am iPad verifiziert werden |
| — | Freitext/Code Auto-Focus | iOS-Limitation (nur bei User-Geste), nicht fixbar ohne SEB |

**Dateien geändert:** `korrekturUtils.ts`, `korrekturUtils.test.ts`, `useKorrekturDaten.ts`, `KorrekturFrageVollansicht.tsx`, `SchuelerZeile.tsx`, `AbgabeDialog.tsx`, `Timer.tsx`, `apps-script-code.js`, `AudioFrage.tsx`, `DragDropBildFrage.tsx`, `useDrawingEngine.ts`, `Layout.tsx`, `index.html`, `docs/e2e-smoke-test.md` (neu)

**Tests:** 167 grün (+6 neue). `tsc -b` sauber.

**Wichtig:** Apps Script muss neu deployed werden für den Status-Fix (#3).

---

## Session 36 — iPad-Test Bugfixes (30.03.2026)

Systematische Behebung aller Probleme aus dem iPad-Test (Demo-SuS + LP/SuS-Login).

### Strang A: Korrektur-Regression — LP sieht vollen Fragekontext

| # | Fix | Details |
|---|-----|---------|
| A1 | **Anhänge in LP-Korrektur** | `KorrekturFrageVollansicht.tsx`: Bilder, PDFs, Materialien werden jetzt über `MediaAnhang` angezeigt. |
| A2 | **Formel-Korrektur (KaTeX)** | Neue `FormelAnzeige`-Komponente: Rendert SuS-LaTeX via KaTeX mit Fallback auf Raw-Code. |
| A3 | **Zeichnung-Korrektur (PNG)** | Neue `VisualisierungAnzeige`: Zeigt PNG-Export der SuS-Zeichnung. |
| A4 | **PDF-Annotation-Korrektur** | Neue `PDFAnnotationAnzeige`: Zeigt Anzahl Markierungen. |
| A5 | **Audio-Korrektur** | Neue `AudioAnzeige`: Abspielbarer AudioPlayer für SuS-Aufnahme. |
| A6 | **Code-Korrektur** | Neue `CodeAnzeige`: Monospace-Darstellung des SuS-Codes. |
| A7 | **Sortierung/Hotspot/Bildbeschriftung/DragDrop** | Neue Anzeige-Komponenten für alle verbleibenden Fragetypen. |
| A8 | **Lückentext-Musterlösung** | `MusterloesungBox`: Zeigt korrekte Antworten pro Lücke. |

### Strang B: iPad Touch-Kompatibilität

| # | Fix | Details |
|---|-----|---------|
| B1 | **Sticky Header (iOS)** | `Layout.tsx`: `h-screen` → `h-dvh` (dynamic viewport height, korrekt auf iOS). |
| B2 | **Sortierung Touch-DnD** | `SortierungFrage.tsx`: Pointer-Events für Touch-Geräte. `pointerdown`/`pointermove`/`pointerup` zusätzlich zu HTML5-DnD. `touchAction: none` auf Container. |
| B3 | **DragDrop-Karte Tap-to-select** | `DragDropBildFrage.tsx`: Tap-to-select + Tap-to-place Mechanismus für Touch. Label antippen → grün markiert → Zone antippen → platziert. |
| B7 | **PDF Zoom erweitert** | `PDFTypes.ts`: Neue Stufen 200%, 300%. `PDFFrage.tsx`: Standardzoom 125% statt 100%. |
| B8 | **Material-PDFs (CSP)** | `index.html`: `frame-src` um `drive.google.com` + `docs.google.com` erweitert. Material-iframes wurden durch CSP blockiert. |

### Strang C: UX-Verbesserungen

| # | Fix | Details |
|---|-----|---------|
| C1 | **Formel Operatoren + Undo** | `FormelFrageComponent.tsx`: Neue Gruppen (Klammern, `<>`, `=`, `→`). Undo-Stack (max 20 Schritte) + ↩ Button. |
| C2 | **Audio AirPlay** | `AudioFrage.tsx`: `controlsList="nodownload noplaybackrate"` auf `<audio>` Element. |

### Strang B/C Fortsetzung (2. Commit)

| # | Fix | Details |
|---|-----|---------|
| B6 | **Zeichnen Touch-Toleranz** | `useDrawingEngine.ts`: Hit-Test Toleranz von 8px auf 16px für Touch-Geräte (Finger vs. Maus). |
| B7+ | **PDF touchAction für alle Werkzeuge** | `PDFSeite.tsx`: `touchAction: 'none'` für alle aktiven Werkzeuge (nicht nur Freihand). Verhindert, dass Highlight/Text/Kommentar das PDF verschieben statt zu annotieren. |
| C6 | **Restore-Bug (andere Prüfung im Store)** | `App.tsx`: Bei Recovery prüft `storePruefungId === pruefungIdAusUrl`. Bei Mismatch wird alter State gelöscht. |

### Offen (Browser-Verifikation am iPad nötig)

| # | Problem | Status |
|---|---------|--------|
| B4-B5 | Freitext/Code Auto-Focus Tastatur | iOS erlaubt Keyboard nur bei direkter User-Geste — programmatischer Focus reicht nicht |
| C4 | Dictation deaktivieren | iOS-System-Feature, nur via SEB/MDM möglich |
| C5 | Status "aktiv" nach Abgabe | Backend-Logik ist korrekt (`istAbgabe`-Feld wird geprüft). Vermutlich Timing/Demo-Artefakt — bei echtem Test verifizieren |

**Dateien geändert (gesamt):** `KorrekturFrageVollansicht.tsx`, `Layout.tsx`, `SortierungFrage.tsx`, `DragDropBildFrage.tsx`, `PDFTypes.ts`, `PDFFrage.tsx`, `index.html`, `FormelFrageComponent.tsx`, `AudioFrage.tsx`, `PDFSeite.tsx`, `useDrawingEngine.ts`, `App.tsx`

**Tests:** 161 grün. `tsc -b` sauber.

---

## Session 35 — Sicherheitsaudit + Heartbeat-Fix (30.03.2026)

Systematischer Sicherheits- & Qualitätsaudit mit Chrome-in-Chrome (LP + 2 SuS). 10 Kategorien getestet.

### Strang 1: Kritischer Heartbeat-Bug

| # | Fix | Schwere | Details |
|---|-----|---------|---------|
| 1 | **sessionToken in heartbeat()** | KRITISCH | Session 34 (B1) machte Token mandatory, aber `pruefungApi.ts:heartbeat()` nutzte raw `fetch()` statt `apiClient`-Helpers → Token nie gesendet. Alle SuS-Heartbeats = "Nicht autorisiert" → LP sah 0 SuS im Monitoring. |
| 2 | **sessionToken in speichereAntworten()** | KRITISCH | Gleicher Bug: `speichereAntworten()` nutzte ebenfalls raw `fetch()` → Auto-Save für SuS funktionierte nicht. |
| 3 | **getSessionToken() exportiert** | — | `apiClient.ts:getSessionToken()` von `function` zu `export function` geändert, damit `pruefungApi.ts` darauf zugreifen kann. |

### Strang 2: 5 Findings aus Audit

| # | Fix | Schwere | Details |
|---|-----|---------|---------|
| H1 | **Rollen-Bypass Schutz** | HOCH | `restoreSession()` in `authStore.ts` validiert Rolle aus E-Mail-Domain. SuS mit `@stud.gymhofwil.ch` kann nicht mehr `rolle: 'lp'` vortäuschen. |
| H2 | **CSP meta-Tag** | HOCH | `Content-Security-Policy` in `index.html`: default-src self, script-src self + Google, connect-src self + Apps Script. |
| M1 | **localStorage-Cleanup** | MITTEL | `AbgabeDialog.tsx` löscht `pruefung-abgabe-*` nach erfolgreicher Abgabe (Datenschutz). |
| M3 | **Heartbeat-Backoff** | MITTEL | Exponentielles Backoff bei Fehlern (10s → 20s → 40s → 60s max). `setInterval` → `setTimeout`-Kette. Verhindert Error-Spam (vorher 91 Errors in 4 Min). |
| M4 | **Touch-Targets 44px** | MITTEL | Frage-Buttons `w-9 h-9` → `w-11 h-11` (36→44px). Header-Buttons `min-h-[40px]` → `min-h-[44px]`. WCAG-konform für iPad-Prüfungen. |

### Audit-Ergebnisse (verifiziert im Browser)

| Test | Ergebnis |
|------|----------|
| Heartbeat + Monitoring | ✅ 2 SuS sichtbar, Echtzeit-Fortschritt, Frage-Nummer |
| Auto-Save | ✅ "Speichert..." Indikator, Daten ans Backend |
| Rollen-Bypass (H1) | ✅ @stud-Email wird bei Manipulation auf SuS zurückgesetzt |
| CSP (H2) | ✅ meta-Tag vorhanden, Inline-Scripts blockiert |
| Touch-Targets (M4) | ✅ 44×44px Buttons |
| Abgabe-Flow | ✅ Dialog → Abgabe → LP sieht "Abgegeben" |
| localStorage-Cleanup (M1) | ✅ pruefung-abgabe-* entfernt (state-* bleibt wegen Zustand persist) |
| Zwei SuS unabhängig | ✅ Verschiedene Fortschritte, keine Interferenz |
| Lösungsdaten-Schutz | ✅ Keine Musterlösungen in SuS-Response (auch bei LP-Email-Spoofing) |
| IDOR-Schutz | ✅ Fremde Korrekturen nicht abrufbar |
| XSS-Schutz | ✅ Script-Tags als Plaintext, DOMPurify korrekt in 4 Komponenten |
| Token-Manipulation | ✅ Ohne/Fake/Fremder Token blockiert |

**Dateien geändert:** `apiClient.ts`, `pruefungApi.ts`, `authStore.ts`, `index.html`, `Layout.tsx`, `FragenNavigation.tsx`, `AbgabeDialog.tsx`, `usePruefungsMonitoring.ts`

**Tests:** 161 grün. `tsc -b` sauber.

---

## Session 34 — Bugfixes + Sicherheits-Härtung (30.03.2026)

### Strang 1: Bugfixes aus systematischem Test

| # | Fix | Details |
|---|-----|---------|
| 1 | **React Error #310 (Crash)** | `Layout.tsx`: `useCallback`-Hooks vor Early Return verschoben. Verhinderte Crash bei Recovery nach Reload. |
| 2 | **PDF Canvas Race Condition** | `usePDFRenderer.ts`: `renderTask.cancel()` vor neuem Render, `RenderingCancelledException` abgefangen. |
| 3 | **Fragen-Zählung LP vs SuS** | `usePruefungsMonitoring.ts`: Auto-Save sendet `fragen.length` (23) statt `alleFragen.length` (25). |
| 4 | **"Durchgefallen" für aktive SuS** | `useKorrekturDaten.ts` + `KorrekturDashboard.tsx`: Statistik nur für abgegebene SuS. |
| 5 | **Markdown in Aufgabengruppe** | `AufgabengruppeFrage.tsx`: `renderMarkdown()` für Kontext-Text. |
| 6 | **ZeichnenKorrektur Warning** | `ZeichnenKorrektur.tsx`: Leere Zeichnung (`[]`) früh abgefangen. |

### Strang 2: Sicherheits-Audit + Härtung

Systematischer Security-Audit mit Browser-Tests (Chrome DevTools, API-Manipulation). 6 kritische + 6 hohe Schwachstellen gefunden und gefixt.

#### Backend (apps-script-code.js) — 8 Fixes

| # | Fix | Schwere | Details |
|---|-----|---------|---------|
| B1 | **Session-Token mandatory** | KRITISCH | `speichereAntworten` + `heartbeat`: Token-Prüfung nicht mehr optional. Google OAuth SuS bekommen Token automatisch via `ladePruefung`. |
| B2 | **IDOR Korrektur-Endpoints** | KRITISCH | `ladeKorrekturenFuerSuS` + `ladeKorrekturDetail`: Session-Token muss zur angefragten E-Mail passen. Fremde Noten nicht mehr abrufbar. |
| B3 | **Lösungsdaten-Leak** | KRITISCH | `ladePruefung` wendet `bereinigeFrageFuerSuS_()` IMMER an — auch bei LP-E-Mail. LP braucht Lösungen hier nicht (Fragenbank/Korrektur laden separat). |
| B4 | **Nachträgliche Abgabe** | KRITISCH | `speichereAntworten` blockiert bei `status=beendet` und bei bereits abgegebenen SuS. |
| B5 | **LP-Ownership Monitoring** | HOCH | `ladeMonitoring`: Nur Ersteller oder berechtigte LPs. |
| B6 | **Drive-File-Zugriff** | HOCH | `ladeDriveFile`: Nur Dateien aus erlaubten Ordnern (Anhänge, Materialien, SuS-Uploads). |
| B7 | **MIME-Type Whitelist** | HOCH | `uploadAnhang` + `uploadMaterial`: Nur erlaubte Dateitypen (Bilder, PDF, Audio, Video, Office). |
| B8 | **doPost Auth-Layer** | HOCH | Zentrale Auth-Prüfung: LP-Aktionen brauchen LP-E-Mail, SuS-Aktionen brauchen gültige Domain. |

#### Frontend — 3 Fixes

| # | Fix | Details |
|---|-----|---------|
| F1 | **Security Headers** | `index.html`: X-Frame-Options (SAMEORIGIN), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin). |
| F3 | **localStorage Hardening** | `pruefungStore.ts`: heartbeats/netzwerkFehler/unterbrechungen nicht mehr persistiert. |
| F4 | **Session-Token bei GET** | `apiClient.ts`: Session-Token auch bei GET-Requests mitgesendet. `pruefungApi.ts`: Token aus `ladePruefung`-Response in sessionStorage gespeichert. |

#### Verifizierte Angriffsvektoren (alle blockiert)

| Angriff | Ergebnis |
|---------|----------|
| `ladePruefung` mit LP-E-Mail → Lösungen | ✅ Keine Lösungen |
| IDOR: Noten anderer SuS abrufen | ✅ "Nicht autorisiert" |
| `speichereAntworten` ohne Token | ✅ "Nicht autorisiert" |
| E-Mail-Spoofing mit eigenem Token | ✅ "Nicht autorisiert" |
| LP-Aktion als SuS | ✅ "Nur für Lehrpersonen" |
| Heartbeat ohne Token | ✅ "Nicht autorisiert" |
| Ungültige E-Mail-Domain | ✅ "Nicht autorisiert" |
| Drive-File mit beliebiger ID | ✅ "Zugriff verweigert" |

**Tests:** 161 grün. `tsc -b` sauber. Apps Script deployed + Browser-verifiziert.

---

## Session 33 — Übungspools Fragetypen + Security + Bugfixes (30.03.2026)

### Strang 1: Übungspools — Neue Fragetypen

| # | Feature | Details |
|---|---------|---------|
| 1 | **5 neue Fragetypen in pool.html** | Buchungssatz, T-Konto, Bilanz/ER, Kontenbestimmung, Aufgabengruppe. CSS, Render, Check-Logik, restoreAnswerState, getCorrectAnswer. |
| 2 | **44 neue FiBu-Übungsfragen** | bwl_fibu.js: 19 Buchungssatz + 5 T-Konto + 4 Bilanz + 5 Kontenbestimmung + 5 Aufgabengruppen. Themen: Erfolgsrechnung, Warenkonten, Eigentümer, Wertberichtigungen, Abgrenzungen. |
| 3 | **Dynamische Zähler** | index.html: Hardcodierte questions/topics durch dynamisches Laden aus config/*.js ersetzt. Regex für beide Formate (id: und "id":). |
| 4 | **Typ-Filter intelligent** | pool.html: Fragetyp-Chips nur für im Pool vorhandene Typen anzeigen. |
| 5 | **Fehlender Pool** | vwl_konjunktur im POOLS-Array ergänzt (74 Fragen). |

### Strang 2: Prüfungstool — Security

| # | Fix | Details |
|---|-----|---------|
| A | **🔴 Lösungsdaten aus SuS-Response entfernt** | `bereinigeFrageFuerSuS_()` entfernt musterlosung, bewertungsraster, korrekt (MC/RF), korrekteAntworten (Lückentext), toleranz (Berechnung). LP bekommt weiterhin alles. Korrektur-Einsicht (nach Freigabe) nicht betroffen. |
| B | **Verifiziert im Browser** | API-Response geprüft: 0 Lösungsfelder in SuS-Response. |

### Strang 3: Prüfungstool — Bugfixes

| # | Fix | Details |
|---|-----|---------|
| C | **Crash "t is not iterable"** | `fragenResolver.ts`: Inline-Teilaufgaben bekommen Default-Arrays statt undefined. |
| D | **Defensive Array-Checks** | 11 Fragetyp-Komponenten: 25× `?? []` eingefügt (MCFrage, RichtigFalsch, Lückentext, Zuordnung, Berechnung, Sortierung, Kontenbestimmung, BilanzER, Aufgabengruppe, Bildbeschriftung, DragDrop). |
| E | **parseFrage Default-Case** | Neuere Fragetypen (Sortierung, Hotspot, Bildbeschriftung, DragDrop, Audio, Code, Formel) fielen in Default und bekamen nur base-Felder. Jetzt: 3-stufiger Fallback (json-Spalte → typDaten → alle Spalten). |
| F | **getTypDaten() erweitert** | Explizite Cases für 7 fehlende Fragetypen + Default-Fallback der alle nicht-base Felder speichert. |
| G | **Einrichtungsprüfung repariert** | `repariereEinrichtungsFragen()` — 7 Fragen mit leeren typDaten direkt im Sheet korrigiert. Funktion kann nach Ausführung gelöscht werden. |

### Strang 4: Prüfungstool — Feedback-System

| # | Feature | Details |
|---|---------|---------|
| H | **FeedbackModal.tsx** | Typ-Auswahl (Problem/Wunsch), kontextabhängige Kategorien, optionaler Kommentar, Image-Ping an Übungspool-Endpoint. |
| I | **FeedbackButton.tsx** | 3 Varianten: icon (Header), text (Action-Bar), link (unter Fragen). |
| J | **LP-Header** | 💬 Feedback-Icon neben Theme-Toggle. |
| K | **Korrektur-Fragenansicht** | ⚠️ "Problem melden"-Link unter jeder Frage (LP). |
| L | **SuS-Korrektur-Einsicht** | 💬 Icon im Header + ⚠️ Link pro Frage. |
| M | **Apps Script Endpoint** | `source=pruefung` → Tab `Pruefung-Feedback` (automatisch erstellt). |

**Tests:** Alle 23 Fragen der Einrichtungsprüfung crash-frei durchgeklickt (SuS). LP-Dashboard zeigt SuS korrekt. `tsc -b` sauber.

---

## Session 32 — LP-Editor UX + Demo-Layout (28.03.2026)

### Strang 1: SuS-Layout

| # | Feature | Details |
|---|---------|---------|
| 1 | **Header-Navigation** | Zurück/Weiter/Unsicher in den Header integriert (eine Leiste, kein separater Block) |
| 2 | **Volle Breite** | `max-w-3xl` entfernt — Fragen nutzen gesamte Bildschirmbreite |
| 3 | **Demo-Fragen verteilt** | "Teil G" aufgelöst → 6 thematische Teile (A: Orientierung, B: Text, C: Zuordnung, D: Zeichnen, E: FiBu, F: Features) |
| 4 | **PDF Freihand-Select** | Freihand-Annotationen selektierbar (blauer Rahmen), verschiebbar, Farbe änderbar |
| 5 | **Toolbar-Harmonisierung** | Bild + PDF: onOpen aktiviert Werkzeug direkt, "Text einfügen" entfernt, Farben 3x3 Grid (44px), pointerdown |

### Strang 2: LP-Editor

| # | Feature | Details |
|---|---------|---------|
| A | **Fragetypen-Menü** | 6 Kategorien (Text, Auswahl, Bilder, MINT, FiBu, Struktur) + Suchfeld. FiBu nur bei WR. Neue Komponente `FrageTypAuswahl.tsx`. |
| B | **Standard-Bewertungsraster** | Sinnvolle Defaults pro Fragetyp beim Erstellen (z.B. Freitext: Inhalt + Argumentation + Sprache) |
| C | **R/F Erklärung-Sichtbarkeit** | Neues Feld `erklaerungSichtbar` + Toggle "Erklärungen den SuS in Korrektur-Einsicht zeigen" |
| D | **Rechtschreibprüfung Hinweis** | Info-Box im FreitextEditor mit Verweis auf Prüfungskonfiguration |
| E | **PDF "keine" Vorlage** | Dropdown-Option "Keine Kategorien" setzt `kategorien: []` |
| F | **Audio iPhone-Hinweis** | Hinweis zu Continuity Camera im LP-Editor |

**Tests:** 161 grün. `tsc -b` sauber.

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
