# Bundle W — uebungsStore Pure-Logic-Cut Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ExamLab/src/store/ueben/uebungsStore.ts` (684 Z., **hoch-Risiko**) per 3 Pure-Logic-Sub-Files in `utils/ueben/` zerlegen, ohne Verhaltensänderung. Ziel: ≤ 535 Z. im Hauptfile (nur Zustand-Store-Body). Hotspot-Bilanz Files >500 Z. (ohne `data/`+`test/`): **10 → 9**. Coverage-Lücke: erstmals isolierte Tests für Lösungs-Merge / Historien-Persistenz / Ergebnis-Berechnung (~24 neue Vitest-Tests).

**Architecture:** 3 thematisch getrennte Sub-Files (`loesungsMerge.ts`, `historie.ts`, `ergebnisBerechnung.ts`) als pure Module in `utils/ueben/`-Folder, konsistent zu vorhandenen Pure-Modulen wie `korrektur.ts`, `mastery.ts`, `fragetext.ts`, `blockBuilder.ts`. Store bleibt einer (kein Slice-Refactor). Pure-Logic byte-identisch übernommen, Store-Action `berechneErgebnis` wird zum 1-Zeiler-Delegator.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Vitest.

**Spec:** [`docs/superpowers/specs/2026-05-08-bundle-w-uebungsstore-split-design.md`](../specs/2026-05-08-bundle-w-uebungsstore-split-design.md)

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree (zu erstellen in Phase 0):** `.worktrees/bundle-w-uebungsstore`

**Branch (zu erstellen in Phase 0):** `bundle-w/uebungsstore-cuts` (von main HEAD nach Bundle V Merge)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output direkt prüfen (Memory-Lehre `feedback_tsc_b_exit_misleading`).

**Vitest-Baseline:** **1430 passed | 4 todo | 1 skipped** (aus Bundle V Merge `5263c63`). Drift-Erwartung **+24** (Phase 1: +12, Phase 2: +5, Phase 3: +7).

---

## File Map

### Neue Files

| Datei | Größe ca. | Verantwortung |
|---|---:|---|
| `ExamLab/src/utils/ueben/loesungsMerge.ts` | ~90 Z. | `mergeLoesungInFrage(frage, slice)` + `mergeLoesungen(fragen, loesungen)` byte-identisch + Type-Imports |
| `ExamLab/src/utils/ueben/loesungsMerge.test.ts` | ~280 Z. | 12 Vitest-Tests (Top-Level + Reihenfolgen-kritisch + 12 Listen + mergeById-Edge-Cases + Immutability + mergeLoesungen-Mix + teilaufgaben) |
| `ExamLab/src/utils/ueben/historie.ts` | ~40 Z. | Type `GespeichertesErgebnis` + `HISTORIE_KEY` + `MAX_HISTORIE` + `ladeHistorie()` + `speichereHistorie()` byte-identisch |
| `ExamLab/src/utils/ueben/historie.test.ts` | ~110 Z. | 5 Vitest-Tests (load: leer/corrupt/parsed; save: trim/quota-silent) |
| `ExamLab/src/utils/ueben/ergebnisBerechnung.ts` | ~40 Z. | Pure `berechneErgebnis(session: UebungsSession \| null) → SessionErgebnis` |
| `ExamLab/src/utils/ueben/ergebnisBerechnung.test.ts` | ~180 Z. | 7 Vitest-Tests (null/leer/alle-richtig/mix/uebersprungen/unsicher/dauer) |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/store/ueben/uebungsStore.ts` | 684 Z. | ≤ 535 Z. | 3 Cut-Bereiche raus (Z. 18–102, 104–134, 625–653-Body), 3 Imports oben hinzu, 1 Import (`getFragetext`) entfernt; `berechneErgebnis`-Action zum 1-Zeiler |
| `ExamLab/src/components/ueben/UebungsEinsicht.tsx` | unverändert | unverändert | Z. 2: `GespeichertesErgebnis`-Type-Import-Pfad auf `utils/ueben/historie` umstellen |

### Reihenfolge (Risiko-aufsteigend, Phase-Dependencies enforced)

1. **Phase 0**: Branch + Worktree erstellen + Vitest-Baseline verifizieren
2. **Phase 1**: `loesungsMerge.ts` + Tests + Store-Cut (kein Cross-File-Import → atomar)
3. **Phase 2**: `historie.ts` + Tests + Store-Cut + UebungsEinsicht.tsx-Edit
4. **Phase 3**: `ergebnisBerechnung.ts` + Tests + Store-Cut + `berechneErgebnis`-Delegator
5. **Phase 4**: Final Lint-Gates + Build + tsc Verify
6. **Phase 5**: Browser-E2E auf staging (preview push + manuelle E2E-Pfade)
7. **Phase 6**: Final Code-Reviewer + HANDOFF + Memory + Merge zu main

---

## Phase 0: Branch-Setup

### Task 0.1: Branch + Worktree erstellen

- [ ] **Step 1: Vom Repo-Root Worktree und Branch atomar erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree add .worktrees/bundle-w-uebungsstore -b bundle-w/uebungsstore-cuts main
```

Expected: `Preparing worktree (new branch 'bundle-w/uebungsstore-cuts')` + `HEAD is now at 1ed10c5 Bundle W Spec rev2: ...`.

- [ ] **Step 2: cd in Worktree und Status prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore"
git status
git log --oneline -3
```

Expected: `On branch bundle-w/uebungsstore-cuts`, working tree clean. HEAD: `1ed10c5 Bundle W Spec rev2: ...` (Spec ist via Branch-from-main bereits präsent).

(Memory-Regel `feedback_subagent_shell_context`: Implementer-Subagents müssen explizit `cd` ins Worktree-Verzeichnis machen.)

- [ ] **Step 3: Vitest-Baseline verifizieren**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Tests  1430 passed | 4 todo | 1 skipped (1435)` und Test-File-Count unverändert. Falls Drift: STOP und untersuchen, bevor Bundle-W-Edits beginnen.

- [ ] **Step 4: Source-Datei vor Cut messen (Baseline-wc)**

```bash
wc -l src/store/ueben/uebungsStore.ts
```

Expected: `684 src/store/ueben/uebungsStore.ts`.

---

## Phase 1: `loesungsMerge.ts` (Pure-Helper extrahieren)

**Ziel der Phase:** `mergeLoesungInFrage` + `mergeLoesungen` byte-identisch nach `utils/ueben/loesungsMerge.ts` ziehen, mit 12 Vitest-Tests Coverage.

### Task 1.1: `loesungsMerge.ts` erstellen

**Files:**
- Create: `ExamLab/src/utils/ueben/loesungsMerge.ts`

- [ ] **Step 1: Datei schreiben (byte-identisch aus uebungsStore.ts Z. 18–102)**

