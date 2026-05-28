# Design: react-doctor State-Correctness Regression-Gate

**Datum:** 2026-05-28
**Status:** Approved (Brainstorming abgeschlossen, Platzierung = pre-push bestätigt)
**Scope:** ExamLab (`scripts/` repo-root, `ExamLab/package.json`, `.githooks/pre-push`)

---

## 1. Kontext & Motivation

Der react-doctor-Audit vom 28.05.2026 hat die react-doctor *Errors* auf 1 reduziert
(nur ein bewusstes `no-eval` in `poolSync.ts`). Offen blieben Warning-Kategorien.
Diese Spur nimmt die zwei mit der höchsten Bug-Korrelation:

- `no-adjust-state-on-prop-change` (19 Findings) — das S129-Muster
- `no-cascading-set-state` (23 Findings) — das S130-Risiko-Muster

**Triage-Ergebnis (alle 42 Findings, 3 Subagenten + 2 manuelle Proben):**
**0 echte Bugs.** Jedes Finding ist entweder ein benigner Daten-/Mount-Load-Effect,
ein Timer/Observer/Listener **mit korrektem Cleanup**, oder das bereits angewendete
S129/S130-Remedy (Sync-on-`[id]`, Parent-`key`-Remount, ref-Guard). Der
Render-Loop-Tell (im Effect gesetzter State steht in dessen eigener Deps-Liste,
ungeguarded) trifft auf **keine** Stelle zu. Die vollständige Klassifizierung steht
in Anhang A.

Das ist die Dividende der früheren S129/S130-Arbeit (dokumentiert in
`.claude/rules/code-quality.md`): Der Code hat die Lektionen internalisiert.

**Entscheidung:** Da der Zustand *verifiziert sauber* ist, ist jetzt der ideale
Moment, ihn als **Regression-Gate festzuzurren** — nach dem bewährten Baseline-Muster
(`musterloesung`, `no-emoji`). Wir gaten nachgewiesen-sauberen Code, nicht unbekannte
Schuld. Künftige *neue* Verletzungen dieser zwei Regeln tauchen sofort auf.

## 2. Ziele & Nicht-Ziele

**Ziele:**
- Ein CI-Gate `lint:react-doctor-state`, das fehlschlägt, wenn die Per-Datei-Anzahl
  der zwei Regeln über die Baseline steigt.
- Baseline = heutiger verifiziert-sauberer Stand (42 Findings über die betroffenen Dateien).
- Reproduzierbar & stabil (kein Version-Drift, keine Netzwerk-Flakiness im Gate).
- Enforced im **pre-push-Hook** (`ci-check`), wo die neueren Gates leben.

**Nicht-Ziele:**
- Die 42 Findings „fixen" / refactoren — sie sind sauber; Refactoring wäre Churn mit
  Regressions-Risiko auf kritischen Pfaden für null Korrektheits-Gewinn.
- Andere react-doctor-Regeln gaten (exhaustive-deps, no-derived-state, design-*, …) —
  separate, spätere Entscheidung.
- Den `--staged`/`--diff`-Changed-Lines-Modus bauen (siehe §6, YAGNI).

## 3. Mechanik

Spiegelt `scripts/audit-no-emoji.mjs` (per-File-`per_file_max`-Baseline mit
`--strict` / `--baseline`).

**Neues Skript:** `scripts/audit-react-doctor-state.mjs`

1. Ruft react-doctor im ExamLab-Verzeichnis auf:
   ```
   react-doctor --full --lint --no-dead-code --no-score --json --json-compact
   ```
   - `--no-dead-code` + `--no-score`: senkt Laufzeit von **19.6s → 7.2s** (Dead-Code-
     Analyse + Score-**API**-Netzwerk-Call entfallen). Die zwei Zielregeln bleiben
     exakt erhalten (verifiziert: 19 + 23).
   - `--full`: ganzer Tree (Source-of-Truth), nicht nur geänderte Dateien.
2. Parst die JSON-Ausgabe, filtert `.projects[0].diagnostics[]` auf
   `rule ∈ {no-adjust-state-on-prop-change, no-cascading-set-state}`.
   **Nur `.projects[0].diagnostics[]` parsen — NICHT das Top-Level `.diagnostics[]`.**
   Beide Arrays enthalten dieselben 42 Findings; ein Merge würde auf 84 verdoppeln
   (analog der MEMORY-Lehre zur `projects[]`-Nesting-Duplikation).
