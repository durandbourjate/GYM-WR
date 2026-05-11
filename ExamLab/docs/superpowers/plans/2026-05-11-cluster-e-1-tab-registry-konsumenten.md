# Cluster E.1 — Tab-Registry-Konsumenten (HilfeSeite) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `HilfeSeite.tsx` konsumiert `tabsFuerSurface('hilfe', ctx)` aus der zentralen Tab-Registry statt eines hardcoded `KATEGORIEN`-Arrays. Damit landet Hilfe-Tab-Reihenfolge (Workflow-Order) und Single-Source-of-Truth-Architektur im Code.

**Architecture:** Die Tab-Registry-Foundation (`src/utils/tabRegistry.ts` + `tabRegistry.test.ts`) liegt bereits auf `main` (aus Foundation-Bundle G1+E, HEAD `a7b98d8`). Dieser Cut macht HilfeSeite zum ersten Konsumenten. Local `HilfeKategorie`-Type entfällt; aktiver Tab-State wird als `string` (Registry-ID) geführt. Tab→Component-Mapping bleibt in HilfeSeite lokal (`KOMPONENTEN: Record<string, ComponentType>`) — Component-Refs gehören nicht in die Registry (würde Coupling-Inversion).

**Tech Stack:** TypeScript + React 19 + Vitest + React Testing Library

**Scope-Klarstellung (Out-of-Scope explizit):**
- `EinstellungenPanel.tsx`-Migration → eigenes Bundle wegen ID-Konflikt (`kiKalibrierung`-camelCase vs `ki-kalibrierung`-kebab-case) + `testdaten`-Tab-UI fehlt (Cluster F.3 pending).
- Typografie-Migration (Cluster E Phase 2).
- Favoriten-Backend-Sync (Cluster E Phase 4).
- Star-Toggle in Tab-Headers (Cluster E Phase 5).
- Favoriten-Picker-Erweiterung (Cluster E Phase 5 / abh. von Star-Toggle).

---

## Voraussetzungen

- [ ] Worktree aktiv unter `.worktrees/e1-tab-registry`, Branch `cluster-e/e1-tab-registry`.
- [ ] Baseline 1570 Tests passing (verifiziert).
- [ ] Lese vor Start die Skill-Referenzen:
  - @superpowers:test-driven-development (TDD-Workflow)
  - @superpowers:verification-before-completion (Gate vor Claim "fertig")

---

## File Structure

**Modify:**
- `ExamLab/src/components/lp/HilfeSeite.tsx` (102 Z. → erwartet ~95 Z.)

**Create:**
- `ExamLab/src/components/lp/HilfeSeite.test.tsx` (neu — heute kein Test vorhanden)

**Touch unverändert:**
- `ExamLab/src/utils/tabRegistry.ts` (bereits korrekt)
- `ExamLab/src/utils/tabRegistry.test.ts` (bereits korrekt — wird in Task 4 ergänzt um Konsumenten-Drift-Schutz)

---

## Task 1: HilfeSeite-Komponententest (TDD-Setup)

Heute hat `HilfeSeite.tsx` keine Tests. Bevor wir den Cut machen, schreiben wir den Test der die NEUE Workflow-Order verifiziert. Test schlägt initial fehl (alter `KATEGORIEN`-Order ist `einstieg, ueben, pruefung, fragen, ...` — neuer ist `einstieg, fragen, pruefung, durchfuehrung, korrektur, ueben, ...`).

**Files:**
- Create: `ExamLab/src/components/lp/HilfeSeite.test.tsx`

- [ ] **Step 1: Failing test schreiben**

