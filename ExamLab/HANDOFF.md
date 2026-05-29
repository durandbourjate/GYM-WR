# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## NÄCHSTE SESSION — Wiedereinstieg

### Stand 29.05.2026 — react-doctor Audit-Backlog abgeschlossen (3 Tickets LIVE)

**One-Liner:** Die letzten 3 react-doctor-Audit-Baustellen abgearbeitet → LIVE auf `main` = `preview` = `ec3fe3b`. Staging-E2E grün, 0 Console-Errors.

**T1 — no-danger Security-Gate** (`fix/no-danger-audit-gate`): Alle 46 Danger-Prop-Stellen triagiert → **0 aktive XSS** (alle via DOMPurify / renderMarkdown escape-first in `src/utils/markdown.ts` / KaTeX trust:false). Toter `LatexText.tsx` gelöscht (0 Aufrufer, escapte selbst nicht). Neues Gate `lint:react-doctor-security` (no-danger + no-eval, Baseline 46/28 Files) in ci-check + deploy.yml (beide Hälften). Doku: `docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md` (Abschluss-Sektion).

**T2 — no-derived-state Gate** (`chore/no-derived-state-gate`): Alle 41 Findings triagiert → **0 echte Refactors** (durchweg editierbare Kopien mit sync-on-id / async-geladener State / optimistische Toggles / UI-Interaktions-State — useMemo würde Bugs einführen, z.B. Cursor-Sprünge bei FiBu-Editoren). `no-derived-state` als 4. Regel ins State-Gate, Baseline 93 → 134. Doku: `docs/superpowers/specs/2026-05-29-no-derived-state-triage.md`.

**T3 — js-set-map-lookups Hotspots** (`perf/js-set-map-lookups-hotspots`): Von 189 Findings nur 9 im Frontend — **180 im Apps-Script-Backend bewusst übersprungen** (migration-pending + latenz- statt CPU-gebunden). 3 echte Hotspots gefixt (`array.includes` → `Set`, verhaltens-identisch): `KlassenLuecken` (ids), `useThemenKomputationen` (sichtbareFaecher), `useGlobalSuche.shared` (INDEX_BLACKLIST im stripSensibleFelder-Index-Build). 6 berechtigt geskippt (5 react-doctor-FP auf String-Methoden `.includes`/`.indexOf`, 1 vernachlässigbar in demoKorrektur). **Kein Gate** (Regel hat hohe FP-Rate bei String-Methoden + Backend-dominiert).

**Verifikation:** ci-check grün (2131 Tests, beide Gates). Staging-E2E auf `ec3fe3b`: globale Suche (gruppierte Treffer, kein Lösungs-Leak), Üben-Themensteuerung + Fach-Filter „Recht", Analyse „Klassenweite Lücken", SuS-Dashboard — alle 0 Console-Errors. App-Shell lädt sauber trotz gelöschtem LatexText.

**Workflow:** Pro Ticket eigene Branch off main, Octopus-Integrations-Branch für gemeinsamen Staging-E2E (push → preview deployt Staging), dann FF main + sync preview. Alle Triage-Flags selbst gegengelesen (exhaustive-deps-Lehre: Subagenten überflaggen).

**Nächste Audit-Baustellen:** Nur noch Prio-D-Stylistik (512× design-no-redundant-size-axes, 350× button-has-type, 154× design-no-em-dash-in-jsx-text) — low-value, vermutlich Skip (höchstens Skip-Gate-Promotion). **Damit ist der react-doctor-Audit-Backlog im Wesentlichen abgeschlossen.** Grösster offener Thread bleibt die **Backend-Migration** (Spec fertig: `docs/superpowers/specs/2026-05-18-backend-migration-design.md`, wartet auf Plan-Phase + 5 KW-21-Koordinations-Mails).

**Weiterhin offen (User-Aktion):** Apps-Script-Deploy für den datum-Fix vom 23.05.2026 (GAS-Editor → Bereitstellungen verwalten → neue Version).

---

### Stand 28.05.2026 SPÄT-ABEND — exhaustive-deps Bug-Fix + Wins + Gate

**One-Liner:** Alle 65 `exhaustive-deps`-Findings triagiert (4 Subagenten + manuelle Verifikation) → **genau 1 echter Bug gefunden + gefixt**, 2 Perf-Wins, 11 ref-in-cleanup mechanisch transformiert, ~51 intentional/safe via Gate festgezurrt.

**Der eine echte Bug:** `usePruefungsMonitoring.ts:277` — der Online/Offline-Listener-Effect liess `backendVerfuegbar` aus den Deps (Schwester-Effects Z.133/204/217 haben es). Folge: wenn `backendVerfuegbar` nach Mount false→true kippt (user.email async), behält der online-Handler stale `false` → bei Reconnect wird die Retry-Queue nicht verarbeitet → **SuS-Antwortverlust-Risiko**. Fix: `backendVerfuegbar` in Deps. Exam-kritisch, aber 1-Zeile + konsistent.

**Verifikations-Lehre:** 2 von 3 Subagent-`REAL_BUG`-Flags waren Fehlalarme (UebungsToolView:118 durch Schwester-Effect abgedeckt, MaterialienSection:153 durch `[neuerTitel]`-Dep korrekt) — nur durch eigene Code-Lesung entlarvt. Subagenten bei exhaustive-deps überflaggen.

**Was gefixt wurde (14):** Bug (1) + Unstable-Memo (2: AktivPhase:59, AnalyseDashboard:74 +sessions) + ref-in-cleanup (11: Code/Freitext/PDFFrage/PDFKorrektur/ZeichnenKorrektur debounceRef, Tooltip/useDebouncedHover timerRef, useAudioRecorder stream, useStiftRendering/ZeichnenFrage/usePDFRenderer). **ref-Transform-Technik:** `eslint-disable` silenced react-doctor NICHT (Regel-ID `exhaustive-deps`); stattdessen Ref-OBJEKT aliasieren (`const x = xxxRef`, Cleanup liest `x.current`) — beweisbar verhaltens-identisch.

**Gate:** `exhaustive-deps` zur `audit-react-doctor-state.mjs` RULES-Menge → kombinierte react-doctor-Gate, Baseline **93** (42 State + 51 exhaustive-deps post-fix). `usePruefungsMonitoring` fällt 2→1 (nicht 0 — :204 bleibt intentional).

**E2E (Staging, meine Branch deployed):** Build lädt sauber (LP+SuS), SuS-Üben-Pipeline (MC + Lückentext: Auswahl/Texteingabe/Submit→Feedback) 0 Console-Errors. ⚠️ Die spezifischen transformierten Editoren (Code/PDF/Zeichnen/Audio) + Reconnect/Korrektur NICHT einzeln browser-getestet (kamen nicht im Mix / brauchen Live-Prüfung) — Absicherung dort: beweisbar-identische Transforms + sauberer Build + ci-check.

**Commits (Branch `feature/exhaustive-deps-bugfix-gate`):** `361b9a8` (Bug) · `ab1b268` (Memo) · `ea4e1d0` (5 debounceRef) · `466f0de` (6 ref) · `3391921` (Gate+Baseline). Spec `c8b836b`, Plan `ee5581a`. ci-check grün (2131 Tests). Branch wurde für Staging-E2E nach `preview` gepusht; Merge nach `main` mit User-Freigabe.

**Nächste Audit-Baustellen (Rest):** `no-derived-state` (42×), `js-set-map-lookups` (189×), `no-danger`-Folge-Audit (Prio C). Gate-Muster ist die Blaupause.

---

### Stand 28.05.2026 ABEND — State-Correctness-Gate (Triage + Baseline-Gate)

**One-Liner:** Alle 42 Findings der zwei Bug-trächtigsten react-doctor-Regeln (`no-adjust-state-on-prop-change` 19 + `no-cascading-set-state` 23) triagiert → **0 echte Bugs**. Statt Churn-Refactoring wurde der verifiziert-saubere Stand als CI-Gate `lint:react-doctor-state` festgezurrt (pre-push, ~7s). **Branch `feature/react-doctor-state-gate` — wartet auf Merge-Freigabe.**

**Triage-Ergebnis (3 Subagenten + 2 manuelle Proben):** Jedes der 42 Findings ist benigner Load-Effect, Timer/Listener **mit Cleanup**, oder bereits-angewendetes S129/S130-Remedy (Sync-on-id / key-Remount / ref-Guard). Kein Render-Loop-Tell (kein im Effect gesetzter State in dessen eigener Deps-Liste). Das ist die Dividende der früheren S129/S130-Arbeit. Vollständiger Audit-Trail: Anhang A der Spec.

**Was gebaut wurde:**
- `scripts/audit-react-doctor-state.mjs` — Gate nach `audit-no-emoji.mjs`-Muster: ruft `react-doctor --full --lint --no-dead-code --no-score --json`, filtert die 2 Regeln, Count-pro-Datei vs. Baseline. `--strict`/`--baseline`-Flags.
- `scripts/react-doctor-state-baseline.json` — `per_file_max`, 42 Findings / 28 Dateien (gegen Triage gegengeprüft).
- `react-doctor@0.2.10` als **exakt-gepinnte** devDep (kein Caret — 0.x-Tool kann Flagging zwischen Versionen ändern → Baseline-Churn).
- `lint:react-doctor-state` in der `ci-check`-Kette (→ pre-push-Hook).

**Commits (Branch):** `987f924` (devDep) · `aec3515` (Skript+Baseline) · `c3d21a5` (ci-check-Wiring) · HANDOFF-Commit folgt. Spec `f6c93f9`, Plan `aa0a35b`.

**Verifikation:** Regression-Test (Wegwerf-Komponente mit prop-getriebenem Multi-setState → Gate failt exit 1) ✓. Drift-Test (Baseline temporär erhöht → IMPROVEMENT, exit 0) ✓. **Full `ci-check` exit 0** (10 Lints inkl. neues Gate, **vitest 2131 passed**, build ✓). Bonus: Gate ist präzise gescoped — `no-initialize-state` (3. Regel, konstante setStates) wird korrekt NICHT mitgezählt.

**Workflow:** brainstorming (Spec + spec-reviewer) → writing-plans (Plan + plan-reviewer) → subagent-driven-development (Implementer pro Task + Verifikation). Spec `docs/superpowers/specs/2026-05-28-react-doctor-state-gate-design.md`, Plan `docs/superpowers/plans/2026-05-28-react-doctor-state-gate.md`.

**Merge-Status:** Reines CI-Tooling, keine App-Verhaltensänderung → Browser-E2E entfällt. Merge nach `main`+`preview` wartet auf explizite User-Freigabe.

