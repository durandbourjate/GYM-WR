# Lernplattform Phase 5+6 — Shared Fragenbank, Kontext-Trennung, Admin-Settings

**Datum:** 2026-04-03
**Status:** Design
**Scope:** Shared Types/Utils + Kontext-Trennung Gym/Familie + Admin-Settings-Panel + Fragenbank-Migration + Offline-PWA

---

## 1. Ueberblick

Die Lernplattform wird von statischen JSON-Dateien (pool-daten/) auf die gemeinsame Fragenbank (Google Sheets) umgestellt. Beide Tools (Pruefungstool + Lernplattform) nutzen dieselbe Datenquelle. Gleichzeitig wird die Kontext-Trennung (Gym vs. Familie) mit konfigurierbaren Einstellungen und Admin-UI umgesetzt. Die App funktioniert als volle Offline-PWA.

### Architektur-Aenderung

```
BISHER:
  Uebungspools (.js) -> convertPools.mjs -> statische JSON -> Lernplattform
  Pruefungstool -> eigene Fragenbank (Google Sheets)

NEU:
  Google Sheets (Fragenbank) = Single Source of Truth
      |
      +-- Apps Script API
      |     |
      |     +-- Pruefungstool (alle Felder, eigener Editor)
      |     +-- Lernplattform (Subset, read-only + Admin-CRUD)
      |
      +-- Offline-Cache (IndexedDB) fuer PWA
      |
      +-- Uebungspools (pool.html bleibt fuer SuS-Uebungen, liest weiterhin .js)
```

### Datenmodell: Gym vs. Familie

- **Gym-Gruppen:** `fragebankSheetId` verweist auf Pruefungstool-Fragenbank (geteilt)
- **Familie-Gruppen:** Eigenes `fragebankSheetId` pro Gruppe (Datentrennung Schule/Privat)
- Jede Gruppe hat ihr eigenes Fragenbank-Sheet. Gym-Gruppen koennen dasselbe Sheet teilen.

### Was entfaellt

- `Lernplattform/public/pool-daten/*.json` (statische Fragen-JSONs)
- `Lernplattform/scripts/convertPools.mjs` (Konverter)
- `Lernplattform/src/adapters/poolDaten.ts` (JSON-Loader)
- `Lernplattform/src/adapters/mockDaten.ts` (Mock-Fallback)
- `Lernplattform/src/adapters/mockMitgliederDaten.ts` (Mock-Mitglieder)

### Was NICHT in diesem Scope ist (spaeter)

- **Shared Editor:** FragenEditor aus Pruefungstool extrahieren nach `packages/shared/`. Der Editor hat ~12 tiefe Abhaengigkeiten (authStore, apiService, KI-Assistent, Upload, etc.) und braucht eine sorgfaeltige Dependency-Analyse. Fragen erstellen/bearbeiten geht vorerst nur im Pruefungstool. Eigene Session geplant.

---

## 2. Shared Library (packages/shared/) — Nur Types + Utils

### 2.1 Struktur (Phase 1 — minimaler Scope)

```
packages/shared/
  tsconfig.json
  src/
    types/
      fragen.ts              <- Kanonisches Frage-Interface (aus Pruefung)
      auth.ts                <- Gemeinsame Auth-Typen
    utils/
      kontenrahmen.ts
      markdown.ts
      latexRenderer.ts
    components/
      FrageText.tsx           <- Markdown/LaTeX-Renderer
      KontenSelect.tsx        <- Kontenrahmen-Dropdown (FiBu)
    data/
      kontenrahmen-kmu.json
    index.ts
```

Editor-Komponenten (FragenEditor, TypEditorDispatcher, 25+ Editoren, Sections) bleiben vorerst im Pruefungstool. Extraktion ist fuer eine spaetere Session geplant.

### 2.2 Integration (TypeScript Path Alias)

Kein npm Workspace, sondern TypeScript Path Alias:

```jsonc
// Lernplattform/tsconfig.app.json + Pruefung/tsconfig.app.json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

```typescript
// Lernplattform/vite.config.ts + Pruefung/vite.config.ts
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../../packages/shared/src')
  }
}
```

### 2.3 GitHub Actions

Build-Pipeline muss `packages/shared/` aufloesen koennen. Da TypeScript Path Alias verwendet wird (kein npm install noetig), reicht es wenn das gesamte Repo ausgecheckt ist — was bereits der Fall ist. Vite-Config in beiden Projekten bekommt den Alias.

---

## 3. Settings-Datenmodell

### 3.1 GruppenEinstellungen

```typescript
interface GruppenEinstellungen {
  // Allgemein
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'

  // Faecher & Themen (leer = alle die Fragen haben)
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>  // Fach -> Themen

