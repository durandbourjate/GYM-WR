# Bundle P-Doku — `musterlosung` Field-Drift Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den `musterlosung`/`musterloesung`/`musterLoesung`-Field-Drift in der Codebase dokumentieren und via CI-Gate einfrieren — ohne Source-Code- oder Backend-Änderung.

**Architecture:** Bash-Audit-Skript mit per-Token-Baseline (analog `audit-as-any.sh`), npm-Script + GitHub-Actions-Gates auf Production+Staging, und eine neue Sektion „Field-Drift: Musterlösung" in `.claude/rules/code-quality.md`.

**Tech Stack:** Bash 3.2+ (kompatibel zu macOS-default — keine `declare -A`-Maps; parallele Arrays analog `audit-as-any.sh`), GitHub Actions YAML, npm scripts (ExamLab-Subpackage), Markdown.

**Spec:** [`docs/superpowers/specs/2026-05-06-bundle-p-musterloesung-doku-design.md`](../specs/2026-05-06-bundle-p-musterloesung-doku-design.md)

**Branch:** `feature/bundle-p-musterloesung-doku` (existiert bereits, Spec-Commit `f3fca90`)

---

## Datei-Inventar

| Datei | Operation | Lines |
|---|---|---:|
| `scripts/audit-musterloesung.sh` | NEU + chmod +x | ~80 |
| `ExamLab/package.json` | EDIT (1 Script-Eintrag) | +1 |
| `.github/workflows/deploy.yml` | EDIT (2 Steps) | +10 |
| `.claude/rules/code-quality.md` | EDIT (neue Sektion) | ~60 |
| `ExamLab/HANDOFF.md` | EDIT (neuer Bundle-Eintrag) | ~10 |

Reihenfolge: Skript zuerst (lokal verifizierbar) → npm-Script → CI-Gate → Doku → HANDOFF → Verify-Suite → Merge.

---

## Phase 1 — Audit-Skript

### Task 1.1: Baseline-Counts re-verifizieren

**Files:** keine (read-only)

- [ ] **Step 1:** Aus Repo-Root die Counts erneut messen — sie können sich seit Spec-Schreibung verschoben haben:

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
SOURCES=("ExamLab/src" "packages/shared/src" "ExamLab/apps-script-code.js")
for token in "musterlosung" "Musterlosung" "musterloesung" "Musterloesung" "musterLoesung" "MusterLoesung"; do
  count=$(grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' "\b$token\b" "${SOURCES[@]}" 2>/dev/null \
    | grep -vE "^[^:]+:[0-9]+:[[:space:]]*(//|/\*|\*)" | wc -l | xargs)
  echo "$token: $count"
done
```

**Erwartet (Stand Spec rev2):**
```
musterlosung: 295
Musterlosung: 0
musterloesung: 70
Musterloesung: 14
musterLoesung: 12
MusterLoesung: 0
```

Wenn die Counts abweichen: die Skript-Baseline aus Task 1.2 mit den **aktuellen** Werten füllen, NICHT mit den Spec-Werten.

### Task 1.2: Skript schreiben

**Files:**
- Create: `scripts/audit-musterloesung.sh`

- [ ] **Step 1:** Skript-Datei mit folgendem Inhalt anlegen (Baseline-Werte aus Task 1.1 verwenden — falls verifiziert sind die Spec-Werte korrekt):

```bash
#!/usr/bin/env bash
# Audit-Skript für `musterlosung`/`musterloesung`/`musterLoesung`-Field-Drift.
#
# Hintergrund: Das Musterlösungs-Konzept hat aus historischen Gründen drei
# Identifier-Lager im Code (siehe `.claude/rules/code-quality.md`, Sektion
# "Field-Drift: Musterlösung"):
#   - Lager 1 — Backend-Vertrag: `musterlosung` (no `e`)
#   - Lager 2 — Frontend-Drift:  `musterloesung*` (mit `e`, lowercase)
#   - Lager 3 — CodeFrage:        `musterLoesung` (mit `e`, mixed-case)
# Plus PascalCase-Treffer (UI-Strings + JSX-Comments — kein Identifier-Lager,
# aber via Baseline gelockt).
#
# Aufruf: ./scripts/audit-musterloesung.sh [--strict]
#   --strict: exit 1 wenn ein Token-Count über Baseline (CI-Gate).
#
# Baseline-Werte stammen aus
# `docs/superpowers/specs/2026-05-06-bundle-p-musterloesung-doku-design.md`,
# Sektion 4 (Drift-Inventar). Bei Bundle P-Migration neu setzen.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SOURCES=(
  ExamLab/src
  packages/shared/src
  ExamLab/apps-script-code.js
)

