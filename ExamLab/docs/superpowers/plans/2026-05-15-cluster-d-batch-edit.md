# Cluster D — Batch-Edit Fragensammlung Implementation Plan

> **For agentic workers:** REQUIRED: Use @superpowers:subagent-driven-development (8 Sub-Tasks geplant, Bündelung nach `feedback_subagent_task_buendelung.md`). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LP kann in der Fragensammlung mehrere Fragen gleichzeitig anwählen, gemeinsam bearbeiten (fachbereich/bloom/status/gefaesse/semester/tagIds/lernzielIds) oder löschen — über Checkbox + Floating-Bar + Editor-Batch-Modus mit Confirm-Modal.

**Architecture:** Selektions-Store für IDs (Cross-Filter), Bulk-API mit Mutually-Exclusive Tag-Modi (Hinzufügen/Ersetzen/Entfernen), Editor im `batchMode`-Prop mit violet-highlighted Feldern + 3-Modi-Radio für Tags, Confirm-Modal mit Diff-Anzeige. Audit-Log via bestehender `auditLog_()`-Infrastruktur (Sheet `AuditLog`).

**Tech Stack:** React 19 + TypeScript + Vite + Zustand (mit `useShallow`) + Tailwind CSS v4 + Apps-Script Backend + Vitest.

**Spec:** [2026-05-11-cluster-d-batch-edit-design.md](../specs/2026-05-11-cluster-d-batch-edit-design.md) — 482 Zeilen, Approved with 5 Recommendations applied.

**Voraussetzungen (alle erfüllt):**
- ✅ Cluster H Phase 2 LIVE (preview/main `31bdf81`): `Tag` in `packages/shared/src/types/tag.ts`, `tagsStore.getByIds()`, `TagPicker`-DI-Slot in `SharedFragenEditor.tsx:184-198`
- ✅ Cluster H ist unabhängig von Phase 3 (tagsLegacy-Cleanup) — kein Warten auf 29.05.
- ✅ Audit-Log-Infrastruktur: `auditLog_()` in `apps-script-code.js:384-394`, Sheet `AuditLog`
- ✅ Cluster A `optimisticDelete`-Helper existiert: `ExamLab/src/utils/optimisticDelete.ts` (Tests vorhanden)
- ✅ Re-Fetch-Hook: `fragensammlungStore.ladeAlleDetails(email)` (Z. 126+)
- ✅ Memory-Patterns: `feedback_service_wrapper_email_pflicht.md`, `feedback_zustand_selector_useshallow.md`, `feedback_subagent_task_buendelung.md`, `feedback_push_konflikt_rate.md`, `feedback_grep_anwesenheit_nicht_abwesenheit.md`, `feedback_backend_read_paths_audit.md`

**Aufwand-Schätzung (mit Buffer):** Spec sagt 4.5 Tage. Realistisch (Memory-Pattern Cluster H Phase 1+2 hatte 3 Hotfixes) **5-6 Tage** inkl. Apps-Script-Deploy-Round-Trips + erwartbare Hotfixes.

**Branch:** `feature/cluster-d-batch-edit-spec-update` (Spec bereits committed: `382200b` Polish, `21669a0` Spec-Update). Implementation-Commits gehen on top.

---

## File Structure

### Neue Dateien (Frontend, ExamLab)

| Pfad | Zweck |
|------|-------|
| `ExamLab/src/store/fragenSelectionStore.ts` | Zustand-Store für Selektions-IDs (Set<string>) + toggle/range-select |
| `ExamLab/src/store/fragenSelectionStore.test.ts` | Vitest für Store-Logik |
| `ExamLab/src/services/fragenBulkApi.ts` | `bulkUpdateFragen` + `bulkLoescheFragen` Service-Wrapper (email-Pflicht-Param, unwrap-Pattern aus tagsApi.ts) |
| `ExamLab/src/services/fragenBulkApi.test.ts` | Vitest für API-Wrapper |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenSelektionBar.tsx` | Floating-Action-Bar (Edit/Löschen/Beschränken/Auswahl-aufheben) |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenSelektionBar.test.tsx` | Vitest |
| `ExamLab/src/components/lp/fragensammlung/BatchConfirmModal.tsx` | Confirm-Modal mit Diff + Tag-Modus-Sektionen (grün/rot/orange) |
| `ExamLab/src/components/lp/fragensammlung/BatchConfirmModal.test.tsx` | Vitest |
| `ExamLab/src/components/lp/fragensammlung/BatchLoeschConfirmModal.tsx` | Confirm-Modal für Bulk-Löschen |

### Neue Dateien (Shared Editor)

| Pfad | Zweck |
|------|-------|
| `packages/shared/src/editor/BatchEditorBanner.tsx` | Banner „Batch-Bearbeitung von N Fragen" + Sichtbar-Diff |
| `packages/shared/src/editor/BatchTagPicker.tsx` | Wrapper um TagPicker-DI-Slot + 3-Modi-Radio (Hinzufügen/Ersetzen/Entfernen) |

### Geänderte Dateien

| Pfad | Änderung |
|------|----------|
| `packages/shared/src/types/fragen-core.ts` | `status: 'draft' \| 'sammlung'` in `FrageBase` ergänzen (Phase 0) |
| `ExamLab/src/types/fragen-storage.ts:27` | `status?:` aus Storage-Extension entfernen (Hard-Cut zu FrageBase) |
| `packages/shared/src/editor/MetadataSection.tsx` | Status-RadioGroup unter `bloom` + violet-Ring-Wrapper für batchMode |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | `batchMode?: { count, sichtbareCount }`-Prop + Banner-Mount + Disable nicht-batch-barer Felder |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx` | Checkbox (16px) links neben Frage-Info, `selektiert.has(id)` |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx` | „Alle anzeigen auswählen (N)"-Button |
| `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx` | `<FragenSelektionBar />` mounten wenn `selektiert.size > 0` |
| `ExamLab/apps-script-code.js` | `apiBackfillStatusDefault` + `apiBulkUpdateFragen` + `apiBulkLoescheFragen` + parseFrage-Update + Audit-Log-Calls |

---

## Sub-Task 1 — Phase 0: `status`-Feld pre-Batch

**Files:**
- Modify: `packages/shared/src/types/fragen-core.ts` (FrageBase)
- Modify: `ExamLab/src/types/fragen-storage.ts:27` (entfernen)
- Modify: `packages/shared/src/editor/MetadataSection.tsx` (Status-Toggle unter bloom)
- Modify: `ExamLab/apps-script-code.js` (parseFrage + 4 Schreib-Pfade + `apiBackfillStatusDefault`)
- Test: `packages/shared/src/editor/MetadataSection.test.tsx`

### Steps

- [ ] **Step 1.0: Pre-Cut Audit (Memory `feedback_grep_anwesenheit_nicht_abwesenheit.md`)**

