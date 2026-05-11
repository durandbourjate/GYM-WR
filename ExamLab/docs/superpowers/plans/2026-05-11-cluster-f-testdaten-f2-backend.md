# Cluster F.2 — Backend Apps-Script (Detail-Plan v2)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Plan v2 nach Plan-Reviewer-Pass mit komplett verifizierten Sheet-Schemata (siehe Pre-Audit-Tabelle).

**Goal:** Backend für Testdaten-Infrastruktur — `apiAdminSeedTestdaten`-Endpoint, idempotenter Seed (Stammdaten + LP + 20 SuS + Test-Prüfung + Test-Übungs-Gruppe + Sessions + Mastery), Reset-Funktion, Weekly-Roll-Trigger, plus Bonus-Fix für Sessions-Sheet-Schema-Drift.

**Architecture:** Single neue Endpoint-Funktion `apiAdminSeedTestdaten_(body)` in `apps-script-code.js`, intern aufgeteilt in private Helpers pro Bereich. Idempotent über fixe Test-IDs (`test-*`). LP-Auth via bestehendem `istZugelasseneLP()` + Admin-Check via `getLPInfo().rolle === 'admin'`. Concurrency via `LockService.getScriptLock()` + `tryLock(5000)` + try/finally. Antworten/Korrekturen nutzen bestehende `getOrCreateAntwortenSheet`/`getOrCreateKorrekturSheet`-Helpers (single source of truth). Frontend-Service-Wrapper folgt `postJson<T>`-Pattern aus `apiClient.ts:55`.

**Tech Stack:** Apps-Script (Google Apps Script, ES5-ähnlich), Sheets API, LockService, ScriptApp.Trigger; Frontend Service-Layer (TypeScript + apiClient).

---

## Pre-Audit (verifiziert — Zeile + Pattern-Pfad)

| # | Resource | Pfad | Schema |
|---|---|---|---|
| 1 | doPost-Router | `apps-script-code.js:1264` switch(action) | 318 cases, Stil `case 'speichereAntworten':` |
| 2 | LP-Auth | `istZugelasseneLP()` Z.162 + `getLPInfo()` Z.403 | Admin-Check via `lpInfo.rolle === 'admin'` (Z.1054 Pattern) |
| 3 | LockService | `loescheProblemmeldung` Z.1073 nutzt `waitLock(5000)`. Plan nutzt `tryLock(5000)` + early-return (klarere Race-Antwort an Frontend) | try/finally + `try { releaseLock() } catch {}` |
| 4 | Lehrpersonen-Sheet | `CONFIGS_ID` Tab `Lehrpersonen`, `getLPInfo` Z.425-432 | **Spalten: `email, name, kuerzel, fachschaft, rolle, apikey, aktiv`** |
| 5 | Kurse-Sheet | `KURSE_SHEET_ID` Tab `Kurse`, `ladeKurseEndpoint` Z.1925-1939 + `ladeKursDetailsEndpoint` Z.1948-1949 | **Spalten: `kursId, klassen (CSV), lpEmail, aktiv ('false' für inaktiv), ...`** — Klassen-Sheet existiert NICHT |
| 6 | SuS-pro-Kurs | `KURSE_SHEET_ID` Tab-Name = `kursId`, Z.1953 | Spalten (via `getSheetData`-Normalisierung): `name, vorname, email, klasse, schuelerID, geschlecht` |
| 7 | Configs (Prüfungen) | `CONFIGS_ID` Tab `Configs`, `ladePruefung` Z.2035-2123 | siehe §Configs-Schema unten |
| 8 | Antworten | `ANTWORTEN_MASTER_ID` Tab `Antworten_<pruefungId>`, `getOrCreateAntwortenSheet` Z.1688-1706 | **10 Spalten: `email, name, version, antworten (JSON), letzterSave, istAbgabe ('true'/'false'), letzterHeartbeat, heartbeats, beantworteteFragen, gesamtFragen`**. Eine Row pro SuS, alle Antworten in einem JSON-Object. |
| 9 | Korrektur | `ANTWORTEN_MASTER_ID` Tab `Korrektur_<pruefungId>`, `getOrCreateKorrekturSheet` Z.7121-7137 (Init 3 Spalten) + `batchKorrektur` Z.7084-7095 (echte Headers): | **Headers: `email, name, frageId, fragenTyp, maxPunkte, kiPunkte, lpPunkte, kiBegruendung, kiFeedback, lpKommentar, quelle, geprueft, status`** (13 Spalten, eine Row pro (SuS × Frage)). |
| 10 | autoBewerteAntwort | Z.6934-6990 | Antwort-Schemata pro Fragetyp — siehe §Antwort-Schemata unten |
| 11 | Mastery-Gruppen-Spreadsheet | `uebenErstelleGruppe` Z.9051-9088 (Sessions Z.~9075) | 5 Sheets: Fragen / Mitglieder / Auftraege / Fortschritt / Sessions. Sessions-Drift: Init 6 vs Read 8 Spalten |
| 12 | GRUPPEN_REGISTRY | `GRUPPEN_REGISTRY_ID` Z.118 | Schema via Plan-Phase-Step F.2.d.1 verifiziert (grep `registriereGruppe`) |
| 13 | migriereFachbereich_ | Z.8743-8801 | Migrations-Vorbild: try/catch + Counter-Rückgabe |
| 14 | Trigger-Installer | `installiereAutoHardDeleteTrigger_` Z.4385 | Idempotent via `deleteTrigger` vor `newTrigger` |
| 15 | cacheInvalidieren_ | Z.521 (Cache-System-Block) | Aufrufbar nach Seed |
| 16 | Wire-Contract | `scripts/audit-wire-contract.mjs` | Frontend-Action-String 1:1 = Backend `case 'X':` String. **Bidirektional in `--strict`**: Frontend ohne Backend-Match → exit 1; Backend-only-Cases sind erlaubt (kein Fehler). |
| 17 | Frontend POST-API | `apiClient.ts:55` `postJson<T>(action, payload)` | Service-Wrapper-Pattern |
| 18 | Pruefungs-Status-Wert | `speichereAntworten` Z.3154 prüft `=== 'beendet'` | **`'beendet'`** (nicht `'abgeschlossen'`) |

### Configs-Schema (vollständig, aus `ladePruefung` Z.2092-2123)

```
id, titel, klasse, gefaess, semester, fachbereiche (CSV), datum, typ
modus ('pruefung'), zeitModus ('countdown'), dauerMinuten (Number)
gesamtpunkte (Number), erlaubteKlasse, sebErforderlich ('true'/'false')
abschnitte (JSON: [{ id, titel, fragenIds: string[] }])
zeitanzeigeTyp ('countdown'), ruecknavigation ('false' = block)
autoSaveIntervallSekunden (Number, default 30), heartbeatIntervallSekunden (Number, default 15)
zufallsreihenfolgeFragen ('true'/'false'), freigeschaltet ('true'/'false')
zeitverlaengerungen (JSON: {}), sebAusnahmen (JSON: []), teilnehmer (JSON: [{email}])
materialien (JSON: []), beendetUm (ISO-String), durchfuehrungId (UUID), status ('beendet' für abgeschlossen)
```

### Antwort-Schemata pro Fragetyp (aus `autoBewerteAntwort` Z.6934-6990)

| Typ | Field | Form |
|---|---|---|
| `mc` | `gewaehlteOptionen` | `string[]` (Option-IDs) |
| `richtigfalsch` | `bewertungen` | `{ [aussageId]: boolean }` |
| `zuordnung` | `zuordnungen` | `{ [linksId]: rechtsId }` |
| `lueckentext` | `eintraege` | `{ [lueckeId]: string }` |
| `berechnung` | `ergebnisse` | `{ [ergebnisId]: number \| string }` |
| `freitext` | (kein Auto, KI) | — |

Die JSON-Form, die wir pro SuS in `antworten` schreiben: `{ [frageId]: <fragetyp-spezifisches-Object> }`.

## File-Struktur

**Neue Files:**
- `ExamLab/src/services/testdatenApi.ts` — POST-Wrapper für `apiAdminSeedTestdaten`
- `ExamLab/src/services/testdatenApi.test.ts` — Mock-Tests (Service-Layer, kein Backend-Hit)

**Modifizierte Files:**
- `ExamLab/apps-script-code.js`:
  - Z.~118 (vor `GRUPPEN_REGISTRY_ID`): Test-Konstanten ergänzen
  - Z.~1281 (nach `case 'loescheFrage':`): neuer Endpoint-Case
  - Z.~9075 (`uebenErstelleGruppe` Sessions-Sheet-Init): 6→8 Spalten (Bonus-Fix)
  - Append am Ende: neue Funktionen `apiAdminSeedTestdaten_`, `seedTestdaten_`, alle Sub-Helper, `loescheAlleTestdaten_`, `rolleTestdatenMasteryVor`, `installiereTestdatenRollTrigger_`

**Branch:** `feature/cluster-f-testdaten-f2-backend` (frisch von main, F.1 ist gemerget HEAD `3373cdf`).

## Phasen-Übersicht + Stop-Punkte

| Phase | Scope | Apps-Script-Deploy nötig? | Commit-Punkt |
|---|---|---|---|
| **F.2.a** | Konstanten + Bonus-Schema-Fix + Endpoint-Skelett + Frontend-Service | **Nein** | nach Frontend-Tests grün |
| **F.2.b** | seedTestdaten_ Core: Stammdaten + Test-LP + 20 SuS | **Nein** | nach Backend-Code |
| **F.2.c** | Test-Prüfungen + Antworten + Korrekturen | **Nein** | nach Backend-Code |
| **F.2.d** | Test-Übungs-Gruppe + Sessions + Mastery + Roll-Trigger | **Nein** | nach Backend-Code |
| **F.2.e** | loescheAlleTestdaten_ + Pre-Check Echt-SuS-Email-Kollision | **Nein** | nach Backend-Code |
| **F.2.f** | User-Deploy + Initial-Seed + Browser-E2E + Merge | **JA** (User-Action) | finaler Commit, dann PR/merge |

> **Wichtig:** Bis F.2.e produziert nur Code-Änderungen, kein Deploy. Apps-Script läuft auf der deployed Version, nicht auf Repo-Source — alle F.2.a-e Commits sind funktional inert. Phase F.2.f ist der einzige User-Action-Block.

---

## Phase F.2.a — Konstanten + Bonus-Schema-Fix + Endpoint-Skelett + Frontend-Service

**Scope:** Apps-Script-Konstanten, Sessions-Schema-Bonus-Fix (orthogonal, vorgezogen aus F.2.e v1), Endpoint-Skelett mit Auth/Lock + Stub `seedTestdaten_`, Frontend-Service-Wrapper. Kein Backend-Deploy nötig.

### Task F.2.a.1: Feature-Branch

