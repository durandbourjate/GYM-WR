# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

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

### Gesamtplan — KOMPLETT (25.03.2026)
Alle 6 Phasen des Production-Readiness-Plans abgeschlossen. Plan: `.claude/plans/humming-dancing-waffle.md`

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
