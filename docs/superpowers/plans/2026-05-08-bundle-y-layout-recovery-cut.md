# Bundle Y — Layout.tsx Recovery-Cut Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ExamLab/src/components/Layout.tsx` (570 Z., Hotspot) auf ≤ 500 Z. zerlegen (erwartet ~483) ohne Verhaltensänderung. Hotspot-Bilanz Files >500 Z. (ohne `data/`+`test/`): **8 → 7**. Coverage-Lücke: erstmals 7 Vitest-Tests für die Recovery-State-Maschine.

**Architecture:** Custom Hook `usePruefungsRecovery` in `ExamLab/src/hooks/` kapselt State-Maschine + API-Call (Pure-State + Side-Effects), Sub-Komponente `PruefungsRecoveryStatus` in `ExamLab/src/components/` rendert Loading/Failed-Branches mit byte-identischen Tailwind-Klassen + Reset-Aktion. localStorage-Migration-IIFE Z. 32-43 wird ersatzlos gelöscht (M3, 2 Wochen alt, akzeptierter Komfort-Reset). Side-Effect-Aufteilung Bundle-W.b: Hook = State+API, Komponente = `window.confirm` + `usePruefungStore.reset()` + `window.location.reload()`.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest + @testing-library/react.

**Spec:** [`docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md`](../specs/2026-05-08-bundle-y-layout-recovery-cut-design.md) (rev2, Reviewer ✅ APPROVED).

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree (zu erstellen in Phase 0):** `.worktrees/bundle-y-layout-recovery`

**Branch:** `bundle-y/layout-recovery-cut` (Spec rev2 bereits commited: `6b14271 Bundle Y Spec rev2`, `570cef7 Bundle Y Spec`).

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output direkt prüfen (Memory-Lehre `feedback_tsc_b_exit_misleading`).

**Vitest-Baseline:** **1480 passed | 4 todo | 1 skipped** (post-Bundle-X). Drift-Erwartung **+7** in Phase 1 (oder +8 falls Timeout-Test stabil).

**`wc -l Layout.tsx` Tracking:**
- P0 Baseline: 570 Z.
- P3 Ende: ≤ 500 Z. (Ziel ~483, ~17 Z. Margin)

---

## File Map

### Neue Files

| Datei | Größe ca. | Verantwortung |
|---|---:|---|
| `ExamLab/src/hooks/usePruefungsRecovery.ts` | ~50 Z. | Pure-State-Hook + API-Call. Returns `{ status: 'idle' \| 'loading' \| 'failed' }`. Kapselt: URL-Parsing, Recovery-Trigger-Bedingung, Timeout-Handling, `apiService.ladePruefung`-Aufruf, Store-Mutation via `getState()`. |
| `ExamLab/src/hooks/usePruefungsRecovery.test.ts` | ~150 Z. | 7 Vitest-Cases mit `vi.mock` für `apiService`/`pruefungStore`/`authStore`/`fragenResolver` + URL-Mock. |
| `ExamLab/src/components/PruefungsRecoveryStatus.tsx` | ~40 Z. | Pure-Render-Komponente mit `status: 'loading' \| 'failed'`-Prop. Internalisiert beide Branches inkl. Reset-Button-Side-Effect. |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/components/Layout.tsx` | 570 Z. | ≤ 500 Z. (Ziel ~483) | 5 Imports raus (`useRef` if unused/nope `useEffect` if unused/nope `useMemo` if unused, `apiService`, `resolveFragenFuerPruefung`), 2 Imports rein (`usePruefungsRecovery`, `PruefungsRecoveryStatus`). Z. 32-43 (localStorage-Migration) gelöscht. Z. 176-220 (Recovery-State+Effect, ~45 Z.) → 1 Hook-Aufruf-Zeile. Z. 222-255 (Recovery-Render, ~34 Z.) → 3 Zeilen `<PruefungsRecoveryStatus />`-Block. |

### Reihenfolge (Risiko-aufsteigend)

1. **Phase 0**: Worktree + Branch verifizieren + Vitest-Baseline + Pre-Cut-Grep + wc-l Baseline
2. **Phase 1**: `usePruefungsRecovery.ts` + Test schreiben (TDD), Per-Phase-Reviewer
3. **Phase 2**: `PruefungsRecoveryStatus.tsx` Komponente schreiben, Per-Phase-Reviewer
4. **Phase 3**: `Layout.tsx` Component-Edit (Migration löschen + Recovery-Replacement), Per-Phase-Reviewer
5. **Phase 4**: Final Code-Reviewer + Hotspot-Bilanz + Lint/Build-Gates
6. **Phase 5**: HANDOFF + Memory + Merge zu main + Cleanup

---

## Phase 0: Worktree + Baseline

### Task 0.1: Worktree erstellen + Baseline verifizieren

- [ ] **Step 0: Voraussetzung — main im main-Repo auschecken**

Der Branch `bundle-y/layout-recovery-cut` ist aktuell im main-Repo ausgecheckt (Spec+Plan wurden direkt dort committed). `git worktree add` würde sonst mit `fatal: branch is already checked out` fehlschlagen.

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git status  # Working tree clean prüfen
git checkout main
git log --oneline -1
```

Expected: `Switched to branch 'main'` + HEAD `10c1b91 Merge Bundle X` (oder neuer falls Drift). Falls `git status` Untracked/Modified zeigt: STOP, vorher abklären.

- [ ] **Step 1: Worktree vom Bundle-Y-Branch erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree add .worktrees/bundle-y-layout-recovery bundle-y/layout-recovery-cut
```

Expected: `Preparing worktree (checking out 'bundle-y/layout-recovery-cut')` + HEAD: `fcdb570 Bundle Y Plan` (Plan-Commit) bzw. `6b14271 Bundle Y Spec rev2`.

- [ ] **Step 2: cd in Worktree und Status prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
git status
git log --oneline -5
```

Expected: `On branch bundle-y/layout-recovery-cut`, working tree clean. Commits: `6b14271 Bundle Y Spec rev2`, `570cef7 Bundle Y Spec`, `10c1b91 Merge Bundle X`, `2e17d37 Bundle X: HANDOFF-Eintrag`, `23c8308 Bundle X Phase 2`.

- [ ] **Step 3: Pre-Cut-Grep — `pruefungIdAusUrl` Use-Sites verifizieren**

