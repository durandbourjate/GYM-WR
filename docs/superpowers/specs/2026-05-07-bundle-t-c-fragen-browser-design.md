# Bundle T.c — FragenBrowser Hook-Extraktion + Body-Komponenten (Sub-Spec)

**Datum:** 2026-05-07
**Status:** Draft (vor Spec-Review)
**Master-Spec:** [`2026-05-06-bundle-t-hooks-splits-design.md`](2026-05-06-bundle-t-hooks-splits-design.md)
**Vorgänger:** Bundle T.b (TKontoFrage Komponenten-Split, Merge `d904372` 2026-05-07)

## 1. Kontext

Aus der Master-Spec von Bundle T (2026-05-06): T.c zerlegt `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx` (768 Z.) per Hook-Extraktion + Komponenten-Split ohne Verhaltensänderung. T.c ist das dritte Sub-Bundle und letzter mittel-Risiko-File vor dem Pause-Punkt. Master-Spec Sektion 6.3 nannte `useFragenFilterEngine` + `useFragenEditorSync` als Audit-Hypothese — `useFragenFilter` existiert aber bereits sauber abstrahiert (FragenBrowser.tsx Z. 7), kein Re-Cut-Bedarf. Der Editor-Cluster (~250-300 Z. mit AutoSave-Coupling) und das Render-Body-Duplikat (~150 Z. zwischen inline + overlay) sind die echten Hot-Spots.

Bundle T.b hat Cell-Border-Pattern + Sub-Folder-Konvention etabliert. T.c überträgt Folder-Pattern auf `fragenbrowser/` (existiert bereits aus Bundle G.e Virtualisierung) und fügt 2 neue Hooks in `src/hooks/` flach analog `useFragenAutoSave`/`useFragenFilter` hinzu.

## 2. Ziel

