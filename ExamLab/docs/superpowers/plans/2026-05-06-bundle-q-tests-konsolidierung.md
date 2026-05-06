# Bundle Q — Test-Verzeichnis-Konsolidierung Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle `__tests__/`-Verzeichnisse aus ExamLab + packages/shared retiren, 19 Files nach Heuristik B („Test wandert zur Source") neu platzieren, Test-Layer-Strategie dokumentieren, CI-Gate aktivieren — alles bei unveränderter Vitest-Baseline (1234 passes).

**Architecture:** Vier sequentielle Commits auf Branch `refactor/bundle-q-tests-konsolidierung`. Jeder Commit ist atomar mit grünem `npm test` + `tsc -b`. `git mv` (kein cp+rm) erhält File-History. Vitest-Config bleibt unangetastet — der existierende Glob deckt alle Zielorte schon ab.

**Tech Stack:** TypeScript + Vitest + GitHub Actions. Bash-Audit-Skript analog zu `scripts/audit-as-any.sh`. Keine neuen npm-Dependencies.

**Spec:** [`docs/superpowers/specs/2026-05-06-bundle-q-tests-konsolidierung-design.md`](../specs/2026-05-06-bundle-q-tests-konsolidierung-design.md)

---

## File Structure

### Neue Dateien

```
GYM-WR-DUY/
├── scripts/
│   └── audit-test-locations.sh                                    [neu]
├── ExamLab/src/test-helpers/
│   ├── frageStorageMocks.ts                                       [moved from src/__tests__/helpers/]
│   └── frageStorageMocks.test.ts                                  [moved from src/__tests__/helpers/]
└── ExamLab/src/tests/regression/
    ├── apiClient.test.ts                                          [moved from src/__tests__/regression/]
    └── securityInvarianten.test.ts                                [moved from src/__tests__/regression/]
```

### Modifizierte Dateien

```
ExamLab/
├── package.json                                                   [+lint:no-tests-dir Script]
├── src/
│   ├── utils/
│   │   ├── fachUtils.test.ts                                      [moved + import-fix]
│   │   ├── gefaessUtils.test.ts                                   [moved + import-fix]
│   │   ├── sichtbareTypen.test.ts                                 [moved + import-fix]
│   │   └── ueben/
│   │       └── masteryRecency.test.ts                             [moved + import-fix]
│   ├── store/
│   │   └── schulConfigStore.test.ts                               [moved + import-fix]
│   ├── types/
│   │   └── ueben/
│   │       └── themenSichtbarkeit.test.ts                         [moved + import-fix]
│   ├── components/
│   │   ├── Startbildschirm.test.tsx                               [moved + import-fix]
│   │   └── lp/durchfuehrung/
│   │       └── DurchfuehrenDashboard.test.tsx                     [moved + import-fix]
│   └── hooks/
│       └── useFragenAutoSave.test.tsx                             [import-rewrite einziger ausserhalb-Konsument]
└── HANDOFF.md                                                     [+Bundle Q Eintrag]

packages/shared/src/
├── components/
│   ├── MediaAnzeige.test.tsx                                      [moved, kein import-change]
│   └── MediaUpload.test.tsx                                       [moved, kein import-change]
├── types/
│   └── mediaQuelle.test.ts                                        [moved, kein import-change]
└── utils/
    ├── mediaQuelleBytes.test.ts                                   [moved]
    ├── mediaQuelleMigrator.test.ts                                [moved]
    ├── mediaQuelleResolver.test.ts                                [moved]
    └── mediaQuelleUrl.test.ts                                     [moved]

.claude/rules/
└── code-quality.md                                                [+Sektion Test-Layer-Strategie]

.github/workflows/
└── deploy.yml                                                     [+2× lint:no-tests-dir-Step]
```

### Gelöschte Dateien (entstehen automatisch leere Dirs)

```
ExamLab/src/__tests__/                                             [entfernt nach Move]
ExamLab/src/components/__tests__/                                  [entfernt nach Move]
ExamLab/src/components/lp/durchfuehrung/__tests__/                 [entfernt nach Move]
```

---

## Pre-flight (vor Phase 1)

- [ ] **Step 0.1: Branch verifizieren**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY" && git branch --show-current`
Expected: `refactor/bundle-q-tests-konsolidierung`

(Branch existiert bereits inkl. der zwei Spec-Commits `e4887f2` + `9dce3ff`. Falls nicht, `git checkout main && git pull && git checkout -b refactor/bundle-q-tests-konsolidierung`.)

- [ ] **Step 0.2: Baseline-Tests grün**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo`

- [ ] **Step 0.3: Baseline tsc**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -5`
Expected: keine Error-Zeilen.

---

## Phase 1 — Commit 1: `src/__tests__/`-Hauptmasse bewegen