- [ ] **Step 1: Branch frisch von main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull --ff-only
git checkout -b feature/cluster-f-testdaten-f2-backend
```

- [ ] **Step 2: F.1-Stand verifizieren**

Run: `git log --oneline main -5 | grep -E "F\.1|testdaten"`
Expected: 3 F.1-Commits sichtbar (`3561a9a`, `d7c3646`, `f6f5206`).

### Task F.2.a.2: Apps-Script-Konstanten

- [ ] **Step 1: Konstanten einfügen**

Im File-Top, direkt nach Zeile 113 (`const LP_DOMAIN = 'gymhofwil.ch';`) und vor Zeile 118 (`const GRUPPEN_REGISTRY_ID`):

```javascript
// ───── Testdaten-Konstanten (Cluster F) ─────
// Single source of truth — synchron mit ExamLab/src/utils/testdaten/identifikation.ts
const TEST_KURS_ID = 'test-kurs-01';
const TEST_KLASSE_ID = 'test-klasse-01';
const TEST_ID_PREFIX = 'test-';
const TEST_LP_EMAIL = 'wr.test@gymhofwil.ch';
const TEST_EMAIL_REGEX = /^(wr\.test|[a-z]+\.testschueler\d+)@stud\.gymhofwil\.ch$/;
const TEST_SUS_EMAILS = [
  'wr.test@stud.gymhofwil.ch',
  'anna.testschueler1@stud.gymhofwil.ch', 'beat.testschueler2@stud.gymhofwil.ch',
  'clara.testschueler3@stud.gymhofwil.ch', 'david.testschueler4@stud.gymhofwil.ch',
  'eva.testschueler5@stud.gymhofwil.ch', 'felix.testschueler6@stud.gymhofwil.ch',
  'greta.testschueler7@stud.gymhofwil.ch', 'hans.testschueler8@stud.gymhofwil.ch',
  'ina.testschueler9@stud.gymhofwil.ch', 'jonas.testschueler10@stud.gymhofwil.ch',
  'karin.testschueler11@stud.gymhofwil.ch', 'lukas.testschueler12@stud.gymhofwil.ch',
  'mara.testschueler13@stud.gymhofwil.ch', 'noah.testschueler14@stud.gymhofwil.ch',
  'olivia.testschueler15@stud.gymhofwil.ch', 'pia.testschueler16@stud.gymhofwil.ch',
  'quentin.testschueler17@stud.gymhofwil.ch', 'rosa.testschueler18@stud.gymhofwil.ch',
  'sven.testschueler19@stud.gymhofwil.ch'
];
const TEST_SUS_VORNAMEN = ['wr', 'Anna', 'Beat', 'Clara', 'David', 'Eva', 'Felix', 'Greta', 'Hans', 'Ina', 'Jonas', 'Karin', 'Lukas', 'Mara', 'Noah', 'Olivia', 'Pia', 'Quentin', 'Rosa', 'Sven'];
const TEST_SUS_NACHNAMEN = ['test', 'Testschueler1', 'Testschueler2', 'Testschueler3', 'Testschueler4', 'Testschueler5', 'Testschueler6', 'Testschueler7', 'Testschueler8', 'Testschueler9', 'Testschueler10', 'Testschueler11', 'Testschueler12', 'Testschueler13', 'Testschueler14', 'Testschueler15', 'Testschueler16', 'Testschueler17', 'Testschueler18', 'Testschueler19'];
const TEST_GRUPPE_ID = 'test-gruppe-01';
const TEST_PRUEFUNG_1_ID = 'test-pruefung-01';
```

- [ ] **Step 2: Verifikation**

Run: `grep -nE "^const TEST_KURS_ID" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/apps-script-code.js"`
Expected: 1 Treffer in Zeile 114-150.

### Task F.2.a.3: Bonus-Schema-Fix Sessions-Sheet (orthogonal)

> **Vorgezogen aus F.2.e v1**: orthogonal zu allen Cluster-F-Features, low-risk 1-Zeilen-Change. Sicherheit dass alle künftigen Gruppen-Spreadsheets mit korrektem 8-Spalten-Schema initialisiert werden (Read-Code Z.~11362 erwartet `anzahlFragen` + `richtig`).

- [ ] **Step 1: Drift-Stelle finden**

Run: `grep -n "'sessionId', 'email', 'thema', 'fach', 'datum', 'ergebnis'" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/apps-script-code.js"`
Expected: 1 Treffer in `uebenErstelleGruppe`-Funktion (~Z.9075).

- [ ] **Step 2: Edit anwenden**

Ersetze die alte 6-Spalten-Init durch 8 Spalten. Range `A1:F1` → `A1:H1`:

```javascript
// Cluster F.2 Bonus-Fix: Schema-Drift behoben — Read-Code (Z.~11362) erwartet 8 Spalten.
sessionSheet.getRange('A1:H1').setValues([
  ['sessionId', 'email', 'thema', 'fach', 'datum', 'ergebnis', 'anzahlFragen', 'richtig']
]);
```

> **Hinweis:** Bestehende Gruppen-Spreadsheets behalten ihre 6-Spalten-Headers — kein Crash (Read-Code nutzt `Number(... || 0)`-Fallback). Einmalige Migration der existierenden Sheets ist Out-of-Scope (Spawn-Task `migriereSessionsSheetSchemata_`).

### Task F.2.a.4: doPost-Case + Endpoint-Skelett

- [ ] **Step 1: doPost-Case einfügen**

Direkt nach `case 'loescheFrage':` (Z.~1281), neuer Case:

```javascript
    case 'apiAdminSeedTestdaten':
      return apiAdminSeedTestdaten_(body);
```

- [ ] **Step 2: Endpoint + Skelett-Helper am Ende des Files appendieren**

```javascript
// ═════════════════════════════════════════════════════════════════
//   Cluster F — Testdaten-Infrastruktur (Apps-Script Backend)
// ═════════════════════════════════════════════════════════════════

/**
 * Public Endpoint: Testdaten seeden / zurücksetzen.
 * Auth: nur Admins (LPInfo.rolle === 'admin').
 * Body: { email: string, mode: 'initial' | 'reset' }
 * Response: { success: boolean, error?: string, statistik?: {...}, dauerMs?: number }
 *
 * Lock-Pattern: tryLock statt waitLock — Single-Operation darf nicht parallel laufen.
 * Bei Konflikt direktes Error-Return statt 5s-Blocking → klarere Frontend-Meldung.
 *
 * Spec: docs/superpowers/specs/2026-05-11-cluster-f-testdaten-infrastruktur-design.md §5.1
 * Plan: docs/superpowers/plans/2026-05-11-cluster-f-testdaten-f2-backend.md
 */
function apiAdminSeedTestdaten_(body) {
  var startMs = Date.now();
  var email = String((body && body.email) || '').toLowerCase().trim();
  var mode = String((body && body.mode) || 'initial');

  if (!istZugelasseneLP(email)) {
    return jsonResponse({ success: false, error: 'Nicht autorisiert' });
  }
  var lpInfo = getLPInfo(email);
  if (!lpInfo || lpInfo.rolle !== 'admin') {
    return jsonResponse({ success: false, error: 'Nur Admins dürfen Testdaten verwalten' });
  }
  if (mode !== 'initial' && mode !== 'reset') {
    return jsonResponse({ success: false, error: 'Ungültiger mode: ' + mode + ' (erwartet: initial|reset)' });
  }

  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(5000)) {
      return jsonResponse({ success: false, error: 'Testdaten-Operation läuft bereits, bitte erneut versuchen' });
    }
    var statistik = seedTestdaten_(mode, email);
    try { cacheInvalidieren_(); } catch (cacheErr) { Logger.log('cacheInvalidieren_ Fehler (ignoriert): ' + cacheErr.message); }
    var dauerMs = Date.now() - startMs;
    return jsonResponse({ success: true, statistik: statistik, dauerMs: dauerMs });
  } catch (e) {
    Logger.log('apiAdminSeedTestdaten_ Fehler: ' + e.message + '\n' + (e.stack || ''));
    return jsonResponse({ success: false, error: 'Seed-Fehler: ' + e.message });
  } finally {
    try { lock.releaseLock(); } catch (_e) { /* ignore */ }
  }
}

/**
 * Skelett — wird in Phasen F.2.b-e ausgebaut.
 * Aktuell: gibt leere Statistik zurück. Kein Side-Effect auf Sheets.
 * Wire-Vertrag-Felder bleiben über F.2.a→F.2.e konstant.
 */
function seedTestdaten_(mode, callerEmail) {
  return {
    mode: mode,
    callerEmail: callerEmail,
    stammdatenErgaenzt: false,
    klasseAngelegt: false,
    kursAngelegt: false,
    testLpAngelegt: false,
    testSuSAngelegt: 0,
    testPruefungenAngelegt: 0,
    testAntwortenAngelegt: 0,
    testKorrekturenAngelegt: 0,
    testUebungenAngelegt: 0,
    testSessionsAngelegt: 0,
    testFortschrittAngelegt: 0,
    hinweis: 'seedTestdaten_ Skelett (F.2.a) — Implementation folgt in F.2.b-e'
  };
}

/** ISO-Datum (YYYY-MM-DD) tageZurueck Tage vor heute. */
function testdatumVorTagen_(tageZurueck) {
  var d = new Date();
  d.setDate(d.getDate() - tageZurueck);
  return Utilities.formatDate(d, 'Europe/Zurich', 'yyyy-MM-dd');
}

/** Voller ISO-Timestamp tageZurueck Tage vor heute. */
function testIsoDatumVorTagen_(tageZurueck) {
  var d = new Date();
  d.setDate(d.getDate() - tageZurueck);
  return d.toISOString();
}
```

### Task F.2.a.5: Frontend-Service-Wrapper + Tests — TDD

**Files:**
- Create: `ExamLab/src/services/testdatenApi.ts`
- Create: `ExamLab/src/services/testdatenApi.test.ts`

- [ ] **Step 1: Test-File schreiben**

```ts
// ExamLab/src/services/testdatenApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as apiClient from './apiClient'
import { apiAdminSeedTestdaten, type SeedStatistik } from './testdatenApi'

vi.mock('./apiClient', () => ({
  postJson: vi.fn(),
}))

describe('apiAdminSeedTestdaten', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('postet action="apiAdminSeedTestdaten" mit email + mode initial', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: true,
      statistik: { mode: 'initial', testSuSAngelegt: 20 } as SeedStatistik,
      dauerMs: 1234,
    })
    const r = await apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'initial' })
    expect(apiClient.postJson).toHaveBeenCalledWith('apiAdminSeedTestdaten', { email: 'a@x.ch', mode: 'initial' })
    expect(r.success).toBe(true)
    expect(r.statistik?.testSuSAngelegt).toBe(20)
  })

  it('reicht Backend-Fehler durch', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({ success: false, error: 'Nur Admins' })
    const r = await apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'initial' })
    expect(r.success).toBe(false)
    expect(r.error).toBe('Nur Admins')
  })

  it('wirft bei Netzwerk-Fehler', async () => {
    vi.mocked(apiClient.postJson).mockRejectedValue(new Error('Network'))
    await expect(apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'reset' })).rejects.toThrow('Network')
  })

  it('akzeptiert mode reset', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({ success: true })
    await apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'reset' })
    expect(apiClient.postJson).toHaveBeenCalledWith('apiAdminSeedTestdaten', { email: 'a@x.ch', mode: 'reset' })
  })
})
```

- [ ] **Step 2: FAIL bestätigen**

Run: `cd ExamLab && npx vitest run src/services/testdatenApi.test.ts`
Expected: FAIL — `Cannot find module './testdatenApi'`.

- [ ] **Step 3: testdatenApi.ts implementieren**

```ts
// ExamLab/src/services/testdatenApi.ts
import { postJson } from './apiClient'

export type SeedMode = 'initial' | 'reset'

export interface SeedStatistik {
  mode: SeedMode
  callerEmail?: string
  stammdatenErgaenzt?: boolean
  klasseAngelegt?: boolean
  kursAngelegt?: boolean
  testLpAngelegt?: boolean
  testSuSAngelegt?: number
  testPruefungenAngelegt?: number
  testAntwortenAngelegt?: number
  testKorrekturenAngelegt?: number
  testUebungenAngelegt?: number
  testSessionsAngelegt?: number
  testFortschrittAngelegt?: number
  geloeschtBeiReset?: Record<string, number | boolean>
  hinweis?: string
}

export interface SeedResponse {
  success: boolean
  error?: string
  statistik?: SeedStatistik
  dauerMs?: number
}

/**
 * Admin-only Testdaten-Seed/Reset.
 *
 * Backend-Call ist blocking + LockService-geschützt (5s Timeout) — erwartete Dauer ~30s bei initialem Seed.
 * Frontend sollte Loading-State + Disable-Button zeigen.
 *
 * Spec: docs/superpowers/specs/2026-05-11-cluster-f-testdaten-infrastruktur-design.md §5.1
 * Plan: docs/superpowers/plans/2026-05-11-cluster-f-testdaten-f2-backend.md
 */
export async function apiAdminSeedTestdaten(opts: { email: string; mode: SeedMode }): Promise<SeedResponse> {
  return postJson<SeedResponse>('apiAdminSeedTestdaten', { email: opts.email, mode: opts.mode })
}
```

- [ ] **Step 4: PASS verifizieren**

