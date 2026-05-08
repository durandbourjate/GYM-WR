# Bundle W.b — uebungsStore State-Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ExamLab/src/store/ueben/uebungsStore.ts` (540 Z. nach Bundle W) per 4 Pure-Logic-Sub-Files in `utils/ueben/` weiter zerlegen, ohne Verhaltensänderung. Ziel: ≤ 500 Z. im Hauptfile (erwartet ~498 Z., 2 Z. Margin). Hotspot-Bilanz Files >500 Z. (ohne `data/`+`test/`): **10 → 9** (Bundle W's Hotspot-Cut endlich realisiert). Coverage-Lücke: erstmals isolierte Tests für Selbstbewertbar-Klassifikation / Session-Block-Bau / Client-Korrektur-Fast-Path / Lösungs-Preload-Fetch (~18 neue Vitest-Tests).

**Architecture:** 4 thematisch getrennte Sub-Files (`fragetypGruppen.ts`, `sessionBlockBau.ts`, `pruefeClientseitig.ts`, `loesungsPreloadFetch.ts`) als pure Module in `utils/ueben/`-Folder, konsistent zu Bundle-W-Cuts. Side-Effects (`useUebenFortschrittStore.getState().antwortVerarbeiten`) und Dynamic-Imports (`./authStore`) bleiben **explizit im Store-Action** — Helper sind rein-funktional. Public-Surface von `useUebenUebungsStore` byte-identisch (0 Caller-Edits).

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Vitest.

**Spec:** [`docs/superpowers/specs/2026-05-08-bundle-w-b-uebungsstore-state-refactor-design.md`](../specs/2026-05-08-bundle-w-b-uebungsstore-state-refactor-design.md)

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree (zu erstellen in Phase 0):** `.worktrees/bundle-w-b-uebungsstore`

**Branch:** `bundle-w-b/uebungsstore-state-refactor` (Spec-Branch — Phase 0 verifiziert dass beide Spec-Commits HEAD vorausgehen)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output direkt prüfen (Memory-Lehre `feedback_tsc_b_exit_misleading`).

**Vitest-Baseline:** **1454 passed** (aus Bundle W Merge `fe86536`). Drift-Erwartung **+18** (Phase 1: +3, Phase 2: +6, Phase 3: +5, Phase 4: +4 → 1472 final).

**`wc -l uebungsStore.ts` Tracking pro Phase:**
- P0 Baseline: 540 Z.
- P1 Ende: ≤ 538 Z. (-2)
- P2 Ende: ≤ 524 Z. (-14)
- P3 Ende: ≤ 516 Z. (-8)
- P4 Ende: ≤ 500 Z. (-18, Ziel ~498) — bei 495–500 Cut 5 erwogen, bei >500 escalate

---

## File Map

### Neue Files

| Datei | Größe ca. | Verantwortung |
|---|---:|---|
| `ExamLab/src/utils/ueben/fragetypGruppen.ts` | ~12 Z. | `SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][]` + `istSelbstbewertbar(typ): boolean` |
| `ExamLab/src/utils/ueben/fragetypGruppen.test.ts` | ~40 Z. | 3 Vitest-Tests (alle 5 selbst-Typen / nicht-selbst / readonly-Compile-Test) |
| `ExamLab/src/utils/ueben/sessionBlockBau.ts` | ~45 Z. | `erstelleSessionBlock({alleFragen, fach, thema, modus, quellen, fortschritte}) → { block, mastery }` byte-identisch aus uebungsStore.ts Z. 90–109 |
| `ExamLab/src/utils/ueben/sessionBlockBau.test.ts` | ~180 Z. | 6 Vitest-Tests (standard / mix / repetition mit Dauerbaustelle / repetition leer / mastery-Default / leere Fragen) |
| `ExamLab/src/utils/ueben/pruefeClientseitig.ts` | ~35 Z. | `pruefeClientseitig({session, frage, normalized}) → { korrekt, sessionUpdates, letzteMusterloesung }` |
| `ExamLab/src/utils/ueben/pruefeClientseitig.test.ts` | ~150 Z. | 5 Vitest-Tests (korrekt / falsch / musterloesung-pass-through / musterloesung-undefined / immutable-spread) |
| `ExamLab/src/utils/ueben/loesungsPreloadFetch.ts` | ~35 Z. | `async ladeLoesungenViaPreload({block, gruppeId, fachbereich, user}) → Promise<LoesungsMap>` |
| `ExamLab/src/utils/ueben/loesungsPreloadFetch.test.ts` | ~140 Z. | 4 Vitest-Tests (user-null / api-success / teilaufgaben-IDs / api-throws) |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/store/ueben/uebungsStore.ts` | 540 Z. | ≤ 500 Z. (Ziel ~498) | 4 Cut-Bereiche raus (Z. 90–109, Z. 116–139, Z. 264–284, Z. 263+382-Inline-Konstante), 4 Imports oben hinzu, ggf. 4 Imports raus (siehe Phase 2+4 Step 3) |

### Reihenfolge (Risiko-aufsteigend, Phase-Dependencies enforced)

1. **Phase 0**: Worktree + Branch verifizieren + Vitest-Baseline + wc -l Baseline
2. **Phase 1**: `fragetypGruppen.ts` + 3 Tests + 2 Use-Site-Edits in uebungsStore (kleinster Cut, dient Cut 3 als Voraussetzung)
3. **Phase 2**: `sessionBlockBau.ts` + 6 Tests + Store-Cut Z. 90–109
4. **Phase 3**: `pruefeClientseitig.ts` + 5 Tests + Store-Cut Z. 264–284 (nutzt Phase-1-Konstante)
5. **Phase 4**: `loesungsPreloadFetch.ts` + 4 Tests + Store-Cut Z. 116–139
6. **Phase 5**: Final Lint-Gates + Build + tsc Verify + wc -l Endmessung + Cut-5-Decision-Tree
7. **Phase 6**: Browser-E2E auf staging (preview push + manuelle E2E-Pfade)
8. **Phase 7**: Final Code-Reviewer + HANDOFF + Memory + Merge zu main

---

## Phase 0: Branch + Worktree-Setup

### Task 0.1: Worktree verifizieren

- [ ] **Step 1: Worktree erstellen vom existierenden Branch**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree add .worktrees/bundle-w-b-uebungsstore bundle-w-b/uebungsstore-state-refactor
```

Expected: `Preparing worktree (checking out 'bundle-w-b/uebungsstore-state-refactor')` + `HEAD is now at ce9d576 Bundle W.b Spec rev2: ...`.

- [ ] **Step 2: cd in Worktree und Status prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git status
git log --oneline -3
```

Expected: `On branch bundle-w-b/uebungsstore-state-refactor`, working tree clean. HEAD: `ce9d576 Bundle W.b Spec rev2: ...`. Vorhergehende Commits: `ced0d65 Bundle W.b Spec: ...` + `fe86536 Merge Bundle W: ...`.

(Memory-Regel `feedback_subagent_shell_context`: Implementer-Subagents müssen explizit `cd` ins Worktree-Verzeichnis machen — Bash-Tool resettet cwd zwischen Calls.)

- [ ] **Step 3: Vitest-Baseline verifizieren**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1454 passed | 4 todo | 1 skipped (1459)` (oder analog drift=0 zu Bundle W Merge `fe86536`). Falls Drift: STOP und untersuchen, bevor Bundle-W.b-Edits beginnen.

- [ ] **Step 4: Source-Datei vor Cut messen (Baseline-wc)**

