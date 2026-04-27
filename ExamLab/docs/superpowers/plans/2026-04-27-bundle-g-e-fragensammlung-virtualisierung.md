# Bundle G.e — Fragensammlung Virtualisierung — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Fragensammlung skaliert in den DOM hinein nicht. 2412 Fragen erzeugen 2'400+ DOM-Knoten und mehrere Sekunden Initial-Render. Wir ersetzen die `.map()`-Listenrenderung durch Virtualisierung mit `@tanstack/react-virtual`, sodass nur sichtbare Items + 10er-Overscan im DOM landen.

**Architecture:** Neue Komponente `VirtualisierteFragenListe.tsx` baut intern ein flat-array von `{header} | {frage}`-Items, virtualisiert es mit `useVirtualizer`. Beide existierenden `.map`-Blöcke in `FragenBrowser.tsx` (inline + overlay) werden durch einen Aufruf der neuen Komponente ersetzt. Pagination-State (`SEITEN_GROESSE`/`angezeigteMenge`) in `useFragenFilter.ts` und `FragenBrowserHeader.tsx` entfällt. Sticky Group Headers werden via `position: sticky` auf den Header-Items beibehalten; Plan-Phase enthält Spike zur Verifikation.

**Tech Stack:** React 19.2 + TypeScript + Vite + Vitest 4 + `@tanstack/react-virtual` (neu, ~6 KB gzipped).

**Spec:** `docs/superpowers/specs/2026-04-27-bundle-g-e-fragensammlung-virtualisierung-design.md`

---

## File Structure

| Aktion | Datei | Verantwortung |
|---|---|---|
| Erstellen | `src/components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe.tsx` (~140 Z.) | Virtualisierte Liste mit FlatItem-Logik, Sticky-Headers, Scroll-Reset |
| Erstellen | `src/tests/VirtualisierteFragenListe.test.tsx` (~150 Z.) | Unit-Tests mit gemocktem `useVirtualizer` |
| Erstellen | `src/tests/useFragenFilter.test.ts` (~80 Z., **neu** — existiert noch nicht) | Tests für Filter/Sort/Group-Logik (ohne Pagination) |
| Modifizieren | `src/hooks/useFragenFilter.ts` (306→~290 Z.) | Pagination-State entfernt |
| Modifizieren | `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx` (359→~340 Z.) | `setAngezeigteMenge`-Aufrufer entfernt |
| Modifizieren | `src/components/lp/fragenbank/FragenBrowser.tsx` (732→~590 Z.) | Beide `.map`-Blöcke + Lade-Mehr-Buttons durch `<VirtualisierteFragenListe />` ersetzt |
| Modifizieren | `package.json` | `@tanstack/react-virtual` als Dependency |
| Unverändert | `KompaktZeile.tsx`, `DetailKarte.tsx`, `gruppenHelfer.ts` | Werden von der neuen Komponente weiterverwendet |

---

## Vorbedingungen

- Branch ist `main`, sauber. **Vor Task 0 wechseln auf einen neuen Worktree-Branch `feature/bundle-g-e-virtualisierung` via @superpowers:using-git-worktrees.**
- 2412 Fragen im aktiven LP-Pool (für E2E in Phase 7).
- LP-Login-Credentials für preview verfügbar.

---

## Phase 0 — Preflight Baseline-Messung (User-gesteuert, vor Code)

### Task 0: Baseline-Werte erfassen

**Files:** keine

- [ ] **Step 1: Setup**

User öffnet preview im Chrome, loggt sich als LP ein (`wr.test@gymhofwil.ch`), klickt Fragensammlung-Tab, wartet bis alle 2412 Fragen geladen sind.

- [ ] **Step 2: DOM-Knoten-Anzahl messen**

DevTools → Console:
```js
document.querySelectorAll('[data-fragen-zeile]').length
// oder Fallback: document.querySelectorAll('.fragen-liste > *').length
```
Notieren als `BASELINE_DOM_NODES`.

- [ ] **Step 3: Initial-Render-Latenz**

DevTools → Performance Tab → Aufnahme starten → Tab neu laden → Stop nach erstem Render. „First Meaningful Paint" der Fragensammlung-Liste notieren als `BASELINE_INITIAL_MS`.

- [ ] **Step 4: Heap-Snapshot**

DevTools → Memory → Heap Snapshot → Total Size notieren als `BASELINE_HEAP_MB`.

- [ ] **Step 5: Bundle-Size**

Im Repo:
```bash
cd ExamLab && npm run build 2>&1 | tail -30
```
Zeile mit `dist/assets/index-*.js` notieren als `BASELINE_BUNDLE_KB`.

- [ ] **Step 6: Werte in HANDOFF-Notiz schreiben**

