# Cluster F — Testdaten-Infrastruktur (Master-Plan, 4 Sub-Phasen)

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking. **Master-Plan** — pro Sub-Phase (F.1-F.4) ist ein eigenes Implementation-Bundle vorgesehen. F.1 ist klein + risikolos, F.2 ist Apps-Script-Heavy (User-Deploy nötig), F.3 mittel, F.4 ist die riskanteste Phase (Read-Pfad-Migration).

**Goal:** Testdaten-Infrastruktur in ExamLab — dedizierter Test-Kurs mit 20 SuS, idempotenter Apps-Script-Seed, LP-Sichtbarkeits-Toggle, Filter in allen Read-Pfaden + Test-Badge in Listen.

**Architecture:** 
- **F.1 Frontend-Foundation** (additive): LPProfil-Type, Konstanten-Modul, Filter-Utility (Pure-Function), Tests.
- **F.2 Backend** (Apps-Script): `apiAdminSeedTestdaten`-Endpoint + `seedTestdaten_` + `loescheAlleTestdaten_` + `rolleTestdatenMasteryVor` (Weekly-Trigger) + LockService + Bonus Sessions-Sheet-Schema-Fix.
- **F.3 UI Components**: TestBadge + useTestBadgeVisible-Hook + TestdatenTab + Confirm-Modal + Tab-Integration via Tab-Registry.
- **F.4 Read-Pfad-Integration**: Filter-Anwendung in 8-15 Frontend-Stores/Hooks/Services + Test-Badge in Listen.

**Tech Stack:** React 19 + TS + Vite + Vitest + Apps-Script (Backend).

---

## Pre-Audit-Ergebnisse (Source-Audit-Befunde)

| Frage | Befund | Konsequenz |
|---|---|---|
| Pruefung-Persistenz Embed vs Reference | **REFERENCE** (nur `fragenIds: string[]`, `ExamLab/src/types/pruefung.ts:128-133`) | Test-Prüfung referenziert existierende Fragen via ID. Keine neuen Test-Fragen erstellen. |
| Mastery-Datenmodell | **Pro-Gruppen-Sheet** mit 5 fixen Sheets (`Fragen`/`Mitglieder`/`Auftraege`/`Fortschritt`/`Sessions`, `apps-script-code.js:8984-9004`) | Test-Kurs braucht eigene Übungs-Gruppe mit eigenem Spreadsheet ODER nutzt existing Spreadsheet-Pool. Empfehlung F.2: neue Test-Gruppe mit eigenem Spreadsheet (isoliert). |
| Bestehende `seedXxx`-Patterns? | **Nein** — keine Vorbilder für Seeds. Nächstes verwandtes Pattern: Migrations (`migriereFachbereich_`). | F.2 baut from scratch, lehnt sich an Migrations-Pattern an. |
| LockService-Pattern? | **Ja** (8 Verwendungen, 5000ms Timeout, try/finally release, `apps-script-code.js:12027` als Sample). | F.2 nutzt dasselbe Pattern. |
| Weekly-Trigger-Pattern? | **Nein** — nur daily Trigger (`autoHardDeleteAlteFragen_`, `apps-script-code.js:4321`). API-Pattern: `timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(3).create()`. | F.2 muss neuen Weekly-Trigger-Installer schreiben. |
| Sessions-Sheet Schema-Drift | **Bestätigt**: Init-Code (`apps-script-code.js:9004`) schreibt 6 Spalten (`sessionId, email, thema, fach, datum, ergebnis`), Read-Code (`11283-11291`) erwartet 7 (`+ anzahlfragen, richtig`). Aktive Sheets sind migriert; Init-Code ist veraltet. | **Bonus-Fix in F.2**: Init-Helper auf 7-Spalten-Schema anheben (Latent-Bug-Fix). |
| Wire-Contract neue Action? | `apiAdminSeedTestdaten` — wird durch `lint:wire-contract` Gate geprüft, Frontend + Backend müssen synchron sein. | F.1 (Frontend) + F.2 (Backend) müssen in einer Session gelandet werden ODER F.1 nutzt Apps-Script-Stub (`return jsonResponse({ ok: false })` bis F.2 deployt ist). Empfehlung: F.1 enthält **keinen** Frontend-Call zum neuen Endpoint — nur Type/Konstanten/Filter. Frontend-API-Call kommt in F.3 mit Tab-UI. |

## File-Struktur