```typescript
// ExamLab/src/utils/ueben/loesungsMerge.ts
import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsMap, LoesungsSlice } from '../../types/ueben/loesung'

/**
 * Merged einen LoesungsSlice in eine Frage-Kopie. Mutiert NICHT die
 * Original-Frage; liefert ein neues Objekt mit kombinierten Feldern.
 *
 * Listen-Felder (optionen[], luecken[], etc.): Merge per id — der
 * gemischte Client-Array wird um die Lösungs-Attribute ergänzt.
 * Reihenfolgen-kritische Felder (elemente[], paare[]) werden aus
 * dem Slice übernommen (überschreibt gemischte Client-Version).
 */
export function mergeLoesungInFrage(frage: Frage, slice: LoesungsSlice | undefined): Frage {
  if (!slice) return frage
  const merged: Record<string, unknown> = { ...frage }

  // Top-level einfache Felder (gemeinsam + typSpezifisch)
  if (slice.musterlosung !== undefined) merged.musterlosung = slice.musterlosung
  if (slice.bewertungsraster !== undefined) merged.bewertungsraster = slice.bewertungsraster
  if (slice.korrekteFormel !== undefined) merged.korrekteFormel = slice.korrekteFormel
  if (slice.korrekt !== undefined) merged.korrekt = slice.korrekt
  if (slice.buchungen !== undefined) merged.buchungen = slice.buchungen
  if (slice.korrektBuchung !== undefined) merged.korrektBuchung = slice.korrektBuchung
  if (slice.sollEintraege !== undefined) merged.sollEintraege = slice.sollEintraege
  if (slice.habenEintraege !== undefined) merged.habenEintraege = slice.habenEintraege
  if (slice.loesung !== undefined) merged.loesung = slice.loesung

  // Reihenfolgen-kritisch: Lösung überschreibt Mischung
  if (slice.elemente !== undefined) merged.elemente = slice.elemente
  if (slice.paare !== undefined) merged.paare = slice.paare

  // Listen-Felder per id mergen
  type IdItem = { id?: string }
  const mergeById = (base: unknown, patches: IdItem[] | undefined): unknown => {
    if (!Array.isArray(base) || !patches) return base
    const patchMap = new Map<string, IdItem>()
    for (const p of patches) if (p && p.id) patchMap.set(p.id, p)
    return base.map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return item
      const withId = item as IdItem
      const patch = withId.id ? patchMap.get(withId.id) : undefined
      return patch ? { ...withId, ...patch } : item
    })
  }

  if (slice.optionen) merged.optionen = mergeById(merged.optionen, slice.optionen)
  if (slice.aussagen) merged.aussagen = mergeById(merged.aussagen, slice.aussagen)
  if (slice.luecken) merged.luecken = mergeById(merged.luecken, slice.luecken)
  if (slice.ergebnisse) merged.ergebnisse = mergeById(merged.ergebnisse, slice.ergebnisse)
  if (slice.konten) merged.konten = mergeById(merged.konten, slice.konten)
  if (slice.bilanzEintraege) merged.bilanzEintraege = mergeById(merged.bilanzEintraege, slice.bilanzEintraege)
  if (slice.aufgaben) merged.aufgaben = mergeById(merged.aufgaben, slice.aufgaben)
  if (slice.labels) merged.labels = mergeById(merged.labels, slice.labels)
  if (slice.beschriftungen) merged.beschriftungen = mergeById(merged.beschriftungen, slice.beschriftungen)
  if (slice.zielzonen) merged.zielzonen = mergeById(merged.zielzonen, slice.zielzonen)
  if (slice.bereiche) merged.bereiche = mergeById(merged.bereiche, slice.bereiche)
  if (slice.hotspots) merged.hotspots = mergeById(merged.hotspots, slice.hotspots)

  return merged as unknown as Frage
}

/**
 * Merged die Lösungs-Map in die Frage-Liste. Aufgabengruppen erhalten
 * sowohl ihren eigenen Slice als auch die Slices ihrer Teilaufgaben
 * (flache Map-Lookup).
 */
export function mergeLoesungen(
  fragen: Frage[],
  loesungen: LoesungsMap,
): { fragen: Frage[]; preloaded: Record<string, boolean> } {
  const preloaded: Record<string, boolean> = {}
  const merged = fragen.map((f) => {
    const frageSlice = loesungen[f.id]
    preloaded[f.id] = frageSlice !== undefined
    let out = mergeLoesungInFrage(f, frageSlice)
    const outWithTa = out as Frage & { teilaufgaben?: Frage[] }
    if (Array.isArray(outWithTa.teilaufgaben)) {
      outWithTa.teilaufgaben = outWithTa.teilaufgaben.map((ta: Frage) => {
        const taSlice = loesungen[ta.id]
        preloaded[ta.id] = taSlice !== undefined
        return mergeLoesungInFrage(ta, taSlice)
      })
      out = outWithTa
    }
    return out
  })
  return { fragen: merged, preloaded }
}
```

- [ ] **Step 2: tsc ohne neue Tests prüfen**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log | tail -5
```

Expected: keine Output-Zeilen ausser eventuell `> tsc -b` (clean). Wenn Errors → Type-Imports prüfen.

### Task 1.2: `loesungsMerge.test.ts` schreiben

**Files:**
- Create: `ExamLab/src/utils/ueben/loesungsMerge.test.ts`

- [ ] **Step 1: Test-Datei schreiben — 12 Vitest-Cases**

```typescript
// ExamLab/src/utils/ueben/loesungsMerge.test.ts
import { describe, it, expect } from 'vitest'
import { mergeLoesungInFrage, mergeLoesungen } from './loesungsMerge'
import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsSlice, LoesungsMap } from '../../types/ueben/loesung'

// Minimal-Frage als Cast — analog Bundle T-Test-Patterns
function mkFrage(partial: Partial<Frage> & { id: string; typ: Frage['typ']; frage: string; fachbereich: string }): Frage {
  return { ...partial } as unknown as Frage
}

describe('mergeLoesungInFrage', () => {
  it('Test 1: ohne Slice → Original-Frage byte-identisch', () => {
    const f = mkFrage({ id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL' })
    expect(mergeLoesungInFrage(f, undefined)).toBe(f)
  })

  it('Test 2: Top-Level-Felder werden gesetzt', () => {
    const f = mkFrage({ id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL' })
    const slice: LoesungsSlice = {
      musterlosung: 'M', bewertungsraster: 'B', korrekteFormel: 'F',
      korrekt: true, buchungen: ['x'] as never, korrektBuchung: { soll: 's' } as never,
      sollEintraege: [1] as never, habenEintraege: [2] as never, loesung: 'L',
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as Record<string, unknown>
    expect(out.musterlosung).toBe('M')
    expect(out.bewertungsraster).toBe('B')
    expect(out.korrekteFormel).toBe('F')
    expect(out.korrekt).toBe(true)
    expect(out.buchungen).toEqual(['x'])
    expect(out.korrektBuchung).toEqual({ soll: 's' })
    expect(out.sollEintraege).toEqual([1])
    expect(out.habenEintraege).toEqual([2])
    expect(out.loesung).toBe('L')
  })

  it('Test 3: Reihenfolgen-Felder elemente und paare ÜBERSCHREIBEN Original', () => {
    const f = mkFrage({
      id: '1', typ: 'sortierung', frage: 'Q', fachbereich: 'BWL',
      elemente: [{ id: 'a', text: 'Mix' }] as never,
      paare: [{ id: 'p1', links: 'L', rechts: 'R' }] as never,
    })
    const slice: LoesungsSlice = {
      elemente: [{ id: 'a', text: 'Echt' }] as never,
      paare: [{ id: 'p1', links: 'EchtL', rechts: 'EchtR' }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as Record<string, unknown>
    expect(out.elemente).toEqual([{ id: 'a', text: 'Echt' }])
    expect(out.paare).toEqual([{ id: 'p1', links: 'EchtL', rechts: 'EchtR' }])
  })

  it('Test 4: Listen-Merge per id (optionen — repräsentativ)', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ id: 'o1', korrekt: true }, { id: 'o2', korrekt: false }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as Record<string, unknown>
    expect(out.optionen).toEqual([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: false },
    ])
  })

  it('Test 5: Listen-Merge funktioniert für alle 11 weiteren Listen-Felder', () => {
    const listenFelder = [
      'aussagen', 'luecken', 'ergebnisse', 'konten',
      'bilanzEintraege', 'aufgaben', 'labels',
      'beschriftungen', 'zielzonen', 'bereiche', 'hotspots',
    ] as const
    for (const feld of listenFelder) {
      const f = mkFrage({
        id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
        [feld]: [{ id: 'x', a: 1 }],
      } as Partial<Frage> & { id: string; typ: Frage['typ']; frage: string; fachbereich: string })
      const slice = { [feld]: [{ id: 'x', b: 2 }] } as unknown as LoesungsSlice
      const out = mergeLoesungInFrage(f, slice) as Record<string, unknown>
      expect((out[feld] as { id: string; a?: number; b?: number }[])[0]).toEqual({ id: 'x', a: 1, b: 2 })
    }
  })

  it('Test 6: mergeById — Item ohne id-Property bleibt unverändert', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ text: 'NoId' } as never, { id: 'o1', text: 'WithId' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ id: 'o1', korrekt: true }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as Record<string, unknown>
    expect(out.optionen).toEqual([
      { text: 'NoId' },
      { id: 'o1', text: 'WithId', korrekt: true },
    ])
  })

  it('Test 7: mergeById — null-Item in Liste bleibt unverändert', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [null as never, { id: 'o1', text: 'A' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ id: 'o1', korrekt: true }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as Record<string, unknown>
    expect((out.optionen as unknown[])[0]).toBe(null)
    expect((out.optionen as unknown[])[1]).toEqual({ id: 'o1', text: 'A', korrekt: true })
  })

  it('Test 8: mergeById — Patch ohne id wird ignoriert (nicht in patchMap)', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ id: 'o1', text: 'A' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ korrekt: true } as never, { id: 'o1', korrekt: false }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as Record<string, unknown>
    expect(out.optionen).toEqual([{ id: 'o1', text: 'A', korrekt: false }])
  })

  it('Test 9: Original-Frage wird NICHT mutiert (Immutability)', () => {
    const original = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ id: 'o1', text: 'A' }] as never,
    })
    const snapshot = JSON.parse(JSON.stringify(original))
    const slice: LoesungsSlice = {
      musterlosung: 'M',
      optionen: [{ id: 'o1', korrekt: true }] as never,
    } as LoesungsSlice
    mergeLoesungInFrage(original, slice)
    expect(original).toEqual(snapshot)
  })
})

