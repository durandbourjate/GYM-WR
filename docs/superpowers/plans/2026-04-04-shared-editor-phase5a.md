# Shared Editor Phase 5a: SharedFragenEditor extrahieren — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the generic core of FragenEditor.tsx (973 lines) into SharedFragenEditor in the shared package, with host-specific parts as slot props.

**Architecture:** Copy FragenEditor.tsx to shared, remove Pruefung-specific parts (replace with slots), create thin Pruefung wrapper that fills slots. Re-export for backwards compatibility.

**Tech Stack:** React 19, TypeScript, `@gymhofwil/shared` package

**Spec:** `docs/superpowers/specs/2026-04-04-shared-editor-phase5a-design.md`

---

## Strategy

This is a large refactoring. The safest approach:

1. **Copy** FragenEditor.tsx → SharedFragenEditor.tsx
2. **Strip** all Pruefung-specific imports and code, replace with slots
3. **Redirect** imports to shared equivalents
4. **Create** PruefungFragenEditor wrapper that fills slots
5. **Replace** FragenEditor.tsx with re-export
6. **Verify** tsc + tests + build

---

### Task 1: Create SharedFragenEditor.tsx skeleton

**Files:**
- Create: `packages/shared/src/editor/SharedFragenEditor.tsx`

- [ ] **Step 1: Copy FragenEditor.tsx to shared**

Copy `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` to `packages/shared/src/editor/SharedFragenEditor.tsx`

- [ ] **Step 2: Define SharedFragenEditorProps interface**

Replace the `Props` interface with `SharedFragenEditorProps` from the spec. Add all slot props (anhangEditorSlot, berechtigungenSlot, poolInfoSlot, poolSyncSlot, PDFEditorComponent, rueckSyncSlot).

- [ ] **Step 3: Strip Pruefung-specific imports**

Remove imports from Pruefung paths (`../../../store/`, `../../../services/`, `../../../utils/`, `../../../types/`, `../../shared/`). Replace with shared equivalents:

| Pruefung Import | Shared Replacement |
|---|---|
| `useAuthStore`, `ladeUndCacheLPs` | REMOVE (EditorProvider handles) |
| `apiService`, `uploadApi`, `poolApi`, `apiClient` | `useEditorServices()` |
| `useSchulConfig` | REMOVE (EditorProvider handles) |
| `fachUtils: defaultFachbereich, istWRFachschaft` | `from '../fachUtils'` (shared) |
| `fragenValidierung: validiereFrage` | `from '../fragenValidierung'` (shared) |
| `fragenFactory: erstelleFrageObjekt` | `from '../fragenFactory'` (shared) |
| `zeitbedarf: berechneZeitbedarf` | `from '../zeitbedarf'` (shared) |
| `editorUtils: generiereFrageId, FrageTyp` | `from '../editorUtils'` (shared) |
| `useFocusTrap` | `from '../hooks/useFocusTrap'` (shared) |
| `usePanelResize` | `from '../hooks/usePanelResize'` (shared) |
| `useKIAssistent` | `from '../useKIAssistent'` (shared) |
| All type imports (Frage, MCFrage, etc.) | `from '../../types/fragen'` (shared) |
| `Berechtigung` | `from '../../types/auth'` (shared) |
| `Lernziel` | `from '../../types/fragen'` (shared) |
| Section imports (MetadataSection, etc.) | `from './sections/...'` (shared) |
| `Abschnitt` | `from './components/EditorBausteine'` (shared) |
| `FrageTypAuswahl` | `from './components/FrageTypAuswahl'` (shared) |
| `BewertungsrasterEditor` | `from './typen/BewertungsrasterEditor'` (shared, verify path) |
| `TKontoBewertungsoptionen`, `BilanzERBewertungsoptionen` | `from './typen/...'` (shared) |
| `InlineAktionButton, ErgebnisAnzeige` | `from './ki/KIBausteine'` (shared) |
| `istGueltigesGefaess` | REMOVE (skip validation in shared) |
| `AnhangEditor` | REMOVE (slot) |
| `PDFEditor` | REMOVE (slot) |
| `BerechtigungenEditor` | REMOVE (slot) |
| `PoolUpdateVergleich` | REMOVE (slot) |
| `RueckSyncDialog` | REMOVE (slot) |

- [ ] **Step 4: Remove EditorProvider setup code**