**Neue Files (F.1):**
- `ExamLab/src/utils/testdaten/identifikation.ts` — Konstanten + Regex
- `ExamLab/src/utils/testdaten/identifikation.test.ts`
- `ExamLab/src/utils/testdaten/filter.ts` — `istTestdaten`, `filtereTestdatenWennDeaktiviert`
- `ExamLab/src/utils/testdaten/filter.test.ts`

**Modifizierte Files (F.1):**
- `ExamLab/src/types/stammdaten.ts` — `LPProfil.testdatenSichtbar?: boolean` ergänzen

**Neue/modifizierte (F.2):**
- `ExamLab/apps-script-code.js` — Test-Konstanten, Endpoint-Handler, seedTestdaten_, loescheAlleTestdaten_, rolleTestdatenMasteryVor + Trigger-Installer, Sessions-Sheet-Schema-Fix
- Wire-Contract-Audit-Erweiterung falls nötig

**Neue Files (F.3):**
- `ExamLab/src/components/shared/TestBadge.tsx`
- `ExamLab/src/components/shared/TestBadge.test.tsx`
- `ExamLab/src/hooks/useTestBadgeVisible.ts`
- `ExamLab/src/hooks/useTestBadgeVisible.test.ts`
- `ExamLab/src/components/lp/einstellungen/TestdatenTab.tsx`
- `ExamLab/src/components/lp/einstellungen/TestdatenTab.test.tsx`
- `ExamLab/src/services/testdatenApi.ts` — Wrapper für `apiAdminSeedTestdaten`-Call

**Modifizierte Files (F.3):**
- `ExamLab/src/components/lp/EinstellungenPanel.tsx` — neuer Tab via Tab-Registry

**Modifizierte Files (F.4):**
- Read-Pfade in Frontend (Liste in Phase F.4 unten detailliert)
- Listen-Komponenten mit `<TestBadge />` umrahmt

---

## Phase F.1: Frontend-Foundation — TDD

**Scope:** Reine Additionen. Filter-Utility + Konstanten + Type-Erweiterung. Kein Backend-Call, keine UI. Sicher.

**Branch:** `feature/cluster-f-testdaten`

### Task F.1.1: Branch + Constants-File — TDD

**Files:**
- Create: `ExamLab/src/utils/testdaten/identifikation.ts`
- Create: `ExamLab/src/utils/testdaten/identifikation.test.ts`

- [ ] **Step 1: Feature-Branch**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull
git checkout -b feature/cluster-f-testdaten
```

- [ ] **Step 2: Test schreiben (Konstanten + Regex-Verhalten)**

```ts
// ExamLab/src/utils/testdaten/identifikation.test.ts
import { describe, it, expect } from 'vitest'
import {
  TEST_KURS_ID, TEST_KLASSE_ID, TEST_ID_PREFIX, TEST_EMAIL_REGEX,
  TEST_LP_EMAIL, TEST_SUS_EMAILS, istTestEmail,
} from './identifikation'

describe('Testdaten-Konstanten', () => {
  it('IDs entsprechen Spec', () => {
    expect(TEST_KURS_ID).toBe('test-kurs-01')
    expect(TEST_KLASSE_ID).toBe('test-klasse-01')
    expect(TEST_ID_PREFIX).toBe('test-')
  })

  it('TEST_SUS_EMAILS hat 20 Einträge inkl. wr.test', () => {
    expect(TEST_SUS_EMAILS).toHaveLength(20)
    expect(TEST_SUS_EMAILS).toContain('wr.test@stud.gymhofwil.ch')
  })

  it('TEST_LP_EMAIL ist wr.test@gymhofwil.ch', () => {
    expect(TEST_LP_EMAIL).toBe('wr.test@gymhofwil.ch')
  })
})

describe('TEST_EMAIL_REGEX', () => {
  it('matcht Test-Emails', () => {
    expect(TEST_EMAIL_REGEX.test('wr.test@stud.gymhofwil.ch')).toBe(true)
    expect(TEST_EMAIL_REGEX.test('anna.testschueler1@stud.gymhofwil.ch')).toBe(true)
    expect(TEST_EMAIL_REGEX.test('sven.testschueler19@stud.gymhofwil.ch')).toBe(true)
  })

  it('matcht NICHT echte SuS-Emails (auch wenn "test" im Namen vorkommt)', () => {
    expect(TEST_EMAIL_REGEX.test('test.normaluser@stud.gymhofwil.ch')).toBe(false)
    expect(TEST_EMAIL_REGEX.test('martin.testermann@stud.gymhofwil.ch')).toBe(false)
    expect(TEST_EMAIL_REGEX.test('protest@stud.gymhofwil.ch')).toBe(false)
  })

  it('matcht NICHT die LP-Test-Email (anders als SuS-Test-Email)', () => {
    expect(TEST_EMAIL_REGEX.test('wr.test@gymhofwil.ch')).toBe(false)
  })
})

