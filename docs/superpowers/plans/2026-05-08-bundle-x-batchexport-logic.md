# Bundle X — BatchExportDialog Pure-Logic-Cut Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx` (535 Z., Hotspot) per Pure-Logic-Cut auf ≤ 460 Z. zerlegen (erwartet ~427), ohne Verhaltensänderung. Hotspot-Bilanz Files >500 Z. (ohne `data/`+`test/`): **9 → 8**. Coverage-Lücke: erstmals 8 Vitest-Tests für Auto-Zuweisung-Logik + Batch-Export-Pool-Gruppierung.

**Architecture:** Eine neue pure Datei `ExamLab/src/utils/batchExportLogic.ts` mit `erstelleAutoZuweisungen()` (Auto-Map-Bau aus Fachbereich-Match) + `fuehreBatchExportAus()` (Pool-Gruppierung + per-Pool-API-Aufruf + Result-Mapping). 3 Type-Definitionen (`PoolEintrag`/`FrageZuweisung`/`SendeErgebnis`) wandern mit. Component bleibt UI + State (alle `set*`-Calls + `onErfolg` + `ladeTopicsFuerPool` bleiben), Side-Effects (`apiService.schreibePoolAenderung`, `konvertiereZuPoolFormat`) gehen direkt im Helper.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest.

**Spec:** [`docs/superpowers/specs/2026-05-08-bundle-x-batchexport-logic-design.md`](../specs/2026-05-08-bundle-x-batchexport-logic-design.md)

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree (zu erstellen in Phase 0):** `.worktrees/bundle-x-batchexport`

**Branch:** `bundle-x/batchexport-logic` (Spec rev2-Branch — Phase 0 verifiziert dass beide Spec-Commits HEAD vorausgehen)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output direkt prüfen (Memory-Lehre `feedback_tsc_b_exit_misleading`).

**Vitest-Baseline:** **1472 passed | 4 todo | 1 skipped** (post-Bundle-W.b + Test-Migration `d4e6914`). Drift-Erwartung **+8** in Phase 1.

**`wc -l BatchExportDialog.tsx` Tracking:**
- P0 Baseline: 535 Z.
- P2 Ende: ≤ 460 Z. (Ziel ~427)

---

## File Map

### Neue Files

| Datei | Größe ca. | Verantwortung |
|---|---:|---|
| `ExamLab/src/utils/batchExportLogic.ts` | ~120 Z. | `erstelleAutoZuweisungen({gewaehlteIds, exportierbar, pools}) → { zuweisungen, benoetigteTopicPools }` + `async fuehreBatchExportAus({zuweisungen, fragen, pools, email, onFortschritt}) → Promise<{ ergebnisse, erfolgreiche }>` + 3 Type-Exports |
| `ExamLab/src/utils/batchExportLogic.test.ts` | ~200 Z. | 8 Vitest-Tests (Auto-Zuw matching/no-match/skip-missing-id, Export empty/single/grouped+onFortschritt-calls/api-erfolg-false/api-throws) |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx` | 535 Z. | ≤ 460 Z. (Ziel ~427) | 3 Imports neu (1 multi-line block), 2 Imports raus (`konvertiereZuPoolFormat`, `apiService`), 3 Type-Defs raus (Z. 18-39), `weiterZuZuweisung`-Body verkürzt (Z. 113-127), `handleExport`-Body verkürzt (Z. 170-256). `Phase`-Type bleibt lokal (nur Component nutzt es). `useAuthStore`-Import bleibt (Component liest `email`). |

### Reihenfolge (Risiko-aufsteigend)

1. **Phase 0**: Worktree + Branch verifizieren + Vitest-Baseline + Pre-Cut-Grep + wc-l Baseline
2. **Phase 1**: `batchExportLogic.ts` + Test schreiben (TDD), Per-Phase-Reviewer
3. **Phase 2**: `BatchExportDialog.tsx` Component-Edit (Imports + Type-Defs + 2 Funktion-Bodies), Per-Phase-Reviewer
4. **Phase 3**: Final Code-Reviewer + Hotspot-Bilanz + Browser-E2E
5. **Phase 4**: HANDOFF + Memory + Merge zu main + Cleanup

---

## Phase 0: Worktree + Baseline

### Task 0.1: Worktree erstellen + Baseline verifizieren

- [ ] **Step 1: Worktree vom existierenden Branch erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree add .worktrees/bundle-x-batchexport bundle-x/batchexport-logic
```

Expected: `Preparing worktree (checking out 'bundle-x/batchexport-logic')` + HEAD: `cbf2d18 Bundle X Spec rev2: Reviewer-Empfehlungen einarbeiten` (oder neuere falls Plan-Commit dazukommt).

