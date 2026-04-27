# Bundle G.f — LP-Startseite Skeleton-Pattern — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Header und Tabs der LP-Startseite werden sofort sichtbar (~100ms). Sections (Cards / Übungen / Tracker) zeigen Skeleton bis ihre Daten da sind. Behebt drei UX-Schmerzen: Tracker-Tab zeigt während Lade „Keine Tracker-Daten verfügbar" (wirkt leer statt lädt), Übungen-Tab zeigt Text-Label statt Skeleton, globaler Skeleton ist nicht layout-akkurat.

**Architecture:** Drei neue Skeleton-Komponenten (`LPCardsSkeleton`, `LPTrackerSkeleton`, `LPUebungenSkeleton`) ersetzen den globalen Early-Return durch Pro-Section-Rendering. Neuer Lade-State `trackerLadeStatus` modelliert den Tracker-Lade-Pfad explizit. `localStorage`-Helper persistiert die letzte Cards-/Übungs-Anzahl, sodass das Skeleton beim nächsten Login layout-akkurat ist. `LPSkeleton.tsx` bleibt als globaler Loading-Fallback in `Favoriten.tsx` erhalten — wird nicht entfernt.

**Tech Stack:** React 19.2 + TypeScript + Vitest 4 + Tailwind v4. Keine neuen Dependencies.

**Spec:** `docs/superpowers/specs/2026-04-27-bundle-g-f-lp-startseite-skeleton-design.md`

---

## File Structure

| Aktion | Datei | Verantwortung |
|---|---|---|
| Erstellen | `src/components/lp/skeletons/LPCardsSkeleton.tsx` (~40 Z.) | Karten-Grid-Skeleton, Layout-akkurat zu `PruefungsKarte` |
| Erstellen | `src/components/lp/skeletons/LPTrackerSkeleton.tsx` (~40 Z.) | Zusammenfassung-Box + 2 Akkordeon-Sektionen-Skeleton |
| Erstellen | `src/components/lp/skeletons/LPUebungenSkeleton.tsx` (~30 Z.) | Karten-Grid-Skeleton (gleiches Layout wie LPCardsSkeleton — Übungen rendern dieselben Karten, eigener localStorage-Key) |
| Erstellen | `src/utils/skeletonAnzahl.ts` (~25 Z.) | `leseGespeicherteAnzahl(key, fallback, max?)` mit try/catch + Sanity-Cap |
| Erstellen | `src/tests/skeletonAnzahl.test.ts` (~50 Z.) | Tests für localStorage-Helper |
| Erstellen | `src/tests/LPCardsSkeleton.test.tsx` (~40 Z.) | Render-Tests mit unterschiedlichen localStorage-Werten |
| Erstellen | `src/tests/LPTrackerSkeleton.test.tsx` (~30 Z.) | Render-Test (2 Sektionen, animate-pulse) |
| Erstellen | `src/tests/LPUebungenSkeleton.test.tsx` (~30 Z.) | Render-Test analog Cards |
| Modifizieren | `src/components/lp/LPStartseite.tsx` (1007→~1000 Z.) | `ladeStatus`→`configsLadeStatus` rename, neuer `trackerLadeStatus`-State, globaler Early-Return entfernt, Pro-Section-Skeleton-Pattern, localStorage-Persist |
| Modifizieren | `src/tests/LPStartseite.test.tsx` falls existent, sonst erstellen (~80 Z.) | 5 Cases: Skeleton-Render, echte-Komponenten-Render, Tracker-Fehler-Pfad |
| Unverändert | `src/components/lp/LPSkeleton.tsx` | Bleibt als Fallback für `Favoriten.tsx` (Z. 10) |

---

## Vorbedingungen

- Branch ist `main`, sauber. **Vor Task 1 wechseln auf einen neuen Worktree-Branch `feature/bundle-g-f-skeleton` via @superpowers:using-git-worktrees.**
- LP-Login-Credentials für preview-E2E.
- Aktuell: 743/772 Vitest-Baseline grün.

