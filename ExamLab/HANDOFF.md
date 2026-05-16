# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## 🚀 NÄCHSTE SESSION — Wiedereinstieg

**HEAD main + preview:** `6c30abf` — NavIcon-Persist-Migration #4 LIVE auf main + preview synchron (17.05.2026 SEHR SPÄT).

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
- ⏳ **#5 `letzterSeedAm`-Persistenz** Apps-Script Configs-Sheet (F.3 Spec §5.2 A) — braucht Deploy
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