# Parallele Arrays statt `declare -A` (bash 3.2 macOS-kompatibel, analog audit-as-any.sh).
TOKENS=(
  "musterlosung"
  "Musterlosung"
  "musterloesung"
  "Musterloesung"
  "musterLoesung"
  "MusterLoesung"
)
BASELINES=(295 0 70 14 12 0)

# Counts werden parallel zu TOKENS in COUNTS[] geschrieben.
COUNTS=()
DRIFT_INDICES=()

for i in "${!TOKENS[@]}"; do
  token="${TOKENS[$i]}"
  baseline="${BASELINES[$i]}"
  hits=$(grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' "\b$token\b" "${SOURCES[@]}" 2>/dev/null \
    | grep -vE "^[^:]+:[0-9]+:[[:space:]]*(//|/\*|\*)" || true)
  if [[ -z "$hits" ]]; then
    count=0
  else
    count=$(echo "$hits" | grep -c . || true)
  fi
  COUNTS+=("$count")
  if [[ "$count" -gt "$baseline" ]]; then
    DRIFT_INDICES+=("$i")
  fi
done

echo "musterloesung-Audit:"
printf "  %-20s %6s %10s   %s\n" "Token" "Count" "Baseline" "Status"
for i in "${!TOKENS[@]}"; do
  token="${TOKENS[$i]}"
  count="${COUNTS[$i]}"
  baseline="${BASELINES[$i]}"
  status="OK"
  if [[ "$count" -gt "$baseline" ]]; then
    status="DRIFT +$(( count - baseline ))"
  elif [[ "$count" -lt "$baseline" ]]; then
    status="UNDER -$(( baseline - count ))"
  fi
  printf "  %-20s %6d %10d   %s\n" "$token" "$count" "$baseline" "$status"
done

if [[ "${#DRIFT_INDICES[@]}" -gt 0 ]]; then
  echo ""
  echo "Drift erkannt: ${#DRIFT_INDICES[@]} Token über Baseline."
  if [[ "${1:-}" == "--strict" ]]; then
    echo ""
    echo "Verbose-Treffer (max 20 pro Drift-Token):"
    for i in "${DRIFT_INDICES[@]}"; do
      token="${TOKENS[$i]}"
      echo "  --- $token ---"
      grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' "\b$token\b" "${SOURCES[@]}" 2>/dev/null \
        | grep -vE "^[^:]+:[0-9]+:[[:space:]]*(//|/\*|\*)" \
        | head -20
    done
    echo ""
    echo "FAIL: ${#DRIFT_INDICES[@]} Token über Baseline."
    exit 1
  fi
else
  echo ""
  echo "OK: alle Tokens auf oder unter Baseline."
fi
```

- [ ] **Step 2:** Executable machen.

```bash
chmod +x scripts/audit-musterloesung.sh
```

### Task 1.3: Skript ohne Argumente testen

**Files:** keine

- [ ] **Step 1:** Skript ausführen und Output prüfen.

```bash
bash scripts/audit-musterloesung.sh
```

**Erwartet:** Tabelle mit 6 Zeilen, alle Tokens auf Status `OK`, Schluss-Zeile `OK: alle Tokens auf oder unter Baseline.`, Exit-Code 0.

```
musterloesung-Audit:
  Token                 Count   Baseline   Status
  musterlosung            295        295   OK
  Musterlosung              0          0   OK
  musterloesung            70         70   OK
  Musterloesung            14         14   OK
  musterLoesung            12         12   OK
  MusterLoesung             0          0   OK

OK: alle Tokens auf oder unter Baseline.
```

- [ ] **Step 2:** Exit-Code prüfen.

```bash
echo $?
```

**Erwartet:** `0`.

### Task 1.4: Skript mit `--strict` testen (kein Drift)

**Files:** keine

- [ ] **Step 1:** Skript mit Strict-Flag ausführen.

```bash
bash scripts/audit-musterloesung.sh --strict
echo "exit=$?"
```

**Erwartet:** Gleiche Tabelle wie Task 1.3, Exit `exit=0`.

### Task 1.5: Drift-Injection-Test

**Files:**
- Temporary: `ExamLab/src/__drift_test_p.ts` (wird wieder gelöscht)

- [ ] **Step 1:** Künstliches Drift-File anlegen — eine `musterloesung*`- und eine `musterLoesung`-Stelle.

```bash
cat > ExamLab/src/__drift_test_p.ts <<'EOF'
// Drift-Test (wird gelöscht). Erzeugt 1× musterloesung + 1× musterLoesung.
const musterloesungDrift = 0
const musterLoesungDrift = 0
export { musterloesungDrift, musterLoesungDrift }
EOF
```

- [ ] **Step 2:** Skript mit `--strict` ausführen, Exit muss 1 sein.

```bash
bash scripts/audit-musterloesung.sh --strict
echo "exit=$?"
```

**Erwartet:** Tabelle zeigt `musterloesung` mit Count = Baseline+1 und Status `DRIFT +1`, `musterLoesung` mit Count = Baseline+1 und Status `DRIFT +1`. Verbose-Block listet das `__drift_test_p.ts`-File. Schluss `FAIL: 2 Token über Baseline.`, `exit=1`.

- [ ] **Step 3:** Drift-File wieder löschen.

```bash
rm ExamLab/src/__drift_test_p.ts
```

- [ ] **Step 4:** Skript erneut prüfen — wieder grün.

```bash
bash scripts/audit-musterloesung.sh --strict
echo "exit=$?"
```

**Erwartet:** Alle Tokens `OK`, `exit=0`.

### Task 1.6: Phase-1-Commit

- [ ] **Step 1:** Auf Branch sicher sein.

```bash
git branch --show-current
```

**Erwartet:** `feature/bundle-p-musterloesung-doku`.

- [ ] **Step 2:** Skript stagen + committen.

```bash
git add scripts/audit-musterloesung.sh
git commit -m "$(cat <<'EOF'
Bundle P-Doku Phase 1: Audit-Skript audit-musterloesung.sh

Per-Token-Baseline für 6 Schreibweisen (musterlosung,
Musterlosung, musterloesung, Musterloesung, musterLoesung,
MusterLoesung). --strict-Modus für CI-Gate. Lokal verifiziert
(no-args, --strict, Drift-Injection).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — npm-Script + CI-Gate

### Task 2.1: `lint:musterloesung` zu `ExamLab/package.json`

**Files:**
- Modify: `ExamLab/package.json`

- [ ] **Step 1:** Den `scripts`-Block in `ExamLab/package.json` lesen, um die exakte Position der bestehenden `lint:*`-Einträge zu finden.

```bash
grep -n "lint:" ExamLab/package.json
```

**Erwartet (Stand vor Bundle P-Doku):**
```
"lint:as-any": "../scripts/audit-as-any.sh --strict",
"lint:no-alert": "../scripts/audit-no-alert.sh --strict",
"lint:no-tests-dir": "../scripts/audit-test-locations.sh --strict",
```

- [ ] **Step 2:** Neuen Eintrag einfügen — alphabetisch zwischen `lint:as-any` und `lint:no-alert`. Mit Edit-Tool die genaue Zeile ersetzen:

OLD:
```json
    "lint:as-any": "../scripts/audit-as-any.sh --strict",
    "lint:no-alert": "../scripts/audit-no-alert.sh --strict",
```

NEW:
```json
    "lint:as-any": "../scripts/audit-as-any.sh --strict",
    "lint:musterloesung": "../scripts/audit-musterloesung.sh --strict",
    "lint:no-alert": "../scripts/audit-no-alert.sh --strict",
```

- [ ] **Step 3:** Verifizieren, dass `package.json` valide JSON ist.

```bash
node -e "JSON.parse(require('fs').readFileSync('ExamLab/package.json', 'utf8'))" && echo "JSON valid"
```

**Erwartet:** `JSON valid`.

### Task 2.2: `npm run lint:musterloesung` testen

- [ ] **Step 1:** Aus `ExamLab/` ausführen.

```bash
cd ExamLab && npm run lint:musterloesung
echo "exit=$?"
cd ..
```

**Erwartet:** Tabelle wie Task 1.3 (alle OK), `exit=0`.

### Task 2.3: Production-Step in `.github/workflows/deploy.yml`

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1:** Den bestehenden Step `Audit __tests__/ Directories (Bundle Q Gate)` finden, um die Einfüge-Position zu identifizieren.

```bash
grep -n "Bundle Q Gate" .github/workflows/deploy.yml
```

**Erwartet:** 2 Treffer (Production + Staging).

- [ ] **Step 2:** Im Production-Block (nach `Audit __tests__/ Directories (Bundle Q Gate)`, vor `Run vitest`) den neuen Step einfügen. Edit-Tool:

OLD:
```yaml
      - name: Audit __tests__/ Directories (Bundle Q Gate)
        working-directory: ExamLab
        run: npm run lint:no-tests-dir

      - name: Run vitest
        working-directory: ExamLab
        run: npm test
```

NEW:
```yaml
      - name: Audit __tests__/ Directories (Bundle Q Gate)
        working-directory: ExamLab
        run: npm run lint:no-tests-dir

      - name: Audit musterloesung Field-Drift (Bundle P-Doku Gate)
        working-directory: ExamLab
        # --if-present: skipt sauber, falls Bundle P-Doku noch nicht auf main gemergt ist.
        # Sobald Bundle P-Doku auf main ist, aktiviert sich der Gate automatisch.
        run: npm run lint:musterloesung --if-present

      - name: Run vitest
        working-directory: ExamLab
        run: npm test
```

### Task 2.4: Staging-Step in `.github/workflows/deploy.yml`

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1:** Den Staging-Block-Step `Audit __tests__/ Directories (Bundle Q Gate, staging)` finden — er sollte ~60 Zeilen weiter unten sein, mit `if: steps.checkout-preview.outcome == 'success'`.

- [ ] **Step 2:** Edit-Tool einfügen:

OLD:
```yaml
      - name: Audit __tests__/ Directories (Bundle Q Gate, staging)
        if: steps.checkout-preview.outcome == 'success'
        working-directory: preview-src/ExamLab
        run: npm run lint:no-tests-dir

      - name: Run vitest (staging)
        if: steps.checkout-preview.outcome == 'success'
        working-directory: preview-src/ExamLab
        run: npm test
```

NEW:
```yaml
      - name: Audit __tests__/ Directories (Bundle Q Gate, staging)
        if: steps.checkout-preview.outcome == 'success'
        working-directory: preview-src/ExamLab
        run: npm run lint:no-tests-dir

      - name: Audit musterloesung Field-Drift (Bundle P-Doku Gate, staging)
        if: steps.checkout-preview.outcome == 'success'
        working-directory: preview-src/ExamLab
        run: npm run lint:musterloesung

      - name: Run vitest (staging)
        if: steps.checkout-preview.outcome == 'success'
        working-directory: preview-src/ExamLab
        run: npm test
```

### Task 2.5: YAML-Syntax verifizieren

- [ ] **Step 1:** Falls `python3` mit `yaml`-Modul verfügbar:

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML valid"
```

**Erwartet:** `YAML valid`. Falls Python+yaml fehlt: alternativ via Node.js:

```bash
node -e "const y=require('js-yaml'); y.load(require('fs').readFileSync('.github/workflows/deploy.yml','utf8'));" 2>&1 || echo "(js-yaml fehlt — visuell prüfen)"
```

Falls beides fehlt: visuell prüfen, dass die Einrückungs-Tiefe gleich wie umgebende Steps ist und keine Tabs verwendet werden.

### Task 2.6: Phase-2-Commit

- [ ] **Step 1:** Stagen + committen.

```bash
git add ExamLab/package.json .github/workflows/deploy.yml
git commit -m "$(cat <<'EOF'
Bundle P-Doku Phase 2: lint:musterloesung + CI-Gate

- ExamLab/package.json: neuer Script lint:musterloesung
- .github/workflows/deploy.yml: Production-Step (--if-present
  für chicken-and-egg) + Staging-Step (gegen preview-src)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Doku in `code-quality.md`

### Task 3.1: Sektion „Field-Drift: Musterlösung" einfügen

**Files:**
- Modify: `.claude/rules/code-quality.md`

- [ ] **Step 1:** Position finden — die neue Sektion kommt **nach** „Sprach-Konvention (Hybrid Deutsch/Englisch)" und **vor** „Test-Layer-Strategie". Die Trennlinie ist die Markdown-Zeile mit `## Test-Layer-Strategie`.

```bash
grep -n "^## Test-Layer-Strategie\|^## Sprach-Konvention" .claude/rules/code-quality.md
```

**Erwartet:** Beide Header sichtbar; die Sektion wird zwischen ihnen eingefügt.

- [ ] **Step 2:** Mit Edit-Tool die exakte Vorgänger-Zeile ersetzen — das Schluss-Triple-Backslash-N-Whatever-immediately-vor `## Test-Layer-Strategie` (oder die Zeile direkt davor) als `old_string`-Anker. Pragmatisch: den Anfang von `## Test-Layer-Strategie` als Anker und den neuen Block davor einfügen:

OLD:
```
## Test-Layer-Strategie
```

NEW:
```
## Field-Drift: Musterlösung

Das Musterlösungs-Konzept hat aus historischen Gründen drei Identifier-Lager im
Code. Diese sind eingefroren — nicht im laufenden Refactor anpacken; eine
Vereinheitlichung wäre Bundle P-Migration (Backend-Vertrag betroffen).

| Lager | Identifier | Wo | Warum |
|---|---|---|---|
| **Backend-Vertrag** | `musterlosung` (no `e`) | Sheet-Spalte; Default-Field auf `Frage`-Core (`fragen-core.ts:42, :400`) | Historischer Tippfehler-zur-Konvention erstarrt. Umbenennung erfordert Sheet-Migration. |
| **Bild/Annot-Drift** | `musterloesungBild`, `musterloesungAnnotationen` (mit `e`, lowercase) | `fragen-core.ts:176, :455, :549` | Sub-Felder die nicht direkt auf Sheet-Spalten mappen. Bewusst mit `e` als Frontend-Konvention. |
| **CodeFrage-Sub-Lager** | `musterLoesung` (mit `e`, mixed-case) | `fragen-core.ts:440, :663` (CodeFrage); `poolConverter/konvertiereStandard.ts:206` | Eigenständiger Frage-Typ. PascalCase-Drift gegen Lager 2 — unklarer Ursprung. |

**Regel für neue Felder:** Default ist Lager 1 (`musterlosung*`, no `e`). Lager 2
nur wenn explizit Frontend-only-Field ohne Sheet-Mapping. Lager 3 nicht
ausweiten.

> **Hinweis zu `Musterloesung` (PascalCase, mit `e`):** Diese Treffer sind
> UI-Strings und JSX-Comments (`{/* Musterloesung */}`), kein Identifier-Lager.
> Werden vom Audit-Skript trotzdem auf Baseline gelockt, damit neue Treffer
> bewusst geprüft werden.

**Regel für Refactor:** Innerhalb regulärer Bundles **nicht** umbenennen. Die
Vereinheitlichung läuft über Bundle P-Migration (separater Plan, Backend-Migration
nötig).

**CI-Gate:** `npm run lint:musterloesung` (Skript: `scripts/audit-musterloesung.sh`)
schlägt an, wenn ein Token über die Baseline wächst. Baseline wird aktualisiert,
wenn Bundle P-Migration läuft oder ein neues Lager bewusst hinzukommt (mit
Doku-Update).

## Test-Layer-Strategie
```

- [ ] **Step 3:** Verifizieren, dass die Sektion einmalig vorkommt und vor `## Test-Layer-Strategie` steht.

```bash
grep -n "^## Field-Drift: Musterlösung\|^## Test-Layer-Strategie" .claude/rules/code-quality.md
```

**Erwartet:** Genau 2 Treffer, in dieser Reihenfolge: erst `Field-Drift`, dann `Test-Layer-Strategie`.

### Task 3.2: Phase-3-Commit

- [ ] **Step 1:** Stagen + committen.

```bash
git add .claude/rules/code-quality.md
git commit -m "$(cat <<'EOF'
Bundle P-Doku Phase 3: Doku in code-quality.md

Neue Sektion "Field-Drift: Musterlösung" mit drei
Identifier-Lagern (Backend-Vertrag, Bild/Annot, CodeFrage),
PascalCase-Anti-Match-Hinweis, und Verweis auf CI-Gate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — HANDOFF + Final-Verify

### Task 4.1: Verify-Suite ausführen

**Files:** keine (read-only)

- [ ] **Step 1:** TypeScript-Build (CI-äquivalent) auf ExamLab.

```bash
cd ExamLab && npx tsc -b
echo "tsc exit=$?"
cd ..
```

**Erwartet:** `tsc exit=0`, kein Output (oder nur „building" ohne Fehler).

- [ ] **Step 2:** Vitest auf ExamLab.

```bash
cd ExamLab && npx vitest run
echo "vitest exit=$?"
cd ..
```

**Erwartet:** Alle Tests grün, `vitest exit=0`. Stand pre-Bundle: `1253 passes` (Bundle S.c-Stand).

- [ ] **Step 3:** Vite-Build auf ExamLab.

```bash
cd ExamLab && npm run build
echo "build exit=$?"
cd ..
```

**Erwartet:** Build erfolgreich, `build exit=0`.

- [ ] **Step 4:** Audit-Skript final laufen lassen (Doppel-Check post-Doku).

```bash
bash scripts/audit-musterloesung.sh --strict
echo "audit exit=$?"
```

**Erwartet:** Alle OK, `audit exit=0`.

### Task 4.2: HANDOFF.md aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1:** Existierenden HANDOFF-Eintrag-Stil prüfen (oben in der Datei).

```bash
head -40 ExamLab/HANDOFF.md
```

- [ ] **Step 2:** Einen neuen Bundle-P-Doku-Eintrag oben einfügen, im selben Stil wie die letzten Bundle-Einträge (Bundle S.c, S.b, etc.). Als Edit-Tool-Op: die existierende Top-Sektion-Marker (z.B. `## Aktuelle Arbeiten` oder die letzte Bundle-Header-Zeile) als Anker nehmen und davor einfügen. Inhalt:

```markdown
## Bundle P-Doku — `musterlosung` Field-Drift dokumentiert + eingefroren (2026-05-06)

**Status:** Branch `feature/bundle-p-musterloesung-doku`, bereit für Merge.

**Was:** Audit-Roadmap-Phase 3, Aufwärm-Bundle.
- `scripts/audit-musterloesung.sh` mit Per-Token-Baseline (6 Tokens)
- `lint:musterloesung` in `ExamLab/package.json`
- CI-Gate auf Production (`--if-present`) + Staging
- Sektion „Field-Drift: Musterlösung" in `.claude/rules/code-quality.md`

**Out of Scope:** Bundle P-Migration (Backend-Vertrag) — separates Bundle.

**Spec:** `docs/superpowers/specs/2026-05-06-bundle-p-musterloesung-doku-design.md`
**Plan:** `docs/superpowers/plans/2026-05-06-bundle-p-musterloesung-doku-plan.md`
```

- [ ] **Step 3:** Commit.

```bash
git add ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
Bundle P-Doku Phase 4: HANDOFF-Eintrag

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 4.3: Plan-Dokument committen

**Files:**
- Modify (already created in this session): `docs/superpowers/plans/2026-05-06-bundle-p-musterloesung-doku-plan.md`

- [ ] **Step 1:** Dieses Plan-Dokument selbst commiten (idealerweise war es schon vor Phase 1 gestaged; falls nicht, jetzt nachholen).

```bash
git add docs/superpowers/plans/2026-05-06-bundle-p-musterloesung-doku-plan.md 2>/dev/null || true
git diff --cached --name-only
```

Falls das Plan-Dokument noch nicht im Index ist:

```bash
git commit -m "Bundle P-Doku: Implementierungsplan

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 4.4: Branch pushen + CI abwarten

- [ ] **Step 1:** Branch zum Remote pushen.

```bash
git push -u origin feature/bundle-p-musterloesung-doku
```

- [ ] **Step 2:** CI-Run beobachten (URL aus push-Output oder via `gh`).

```bash
gh run list --branch feature/bundle-p-musterloesung-doku --limit 1
```

- [ ] **Step 3:** CI grün abwarten.

```bash
gh run watch
```

**Erwartet:** Beide Jobs (Production + Staging) grün. Falls Staging rot mit Bundle-Q-Lehre-Symptom (Step `Audit __tests__/ Directories (Bundle Q Gate, staging)` o.ä.): preview-Branch out-of-sync. Vor Merge mit `git push origin main:preview` synchronisieren (Task 5.2 deckt das ab).

---

## Phase 5 — Merge

### Task 5.1: Lokal alle Tests final wiederholen

- [ ] **Step 1:** Verify-Suite aus Task 4.1 erneut, falls zwischenzeitlich neue Commits.

```bash
bash scripts/audit-musterloesung.sh --strict && echo "audit OK"
cd ExamLab && npx tsc -b && npx vitest run && npm run build && cd ..
```

**Erwartet:** Alles grün.

### Task 5.2: Pre-Merge — Preview-FF-Bereitschaft prüfen

- [ ] **Step 1:** Preview vs main vergleichen.

```bash
git fetch origin
git log origin/preview ^origin/main --oneline
```

**Erwartet:** **leerer Output** (preview ist strikt hinter oder gleichauf mit main → FF-sicher). 

**Falls Treffer:** preview hat eigene Commits (Work-in-Progress). Force-Push-Regel: NICHT force-pushen. Stattdessen:
- Merge main in preview lokal: `git checkout preview && git merge origin/main && git push origin preview`
- ODER User fragen, wie verfahren werden soll.

### Task 5.3: Merge auf main

- [ ] **Step 1:** main aktualisieren + mergen (no-ff für klaren Merge-Commit).

```bash
git checkout main
git pull origin main
git merge --no-ff feature/bundle-p-musterloesung-doku -m "Merge Bundle P-Doku: musterlosung Field-Drift dokumentiert + eingefroren

CI-Gate lint:musterloesung aktiv. Spec + Plan in docs/superpowers/.
Backend-Migration als Bundle P-Migration reserviert."
```

- [ ] **Step 2:** main pushen.

```bash
git push origin main
```

- [ ] **Step 3:** Preview FF-pushen (Bundle Q Lehre).

```bash
git push origin main:preview
```

- [ ] **Step 4:** CI auf main beobachten.

```bash
gh run list --branch main --limit 1
gh run watch
```

**Erwartet:** Production-Job grün, Staging-Job grün (preview ist jetzt = main).

### Task 5.4: Cleanup

- [ ] **Step 1:** Lokalen Branch löschen.

```bash
git branch -d feature/bundle-p-musterloesung-doku
```

- [ ] **Step 2:** Remote-Branch löschen.

```bash
git push origin --delete feature/bundle-p-musterloesung-doku
```

- [ ] **Step 3:** Zwei Sentinels in Memory dokumentieren falls neue Lehren auftauchten (z.B. Bash-Edge-Case beim `declare -A`-Lookup, YAML-Indent-Fall). Falls keine neuen Lehren: nichts tun, Memory bleibt.

---

## Definition of Done (Sammel-Check)

- [ ] `scripts/audit-musterloesung.sh` existiert, executable, Per-Token-Baseline aus aktuellem Stand
- [ ] `lint:musterloesung` in `ExamLab/package.json`, alphabetisch korrekt einsortiert
- [ ] `.github/workflows/deploy.yml` hat 2 neue Steps (Production + Staging), korrekt eingerückt
- [ ] Sektion „Field-Drift: Musterlösung" in `.claude/rules/code-quality.md`, zwischen Sprach-Konvention und Test-Layer-Strategie
- [ ] Lokale Tests aus Task 4.1 alle grün
- [ ] HANDOFF.md aktualisiert
- [ ] Branch-CI grün
- [ ] `git log origin/preview ^origin/main --oneline` leer vor Merge
- [ ] main + preview gepusht, CI auf main grün
- [ ] Branch lokal + remote gelöscht