```tsx
// ExamLab/src/components/lp/HilfeSeite.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import HilfeSeite from './HilfeSeite'

// useFocusTrap-Hook braucht DOM-Setup, hier nicht relevant
vi.mock('../../hooks/useFocusTrap.ts', () => ({ useFocusTrap: () => {} }))

// ResizableSidebar wrappt Inhalt - für Tests transparent
vi.mock('@shared/ui/ResizableSidebar', () => ({
  ResizableSidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('HilfeSeite', () => {
  // Nav-Container wird im Refactor mit data-testid="hilfe-nav" markiert
  // → robust gegen Schliessen-Button + zukünftige Header-Buttons
  const navButtons = (): HTMLElement[] =>
    within(screen.getByTestId('hilfe-nav')).getAllByRole('button')

  it('rendert Tab-Buttons in Workflow-Order aus Tab-Registry', () => {
    render(<HilfeSeite onSchliessen={() => {}} />)
    const labels = navButtons().map(b => b.textContent?.trim() ?? '')
    expect(labels).toEqual([
      'Erste Schritte',
      'Fragen & Fragensammlung',
      'Prüfung erstellen',
      'Durchführung',
      'Korrektur & Feedback',
      'Üben',
      'KI-Assistent',
      'Bloom-Taxonomie',
      'Zusammenarbeit',
      'FAQ',
    ])
  })

  it('Default-Tab beim Mount ist "Erste Schritte" (aria-pressed=true)', () => {
    render(<HilfeSeite onSchliessen={() => {}} />)
    const aktivButton = screen.getByRole('button', { name: 'Erste Schritte' })
    expect(aktivButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('Klick auf Tab-Button wechselt aria-pressed-State', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const u = userEvent.setup()
    render(<HilfeSeite onSchliessen={() => {}} />)
    await u.click(screen.getByRole('button', { name: 'Prüfung erstellen' }))
    expect(screen.getByRole('button', { name: 'Prüfung erstellen' }))
      .toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Erste Schritte' }))
      .toHaveAttribute('aria-pressed', 'false')
  })
})
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
cd ExamLab && npx vitest run src/components/lp/HilfeSeite.test.tsx
```

Expected: erster Test FAIL — aktuelle Labels-Reihenfolge ist `Erste Schritte, Üben, Prüfung erstellen, Fragen & Fragensammlung, ...`. Test sagt Workflow-Order.

Falls zweiter/dritter Test schon greifen: OK, sind orthogonal zur Reihenfolge.

- [ ] **Step 3: Commit failing test**

```bash
git add ExamLab/src/components/lp/HilfeSeite.test.tsx
git commit -m "ExamLab E.1: failing test für HilfeSeite Tab-Workflow-Order"
```

---

## Task 2: HilfeSeite-Refactor — Registry-Konsum

Jetzt `KATEGORIEN`-Array entfernen, durch `tabsFuerSurface('hilfe', { istAdmin: false })` ersetzen. Component-Map als lokale Variable. Lokaler `HilfeKategorie`-Type entfällt — State wird `string` (Registry-ID).

**Files:**
- Modify: `ExamLab/src/components/lp/HilfeSeite.tsx`

- [ ] **Step 1: HilfeSeite-Refactor anwenden**

Replace Zeilen 1-19 (Imports + Type + KATEGORIEN-Array) mit:

```tsx
import { useState, useRef, useEffect, type ComponentType } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { tabsFuerSurface } from '../../utils/tabRegistry'
import HilfeEinstieg from './hilfe/HilfeEinstieg'
import HilfeUeben from './hilfe/HilfeUeben'
import HilfePruefung from './hilfe/HilfePruefung'
import HilfeFragen from './hilfe/HilfeFragen'
import HilfeZusammenarbeit from './hilfe/HilfeZusammenarbeit'
import HilfeKI from './hilfe/HilfeKI'
import HilfeDurchfuehrung from './hilfe/HilfeDurchfuehrung'
import HilfeKorrektur from './hilfe/HilfeKorrektur'
import HilfeBloom from './hilfe/HilfeBloom'
import HilfeFAQ from './hilfe/HilfeFAQ'

interface Props {
  onSchliessen: () => void
}

const KOMPONENTEN: Record<string, ComponentType> = {
  einstieg: HilfeEinstieg,
  fragen: HilfeFragen,
  pruefung: HilfePruefung,
  durchfuehrung: HilfeDurchfuehrung,
  korrektur: HilfeKorrektur,
  ueben: HilfeUeben,
  ki: HilfeKI,
  bloom: HilfeBloom,
  zusammenarbeit: HilfeZusammenarbeit,
  faq: HilfeFAQ,
}
```

