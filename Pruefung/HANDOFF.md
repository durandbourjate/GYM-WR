# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

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
