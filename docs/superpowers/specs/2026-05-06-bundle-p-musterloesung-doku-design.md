# Bundle P-Doku — `musterlosung` Field-Drift dokumentieren + einfrieren

**Datum:** 2026-05-06
**Status:** Draft (vor Spec-Review)
**Bezug:** [`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md), Sektion A4.2 + Roadmap-Bundle-P

## 1. Kontext

Der ExamLab-Vereinfachungs-Audit (2026-05-05) hat in `packages/shared/src/types/fragen-core.ts` drei Schreibweisen für das Musterlösungs-Konzept identifiziert:

- `musterlosung` (no `e`, lowercase) — Backend-Vertrag, Sheet-Spalte heisst so
- `musterloesung` (mit `e`, lowercase) — Frontend-Felder für Bild/PDF-Annot
- `musterLoesung` (mit `e`, mixed-case) — CodeFrage-spezifisch

Der Audit empfiehlt eine **Doku-Variante** als Aufwärm-Bundle: Status quo
einfrieren, ohne Code/Backend-Migration anzufassen. Die Backend-Vertrag-berührende
Migration wird als separates Bundle (Bundle P-Migration) reserviert.

Phase 1 (Bundle M, N+V, Q) und Phase 2 (Bundle O, R, S) sind auf `main`. Bundle
P-Doku startet Phase 3.

## 2. Ziel

Das tatsächliche Drift-Bild **dokumentieren** (was heisst wo wie und warum) und
**technisch einfrieren** (CI-Gate verhindert neue Drift), ohne Source-Code-Felder
oder Backend-Verträge anzufassen.

## 3. Scope

### In Scope

- Neue Sektion „Field-Drift: Musterlösung" in `.claude/rules/code-quality.md`
- Neues Skript `scripts/audit-musterloesung.sh` (analog `audit-as-any.sh`)
- Neuer npm-Script `lint:musterloesung` in `ExamLab/package.json`
- CI-Gate-Eintrag in `.github/workflows/deploy.yml` (Production + Staging)
- HANDOFF-Eintrag

### Out of Scope

- Umbenennung von Fields in `fragen-core.ts` (= Bundle P-Migration)
- Umbenennung von Apps-Script-Sheet-Spalten (= Bundle P-Migration)
- Migration der existierenden `musterloesung*` / `musterLoesung`-Frontend-Felder
- Verhaltensänderungen, Render-Pfade, Korrektur-Logik
- E2E-Browser-Test (kein Wire-Effekt)

## 4. Drift-Inventar (Faktenbasis für die Doku)

Stand 2026-05-06, gemessen via `\b<token>\b` (case-sensitive Word-Boundary) auf
`ExamLab/src/`, `packages/shared/src/`, `ExamLab/apps-script-code.js`, exklusive
reiner Comment-Lines:

| Token | Count | Lager | Beispiel-Pfade |
|---|---:|---|---|
| `musterlosung` | 295 | Backend-Vertrag (Sheet-Spalte, Frage-Field default) | `fragen-core.ts:42`, Apps-Script-Code |
| `Musterlosung` | 0 | — | (keine Treffer) |
| `musterloesung` | 70 | Frontend-Drift (Bild, PDF-Annot, UI-Comments) | `fragen-core.ts:176` `musterloesungBild?`, `:549` `musterloesungAnnotationen?` |
| `Musterloesung` | 14 | Anti-Match (UI-Strings, JSX-Comments — kein Identifier-Lager) | `BerechnungFrage.tsx:236` `{/* Musterloesung */}` |
| `musterLoesung` | 12 | CodeFrage-Sub-Lager | `fragen-core.ts:440`, `:663`, `poolConverter/konvertiereStandard.ts:206` |
| `MusterLoesung` | 0 | — | (keine Treffer) |

Drei „echte" Identifier-Lager: **Backend-Vertrag** (`musterlosung*`),
**Bild/Annot-Drift** (`musterloesung*`), **CodeFrage-Sub-Lager** (`musterLoesung`).
Die `Musterloesung`-PascalCase-Treffer sind hauptsächlich JSX-Comments und nicht
Field-Drift im engen Sinne — werden vom Skript trotzdem gegen Baseline gelockt
(jede neue Ergänzung muss bewusst sein).

## 5. Deliverable 1 — Doku in `code-quality.md`

Neue Sektion nach „Sprach-Konvention (Hybrid Deutsch/Englisch)", vor
„Test-Layer-Strategie". Inhalt:

### Field-Drift: Musterlösung

Das Musterlösungs-Konzept hat aus historischen Gründen drei Identifier-Lager im
Code. Diese sind eingefroren — nicht im laufenden Refactor anpacken; eine
Vereinheitlichung wäre Bundle P-Migration (Backend-Vertrag betroffen).

| Lager | Identifier | Wo | Warum |
|---|---|---|---|
| **Backend-Vertrag** | `musterlosung` (no `e`) | Sheet-Spalte; Default-Field auf `Frage`-Core (z.B. `fragen-core.ts:42, :400`) | Historischer Tippfehler-zur-Konvention erstarrt. Umbenennung erfordert Sheet-Migration. |
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

## 6. Deliverable 2 — `scripts/audit-musterloesung.sh`

Bash-Skript analog `scripts/audit-as-any.sh`. Konkrete Anforderungen:

### 6.1 Inputs / Sources

```
SOURCES=(
  ExamLab/src
  packages/shared/src
  ExamLab/apps-script-code.js
)
```

### 6.2 Tokens + Baseline

Pro Token getrennter Counter mit fest einkodierter Baseline (aus Sektion 4):

```bash
declare -A BASELINE=(
  ["musterlosung"]=295
  ["Musterlosung"]=0
  ["musterloesung"]=70
  ["Musterloesung"]=14
  ["musterLoesung"]=12
  ["MusterLoesung"]=0
)
```

### 6.3 Match-Regel

- Word-Boundary case-sensitive: `\b<token>\b`
- Glob: `*.ts`, `*.tsx`, `*.js`
- Filter: Comment-Only-Zeilen (Pattern `^[^:]+:[0-9]+:\s*(//|/\*|\*)`) ausschliessen — analog audit-as-any
- Ausgenommene Pfade: `node_modules/`, `dist/`, `.git/`, `docs/`, das Skript selbst (`scripts/audit-musterloesung.sh`)

### 6.4 Aufruf-Modi

- `./scripts/audit-musterloesung.sh` — Tabelle ausgeben, Exit 0 (Drift-Detector-Mode für lokale Inspektion)
- `./scripts/audit-musterloesung.sh --strict` — Exit 1 wenn ein Token > Baseline (CI-Gate-Mode)

### 6.5 Output-Format

Format-String-Pattern 1:1 aus `audit-as-any.sh` übernehmen (`printf "%-20s %5d %5d  %s\n"` o.ä.), damit das Skript-Look konsistent bleibt.

```
musterloesung-Audit:
  Token             Count   Baseline   Status
  musterlosung      295     295        OK
  Musterlosung      0       0          OK
  musterloesung     70      70         OK
  Musterloesung     14      14         OK
  musterLoesung     12      12         OK
  MusterLoesung     0       0          OK

OK: alle Tokens auf Baseline.
```

Bei `--strict` und Drift:

```
FAIL: 1 Token über Baseline.
  musterloesung: Count=72 > Baseline=70 (Drift +2)

Verbose-Treffer (max 20):
  packages/shared/src/types/fragen-core.ts:801: musterloesungNeuesFeld?: string
  ...
```

### 6.6 Edge Cases

- **Baseline-Update bei Bundle P-Migration:** Skript-Header dokumentiert kurz, dass die Baseline-Zahlen aus `docs/superpowers/specs/2026-05-06-bundle-p-musterloesung-doku-design.md` stammen und bei Bundle P-Migration neu zu setzen sind.
- **Refactor-Reduktion:** Wenn Count *unter* Baseline fällt (z.B. ein Field wird gelöscht), schlägt das Skript NICHT an. Das ist Verhalten aus `audit-as-any.sh` und erlaubt sukzessive Reduktion. Baseline wird per Hand nachgezogen, wenn Bundle P-Migration ein Sub-Bundle abschliesst.

## 7. Deliverable 3 — `package.json` + CI-Gate

### 7.1 `ExamLab/package.json`

Neuer Eintrag in `scripts`, alphabetisch nach den anderen `lint:*`:

```json
"lint:musterloesung": "../scripts/audit-musterloesung.sh --strict",
```

### 7.2 `.github/workflows/deploy.yml`

Production-Block (analog Bundle R `--if-present`-Pattern für chicken-and-egg):

```yaml
- name: Audit musterloesung Field-Drift (Bundle P-Doku Gate)
  working-directory: ExamLab
  # --if-present: skipt sauber, falls Bundle P-Doku noch nicht auf main gemergt ist.
  # Sobald Bundle P-Doku auf main ist, aktiviert sich der Gate automatisch.
  run: npm run lint:musterloesung --if-present
```

Position: nach Step `Audit __tests__/ Directories (Bundle Q Gate)`, vor Step `Run vitest`. (Step-Namen statt Zeilennummern, weil deploy.yml zwischen Spec und Implementation editiert werden kann.)

Staging-Block (analog Bundle Q): denselben Step mit `if: steps.checkout-preview.outcome == 'success'` und ohne `--if-present` einbauen — preview wird vor Merge auf den main-Stand gezogen (FF-Push aus deployment-workflow-Regel).

```yaml
- name: Audit musterloesung Field-Drift (Bundle P-Doku Gate, staging)
  if: steps.checkout-preview.outcome == 'success'
  working-directory: preview-src/ExamLab
  run: npm run lint:musterloesung
```

Position: nach Step `Audit __tests__/ Directories (Bundle Q Gate, staging)`, vor Step `Run vitest (staging)`.

## 8. Test-Plan

Reine Doku + Skript ohne Wire-Effekt; Browser-E2E ist nicht Teil des Bundles.
Lokale Verifikation:

| # | Was | Erwartung |
|---|---|---|
| 1 | `bash scripts/audit-musterloesung.sh` aus Repo-Root | Tabelle, Exit 0, alle Tokens auf Baseline |
| 2 | `bash scripts/audit-musterloesung.sh --strict` aus Repo-Root | Exit 0 |
| 3 | `cd ExamLab && npm run lint:musterloesung` | Exit 0 |
| 4 | Künstlich Drift erzeugen (`echo "const musterloesungTest = 0;" >> ExamLab/src/dummy.ts`), Skript laufen lassen | Exit 1, FAIL-Message zeigt Drift-Token korrekt; danach revert |
| 5 | `npx tsc -b` (im ExamLab) | Grün — keine Code-Änderung |
| 6 | `npx vitest run` (im ExamLab) | Grün — keine Code-Änderung |
| 7 | `npm run build` (im ExamLab) | Grün — keine Code-Änderung |

## 9. Risiken & Mitigationen

| Risiko | Mitigation |
|---|---|
| Baseline-Counts ändern sich zwischen Spec-Schreibung und Implementation (z.B. anderer Bundle wird gleichzeitig gemergt) | Implementation re-runt den `wc -l`-Befehl aus Sektion 4 vor dem ersten Skript-Commit und nimmt die aktuellen Counts als Baseline. Spec-Werte sind Indikator, nicht Gospel. |
| Staging-CI rot weil preview noch alten Stand hat (Bundle Q Lehre) | Beim Merge auf `main`: `git push origin main:preview` (FF-Push, sicher solange preview keine eigenen Commits hat). `git log origin/preview ^origin/main --oneline` davor prüfen. |
| Fehlalarm bei JSX-Comment-Verschiebung (`{/* Musterloesung */}` taucht in einer neuen Komponente auf) | Akzeptiert: jeder Treffer ist bewusst zu setzen. Falls Bundle X neue UI-Comments einführt, ist Baseline-Anpassung Teil dieses Bundles. |
| Skript greift fälschlicherweise auf andere `musterlosung*`-artige Strings (Sprach-Cousin in Comments) | Word-Boundary `\b...\b` schützt davor. Verifizierbar via Test 1 + Eyeballing der Tabellen-Counts gegen Sektion 4. |

## 10. Umfang & Aufwand

| Datei | Lines | Operation |
|---|---:|---|
| `scripts/audit-musterloesung.sh` | ~80 | NEU |
| `.claude/rules/code-quality.md` | ~60 | EDIT (neue Sektion) |
| `ExamLab/package.json` | +1 | EDIT |
| `.github/workflows/deploy.yml` | +10 (2 Steps × ~5 Z.) | EDIT |
| `ExamLab/HANDOFF.md` | ~10 | EDIT |

Geschätzte Implementation-Zeit: 1 Session (~30-45 min).

## 11. Definition of Done

- [ ] Branch: `feature/bundle-p-musterloesung-doku`
- [ ] Skript `scripts/audit-musterloesung.sh` existiert, executable (`chmod +x`)
- [ ] `lint:musterloesung` in `ExamLab/package.json`
- [ ] CI-Gate-Steps in `deploy.yml` (Production + Staging)
- [ ] Sektion „Field-Drift: Musterlösung" in `code-quality.md`
- [ ] Lokal alle 7 Test-Plan-Punkte aus Sektion 8 grün
- [ ] HANDOFF.md aktualisiert
- [ ] CI auf Branch grün
- [ ] Vor Merge: `git log origin/preview ^origin/main --oneline` zeigt leer (Preview-Force-Push-Regel — preview ist FF-bereit)
- [ ] Merge auf main + `git push origin main:preview`
- [ ] CI auf main grün

## 12. Folge-Bundles (Out of Scope, nur dokumentiert)

- **Bundle P-Migration** (3-4 Sessions, später) — Sheet-Spalten-Migration `musterlosung` → `musterloesung` (oder umgekehrt), Frontend-Felder vereinheitlichen. Backend-Vertrag betroffen, Daten-Migration analog Bundle J. Aufgrund Aufwand und Risiko explizit nicht Teil von Bundle P-Doku.
- **Bundle T** — Hooks-Splits in 6 Mittel-Risiko-Files. Folge-Bundle nach Bundle P-Doku.
