# Bundle T.c — FragenBrowser Hook-Extraktion + Body-Komponenten Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `FragenBrowser.tsx` (768 Z., mittel-Risiko) per 2 Hook-Extraktionen + 2 Komponenten-Splits zerlegen, ohne Verhaltensänderung. Ziel: ~225 Z. im Hauptfile (Master-Spec-Ziel <500). Hotspot-Bilanz Files >500 Z. **11 → 10**.

**Architecture:** 2 Hooks flach in `src/hooks/` (analog `useFragenAutoSave`/`useFragenFilter`): `useFragenEditor` (Editor + AutoSave + Schliessen-Modal mit un-delete-Race-Mitigation gekapselt) und `useFragenAktionen` (Backend-Async-Handler-Cluster). 2 Komponenten in existing `fragenbrowser/`-Sub-Folder: `<FragenBrowserBody>` (eliminiert ~150 Z. inline/overlay-Render-Duplikat) und `<LoeschBestaetigungsDialog>` (heutige Inline-JSX). State-Holder-Caller bleibt schlank mit Modal-Toggles + fragenStats-Loader + Hook-Aufrufen + Body-Mount.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Vitest. Bundle-T-Master-Spec Sektion 4.1 (LP-Bereich-Hook-Konvention).

**Spec:** [`docs/superpowers/specs/2026-05-07-bundle-t-c-fragen-browser-design.md`](../specs/2026-05-07-bundle-t-c-fragen-browser-design.md)

**Master-Spec:** [`docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md`](../specs/2026-05-06-bundle-t-hooks-splits-design.md), Sektion 6.3

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Branch:** `feature/bundle-t-c-fragen-browser` (bereits angelegt von main + Spec auf Branch committed: `916c64f` + `56be4ce`)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output prüfen (Lehre `feedback_tsc_b_exit_misleading`)

---

## File Map

### Neue Files

| Datei | Größe | Verantwortung |
|---|---:|---|
| `ExamLab/src/hooks/useFragenAktionen.ts` | ~80-100 Z. | Backend-Async-Handler-Cluster + loeschKandidat-State |
| `ExamLab/src/hooks/useFragenEditor.ts` | ~180-200 Z. | Editor-State + AutoSave + Schliessen-Modal (un-delete-Race gekapselt) + Neighbor-Prefetch |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/LoeschBestaetigungsDialog.tsx` | ~50 Z. | Custom Modal (heute Inline-JSX Z. 511-540) |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx` | ~120-140 Z. | Gemeinsamer Body inline + overlay (Header + DraftsSection + Liste + Detail-Lade + leerer-State) |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx` | 768 Z. | ~225 Z. | Wrapper-Dispatcher (inline/overlay) + State-Holder (Modal-Toggles + fragenStats) + Hook-Aufrufe + Modal-Mounts |

### Reihenfolge (Risiko-aufsteigend)

1. **Phase 1**: `useFragenAktionen` (einfachster Hook, klarer Scope, wenig State)
2. **Phase 2**: `LoeschBestaetigungsDialog` (kleinster Komponenten-Cut)
3. **Phase 3**: `useFragenEditor` (komplexester Hook, AutoSave-Race-Mitigation)
4. **Phase 4**: `FragenBrowserBody` (Render-Body)
5. **Phase 5**: `FragenBrowser.tsx`-Refactor (alles zusammenführen)
6. **Phase 6**: Lint-Gates + Build
7. **Phase 7**: Browser-E2E auf staging (User-manual)
8. **Phase 8**: Final Code-Reviewer + HANDOFF + Memory + Merge

---

## Phase 1: `useFragenAktionen` Hook

### Task 1.1: Hook-File erstellen

**Files:**
- Create: `ExamLab/src/hooks/useFragenAktionen.ts`

- [ ] **Step 1: Hook implementieren** (1:1-Move aus heutiger FragenBrowser.tsx Z. 102, 329-390)

```typescript
// ExamLab/src/hooks/useFragenAktionen.ts
import { useState, useCallback } from 'react'
import { apiService } from '../services/apiService.ts'
import { useFragensammlungStore } from '../store/fragensammlungStore.ts'
import type { Frage, FrageSummary } from '../types/fragen-storage'

interface UseFragenAktionenOptions {
  user: { email: string } | null
  istDemoModus: boolean
  onFrageAktualisiert?: (frage: Frage) => void
}

interface LoeschKandidat {
  id: string
  fachbereich: string
  typ: string
  fragetext?: string
}

interface UseFragenAktionenResult {
  loeschKandidat: LoeschKandidat | null
  setLoeschKandidat: (frage: Frage | FrageSummary) => void
  abbrechenLoeschen: () => void
  bestaetigenLoeschen: () => Promise<void>
  importieren: (importierteFragen: Frage[]) => Promise<void>
  duplizieren: (frage: Frage | FrageSummary) => Promise<void>
}