```bash
wc -l src/store/ueben/uebungsStore.ts
```

Expected: `540 src/store/ueben/uebungsStore.ts`. Falls abweichend: STOP — Baseline-Annahme stimmt nicht, Spec re-evaluieren.

- [ ] **Step 5: Plan-Commit auf Branch ablegen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add docs/superpowers/plans/2026-05-08-bundle-w-b-uebungsstore-state-refactor.md
git commit -m "Bundle W.b Plan: uebungsStore State-Refactor Implementation"
```

Expected: Plan committed auf Branch (rein-Doku-Commit, kein Code).

---

## Phase 1: `fragetypGruppen.ts` (Konstante extrahieren)

**Ziel der Phase:** `SELBSTBEWERTBARE_TYPEN`-Array von 2 Inline-Stellen (Z. 263 + Z. 382) zu Single-Source-of-Truth in `utils/ueben/fragetypGruppen.ts` ziehen, mit 3 Vitest-Tests Coverage. **Voraussetzung für Phase 3** (Cut 3 nutzt die Konstante intern).

### Task 1.1: `fragetypGruppen.ts` erstellen (TDD: Test zuerst)

**Files:**
- Create: `ExamLab/src/utils/ueben/fragetypGruppen.test.ts`

- [ ] **Step 1: Test-Datei schreiben (failing)**

```typescript
// ExamLab/src/utils/ueben/fragetypGruppen.test.ts
import { describe, it, expect } from 'vitest'
import { SELBSTBEWERTBARE_TYPEN, istSelbstbewertbar } from './fragetypGruppen'
import type { Frage } from '../../types/ueben/fragen'

describe('fragetypGruppen', () => {
  describe('SELBSTBEWERTBARE_TYPEN', () => {
    it('enthält die 5 selbstbewertbaren Frage-Typen', () => {
      expect(SELBSTBEWERTBARE_TYPEN).toEqual(['freitext', 'visualisierung', 'pdf', 'audio', 'code'])
    })
  })

  describe('istSelbstbewertbar', () => {
    it('liefert true für alle 5 selbstbewertbaren Typen', () => {
      const selbst: Frage['typ'][] = ['freitext', 'visualisierung', 'pdf', 'audio', 'code']
      for (const t of selbst) {
        expect(istSelbstbewertbar(t)).toBe(true)
      }
    })

    it('liefert false für nicht-selbstbewertbare Typen', () => {
      const nichtSelbst: Frage['typ'][] = ['mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'sortierung', 'berechnung', 'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur', 'hotspot', 'bildbeschriftung', 'dragdrop_bild', 'formel', 'aufgabengruppe']
      for (const t of nichtSelbst) {
        expect(istSelbstbewertbar(t)).toBe(false)
      }
    })
  })
})
```

- [ ] **Step 2: Test laufen lassen — sollte failen (Modul nicht gefunden)**

```bash
cd ExamLab && npx vitest run src/utils/ueben/fragetypGruppen.test.ts 2>&1 | tail -10
```

Expected: FAIL mit `Cannot find module './fragetypGruppen'`.

- [ ] **Step 3: `fragetypGruppen.ts` schreiben (minimal-passend)**

```typescript
// ExamLab/src/utils/ueben/fragetypGruppen.ts
import type { Frage } from '../../types/ueben/fragen'

/**
 * Frage-Typen, deren Antwort vom SuS selbst bewertet wird (anstatt automatisch
 * via Server gegen Musterlösung). Genutzt im Üben-Modus zur Pfad-Auswahl
 * (clientseitige Auto-Korrektur vs. Self-Assessment-UI).
 */
export const SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][] = [
  'freitext',
  'visualisierung',
  'pdf',
  'audio',
  'code',
]

export function istSelbstbewertbar(typ: Frage['typ']): boolean {
  return SELBSTBEWERTBARE_TYPEN.includes(typ)
}
```

- [ ] **Step 4: Test laufen lassen — sollte passen**

```bash
cd ExamLab && npx vitest run src/utils/ueben/fragetypGruppen.test.ts 2>&1 | tail -10
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/utils/ueben/fragetypGruppen.ts ExamLab/src/utils/ueben/fragetypGruppen.test.ts
git commit -m "Bundle W.b Phase 1.1: fragetypGruppen.ts mit SELBSTBEWERTBARE_TYPEN + 3 Vitest"
```

### Task 1.2: 2 Use-Sites in uebungsStore.ts umstellen

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts` (3 Bereiche: Import oben + Z. 263 + Z. 382)

- [ ] **Step 1: uebungsStore.ts Import oben hinzufügen**

Einfügen nach existierendem `mergeLoesungen`-Import (etwa Z. 11):

```typescript
import { istSelbstbewertbar } from '../../utils/ueben/fragetypGruppen'
```

- [ ] **Step 2: Z. 263–264 umstellen**

Aktuell:
```typescript
const istSelbstbewertbar = ['freitext', 'visualisierung', 'pdf', 'audio', 'code'].includes(frage.typ)
if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar) {
```

Nachher:
```typescript
if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar(frage.typ)) {
```

(Inline-Konstante entfällt komplett — die `if`-Bedingung ruft den Helper direkt auf.)

- [ ] **Step 3: Z. 382–384 umstellen**

Aktuell:
```typescript
const istSelbstbewertbar = ['freitext', 'visualisierung', 'pdf', 'audio', 'code'].includes(basis.typ)
const antwort = istSelbstbewertbar
  ? ({ ...basis, selbstbewertung: bewertung } as Antwort)
  : basis
```

Nachher:
```typescript
const antwort = istSelbstbewertbar(basis.typ)
  ? ({ ...basis, selbstbewertung: bewertung } as Antwort)
  : basis
```

- [ ] **Step 4: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler. Falls tsc Probleme mit Discriminated-Union meldet (`basis.typ` Narrow-Type vs. `Frage['typ']`), prüfe ob `basis` korrekt typisiert ist (sollte `Antwort` sein, das Discriminated-Union enthält Frage-Typ als `typ`).

- [ ] **Step 5: Vitest-Run (alle Tests, +3 Drift)**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1457 passed` (+3 Drift). Bestehende `uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts` weiter grün.

- [ ] **Step 6: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
```

Expected: Alle 4 Gates clean.

- [ ] **Step 7: wc -l Check**

```bash
cd ExamLab && wc -l src/store/ueben/uebungsStore.ts
```

Expected: `538` (oder ≤ 538 — Saving -2 Z.).

- [ ] **Step 8: Build-Check**

```bash
cd ExamLab && npx vite build 2>&1 | tail -10
```

Expected: `✓ built in ~3s`, kein PWA-Warnung über generateSW.

- [ ] **Step 9: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/store/ueben/uebungsStore.ts
git commit -m "Bundle W.b Phase 1.2: 2 Use-Sites von istSelbstbewertbar auf Helper umstellen"
```

### Task 1.3: Per-Phase-Reviewer für Phase 1

- [ ] **Step 1: Spec-Compliance + Code-Quality-Reviewer dispatch**

Reviewer-Prompt: Phase 1 vollständig (`fragetypGruppen.ts` + Test + 2 Use-Site-Edits in uebungsStore). Prüfen: Spec § 3 Cut 1 byte-identisch umgesetzt, keine zusätzlichen Änderungen, alle DoD-Kriterien (vitest +3, tsc clean, 4 Lint-Gates, wc -l ≤ 538) erfüllt.

Falls APPROVED → Phase 2. Falls Issues → fix + re-dispatch (max 3 Iterationen).

---

## Phase 2: `sessionBlockBau.ts` (Block-Bau extrahieren)

**Ziel der Phase:** Mastery-Loop + Block-Switch (uebungsStore.ts Z. 90–109) byte-identisch nach `utils/ueben/sessionBlockBau.ts` ziehen, mit 6 Vitest-Tests. Helper bekommt `fortschritte` als Args-Input (DI), Store-Body liest fortschritte vorher und übergibt.

### Task 2.1: `sessionBlockBau.ts` erstellen (TDD: Test zuerst)

**Files:**
- Create: `ExamLab/src/utils/ueben/sessionBlockBau.test.ts`

- [ ] **Step 1: Test-Datei schreiben (failing)**

```typescript
// ExamLab/src/utils/ueben/sessionBlockBau.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'

