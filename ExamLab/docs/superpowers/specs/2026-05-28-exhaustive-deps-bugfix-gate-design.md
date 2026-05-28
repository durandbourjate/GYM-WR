# Design: exhaustive-deps — Bug-Fix + mechanische Wins + Gate

**Datum:** 2026-05-28
**Status:** Approved (Brainstorming abgeschlossen)
**Scope:** ExamLab (`src/` Fixes + `scripts/` Gate-Erweiterung + `ExamLab/package.json`)
**Vorgänger-Playbook:** `2026-05-28-react-doctor-state-gate-design.md` (gleiche Gate-Mechanik)

---

## 1. Kontext & Triage-Ergebnis

react-doctor flaggt **65× `exhaustive-deps`** in ExamLab. Volle Triage (4 Subagenten über die ~41 „missing-dependency"-Findings + manuelle Verifikation der Bug-Kandidaten + Kategorisierung der mechanischen + False-Positive-Eimer):

**Genau 1 echter Bug** (verifiziert), 2 Perf-Wins, 11 mechanisch-transformierbare ref-in-cleanup, ~51 intentional/safe (meist schon eslint-disabled). Vollständiger Audit-Trail in Anhang A.

Wichtige Verifikations-Lehre: 2 von 3 Subagent-`REAL_BUG`-Flags waren Fehlalarme (`UebungsToolView:118` durch Schwester-Effect + Guards abgedeckt; `MaterialienSection:153` durch `[neuerTitel]`-Dep korrekt). Nur per eigener Code-Lesung bestätigt.

## 2. Ziele & Nicht-Ziele

**Ziele:**
- Den 1 echten Stale-Closure-Bug fixen (exam-kritischer Pfad).
- 2 Unstable-Memo-Perf-Probleme fixen.
- 11 ref-in-cleanup auf das empfohlene React-Muster (ref→lokale Var) transformieren.
- Den verbleibenden (~51) intentional/safe-Stand als Gate festzurren — react-doctor um `exhaustive-deps` erweitern.

**Nicht-Ziele:**
- Die ~51 intentional/safe-Stellen „fixen" (sind korrekt; viele bewusst eslint-disabled).
- Andere Regeln (no-derived-state, js-set-map-lookups) — separat.
- Den ESLint-Flat-Config reparieren (vorbestehend kaputt; out of scope).

## 3. Bucket 1 — Der echte Bug: `usePruefungsMonitoring.ts:277`

**Problem:** Der Online/Offline-Listener-Effect (Z.250-277) hat `handleOnline` (Z.253), das `backendVerfuegbar` liest (Z.256: `if (backendVerfuegbar) processQueue()`). Deps (Z.277) = `[config, abgegeben, setVerbindungsstatus]` — **`backendVerfuegbar` fehlt**. `backendVerfuegbar` ist eine pro-Render abgeleitete Konstante (Z.70: `istKonfiguriert() && !istDemoModus && !!user?.email`), die false→true kippt wenn `user.email` async ankommt. Die Schwester-Effects (Z.133, 204, 217) führen `backendVerfuegbar` korrekt in den Deps — nur dieser nicht.

**Konsequenz:** Läuft der Effect während `backendVerfuegbar=false` (user.email noch nicht aufgelöst) und kippt sie danach true ohne dass config/abgegeben wechselt, behält der online-Handler stale `false`. Bei Offline→Online wird `processQueue()` nicht aufgerufen → gepufferte SuS-Antworten bleiben in der Retry-Queue (Antwortverlust-Risiko).

**Fix:** `backendVerfuegbar` in die Deps Z.277 aufnehmen (konsistent mit Schwester-Effects). `processQueue` ist Modul-Import (stabil) — nicht nötig in Deps.

> Hinweis: Derselbe Online/Offline-Effect (Z.250) steht in der **State-Gate-Baseline** als benigner `no-cascading-set-state`-Eintrag (`usePruefungsMonitoring.ts:250`). Das ist kein Widerspruch — zwei verschiedene Regeln flaggen denselben Effect aus verschiedenen Gründen (cascading=benign; missing-dep=der Bug hier).

**Verifikation:** Unit-Test (Effect re-registriert Listener wenn `backendVerfuegbar` kippt; nach Reconnect wird `processQueue` aufgerufen). Browser-E2E der SuS-Heartbeat/Auto-Save-Kette (kritischer Pfad 2).

## 4. Bucket 2 — Unstable-Memo (Perf, 2)

- `AktivPhase.tsx:59` — `zeitverlaengerungen` „makes dependencies of useMemo change on every render".
- `AnalyseDashboard.tsx:74` — `fortschritte` analog.

**Problem:** Ein pro-Render neu erzeugtes Objekt/Array in den useMemo-Deps → der Memo stabilisiert nie (läuft jeden Render). Kein Korrektheits-Bug, aber der Memo ist nutzlos.

**Fix (per-Case in Implementierung final):** Den instabilen Wert selbst memoisieren (eigener `useMemo`) ODER in den Hook-Callback verschieben. Genaue Wahl beim Lesen der Stelle.

**Verifikation:** Unit/Render-Test dass der Memo stabil bleibt; tsc + vitest.

## 5. Bucket 3 — ref-in-cleanup (11, mechanische Transform)

**Findings:** `CodeFrageComponent.tsx:58`, `FreitextFrage.tsx:109`, `PDFFrage.tsx:158`, `PDFKorrektur.tsx:160`, `ZeichnenKorrektur.tsx:206` (alle `debounceRef.current`); `Tooltip.tsx:29`, `useDebouncedHover.ts:38` (`timerRef.current`); `useAudioRecorder.ts:28` (`streamRef`); `useStiftRendering.ts:96` (`istAktivRef`); `ZeichnenFrage.tsx:121` (`inaktivitaetRef`); `usePDFRenderer.ts:111` (`docRef`).

**Problem:** Eine Cleanup-Funktion liest `xxxRef.current` direkt. Zwischen Effect-Lauf und Cleanup kann sich `.current` geändert haben → Cleanup operiert evtl. auf dem falschen Wert.

**Fix (einheitliches Muster):**
```ts
useEffect(() => {
  const ref = xxxRef.current   // Snapshot im Effect-Scope
  // ...
  return () => { /* nutze `ref`, NICHT xxxRef.current */ }
}, [...])
```
Diese Transform ist das empfohlene React-Muster und **korrekt unabhängig davon, ob die jeweilige Stelle aktuell buggy ist** (User-Entscheidung: alle 11 transformieren, nicht per-Case triagieren).

**Verifikation:** Mehrere Stellen sind sensibel (Fragetypen PDF/Zeichnen/Audio/Freitext + Korrektur). Browser-E2E der betroffenen Fragetyp-Gruppen (Bild/Medien, Spezial-Editoren, Audio) gemäss `regression-prevention.md` Verwandtschaftsgruppen. Pro Datei: Verhalten unverändert (debounce/timer/stream/cleanup funktioniert weiter).

## 6. Bucket 4 + Gate — Rest baselinen (~51)

Die ~51 intentional/safe-Stellen (Zustand-Actions, Modul-Singletons wie `toast`, Refs, `frage.id`-Sync-Sentinels, Version-Cache-Bust-Deps, `IST_DEMO`-Konstante, intentionale Run-Once-Loads) werden **nicht angefasst** — sie sind korrekt.

**Gate-Mechanik:** Die bestehende `scripts/audit-react-doctor-state.mjs` wird um die Regel `exhaustive-deps` erweitert: `RULES`-Set bekommt `'exhaustive-deps'` dazu, Baseline (`react-doctor-state-baseline.json`) wird **nach den Fixes** via `--baseline` neu erzeugt (umfasst dann die 2 State-Regeln + exhaustive-deps). Eine kombinierte react-doctor-Regression-Gate.

- **Wichtig:** react-doctor ignoriert `eslint-disable react-hooks/exhaustive-deps` (verifiziert: FormelFrage:89 wird trotz Disable gezählt — react-doctors Regel-ID ist `exhaustive-deps`, nicht `react-hooks/exhaustive-deps`). Daher müssen die intentional/safe-Stellen in der **Baseline** stehen, nicht via Disable-Kommentar. Netter Nebeneffekt: das Gate erzwingt echte Deps-Fixes, nicht nur Disable-Comments.
- Baseline-Reihenfolge: Gate-Erweiterung + Baseline-Regen ist der **letzte** Schritt (nach allen Fixes), damit die Baseline den Post-Fix-Stand (65 − 14 = ~51 exhaustive-deps) einfriert.
- Script-Name bleibt `audit-react-doctor-state.mjs` (deckt jetzt 3 Regeln); ein optionaler späterer Rename auf generisch ist YAGNI.

## 7. Verifikations-Strategie (gesamt)

- `npx tsc -b` + `npm test` nach jedem Fix-Bündel.
- **Browser-E2E (Pflicht, kritische/sensible Pfade):** SuS-Heartbeat/Auto-Save/Reconnect (Bug-Fix §3); Fragetyp-Gruppen Bild/Medien (PDF, Zeichnen), Audio-Aufnahme, Spezial-Editoren (Code/Formel/Freitext) für die ref-Transforms §5. Echte LP+SuS-Logins, kein Demo-Modus.
- Voller `ci-check` grün (inkl. erweitertem Gate) vor Merge.
- Merge-Gate: explizite User-Freigabe.

## 8. Risiken

- **Sensible-Datei-Churn (ref-Transforms):** 11 Dateien, mehrere im Prüfungs-Render-Pfad. Mitigation: einheitliche kleine Transform + Browser-E2E pro Fragetyp-Gruppe.
- **Bug-Fix-Verhalten (§3) schwer E2E-bar** (offline→online + Queue). Mitigation: Unit-Test + Konsistenz-Argument (identisch zu Schwester-Effects).
- **Kombinierte Baseline** mischt 3 Regeln in einem Gate — akzeptabel; Drift-Report bleibt pro-Datei.

---

## Anhang A — Triage-Inventur (65 Findings)

**Fixen (14):**
- BUG (1): `usePruefungsMonitoring.ts:277` (backendVerfuegbar).
- Unstable-Memo (2): `AktivPhase.tsx:59`, `AnalyseDashboard.tsx:74`.
- ref-in-cleanup (11): CodeFrageComponent:58, FreitextFrage:109, PDFFrage:158, PDFKorrektur:160, ZeichnenKorrektur:206, Tooltip:29, useDebouncedHover:38, useAudioRecorder:28, useStiftRendering:96, ZeichnenFrage:121, usePDFRenderer:111.

**Baselinen — intentional/safe (~51), Auswahl mit Begründung:**
- **frage.id-Sync-Sentinels** (intentional, oft eslint-disabled): BilanzERAufgabe:91, BuchungssatzFrage:84, TKontoFrage:42, CodeFrageComponent:121, FormelFrageComponent:89, FreitextFrage:128, PDFFrage:155/174.
- **Zustand-Actions / Modul-Singletons (stabil)**: TagsTab:42, EinstellungenPanel:53, LernzielTab:74, useLPDashboardData:161 (toast), usePruefungsMonitoring:204, SuSStartseite:93 (toast), PDFFrage:192 (onAntwort).
- **Refs (stabil, Zeichnen-Pattern)**: ZeichnenCanvas:135/161/180/272/326/385, PDFSeite:238, VirtualisierteFragenListe:119.
- **useCallback-covered Closures**: useLPConfigFiltering:90/96 (filtereConfigs), ExcelImport:83/104 (markiereDuplikate), useFragenEditor:109/123 (oeffnen).
- **Version-Cache-Bust-Deps (unnötig laut Linter, aber intentional)**: useThemenKomputationen:133, useFragenFilter:222, AdminThemensteuerung:90, SusDetailPanel:38, useGlobalSucheSuS:79.
- **IST_DEMO-Konstante**: AppUeben:83/89/95.
- **frage.id-unnecessary (harmlos)**: HotspotFrage:57, SortierungFrage:90/137.
- **Intentional Run-Once / Loop-Guards**: App:273, LoginScreen:72, Timer:146 (autoAbgabe nutzt Refs), VorbereitungPhase:95, UebungsToolView:118, useAutoSavePruefung:67, useFragenFilter:147, useLockdown:52, usePreWarm:39, MaterialienSection:153, usePruefungsMonitoring:277-Schwester-Loads, tagsStore:90.

(Die genaue Baseline-Liste wird durch den `--baseline`-Lauf nach den Fixes maschinell erzeugt — diese Tabelle ist der Begründungs-Trail.)
