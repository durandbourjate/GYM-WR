# Bundle T.a — DurchfuehrenDashboard Hook-Extraktion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `DurchfuehrenDashboard.tsx` (677 Z., mittel-Risiko) per Hook-Extraktion in 3 fokussierte Custom-Hooks + 1 Pure-Util zerlegen, ohne Verhaltensänderung. Ziel-Bilanz: ~500 Z. im Hauptfile (idealerweise <500).

**Architecture:** Drei Custom-Hooks im LP-Bereich (`src/hooks/useDurchfuehren*`-Prefix, flach analog `useLPNavigation`) + eine Pure-Util-Function für Daten-Mapping. Das DurchfuehrenDashboard wird zum Komposition-File: ruft die 3 Hooks auf und rendert die Phasen-Komponenten. Verhalten 1:1 erhalten — Refactor ohne Wire-Vertrag-Touch, ohne Render-Änderung.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Vitest. Hook-Konvention pro Bundle-T-Master-Spec Sektion 4.1.

**Spec:** [`docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md`](../specs/2026-05-06-bundle-t-hooks-splits-design.md), Sektion 3 (Sub-Bundle T.a), Sektion 4 (Architektur-Konvention), Sektion 6.1 (Mittel-R-Hypothese).

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Branch:** `feature/bundle-t-a-durchfuehren-dashboard` (bereits angelegt)

**Build-Check:** Immer `cd ExamLab && npx tsc -b` (entspricht CI). Tests: `cd ExamLab && npx vitest run`.

---

## Pre-Audit: State-Inventar DurchfuehrenDashboard.tsx (gegrept 2026-05-06)

### useState (14 Stück)

| # | Variable | Typ | Cluster |
|---|---|---|---|
| 1 | `activeTab` | `DurchfuehrenTab` | C: Phasen-+Tab |
| 2 | `daten` | `MonitoringDaten \| null` | A: Monitoring |
| 3 | `zeigFragenbank` | `boolean` | UI-Toggle (bleibt) |
| 4 | `zeigHilfe` | `boolean` | UI-Toggle (bleibt) |
| 5 | `zeigEinstellungen` | `boolean` | UI-Toggle (bleibt) |
| 6 | `ladeStatus` | `'laden' \| 'fertig' \| 'fehler'` | A: Monitoring (Initial-Status) |
| 7 | `autoRefresh` | `boolean` | A: Monitoring (Toggle) |
| 8 | `abgaben` | `Record<string, SchuelerAbgabe>` | B: Initial-Load |
| 9 | `fragen` | `Frage[]` | B: Initial-Load |
| 10 | `_nachrichten` | `PruefungsNachricht[]` | D: Nachrichten (set, but `_`-prefix = ungelesen) |
| 11 | `ergebnisOffen` | `boolean` | UI-Toggle (bleibt) |
| 12 | `config` | `PruefungsConfig \| null` | B: Initial-Load |
| 13 | `freischaltenLaedt` | `boolean` | UI-State (bleibt, Lobby-spezifisch) |
| 14 | `zeigeVerbindungsBanner` | `boolean` | A: Monitoring (Error-Banner) |
| 15 | `startTimestamp` | `number` (lazy) | E: Timer |
| 16 | `dauer` | `string` | E: Timer |

(N=16 useState-Calls inkl. lazy-init-Cases — ursprüngliche Spec-Zählung 14 ist 2 zu wenig, hier vollständig)

### useRef (5 Stück)

| # | Variable | Cluster |
|---|---|---|
| 1 | `letztePhaseRef` (PruefungsPhase) | C: Phasen-+Tab (vorherige Phase für Auto-Forward) |
| 2 | `abgabenGeladen` (boolean) | B: Initial-Load (Once-Flag) |
| 3 | `monitoringAbortRef` (AbortController \| null) | A: Monitoring (Polling-Abort) |
| 4 | `letzteGeschriebeneAnzahlRef` (number \| null) | F: localStorage-Persist (bleibt) |
| 5 | `fehlerCountRef` (number) | A: Monitoring (Error-Counter) |

### useMemo (2 Stück) — beide trivial, bleiben im Body

| # | Variable |
|---|---|
| 1 | `teilnehmerEmails` (Set\<string\> \| null) |
| 2 | `gefilterteSchueler` |

### useCallback (2 Stück)

| # | Function | Cluster |
|---|---|---|
| 1 | `ladeNachrichten` | D: Nachrichten |
| 2 | `ladeDaten` | A: Monitoring |

### useEffect (9 Stück)

| # | Z. | Trigger / Dependency | Cluster |
|---|---|---|---|
| E1 | 162-166 | `[ladeNachrichten]` — 20s Nachrichten-Polling | D: Nachrichten |
| E2 | 233 | `[ladeDaten]` — Initial-Trigger | A: Monitoring |
| E3 | 236-241 | `[autoRefresh, ladeStatus, ladeDaten, phase]` — 5s/15s Auto-Refresh | A: Monitoring |
| E4 | 244-251 | `[ladeStatus, daten?.schueler?.length, pruefungId]` — localStorage-Persist | F (bleibt) |
| E5 | 254-292 | `[user, istDemoModus, pruefungId]` — Once-Load Abgaben+Fragen+Config | B: Initial-Load |
| E6 | 295-300 | `[user, pruefungId, istDemoModus]` — Demo-Config-Setup | B: Initial-Load |
| E7 | 305-318 | `[user, pruefungId, istDemoModus, phase]` — Periodic-Config (5s/30s) | B: Initial-Load (extending) |
| E8 | 321-331 | `[phase, user, pruefungId]` — Phase→Tab Auto-Forward + preWarmKorrektur | C: Phasen-+Tab |
| E9 | 334-340 | `[phase, startTimestamp]` — Timer 1s | E: Timer (bleibt) |

### Top-Level Pure Functions (bleiben unverändert)

- `phaseZuTab(phase)` — Z.47-54
- `tabIndex(tab)` — Z.59-61
- `istTabVerfuegbar(tab, phase)` — Z.64-70
- `normalisiereUrlTab(raw)` — Z.73-78
- `formatDauer(ms)` — Z.80-89

---

## Cut-Plan: 3 Hooks + 1 Util

| Cluster | Hook / Util | State / Refs / Callbacks bewegt | useEffects bewegt | Test-Hybrid |
|---|---|---|---|---|
| A | `useDurchfuehrenMonitoring({ user, pruefungId, istDemoModus, phase })` | `daten`, `ladeStatus`, `autoRefresh`, `monitoringAbortRef`, `fehlerCountRef`, `zeigeVerbindungsBanner`, `ladeDaten` | E2, E3 | **NEIN** (async + AbortController, Browser-E2E reicht) |
| B | `useDurchfuehrenLoad({ user, pruefungId, istDemoModus, urlTab, setActiveTab })` | `abgaben`, `fragen`, `config`, `setConfig`, `setAbgaben`, `setFragen`, `abgabenGeladen` | E5, E6, E7 | **NEIN** (async Promise.all + once-flag, Browser-E2E reicht) |
| C | `useDurchfuehrenPhasenTab({ phase, urlTab, user, pruefungId })` | `activeTab`, `letztePhaseRef`, `wechsleTab` (innen), URL-Sync | E8 | **NEIN** für Hook (Side-Effects), **JA** für die schon vorhandenen Pure-Functions falls noch ohne Coverage |
| util | `mappeMonitoringResult(raw, opts)` | (pure) | — | **JA** (pure mapping-Function, Decision-Tree gut testbar) |

**Bleibt im DurchfuehrenDashboard-Body:**
- UI-Toggles (`zeigFragenbank`, `zeigHilfe`, `zeigEinstellungen`, `ergebnisOffen`, `freischaltenLaedt`)
- 2 useMemo (`teilnehmerEmails`, `gefilterteSchueler`)
- E1 (Nachrichten 20s) + Callback `ladeNachrichten` + State `_nachrichten` — **NICHT extrahiert** (1 Effect + 1 Callback ist nicht extrakt-würdig; dead-code-Verdacht für `_nachrichten` in Spawn-Task post-merge)
- E4 (localStorage-Persist SuS-Anzahl) — **NICHT extrahiert** (4 Zeilen, trivial)
- E9 (Timer aktive Phase) + State `startTimestamp`+`dauer` — **NICHT extrahiert** (kompakt, isoliert)

