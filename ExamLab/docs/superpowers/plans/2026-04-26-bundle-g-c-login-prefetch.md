# Bundle G.c — LP-Login-Pre-Fetch + Logout-Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Beim LP-Login die Fragenbank fire-and-forget vorladen, beim Logout den Frontend-Cache aufräumen — schliesst die IDB-Persistenz-Lücke nach Logout (LP-Lösungen blieben für nächsten User auf geteilten Schul-Geräten).

**Architecture:** Nur zwei kleine Edits in `useAuthStore`. Keine neuen Hooks, kein Backend, keine Komponenten-Edits. `fragenbankStore.lade()` wird in `anmelden()` fire-and-forget aufgerufen; `fragenbankStore.reset()` (existiert bereits, ruft `clearFragenbankCache()` intern) wird in `abmelden()` aufgerufen.

**Tech Stack:** Zustand (state), React 19, TypeScript strict, Vitest.

**Spec:** [`docs/superpowers/specs/2026-04-26-bundle-g-c-login-prefetch-design.md`](../specs/2026-04-26-bundle-g-c-login-prefetch-design.md)

---

## File Structure

| Datei | Art | Verantwortung |
|---|---|---|
| `src/store/authStore.ts` | EDIT (~5 Z) | Pre-Fetch-Trigger in `anmelden()` (LP-Google-Login), Cleanup-Trigger in `abmelden()` |
| `src/tests/authStoreLoginPrefetch.test.ts` | NEU | 4 Vitest-Cases: Pre-Fetch, Non-Block, Fail-Silent, Logout-Reset |

**Nicht angetastet:**
- `src/store/fragenbankStore.ts` — existing `reset()` (Z. 403–414) wird unverändert wiederverwendet
- `anmeldenMitCode()` (SuS-Login) — laut Spec nicht im Scope
- `demoStarten()` — Demo-Modus hat keine Backend-Verbindung, Pre-Fetch wäre No-Op
- Apps-Script Backend — kein Code

---

## Task 0: Branch & Setup

- [ ] **Step 1: Feature-Branch erstellen**

Run:
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull
git checkout -b feature/bundle-g-c-login-prefetch
```

Expected: clean working tree on new branch off main.

- [ ] **Step 2: Baseline-Verify**

Run:
```bash
cd ExamLab && npx tsc -b && npx vitest run --reporter=basic 2>&1 | tail -5 && npm run build 2>&1 | tail -3
```

Expected: tsc clean, alle Tests grün (zur Sicherheit Test-Anzahl notieren — Plan rechnet mit Baseline 725 nach G.b-Merge), build erfolgreich.

---

## Task 1: Test-Datei schreiben (TDD: Tests vor Code)

**Files:**
- Create: `ExamLab/src/tests/authStoreLoginPrefetch.test.ts`

- [ ] **Step 1: Test-Datei anlegen**

Create `ExamLab/src/tests/authStoreLoginPrefetch.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks für die Module die der authStore (in)direkt nutzt — vor dem Import der Stores
const ladeMock = vi.fn(async () => {})
const resetMock = vi.fn()

vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: {
    getState: () => ({ lade: ladeMock, reset: resetMock }),
  },
}))

// Auth-Hilfen mocken — wir wollen nur die Pre-Fetch- und Cleanup-Trigger isoliert testen.
vi.mock('../utils/lpUtils', () => ({
  ladeUndCacheLPs: vi.fn(async () => []),
  rolleAusDomain: vi.fn(() => 'lp' as const),
}))

vi.mock('../utils/sessionStorage', () => ({
  saveSession: vi.fn(),
  restoreSession: vi.fn(() => null),
  clearSession: vi.fn(),
  saveDemoFlag: vi.fn(),
  restoreDemoFlag: vi.fn(() => false),
}))

vi.mock('../store/pruefungStore', () => ({
  usePruefungStore: {
    getState: () => ({ zuruecksetzen: vi.fn() }),
  },
  resetPruefungState: vi.fn(),
}))

vi.mock('../store/favoritenStore', () => ({
  useFavoritenStore: {
    getState: () => ({ favoriten: [] }),
    setState: vi.fn(),
  },
}))

// Browser-Navigation in jsdom blocken
const navSpy = vi.fn()
Object.defineProperty(window, 'location', {
  configurable: true,
  value: { href: '', assign: navSpy },
})

import { useAuthStore } from '../store/authStore'

const credential = {
  email: 'lp@gymhofwil.ch',
  name: 'Test LP',
  given_name: 'Test',
  family_name: 'LP',
  picture: '',
}

