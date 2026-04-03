# Lernplattform — HANDOFF

## Aktueller Stand

**Branch:** `feature/lernplattform-phase5-6` (NICHT auf main gemergt — User muss zuerst testen + freigeben)
**Phase:** 5+6 abgeschlossen (Shared Types, Kontext-Trennung, Admin-Settings, Fragenbank-Migration, Offline-PWA)
**Status:** 93 Tests gruen, Build OK (322 KB JS + PWA)

### Commits auf dem Feature-Branch

| Commit | Beschreibung |
|--------|-------------|
| 2dced2b | Shared Library Grundgeruest (types, tsconfig, path alias) |
| 934a439 | Settings-Datenmodell + Store + Backend-Endpoints |
| 07cdfd0 | Fragenbank-Adapter: JSON -> Google Sheets |
| bb7b0ff | LernKontextProvider + Anrede-System + Fachfarben |
| 265636e | Dashboard + Quiz an LernKontext angebunden |
| 27f0393 | Admin-Settings-Panel (4 Tabs) |
| 3c8f267 | Offline-PWA: IndexedDB, Offline-Queue, Service Worker |
| 7febeff | Aufraeumen: pool-daten/ + convertPools.mjs entfernt |

### Verifikation

| Check | Status |
|-------|--------|
| `npx tsc -b` | OK |
| `npx vitest run` | 93 Tests gruen |
| `npm run build` | OK (322 KB JS, 198 Precache-Eintraege) |

---

## Was in dieser Session gemacht wurde

### Architektur-Aenderung
- **Fragenbank:** Statische JSON-Dateien (pool-daten/) ersetzt durch Google Sheets via Apps Script
- **Shared Library:** `packages/shared/` mit kanonischen Frage-Types (aus Pruefungstool)
- **Kontext-Trennung:** Gym (Sie, sachlich) vs. Familie (Du, ermutigend) via LernKontextProvider
- **Admin-Settings:** 4-Tab-Panel (Allgemein, Faecher, Farben, Mitglieder) mit Backend-Persistenz
- **Offline-PWA:** IndexedDB-Cache, Offline-Queue, Sync-Manager, Service Worker (Workbox)

### Neue Dateien

```
packages/shared/
  tsconfig.json
  src/types/fragen.ts              — Kanonische Frage-Interfaces
  src/types/auth.ts                — Gemeinsame Auth-Typen
  src/index.ts                     — Barrel Export

Lernplattform/src/
  types/settings.ts                — GruppenEinstellungen Interface
  store/settingsStore.ts           — Zustand Store fuer Einstellungen
  context/LernKontextProvider.tsx  — React Context (Gym/Familie)
  hooks/useLernKontext.ts          — Context-Hook
  utils/anrede.ts                  — Du/Sie Textbausteine
  utils/fachFarben.ts              — Dynamische Fachbereich-Farben
  utils/indexedDB.ts               — IndexedDB Wrapper
  utils/offlineQueue.ts            — Offline-Queue fuer fehlgeschlagene Writes
  utils/syncManager.ts             — Reconnect-Detection + Queue-Flush
  components/admin/AdminSettings.tsx
  components/admin/settings/AllgemeinTab.tsx
  components/admin/settings/FaecherTab.tsx
  components/admin/settings/FarbenTab.tsx
  components/admin/settings/MitgliederTab.tsx
  __tests__/settingsStore.test.ts
  __tests__/anrede.test.ts
  __tests__/fachFarben.test.ts
  __tests__/offlineQueue.test.ts
```

### Geaenderte Dateien

```
Lernplattform/tsconfig.app.json    — Path Alias @shared
Lernplattform/vite.config.ts       — Alias + VitePWA Plugin
Lernplattform/src/App.tsx           — LernKontextProvider + SyncManager
Lernplattform/src/adapters/appsScriptAdapter.ts — Sheets-Adapter + Settings-Methoden
Lernplattform/src/store/fortschrittStore.ts     — IndexedDB + Offline-Queue
Lernplattform/src/components/Dashboard.tsx       — Dynamische Farben + Kontext-Filter
Lernplattform/src/components/uebung/FeedbackPanel.tsx — Anrede-Texte
Lernplattform/src/components/uebung/QuizActions.tsx   — Anrede-Texte
Lernplattform/src/components/Zusammenfassung.tsx      — Anrede-Texte
Lernplattform/src/components/layout/AppShell.tsx      — Anrede-Texte
Lernplattform/src/components/admin/AdminDashboard.tsx — Einstellungen-Tab
Lernplattform/apps-script/lernplattform-backend.js    — 3 neue Endpoints
```

### Entfernte Dateien

```
Lernplattform/public/pool-daten/*.json (27 Dateien)
Lernplattform/scripts/convertPools.mjs
Lernplattform/scripts/output/*.json
Lernplattform/src/adapters/poolDaten.ts
Lernplattform/src/adapters/mockDaten.ts
Lernplattform/src/adapters/mockMitgliederDaten.ts
```

---

## Vor dem Merge: User muss

1. **Apps Script Backend neu deployen:**
   - `lernplattform-backend.js` in Apps Script Editor kopieren
   - Neue Bereitstellung erstellen (NICHT "HEAD" verwenden)
   - 3 neue Endpoints: lernplattformLadeEinstellungen, lernplattformSpeichereEinstellungen, lernplattformLadeFragen (ueberarbeitet)

2. **Gruppen-Registry Sheet:** `einstellungen`-Spalte wird automatisch erstellt beim ersten Speichern

3. **Familie-Gruppe:** Eigenes `fragebankSheetId` in der Gruppen-Registry eintragen (Datentrennung)

4. **Testen:** `cd Lernplattform && npm run preview` → Im Browser verifizieren

---

## Spaetere Sessions (Out of Scope)

### Shared Editor (Prioritaet: Hoch)
- FragenEditor aus Pruefungstool nach `packages/shared/` extrahieren
- ~12 Abhaengigkeiten abstrahieren (authStore, apiService, KI-Assistent, Upload, etc.)
- EditorConfig fuer kontextabhaengige Felder (Punkte, Bewertungsraster nur im Pruefungstool)
- Fragen erstellen/bearbeiten direkt in der Lernplattform

### Pruefungstool Path Alias
- `Pruefung/tsconfig.app.json` + `vite.config.ts` auf @shared umstellen
- Re-Exports in Pruefung fuer Backward-Compatibility

### Pool.html Features nachr\u00fcsten
- Suchfeld, Lernziele-Modal, Hilfe-Modal, Problem-melden, Schnellstart-Karten, Filter-Chips

### Phase 7: Backend-Persistenz (Rest)
- AuftragStore: localStorage -> Apps Script
- FortschrittStore: Backend-Sync vollstaendig (aktuell: IndexedDB + Offline-Queue, aber Backend-Endpoint noch nicht aufgerufen)