Run: `cd ExamLab && npx vitest run src/services/testdatenApi.test.ts`
Expected: 4/4 PASS.

### Task F.2.a.6: F.2.a-Verifikation + Commit

- [ ] **Step 1: Komplette Gates**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm test 2>&1 | tail -5
npx tsc -b 2>&1 | tail -5
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract
npm run build 2>&1 | tail -5
```

Expected: vitest = baseline + 4, tsc clean, 5× lint clean (insb. lint:wire-contract: `apiAdminSeedTestdaten` Frontend+Backend matchen 1:1), build grün.

- [ ] **Step 2: Commit**

```bash
git add ExamLab/apps-script-code.js ExamLab/src/services/testdatenApi.ts ExamLab/src/services/testdatenApi.test.ts
git commit -m "$(cat <<'EOF'
ExamLab: Testdaten Apps-Script Konstanten + Bonus-Schema-Fix + Endpoint-Skelett + Frontend-Service (F.2.a)

- Apps-Script Konstanten (TEST_KURS_ID, TEST_KLASSE_ID, 20 SuS-Emails)
- Bonus-Fix: uebenErstelleGruppe Sessions-Init 6→8 Spalten (anzahlFragen + richtig)
- doPost-Case 'apiAdminSeedTestdaten' + Auth (rolle==='admin') + tryLock + Stub seedTestdaten_
- Datum-Helpers testdatumVorTagen_ + testIsoDatumVorTagen_
- Frontend Service-Wrapper testdatenApi.ts mit Types + 4 Tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase F.2.b — seedTestdaten_ Core: Stammdaten + Test-LP + 20 SuS

**Scope:** Echte Seed-Logik für Test-LP-Profil + Test-Kurs + 20 SuS in SuS-Tab. Statistik-Counter füllen. Idempotent über fixe IDs.

**Architektur-Erkenntnis (Pre-Audit-Tabelle Zeilen 4-6):**
- Lehrpersonen: `CONFIGS_ID` Tab `Lehrpersonen`
- Kurse: `KURSE_SHEET_ID` Tab `Kurse` (mit `klassen`-CSV)
- SuS: `KURSE_SHEET_ID` Tab-Name = `kursId` (kein zentrales Schueler-Sheet)
- Klassen-Sheet existiert nicht — Klasse ist emergent durch `Kurse.klassen='test-klasse-01'`

### Task F.2.b.1: `seedTestdatenLP_()` — Lehrpersonen-Sheet

- [ ] **Step 1: Function einfügen**

```javascript
/**
 * Test-LP-Profil im CONFIGS_ID Lehrpersonen-Sheet anlegen.
 * Email: wr.test@gymhofwil.ch (rolle 'lp', kein Admin).
 * Schema verifiziert via getLPInfo Z.425-432: email, name, kuerzel, fachschaft, rolle, apikey, aktiv.
 * Idempotent: zweite Ausführung ist No-Op.
 */
function seedTestdatenLP_() {
  var sheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Lehrpersonen');
  if (!sheet) throw new Error('Lehrpersonen-Sheet nicht in CONFIGS_ID gefunden');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var emailCol = headers.indexOf('email');
  if (emailCol < 0) throw new Error('Lehrpersonen-Sheet hat keine "email"-Spalte');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol]).toLowerCase().trim() === TEST_LP_EMAIL) {
      return { angelegt: false };
    }
  }
  var zeile = new Array(data[0].length).fill('');
  var setIf = function(name, value) {
    var c = headers.indexOf(name);
    if (c >= 0) zeile[c] = value;
  };
  setIf('email', TEST_LP_EMAIL);
  setIf('name', 'WR Test');
  setIf('kuerzel', 'WT');
  setIf('fachschaft', 'WR');
  setIf('rolle', 'lp');
  setIf('aktiv', true);
  sheet.appendRow(zeile);
  return { angelegt: true };
}
```

### Task F.2.b.2: `seedTestdatenKurs_()` — Kurse-Sheet (entspricht Stammdaten-Eintrag)

- [ ] **Step 1: Kurs-Schema verifizieren**

Run: `grep -n "function ladeKurseEndpoint\|kurseSheet\.getRange.*setValues" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/apps-script-code.js" | head -5`

Lese Z.1925-1953 für Kurs-Schema. Annahme aus Pre-Audit: Spalten `kursId, klassen (CSV), lpEmail, aktiv, name?`. Falls weitere Spalten existieren (z.B. `fach`, `gefaess`): in Step 2 `setIf` ergänzen.

- [ ] **Step 2: Function einfügen**

```javascript
/**
 * Test-Kurs im KURSE_SHEET_ID Kurse-Sheet anlegen.
 * Spalten verifiziert via ladeKurseEndpoint Z.1925-1939 + ladeKursDetailsEndpoint Z.1948-1949:
 *   kursId, klassen (CSV), lpEmail, aktiv ('false' für inaktiv), name (sofern Spalte existiert).
 * Klassen-Sheet existiert NICHT — die Test-Klasse ist emergent durch klassen='test-klasse-01'.
 * Zusätzlich: leerer SuS-Tab mit Namen TEST_KURS_ID wird hier vorbereitet (Schueler werden in F.2.b.3 eingefügt).
 *
 * Idempotent.
 */
function seedTestdatenKurs_() {
  var ergebnis = { kursAngelegt: false, susTabAngelegt: false };
  var kurseSS = SpreadsheetApp.openById(KURSE_SHEET_ID);
  var kurseSheet = kurseSS.getSheetByName('Kurse');
  if (!kurseSheet) throw new Error('Kurse-Sheet nicht in KURSE_SHEET_ID gefunden');

  var data = kurseSheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var kursIdCol = headers.indexOf('kursid');
  if (kursIdCol < 0) throw new Error('Kurse-Sheet hat keine "kursId"-Spalte');

  var hatKurs = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][kursIdCol]).trim() === TEST_KURS_ID) { hatKurs = true; break; }
  }

  if (!hatKurs) {
    var zeile = new Array(data[0].length).fill('');
    var setIf = function(name, value) {
      var c = headers.indexOf(String(name).toLowerCase());
      if (c >= 0) zeile[c] = value;
    };
    setIf('kursid', TEST_KURS_ID);
    setIf('klassen', TEST_KLASSE_ID);
    setIf('lpemail', TEST_LP_EMAIL);
    setIf('aktiv', true);
    setIf('name', 'Testkurs WR');
    setIf('fach', 'Wirtschaft & Recht');
    setIf('gefaess', 'SF');
    setIf('fachschaft', 'WR');
    setIf('semester', 'HS25');
    kurseSheet.appendRow(zeile);
    ergebnis.kursAngelegt = true;
  }

  // SuS-Tab vorbereiten (Tab-Name = kursId)
  var susTab = kurseSS.getSheetByName(TEST_KURS_ID);
  if (!susTab) {
    susTab = kurseSS.insertSheet(TEST_KURS_ID);
    susTab.getRange('A1:F1').setValues([['email', 'name', 'vorname', 'klasse', 'schuelerID', 'geschlecht']]);
    susTab.getRange('A1:F1').setFontWeight('bold');
    ergebnis.susTabAngelegt = true;
  }

  return ergebnis;
}
```

### Task F.2.b.3: `seedTestdatenSuS_()` — 20 SuS in Kurs-Tab + Pre-Check Echt-SuS-Email-Kollision

- [ ] **Step 1: Function einfügen**

```javascript
/**
 * 20 Test-SuS in KURSE_SHEET_ID Tab TEST_KURS_ID anlegen.
 * Idempotent: prüft email-Spalte, überspringt vorhandene.
 *
 * Pre-Check (Spec §7 Daten-Sicherheit): falls eine TEST_SUS_EMAIL bereits in einem ANDEREN
 * Kurs-Tab existiert (Echt-Kollision: unwahrscheinlich, aber Daten-Loss-Risiko bei späterem Reset),
 * bricht ab mit klarem Fehler. Reset würde via TEST_EMAIL_REGEX matchen und Echt-SuS löschen.
 */
function seedTestdatenSuS_() {
  var kurseSS = SpreadsheetApp.openById(KURSE_SHEET_ID);

  // Pre-Check: Echt-SuS-Email-Kollision
  var kollisionen = [];
  var alleTabs = kurseSS.getSheets();
  for (var t = 0; t < alleTabs.length; t++) {
    var tab = alleTabs[t];
    var tabName = tab.getName();
    if (tabName === 'Kurse' || tabName === TEST_KURS_ID) continue;
    var tabData = tab.getDataRange().getValues();
    if (tabData.length < 2) continue;
    var tabHeaders = tabData[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var emailIdx = tabHeaders.indexOf('email');
    if (emailIdx < 0) continue;
    for (var r = 1; r < tabData.length; r++) {
      var em = String(tabData[r][emailIdx] || '').toLowerCase().trim();
      if (!em) continue;
      if (TEST_EMAIL_REGEX.test(em)) {
        kollisionen.push({ tab: tabName, email: em });
      }
    }
  }
  if (kollisionen.length > 0) {
    throw new Error(
      'Test-Email-Kollision: ' + kollisionen.length + ' Echt-SuS-Records haben Test-Pattern-Email. ' +
      'Beispiel: ' + kollisionen[0].email + ' in Tab ' + kollisionen[0].tab + '. ' +
      'Reset würde diese SuS löschen. Bitte erst diese Records umbenennen oder TEST_EMAIL_REGEX einschränken.'
    );
  }

  // SuS einfügen
  var susTab = kurseSS.getSheetByName(TEST_KURS_ID);
  if (!susTab) throw new Error('SuS-Tab nicht gefunden (sollte durch seedTestdatenKurs_ angelegt sein)');
  var data = susTab.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var emailCol = headers.indexOf('email');
  if (emailCol < 0) throw new Error('SuS-Tab hat keine "email"-Spalte');

  var existing = {};
  for (var i = 1; i < data.length; i++) {
    var em2 = String(data[i][emailCol] || '').toLowerCase().trim();
    if (em2) existing[em2] = true;
  }

  var setIfFn = function(zeile, name, value) {
    var c = headers.indexOf(String(name).toLowerCase());
    if (c >= 0) zeile[c] = value;
  };

  var neueZeilen = [];
  for (var k = 0; k < TEST_SUS_EMAILS.length; k++) {
    var email = TEST_SUS_EMAILS[k];
    if (existing[email]) continue;
    var zeile = new Array(data[0].length).fill('');
    setIfFn(zeile, 'email', email);
    setIfFn(zeile, 'name', TEST_SUS_NACHNAMEN[k]);
    setIfFn(zeile, 'vorname', TEST_SUS_VORNAMEN[k]);
    setIfFn(zeile, 'klasse', TEST_KLASSE_ID);
    setIfFn(zeile, 'schuelerid', 'test-' + (k + 1).toString().padStart(3, '0'));
    setIfFn(zeile, 'geschlecht', k % 2 === 0 ? 'm' : 'w');
    neueZeilen.push(zeile);
  }

  if (neueZeilen.length > 0) {
    var letzteZeile = susTab.getLastRow();
    susTab.getRange(letzteZeile + 1, 1, neueZeilen.length, data[0].length).setValues(neueZeilen);
  }
  return { angelegt: neueZeilen.length, vorhanden: TEST_SUS_EMAILS.length - neueZeilen.length };
}
```

### Task F.2.b.4: seedTestdaten_ ausbauen + Statistik

- [ ] **Step 1: Skelett durch echten Aufruf ersetzen**

