# Foundation Bundle — Cluster G Phase 1 + Cluster E Foundation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foundation für die 7-Cluster-Post-Test-Sweep-Roadmap legen. Lucide-Icons + 5 Custom-Icons + Fragetyp-Icon-Mapping (G Phase 1) sowie Typografie-Tokens + zentrale Tab-Registry + additive Favoriten-Type-Erweiterung (E Foundation). Reine Additionen, keine Migration vorhandener UI/Logic.

**Architecture:** Drei isolierte Module:
1. `src/components/ui/icons/` — `lucide-react` als Library + `CustomIcons.tsx` (5 SVGs) + `FragetypIcon.tsx` (Mapping) + Re-Export.
2. `src/styles/typografie.ts` — `TYPO`-Konstanten (5 Tier: Display / H1 / H2 / Body / Caption).
3. `src/utils/tabRegistry.ts` — `TAB_REGISTRY`-Array + `tabsFuerSurface()`-Filter mit Sichtbarkeits-Predicate.

Die Type-Erweiterungen in `AppOrt.screen` (`+'einstellungen' | 'hilfe'`) und `Favorit.typ` (`+'einstellungen-tab' | 'hilfe-tab'`) sind rein additiv: existierende Konsumenten (`useLPFavoriten`, `useLPDashboardData`) filtern auf alte Werte und brechen NICHT.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Vitest. Neu: `lucide-react` (~25KB gzipped tree-shaken).

---

## Pre-Audit-Ergebnisse (Offene Punkte aufgelöst)

| Frage (Spec-Section) | Entscheidung | Begründung |
|---|---|---|
| G §13: Storybook? | **Nein** für Foundation | Setup-Overhead unverhältnismässig. Visual-Verification via Browser-E2E. |
| G §13: Lint-Regel ESLint vs grep? | **Out-of-Scope** Foundation | Kommt in G Phase 6 als eigenes Sub-Bundle. |
| G §13: Fragetyp-Identifier matched? | **✓ Verifiziert** | Alle 20 `typ`-Werte in `packages/shared/src/types/fragen-core.ts` matchen MAP exakt: `mc`, `freitext`, `lueckentext`, `zuordnung`, `visualisierung`, `richtigfalsch`, `berechnung`, `buchungssatz`, `tkonto`, `kontenbestimmung`, `bilanzstruktur`, `aufgabengruppe`, `pdf`, `sortierung`, `hotspot`, `bildbeschriftung`, `audio`, `dragdrop_bild`, `code`, `formel`. |
| G §13: Testdaten-Tab-Icon | **`FlaskConical`** | Übernommen für Cluster-F-Vorbereitung. |
| G §13: Custom-Icon-Größe xs=14px | **Pragmatisch via E2E** | Visual-Check am Ende. Falls unleserlich → Spawn-Task für G Phase 2. |
| E §12: LPProfil-API partial/full? | **Out-of-Scope** Foundation | Backend-Migration erst in E Phase 4. |
| E §12: Hilfe-Hash-Links grep? | **Out-of-Scope** Foundation | Registry-Definition only, HilfeSeite-Migration erst in E Phase 3. |
| E §12: Storybook (depends G)? | **Nein** (analog G §13) | Konsistent mit G-Entscheidung. |
| E §12: Lazy-Load-Bug Übungen-Tab (Cluster A)? | **Out-of-Scope** Foundation | Cluster A's Concern. Foundation berührt keine Tab-Inhalte. |
| E §4.3: `Favorit` ↔ `AppOrt` Konsolidierung (Option A/B)? | **Option B** (additive Erweiterung) für Foundation | Konsolidierung später in E Phase 4 wenn Backend-Migration läuft. Foundation = pure Add. |

## File Structure

**Neu:**
- `ExamLab/src/components/ui/icons/CustomIcons.tsx` — 5 SVG-React-Komponenten
- `ExamLab/src/components/ui/icons/CustomIcons.test.tsx` — Snapshot + structural tests
- `ExamLab/src/components/ui/icons/FragetypIcon.tsx` — Mapping-Komponente
- `ExamLab/src/components/ui/icons/FragetypIcon.test.tsx` — 20-Typ-Coverage-Tests
- `ExamLab/src/components/ui/icons/index.ts` — Re-Export-Barrel
- `ExamLab/src/styles/typografie.ts` — `TYPO`-Konstanten + Doku
- `ExamLab/src/styles/typografie.test.ts` — Snapshot-Test der Konstanten
- `ExamLab/src/utils/tabRegistry.ts` — Registry + Filter
- `ExamLab/src/utils/tabRegistry.test.ts` — Unique-ID + Surface-Filter + Admin-Predicate

**Modifiziert:**
- `ExamLab/src/types/stammdaten.ts:43` — `AppOrt.screen` Union erweitern
- `ExamLab/src/store/favoritenStore.ts:9` — `Favorit.typ` Union erweitern
- `ExamLab/package.json` — `lucide-react` als Dependency
- `ExamLab/package-lock.json` — wird automatisch durch npm install aktualisiert
- `ExamLab/HANDOFF.md` — Foundation-Bundle-Eintrag