`FragenBrowser.tsx` von 768 Z. auf ~225 Z. reduzieren (Wrapper-Dispatcher + State-Holder + Modals), Hotspot-Bilanz Files >500 Z. **11 → 10**, ohne Verhaltensänderung. AutoSave-Race-Mitigation (Bundle-3-hotfix#5 `feedback_destructive_action_cancel_pending`) zentral in `useFragenEditor`-Service-API kapseln. Render-Body-Duplikat zwischen inline-Modus (Z. 393-575) und overlay-Modus (Z. 578-676) eliminieren.

## 3. Scope

### In Scope

| Sub | File | heute | nachher | Verantwortung |
|---|---|---:|---:|---|
| Modify | `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx` | 768 Z. | ~225 Z. | Wrapper-Dispatcher (inline-vs-overlay) + State-Holder (3 Modal-Toggles + fragenStats) + Hook-Aufrufe + Modal-Mounts |
| New | `ExamLab/src/hooks/useFragenEditor.ts` | – | ~180-200 Z. | Editor-State + AutoSave-Coupling + Schliessen-Modal-Logik + Neighbor-Prefetch + Initial-Edit-Trigger |
| New | `ExamLab/src/hooks/useFragenAktionen.ts` | – | ~80-100 Z. | Backend-Async-Handler-Cluster (importieren/duplizieren/löschen) + `loeschKandidat`-State |
| New | `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx` | – | ~120-140 Z. | Gemeinsamer Render-Body für inline + overlay (Header + DraftsSection + VirtualisierteFragenListe + Detail-Lade + leerer-State) |
| New | `ExamLab/src/components/lp/fragensammlung/fragenbrowser/LoeschBestaetigungsDialog.tsx` | – | ~50 Z. | Custom Modal-Bestätigungs-Dialog (heute Inline-JSX Z. 511-540) |

### Out of Scope

- Wire-Vertrag-Änderungen (Apps Script bleibt unangetastet)
- `useFragenFilter`-Refactor (existing, sauber abstrahiert)
- `useFragenAutoSave`-Refactor (existing, intakt — wird nur konsumiert)
- `DraftsSection` / `VirtualisierteFragenListe` / `FragenBrowserHeader` / `DetailKarte` / `KompaktZeile` / `PoolBadges`-Refactor (alle existing in `fragenbrowser/`-Folder)
- `PoolSyncDialog` / `RueckSyncDialog` / `FragenImport` / `ExcelImport` / `BatchExportDialog` (existing)
- Pure-Util-Helpers (z.B. `nachbarVonId`-Index-Lookup) als separate Util-File — bleiben inline im Hook (YAGNI)

## 4. Architektur

### 4.1 Datei-Struktur

```
ExamLab/src/hooks/                                    # flach, analog existing useFragen*
├── useFragenEditor.ts                                ← New
└── useFragenAktionen.ts                              ← New

ExamLab/src/components/lp/fragensammlung/
├── FragenBrowser.tsx                                 ← Modify (768 → ~225 Z.)
└── fragenbrowser/                                    # existing Sub-Folder aus Bundle G.e
    ├── DetailKarte.tsx                               (existing, unverändert)
    ├── FragenBrowserHeader.tsx                       (existing, unverändert)
    ├── KompaktZeile.tsx                              (existing, unverändert)
    ├── PoolBadges.tsx                                (existing, unverändert)
    ├── VirtualisierteFragenListe.tsx                 (existing, unverändert)
    ├── gruppenHelfer.ts                              (existing, unverändert)
    ├── FragenBrowserBody.tsx                         ← New
    └── LoeschBestaetigungsDialog.tsx                 ← New
```

Hook-Ablage flach in `src/hooks/` analog `useFragenAutoSave.ts`, `useFragenFilter.ts`, `useEditorNeighborPrefetch.ts` (Master-Spec 4.1 LP-Bereich-Konvention).

### 4.2 `useFragenEditor` Service-API

```typescript
import type { Frage, FrageSummary } from '../types/fragen-storage'
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
  // Read-State
  zeigEditor: boolean
  editFrage: Frage | null
  detailLaden: boolean
  schliessenModal: SchliessenVariante | null
  autoSaveAdapter: AutoSaveAdapter | undefined
  nachbarCallbacks: { onVor?: () => void; onNach?: () => void }

  // Service-API (Bundle-3-Race-Mitigation gekapselt)
  oeffnen: (frage: Frage | FrageSummary) => Promise<void>
  oeffnenNeu: () => void                                       // Editor für neue Frage öffnen (editFrage=null)
  speichern: (neueFrage: Frage, meta?: SpeichernMeta) => Promise<void>
  abbrechen: () => void
  modalAbbrechen: () => void
  modalEntwurfBehalten: () => void
  modalVerwerfen: () => Promise<void>
}
```

**`liveFrage` ist intentional NICHT im Result-Interface** — Single-Source-of-Truth-Principle: Caller hat keinen direkten Zugriff auf `liveFrage`/`setLiveFrage`. Schreib-Pfad ist nur via `autoSaveAdapter.onTippe` (intern), Lese-Pfad ist `editFrage` (für JSX). Verhindert versehentliche Bypass-Mutation der un-delete-Race-Mitigation.

**Internal Implementation:**
- State (private): `zeigEditor`, `editFrage`, `liveFrage`, `schliessenModal`, `detailLaden`
- Hooks (private): `useFragenAutoSave(editorId, liveFrage)`, `useEditorNeighborPrefetch(...)`
- Memos (private): `nachbarFuerPrefetch`, `nachbarCallbacks`, `autoSaveAdapter`
  - `nachbarCallbacks` ruft `oeffnen(vor)` / `oeffnen(nach)` aus Closure-Scope. `oeffnen` muss als `useCallback` ÜBER der Memo-Definition deklariert sein (oder via privater Helper-Function), damit der Memo es referenzieren kann. eslint-disable-next-line `react-hooks/exhaustive-deps` für `[editFrage, sortierteFragen]`-deps wie heute Z. 210 erhalten bleiben.
- Effects (private):
  - `liveFrage = editFrage` Sync auf `[editFrage]`
  - Initial-Edit-Trigger auf `[ladeStatus, initialEditFrageId]` mit Idempotenz-Guard
- Helpers (private): `editorId = `fragenbrowser-${liveFrage?.id ?? 'neu'}``

**`autoSaveAdapter`-Internals:**
- `statusSlot`: `<SaveStatusIndikator status={autoSaveState.status} fehlendePflichtfelder={autoSaveState.fehlendePflichtfelder} />`
- `onTippe(frage)`: setLiveFrage + draftSyncTippe (privater Zugriff)
- `onSchliessenVersuch()`: prüft `autoSaveState.status` ∈ `['sync-läuft', 'verbindungsproblem', 'server-down']` → `setSchliessenModal('sync-pending')` + return `{ darfSchliessen: false }`. Sonst Pflichtfeld-Check → `'unvollstaendig'`. Sonst silent `{ darfSchliessen: true }`.

**`modalVerwerfen()`-Internals (un-delete-Race-Mitigation, Bundle-3-hotfix#5):**
```typescript
async modalVerwerfen() {
  if (schliessenModal === 'unvollstaendig' && liveFrage && user?.email) {
    draftSyncCancelPending(liveFrage.id)  // 1. Cancel VOR loescheFrage
    try {
      await apiService.loescheFrage(user.email, liveFrage.id, liveFrage.fachbereich)
    } catch { /* nicht-blockierend */ }
    draftSyncCancelPending(liveFrage.id)  // 2. Cancel NACH (gegen Race mit fresher tippeFrage)
  }
  setSchliessenModal(null)
  setZeigEditor(false)
  setEditFrage(null)
}
```

**`speichern(neueFrage, meta)`-Internals:**
1. `useFragensammlungStore.getState().aktualisiereFrage(neueFrage)`
2. `setZeigEditor(false); setEditFrage(null)`
3. `onFrageAktualisiert?.(neueFrage)` (Caller-Callback für fragenMap-Sync im Composer)
4. `if (user && istKonfiguriert && !istDemoModus): await apiService.speichereFrage(...)`

### 4.3 `useFragenAktionen` Service-API

```typescript
interface UseFragenAktionenOptions {
  user: { email: string } | null
  istDemoModus: boolean
  onFrageAktualisiert?: (frage: Frage) => void
}

interface UseFragenAktionenResult {
  loeschKandidat: { id: string; fachbereich: string; typ: string; fragetext?: string } | null
  setLoeschKandidat: (frage: Frage | FrageSummary) => void
  abbrechenLoeschen: () => void
  bestaetigenLoeschen: () => Promise<void>
  importieren: (importierteFragen: Frage[]) => Promise<void>
  duplizieren: (frage: Frage | FrageSummary) => Promise<void>
}
```

**Internal Implementation:**
- State (private): `loeschKandidat`
- Helpers: `useFragensammlungStore.getState()` für `entferneFrage`, `fuegeFragenHinzu`, `aktualisiereFrage`, `lade`
- **Cross-Hook-Coupling-Disclosure:** Beide Hooks (`useFragenEditor` + `useFragenAktionen`) lesen `useFragensammlungStore.getState()` direkt für `aktualisiereFrage` — kein Cross-Hook-Coupling. `useFragenEditor.speichern` und `useFragenAktionen.importieren` rufen denselben Store-Helper aufrufen. Sauber, da Store-Mutation idempotent ist.
- `setLoeschKandidat` ist **NICHT** der direkte useState-Setter — wandelt `Frage | FrageSummary` zu `loeschKandidat`-Object mit `id`/`fachbereich`/`typ`/`fragetext`-Extract:
  ```typescript
  setLoeschKandidat: (frage) => setLoeschKandidatState({
    id: frage.id, fachbereich: frage.fachbereich, typ: frage.typ,
    fragetext: 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : '',
  })
  ```

### 4.4 `<FragenBrowserBody>` Props

```typescript
interface FragenBrowserBodyProps {
  // Lade-State
  ladeStatus: 'laden' | 'fertig'
  detailLaden: boolean

  // Filter (Pass-through-Object zu FragenBrowserHeader)
  filter: ReturnType<typeof useFragenFilter>

  // Listen-Daten
  drafts: Frage[]
  bereitsVerwendetSet: Set<string>
  fragenStats: Map<string, FragenPerformance>
  ownEmail: string

  // Handler-Callbacks
  toggleFrageInPruefung: (frageId: string) => void
  handleEditFrage: (frage: Frage | FrageSummary) => void
  handleFrageDuplizieren: (frage: Frage | FrageSummary) => Promise<void>
  handleFrageLoeschen: (frage: Frage | FrageSummary) => void

  // Header-Pass-through
  onNeueFrageErstellen: () => void
  onBatchExport: () => void
  onImport: () => void
  onExcelImport: () => void
  onSchliessen: () => void
  zielPruefungTitel?: string
  zielAbschnittTitel?: string
  inline?: boolean

  // Refs
  listeRef: React.RefObject<HTMLDivElement>
}
```

`inline` wird an `<FragenBrowserHeader>` weitergereicht — Header unterdrückt die Ziel-Leiste in inline-Modus (heute Z. 438 `inline` als Header-Prop). overlay-Modus zeigt `zielPruefungTitel`/`zielAbschnittTitel` (heute Z. 627-628). Body selbst rendert in beiden Modi identisch — Unterschied liegt nur am Header-Verhalten + Modal-Mount-Position (Letzteres im Caller).

**Render-Inhalt (1:1 aus heutiger inline-Branch Z. 393-485):**
1. `<FragenBrowserHeader {...filter} ... />` mit ~32 Filter-Props destruktiert aus `filter`-Object
2. `{ladeStatus === 'fertig' && <DraftsSection drafts={drafts} ownEmail={ownEmail} onClickDraft={handleEditFrage} />}`
3. `<div className="flex-1 min-h-0 relative overflow-hidden">`
   - `{ladeStatus === 'laden' && <FragenListeSkeleton />}`
   - `{detailLaden && <Detail-Lade-Spinner-Overlay />}`
   - `{ladeStatus === 'fertig' && filter.gefilterteFragen.length === 0 && <Keine-Fragen-Hinweis />}`
   - `{ladeStatus === 'fertig' && filter.gefilterteFragen.length > 0 && <VirtualisierteFragenListe ... />}`

`filter`-Pass-through reduziert Body's Prop-Count drastisch (von ~32 Filter-Props auf 1 `filter`-Object).

### 4.5 `<LoeschBestaetigungsDialog>` Props

```typescript
interface LoeschBestaetigungsDialogProps {
  kandidat: { id: string; fachbereich: string; typ: string; fragetext?: string } | null
  onAbbrechen: () => void
  onBestaetigen: () => void | Promise<void>
}
```

**Render-Inhalt (1:1 aus heutiger Z. 511-540):**
- `if (!kandidat) return null`
- `<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">` mit click-outside → onAbbrechen
- Modal-Card mit ID, Fachbereich, `typLabel(typ)`, `fragetext`-Preview (120 chars), Warning-Text
- 2 Buttons: Abbrechen (border) + "Endgültig löschen" (bg-red-600) → onBestaetigen

`typLabel`-Import wandert mit nach LoeschBestaetigungsDialog.tsx.

### 4.6 Caller-Side `FragenBrowser.tsx` (~225 Z. nach Refactor)

```typescript
export default function FragenBrowser({ onHinzufuegen, onEntfernen, onSchliessen, bereitsVerwendet, initialEditFrageId, zielPruefungTitel, zielAbschnittTitel, onFrageAktualisiert, inline }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const panelRef = useRef<HTMLDivElement>(null)
  const listeRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    setHeaderH(document.querySelector('header')?.getBoundingClientRect()?.height ?? 0)
  }, [])

  // Store-Selectors + Demo-Modus-Mux
  const storeSummaries = useFragensammlungStore(s => s.summaries)
  const storeFragen = useFragensammlungStore(s => s.fragen)
  const storeStatus = useFragensammlungStore(s => s.status)
  const alleFragenMitDrafts = (istDemoModus || !apiService.istKonfiguriert()) ? demoFragen : (storeSummaries.length > 0 ? storeSummaries : storeFragen)
  const ladeStatus = (istDemoModus || !apiService.istKonfiguriert()) ? 'fertig' as const : (storeStatus === 'summary_fertig' || storeStatus === 'detail_laden' || storeStatus === 'fertig' ? 'fertig' as const : 'laden' as const)

  const drafts = useMemo<Frage[]>(() => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status === 'draft') as Frage[], [alleFragenMitDrafts])
  const alleFragen = useMemo(() => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status !== 'draft'), [alleFragenMitDrafts])

  const { setFragen: setAlleFragen } = useFragensammlungStore.getState()  // BatchExport-onErfolg bleibt im Caller — konsistent mit Modal-Toggle-Cluster (Brainstorming-Beschluss B)

  const [fragenStats, setFragenStats] = useState<Map<string, FragenPerformance>>(new Map())
  useEffect(() => {
    async function ladeStats() { /* tracker-load aus heutiger Z. 152-166 1:1 */ }
    ladeStats()
  }, [user, istDemoModus])

  const bereitsVerwendetSet = useMemo(() => new Set(bereitsVerwendet), [bereitsVerwendet])
  const filter = useFragenFilter(alleFragen, user?.email, ladeStatus, istDemoModus)

  // Hooks (T.c)
  const editor = useFragenEditor({ user, istDemoModus, alleFragen, sortierteFragen: filter.sortierteFragen, ladeStatus, initialEditFrageId, onFrageAktualisiert })
  const aktionen = useFragenAktionen({ user, istDemoModus, onFrageAktualisiert })

  // Modal-Toggles (UI-State, bleibt im Caller per Brainstorming-Beschluss)
  const [zeigImport, setZeigImport] = useState(false)
  const [zeigExcelImport, setZeigExcelImport] = useState(false)
  const [zeigBatchExport, setZeigBatchExport] = useState(false)

  const toggleFrageInPruefung = useCallback((frageId: string) => {
    if (bereitsVerwendetSet.has(frageId)) onEntfernen?.(frageId)
    else onHinzufuegen([frageId])
  }, [bereitsVerwendetSet, onEntfernen, onHinzufuegen])

  function toggleGruppe(key: string) {
    filter.setAufgeklappteGruppen((prev) => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key); else neu.add(key)
      return neu
    })
  }

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

  const modals = (
    <>
      {editor.zeigEditor && <FragenEditor key={editor.editFrage?.id ?? 'neu'} frage={editor.editFrage} onSpeichern={editor.speichern} onAbbrechen={editor.abbrechen} performance={editor.editFrage ? fragenStats.get(editor.editFrage.id) : undefined} onVorherigeFrage={editor.nachbarCallbacks.onVor} onNaechsteFrage={editor.nachbarCallbacks.onNach} autoSave={editor.autoSaveAdapter} />}
      <SchliessenModal open={editor.schliessenModal !== null} variante={editor.schliessenModal ?? 'unvollstaendig'} onAbbrechen={editor.modalAbbrechen} onVerwerfen={() => void editor.modalVerwerfen()} onAlsEntwurfBehalten={editor.schliessenModal === 'unvollstaendig' ? editor.modalEntwurfBehalten : undefined} />
      <LoeschBestaetigungsDialog kandidat={aktionen.loeschKandidat} onAbbrechen={aktionen.abbrechenLoeschen} onBestaetigen={aktionen.bestaetigenLoeschen} />
      {zeigImport && <FragenImport onImportiert={async (fragen) => { await aktionen.importieren(fragen); setZeigImport(false) }} onSchliessen={() => setZeigImport(false)} />}
      {zeigExcelImport && <ExcelImport onImportiert={async (fragen) => { await aktionen.importieren(fragen); setZeigExcelImport(false) }} onSchliessen={() => setZeigExcelImport(false)} bestehendeIds={new Set(alleFragen.map(f => f.id))} />}
      {zeigBatchExport && <BatchExportDialog fragen={filter.gefilterteFragen as Frage[]} onSchliessen={() => setZeigBatchExport(false)} onErfolg={(updates) => { /* heutige Z. 564-571 1:1 */ }} />}
    </>
  )

  if (inline) return <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">{body}{modals}</div>

  return (
    <>
      <ResizableSidebar mode="overlay" onClose={onSchliessen} topOffset={headerH} storageKey="fragensammlung-breite">
        <div ref={panelRef} className="flex flex-col h-full">{body}</div>
      </ResizableSidebar>
      {modals}
    </>
  )
}
```

**Hinweis zu `onNeueFrageErstellen`:** Heute `() => { setEditFrage(null); setZeigEditor(true) }` direkt. Bei Hook-Cut: zwei Möglichkeiten — entweder `editor.oeffnen(null as any)` (hässlich) oder eigene Service-Method `editor.oeffnenNeu()`. Plan-Phase entscheidet finale Form. Saubere Lösung: `oeffnenNeu()` als zusätzliche Service-Method.

### 4.7 Hybrid-Sprach-Konvention (Bundle V)

Domain (Frage/Editor/Aktion/Lösch/Verwerfen) deutsch. UI-Strings deutsch mit Umlaut. Identifier ohne Umlaut (`loeschKandidat`, `oeffnen`, `verwerfen`). React-Konventionen englisch (`onChange`, `useState`, `useEffect`, `Props`). Programming-Primitives englisch (`id`, `meta`, `data`).

## 5. Test-Strategie

### 5.1 Vitest

**Drift = 0** neue Tests. Alle 3 Service-Methods in `useFragenEditor` (`oeffnen`/`speichern`/`modalVerwerfen`) sind async mit Store/Network-Side-Effects (`apiService.ladeDetail` / `apiService.speichereFrage` / `apiService.loescheFrage`). Alle 5 Service-Methods in `useFragenAktionen` ebenfalls async + Store-Mutationen. Damit Master-Spec 4.2 Klassifikation: **Async-Store-Orchestration → NEIN Vitest, Browser-E2E reicht**. UI-Komponenten Body + LoeschDialog sind Render-Komposition → Browser-E2E.

Bestehende Tests bleiben grün — kein Test referenziert `FragenBrowser.tsx` direkt. `useFragenFilter`/`useFragenAutoSave`-Tests (falls vorhanden) sind unberührt.

### 5.2 Browser-E2E auf staging (echte LP-Logins, SW-Cache vorab zurückgesetzt)

| # | Pfad | Erwartung |
|---|---|---|
| 1 | LP-Editor öffnen | Klick auf Frage → Detail-Spinner → Editor mit AutoSave-Status erscheint |
| 2 | Auto-Save-Pfad | Tippen im Editor → SaveStatusIndikator zeigt 'sync-läuft' → 'sauber' (draftSync-Roundtrip) |
| 3 | Schliessen-Modal 'sync-pending' | Tippen + sofort Schliessen → Modal blockt; "Verwerfen" → DevTools-Network zeigt `loescheFrage`-POST + KEIN nachgelagerter `tippeFrage`-POST überschreibt geloescht_am (un-delete-Race-Mitigation observierbar) |
| 4 | Schliessen-Modal 'unvollstaendig' | Pflichtfeld leer → Modal mit "Als Entwurf behalten" / "Verwerfen" |
| 5 | Lösch-Dialog | DetailKarte-Trash-Icon → Bestätigungs-Dialog → "Endgültig löschen" → Frage weg aus Liste |
| 6 | Import-Pfad | JSON/Excel-Import → fuegeFragenHinzu + Backend-Speicher |
| 7 | Duplizieren | DetailKarte-Duplicate-Icon → apiService.dupliziereFrage → Store-Refresh, Kopie in Liste |
| 8 | Inline + Overlay-Modus | Beide Wrapper-Pfade rendern Body identisch (Composer-inline + Standalone-overlay) |
| 9 | Editor-Navigation | Vor/Nach-Buttons im Editor wechseln zur Nachbar-Frage (nachbarCallbacks); Neighbor-Prefetch Network-Visible |
| 10 | 0 Console-Errors | über alle 9 Pfade |

## 6. Risiken & Mitigationen

| Risiko | Mitigation |
|---|---|
| **AutoSave-Race (un-delete-Race, Bundle-3-hotfix#5)** — `cancelPending` heute 2× synchron mit `liveFrage.id`. Hook-Cut könnte versplittern. | `modalVerwerfen()`-Service-API kapselt beide Cancel-Calls + `loescheFrage` + `setSchliessenModal(null)` zentral. Caller hat keinen Zugriff auf `liveFrage`/`setLiveFrage`. Browser-E2E-Pfad #3 verifiziert. |
| **`liveFrage`-Subscription-Drift** — `useFragenAutoSave(editorId, liveFrage)` muss synchron mit `editFrage`-Wechsel + Tipp-Updates bleiben (Bundle-3-hotfix#2 `feedback_stable_uuid_neue_entitaeten`). | `liveFrage`-State + `setLiveFrage(editFrage)`-Sync-Effect + `onTippe`-Callback bleiben innerhalb `useFragenEditor`. Single-Source-of-Truth. |
| **`initialEditFrageId`-Trigger nur einmal** — heutiger eslint-disable-Pattern (Z. 178). Hook-Cut darf nicht reopen-loop verursachen. | `useEffect` mit `[ladeStatus, initialEditFrageId]`-deps + Idempotenz-Guard `if (editFrage?.id === initialEditFrageId) return` 1:1 in Hook übernehmen. |
| **`<FragenBrowserBody>`-Prop-Drift bei 35-Prop-Header** | Pass-through via `filter`-Object (statt 32 einzelne Props): Body bekommt `filter: ReturnType<typeof useFragenFilter>` und destrukturiert intern. Reduziert Prop-Drift-Risiko. |
| **`detailLaden`-Spinner-Race** | `detailLaden` ist Hook-State (privat im useFragenEditor). Body bekommt `detailLaden` als Prop und rendert Spinner-Overlay. |
| **Service-Worker-Cache vor E2E** | SW-unregister + caches.delete + reload als Routine. T.c berührt keinen Wire-Vertrag, aber Bundle-N-Lehre als Sicherheits-Routine. |
| **Subagent-Branch-Drift** | Branch `feature/bundle-t-c-fragen-browser` von main, explizit im Subagent-Prompt + remote pushen vor Folge-Subagents (Lehre `feedback_subagent_shell_context`). |
| **Inline-vs-Overlay-Modal-Mount-Position** | inline-Mode rendert Modals INNERHALB `<div className="flex-1 ...">`. overlay-Mode rendert Modals NACH `<ResizableSidebar>` (siehe heute Z. 679-765). Both render `body` identisch — der Unterschied liegt in Modal-Container-Position. Test #8 verifiziert. |

## 7. Definition of Done (Bundle-S/L-Standard)

- [ ] `npx vitest run` grün — drift = 0 (kein neuer Test, kein Test-Bruch)
- [ ] `npx tsc -b` clean (Output direkt prüfen, nicht nur Exit-Code — Lehre `feedback_tsc_b_exit_misleading`)
- [ ] `npm run lint:as-any` clean
- [ ] `npm run lint:no-alert` clean
- [ ] `npm run lint:no-tests-dir` clean
- [ ] `npm run lint:musterloesung` clean
- [ ] `npm run build` (vite build) erfolgreich
- [ ] `FragenBrowser.tsx` <500 Z. (Ziel ~225 Z.)
- [ ] Browser-E2E auf staging mit echten LP-Logins, alle 10 Pfade aus 5.2 ✓
- [ ] 0 Console-Errors auf staging
- [ ] Code-Reviewer-Subagent APPROVED
- [ ] HANDOFF.md-Eintrag + Memory-Update

**Hotspot-Bilanz nach T.c:** Files >500 Z. **11 → 10**.

## 8. Roadmap-Position

T.c ist Sub-Bundle 3/6 in Bundle T. Risiko-aufsteigende Reihenfolge: T.a ✓ → T.b ✓ → **T.c** → T.d (ZeichnenCanvas, hoch-Risiko) → T.e (Dashboard-Üben, hoch-Risiko) → T.f (LPStartseite, hoch-Risiko).

**Pause-Punkt nach T.c (Master-Spec 8.3):** Zwischen-Reflexion empfohlen — hat sich Hook-Naming bewährt? Sollte Test-Hybrid-Schwelle nachjustiert werden? Entweder Master-Spec ergänzen oder einfach in T.d–T.f anwenden.