Remove the `editorConfig`/`editorServices`/`semesterListe` useMemo blocks and the `<EditorProvider>` wrapper from the JSX. The host wrapper provides EditorProvider.

Remove: `useAuthStore`, `useSchulConfig`, `lpListe` state + useEffect.

Replace `user?.email` / `user?.fachschaft` with `useEditorConfig().benutzer.email` / `.fachschaft` where still needed.

- [ ] **Step 5: Migrate handleSpeichern upload code**

Replace lines 512-527 (apiService.uploadAnhang):
```typescript
// BEFORE:
if (neueAnhaenge.length > 0 && user && apiService.istKonfiguriert()) {
  const ergebnis = await apiService.uploadAnhang(user.email, id, datei)

// AFTER:
const services = useEditorServices()
if (neueAnhaenge.length > 0 && services.istUploadVerfuegbar()) {
  const ergebnis = await services.uploadAnhang?.(id, datei) ?? null
```

Remove `istGueltigesGefaess` filter from gefaesse in handleSpeichern.

- [ ] **Step 6: Replace Pruefung-specific JSX with slots**

Replace Pool-Info block (pruefungstauglich toggle + PoolUpdateVergleich) with:
```tsx
{poolInfoSlot?.({ frage, typ, onSpeichern })}
```

Replace Pool-Sync header buttons with:
```tsx
{poolSyncSlot?.({ frage, typ, onRueckSync: () => setRueckSyncOffen(true) })}
```

Replace AnhangEditor with:
```tsx
{anhangEditorSlot?.({ anhaenge, neueAnhaenge, onAnhangHinzu: ..., onAnhangEntfernen: ..., onNeuenAnhangEntfernen: ..., onUrlAnhangHinzu: ... })}
```

Pass `berechtigungenSlot` through to MetadataSection's `berechtigungenEditor` prop.

Replace RueckSyncDialog with:
```tsx
{rueckSyncSlot?.({ offen: rueckSyncOffen, onSchliessen: () => setRueckSyncOffen(false), onErfolg: ... })}
```

Pass `PDFEditorComponent` through to TypEditorDispatcher.

- [ ] **Step 7: Export from shared barrel**

Add to `packages/shared/src/index.ts`:
```typescript
export { default as SharedFragenEditor } from './editor/SharedFragenEditor'
export type { SharedFragenEditorProps } from './editor/SharedFragenEditor'
```

- [ ] **Step 8: Run tsc on shared**

```bash
cd packages/shared && npx tsc --noEmit
```

Fix any type errors. This is the most likely place for issues.

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/editor/SharedFragenEditor.tsx packages/shared/src/index.ts
git commit -m "feat: SharedFragenEditor with slot props (Phase 5a)"
```

---

### Task 2: Create PruefungFragenEditor wrapper

**Files:**
- Create: `ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx`
- Modify: `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` (replace with re-export)

- [ ] **Step 1: Create PruefungFragenEditor.tsx**

This is the thin wrapper (~120 lines) that:
1. Sets up EditorProvider (config + services, from Phase 4 code)
2. Passes Pruefung-specific slots to SharedFragenEditor
3. Manages lpListe state (ladeUndCacheLPs)

Move the EditorProvider setup code (editorConfig, editorServices, semesterListe) from the old FragenEditor.tsx into this wrapper.

Fill slots:
- `anhangEditorSlot` → renders `<AnhangEditor>`
- `berechtigungenSlot` → renders `<BerechtigungenEditor>` with lpListe
- `poolInfoSlot` → renders pruefungstauglich toggle + PoolUpdateVergleich
- `poolSyncSlot` → renders "An Pool"/"In Pool exportieren" buttons
- `PDFEditorComponent` → `PDFEditor`
- `rueckSyncSlot` → renders `<RueckSyncDialog>`

- [ ] **Step 2: Replace FragenEditor.tsx with re-export**

```typescript
// FragenEditor.tsx — Re-Export für Backwards Compatibility
export { default } from './PruefungFragenEditor'
```

- [ ] **Step 3: Run tsc**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 4: Run tests**

```bash
cd ExamLab && npx vitest run
```

Expected: 193+ tests pass.

- [ ] **Step 5: Run build**

```bash
cd ExamLab && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx ExamLab/src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "refactor: PruefungFragenEditor wrapper + FragenEditor re-export (Phase 5a)"
```

---

### Task 3: Verification & Push

- [ ] **Step 1: Full verification**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Update HANDOFF.md**

Add Session 58 entry documenting Phase 5a.
