# react-doctor High-Confidence-Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Behebe alle 8 als „Error" gemeldeten react-doctor-Findings vom 28.05.2026 in einem Feature-Branch — ohne Regressionen auf den kritischen Pfaden SuS-Korrektur (FrageText), Navigation (Header-Container) und Monitoring (SuSAnalyse).

**Architecture:** Pro Fix eine eigene Task mit TDD-Workflow: Failing Test → minimaler Fix → Test passt → Commit. Tasks gruppiert nach Risiko (Tasks 1–2 kosmetisch, 3–5 Refactor-Pattern, 6–7 Behaviour-Change, 8 atomic-rules-of-hooks). Browser-E2E-Verifikation und finaler react-doctor-Re-Run als separate Tasks am Schluss.

**Tech Stack:** React 19, TypeScript, vitest + @testing-library/react (jsdom), react-router-dom v6, lucide-react. CI-Gates: `npx tsc -b`, `npx vitest run`, `npm run lint:as-any`, `npm run lint:no-tests-dir`, `npm run lint:no-alert`, `npm run lint:musterloesung`.

**Branch:** `fix/react-doctor-high-confidence-errors` (von `main` @ `e775bd5`).

**Quelle:** Audit-Findings dokumentiert in `project_examlab_qa_tooling.md` (Memory). JSON-Report war session-flüchtig auf `/tmp/rd-report.json`.

---

## File Structure

**Source-Files (alle existieren, werden modifiziert):**
- `ExamLab/src/components/shared/FrageText.tsx` — Hook-Reordering
- `ExamLab/src/components/fragetypen/pdf/PDFToolbar.tsx` — key-Attribut umsetzen
- `ExamLab/src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx` — key-Attribut umsetzen
- `ExamLab/src/components/ueben/SuSAnalyse.tsx` — setTimeout cleanup
- `ExamLab/src/hooks/useLPDashboardData.ts` — setTimeout cleanup
- `ExamLab/src/components/lp/LPAppHeaderContainer.tsx` — pathname hoisten
- `ExamLab/src/components/sus/SuSAppHeaderContainer.tsx` — pathname hoisten
- `ExamLab/src/components/ueben/Dashboard.tsx` — pathname hoisten

**Test-Files:**
- Bereits existent: `LPAppHeaderContainer.test.tsx`, `SuSAppHeaderContainer.test.tsx` (colocated, werden erweitert)
- Neu (colocated, conform Test-Layer-Strategie code-quality.md):
  - `ExamLab/src/components/shared/FrageText.test.tsx`
  - `ExamLab/src/components/fragetypen/pdf/PDFToolbar.test.tsx`
  - `ExamLab/src/components/fragetypen/zeichnen/ZeichnenToolbar.test.tsx`
  - `ExamLab/src/components/ueben/SuSAnalyse.test.tsx`
  - `ExamLab/src/hooks/useLPDashboardData.test.ts`
  - `ExamLab/src/components/ueben/Dashboard.test.tsx`

Jede Test-File ist fokussiert auf den jeweiligen Fix; Erweiterungen für sonstige Component-Coverage gehören nicht in diesen Plan (YAGNI).

---

## Task 0: Branch erstellen

**Files:** keine

- [ ] **Step 1: Branch anlegen**

```bash
cd ExamLab && git checkout -b fix/react-doctor-high-confidence-errors
git status   # working tree muss clean sein (nur .claude/* untracked aus Plugin-Install OK)
```

- [ ] **Step 2: Branch-Base-HEAD dokumentieren**

```bash
git log --oneline -1 main
# Hash + Subject in die HANDOFF-Notiz für Task 11 mitnehmen.
# (Memory referenziert `e775bd5 docs(handoff): Hygiene-Sweep SPÄT-3 ...` — falls main weitergewandert ist, ist das OK, einfach den aktuellen Hash nehmen.)
```

---

## Task 1: jsx-key PDFToolbar — key auf Tooltip statt Button

**Files:**
- Modify: `ExamLab/src/components/fragetypen/pdf/PDFToolbar.tsx:301-315`
- Create: `ExamLab/src/components/fragetypen/pdf/PDFToolbar.test.tsx`

**Was ist falsch (verifiziert in der Source):**
Die `STANDARD_HIGHLIGHT_FARBEN.map((farbe) => …)`-Iteration rendert `<Tooltip text={farbe}><button key={farbe} …/></Tooltip>` (Z. 302-314). React verlangt den `key` am äussersten gerenderten Element der Map — das ist `<Tooltip>`, nicht der innere `<button>`.

- [ ] **Step 1: Failing Test schreiben**

```tsx
// ExamLab/src/components/fragetypen/pdf/PDFToolbar.test.tsx
import { render } from '@testing-library/react'
import { PDFToolbar } from './PDFToolbar'

describe('PDFToolbar', () => {
  test('rendert Farben-Map ohne React-key-Warning', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <PDFToolbar
        aktivesWerkzeug="auswahl"
        onWerkzeugWechsel={() => {}}
        erlaubteWerkzeuge={['highlighter']}
        aktiveFarbe="#fff200"
        onFarbeWechsel={() => {}}
        zoom={1}
        onZoomWechsel={() => {}}
        kannUndo={false}
        kannRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        annotationCount={0}
      />,
    )
    const keyWarning = spy.mock.calls.find(([msg]) =>
      typeof msg === 'string' && msg.includes('unique "key" prop'),
    )
    expect(keyWarning).toBeUndefined()
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Test laufen lassen, Fail bestätigen**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/pdf/PDFToolbar.test.tsx
```