describe('istTestEmail', () => {
  it('Helper-Wrapper über Regex + LP-Email-Check', () => {
    expect(istTestEmail('wr.test@stud.gymhofwil.ch')).toBe(true)
    expect(istTestEmail('wr.test@gymhofwil.ch')).toBe(true)   // LP-Test
    expect(istTestEmail('echt@gymhofwil.ch')).toBe(false)
    expect(istTestEmail(undefined)).toBe(false)
    expect(istTestEmail('')).toBe(false)
  })
})
```

- [ ] **Step 3: FAIL bestätigen**

Run: `cd ExamLab && npx vitest run src/utils/testdaten/identifikation.test.ts`
Expected: FAIL — `Cannot find module './identifikation'`.

- [ ] **Step 4: identifikation.ts implementieren**

```ts
// ExamLab/src/utils/testdaten/identifikation.ts
/**
 * Single source of truth für Testdaten-Identifikatoren.
 * MUSS synchron mit gleichen Konstanten in `apps-script-code.js` sein —
 * siehe Cluster F Spec §5.1 Single Source of Truth Backend ↔ Frontend.
 */

export const TEST_KURS_ID = 'test-kurs-01'
export const TEST_KLASSE_ID = 'test-klasse-01'
export const TEST_ID_PREFIX = 'test-'

/** Matcht SuS-Test-Emails: `wr.test@stud.gymhofwil.ch` oder `<name>.testschuelerN@stud.gymhofwil.ch`. */
export const TEST_EMAIL_REGEX = /^(wr\.test|[a-z]+\.testschueler\d+)@stud\.gymhofwil\.ch$/

export const TEST_LP_EMAIL = 'wr.test@gymhofwil.ch'

/** 20 Test-SuS gemäss Spec §4.5. */
export const TEST_SUS_EMAILS: readonly string[] = [
  'wr.test@stud.gymhofwil.ch',
  'anna.testschueler1@stud.gymhofwil.ch',
  'beat.testschueler2@stud.gymhofwil.ch',
  'clara.testschueler3@stud.gymhofwil.ch',
  'david.testschueler4@stud.gymhofwil.ch',
  'eva.testschueler5@stud.gymhofwil.ch',
  'felix.testschueler6@stud.gymhofwil.ch',
  'greta.testschueler7@stud.gymhofwil.ch',
  'hans.testschueler8@stud.gymhofwil.ch',
  'ina.testschueler9@stud.gymhofwil.ch',
  'jonas.testschueler10@stud.gymhofwil.ch',
  'karin.testschueler11@stud.gymhofwil.ch',
  'lukas.testschueler12@stud.gymhofwil.ch',
  'mara.testschueler13@stud.gymhofwil.ch',
  'noah.testschueler14@stud.gymhofwil.ch',
  'olivia.testschueler15@stud.gymhofwil.ch',
  'pia.testschueler16@stud.gymhofwil.ch',
  'quentin.testschueler17@stud.gymhofwil.ch',
  'rosa.testschueler18@stud.gymhofwil.ch',
  'sven.testschueler19@stud.gymhofwil.ch',
] as const

/**
 * Helper: prüft ob eine Email zu einem Test-Account gehört (SuS oder LP).
 * Tolerant gegen undefined/empty.
 */
export function istTestEmail(email: string | undefined | null): boolean {
  if (!email) return false
  if (email === TEST_LP_EMAIL) return true
  return TEST_EMAIL_REGEX.test(email)
}
```

- [ ] **Step 5: PASS verifizieren**

Run: `cd ExamLab && npx vitest run src/utils/testdaten/identifikation.test.ts`
Expected: 5/5 PASS.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/utils/testdaten/identifikation.ts ExamLab/src/utils/testdaten/identifikation.test.ts
git commit -m "$(cat <<'EOF'
ExamLab: Testdaten-Konstanten + istTestEmail-Helper (F.1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task F.1.2: Filter-Utility — TDD

**Files:**
- Create: `ExamLab/src/utils/testdaten/filter.ts`
- Create: `ExamLab/src/utils/testdaten/filter.test.ts`

- [ ] **Step 1: Test schreiben**

```ts
// ExamLab/src/utils/testdaten/filter.test.ts
import { describe, it, expect } from 'vitest'
import { istTestdaten, filtereTestdatenWennDeaktiviert } from './filter'