  // Farben
  fachFarben: Record<string, string>  // Fach -> Hex-Farbe
}
```

### 3.2 Defaults

- **Gym-Gruppen:** `{ anrede: 'sie', feedbackStil: 'sachlich', sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {} }`
- **Familie-Gruppen:** `{ anrede: 'du', feedbackStil: 'ermutigend', sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {} }`
- Leer = alles sichtbar was tatsaechlich Fragen hat
- Fragetypen werden NICHT konfiguriert — nur Typen angezeigt zu denen es Fragen gibt

### 3.3 Speicherort

Neue Spalte `einstellungen` (JSON-String) in der Gruppen-Registry (Google Sheet).

---

## 4. Backend (Apps Script)

### 4.1 Neue Endpoints

**Settings:**
- `lernplattformLadeEinstellungen(gruppeId)` — Liest `einstellungen`-Spalte aus Registry, gibt GruppenEinstellungen zurueck (oder Defaults basierend auf `typ`)
- `lernplattformSpeichereEinstellungen(gruppeId, einstellungen)` — Nur fuer Admins (E-Mail-Check gegen adminEmail), schreibt JSON, validiert Grundstruktur. Bei Fehler: Fehlermeldung mit Grund zurueck.

**Fragen (angepasst):**
- `lernplattformLadeFragen(gruppeId)` — Liest `fragebankSheetId` aus Registry, laedt alle Fragen aus diesem Sheet. Gibt Frage[] zurueck.

### 4.2 Gruppen-Registry Sheet

Bestehende Spalten: `id, name, typ, adminEmail, fragebankSheetId, analytikSheetId`
Neue Spalte: `einstellungen` (JSON-String)

- Gym-Gruppen: `fragebankSheetId` kann auf ein geteiltes Sheet verweisen (z.B. gleiche Fragenbank wie Pruefungstool)
- Familie-Gruppen: `fragebankSheetId` verweist auf eigenes Sheet (Datentrennung)

---

## 5. LernKontextProvider

### 5.1 Interface

```typescript
interface LernKontext {
  typ: 'gym' | 'familie'
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>
  fachFarben: Record<string, string>
  einstellungen: GruppenEinstellungen  // Roh-Settings fuer Admin-Panel
}
```

### 5.2 Datenfluss

1. User waehlt Gruppe -> `gruppenStore.waehleGruppe()`
2. Trigger: `lernplattformLadeEinstellungen(gruppeId)`
3. LernKontextProvider kombiniert `gruppe.typ` + geladene Settings -> stellt LernKontext bereit
4. Komponenten lesen via `useLernKontext()` Hook

### 5.3 Anrede-System

Neue Utility `src/utils/anrede.ts`:

```typescript
const texte = {
  richtig:      { sie: 'Korrekt.',                du: 'Super, richtig!' },
  falsch:       { sie: 'Leider nicht korrekt.',    du: 'Hmm, nicht ganz. Versuch es nochmal!' },
  weiter:       { sie: 'Weiter',                   du: 'Weiter' },
  beenden:      { sie: 'Uebung beenden',           du: 'Fertig!' },
  willkommen:   { sie: 'Willkommen',               du: 'Hallo' },
  nochmal:      { sie: 'Erneut ueben',             du: 'Nochmal!' },
  tipp:         { sie: 'Hinweis anzeigen',          du: 'Tipp zeigen' },
  leer:         { sie: 'Keine Aufgaben verfuegbar.', du: 'Noch keine Aufgaben da.' },
}