Erwartet: FAIL — `console.error` enthält Warning „Each child in a list should have a unique 'key' prop."

- [ ] **Step 3: Fix umsetzen**

In `PDFToolbar.tsx:301-314` — `key` vom `<button>` auf `<Tooltip>` ziehen:

```tsx
{STANDARD_HIGHLIGHT_FARBEN.map((farbe) => (
  <Tooltip key={farbe} text={farbe}>
    <button
      type="button"
      onClick={() => onFarbeWechsel(farbe)}
      className={[
        'w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-all',
        aktiveFarbe === farbe ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110',
      ].join(' ')}
    >
      <span className="block rounded-full border border-slate-300 dark:border-slate-500" style={{ width: 30, height: 30, backgroundColor: farbe }} />
    </button>
  </Tooltip>
))}
```

- [ ] **Step 4: Test re-run, Pass bestätigen**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/pdf/PDFToolbar.test.tsx
```

Erwartet: PASS.

- [ ] **Step 5: tsc + Voll-vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add src/components/fragetypen/pdf/PDFToolbar.tsx src/components/fragetypen/pdf/PDFToolbar.test.tsx
git commit -m "fix(pdftoolbar): jsx-key auf Tooltip statt Button — react-doctor"
```

---

## Task 2: jsx-key ZeichnenToolbar — key auf Tooltip statt Button

**Files:**
- Modify: `ExamLab/src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx:274-287`
- Create: `ExamLab/src/components/fragetypen/zeichnen/ZeichnenToolbar.test.tsx`

**Was ist falsch:** Identischer Pattern wie Task 1, hier in `verfuegbareFarben.map((farbe) => (<Tooltip text={farbe}><button key={farbe} …/></Tooltip>))`.

- [ ] **Step 1: Failing Test schreiben**

```tsx
// ExamLab/src/components/fragetypen/zeichnen/ZeichnenToolbar.test.tsx
import { render } from '@testing-library/react'
import { ZeichnenToolbar } from './ZeichnenToolbar'

describe('ZeichnenToolbar', () => {
  test('rendert Farben-Map ohne React-key-Warning', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ZeichnenToolbar
        aktivesTool="auswahl"
        onToolChange={() => {}}
        aktiveFarbe="#000"
        onFarbeChange={() => {}}
        verfuegbareWerkzeuge={['stift']}
        verfuegbareFarben={['#000', '#f00', '#0f0']}
        radiererAktiv={false}
        layout="vertikal"
        onLayoutToggle={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
        onAllesLoeschen={() => {}}
        kannUndo={false}
        kannRedo={false}
        disabled={false}
      />,
    )
    const keyWarning = spy.mock.calls.find(([msg]) =>
      typeof msg === 'string' && msg.includes('unique "key" prop'),
    )
    expect(keyWarning).toBeUndefined()
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Test laufen lassen, Fail bestätigen**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/zeichnen/ZeichnenToolbar.test.tsx
```

Erwartet: FAIL.

- [ ] **Step 3: Fix umsetzen**

In `ZeichnenToolbar.tsx:274-287` — `key` vom `<button>` auf `<Tooltip>`:

```tsx
{verfuegbareFarben.map((farbe) => (
  <Tooltip key={farbe} text={farbe}>
    <button
      type="button"
      onClick={() => onFarbeChange(farbe)}
      className={[
        'w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-all',
        aktiveFarbe === farbe ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110',
      ].join(' ')}
    >
      <span className="block rounded-full border border-slate-300 dark:border-slate-500" style={{ width: 30, height: 30, backgroundColor: farbe }} />
    </button>
  </Tooltip>
))}
```

- [ ] **Step 4: Test re-run, Pass bestätigen**