> **Wichtige Spec-Korrektur:** Die Spec sagt „Übungen-Tab zeigt formative Configs als kompaktere Liste, eigener Skeleton matched dieses Layout." Tatsächlicher Code (Recon 2026-04-27): Übungen-Tab rendert dieselbe `<PruefungsKarte />`-Grid wie Prüfungs-Tab (LPStartseite Z. 598-600). `LPUebungenSkeleton` ist deshalb identisch zu `LPCardsSkeleton`, lediglich mit eigenem localStorage-Key. Plan implementiert beide Komponenten getrennt (Klarheit, eigenständige Anzahlen), aber das Layout ist gleich.

---

## Phase 1 — localStorage-Helper (TDD)

### Task 1: `leseGespeicherteAnzahl`-Helper

**Files:**
- Create: `ExamLab/src/tests/skeletonAnzahl.test.ts`
- Create: `ExamLab/src/utils/skeletonAnzahl.ts`

- [ ] **Step 1: Failing Test**

```ts
// src/tests/skeletonAnzahl.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { leseGespeicherteAnzahl, schreibeGespeicherteAnzahl } from '../utils/skeletonAnzahl'

describe('leseGespeicherteAnzahl', () => {
  beforeEach(() => localStorage.clear())

  it('liefert Fallback wenn Key nicht existiert', () => {
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(6)
  })

  it('liefert gespeicherten Wert', () => {
    localStorage.setItem('foo', '10')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(10)
  })

  it('clamped an Max (Default 12)', () => {
    localStorage.setItem('foo', '99')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(12)
  })

  it('clamped an Min 0', () => {
    localStorage.setItem('foo', '-5')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(0)
  })

  it('garbled value -> Fallback', () => {
    localStorage.setItem('foo', 'abc')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(6)
  })

  it('Custom Max wird respektiert', () => {
    localStorage.setItem('foo', '99')
    expect(leseGespeicherteAnzahl('foo', 6, 20)).toBe(20)
  })
})

describe('schreibeGespeicherteAnzahl', () => {
  beforeEach(() => localStorage.clear())

  it('schreibt Wert als String', () => {
    schreibeGespeicherteAnzahl('foo', 8)
    expect(localStorage.getItem('foo')).toBe('8')
  })

  it('schluckt Errors silent (z.B. Quota)', () => {
    // simulate via mocked setItem? Falls aufwändig: nur per try/catch-Audit verifizieren
    expect(() => schreibeGespeicherteAnzahl('foo', 8)).not.toThrow()
  })
})
```

- [ ] **Step 2: Test FAIL — Modul fehlt**

```bash
cd ExamLab && npx vitest run src/tests/skeletonAnzahl.test.ts
```

- [ ] **Step 3: Implementation**

```ts
// src/utils/skeletonAnzahl.ts
export function leseGespeicherteAnzahl(key: string, fallback: number, max: number = 12): number {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    const n = parseInt(v, 10)
    if (!Number.isFinite(n)) return fallback
    if (n < 0) return 0
    if (n > max) return max
    return n
  } catch {
    return fallback
  }
}

export function schreibeGespeicherteAnzahl(key: string, wert: number): void {
  try {
    localStorage.setItem(key, String(wert))
  } catch {
    // localStorage nicht verfügbar (Privacy-Modus) oder Quota voll — silent
  }
}
```

- [ ] **Step 4: Test PASS**

```bash
cd ExamLab && npx vitest run src/tests/skeletonAnzahl.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/skeletonAnzahl.ts ExamLab/src/tests/skeletonAnzahl.test.ts
git commit -m "G.f: leseGespeicherteAnzahl + schreibeGespeicherteAnzahl mit Sanity-Caps + Tests"
```

---

## Phase 2 — Skeleton-Komponenten (TDD)