describe('istTestdaten', () => {
  it('matched kursId-Treffer', () => {
    expect(istTestdaten({ kursId: 'test-kurs-01' })).toBe(true)
    expect(istTestdaten({ kursId: 'sf-wr-29c' })).toBe(false)
  })

  it('matched klasse-Treffer', () => {
    expect(istTestdaten({ klasse: 'test-klasse-01' })).toBe(true)
    expect(istTestdaten({ klasse: '29c' })).toBe(false)
  })

  it('matched userEmail-Treffer (SuS-Pattern)', () => {
    expect(istTestdaten({ userEmail: 'wr.test@stud.gymhofwil.ch' })).toBe(true)
    expect(istTestdaten({ userEmail: 'anna.testschueler1@stud.gymhofwil.ch' })).toBe(true)
    expect(istTestdaten({ userEmail: 'echt@stud.gymhofwil.ch' })).toBe(false)
  })

  it('matched id-Prefix `test-`', () => {
    expect(istTestdaten({ id: 'test-pruefung-01' })).toBe(true)
    expect(istTestdaten({ id: 'echte-pruefung' })).toBe(false)
  })

  it('false bei leerem Object', () => {
    expect(istTestdaten({})).toBe(false)
  })

  it('false bei nur undefined/null Feldern', () => {
    expect(istTestdaten({ kursId: undefined, klasse: undefined, userEmail: undefined, id: undefined })).toBe(false)
  })

  it('OR-Logik: ein einziger Match reicht', () => {
    expect(istTestdaten({ kursId: 'echt-kurs', id: 'test-foo' })).toBe(true)
  })
})

describe('filtereTestdatenWennDeaktiviert', () => {
  const records = [
    { id: 'a-1', kursId: 'test-kurs-01' },
    { id: 'a-2', kursId: 'sf-wr-29c' },
    { id: 'test-b', kursId: 'sf-wr-29c' },
    { id: 'c', userEmail: 'echt@stud.gymhofwil.ch' },
    { id: 'd', userEmail: 'wr.test@stud.gymhofwil.ch' },
  ]

  it('lässt alle durch wenn testdatenSichtbar=true', () => {
    expect(filtereTestdatenWennDeaktiviert(records, true)).toEqual(records)
  })

  it('filtert Test-Records raus wenn testdatenSichtbar=false', () => {
    const ergebnis = filtereTestdatenWennDeaktiviert(records, false)
    expect(ergebnis.map(r => r.id)).toEqual(['a-2', 'c'])
  })

  it('leeres Array → leer', () => {
    expect(filtereTestdatenWennDeaktiviert([], false)).toEqual([])
    expect(filtereTestdatenWennDeaktiviert([], true)).toEqual([])
  })
})
```

- [ ] **Step 2: FAIL bestätigen**

Run: `cd ExamLab && npx vitest run src/utils/testdaten/filter.test.ts`
Expected: FAIL.

- [ ] **Step 3: filter.ts implementieren**

```ts
// ExamLab/src/utils/testdaten/filter.ts
import {
  TEST_KURS_ID, TEST_KLASSE_ID, TEST_ID_PREFIX, TEST_EMAIL_REGEX,
} from './identifikation'

/** Record-Shape: alle Felder optional; wir prüfen jedes einzeln (OR-Logik). */
export interface TestdatenKandidat {
  kursId?: string
  klasse?: string
  userEmail?: string
  id?: string
}

/**
 * Prüft ob ein Record zu Testdaten gehört. OR-Logik: ein einziger Match reicht.
 * Single source of truth via `identifikation.ts`-Konstanten.
 */
export function istTestdaten(record: TestdatenKandidat): boolean {
  if (record.kursId === TEST_KURS_ID) return true
  if (record.klasse === TEST_KLASSE_ID) return true
  if (record.userEmail && TEST_EMAIL_REGEX.test(record.userEmail)) return true
  if (record.id && record.id.startsWith(TEST_ID_PREFIX)) return true
  return false
}