```bash
grep -n "pruefungIdAusUrl" ExamLab/src/components/Layout.tsx
```

Expected: Treffer in Z. 177 (Definition), 186 (Bedingung), 198 (API-Call), 220 (Effect-Dep). **NUR** in Recovery-useEffect — Variable wandert sicher mit ins Hook. Falls Treffer ausserhalb Z. 176-220: STOP, Plan anpassen.

- [ ] **Step 4: Pre-Cut-Grep — Caller-Verifikation Layout-Import**

```bash
grep -rn "from.*Layout" ExamLab/src --include="*.tsx" --include="*.ts" | grep -v "Layout.tsx" | grep -v "node_modules"
```

Expected: Genau 2 Caller mit Default-Import:
- `ExamLab/src/App.tsx:17` → `import Layout from './components/Layout.tsx'`
- `ExamLab/src/components/lp/vorbereitung/SuSVorschau.tsx:7` → `import Layout from '../../Layout.tsx'`

Plus 2 Test-File-Strings (kein Code-Import) und ein paar JSX-Use-Sites — diese bleiben unverändert weil props-less.

- [ ] **Step 5: Pre-Cut-Grep — `apiService` und `resolveFragenFuerPruefung` Use-Sites in Layout.tsx**

```bash
grep -n "apiService\|resolveFragenFuerPruefung" ExamLab/src/components/Layout.tsx
```

Expected: Treffer in Z. 5 (Import `apiService`), Z. 6 (Import `resolveFragenFuerPruefung`), Z. 198 (Aufruf `apiService.ladePruefung`), Z. 202 (Aufruf `resolveFragenFuerPruefung`). **Nur in Recovery-Block** — beide Imports wandern mit ins Hook und können in Layout.tsx entfernt werden.

- [ ] **Step 6: Pre-Cut-Grep — `useEffect`/`useRef`/`useMemo` Use-Sites in Layout.tsx**

```bash
grep -cn "useEffect\|useRef\|useMemo" ExamLab/src/components/Layout.tsx
```

Expected: mehrere Treffer. Verifiziere via `grep -n`:
- `useMemo`: Z. 1 (Import) + Z. 67 (`naechsteFragePdfUrls`) + Z. 177 (`pruefungIdAusUrl` — wandert mit). **Nach Cut bleibt 1 useMemo-Aufruf** → Import bleibt.
- `useEffect`: Z. 1 (Import) + Z. 120 (Verstoss-Overlay) + Z. 129 (Vollbild-Exit) + Z. 183 (Recovery — wandert mit). **Nach Cut bleiben 2 useEffect-Aufrufe** → Import bleibt.
- `useRef`: Z. 1 (Import) + Z. 117 (vorherigerZaehler) + Z. 181 (recoveryAttempted — wandert mit). **Nach Cut bleibt 1 useRef-Aufruf** → Import bleibt.

**→ Alle 3 Hook-Imports bleiben. Keine Import-Removals nötig ausser `apiService` + `resolveFragenFuerPruefung`.**

- [ ] **Step 7: npm Setup (falls Worktree noch keine deps hat)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
npm run setup:shared 2>&1 | tail -3
cd ExamLab && npm install 2>&1 | tail -3
```

Expected: `found 0 vulnerabilities` (oder akzeptable Warnings). Beide installs idempotent.

- [ ] **Step 8: Vitest-Baseline verifizieren**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery/ExamLab"
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1480 passed | 4 todo | 1 skipped (1485)`. Falls Drift: STOP, untersuchen.

- [ ] **Step 9: Source-Datei Baseline-wc**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
wc -l ExamLab/src/components/Layout.tsx
```

Expected: `570 ExamLab/src/components/Layout.tsx`.

- [ ] **Step 10: apiService.ladePruefung-Signatur prüfen (Test-Mock-Korrektheit)**

```bash
grep -A 8 "ladePruefung\b" ExamLab/src/services/apiService.ts | head -20
```

Expected: Return-Shape `Promise<{ config: PruefungsConfig; fragen: Frage[] } | null>` (oder ähnlich). Test-Mock muss `result.config` mit optional `durchfuehrungId` und `result.fragen: Frage[]` liefern. **Falls Shape abweicht: Mock-Shape im Test anpassen.**

- [ ] **Step 11: pruefungStore-Methoden-Signaturen prüfen**

```bash
grep -E "setConfigUndFragen|setDurchfuehrungId|^[[:space:]]+reset" ExamLab/src/store/pruefungStore.ts | head -10
```

Expected: 3 Method-Signaturen verifiziert. `setConfigUndFragen(config, navigationsFragen, alleFragen)` 3-arg. `setDurchfuehrungId(id)` 1-arg. `reset()` 0-arg.

- [ ] **Step 12: Plan-Commit auf Branch**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
git add docs/superpowers/plans/2026-05-08-bundle-y-layout-recovery-cut.md
git commit -m "$(cat <<'EOF'
Bundle Y Plan: Layout.tsx Recovery-Cut Implementation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: Plan-Commit auf Branch (rein-Doku-Commit).

---

## Phase 1: `usePruefungsRecovery.ts` extrahieren (TDD)

**Ziel der Phase:** Pure Hook + 7 Vitest-Coverage. Layout.tsx noch unverändert; Hook steht standalone testbar.

### Task 1.1: Test-Datei schreiben (failing)

**Files:**
- Create: `ExamLab/src/hooks/usePruefungsRecovery.test.ts`

- [ ] **Step 1: Test-Datei schreiben**

**Pattern: Closure-Ref-Pattern** (analog `useFragenAutoSave.test.tsx`). Module-Level mutable Refs (`configRef`, `fragenRef`, `userRef`) werden im `beforeEach` zurückgesetzt, der Mock-Factory schliesst über sie. **Kein** `vi.resetModules()` + dynamic-import (fragil). API + fragenResolver bleiben simple `vi.fn`-Mocks.

```typescript
// ExamLab/src/hooks/usePruefungsRecovery.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// === Module-Level mutable State (geschlossen in vi.mock-Factories) ===
const ladePruefungMock = vi.fn()
const setConfigUndFragenMock = vi.fn()
const setDurchfuehrungIdMock = vi.fn()
const resolveFragenMock = vi.fn()