export function useFragenAktionen({ user, istDemoModus, onFrageAktualisiert }: UseFragenAktionenOptions): UseFragenAktionenResult {
  const [loeschKandidat, setLoeschKandidatState] = useState<LoeschKandidat | null>(null)

  const setLoeschKandidat = useCallback((frage: Frage | FrageSummary) => {
    setLoeschKandidatState({
      id: frage.id,
      fachbereich: frage.fachbereich,
      typ: frage.typ,
      fragetext: 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : '',
    })
  }, [])

  const abbrechenLoeschen = useCallback(() => {
    setLoeschKandidatState(null)
  }, [])

  const bestaetigenLoeschen = useCallback(async (): Promise<void> => {
    if (!loeschKandidat) return
    const { entferneFrage } = useFragensammlungStore.getState()
    entferneFrage(loeschKandidat.id)
    const frage = loeschKandidat
    setLoeschKandidatState(null)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.loescheFrage(user.email, frage.id, frage.fachbereich)
      if (!ok) {
        console.warn('[useFragenAktionen] Frage lokal gelöscht, aber Backend-Löschen fehlgeschlagen')
      }
    }
  }, [loeschKandidat, user, istDemoModus])

  const importieren = useCallback(async (importierteFragen: Frage[]): Promise<void> => {
    const { fuegeFragenHinzu } = useFragensammlungStore.getState()
    fuegeFragenHinzu(importierteFragen)

    // fragenMap im Composer synchronisieren
    for (const frage of importierteFragen) {
      onFrageAktualisiert?.(frage)
    }

    // Ans Backend senden (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      for (const frage of importierteFragen) {
        const ok = await apiService.speichereFrage(user.email, frage)
        if (!ok) {
          console.warn(`[useFragenAktionen] Import: Backend-Speichern fehlgeschlagen für ${frage.id}`)
        }
      }
    }
  }, [user, istDemoModus, onFrageAktualisiert])

  const duplizieren = useCallback(async (frage: Frage | FrageSummary): Promise<void> => {
    if (!user) return

    if (istDemoModus || !apiService.istKonfiguriert()) {
      // Demo: Lokale Kopie erstellen
      const detail = useFragensammlungStore.getState().getDetail(frage.id)
      if (detail) {
        const kopie = { ...structuredClone(detail), id: `kopie-${Date.now()}`, autor: user.email } as Frage
        useFragensammlungStore.getState().fuegeFragenHinzu([kopie])
      }
      return
    }

    const neueId = await apiService.dupliziereFrage(user.email, frage.id)
    if (neueId) {
      // Fragensammlung neu laden um die Kopie anzuzeigen
      await useFragensammlungStore.getState().lade(user.email, true)
    }
  }, [user, istDemoModus])

  return { loeschKandidat, setLoeschKandidat, abbrechenLoeschen, bestaetigenLoeschen, importieren, duplizieren }
}
```

- [ ] **Step 2: tsc -b clean**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors

- [ ] **Step 3: Commit + push**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/hooks/useFragenAktionen.ts
git commit -m "Bundle T.c Phase 1.1: useFragenAktionen Hook (Backend-Async-Handler-Cluster + loeschKandidat-State)"
git push origin feature/bundle-t-c-fragen-browser
```

---

## Phase 2: `LoeschBestaetigungsDialog` Komponente

### Task 2.1: Komponente extrahieren (1:1 aus FragenBrowser.tsx Z. 511-540)

**Files:**
- Create: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/LoeschBestaetigungsDialog.tsx`

- [ ] **Step 1: Komponente schreiben**

```typescript
// ExamLab/src/components/lp/fragensammlung/fragenbrowser/LoeschBestaetigungsDialog.tsx
import { typLabel } from '../../../../utils/fachUtils.ts'

interface LoeschKandidat {
  id: string
  fachbereich: string
  typ: string
  fragetext?: string
}

interface Props {
  kandidat: LoeschKandidat | null
  onAbbrechen: () => void
  onBestaetigen: () => void | Promise<void>
}