Vor dem Cut: explizit greppen welche Konsumenten der heutigen Storage-Extension-`status` existieren:
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -rn "fragen-storage" --include="*.ts" --include="*.tsx" ExamLab/src packages/shared
grep -rn "\.status\s*[=:!]" --include="*.ts" --include="*.tsx" ExamLab/src/components ExamLab/src/store | grep -v test
```
Erwartung: nur Type-Imports + Status-Reader (Filter/Anzeige), keine Hart-Verdrahtung gegen Storage-Extension. Bei mehr als ein Eintrag → Plan-Phase erweitern (Step 1.1a für jeden weiteren Consumer-Sweep).

- [ ] **Step 1.1: Type-Cut FrageBase + Storage-Extension**

`packages/shared/src/types/fragen-core.ts` `FrageBase` ergänzen:
```ts
status?: 'draft' | 'sammlung';  // Single source of truth (war Storage-Extension)
```

`ExamLab/src/types/fragen-storage.ts` Zeile entfernen (vermutlich Z. 25-27 — `grep -n "status" ExamLab/src/types/fragen-storage.ts` zum Bestätigen).

Test: `npx tsc --noEmit` — Erwartung: clean (kein Konsument hat status hart-typisiert).

- [ ] **Step 1.2: MetadataSection — Status-RadioGroup**

`packages/shared/src/editor/MetadataSection.tsx` direkt unter Bloom-Dropdown (vermutlich Z. 145+) RadioGroup einfügen:
```tsx
<div className={batchMode ? 'ring-1 ring-violet-300 dark:ring-violet-700 rounded-lg p-2 bg-violet-50/30 dark:bg-violet-900/10' : ''}>
  <Label>Status</Label>
  <RadioGroup value={status ?? 'sammlung'} onChange={setStatus}>
    <Radio value="draft">Entwurf</Radio>
    <Radio value="sammlung">Sammlung</Radio>
  </RadioGroup>
</div>
```

Props erweitern: `status?: 'draft' | 'sammlung'; setStatus: (s: 'draft'|'sammlung') => void; batchMode?: boolean;`.

- [ ] **Step 1.3: Test — Status-Toggle rendert + Default-Fallback**

`packages/shared/src/editor/MetadataSection.test.tsx`:
```ts
it('rendert Status-RadioGroup, Default "sammlung" für Legacy-Frage', () => {
  render(<MetadataSection status={undefined} setStatus={vi.fn()} ... />)
  expect(screen.getByRole('radio', {name: 'Sammlung'})).toBeChecked()
})

it('switched von Entwurf zu Sammlung', () => {
  const setStatus = vi.fn()
  render(<MetadataSection status="draft" setStatus={setStatus} ... />)
  fireEvent.click(screen.getByRole('radio', {name: 'Sammlung'}))
  expect(setStatus).toHaveBeenCalledWith('sammlung')
})
```

Run: `cd ExamLab && npx vitest run packages/shared/src/editor/MetadataSection.test.tsx` — Expected: PASS.

- [ ] **Step 1.4: SharedFragenEditor — status durchschleifen**

`packages/shared/src/editor/SharedFragenEditor.tsx`:
- `useState` für `status` (default aus `frage.status ?? 'sammlung'`)
- Form-Submission inkludiert `status`
- `MetadataSection` mit `status` + `setStatus` Props

Test: Vitest für SharedFragenEditor (existing test file erweitern) — submitted-Payload enthält `status: 'sammlung'`.

- [ ] **Step 1.5: Apps-Script — Schreib-Pfade konkret + Status-Inferenz-Konflikt lösen**

**Audit-Befund (Reviewer 15.05.2026):** `ExamLab/apps-script-code.js:4519` setzt heute:
```js
const status = istVollstaendig_(frage) ? 'sammlung' : 'draft';
```
Diese Auto-Derivation **überschreibt User-Wahl**. Phase 0 muss diesen Konflikt explizit lösen.

**Entscheidung (Plan-Phase 15.05.2026):** Hybrid — User-Wahl wins wenn explizit gesetzt, Auto-Derivation als Default für Legacy/Neu-Anlage:

```js
// In speichereFrageIntern_ (Z. 4519 ersetzen)
const status = frage.status !== undefined
  ? frage.status                                            // User-Wahl gewinnt
  : (istVollstaendig_(frage) ? 'sammlung' : 'draft');       // Default-Auto
```

Frontend muss `status` im Submit-Payload **nur** mit-senden wenn User es im Editor explizit geändert hat (Form-Dirty-Check, sonst undefined). Sonst Backward-Compat zerstört: alte Frontends ohne Status-Feld senden `status: undefined` → Auto-Derivation greift weiterhin.

**Konkrete Schreib-Pfade (aus Reviewer-Audit + grep `tagIds`-Vorbild aus Cluster H Phase 0):**

| Pfad | Datei:Zeile | Was |
|------|-------------|-----|
| Single-Speichern | `apps-script-code.js:4519` | Status-Konflikt-Logic ersetzen (siehe oben) |
| Pool-Schreib | `apps-script-code.js:~5149` | Pool-Sync-Pfad — Status mit übernehmen |
| Summary-Read | `apps-script-code.js:5688-5690` | `frageZuSummary_` — Status durchreichen (schon korrekt!) |
| Pool-Sync | `apps-script-code.js:~6257-6349` | Pool-Sync-Pfad — Status mit synchronisieren |
| Import | `apps-script-code.js:~14359` | Import-Pfad (wenn vorhanden) — Status mit übernehmen |
| Read | `apps-script-code.js:3584` | `parseFrage` — Status lesen (heute schon korrekt `row.status === 'draft' ? 'draft' : 'sammlung'`) |

**Konkrete Step-Anweisung:**
1. `grep -n "tagIds" apps-script-code.js` zeigt analoge Stellen — pro Stelle `status: frage.status` analog ergänzen.
2. Für Z. 4519 die o.g. Hybrid-Logic einsetzen.
3. Sheet-Header-Migration: wenn `status`-Spalte im Fragen-Sheet fehlt → neue Spalte anlegen, alte Reihen bleiben leer (Backfill in Step 1.6 macht den Rest).

- [ ] **Step 1.6: Apps-Script — `apiBackfillStatusDefault`**

Neuer Endpoint analog `apiMigriereTagsZuObjects` aus Cluster H:
```js
function apiBackfillStatusDefault_(body) {
  pruefeAdminOderFehler_(body.email);
  let count = 0;
  // iteriere alle Fragen-Sheets aus FACHBEREICH_SHEETS
  // für jede Row: wenn status leer → setze 'sammlung' (oder via istVollstaendig_-Heuristik)
  // setValues-Batch für Performance (Cluster H Phase 0 C1-Pattern)
  auditLog_('backfillStatus', body.email, {count, defaultWert: 'sammlung'});
  return {success: true, count};
}
```

Router-Case `case 'apiBackfillStatusDefault':` ergänzen.

- [ ] **Step 1.6a: AdminTab — Backfill-UI-Button**

`ExamLab/src/components/lp/einstellungen/AdminTab.tsx` (Cluster-H-Tag-Migration-Section als Vorbild, vermutlich Z. 256-289 — exakter Pfad via `grep -n "Tag-Migration\|apiMigriereTagsZuObjects" ExamLab/src/components/lp/einstellungen/AdminTab.tsx`):

```tsx
const [statusBackfillLaeuft, setStatusBackfillLaeuft] = useState(false)
const [statusBackfillErgebnis, setStatusBackfillErgebnis] = useState<{count: number} | null>(null)

async function handleStatusBackfill() {
  if (!confirm('Status-Backfill startet — alle Fragen ohne Status bekommen Default "sammlung". Fortfahren?')) return
  setStatusBackfillLaeuft(true)
  try {
    const r = await postJson<{count: number; success?: boolean}>('apiBackfillStatusDefault', { email: user.email })
    if (r?.success === false) throw new Error('Backfill fehlgeschlagen')
    setStatusBackfillErgebnis({count: r?.count ?? 0})
  } finally { setStatusBackfillLaeuft(false) }
}