const configRef: { current: unknown } = { current: null }
const fragenRef: { current: unknown[] } = { current: [] }
const userRef: { current: { email: string } | null } = { current: { email: 'sus@test' } }

vi.mock('../services/apiService', () => ({
  apiService: {
    ladePruefung: (...args: unknown[]) => ladePruefungMock(...args),
  },
}))

vi.mock('../store/pruefungStore', () => ({
  usePruefungStore: Object.assign(
    (selector: (s: unknown) => unknown) => selector({
      config: configRef.current,
      fragen: fragenRef.current,
    }),
    {
      getState: () => ({
        setConfigUndFragen: setConfigUndFragenMock,
        setDurchfuehrungId: setDurchfuehrungIdMock,
      }),
    },
  ),
}))

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user: userRef.current }),
}))

vi.mock('../utils/fragenResolver', () => ({
  resolveFragenFuerPruefung: (...args: unknown[]) => resolveFragenMock(...args),
}))

import { usePruefungsRecovery } from './usePruefungsRecovery'

// Helper to set window.location.search per test
const setUrl = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: { search },
    writable: true,
    configurable: true,
  })
}

beforeEach(() => {
  ladePruefungMock.mockReset()
  setConfigUndFragenMock.mockReset()
  setDurchfuehrungIdMock.mockReset()
  resolveFragenMock.mockReset().mockReturnValue({
    navigationsFragen: [{ id: 'q1' }],
    alleFragen: [{ id: 'q1' }],
  })
  configRef.current = null
  fragenRef.current = []
  userRef.current = { email: 'sus@test' }
  setUrl('?id=p1')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePruefungsRecovery', () => {
  it('idle: config + fragen vorhanden → kein API-Call, kein status-Wechsel', () => {
    configRef.current = { id: 'p1' }
    fragenRef.current = [{ id: 'q1' }]
    const { result } = renderHook(() => usePruefungsRecovery())
    expect(result.current.status).toBe('idle')
    expect(ladePruefungMock).not.toHaveBeenCalled()
  })

  it('failed direkt: kein url-id', async () => {
    setUrl('')  // kein ?id=
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(ladePruefungMock).not.toHaveBeenCalled()
  })

  it('failed direkt: kein user', async () => {
    userRef.current = null
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(ladePruefungMock).not.toHaveBeenCalled()
  })

  it('success: setConfigUndFragen + setDurchfuehrungId aufgerufen', async () => {
    ladePruefungMock.mockResolvedValue({
      config: { id: 'p1', durchfuehrungId: 'd1' },
      fragen: [{ id: 'q1' }],
    })
    renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(setConfigUndFragenMock).toHaveBeenCalled())
    expect(setConfigUndFragenMock).toHaveBeenCalledWith(
      { id: 'p1', durchfuehrungId: 'd1' },
      [{ id: 'q1' }],
      [{ id: 'q1' }],
    )
    expect(setDurchfuehrungIdMock).toHaveBeenCalledWith('d1')
    expect(resolveFragenMock).toHaveBeenCalledWith(
      { id: 'p1', durchfuehrungId: 'd1' },
      [{ id: 'q1' }],
    )
  })

  it('success ohne durchfuehrungId: setDurchfuehrungId NICHT aufgerufen', async () => {
    ladePruefungMock.mockResolvedValue({
      config: { id: 'p1' },  // keine durchfuehrungId
      fragen: [{ id: 'q1' }],
    })
    renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(setConfigUndFragenMock).toHaveBeenCalled())
    expect(setDurchfuehrungIdMock).not.toHaveBeenCalled()
  })

  it('failed: api-result null → status failed', async () => {
    ladePruefungMock.mockResolvedValue(null)
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(setConfigUndFragenMock).not.toHaveBeenCalled()
  })

  it('failed: api-throws → status failed + console.error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ladePruefungMock.mockRejectedValue(new Error('netzwerk'))
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Layout] Recovery fehlgeschlagen:',
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run test → expected FAIL (Modul existiert noch nicht)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery/ExamLab"
npx vitest run src/hooks/usePruefungsRecovery.test.ts 2>&1 | tail -10
```

Expected: FAIL `Cannot find module './usePruefungsRecovery'`.

### Task 1.2: Hook-Implementierung schreiben

**Files:**
- Create: `ExamLab/src/hooks/usePruefungsRecovery.ts`

- [ ] **Step 1: Hook schreiben**

```typescript
// ExamLab/src/hooks/usePruefungsRecovery.ts
import { useState, useEffect, useRef, useMemo } from 'react'
import { usePruefungStore } from '../store/pruefungStore'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/apiService'
import { resolveFragenFuerPruefung } from '../utils/fragenResolver'

export type PruefungsRecoveryStatus = 'idle' | 'loading' | 'failed'

export interface UsePruefungsRecoveryResult {
  status: PruefungsRecoveryStatus
}

const RECOVERY_TIMEOUT_MS = 10_000

/**
 * Recovery-State-Maschine für SuS-Prüfung: lädt config+fragen nach Reload nach,
 * wenn Store leer ist und URL+User die Wiederherstellung erlauben.
 *
 * Side-Effect-Aufteilung (Bundle-W.b-Pattern): Hook macht State + API + Store-Mutation.
 * Reset-Aktion (window.confirm + reset + reload) bleibt im Konsumenten.
 */
export function usePruefungsRecovery(): UsePruefungsRecoveryResult {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const user = useAuthStore((s) => s.user)

  const pruefungIdAusUrl = useMemo(
    () => new URLSearchParams(window.location.search).get('id'),
    [],
  )

  const [status, setStatus] = useState<PruefungsRecoveryStatus>('idle')
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    if (config && fragen.length > 0) return
    if (recoveryAttempted.current) return
    if (!pruefungIdAusUrl || !user?.email) {
      setStatus('failed')
      return
    }

    recoveryAttempted.current = true
    setStatus('loading')

    const timeout = setTimeout(() => {
      setStatus('failed')
    }, RECOVERY_TIMEOUT_MS)

    apiService.ladePruefung(pruefungIdAusUrl, user.email)
      .then((result) => {
        clearTimeout(timeout)
        if (result) {
          const { navigationsFragen, alleFragen: resolvedAlle } =
            resolveFragenFuerPruefung(result.config, result.fragen)
          usePruefungStore.getState().setConfigUndFragen(
            result.config,
            navigationsFragen,
            resolvedAlle,
          )
          if (result.config.durchfuehrungId) {
            usePruefungStore.getState().setDurchfuehrungId(result.config.durchfuehrungId)
          }
          console.log('[Layout] Recovery erfolgreich — config+fragen wiederhergestellt')
        } else {
          setStatus('failed')
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        console.error('[Layout] Recovery fehlgeschlagen:', err)
        setStatus('failed')
      })

    return () => clearTimeout(timeout)
  }, [config, fragen, pruefungIdAusUrl, user])

  return { status }
}
```

- [ ] **Step 2: Run tests → expected PASS (alle 7 grün)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery/ExamLab"
npx vitest run src/hooks/usePruefungsRecovery.test.ts 2>&1 | tail -15
```