describe('mergeLoesungen', () => {
  it('Test 10: leere LoesungsMap → preloaded[id] = false für alle', () => {
    const fragen = [
      mkFrage({ id: 'a', typ: 'mc', frage: 'A', fachbereich: 'BWL' }),
      mkFrage({ id: 'b', typ: 'mc', frage: 'B', fachbereich: 'BWL' }),
    ]
    const loesungen: LoesungsMap = {}
    const result = mergeLoesungen(fragen, loesungen)
    expect(result.preloaded).toEqual({ a: false, b: false })
    expect(result.fragen).toEqual(fragen)
  })

  it('Test 11: Frage mit teilaufgaben → TA-Slices gemerged + preloaded[ta.id] getrackt', () => {
    const fragen = [
      mkFrage({
        id: 'group1', typ: 'aufgabengruppe' as Frage['typ'], frage: 'G', fachbereich: 'BWL',
        teilaufgaben: [
          mkFrage({ id: 'ta1', typ: 'mc', frage: 'TA1', fachbereich: 'BWL' }),
          mkFrage({ id: 'ta2', typ: 'mc', frage: 'TA2', fachbereich: 'BWL' }),
        ],
      } as Partial<Frage> & { id: string; typ: Frage['typ']; frage: string; fachbereich: string }),
    ]
    const loesungen: LoesungsMap = {
      group1: { musterlosung: 'GroupMl' } as LoesungsSlice,
      ta1: { musterlosung: 'TA1Ml' } as LoesungsSlice,
      // ta2 absichtlich NICHT in der Map
    }
    const result = mergeLoesungen(fragen, loesungen)
    expect(result.preloaded).toEqual({ group1: true, ta1: true, ta2: false })
    const group = result.fragen[0] as Frage & { teilaufgaben: Frage[] }
    expect((group as Record<string, unknown>).musterlosung).toBe('GroupMl')
    expect((group.teilaufgaben[0] as Record<string, unknown>).musterlosung).toBe('TA1Ml')
    expect((group.teilaufgaben[1] as Record<string, unknown>).musterlosung).toBeUndefined()
  })

  it('Test 12: Mix — manche Fragen preloaded, andere nicht', () => {
    const fragen = [
      mkFrage({ id: 'a', typ: 'mc', frage: 'A', fachbereich: 'BWL' }),
      mkFrage({ id: 'b', typ: 'mc', frage: 'B', fachbereich: 'BWL' }),
    ]
    const loesungen: LoesungsMap = {
      a: { musterlosung: 'AMl' } as LoesungsSlice,
    }
    const result = mergeLoesungen(fragen, loesungen)
    expect(result.preloaded).toEqual({ a: true, b: false })
    expect((result.fragen[0] as Record<string, unknown>).musterlosung).toBe('AMl')
    expect((result.fragen[1] as Record<string, unknown>).musterlosung).toBeUndefined()
  })
})
```

- [ ] **Step 2: Tests laufen lassen — alle 12 grün**

```bash
cd ExamLab && npx vitest run src/utils/ueben/loesungsMerge.test.ts --reporter=dot 2>&1 | tail -10
```

Expected: `Tests  12 passed (12)`. Bei rotem Output: Test-Code prüfen, Source byte-identisch verifizieren.

- [ ] **Step 3: Vitest-Drift verifizieren**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -3
```

Expected: `Tests  1442 passed | 4 todo | 1 skipped` (1430 + 12). Drift exakt +12.

### Task 1.3: `uebungsStore.ts` Cut + Import

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`

- [ ] **Step 1: Import `mergeLoesungen` oben hinzufügen (nach existierendem `normalisiereDragDropBild`-Import)**

Aktueller Block Z. 1–17:
```typescript
import { create } from 'zustand'
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort, Selbstbewertung } from '../../types/antworten'
import { getFragetext } from '../../utils/ueben/fragetext'
import type { UebungsSession, SessionErgebnis, SessionModus, ThemaQuelle } from '../../types/ueben/uebung'
import type { MasteryStufe } from '../../types/ueben/fortschritt'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from '../../utils/ueben/blockBuilder'
import { istDauerbaustelle } from '../../utils/ueben/mastery'
import { pruefeAntwort } from '../../utils/ueben/korrektur'
import { normalisiereDragDropBild } from '../../utils/ueben/fragetypNormalizer'
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'
import type { LoesungsMap, LoesungsSlice } from '../../types/ueben/loesung'
import type { PruefResultat } from '../../types/ueben/pruefResultat'
import { normalizeAntwort } from '../../utils/normalizeAntwort'
import { useUebenFortschrittStore } from './fortschrittStore'
```

Neue Zeile direkt nach `normalisiereDragDropBild`-Import (Z. 11):

```typescript
import { mergeLoesungen } from '../../utils/ueben/loesungsMerge'
```

`LoesungsSlice` aus dem `types/ueben/loesung`-Import wird in der nächsten Phase eventuell unused — wir lassen den Type-Import stehen falls noch andere Stellen ihn brauchen (grep prüft Phase 4). `LoesungsMap` bleibt verwendet (Z. 235 in `starteSession`).

- [ ] **Step 2: Z. 18–102 entfernen (`mergeLoesungInFrage` + `mergeLoesungen`-Body)**

Den gesamten Block ab `/**\n * Merged einen LoesungsSlice in eine Frage-Kopie...` bis einschliesslich `return { fragen: merged, preloaded }\n}` löschen. Der `starteSession`-Body Z. 257 ruft weiterhin `mergeLoesungen(block, loesungen)` — Aufruf bleibt byte-identisch.

- [ ] **Step 3: tsc + 4 Lint-Gates + Vitest**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log | tail -5
npm run lint:as-any 2>&1 | tail -3
npm run lint:no-alert 2>&1 | tail -3
npm run lint:no-tests-dir 2>&1 | tail -3
npm run lint:musterloesung 2>&1 | tail -3
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected:
- tsc clean (keine Errors)
- 4 Lint-Gates clean
- Vitest: `Tests  1442 passed | 4 todo | 1 skipped`

- [ ] **Step 4: `LoesungsSlice`-Import-Prüfung**

```bash
grep -n "LoesungsSlice" src/store/ueben/uebungsStore.ts
```

Wenn `LoesungsSlice` nirgends mehr im Body verwendet wird, aus dem Type-Import entfernen:
```typescript
import type { LoesungsMap } from '../../types/ueben/loesung'   // statt LoesungsMap, LoesungsSlice
```
Falls Verwendung im Body bleibt: Import unverändert lassen.

- [ ] **Step 5: Source-Datei-Größe messen**

```bash
wc -l src/store/ueben/uebungsStore.ts
```

Expected: `599` ± 3 Zeilen (684 − 85 cut + 1 Import + minor). Falls deutlich abweichend: Cut-Bereich nochmal verifizieren.

- [ ] **Step 6: Build clean**

```bash
cd ExamLab && npm run build 2>&1 | tail -10
```

Expected: `vite build` erfolgreich (~3s, kein Error). PWA generateSW OK.

- [ ] **Step 7: Existierende Store-Tests grün**

```bash
cd ExamLab && npx vitest run src/tests/uebungsStoreLoesungsPreload.test.ts src/tests/uebungsStorePruefen.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: alle Tests grün (Korrektheits-Backup für Cut intakt).

- [ ] **Step 8: Phase-1-Commit**

```bash
git add src/utils/ueben/loesungsMerge.ts src/utils/ueben/loesungsMerge.test.ts src/store/ueben/uebungsStore.ts
git commit -m "$(cat <<'EOF'
Bundle W Phase 1: loesungsMerge.ts extrahiert (12 Vitest)

Pure-Logic-Cut von mergeLoesungInFrage + mergeLoesungen aus uebungsStore.ts
(Z. 18-102) byte-identisch nach utils/ueben/loesungsMerge.ts. 12 Vitest-Tests
für Top-Level + Reihenfolgen-kritisch + 12 Listen-Felder + mergeById Edge-Cases
+ Immutability + teilaufgaben-Pfad.

uebungsStore.ts: ~684 → ~599 Z. (-85). Konsumenten-Surface unverändert.

Vitest 1430 → 1442 (+12). tsc + 4 Lint-Gates + build clean.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 1.4: Per-Phase-Reviewer (Spec-Compliance + Code-Quality)

- [ ] **Step 1: Reviewer-Subagent dispatchen**

Dispatch einen `general-purpose`-Subagent mit dem folgenden Brief (precise, no session history):

```
You are reviewing Phase 1 of Bundle W. Verify the changes against the spec.

**Spec:** /Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/docs/superpowers/specs/2026-05-08-bundle-w-uebungsstore-split-design.md

**Phase 1 changes (read these):**
- /Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore/ExamLab/src/utils/ueben/loesungsMerge.ts
- /Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore/ExamLab/src/utils/ueben/loesungsMerge.test.ts
- /Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore/ExamLab/src/store/ueben/uebungsStore.ts (post-cut)

**Reference (pre-cut):** main HEAD's uebungsStore.ts has lines 18-102 with mergeLoesungInFrage + mergeLoesungen. Use `git show main:ExamLab/src/store/ueben/uebungsStore.ts` for byte-comparison.

## Verify
1. **Byte-Identität**: Z. 18-102 source identisch in loesungsMerge.ts? (Modulo Imports + `export` keyword)
2. **Test-Coverage**: 12 Tests vorhanden, Spec § 4 Coverage-Map abgedeckt?
3. **Konsumenten**: starteSession ruft `mergeLoesungen(block, loesungen)` byte-identisch?
4. **Imports**: `mergeLoesungen` Import oben hinzugefügt? `LoesungsSlice` ggf. entfernt wenn unused?
5. **Drift**: Vitest +12 wie geplant? (laufe lassen via `cd ExamLab && npx vitest run --reporter=dot`)
6. **Lint**: 4 Lint-Gates clean (`npm run lint:as-any`/`lint:no-alert`/`lint:no-tests-dir`/`lint:musterloesung`)?

## Output
**Status:** APPROVED | ISSUES FOUND
**Issues** (if any): [section/line, what's wrong, why it matters]
**Recommendations** (advisory): [non-blocking suggestions]

Keep under 300 words.
```

Expected: APPROVED. Falls Issues: fix-and-re-dispatch (max 3 Iterationen).

---

## Phase 2: `historie.ts` (Type + Konstanten + 2 Funktionen)

**Ziel der Phase:** `GespeichertesErgebnis`-Type + `HISTORIE_KEY` + `MAX_HISTORIE` + `ladeHistorie` + `speichereHistorie` byte-identisch nach `utils/ueben/historie.ts` ziehen, mit 5 Vitest-Tests Coverage. Plus 1 Caller-Edit in `UebungsEinsicht.tsx`.

### Task 2.1: `historie.ts` erstellen

**Files:**
- Create: `ExamLab/src/utils/ueben/historie.ts`

- [ ] **Step 1: Datei schreiben (byte-identisch aus uebungsStore.ts Z. 104–134)**

```typescript
// ExamLab/src/utils/ueben/historie.ts
import type { SessionErgebnis } from '../../types/ueben/uebung'

/** Persistiertes Session-Ergebnis für die Übungs-Einsicht */
export interface GespeichertesErgebnis {
  sessionId: string
  fach: string
  thema: string
  datum: string
  anzahlFragen: number
  richtig: number
  quote: number
  dauer: number
  details: SessionErgebnis['details']
}