Insgesamt **17 Files** werden via `git mv` bewegt (16 Tests + 1 Helper-`.ts`). Helper-Test wandert mit (zählt unter „16 Tests"). Plus 1 Konsumenten-Import-Rewrite in `src/hooks/useFragenAutoSave.test.tsx`.

### Task 1.1: Direkt-Colocation (6 Files, src/__tests__/*.test.ts → src/<foo>/X.test.ts)

**Files (Move):**
- `ExamLab/src/__tests__/fachUtils.test.ts` → `ExamLab/src/utils/fachUtils.test.ts`
- `ExamLab/src/__tests__/gefaessUtils.test.ts` → `ExamLab/src/utils/gefaessUtils.test.ts`
- `ExamLab/src/__tests__/masteryRecency.test.ts` → `ExamLab/src/utils/ueben/masteryRecency.test.ts`
- `ExamLab/src/__tests__/schulConfig.test.ts` → `ExamLab/src/store/schulConfigStore.test.ts`
- `ExamLab/src/__tests__/sichtbareTypen.test.ts` → `ExamLab/src/utils/sichtbareTypen.test.ts`
- `ExamLab/src/__tests__/themenSichtbarkeit.test.ts` → `ExamLab/src/types/ueben/themenSichtbarkeit.test.ts`

- [ ] **Step 1.1.1: git mv aller 6 Files**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git mv ExamLab/src/__tests__/fachUtils.test.ts        ExamLab/src/utils/fachUtils.test.ts
git mv ExamLab/src/__tests__/gefaessUtils.test.ts     ExamLab/src/utils/gefaessUtils.test.ts
git mv ExamLab/src/__tests__/masteryRecency.test.ts   ExamLab/src/utils/ueben/masteryRecency.test.ts
git mv ExamLab/src/__tests__/schulConfig.test.ts      ExamLab/src/store/schulConfigStore.test.ts
git mv ExamLab/src/__tests__/sichtbareTypen.test.ts   ExamLab/src/utils/sichtbareTypen.test.ts
git mv ExamLab/src/__tests__/themenSichtbarkeit.test.ts ExamLab/src/types/ueben/themenSichtbarkeit.test.ts
```

- [ ] **Step 1.1.2: Imports anpassen — `fachUtils.test.ts`**

In `ExamLab/src/utils/fachUtils.test.ts` ersetzen:
- `from '../utils/fachUtils'` → `from './fachUtils'`
- `from '../types/tags'` → `from '../types/tags'` *(unverändert — Tiefe gleich)*

Verifikation: `grep -n "from '" ExamLab/src/utils/fachUtils.test.ts | head -3` zeigt:
```
from 'vitest'
from './fachUtils'
from '../types/tags'
```

- [ ] **Step 1.1.3: Imports anpassen — `gefaessUtils.test.ts`**

In `ExamLab/src/utils/gefaessUtils.test.ts` ersetzen:
- `from '../utils/gefaessUtils'` → `from './gefaessUtils'`
- `from '../types/schulConfig'` → `from '../types/schulConfig'` *(unverändert)*

- [ ] **Step 1.1.4: Imports anpassen — `masteryRecency.test.ts`**

In `ExamLab/src/utils/ueben/masteryRecency.test.ts` ersetzen:
- `from '../utils/ueben/mastery'` → `from './mastery'`

- [ ] **Step 1.1.5: Imports anpassen — `schulConfigStore.test.ts`**

In `ExamLab/src/store/schulConfigStore.test.ts` ersetzen:
- `from '../types/schulConfig'` → `from '../types/schulConfig'` *(unverändert — von src/store/ aus immer noch `../types/`)*
- `from '../store/schulConfigStore'` → `from './schulConfigStore'`

- [ ] **Step 1.1.6: Imports anpassen — `sichtbareTypen.test.ts`**

In `ExamLab/src/utils/sichtbareTypen.test.ts` ersetzen:
- `from '../utils/sichtbareTypen'` → `from './sichtbareTypen'`

- [ ] **Step 1.1.7: Imports anpassen — `themenSichtbarkeit.test.ts`**

In `ExamLab/src/types/ueben/themenSichtbarkeit.test.ts` ersetzen:
- `from '../types/ueben/themenSichtbarkeit'` → `from './themenSichtbarkeit'`

- [ ] **Step 1.1.8: Vitest-Run für Task 1.1**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo` (gleiche Anzahl).

Wenn FAIL: prüfen, ob ein Import übersehen wurde. `grep -rn "from '\.\./utils/fachUtils\|from '\.\./utils/gefaessUtils\|from '\.\./utils/sichtbareTypen\|from '\.\./types/ueben/themenSichtbarkeit\|from '\.\./store/schulConfigStore\|from '\.\./utils/ueben/mastery'" ExamLab/src/utils ExamLab/src/store ExamLab/src/types` darf 0 Treffer haben.

### Task 1.2: Shared-Tests in packages/shared/ colocaten (7 Files)

**Files (Move):**
- `ExamLab/src/__tests__/media/MediaAnzeige.test.tsx` → `packages/shared/src/components/MediaAnzeige.test.tsx`
- `ExamLab/src/__tests__/media/MediaUpload.test.tsx` → `packages/shared/src/components/MediaUpload.test.tsx`
- `ExamLab/src/__tests__/media/mediaQuelle.test.ts` → `packages/shared/src/types/mediaQuelle.test.ts`
- `ExamLab/src/__tests__/media/mediaQuelleBytes.test.ts` → `packages/shared/src/utils/mediaQuelleBytes.test.ts`
- `ExamLab/src/__tests__/media/mediaQuelleMigrator.test.ts` → `packages/shared/src/utils/mediaQuelleMigrator.test.ts`
- `ExamLab/src/__tests__/media/mediaQuelleResolver.test.ts` → `packages/shared/src/utils/mediaQuelleResolver.test.ts`
- `ExamLab/src/__tests__/media/mediaQuelleUrl.test.ts` → `packages/shared/src/utils/mediaQuelleUrl.test.ts`

- [ ] **Step 1.2.1: git mv aller 7 Media-Files**

```bash
git mv ExamLab/src/__tests__/media/MediaAnzeige.test.tsx        packages/shared/src/components/MediaAnzeige.test.tsx
git mv ExamLab/src/__tests__/media/MediaUpload.test.tsx         packages/shared/src/components/MediaUpload.test.tsx
git mv ExamLab/src/__tests__/media/mediaQuelle.test.ts          packages/shared/src/types/mediaQuelle.test.ts
git mv ExamLab/src/__tests__/media/mediaQuelleBytes.test.ts     packages/shared/src/utils/mediaQuelleBytes.test.ts
git mv ExamLab/src/__tests__/media/mediaQuelleMigrator.test.ts  packages/shared/src/utils/mediaQuelleMigrator.test.ts
git mv ExamLab/src/__tests__/media/mediaQuelleResolver.test.ts  packages/shared/src/utils/mediaQuelleResolver.test.ts
git mv ExamLab/src/__tests__/media/mediaQuelleUrl.test.ts       packages/shared/src/utils/mediaQuelleUrl.test.ts
```

- [ ] **Step 1.2.2: Imports prüfen (sollten unverändert bleiben)**

Alle 7 Files importieren ausschließlich via `@shared/...`-Alias — Alias-Pfade bleiben gültig.

Run: `grep -rEn "from '\.\.|from '\./" packages/shared/src/components/MediaAnzeige.test.tsx packages/shared/src/components/MediaUpload.test.tsx packages/shared/src/types/mediaQuelle.test.ts packages/shared/src/utils/mediaQuelle*.test.ts`
Expected: 0 Treffer (alle Imports sind `@shared/...`).

- [ ] **Step 1.2.3: Vitest-Run für Task 1.2**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo`.

### Task 1.3: Regression-Tests in `src/tests/regression/` (2 Files)

**Files (Move):**
- `ExamLab/src/__tests__/regression/apiClient.test.ts` → `ExamLab/src/tests/regression/apiClient.test.ts`
- `ExamLab/src/__tests__/regression/securityInvarianten.test.ts` → `ExamLab/src/tests/regression/securityInvarianten.test.ts`

- [ ] **Step 1.3.1: Zielordner anlegen + git mv**

```bash
mkdir -p ExamLab/src/tests/regression
git mv ExamLab/src/__tests__/regression/apiClient.test.ts          ExamLab/src/tests/regression/apiClient.test.ts
git mv ExamLab/src/__tests__/regression/securityInvarianten.test.ts ExamLab/src/tests/regression/securityInvarianten.test.ts
```

- [ ] **Step 1.3.2: Imports prüfen (sollten unverändert bleiben)**

Beide Files importieren ausschließlich `from 'vitest'` — keine Source-Imports, alle Mocks via `vi.fn()`.

Run: `grep -E "^(from|import)" ExamLab/src/tests/regression/apiClient.test.ts ExamLab/src/tests/regression/securityInvarianten.test.ts`
Expected: nur Zeilen mit `from 'vitest'`.

- [ ] **Step 1.3.3: Vitest-Run für Task 1.3**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo`.

### Task 1.4: Helper + Helper-Test nach `src/test-helpers/` + Konsumenten-Rewrite

**Files (Move):**
- `ExamLab/src/__tests__/helpers/frageStorageMocks.ts` → `ExamLab/src/test-helpers/frageStorageMocks.ts`
- `ExamLab/src/__tests__/helpers/frageStorageMocks.test.ts` → `ExamLab/src/test-helpers/frageStorageMocks.test.ts`

**Files (Modify):**
- `ExamLab/src/hooks/useFragenAutoSave.test.tsx` (einziger ausserhalb-Konsument)

- [ ] **Step 1.4.1: Zielordner anlegen + git mv**

```bash
mkdir -p ExamLab/src/test-helpers
git mv ExamLab/src/__tests__/helpers/frageStorageMocks.ts       ExamLab/src/test-helpers/frageStorageMocks.ts
git mv ExamLab/src/__tests__/helpers/frageStorageMocks.test.ts  ExamLab/src/test-helpers/frageStorageMocks.test.ts
```

- [ ] **Step 1.4.2: Imports im Helper anpassen**

In `ExamLab/src/test-helpers/frageStorageMocks.ts` ersetzen:
- `from '../../types/fragen-storage'` → `from '../types/fragen-storage'` *(eine Tiefe weniger, weil aus `__tests__/helpers/` 2 Ebenen unter src auf `test-helpers/` 1 Ebene unter src gewandert)*
- `from '@shared/test-helpers/frageCoreMocks'` → unverändert (Alias).

Verifikation: `head -3 ExamLab/src/test-helpers/frageStorageMocks.ts` zeigt:
```
import type { Frage } from '../types/fragen-storage'
import { mockCoreFrage } from '@shared/test-helpers/frageCoreMocks'
```

- [ ] **Step 1.4.3: Imports im Helper-Test anpassen (sollte unverändert bleiben)**

`ExamLab/src/test-helpers/frageStorageMocks.test.ts` importiert `from './frageStorageMocks'` — relative-Import-Sibling, bleibt gültig nach gemeinsamer Bewegung. Keine Anpassung.

Verifikation: `head -2 ExamLab/src/test-helpers/frageStorageMocks.test.ts` zeigt `from './frageStorageMocks'`.

- [ ] **Step 1.4.4: Konsumenten-Rewrite in `useFragenAutoSave.test.tsx`**

In `ExamLab/src/hooks/useFragenAutoSave.test.tsx` ersetzen:
- `from '../__tests__/helpers/frageStorageMocks'` → `from '../test-helpers/frageStorageMocks'`

- [ ] **Step 1.4.5: Vollständiger grep-Sanity-Check**

Run: `grep -rn "frageStorageMocks" ExamLab/src --include='*.ts' --include='*.tsx'`
Expected: ausschließlich Treffer in `src/test-helpers/` und in `src/hooks/useFragenAutoSave.test.tsx` (Pfad zeigt auf `'../test-helpers/frageStorageMocks'`). Kein `__tests__/helpers/`-Treffer.

- [ ] **Step 1.4.6: Vitest-Run für Task 1.4**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo`.

### Task 1.5: Leeres `src/__tests__/` entfernen

- [ ] **Step 1.5.1: Verzeichnis-Inhalt prüfen**

Run: `find ExamLab/src/__tests__ -type f`
Expected: leer.

Run: `find ExamLab/src/__tests__ -type d`
Expected: nur `src/__tests__/`, `src/__tests__/helpers`, `src/__tests__/media`, `src/__tests__/regression` (alle leer).

- [ ] **Step 1.5.2: Leere Dirs entfernen (Git tracked nichts, aber filesystem aufräumen)**

```bash
rmdir ExamLab/src/__tests__/helpers ExamLab/src/__tests__/media ExamLab/src/__tests__/regression ExamLab/src/__tests__
```

Run: `ls ExamLab/src | grep __tests__ || echo "OK"`
Expected: `OK`.

### Task 1.6: tsc + commit Phase 1

- [ ] **Step 1.6.1: tsc -b Final-Run**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -5`
Expected: keine Error-Zeilen.

- [ ] **Step 1.6.2: Pre-Commit-Tests**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo`.

- [ ] **Step 1.6.3: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Bundle Q Phase 1: src/__tests__/ Hauptmasse bewegen (17 Files)

- 6 Direkt-Colocation: fachUtils, gefaessUtils, masteryRecency,
  schulConfig→schulConfigStore, sichtbareTypen, themenSichtbarkeit
- 7 Shared-Tests nach packages/shared/src/{components,types,utils}/
  (alle via @shared/-Alias, keine Import-Änderungen)
- 2 Regression-Tests nach src/tests/regression/ (vi.fn-only,
  keine Import-Änderungen)
- Helper + Helper-Test nach src/test-helpers/ (1 Helper-internal
  ../../types-Pfad auf ../types verkürzt)
- Konsument useFragenAutoSave.test.tsx auf neuen Helper-Pfad

vitest: 1234 passed (Baseline gehalten).
EOF
)"
```

---

## Phase 2 — Commit 2: `components/__tests__/`-Subdirs auflösen

### Task 2.1: 2 Component-Tests bewegen + Imports anpassen

**Files (Move):**
- `ExamLab/src/components/__tests__/Startbildschirm.test.tsx` → `ExamLab/src/components/Startbildschirm.test.tsx`
- `ExamLab/src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx` → `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.test.tsx`

- [ ] **Step 2.1.1: git mv beider Files**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git mv ExamLab/src/components/__tests__/Startbildschirm.test.tsx                            ExamLab/src/components/Startbildschirm.test.tsx
git mv ExamLab/src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx     ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.test.tsx
```

- [ ] **Step 2.1.2: Imports anpassen — `Startbildschirm.test.tsx`**

In `ExamLab/src/components/Startbildschirm.test.tsx` ersetzen:
- `from '../Startbildschirm.tsx?raw'` → `from './Startbildschirm.tsx?raw'`

- [ ] **Step 2.1.3: Imports anpassen — `DurchfuehrenDashboard.test.tsx`**

In `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.test.tsx` ersetzen:
- `from '../DurchfuehrenDashboard.tsx?raw'` → `from './DurchfuehrenDashboard.tsx?raw'`

Weitere relative Imports (falls vorhanden, z.B. auf Stores oder Utils): Tiefe-Erhöhung um 1 zurücknehmen — `from '../../X'` → `from '../X'` etc. Vorgehen: `grep -nE "from '\.\." ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.test.tsx`, jede `../`-Stufe um 1 reduzieren.

Verifikation pro File: `head -10 <file>` zeigt korrigierte Pfade.

### Task 2.2: Leere `__tests__/`-Dirs entfernen

- [ ] **Step 2.2.1: Beide Dirs prüfen + entfernen**

```bash
find ExamLab/src/components/__tests__ ExamLab/src/components/lp/durchfuehrung/__tests__ -type f
# Expected: leer.
rmdir ExamLab/src/components/__tests__ ExamLab/src/components/lp/durchfuehrung/__tests__
```

Run: `find ExamLab/src -type d -name __tests__`
Expected: leer (0 Treffer).

### Task 2.3: tsc + Tests + commit Phase 2

- [ ] **Step 2.3.1: tsc -b**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -5`
Expected: keine Error-Zeilen.

- [ ] **Step 2.3.2: Tests**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo`.

- [ ] **Step 2.3.3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Bundle Q Phase 2: components/__tests__/-Subdirs auflösen (2 Files)

- Startbildschirm.test.tsx neben Startbildschirm.tsx colocated
- DurchfuehrenDashboard.test.tsx neben Source colocated
- Beide ?raw-Imports auf './X.tsx?raw' korrigiert
- Leere __tests__/-Dirs entfernt

Damit 0 __tests__/-Verzeichnisse unter ExamLab/src/.
vitest: 1234 passed (Baseline gehalten).
EOF
)"
```

---

## Phase 3 — Commit 3: Gate-Skript + Doku + CI

### Task 3.1: Audit-Skript schreiben

**Files (Create):**
- `scripts/audit-test-locations.sh`

- [ ] **Step 3.1.1: Skript erstellen**

Inhalt von `scripts/audit-test-locations.sh`:

```bash
#!/usr/bin/env bash
# Audit-Skript: kein __tests__/-Verzeichnis im Source-Tree.
#
# Hintergrund: Bundle Q (2026-05) — Test-Layer-Strategie konsolidiert.
# Tests sind colocated *.test.{ts,tsx} oder in src/tests/ resp.
# src/tests/regression/. __tests__/-Wrapper-Ordner sind retired.
#
# Aufruf: ./scripts/audit-test-locations.sh [--strict]
#   --strict: exit 1 wenn Treffer > 0 (CI-Gate).
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ROOTS=(
  "ExamLab/src"
  "packages/shared/src"
)

strict=false
[ "${1:-}" = "--strict" ] && strict=true

found=0
for root in "${ROOTS[@]}"; do
  if [ -d "$root" ]; then
    matches=$(find "$root" -type d -name "__tests__" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      while IFS= read -r dir; do
        echo "FAIL: $dir"
        found=$((found + 1))
      done <<< "$matches"
    fi
  fi
done

if [ "$found" -gt 0 ]; then
  echo ""
  echo "Treffer: $found __tests__/-Verzeichnis(se)."
  echo "Siehe .claude/rules/code-quality.md → Test-Layer-Strategie."
  if $strict; then
    exit 1
  fi
else
  echo "OK: keine __tests__/-Verzeichnisse gefunden."
fi
```

- [ ] **Step 3.1.2: Ausführbar machen**

```bash
chmod +x scripts/audit-test-locations.sh
```

- [ ] **Step 3.1.3: Lokal testen (sollte grün sein, weil Phase 1+2 alle entfernt haben)**

Run: `./scripts/audit-test-locations.sh --strict`
Expected: `OK: keine __tests__/-Verzeichnisse gefunden.` und exit 0.

- [ ] **Step 3.1.4: Negativ-Test (optional aber empfohlen)**

```bash
mkdir -p /tmp/q-test/ExamLab/src/__tests__
cd /tmp/q-test
"/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/scripts/audit-test-locations.sh" --strict
```
Expected: `FAIL: ExamLab/src/__tests__` und exit 1.

```bash
rm -rf /tmp/q-test
```

### Task 3.2: package.json — npm-Script

**Files (Modify):**
- `ExamLab/package.json`

- [ ] **Step 3.2.1: Script-Zeile hinzufügen**

In `ExamLab/package.json` neben der bestehenden Zeile `"lint:as-any": "../scripts/audit-as-any.sh --strict"` ergänzen:

```json
"lint:no-tests-dir": "../scripts/audit-test-locations.sh --strict"
```

(Kommata beachten — JSON-syntaktisch korrekt einfügen.)

- [ ] **Step 3.2.2: npm-Script testen**

Run: `cd ExamLab && npm run lint:no-tests-dir`
Expected: `OK: keine __tests__/-Verzeichnisse gefunden.` und exit 0.

### Task 3.3: code-quality.md — Test-Layer-Strategie

**Files (Modify):**
- `.claude/rules/code-quality.md`

- [ ] **Step 3.3.1: Sektion am Ende des Files anhängen**

An `.claude/rules/code-quality.md` (am Ende, nach letztem `##`-Heading) ergänzen:

````markdown

## Test-Layer-Strategie

Drei Test-Schichten, jeweils klarer Ort:

| Schicht | Ort | Wann |
|---|---|---|
| **Unit** | colocated `*.test.{ts,tsx}` neben der Source-Datei | Test deckt eine einzelne Funktion / Komponente / Hook ab, importiert primär aus einem Modul. |
| **Integration / Service** | flach in `ExamLab/src/tests/` | Test berührt mehrere Module, Stores oder Service-Calls; Cache-/Prefetch-Pattern; Skeleton/Latency-Tests. |
| **Regression** | `ExamLab/src/tests/regression/` | Test fixiert einen behobenen Incident (Datei-Header beschreibt Session/Bug). Soll nicht refactort werden. |

**Mock-Helpers:** unter `ExamLab/src/test-helpers/` (Storage-Frage-Mocks etc.) bzw. `packages/shared/src/test-helpers/` (Core-Frage-Mocks). Helper-Files selbst können colocated `.test.ts` haben.

**Verboten:** `__tests__/`-Verzeichnisse (Bundle Q, 2026-05). Gate: `npm run lint:no-tests-dir` (CI). Begründung: Heuristik B („Test wandert zur Source") braucht keinen Wrapper-Ordner — colocated `.test.{ts,tsx}` ist eindeutig. Subdir nur für die expliziten Layer oben.

**Heuristik bei neuem Test:**
1. Hat der Test eine 1:1-Source? → colocate.
2. Multi-Modul / Store-Reset / Service-Mock? → `src/tests/`.
3. Fixiert einen Incident mit Session/Bug-Bezug? → `src/tests/regression/`.
4. Testet `@shared/...`-Code? → colocate in `packages/shared/src/...`.
````

- [ ] **Step 3.3.2: Verifikation**

Run: `tail -25 .claude/rules/code-quality.md`
Expected: zeigt die neue Sektion.

### Task 3.4: deploy.yml — CI-Gate

**Files (Modify):**
- `.github/workflows/deploy.yml`

- [ ] **Step 3.4.1: Production-Pipeline-Step hinzufügen**

Direkt unter Zeile 53 (`run: npm run lint:as-any` im Production-Block) folgenden Step einfügen:

```yaml
      - name: Audit __tests__/ Directories (Bundle Q Gate)
        working-directory: ExamLab
        run: npm run lint:no-tests-dir
```

- [ ] **Step 3.4.2: Staging-Pipeline-Step hinzufügen**

Direkt unter dem Staging-Block-Step `run: npm run lint:as-any` (Zeile 103+), parallel mit der `if: steps.checkout-preview.outcome == 'success'`-Konvention, folgenden Step einfügen:

```yaml
      - name: Audit __tests__/ Directories (Bundle Q Gate, staging)
        if: steps.checkout-preview.outcome == 'success'
        working-directory: preview-src/ExamLab
        run: npm run lint:no-tests-dir
```

- [ ] **Step 3.4.3: YAML-Syntax verifizieren**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
Expected: kein Fehler.

### Task 3.5: tsc + Tests + commit Phase 3

- [ ] **Step 3.5.1: Tests + tsc**

Run:
```bash
cd ExamLab && npx tsc -b && npm test 2>&1 | tail -3
```
Expected: tsc clean + `Tests  1234 passed | 4 todo`.

- [ ] **Step 3.5.2: Beide Audit-Skripte grün**

Run:
```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-tests-dir
```
Expected: beide exit 0.

- [ ] **Step 3.5.3: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Bundle Q Phase 3: Gate-Skript + Doku + CI

- scripts/audit-test-locations.sh (analog zu audit-as-any.sh)
- ExamLab/package.json: lint:no-tests-dir Script
- .github/workflows/deploy.yml: 2× Gate-Step (production + staging)
- .claude/rules/code-quality.md: neue Sektion Test-Layer-Strategie
  (3 Schichten + Mock-Helper-Konvention + Heuristik bei neuem Test)

Damit ist Bundle Q strukturell durchgesetzt:
- 0 __tests__/-Dirs unter ExamLab/src und packages/shared/src
- CI fängt Regressionen ab (red bei Treffer)
- Doku ist Rule-File-Schicht (Reviewer-Subagents sehen sie automatisch)

vitest: 1234 passed.
EOF
)"
```

---

## Phase 4 — Commit 4: HANDOFF + Memory

### Task 4.1: HANDOFF.md aktualisieren

**Files (Modify):**
- `ExamLab/HANDOFF.md`

- [ ] **Step 4.1.1: Neuer Eintrag oben**

In `ExamLab/HANDOFF.md` direkt nach dem Header `## Letzter Stand auf main` (vor dem Bundle-N+V-Eintrag) folgendes einfügen:

```markdown
### Bundle Q — Test-Verzeichnis-Konsolidierung ✅ MERGED (2026-05-06)

Merge-Commit `<TBD nach Merge>` auf `main`. Branch `refactor/bundle-q-tests-konsolidierung` lokal + remote gelöscht. 4 Sub-Commits. Drittes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). 19 Test-/Helper-Dateien aus 3 `__tests__/`-Verzeichnissen umverteilt nach Heuristik B („Test wandert zur Source"); CI-Gate `lint:no-tests-dir` analog zu `lint:as-any`.

**Audit-Token-Diff:**
| Dimension | vorher | nachher |
|---|---:|---:|
| `__tests__/`-Dirs unter `ExamLab/src` | 3 | 0 |
| `__tests__/`-Dirs unter `packages/shared/src` | 0 | 0 |
| Tests in `src/__tests__/`-Tree | 16 | 0 |
| Tests colocated in `src/utils/`, `src/store/`, `src/types/`, `src/components/` | (Baseline) | +9 |
| Tests in `packages/shared/src/{components,types,utils}/` | (Baseline) | +7 |
| Tests in `src/tests/regression/` | 0 | 2 |
| Files in `src/test-helpers/` | 0 | 2 |

**Sub-Commits:**
- `<hash1>` Phase 1: src/__tests__/-Hauptmasse (17 Files)
- `<hash2>` Phase 2: components/__tests__/-Subdirs (2 Files)
- `<hash3>` Phase 3: Gate-Skript + Doku + CI
- `<hash4>` Phase 4: HANDOFF + Memory

**Pre-Push-Verifikation:**
- vitest: 1234 passed | 4 todo (gleiche Baseline) ✅
- tsc -b: clean ✅
- npm run lint:as-any: 0 ✅ (Baseline gehalten)
- npm run lint:no-tests-dir: 0 ✅ (neu)
- find ExamLab/src packages/shared/src -type d -name __tests__: leer ✅

**Apps-Script-Deploy:** nicht nötig (test-/tooling-only).
**Kein Browser-E2E** (Audit-Klassifikation mech-rename-niedrig, keine Wire-Vertrag-/UI-Änderung).
```

(Hashes werden nach den jeweiligen Commits eingefügt; während Phase 4 sind nur Phasen 1-3 bekannt.)

- [ ] **Step 4.1.2: Sub-Commit-Hashes nachtragen**

Run: `git log --oneline -5 | head -5`
Trage die Hashes von Phase 1, 2, 3 in die Sub-Commits-Liste ein. Phase 4 bleibt mit `<TBD>`-Hash, weil es der aktuelle Commit ist.

### Task 4.2: Memory-Eintrag schreiben

**Files (Create):**
- `/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_q_tests_konsolidierung.md`

**Files (Modify):**
- `/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/MEMORY.md`

- [ ] **Step 4.2.1: Memory-File schreiben**

Inhalt:

```markdown
---
name: Bundle Q Test-Verzeichnis-Konsolidierung
description: ExamLab Bundle Q (2026-05-06) — __tests__/ retired, 19 Files colocated, CI-Gate lint:no-tests-dir aktiv
type: project
---

# Bundle Q — Test-Verzeichnis-Konsolidierung

**Datum:** 2026-05-06. Merge-Commit `<TBD>` auf main.

**Was:** Drittes Cleanup-Bundle aus Vereinfachungs-Audit (2026-05-05). 19 Test-/Helper-Files aus 3 `__tests__/`-Verzeichnissen verteilt nach Heuristik B („Test wandert zur Source").

**Lager:**
- 6 Direkt-Colocation in src/utils/, src/store/, src/types/
- 7 Shared-Tests in packages/shared/src/{components,types,utils}/
- 2 Regression-Tests in src/tests/regression/
- 2 Mock-Helpers in src/test-helpers/
- 2 Component-Tests neben ihrer Source

**Gate:** `npm run lint:no-tests-dir` (Bash-Skript scripts/audit-test-locations.sh, CI-Step in deploy.yml production+staging) — exit 1 bei jedem `__tests__/`-Dir unter ExamLab/src oder packages/shared/src. Pattern-konform mit lint:as-any (Bundle L).

**Doku:** Sektion „Test-Layer-Strategie" in `.claude/rules/code-quality.md` mit Heuristik-Tabelle (3 Schichten + Mock-Helper + Regeln).

**Test-Baseline:** 1234 vitest passes (gleich wie nach Bundle N+V).

**Why:** Cleanup nach Audit-Empfehlung A2.10. Drei parallele Test-Verzeichnisse mit überlappenden Zwecken machen Test-Layer-Entscheidung pro File schwammig — colocate-vs-`src/tests/`-Heuristik vereinheitlicht das.

**How to apply:** Bei neuen Tests Heuristik aus code-quality.md folgen. CI fängt `__tests__/`-Regressionen ab. Für Source-Splits (Bundle T später) gilt: Colocated-Test wandert mit der gesplitteten Source.
```

- [ ] **Step 4.2.2: MEMORY.md-Index ergänzen**

In `/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/MEMORY.md` in der ExamLab-Sektion (vor Bundle N+V-Zeile) folgende Zeile einfügen:

```markdown
- **[Bundle Q Test-Verzeichnis-Konsolidierung auf main](project_bundle_q_tests_konsolidierung.md)** — 2026-05-06 Merge `<TBD>`. Drittes Cleanup-Bundle. __tests__/ retired (3 Dirs → 0), 19 Files nach Heuristik B verteilt. CI-Gate lint:no-tests-dir analog lint:as-any. 1234 vitest. code-quality.md Sektion Test-Layer-Strategie ergänzt.
```

### Task 4.3: Phase 4 commit

- [ ] **Step 4.3.1: Final-Verifikation vor Commit**

Run:
```bash
cd ExamLab && npx tsc -b && npm test 2>&1 | tail -3 && cd .. && find ExamLab/src packages/shared/src -type d -name __tests__
```
Expected: tsc clean + 1234 passes + 0 `__tests__/`-Dirs.

- [ ] **Step 4.3.2: Commit**

```bash
git add ExamLab/HANDOFF.md
git -C "/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory" add MEMORY.md project_bundle_q_tests_konsolidierung.md 2>/dev/null || echo "(Memory-Dir nicht git-tracked — Files trotzdem geschrieben)"
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git commit -m "Bundle Q Phase 4: HANDOFF + Memory"
```

---

## Final Verification (vor PR / Merge)

- [ ] **Step F.1: Vollständige Test-Suite**

Run: `cd ExamLab && npm test 2>&1 | tail -3`
Expected: `Tests  1234 passed | 4 todo`.

- [ ] **Step F.2: tsc -b clean**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -5`
Expected: keine Error-Zeilen.

- [ ] **Step F.3: Build clean**

Run: `cd ExamLab && npm run build 2>&1 | tail -5`
Expected: build succeeded.

- [ ] **Step F.4: Beide Lint-Gates**

Run: `cd ExamLab && npm run lint:as-any && npm run lint:no-tests-dir`
Expected: beide exit 0.

- [ ] **Step F.5: __tests__/-Audit per find**

Run: `find ExamLab/src packages/shared/src -type d -name __tests__`
Expected: leer.

- [ ] **Step F.6: frageStorageMocks-Audit**

Run: `grep -rn "frageStorageMocks" ExamLab/src --include='*.ts' --include='*.tsx'`
Expected: ausschließlich Treffer in `ExamLab/src/test-helpers/` und `ExamLab/src/hooks/useFragenAutoSave.test.tsx` mit Pfad `'../test-helpers/frageStorageMocks'`.

- [ ] **Step F.7: Push + PR**

```bash
git push -u origin refactor/bundle-q-tests-konsolidierung
gh pr create --title "Bundle Q: __tests__/ retired (Test-Layer-Strategie)" --body "$(cat <<'EOF'
## Summary
- 19 Files aus 3 `__tests__/`-Verzeichnissen nach Heuristik B verteilt (colocate / `src/tests/regression/` / `packages/shared/`)
- `scripts/audit-test-locations.sh` + `npm run lint:no-tests-dir` + 2× CI-Gate (production + staging)
- Sektion „Test-Layer-Strategie" in `.claude/rules/code-quality.md`
- vitest 1234 passes (Baseline gehalten), 0 `__tests__/`-Dirs

Spec: [`docs/superpowers/specs/2026-05-06-bundle-q-tests-konsolidierung-design.md`](ExamLab/docs/superpowers/specs/2026-05-06-bundle-q-tests-konsolidierung-design.md)
Plan: [`docs/superpowers/plans/2026-05-06-bundle-q-tests-konsolidierung.md`](ExamLab/docs/superpowers/plans/2026-05-06-bundle-q-tests-konsolidierung.md)

## Test plan
- [x] vitest: 1234 passed | 4 todo
- [x] tsc -b clean
- [x] npm run build clean
- [x] npm run lint:as-any: 0
- [x] npm run lint:no-tests-dir: 0
- [x] `find ExamLab/src packages/shared/src -type d -name __tests__`: leer
- [ ] CI grün auf Branch (production-Job + staging-Job, beide mit lint:no-tests-dir-Gate)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step F.8: CI auf Branch verifizieren**

Run: `gh pr checks <PR#>` (oder via Browser).
Expected: alle Checks grün, insbesondere `Audit __tests__/ Directories (Bundle Q Gate)` in beiden Jobs.

---

## Out of Scope / Folge-Bundles

- **Bundle O — Store-Action-Naming-Vereinheitlichung** (parallel spielbar).
- **Bundle R — Error-Handling-Vereinheitlichung**.
- **Bundle P — `musterlosung` Field-Drift-Konsolidierung** (erhöhtes Risiko).
- **Bundle S/T — Datei-Hotspots-Splits**.

Reihenfolge gemäss Audit-Roadmap.