Expected: `Tests  7 passed (7)`. Falls Mock-Setup-Fragility (z.B. doMock vs. mock-Reihenfolge): vergleiche mit `useFragenAutoSave.test.tsx` Pattern und passe an.

- [ ] **Step 3: Vollständigen Vitest-Run für Drift-Check**

```bash
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1487 passed | 4 todo | 1 skipped (1492)`. Drift = +7. Falls bestehende Tests rot: STOP, kein Hook-Code im Source-Tree der bestehende Tests beeinflusst.

- [ ] **Step 4: tsc -b clean**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery/ExamLab"
npx tsc -b 2>&1 | tee /tmp/tsc-bundle-y-p1.log
```

Expected: leerer Output (ausser `tee`-Echo-Zeile). Falls Fehler: korrigiere im Hook + Test.

- [ ] **Step 5: Commit Phase 1**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
git add ExamLab/src/hooks/usePruefungsRecovery.ts ExamLab/src/hooks/usePruefungsRecovery.test.ts
git commit -m "$(cat <<'EOF'
Bundle Y Phase 1: usePruefungsRecovery + 7 Vitest

Pure-State-Hook + API-Call für Prüfungs-Recovery nach Reload.
Side-Effect-Aufteilung: Reset-Aktion bleibt im Konsumenten.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 1.3: Per-Phase-Reviewer (Spec-Compliance + Code-Quality)

- [ ] **Step 1: Spec-Compliance-Reviewer**

Dispatche `general-purpose`-Agent:

```
Verifiziere dass `ExamLab/src/hooks/usePruefungsRecovery.ts` (Phase 1 von Bundle Y) byte-equivalent zur Recovery-Logik in `ExamLab/src/components/Layout.tsx` Z. 176-220 ist und das Spec § 2 entspricht.

Spec: docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md
Source-Region: ExamLab/src/components/Layout.tsx Z. 176-220

Prüfe spezifisch:
1. URL-Parsing identisch (useMemo + URLSearchParams + 'id')
2. Trigger-Bedingungen identisch (config?, fragen.length > 0, recoveryAttempted, pruefungIdAusUrl, user?.email)
3. Timeout-Handling identisch (10s, setTimeout, clearTimeout in then/catch + cleanup-Return)
4. apiService.ladePruefung-Aufruf-Signatur identisch
5. Success-Pfad: resolveFragenFuerPruefung-Aufruf, setConfigUndFragen-Argumente, durchfuehrungId-Branch, console.log-Text
6. Failure-Pfad: console.error-Text, setStatus('failed')
7. recoveryAttempted-Guard ordering (set true VOR setStatus('loading'))

Issues melden, sonst APPROVED.
```

- [ ] **Step 2: Code-Quality-Reviewer (vorzugsweise `superpowers:code-reviewer`)**

Dispatche `superpowers:code-reviewer`-Agent:

```
Review der Phase 1 von Bundle Y: usePruefungsRecovery.ts + usePruefungsRecovery.test.ts.

Branch: bundle-y/layout-recovery-cut
Files:
- ExamLab/src/hooks/usePruefungsRecovery.ts
- ExamLab/src/hooks/usePruefungsRecovery.test.ts

Spec: docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md
Plan: docs/superpowers/plans/2026-05-08-bundle-y-layout-recovery-cut.md

Prüfe Code-Quality (DRY, YAGNI, klare Boundaries, idiomatisches React 19, Test-Hygiene). Achte auf:
- vi.resetModules + dynamic-import-Pattern für Mock-State-Switching: ist das nötig oder gibt es einfachere Alternativen?
- Kann der Hook Tests mit Real-Store-setState (Pattern useDirtyTracker) statt vi.mock laufen? Trade-off bewerten.
- Async-Patterns in Tests (waitFor) korrekt eingesetzt?
- Hook-Body kompakt + lesbar? Side-Effect-Aufteilung sauber?

Issues melden, sonst APPROVED.
```

Falls Issues: fix + commit, dann re-dispatch.

---

## Phase 2: `PruefungsRecoveryStatus.tsx` extrahieren

**Ziel der Phase:** Render-Sub-Komponente mit Status-Switch + Reset-Action. Layout.tsx noch unverändert.

### Task 2.1: Komponente schreiben

**Files:**
- Create: `ExamLab/src/components/PruefungsRecoveryStatus.tsx`

- [ ] **Step 1: Komponente schreiben**

```tsx
// ExamLab/src/components/PruefungsRecoveryStatus.tsx
import { usePruefungStore } from '../store/pruefungStore'

export interface PruefungsRecoveryStatusProps {
  status: 'loading' | 'failed'
}

/**
 * Render-Sub-Komponente für die Recovery-Loading/Failed-Branches in Layout.tsx.
 * Beim Failed-Branch: User kann via Bestätigungs-Dialog zum Start zurück
 * (löscht Fortschritt, lädt Seite neu).
 */