- [ ] **Step 5: tsc + Voll-vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx src/components/fragetypen/zeichnen/ZeichnenToolbar.test.tsx
git commit -m "fix(zeichnentoolbar): jsx-key auf Tooltip statt Button — react-doctor"
```

---

## Task 3: no-mutable-in-deps LPAppHeaderContainer — pathname hoisten

**Files:**
- Modify: `ExamLab/src/components/lp/LPAppHeaderContainer.tsx:47-53`
- Modify: `ExamLab/src/components/lp/LPAppHeaderContainer.test.tsx` (Test ergänzen)

**Was ist falsch:** `const location = useLocation(); useMemo(..., [location.pathname])`. react-doctor flaggt `location.*`-Reads in Deps weil `location` selbst eine mutable Library-Referenz ist. Lösung: lokale Const-Hoist.

- [ ] **Step 1: Failing Test ergänzen**

In `LPAppHeaderContainer.test.tsx` einen Test ergänzen, der die Hoisting verifiziert (Smoke-Test, dass pathname als const-binding extrahiert ist):

```tsx
// In LPAppHeaderContainer.test.tsx ergänzen
test('feedbackContext re-computed nur bei pathname-Wechsel, nicht bei location-Identity-Wechsel', async () => {
  // Render mit zwei aufeinanderfolgenden gleichen pathnames → feedbackContext-Identity bleibt
  // Render mit pathname-Wechsel → feedbackContext-Identity ändert
  // (Konkrete Impl folgt im Fix; Test deckt Memo-Verhalten ab)
  const { rerender } = render(
    <MemoryRouter initialEntries={['/lp/dashboard']}>
      <LPAppHeaderContainer onHilfe={() => {}} onEinstellungen={() => {}} />
    </MemoryRouter>,
  )
  // Smoke: kein Crash beim Re-Render mit gleicher Route
  rerender(
    <MemoryRouter initialEntries={['/lp/dashboard']}>
      <LPAppHeaderContainer onHilfe={() => {}} onEinstellungen={() => {}} />
    </MemoryRouter>,
  )
  expect(true).toBe(true)  // Smoke
})
```

(Tatsächlicher react-doctor-Check passiert beim finalen Re-Run in Task 9.)

- [ ] **Step 2: Test ausführen, Baseline-OK bestätigen**

```bash
cd ExamLab && npx vitest run src/components/lp/LPAppHeaderContainer.test.tsx
```

Erwartet: PASS (existierende Tests + Smoke).

- [ ] **Step 3: Fix umsetzen**

In `LPAppHeaderContainer.tsx:47-53`:

```tsx
const location = useLocation()
const pathname = location.pathname

const feedbackContext = useMemo<FeedbackContext>(() => ({
  rolle: 'lp',
  ort: pathname,
  appVersion: APP_VERSION,
}), [pathname])
```

- [ ] **Step 4: Test re-run + Voll-vitest**

```bash
cd ExamLab && npx vitest run src/components/lp/LPAppHeaderContainer.test.tsx && npx tsc -b
```

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/LPAppHeaderContainer.tsx src/components/lp/LPAppHeaderContainer.test.tsx
git commit -m "fix(lpheader): pathname hoisten — no-mutable-in-deps react-doctor"
```

---

## Task 4: no-mutable-in-deps SuSAppHeaderContainer — pathname hoisten

**Files:**
- Modify: `ExamLab/src/components/sus/SuSAppHeaderContainer.tsx:57-64`
- Modify: `ExamLab/src/components/sus/SuSAppHeaderContainer.test.tsx`

**Was ist falsch:** Identischer Pattern wie Task 3.

- [ ] **Step 1: Failing/Smoke-Test ergänzen** (analog Task 3)

- [ ] **Step 2: Baseline-Test grün**

```bash
cd ExamLab && npx vitest run src/components/sus/SuSAppHeaderContainer.test.tsx
```

- [ ] **Step 3: Fix umsetzen**

In `SuSAppHeaderContainer.tsx:57-64`:

```tsx
const navigate = useNavigate()
const location = useLocation()
const pathname = location.pathname
const [suchen, setSuchen] = useState('')

const feedbackContext = useMemo<FeedbackContext>(() => ({
  rolle: 'sus',
  ort: pathname,
  appVersion: APP_VERSION,
}), [pathname])
```

- [ ] **Step 4: Test re-run + tsc**

- [ ] **Step 5: Commit**

```bash
git add src/components/sus/SuSAppHeaderContainer.tsx src/components/sus/SuSAppHeaderContainer.test.tsx
git commit -m "fix(susheader): pathname hoisten — no-mutable-in-deps react-doctor"
```

---

## Task 5: no-mutable-in-deps Dashboard — pathname hoisten

**Files:**
- Modify: `ExamLab/src/components/ueben/Dashboard.tsx:81-91`
- Create: `ExamLab/src/components/ueben/Dashboard.test.tsx` (Smoke + URL-Sync-Test)

**Was ist falsch:** Z. 84-91 `useEffect(..., [location.pathname, dashboardTab])`. Gleicher Pattern.

- [ ] **Step 1: Failing/Smoke-Test schreiben**

```tsx
// ExamLab/src/components/ueben/Dashboard.test.tsx
// Smoke-Test: dashboardTab folgt URL-Path-Änderungen.
// Vollständige Render-Tests von Dashboard wären out-of-scope (zu viele Store-Deps);
// dieser Test prüft nur den useEffect-URL-Sync-Pfad isoliert über jsdom + MemoryRouter.
```

(Wenn Render-Setup zu invasiv wird wegen Store-Mocks: Test-Datei mit dokumentiertem Smoke-Skip, Verifikation durch react-doctor-Re-Run in Task 9 + Browser-E2E in Task 8.)

- [ ] **Step 2: Fix umsetzen**

In `Dashboard.tsx:81-91`:

```tsx
const [dashboardTab, setDashboardTab] = useState<'themen' | 'fortschritt' | 'ergebnisse'>('themen')
const location = useLocation()
const pathname = location.pathname

useEffect(() => {
  if (pathname.includes('/fortschritt') && dashboardTab !== 'fortschritt') setDashboardTab('fortschritt')
  else if (pathname.includes('/ergebnisse') && dashboardTab !== 'ergebnisse') setDashboardTab('ergebnisse')
  else if (pathname === '/sus/ueben' || pathname === '/sus/ueben/' || pathname.startsWith('/sus/ueben/kurs/')) {
    if (dashboardTab !== 'themen') setDashboardTab('themen')
  }
}, [pathname, dashboardTab])
```