- [ ] **Step 2: cd in Worktree und Status prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport"
git status
git log --oneline -3
```

Expected: `On branch bundle-x/batchexport-logic`, working tree clean. Commits: `cbf2d18 Bundle X Spec rev2`, `e8e1f98 Bundle X Spec`, `d4e6914 Merge cleanup: uebungsStore-Tests` (oder analog post-Test-Migration).

- [ ] **Step 3: Pre-Cut-Grep — Type-Move-Safety**

```bash
grep -rn "PoolEintrag\|FrageZuweisung\|SendeErgebnis" ExamLab/src --include="*.tsx" --include="*.ts" 2>&1 | grep -v "^Binary"
```

Expected: NUR Treffer in `BatchExportDialog.tsx` (Definitionen + Verwendungen). Falls weitere Files: Re-Export-Bridge planen statt Move (Spec § 8 Risk #5).

- [ ] **Step 4: Pre-Cut-Grep — Consumer-Verifikation**

```bash
grep -rn "BatchExportDialog" ExamLab/src --include="*.tsx" --include="*.ts" | grep -v "^.*BatchExportDialog\.tsx:"
```

Expected: 4 Treffer:
- `tests/fragenBrowserEditorPrefetch.test.tsx:45` (Comment, kein Code)
- `tests/FragenBrowser.test.tsx:77` (`vi.mock(...)` — kein Caller-Edit nötig)
- `components/lp/korrektur/index.ts:10` (Re-Export — kein Edit nötig)
- `components/lp/fragensammlung/FragenBrowser.tsx:21+211` (Import + Usage — props unverändert, kein Edit)

- [ ] **Step 5: npm Setup (falls Worktree noch keine deps hat)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport"
npm run setup:shared 2>&1 | tail -3
cd ExamLab && npm install 2>&1 | tail -3
```

Expected: `found 0 vulnerabilities` (oder akzeptable Warnings). Beide installs idempotent.

- [ ] **Step 6: Vitest-Baseline verifizieren**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1472 passed | 4 todo | 1 skipped (1477)`. Falls Drift: STOP, untersuchen.

- [ ] **Step 7: Source-Datei Baseline-wc**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
wc -l src/components/lp/korrektur/BatchExportDialog.tsx
```

Expected: `535 src/components/lp/korrektur/BatchExportDialog.tsx`.

- [ ] **Step 8: apiService-Signatur prüfen (Test-Mock-Korrektheit)**

```bash
grep -A 5 "schreibePoolAenderung" ExamLab/src/services/apiService.ts | head -20
```

Expected: Return-Shape mit `erfolg`, `exportierteIds`, `neueHashes`, `fehler` Properties — Test-Mock muss diese liefern.

- [ ] **Step 9: Plan-Commit auf Branch**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport"
git add docs/superpowers/plans/2026-05-08-bundle-x-batchexport-logic.md
git commit -m "Bundle X Plan: BatchExportDialog Pure-Logic-Cut Implementation"
```

Expected: Plan-Commit auf Branch (rein-Doku-Commit).

---

## Phase 1: `batchExportLogic.ts` extrahieren (TDD)

**Ziel der Phase:** Pure Helper + Type-Defs nach `utils/batchExportLogic.ts` mit 8 Vitest-Coverage. Component noch unverändert; Helper steht standalone testbar.

### Task 1.1: Test-Datei schreiben (failing)

**Files:**
- Create: `ExamLab/src/utils/batchExportLogic.test.ts`

- [ ] **Step 1: Test-Datei schreiben**

```typescript
// ExamLab/src/utils/batchExportLogic.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../types/fragen-storage'

vi.mock('../services/apiService', () => ({
  apiService: {
    schreibePoolAenderung: vi.fn(),
  },
}))
vi.mock('./poolExporter', () => ({
  konvertiereZuPoolFormat: vi.fn((f: Frage) => ({
    id: f.id,
    fragetext: 'mock-fragetext',
  })),
}))

import {
  erstelleAutoZuweisungen,
  fuehreBatchExportAus,
  type PoolEintrag,
} from './batchExportLogic'
import { apiService } from '../services/apiService'

const mkFrage = (overrides: Partial<Frage> = {}): Frage => ({
  id: 'q1',
  typ: 'mc',
  fachbereich: 'wr',
  bloom: 'k1',
  fragetext: 'Test',
  ...overrides,
} as unknown as Frage)

const mkPool = (overrides: Partial<PoolEintrag> = {}): PoolEintrag => ({
  id: 'wr',
  file: 'wr.js',
  fach: 'wr',
  title: 'Wirtschaft & Recht',
  ...overrides,
})

