# Bundle Q — Test-Verzeichnis-Konsolidierung (`__tests__/` retiren)

> Drittes Cleanup-Bundle nach Bundle M (Fragenbank → Fragensammlung) und Bundle N+V (action/aktion + Sprach-Konvention). Befundgrundlage stammt aus dem Vereinfachungs-Audit vom 2026-05-05 (Branch `audit/examlab-vereinfachung`, nicht auf `main` committed); die für Bundle Q relevanten Befunde sind unten inline übernommen, damit die Spec self-contained bleibt.

## Audit-Befund (inline aus A2.10 + A2.11 + Roadmap-Bundle Q)

**Befund (A2.10):** Tests verteilt über drei `__tests__/`-Verzeichnisse mit überlappenden Zwecken — `ExamLab/src/__tests__/` (16 Tests + 1 Helper-File), `ExamLab/src/components/__tests__/` (1), `ExamLab/src/components/lp/durchfuehrung/__tests__/` (1). Daneben existieren bereits 92 Files flach in `src/tests/` (modern Integration/Service) und 44 colocated `*.test.{ts,tsx}` neben den Source-Files. Empfehlung: `__tests__/` retiren, klare Test-Layer-Strategie etablieren (colocated Unit + `src/tests/` Integration-Hub).

**Befund (A2.11):** Mock-Helper sind sauber zwischen Core (`packages/shared/src/test-helpers/frageCoreMocks.ts`) und Storage (`ExamLab/src/__tests__/helpers/frageStorageMocks.ts`) getrennt — keine Divergenz. Aber: die Storage-Helper liegt in einem `__tests__/`-Subdir, das durch dieses Bundle entfällt — Helper braucht einen neuen Heimat-Ort.

**Roadmap-Klassifikation:** Bundle Q, Aufwand **S** (1 Session, mechanisch), Risiko **mech-rename** (niedrig), keine Abhängigkeiten. Test-Plan: Vitest grün + Visual-Inspect der Test-Reports.

---

## Scope & Ziel