```javascript
function seedTestdaten_(mode, callerEmail) {
  // Mode 'reset' wird in F.2.e implementiert (loescheAlleTestdaten_).
  // Vorläufig: 'reset' verhält sich wie 'initial' (idempotent).
  if (mode === 'reset') {
    Logger.log('seedTestdaten_(reset) — loescheAlleTestdaten_ wird in F.2.e implementiert; läuft wie initial');
  }

  var lp = seedTestdatenLP_();
  var kurs = seedTestdatenKurs_();
  var sus = seedTestdatenSuS_();

  return {
    mode: mode,
    callerEmail: callerEmail,
    stammdatenErgaenzt: !!(kurs.kursAngelegt || kurs.susTabAngelegt),
    klasseAngelegt: false,    // Klassen-Sheet existiert nicht — emergent
    kursAngelegt: kurs.kursAngelegt,
    susTabAngelegt: kurs.susTabAngelegt,
    testLpAngelegt: lp.angelegt,
    testSuSAngelegt: sus.angelegt,
    testSuSVorhanden: sus.vorhanden,
    testPruefungenAngelegt: 0,
    testAntwortenAngelegt: 0,
    testKorrekturenAngelegt: 0,
    testUebungenAngelegt: 0,
    testSessionsAngelegt: 0,
    testFortschrittAngelegt: 0,
    hinweis: 'F.2.b — Prüfungen/Übungen/Sessions in F.2.c-d nachgeliefert'
  };
}
```

### Task F.2.b.5: F.2.b Verifikation + Commit

- [ ] **Step 1: Gates**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm test 2>&1 | tail -3
npx tsc -b 2>&1 | tail -3
npm run lint:wire-contract
```

- [ ] **Step 2: Apps-Script-Bracket-Sanity**

Run: `npx -y acorn --ecma2022 "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/apps-script-code.js" >/dev/null 2>&1; echo $?`
Expected: `0` (Syntax OK; Apps-Script-Globals werden von acorn nicht moniert).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Testdaten Apps-Script Stammdaten + LP + 20 SuS Seed (F.2.b)

- seedTestdatenLP_ (Lehrpersonen-Sheet Eintrag)
- seedTestdatenKurs_ (Kurse-Sheet + SuS-Tab anlegen, klassen='test-klasse-01' emergent)
- seedTestdatenSuS_ (20 Records mit Pre-Check Echt-Email-Kollision)
- seedTestdaten_ orchestriert alle drei

Schema-Quellen: getLPInfo Z.425, ladeKurseEndpoint Z.1925, ladeKursDetailsEndpoint Z.1948.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase F.2.c — Test-Prüfungen + Antworten + Korrekturen

**Scope:** Test-Prüfung 1 (`[Test] Einführungsprüfung WR`) selbst zusammengestellt aus Pool-Themen (`bwl_einfuehrung` + `recht_einfuehrung`). Alle 20 SuS haben Antworten (deterministisch im echten Antwort-Schema), alle korrigiert (Auto-Bewertung für MC/Richtigfalsch/Zuordnung/Lückentext/Berechnung).

> **Spec-Anpassung 1 (dokumentiert):** Spec §4.6 sagt „Kopie der echten Einführungsprüfung". Audit findet keine echte Prüfung mit dieser ID — nur Pool-Themen `bwl_einfuehrung` + `recht_einfuehrung` (Z.127-133 THEMEN_MAPPING). Plan stellt Test-Prüfung selbst aus diesen Pools zusammen. User-Resultat identisch (WR-Einführungs-Prüfung mit 20 SuS, korrigiert).

> **Spec-Anpassung 2 (dokumentiert):** Spec §4.6 nennt optional Test-Prüfung 2 („Aktiengesellschaft"). Plan-Phase F.2 macht nur **Test-Prüfung 1**. Test-Prüfung 2 ist explizit Out-of-Scope dieser Session — kann später als Spawn-Task (`seedTestdatenPruefung2_`) ergänzt werden.

### Task F.2.c.1: Pool-Fragen-IDs ermitteln

- [ ] **Step 1: FRAGENSAMMLUNG-Struktur lokalisieren**

Run: `grep -n "function parseFrage\|function ladeFragensammlung\|fachbereichZuFachschaft\|themen_einfuehrung\|bwl_einfuehrung" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/apps-script-code.js" | head -10`

Erwartet: Pool-Lookup-Logik in `ladeFragensammlung` oder vergleichbar. Schema von FRAGENSAMMLUNG_ID: ein Sheet pro Fachbereich (Tabs `VWL`, `BWL`, `Recht`, `Informatik` aus Z.8755), Frage-Spalten via `parseFrage` Z.2924.

- [ ] **Step 2: Helper `holeTestPruefungFragenIds_()` einfügen**

```javascript
/**
 * Liefert deterministisch sortierte Frage-IDs für Test-Prüfung 1.
 * Strategy: bis zu 5 Fragen aus jedem Pool (bwl_einfuehrung + recht_einfuehrung) → max 10.
 * Sortiert alphabetisch nach ID (Determinismus).
 *
 * Schema: FRAGENSAMMLUNG_ID hat Sheets pro Fachbereich (BWL/Recht/VWL/...).
 * Pro Sheet werden Fragen über 'thema'-Spalte gefiltert.
 */
function holeTestPruefungFragenIds_() {
  var pools = ['bwl_einfuehrung', 'recht_einfuehrung'];
  var fragensammlungSS = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);
  var sheets = fragensammlungSS.getSheets();
  var ergebnisProPool = {};
  pools.forEach(function(p) { ergebnisProPool[p] = []; });

  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var data = sh.getDataRange().getValues();
    if (data.length < 2) continue;
    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var idCol = headers.indexOf('id');
    var themaCol = headers.indexOf('thema');
    if (idCol < 0 || themaCol < 0) continue;
    for (var r = 1; r < data.length; r++) {
      var thema = String(data[r][themaCol] || '').trim();
      if (ergebnisProPool[thema] !== undefined) {
        ergebnisProPool[thema].push(String(data[r][idCol]));
      }
    }
  }

  var ergebnis = [];
  pools.forEach(function(p) {
    ergebnisProPool[p].sort();
    ergebnis = ergebnis.concat(ergebnisProPool[p].slice(0, 5));
  });
  return ergebnis;
}

/**
 * Liefert eine FrageMeta-Map (id → {typ, punkte}) für die gegebenen Frage-IDs.
 * Wir brauchen typ + punkte für Antwort-Schema-Generierung + Korrekturen.
 *
 * Wiederverwendung der existierenden ladeFragen-Funktion (Z.~2820, nutzt parseFrage Z.2924).
 */
function holeFragenMeta_(fragenIds) {
  if (!fragenIds || fragenIds.length === 0) return {};
  var fragen = ladeFragen(fragenIds);   // existing helper
  var meta = {};
  for (var i = 0; i < fragen.length; i++) {
    var f = fragen[i];
    meta[f.id] = { typ: f.typ, punkte: Number(f.punkte) || 4 };
  }
  return meta;
}
```

### Task F.2.c.2: Test-Prüfung 1 in `Configs` einfügen

- [ ] **Step 1: Function einfügen**

```javascript
/**
 * Test-Prüfung 1 in CONFIGS_ID/Configs anlegen.
 * Status 'beendet' (alle 20 SuS haben abgegeben + sind korrigiert).
 * Schema aus ladePruefung Z.2092-2123 verifiziert.
 *
 * Return: { angelegt, vorhanden, fragenAnzahl }
 */
function seedTestdatenPruefung_() {
  var fragenIds = holeTestPruefungFragenIds_();
  if (fragenIds.length === 0) {
    throw new Error('Keine Pool-Fragen gefunden für Test-Prüfung — Pools "bwl_einfuehrung" / "recht_einfuehrung" sind leer oder Schema-Pfad falsch');
  }

  var configsSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
  if (!configsSheet) throw new Error('Configs-Sheet nicht gefunden');
  var data = configsSheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('Configs-Sheet hat keine "id"-Spalte');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === TEST_PRUEFUNG_1_ID) {
      return { angelegt: 0, vorhanden: 1, fragenAnzahl: fragenIds.length };
    }
  }

  var zeile = new Array(data[0].length).fill('');
  var setIf = function(name, value) {
    var c = headers.indexOf(String(name).toLowerCase());
    if (c >= 0) zeile[c] = value;
  };

  setIf('id', TEST_PRUEFUNG_1_ID);
  setIf('titel', '[Test] Einführungsprüfung WR');
  setIf('klasse', TEST_KLASSE_ID);
  setIf('erlaubteKlasse', TEST_KLASSE_ID);
  setIf('gefaess', 'SF');
  setIf('semester', 'HS25');
  setIf('fachbereiche', 'BWL,Recht');
  setIf('datum', testdatumVorTagen_(14));
  setIf('typ', 'Lernkontrolle');
  setIf('modus', 'pruefung');
  setIf('zeitModus', 'countdown');
  setIf('dauerMinuten', 45);
  setIf('gesamtpunkte', fragenIds.length * 4);
  setIf('sebErforderlich', 'false');
  setIf('abschnitte', JSON.stringify([{ id: 'a1', titel: 'Einführung', fragenIds: fragenIds }]));
  setIf('zeitanzeigeTyp', 'countdown');
  setIf('ruecknavigation', 'true');
  setIf('autoSaveIntervallSekunden', 30);
  setIf('heartbeatIntervallSekunden', 15);
  setIf('zufallsreihenfolgeFragen', 'false');
  setIf('freigeschaltet', 'true');
  setIf('zeitverlaengerungen', JSON.stringify({}));
  setIf('sebAusnahmen', JSON.stringify([]));
  setIf('teilnehmer', JSON.stringify(TEST_SUS_EMAILS.map(function(e) { return { email: e }; })));
  setIf('materialien', JSON.stringify([]));
  setIf('beendetUm', testIsoDatumVorTagen_(14));
  setIf('durchfuehrungId', Utilities.getUuid());
  setIf('status', 'beendet');

  configsSheet.appendRow(zeile);
  return { angelegt: 1, vorhanden: 0, fragenAnzahl: fragenIds.length };
}
```

### Task F.2.c.3: Antworten + Korrekturen — echtes Schema

- [ ] **Step 1: Antwort-Generator-Helper (alle 5 Auto-Fragetypen)**