describe('erstelleAutoZuweisungen', () => {
  it('matching fachbereich → poolId set + benoetigteTopicPools enthält pool', () => {
    const frage = mkFrage({ id: 'q1', fachbereich: 'wr' })
    const pool = mkPool({ id: 'wr', fach: 'wr' })
    const result = erstelleAutoZuweisungen({
      gewaehlteIds: new Set(['q1']),
      exportierbar: [frage],
      pools: [pool],
    })
    expect(result.zuweisungen.get('q1')).toEqual({ frageId: 'q1', poolId: 'wr', topic: '' })
    expect(result.benoetigteTopicPools).toEqual(['wr'])
  })

  it('no matching pool → empty poolId, kein TopicPool', () => {
    const frage = mkFrage({ id: 'q1', fachbereich: 'recht' })
    const pool = mkPool({ id: 'wr', fach: 'wr' })
    const result = erstelleAutoZuweisungen({
      gewaehlteIds: new Set(['q1']),
      exportierbar: [frage],
      pools: [pool],
    })
    expect(result.zuweisungen.get('q1')).toEqual({ frageId: 'q1', poolId: '', topic: '' })
    expect(result.benoetigteTopicPools).toEqual([])
  })

  it('gewaehlteIds nicht in exportierbar → übersprungen, kein crash', () => {
    const result = erstelleAutoZuweisungen({
      gewaehlteIds: new Set(['ghost']),
      exportierbar: [mkFrage({ id: 'q1' })],
      pools: [mkPool()],
    })
    expect(result.zuweisungen.size).toBe(0)
    expect(result.benoetigteTopicPools).toEqual([])
  })
})

describe('fuehreBatchExportAus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('empty zuweisungen → leere Result + onFortschritt(0,0) aufgerufen', async () => {
    const onFortschritt = vi.fn()
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map(),
      fragen: [],
      pools: [],
      email: 'lp@test',
      onFortschritt,
    })
    expect(result.ergebnisse).toEqual([])
    expect(result.erfolgreiche).toEqual([])
    expect(onFortschritt).toHaveBeenCalledWith(0, 0)
  })

  it('1 Frage success → 1 erfolgreich, korrekt zugeordnete poolId/hash', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockResolvedValue({
      erfolg: true,
      aktualisiert: 0,
      exportiert: 1,
      commitSha: 'sha-abc',
      exportierteIds: { '0': 'wr-001' },
      neueHashes: { '0': 'hash-abc' },
      fehler: [],
    })
    const onFortschritt = vi.fn()
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([['q1', { frageId: 'q1', poolId: 'wr', topic: 'topic1' }]]),
      fragen: [mkFrage({ id: 'q1' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt,
    })
    expect(result.ergebnisse).toHaveLength(1)
    expect(result.ergebnisse[0]).toMatchObject({
      frageId: 'q1',
      erfolg: true,
      poolId: 'wr:wr-001',
      poolContentHash: 'hash-abc',
    })
    expect(result.erfolgreiche).toEqual([{
      frageId: 'q1', poolId: 'wr:wr-001', poolContentHash: 'hash-abc',
    }])
  })

  it('2 Fragen same pool → 1 API-Aufruf mit 2 änderungen, 2 erfolgreiche, onFortschritt-Reihenfolge [[0,2], [2,2]]', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockResolvedValue({
      erfolg: true,
      aktualisiert: 0,
      exportiert: 2,
      commitSha: 'sha-xy',
      exportierteIds: { '0': 'wr-001', '1': 'wr-002' },
      neueHashes: { '0': 'hash-1', '1': 'hash-2' },
      fehler: [],
    })
    const onFortschritt = vi.fn()
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([
        ['q1', { frageId: 'q1', poolId: 'wr', topic: 't' }],
        ['q2', { frageId: 'q2', poolId: 'wr', topic: 't' }],
      ]),
      fragen: [mkFrage({ id: 'q1' }), mkFrage({ id: 'q2' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt,
    })
    expect(apiService.schreibePoolAenderung).toHaveBeenCalledTimes(1)
    expect(result.ergebnisse).toHaveLength(2)
    expect(result.ergebnisse.every(e => e.erfolg)).toBe(true)
    expect(onFortschritt.mock.calls).toEqual([[0, 2], [2, 2]])
  })

  it('API result.erfolg=false → alle markiert fehlgeschlagen mit fehler-Text', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockResolvedValue({
      erfolg: false,
      aktualisiert: 0,
      exportiert: 0,
      commitSha: '',
      exportierteIds: {},
      neueHashes: {},
      fehler: ['Pool gesperrt'],
    })
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([['q1', { frageId: 'q1', poolId: 'wr', topic: 't' }]]),
      fragen: [mkFrage({ id: 'q1' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt: vi.fn(),
    })
    expect(result.ergebnisse[0]).toMatchObject({
      frageId: 'q1', erfolg: false, fehler: 'Pool gesperrt',
    })
    expect(result.erfolgreiche).toEqual([])
  })

  it('API throws → catch-Pfad, alle als Netzwerkfehler markiert', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockRejectedValue(new Error('boom'))
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([['q1', { frageId: 'q1', poolId: 'wr', topic: 't' }]]),
      fragen: [mkFrage({ id: 'q1' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt: vi.fn(),
    })
    expect(result.ergebnisse[0]).toMatchObject({
      frageId: 'q1', erfolg: false, fehler: 'boom',
    })
  })
})
```

- [ ] **Step 2: Test laufen lassen — sollte failen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx vitest run src/utils/batchExportLogic.test.ts 2>&1 | tail -10
```