vi.mock('./blockBuilder', () => ({
  erstelleBlock: vi.fn(),
  erstelleMixBlock: vi.fn(),
  erstelleRepetitionsBlock: vi.fn(),
}))
vi.mock('./mastery', () => ({
  istDauerbaustelle: vi.fn(),
}))

import { erstelleSessionBlock } from './sessionBlockBau'
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from './blockBuilder'
import { istDauerbaustelle } from './mastery'

const mkFrage = (id: string): Frage => ({
  id,
  typ: 'mc',
  frage: 'Test',
  fachbereich: 'wr',
} as unknown as Frage)

const mkFortschritt = (overrides: Partial<FragenFortschritt> = {}): FragenFortschritt => ({
  fragenId: 'q1',
  email: 'test@example.com',
  versuche: 0,
  richtig: 0,
  richtigInFolge: 0,
  sessionIds: [],
  letzterVersuch: '',
  mastery: 'neu',
  ...overrides,
})

describe('erstelleSessionBlock', () => {
  beforeEach(() => {
    vi.mocked(erstelleBlock).mockReturnValue([mkFrage('q1')])
    vi.mocked(erstelleMixBlock).mockReturnValue([mkFrage('q2')])
    vi.mocked(erstelleRepetitionsBlock).mockReturnValue([mkFrage('q3')])
    vi.mocked(istDauerbaustelle).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('modus=standard ruft erstelleBlock mit thema und mastery', () => {
    const fragen = [mkFrage('q1')]
    erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'Doppelte-Buchhaltung',
      modus: 'standard',
      quellen: undefined,
      fortschritte: { q1: mkFortschritt({ fragenId: 'q1', mastery: 'gefestigt' }) },
    })
    expect(erstelleBlock).toHaveBeenCalledWith(
      fragen,
      'Doppelte-Buchhaltung',
      { mastery: { q1: 'gefestigt' } },
    )
  })

  it('modus=mix mit quellen ruft erstelleMixBlock', () => {
    const fragen = [mkFrage('q1')]
    erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'Mix',
      modus: 'mix',
      quellen: [{ fach: 'wr', thema: 'A' }],
      fortschritte: {},
    })
    expect(erstelleMixBlock).toHaveBeenCalled()
    expect(erstelleBlock).not.toHaveBeenCalled()
  })

  it('modus=repetition mit Dauerbaustelle propagiert ID in dauerBau-Set', () => {
    const fragen = [mkFrage('q1'), mkFrage('q2')]
    vi.mocked(istDauerbaustelle).mockImplementation((versuche: number, _richtig: number) => versuche >= 5)
    erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'Rep',
      modus: 'repetition',
      quellen: undefined,
      fortschritte: {
        q1: mkFortschritt({ fragenId: 'q1', versuche: 5, richtig: 1 }),
        q2: mkFortschritt({ fragenId: 'q2', versuche: 1, richtig: 1 }),
      },
    })
    expect(erstelleRepetitionsBlock).toHaveBeenCalled()
    const aufruf = vi.mocked(erstelleRepetitionsBlock).mock.calls[0]
    const dauerBau = aufruf[2] as Set<string>
    expect(dauerBau.has('q1')).toBe(true)
    expect(dauerBau.has('q2')).toBe(false)
  })

  it('modus=repetition ohne Dauerbaustellen ruft erstelleRepetitionsBlock mit leerem Set', () => {
    erstelleSessionBlock({
      alleFragen: [mkFrage('q1')],
      fach: 'wr',
      thema: 'Rep',
      modus: 'repetition',
      quellen: undefined,
      fortschritte: { q1: mkFortschritt({ fragenId: 'q1', versuche: 1, richtig: 1 }) },
    })
    const aufruf = vi.mocked(erstelleRepetitionsBlock).mock.calls[0]
    const dauerBau = aufruf[2] as Set<string>
    expect(dauerBau.size).toBe(0)
  })

  it('mastery-Map wird aus fortschritte gefüllt; fehlende IDs default neu', () => {
    const fragen = [mkFrage('q1'), mkFrage('q2')]
    const result = erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'X',
      modus: 'standard',
      quellen: undefined,
      fortschritte: { q1: mkFortschritt({ fragenId: 'q1', mastery: 'gemeistert' }) },
    })
    expect(result.mastery).toEqual({ q1: 'gemeistert', q2: 'neu' })
  })

  it('leere alleFragen liefert leeren Block + leere mastery-Map', () => {
    vi.mocked(erstelleBlock).mockReturnValue([])
    const result = erstelleSessionBlock({
      alleFragen: [],
      fach: 'wr',
      thema: 'X',
      modus: 'standard',
      quellen: undefined,
      fortschritte: {},
    })
    expect(result.block).toEqual([])
    expect(result.mastery).toEqual({})
  })
})
```

- [ ] **Step 2: Test laufen lassen — sollte failen**

```bash
cd ExamLab && npx vitest run src/utils/ueben/sessionBlockBau.test.ts 2>&1 | tail -10
```

Expected: FAIL mit `Cannot find module './sessionBlockBau'`.

- [ ] **Step 3: `sessionBlockBau.ts` schreiben**

```typescript
// ExamLab/src/utils/ueben/sessionBlockBau.ts
import type { Frage } from '../../types/ueben/fragen'
import type { SessionModus, ThemaQuelle } from '../../types/ueben/uebung'
import type { MasteryStufe, FragenFortschritt } from '../../types/ueben/fortschritt'
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from './blockBuilder'
import { istDauerbaustelle } from './mastery'

interface ErstelleSessionBlockArgs {
  alleFragen: Frage[]
  fach: string
  thema: string
  modus: SessionModus
  quellen: ThemaQuelle[] | undefined
  fortschritte: Record<string, FragenFortschritt>
}

/**
 * Erzeugt Session-Block + mastery-Map aus alleFragen + Konfiguration.
 * Pure: keine Store-Mutationen, keine Side-Effects. Side-Effect-freie
 * Logik aus uebungsStore.starteSession ausgelagert (Bundle W.b Cut 2).
 */