describe('Bundle G.c — authStore Login-Pre-Fetch + Logout-Cleanup', () => {
  beforeEach(() => {
    ladeMock.mockClear()
    resetMock.mockClear()
    // Auth-Store vor jedem Test in den initialen Zustand zurücksetzen
    useAuthStore.setState({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('anmelden() triggert fragenbankStore.lade mit user.email', async () => {
    await useAuthStore.getState().anmelden(credential)
    expect(ladeMock).toHaveBeenCalledTimes(1)
    expect(ladeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
  })

  it('anmelden() wartet NICHT auf Pre-Fetch — kehrt zurück bevor lade() resolved', async () => {
    let releaseLade: (() => void) | undefined
    ladeMock.mockImplementationOnce(() => new Promise<void>((resolve) => { releaseLade = resolve }))

    const anmeldenPromise = useAuthStore.getState().anmelden(credential)
    // anmelden ist async — wartet auf ladeUndCacheLPs (mock returnt sofort), aber NICHT auf lade()
    await anmeldenPromise
    // anmelden ist zurück, lade() läuft noch
    expect(ladeMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user?.email).toBe('lp@gymhofwil.ch')

    // Aufräumen
    releaseLade?.()
  })

  it('anmelden() wirft NICHT wenn lade() rejected (fail-silent)', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ladeMock.mockRejectedValueOnce(new Error('Backend down'))

    await expect(useAuthStore.getState().anmelden(credential)).resolves.toBeUndefined()
    // Pre-Fetch ist fire-and-forget — der Reject-Handler läuft async; einmal ticken
    await new Promise<void>((r) => setTimeout(r, 0))
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('abmelden() ruft fragenbankStore.reset auf', () => {
    useAuthStore.setState({ user: { email: 'lp@gymhofwil.ch', name: 'Test', vorname: 'T', nachname: 'L', rolle: 'lp' }, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
    useAuthStore.getState().abmelden()
    expect(resetMock).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Tests laufen lassen — alle 4 sollen failen**

Run:
```bash
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts 2>&1 | tail -15
```

Expected: 4 Failures. Test 1 (`lade triggert mit email`) failt mit "expected 1 calls, got 0". Test 2 (`wartet nicht`) failt analog. Test 3 (fail-silent): console.warn wird nicht aufgerufen (Pre-Fetch existiert noch nicht). Test 4 (reset): `expected 1, got 0`.

Wenn die Tests stattdessen mit Module-Mock-Errors crashen (z.B. weil Test-Imports vor den vi.mock-Calls geladen werden): die `vi.mock`-Reihenfolge im Test prüfen — Mocks müssen vor jeglichem Imports der getesteten Module stehen. Das Pattern oben sollte funktionieren, aber mit Vitest hoist-Verhalten ggf. anpassen.

- [ ] **Step 3: Commit der Test-Datei**

```bash
git add ExamLab/src/tests/authStoreLoginPrefetch.test.ts
git commit -m "ExamLab G.c: Test-Datei (failing) — Login-Pre-Fetch + Logout-Reset"
```

---

## Task 2: authStore.ts editieren — Pre-Fetch in anmelden()

**Files:**
- Modify: `ExamLab/src/store/authStore.ts`

- [ ] **Step 1: Import ergänzen**

Im File `ExamLab/src/store/authStore.ts` oben bei den anderen Store-Imports (vor `useAuthStore`-Definition, ungefähr Zeile 10–20 je nach existierendem Import-Block):

```ts
import { useFragenbankStore } from './fragenbankStore'
```

Falls die existierenden Imports alphabetisch sortiert sind, einreihen. Falls nicht, ans Ende des Store-Imports-Blocks.

- [ ] **Step 2: Pre-Fetch-Aufruf in anmelden() einfügen**

In der Funktion `anmelden(credential: GoogleCredential)` direkt **nach** der `set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })`-Zeile (aktuell ca. Zeile 132), aber **innerhalb** des `try`-Blocks und **vor** dem `finally`:

```ts
      // Bundle G.c — Fragenbank im Hintergrund vorladen, damit FragenBrowser instant rendert
      void useFragenbankStore.getState().lade(credential.email).catch((e) => {
        console.warn('[G.c] Fragenbank-Pre-Fetch fehlgeschlagen (silent):', e)
      })
```

**Wichtig:**
- Genau diese Stelle, NICHT in `anmeldenMitCode()` (SuS-Login, laut Spec ausgeklammert), NICHT in `demoStarten()` (Demo-Modus).
- `void`-Operator vor dem Aufruf signalisiert TypeScript, dass das Promise absichtlich nicht awaitet wird. Linting-clean.
- `.catch(...)` ist Pflicht — ohne den Handler würde ein Reject zu unhandled rejection laufen.

- [ ] **Step 3: tsc + vitest auf den ersten Test laufen lassen**

Run:
```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```

Expected: tsc clean.

```bash
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts -t "lade mit user.email" 2>&1 | tail -10
```

Expected: Test 1 (`anmelden() triggert fragenbankStore.lade mit user.email`) PASSED.

- [ ] **Step 4: Tests 2 + 3 laufen — sollten ebenfalls passen**

Run:
```bash
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts -t "wartet NICHT" 2>&1 | tail -10
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts -t "fail-silent" 2>&1 | tail -10
```

Expected: Tests 2 + 3 PASSED.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/store/authStore.ts
git commit -m "ExamLab G.c: Pre-Fetch in anmelden() — fragenbankStore.lade fire-and-forget"
```

---

## Task 3: authStore.ts editieren — reset() in abmelden()

**Files:**
- Modify: `ExamLab/src/store/authStore.ts`

- [ ] **Step 1: reset()-Aufruf in abmelden() einfügen**

In der Funktion `abmelden()` **vor** dem `clearSession()`-Aufruf (aktuell Zeile 186) — also als allererster Schritt der Cleanup-Sequenz:

```ts
  abmelden: () => {
    // Bundle G.c — Frontend-Cache + IDB-Cache leeren bevor User wechselt
    useFragenbankStore.getState().reset()
    clearSession()
    resetPruefungState()
    set({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
    // Hart auf /login navigieren — verhindert dass alte Pfade wie /sus/ueben hängen
    // …
```

**Wichtig:**
- `reset()` ist synchron im Memory-Teil, ruft `clearFragenbankCache()` intern fire-and-forget. Kein `await` nötig, kein await sollte hier stehen — `abmelden()` ist als sync deklariert und der Logout darf nicht blockieren.
- Vor `clearSession()` aufrufen, damit der Memory-State sofort leer ist und der danach folgende `set({ user: null })` keine Race mit dem Pre-Fetch des vorherigen Users erzeugt.

- [ ] **Step 2: tsc + vitest Test 4**

Run:
```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts -t "reset auf" 2>&1 | tail -10
```

Expected: tsc clean, Test 4 (`abmelden() ruft fragenbankStore.reset auf`) PASSED.

- [ ] **Step 3: Volle Suite laufen lassen**

Run:
```bash
cd ExamLab && npx vitest run 2>&1 | tail -5 && npx tsc -b 2>&1 | tail -3 && npm run build 2>&1 | tail -3
```

Expected: Alle Tests grün (Baseline 725 + 4 neue = 729), tsc clean, build OK.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/store/authStore.ts
git commit -m "ExamLab G.c: reset() in abmelden() — Logout-Cleanup für Frontend + IDB"
```

---

## Task 4: Browser-Smoke-Test auf staging

**Files:** keine

- [ ] **Step 1: Test-Plan schreiben**

Schreibe in den Chat (kein File):

```
## Test-Plan G.c — Browser-E2E

### Trigger 1 — Login-Pre-Fetch (LP-Login wr.test@gymhofwil.ch)
1. Auf staging-URL einloggen mit Google
2. Nach erfolgreichem Login: SOFORT (innerhalb 1 s) auf "Fragensammlung" klicken
3. Erwartung: FragenBrowser rendert ohne sichtbaren Spinner > 200 ms
4. DevTools Network-Tab: ladeFragenbank-Calls sollten parallel zum Login starten

### Trigger 2 — Logout-Cleanup
1. LP eingeloggt, FragenBrowser einmal geöffnet (füllt IDB)
2. DevTools → Application → IndexedDB → examlab-fragenbank-cache → 3 Stores haben Daten
3. "Abmelden" klicken
4. Auf /login zurückgeleitet
5. DevTools → IndexedDB → examlab-fragenbank-cache → 3 Stores sind leer (summaries, details, meta — jeweils 0 Einträge)

### Regression-Checks
- LP Re-Login danach: FragenBrowser lädt wieder Daten (kein stale-cache)
- SuS-Login: lädt normal, kein Crash, kein Memory-Leak von LP-Lösungen sichtbar in DevTools→Application→IndexedDB
- Demo-Modus: Login als Demo-LP über `demoStarten()` läuft normal — Pre-Fetch wird NICHT ausgelöst (anderer Code-Pfad als `anmelden()`), kein Crash

### Security-Check
- IDB nach Logout wirklich leer (alle 3 Stores)
- Memory: useFragenbankStore.getState().detailCache nach Logout = {} (über Browser-Console abfragen)
```

- [ ] **Step 2: Branch deployen**

Run vor Force-Push: `git log preview ^HEAD --oneline` prüfen ob preview eindeutige Commits hat (Memory-Regel `feedback_preview_forcepush.md`).

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push -u origin feature/bundle-g-c-login-prefetch
git push origin feature/bundle-g-c-login-prefetch:preview --force-with-lease
```

Auf staging-Deploy warten (~2 min). Bei Hänger: leerer Commit + Re-Push (Pattern aus G.b-Session).

- [ ] **Step 3: Tab-Gruppe öffnen + E2E**

User öffnet zwei Tabs:
- Tab A: LP-Login `wr.test@gymhofwil.ch`
- Tab B: SuS-Login `wr.test@stud.gymhofwil.ch` (für Regression-Check)

Claude wartet auf User-Bestätigung "kannst loslegen", dann arbeitet den Test-Plan ab.

- [ ] **Step 4: Ergebnisse dokumentieren**

In den Chat:
- Trigger 1: ✓ / ✗ mit konkreter Latenz
- Trigger 2: ✓ / ✗ mit IDB-Inhalt vor/nach
- Regression: ✓ / ✗
- Security: ✓ / ✗

---

## Task 5: Merge nach `main`

**Voraussetzungen (Hard-Stop nach `regression-prevention.md`):**

- [ ] Browser-Test durchgeführt (Task 4) mit Befund "alle Trigger funktionieren"
- [ ] Security-Check durchgeführt (Task 4 letzter Substep)
- [ ] User hat **explizit "Merge OK"** geschrieben
- [ ] HANDOFF.md aktualisiert (siehe Step unten)

- [ ] **Step 1: HANDOFF.md aktualisieren**

In `ExamLab/HANDOFF.md` die "Aktueller Stand"-Sektion fortschreiben:
- S149 (DATUM) — Bundle G.c auf `main`
- 2 kleine authStore-Edits + 4 neue Tests
- Sicherheits-Lücke geschlossen
- Mess-Wert aus Browser-E2E (FragenBrowser-Latenz nach Login)
- Next: G.d (Lobby-Live-Pre-Warm) oder G.e (Virtualisierung) oder G.f (Skeleton) — User-Priorisierung offen

```bash
git add ExamLab/HANDOFF.md
git commit -m "ExamLab G.c: HANDOFF.md fuer S149"
```

- [ ] **Step 2: Merge**

```bash
git checkout main && git pull
git merge --no-ff feature/bundle-g-c-login-prefetch -m "ExamLab G.c: LP-Login-Pre-Fetch + Logout-Cleanup"
git push origin main
```

- [ ] **Step 3: Branch aufräumen**

```bash
git branch -d feature/bundle-g-c-login-prefetch
git push origin --delete feature/bundle-g-c-login-prefetch
```

(Falls Branch lokale Commits hat die nicht in origin/feature sind: `git branch -D` mit Begründung. Sollte aber sauber durchlaufen wenn alle Commits gepusht wurden.)

- [ ] **Step 4: Memory-Update**

Neue Datei `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_s149_bundle_gc.md` anlegen mit Eckdaten (Stack analog zu `project_s148_bundle_gb.md`). Index-Eintrag in `MEMORY.md` ergänzen, eine Zeile, < 200 chars.

---

## Erfolgskriterien

- 4 neue vitest grün, Baseline grün → 729 Tests total
- `tsc -b` clean
- `npm run build` erfolgreich
- E2E auf staging:
  - FragenBrowser nach LP-Login instant (< 200 ms Spinner)
  - IDB nach Logout leer (alle 3 Stores)
- Keine Regression in den 5 kritischen Pfaden aus `regression-prevention.md`
- Branch sauber gemergt, HANDOFF + Memory aktualisiert

## Anti-Patterns vermeiden

- **Kein `await`** auf den Pre-Fetch in `anmelden()` — würde Login-UX blockieren. Plan setzt ausdrücklich auf fire-and-forget mit `void` + `.catch`.
- **Kein zusätzliches `clearFragenbankCache()`** im `abmelden()` — `reset()` macht das schon. Doppel-Aufruf wäre redundant.
- **Kein Pre-Fetch in `anmeldenMitCode()`** (SuS-Login). Spec hat das explizit ausgeklammert; SuS profitiert nicht messbar.
- **Kein Pre-Fetch in `demoStarten()`**. Demo-Modus hat keine Backend-Verbindung.
- **Keine Erweiterung von `lade()`** mit Authentifizierungs-Status-Check (Open Question aus Spec). Edge-Case ist akzeptiertes Restrisiko.
- **Keine breite Refactoring-Runde** im authStore. Wenn der Implementer toten Code oder Cleanup-Möglichkeiten sieht: separat dokumentieren, NICHT inline mit G.c mergen.
