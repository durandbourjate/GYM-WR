# Bundle T.f — LPStartseite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LPStartseite.tsx von 1043 Z. auf ~430 Z. (-59%) reduzieren durch 3 Hook-Extraktionen (`useLPConfigFiltering`, `useLPFavoriten`, `useLPDashboardData`) + 1 Utility-Modul (`lpEinrichtungSync`) + 5 Komponenten-Splits (`PruefungsKarte`+`TrackerBadge` co-located, `FilterLeiste`, `MultiDashboardDialog`, `LPUebungenAnsicht`, `LPPruefungenAnsicht`) — byte-identisches Verhalten.

**Architecture:** Strategie F+ aus Spec. Daten-Loading + Filter/Favoriten-Memos in Hooks; Sync-Helpers in pure-Utility; UI-Blöcke in Sub-Folder `lp/startseite/`. 4 kleine useEffect's bleiben im Body (kurs-redirect, localStorage-kurs, deepLink-config, beforeunload). Hook-Result-Destrukturierung (Lehre Bundle T.d) für stabile Identitäten. Filter-Toolbar wird via FilterLeiste-DRY-Komponente in beiden Modi (Übungen + Prüfungen) wiederverwendet.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Tailwind CSS v4, Vitest, @testing-library/react

**Spec:** `docs/superpowers/specs/2026-05-07-bundle-t-f-lpstartseite-design.md`

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-t-f-lpstartseite/`

**Branch:** `feature/bundle-t-f-lpstartseite` (bereits angelegt, Commits `16ecdef` Spec-Initial + `a435eb3` Spec-Reviewer-Iteration)

**Build-Check:** `cd ExamLab && npx tsc -b` — Output direkt prüfen, nicht nur Exit-Code (Lehre `feedback_tsc_b_exit_misleading.md`)

**Test:** `cd ExamLab && npx vitest run`

**Baseline (T.e):** 1324 vitest passes, alle Lint-Gates clean.

**Parallelization-Hint:** Tasks 1-3 (utility + 2 pure hooks + tests) und Tasks 5, 6, 7 (3 mechanische Komponenten-Extraktionen) sind unabhängig und können parallel von 6 Implementer-Subagents ausgeführt werden. Tasks 4, 8, 9 warten auf ihre Deps. Task 10 ist sequentiell.

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `ExamLab/src/utils/lpEinrichtungSync.ts` | Sync-Konstanten + 3 async Funktionen (`syncFragenSeriell`, `syncEinrichtungsPruefung`, `syncEinrichtungsUebung`) — pure, kein React |
| `ExamLab/src/utils/lpEinrichtungSync.test.ts` | ~5 Vitest-Tests (Guard, Serial, Sync-Reihenfolge, onError-Callback) |
| `ExamLab/src/hooks/useLPConfigFiltering.ts` | 6 Filter-Memos + `letzteFuenf` + `hatAktiveFilter` + interner `filtereConfigs`-Helper |
| `ExamLab/src/hooks/useLPConfigFiltering.test.ts` | ~14 Vitest-Tests |
| `ExamLab/src/hooks/useLPFavoriten.ts` | 4 Favoriten-Memos |
| `ExamLab/src/hooks/useLPFavoriten.test.ts` | ~6 Vitest-Tests |
| `ExamLab/src/hooks/useLPDashboardData.ts` | 5 useState + Lade-useEffect + `findeTrackerSummary` + `reload` |
| `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx` | PruefungsKarte (Z. 916-1010) + TrackerBadge (Z. 1013-1038) co-located |
| `ExamLab/src/components/lp/startseite/FilterLeiste.tsx` | DRY: 2 Toolbars (Z. 537-606 + Z. 688-755) → 1 Komponente |
| `ExamLab/src/components/lp/startseite/MultiDashboardDialog.tsx` | Multi-Dashboard-Auswahl-Dialog (Z. 778-818) |
| `ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx` | Übungen-Tab-Body (Z. 519-634) inkl. Skeleton/Empty/Liste |
| `ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx` | Prüfen-Modus-Body (Z. 643-862) inkl. Skeleton/Tracker/Empty/Liste |

### Modified Files

| File | Change |
|------|--------|
| `ExamLab/src/components/lp/LPStartseite.tsx` | 1043 → ~430 Z.: 5 useState + 12 useMemo + 1 grosser useEffect + Sync-Helpers + 2 Sub-Komponenten + Demo-Helper entfernt; Hook-Calls + 5 Komponenten-Imports + 5 JSX-Aufrufe hinzugefügt |
| `ExamLab/HANDOFF.md` | Bundle T.f-Eintrag hinzufügen |

### Branch State

Aktueller Branch: `feature/bundle-t-f-lpstartseite` mit 2 Commits (Spec + Reviewer-Iteration). Implementation-Phasen committen weiter auf diesen Branch.

---

## Task 0: Branch + Baseline

- [ ] **Step 0.1: Branch verifizieren**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-t-f-lpstartseite"
git status -sb
```
Expected: `## feature/bundle-t-f-lpstartseite` (kein detached HEAD), keine Uncommitted Changes.

- [ ] **Step 0.2: Baseline vitest run**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -10
```
Expected: 1324 passes (T.e-Baseline), 0 failures, 4 todo.

- [ ] **Step 0.3: Baseline tsc + lint**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5 && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```
Expected: Alle Gates clean.

---

## Task 1: `lpEinrichtungSync.ts` Utility + Tests (TDD)

Pure utility-Modul. **Kein React.** Sync-Konstanten + 3 async Funktionen extrahiert aus LPStartseite.tsx Z. 243-297.

**Files:**
- Create: `ExamLab/src/utils/lpEinrichtungSync.ts`
- Create: `ExamLab/src/utils/lpEinrichtungSync.test.ts`

**Heutige Quelle in LPStartseite.tsx:**
- Z. 243: `SYNC_KEY = 'einrichtung-sync-v5'`
- Z. 244: `SYNC_VERSION = ${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}-${einrichtungsFragen.length}`
- Z. 249-255: `syncFragenSeriell(email, fragen)` — for-loop mit await + 200ms Pause
- Z. 257-275: `syncEinrichtungsPruefung(email, _backendConfigs)` — Guard + speichereConfig + syncFragenSeriell + Guard-Set + try/catch toast
- Z. 278: `UEBUNG_SYNC_KEY = 'einrichtung-uebung-sync-v5'`
- Z. 279: `UEBUNG_SYNC_VERSION = ${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}-${einrichtungsUebungFragen.length}`
- Z. 281-297: `syncEinrichtungsUebung(email, _backendConfigs)` — analog Pruefung

**Refactor-Änderungen:**
- `_backendConfigs`-Parameter entfernen (war ungenutzt — Tote-Code)
- `toast.warning(...)` durch `onError: (msg: string) => void`-Callback ersetzen (utility ist React-frei)
- `SYNC_VERSION` und `UEBUNG_SYNC_VERSION` als Funktionen `getSyncVersion()` / `getUebungSyncVersion()` (lazy-evaluated, testbar)

- [ ] **Step 1.1: Test-File schreiben (zuerst — TDD)**

Inhalt von `ExamLab/src/utils/lpEinrichtungSync.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SYNC_KEY,
  UEBUNG_SYNC_KEY,
  getSyncVersion,
  getUebungSyncVersion,
  syncFragenSeriell,
  syncEinrichtungsPruefung,
  syncEinrichtungsUebung,
} from './lpEinrichtungSync'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsFragen } from '../data/einrichtungsFragen'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import { einrichtungsUebungFragen } from '../data/einrichtungsUebungFragen'

vi.mock('../services/fragensammlungApi', () => ({
  speichereConfig: vi.fn().mockResolvedValue(undefined),
  speichereFrage: vi.fn().mockResolvedValue(undefined),
}))

import { speichereConfig, speichereFrage } from '../services/fragensammlungApi'

describe('lpEinrichtungSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('getSyncVersion() ist deterministisch aus einrichtungsPruefung-Feldern', () => {
    expect(getSyncVersion()).toBe(
      `${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}-${einrichtungsFragen.length}`
    )
  })

  it('getUebungSyncVersion() ist deterministisch aus einrichtungsUebung-Feldern', () => {
    expect(getUebungSyncVersion()).toBe(
      `${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}-${einrichtungsUebungFragen.length}`
    )
  })

  it('syncFragenSeriell ruft speichereFrage seriell mit 200ms Pause', async () => {
    const fragen = einrichtungsFragen.slice(0, 3)
    const promise = syncFragenSeriell('test@example.com', fragen)
    // Erste Frage: speichereFrage sofort
    await vi.runAllTicks()
    expect(speichereFrage).toHaveBeenCalledTimes(1)
    // Pause 200ms → zweite Frage
    await vi.advanceTimersByTimeAsync(200)
    expect(speichereFrage).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(200)
    expect(speichereFrage).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(200)
    await promise
    expect(speichereFrage).toHaveBeenCalledTimes(3)
  })

  it('syncEinrichtungsPruefung skipt wenn localStorage-Guard match', async () => {
    localStorage.setItem(SYNC_KEY, getSyncVersion())
    const onError = vi.fn()
    await syncEinrichtungsPruefung('test@example.com', onError)
    expect(speichereConfig).not.toHaveBeenCalled()
    expect(speichereFrage).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('syncEinrichtungsPruefung speichert Config zuerst, dann Fragen seriell, setzt Guard', async () => {
    const onError = vi.fn()
    const promise = syncEinrichtungsPruefung('test@example.com', onError)
    // Erst speichereConfig
    await vi.runAllTicksAsync()
    expect(speichereConfig).toHaveBeenCalledTimes(1)
    // Fragen seriell mit 200ms Pause: alle nacheinander
    for (let i = 0; i < einrichtungsFragen.length; i++) {
      await vi.advanceTimersByTimeAsync(200)
    }
    await promise
    expect(speichereFrage).toHaveBeenCalledTimes(einrichtungsFragen.length)
    expect(localStorage.getItem(SYNC_KEY)).toBe(getSyncVersion())
    expect(onError).not.toHaveBeenCalled()
  })

  it('syncEinrichtungsPruefung ruft onError bei Backend-Fehler', async () => {
    vi.mocked(speichereConfig).mockRejectedValueOnce(new Error('backend down'))
    const onError = vi.fn()
    await syncEinrichtungsPruefung('test@example.com', onError)
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Einrichtungsprüfung konnte nicht synchronisiert werden')
    )
    // Guard wurde NICHT gesetzt (Sync schlug fehl)
    expect(localStorage.getItem(SYNC_KEY)).toBeNull()
  })

  it('syncEinrichtungsUebung analog: Guard + Sync-Reihenfolge', async () => {
    const onError = vi.fn()
    const promise = syncEinrichtungsUebung('test@example.com', onError)
    await vi.runAllTicksAsync()
    expect(speichereConfig).toHaveBeenCalledTimes(1)
    for (let i = 0; i < einrichtungsUebungFragen.length; i++) {
      await vi.advanceTimersByTimeAsync(200)
    }
    await promise
    expect(speichereFrage).toHaveBeenCalledTimes(einrichtungsUebungFragen.length)
    expect(localStorage.getItem(UEBUNG_SYNC_KEY)).toBe(getUebungSyncVersion())
    expect(onError).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 1.2: Test ausführen — soll fehlschlagen**

```bash
cd ExamLab && npx vitest run src/utils/lpEinrichtungSync.test.ts 2>&1 | tail -10
```
Expected: FAIL — Module nicht gefunden.

- [ ] **Step 1.3: Utility-Implementation schreiben**

Inhalt von `ExamLab/src/utils/lpEinrichtungSync.ts`:

```typescript
import { speichereConfig, speichereFrage } from '../services/fragensammlungApi'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsFragen } from '../data/einrichtungsFragen'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import { einrichtungsUebungFragen } from '../data/einrichtungsUebungFragen'
import type { Frage } from '../types/fragen-storage'

export const SYNC_KEY = 'einrichtung-sync-v5'
export const UEBUNG_SYNC_KEY = 'einrichtung-uebung-sync-v5'

export function getSyncVersion(): string {
  return `${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}-${einrichtungsFragen.length}`
}