Expected: FAIL `Cannot find module './batchExportLogic'`.

### Task 1.2: `batchExportLogic.ts` schreiben

**Files:**
- Create: `ExamLab/src/utils/batchExportLogic.ts`

- [ ] **Step 1: Helper-Datei schreiben**

```typescript
// ExamLab/src/utils/batchExportLogic.ts
import type { Frage } from '../types/fragen-storage'
import { apiService } from '../services/apiService'
import { konvertiereZuPoolFormat } from './poolExporter'

export interface PoolEintrag {
  id: string
  file: string
  fach: string
  title: string
}

export interface FrageZuweisung {
  frageId: string
  poolId: string
  topic: string
}

export interface SendeErgebnis {
  frageId: string
  erfolg: boolean
  poolId?: string
  poolContentHash?: string
  fehler?: string
}

interface ErstelleAutoZuweisungenArgs {
  gewaehlteIds: Set<string>
  exportierbar: Frage[]
  pools: PoolEintrag[]
}

interface AutoZuweisungenResult {
  zuweisungen: Map<string, FrageZuweisung>
  benoetigteTopicPools: string[]
}

/**
 * Erstellt Auto-Zuweisungen basierend auf Fachbereich-Match.
 * Pure: keine State-Mutationen, keine Side-Effects.
 *
 * Liefert benoetigteTopicPools: Liste der Pool-IDs für die der Caller
 * topics (state-mutiert) noch laden sollte.
 */
export function erstelleAutoZuweisungen(args: ErstelleAutoZuweisungenArgs): AutoZuweisungenResult {
  const { gewaehlteIds, exportierbar, pools } = args
  const zuweisungen = new Map<string, FrageZuweisung>()
  const benoetigteTopicPools = new Set<string>()

  for (const id of gewaehlteIds) {
    const frage = exportierbar.find(f => f.id === id)
    if (!frage) continue
    const passenderPool = pools.find(p => p.fach?.toLowerCase() === frage.fachbereich?.toLowerCase())
    zuweisungen.set(id, {
      frageId: id,
      poolId: passenderPool?.id || '',
      topic: '',
    })
    if (passenderPool) benoetigteTopicPools.add(passenderPool.id)
  }

  return { zuweisungen, benoetigteTopicPools: Array.from(benoetigteTopicPools) }
}

interface FuehreBatchExportArgs {
  zuweisungen: Map<string, FrageZuweisung>
  fragen: Frage[]
  pools: PoolEintrag[]
  email: string
  onFortschritt: (gesendet: number, gesamt: number) => void
}

interface BatchExportResult {
  ergebnisse: SendeErgebnis[]
  erfolgreiche: Array<{ frageId: string; poolId: string; poolContentHash: string }>
}

/**
 * Führt Batch-Export der Zuweisungen aus. Gruppiert nach Pool-Datei,
 * macht eine API-Anfrage pro Pool.
 *
 * Pure-async: kein direktes setState. onFortschritt-Callback liefert
 * Progress-Updates. Caller verbindet das Result mit setErgebnisse +
 * onErfolg-Callback + Phase-Übergang.
 */
export async function fuehreBatchExportAus(args: FuehreBatchExportArgs): Promise<BatchExportResult> {
  const { zuweisungen, fragen, pools, email, onFortschritt } = args
  const gesamt = zuweisungen.size
  onFortschritt(0, gesamt)
  const alleErgebnisse: SendeErgebnis[] = []

  // Gruppiere nach Pool-Datei
  const nachPool = new Map<string, Array<{ frage: Frage; zuweisung: FrageZuweisung }>>()
  for (const [frageId, zuw] of zuweisungen) {
    const frage = fragen.find(f => f.id === frageId)
    if (!frage) continue
    const pool = pools.find(p => p.id === zuw.poolId)
    if (!pool) continue
    const datei = pool.file || pool.id + '.js'
    if (!nachPool.has(datei)) nachPool.set(datei, [])
    nachPool.get(datei)!.push({ frage, zuweisung: zuw })
  }

  let gesendet = 0
  for (const [poolDatei, eintraege] of nachPool) {
    try {
      const aenderungen = eintraege.map(({ frage, zuweisung }) => {
        const exported = konvertiereZuPoolFormat(frage, zuweisung.topic)
        exported.reviewed = false
        return {
          poolFrageId: null as string | null,
          typ: 'export' as const,
          felder: exported as unknown as Record<string, unknown>,
          _frageId: frage.id,
        }
      })

      const result = await apiService.schreibePoolAenderung(
        email,
        poolDatei,
        aenderungen.map(({ _frageId: _, ...rest }) => rest),
      )

      if (result?.erfolg) {
        const exportierteIdValues = Object.values(result.exportierteIds)
        const hashValues = Object.values(result.neueHashes)
        const poolName = poolDatei.replace('.js', '')

        for (let i = 0; i < eintraege.length; i++) {
          alleErgebnisse.push({
            frageId: eintraege[i].frage.id,
            erfolg: true,
            poolId: poolName + ':' + (exportierteIdValues[i] || ''),
            poolContentHash: hashValues[i] || '',
          })
        }
      } else {
        for (const { frage } of eintraege) {
          alleErgebnisse.push({
            frageId: frage.id,
            erfolg: false,
            fehler: result?.fehler?.join(', ') || 'Unbekannter Fehler',
          })
        }
      }
    } catch (e) {
      for (const { frage } of eintraege) {
        alleErgebnisse.push({
          frageId: frage.id,
          erfolg: false,
          fehler: e instanceof Error ? e.message : 'Netzwerkfehler',
        })
      }
    }

    gesendet += eintraege.length
    onFortschritt(gesendet, gesamt)
  }

  const erfolgreiche = alleErgebnisse
    .filter(e => e.erfolg)
    .map(e => ({
      frageId: e.frageId,
      poolId: e.poolId!,
      poolContentHash: e.poolContentHash!,
    }))

  return { ergebnisse: alleErgebnisse, erfolgreiche }
}
```