Replace Zeile 36 (`useState<HilfeKategorie>('einstieg')`):
```tsx
const tabs = tabsFuerSurface('hilfe', { istAdmin: false })
const [kategorie, setKategorie] = useState<string>('einstieg')
```

Berechne aktive Komponente vor dem return:
```tsx
const tabs = tabsFuerSurface('hilfe', { istAdmin: false })
const [kategorie, setKategorie] = useState<string>('einstieg')
const AktiveKomponente = KOMPONENTEN[kategorie]
```

Replace Tab-Navigation-Loop (Zeilen 69-84). Nav-Container bekommt `data-testid="hilfe-nav"`, Buttons bekommen `aria-pressed` für stabilen Aktiv-State-Test:

```tsx
<div
  data-testid="hilfe-nav"
  className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex gap-1 overflow-x-auto shrink-0"
>
  {tabs.map((t) => (
    <button
      key={t.id}
      onClick={() => setKategorie(t.id)}
      aria-pressed={kategorie === t.id}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer
        ${kategorie === t.id
          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }
      `}
    >
      {t.titel}
    </button>
  ))}
</div>
```

Replace Inhalt-Block (Zeilen 87-98) — von 10× `kategorie === '...' && <X />` zu data-driven:
```tsx
<div className="flex-1 overflow-auto px-6 py-5">
  {AktiveKomponente ? <AktiveKomponente /> : null}
</div>
```

- [ ] **Step 2: Run test — verify PASS**

```bash
cd ExamLab && npx vitest run src/components/lp/HilfeSeite.test.tsx
```

Expected: alle 3 Tests PASS.

- [ ] **Step 3: Run full vitest — verify keine Regression**

```bash
cd ExamLab && npm test
```

Expected: 1573 passing (1570 Baseline + 3 neue Tests), 0 failures.

- [ ] **Step 4: tsc + lint clean**

```bash
cd ExamLab && npx tsc -b --noEmit
cd ExamLab && npm run lint
```

Expected: 0 Fehler.

- [ ] **Step 5: Commit HilfeSeite-Refactor**

```bash
git add ExamLab/src/components/lp/HilfeSeite.tsx
git commit -m "ExamLab E.1: HilfeSeite konsumiert tabsFuerSurface (Workflow-Order aus Registry)"
```

---

## Task 3: Drift-Schutz — Registry-Test ergänzen

Wenn Registry-IDs später geändert werden (z.B. ein Tab wird umbenannt) und HilfeSeite-`KOMPONENTEN`-Map nicht mit-aktualisiert, würde der aktive Tab `null` rendern statt zu crashen — silent bug. Test erzwingt Bidirektional-Sync.

**Files:**
- Modify: `ExamLab/src/utils/tabRegistry.test.ts`

- [ ] **Step 1: Test ergänzen — Hash-Link-Stabilität für Hilfe-IDs**

Append after Zeile 35 (innerhalb des `describe('TAB_REGISTRY', ...)`-Blocks):

```ts
  it('Hilfe-Tab-IDs sind stabil (Hash-Link-Kompatibilität)', () => {
    // Diese IDs werden in HilfeSeite.tsx als KOMPONENTEN-Map-Keys verwendet.
    // Eine Umbenennung würde stillen Render-Bruch verursachen.
    const hilfeIds = TAB_REGISTRY.filter(t => t.surface === 'hilfe').map(t => t.id).sort()
    expect(hilfeIds).toEqual([
      'bloom', 'durchfuehrung', 'einstieg', 'faq',
      'fragen', 'ki', 'korrektur', 'pruefung',
      'ueben', 'zusammenarbeit',
    ])
  })