```javascript
/**
 * Liefert eine deterministische Antwort im Frontend-Antwort-Schema, abhängig von Fragetyp + SuS-Index.
 * Schema aus autoBewerteAntwort Z.6934-6990 verifiziert.
 *
 * Korrektheits-Verteilung über 20 SuS:
 *   susIndex 0-9   (10 SuS): korrekte Antwort (1.0 * Punkte)
 *   susIndex 10-14 (5 SuS):  teils richtig (0.6 * Punkte via halb-richtiges Mapping)
 *   susIndex 15-19 (5 SuS):  falsche Antwort (0.2 * Punkte)
 *
 * Für jeden Fragetyp wird die korrekte Schema-Form generiert. Fragen-Metadaten
 * (optionen, aussagen, zuordnungen, luecken, ergebnisse) werden via Frage-Object gelesen.
 *
 * Falls Frage-Objekt unvollständig (z.B. keine Optionen): leerer Antwort-Body.
 */
function testAntwortFuerFrage_(frage, susIndex) {
  var korrekt = susIndex < 10;
  var teils = susIndex >= 10 && susIndex < 15;

  switch (frage.typ) {
    case 'mc': {
      var optionen = frage.optionen || [];
      var korrekteIds = optionen.filter(function(o) { return o.korrekt; }).map(function(o) { return o.id; });
      var falscheIds = optionen.filter(function(o) { return !o.korrekt; }).map(function(o) { return o.id; });
      if (korrekt) return { gewaehlteOptionen: korrekteIds };
      if (teils) {
        // Eine korrekte + eine falsche
        var teilsAuswahl = [];
        if (korrekteIds.length > 0) teilsAuswahl.push(korrekteIds[0]);
        if (falscheIds.length > 0) teilsAuswahl.push(falscheIds[0]);
        return { gewaehlteOptionen: teilsAuswahl };
      }
      return { gewaehlteOptionen: falscheIds.slice(0, 1) };
    }
    case 'richtigfalsch': {
      var aussagen = frage.aussagen || [];
      var bewertungen = {};
      for (var a = 0; a < aussagen.length; a++) {
        var ag = aussagen[a];
        if (korrekt) bewertungen[ag.id] = ag.korrekt;
        else if (teils && a < Math.floor(aussagen.length * 0.6)) bewertungen[ag.id] = ag.korrekt;
        else bewertungen[ag.id] = !ag.korrekt;
      }
      return { bewertungen: bewertungen };
    }
    case 'zuordnung': {
      var paare = frage.paare || [];
      var zuordnungen = {};
      for (var z = 0; z < paare.length; z++) {
        var p = paare[z];
        if (korrekt) zuordnungen[p.links] = p.rechts;
        else if (teils && z < Math.floor(paare.length * 0.6)) zuordnungen[p.links] = p.rechts;
        else zuordnungen[p.links] = (paare[(z + 1) % paare.length] || p).rechts;  // verschoben
      }
      return { zuordnungen: zuordnungen };
    }
    case 'lueckentext': {
      var luecken = frage.luecken || [];
      var eintraege = {};
      for (var l = 0; l < luecken.length; l++) {
        var lu = luecken[l];
        var korrektAntw = lu.korrekt || (lu.korrekteAntworten && lu.korrekteAntworten[0]) || '';
        if (korrekt) eintraege[lu.id] = korrektAntw;
        else if (teils && l < Math.floor(luecken.length * 0.6)) eintraege[lu.id] = korrektAntw;
        else eintraege[lu.id] = String(korrektAntw).substring(0, Math.max(1, Math.floor(String(korrektAntw).length / 2)));
      }
      return { eintraege: eintraege };
    }
    case 'berechnung': {
      var ergebnisse = frage.ergebnisse || [];
      var antwErgebnisse = {};
      for (var e = 0; e < ergebnisse.length; e++) {
        var er = ergebnisse[e];
        if (korrekt) antwErgebnisse[er.id] = String(er.korrekt);
        else if (teils && e < Math.floor(ergebnisse.length * 0.6)) antwErgebnisse[er.id] = String(er.korrekt);
        else antwErgebnisse[er.id] = String(Number(er.korrekt) + 1);  // off by one
      }
      return { ergebnisse: antwErgebnisse };
    }
    case 'freitext':
      return { text: korrekt ? '[Test] Ausführliche Antwort mit korrekten Argumenten.' : '[Test] Kurze Antwort.' };
    default:
      // Unbekannter Typ — leere Antwort
      return {};
  }
}

/**
 * Bewertet eine Antwort manuell für Korrektur-Sheet-Eintrag.
 * Auto-Typen: nutzt autoBewerteAntwort.
 * Freitext: feste KI-Bewertung mit Anteil-Punkten.
 */
function testBewertungFuerAntwort_(frage, antwort, susIndex) {
  var autoTypen = ['mc', 'richtigfalsch', 'zuordnung', 'lueckentext', 'berechnung'];
  if (autoTypen.indexOf(frage.typ) >= 0) {
    var auto = autoBewerteAntwort(frage, antwort);
    return {
      punkte: auto.punkte,
      maxPunkte: Number(frage.punkte) || 4,
      begruendung: auto.begruendung,
      quelle: 'auto'
    };
  }
  // Freitext / unbekannt → KI-Mock
  var anteil = susIndex < 10 ? 1.0 : (susIndex < 15 ? 0.6 : 0.2);
  var maxP = Number(frage.punkte) || 4;
  return {
    punkte: Math.round(anteil * maxP * 10) / 10,
    maxPunkte: maxP,
    begruendung: '[Test-KI-Bewertung] Anteil ' + (anteil * 100) + '%',
    quelle: 'ki'
  };
}
```

- [ ] **Step 2: `seedTestdatenAntwortenUndKorrekturen_()`**

```javascript
/**
 * Für Test-Prüfung 1 alle 20 SuS-Antworten + Korrekturen anlegen.
 * Nutzt bestehende getOrCreateAntwortenSheet (Z.1688) + getOrCreateKorrekturSheet (Z.7121) Helpers.
 *
 * Antworten: 1 Row pro SuS, alle Frage-Antworten als JSON-Object in `antworten`-Spalte.
 * Korrekturen: 1 Row pro (SuS × Frage) mit 13 Spalten (siehe Pre-Audit Z.9).
 *
 * Idempotent: bestehende Rows werden nicht überschrieben (Pre-Check via email).
 */
function seedTestdatenAntwortenUndKorrekturen_() {
  var fragenIds = holeTestPruefungFragenIds_();
  if (fragenIds.length === 0) return { antwortenAngelegt: 0, korrekturenAngelegt: 0 };

  var fragenMeta = holeFragenMeta_(fragenIds);
  var fragen = ladeFragen(fragenIds);
  var fragenMap = {};
  for (var fi = 0; fi < fragen.length; fi++) fragenMap[fragen[fi].id] = fragen[fi];

  // Antworten-Sheet
  var antwortenSheet = getOrCreateAntwortenSheet(TEST_PRUEFUNG_1_ID);
  if (!antwortenSheet) throw new Error('getOrCreateAntwortenSheet returnte null für Test-Prüfung');
  var antwortenData = antwortenSheet.getDataRange().getValues();
  var antwortenHeaders = antwortenData[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var emailColAntw = antwortenHeaders.indexOf('email');
  var existingAntwEmails = {};
  for (var ar = 1; ar < antwortenData.length; ar++) {
    var em = String(antwortenData[ar][emailColAntw] || '').toLowerCase().trim();
    if (em) existingAntwEmails[em] = true;
  }

  var antwortenZeilen = [];
  var korrekturZeilen = [];
  var jetztIso = testIsoDatumVorTagen_(13);

  for (var s = 0; s < TEST_SUS_EMAILS.length; s++) {
    var email = TEST_SUS_EMAILS[s];
    if (existingAntwEmails[email]) continue;

    var name = TEST_SUS_VORNAMEN[s] + ' ' + TEST_SUS_NACHNAMEN[s];
    var susAntworten = {};

    for (var k = 0; k < fragenIds.length; k++) {
      var frageId = fragenIds[k];
      var frage = fragenMap[frageId];
      if (!frage) continue;
      var antwort = testAntwortFuerFrage_(frage, s);
      susAntworten[frageId] = antwort;

      var bewertung = testBewertungFuerAntwort_(frage, antwort, s);
      korrekturZeilen.push({
        email: email,
        name: name,
        frageId: frageId,
        fragenTyp: frage.typ,
        maxPunkte: bewertung.maxPunkte,
        kiPunkte: bewertung.punkte,
        lpPunkte: '',
        kiBegruendung: bewertung.begruendung,
        kiFeedback: '',
        lpKommentar: '',
        quelle: bewertung.quelle,
        geprueft: bewertung.quelle === 'auto' ? 'true' : 'false',
        status: bewertung.quelle === 'auto' ? 'auto-bewertet' : 'ki-bewertet'
      });
    }

    // Row für Antworten-Sheet (10 Spalten, Schema aus getOrCreateAntwortenSheet Z.1699)
    var antwZeile = new Array(antwortenHeaders.length).fill('');
    var setAntw = function(name, value) {
      var c = antwortenHeaders.indexOf(String(name).toLowerCase());
      if (c >= 0) antwZeile[c] = value;
    };
    setAntw('email', email);
    setAntw('name', name);
    setAntw('version', 1);
    setAntw('antworten', JSON.stringify(susAntworten));
    setAntw('letzterSave', jetztIso);
    setAntw('istAbgabe', 'true');
    setAntw('letzterHeartbeat', jetztIso);
    setAntw('heartbeats', JSON.stringify([jetztIso]));
    setAntw('beantworteteFragen', fragenIds.length);
    setAntw('gesamtFragen', fragenIds.length);
    antwortenZeilen.push(antwZeile);
  }

  if (antwortenZeilen.length > 0) {
    var letzteAntw = antwortenSheet.getLastRow();
    antwortenSheet.getRange(letzteAntw + 1, 1, antwortenZeilen.length, antwortenHeaders.length).setValues(antwortenZeilen);
  }

  // Korrektur-Sheet: bei Erst-Anlage werden Headers von batchKorrektur dynamisch gesetzt (Z.7084).
  // Wir schreiben Headers selbst (idempotent), dann Zeilen.
  if (korrekturZeilen.length > 0) {
    var korrekturSheet = getOrCreateKorrekturSheet(TEST_PRUEFUNG_1_ID);
    if (!korrekturSheet) throw new Error('getOrCreateKorrekturSheet returnte null');
    var korrekturHeaders = ['email', 'name', 'frageId', 'fragenTyp', 'maxPunkte', 'kiPunkte', 'lpPunkte', 'kiBegruendung', 'kiFeedback', 'lpKommentar', 'quelle', 'geprueft', 'status'];

    // Idempotenz: wenn Sheet bereits Daten hat, abbruch
    var existingKorrData = korrekturSheet.getDataRange().getValues();
    if (existingKorrData.length > 1) {
      Logger.log('Korrektur-Sheet hat bereits ' + (existingKorrData.length - 1) + ' Rows, kein Re-Insert');
    } else {
      // Sheet leer → Headers setzen
      korrekturSheet.clear();
      korrekturSheet.getRange(1, 1, 1, korrekturHeaders.length).setValues([korrekturHeaders]).setFontWeight('bold');
      var rows = korrekturZeilen.map(function(z) {
        return korrekturHeaders.map(function(h) { return z[h] !== undefined ? z[h] : ''; });
      });
      korrekturSheet.getRange(2, 1, rows.length, korrekturHeaders.length).setValues(rows);
      // Status-Cell Z1 setzen (Spec von setKorrekturStatus Z.7140)
      korrekturSheet.getRange('Z1').setValue(JSON.stringify({
        status: 'fertig', erledigt: korrekturZeilen.length, gesamt: korrekturZeilen.length, timestamp: jetztIso
      }));
    }
  }

  return {
    antwortenAngelegt: antwortenZeilen.length,
    korrekturenAngelegt: korrekturZeilen.length,
    fragenJeSuS: fragenIds.length
  };
}
```

### Task F.2.c.4: seedTestdaten_ erweitern + Commit

- [ ] **Step 1: Aufruf einbauen**

In `seedTestdaten_()` nach `var sus = seedTestdatenSuS_();`:

```javascript
  var pruefung = seedTestdatenPruefung_();
  var antworten = pruefung.angelegt > 0 ? seedTestdatenAntwortenUndKorrekturen_() : { antwortenAngelegt: 0, korrekturenAngelegt: 0 };
```

Return-Block:
```javascript
    testPruefungenAngelegt: pruefung.angelegt,
    testAntwortenAngelegt: antworten.antwortenAngelegt,
    testKorrekturenAngelegt: antworten.korrekturenAngelegt,
```

- [ ] **Step 2: Gates + Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm test 2>&1 | tail -3
npx tsc -b 2>&1 | tail -3
npm run lint:wire-contract
```

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Testdaten Apps-Script Test-Prüfung + Antworten + Korrekturen (F.2.c)

- holeTestPruefungFragenIds_ (Pool-basierte Frage-Sammlung)
- holeFragenMeta_ (via existing ladeFragen)
- seedTestdatenPruefung_ (Configs-Schema komplett laut ladePruefung Z.2092-2123, status='beendet')
- testAntwortFuerFrage_ (echtes Schema pro Fragetyp: mc.gewaehlteOptionen, richtigfalsch.bewertungen, ...)
- testBewertungFuerAntwort_ (Auto via autoBewerteAntwort, Freitext via KI-Mock)
- seedTestdatenAntwortenUndKorrekturen_ (1 Row/SuS in Antworten-Tab, 1 Row/SuS×Frage in Korrektur-Tab)

Schema-Quellen: ladePruefung Z.2035, getOrCreateAntwortenSheet Z.1688, getOrCreateKorrekturSheet Z.7121, batchKorrektur Z.7084, autoBewerteAntwort Z.6934.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase F.2.d — Test-Übungs-Gruppe + Sessions + Mastery + Roll-Trigger

**Scope:** Eine neue Übungs-Gruppe `test-gruppe-01` mit eigenem Spreadsheet (5 Sheets analog `uebenErstelleGruppe` Z.9051-9088). Alle 20 SuS als Mitglieder, ~3-8 Sessions pro SuS über 6-Wochen-Spread, Mastery in `Fortschritt`-Sheet, ein Auftrag. Weekly-Roll-Trigger.

### Task F.2.d.1: GRUPPEN_REGISTRY-Schema verifizieren

- [ ] **Step 1: Registry-Schema lokalisieren**

Run: `grep -nE "GRUPPEN_REGISTRY_ID\b|function registriereGruppe|function uebenErstelleGruppe" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/apps-script-code.js" | head -15`

