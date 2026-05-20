# UP-8 — Synergy-Config aus dem Source-Code lösen

**Datum:** 2026-05-20
**Status:** Design — zur Umsetzung freigegeben
**Bezug:** `HANDOFF.md` → Offene Punkte UP-8

## 1. Kontext & Motivation

Die beiden Service-Module `synergyService.ts` und `pruefungBridge.ts` des
Unterrichtsplaners halten je eine **identische Kopie** von zwei hardcodierten
Werten:

- `APPS_SCRIPT_URL` — die Web-App-URL des ExamLab-Apps-Script-Backends
- `LP_EMAIL` — die E-Mail der Lehrperson (`yannick.durand@gymhofwil.ch`)

Diese Werte stehen direkt im Quellcode. Jede Änderung — Lehrperson-Wechsel,
neue Apps-Script-Bereitstellung und insbesondere die anstehende
Backend-Migration (Apps Script → Supabase) — erfordert eine Code-Änderung samt
Rebuild und Deploy. Der `synergyService` markiert die Werte selbst als
`PLACEHOLDER` und besitzt bereits eine `istKonfiguriert()`-Prüfung — die
Konfigurierbarkeit war von Anfang an vorgesehen, wurde aber nie umgesetzt.

UP-8 verlagert beide Werte in eine zur Laufzeit setzbare Konfiguration mit
Einstellungs-UI.

## 2. Ziel & Scope

### In Scope
- Globaler Zustand-Store für die Synergy-Config (`appsScriptUrl`, `lpEmail`).
- Einstellungs-UI-Sektion zum Eingeben + Speichern der Config.
- Refactor von `synergyService.ts` + `pruefungBridge.ts`: Modul-Konstanten raus,
  Werte aus dem Store.
- Reaktives Gating der Konsumenten (`KursImportButton`, `NotenStandSection`)
  über einen Selektor-Hook.
- Unit-Tests für Store + Validierungslogik.
- HANDOFF.md aktualisieren.

### Nicht in Scope
- Migrations-Code für bestehende Installationen — der Planer ist noch nicht im
  Betrieb, es gibt keinen Live-Zustand zu erhalten.
- Beseitigung der Cache-Code-Duplikation (`CACHE_TTL_MS`, `CacheEntry`,
  `getCached`, `setCache`) zwischen den beiden Service-Files — Vor-Bestand,
  eigener Task.
- Backend-Migrations-Arbeit selbst — UP-8 macht die Config nur austauschbar.
- Komponenten-Tests (der Planer hat noch keine; das vitest-Setup unterstützt
  sie, UP-8 liefert keine).

## 3. Entscheidungen (aus dem Brainstorming)

| # | Entscheidung | Begründung |
|---|---|---|
| D1 | Config über ein **Einstellungs-UI** setzbar (nicht Env-Var / Build-Konstante) | Multi-Lehrperson-Nutzung ist absehbar; jede LP muss URL + E-Mail ohne Code-Zugriff setzen können |
| D2 | Config-Scope **global / app-weit** (nicht pro Planer-Instanz) | URL + E-Mail betreffen LP-Identität + Backend, nicht den Inhalt eines einzelnen Planers; eine LP mit mehreren Planer-Tabs will eine Config |
| D3 | **Leer starten, kein Migrations-Code** | Planer noch nicht im Betrieb — kein Live-Zustand; hardcodierte Werte werden ersatzlos entfernt |
| D4 | **Eigener Zustand-Store** (Ansatz A), nicht localStorage-Modul / nicht `settingsStore` | Reaktivität nötig, damit das UI nach dem Speichern sofort umschaltet; `settingsStore` ist laut CLAUDE.md Legacy |

## 4. Architektur

### 4.1 Store — `src/store/synergyConfigStore.ts` (neu)

Zustand-Store mit `persist`-Middleware.

- State: `appsScriptUrl: string`, `lpEmail: string` — Initialwerte leere Strings.
- Action: `setConfig(patch: Partial<{ appsScriptUrl: string; lpEmail: string }>)`
  — merged ein Patch (erlaubt Einzelfeld-Updates).
- persist: localStorage-Key `synergy-config`, `version: 1`.
- Selektor-Hook im selben File: `useSynergyKonfiguriert()` → `boolean`,
  definiert als `appsScriptUrl.trim() !== '' && lpEmail.trim() !== ''`. Einzige
  Definition von „konfiguriert?".

Der Key `synergy-config` kollidiert nicht mit den bestehenden
`synergy-*`-Cache-Keys (`synergy-kurse`, `synergy-schuljahr`,
`synergy-pruefungen`, …) — er ist exakt `synergy-config`.

### 4.2 Config-UI — `src/components/settings/SynergyConfigSection.tsx` (neu)

- Zwei kontrollierte Text-Inputs, lokaler State, initialisiert aus dem Store.
  Labels „Apps-Script-URL" und „Lehrperson-E-Mail".
- Ein expliziter **Speichern-Button** (kein Save-on-Keystroke — eine
  Backend-Config wird bewusst gesetzt).
- Validierung vor dem Speichern via reiner Funktion (siehe §4.4). Bei Fehler:
  Inline-Fehlertext am betroffenen Feld (`setError`-State-Pattern aus
  `code-quality.md`), kein Toast.
- Bei Erfolg: `setConfig(...)` + `useToast().success(...)`.
- Status-Anzeige: dezenter Hinweis „konfiguriert" / „nicht konfiguriert"
  basierend auf `useSynergyKonfiguriert()`.
- Immer sichtbar (im Gegensatz zu `KursImportButton`, der sich bei fehlender
  Config ausblendet — sonst wäre die Eingabe unerreichbar).