```

- [ ] **Step 2: Run vitest**

```bash
cd ExamLab && npx vitest run src/utils/tabRegistry.test.ts
```

Expected: 9 Tests PASS (5 im `describe('TAB_REGISTRY', ...)`-Block (4 bestehende + 1 neuer) + 4 im `describe('tabsFuerSurface', ...)`-Block).

- [ ] **Step 3: Commit Drift-Schutz**

```bash
git add ExamLab/src/utils/tabRegistry.test.ts
git commit -m "ExamLab E.1: Hash-Link-Stabilitäts-Test für Hilfe-Tab-IDs"
```

---

## Task 4: Verification Gates

Alle Gates müssen clean sein bevor Bundle als „fertig" gilt.

@superpowers:verification-before-completion

- [ ] **Step 1: vitest gesamt**

```bash
cd ExamLab && npm test
```

Expected: 1574 passing (1570 Baseline + 3 HilfeSeite + 1 tabRegistry), 0 failures.

- [ ] **Step 2: tsc -b clean**

```bash
cd ExamLab && npx tsc -b --noEmit
```

Expected: 0 Fehler.

- [ ] **Step 3: eslint + 4× audit-lint + tests-dir-lint clean**

```bash
cd ExamLab && npm run lint
cd ExamLab && npm run lint:as-any
cd ExamLab && npm run lint:musterloesung
cd ExamLab && npm run lint:no-alert
cd ExamLab && npm run lint:wire-contract
cd ExamLab && npm run lint:no-tests-dir
```

Expected: 0 Fehler in jedem Gate (1× eslint + 4× audit-lint + 1× tests-dir). Sollte `lint:musterloesung` Drift zeigen → KEIN Commit, Investigate (pre-existing-Drift dokumentieren, siehe Memory `feedback_grep_anwesenheit_nicht_abwesenheit`).

- [ ] **Step 4: build clean**

```bash
cd ExamLab && npm run build
```

Expected: clean build, kein Bundle-Error.

- [ ] **Step 5: Browser-E2E mit echtem LP-Login**

@feedback_echte_logins (kein Demo-Modus)

1. Dev-Server starten: `cd ExamLab && npm run dev`
2. Browser öffnen, mit echtem LP-Account einloggen (Test-Account `wr` aus den Memory-Lehren Bundle T.b/T.d/F.2).
3. Hilfe-Seite öffnen (Header → Hilfe-Icon).
4. Verifizieren:
   - Tab-Buttons in der Sidebar in Workflow-Order: **Erste Schritte → Fragen & Fragensammlung → Prüfung erstellen → Durchführung → Korrektur & Feedback → Üben → KI-Assistent → Bloom-Taxonomie → Zusammenarbeit → FAQ**.
   - Klick auf jeden der 10 Tabs lädt die jeweilige Hilfe-Komponente (kein leerer Content-Bereich).
   - Default-Tab beim Öffnen = „Erste Schritte" (aktiv markiert).
5. DevTools-Konsole offen halten — 0 React-Warnungen / 0 Errors.

Falls Service-Worker-Cache stört (@feedback_service_worker_cache_wire_bundle): SW unregister + caches.delete + reload.

- [ ] **Step 6: Browser-E2E-Verifikation dokumentieren**

In Plan-Datei oder kurz im Commit-Body: welche 10 Tabs getestet, welcher Account, 0 Errors.

---

## Task 5: HANDOFF + Memory aktualisieren

- [ ] **Step 1: HANDOFF.md aktualisieren** auf `main` (post-merge), nicht auf Feature-Branch.

HANDOFF.md ist seit Commit `7e1ca4b` auf 341 Zeilen mit Bundle-Archiv-Tabelle (siehe Memory `project_handoff_audit_cleanup_2026_05_10`). Neuer Eintrag in die Tabelle: `Cluster E.1 | MERGED | <hash> | HilfeSeite konsumiert Tab-Registry (Workflow-Order)`. Keine neue Sektion.

- [ ] **Step 2: Memory-Eintrag**

Ein neuer Project-Memory-File:
- Name: `project_bundle_cluster_e_1_komplett.md`
- Inhalt: HEAD-Hash, HilfeSeite Z. before/after, Tests +4, vitest-Baseline, Browser-E2E-Verifikation, Lessons.
- Index-Zeile in `MEMORY.md` ergänzen.

- [ ] **Step 3: Spawn-Tasks chip'en für die Out-of-Scope-Items**

(Nur die unmittelbar nächsten, nicht alle E.2-E.5 auf einmal.)

- EinstellungenPanel-Migration auf Registry (Pre-req: `kiKalibrierung→ki-kalibrierung`-Rename + `testdaten`-Tab-UI fertig)

---

## Task 6: Merge zu main

@superpowers:finishing-a-development-branch

- [ ] **Step 1: Final-Reviewer-Pass** (subagent code-reviewer, falls verfügbar).

- [ ] **Step 2: Fast-Forward-Merge** in `main`:

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git merge --no-ff cluster-e/e1-tab-registry -m "ExamLab Cluster E.1: HilfeSeite konsumiert Tab-Registry (Workflow-Order)"
git push origin main
```