export function t(key: keyof typeof texte, anrede: 'sie' | 'du'): string
```

Typisierter Key (`keyof typeof texte`) statt `string` fuer Compile-Time-Safety.

### 5.4 Fachfarben

Utility `src/utils/fachFarben.ts`:
- Liest `fachFarben` aus LernKontext
- Setzt CSS Custom Properties (`--c-vwl`, `--c-bwl`, etc.) auf `document.documentElement`
- Fallback auf Standard-Farben (orange/blau/gruen) wenn nicht konfiguriert
- Wird bei Gruppenwechsel und Settings-Aenderung aktualisiert

### 5.5 Wo greift der Kontext

| Komponente | Was sich aendert |
|-----------|-----------------|
| FeedbackPanel.tsx | Anrede-Texte (richtig/falsch) |
| Dashboard.tsx | Faecher-Filter, Farben, sichtbare Themen |
| QuizHeader.tsx | Fach-Badge-Farbe aus Settings |
| Zusammenfassung.tsx | Feedback-Texte (ermutigendes vs. sachliches) |
| AppShell.tsx | Willkommens-Text |

---

## 6. Admin-Settings-Panel

### 6.1 Zugang

Admin-Dashboard -> neuer Tab "Einstellungen" (neben "Uebersicht" und "Auftraege").

### 6.2 Tabs

**Tab: Allgemein**
- Gruppenname (readonly)
- Typ: gym / familie (readonly)
- Anrede: Toggle Sie <-> Du
- Feedback-Stil: Toggle Sachlich <-> Ermutigend

**Tab: Faecher & Themen**
- Liste aller Faecher die Fragen haben (dynamisch aus Fragenbank)
- Checkbox pro Fach: sichtbar ja/nein (Default: alle an)
- Aufklappbar: Themen pro Fach, ebenfalls Checkboxen
- Anzeige: "X Fragen" neben jedem Fach/Thema

**Tab: Farben**
- Pro sichtbarem Fach: Farbwaehler (`<input type="color">`)
- Vorschau: Badge mit Fach-Name in gewaehlter Farbe
- Reset-Button -> zurueck auf Standard-Farbe

**Tab: Mitglieder**
- Liste der aktuellen Mitglieder (Name, E-Mail, Rolle)
- Einladen: E-Mail-Eingabe + Button
- Entfernen: Button pro Mitglied (mit Bestaetigung)
- Login-Code generieren (fuer Familie-Gruppen)
- Ersetzt/konsolidiert bestehende Mitglieder-Verwaltung aus AdminUebersicht

### 6.3 Speichern

Aenderungen werden beim "Speichern"-Button via `lernplattformSpeichereEinstellungen` persistiert. Optimistic Update: UI aktualisiert sofort, bei Backend-Fehler Rollback + Fehlermeldung.

### 6.4 Neue Dateien

```
src/components/admin/AdminSettings.tsx        <- Tab-Container
src/components/admin/settings/AllgemeinTab.tsx
src/components/admin/settings/FaecherTab.tsx
src/components/admin/settings/FarbenTab.tsx
src/components/admin/settings/MitgliederTab.tsx
```

---

## 7. Fragenbank-Integration

### 7.1 Lernplattform liest aus Sheets

`appsScriptAdapter.ts` wird angepasst:
- `ladeFragen(gruppeId, filter?)` -> ruft `lernplattformLadeFragen` auf
- Gibt Frage[] im kanonischen Format zurueck (aus `@shared/types/fragen`)
- Dashboard gruppiert nach fach/thema wie bisher
- Fragen erstellen/bearbeiten geht vorerst nur im Pruefungstool (kein Editor in LP)

### 7.2 Migration der Pool-Reste

Einmal-Script importiert noch fehlende Pool-Fragen in die Fragenbank-Sheets:
- Content-Hashing (SHA-256, wie Pool-Bruecke) fuer Deduplizierung
- IDs beibehalten wo moeglich, neue IDs fuer Duplikate
- Danach werden `pool-daten/`, `convertPools.mjs`, `poolDaten.ts`, `mockDaten.ts`, `mockMitgliederDaten.ts` entfernt

---

## 8. Offline-PWA

### 8.1 Strategie

Volle Offline-Faehigkeit: App funktioniert komplett ohne Netz.

### 8.2 Speicher

- **IndexedDB** (`idb` oder `idb-keyval` Library): Fragen, Fortschritt, Einstellungen, Auftraege
- **Service Worker Cache** (Workbox/Vite PWA Plugin): App-Shell, Bilder (SVGs), Fonts, CSS/JS
- **Geschaetzte Groesse:** ~2.5 MB Fragen-JSON + ~5 MB Bilder (SVGs) = ~8 MB total. Kein Problem fuer IndexedDB.

### 8.3 Datenfluss

```
Online:
  API -> Fragen/Fortschritt -> IndexedDB (Cache) -> UI
  UI -> Antworten/Fortschritt -> API + IndexedDB

Offline:
  IndexedDB (Cache) -> UI
  UI -> Antworten/Fortschritt -> Offline-Queue (IndexedDB)

Reconnect:
  Offline-Queue -> API (Sync) -> Bestaetigung -> Queue leeren