export function erstelleSessionBlock(
  args: ErstelleSessionBlockArgs,
): { block: Frage[]; mastery: Record<string, MasteryStufe> } {
  const { alleFragen, thema, modus, quellen, fortschritte } = args

  const mastery: Record<string, MasteryStufe> = {}
  for (const f of alleFragen) {
    mastery[f.id] = fortschritte[f.id]?.mastery || 'neu'
  }

  let block: Frage[]
  if (modus === 'mix' && quellen) {
    block = erstelleMixBlock(alleFragen, quellen, { mastery })
  } else if (modus === 'repetition') {
    const dauerBau = new Set<string>()
    for (const [id, fp] of Object.entries(fortschritte)) {
      if (istDauerbaustelle(fp.versuche, fp.richtig)) dauerBau.add(id)
    }
    block = erstelleRepetitionsBlock(alleFragen, mastery, dauerBau)
  } else {
    block = erstelleBlock(alleFragen, thema, { mastery })
  }

  return { block, mastery }
}
```

- [ ] **Step 4: Test laufen lassen — sollte passen**

```bash
cd ExamLab && npx vitest run src/utils/ueben/sessionBlockBau.test.ts 2>&1 | tail -10
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/utils/ueben/sessionBlockBau.ts ExamLab/src/utils/ueben/sessionBlockBau.test.ts
git commit -m "Bundle W.b Phase 2.1: sessionBlockBau.ts mit erstelleSessionBlock + 6 Vitest"
```

### Task 2.2: uebungsStore.ts Z. 90–109 ersetzen

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts` (Import oben + Z. 90–109 + ggf. obsolete Imports raus)

- [ ] **Step 1: Import oben hinzufügen**

Einfügen nach `import { istSelbstbewertbar } ...` (aus Phase 1):

```typescript
import { erstelleSessionBlock } from '../../utils/ueben/sessionBlockBau'
```

- [ ] **Step 2: Z. 90–109 ersetzen**

Aktuell (uebungsStore.ts Z. 90–109):
```typescript
const fortschritte = useUebenFortschrittStore.getState().fortschritte
const mastery: Record<string, MasteryStufe> = {}
for (const f of alleFragen) {
  mastery[f.id] = fortschritte[f.id]?.mastery || 'neu'
}

// Block erstellen je nach Modus
let block: Frage[]
if (modus === 'mix' && quellen) {
  block = erstelleMixBlock(alleFragen, quellen, { mastery })
} else if (modus === 'repetition') {
  // Dauerbaustellen ermitteln
  const dauerBau = new Set<string>()
  for (const [id, fp] of Object.entries(fortschritte)) {
    if (istDauerbaustelle(fp.versuche, fp.richtig)) dauerBau.add(id)
  }
  block = erstelleRepetitionsBlock(alleFragen, mastery, dauerBau)
} else {
  block = erstelleBlock(alleFragen, thema, { mastery })
}
```

Nachher:
```typescript
const fortschritte = useUebenFortschrittStore.getState().fortschritte
const { block } = erstelleSessionBlock({
  alleFragen, fach, thema, modus, quellen, fortschritte,
})
```

- [ ] **Step 3: Obsolete Imports oben in uebungsStore.ts entfernen (grep-verifiziert)**

Diese Imports werden im Store-Body **nur** in Z. 90–109 genutzt (jetzt ausgelagert). Vor dem Entfernen prüfen:

```bash
cd ExamLab && grep -n "erstelleBlock\|erstelleMixBlock\|erstelleRepetitionsBlock\|istDauerbaustelle\|MasteryStufe" src/store/ueben/uebungsStore.ts
```

Expected: Nur Treffer in Import-Zeilen oben. Falls weitere Treffer im Store-Body: Imports BEHALTEN. Falls keine: Imports entfernen.

Zu entfernende Zeilen (falls grep-Verifikation positiv):
```typescript
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from '../../utils/ueben/blockBuilder'
import { istDauerbaustelle } from '../../utils/ueben/mastery'
import type { MasteryStufe } from '../../types/ueben/fortschritt'
```

- [ ] **Step 4: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler. Falls "imported but not used"-Warning für entfernte Imports: hat schon der Lint:as-any-Gate gemeckert? Prüfen.

- [ ] **Step 5: Vitest-Run**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1463 passed` (Phase 1 +3 + Phase 2 +6 = 1463).

- [ ] **Step 6: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
```

Expected: Alle 4 Gates clean.

- [ ] **Step 7: wc -l Check**

```bash
cd ExamLab && wc -l src/store/ueben/uebungsStore.ts
```

Expected: `≤ 524` (Saving Phase 2: -14 Z., kumuliert -16 von 540).

- [ ] **Step 8: Build-Check**

```bash
cd ExamLab && npx vite build 2>&1 | tail -10
```

Expected: `✓ built in ~3s`.

- [ ] **Step 9: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/store/ueben/uebungsStore.ts
git commit -m "Bundle W.b Phase 2.2: starteSession nutzt erstelleSessionBlock-Helper"
```

### Task 2.3: Per-Phase-Reviewer für Phase 2

- [ ] **Step 1: Spec-Compliance + Code-Quality-Reviewer dispatch**

Reviewer-Prompt: Phase 2 vollständig (`sessionBlockBau.ts` + Test + Store-Edit + obsolete Imports). Prüfen: Spec § 3 Cut 2 byte-identisch umgesetzt, mastery-Default `'neu'` preserved, alle DoD-Kriterien (vitest 1463, tsc clean, 4 Lint-Gates, wc -l ≤ 524) erfüllt.

Falls APPROVED → Phase 3. Falls Issues → fix + re-dispatch (max 3 Iterationen).

---

## Phase 3: `pruefeClientseitig.ts` (Pre-Load-Fast-Path extrahieren)

**Ziel der Phase:** Pre-Load-Korrektur-Body (uebungsStore.ts Z. 264–284) als pure Compute-Helper extrahieren. Side-Effect (`fortschritt.antwortVerarbeiten`) und `set()`-Call bleiben **explizit** im Store-Action. **Voraussetzung:** Phase 1 (Cut 3 nutzt `istSelbstbewertbar`-Konstante intern bereits).

### Task 3.1: `pruefeClientseitig.ts` erstellen (TDD)

**Files:**
- Create: `ExamLab/src/utils/ueben/pruefeClientseitig.test.ts`

- [ ] **Step 1: Test-Datei schreiben (failing)**

```typescript
// ExamLab/src/utils/ueben/pruefeClientseitig.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import type { UebungsSession } from '../../types/ueben/uebung'

vi.mock('./korrektur', () => ({
  pruefeAntwort: vi.fn(),
}))

import { pruefeClientseitig } from './pruefeClientseitig'
import { pruefeAntwort } from './korrektur'

const mkFrage = (overrides: Partial<Frage> = {}): Frage => ({
  id: 'q1',
  typ: 'mc',
  frage: 'Test',
  fachbereich: 'wr',
  ...overrides,
} as unknown as Frage)

const mkSession = (overrides: Partial<UebungsSession> = {}): UebungsSession => ({
  id: 's_test',
  gruppeId: 'g1',
  email: 'test@example.com',
  fach: 'wr',
  thema: 'X',
  modus: 'standard',
  quellen: undefined,
  fragen: [],
  antworten: {},
  ergebnisse: {},
  aktuelleFrageIndex: 0,
  gestartet: '2026-01-01T00:00:00.000Z',
  unsicher: new Set(),
  uebersprungen: new Set(),
  score: 5,
  freiwillig: false,
  ...overrides,
})

const mkMcAntwort = (gewaehlt: string[]): Antwort => ({ typ: 'mc', gewaehlteOptionen: gewaehlt })