- [ ] **Step 3: Worktree-Cleanup**

```bash
git worktree remove .worktrees/e1-tab-registry
git branch -d cluster-e/e1-tab-registry
```

---

## Risk-Tabelle

| Risiko | Wahrscheinlichkeit | Mitigation |
|---|---|---|
| HilfeSeite-Refactor bricht Hash-Link-Bookmarks der User | Niedrig | IDs sind identisch zu KATEGORIEN-keys (verifiziert im Audit) + Drift-Test in Task 3 |
| Tab-Komponente fehlt in KOMPONENTEN-Map nach Registry-Erweiterung | Mittel | `KOMPONENTEN[kategorie]?? null` zeigt nichts statt zu crashen; Drift-Test fängt Umbenennung; aber neue Tabs würden silent ohne Rendering durchgehen → **akzeptiert für E.1, in Lessons dokumentieren** |
| React-19-JSX-Type für `Record<string, () => JSX.Element>` | Niedrig | Falls TS warnt: `Record<string, React.FC>` oder `Record<string, () => React.ReactElement>` |
| Browser-E2E findet visuellen Tab-Order-Mismatch | Niedrig | Test fängt das früher; Browser-E2E ist Bestätigung |
| Workflow-Order von User abgelehnt | Niedrig | Spec ist user-approved (Reihenfolge: erstellen → durchführen → korrigieren ist Cluster-E-Spec-Kern) |
| Service-Worker-Cache liefert alte HilfeSeite (Memory: Bundle T.b/F-Lehre) | Mittel | Vor Browser-E2E: SW unregister + caches.delete + reload (siehe Task 4 Step 5) |

## Lessons in Vorbereitung

- **Tab-Map-Coupling akzeptiert:** HilfeSeite hat eine lokale `KOMPONENTEN`-Map die parallel zur Registry leben muss. Wenn Cluster F.3 später ein Hilfe-Tab hinzufügt, müsste die Map ergänzt werden. Alternative wäre Component-Refs im Registry — würde Coupling-Inversion bedeuten (Utility kennt Components). Akzeptiert als E.1-Trade-off.
- **Defensive `?? null` statt Throw:** Wenn Map-Lookup fehlschlägt, rendert HilfeSeite einen leeren Inhalt-Bereich statt zu crashen. Mache das mit JSDoc-Kommentar explizit, damit zukünftige Entwickler das Pattern verstehen.