```

### 8.4 Sync-Strategie

- **Stale-While-Revalidate:** App zeigt sofort gecachte Daten, laedt im Hintergrund frische Daten
- **Offline-Queue:** Fehlgeschlagene Writes (Fortschritt, Auftraege) werden in IndexedDB gespeichert
- **Reconnect-Detection:** `navigator.onLine` + `online`/`offline` Events
- **Konfliktloesung:** Last-Write-Wins fuer Fortschritt (einfachster Ansatz, ausreichend fuer Einzelnutzer-Szenario). Timestamp-basiert.

### 8.5 Neue Dateien

```
src/utils/offlineQueue.ts       <- Queue fuer fehlgeschlagene Writes
src/utils/indexedDB.ts          <- IndexedDB Wrapper (get/set/clear pro Store)
src/utils/syncManager.ts        <- Reconnect-Detection + Queue-Flush
```

### 8.6 Service Worker

Vite PWA Plugin (`vite-plugin-pwa`) fuer:
- Precaching der App-Shell (HTML, CSS, JS)
- Runtime-Caching fuer Bilder (CacheFirst-Strategie)
- `skipWaiting` + `clientsClaim` fuer sofortige Updates

---

## 9. Implementierungs-Reihenfolge

| Schritt | Beschreibung | Abhaengig von |
|---------|-------------|---------------|
| A | Shared Library Grundgeruest (types, utils, tsconfig, alias) | — |
| B | Backend: Settings-Endpoints + einstellungen-Spalte | — |
| C | Backend: lernplattformLadeFragen aus Sheets | — |
| D | LernKontextProvider + Anrede-System | B |
| E | Admin-Settings-Panel (4 Tabs) | B, D |
| F | Fragenbank-Adapter umstellen (JSON -> Sheets) | A, C |
| G | Dashboard + Quiz an LernKontext anbinden | D |
| H | Offline-PWA (IndexedDB, Service Worker, Sync) | F |
| I | Migration Pool-Reste + Aufraeumen | F |
| J | Verifikation + Browser-Test | alle |

Schritte A+B+C parallel. Dann D+F parallel. Dann E+G. Dann H+I. Dann J.

Hinweis: Schritt G (Dashboard an Kontext anbinden) funktioniert teilweise schon mit alten JSON-Daten. Volle Wirkung (sichtbareFaecher-Filter aus Settings) erst nach F.

---

## 10. Verifikation

### Shared Library
- [ ] `npx tsc -b` gruen in Lernplattform UND Pruefung
- [ ] Bestehende Tests in beiden Projekten gruen
- [ ] `npm run build` in beiden
- [ ] FrageText rendert Markdown + LaTeX in Lernplattform

### Settings + Kontext
- [ ] Gym-Gruppe: Sie-Anrede, sachliches Feedback
- [ ] Familie-Gruppe: Du-Anrede, ermutigendes Feedback
- [ ] Nur Faecher/Themen sichtbar die Fragen haben
- [ ] sichtbareFaecher Override funktioniert
- [ ] Fachfarben aenderbar -> sofort sichtbar
- [ ] Gruppenwechsel aktualisiert Kontext sofort

### Admin-Settings
- [ ] Settings-Panel erreichbar ueber Admin-Dashboard
- [ ] Alle 4 Tabs funktional
- [ ] Settings persistieren nach Reload (Backend)
- [ ] Mitglieder CRUD funktioniert
- [ ] Login-Code generieren (Familie)
- [ ] Fehler beim Speichern: Rollback + Fehlermeldung

### Fragenbank
- [ ] Lernplattform laedt Fragen aus Google Sheets (nicht JSON)
- [ ] Fragen aus Pruefungstool sofort in Lernplattform sichtbar
- [ ] Pruefungstool weiterhin voll funktional (keine Regression)
- [ ] Familie-Gruppe: Eigenes Sheet, keine Gym-Fragen sichtbar

### Offline-PWA
- [ ] App laedt mit gecachten Daten (kein Spinner bei Reload)
- [ ] Offline: Uebungen funktionieren mit gecachten Fragen
- [ ] Offline: Fortschritt wird lokal gespeichert
- [ ] Reconnect: Offline-Queue wird synchronisiert
- [ ] Service Worker: App-Update nach Deploy funktioniert
- [ ] Bilder (SVGs) laden offline aus Cache

### Aufraeumen
- [ ] pool-daten/ entfernt
- [ ] convertPools.mjs entfernt
- [ ] poolDaten.ts / mockDaten.ts / mockMitgliederDaten.ts entfernt
- [ ] Keine toten Imports

---

## 11. Spaetere Sessions (Out of Scope)

### Shared Editor (eigene Session)
- FragenEditor aus `Pruefung/src/components/lp/frageneditor/` nach `packages/shared/` extrahieren
- ~12 Abhaengigkeiten analysieren und abstrahieren: authStore, apiService, KI-Assistent, uploadApi, schulConfigStore, lpApi, fragenValidierung, fragenFactory, fachUtils, gefaessUtils, useFocusTrap, usePanelResize
- EditorConfig erweitern: Auth-Context-Injection, Upload-Callbacks, KI-Assistent Toggle, Validation-Service
- Shared Editor in Lernplattform integrieren (Admin kann Fragen erstellen/bearbeiten)
- Schrittweise: erst einfache Editoren (MC, TF, Fill), dann komplexere (FiBu, Bild-Typen, Code)

### Phase 7: Backend-Persistenz
- FortschrittStore: localStorage -> Apps Script (teilweise durch Offline-PWA abgedeckt)
- AuftragStore: localStorage -> Apps Script