export default function PruefungsRecoveryStatus({ status }: PruefungsRecoveryStatusProps) {
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Sitzung wird wiederhergestellt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-2">Prüfungsdaten konnten nicht wiederhergestellt werden.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Ihre bisherigen Antworten gehen beim Zurücksetzen verloren.</p>
        <button
          onClick={() => {
            if (window.confirm('Alle bisherigen Antworten gehen verloren. Fortfahren?')) {
              usePruefungStore.getState().reset()
              window.location.reload()
            }
          }}
          className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Zurück zum Start
        </button>
      </div>
    </div>
  )
}
```

**Wichtig:** Tailwind-Klassen byte-identisch zu Layout.tsx Z. 226-253. **Vergleiche Strings** vor Commit:
- Loading-Wrapper: `min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900` ✓
- Spinner: `w-8 h-8 mx-auto mb-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin` ✓
- Loading-Text: `text-slate-500 dark:text-slate-400` ✓
- Failed-Text-1: `text-slate-500 dark:text-slate-400 mb-2` ✓
- Failed-Text-2: `text-xs text-slate-400 dark:text-slate-500 mb-4` ✓
- Failed-Button: `px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer` ✓
- Confirm-Text: `'Alle bisherigen Antworten gehen verloren. Fortfahren?'` ✓
- Button-Label: `Zurück zum Start` ✓

- [ ] **Step 2: tsc -b clean**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery/ExamLab"
npx tsc -b 2>&1 | tee /tmp/tsc-bundle-y-p2.log
```

Expected: leerer Output (ausser `tee`-Echo-Zeile).

- [ ] **Step 3: Vitest unverändert (keine neuen Tests in P2, Drift = 0)**

```bash
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1487 passed` (= 1480 Baseline + 7 Phase 1).

- [ ] **Step 4: Commit Phase 2**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
git add ExamLab/src/components/PruefungsRecoveryStatus.tsx
git commit -m "$(cat <<'EOF'
Bundle Y Phase 2: PruefungsRecoveryStatus-Komponente

Render-Sub-Komponente mit Status-Switch + Reset-Action.
Tailwind-Klassen byte-identisch zur Layout.tsx-Source-Region.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 2.2: Per-Phase-Reviewer

- [ ] **Step 1: Spec-Compliance-Reviewer**

Dispatche `general-purpose`-Agent:

```
Verifiziere dass `ExamLab/src/components/PruefungsRecoveryStatus.tsx` (Phase 2 von Bundle Y) byte-equivalent zur Recovery-Render-Logik in `ExamLab/src/components/Layout.tsx` Z. 222-255 ist und das Spec § 2 entspricht.

Spec: docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md
Source-Region: ExamLab/src/components/Layout.tsx Z. 222-255

Prüfe spezifisch:
1. Loading-Branch (alter Z. 224 `if (recoveryStatus !== 'failed')`): identische Wrapper-Klassen, identische Spinner-Klassen, identischer Text
2. Failed-Branch (alter Z. 235-254): identische Wrapper-Klassen, identische Text-Klassen, identische Button-Klassen
3. Reset-Action (alter Z. 242-247): window.confirm + usePruefungStore.getState().reset() + window.location.reload()
4. Confirm-Text-String byte-identisch: 'Alle bisherigen Antworten gehen verloren. Fortfahren?'
5. Button-Label byte-identisch: 'Zurück zum Start'

Issues melden, sonst APPROVED.
```

- [ ] **Step 2: Code-Quality-Reviewer**

Bei Bedarf — Komponente ist trivial Switch-Render, evtl. überspringen wenn Spec-Compliance approved. Falls Issues von Spec-Reviewer: fix + commit, dann re-dispatch.

---

## Phase 3: `Layout.tsx` Edit (Migration löschen + Recovery-Replacement)

**Ziel der Phase:** Layout.tsx auf ≤ 500 Z. (Ziel ~483) durch:
1. Migration-IIFE (Z. 32-43) löschen
2. Recovery-State+Effect (Z. 176-220) durch Hook-Aufruf ersetzen
3. Recovery-Render (Z. 222-255) durch `<PruefungsRecoveryStatus />`-Block ersetzen
4. Imports anpassen (`apiService` + `resolveFragenFuerPruefung` raus, neue Hook+Komponente rein)

### Task 3.1: Pre-Cut-Snapshot

- [ ] **Step 1: Pre-Cut wc-l + tsc-Baseline**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
wc -l ExamLab/src/components/Layout.tsx
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc-bundle-y-pre-p3.log
```

Expected: `570 ExamLab/src/components/Layout.tsx`. tsc clean.

### Task 3.2: Edits in Layout.tsx anwenden

**Files:**
- Modify: `ExamLab/src/components/Layout.tsx`

- [ ] **Step 1: Migration-IIFE löschen (Z. 32-43)**

Entferne **exakt** Z. 32-43 inkl. der Leerzeile davor (Z. 31). Match-String:

```
// Einmalige Migration bei Modul-Import: alter Sidebar-Breite-Key (vor Hook-Refactor)
// → neuer Hook-Key mit Präfix. Nach einigen Wochen kann dieser Block entfernt werden.
if (typeof window !== 'undefined') {
  try {
    const alt = localStorage.getItem('pruefung-sidebar-breite')
    const neu = localStorage.getItem('sidebar-pruefung-sidebar-breite')
    if (alt !== null && neu === null) {
      localStorage.setItem('sidebar-pruefung-sidebar-breite', alt)
      localStorage.removeItem('pruefung-sidebar-breite')
    }
  } catch { /* ignore */ }
}
```

→ ersatzlos gelöscht.

- [ ] **Step 2: Imports in Layout.tsx anpassen**

In Z. 1-30:
- ENTFERNEN: `import { apiService } from '../services/apiService.ts'` (alte Z. 5)
- ENTFERNEN: `import { resolveFragenFuerPruefung } from '../utils/fragenResolver.ts'` (alte Z. 6)
- HINZUFÜGEN (nach den anderen Hook-Imports, z.B. nach `useLPNachrichten`-Zeile alte Z. 11): `import { usePruefungsRecovery } from '../hooks/usePruefungsRecovery.ts'`
- HINZUFÜGEN (nach den anderen Component-Imports, z.B. neben `BaseDialog`-Zeile alte Z. 23 oder am Ende): `import PruefungsRecoveryStatus from './PruefungsRecoveryStatus.tsx'`

- [ ] **Step 3: Recovery-State+Effect ersetzen (Z. 176-220 → 1 Zeile)**

Match-String (alte Z. 176-220, ~45 Z.):

```typescript
  // Prüfungs-ID aus URL für Recovery
  const pruefungIdAusUrl = useMemo(() => new URLSearchParams(window.location.search).get('id'), [])

  // Recovery: config/fragen fehlen nach Reload (werden nicht persistiert)
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'loading' | 'failed'>('idle')
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    if (config && fragen.length > 0) return // Alles vorhanden
    if (recoveryAttempted.current) return // Schon versucht
    if (!pruefungIdAusUrl || !user?.email) {
      setRecoveryStatus('failed')
      return
    }

    recoveryAttempted.current = true
    setRecoveryStatus('loading')

    const timeout = setTimeout(() => {
      setRecoveryStatus('failed')
    }, 10000)

    apiService.ladePruefung(pruefungIdAusUrl, user.email)
      .then((result) => {
        clearTimeout(timeout)
        if (result) {
          const { navigationsFragen, alleFragen: resolvedAlle } = resolveFragenFuerPruefung(result.config, result.fragen)
          usePruefungStore.getState().setConfigUndFragen(result.config, navigationsFragen, resolvedAlle)
          // durchfuehrungId aktualisieren falls nötig
          if (result.config.durchfuehrungId) {
            usePruefungStore.getState().setDurchfuehrungId(result.config.durchfuehrungId)
          }
          console.log('[Layout] Recovery erfolgreich — config+fragen wiederhergestellt')
        } else {
          setRecoveryStatus('failed')
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        console.error('[Layout] Recovery fehlgeschlagen:', err)
        setRecoveryStatus('failed')
      })

    return () => clearTimeout(timeout)
  }, [config, fragen, pruefungIdAusUrl, user])