---

## Task 1: Branch-Setup + Bundle-Baseline

**Files:**
- Branch: `feature/foundation-g1-e-bundle`
- Baseline-File temp: `/tmp/examlab-bundle-baseline.txt`

- [ ] **Step 1: Feature-Branch anlegen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull
git checkout -b feature/foundation-g1-e-bundle
```

- [ ] **Step 2: Build-Baseline VOR lucide-Install**

Run: `cd ExamLab && npm run build 2>&1 | tail -30 | tee /tmp/examlab-bundle-baseline.txt`
Expected: vite build success, eine `dist/assets/index-*.js` Größe notieren.

---

## Task 2: lucide-react installieren

**Files:**
- Modify: `ExamLab/package.json`
- Modify: `ExamLab/package-lock.json` (auto)

- [ ] **Step 1: lucide-react als Dependency installieren**

Run: `cd ExamLab && npm install lucide-react`
Expected: `+ lucide-react@<version>` in package.json `dependencies`.

- [ ] **Step 2: Verifizieren dass Import funktioniert (smoke test im Node)**

Run: `cd ExamLab && node -e "import('lucide-react').then(m => console.log('OK', typeof m.Star))"`
Expected: `OK function`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/package.json ExamLab/package-lock.json
git commit -m "ExamLab: lucide-react als Dependency installiert (Foundation G P1)"
```

---

## Task 3: CustomIcons (5 SVG-React-Komponenten) — TDD

**Files:**
- Create: `ExamLab/src/components/ui/icons/CustomIcons.tsx`
- Test: `ExamLab/src/components/ui/icons/CustomIcons.test.tsx`

- [ ] **Step 1: Failing Test schreiben**

```tsx
// ExamLab/src/components/ui/icons/CustomIcons.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IconAbc, IconAB, IconAn, IconTKonto } from './CustomIcons'

describe('CustomIcons', () => {
  it('IconAbc rendert SVG mit viewBox 0 0 24 24 und strokeWidth=2', () => {
    const { container } = render(<IconAbc />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg?.getAttribute('stroke-width')).toBe('2')
    expect(svg?.querySelector('text')?.textContent).toBe('abc')
  })

  it('IconAB rendert "a" und "b" Text-Elemente', () => {
    const { container } = render(<IconAB />)
    const texts = container.querySelectorAll('text')
    expect(Array.from(texts).map(t => t.textContent)).toEqual(['a', 'b'])
  })

  it('IconAn rendert "an" zentriert', () => {
    const { container } = render(<IconAn />)
    expect(container.querySelector('text')?.textContent).toBe('an')
  })

  it('IconTKonto rendert rect + zwei lines (Layout-Geometrie)', () => {
    const { container } = render(<IconTKonto />)
    expect(container.querySelector('rect')).toBeTruthy()
    expect(container.querySelectorAll('line').length).toBe(2)
  })

  it('alle CustomIcons reichen SVGProps durch (z.B. className)', () => {
    const { container } = render(<IconAbc className="custom-class" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('custom-class')
  })
})
```

- [ ] **Step 2: Test laufen lassen — sollte FAILEN (Datei nicht existent)**

Run: `cd ExamLab && npx vitest run src/components/ui/icons/CustomIcons.test.tsx`
Expected: FAIL — `Cannot find module './CustomIcons'`.

- [ ] **Step 3: CustomIcons.tsx implementieren**

```tsx
// ExamLab/src/components/ui/icons/CustomIcons.tsx
import type { SVGProps } from 'react'

/**
 * ExamLab-spezifische Custom-Icons im Lucide-Stil.
 *
 * Erweiterungs-Pattern (Spec G §6.5):
 * - viewBox="0 0 24 24"
 * - strokeWidth=2, fill="none", stroke="currentColor"
 * - strokeLinecap="round", strokeLinejoin="round"
 * - Text-Elemente: fontFamily="ui-sans-serif, system-ui", fontWeight=700
 * - Komponente nimmt SVGProps<SVGSVGElement> und reicht via {...props} durch.
 */

/** Freitext-Icon: "abc" über einer Unterstreichung. */
export const IconAbc = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="2.5" y="17" fontFamily="ui-sans-serif, system-ui"
      fontSize="11" fontWeight="700" fill="currentColor" stroke="none">abc</text>
    <path d="M2 21h20"/>
  </svg>
)

/** Lückentext-Icon: "a ___ b" Pattern. */
export const IconAB = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="3" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="10" fontWeight="700" fill="currentColor" stroke="none">a</text>
    <text x="17" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="10" fontWeight="700" fill="currentColor" stroke="none">b</text>
    <path d="M9 18h6"/>
  </svg>
)

/** Buchungssatz-Icon: "___ an ___" Pattern. */
export const IconAn = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="12" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="11" fontWeight="700" fill="currentColor" stroke="none"
      textAnchor="middle">an</text>
    <path d="M1 20h4"/>
    <path d="M19 20h4"/>
  </svg>
)

/** T-Konto-Icon: rect + vertical/horizontal divider. */
export const IconTKonto = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
  </svg>
)
```