describe('pruefeClientseitig', () => {
  beforeEach(() => {
    vi.mocked(pruefeAntwort).mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('korrekt=true: score wird incrementiert + ergebnisse[id]=true', () => {
    const session = mkSession({ score: 5 })
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.korrekt).toBe(true)
    expect(result.sessionUpdates.score).toBe(6)
    expect(result.sessionUpdates.ergebnisse).toEqual({ q1: true })
  })

  it('korrekt=false: score unverändert + ergebnisse[id]=false', () => {
    vi.mocked(pruefeAntwort).mockReturnValue(false)
    const session = mkSession({ score: 5 })
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.korrekt).toBe(false)
    expect(result.sessionUpdates.score).toBe(5)
    expect(result.sessionUpdates.ergebnisse).toEqual({ q1: false })
  })

  it('letzteMusterloesung übernommen aus frage.musterlosung', () => {
    const session = mkSession()
    const frage = mkFrage({ musterlosung: 'Antwort: A' } as unknown as Frage)
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.letzteMusterloesung).toBe('Antwort: A')
  })

  it('letzteMusterloesung=null falls frage.musterlosung undefined', () => {
    const session = mkSession()
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.letzteMusterloesung).toBe(null)
  })

  it('sessionUpdates.antworten ist immutable (alte Antworten preserved)', () => {
    const altAntwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['old'] }
    const session = mkSession({ antworten: { q0: altAntwort } })
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['new'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.sessionUpdates.antworten).toEqual({ q0: altAntwort, q1: antwort })
    // Original session.antworten unverändert
    expect(session.antworten).toEqual({ q0: altAntwort })
  })
})
```

- [ ] **Step 2: Test laufen lassen — failing**

```bash
cd ExamLab && npx vitest run src/utils/ueben/pruefeClientseitig.test.ts 2>&1 | tail -10
```

Expected: FAIL `Cannot find module './pruefeClientseitig'`.

- [ ] **Step 3: `pruefeClientseitig.ts` schreiben**

```typescript
// ExamLab/src/utils/ueben/pruefeClientseitig.ts
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import type { UebungsSession } from '../../types/ueben/uebung'
import { pruefeAntwort } from './korrektur'

interface PruefeClientseitigArgs {
  session: UebungsSession
  frage: Frage
  normalized: Antwort
}

export interface PruefeClientseitigResult {
  korrekt: boolean
  sessionUpdates: Pick<UebungsSession, 'antworten' | 'ergebnisse' | 'score'>
  letzteMusterloesung: string | null
}

/**
 * Clientseitige Korrektur via Pre-Load-Lösung (Bundle Ü-Pfad).
 * Reine Berechnung — Side-Effects (Fortschritt-Tracking, set()-Call) bleiben
 * im Store-Action (uebungsStore.pruefeAntwortJetzt).
 */
export function pruefeClientseitig(args: PruefeClientseitigArgs): PruefeClientseitigResult {
  const { session, frage, normalized } = args
  const korrekt = pruefeAntwort(frage, normalized)
  return {
    korrekt,
    sessionUpdates: {
      antworten: { ...session.antworten, [frage.id]: normalized },
      ergebnisse: { ...session.ergebnisse, [frage.id]: korrekt },
      score: session.score + (korrekt ? 1 : 0),
    },
    letzteMusterloesung: frage.musterlosung ?? null,
  }
}
```

- [ ] **Step 4: Test laufen lassen — sollte passen**

```bash
cd ExamLab && npx vitest run src/utils/ueben/pruefeClientseitig.test.ts 2>&1 | tail -10
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/utils/ueben/pruefeClientseitig.ts ExamLab/src/utils/ueben/pruefeClientseitig.test.ts
git commit -m "Bundle W.b Phase 3.1: pruefeClientseitig.ts mit pure Helper + 5 Vitest"
```

### Task 3.2: uebungsStore.ts Z. 264–284 ersetzen

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`

- [ ] **Step 1: Import oben hinzufügen**

Nach `erstelleSessionBlock`-Import (aus Phase 2):

```typescript
import { pruefeClientseitig } from '../../utils/ueben/pruefeClientseitig'
```

- [ ] **Step 2: Z. 264–284 ersetzen (Pre-Load-Fast-Path)**

Aktuell (innerhalb pruefeAntwortJetzt, vor `// Sofort speichertPruefung markieren ...`):
```typescript
if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar(frage.typ)) {
  const korrekt = pruefeAntwort(frage, normalized)
  if (!session.freiwillig) {
    useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, korrekt, session.id)
  }
  set({
    session: {
      ...session,
      antworten: { ...session.antworten, [frageId]: normalized },
      ergebnisse: { ...session.ergebnisse, [frageId]: korrekt },
      score: session.score + (korrekt ? 1 : 0),
    },
    speichertPruefung: false,
    pruefFehler: null,
    feedbackSichtbar: true,
    letzteAntwortKorrekt: korrekt,
    // musterlosung ist bereits in frage.musterlosung gemerged (mergeLoesungInFrage)
    letzteMusterloesung: frage.musterlosung ?? null,
  })
  return
}
```

Nachher:
```typescript
if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar(frage.typ)) {
  const result = pruefeClientseitig({ session, frage, normalized })
  if (!session.freiwillig) {
    useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, result.korrekt, session.id)
  }
  set({
    session: { ...session, ...result.sessionUpdates },
    speichertPruefung: false,
    pruefFehler: null,
    feedbackSichtbar: true,
    letzteAntwortKorrekt: result.korrekt,
    letzteMusterloesung: result.letzteMusterloesung,
  })
  return
}
```

**Hinweis:** `pruefeAntwort`-Import (Z. 9 in uebungsStore.ts) bleibt — wird in `beantworteById` Z. 216 weiter direkt genutzt.

- [ ] **Step 3: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler.

- [ ] **Step 4: Vitest-Run (alle Tests)**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1468 passed` (Phase 1+2 +9 + Phase 3 +5 = 1468). Bestehende `uebungsStorePruefen.test.ts` weiter grün — kritisch, weil dieser Test den Server-Pfad UND den Pre-Load-Pfad direkt stresst.

- [ ] **Step 5: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
```

Expected: Alle 4 Gates clean.

- [ ] **Step 6: wc -l Check**

```bash
cd ExamLab && wc -l src/store/ueben/uebungsStore.ts
```

Expected: `≤ 516` (Phase 3 -8 Z., kumuliert -24).

- [ ] **Step 7: Build-Check**

```bash
cd ExamLab && npx vite build 2>&1 | tail -10
```

Expected: `✓ built`.

- [ ] **Step 8: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/store/ueben/uebungsStore.ts
git commit -m "Bundle W.b Phase 3.2: pruefeAntwortJetzt nutzt pruefeClientseitig-Helper"
```

### Task 3.3: Per-Phase-Reviewer für Phase 3

- [ ] **Step 1: Spec-Compliance + Code-Quality-Reviewer dispatch**

Reviewer-Prompt: Phase 3 vollständig (`pruefeClientseitig.ts` + Test + Store-Edit). Prüfen: **Side-Effect-Aufteilung explizit korrekt** (`useUebenFortschrittStore.getState().antwortVerarbeiten` bleibt im Store-Action, NICHT im Helper). Spec § 3 Cut 3 byte-identisch umgesetzt. DoD: vitest 1468, tsc clean, 4 Lint-Gates, wc -l ≤ 516.

Falls APPROVED → Phase 4. Falls Issues → fix + re-dispatch (max 3 Iterationen).

---

## Phase 4: `loesungsPreloadFetch.ts` (Async-Pure-Helper extrahieren)

**Ziel der Phase:** Lösungs-Preload-API-Call (uebungsStore.ts Z. 116–139) als async-pure Helper extrahieren. Dynamic-Import von `./authStore` bleibt **explizit im Store-Action** — Helper bekommt `user` als Parameter (DI).

### Task 4.1: `loesungsPreloadFetch.ts` erstellen (TDD)

**Files:**
- Create: `ExamLab/src/utils/ueben/loesungsPreloadFetch.test.ts`

- [ ] **Step 1: Test-Datei schreiben (failing)**

```typescript
// ExamLab/src/utils/ueben/loesungsPreloadFetch.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsMap } from '../../types/ueben/loesung'

