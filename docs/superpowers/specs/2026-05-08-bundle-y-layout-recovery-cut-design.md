# Bundle Y — Layout.tsx Recovery-Cut

**Datum:** 2026-05-08
**Branch:** `bundle-y/layout-recovery-cut`
**Phase:** Phase-5+ Hotspot-Reduction (nach Bundle X)
**Cut-Strategie:** Hook-Extraktion (Pure-State-Hook) + Render-Sub-Komponente + Dead-Code-Removal

---

## 1 · Kontext & Ziel

### Target-Datei
`ExamLab/src/components/Layout.tsx` — **570 Zeilen**, im Hotspot-Set Files >500 Z.

### Hotspot-Position
Aktuell 8 Files >500 Z. nach Bundle X (HilfeSeite 906, ConfigTab 747, EinstellungenPanel 607, BilanzERFrage 589, AktivPhase 573, **Layout 570**, PruefungsComposer 526, ZeichnenCanvas 518). Bundle Y erledigt Layout als 7. File mit niedrig-mittel Risiko (props-less SuS-Prüfungs-Layout, keine bestehenden Tests).

### Logische Bereiche im Source-File
| Zeilen | Bereich | Charakter | Cut? |
|---|---|---|---|
| 1-31 | Imports (~30) | Module-load | bleibt |
| 32-43 | localStorage-Migration `pruefung-sidebar-breite` → `sidebar-pruefung-sidebar-breite` (~12 Z.) | Side-Effect-IIFE | **gelöscht (M3)** |
| 45-65 | Hook-Aufrufe Stores + lokaler State (~21 Z.) | Stateful (bleibt) | bleibt |
| 66-72 | PDF-Prefetch + `usePrefetchAssets` (~7 Z.) | Stateful (bleibt) | bleibt |
| 74-79 | Tab-Konflikt + Demo-Modus (~6 Z.) | Stateful (bleibt) | bleibt |
| 81-87 | Lockdown-Setup (~7 Z.) | Stateful (bleibt) | bleibt |
| 89-112 | `usePruefungsMonitoring`-Setup mit Callbacks (~24 Z.) | Stateful (bleibt) | bleibt |
| 114-126 | Verstoss-Overlay-State+Effect (~13 Z.) | Stateful (bleibt) | bleibt (Out-of-Scope) |
| 128-133 | Vollbild-Exit-Effect (~6 Z.) | Stateful (bleibt) | bleibt |
| 135-143 | Sidebar-Resize-Hook (~9 Z.) | Stateful (bleibt) | bleibt |
| 145-151 | UX-Hook + Callbacks (~7 Z.) | Stateful (bleibt) | bleibt |
| 153-158 | LP-Nachrichten-Hook (~6 Z.) | Stateful (bleibt) | bleibt |
| 160-174 | Material-Toggle-Callbacks (~15 Z.) | Stateful (bleibt) | bleibt (Out-of-Scope) |
| **176-220** | **Recovery-Logik** (useState + useRef + komplexer useEffect mit API-Call + Timeout, ~45 Z.) | **State-Maschine** | **→ Hook** |
| **222-255** | **Recovery-Render** (2 frühe Returns: Loading-Spinner + Failed-Screen mit Reset-Button, ~34 Z.) | **JSX** | **→ Sub-Komponente** |
| 257-268 | Render-Computations (aktuelleFrage, abschnittInfo, fortschritt, ~12 Z.) | Pure compute (bleibt) | bleibt |
| 270-569 | Main JSX Header + Sidebar + Main + Material-Panel + Banner + Overlays (~300 Z.) | UI (bleibt) | bleibt |

### Konsumenten-Surface
2 Caller verifiziert via grep:
- `ExamLab/src/App.tsx:354` — `<FrageModeProvider mode="pruefung"><Layout /></FrageModeProvider>`
- `ExamLab/src/components/lp/vorbereitung/SuSVorschau.tsx:112` — `<Layout />` für LP-Vorschau-Render

`Layout` ist **props-less default-export**. Public-Surface unverändert. **Kein Caller-Edit nötig.**

### Bestehende Test-Coverage
**Keine Tests** für Layout.tsx oder die Recovery-Logik. Cut bringt erstmals isolierte Vitest-Coverage.