- [ ] **Step 4: Test laufen lassen — sollte PASSEN**

Run: `cd ExamLab && npx vitest run src/components/ui/icons/CustomIcons.test.tsx`
Expected: PASS (5 Tests).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ui/icons/CustomIcons.tsx ExamLab/src/components/ui/icons/CustomIcons.test.tsx
git commit -m "ExamLab: 5 Custom-Icons (IconAbc, IconAB, IconAn, IconTKonto) im Lucide-Stil"
```

---

## Task 4: FragetypIcon Mapping — TDD

**Files:**
- Create: `ExamLab/src/components/ui/icons/FragetypIcon.tsx`
- Test: `ExamLab/src/components/ui/icons/FragetypIcon.test.tsx`

**Type-Source:** `Fragetyp` ist im Repo kein Standalone-Type — wir leiten ihn aus `Frage['typ']` ab (Discriminated Union in `packages/shared/src/types/fragen-core.ts:663`).

- [ ] **Step 1: Failing Test schreiben (alle 20 Typen, mit Type-Cast statt @ts-expect-error)**

```tsx
// ExamLab/src/components/ui/icons/FragetypIcon.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FragetypIcon, FRAGETYP_ICON_MAP, type Fragetyp } from './FragetypIcon'

const ALLE_TYPEN: Fragetyp[] = [
  'mc', 'freitext', 'lueckentext', 'zuordnung', 'visualisierung',
  'richtigfalsch', 'berechnung', 'buchungssatz', 'tkonto', 'kontenbestimmung',
  'bilanzstruktur', 'aufgabengruppe', 'pdf', 'sortierung', 'hotspot',
  'bildbeschriftung', 'audio', 'dragdrop_bild', 'code', 'formel',
]

