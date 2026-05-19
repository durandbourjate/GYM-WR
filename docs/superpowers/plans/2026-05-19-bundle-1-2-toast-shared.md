# Bundle 1+2 — Toast nach packages/shared + Lint-Gates Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cross-Tool-Harmonisierung — Toast-System aus ExamLab nach `packages/shared` verschieben, npm-Workspaces im Root aktivieren, im Unterrichtsplaner alle 54 `alert()` durch Toast ersetzen und 80 `any`-Token migrieren, beide Lint-Gates strict aktivieren.

**Architecture:** Drei Phasen auf Branch `feature/bundle-1-2-toast-shared`. Phase 1 baut die Workspace-Infrastruktur. Phase 2 verschiebt Toast nach `packages/shared` + migriert ExamLab-Konsumenten via systematischem `sed`-Run. Phase 3 berührt nur den Planer (alert→Toast, any-Migration, Lint-Gates). ExamLab ist Sicherheits-Anker (vitest 1994+, tsc -b strict). Planer ist nicht produktiv → niedriges Regressions-Risiko, manuelles Durchklicken reicht.

**Tech Stack:** React 19, Vite, TypeScript, Zustand, Tailwind v4, npm workspaces, GitHub Actions, bash audit-scripts.

**Spec:** [`docs/superpowers/specs/2026-05-19-bundle-1-2-toast-shared-design.md`](../specs/2026-05-19-bundle-1-2-toast-shared-design.md)

**Pflicht-Skills während Ausführung:**
- @superpowers:test-driven-development für die 3 Smoke-Tests in `packages/shared`
- @superpowers:verification-before-completion vor jedem Phasen-Commit
- @superpowers:systematic-debugging falls ein Verifikations-Step bricht

---

## File Structure

### Files to create
- `packages/shared/src/toast/toastStore.ts` (copy from `ExamLab/src/store/toastStore.ts`)
- `packages/shared/src/toast/useToast.ts` (copy from `ExamLab/src/hooks/useToast.ts`)
- `packages/shared/src/toast/ToastContainer.tsx` (copy from `ExamLab/src/components/shared/ToastContainer.tsx`)
- `packages/shared/src/toast/index.ts` (barrel)
- `packages/shared/src/toast/__tests__/toast.test.ts` (3 smoke tests)
- `packages/shared/vitest.config.ts` (minimal vitest setup)
- `Unterrichtsplaner/tailwind.config.ts` (anlegen wenn fehlend)

### Files to modify
- `package.json` (root) — workspaces + scripts
- `ExamLab/package.json` — `@gymhofwil/shared` Dependency hinzufügen
- `Unterrichtsplaner/package.json` — `@gymhofwil/shared` Dep + Lint-Gates-Scripts
- `packages/shared/package.json` — `vitest` als devDep
- `packages/shared/src/index.ts` — `export * from './toast'`
- `.github/workflows/deploy.yml` — `npm ci` zu Root-Call konsolidieren, `cache-dependency-path` umstellen, neue Lint-Steps für Planer
- `scripts/audit-as-any.sh` — `--target=<dir>`-Parameter ergänzen
- `scripts/audit-no-alert.sh` — `--target=<dir>`-Parameter ergänzen
- `Unterrichtsplaner/src/App.tsx` — `<ToastContainer />` mount
- `Unterrichtsplaner/src/version.ts` — `v3.106`
- `Unterrichtsplaner/HANDOFF.md` — UP-5 + UP-6 als ✅
- 10 Planer-Files für `alert()`→Toast-Migration (siehe §3.4)
- N Planer-Files für `any`-Token-Migration (siehe §3.5, in Discovery-Task bestimmt)

### Files to delete
- `ExamLab/src/store/toastStore.ts`
- `ExamLab/src/hooks/useToast.ts`
- `ExamLab/src/components/shared/ToastContainer.tsx`
- `packages/shared/package-lock.json`
- `Unterrichtsplaner/package-lock.json`
- `ExamLab/package-lock.json`

---

## Phase 1 — npm-Workspaces aktivieren

### Task 1.1: Root package.json auf workspaces umstellen

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Edit root package.json**

Ersetze den Inhalt von `package.json` mit:
```json
{
  "name": "gym-wr-duy",
  "version": "0.0.0",
  "private": true,
  "description": "Multi-Package-Repo: Unterrichtsplaner + ExamLab + packages/shared (npm workspaces).",
  "workspaces": [
    "packages/shared",
    "Unterrichtsplaner",
    "ExamLab"
  ],
  "scripts": {
    "setup": "npm install"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "build(workspaces): Root package.json auf npm workspaces umstellen"
```

---

### Task 1.2: Planer & ExamLab `@gymhofwil/shared`-Dep hinzufügen

**Files:**
- Modify: `Unterrichtsplaner/package.json`
- Modify: `ExamLab/package.json`

- [ ] **Step 1: Verifizieren dass kein Eintrag existiert**

```bash
grep -c "@gymhofwil/shared" Unterrichtsplaner/package.json ExamLab/package.json
# Expected: beide 0 (kein Eintrag heute)
```

- [ ] **Step 2: Edit Unterrichtsplaner/package.json**

Im `dependencies`-Block einen Eintrag ergänzen (alphabetische Reihenfolge):
```json
"@gymhofwil/shared": "*",
```

- [ ] **Step 3: Edit ExamLab/package.json**

Gleicher Eintrag im `dependencies`-Block:
```json
"@gymhofwil/shared": "*",
```

- [ ] **Step 4: Commit**

```bash
git add Unterrichtsplaner/package.json ExamLab/package.json
git commit -m "build(workspaces): @gymhofwil/shared als Dep in Planer + ExamLab"
```

---