In `ExamLab/HANDOFF.md` unter Bundle G.e folgenden Block ergänzen:
```markdown
**Baseline (vor G.e):**
- DOM-Knoten: <BASELINE_DOM_NODES>
- Initial-Render: <BASELINE_INITIAL_MS> ms
- Heap-Snapshot: <BASELINE_HEAP_MB> MB
- Bundle-Size: <BASELINE_BUNDLE_KB> KB
```

Diese Werte werden in Task 9 als Vergleich verwendet. **Kein Commit für Task 0** (nur Mess-Notiz, wird im Task-1-Commit mit aufgenommen).

---

## Phase 1 — Dependency-Setup

### Task 1: `@tanstack/react-virtual` installieren

**Files:**
- Modify: `ExamLab/package.json`
- Modify: `ExamLab/package-lock.json`

- [ ] **Step 1: Installation**

```bash
cd ExamLab && npm install @tanstack/react-virtual
```

- [ ] **Step 2: Bundle-Size-Diff messen**

```bash
cd ExamLab && npm run build 2>&1 | tail -30
```

Vergleichen mit `BASELINE_BUNDLE_KB` aus Task 0. Diff sollte ≤10 KB sein. Falls grösser: in HANDOFF dokumentieren, aber weitermachen.

- [ ] **Step 3: TS + Tests grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Erwartung: alles grün (Baseline 772 Tests).

- [ ] **Step 4: Commit**

```bash
git add ExamLab/package.json ExamLab/package-lock.json ExamLab/HANDOFF.md
git commit -m "G.e: @tanstack/react-virtual als Dependency + Baseline-Messwerte"
```

---

## Phase 2 — VirtualisierteFragenListe (TDD)

### Task 2: VirtualisierteFragenListe-Skelett mit FlatItem-Build (TDD)

**Files:**
- Create: `ExamLab/src/tests/VirtualisierteFragenListe.test.tsx`
- Create: `ExamLab/src/components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe.tsx`

Wir testen die FlatItem-Konstruktion isoliert von `useVirtualizer`. Dafür extrahieren wir die Build-Logik in eine pure Funktion `baueFlatItems`, die ohne React/jsdom testbar ist.

- [ ] **Step 1: Failing Test für `baueFlatItems`**

Erstelle `ExamLab/src/tests/VirtualisierteFragenListe.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { baueFlatItems } from '../components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe'
import type { Frage } from '../types'
import type { GruppierteAnzeige } from '../hooks/useFragenFilter'

const f = (id: string): Frage => ({ id, fragetyp: 'multiple_choice', frage: id, fachbereich: 'BWL', thema: 'X', schwierigkeit: 'mittel', bloom: 'k1', erstellt: '', bearbeitet: '' } as any)

describe('baueFlatItems', () => {
  it('baut leeres Array bei leerer gruppierterAnzeige', () => {
    const result = baueFlatItems([], 'fachbereich', new Set())
    expect(result).toEqual([])
  })

  it('ohne Gruppierung: nur Frage-Items, keine Header', () => {
    const ga: GruppierteAnzeige[] = [{ key: '__alle__', label: 'Alle', fragen: [f('1'), f('2')] }]
    const result = baueFlatItems(ga, 'keine', new Set())
    expect(result.map(i => i.typ)).toEqual(['frage', 'frage'])
  })

  it('mit Gruppierung + alle aufgeklappt: Header + Fragen pro Gruppe', () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1'), f('2')] },
      { key: 'VWL', label: 'VWL', fragen: [f('3')] },
    ]
    const result = baueFlatItems(ga, 'fachbereich', new Set(['BWL', 'VWL']))
    expect(result.map(i => i.typ)).toEqual(['header', 'frage', 'frage', 'header', 'frage'])
  })

  it('mit Gruppierung + Gruppe zugeklappt: nur Header der zugeklappten Gruppe', () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1'), f('2')] },
      { key: 'VWL', label: 'VWL', fragen: [f('3')] },
    ]
    const result = baueFlatItems(ga, 'fachbereich', new Set(['VWL']))  // BWL zu, VWL auf
    expect(result.map(i => i.typ)).toEqual(['header', 'header', 'frage'])
  })
})
```

- [ ] **Step 2: Test laufen lassen, FAIL erwartet**

```bash
cd ExamLab && npx vitest run src/tests/VirtualisierteFragenListe.test.tsx
```
Erwartung: FAIL — Modul existiert nicht.

- [ ] **Step 3: Minimale Implementierung — `baueFlatItems` + Komponenten-Stub**

Erstelle `ExamLab/src/components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe.tsx`:

```tsx
import type { Frage } from '../../../../types'
import type { GruppierteAnzeige, Gruppierung } from '../../../../hooks/useFragenFilter'

export type FlatItem =
  | { typ: 'header'; gruppeKey: string; gruppeLabel: string; fragenAnzahl: number; istAufgeklappt: boolean }
  | { typ: 'frage'; frage: Frage; gruppeKey: string }

export function baueFlatItems(
  gruppierteAnzeige: GruppierteAnzeige[],
  gruppierung: Gruppierung,
  aufgeklappteGruppen: Set<string>,
): FlatItem[] {
  const items: FlatItem[] = []
  if (gruppierung === 'keine') {
    for (const gruppe of gruppierteAnzeige) {
      for (const frage of gruppe.fragen) {
        items.push({ typ: 'frage', frage, gruppeKey: gruppe.key })
      }
    }
    return items
  }
  for (const gruppe of gruppierteAnzeige) {
    const istAufgeklappt = aufgeklappteGruppen.has(gruppe.key)
    items.push({
      typ: 'header',
      gruppeKey: gruppe.key,
      gruppeLabel: gruppe.label,
      fragenAnzahl: gruppe.fragen.length,
      istAufgeklappt,
    })
    if (istAufgeklappt) {
      for (const frage of gruppe.fragen) {
        items.push({ typ: 'frage', frage, gruppeKey: gruppe.key })
      }
    }
  }
  return items
}

export interface Props {
  // wird in Task 4 vervollständigt
}

export default function VirtualisierteFragenListe(_p: Props) {
  return null
}
```

- [ ] **Step 4: Test laufen, PASS erwartet**

```bash
cd ExamLab && npx vitest run src/tests/VirtualisierteFragenListe.test.tsx
```
Erwartung: 4 Tests grün.

- [ ] **Step 5: TypeScript-Check**

```bash
cd ExamLab && npx tsc -b
```
Erwartung: clean.

> Hinweis: `Gruppierung`-Type wird aus `useFragenFilter.ts` importiert. Falls Type dort nicht exportiert ist: in Task 2 zusätzlich `export type Gruppierung = ...` in `useFragenFilter.ts` ergänzen.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe.tsx ExamLab/src/tests/VirtualisierteFragenListe.test.tsx
git commit -m "G.e: VirtualisierteFragenListe-Skelett + baueFlatItems-Logik (TDD)"
```

---

### Task 3: useVirtualizer-Mock + Render-Test mit gemocktem Virtualizer

**Files:**
- Modify: `ExamLab/src/tests/VirtualisierteFragenListe.test.tsx`
- Modify: `ExamLab/src/components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe.tsx`

Da jsdom keine Layout-Engine hat, mocken wir `useVirtualizer` so, dass es alle Items „sichtbar" macht. So testen wir Render-Logik (welche Komponente kommt rein) ohne Virtualisierungsmathematik.

- [ ] **Step 1: Failing Test (Render-Test)**

In `VirtualisierteFragenListe.test.tsx` ergänzen:

```tsx
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import VirtualisierteFragenListe from '../components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({ index, key: index, start: index * 100, size: 100 })),
    measureElement: () => {},
    scrollToIndex: vi.fn(),
  }),
}))