- [ ] **Step 2: Test laufen lassen — sollte passen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx vitest run src/utils/batchExportLogic.test.ts 2>&1 | tail -10
```

Expected: PASS, 8 tests.

- [ ] **Step 3: Full-Vitest-Run (alle Tests, +8 Drift)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1480 passed | 4 todo` (+8 von 1472).

- [ ] **Step 4: tsc-Check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler.

- [ ] **Step 5: 4 Lint-Gates**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
```

Expected: Alle clean. Falls `lint:musterloesung`-Drift: Helper/Test enthält keine `musterlosung`-Tokens, sollte sauber bleiben.

- [ ] **Step 6: Build-Check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx vite build 2>&1 | tail -10
```

Expected: `✓ built in ~3s`, PWA generateSW OK.

- [ ] **Step 7: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport"
git add ExamLab/src/utils/batchExportLogic.ts ExamLab/src/utils/batchExportLogic.test.ts
git commit -m "Bundle X Phase 1: batchExportLogic.ts mit erstelleAutoZuweisungen + fuehreBatchExportAus + 8 Vitest"
```

### Task 1.3: Per-Phase-Reviewer für Phase 1

- [ ] **Step 1: Spec-Compliance + Code-Quality-Reviewer dispatch**

Reviewer-Prompt: Phase 1 vollständig (`batchExportLogic.ts` + Test). Prüfen:
- Spec § 2 byte-identisch umgesetzt (3 Type-Exports, 2 Funktionen-Signatures, Body-Logik byte-identisch zur Original-Component)
- Test #6 enthält die `onFortschritt.mock.calls === [[0, 2], [2, 2]]`-Assertion
- DoD: vitest 1480 (+8), tsc clean, 4 Lint-Gates, build clean
- Type-Move: keine `PoolEintrag`/`FrageZuweisung`/`SendeErgebnis`-Imports in anderen Files (außer Helper + zukünftiger Component-Edit)

Falls APPROVED → Phase 2. Falls Issues → fix + re-dispatch (max 3 Iterationen).

---

## Phase 2: `BatchExportDialog.tsx` Component-Edit

**Ziel:** Component nutzt neuen Helper. Keine Verhaltensänderung. wc-l ≤ 460.

### Task 2.1: Imports + Type-Defs anpassen

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx`

- [ ] **Step 1: Imports oben in BatchExportDialog.tsx anpassen**

Aktuell (Z. 4-10):
```typescript
import { useState, useEffect, useMemo } from 'react'
import type { Frage } from '../../../types/fragen-storage'
import { ladePoolIndex, ladePoolConfig } from '../../../services/poolSync'
import { konvertiereZuPoolFormat } from '../../../utils/poolExporter'
import { apiService } from '../../../services/apiService'
import { useAuthStore } from '../../../store/authStore'
import { fachbereichFarbe, typLabel } from '../../../utils/fachUtils'
```