vi.mock('../../services/uebenLoesungsApi', () => ({
  ladeLoesungenApi: vi.fn(),
}))

import { ladeLoesungenViaPreload } from './loesungsPreloadFetch'
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'

const mkFrage = (id: string, teilaufgaben?: Frage[]): Frage => ({
  id,
  typ: 'mc',
  frage: 'Test',
  fachbereich: 'wr',
  ...(teilaufgaben ? { teilaufgaben } : {}),
} as unknown as Frage)

describe('ladeLoesungenViaPreload', () => {
  beforeEach(() => {
    vi.mocked(ladeLoesungenApi).mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('user=null → leere LoesungsMap ohne API-Call', async () => {
    const result = await ladeLoesungenViaPreload({
      block: [mkFrage('q1')],
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: null,
    })
    expect(result).toEqual({})
    expect(ladeLoesungenApi).not.toHaveBeenCalled()
  })

  it('user.sessionToken gesetzt + API-Erfolg → returns LoesungsMap', async () => {
    const apiResult: LoesungsMap = { q1: { musterlosung: 'A' } as unknown as LoesungsMap[string] }
    vi.mocked(ladeLoesungenApi).mockResolvedValue(apiResult)
    const result = await ladeLoesungenViaPreload({
      block: [mkFrage('q1')],
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: { email: 'sus@example.com', sessionToken: 'tok' },
    })
    expect(result).toEqual(apiResult)
    expect(ladeLoesungenApi).toHaveBeenCalledWith({
      gruppeId: 'g1',
      fragenIds: ['q1'],
      email: 'sus@example.com',
      token: 'tok',
      fachbereich: 'wr',
    })
  })

  it('teilaufgaben-IDs werden in fragenIds aufgenommen', async () => {
    const sub1 = mkFrage('sub1')
    const sub2 = mkFrage('sub2')
    const block = [mkFrage('q1', [sub1, sub2]), mkFrage('q2')]
    await ladeLoesungenViaPreload({
      block,
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: { email: 'sus@example.com', sessionToken: 'tok' },
    })
    const aufruf = vi.mocked(ladeLoesungenApi).mock.calls[0][0]
    expect(aufruf.fragenIds).toEqual(['q1', 'q2', 'sub1', 'sub2'])
  })

  it('API wirft Error → returns leere Map + console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(ladeLoesungenApi).mockRejectedValue(new Error('Server-Fehler'))
    const result = await ladeLoesungenViaPreload({
      block: [mkFrage('q1')],
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: { email: 'sus@example.com', sessionToken: 'tok' },
    })
    expect(result).toEqual({})
    expect(warnSpy).toHaveBeenCalledWith(
      '[uebungsStore] Lösungs-Preload fehlgeschlagen:',
      expect.any(Error),
    )
  })
})
```

- [ ] **Step 2: Test laufen lassen — failing**

```bash
cd ExamLab && npx vitest run src/utils/ueben/loesungsPreloadFetch.test.ts 2>&1 | tail -10
```

Expected: FAIL `Cannot find module './loesungsPreloadFetch'`.

- [ ] **Step 3: `loesungsPreloadFetch.ts` schreiben**

```typescript
// ExamLab/src/utils/ueben/loesungsPreloadFetch.ts
import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsMap } from '../../types/ueben/loesung'
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'

interface LadeLoesungenViaPreloadArgs {
  block: Frage[]
  gruppeId: string
  fachbereich: string
  user: { email: string; sessionToken: string } | null
}

/**
 * Lädt Musterlösungen aller Fragen (inkl. Teilaufgaben) im Block via
 * separatem Endpoint (Bundle Ü). Bei fehlendem User oder API-Fehler:
 * leere Map zurück (Caller fällt auf Server-Korrektur pro Frage zurück).
 *
 * Pure-async: kein Store-Zugriff, kein dynamic-import. Caller injiziert
 * `user` aus authStore.
 */
export async function ladeLoesungenViaPreload(
  args: LadeLoesungenViaPreloadArgs,
): Promise<LoesungsMap> {
  const { block, gruppeId, fachbereich, user } = args
  if (!user?.sessionToken) return {}

  const fragenIds = block.map((f) => f.id)
  for (const f of block) {
    const ta = (f as Frage & { teilaufgaben?: Frage[] }).teilaufgaben
    if (Array.isArray(ta)) for (const t of ta) fragenIds.push(t.id)
  }

  try {
    return await ladeLoesungenApi({
      gruppeId,
      fragenIds,
      email: user.email,
      token: user.sessionToken,
      fachbereich,
    })
  } catch (e) {
    console.warn('[uebungsStore] Lösungs-Preload fehlgeschlagen:', e)
    return {}
  }
}
```

- [ ] **Step 4: Test laufen lassen — sollte passen**

```bash
cd ExamLab && npx vitest run src/utils/ueben/loesungsPreloadFetch.test.ts 2>&1 | tail -10
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/utils/ueben/loesungsPreloadFetch.ts ExamLab/src/utils/ueben/loesungsPreloadFetch.test.ts
git commit -m "Bundle W.b Phase 4.1: loesungsPreloadFetch.ts mit async-pure Helper + 4 Vitest"
```

### Task 4.2: uebungsStore.ts Z. 116–139 ersetzen

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`

- [ ] **Step 1: Import oben hinzufügen**

Nach `pruefeClientseitig`-Import (aus Phase 3):

```typescript
import { ladeLoesungenViaPreload } from '../../utils/ueben/loesungsPreloadFetch'
```

- [ ] **Step 2: Z. 116–139 ersetzen**

Aktuell (innerhalb starteSession):
```typescript
// Lösungs-Preload via separatem Endpoint (Bundle Ü).
// Bei Erfolg: Lösungen in Frage-Objekte mergen, clientseitige Korrektur möglich.
// Bei Fehler oder Lücken: pro-Frage-Fallback auf pruefeAntwortJetzt().
let loesungen: LoesungsMap = {}
try {
  const { useUebenAuthStore } = await import('./authStore')
  const user = useUebenAuthStore.getState().user
  if (user?.sessionToken) {
    const fragenIds = block.map((f) => f.id)
    for (const f of block) {
      const ta = (f as Frage & { teilaufgaben?: Frage[] }).teilaufgaben
      if (Array.isArray(ta)) for (const t of ta) fragenIds.push(t.id)
    }
    loesungen = await ladeLoesungenApi({
      gruppeId,
      fragenIds,
      email: user.email,
      token: user.sessionToken,
      fachbereich: fach,
    })
  }
} catch (e) {
  console.warn('[uebungsStore] Lösungs-Preload fehlgeschlagen:', e)
}
```

Nachher:
```typescript
// Lösungs-Preload via separatem Endpoint (Bundle Ü).
// Bei Erfolg: Lösungen in Frage-Objekte mergen, clientseitige Korrektur möglich.
// Bei Fehler oder Lücken: pro-Frage-Fallback auf pruefeAntwortJetzt().
const { useUebenAuthStore } = await import('./authStore')
const user = useUebenAuthStore.getState().user ?? null
const loesungen = await ladeLoesungenViaPreload({
  block, gruppeId, fachbereich: fach, user,
})
```