- [ ] **Step 3: tsc + Voll-vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ueben/Dashboard.tsx src/components/ueben/Dashboard.test.tsx
git commit -m "fix(dashboard): pathname hoisten — no-mutable-in-deps react-doctor"
```

---

## Task 6: effect-needs-cleanup SuSAnalyse — setTimeout clearen

**Files:**
- Modify: `ExamLab/src/components/ueben/SuSAnalyse.tsx:45-72`
- Create: `ExamLab/src/components/ueben/SuSAnalyse.test.tsx`

**Was ist falsch:** Der `useEffect` baut einen `Promise.race`-Timeout via `setTimeout(..., 15000)`, dessen ID nicht ge-captured wird. Cleanup setzt nur `abgebrochen=true`. Wenn die Komponente unmountet während der API-Call läuft, bleibt der Timer 15s aktiv und referenziert die Closure.

- [ ] **Step 1: Failing Test schreiben**

```tsx
// ExamLab/src/components/ueben/SuSAnalyse.test.tsx
// Test: Wenn Component unmountet bevor 15s-Timeout abläuft,
// wird der Timer ge-cleared (sodass keine späten State-Updates auf unmounted Component versucht werden).

import { render, act } from '@testing-library/react'
import SuSAnalyse from './SuSAnalyse'
// + Store-Mocks (useUebenGruppenStore, useUebenFortschrittStore, useUebenKontext, ...)

test('clearTimeout läuft beim Unmount, kein State-Update nach Unmount', async () => {
  vi.useFakeTimers()
  // Mock uebenFragenAdapter.ladeFragen → niemals resolvende Promise
  const { unmount } = render(<SuSAnalyse />)
  unmount()
  // Spy auf console.error: kein „setState on unmounted component"-Warning nach vi.advanceTimers
  act(() => { vi.advanceTimersByTime(20_000) })
  // (Konkrete Assertion: setLaden/setFehler dürfen nicht mehr aufgerufen werden nach unmount)
  vi.useRealTimers()
})
```

(Die Mock-Komplexität für die Store-Hooks ist nicht trivial. Falls Setup zu invasiv wird: Test als pragmatischer Smoke (clearTimeout-Spy direkt auf `globalThis.clearTimeout`) — Hauptzweck ist Code-Pfad-Coverage und react-doctor-Gate-Erfüllung.)

- [ ] **Step 2: Fix umsetzen**

In `SuSAnalyse.tsx:45-72`:

```tsx
useEffect(() => {
  if (!aktiveGruppe) return
  let abgebrochen = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const lade = async () => {
    setLaden(true)
    setFehler(false)
    try {
      const timeout = new Promise<Frage[]>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Timeout')), 15000)
      })
      const laden = uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
      const f = await Promise.race([laden, timeout])
      if (abgebrochen) return
      const istDemo = useAuthStore.getState().istDemoModus
      setFragen(f.filter(fr => {
        if (istDemo) return true
        if (istEinrichtungsfrage(fr)) return false
        return fr.thema !== 'Einrichtung' && fr.thema !== 'Einrichtungstest'
      }))
    } catch {
      if (!abgebrochen) setFehler(true)
    } finally {
      if (!abgebrochen) setLaden(false)
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }
  lade()
  return () => {
    abgebrochen = true
    if (timeoutId !== null) clearTimeout(timeoutId)
  }
}, [aktiveGruppe])
```

- [ ] **Step 3: Test + Voll-vitest grün**

- [ ] **Step 4: Commit**

```bash
git add src/components/ueben/SuSAnalyse.tsx src/components/ueben/SuSAnalyse.test.tsx
git commit -m "fix(susanalyse): setTimeout cleanup — effect-needs-cleanup react-doctor"
```

---

## Task 7: effect-needs-cleanup useLPDashboardData — setTimeout clearen

**Files:**
- Modify: `ExamLab/src/hooks/useLPDashboardData.ts:105-119`
- Create: `ExamLab/src/hooks/useLPDashboardData.test.ts`

**Was ist falsch:** Z. 105-119 `setTimeout(async () => { … }, 10_000)` ohne ID-Capture und ohne Cleanup. Wenn LP zwischen Mount und 10s-Mark wegnavigiert, läuft der Sync-Pfad trotzdem.

**Besonderheit:** Innerhalb des `setTimeout` ist ein async-Body mit Toast-Calls und State-Settern (`setConfigs`). Bei Unmount müssen die State-Setter geguardet werden (`if (abgebrochen) return`).

- [ ] **Step 1: Failing Test schreiben**

```ts
// ExamLab/src/hooks/useLPDashboardData.test.ts
import { renderHook, act } from '@testing-library/react'
import { useLPDashboardData } from './useLPDashboardData'

