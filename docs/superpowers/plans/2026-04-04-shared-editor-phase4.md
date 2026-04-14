# Shared Editor Phase 4: EditorProvider verdrahten — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up `<EditorProvider>` in Pruefung's FragenEditor.tsx so shared components can access host config + services via context hooks.

**Architecture:** FragenEditor.tsx builds EditorConfig (from authStore + schulConfigStore) and EditorServices (adapters around uploadApi + poolApi), then wraps its JSX with `<EditorProvider>`. MetadataSection drops 2 redundant props that already come from context.

**Tech Stack:** React 19, TypeScript, Zustand stores, `@gymhofwil/shared` package

**Spec:** `docs/superpowers/specs/2026-04-04-shared-editor-phase4-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` | Modify | Add EditorProvider wrapper, build config + services |
| `packages/shared/src/editor/sections/MetadataSection.tsx` | Modify | Remove `lpListe` + `eigeneFachschaft` props, use config |

---

### Task 1: EditorProvider in FragenEditor.tsx verdrahten

**Files:**
- Modify: `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx`

**Context for implementer:**
- FragenEditor.tsx (923 lines) is the editor hub with ~80 useState. We do NOT touch the state — only wrap the JSX.
- `EditorProvider` is exported from `@gymhofwil/shared` (barrel: `packages/shared/src/index.ts`)
- Config types: `EditorConfig`, `EditorServices`, `EditorFeatures` from `@gymhofwil/shared`
- Existing imports: `useAuthStore` (line 2), `useSchulConfig` (line 38), `apiService` is NOT imported — upload/KI are in `uploadApi.ts`, Lernziele in `poolApi.ts`
- `istWRFachschaft` is in `@gymhofwil/shared` (exported from `fachUtils.ts`)

- [ ] **Step 1: Add imports**

In `FragenEditor.tsx`, add these imports at the top:

```typescript
import { EditorProvider, type EditorConfig, type EditorServices } from '@gymhofwil/shared'
import { uploadAnhang, kiAssistent } from '../../../services/uploadApi.ts'
import { ladeLernziele } from '../../../services/poolApi.ts'
import { istKonfiguriert } from '../../../services/apiClient.ts'
```

Note: `istWRFachschaft` should already be imported from shared (verify — if from local `fachUtils.ts`, update import source to `@gymhofwil/shared`).

- [ ] **Step 2: Build editorConfig with useMemo**

After the existing store hooks (line 64-65: `const user = ...`, `const schulConfig = ...`) and after `lpListe` state (line 68), add:

```typescript
const editorConfig: EditorConfig = useMemo(() => ({
  benutzer: {
    email: user?.email ?? '',
    name: user?.name,
    fachschaft: user?.fachschaft,
    fachschaften: user?.fachschaften,
  },
  verfuegbareGefaesse: schulConfig?.gefaesse ?? [],
  verfuegbareSemester: schulConfig?.semester ?? [],
  zeigeFiBuTypen: istWRFachschaft(user?.fachschaft),
  lpListe: lpListe.map(lp => ({
    email: lp.email,
    name: lp.name,
    kuerzel: lp.kuerzel,
  })),
  features: {
    kiAssistent: istKonfiguriert(),
    anhangUpload: istKonfiguriert(),
    bewertungsraster: true,
    sharing: true,
    poolSync: true,
    performance: !!performance,
  },
}), [user, schulConfig, lpListe, performance])
```

Verify: `schulConfig` hat Felder `gefaesse` und `semester` — falls andere Namen, anpassen. `LPInfo` aus Pruefung hat `email`, `name`, `kuerzel` — prüfen ob Mapping 1:1 passt zu `EditorLPInfo`.

- [ ] **Step 3: Build editorServices with useMemo**

Direkt nach editorConfig:

```typescript
const editorServices: EditorServices = useMemo(() => ({
  uploadAnhang: async (frageId: string, datei: File) => {
    if (!user) return null
    return uploadAnhang(user.email, frageId, datei)
  },
  kiAssistent: async (aktion: string, daten: Record<string, unknown>) => {
    if (!user) return null
    return kiAssistent(user.email, aktion, daten)
  },
  istKIVerfuegbar: () => istKonfiguriert(),
  istUploadVerfuegbar: () => istKonfiguriert() && !!user,
  ladeLernziele: async (_gefaess: string, fachbereich: string) => {
    if (!user) return []
    return ladeLernziele(user.email, fachbereich)
  },
}), [user])
```

- [ ] **Step 4: Wrap JSX with EditorProvider**

Find the return statement (around line 650+). Wrap the outermost `<div>` with EditorProvider:

```tsx
return (
  <EditorProvider config={editorConfig} services={editorServices}>
    <div className="fixed inset-0 ...">
      {/* Entire existing JSX unchanged */}
    </div>
  </EditorProvider>
)
```

- [ ] **Step 5: Run tsc**

```bash
cd ExamLab && npx tsc -b
```

Expected: 0 errors. If type mismatches on `EditorConfig` fields (e.g. `schulConfig.gefaesse` doesn't exist), fix the field mapping.

- [ ] **Step 6: Run tests**

```bash
cd ExamLab && npx vitest run
```

Expected: 193+ tests pass. No regressions — we only added a context wrapper.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "feat: wire EditorProvider in FragenEditor.tsx (Phase 4)"
```

---

### Task 2: MetadataSection Props bereinigen

**Files:**
- Modify: `packages/shared/src/editor/sections/MetadataSection.tsx`
- Modify: `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` (Props-Übergabe)

**Context for implementer:**
- MetadataSection already calls `useEditorConfig()` at line 74
- `lpListe` prop is received as `_lpListe` (unused) — just remove from interface + call site
- `eigeneFachschaft` prop is used at line 146 in `istWRFachschaft(eigeneFachschaft)` — replace with `config.benutzer.fachschaft`
- `verfuegbareSemester` / `verfuegbareGefaesse` are NOT props — already from context. No action needed.

- [ ] **Step 1: Remove props from MetadataSectionProps interface**

In `MetadataSection.tsx`, remove these two lines from the interface (around line 45-46):

```typescript
// REMOVE:
  lpListe: EditorLPInfo[]
  eigeneFachschaft?: string
```

- [ ] **Step 2: Remove from destructuring**

In the function signature, remove `lpListe: _lpListe` and `eigeneFachschaft` from destructuring.

- [ ] **Step 3: Replace eigeneFachschaft usage**

At line 146, change:
```typescript
// BEFORE:
{istWRFachschaft(eigeneFachschaft) ? (
// AFTER:
{istWRFachschaft(config.benutzer.fachschaft) ? (
```

`config` is already available from `const config = useEditorConfig()` at line 74.

- [ ] **Step 4: Remove props from FragenEditor.tsx call site**

In `FragenEditor.tsx` around line 705, remove these props from the `<MetadataSection>` invocation:

```tsx
// REMOVE these lines:
            lpListe={lpListe} eigeneFachschaft={user?.fachschaft}
```

Also check the `<BerechtigungenEditor>` slot passed as `berechtigungenEditor` prop — it receives `lpListe` independently, which is correct and stays.

- [ ] **Step 5: Run tsc**

```bash
cd ExamLab && npx tsc -b
```

Expected: 0 errors. If something still references the removed props, fix it.

- [ ] **Step 6: Run tests**

```bash
cd ExamLab && npx vitest run
```

Expected: 193+ tests pass.

- [ ] **Step 7: Run build**

```bash
cd ExamLab && npm run build
```

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add packages/shared/src/editor/sections/MetadataSection.tsx ExamLab/src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "refactor: remove redundant MetadataSection props (now from EditorContext)"
```

---

### Task 3: Verifikation & Push

- [ ] **Step 1: Full verification**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

Expected: All green.

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Update HANDOFF.md**

Add Session 57 entry documenting Phase 4 completion. Update "Nächste Schritte" to Phase 5 (Lernplattform-Integration, PDFEditor evaluieren).