### Migration-Block-Hintergrund (M3-Begründung)
Der localStorage-Migration-Block (Z. 32-43) wurde am 2026-04-24 (Commit `16f4b4f`, „ResizableSidebar + Layout-aside + MaterialPanel auf useResizableHandle migriert") eingeführt. Heute 2026-05-08, **2 Wochen aktiv**. Comment im Code: „Nach einigen Wochen kann dieser Block entfernt werden." Risiko bei Löschung: User die in den letzten 2 Wochen die App nicht geöffnet haben verlieren ihre Sidebar-Breite-Präferenz (Reset auf Default 224px). **Kein Datenverlust, kein Funktions-Bruch** — User zieht die Breite einmal neu. Akzeptiert.

### Ziel-Metriken
- `Layout.tsx` schrumpft **570 → ~483 Zeilen** (≤500-Schwelle Master-Spec, ~17 Z. Margin).
- Hotspot-Bilanz Files >500 Z. (ohne `data/` + Test): **8 → 7**.
- +7 neue Vitest-Tests (1480 → 1487, optional +8 mit Timeout-Test).

---

## 2 · Architektur & Files

### Cut-Strategie

Recovery-State-Maschine (44 Z.) wandert in Custom-Hook `usePruefungsRecovery`. Recovery-Render-JSX (34 Z.) wandert in 1 Render-Komponente `PruefungsRecoveryStatus`. localStorage-Migration-IIFE (12 Z.) wird ersatzlos gelöscht. **Side-Effect-Aufteilung** (Bundle-W.b-Pattern): Hook macht Pure-State-Maschine + API-Call, Komponente macht Reset-Aktion (`window.confirm` + `usePruefungStore.reset()` + `window.location.reload()`).

### 1 neues File `ExamLab/src/hooks/usePruefungsRecovery.ts` (~50 Z.)

Konsistent zu existierenden Hooks (`useDurchfuehrenLoad.ts`, `useFragenAutoSave.ts`, `useDirtyTracker.ts`). Flat in `hooks/`, kein Sub-Folder.

```typescript
// ExamLab/src/hooks/usePruefungsRecovery.ts
import { useState, useEffect, useRef, useMemo } from 'react'
import { usePruefungStore } from '../store/pruefungStore'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/apiService'
import { resolveFragenFuerPruefung } from '../utils/fragenResolver'

export type PruefungsRecoveryStatus = 'idle' | 'loading' | 'failed'

export interface UsePruefungsRecoveryResult {
  status: PruefungsRecoveryStatus
}

const RECOVERY_TIMEOUT_MS = 10_000

export function usePruefungsRecovery(): UsePruefungsRecoveryResult {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const user = useAuthStore((s) => s.user)

  const pruefungIdAusUrl = useMemo(
    () => new URLSearchParams(window.location.search).get('id'),
    []
  )

  const [status, setStatus] = useState<PruefungsRecoveryStatus>('idle')
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    if (config && fragen.length > 0) return
    if (recoveryAttempted.current) return
    if (!pruefungIdAusUrl || !user?.email) {
      setStatus('failed')
      return
    }

    recoveryAttempted.current = true
    setStatus('loading')

    const timeout = setTimeout(() => {
      setStatus('failed')
    }, RECOVERY_TIMEOUT_MS)

    apiService.ladePruefung(pruefungIdAusUrl, user.email)
      .then((result) => {
        clearTimeout(timeout)
        if (result) {
          const { navigationsFragen, alleFragen: resolvedAlle } =
            resolveFragenFuerPruefung(result.config, result.fragen)
          usePruefungStore.getState().setConfigUndFragen(
            result.config, navigationsFragen, resolvedAlle
          )
          if (result.config.durchfuehrungId) {
            usePruefungStore.getState().setDurchfuehrungId(result.config.durchfuehrungId)
          }
          console.log('[Layout] Recovery erfolgreich — config+fragen wiederhergestellt')
        } else {
          setStatus('failed')
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        console.error('[Layout] Recovery fehlgeschlagen:', err)
        setStatus('failed')
      })

    return () => clearTimeout(timeout)
  }, [config, fragen, pruefungIdAusUrl, user])

  return { status }
}
```

**Public-Surface:** `{ status }`. Hook ist self-contained — verbindet sich direkt zu Stores via Selectors + ruft Store-Mutationen via `getState()` (Pattern aus `useFragenAutoSave.ts`).

**Side-Effect-Aufteilung:**
- IM Hook: State-Mutationen `setStatus`, Ref-Mutation `recoveryAttempted.current`, API-Call `apiService.ladePruefung`, Store-Mutationen via `getState()`.
- AUSSERHALB Hook (in `<PruefungsRecoveryStatus />`): `window.confirm`, `window.location.reload()`, `usePruefungStore.reset()`.

### 1 neues File `ExamLab/src/hooks/usePruefungsRecovery.test.ts` (~120 Z.)

7 Vitest-Cases mit Mocks für `apiService` + Store-Selectors:

```typescript
// Test-Skelett (vollständig im Plan)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePruefungsRecovery } from './usePruefungsRecovery'

vi.mock('../services/apiService')
vi.mock('../store/pruefungStore')
vi.mock('../store/authStore')
vi.mock('../utils/fragenResolver')

describe('usePruefungsRecovery', () => {
  beforeEach(() => { /* setup default mocks: missing config, missing fragen */ })

  it('idle wenn config+fragen vorhanden', /* ... */)
  it('failed wenn kein url-id', /* ... */)
  it('failed wenn kein user', /* ... */)
  it('success: setConfigUndFragen + setDurchfuehrungId, timeout cleared', /* ... */)
  it('failed wenn api-result null', /* ... */)
  it('failed + console.error wenn api-throws', /* ... */)
  it('recoveryAttempted-guard: 2× Re-Render → 1× API-Call', /* ... */)
})
```

**Optional 8. Test:** Timeout-Pfad mit `vi.useFakeTimers()` — wenn fragil, skip + dokumentieren.

### 1 neues File `ExamLab/src/components/PruefungsRecoveryStatus.tsx` (~38 Z.)

```tsx
// ExamLab/src/components/PruefungsRecoveryStatus.tsx
import { usePruefungStore } from '../store/pruefungStore'

export interface PruefungsRecoveryStatusProps {
  status: 'loading' | 'failed'
}

export default function PruefungsRecoveryStatus({ status }: PruefungsRecoveryStatusProps) {
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Sitzung wird wiederhergestellt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-2">Prüfungsdaten konnten nicht wiederhergestellt werden.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Ihre bisherigen Antworten gehen beim Zurücksetzen verloren.</p>
        <button
          onClick={() => {
            if (window.confirm('Alle bisherigen Antworten gehen verloren. Fortfahren?')) {
              usePruefungStore.getState().reset()
              window.location.reload()
            }
          }}
          className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Zurück zum Start
        </button>
      </div>
    </div>
  )
}
```

**Tailwind-Klassen byte-identisch** zum Original. DRY beim `min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900`-Wrapper.

### Edit `ExamLab/src/components/Layout.tsx` (570 → ~483 Z.)

**Imports oben:**
- ENTFERNEN: `useRef`, `useEffect`, `useMemo` (falls nach Cut nicht mehr gebraucht — verifizieren in Plan-Phase: `useEffect` für Vollbild-Exit-Effect Z. 129-133 + Verstoss-Overlay-Effect Z. 120-126 + Monitoring-Setup-Body bleibt; `useRef` für `vorherigerZaehler` Z. 117 bleibt; `useMemo` für `naechsteFragePdfUrls` Z. 67 bleibt). **Konkret:** vermutlich keine Import-Removals nötig — alle 3 React-Hooks bleiben aus anderen Gründen.
- ENTFERNEN: `apiService`, `resolveFragenFuerPruefung` (nur in Recovery-useEffect verwendet → mit Hook raus).
- HINZUFÜGEN: `usePruefungsRecovery` aus `../hooks/usePruefungsRecovery`.
- HINZUFÜGEN: `PruefungsRecoveryStatus` aus `./PruefungsRecoveryStatus`.

**Body-Änderungen:**
- Z. 32-43 (localStorage-Migration-IIFE) → **gelöscht**.
- Z. 176-220 (Recovery-State + Effect) → **ersetzt durch:**
  ```tsx
  const { status: recoveryStatus } = usePruefungsRecovery()
  ```
- Z. 222-255 (Recovery-Render mit 2 frühen Returns) → **ersetzt durch:**
  ```tsx
  if (!config || fragen.length === 0) {
    return (
      <PruefungsRecoveryStatus status={recoveryStatus !== 'failed' ? 'loading' : 'failed'} />
    )
  }
  ```

**Übrige JSX (Z. 270-569):** unverändert.

---

## 3 · Verhaltens-Invarianten

Byte-equivalence-Beweis pro Recovery-Pfad:

| Pfad | Original (Z. 222-255) | Neu (Hook + Komponente) |
|---|---|---|
| **idle:** config+fragen vorhanden | Effect Z. 184 returnt früh → kein Render-Branch → Hauptcontent | Hook returnt `idle`, Layout-Body trifft `if (!config || fragen.length === 0)` nicht → Hauptcontent |
| **loading:** Recovery läuft | `recoveryStatus !== 'failed'` → Loading-Spinner-JSX | Hook returnt `loading`, `<PruefungsRecoveryStatus status="loading" />` |
| **failed:** missing-url, missing-user, api-fail, timeout | `recoveryStatus === 'failed'` → Failed-JSX mit Button | Hook returnt `failed`, `<PruefungsRecoveryStatus status="failed" />` |
| **success-Pfad:** API-Antwort mit config+fragen | Hook ruft `setConfigUndFragen` → Re-Render mit gefülltem Store → Layout-Body trifft `if (!config || fragen.length === 0)` nicht → Hauptcontent | identisch |
| **success ohne durchfuehrungId** | `if (result.config.durchfuehrungId)` skip | identisch |
| **API timeout (10s)** | `setRecoveryStatus('failed')` | `setStatus('failed')` |
| **Effect-cleanup auf unmount** | `return () => clearTimeout(timeout)` | identisch |
| **`recoveryAttempted`-Guard** | useRef verhindert Re-Trigger | identisch |
| **Reset-Aktion** | inline `window.confirm + reset + reload` | in Komponente, identisch |

**Tailwind-Klassen-Identity:** Komponenten-Render byte-identisch zur Source-Region Z. 226-253.

---

## 4 · Test-Strategie

### Unit (vitest)
- 7 Cases für `usePruefungsRecovery` (s. § 2). Coverage: alle 5 Status-Übergänge + recoveryAttempted-Guard + console.error-Side-Effect.
- Optional 8. Case: Timeout via FakeTimers.
- **Keine** isolierten Tests für `<PruefungsRecoveryStatus />` (trivial Switch-Render auf Status-Prop, keine zusätzliche Logik). Begründung: minimaler Wert vs. Wartungsaufwand, JSX byte-identisch zum Original.

### Browser-E2E
**SKIPPED** — Bundle-X-Stil. Begründung:
- Layout ist props-less, kein Caller-Edit-Risiko.
- Recovery-Pfad nur durch Reload+URL-id+missing-Store-State triggerbar (selten in E2E).
- vitest deckt State-Maschine vollständig ab.
- Falls Bug-Report: Spawn-Task „Browser-E2E manuell mit F5-Recovery-Flow" als Notiz.

### Statische Gates
- `tsc -b` clean.
- 4 Lint-Gates clean: `lint:as-any` (Total 0), `lint:no-alert` (0 Treffer im neuen Code — Komponente nutzt `window.confirm`, das ist erlaubt; falls `lint:no-alert` `confirm` umfasst → siehe § 5 Risiko), `lint:no-tests-dir`, `lint:musterloesung` (Baseline-Drift = 0).
- `vite build` grün, PWA-generateSW OK.

---

## 5 · Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Mitigation |
|---|---|---|
| **`lint:no-alert` umfasst `window.confirm`** und blockt Komponente | mittel | Plan-Phase prüft `eslint-config`-Regel-Pattern. Wenn ja: nutze custom Bestätigungs-Dialog (BaseDialog) oder behalte mit eslint-disable-Kommentar mit Begründung. |
| **Recovery-Hook resolveFragenFuerPruefung-Aufruf nicht 1:1** | niedrig | Plan-Phase: Pre-Cut-Diff zeigt: Hook ruft `resolveFragenFuerPruefung(result.config, result.fragen)` byte-identisch auf. Test #4 verifiziert via Mock-Spy. |
| **Migration-Block-Löschung (M3) bricht User-Sidebar** | niedrig | Komfort-Reset (224px Default), keine Funktions-Bruch. User zieht Breite einmal neu. Akzeptiert. |
| **Forecast 570 → 483 Z. zu optimistisch (Bundle-W.b-Lehre)** | mittel | Plan-Phase macht detaillierte Inline-Variable-Removal-Math (Subtract-Add-Net per Bundle-W.b-Methodik). Selbst bei realistisch 495 Z. → trotzdem unter Schwelle. |
| **`useEffect`-Cleanup-Funktion `clearTimeout(timeout)` nicht migriert** | niedrig | Plan-Phase: Hook-Body verifiziert mit Pre-Cut-Diff. Test #4 verifiziert clearTimeout via mock-spy. |
| **vitest-Mock-Setup für Zustand-Stores komplex** | mittel | Pattern aus `useFragenAutoSave.test.tsx` (vorhanden) wiederverwenden. Plan-Phase referenziert das Mock-Pattern explizit. |
| **2 Caller (App.tsx, SuSVorschau.tsx)** | niedrig | Props-less default-export — **kein Caller-Edit**. Beide Caller verifiziert. |
| **Recovery-Effect-Order in Layout** | niedrig | Hook-Call ersetzt Z. 176-220 1:1 — gleiche Position im Render-Tree. Andere Hooks (Z. 75-174) bleiben in identischer Reihenfolge. |
| **`pruefungIdAusUrl` useMemo wandert mit ins Hook** | niedrig | Im Source als eigene Variable `pruefungIdAusUrl` deklariert (Z. 177), nur in Recovery-useEffect verwendet → wandert mit. Falls woanders genutzt (in Plan-Phase prüfen) → bleibt im Layout. **Pre-Plan-grep-Step:** `grep -n "pruefungIdAusUrl" Layout.tsx` zeigt alle Use-Sites. |

---

## 6 · Architektur-Patterns (etabliert/wiederverwendet)

- **Side-Effect-Aufteilung als Pattern für Hook-Cuts** (Bundle-W.b) — Hook macht State-Maschine + API-Call, Komponente macht UI-Aktionen (`window.confirm` + `reload`). Hook bleibt isoliert vitest-testbar ohne Browser-Mock.
- **Self-contained Hook mit Store-getState-Pattern** (`useFragenAutoSave.ts`) — Hook konsumiert Stores via Selectors für Read, ruft `getState()` für Write. Erlaubt Hook ohne Props-Setup zu mounten.
- **Render-Sub-Komponente mit Status-Prop für JSX-Cuts** (Bundle-T.b-Single-Komponente-Pattern) — `<PruefungsRecoveryStatus status={...} />` internalisiert beide Branches mit DRY-Wrapper.
- **Dead-Code-Removal als Bonus-Cut** (Bundle-W.b-Twin-Cleanup-Pattern) — localStorage-Migration ist Code-Schuld, mit kommentiertem Sunset-Hinweis. Cut-Bundle als natürlicher Anlass für die Removal.

---

## 7 · Definition of Done (Bundle-S/L-Standard)

- [ ] `Layout.tsx` ≤ 500 Z. (Hotspot-Bilanz 8 → 7).
- [ ] vitest grün, +7 oder +8 neue Tests, kein Drift bei bestehenden 1480.
- [ ] tsc -b clean.
- [ ] 4 Lint-Gates clean (`lint:as-any`, `lint:no-alert`, `lint:no-tests-dir`, `lint:musterloesung`).
- [ ] vite build grün.
- [ ] Per-Phase Spec-Compliance + Code-Quality-Reviewer ✅.
- [ ] Final Code-Reviewer „APPROVED FOR MERGE".
- [ ] Browser-E2E SKIPPED (low-risk Hook-Cut, vitest covers state-machine).
- [ ] HANDOFF.md Bundle-Y-Eintrag.
- [ ] Memory-Update: `project_bundle_y_komplett.md` + ggf. neue Lehren in `feedback_*.md`.

---

## 8 · Out of Scope (Spawn-Tasks für Phase-5+)

Bewusst nicht in Bundle Y enthalten:
- **Header-JSX-Cut** (~80 Z., Bundle-V-Stil): bleibt Phase-5+ Roadmap. Eigenes Bundle wenn Hotspot-Druck später wieder steigt.
- **Banner-JSX-Cut** (~50 Z., SEB+Tab-Konflikt+LP-Nachrichten+Beenden-Banner): bleibt.
- **Material-Modus-Hook** (~15 Z. State + 2 Callbacks + 4 JSX-Use-Sites): bleibt.
- **Verstoss-Overlay-Hook** (~13 Z. useState+useRef+useEffect): bleibt.
- **Monitoring-Setup-Callbacks-Cleanup** (~24 Z. Lockdown-Meta-Builder): bleibt.

Phase-5+ Hotspot-Roadmap nach Bundle Y: **7 Files >500 Z.** verbleibend (HilfeSeite, ConfigTab, EinstellungenPanel, BilanzERFrage, AktivPhase, PruefungsComposer, ZeichnenCanvas).

---

## 9 · Reviewer-Checkliste

**Spec-Document-Reviewer prüft:**
- [ ] Cut-Strategie kohärent mit Bundle-Family (X/W.b/T.d-Pattern)?
- [ ] Hook-Surface minimal + wirkungs-äquivalent?
- [ ] Test-Cases decken alle State-Übergänge?
- [ ] Risiken adressiert (insbesondere `lint:no-alert` + Forecast-Konservativität)?
- [ ] Out-of-Scope sauber abgegrenzt?
- [ ] Side-Effect-Aufteilung Bundle-W.b-konform?