export default function LoeschBestaetigungsDialog({ kandidat, onAbbrechen, onBestaetigen }: Props) {
  if (!kandidat) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 pointer-events-auto" onClick={onAbbrechen}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold dark:text-white mb-2">Frage löschen?</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          <strong>{kandidat.id}</strong> · {kandidat.fachbereich} · {typLabel(kandidat.typ)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {kandidat.fragetext?.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120) || ''}
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mb-4">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onAbbrechen}
            className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            onClick={() => void onBestaetigen()}
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            Endgültig löschen
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```

- [ ] **Step 3: Commit + push**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/lp/fragensammlung/fragenbrowser/LoeschBestaetigungsDialog.tsx
git commit -m "Bundle T.c Phase 2.1: LoeschBestaetigungsDialog Komponente (extracted from inline-JSX)"
git push origin feature/bundle-t-c-fragen-browser
```

---

## Phase 3: `useFragenEditor` Hook

### Task 3.1: Hook-File erstellen (kompletter Editor + AutoSave + Schliessen-Modal)

**Files:**
- Create: `ExamLab/src/hooks/useFragenEditor.ts`

- [ ] **Step 1: Hook implementieren** (extrahiert aus FragenBrowser.tsx Z. 97-142, 168-179, 199-311; un-delete-Race-Mitigation aus Z. 295-308 byte-identisch)

```typescript
// ExamLab/src/hooks/useFragenEditor.ts
import { useState, useEffect, useMemo, useCallback } from 'react'
import { apiService } from '../services/apiService.ts'
import { useFragensammlungStore } from '../store/fragensammlungStore.ts'
import { useFragenAutoSave } from './useFragenAutoSave'
import { useEditorNeighborPrefetch } from './useEditorNeighborPrefetch'
import { tippeFrage as draftSyncTippe, cancelPending as draftSyncCancelPending } from '../services/draftSync'
import { SaveStatusIndikator } from '@shared/index'
import type { Frage, FrageSummary } from '../types/fragen-storage'
import type { Frage as CoreFrage } from '@shared/types/fragen-core'
import type { SpeichernMeta, AutoSaveAdapter } from '@shared/editor/SharedFragenEditor'
import type { SchliessenVariante } from '@shared/index'

interface UseFragenEditorOptions {
  user: { email: string } | null
  istDemoModus: boolean
  alleFragen: (Frage | FrageSummary)[]
  sortierteFragen: (Frage | FrageSummary)[]
  ladeStatus: 'laden' | 'fertig'
  initialEditFrageId?: string
  onFrageAktualisiert?: (frage: Frage) => void
}

interface UseFragenEditorResult {
  zeigEditor: boolean
  editFrage: Frage | null
  detailLaden: boolean
  schliessenModal: SchliessenVariante | null
  autoSaveAdapter: AutoSaveAdapter | undefined
  nachbarCallbacks: { onVor?: () => void; onNach?: () => void }
  oeffnen: (frage: Frage | FrageSummary) => Promise<void>
  oeffnenNeu: () => void
  speichern: (neueFrage: Frage, meta?: SpeichernMeta) => Promise<void>
  abbrechen: () => void
  modalAbbrechen: () => void
  modalEntwurfBehalten: () => void
  modalVerwerfen: () => Promise<void>
}

export function useFragenEditor({ user, istDemoModus, alleFragen, sortierteFragen, ladeStatus, initialEditFrageId, onFrageAktualisiert }: UseFragenEditorOptions): UseFragenEditorResult {
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editFrage, setEditFrage] = useState<Frage | null>(null)
  const [liveFrage, setLiveFrage] = useState<Frage | null>(null)
  const [schliessenModal, setSchliessenModal] = useState<SchliessenVariante | null>(null)
  const [detailLaden, setDetailLaden] = useState(false)

  // liveFrage = editFrage Sync (Bundle 3 P-C.3 hotfix#2)
  useEffect(() => { setLiveFrage(editFrage) }, [editFrage])

  const editorId = `fragenbrowser-${liveFrage?.id ?? 'neu'}`
  const autoSaveState = useFragenAutoSave(editorId, liveFrage)

  /** Detail on-demand laden und Editor öffnen */
  const oeffnen = useCallback(async (frage: Frage | FrageSummary): Promise<void> => {
    const detail = useFragensammlungStore.getState().getDetail(frage.id)
    if (detail) {
      setEditFrage(detail)
      setZeigEditor(true)
      return
    }
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      setDetailLaden(true)
      const geladen = await useFragensammlungStore.getState().ladeDetail(user.email, frage.id, frage.fachbereich)
      setDetailLaden(false)
      if (geladen) {
        setEditFrage(geladen)
        setZeigEditor(true)
      }
    } else {
      setEditFrage(frage as Frage)
      setZeigEditor(true)
    }
  }, [user, istDemoModus])

  const oeffnenNeu = useCallback((): void => {
    setEditFrage(null)
    setZeigEditor(true)
  }, [])

  const abbrechen = useCallback((): void => {
    setZeigEditor(false)
    setEditFrage(null)
  }, [])

  const speichern = useCallback(async (neueFrage: Frage, meta?: SpeichernMeta): Promise<void> => {
    useFragensammlungStore.getState().aktualisiereFrage(neueFrage)
    setZeigEditor(false)
    setEditFrage(null)

    onFrageAktualisiert?.(neueFrage)

    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.speichereFrage(user.email, neueFrage, meta?.offeneKIFeedbacks)
      if (!ok) {
        console.warn('[useFragenEditor] Frage lokal hinzugefügt, aber Backend-Speichern fehlgeschlagen')
      }
    }
  }, [user, istDemoModus, onFrageAktualisiert])

  // initialEditFrageId-Trigger (heute Z. 168-179)
  useEffect(() => {
    if (ladeStatus !== 'fertig' || !initialEditFrageId) return
    if (editFrage?.id === initialEditFrageId) return
    const frage = alleFragen.find((f) => f.id === initialEditFrageId)
    if (frage) {
      void oeffnen(frage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps — oeffnen / alleFragen / editFrage sind Snapshot-Reads, deps bleiben minimal
  }, [ladeStatus, initialEditFrageId])

  // Nachbar-Fragen für Editor-Navigation (heute Z. 199-211)
  const nachbarCallbacks = useMemo(() => {
    if (!editFrage) return { onVor: undefined, onNach: undefined }
    const idx = sortierteFragen.findIndex(f => f.id === editFrage.id)
    if (idx < 0) return { onVor: undefined, onNach: undefined }
    const vor = idx > 0 ? sortierteFragen[idx - 1] : null
    const nach = idx < sortierteFragen.length - 1 ? sortierteFragen[idx + 1] : null
    return {
      onVor: vor ? () => void oeffnen(vor as Frage | FrageSummary) : undefined,
      onNach: nach ? () => void oeffnen(nach as Frage | FrageSummary) : undefined,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps — oeffnen ist stabil genug
  }, [editFrage, sortierteFragen])

  // Bundle G.b — ±1 Nachbar-Fragen ins detailCache prefetchen (heute Z. 213-224)
  const nachbarFuerPrefetch = useMemo(() => {
    if (!editFrage) return { previous: null, next: null }
    const idx = sortierteFragen.findIndex((f) => f.id === editFrage.id)
    if (idx < 0) return { previous: null, next: null }
    const prev = idx > 0 ? sortierteFragen[idx - 1] : null
    const nxt = idx < sortierteFragen.length - 1 ? sortierteFragen[idx + 1] : null
    return {
      previous: prev ? { id: prev.id, fachbereich: prev.fachbereich } : null,
      next: nxt ? { id: nxt.id, fachbereich: nxt.fachbereich } : null,
    }
  }, [editFrage, sortierteFragen])

  useEditorNeighborPrefetch({
    currentFrageId: editFrage?.id ?? null,
    previous: nachbarFuerPrefetch.previous,
    next: nachbarFuerPrefetch.next,
    email: user?.email ?? '',
  })

  // Auto-Save-Adapter für SharedFragenEditor (heute Z. 233-277)
  const autoSaveAdapter: AutoSaveAdapter | undefined = useMemo(() => {
    if (istDemoModus || !apiService.istKonfiguriert()) return undefined
    return {
      statusSlot: (
        <SaveStatusIndikator
          status={autoSaveState.status}
          fehlendePflichtfelder={autoSaveState.fehlendePflichtfelder}
        />
      ),
      onTippe: (frage: CoreFrage) => {
        if (!user?.email) return
        const storageFrage = frage as unknown as Frage /* Defensive: Core→Storage Layer-Boundary, draftSync-tippe behandelt Frage opaque */
        // hotfix#2 — liveFrage updaten: useFragenAutoSave subscribed auf liveFrage.id
        setLiveFrage(storageFrage)
        draftSyncTippe(user.email, storageFrage)
      },
      onSchliessenVersuch: async () => {
        if (
          autoSaveState.status === 'sync-läuft' ||
          autoSaveState.status === 'verbindungsproblem' ||
          autoSaveState.status === 'server-down'
        ) {
          setSchliessenModal('sync-pending')
          return { darfSchliessen: false }
        }
        if (autoSaveState.fehlendePflichtfelder.length > 0) {
          setSchliessenModal('unvollstaendig')
          return { darfSchliessen: false }
        }
        return { darfSchliessen: true }
      },
    }
  }, [istDemoModus, autoSaveState.status, autoSaveState.fehlendePflichtfelder, user?.email])

  /** Schliessen-Modal-Handlers */
  const schliessenModalAbschliessen = useCallback((): void => {
    setSchliessenModal(null)
    setZeigEditor(false)
    setEditFrage(null)
  }, [])

  const modalAbbrechen = useCallback((): void => {
    setSchliessenModal(null)
  }, [])

  const modalEntwurfBehalten = useCallback((): void => {
    schliessenModalAbschliessen()
  }, [schliessenModalAbschliessen])

  /** un-delete-Race-Mitigation (Bundle 3 P-C.3 hotfix#5):
   *  draftSyncCancelPending VOR loescheFrage + 2. Cancel NACH (gegen Race mit fresher tippeFrage).
   *  Byte-identisch zu heutiger FragenBrowser.tsx Z. 295-308. */
  const modalVerwerfen = useCallback(async (): Promise<void> => {
    if (schliessenModal === 'unvollstaendig' && liveFrage && user?.email) {
      draftSyncCancelPending(liveFrage.id)
      try {
        await apiService.loescheFrage(user.email, liveFrage.id, liveFrage.fachbereich)
      } catch {
        // Fehler hier nicht-blockierend
      }
      draftSyncCancelPending(liveFrage.id)
    }
    schliessenModalAbschliessen()
  }, [schliessenModal, liveFrage, user?.email, schliessenModalAbschliessen])

  return {
    zeigEditor,
    editFrage,
    detailLaden,
    schliessenModal,
    autoSaveAdapter,
    nachbarCallbacks,
    oeffnen,
    oeffnenNeu,
    speichern,
    abbrechen,
    modalAbbrechen,
    modalEntwurfBehalten,
    modalVerwerfen,
  }
}
```

- [ ] **Step 2: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors

- [ ] **Step 3: vitest run** (kein neuer Test, aber stelle sicher dass nichts brach)

```bash
cd ExamLab && npx vitest run
```
Expected: 1287 PASS (drift = 0 — kein Caller hat den Hook noch konsumiert)

- [ ] **Step 4: Commit + push**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/hooks/useFragenEditor.ts
git commit -m "Bundle T.c Phase 3.1: useFragenEditor Hook (Editor + AutoSave + Schliessen-Modal mit un-delete-Race-Mitigation)"
git push origin feature/bundle-t-c-fragen-browser
```

---

## Phase 4: `FragenBrowserBody` Komponente

### Task 4.1: Body-Komponente erstellen (1:1 aus FragenBrowser.tsx inline-Branch Z. 393-485)

**Files:**
- Create: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx`

- [ ] **Step 1: Body-Komponente schreiben**

```typescript
// ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx
import type { Frage, FrageSummary } from '../../../../types/fragen-storage'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import { useFragenFilter } from '../../../../hooks/useFragenFilter.ts'
import FragenListeSkeleton from '../../skeletons/FragenListeSkeleton'
import FragenBrowserHeader from './FragenBrowserHeader.tsx'
import VirtualisierteFragenListe from './VirtualisierteFragenListe.tsx'
import DraftsSection from '../DraftsSection'

interface Props {
  ladeStatus: 'laden' | 'fertig'
  detailLaden: boolean
  filter: ReturnType<typeof useFragenFilter>
  drafts: Frage[]
  bereitsVerwendetSet: Set<string>
  fragenStats: Map<string, FragenPerformance>
  ownEmail: string
  toggleFrageInPruefung: (frageId: string) => void
  toggleGruppe: (key: string) => void
  handleEditFrage: (frage: Frage | FrageSummary) => void
  handleFrageDuplizieren: (frage: Frage | FrageSummary) => Promise<void>
  handleFrageLoeschen: (frage: Frage | FrageSummary) => void
  onNeueFrageErstellen: () => void
  onBatchExport: () => void
  onImport: () => void
  onExcelImport: () => void
  onSchliessen: () => void
  zielPruefungTitel?: string
  zielAbschnittTitel?: string
  inline?: boolean
  listeRef: React.RefObject<HTMLDivElement | null>
}

export default function FragenBrowserBody({
  ladeStatus, detailLaden, filter, drafts, bereitsVerwendetSet, fragenStats, ownEmail,
  toggleFrageInPruefung, toggleGruppe, handleEditFrage, handleFrageDuplizieren, handleFrageLoeschen,
  onNeueFrageErstellen, onBatchExport, onImport, onExcelImport, onSchliessen,
  zielPruefungTitel, zielAbschnittTitel, inline, listeRef,
}: Props) {
  return (
    <>
      {/* Header mit Suche + Filter */}
      <FragenBrowserHeader
        ladeStatus={ladeStatus}
        gefilterteFragen={filter.gefilterteFragen}
        stats={filter.stats}
        alleStats={filter.alleStats}
        verfuegbareThemen={filter.verfuegbareThemen}
        verfuegbareUnterthemen={filter.verfuegbareUnterthemen}
        aktiveFilter={filter.aktiveFilter}
        suchtext={filter.suchtext}
        setSuchtext={filter.setSuchtext}
        filterFachbereich={filter.filterFachbereich}
        setFilterFachbereich={filter.setFilterFachbereich}
        filterTyp={filter.filterTyp}
        setFilterTyp={filter.setFilterTyp}
        filterBloom={filter.filterBloom}
        setFilterBloom={filter.setFilterBloom}
        filterThema={filter.filterThema}
        setFilterThema={filter.setFilterThema}
        filterUnterthema={filter.filterUnterthema}
        setFilterUnterthema={filter.setFilterUnterthema}
        filterPoolStatus={filter.filterPoolStatus}
        setFilterPoolStatus={filter.setFilterPoolStatus}
        filterMitAnhang={filter.filterMitAnhang}
        setFilterMitAnhang={filter.setFilterMitAnhang}
        filterKontext={filter.filterKontext}
        setFilterKontext={filter.setFilterKontext}
        filterZuruecksetzen={filter.filterZuruecksetzen}
        sortierung={filter.sortierung}
        setSortierung={filter.setSortierung}
        gruppierung={filter.gruppierung}
        setGruppierung={filter.setGruppierung}
        setAufgeklappteGruppen={filter.setAufgeklappteGruppen}
        kompaktModus={filter.kompaktModus}
        setKompaktModus={filter.setKompaktModus}
        onNeueFrageErstellen={onNeueFrageErstellen}
        onBatchExport={onBatchExport}
        onImport={onImport}
        onExcelImport={onExcelImport}
        onSchliessen={onSchliessen}
        zielPruefungTitel={zielPruefungTitel}
        zielAbschnittTitel={zielAbschnittTitel}
        inline={inline}
        listeRef={listeRef}
      />

      {/* Drafts-Sektion oberhalb der Sammlung */}
      {ladeStatus === 'fertig' && (
        <DraftsSection
          drafts={drafts}
          onClickDraft={(frage) => handleEditFrage(frage)}
          ownEmail={ownEmail}
        />
      )}

      {/* Fragen-Liste */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {ladeStatus === 'laden' && <FragenListeSkeleton />}

        {detailLaden && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Frage wird geladen...</p>
          </div>
        )}

        {ladeStatus === 'fertig' && filter.gefilterteFragen.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            Keine Fragen gefunden.
          </p>
        )}

        {ladeStatus === 'fertig' && filter.gefilterteFragen.length > 0 && (
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
            handleFrageLoeschen={handleFrageLoeschen}
            scrollResetTrigger={`${filter.suchtext}|${filter.gruppierung}|${filter.gefilterteFragen.length}`}
            scrollContainerRef={listeRef}
          />
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```

- [ ] **Step 3: Commit + push**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx
git commit -m "Bundle T.c Phase 4.1: FragenBrowserBody Komponente (eliminiert ~150 Z. inline/overlay-Render-Duplikat)"
git push origin feature/bundle-t-c-fragen-browser
```

---

## Phase 5: `FragenBrowser.tsx`-Refactor

### Task 5.1: FragenBrowser.tsx neu schreiben (768 → ~225 Z.)

**Files:**
- Modify: `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx`

- [ ] **Step 1: FragenBrowser.tsx komplett überschreiben**

Read current file first (mandatory), then Write tool with new content:

```typescript
// ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap.ts'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { SchliessenModal } from '@shared/index'
import { useFragenFilter } from '../../../hooks/useFragenFilter.ts'
import { useFragenEditor } from '../../../hooks/useFragenEditor'
import { useFragenAktionen } from '../../../hooks/useFragenAktionen'
import { useAuthStore } from '../../../store/authStore.ts'
import { useFragensammlungStore } from '../../../store/fragensammlungStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { demoFragen } from '../../../data/demoFragen.ts'
import { erstelleDemoTrackerDaten, aggregiereFragenPerformance } from '../../../utils/trackerUtils.ts'
import type { Frage, FrageSummary } from '../../../types/fragen-storage'
import type { FragenPerformance } from '../../../types/tracker.ts'
import FragenBrowserBody from './fragenbrowser/FragenBrowserBody.tsx'
import LoeschBestaetigungsDialog from './fragenbrowser/LoeschBestaetigungsDialog.tsx'
import FragenEditor from '../frageneditor/FragenEditor.tsx'
import FragenImport from './FragenImport.tsx'
import ExcelImport from './ExcelImport.tsx'
import BatchExportDialog from '../korrektur/BatchExportDialog.tsx'

interface Props {
  onHinzufuegen: (frageIds: string[]) => void
  onEntfernen?: (frageId: string) => void
  onSchliessen: () => void
  bereitsVerwendet: string[]
  initialEditFrageId?: string
  zielPruefungTitel?: string
  zielAbschnittTitel?: string
  onFrageAktualisiert?: (frage: Frage) => void
  inline?: boolean
}

/** Panel zum Durchsuchen und Auswählen von Fragen aus der Fragensammlung (Overlay oder Inline) */
export default function FragenBrowser({ onHinzufuegen, onEntfernen, onSchliessen, bereitsVerwendet, initialEditFrageId, zielPruefungTitel, zielAbschnittTitel, onFrageAktualisiert, inline }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const panelRef = useRef<HTMLDivElement>(null)
  const listeRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  // Store-Selectors + Demo-Modus-Mux
  const storeSummaries = useFragensammlungStore(s => s.summaries)
  const storeFragen = useFragensammlungStore(s => s.fragen)
  const storeStatus = useFragensammlungStore(s => s.status)
  const alleFragenMitDrafts = (istDemoModus || !apiService.istKonfiguriert())
    ? demoFragen
    : (storeSummaries.length > 0 ? storeSummaries : storeFragen)
  const ladeStatus = (istDemoModus || !apiService.istKonfiguriert())
    ? 'fertig' as const
    : (storeStatus === 'summary_fertig' || storeStatus === 'detail_laden' || storeStatus === 'fertig' ? 'fertig' as const : 'laden' as const)

  const drafts = useMemo<Frage[]>(
    () => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status === 'draft') as Frage[],
    [alleFragenMitDrafts]
  )
  const alleFragen = useMemo(
    () => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status !== 'draft'),
    [alleFragenMitDrafts]
  )

  // Tracker-Stats
  const [fragenStats, setFragenStats] = useState<Map<string, FragenPerformance>>(new Map())
  useEffect(() => {
    async function ladeStats(): Promise<void> {
      if (istDemoModus || !apiService.istKonfiguriert()) {
        const demo = erstelleDemoTrackerDaten()
        setFragenStats(aggregiereFragenPerformance(demo))
        return
      }
      if (!user) return
      const tracker = await apiService.ladeTrackerDaten(user.email)
      if (tracker) {
        setFragenStats(aggregiereFragenPerformance(tracker))
      }
    }
    ladeStats()
  }, [user, istDemoModus])

  // Falls Store noch nicht geladen: Lade-Fallback
  useEffect(() => {
    if (!istDemoModus && apiService.istKonfiguriert() && user && storeStatus === 'idle') {
      useFragensammlungStore.getState().lade(user.email)
    }
  }, [istDemoModus, user, storeStatus])

  const bereitsVerwendetSet = useMemo(() => new Set(bereitsVerwendet), [bereitsVerwendet])

  // Filter-Engine
  const filter = useFragenFilter(alleFragen, user?.email, ladeStatus, istDemoModus)

  // T.c-Hooks
  const editor = useFragenEditor({
    user, istDemoModus, alleFragen, sortierteFragen: filter.sortierteFragen,
    ladeStatus, initialEditFrageId, onFrageAktualisiert,
  })
  const aktionen = useFragenAktionen({ user, istDemoModus, onFrageAktualisiert })

  // Modal-Toggles (UI-State, bleibt im Caller — Brainstorming-Beschluss B)
  const [zeigImport, setZeigImport] = useState(false)
  const [zeigExcelImport, setZeigExcelImport] = useState(false)
  const [zeigBatchExport, setZeigBatchExport] = useState(false)

  const toggleFrageInPruefung = useCallback((frageId: string): void => {
    if (bereitsVerwendetSet.has(frageId)) {
      onEntfernen?.(frageId)
    } else {
      onHinzufuegen([frageId])
    }
  }, [bereitsVerwendetSet, onEntfernen, onHinzufuegen])

  const toggleGruppe = useCallback((key: string): void => {
    filter.setAufgeklappteGruppen((prev) => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }, [filter])

  // Body-Element gemeinsam für inline + overlay
  const body = (
    <FragenBrowserBody
      ladeStatus={ladeStatus}
      detailLaden={editor.detailLaden}
      filter={filter}
      drafts={drafts}
      bereitsVerwendetSet={bereitsVerwendetSet}
      fragenStats={fragenStats}
      ownEmail={user?.email ?? ''}
      toggleFrageInPruefung={toggleFrageInPruefung}
      toggleGruppe={toggleGruppe}
      handleEditFrage={editor.oeffnen}
      handleFrageDuplizieren={aktionen.duplizieren}
      handleFrageLoeschen={aktionen.setLoeschKandidat}
      onNeueFrageErstellen={editor.oeffnenNeu}
      onBatchExport={() => setZeigBatchExport(true)}
      onImport={() => setZeigImport(true)}
      onExcelImport={() => setZeigExcelImport(true)}
      onSchliessen={onSchliessen}
      zielPruefungTitel={zielPruefungTitel}
      zielAbschnittTitel={zielAbschnittTitel}
      inline={inline}
      listeRef={listeRef}
    />
  )

  // Modals gemeinsam für inline + overlay
  const modals = (
    <>
      {editor.zeigEditor && (
        <FragenEditor
          key={editor.editFrage?.id ?? 'neu'}
          frage={editor.editFrage}
          onSpeichern={editor.speichern}
          onAbbrechen={editor.abbrechen}
          performance={editor.editFrage ? fragenStats.get(editor.editFrage.id) : undefined}
          onVorherigeFrage={editor.nachbarCallbacks.onVor}
          onNaechsteFrage={editor.nachbarCallbacks.onNach}
          autoSave={editor.autoSaveAdapter}
        />
      )}

      <SchliessenModal
        open={editor.schliessenModal !== null}
        variante={editor.schliessenModal ?? 'unvollstaendig'}
        onAbbrechen={editor.modalAbbrechen}
        onVerwerfen={() => { void editor.modalVerwerfen() }}
        onAlsEntwurfBehalten={editor.schliessenModal === 'unvollstaendig' ? editor.modalEntwurfBehalten : undefined}
      />

      <LoeschBestaetigungsDialog
        kandidat={aktionen.loeschKandidat}
        onAbbrechen={aktionen.abbrechenLoeschen}
        onBestaetigen={aktionen.bestaetigenLoeschen}
      />

      {zeigImport && (
        <FragenImport
          onImportiert={async (fragen) => {
            await aktionen.importieren(fragen)
            setZeigImport(false)
          }}
          onSchliessen={() => setZeigImport(false)}
        />
      )}

      {zeigExcelImport && (
        <ExcelImport
          onImportiert={async (fragen) => {
            await aktionen.importieren(fragen)
            setZeigExcelImport(false)
          }}
          onSchliessen={() => setZeigExcelImport(false)}
          bestehendeIds={new Set(alleFragen.map(f => f.id))}
        />
      )}

      {zeigBatchExport && (
        <BatchExportDialog
          fragen={filter.gefilterteFragen as Frage[]}
          onSchliessen={() => setZeigBatchExport(false)}
          onErfolg={(updates) => {
            const aktuell = useFragensammlungStore.getState().fragen
            useFragensammlungStore.getState().setFragen(aktuell.map(f => {
              const upd = updates.find(u => u.frageId === f.id)
              if (!upd) return f
              return { ...f, poolId: upd.poolId, quelle: 'pool' as const, poolContentHash: upd.poolContentHash }
            }))
          }}
        />
      )}
    </>
  )

  // Inline-Modus
  if (inline) {
    return (
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {body}
        {modals}
      </div>
    )
  }

  // Overlay-Modus
  return (
    <>
      <ResizableSidebar
        mode="overlay"
        onClose={onSchliessen}
        topOffset={headerH}
        storageKey="fragensammlung-breite"
      >
        <div ref={panelRef} className="flex flex-col h-full">
          {body}
        </div>
      </ResizableSidebar>
      {modals}
    </>
  )
}
```

- [ ] **Step 2: Zeilen-Count prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
wc -l ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx
```
Expected: ~210-240 Z. (<500 Master-Spec-Ziel ✓)

