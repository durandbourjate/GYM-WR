# Bundle G.f.2 — App-weit Skeleton-Pattern — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das in G.f etablierte Skeleton-Pattern (Header sofort sichtbar, Per-Section-Skeletons, layout-akkurate Anzahl aus localStorage) auf zwei weitere LP-Hochlast-Views ausrollen: `DurchfuehrenDashboard` (globaler Early-Return entfällt → Header+Tabs sofort, Tab-spezifische Skeletons im Content-Bereich) und `FragenBrowser` (Listen-Skeleton statt „Fragensammlung wird geladen…"-Text in beiden Render-Stellen).

**Architecture:** Drei neue Skeleton-Komponenten in `src/components/lp/skeletons/` (`DurchfuehrenVorbereitungSkeleton`, `DurchfuehrenSusReihenSkeleton`, `FragenListeSkeleton`). G.f-Helper `leseGespeicherteAnzahl` + `schreibeGespeicherteAnzahl` wird wiederverwendet — kein neuer Helper. Persist-Strategie: `DurchfuehrenSusReihenSkeleton` nutzt pro-pruefungId-Key `examlab-lp-letzte-sus-anzahl-{pruefungId}` (Cap 60); FragenBrowser ohne Persist (8 Karten fest). KorrekturDashboard bleibt explizit unangetastet — eingebetteter „Korrektur wird geladen…"-Text bei Cache-Miss ist erwartet, kein Regressions-Indikator.

**Tech Stack:** React 19.2 + TypeScript + Vitest + Tailwind v4. Keine neuen Dependencies. Frontend-only — kein Apps-Script-Deploy.

**Spec:** `docs/superpowers/specs/2026-04-27-bundle-g-f-2-skeleton-app-weit-design.md`

---

## File Structure

| Aktion | Datei | Verantwortung |
|---|---|---|
| Erstellen | `ExamLab/src/components/lp/skeletons/FragenListeSkeleton.tsx` (~45 Z.) | 8 vertikale Karten-Skeletons mit Frage-Titel + 2 Tags + Footer-Punktzahl |
| Erstellen | `ExamLab/src/components/lp/skeletons/DurchfuehrenVorbereitungSkeleton.tsx` (~55 Z.) | 2 Settings-Karten oben + 1 Teilnehmer-Container mit 6 Reihen |
| Erstellen | `ExamLab/src/components/lp/skeletons/DurchfuehrenSusReihenSkeleton.tsx` (~50 Z.) | N Reihen-Skeletons (Avatar + Name + Status + Fortschrittsbalken), Anzahl aus `examlab-lp-letzte-sus-anzahl-{pruefungId}` |
| Erstellen | `ExamLab/src/tests/FragenListeSkeleton.test.tsx` (~25 Z.) | 2 Cases: 8 Karten gerendert, animate-pulse vorhanden |
| Erstellen | `ExamLab/src/tests/DurchfuehrenVorbereitungSkeleton.test.tsx` (~25 Z.) | 2 Cases: Render zeigt Settings-Karten + Teilnehmer-Container, animate-pulse vorhanden |
| Erstellen | `ExamLab/src/tests/DurchfuehrenSusReihenSkeleton.test.tsx` (~55 Z.) | 5 Cases: Default 8, gespeicherte Anzahl 22, Cap-60, Min-5, pruefungId=null |
| Modifizieren | `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` (648→~660 Z.) | globaler Early-Return entfällt, Header+Tabs immer rendern, Tab-Skeleton-Switch, localStorage-Persist-useEffect, Inline-Hinweis bei `fertig && !config` |
| Modifizieren | `ExamLab/src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx` (Erweiterung +~50 Z.) | 4 neue Cases: Header bei `laden` sichtbar, Tab-Skeleton-Render, localStorage-Schreib-Trigger |
| Modifizieren | `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx` (627→~625 Z.) | 2 Lade-Text-Stellen (Z. 333-337 inline, Z. 508-512 overlay) durch `<FragenListeSkeleton />` ersetzen |
| Erstellen oder Erweitern | `ExamLab/src/tests/FragenBrowser.test.tsx` (~40 Z., je nach existenz) | 2 Cases: Skeleton bei `ladeStatus === 'laden'` in inline + overlay |
| Unverändert | `ExamLab/src/utils/skeletonAnzahl.ts` | Wiederverwendet aus G.f, kein Edit |
| Unverändert | `ExamLab/src/components/lp/skeletons/LP*Skeleton.tsx` | G.f-Skeletons bleiben untouched |
| Unverändert | `ExamLab/src/components/lp/korrektur/KorrekturDashboard.tsx` | Explizit out-of-scope |

---

## Vorbedingungen

- Branch: `feature/bundle-g-f-2` (existiert bereits, 2 Commits mit Spec)
- Aktueller Test-Stand: ~800 vitest grün (S154-Baseline)
- LP-Login-Credentials für preview-E2E
- `LPSkeleton.tsx` bleibt unverändert (Favoriten.tsx benötigt es weiterhin als Loading-Fallback)