export function getUebungSyncVersion(): string {
  return `${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}-${einrichtungsUebungFragen.length}`
}

/** Speichert Fragen seriell mit 200ms Pause — verhindert Backend-Stau. */
export async function syncFragenSeriell(email: string, fragen: Frage[]): Promise<void> {
  for (const frage of fragen) {
    await speichereFrage(email, frage)
    await new Promise(r => setTimeout(r, 200))
  }
}

/** Synchronisiert Einrichtungsprüfung. localStorage-Guard idempotent. */
export async function syncEinrichtungsPruefung(
  email: string,
  onError: (msg: string) => void
): Promise<void> {
  try { if (localStorage.getItem(SYNC_KEY) === getSyncVersion()) return } catch { /* ignore */ }

  console.log('[LP] Einrichtungsprüfung sync starten...')
  try {
    await speichereConfig(email, { ...einrichtungsPruefung, erstelltVon: email })
    await syncFragenSeriell(email, einrichtungsFragen)
    try { localStorage.setItem(SYNC_KEY, getSyncVersion()) } catch { /* ignore */ }
    console.log(`[LP] Einrichtungsprüfung sync fertig (${einrichtungsFragen.length} Fragen)`)
  } catch (error) {
    console.error('[LP] Einrichtungsprüfung sync fehlgeschlagen:', error)
    onError('Einrichtungsprüfung konnte nicht synchronisiert werden. Bitte Seite neu laden.')
  }
}

/** Synchronisiert Einführungsübung. localStorage-Guard idempotent. */
export async function syncEinrichtungsUebung(
  email: string,
  onError: (msg: string) => void
): Promise<void> {
  try { if (localStorage.getItem(UEBUNG_SYNC_KEY) === getUebungSyncVersion()) return } catch { /* ignore */ }

  console.log('[LP] Einführungsübung sync starten...')
  try {
    await speichereConfig(email, { ...einrichtungsUebung, erstelltVon: email })
    await syncFragenSeriell(email, einrichtungsUebungFragen)
    try { localStorage.setItem(UEBUNG_SYNC_KEY, getUebungSyncVersion()) } catch { /* ignore */ }
    console.log(`[LP] Einführungsübung sync fertig (${einrichtungsUebungFragen.length} Fragen)`)
  } catch (error) {
    console.error('[LP] Einführungsübung sync fehlgeschlagen:', error)
    onError('Einführungsübung konnte nicht synchronisiert werden. Bitte Seite neu laden.')
  }
}
```

- [ ] **Step 1.4: Test ausführen — soll passen**

```bash
cd ExamLab && npx vitest run src/utils/lpEinrichtungSync.test.ts 2>&1 | tail -10
```
Expected: 7 passes, 0 fails.

- [ ] **Step 1.5: tsc + lint**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```
Expected: clean.

- [ ] **Step 1.6: Commit**

```bash
git add ExamLab/src/utils/lpEinrichtungSync.ts ExamLab/src/utils/lpEinrichtungSync.test.ts
git commit -m "Bundle T.f Phase 1: lpEinrichtungSync Utility + Tests"
```

---

## Task 2: `useLPConfigFiltering` Hook + Tests (TDD)

Pure-Hook für 6 Filter-Memos + `letzteFuenf` + `hatAktiveFilter`.

**Files:**
- Create: `ExamLab/src/hooks/useLPConfigFiltering.ts`
- Create: `ExamLab/src/hooks/useLPConfigFiltering.test.ts`

**Heutige Quelle:** LPStartseite.tsx Z. 146 (`hatAktiveFilter`), Z. 149-159 (`verfuegbareFachbereiche`/`verfuegbareGefaesse`), Z. 162-198 (`filtereConfigs`-Helper), Z. 201-210 (`summativeConfigs`/`gefilterteConfigs`/`formativeConfigs`/`gefilterteUebungen`), Z. 232-235 (`letzteFuenf`).

- [ ] **Step 2.1: Test-File schreiben**

Inhalt von `ExamLab/src/hooks/useLPConfigFiltering.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLPConfigFiltering, type UseLPConfigFilteringInputs } from './useLPConfigFiltering'
import type { PruefungsConfig } from '../types/pruefung'

const baseConfig = (overrides: Partial<PruefungsConfig> = {}): PruefungsConfig => ({
  id: 'c1',
  titel: 'Test Prüfung',
  klasse: '4a',
  datum: '2026-01-15',
  dauerMinuten: 60,
  gesamtpunkte: 30,
  fachbereiche: ['Mathe'],
  gefaess: 'GF',
  typ: 'standard',
  abschnitte: [],
  freigeschaltet: false,
  erlaubteKlasse: '',
  teilnehmer: [],
  zeitverlaengerungen: {},
  sebAusnahmen: [],
  erstelltVon: 'lp@test',
  ...overrides,
})

const baseInputs = (overrides: Partial<UseLPConfigFilteringInputs> = {}): UseLPConfigFilteringInputs => ({
  configs: [],
  suchtext: '',
  filterFach: [],
  filterTyp: null,
  filterGefaess: null,
  sortierung: 'datum',
  filterStatus: 'aktiv',
  ...overrides,
})

describe('useLPConfigFiltering', () => {
  describe('verfuegbareFachbereiche', () => {
    it('leere configs → []', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs()))
      expect(result.current.verfuegbareFachbereiche).toEqual([])
    })

    it('mehrere fachbereiche pro config, alphabetisch sortiert + dedupliziert', () => {
      const configs = [
        baseConfig({ id: '1', fachbereiche: ['Z-Fach', 'A-Fach'] }),
        baseConfig({ id: '2', fachbereiche: ['M-Fach', 'A-Fach'] }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.verfuegbareFachbereiche).toEqual(['A-Fach', 'M-Fach', 'Z-Fach'])
    })
  })

  describe('verfuegbareGefaesse', () => {
    it('leere configs → []', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs()))
      expect(result.current.verfuegbareGefaesse).toEqual([])
    })

    it('configs ohne gefaess werden ignoriert, alphabetisch sortiert', () => {
      const configs = [
        baseConfig({ id: '1', gefaess: 'EF' }),
        baseConfig({ id: '2', gefaess: undefined }),
        baseConfig({ id: '3', gefaess: 'GF' }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.verfuegbareGefaesse).toEqual(['EF', 'GF'])
    })
  })

  describe('summativeConfigs / formativeConfigs', () => {
    it('trennt nach typ === "formativ"', () => {
      const configs = [
        baseConfig({ id: '1', typ: 'standard' }),
        baseConfig({ id: '2', typ: 'formativ' }),
        baseConfig({ id: '3', typ: 'matur' }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.summativeConfigs.map(c => c.id)).toEqual(['1', '3'])
      expect(result.current.formativeConfigs.map(c => c.id)).toEqual(['2'])
    })
  })

  describe('gefilterteConfigs (suchtext / fach / typ / gefaess / status / sortierung)', () => {
    const configs = [
      baseConfig({ id: 'a', titel: 'Mathe-Test', klasse: '4a', datum: '2026-01-01', fachbereiche: ['Mathe'], gefaess: 'GF', typ: 'standard' }),
      baseConfig({ id: 'b', titel: 'Englisch-Quiz', klasse: '4b', datum: '2026-02-01', fachbereiche: ['Englisch'], gefaess: 'EF', typ: 'standard' }),
      baseConfig({ id: 'c', titel: 'Archived', klasse: '4c', datum: '2025-12-01', fachbereiche: ['Mathe'], gefaess: 'GF', typ: 'standard', beendetUm: '2025-12-15' }),
    ]

    it('suchtext matcht titel/klasse/id (case-insensitive)', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, suchtext: 'mathe' })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['a'])
    })

    it('filterFach OR-Match', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterFach: ['Englisch'] })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['b'])
    })

    it('filterStatus aktiv vs archiviert', () => {
      const { result: aktiv } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'aktiv' })))
      expect(aktiv.current.gefilterteConfigs.map(c => c.id).sort()).toEqual(['a', 'b'])
      const { result: arch } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'archiviert' })))
      expect(arch.current.gefilterteConfigs.map(c => c.id)).toEqual(['c'])
      const { result: alle } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'alle' })))
      expect(alle.current.gefilterteConfigs.length).toBe(3)
    })

    it('sortierung datum: neueste zuerst', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'alle', sortierung: 'datum' })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['b', 'a', 'c'])
    })

    it('sortierung titel: alphabetisch', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'alle', sortierung: 'titel' })))
      expect(result.current.gefilterteConfigs.map(c => c.titel)).toEqual(['Archived', 'Englisch-Quiz', 'Mathe-Test'])
    })
  })

  describe('gefilterteUebungen (formative)', () => {
    it('analog gefilterteConfigs aber auf formative', () => {
      const configs = [
        baseConfig({ id: '1', typ: 'standard' }),
        baseConfig({ id: '2', typ: 'formativ', titel: 'Üb1' }),
        baseConfig({ id: '3', typ: 'formativ', titel: 'Üb2', beendetUm: '2025-12-01' }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'aktiv' })))
      expect(result.current.gefilterteUebungen.map(c => c.id)).toEqual(['2'])
    })
  })

  describe('letzteFuenf', () => {
    it('aktive Filter → []', () => {
      const configs = Array.from({ length: 10 }, (_, i) => baseConfig({ id: `${i}`, typ: 'standard' }))
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, suchtext: 'x' })))
      expect(result.current.letzteFuenf).toEqual([])
    })

    it('≤5 summative → []', () => {
      const configs = Array.from({ length: 5 }, (_, i) => baseConfig({ id: `${i}`, typ: 'standard' }))
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.letzteFuenf).toEqual([])
    })

    it('>5 summative → top-5 nach Datum desc', () => {
      const configs = Array.from({ length: 7 }, (_, i) =>
        baseConfig({ id: `${i}`, typ: 'standard', datum: `2026-0${i + 1}-01` })
      )
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.letzteFuenf.map(c => c.id)).toEqual(['6', '5', '4', '3', '2'])
    })
  })

  describe('hatAktiveFilter', () => {
    it('alle Standard → false', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs()))
      expect(result.current.hatAktiveFilter).toBe(false)
    })

    it.each([
      ['suchtext', { suchtext: 'x' }],
      ['filterFach', { filterFach: ['Mathe'] }],
      ['filterTyp', { filterTyp: 'standard' }],
      ['filterGefaess', { filterGefaess: 'GF' }],
      ['filterStatus alle', { filterStatus: 'alle' as const }],
    ])('jeder Filter einzeln aktiv → true (%s)', (_, override) => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs(override)))
      expect(result.current.hatAktiveFilter).toBe(true)
    })
  })
})
```

- [ ] **Step 2.2: Test ausführen — soll fehlschlagen**

```bash
cd ExamLab && npx vitest run src/hooks/useLPConfigFiltering.test.ts 2>&1 | tail -10
```
Expected: FAIL — Module nicht gefunden.

- [ ] **Step 2.3: Hook-Implementation schreiben**

Inhalt von `ExamLab/src/hooks/useLPConfigFiltering.ts`:

```typescript
import { useMemo } from 'react'
import type { PruefungsConfig } from '../types/pruefung'

export interface UseLPConfigFilteringInputs {
  configs: PruefungsConfig[]
  suchtext: string
  filterFach: string[]
  filterTyp: string | null
  filterGefaess: string | null
  sortierung: 'datum' | 'titel' | 'klasse'
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
}

export interface UseLPConfigFilteringResult {
  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  summativeConfigs: PruefungsConfig[]
  gefilterteConfigs: PruefungsConfig[]
  formativeConfigs: PruefungsConfig[]
  gefilterteUebungen: PruefungsConfig[]
  letzteFuenf: PruefungsConfig[]
  hatAktiveFilter: boolean
}

export function useLPConfigFiltering(inputs: UseLPConfigFilteringInputs): UseLPConfigFilteringResult {
  const { configs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus } = inputs

  const hatAktiveFilter = suchtext.length > 0 || filterFach.length > 0 || filterTyp !== null || filterGefaess !== null || filterStatus !== 'aktiv'

  const verfuegbareFachbereiche = useMemo(() => {
    const faecher = new Set<string>()
    for (const c of configs) for (const fb of c.fachbereiche) faecher.add(fb)
    return [...faecher].sort()
  }, [configs])

  const verfuegbareGefaesse = useMemo(() => {
    const gefaesse = new Set<string>()
    for (const c of configs) if (c.gefaess) gefaesse.add(c.gefaess)
    return [...gefaesse].sort()
  }, [configs])

  function filtereConfigs(basisConfigs: PruefungsConfig[]): PruefungsConfig[] {
    let result = [...basisConfigs]
    if (filterStatus === 'aktiv') {
      result = result.filter(c => !c.beendetUm)
    } else if (filterStatus === 'archiviert') {
      result = result.filter(c => !!c.beendetUm)
    }
    if (suchtext) {
      const q = suchtext.toLowerCase()
      result = result.filter(c =>
        c.titel.toLowerCase().includes(q) ||
        c.klasse.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    }
    if (filterFach.length > 0) {
      result = result.filter(c => filterFach.some(f => c.fachbereiche.includes(f)))
    }
    if (filterTyp) {
      result = result.filter(c => c.typ === filterTyp)
    }
    if (filterGefaess) {
      result = result.filter(c => c.gefaess === filterGefaess)
    }
    result.sort((a, b) => {
      if (sortierung === 'datum') return b.datum.localeCompare(a.datum)
      if (sortierung === 'titel') return a.titel.localeCompare(b.titel)
      return a.klasse.localeCompare(b.klasse)
    })
    return result
  }

  const summativeConfigs = useMemo(() => configs.filter(c => c.typ !== 'formativ'), [configs])
  const gefilterteConfigs = useMemo(() => filtereConfigs(summativeConfigs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summativeConfigs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus])

  const formativeConfigs = useMemo(() => configs.filter(c => c.typ === 'formativ'), [configs])
  const gefilterteUebungen = useMemo(() => filtereConfigs(formativeConfigs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formativeConfigs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus])

  const letzteFuenf = useMemo(() => {
    if (hatAktiveFilter || summativeConfigs.length <= 5) return []
    return [...summativeConfigs].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 5)
  }, [summativeConfigs, hatAktiveFilter])

  return {
    verfuegbareFachbereiche,
    verfuegbareGefaesse,
    summativeConfigs,
    gefilterteConfigs,
    formativeConfigs,
    gefilterteUebungen,
    letzteFuenf,
    hatAktiveFilter,
  }
}
```

- [ ] **Step 2.4: Test ausführen — soll passen**

```bash
cd ExamLab && npx vitest run src/hooks/useLPConfigFiltering.test.ts 2>&1 | tail -10
```
Expected: ~14 passes, 0 fails.

- [ ] **Step 2.5: Commit**

```bash
git add ExamLab/src/hooks/useLPConfigFiltering.ts ExamLab/src/hooks/useLPConfigFiltering.test.ts
git commit -m "Bundle T.f Phase 2: useLPConfigFiltering Hook + Tests"
```

---

## Task 3: `useLPFavoriten` Hook + Tests (TDD)

Pure-Hook für 4 Favoriten-Memos.

**Files:**
- Create: `ExamLab/src/hooks/useLPFavoriten.ts`
- Create: `ExamLab/src/hooks/useLPFavoriten.test.ts`

**Heutige Quelle:** LPStartseite.tsx Z. 219-229.

- [ ] **Step 3.1: Test-File schreiben**

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLPFavoriten } from './useLPFavoriten'
import type { PruefungsConfig } from '../types/pruefung'
import type { Favorit } from '../store/favoritenStore'

const baseConfig = (overrides: Partial<PruefungsConfig> = {}): PruefungsConfig => ({
  id: 'c1', titel: 'Test', klasse: '4a', datum: '2026-01-15', dauerMinuten: 60,
  gesamtpunkte: 30, fachbereiche: ['Mathe'], gefaess: 'GF', typ: 'standard',
  abschnitte: [], freigeschaltet: false, erlaubteKlasse: '', teilnehmer: [],
  zeitverlaengerungen: {}, sebAusnahmen: [], erstelltVon: 'lp@test',
  ...overrides,
})

describe('useLPFavoriten', () => {
  it('keine Favoriten → leere Result-Felder', () => {
    const { result } = renderHook(() => useLPFavoriten([], []))
    expect(result.current.favoritenConfigIds.size).toBe(0)
    expect(result.current.favoritenConfigs).toEqual([])
    expect(result.current.favoritenPruefungen).toEqual([])
    expect(result.current.favoritenUebungen).toEqual([])
  })

  it('favoritenConfigIds filtert nur typ=pruefung|uebung', () => {
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'p1', label: 'P1', sortierung: 0 },
      { typ: 'ort', ziel: '/dashboard', label: 'D', sortierung: 1 },
      { typ: 'uebung', ziel: 'u1', label: 'U1', sortierung: 2 },
      { typ: 'frage', ziel: 'f1', label: 'F1', sortierung: 3 },
    ]
    const { result } = renderHook(() => useLPFavoriten([], favoriten))
    expect([...result.current.favoritenConfigIds]).toEqual(['p1', 'u1'])
  })

  it('favoritenConfigs sortiert nach datum desc, filtert auf existierende configs', () => {
    const configs = [
      baseConfig({ id: 'p1', datum: '2026-01-01' }),
      baseConfig({ id: 'p2', datum: '2026-03-01' }),
      baseConfig({ id: 'p3', datum: '2026-02-01' }),
    ]
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'p1', label: '', sortierung: 0 },
      { typ: 'pruefung', ziel: 'p2', label: '', sortierung: 1 },
      { typ: 'pruefung', ziel: 'pX', label: '', sortierung: 2 }, // nicht-existent
    ]
    const { result } = renderHook(() => useLPFavoriten(configs, favoriten))
    expect(result.current.favoritenConfigs.map(c => c.id)).toEqual(['p2', 'p1'])
  })

  it('favoritenPruefungen / favoritenUebungen trennt nach typ === formativ', () => {
    const configs = [
      baseConfig({ id: 'p1', typ: 'standard' }),
      baseConfig({ id: 'u1', typ: 'formativ' }),
    ]
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'p1', label: '', sortierung: 0 },
      { typ: 'uebung', ziel: 'u1', label: '', sortierung: 1 },
    ]
    const { result } = renderHook(() => useLPFavoriten(configs, favoriten))
    expect(result.current.favoritenPruefungen.map(c => c.id)).toEqual(['p1'])
    expect(result.current.favoritenUebungen.map(c => c.id)).toEqual(['u1'])
  })

  it('favoritenConfigIds verändert sich bei favoriten-Update', () => {
    const configs = [baseConfig({ id: 'p1' })]
    const { result, rerender } = renderHook(
      ({ favoriten }) => useLPFavoriten(configs, favoriten),
      { initialProps: { favoriten: [] as Favorit[] } }
    )
    expect(result.current.favoritenConfigIds.size).toBe(0)
    rerender({ favoriten: [{ typ: 'pruefung', ziel: 'p1', label: '', sortierung: 0 }] })
    expect([...result.current.favoritenConfigIds]).toEqual(['p1'])
  })

  it('Edge: nicht-existente Favoriten-IDs werden aus favoritenConfigs entfernt', () => {
    const configs = [baseConfig({ id: 'p1' })]
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'pX', label: 'gelöscht', sortierung: 0 },
    ]
    const { result } = renderHook(() => useLPFavoriten(configs, favoriten))
    expect(result.current.favoritenConfigs).toEqual([])
  })
})
```

- [ ] **Step 3.2: Test ausführen — soll fehlschlagen**

```bash
cd ExamLab && npx vitest run src/hooks/useLPFavoriten.test.ts 2>&1 | tail -5
```
Expected: FAIL.

- [ ] **Step 3.3: Hook-Implementation schreiben**

```typescript
import { useMemo } from 'react'
import type { PruefungsConfig } from '../types/pruefung'
import type { Favorit } from '../store/favoritenStore'

export interface UseLPFavoritenResult {
  favoritenConfigIds: Set<string>
  favoritenConfigs: PruefungsConfig[]
  favoritenPruefungen: PruefungsConfig[]
  favoritenUebungen: PruefungsConfig[]
}