- [ ] **Step 3: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors. Wichtig: Output **direkt** prüfen.

- [ ] **Step 4: vitest run**

```bash
cd ExamLab && npx vitest run
```
Expected: 1287 PASS (drift = 0, kein Test-Bruch)

- [ ] **Step 5: Commit + push**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx
git commit -m "Bundle T.c Phase 5.1: FragenBrowser.tsx schlank (768 → ~225 Z.) — Wrapper + State-Holder"
git push origin feature/bundle-t-c-fragen-browser
```

---

## Phase 6: Verifikations-Gates

### Task 6.1: Alle Lint-Gates + Build

- [ ] **Step 1: tsc + vitest** (Wiederholung als Master-Verifikation)

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b 2>&1 | tee /tmp/tsc.log
npx vitest run
```
Expected: tsc 0 errors, vitest 1287 PASS (drift=0)

- [ ] **Step 2: Alle 4 Lint-Gates**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run lint:as-any
npm run lint:no-alert
npm run lint:no-tests-dir
npm run lint:musterloesung
```
Expected: alle 4 clean

- [ ] **Step 3: vite build**

```bash
cd ExamLab && npm run build
```
Expected: built successfully, PWA generated

---

## Phase 7: Browser-E2E auf staging

### Task 7.1: preview-Branch update

- [ ] **Step 1: Preview-WIP prüfen** (Memory-Lehre `feedback_preview_forcepush`)

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin
git log origin/preview ^feature/bundle-t-c-fragen-browser --oneline
```
Expected: leer (preview hat nichts, was nicht auf feature-branch ist)