```

Ersetzen durch:

```typescript
  const { status: recoveryStatus } = usePruefungsRecovery()
```

**Beachte:** Vorhergehende Leerzeile/Comment vor `// Prüfungs-ID aus URL für Recovery` mit löschen, um keine doppelten Leerzeilen zu hinterlassen.

- [ ] **Step 4: Recovery-Render-Block ersetzen (Z. 222-255 → 4 Zeilen)**

Match-String (alte Z. 222-255, ~34 Z.):

```typescript
  if (!config || fragen.length === 0) {
    // Recovery läuft oder noch nicht gestartet
    if (recoveryStatus !== 'failed') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400">Sitzung wird wiederhergestellt...</p>
          </div>
        </div>
      )
    }

    // Recovery fehlgeschlagen
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-2">Prüfungsdaten konnten nicht wiederhergestellt werden.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Ihre bisherigen Antworten gehen beim Zurücksetzen verloren.</p>
          <button
            onClick={() => {
              if (window.confirm('Alle bisherigen Antworten gehen verloren. Fortfahren?')) {
                usePruefungStore.getState().reset()
                window.location.reload()
              }
            }}
            className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Zurück zum Start
          </button>
        </div>
      </div>
    )
  }
```

Ersetzen durch:

```typescript
  if (!config || fragen.length === 0) {
    return <PruefungsRecoveryStatus status={recoveryStatus !== 'failed' ? 'loading' : 'failed'} />
  }
```

### Task 3.3: Verifikation Phase 3

- [ ] **Step 1: wc-l Layout.tsx → unter 500**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
wc -l ExamLab/src/components/Layout.tsx
```

Expected: ~483 Z. (Ziel-Range: 480-500). Falls > 500: STOP, untersuchen ob Migration-Block oder Recovery-Block vollständig entfernt wurde.

- [ ] **Step 2: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc-bundle-y-p3.log
```

Expected: leerer Output. Häufige Fehler:
- `'apiService' is declared but its value is never read` → Import wurde nicht entfernt
- `'resolveFragenFuerPruefung' is declared but its value is never read` → Import wurde nicht entfernt
- `'pruefungIdAusUrl' is not defined` → Variable wurde nicht durch Hook-Aufruf ersetzt
- `'PruefungsRecoveryStatus' is not defined` → Import fehlt

- [ ] **Step 3: Vitest grün ohne Drift**

```bash
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1487 passed | 4 todo | 1 skipped (1492)` — gleiche Zahl wie Phase 1, kein bestehender Test rot, +0 in P3.

- [ ] **Step 4: Lint-Gates**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
./scripts/audit-as-any.sh 2>&1 | tail -3
./scripts/audit-no-alert.sh 2>&1 | tail -3
./scripts/audit-tests-dir.sh 2>&1 | tail -3 || true
./scripts/audit-musterloesung.sh 2>&1 | tail -3 || true
```

Expected: alle Gates Total 0 (oder Baseline-konform). Insbesondere `audit-no-alert.sh` muss 0 Treffer in produktivem Code zeigen — `window.confirm` ist NICHT Teil des Match-Patterns (rev2-Verifikation).

- [ ] **Step 5: vite build grün**

```bash
cd ExamLab && npm run build 2>&1 | tail -10
```

Expected: PWA generateSW OK, ~3s, ~256 Cache-Entries. Falls Build-Fehler: STOP.

- [ ] **Step 6: Commit Phase 3**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
git add ExamLab/src/components/Layout.tsx
git commit -m "$(cat <<'EOF'
Bundle Y Phase 3: Layout.tsx nutzt usePruefungsRecovery + PruefungsRecoveryStatus

- Recovery-State-Maschine + Render-Block extrahiert
- localStorage-Migration-IIFE (2 Wochen alt) gelöscht
- Layout.tsx 570 → ~483 Z. (-87 Z., Hotspot-Bilanz 8 → 7)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.4: Per-Phase-Reviewer

- [ ] **Step 1: Spec-Compliance-Reviewer**

Dispatche `general-purpose`-Agent:

```
Verifiziere dass `ExamLab/src/components/Layout.tsx` (Phase 3 von Bundle Y) das Spec § 2 erfüllt.

Spec: docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md
Plan: docs/superpowers/plans/2026-05-08-bundle-y-layout-recovery-cut.md

Prüfe spezifisch:
1. Layout.tsx ≤ 500 Z. (Ziel ~483)
2. Migration-IIFE ist KOMPLETT entfernt (kein Rest in Z. 30-45)
3. Recovery-State+Effect ist 1 Hook-Aufruf-Zeile, kein lokaler State `recoveryStatus`/`recoveryAttempted`/`pruefungIdAusUrl` mehr
4. Recovery-Render ist 1 `<PruefungsRecoveryStatus />`-JSX-Block, kein inline-JSX-Branch mehr
5. Imports: apiService + resolveFragenFuerPruefung sind RAUS, usePruefungsRecovery + PruefungsRecoveryStatus sind RIN
6. Restliche Layout-Body unverändert (Header + Sidebar + Main + Banner + Overlays Z. ~270-565 byte-identisch)