export const HISTORIE_KEY = 'ueben-session-historie'
export const MAX_HISTORIE = 50

export function ladeHistorie(): GespeichertesErgebnis[] {
  try {
    const raw = localStorage.getItem(HISTORIE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GespeichertesErgebnis[]
    // Migration: Antworten in gespeicherten Details auf einheitliches Format normalisieren.
    // GespeichertesErgebnis enthält keine rohen Antwort-Objekte, aber zukünftige Formate
    // könnten sie enthalten — hier als Sicherheitsnetz für ältere localStorage-Einträge.
    return parsed
  } catch { return [] }
}

export function speichereHistorie(historie: GespeichertesErgebnis[]) {
  try { localStorage.setItem(HISTORIE_KEY, JSON.stringify(historie.slice(0, MAX_HISTORIE))) } catch { /* quota */ }
}
```

- [ ] **Step 2: tsc check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log | tail -5
```

Expected: clean.

### Task 2.2: `historie.test.ts` schreiben

**Files:**
- Create: `ExamLab/src/utils/ueben/historie.test.ts`

- [ ] **Step 1: Test-Datei schreiben — 5 Vitest-Cases**

```typescript
// ExamLab/src/utils/ueben/historie.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ladeHistorie, speichereHistorie, HISTORIE_KEY, MAX_HISTORIE, type GespeichertesErgebnis } from './historie'

function mkErgebnis(id: string): GespeichertesErgebnis {
  return {
    sessionId: id,
    fach: 'BWL',
    thema: 'Test',
    datum: '2026-05-08T10:00:00.000Z',
    anzahlFragen: 5,
    richtig: 3,
    quote: 60,
    dauer: 12345,
    details: [],
  }
}

describe('historie', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ladeHistorie', () => {
    it('Test 1: ohne localStorage-Eintrag → []', () => {
      expect(ladeHistorie()).toEqual([])
    })

    it('Test 2: mit korruptem JSON → [] (catch-Pfad)', () => {
      localStorage.setItem(HISTORIE_KEY, '{not valid json')
      expect(ladeHistorie()).toEqual([])
    })

    it('Test 3: mit gültigem JSON-Array → parsed', () => {
      const erg = [mkErgebnis('a'), mkErgebnis('b')]
      localStorage.setItem(HISTORIE_KEY, JSON.stringify(erg))
      expect(ladeHistorie()).toEqual(erg)
    })
  })

  describe('speichereHistorie', () => {
    it('Test 4: trimt auf MAX_HISTORIE (50) Einträge', () => {
      const big = Array.from({ length: 51 }, (_, i) => mkErgebnis(`s${i}`))
      speichereHistorie(big)
      const stored = JSON.parse(localStorage.getItem(HISTORIE_KEY) ?? '[]')
      expect(stored).toHaveLength(MAX_HISTORIE)
      expect(stored[0].sessionId).toBe('s0')
      expect(stored[49].sessionId).toBe('s49')
    })

    it('Test 5: localStorage-Quota-Error → silent (catch)', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      expect(() => speichereHistorie([mkErgebnis('a')])).not.toThrow()
      expect(spy).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Tests laufen — alle 5 grün**

```bash
cd ExamLab && npx vitest run src/utils/ueben/historie.test.ts --reporter=dot 2>&1 | tail -10
```

Expected: `Tests  5 passed (5)`.

- [ ] **Step 3: Drift-Check kumulativ**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -3
```

Expected: `Tests  1447 passed | 4 todo | 1 skipped` (1442 + 5).

### Task 2.3: `uebungsStore.ts` Cut + Import + Caller-Edit

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`
- Modify: `ExamLab/src/components/ueben/UebungsEinsicht.tsx`

- [ ] **Step 1: Import in uebungsStore.ts oben hinzufügen (nach mergeLoesungen-Import)**

```typescript
import { ladeHistorie, speichereHistorie, MAX_HISTORIE, type GespeichertesErgebnis } from '../../utils/ueben/historie'
```

- [ ] **Step 2: Z. 104–134 in uebungsStore.ts entfernen**

Den gesamten Block:
- `/** Persistiertes Session-Ergebnis für die Übungs-Einsicht */` (JSDoc)
- `export interface GespeichertesErgebnis { ... }`
- `const HISTORIE_KEY = 'ueben-session-historie'`
- `const MAX_HISTORIE = 50`
- `function ladeHistorie(): GespeichertesErgebnis[] { ... }`
- `function speichereHistorie(historie: GespeichertesErgebnis[]) { ... }`

löschen. Body-Aufrufe (`historie: ladeHistorie()` Z. 184, `slice(0, MAX_HISTORIE)` Z. 673, `speichereHistorie(neueHistorie)` Z. 675) bleiben byte-identisch — sie lösen sich nach Cut auf den neuen Top-Level-Import auf.

**Wichtig:** Der `UebungsState`-Interface-Member `historie: GespeichertesErgebnis[]` (Z. 150) bleibt, bezieht den Type aber nun aus dem oben hinzugefügten Import.

- [ ] **Step 3: UebungsEinsicht.tsx Z. 2 Type-Import umstellen**

Datei: `ExamLab/src/components/ueben/UebungsEinsicht.tsx`

Vorher (Z. 2):
```typescript
import { useUebenUebungsStore, type GespeichertesErgebnis } from '../../store/ueben/uebungsStore'
```

Nachher (Z. 2 + 3, neuer Type-Import-Pfad):
```typescript
import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
import { type GespeichertesErgebnis } from '../../utils/ueben/historie'
```

- [ ] **Step 4: tsc + Lint + Vitest**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log | tail -5
npm run lint:as-any 2>&1 | tail -3
npm run lint:no-alert 2>&1 | tail -3
npm run lint:no-tests-dir 2>&1 | tail -3
npm run lint:musterloesung 2>&1 | tail -3
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected:
- tsc clean
- 4 Lint-Gates clean
- Vitest: `Tests  1447 passed | 4 todo | 1 skipped`

- [ ] **Step 5: Existierende Store-Tests grün**

```bash
cd ExamLab && npx vitest run src/tests/uebungsStoreLoesungsPreload.test.ts src/tests/uebungsStorePruefen.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: alle Tests grün.

- [ ] **Step 6: Build clean**

```bash
cd ExamLab && npm run build 2>&1 | tail -10
```

Expected: build clean (~3s).

- [ ] **Step 7: Source-Datei-Größe**

```bash
wc -l src/store/ueben/uebungsStore.ts
```

Expected: `~570` Zeilen (599 − 31 cut + 1 Import).

- [ ] **Step 8: Phase-2-Commit**

```bash
git add src/utils/ueben/historie.ts src/utils/ueben/historie.test.ts src/store/ueben/uebungsStore.ts src/components/ueben/UebungsEinsicht.tsx
git commit -m "$(cat <<'EOF'
Bundle W Phase 2: historie.ts extrahiert (5 Vitest)

Pure-Logic-Cut von GespeichertesErgebnis-Type + HISTORIE_KEY + MAX_HISTORIE +
ladeHistorie + speichereHistorie aus uebungsStore.ts (Z. 104-134) byte-identisch
nach utils/ueben/historie.ts. 5 Vitest-Tests (load: leer/corrupt/parsed; save:
trim/quota-silent; afterEach restoreAllMocks gegen Mock-Leakage).

Caller-Edit: UebungsEinsicht.tsx Z. 2 Type-Import-Pfad auf utils/ueben/historie.

uebungsStore.ts: ~599 → ~570 Z. (-29). Naming-Konflikt-Klärung:
ladeHistorie-Top-Level-Funktion vs. Store-Action via JS-Module-Scope sauber.

Vitest 1442 → 1447 (+5). tsc + 4 Lint-Gates + build clean.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 2.4: Per-Phase-Reviewer

- [ ] **Step 1: Reviewer-Subagent dispatchen** (analog Task 1.4 mit Phase-2-Diff-Brief)

Brief muss explizit prüfen:
1. Byte-Identität Z. 104–134 → historie.ts
2. 5 Vitest-Tests vorhanden + Spec § 4 abgedeckt
3. UebungsEinsicht.tsx-Import-Pfad korrekt umgestellt
4. **Naming-Konflikt-Sanity**: `ladeHistorie`-Aufruf in Store-Action-Body (Z. 608) löst auf den Import auf, nicht auf die Action selbst (Reviewer prüft via `git show main:.../uebungsStore.ts` Vergleich)
5. Drift +5
6. 4 Lint-Gates clean
7. existierende Store-Tests `uebungsStoreLoesungsPreload` + `uebungsStorePruefen` grün

Expected: APPROVED.

---

## Phase 3: `ergebnisBerechnung.ts` (Pure Function + Delegator)

**Ziel der Phase:** `berechneErgebnis`-Body byte-identisch als pure Function nach `utils/ueben/ergebnisBerechnung.ts` ziehen, mit 7 Vitest-Tests Coverage. Store-Action wird zum 1-Zeiler-Delegator. `getFragetext`-Import aus uebungsStore.ts entfernen.

### Task 3.1: `ergebnisBerechnung.ts` erstellen

**Files:**
- Create: `ExamLab/src/utils/ueben/ergebnisBerechnung.ts`

- [ ] **Step 1: Datei schreiben (byte-identisch aus uebungsStore.ts Z. 625–653-Body)**

```typescript
// ExamLab/src/utils/ueben/ergebnisBerechnung.ts
import type { UebungsSession, SessionErgebnis } from '../../types/ueben/uebung'
import { getFragetext } from './fragetext'

/**
 * Pure Berechnung des Session-Ergebnisses. Liefert ein Default-Objekt
 * für `null`-Sessions, sodass die aufrufende Store-Action keinen
 * speziellen Null-Pfad braucht.
 */
export function berechneErgebnis(session: UebungsSession | null): SessionErgebnis {
  if (!session) return { sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [] }

  const details = session.fragen.map(f => ({
    frageId: f.id,
    frage: getFragetext(f),
    typ: f.typ,
    korrekt: session.ergebnisse[f.id] ?? false,
    erklaerung: f.musterlosung,
    unsicher: session.unsicher.has(f.id),
    uebersprungen: session.uebersprungen.has(f.id),
  }))

  const richtig = details.filter(d => d.korrekt).length
  const falsch = details.filter(d => !d.korrekt && !d.uebersprungen).length
  const dauer = session.beendet
    ? new Date(session.beendet).getTime() - new Date(session.gestartet).getTime()
    : Date.now() - new Date(session.gestartet).getTime()

  return {
    sessionId: session.id,
    anzahlFragen: session.fragen.length,
    richtig, falsch,
    quote: session.fragen.length > 0 ? (richtig / session.fragen.length) * 100 : 0,
    dauer,
    details,
  }
}
```

- [ ] **Step 2: tsc check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log | tail -5
```

Expected: clean.

### Task 3.2: `ergebnisBerechnung.test.ts` schreiben

**Files:**
- Create: `ExamLab/src/utils/ueben/ergebnisBerechnung.test.ts`

- [ ] **Step 1: Test-Datei schreiben — 7 Vitest-Cases**

```typescript
// ExamLab/src/utils/ueben/ergebnisBerechnung.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { berechneErgebnis } from './ergebnisBerechnung'
import type { Frage } from '../../types/ueben/fragen'
import type { UebungsSession } from '../../types/ueben/uebung'

function mkFrage(id: string): Frage {
  return { id, typ: 'mc', frage: `Q${id}`, fachbereich: 'BWL', musterlosung: `M${id}` } as unknown as Frage
}

function erzeugeSession(opts: {
  fragen?: Frage[]
  ergebnisse?: Record<string, boolean>
  unsicher?: Set<string>
  uebersprungen?: Set<string>
  gestartet?: string
  beendet?: string
}): UebungsSession {
  return {
    id: 's_test',
    gruppeId: 'g',
    email: 'sus@gymhof.ch',
    fach: 'BWL',
    thema: 'T',
    modus: 'standard',
    quellen: undefined,
    fragen: opts.fragen ?? [],
    antworten: {},
    ergebnisse: opts.ergebnisse ?? {},
    aktuelleFrageIndex: 0,
    gestartet: opts.gestartet ?? '2026-05-08T10:00:00.000Z',
    unsicher: opts.unsicher ?? new Set(),
    uebersprungen: opts.uebersprungen ?? new Set(),
    score: 0,
    freiwillig: false,
    beendet: opts.beendet,
  } as UebungsSession
}

describe('berechneErgebnis', () => {
  it('Test 1: null-Session → Default-SessionErgebnis', () => {
    expect(berechneErgebnis(null)).toEqual({
      sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [],
    })
  })

  it('Test 2: leere fragen → quote = 0 (Div-by-zero-Branch)', () => {
    const erg = berechneErgebnis(erzeugeSession({ fragen: [] }))
    expect(erg.quote).toBe(0)
    expect(erg.anzahlFragen).toBe(0)
    expect(erg.details).toEqual([])
  })

  it('Test 3: alle korrekt → quote 100, richtig=N, falsch=0', () => {
    const fragen = [mkFrage('a'), mkFrage('b'), mkFrage('c')]
    const ergebnisse = { a: true, b: true, c: true }
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse }))
    expect(erg.richtig).toBe(3)
    expect(erg.falsch).toBe(0)
    expect(erg.quote).toBe(100)
  })

  it('Test 4: Mix 1 von 3 → quote ≈ 33.33', () => {
    const fragen = [mkFrage('a'), mkFrage('b'), mkFrage('c')]
    const ergebnisse = { a: true, b: false, c: false }
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse }))
    expect(erg.richtig).toBe(1)
    expect(erg.falsch).toBe(2)
    expect(erg.quote).toBeCloseTo(33.33, 1)
  })

  it('Test 5: Übersprungene Frage zählt nicht als falsch', () => {
    const fragen = [mkFrage('a'), mkFrage('b'), mkFrage('c')]
    const ergebnisse = { a: true, b: false, c: false }
    const uebersprungen = new Set(['c'])
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse, uebersprungen }))
    expect(erg.richtig).toBe(1)
    expect(erg.falsch).toBe(1)  // nur 'b' zählt als falsch, 'c' ist übersprungen
  })

  it('Test 6: unsicher- und uebersprungen-Sets werden in details propagiert', () => {
    const fragen = [mkFrage('a'), mkFrage('b')]
    const ergebnisse = { a: true, b: false }
    const unsicher = new Set(['a'])
    const uebersprungen = new Set(['b'])
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse, unsicher, uebersprungen }))
    expect(erg.details[0]).toMatchObject({ frageId: 'a', unsicher: true, uebersprungen: false })
    expect(erg.details[1]).toMatchObject({ frageId: 'b', unsicher: false, uebersprungen: true })
  })

  it('Test 7: dauer-Berechnung beendet vs. nicht-beendet', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T10:00:30.000Z'))
    try {
      const fragen = [mkFrage('a')]
      // Variante A: nicht beendet — dauer = Date.now() - gestartet
      const ohneEnde = berechneErgebnis(erzeugeSession({
        fragen, ergebnisse: { a: true }, gestartet: '2026-05-08T10:00:00.000Z',
      }))
      expect(ohneEnde.dauer).toBe(30_000)
      // Variante B: beendet — dauer = beendet - gestartet
      const mitEnde = berechneErgebnis(erzeugeSession({
        fragen, ergebnisse: { a: true },
        gestartet: '2026-05-08T10:00:00.000Z',
        beendet: '2026-05-08T10:00:25.000Z',
      }))
      expect(mitEnde.dauer).toBe(25_000)
    } finally {
      vi.useRealTimers()
    }
  })
})
```

- [ ] **Step 2: Tests laufen — alle 7 grün**

```bash
cd ExamLab && npx vitest run src/utils/ueben/ergebnisBerechnung.test.ts --reporter=dot 2>&1 | tail -10
```

Expected: `Tests  7 passed (7)`.

- [ ] **Step 3: Drift kumulativ**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -3
```

Expected: `Tests  1454 passed | 4 todo | 1 skipped` (1447 + 7).

### Task 3.3: `uebungsStore.ts` Cut + Aliased-Import + Delegator + getFragetext-Removal

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`

- [ ] **Step 1: Aliased-Import in uebungsStore.ts oben hinzufügen (nach historie-Import)**

```typescript
import { berechneErgebnis as berechneErgebnisPure } from '../../utils/ueben/ergebnisBerechnung'
```

**Wichtig:** Aliased-Import zwingend, sonst Shadow-Konflikt mit Store-Action `berechneErgebnis` (Spec § 3 Naming-Konflikt-Klärung).

- [ ] **Step 2: Store-Action-Body Z. 625–653 ersetzen**

Vorher (Z. 625–653):
```typescript
  berechneErgebnis: () => {
    const session = get().session
    if (!session) return { sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [] }

    const details = session.fragen.map(f => ({
      frageId: f.id,
      frage: getFragetext(f),
      typ: f.typ,
      korrekt: session.ergebnisse[f.id] ?? false,
      erklaerung: f.musterlosung,
      unsicher: session.unsicher.has(f.id),
      uebersprungen: session.uebersprungen.has(f.id),
    }))

    const richtig = details.filter(d => d.korrekt).length
    const falsch = details.filter(d => !d.korrekt && !d.uebersprungen).length
    const dauer = session.beendet
      ? new Date(session.beendet).getTime() - new Date(session.gestartet).getTime()
      : Date.now() - new Date(session.gestartet).getTime()

    return {
      sessionId: session.id,
      anzahlFragen: session.fragen.length,
      richtig, falsch,
      quote: session.fragen.length > 0 ? (richtig / session.fragen.length) * 100 : 0,
      dauer,
      details,
    }
  },
```

Nachher (1-Zeiler-Delegator):
```typescript
  berechneErgebnis: () => berechneErgebnisPure(get().session),
```

- [ ] **Step 3: `getFragetext`-Import-Removal verifizieren + entfernen**

```bash
grep -n "getFragetext" src/store/ueben/uebungsStore.ts
```

Expected: nur Zeile 4 (`import { getFragetext } from '../../utils/ueben/fragetext'`). Wenn ja → diesen Import entfernen.

Wenn unerwartet weitere Treffer → Cut-Bereich nicht vollständig: STOP und manuell prüfen.

- [ ] **Step 4: tsc + Lint + Vitest**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log | tail -5
npm run lint:as-any 2>&1 | tail -3
npm run lint:no-alert 2>&1 | tail -3
npm run lint:no-tests-dir 2>&1 | tail -3
npm run lint:musterloesung 2>&1 | tail -3
npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected:
- tsc clean
- 4 Lint-Gates clean
- Vitest: `Tests  1454 passed | 4 todo | 1 skipped`

- [ ] **Step 5: Build clean**

```bash
cd ExamLab && npm run build 2>&1 | tail -10
```

Expected: build clean.

- [ ] **Step 6: Source-Datei-Größe (KRITISCHER DoD-Punkt)**

```bash
wc -l src/store/ueben/uebungsStore.ts
```

Expected: **≤ 535 Zeilen**. Falls >535: Cut-Bereich Z. 625–653 nicht vollständig entfernt; manuell prüfen.

- [ ] **Step 7: Existierende Store-Tests grün**

```bash
cd ExamLab && npx vitest run src/tests/uebungsStoreLoesungsPreload.test.ts src/tests/uebungsStorePruefen.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: alle Tests grün.

- [ ] **Step 8: Phase-3-Commit**

```bash
git add src/utils/ueben/ergebnisBerechnung.ts src/utils/ueben/ergebnisBerechnung.test.ts src/store/ueben/uebungsStore.ts
git commit -m "$(cat <<'EOF'
Bundle W Phase 3: ergebnisBerechnung.ts extrahiert (7 Vitest)

Pure-Logic-Cut von berechneErgebnis-Body aus uebungsStore.ts (Z. 625-653)
byte-identisch nach utils/ueben/ergebnisBerechnung.ts als
(session: UebungsSession | null) => SessionErgebnis. Store-Action wird
zum 1-Zeiler-Delegator. Aliased-Import berechneErgebnisPure verhindert
Shadow-Konflikt mit Store-Action.

7 Vitest-Tests (null/leer/alle-richtig/mix/uebersprungen/unsicher/dauer
mit fake-timers). getFragetext-Import aus uebungsStore.ts entfernt
(jetzt in ergebnisBerechnung.ts).

uebungsStore.ts: ~570 → ≤535 Z. (Hotspot verlassen, >500-Schwelle).
Hotspot-Bilanz Files >500 Z.: 10 → 9.

Vitest 1447 → 1454 (+7). tsc + 4 Lint-Gates + build clean.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.4: Per-Phase-Reviewer

- [ ] **Step 1: Reviewer-Subagent dispatchen** (analog Task 1.4 mit Phase-3-Diff-Brief)

Brief muss explizit prüfen:
1. Byte-Identität `berechneErgebnis`-Body in ergebnisBerechnung.ts
2. **Aliased-Import** `berechneErgebnis as berechneErgebnisPure` (nicht ohne Alias!)
3. Store-Action ist 1-Zeiler-Delegator: `() => berechneErgebnisPure(get().session)`
4. `getFragetext`-Import aus uebungsStore.ts entfernt
5. **uebungsStore.ts ≤ 535 Z.** (Hotspot verlassen — kritischer DoD)
6. 7 Vitest-Tests vorhanden
7. Drift +7
8. existierende Store-Tests grün

Expected: APPROVED.

---

## Phase 4: Final Verification

### Task 4.1: Final tsc + Lint + Build + Vitest

- [ ] **Step 1: Komplett-Verifikation aus dem Worktree**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore/ExamLab"
echo "=== tsc ===" && npx tsc -b 2>&1 | tail -5
echo "=== lint:as-any ===" && npm run lint:as-any 2>&1 | tail -3
echo "=== lint:no-alert ===" && npm run lint:no-alert 2>&1 | tail -3
echo "=== lint:no-tests-dir ===" && npm run lint:no-tests-dir 2>&1 | tail -3
echo "=== lint:musterloesung ===" && npm run lint:musterloesung 2>&1 | tail -3
echo "=== vitest ===" && npx vitest run --reporter=dot 2>&1 | tail -5
echo "=== build ===" && npm run build 2>&1 | tail -5
echo "=== uebungsStore.ts wc ===" && wc -l src/store/ueben/uebungsStore.ts
```

Expected:
- tsc clean
- 4 Lint-Gates clean
- Vitest: `Tests  1454 passed | 4 todo | 1 skipped` (Drift gesamt +24)
- build clean
- `wc -l src/store/ueben/uebungsStore.ts` ≤ 535

### Task 4.2: Hotspot-Bilanz-Check

- [ ] **Step 1: Files >500 Z. zählen (ohne data/ + test/)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore/ExamLab"
find src -name "*.ts" -o -name "*.tsx" \
  | grep -v -E "(test\.|__tests__|/data/|/tests/)" \
  | xargs wc -l 2>/dev/null \
  | awk '$1 > 500 && $2 != "total" { print }' \
  | sort -rn | head -20
```

Expected: `uebungsStore.ts` taucht NICHT mehr auf. Gesamt-Anzahl Files >500 Z.: 9 (vorher 10).

---

## Phase 5: Browser-E2E auf staging

### Task 5.1: Preview-Push mit Force-Push-Sicherung

- [ ] **Step 1: Preview-Branch-Schutz prüfen (Memory-Lehre `feedback_preview_forcepush.md`)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore"
git fetch origin
git log origin/preview ^bundle-w/uebungsstore-cuts --oneline 2>&1 | head -10
```

Expected: leerer Output (preview hat nichts WIP gegenüber Bundle W). Falls Output: STOP — preview hat anderen WIP, **nicht force-pushen**, sondern User informieren.

- [ ] **Step 2: Force-Push auf preview**

```bash
git push --force-with-lease origin bundle-w/uebungsstore-cuts:preview
```

Expected: `+ <oldsha>...<newsha> bundle-w/uebungsstore-cuts -> preview (forced update)`.

- [ ] **Step 3: GitHub Pages Build abwarten + Cache-Clear-Anweisung**

Pages-Deploy dauert ~1–2 Minuten. Vor E2E:
1. Browser DevTools → Application → Service Workers → "Unregister".
2. Application → Storage → "Clear site data" (oder `caches.delete('examlab-pwa-v1'); caches.delete('examlab-runtime')` + Reload).
3. Hard-Reload (Cmd+Shift+R).

(Memory-Lehre Bundle N: Service-Worker-Cache vor Wire-Vertrag-Bundles zwingend. Bundle W ist kein Wire-Vertrag-Cut, aber SW kann veralteten JS-Bundle liefern — sicherheitshalber.)

### Task 5.2: E2E Mindest-Pfade

Mit echtem SuS-Login (Memory-Lehre `feedback_echte_logins.md` — keine Demo-Modi).

- [ ] **Pfad 1**: SuS-Login + Üben-Dashboard rendert (5 Tabs sichtbar)
  - 0 Console-Errors

- [ ] **Pfad 2**: Übungs-Session starten (Fach + Thema-Karte klicken)
  - Übungs-Screen rendert mit erster Frage
  - 0 Console-Errors (kein `mergeLoesungen`-Crash)

- [ ] **Pfad 3 (optional, wenn Auto-E2E nicht blockiert)**: MC-Frage instant beantworten (preload-Pfad)
  - Korrekt/Falsch-Feedback erscheint sofort (= clientseitige Korrektur via mergeLoesungInFrage)

- [ ] **Pfad 7**: Übung beenden + Zusammenfassung anzeigen
  - Quote, Anzahl-richtig, Anzahl-falsch, Dauer korrekt
  - 0 Console-Errors (= berechneErgebnis-Delegator funktioniert)

- [ ] **Pfad 8**: Üben-Einsicht-Tab → letzte Session sichtbar
  - GespeichertesErgebnis-Liste rendert mit eben beendeter Session

- [ ] **Pfad 9 (optional)**: DevTools → `localStorage.getItem('ueben-session-historie')` zeigt Array mit ≤ 50 Einträgen

- [ ] **Pfad 10**: Aktuelle Tab-Konsole — 0 Errors während gesamtem E2E-Durchlauf

Bei Auto-E2E-Block (Bundle V Lehre — pre-existing FrageModeProvider-Error in PruefungsComposer-Vorschau-Chunk könnte durchschlagen): Mindest-Manual reicht. Vitest-Coverage (24 neue + 2 existierende Store-Tests) als Sicherungsnetz.

### Task 5.3: E2E-Befund dokumentieren

- [ ] **Step 1: Notes-Datei mit E2E-Status anlegen** (für HANDOFF-Eintrag in Phase 6)

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-w-uebungsstore"
mkdir -p .superpowers/brainstorm
cat > .superpowers/brainstorm/bundle-w-e2e-notes.md <<'EOF'
# Bundle W — E2E-Notizen

Datum: 2026-05-08
Tester: durandbourjate@gmail.com (LP-Login) bzw. SuS-Test-Account
Browser: <Chrome Version>

## Pfade
- [ ] Pfad 1: SuS-Login + Dashboard
- [ ] Pfad 2: Übungs-Session starten
- [ ] Pfad 3: MC-Frage preload-Pfad
- [ ] Pfad 7: Übung beenden + Zusammenfassung
- [ ] Pfad 8: Üben-Einsicht
- [ ] Pfad 9: localStorage MAX_HISTORIE
- [ ] Pfad 10: 0 Console-Errors

## Befunde
<TBD>

## Auto-E2E-Status
<TBD>
EOF
```

- [ ] **Step 2: Pfade durchspielen + Befund eintragen**

Nach jedem Pfad: Status `[x]` + ggf. Befund-Notiz. Bei Bug: STOP, dokumentieren, fixen oder zurück in Spec/Plan.

---

## Phase 6: Final Code-Reviewer + HANDOFF + Memory + Merge

### Task 6.1: Final Code-Reviewer (Branch komplett)

- [ ] **Step 1: Final-Reviewer-Subagent dispatchen**

Brief umfasst:
- Spec-Pfad, Plan-Pfad, Branch-Diff (`git log main..HEAD --stat`)
- Bestätigung dass alle 3 Phasen byte-identisch + spec-konform
- 4 Lint-Gates clean
- Vitest +24
- uebungsStore.ts ≤ 535 Z.
- 2 existierende Tests grün
- E2E-Notes geprüft

Expected: **APPROVED FOR MERGE**.

### Task 6.2: HANDOFF.md aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: HANDOFF-Eintrag schreiben** (analog Bundle V/U-Format)

Vor dem aktuellen Bundle-V-Eintrag eine neue Sektion `### Bundle W — uebungsStore Pure-Logic-Cut ✅ MERGED (2026-05-08)` einfügen. Inhalt:
- Branch-Name, Phase-Bezug
- 3 neue Files + 3 Test-Files (Größen + Test-Counts)
- 1 Caller-Edit (UebungsEinsicht.tsx)
- uebungsStore.ts: 684 → ≤535 Z. (-149+, -22%)
- Hotspot-Bilanz: 10 → 9
- Verifikation: vitest 1454 (+24), tsc/4× lint/build clean
- Browser-E2E: tatsächliches Mindest-Pfade-Ergebnis
- Per-Phase-Reviewer + Final-Reviewer APPROVED
- Lehren neu (siehe Task 6.3 Memory)
- Spawn-Tasks: `istSelbstbewertbar`-Konstante DRY, Test-Migration zu co-located, Phase-5-Roadmap-Scoping
- Out-of-Scope: nichts mehr aus Phase 4 (uebungsStore war letztes Hoch-Risiko-File)

- [ ] **Step 2: HANDOFF-Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle W: HANDOFF-Eintrag

uebungsStore.ts 684 → ≤535 Z. via 3 Pure-Logic-Cuts (loesungsMerge / historie /
ergebnisBerechnung) in utils/ueben/. Hotspot-Bilanz 10 → 9. Phase 4 Audit komplett.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 6.3: Memory-Eintrag

- [ ] **Step 1: Memory-Datei für Bundle W anlegen** (`project_bundle_w_komplett.md`)

```bash
MEM_DIR="/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory"
cat > "$MEM_DIR/project_bundle_w_komplett.md" <<'EOF'
# Bundle W KOMPLETT auf main

**Merge:** 2026-05-08 `<MERGE_SHA>` zu main.

**Was geliefert:**
- 3 neue Pure-Logic-Files in `utils/ueben/`: `loesungsMerge.ts` (~85 Z. + 12 Vitest), `historie.ts` (~40 Z. + 5 Vitest), `ergebnisBerechnung.ts` (~35 Z. + 7 Vitest)
- 1 Caller-Edit: `UebungsEinsicht.tsx` Z. 2 Type-Import-Pfad
- Store-Action `berechneErgebnis` zum 1-Zeiler-Delegator (Aliased-Import `berechneErgebnisPure`)
- `getFragetext`-Import aus uebungsStore.ts entfernt

**uebungsStore.ts:** 684 → ≤535 Z. (-22%). Hotspot-Bilanz Files >500 Z.: 10 → 9.

**Verifikation:** vitest 1454 (+24), tsc + 4× lint + build clean. Per-Phase-Reviewer + Final-Reviewer APPROVED.

**Browser-E2E mit echtem SuS-Login auf staging:** Pfade 1+2+7+8+10 ✅ (tatsächliches Ergebnis hier dokumentieren).

**Patterns bestätigt:**
- Pure-Logic-Cut mit Hybrid-Layout (utils/ueben/ statt store/ueben/-Sub-Folder) — semantisch konsistent zu existierenden `korrektur.ts`/`mastery.ts`/`fragetext.ts`/`blockBuilder.ts`.
- Aliased-Import zwingend bei Store-Action-Naming-Konflikt (`berechneErgebnis as berechneErgebnisPure`).
- Top-Level-Funktion ohne Alias OK wenn Store-Action gleichnamig — JS-Module-Scope löst Property-Key vs. outer-Scope sauber.
- Domain-Owner-Type-Migration mit 1 Caller-Edit statt Re-Export-Bridge (konsistent zu Bundle U Dead-Surface-Removal).

**Phase 4 Audit komplett:** uebungsStore war letztes Hoch-Risiko-File. Phase 5+ Scoping offen.

**Spawn-Tasks (post-Bundle-W cleanup, chip'd):**
- `istSelbstbewertbar`-Konstante DRY (Duplikat in pruefeAntwortJetzt + selbstbewertenById) → `utils/ueben/fragetypGruppen.ts`.
- `src/tests/uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts` zu co-located in `store/ueben/` migrieren (Bundle Q Heuristik B).
EOF
```

- [ ] **Step 2: MEMORY.md Index-Eintrag** (im selben Verzeichnis)

In `MEMORY.md` unter `## ExamLab` einen Bullet-Point ergänzen (eine Zeile, analog Bundle V):

```markdown
- **[Bundle W KOMPLETT auf main](project_bundle_w_komplett.md)** — 08.05.2026 Merge. uebungsStore.ts 684 → ≤535 Z. (-22%) via 3 Pure-Logic-Cuts in utils/ueben/ (loesungsMerge 12 Vitest + historie 5 Vitest + ergebnisBerechnung 7 Vitest). Hotspot-Bilanz 10 → 9. Phase 4 Audit komplett (letztes Hoch-Risiko-File). vitest 1454 (+24), tsc/4× lint/build clean. Browser-E2E mit echtem SuS-Login: Mindest-Pfade ✅. Patterns: Hybrid-Layout utils/ueben/, Aliased-Import gegen Naming-Konflikt, Domain-Owner-Type-Migration ohne Re-Export. 2 Spawn-Tasks chip'd.
```

### Task 6.4: Merge zu main

- [ ] **Step 1: Branch in main mergen (vom Repo-Root, nicht vom Worktree)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git merge --no-ff bundle-w/uebungsstore-cuts -m "$(cat <<'EOF'
Merge Bundle W: uebungsStore Pure-Logic-Cut (684 → ≤535 Z., -22%)

3 Pure-Logic-Cuts nach utils/ueben/:
- loesungsMerge.ts (~85 Z. + 12 Vitest)
- historie.ts (~40 Z. + 5 Vitest)
- ergebnisBerechnung.ts (~35 Z. + 7 Vitest, pure mit aliased Store-Delegator)

uebungsStore.ts: 684 → ≤535 Z. Hotspot-Bilanz Files >500 Z.: 10 → 9.
Phase 4 Audit komplett (letztes Hoch-Risiko-File).

Vitest 1430 → 1454 (+24). tsc + 4 Lint-Gates + build clean. Per-Phase + Final
Reviewer APPROVED. Browser-E2E mit echtem SuS-Login: Mindest-Pfade ✅.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

- [ ] **Step 2: Worktree + Branch lokal+remote löschen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree remove .worktrees/bundle-w-uebungsstore
git branch -d bundle-w/uebungsstore-cuts
git push origin --delete bundle-w/uebungsstore-cuts
```

- [ ] **Step 3: Merge-Verifikation**

```bash
git log --oneline main -5
```

Expected:
- HEAD: `<merge-sha> Merge Bundle W: ...`
- 3 Bundle-W-Commits + HANDOFF-Commit darunter

---

## DoD-Checkliste (Final)

- [ ] Vitest **1454 passed | 4 todo | 1 skipped** (drift +24)
- [ ] tsc -b clean (Output direkt geprüft, nicht nur Exit-Code)
- [ ] 4 Lint-Gates clean: `lint:as-any` / `lint:no-alert` / `lint:no-tests-dir` / `lint:musterloesung`
- [ ] vite build erfolgreich (~3s, PWA generateSW OK)
- [ ] **uebungsStore.ts ≤ 535 Zeilen** (Hotspot verlassen)
- [ ] Hotspot-Bilanz Files >500 Z.: **10 → 9**
- [ ] 2 bestehende Store-Tests grün: `uebungsStoreLoesungsPreload.test.ts` + `uebungsStorePruefen.test.ts`
- [ ] 3× Per-Phase-Reviewer APPROVED
- [ ] Final Code-Reviewer APPROVED FOR MERGE
- [ ] Browser-E2E Mindest-Pfade (1+2+7+8+10) ✅ mit echtem SuS-Login
- [ ] HANDOFF.md Bundle-W-Eintrag committed
- [ ] Memory-Datei + Index-Eintrag committed
- [ ] Branch lokal+remote gelöscht

---

## Risiken-Mitigation-Quickref (aus Spec § 8)

| Risiko | Mitigation in diesem Plan |
|---|---|
| `mergeLoesungInFrage` Listen-Merge subtil verändert | Phase 1 byte-identische Source-Übernahme + 12 Tests + Task 1.4 Reviewer |
| `ladeHistorie`-Naming-Scope-Konflikt | Phase 2 Task 2.4 Reviewer prüft Scope-Auflösung explizit |
| `berechneErgebnis` Public-Surface bricht | Phase 3 Task 3.3 Step 1 Aliased-Import zwingend; Reviewer prüft 1-Zeiler-Delegator |
| Type-Import in UebungsEinsicht.tsx vergessen | Phase 2 Task 2.3 Step 3 explizit; tsc + Phase-2-Reviewer |
| Vitest-Drift weicht ab | Pro-Phase-Drift-Verifikation (Task 1.2 Step 3, 2.2 Step 3, 3.2 Step 3) |
| getFragetext-Import-Cleanup vergessen | Phase 3 Task 3.3 Step 3 grep-Verifikation |
| Browser-E2E pre-existing Auto-Block | Phase 5 Task 5.2 Mindest-Manual-Pfade; Vitest-Sicherungsnetz |
| preview-Branch-Force-Push | Phase 5 Task 5.1 Step 1 `git log preview ^bundle-w/...` Check |