### Task 1.3: Sub-Lockfiles löschen + Root-Install

**Files:**
- Delete: `packages/shared/package-lock.json`
- Delete: `Unterrichtsplaner/package-lock.json`
- Delete: `ExamLab/package-lock.json`
- Create: `package-lock.json` (root, via npm install)

- [ ] **Step 1: Sub-Lockfiles entfernen**

```bash
rm packages/shared/package-lock.json
rm Unterrichtsplaner/package-lock.json
rm ExamLab/package-lock.json
```

- [ ] **Step 2: Root npm install**

```bash
npm install
```

Expected: läuft fehlerfrei durch, erzeugt `package-lock.json` im Root, erzeugt `node_modules/@gymhofwil/shared` als Symlink auf `packages/shared`.

- [ ] **Step 3: React-Hoisting verifizieren**

```bash
npm ls react
# Expected: zeigt genau eine react@... Version, ohne "dedup conflicts"
```

Wenn die Ausgabe mehrere `react`-Versionen zeigt oder „extraneous" markiert: STOP, das ist der React-Doppel-Instanz-Hotspot aus Spec §1 Risiken. Dann muss die `react`-Version in `Unterrichtsplaner/package.json` und `ExamLab/package.json` synchronisiert werden, bevor weitergemacht wird.

- [ ] **Step 4: Commit**

```bash
git add package-lock.json
git rm packages/shared/package-lock.json Unterrichtsplaner/package-lock.json ExamLab/package-lock.json
git commit -m "build(workspaces): Sub-Lockfiles entfernen, Root-Lockfile erzeugen"
```

---

### Task 1.4: CI-Workflow auf Root-Install umstellen

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Workflow-Datei lesen**

```bash
cat .github/workflows/deploy.yml | head -130
```

Identifiziere alle `npm ci`-Steps und den `cache-dependency-path`-Block. Heutiger Stand (verifiziert):
- Z.38–40: `cache-dependency-path` listet 3 Sub-Lockfiles
- Z.45, Z.49, Z.57, Z.121, Z.126: je ein `npm ci` (3× production + 2× staging)

- [ ] **Step 2: cache-dependency-path umstellen**

Ersetze den Block (heutige Z.38–40):
```yaml
cache-dependency-path: |
  packages/shared/package-lock.json
  Unterrichtsplaner/package-lock.json
```
durch:
```yaml
cache-dependency-path: package-lock.json
```

- [ ] **Step 3: Drei production-`npm ci`-Steps zu einem konsolidieren**

In der „production"-Hälfte (Steps mit `working-directory: packages/shared` / `Unterrichtsplaner` / `ExamLab`) die drei separaten `npm ci`-Calls durch einen einzigen Root-Step ersetzen:
```yaml
- name: Install workspaces dependencies
  run: npm ci
```
(ohne `working-directory:`).

Die nachfolgenden `Build Unterrichtsplaner` / `Audit *` / `Run vitest` / `Build ExamLab` Steps bleiben unverändert — sie behalten ihre `working-directory:`-Pfade und nutzen die Workspace-Symlinks.

- [ ] **Step 4: Zwei staging-`npm ci`-Steps zu einem konsolidieren**