// In JSX:
<section className="border rounded-lg p-4 mb-4">
  <h3>Phase 0 — Status-Feld Backfill (einmalig)</h3>
  <Button onClick={handleStatusBackfill} disabled={statusBackfillLaeuft} variant="primary">
    {statusBackfillLaeuft ? 'läuft...' : 'Status-Backfill starten'}
  </Button>
  {statusBackfillErgebnis && <p>✅ {statusBackfillErgebnis.count} Fragen mit Default "sammlung" befüllt</p>}
</section>
```

- [ ] **Step 1.7: Commit Sub-Task 1**

```bash
git add packages/shared/src/types/fragen-core.ts \
        ExamLab/src/types/fragen-storage.ts \
        packages/shared/src/editor/MetadataSection.tsx \
        packages/shared/src/editor/MetadataSection.test.tsx \
        packages/shared/src/editor/SharedFragenEditor.tsx \
        ExamLab/src/components/lp/einstellungen/AdminTab.tsx \
        ExamLab/apps-script-code.js
git commit -m "Cluster D Phase 0: status-Feld zu FrageBase + Editor + Backend-Backfill + AdminTab-UI"
```

**Hand-off:** User deployt Apps-Script (neue Version mit `apiBackfillStatusDefault`) + öffnet AdminTab → klickt den in Step 1.6a gebauten „Status-Backfill starten"-Button.

---

## Sub-Task 2 — Phase 1a: `fragenSelectionStore`

**Files:**
- Create: `ExamLab/src/store/fragenSelectionStore.ts`
- Test: `ExamLab/src/store/fragenSelectionStore.test.ts`

### Steps

- [ ] **Step 2.1: Write failing test**

`ExamLab/src/store/fragenSelectionStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useFragenSelectionStore } from './fragenSelectionStore'

describe('fragenSelectionStore', () => {
  beforeEach(() => useFragenSelectionStore.getState().leereSelektion())

  it('toggle fügt ID hinzu', () => {
    useFragenSelectionStore.getState().toggle('id1')
    expect(useFragenSelectionStore.getState().selektiert.has('id1')).toBe(true)
  })

  it('toggle entfernt ID beim zweiten Klick', () => {
    useFragenSelectionStore.getState().toggle('id1')
    useFragenSelectionStore.getState().toggle('id1')
    expect(useFragenSelectionStore.getState().selektiert.has('id1')).toBe(false)
  })

  it('Shift-Click selektiert Range über sichtbareIds', () => {
    const sichtbareIds = ['a', 'b', 'c', 'd', 'e']
    useFragenSelectionStore.getState().toggle('a', { sichtbareIds })
    useFragenSelectionStore.getState().toggle('d', { shift: true, sichtbareIds })
    const s = useFragenSelectionStore.getState().selektiert
    expect(s.has('a') && s.has('b') && s.has('c') && s.has('d')).toBe(true)
  })

  it('beschraenkeAufFilter entfernt nicht-sichtbare IDs', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a','b','c']))
    useFragenSelectionStore.getState().beschraenkeAufFilter(['a','c'])
    expect(Array.from(useFragenSelectionStore.getState().selektiert).sort()).toEqual(['a','c'])
  })

  it('alleSichtbarenAuswaehlen addiert alle sichtbare IDs zu bestehenden', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['x']))
    useFragenSelectionStore.getState().alleSichtbarenAuswaehlen(['a','b'])
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(3)
  })
})
```

Run: `cd ExamLab && npx vitest run src/store/fragenSelectionStore.test.ts` — Expected: FAIL (module nicht da).

- [ ] **Step 2.2: Minimal-Implementation**

`ExamLab/src/store/fragenSelectionStore.ts`:
```ts
import { create } from 'zustand'

interface FragenSelectionState {
  selektiert: Set<string>
  letzterKlick: string | null
  toggle: (id: string, opts?: { shift?: boolean; sichtbareIds?: string[] }) => void
  setzeSelektion: (ids: Set<string>) => void
  leereSelektion: () => void
  alleSichtbarenAuswaehlen: (sichtbareIds: string[]) => void
  beschraenkeAufFilter: (sichtbareIds: string[]) => void
}

export const useFragenSelectionStore = create<FragenSelectionState>((set, get) => ({
  selektiert: new Set(),
  letzterKlick: null,
  toggle: (id, opts) => {
    const { selektiert, letzterKlick } = get()
    const next = new Set(selektiert)
    if (opts?.shift && letzterKlick && opts.sichtbareIds) {
      const a = opts.sichtbareIds.indexOf(letzterKlick)
      const b = opts.sichtbareIds.indexOf(id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        const target = !selektiert.has(id)
        for (let i = lo; i <= hi; i++) {
          if (target) next.add(opts.sichtbareIds[i])
          else next.delete(opts.sichtbareIds[i])
        }
      }
    } else {
      next.has(id) ? next.delete(id) : next.add(id)
    }
    set({ selektiert: next, letzterKlick: id })
  },
  setzeSelektion: (ids) => set({ selektiert: new Set(ids) }),
  leereSelektion: () => set({ selektiert: new Set(), letzterKlick: null }),
  alleSichtbarenAuswaehlen: (sichtbareIds) => {
    const next = new Set(get().selektiert)
    sichtbareIds.forEach(id => next.add(id))
    set({ selektiert: next })
  },
  beschraenkeAufFilter: (sichtbareIds) => {
    const sichtbareSet = new Set(sichtbareIds)
    const next = new Set<string>()
    get().selektiert.forEach(id => { if (sichtbareSet.has(id)) next.add(id) })
    set({ selektiert: next })
  },
}))
```

Run tests: Expected PASS.

- [ ] **Step 2.3: useShallow-Selector-Helper exportieren**

In `fragenSelectionStore.ts` ergänzen (für Konsumenten mit Array-Output, Memory `feedback_zustand_selector_useshallow.md`):
```ts
import { useShallow } from 'zustand/react/shallow'

export function useSelektierteIds(): string[] {
  return useFragenSelectionStore(useShallow(s => Array.from(s.selektiert)))
}
```

Test ergänzen — mehrere Renderings mit gleichem Set → keine neue Referenz, kein Re-Render.

- [ ] **Step 2.4: Commit Sub-Task 2**

```bash
git add ExamLab/src/store/fragenSelectionStore.ts ExamLab/src/store/fragenSelectionStore.test.ts
git commit -m "Cluster D Phase 1a: fragenSelectionStore + useShallow-Hook"
```

---

## Sub-Task 3 — Phase 1b: Bulk-API (Frontend + Backend)

**Files:**
- Create: `ExamLab/src/services/fragenBulkApi.ts`
- Test: `ExamLab/src/services/fragenBulkApi.test.ts`
- Modify: `ExamLab/apps-script-code.js` (`apiBulkUpdateFragen` + `apiBulkLoescheFragen`)

### Steps

- [ ] **Step 3.1: Frontend-Wrapper — Test zuerst**

`ExamLab/src/services/fragenBulkApi.test.ts`: Tests für `bulkUpdateFragen(ids, patch, email)` analog `tagsApi.test.ts`:
- email-Pflicht-Param (Test: ohne email → Error)
- Mutually-Exclusive Tag-Modi (lokale Validierung vor Network)
- unwrap-Pattern (success:false → Error)
- partial-failure-Response mit `affectedIds` + `failedIds`

- [ ] **Step 3.2: Frontend-Wrapper-Implementation**

`ExamLab/src/services/fragenBulkApi.ts` (Vorbild: `ExamLab/src/services/tagsApi.ts`):
```ts
import { postJson } from './apiClient'

interface ApiResponse { success?: boolean; error?: string; [key: string]: unknown }