**Hinweis zur Type-Anpassung `user`:** `useUebenAuthStore.getState().user` kann je nach Type `User | null | undefined` sein. Helper erwartet `{ email; sessionToken } | null`. `user ?? null` macht das robust falls Auth-Store `undefined` zurückgibt. Falls TypeScript strict-Null-Checks streiken (User-Type hat strenge Required-Felder), wrappe mit Type-Assertion oder Strukturierung — aber **keine** Logik-Änderung.

- [ ] **Step 3: Obsolete Imports entfernen (grep-verifiziert)**

```bash
cd ExamLab && grep -n "ladeLoesungenApi\|LoesungsMap" src/store/ueben/uebungsStore.ts
```

Erwartete Treffer:
- `ladeLoesungenApi`: NUR Import oben (Body-Aufrufe nun via Helper) → **entfernen** falls keine andere Body-Stelle.
- `LoesungsMap`: prüfen ob noch im Body genutzt (z.B. als Param-Type von `mergeLoesungen` Output). Falls kein Body-Treffer mehr → entfernen, sonst behalten.

Ggf. zu entfernende Zeilen:
```typescript
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'
import type { LoesungsMap } from '../../types/ueben/loesung'  // nur falls grep-frei
```

- [ ] **Step 4: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```

Expected: Keine Fehler.

- [ ] **Step 5: Vitest-Run**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1472 passed` (kumulativ +18). Bestehende `uebungsStoreLoesungsPreload.test.ts` weiter grün.

- [ ] **Step 6: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
```

Expected: Alle 4 Gates clean.

- [ ] **Step 7: wc -l Check (kritisch — Final-Margin)**

```bash
cd ExamLab && wc -l src/store/ueben/uebungsStore.ts
```

**Decision-Tree (Spec § 3):**
- **≤ 495:** ✅ Done, Margin komfortabel.
- **496–500:** ✅ Done, aber Margin sehr eng. Cut 5 (Server-Response Z. 326–363) als Spawn-Task notieren falls Linting in Zukunft strikt 500 erzwingt.
- **501–505:** ⚠️ STOP. Cut 5 nachschieben (Phase 4b — Plan dynamisch erweitern). Plan-Reviewer konsultieren.
- **>505:** ❌ STOP. Plan-Annahme stimmt nicht — User konsultieren.

- [ ] **Step 8: Build-Check**

```bash
cd ExamLab && npx vite build 2>&1 | tail -10
```

Expected: `✓ built`.

- [ ] **Step 9: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git add ExamLab/src/store/ueben/uebungsStore.ts
git commit -m "Bundle W.b Phase 4.2: starteSession nutzt ladeLoesungenViaPreload-Helper"
```

### Task 4.3: Per-Phase-Reviewer für Phase 4

- [ ] **Step 1: Spec-Compliance + Code-Quality-Reviewer dispatch**

Reviewer-Prompt: Phase 4 vollständig (`loesungsPreloadFetch.ts` + Test + Store-Edit). Prüfen: **Dynamic-Import-Aufteilung explizit korrekt** (`await import('./authStore')` bleibt im Store-Action, NICHT im Helper). Spec § 3 Cut 4 byte-identisch umgesetzt. DoD: vitest 1472, tsc clean, 4 Lint-Gates, wc -l Decision-Tree ausgeführt.

Falls APPROVED → Phase 5. Falls Issues → fix + re-dispatch (max 3 Iterationen).

---

## Phase 5: Final Verification

### Task 5.1: Hotspot-Bilanz prüfen

- [ ] **Step 1: Files >500 Z. zählen (ohne data/+test/)**

```bash
cd ExamLab && find src \( -name "*.ts" -o -name "*.tsx" \) | grep -v "/data/" | grep -v "/__tests__/" | grep -v ".test." | xargs wc -l 2>/dev/null | awk '$1 > 500 {print}' | sort -rn
```

Expected: 9 Files (Bundle W endete bei 10 — nach W.b sollte uebungsStore.ts ≤ 500 raus sein).

Falls 10 oder mehr: Liste zeigen, prüfen ob `uebungsStore.ts` >500 ist (dann Phase 4 Decision-Tree triggern).

### Task 5.2: Kompletten Branch verifizieren

- [ ] **Step 1: Final tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc-final.log | tail -10
```

Expected: Keine Fehler. Output direkt prüfen (Memory-Lehre).

- [ ] **Step 2: Final Vitest-Run**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1472 passed | 4 todo | 1 skipped` (Drift +18 von 1454).

- [ ] **Step 3: Final 4 Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
```

Expected: Alle clean.

- [ ] **Step 4: Final Build**

```bash
cd ExamLab && npx vite build 2>&1 | tail -10
```

Expected: `✓ built in ~3s`, PWA generateSW OK.

- [ ] **Step 5: Final wc -l Bilanz**

```bash
cd ExamLab && wc -l src/store/ueben/uebungsStore.ts src/utils/ueben/fragetypGruppen.ts src/utils/ueben/sessionBlockBau.ts src/utils/ueben/pruefeClientseitig.ts src/utils/ueben/loesungsPreloadFetch.ts
```

Expected: uebungsStore.ts ≤ 500, 4 neue Files je ~10–45 Z.

- [ ] **Step 6: Bestehende Tests Smoke**

```bash
cd ExamLab && npx vitest run src/tests/uebungsStorePruefen.test.ts src/tests/uebungsStoreLoesungsPreload.test.ts 2>&1 | tail -5
```

Expected: Beide Test-Files PASS — kritischer Sicherungsnetz-Check.

### Task 5.3: Final Code-Reviewer

- [ ] **Step 1: Final Code-Reviewer (Branch komplett) dispatch**

Reviewer-Prompt: Branch `bundle-w-b/uebungsstore-state-refactor` vollständig prüfen gegen Spec `2026-05-08-bundle-w-b-uebungsstore-state-refactor-design.md`. Prüfen: alle 4 Cuts byte-identisch, Side-Effect-Aufteilung Cut 3+4 korrekt, Konsumenten-Surface unverändert, alle DoD-Kriterien (vitest 1472, wc -l ≤ 500, Hotspot 10→9, 4 Lint-Gates).

Falls APPROVED FOR MERGE → Phase 6 (E2E + Merge). Falls Issues → fix + re-dispatch.

---

## Phase 6: Browser-E2E auf staging

### Task 6.1: Preview-Branch updaten

- [ ] **Step 1: preview-Branch prüfen (Memory-Lehre `feedback_preview_forcepush`)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-b-uebungsstore"
git fetch origin preview
git log preview ^bundle-w-b/uebungsstore-state-refactor --oneline 2>&1 | head -10
```

Expected: Leere Output (preview hat keine Commits ahead von Bundle-W.b-Branch). Falls Commits: STOP — preview hat Work-in-Progress, force-push würde überschreiben. User konsultieren.

- [ ] **Step 2: Force-with-lease push to preview**

```bash
git push --force-with-lease origin bundle-w-b/uebungsstore-state-refactor:preview
```

Expected: Successful update, GitHub Pages Deploy startet automatisch.

- [ ] **Step 3: Pages-Deploy abwarten**

GitHub Pages-Build dauert ~3–5 Min. Prüfen via:
```bash
gh run list --branch preview --limit 3
```
Bis status='completed' + conclusion='success'.

### Task 6.2: Browser-E2E mit echtem SuS-Login

**Pflicht:** Echte Logins (Memory `feedback_echte_logins`), keine Demo-Modi. SW-Cache vor jedem Test-Lauf zurücksetzen.

- [ ] **Step 1: SW-Cache zurücksetzen (Memory `feedback_service_worker_cache_wire_bundle`)**