export function useLPFavoriten(
  configs: PruefungsConfig[],
  favoriten: Favorit[]
): UseLPFavoritenResult {
  const favoritenConfigIds = useMemo(() => new Set(
    favoriten.filter(f => f.typ === 'pruefung' || f.typ === 'uebung').map(f => f.ziel)
  ), [favoriten])

  const favoritenConfigs = useMemo(() => {
    if (favoritenConfigIds.size === 0) return []
    return configs.filter(c => favoritenConfigIds.has(c.id)).sort((a, b) => b.datum.localeCompare(a.datum))
  }, [configs, favoritenConfigIds])

  const favoritenPruefungen = useMemo(() => favoritenConfigs.filter(c => c.typ !== 'formativ'), [favoritenConfigs])
  const favoritenUebungen = useMemo(() => favoritenConfigs.filter(c => c.typ === 'formativ'), [favoritenConfigs])

  return { favoritenConfigIds, favoritenConfigs, favoritenPruefungen, favoritenUebungen }
}
```

- [ ] **Step 3.4: Test ausführen — soll passen**

```bash
cd ExamLab && npx vitest run src/hooks/useLPFavoriten.test.ts 2>&1 | tail -5
```
Expected: ~6 passes.

- [ ] **Step 3.5: Commit**

```bash
git add ExamLab/src/hooks/useLPFavoriten.ts ExamLab/src/hooks/useLPFavoriten.test.ts
git commit -m "Bundle T.f Phase 3: useLPFavoriten Hook + Tests"
```

---

## Task 4: `useLPDashboardData` Hook (kein Test, Async-Store-Orchestration)

Konsumiert `lpEinrichtungSync` aus Task 1. Kapselt 5 useState + grossen Lade-useEffect + reload + findeTrackerSummary.

**Files:**
- Create: `ExamLab/src/hooks/useLPDashboardData.ts`

**Heutige Quelle:** LPStartseite.tsx Z. 129, 130, 131, 132, 136 (5 useState), Z. 300-394 (95-Z-useEffect), Z. 459-476 (`handleZurueck`-Reload-Pfad), Z. 482-485 (`findeTrackerSummary`), Z. 1041-1043 (`demoConfigs`).

**Sync-Helpers** sind jetzt aus `../utils/lpEinrichtungSync` importiert (durch Task 1 verfügbar).

- [ ] **Step 4.1: Hook-File anlegen**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { apiService } from '../services/apiService'
import { useStammdatenStore } from '../store/stammdatenStore'
import { useFavoritenStore } from '../store/favoritenStore'
import { useFragensammlungStore } from '../store/fragensammlungStore'
import { useToast } from './useToast'
import { schreibeGespeicherteAnzahl } from '../utils/skeletonAnzahl'
import { erstelleDemoTrackerDaten } from '../utils/trackerUtils'
import { syncEinrichtungsPruefung, syncEinrichtungsUebung } from '../utils/lpEinrichtungSync'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import type { PruefungsConfig } from '../types/pruefung'
import type { TrackerDaten, TrackerPruefungSummary } from '../types/tracker'

export interface UseLPDashboardDataResult {
  configs: PruefungsConfig[]
  setConfigs: React.Dispatch<React.SetStateAction<PruefungsConfig[]>>
  configsLadeStatus: 'laden' | 'fertig'
  setConfigsLadeStatus: React.Dispatch<React.SetStateAction<'laden' | 'fertig'>>
  trackerLadeStatus: 'laden' | 'fertig'
  trackerDaten: TrackerDaten | null
  backendFehler: boolean
  findeTrackerSummary: (pruefungId: string) => TrackerPruefungSummary | undefined
  reload: () => Promise<void>
}

function demoConfigs(): PruefungsConfig[] {
  return [einrichtungsPruefung, einrichtungsUebung]
}

/**
 * Lädt LP-Configs + Tracker-Daten + Sync von Einrichtungsprüfung/-übung.
 * Vorher: inline in LPStartseite (5 useState + 95-Z-useEffect + handleZurueck-Reload-Pfad).
 *
 * `reload()` wird von `handleZurueck` aufgerufen — Reload-Pfad OHNE Sync (analog Z. 463-475).
 */
export function useLPDashboardData(opts: {
  user: { email: string } | null
  istDemoModus: boolean
}): UseLPDashboardDataResult {
  const { user, istDemoModus } = opts
  const toast = useToast()

  const [configs, setConfigs] = useState<PruefungsConfig[]>([])
  const [configsLadeStatus, setConfigsLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [trackerLadeStatus, setTrackerLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [backendFehler, setBackendFehler] = useState(false)
  const [trackerDaten, setTrackerDaten] = useState<TrackerDaten | null>(null)

  // Alle Prüfungs-Configs + Tracker-Daten laden — byte-identisch zu LPStartseite.tsx Z. 300-394
  useEffect(() => {
    async function lade(): Promise<void> {
      if (!user) return

      if (istDemoModus || !apiService.istKonfiguriert()) {
        setConfigs(demoConfigs())
        setTrackerDaten(erstelleDemoTrackerDaten())
        setConfigsLadeStatus('fertig')
        setTrackerLadeStatus('fertig')
        return
      }

      const { ladeStammdaten, ladeLPProfil } = useStammdatenStore.getState()
      ladeStammdaten(user.email)
      ladeLPProfil(user.email).then(() => {
        const profil = useStammdatenStore.getState().lpProfil
        if (profil?.favoriten && profil.favoriten.length > 0) {
          const { favoriten: lokal } = useFavoritenStore.getState()
          if (lokal.length === 0) {
            const migriert = profil.favoriten.map((f: { id?: string; titel?: string; screen?: string; params?: { configId?: string } }, i: number) => ({
              typ: (f.params?.configId ? (f.screen === 'uebung' ? 'uebung' : 'pruefung') : 'ort') as 'ort' | 'pruefung' | 'uebung' | 'frage',
              ziel: f.params?.configId ?? `/${f.screen ?? 'pruefung'}`,
              label: f.titel || '',
              sortierung: i,
            }))
            useFavoritenStore.setState({ favoriten: migriert })
          }
        }
      })

      useFragensammlungStore.getState().lade(user.email)
      let configResult: PruefungsConfig[] | null = null
      try {
        configResult = await apiService.ladeAlleConfigs(user.email)
      } catch (err) {
        console.warn('[LP] ladeAlleConfigs Exception:', err)
        configResult = null
      }

      if (configResult) {
        setConfigs(configResult)
        setBackendFehler(false)
        const summativeAnzahl = configResult.filter(c => c.typ !== 'formativ').length
        const formativeAnzahl = configResult.filter(c => c.typ === 'formativ').length
        schreibeGespeicherteAnzahl('examlab-lp-letzte-summative-anzahl', summativeAnzahl)
        schreibeGespeicherteAnzahl('examlab-lp-letzte-formative-anzahl', formativeAnzahl)
        const SYNC_DONE_KEY = 'examlab-sync-done'
        const istDurchfuehrung = window.location.search.includes('id=')
        if (!sessionStorage.getItem(SYNC_DONE_KEY) && !istDurchfuehrung) {
          setTimeout(async () => {
            try {
              await syncEinrichtungsPruefung(user.email, (msg) => toast.warning(msg))
              await syncEinrichtungsUebung(user.email, (msg) => toast.warning(msg))
              sessionStorage.setItem(SYNC_DONE_KEY, '1')
              const neueConfigs = await apiService.ladeAlleConfigs(user.email)
              if (neueConfigs) setConfigs(neueConfigs)
            } catch (err) {
              console.warn('[LP] Sync fehlgeschlagen, wird beim nächsten Mount erneut versucht:', err)
            }
          }, 10_000)
        }
      } else {
        console.warn("[LP] Configs nicht ladbar — Composer bleibt nutzbar")
        setConfigs([])
        setBackendFehler(true)
      }

      setConfigsLadeStatus("fertig")

      apiService.ladeTrackerDaten(user.email)
        .then(trackerResult => {
          if (trackerResult) setTrackerDaten(trackerResult)
          setTrackerLadeStatus('fertig')
        })
        .catch(err => {
          console.warn('[LP] Tracker-Laden fehlgeschlagen:', err)
          setTrackerLadeStatus('fertig')
        })
    }
    lade()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, istDemoModus])

  const reload = useCallback(async () => {
    setConfigsLadeStatus('laden')
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const result = await apiService.ladeAlleConfigs(user.email)
      if (result) {
        setConfigs(result)
        schreibeGespeicherteAnzahl('examlab-lp-letzte-summative-anzahl', result.filter(c => c.typ !== 'formativ').length)
        schreibeGespeicherteAnzahl('examlab-lp-letzte-formative-anzahl', result.filter(c => c.typ === 'formativ').length)
      }
      setConfigsLadeStatus('fertig')
    } else {
      setConfigs(demoConfigs())
      setConfigsLadeStatus('fertig')
    }
  }, [user, istDemoModus])

  const findeTrackerSummary = useCallback((pruefungId: string): TrackerPruefungSummary | undefined => {
    if (!trackerDaten) return undefined
    return trackerDaten.pruefungen.find((p) => p.pruefungId === pruefungId)
  }, [trackerDaten])

  return {
    configs, setConfigs,
    configsLadeStatus, setConfigsLadeStatus,
    trackerLadeStatus,
    trackerDaten,
    backendFehler,
    findeTrackerSummary,
    reload,
  }
}
```

- [ ] **Step 4.2: tsc + bestehende Tests grün**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5 && npx vitest run 2>&1 | tail -5
```
Expected: tsc clean, 1324+~13 = ~1337 passes (Task 1 + 2 + 3 hinzugefügt).

- [ ] **Step 4.3: Commit**

```bash
git add ExamLab/src/hooks/useLPDashboardData.ts
git commit -m "Bundle T.f Phase 4: useLPDashboardData Hook (Lade-useEffect + reload + findeTrackerSummary)"
```

---

## Task 5: `PruefungsKarte.tsx` (mit `TrackerBadge` co-located)

Mechanische Verlagerung von LPStartseite.tsx Z. 916-1010 (PruefungsKarte) + Z. 1013-1038 (TrackerBadge). Byte-identisch.

**Files:**
- Create: `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx`

- [ ] **Step 5.1: Sub-Folder + File anlegen**

```tsx
// ExamLab/src/components/lp/startseite/PruefungsKarte.tsx
import { useState } from 'react'
import { useFavoritenStore } from '../../../store/favoritenStore'
import { formatDatum } from '../../../utils/zeit'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'
import { bestimmePruefungsStatus, statusLabel, statusFarbe, korrekturLabel } from '../../../utils/trackerUtils'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { TrackerPruefungSummary } from '../../../types/tracker'

/** Prüfungskarte — wiederverwendbar für Zuletzt-Sektion und Hauptliste */
export function PruefungsKarte({ config: c, onBearbeiten, onDuplizieren, trackerSummary }: {
  config: PruefungsConfig
  onBearbeiten: (c: PruefungsConfig) => void
  onDuplizieren: (c: PruefungsConfig) => void
  trackerSummary?: TrackerPruefungSummary
}) {
  const toggleFavorit = useFavoritenStore(s => s.toggleFavorit)
  const istFavoritFn = useFavoritenStore(s => s.istFavorit)
  const istFav = istFavoritFn(c.id)
  const [linkKopiert, setLinkKopiert] = useState(false)
  const kopiereLink = async () => {
    const screen = c.typ === 'formativ' ? 'uebung' : 'pruefung'
    const url = `${window.location.origin}${window.location.pathname}#/${screen}/${c.id}`
    try { await navigator.clipboard.writeText(url) } catch {
      const input = document.createElement('input')
      input.value = url; document.body.appendChild(input); input.select()
      document.execCommand('copy'); document.body.removeChild(input)
    }
    setLinkKopiert(true); setTimeout(() => setLinkKopiert(false), 2000)
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <button
          onClick={() => toggleFavorit({ typ: c.typ === 'formativ' ? 'uebung' : 'pruefung', ziel: c.id, label: c.titel })}
          className="mt-0.5 text-lg leading-none cursor-pointer hover:scale-110 transition-transform shrink-0"
          title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          {istFav ? '⭐' : '☆'}
        </button>
        <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{c.titel}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <span>{c.klasse}</span>
          <span>·</span>
          <span>{formatDatum(c.datum)}</span>
          <span>·</span>
          <span>{c.dauerMinuten} Min.</span>
          <span>·</span>
          <span>{c.gesamtpunkte} P.</span>
          <span>·</span>
          <span>{c.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)} Fragen</span>
          {c.fachbereiche.map((fb) => {
            const farbe = getFachFarbe(fb, {})
            return (
              <span
                key={fb}
                className="px-1.5 py-0.5 text-xs rounded"
                style={{ backgroundColor: farbe + '20', color: farbe }}
              >
                {fb}
              </span>
            )
          })}
        </div>
        {trackerSummary && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <TrackerBadge summary={trackerSummary} />
          </div>
        )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`${window.location.pathname}?id=${c.id}`}
          className={c.beendetUm
            ? 'px-4 py-2 text-xs font-medium text-white dark:text-slate-800 bg-slate-800 dark:bg-slate-200 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors'
            : 'px-4 py-2 text-xs font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors'}
        >
          {c.beendetUm ? 'Auswerten' : c.typ === 'formativ' ? 'Übung starten' : 'Prüfung starten'}
        </a>
        <button
          onClick={kopiereLink}
          className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
          title="SuS-Link kopieren"
        >
          {linkKopiert ? '✓' : '🔗'}
        </button>
        <button
          onClick={() => onDuplizieren(c)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Duplizieren
        </button>
        <button
          onClick={() => onBearbeiten(c)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Bearbeiten
        </button>
      </div>
    </div>
  )
}

/** Tracker-Badges für eine Prüfungskarte: Teilnahme, Korrektur, Durchschnitt, Status */
function TrackerBadge({ summary: s }: { summary: TrackerPruefungSummary }) {
  const status = bestimmePruefungsStatus(s)
  return (
    <>
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span className={`w-2 h-2 rounded-full ${statusFarbe(status)}`} />
        {statusLabel(status)}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {s.eingereicht}/{s.teilnehmerGesamt} eingereicht
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {korrekturLabel(s)}
      </span>
      {s.durchschnittNote !== null && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          &#216; {s.durchschnittNote.toFixed(1)}
        </span>
      )}
    </>
  )
}
```

- [ ] **Step 5.2: tsc — soll grün sein** (Komponente noch nicht konsumiert, aber Type-Check ok)

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```
Expected: clean.

- [ ] **Step 5.3: Commit**

```bash
git add ExamLab/src/components/lp/startseite/PruefungsKarte.tsx
git commit -m "Bundle T.f Phase 5: PruefungsKarte (mit TrackerBadge co-located) extrahiert"
```

---

## Task 6: `FilterLeiste.tsx` (DRY-Komponente)

Konsolidiert die 2 nahezu-identischen Filter-Toolbar-Blöcke (LPStartseite.tsx Z. 537-606 + Z. 688-755) in **eine** Komponente. Beide Modi (Übungen + Prüfungen) nutzen sie.

**Files:**
- Create: `ExamLab/src/components/lp/startseite/FilterLeiste.tsx`

**Wichtig:** Gefäss-Sektion wird intern bedingt gerendert (`verfuegbareGefaesse.length > 0`) — eliminiert das Conditional-Render-Wrapper-Unterschied zwischen Übungen-Toolbar (Z. 554) und Prüfungen-Toolbar (Z. 706, ohne Wrapper, aber mit `verfuegbareGefaesse.map` der trotzdem leeren Array byte-identisch nichts rendert).

- [ ] **Step 6.1: File anlegen**