- [ ] **Step 2: preview reset auf feature-branch**

```bash
git checkout -B preview feature/bundle-t-c-fragen-browser
git push --force-with-lease origin preview
git checkout feature/bundle-t-c-fragen-browser
```

### Task 7.2: Browser-E2E mit echten LP-Logins

User-Manual-Testing: warte ~5 Min auf Pages-Deploy, dann:

- [ ] **Step 1: SW-Cache flush**

DevTools Console auf staging-URL `https://durandbourjate.github.io/GYM-WR-DUY/staging/`:
```js
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
caches.keys().then(ks => ks.forEach(k => caches.delete(k)))
location.reload(true)
```

- [ ] **Step 2: LP-Login mit echten Credentials**

- [ ] **Step 3: 10 E2E-Pfade verifizieren** (aus Spec 5.2):
  - **Pfad 1**: LP-Editor öffnen — Klick auf Frage → Detail-Spinner → Editor mit AutoSave-Status
  - **Pfad 2**: Auto-Save-Pfad — Tippen → 'sync-läuft' → 'sauber'
  - **Pfad 3**: Schliessen-Modal 'sync-pending' — Tippen + sofort Schliessen → Modal blockt; "Verwerfen" → Network-Tab zeigt loescheFrage-POST + KEIN nachgelagerter tippeFrage-POST überschreibt geloescht_am
  - **Pfad 4**: Schliessen-Modal 'unvollstaendig' — Pflichtfeld leer → Modal mit "Als Entwurf behalten" / "Verwerfen"
  - **Pfad 5**: Lösch-Dialog — DetailKarte-Trash → Bestätigung → "Endgültig löschen" → Frage weg
  - **Pfad 6**: Import-Pfad — JSON/Excel → fuegeFragenHinzu + Backend-Speicher
  - **Pfad 7**: Duplizieren — DetailKarte-Duplicate → apiService.dupliziereFrage → Store-Refresh
  - **Pfad 8**: Inline + Overlay-Modus — Composer-inline + Standalone-overlay rendern Body identisch
  - **Pfad 9**: Editor-Navigation — Vor/Nach-Buttons wechseln Nachbar-Frage; Network zeigt Neighbor-Prefetch
  - **Pfad 10**: 0 Console-Errors über alle 9 Pfade