Erwartet: Registry-Spalten (vermutlich `id, name, spreadsheetId, lpEmail, erstellt`).

Notiere echte Spalten + Sheet-Name (vermutlich erstes Sheet ohne expliziten Namen).

### Task F.2.d.2: `seedTestdatenGruppe_()`

- [ ] **Step 1: Function einfügen**

```javascript
/**
 * Test-Übungs-Gruppe anlegen: neues Spreadsheet im Drive, 5 Sheets, Registry-Eintrag.
 * Idempotent via GRUPPEN_REGISTRY-Check.
 *
 * Sheet-Struktur analog uebenErstelleGruppe Z.9051-9088 (Fragen/Mitglieder/Auftraege/Fortschritt/Sessions).
 * Sessions-Init: 8 Spalten (Bonus-Fix bereits aus F.2.a aktiv).
 */
function seedTestdatenGruppe_() {
  var registrySS = SpreadsheetApp.openById(GRUPPEN_REGISTRY_ID);
  var registry = registrySS.getSheets()[0];
  var rData = registry.getDataRange().getValues();
  var rHeaders = rData[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var gIdCol = rHeaders.indexOf('id');
  var ssIdCol = rHeaders.indexOf('spreadsheetid');
  if (gIdCol < 0 || ssIdCol < 0) {
    throw new Error('GRUPPEN_REGISTRY hat keine "id"/"spreadsheetId"-Spalte — Schema in F.2.d.1 verifizieren');
  }
  for (var i = 1; i < rData.length; i++) {
    if (String(rData[i][gIdCol]).trim() === TEST_GRUPPE_ID) {
      return { angelegt: 0, vorhanden: 1, spreadsheetId: String(rData[i][ssIdCol]) };
    }
  }

  // Neues Spreadsheet
  var neueSS = SpreadsheetApp.create('ExamLab: [Test] Übungs-Gruppe');
  var neueSSId = neueSS.getId();

  // 1. Fragen-Sheet (1. Sheet, leer für Test-Gruppe — Fragen aus FRAGENSAMMLUNG sind global)
  var fragenSheet = neueSS.getSheets()[0];
  fragenSheet.setName('Fragen');
  fragenSheet.getRange('A1:T1').setValues([[
    'id', 'fach', 'thema', 'typ', 'schwierigkeit', 'taxonomie',
    'frage', 'erklaerung', 'uebung', 'pruefungstauglich',
    'optionen', 'korrekt', 'aussagen', 'luecken', 'toleranz',
    'einheit', 'kategorien', 'elemente', 'reihenfolge', 'daten'
  ]]);

  // 2. Mitglieder
  var mitgliederSheet = neueSS.insertSheet('Mitglieder');
  mitgliederSheet.getRange('A1:E1').setValues([['email', 'name', 'rolle', 'code', 'beigetreten']]);
  var jetztIso = new Date().toISOString();
  var mitgliederZeilen = [];
  for (var s = 0; s < TEST_SUS_EMAILS.length; s++) {
    mitgliederZeilen.push([
      TEST_SUS_EMAILS[s],
      TEST_SUS_VORNAMEN[s] + ' ' + TEST_SUS_NACHNAMEN[s],
      'schueler',
      '',
      jetztIso
    ]);
  }
  mitgliederZeilen.push([TEST_LP_EMAIL, 'WR Test', 'lehrperson', '', jetztIso]);
  mitgliederSheet.getRange(2, 1, mitgliederZeilen.length, 5).setValues(mitgliederZeilen);

  // 3. Auftraege
  var auftraegeSheet = neueSS.insertSheet('Auftraege');
  auftraegeSheet.getRange('A1:F1').setValues([['id', 'titel', 'fach', 'thema', 'deadline', 'aktiv']]);
  auftraegeSheet.appendRow([
    'test-auftrag-01',
    '[Test] Selbstständiges Üben WR',
    'Wirtschaft & Recht',
    'bwl_einfuehrung,recht_einfuehrung',
    testdatumVorTagen_(-14),
    true
  ]);

  // 4. Fortschritt
  var fortschrittSheet = neueSS.insertSheet('Fortschritt');
  fortschrittSheet.getRange('A1:H1').setValues([[
    'email', 'fragenId', 'versuche', 'richtig', 'richtigInFolge', 'mastery', 'letzterVersuch', 'sessionIds'
  ]]);

  // 5. Sessions (8 Spalten gemäß F.2.a Bonus-Fix)
  var sessionSheet = neueSS.insertSheet('Sessions');
  sessionSheet.getRange('A1:H1').setValues([[
    'sessionId', 'email', 'thema', 'fach', 'datum', 'ergebnis', 'anzahlFragen', 'richtig'
  ]]);

  // Registry-Eintrag
  var neueRegistryZeile = new Array(rData[0].length).fill('');
  neueRegistryZeile[gIdCol] = TEST_GRUPPE_ID;
  neueRegistryZeile[ssIdCol] = neueSSId;
  var nameCol = rHeaders.indexOf('name');
  if (nameCol >= 0) neueRegistryZeile[nameCol] = '[Test] Übungs-Gruppe WR';
  var lpCol = rHeaders.indexOf('lpemail');
  if (lpCol >= 0) neueRegistryZeile[lpCol] = TEST_LP_EMAIL;
  var erstelltCol = rHeaders.indexOf('erstellt');
  if (erstelltCol >= 0) neueRegistryZeile[erstelltCol] = jetztIso;
  registry.appendRow(neueRegistryZeile);

  return { angelegt: 1, vorhanden: 0, spreadsheetId: neueSSId };
}
```

### Task F.2.d.3: `seedTestdatenSessionsUndFortschritt_()`

- [ ] **Step 1: Function einfügen**

```javascript
/**
 * Pro SuS 3-8 Sessions deterministisch über 6 Wochen verteilt.
 * Datums-Spread: tagZurueck = (susIndex * 3 + sessionIndex * 5) % 42 → 1-42 Tage zurück.
 *
 * Fortschritt-Records pro SuS × Frage mit kumulierten Mastery-Werten.
 *
 * Idempotent: wenn Sessions-Sheet bereits Rows hat, no-op.
 */
function seedTestdatenSessionsUndFortschritt_(spreadsheetId) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sessionsSheet = ss.getSheetByName('Sessions');
  var fortschrittSheet = ss.getSheetByName('Fortschritt');

  if (sessionsSheet.getLastRow() > 1) {
    return { sessionsAngelegt: 0, fortschrittAngelegt: 0, hinweis: 'Sessions bereits vorhanden' };
  }

  var fragenIds = holeTestPruefungFragenIds_();
  if (fragenIds.length === 0) return { sessionsAngelegt: 0, fortschrittAngelegt: 0 };

  var sessionZeilen = [];
  var fortschrittZeilen = [];

  for (var s = 0; s < TEST_SUS_EMAILS.length; s++) {
    var email = TEST_SUS_EMAILS[s];
    var sessionsCount = 3 + (s % 6);
    var fragenStatus = {};

    for (var idx = 0; idx < sessionsCount; idx++) {
      var tagZurueck = ((s * 3 + idx * 5) % 41) + 1;   // 1..41 (kein 0)
      var datum = testdatumVorTagen_(tagZurueck);
      var fragenInSession = 4 + (idx % 5);
      var anteil = s < 10 ? 0.8 : (s < 15 ? 0.6 : 0.4);
      var richtigCount = Math.floor(fragenInSession * anteil);
      var sessionId = 'test-session-' + s + '-' + idx;

      sessionZeilen.push([
        sessionId,
        email,
        idx % 2 === 0 ? 'bwl_einfuehrung' : 'recht_einfuehrung',
        'Wirtschaft & Recht',
        datum,
        richtigCount + '/' + fragenInSession,
        fragenInSession,
        richtigCount
      ]);

      for (var fi = 0; fi < fragenInSession; fi++) {
        var frageId = fragenIds[(idx * fragenInSession + fi) % fragenIds.length];
        if (!fragenStatus[frageId]) {
          fragenStatus[frageId] = { versuche: 0, richtig: 0, richtigInFolge: 0, letzterVersuch: datum, sessionIds: [] };
        }
        var st = fragenStatus[frageId];
        st.versuche++;
        var warRichtig = fi < richtigCount;
        if (warRichtig) {
          st.richtig++;
          st.richtigInFolge++;
        } else {
          st.richtigInFolge = 0;
        }
        st.letzterVersuch = datum;
        st.sessionIds.push(sessionId);
      }
    }

    var ids = Object.keys(fragenStatus);
    for (var fk = 0; fk < ids.length; fk++) {
      var st2 = fragenStatus[ids[fk]];
      var mastery = st2.versuche === 0 ? 0 : Math.round((st2.richtig / st2.versuche) * 100);
      fortschrittZeilen.push([
        email, ids[fk], st2.versuche, st2.richtig, st2.richtigInFolge,
        mastery, st2.letzterVersuch, st2.sessionIds.join(',')
      ]);
    }
  }

  if (sessionZeilen.length > 0) {
    sessionsSheet.getRange(2, 1, sessionZeilen.length, 8).setValues(sessionZeilen);
  }
  if (fortschrittZeilen.length > 0) {
    fortschrittSheet.getRange(2, 1, fortschrittZeilen.length, 8).setValues(fortschrittZeilen);
  }

  return { sessionsAngelegt: sessionZeilen.length, fortschrittAngelegt: fortschrittZeilen.length };
}
```

### Task F.2.d.4: Roll-Trigger + Installer

- [ ] **Step 1: Funktionen einfügen**

```javascript
/**
 * Weekly-Trigger: Modulo-Roll-Algorithmus (Spec §6.2):
 *   neueTageZurueck = ((altTageZurueck - 7) % 42 + 42) % 42
 * 
 * Verteilung bleibt 1-42 Tage zurück (genauer: 0-41, wir mappen 0 nicht auf 1).
 * Akzeptieren wir auch Session-Datum heute (0 Tage zurück) — wird in UI als „heute" angezeigt,
 * kein Bug.
 */
function rolleTestdatenMasteryVor() {
  var registrySS = SpreadsheetApp.openById(GRUPPEN_REGISTRY_ID);
  var registry = registrySS.getSheets()[0];
  var rData = registry.getDataRange().getValues();
  var rHeaders = rData[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var gIdCol = rHeaders.indexOf('id');
  var ssIdCol = rHeaders.indexOf('spreadsheetid');
  var testSpreadsheetId = null;
  for (var i = 1; i < rData.length; i++) {
    if (String(rData[i][gIdCol]).trim() === TEST_GRUPPE_ID) {
      testSpreadsheetId = String(rData[i][ssIdCol]);
      break;
    }
  }
  if (!testSpreadsheetId) {
    Logger.log('rolleTestdatenMasteryVor: Test-Gruppe nicht gefunden, no-op');
    return { gerollt: 0, hinweis: 'Test-Gruppe nicht gefunden' };
  }

  var heute = new Date();
  heute.setHours(0, 0, 0, 0);
  var heuteMs = heute.getTime();

  var ss = SpreadsheetApp.openById(testSpreadsheetId);
  var sessions = ss.getSheetByName('Sessions');
  var sData = sessions.getDataRange().getValues();
  var sHeaders = sData[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var sDatumCol = sHeaders.indexOf('datum');
  var gerollt = 0;
  for (var r = 1; r < sData.length; r++) {
    var altDatum = new Date(String(sData[r][sDatumCol]));
    if (isNaN(altDatum.getTime())) continue;
    var diffTage = Math.round((heuteMs - altDatum.getTime()) / (24 * 3600 * 1000));
    var neueTage = ((diffTage - 7) % 42 + 42) % 42;
    var neuesDatum = new Date(heuteMs - neueTage * 24 * 3600 * 1000);
    sessions.getRange(r + 1, sDatumCol + 1).setValue(
      Utilities.formatDate(neuesDatum, 'Europe/Zurich', 'yyyy-MM-dd')
    );
    gerollt++;
  }

  // Fortschritt.letzterVersuch analog
  var fortschritt = ss.getSheetByName('Fortschritt');
  var fData = fortschritt.getDataRange().getValues();
  var fHeaders = fData[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var fDatumCol = fHeaders.indexOf('letzterversuch');
  if (fDatumCol >= 0) {
    for (var rf = 1; rf < fData.length; rf++) {
      var altF = new Date(String(fData[rf][fDatumCol]));
      if (isNaN(altF.getTime())) continue;
      var diffF = Math.round((heuteMs - altF.getTime()) / (24 * 3600 * 1000));
      var neueF = ((diffF - 7) % 42 + 42) % 42;
      fortschritt.getRange(rf + 1, fDatumCol + 1).setValue(
        Utilities.formatDate(new Date(heuteMs - neueF * 24 * 3600 * 1000), 'Europe/Zurich', 'yyyy-MM-dd')
      );
    }
  }

  Logger.log('rolleTestdatenMasteryVor: ' + gerollt + ' Sessions gerollt');
  return { gerollt: gerollt };
}

/**
 * Installiert Weekly-Trigger (MO 03:00 Europa/Zurich).
 * Pattern analog installiereAutoHardDeleteTrigger_ Z.4385: idempotent via deleteTrigger.
 */
function installiereTestdatenRollTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  var alteEntfernt = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'rolleTestdatenMasteryVor') {
      ScriptApp.deleteTrigger(triggers[i]);
      alteEntfernt++;
    }
  }
  ScriptApp.newTrigger('rolleTestdatenMasteryVor')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();
  Logger.log('Testdaten-Roll-Trigger installiert (MO 03:00). Alte entfernt: ' + alteEntfernt);
  return { installiert: 1, alteEntfernt: alteEntfernt };
}

/** Public Wrapper für GAS-Editor-Run-Knopf (Trigger-Permission-Grant Schritt). */
function installiereTestdatenRollTrigger() {
  return installiereTestdatenRollTrigger_();
}
```