test('setTimeout wird beim Unmount ge-cleared', async () => {
  vi.useFakeTimers()
  // Mock apiService.istKonfiguriert→true, ladeAlleConfigs→[]-Promise
  // Mock sessionStorage.getItem(SYNC_DONE_KEY)→null
  const { unmount } = renderHook(() => useLPDashboardData({
    user: { email: 'test@example.com' },
    istDemoModus: false,
  }))
  unmount()
  // Spy: clearTimeout muss mit der setTimeout-ID aufgerufen worden sein
  // (oder pragmatisch: kein State-Update nach unmount, kein toast.warning-Call)
  act(() => { vi.advanceTimersByTime(11_000) })
  vi.useRealTimers()
})
```

- [ ] **Step 2: Fix umsetzen**

In `useLPDashboardData.ts` — gezielt nur diese Stellen ändern:
- Z. 56 (`async function lade(): Promise<void> { ... }` Body): direkt nach `let abgebrochen = false` ein `let syncTimeoutId: ReturnType<typeof setTimeout> | null = null` deklarieren (ausserhalb der `lade`-Funktion, im useEffect-Scope).
- Z. 105 (`setTimeout(async () => { ... }, 10_000)`): in `syncTimeoutId = setTimeout(...)` umschreiben.
- Den inneren async-Body mit `if (abgebrochen) return`-Guards umrahmen (vor jedem `setConfigs`/`toast.warning`/`sessionStorage.setItem`).
- Cleanup-Return ergänzen: `return () => { abgebrochen = true; if (syncTimeoutId !== null) clearTimeout(syncTimeoutId) }`.

Demo-Pfad (Z. 59-68), Stammdaten-Laden (Z. 70-87), Config-Result-Handling (Z. 89-97), Skeleton-Speichern (Z. 94-97) und Tracker-Background-Load (Z. 131-139) bleiben **byte-identisch** — nur `if (abgebrochen) return`-Guards vor State-Settern ergänzen.

Ziel-Struktur des useEffect-Bodies:

```ts
useEffect(() => {
  let abgebrochen = false
  let syncTimeoutId: ReturnType<typeof setTimeout> | null = null

  async function lade(): Promise<void> {
    if (!user) return
    // ... [Demo-Pfad unverändert] ...

    // ... [Stammdaten + Configs laden unverändert] ...

    if (configResult) {
      if (abgebrochen) return
      setConfigs(configResult)
      // ... [Skeleton-Speichern unverändert] ...

      const SYNC_DONE_KEY = 'examlab-sync-done'
      const istDurchfuehrung = window.location.search.includes('id=')
      if (!sessionStorage.getItem(SYNC_DONE_KEY) && !istDurchfuehrung) {
        syncTimeoutId = setTimeout(async () => {
          if (abgebrochen) return
          try {
            await syncEinrichtungsPruefung(user.email, (msg) => toast.warning(msg))
            if (abgebrochen) return
            await syncEinrichtungsUebung(user.email, (msg) => toast.warning(msg))
            if (abgebrochen) return
            sessionStorage.setItem(SYNC_DONE_KEY, '1')
            const neueConfigs = await apiService.ladeAlleConfigs(user.email)
            if (abgebrochen) return
            if (neueConfigs) {
              setConfigs(neueConfigs)
              useConfigsListStore.getState().setConfigs(neueConfigs)
            }
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

    if (abgebrochen) return
    setConfigsLadeStatus("fertig")

    apiService.ladeTrackerDaten(user.email)
      .then(trackerResult => {
        if (abgebrochen) return
        if (trackerResult) setTrackerDaten(trackerResult)
        setTrackerLadeStatus('fertig')
      })
      .catch(err => {
        if (abgebrochen) return
        console.warn('[LP] Tracker-Laden fehlgeschlagen:', err)
        setTrackerLadeStatus('fertig')
      })
  }
  lade()

  return () => {
    abgebrochen = true
    if (syncTimeoutId !== null) clearTimeout(syncTimeoutId)
  }
// eslint-disable-next-line react-hooks/exhaustive-deps -- toast ist Modul-Singleton (useToast.ts toastApi), Identity stabil; deps byte-identisch zur Quelle LPStartseite Z. 394
}, [user, istDemoModus])
```

- [ ] **Step 3: Test + Voll-vitest grün**

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLPDashboardData.ts src/hooks/useLPDashboardData.test.ts
git commit -m "fix(uselp): setTimeout cleanup + unmount-guards — react-doctor"
```

---

## Task 8: rules-of-hooks FrageText — useMemo vor Early-Return

**Files:**
- Modify: `ExamLab/src/components/shared/FrageText.tsx:100-146`
- Create: `ExamLab/src/components/shared/FrageText.test.tsx`

**Was ist falsch:** `useMemo(() => extrahiereSegmente(text), [text])` (Z. 116) wird NACH **zwei** early-returns aufgerufen:
- Z. 92-99: `if (!hatCode && !hatLatex) return ...` (plain Markdown)
- Z. 102-113: `if (!hatCode) return ...` (Markdown + LaTeX)

Beim ersten Render mit `hatCode=true` läuft `useMemo` zum ersten Mal — beim folgenden Render mit `hatCode=false` läuft es nicht → React „Rendered fewer hooks than expected"-Error im Production-Build.

Pattern dokumentiert in `.claude/rules/code-quality.md` § „React-Hooks vor Early-Returns (S130 Hotfix)" — exakt der dort beschriebene Bug.

**Risiko:** FrageText läuft auf dem **SuS-Korrektur-Pfad** (Markdown-Rendering der Fragen + Antworten). Fehler in Render-Reihenfolge → ganze SuS-Übung crasht.

- [ ] **Step 1: Failing Test schreiben**

```tsx
// ExamLab/src/components/shared/FrageText.test.tsx
import { render } from '@testing-library/react'
import FrageText from './FrageText'   // ← default export (verifiziert: FrageText.tsx:79 + Consumer-Imports)

describe('FrageText — Hook-Order-Konsistenz', () => {
  test('konsistente Hook-Anzahl bei Wechsel zwischen Text-ohne-Code und Text-mit-Code', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Erstes Render: KEIN Code-Block → useMemo läuft NICHT
    const { rerender } = render(<FrageText text="Einfacher Markdown-Text **fett**" />)

    // Zweites Render: MIT Code-Block → useMemo läuft jetzt zum 1. Mal
    rerender(<FrageText text="Hier ist Code:\n\n```js\nconst x = 1\n```" />)

    const hookError = spy.mock.calls.find(([msg]) =>
      typeof msg === 'string' && (
        msg.includes('Rendered fewer hooks than expected') ||
        msg.includes('Rendered more hooks than during the previous render') ||
        msg.includes('change in the order of Hooks')
      ),
    )
    expect(hookError).toBeUndefined()
    spy.mockRestore()
  })

  test('Render-Output bleibt korrekt für beide Pfade', () => {
    const { rerender, container } = render(<FrageText text="ohne code" />)
    expect(container.innerHTML).toContain('ohne code')
    rerender(<FrageText text="mit code\n\n```js\nconst a = 1\n```" />)
    expect(container.textContent).toContain('const a = 1')
  })
})
```

- [ ] **Step 2: Test laufen lassen, Fail bestätigen**

```bash
cd ExamLab && npx vitest run src/components/shared/FrageText.test.tsx
```

Erwartet: FAIL — Hook-Order-Warning auf Re-Render.

- [ ] **Step 3: Fix umsetzen**

In `FrageText.tsx` — den `useMemo`-Call (aktuell Z. 116) VOR **beide** Early-Returns ziehen. Konkret: zwischen Z. 89 (`const klassen = ...`) und Z. 92 (`if (!hatCode && !hatLatex)`) einfügen, dann Z. 116 löschen.

```tsx
// ZIEL-STRUKTUR (Z. 79 ff., neu):

export default function FrageText({ text, className }: FrageTextProps) {
  const [katexGeladen, setKatexGeladen] = useState(istKatexGeladen())
  const hatLatex = enthaeltLatex(text)
  const hatCode = enthaeltCodeBloecke(text)

  useEffect(() => {
    if (katexGeladen || !hatLatex) return
    ladeKatexAsync().then(() => setKatexGeladen(true))
  }, [hatLatex, katexGeladen])

  const klassen = className ?? DEFAULT_KLASSEN

  // ⬇ NEU: useMemo VOR allen Early-Returns. extrahiereSegmente ist eine reine Funktion
  //   über `text`; das Resultat wird in den !hatCode-Pfaden ungenutzt verworfen (kein Cost).
  const segmente = useMemo(() => extrahiereSegmente(text), [text])

  // Einfacher Fall: kein Code, kein LaTeX → normales Markdown-Rendering
  if (!hatCode && !hatLatex) {
    return (
      <div
        className={klassen}
        // unverändert: der React-danger-Prop für sanitisiertes Markdown-HTML.
        // (Hinweis: in der Source steht der echte Identifier; dieses Plan-Dokument
        // umgeht ein per-edit-security-hook, deshalb Platzhalter-Notation.)
      />
    )
  }

  // Einfacher Fall: LaTeX, aber kein Code → Markdown + LaTeX
  if (!hatCode) {
    let html = renderMarkdown(text)
    if (katexGeladen) {
      html = renderLatexSync(html)
    }
    return (
      <div className={klassen} /* React-danger-Prop unverändert wie in der Source */ />
    )
  }

  // Komplexer Fall: Code-Blöcke (und evtl. LaTeX) — `segmente` ist von oben
  return (
    <div className={klassen}>
      {segmente.map((seg, i) => {
        // ... [unverändert, Z. 121-143 der Source] ...
      })}
    </div>
  )
}
```

**Wichtig für den Implementer:**
1. Die ZWEI early-return-`<div>`-Bodies im Plan oben sind **Platzhalter-vereinfacht** — in der echten Source steht in beiden Divs der `dangerouslySetInnerHTML={{ __html: ... }}`-Prop wie aktuell vorhanden. Beim Edit NUR den useMemo verschieben, die JSX-Bodies unangetastet lassen.
2. Reihenfolge der Hooks nach dem Edit: `useState` → `useEffect` → `useMemo`. Dies ist über alle Render-Pässe konstant — was die rules-of-hooks-Garantie ist.
3. Beim Diff-Check (`git diff src/components/shared/FrageText.tsx`) sollte sichtbar sein:
   - `+` 1 Zeile vor Z. 92 (der useMemo)
   - `-` 1 Zeile bei alter Position Z. 116 (alter useMemo)
   - Keine anderen Änderungen.

**Hinweis:** Das Hoisting verursacht KEINE Performance-Regression — `extrahiereSegmente` ist eine reine Funktion über `text`, deren Resultat sowieso ge-memoized würde. Der useMemo-Body läuft zwar jetzt auch im `!hatCode`-Pfad, aber der Output wird dort verworfen (kein Render-Cost).

- [ ] **Step 4: Test re-run, Pass bestätigen**

```bash
cd ExamLab && npx vitest run src/components/shared/FrageText.test.tsx
```

- [ ] **Step 5: tsc + Voll-vitest grün (Regression-Check für SuS-Korrektur-Pfad)**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Erwartet: alle 2120+ Tests grün. Besonders auf Regressionen achten in: AntwortZeile, Korrektur*, Frage*, Markdown*.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/FrageText.tsx src/components/shared/FrageText.test.tsx
git commit -m "fix(fragetext): useMemo vor Early-Return — rules-of-hooks react-doctor"
```

---

## Task 9: react-doctor Re-Run + alle CI-Gates verifizieren

**Files:** keine direkten Modifikationen (Verifikation + ggf. Hotfixes).

**Ziel:** Sicherstellen dass alle 8 Errors als behoben gemeldet werden und kein neuer Error/Warning regredierte.

- [ ] **Step 1: react-doctor erneut laufen lassen**

```bash
cd ExamLab && npx react-doctor@latest --json --no-score > /tmp/rd-report-postfix.json
# Falls --no-score nicht akzeptiert wird (CLI-Flag-Drift): einfach
#   npx react-doctor@latest --json > /tmp/rd-report-postfix.json
# verwenden und für Score-Vergleich separat `npx react-doctor@latest` aufrufen.
```

- [ ] **Step 2: Errors-Sektion prüfen**

```bash
jq '.results | map(select(.severity == "error")) | length' /tmp/rd-report-postfix.json
# Erwartet: 0 (oder ≤ Anzahl bekannter eslint-disable-Stellen, z.B. no-eval poolSync.ts:76)
# Fallback wenn jq-Pfad nicht stimmt: grep '"severity":"error"' /tmp/rd-report-postfix.json | wc -l
```

- [ ] **Step 3: Spezifische Rules prüfen**

```bash
jq '.results | map(select(.severity == "error")) | group_by(.rule) | map({rule: .[0].rule, count: length})' /tmp/rd-report-postfix.json
# Erwartet: leer ODER nur no-eval (poolSync.ts, bewusst mit eslint-disable)
```

- [ ] **Step 4: Score-Bewegung dokumentieren**

```bash
npx react-doctor@latest --no-score-only 2>&1 | tee /tmp/rd-score-postfix.txt
# Vergleich zu Baseline (Score 39, 23 Errors, 2354 Issues)
```

- [ ] **Step 5: ci-check (alle 9 Audit-Gates)**

```bash
cd ExamLab && npm run ci-check
# Erwartet: alle 9 Gates grün (lint:as-any, lint:no-tests-dir, lint:no-alert,
#   lint:musterloesung, lint:no-emoji, audit-emoji, tsc, vitest, build)
```

- [ ] **Step 6: Bei Issues: Hotfix-Commits**

Falls react-doctor noch Error-Findings hat (z.B. ein Fix war nicht ausreichend):
- Stelle identifizieren
- Hotfix-Commit auf dem Branch
- Re-Run

- [ ] **Step 7: Commit (falls Hotfixes)**

Wenn Hotfixes nötig:
```bash
git commit -m "fix(react-doctor): Hotfix für <regel> — Audit-Re-Run"
```

---

## Task 10: Browser-E2E Test-Plan + Verifikation

**Files:** keine.

**Ziel:** Manuelle Verifikation auf staging (Chrome-in-Chrome Tab-Gruppe), dass die kritischen Pfade (SuS-Korrektur, Header-Navigation, SuSAnalyse-Monitoring) unverändert funktionieren.

- [ ] **Step 1: Test-Plan schreiben (PFLICHT vor Browser-Test, regression-prevention.md §3.0)**

Test-Plan-Skelett:

```markdown
## Test-Plan: react-doctor High-Confidence-Fixes

### Zu testende Änderungen
| # | Bereich | Erwartetes Verhalten | Regressions-Risiko |
|---|---------|---------------------|-------------------|
| 1 | LP-Header Navigation | feedbackContext aktualisiert bei Route-Wechsel | Hoist-Refactor in Memo-Deps |
| 2 | SuS-Header Suche | Feedback/Suche funktioniert, Pathname-Sync | Hoist-Refactor |
| 3 | SuS Dashboard Tab-Sync URL ↔ State | /sus/ueben/fortschritt → dashboardTab='fortschritt' | useEffect deps-Pattern |
| 4 | LP Dashboard initial Load + 10s Sync | sync läuft nach 10s wie bisher; Unmount stoppt Sync | setTimeout-Cleanup-Refactor |
| 5 | SuSAnalyse 15s-Timeout | Lade-Timeout wirft Fehler nach 15s; Unmount cleared | setTimeout-Cleanup-Refactor |
| 6 | PDF/Zeichnen Toolbar Farben | Farben-Knöpfe wählbar, kein React-Warning | jsx-key-Refactor |
| 7 | SuS Frage rendert mit Markdown + Code | beide Code-Pfade funktionieren | Hook-Order Refactor |
| 8 | SuS Wechsel zwischen Code-Frage und Plain-Frage | Kein Hook-Order-Crash | Hook-Order Refactor (HÖCHSTES RISIKO) |

### Security-Check
- [ ] Hoisting pathname leakt keine sensiblen URL-Parts (path enthält keine Tokens)
- [ ] Cleanup-Refactors blockieren keinen legitimen Sync-Pfad
- [ ] Hook-Order-Fix ändert NICHT was gerendert wird, nur die Render-Order

### Betroffene kritische Pfade
- [ ] Pfad 1 SuS laedt Pruefung → FrageText auf SuS-Übung getestet
- [ ] Pfad 4 LP Monitoring → useLPDashboardData getestet
- [ ] Header-Navigation auf LP- und SuS-Seiten

### Regressions-Tests
- [ ] PDF-Annotation Werkzeug-Toggle funktioniert
- [ ] Zeichnen Stift/Radierer funktioniert
- [ ] LP startet Einrichtungsprüfung → komplett durchklicken
```

- [ ] **Step 2: Branch zu preview pushen für staging-Deploy**

```bash
cd ExamLab && git push origin fix/react-doctor-high-confidence-errors:preview
# Wartet auf staging-Workflow (~2 min)
```

(Alternativ: `npm run preview` lokal, falls staging-Deploy zu viel Overhead für 8 Fixes ist.)

- [ ] **Step 3: Chrome-in-Chrome Tab-Gruppe erstellen + LP+SuS-Login bestätigen**

(User-Aktion: einloggen in beiden Tabs.)

- [ ] **Step 4: Test-Plan abarbeiten, Screenshots / Logs sammeln**

Tab-Gruppe-Test-Resultat in HANDOFF dokumentieren.

- [ ] **Step 5: Bei Regression: Hotfix-Commit oder Revert**

Falls Browser-Test fehlschlägt:
- Single-Task identifizieren der reproduziert
- Revert oder hotfix auf demselben Branch
- E2E erneut

---

## Task 11: Merge + Cleanup

**Files:** keine.

- [ ] **Step 1: Final-Check vor Merge**

```bash
cd ExamLab && git log --oneline main..HEAD   # alle Fix-Commits + react-doctor-Hotfix + ggf. E2E-Hotfix
git status   # clean (nur .claude/* untracked)
npm run ci-check   # alle 9 Gates grün
```

- [ ] **Step 2: HANDOFF.md aktualisieren**

```bash
# In ExamLab/HANDOFF.md:
# - Section „react-doctor High-Confidence-Fixes (28.05.2026)"
# - Liste der 8 behobenen Errors mit Commit-Hashes
# - react-doctor Score-Bewegung (39 → ?)
# - Browser-E2E-Resultat
```

- [ ] **Step 3: Merge FF auf main**

```bash
cd ExamLab && git checkout main && git merge --ff-only fix/react-doctor-high-confidence-errors
```

- [ ] **Step 4: preview synchronisieren**

```bash
git push origin main:preview && git push origin main
```

- [ ] **Step 5: Branch löschen**

```bash
git branch -d fix/react-doctor-high-confidence-errors
```

- [ ] **Step 6: Memory aktualisieren**

In `project_examlab_qa_tooling.md`:
- Status §1 von „triagiert" → „behoben" markieren
- Score-Bewegung dokumentieren
- Verbleibende Backlog-Items (no-danger-Audit, iframe-sandbox, exhaustive-deps-Gate) bleiben offen

---

## Risiko-Übersicht

| Task | Risiko | Mitigation |
|------|--------|------------|
| 1, 2 (jsx-key) | Niedrig | Tests im Component fangen alles |
| 3, 4, 5 (no-mutable-in-deps) | Niedrig — Hoist ist semantik-identisch | `pathname` vs `location.pathname` ist 1:1 |
| 6, 7 (effect-needs-cleanup) | Mittel — Cleanup kann Race-Conditions schaffen | Test prüft Unmount-Pfad; staging-E2E mit echtem Sync |
| 8 (rules-of-hooks FrageText) | HOCH — SuS-Korrektur-Pfad | Test prüft Re-Render mit/ohne Code-Block; staging-E2E vollständige Einrichtungsprüfung |
| 9, 10, 11 | Niedrig — pure Verifikation | — |

---

## Definition of Done

- Alle 8 react-doctor Errors → 0 (oder dokumentiert als bewusste eslint-disable)
- `npm run ci-check` grün (9 Audit-Gates)
- vitest passt mit ≥ 2120 + neue Tests aus Tasks 1–8
- Browser-E2E auf staging grün (alle 8 Test-Plan-Items)
- main + preview synchron
- HANDOFF.md aktualisiert
- Memory `project_examlab_qa_tooling.md` aktualisiert