- Einbindung in `SettingsPanel.tsx`: nur Import + Render-Zeile. `SettingsPanel`
  ist mit 2137 Zeilen bereits über der Warnschwelle (`code-quality.md`) — es
  darf nicht nennenswert wachsen; die gesamte Logik lebt im neuen
  Komponenten-File. Platzierung in der Nähe der bestehenden synergie-bezogenen
  Elemente (`NotenStandSection`, `KursImportButton`) — exakte Stelle bestimmt
  der Plan.

### 4.3 Service-Refactor — `synergyService.ts` + `pruefungBridge.ts`

- Modul-Konstanten `APPS_SCRIPT_URL` + `LP_EMAIL` entfallen ersatzlos.
- Die Fetch-Funktionen lesen zur Aufruf-Zeit `useSynergyConfigStore.getState()`
  und entnehmen `appsScriptUrl` / `lpEmail`. (Zustand-Stores sind ausserhalb von
  React via `getState()` nutzbar.)
- Der bestehende Guard `if (!url || !email) return null` bleibt, greift jetzt
  auf die Store-Werte.
- Die je eigene `istKonfiguriert()`-Funktion entfällt. Gating läuft über
  `useSynergyKonfiguriert()`. Falls der Plan einen nicht-reaktiven Aufrufer
  findet, liest dieser direkt `useSynergyConfigStore.getState()`.

### 4.4 Validierungs-Funktion

Reine Funktion (kein Komponenten-State), eigener Ort — `src/utils/`:

- `validateSynergyConfig(url: string, email: string)` →
  `{ urlError?: string; emailError?: string }`
- URL: nicht leer; beginnt mit `https://`; per `new URL()` parsebar.
- E-Mail: nicht leer; enthält `@` (leichte Prüfung, kein strenges Regex —
  legitime Adressen dürfen nicht abgelehnt werden).

Die Auslagerung als reine Funktion macht die Validierung ohne
Komponenten-Test-Infrastruktur unit-testbar.

### 4.5 Konsumenten-Reaktivität

- `KursImportButton.tsx` (`if (!istKonfiguriert()) return null`) und
  `NotenStandSection.tsx` (Hinweis-Text bei nicht konfiguriert) wechseln auf
  `useSynergyKonfiguriert()`.
- React-Hooks-Regel (`code-quality.md` S130): der Hook-Aufruf steht vor jedem
  Early-Return. Exakte Platzierung im Plan.
- `PruefungBadge.tsx` + `useSynergyData.ts` rufen nur Service-Funktionen auf —
  unverändert lauffähig, da die Services die Config intern auflösen. Der Plan
  auditiert alle Aufrufer der wegfallenden `istKonfiguriert()`-Exports.

### 4.6 Datenfluss

```
SynergyConfigSection ──setConfig()──> synergyConfigStore ──persist──> localStorage['synergy-config']
                                            │
                       getState() ◄─────────┼─────────► useSynergyKonfiguriert()
                            │                                  │
              synergyService / pruefungBridge       KursImportButton / NotenStandSection
              (lesen URL+Mail bei jedem Call)       (rendern reaktiv je nach Config-Status)
```

## 5. Tests

- `synergyConfigStore.test.ts` — `setConfig` merged Patches korrekt;
  `useSynergyKonfiguriert`-Ableitung (leer → false, ein Feld → false, beide
  gesetzt → true, Whitespace-only → false).
- Test der Validierungs-Funktion — gültige/ungültige URL (kein `https://`,
  nicht parsebar, leer), gültige/ungültige E-Mail (kein `@`, leer).
- vitest-Abhängigkeit siehe §7.

## 6. Verifikation — Abnahmekriterien

- `cd Unterrichtsplaner && npx tsc -b` clean.
- `cd Unterrichtsplaner && npm test` grün (Store- + Validierungs-Tests).
- `cd Unterrichtsplaner && npm run build` erfolgreich.
- Browser-Test (UP-8 ändert echtes UI — `regression-prevention.md`):
  - leere Config → `KursImportButton` ausgeblendet, `NotenStandSection` zeigt
    Hinweis;
  - Config in der neuen Sektion eingeben + speichern → beide Konsumenten
    schalten **ohne Reload** auf konfiguriert um;
  - Reload → Config aus localStorage wiederhergestellt;
  - ungültige Eingabe → Inline-Fehler, kein Speichern.
- Kein `APPS_SCRIPT_URL` / `LP_EMAIL` mehr als Konstante im Quellcode.

## 7. Abhängigkeit & Risiken

- **vitest-Abhängigkeit:** UP-8 braucht das vitest-Setup aus UP-7. UP-7 liegt
  auf PR #3 und ist noch nicht in `main`. **Die UP-8-Umsetzung startet erst,
  nachdem PR #3 nach `main` gemergt ist**; der UP-8-Branch wird dann auf das
  aktualisierte `main` rebased. (Der UP-8-Branch wurde bereits von `main`
  abgezweigt — Stand vor PR-#3-Merge.)
- **Backend-Migration:** Nach der Migration werden `synergyService` /
  `pruefungBridge` für Supabase umgeschrieben. Der Config-Store bleibt; die
  Feld-Semantik (`appsScriptUrl`) wird dann angepasst oder obsolet. Kein
  UP-8-Problem — UP-8 macht den Wechsel gerade erst billig.
- **Persist-Rehydration:** Der `persist`-Store ist beim allerersten Render evtl.
  noch nicht rehydriert. Da Initial- und Persist-leer-Zustand identisch sind
  (leere Strings) und Synergy-Features bei leerer Config ohnehin ausgeblendet
  werden, entsteht höchstens ein kurzes „nicht konfiguriert" vor der
  Rehydration — unkritisch. Der Plan prüft, ob ein Hydration-Flag nötig ist
  (vermutlich nicht).