interface FragenBulkPatch {
  fachbereich?: 'VWL'|'BWL'|'Recht'|'Informatik'|'Allgemein'
  bloom?: 'K1'|'K2'|'K3'|'K4'|'K5'|'K6'
  status?: 'draft'|'sammlung'
  gefaesse?: string[]
  semester?: string[]
  lernzielIds?: string[]
  tagsHinzufuegen?: string[]
  tagsErsetzen?: string[]
  tagsEntfernen?: string[]
}

interface FragenBulkResult {
  erfolgreich: number
  affectedIds: string[]
  fehlgeschlagen: string[]
}

function unwrap<T extends ApiResponse>(r: T | null, action: string): T {
  if (!r) throw new Error(`${action}: keine Antwort vom Server`)
  if (r.success === false) throw new Error(r.error || `${action}: fehlgeschlagen`)
  return r
}

function validateMutuallyExclusive(patch: FragenBulkPatch): void {
  const tagModiCount = [patch.tagsHinzufuegen, patch.tagsErsetzen, patch.tagsEntfernen]
    .filter(x => x !== undefined).length
  if (tagModiCount > 1) {
    throw new Error('Nur einer von tagsHinzufuegen/tagsErsetzen/tagsEntfernen darf gesetzt sein')
  }
}

export async function bulkUpdateFragen(
  ids: string[],
  patch: FragenBulkPatch,
  email: string,
): Promise<FragenBulkResult> {
  validateMutuallyExclusive(patch)
  const r = await postJson<ApiResponse & FragenBulkResult>(
    'apiBulkUpdateFragen', { email, ids, patch }
  )
  const u = unwrap(r, 'apiBulkUpdateFragen')
  return { erfolgreich: u.erfolgreich, affectedIds: u.affectedIds, fehlgeschlagen: u.fehlgeschlagen }
}

export async function bulkLoescheFragen(
  ids: string[],
  email: string,
): Promise<FragenBulkResult> {
  const r = await postJson<ApiResponse & FragenBulkResult>(
    'apiBulkLoescheFragen', { email, ids }
  )
  const u = unwrap(r, 'apiBulkLoescheFragen')
  return { erfolgreich: u.erfolgreich, affectedIds: u.affectedIds, fehlgeschlagen: u.fehlgeschlagen }
}
```

Run tests: Expected PASS.

- [ ] **Step 3.3: Apps-Script — `apiBulkUpdateFragen`**

`ExamLab/apps-script-code.js` Router-Case ergänzen:
```js
case 'apiBulkUpdateFragen':
  return jsonResponse_(apiBulkUpdateFragen_(body));
case 'apiBulkLoescheFragen':
  return jsonResponse_(apiBulkLoescheFragen_(body));
```

Function-Body `apiBulkUpdateFragen_`:
```js
function apiBulkUpdateFragen_(body) {
  pruefeLPOderFehler_(body.email);
  validateMutuallyExclusiveTags_(body.patch);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const affectedIds = [];
    const failedIds = [];
    body.ids.forEach(id => {
      try {
        updateFrageMitPatch_(id, body.patch);  // pro-Frage Apply
        affectedIds.push(id);
      } catch (e) {
        failedIds.push(id);
      }
    });
    auditLog_('batchEditFragen', body.email, {
      count: affectedIds.length,
      affectedIds, failedIds,
      patch: body.patch,
      tagsModus: body.patch.tagsHinzufuegen ? 'hinzufuegen'
              : body.patch.tagsErsetzen ? 'ersetzen'
              : body.patch.tagsEntfernen ? 'entfernen' : undefined,
      tagIds: body.patch.tagsHinzufuegen || body.patch.tagsErsetzen || body.patch.tagsEntfernen,
    });
    return { success: true, erfolgreich: affectedIds.length, affectedIds, fehlgeschlagen: failedIds };
  } finally { lock.releaseLock(); }
}
```

Helper `validateMutuallyExclusiveTags_`: Backend-Doppel-Validierung (Frontend macht's auch, Defense in Depth).

**Helper `updateFrageMitPatch_` — PARTIAL-UPDATE, NICHT ganze Frage neu schreiben:**

Wichtig: `speichereFrageIntern_` schreibt die GANZE Frage und ist deshalb **kein** Vorbild — beim Bulk-Update darf nur das im Patch gesetzte verändert werden, sonst Data-Loss bei den nicht-im-Patch Feldern (Fragetext etc.).

**Pre-Check (Memory `feedback_grep_anwesenheit_nicht_abwesenheit.md`):** Vor Implementation verifizieren ob Hilfs-Funktionen `findeFrageSheet_` und `findeRowIndexByFrageId_` (oder Analoga) bereits existieren:
```bash
grep -n "findeFrageSheet_\|findeRowIndexByFrageId_\|findeRowByFrageId" ExamLab/apps-script-code.js
```
Falls nicht vorhanden: Step 3.3a Helper-Implementation ergänzen (analog zu `getTagSheet_` aus Cluster H — Sheet finden über `FACHBEREICH_SHEETS`-Map, Row-Index via `findIndex` auf `getValues()`).

Pattern: lese Row → merge nur Patch-Felder → setze nur veränderte Spalten via `getRange(row, col).setValue()`.

```js
function updateFrageMitPatch_(id, patch) {
  const sheet = findeFrageSheet_(id);  // analog getFrageSheet aus Tag-Logik
  const rowIdx = findeRowIndexByFrageId_(sheet, id);  // existing helper
  if (rowIdx === -1) throw new Error('Frage nicht gefunden: ' + id);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const aktuelleRow = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Pro Patch-Feld: nur die zugehörige Zelle setzen (nicht die ganze Row neu schreiben!)
  for (const [field, neuWert] of Object.entries(patch)) {
    if (field.startsWith('tags')) continue;  // Tag-Modi separat behandeln
    const col = headers.indexOf(field) + 1;
    if (col < 1) continue;  // Spalte fehlt → silent skip (oder neue Spalte anlegen, je nach Feld)
    sheet.getRange(rowIdx, col).setValue(neuWert);
  }

  // Tag-Modi: alteTagIds laden, je Modus mergen, dann tagIds-Spalte schreiben
  if (patch.tagsHinzufuegen || patch.tagsErsetzen || patch.tagsEntfernen) {
    const tagIdsCol = headers.indexOf('tagIds') + 1;
    const alteTagIds = JSON.parse(aktuelleRow[tagIdsCol - 1] || '[]');
    let neueTagIds;
    if (patch.tagsHinzufuegen) {
      neueTagIds = Array.from(new Set([...alteTagIds, ...patch.tagsHinzufuegen]));
    } else if (patch.tagsErsetzen) {
      neueTagIds = patch.tagsErsetzen;
    } else { // tagsEntfernen
      const entferneSet = new Set(patch.tagsEntfernen);
      neueTagIds = alteTagIds.filter(id => !entferneSet.has(id));
    }
    sheet.getRange(rowIdx, tagIdsCol).setValue(JSON.stringify(neueTagIds));
  }
}
```

**Datenschutz-Hinweis:** Pro-Zellen-`setValue()` ist langsam bei 1000 Rows. Plan-Phase Step 8.4 prüft Performance, bei Bedarf auf `setValues`-Batch umstellen (1 setValues pro Row mit allen Patch-Spalten gesammelt).

- [ ] **Step 3.4: Apps-Script — `apiBulkLoescheFragen`**

Analog `apiBulkUpdateFragen_` aber mit Soft-Delete (Papierkorb-Markierung gemäss Cluster A). Audit-Log `'batchLoescheFragen'`.

- [ ] **Step 3.5: Test — wire-contract Action-Names**

Lint-Gate `lint:wire-contract` muss neue Action-Pairs erkennen. Im Frontend `'apiBulkUpdateFragen'` + Backend `case 'apiBulkUpdateFragen':` → automatisch ge-matched. Verifizieren:
```bash
cd ExamLab && npm run lint:wire-contract
```
Expected: N+2 / 0 (neue Pairs grün).

- [ ] **Step 3.6: Commit Sub-Task 3**

```bash
git add ExamLab/src/services/fragenBulkApi.ts ExamLab/src/services/fragenBulkApi.test.ts ExamLab/apps-script-code.js
git commit -m "Cluster D Phase 1b: bulkUpdateFragen + bulkLoescheFragen Service + Backend"
```

**Hand-off:** Apps-Script neu deployen (User-Aktion, neue Version).

---

## Sub-Task 4 — Phase 2: Checkbox + Floating-Bar

**Files:**
- Modify: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx` (Checkbox)
- Modify: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx` (Alle-anzeigen-Button)
- Modify: `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx` (FragenSelektionBar mounten)
- Create: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenSelektionBar.tsx`
- Test: `FragenSelektionBar.test.tsx`