**Was:** Alle `__tests__/`-Verzeichnisse aus dem ExamLab-Tree und `packages/shared/`-Tree entfernen. 19 Test-/Helper-Dateien neu platzieren nach Heuristik B („Test wandert zur Source"). Test-Layer-Strategie in `.claude/rules/code-quality.md` dokumentieren. Bash-Audit-Skript + CI-Gate gegen neue `__tests__/`-Ordner.

**Was nicht:** Keine Test-Logik-Änderungen, keine Re-Writes, keine zusätzlichen Tests. Keine Bewegung von Files in `src/tests/` (die 92 bestehenden bleiben). Kein Umbau von `src/test-setup.ts` oder Vitest-Config (Glob `src/**/*.test.{ts,tsx}` und `../packages/shared/src/**/*.test.{ts,tsx}` greifen schon nach Bewegung).

**Definition of Done:**
- 0 Files unter `ExamLab/src/**/__tests__/**` und `packages/shared/src/**/__tests__/**`.
- `npm test` weiterhin grün mit gleicher Test-Anzahl (1234 → 1234, Baseline nach Bundle N+V).
- `tsc -b` clean (keine Pfad-Bruchstellen, weil `git mv`).
- `npm run lint:no-tests-dir` als neue npm-Script + CI-Gate aktiv (rot wenn `__tests__/` wieder auftaucht).
- Sektion „Test-Layer-Strategie" in `.claude/rules/code-quality.md`.

**Risiko:** mech-rename-niedrig. Einziges Realrisiko: ein Test-File hat einen relativen Import wie `'../../utils/foo'`, der nach Bewegung bricht. Mitigation: `git mv` (Git tracked Renames) + `tsc -b` + `npm test` zwischen jedem Commit.

**Aufwand:** S — eine Session, ~1–2h Implementer + Review.

**Abhängigkeiten:** keine. Bundle Q ist parallel zu Bundle O/P/R/S/T spielbar.

---

## Strategie-Entscheidungen (Klärungsfragen)

| Frage | Entscheidung | Begründung |
|---|---|---|
| Heuristik colocate vs `src/tests/` | **B — strikt nach Source-Lokation** | deterministisch, keine Geschmacksfragen pro File. |
| Tests für `@shared/...`-Code | **A — colocated in `packages/shared/`** | konsequente Anwendung von B; Vitest-Glob deckt es ab. |
| Regression-Tests | **A — Subdir `src/tests/regression/`** | Datei-Header sind explizit „Regression-Tests" mit Incident-Bezug, andere Kategorie als Service-Integration. |
| Mock-Helper-Ort | **`src/test-helpers/`** | analog zu `packages/shared/src/test-helpers/frageCoreMocks.ts` (Bundle L.a-Konvention). |
| Gate-Mechanismus | **A — Bash-Audit-Skript** | konsistent mit `audit-as-any.sh` und `audit-tokens.sh`; CI-Gate ist die echte Sicherheitslinie; keine neue Dependency. |
| Doku-Ort | **A — Sektion in `.claude/rules/code-quality.md`** | Test-Layer-Strategie ist 5–15 Zeilen, passt thematisch; vermeidet Doku-Drift mit nicht-existenter `CONTRIBUTING.md`. |

---

## File-Map (alle 19 Files)

### Aus `ExamLab/src/__tests__/` (16 Tests + 1 Helper)

**Direkte Colocation (1:1-Source verifiziert):**

| Quelle | Ziel | Source |
|---|---|---|
| `src/__tests__/fachUtils.test.ts` | `src/utils/fachUtils.test.ts` | `src/utils/fachUtils.ts` |
| `src/__tests__/gefaessUtils.test.ts` | `src/utils/gefaessUtils.test.ts` | `src/utils/gefaessUtils.ts` |
| `src/__tests__/masteryRecency.test.ts` | `src/utils/ueben/masteryRecency.test.ts` | `src/utils/ueben/mastery.ts` |
| `src/__tests__/schulConfig.test.ts` | `src/store/schulConfigStore.test.ts` | `src/store/schulConfigStore.ts` (Test reset-tet den Store) |
| `src/__tests__/sichtbareTypen.test.ts` | `src/utils/sichtbareTypen.test.ts` | `src/utils/sichtbareTypen.ts` |
| `src/__tests__/themenSichtbarkeit.test.ts` | `src/types/ueben/themenSichtbarkeit.test.ts` | `src/types/ueben/themenSichtbarkeit.ts` |

**Shared-Tests (colocate in `packages/shared/`):**

| Quelle | Ziel |
|---|---|
| `src/__tests__/media/MediaAnzeige.test.tsx` | `packages/shared/src/components/MediaAnzeige.test.tsx` |
| `src/__tests__/media/MediaUpload.test.tsx` | `packages/shared/src/components/MediaUpload.test.tsx` |
| `src/__tests__/media/mediaQuelle.test.ts` | `packages/shared/src/types/mediaQuelle.test.ts` |
| `src/__tests__/media/mediaQuelleBytes.test.ts` | `packages/shared/src/utils/mediaQuelleBytes.test.ts` |
| `src/__tests__/media/mediaQuelleMigrator.test.ts` | `packages/shared/src/utils/mediaQuelleMigrator.test.ts` |
| `src/__tests__/media/mediaQuelleResolver.test.ts` | `packages/shared/src/utils/mediaQuelleResolver.test.ts` |
| `src/__tests__/media/mediaQuelleUrl.test.ts` | `packages/shared/src/utils/mediaQuelleUrl.test.ts` |

**Regression (Subdir):**

| Quelle | Ziel |
|---|---|
| `src/__tests__/regression/apiClient.test.ts` | `src/tests/regression/apiClient.test.ts` |
| `src/__tests__/regression/securityInvarianten.test.ts` | `src/tests/regression/securityInvarianten.test.ts` |

**Mock-Helper:**

| Quelle | Ziel |
|---|---|
| `src/__tests__/helpers/frageStorageMocks.ts` | `src/test-helpers/frageStorageMocks.ts` |
| `src/__tests__/helpers/frageStorageMocks.test.ts` | `src/test-helpers/frageStorageMocks.test.ts` |

### Aus `ExamLab/src/components/__tests__/` (1 File)

| Quelle | Ziel |
|---|---|
| `src/components/__tests__/Startbildschirm.test.tsx` | `src/components/Startbildschirm.test.tsx` |

### Aus `ExamLab/src/components/lp/durchfuehrung/__tests__/` (1 File)

| Quelle | Ziel |
|---|---|
| `src/components/lp/durchfuehrung/__tests__/DurchfuehrenDashboard.test.tsx` | `src/components/lp/durchfuehrung/DurchfuehrenDashboard.test.tsx` |

### Import-Pfad-Audit

Da alle Tests via `git mv` bewegt werden und die meisten via `@shared/...`-Alias oder relative Pfade gegen ihre eigene Source importieren, müssen relative Pfade nach Bewegung pro File geprüft werden.

- `../utils/...` aus `src/__tests__/X.test.ts` (1 Ebene tief unter `src`) wird zu `./X` resp. den richtigen relativen Pfad. Konkret: nach Bewegung von `src/__tests__/fachUtils.test.ts` → `src/utils/fachUtils.test.ts` muss `../utils/fachUtils` zu `./fachUtils` werden. Diese Pfad-Korrekturen sind Teil des `git mv`-Schritts pro File (nicht automatisch).
- Tests in `media/` benutzen ausschließlich `@shared/...`-Aliase — Imports bleiben unverändert.
- Tests in `regression/` haben relative Imports auf Source (z.B. `'../../services/apiClient'` mit Tiefe 2). Da Move `src/__tests__/regression/X.test.ts` → `src/tests/regression/X.test.ts` die Tiefe konserviert (beide 2 Ebenen unter `src`), bleiben relative Pfade gültig — keine Anpassung nötig.
- `helpers/frageStorageMocks.test.ts` testet `./frageStorageMocks` — bleibt relativ-stabil bei gemeinsamer Bewegung.
- Verschobener Helper `frageStorageMocks.ts` wird aus genau **einem** Test ausserhalb des Helpers-Ordners importiert: `ExamLab/src/hooks/useFragenAutoSave.test.tsx` mit Pfad `'../__tests__/helpers/frageStorageMocks'`. Nach Move: `'../test-helpers/frageStorageMocks'`. Verifikation: `grep -rn "frageStorageMocks" ExamLab/src` muss nach dem Bundle ausschliesslich Treffer in `src/test-helpers/` und in `src/hooks/useFragenAutoSave.test.tsx` (mit neuem Pfad) zeigen.

---

## Doku-Sektion in `code-quality.md`

Neue Sektion am Ende des Files (~25 Zeilen):

```markdown
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
```

---

## Gate-Skript + CI-Anbindung

**`scripts/audit-test-locations.sh`** — Bash, keine Dependencies. Analog zu `audit-as-any.sh`:

```bash
#!/usr/bin/env bash
# Audit-Skript: kein __tests__/-Verzeichnis im Source-Tree.
#
# Hintergrund: Bundle Q (2026-05) — Test-Layer-Strategie konsolidiert.
# Tests sind colocated *.test.{ts,tsx} oder in src/tests/ resp. src/tests/regression/.
# __tests__/-Wrapper-Ordner sind retired.
#
# Aufruf: ./scripts/audit-test-locations.sh [--strict]
#   --strict: exit 1 wenn Treffer > 0 (CI-Gate).
set -e

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

**`ExamLab/package.json`** — neue Script-Zeile neben `lint:as-any`:

```json
"lint:no-tests-dir": "../scripts/audit-test-locations.sh --strict"
```

**`.github/workflows/deploy.yml`** — Gate-Step neben dem `lint:as-any`-Step. Konkret: gleicher Job, `run: npm run lint:no-tests-dir` direkt darunter (zwei Stellen, da bisheriges Pattern den Step in beiden Pipeline-Hälften — production und staging — hat).

**Verhalten:**
- Lokal: `npm run lint:no-tests-dir` exit 0 wenn sauber, exit 1 + lesbarer Ausgabe wenn ein `__tests__/`-Ordner wieder auftaucht.
- CI: Pipeline rot bei Treffer. Audit findet zu Bundle-Q-Zeitpunkt 0 (alle bewegt → siehe Test-Plan).

---

## Commit-Sequenz

Branch: `refactor/bundle-q-tests-konsolidierung`.

**Commit 1 — `src/__tests__/`-Hauptmasse bewegen (16 Files + 1 Helper)**
- Alle 16 Test-Files via `git mv` an Zielort (siehe File-Map).
- Helper `frageStorageMocks.ts` nach `src/test-helpers/`.
- Pro File relative Imports anpassen (`../utils/X` → `./X` etc.).
- Einen Konsumenten ausserhalb des Helpers-Ordners auf neuen Pfad zeigen: `ExamLab/src/hooks/useFragenAutoSave.test.tsx` (`'../__tests__/helpers/frageStorageMocks'` → `'../test-helpers/frageStorageMocks'`).
- Verifikation: `npm test` gleiche Anzahl passes (1234) + `tsc -b` clean.

**Commit 2 — `components/__tests__/`-Subdirs auflösen (2 Files)**
- `git mv` von `Startbildschirm.test.tsx` und `DurchfuehrenDashboard.test.tsx` raus aus dem `__tests__/`.
- Imports prüfen (`../X` → `./X` etc.).
- Beide leeren `__tests__/`-Dirs entfernen (`rmdir`).
- Verifikation: `npm test` + `tsc -b`.

**Commit 3 — Gate-Skript + Doku + CI**
- `scripts/audit-test-locations.sh` neu (siehe Gate-Skript-Sektion).
- `ExamLab/package.json` → `lint:no-tests-dir`-Script.
- `.github/workflows/deploy.yml` → 2× `npm run lint:no-tests-dir`-Step neben `lint:as-any`.
- `.claude/rules/code-quality.md` → neue Sektion „Test-Layer-Strategie".
- Verifikation: `npm run lint:no-tests-dir` lokal grün; `find ExamLab/src packages/shared/src -type d -name __tests__` leer.

**Commit 4 — HANDOFF + Memory**
- `ExamLab/HANDOFF.md` Eintrag „Bundle Q ✅ MERGED" mit Token-Diff (vorher/nachher `__tests__/`-Dirs).
- Memory-Eintrag `project_bundle_q_tests_konsolidierung.md` mit Index-Zeile in `MEMORY.md`.

---

## Test-Plan (vor PR / Merge)

1. `npm test` → 1234/1234 passes (gleiche Baseline wie main nach Bundle N+V).
2. `tsc -b` → 0 Errors.
3. `npm run build` → clean.
4. `npm run lint:as-any` → 0 (Baseline halten).
5. `npm run lint:no-tests-dir` → 0.
6. `find ExamLab/src packages/shared/src -type d -name __tests__` → leer.
7. CI-Run auf Branch grün.

**Kein Browser-E2E nötig** — Bundle ist test-/tooling-only, keine Wire-Vertrag- oder UI-Änderung. Audit-Klassifikation „mech-rename-niedrig" + Test-Suite als sole Verifikation.

---

## Audit-Token-Diff (erwartet)

| Token | vorher | nachher |
|---|---:|---:|
| `__tests__/`-Dirs unter `ExamLab/src` | 3 | 0 |
| `__tests__/`-Dirs unter `packages/shared/src` | 0 | 0 |
| Tests in `src/__tests__/` | 16 | 0 |
| Tests in `src/components/**/__tests__/` | 2 | 0 |
| Helpers in `src/__tests__/helpers/` | 1 | 0 |
| Tests colocated unter `src/utils/`, `src/store/`, `src/types/`, `src/components/` | (Baseline) | +9 |
| Tests in `packages/shared/src/components/`, `…/utils/`, `…/types/` | (Baseline) | +7 |
| Tests in `src/tests/regression/` | 0 | 2 |
| Files in `src/test-helpers/` | 0 | 2 |

Gesamt-Test-Anzahl unverändert: 1234 (Vitest-Baseline nach Bundle N+V).

---

## Folge-Bundles (out of scope)

Aus der Audit-Roadmap (2026-05-05) für nächste Sessions:

- **Bundle O — Store-Action-Naming-Vereinheitlichung** (parallel spielbar).
- **Bundle R — Error-Handling-Vereinheitlichung** (M, ~2 Sessions).
- **Bundle S — Datei-Hotspots Niedrig-Risiko-Splits** (5 Files).
- **Bundle P — `musterlosung` Field-Drift-Konsolidierung** (erhöhtes Risiko).
- **Bundle T — Datei-Hotspots Mittel-Risiko-Splits** (Hooks).