3. Baut eine **Count-pro-Datei**-Map (Counts, *keine* Zeilennummern → robust gegen
   Zeilen-Verschiebung beim normalen Editieren).
4. Vergleich gegen `scripts/react-doctor-state-baseline.json`:
   - Datei-Count **> Baseline** → Regression → bei `--strict` exit 1.
   - Datei-Count **< Baseline** → Drift/IMPROVEMENT → Vorschlag `--baseline`.
   - Neue Datei mit Findings, nicht in Baseline → Regression.
5. Flags: `--strict` (CI-Gate, exit 1 bei Regression), `--baseline` (regeneriert
   `per_file_max`), ohne Flag = report-only.

**Robustheit gegen react-doctor-Fehler:** Das Skript prüft den Exit-Code/JSON-
Validität von react-doctor. Liefert react-doctor kein parsbares JSON oder bricht ab
(z.B. Tool-Fehler), failt das Skript mit klarer Meldung (exit 2), statt „0 Findings"
fälschlich als „sauber" zu interpretieren. (react-doctor exitet absichtlich ≠ 0, wenn
error-Level-Diagnostics existieren — das allein ist KEIN Skript-Fehler; wir
entscheiden Pass/Fail selbst über den Baseline-Vergleich.)

## 4. Baseline-Datei

`scripts/react-doctor-state-baseline.json`:
```json
{
  "_comment": "Baseline für lint:react-doctor-state. per_file_max = Count der 2 State-Regeln pro Datei. Bei Anstieg failt CI. Regenerieren: node scripts/audit-react-doctor-state.mjs --baseline (nur mit Begründung erhöhen).",
  "react_doctor_version": "0.2.10",
  "rules": ["no-adjust-state-on-prop-change", "no-cascading-set-state"],
  "per_file_max": { "...": "Count pro Datei aus dem heutigen sauberen Stand" }
}
```
Kein `allowlist` nötig — react-doctor flaggt keine Test-Dateien für diese 2 Regeln.
`react_doctor_version` im Baseline-File dokumentiert, gegen welche Tool-Version die
Baseline erzeugt wurde (Drift-Warnung beim Version-Bump).

## 5. Version-Pinning

`react-doctor` als **devDep, exakt gepinnt** (`"react-doctor": "0.2.10"`, kein `^`).

- **Grund:** 0.x-Tool; neue Versionen können *andere* Zeilen/Regeln flaggen →
  Baseline-Churn / falsche Regressionen. Exakt-Pin hält die Baseline stabil.
- Vermeidet npx-Download pro Run (CI nutzt `rm -f package-lock.json && npm install`;
  ein npx-Download wäre Netzwerk-Flakiness-Quelle).
- **Version-Bump = bewusster Schritt** mit Baseline-Regen (`--baseline`) + Doku-Update.
- Das Skript ruft das gepinnte Binary aus `node_modules/.bin/react-doctor` auf (nicht
  `npx @latest`), damit die Version deterministisch ist. Im npm-Workspaces-Monorepo
  wird das Binary nach **repo-root** `node_modules/.bin/` gehoistet (nicht
  `ExamLab/node_modules`); der Plan muss verifizieren, dass es von dort auflöst.

## 6. Platzierung: pre-push (ci-check)

- npm-Script in `ExamLab/package.json`:
  `"lint:react-doctor-state": "node ../scripts/audit-react-doctor-state.mjs --strict"`.
- Eingehängt in die `ci-check`-Kette (vor `npm test && npm run build`), wo die
  neueren Gates (`no-emoji`, `typo-tokens`, `storybook-coverage`) bereits leben.
- Der pre-push-Hook (`.githooks/pre-push`) ruft `ci-check` auf → das Gate läuft vor
  jedem Push (auch Feature-Branches), **vor** `main`. Begründung: +7.2s sind auf dem
  ohnehin ~70-90s-Hook akzeptabel (~+8-10%); die Projekt-Kultur vermeidet rotes `main`;
  ein Mechanismus, konsistent mit den bestehenden Gates. Override: `git push --no-verify`.