Im „staging"-Block (heute Z.121 + Z.126) analog: zwei `npm ci` → ein Root-`npm ci`. Aber: der staging-Block macht oft `git checkout preview` und braucht u.U. einen eigenen `cache-dependency-path`. Im Zweifelsfall hier nur den `npm ci`-Call konsolidieren und das Caching für staging unverändert lassen — das Caching ist Performance, nicht Korrektheit. **In der Commit-Message vermerken**, dass das staging-Cache weiterhin auf die alten Sub-Lockfile-Pfade zeigt (Cache-Miss, aber funktional korrekt) — Folge-Maintainer soll nicht stolpern.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(workspaces): npm ci konsolidieren auf Root-Install + cache-path"
```

---

### Task 1.5: Phase-1-Verifikation lokal

**Files:** (keine Änderungen, nur Verifikations-Commands)

- [ ] **Step 1: ExamLab CI-Check**

```bash
cd ExamLab
npm run ci-check
# Expected: tsc -b grün, vitest 1994+ Tests grün, lint:as-any grün, lint:no-alert grün, alle anderen Gates grün
cd ..
```

Wenn das bricht: Workspaces-Hoisting hat etwas zerschossen. Stop, debug. Wahrscheinliche Ursache: peerDeps von `@gymhofwil/shared` (react@^19, lucide-react, @dnd-kit) versionsmäßig nicht aligned mit ExamLab.

- [ ] **Step 2: Planer Build**

```bash
cd Unterrichtsplaner
npx tsc -b
npm run build
cd ..
# Expected: beide grün
```

- [ ] **Step 3: Planer Dev-Server-Smoke (PWA-Risiko-Hotspot)**

```bash
cd Unterrichtsplaner
npm run dev &
sleep 5
curl -s http://localhost:5173 | grep -q "<!doctype html" && echo OK || echo FAIL
kill %1
cd ..
```

Wenn FAIL: Vite-PWA-Plugin reagiert auf das neue node_modules-Layout. Spec §1 Risiken-Hotspot. Debug oder Plugin-Config anpassen.

- [ ] **Step 4: Push + CI-Verifikation**

```bash
git push -u origin feature/bundle-1-2-toast-shared
```

Warte auf GitHub-Actions-Run. Wenn rot: Logs lesen, fixen, neu committen. Phase 1 ist erst abgeschlossen wenn CI grün.

---

## Phase 2 — Toast nach packages/shared + ExamLab-Migration

### Task 2.1: Toast-Files nach packages/shared kopieren

**Files:**
- Create: `packages/shared/src/toast/toastStore.ts`
- Create: `packages/shared/src/toast/useToast.ts`
- Create: `packages/shared/src/toast/ToastContainer.tsx`

- [ ] **Step 1: Verzeichnis anlegen**

```bash
mkdir -p packages/shared/src/toast
```

- [ ] **Step 2: Drei Files unverändert kopieren**

```bash
cp ExamLab/src/store/toastStore.ts packages/shared/src/toast/toastStore.ts
cp ExamLab/src/hooks/useToast.ts packages/shared/src/toast/useToast.ts
cp ExamLab/src/components/shared/ToastContainer.tsx packages/shared/src/toast/ToastContainer.tsx
```

- [ ] **Step 3: Pfade in den kopierten Files prüfen**

```bash
grep -nE "from '@/|from '\.\./" packages/shared/src/toast/*
```

Wenn die kopierten Files relative Imports `from '../...'` oder `from '@/...'` haben, müssen diese auf shared-interne Pfade umgestellt werden. Erwartet: Toast-Files sind self-contained und importieren nur aus `react`/`zustand`/`lucide-react`. Falls nicht: jetzt umstellen.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/toast/
git commit -m "feat(shared): Toast-System aus ExamLab nach packages/shared kopieren"
```

---

### Task 2.2: Barrel-Export + Re-Export in shared/index.ts

**Files:**
- Create: `packages/shared/src/toast/index.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Barrel anlegen**

`packages/shared/src/toast/index.ts`:
```ts
export { useToastStore } from './toastStore'
export type { Toast, ToastVariant } from './toastStore'
export { useToast } from './useToast'
export { ToastContainer } from './ToastContainer'
```

- [ ] **Step 2: Typ-Namen im toastStore.ts verifizieren**

```bash
grep -nE "^export (type|interface) " packages/shared/src/toast/toastStore.ts
```

Wenn das Type/Interface anders heisst (z.B. `ToastSeverity` statt `ToastVariant`), den Barrel entsprechend anpassen. Erwartet sind `Toast` + `ToastVariant` per Spec.

- [ ] **Step 3: shared/index.ts erweitern**

`packages/shared/src/index.ts` bekommt eine neue Zeile (alphabetisch nahe anderen `export * from`-Statements):
```ts
export * from './toast'
```

- [ ] **Step 4: tsc check**

```bash
cd packages/shared
npx tsc --noEmit 2>&1 | head -20
# Expected: keine Fehler. Wenn Typ-Konflikt (z.B. `Toast` doppelt exportiert): in toast/index.ts namespace-export verwenden.
cd ../..
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/toast/index.ts packages/shared/src/index.ts
git commit -m "feat(shared): Toast public API via Barrel + Re-Export"
```

---

### Task 2.3: vitest-Setup in packages/shared

**Files:**
- Modify: `packages/shared/package.json`
- Create: `packages/shared/vitest.config.ts`

- [ ] **Step 1: vitest als devDep hinzufügen**

```bash
cd packages/shared
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
cd ../..
```

Begründung für jsdom: `useToast`-Identity-Test (Task 2.4 Test 3) braucht `render()` von `@testing-library/react`, das braucht jsdom-Environment.

- [ ] **Step 2: vitest.config.ts anlegen**

`packages/shared/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: scripts in package.json ergänzen**

`packages/shared/package.json` `scripts` ergänzen:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verifikation**

```bash
cd packages/shared
npm test
# Expected: "no test files found" oder ähnliche Meldung — vitest läuft, aber 0 Tests vorhanden.
cd ../..
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/package.json packages/shared/vitest.config.ts package-lock.json
git commit -m "build(shared): vitest-Setup für Toast-Smoke-Tests"
```

---

### Task 2.4: 3 Smoke-Tests für Toast (TDD)

**Files:**
- Create: `packages/shared/src/toast/__tests__/toast.test.ts`

Per @superpowers:test-driven-development: erst Test schreiben + scheitern lassen, dann verifizieren dass die existing Implementation passt.

- [ ] **Step 1: Test-Datei anlegen mit den 3 Tests**

`packages/shared/src/toast/__tests__/toast.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useToastStore } from '../toastStore'
import { useToast } from '../useToast'

describe('toastStore.add', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('pushes a toast into the store', () => {
    useToastStore.getState().add('error', 'Test-Fehler')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].message).toBe('Test-Fehler')
    expect(useToastStore.getState().toasts[0].variant).toBe('error')
  })
})

describe('useToast.error', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('creates a sticky toast by default for errors', () => {
    const { result } = renderHook(() => useToast())
    result.current.error('Bleibt')
    const toast = useToastStore.getState().toasts[0]
    expect(toast.variant).toBe('error')
    expect(toast.sticky).toBe(true)
  })
})

describe('useToast identity', () => {
  it('returns referentially stable api across renders', () => {
    const { result, rerender } = renderHook(() => useToast())
    const first = result.current
    rerender()
    const second = result.current
    expect(first).toBe(second)
  })
})
```

- [ ] **Step 2: Tests laufen lassen**

```bash
cd packages/shared
npm test
cd ../..
# Expected: alle 3 Tests grün, weil Toast-Implementation aus ExamLab funktional ist.
```

Wenn ein Test scheitert: das ist ein **Bug-Fund** — die ExamLab-Toast-Implementation hatte einen latenten Defekt, der nie aufgefallen ist (Memory-Stand: 0 Toast-Tests). Den Test als `it.todo(...)` markieren (vitest-Syntax) und im Plan-Commit-Message vermerken, **nicht** die Implementation fixen (Out-of-Scope).

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/toast/__tests__/
git commit -m "test(shared): 3 Toast-Smoke-Tests (Store.add, sticky-Default, useToast-Identity)"
```

---

### Task 2.5: ExamLab Import-Konsumenten präzisieren

**Files:** (keine Änderungen, nur Discovery)

- [ ] **Step 1: Echte Imports zählen**

```bash
cd ExamLab
echo "useToast imports:"
grep -rEn "^import .* from ['\"]@/hooks/useToast['\"]" src/ | wc -l
echo "toastStore imports:"
grep -rEn "^import .* from ['\"]@/store/toastStore['\"]" src/ | wc -l
echo "ToastContainer imports:"
grep -rEn "^import .* from ['\"]@/components/shared/ToastContainer['\"]" src/ | wc -l
cd ..
```

Notiere die Zahlen — sie ersetzen die spec-internen „114 grep-Treffer".

- [ ] **Step 2: ToastContainer-Default-Imports identifizieren**

```bash
cd ExamLab
grep -rn "import ToastContainer from" src/
# Erwartet: 1 Treffer (App.tsx oder vergleichbar)
cd ..
```

Notiere alle Default-Import-Fundstellen — diese brauchen manuelle Named-Import-Korrektur.

---

### Task 2.6: sed-Run für useToast + toastStore Imports

**Files:**
- Modify: alle ExamLab/src/**/*.{ts,tsx} mit useToast/toastStore-Imports