### Steps

- [ ] **Step 4.1: KompaktZeile Checkbox-Integration + Prop-Chain (4 Files!)**

**Prop-Chain (Reviewer-Audit 15.05.2026):** `sichtbareIds` muss durch **4 Files** durchgereicht werden:
1. `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx` — `gefilterteIds` ist hier bereits berechnet
2. `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx` — Prop `sichtbareIds` empfangen + weitergeben
3. `ExamLab/src/components/lp/fragensammlung/fragenbrowser/VirtualisierteFragenListe.tsx` — Prop weitergeben (kritisch, sonst hat KompaktZeile keine sichtbareIds-Quelle!)
4. `ExamLab/src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx` — Prop empfangen + im toggle nutzen

KompaktZeile.tsx (120 Zeilen) — links vor Frage-Info ein 16-px Checkbox:
```tsx
interface Props {
  frage: Frage
  sichtbareIds: string[]  // NEU: für Shift-Click Range-Select
  // ... bestehende Props
}

const selektiert = useFragenSelectionStore(s => s.selektiert.has(frage.id))
const toggle = useFragenSelectionStore(s => s.toggle)

// In JSX (vor Frage-Info):
<input
  type="checkbox"
  checked={selektiert}
  onChange={(e) => toggle(frage.id, { shift: e.nativeEvent.shiftKey, sichtbareIds })}
  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
  aria-label={`Frage ${frage.id} auswählen`}
/>
```

Vor dem Cut: `grep -n "KompaktZeile" ExamLab/src/components/lp/fragensammlung/fragenbrowser/VirtualisierteFragenListe.tsx` zur Bestätigung der Prop-Übergabe-Stelle.

- [ ] **Step 4.2: FragenSelektionBar — TDD**

Test `FragenSelektionBar.test.tsx`:
```ts
it('zeigt count + sichtbar-diff', () => {
  // mock useFragenSelectionStore mit 47 IDs, 3 davon in sichtbareIds
  render(<FragenSelektionBar sichtbareIds={['id1','id2','id3']} onOeffneEditor={vi.fn()} onOeffneLoeschConfirm={vi.fn()} />)
  expect(screen.getByText('47')).toBeInTheDocument()
  expect(screen.getByText(/davon 3 im Filter sichtbar/)).toBeInTheDocument()
})

it('Auswahl aufheben leert Store', () => {
  // ...
})
```

- [ ] **Step 4.3: FragenSelektionBar — Implementation**

**Anmerkung Implementation (15.05.2026):** Inline-Tailwind-Buttons mit Pill-Shape statt
`<Button variant="...">`-Komponente verwendet, weil deren `rounded-lg`+`min-h-[36px]`
den Bar-Look bricht. JSDoc in `FragenSelektionBar.tsx` dokumentiert das. Falls Phase
3+ ähnliche Pill-Bar-Patterns auftauchen, ggf. `<PillButton>` in `@shared/` extrahieren.

`FragenSelektionBar.tsx`:
```tsx
import { useFragenSelectionStore, useSelektierteIds } from '@/store/fragenSelectionStore'
import { Pencil, Trash2, X } from 'lucide-react'
// import { Button } from '@shared/Button'  // SIEHE Anmerkung oben — inline statt Shared-Button

interface Props {
  sichtbareIds: string[]
  onOeffneEditor: () => void
  onOeffneLoeschConfirm: () => void
}

export function FragenSelektionBar({ sichtbareIds, onOeffneEditor, onOeffneLoeschConfirm }: Props) {
  const selektierteIds = useSelektierteIds()
  const leereSelektion = useFragenSelectionStore(s => s.leereSelektion)
  const beschraenkeAufFilter = useFragenSelectionStore(s => s.beschraenkeAufFilter)

  if (selektierteIds.length === 0) return null

  const sichtbareSet = new Set(sichtbareIds)
  const sichtbarCount = selektierteIds.filter(id => sichtbareSet.has(id)).length

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 dark:bg-slate-900 text-white shadow-lg rounded-full px-5 py-3 flex items-center gap-3">
      <span>
        <strong>{selektierteIds.length}</strong> Fragen ausgewählt
        {sichtbarCount < selektierteIds.length && (
          <span className="text-xs text-slate-300 ml-2">
            (davon {sichtbarCount} im Filter sichtbar)
          </span>
        )}
      </span>
      <Button onClick={onOeffneEditor} variant="primary"><Pencil className="w-4 h-4 mr-1" />Bearbeiten</Button>
      <Button onClick={onOeffneLoeschConfirm} variant="danger"><Trash2 className="w-4 h-4 mr-1" />Löschen</Button>
      <Button onClick={() => beschraenkeAufFilter(sichtbareIds)} variant="ghost">Auf Filter beschränken</Button>
      <Button onClick={leereSelektion} variant="ghost" aria-label="Auswahl aufheben"><X className="w-4 h-4" /></Button>
    </div>
  )
}
```

Run tests: PASS.

- [ ] **Step 4.4: FragenBrowserHeader — Alle-anzeigen-Button**

`FragenBrowserHeader.tsx` ergänzen (vermutlich nahe Filter-Header-Sektion):
```tsx
<Button onClick={() => alleSichtbarenAuswaehlen(gefilterteIds)} variant="ghost">
  Alle anzeigen auswählen ({gefilterteIds.length})
</Button>
```

`gefilterteIds`-Prop aus `FragenBrowser.tsx` durchschleifen.

- [ ] **Step 4.5: FragenBrowser — Bar mounten + Editor-Trigger-State**

`FragenBrowser.tsx` (254 Zeilen):
```tsx
const [batchEditorOffen, setBatchEditorOffen] = useState(false)
const [loeschConfirmOffen, setLoeschConfirmOffen] = useState(false)
// In JSX:
<FragenSelektionBar
  sichtbareIds={gefilterteIds}
  onOeffneEditor={() => setBatchEditorOffen(true)}
  onOeffneLoeschConfirm={() => setLoeschConfirmOffen(true)}
/>
```

(Editor + LoeschModal werden in Sub-Task 5/7 instanziiert — hier nur State-Hook + Bar-Mount.)

- [ ] **Step 4.6: Commit Sub-Task 4**

```bash
git add ExamLab/src/components/lp/fragensammlung/
git commit -m "Cluster D Phase 2: Checkbox + FragenSelektionBar + Alle-anzeigen"
```