/**
 * Liste-Filter: gibt records gefiltert zurück.
 * - Wenn `testdatenSichtbar` true → records unverändert
 * - Wenn false → Test-Records werden raus-gefiltert
 *
 * Generisch — funktioniert mit jedem Record-Shape, das die TestdatenKandidat-Felder
 * (optional) hat.
 */
export function filtereTestdatenWennDeaktiviert<T extends TestdatenKandidat>(
  records: readonly T[],
  testdatenSichtbar: boolean,
): T[] {
  if (testdatenSichtbar) return [...records]
  return records.filter(r => !istTestdaten(r))
}
```

- [ ] **Step 4: PASS verifizieren**

Run: `cd ExamLab && npx vitest run src/utils/testdaten/filter.test.ts`
Expected: alle Tests grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/testdaten/filter.ts ExamLab/src/utils/testdaten/filter.test.ts
git commit -m "$(cat <<'EOF'
ExamLab: Testdaten-Filter (istTestdaten + filtereTestdatenWennDeaktiviert, F.1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task F.1.3: LPProfil-Type-Erweiterung (additiv)

- [ ] **Step 1: Modify stammdaten.ts**

Run: `cd ExamLab && grep -n "favoriten?: AppOrt\[\]" src/types/stammdaten.ts`
Erwartet: 1 Treffer mit `favoriten?: AppOrt[]`. Direkt nach dieser Zeile ergänzen:

```ts
  /** Sichtbarkeit Test-Kurs in LP-Listen. Default false. Cluster F. */
  testdatenSichtbar?: boolean