```tsx
// ExamLab/src/components/lp/startseite/FilterLeiste.tsx
import type { ReactNode } from 'react'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'

export interface FilterLeisteProps {
  verfuegbareFachbereiche: string[]
  filterFach: string[]
  toggleFachFilter: (fach: string) => void
  verfuegbareGefaesse: string[]
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  hatAktiveFilter: boolean
  resetFilter: () => void
  aktionSlot: ReactNode
}

export function FilterLeiste(props: FilterLeisteProps) {
  const {
    verfuegbareFachbereiche, filterFach, toggleFachFilter,
    verfuegbareGefaesse, filterGefaess, setFilterGefaess,
    filterStatus, setFilterStatus, sortierung, setSortierung,
    hatAktiveFilter, resetFilter, aktionSlot,
  } = props

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {verfuegbareFachbereiche.map(fb => {
          const farbe = getFachFarbe(fb, {})
          const aktiv = filterFach.includes(fb)
          return (
            <button
              key={fb}
              onClick={() => toggleFachFilter(fb)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                !aktiv ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500' : ''
              }`}
              style={aktiv ? { backgroundColor: farbe + '20', color: farbe, borderColor: farbe + '60' } : undefined}
            >
              {fb}
            </button>
          )
        })}
        {verfuegbareGefaesse.length > 0 && <>
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
          {verfuegbareGefaesse.map(g => (
            <button
              key={g}
              onClick={() => setFilterGefaess(filterGefaess === g ? null : g)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                filterGefaess === g
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
              }`}
            >
              {g}
            </button>
          ))}
        </>}
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        {(['aktiv', 'archiviert', 'alle'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
              filterStatus === s
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
            }`}
          >
            {s === 'aktiv' ? 'Aktiv' : s === 'archiviert' ? 'Archiviert' : 'Alle'}
          </button>
        ))}
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <select
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="datum">Neueste zuerst</option>
          <option value="titel">Nach Titel</option>
          <option value="klasse">Nach Klasse</option>
        </select>
        {hatAktiveFilter && (
          <button
            onClick={resetFilter}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            Zurücksetzen
          </button>
        )}
        {aktionSlot}
      </div>
    </div>
  )
}
```

**Hinweis:** Übungen-Toolbar wickelte die Gefäss-Sektion in `verfuegbareGefaesse.length > 0 && <>...</>` (Z. 554). Prüfungen-Toolbar machte das nicht (Z. 706: `verfuegbareGefaesse.map(g => ...)`) — würde bei leerem Array auch nichts rendern, aber DOM-Output wäre identisch (kein Spacer). FilterLeiste verwendet jetzt das Conditional-Wrapper-Pattern für **beide** — bei `verfuegbareGefaesse.length === 0` rendert weder Spacer noch Chips. **DOM-Diff zu vor: Prüfungen-Modus rendert nicht mehr den Spacer wenn `verfuegbareGefaesse === []`.** In der Praxis hat Prüfen immer Gefässe (Standard-Schul-Setup), sodass dies kein E2E-Pfad-Risiko ist. Falls Pruefen leer ist, fehlt nun der Spacer — das ist eine **kleine, akzeptable, byte-nahe Verhaltens-Vereinheitlichung**. Im Spec-Risiko dokumentiert.

- [ ] **Step 6.2: tsc**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```
Expected: clean.

- [ ] **Step 6.3: Commit**

```bash
git add ExamLab/src/components/lp/startseite/FilterLeiste.tsx
git commit -m "Bundle T.f Phase 6: FilterLeiste (DRY: konsolidiert Übungen/Prüfungen-Toolbars)"
```

---

## Task 7: `MultiDashboardDialog.tsx`

Mechanische Verlagerung von LPStartseite.tsx Z. 778-818.

**Files:**
- Create: `ExamLab/src/components/lp/startseite/MultiDashboardDialog.tsx`

- [ ] **Step 7.1: File anlegen**

```tsx
// ExamLab/src/components/lp/startseite/MultiDashboardDialog.tsx
import type { PruefungsConfig } from '../../../types/pruefung'

export interface MultiDashboardDialogProps {
  summativeConfigs: PruefungsConfig[]
  auswahl: Set<string>
  setAuswahl: (s: Set<string>) => void
  onSchliessen: () => void
}

export function MultiDashboardDialog({ summativeConfigs, auswahl, setAuswahl, onSchliessen }: MultiDashboardDialogProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold dark:text-white">Prüfungen für Multi-Dashboard wählen</h3>
        <button onClick={onSchliessen} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">✕</button>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {summativeConfigs.map(c => (
          <label key={c.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={auswahl.has(c.id)}
              onChange={() => {
                const neu = new Set(auswahl)
                if (neu.has(c.id)) neu.delete(c.id)
                else neu.add(c.id)
                setAuswahl(neu)
              }}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <span className="dark:text-slate-200">{c.titel}</span>
            <span className="text-xs text-slate-400 ml-auto">{c.klasse}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onSchliessen} className="text-xs px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400">Abbrechen</button>
        <button
          disabled={auswahl.size < 2}
          onClick={() => {
            const ids = [...auswahl].join(',')
            window.open(`${import.meta.env.BASE_URL}pruefung/monitoring?ids=${ids}`, '_blank')
            onSchliessen()
          }}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 disabled:opacity-40 hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          Dashboard öffnen ({auswahl.size} Prüfungen)
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7.2: tsc + Commit**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
git add ExamLab/src/components/lp/startseite/MultiDashboardDialog.tsx
git commit -m "Bundle T.f Phase 7: MultiDashboardDialog extrahiert"
```

---

## Task 8: `LPUebungenAnsicht.tsx`

Übungen-Tab-Body (LPStartseite.tsx Z. 519-634, das `uebungsTab === 'durchfuehren'` JSX-Block). Konsumiert `FilterLeiste` (Task 6) und `PruefungsKarte` (Task 5).

**Files:**
- Create: `ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx`

- [ ] **Step 8.1: File anlegen**