**Bilanz-Schätzung:**
- A: ~80 Z. ausgebracht
- B: ~50 Z. ausgebracht  
- C: ~25 Z. ausgebracht
- util: ~30 Z. ausgebracht
- Hook-Imports + Hook-Calls + state-vorbei-reichen: ~15 Z. zurück
- = **~677 - 170 = ~507 Z.** im Hauptfile, plus 4 neue Files mit insgesamt ~200 Z. + Tests

---

## File Map

### Created Files

| File | Zweck | LOC-Schätzung |
|---|---|---|
| `ExamLab/src/hooks/useDurchfuehrenMonitoring.ts` | Hook A: Daten-Polling, Auto-Refresh, AbortController, Error-Banner | ~85 |
| `ExamLab/src/hooks/useDurchfuehrenLoad.ts` | Hook B: Once-Load Abgaben+Fragen+Config + Demo + Periodic-Config | ~85 |
| `ExamLab/src/hooks/useDurchfuehrenPhasenTab.ts` | Hook C: Phase→Tab Auto-Forward + URL-Sync + preWarmKorrektur-Trigger | ~50 |
| `ExamLab/src/utils/durchfuehrenMonitoringMapper.ts` | Pure Util: SchuelerStatus-Mapping aus Raw-API | ~50 |
| `ExamLab/src/utils/durchfuehrenMonitoringMapper.test.ts` | Vitest für Mapper (Test-Hybrid JA) | ~80 |

### Modified Files

| File | Change |
|---|---|
| `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` | Imports + Hook-Calls + State-Vorbei-reichen statt inline. ~507 Z. (Ziel <500 falls möglich, Toleranz <520) |

### Deleted Files

(keine — reines Refactor)

---

## Task 0: Branch-Verifikation

- [ ] **Step 1: Branch prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git status
git branch --show-current
```

Erwartung: `feature/bundle-t-a-durchfuehren-dashboard`, working tree clean.

- [ ] **Step 2: Baseline-Tests grün**

```bash
cd ExamLab && npx vitest run --reporter=verbose 2>&1 | tail -10
```

Erwartung: Alle Tests grün (drift=0 vor T.a-Änderungen).

---

## Task 1: Pure-Util `mappeMonitoringResult` (TDD, Test-Hybrid JA)

**Files:**
- Create: `ExamLab/src/utils/durchfuehrenMonitoringMapper.ts`
- Create: `ExamLab/src/utils/durchfuehrenMonitoringMapper.test.ts`

- [ ] **Step 1: Test-Datei schreiben**

`ExamLab/src/utils/durchfuehrenMonitoringMapper.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mappeMonitoringResult } from './durchfuehrenMonitoringMapper'
import type { MonitoringDaten } from '../types/monitoring'