Issues melden, sonst APPROVED.
```

- [ ] **Step 2: Code-Quality-Reviewer**

Dispatche `superpowers:code-reviewer`-Agent:

```
Review der Phase 3 von Bundle Y: Layout.tsx Component-Edit.

Branch: bundle-y/layout-recovery-cut
Files modified: ExamLab/src/components/Layout.tsx (570 → ~483 Z.)
Files added (P1+P2): ExamLab/src/hooks/usePruefungsRecovery.ts + .test.ts, ExamLab/src/components/PruefungsRecoveryStatus.tsx

Spec: docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md

Cumulative-Review für die ganze Bundle (P1+P2+P3). Achte auf:
- DRY: gibt es Duplikate zwischen Hook-Body und Sub-Komponente?
- YAGNI: Hook-Surface minimal?
- Side-Effect-Aufteilung Bundle-W.b-konform (Hook = State+API, Komponente = window-actions)?
- Layout.tsx-Body lesbar nach Cut?
- React-Konventionen (Hook-Reihenfolge, Dep-Arrays, Hook-Naming)?

Falls APPROVED FOR MERGE: Final-Reviewer in Phase 4 kann übersprungen werden.
```

Falls Issues: fix + commit, dann re-dispatch.

---

## Phase 4: Final-Verifikation + Reviewer

### Task 4.1: Hotspot-Bilanz prüfen

- [ ] **Step 1: Hotspot-File-Liste**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-y-layout-recovery"
find ExamLab/src -name "*.ts" -o -name "*.tsx" 2>/dev/null \
  | grep -v "/data/" \
  | grep -v "\.test\." \
  | grep -v "/__tests__/" \
  | grep -v "/tests/" \
  | xargs wc -l 2>/dev/null \
  | awk '$1 > 500 && $2 != "total" { print $1, $2 }' \
  | sort -rn
```

Expected: 7 Files >500 Z. (HilfeSeite 906, ConfigTab 747, EinstellungenPanel 607, BilanzERFrage 589, AktivPhase 573, PruefungsComposer 526, ZeichnenCanvas 518). **Layout.tsx NICHT mehr in der Liste.**

### Task 4.2: Final-Code-Reviewer (falls Phase 3 noch nicht "APPROVED FOR MERGE")

- [ ] **Step 1: Final-Reviewer dispatchen**

Falls Phase 3 Code-Quality-Reviewer noch nicht "APPROVED FOR MERGE" gegeben hat, dispatche `superpowers:code-reviewer`-Agent:

```
Final-Code-Review für Bundle Y vor Merge.

Branch: bundle-y/layout-recovery-cut
Spec: docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md
Plan: docs/superpowers/plans/2026-05-08-bundle-y-layout-recovery-cut.md

Files in Bundle Y:
- ExamLab/src/hooks/usePruefungsRecovery.ts (~50 Z.)
- ExamLab/src/hooks/usePruefungsRecovery.test.ts (~150 Z., 7 Vitest)
- ExamLab/src/components/PruefungsRecoveryStatus.tsx (~40 Z.)
- ExamLab/src/components/Layout.tsx (570 → ~483 Z., -87)

Verifizier-Outputs:
- vitest 1487 passed | 4 todo | 1 skipped (Drift +7)
- tsc -b clean
- 4 Lint-Gates clean
- vite build grün
- Hotspot-Bilanz Files >500 Z.: 8 → 7

Statement APPROVED FOR MERGE oder Issues melden.
```

Falls Issues: fix + commit, dann re-dispatch.

### Task 4.3: Browser-E2E (SKIPPED, Begründung dokumentieren)

- [ ] **Step 1: Browser-E2E-Skip-Notiz für HANDOFF**

Browser-E2E SKIPPED — Bundle-X-Stil. Begründung:
- Layout ist props-less, kein Caller-Edit-Risiko.
- Recovery-Pfad nur via Reload+URL-id+missing-Store-State triggerbar (selten in E2E).
- vitest 7 Tests decken State-Maschine vollständig ab.
- Falls Bug-Report: Spawn-Task „Browser-E2E manuell mit F5-Recovery-Flow" als Notiz.

---

## Phase 5: HANDOFF + Memory + Merge zu main

### Task 5.1: HANDOFF.md aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: Bundle Y-Eintrag oben einfügen**

In `ExamLab/HANDOFF.md`, oberhalb des „Bundle X — BatchExportDialog Pure-Logic-Cut ✅ MERGED"-Eintrags den Bundle-Y-Eintrag einfügen. Folge dem Stil von Bundle X (Hauptlayout: H3-Header, Was geliefert, Verifikation, Hotspot-Bilanz, Browser-E2E, Reviewer, Patterns, Lehren, Spawn-Tasks, Out of Scope).

Pflicht-Inhalte (anpassen):
- **Datum:** `2026-05-08`
- **Branch:** `bundle-y/layout-recovery-cut`
- **wc-l-Diff:** `570 → ~483 Z.`
- **vitest-Drift:** `1480 → 1487 (+7)`
- **Hotspot-Bilanz:** `8 → 7`
- **Files-Liste:** 3 neu, 1 modifiziert
- **M3-Begründung:** Migration-IIFE-Removal
- **Browser-E2E:** SKIPPED + Begründung

- [ ] **Step 2: Commit HANDOFF**

```bash
git add ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
Bundle Y: HANDOFF-Eintrag

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 5.2: Merge zu main (per User-Bestätigung)

- [ ] **Step 1: Pre-Merge-Pull main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git log --oneline -3
```

Expected: HEAD = `10c1b91 Merge Bundle X` (oder neuer falls Drift). Falls neuer: rebase Worktree-Branch.

- [ ] **Step 2: User-Bestätigung einholen**

**STOP. Nicht ohne User-Approval mergen.** Zeige User:
- Bundle-Y-Branch: `bundle-y/layout-recovery-cut`
- Diff-Summary (`git diff main..bundle-y/layout-recovery-cut --stat`)
- Hotspot-Bilanz vor/nach
- Reviewer-Befunde

Erst nach User-Freigabe weiter.