```tsx
// ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx
import LPUebungenSkeleton from '../skeletons/LPUebungenSkeleton'
import Button from '../../ui/Button'
import { FilterLeiste } from './FilterLeiste'
import { PruefungsKarte } from './PruefungsKarte'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { TrackerPruefungSummary } from '../../../types/tracker'

export interface LPUebungenAnsichtProps {
  configsLadeStatus: 'laden' | 'fertig'
  formativeConfigs: PruefungsConfig[]
  gefilterteUebungen: PruefungsConfig[]
  favoritenUebungen: PruefungsConfig[]
  hatAktiveFilter: boolean

  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  filterFach: string[]
  toggleFachFilter: (f: string) => void
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  resetFilter: () => void

  handleNeueUebung: () => void
  handleBearbeiten: (c: PruefungsConfig) => void
  handleDuplizieren: (c: PruefungsConfig) => void
  findeTrackerSummary: (id: string) => TrackerPruefungSummary | undefined
}

export function LPUebungenAnsicht(props: LPUebungenAnsichtProps) {
  const {
    configsLadeStatus, formativeConfigs, gefilterteUebungen, favoritenUebungen, hatAktiveFilter,
    verfuegbareFachbereiche, verfuegbareGefaesse, filterFach, toggleFachFilter,
    filterGefaess, setFilterGefaess, filterStatus, setFilterStatus,
    sortierung, setSortierung, resetFilter,
    handleNeueUebung, handleBearbeiten, handleDuplizieren, findeTrackerSummary,
  } = props

  return (
    <main className="p-6">
      {configsLadeStatus === 'laden' && <LPUebungenSkeleton />}
      {configsLadeStatus === 'fertig' && formativeConfigs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Noch keine Übungen</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Erstellen Sie Ihre erste formative Übung.</p>
          <Button variant="primary" size="md" onClick={handleNeueUebung}>
            + Neue Übung erstellen
          </Button>
        </div>
      )}
      {configsLadeStatus === 'fertig' && formativeConfigs.length > 0 && (
        <div className="space-y-3">
          <FilterLeiste
            verfuegbareFachbereiche={verfuegbareFachbereiche}
            filterFach={filterFach}
            toggleFachFilter={toggleFachFilter}
            verfuegbareGefaesse={verfuegbareGefaesse}
            filterGefaess={filterGefaess}
            setFilterGefaess={setFilterGefaess}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortierung={sortierung}
            setSortierung={setSortierung}
            hatAktiveFilter={hatAktiveFilter}
            resetFilter={resetFilter}
            aktionSlot={
              <Button variant="primary" size="sm" onClick={handleNeueUebung} className="ml-auto whitespace-nowrap">
                + Neue Übung
              </Button>
            }
          />

          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {hatAktiveFilter
              ? `${gefilterteUebungen.length} von ${formativeConfigs.length} Übungen`
              : `${formativeConfigs.length} Übung${formativeConfigs.length !== 1 ? 'en' : ''}`}
          </h2>

          {!hatAktiveFilter && favoritenUebungen.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>⭐</span> Favoriten
              </h3>
              {favoritenUebungen.map(c => (
                <PruefungsKarte key={`fav-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
              ))}
              <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
            </div>
          )}

          {gefilterteUebungen.map(c => (
            <PruefungsKarte key={c.id} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 8.2: tsc + Commit**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
git add ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx
git commit -m "Bundle T.f Phase 8: LPUebungenAnsicht extrahiert (konsumiert FilterLeiste + PruefungsKarte)"
```

---

## Task 9: `LPPruefungenAnsicht.tsx`

Prüfen-Modus-Body (LPStartseite.tsx Z. 643-862, das gesamte `<main className="p-6">...</main>` im `modus === 'pruefung'`-Block). Konsumiert `FilterLeiste`, `PruefungsKarte`, `MultiDashboardDialog`.

**Files:**
- Create: `ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx`

- [ ] **Step 9.1: File anlegen**

```tsx
// ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx
import LPCardsSkeleton from '../skeletons/LPCardsSkeleton'
import LPTrackerSkeleton from '../skeletons/LPTrackerSkeleton'
import TrackerSection from '../TrackerSection'
import Button from '../../ui/Button'
import { FilterLeiste } from './FilterLeiste'
import { PruefungsKarte } from './PruefungsKarte'
import { MultiDashboardDialog } from './MultiDashboardDialog'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { TrackerDaten, TrackerPruefungSummary } from '../../../types/tracker'

export interface LPPruefungenAnsichtProps {
  configs: PruefungsConfig[]
  configsLadeStatus: 'laden' | 'fertig'
  trackerLadeStatus: 'laden' | 'fertig'
  trackerDaten: TrackerDaten | null
  backendFehler: boolean
  istDemoModus: boolean
  listenTab: 'pruefungen' | 'tracker'

  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  summativeConfigs: PruefungsConfig[]
  gefilterteConfigs: PruefungsConfig[]
  letzteFuenf: PruefungsConfig[]
  favoritenPruefungen: PruefungsConfig[]
  hatAktiveFilter: boolean

  filterFach: string[]
  toggleFachFilter: (f: string) => void
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  resetFilter: () => void

  multiDashboardOffen: boolean
  setMultiDashboardOffen: (o: boolean) => void
  multiDashboardAuswahl: Set<string>
  setMultiDashboardAuswahl: (s: Set<string>) => void

  handleNeue: () => void
  handleBearbeiten: (c: PruefungsConfig) => void
  handleDuplizieren: (c: PruefungsConfig) => void
  findeTrackerSummary: (id: string) => TrackerPruefungSummary | undefined
}

export function LPPruefungenAnsicht(props: LPPruefungenAnsichtProps) {
  const {
    configsLadeStatus, trackerLadeStatus, trackerDaten, backendFehler, istDemoModus, listenTab,
    verfuegbareFachbereiche, verfuegbareGefaesse,
    summativeConfigs, gefilterteConfigs, letzteFuenf, favoritenPruefungen, hatAktiveFilter,
    filterFach, toggleFachFilter, filterGefaess, setFilterGefaess,
    filterStatus, setFilterStatus, sortierung, setSortierung, resetFilter,
    multiDashboardOffen, setMultiDashboardOffen,
    multiDashboardAuswahl, setMultiDashboardAuswahl,
    handleNeue, handleBearbeiten, handleDuplizieren, findeTrackerSummary,
  } = props

  return (
    <main className="p-6">
      {configsLadeStatus === 'laden' && listenTab === 'pruefungen' && <LPCardsSkeleton />}

      {configsLadeStatus === "fertig" && backendFehler && !istDemoModus && (
        <div className="mb-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <span className="text-slate-400 shrink-0 mt-0.5">ⓘ</span>
          <span>Backend nicht erreichbar — bestehende Prüfungen konnten nicht geladen werden. Der Composer ist trotzdem nutzbar.</span>
        </div>
      )}

      {listenTab === 'tracker' && (
        trackerLadeStatus === 'laden' ? (
          <LPTrackerSkeleton />
        ) : trackerDaten ? (
          <TrackerSection trackerDaten={trackerDaten} />
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
            Keine Tracker-Daten verfügbar.
          </p>
        )
      )}

      {listenTab === 'pruefungen' && configsLadeStatus === 'fertig' && summativeConfigs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Noch keine Prüfungen
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Erstellen Sie Ihre erste digitale Prüfung.
          </p>
          <Button variant="primary" size="md" onClick={handleNeue}>
            + Neue Prüfung erstellen
          </Button>
        </div>
      )}

      {listenTab === 'pruefungen' && configsLadeStatus === 'fertig' && summativeConfigs.length > 0 && (
        <div className="space-y-3">
          <FilterLeiste
            verfuegbareFachbereiche={verfuegbareFachbereiche}
            filterFach={filterFach}
            toggleFachFilter={toggleFachFilter}
            verfuegbareGefaesse={verfuegbareGefaesse}
            filterGefaess={filterGefaess}
            setFilterGefaess={setFilterGefaess}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortierung={sortierung}
            setSortierung={setSortierung}
            hatAktiveFilter={hatAktiveFilter}
            resetFilter={resetFilter}
            aktionSlot={
              <Button variant="primary" size="sm" onClick={handleNeue} className="ml-auto whitespace-nowrap">
                + Neue Prüfung
              </Button>
            }
          />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {hatAktiveFilter
                ? `${gefilterteConfigs.length} von ${summativeConfigs.length} Prüfungen`
                : `${summativeConfigs.length} Prüfungen`}
            </h2>
            {summativeConfigs.length > 1 && (
              <button
                onClick={() => {
                  setMultiDashboardAuswahl(new Set())
                  setMultiDashboardOffen(true)
                }}
                className="text-xs px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Multi-Dashboard
              </button>
            )}
          </div>

          {multiDashboardOffen && (
            <MultiDashboardDialog
              summativeConfigs={summativeConfigs}
              auswahl={multiDashboardAuswahl}
              setAuswahl={setMultiDashboardAuswahl}
              onSchliessen={() => setMultiDashboardOffen(false)}
            />
          )}

          {!hatAktiveFilter && favoritenPruefungen.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>⭐</span> Favoriten
              </h3>
              {favoritenPruefungen.map(c => (
                <PruefungsKarte key={`fav-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
              ))}
              <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
            </div>
          )}

          {letzteFuenf.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Zuletzt
              </h3>
              {letzteFuenf.map(c => (
                <PruefungsKarte key={`recent-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
              ))}
              <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide pt-1">
                Alle Prüfungen
              </h3>
            </div>
          )}

          {gefilterteConfigs.length === 0 && hatAktiveFilter && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
              Keine Prüfungen entsprechen den Filtern.
            </p>
          )}
          {gefilterteConfigs.map(c => (
            <PruefungsKarte key={c.id} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 9.2: tsc + Commit**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
git add ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx
git commit -m "Bundle T.f Phase 9: LPPruefungenAnsicht extrahiert"
```

---

## Task 10: `LPStartseite.tsx` Slim-Down (Caller-Wiring)

Integriert alle 8 Extraktionen in `LPStartseite.tsx`. Entfernt: 5 useState (Daten), 12 useMemo (Filter+Favoriten), 4 Sync-Helper-Funktionen + Konstanten, 1 grosser useEffect, `findeTrackerSummary`-Helper, `PruefungsKarte`+`TrackerBadge`+`demoConfigs` (am Ende). Hinzu: 8 Imports + 3 Hook-Calls + 5 JSX-Aufrufe + 1 `resetFilter`-Helper.

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx` (1043 → ~430 Z.)

**WICHTIG — Was bleibt im Body** (siehe Spec §4.8):
- `LPStartseite`-Dispatcher Z. 57-70 (byte-identisch)
- 6 Filter-useState + 2 UI-useState (`editConfig`, `multiDashboardOffen`, `multiDashboardAuswahl`)
- `aktiverKurs`-Memo (Z. 104, gehört zur Üben-Kurs-Domain, NICHT in Hooks)
- 4 kleine useEffect: kurs-redirect, localStorage-kurs, deepLink-config, beforeunload
- `useLPRouteSync()` (Z. 397)
- Action-Helpers: `toggleFachFilter`, `resetFilter` (NEU), `handleNeue`, `handleNeueUebung`, `handleBearbeiten`, `handleDuplizieren`, `handleZurueck`
- Top-level Layout-JSX + 5 Modus-Branches (`<LPPruefungenAnsicht>`, `<LPUebungenAnsicht>`, `<FragenBrowser>`, `<PapierkorbView>`, `<PruefungsComposer>`)

- [ ] **Step 10.1: Alte Imports entfernen, neue hinzufügen**

Entfernen aus Imports (Z. 1-37):
- `useState`, `useEffect`, `useMemo` aus `'react'` → behalten nur `Suspense`, `useState`, `useEffect`. (`useMemo` weg, weil `aktiverKurs` als einziger Memo bleibt — daher `useMemo` MUSS BLEIBEN. **Korrektur:** `useState`+`useEffect`+`useMemo` alle drei behalten.)
- `useFragensammlungStore`, `useStammdatenStore` (jetzt im Hook) — entfernen
- `useToast` (jetzt im Hook) — entfernen, weil Body braucht keinen toast mehr (alle 2 toast-Calls in Body waren in handleNeue/handleZurueck — beide ohne toast). **Verify:** falls Body irgendwo `toast.warning(...)` braucht, behalten.
- `apiService` (jetzt im Hook) — bleibt für `handleZurueck`-Reload-Pfad. ABER: wenn `reload()` aus Hook benutzt wird, kann `apiService`-Import weg. **Entscheidung:** entfernen, `handleZurueck` ruft `reload()` aus Hook.
- `bestimmePruefungsStatus`, `statusLabel`, `statusFarbe`, `korrekturLabel`, `erstelleDemoTrackerDaten` — alle in PruefungsKarte/Hook, weg.
- `formatDatum`, `getFachFarbe` — in PruefungsKarte/FilterLeiste, weg.
- `einrichtungsPruefung`, `einrichtungsFragen`, `einrichtungsUebung`, `einrichtungsUebungFragen` — alle im Hook/Utility, weg.
- `speichereConfig`, `speichereFrage` — alle in Utility, weg.
- `schreibeGespeicherteAnzahl` — im Hook, weg.
- `LPCardsSkeleton`, `LPUebungenSkeleton`, `LPTrackerSkeleton` — in den Ansicht-Komponenten, weg.
- `TrackerSection` — in LPPruefungenAnsicht, weg.
- `Button` — in den Ansicht-Komponenten, weg (LPStartseite-Body braucht keinen Button mehr).

Hinzufügen:
```typescript
import { useLPConfigFiltering } from '../../hooks/useLPConfigFiltering'
import { useLPFavoriten } from '../../hooks/useLPFavoriten'
import { useLPDashboardData } from '../../hooks/useLPDashboardData'
import { useToast } from '../../hooks/useToast'  // bleibt für kurs-redirect-toast.warning Z. 114
import { LPUebungenAnsicht } from './startseite/LPUebungenAnsicht'
import { LPPruefungenAnsicht } from './startseite/LPPruefungenAnsicht'
```

**`useToast` bleibt** — `handleZurueck` (Z. 114) ruft `toast.warning(...)` für kurs-redirect.

- [ ] **Step 10.2: Body-Restrukturierung in `LPStartseiteInner`**

Konkrete Schritte (siehe gewünschtes Ergebnis unten):

1. **Behalten** Z. 73-127 (User/UI-Stores/Navigation/aktiverKurs/Kurs-useEffect's). `useFragensammlungStore`/`useStammdatenStore`-Imports werden nicht mehr genutzt (sind im Hook).
2. **Behalten** 6 Filter-useState (heute Z. 139-144) + `editConfig`, `multiDashboardOffen`, `multiDashboardAuswahl` useState (Z. 133-135).
3. **Entfernen** 5 Daten-useState (Z. 129-132 + Z. 136). Werden via Hook bereitgestellt.
4. **Hook-Call hinzufügen** anstelle:
```tsx
const {
  configs, setConfigs,
  configsLadeStatus, setConfigsLadeStatus,
  trackerLadeStatus,
  trackerDaten,
  backendFehler,
  findeTrackerSummary,
  reload,
} = useLPDashboardData({ user, istDemoModus })
```
5. **Entfernen** `verfuegbareFachbereiche`, `verfuegbareGefaesse`, `summativeConfigs`, `gefilterteConfigs`, `formativeConfigs`, `gefilterteUebungen`, `letzteFuenf` Memos + `filtereConfigs`-Helper + `hatAktiveFilter` (Z. 146-235).
6. **Hook-Call hinzufügen:**
```tsx
const {
  verfuegbareFachbereiche, verfuegbareGefaesse,
  summativeConfigs, gefilterteConfigs, formativeConfigs, gefilterteUebungen,
  letzteFuenf, hatAktiveFilter,
} = useLPConfigFiltering({
  configs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus,
})
```
7. **Entfernen** `favoritenConfigIds`, `favoritenConfigs`, `favoritenPruefungen`, `favoritenUebungen` Memos (Z. 219-229).
8. **Hook-Call hinzufügen:**
```tsx
const favoriten = useFavoritenStore(s => s.favoriten)
const { favoritenPruefungen, favoritenUebungen } = useLPFavoriten(configs, favoriten)
```
(`favoritenConfigIds` + `favoritenConfigs` werden nicht mehr im Body referenziert — sie waren intern.)
9. **Entfernen** Sync-Konstanten + `syncFragenSeriell` + `syncEinrichtungsPruefung` + `syncEinrichtungsUebung` (Z. 243-297).
10. **Entfernen** Lade-useEffect (Z. 300-394). Ist im Hook.
11. **Behalten** `useLPRouteSync()` (Z. 397).
12. **Behalten** DeepLink-useEffect (Z. 401-408).
13. **Behalten** beforeunload-useEffect (Z. 413-422).
14. **Behalten** `handleNeue`, `handleNeueUebung`, `handleBearbeiten`, `handleDuplizieren` (Z. 424-457).
15. **`handleZurueck` ersetzen** (Z. 459-476):
```tsx
function handleZurueck(): void {
  backToDashboard()
  reload()
}
```
16. **Entfernen** `findeTrackerSummary` (Z. 482-485). Ist im Hook.
17. **`resetFilter`-Helper hinzufügen** (heute inline 2× in den Toolbars):
```tsx
function resetFilter(): void {
  setSuchtext('')
  setFilterFach([])
  setFilterTyp(null)
  setFilterGefaess(null)
  setFilterStatus('aktiv')
}
```
18. **JSX-Body restrukturieren:**
- `{ansicht !== 'composer' && modus === 'uebung' && (...)}` Z. 513-637 → `uebungsTab === 'durchfuehren'` Block (Z. 519-634) wird durch `<LPUebungenAnsicht ... />` ersetzt. `uebungsTab === 'uebungen'` und `uebungsTab === 'analyse'` bleiben byte-identisch.
- `{ansicht !== 'composer' && modus === 'pruefung' && <>...</>}` Z. 641-862 → der gesamte `<main>`-Block wird durch `<LPPruefungenAnsicht ... />` ersetzt.

19. **Entfernen am Ende des Files:** `PruefungsKarte`-Funktion (Z. 916-1010), `TrackerBadge`-Funktion (Z. 1013-1038), `demoConfigs`-Helper (Z. 1041-1043).

- [ ] **Step 10.3: Konkrete Schreib-Operation**

Statt einer Edit-Sequenz mit 30+ Schritten: **Datei komplett neu schreiben** als finalen Slim-Down. Implementer-Subagent soll die Datei via Write-Tool ersetzen mit dem unten skizzierten Inhalt.

**Erwartetes File-Skeleton (finaler Body, ~430 Zeilen):**

```tsx
// LPStartseite.tsx
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useLPNavigationStore } from '../../store/lpUIStore'
import { useFavoritenStore } from '../../store/favoritenStore'
import { useLPRouteSync } from '../../hooks/useLPRouteSync'
import { useLPNavigation } from '../../hooks/useLPNavigation'
import { useLPConfigFiltering } from '../../hooks/useLPConfigFiltering'
import { useLPFavoriten } from '../../hooks/useLPFavoriten'
import { useLPDashboardData } from '../../hooks/useLPDashboardData'
import { useToast } from '../../hooks/useToast'
import type { PruefungsConfig } from '../../types/pruefung'
import { LPAppHeaderContainer } from './LPAppHeaderContainer'
import UebungsToolView from './UebungsToolView'
import { useDraftStore } from '../../store/draftStore'
import { MultiDurchfuehrenDashboard } from './durchfuehrung/MultiDurchfuehrenDashboard'
import DurchfuehrenDashboard from './durchfuehrung/DurchfuehrenDashboard'
import LazyFallback from '../ui/LazyFallback'
import { lazyMitRetry } from '../../utils/lazyMitRetry'
import { leereUebung } from './vorbereitung/configVorlagen'
import { LPUebungenAnsicht } from './startseite/LPUebungenAnsicht'
import { LPPruefungenAnsicht } from './startseite/LPPruefungenAnsicht'

const PruefungsComposer = lazyMitRetry(() => import('./vorbereitung/PruefungsComposer'))
const FragenBrowser = lazyMitRetry(() => import('./fragensammlung/FragenBrowser'))
const PapierkorbView = lazyMitRetry(() => import('./papierkorb/PapierkorbView'))
const HilfeSeite = lazyMitRetry(() => import('./HilfeSeite'))
const EinstellungenPanel = lazyMitRetry(() => import('../settings/EinstellungenPanel'))
const AnalyseDashboard = lazyMitRetry(() => import('./ueben/AnalyseDashboard'))

/**
 * Startseite für Lehrpersonen. Dispatcher: basierend auf URL-Query rendert entweder
 * Multi-Durchführen, Einzel-Durchführen oder das normale Dashboard.
 *
 * Wrapper-Pattern statt früherer `useMemo(..., [])`-Early-Returns: beim URL-Wechsel
 * (L1-Tab-Klick Üben/Fragensammlung) wird der Sub-Tree neu gemountet, Hook-Order in
 * LPStartseiteInner bleibt stabil (verhindert React-#310 bei Wechsel zwischen
 * Durchführen-Modus und Liste).
 */
export default function LPStartseite() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const multiIds = params.get('ids')?.split(',').filter(Boolean) ?? []
  const singleId = params.get('id')

  if (multiIds.length > 1) {
    return <MultiDurchfuehrenDashboard pruefungIds={multiIds} />
  }
  if (singleId) {
    return <DurchfuehrenDashboard pruefungId={singleId} />
  }
  return <LPStartseiteInner />
}

function LPStartseiteInner() {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)
  const toast = useToast()

  // Navigation aus dem Store
  const ansicht = useLPNavigationStore(s => s.ansicht)
  const modus = useLPNavigationStore(s => s.modus)
  const listenTab = useLPNavigationStore(s => s.listenTab)
  const uebungsTab = useLPNavigationStore(s => s.uebungsTab)
  const zeigHilfe = useLPNavigationStore(s => s.zeigHilfe)
  const zeigEinstellungen = useLPNavigationStore(s => s.zeigEinstellungen)
  const composerKey = useLPNavigationStore(s => s.composerKey)
  const { setModus, backToDashboard, openComposer } = useLPNavigation()
  const neuerComposerKey = useLPNavigationStore(s => s.neuerComposerKey)
  const navigate = useNavigate()
  const { kursId: urlKursId, frageId: urlFrageId } = useParams<{ kursId?: string; frageId?: string }>()
  const [queryParams] = useSearchParams()
  const queryFrageId = queryParams.get('frage') || undefined
  const gruppen = useUebenGruppenStore(s => s.gruppen)
  const aktiverKursId = urlKursId
  const aktiverKurs = useMemo(
    () => gruppen.find(g => g.id === aktiverKursId),
    [gruppen, aktiverKursId]
  )

  // Invaliden Kurs → Redirect auf erste Gruppe + Toast
  useEffect(() => {
    if (urlKursId && !aktiverKurs && gruppen.length > 0) {
      const zielName = gruppen[0].name
      navigate(`/uebung/kurs/${gruppen[0].id}`, { replace: true })
      toast.warning(`Kurs "${urlKursId}" nicht gefunden — zu ${zielName} umgeleitet`)
    }
  }, [urlKursId, aktiverKurs, gruppen, navigate, toast])

  // localStorage: letzten Kurs merken
  useEffect(() => {
    if (aktiverKursId) {
      try { localStorage.setItem('examlab-ueben-letzter-kurs', aktiverKursId) } catch { /* */ }
    }
  }, [aktiverKursId])
  const toggleHilfe = useLPNavigationStore(s => s.toggleHilfe)
  const toggleEinstellungen = useLPNavigationStore(s => s.toggleEinstellungen)
  const setZeigEinstellungen = useLPNavigationStore(s => s.setZeigEinstellungen)

  // UI-State (nicht Hook-extrahiert)
  const [editConfig, setEditConfig] = useState<PruefungsConfig | null>(null)
  const [multiDashboardOffen, setMultiDashboardOffen] = useState(false)
  const [multiDashboardAuswahl, setMultiDashboardAuswahl] = useState<Set<string>>(new Set())

  // Filter-State
  const [suchtext, setSuchtext] = useState('')
  const [filterFach, setFilterFach] = useState<string[]>([])
  const [filterTyp, setFilterTyp] = useState<string | null>(null)
  const [filterGefaess, setFilterGefaess] = useState<string | null>(null)
  const [sortierung, setSortierung] = useState<'datum' | 'titel' | 'klasse'>('datum')
  const [filterStatus, setFilterStatus] = useState<'alle' | 'aktiv' | 'archiviert'>('aktiv')

  // Daten-Hook
  const {
    configs, configsLadeStatus,
    trackerLadeStatus, trackerDaten, backendFehler,
    findeTrackerSummary, reload,
  } = useLPDashboardData({ user, istDemoModus })

  // Filter-Hook
  const {
    verfuegbareFachbereiche, verfuegbareGefaesse,
    summativeConfigs, gefilterteConfigs, formativeConfigs, gefilterteUebungen,
    letzteFuenf, hatAktiveFilter,
  } = useLPConfigFiltering({
    configs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus,
  })

  // Favoriten-Hook
  const favoriten = useFavoritenStore(s => s.favoriten)
  const { favoritenPruefungen, favoritenUebungen } = useLPFavoriten(configs, favoriten)

  // URL → Store Sync
  useLPRouteSync()

  // Deep Link
  const aktiveConfigId = useLPNavigationStore(s => s.aktiveConfigId)
  const deepLinkFrageId = useLPNavigationStore(s => s.deepLinkFrageId)
  const clearDeepLinkFrageId = useLPNavigationStore(s => s.clearDeepLinkFrageId)
  useEffect(() => {
    if (configsLadeStatus !== 'fertig' || !aktiveConfigId || ansicht === 'composer') return
    const config = configs.find(c => c.id === aktiveConfigId)
    if (!config) return
    setEditConfig(config)
    useLPNavigationStore.getState().openComposer(config.titel || 'Bearbeiten', config.id)
  }, [configsLadeStatus, aktiveConfigId, configs, ansicht])

  // beforeunload — warnt vor ungespeicherten Änderungen
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useDraftStore.getState().hatDirty()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  function toggleFachFilter(fach: string): void {
    setFilterFach(prev => prev.includes(fach) ? prev.filter(f => f !== fach) : [...prev, fach])
  }

  function resetFilter(): void {
    setSuchtext('')
    setFilterFach([])
    setFilterTyp(null)
    setFilterGefaess(null)
    setFilterStatus('aktiv')
  }

  function handleNeue(): void {
    setEditConfig(null)
    openComposer('Neue Prüfung')
  }

  function handleNeueUebung(): void {
    setEditConfig({ ...leereUebung })
    neuerComposerKey()
    openComposer('Neue Übung')
  }

  function handleBearbeiten(config: PruefungsConfig): void {
    setEditConfig(config)
    openComposer(config.titel || 'Bearbeiten', config.id)
  }

  function handleDuplizieren(config: PruefungsConfig): void {
    const kopie: PruefungsConfig = {
      ...config,
      id: '',
      titel: `${config.titel} (Kopie)`,
      datum: new Date().toISOString().split('T')[0],
      freigeschaltet: false,
      erlaubteKlasse: '',
      teilnehmer: [],
      beendetUm: undefined,
      durchfuehrungId: undefined,
      zeitverlaengerungen: {},
      sebAusnahmen: [],
    }
    setEditConfig(kopie)
    neuerComposerKey()
    openComposer(`${config.titel} (Kopie)`)
  }

  function handleZurueck(): void {
    backToDashboard()
    reload()
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {ansicht !== 'composer' && (
        <LPAppHeaderContainer
          onHilfe={toggleHilfe}
          onEinstellungen={() => toggleEinstellungen()}
        />
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
      <div className={`flex-1 min-h-0 ${ansicht !== 'composer' && modus === 'fragensammlung' ? 'overflow-hidden' : 'overflow-y-auto'}`}>

      {ansicht === 'composer' && (
        <Suspense fallback={<LazyFallback />}>
          <PruefungsComposer key={composerKey} config={editConfig} onZurueck={handleZurueck} onDuplizieren={handleDuplizieren} />
        </Suspense>
      )}

      {ansicht !== 'composer' && modus === 'uebung' && (
        <>
          {uebungsTab === 'uebungen' && <UebungsToolView aktiverKursId={aktiverKursId} onFachKlick={() => setModus('fragensammlung')} />}

          {uebungsTab === 'durchfuehren' && (
            <LPUebungenAnsicht
              configsLadeStatus={configsLadeStatus}
              formativeConfigs={formativeConfigs}
              gefilterteUebungen={gefilterteUebungen}
              favoritenUebungen={favoritenUebungen}
              hatAktiveFilter={hatAktiveFilter}
              verfuegbareFachbereiche={verfuegbareFachbereiche}
              verfuegbareGefaesse={verfuegbareGefaesse}
              filterFach={filterFach}
              toggleFachFilter={toggleFachFilter}
              filterGefaess={filterGefaess}
              setFilterGefaess={setFilterGefaess}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              sortierung={sortierung}
              setSortierung={setSortierung}
              resetFilter={resetFilter}
              handleNeueUebung={handleNeueUebung}
              handleBearbeiten={handleBearbeiten}
              handleDuplizieren={handleDuplizieren}
              findeTrackerSummary={findeTrackerSummary}
            />
          )}

          {uebungsTab === 'analyse' && <Suspense fallback={<LazyFallback />}><AnalyseDashboard /></Suspense>}
        </>
      )}

      {ansicht !== 'composer' && modus === 'pruefung' && (
        <LPPruefungenAnsicht
          configs={configs}
          configsLadeStatus={configsLadeStatus}
          trackerLadeStatus={trackerLadeStatus}
          trackerDaten={trackerDaten}
          backendFehler={backendFehler}
          istDemoModus={istDemoModus}
          listenTab={listenTab}
          verfuegbareFachbereiche={verfuegbareFachbereiche}
          verfuegbareGefaesse={verfuegbareGefaesse}
          summativeConfigs={summativeConfigs}
          gefilterteConfigs={gefilterteConfigs}
          letzteFuenf={letzteFuenf}
          favoritenPruefungen={favoritenPruefungen}
          hatAktiveFilter={hatAktiveFilter}
          filterFach={filterFach}
          toggleFachFilter={toggleFachFilter}
          filterGefaess={filterGefaess}
          setFilterGefaess={setFilterGefaess}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortierung={sortierung}
          setSortierung={setSortierung}
          resetFilter={resetFilter}
          multiDashboardOffen={multiDashboardOffen}
          setMultiDashboardOffen={setMultiDashboardOffen}
          multiDashboardAuswahl={multiDashboardAuswahl}
          setMultiDashboardAuswahl={setMultiDashboardAuswahl}
          handleNeue={handleNeue}
          handleBearbeiten={handleBearbeiten}
          handleDuplizieren={handleDuplizieren}
          findeTrackerSummary={findeTrackerSummary}
        />
      )}

      {ansicht !== 'composer' && modus === 'fragensammlung' && (
        <main className="h-full min-h-0 p-6 flex flex-col overflow-hidden">
          <Suspense fallback={<LazyFallback />}>
            <FragenBrowser
              inline
              onHinzufuegen={() => {}}
              onSchliessen={() => useLPNavigationStore.getState().back()}
              bereitsVerwendet={[]}
              initialEditFrageId={urlFrageId ?? queryFrageId ?? deepLinkFrageId ?? undefined}
              onFrageAktualisiert={() => { clearDeepLinkFrageId() }}
            />
          </Suspense>
        </main>
      )}

      {ansicht !== 'composer' && modus === 'papierkorb' && (
        <Suspense fallback={<LazyFallback />}>
          <PapierkorbView />
        </Suspense>
      )}

      </div>

      {zeigEinstellungen && (
        <Suspense fallback={<LazyFallback />}>
          <EinstellungenPanel
          initialTab={useLPNavigationStore.getState().einstellungenTab ?? undefined}
          onSchliessen={() => {
            setZeigEinstellungen(false)
            backToDashboard()
          }}
        />
        </Suspense>
      )}
      </div>

      {zeigHilfe && (
        <Suspense fallback={<LazyFallback />}>
          <HilfeSeite onSchliessen={toggleHilfe} />
        </Suspense>
      )}
    </div>
  )
}
```

- [ ] **Step 10.4: Datei via Write-Tool ersetzen**

Implementer-Subagent ersetzt LPStartseite.tsx mit dem oben skizzierten Inhalt (Skeleton).

- [ ] **Step 10.5: tsc + vitest run**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10 && npx vitest run 2>&1 | tail -10
```
Expected: tsc clean, ~1349 vitest passes.

- [ ] **Step 10.6: Falls TypeScript-Errors: fixen, dann erneut**

Häufige Fehler:
- Vergessener Import → ergänzen
- Nicht-genutzter Setter (`setConfigs`, `setConfigsLadeStatus`) wurde aus Hook-Result destrukturiert aber nicht referenziert → entfernen aus Destructuring
- Type-Mismatch bei `findeTrackerSummary`-Signatur → mit Hook-Result-Type abgleichen

- [ ] **Step 10.7: Commit**

```bash
git add ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "Bundle T.f Phase 10: LPStartseite.tsx schlank (1043 → ~430 Z.) — Komposition aller Hooks + Komponenten"
```

---

## Task 11: Verifikations-Gates (alle DoD-Kriterien)

- [ ] **Step 11.1: vitest grün**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -5
```
Expected: ~1349 passes (1324 + ~25 Drift).

- [ ] **Step 11.2: tsc clean** (Output direkt prüfen)

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc-output.log | tail -10 && wc -l /tmp/tsc-output.log
```
Expected: 0-line Output (nur Build-Status), keine Type-Errors.

- [ ] **Step 11.3: lint:as-any clean**

```bash
cd ExamLab && npm run lint:as-any
```
Expected: Total 0 / Defensive 0 / Undokumentiert 0.

- [ ] **Step 11.4: lint:no-alert clean**

```bash
cd ExamLab && npm run lint:no-alert
```
Expected: clean.

- [ ] **Step 11.5: lint:no-tests-dir clean**

```bash
cd ExamLab && npm run lint:no-tests-dir
```
Expected: clean.

- [ ] **Step 11.6: lint:musterloesung baseline**

```bash
cd ExamLab && npm run lint:musterloesung
```
Expected: clean (Baseline).

- [ ] **Step 11.7: build clean**

```bash
cd ExamLab && npm run build 2>&1 | tail -10
```
Expected: vite + PWA generateSW erfolgreich.

- [ ] **Step 11.8: LPStartseite.tsx Zeilen-Check**

```bash
wc -l ExamLab/src/components/lp/LPStartseite.tsx
```
Expected: ~430 Z. (target <500).

---

## Task 12: Browser-E2E auf staging mit echtem LP-Login

Vor E2E: Service-Worker-Cache flushen (Lehre `feedback_service_worker_cache_wire_bundle.md`):
- DevTools → Application → Service Workers → Unregister
- Application → Storage → Clear site data
- Reload

**Branch zu staging deployen:**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-t-f-lpstartseite"
git push origin feature/bundle-t-f-lpstartseite
# Workflow: feature-branch deployt automatisch auf preview-staging — verify via GitHub Actions
```

E2E-Pfade (alle mit echtem LP-Login auf staging):

- [ ] **Pfad 1:** LP-Dashboard lädt (Header + Tabs + Skeleton → Configs sichtbar)
- [ ] **Pfad 2:** Tab-Switch Üben/Prüfen/Fragensammlung/Papierkorb funktioniert
- [ ] **Pfad 3:** Filter-Toolbar in beiden Modi (Übungen + Prüfungen) — Fach/Gefäss/Status/Sortierung-Filter
- [ ] **Pfad 4:** Such-Eingabe filtert Liste in Echtzeit
- [ ] **Pfad 5:** Reset-Button setzt alle Filter zurück
- [ ] **Pfad 6:** Favoriten-Section erscheint nur bei aktiven Favoriten + ohne Filter
- [ ] **Pfad 7:** „Zuletzt"-Section bei >5 Prüfungen ohne Filter sichtbar
- [ ] **Pfad 8:** PruefungsKarte-Klick „Bearbeiten" → Composer öffnet
- [ ] **Pfad 9:** PruefungsKarte „Duplizieren" → neue Karte mit „(Kopie)"
- [ ] **Pfad 10:** PruefungsKarte „🔗 Link kopieren" → Clipboard
- [ ] **Pfad 11:** PruefungsKarte „⭐ Favorit" → Toggle + Sektion-Update
- [ ] **Pfad 12:** Multi-Dashboard-Dialog öffnet, ≥2 wählen, neuer Tab geht auf
- [ ] **Pfad 13:** TrackerBadge sichtbar (Status/Teilnahme/Korrektur/Durchschnitt)
- [ ] **Pfad 14:** Einrichtungsprüfung-Sync nach Login (sessionStorage-Guard, localStorage-Guard)
- [ ] **Pfad 15:** 0 Console-Errors über alle Pfade

Jeder Pfad muss explizit verifiziert werden. Bei Fehler: Hotfix-Commit auf feature-branch, erneut staging-deploy + E2E.

---

## Task 13: Code-Reviewer-Subagent

- [ ] **Step 13.1: superpowers:requesting-code-review oder code-reviewer-subagent invoke**

Dispatch via Agent-Tool (subagent_type: `superpowers:code-reviewer`) mit folgendem Briefing:

```
You are the final code reviewer for Bundle T.f (LPStartseite Hook + Komponenten-Extraktion).

Branch: `feature/bundle-t-f-lpstartseite`
Spec: `docs/superpowers/specs/2026-05-07-bundle-t-f-lpstartseite-design.md`
Plan: `docs/superpowers/plans/2026-05-07-bundle-t-f-lpstartseite.md`

Verify byte-identical behavior:
1. All 12 useMemo + 5 useState (data) extraction is faithful to original LPStartseite.tsx
2. Sync-Helpers in lpEinrichtungSync.ts match original semantics (200ms pause, localStorage-guard)
3. The 3 hooks expose the right Result-types and accept the right Inputs
4. Component-splits (PruefungsKarte/FilterLeiste/MultiDashboardDialog/LPUebungenAnsicht/LPPruefungenAnsicht) preserve JSX-output
5. LPStartseite.tsx is < 500 Z. (Master-Spec ideal target)
6. No new `as any`, no defensive markers added
7. Wrapper-Pattern (Dispatcher + Inner) preserved

Output: APPROVED FOR MERGE | ISSUES FOUND with bullet list of issues.
```

- [ ] **Step 13.2: Bei ISSUES: hotfix-commits, erneut review**

Iteration bis APPROVED.

---

## Task 14: HANDOFF + Memory-Update

- [ ] **Step 14.1: HANDOFF.md-Eintrag**

Inhalt am Anfang der Bundle T-Sektion:

```markdown
### Bundle T.f — LPStartseite Hook + Komponenten-Extraktion (07.05.2026)

**Status:** ✅ Merged auf main (Commit `<hash>`)

**Bilanz:** LPStartseite.tsx 1043 → ~430 Z. (-59%). Hotspot-Bilanz Files >500 Z.: 8 → 7. Bundle T komplett (6/6 Sub-Bundles auf main).

**Cuts:** 3 Hooks (`useLPConfigFiltering`, `useLPFavoriten`, `useLPDashboardData`) + 1 Utility (`lpEinrichtungSync`) + 5 Komponenten (`PruefungsKarte`+`TrackerBadge` co-located, `FilterLeiste`, `MultiDashboardDialog`, `LPUebungenAnsicht`, `LPPruefungenAnsicht`).

**Tests:** vitest 1349 (Drift +25), tsc/lint:as-any/lint:no-alert/build clean. Browser-E2E mit echtem LP-Login: 14/15 Pfade ✅, 0 Console-Errors.
```

- [ ] **Step 14.2: Memory-Eintrag schreiben**

Nach Task 15 (Merge) committed: neue Datei `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_t_f_komplett.md` + Index-Eintrag in MEMORY.md.

---

## Task 15: Merge-Vorbereitung

- [ ] **Step 15.1: Branch fast-forward zu main möglich?**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin
git log main..feature/bundle-t-f-lpstartseite --oneline | wc -l
```

- [ ] **Step 15.2: Squash-Merge oder Merge-Commit?**

Bundle T Sub-Bundles wurden bisher als Merge-Commits in main gemergt (siehe `4c3400f` T.a, `1ce6c81` T.d, `6aa11f6` T.e). T.f folgt diesem Pattern.

- [ ] **Step 15.3: User-Bestätigung vor Merge**

Memory-Lehre: User entscheidet finale Merge-Aktion. Statt automatisch mergen, dem User zeigen:
- Commit-Anzahl
- vitest/tsc/lint/build alle grün
- Browser-E2E bestanden
- Reviewer APPROVED

User muss explizit „Merge" sagen.

- [ ] **Step 15.4: Nach User-Freigabe — Merge auf main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git merge feature/bundle-t-f-lpstartseite --no-ff -m "Merge Bundle T.f: LPStartseite Hook- + Komponenten-Extraktion (1043 → ~430 Z., -59%)"
git push origin main
```

- [ ] **Step 15.5: Branch-Cleanup**

```bash
git branch -d feature/bundle-t-f-lpstartseite
git push origin --delete feature/bundle-t-f-lpstartseite
git worktree remove .worktrees/bundle-t-f-lpstartseite
```

---

## Definition of Done (Master-Checklist)

- [ ] Task 0: Branch + Baseline grün
- [ ] Task 1: lpEinrichtungSync.ts + Tests
- [ ] Task 2: useLPConfigFiltering + Tests
- [ ] Task 3: useLPFavoriten + Tests
- [ ] Task 4: useLPDashboardData
- [ ] Task 5: PruefungsKarte (mit TrackerBadge)
- [ ] Task 6: FilterLeiste
- [ ] Task 7: MultiDashboardDialog
- [ ] Task 8: LPUebungenAnsicht
- [ ] Task 9: LPPruefungenAnsicht
- [ ] Task 10: LPStartseite.tsx Slim-Down
- [ ] Task 11: Alle Verifikations-Gates clean
- [ ] Task 12: Browser-E2E 14/15+ Pfade ✅
- [ ] Task 13: Code-Reviewer APPROVED
- [ ] Task 14: HANDOFF + Memory dokumentiert
- [ ] Task 15: User-Freigabe + Merge auf main

**Hotspot-Bilanz nach T.f:** 8 → 7 Files >500 Z. **Bundle T komplett.**