describe('FragetypIcon', () => {
  it('hat einen MAP-Eintrag für alle 20 Fragetypen', () => {
    for (const t of ALLE_TYPEN) {
      expect(FRAGETYP_ICON_MAP[t]).toBeDefined()
    }
    expect(Object.keys(FRAGETYP_ICON_MAP).sort()).toEqual([...ALLE_TYPEN].sort())
  })

  it('rendert für jeden Typ ein SVG', () => {
    for (const t of ALLE_TYPEN) {
      const { container } = render(<FragetypIcon typ={t} />)
      expect(container.querySelector('svg')).toBeTruthy()
    }
  })

  it('reicht className durch (z.B. Tailwind-Größen)', () => {
    const { container } = render(<FragetypIcon typ="mc" className="w-5 h-5 text-slate-500" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('w-5 h-5 text-slate-500')
  })

  it('rendert nichts wenn Typ unbekannt (graceful fallback)', () => {
    // Type-Cast statt @ts-expect-error: bewusster Test mit ungültigem Typ
    const { container } = render(<FragetypIcon typ={'unknown-typ' as Fragetyp} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
```

- [ ] **Step 2: Test laufen lassen — FAILEN**

Run: `cd ExamLab && npx vitest run src/components/ui/icons/FragetypIcon.test.tsx`
Expected: FAIL — `Cannot find module './FragetypIcon'`.

- [ ] **Step 3: FragetypIcon.tsx implementieren (mit Image-Alias + strenger MAP-Type)**

```tsx
// ExamLab/src/components/ui/icons/FragetypIcon.tsx
import {
  ListChecks, ToggleLeft, Calculator, Sigma, FileText, AudioLines,
  ArrowUpDown, Code, Image as ImageIcon, Move, MousePointerClick, ArrowRightLeft,
  Package, Columns2, Brush, FileSearch,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Frage } from '@shared/types/fragen-core'
import { IconAbc, IconAB, IconAn, IconTKonto } from './CustomIcons'

/** Discriminator-Type aus Discriminated Union (Single source of truth). */
export type Fragetyp = Frage['typ']

/** Mapping aller Fragetyp-Discriminator-Strings auf Icon-Komponenten.
 *  TS-Compiler erzwingt Vollständigkeit: neue Fragetypen MÜSSEN hier ergänzt werden. */
export const FRAGETYP_ICON_MAP: Record<Fragetyp, ComponentType<LucideProps>> = {
  mc:              ListChecks,
  richtigfalsch:   ToggleLeft,
  berechnung:      Calculator,
  formel:          Sigma,
  pdf:             FileText,
  audio:           AudioLines,
  sortierung:      ArrowUpDown,
  code:            Code,
  bildbeschriftung: ImageIcon,
  dragdrop_bild:   Move,
  hotspot:         MousePointerClick,
  zuordnung:       ArrowRightLeft,
  aufgabengruppe:  Package,
  bilanzstruktur:  Columns2,
  visualisierung:  Brush,
  kontenbestimmung: FileSearch,
  freitext:        IconAbc,
  lueckentext:     IconAB,
  buchungssatz:    IconAn,
  tkonto:          IconTKonto,
}

interface FragetypIconProps extends LucideProps {
  typ: Fragetyp
}

/**
 * Rendert das Icon eines Fragetyps. Graceful Fallback: null wenn Typ
 * zur Runtime nicht im MAP (defensive — TS-Compiler garantiert eigentlich Vollständigkeit).
 */
export function FragetypIcon({ typ, ...props }: FragetypIconProps) {
  const Icon = FRAGETYP_ICON_MAP[typ]
  if (!Icon) return null
  return <Icon {...props} />
}
```

- [ ] **Step 4: Test laufen lassen — PASSEN**

Run: `cd ExamLab && npx vitest run src/components/ui/icons/FragetypIcon.test.tsx`
Expected: PASS (4 Tests).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ui/icons/FragetypIcon.tsx ExamLab/src/components/ui/icons/FragetypIcon.test.tsx
git commit -m "ExamLab: FragetypIcon-Mapping (20 Typen → Lucide+Custom Icons, MAP-Type via Frage['typ'])"
```

---

## Task 5: Icons Barrel-Export

**Files:**
- Create: `ExamLab/src/components/ui/icons/index.ts`

- [ ] **Step 1: index.ts schreiben**

```ts
// ExamLab/src/components/ui/icons/index.ts
export { IconAbc, IconAB, IconAn, IconTKonto } from './CustomIcons'
export { FragetypIcon, FRAGETYP_ICON_MAP } from './FragetypIcon'
```

- [ ] **Step 2: Smoke-Verifikation via tsc**

Run: `cd ExamLab && npx tsc -b 2>&1 | head -20`
Expected: kein neuer Type-Error für `src/components/ui/icons/`.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/ui/icons/index.ts
git commit -m "ExamLab: Icons-Barrel-Export (Foundation G P1)"
```

---

## Task 6: Typografie-Tokens — TDD

**Files:**
- Create: `ExamLab/src/styles/typografie.ts`
- Test: `ExamLab/src/styles/typografie.test.ts`

- [ ] **Step 1: Failing Test schreiben**

```ts
// ExamLab/src/styles/typografie.test.ts
import { describe, it, expect } from 'vitest'
import { TYPO } from './typografie'

describe('TYPO-Konstanten', () => {
  it('hat genau 5 Tier: display / h1 / h2 / body / caption', () => {
    expect(Object.keys(TYPO).sort()).toEqual(['body', 'caption', 'display', 'h1', 'h2'])
  })

  it('Snapshot-Schutz gegen versehentliche Änderungen', () => {
    expect(TYPO).toEqual({
      display: 'text-2xl font-bold',
      h1:      'text-xl font-bold',
      h2:      'text-lg font-semibold',
      body:    'text-sm',
      caption: 'text-xs font-medium',
    })
  })

  it('alle Werte sind Strings (Tailwind-Klassen)', () => {
    for (const v of Object.values(TYPO)) {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Test laufen lassen — FAILEN**

Run: `cd ExamLab && npx vitest run src/styles/typografie.test.ts`
Expected: FAIL — `Cannot find module './typografie'`.

- [ ] **Step 3: typografie.ts implementieren**

```ts
// ExamLab/src/styles/typografie.ts
/**
 * Zentrale Typografie-Skala (5-Tier-Hierarchie).
 *
 * Verwendung:
 *   import { TYPO } from '@/styles/typografie'
 *   <h1 className={TYPO.display}>Einstellungen</h1>
 *   <h2 className={TYPO.h1}>Mein Profil</h2>
 *
 * Tier-Regeln:
 * - display: genau 1× pro Top-Level-Seite (Page-Title, linke obere Ecke)
 * - h1:      Tab-Haupttitel / Section-Title
 * - h2:      Klar abgesetzte Sub-Sektionen, Dialog-Titel, Karten-Header
 * - body:    Default für Content
 * - caption: Small Labels, Form-Hints, Badge-Text
 */
export const TYPO = {
  display: 'text-2xl font-bold',          // 24 px / 700 — Page-Title
  h1:      'text-xl font-bold',           // 20 px / 700 — Tab-/Section-Title
  h2:      'text-lg font-semibold',       // 18 px / 600 — Sub-Section, Dialog-Title
  body:    'text-sm',                     // 14 px / 400 — Default-Content
  caption: 'text-xs font-medium',         // 12 px / 500 — Labels, Badges, Meta
} as const

export type TypoTier = keyof typeof TYPO
```

- [ ] **Step 4: Test laufen lassen — PASSEN**

Run: `cd ExamLab && npx vitest run src/styles/typografie.test.ts`
Expected: PASS (3 Tests).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/styles/typografie.ts ExamLab/src/styles/typografie.test.ts
git commit -m "ExamLab: Typografie-Tokens TYPO (5-Tier-Skala, Foundation E)"
```

---

## Task 7: AppOrt + Favorit Type-Erweiterungen (additiv)

**Files:**
- Modify: `ExamLab/src/types/stammdaten.ts` (Line via grep)
- Modify: `ExamLab/src/store/favoritenStore.ts` (Line via grep)

- [ ] **Step 0: Pre-Audit — Discriminated-Union-Switch-Verbraucher**

Run:
```bash
cd ExamLab
grep -n "favorit\.typ ===\|f\.typ ===" src/store src/hooks src/components 2>&1
grep -n "switch.*\.typ" src/store/favoritenStore.ts src/hooks/useLPFavoriten.ts src/hooks/useLPDashboardData.ts 2>&1
grep -n "appOrt\.screen ===\|\.screen ===" src/ -r 2>&1 | grep -v node_modules
```

Expected: nur Filter-Pattern (`f.typ === 'pruefung'`), keine exhaustive Switches ohne Default. Falls Switch ohne Default mit Exhaustiveness-Check (`never`-Assertion) gefunden → Plan-Stop, Issue eskalieren (additive Erweiterung wäre dann nicht safe).

- [ ] **Step 1: Aktuelle Zeile für AppOrt.screen finden + Edit**

Run: `cd ExamLab && grep -n "screen:.*'pruefung'" src/types/stammdaten.ts`
Erwartet: 1 Treffer mit der `screen:` Union. Diese Zeile ersetzen durch:

```ts
  screen: 'pruefung' | 'uebung' | 'fragensammlung' | 'einstellungen' | 'hilfe'
```

- [ ] **Step 2: Aktuelle Zeile für Favorit.typ finden + Edit**

Run: `cd ExamLab && grep -n "typ:.*'ort'" src/store/favoritenStore.ts`
Erwartet: 1 Treffer mit der `typ:` Union. Diese Zeile ersetzen durch:

```ts
  typ: 'ort' | 'pruefung' | 'uebung' | 'frage' | 'einstellungen-tab' | 'hilfe-tab'
```

- [ ] **Step 3: tsc + vitest gegen Side-Effects**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -20 && npm test 2>&1 | tail -5`
Expected: tsc clean, vitest pass count unchanged (Type-Erweiterung ist additiv).

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/types/stammdaten.ts ExamLab/src/store/favoritenStore.ts
git commit -m "ExamLab: AppOrt.screen + Favorit.typ um Einstellungen/Hilfe-Tabs erweitert (Foundation E)"
```

---

## Task 8: Tab-Registry — TDD

**Files:**
- Create: `ExamLab/src/utils/tabRegistry.ts`
- Test: `ExamLab/src/utils/tabRegistry.test.ts`

- [ ] **Step 1: Failing Test schreiben**

```ts
// ExamLab/src/utils/tabRegistry.test.ts
import { describe, it, expect } from 'vitest'
import { TAB_REGISTRY, tabsFuerSurface } from './tabRegistry'

describe('TAB_REGISTRY', () => {
  it('alle IDs sind innerhalb einer Surface unique', () => {
    const byFlavor: Record<string, Set<string>> = {}
    for (const t of TAB_REGISTRY) {
      byFlavor[t.surface] ??= new Set()
      const s = byFlavor[t.surface]
      expect(s.has(t.id), `Duplikat ${t.surface}/${t.id}`).toBe(false)
      s.add(t.id)
    }
  })

  it('IDs sind kebab-case (lowercase + Bindestrich)', () => {
    for (const t of TAB_REGISTRY) {
      expect(t.id).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })

  it('enthält die Einstellungen-Tabs aus Spec', () => {
    const ids = TAB_REGISTRY.filter(t => t.surface === 'einstellungen').map(t => t.id)
    expect(ids).toEqual(expect.arrayContaining([
      'profil', 'lernziele', 'favoriten', 'problemmeldungen',
      'uebungen', 'fragensammlung', 'testdaten', 'admin', 'ki-kalibrierung',
    ]))
  })

  it('enthält die Hilfe-Tabs aus Spec in Workflow-Order', () => {
    const hilfeIds = TAB_REGISTRY.filter(t => t.surface === 'hilfe').map(t => t.id)
    expect(hilfeIds).toEqual([
      'einstieg', 'fragen', 'pruefung', 'durchfuehrung', 'korrektur',
      'ueben', 'ki', 'bloom', 'zusammenarbeit', 'faq',
    ])
  })
})

describe('tabsFuerSurface', () => {
  it('filtert nach Surface', () => {
    const e = tabsFuerSurface('einstellungen', { istAdmin: false })
    expect(e.length).toBeGreaterThan(0)
    expect(e.every(t => t.surface === 'einstellungen')).toBe(true)
  })

  it('versteckt Admin-Tab für Non-Admins', () => {
    const e = tabsFuerSurface('einstellungen', { istAdmin: false })
    expect(e.find(t => t.id === 'admin')).toBeUndefined()
  })

  it('zeigt Admin-Tab für Admins', () => {
    const e = tabsFuerSurface('einstellungen', { istAdmin: true })
    expect(e.find(t => t.id === 'admin')).toBeDefined()
  })

  it('Default-Tabs (ohne sichtbar-Predicate) erscheinen immer', () => {
    const e1 = tabsFuerSurface('einstellungen', { istAdmin: false })
    const e2 = tabsFuerSurface('einstellungen', { istAdmin: true })
    const profilFehlt = !e1.find(t => t.id === 'profil')
    const profilFehltAdmin = !e2.find(t => t.id === 'profil')
    expect(profilFehlt).toBe(false)
    expect(profilFehltAdmin).toBe(false)
  })
})
```

- [ ] **Step 2: Test laufen lassen — FAILEN**

Run: `cd ExamLab && npx vitest run src/utils/tabRegistry.test.ts`
Expected: FAIL — `Cannot find module './tabRegistry'`.

- [ ] **Step 3: tabRegistry.ts implementieren**

```ts
// ExamLab/src/utils/tabRegistry.ts
/**
 * Zentrale Tab-Registry (Single source of truth) für ExamLab-Surfaces
 * mit Tab-Strukturen. Konsumiert von Tab-Renderern + Favoriten-Picker
 * + globaler Suche (Cluster C).
 */

export type TabSurface = 'einstellungen' | 'hilfe'

export interface TabContext {
  /** True wenn der eingeloggte LP in `Stammdaten.admins` enthalten ist. */
  istAdmin: boolean
}

export interface TabDefinition {
  /** Eindeutige ID innerhalb der Surface (kebab-case). */
  id: string
  surface: TabSurface
  /** Anzeigename (Deutsch). */
  titel: string
  /** Route oder Modal-Path. */
  route: string
  /** Optional: nur sichtbar wenn Funktion true zurückgibt. */
  sichtbar?: (ctx: TabContext) => boolean
  /** Optional: Lucide-Icon-Name (für Cluster B Header + Cluster E Star-Toggle). */
  icon?: string
}

export const TAB_REGISTRY: TabDefinition[] = [
  // === Einstellungen ===
  { id: 'profil',            surface: 'einstellungen', titel: 'Mein Profil',         route: '/einstellungen/profil' },
  { id: 'lernziele',         surface: 'einstellungen', titel: 'Lernziele',           route: '/einstellungen/lernziele' },
  { id: 'favoriten',         surface: 'einstellungen', titel: 'Favoriten',           route: '/einstellungen/favoriten' },
  { id: 'problemmeldungen',  surface: 'einstellungen', titel: 'Problemmeldungen',    route: '/einstellungen/problemmeldungen' },
  { id: 'uebungen',          surface: 'einstellungen', titel: 'Übungen',             route: '/einstellungen/uebungen' },
  { id: 'fragensammlung',    surface: 'einstellungen', titel: 'Fragensammlung',      route: '/einstellungen/fragensammlung' },
  { id: 'testdaten',         surface: 'einstellungen', titel: 'Testdaten',           route: '/einstellungen/testdaten' }, // Cluster F
  { id: 'admin',             surface: 'einstellungen', titel: 'Admin',               route: '/einstellungen/admin',
                             sichtbar: ({ istAdmin }) => istAdmin },
  { id: 'ki-kalibrierung',   surface: 'einstellungen', titel: 'KI-Kalibrierung',     route: '/einstellungen/ki-kalibrierung' },

  // === Hilfe (Workflow-Order: erstellen → durchführen → korrigieren) ===
  { id: 'einstieg',          surface: 'hilfe', titel: 'Erste Schritte',              route: '/hilfe/einstieg' },
  { id: 'fragen',            surface: 'hilfe', titel: 'Fragen & Fragensammlung',     route: '/hilfe/fragen' },
  { id: 'pruefung',          surface: 'hilfe', titel: 'Prüfung erstellen',           route: '/hilfe/pruefung' },
  { id: 'durchfuehrung',     surface: 'hilfe', titel: 'Durchführung',                route: '/hilfe/durchfuehrung' },
  { id: 'korrektur',         surface: 'hilfe', titel: 'Korrektur & Feedback',        route: '/hilfe/korrektur' },
  { id: 'ueben',             surface: 'hilfe', titel: 'Üben',                        route: '/hilfe/ueben' },
  { id: 'ki',                surface: 'hilfe', titel: 'KI-Assistent',                route: '/hilfe/ki' },
  { id: 'bloom',             surface: 'hilfe', titel: 'Bloom-Taxonomie',             route: '/hilfe/bloom' },
  { id: 'zusammenarbeit',    surface: 'hilfe', titel: 'Zusammenarbeit',              route: '/hilfe/zusammenarbeit' },
  { id: 'faq',               surface: 'hilfe', titel: 'FAQ',                         route: '/hilfe/faq' },
]

/**
 * Liefert sichtbare Tabs für eine Surface, gefiltert nach Sichtbarkeits-Predicate.
 */
export function tabsFuerSurface(surface: TabSurface, ctx: TabContext): TabDefinition[] {
  return TAB_REGISTRY.filter(t =>
    t.surface === surface && (t.sichtbar?.(ctx) ?? true)
  )
}
```

- [ ] **Step 4: Test laufen lassen — PASSEN**

Run: `cd ExamLab && npx vitest run src/utils/tabRegistry.test.ts`
Expected: PASS (8 Tests).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/tabRegistry.ts ExamLab/src/utils/tabRegistry.test.ts
git commit -m "ExamLab: zentrale Tab-Registry (Einstellungen + Hilfe Workflow-Order, Foundation E)"
```

---

## Task 9: Bundle-Größen-Delta + Verification-Gates

**Files:**
- temp: `/tmp/examlab-bundle-after.txt`

- [ ] **Step 1: Build nach Foundation-Bundle**

Run: `cd ExamLab && npm run build 2>&1 | tail -30 | tee /tmp/examlab-bundle-after.txt`
Expected: build success, dist-output. Vergleich mit Baseline (Task 1 Step 2).

- [ ] **Step 2: Bundle-Größe dokumentieren**

Vergleiche Output `/tmp/examlab-bundle-baseline.txt` vs `/tmp/examlab-bundle-after.txt`. Notiere die Differenz der `dist/assets/index-*.js`-Größe für HANDOFF.

Erwartung: +5 bis +15 KB raw / +2 bis +5 KB gzipped (nur 4 Lucide-Imports + 4 Custom-Icons aktiv, restliche Lucide-Imports erst in Phase 2+). Hinweis falls grösser: tree-shaking prüfen.

- [ ] **Step 3: vitest komplett**

Run: `cd ExamLab && npm test 2>&1 | tail -10`
Expected: alle vorherigen Tests +20 neue Tests (5 CustomIcons + 4 FragetypIcon + 3 typografie + 8 tabRegistry) = PASS.

- [ ] **Step 4: tsc -b**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -10`
Expected: clean.

- [ ] **Step 5: 4× lint-Gates**

Run: `cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung`
Expected: alle clean.

- [ ] **Step 6: ESLint-Lint**

Run: `cd ExamLab && npm run lint 2>&1 | tail -5`
Expected: clean (oder pre-existing Warnings — keine neuen Errors aus Foundation-Files).

- [ ] **Step 7: wire-contract-Gate (via npm-Script, konsistent mit Bundle-Legacy-Naming-Cleanup-Pattern)**

Run: `cd ExamLab && npm run lint:wire-contract 2>&1 | tail -5`
Expected: 0 ohne Backend-handler (Foundation berührt keine Wire-Contract-Actions). Falls Script-not-found → Fallback `cd ../ && node scripts/audit-wire-contract.mjs --strict`.

---

## Task 10: Browser-E2E (Live-Bundle Sanity-Check)

**Files:** keine

- [ ] **Step 1: Preview-Branch vorbereiten (mit Pre-Merge-Audit gegen Force-Push-Risiko)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout preview
git pull origin preview
# Memory-Regel feedback_preview_forcepush.md: vor jedem Preview-Operation prüfen
# ob preview Commits hat die nicht in unserem Branch sind (Work-in-Progress anderer Bundles)
git log preview ^feature/foundation-g1-e-bundle --oneline | head -20
# Bei Treffern: User informieren BEVOR gemerged wird. Bei "leer": fortfahren.
git merge --no-ff feature/foundation-g1-e-bundle -m "preview: Foundation Bundle G P1 + E"
git push origin preview
```

- [ ] **Step 2: Hinweis an User (kein Browser-E2E im Foundation-Bundle nötig)**

Foundation berührt keine UI direkt — alle Icons und Tokens sind nur als Module verfügbar, werden aber noch nicht von Komponenten konsumiert. Browser-E2E ist für G Phase 2+ relevant (wenn Header-Icons live gehen). Hier: nur Smoke-Test dass `npm run preview` läuft + Homepage rendert ohne neue Console-Errors.

Run-Anleitung für User: `cd ExamLab && npm run dev` → http://localhost:5174 öffnen → LP-Login → keine Errors in Console.

- [ ] **Step 3: HANDOFF-Update + Final-Commit**

In `ExamLab/HANDOFF.md` unter "Letzter Stand auf main" einen neuen Bundle-Eintrag oberhalb des "Post-Test-Sweep — 7 Cluster-Specs"-Blocks einfügen:

```markdown
### Foundation Bundle G P1 + E ✅ AUF PREVIEW (2026-05-11)

Erstes Implementations-Bundle der Post-Test-Sweep-Roadmap. Reine Additionen, keine UI-Migration.

| Commit | Inhalt |
|---|---|
| (lucide install) | `lucide-react` als Dependency |
| (custom icons) | 5 Custom-Icons: `IconAbc`, `IconAB`, `IconAn`, `IconTKonto` im Lucide-Stil |
| (fragetyp icon) | `FragetypIcon` Mapping-Komponente (20 Typen → Lucide/Custom) |
| (typografie) | `src/styles/typografie.ts` mit 5-Tier-`TYPO`-Konstanten |
| (types) | `AppOrt.screen` + `Favorit.typ` um Einstellungen/Hilfe-Tabs additiv erweitert |
| (tab registry) | `src/utils/tabRegistry.ts` mit zentralem `TAB_REGISTRY` + `tabsFuerSurface()` |

**Verifikation:** vitest +20 Tests, tsc clean, 4× lint clean, vite build grün. Bundle-Größen-Delta: <BUNDLE-DELTA-AUSFÜLLEN>.

**Nächste Schritte:**
1. F (orthogonal) parallel zu A startklar
2. A nach Merge zu main (konsumiert G + E Foundation)
3. B, D, C in dieser Reihenfolge
```

Run:
```bash
git add ExamLab/HANDOFF.md
git commit -m "ExamLab: HANDOFF Foundation Bundle G P1 + E auf preview"
```

- [ ] **Step 4: Push Feature-Branch**

```bash
git push -u origin feature/foundation-g1-e-bundle
```

---

## Task 11: PR an main vorbereiten (NACH User-Freigabe)

**Files:** keine

- [ ] **Step 1: User testet preview-Branch im Browser**

User-Aktion: `npm run dev` lokal oder Staging-Deploy + LP-Login → keine neuen Console-Errors.

- [ ] **Step 2: NACH User-Freigabe: Merge zu main**

```bash
git checkout main
git pull origin main
git merge --no-ff feature/foundation-g1-e-bundle -m "Foundation Bundle G P1 + E: Icons + Typografie + Tab-Registry"
git push origin main
```

- [ ] **Step 3: Branch löschen**

```bash
git branch -d feature/foundation-g1-e-bundle
git push origin --delete feature/foundation-g1-e-bundle
```

- [ ] **Step 4: HANDOFF "auf preview" → "MERGED" umstellen + Commit**

In `ExamLab/HANDOFF.md` den Bundle-Eintrag auf MERGED setzen, `Merge zu main: <hash>` ergänzen.

---

## Definition of Done (DoD)

- [ ] `lucide-react` in `ExamLab/package.json` als Dependency
- [ ] 5 Custom-Icons exportiert + 5 Tests passen
- [ ] FragetypIcon mit MAP für alle 20 Typen + 4 Tests passen
- [ ] Icons-Barrel `index.ts` re-exportiert
- [ ] `TYPO`-Konstanten mit 5 Tier-Mapping + 3 Tests passen
- [ ] `AppOrt.screen` + `Favorit.typ` additiv erweitert, keine bestehenden Tests brechen
- [ ] `TAB_REGISTRY` mit 9 Einstellungen + 10 Hilfe Tabs + 8 Tests passen
- [ ] vitest komplett grün (Baseline + 20 neue Tests)
- [ ] tsc -b clean
- [ ] 4× lint clean (as-any / no-alert / no-tests-dir / musterloesung)
- [ ] wire-contract Gate (Repo-Root) clean
- [ ] Bundle-Größen-Delta dokumentiert in HANDOFF (~+25 KB raw erwartet)
- [ ] Feature-Branch zu preview gemerged + gepusht
- [ ] HANDOFF-Eintrag commited
- [ ] User-Freigabe → main-Merge

## Out-of-Scope (explizit)

- Konsum der Icons/Tokens durch existierende UI-Komponenten — kommt in G Phase 2+ (Header) und E Phase 2+ (Typografie-Migration der existing Headings).
- ESLint-Lint-Regeln `lint:no-emoji-in-source`, `lint:no-inline-svg-icon`, `lint:typo-tokens` — kommen in G Phase 6 / E Phase 2 als eigene Sub-Bundles.
- Favoriten-Backend-Migration (localStorage → LPProfil) — kommt in E Phase 4.
- Star-Toggle in Tab-Headers — kommt in E Phase 5.
- HilfeSeite-Reorder via Tab-Registry — kommt in E Phase 3.
- Storybook-Setup — explizit verneint.
- Cluster F (Testdaten-Infrastruktur) — orthogonales Sub-Bundle, eigener Plan.

## Lehren (vorab dokumentiert)

- **Additive Type-Erweiterung statt Konsolidierung** für Foundation reduziert Risiko: `Favorit ↔ AppOrt`-Konsolidierung (Spec §4.3 Option A) bleibt für E Phase 4 reserviert wenn Backend-Migration läuft.
- **TDD pro File** isoliert Verifikation auch bei Kombi-Bundle: jeder Custom-Icon, jeder TYPO-Eintrag, jede Tab-Definition hat eigenen Test.
- **Bundle-Baseline vor Library-Install** dokumentiert Tree-Shaking-Effektivität für künftige Cluster.