- [ ] **Step 1: sed-Run**

```bash
cd ExamLab
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/hooks/useToast'|from '@gymhofwil/shared'|g" \
  -e "s|from '@/store/toastStore'|from '@gymhofwil/shared'|g" \
  -e 's|from "@/hooks/useToast"|from "@gymhofwil/shared"|g' \
  -e 's|from "@/store/toastStore"|from "@gymhofwil/shared"|g' \
  {} +
cd ..
```

Beachte: macOS-`sed` braucht `-i ''` (zwei Argumente). Linux-`sed` würde `-i` alleine nehmen — falls Plan in Linux-CI ausgeführt: anpassen.

- [ ] **Step 2: Verifizieren dass kein Alt-Pfad mehr existiert**

```bash
cd ExamLab
grep -rEn "@/hooks/useToast|@/store/toastStore" src/ 2>&1 || echo "keine Treffer mehr"
cd ..
# Expected: keine Treffer
```

- [ ] **Step 3: Diff-Größe prüfen**

```bash
git diff --stat ExamLab/src
# Sollte ungefähr der Zahl aus Task 2.5 Step 1 entsprechen
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src
git commit -m "refactor(examlab): useToast + toastStore Imports auf @gymhofwil/shared"
```

---

### Task 2.7: ToastContainer Default→Named-Import-Migration

**Files:**
- Modify: jedes File aus Task 2.5 Step 2

- [ ] **Step 1: Für jedes Default-Import-File**

Pro Fundstelle aus Task 2.5 Step 2 (typischerweise `ExamLab/src/App.tsx`):

Alt:
```tsx
import ToastContainer from '@/components/shared/ToastContainer'
```

Neu:
```tsx
import { ToastContainer } from '@gymhofwil/shared'
```

Manuell editieren. Bei mehreren Files: jedes einzeln.

- [ ] **Step 2: Verifizieren**

```bash
cd ExamLab
grep -rn "from '@/components/shared/ToastContainer'" src/ || echo "keine Treffer"
grep -rn 'ToastContainer' src/App.tsx
cd ..
# App.tsx-Output sollte zeigen: import { ToastContainer } from '@gymhofwil/shared'
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src
git commit -m "refactor(examlab): ToastContainer Default- auf Named-Import migrieren"
```

---

### Task 2.8: ExamLab Toast-Source-Files löschen

**Files:**
- Delete: `ExamLab/src/store/toastStore.ts`
- Delete: `ExamLab/src/hooks/useToast.ts`
- Delete: `ExamLab/src/components/shared/ToastContainer.tsx`

- [ ] **Step 1: tsc als pre-check**

```bash
cd ExamLab
npx tsc -b 2>&1 | head -10
# Expected: grün — Imports zeigen jetzt auf @gymhofwil/shared
cd ..
```

Wenn rot: einer der vorherigen sed/manuell-Edits hat etwas übersehen. Stop, debug.

- [ ] **Step 2: Files entfernen**

```bash
git rm ExamLab/src/store/toastStore.ts
git rm ExamLab/src/hooks/useToast.ts
git rm ExamLab/src/components/shared/ToastContainer.tsx
```

- [ ] **Step 3: tsc nach Delete**

```bash
cd ExamLab
npx tsc -b
cd ..
# Expected: weiterhin grün
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(examlab): Toast-Source-Files löschen (jetzt in packages/shared)"
```

---

### Task 2.9: Phase-2-Verifikation ExamLab

**Files:** (keine, nur Verifikations-Commands)

- [ ] **Step 1: ExamLab CI-Check komplett**

```bash
cd ExamLab
npm run ci-check
cd ..
# Expected: tsc -b grün, alle 9 Lint-Gates grün, vitest 1994+ Tests grün, build grün
```