```

- [ ] **Step 2: tsc + vitest gegen Side-Effects**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -5 && npm test 2>&1 | tail -3`
Expected: tsc clean, vitest pass count = baseline + 14 (5 identifikation + 9 filter) = 1558.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/types/stammdaten.ts
git commit -m "$(cat <<'EOF'
ExamLab: LPProfil.testdatenSichtbar additiv ergänzt (F.1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task F.1.4: F.1-Verifikation + Stop-Punkt

- [ ] **Verification-Gates (analog Foundation Task 9)**

Run:
```bash
cd ExamLab
npm test 2>&1 | tail -5
npx tsc -b 2>&1 | tail -5
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract
npm run build 2>&1 | tail -5
```

- [ ] **Stop-Punkt: User-Entscheidung**

F.1 ist klein + risikolos. Hier ist ein natürlicher Pause-Punkt für User-Check:
- Option A: continue mit F.2 (Backend Apps-Script) — User muss danach deployen
- Option B: erst push F.1 zu preview → merge zu main → später F.2 als separates Bundle

Beide sind valid. Default-Empfehlung: **Option A** (Bundle wirklich zusammenhalten), wenn Session-Budget reicht.

---

## Phase F.2: Backend Apps-Script (Detail-Plan siehe separate Datei)

**High-Level:**
1. Konstanten am Top der apps-script-code.js (Test-IDs, Email-Regex)
2. `apiAdminSeedTestdaten` Endpoint + doPost-Case `admin:seedTestdaten`
3. `seedTestdaten_(mode, callerEmail)`:
   - Auth (Admin-only)
   - LockService.waitLock(5000)
   - Wenn mode='reset' → `loescheAlleTestdaten_()`
   - Stammdaten ergänzen (Klasse + Kurs idempotent)
   - Test-LP-Profil anlegen
   - 20 Test-SuS-Records anlegen
   - Test-Übungs-Gruppe + Spreadsheet
   - Test-Sessions + Fortschritt (6-Wochen-Spread)
   - Test-Prüfung 1 (Einführungsprüfung-Kopie als Reference) + Antworten + Korrekturen
   - Optional Test-Prüfung 2
   - Weekly-Trigger registrieren via `installiereTestdatenRollTrigger_()`
   - Return Statistik
4. `loescheAlleTestdaten_()`: alle Test-Records aus allen Sheets
5. `rolleTestdatenMasteryVor()`: Modulo-Roll im 42-Tage-Fenster
6. `installiereTestdatenRollTrigger_()`: einmaliger Weekly-Trigger MO 3:00, idempotent
7. **Bonus-Fix:** Sessions-Sheet-Schema-Drift — Init-Helper für 7-Spalten-Header

**Wire-Contract:** Frontend-action `apiAdminSeedTestdaten` braucht Backend-Case `apiAdminSeedTestdaten`. F.2 muss beide ausliefern und User Apps-Script-Deploy machen.

**User-Action:** Apps-Script `apps-script-code.js` aus diesem Branch in Apps-Script-Editor einspielen + neue Version deployen + initial seed durch Admin (Yannick).

**Detail-Plan F.2:** Beim Übergang von F.1 → F.2 schreiben (eigene Plan-Datei `2026-05-11-cluster-f-testdaten-f2-backend.md`).

---

## Phase F.3: UI Components (Skizze)

- `TestBadge.tsx` (Spec §5.2)
- `useTestBadgeVisible(record)`: liest `lpProfil.testdatenSichtbar` + `istTestdaten(record)`
- `TestdatenTab.tsx`:
  - Sektion A „Status" (initialisiert? letzter seed?)
  - Sektion B „Sichtbarkeits-Toggle"
  - Sektion C „Admin" (nur wenn `currentUser.email in admins`)
- Confirm-Modal beim Reset
- `services/testdatenApi.ts` mit `apiAdminSeedTestdaten`-Call
- Tab-Integration: `EinstellungenPanel.tsx` rendert Testdaten-Tab via Tab-Registry (Foundation-Konsum #1)
- `wr.test`-LP-Login: Test-Tab sichtbar

**Detail-Plan F.3:** nach F.2-Merge.

---

## Phase F.4: Read-Pfad-Integration (Risiko-Phase)

Hauptkandidaten gemäss Audit:
- `useLPDashboardData.ts:68` (LP-Dashboard — Konfigs/Lehrpersonen)
- Klassen-Listen (`klassenlistenStore.ts:34`, `VorbereitungPhase.tsx:67-83`)
- Auftrag-Store (`uebenLadeAuftraege`)
- Korrekturen (`korrekturApi.ts` für `ladeKorrekturenFuerSuS`)
- Schueler-Listen in Composer / Live-Phase / Korrektur
- Mastery/Fortschritt (`uebenLadeGruppenFortschritt` ist Admin-View über GANZE Gruppe — Filter eher im Frontend post-load)

**Pattern:** Einmal `useTestdatenSichtbar()`-Selector (liest `lpProfil.testdatenSichtbar`), dann jede Liste `filtereTestdatenWennDeaktiviert(records, testdatenSichtbar)` durchschickt.

**Plus:** Test-Badge in:
- Kurs-Karten
- Schüler-Zeilen
- Prüfungs-/Übungs-Karten in Listen

**Detail-Plan F.4:** nach F.3-Merge.

---

## Definition of Done (Master)

### F.1 DoD (diese Session):
- [ ] Konstanten + Regex + 5 Tests grün
- [ ] Filter-Utility + 9 Tests grün
- [ ] `LPProfil.testdatenSichtbar?` additiv ergänzt
- [ ] vitest baseline +14 = 1558 PASSED
- [ ] tsc clean, 5× lint clean, build grün
- [ ] 3 Commits auf `feature/cluster-f-testdaten`

### F.2 DoD (nächste Session):
- [ ] Apps-Script Endpoint + Seed-Funktion + Roll-Trigger + LockService
- [ ] Sessions-Schema-Drift-Fix (Bonus)
- [ ] Wire-Contract Audit nach lint-Update (apiAdminSeedTestdaten)
- [ ] Apps-Script lokal lint-clean (Apps-Script hat eigene Konventionen)
- [ ] User-Action: Apps-Script-Deploy ✓ + Initial-Seed ✓

### F.3 DoD:
- [ ] TestBadge + Hook + Tab + Modal + Service
- [ ] EinstellungenPanel rendert Testdaten-Tab via Tab-Registry
- [ ] Browser-E2E mit `wr.test`-Login (LP-Seite zeigt Tab, Toggle funktioniert)

### F.4 DoD:
- [ ] Filter integriert in 8-15 Frontend-Stores/Hooks/Services
- [ ] Test-Badge in 5+ Listen-Komponenten
- [ ] Browser-E2E komplett (Spec §10.4 Pfade 1-8)
- [ ] Merge zu main + Branch löschen

## Out-of-Scope (explizit aus Spec §8)

- Multi-Klassen-Prüfung (separate Spec)
- SuS-Test-Modus mit Toggle
- Visuelle Test-Badges auf einzelnen Fragen
- Performance-Last-Tests