> **Recon-Befund:** `TabBar` ([src/components/ui/TabBar.tsx:8](../../../src/components/ui/TabBar.tsx#L8)) unterstützt `disabled?: boolean` pro Tab. `LPAppHeaderContainer` ([src/components/lp/LPAppHeaderContainer.tsx:32](../../../src/components/lp/LPAppHeaderContainer.tsx#L32)) akzeptiert `aktionsButtons?: React.ReactNode` — Disabled-Buttons werden als JSX in dieser Prop übergeben.

---

## Phase 1 — Skeleton-Komponenten (TDD, parallel-fähig)

### Task 1: `FragenListeSkeleton` (einfachster, kein Persist)

**Files:**
- Create: `ExamLab/src/components/lp/skeletons/FragenListeSkeleton.tsx`
- Create: `ExamLab/src/tests/FragenListeSkeleton.test.tsx`

- [ ] **Step 1: Failing Test**

```tsx
// ExamLab/src/tests/FragenListeSkeleton.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import FragenListeSkeleton from '../components/lp/skeletons/FragenListeSkeleton'

describe('FragenListeSkeleton', () => {
  it('rendert 8 Karten-Skeletons', () => {
    const { container } = render(<FragenListeSkeleton />)
    const karten = container.querySelectorAll('[data-testid="fragen-liste-skeleton-karte"]')
    expect(karten.length).toBe(8)
  })

  it('hat animate-pulse Elemente', () => {
    const { container } = render(<FragenListeSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Test FAIL — Modul fehlt**

```bash
cd ExamLab && npx vitest run src/tests/FragenListeSkeleton.test.tsx
```
Expected: FAIL — `Cannot find module '../components/lp/skeletons/FragenListeSkeleton'`

- [ ] **Step 3: Implementation**

```tsx
// ExamLab/src/components/lp/skeletons/FragenListeSkeleton.tsx
/**
 * Skeleton-Variante der Fragensammlung-Liste in FragenBrowser.
 * 8 Karten fest — die Liste ist via G.e virtualisiert, sodass nur ~10 Karten
 * im Viewport sichtbar sind. Persist bringt keinen messbaren Effekt.
 */
export default function FragenListeSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          data-testid="fragen-liste-skeleton-karte"
          className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-2"
        >
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
          </div>
          <div className="flex justify-end">
            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Test PASS**

```bash
cd ExamLab && npx vitest run src/tests/FragenListeSkeleton.test.tsx
```
Expected: PASS (2 Tests grün)

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/skeletons/FragenListeSkeleton.tsx ExamLab/src/tests/FragenListeSkeleton.test.tsx
git commit -m "G.f.2: FragenListeSkeleton (8 Karten fest) + Tests"
```

---

### Task 2: `DurchfuehrenVorbereitungSkeleton` (Settings-Karten + Teilnehmer-Liste)

**Files:**
- Create: `ExamLab/src/components/lp/skeletons/DurchfuehrenVorbereitungSkeleton.tsx`
- Create: `ExamLab/src/tests/DurchfuehrenVorbereitungSkeleton.test.tsx`

- [ ] **Step 1: Failing Test**

```tsx
// ExamLab/src/tests/DurchfuehrenVorbereitungSkeleton.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DurchfuehrenVorbereitungSkeleton from '../components/lp/skeletons/DurchfuehrenVorbereitungSkeleton'

describe('DurchfuehrenVorbereitungSkeleton', () => {
  it('rendert 2 Settings-Karten und 1 Teilnehmer-Container', () => {
    const { container } = render(<DurchfuehrenVorbereitungSkeleton />)
    expect(container.querySelectorAll('[data-testid="vorbereitung-settings-card"]').length).toBe(2)
    expect(container.querySelector('[data-testid="vorbereitung-teilnehmer-container"]')).toBeTruthy()
  })

  it('hat animate-pulse Elemente', () => {
    const { container } = render(<DurchfuehrenVorbereitungSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Test FAIL**

```bash
cd ExamLab && npx vitest run src/tests/DurchfuehrenVorbereitungSkeleton.test.tsx
```
Expected: FAIL — Modul fehlt

- [ ] **Step 3: Implementation**

```tsx
// ExamLab/src/components/lp/skeletons/DurchfuehrenVorbereitungSkeleton.tsx
/**
 * Skeleton-Variante des Vorbereitungs-Tab in DurchfuehrenDashboard.
 * Layout-Match: 2 Settings-Karten oben (Konfigurations-Bereich) + 1 Teilnehmer-Tabellen-Container.
 * Festes Layout — keine Persistenz nötig.
 */
export default function DurchfuehrenVorbereitungSkeleton() {
  return (
    <div className="space-y-4">
      {/* 2 Settings-Karten (Konfigurations-Bereich) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[3, 4].map((zeilen, idx) => (
          <div
            key={idx}
            data-testid="vorbereitung-settings-card"
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
          >
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {Array.from({ length: zeilen }, (_, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Teilnehmer-Container */}
      <div
        data-testid="vorbereitung-teilnehmer-container"
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
      >
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
              <div className="ml-auto h-6 w-20 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Test PASS**

```bash
cd ExamLab && npx vitest run src/tests/DurchfuehrenVorbereitungSkeleton.test.tsx
```
Expected: PASS (2 Tests grün)

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/skeletons/DurchfuehrenVorbereitungSkeleton.tsx ExamLab/src/tests/DurchfuehrenVorbereitungSkeleton.test.tsx
git commit -m "G.f.2: DurchfuehrenVorbereitungSkeleton (Settings-Karten + Teilnehmer) + Tests"
```

---

### Task 3: `DurchfuehrenSusReihenSkeleton` (mit pruefungId-Persist)

**Files:**
- Create: `ExamLab/src/components/lp/skeletons/DurchfuehrenSusReihenSkeleton.tsx`
- Create: `ExamLab/src/tests/DurchfuehrenSusReihenSkeleton.test.tsx`

- [ ] **Step 1: Failing Test**

```tsx
// ExamLab/src/tests/DurchfuehrenSusReihenSkeleton.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import DurchfuehrenSusReihenSkeleton from '../components/lp/skeletons/DurchfuehrenSusReihenSkeleton'

describe('DurchfuehrenSusReihenSkeleton', () => {
  beforeEach(() => localStorage.clear())

  it('rendert 8 Reihen als Default ohne localStorage', () => {
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(8)
  })

  it('rendert gespeicherte Anzahl 22 für pruefungId="abc"', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '22')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(22)
  })

  it('clamped Anzahl 100 auf 60 (Cap)', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '100')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(60)
  })

  it('hebt Anzahl 2 auf Min 5 (visuelle Konsistenz)', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '2')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(5)
  })

  it('rendert 8 Reihen und liest kein localStorage wenn pruefungId=null', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '22')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId={null} />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(8)
  })
})
```

- [ ] **Step 2: Test FAIL**

```bash
cd ExamLab && npx vitest run src/tests/DurchfuehrenSusReihenSkeleton.test.tsx
```
Expected: FAIL — Modul fehlt

- [ ] **Step 3: Implementation**

```tsx
// ExamLab/src/components/lp/skeletons/DurchfuehrenSusReihenSkeleton.tsx
import { leseGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'

/**
 * Skeleton-Variante der SuS-Reihen-Tabelle in DurchfuehrenDashboard
 * (Lobby/Live/Auswertung-Tabs). Anzahl Reihen = letzte gesehene Klassengrösse
 * für diese pruefungId aus localStorage (Cap 60, Min 5), Fallback 8 für Erst-Login.
 */
export default function DurchfuehrenSusReihenSkeleton({ pruefungId }: { pruefungId: string | null }) {
  const key = pruefungId ? `examlab-lp-letzte-sus-anzahl-${pruefungId}` : ''
  const anzahl = key ? leseGespeicherteAnzahl(key, 8, 60) : 8
  const rendered = Math.max(anzahl, 5) // visuelle Konsistenz: nie weniger als 5

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rendered }, (_, i) => (
          <div
            key={i}
            data-testid="sus-reihe-skeleton"
            className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
          >
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-2 w-24 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Test PASS**

```bash
cd ExamLab && npx vitest run src/tests/DurchfuehrenSusReihenSkeleton.test.tsx
```
Expected: PASS (5 Tests grün)

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/skeletons/DurchfuehrenSusReihenSkeleton.tsx ExamLab/src/tests/DurchfuehrenSusReihenSkeleton.test.tsx
git commit -m "G.f.2: DurchfuehrenSusReihenSkeleton mit pruefungId-localStorage-Persist + Tests"
```

---

## Phase 2 — DurchfuehrenDashboard-Refactor

> **Achtung:** Phase 2 muss sequentiell laufen. Task 4 ändert das JSX-Layout, Task 5 fügt einen useEffect hinzu der von Task 4 abhängt, Task 6 ergänzt einen Edge-Case-Pfad. Ein einzelner Subagent oder sequentielle Subagent-Tasks.

### Task 4: Globaler Early-Return entfernen + Header/Tabs immer rendern

**Files:**
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`

**Was sich ändert:**
1. Globaler Early-Return Z. 346-352 (`if (ladeStatus === 'laden') return <BlankerSpinner />`) wird entfernt
2. `LPAppHeaderContainer` rendert immer; `aktionsButtons` werden in disabled-Variante übergeben wenn `istLadenOderConfigFehlt`
3. `TabBar` rendert immer; alle 4 Tabs `disabled: true` wenn `istLadenOderConfigFehlt`
4. Tab-Content-Bereich: Skeleton-Switch je `activeTab` (vorbereitung → `DurchfuehrenVorbereitungSkeleton`, sonst → `DurchfuehrenSusReihenSkeleton`)
5. Sekundärer Loading-Text Z. 617-623 („Prüfungskonfiguration wird geladen…") wird entfernt — wenn `!config` zeigt jetzt der Tab-Skeleton

**Recon-Stand:**
- [DurchfuehrenDashboard.tsx:346-352](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L346) — globaler Early-Return
- [DurchfuehrenDashboard.tsx:617-623](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L617) — sekundärer Loading-Text
- [DurchfuehrenDashboard.tsx:425-445](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L425) — TabBar-Block
- [DurchfuehrenDashboard.tsx:373-410](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L373) — LPAppHeaderContainer-Aufruf

- [ ] **Step 1: Imports ergänzen** (oben in DurchfuehrenDashboard.tsx)

```tsx
import DurchfuehrenVorbereitungSkeleton from '../skeletons/DurchfuehrenVorbereitungSkeleton'
import DurchfuehrenSusReihenSkeleton from '../skeletons/DurchfuehrenSusReihenSkeleton'
```

- [ ] **Step 2: Globaler Early-Return entfernen** (Z. 346-352)

Vorher:
```tsx
// Lade-Screens
if (ladeStatus === 'laden') {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <p className="text-slate-500 dark:text-slate-400">Wird geladen...</p>
    </div>
  )
}

if (ladeStatus === 'fehler' || !daten) {
```

Nachher:
```tsx
// Skeleton- vs. Voll-Layout entscheiden — bei 'laden' zeigt Tab-Content den Skeleton
const istLadenOderConfigFehlt = ladeStatus === 'laden' || !config

// Fehler-Screen nur bei explizitem Fehler-Status (oder daten=null nach erfolgreichem Lade-Abschluss)
if (ladeStatus === 'fehler' || (ladeStatus === 'fertig' && !daten)) {
```

> **Wichtig:** Die `daten === null`-Bedingung ändert sich von `!daten` (auch während laden) zu `ladeStatus === 'fertig' && !daten` (nur nach Lade-Ende). Während `ladeStatus === 'laden'` und `daten === null` zeigen wir den Skeleton, nicht die Fehler-Box.

- [ ] **Step 3: `titel` und `dauer`-Computation defensiv machen**

Z. ~371: `const titel = config?.titel || daten.pruefungTitel || pruefungId || ...`

Da `daten` jetzt während Lade null sein kann, defensiv:

```tsx
const titel = config?.titel || daten?.pruefungTitel || pruefungId || (config?.typ === 'formativ' ? 'Übung' : 'Prüfung')
```

- [ ] **Step 4: `aktionsButtons` mit disabled-Variante während Lade**

Z. ~380-409: bestehende `aktionsButtons` JSX — `disabled={istLadenOderConfigFehlt}` an Live-Toggle und Refresh-Button hinzufügen, Timer ohnehin nur bei `phase === 'aktiv'` sichtbar.

```tsx
aktionsButtons={
  <>
    <button
      disabled={istLadenOderConfigFehlt}
      onClick={() => setAutoRefresh(!autoRefresh)}
      className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
        istLadenOderConfigFehlt ? 'cursor-not-allowed opacity-50 border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500' :
        autoRefresh
          ? 'cursor-pointer bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
          : 'cursor-pointer border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
      }`}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${autoRefresh && !istLadenOderConfigFehlt ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
      Live
    </button>
    <button
      disabled={istLadenOderConfigFehlt}
      onClick={ladeDaten}
      className={`px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg transition-colors ${
        istLadenOderConfigFehlt ? 'cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-500'
                                : 'cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      ↻
    </button>
    {/* Timer in aktiver Phase — bleibt unverändert */}
    {phase === 'aktiv' && dauer && (
      <span className="text-sm font-mono text-slate-600 dark:text-slate-300">⏱ {dauer}</span>
    )}
    {phase === 'beendet' && config?.beendetUm && (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Beendet: {new Date(config.beendetUm).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
      </span>
    )}
  </>
}
```

- [ ] **Step 5: TabBar mit `disabled: true` während Lade**

Z. ~427-444: `TabBar`-Block — `disabled` pro Tab kommt aus `istTabVerfuegbar` ODER aus `istLadenOderConfigFehlt`:

```tsx
<TabBar
  tabs={TAB_CONFIG.map(({ key, label, icon }) => {
    const istAktuellePhase = phaseZuTab(phase) === key
    return {
      id: key,
      label: `${icon} ${label}`,
      disabled: istLadenOderConfigFehlt || !istTabVerfuegbar(key, phase),
      icon: !istLadenOderConfigFehlt && istAktuellePhase && activeTab !== key
        ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        : undefined,
    }
  })}
  activeTab={activeTab}
  onTabChange={(id) => wechsleTab(id as DurchfuehrenTab)}
  size="md"
/>
```

- [ ] **Step 6: Tab-Content-Skeleton-Switch**

Vorher Z. 447-614:
```tsx
{/* === Tab-Content === */}
{config && (
  <div className="max-w-7xl mx-auto w-full px-4 py-4 space-y-4 flex-1">
    {/* Vorbereitung: hidden statt unmount, ... */}
    <div className={activeTab === 'vorbereitung' ? '' : 'hidden'}>
      <VorbereitungPhase ... />
    </div>
    {activeTab === 'lobby' && daten && ( <LobbyPhase ... /> )}
    ...
  </div>
)}
{!config && (
  <div className="max-w-7xl mx-auto w-full px-4 py-4">
    <p>Prüfungskonfiguration wird geladen…</p>
  </div>
)}
```

Nachher:
```tsx
{/* === Tab-Content === */}
<div className="max-w-7xl mx-auto w-full px-4 py-4 space-y-4 flex-1">
  {istLadenOderConfigFehlt ? (
    /* Skeleton während Lade — pro activeTab */
    activeTab === 'vorbereitung'
      ? <DurchfuehrenVorbereitungSkeleton />
      : <DurchfuehrenSusReihenSkeleton pruefungId={pruefungId} />
  ) : (
    /* Echter Tab-Content — config UND daten sind hier garantiert da */
    <>
      <div className={activeTab === 'vorbereitung' ? '' : 'hidden'}>
        <VorbereitungPhase
          config={config!}
          onTeilnehmerGesetzt={(teilnehmer) => {
            setConfig({ ...config!, teilnehmer })
          }}
          onWeiterZurLobby={() => wechsleTab('lobby')}
          onConfigUpdate={async (updates) => {
            const neueConfig = { ...config!, ...updates }
            setConfig(neueConfig)
            if (user && !istDemoModus && apiService.istKonfiguriert()) {
              await apiService.speichereConfig(user.email, neueConfig)
            }
          }}
        />
      </div>

      {activeTab === 'lobby' && daten && (
        <LobbyPhase ... />  /* unverändert, config statt config! da Wrapper-Branch garantiert */
      )}

      {activeTab === 'live' && daten && (
        <AktivPhase ... />
      )}

      {activeTab === 'auswertung' && daten && pruefungId && (
        <div className="space-y-4">
          {/* Ergebnis-Übersicht (Accordion) — unverändert */}
          ...
          {/* Korrektur-Dashboard (immer sichtbar) */}
          <KorrekturDashboard pruefungId={pruefungId} eingebettet config={config!} />
        </div>
      )}
    </>
  )}
</div>

{/* Sekundären "Prüfungskonfiguration wird geladen…"-Text-Block ENTFERNEN */}
```

> **Implementation-Hinweis:** Die Skeleton-Phase und die echte Tab-Phase müssen sich in Render-Mutual-Exclusion befinden. Das `<div className={activeTab === 'vorbereitung' ? '' : 'hidden'}>`-Muster bleibt nur im echten Branch, da der Skeleton direkt rendert.

- [ ] **Step 7: TypeScript-Check**

```bash
cd ExamLab && npx tsc -b
```
Expected: clean. Wenn TS-Fehler über `config!`-non-null-assertions: in jedem Phase-Komponenten-Caller bestätigen dass `config` durch den Wrapper-Branch garantiert ist.

- [ ] **Step 8: Vitest sicherstellen**

```bash
cd ExamLab && npx vitest run
```
Expected: ~803/803 (Baseline + 9 Tests aus Phase 1). Wenn DurchfuehrenDashboard-Tests bestehen — diese werden in Task 7 erweitert.

- [ ] **Step 9: Commit**

```bash
git add ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx
git commit -m "G.f.2: DurchfuehrenDashboard — globaler Early-Return entfernt, Header+Tabs immer, Tab-Skeletons"
```

---

### Task 5: localStorage-Persist nach erfolgreichem `setDaten`

**Files:**
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`

**Was sich ändert:** Ein neuer `useEffect` schreibt `examlab-lp-letzte-sus-anzahl-{pruefungId}` sobald `daten?.schueler.length > 0` und `ladeStatus === 'fertig'`. Mit `useRef` für den letzten geschriebenen Wert, um redundante Writes bei Polling-Updates zu vermeiden (Spec-Empfehlung).

- [ ] **Step 1: Imports ergänzen**

```tsx
import { schreibeGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'
```

- [ ] **Step 2: useRef für letzten geschriebenen Wert**

Im Komponenten-Body, neben den anderen useRef-Stellen (z.B. nach `monitoringAbortRef` Z. 139):

```tsx
const letzteGeschriebeneAnzahlRef = useRef<number | null>(null)
```

- [ ] **Step 3: Persist-useEffect**

Im Komponenten-Body, am besten nach dem Auto-Refresh-useEffect (Z. ~234):

```tsx
// G.f.2 — SuS-Anzahl pro pruefungId persistieren für layout-akkurates Skeleton
useEffect(() => {
  if (ladeStatus !== 'fertig' || !pruefungId) return
  const anzahl = daten?.schueler?.length ?? 0
  if (anzahl <= 0) return
  if (letzteGeschriebeneAnzahlRef.current === anzahl) return
  schreibeGespeicherteAnzahl(`examlab-lp-letzte-sus-anzahl-${pruefungId}`, anzahl)
  letzteGeschriebeneAnzahlRef.current = anzahl
}, [ladeStatus, daten?.schueler?.length, pruefungId])
```

- [ ] **Step 4: TypeScript + vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Expected: clean / ~803/803 grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx
git commit -m "G.f.2: DurchfuehrenDashboard — localStorage-Persist SuS-Anzahl pro pruefungId mit useRef-Guard"
```

---

### Task 6: Edge-Case `ladeStatus === 'fertig' && !config` (Inline-Hinweis statt endlos-Skeleton)

**Files:**
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`

**Was sich ändert:** Wenn `ladeStatus === 'fertig'` aber `config === null` (z.B. `ladePruefung` schlug fehl, `ladeMonitoring` nicht), zeigt unsere Logik aus Task 4 den Skeleton endlos. Wir ergänzen einen Inline-Hinweis im Tab-Content-Bereich.

**Recon:** Aus dem Code (Z. 246-249) ist `ladePruefung` Teil eines `Promise.all` — wenn es fehlschlägt, wirft `Promise.all` und `abgabenGeladen.current = true` wird gesetzt obwohl Config nicht da ist. Das ist heute auch ein Bug — jetzt wird er sichtbarer.

- [ ] **Step 1: Skeleton-vs-Hinweis-Logik anpassen**

In Task 4 Step 6 hatten wir:
```tsx
{istLadenOderConfigFehlt ? (
  activeTab === 'vorbereitung'
    ? <DurchfuehrenVorbereitungSkeleton />
    : <DurchfuehrenSusReihenSkeleton pruefungId={pruefungId} />
) : ( ... echter Tab-Content ... )}
```

Erweitern auf 3-Wege-Switch:
```tsx
{ladeStatus === 'laden' ? (
  /* Echter Skeleton während Lade */
  activeTab === 'vorbereitung'
    ? <DurchfuehrenVorbereitungSkeleton />
    : <DurchfuehrenSusReihenSkeleton pruefungId={pruefungId} />
) : !config ? (
  /* Lade fertig, aber Config fehlt — Inline-Hinweis */
  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
      Prüfungskonfiguration konnte nicht geladen werden.
    </p>
    <button
      onClick={ladeDaten}
      className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
    >
      Erneut versuchen
    </button>
  </div>
) : (
  /* Echter Tab-Content — config UND daten sind hier garantiert */
  ...
)}
```

> **Anpassung:** Die Variable `istLadenOderConfigFehlt` aus Task 4 wird durch direkte Conditions ersetzt. Im `aktionsButtons`-Block und im `TabBar`-Block bleibt `istLadenOderConfigFehlt` als Disabled-Trigger korrekt (auch ohne Config sind die Buttons / Tabs nicht nutzbar).

- [ ] **Step 2: TypeScript + vitest**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Expected: clean / ~803/803 grün.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx
git commit -m "G.f.2: DurchfuehrenDashboard — Inline-Hinweis bei fertig+!config (Endlos-Skeleton vermieden)"
```

---

## Phase 3 — DurchfuehrenDashboard-Tests erweitern

### Task 7: Tests für Skeleton-Render + Persist-Trigger

**Files:**
- Modify: `ExamLab/src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx`

> **Recon-Hinweis:** Die existierende Test-Datei in `__tests__/` ist die Baseline. Erst lesen um Setup/Mocks zu verstehen, dann erweitern. Wenn `apiService` gemockt ist, kann der `ladeStatus`-Lifecycle simuliert werden.

- [ ] **Step 1: Existierende Test-Datei lesen**

```bash
cd ExamLab && cat src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx
```

Erfasse: Wie wird `apiService` gemockt? Wie wird `useAuthStore` initialisiert? Wie wird das Routing simuliert?

- [ ] **Step 2: 4 neue Tests hinzufügen**

Am Ende der `describe('DurchfuehrenDashboard', () => { ... })`-Block:

```tsx
describe('G.f.2 Skeleton-Pattern', () => {
  beforeEach(() => localStorage.clear())

  it('rendert LPAppHeaderContainer auch während ladeStatus === "laden"', async () => {
    // Mock: ladeMonitoring/ladePruefung pending — ladeStatus bleibt 'laden'
    // ... Setup analog existierende Tests, aber Promises nicht resolve
    const { container } = render(/* DurchfuehrenDashboard mit pending APIs */)
    // Header-Element vorhanden (data-testid an LPAppHeaderContainer setzen falls nicht da)
    expect(container.querySelector('header')).toBeTruthy()
  })

  it('rendert DurchfuehrenVorbereitungSkeleton wenn activeTab="vorbereitung" + laden', async () => {
    // URL ohne ?tab → activeTab default 'vorbereitung'
    const { container } = render(/* ... */)
    expect(container.querySelector('[data-testid="vorbereitung-settings-card"]')).toBeTruthy()
  })

  it('rendert DurchfuehrenSusReihenSkeleton wenn activeTab="auswertung" + laden', async () => {
    // URL ?tab=auswertung
    const { container } = render(/* ... */)
    expect(container.querySelector('[data-testid="sus-reihe-skeleton"]')).toBeTruthy()
  })

  it('schreibt examlab-lp-letzte-sus-anzahl-{pruefungId} nach erfolgreichem Lade', async () => {
    // Mock: ladeMonitoring resolved mit { schueler: [a, b, c] }
    // Mock: ladePruefung resolved mit { config, fragen }
    // setLadeStatus('fertig') wird aufgerufen
    render(/* ... */)
    await waitFor(() => {
      expect(localStorage.getItem('examlab-lp-letzte-sus-anzahl-test-pruefung-id')).toBe('3')
    })
  })
})
```

> **Test-Implementations-Hinweis:** Die exakten Mock-Setups hängen vom existierenden Test ab. Wenn der existierende Test `vi.mock` für `apiService` verwendet, hier dasselbe Pattern. Wenn nicht — minimaler Mock via `vi.spyOn(apiService, 'ladeMonitoring').mockResolvedValueOnce({ ... })`.

> **Wenn das Mock-Setup zu komplex ist:** Den Skeleton-Render-Pfad isoliert testen, indem eine Pure-Helper-Funktion `entscheideSkeletonOderInhalt(ladeStatus, config)` extrahiert wird. YAGNI — erst versuchen die Komponente direkt zu testen.

- [ ] **Step 3: Vitest grün**

```bash
cd ExamLab && npx vitest run src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx
```
Expected: alle alten + 4 neue Tests grün

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx
git commit -m "G.f.2: DurchfuehrenDashboard-Tests — Skeleton-Render + Persist-Trigger"
```

---

## Phase 4 — FragenBrowser-Refactor

### Task 8: 2 Lade-Text-Stellen durch FragenListeSkeleton ersetzen

**Files:**
- Modify: `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx`

**Recon-Stand:**
- Inline-Modus: [FragenBrowser.tsx:333-337](../../../src/components/lp/fragenbank/FragenBrowser.tsx#L333)
- Overlay-Modus: [FragenBrowser.tsx:508-512](../../../src/components/lp/fragenbank/FragenBrowser.tsx#L508)

Beide Stellen haben identisches Markup:
```tsx
{ladeStatus === 'laden' && (
  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
    Fragensammlung wird geladen...
  </p>
)}
```

- [ ] **Step 1: Import ergänzen**

```tsx
import FragenListeSkeleton from '../skeletons/FragenListeSkeleton'
```

- [ ] **Step 2: Beide Stellen ersetzen**

In beiden Render-Stellen (inline + overlay) den `<p>`-Block durch `<FragenListeSkeleton />` ersetzen:

```tsx
{ladeStatus === 'laden' && <FragenListeSkeleton />}
```

- [ ] **Step 3: TypeScript + Vitest**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Expected: clean / alle bisherigen Tests grün.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx
git commit -m "G.f.2: FragenBrowser — Lade-Text durch FragenListeSkeleton ersetzt (inline + overlay)"
```

---

### Task 9: FragenBrowser-Tests (Skeleton bei `ladeStatus === 'laden'`)

**Files:**
- Modify oder Create: `ExamLab/src/tests/FragenBrowser.test.tsx` (oder im `__tests__/`-Pfad — beim Implementer prüfen)

> **Recon:** Suche nach `FragenBrowser.test.*` — wenn nicht vorhanden, neu anlegen mit minimalem Setup. Wenn vorhanden: erweitern.

- [ ] **Step 1: Existenz prüfen**

```bash
cd ExamLab && find src -name "FragenBrowser.test.*" -o -name "FragenBrowser*.spec.*"
```

- [ ] **Step 2: Tests hinzufügen / erstellen**

Falls neue Datei: Setup analog `LPCardsSkeleton.test.tsx`, mocking `useFragenbankStore` mit Status `'idle'` oder `'summary_laden'` damit `ladeStatus === 'laden'` greift.

```tsx
// ExamLab/src/tests/FragenBrowser.test.tsx (oder Erweiterung der existierenden Datei)
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import FragenBrowser from '../components/lp/fragenbank/FragenBrowser'

vi.mock('../../store/fragenbankStore', () => ({
  useFragenbankStore: Object.assign(
    (selector: (s: unknown) => unknown) => selector({ summaries: [], fragen: [], status: 'idle' }),
    {
      getState: () => ({
        getDetail: () => null,
        ladeDetail: vi.fn(),
        lade: vi.fn(),
        setFragen: vi.fn(),
        aktualisiereFrage: vi.fn(),
        entferneFrage: vi.fn(),
        fuegeFragenHinzu: vi.fn(),
        fragen: [],
      }),
    },
  ),
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { email: 'test@stud.gymhofwil.ch' }, istDemoModus: false }),
}))

vi.mock('../../services/apiService', () => ({
  apiService: {
    istKonfiguriert: () => true,
    ladeTrackerDaten: vi.fn().mockResolvedValue(null),
    speichereFrage: vi.fn(),
    loescheFrage: vi.fn(),
    dupliziereFrage: vi.fn(),
  },
}))

describe('FragenBrowser G.f.2 Skeleton', () => {
  it('zeigt FragenListeSkeleton im inline-Modus wenn ladeStatus === laden', () => {
    const { container } = render(
      <FragenBrowser
        onHinzufuegen={() => {}}
        onSchliessen={() => {}}
        bereitsVerwendet={[]}
        inline
      />
    )
    expect(container.querySelectorAll('[data-testid="fragen-liste-skeleton-karte"]').length).toBe(8)
    expect(container.textContent).not.toContain('Fragensammlung wird geladen...')
  })

  it('zeigt FragenListeSkeleton im overlay-Modus wenn ladeStatus === laden', () => {
    const { container } = render(
      <FragenBrowser
        onHinzufuegen={() => {}}
        onSchliessen={() => {}}
        bereitsVerwendet={[]}
      />
    )
    expect(container.querySelectorAll('[data-testid="fragen-liste-skeleton-karte"]').length).toBe(8)
    expect(container.textContent).not.toContain('Fragensammlung wird geladen...')
  })
})
```

- [ ] **Step 3: Vitest grün**

```bash
cd ExamLab && npx vitest run src/tests/FragenBrowser.test.tsx
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/tests/FragenBrowser.test.tsx
git commit -m "G.f.2: FragenBrowser-Tests — Skeleton bei ladeStatus=laden (inline + overlay)"
```

---

## Phase 5 — Voll-Verify

### Task 10: tsc + vitest + build komplett grün

- [ ] **Step 1: TypeScript-Build**

```bash
cd ExamLab && npx tsc -b
```
Expected: clean (no errors).

- [ ] **Step 2: Alle Vitest**

```bash
cd ExamLab && npx vitest run
```
Expected: ~817/817 grün (Baseline ~800 + 17 neue):
- 2 FragenListeSkeleton
- 2 DurchfuehrenVorbereitungSkeleton
- 5 DurchfuehrenSusReihenSkeleton
- 4 DurchfuehrenDashboard (Erweiterung)
- 2 FragenBrowser
- 2 Reserve (falls weitere Tests sinnvoll)

- [ ] **Step 3: Production-Build**

```bash
cd ExamLab && npm run build
```
Expected: clean ohne TS-Errors / ohne neue Warnings die von G.f.2-Code stammen.

- [ ] **Step 4: Wenn alles grün — Phase 6 starten. Wenn nicht: Subagent-Loop bis grün.**

---

## Phase 6 — Browser-E2E (preview, echte Logins)

### Task 11: E2E-Test-Plan vorbereiten

**Vorab-Schritte (User):**
1. `git push origin feature/bundle-g-f-2:preview --force-with-lease` (Force-Push auf preview gemäss [feedback_preview_forcepush.md])
2. GitHub Action wartet — Build-Logs prüfen, ggf. leerer Commit für Re-Trigger
3. preview-URL ist erreichbar mit neuestem Build

**Tab-Gruppe:** Claude erstellt Tab-Gruppe via `tabs_context_mcp` mit `createIfEmpty: true`. User loggt ein:
- Tab 1: LP = `wr.test@gymhofwil.ch`
- Tab 2: SuS = `wr.test@stud.gymhofwil.ch`

User sagt „kannst loslegen" → Claude testet.

### Test-Plan: Bundle G.f.2

**Zu testende Änderungen:**

| # | Änderung | Erwartetes Verhalten | Regressions-Risiko |
|---|---|---|---|
| 1 | DurchfuehrenDashboard globaler Early-Return entfernt | Header + Tabs sofort sichtbar (≤100ms), `DurchfuehrenVorbereitungSkeleton` rendert während Lade | Buttons aktiv klickbar bevor Daten da → Race-Conditions |
| 2 | DurchfuehrenDashboard Auswertung-Tab via `?tab=auswertung` | Header + Tabs + `DurchfuehrenSusReihenSkeleton` sichtbar, dann echter Auswertung-Tab | KorrekturDashboard-Embed-Flash bei Cache-Miss = erwartet (siehe Spec) |
| 3 | localStorage-Persist | Nach Lade: `examlab-lp-letzte-sus-anzahl-{pruefungId}` ist gesetzt | Polling-Updates schreiben jeden Tick → useRef-Guard greift |
| 4 | FragenBrowser Listen-Skeleton statt Lade-Text | Header+Filter sofort, `FragenListeSkeleton` (oder direkt Liste bei IDB-Cache-Hit) | Detail-Lade-Overlay (separater Use-Case) bleibt unangetastet |

**Security-Check:**
- [ ] Skeleton enthält keine echten Daten (keine Frage-Texte, keine Schüler-Namen) → ja, alle Werte hardcoded „lorem"-Layout
- [ ] localStorage-Schreib-Trigger leakt keine sensiblen Daten → ja, nur Anzahl als Integer
- [ ] Disabled-Buttons während Lade verhindern Click-Handler-Calls → ja, `disabled`-Prop greift

**Betroffene kritische Pfade (aus regression-prevention.md):**
- [ ] **Pfad 4 LP Monitoring:** Tabs immer sichtbar — Tab-Wechsel während Lade darf nicht abstürzen, weil `daten === null`
- [ ] **Pfad 5 LP Korrektur + Auto-Korrektur:** Auswertung-Tab nach Skeleton-Phase rendert KorrekturDashboard normal

**Regressions-Tests:**
- [ ] Tab-Auto-Switch nach Phase-Wechsel (existierend) — funktioniert noch, weil `letztePhaseRef` und der `useEffect`-Wechsel-Block unverändert sind
- [ ] „Neue Durchführung"-Button im Auswertung-Tab — funktioniert noch (Reset-Pfad)
- [ ] Verbindungsfehler-Banner bei `fehlerCountRef >= 3` — funktioniert noch
- [ ] Refresh-Button → manueller `ladeDaten()` — funktioniert noch (deaktiviert während Skeleton-Phase, aktiv danach)

### E2E-Test-Pfade

> **Hinweis zur Pfad-Anzahl:** Pfade 1-4 decken die 4 Hauptänderungen aus der Tabelle ab. Pfade 5-7 sind Cross-Cutting-Tests (Theme, Inverse-Marker-Verifikation, Visual Smoke-Screenshot) — orthogonal zu den Funktions-Tests, aber Teil der Akzeptanz-Kriterien aus der Spec.

- [ ] **E2E 1: LP klickt Prüfungs-Karte → Header+Tabs sofort, Vorbereitungs-Skeleton**

LP klickt im Dashboard auf eine Prüfung (z.B. „Einrichtungsprüfung").

Erwartung:
- Header (Logo, Untertitel, Hilfe-, Einstellungen-Buttons) sofort sichtbar
- TabBar mit 4 Tabs sichtbar (alle disabled während Lade)
- Im Vorbereitungs-Tab: 2 Settings-Karten + 1 Teilnehmer-Container im Skeleton-Layout
- Nach 1-3s: Skeleton verschwindet, echter Vorbereitungs-Tab rendert

DevTools-Check (Network):
- `ladeMonitoring` + `ladePruefung` beide 200, parallel

DevTools-Check (Console):
- Keine Errors / unhandled rejections

- [ ] **E2E 2: LP öffnet beendete Prüfung mit `?tab=auswertung`**

URL direkt setzen oder über Dashboard navigieren.

Erwartung:
- Header + TabBar sichtbar sofort (Auswertung-Tab als active)
- `DurchfuehrenSusReihenSkeleton` rendert mit Default 8 Reihen (Erst-Login) oder mit gespeicherter Anzahl
- Nach Daten-Load: echte Auswertung-Tab mit Ergebnis-Übersicht-Akkordeon + KorrekturDashboard

- [ ] **E2E 3: Re-Login auf selbe Prüfung — layout-akkurate Anzahl**

LP loggt sich aus, dann wieder ein, klickt dieselbe Prüfung.

Erwartung:
- DevTools → Application → Local Storage: `examlab-lp-letzte-sus-anzahl-{pruefungId}` ist mit echter Klassengrösse gesetzt
- Beim erneuten Öffnen zeigt der Skeleton genau diese Anzahl Reihen (z.B. 22 statt 8)

- [ ] **E2E 4: LP öffnet Fragensammlung — Listen-Skeleton oder direkter Cache-Hit**

LP klickt „Fragensammlung" im Dashboard.

Erwartung:
- Header (Suche + Filter) sofort sichtbar
- Bei IDB-Cache-Hit (G.c — sehr wahrscheinlich nach erster Session): Liste rendert direkt, Skeleton kaum sichtbar
- Bei Cache-Miss (z.B. erstmaliger Login ohne Pre-Fetch): `FragenListeSkeleton` mit 8 Karten rendert ~2-3s, dann echte Liste

DevTools (Application → IndexedDB):
- `examlab-fragenbank-cache` ist befüllt nach Lade-Abschluss

- [ ] **E2E 5: Light + Dark Mode — beide Skeletons lesbar**

Theme-Toggle (Login-Screen oder UI), Pfade 1-4 visuell prüfen.

Erwartung:
- Light: `bg-slate-200` + `bg-slate-100` Pulse-Elemente kontrastreich gegen weisse Karten
- Dark: `dark:bg-slate-700` + `dark:bg-slate-600` Pulse-Elemente kontrastreich gegen `dark:bg-slate-800` Karten

- [ ] **E2E 6: Inverse-Test — Skeleton verschwindet wenn Daten da**

In E2E 1 + E2E 2 nach Lade-Abschluss:
- Skeleton-Marker (`data-testid="vorbereitung-settings-card"`, etc.) NICHT mehr im DOM
- Echter Tab-Inhalt (z.B. `<VorbereitungPhase>`) gerendert

DevTools-Console-Check:
```js
document.querySelectorAll('[data-testid="vorbereitung-settings-card"]').length === 0
document.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length === 0
```

- [ ] **E2E 7: Visual Smoke-Test screenshot**

Screenshot von Pfad 1 + 2 + 4 in Light + Dark Mode → optisch im Plan-Review als Beleg anhängen.

---

## Phase 7 — Merge

### Task 12: HANDOFF-Update + Merge auf main

- [ ] **Step 1: HANDOFF.md aktualisieren** ([HANDOFF.md](../../../HANDOFF.md))

Neuer Abschnitt am Anfang (vor S154):

```markdown
### Aktueller Stand (S155, 27.04.2026) — Bundle G.f.2 auf `main`

**Was die Session machte:** Spec via brainstorming-Skill (Reviewer-approved) → Plan via writing-plans-Skill (Reviewer-approved) → Implementation via subagent-driven-development (12 Tasks) → Voll-Verify → Browser-E2E mit echten Logins → Merge.

**Was Bundle G.f.2 macht:** G.f-Skeleton-Pattern auf 2 weitere Hochlast-Views ausgerollt:
- DurchfuehrenDashboard: globaler Early-Return entfällt → Header + Tabs sofort, Tab-spezifische Skeletons (Vorbereitung-Variante + SuS-Reihen-Variante mit pruefungId-localStorage-Persist)
- FragenBrowser: 2 Lade-Text-Stellen (inline + overlay) durch FragenListeSkeleton ersetzt

**Architektur:**
- 3 neue Skeleton-Komponenten in src/components/lp/skeletons/
- localStorage-Key: examlab-lp-letzte-sus-anzahl-{pruefungId} (Cap 60, Min 5)
- useRef-Guard gegen redundante Writes bei Polling-Updates
- Inline-Hinweis bei `fertig + !config` (statt Endlos-Skeleton)
- KorrekturDashboard explizit out-of-scope (G.d.1 Pre-Warm-Cache deckt das ab)

**Test-Stand:** ~817 vitest grün (~800 baseline + 17 neue) | tsc clean | build OK
**Browser-E2E auf preview:** 7/7 Pfade grün

(Merge-Commit + Detail-Commits ergänzen nach Merge)
```

- [ ] **Step 2: Final-Verify auf Branch**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 3: User-Freigabe abwarten**

Claude meldet:
> „G.f.2 bereit für Merge. Browser-E2E-Verifikation auf preview erfolgreich. Bitte bestätige Merge auf main."

- [ ] **Step 4: Nach Freigabe — Merge mit `--no-ff`**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git merge --no-ff feature/bundle-g-f-2 -m "$(cat <<'EOF'
Merge G.f.2: App-weit Skeleton-Pattern (DurchfuehrenDashboard + FragenBrowser)

Bundle G.f.2 rollt das in G.f etablierte Skeleton-Pattern auf 2 weitere
LP-Hochlast-Views aus.

DurchfuehrenDashboard:
- Globaler Early-Return entfällt → Header + Tabs sofort sichtbar (~100ms
  statt 1-3s blanker Bildschirm)
- Tab-spezifischer Skeleton: DurchfuehrenVorbereitungSkeleton (Settings-
  Karten + Teilnehmer-Liste) für vorbereitung, DurchfuehrenSusReihenSkeleton
  (SuS-Reihen-Tabelle) für lobby/live/auswertung
- localStorage-Persist pro pruefungId (Key examlab-lp-letzte-sus-anzahl-{id},
  Cap 60, Min 5) für layout-akkurates Re-Login-Skeleton
- useRef-Guard gegen redundante Writes bei Polling-Updates
- Inline-Hinweis bei `fertig + !config` (statt Endlos-Skeleton)

FragenBrowser:
- 2 Lade-Text-Stellen (inline + overlay) durch FragenListeSkeleton (8 Karten
  fest, kein Persist) ersetzt
- Header + Filter waren bereits sofort sichtbar

KorrekturDashboard explizit out-of-scope (G.d.1 Pre-Warm-Cache <500ms macht
eigenen Skeleton nicht gerechtfertigt).

Test-Stand: ~817 vitest grün (~800 baseline + 17 neue) | tsc clean | build OK
Browser-E2E auf preview: 7/7 Pfade grün (echte Logins)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: HANDOFF.md committen + push**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/HANDOFF.md
git commit -m "S155: HANDOFF aktualisiert — G.f.2 auf main"
git push origin main
```

- [ ] **Step 6: Branch-Cleanup**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git branch -d feature/bundle-g-f-2
git push origin --delete feature/bundle-g-f-2
```

---

## Geschätzte Subagent-Sessions

12 Tasks total:
- Phase 1 (Skeleton-Komponenten): 3 Tasks parallel-fähig
- Phase 2 (DurchfuehrenDashboard-Refactor): 3 Tasks sequentiell
- Phase 3 (DurchfuehrenDashboard-Tests): 1 Task
- Phase 4 (FragenBrowser-Refactor): 2 Tasks sequentiell
- Phase 5 (Voll-Verify): 1 Task
- Phase 6 (Browser-E2E): 1 Task User-mediated
- Phase 7 (Merge): 1 Task User-mediated

**Erwartete Zeit:** 1 Implementations-Session via subagent-driven-development.

---

## Was wir explizit NICHT in G.f.2 machen

- **KorrekturDashboard-Skeleton** (eingebettete + standalone Variante) — Out-of-Scope. Pre-Warm-Cache aus G.d.1 macht Lade-Flash <500ms, separate Komponente nicht gerechtfertigt. Kann später als G.f.3 nachgezogen werden falls UX-Feedback negativ.
- **Phase-Komponenten-Skeletons** (LobbyPhase, AktivPhase, BeendetPhase, VorbereitungPhase intern) — diese rendern erst nach Daten-Load und haben eigene Empty-States.
- **Apps-Script-Änderungen** — frontend-only.
- **Skeleton mit echten Vorab-Daten aus IDB-Cache** — G.c IDB-Cache liefert Liste in 1ms (Cache-Hit), Skeleton flashed praktisch nicht; YAGNI.
- **Animations-Framework** (Framer-Motion, Shimmer) — Tailwind `animate-pulse` reicht (Konsistenz mit G.f).
- **Refactor LPStartseite.tsx** — separate Aufgabe wenn überhaupt nötig.