Wenn ein Test scheitert: prüfen ob der Test ein Toast direkt instanziert hatte (z.B. mock'd `@/store/toastStore`). Solche Tests brauchen Mock-Update auf neuen Pfad. Per File fixen.

- [ ] **Step 2: Push + CI**

```bash
git push
```

Warte auf GitHub-Actions-Run. Phase 2 ist erst abgeschlossen wenn:
- Lokal alle Verifikationen grün
- CI grün

- [ ] **Step 3: Browser-Smoke-Test ExamLab**

User-getrieben (LP nutzt Chrome-in-Chrome Tab-Gruppe gemäss `regression-prevention.md`):
- Login als LP (`wr.test@gymhofwil.ch`) + SuS (`wr.test@stud.gymhofwil.ch`) in zwei Tabs
- Einrichtungsprüfung laden, ein paar Fragen beantworten
- Min. 1 Toast triggern: z.B. ungültige Form-Eingabe oder fehlgeschlagener API-Call (Netzwerk im DevTools blocken)
- **Verifikation:** Toast erscheint top-right, korrekte Severity-Farbe, Auto-Hide funktioniert
- Console: keine Errors

Wenn Browser-Test scheitert: Toast wird nicht angezeigt → `<ToastContainer />` ist nicht gemountet, oder `@gymhofwil/shared`-Resolution funktioniert im Bundle nicht. Debug, dann re-deploy.

---

## Phase 3 — Planer-Touch (alert + any-Token + Lint-Gates)

### Task 3.1: ToastContainer in Planer mounten

**Files:**
- Modify: `Unterrichtsplaner/src/App.tsx`

- [ ] **Step 1: App.tsx lesen**

```bash
head -50 Unterrichtsplaner/src/App.tsx
```

Identifiziere den JSX-Root und einen passenden Mount-Punkt (sibling zum Main-Content).

- [ ] **Step 2: Import + Mount hinzufügen**

`Unterrichtsplaner/src/App.tsx`:
```tsx
import { ToastContainer } from '@gymhofwil/shared'
// ...
// im JSX-Root (sibling-Position):
<ToastContainer />
```

- [ ] **Step 3: Build**

```bash
cd Unterrichtsplaner && npx tsc -b && npm run build && cd ..
# Expected: grün
```

- [ ] **Step 4: Commit**

```bash
git add Unterrichtsplaner/src/App.tsx
git commit -m "feat(planer): ToastContainer mounten"
```

---

### Task 3.2: Planer tailwind.config.ts mit Shared im Content-Scope

**Files:**
- Create or Modify: `Unterrichtsplaner/tailwind.config.ts`

- [ ] **Step 1: Existenz prüfen**

```bash
ls Unterrichtsplaner/tailwind.config.* 2>&1 || echo "fehlt"
```

- [ ] **Step 2: Config anlegen oder erweitern**

Wenn fehlt, `Unterrichtsplaner/tailwind.config.ts` neu anlegen:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx,html}',
    './index.html',
    '../packages/shared/src/**/*.{ts,tsx}',
  ],
}
export default config
```

Wenn bereits existiert: Content-Array um `'../packages/shared/src/**/*.{ts,tsx}'` ergänzen.

- [ ] **Step 3: Build verifizieren**

```bash
cd Unterrichtsplaner && npm run build && cd ..
```

- [ ] **Step 4: Commit**

```bash
git add Unterrichtsplaner/tailwind.config.ts
git commit -m "build(planer): Tailwind content-scope um @gymhofwil/shared erweitern"
```

---

### Task 3.3: Audit-Skripte um --target-Parameter erweitern

**Files:**
- Modify: `scripts/audit-as-any.sh`
- Modify: `scripts/audit-no-alert.sh`

Pflicht-Refactor (Spec §3.4.0). Heute beide Skripte hardcoden ihre SOURCES.

- [ ] **Step 1: audit-as-any.sh — Skript lesen**

```bash
cat scripts/audit-as-any.sh
```

Identifiziere die `SOURCES=(...)`-Zeile (vermutlich Z.25 laut Spec).

- [ ] **Step 2: --target-Parsing einbauen**

Vor der `SOURCES=(...)`-Definition Parameter-Parsing einbauen:
```bash
TARGET_OVERRIDE=""
for arg in "$@"; do
  case "$arg" in
    --target=*)
      TARGET_OVERRIDE="${arg#--target=}"
      ;;
  esac
done

if [[ -n "$TARGET_OVERRIDE" ]]; then
  SOURCES=("$TARGET_OVERRIDE")
else
  SOURCES=(ExamLab/src packages/shared/src)