- [ ] **Step 3: Merge mit `--no-ff`**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git merge --no-ff bundle-y/layout-recovery-cut -m "$(cat <<'EOF'
Merge Bundle Y: Layout.tsx Recovery-Cut (570 → ~483 Z., -15.3%)

Hook-Extraktion (usePruefungsRecovery) + Render-Sub-Komponente
(PruefungsRecoveryStatus) + Migration-IIFE-Removal.

Hotspot-Bilanz Files >500 Z. (ohne data/test): 8 → 7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Push to origin/main**

```bash
git push origin main
```

- [ ] **Step 5: Merge-Commit-Hash für HANDOFF + Memory festhalten**

Merge-Hash erfassen, der im HANDOFF-Eintrag (Task 5.1) und im Memory-File (Task 5.3) als `<commit-hash>`/`<hash>` substituiert werden muss. Hash IMMER per `git rev-parse` verifizieren (Memory-Regel `feedback_hash_verification`).

```bash
MERGE_HASH=$(git rev-parse HEAD)
echo "Merge-Commit: $MERGE_HASH"
git log --format='%h %s' -1  # short-hash + subject zur Bestätigung
```

Expected: 40-Zeichen-SHA + Commit-Subject `Merge Bundle Y: Layout.tsx Recovery-Cut ...`. Diesen Hash (kurz: erste 7 Zeichen) in Task 5.1 + Task 5.3 einsetzen — falls HANDOFF-Eintrag schon vor dem Merge geschrieben wurde, nachträglich aktualisieren mit `git commit --amend` ODER kleinem Folge-Commit "HANDOFF: Bundle Y Merge-Hash nachgetragen".

### Task 5.3: Memory-Update

- [ ] **Step 1: Bundle-Y-Memory-File schreiben**

Erstelle `/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_y_komplett.md` analog `project_bundle_x_komplett.md`:

```markdown
---
name: Bundle Y KOMPLETT auf main
description: Bundle Y Layout.tsx Recovery-Cut 570 → ~483 Z. (-15.3%) via Hook-Extraktion + Sub-Komponente + Migration-Removal. Hotspot 8 → 7. Merge 2026-05-08.
type: project
---

# Bundle Y — Layout.tsx Recovery-Cut KOMPLETT auf main

**Datum:** 2026-05-08 Merge `<commit-hash>`
**Branch:** `bundle-y/layout-recovery-cut`
**Spec:** `docs/superpowers/specs/2026-05-08-bundle-y-layout-recovery-cut-design.md`
**Plan:** `docs/superpowers/plans/2026-05-08-bundle-y-layout-recovery-cut.md`

[... weitere Sektionen analog Bundle X-Memory ...]
```

- [ ] **Step 2: Index-Eintrag in MEMORY.md**

Füge oben in der „ExamLab"-Sektion ein:

```markdown
- **[Bundle Y KOMPLETT auf main](project_bundle_y_komplett.md)** — 2026-05-08 Merge `<hash>`. Erstes Sub-Bundle Phase-5+ post-X. Layout.tsx **570 → ~483 Z. (-15.3%)** via usePruefungsRecovery + PruefungsRecoveryStatus + Migration-Removal. Hotspot 8 → 7. vitest 1487 (+7), tsc/4× lint/build clean. Browser-E2E skipped (low-risk Hook-Cut). Per-Phase + Final Reviewer ✅.
```

### Task 5.4: Branch-Cleanup

- [ ] **Step 1: Worktree entfernen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree remove .worktrees/bundle-y-layout-recovery
```

- [ ] **Step 2: Branch lokal löschen**

```bash
git branch -d bundle-y/layout-recovery-cut
```

- [ ] **Step 3: Branch remote löschen (falls gepusht)**

```bash
git push origin --delete bundle-y/layout-recovery-cut 2>/dev/null || echo "Branch wurde nie gepusht — OK"
```

---

## Definition of Done (Recap)

- [x] `Layout.tsx` ≤ 500 Z. (Hotspot-Bilanz 8 → 7).
- [x] vitest grün, +7 neue Tests, kein Drift bei bestehenden 1480.
- [x] tsc -b clean.
- [x] 4 Lint-Gates clean (`lint:as-any`, `lint:no-alert`, `lint:no-tests-dir`, `lint:musterloesung`).
- [x] vite build grün.
- [x] Per-Phase Spec-Compliance + Code-Quality-Reviewer ✅ pro Phase.
- [x] Final Code-Reviewer „APPROVED FOR MERGE".
- [x] Browser-E2E SKIPPED (low-risk Hook-Cut, Begründung dokumentiert).
- [x] HANDOFF.md Bundle-Y-Eintrag.
- [x] Memory-Update: `project_bundle_y_komplett.md` + Index-Eintrag.
- [x] Merge zu main per User-Bestätigung.
- [x] Branch-Cleanup (Worktree + lokal + remote).

---

## Failure-Modes-Recovery

**Falls Phase 1 Hook-Tests rot bleiben (Closure-Ref-Pattern wider Erwarten fragil):**
- Alternative: Real-Store-`setState`-Pattern wie `useDirtyTracker.test.tsx`. `usePruefungStore.setState({ config: null, fragen: [] })` und `useAuthStore.setState({ user: ... })` direkt — kein `vi.mock` für die beiden Stores. Mocks bleiben nur für `apiService` + `fragenResolver`. **Trade-off:** weniger Isolation (Real-Store hat ggf. Side-Effects bei subscribe), aber bewährter im Repo. Memory-Lehre nach Bundle Y schreiben.

**Falls Layout.tsx > 500 Z. nach Phase 3:**
- Verifiziere `wc -l` und prüfe ob alle 3 Cut-Bereiche entfernt sind.
- Falls Code-Comments/Kommentare-Drift: niemals Body-Logik anpassen — ggf. zusätzliche Comments raus, wenn sie inline-Whitespace produzieren.
- Notfall-Spawn-Task: zusätzlicher Material-Modus-Hook-Cut (~15 Z.).

**Falls Forecast-Drift (Plan-rev2-nötig):**
- Plan-Phase-0 nochmal mit aktualisierter Math-Tabelle, dann Plan-Reviewer-Re-Dispatch.

**Falls vitest-Mock-Hooks-im-Hook-Library-Konflikt:**
- Pattern aus `useFragenAutoSave.test.tsx` Z. 1-30 wiederverwenden (function-Level vi.fn refs + selector-arg in mock).