Nachher:
```typescript
import { useState, useEffect, useMemo } from 'react'
import type { Frage } from '../../../types/fragen-storage'
import { ladePoolIndex, ladePoolConfig } from '../../../services/poolSync'
import {
  erstelleAutoZuweisungen,
  fuehreBatchExportAus,
  type PoolEintrag,
  type FrageZuweisung,
  type SendeErgebnis,
} from '../../../utils/batchExportLogic'
import { useAuthStore } from '../../../store/authStore'
import { fachbereichFarbe, typLabel } from '../../../utils/fachUtils'
```

(`konvertiereZuPoolFormat` + `apiService`-Imports entfernen; neue 6-Zeilen-Import-Block ersetzt sie. Type-Imports verwenden `type`-only-Syntax wegen `verbatimModuleSyntax`.)

- [ ] **Step 2: Type-Defs Z. 18-39 entfernen**

Aktuell (3 Interfaces, ~22 Z.):
```typescript
interface PoolEintrag { ... }
interface FrageZuweisung { ... }
interface SendeErgebnis { ... }
```

Nachher: **Komplett entfernen.** Alle drei wandern via Import vom Helper. Nur der `Phase`-Type bleibt lokal:
```typescript
type Phase = 'auswahl' | 'zuweisung' | 'senden' | 'fertig' | 'fehler'
```

(`Phase` ist nur in `useState<Phase>` verwendet, kein Helper braucht ihn.)

- [ ] **Step 3: tsc-Check (Imports + Types-Move)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler. Falls "Cannot find name 'PoolEintrag'": Import-Block-Syntax prüfen.

### Task 2.2: `weiterZuZuweisung`-Body verkürzen

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx`

- [ ] **Step 1: Body-Replace**

Aktuell (Z. 112-129):
```typescript
function weiterZuZuweisung(): void {
  // Auto-Zuweisungen basierend auf Fachbereich
  const neueZuweisungen = new Map<string, FrageZuweisung>()
  for (const id of gewaehlteIds) {
    const frage = exportierbar.find(f => f.id === id)
    if (!frage) continue
    const passenderPool = pools.find(p => p.fach?.toLowerCase() === frage.fachbereich?.toLowerCase())
    neueZuweisungen.set(id, {
      frageId: id,
      poolId: passenderPool?.id || '',
      topic: '',
    })
    // Topics vorladen
    if (passenderPool) ladeTopicsFuerPool(passenderPool.id)
  }
  setZuweisungen(neueZuweisungen)
  setPhase('zuweisung')
}
```

Nachher:
```typescript
function weiterZuZuweisung(): void {
  const { zuweisungen: neueZuweisungen, benoetigteTopicPools } = erstelleAutoZuweisungen({
    gewaehlteIds, exportierbar, pools,
  })
  for (const poolId of benoetigteTopicPools) ladeTopicsFuerPool(poolId)
  setZuweisungen(neueZuweisungen)
  setPhase('zuweisung')
}
```

- [ ] **Step 2: tsc-Check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler.

### Task 2.3: `handleExport`-Body verkürzen

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx`

- [ ] **Step 1: Body-Replace**

Aktuell (Z. 170-256, 87 Z.):
```typescript
async function handleExport(): Promise<void> {
  setPhase('senden')
  const gesamt = zuweisungen.size
  setFortschritt({ gesendet: 0, gesamt })
  const alleErgebnisse: SendeErgebnis[] = []
  // ... 80+ Zeilen Pool-Gruppierung + per-Pool-API + Result-Mapping ...
  setErgebnisse(alleErgebnisse)
  const erfolgreiche = alleErgebnisse.filter(e => e.erfolg)
  if (erfolgreiche.length > 0) {
    onErfolg(erfolgreiche.map(e => ({ ... })))
  }
  setPhase(alleErgebnisse.some(e => !e.erfolg) ? 'fehler' : 'fertig')
}
```

Nachher (~13 Z.):
```typescript
async function handleExport(): Promise<void> {
  setPhase('senden')
  const { ergebnisse, erfolgreiche } = await fuehreBatchExportAus({
    zuweisungen,
    fragen: exportierbar,
    pools,
    email,
    onFortschritt: (gesendet, gesamt) => setFortschritt({ gesendet, gesamt }),
  })
  setErgebnisse(ergebnisse)
  if (erfolgreiche.length > 0) onErfolg(erfolgreiche)
  setPhase(ergebnisse.some(e => !e.erfolg) ? 'fehler' : 'fertig')
}
```

- [ ] **Step 2: tsc-Check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler.

### Task 2.4: Vollständige Verifikation Phase 2

- [ ] **Step 1: Vitest-Run (alle Tests, drift=0 von 1480)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1480 passed | 4 todo`. Bestehende `FragenBrowser.test.tsx` weiter grün (mockt `BatchExportDialog`, props-unverändert).

- [ ] **Step 2: 4 Lint-Gates**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
```

Expected: Alle clean.