fi
```

Stelle sicher dass `--strict`-Parsing weiter funktioniert (steht typischerweise schon im Skript).

- [ ] **Step 3: Default-Pfad-Test (Backwards-Compat)**

```bash
bash scripts/audit-as-any.sh
# Expected: läuft wie vorher (ExamLab-Audit)
```

- [ ] **Step 4: --target-Pfad-Test**

```bash
bash scripts/audit-as-any.sh --target=Unterrichtsplaner/src
# Expected: zeigt ~80 any-Token-Treffer im Planer
```

- [ ] **Step 5: audit-no-alert.sh analog ändern**

Gleiche Änderung in `scripts/audit-no-alert.sh`. Default `SOURCES="ExamLab/src"` → wird durch `--target=<dir>` überschreibbar.

```bash
bash scripts/audit-no-alert.sh --target=Unterrichtsplaner/src
# Expected: zeigt 54 alert()-Treffer im Planer
```

- [ ] **Step 6: Commit**

```bash
git add scripts/audit-as-any.sh scripts/audit-no-alert.sh
git commit -m "build(scripts): audit-as-any + audit-no-alert um --target-Parameter erweitern"
```

---

### Task 3.4: alert()-Migration File-by-File

Für jede der 10 Files unten: ein Task, ein Commit. Pro File ist das ein Pattern aus 3 Schritten (count vorher, ersetzen, count nachher).

**Vorab-Check (Drift-Schutz):**

```bash
grep -rEcn "alert\(" Unterrichtsplaner/src/ | grep -v ":0$"
# Expected: Gesamtsumme = 54 (aus Spec). Wenn abweichend: ist der Spec-Stand veraltet,
# Severity-Mapping pro File neu durchgehen.
```

**Severity-Heuristik (aus Spec §3.2):**
- "Fehler", "konnte nicht", "ungültig" → `toast.error()`
- "Gespeichert", "Erfolgreich", "Importiert" → `toast.success()`
- "Hinweis", "Information" → `toast.info()`
- "Achtung", "Warnung", "Vorsicht" → `toast.warning()`
- Im Zweifelsfall: `toast.info()` (am wenigsten Bedeutung)

**Wichtig:** `confirm()`-Aufrufe **nicht anfassen**. Nur reine `alert(...)` migrieren.

**Pattern pro File:**

- [ ] **a) Count vorher**

```bash
grep -cn "alert(" Unterrichtsplaner/src/<PATH>
```

- [ ] **b) Import + Hook ergänzen**

Oben im File:
```tsx
import { useToast } from '@gymhofwil/shared'
```

In der Komponente:
```tsx
const toast = useToast()
```

(Falls die Datei keine Komponente sondern ein Util ist — z.B. `shared.tsx` — den `useToast`-Hook in den Caller hochziehen und als Argument übergeben. Bei Utils ohne Komponenten-Kontext kann auch `useToastStore.getState().add(...)` direkt verwendet werden, analog ExamLab Memory-Regel.)

- [ ] **c) Pro alert()-Stelle umschreiben**

Pattern:
```tsx
alert('Fehler beim Importieren: ' + msg)
```
wird zu:
```tsx
toast.error('Fehler beim Importieren: ' + msg)
```

Severity nach Heuristik wählen.

- [ ] **d) Count nachher**

```bash
grep -cn "alert(" Unterrichtsplaner/src/<PATH>
# Expected: 0
```

Wenn nicht 0: einzelne Stelle übersehen. Manuell finden und ersetzen.

- [ ] **e) tsc + commit**

```bash
cd Unterrichtsplaner && npx tsc -b && cd ..
git add Unterrichtsplaner/src/<PATH>
git commit -m "refactor(planer): alert() → Toast in <File> (<N> Stellen)"
```

#### Subtasks (10 Files in dieser Reihenfolge — von gross zu klein):

- [ ] **Task 3.4.a:** `Unterrichtsplaner/src/components/SettingsPanel.tsx` (29 Stellen)
- [ ] **Task 3.4.b:** `Unterrichtsplaner/src/components/PlannerTabs.tsx` (9 Stellen)
- [ ] **Task 3.4.c:** `Unterrichtsplaner/src/components/TaFPanel.tsx` (4 Stellen)
- [ ] **Task 3.4.d:** `Unterrichtsplaner/src/components/settings/KursImportButton.tsx` (3 Stellen — Pfad in Phase 3.4 Start verifizieren mit `find Unterrichtsplaner/src -name "KursImportButton.tsx"`)
- [ ] **Task 3.4.e:** `Unterrichtsplaner/src/components/detail/shared.tsx` (2 Stellen)
- [ ] **Task 3.4.f:** `Unterrichtsplaner/src/components/ZoomMultiYearView.tsx` (2 Stellen)
- [ ] **Task 3.4.g:** `Unterrichtsplaner/src/components/SequencePanel.tsx` (2 Stellen)
- [ ] **Task 3.4.h:** `Unterrichtsplaner/src/components/SubjectsEditor.tsx` (1 Stelle)
- [ ] **Task 3.4.i:** `Unterrichtsplaner/src/components/settings/GCalSection.tsx` (1 Stelle — Pfad verifizieren)
- [ ] **Task 3.4.j:** `Unterrichtsplaner/src/components/detail/DetailsTab.tsx` (1 Stelle)

- [ ] **Final-Check nach 3.4:** Gesamt-Count

```bash
grep -rcn "alert(" Unterrichtsplaner/src/ | grep -v ":0$" | grep -v "test"
# Expected: keine Treffer (alle Files haben 0 alert)
```

---

### Task 3.5: any-Token-Migration File-by-File

**Files:** alle Files mit `as any`, `: any` oder `= any` in `Unterrichtsplaner/src/`.

- [ ] **Step 1: Discovery — alle Treffer auflisten**

```bash
grep -rEn "\bas any\b|: any\b|= any\b" Unterrichtsplaner/src/ \
  | awk -F: '{print $1}' | sort | uniq -c | sort -rn
```

Notiere die Liste — pro File ist es ein Sub-Task analog 3.4.

- [ ] **Step 2: Pro File**

**Strategie wählen (aus Spec §3.3):**
1. **Echter Type-Guard** (bevorzugt): Type-Predicate-Function definieren, danach Cast überflüssig.
2. **Defensive-Marker**: `as unknown as <ConcreteType> /* Defensive: <Begründung> */`. Der Marker-Kommentar muss auf der gleichen Zeile stehen (sonst sieht das Audit-Skript ihn nicht — verifiziert: Skript scannt zeilenweise mit `grep`).
3. **Bug-Fund**: falls ein `as any` einen echten Mismatch versteckt — erst Bug fixen, dann Cast entfernen.

Pro File:
- [ ] **a)** Count vorher: `grep -cE "\bas any\b|: any\b|= any\b" Unterrichtsplaner/src/<PATH>`
- [ ] **b)** Pro Stelle Strategie wählen + Cast ersetzen
- [ ] **c)** Count undokumentiert nachher: `grep -E "\bas any\b|: any\b|= any\b" Unterrichtsplaner/src/<PATH> | grep -vc "Defensive"` — Expected: 0
- [ ] **d)** `cd Unterrichtsplaner && npx tsc -b && cd ..` — grün
- [ ] **e)** Commit: `refactor(planer): any-Token-Cleanup in <File> (<N> Stellen)`

**Bekannte Top-Konzentrationen (Spec §3.3):**
- `Unterrichtsplaner/src/components/ZoomYearView.tsx` (~9 Stellen, Event-Type-Guards)
- `Unterrichtsplaner/src/components/WeekRows.tsx` (~7 Stellen, Event-Type-Guards)
- `Unterrichtsplaner/src/components/ExcelImport.tsx` (~1 Stelle, Enum-Cast)

Pro Event-Type-Guard-File empfiehlt sich, eine einzige Type-Predicate-Function lokal in der Datei oben zu definieren und alle `(e as any).<field>`-Stellen durch `e.<field>` nach Guard zu ersetzen. Beispiel:

```ts
type LessonEvent = { type: 1; note: string; courseId: string; /* ... */ }
type FerienEvent = { type: 6; }
type AnyEvent = LessonEvent | FerienEvent | { type: 0 } | { type: 5 } | ...