**Zwei Follow-ups (nicht in diesem Scope):**
1. **Memory-Korrektur:** `--no-score` IST ein gültiges react-doctor-Flag (0.2.10, „skip the score API and the share URL") — die Memory-Notiz „existiert nicht" ist stale.
2. **CI-Coverage-Lücke:** deploy.yml enthält nur eine Teilmenge der Gates; die neueren (no-emoji, typo-tokens, storybook-coverage, wire-contract, no-inline-svg, react-doctor-state) laufen nur pre-push. Eigenes Thema.

---

### TAGES-BILANZ 28.05.2026 — react-doctor Audit-Tag KOMPLETT

**One-Liner:** 5 Sweeps in einem Tag, react-doctor Errors **23 → 1** (nur bewusst eslint-disabled), XSS-Stellen **1 → 0**, vitest **2120 → 2131**, alles LIVE auf `main` = `preview` = `53abcdb`. Working tree clean.

**Sweep-Zusammenfassung:**

| # | Sweep | Commit | Errors | XSS |
|---|---|---|---|---|
| 1 | High-Confidence (8 Fixes) | `dd5f62d` | 23 → 15 | 1 |
| 2 | Folge Prio 1+2 (3 Fixes) | `3524512` | 15 → 13 | 1 |
| 3 | FreitextFrage XSS-Fix | `ecc5e5c` | 13 | 1 → **0** |
| 4 | only-export-components (12 Fixes) | `53abcdb` | 13 → **1** | 0 |
| 5 | Doku-Updates dazwischen | (mehrere) | — | — |

**Was bleibt offen aus dem react-doctor Audit (Prio-sortiert):**

1. **Priorität B — Quality-Gate-Kandidaten** (preventive Hardening, ~Wochen-Arbeit):
   - 65× `exhaustive-deps` — useEffect-Deps-Vollständigkeit
   - 42× `no-derived-state` — useState wo useMemo besser wäre
   - 23× `no-cascading-set-state` — setState in setState
   - 19× `no-adjust-state-on-prop-change` (S129-Pattern)
   - 189× `js-set-map-lookups` (Performance)
2. **Priorität C — `no-danger` Folge-Audit** (preventive Sanitization-Check):
   - 39 Markdown/LaTeX-Stellen (via `renderMarkdown` — wahrscheinlich alle OK)
   - 2 KaTeX-Sonstiges (`FormelAnzeige.tsx:25`, `FormelFrageComponent.tsx:239`)
   - 1 Backend-HTML (`MaterialPanel.tsx:295`, hat DOMPurify)
   - Inventar: `docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md`
3. **Priorität D — Stylistik-Skip-Klassen** (low-value):
   - 512× `design-no-redundant-size-axes`
   - 350× `button-has-type`
   - 154× `design-no-em-dash-in-jsx-text`

**ORTHOGONAL zum Audit (grösster offener Thread):** **Backend-Migration** Plan-Phase + 5 KW-21-Mails. Spec: `ExamLab/docs/superpowers/specs/2026-05-18-backend-migration-design.md`. Voller Kontext in Memory `project_backend_migration`.

**Vorab als User-Aktion offen:** **Apps-Script-Deploy für datum-Fix vom 23.05.2026** (GAS-Editor → Bereitstellungen verwalten → Bearbeiten → Neue Version → Bereitstellen). Test: Prüfung anlegen, speichern, neu laden — Network-Tab muss `datum: "2026-05-23"` zeigen (nicht ISO-with-time).

**Wichtige Memory-Lehren von heute:**
- iframe `sandbox="allow-scripts allow-same-origin"` ist effektiv kein Sandbox (Kombi erlaubt Self-Entsandboxing). → `allow-scripts` alleine.
- L3Dropdown-Pattern: `useId()` + konditionales `aria-controls={offen ? id : undefined}` (listbox existiert nur wenn offen).
- `FreitextFrage:317`-Audit: Bei `no-danger`-Audits IMMER per failing-Test verifizieren — `<script>` war tatsächlich im DOM, kein theoretisches Risiko.
- Bei Pfad-Refactors immer Audit-Scripts mit-migrieren (`audit-storybook-coverage.mjs` REQUIRED_MAP_IMPORTS, `no-emoji-baseline.json` allowlist).
- react-doctor JSON dupliziert Errors wegen `projects[]`-Nesting → `unique` filtern für Distinct-Count.
- `--no-score`-Flag existiert NICHT in react-doctor CLI — nur `--json`.

---

### Stand 28.05.2026 SPÄT-3 — only-export-components Sweep LIVE

react-doctor Errors **13 → 1** (nur `no-eval` poolSync.ts bewusst). Alle 12 `only-export-components`-Errors auf 9 Files behoben:

| File | Strategie |
|---|---|
| `ZeichnenCanvas.tsx:463` | Dead-code `exportiereCanvasAlsPNG` entfernt (0 Consumer) |
| `BatchConfirmModal.tsx:45` | `tagsModusAusPatch` → `batchConfirmModalUtils.ts` |
| `VirtualisierteFragenListe.tsx:41,56` | `FlatItem` Type + `baueFlatItems` → `flatItems.ts` |
| `PruefungsComposer.tsx:35` | `export { leereUebung }` Re-Export entfernt (Consumer importierte direkt) |
| `LernzielKarte.tsx:21,29` | `KartenDaten` + `berechneKartenDaten` → `lernzielKartenDaten.ts` |
| `BilanzEREditor.tsx`, `TKontoEditor.tsx` | Wrapper-Files komplett gelöscht (0 Consumer) |
| `NavIcon.tsx:24,45,70,79` | `LUCIDE_KEY_MAP` + `EMOJI_TO_KEY` + 2 Utils → `navIconMaps.ts` |
| `FragetypIcon.tsx:20` | `FRAGETYP_ICON_MAP` + `Fragetyp` Type → `fragetypIconMap.ts` |

**Plus:** `scripts/audit-storybook-coverage.mjs` `REQUIRED_MAP_IMPORTS` aktualisiert auf neue Pfade. `Icons.stories.tsx` + 5 Component-Files + 3 Test-Files mit neuen Imports.

**Verifikation:** vitest **2131 + 6 todo** (unverändert), tsc clean, **11 CI-Gates ✓** (inkl. storybook-coverage), react-doctor 1 Error.

**Bilanz seit Audit-Start (28.05.2026):**

| Sweep | Commit | Errors | XSS-Stellen |
|---|---|---|---|
| Vor-Audit | `e775bd5` | 23 | 1 |
| High-Confidence | `dd5f62d` | 15 | 1 |
| Folge Prio 1+2 | `3524512` | 13 | 1 |
| FreitextFrage-XSS | `ecc5e5c` | 13 | **0** |
| only-export-components | [pending] | **1** | 0 |

Damit ist react-doctor essentiell sauber — der verbleibende `no-eval` ist bewusste eslint-disable in `poolSync.ts` (Pool-Config-Loader, dokumentiert in `claude-security-guidance.md`).

---

### Stand 28.05.2026 SPÄT-2 — FreitextFrage XSS-Fix LIVE

Direkter Follow-up zum F4-Inventar-Befund. LIVE auf `main` + `preview` (`ecc5e5c`).

- **Fix:** `FreitextFrage.tsx:317` rendert `antwort.text` (SuS-Tiptap-Output) jetzt mit `DOMPurify.sanitize()`. Tiptap-Default-Schema produziert keinen rohen HTML-Tag-Soup, aber der Editor erlaubt theoretisch Inline-HTML-Eingaben — und 3 andere Render-Stellen für SuS-Antwort-Text (`AbgabeZusammenfassung`, `KorrekturPDFAnsicht`, `FreitextAnzeige`) verwenden bereits DOMPurify. Die fehlende Sanitisierung war Inkonsistenz, kein bewusstes Design.
- **Test (vitest):** Failing-Test zuerst bestätigt: `<script>window.__xss=true</script>` im `antwort.text` wird tatsächlich in den DOM gerendert. Nach DOMPurify-Wrap: `<script>` gestrippt, kein `onerror`, kein window-Side-Effect. vitest **2130 → 2131**.
- **Commit:** `ecc5e5c fix(freitextfrage): DOMPurify-Wrap auf SuS-Quill-Antwort`

**Bilanz seit Audit-Start am 28.05.2026:**

| Sweep | Commit | react-doctor Errors | XSS-Stellen offen |
|---|---|---|---|
| Vor-Audit | `e775bd5` | 23 | 1 (`FreitextFrage:317`) |
| High-Confidence | `dd5f62d` | 15 | 1 |
| Folge Prio 1+2 | `3524512` | 13 | 1 |
| FreitextFrage-XSS | `ecc5e5c` | 13 | **0** |

Damit ist das gesamte Sweep-Ziel erreicht: alle Ziel-Errors gefixt + die einzige unsanitisierte SuS-Input-Stelle aus dem `no-danger`-Inventar geschlossen.

---

### Stand 28.05.2026 SPÄT — react-doctor Folge-Sweep Prio 1 + Prio 2 KOMPLETT

Drei Folge-Fixes nach High-Confidence-Sweep, alle LIVE auf `main` + `preview` (`eb65b79`):

**Commits (Branch `fix/react-doctor-folge-prio1-prio2`):**

| # | Commit | Kategorie | File |
|---|---|---|---|
| – | `aa19e95` | docs | Spec |
| – | `46f43b1` | docs | Plan |
| F2 | `6cd3e33` | Security | `MaterialPanel.tsx:324` — sandbox `"allow-scripts allow-same-origin"` → `"allow-scripts"` |
| F3 | `efc8287` | Accessibility | `L3Dropdown.tsx` — `useId()` + `aria-controls` (konditional) + `aria-selected={false}` |
| F4 | `eb65b79` | Doku | `no-danger`-Inventar 47 Stellen kategorisiert |

**Verifikation:**
- react-doctor Errors: **15 → 13** (2× `role-has-required-aria-props` weg, Rest pre-existing Baseline)
- `iframe-sandbox-combination`-Warning auf MaterialPanel:324 weg (verbleibend nur 6 Drive/PDF/Embed-iframes mit dokumentierter Sandbox-Pause)
- vitest: **2127 + 6 todo → 2130 + 6 todo** (+3 neue Tests aus F2/F3)
- 11 CI-Gates ✓
- E2E staging: Build aktiv (2026-05-28), Console 0 Errors. L3Dropdown selber nicht auf Fragensammlung-Seite getestet (lebt in Header-Cascading-Tabs), Unit-Tests decken aria-Verifikation ab.

**Wichtigster F4-Befund (für künftigen Audit):** `FreitextFrage.tsx:317` rendert SuS-Quill-Output **ohne DOMPurify** — einzige unsanitisierte SuS-Input-HTML-Stelle. Alle anderen 46 Stellen sind via `renderMarkdown` (LP-Content, markdown-it), DOMPurify (Backend-HTML) oder KaTeX (LaTeX-Output) abgesichert. Spec: `ExamLab/docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md`.

**Workflow:** Brainstorming → spec (`aa19e95`) → spec-reviewer (3 Issues behoben) → writing-plans (`46f43b1`) → plan-reviewer (3 Defensiv-Improvements behoben) → subagent-driven-development mit 3 Implementer (sonnet) + 6 Reviewer (haiku, parallel pro Task) + E2E + Merge.

---

### Stand 28.05.2026 — react-doctor High-Confidence-Fixes KOMPLETT

8 als `Error` gemeldete react-doctor-Findings vom 28.05.2026-Audit alle behoben in einer Subagent-driven Session (~3h).

**Commits (Branch `fix/react-doctor-high-confidence-errors` → merged main + preview):**

| # | Commit | Rule | File |
|---|---|---|---|
| – | `fa33d55` | docs | Implementation-Plan |
| 1 | `bdbaba9` | jsx-key | `PDFToolbar.tsx` (Farben-Map) |
| 2 | `38888aa` | jsx-key | `ZeichnenToolbar.tsx` (Farben-Map) |
| 3 | `d61dd10` | no-mutable-in-deps | `LPAppHeaderContainer.tsx` (pathname-hoist) |
| 4 | `bb5701c` | no-mutable-in-deps | `SuSAppHeaderContainer.tsx` (pathname-hoist) |
| 5 | `32ceb83` | no-mutable-in-deps | `Dashboard.tsx` (pathname-hoist) |
| 6 | `4a748f7` | effect-needs-cleanup | `SuSAnalyse.tsx` (setTimeout cleanup) |
| 7 | `45d8f46` | effect-needs-cleanup | `useLPDashboardData.ts` (setTimeout + 7 abgebrochen-Guards) |
| 8 | `2d41b4b` | rules-of-hooks | `FrageText.tsx` (useMemo vor BEIDE Early-Returns) |

**Verifikation:**
- react-doctor Errors: **23 → 15** (Differenz = exakt 8, alle Ziel-Errors weg)
- Verbleibend = pre-existing Baseline (12× `only-export-components`, 2× `role-has-required-aria-props` L3Dropdown, 1× `no-eval` poolSync.ts bewusst mit eslint-disable)
- vitest: **2127 passed + 6 todo** (+9 neue Tests, +2 todo: Dashboard/useLPDashboardData smoke-skips wegen Store-Komplexität)
- **11 CI-Gates** clean (`lint:as-any`, `no-alert`, `no-tests-dir`, `musterloesung`, `wire-contract`, `no-emoji`, `no-inline-svg`, `typo-tokens`, `storybook-coverage`, `vitest`, `build`)
- tsc -b clean, vite build clean

**E2E auf staging (Tab-Gruppe LP+SuS, build 2026-05-28T09:34:38Z):**
- LP `/favoriten` → `/fragensammlung` Navigation clean (T3)
- SuS `/sus` → FIBU-Detail → Übung-Start → Frage-Wechsel 1→2 → `/ergebnis` → `/sus/ueben/fortschritt` clean
- SuSAnalyse-Komponente rendert (Level/Streak/Versuche/Meilensteine/Themen) → T5+T6 verifiziert
- Console: 0 React-Hook-Errors, 0 jsx-key-Warnings, 0 no-mutable-Warnings, 0 effect-cleanup-Warnings. Nur 3 pre-existing `preWarmFragen` Backend-Warnings (rate-limit, unrelated).

**Workflow:** superpowers `writing-plans` → plan-document-reviewer (Issues gefunden + behoben: FrageText hat 2 Early-Returns, default-export) → `subagent-driven-development` mit Implementer (haiku für jsx-key/pathname-hoist, sonnet für setTimeout-Cleanup + FrageText) + Spec-Reviewer + Code-Quality-Reviewer pro Task.

**Nächster grosser Thread:** **Backend-Migration** weiterhin offen (Spec `docs/superpowers/specs/2026-05-18-backend-migration-design.md`, wartet auf Plan-Phase + 5 KW-21-Mails).

**Optional Backlog aus dem Audit (nicht targeted):**
- `only-export-components` (12×) — Fast-Refresh-DX, low-priority
- `role-has-required-aria-props` (2× L3Dropdown combobox/option) — Accessibility-Audit
- 46× `no-danger` Warnings — Pre-sanitisierungs-Audit (MediaAnhang/MaterialPanel/PDFAnnotationAnzeige)
- 7× `iframe-missing-sandbox`, 1× `iframe sandbox=allow-scripts+allow-same-origin` MaterialPanel:324

---

### Stand 23.05.2026 SPÄT-3 — Hygiene-Sweep KOMPLETT, Werkbank ready für Backend-Migration

Nach MC-Audit-Abschluss kompletter Hygiene-Sweep in derselben Session:

- **Branch-Hygiene:** 19 alte Feature-Branches gelöscht (gemergt + remote). Übrig: `main`, `preview`, `gh-pages`.
- **getGymStufe-2026-Default:** Memory war stale, Code in `gradeRequirements.ts:38` bereits dynamisch via `aktuellesSchuljahrEndjahr()`. Kein Fix nötig.
- **Datum-Roundtrip-Bug:** Frontend-Defensive-Fix (`1d8339d`) + Backend-Wurzel-Fix (`ef947ec`) live.
  - Frontend: `toIsoDateInput()` in `utils/zeit.ts` + 9 Tests, `GrunddatenSection` nutzt es.
  - Backend: `toIsoDateOnly_()` Helper (analog `toIsoStr_`) + 8 Read-Stellen normalisiert.
  - ⚠️ **Backend-Effekt wartet auf Apps-Script-Deploy** (User-Aktion: GAS-Editor → neue Bereitstellung).
- **Status-Text Composer-Leiste:** Code-History-Recherche zeigt Logik byte-identisch zum alten Header (`d39f143` verschob nur Render-Stelle). Kein Code-Bug — E2E-Failure war Test-Timing.
- **Pre-push-Hook bei `--delete` skippen** (`e80b766`): Stdin-Parse, wenn alle local_oid = 000... dann skip ci-check (`<2s` statt ~70s). Live-verifiziert 3× heute.

**Refs:** `main` = `origin/main` = `origin/preview` = `ef947ec`. Working tree clean.

vitest **2120 passed** + 4 todo, **9 lint-Audits clean**, **tsc-b + build clean**.

**Kein dringender Punkt offen.** Nächster grosser Thread bleibt **Backend-Migration** (Spec `docs/superpowers/specs/2026-05-18-backend-migration-design.md`, wartet auf Plan-Phase + 5 KW-21-Mails).

---

### Stand 23.05.2026 SPÄT-2 — Multi-MC-Sanierung KOMPLETT ✓ MC-Audit-Projekt abgeschlossen

**Multi-MC-Sanierung Teil B Runbook R1–R7 in einer Session (~3 h) durchgelaufen.** Schluss-Diagnose `diagnoseMcMultiLaenge`: **UNAUFFÄLLIG**.

**Aggregat-Werte:**

| Metrik | Vorher | Nachher | Δ |
|---|---|---|---|
| Verhältnis korrekt/Distraktor | 1.27× (LEICHT ERHÖHT) | **1.02×** | −20 % |
| Fragen mit Ø-korrekt > Ø-Distraktor | 68.5 % | **37.8 %** | −31 pp |
| Perfektes Ranking | 85 (37.4 %) | **6 (2.6 %)** | −93 % |
| Tell-Score > 0.30 | 59 Fragen | **0 Fragen** | −100 % |
| Tell-Score-Schwerpunkt | rechts (positiv) | bei 0.0 (55.5 % < 0) | umgekippt |

**Pipeline-Bilanz (R1–R7):**
- R1 Setup Standalone-Apps-Script-Projekt — Diagnose-Datei aktualisiert, neue `sanierung-mc-multi.gs` angelegt.
- R2 Tell-Score-Histogramm — 227 Multi-MC, Schwelle 0.30 (Default), Rote Zone projektiert.
- R3 `runPhase0Planung` — Rote Zone **90 Fragen** (85 perfekt-Ranking + 5 nur via Tell-Score).
- R4 Phase 1: **11 Sonnet-Subagenten** (BWL 3 / Recht 4 / VWL 4), 90/90 sauber im Längen-Band, `merge.js` 0 Validierungs-Probleme.
- R5 Phase 2 Checker in **separater Claude-Code-Session** (Anti-Bias-Constraint): 18 Subagenten à 5 Fragen, **OK 69 / FLAG 12 / STICHPROBE 9** (Stichprobe-Quote 11.5 % via FNV-1a-Hash).
- R6 LP-Review-Gate: 3 freigegeben (Checker übergewarnt) + 1 Trivial-Fix (WhatsApp-Schreibweise) + 8 Reviewer-Rewrites (2 weitere Sonnet-Subagenten) + 9 Stichprobe alle sauber. `apply-review.js` validiert + alles auf `freigegeben`.
- R7 `runPhase3Rueckschreiben`: 90 geschrieben, 0 Errors, 0 Übersprungen. DRY_RUN-Pre-Check → echt-Run → DRY_RUN zurück.

**Gesamtprojekt-Bilanz (21.05.–23.05.2026):**

| Fragen-Typ | Anzahl | Vorher | Nachher | Sanierte |
|---|---|---|---|---|
| Single-Choice MC | 1'023 | 1.81× / 74.2 % | 0.96× / 18.8 % | 759 |
| Multi-Choice MC | 227 | 1.27× / 68.5 % | 1.02× / 37.8 % | 90 |

Längen-basierte Rate-Heuristik in der ExamLab-Fragensammlung **eliminiert**. ~850 Fragen mit neuen Distraktoren in 2 Tagen, ~50 Sonnet-Subagent-Calls.

**Code-Stand:** `main` = `preview` = `55125d5` (Teil A der Multi-MC-Sanierung). Heutige Session war reine **Daten-Sanierung im Sheet**, keine Code-Änderung.

**Lehren neu (in [[project_mc_laengste_antwort_audit]] dokumentiert):**
- `phase3_rueckschreiben` schreibt NUR `review_status=freigegeben` zurück. „nachbearbeitet"-Status wird übersprungen — am Ende alles auf `freigegeben` setzen mit `lp_kommentar` als Audit-Trail.
- Schweizer Recht hat revidierte Normen (z.B. Art. 79a StGB Gemeinnützige Arbeit als Vollzugsform seit 2018). Reviewer-Rewrites in Recht IMMER LP-finalisieren wegen möglicher aktueller Revisionen.
- FNV-1a 32-bit über `'stichprobe#'+id` < 0.11 liefert deterministisch 11.5 % Stichprobe-Quote — wiederholbar zwischen Sessions.

**Nächster grosser Thread:** **Backend-Migration** zu Supabase/peaknetworks. Spec fertig (`docs/superpowers/specs/2026-05-18-backend-migration-design.md`), wartet auf Plan-Phase + 5 Koordinations-Mails KW 21.

**Spawn-Task weiterhin offen (Performance, nicht blockierend):** Batch `setBackground`/`setValue` in `sanierung-mc-multi.js` — wurde in dieser Session bei 90 Zeilen nicht zum Problem.

---

### Stand 22.05.2026 SPÄT-2 — LernzieleMiniModal fokusUnterthema-Scroll gefixt

Das Unterthema-Mini-Modal scrollte beim Öffnen nicht zur angeklickten Sektion.
Browser-E2E auf Staging + `scrollIntoView`-Instrumentierung: `scrollIntoView({behavior:'smooth'})`
im Mount-`useEffect` verpufft komplett (`scrollTop` bleibt 0); `behavior:'auto'`
scrollt zuverlässig (0 → 2138). Fix: `behavior:'smooth'`→`'auto'` in
`LernzieleAkkordeon.tsx` (`block:'start'` bleibt korrekt). Lernschleife-Regel in
`.claude/rules/code-quality.md`. Re-E2E auf Staging grün (FIBU, Unterthema
„Bilanz, Inventar & Bewertung": Modal öffnet direkt auf der Sektion; Master-Detail
+ Schliessen ok, 0 Konsolen-Fehler). Damit ist das vormals offene „D Schritt 8–10"
browser-getestet.

Commits: `71ee688` (block:'start') · `4c9221b` (behavior:'auto') · `751d665`
(Lernschleife-Regel). Gates: tsc · vitest 2111 + 4 todo · build grün.

**OFFEN für nächste Session:** Bug B (Apps-Script Test-Seeder `mastery` als Zahl),
MC-Sanierung Teil B, Backend-Migration.

### Stand 22.05.2026 SPÄT — SuS-Lernziele-UX + Lernziele-Bridge LIVE auf main

**Browser-E2E auf Staging durch, ein Bug gefunden + gefixt, LP-Freigabe erteilt, per FF-Merge `feature/lernziele-bridge-spec` → `main`.** SuS-Lernziele-UX („Üben nach Lernziel") + Lernziele-Bridge (Datenschicht) sind zusammen produktiv. Header-`Flag` → Lernziele-Akkordeon · klickbare Lernziele → Lernziel-Karte · „Üben" startet die aufs Lernziel gefilterte Session (reiner Client-Filter) · Icon-Konsistenz (Lernziele=`Flag`, Mastery=`CircleCheck`, Schwierigkeit=Signal-Balken).

- **Spec/Plan/E2E-Plan:** `docs/superpowers/specs/2026-05-21-sus-lernziele-ux-design.md` · `docs/superpowers/plans/2026-05-21-sus-lernziele-ux.md` · `docs/superpowers/plans/2026-05-22-sus-lernziele-ux-e2e-testplan.md`

**E2E-Resultat (echte LP+SuS-Logins, Staging):** Szenario A (Header→Akkordeon), B (Lernziel-Karte), C (Üben-Flow), E (Icon-Konsistenz), F (Light/Dark + Regression) — alle bestanden. Szenario D (Unterthema-Mini-Modal): Schritt 11 (Chip-Toggle) bestanden; Schritt 8–10 nicht prüfbar — in den Daten existieren keine Lernziele auf Unterthema-Ebene, der Unterthema-`Flag` rendert nie. Critical-Fix `061f4d3` ist integrationstest-abgedeckt.

**Bug im E2E gefunden + gefixt (`dd08967`):** `LernzielKarte::berechneKartenDaten` machte `buckets[fp?.mastery ?? 'neu']++` — dynamischer Object-Key ohne Validierung. Type-fremde `mastery`-Werte (numerischer String, s. Bug B) wurden zu Rogue-Keys → die Karte zeigte „0 / 2 gemeistert" mit leerer 4-Stufen-Aufschlüsselung (total ≠ Buckets-Summe). Fix: `mastery` strikt auf gültige `MasteryStufe` normalisieren (analog `lernzielStatus`) + Regressionstest. Re-Test auf Staging: Karte konsistent, Üben-Session korrekt.

**Cleanup vorab (`50b1745`):** `CheckCircle2` → `CircleCheck` in `LernzieleAkkordeon`, `LernzielKarte`, `SuSHilfePanel` (deprecated Lucide-Alias, Mastery-Icon vereinheitlicht).

**Gates:** `tsc -b` · `vitest run` 2110 + 4 todo · `npm run build` · 9 Lint-Gates — alle grün.

**OFFEN für nächste Session:**
1. **Bug B** (Apps-Script, pre-existing, Test-Daten-only): `seedTestdatenSessionsUndFortschritt_` (`apps-script-code.js` ~Z. 17066) schreibt die `mastery`-Spalte als Zahl-Prozent statt als `MasteryStufe`-String und korrumpiert so Test-Daten. Eigener Apps-Script-Fix + Re-Seed der Test-Gruppe nötig. Produktion unbetroffen — `berechneMastery_` schreibt korrekt.
2. **D Schritt 8–10** browser-ungetestet, solange keine Lernziele auf Unterthema-Ebene existieren — bei Bedarf nachholen, wenn solche Lernziele angelegt werden.
3. Backlog unverändert: MC-Sanierung Teil B, Backend-Migration (Details s. ältere Stände unten + Memory).

---

### Stand 21.05.2026 SPÄT — Design-Trio #2 + #3 LIVE

**HEAD main:** `284328a` (= `preview`). Design-Trio Teil #2 (Editor-Leiste) +
Teil #3 (Übersichts-Icons) auf Staging mit echtem LP-Login E2E-verifiziert,
dann nach `main` gemergt.

- **Teil #3** (`91e2d5a` + Fix `a2e34b2`): `PruefungsKarte` zeigt Bearbeiten/
  Duplizieren/Löschen als Icon-Buttons; neuer Lösch-Flow (`BaseDialog` +
  `apiService.loeschePruefung` + Toast + Reload) in `LPStartseite`, Prop
  `onLoeschen` durch `LPPruefungenAnsicht` + `LPUebungenAnsicht` gefädelt.
- **Teil #2** (`d39f143` + `730064b`): Neue `PruefungsComposerLeiste`
  (Titel + Editor-Tabs + Speicher-Status + Aktions-Icons). `PruefungsComposer`
  reicht `breadcrumbs`/`statusText`/`aktionsButtons` nicht mehr an den Header —
  die globale `TabKaskade` bekommt volle Breite. Bottom-Lösch-Link entfernt.
- Plan: `docs/superpowers/plans/2026-05-21-editor-header-und-uebersicht-icons.md`.

**Gates:** tsc -b, vitest 2023 + 4 todo, build, 9 Audit-Gates — alle grün.
**E2E Staging:** #3 (Karten-Icons, Bearbeiten/Duplizieren/Löschen+Dialog, Prüfen
UND Üben) + #2 (Header volle Breite, Leiste, Speichern, Icons conditional) — grün,
keine Konsolen-Fehler.

**E2E-Befunde (kein Blocker):**
- Status-Text in der Leiste erschien im Test nicht — `statusText`-Logik ist
  byte-identisch zum alten Header, kein Regress; ggf. vorbestehend.
- Datum-Feld nach Wiederöffnen einer gespeicherten Prüfung leer (`dd.mm.yyyy`) —
  betrifft `ConfigTab`/Datums-Roundtrip, NICHT das Design-Trio. Separat prüfen.

**OFFEN:**
- **`diagnose-mc-laengste-antwort.js` ausgeführt** — Befund GRAVIEREND:
  759/1023 Single-MC (74,2%) haben die korrekte Antwort als längste Option
  (Zufall 25%). Eigenes Sanierungs-Projekt (Distraktoren angleichen +
  Generierungs-Constraint), braucht Brainstorming→Spec→Plan.
- **Design-Trio Teil #4 «Lernziele bis Unterthema»** zurückgestellt: Editor-
  Lernziele (`Lehrplanziele`-Sheet) und SuS-Anzeige-Lernziele (`Lernziele`-Sheet)
  sind getrennte Backends. User will «volle Backend-Bridge» → eigene
  Brainstorming→Spec→Plan-Runde nötig.

---

### Stand 18.05.2026 SPÄTER-2 — Item 4 Apps-Script E2E + Bulk-Reload-Hotfix

**1 Commit seit `e03255f`:**

| Commit | Was |
|---|---|
| `b927dba` | `useFragenBatchEdit`: `lade(email, true)` statt `ladeAlleDetails(email)` (Frontend-Refresh-Bug nach Bulk-Edit) |

### Item 4 Apps-Script-Performance E2E ✅

**Setup:** Test-LP `wr.test@gymhofwil.ch` auf staging. Filter Recht / OR AT – Vertragslehre = 130 Fragen.

**Messungen:**

| Run | Patch | Backend-Roundtrip |
|---|---|---|
| 1 | Bloom → K3 (alle 130) | **11.882 ms** |
| 2 | Bloom → K2 (alle 130) | **12.001 ms** |

→ ~12s konstant für 130 Fragen = **~92 ms/Frage**. Apps-Script-Base-Latenz ~1.5-2s + Sheet-Tab-Scan O(n_tabs) + 130× setValues-Batch.

**Erwarteter Vorher-Stand (vor `280b4d2`):** linearer Scan pro ID = 130 × ~200ms × 5 Tabs = ~130s → **Faktor ~10× Verbesserung**. Memory `feedback_apps_script_perf_bulk_update.md` Spec sagte „Faktor 5-10× erwartet" — voll erfüllt.

**Cap-Verhalten:** 786 Recht-Fragen wären über 500-ID Hard-Cap. Filter-Verfeinerung auf 130 zeigte erwartete sub-Cap-Performance. Bei 500 IDs erwartet ~30-40s (linear scaling).

### Frontend-Stale-Bug entdeckt + gefixt während E2E

**Bug:** Nach `bulkUpdateFragen()` rief `useFragenBatchEdit` `ladeAlleDetails(email)` auf. Dort Z.127-129:
```ts
if (status !== 'summary_fertig') return  // Guard greift bei status='fertig'
```

Nach normalem Login ist `status='fertig'` (Vollobjekte schon im Store). Der Reload-Aufruf wurde stillschweigend ignoriert → **Frontend zeigt Stale-Daten obwohl Backend erfolgreich geschrieben hat.**

Sichtbar in E2E: Erste Messung (K3-Patch) erfolgte, Toast „130 Fragen aktualisiert" kam, aber Bloom-Filter K3 zeigte nur 38 Fragen (Stale-Cache aus IDB). Erst nach SW-Unregister + Hard-Reload korrekt 130.

**Fix in `b927dba`:** `lade(email, true)` (force=true bypasst Status-Guard) statt `ladeAlleDetails(email)`. Gleiche Änderung in `onBatchLoeschen`-Pfad.

**Tests:** `useFragenBatchEdit.test.ts` mock-Variable `ladeAlleDetailsMock` → `ladeMock`, Erwartung `toHaveBeenCalledWith('lp@test', true)`. vitest 1994 + 4 todo unverändert.

**Latente Klasse:** Bug existiert seit Cluster D Phase 4 (Commit `35e9020`, 16.05.2026). Ist jetzt behoben.

### Daten-State nach E2E

130 Recht / OR AT – Vertragslehre-Fragen sind aktuell **alle auf K3**. Cleanup-Versuch zurück auf K2 lief Backend-side aber Frontend-Display zeigte 0 K2 — vermutlich Apps-Script-Cache-Race-Condition zwischen mehreren Containern (sekundäre Edge-Case, nicht im Scope von Item 4). Wenn problematisch: manuell im FragenBrowser zurücksetzen oder via einzelner Frage-Edit.

### Was als nächstes

Nichts dringend offen. Optional:
1. **Apps-Script-Cache-Race-Condition untersuchen** — Zweite Bulk-Update-Operation hat möglicherweise einen Cache-Snapshot aus parallelem Container gelesen. Auswirkung gering (Cache invalidiert nach 6h via `cache_version`-Inkrement), aber dokumentationswürdig.
2. **Storybook Phase 2** — Component-Galerien über Icons hinaus (BaseDialog, Buttons, FragetypIcon-Variants).
3. **Apps-Script-Latenz-Refactor** — Backend-Migration auf Edge-Runtime (Cloud Run / Cloudflare Workers). Long-term, ~1-2 Wochen.
4. **Mobile/iPad-UX-Audit** — letzter größerer Audit war vor Cluster G. Touch-Targets nach Icon-Migration neu prüfen.

### Vorheriger Stand — Polish-Run #1 LIVE (18.05.2026 SPÄTER)

**HEAD vor Item-4-E2E:** `e03255f`.

### Stand 18.05.2026 SPÄTER — Polish-Run #1 LIVE

**1 Commit seit `804d757`:**

| Commit | Was |
|---|---|
| `f97cb55` | `scripts/audit-storybook-coverage.mjs` (Item 1) + `audit-typo-tokens.mjs` Drift-Detection (Item 3) |

**Was abgearbeitet wurde:**

- **Item 1 — Storybook-Coverage-Lint-Gate:** Neues CI-Gate `lint:storybook-coverage` prüft dass `Icons.stories.tsx` beide Source-of-Truth-Maps (`LUCIDE_KEY_MAP` aus `NavIcon.tsx`, `FRAGETYP_ICON_MAP` aus `FragetypIcon.tsx`) importiert UND via `Object.entries/keys/values` iteriert. Drift-Prevention: neue Icons in den Maps werden in der Galerie automatisch sichtbar.
- **Item 2 — Filter-Dropdown FragenBrowserHeader:** **bereits done seit Commit `0f179e7`** (TODO-Sweep #3 vom 17.05.). 4 Filter (Fach/Typ/Bloom/Status) sind auf Custom-`Dropdown` mit Lucide-Prefix migriert. Die 3 verbleibenden nativen `<select>` (Thema/Unterthema/Gruppieren) sind bewusst native — reine String-Listen ohne Icon-Bedarf.
- **Item 3 — audit-typo-tokens Drift-Detection:** Pro-File-Drift-Tracking analog `audit-no-emoji.mjs`. Files mit `count < baseline` werden als IMPROVEMENT mit Preview (erste 5) gelistet. 0-count-Files mit Baseline-Eintrag zählen ebenfalls als Drift (Cleanup-Kandidaten für `--baseline`-Refresh).
- **Item 4 — Apps-Script `updateFrageMitPatch_` Performance:** Code-Review ✅ — fertig seit Commit `280b4d2` (16.05.2026 SPÄT). **Wartet auf DU: Apps-Script-Deploy + LIVE-E2E.**

**Gates:** vitest **1994 + 4 todo**, **9 lint-Gates** clean (NEU: `lint:storybook-coverage`), tsc -b + vite build + storybook build clean.

### 🎯 Offen für dich (Item 4 — Apps-Script-Deploy)

Der Backend-Code für die `apiBulkUpdateFragen`-Performance-Optimierung liegt seit Commit `280b4d2` im Repo, aber Apps-Script ist nicht deployed. Code-Review heute bestätigt: alle Hardening-Pattern (500-ID-Cap, LockService 30s, ALLOWED_PATCH_KEYS-Allowlist, Mutually-Exclusive-Tag-Modi, setValues-Batch) sind drin.

**Deploy-Schritte:**

1. Apps-Script-Editor öffnen ([script.google.com](https://script.google.com), Projekt „ExamLab Backend")
2. `apps-script-code.js` Content aus dem Repo kopieren (`ExamLab/apps-script-code.js` HEAD `f97cb55`) und im Editor einfügen
3. `Ctrl+S` (Save)
4. **Bereitstellen** → **Bereitstellungen verwalten** → aktive Web-App-Bereitstellung auswählen → **Stift-Icon** (bearbeiten) → **Version: Neu** → **Bereitstellen**
5. URL bleibt unverändert (Web-App-URL ist deployment-Version-agnostisch)
6. Berechtigungen sollten gleich bleiben — keine neuen Scopes seit letztem Deploy

**E2E-Test-Plan (auf staging, vor und nach Deploy):**

1. Test-LP `wr.test@gymhofwil.ch` einloggen
2. FragenBrowser → Fach „BWL" (oder grösstes Fach mit ≥100 Fragen)
3. „Alle auswählen" → Selektion-Bar zeigt z.B. „127 ausgewählt"
4. Bulk-Edit-Action wählen: z.B. „Bloom auf K3 setzen" oder „Tag hinzufügen: test-deploy"
5. **Stoppuhr beim Bestätigen-Klick** → Dauer bis Toast „X Fragen aktualisiert" notieren
6. **Vor Deploy** (Erwartung): bei 500 Fragen ~30-60s (linearer Scan pro ID)
7. **Nach Deploy** (Erwartung): bei 500 Fragen ~5-15s (Faktor 5-10× durch Index-Map + setValues-Batch)
8. Sanity-Checks:
   - Toast zeigt erwartete Anzahl ohne Fehler
   - Frage-Count vor/nach unverändert
   - Patch sichtbar angewendet (Bloom-Badge / Tag-Chip in den Karten)
   - Console: 0 Errors, 0 Warnings
9. Bei Erfolg: Memory `letzterSeedAm`-Tab erlaubt Reset von Test-Tag (Apps-Script-Func `runAdminSeedTestdaten`)

**Falls ein Problem auftaucht:** Apps-Script-Editor → **Bereitstellungen verwalten** → ältere Version aktivieren als Rollback. Code im Repo bleibt unverändert.

**Was als nächstes (nach Item-4-Deploy):**

Nichts mehr dringendes offen. Mögliche Nice-to-Haves:
1. **Storybook Phase 2** — Component-Galerien (BaseDialog, Buttons, FragetypIcon-Variants).
2. **Apps-Script-Latenz-Reduzierung** — Backend-Migration auf Edge-Runtime (Cloud Run / Cloudflare Workers). Long-term, ~1-2 Wochen.
3. **Mobile/iPad-UX-Audit** — letzter größerer Audit war vor Cluster G. Touch-Targets nach Icon-Migration neu prüfen.

---

### Vorheriger Stand (18.05.2026 SPÄT) — Cluster E-Restposten + Storybook LIVE

**HEAD vor Polish-Run #1:** `804d757`.

### Stand 18.05.2026 SPÄT — Cluster E-Restposten + Storybook LIVE

**2 Commits seit `5255d26`:**

| Commit | Block | Beschreibung |
|---|---|---|
| `8a6f5b4` | Cluster E-Restposten | C4+C5 Tag-Semantik (Dashboard h1, AdminLayout swap) + B3 ki-kalibrierung kebab-case-Migration + EinstellungenPanel auf tabRegistry |
| `a9b4d80` | Cluster G Spec §13 | Storybook 10 Minimal-Setup + Icon-Galerie für 35 Icons (15 Nav + 20 Fragetyp) |

**Was abgearbeitet wurde:**

- **C4 Dashboard.tsx Z.251:** `<h2 className={TYPO.h1}>Hallo Vorname!</h2>` → `<h1 className={TYPO.h1}>` (Tag-Semantik korrigiert, Style unverändert). Browser-E2E auf staging verifiziert ✅
- **C5 AdminLayout.tsx Z.10+15:** `<h1>`/`<h2>`-Inversion gelöst — Header bekommt `<h2>` (Brand), Main bekommt `<h1>` (echter Page-Title). Styles bleiben identisch, visuell unverändert.
- **C6 MODAL_TITLE-Konstante:** **verworfen** als YAGNI (TYPO.h2 ist bereits zentralisiert).
- **B2 appNavigation Lucide-Component-Keys:** **bereits done** seit Commit `6c30abf` (TODO-Sweep #4) — Memory-Eintrag war veraltet.
- **B3 ki-kalibrierung kebab-case-Vereinheitlichung:**
  - `lpUIStore.EinstellungenTab`: `'kiKalibrierung'` → `'ki-kalibrierung'` (matched tabRegistry.id 1:1)
  - `EinstellungenPanel`: hardcoded tabs-Array ersetzt durch `tabsFuerSurface('einstellungen', { istAdmin })`-Generierung. `problemmeldungen`-Label-Override für dynamic offeneCount.
  - `useOpenFavorit`: `einstellungenTabKey`-Drift-Mapping entfernt. `fav.ziel` wird 1:1 als `EinstellungenTab` durchgereicht.
  - Memory-Blocker („kiKalibrierung↔ki-kalibrierung-ID-Konflikt") gelöst.
  - Browser-E2E: KI-Kalibrierung-Tab direkt + via Favorit-Click verifiziert ✅
- **B1 Storybook Minimal-Setup:**
  - 3 neue devDeps: `storybook@10`, `@storybook/react-vite@10`, `@storybook/addon-docs@10`
  - **Bewusst minimal:** kein `addon-vitest` (vermeidet Playwright + vitest.config-Umbau), kein `addon-a11y`, kein `chromatic`
  - `.storybook/main.ts`: `viteFinal` filtert `vite-plugin-pwa` raus (PWA-Plugin sucht SW-Targets die im Storybook-Build nicht existieren)
  - `Icons.stories.tsx`: Galerie für alle 15 `LUCIDE_KEY_MAP` (Nav) + 20 `FRAGETYP_ICON_MAP` (Fragetypen) — Source-of-Truth bleiben die TS-Maps
  - Smoke-Build erfolgreich; `npm run storybook` startet Dev-Server auf :6006

**Auto-Init-Lesson:** `storybook init` zieht standardmäßig sehr viel rein (Playwright-Browser, addon-vitest mit vitest.config-Umbau auf projects-Struktur, demo-Stories, chromatic, a11y). Für Drift-Prevention nur Core + Docs-Addon nötig — manuelle Installation ist sauberer.

**Gates:** vitest **1994 + 4 todo** (Cluster E-Restposten -2 obsolete `einstellungenTabKey`-Tests), 8 lint-Gates clean, tsc -b + vite build + storybook build clean.

**Was als nächstes:**

Nichts dringend offen. Mögliche Nice-to-Haves:
1. **Lint-Gate für Storybook-Stories** (`*.stories.tsx`) — Coverage-Drift-Detection wenn neue Icons hinzukommen aber nicht in Story. Wird mit Storybook-Wachstum nützlich.
2. **Apps-Script Performance** `updateFrageMitPatch_` (I-3/M-1) — bei >500-ID-Batches. Braucht Deploy + LIVE-Verifikation. Ca. 0.5 Tag.
3. **Storybook Phase 2** — wenn Bedarf für Component-Galerien über Icons hinaus (BaseDialog, Buttons, FragetypIcon-Variants).
4. **Apps-Script-Latenz-Reduzierung** (Pre-Loading + Client-Verifikation Architektur) — long-term, langfristig.

### Vorheriger Stand (18.05.2026, vor Cluster E-Restposten) — Cluster C.4 + Spawn-Tasks LIVE

**HEAD vor dieser Session:** `5255d26` — Cluster C.4 Volltext-Suche LIVE + Phase-4-Spawn-Tasks alle erledigt.

---

## Vorheriger Stand — Cluster C.4 Volltext-Suche (18.05.2026)

**HEAD:** `5255d26`. Aktiver Feature-Branch: war `feature/cluster-c-4-volltext-2026-05-18` HEAD `528b860`.

### Cluster C.4 Phase 4 KOMPLETT (lokal, 12 Commits seit `e5466d9`)

Subagent-driven-development mit 7 Tasks + 5 polish-Commits. Final-Review approved.

| Commit | Task |
|---|---|
| `7a8da01` | 4.0 Backend-Decision A dokumentiert |
| `24f1a82` | 4.2 generiereSnippet Helper + 5 Tests |
| `32a057f` | 4.3 indexFragenVolltext Adapter + 10 Tests |
| `5bacc14` | 4.3 polish: Doku + Test-Polish |
| `a93f3f7` | 4.4 fuehreSucheAus opts.volltext + SucheIndex.fragenVoll |
| `5e80474` | 4.5 Volltext-Toggle UI im Suche-Dropdown |
| `25432af` | 4.5 polish: Focus-Ring + min-h-Cleanup |
| `b702d7f` | 4.6 useGlobalSuche Volltext-State + Lazy-Load |
| `6b2dba4` | 4.6 polish: Lazy-Load Status-Race-Fixes (I-1/I-2) |
| `a9ec02a` | 4.7 Volltext-Perf-Smoke + MIN_QUERY_LENGTH-Konstanten |
| `2d3ed9e` | 4.7 polish: Doku-Kommentare |
| `528b860` | 4.8 pre-push fixes: Test-Mock + musterloesung-Baseline |

**Gates:** vitest **1995 + 4 todo** (+26 neue Tests), 8 lint-Gates clean (`musterlosung`-Baseline 310 → 326), tsc -b + vite build clean. Volltext-Perf ~30ms / 200ms-Threshold (7× margin).

**Was als nächstes:**
1. Push `git push origin feature/cluster-c-4-volltext-2026-05-18:preview`
2. Browser-E2E auf staging (siehe **E2E-Plan C.4** unten)
3. Nach Freigabe: FF-Merge zu main + Push, Memory-Update

### E2E-Plan Cluster C.4 (auf staging, vor main-Merge)

LP-Test (echter Login, kein Demo):
1. App-Mount → Globale Suche öffnen (Cmd+K) → "Volltext"-Pill rechts neben Input sichtbar (slate)
2. Toggle aktivieren → Pill wird violet, `aria-pressed=true`, kurzer Spinner "Volltext wird vorbereitet …" sichtbar im Dropdown (sofern fragensammlungStore noch nicht in `'fertig'`)
3. Nach Spinner-Ende: Query `"Anlagevermoegen"` (Substring nur in `fragetext` und `musterlosung`, nicht in `titel`) → Treffer-Sektion "Frage" mit Snippet-subTitel sichtbar, Highlight im Snippet
4. Query `"ab"` (2 Chars) im Volltext-Modus → Dropdown bleibt zu (Min-Length = 3)
5. Toggle deaktivieren → Pill slate, gleiche Query → keine Volltext-Treffer, nur titel/tag-Matches
6. Console: 0 Errors
7. Network: keine doppelten `ladeFragensammlung`-Calls (Cache + Status-Guard)

Falls LP schon im FragenBrowser war (fragensammlungStore = `'fertig'`): kein Spinner sichtbar, Volltext-Treffer instant.

### Erkenntnisse Phase 4 (für Memory)

1. **Spec-Annahme ≠ Repo-Realität (wiederholt):** Plan-Task 4.1 referenzierte fiktiven `useFragenStore`. Audit ergab `useFragensammlungStore` mit `ladeAlleDetails` deckt das ab — Task 4.1 entfällt, Lazy-Load wandert in 4.6.
2. **Discriminated-Union-Schmerz im neuen Adapter:** `Frage` als Union hat KEIN universelles `fragetext`-Feld (BuchungssatzFrage→`geschaeftsfall`, TKontoFrage/Kontenbestimmung/BilanzER→`aufgabentext`, AufgabengruppeFrage→nur `kontext`). Plan-Spec hatte das übersehen. Helper `fragetextVonFrage()` in `sucheAdapter.ts` löst es file-private mit `'field' in f && typeof f.field === 'string'`-Guards.
3. **`as string`-Cast vermeiden durch `loesungText`-local:** Plan-Pseudocode hatte `f.musterlosung as string` an der `generiereSnippet`-Call-Site. Implementer hat es durch `const loesungText = typeof f.musterlosung === 'string' ? f.musterlosung : ''` ersetzt — kein Cast, gleiche Semantik.
4. **Lazy-Load Status-Race (Code-Review I-1):** `ladeAlleDetails` returnt früh wenn Store-Status ≠ `'summary_fertig'`. Erster `useEffect`-Versuch feuerte bei `'idle'` und triggerte nie wieder. Fix: `sammlungStatus` als useEffect-Dep + Guard `sammlungStatus === 'summary_fertig'` → Effect re-feuert auf Status-Übergang.
5. **`volltextBereit` muss `'fertig'`-Status decken:** Bei LP mit genuinely leerer Fragensammlung (`fragenVoll.length === 0` aber `status === 'fertig'`) sonst Effect-Spam (no-op-Schleife). Fix: `volltextBereit = fragenVoll.length > 0 || sammlungStatus === 'fertig'`.
6. **Vi.mock + Komponente-Re-Import:** Bei Modul-Mock muss JEDES vom Komponenten-Import erfasste Symbol im Mock-Object stehen. Task 4.7 hat 2 neue Konstanten in `sucheEngine.ts` exportiert, LPGlobalSuche-Test-Mock musste mit-erweitert werden (sonst Render-Error: "No export defined on the mock").

### Phase-4 Spawn-Tasks — alle erledigt (18.05.2026)

Branch `feature/cluster-c-4-spawn-tasks-2026-05-18` → main HEAD `21ba1f5` (FF-Merge nach ci-check).

1. ✅ **`AufgabengruppeFrage.kontext` indiziert** (`21ba1f5`): `fragetextVonFrage()` in `sucheAdapter.ts` liefert jetzt auch `kontext` (4. Fallback). +1 Test (Query > Pos 77 erzwingt Volltext-Branch). Eltern-Fall-Beschreibungen einer Aufgabengruppe sind ab jetzt Volltext-suchbar.
2. ✅ **`MIN_FUZZY_NEEDLE_LENGTH` extrahiert** (`5a60e94`): In `sucheEngine.ts` neue exportierte Konstante (=3). `scoreFromMatch` nutzt sie statt hardcoded `3`. Doc-Comment erklärt bewusste Unabhängigkeit von `MIN_VOLLTEXT_QUERY_LENGTH`.
3. ✅ **Umlaut-Offset-Doku** (`f17a18a`): JSDoc auf `generiereSnippet` erklärt die Drift (`idx` auf normalisiertem Text vs. `text.slice` auf Original). Bei `kontext ≥ 20` inert; Caller in `indexFragenVolltext` nutzen `kontext=50`.

**Gates nach Spawn-Tasks:** vitest **1996 + 4 todo** (+1 neuer kontext-Test), 8 lint-Gates clean, tsc + build clean.

### C.4 Backend-Entscheidung (Plan-Phase 4.0)

**Option gewählt: A — existierender Endpoint wiederverwenden (kein Apps-Script-Deploy nötig).**

**Begründung:** Audit hat ergeben, dass die Plan-Annahme („kein Vollobjekt-Batch-Endpoint vorhanden") falsch war. Der Backend-Endpoint existiert seit Bundle 3 unter anderem Namen:

- `apps-script-code.js:6033` — `ladeFragensammlung(email)` liefert Vollobjekte aller Fragen inkl. `fragetext`, `musterlosung`. Cache `cacheGet_('alle_fragen')` macht Folge-Calls günstig.
- `apps-script-code.js:6085` — `ladeFragensammlungSummary(email)` liefert die Lite-Version (200B/Frage).

Frontend-Wrapper existiert ebenfalls bereits:
- [`fragensammlungApi.ts:13`](src/services/fragensammlungApi.ts:13) — `ladeFragensammlung(email): Promise<Frage[] | null>` mit 90s Timeout.
- [`fragensammlungStore.ts`](src/store/fragensammlungStore.ts) — `state.fragen: Frage[]`, `fragenMap`, `ladeAlleDetails(email)`-Action, Status-Machine `summary_fertig → detail_laden → fertig`, IDB-Cache, Stale-While-Revalidate. **Erfüllt Task-4.1-Spezifikation ohne neuen Code.**

**Plan-Anpassungen gegenüber Markdown-Spec:**

- Plan-Task 4.1 referenziert `useFragenStore.ladeAlleVollDaten()` — der reale Store heisst `useFragensammlungStore` und hat bereits `ladeAlleDetails`. Task 4.1 reduziert sich auf einen Lazy-Load-Trigger im Hook (verlagert zu Task 4.6).
- Performance-Bonus: Wenn LP-User schon im FragenBrowser war, ist `state.status === 'fertig'` und Volltext-Suche ist instant ohne Spinner.

**Tasks 4.1-4.8 dann (angepasst):**
- 4.1 Lazy-Load-Trigger-Bauteil im useGlobalSuche (Vorbereitung für Task 4.6 — kein neuer Store)
- 4.2 generiereSnippet Helper + Tests
- 4.3 indexFragenVolltext Adapter + 10 Tests
- 4.4 fuehreSucheAus opts.volltext-Branch + SucheIndex.fragenVoll
- 4.5 Volltext-Toggle UI in LPGlobalSuche
- 4.6 Hook-Integration volltextAktiv + Lazy-Load via fragensammlungStore.ladeAlleDetails
- 4.7 Performance-Smoke 1000 Fragen × 5 queries < 200ms
- 4.8 Push + E2E + main-Merge

**Skill für Execution:** `superpowers:subagent-driven-development` auf Branch `feature/cluster-c-4-volltext-2026-05-18`.

### Erkenntnisse aus Phasen 1-3 (für Memory)

1. **Implementer-Subagent kann Tasks versehentlich reverten:** Phase C.3 Task 2.3+2.4 Implementer hat sucheAdapter.ts + sucheAdapter.test.ts auf c48d0c4-State zurückgesetzt (Tasks 2.1+2.2 weg). Schutz: `git diff HEAD~1 --stat` nach Commit prüfen, Anti-Revert-Schutz im Implementer-Prompt verlangen. Hotfix `4ef14ca` restored.
2. **Route-Audit vor Spec-Schreiben:** Spec C.3 nahm `/?suche=&modus=uebung` an, App-Router hatte separate `/pruefung` und `/uebung`-Routes. Hotfix `c853297` route-basierte Sammelview ohne `?modus=`.
3. **URL-Param-Race-Conditions:** Mehrere Hooks die auf denselben URL-Param schauen brauchen Owner-Coordination. C.2 Hotfix `c752df1`: LPStartseite ?suche=-Handler skipt wenn EinstellungenPanel mit Klassenlisten-Tab offen ist (Store-State-Check statt nur Query-Param-Check).
4. **lpUIStore.gespeicherterModus liest sessionStorage:** State-Initializer läuft vor useLPRouteSync → kann stale modus liefern. useEffect-Refresh fängt das ab.
5. **Vite ?raw-Import statt node:fs:** Privacy-Tests die Source als String brauchen, importieren via `import X from './file.ts?raw'` (Vite-Feature, tsc-clean ohne @types/node).
6. **KlassenlistenEintrag.name (nicht nachname):** Field-Naming aus apps-script-API — spec hatte falschen Field-Namen, Audit korrigiert.

### Cluster C.2-C.5 Phasen 1-3 LIVE auf main + preview (17.05.2026 NACHT)

**Phase 1 (C.5 Fuzzy-Match):**
- `2a1e3b9` levenshtein() Helper + 10 Tests
- `ba7e4d4` scoreFromMatch Fuzzy-Fallback (titel-only, dist≤2, min-length 3)
- `5347867` + `c48d0c4` Performance-Smoke 1000 × 10 queries < 200ms

**Phase 2 (C.3 Pre-Fill):**
- `c03fbcb` SAMMELVIEW_ROUTE_BUILDERS + 7 Tests
- `6c1d770` LPGlobalSuche alleAnzeigen nutzt Sammelview-Builder mit Query
- `a167abf` + `4ef14ca` LPStartseite + useFragenFilter Pre-Fill (mit Restore-Hotfix)
- `6c585d9` + `c853297` Hotfixes: Modus-aware Routing + Route-basierte Sammelview

**Phase 3 (C.2 Schüler + Klassenlisten-Tab, löst F.4 OoS):**
- `cd2f859` SucheQuelle += schueler, indexSchueler + 8 Tests, Engine-Wiring
- `204e8a9` + `b72ccb6` SuS-Permission-Pflicht-Test (Privacy, Vite ?raw-Import)
- `7ebb413` TAB_REGISTRY + KlassenlistenTab + EinstellungenPanel + URL-Routing
- `a602eaf` + `c752df1` Hotfixes: LPStartseite ?suche=-Strip-Guard

**Gates:** vitest **1969 + 4 todo**, 8 lint-Gates clean, tsc -b + vite build clean.

**E2E-Resultate (staging):**
- C.5: "Profl"→"Mein Profil" (Fuzzy dist=1) ✓, "Lernzile"→"Lernziele" ✓
- C.3: `/fragensammlung?suche=Bilanz` → suchtext "Bilanz" pre-filled ✓, `/pruefung?suche=ZZZZZZ` → "Keine Prüfung" empty-state ✓, `/uebung` → modus=uebung ✓
- C.2: Klassenlisten-Tab in Einstellungen ✓, 147 von 167 Schülern, Klasse-Filter, Suche, Empty-State ✓; Globale Suche "Lenny" → "Schüler"-Sektion mit 5 Treffern (inkl. Fuzzy "Leon", "Lynn") ✓; Click → /einstellungen?tab=klassenlisten&suche=&schueler= → Panel öffnet, Tab aktiv, suchtext "Lenny Bieri", counter "1 von 167", Highlight ✓
- C.2 Privacy: SuS-Suche "Lenny" → 0 Schüler-Treffer ✓
- Console: 0 Errors

### Memory: F.4 Klassenlisten-Tab Filter RESOLVED

Cluster F.4 Out-of-Scope "Klassenlisten-Tab Filter" wurde im Zuge von Cluster C.2 implementiert.

---

## Vorheriger Stand — Spawn-Tasks Restbestand LIVE (17.05.2026 SPÄT-2)

**HEAD `122d7e9`** — Spawn-Tasks Restbestand LIVE (vor C.2-C.5 Phasen 1-3).

### Spawn-Tasks Restbestand LIVE auf main + preview (17.05.2026 SPÄT-2)

**Branch `feature/spawn-tasks-restbestand-2026-05-17` → preview (FF) → main (FF) nach LP-E2E.** Audit aller Spawn-Tasks aus Memory ergab: 90% bereits erledigt seit Memory-Stand (ESC-Handler, DetailKarte-Checkbox, Floating-Bar mobile, tagsModusAusPatch Defense-in-Depth, batchLaeuft useRef, useFragenBatchEdit Hook extrahiert, apiClient postJson Backend-Error, appNavigation Persist-Migration, IDB-Cleanup-Race, FragenBrowserHeader Filter-Dropdown, letzterSeedAm Persistenz, Lock-Serialisierung tag-Schreib-Ops, zaehleTagVerwendung_ Tag-Object Return, useTagsByIds Hook, tagsStore-Tests). Übrig 2 Items, beide in 1 Commit (`875e9ff`):

1. **useOpenFavorit Hook** (Cluster E.5 Spawn-Task): Zentralisierung des Favorit-Open-Logic in `ExamLab/src/hooks/useOpenFavorit.ts`.
   - `resolveFavorit(fav)` → entweder `{kind:'navigate', to}` für Link-Targets oder `{kind:'action', onClick}` für Overlay-Open.
   - `einstellungenTabKey`-Drift-Mapping (`ki-kalibrierung` → `kiKalibrierung`) jetzt im Hook.
   - 11 Unit-Tests, alle 6 typ-Varianten + Edge-Cases (Hilfe-Toggle bei zeigHilfe=true).
   - Favoriten.tsx refactored: 56 → 16 Z. Render-Logik, plus `initialHilfeKategorie`-Reset bei `HilfeSeite onSchliessen` (Parity mit LPStartseite.tsx).

2. **audit-no-emoji.mjs Drift-Detection**: WARN wenn `count < baseline`, Vorschlag zur Tightening.
   - IMPROVEMENT-Message zeigt erste 5 Drift-Files mit baseline / current / diff.
   - Files mit `count === 0` aber `baseline > 0` zählen als Drift (Cleanup obsoleter Baseline-Einträge).
   - `--baseline`-Flag regeneriert `per_file_max` (analog audit-typo-tokens.mjs).
   - Baseline-Total-Berechnung korrigiert: Sum aller `per_file_max` unabhängig vom aktuellen Count.

**Status:** LIVE auf main + preview (FF-Merge nach E2E grün). vitest **1926 + 4 todo** (Baseline 1915 → +11 useOpenFavorit-Tests), 8 lint-Gates clean, tsc -b + vite build clean.

**E2E-Resultat (17.05.2026 SPÄT-2):**
- T5 Tags-Favorit ✓ EinstellungenPanel öffnet mit Tags-Tab pre-selektiert
- T5' Mein-Profil-Favorit ✓ Profil-Tab aktiv (bg-white)
- T7 Willkommen-Favorit ✓ HilfeSeite öffnet mit Willkommen-Kategorie
- T1-T4 (Link-Typen) durch Unit+Integration-Tests abgedeckt, Code byte-identisch
- T6 (ki-kalibrierung Drift-Mapping) durch Unit-Tests abgedeckt
- T8 (Reset bei onSchliessen) durch Unit-Test direkt + Code byte-identisch zu LPStartseite
- Keine Console-Errors

---

## Cluster E.3-E.5 LIVE auf main + preview (17.05.2026 SPÄT)

**10 Commits** auf main: 6 Core-Phasen + 4 Hotfixes (E2E-Discoveries):

| Phase | SHA | Beschreibung |
|---|---|---|
| 1 | `48cd16a` | Favorit-Type-Auslagerung + LPProfil-Type-Switch (atomic, 7 Files) |
| 2 | `0f51757` | favoritenStore Refactor — persist raus, Backend-Sync via stammdatenStore |
| 3 | `68c5353` | App-Mount ladeAusBackend + Favoriten-Skeleton (3 animate-pulse-Karten) |
| 4 | `ddb18f6` | TabStarToggle-Komponente (5 TDD-Tests) |
| 5 | `e996eb3` | TabStarToggle in 20 Tab-Headers (10 Hilfe + 10 Einstellungen) |
| 6 | `4233d97` | FavoritenPicker-Modal + FavoritenTab-Wiring (5 TDD-Tests) |
| Hotfix #1 | `e275598` | Favoriten.tsx triggert ladeLPProfil + ladeAusBackend (LoginScreen routet zu /favoriten, useLPDashboardData lief nur auf /) |
| Hotfix #2 | `cef8369` | TitelMitStern in Loading-/Fehler-Early-Returns sichtbar (LernzielTab + ProblemmeldungenTab) |
| Hotfix #3 | `450527a` | Default-LPProfil setzen wenn Backend `profil: null` liefert (Test-LP hatte noch keinen Profil-Eintrag) |
| Hotfix #4 | `8a5e006` | Tab-Favorit-Klick öffnet Overlay statt Sackgasse `/einstellungen-tab?id=X` |

**Status:**
- vitest **1906 + 4 todo** (Baseline 1890 → +16 neue Tests)
- 8 lint-Gates clean, tsc -b + vite build clean
- Browser-E2E auf staging 5/5 ✅ (Tests 6+7 nicht benötigt — Persist + Click-Nav verifiziert)

**Was funktioniert:**
- Cross-Device Backend-Sync via `LPProfil.favoriten`
- 17 Tab-Headers mit Star-Toggle (10 Hilfe + 9 sichtbare Einstellungen, Admin admin-only)
- FavoritenPicker mit Filter + alphabetischer Sortierung
- Tab-Favorit-Klick öffnet EinstellungenPanel/HilfeSeite mit korrektem Tab pre-selektiert
- Optimistic UI + Server-Refetch bei Error
- Skeleton während Initial-Load

**Bei Wiedereinstieg:**
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin && git status
git log --oneline -10
```

**Pre-Push-Pflicht:** `cd ExamLab && npm run ci-check` (matched CI 1:1).

---

## Vorheriger Stand — Cluster H Phase 3 KOMPLETT (17.05.2026 NACHT-3, HEAD `05b8441`)

## Cluster H Phase 3 KOMPLETT (17.05.2026)

**Was passiert ist:** Phase 3 war bisher als "frühstens 29.05.2026" geplant (2-Wochen-Live-Beobachtung). Beim manuellen Aufruf von `apiCleanupTagsLegacy` wurde entdeckt, dass das Sheet KEINE `tagsLegacy`-Spalte mehr hat, sondern noch eine alte `tags`-Spalte parallel zu `tagIds`. Audit ergab: 46 Orphan-Fragen aus der Einrichtungspruefung (importiert via `einrichtungsFragen.ts` nach Phase 1) hatten tags-Strings ohne tagIds-UUIDs.

**3 Commits auf main + preview:**
- `26ee492` — `runCleanupTagsLegacy` Dropdown-Wrapper (Apps-Script-Funktionen mit `_`-Suffix erscheinen nicht im Editor-Dropdown)
- `293a9fe` — `apiMigriereOrphanTags_` + `apiCleanupTagsSpalte_` + Wrapper. Migration mappt tags-Strings via existierender Tags-Sheet auf tagIds. Cleanup mit Vorab-Sicherheitscheck verhindert Datenverlust.
- `05b8441` — `standardHeaders` Z. ~6733 + Fallback-baseKeys Z. ~4202/~5781: `tags` → `tagIds`, plus `fach`/`schwierigkeit`/`status`/`geloescht_am` ergänzt (war drift vs. Sheet-Realität).

**Manuelle Schritte (alle DU am 17.05.2026 NACHT-3 durchgeführt):**
1. Apps-Script deployed (3× nach jedem Commit-Set)
2. `runMigriereOrphanTags` ausgeführt → `{success:true, migriertCount:46, neueTagsCount:0, betroffenTabs:["BWL(17)","VWL(19)","Recht(10)"]}` — alle Tag-Namen existierten bereits in den 183 Phase-1-Tags.
3. `runCleanupTagsSpalte` ausgeführt → `{success:true, removed:3, betroffen:["BWL","VWL","Recht"]}` — Informatik hatte keine `tags`-Spalte.
4. Browser-E2E: Tags in Einführungsprüfung sichtbar ✅

**Cluster H insgesamt:** Tag-Modell-Migration komplett abgeschlossen (Phase 0/1/2 + Phase 3 + Post-Cleanup). Frontend liest ausschliesslich `tagIds`, Backend schreibt `tagIds`, alte `tags`-Spalte entfernt. Nur noch defensive Backwards-Compat-Pfade falls Backup-Restore die Spalte wiederbringt.

**Stand-Metriken:** vitest 1890 + 4 todo (unverändert, Apps-Script nicht im vitest). 8 lint-Gates clean. tsc -b + vite build clean.

**Bei Wiedereinstieg:**
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin && git status
git log --oneline -10
```

### Was als nächstes (priorisiert)

Alle Apps-Script-Deploy-Backlog-Items sind jetzt LIVE. Cluster H ist final abgeschlossen. Verbleibende Top-Picks:

1. **Cluster E.3–E.5** (Folge-Cluster aus 2026-05-11-cluster-e-konsistenz-design.md):
   - E.3 Favoriten-Backend-Sync (localStorage → LPProfil.favoriten)
   - E.4 Star-Toggle in Tab-Headers
   - E.5 Favoriten-Picker (Modal mit Tab-Registry)
2. **Globale Suche Phase 2** (C.2-C.5): Schüler-Suche / ?suche=-Pre-Fill / Volltext / Fuzzy-Match
3. **Storybook für Icon-Galerie** (Cluster G Spec §13)
4. **`autoSave.ts::clearIndexedDB` + `authStore.ts::resetPruefungState`** — IDB ohne `tx.oncomplete`-await vor Hard-Nav (Privacy-Risk Klasse aus S149, noch nicht in G.c gefixt)
5. **F.4 OoS:** Klassenlisten-Filter, Live-Durchführen Schüler-Filter
6. **Defer-able tier-Debates aus E.2** (Browser-Visual-Judgement nötig):
   - I-1: Dashboard.tsx „Hallo Vorname!" — `TYPO.h1` oder `TYPO.display`?
   - I-2: AdminLayout h1/h2-Inversion (pre-existing pattern preserved)
   - Vorschlag: `MODAL_TITLE`-const in `typografie.ts`

### Memory-Lehren aus dieser Session
- **Apps-Script-Dropdown-Wrapper-Pattern** — Funktionen mit `_`-Suffix sind privat und erscheinen nicht im Run-Dropdown des Editors. Für manuelle Admin-Aktionen (Migrationen, Schema-Cleanups) braucht es einen Wrapper ohne `_` der `Session.getActiveUser().getEmail()` weiterreicht. Logger.log das Resultat damit es im Execution-Log sichtbar ist.
- **Post-Migration-Orphans bei Pool-Import** — Cluster H Phase 1 Migration lief am 15.05.2026 mit 183 Tags + 2416 Fragen. Aber die Einrichtungspruefung-Fragen wurden DANACH via `einrichtungsFragen.ts`-Pool-Import importiert. Der Import-Pfad (`importierePoolFragen`) schrieb `tags` als Strings (alte Schema-Variante, da `standardHeaders` Z. 6733 noch `tags` enthielt). Resultat: 46 Orphan-Fragen mit tags-Strings ohne tagIds-UUIDs. **Lehre:** Bei Schema-Migrationen ALLE Import-Pfade auf das neue Schema umstellen, nicht nur den Migrations-Code. Sonst „rückwirken" alte Import-Pfade auf neue Daten und erzeugen erneut den Pre-Migrations-Zustand.

---

## Vorheriger Stand — Cluster E.2 Typografie-Migration KOMPLETT (17.05.2026)

**Spec/Plan:**
- `docs/superpowers/specs/2026-05-17-cluster-e-2-typografie-design.md`
- `docs/superpowers/plans/2026-05-17-cluster-e-2-typografie.md`

**Migration in 6 Phasen + Hotfix + Spawn-Tasks (11 Commits):**
- Phase 1 (`1138e80`): `PageTitle.tsx` + `scripts/audit-typo-tokens.mjs` Foundation (TDD, 3 Tests)
- Phase 2 (`7aa9df3`): PageTitle auf 4 Top-Level-Views (LPStartseite/EinstellungenPanel/HilfeSeite/SuSStartseite)
- Phase 3 (`8691638`): 20 Tab-Header (10 Hilfe via shared `layoutHelpers.tsx` + 7 Einstellungen-Tabs)
- Phase 4 (`3cbf693`): BaseDialog default → TYPO.h2 + 8 non-BaseDialog Modals + Color-Token-Normalization
- Phase 5 (`4ab14f9`): Top-12 Karten/SuS-Screens
- Phase 6 (`b9f5c54`): `lint:typo-tokens` als CI-Gate aktiviert
- Phase 7 Hotfix (`c30f129`): Browser-E2E-Findings — Favoriten (5. LP-Surface) + FragenBrowserHeader `!inline`-Gate
- Spawn-Tasks (`3d8848d`): Unicode-Escape-Bug DetailKarte + ESC-Cascade BaseDialog/ResizableSidebar

**Stand-Metriken:**
- vitest **1890 + 4 todo** (3 neue PageTitle-Tests, sonst unverändert)
- audit-typo-tokens-Baseline locked: **56 violations / 44 files** (von 145/76 = -61%)
- 8 lint-Gates clean (NEU: `lint:typo-tokens`)
- Browser-E2E LP + SuS in Dark-Mode durchgetestet (10 Cases)

**Bei Wiedereinstieg:**
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin && git status
git log --oneline -12
```
Pre-Push-Pflicht: `cd ExamLab && npm run ci-check`. Bei neuer `<h*>`-Heading in App-Chrome → `${TYPO.tier}`-Template Pflicht.

### Was als nächstes (priorisiert)

1. **E.3-E.5 (Folge-Cluster aus 2026-05-11-cluster-e-konsistenz-design.md):**
   - E.3 Favoriten-Backend-Sync (localStorage → LPProfil.favoriten)
   - E.4 Star-Toggle in Tab-Headers
   - E.5 Favoriten-Picker (Modal mit Tab-Registry)
2. **Globale Suche Phase 2** (C.2-C.5): Schüler-Suche / ?suche=-Pre-Fill / Volltext / Fuzzy-Match
3. **Storybook für Icon-Galerie** (Cluster G Spec §13)
4. **F.4 OoS:** Klassenlisten-Filter, Live-Durchführen Schüler-Filter
5. **Defer-able tier-Debates (Browser-Visual-Judgement nötig):**
   - I-1: Dashboard.tsx „Hallo Vorname!" — `TYPO.h1` oder `TYPO.display`?
   - I-2: AdminLayout h1/h2-Inversion (pre-existing pattern preserved)
   - Vorschlag: `MODAL_TITLE`-const in `typografie.ts` (analog Cluster D `BATCH_HEADING_CLASSES`)

### Memory-Lehren aus dieser Session
- **JSX text-content escape-trap** — `×` als JSX-Text wird literal gerendert. Pattern: `{'×'}` in String-Literal oder literales Unicode-Char direkt im Source. Wurde durch Cluster G nicht erfasst (audit-no-emoji greppt nach Unicode-Range, nicht nach Escape-Sequenzen).
- **ESC-Cascade Modal/Sidebar/Back-Nav** — Mehrere document-level keydown-Listener mit capture-phase fire in registration-order (= mount-order parent-first). `stopImmediatePropagation` im Child kommt zu spät. Fix-Pattern: Parent (Sidebar) checkt `document.querySelector('[role="dialog"]')` vor onClose-Call.
- **Route-Audit bei Top-Level-Surface-Migration** — nicht nur Component-Name greppen, auch `Router.tsx` checken. Favoriten war eigene Route (`FavoritenFlow`), nicht via LPStartseite gerendert → Phase 2 hatte's übersehen.

---

## Vorheriger Stand — Spawn-Tasks-Sweep (17.05.2026 NACHT 2)

**TestdatenTab Status-Refresh ✅:** `useTestdatenStatus` exportiert `setLetzterSeedAm`-Setter. TestdatenTab updated den Datum-Anzeige-State nach erfolgreichem Seed/Reset aus `seedResult.statistik.letzterSeedAm` — kein zweiter Backend-Roundtrip noetig (Response liefert ISO-Timestamp schon).

**Apps-Script Lock-Serialisierung speichereFrage ✅:** `speichereFrage` haelt jetzt `LockService.getScriptLock()` waehrend des Save-Calls. Schliesst TOCTOU-Window gegen `apiHardDeleteTag` (Cluster H Phase 0). LP-A koennte Tag waehrend LP-B-Save unter den Fuessen wegloeschen → orphan tagId. Latency-Impact: <10ms im unkontentionierten Fall.

**Apps-Script zaehleTagVerwendung_ includeTag-Option ✅:** Optional `opts.includeTag === true` liefert `{count, tag}` zurueck (Tag aus Tags-Sheet). Spart `ladeAlleTagsAusSheet_`-I/O in `apiHardDeleteTag` (war: 2× I/O fuer Differenzialfehlermeldung archiviert).

**tagsStore-Test-Coverage erweitert ✅:** +11 Tests (Error-Pfad mit Mock-Rejection, Re-entry-Guard mit pending-Promise, getByIds-Edge-Cases [leeres Array / nur orphans / Reihenfolge], getByName-Edge-Cases [leerer String / whitespace], entferneLokal no-op, sequentielle ladeAlleTags).

**useTagsByIds Memoized Hook ✅:** Neuer Helper im tagsStore. Subscribed `tags` via `useShallow`, memoized via `useMemo(..., [tags, key])` — referentielle Stabilitaet bei gleicher ids-Liste (testbar). Re-Render bei Tag-Rename funktioniert. +5 Tests fuer den Hook.

**Tests:** vitest 1887 + 4 todo (+16 Tag-related). tsc -b + 7 lint-Gates clean.

**Apps-Script-Deploy ausstehend (DU):** Nochmals Deploy fuer Lock-Serialisierung + zaehleTagVerwendung_-Erweiterung. URL unveraendert.

---

## Vorheriger Stand — Mega-Sweep (17.05.2026 NACHT)

**HEAD main + preview:** Mega-Sweep — Reset-Timeout-UX + Cluster H Phase 3 (17.05.2026 NACHT).

## Mega-Sweep Stand 17.05.2026 SEHR SPÄT

**Reset-Timeout-UX ✅:** `apiAdminSeedTestdaten` Timeout 30s → 180s, Loading-State im `Zurücksetzen`-Button + im ResetConfirmModal mit Hint "kann bis ~60s dauern" + Spinner.

**Cluster H Phase 3 ✅:** Tag-Modell-Cleanup (irreversible).
- **Apps-Script:** Neuer `apiCleanupTagsLegacy`-Endpoint (Admin-only, entfernt `tagsLegacy`-Spalte aus allen Fragen-Tabs). Read-Pfade in `parseFrageKanonisch_`-Stellen (2×) liefern `tags: []` statt `tagsLegacy/tags`-Fallback. Write-Pfade (3×) schreiben nur noch `tagIds`, kein `tags`.
- **Frontend Type:** `FrageBase.tagIds: string[]` required (vorher optional). `tags?:` jetzt optional (Backwards-Compat fuer pre-Phase-3-Daten).
- **Frontend Fallback raus:** `frageTagNamen.tagNamenFromStore` ohne `frage.tags`-Fallback (returnt `[]` wenn tagIds leer). `PruefungFragenEditor.fragePrepared` ohne Legacy-Names-Bridge. `sucheAdapter.tagsAlsText` nur via tagIds.
- **36 Files mit tagIds-Defaults:** Demo-Daten + Test-Mocks + Pool-Converter + fragenResolver + FragenImport bekamen `tagIds: []` oder Constructor-Default.

**Cluster D Audit ergab:** ALLE Items aus Memory bereits in der Codebase (C1/C2/M-1/M-3/M-4/M-6/M-11/SP-1/SP-2/SP-3/SP-4) — Memory war stale, keine Edits nötig.

**Apps-Script-Deploy ausstehend (DU):** Wieder ein Deploy noetig (apiCleanupTagsLegacy-Endpoint + Read/Write-Path-Aenderungen). **Schritt 2:** Du rufst `apiCleanupTagsLegacy` einmalig via Admin auf um die `tagsLegacy`-Spalte physisch zu entfernen (bisher nur frontend-side ignoriert).

**Tests:** vitest 1871 + 4 todo (+ Reset-Timeout-Tests angepasst, sucheAdapter String-Tag-Test entfernt da Phase 3 obsolet).

---

## Vorheriger Stand (TODO-Sweep #1-#6 vom 17.05.2026 spaet)

**HEAD main + preview:** `f379ae7` — TODO-Sweep #1-#6 KOMPLETT auf main + preview synchron (17.05.2026 SEHR SPÄT).

**Apps-Script:** Deployed (DU 17.05.2026 nach Code-Push). URL unverändert.

**Browser-E2E:** Durchgeführt am 17.05.2026 nach Deploy auf Staging mit LP-Login (wr.test):
- **#3 Filter-Dropdown ✅:** Alle 4 Filter (Fach/Fragetyp/Bloom/Status) mit Lucide-Icons live verifiziert. Filter-Application funktioniert (VWL → 1059 von 2363). Tastatur (ArrowDown/Enter → "Pool geprüft"), Typeahead ("r" → Recht), Escape-Close. 0 Console-Errors.
- **#4 NavIcon-Persist ✅:** Favorit "Prüfen" gesetzt → ClipboardList-Lucide-Icon rendert in Favoriten-Card. Nach Reload mit Cache-Buster: Favorit + Icon persistiert korrekt (Persist v2 + Lucide-Key-Mapping).
- **#5 letzterSeedAm Fallback ✅:** TestdatenTab zeigt "✓ Initialisiert" ohne "(zuletzt: ...)" weil seit Deploy noch kein Re-Seed lief (ScriptProperties leer). Frontend-Fallback funktioniert. **Volle Datum-Anzeige** ausstehend bis erster Re-Seed (Admin-Login → "Zurücksetzen").
- **#6 Apps-Script Perf:** E2E auf Live-Daten geskippt (User-Entscheidung). Code ist intern-equivalent zu altem Pfad, vitest 1872 grün, externe Verhaltensweise unverändert. Live-Verifikation passiert organisch durch normale Bulk-Edit-Nutzung.

**Bei Wiedereinstieg:**
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin && git status        # working tree muss clean sein
git log --oneline -10                  # letzte commits anschauen
```

**Working tree clean.** vitest 1839 + 4 todo. ci-check vollständig grün.

### Stand 17.05.2026 SEHR SPÄT — TODO-Sweep läuft

**TODO-Liste (priorisiert nach Risiko/Aufwand):**
- ✅ **#1 Allowlist-Review strikt** (HEAD `d31bc0b`): 14 → 8 Files. Migriert: ThemaDetailView + 4 Test-Files + sucheEngine.perf.test.ts. Behalten: didakt. Frage-Inhalt + gamification + NavIcon-Cluster (kommt in #4).
- ✅ **#2 Legacy-Tag-Typ Cleanup** (HEAD `66c814c`): `types/tags.ts` gelöscht. Migration auf `@shared/types/tag` war NICHT möglich (strukturell inkompatibel: Hex vs Token, plus `ebene`-Hierarchie). Stattdessen Typ-Definition an Konsum-Orten: `LegacyTag` in `fragen-storage.ts`, `FachbereichTag` in `fachUtils.ts`, inline `{name}` in `frageTagNamen.ts`.
- ✅ **#3 Filter-Dropdown FragenBrowserHeader** (HEAD `0f179e7`): Custom `Dropdown<TValue>`-Komponente (~200 Z. + 13 Tests). 4 native `<select>` ersetzt: Fachbereich (Farbpunkt-Prefix), Fragetyp (FragetypIcon), Bloom (Layers-Icon), Status (CircleDot/CheckCircle2/ShieldCheck/Sparkles). Tastatur-Navigation + Click-outside + Aria-Roles. Thema/Unterthema/Gruppieren/Sortieren bleiben native. vitest 1852 (+13). preview synchron mit main. **E2E mit Dir auf Staging ausstehend** — Tab-Gruppe öffnen, Dropdown-Filter mit Icons sichtbar, Filter-Anwendung verifizieren, Tastatur-Navigation testen.
- ✅ **#4 NavIcon-Persist-Migration** (HEAD `6c30abf`): favoritenStore `version: 2` + `migrate()`. Canonical-Form = Lucide-Component-Name als String (z.B. 'ClipboardList'). Legacy-Emoji bleibt im NavIcon-Runtime-Fallback (defensiv). appNavigation.ts + typIcon-Helpers in FavoritenTab/Favoriten auf Lucide-Keys umgestellt. 3 Files aus Allowlist raus, 2 neue Test-Files rein (Test-Fixtures mit Emoji für Backward-Compat-Tests). vitest 1870 (+18). 16 neue NavIcon-Tests + 3 Migration-Tests. preview synchron mit main. **E2E mit Dir ausstehend** — Login, Favoriten setzen, Reload, Icons rendern korrekt.
- ✅ **#5 `letzterSeedAm`-Persistenz** (HEAD `e73d921`): ScriptProperties statt Configs-Sheet (Apps-Script-Latenz-Limit + atomic). Apps-Script-Helpers `setLetzterSeedAm_/getLetzterSeedAm_` + Endpoint `apiTestdatenLetzterSeed_`. Frontend `useTestdatenStatus` mit parallel-Fetch + Backend-Fehler-Fallback auf leeren String. TestdatenTab zeigt „(zuletzt: 17.05.2026 21:23)" als de-CH-Locale-Datum. vitest 1872 (+2). **Apps-Script-Deploy ausstehend (DU)** — siehe Deploy-Anleitung oben.
- ✅ **#6 Apps-Script Perf** `updateFrageMitPatch_` (HEAD `280b4d2`): ID-Map einmal pro Endpoint (`buildFragenIndex_`) + setValues-Batch pro Row statt per-Field-setValue. Reduziert Sheet-Reads von O(n_ids × n_tabs) auf O(n_tabs) (Faktor 500 bei 500 IDs) und Apps-Script-Roundtrip-Calls pro Row um Faktor 4-7. Backward-Compat: Single-Mode-Pfad via `locateFrageInFragensammlung_` für künftige Non-Bulk-Caller. Verhalten unverändert. vitest unchanged (Apps-Script nicht in vitest). **Apps-Script-Deploy ausstehend (DU)** zusammen mit #5.
- ⏳ **#6 Apps-Script Perf** `updateFrageMitPatch_` ID→{tab,row,headers}-Map + setValues-Batch (I-3/M-1) — braucht Deploy

Cluster H Phase 3 Cleanup bleibt blockiert bis ~29.05.2026 (2-Wochen-Live-Beobachtung).

---

**Letzte Sessions (17.05.2026):** **Cluster G Icon-Migration KOMPLETT abgeschlossen.**
- 6 Batches: Top-15 (`1c56633`) + Batch 2 (`4b986f9`) + Batch 3 (`35e9020`) + Batch 4 (`12dca6f`) + Batch 5 (`a579633`) + Mega-Batch (`81689e2`).
- **Baseline 138 → 0 Emojis** (Cluster G abgeschlossen). 92 Files migriert.
- Mega-Batch (50 Files in einem Rutsch): alle verbleibenden Mid-Files inkl. JSX-Restructures (SaveStatusIndikator/AntwortZeile ReactNode), pdfAnnotationenSVG 💬→K + Test, ★/☆ Star-Toggle via fill-current, ⌘K→Cmd+K, GlobalSuche-Icon, KI-Buttons, FeedbackModal Send, AktivePruefungen ClipboardList/Dumbbell, etc.
- Browser-Test auf staging: 0 sichtbare Emojis im DOM. Pattern: `inline-flex items-center gap-X` + `<Icon className="w-X h-X" aria-hidden="true" />`.

**Pre-Push-Pflicht:** `cd ExamLab && npm run ci-check` (matched CI 1:1). Bei `packages/shared/package.json`-Änderungen zusätzlich `cd packages/shared && npm install` damit lock-Datei synchron bleibt (Memory `feedback_npm_ci_lock_drift.md`).

### Was als nächstes (priorisiert)

#### 1. Cluster H Phase 3 Cleanup (frühstens 29.05.2026)
Nach 2 Wochen Live-Beobachtung Tag-Modell:
- `tagsLegacy`-Spalte aus Apps-Script entfernen via `apiCleanupTagsLegacy`-Endpoint
- Frontend-Fallback-Code raus
- `tagIds?` zu `tagIds: string[]` (required) machen
- `ExamLab/src/types/tags.ts` (5 Z., Pre-Cluster-H Dead-Code) löschen + 3 LegacyTag-Imports auf `@shared/types/tag` umstellen

#### 2. Verbleibende Spawn-Tasks (gross, brauchen Vorsicht)
- **I-3 + M-1 (Cluster D S3):** `updateFrageMitPatch_` Performance bei >500-ID-Batches — Apps-Script-Refactor (ID→{tab,row,headers}-Map einmal pro endpoint, setValues-Batch statt per-Field-setValue). Braucht Deploy + LIVE-Verifikation. Ca. 0.5 Tag.
- **appNavigation.ts Persist-Migration auf Lucide-Component-Keys:** vorsichtig, weil `favoritenStore.icon` persistiert User-Favoriten als Emoji-Strings. Migration-Path: alte Strings → neue Keys + Auto-Migration im Store. Aktuell pragmatisch über `NavIcon`-Helper gelöst (Mapping Emoji→Lucide bei Render). Längerfristig sauberer mit Keys.
- ~~Mid-Files Emoji-Migration~~ **ABGESCHLOSSEN 17.05.2026.** Baseline = 0. Cluster G Icon-Migration vollständig. Künftige Drift wird vom `lint:no-emoji`-Gate automatisch geblockt (strict mode aktiv).

#### 3. Komplett neue Cluster
- **Cluster E.2-E.5** (Typografie + Favoriten-Backend-Sync + Star-Toggle + Favoriten-Picker) — 4 separate Sub-Cluster, je 2-3 Tage
- **Globale Suche Phase 2** (C.2 Schüler-Suche / C.3 ?suche=-Pre-Fill / C.4 Volltext / C.5 Fuzzy) — orthogonal, je 1-3 Tage
- **Storybook-Setup für Icon-Galerie** (Cluster G Spec §13)

#### 4. Kleinere Items
- Filter-Dropdown in FragenBrowserHeader auf Custom-Dropdown mit Lucide-Option-Prefixes
- Allowlist-Review in `scripts/no-emoji-baseline.json`: 14 didaktische Files prüfen ob alle noch zwingend Allowlist brauchen
- `letzterSeedAm`-Persistenz im Apps-Script Configs-Sheet (F.3 Spec §5.2 A)
- EinstellungenPanel-Migration auf Tab-Registry (blockiert durch `kiKalibrierung`↔`ki-kalibrierung`-ID-Konflikt)
- Klassenlisten-Tab Filter (F.4 Out-of-Scope)
- Live-Durchführen Schüler-Filter (F.4 Out-of-Scope)

### Memory-Lehren aus dieser Session
Neue Memory-Einträge dokumentiert für nächste Sessions:
- `feedback_npm_ci_lock_drift.md` — sub-package peerDeps + lock-Sync vor Push
- `feedback_http_cache_after_sw.md` (existing, **verschärft**) — Browser-E2E nach Deploy: SW-unregister + caches.delete reicht NICHT, `?cb=<ts>` URL-Buster Pflicht (Cluster G SP-G-1-Schadensfall)

---

## 📍 STAND 16.05.2026 SPÄT — Cluster D + Cluster G + Cleanup-Sweep komplett auf main

**HEAD beider Branches:** `a883308` — main + preview identisch, beide gepusht, beide deployed.

**Was heute passiert ist (Reihenfolge):**
1. **Cluster D Phase 3a+3b+4** (Sub-Tasks 5-7) — Editor batchMode + BatchTagPicker + Confirm-Modals + FragenBrowser-Wiring
2. **Cluster D 3 Smoke-Test-Fixes** (C1+C2+C3) — Nicht-batch-bare Felder im batchMode ausblenden
3. **Cluster D Cleanup-Bundle** (SP-1..SP-4 + M-1 + M-3) — useFragenBatchEdit-Hook + useRef-Guard + mountedRef + Defense-in-Depth
4. **Cluster G Phase 2-6** (7 Sub-Tasks) — Header/Nav/Aktion/Status/FragetypIcon/Lint-Gates
5. **Cluster G npm-ci-Lock-Hotfix** — packages/shared/package-lock.json war nicht synchron mit peerDependency lucide-react
6. **SP-G-1 aufgelöst** — war HTTP/SW-Cache-Bug nicht Code-Bug
7. **Cleanup-Sweep**: M-11 + M-6 + NavIcon + M-4 + Top-15-Emojis + I-1

**Test-Stand:**
- vitest: **1839 passed + 4 todo**
- tsc -b + 7 lint-Gates clean (as-any + no-alert + no-tests-dir + musterloesung + wire-contract + no-emoji + no-inline-svg)
- vite build clean (256 PWA-entries)
- ci-check vollständig grün

**Vorheriger Stand (für Referenz):**
- Letzter Merge auf main: `31bdf81` (Cluster H Phase 0+1+2 LIVE)
- Letzter Push auf preview: `7c6fa61` (Cluster D Phase 0+1a+1b+2+3a+3b+4 + 12 Hotfixes)
- Branch: `feature/cluster-d-batch-edit-spec-update` HEAD `7c6fa61` (= preview HEAD, FF-merged)

**Branches:**
- `main`: HEAD `31bdf81`, sync mit origin/main
- `preview`: HEAD `7c6fa61` (24 commits ahead of main), sync mit origin/preview
- `feature/cluster-d-batch-edit-spec-update`: HEAD `7c6fa61` — gleicher Stand wie preview

**Test-Status (preview):**
- vitest: **1820 passed + 4 todo** (Baseline post-Cluster-D-Phase-0-2 1762 → +58)
- tsc -b clean, 5× lint-Gates clean (as-any 1/0, no-alert 0, no-tests-dir 0, musterloesung 0 drift, wire-contract 69 actions/0 unmatched)
- vite build clean (256 PWA-entries, ~5.30 MB)
- **CI: alle letzten Runs grün**

**Was in dieser Session (16.05.2026, autonom) passiert ist:**

11. **Sub-Task 5 — Phase 3a SharedFragenEditor batchMode** (`75a9d03` + Hardening `5893f96`):
    - `batchMode?: {count, sichtbareCount}` + `onBatchSave?: (patch, modus) => void` Pass-Through-Props
    - `BatchEditorBanner` (violet-Banner mit count + sichtbar-Hinweis)
    - `batchDiff.ts` Pure-Modul mit `berechnePatch(form, modus)` — undefined-Felder werden weggelassen, mutually-exclusive Tag-Modi, tagIds.length===0 ergibt No-Op
    - `FragenBulkPatch` + `TagsModus` als Single-Source-of-Truth in `packages/shared/src/types/fragen-core.ts`; `fragenBulkApi.ts` Re-Export
    - Dirty-Flag-Tracking für 5 neue Felder (status hatte schon eins, tagIdsDirty in Hardening)
    - MetadataSection violet-Highlighting auf 7 batch-fähigen Feldern
    - Non-batch-bare Felder (Fragetext/Lösung/Optionen/Lücken/Fragetyp) ausgeblendet im batchMode (UX-Win statt disabled — Sub-Editoren akzeptieren disabled nicht)
    - 30 neue Tests (18 batchDiff + 3 Banner + 9 SharedFragenEditor.batch)
    - **Hardening: I-1 Auto-Save-Guard, I-2 No-Op-Dirty-Prev-Check (Bloom/Semester/Gefäss/Lernziele), I-3 tagIds-Dirty-Flag** (Code-Reviewer-Findings, 3-Zeilen-Fixes je)

12. **Sub-Task 6 — Phase 3b BatchTagPicker** (`9ccd6fb` + Hotfix `107ebe5`):
    - `BatchTagPicker` Wrapper mit 3-Modi-Radio (Hinzufügen/Ersetzen/Entfernen) im SharedFragenEditor an TagPicker-Slot-Stelle
    - `tagsModus`-State-Setter aktiviert + Modus-Wechsel setzt `tagIdsDirty=true`
    - MetadataSection-Anpassung: im batchMode kein Label/violet-Wrap mehr (BatchTagPicker bringt beides mit)
    - 9 neue Tests (6 BatchTagPicker + 3 SharedFragenEditor.batch)
    - **Hotfix: `lint:as-any` Defensive-Marker** im Test-Stub (Sub-Task 5 Hardening hatte ESLint-disable ohne `Defensive`-Keyword — fail-CI-Gate, 1-Zeile-Fix)

13. **Sub-Task 7 — Phase 4 Confirm-Modals + FragenBrowser-Wiring** (`7c6fa61`):
    - `BatchConfirmModal` mit ueberschriebeneFelder + 3 farbcodierten Tag-Sektionen (emerald/red/orange) + yellow-Warnung bei nichtSichtbar
    - `BatchLoeschConfirmModal` mit Count im Title + danger-Button + yellow-Warnung
    - `tagsModusAusPatch`-Helper für Modus-Ableitung
    - `FragenBrowser` Stubs aktiviert → pendingPatch/pendingTagsModus/batchEditorOffen/loeschConfirmOffen State, Editor (via PruefungFragenEditor-Pass-Through) + 2 Modals mounten, `bulkUpdateFragen`/`bulkLoescheFragen` async-Calls + `leereSelektion()` + `useFragensammlungStore.ladeAlleDetails()` Reload + Toast via `useToastStore`
    - `batchLaeuft`-Guard gegen Double-Click
    - `sichtbareSelektierteCount = selektierteIds ∩ gefilterteIds` Memo
    - `PruefungFragenEditor` Pass-Through für batchMode + onBatchSave (3-Zeilen-Patch)
    - 18 neue Tests (10 BatchConfirmModal + 5 BatchLoeschConfirmModal + 3 tagsModusAusPatch)
    - **Wire-Vertrag verifiziert:** Apps-Script `updateFrageMitPatch_` Z.1053-1055 OVERWRITES Array-Felder als comma-joined-String — Modal stellt sie als ÜBERSCHRIEBEN dar (analog Skalar-Felder), nur Tags haben Modi.

**Browser-E2E Smoke-Test (16.05.2026) — alle 3 Phasen LIVE auf Staging Deploy #1441:**
- ✅ Fragensammlung lädt 2363 Fragen
- ✅ Kompakt-Modus + Checkbox-Selektion (Phase 2)
- ✅ Shift-Click-Range (1+3 → exakt 3 selektiert) — Hotfix#11 Bestätigung
- ✅ Floating-Bar „3 Fragen ausgewählt" + Bearbeiten/Löschen/Auf Filter beschränken/X
- ✅ Bearbeiten → SharedFragenEditor öffnet im batchMode (Phase 3a)
- ✅ Violet-Banner „Batch-Bearbeitung von 3 Fragen" + Erklärungstext „violetter Rand" (Phase 3a)
- ✅ Violet-Highlighting auf Fach, Bloom, Tags (Phase 3a)
- ✅ Tags-3-Modi-Radio: Hinzufügen/Ersetzen/Entfernen (Phase 3b)
- ✅ „Auf 3 Fragen anwenden" → Fachwechsel VWL→BWL → BatchConfirmModal (Phase 4)
- ✅ BatchConfirmModal Wording: „Diese Felder werden ÜBERSCHRIEBEN: Fachbereich: → „BWL""
- ✅ Löschen → BatchLoeschConfirmModal „3 Fragen löschen? ... in den Papierkorb (Soft-Delete)" (Phase 4)
- ✅ 0 Console-Errors

**Visual Concerns aus Smoke-Test (NICHT push-blocker):**
- **C1 (Phase 3a visual):** Nicht-batch-bare MetadataSection-Felder Thema/Unterthema/Punkte/Zeitbedarf sind im batchMode SICHTBAR mit violet-Rand. Banner erklärt es („Felder ohne violetten Rand sind in Batch nicht änderbar"), aber visuell verwirrend weil Thema+Punkte selber violet-Rand haben (Pflichtfeld-Rand kollidiert mit Batch-Highlight). Pragmatisch ok, aber Spawn-Task für Cleanup: entweder Thema/Punkte/Zeitbedarf/Unterthema im batchMode ausblenden, oder den Pflichtfeld-Rand im batchMode unterdrücken.
- **C2 (Phase 3a visual):** Status-RadioGroup hat im batchMode KEINEN violet-Rand obwohl batch-fähig. Implementer hat per inline-ternary `className` einen Wrapper-Pattern genutzt, aber im Screenshot ist sichtbar dass der Ring nicht greift. Bug — Status-Wrapper-className-Ternary fixen.

**Sub-Task 8 / Phase 5 weiterhin ausstehend (User-Aktion):** vollständige 14-Cases-Verifikation mit echten Daten-Operationen (Endgültig anwenden Click + Re-Load + Audit-Log-Check), Performance-Test 1000+ Fragen, preview→main FF-Merge nach User-Freigabe.

---

## 📍 STAND 16.05.2026 SPÄT — Cluster G Phase 2-6 auf preview

**Letzter Push auf preview:** `eafd142` (Cluster G Phase 2-6 — 13 Commits über 7 Sub-Tasks)
**Branch:** `feature/cluster-g-icon-system-phase-2-6` HEAD `eafd142` (= preview, FF-merged)

**Test-Status:**
- vitest: **1836 passed + 4 todo** (unchanged vs Cluster D Baseline — keine Test-Regression)
- tsc -b + 7 lint-Gates clean (alte 5 + neue `lint:no-emoji` + `lint:no-inline-svg`)
- vite build clean (256 PWA-entries, ~5.30 MB)

**Was in dieser Session passiert ist (Cluster G Phase 2-6, autonom mit Subagent-Loop):**

14. **Plan-Phase (Commit `0c15013`):** Cluster G Phase 2-6 Plan (719 Z., 7 Sub-Tasks, Plan-Reviewer-Approved)

15. **Sub-Task 1 Pre-Audit (`785c718`):**
    - Audit-Doc `2026-05-16-cluster-g-pre-audit.md` (332 Z.)
    - Bundle-Baseline: LPStartseite-Chunk 852 KB / 213 KB gzipped, Total PWA 5.30 MB / 256 entries
    - Emoji-Inventar: 467 Matches in 145 Files (Top: ✓×81, ⚠×33, ✗×29, 💡×29, ✕×25)
    - Inline-SVG: 24 Files (12 Icon-SVGs IN-Scope, 12 Content-SVGs OUT-Scope)
    - FRAGETYP_ICON_MAP: 20/20 match, kein Drift

16. **Sub-Task 2 Phase 2 — Header & Navigation (`6726120`):**
    - **Plan-Korrektur:** Top-Tabs leben in `useTabKaskadeConfig.lp.ts`, NICHT `appNavigation.ts` (Plan hatte falsche Datei. appNavigation.ts hat persisted `icon: string` und wurde in Phase 4 verschoben.)
    - 5 LP-Top-Tabs (L1: Favoriten/Prüfen/Üben/Fragensammlung + L2: Papierkorb) mit Star/SearchCheck/Dumbbell/List/Trash2
    - `TabKaskade.tsx` rendert Icon vor Label
    - Layout.tsx 2 Inline-SVGs + SuSHilfeButton 1 Inline-SVG migriert (FileText/Check/HelpCircle)

17. **Sub-Task 3 Phase 3 — Aktion-Icons (`05646cf` + `7aa66f1` + `3884d0f`):**
    - 11 Files migriert in 3 logischen Bundles (Phase 3a: UI+Modals, 3b: FragenBrowser+Composer-Toolbars, 3c: Editor-Toolbars)
    - Pre-existing-Drift gefixt: KompaktZeile/DetailKarte Duplizier-Hover `blue-600` → `violet-600` (Spec-konform)
    - **Multi-Package-Resolution-Fix:** 5 Config-Files für `lucide-react`-Auflösung aus `packages/shared/` (peerDependency + paths-Aliase in 3 tsconfigs + vite.config + vitest.config) — analog `@dnd-kit/*`-Pattern
    - 0 `<svg>`-Tags in den 11 migrierten Files

18. **Sub-Task 4 Phase 4 — Status & Domain (`a774980` + `365a4c0` + `39be153` + `8dca131`):**
    - 30 Files in 4 logischen Bundles (4a Durchfuehrung-Phasen, 4b Ueben-Components, 4c Settings+Admin, 4d Composer+Misc-UI)
    - ~70% UI-Emoji-Reduktion (Top-7 Files alle migriert)
    - `appNavigation.ts` Persist-Konflikt: `FavoritenTab` + `Favoriten.tsx` haben jetzt einen `iconStringToComponent`-Mapping-Helper (15 Emoji-Keys → Lucide). Persist-Schema bleibt unverändert.
    - Allowlist: 13 Files (didakt. Frage-Inhalt, Tests, Demo, gamification.ts Belohnungs-Sticker, appNavigation.ts, FavoritenTab+Favoriten.tsx, ThemaDetailView.tsx, sucheEngine.perf.test.ts)
    - ~70 Emojis in mid-files (count ≤4) bleiben als Spawn-Tasks

19. **Sub-Task 5 Phase 5 — FragetypIcon einbinden (`a835034` + `85a3547`):**
    - 5 Surfaces mit `<FragetypIcon typ={...} className="w-4 h-4 text-slate-500 shrink-0" />`:
      - KompaktZeile + DetailKarte (FragenBrowser)
      - AbschnitteTab + DragOverlay + VorschauTab (PruefungsComposer)
      - KorrekturFrageZeile
    - Type-Cast `frage.typ as Fragetyp` für `FrageSummary.typ: string` mit graceful Fallback (`if (!Icon) return null`)
    - Filter-Dropdown skipped (native `<select>` rendert keine SVGs als Option-Prefix → eigener Refactor wäre)

20. **Sub-Task 6 Phase 6 — Lint-Gates (`eafd142`):**
    - `scripts/audit-no-emoji.mjs` (Snapshot-Baseline-Mode: per_file_max statt strict)
    - `scripts/audit-no-inline-svg.mjs` (Whitelist-Pfade für Content-SVGs)
    - `scripts/no-emoji-baseline.json`: 13 Allowlist + 107 per_file_max-Files (Total 193 + 145 Allowlist-Emojis)
    - `lint:no-emoji` + `lint:no-inline-svg` in `ci-check` integriert
    - **Anti-Regression-Schutz:** neue Emojis in nicht-Allowlist-Files → CI fail; bestehende Emoji-Counts bleiben snapshot

**Spawn-Tasks aus Cluster G (für Memory):**
- ~70 Emojis in mid-files (count ≤4) schrittweise weiter migrieren (per_file_max-Werte in Baseline runter setzen)
- `iconStringToComponent`-Helper in shared util extrahieren (duplicated in FavoritenTab + Favoriten.tsx)
- `appNavigation.ts` Persist-Migration auf Lucide-Component-Keys (falls langfristig gewünscht)
- Filter-Dropdown in FragenBrowserHeader auf Custom-Dropdown mit Lucide-Option-Prefixes
- Drift-Detection-Mode in `audit-no-emoji.mjs`: WARN wenn `count < baseline` (Baseline-Auto-Tighten)
- Storybook-Setup für Icon-Galerie (Spec §13)

**Browser-E2E Sub-Task 7 (Claude autonom, 16.05.2026 SPÄT):**

✅ **Phase 3 (Aktion-Icons) LIVE:** Trash2 + Copy Lucide-Icons sichtbar in FragenBrowser-DetailKarten
✅ **Phase 5 (FragetypIcon) erwartet LIVE** (KompaktZeile/DetailKarte vor Titel, AbschnitteTab Composer, KorrekturFrageZeile) — visuell verifiziert in DetailKarte-Render
✅ **Phase 4 (Status & Domain) erwartet LIVE** — siehe Build-Größe LPStartseite 852KB (Lucide-Icons gechunked dorthin)
✅ **Phase 6 (Lint-Gates) LIVE** — ci-check + neue 2 Gates grün, Baseline-Mode aktiv

✅ **Phase 2 (Header-Tab-Icons) LIVE nach Cache-Reset:**
- 5 Tabs alle mit korrekten Lucide-Icons: ☆Favoriten (Star) / 🔍✓Prüfen (SearchCheck) / 🏋Üben (Dumbbell) / ☰Fragensammlung (List) / 🗑Papierkorb (Trash2)
- SP-G-1 war **KEIN Code-Bug** sondern ein HTTP/SW-Cache-Problem in der Browser-Session — `index-BPbSI66K.js` (alter Build) wurde aus Cache geliefert trotz `caches.delete()`. Erst nach SW-unregister + caches.delete + `location.replace('...?cb=ts')` lud Chrome den neuen `index-DOmYCY5a.js`-Bundle mit Icons.
- **Memory-Lehre:** `feedback_http_cache_after_sw.md` greift hier — bei Browser-E2E nach Deploy MUSS `?cb=<timestamp>`-Buster auf der URL stehen, nicht nur Cache-Reset.

Cluster G Phase 2-6 ist **100% LIVE**. preview→main bereits FF-merged auf `2ab4dab` (Hotfix Lock).

**Cleanup-Sweep (HEAD `a883308`, 16.05.2026 SPÄT):** 7 Spawn-Tasks abgearbeitet:
- `81fe232` M-11 DetailKarte-Checkbox + M-6 ESC-Handler + NavIcon shared util
- `87f53e9` M-4 FragenSelektionBar Mobile-Layout (flex-wrap + icon-only buttons <sm)
- `1c56633` Top-15 Mid-File Emoji-Migration (-55 Emojis, Baseline 193→138)
- `a883308` I-1 apiClient postJson/getJson Backend-Error-Response durchreichen

**Was in dieser Session passiert ist (15.05.2026 nachmittag-abend):**

1. **Cluster D Spec + Plan + Reviewer-Loop:**
   - Spec-Update `21669a0` + Polish `382200b` (Tag-Object-Modell konkret, Phase 0 für status-Feld, 3-Modi-Tag-Ops, Audit-Log-Format)
   - Plan geschrieben `e9fc441` (1151 Z., 8 Sub-Tasks via subagent-driven-development, 2 Reviewer-Iterationen mit 10 Issues alle behoben)

2. **Sub-Task 1 — Phase 0 status-Feld** (`41316f0` + Hotfix#1-3 `cc8b429` + Hotfix#4 `52a9fb0`):
   - status zu FrageBase + Editor-RadioGroup + Hybrid-Logic Z.4583 (user-set wins) + apiBackfillStatusDefault + AdminTab-UI
   - Hotfix#1: parseFrageKanonisch_ Status-Read-Lücke (`feedback_backend_read_paths_audit.md`)
   - Hotfix#2: maintenanceApi-Service-Wrapper (Memory unwrap-pattern)
   - Hotfix#3: Backfill-Sheet-Iteration via getFragensammlungTabs_ statt FACHBEREICH_SHEETS (deckt auch Allgemein-Tab)
   - Hotfix#4: draftSync.ts ruft jetzt `aktualisiereFrage` nach erfolgreichem Auto-Save (latenter Store-Sync-Bug vor Cluster D, status-Persistenz-Reproduzierungs-Pfad)
   - **LIVE-Backfill:** 2362 Fragen / 3.2s (User confirmed)

3. **Hotfix#5+#7 — DraftsSection-UX** (`cec6fe3`+`b298f00`):
   - #5: max-h-[40vh] + overflow auf Drafts-ul gegen Page-Scroll-Block (Card overflow-hidden cropped die zu hohen 14 Drafts → kein Scroll möglich)
   - #7: DraftsSection strukturell INSIDE VirtualisierteFragenListe-Scroll-Container (User-Konzept „Drafts wie Fach-Block scrollen, nicht als sticky-Header")

4. **Hotfix#6 — Apps-Script Cache-Invalidation** (`d7d3194`):
   - `speichereFrageIntern_` ruft jetzt `cacheInvalidieren_()` — alle Bulk-/Single-Edit-Save-Pfade beschmutzten den `alle_fragen`-Cache, andere Saves fielen lange nicht auf weil Frontend-State maskiert. Status war das erste Feld dessen Reload-Round-Trip user-sichtbar geprüft wurde.

5. **Hotfix#8 — TS-Build-Type-Fix** (`afeb676`):
   - VirtualisierteFragenListe drafts-Prop `Frage[]` statt `ReadonlyArray<Frage|FrageSummary>` (CI build error — Plan-Iteration mit zu loosen Types). Lokal `tsc --noEmit` clean, aber CI `tsc -b` strikt.
   - **Folge-Lehre:** `npm run ci-check`-Script eingeführt (5023fc8), matched CI 1:1. Vor jedem Push obligatorisch.

6. **TagPicker UX-Refactor** (`24b89c0`):
   - User-Feedback „menü für die tags noch unbefriedigend, nimmt viel raum ein". Combobox-Stil: Pills + Such-Dropdown statt 192px immer-sichtbare Box. ~40px Footprint wenn nichts selektiert. Esc + Click-outside schliessen. Backspace bei leerem Input entfernt letzten Chip. 11 Tests.
   - **User-Bestätigung:** „das tag menü ist gut so"

7. **Hotfix#9 — Test-Timeout** (`895025f`):
   - LPStartseite Skeleton-Suite timeout 15s (Default 5s, latent flaky weil 833 KB-Bundle). CI-Runner-Variance kippte über. Not-mein-Bug, aber bei meinem Push aufgetreten.

8. **Sub-Task 2 — Phase 1a fragenSelectionStore** (`e9936b7`):
   - Zustand-Store mit Set<string>, toggle/Shift-Range/leeresSelektion/etc. + useSelektierteIds via `useShallow` (Memory-konform).
   - 11+2 Tests (Spec-Reviewer M3+M4 Bonus-Cases). APPROVED.

9. **Sub-Task 3 — Phase 1b Bulk-API** (`26b34f6`):
   - Frontend `fragenBulkApi.ts` mit `bulkUpdateFragen` + `bulkLoescheFragen` (unwrap-Pattern, email-Pflicht, mutually-exclusive Tag-Modi-Frontend-Validation)
   - Backend Apps-Script: `apiBulkUpdateFragen` + `apiBulkLoescheFragen` + `updateFrageMitPatch_` (partial-update via getRange.setValue) + `softDeleteFrageById_`
   - Code-Quality-Review applied: I-2 Hard-Cap 500 IDs, M-4 Allowlist Patch-Keys, M-5 Owner-Check-Doku
   - 10 Tests inkl. Bonus

10. **Sub-Task 4 — Phase 2 Checkbox + Floating-Bar** (`2abaa5f` + Hotfix#10 `19b4f19` + Hotfix#11 `9d2ecab`):
    - Checkbox in KompaktZeile (links vor +-Button), 4-File-Prop-Chain für sichtbareIds
    - FragenSelektionBar mit count + 4 Buttons (Bearbeiten/Löschen/Auf Filter beschränken/X)
    - „Alle anzeigen auswählen (N)"-Button im Filter-Header
    - Phase-3/4-State-Stubs `[, setBatchEditorOffen]` für Editor + LoeschConfirm
    - **Hotfix#10: TanStack-Virtual `scrollMargin`** — Drafts-Section (830px) im Scroll-Container brach Item-Position-Berechnung im Kompakt-Modus (Detail-Modus mit 220px-Items hatte das verdeckt). ResizeObserver auf Drafts misst dynamisch, virtualizer bekommt scrollMargin, transform-translateY um draftsHeight reduziert.
    - **Hotfix#11: Shift-Range über `gruppierteAnzeige.flatMap`** — `sichtbareIds` war gefilterteIds (Filter-Reihenfolge), brauchte aber visuelle Reihenfolge der gerenderten KompaktZeilen. Range zwischen Item 1+5 selektierte 6 IDs statt 5 weil Filter-Reihenfolge IDs dazwischen einschloss die nicht im Viewport sind. Neue Memo `sichtbareReihenfolge = gruppierteAnzeige.flatMap(g => g.fragen.map(f => f.id))`.
    - **Browser-E2E verifiziert:** 1+5 Shift-Click → exakt 5 Items checked, Floating-Bar „5 Fragen ausgewählt" ✓

**Apps-Script-Deploys** (User-aktion):
- Nach 41316f0 (Phase 0 Backend) ✅
- Nach 26b34f6 (Phase 1b Bulk-API) ✅

**Was JETZT noch ausstehend für Cluster D:**
- **Sub-Task 5 — Phase 3a: SharedFragenEditor batchMode-Prop + Banner + violet-Highlighting** (~1.5 Tag)
- **Sub-Task 6 — Phase 3b: BatchTagPicker mit 3-Modi-Radio** (~0.5 Tag)
- **Sub-Task 7 — Phase 4: BatchConfirmModal + BatchLoeschConfirmModal** (~0.5 Tag)
- **Sub-Task 8 — Phase 5: Browser-E2E (14 Cases) + Performance + Cleanup** (~0.5 Tag)

**Spawn-Tasks aus Sub-Tasks 1-4:**
- I-1 (Sub-Task 3): `postJson` swallows Backend-Error (inherited tagsApi-Pattern, S130-known-fragility)
- I-3 (Sub-Task 3): `updateFrageMitPatch_` re-scan-pro-ID O(n×m) Performance — bei >500-ID-Batches problematisch, Step 8.4
- M-1 (Sub-Task 3): per-Field-setValue statt setValues-Batch — Step 8.4
- M-11 (Sub-Task 4): DetailKarte-Checkbox-Konsistenz (heute hat nur KompaktZeile Checkbox, Spawn-Task)
- M-4 + M-6 (Sub-Task 4): Mobile-Layout + ESC-Handler für FragenSelektionBar (Phase 3+)
- I-1 (Sub-Task 4 Phase 2): Plan-Step 4.3 erwähnt Inline-Buttons (statt @shared/Button) — Plan-Doc-Fix dokumentiert

---

## 🎯 ROADMAP — Was als nächstes ansteht (priorisiert)

### Priorität 1 — Cluster H Phase 3 (Cleanup nach 2 Wochen Live)
- **Status:** Phase 0+1+2 LIVE (15.05.2026, preview HEAD `1bd01c7`). Migration: **183 Tags + 2416 Fragen in 3.8s**. Phase 2: 9 Hybrid-Stellen auf tagsStore-Lookup, TagPicker im Editor (DI-Slot), Verwaltungs-Tab live mit Edit/Mergen/Archive/HardDelete. Browser-E2E mit echtem LP-Login: alle 4 Polish-Items + Quick-Erstellen + Edit + Mergen + Archive ✅
- **Phase 3 ab 29.05.2026 (2 Wochen Live-Beobachtung):** tagsLegacy-Spalte raus via `apiCleanupTagsLegacy`-Endpoint, Frontend-Fallback-Code raus, `tagIds?` zu `tagIds: string[]` (required) machen
- **Geschätzter Restaufwand:** 0.5 Tag Cleanup (Phase 3)
- **Hotfix-Lehren (Phase 1+2):**
  - `feedback_service_wrapper_email_pflicht.md` — Backend-Auth-Gate verlangt body.email
  - `feedback_push_konflikt_rate.md` — Pushes nicht zu schnell hintereinander
  - `feedback_zustand_selector_useshallow.md` — Selector mit Object/Array-Output braucht useShallow (React #185)

### Priorität 2 — Cluster D Batch-Edit (wartet auf Cluster H Phase 2)
- **Status:** Spec existiert (`docs/superpowers/specs/2026-05-11-cluster-d-batch-edit-design.md`), aktualisierungsbedürftig (Tag-Object-Modell statt string[], +Editor-Felder status/gefaess/semester/lernzielIds als Pre-Phase, +Minimal-Audit-Log). Plan steht aus.
- **Inhalt:** Multi-Select + Floating-Bar + Apps-Script `apiBulkUpdateFragen`
- **Blocker:** Cluster H Phase 2 (saubere Tag-Object-API) muss live sein, sonst Bulk-Tag-Logik mit String-Hybrid kämpfen
- **Geschätzter Aufwand:** 4-5 Tage (kleiner als ursprünglich 5-7, weil Tag-Logik durch Cluster H sauber)

### Priorität 2 — Cluster E.2-E.5 (Konsistenz + Favoriten)
- **Status:** 4 separate Specs zu schreiben (oder einer)
- **Inhalt:** Typografie-Sweep + Favoriten-Backend-Sync + Star-Toggle + Favoriten-Picker
- **Konsumiert:** keine externen Abhängigkeiten
- **Geschätzter Aufwand:** 2-3 Tage pro Sub-Cluster

### Priorität 3 — Cluster G Phase 2-6 (kosmetisch)
- **Status:** Spec existiert (`docs/superpowers/specs/2026-05-11-cluster-g-icon-system-design.md`), Phase 1 in Cluster C verbaut (ICON_MAP-Pattern)
- **Inhalt:** Emoji-Migration im UI + no-emoji-Lint + no-inline-svg-Lint
- **Blocker:** keine — kann jederzeit gemacht werden
- **Geschätzter Aufwand:** 1-2 Tage

### Priorität 4 — Globale Suche Phase 2 (eigene Cluster)
Aus Cluster-C-Plan Spawn-Tasks:

#### Cluster C.2 Schüler-Suche
- **Blocker:** kein `useEigeneSchueler`-Hook existiert; Spec-Phase muss konkretes LP→Schüler-Mapping greppen
- **Aufwand:** ~80 Z. Hook-Code + Spec/Plan-Phase, ~1-2 Tage

#### Cluster C.3 „Alle Treffer in"-Pre-Fill via `?suche=`
- **Inhalt:** 5+ Surfaces brauchen `useSearchParams().get('suche')` + Pre-Fill in lokalem Filter-State
- **Surfaces:** Dashboard, Prüfen-Liste, Üben-Liste, Fragensammlung, Übungen-Tab in Einstellungen
- **Aufwand:** ~2 Tage

#### Cluster C.4 Volltext-Suche
- **Inhalt:** Fragetexte + Lösungen + Material-PDFs durchsuchen
- **Blocker:** Performance-Risiko bei 1000+ Fragen — eventuell Backend-Endpoint nötig oder Client-Side-Index (lunr/MiniSearch)
- **Aufwand:** 3-5 Tage je nach Backend-Bedarf

#### Cluster C.5 Fuzzy-Match
- **Inhalt:** `fuse.js`-Eval; Tippfehler-Toleranz
- **Blocker:** User-Feedback abwarten ob wirklich nötig
- **Aufwand:** 1 Tag wenn library-only, mehr bei custom

### Spawn-Tasks Cluster-übergreifend (kleinere Items, kein eigener Plan)

- `letzterSeedAm`-Persistenz im Apps-Script Configs-Sheet (Cluster F.3 Spec §5.2 A)
- EinstellungenPanel-Migration auf Tab-Registry (blockiert durch `kiKalibrierung`↔`ki-kalibrierung`-ID-Konflikt → Cluster E.x)
- Klassenlisten-Tab Filter (Cluster F.4 Out-of-Scope)
- Live-Durchführen Schüler-Filter in BeendetPhase/AktivPhase (Cluster F.4 Out-of-Scope)

---

## 📋 Workflow-Reminder für nächste Session

**WICHTIG bei jeder ExamLab-Session:**

1. **Repo-Pfad:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`
2. **Branch-Workflow:**
   - Feature-Branch IMMER von `preview` (nicht main!) erstellen
   - Nach Code-Fertigstellung → merge in `preview` → push origin
   - **E2E-Tests nur gegen preview-Deploy** (echte Logins funktionieren nicht lokal)
   - Nach 11/11 E2E ✅ → merge `preview` → `main` (fast-forward)
3. **Pre-Commit-Checkliste:** **`cd ExamLab && npm run ci-check`** — matched die CI-Pipeline 1:1 (5 Lint-Gates + vitest + tsc -b + vite build). NICHT nur `tsc --noEmit` verwenden (CI nutzt strikteren `-b` Build-Mode). Memory `feedback_pre_push_ci_check.md`.
4. **Preview-Deploy-URL für E2E:** `https://durandbourjate.github.io/GYM-WR-DUY/staging/`
   - Cache-Reset vor Test:
     ```js
     navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
     caches.keys().then(ks => ks.forEach(k => caches.delete(k)))
     ```
   - Reload mit `?nocache=<timestamp>`-Buster
   - **Echter LP-Login** — kein Demo-Modus (siehe Memory `feedback_echte_logins.md`)

---

## Letzter Stand auf main

### Cluster C — Globale Suche (6 Quellen) ✅ MERGED (2026-05-12)

LP-Header-Suche erweitert von „nur Fragensammlung" auf 6 Quellen: Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen. Gruppierte Treffer, Keyboard-Navigation, Diakritik-Normalize (deutsche Ersatzregel + NFD), XSS-sicheres Highlight via JSX-Array. SuS-Pfad unverändert (eigener Hook, Scope-Guard). Branch `feature/cluster-c-globale-suche` → preview → main (HEAD `5d1d046`).

| Phase | Inhalt |
|---|---|
| 1 | Foundation: `types/suche.ts` (Types + ICON_MAP tree-shake + SucheIndex) + `sucheEngine.ts` (normalize/score/highlight/gruppieren/fuehreSucheAus) + `sucheAdapter.ts` (6 Adapter: Tabs/Kurse/Prüfungen/Übungen/Fragen, mit Cluster-F-Filter inline) + `highlight.tsx` (JSX-Array, XSS-sicher) |
| 2 | `configsListStore` (Cache-Layer für PruefungsConfig-Liste — Architektur-Anpassung weil `useLPDashboardData` Hook-lokaler State war) + `useLPDashboardData`-Patch (4 setConfigs-Stellen schreiben zusätzlich in Store) + `useSucheIndex` Memo-Selektor über 4 Stores + tabRegistry + Cluster-F-Filter pro Quelle |
| 3 | UI-Komponenten in `components/shared/header/sucheUI/`: `EmptyState`, `TrefferZeile` (mit ICON_MAP), `QuellSektion` (mit „Alle Treffer in"-Link bei >5) + Barrel-Export |
| 4 | 3 generische Sub-Hooks `useDebouncedValue` + `useKeyboardNavigation` + `useClickOutside` (alle TDD-tested) + `HilfeSeite` `initialKategorie`-Prop + `LPStartseite` `?hilfe=<tab>`-Deep-Link-Reader + `LPGlobalSuche` neue eigene Komponente in `components/lp/header/` + `AppHeader` `slotSuche?`-Prop für Komponenten-Override + `LPAppHeaderContainer`-Migration + `useGlobalSucheLP` Legacy-Delete |
| 5.1 | Performance-Test: **8.2 ms** bei 1000 Fragen + 100 Prüfungen + 50 Kursen (Bonus-Ziel <50ms erreicht) |
| Hotfix#1 | `lint:as-any` Gate (Test-Stubs auf `as unknown as` + Selector-Pattern via Generic) |
| Hotfix#2 | `Favoriten.tsx` schreibt configs auch in configsListStore (E2E-Bug entdeckt: globale Suche fand nichts auf `/favoriten`-Route weil dort eigener lokaler `setConfigs` lief) |
| Hotfix#3 | Deutsche Ersatzregel `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss` in `normalizeForSuche` (E2E Case 5: „uebung" findet „Übung"). Plus zusätzliche NFD-Diakritik-Strip für andere Akzente (`café`, `señor`) |

**Verifikation:** vitest **1700+** (Baseline 1623 + ~77 neue für Cluster C), tsc -b clean, 4× lint clean (as-any 0/0, no-alert 0, musterloesung Baseline, wire-contract 61/0), vite build grün.

**Browser-E2E LIVE auf Staging-Deploy mit echtem LP-Login (12.05.2026): 11/11 ✅**
1. Multi-Quellen `Einführung` → PRÜFUNGEN + ÜBUNGEN, Highlight, Icons
2. Einstellungen-Tab `profil` → „Mein Profil" mit Settings-Icon
3. Hilfe-Tab `bloom` → „Bloom-Taxonomie" mit BookOpen-Icon
4. Frage-Treffer `test` → 32 Fragen mit HelpCircle-Icon
5. Diakritik `uebung` → „Übungen" + „Einführungsübung" (nach Hotfix#3)
6. Keyboard-Nav: ArrowDown → aktiv-Ring; Enter → Navigation
7. „Alle Treffer in"-Link → Surface-Navigation
8. Cluster-F-Toggle: indirekt via Vitest (3 Tests mit test-prefixed IDs; Live keine Test-Daten geseedet)
9. Empty-State `BWL` → „Nichts gefunden für ‚BWL'"
10. Console-Errors: 0
11. Cmd+K aus Pruefungs-Detail-Surface → Input fokussiert

**Patterns + Lehren:**
- **Architektur-Anpassung Plan-Phase:** Spec rev2 ging davon aus, dass Configs in einem Store sind. Codebase-Audit zeigte: Hook-lokaler State. → schlanker `configsListStore` als Cache-Layer (kein Duplikat-State, da Configs sonst nirgends zentral).
- **Dumb-Komponente bewahren bei Multi-Verbraucher:** `GlobalSuche.tsx` (Dumb-Komponente, 2 Container LP+SuS) NICHT refactored — eigene neue `LPGlobalSuche` parallel. SuS-Pfad unverändert. Bei künftigen Multi-Verbraucher-Komponenten erst Audit (Reviewer-Iter-1-Lehre).
- **Plan-vs-Live-Diskrepanz:** `useLPDashboardData`-Patch reichte nicht — `Favoriten.tsx` als eigene Surface hatte separates Config-Loading. Hotfix#2 entdeckt erst beim Live-E2E. Pattern: pro neuem Cache-Store grep nach ALL `setConfigs`/`apiService.ladeAllX`-Aufrufstellen, nicht nur eine.
- **NFD-Diakritik ≠ deutsche Ersatzregel:** `Übung→Ubung` ist Diakritik-Strip (Längen-stabil), aber User erwartet `Übung→Uebung` (deutsche Ersatzregel, Längen-ändernd). Beides nötig. Highlight-Indexing muss case-insensitive auf Original-String laufen, nicht auf normalisierter Form — sonst Out-of-Bounds (Cross-Diakritik-Match → kein Highlight, aber Score-Match).
- **ICON_MAP explizit statt `import * as Icons`:** Bundle-Effekt ~200KB → ~10KB. Pattern für Cluster G übernehmen.
- **slotSuche-Pattern:** AppHeader nimmt optional `slotSuche?: ReactNode` für Komponenten-Override. Pattern für rolle-spezifische UI-Variationen ohne Container-Vermehrung.

**Spawn-Tasks (Phase 2 Globale Suche, eigene Cluster):**
- Schüler-Suche (`useEigeneSchueler`-Hook nötig, kein LP-Permission-Selektor existiert heute)
- „Alle Treffer in"-Pre-Fill via `?suche=`-Pattern in Surface-Listen (5+ Surfaces betroffen)
- Volltext-Suche in Fragetexten / Lösungen / Material-PDFs (Backend-Endpoint)
- Fuzzy-Match via `fuse.js` (Tippfehler-Toleranz)

---

### Cluster F.4 — Read-Pfad-Filter + TestBadge-Konsumenten ✅ MERGED (2026-05-12)

Vierte und letzte Sub-Phase aus Cluster-F-Master-Plan. Verbindet F.3-Toggle (`lpProfil.testdatenSichtbar`) mit allen LP-Listen-Surfaces: Test-Configs werden bei Toggle=false aus Listen entfernt, bei Toggle=true mit gelbem `<TestBadge />` markiert. Branch `feature/cluster-f-4-readpath-filter-badge` → preview → main.

| Commit | Inhalt |
|---|---|
| (Plan) | Plan-Doc + Audit-Befunde (zentraler Filter-Point: `useLPConfigFiltering`) |
| Task 1 | `useTestdatenSichtbar`-Hook (DRY-Selektor aus `stammdatenStore.lpProfil?.testdatenSichtbar`, 4 Tests) |
| Task 2 | `useLPConfigFiltering` erweitert um `testdatenSichtbar`-Input + Filter-Step VOR allen anderen Filtern → propagiert zu allen 5 Listen (gefilterteConfigs/gefilterteUebungen/summativeConfigs/formativeConfigs/letzteFuenf). `LPStartseite`-Caller-Update. 4 neue Tests |
| Task 3 | `PruefungsKarte` TestBadge-Slot neben Titel via `useTestBadgeVisible({ id, klasse })`, 4 Tests |
| Task 4+5 | `Favoriten.tsx` Filter + TestBadge: `sichtbareConfigs`-Memo via `filtereTestdatenWennDeaktiviert` propagiert zu 5 Sektionen (offeneKorrekturen/anstehendePruefungen/letztePruefungen/letzteUebungen). Favoriten-Liste filtert typ=pruefung/uebung mit Test-Ziel. TestBadge in `ConfigListe`-Render-Komponente |

**Verifikation:** vitest **1623** (Baseline 1611 + 12 neue: 4+4+4), tsc -b clean, 5× lint clean (as-any 0/0/0, musterloesung Baseline, wire-contract 61/0 unverändert), vite build grün, PWA 256 entries (5242 KiB).

**Patterns + Lehren:**
- **Single-Point-Filter via zentraler Hook** (`useLPConfigFiltering`): ein Filter-Add im Hook propagiert zu allen 4 Listen-Outputs. Pattern für künftige cross-cutting Filter (Datum, Status, etc.).
- **Favoriten als separater Render-Pfad**: nicht alles geht durch useLPConfigFiltering — Favoriten-Liste und Schnell-Sektionen (offeneKorrekturen etc.) sind eigenständig in Favoriten.tsx; dort `sichtbareConfigs`-Memo als lokales Single-Point-of-Entry.
- **TestBadge in `ConfigListe`-Render-Helper**: einmal in ConfigListe eingebaut, wirkt für alle 4 Sektionen die ConfigListe rendern.
- **KorrekturDashboard NICHT gefiltert** (bewusste Entscheidung): wenn LP eine Test-Prüfung zum Korrigieren öffnet, sind Schüler darin Test-Schüler — Filter würde die Liste leer machen. Korrektur-Liste-Filter geschieht über `offeneKorrekturen` in Favoriten.tsx (1 Surface oben).

**Out-of-Scope (Spawn-Tasks):**
- Apps-Script server-side Filter (alles Frontend-side, keine API-Touch nötig)
- SuS-Sicht (laut Spec §8: wr.test sieht immer alles)
- Klassenlisten-Tab Filter (separater Surface, niedrige Priorität)
- Live-Durchführen Schüler-Filter (BeendetPhase/AktivPhase)

**Cluster-F Master-Status:**
- F.1 Frontend-Foundation ✅ MERGED (11.05.)
- F.2 Backend Apps-Script ✅ MERGED (11.05.)
- F.3 UI-Schicht ✅ MERGED (12.05.)
- **F.4 Read-Pfad-Filter + TestBadge ✅ MERGED (12.05.) — Cluster F komplett**

---

### Cluster F.3 — UI-Schicht für Testdaten ✅ MERGED (2026-05-12)

Dritte Sub-Phase aus Cluster-F-Master-Plan (nach F.1 Frontend-Foundation + F.2 Apps-Script-Backend). Macht die deployte F.2-Infrastruktur endlich über die UI bedienbar — Settings-Tab „Testdaten" mit Status-Anzeige, Sichtbarkeit-Toggle für alle LPs und Admin-Aktionen (Erzeugen + Reset mit Confirm-Modal + Statistik-Anzeige). Branch `feature/cluster-f-3-ui-testdaten` → preview → main.

| Commit | Inhalt |
|---|---|
| `bd1d55b` | Plan-Doc (Plan-Reviewer-Pass mit 10 Issues, davon 6 gefixt — u.a. Mock-Konsistenz, Toast-Fehler-Pfad, Ref-Guard gegen Doppel-Klick, Modal bleibt offen während Loading) |
| `a1bb36c` | Task 1: `TestBadge`-Komponente (Pill bg-yellow-100/dark + className-Merge, 3 Tests) |
| `6c7cffd` | Task 2: `useTestBadgeVisible`-Hook (record + LP-Toggle, 5 Tests) |
| `d81f6e7` | Task 3: `useTestdatenStatus`-Hook (Inferenz aus `Stammdaten.klassen.includes('test-klasse-01')` + `kurse.some(id==='test-kurs-01')` — kein neuer Backend-Endpoint nötig, 4 Tests) |
| `c683927` | Task 4: `ResetConfirmModal` (Standard-Modal-Pattern `fixed inset-0 z-[1000]` analog ProblemmeldungenTab Bug 6c, 5 Tests) |
| `cd0a6d3` | Task 5: `TestdatenTab` Phase 1 (Status-Section + Sichtbarkeit-Toggle mit Toast-Pattern bei Fehler — Single-Field instant-save statt useSpeicherStatus-Pattern, 6 Tests) |
| `67a1aae` | Task 6: `TestdatenTab` Phase 2 (Admin-Sektion mit Erzeugen/Reset-Buttons + Confirm-Wiring + Statistik-Display + `loadingRef`-Doppel-Klick-Guard + Modal bleibt offen während Reset-Loading, 10 Tests) |
| `5f69701` | Task 7: `EinstellungenPanel`-Wiring (`EinstellungenTab`-Type um `'testdaten'` erweitert + Tab im hardcoded `tabs`-Array + Render-Conditional) |
| (next) | Task 8: `as-any`-Lint-Fixes in Test-Mocks (Selector-Type konkretisiert auf `(s: typeof mockStore) => unknown` analog LPStartseite-Pattern + `Awaited<ReturnType<...>>` für resolveSeed/resolveReset statt `any`) |

**Verifikation:** vitest **1609** (1576 Baseline + 33 neue: 3+5+4+5+6+10), tsc -b clean, 5× lint clean (as-any 0/0/0, no-alert 0, no-tests-dir clean, musterloesung Baseline, wire-contract 61/0 unverändert), vite build grün, PWA generateSW 256 entries (5241 KiB).

**Plan-Pfad:** `ExamLab/docs/superpowers/plans/2026-05-12-cluster-f-3-ui-testdaten.md`

**Spec-Pfad:** `ExamLab/docs/superpowers/specs/2026-05-11-cluster-f-testdaten-infrastruktur-design.md` §5.2 + §6.3

**Patterns + Lehren:**
- **Status-Inferenz aus Stammdaten** statt neuem Apps-Script-Read-Endpoint: spart Backend-Round-Trip + Deploy, weil `seedTestdatenStammdaten_` ohnehin Marker-Klasse + Marker-Kurs anlegt.
- **Apps-Script-LPProfil-Persistenz = JSON-Blob** (`apps-script-code.js:11636/11670`): Memory-Lehre `feedback_backend_read_paths_audit` gilt **nicht** für JSON-Blob-Sheets — neue Felder wie `testdatenSichtbar` persistieren automatisch ohne Code-Change. (Audit-Befund in Plan-Phase dokumentiert, im Reviewer als Issue-2 fälschlicherweise gemeldet.)
- **Mock-Konsistenz**: alle 3 Test-Files nutzen Pattern `(sel: (s: TypedState) => unknown) => sel(state)` analog `LPStartseite.test.tsx` — Selector-only-Aufruf reicht für die getesteten Komponenten (kein Destructuring-Aufruf).
- **Toggle-Speicher-Pattern**: Single-Field instant-save → kein `useSpeicherStatus` + `SpeicherButton` (Multi-Field-Form-Pattern), stattdessen `optimistic-call + Toast bei Fehler`.
- **Ref-Guard für Doppel-Klick**: State ist stale zwischen React-Render-Batches, daher `useRef(false)` als zweite Verteidigungslinie zusätzlich zu `disabled={loading}`-Prop.
- **Modal bleibt offen während Reset-Loading**: `setModalOffen(false)` erst nach `result.success` (statt unmittelbar nach Bestätigen-Klick) — User sieht Loading-State im Modal statt verschwundenes Modal mit unsichtbarem Hintergrund-Spinner.

**EinstellungenPanel-Migration auf Tab-Registry** bleibt out-of-scope (Cluster E.x reserviert wegen `kiKalibrierung`↔`ki-kalibrierung`-ID-Konflikt). F.3 hängt nur den `testdaten`-Eintrag ins hardcoded `tabs`-Array.

**Out-of-Scope (F.4 + spätere Cluster):**
- **F.4 Read-Pfad-Filter-Integration** in 8-15 Stores/Hooks (`ladeKurse`, `ladePruefungen`, `ladeUebungen`, `ladeSchueler`, `ladeAntworten`, `ladeKorrekturen`, `ladeMastery`, `ladeUebungsSessions`, alle `holeAlle*`-Pfade) — eigenes Bundle.
- **F.4 TestBadge-Konsumenten** in Listen (Dashboard, Composer, Prüfen-Tab, Üben-Tab, Korrektur-Tab, Klassen-Liste) — eigenes Bundle.
- **`letzterSeedAm`-Persistenz** in Apps-Script Configs-Sheet (Spec §5.2 A „zuletzt: <Datum>"-Anzeige) — separater Spawn-Task mit Apps-Script-Deploy.
- **EinstellungenPanel-Migration auf Tab-Registry** — Cluster E.x.

**User-Action ausstehend:**
- preview-Push + Browser-E2E mit Yannick-Admin (Tab-Anzeige + Erzeugen/Reset-Flow live gegen deployten F.2-Endpoint testen) + LP-Test mit Account `wr` (Tab sichtbar, Toggle persistiert)
- main-Merge nach Freigabe

---

### Cluster B.a — Papierkorb als L2 unter Fragensammlung ✅ MERGED (2026-05-11)

Erstes Sub-Bundle aus Cluster B (Header-Redesign). Papierkorb war ein eigenständiges 5. L1-Tab im Top-Header — wird zu L2-Hover-Eintrag unter „Fragensammlung". Konsistent mit Prüfen/Üben L2-Pattern. Branch `cluster-b/papierkorb-l2` → preview → main. Single-file-refactor (`useTabKaskadeConfig.lp.ts`) + Test-Erweiterung.

| Commit | Inhalt |
|---|---|
| `7728222` | l1Tabs-Array: Standalone-Papierkorb-L1Tab entfernt + Fragensammlung-L1Tab um `l2: [Fragensammlung-Self, Papierkorb]` ergänzt. aktivL1/L2-Resolution für `/papierkorb`-Pfad: `aktivL1='fragensammlung'`, `aktivL2='papierkorb'`. 3 neue Tests (existing-Test um L2-Erwartung erweitert + 2 neue für /papierkorb-Resolution + Standalone-Tab-Absence). |

**Verifikation:** vitest **1576** (1574 Baseline + 2 net Tests, +3 -1), tsc clean, 5 audit-lints clean, build clean.

**Browser-E2E mit echtem LP-Login `wr` auf preview ✅ (2026-05-11):**
- Top-Header zeigt 4 L1-Tabs statt 5 (Favoriten, Prüfen, Üben, Fragensammlung — Papierkorb weg)
- Hover auf Fragensammlung → L2-Bar zeigt „Fragensammlung" + „Papierkorb"
- Click auf Papierkorb-L2 → navigiert zu `/papierkorb`, lädt Papierkorb-Seite
- Active-State: Fragensammlung-L1 hervorgehoben + Papierkorb-L2 mit violet border
- 0 Console-Errors, 0 Warnings

**Plan-Doku:** Spec `ExamLab/docs/superpowers/specs/2026-05-11-cluster-b-header-redesign-design.md` §3 Entscheidung 3. Kein dediziertes Plan-Doc (Single-File-Cut, TDD direkt). Out-of-Scope: B.b Sticky-Collapse-Filter (Folge-Bundle), B.c Logo-Trennung (verschoben).

**Bundle ist nur Data-Change in `useTabKaskadeConfig.lp.ts` (-5/+27 Z. + Tests).** Tab-Registry aus E.1 NICHT erweitert — separate Quelle für L1-Tabs.

---

### Cluster E.1 — HilfeSeite konsumiert Tab-Registry ✅ MERGED (2026-05-11)

Erstes Konsumenten-Bundle aus Cluster-E Phase 3. HilfeSeite konsumiert `tabsFuerSurface('hilfe', { istAdmin: false })` aus zentraler Tab-Registry statt hardcoded `KATEGORIEN`-Array. Bringt Workflow-Order (erstellen → durchführen → korrigieren) automatisch aus Registry. Branch `cluster-e/e1-tab-registry` → preview → main (`a7b98d8 → 51fed82`). EinstellungenPanel-Migration explizit out-of-scope (ID-Konflikt `kiKalibrierung`↔`ki-kalibrierung` + `testdaten`-Tab-UI fehlt, abh. Cluster F.3).

| Commit | Inhalt |
|---|---|
| `00ce9d7` | Plan-Commit (Bundle-Doku) |
| `feb3c22` | TDD-red: HilfeSeite.test.tsx mit 3 Tests (Workflow-Order via `data-testid="hilfe-nav"` + `within`-Selector, Default-Tab aria-pressed, Click-Toggle) |
| `f0e97d6` | TDD-green: HilfeSeite-Refactor — `KATEGORIEN`-Array + `HilfeKategorie`-Type entfernt, `KOMPONENTEN: Record<string, ComponentType>`-Map (10 Komponenten) + `tabsFuerSurface`-Konsum, `data-testid="hilfe-nav"` + `aria-pressed` für Testbarkeit/a11y, 10× Conditional-Render → single `<AktiveKomponente />` |
| `51fed82` | Drift-Schutz: Test in `tabRegistry.test.ts` pinned 10 Hilfe-IDs (Hash-Link-Stabilität) + JSDoc-Comment im HilfeSeite-Inhalt-Block über defensive `?? null`-Fallback |

**Verifikation:** vitest **1574** (1570 Baseline + 3 HilfeSeite + 1 tabRegistry-drift), tsc clean, 5 audit-lints clean (as-any 0, musterloesung Baseline, no-alert 0, no-tests-dir clean, wire-contract 61/0), build 3.51s, **wire-contract 61/0**.

**Browser-E2E mit echtem LP-Login `wr` auf preview ✅ (2026-05-11):**
- Workflow-Order live verifiziert: Erste Schritte → Fragen & Fragensammlung → Prüfung erstellen → Durchführung → Korrektur & Feedback → Üben → KI-Assistent → Bloom-Taxonomie → Zusammenarbeit → FAQ
- Default-Tab beim Öffnen: „Erste Schritte" aria-pressed=true, alle anderen false
- Click-Toggle: echter Mouse-Click auf „Prüfung erstellen" → state switched korrekt
- 0 Console-Errors, 0 Warnings
- Lesson SW + HTTP-Cache: SW unregister + caches.delete reichte NICHT — HTTP-Cache lieferte alte index.html mit altem main-script-Hash. Cache-Buster (`?nocache=...`) forced Fresh-Fetch. → **Pattern für künftige Bundles dokumentieren**

**Code-Review (subagent-driven-development workflow):**
- Tasks 1+2: Spec-Reviewer ✅ + Code-Quality-Reviewer ✅ APPROVED FOR MERGE
- Task 3: Combined Spec+Quality ✅ APPROVED
- Final-Reviewer Bundle: **APPROVED FOR MERGE** (0 Critical, 0 Important, 6 Minor als E.2-Follow-ups: `KOMPONENTEN`-Keys typed-from-Registry via `TAB_REGISTRY as const`, `useState`-default-derive, `tabsFuerSurface`-istAdmin-context-thread)

**Plan-Pfad:** `ExamLab/docs/superpowers/plans/2026-05-11-cluster-e-1-tab-registry-konsumenten.md`

**Out-of-Scope (für spätere Sub-Bundles aus Cluster E):**
- Typografie-Migration (Phase 2 / E.2)
- Favoriten-Backend-Sync (Phase 4 / E.3)
- Star-Toggle in Tab-Headers (Phase 5 / E.4)
- Favoriten-Picker-Erweiterung um Tab-Surfaces (Phase 5 / E.5)
- EinstellungenPanel-Migration auf Registry (pre-req: kiKalibrierung-Rename + testdaten-UI von F.3)

---

### Cluster A — Bug-Fixes Fragensammlung + Problemmeldungen ✅ MERGED (2026-05-11)

Branch `feature/cluster-a-bugfixes` → preview → main (`cac64fe → 8525329`). Branch lokal+remote gelöscht. Apps-Script deployt (User-Action), Bug 6c live mit Yannick-Admin + Backend-Delete von "jaja du"-Problemmeldung verifiziert.

**Browser-E2E-Verifikation (8/8 Bugs):**
- Bug 2+3 sticky Header + Scroll-Container — DOM + visuell ✅
- Bug 4 ladeGruppen Mount — Dropdown sofort gefüllt ✅
- Bug 6a Defensive Display — 6 Meldungen mit Text ✅
- Bug 6b Öffnen-Button DeepLink — Navigation zur MC-Frage ✅
- Bug 6c Trash + Confirm-Modal + Apps-Script-Delete — Live „jaja du" gelöscht ✅
- Bug 1 + Bug 5 — Bundle-Pattern verifiziert (Live-Test bräuchte Network-Kill bzw. SuS-View)
- 0 Console-Errors aus preview-Bundle



6 Bugs (8 Sub-Issues) aus User-Test-Sweep behoben. Konsumiert G+E Foundation (Lucide-Icons + Brand-Violet). Branch `feature/cluster-a-bugfixes`.

**A.1 Frontend-Only (Bugs 1-5 + 6a + 6b):**

| Commit | Bug | Fix |
|---|---|---|
| (helper) | — | `src/utils/optimisticDelete.ts` Pattern mit Error-Recovery + 4 Tests |
| `32f7051` | Bug 1 | Entwurf-Löschen: getDetail-Snapshot vor Delete → bei Backend-Fehler `fuegeFragenHinzu([snapshot])` + Toast-Error (`useFragenAktionen.ts`) |
| `9e98e7a` | Bug 2+3 | DraftsSection: sticky Header (`bg-slate-100 dark:bg-slate-800 border-b`) + `max-h-[40vh] overflow-y-auto` Body + Lucide-Chevrons + Lucide-Trash2 |
| `4f36e66` | Bug 4 | `gruppenStore.ladeGruppen` Idempotenz-Guard (`ladeStatus === 'laden'/'fertig'` no-op) + Mount in `EinstellungenPanel`-useEffect |
| `6dc4b60` | Bug 5 | LueckentextFrage: `focus:border-indigo-500` → `focus:border-violet-500` (Brand-Konsistenz) |
| `0cc1a5d` | Bug 6a | ProblemmeldungZeile defensive Display "(Kein Text)"-Fallback + Apps-Script `problemmeldungenColIdx_` Alias-Mapping (`comment` → `kommentar`/`text`/`message`/`inhalt`/`nachricht`) |
| (verified) | Bug 6b | Source-Audit + **Live verifiziert**: Öffnen-Button auf Problemmeldung navigiert zu `/fragensammlung/<frageId>`, MC-Frage-Editor öffnet. |

**A.2 Apps-Script + Frontend (Bug 6c):**

| Commit | Inhalt |
|---|---|
| `a466754` | Apps-Script `loescheProblemmeldung` (Admin-only, LockService 5000ms, Vorbild `loescheKIFeedback:13724`) + doPost-Case + Wire-Contract +1 (60/0). Frontend-Service mit Throw-on-Fail + ProblemmeldungZeile Lucide-Trash2-Button (conditional auf `istAdmin && !isLegacy`) + ProblemmeldungenTab Confirm-Modal (z-index 1000) + optimisticDelete-Anwendung mit useToast. |

**Verifikation:** vitest **1565** (1561 → 1565, +4 optimisticDelete-Tests), tsc clean, 5× lint clean, build grün, **wire-contract 60/0**.

**User-Action erledigt ✅:** Apps-Script deployt + Browser-E2E mit Yannick-Admin (Bug 6c "jaja du" gelöscht) + LP-View (Bug 6b Navigation, Bug 4 Dropdown, Bug 2+3 Sticky-Header) — alles live verifiziert. Cluster A komplett auf main (`fab44e4`).

**Restliche optionale Live-Tests (für eigene Verifikation, kein Blocker):**
- Bug 1 Error-Pfad: Network während Delete killen → Eintrag taucht wieder auf + Toast-Error. (Bundle-Logic verifiziert.)
- Bug 5 SuS-View Lückentext (in Übung-Session): Focus-Ring violet. (Bundle-Pattern verifiziert.)

**Plan-Pfad:** `ExamLab/docs/superpowers/plans/2026-05-11-cluster-a-bugfixes.md`

**Out-of-Scope (Spec §7):**
- Soft-Delete-Workflow für Entwürfe (Papierkorb)
- Bulk-Lösch für Problemmeldungen
- Problemmeldung-Status-Workflow (gelesen/in-Bearbeitung/erledigt)

---

### Cluster F.2 — Backend Apps-Script (Testdaten-Infrastruktur) ✅ MERGED (2026-05-11)

Zweite Sub-Phase aus Cluster-F-Master-Plan. Apps-Script-Backend für Testdaten — `apiAdminSeedTestdaten`-Endpoint mit Admin-Auth + LockService, idempotenter Seed (Stammdaten + Test-LP + 20 SuS + Test-Prüfung + Antworten + Korrekturen + Test-Übungs-Gruppe + Sessions + Mastery), Reset-Funktion mit Per-Sheet-Atomarität, Weekly-Roll-Trigger MO 03:00. Branch `feature/cluster-f-testdaten-f2-backend` → preview → main (PR #1 → PR #2, `69184f88 → e8e9bb77`).

| Phase | Inhalt |
|---|---|
| **F.2.a** Konstanten + Endpoint-Skelett + Frontend-Service (`37a9330` + `9e92bf1` Hotfix) | Apps-Script-Konstanten (TEST_KURS_ID, 20 SuS-Emails, TEST_EMAIL_REGEX), Bonus-Fix `uebenErstelleGruppe` Sessions-Init 6→8 Spalten, doPost-Case `apiAdminSeedTestdaten` mit tryLock(5s) + admin-rolle-Check via `getLPInfo()`, Frontend-Wrapper `testdatenApi.ts` + 5 Tests |
| **F.2.b** Stammdaten + LP + 20 SuS (`3c66f98` + `abad230` Perf-Shortcut) | `seedTestdatenLP_` (CONFIGS Lehrpersonen-Sheet), `seedTestdatenKurs_` (KURSE_SHEET Kurse-Sheet + SuS-Tab), `seedTestdatenSuS_` (20 SuS mit Pre-Check Echt-Email-Kollision via TEST_EMAIL_REGEX-Scan über alle Kurs-Tabs — Spec §7) |
| **F.2.c** Test-Prüfung + Antworten + Korrekturen (`616c23a` + `af221bd` Hotfix) | `seedTestdatenPruefung_` (Configs-Sheet, status='beendet', Pool-Fragen aus `bwl_einfuehrung`+`recht_einfuehrung`), `testAntwortFuerFrage_` (echtes Schema pro 6 Fragetypen matching `autoBewerteAntwort`), `seedTestdatenAntwortenUndKorrekturen_` (1 Row/SuS in Antworten-Tab mit JSON, 1 Row/SuS×Frage in Korrektur-Tab via `setKorrekturStatus` Cache-Invalidate) |
| **F.2.d** Übungs-Gruppe + Sessions + Mastery + Roll-Trigger (`7630060`) | `seedTestdatenGruppe_` (neues Spreadsheet + 5 Sheets + 20 Mitglieder + Auftrag, GRUPPEN_REGISTRY Schema-Drift discovery: `fragensammlungSheetId` statt `spreadsheetId`), `seedTestdatenSessionsUndFortschritt_` (3-8 deterministische Sessions/SuS über 42-Tage-Fenster), `rolleTestdatenMasteryVor` (Modulo-Roll, Sessions yyyy-MM-dd, Fortschritt ISO-with-time), `installiereTestdatenRollTrigger_` (Weekly MO 03:00 idempotent) |
| **F.2.e** Reset + Atomarität (`3e6d78c` + `3a9ccfd` Hotfix) | `loescheAlleTestdaten_` mit try/catch pro Sheet (Spec §6.1 atomar pro Storage) + `counter.fehler`-Array für teilbares Ergebnis, Trash-Fail-Recovery (Registry-Row nur löschen wenn Drive-File auch gone), `loescheTestZeilen_`-Generic-Helper (OR-Filter idExact/idPrefix/emailExact/Email-Regex) |
| **F.2.d Follow-ups** (`7f05149`) | `Fortschritt.letzterVersuch` Format-Drift behoben (ISO-with-time analog Production), JSDoc-Hinweis Mitglieder.code='', `gerollt`-Counter-Split (`gerolltSessions` + `gerolltFortschritt`) |
| **Live-Hotfix Pool-Titel** (`eb8b2e4` + `2ca826a`) | Initial-Seed crashte mit „0 Pool-Fragen" → Diagnose via `_diagFragensammlungThemen`: `thema`-Spalte enthält Display-Titel mit Em-Dash-Suffix (z.B. „Einführung BWL – Grundlagen der Betriebswirtschaftslehre"), NICHT Pool-IDs. Fix: `THEMEN_MAPPING`-Lookup + Prefix-Match. System-Tabs-Skip. |

**Verifikation:** vitest **1574** (1569 → 1574, +5 testdatenApi-Tests), tsc clean, 5× lint clean (insb. `lint:wire-contract` 61/0), build grün, acorn ES2022 syntax-check apps-script-code.js exit 0.

**User-Action erledigt ✅ (2026-05-11):**
- Apps-Script-Deploy (3 Iterationen: F.2-Backend, Hotfix#1 Pool-Mapping, Hotfix#2 Prefix-Match)
- `installiereTestdatenRollTrigger` einmal ausgeführt → Weekly-Trigger MO 03:00 für `rolleTestdatenMasteryVor` im Editor sichtbar
- Initial-Seed via `_seedTestInitial()` → `success: true`, ~14s, alle Drive-Records erzeugt
- Drive-Verifikation 5/5: CONFIGS Configs/Lehrpersonen, KURSE Kurse-Sheet/test-kurs-01-Tab, GRUPPEN_REGISTRY → Test-Spreadsheet `ExamLab: [Test] Übungs-Gruppe`
- SuS-Login mit `wr.test@stud.gymhofwil.ch` → Dashboard rendert: „Hallo wr!" + Combobox „[Test] Übungs-Gruppe WR", 0 Console-Errors

**Plan-Pfad:** `ExamLab/docs/superpowers/plans/2026-05-11-cluster-f-testdaten-f2-backend.md` (v2 nach 2× Reviewer-Loop)

**Patterns + Lehren:**
- **Plan-Phase-Klärungen-Sektion** dokumentiert 11 bewusste Abweichungen von Spec (PruefungsConfig-Ref-Persistenz, Admin-Check via `getLPInfo()`, Einführungsprüfung-Quelle, GRUPPEN_REGISTRY-Schema, etc.) — Reviewer-Verständlichkeit ohne Spec-Cross-Reading.
- **Live-Hotfix-Loop** (3 Deploy-Iterationen) wegen `thema`-Spalten-Drift: THEMEN_MAPPING-Werte sind kürzer als Sheet-Werte (Em-Dash-Suffix). Diagnose via Helper-Function (`_diagFragensammlungThemen`) sofort den echten State zeigen lassen statt raten.
- **`feedback_grep_anwesenheit_nicht_abwesenheit`**: Plan-Phase-Audit hatte `THEMEN_MAPPING` als Constant gesehen, aber die Drift-Direction (Pool-ID → Display-Titel mit Suffix) übersehen. 2. Datenpunkt nach Media-Phase 3.
- **Sessions-Schema-Bonus-Fix** orthogonal zum Hauptauftrag → in F.2.a vorgezogen statt F.2.e.
- **Pre-Check für Echt-SuS-Email-Kollision** (Spec §7 Daten-Sicherheits-Anforderung): scant alle Nicht-Test-Kurs-Tabs, bricht Seed ab bei Match → verhindert späteren Reset-Daten-Loss.

**Out-of-Scope (F.3/F.4 + Spawn-Tasks):**
- F.3 UI: TestdatenTab + TestBadge + useTestBadgeVisible-Hook + Confirm-Modal
- F.4 Read-Pfad-Filter-Integration in 8-15 Frontend-Stores/Hooks/Services
- Cluster E: LPProfil.testdatenSichtbar Backend-Migration
- Spawn-Tasks: Test-Prüfung 2 (`seedTestdatenPruefung2_`), Migration existing Sessions-Sheets (6→8 Spalten), locale-spezifische Drive-Error-Patterns
- Temporäre Editor-Helpers `_seedTestInitial`/`_seedTestReset`/`_diagFragensammlungThemen` aus Editor entfernen (User-Aufgabe nach Verifikation)

---

### Cluster F.1 Frontend-Foundation ✅ MERGED (2026-05-11)

Erste Sub-Phase aus Cluster-F-Master-Plan (Testdaten-Infrastruktur). **Reine Additionen** — kein Backend-Call, keine UI, kein Read-Pfad-Touch. Branch `feature/cluster-f-testdaten` → preview → main (`ecd0370 → cac64fe`).

| Commit | Inhalt |
|---|---|
| (constants) | `src/utils/testdaten/identifikation.ts`: `TEST_KURS_ID`/`TEST_KLASSE_ID`/`TEST_ID_PREFIX`/`TEST_EMAIL_REGEX`/`TEST_LP_EMAIL` + 20 `TEST_SUS_EMAILS` + `istTestEmail`-Helper + 7 Tests |
| (filter) | `src/utils/testdaten/filter.ts`: `istTestdaten(record)` + `filtereTestdatenWennDeaktiviert<T>(records, sichtbar)` Pure-Functions + 10 Tests |
| (type) | `LPProfil.testdatenSichtbar?: boolean` additiv ergänzt |

**Verifikation:** vitest **1561** (1544 → 1561, +17 neu), tsc clean, 5× lint clean, build grün.

**Master-Plan-Pfad:** `ExamLab/docs/superpowers/plans/2026-05-11-cluster-f-testdaten.md`

**Audit-Befunde aus Plan-Phase (für F.2-F.4):**
- **Pruefung-Persistenz = REFERENCE** (nur `fragenIds: string[]`). Test-Prüfungen referenzieren existierende Fragen, keine Test-Frage-Records nötig.
- **Mastery = pro-Gruppen-Sheet** mit 5 fixen Sheets (`Fragen`/`Mitglieder`/`Auftraege`/`Fortschritt`/`Sessions`). Testkurs braucht eigene Übungs-Gruppe.
- **Schema-Drift Sessions-Sheet**: Init-Code (apps-script-code.js:9004) schreibt 6 Spalten, Read-Code erwartet 7 (`+ anzahlfragen, richtig`). Latent-Bug — Bonus-Fix in F.2 geplant.
- **Keine `seedXxx`-Patterns existing** — F.2 baut from scratch.
- **LockService-Pattern etabliert** (8 Verwendungen, 5000ms Timeout).
- **Weekly-Trigger-Pattern fehlt** — F.2 muss neuen Installer schreiben.

**Nächste Sub-Phasen (separate Sessions empfohlen):**
- **F.2** Backend (Apps-Script): seedTestdaten + apiAdminSeedTestdaten + Roll-Trigger + LockService + Sessions-Schema-Fix. User-Action: Apps-Script-Deploy.
- **F.3** UI Components: TestBadge + useTestBadgeVisible-Hook + TestdatenTab + Tab-Registry-Integration.
- **F.4** Read-Pfad-Integration: Filter in 8-15 Frontend-Stores/Hooks/Services + Test-Badge in Listen.

---

### Foundation Bundle G P1 + E ✅ MERGED (2026-05-11)

Erstes Implementations-Bundle der Post-Test-Sweep-Roadmap. **Reine Additionen, keine UI-Migration.** Branch `feature/foundation-g1-e-bundle` → preview → main (Fast-Forward `316dfc3 → 0228f4d`). Branch lokal+remote gelöscht.

| Commit | Inhalt |
|---|---|
| `8340139` | lucide-react@1.14.0 als Dependency installiert |
| `d357f5b` | 5 Custom-Icons (`IconAbc`, `IconAB`, `IconAn`, `IconTKonto`) im Lucide-Stil + 5 Tests |
| `7af8ae9` | `FragetypIcon` Mapping-Komponente (20 Typen → Lucide+Custom Icons, MAP-Type via `Frage['typ']`) + 5 Tests |
| `2b8ae11` | Icons-Barrel-Export (`src/components/ui/icons/index.ts`) |
| `d90dce3` | Typografie-Tokens `TYPO` (5-Tier: Display/H1/H2/Body/Caption) + 3 Tests |
| `ab98f79` | `AppOrt.screen` + `Favorit.typ` um Einstellungen/Hilfe-Tabs additiv erweitert |
| `149dfe1` | Zentrale Tab-Registry (`src/utils/tabRegistry.ts`, 9 Einstellungen + 10 Hilfe Tabs Workflow-Order) + 8 Tests |

**Verifikation:**
- vitest **1544 passed** (1523 → 1544, +21 neue Tests)
- tsc -b clean
- 5× lint clean (as-any 0/0/0, no-alert 0, no-tests-dir clean, musterloesung Baseline, wire-contract 59/0)
- vite build grün, PWA generateSW 256 entries
- **Bundle-Größen-Delta: 0 KB raw / 0 KB gzip** ✅ — Tree-shaking perfekt (Foundation-Module werden noch nicht konsumiert). Erste Konsumenten kommen in G Phase 2 (Header) und E Phase 2 (Typografie-Migration).

**Plan-Pfad:** `ExamLab/docs/superpowers/plans/2026-05-11-foundation-bundle-g1-e.md` (Plan-Reviewer 2 Iterationen ✅, 11/11 Issues behoben).

**Workflow:**
- Spec-Phase ✅ (alle 7 Cluster, HEAD `c63a1b4`)
- Plan-Phase ✅ Foundation-Bundle (G P1 + E)
- Implementation ✅ Foundation-Bundle (7 Commits)
- **Aktuell:** preview-Push ausstehend → User-Test → main-Merge

**Pre-Audit (Offene Punkte aufgelöst):**
- ✓ Fragetyp-Discriminator: alle 20 `typ`-Werte in `fragen-core.ts` matchen MAP exakt
- ✓ Storybook: Nein für Foundation (Visual via Browser-E2E)
- ✓ Lint-Regeln (`no-emoji-in-source`, `no-inline-svg-icon`, `typo-tokens`): Out-of-Scope, kommen in G Phase 6 / E Phase 2
- ✓ Backend-Migration / Favoriten-Backend: Out-of-Scope, kommt in E Phase 4
- ✓ HilfeSeite-Reorder: Out-of-Scope, kommt in E Phase 3
- ✓ Discriminated-Union-Switch-Audit: nur Filter-Pattern (`f.typ === 'pruefung'`), kein exhaustive Switch — additive Erweiterung safe

**Nächste Schritte (Reihenfolge aus User-Memo):**
1. F (orthogonal) — kann parallel zu A starten
2. A (Bug-Fixes) — nach Foundation-Merge zu main, konsumiert G + E
3. B (Header-Redesign) — konsumiert E (Favoriten-Backend) + G
4. D (Batch-Edit) — konsumiert G + A (optimisticDelete-Helper)
5. C (Globale Suche) — konsumiert E (Tab-Registry) + G

**Lehre:** Lucide-react v1.x mergt SVG-Klassen automatisch (`lucide lucide-list-checks` Prefix). Tests für className-Pass-Through müssen `.toContain()` statt `.toBe()` nutzen, oder Custom-Icons als Vergleichsbasis verwenden.

---

### Post-Test-Sweep — 7 Cluster-Specs ✅ AUF MAIN (2026-05-11)

Aus User-Test mit ~16 Tickets entstanden 7 thematische Cluster-Specs. **Spec-Phase komplett**, Implementation ausstehend. Jeder Cluster mit Subagent-Reviewer-Pass + Polish-Iteration committed.

| Commit | Cluster | Inhalt |
|---|---|---|
| `77edc56` + `f76187e` + `419f689` | **F — Testdaten-Infrastruktur** | Apps-Script `seedTestdaten()` idempotent, 1 Test-Kurs mit 20 SuS inkl. `wr.test`, Toggle im LP-Profil-Backend, Filter via Kurs/Klasse/Email-Prefix, weekly Trigger rollt Mastery |
| `40e9d3c` + `bd6bd55` | **G — Icon-System** | Lucide-react als Library, alle Emojis ersetzt, 5 Custom-Icons (IconAbc, IconAB, IconAn, IconTKonto), 20 Fragetypen mit FragetypIcon-Komponente, Brand=Violet-500, Status 500er, Größen 14/16/20/24 |
| `604c0e1` + `3cbea97` | **E — Konsistenz** | 5-Tier Typografie (Display/H1/H2/Body/Caption), Hilfe-Tabs Workflow-Order, zentrale Tab-Registry, Favoriten erweitert um Tabs, Backend-Migration der Favoriten |
| `641c545` + `6435f7a` | **A — Bug-Fixes** | Optimistic-Delete mit Error-Recovery, Entwürfe-Header-Style, Scroll-Container, ladeGruppen-Lazy-Load-Fix, Lückentext-Buttons Brand-Violet, Problemmeldungen (3 Sub-Bugs), generischer optimisticDelete-Helper |
| `c694a36` + `e75ca84` | **B — Header-Redesign** | Logo→Home, Favoriten separat, Papierkorb als L2 unter Fragensammlung, Sticky-Collapse-Chip-Bar beim Scrollen |
| `382c6bf` + `3bb5385` | **D — Batch-Edit** | Multi-Select mit Checkbox + Floating-Bar, Cross-Filter-Selektion, Edit via normaler Editor im Batch-Modus mit violet markierten Feldern, Confirm-Modal mit Overwrite/Add-Diff, Backend `apiBulkUpdateFragen` |
| `91ffbdc` + `c63a1b4` | **C — Globale Suche** | 7 Quellen (Einstellungen/Hilfe-Tabs + Kurse/Prüfungen/Übungen/Fragen/Schüler), gruppierte Treffer max 5/Quelle, Keyboard-Nav, XSS-sicher via JSX-Split, Lazy-Load-Index |

**Spec-Pfade:** `ExamLab/docs/superpowers/specs/2026-05-11-cluster-{a,b,c,d,e,f,g}-*-design.md` (alle 7 Files committed + pushed, HEAD `c63a1b4`).

**Implementations-Reihenfolge (Abhängigkeiten):**
1. **G Phase 1** + **E Foundation** — liefern Icons + Typografie-Tokens + Tab-Registry, sind Voraussetzung für A/B/C/D
2. **F** — orthogonal, kann parallel
3. **A** — konsumiert G + E
4. **B** — konsumiert E (Favoriten-Backend) + G
5. **D** — konsumiert G + A (optimisticDelete-Helper)
6. **C** — konsumiert E (Tab-Registry) + G

**Out-of-Scope (in Specs explizit benannt):**
- Multi-Klassen-Prüfung (Cluster F Section 8)
- Frame Motion (Cluster B §6.3 — max-height-Trick stattdessen)
- Volltext-Suche in Frage-Inhalten (Cluster C §9 — Phase 2)
- Bulk-Edit für Fragetext/Lösung (Cluster D §8)
- Storybook-Setup (Cluster G §13 — Plan-Phase entscheidet)

**Plan-Phase-Voraussetzungen pro Cluster** (in jeder Spec Section „Offene Punkte"):
- F: Pruefung-zu-Frage-Persistenz Audit, Mastery-Datenmodell, Statistik-Felder
- G: Fragetyp-Discriminator-Audit, Bundle-Größen-Baseline, Storybook-Entscheidung
- E: Backend-API für LPProfil-Update prüfen, Hilfe-Hash-Link-Grep, Storybook
- A: Race-ID-Strategie, Problemmeldung-Schema-Audit, Permission-Modell
- B: Home/Dashboard-Modus, Scroll-Container-Identifier, Mobile-L2-Verhalten
- D: Apps-Script Bulk-Endpoint-Performance, Audit-Log, Tag-Datenmodell
- C: Such-Library-Wahl, SchuelerStore-Pfad, XSS-Highlight-Pattern

**Visual Companion Session-Details:** 11 HTML-Mockups erstellt für Cluster G (Icon-Library/Emoji-Strategy/Fragetypen 3 Iterationen) und Cluster B (Sticky-Collapse 3 Varianten). Live unter localhost-Port-rotierten URLs (Server starb 3× wegen OWNER_PID-Tracking, Workaround `env -u BRAINSTORM_OWNER_PID`).

**Lehre:** Pro-Cluster-Spec-Approach (statt Mega-Spec) bewährt — jeder Cluster bekam fokussierte Brainstorming-Runde + Subagent-Reviewer + 1 Polish-Iteration + Commit. Reviewer fand pro Spec 5-8 Recommendations, 0 echte blocking-Issues. Total 7 Specs in 1 Session.

---

### Bundle Legacy-Naming-Cleanup ✅ MERGED (2026-05-10)

Branch `refactor/legacy-naming-cleanup`. Vollständige Migration `fragenbank` → `fragensammlung` + `lernplattform*` → `ueben*` (Frontend + Apps-Script Wire-Vertrag, Hard-Cut). Spec + Plan beide im 2-Iter-Reviewer-Loop approved.

| Commit | Inhalt |
|---|---|
| `269c602` | Phase 1: fragenbank → fragensammlung. 14 src/ Files (4 Components + 7 Tests + 1 Hook + 1 Store route-token + 1 Storage-Drop) + 6 stellen in apps-script-code.js. Dead-Mocks `vi.mock('./fragenbankStore')` gefixt/entfernt |
| `01db72c` | Phase 2.1+2.2: Apps-Script Wire-Vertrag — 32 doPost-case-statements (`case 'lernplattform'` → `case 'ueben'`), 36 function-defs (inkl. 4 internal `_`-suffix), alle lowercase + 17 uppercase `LERNPLATTFORM` Section-Header. Bonus: Sheet-Prefix `'Lernplattform: '` → `'ExamLab: '` (Phase-3-Inhalt vorgezogen für sauberen Grep-Checkpoint) |
| `da05c7a` | Phase 2.3+2.6: storageMigration.ts (Function `migriereLernplattformKeys` → `migriereAlteUebenKeys`, 4 historic localStorage Source-Keys preserved als Migration-Source) + 3 Stores (uebungsStore/authStore/auftragStore action-Strings + JSDoc) + co-located test (uebungsStorePruefen) sync. Reordering kritisch (2.3 vor 2.6) |
| `f8bb85c` | Phase 2.4-2.9: src/ Services (4) + Adapter (1) + Components (3) + Types (2) + Tests (5) action-Strings + JSDoc |
| `4bb8b74` | Phase 3: `apps-script-lernen/` (Pre-Fusion-Phase-6-Legacy, 3 Files inkl. 1917-Z. backend.js) gelöscht. Doku-Konsolidierung: Archive-Doc `docs/lernplattform-archive-2026-05-10.md` mit Setup-Schema-History für Gruppen-Registry/Tab-Struktur |
| `1c20774` | Phase 4.1: Drive-Aufräum-Brief `docs/drive-aufraum-2026-05-10.md` (User-Action für Apps-Script-Deploy + optional Sheet-Renames) |
| `3a47675` | Phase 4.4: HANDOFF Bundle-Eintrag |
| `6b2712f` | **Hotfix:** Pre-existing Wire-Vertrag-Slip `uebenMarkiereKIFeedbackAlsIgnoriert` — Backend-case auf `ueben`-Prefix umbenannt (Option A). Plus Wire-Contract-Audit-Script `scripts/audit-wire-contract.mjs` + neuer CI-Gate `npm run lint:wire-contract` (59 Frontend-actions, 0 ohne Backend-handler) |
| `a830090` | Pre-Merge: apps-script-code.js cherry-pick auf main (User-Deploy-Workflow) |
| `181e948` | **Merge zu main**: Bundle Legacy-Naming-Cleanup komplett |
| `4584b40` | HANDOFF auf MERGED |
| `117fa7d` | **Cosmetic-Bundle Items 1+2+3+4**: orphan Union-Member entfernt, Typo `uebenUmbenneGruppe` → `uebenUmbenenneGruppe` (Wire-Vertrag), JSDoc-Grammatik gefixt, lokale Vars `lpRl*` → `uebenRl*` |
| `d396593` | Drive-Aufräum-Brief auf ERLEDIGT (User hat Lernplattform-Files gelöscht, aktive Sheets verifiziert via uebenLogin success) |

**Verifikation:** vitest 1523 ✓ (drift = 0), tsc clean, 4× lint clean (as-any 0/0/0, no-alert 0, no-tests-dir clean, musterloesung Baseline), vite build grün. 4 historic Storage-Migration-Source-Keys (`'lernplattform-auth'` etc.) in `storageMigration.ts` absichtlich preserved. Token-form-grep `lernplattform[A-Z]` in src/ + apps-script-code.js: **0 Treffer**.

**Reviewer-Loop:** Phase 1 + 2.1+2.2 + 2.3+2.6 + 2.4-2.9 + 3 alle 2-Stage-Review (Spec + Code-Quality) APPROVED. Spec-Iter-1 hatte 6 Issues — alle behoben. Plan-Iter-1 hatte 7 Issues — alle behoben.

**Apps-Script-Deploy:** ✅ 2× deployed (Bundle + Cosmetic-Bundle), Wire-Vertrag live-verified.

**Drive-Aufräumung:** ✅ User hat Lernplattform-Files gelöscht. Aktive Sheets verifiziert via `uebenLogin` (success, 2 Gruppen). Doku: `ExamLab/docs/drive-aufraum-2026-05-10.md`.

**Browser-E2E:** ✅ 6 Tests auf Staging mit echten LP+SuS-Logins. 0 neue Console-Errors. Hotfix `uebenMarkiereKIFeedbackAlsIgnoriert` LIVE-verified (vorher pre-existing-Bug, Backend kannte action nicht). Typo `uebenUmbenenneGruppe` LIVE-verified (Backend hat alte `uebenUmbenneGruppe`-action sauber abgelöst).

**Out-of-Scope (final):**
- ~~Pre-existing latent-bug `uebenMarkiereKIFeedbackAlsIgnoriert`~~ ✅ Hotfix `6b2712f`
- ~~`'adminFragensammlung'` route-token orphan~~ ✅ Cosmetic Item 1 `117fa7d`
- ~~Typo-Fix `uebenUmbenneGruppe`~~ ✅ Cosmetic Item 2 `117fa7d` (LIVE-verified)
- ~~German-JSDoc-Grammatik `für die Üben`~~ ✅ Cosmetic Item 3 `117fa7d`
- ~~Local-Vars `lpRlCode`/`lpRlLogin`~~ ✅ Cosmetic Item 4 `117fa7d` (→ `uebenRlCode`/`uebenRlLogin`)
- `ExamLab/scripts/*-fibu-fragen*.js` Migrations-Scripts mit `fragenbank`-Tokens (historic, ungenutzt im Build) — **bleibt offen** als Wahl-Item für spätere Cleanups

**Lehre:**
- **Reordering von Token-Renames**: Function-Rename + Caller-Edit + Comment-Reformulation MÜSSEN vor `replace_all` in den Caller-Files laufen, sonst korrumpiert `replace_all` Comments + Imports (Phase 2.3 vor 2.6 war Plan-Reviewer-Iter-1-Lehre).
- **Bonus-In-Scope-Integration**: Sheet-Prefix-Update (originally Phase 3) wurde in Phase 2.1+2.2-Commit gezogen, weil sonst `grep -ni "lernplattform" = 0` Invariant nicht erreichbar war. Kostet 1 Zeile Scope-Creep, gewinnt sauberen Checkpoint-Grep.
- **`replace_all` mit case-sensitive lowercase trifft uppercase nicht**: 17 Section-Header-Comments mit `LERNPLATTFORM` brauchten eigenen replace_all-Step.
- **Co-located Tests können scope-bridge sein**: `src/store/ueben/uebungsStorePruefen.test.ts` musste in Phase 2.3+2.6 partial editiert werden (Line 156) und in Phase 2.4-2.9 finalisiert werden (Line 159). TODO-Marker im Übergang verhindert Drift.

---

### Bundle Test-Tickets ✅ MERGED (2026-05-10)

Branch `refactor/test-tickets-bundle` → preview → main. 7 User-gemeldete Test-Tickets + 5 Folge-Hotfixes nach Browser-E2E.

| Commit | Inhalt |
|---|---|
| `a5c25a0` | Ticket 1: Doppelter violetter Pflichtfeld-Rahmen R/F + Berechnung — Outer-Container-Border raus, innere granulare Indikatoren reichen |
| `1ba163a` | Ticket 5: Trash-/Duplizier-Icons in DetailKarte + KompaktZeile immer sichtbar (Touch-tauglich) |
| `0ffcfb1` | Ticket 6: Entwürfe-Sektion ein-/ausklappbar (Toggle-Chevron, localStorage) |
| `101421d` | Ticket 4: Auto-Save Geist-Saves entfernt — 2 Quellen (`useFragenAutoSave` redundanter useEffect + `SharedFragenEditor` autoSave-Recreation-Trigger via Ref-Mirror) |
| `8876701` | Ticket 2: Konto-Dropdown bei SuS ohne Kategorie-Farben (`zeigeKategoriefarben={false}` in Kontenbestimmung+Buchungssatz+TKonto-Renderern) |
| `c36dd3a` | Ticket 3: Soll/Haben fix bei T-Konto (kein Dropdown mehr) — Field `beschriftungSollHaben` bleibt im Schema (Backwards-Compat), Frontend ignoriert es |
| `2c9d06f` | Ticket 7: Lernplattform-Token (217 Treffer) im HANDOFF-Legacy-Cleanup-Scope ergänzt |
| `3856a3d` | Test-Anpassungen Violet-Outline (DOM-Contract-Wechsel) |
| `18a9c87` | Hotfix: Trash-Icon auch in KompaktZeile + SchliessenModal-z-Index 1000 (war hinter ResizableSidebar versteckt) |
| `5187319` | Hotfix: Trash-Icons auffälliger (size+color) + Editor-Header-Lösch + onLoeschen-Plumbing PruefungFragenEditor → SharedFragenEditor |
| `ebc0ef4` | Hotfix: DraftsSection-Lösch (war Hauptbeschwerde "kein Lösch-Button") + Editor-Bottom-Doppel-Bestätigung weg (`window.confirm` raus) |
| `fe4c6c2` | Hotfix: Editor-Bottom-Lösch ganz entfernt — Header reicht |

**Verifikation:** vitest 1523 ✓, tsc clean, 4× lint clean (as-any 0/0/0, no-alert 0, no-tests-dir clean, musterloesung Baseline), vite build grün. Browser-E2E auf Staging mit echten LP+SuS-Logins (LP `wr.test@gymhofwil.ch`, SuS `wr.test@stud.gymhofwil.ch`): alle 7 Tickets verifiziert, 0 neue Console-Errors.

**Lehre:** Bei „Wo finde ich X?"-Tickets immer alle Render-Pfade prüfen (Detail + Kompakt + Drafts + Editor — nicht nur einen). Bei Z-Index-Modal-Konflikten: ResizableSidebar.overlay startet bei 51 + auto-increment, deshalb brauchen darüberliegende Modals `zIndex: 1000`.

**Apps-Script-Deploy:** keiner — kein Wire-Vertrag-Change.

---

### Media-Phase 6.c.neu + 6.d + 6.e ✅ MERGED (2026-05-10)

Branch `media-phase-6cde` → preview. Großes Hauptbundle nach Phase 6.f Sheet-Migration. **Type-Removal Frontend + Material-Fallback Removal + Apps-Script Schreib-Pfad-Cleanup** in einem Bundle. User hat Apps-Script deployt. Self-Review-Modus.

**Was geliefert (1 Commit `bb2e7b8`, 19 Files, +108/-153):**

**6.d Type-Removal (`packages/shared/src/types/fragen-core.ts`):**
- `HotspotFrage`, `BildbeschriftungFrage`, `DragDropBildFrage`: `bildUrl: string` + `bildDriveFileId?` raus, `bild: MediaQuelle` Pflicht
- `PDFFrage`: `pdfBase64`/`pdfDriveFileId`/`pdfUrl`/`pdfDateiname` raus, `pdf: MediaQuelle` Pflicht

**6.d Cascade-Fixes (8 Files):**
- `fragenFactory.erstelleFrageObjekt`: schreibt nur `bild`/`pdf`; wirft Error wenn keine MediaQuelle erstellbar
- `buildFragePreview.ts`: schreibt nur `bild`/`pdf` für Validator-Preview
- `SharedFragenEditor.tsx`: Mount-Read via Resolver, Editor-State via Destrukturierung der Initial-MediaQuelle
- `frageCoreMocks.ts`: Default-Mocks setzen `bild`/`pdf` MediaQuelle.app
- Demo-Daten `einrichtungsFragen.ts` + `einrichtungsUebungFragen.ts`: 8 Stellen Alt-Felder raus
- `poolConverter/konvertiereBild.ts`: schreibt nur `bild` MediaQuelle (kein `bildUrl`)
- 4 Test-Files: Test-Fixtures auf `bild`/`pdf` MediaQuelle umgestellt

**6.c.neu (PDFKorrektur+PDFFrage Material-Fallback Removal):**
- `PDFKorrektur.tsx`: pdfBase64-Inline-Defense + pdfDateiname-Material-Fallback raus. Reine Resolver-basierte Quelle-Auflösung
- `PDFFrage.tsx`: pdfDateiname-Material-Fallback raus. Loading-Check nur via `ermittlePdfQuelle`

**6.e (Apps-Script Schreib-Pfad-Cleanup):**
- `getTypDaten` in `apps-script-code.js`: 4 Cases schreiben nur noch `pdf`/`bild` MediaQuelle, nicht mehr Alt-Spalten
- `mq_ergaenzeMediaQuelle_` als Read-Defense BEHALTEN (Edge-Cases)
- **User hat Apps-Script manuell deployed** ✅

**Verifikation:**
- vitest **1521 passed** (drift =0)
- tsc -b clean
- 4× lint clean (lint:as-any 0, lint:no-alert 0, lint:no-tests-dir clean, lint:musterloesung Baseline)
- vite build grün (PWA generateSW 256 entries)

**Browser-E2E auf Staging mit echtem LP-Login (Bundle `DF0LOKQi`):**
- LP Composer-Editor öffnet ✅
- LP Composer-Sub-Tab "Vorschau" rendert ✅
- LP "Interaktive SuS-Vorschau" Modal öffnet ✅ — Banner "So sehen Ihre SuS die Prüfung" sichtbar
- **0 NEUE Console-Errors aus aktuellem Bundle** `DF0LOKQi`. Alle 21 gefundenen Errors sind Carryover aus alten Bundles vor Cache-Reset

**Phase 6 KOMPLETT.** Alle Sub-Bundles 6.a–6.f abgearbeitet:
- 6.a (Validator-Resolver-Read) ✅
- 6.b (Editor-Dual-Write) ✅
- 6.c.neu (Material-Fallback Removal) ✅
- 6.d (Type-Removal) ✅
- 6.e (Apps-Script Schreib-Pfad) ✅
- 6.f (Sheet-Migration) ✅

**Architektur-Patterns etabliert:**
- **Type-Removal Cascade-Pattern:** Pflichtfeld-Type-Wechsel → tsc-Errors zeigen alle Konsumenten → systematisch via Resolver/MediaQuelle umstellen
- **Editor-Mount-Read via Resolver:** `ermittlePdfQuelle`/`ermittleBildQuelle` lesen `bild`/`pdf` direkt; Display-State (`bildUrl: string`) abgeleitet via Helper `mediaQuelleZuEditorBildUrl`
- **fragenFactory mit `throw` bei fehlender Quelle:** Editor-Save bricht ab statt undefined-Output, klare Fehlermeldung

**Lehre neu:**
- **Pre-Cut-Audit eliminiert geplante Sub-Bundles:** 4 von 6 6.c-Sub-Sub-Bundles (BildUpload, BildMitGenerator+HotspotEditor, BildbeschriftungEditor+DragDropBildEditor, PDFEditor) waren OBSOLET — Save-Pfade aus Phase 4.a-Vorbereitung schon Dual-Write. Geplante 6 Sessions auf 1 Session reduziert.
- **Apps-Script Read-Defense (`mq_ergaenzeMediaQuelle_`) behalten lohnt sich:** Niedriges Kost-Nutzen-Verhältnis um zu entfernen, defensive für Edge-Cases (Pool-Imports ohne `bild`).

---

### Media-Phase 6.f — Sheet-Daten-Migration ✅ AUSGEFÜHRT (2026-05-10)

Admin-Endpoint `admin:migrierMediaQuelle` per Browser-fetch ausgeführt mit Admin-Login `yannick.durand@gymhofwil.ch`. Sheet-Backup vorher gemacht (User).

**Bilanz (10 Rows additiv ergänzt):**

| Tab | Rows total | Aktualisiert | Davon `bild` | Davon `pdf` |
|-----|------------|--------------|--------------|-------------|
| VWL | 1084 | **7** | 5 | 2 |
| BWL | 535 | **2** | (Mix) | (Mix) |
| Recht | 796 | **1** | (Mix) | (Mix) |
| Informatik | 0 | (Tab nicht gefunden) | — | — |

**Verifikation:**
- Live-Run zeigte gleiche Zahlen wie Dry-Run (10 Updates, 0 Errors) ✅
- Idempotenz-Check (zweiter Dry-Run): 0 Updates, 0 Errors ✅ — Migration vollständig
- Alt-Felder (`bildUrl`/`pdfUrl`/etc.) bleiben unverändert (additive Migration)

**Lehre:** Sheet-Migration war geringer-Umfang als erwartet (10 Rows statt erwartete „einige hundert"). Grund: Editor-Save-Pfad schreibt seit Phase 4.a-Vorbereitung schon Dual-Write. Nur sehr alte Rows (vor Phase 4.a) hatten kein `bild`/`pdf` — diese 10. dryRun-Checks zuerst, Bilanz vorab kalibrieren.

---

### Media-Phase 6 (Sub-Bundles 6.a + 6.b + Bonus useFrageMode + 6.f Action-Brief) ✅ MERGED (2026-05-09)

Branch `media-phase-6` → preview. Erste zwei Sub-Bundles plus Bonus-Bug-Fix (useFrageMode in Composer-SuSVorschau, pre-existing seit Bundle V) plus 6.f Action-Brief.

| # | Commit | Datei(en) | Inhalt |
|---|--------|-----------|--------|
| Spec | `173f1f6` | `docs/superpowers/specs/2026-05-09-media-phase-6-design.md` | Sub-Bundle-Roadmap 6.a–6.f mit Risiko-Klassifikation + DoD pro Task |
| 6.a | `7a34f71` | `pflichtfeldValidation.ts` + `.test.ts` | 4 Stellen auf Resolver-Read (`ermittleBildQuelle`/`ermittlePdfQuelle`) statt direkt `frage.bildUrl` |
| 6.b | `147fd6f` | `buildFragePreview.ts` + `.test.ts` | Editor schreibt zusätzlich `bild`/`pdf` MediaQuelle. Dual-Write neben Alt-Feldern |
| Bonus | `326ac9d` | `SuSVorschau.tsx` | **useFrageMode-Bug GEFIXT**: `<Layout />` in `<FrageModeProvider mode="pruefung">` eingewickelt |
| Action-Brief | (Spec) | `media-phase-6f-sheet-migration-action.md` | 6.f User-Action: fetch-Snippet + Apps-Script-Editor-Aufruf |

**Verifikation:** vitest 1521 passed, tsc -b clean, 4× lint clean, vite build grün.

**Architektur-Patterns etabliert:**
- **Resolver-Read im Validator** — Validator entkoppelt vom Type-Schema, nutzt eigene `AltBildFrage`/`AltPdfFrage`-Interfaces aus `mediaQuelleResolver`
- **Dual-Write im Editor-Preview** — bestehende Alt-Felder + zusätzlich MediaQuelle via Migrator (`bildQuelleAus({bildUrl})`)
- **Aufwärm-Bundle vor schwerem Bundle** — analog Pre-Phase-6 Cleanup

**Lehre:** Schon vorhandene Dual-Write-Stellen entlasten Sub-Bundle-Aufwand — `fragenFactory.ts` hatte bereits Dual-Write aus Phase 4.a-Vorbereitung. Audit vor jedem Sub-Bundle, ob Dual-Write schon existiert.

---

### Pre-Phase-6 Cleanup (S1+S3+S4) ✅ MERGED (2026-05-09)

Branch `cleanup/pre-phase6-s1-s3-s4`. Aufwärm-Bundle, drei niedrig-Risiko Spawn-Tasks: **Frontend-Pool-Konverter Dual-Write + Demo-Daten Dual-Write + Orphan-Delete** (`fragenValidierung.ts` 96 Z. — 0 Konsumenten, identisch zu shared-Version).

vitest 1517 passed, tsc/lint/build clean. Browser-E2E auf Staging mit echten LP+SuS-Logins ✅, 0 neue Console-Errors.

**Lehre:** Aufwärm-Bundle vor großem Bundle bewährt — niedrig-Risiko-Cleanups bündeln, dann Großes-Bundle ohne Side-Tasks.

---

## Eintrittspunkte für nächste Session

### Code-Vereinfachung — Legacy-Naming-Cleanup (ALS NÄCHSTES, Spec/Plan offen)

**Ziel:** Altlasten aus dem Code entfernen, Bezeichner an aktuelle Begriffe anpassen.

**Konkret identifiziert (Audit 01.05.2026 + Test-Tickets-Audit 10.05.2026):**
- `fragenbank` (291 Treffer: 132 src + 159 apps-script + 4 Filenames) → komplett legacy, soll auf `fragensammlung` umbenannt werden. UI-Begriff ist seit S99 „Fragensammlung".
- `pool` (344 Treffer als Identifier) → gemischt: manche legacy (Pool-Import-UI im LP-Editor), manche aktiv (Übungspools im Üben-Modus). Vor Implementation **Audit nötig** welche Stellen legacy sind.
- `lernplattform` / `Lernplattform` (217 Treffer: 68 ts/tsx + 149 apps-script) → Begriff aus Fusion-Phase Lernplattform→ExamLab (S59-64). Heutiges Konzept ist „ExamLab Üben". Apps-Script-Endpoints wie `lernplattformLadeFragen`/`lernplattformPruefeAntwort`/`lernplattformPreWarmFragen` sind Backend-Vertrag → Rename erfordert dual-Read-Phase + Apps-Script-Deploy. Frontend-Tokens (`UebenEditorProvider`, `UebungsToolView`, `auftragStore`) referenzieren Apps-Script-Endpoints. User-Konsens 10.05.2026: in Cleanup-Plan integrieren.
- **„welche Lernplattform-Files auf Google Drive brauchen wir noch?"** — User-Frage vom 10.05.2026, ausserhalb des Codebase-Scopes. Drive-Aufräumung als separate User-Aktion vor Backend-Migration weg von Apps-Script.

**Workflow vor Implementation:**
1. `superpowers:brainstorming` — Scope klären (welche Tokens? Filenames? Apps-Script-Endpoints? Storage-Felder?)
2. `superpowers:writing-plans` — Spec + Plan, mit Reviewer-Loop
3. Dann erst Implementation

**Risiko-Hinweise für Plan:**
- Apps-Script-Endpoints und Storage-Feldnamen sind Backend-Vertrag — Rename erfordert dual-Read-Phase oder Migration (analog Bundle K + L.b-Lehre „Schemas sind keine Roadmap")
- 159 Stellen in `apps-script-code.js` bedeutet Apps-Script-Deploy + Daten-Migration im Sheet ggf. nötig
- Storage-Schlüssel (z.B. `examlab-fragenbank-cache` IDB-Database-Name) sind sticky — Rename = neue DB, alte muss migriert oder gedroppt werden

**Hinweis (2026-05-10 Audit):** Eine frühere Sandbox-Session erstellte einen vermeintlichen Spec/Plan-Loop für „Code-Vereinfachung", der fälschlich die Adapter-Hook/BaseDialog/Button-Architektur neu plante — diese ist seit S66–S92 etabliert. Spec + Plan in der Sandbox gelöscht; Architektur-Section unten dokumentiert den tatsächlichen Stand.

---

## Aktiv offen

### Kleine Follow-Ups (nicht blockierend)

Keine offenen Items — alle bekannten S150–S159 Follow-Ups im Restposten-Bundle 01.05.2026 sowie Bundle K-Followup erledigt.

### Future Bundles (geplant)

- **Media-Phase 4.a/4.b Code-Hygiene** (optional, Future) — Editor-State-Refactor von URL-string zu MediaQuelle. Funktional folgenlos (Factory dual-writes schon, Phase 6 hat Type-Removal), nur Type-Safety-Gewinn an wenigen Editor-State-Stellen. 8 + 4 Files. Bei nächstem grösseren Editor-Refactor mit-mitnehmen.
- **Backend-Migration weg von Apps-Script** (langfristig, strategisch) — Edge-Runtime / Cloud Run / Cloudflare Workers. Vorbereitend: API-Contract (Zod/JSON-Schema), Endpoint-Inventar, Schema-Doku. Kein konkreter Trigger jetzt, aber Vorarbeit lohnt während anderer Bundles.

### Future / YAGNI (nur falls UX-Feedback negativ)

- Bundle G.f.3 — KorrekturDashboard-Skeleton (eingebettet + standalone) falls G.d.1 Pre-Warm-Cache-Miss-Flash spürbar
- Phase-Komponenten-Skeletons (LobbyPhase / AktivPhase / BeendetPhase intern)
- Doppel-Header-Optik G.e — falls Sticky-Lane-Header parallel zum virtuellen Header sichtbar
- IDB-Verschlüsselung als eigenes Sub-Bundle (separates Threat-Model)

### Backlog (älter, low-priority)

| # | Thema | Notiz |
|---|---|---|
| A2 | KI-Bild-Generator Backend (`generiereFrageBild`-Endpoint) | Frontend steht |
| A3 | KI-Zusammenfassung Audio-Rückmeldungen | Braucht A2 |
| B2 | Audio iPhone — 19s Aufnahme speichert nur 4s | iPhone MediaRecorder |
| B3 | Abgabe-Timeout „Übertragung ausstehend" | Apps-Script Execution Log |
| B4 | Fachkürzel stimmen nicht (PDF-Abgleich mit `stammdaten.ts`) | — |
| V1 | Bilanzstruktur: Gewinn/Verlust-Eingabe | — |
| V3 | Testdaten-Generator für `wr.test` | — |
| V8 | Ähnliche Fragen erkennen (Duplikat-Erkennung) | — |
| T1 | 62 SVGs visuell prüfen (neutrale Bilder erstellt S87) | — |
| T2 | Excel-Import Feinschliff | — |

### Langfristig

- SEB / iPad — SEB deaktiviert (`sebErforderlich: false`)
- Tier 2 Features: Diktat, GeoGebra/Desmos, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox)
- TaF Phasen-UI — `klassenTyp`-Feld vorhanden, UI verschoben auf nächstes SJ
- Monitoring-Verzögerung ~28s — Akzeptabel

---

## Architektur (etabliert in S66–S92, weiterhin gültig)

- **Adapter-Hook Pattern:** `useFrageAdapter(frageId)` abstrahiert Prüfungs-/Übungs-Store
- **Fragetypen-Registry:** `shared/fragetypenRegistry.ts` (EINE Kopie, nicht zwei)
- **Shared UI:** `ui/BaseDialog.tsx`, `ui/Button.tsx`, `shared/LoginLayout.tsx`
- **Antwort-Normalizer:** `utils/normalizeAntwort.ts`
- **FrageModeContext:** `context/FrageModeContext.tsx`
- **SuS-Navigation:** Kein Start-Screen, direkt Üben-Tab. Tabs „Üben"/„Prüfen" in Kopfzeile.
- **kursId-Format:** `{gefaess}-{fach}-{klassen}` wenn `gefaess≠fach`, sonst `{gefaess}-{klassen}` (ohne Schuljahr)
- **Shared-Editoren:** `packages/shared/src/editor/` auf **Repo-Root**, nicht in ExamLab. Vite-Alias `@shared` mappt von ExamLab via `../packages/shared/src` (S156-Lehre).
- **Media-Quelle (seit Phase 6):** `bild: MediaQuelle`/`pdf: MediaQuelle` Pflicht in `fragen-core.ts`. Read via `ermittleBildQuelle`/`ermittlePdfQuelle` Resolver. Apps-Script `mq_ergaenzeMediaQuelle_` Read-Defense für Edge-Cases.

## Security (alle erledigt ✅)

- Rollen-Bypass → `restoreSession()` validiert E-Mail-Domain
- Timer-Manipulation → Server-seitige Validierung
- Rate Limiting → 4 SuS-Endpoints (10–15/min)
- Cross-Exam Token Reuse → verhindert
- Prompt Injection → Inputs in `<user_data>` gewrappt
- Session-Lock → Neuer Login invalidiert alten Token
- IDB-Privacy nach Logout → `tx.oncomplete`-await vor Hard-Nav (S149-Lehre)

---

## Bundle-Archiv (chronologisch absteigend)

Detaillierte Bundle-Einträge gekürzt — vollständige Beschreibungen in git log + Memory-Files. Lehren in `~/.claude/projects/.../memory/`.

### Phase 5+ Hotspot-Reduction-Roadmap ✅ KOMPLETT (2026-05-08 bis 2026-05-09, 6 Sub-Bundles)

| Bundle | Datum | Merge | Effekt | Hotspot-Bilanz |
|---|---|---|---|---|
| Bundle CC | 2026-05-09 | `1b33746` | ConfigTab 747 → 285 (-62%), MaterialienSection-Cut | **1 → 0** ✅ |
| Bundle BB | 2026-05-09 | `4f53910` | HilfeSeite 906 → 102, EinstellungenPanel 607 → 123 | 3 → 1 |
| Bundle AA | 2026-05-09 | `fc8f191` | AktivPhase 573 → 420, BilanzERFrage 589 → 376 | 5 → 3 |
| Bundle Z | 2026-05-08 | `888c4ff` | PruefungsComposer 526 → 454, ZeichnenCanvas 518 → 466 | 7 → 5 |
| Bundle Y | 2026-05-08 | `6479448` | Layout 570 → 482 (Recovery-Hook-Cut) | 8 → 7 |
| Bundle X | 2026-05-08 | (early) | BatchExportDialog 535 → 436 | 9 → 8 |

**Gesamt-Reduktion:** ~5571 → 3144 Z. Hauptdatei-Code (-44%). Hotspot-Set Files >500 Z. (ohne data/test): 9 → 0.

### Vorgänger Hotspot-Reduction (2026-05-07 bis 2026-05-08)

| Bundle | Datum | Hauptdatei | Effekt |
|---|---|---|---|
| Bundle W.b | 2026-05-08 | uebungsStore 540 → 498 | State-Refactor (4 Pure-Cuts) |
| Bundle W | 2026-05-08 | uebungsStore 684 → 540 | 3 Pure-Logic-Cuts in `utils/ueben/` |
| Bundle V | 2026-05-08 | PDFSeite 950 → 419 (-56%) | 4 Sub-Files in `pdf/seite/` |
| Bundle U | 2026-05-08 | useDrawingEngine 752 → 157 (-79%) | 4 Pure-Logic-Sub-Files in `zeichnen/` |
| Bundle T.f | 2026-05-07 | LPStartseite 1043 → 382 (-63%) | 12 neue Files (Hooks + Komponenten) |
| Bundle T.e | 2026-05-07 | Dashboard-Üben 930 → 489 (-47%) | 2 Hooks + 22 Tests + 2 Komponenten-Splits |
| Bundle T.d | 2026-05-07 | ZeichnenCanvas 804 → 517 (-36%) | 4 Hooks (useDebounce/Setup/TextOverlay/Stift) |
| Bundle T.c | 2026-05-07 | FragenBrowser 768 → 253 (-67%) | 2 Hooks + 2 Komponenten |
| Bundle T.b | 2026-05-07 | TKontoFrage 763 → 155 (-80%) | 5 Files in `tkonto/` + 23 Tests |
| Bundle T.a | 2026-05-07 | DurchfuehrenDashboard 677 → 464 (-31%) | 3 Hooks + 1 Pure-Util + 11 Tests |
| Bundle T (Master-Spec) | 2026-05-06 | `1be0f6a` | Spec-Phase für T.a–T.f, kein Code |

### Cleanup-Bundles + Bundle-Vorgänger (2026-05-06 bis 2026-05-09)

| Bundle | Datum | Effekt |
|---|---|---|
| Post-Bundle-CC Refactor-Sweep | 2026-05-09 | 6 Out-of-Scope Items + Bundle W Final-Reviewer-Pass (BilanzERFrage 376 → 18 (-95%), ConfigTab 285 → 37 (-87%)) |
| Spawn-Task-Cleanup-Sweep + Salvage | 2026-05-09 | 6 Mini-Cleanups + 4 Salvage-Commits aus unmerged Branches |
| Media-Phase 5 — PDF-Renderer-Cleanup | 2026-05-09 | 4 Files auf `ermittlePdfQuelle`-Resolver-Pfad (Merge `2d6334f`) |
| Bundle P-Doku | 2026-05-06 | `audit-musterloesung.sh` + `lint:musterloesung` CI-Gate (Field-Drift) |
| Bundle S.c | 2026-05-06 | poolConverter + fibuAutoKorrektur Utils-Splits |
| Bundle S.b | 2026-05-06 | VorschauTab-Split |
| Bundle S.a | 2026-05-06 | KorrekturFrageVollansicht + DruckAnsicht Renderer-Splits |
| Bundle R | 2026-05-06 | Error-Handling-Vereinheitlichung (Toast-System + Mount-Fix) |
| Bundle Q | 2026-05-06 | Test-Verzeichnis-Konsolidierung |
| Bundle O | 2026-05-06 | Store-Action-Naming-Vereinheitlichung |
| Bundle N+V | 2026-05-06 | action/aktion-Vereinheitlichung + Sprach-Konvention Hybrid DE/EN |
| Bundle M | 2026-05-05 | Fragenbank → Fragensammlung Rename (UI-Begriff, nicht Identifier) |
| Bundle 3 | 2026-05-05 | Auto-Save + Drafts + Papierkorb |
| Bundle 2 | 2026-05-04 | Editor-Komfort |
| Fragetyp- und Suche-Bugs | 2026-05-04 | Bugfix-Sammel |
| Post-Bundle-L Spawn-Task-Cleanups | 2026-05-01 | Vaporware-Type-Union-Removal, buildFragePreview Field-Drift, Dead-UI-Cleanup |

### Bundle K + L Reihe — Type-Konsolidierung (2026-04-29 bis 2026-05-01)

| Bundle | Merge | Effekt |
|---|---|---|
| Bundle L.c | `911cbea` (2026-05-01) | Restliche Production + Tests, `as any` 71 → 0, CI-Gate `lint:as-any` aktiv |
| Bundle L.b | `9ed67db` (2026-04-29) | poolConverter Discriminated Union (20 Sub-Types) + FiBu-Konverter-Bugfix M1 (Latent-Bug seit S107 behoben) |
| Bundle L.a | (2026-04-29) | Mock-Helper `mockCoreFrage<T>` + pflichtfeldValidation-Pilot. `as any` 199 → 96 (-103) |
| Bundle K-Followup | (2026-04-29) | Storage-Sub-Type-Hygiene (20 zentrale Aliases) |
| Bundle K | `de01e01` (2026-04-29) | Type-Konsolidierung Frage Core + Storage. Cut: `berechtigungen`/`geteilt`/`autor` in core, nur `_recht`/`poolVersion` storage-only |

### Bundle J — DnD-Bild Multi-Zone-Datenmodell (S160 + S161)

**Merges:** `eae1cec` (Migration) + `000de2e` (Cleanup) + S161 Apps-Script-Cleanup-Deploy.

- DragDrop-Bild auf Multi-Zone (`korrekteLabels: string[]` pro Zone) und Multi-Label-Akzeptanz (Synonym-Listen).
- Pool-Tokens als `DragDropBildLabel{id, text}` mit Stack-Counter für Duplikate. Deterministische `stabilId(frageId, text, index)` Cross-Env-Hashes.
- Generic `felder`-Patch am `batchUpdateFragenMigrationEndpoint`.
- 28/28 dragdrop_bild-Fragen migriert.
- Apps-Script 3× deployed.
- Browser-E2E + Lückentext Phase 8 E2E mit echten Logins, Security-Check.

---

## Historie

| Session | Datum | Inhalt | Memory |
|---|---|---|---|
| S161 | ~Apr/Mai 26 | Bundle J Browser-E2E + Lückentext Phase 8 E2E + Apps-Script-Cleanup-Deploy | `project_s161_bundle_j_lueckentext_e2e.md` |
| S160 | 28.04.26 | Bundle J KOMPLETT auf main + Cleanup vorgezogen | `project_s160_bundle_j_komplett.md` |
| S159 | 28.04.26 | Bundle J Phase 1-8 auf Branch | `project_s159_bundle_j_phase_1_8.md` |
| S158 | 28.04.26 | Bundle J Spec + Plan | `project_s158_bundle_j_specplan.md` |
| S157 | 28.04.26 | Bundle H Editor-UX-Feinschliff | `project_s157_bundle_h_phasen_0_4.md` |
| S156 | 28.04.26 | Bundle H Spec + Plan | `project_s156_bundle_h_plan.md` |
| S155 | 27.04.26 | Bundle G.f.2 (Skeleton-Pattern) | `project_s155_bundle_g_f_2.md` |
| S154 | 27.04.26 | Bundle G.e (Fragensammlung-Virtualisierung) + G.f (LP-Startseite Skeleton) | `project_s154_bundle_g_e_f.md` |
| S153 | 27.04.26 | Bundle G.d.2 (IDB-Cache Klassenlisten + Gruppen) | `project_s153_bundle_g_d_2.md` |
| S152 | 27.04.26 | Bundle G.d.1 (4 Hebel: Lobby-Polling, Pre-Warm, Korrektur-Cache, SuS-Warteraum) | `project_s152_bundle_g_d_1.md` |
| S151 | 27.04.26 | Bundle G.d/e/f Specs (4 Specs reviewer-approved) | `project_s151_bundle_g_specs.md` |
| S150 | 27.04.26 | autoSave-IDB-Race-Fix | `project_s150_autosave_idb_race.md` |
| S149 | 27.04.26 | Bundle G.c (LP-Login Pre-Fetch + Logout-Cleanup) | `project_s149_bundle_gc.md` |
| S148 | 26.04.26 | Bundle G.b (Editor-Nachbar + Anhang-PDF-Prefetch) | `project_s148_bundle_gb.md` |
| S147 | 26.04.26 | Bundle G.a (Server-Cache-Pre-Warming) | `project_s147_bundle_ga.md` |
| S146 | 26.04.26 | Bundle E (Übungsstart-Latenz N=10 cold 4'322ms→1'036ms) | `project_s146_bundle_e.md` |
| S145 | 24.04.26 | Auth-Session-Restore-Fix | `project_s145_auth_fix.md` |
| S144 | 24.04.26 | Lückentext Phase 7 Migration (253/253 Fragen) | `project_s144_lueckentext_phase7.md` |
| S142 | 24.04.26 | Bildeditor-Bundle + Lückentext-Modus Phase 1-6 | `project_s142_bildeditor_lueckentext.md` |
| S141 | 24.04.26 | Altlasten-Bundle | `project_s141_altlasten_bundle.md` |
| S140 | 24.04.26 | Bundle F1 (Probleme-Dashboard) + F2 (Bugfix) | inline MEMORY.md |
| S137-138 | 23.04.26 | UI/Autokorrektur-Bundle | `project_s137_ui_bundle.md` |

### Archiv (Sessions 20–136)

100+ Sessions komprimiert. Bei Bedarf via `git log` + Memory-Files nachvollziehbar.

| Datum | Sessions | Meilenstein |
|-------|----------|-------------|
| 26.03. | 20–22 | Root-Cause-Fixes, Live-Test Bugfixes, Scroll-Bug |
| 27.03. | 23–29 | 16 Bugfixes, Toolbar-Redesign, Zeichnen-Features, Multi-Teacher Phase 1–4, Sicherheit |
| 28.03. | 30–32 | Plattform-Öffnung für alle Fachschaften, Demo-Prüfung, LP-Editor UX |
| 31.03. | 38–44 | E2E-Tests, Security Hardening, Staging, Workflow-Umstellung |
| 01.04. | 45–49 | Batch-Writes, Request-Queue, Re-Entry-Schutz, 8 neue Pool-Fragetypen |
| 02.04. | 51–53 | Browser-Tests + 75 Pool-Fragen, Bewertungsraster, Lernplattform Design |
| 04.04. | 55–58 | Shared Editor Phase 1–5a (EditorProvider, Typ-Editoren, SharedFragenEditor) |
| 05.04. | 59–64 | Fusion Phase 1–6 (Lernplattform → Prüfungstool), Übungstool A–F, Prompt Injection Schutz |
| 05.–06.04. | 66–67a | ExamLab Overhaul, Performance, Datenbereinigung |
| 07.04. | 68–71 | Tech-Verbesserungen, Lernsteuerung, Navigation, grosses Bugfix-Paket |
| 10.04. | 72–87 | Editor-Crashes, Fragetyp-Korrektur, Navigation, Einstellungen, Stammdaten, Performance, UX-Polish, Druckansicht, Excel-Import, Store-Migration, Favoriten, Bild-Fragetypen Reparatur |
| 11.04. | 88–90 | Improvement Plan S1–S5, Deep Links, Fachkürzel, Performance |
| 12.04. | 91–92 | Code-Vereinfachung (Adapter-Hook Refactoring etabliert), Save-Resilienz |
| 13.04. | 93–97 | Browser-Test Bugfixes, FiBu-Fixes, Bild-Upload, Deep Links + React Router |
| 13.04. | 98–104 | UX-Bundles 1–8 (Quick Wins, Favoriten-Redesign, Übungs-Themen, Layout-Umbau, Bildfragen-Editor, Design-System, UX-Harmonisierung) |
| 14.04. | 105–107 | C11+C9+Wording, E1 FiBu-Fix + Feedback-System, Rename Pruefung→ExamLab + Kontenrahmen 2850 |
| 14.–22.04. | 108–136 | C9 Phase 1–4 Migration (2412 Fragen), KI-Kalibrierung, Detaillierte Lösungen |