### Task F.2.d.5: seedTestdaten_ erweitern + Commit

- [ ] **Step 1: Aufruf**

```javascript
  var gruppe = seedTestdatenGruppe_();
  var sessions = gruppe.spreadsheetId
    ? seedTestdatenSessionsUndFortschritt_(gruppe.spreadsheetId)
    : { sessionsAngelegt: 0, fortschrittAngelegt: 0 };
  installiereTestdatenRollTrigger_();
```

Return-Block:
```javascript
    testUebungenAngelegt: gruppe.angelegt,
    testSessionsAngelegt: sessions.sessionsAngelegt,
    testFortschrittAngelegt: sessions.fortschrittAngelegt,
    hinweis: undefined,
```

- [ ] **Step 2: Gates + Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm test 2>&1 | tail -3
npx tsc -b 2>&1 | tail -3
npm run lint:wire-contract
```

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Testdaten Übungs-Gruppe + Sessions + Mastery + Roll-Trigger (F.2.d)

- seedTestdatenGruppe_ (neues Spreadsheet + 5 Sheets + 20 Mitglieder + Auftrag, Sessions 8 Spalten)
- seedTestdatenSessionsUndFortschritt_ (3-8 Sessions/SuS, 42-Tage-Spread, kumulierte Mastery)
- rolleTestdatenMasteryVor (Modulo-Roll 42-Tage-Fenster)
- installiereTestdatenRollTrigger_ (Weekly MO 03:00, idempotent)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase F.2.e — loescheAlleTestdaten_ + Reset-Aktivierung

**Scope:** Reset-Funktion löscht alle Test-Records aus allen Storage-Pfaden, trasht Test-Übungs-Gruppen-Spreadsheet, entfernt Test-Antworten/Korrektur-Tabs.

### Task F.2.e.1: `loescheAlleTestdaten_()`

- [ ] **Step 1: Function einfügen**

```javascript
/**
 * Löscht alle Test-Records aus allen Storage-Pfaden.
 * Filter-Logik analog Frontend istTestdaten (single source of truth).
 *
 * Wichtig: WIR LÖSCHEN NUR IM test-kurs-01-Tab, NICHT über alle Kurs-Tabs.
 * Echt-SuS mit Test-Pattern-Email werden durch Pre-Check (seedTestdatenSuS_) verhindert.
 *
 * Reihenfolge (abhängige Daten zuerst):
 *  1. Antworten + Korrektur-Tabs (im ANTWORTEN_MASTER_ID)
 *  2. Test-Prüfung in Configs
 *  3. Test-Spreadsheet trashen + Registry-Eintrag entfernen
 *  4. SuS-Tab in KURSE_SHEET_ID
 *  5. Test-Kurs in Kurse-Sheet
 *  6. Test-LP in Lehrpersonen-Sheet
 *
 * Return: Counters pro Bereich.
 */
function loescheAlleTestdaten_() {
  var counter = {
    antwortenTabsGeloescht: 0,
    korrekturTabsGeloescht: 0,
    pruefungenGeloescht: 0,
    testSpreadsheetGetrasht: false,
    registryGeloescht: 0,
    susTabGeloescht: false,
    kurseGeloescht: 0,
    lpGeloescht: 0
  };

  // 1. Antworten- + Korrektur-Tabs für Test-Prüfung (Tab-Name beginnt mit 'Antworten_test-' bzw. 'Korrektur_test-')
  if (ANTWORTEN_MASTER_ID) {
    var antwortenSS = SpreadsheetApp.openById(ANTWORTEN_MASTER_ID);
    var alleTabs = antwortenSS.getSheets();
    for (var t = 0; t < alleTabs.length; t++) {
      var name = alleTabs[t].getName();
      if (name.indexOf('Antworten_test-') === 0) {
        antwortenSS.deleteSheet(alleTabs[t]);
        counter.antwortenTabsGeloescht++;
      } else if (name.indexOf('Korrektur_test-') === 0) {
        antwortenSS.deleteSheet(alleTabs[t]);
        counter.korrekturTabsGeloescht++;
      }
    }
  }

  // 2. Test-Prüfung in Configs
  var configsSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
  counter.pruefungenGeloescht = loescheTestZeilen_(configsSheet, { idCol: 'id', idPrefix: TEST_ID_PREFIX });

  // 3. Test-Spreadsheet + Registry-Eintrag
  var registry = SpreadsheetApp.openById(GRUPPEN_REGISTRY_ID).getSheets()[0];
  var rData = registry.getDataRange().getValues();
  var rHeaders = rData[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var gIdCol = rHeaders.indexOf('id');
  var gSsCol = rHeaders.indexOf('spreadsheetid');
  for (var rr = rData.length - 1; rr >= 1; rr--) {
    if (String(rData[rr][gIdCol]).trim() === TEST_GRUPPE_ID) {
      var ssId = String(rData[rr][gSsCol]);
      try {
        DriveApp.getFileById(ssId).setTrashed(true);
        counter.testSpreadsheetGetrasht = true;
      } catch (e) {
        Logger.log('Trash failed für ' + ssId + ': ' + e.message);
      }
      registry.deleteRow(rr + 1);
      counter.registryGeloescht++;
    }
  }

  // 4. SuS-Tab in KURSE_SHEET_ID
  var kurseSS = SpreadsheetApp.openById(KURSE_SHEET_ID);
  var susTab = kurseSS.getSheetByName(TEST_KURS_ID);
  if (susTab) {
    kurseSS.deleteSheet(susTab);
    counter.susTabGeloescht = true;
  }

  // 5. Test-Kurs in Kurse-Sheet
  var kurseSheet = kurseSS.getSheetByName('Kurse');
  counter.kurseGeloescht = loescheTestZeilen_(kurseSheet, { idCol: 'kursId', idExact: TEST_KURS_ID });

  // 6. Test-LP in Lehrpersonen-Sheet
  var lpSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Lehrpersonen');
  counter.lpGeloescht = loescheTestZeilen_(lpSheet, { emailExact: TEST_LP_EMAIL });

  return counter;
}

/**
 * Generic Helper: löscht alle Test-Zeilen aus einem Sheet (OR-Filter).
 * filter:
 *   - idCol + idExact: exakter ID-Match
 *   - idCol + idPrefix: Prefix-Match
 *   - emailExact: exakte Email
 *   - emailCol (default 'email'): Email-Spalte für TEST_EMAIL_REGEX
 *
 * Iteriert von unten nach oben (deleteRow ändert Indizes).
 */
function loescheTestZeilen_(sheet, filter) {
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });

  var idColIdx = filter.idCol ? headers.indexOf(String(filter.idCol).toLowerCase()) : -1;
  var emailColIdx = headers.indexOf(filter.emailCol ? String(filter.emailCol).toLowerCase() : 'email');

  var matches = function(row) {
    if (idColIdx >= 0) {
      var idVal = String(row[idColIdx] || '').trim();
      if (filter.idExact && idVal === filter.idExact) return true;
      if (filter.idPrefix && idVal.indexOf(filter.idPrefix) === 0) return true;
    }
    if (emailColIdx >= 0) {
      var em = String(row[emailColIdx] || '').toLowerCase().trim();
      if (filter.emailExact && em === String(filter.emailExact).toLowerCase()) return true;
      if (!filter.emailExact && !filter.idExact && !filter.idPrefix && TEST_EMAIL_REGEX.test(em)) return true;
    }
    return false;
  };

  var deleted = 0;
  for (var r = data.length - 1; r >= 1; r--) {
    if (matches(data[r])) {
      sheet.deleteRow(r + 1);
      deleted++;
    }
  }
  return deleted;
}
```

### Task F.2.e.2: seedTestdaten_ mode='reset' aktivieren

- [ ] **Step 1: Reset-Pfad ergänzen**

In `seedTestdaten_(mode, callerEmail)`:
```javascript
  var geloescht = null;
  if (mode === 'reset') {
    geloescht = loescheAlleTestdaten_();
    Logger.log('Reset durchgeführt: ' + JSON.stringify(geloescht));
  }

  var lp = seedTestdatenLP_();
  // ... rest unchanged ...

  return {
    // ... bestehende Felder ...
    geloeschtBeiReset: geloescht
  };
```

### Task F.2.e.3: Gates + Commit

- [ ] **Step 1: Gates**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm test 2>&1 | tail -3
npx tsc -b 2>&1 | tail -3
npm run lint:wire-contract
npm run build 2>&1 | tail -5
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Testdaten Reset (F.2.e)

- loescheAlleTestdaten_ (Antworten/Korrektur-Tabs, Pruefung, Test-Spreadsheet, SuS-Tab, Kurs, LP)
- loescheTestZeilen_ Generic-Helper (OR-Filter idExact/idPrefix/emailExact/Email-Regex)
- seedTestdaten_ mode='reset' aktiviert (löscht vor Seed)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase F.2.f — User-Deploy + Initial-Seed + Browser-E2E + Merge

**Scope:** Apps-Script-Code in Apps-Script-Editor einspielen, Trigger-Permission-Grant, Initial-Seed, Reset-E2E, Browser-E2E, Merge.

### Task F.2.f.1: PR auf preview

- [ ] **Step 1: Push + PR**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push -u origin feature/cluster-f-testdaten-f2-backend
gh pr create --base preview --title "ExamLab Cluster F.2 — Testdaten-Backend Apps-Script" --body "$(cat <<'EOF'
## Summary
- doPost-Case apiAdminSeedTestdaten mit Admin-Auth + LockService(tryLock 5s)
- seedTestdaten_ idempotent: Stammdaten (Kurs+SuS-Tab), LP, 20 SuS (mit Echt-Email-Kollisions-Pre-Check), Test-Pruefung mit Antworten + Korrekturen (echte Schemata aus autoBewerteAntwort), Test-Uebungs-Gruppe (5 Sheets), 3-8 Sessions/SuS, Mastery
- rolleTestdatenMasteryVor (Modulo-Roll 42-Tage-Fenster) + Weekly-Trigger MO 03:00 idempotent
- loescheAlleTestdaten_ (mode=reset) loescht alle Test-Pfade
- Bonus-Fix: Sessions-Sheet-Schema-Drift in uebenErstelleGruppe (6 -> 8 Spalten)
- Frontend Service-Wrapper testdatenApi.ts + 4 Tests

## Test plan
- [ ] Apps-Script-Deploy durch Yannick
- [ ] Trigger-Permission im Apps-Script-Editor granted (installiereTestdatenRollTrigger run)
- [ ] Initial-Seed via cURL oder Apps-Script-Editor _seedTest
- [ ] Drive-Verifikation: Test-Records in 6 Sheets sichtbar
- [ ] cURL Reset -> Initial -> Statistik plausibel
- [ ] SuS-Login wr.test@stud.gymhofwil.ch + 0 Console-Errors

[Generated with Claude Code]
EOF
)"
```