```javascript
// In Browser DevTools Console auf staging:
await navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())))
await caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
location.reload()
```

- [ ] **Step 2: SuS-Login (Account `wr` oder analog)**

Login auf staging-URL, Üben-Bereich öffnen.

- [ ] **Step 3: Pflicht-Pfade (Mindest-Manual analog Bundle V/W)**

| # | Pfad | Stresst |
|---|---|---|
| 1 | SuS-Login + Üben-Dashboard rendert (5 Tabs) | Smoke |
| 2 | Übungs-Session starten (`modus='standard'`) | Cut 2 + Cut 4 |
| 5 | MC-Frage instant-beantworten (preload-Pfad) | Cut 3 + Cut 1 Use-Site |
| 6 | Selbstbewertung Freitext (server-Pfad ohne preload) | Cut 1 Branch-Wahl |
| 10 | 0 Console-Errors-Check (cross-cutting) | Cross-cutting |

Pflicht-5 ✅ → Phase 7. Falls Console-Errors oder Verhaltens-Drift: STOP, untersuchen.

- [ ] **Step 4: Optional-Pfade (Vitest-Coverage als Sicherungsnetz)**

| # | Pfad | Stresst |
|---|---|---|
| 3 | Übungs-Session `modus='mix'` mit 2 Quellen | Cut 2 mix-Branch |
| 4 | Übungs-Session `modus='repetition'` mit Dauerbaustellen | Cut 2 repetition-Branch |
| 7 | Übung beenden + Zusammenfassung | Bundle-W `berechneErgebnis` (Smoke) |
| 8 | Verbindungsproblem-Simulation → Pre-Load fehlt | Cut 4 catch-Pfad |
| 9 | Frage mit Teilaufgaben (Aufgabengruppe) | Cut 4 teilaufgaben-Branch |

Bei Zeit/Kapazität: alle abklicken. Sonst: Vitest 4 (loesungsPreloadFetch teilaufgaben-Test) + 6 (sessionBlockBau alle 3 modus) + 5 (pruefeClientseitig alle 5 cases) decken ab.

---

## Phase 7: HANDOFF + Memory + Merge

### Task 7.1: HANDOFF.md aktualisieren

- [ ] **Step 1: Bundle-W.b-Eintrag schreiben**

Format analog Bundle V/U/W (siehe `HANDOFF.md` für Vorlage). Inhalt:
- 4 Cuts mit Z./Tests-Bilanz
- Hotspot-Bilanz vorher/nachher
- Browser-E2E-Pfade ✅
- Lehren (z.B. Side-Effect-Aufteilung als Pattern, Args-Default-Decision)
- Spawn-Tasks (`Test-Migration` weiter offen, ggf. Cut 5)

- [ ] **Step 2: Commit HANDOFF**

```bash
git add HANDOFF.md
git commit -m "Bundle W.b: HANDOFF-Eintrag"
```

### Task 7.2: Memory-Eintrag ergänzen

- [ ] **Step 1: Memory `project_bundle_w_b_komplett.md` schreiben**

Datei: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_w_b_komplett.md`

Inhalt: Datum, Merge-Hash, 4 Cuts mit Z./Tests, Hotspot 10→9, Lehren (Side-Effect-Aufteilung, Args-Default-Decision, Decision-Tree für Margin).

- [ ] **Step 2: Memory `MEMORY.md` Index-Eintrag hinzufügen**

Datei: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/MEMORY.md`

Eine Zeile in ExamLab-Sektion, analog Bundle W.

- [ ] **Step 3: Memory `project_bundle_w_komplett.md` aktualisieren**

Spawn-Task `istSelbstbewertbar`-Konstante als ✅ erledigt markieren (durch Bundle W.b Cut 1).

### Task 7.3: Merge zu main

- [ ] **Step 1: Auf main wechseln + Merge**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git merge --no-ff bundle-w-b/uebungsstore-state-refactor -m "Merge Bundle W.b: uebungsStore State-Refactor (540 → ~498 Z., -8%)"
```

Expected: Merge-Commit erstellt, kein Konflikt (Bundle-W.b ist von Bundle-W's main HEAD branched).

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

Expected: Push erfolgreich, GitHub Pages Production-Deploy startet.

- [ ] **Step 3: Production-Deploy verifizieren**

```bash
gh run list --branch main --limit 3
```

Bis status='completed' + conclusion='success'.

### Task 7.4: Worktree + Branch löschen

- [ ] **Step 1: Worktree entfernen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree remove .worktrees/bundle-w-b-uebungsstore
```

- [ ] **Step 2: Branch lokal + remote löschen**

```bash
git branch -d bundle-w-b/uebungsstore-state-refactor
git push origin --delete bundle-w-b/uebungsstore-state-refactor
```

Expected: Beide Lösch-Operationen erfolgreich.

---

## Definition of Done (Final)

- [ ] vitest 1472 passed (Drift +18 exakt: P1+3, P2+6, P3+5, P4+4)
- [ ] tsc -b clean (Output direkt geprüft)
- [ ] 4 Lint-Gates clean: `lint:as-any` / `lint:no-alert` / `lint:no-tests-dir` / `lint:musterloesung`
- [ ] vite build erfolgreich (~3s, PWA generateSW OK)
- [ ] `wc -l uebungsStore.ts` ≤ 500 (Ziel ~498)
- [ ] Hotspot-Bilanz Files >500 Z.: 10 → 9
- [ ] Per-Phase-Reviewer (P1, P2, P3, P4) alle APPROVED
- [ ] Final Code-Reviewer (Branch komplett) APPROVED FOR MERGE
- [ ] Browser-E2E Pflicht-Pfade 1+2+5+6+10 ✅ mit echtem SuS-Login
- [ ] HANDOFF.md `Bundle W.b` Eintrag mit Verifikation, Lehren, Spawn-Tasks
- [ ] Memory `project_bundle_w_b_komplett.md` + Index-Eintrag in MEMORY.md
- [ ] Bundle-W-Spawn-Task `istSelbstbewertbar` als ✅ markiert in Bundle-W-Memory
- [ ] Bestehende Tests grün: `uebungsStoreLoesungsPreload.test.ts` + `uebungsStorePruefen.test.ts`
- [ ] Branch `bundle-w-b/uebungsstore-state-refactor` lokal+remote gelöscht

---

## Spawn-Tasks (für nächste Sessions)

- **Test-Migration:** `src/tests/uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts` zu co-located (`store/ueben/uebungsStore*.test.ts`) verschieben — analog Bundle Q-Heuristik B. Bundle W + W.b haben den Spawn-Task notiert; bleibt offen.
- **Final-Code-Reviewer-Pass für Bundle W:** Wenn Org-Usage-Limit zurückgesetzt ist. Bundle W endete im Self-Review-Modus.
- **Cut 5 (optional):** Server-Response-Verarbeitung `pruefeAntwortJetzt` Z. 326–363 (~10 Z. Saving). Nur falls Bundle-W.b-Margin nach P4 zu eng ausfällt (siehe Phase 4 Decision-Tree).
- **Future-Hotspot-Roadmap:** Nach Bundle W.b ist Phase-4-Audit (Hoch-Risiko-Files) plus Folge-Cut komplett. Hotspot-Bilanz von ursprünglich 17 (vor Bundle S) auf 9 reduziert. Phase-5-Scoping (z.B. weitere Komponenten-Cuts oder andere Dimensionen aus Vereinfachungs-Audit) offen.