describe('VirtualisierteFragenListe (mit Virtualizer-Mock)', () => {
  it('rendert Header-Komponente für Header-Items', () => {
    const ga: GruppierteAnzeige[] = [{ key: 'BWL', label: 'BWL', fragen: [f('1')] }]
    const { getByText } = render(
      <VirtualisierteFragenListe
        gruppierteAnzeige={ga}
        gruppierung="fachbereich"
        aufgeklappteGruppen={new Set(['BWL'])}
        kompaktModus={true}
        bereitsVerwendetSet={new Set()}
        fragenStats={new Map()}
        toggleGruppe={vi.fn()}
        toggleFrageInPruefung={vi.fn()}
        handleEditFrage={vi.fn()}
        handleFrageDuplizieren={vi.fn()}
        scrollResetTrigger=""
      />,
    )
    expect(getByText(/BWL/)).toBeTruthy()
  })

  it('ruft toggleGruppe mit Gruppe-Key bei Header-Klick', () => {
    const toggle = vi.fn()
    const ga: GruppierteAnzeige[] = [{ key: 'BWL', label: 'BWL', fragen: [] }]
    const { getByRole } = render(
      <VirtualisierteFragenListe
        gruppierteAnzeige={ga}
        gruppierung="fachbereich"
        aufgeklappteGruppen={new Set()}
        kompaktModus={true}
        bereitsVerwendetSet={new Set()}
        fragenStats={new Map()}
        toggleGruppe={toggle}
        toggleFrageInPruefung={vi.fn()}
        handleEditFrage={vi.fn()}
        handleFrageDuplizieren={vi.fn()}
        scrollResetTrigger=""
      />,
    )
    getByRole('button', { name: /BWL/ }).click()
    expect(toggle).toHaveBeenCalledWith('BWL')
  })
})
```

- [ ] **Step 2: Test FAIL**

```bash
cd ExamLab && npx vitest run src/tests/VirtualisierteFragenListe.test.tsx
```
Erwartung: 2 neue FAIL (Komponente returnt null).

- [ ] **Step 3a: Echte Prop-Signaturen verifizieren (Pflicht vor Step 3)**

Lies `KompaktZeile.tsx` + `DetailKarte.tsx` komplett. Notiere die exakten Prop-Namen + -Types (insbesondere ob `DetailKarte` ein `onLoeschen` braucht, ob `performance` vs. `fragenStats` unterschiedlich heisst). Vergleiche mit `FragenBrowser.tsx` Z. 376-385 (KompaktZeile-Aufruf) + Z. 386-395 (DetailKarte-Aufruf) — die übergebenen Props sind authoritativ. **Ohne diesen Schritt riskierst du Silent-Runtime-Bugs.**

- [ ] **Step 3: Vollständige Implementierung**

Ersetze in `VirtualisierteFragenListe.tsx` den Stub durch:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'
import KompaktZeile from './KompaktZeile'
import DetailKarte from './DetailKarte'
import { gruppenLabel as labelHelfer, gruppenLabelFarbe as farbeHelfer } from './gruppenHelfer'
import type { Frage, FragenPerformance } from '../../../../types'
import type { GruppierteAnzeige, Gruppierung } from '../../../../hooks/useFragenFilter'

export type FlatItem =
  | { typ: 'header'; gruppeKey: string; gruppeLabel: string; fragenAnzahl: number; istAufgeklappt: boolean }
  | { typ: 'frage'; frage: Frage; gruppeKey: string }

export function baueFlatItems(...) { /* unverändert */ }

export interface Props {
  gruppierteAnzeige: GruppierteAnzeige[]
  gruppierung: Gruppierung
  aufgeklappteGruppen: Set<string>
  kompaktModus: boolean
  bereitsVerwendetSet: Set<string>
  fragenStats: Map<string, FragenPerformance>
  toggleGruppe: (key: string) => void
  toggleFrageInPruefung: (id: string) => void
  handleEditFrage: (frage: Frage) => void
  handleFrageDuplizieren: (frage: Frage) => void
  scrollResetTrigger: unknown
}

export default function VirtualisierteFragenListe(p: Props) {
  const flatItems = useMemo(
    () => baueFlatItems(p.gruppierteAnzeige, p.gruppierung, p.aufgeklappteGruppen),
    [p.gruppierteAnzeige, p.gruppierung, p.aufgeklappteGruppen],
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i: number) => {
      const item = flatItems[i]
      if (!item) return 80
      if (item.typ === 'header') return 36
      return p.kompaktModus ? 56 : 200
    },
    overscan: 10,
  })

  useEffect(() => {
    virtualizer.scrollToIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.scrollResetTrigger])

  if (flatItems.length === 0) return null

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto" data-testid="virt-scroll">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = flatItems[vItem.index]
          if (!item) return null
          return (
            <div
              key={vItem.key}
              ref={virtualizer.measureElement}
              data-index={vItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${vItem.start}px)`,
              }}
            >
              {item.typ === 'header' ? (
                <button
                  type="button"
                  onClick={() => p.toggleGruppe(item.gruppeKey)}
                  className={`sticky top-0 z-10 w-full text-left flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${farbeHelfer(item.gruppeKey, p.gruppierung)}`}
                >
                  <span>{item.istAufgeklappt ? '▼' : '▶'}</span>
                  <span className="font-semibold">{labelHelfer(item.gruppeKey, p.gruppierung)}</span>
                  <span className="ml-auto text-xs text-slate-500">{item.fragenAnzahl}</span>
                </button>
              ) : p.kompaktModus ? (
                <KompaktZeile
                  frage={item.frage}
                  istInPruefung={p.bereitsVerwendetSet.has(item.frage.id)}
                  onToggle={() => p.toggleFrageInPruefung(item.frage.id)}
                  onEdit={() => p.handleEditFrage(item.frage)}
                  onDuplizieren={() => p.handleFrageDuplizieren(item.frage)}
                  zeigeGruppierung={p.gruppierung !== 'keine'}
                  performance={p.fragenStats.get(item.frage.id)}
                />
              ) : (
                <DetailKarte
                  frage={item.frage}
                  istInPruefung={p.bereitsVerwendetSet.has(item.frage.id)}
                  onToggle={() => p.toggleFrageInPruefung(item.frage.id)}
                  onEdit={() => p.handleEditFrage(item.frage)}
                  onDuplizieren={() => p.handleFrageDuplizieren(item.frage)}
                  zeigeGruppierung={p.gruppierung !== 'keine'}
                  performance={p.fragenStats.get(item.frage.id)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

> **Wichtig:** Falls `KompaktZeile`/`DetailKarte` ein `onLoeschen`-Prop verlangen (gemäss Recon-Report bei `DetailKarte`), entsprechend ergänzen — **prüfe die echten Signaturen** in den Source-Dateien und übernimm sie 1:1 mit denselben Props die `FragenBrowser.tsx` aktuell durchreicht (Z. 376-385 + Z. 386-395).

- [ ] **Step 4: Tests laufen lassen — PASS**

```bash
cd ExamLab && npx vitest run src/tests/VirtualisierteFragenListe.test.tsx
```
Erwartung: 6 Tests grün.

- [ ] **Step 5: tsc + komplette Test-Suite**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Erwartung: alles grün, 772+6=778 Tests.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe.tsx ExamLab/src/tests/VirtualisierteFragenListe.test.tsx
git commit -m "G.e: VirtualisierteFragenListe komplett (Render-Logic + Mock-Test)"
```

---

### Task 4: Scroll-Reset-Trigger-Test

**Files:**
- Modify: `ExamLab/src/tests/VirtualisierteFragenListe.test.tsx`

- [ ] **Step 1: Failing Test**

In `VirtualisierteFragenListe.test.tsx` ergänzen:

```tsx
it('ruft virtualizer.scrollToIndex(0) bei scrollResetTrigger-Wechsel', () => {
  const scrollSpy = vi.fn()
  vi.doMock('@tanstack/react-virtual', () => ({
    useVirtualizer: ({ count }: { count: number }) => ({
      getTotalSize: () => count * 100,
      getVirtualItems: () => [],
      measureElement: () => {},
      scrollToIndex: scrollSpy,
    }),
  }))
  // Re-import nach doMock
  // ... (full test pattern: reset modules, re-render with new trigger)
})
```

> **Hinweis:** Statt `vi.doMock` ist eine einfachere Alternative, den Spy als Modul-Level-Mock zu setzen und seinen Aufruf-Counter vor + nach Re-Render zu prüfen. Plan-Implementer kann den TanStack-Doc-Pattern (`vi.mock`) anpassen — wichtig ist nur: Test verifiziert dass bei Trigger-Wechsel `scrollToIndex(0)` aufgerufen wird.

- [ ] **Step 2-4: FAIL → Impl ist schon korrekt → PASS** (durch `useEffect` aus Task 3 sollte er passen, ggf. nur Test-Setup justieren)

- [ ] **Step 5: Commit**

```bash
git commit -am "G.e: Scroll-Reset-Trigger-Test"
```

---

### Task 5: Sticky-Header-Spike (Browser-basiert, manuell)

**Files:** keine (nur Verifikation)

Wir wissen aus der Spec, dass Sticky-Headers in `@tanstack/react-virtual` riskant sind. Spike verifiziert vor Refactor von `FragenBrowser.tsx`.

- [ ] **Step 1: Throwaway-Demo-Page erstellen**

Im Branch eine `ExamLab/src/components/lp/fragenbank/fragenbrowser/_SpikeDemo.tsx` Komponente bauen, die `VirtualisierteFragenListe` mit synthetischen 100 Fragen + 5 Gruppen rendert.

Temporären Route-Eintrag in `LPStartseite.tsx` (oder direkt in einer kleinen Demo-Route) hinzufügen, der die Spike-Komponente rendert.

- [ ] **Step 2: Browser-Verifikation**

`npm run dev` starten, in Chrome zu `/spike-fragensammlung` navigieren. Scrollen — prüfen ob Header beim Scrollen oben sticky bleiben.

- [ ] **Step 3: Outcome A — Sticky funktioniert → continue**

Demo-Komponente + Route entfernen (`git restore` der temporären Files).

```bash
git checkout -- ExamLab/src/components/lp/fragenbank/fragenbrowser/_SpikeDemo.tsx ExamLab/src/components/lp/LPStartseite.tsx
```
oder einfach nicht committen.

- [ ] **Step 3-Alt: Outcome B — Sticky funktioniert nicht → Pivot**

Plan pausieren, Issue im HANDOFF dokumentieren, User-Entscheidung einholen zwischen:
- **Variante A: Sticky-Header-Lane** (Headers ausserhalb der Virtualisierung als separater Layer; useVirtualizer virtualisiert nur Frage-Items pro Gruppe in eigenen Sub-Listen)
- **Variante B: Header-as-Pseudo-Sticky** (`position: fixed` + manuelles Berechnen anhand `virtualizer.getVirtualItems()[0]`)

User entscheidet. Plan wird vom User-Feedback abhängig adaptiert.

> **Annahme für den weiteren Plan:** Outcome A. Falls B eintritt, sind die folgenden Tasks zu überarbeiten.

- [ ] **Step 4: kein Commit für den Spike** (wird verworfen)

---

## Phase 3 — Pagination-Cleanup (TDD)

### Task 6: useFragenFilter-Tests neu anlegen (TDD-Baseline)

**Files:**
- Create: `ExamLab/src/tests/useFragenFilter.test.ts`

Da `useFragenFilter.test.ts` noch nicht existiert, schaffen wir eine Baseline VOR der Code-Änderung. So merken wir, wenn etwas verloren geht.

- [ ] **Step 1: Test-File erstellen**

```ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFragenFilter } from '../hooks/useFragenFilter'
import type { Frage } from '../types'

const f = (id: string, override: Partial<Frage> = {}): Frage => ({
  id,
  fragetyp: 'multiple_choice',
  frage: id,
  fachbereich: 'BWL',
  thema: 'X',
  schwierigkeit: 'mittel',
  bloom: 'k1',
  erstellt: '',
  bearbeitet: '',
  ...override,
} as any)

describe('useFragenFilter', () => {
  const fragen = [f('1'), f('2', { fachbereich: 'VWL' }), f('3')]

  it('liefert alle Fragen bei leerem Filter', () => {
    const { result } = renderHook(() => useFragenFilter(fragen))
    expect(result.current.gefilterteFragen.length).toBe(3)
  })

  it('Suchtext filtert nach Frage-Inhalt', () => {
    const { result } = renderHook(() => useFragenFilter(fragen))
    act(() => result.current.setSuchtext('1'))
    expect(result.current.gefilterteFragen.map(x => x.id)).toEqual(['1'])
  })

  it('Fachbereich-Filter wirkt', () => {
    const { result } = renderHook(() => useFragenFilter(fragen))
    act(() => result.current.setFilterFachbereich('VWL'))
    expect(result.current.gefilterteFragen.map(x => x.id)).toEqual(['2'])
  })

  it('Gruppierung "fachbereich" baut korrekte Gruppen', () => {
    const { result } = renderHook(() => useFragenFilter(fragen))
    act(() => result.current.setGruppierung('fachbereich'))
    const keys = result.current.gruppierteAnzeige.map(g => g.key).sort()
    expect(keys).toEqual(['BWL', 'VWL'])
  })

  it('liefert ALLE Fragen ohne Pagination-Slice (auch ohne Gruppierung)', () => {
    const grosseListe = Array.from({ length: 100 }, (_, i) => f(`${i}`))
    const { result } = renderHook(() => useFragenFilter(grosseListe))
    expect(result.current.gefilterteFragen.length).toBe(100)
    // gruppierteAnzeige (gruppierung='keine') sollte alle 100 enthalten
    const total = result.current.gruppierteAnzeige.reduce((sum, g) => sum + g.fragen.length, 0)
    expect(total).toBe(100)
  })
})
```

> **Hinweis:** Der letzte Test verifiziert das **Ziel-Verhalten** — mit dem aktuellen Code (Pagination aktiv) liefert er nur 30. Der Test wird nach Task 7 grün; das ist erwartet (TDD-Pattern).

- [ ] **Step 2: Tests laufen, der letzte FAILT**

```bash
cd ExamLab && npx vitest run src/tests/useFragenFilter.test.ts
```
Erwartung: 4/5 PASS, der „liefert ALLE Fragen ohne Pagination-Slice"-Test FAIL.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/tests/useFragenFilter.test.ts
git commit -m "G.e: useFragenFilter-Tests-Baseline (TDD, 1 Test rot bis Task 7)"
```

---

### Task 7: useFragenFilter Pagination entfernen

**Files:**
- Modify: `ExamLab/src/hooks/useFragenFilter.ts`

- [ ] **Step 1: Pagination-State entfernen**

In `ExamLab/src/hooks/useFragenFilter.ts`:
- Z. 22 `const SEITEN_GROESSE = 30` löschen
- Z. 115 `const [angezeigteMenge, setAngezeigteMenge] = useState(SEITEN_GROESSE)` löschen
- Z. 222 `fragen: sortierteFragen.slice(0, angezeigteMenge)` ersetzen durch `fragen: sortierteFragen` (Slice entfällt)
- Z. 304 `seitenGroesse: SEITEN_GROESSE` aus Return entfernen
- `angezeigteMenge` und `setAngezeigteMenge` aus Return entfernen

> **Wichtig:** Der Memo `gruppierteAnzeige` (Z. 220-239) muss beide Branches (`gruppierung === 'keine'` UND `else`) anpassen, damit beide alle Fragen liefern. Aktuell slict nur der `keine`-Branch (Z. 222). Der else-Branch liefert ohnehin alle Fragen pro Gruppe.

- [ ] **Step 2: Tests laufen — alle 5 sollten grün sein**

```bash
cd ExamLab && npx vitest run src/tests/useFragenFilter.test.ts
```
Erwartung: 5/5 grün.

- [ ] **Step 3: tsc-Check (es gibt jetzt Aufrufer-Fehler in FragenBrowser.tsx und FragenBrowserHeader.tsx)**

```bash
cd ExamLab && npx tsc -b
```
Erwartung: TypeScript-Errors zu `angezeigteMenge`/`setAngezeigteMenge`/`seitenGroesse` in FragenBrowser.tsx + FragenBrowserHeader.tsx. **Das ist erwartet — wird in Task 8/9 gefixt.**

- [ ] **Step 4: Commit (mit kaputtem tsc OK, da nächste Tasks reparieren)**

> **Achtung:** dieser Commit lässt das Projekt zwischenzeitlich nicht kompilieren. Falls strikter Pre-Commit-Hook den Push blockiert, Tasks 7-9 als einen Commit zusammenfassen.

```bash
git add ExamLab/src/hooks/useFragenFilter.ts
git commit -m "G.e: useFragenFilter Pagination-State entfernt (Aufrufer folgen)"
```

---

### Task 8: FragenBrowserHeader Pagination-Aufrufer entfernen

**Files:**
- Modify: `ExamLab/src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx`

- [ ] **Step 1: Props-Type entfernen**

Z. 47 `setAngezeigteMenge: ...`-Prop aus Type entfernen.

- [ ] **Step 2: setAngezeigteMenge-Aufrufe entfernen**

Z. 202, 214, 227, 239, 251, 265, 277, 289, 300 — alle 9 `setAngezeigteMenge(seitenGroesse)`-Aufrufe streichen.

- [ ] **Step 3: tsc-Check**

```bash
cd ExamLab && npx tsc -b
```
Erwartung: Errors zu Header in `FragenBrowser.tsx` (das übergibt diese Props) — das ist erwartet, fixen in Task 9.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx
git commit -m "G.e: FragenBrowserHeader setAngezeigteMenge entfernt"
```

---

## Phase 4 — FragenBrowser Refactor

### Task 9: FragenBrowser inline-Modus auf VirtualisierteFragenListe umstellen

**Files:**
- Modify: `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx`

- [ ] **Step 1: Import ergänzen**

Top der Datei:
```tsx
import VirtualisierteFragenListe from './fragenbrowser/VirtualisierteFragenListe'
```

- [ ] **Step 2: setAngezeigteMenge-Prop aus Header-Aufrufer entfernen**

Statt fixer Zeilennummer (die nach Task 7+8 gedriftet sein kann): `grep -n "setAngezeigteMenge" ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx` → alle Treffer streichen (alle Stellen, an denen FragenBrowser das Prop an Header durchreicht).

- [ ] **Step 3: Inline-Modus-Map-Block ersetzen (Z. 346-401 + Lade-Mehr-Button Z. 403-412)**

Diese Zeilen-Spanne ersetzen durch:

```tsx
<VirtualisierteFragenListe
  gruppierteAnzeige={filter.gruppierteAnzeige}
  gruppierung={filter.gruppierung}
  aufgeklappteGruppen={filter.aufgeklappteGruppen}
  kompaktModus={filter.kompaktModus}
  bereitsVerwendetSet={bereitsVerwendetSet}
  fragenStats={fragenStats}
  toggleGruppe={toggleGruppe}
  toggleFrageInPruefung={toggleFrageInPruefung}
  handleEditFrage={handleEditFrage}
  handleFrageDuplizieren={handleFrageDuplizieren}
  scrollResetTrigger={`${filter.suchtext}|${filter.gruppierung}|${filter.gefilterteFragen.length}`}
/>
```

- [ ] **Step 4: tsc + tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Erwartung: tsc clean, alle Tests grün (überall). Falls nicht: Helper/Callbacks-Signaturen prüfen.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx
git commit -m "G.e: FragenBrowser inline-Modus nutzt VirtualisierteFragenListe"
```

---

### Task 10: FragenBrowser overlay-Modus auf VirtualisierteFragenListe umstellen

**Files:**
- Modify: `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx`

- [ ] **Step 1: Overlay-Modus-Map-Block ersetzen (Z. 577-634 + Lade-Mehr-Button Z. 637-646)**

Identische Ersetzung wie Task 9, mit denselben Props.

- [ ] **Step 2: tsc + tests + build**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```
Erwartung: alles grün, Datei jetzt ~590 Z.

- [ ] **Step 3: Zeilenanzahl bestätigen**

```bash
wc -l ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx
```
Erwartung: ≤620 Z.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx
git commit -m "G.e: FragenBrowser overlay-Modus nutzt VirtualisierteFragenListe"
```

---

## Phase 5 — Verifikation

### Task 11: Vollständige Test-Suite + Build grün

**Files:** keine

- [ ] **Step 1: tsc**

```bash
cd ExamLab && npx tsc -b
```
Erwartung: clean.

- [ ] **Step 2: vitest**

```bash
cd ExamLab && npx vitest run
```
Erwartung: ~783 Tests grün (Baseline 772 + ~6 neue VirtualisierteFragenListe + 5 neue useFragenFilter).

- [ ] **Step 3: build**

```bash
cd ExamLab && npm run build
```
Erwartung: erfolgreich.

- [ ] **Step 4: Bundle-Size-Diff dokumentieren**

`dist/assets/index-*.js`-Grösse mit Baseline aus Task 0 vergleichen. In HANDOFF eintragen.

- [ ] **Step 5: Kein Commit nötig** — nur Verifikations-Schritt. Verwende @superpowers:verification-before-completion.

---

## Phase 6 — Browser-E2E

### Task 12: Browser-E2E mit echten LP-Logins (preview)

**Files:** keine

E2E-Plan gemäss Spec Section „Browser-E2E":

| # | Pfad | Erwartung | Mess-Punkt |
|---|---|---|---|
| 1 | LP-Login → Fragensammlung-Tab | Initial-Render ≤500ms | DevTools Performance |
| 2 | DOM-Knoten zählen: `document.querySelectorAll('[data-index]').length` | ≤80 (auch bei 2412 Fragen) | DevTools Console |
| 3 | Scroll von Anfang bis Ende | smooth, ≥58fps | DevTools Performance |
| 4 | Suchtext eingeben | Resultate sichtbar ≤200ms, Scroll springt nach oben | Visuell |
| 5 | Gruppe aufklappen | Items erscheinen, Scroll-Position bleibt | Visuell |
| 6 | Gruppe zuklappen | Items verschwinden | Visuell |
| 7 | KompaktModus-Toggle | Höhen ändern | Visuell |
| 8 | Frage editieren (Editor öffnet/schliesst) | Scroll-Position erhalten | Visuell |
| 9 | Memory-Snapshot | <70% des `BASELINE_HEAP_MB` | DevTools Memory |
| 10 | Sticky-Header-Verhalten beim Scroll | Header bleibt oben | Visuell |

- [ ] **Step 1: Branch auf preview pushen**

```bash
git push origin feature/bundle-g-e-virtualisierung
git push origin feature/bundle-g-e-virtualisierung:preview --force-with-lease
```

> **Vorsicht:** Vor Force-Push `git log preview ^feature/bundle-g-e-virtualisierung` prüfen (Memory-Regel `feedback_preview_forcepush.md`).

- [ ] **Step 2: User testet (mit Tab-Gruppe + echten Logins, gemäss `regression-prevention.md` Phase 3)**

- [ ] **Step 3: Bei Bug-Fund: zurück zu passender Task → fixen → re-push**

- [ ] **Step 4: Bei OK: User gibt Freigabe.**

- [ ] **Step 5: Mess-Werte in HANDOFF eintragen**

```markdown
**E2E-Mess-Werte (G.e nach Implementation):**
- DOM-Knoten: <wert>  (Baseline: <BASELINE_DOM_NODES>, Reduktion: <%>)
- Initial-Render: <wert> ms  (Baseline: <BASELINE_INITIAL_MS> ms)
- Heap: <wert> MB  (Baseline: <BASELINE_HEAP_MB> MB)
- FPS: <wert>
```

---

## Phase 7 — Merge

### Task 13: Merge auf main + Cleanup

**Files:** keine (Git-Operations)

- [ ] **Step 1: Final-Verify**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 2: Merge nach LP-Freigabe (gemäss @superpowers:finishing-a-development-branch)**

```bash
git checkout main
git merge --no-ff feature/bundle-g-e-virtualisierung -m "G.e: Fragensammlung-Virtualisierung (DOM-Knoten 2400→<80, Initial-Render mehrere s→≤500ms)"
git push origin main
```

- [ ] **Step 3: Branch + Worktree aufräumen**

```bash
git branch -d feature/bundle-g-e-virtualisierung
# Worktree-Cleanup gemäss superpowers:using-git-worktrees
```

- [ ] **Step 4: HANDOFF.md S154 finalisieren**

Eintrag „Bundle G.e auf main" mit Commit-SHA, Mess-Werten, gelernten Lessons hinzufügen.

- [ ] **Step 5: Memory-Update**

Memory-Eintrag `project_s154_bundle_ge.md` schreiben (analog `project_s153_bundle_g_d_2.md`), MEMORY.md-Index ergänzen.

---

## Geschätzte Subagent-Sessions

| Phase | Tasks | Subagent-Calls (subagent-driven-development) |
|---|---|---|
| 0 | Task 0 (manuell) | 0 |
| 1 | Task 1 | 1 |
| 2 | Tasks 2-5 (Spike als 1 Task) | 4 |
| 3 | Tasks 6-8 | 3 |
| 4 | Tasks 9-10 | 2 |
| 5 | Task 11 (Verify) | 1 |
| 6 | Task 12 (User-E2E) | 0 (User testet) |
| 7 | Task 13 (Merge) | 1 |
| **Total** | 13 Tasks | **~12 Subagent-Calls** in 1 Implementations-Session |

---

## Was wir explizit NICHT in G.e machen

- Server-side Pagination
- KompaktZeile/DetailKarte-Refactor
- Skeleton-Loading-Placeholder (G.f)
- IDB-Cache-Tuning (G.d.2)
- Sortier-/Filter-Algorithmus-Optimierung