**Bewusst nicht gewählt:**
- **CI-only (deploy.yml):** würde Regression erst nach Push-to-main fangen (rotes main).
- **`--staged`/`--diff`-Fast-Mode (2.4s):** meldet nur Findings auf *geänderten Zeilen*
  (PR-Comment-Modell — hat in der Messung die 3 FormelFrage-Findings auf unveränderten
  Zeilen ignoriert). Anderer Mechanismus, nicht mit Per-File-Baseline kombinierbar,
  Doppel-Codepfad. Bleibt als dokumentierte Option für ein künftiges schnelles
  pre-commit-Gate, falls die 7.2s je stören.

## 7. Verifikations-Plan

1. **Baseline-Erzeugung:** `--baseline` läuft, schreibt `per_file_max` mit den 42
   Findings über ihre Dateien. Manuell gegen die Triage-Inventur (Anhang A) prüfen.
2. **Sauberer Stand passt:** `--strict` auf unverändertem Tree → exit 0, „OK".
3. **Regression wird gefangen (positiv-Test):** temporär einen neuen
   `no-cascading-set-state` einbauen (z.B. useEffect mit 3 setState in einer Datei
   ohne Baseline-Eintrag) → `--strict` failt mit der richtigen Datei + Count. Danach
   vollständig zurücksetzen.
4. **Drift/Improvement:** temporär eine geflaggte Datei so ändern, dass ein Finding
   verschwindet → Report meldet IMPROVEMENT (Baseline senkbar). Zurücksetzen.
5. **Pre-push-Integration:** `npm run ci-check` lokal → Gate läuft mit, Gesamt-Laufzeit
   plausibel (~+7s). Pre-push bei reinem `--delete`-Push wird weiterhin geskippt
   (bestehender Hook-Mechanismus, unberührt).
6. **CI-Äquivalenz:** Da das Gate in `ci-check` läuft und `ci-check` der pre-push-Pfad
   ist, ist keine deploy.yml-Änderung nötig. (Hinweis: die neueren Gates sind ohnehin
   pre-push-only; deploy.yml-Coverage-Lücke ist ein separates Thema, siehe §8.)

## 8. Risiken & offene Punkte

- **react-doctor-Install-Impact:** Dep-Tree-Grösse des neuen devDep beim Plan
  verifizieren (`npm install` + node_modules-Effekt; npm-Bug-4828 / rollup-native
  beachten). Falls problematisch: Fallback auf gepinntes `npx react-doctor@0.2.10` im
  Skript (mit Download-Caveat).
- **Tool-Version-Drift:** beim Bump Baseline regenerieren — sonst falsche Regressionen.
- **7.2s-Laufzeit:** falls die pre-push-Latenz je stört → `--staged`-Fast-Mode aus §6
  als Ergänzung.
- **CI-Gate-Coverage-Lücke (separat, nicht in diesem Scope):** deploy.yml enthält nur
  eine Teilmenge der Gates (as-any, no-alert, no-tests-dir, musterloesung); die
  neueren (no-emoji, typo-tokens, storybook-coverage, wire-contract, no-inline-svg)
  laufen nur pre-push. Sollte als eigene Aufgabe adressiert werden.

---

## Anhang A — Triage-Inventur (42 Findings, alle sauber)

Mechanismus pro Finding. Keine Stelle ist ein echter Bug. Diese Tabelle ist der
Audit-Trail, damit die Klassifizierung nicht neu aufgerollt wird.