- [ ] **Step 3: wc -l Final-Check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
wc -l src/components/lp/korrektur/BatchExportDialog.tsx
```

**Decision-Tree:**
- **≤ 430:** ✅ Excellent — über Forecast (komfortable Margin)
- **431-460:** ✅ Done — innerhalb Plan-DoD
- **461-500:** ⚠️ Plan-Math knapp — keine Hotspot-Verlassen-Issue, aber überprüfen ob alle 3 Cuts angewendet
- **>500:** ❌ STOP — Cut nicht erfolgreich, Plan-Reviewer konsultieren

- [ ] **Step 4: Build-Check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
npx vite build 2>&1 | tail -10
```

Expected: `✓ built`.

- [ ] **Step 5: Commit Phase 2**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport"
git add ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx
git commit -m "Bundle X Phase 2: BatchExportDialog nutzt batchExportLogic-Helpers"
```

### Task 2.5: Per-Phase-Reviewer für Phase 2

- [ ] **Step 1: Spec-Compliance + Code-Quality-Reviewer dispatch**

Reviewer-Prompt: Phase 2 vollständig (Component-Edit). Prüfen:
- Imports korrekt (3 entfernt: konvertiereZuPoolFormat-Import + apiService-Import + 3 Type-Defs; 1 neuer 6-Zeilen-Block)
- Side-Effect-Aufteilung: `setPhase`, `setFortschritt`, `setErgebnisse`, `onErfolg`, `ladeTopicsFuerPool` bleiben in Component
- Helper-Aufrufe byte-equivalent (kein Drift in Auto-Zuweisung-Iteration oder handleExport-Branches)
- DoD: vitest 1480 stable, tsc clean, 4 Lint-Gates, wc -l ≤ 460
- `Phase`-Type bleibt lokal (nicht versehentlich in Helper migriert)

Falls APPROVED → Phase 3. Falls Issues → fix + re-dispatch (max 3 Iterationen).

---

## Phase 3: Final Verification

### Task 3.1: Hotspot-Bilanz prüfen

- [ ] **Step 1: Files >500 Z. zählen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport/ExamLab"
find src \( -name "*.ts" -o -name "*.tsx" \) | grep -v "/data/" | grep -v "/__tests__/" | grep -v ".test." | xargs wc -l 2>/dev/null | awk '$1 > 500 {print}' | sort -rn
```

Expected: 8 Files (BatchExportDialog raus, 9 → 8). Liste:
1. HilfeSeite.tsx 906
2. ConfigTab.tsx 747
3. EinstellungenPanel.tsx 607
4. BilanzERFrage.tsx 589
5. AktivPhase.tsx 573
6. Layout.tsx 570
7. PruefungsComposer.tsx 526
8. ZeichnenCanvas.tsx 518

Falls BatchExportDialog noch >500: STOP, Phase 2 Decision-Tree triggern.

### Task 3.2: Final Code-Reviewer (Branch komplett)

- [ ] **Step 1: Final Code-Reviewer dispatch**

Reviewer-Prompt: Branch `bundle-x/batchexport-logic` vollständig prüfen gegen Spec. Prüfen:
- Alle Cuts byte-identisch
- Side-Effect-Aufteilung korrekt
- Konsumenten-Surface unverändert (FragenBrowser.tsx unverändert, FragenBrowser.test.tsx-Mock weiter funktional)
- Alle DoD-Kriterien erfüllt

Falls APPROVED FOR MERGE → Phase 4. Falls Issues → fix + re-dispatch.

---

## Phase 4: Browser-E2E + Merge

### Task 4.1: Preview-Branch updaten