---

## Phase 8: Final Code-Reviewer + Merge

### Task 8.1: Final Code-Reviewer-Subagent

- [ ] **Step 1: Reviewer dispatchen** mit kompletten Branch-Diff `4c3400f` (main HEAD vor T.b) bis HEAD. Wait — main HEAD ist nun `d904372` (nach T.b-Merge). Diff-Range: `d904372..feature/bundle-t-c-fragen-browser`.

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git diff d904372..feature/bundle-t-c-fragen-browser --stat
```

Reviewer prüft: Plan-Treue, byte-identical Behavior, AutoSave-Race-Mitigation in `modalVerwerfen()`, alle DoD-Gates grün.

- [ ] **Step 2: Reviewer-Findings fixen oder begründet zurückweisen**

### Task 8.2: HANDOFF + Memory

- [ ] **Step 1: ExamLab/HANDOFF.md** — Bundle T.c-Eintrag oberhalb T.b-Eintrag (Bilanz, Hotspot 11→10, Architektur-Patterns, E2E-Pfade)

- [ ] **Step 2: Memory-File** `~/.claude/projects/.../memory/project_bundle_t_c_komplett.md` analog T.b

- [ ] **Step 3: MEMORY.md Index-Eintrag**

- [ ] **Step 4: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/HANDOFF.md
git commit -m "Bundle T.c: HANDOFF-Eintrag"
git push origin feature/bundle-t-c-fragen-browser
```