### Task 2: LPCardsSkeleton

**Files:**
- Create: `ExamLab/src/tests/LPCardsSkeleton.test.tsx`
- Create: `ExamLab/src/components/lp/skeletons/LPCardsSkeleton.tsx`

- [ ] **Step 1: Failing Test**

```tsx
// src/tests/LPCardsSkeleton.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import LPCardsSkeleton from '../components/lp/skeletons/LPCardsSkeleton'

describe('LPCardsSkeleton', () => {
  beforeEach(() => localStorage.clear())

  it('rendert 6 Cards als Default ohne localStorage', () => {
    const { container } = render(<LPCardsSkeleton />)
    const cards = container.querySelectorAll('[data-testid="lp-card-skeleton"]')
    expect(cards.length).toBe(6)
  })

  it('rendert gespeicherte Anzahl 8', () => {
    localStorage.setItem('examlab-lp-letzte-summative-anzahl', '8')
    const { container } = render(<LPCardsSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-card-skeleton"]').length).toBe(8)
  })

  it('clamped Anzahl 99 auf 12 (Max)', () => {
    localStorage.setItem('examlab-lp-letzte-summative-anzahl', '99')
    const { container } = render(<LPCardsSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-card-skeleton"]').length).toBe(12)
  })

  it('hat animate-pulse-Klasse', () => {
    const { container } = render(<LPCardsSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Test FAIL**

- [ ] **Step 3: Implementation**

```tsx
// src/components/lp/skeletons/LPCardsSkeleton.tsx
import { leseGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'

const STORAGE_KEY = 'examlab-lp-letzte-summative-anzahl'

export default function LPCardsSkeleton() {
  const anzahl = leseGespeicherteAnzahl(STORAGE_KEY, 6, 12)
  const rendered = Math.max(anzahl, 3)  // visuelle Konsistenz: nie weniger als 3

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rendered }, (_, i) => (
        <div
          key={i}
          data-testid="lp-card-skeleton"
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700"
        >
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
          <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-2" />
          <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Test PASS**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/skeletons/LPCardsSkeleton.tsx ExamLab/src/tests/LPCardsSkeleton.test.tsx
git commit -m "G.f: LPCardsSkeleton mit localStorage-basierter Anzahl + Tests"
```

---

### Task 3: LPUebungenSkeleton

**Files:**
- Create: `ExamLab/src/tests/LPUebungenSkeleton.test.tsx`
- Create: `ExamLab/src/components/lp/skeletons/LPUebungenSkeleton.tsx`

- [ ] **Step 1: Failing Test**

```tsx
// src/tests/LPUebungenSkeleton.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import LPUebungenSkeleton from '../components/lp/skeletons/LPUebungenSkeleton'

describe('LPUebungenSkeleton', () => {
  beforeEach(() => localStorage.clear())

  it('rendert 4 Cards als Default', () => {
    const { container } = render(<LPUebungenSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-ueb-skeleton"]').length).toBe(4)
  })

  it('rendert gespeicherte Anzahl 5', () => {
    localStorage.setItem('examlab-lp-letzte-formative-anzahl', '5')
    const { container } = render(<LPUebungenSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-ueb-skeleton"]').length).toBe(5)
  })
})
```

- [ ] **Step 2: Test FAIL**

- [ ] **Step 3: Implementation (analog LPCardsSkeleton, eigener Storage-Key, Default 4 Cards)**

```tsx
// src/components/lp/skeletons/LPUebungenSkeleton.tsx
import { leseGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'

const STORAGE_KEY = 'examlab-lp-letzte-formative-anzahl'

export default function LPUebungenSkeleton() {
  const anzahl = leseGespeicherteAnzahl(STORAGE_KEY, 4, 12)
  const rendered = Math.max(anzahl, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rendered }, (_, i) => (
        <div
          key={i}
          data-testid="lp-ueb-skeleton"
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700"
        >
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
          <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-2" />
          <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Test PASS**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/skeletons/LPUebungenSkeleton.tsx ExamLab/src/tests/LPUebungenSkeleton.test.tsx
git commit -m "G.f: LPUebungenSkeleton mit eigenem localStorage-Key + Tests"
```

---

### Task 4: LPTrackerSkeleton

**Files:**
- Create: `ExamLab/src/tests/LPTrackerSkeleton.test.tsx`
- Create: `ExamLab/src/components/lp/skeletons/LPTrackerSkeleton.tsx`

Layout-Match: Zusammenfassung-Box + 2 Akkordeon-Sektionen (FehlendeSuS + Noten-Stand) gemäss `TrackerSection.tsx` Z. 14-78.

- [ ] **Step 1: Failing Test**

```tsx
// src/tests/LPTrackerSkeleton.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LPTrackerSkeleton from '../components/lp/skeletons/LPTrackerSkeleton'

describe('LPTrackerSkeleton', () => {
  it('rendert Zusammenfassungs-Box + 2 Akkordeon-Sektionen', () => {
    const { container } = render(<LPTrackerSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-tracker-section"]').length).toBe(2)
    expect(container.querySelector('[data-testid="lp-tracker-summary"]')).toBeTruthy()
  })

  it('hat animate-pulse Elemente', () => {
    const { container } = render(<LPTrackerSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Test FAIL**

- [ ] **Step 3: Implementation**

```tsx
// src/components/lp/skeletons/LPTrackerSkeleton.tsx
export default function LPTrackerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Zusammenfassung-Box mit 5 Kennzahl-Tiles */}
      <div
        data-testid="lp-tracker-summary"
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
      >
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 2 Akkordeon-Sektionen (FehlendeSuS + Noten-Stand) */}
      {['fehlende', 'noten'].map(key => (
        <div
          key={key}
          data-testid="lp-tracker-section"
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-5 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Test PASS**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/skeletons/LPTrackerSkeleton.tsx ExamLab/src/tests/LPTrackerSkeleton.test.tsx
git commit -m "G.f: LPTrackerSkeleton (Summary + 2 Akkordeon-Sektionen) + Tests"
```

---

## Phase 3 — LPStartseite-Refactor

### Task 5: ladeStatus → configsLadeStatus rename + trackerLadeStatus-State

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

- [ ] **Step 1: ladeStatus → configsLadeStatus rename**

In `LPStartseite.tsx` alle Vorkommen von `ladeStatus` → `configsLadeStatus` und `setLadeStatus` → `setConfigsLadeStatus` umbenennen. Stellen aus Recon-Report:
- Z. 127: Deklaration
- Z. 302, 362, 424, 428, 432: Setter-Aufrufer
- Z. 446: Early-Return-Bedingung (wird in **Task 8** ohnehin entfernt — vorerst nur Rename)
- Weitere Lese-Aufrufer: Z. 488 (`listenTab === 'pruefungen' && ladeStatus === 'fertig'`), Z. 628 (`ladeStatus === 'fertig' && listenTab === 'tracker'`), und alle weiteren Stellen via `grep -n "ladeStatus" ExamLab/src/components/lp/LPStartseite.tsx`.

> **Vorsicht:** `ladeStatus` ist ein gewöhnlicher Name — andere Variablen mit ähnlichen Namen können existieren. **Vor `replace_all` immer `grep -n` zur Verifikation.**

- [ ] **Step 2: trackerLadeStatus-State hinzufügen**

Nach der `configsLadeStatus`-Deklaration (Z. ~127):

```tsx
const [trackerLadeStatus, setTrackerLadeStatus] = useState<'laden' | 'fertig'>('laden')
```

- [ ] **Step 3: tsc + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Erwartung: clean.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "G.f: ladeStatus -> configsLadeStatus rename + trackerLadeStatus-State"
```

---

### Task 6: trackerLadeStatus in Lade-Pfaden setzen

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

- [ ] **Step 1: Initial-Load (Z. 365-367 erweitern)**

Den existierenden Block:
```tsx
apiService.ladeTrackerDaten(user.email).then(trackerResult => {
  if (trackerResult) setTrackerDaten(trackerResult)
}).catch(err => console.warn('[LP] Tracker-Laden fehlgeschlagen:', err))
```
ersetzen durch:
```tsx
apiService.ladeTrackerDaten(user.email)
  .then(trackerResult => {
    if (trackerResult) setTrackerDaten(trackerResult)
    setTrackerLadeStatus('fertig')
  })
  .catch(err => {
    console.warn('[LP] Tracker-Laden fehlgeschlagen:', err)
    setTrackerLadeStatus('fertig')
  })
```

- [ ] **Step 2: Demo-Modus (Z. 298-304 erweitern)**

Im Demo-Modus-Block (`if (istDemoModus || !apiService.istKonfiguriert())`) nach `setTrackerDaten(erstelleDemoTrackerDaten())`:
```tsx
setTrackerLadeStatus('fertig')
```

- [ ] **Step 3: handleZurueck (Z. 421-434 erweitern)**

In der Funktion nach `setLadeStatus('laden')` analog `setTrackerLadeStatus('laden')`. Falls `handleZurueck` neu Tracker neu lädt: nach `apiService.ladeTrackerDaten(...).then(...)` analog `setTrackerLadeStatus('fertig')`.

> **Hinweis:** Wenn `handleZurueck` den Tracker NICHT neu lädt, muss `setTrackerLadeStatus('laden')` weggelassen werden — sonst hängt es ewig. Plan-Implementer prüft die exakte handleZurueck-Logik und entscheidet kontextuell.

- [ ] **Step 4: tsc + Tests**

- [ ] **Step 5: Commit**

```bash
git commit -am "G.f: trackerLadeStatus in Initial-Load + Demo + handleZurueck setzen"
```

---

### Task 7: localStorage-Persist nach erfolgreichem Configs-Lade

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

- [ ] **Step 1: Import des Helpers**

Top der Datei:
```tsx
import { schreibeGespeicherteAnzahl } from '../../utils/skeletonAnzahl'
```

- [ ] **Step 2: Persist nach Initial-Load (Z. 330-362-Bereich)**

Nach `setConfigs(...)` und `setConfigsLadeStatus('fertig')` im Erfolgsfall (Recon: Z. 362):

```tsx
const summativeAnzahl = configResult.configs.filter(c => c.kategorie === 'summativ').length
const formativeAnzahl = configResult.configs.filter(c => c.kategorie === 'formativ').length
schreibeGespeicherteAnzahl('examlab-lp-letzte-summative-anzahl', summativeAnzahl)
schreibeGespeicherteAnzahl('examlab-lp-letzte-formative-anzahl', formativeAnzahl)
```

> **Wichtig:** Plan-Implementer verifiziert vorher die Datenstruktur von `configResult` (`apiService.ladeAlleConfigs`-Return-Type). Falls `summativeConfigs` und `formativeConfigs` bereits separat im Store/State gehalten werden, einfacher: deren `length` direkt persistieren.

- [ ] **Step 3: tsc + Tests**

- [ ] **Step 4: Commit**

```bash
git commit -am "G.f: localStorage-Persist Cards-/Übungs-Anzahl nach Configs-Lade"
```

---

### Task 8: Globaler Early-Return entfernen + Pro-Section-Skeleton-Render

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

Das ist der zentrale Refactor. Wir machen ihn in einer Task, da die Stellen miteinander zusammenhängen (Header-Rendering, Tab-Inhalte, Tracker-Render). Wenn Subagent ihn zu groß findet, in Sub-Schritte zerlegen (siehe Step-Breakdown unten).

- [ ] **Step 1: Globaler Early-Return entfernen (Z. 446)**

Diese Zeile löschen:
```tsx
if (configsLadeStatus !== 'fertig' && ansicht !== 'composer') return <LPSkeleton />
```

> **Achtung:** dadurch rendert das Layout immer. **Vorher** prüfen, dass Header/Tabs nicht von `configsLadeStatus !== 'fertig'`-Zustand auf `null` configs/ähnliches crashen. Falls ja: Defensive Guards in den Konsumenten ergänzen.

- [ ] **Step 2: Prüfungs-Tab — Skeleton bei configsLadeStatus='laden' (Z. ~656-830)**

Suche das Tab-Render-Pattern für `listenTab === 'pruefungen'`. Aktuell: `{listenTab === 'pruefungen' && ladeStatus === 'fertig' && summativeConfigs.length > 0 && (...)}`.

Refactor zu:
```tsx
{listenTab === 'pruefungen' && (
  configsLadeStatus === 'laden' ? (
    <LPCardsSkeleton />
  ) : summativeConfigs.length === 0 ? (
    <EmptyStatePruefungen />  // bestehender inline-EmptyState (Z. 639-653)
  ) : (
    <PruefungenGrid summativeConfigs={summativeConfigs} ... />
  )
)}
```

> Falls `EmptyStatePruefungen` und `PruefungenGrid` aktuell inline sind: zwei Optionen:
> (a) Inline lassen, nur die Bedingung umstrukturieren
> (b) Inline-Block in eine lokale Konstante extrahieren
> Plan-Implementer wählt die einfachere Variante (a) ausser wenn Lesbarkeit leidet.

- [ ] **Step 3: Übungen-Tab — Skeleton bei configsLadeStatus='laden' (Z. ~488-501)**

Aktuell: `{listenTab === 'uebungen' && ladeStatus === 'laden' && <p>Übungen werden geladen...</p>}` (Z. 488-489).

Refactor zu:
```tsx
{listenTab === 'uebungen' && (
  configsLadeStatus === 'laden' ? (
    <LPUebungenSkeleton />
  ) : formativeConfigs.length === 0 ? (
    <EmptyStateUebungen />
  ) : (
    <UebungenGrid formativeConfigs={formativeConfigs} ... />
  )
)}
```

Den alten Text-Label-Block (Z. 489) entfernen.

- [ ] **Step 4: Tracker-Tab — Skeleton bei trackerLadeStatus='laden' (Z. ~628-636)**

Aktuell: `{listenTab === 'tracker' && (...)}` mit Bedingung `trackerDaten ? <TrackerSection /> : <p>Keine Tracker-Daten verfügbar.</p>`.

Refactor zu:
```tsx
{listenTab === 'tracker' && (
  trackerLadeStatus === 'laden' ? (
    <LPTrackerSkeleton />
  ) : trackerDaten ? (
    <TrackerSection trackerDaten={trackerDaten} ... />
  ) : (
    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
      Keine Tracker-Daten verfügbar.
    </p>
  )
)}
```

- [ ] **Step 5: Backend-Fehler-Pfad sicherstellen**

Erst verifizieren via:
```bash
grep -n "setLadeStatus\|setConfigsLadeStatus\|setBackendFehler" ExamLab/src/components/lp/LPStartseite.tsx
```
Im Output den catch-Block von `apiService.ladeAlleConfigs` (Recon-Bereich Z. 330-360) lokalisieren. **Im Chat dokumentieren**, ob `setConfigsLadeStatus('fertig')` dort schon (durch das Task-5-Rename) gesetzt wird. Falls nein: ergänzen — sonst bleibt Skeleton ewig sichtbar bei Backend-Fehler.

- [ ] **Step 6: Imports am Top der Datei**

```tsx
import LPCardsSkeleton from './skeletons/LPCardsSkeleton'
import LPUebungenSkeleton from './skeletons/LPUebungenSkeleton'
import LPTrackerSkeleton from './skeletons/LPTrackerSkeleton'
```

- [ ] **Step 7: tsc + Tests + Build**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```
Erwartung: alles grün.

- [ ] **Step 8: Commit**

```bash
git commit -am "G.f: globalen LPSkeleton-Early-Return entfernt, Pro-Section-Skeleton-Pattern eingeführt"
```

---

## Phase 4 — LPStartseite-Tests

### Task 9: LPStartseite-Komponenten-Tests

**Files:**
- Create or Modify: `ExamLab/src/tests/LPStartseite.test.tsx`

Falls Datei nicht existiert, neu erstellen. Test-Setup muss `apiService` mocken — Pattern aus existierenden LP-Tests übernehmen.

- [ ] **Step 1: Failing Tests**

5 Cases:
1. Bei `configsLadeStatus === 'laden'` und `listenTab === 'pruefungen'` → `LPCardsSkeleton` im DOM
2. Bei `configsLadeStatus === 'laden'` und `listenTab === 'uebungen'` → `LPUebungenSkeleton` im DOM
3. Bei `trackerLadeStatus === 'laden'` und `listenTab === 'tracker'` → `LPTrackerSkeleton` im DOM
4. Bei beiden `'fertig'` und Daten da → echte Komponenten gerendert (kein Skeleton-DOM-Match)
5. Bei `trackerLadeStatus === 'fertig'` && `!trackerDaten` → "Keine Tracker-Daten verfügbar"-Label sichtbar

> **Pattern:** Tests können entweder die volle Komponente mit Mock-State rendern oder einzelne Teil-Render-Funktionen aufrufen (falls vorhanden). Plan-Implementer entscheidet kontextuell — falls LPStartseite zu monolithisch zum Test-Setup ist, kann eine kleine Refactor-Extraktion helfen, **aber nur wenn nötig**.

- [ ] **Step 2: Tests FAIL → Impl ist schon korrekt aus Task 8 → PASS**

Wenn Tests den Code richtig prüfen (durch Mocks), sollten sie nach Task 8 passieren.

- [ ] **Step 3: Komplette Test-Suite + tsc + build**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```
Erwartung: 743 Baseline + ~12 neue (~755 vitest grün).

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/tests/LPStartseite.test.tsx
git commit -m "G.f: LPStartseite-Skeleton-Tests (5 Cases)"
```

---

## Phase 5 — LPSkeleton-Audit

### Task 10: LPSkeleton-Verwendung verifizieren

**Files:** keine

- [ ] **Step 1: Grep auf LPSkeleton-Importe**

```bash
cd ExamLab && grep -rn "import.*LPSkeleton" src/
```
Recon-Report sagt: `Favoriten.tsx` Z. 10 + `LPStartseite.tsx` Z. 18.

- [ ] **Step 2: Falls LPStartseite-Import nach Task 8 ungenutzt**

Wenn `LPSkeleton` nicht mehr in LPStartseite verwendet wird, Import entfernen. tsc warnt darauf.

- [ ] **Step 3: LPSkeleton bleibt erhalten**

Da `Favoriten.tsx` ihn als Loading-Fallback nutzt, **nicht löschen**. Spec lässt explizit Spielraum, hier ist die Antwort: behalten.

- [ ] **Step 4: Commit (falls Code-Änderung war)**

```bash
git commit -am "G.f: LPSkeleton-Import in LPStartseite entfernt (ungenutzt)"
```

---

## Phase 6 — Browser-E2E

### Task 11: E2E mit echten LP-Logins (preview)

**Files:** keine

- [ ] **Step 1: Branch auf preview pushen**

```bash
git push origin feature/bundle-g-f-skeleton
git push origin feature/bundle-g-f-skeleton:preview --force-with-lease
```
> Vor Force-Push: `git log preview ^feature/bundle-g-f-skeleton` prüfen (Memory-Regel).

- [ ] **Step 2: Test-Plan schreiben (gemäss `regression-prevention.md` Phase 3)**

Test-Plan im Chat:

| # | Pfad | Erwartung | Mess-Punkt |
|---|---|---|---|
| 1 | LP-Login → LPStartseite | Header + Tabs sichtbar ≤100ms; LPCardsSkeleton sichtbar | Visuell + DevTools Performance |
| 2 | Während Configs laden → Tab-Wechsel zu „Tracker" | LPTrackerSkeleton sichtbar (statt „Keine Daten") | Visuell |
| 3 | Configs geladen → Wechsel zu „Übungen" | LPUebungenSkeleton bis formative Configs da | Visuell |
| 4 | Refresh-Button | Skeleton kurz sichtbar bis Daten neu da | Visuell |
| 5 | Light-Mode + Dark-Mode | Skeleton in beiden Themes lesbar | Visuell |
| 6 | Re-Login → DevTools localStorage prüfen | `examlab-lp-letzte-summative-anzahl` und `examlab-lp-letzte-formative-anzahl` gesetzt | DevTools Application |
| 7 | Re-Login mit grösserer Konfig-Anzahl | Cards-Skeleton zeigt mehr Cards | Visuell + DevTools |
| 8 | Tracker-Lade-Fehler simuliert (z.B. Backend-Endpoint blockieren) | Nach Promise-Resolve „Keine Tracker-Daten verfügbar" sichtbar | Network-Block + Visuell |

- [ ] **Step 3: User testet (mit Tab-Gruppe + echten Logins)**

- [ ] **Step 4: Bei Bug-Fund: zurück zu passender Task → fixen → re-push**

- [ ] **Step 5: Bei OK: User gibt Freigabe.**

---

## Phase 7 — Merge

### Task 12: Merge auf main + Cleanup

**Files:** keine

- [ ] **Step 1: Final-Verify**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 2: Merge nach Freigabe (gemäss @superpowers:finishing-a-development-branch)**

```bash
git checkout main
git merge --no-ff feature/bundle-g-f-skeleton -m "G.f: LP-Startseite Skeleton-Pattern (Header sofort sichtbar, Pro-Section-Skeleton)"
git push origin main
```

- [ ] **Step 3: Branch + Worktree aufräumen**

```bash
git branch -d feature/bundle-g-f-skeleton
# Worktree-Cleanup gemäss superpowers:using-git-worktrees
```

- [ ] **Step 4: HANDOFF.md aktualisieren**

Eintrag „Bundle G.f auf main" mit Commit-SHA und gelernten Lessons.

- [ ] **Step 5: Memory-Update**

Memory-Eintrag `project_s154_bundle_gf.md` schreiben (analog `project_s153_bundle_g_d_2.md`), MEMORY.md-Index ergänzen.

---

## Geschätzte Subagent-Sessions

| Phase | Tasks | Subagent-Calls |
|---|---|---|
| 1 | Task 1 | 1 |
| 2 | Tasks 2-4 | 3 |
| 3 | Tasks 5-8 | 4 |
| 4 | Task 9 | 1 |
| 5 | Task 10 | 1 |
| 6 | Task 11 (User-E2E) | 0 |
| 7 | Task 12 (Merge) | 1 |
| **Total** | 12 Tasks | **~11 Subagent-Calls** in 1 Implementations-Session |

---

## Was wir explizit NICHT in G.f machen

- App-weite Skeleton-Pattern (KorrekturDashboard, DurchfuehrenDashboard, FragenBrowser) → Future G.f.2
- LPStartseite.tsx-Refactor (1007 Z.) — getrennte Aufgabe
- Animations-Framework (Framer-Motion etc.)
- Skeleton mit echten Daten-Vorab-Werten (würde IDB-Cache-Integration brauchen)
- Suspense-basierter Skeleton (heutiges State-basiertes Pattern bleibt)
- LPSkeleton.tsx-Erweiterung oder -Löschung (bleibt für Favoriten.tsx-Fallback)