- [ ] **Step 1: preview-Sicherheits-Check (Memory-Lehre `feedback_preview_forcepush`)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport"
git fetch origin preview
git log preview ^bundle-x/batchexport-logic --oneline 2>&1 | head -10
```

Expected: Leer. Falls Commits: STOP — preview hat WIP, force-push würde überschreiben.

- [ ] **Step 2: Force-with-lease push to preview**

```bash
git push --force-with-lease origin bundle-x/batchexport-logic:preview
```

Expected: Successful update, GitHub Pages Deploy startet.

- [ ] **Step 3: Pages-Deploy abwarten**

GitHub Pages-Build dauert ~3-5 Min. Falls `gh run list` nicht verfügbar: visuell auf staging warten.

### Task 4.2: Browser-E2E mit echtem LP-Login

**Pflicht:** Echte LP-Logins (Memory `feedback_echte_logins`), keine Demo-Modi. SW-Cache vor jedem Test-Lauf zurücksetzen.

- [ ] **Step 1: SW-Cache reset (DevTools Console)**

```javascript
await navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())))
await caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
location.reload()
```

- [ ] **Step 2: LP-Login + Pflicht-Pfade**

| # | Pfad | Stresst |
|---|---|---|
| 1 | LP-Login + Korrektur-Bereich öffnen + Batch-Export-Dialog öffnen | Smoke (Phase 'auswahl' rendert) |
| 2 | Mehrere Fragen auswählen (>1 Pool-Zugehörigkeit) → Weiter zu Zuweisung | `erstelleAutoZuweisungen` Auto-Map |
| 5 | 0 Console-Errors-Check | Cross-cutting |

Falls Pfad 1+2+5 ✅ → Phase 7. Falls Errors: STOP, untersuchen.

- [ ] **Step 3: Optional-Pfade (falls Zeit)**

| # | Pfad |
|---|---|
| 3 | Zuweisungen vervollständigen → Exportieren-Button aktiv |
| 4 | Export-Aufruf → Senden-Phase → Fertig-Phase |

Bei Zeit/Kapazität: alle abklicken. Sonst: Vitest-Coverage (8 neue Tests) als Sicherungsnetz für Pfade 3+4.

---

## Phase 5: HANDOFF + Memory + Merge

### Task 5.1: HANDOFF.md aktualisieren

- [ ] **Step 1: Bundle-X-Eintrag schreiben**

Format analog Bundle V/U/W/W.b in `ExamLab/HANDOFF.md`. Inhalt:
- Cut: 535 → ~427 Z. (-108)
- 1 Helper-File (2 Funktionen + 3 Types) + 8 Vitest
- Hotspot-Bilanz 9 → 8
- Browser-E2E ✅
- Lehren (Topic-Vorlade-Side-Effect getrennt via benoetigteTopicPools, Phase-5+-Hotspot-Reduction-Roadmap gestartet)
- Spawn-Tasks (8 weitere Hotspot-Files)

- [ ] **Step 2: Commit HANDOFF**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-x-batchexport"
git add ExamLab/HANDOFF.md
git commit -m "Bundle X: HANDOFF-Eintrag"
```

### Task 5.2: Memory-Eintrag

- [ ] **Step 1: project_bundle_x_komplett.md schreiben**

Datei: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_x_komplett.md`

Inhalt: Datum, Merge-Hash, Cut-Saving, Hotspot 9→8, Lehren, Phase-5+-Roadmap.

- [ ] **Step 2: MEMORY.md Index-Eintrag**

Eine Zeile in ExamLab-Sektion, analog Bundle W.b.

### Task 5.3: Merge zu main + Push

- [ ] **Step 1: Merge to main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git merge --no-ff bundle-x/batchexport-logic -m "Merge Bundle X: BatchExportDialog Pure-Logic-Cut (535 → ~427 Z., -20%)"
```

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

Expected: Production-Deploy startet automatisch.

### Task 5.4: Cleanup

- [ ] **Step 1: Worktree entfernen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree remove --force .worktrees/bundle-x-batchexport
rm -rf .worktrees/bundle-x-batchexport
```

- [ ] **Step 2: Branch lokal löschen**

```bash
git branch -d bundle-x/batchexport-logic
```

---

## Definition of Done (Final)

- [ ] vitest 1480 passed (Drift +8 exakt in Phase 1, drift=0 in Phase 2)
- [ ] tsc -b clean (Output direkt geprüft)
- [ ] 4 Lint-Gates clean: `lint:as-any` / `lint:no-alert` / `lint:no-tests-dir` / `lint:musterloesung`
- [ ] vite build erfolgreich
- [ ] `wc -l BatchExportDialog.tsx` ≤ 460 (Ziel ~427)
- [ ] Hotspot-Bilanz Files >500 Z.: 9 → 8
- [ ] Per-Phase-Reviewer (P1, P2) APPROVED
- [ ] Final Code-Reviewer APPROVED FOR MERGE
- [ ] Browser-E2E Pflicht-Pfade 1+2+5 ✅ mit echtem LP-Login
- [ ] HANDOFF.md `Bundle X`-Eintrag
- [ ] Memory `project_bundle_x_komplett.md` + MEMORY.md Index
- [ ] Bestehende `FragenBrowser.test.tsx` (mockt BatchExportDialog) grün
- [ ] Branch `bundle-x/batchexport-logic` lokal gelöscht

---

## Spawn-Tasks (für nächste Sessions)

- **Layout.tsx (570 Z.)** als nächster Hotspot-Cut (Bundle Y) — niedrig-mittel Risiko
- **AktivPhase.tsx (573 Z.)** + **BilanzERFrage.tsx (589 Z.)** + **EinstellungenPanel.tsx (607 Z.)** mittel-Risiko
- **HilfeSeite.tsx (906 Z.)** + **ConfigTab.tsx (747 Z.)** hoch-Risiko
- **PruefungsComposer.tsx (526 Z.)** + **ZeichnenCanvas.tsx (518 Z.)** knapp-drin