### Task 8.3: Merge auf main + Cleanup

- [ ] **Step 1: Merge**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git merge --no-ff feature/bundle-t-c-fragen-browser -m "Merge Bundle T.c: FragenBrowser Hook-Extraktion + Body-Komponenten (768 → ~225 Z., -71%)"
git push origin main
```

- [ ] **Step 2: Branch löschen + preview reset**

```bash
git branch -d feature/bundle-t-c-fragen-browser
git push origin --delete feature/bundle-t-c-fragen-browser
git checkout -B preview origin/main
git push --force-with-lease origin preview
git checkout main
```

---

## Erfolgskriterien (Bilanz)

- [x] Spec + Plan reviewer-approved + auf Branch committed
- [ ] tsc -b clean
- [ ] 4 Lint-Gates clean (`lint:as-any`, `lint:no-alert`, `lint:no-tests-dir`, `lint:musterloesung`)
- [ ] vitest 1287 PASS (drift = 0, kein Test-Bruch)
- [ ] vite build erfolgreich
- [ ] Browser-E2E mit echten LP-Logins ✓ (10 Pfade aus Spec 5.2)
- [ ] 0 Console-Errors auf staging
- [ ] Code-Reviewer-Subagent APPROVED
- [ ] FragenBrowser.tsx ~225 Z. (Master-Spec-Ziel <500 ✓)
- [ ] Hotspot-Bilanz: 11 → 10
- [ ] HANDOFF + Memory + main-Merge + Branch-Cleanup + preview-reset

## Risiken & Mitigationen

| Risiko | Mitigation |
|---|---|
| **AutoSave-Race (un-delete-Race, Bundle-3-hotfix#5)** | `modalVerwerfen()`-Service-API kapselt 2× cancelPending + loescheFrage byte-identisch zu source Z. 295-308. E2E-Pfad #3 verifiziert via Network-Tab. |
| **`liveFrage`-Subscription-Drift** | `liveFrage`-State + Sync-Effect + onTippe-Callback bleiben innerhalb `useFragenEditor`. Caller hat keinen Zugriff. |
| **`initialEditFrageId`-Reopen-Loop** | useEffect mit `[ladeStatus, initialEditFrageId]`-deps + Idempotenz-Guard `if (editFrage?.id === initialEditFrageId) return` 1:1 in Hook übernommen. |
| **Body-Prop-Drift bei 35-Prop-Header** | `filter`-Pass-through-Object (statt 32 einzelne Props) reduziert Prop-Drift-Risiko. |
| **`detailLaden`-Spinner-Race** | `detailLaden` ist Hook-State (privat im useFragenEditor). Body bekommt als Prop und rendert Overlay. |
| **Service-Worker-Cache** | SW-unregister + caches.delete + reload als Routine vor E2E. |
| **Subagent-Branch-Drift** | Branch-Setup explizit im Subagent-Prompt + remote pushen vor Folge-Subagents. |
| **Inline-vs-Overlay-Modal-Mount-Position** | inline rendert Modals INNERHALB Wrapper-`<div>`, overlay rendert Modals NACH ResizableSidebar (siehe heutige Z. 510-540 vs Z. 679-765). Test #8 verifiziert beide Modi. |