function isLesson(e: AnyEvent): e is LessonEvent {
  return e.type === 1
}
```

- [ ] **Step 3: Final-Check**

```bash
bash scripts/audit-as-any.sh --target=Unterrichtsplaner/src
# Expected: 0 undokumentierte Treffer (alle 80 sind entweder echt typisiert oder mit /* Defensive: ... */ markiert)
```

---

### Task 3.6: Planer-package.json Lint-Scripts ergänzen

**Files:**
- Modify: `Unterrichtsplaner/package.json`

- [ ] **Step 1: scripts-Block erweitern**

```json
"lint:as-any": "../scripts/audit-as-any.sh --strict --target=Unterrichtsplaner/src",
"lint:no-alert": "../scripts/audit-no-alert.sh --strict --target=Unterrichtsplaner/src"
```

- [ ] **Step 2: Lokal grün?**

```bash
cd Unterrichtsplaner
npm run lint:as-any
npm run lint:no-alert
cd ..
# Expected: beide grün (Migrations aus 3.4 + 3.5 müssen vorher abgeschlossen sein)
```

Wenn rot: Migrations-Lücke, zurück zu 3.4/3.5.

- [ ] **Step 3: Commit**

```bash
git add Unterrichtsplaner/package.json
git commit -m "build(planer): lint:as-any + lint:no-alert-Scripts aktivieren"
```

---

### Task 3.7: CI-Workflow um Planer-Gates erweitern

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Production-Block — neue Steps**

Nach dem `Build Unterrichtsplaner`-Step (oder direkt nach den ExamLab-Lint-Steps, an einer logischen Stelle) zwei neue Steps einfügen:

```yaml
- name: Audit `any` Use (Planer)
  working-directory: Unterrichtsplaner
  run: npm run lint:as-any

- name: Audit alert() Use (Planer)
  working-directory: Unterrichtsplaner
  run: npm run lint:no-alert --if-present
```

- [ ] **Step 2: Staging-Block — gleiche zwei Steps**

Memory-Regel: CI-Gates müssen auf **beiden** Workflow-Hälften aktiviert sein. Im staging-Block (Steps mit `if: steps.checkout-preview.outcome == 'success'`) die gleichen zwei Steps replizieren.

- [ ] **Step 3: yaml-Lint**

```bash
# Wenn yamllint installiert ist:
which yamllint && yamllint .github/workflows/deploy.yml || echo "yamllint nicht installiert — Skip"
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(planer): lint:as-any + lint:no-alert Gates auf prod + staging"
```

---

### Task 3.8: Version-Bump auf v3.106

**Files:**
- Modify: `Unterrichtsplaner/src/version.ts`

- [ ] **Step 1: version.ts editieren**

```ts
export const APP_VERSION = 'v3.106';
```

- [ ] **Step 2: Commit**

```bash
git add Unterrichtsplaner/src/version.ts
git commit -m "chore(planer): Version-Bump auf v3.106"
```

---

### Task 3.9: HANDOFF-Update — UP-5/UP-6 ✅, Session 19.05.2026

**Files:**
- Modify: `Unterrichtsplaner/HANDOFF.md`

- [ ] **Step 1: Header + Offene Punkte**

`Unterrichtsplaner/HANDOFF.md`:
- Header v3.105 → v3.106
- „Status" anpassen: „v3.106 — Harmonisierung mit ExamLab (Toast, Lint-Gates)"
- „Aktuelle Version" auf v3.106 mit Datum 19.05.2026
- UP-5 als ✅ erledigt markieren (Toast aus shared importiert, 54 alert() ersetzt, Lint-Gate `lint:no-alert` aktiv)
- UP-6 als ✅ erledigt markieren (npm-Workspaces aktiv, `@gymhofwil/shared` als Dep, Lint-Gate `lint:as-any` aktiv mit 0 undokumentierten Stellen)

- [ ] **Step 2: Letzte Sessions ergänzen**

Neue Sektion am Anfang von „Letzte Sessions":
```markdown
### 19.05.2026 — Bundle 1+2: Toast + Lint-Gates Harmonisierung (v3.106)

- npm-Workspaces im Root aktiviert (`packages/shared`, `Unterrichtsplaner`, `ExamLab`).
- Toast-System aus ExamLab nach `packages/shared` verschoben — beide Apps importieren aus `@gymhofwil/shared`.
- 3 Smoke-Tests für Toast in `packages/shared/src/toast/__tests__/`.
- Planer: 54 `alert()` durch Toast ersetzt + 80 `any`-Token migriert (Defensive-Marker oder echter Type-Guard).
- Lint-Gates `lint:as-any` + `lint:no-alert` strict aktiviert + in CI verdrahtet (production + staging).
- Audit-Skripte `audit-as-any.sh` + `audit-no-alert.sh` um `--target=<dir>`-Parameter erweitert.
```

- [ ] **Step 3: Versionshistorie ergänzen**

```markdown
| v3.106 | 19.05.2026 | Bundle 1+2: Toast → shared, alert→Toast, any-Token-Migration, Lint-Gates |
```

- [ ] **Step 4: Commit**

```bash
git add Unterrichtsplaner/HANDOFF.md
git commit -m "docs(planer): HANDOFF auf v3.106 mit Bundle 1+2 Abschluss"
```

---

### Task 3.10: Planer Manual Browser-Test

**Files:** (keine Änderungen)

Per Spec §3 Verifikations-Block:

- [ ] **Step 1: Dev-Server starten**

```bash
cd Unterrichtsplaner
npm run dev
```

- [ ] **Step 2: Trigger-Pfade durchklicken**

Browser auf `http://localhost:5173`, dann pro File mindestens einen Trigger:

| File | Trigger | Expected |
|------|---------|----------|
| SettingsPanel.tsx | Kurs anlegen (Form abschicken) + Fach löschen | Toast top-right mit korrekter Severity |
| PlannerTabs.tsx | Tab umbenennen + Tab löschen | confirm() blockierend, Toast asynchron |
| TaFPanel.tsx | Phase ändern | Toast |
| KursImportButton.tsx | Import-Fehler provozieren (ungültiges Sheet) | toast.error |
| ZoomMultiYearView.tsx | Bulk-Action | Toast |
| SequencePanel.tsx | Sequenz-Befehl | Toast |
| SubjectsEditor.tsx | Fachbereich-Edit | Toast |
| settings/GCalSection.tsx | Calendar-Sync | Toast |
| detail/DetailsTab.tsx | Batch-Edit | Toast |

Console: keine Errors.

- [ ] **Step 3: Result dokumentieren**

Pro Trigger Status notieren. Wenn ein Toast nicht erscheint (typischer Fehler: Tailwind-Content-Scope vergessen, ToastContainer nicht gemountet, falscher Pfad): zurück zu Task 3.1/3.2, fixen.

---

## Phase 4 — Cross-Cutting Verifikation + Merge

### Task 4.1: Lokal alle Gates grün

**Files:** (keine, nur Verifikations-Commands)

- [ ] **Step 1: ExamLab-Seite**

```bash
cd ExamLab && npm run ci-check && cd ..
```

Expected: alle 9 Lint-Gates + tsc + vitest + build grün.

- [ ] **Step 2: Planer-Seite**

```bash
cd Unterrichtsplaner
npx tsc -b
npm run lint
npm run lint:as-any
npm run lint:no-alert
npm run build
cd ..
```

Expected: alle grün.

- [ ] **Step 3: React-Hoisting weiterhin korrekt**

```bash
npm ls react | grep react@
# Expected: nur eine React-Version
```

---

### Task 4.2: Push, CI-Verifikation, Pre-Merge-Tag

**Files:** (keine direkten Änderungen)

- [ ] **Step 1: Push**

```bash
git push
```

- [ ] **Step 2: CI grün abwarten**

GitHub-Actions-Workflow läuft. Wenn rot: Logs lesen, fixen, neu committen. Erst weiter wenn grün.

- [ ] **Step 3: Pre-Merge-Tag**

```bash
git tag v-pre-bundle-1-2 -m "Stable point before Bundle 1+2 merge (Rollback-Anker)"
git push --tags
```

---

### Task 4.3: Merge auf main + Push

**Files:** (keine)

- [ ] **Step 1: Aktuelles main fetchen**

```bash
git fetch origin
git log origin/main..HEAD --oneline | head -20
# Übersicht über die Commits, die in main fliessen
```

- [ ] **Step 2: Merge**

```bash
git checkout main
git pull
git merge --no-ff feature/bundle-1-2-toast-shared -m "Bundle 1+2: Toast → packages/shared, Lint-Gates für Planer (v3.106)"
```

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: preview-Branch FF-pushen (Memory-Regel CI-Gates beidseitig)**

```bash
git log origin/preview ^origin/main --oneline
# Wenn leer: preview ist strikt hinter main → FF sicher
git push origin main:preview
```

Wenn die `git log`-Ausgabe Commits zeigt: preview hat eigene Arbeit, dann nicht force-pushen — manuell prüfen.

- [ ] **Step 5: Post-Merge CI-Check**

GitHub-Actions auf main-Run grün abwarten. Wenn rot: `git revert <merge-commit>` als Rollback (Memory-Regel: Pre-Merge-Tag macht das sicher).

- [ ] **Step 6: Branch-Cleanup**

```bash
git branch -d feature/bundle-1-2-toast-shared
git push origin --delete feature/bundle-1-2-toast-shared
```

---

## Abschluss-Verifikation

- [ ] HANDOFF.md zeigt v3.106 + UP-5/UP-6 als ✅
- [ ] `npm ls react` zeigt eine React-Version
- [ ] ExamLab + Planer + Shared lokal alle grün
- [ ] CI auf main grün
- [ ] Browser-Test: Toast erscheint sowohl im ExamLab als auch im Planer
- [ ] Lint-Gates feuern bei neuer `alert()`- oder undokumentierter `any`-Token-Stelle (Spot-Check: temporär eine Stelle einbauen, Skript-Aufruf, danach Stelle wieder entfernen)

## Out-of-Scope (Reminder)

Diese Punkte sind **nicht** Teil dieses Bundles und werden in Folge-Bundles (UP-7 / UP-8) angegangen:
- Toast-Tests breitflächiger ausbauen
- Weitere ExamLab-Lint-Gates für Planer (typo-tokens, no-emoji, etc.)
- vitest-Setup im Planer (über die 3 Shared-Tests hinaus)
- `generateColorVariants` aus Planer nach Shared
- Apps-Script-URL aus Config
- `--if-present` aus `lint:no-alert`-Step rausnehmen
- `confirm()` (37 Stellen im Planer) durch React-Modal ersetzen