---

## Sub-Task 5 — Phase 3a: Editor `batchMode`-Prop + Banner + Highlighting

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx` (batchMode-Prop, Banner-Mount, Disable nicht-batch-barer Felder)
- Modify: `packages/shared/src/editor/MetadataSection.tsx` (violet-Highlighting Wrapper für 7 Felder)
- Create: `packages/shared/src/editor/BatchEditorBanner.tsx`
- Test: ergänzen

### Steps

- [ ] **Step 5.1: BatchEditorBanner — TDD**

`packages/shared/src/editor/BatchEditorBanner.test.tsx`:
```ts
it('rendert count + sichtbar-Diff', () => {
  render(<BatchEditorBanner count={47} sichtbareCount={12} />)
  expect(screen.getByText(/47 Fragen/)).toBeInTheDocument()
  expect(screen.getByText(/nur 12 im aktuellen Filter sichtbar/)).toBeInTheDocument()
})
```

- [ ] **Step 5.2: BatchEditorBanner — Implementation**

`packages/shared/src/editor/BatchEditorBanner.tsx`:
```tsx
interface Props { count: number; sichtbareCount: number }
export function BatchEditorBanner({ count, sichtbareCount }: Props) {
  return (
    <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-lg p-3 mb-4">
      <strong>Batch-Bearbeitung von {count} Fragen</strong>
      {sichtbareCount < count && (
        <span className="text-xs text-violet-700 dark:text-violet-300 ml-2">
          (nur {sichtbareCount} im aktuellen Filter sichtbar)
        </span>
      )}
      <p className="text-xs mt-1">
        Geänderte Felder werden bei allen {count} Fragen angewendet.
        Felder ohne <span className="text-violet-600">violetten Rand</span> sind in Batch nicht änderbar.
      </p>
    </div>
  )
}
```

- [ ] **Step 5.3: SharedFragenEditor — `batchMode`-Prop + `onBatchSave`-Vertrag mit Dirty-Field-Diff**

`packages/shared/src/editor/SharedFragenEditor.tsx` Props erweitern:
```ts
batchMode?: { count: number; sichtbareCount: number }
onBatchSave?: (patch: FragenBulkPatch, tagsModus: 'hinzufuegen'|'ersetzen'|'entfernen') => void
```

In JSX (oben im Form):
```tsx
{batchMode && <BatchEditorBanner count={batchMode.count} sichtbareCount={batchMode.sichtbareCount} />}
```

**Submit-Logic — Dirty-Field-Detection (kritisch!):**

Im Batch-Modus darf NICHT die ganze Frage gesendet werden (würde alle Fragen identisch machen). Stattdessen baut der Submit einen Patch nur aus **dirty** (vom User geänderten) Feldern:

```ts
function handleSubmit() {
  if (batchMode) {
    // Form-State vs Initial-State diffen
    const patch: FragenBulkPatch = {}
    if (fachbereich !== initialFachbereich) patch.fachbereich = fachbereich
    if (bloom !== initialBloom) patch.bloom = bloom
    if (status !== initialStatus) patch.status = status  // Z. 4519 Hybrid: nur senden wenn user geändert
    if (!arraysEqual(gefaesse, initialGefaesse)) patch.gefaesse = gefaesse
    if (!arraysEqual(semester, initialSemester)) patch.semester = semester
    if (!arraysEqual(lernzielIds, initialLernzielIds)) patch.lernzielIds = lernzielIds

    // Tag-Modi: nur senden wenn tagIds nicht leer (sonst No-Op)
    if (tagIds.length > 0) {
      if (tagsModus === 'hinzufuegen') patch.tagsHinzufuegen = tagIds
      else if (tagsModus === 'ersetzen') patch.tagsErsetzen = tagIds
      else if (tagsModus === 'entfernen') patch.tagsEntfernen = tagIds
    }

    onBatchSave?.(patch, tagsModus)
  } else {
    onSpeichern?.(frage)  // Bestehender Single-Edit-Pfad unverändert
  }
}
```

`initialFachbereich`/`initialBloom`/etc. werden im Batch-Modus auf `undefined` (oder Sentinel) initialisiert — User sieht leere Felder, jeder Feldwechsel macht das Feld „dirty". Plan-Phase darf Form-Initial-State-Strategy nach Verfügbarkeit von `react-hook-form` o.ä. anpassen.

**Diff-Logic-Auslagerung:** Diff-Berechnung in eigenes Pure-Modul `packages/shared/src/editor/batchDiff.ts` extrahieren → testbar isoliert:

```ts
// packages/shared/src/editor/batchDiff.ts
export function berechnePatch(
  formState: FormState,
  initialState: FormState,
  tagsModus: 'hinzufuegen'|'ersetzen'|'entfernen',
): FragenBulkPatch { ... }
```

Vitest-Coverage in `batchDiff.test.ts` mit allen Felder-Permutationen (kein Cluster-D-Field gesetzt → leerer Patch, nur tagIds gesetzt → richtiges Tag-Feld je Modus, etc.).

- [ ] **Step 5.4: MetadataSection — violet-Highlighting Wrapper**

`packages/shared/src/editor/MetadataSection.tsx` — 7 batch-fähige Felder (fachbereich, bloom, status, gefaesse, semester, tagIds via TagPicker-Slot, lernzielIds) bekommen Wrapper:
```tsx
<div className={batchMode ? 'ring-1 ring-violet-300 dark:ring-violet-700 rounded-lg p-2 bg-violet-50/30 dark:bg-violet-900/10' : ''}>
  {/* bestehender Feld-Code */}
</div>
```

Nicht-batch-bare Felder (Fragetext, Lösung, Optionen, Lücken, Fragetyp) — in SharedFragenEditor mit `disabled={!!batchMode}` + Hint-Text:
```tsx
{batchMode && <p className="text-xs text-slate-500">Nicht im Batch bearbeitbar</p>}
```

- [ ] **Step 5.5: Test — Editor im batchMode rendert Banner**

`packages/shared/src/editor/SharedFragenEditor.test.tsx` ergänzen:
```ts
it('rendert BatchEditorBanner wenn batchMode gesetzt', () => {
  render(<SharedFragenEditor batchMode={{count: 47, sichtbareCount: 12}} ... />)
  expect(screen.getByText(/Batch-Bearbeitung von 47/)).toBeInTheDocument()
})

it('Fragetext disabled im batchMode', () => {
  render(<SharedFragenEditor batchMode={{count: 47, sichtbareCount: 12}} ... />)
  expect(screen.getByLabelText('Fragetext')).toBeDisabled()
})
```

Run: PASS.

- [ ] **Step 5.6: Commit Sub-Task 5**

```bash
git add packages/shared/src/editor/
git commit -m "Cluster D Phase 3a: Editor batchMode + Banner + violet-Highlighting"
```

---

## Sub-Task 6 — Phase 3b: `BatchTagPicker` (3-Modi-Wrapper)

**Files:**
- Create: `packages/shared/src/editor/BatchTagPicker.tsx`
- Test: `packages/shared/src/editor/BatchTagPicker.test.tsx`

### Steps

- [ ] **Step 6.1: BatchTagPicker — TDD**

Test:
```ts
it('Default-Modus ist hinzufuegen', () => {
  render(<BatchTagPicker tagIds={[]} setTagIds={vi.fn()} modus="hinzufuegen" setModus={vi.fn()} tagPickerSlot={...} />)
  expect(screen.getByRole('radio', {name: /Hinzufügen/})).toBeChecked()
})