describe('mappeMonitoringResult', () => {
  it('returns leeres MonitoringDaten when raw is null', () => {
    const result = mappeMonitoringResult(null)
    expect(result).toEqual({ pruefungTitel: '', schueler: [], gesamtSus: 0 })
  })

  it('mapt minimalen Schueler korrekt', () => {
    const raw = {
      pruefungTitel: 'Test',
      schueler: [{ email: 'a@b.ch', name: 'Ana' }],
      gesamtSus: 1,
    } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.pruefungTitel).toBe('Test')
    expect(result.schueler).toHaveLength(1)
    expect(result.schueler[0]).toMatchObject({
      email: 'a@b.ch',
      name: 'Ana',
      status: 'nicht-gestartet',
      beantworteteFragen: 0,
      gesamtFragen: 0,
      heartbeats: 0,
      netzwerkFehler: 0,
      autoSaveCount: 0,
      verstossZaehler: 0,
      gesperrt: false,
      vollbild: false,
      unterbrechungen: [],
      verstoesse: [],
    })
  })

  it('erkennt status="abgegeben" via abgabezeit', () => {
    const raw = { schueler: [{ email: 'x', abgabezeit: '2026-05-06T10:00' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].status).toBe('abgegeben')
  })

  it('erkennt status="abgegeben" via istAbgabe="true"', () => {
    const raw = { schueler: [{ email: 'x', istAbgabe: 'true' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].status).toBe('abgegeben')
  })

  it('erkennt status="abgegeben" via istAbgegeben=true (boolean)', () => {
    const raw = { schueler: [{ email: 'x', istAbgegeben: true }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].status).toBe('abgegeben')
  })

  it('parst verstoesse als Array wenn String mit JSON', () => {
    const raw = { schueler: [{ email: 'x', verstoesse: '[{"typ":"tab"}]' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].verstoesse).toEqual([{ typ: 'tab' }])
  })

  it('parst verstoesse als leeres Array bei JSON-Parse-Error', () => {
    const raw = { schueler: [{ email: 'x', verstoesse: 'invalid-json' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].verstoesse).toEqual([])
  })

  it('berechnet gesamtSus aus schueler.length wenn nicht gesetzt', () => {
    const raw = { schueler: [{ email: 'a' }, { email: 'b' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.gesamtSus).toBe(2)
  })

  it('berechnet aktuelleFrage als number wenn string', () => {
    const raw = { schueler: [{ email: 'x', aktuelleFrage: '5' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].aktuelleFrage).toBe(5)
  })

  it('setzt aktuelleFrage auf null bei leerem String', () => {
    const raw = { schueler: [{ email: 'x', aktuelleFrage: '' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].aktuelleFrage).toBe(null)
  })

  it('mapt Lockdown-Felder (B19-Fix)', () => {
    const raw = { schueler: [{
      email: 'x',
      geraet: 'tablet',
      vollbild: 'true',
      kontrollStufe: 'streng',
      verstossZaehler: 3,
      gesperrt: true,
    }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0]).toMatchObject({
      geraet: 'tablet',
      vollbild: true,
      kontrollStufe: 'streng',
      verstossZaehler: 3,
      gesperrt: true,
    })
  })
})
```

- [ ] **Step 2: Test laufen lassen — soll FAIL**

```bash
cd ExamLab && npx vitest run src/utils/durchfuehrenMonitoringMapper.test.ts
```

Erwartung: FAIL — module not found.

- [ ] **Step 3: Util implementieren**

`ExamLab/src/utils/durchfuehrenMonitoringMapper.ts`:

```typescript
import type { MonitoringDaten } from '../types/monitoring'

/**
 * Mapt das rohe Apps-Script-Result zu typisierten MonitoringDaten.
 * Hauptaufgaben:
 * - status-Ableitung aus abgabezeit / istAbgabe / istAbgegeben (drei Backend-Quellen)
 * - Lockdown-Felder (B19-Fix-Mapping: geraet/vollbild/kontrollStufe/verstoesse)
 * - verstoesse-JSON-String-Parsing mit Fallback auf []
 * - aktuelleFrage Typ-Coercion (string → number, leer-String → null)
 *
 * Vorher inline in DurchfuehrenDashboard::ladeDaten (Z.200-227).
 */
export function mappeMonitoringResult(raw: MonitoringDaten | null): MonitoringDaten {
  const effectiveResult = raw || ({ pruefungTitel: '', schueler: [], gesamtSus: 0 } as MonitoringDaten)
  return {
    ...effectiveResult,
    gesamtSus: effectiveResult.gesamtSus ?? (effectiveResult.schueler as unknown[])?.length ?? 0,
    schueler: (((effectiveResult.schueler || []) as unknown as Record<string, unknown>[]).map((s) => ({
      email: (s.email as string) || '',
      name: (s.name as string) || (s.email as string) || '',
      status: (s.abgabezeit || s.istAbgabe === 'true' || s.istAbgegeben === 'true' || s.istAbgegeben === true)
        ? 'abgegeben'
        : ((s.status as string) || 'nicht-gestartet'),
      letzterHeartbeat: (s.letzterHeartbeat as string) || null,
      letzterSave: (s.letzterSave as string) || null,
      beantworteteFragen: Number(s.beantworteteFragen) || 0,
      gesamtFragen: Number(s.gesamtFragen) || 0,
      abgabezeit: (s.abgabezeit as string) || null,
      startzeit: (s.startzeit as string) || null,
      heartbeats: Number(s.heartbeats) || 0,
      netzwerkFehler: Number(s.netzwerkFehler) || 0,
      autoSaveCount: Number(s.autoSaveCount) || 0,
      unterbrechungen: Array.isArray(s.unterbrechungen) ? s.unterbrechungen : [],
      sebVersion: (s.sebVersion as string) || undefined,
      browserInfo: (s.browserInfo as string) || undefined,
      aktuelleFrage: typeof s.aktuelleFrage === 'number'
        ? s.aktuelleFrage
        : (s.aktuelleFrage != null && s.aktuelleFrage !== '' ? Number(s.aktuelleFrage) : null),
      // Lockdown-Felder (B19-Fix)
      geraet: (s.geraet as 'laptop' | 'tablet' | 'unbekannt') || undefined,
      vollbild: s.vollbild === true || s.vollbild === 'true',
      kontrollStufe: (s.kontrollStufe as 'keine' | 'locker' | 'standard' | 'streng') || undefined,
      verstossZaehler: Number(s.verstossZaehler) || 0,
      gesperrt: s.gesperrt === true || s.gesperrt === 'true',
      verstoesse: Array.isArray(s.verstoesse)
        ? s.verstoesse
        : (typeof s.verstoesse === 'string'
          ? (() => { try { return JSON.parse(s.verstoesse as string) } catch { return [] } })()
          : []),
    }))),
  } as MonitoringDaten
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/utils/durchfuehrenMonitoringMapper.test.ts
```

Erwartung: 10 PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/utils/durchfuehrenMonitoringMapper.ts ExamLab/src/utils/durchfuehrenMonitoringMapper.test.ts
git commit -m "Bundle T.a Phase 1: Pure-Util mappeMonitoringResult mit Tests"
```

---

## Task 2: Hook A `useDurchfuehrenMonitoring` (Refactor, Test-Hybrid NEIN)

**Files:**
- Create: `ExamLab/src/hooks/useDurchfuehrenMonitoring.ts`
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`

### 2.1 Hook implementieren

- [ ] **Step 1: Hook-Datei schreiben**

`ExamLab/src/hooks/useDurchfuehrenMonitoring.ts`:

```typescript
import { useEffect, useState, useCallback, useRef } from 'react'
import { apiService } from '../services/apiService'
import { erstelleDemoMonitoring } from '../data/demoMonitoring'
import { mappeMonitoringResult } from '../utils/durchfuehrenMonitoringMapper'
import type { MonitoringDaten } from '../types/monitoring'
import type { PruefungsPhase } from '../types/monitoring'

export interface UseDurchfuehrenMonitoringResult {
  daten: MonitoringDaten | null
  ladeStatus: 'laden' | 'fertig' | 'fehler'
  autoRefresh: boolean
  setAutoRefresh: (v: boolean) => void
  zeigeVerbindungsBanner: boolean
  ladeDaten: () => Promise<void>
}

/**
 * Lädt Monitoring-Daten periodisch (5s in Live/Lobby, 15s sonst) per Apps-Script-API.
 * Schützt vor Overlap via AbortController, erkennt Verbindungsfehler nach 3 Misses,
 * mapt Raw-Result zu typisierten MonitoringDaten.
 *
 * Vorher: inline in DurchfuehrenDashboard.tsx (Z.101-150 + Z.169-241).
 */
export function useDurchfuehrenMonitoring(opts: {
  user: { email: string } | null
  pruefungId: string | null
  istDemoModus: boolean
  phase: PruefungsPhase
}): UseDurchfuehrenMonitoringResult {
  const { user, pruefungId, istDemoModus, phase } = opts

  const [daten, setDaten] = useState<MonitoringDaten | null>(null)
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [zeigeVerbindungsBanner, setZeigeVerbindungsBanner] = useState(false)
  const monitoringAbortRef = useRef<AbortController | null>(null)
  const fehlerCountRef = useRef(0)

  const ladeDaten = useCallback(async () => {
    if (!user) return
    if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId || pruefungId === 'demo') {
      setDaten(erstelleDemoMonitoring())
      setLadeStatus('fertig')
      return
    }
    monitoringAbortRef.current?.abort()
    const controller = new AbortController()
    monitoringAbortRef.current = controller
    const result = await apiService.ladeMonitoring(pruefungId, user.email, { signal: controller.signal })
    if (controller.signal.aborted) return
    if (!result && !istDemoModus && ladeStatus !== 'laden') {
      fehlerCountRef.current++
      if (fehlerCountRef.current >= 3) {
        setZeigeVerbindungsBanner(true)
      }
      return
    }
    if (result) {
      fehlerCountRef.current = 0
      if (zeigeVerbindungsBanner) setZeigeVerbindungsBanner(false)
    }
    const mapped = mappeMonitoringResult(result)
    setDaten(mapped)
    setLadeStatus('fertig')
  }, [user, istDemoModus, pruefungId, ladeStatus, zeigeVerbindungsBanner])

  // Initial-Trigger (E2)
  useEffect(() => { ladeDaten() }, [ladeDaten])

  // Auto-Refresh (E3): 5s in Live/Lobby, 15s sonst
  useEffect(() => {
    if (!autoRefresh || ladeStatus === 'fehler') return
    const intervallMs = (phase === 'aktiv' || phase === 'lobby') ? 5000 : 15000
    const interval = setInterval(ladeDaten, intervallMs)
    return () => clearInterval(interval)
  }, [autoRefresh, ladeStatus, ladeDaten, phase])

  return { daten, ladeStatus, autoRefresh, setAutoRefresh, zeigeVerbindungsBanner, ladeDaten }
}
```

- [ ] **Step 2: tsc clean prüfen**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```

Erwartung: Keine Errors (Hook noch nicht eingebunden, aber selbst typkorrekt).

- [ ] **Step 3: Commit (Hook-File only)**

```bash
git add ExamLab/src/hooks/useDurchfuehrenMonitoring.ts
git commit -m "Bundle T.a Phase 2.1: useDurchfuehrenMonitoring Hook (noch nicht eingebunden)"
```

### 2.2 Hook in DurchfuehrenDashboard einbinden

- [ ] **Step 1: Import hinzufügen**

In `DurchfuehrenDashboard.tsx` Z.1-13 (Import-Block):

```typescript
import { useDurchfuehrenMonitoring } from '../../../hooks/useDurchfuehrenMonitoring'
```

- [ ] **Step 2: Inline-State + Callbacks + Effects entfernen**

Im Body der Komponente (`DurchfuehrenDashboard`):

**Entfernen** (Z.101-107, 141-149, 168-241 — die Cluster-A-Blöcke):
- `const [daten, setDaten] = useState...`
- `const [ladeStatus, setLadeStatus] = useState...`
- `const [autoRefresh, setAutoRefresh] = useState(true)`
- `const monitoringAbortRef = useRef...`
- `const fehlerCountRef = useRef(0)`
- `const [zeigeVerbindungsBanner, setZeigeVerbindungsBanner] = useState(false)`
- `const ladeDaten = useCallback(async () => { ... }, [...])`
- `useEffect(() => { ladeDaten() }, [ladeDaten])` (E2)
- `useEffect(() => { /* Auto-Refresh */ }, [...])` (E3)

**Einfügen** an passender Stelle (nach `phase`-Berechnung Z.123-125):

```typescript
const { daten, ladeStatus, autoRefresh, setAutoRefresh, zeigeVerbindungsBanner, ladeDaten } =
  useDurchfuehrenMonitoring({ user, pruefungId, istDemoModus, phase })
```

- [ ] **Step 3: tsc + vitest grün**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5 && npx vitest run --reporter=dot 2>&1 | tail -5
```

Erwartung: tsc clean, vitest grün (drift=0 vs Baseline).

- [ ] **Step 4: Browser-Smoketest (lokal, optional aber empfohlen)**

```bash
cd ExamLab && npm run dev &
# Browser: http://localhost:5173/lp/durchfuehrung?id=<test-pruefung>
# Verifikation: Tab-Bar lädt, Monitoring-Daten erscheinen, Auto-Refresh tickt
```

Browser manuell prüfen, dann dev-Server stoppen.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx
git commit -m "Bundle T.a Phase 2.2: useDurchfuehrenMonitoring eingebunden"
```

---

## Task 3: Hook B `useDurchfuehrenLoad` (Refactor, Test-Hybrid NEIN)

**Files:**
- Create: `ExamLab/src/hooks/useDurchfuehrenLoad.ts`
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`

### 3.1 Hook implementieren

- [ ] **Step 1: Hook-Datei schreiben**

`ExamLab/src/hooks/useDurchfuehrenLoad.ts`:

```typescript
import { useEffect, useState, useRef } from 'react'
import { apiService } from '../services/apiService'
import { preWarmKorrektur } from '../services/preWarmApi'
import { demoFragen } from '../data/demoFragen'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import { einrichtungsUebungFragen } from '../data/einrichtungsUebungFragen'
import type { PruefungsConfig } from '../types/pruefung'
import type { PruefungsPhase } from '../types/monitoring'
import type { Frage } from '../types/fragen-storage'
import type { SchuelerAbgabe } from '../types/korrektur'

const eingebauteVersionen: Record<string, { config: PruefungsConfig; fragen: Frage[] }> = {
  'einrichtung-uebung': { config: einrichtungsUebung, fragen: einrichtungsUebungFragen },
  [einrichtungsPruefung.id]: { config: einrichtungsPruefung, fragen: demoFragen },
}

export interface UseDurchfuehrenLoadResult {
  abgaben: Record<string, SchuelerAbgabe>
  setAbgaben: React.Dispatch<React.SetStateAction<Record<string, SchuelerAbgabe>>>
  fragen: Frage[]
  setFragen: React.Dispatch<React.SetStateAction<Frage[]>>
  config: PruefungsConfig | null
  setConfig: React.Dispatch<React.SetStateAction<PruefungsConfig | null>>
  abgabenGeladenRef: React.MutableRefObject<boolean>
}

/**
 * Lädt Abgaben + Fragen + Config einmalig (Once-Flag) und aktualisiert Config periodisch
 * in Vorbereitung/Lobby. Demo-Modus initialisiert mit einrichtungsPruefung.
 * Bei eingebauten Versionen (einrichtungsUebung etc.) wird die eingebaute Config + Fragen verwendet.
 *
 * Vorher: inline in DurchfuehrenDashboard (Z.108-110, 119-120, 254-318) +
 * eingebauteVersionen-Konstante (Z.16-19).
 */
export function useDurchfuehrenLoad(opts: {
  user: { email: string } | null
  pruefungId: string | null
  istDemoModus: boolean
  phase: PruefungsPhase
  urlTab: string | null
  setActiveTab: (tab: 'vorbereitung' | 'lobby' | 'live' | 'auswertung') => void
}): UseDurchfuehrenLoadResult {
  const { user, pruefungId, istDemoModus, phase, urlTab, setActiveTab } = opts

  const [abgaben, setAbgaben] = useState<Record<string, SchuelerAbgabe>>({})
  const [fragen, setFragen] = useState<Frage[]>([])
  const [config, setConfig] = useState<PruefungsConfig | null>(null)
  const abgabenGeladenRef = useRef(false)

  // E5: Once-Load Abgaben + Fragen + Config
  useEffect(() => {
    if (abgabenGeladenRef.current || !user) return
    async function ladeAbgabenUndFragen() {
      if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId || pruefungId === 'demo') {
        setFragen(demoFragen)
        abgabenGeladenRef.current = true
        return
      }
      const [abgabenResult, pruefungResult] = await Promise.all([
        apiService.ladeAbgaben(pruefungId, user!.email),
        apiService.ladePruefung(pruefungId, user!.email),
      ])
      if (abgabenResult) setAbgaben(abgabenResult)

      if (pruefungResult && eingebauteVersionen[pruefungId]) {
        const eingebaut = eingebauteVersionen[pruefungId]
        pruefungResult.config = {
          ...eingebaut.config,
          freigeschaltet: pruefungResult.config.freigeschaltet,
          durchfuehrungId: pruefungResult.config.durchfuehrungId,
          beendetUm: pruefungResult.config.beendetUm,
          teilnehmer: pruefungResult.config.teilnehmer,
        }
        pruefungResult.fragen = eingebaut.fragen
      }

      if (pruefungResult?.fragen) setFragen(pruefungResult.fragen)
      if (pruefungResult?.config) {
        setConfig(pruefungResult.config)
        if (pruefungResult.config.beendetUm && pruefungResult.config.freigeschaltet && !urlTab) {
          setActiveTab('auswertung')
          if (user?.email && pruefungId) {
            void preWarmKorrektur(pruefungId, user.email)
          }
        }
      }
      abgabenGeladenRef.current = true
    }
    ladeAbgabenUndFragen()
  }, [user, istDemoModus, pruefungId, urlTab, setActiveTab])

  // E6: Demo-Modus Config-Setup
  useEffect(() => {
    if (!user || !pruefungId) return
    if (istDemoModus || pruefungId === 'demo') {
      setConfig({ ...einrichtungsPruefung, freigeschaltet: true })
    }
  }, [user, pruefungId, istDemoModus])

  // E7: Periodic Config in Vorbereitung/Lobby
  useEffect(() => {
    if (!user || !pruefungId || istDemoModus || pruefungId === 'demo') return
    if (phase !== 'vorbereitung' && phase !== 'lobby') return
    const ladeConfig = async () => {
      try {
        const found = await apiService.ladeEinzelConfig(pruefungId, user.email)
        if (found) setConfig(found)
      } catch { /* ignore */ }
    }
    const intervallMs = phase === 'lobby' ? 5000 : 30000
    const interval = setInterval(ladeConfig, intervallMs)
    return () => clearInterval(interval)
  }, [user, pruefungId, istDemoModus, phase])

  return { abgaben, setAbgaben, fragen, setFragen, config, setConfig, abgabenGeladenRef }
}
```

- [ ] **Step 2: tsc clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```

- [ ] **Step 3: Commit (Hook-File only)**

```bash
git add ExamLab/src/hooks/useDurchfuehrenLoad.ts
git commit -m "Bundle T.a Phase 3.1: useDurchfuehrenLoad Hook"
```

### 3.2 Hook in DurchfuehrenDashboard einbinden

- [ ] **Step 1: Import hinzufügen**

```typescript
import { useDurchfuehrenLoad } from '../../../hooks/useDurchfuehrenLoad'
```

- [ ] **Step 2: Inline-State + Effects entfernen**

**Entfernen aus DurchfuehrenDashboard.tsx:**
- `const eingebauteVersionen: Record<...> = {...}` (Z.16-19) — wandert in den Hook
- Imports: `einrichtungsUebung`, `einrichtungsUebungFragen`, `einrichtungsPruefung`, `demoFragen` (werden im Hook gebraucht — bleiben aber weiterhin im File falls noch via demo-Pfad genutzt; **ACHTUNG**: prüfen ob nach Cut noch im Body referenziert)
- `const [abgaben, setAbgaben] = useState...`
- `const [fragen, setFragen] = useState...`
- `const [config, setConfig] = useState...`
- `const abgabenGeladen = useRef(false)`
- `useEffect(() => { ... ladeAbgabenUndFragen ... })` (E5)
- `useEffect(() => { ... istDemoModus ... setConfig(einrichtungsPruefung) })` (E6)
- `useEffect(() => { ... ladeEinzelConfig ... })` (E7)
- Import-Linie für `preWarmKorrektur` falls nicht mehr im Body benötigt (in `wechsleTab` und Phase-Effect E8 wird er noch gebraucht — bleibt)

**Einfügen** (nach `phase`-Berechnung, vor `useDurchfuehrenMonitoring`):

```typescript
const { abgaben, setAbgaben, fragen, setFragen, config, setConfig, abgabenGeladenRef } =
  useDurchfuehrenLoad({ user, pruefungId, istDemoModus, phase, urlTab, setActiveTab })
```

**ACHTUNG:** `abgabenGeladen.current` (Z.607) wird in `onNeueDurchfuehrung`-Callback referenziert (`abgabenGeladen.current = false`). Das wird zu `abgabenGeladenRef.current = false`.

- [ ] **Step 3: tsc + vitest grün**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5 && npx vitest run --reporter=dot 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx
git commit -m "Bundle T.a Phase 3.2: useDurchfuehrenLoad eingebunden"
```

---

## Task 4: Hook C `useDurchfuehrenPhasenTab` (Refactor, Test-Hybrid NEIN)

**Files:**
- Create: `ExamLab/src/hooks/useDurchfuehrenPhasenTab.ts`
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`

### 4.1 Hook implementieren

- [ ] **Step 1: Hook-Datei schreiben**

`ExamLab/src/hooks/useDurchfuehrenPhasenTab.ts`:

```typescript
import { useEffect, useRef, useState } from 'react'
import { preWarmKorrektur } from '../services/preWarmApi'
import type { PruefungsPhase } from '../types/monitoring'

export type DurchfuehrenTab = 'vorbereitung' | 'lobby' | 'live' | 'auswertung'

const TAB_REIHENFOLGE: DurchfuehrenTab[] = ['vorbereitung', 'lobby', 'live', 'auswertung']

export function phaseZuTab(phase: PruefungsPhase): DurchfuehrenTab {
  switch (phase) {
    case 'vorbereitung': return 'vorbereitung'
    case 'lobby': return 'lobby'
    case 'aktiv': return 'live'
    case 'beendet': return 'auswertung'
  }
}

export function tabIndex(tab: DurchfuehrenTab): number {
  return TAB_REIHENFOLGE.indexOf(tab)
}

export function istTabVerfuegbar(tab: DurchfuehrenTab, phase: PruefungsPhase): boolean {
  const aktuellerTabIndex = tabIndex(phaseZuTab(phase))
  const zielIndex = tabIndex(tab)
  if (tab === 'auswertung') return true
  return zielIndex <= aktuellerTabIndex
}

export function normalisiereUrlTab(raw: string | null): DurchfuehrenTab | null {
  if (!raw) return null
  if (raw === 'ergebnisse' || raw === 'korrektur') return 'auswertung'
  if (TAB_REIHENFOLGE.includes(raw as DurchfuehrenTab)) return raw as DurchfuehrenTab
  return null
}

export interface UseDurchfuehrenPhasenTabResult {
  activeTab: DurchfuehrenTab
  setActiveTab: React.Dispatch<React.SetStateAction<DurchfuehrenTab>>
  wechsleTab: (tab: DurchfuehrenTab) => void
}

/**
 * Verwaltet activeTab + Phase→Tab Auto-Forward + URL-Sync + preWarmKorrektur-Trigger.
 *
 * Vorher: inline in DurchfuehrenDashboard (Z.95-97, 98, 320-353) + Top-Level-Functions
 * (Z.37-78). Top-Level-Functions wurden hier ko-lokalisiert exportiert (Caller können
 * weiterhin über das Re-Export am Hook-File-Top importieren).
 */
export function useDurchfuehrenPhasenTab(opts: {
  phase: PruefungsPhase
  urlTab: DurchfuehrenTab | null
  user: { email: string } | null
  pruefungId: string | null
}): UseDurchfuehrenPhasenTabResult {
  const { phase, urlTab, user, pruefungId } = opts

  const [activeTab, setActiveTab] = useState<DurchfuehrenTab>(urlTab ?? 'vorbereitung')
  const letztePhaseRef = useRef<PruefungsPhase>('vorbereitung')

  // E8: Phase-Wechsel → Tab Auto-Forward + preWarmKorrektur bei beendet
  useEffect(() => {
    const neuerTab = phaseZuTab(phase)
    if (tabIndex(neuerTab) > tabIndex(phaseZuTab(letztePhaseRef.current))) {
      setActiveTab(neuerTab)
      if (phase === 'beendet' && user?.email && pruefungId) {
        void preWarmKorrektur(pruefungId, user.email)
      }
    }
    letztePhaseRef.current = phase
  }, [phase, user, pruefungId])

  // wechsleTab: Tab + URL aktualisieren + preWarmKorrektur bei auswertung
  const wechsleTab = (tab: DurchfuehrenTab) => {
    if (!istTabVerfuegbar(tab, phase)) return
    setActiveTab(tab)
    if (tab === 'auswertung' && user?.email && pruefungId) {
      void preWarmKorrektur(pruefungId, user.email)
    }
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }

  return { activeTab, setActiveTab, wechsleTab }
}
```

- [ ] **Step 2: tsc clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```

- [ ] **Step 3: Commit (Hook-File only)**

```bash
git add ExamLab/src/hooks/useDurchfuehrenPhasenTab.ts
git commit -m "Bundle T.a Phase 4.1: useDurchfuehrenPhasenTab Hook + ko-lokalisierte Pure-Functions"
```

### 4.2 Hook in DurchfuehrenDashboard einbinden

- [ ] **Step 1: Imports**

```typescript
import {
  useDurchfuehrenPhasenTab,
  phaseZuTab,
  tabIndex,
  istTabVerfuegbar,
  normalisiereUrlTab,
  type DurchfuehrenTab,
} from '../../../hooks/useDurchfuehrenPhasenTab'
```

- [ ] **Step 2: Inline entfernen**

**Entfernen aus DurchfuehrenDashboard.tsx:**
- Z.37: `type DurchfuehrenTab = ...`
- Z.47-78: 4 Top-Level-Functions (phaseZuTab, tabIndex, istTabVerfuegbar, normalisiereUrlTab) + `TAB_REIHENFOLGE`-Konstante
- Z.95-97: `const urlTab = normalisiereUrlTab(...)` + `const [activeTab, setActiveTab] = useState...`
- Z.98: `const letztePhaseRef = useRef...`
- Z.320-331: useEffect (E8) Phase→Tab
- Z.342-353: function `wechsleTab(...)` { ... }

**Einfügen** (nach `useDurchfuehrenLoad`-Hook):

```typescript
const urlTab = normalisiereUrlTab(new URLSearchParams(window.location.search).get('tab'))
const { activeTab, setActiveTab, wechsleTab } = useDurchfuehrenPhasenTab({ phase, urlTab, user, pruefungId })
```

**ACHTUNG**: Reihenfolge der Hook-Calls:
1. `useDurchfuehrenLoad({ ..., setActiveTab })` braucht `setActiveTab`
2. Aber `setActiveTab` kommt von `useDurchfuehrenPhasenTab`

→ Hook-Reihenfolge muss sein: **PhasenTab zuerst, dann Load**. Im Plan-Code oben muss diese Reihenfolge respektiert werden.

Lösung: 
```typescript
const urlTab = normalisiereUrlTab(new URLSearchParams(window.location.search).get('tab'))
const { activeTab, setActiveTab, wechsleTab } = useDurchfuehrenPhasenTab({
  phase: 'vorbereitung', // Initial-Wert, wird gleich überschrieben
  urlTab, user, pruefungId
})
const { abgaben, setAbgaben, fragen, setFragen, config, setConfig, abgabenGeladenRef } =
  useDurchfuehrenLoad({ user, pruefungId, istDemoModus, phase, urlTab, setActiveTab })
const { daten, ladeStatus, autoRefresh, setAutoRefresh, zeigeVerbindungsBanner, ladeDaten } =
  useDurchfuehrenMonitoring({ user, pruefungId, istDemoModus, phase })
```

**ABER:** `phase` wird aus `config + daten` abgeleitet. Vor `useDurchfuehrenLoad` ist `config` noch nicht da. Vor `useDurchfuehrenMonitoring` ist `daten` noch nicht da. Das wäre Zirkular.

**Architektur-Klärung (KRITISCH):** 
Ursprünglich: `phase` wird Z.123-125 aus `config && daten ? bestimmePhase(...) : 'vorbereitung'` abgeleitet. Beim ersten Render ist `phase = 'vorbereitung'` (Default).

Lösung-Pattern: 
1. `useDurchfuehrenPhasenTab` braucht `phase` (für E8 Auto-Forward) — kann mit Default 'vorbereitung' starten, useEffect re-läuft bei phase-Änderung
2. `useDurchfuehrenLoad` braucht `phase` (für E7 Periodic-Config) — kann auch Default starten, useEffect re-läuft
3. `useDurchfuehrenMonitoring` braucht `phase` (für E3 Auto-Refresh) — kann auch Default starten

Da `phase` aus `config` + `daten` kommt (beide aus den Hooks), gibt es einen Zyklus. Lösung:
- Hook-Calls in Reihenfolge: PhasenTab → Load → Monitoring
- `phase` wird nach allen Hook-Calls berechnet (Z.123-125 bleibt!)
- Hook-Inputs nutzen das `phase` aus dem **vorigen Render** — das ist OK, weil React-Reactivity die Hook-Effects bei phase-Änderung re-läuft

**Konkretes Pattern in DurchfuehrenDashboard:**

```typescript
// Hook 1: PhasenTab (urlTab + Init)
const urlTab = normalisiereUrlTab(new URLSearchParams(window.location.search).get('tab'))
// Wir reichen 'phase' nach unten — beim ersten Render ist phase='vorbereitung' (s.u.)

// PRE-COMPUTE: Wir brauchen 'phase' für die Hooks. Beim ersten Render kennen wir sie nicht
// (config+daten sind null). Default 'vorbereitung' ist semantisch korrekt für Render 1.
// Bei späteren Renders kommt phase aus dem berechneten Wert unten — die Hook-Effects
// re-laufen mit dem neuen phase-Wert.

// Wir berechnen 'phase' NACH den State-Hooks (Load+Monitoring), brauchen es ABER vor
// PhasenTab. Lösung: phase wird in zwei Schritten verwendet — initial 'vorbereitung'
// für den ersten Render-Pass, dann aus useState->useEffect-Reactivity propagiert.

// EINFACHSTE LÖSUNG: Wir reichen 'phase' nicht in PhasenTab, sondern
//   PhasenTab braucht nur user/pruefungId/urlTab. Phase-Effect (E8) bekommt phase
//   als zusätzlicher Parameter, der NACH Load+Monitoring berechnet wird.

// → Das bedeutet: useDurchfuehrenPhasenTab muss umgestaltet werden:
//   Hook gibt activeTab + setActiveTab + wechsleTab zurück, aber der Phase-Watch
//   wird als separater Effekt im Body durchgeführt — ODER der Hook bekommt 'phase'
//   als Parameter mit der Erwartung dass er NACH den Daten-Hooks aufgerufen wird.
```

**ENTSCHEIDUNG:** Hook-Reihenfolge ist:
1. PhasenTab (gibt activeTab, setActiveTab, wechsleTab zurück) — bekommt aber **nur** urlTab/user/pruefungId. Phase-Auto-Forward-Effect verlagert in den Body von DurchfuehrenDashboard.
2. Load — bekommt phase, urlTab, setActiveTab
3. Monitoring — bekommt phase

**ALTERNATIVE:** PhasenTab bekommt phase, aber das Phase-Watch-Effect läuft beim Mount mit phase='vorbereitung' (Default), und re-läuft sobald phase-Computation aktualisiert. Das ist React-konsistent.

**BESTE LÖSUNG:** Hook-Reihenfolge **PhasenTab → Load → Monitoring**, alle bekommen `phase`. Beim allerersten Render ist phase='vorbereitung' (Default vor jeglicher Daten). Hook-Effects re-laufen bei phase-Änderung.

Das funktioniert weil:
- Hook 1 (PhasenTab) Effekte hängen von phase ab → re-läuft bei phase-Änderung ✓
- Hook 2 (Load) Effekt E7 hängt von phase ab → re-läuft bei phase-Änderung ✓
- Hook 3 (Monitoring) Effekt E3 hängt von phase ab → re-läuft bei phase-Änderung ✓
- `phase` selbst wird nach den Hooks berechnet (Z.123-125 bleibt!)

Aber: Die State-Setter (setActiveTab/setConfig/setDaten) müssen referentiell stabil sein, damit useEffect-Deps stabil sind. `setX` aus useState ist von Natur aus stabil. ✓

**FINALE Hook-Einbindung in DurchfuehrenDashboard:**

```typescript
// Pre-Compute urlTab
const urlTab = normalisiereUrlTab(new URLSearchParams(window.location.search).get('tab'))

// Hook C: PhasenTab (gibt activeTab, setActiveTab, wechsleTab zurück)
//   Reihenfolge wichtig: muss VOR useDurchfuehrenLoad kommen (Load braucht setActiveTab)
const { activeTab, setActiveTab, wechsleTab } = useDurchfuehrenPhasenTab({
  phase: 'vorbereitung', // Initial; tatsächliches phase wird unten berechnet, useEffect re-läuft
  urlTab, user, pruefungId,
})
```

**ABER:** Das übergibt 'vorbereitung' fest — kein Re-Run bei phase-Änderung möglich, weil das Argument konstant ist.

Lösung: phase wird **vor** dem ersten Hook berechnet. Das geht aber nicht, weil config+daten erst aus den Hooks kommen.

**FINALE LÖSUNG (Architektur-Pattern: lazy phase-derivation):**

`phase` muss VOR den Hooks bekannt sein. Aber config+daten kommen aus den Hooks. Klassisches Henne-Ei. Lösung: **wir benutzen useState für phase** und aktualisieren es per separatem useEffect aus config+daten.

Oder einfacher: Wir akzeptieren, dass **phase auf Hook-Inputs nicht zur Verfügung steht beim ersten Render** und der Default-Wert 'vorbereitung' aus dem useState-Initial korrekt ist. Wenn config+daten verfügbar werden, ändert sich `phase`, und die useState-basierte Hook-Reaktivität funktioniert NICHT, weil die Hook-Inputs konstant sind.

**Die beste reale Lösung: Hook nicht parametriert mit `phase`. Stattdessen reichen die Hooks `phase` aus dem useState aus DurchfuehrenDashboard rein, der per setPhase aus einem useEffect von config/daten gesetzt wird.**

Das ist Refactor-Aufwand der über reines Hook-Extract hinausgeht. **Pragmatic-Beschluss:**

→ **Phase wird im Body von DurchfuehrenDashboard berechnet wie heute (Z.123-125), und an alle Hooks reingegeben.** Weil `phase` jeden Render neu berechnet wird (es ist eine pure Computation aus config+daten — nicht useState), ist es ein **stable per render** Wert. Hook-Inputs sind dann beim ersten Render `phase='vorbereitung'` (config+daten=null), und ab dem zweiten Render der echte Wert. Die Hook-Effekte hängen von phase ab und re-laufen wenn phase sich ändert. ✓

**REIHENFOLGE im DurchfuehrenDashboard nach diesem Pattern:**

```typescript
// 1. config kommt aus useDurchfuehrenLoad
// 2. daten kommt aus useDurchfuehrenMonitoring  
// 3. phase = config && daten ? bestimmePhase(config, daten.schueler) : 'vorbereitung'
// 4. PhasenTab bekommt phase
// 5. Aber: Load+Monitoring brauchen phase als Input

→ Zirkular. Auflösung: 

OPTION X: phase wird in useState gehalten + per useEffect aktualisiert.
```

**ACHTUNG:** Das ist eine wichtige Architektur-Entscheidung, die wir im Plan **vor Subagent-Dispatch** klären sollten. Im worst-case bedeutet das, dass der Plan einen zusätzlichen Schritt braucht: einen `usePhase`-Helper-Hook oder die phase als useState vom Body.

**KONSERVATIVE LÖSUNG (recommended, einfach):**

Wir lassen `phase` als per-render-Computation im Body, ABER reichen sie nicht in die Hooks rein als Hook-Input-Parameter. Stattdessen:

- `useDurchfuehrenMonitoring` bekommt `phase` rein (nicht zirkular, weil Monitoring ohne Load läuft) → wenn Monitoring vor Load läuft, hat Monitoring `phase` aus Body.
- `useDurchfuehrenLoad` bekommt `phase` rein → wenn Load vor PhasenTab läuft, ist phase verfügbar.

ABER: Body-Berechnung von `phase` braucht `config` aus Load und `daten` aus Monitoring. → Hook-Aufruf-Reihenfolge muss sein: Load → Monitoring → Body-Berechnung von phase → PhasenTab.

Aber Load braucht phase als Input. → ZIRKULAR.

**LÖSUNG:** `phase` wird im Body als useState gehalten + via useEffect aus config+daten aktualisiert.

**Plan-Anpassung:**

```typescript
// Im DurchfuehrenDashboard-Body:
const [phase, setPhase] = useState<PruefungsPhase>('vorbereitung')

// Hook-Reihenfolge: PhasenTab → Load → Monitoring → Phase-Sync-Effect
const { activeTab, setActiveTab, wechsleTab } = useDurchfuehrenPhasenTab({ phase, urlTab, user, pruefungId })
const { abgaben, setAbgaben, fragen, setFragen, config, setConfig, abgabenGeladenRef } =
  useDurchfuehrenLoad({ user, pruefungId, istDemoModus, phase, urlTab, setActiveTab })
const { daten, ladeStatus, autoRefresh, setAutoRefresh, zeigeVerbindungsBanner, ladeDaten } =
  useDurchfuehrenMonitoring({ user, pruefungId, istDemoModus, phase })

// Phase-Sync (ersetzt Z.123-125):
useEffect(() => {
  const neuePhase: PruefungsPhase = config && daten ? bestimmePhase(config, daten.schueler) : 'vorbereitung'
  setPhase(neuePhase)
}, [config, daten])
```

Diese Lösung führt zu einem zusätzlichen useState (`phase`) und einem zusätzlichen useEffect (Phase-Sync), aber löst die Hook-Input-Zirkularität sauber.

- [ ] **Step 3: Pattern dokumentieren als Code-Comment**

In DurchfuehrenDashboard.tsx an der phase-useState-Zeile:

```typescript
// Bundle T.a: phase als useState statt per-render-Computation, weil
// alle 3 Hooks (PhasenTab, Load, Monitoring) phase als Input brauchen,
// aber phase nur aus config+daten ableitbar ist (die wiederum aus Load+Monitoring kommen).
// useEffect unten synchronisiert phase mit config/daten.
const [phase, setPhase] = useState<PruefungsPhase>('vorbereitung')
```

- [ ] **Step 4: tsc + vitest grün**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5 && npx vitest run --reporter=dot 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx
git commit -m "Bundle T.a Phase 4.2: useDurchfuehrenPhasenTab eingebunden + phase-useState"
```

---

## Task 5: Bilanz + Cleanup-Pass

- [ ] **Step 1: Zeilenbilanz prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
wc -l ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx
wc -l ExamLab/src/hooks/useDurchfuehrenMonitoring.ts ExamLab/src/hooks/useDurchfuehrenLoad.ts ExamLab/src/hooks/useDurchfuehrenPhasenTab.ts
wc -l ExamLab/src/utils/durchfuehrenMonitoringMapper.ts ExamLab/src/utils/durchfuehrenMonitoringMapper.test.ts
```

Erwartung: DurchfuehrenDashboard.tsx ~ 480-520 Z. Wenn >550 Z., zusätzlichen Cluster (z.B. Nachrichten-Polling oder Timer) extrahieren.

- [ ] **Step 2: Unused-Imports prüfen**

```bash
cd ExamLab && npx tsc -b 2>&1 | grep -i "unused\|never used"
```

Erwartung: keine Warnungen. Falls doch (wahrscheinlich `einrichtungsUebung`, `einrichtungsUebungFragen`, `demoFragen`, `apiService`, `preWarmKorrektur`, `erstelleDemoMonitoring` falls nicht mehr im Body referenziert): Imports aus DurchfuehrenDashboard.tsx entfernen.

- [ ] **Step 3: Vollständige Test-Suite**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Erwartung: drift=0 (1253 ohne T.a-Tests + 10 Mapper-Tests = 1263), oder klar dokumentiert wenn Tests neu hinzukamen.

- [ ] **Step 4: tsc / lint:as-any / lint:no-alert / build**

```bash
cd ExamLab
npx tsc -b 2>&1 | tail -3
npm run lint:as-any
npm run lint:no-alert
npx vite build 2>&1 | tail -5
```

Erwartung: alle clean. Wenn `lint:musterloesung` als Skript existiert, auch dieses laufen lassen.

- [ ] **Step 5: Commit Bilanz-Notiz (optional, nur wenn Cleanup nötig war)**

```bash
git add -A
git commit -m "Bundle T.a Phase 5: Cleanup unused imports + Bilanz-Verifikation"
```

---

## Task 6: Browser-E2E auf staging mit echten Logins

**Memory-Lehre:** "Echte Logins statt Demo" — Demo-Modus reicht NICHT für Bundle-T-Browser-E2E. SuS+LP-Logins nötig. Service-Worker-Cache vor E2E flushen (Lehre `feedback_service_worker_cache_wire_bundle` als Routine, auch ohne Wire-Vertrag-Touch).

- [ ] **Step 1: Push Branch**

```bash
git push -u origin feature/bundle-t-a-durchfuehren-dashboard
```

- [ ] **Step 2: Staging-Deploy (falls staging-Pages-Workflow aktiv)**

Branch wird via GitHub-Action auf staging deployed. Alternativ: User triggert manuell.

- [ ] **Step 3: Service-Worker flushen + Browser-Test**

Im Browser-Tab auf staging-URL:
1. DevTools → Application → Service Workers → Unregister
2. DevTools → Application → Cache Storage → "Clear storage"
3. Hard-Reload (Cmd+Shift+R)

- [ ] **Step 4: Test-Pfade durchspielen mit echtem LP-Login**

| Pfad | Erwartung |
|---|---|
| 1. LP-Login → Pruefung anlegen → DurchfuehrenDashboard öffnen | Tab-Bar erscheint, Vorbereitungs-Phase aktiv, Daten laden |
| 2. Auto-Refresh-Toggle (Live-Button) klicken | Refresh-Animation an/aus |
| 3. Manuell Refresh-Button (↻) klicken | Daten reload |
| 4. Teilnehmer hinzufügen → Lobby-Phase erreichen | Tab "Lobby" aktiv, 5s-Polling |
| 5. Pruefung freischalten → Live-Phase erreichen | Tab "Live" aktiv, 5s-Polling, Timer läuft |
| 6. SuS (anderes Browser-Profil) anmelden + Frage beantworten | LP sieht Heartbeat, Beantwortet-Counter steigt |
| 7. Pruefung beenden | Tab "Auswertung" Auto-Forward, Ergebnis-Übersicht offen, KorrekturDashboard sichtbar, preWarmKorrektur-Trigger |
| 8. URL-Parameter `?tab=auswertung` direkt aufrufen | Auswertung sofort sichtbar |
| 9. URL-Parameter `?tab=ergebnisse` (alter Name) | Auf 'auswertung' normalisiert |
| 10. "Neue Durchführung" Button | Reset auf Vorbereitung, Daten leer, durchfuehrungId neu |
| 11. Verbindungsfehler simulieren (Network Throttle) | Banner erscheint nach 3 Misses |

Alle 11 Pfade müssen bestehen.

- [ ] **Step 5: Console-Errors-Check**

DevTools Console: 0 Errors während gesamtem Test-Pfad-Durchlauf.

- [ ] **Step 6: Network-Requests-Stichprobe**

Verifizieren dass:
- `ladeMonitoring` 5s-Polling in Live-Phase
- `ladeMonitoring` 15s-Polling in Vorbereitung
- `ladeEinzelConfig` 5s-Polling in Lobby, 30s in Vorbereitung
- `ladeNachrichten` 20s
- `preWarmKorrektur` bei Phase=beendet UND bei Tab-Wechsel auf auswertung

---

## Task 7: Code-Review-Subagent

- [ ] **Step 1: Reviewer dispatchen**

Prompt-Template (general-purpose Subagent):

```
You are a code-quality reviewer for a refactor task.

Bundle: T.a — DurchfuehrenDashboard Hook-Extraktion
Branch: feature/bundle-t-a-durchfuehren-dashboard
Spec: docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md
Plan: docs/superpowers/plans/2026-05-06-bundle-t-a-durchfuehren-dashboard.md
Repo-Root: /Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/

Verify:
1. **Verhaltens-Identität**: useEffect-Reihenfolge im Hook entspricht der Original-Reihenfolge im File. Polling-Intervalle (5s/15s/20s/30s) korrekt. preWarmKorrektur-Trigger an allen 3 Stellen (Initial-Load wenn beendet+freigeschaltet, Phase=beendet, Tab=auswertung).
2. **Hook-Konvention**: Naming `useDurchfuehren*`-Prefix, Pfad `src/hooks/`, kein useMonitoringData (Naming-Kollision).
3. **Test-Hybrid**: Pure-Util `mappeMonitoringResult` hat Vitest-Tests. Hooks selbst nicht getestet (Browser-E2E reicht laut Master-Spec 4.2).
4. **Bilanz**: DurchfuehrenDashboard.tsx <520 Z. (Ziel <500). 4 neue Files (3 Hooks + 1 Util) + Test-File.
5. **Imports**: Keine unused-Imports im Haupt-File nach Cut. eingebauteVersionen-Konstante nur noch im Hook B, nicht mehr im Body.
6. **Lehren-Compliance**:
   - Memo-deps für Trigger vs Compute (Master-Spec Risiko-Strategie): hook-internal useEffects haben korrekte deps?
   - phase-useState + Sync-Effect ist die korrekte Lösung gegen Hook-Input-Zirkularität?

Output: APPROVED | CHANGES REQUESTED, mit konkreten Fundstellen.
```

- [ ] **Step 2: Falls CHANGES REQUESTED: Fixe + erneut Review**

Maximum 3 Iterationen, dann Surface zum User.

- [ ] **Step 3: Falls APPROVED: weiter zum Merge**

---

## Task 8: Merge auf main + HANDOFF + Memory

- [ ] **Step 1: HANDOFF.md aktualisieren**

`ExamLab/HANDOFF.md` neue Sektion ganz oben einfügen (vor Bundle-T-Master-Spec-Eintrag):

```markdown
### Bundle T.a — DurchfuehrenDashboard Hook-Extraktion ✅ MERGED (2026-05-06)

Branch `feature/bundle-t-a-durchfuehren-dashboard`. Erstes Sub-Bundle aus Bundle T (Master-Spec Sektion 3 + 6.1). Mittel-Risiko-File-Split per Hook-Extraktion.

**Was geliefert:**
- 3 neue Hooks: `useDurchfuehrenMonitoring` (Daten-Polling+Auto-Refresh+AbortController+Error-Banner), `useDurchfuehrenLoad` (Once-Load+Demo+Periodic-Config), `useDurchfuehrenPhasenTab` (Phase→Tab Auto-Forward+URL-Sync+preWarmKorrektur-Trigger)
- 1 neue Pure-Util: `durchfuehrenMonitoringMapper.ts` (mit 10 Vitest-Tests)
- DurchfuehrenDashboard.tsx: 677 → ~500 Z. (gemessen exakter Wert)
- Naming-Architektur-Lehre: Audit-Vorschlag `useMonitoringData` vermieden wegen Kollision mit existierendem `usePruefungsMonitoring` (SuS-Auto-Save Hook in völlig anderem Bereich)
- Architektur-Lehre: phase-useState + Sync-Effect statt per-render-Computation, um Hook-Input-Zirkularität (PhasenTab/Load/Monitoring brauchen alle phase, phase kommt aus config+daten = Output von Load+Monitoring) zu lösen.

**Verifikation:**
- vitest 1263 passes (1253 Baseline + 10 Mapper-Tests), drift=0 ✓
- tsc + build clean ✓
- lint:as-any + lint:no-alert clean ✓
- Browser-E2E auf staging mit echten LP+SuS-Logins, 11/11 Test-Pfade ✓
- 0 Console-Errors ✓
- Network-Polling-Intervalle verifiziert (5s/15s/20s/30s) ✓
- preWarmKorrektur-Trigger an allen 3 Stellen verifiziert ✓
- Code-Reviewer-Subagent: APPROVED ✓

**Spec/Plan:**
- Spec: `docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md` (Master)
- Plan: `docs/superpowers/plans/2026-05-06-bundle-t-a-durchfuehren-dashboard.md`

**Nächster Schritt:** Bundle T.b (TKontoFrage, mittel-Risiko, ~763 Z. → `<KontoEingabeForm>` + `tkontoUtils.ts`)
```

- [ ] **Step 2: Commit HANDOFF**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle T.a: HANDOFF-Eintrag"
```

- [ ] **Step 3: Push + Merge**

```bash
git push origin feature/bundle-t-a-durchfuehren-dashboard
git checkout main
git pull origin main
git merge --no-ff feature/bundle-t-a-durchfuehren-dashboard -m "Merge Bundle T.a: DurchfuehrenDashboard Hook-Extraktion"
git push origin main
```

- [ ] **Step 4: Branch löschen lokal+remote**

```bash
git branch -d feature/bundle-t-a-durchfuehren-dashboard
git push origin --delete feature/bundle-t-a-durchfuehren-dashboard
```

- [ ] **Step 5: Memory-Update**

Erstelle `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_t_a_durchfuehren_dashboard.md` mit Bilanz, Lehren (Naming-Vermeidung `useMonitoringData`, phase-useState-Pattern), Spec/Plan-Pfad, Merge-Hash.

Update `MEMORY.md` Index mit neuer Zeile vor dem Bundle-T-Master-Spec-Eintrag.

- [ ] **Step 6: TodoWrite abschliessen**

Markiere Task 8 (Merge) als completed.

---

## Erfolgskriterien (Definition of Done — Bundle-S/L-Standard)

- [ ] vitest grün (drift=0 oder mit dokumentierten neuen Hybrid-Tests)
- [ ] tsc clean (`npx tsc -b`)
- [ ] lint:as-any clean
- [ ] lint:no-alert clean
- [ ] Browser-E2E auf staging mit echten Logins (LP + SuS), 11/11 Test-Pfade ✓
- [ ] Service-Worker-Cache-Flush vor E2E
- [ ] Code-Reviewer-Subagent APPROVED
- [ ] DurchfuehrenDashboard.tsx <520 Z. (Ziel <500)
- [ ] HANDOFF + Memory aktualisiert
- [ ] Branch lokal+remote gelöscht
- [ ] Master-Memory-Index aktualisiert

---

## Bekannte Risiken & Mitigation

| Risiko | Mitigation im Plan |
|---|---|
| **Hook-Input-Zirkularität** (phase aus config+daten, beide aus Hooks) | phase als useState + Sync-Effect (Task 4 Step 3) |
| **useEffect-Reihenfolge bricht** (Inter-Deps) | Task 1-4 sind sequenziell, jeder Schritt mit tsc+vitest grün vor Commit |
| **Memo-Deps Drift** (Trigger vs Compute, Lehre Bundle 3) | Hook-Internals haben useEffect-Deps, kein useMemo-als-Trigger-Pattern in T.a |
| **`_nachrichten` Dead-Code** | NICHT in T.a-Scope adressiert. Spawn-Task post-merge falls User entscheidet. |
| **Polling-Intervall-Drift** | Browser-E2E Task 6 Step 6 verifiziert via Network-Stichprobe |
| **preWarmKorrektur-Trigger fehlen** | 3 Stellen explizit getestet (Task 6 Pfad 1+7+8) |
| **Service-Worker liefert alten Code** | Task 6 Step 3: Unregister + Clear Storage + Hard-Reload Routine |
| **Subagent-Branch-Drift** | Branch-Setup explizit in Task 0 + Push vor Subagent-Dispatch (Lehre `feedback_subagent_shell_context`) |

---

## Out of Scope (für T.a, kommen später)

- `_nachrichten` Dead-Code-Cleanup (Spawn-Task)
- `useDurchfuehrenNachrichten` Extraktion (YAGNI bei nicht-gelesenem State)
- `usePhasenTimer` Extraktion (Timer ist 7 Z., nicht extrakt-würdig)
- `useSusAnzahlPersist` für E4 localStorage (4 Z., trivial)
- KorrekturDashboard-Splits (eigenes Bundle T+ falls je gewünscht)
- AktivPhase / LobbyPhase / VorbereitungPhase-Splits (Sub-Komponenten, eigenes Bundle)

Diese Punkte sind durch Master-Spec out-of-scope (Sektion 3) oder durch YAGNI/Pragmatic im Pre-Audit gelistet.