### Task F.2.f.2: Apps-Script-Deploy (User-Action)

- [ ] **Step 1: Code-Transfer**

User-Action:
1. `pbcopy < "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/apps-script-code.js"`
2. Apps-Script-Editor öffnen → Code löschen → einfügen → Cmd+S.
3. „Bereitstellen" → „Bereitstellung verwalten" → Web-App-Bereitstellung bearbeiten → „Neue Version" → Description „F.2 Testdaten-Backend" → Bereitstellen. URL bleibt gleich.

- [ ] **Step 2: Trigger-Permission Grant**

Im Editor: Function `installiereTestdatenRollTrigger` selektieren → „Ausführen" → Permissions-Dialog bestätigen. Logger zeigt: `Testdaten-Roll-Trigger installiert (MO 03:00). Alte entfernt: 0`.

Verifizieren: „Trigger" (Uhr-Icon links) → MO 03:00 weekly für `rolleTestdatenMasteryVor` sichtbar.

### Task F.2.f.3: Initial-Seed (Variante A — Apps-Script-Editor)

- [ ] **Step 1: Helper-Function temporär einfügen + ausführen**

Im Apps-Script-Editor neue Function (am File-Top oder Ende):

```javascript
function _seedTestInitial() {
  return apiAdminSeedTestdaten_({ email: 'yannick.durand@gymhofwil.ch', mode: 'initial' });
}
```

„_seedTestInitial" wählen → „Ausführen" → Logs prüfen.

Expected:
```
{ success: true, statistik: {
  mode: 'initial',
  testLpAngelegt: true,
  testSuSAngelegt: 20,
  testPruefungenAngelegt: 1,
  testAntwortenAngelegt: 20,
  testKorrekturenAngelegt: ~200,
  testUebungenAngelegt: 1,
  testSessionsAngelegt: ~110,   // 20 SuS × Ø 5.5 Sessions
  testFortschrittAngelegt: ~200,
  ...
}, dauerMs: ~25000 }
```

- [ ] **Step 2: Drive-Sheet-Verifikation**

- `CONFIGS_ID/Lehrpersonen` → `wr.test@gymhofwil.ch` Zeile
- `KURSE_SHEET_ID/Kurse` → `test-kurs-01` Zeile mit `klassen='test-klasse-01'`
- `KURSE_SHEET_ID/test-kurs-01` (Tab) → 20 SuS-Zeilen
- `CONFIGS_ID/Configs` → `test-pruefung-01` Zeile mit `status='beendet'`
- `ANTWORTEN_MASTER_ID/Antworten_test-pruefung-01` → 20 Zeilen, `antworten`-Spalte JSON
- `ANTWORTEN_MASTER_ID/Korrektur_test-pruefung-01` → ~200 Zeilen (20 × 10)
- `GRUPPEN_REGISTRY_ID` → Zeile `test-gruppe-01` mit `spreadsheetId`
- Test-Spreadsheet öffnen → `Sessions` ~110 Zeilen, `Fortschritt` ~200 Zeilen

### Task F.2.f.4: Reset + Re-Seed E2E (idempotenz-Check)

- [ ] **Step 1: Reset durchführen**

Im Apps-Script-Editor:
```javascript
function _seedTestReset() {
  return apiAdminSeedTestdaten_({ email: 'yannick.durand@gymhofwil.ch', mode: 'reset' });
}
```

Ausführen → Logs:
```
{ success: true, statistik: {
  mode: 'reset',
  geloeschtBeiReset: {
    antwortenTabsGeloescht: 1,
    korrekturTabsGeloescht: 1,
    pruefungenGeloescht: 1,
    testSpreadsheetGetrasht: true,
    registryGeloescht: 1,
    susTabGeloescht: true,
    kurseGeloescht: 1,
    lpGeloescht: 1
  },
  testLpAngelegt: true,
  testSuSAngelegt: 20,
  // ... gleiche Counts wie initial ...
} }
```

- [ ] **Step 2: Drive-Verifikation Re-Seed**

Alle Counts gleich wie nach Initial. Test-Spreadsheet hat neue ID (vorher getrasht).

### Task F.2.f.5: SuS-Login Browser-E2E (echtes Login)

- [ ] **Step 1: SuS-Login mit wr.test@stud.gymhofwil.ch**

Browser → ExamLab → Login. Erwartet: Dashboard lädt. Test-Übungs-Gruppe sichtbar (wr.test ist Mitglied).

> **Login-Konvention:** Memory `feedback_echte_logins.md` — keine Demo, echtes Google-Konto.

- [ ] **Step 2: DevTools-Console**

0 Errors. Network-Tab: API-Calls zu `apiAdminSeedTestdaten` sind keine drin (nur reguläre Frontend-Calls).

> **Hinweis:** Volle Spec §10.4 E2E-Pfade 5+7 brauchen Frontend-Filter (Cluster F.4) und sind aus F.2 scope ausgeschlossen.

### Task F.2.f.6: Merge + Cleanup

- [ ] **Step 1: PR mergen** (User → GitHub UI)

- [ ] **Step 2: Branch löschen + main pullen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull --ff-only
git branch -d feature/cluster-f-testdaten-f2-backend
git push origin --delete feature/cluster-f-testdaten-f2-backend
```

- [ ] **Step 3: HANDOFF.md auf MERGED + Final-Commit**

```bash
# HANDOFF.md Cluster F.2 Eintrag auf MERGED setzen, Hash ergänzen.
git add HANDOFF.md
git commit -m "$(cat <<'EOF'
ExamLab: HANDOFF Cluster F.2 auf MERGED + Browser-E2E-Verifikation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

- [ ] **Step 4: Temporäre Helper-Functions im Apps-Script-Editor entfernen**

`_seedTestInitial` und `_seedTestReset` waren nur für F.2.f.3-f.4 nötig. Im Apps-Script-Editor löschen, neu deployen (kleine Version, kein User-Impact da nur tote Code-Pfade).

---

## Definition of Done (F.2)

- [ ] 5 Backend-Commits (F.2.a-e) auf `feature/cluster-f-testdaten-f2-backend` + 1 finaler HANDOFF-Commit
- [ ] Wire-Contract-Linter grün (`apiAdminSeedTestdaten` 1:1)
- [ ] Frontend `testdatenApi.ts` mit 4 Tests grün
- [ ] Apps-Script-Deploy durch User (neue Version)
- [ ] Trigger-Permission granted + MO 03:00 weekly für `rolleTestdatenMasteryVor` im Apps-Script-Editor sichtbar
- [ ] Initial-Seed erfolgreich (Statistik plausibel, Drive-Sheets manuell verifiziert)
- [ ] Reset-Modus funktioniert (`geloeschtBeiReset` Counters > 0, Re-Seed bringt selbe Counts)
- [ ] Bonus-Fix Sessions-Schema-Drift in `uebenErstelleGruppe` (6→8 Spalten) aktiv
- [ ] SuS-Login mit `wr.test@stud.gymhofwil.ch` funktioniert, 0 Console-Errors
- [ ] Üben-Tab nach SuS-Login zeigt mindestens 1 Session-Karte für `wr.test` (Mastery-Sichtbarkeit verifiziert — schließt Schema-Drift in Sessions-/Fortschritt-Sheets aus)
- [ ] Branch lokal + remote gelöscht
- [ ] HANDOFF.md auf MERGED

## Out-of-Scope

- **F.3:** TestdatenTab-UI, useTestBadgeVisible-Hook, TestBadge-Komponente, Confirm-Modal
- **F.4:** Read-Pfad-Filter-Integration in Frontend-Stores/Hooks + Test-Badge in Listen
- **Cluster E:** LPProfil.testdatenSichtbar-Backend-Migration
- **Test-Prüfung 2** (optional in Spec §4.6): später als Spawn-Task `seedTestdatenPruefung2_`
- **Migration existing Sessions-Sheets** (Bonus-Fix nur für neue): Spawn-Task `migriereSessionsSheetSchemata_`

## Risiken + Mitigations

| Risiko | Wahrscheinlichkeit | Mitigation |
|---|---|---|
| GRUPPEN_REGISTRY-Schema in F.2.d.1 anders als erwartet | Niedrig-Mittel | F.2.d.1 grept Schema vor Implementation, kein Hardcode |
| Pool-Themen `bwl_einfuehrung` / `recht_einfuehrung` haben < 4 Fragen | Niedrig | Plan checkt min-Length und throws; Fallback wäre andere Pool-IDs hinzufügen |
| Apps-Script-Quota Execution-Time 6 min | Niedrig | Seed schreibt batched, ~30s erwartet |
| Trigger registriert sich nicht (Permission fehlt) | Niedrig | F.2.f.2 Step 2 ist expliziter Trigger-Permission-Grant-Schritt |
| Test-LP-Email-Profil-Anlage fehlschlägt (Sheet-Lock o.ä.) | Sehr niedrig | LockService schützt 5s |

## Plan-Phase-Klärungen (für Reviewer)

1. **PruefungsConfig-Persistenz** ✓ Reference (`fragenIds: string[]` in `abschnitte`-JSON) verifiziert via `ladePruefung` Z.2107
2. **Mastery-Storage** ✓ Pro-Gruppen-Spreadsheet mit 5 Sheets verifiziert via `uebenErstelleGruppe` Z.9051-9088
3. **Admin-Check** ✓ via bestehende `getLPInfo(email).rolle === 'admin'`-API (Spec-Text §4.4 ist konzeptuell)
4. **„Einführungsprüfung"-Quelle** ✓ Pool-Themen `bwl_einfuehrung` + `recht_einfuehrung` (Spec §4.6 spricht von „echter Einführungsprüfung", die nicht als Config-Eintrag existiert)
5. **Stammdaten-Konflikt-Verhalten** ✓ Plan macht idempotent (match-and-skip) statt Fehler-Abbruch wie Spec §7 fordert — Begründung: ein versehentliches `test-klasse-01` (extrem unwahrscheinlich) sollte den Seed nicht blockieren; identisches Resultat egal ob neu angelegt oder vorhanden
6. **Test-Prüfung 2** ✓ Out-of-Scope dieser Phase (Spec sagt „optional"), als Spawn-Task `seedTestdatenPruefung2_` notiert
7. **Echt-SuS-Email-Pre-Check** ✓ Implementiert in `seedTestdatenSuS_` — wirft bei Kollision, verhindert späteren Daten-Loss beim Reset (Spec §7 Anforderung erfüllt)
8. **Antwort-Schema per Fragetyp** ✓ Aus `autoBewerteAntwort` Z.6934-6990 übernommen — `testAntwortFuerFrage_` generiert echte Auto-Bewertungs-fähige Antworten
9. **Pruefung-Status-Wert** ✓ `'beendet'` (nicht `'abgeschlossen'`) verifiziert via `speichereAntworten` Z.3154
10. **LockService**: `tryLock(5000)` mit early-return (anstatt `waitLock` mit catch) — klarere Race-Antwort an Frontend
11. **Wire-Contract-Linter-Richtung** ✓ Frontend-Action ohne Backend-Match → exit 1 (`--strict`); Backend-only-Cases sind erlaubt. F.2.a.5 Frontend-Wrapper landet im selben Commit wie der Backend-Case → keine Zwischen-Phase mit Mismatch