it('Modus-Wechsel zu Ersetzen ruft setModus', () => {
  const setModus = vi.fn()
  render(<BatchTagPicker modus="hinzufuegen" setModus={setModus} ... />)
  fireEvent.click(screen.getByRole('radio', {name: /Ersetzen/}))
  expect(setModus).toHaveBeenCalledWith('ersetzen')
})
```

- [ ] **Step 6.2: BatchTagPicker — Implementation**

`packages/shared/src/editor/BatchTagPicker.tsx`:
```tsx
export type TagsModus = 'hinzufuegen' | 'ersetzen' | 'entfernen'

interface Props {
  tagIds: string[]
  setTagIds: (ids: string[]) => void
  modus: TagsModus
  setModus: (m: TagsModus) => void
  tagPickerSlot: (props: { tagIds: string[]; onChange: (ids: string[]) => void }) => React.ReactNode
}

export function BatchTagPicker({ tagIds, setTagIds, modus, setModus, tagPickerSlot }: Props) {
  return (
    <div className="ring-1 ring-violet-300 dark:ring-violet-700 rounded-lg p-2 bg-violet-50/30 dark:bg-violet-900/10">
      <label className="block mb-2 font-medium">Tags</label>
      <fieldset className="flex flex-col gap-1 mb-3">
        <label><input type="radio" checked={modus==='hinzufuegen'} onChange={() => setModus('hinzufuegen')} /> Hinzufügen (bestehende bleiben)</label>
        <label><input type="radio" checked={modus==='ersetzen'} onChange={() => setModus('ersetzen')} /> Ersetzen (alle bestehenden Tags verlieren)</label>
        <label><input type="radio" checked={modus==='entfernen'} onChange={() => setModus('entfernen')} /> Entfernen (gewählte Tags raus, andere bleiben)</label>
      </fieldset>
      {tagPickerSlot({ tagIds, onChange: setTagIds })}
    </div>
  )
}
```

- [ ] **Step 6.3: SharedFragenEditor — BatchTagPicker als Wrapper im Editor selbst**

**Klärung (Reviewer 15.05.2026):** BatchTagPicker ist **Wrapper im SharedFragenEditor**, nicht Ersatz vom Caller. Architektur:

- Im **Single-Edit-Modus**: TagPicker-Slot `tagPickerSlot?.({tagIds, onChange})` wird direkt gerendert (Z. 1126 unverändert)
- Im **Batch-Modus**: TagPicker-Slot wird in `BatchTagPicker` gewrapped, der das Radio + Slot orchestriert

```tsx
// In SharedFragenEditor.tsx — Stelle wo heute tagPickerSlot?.({tagIds, onChange: setTagIds}) gerendert wird (Z. 1126):
{batchMode ? (
  <BatchTagPicker
    tagIds={tagIds}
    setTagIds={setTagIds}
    modus={tagsModus}
    setModus={setTagsModus}
    tagPickerSlot={tagPickerSlot!}
  />
) : (
  tagPickerSlot?.({tagIds, onChange: setTagIds})
)}
```

State im SharedFragenEditor erweitert: `const [tagsModus, setTagsModus] = useState<'hinzufuegen'|'ersetzen'|'entfernen'>('hinzufuegen')`.

Vorteil: Caller (FragenBrowser) muss sich nicht um TagPicker-Spezifika kümmern — er gibt nur `batchMode` rein.

(Diff-Logik in Submit ist bereits in Step 5.3 abgehandelt — hier nur Mount-Stelle klären.)

- [ ] **Step 6.4: Commit Sub-Task 6**

```bash
git add packages/shared/src/editor/BatchTagPicker.tsx packages/shared/src/editor/BatchTagPicker.test.tsx packages/shared/src/editor/SharedFragenEditor.tsx
git commit -m "Cluster D Phase 3b: BatchTagPicker mit 3-Modi-Radio"
```

---

## Sub-Task 7 — Phase 4: Confirm-Modals

**Files:**
- Create: `ExamLab/src/components/lp/fragensammlung/BatchConfirmModal.tsx`
- Create: `ExamLab/src/components/lp/fragensammlung/BatchLoeschConfirmModal.tsx`
- Tests for both
- Modify: `FragenBrowser.tsx` (Modal-Mount + bulkUpdateFragen-Aufruf)

### Steps

- [ ] **Step 7.1: BatchConfirmModal — TDD**

Test:
```ts
it('zeigt grün-Sektion bei Modus hinzufuegen', () => {
  render(<BatchConfirmModal patch={{tagsHinzufuegen:['t1','t2']}} tagsModus="hinzufuegen" anzahl={47} sichtbarCount={12} onBestaetigen={...} onAbbrechen={...} />)
  expect(screen.getByText(/Tags werden HINZUGEFÜGT/)).toBeInTheDocument()
})

it('zeigt rote Warnung bei Modus ersetzen', () => { /* ... */ })
it('zeigt orange Sektion bei Modus entfernen', () => { /* ... */ })
it('zeigt yellow Warnung bei sichtbarCount < anzahl', () => { /* ... */ })
```

- [ ] **Step 7.2: BatchConfirmModal — Implementation (siehe Spec §5.4 für vollen Code)**

- [ ] **Step 7.3: BatchLoeschConfirmModal — Implementation**

Analog `BatchConfirmModal` aber simpler — nur count + sichtbar-Warnung + Löschen-Button (variant=danger).

- [ ] **Step 7.4: FragenBrowser — Editor + Modals mounten + bulkUpdateFragen-Aufruf**

`FragenBrowser.tsx`:
```tsx
{batchEditorOffen && (
  <SharedFragenEditor
    batchMode={{count: selektierteIds.length, sichtbareCount: sichtbareSelektierteCount}}
    onBatchSave={(patch) => { setPendingPatch(patch); setBatchConfirmOffen(true); setBatchEditorOffen(false); }}
    onCancel={() => setBatchEditorOffen(false)}
  />
)}
{batchConfirmOffen && pendingPatch && (
  <BatchConfirmModal
    patch={pendingPatch}
    tagsModus={tagsModusAusPatch(pendingPatch)}
    anzahl={selektierteIds.length}
    sichtbarCount={sichtbareSelektierteCount}
    onBestaetigen={async () => {
      const r = await bulkUpdateFragen(selektierteIds, pendingPatch, user.email)
      toast(`${r.erfolgreich} erfolgreich${r.fehlgeschlagen.length ? `, ${r.fehlgeschlagen.length} fehlgeschlagen` : ''}`)
      leereSelektion()
      setBatchConfirmOffen(false)
      // Re-fetch Fragen-Liste: fragensammlungStore hat ladeAlleDetails(email) (siehe ExamLab/src/store/fragensammlungStore.ts:126+)
      await useFragensammlungStore.getState().ladeAlleDetails(user.email)
    }}
    onAbbrechen={() => setBatchConfirmOffen(false)}
  />
)}
{loeschConfirmOffen && (
  <BatchLoeschConfirmModal
    anzahl={selektierteIds.length}
    sichtbarCount={sichtbareSelektierteCount}
    onLoeschen={async () => {
      // optimisticDelete-Helper aus ExamLab/src/utils/optimisticDelete.ts wiederverwenden:
      const r = await bulkLoescheFragen(selektierteIds, user.email)
      toast(`${r.erfolgreich} in Papierkorb`)
      leereSelektion()
      setLoeschConfirmOffen(false)
      await useFragensammlungStore.getState().ladeAlleDetails(user.email)  // Re-fetch
    }}
    onAbbrechen={() => setLoeschConfirmOffen(false)}
  />
)}
```

- [ ] **Step 7.5: Commit Sub-Task 7**

```bash
git add ExamLab/src/components/lp/fragensammlung/BatchConfirmModal.tsx \
        ExamLab/src/components/lp/fragensammlung/BatchConfirmModal.test.tsx \
        ExamLab/src/components/lp/fragensammlung/BatchLoeschConfirmModal.tsx \
        ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx
git commit -m "Cluster D Phase 4: BatchConfirmModal + BatchLoeschConfirmModal + Wiring"
```

---

## Sub-Task 8 — Phase 5: Verification + E2E + Cleanup

### Steps

- [ ] **Step 8.0: Pre-Run Baseline-Lint-Drift-Check**

Bevor finaler Verifikations-Run, Baseline der 4 Lint-Gates vor Cluster D festhalten — verhindert dass Pre-existing Drift dem Cluster zugerechnet wird:
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main -- .  # nur als Reference, NICHT committen!
cd ExamLab && npm run lint:wire-contract 2>&1 | tail -2 > /tmp/wc-baseline.txt
git checkout HEAD -- .
```
Dann Step 8.1 mit Erwartung Baseline+2 / 0 (nur Cluster-D Pairs neu) statt absolut.

- [ ] **Step 8.1: Lokale Verifikation @superpowers:verification-before-completion**

```bash
cd ExamLab
npx vitest run                                # alle Tests grün
npx tsc --noEmit                              # type-check clean
npm run build                                 # vite build grün
npm run lint:as-any                           # 0/0
npm run lint:no-alert                         # 0
npm run lint:musterloesung                    # 0 drift
npm run lint:wire-contract                    # N+2/0 (neue Bulk-Pairs)
```

Erwartung: alle grün. Bei Fehler → Sub-Task neu durchgehen.

- [ ] **Step 8.2: Push + User-Deploy-Aktion**

```bash
git push origin feature/cluster-d-batch-edit-spec-update
```

User-Aktion: Apps-Script-IDE öffnen, neue `apps-script-code.js`-Version reinpasten, deployen. Phase-0 Backfill-Button (AdminTab) klicken — `apiBackfillStatusDefault` triggert.

- [ ] **Step 8.3: Browser-E2E auf Staging-Deploy (Spec §10.3, 14 Cases)**

URL: `https://durandbourjate.github.io/GYM-WR-DUY/staging/`. Cache-Reset + `?nocache=<ts>`.

**Echter LP-Login** (Memory `feedback_echte_logins.md`).

14 Cases live durchgehen:
1. Phase-0 Status-Single-Edit ✅
2. Phase-0 Backfill ✅
3. Multi-Select Basic ✅
4. Shift-Click Range ✅
5. Cross-Filter-Selection ✅
6. Beschränken auf Filter ✅
7. Batch-Edit Status ✅
8. Batch-Edit Fachbereich ✅
9. Batch-Tags-Hinzufügen ✅
10. Batch-Tags-Ersetzen (rote Warnung!) ✅
11. Batch-Tags-Entfernen ✅
12. Bulk-Löschen ✅
13. Partial-Failure-Simulation (Network kill) ⚠ deterministisch falls Backend-Test-Hook eingebaut
14. Audit-Log-Verifikation (Sheet `AuditLog` öffnen, 3+ Einträge prüfen) ✅

- [ ] **Step 8.4: Performance-Test 1000+ Fragen**

Test-Setup: 1000 Fragen in Test-Klasse, alle anzeigen, „Alle anzeigen auswählen" klicken → Floating-Bar muss innerhalb 100 ms erscheinen. Falls langsam: Performance-Profiling, ggf. Virtualisierung-Ergänzung in Plan-Folge-Task.

- [ ] **Step 8.5: HANDOFF.md-Update**

`ExamLab/HANDOFF.md` Sektion „📍 STAND" ergänzen:
- Cluster D Phase 0+1+2+3+4+5 LIVE
- vitest-Count-Delta
- Browser-E2E 14/14 ✅

`MEMORY.md` ergänzen — neue Lehren aus dem Cluster (falls welche entstehen), z.B. wenn ein Hotfix wegen Apps-Script-Limit nötig wird.

- [ ] **Step 8.6: Final Push**

```bash
git push origin feature/cluster-d-batch-edit-spec-update
```

- [ ] **Step 8.7: PR / Merge nach preview → main**

PR erstellen (oder direkt FF-Merge nach Review). HANDOFF-Konvention: preview → main, beide pushen.

---

## Spawn-Tasks aus Cluster D (für Memory)

- **Cluster H Phase 3 Dead-Code-Cleanup:** `ExamLab/src/types/tags.ts` löschen + 3 Imports auf `@shared/types/tag` umstellen (siehe Audit 15.05.2026).
- **Audit-Log-Viewer-UI:** „wer hat was geändert" als Surface — Out-of-Scope Cluster D, eventueller eigener Cluster.
- **Undo/Revert** auf Basis `affectedIds` aus Audit-Log — Out-of-Scope, eventueller eigener Cluster.
- **Pagination bei >1000 Fragen im Bulk-Patch** — wenn Apps-Script 6-Min-Limit erreicht, Frontend-Chunking ergänzen.
- **Backend-Test-Hook für Partial-Failure-Simulation** — bei Bedarf für deterministischen E2E.

---

## Memory-Patterns aktiv anwenden

| Pattern | Wo |
|---------|----|
| `feedback_service_wrapper_email_pflicht.md` | Sub-Task 3: `bulkUpdateFragen(ids, patch, email)` — email Pflicht-Param |
| `feedback_zustand_selector_useshallow.md` | Sub-Task 2: `useSelektierteIds` mit `useShallow` |
| `feedback_subagent_task_buendelung.md` | 8 Sub-Tasks (statt ~30 atomare Tasks) gebündelt nach Phase + zusammengehörigen Dateien |
| `feedback_push_konflikt_rate.md` | 1 Push pro Sub-Task am Ende (8 Pushes total, nicht zu schnell hintereinander) |
| `feedback_grep_anwesenheit_nicht_abwesenheit.md` | Sub-Task 1 + 4 + 5: Editor-Felder + Components vor Cut konkret greppen (nicht annehmen) |
| `feedback_apps_script_live_hotfix_diagnose.md` | Phase 0/1 Deploy: bei „0 Records"-Fehler temp `_diagXxx` statt Blind-Hotfix |
| Memory S130 unwrap-Helper | Sub-Task 3: `fragenBulkApi.ts` baut auf `tagsApi.ts:22-26` `unwrap`-Pattern |
| Memory S156 Shared-Editor-Pfad | Sub-Tasks 1 + 5 + 6: shared Editor lebt in `packages/shared/src/editor/`, nicht in ExamLab |

---

## Architecture-Entscheidungen aus Spec (Quick-Ref)

| Spec § | Entscheidung |
|--------|--------------|
| §3 #1 | Checkbox pro Zeile + Floating-Action-Bar |
| §3 #2 | Cross-Filter-Selektion (D2-Power-Safe) |
| §3 #3 | Editor im Batch-Modus (kein eigener UI) |
| §3 #5 | Tag-Toggle **3 Modi** (Hinzufügen/Ersetzen/Entfernen) |
| §3 #9 | Backend Bulk-Endpoint generisch |
| §3 #12 | Audit-Log via bestehender `auditLog_()` |
| §3 #13 | Phase 0 für `status`-Feld |

---

**Plan complete. Bereit zur Ausführung via @superpowers:subagent-driven-development (8 Sub-Tasks).**