### `no-adjust-state-on-prop-change` (19)
| Datei:Zeile | Klasse | Begründung |
|---|---|---|
| Startbildschirm.tsx:97 | BENIGN | Einweg-prop→state (SEB-Ausnahme), Deps korrekt, setzt nur true |
| FormelFrageComponent.tsx:94,95 | BENIGN | Debounced KaTeX-Preview-Reset im Guard-Branch |
| PDFViewer.tsx:70 | BENIGN | IntersectionObserver-Setup, functional updater, disconnect-Cleanup |
| useCanvasSetup.ts:57 | BENIGN | Async Hintergrundbild-Load, reload bei URL-Wechsel korrekt |
| useKorrekturDaten.ts:107,108,109,110 | BENIGN | Demo-Branch Daten-Load; reload bei userEmail/pruefungId korrekt |
| useKorrekturDaten.ts:201 | BENIGN | Auto-geprüft, durch `autoGeprueftGesetzt`-ref idempotent |
| VorbereitungPhase.tsx:89,93,94 | ALREADY_HANDLED | Sync-on-`durchfuehrungId` (Parent nutzt `hidden`, nicht unmount) |
| AktivePruefungen.tsx:32 | BENIGN | 30s-Poll, `email`-Dep, `aktiv`-Flag + clearInterval-Cleanup |
| KorrekturEinsicht.tsx:41 | BENIGN | Daten-Load auf `pruefungId`-Wechsel (refetch korrekt) |
| useDeepLinkAktivierung.ts:39 | ALREADY_HANDLED | `verarbeitet`-ref macht Effect idempotent |
| useDurchfuehrenLoad.ts:96 | BENIGN | Demo-Config-Init, config nicht in Deps → kein Self-Retrigger |
| useTabKonflikt.ts:64 | ALREADY_HANDLED | Korrekt auf `pruefungId` gesynct, Cleanup räumt eigenen Key |
| useTestdatenStatus.ts:42 | BENIGN | Email-Load, `abgebrochen`-Guard |

### `no-cascading-set-state` (23)
| Datei:Zeile | Klasse | Begründung |
|---|---|---|
| AutoSaveIndikator.tsx:10 | ALREADY_HANDLED | `prevCount`-ref-Guard, clearTimeout-Cleanup |
| LoginScreen.tsx:37 | ALREADY_HANDLED | `istProduktion` one-time-Init, clearInterval+clearTimeout |
| Startbildschirm.tsx:46 | BENIGN | Heartbeat-Poll; flippt auf true → Effect early-returns + stoppt |
| Timer.tsx:110 | BENIGN | Interval-Countdown, 1 Setter (mehrere Branches), clearInterval-Cleanup |
| FormelFrageComponent.tsx:92 | BENIGN | Debounced KaTeX-Preview, clearTimeout-Cleanup |
| Favoriten.tsx:59 | BENIGN | Config-Load, keine gesetzte State in Deps |
| DurchfuehrenDashboard.tsx:115 | ALREADY_HANDLED | Timer, frozen `startTimestamp`, clearInterval-Cleanup |
| RueckSyncDialog.tsx:58 | BENIGN | Async Pool-Index-Load |
| VirtualisierteFragenListe.tsx:85 | ALREADY_HANDLED | useLayoutEffect + ResizeObserver, disconnect-Cleanup |
| PDFKorrektur.tsx:69 | BENIGN | Async PDF-Load (FileReader) |
| useKorrekturDaten.ts:102 | BENIGN | Daten-Load (fragen/abgaben/korrektur/ladeStatus) |
| VorbereitungPhase.tsx:87 | ALREADY_HANDLED | Sync-on-`durchfuehrungId` (7 States re-init bei neuer Durchführung) |
| AdminTab.tsx:75 | BENIGN | Form-Seed aus `stammdaten`-prop |
| ProfilTab.tsx:18 | BENIGN | Form-Seed aus `profil`-prop |
| StatistikKarten.tsx:11 | BENIGN | Stats-Load (2 async APIs) |
| KorrekturEinsicht.tsx:39 | BENIGN | Daten-Load |
| KorrekturListe.tsx:21 | BENIGN | List-Load |
| FaecherTab.tsx:24 | BENIGN | Fragen-Load |
| FarbenTab.tsx:18 | BENIGN | Load |
| usePruefungsMonitoring.ts:250 | BENIGN | online/offline-Listener, removeEventListener-Cleanup |
| usePruefungsRecovery.ts:35 | ALREADY_HANDLED | `recoveryAttempted`-ref-Guard, clearTimeout-Cleanup |
| useTabKonflikt.ts:11 | BENIGN | BroadcastChannel/storage-Setup, channel.close+Cleanup |
| useTestdatenStatus.ts:40 | BENIGN | Parallel-API-Load, `abgebrochen`-Guard |
