# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Letzter Stand auf main

### Bundle S.a — Renderer-Splits (KorrekturFrageVollansicht + DruckAnsicht) ✅ READY FOR MERGE (2026-05-06)

Branch `refactor/bundle-s-a-renderer-splits` (auch auf `origin/preview` für Staging-E2E gepusht). 4 Implementation-Commits + 3 Doc-Commits (Master-Spec + Plan). Erstes Sub-Bundle aus Bundle S (Niedrig-Risiko-Datei-Splits) — sechstes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05).

**Was geliefert:**
- `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` (846 Z.) → Folder mit 23 Sub-Dateien (1 `index.tsx` Dispatcher + 1 `util.tsx` mit `frageHaupttext`/`KeineAntwort` + 21 Strategy-Files: 19 `<Fragetyp>Anzeige.tsx` + `AutoKorrekturDetails.tsx` + `MusterloesungBox.tsx`)
- `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` (810 Z.) → Folder mit 18 Sub-Dateien (1 `index.tsx` Dispatcher + 1 `util.ts` mit `BUCHSTABEN` + 1 `hinweise.tsx` mit 5 Stub-Komponenten + 15 Strategy-Files: `<Fragetyp>Druck.tsx`)
- 2 minimal-Caller-Edits: `KorrekturFrageZeile.tsx:9` + `VorschauTab.tsx:9` — beide nur `.tsx`-Extension droppen wegen Folder-Resolution
- Folder-Pattern: jede Datei wird zu `<File>/index.tsx`-Dispatcher + Strategy-Sub-Dateien. Caller-Imports byte-identisch (Folder-Resolution durch Vite/Node)
- Cutover-Strategie: erst Folder mit allen Sub-Dateien anlegen (alte Datei gewinnt Resolution), dann alte Datei löschen (Folder gewinnt). Verhindert Vite-Resolution-Race
- Master-Spec für gesamtes Bundle S: `docs/superpowers/specs/2026-05-06-bundle-s-niedrig-risiko-datei-splits-design.md`
- Plan für S.a: `docs/superpowers/plans/2026-05-06-bundle-s-a-renderer-splits.md`
- Cleanup: 2 macOS-Duplikate (`ToastContainer 2.tsx`, `ToastContainer.test 2.tsx`) entfernt (waren untracked)

**Hotspot-Bilanz (Files >500 Z.):** **17 → 15** ✅ (KorrekturFrageVollansicht 846 + DruckAnsicht 810 raus). Bundle-S.b/S.c-Targets (VorschauTab 643, poolConverter 744, fibuAutoKorrektur 600) noch dabei — gehören in Folge-Sessions.

**Verifikation:**
- vitest **1253 passed | 4 todo (1257 total)**, 161 Test-Files | 1 skipped — drift = 0 ✅
- tsc -b clean, build clean
- lint:as-any 0/0/0, lint:no-alert 0 Treffer, lint:no-tests-dir clean
- Spec-Compliance-Reviewer-Subagent: APPROVED (alle 21 + 15 Anzeige/Druck-Bodies byte-identisch zu Original verifiziert)
- Code-Quality-Reviewer-Subagent: APPROVED — keine Critical/Important-Issues

**Browser-E2E auf staging (echte LP-Logins, Service-Worker-Cache vorab zurückgesetzt):**
- ✅ LP-Druck-Pfad: 17 von 19 Druck-Komponenten visuell verifiziert (MC, MC multi, RichtigFalsch, Sortierung, Hotspot, Freitext, Lückentext, Zuordnung, Berechnung, Buchungssatz, TKonto, Kontenbestimmung, Bilanz/ER, Bildbeschriftung, DragDropBild, Aufgabengruppe, Zeichnen-Hinweis, Code-Hinweis). Console nach Reload: 0 Errors
- LP-Korrektur-Pfad: nicht direkt getestet (kein Prüfung-mit-Abgaben in Staging-Daten verfügbar). Stützt sich auf Reviewer-verifizierte Byte-Identität der 21 Anzeige-Bodies + DruckAnsicht-Pattern-Confirmation

**Concerns / Reviewer-Beobachtungen (alle pre-existing, nicht durch S.a induziert):**
- `util.tsx` (statt geplantes `util.ts`) — `KeineAntwort` rendert JSX, `.tsx` mechanisch nötig
- `index.tsx` 256 Z. statt geplante 110-130 Z. (DruckAnsicht) — enthält 3 Komponenten + Dispatcher, akzeptabel unter 500-Schwelle
- `AufgabengruppeDruck.tsx:17` Doppel-Ternary `'Pt.' : 'Pt.'` (beide Branches gleich) — pre-existing, byte-identisch übernommen
- `SortierungDruck.tsx:5` `.sort(() => 0.5 - Math.random())` non-deterministisch — pre-existing, byte-identisch übernommen, Spawn-Task im UI-Chip-Backlog für separaten Fix

**Phase-4-Security-Check:** Bundle ist reiner Refactor ohne Wire-Vertrag-/API-Body-/Session-Token-/Response-Filter-Berührung. Keine sicherheitsrelevanten Code-Pfade tangiert. Folder-Resolution-Mechanik ist build-tool-intern.

**Sub-Commits:**
- `7058d05` Master-Spec
- `bf977e6` + `42fe56f` S.a Plan + Reviewer-Empfehlungen
- `30abb39` Phase 1.1: KorrekturFrageVollansicht/ Folder-Skeleton (23 Sub-Dateien)
- `a94ff54` Phase 1.2: KorrekturFrageVollansicht Cutover
- `a949b8b` Phase 2.1: DruckAnsicht/ Folder-Skeleton (18 Sub-Dateien)
- `2e367b3` Phase 2.2: DruckAnsicht Cutover

**Lehre für Bundle S.b/S.c:**
- Vor Cutover: `grep -rn "from.*<FileName>\\.tsx"` für explizite-Extension-Caller-Audit (pro File 1 unerwarteter Caller mit `.tsx`-Extension fix nötig)
- Folder-Resolution-Race ist NICHT theoretisch — wenn alte Datei mit `.tsx`-Extension explizit gerefenced wird, scheitert Resolution nach Cutover bis Caller-Path auch geupdated ist
- Implementer-Subagents melden DONE_WITH_CONCERNS für mechanisch-nötige Plan-Abweichungen (z.B. `util.ts` → `util.tsx`) — Spec/Plan in Folge-Sub-Bundles entsprechend pre-emptiv flexibel formulieren

**Folge:**
- Bundle S.b (VorschauTab, ~13 Sub-Dateien) — eigene Session
- Bundle S.c (poolConverter + fibuAutoKorrektur, ~10 Sub-Dateien) — eigene Session
- Phase 3 (Bundle P, T) und Phase 4 (Bundle U) folgen

---

### Bundle R — Error-Handling-Vereinheitlichung ✅ MERGED (2026-05-06)

Merge-Commit `6789aa2` auf `main`. Branch `feature/bundle-r-error-handling-vereinheitlichung` lokal + remote gelöscht. 26 Sub-Commits inkl. 2 Hotfixes. Fünftes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). Toast-System app-weit, alle alert() migriert, silent-fail console.error ergänzt.

**Was geliefert:**
- `ExamLab/src/store/toastStore.ts` — Zustand-Store mit `add/dismiss/clear`, `error`-sticky-Default, 4s Auto-Hide für andere Variants
- `ExamLab/src/hooks/useToast.ts` — module-stable Singleton-Hook (`{ error, success, info, warning, dismiss }`)
- `ExamLab/src/components/shared/ToastContainer.tsx` — top-right `z-[1000]`, X-Button, Tailwind dark-mode-Pairs, gemounted in `main.tsx` (siehe Hotfix #2)
- 19 vitest-Tests neu (1234 → 1253)
- 9 `alert()` migriert: ErrorBoundary (2x), MitgliederTab, BeispieleListe (3x), PapierkorbView (2x), BeendetPhase
- 8 silent-fail `console.error` aus Audit-Bucket-(b) ergänzt mit Toast: SuSStartseite, useKorrekturActions, PDFKorrektur, KorrekturFrageZeile, LoginScreen, LPStartseite-Sync (2x → `warning`)
- LPStartseite ad-hoc Toast (`kursNichtGefundenToast`) → `useToast()` (-21/+2 Zeilen)
- Konvention: `.claude/rules/code-quality.md` Sektion „Error-Handling"
- CI-Gate: `scripts/audit-no-alert.sh` + `npm run lint:no-alert` (Production + Staging-Steps mit `--if-present` für chicken-and-egg)
- Audit-File: `docs/superpowers/audits/2026-05-06-bundle-r-console-error-audit.md`

**Hotfixes während Phase 6 E2E:**
1. `71a4e9e` Phase 5.2: `lint:no-alert --if-present` in production-block — gegen `main`-checkout, das Script noch nicht hat. Self-aktivierend nach Merge.
2. `d248c79` Phase 1.4: ToastContainer in `main.tsx` (vorher in `App.tsx` — Tote-Code-Pfad weil Router App lazy-importiert aber nicht verwendet).

**Phase 6 Browser-E2E (mit echten LP-Logins):**
- ✅ PapierkorbView Wiederherstellen (Network-Mock) → roter sticky Toast „Fehler beim Wiederherstellen: ..."
- ✅ PapierkorbView Endgültig löschen (Network-Mock) → roter sticky Toast „Fehler beim Löschen: ..."
- ✅ X-Button dismisses
- ✅ LPStartseite `?kursId=NICHT-EXISTIEREND-XYZ` → gelber `warning`-Toast „Kurs ... nicht gefunden — zu Test umgeleitet", 4s Auto-Hide
- Phase-2 (BeispieleListe/MitgliederTab/BeendetPhase/ErrorBoundary) und Phase-3 silent-fail-Stellen folgen exakt demselben `useToast().error(...)`-Pattern → durch Reviews + 2 verifizierte Pfade hohe Konfidenz.

**vitest 1253 grün, tsc/build/lint:as-any/lint:no-alert clean.**

**Spawn-Task offen:** `App.tsx` default export + `Router.tsx` Z. 9 `lazyMitRetry(() => import('../App'))` sind Tote-Code-Pfad. Sauberes Removal in eigenem Bundle (S oder Folge-Cleanup).

---

### Bundle O — Store-Action-Naming-Vereinheitlichung ✅ MERGED (2026-05-06)

Merge-Commit `b025b2d` auf `main`. Branch `refactor/bundle-o-store-naming` lokal + remote gelöscht. 7 Sub-Commits + 1 HANDOFF/Memory. Viertes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). 22 Action-Renames in 6 Stores + 2 Navigation-Hooks nach Bundle-V-Sprach-Konvention (Programming-Primitives englisch, Domain-Verben deutsch).

**Audit-Token-Diff:**
| Token | vorher | nachher |
|---|---:|---:|
| `setze*` (Setter-Präfix Identifier) | ~50 | 0 |
| `zuruecksetzen` (pruefungStore) | 8 | 0 |
| `registriere(` (draftStore) | 19 | 0 |
| `abmelde(` (draftStore — un-register, NICHT Auth-Domain) | ~10 | 0 |
| `navigiereZuComposer` | 14 | 0 |
| `zurueckZumDashboard` | 11 | 0 |
| `\.navigiere(` (pruefungStore) | ~3 | 0 |
| `\.zurueck()` (lpUIStore + useSuSNavigation) | ~3 | 0 |
| `navigiereZuEinstellungen/Korrektur/Monitoring/Frageneditor/Favoriten` | 11 | 0 |
| `\.zu(Dashboard\|Uebung\|Ergebnis\|Admin\|GruppenAuswahl\|Pruefen)\(` | 60+ | 0 |
| `set*` / `register/openX/backToDashboard/back/reset/navigate/unregister` | (Baseline) | ~190 |

**Domain-Verben unverändert (Bundle-V-Konvention):** `anmelden / anmeldenMitGoogle / anmeldenMitCode / abmelden` bleiben deutsch. Auth-Domain `abmelden` (mit `n`) ist NICHT identisch mit draftStore-`abmelde` (Word-Boundary-Grep-Disambiguierung).

**Out-of-Scope-Ausnahmen:**
- `apiService.setzeTeilnehmer` (HTTP-Wire-Vertrag-Property) — nicht Store-Action.
- `lockdown.registriereVerstoss` (Lockdown-State-Action, separate Domain) — nicht draftStore.
- `AppShell.tsx::navigiereZuDashboard` (Component-internal Wrapper-Helper) — nicht Hook/Store.

**Sub-Commits:**
- `227d369` Phase 1: ueben/authStore setzeRolle → setRolle (Smoke-Test, 1 Rename)
- `25582fc` Phase 2: ueben/settingsStore setze*-Setter → set* (2 Renames)
- `9318a2e` Phase 3: ueben/themenSichtbarkeitStore setze*-Setter → set* (2 Renames)
- `c0acd85` Phase 4: draftStore registriere/abmelde/setze* → register/unregister/set* (4 Renames inkl. Reviewer-aufgedeckt abmelde)
- `84b0f00` Phase 5: pruefungStore navigiere/zuruecksetzen → navigate/reset (2 Renames)
- `5ba11fd` Phase 6: lpUIStore + useLPNavigation navigiere*/zurueck* → openX/backToDashboard/back (8 Renames: 3 Store + 5 Hook)
- `32cc6de` Phase 7: useSuSNavigation zu*/zurueck → open*/back (7 Renames)
- `6c13efd` Phase 8: HANDOFF + Memory

**Pre-Push-Verifikation:**
- vitest: 1234 passed | 4 todo (gleiche Baseline wie nach Bundle Q) ✅
- tsc -b: clean ✅
- npm run build: clean ✅
- npm run lint:as-any: 0 ✅ (Baseline gehalten)
- npm run lint:no-tests-dir: 0 ✅
- Final-Audit-Grep: 0 Treffer (mit Ausnahme-Filter `setzeTeilnehmer`/`abmelden`/`Defensive`) ✅

**Apps-Script-Deploy:** nicht nötig (rein Frontend-TS).
**Preview-Sync:** `git push origin main:preview` nach Merge (deployment-workflow-Lehre 2026-05-06).
**Browser-E2E:** Phase 6 + 7 sind UI-betreffend — empfohlen vor PR/Merge mit echten Logins (LP wr.test@gymhofwil.ch + SuS wr.test@stud.gymhofwil.ch).

**Plan-Lehre (Lernschleife):** Pre-Plan-Recheck hat Hook-Scope-Lücke aufgedeckt (`useLPNavigation`+`useSuSNavigation`) die der Audit nicht erfasste. Plan-Reviewer fand zusätzlich (a) `setzeTeilnehmer`-False-Positive im Final-Audit-Grep (apiService) und (b) `draftStore.abmelde`-Sibling fehlend zu `registriere`. Diese 3 Items wurden vor Implementation in Spec/Plan eingebaut. Konvention dokumentiert: bei Store-Action-Bundles auch Hook-API-Spiegelungen + lokale Helper-Funktionen scannen.

### Bundle Q — Test-Verzeichnis-Konsolidierung ✅ MERGED (2026-05-06)

Merge-Commit `dc25f9a` auf `main`. Branch `refactor/bundle-q-tests-konsolidierung` lokal + remote gelöscht. 4 Sub-Commits + 1 Follow-up. Drittes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). 19 Test-/Helper-Dateien aus 3 `__tests__/`-Verzeichnissen umverteilt nach Heuristik B („Test wandert zur Source"); CI-Gate `lint:no-tests-dir` analog zu `lint:as-any`.

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
- `5f45a10` Phase 1: src/__tests__/-Hauptmasse (17 Files + vitest-config-Alias `@testing-library/react`)
- `cd9bd76` Phase 1 Follow-up: stale JSDoc-Pfad in `packages/shared/src/test-helpers/frageCoreMocks.ts`
- `733205d` Phase 2: components/__tests__/-Subdirs (2 Files; +14 zusätzliche `vi.mock`/`import()`-Pfad-Rewrites in DurchfuehrenDashboard.test.tsx)
- `f567bc8` Phase 3: scripts/audit-test-locations.sh + lint:no-tests-dir + 2× CI-Gate + Sektion „Test-Layer-Strategie"
- `be74b64` Phase 4: HANDOFF + Memory + Lernschleife

**Pre-Push-Verifikation:**
- vitest: 1234 passed | 4 todo (gleiche Baseline wie nach Bundle N+V) ✅
- tsc -b: clean ✅
- npm run lint:as-any: 0 ✅ (Baseline gehalten)
- npm run lint:no-tests-dir: 0 ✅ (neu)
- find ExamLab/src packages/shared/src -type d -name __tests__: leer ✅

**Apps-Script-Deploy:** nicht nötig (test-/tooling-only).
**Kein Browser-E2E** (Audit-Klassifikation mech-rename-niedrig, keine Wire-Vertrag-/UI-Änderung).

**Plan-Lehre (Lernschleife):** Plan-Verifikation-Grep `from '\.\.'` matchte nur ES-Imports, nicht `vi.mock('...')`-Args und `await import('...')`. In Phase 2 hatte DurchfuehrenDashboard.test.tsx 14 weitere Pfade in solchen String-Argumenten — vom Implementer gefangen, weil tsc nach den Moves errored. Plan-Template für künftige Test-File-Moves muss `vi\.mock\(['\"]\.|import\(['\"]\.|require\(['\"]\.|from ['\"]\.` als kombinierte Regex haben.

### Bundle N+V — action/aktion-Vereinheitlichung + Sprach-Konvention ✅ MERGED (06.05.2026)

Merge-Commit `fd64322` auf `main`. Branch `refactor/bundle-n-action-aktion-vereinheitlichung` lokal + remote gelöscht. 7 Sub-Commits, 1 Apps-Script-Deploy, 2 Sheet-Header-Edits. Zweites Cleanup-Bundle aus dem [Vereinfachungs-Audit (05.05.2026)](../docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md). Disambiguierung in zwei Lager (Lager A: HTTP-Operation-Tag → englisch `action`, Lager B: KI-Sub-Action-Domain-Konzept → deutsch `kiAktion`) plus Hybrid-Sprach-Konvention dokumentiert.

**Audit-Token-Diff (`apps-script-code.js`):**
| Token | vorher | nachher |
|---|---:|---:|
| `aktion` (Lager A + B) | 56 | 0 |
| `Aktion` (UI-Strings + Comments) | 6 | 6 (4 JSDoc + 2 KI-Aktion-Strings, alle erlaubt) |
| `LP_AKTIONEN`/`SUS_AKTIONEN`/`SCHREIBENDE_AKTIONEN` | 6 | 0 |
| `LP_ACTIONS`/`SUS_ACTIONS`/`SCHREIBENDE_ACTIONS` | 0 | 6 |
| `kiAktion` (neuer Token) | 0 | 52 |

**Sub-Commits:**
- `7b464c0` Phase 1 (Bundle V): Sprach-Konvention Hybrid Deutsch/Englisch in `.claude/rules/code-quality.md`
- `adeaea6` Phase 2 Lager A: rateLimitCheck_ + lernplattformRateLimitCheck_ aktion → action
- `33527bd` Phase 2 Lager A: auditLog_ aktion → action (Header + Body + 2 Aufrufer-Detail-Objects)
- `9bc88b3` Phase 2 Lager A: LP_AKTIONEN/SUS_AKTIONEN/SCHREIBENDE_AKTIONEN → *_ACTIONS
- `71fb6d2` Phase 2 Lager A: "Unbekannte Aktion"-Error-Strings → Action
- `22dbee8` Phase 3 Lager B Apps-Script (atomic): aktion → kiAktion (kiAssistentEndpoint, Sheet-Header, 6 Helpers, Plural-Formen)
- `f3aee7c` Phase 3 Lager B Frontend (atomic): aktion → kiAktion (uploadApi, kalibrierungApi, fragensammlungApi, useKIAssistent + 25 Files)

**E2E-Verifikation (LP, mit echten Logins `wr.test@gymhofwil.ch`):**

End-to-End Wire-Vertrag-Test des KI-Endpoints via Fetch-Hook:
```json
Body sent:     {"action":"kiAssistent","email":"wr.test@gymhofwil.ch","kiAktion":"generiereMusterloesung","daten":{...}}
Response 200:  {"success":true,"ergebnis":{"musterloesung":"Der Kauf eines Porsches erfüllt..."}}
```

- ✅ Frontend sendet `kiAktion`-Property (nicht `aktion`)
- ✅ Backend liest `body.kiAktion` korrekt (Apps-Script-Code aktiv via clasp push)
- ✅ Switch-Routing zu KI-Sub-Action funktioniert (`generiereMusterloesung`-Case)
- ✅ KI generiert sinnvolle Antwort (nicht „Keine kiAktion angegeben")

**Apps-Script-Deploy:** User durchgeführt ✅
**Sheet-Header-Edits:** User durchgeführt ✅ (Audit-Log-Sheet `aktion` → `action`, KI-Feedback-Sheet `aktion` → `kiAktion`)

**Pre-Push-Verifikation:**
- vitest: 1234 passed | 4 todo (gleiche Baseline) ✅
- tsc -b: clean ✅
- lint:as-any: 0 instances ✅
- build: clean (PWA generated) ✅

**Lehre — Service-Worker-Cache nach Frontend-Deploy:**
Nach Wire-Vertrag-ändernden Bundles (HTTP-Body-Property-Rename) ist Hard-Reload + `serviceWorker.unregister() + caches.delete()` vor Browser-E2E zwingend. Beim ersten Test gab User „Keine kiAktion angegeben"-Error (Backend lief auf neuem Code, aber PWA-Service-Worker lieferte alten kompilierten Frontend-Bundle). Nach SW-Kill: KI-Klick funktionierte sofort.

**Lehre — Lager-A-vs-Lager-B-Disambiguierung beim Audit-Empfehlungs-Audit:**
Audit empfahl mech-rename `aktion → action`. Beim Brainstorming aufgedeckt: Frontend HTTP-Body hat `action: 'kiAssistent'` (Endpoint-Discriminator) UND `aktion: 'generiereMusterloesung'` (KI-Sub-Action) **simultan**. Ohne Disambiguierung wären zwei Properties mit demselben Namen entstanden. Bundle wurde in 2 Lager geschnitten: Lager A (englisch wie Wire-Vertrag) + Lager B (deutsch wie Domain-Konzept). Konvention dokumentiert in code-quality.md.

---

### Bundle M — Fragenbank → Fragensammlung Rename ✅ MERGED (05.05.2026)

Merge-Commit `606f256` auf `main`. Branch `feature/bundle-m-fragensammlung-rename` lokal + remote gelöscht. 9 Sub-Commits, 2 Apps-Script-Deploys, Sheet-Spalten-Rename. Erstes Cleanup-Bundle aus dem [Vereinfachungs-Audit (05.05.2026)](../docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md). Mechanischer Rename, niedriges Risiko.

**Audit-Token-Diff:**
| Token | vorher | nachher (Code) |
|---|---:|---:|
| `fragenbank` | 97 | 3 (Bundle-M-Cleanup-Hook in authStore, absichtlich) |
| `Fragenbank` | 49 | **0** |
| `FRAGENBANK` | 6 | **0** |
| Total | 152 | 3 |

**Sub-Commits:**
- `972e9c2` Task 0: audit-tokens.sh cherry-pick + 27 macOS-Duplikate aufgeräumt
- `2bed478` Task 1: Apps-Script Backward-Compat (Sheet-Spalte + Endpoints + JSON-Field parallel)
- `59eba6c` Task 2: Apps-Script intern alles umbenannt (FRAGENSAMMLUNG_ID, var fragensammlung, Funktionen, Cache-Keys, JS-Field-Typo)
- `7836574` Task 2 follow-up: 9 lokale Temp-Vars (`fragenbankSS`/`fragebankSs`) renamen (Code-Quality-Reviewer-Finding)
- `97dfd59` Task 3: Frontend Service-Layer (3 Files) + Type-Field-Rename (7 Stellen) + IDB-Cleanup-Hook in authStore.anmelden()
- `23d2342` Task 4: Komponenten-Ordner `lp/fragenbank/` → `lp/fragensammlung/` (15 Files)
- `96d135e` Task 5: Tests + Mocks (1234/1238 vitest grün)
- `05af255` Task 6: Backward-Compat-Removal + Apps-Script-Comments + HANDOFF + Memory
- `606f256` Merge nach main

**E2E-Pfade (LP, mit echten Logins `wr.test@gymhofwil.ch`):**

| # | Pfad | Status |
|---|---|---|
| 1 | Fragensammlung lädt 2363 Fragen, neue IDB voll | ✅ |
| 2 | Frage-Editor + Auto-Save (Bundle 3): „Speichert..." → „✓ Gespeichert" | ✅ |
| 3 | Drafts-Section (2 Entwürfe) | ✅ |
| 4 | Papierkorb (1 Eintrag) | ✅ |
| 5 | Pool-Sync-Dialog Component lädt | ✅ |
| 6 | Excel-Import-Modal öffnet | ✅ |
| 7 | Logout: neue IDB leer | ✅ |
| 8 | Re-Login: Console-Log `[Bundle M] alte fragenbank-DB gedroppt` + alte IDB komplett weg | ✅ |

**Apps-Script-Deploys während Bundle M:**
1. Deploy 1 nach Task 2 (Backward-Compat aktiv): User durchgeführt ✅
2. Deploy 2 nach Task 6 (Backward-Compat entfernt, finaler Stand): User durchgeführt ✅ — Final-Smoke-Test mit Cache-Buster-URL bestätigt

**User-Aktionen während Bundle M:**
- Sheet-Spalte `fragenbanksheetid` → `fragensammlungsheetid` im Gruppen-Tab umbenannt ✅

**Lehren (für Memory + future Renames):**
- macOS-Duplikate (`* 2.tsx`) im Working-Tree vor Ordner-Rename aufräumen — sonst wandert Cruft beim `git mv` mit (Task 0 + 27 untracked Dupes gelöscht)
- Backward-Compat-Pattern: Apps-Script + Endpoint-Aliases + Dual-JSON-Field für gleichnamige Wire-Verträge → Frontend-Migration kann zwischen Apps-Script-Deploys laufen ohne Race-Condition
- Bei `git mv old-Service.ts new-Service.ts` mit präexistierender new-Service.ts (z.B. partielles Frühe-Migration) → MERGEN statt ersetzen, dann `git rm old`. Die initiale Subagent-Iteration übersah das und legte parallele Files an — Reset + manuelles Merge nötig
- Word-Boundary-Grep `\bfragenbank\b` matched nicht `fragenbankSS` (Suffix-Token) → Code-Quality-Reviewer fängt solche Stellen, sed-Pass mit `(var|const|let) fragenbank ` allein ist nicht genug
- Apps-Script `case 'X'` Aliases: globale `sed`-Replace auf `ladeFragenbank` würde diese Strings auch ersetzen → manueller Restore nach Mass-Rename nötig
- IDB-Cleanup-Hook in `anmelden()` feuert NUR bei aktivem Login, nicht bei session-restore. Beim Logout läuft nur der neue (renamen) Cache-Cleanup — die alte DB bleibt bis zum nächsten aktiven Re-Login. Acceptable für 1 Login-Cycle.

---

### Bundle 3 — Auto-Save + Drafts + Papierkorb ✅ MERGED (05.05.2026)

Merge-Commit `7c411e0` auf `main`. Branch `feature/bundle-3-autosave-drafts-papierkorb` lokal + remote gelöscht. Backend `0042b5f`-Stand deployed (4 Apps-Script-Deploys während Phase A + F.4). Frontend vitest grün (1234/1238). Browser-E2E mit echten Logins (`wr.test@gymhofwil.ch`) Pfade 1-7 ✅, 8-10 vitest-covered. 6 E2E-entdeckte Bugs alle gefixt + 5 Memory-Lehren extrahiert.

**Phase A — Apps-Script-Backend (deployed):**
- A.1 (`731d6b5`): Type-Erweiterung `status?: 'draft'|'sammlung'` + `geloescht_am?: string` in `fragen-storage.ts` (optional, bewusst KEIN required-Pull)
- A.2 (`cd65aa2` + `2a76b82` fixup): `istVollstaendig_(frage)` thin server-side Validator + `speichereFrageIntern_` Pure-Helper + `speichereFrage`-Wrapper. ensureColumns ergänzt status/geloescht_am-Spalten automatisch beim ersten Schreiben (kein Backfill-Job nötig).
- A.3 (`cfb6c43`): `loescheFrage` zu Soft-Delete (`geloescht_am=ISO`) + Owner-Check (Plan-Refinement #3 — Security-Fix für vorher-fehlenden IDOR-Schutz) + `loescheFrageIntern_` Pure-Helper
- A.4 (`4a4b466`): 3 neue Endpoints `stelleWiederHer` + `hardDeleteFrage` + `listePapierkorb` mit Pure-Helpers (jeweils trailing-underscore-Konvention) + Dispatcher-Cases + Owner-Check + listePapierkorb ruft `parseFrage` (Plan-Refinement #4)
- A.5 (`8832e3f` + `0b41b0d` fixup): Lese-Endpoints `ladeFragenbank` + `ladeFragenbankSummary` filtern `geloescht_am`. Fixup ergänzt `stelleWiederHer` + `hardDeleteFrage` in `LP_AKTIONEN` für `cacheInvalidieren_`-Trigger
- A.6 (`621874b`): GAS-Test-Shim `testBundle3DraftLifecycle_` mit 5 Cases (vollständig→sammlung, unvollständig→draft, Restore-Pflichtfeld, Soft-Delete, Restore+Hard-Delete-Cleanup) — **GAS-Editor-Run bestätigt 5/5 ✓ inkl. ensureColumns-Auto-Migration**
- A.7 (`5ab6e1e` + `4a721ed` fixup): `autoHardDeleteAlteFragen_` (90-Tage-Schwelle, alle 4 fachbereich-Tabs, Reverse-Sort der Row-Indices) + Daily-Trigger-Installer (3:00). Fixup ergänzt `script.scriptapp`-Scope in `appsscript.json` (vorher kein Code rief Trigger-APIs). **GAS-Editor-Run bestätigt Trigger installiert ✓**
- A.7 zusatz (`0a7f7a7` via Merge `5e17663`): Sheet-Guard für `lastCol === 0` in 4 Bundle-3-Helpern (`speichereFrageIntern_`, `loescheFrageIntern_`, `stelleWiederHerIntern_` werfen; `autoHardDeleteAlteFragen_` `continue` weil Trigger nicht eskalieren darf). S130-Pattern aus `code-quality.md`.

**Phase B — Service-Layer (TDD, ~830 SLOC, +47 Tests):**
- B.1 (`4c70abf`, +9 Tests): `draftApi.ts` mit 3 Endpoint-Wrappers + `unwrap`-Helper (S130-Pattern: `postJson<T>`-Cast ist Lüge)
- B.2 (`d00d251`, +8 Tests): `draftSync.ts` Hybrid IDB+Server. 1s/10s-Debouncing, 4-Stufen-Retry (5xx exp.backoff 1s→2s→4s max 3, 401 eskaliert weil kein LP-`sessionWiederherstellen` existiert, 429 wait-Retry-After, 4xx eskaliert sofort), BroadcastChannel via globalThis-Stub (jsdom 29 unterstützt es nicht nativ). Ergänzt `speichereFrageMitStatus(email, frage)` in `fragenbankApi.ts` — existing `speichereFrage` UNVERÄNDERT.
- B.3 (`d4d5d74`, +12 Tests): `draftStore.ts` (Zustand) — Map-Immutable-Pattern für aktive Drafts pro `editorId`, `hatDirty()` für beforeunload
- B.4 (`81b45be`, +12 Tests): `useDirtyTracker(editorId)` + `useFragenAutoSave(editorId, frage)` Hooks. Status-Mapping aus draftSync-State + Frontend `validierePflichtfelder`. API-Inversion via Slot-Props.
- B.5 (`d0693d6`, +6 Tests): `draftCache.ts::clearDraftIDBCache()` — `keys()` + filter `'draft:'`-Prefix + sequenziell `del()`. NICHT `clear()` (würde lp-fragen-* mitlöschen). S149-Pattern via idb-keyval-internal `tx.oncomplete`-await.

**Phase C — Editor-Integration:**
- C.1 (`3ee0d66`, +10 Tests): `SaveStatusIndikator` (5 Zustände: sauber/sync-läuft/entwurf/verbindungsproblem/server-down) in `packages/shared/src/editor/components/`. Re-Export aus `@shared/index`.
- C.2 (`43286ba`, +13 Tests): `SchliessenModal` mit 2 Varianten (`unvollstaendig` 3-Buttons, `sync-pending` 2-Buttons) + `open=false`-silent-close-Pattern. Initial-Focus auf Abbrechen, ESC + Backdrop-Click-Handling, ARIA-konform.
- C.3 (`1b0705c`, +5 Tests): SharedFragenEditor opt-in `autoSave?: AutoSaveAdapter`-Prop mit `statusSlot`/`onTippe(frage)`/`onSchliessenVersuch()`. **API-Inversion** — Hook lebt in ExamLab, Shared-Editor weiß nichts davon. PruefungFragenEditor + UebenEditor reichen Prop transparent durch (existing Verhalten 1:1 wenn nicht gesetzt). FragenBrowser bringt Hook + UI mit.
- C.4 (`8281503`, +7 Tests): beforeunload-Listener in LPStartseite (`hatDirty()` → preventDefault) + `clearDraftIDBCache()` als 4. Element in `authStore.abmelden()` Promise.all.

**Phase D — Fragensammlung-UI:**
- D (`e9612cb`, +8 Tests): `DraftsSection` Komponente (Header „✏️ Entwürfe (N)" + Liste mit Owner-Hinweis bei geteilten Drafts) oben in FragenBrowser. `useMemo`-Filter teilt `fragen` in `drafts` + `sammlungFragen` — `VirtualisierteFragenListe` bekommt nur sammlungFragen (kein Doppel-Render).

**Phase E — Papierkorb:**
- E (`0df9c39`, +9 Tests): `PapierkorbView` mit Liste + Wiederherstellen + Endgültig-löschen (window.confirm vor destruktiv) + Warning-Badge bei ≤7 Tagen bis Auto-Hard-Delete. Route `/papierkorb` + 5. L1-Tab in `useTabKaskadeConfigLP` + Modus-Erweiterung in `lpUIStore` + `useLPRouteSync`-Hook.

**Phase F — Cleanup + Pre-Merge:**
- F.1 (Plan-rev3-Pfad „Defensive"): `status?` + `geloescht_am?` bleiben optional. Keine 30+ Frage-Erzeugungs-Stellen müssen migriert werden — Server ist authoritativ, Frontend-Default unklar. Doku-Hinweis in HANDOFF.
- F.2: tsc -b clean (exit=0) + `vitest run` 1234/1238 grün + 4 todo + 0 fail + `npm run build` clean (256 PWA precache, 5224 KiB) + `lint:as-any` 0/0/0
- F.3: dieser HANDOFF-Eintrag
- F.4 ✅: Browser-E2E mit echten LP-Logins (`wr.test@gymhofwil.ch`) auf `origin/preview` durchgeführt. **Pfade 1-7 alle ✅ funktional verifiziert**, 6 Bugs während E2E entdeckt + Hotfixes #1-6 commited:

**Bundle-3-E2E-Hotfixes (Phase F.4 entdeckt):**
- `f08eb87` hotfix#1: Auto-Save-Trigger-deps inkomplett — `aktuelleFrage`-Memo deckte nur typ-spezifische Felder ab (für Validator gedacht), Metadaten (thema/fach/punkte/...) fehlten in deps. Fix: separate `frageFuerAutoSave`-Memo mit allen relevanten State-Feldern.
- `4eb7125` hotfix#2: editFrage-vs-liveFrage Mismatch für „Neue Frage". Editor schrieb unter `frage.id || 'preview'`-Fallback (globales Sammelbecken), Hook subscribed auf `editFrage?.id` (= null bei neu). Fix: stable `editorFrageId` per `useState(() => frage?.id ?? 'neu-' + crypto.randomUUID())` + neuer `liveFrage`-State in FragenBrowser (statt editFrage als Hook-Input). Damit funktionieren Status-Indikator + Schliessen-Modal-Logik auch für neue Fragen.
- `06884df` hotfix#3: Verwerfen-Button rief `finalisiere` (Server-Sync) statt soft-delete. Plan F.4#6: „Verwerfen → Frage in Papierkorb". Fix: `schliessenModalVerwerfen` ruft `apiService.loescheFrage` für Variante `'unvollstaendig'`, Variante `'sync-pending'` bleibt close-only.
- `06884df` hotfix#3 (zusammen): `parseFrage` (Apps-Script Z. 2843) las die in P-A.2 ergänzten Spalten `status`/`geloescht_am` NIE → Frontend bekam `frage.status: undefined` → DraftsSection-Filter `f.status === 'draft'` immer leer. Fix: status fällt auf `'sammlung'` für Legacy-Daten ohne Spalte.
- `0042b5f` hotfix#4: Backend-Bug-4 nur halb gefixt — FragenBrowser nutzt `ladeFragenbankSummary` (FrageSummary-Type), `frageZuSummary_` (Z. 4954) hatte `status` weggelassen. Fix: status-Field auch in Summary-Projektion.
- `f65856b` hotfix#5: Race-Condition Verwerfen-vs-AutoSave. Pending 10s-Server-Sync-Timer feuerte nach `loescheFrage` und überschrieb `geloescht_am=''` (un-delete-race). Fix: neue `cancelPending(frageId)`-API in draftSync, FragenBrowser canceled Timer VOR und NACH `loescheFrage`.
- `45c3ff0` hotfix#6: PapierkorbView Listen-Eintrag zeigte das `thema` nicht (weisser Text auf weisser Karte im Dark-Mode). Fix: explizite `text-gray-900 dark:text-slate-100` + `dark:bg-slate-800 dark:border-slate-700`.

**E2E-Bilanz Pfade 1-10:**
| # | Pfad | Status |
|---|---|---|
| 1 | Editor-Mount + kein Tippen + Schliessen | ✅ silent close |
| 2 | Tippen → 1s → IDB | ✅ `draft:neu-<uuid>` im IDB |
| 3 | 10s → Server-Sync | ✅ Frage in Sammlung als status='draft' |
| 4 | Pflichtfeld leer → status 'entwurf' | ✅ amber Badge + Pflichtfeld-Liste |
| 5 | Schliessen unvollständig → Modal | ✅ „Frage ist unvollständig" |
| 6 | Verwerfen → Papierkorb | ✅ (nach hotfix#5+#3) — Thema-Display nach hotfix#6 |
| 7 | Wiederherstellen → Drafts | ✅ |
| 8 | Network-5xx-Retry → server-down | ⏭️ deferred, vitest B.2 Cases 5+7 covered |
| 9 | BroadcastChannel Multi-Tab | ⏭️ deferred, vitest B.2 Case 8 covered |
| 10 | Logout-IDB-Cleanup (Privacy) | ⏭️ deferred, vitest B.5 + authStore.test.ts covered |

Pfade 8-10 sind durch Phase-B-Vitest-Mocks abgedeckt (5xx-retry, 401-eskalation, 429-rate-limit, BroadcastChannel-stub, IDB-clear-S149-pattern). Manuelle Browser-Verifikation deferred — kann post-merge auf production nachgeholt werden falls UX-Probleme auftauchen.

**Apps-Script-Deploys während F.4 (User hat 4× neu deployed):**
1. Initial Bundle-3-Backend (HEAD `5e17663` mit Sheet-Guard-Merge)
2. hotfix#3 (`06884df` parseFrage status-read)
3. hotfix#4 (`0042b5f` frageZuSummary_ status-read)
4. (kein weiterer Apps-Script-Deploy für hotfix#5/#6 — die sind Frontend-only)

- F.5 ✅: Merge `7c411e0` auf main. Branch lokal + remote gelöscht. 5 Memory-Lehren in `~/.claude/projects/.../memory/`-Tree erstellt + in MEMORY.md-Index registriert.

**Lehren (für `code-quality.md`/Memory am Bundle-Ende):**
- **jsdom 29 unterstützt BroadcastChannel nicht nativ** → `globalThis.BroadcastChannel`-Stub-Pattern für Tests
- **`postJson<T>(...)` returnt Wrapper-Object, nicht innere data** (Memory S130 wieder bestätigt) — `unwrap`-Helper-Pattern für API-Module mit vielen Endpoints
- **`as unknown as <Type> /* Defensive: ... */`** wieder relevant: Storage→Core Layer-Boundary bei `validierePflichtfelder` (Frage-Tags-Type unterscheidet sich) — Bundle-L-Lehre bestätigt
- **Plan-Snippet-Naming vs Projekt-Konvention:** Plan-Code-Snippets nutzten `_speichereFrageIntern` (leading underscore), Projekt-Konvention ist trailing-underscore (`speichereFrageIntern_`). Reviewer fing den Outlier — Plan + Code beide auf trailing umgestellt (A.2-Fixup). Lehre: Plan-Snippets sind nicht authoritativ wenn sie Projekt-Style widersprechen.
- **OAuth-Scope `script.scriptapp`** muss explizit im Apps-Script-Manifest sein für `ScriptApp.newTrigger`/`getProjectTriggers`. Existing Code rief diese APIs noch nie → Scope nie nötig → A.7 wäre ohne diesen Fix beim ersten Run gescheitert (war so, A.7-Fixup).
- **API-Inversion (Slot-Pattern) statt Hook-in-Shared:** ExamLab-spezifischer Hook (`useFragenAutoSave`) kann nicht in `packages/shared/` leben (importiert ExamLab-Stores). Lösung: Shared-Editor exposed Slot-Props (`statusSlot`, `onTippe`, `onSchliessenVersuch`), Caller bringt Hook mit. Risiko-conservative weil opt-in: Unterrichtsplaner-Nutzer + Pruefungs-Editor-Nutzer + Üben-Admin-Nutzer bleiben unverändert.
- **`cacheInvalidieren_` greift via `LP_AKTIONEN`-Liste:** Schreib-Endpoints müssen in dieser Liste sein damit Frontend-Cache nach Schreib invalidiert wird. A.4 hat 2 Endpoints (`stelleWiederHer`, `hardDeleteFrage`) hinzugefügt — Implementer hat es initial vergessen, Reviewer fing's NICHT (Audit zu eng), Controller fand's via expliziten Audit-Run (`grep cacheInvalidieren\\|cacheRemove\\|invalidiereCache`). Lehre: Audit-Pattern bei neuen Schreib-Endpoints muss alle bekannten Cache-Invalidierungs-Konventionen durchgehen, nicht nur naheliegende Token.

**E2E-Lehren (Phase F.4 Hotfixes):**
- **Memo-deps müssen den Trigger-Use-Case abdecken, nicht nur den Compute-Use-Case** (hotfix#1). `aktuelleFrage`-Memo war für `validierePflichtfelder` gedacht (typ-spezifische Felder reichten). Als Auto-Save-Trigger benutzt zu werden, war eine NEUE Anforderung — Metadaten-deps fehlten. Lehre: bei opt-in-Slot-Patterns die Slot-Trigger-deps explizit prüfen, nicht annehmen dass existing Memo passt.
- **Stable IDs für „Neue Entitäten" generieren** (hotfix#2). buildFragePreview's `s.id ?? 'preview'`-Fallback war ein globales Sammelbecken — alle „+ Neue Frage"-Editoren würden unter `draft:preview` schreiben + sich gegenseitig überschreiben. Lehre: bei lokalem State der mit Backend-IDs gepaart wird, IMMER stable Local-UUID generieren wenn Backend-ID fehlt (`useState(() => crypto.randomUUID())`).
- **Backend-Field-Reads sind separate Pflicht zu Backend-Field-Writes** (hotfix#3+#4). Plan A.2 patched `speichereFrageIntern_` (Write-Path) für `status`/`geloescht_am`-Spalten. Aber `parseFrage` (Read-Path) UND `frageZuSummary_` (Summary-Read-Path) wurden vergessen. Frontend bekam felder die gar nie da waren. Lehre: bei Schema-Erweiterung IMMER alle Read-Pfade durchsuchen, nicht nur den initialen Schreib-Pfad. Audit-Skript: `grep -n 'function parse\\|function .*Summary' apps-script-code.js`.
- **Server-Sync-Timer und destruktive Aktionen brauchen Cancellation-API** (hotfix#5). Verwerfen → loescheFrage gefolgt von pending 10s-Server-Sync, der die Soft-Delete wieder un-deleted. Lehre: bei async-cleanup-Flows IMMER pending Timers VOR der destruktiven Aktion canceln + nochmal NACH dem await (für Timers die während des Roundtrips scheduled wurden).
- **Tailwind dark-mode opt-in: bg-Klassen ohne dark:-Variante = kaputt im Dark-Mode** (hotfix#6). PapierkorbView nutzte `bg-white` ohne `dark:bg-slate-*` → unsichtbarer Text in Dark-Mode. Lehre: existing UI-Konventions (z.B. Dialog-Komponenten in `packages/shared/`) als Style-Referenz nehmen, nicht ad-hoc-Karten ohne Dark-Mode-Test.

**Apps-Script-Deploy Status:** ✅ Deployed (HEAD `45c3ff0` Frontend, Apps-Script bei `0042b5f` Stand — alle 4 Apps-Script-Deploys von User durchgeführt während F.4-E2E). Bei Merge nach main wird das vorhandene Backend-Deploy weiterverwendet (Bundle 3 nur Frontend-Änderungen ab `45c3ff0` — keine weiteren Apps-Script-Änderungen seit `0042b5f`).

---

### Bundle 2 — Editor-Komfort ✅ MERGED (04.05.2026)

3 UX-Features als Bundle, alle additiv (kein Breaking Change, keine Daten-Migration).

1. **Bug 2 — Lernziel-Auto-Reset bei Fachwechsel** (`fcb5ed9` + `e478559`):
   - LernzielWaehler bekommt `zeigeResetHinweis?: number` Prop (Counter) — bei Increment 5s Auto-Hide-Banner mit Amber-Theme.
   - SharedFragenEditor wrapt `setFachbereich` als useCallback: bei Fach-Wechsel → 3 Resets (`setLernzielIds([])`, `setLernziele([])`, `setResetBanner(c => c+1)`).
   - useEffect-deps für Lernziele-Load auf `[fachbereich]` — Reload nach `setLernziele([])` greift jetzt (Early-Return-Guard `lernziele.length > 0` wird durch leere Liste übersprungen).
   - MetadataSection plumbt Banner-Counter durch (`zeigeLernzielResetHinweis` extern, `zeigeResetHinweis` intern).

2. **Bug 3 — Themen-Autocomplete** (`1dba0d0` + `6a2b378`):
   - Neuer Hook `useThemenVorschlaege(fachbereich)` in `ExamLab/src/hooks/` (3 Tests, dedupe + sort `localeCompare('de')`).
   - EditorServices erweitert um `ladeThemen?: (fachbereich) => string[]` (synchron, analog zu `ladeLernziele`).
   - SharedFragenEditor ruft `services.ladeThemen?.(fachbereich)` mit aktuellem State (reagiert auf Fachwechsel im Editor), reicht `themenVorschlaege` an MetadataSection.
   - MetadataSection rendert HTML5 `<datalist>` mit `list=`-Attribut conditional (Browser-native Autocomplete).
   - PruefungFragenEditor implementiert `ladeThemen` als useCallback über `useFragenbankStore.summaries` (Hook-Rules-konform: Closure mit dynamic-Param statt Hook-in-Callback).

3. **Bug 6 — Zonennamen-Feld für DnD-Bild + Bildbeschriftung** (`ae1a9d6` + `e1e6ec2` + `eadf477` + `c549d5b`/`017346b` + `da08ddb`):
   - Type-Erweiterung: `DragDropBildZielzone.label?: string` + `BildbeschriftungLabel.label?: string` (HotspotBereich.label bleibt unverändert — schon required).
   - LP-Editor (DragDropBildEditor + BildbeschriftungEditor): Zonennamen-Input pro Zone, leer→undefined-Mapping.
   - Korrektur-Vollansicht: Zone-Header zeigt `label` mit Fallback `Zone N` / `Label N` (existing-Pattern 1:1 gespiegelt).
   - Apps-Script `LOESUNGS_FELDER_` erweitert: `label` für `zielzonen` + `beschriftungen` gestripped, Hotspot bleibt sichtbar (Aufgabenstellung).
   - GAS-Test-Shim `testBundle2Privacy_` deckt 3 Cases (DnD-Strip, Bildbeschriftung-Strip, Hotspot-Erhalt).

**Verifikation:** tsc -b clean (ExamLab + shared --force baseline), 1135/1139 vitest (+3 neue: `useThemenVorschlaege` 3 cases), build clean, `lint:as-any` 0/0/0. Browser-E2E auf staging mit echten Logins (LP `wr.test@gymhofwil.ch`).

**Apps-Script-Deploy:** durchgeführt (testBundle2Privacy 3✓ im GAS-Editor, neue Bereitstellung deployed).

**Lehren (für `code-quality.md` bei Gelegenheit):**
- **Hooks in useCallback nicht erlaubt** (T3.2): `useThemenVorschlaege`-Hook (Test-isoliert, gut für direkte UI-Verwendung) konnte im PruefungFragenEditor nicht in `services.ladeThemen` aufgerufen werden — React-Hook-Rules. Pragmatischer Pfad: Closure mit gleicher Logik + `useFragenbankStore.summaries` als Hook-Top-Level. Hook bleibt im Code als referenzierbare Filter-Logik.
- **EditorServices-Pattern für Cross-Package-Datenfluss** (T3.2): `packages/shared/`-Editor darf nicht von `ExamLab/src/store/...` importieren (Layering). Pattern: Service-Funktion (`ladeThemen`) als optional Prop in `EditorServices` deklarieren, Implementation im ExamLab-Caller, Aufruf im shared-Editor. Analog zu `ladeLernziele` von Bundle vor 2026.
- **Plan-Audit-Lücke: `<LernzielWaehler>` ist NICHT direkt in SharedFragenEditor** (T4.2): Komponente wird über MetadataSection gerendert. Plan-rev2 hatte das nicht erkannt → Implementer musste 2 Files committen (mit minimal Prop-Plumbing in MetadataSection). Lehre: bei Plan-Erstellung tatsächlichen Render-Pfad audit'en, nicht aus Datei-Namen erraten.
- **Lernziel-Reload-Early-Return-Guard** (T4.2): useEffect mit `if (lernziele.length > 0) return` und `[]` deps blockiert Reload bei Fachwechsel — selbst wenn deps auf `[fachbereich]` ergänzt werden. Lösung: Liste explizit leeren im setFachbereich-Wrapper, sodass der Guard durchläuft. Memory S134-Pattern (functional updater + State-Reset-Kette).

---

### Fragetyp- und Suche-Bugs ✅ MERGED (04.05.2026)

5 Bugfixes aus User-Bug-Report-Bundle. Atomare Commits pro Bug auf `fix/fragetyp-und-suche-bugs`, dann gemerged auf `main`. Apps-Script-Backend unverändert.

1. **Bug 9 — Buchungssatz `toFixed`-Crash** (`01f620e`): `z.korrekt.betrag.toFixed(2)` in `BuchungssatzFrage:354` ungeschützt; ebenso `konto.saldo.betrag.toFixed(2)` (TKontoFrage:731) und `status.betrag.toFixed(2)` (TKontoFrage `EintragBadge`, 3 Stellen). Defensive Guards `Number(... ?? 0).toFixed(2)`. Erwarteter-Saldo-Block in T-Konto rendert nun conditional (`{konto.saldo && (...)}`).
2. **Bug 4 — Globale Suche öffnet Frage nicht** (`27d1c93` + `2054ee5`): Zwei zusammenwirkende Probleme. (a) `FragenBrowser` useEffect deps `[ladeStatus]` mit eslint-disable „Nur beim ersten Laden" — bei URL-Wechsel nach Mount kein Re-Trigger. Fix: deps auf `[ladeStatus, initialEditFrageId]` + Idempotenz-Guard. (b) Globale Suche navigiert auf `?frage=<id>` (Query-Param), `LPStartseite` las nur Path-Param via `useParams` → `urlFrageId` immer undefined. Fix: `useSearchParams` ergänzt, `queryFrageId` in Fallback-Kette.
3. **Bug 7 — Doppelter „Antwort prüfen"-Button** (`e4c3c40`): TKonto, Buchungssatz, Kontenbestimmung hatten lokale Buttons, die `onAntwort()` aufriefen. Im Üben-Modus mappt `useFrageAdapter.onAntwort` aber auf `uebenSpeichereZwischenstandById` — der lokale Button war funktionaler NoOp (Zwischenstand wird ohnehin bei jeder Eingabe-Änderung über `aktualisiere()` geschrieben). Lokale Buttons + tote `antwortPruefen()`-Funktionen entfernt.
4. **Bug 8a — Konto-Dropdown verdeckt + zu schmal** (`6baf9fc` + `2054ee5`): `overflow-hidden` auf Tabellen-Containern (KontenbestimmungFrage:105, TKontoFrage:253) clippte das `KontenSelect`-Voll-Autocomplete-Dropdown. Buchungssatz war nicht betroffen (keine custom-Dropdowns). overflow-hidden entfernt; Dropdown `<ul>` zusätzlich `min-w-[320px]` damit Konto-Code + Name + Kategorie-Badge in schmalen Tabellen-Spalten lesbar.
5. **Bug 8b — „Nicht authentifiziert" nach langem Tab** (`c0cce0a`): Backend-Apps-Script lehnt FiBu-Antwort-Prüf-Request ab (`Z. 8849: lernplattformValidiereToken_`). Reload heilt es → state-Bug (Token im uebenAuthStore-Memory wird nach langer Inaktivität stale). Root-Cause-Hypothese: Backend-Cache-TTL oder Session-Lock durch parallelen Login. Pragmatischer Fix in `pruefeAntwortJetzt`: bei Auth-Fehler einmaliger Auto-Retry mit `sessionWiederherstellen` (lädt Token aus localStorage + revalidiert). Falls Refresh kein Token liefert → klarer Hinweis „Sitzung abgelaufen — bitte neu anmelden". Defensive Fix; Root-Cause nicht final geklärt.

**Verifikation:** tsc -b clean, 1132/1132 vitest (5 neue Tests: 1× BuchungssatzFrage, 2× TKontoFrage, 2× uebungsStorePruefen), build clean, `lint:as-any` 0/0/0. Browser-E2E auf staging mit echten Logins — Bugs 4/7/8a/9 user-bestätigt nach 1× Hotfix-Round (Bug 4 + 8a-Verfeinerung). Bug 8b nicht direkt reproduzierbar, defensiver Auto-Retry-Pfad ohne Side-Effects.

**Lehren (für `code-quality.md`):**
- `useEffect` mit `eslint-disable-next-line react-hooks/exhaustive-deps`-Comment „Nur beim ersten Laden" ist ein **Code-Smell**: bei jedem Prop-Wechsel-Trigger-Bug. Wenn das Verhalten wirklich „nur Mount" ist, gehört es in einen Mount-Only-Pattern (`useRef`-Guard) statt deps-truncate. S129-Pattern ähnlich.
- URL-Routing-Lücken: `useParams` liest Path-Params, `useSearchParams` Query-Params. Bei Suche/Deep-Link-Mechanismen prüfen, OB die navigierende Seite ALLE benötigten URL-Bestandteile liest. Hier: globale Suche navigierte auf `?frage=<id>`, Empfänger las nur `:frageId/`-Path.
- Lokale „Aktion"-Buttons in Frage-Komponenten, die `onAntwort()` aufrufen, sind im Üben-Modus NoOps (siehe `useFrageAdapter.onAntwort`-Mapping auf `uebenSpeichereZwischenstandById`). Im Doubt: QuizNavigation-Footer ist der einzige Antwort-prüfen-Pfad in Üben.

---

### Post-Bundle-L Spawn-Task-Cleanups ✅ MERGED (01.05.2026)

Beide Spawn-Tasks aus Bundle L.c (Lehre 2 — `as any` versteckt Mapping-Drift) abgearbeitet:

1. **`refactor/zuordnung-normalizer-cleanup`** — Merge-Commit auf `main`. `linksItems`/`rechtsItems` Dead-UI-State aus `normalisiereZuordnung` entfernt (eingeführt 19.04.2026 als spekulative Defensive für nie-realisiertes Backend-Format `{linksItems, rechtsItems}` statt `paare[]`). Alle 6 Renderer (`ZuordnungFrage.tsx`, `AbgabeZusammenfassung`, `KorrekturFrageVollansicht`, `VorschauTab`, `DruckAnsicht`, `FragenImport`) lesen ausschliesslich `frage.paare`. Nebenbei: irreführender Test "rekonstruiert paare[] aus linksItems + rechtsItems" entfernt — der Code rekonstruierte gar nichts, paare wurde lediglich auf `[]` defaulted, Test war seit jeher trivial-bestanden trotz täuschendem Namen.

2. **`refactor/build-frage-preview-field-drift`** — Merge-Commit auf `main`. `buildFragePreview` schrieb für PDF und Code Frage-Felder mit Legacy-Namen, die nur über die Defensive-Compat-Casts in `pflichtfeldValidation` durchkamen:
   - `pdf`: `pdfErlaubteWerkzeuge` → `erlaubteWerkzeuge` (canonical, fragen-core.ts:551)
   - `code`: `musterloesung` → `musterLoesung` (canonical, fragen-core.ts:662)
   - Validator (Z. 477-481, :507) liest jetzt über den primären Canonical-Pfad. Compat-Casts für Storage-Legacy bleiben.
   - **Visualisierungs-Drift** (`untertyp: 'frei'`) wurde nachgereicht in Bullet 3.

3. **`refactor/visualisierung-untertyp-drift`** — Merge-Commit `83b1634` auf `main`. **Vaporware-Type-Field-Cleanup**: `VisualisierungFrage.untertyp` (`'zeichnen' | 'diagramm-manipulieren' | 'schema-erstellen'`) komplett entfernt. Faktisch war nur `'zeichnen'` jemals implementiert; die anderen 2 Untertypen sind nie gebaut worden (durch DragDrop-Bild, Bildbeschriftung, Hotspot ohnehin abgedeckt).
   - **Pre-Refactor User-Audit** im Apps-Script: 0 Treffer für `'diagramm-manipulieren'`/`'schema-erstellen'` in 2411 Fragen (VWL+BWL+Recht).
   - **Scope (11 Files, 5 Commits):** Validator-Pflichtcheck (`pflichtfeldValidation.ts`) + obsoleten Test entfernt; Renderer-Gate (`FrageRenderer.tsx` "wird in einer späteren Phase implementiert"-Platzhalter) entfernt; `buildFragePreview` Sentinel `'frei'` entfernt + Test angepasst; Factory-Input + Body, Mock, 2 Demo-Daten-Files, Pool-Konverter — alle Writer säuberten + Type-Field aus `VisualisierungFrage` + `InlineTeilaufgabe` als atomares Bundle (TS-Field-Removal kann nicht ohne Writer-Removal isoliert tsc-clean sein).
   - **Subagent-Driven-Development** für 4 Implementer-Tasks, je 2-stufig reviewed (Spec-Compliance + Code-Quality), alle 8 Reviews ✅ Approved.
   - **Apps-Script-Backend-Writer** (4 Stellen) bewusst NICHT angefasst — harmlose Phantom-Field-Writer, Storage-rückwärts-kompatibel.
   - **macOS-Duplikate** (`* 2.ts`-Files mit alten `untertyp`-Referenzen) bleiben out-of-scope — separater Cleanup-PR. tsc ignoriert sie wegen Leerzeichen im Glob (verifiziert mit `tsc -b --force` exit 0).

**Verifikation aller drei Branches:** tsc -b clean, 1125 vitest passes (1126 vor Refactor minus den 1 entfernten obsoleten `'pflicht-leer ohne untertyp'`-Test), build clean, lint:as-any 0/0/0. Browser-E2E auf staging mit echten Logins (LP `wr.test@gymhofwil.ch` + SuS `wr.test@stud.gymhofwil.ch`):
- LP-Editor PDF-Frage: Werkzeug-Pflichtfeld-Pfad lebendig (Save-Dialog listet "Mindestens ein Werkzeug auswählen").
- LP-Editor Code-Frage: "Musterlösung oder Testfälle"-Empfohlen-Hint verschwindet beim Tippen → `musterLoesung`-Refactor wirkt End-to-End.
- SuS-Üben Zuordnungs-Frage (VWL · Arbeitslosigkeit & Armut · Filter "Paare"): Rendert links-Texte + rechts-Auswählen-Dropdowns korrekt, paare-Array intakt → `linksItems`/`rechtsItems`-Cleanup ohne Regression.
- LP-Editor Visualisierungs-Frage neu anlegen: Save-Dialog ohne 'Untertyp'-Pflichtfeld → Validator-Cleanup wirkt.
- LP-Editor bestehende Visualisierungs-Frage (Marketing-Mix-Modell): Pool-Import-Badge, Prüfungstauglich, Canvas-Konfiguration geladen ohne Crash.
- SuS-Üben Visualisierungs-Frage (BWL · Markt- und Leistungsanalyse · Filter "Zeichnen"): Canvas + Werkzeugleiste rendern, **KEIN** "wird in einer späteren Phase implementiert"-Platzhalter → Renderer-Gate-Removal wirkt.

**Lehren (für `code-quality.md` bei Gelegenheit):**

1. **Tests können trotz misnamen Beschreibungen passieren.** Der Test `'rekonstruiert paare[] aus linksItems + rechtsItems'` testete tatsächlich nur dass `Array.isArray(n.paare)` true ist (immer wahr nach Default `[]`). Bei TODO-Tests "wenn ich's später aktiviere" oder bei spekulativen Defensive-Pfaden: **Test-Name muss die Behauptung machen, die der Code tatsächlich beweist.** Beim Refactor von Dead-Code immer Tests querlesen, nicht nur grün/rot prüfen.

2. **Validator-Dual-Reads schützen — bestätigt Dead-Field-Cleanup ist sicher.** Beide PDF + Code Renames in `buildFragePreview` waren rückwärts-kompatibel, weil `pflichtfeldValidation` schon einen Defensive-Compat-Cast für die Legacy-Namen hatte. Das ist genau das Pattern, das man für sichere Field-Renames will: erst Reader auf Dual-Read umstellen, dann Writer migrieren, dann (optional) Compat entfernen wenn alle Storage-Daten migriert sind.

3. **Vaporware-Type-Union-Werte vermeiden.** `'diagramm-manipulieren' | 'schema-erstellen'` waren als Future-Plan in der Type-Union platziert, ohne dazugehörige Implementierung. Folgen über Monate: Validator wird auf Pflicht-Check getrimmt → Schreiber muss Sentinel liefern → Compat-Cast nötig → Renderer wächst Gate-Code für unimplementierte Pfade → Storage-Vertrag wird nicht eingehalten → Cleanup zieht 11 Stellen über mehrere Files. **Regel:** Type-Union-Werte für noch-nicht-implementierte Modi NICHT vorab platzieren. Solange nur 1 Modus existiert: gar kein Discriminator-Feld. Wenn ≥2 Modi geplant aber noch nicht alle gebaut: Type-Union mit nur den realisierten Werten; ergänze später im selben PR wie die Implementation. Antimuster: Type-Union-Werte als TODO-Liste im Schema statt als Backlog-Ticket. Schemas sind keine Roadmap.

4. **TS-Field-Removal in Discriminated-Union braucht atomic-bundle Commit.** Bei einem Field das in mehreren Writer-Stellen gesetzt wird UND aus dem Type entfernt werden soll: weder Writer-First (Writer schreiben dann ein Field das im Type fehlt → "missing required" excess-property) noch Type-First (Type fehlt das Field, Writer schreiben es noch → excess-property errors) kann commit-isoliert tsc-clean sein. Lösung: Konsumenten erst entkoppeln (Reader, Validator, Gates), dann Writer + Type als atomares Bundle. Plan-Reviewer fängt das auch mit, wenn man Bundling-Entscheidung explizit dokumentiert.

---

### Bundle L.c — Restliche Production + Tests + CI-Gate (Bundle L KOMPLETT) ✅ MERGED

**Merge:** `911cbea` auf `main` (01.05.2026). Branch `refactor/bundle-l-c-rest` (gelöscht). 1127/1127 vitest, tsc + build clean. Audit Total/Defensive/Undokumentiert: **0/0/0**, `--strict` EXIT 0.

**Geliefert (in 12 Tasks):**

- **L.c.0 (`bbb94fa`):** Stale-Cleanup. `packages/shared/src/types/fragen.ts` (Bundle-K-Restanz) entfernt, `*.tsbuildinfo` in `.gitignore`.
- **L.c.1 (`2b75040`+`a57017b`):** `fragetypNormalizer.ts` 6→0. Sub-Funktion-Signaturen typisiert (Klasse 1 Discriminator-Switch), `isPunktArray`-Type-Guard für Hotspot-Polygon, lokaler `ZuordnungFrageMitUi`-Helper-Type für UI-Renderer-Felder. Folge-Defensive für Legacy-`p.id` in `normalisiereZuordnung`.
- **L.c.2 (`30bf467`+`c3c9026`):** `PruefungFragenEditor.tsx` 6→0. `performance`-Cast war strukturell unnötig (FragenPerformance in `tracker.ts` und `fragen-core.ts` identisch). 5 Core/Storage-Mismatch-Stellen (poolInfoSlot + rueckSyncSlot.onErfolg) auf `as unknown as <Type> /* Defensive: */`. Reviewer-I-1: Marker-Begründung präzisiert auf reales Storage-only-Feld `poolVersion` (nicht alle aufgelisteten Felder waren Storage-only).
- **L.c.3 (`b6a1206`):** `fragenbankStore.ts` 3→0. `(f as any).fragetext` → `(f as { fragetext?: string }).fragetext` an 3 Summary-Build-Stellen.
- **L.c.4 (`5bb9e2a`):** `VorschauTab.tsx` 2→0. Discriminator-Narrowing greift im `frage.typ === 'pdf'`-Block, Cast war reine Type-Lücke.
- **L.c.5 (`d59dbd8`):** Production-1er-Sammel (HotspotEditor, DragDropBildEditor, UebungsScreen, ZeichnenCanvas, FrageRenderer) 5→0. 4× Cast-Removal, 1× Defensive-Marker (ZeichnenCanvas Union-Distribution-Limit analog Z. 352).
- **L.c.6 (`e87f709`):** `buildFragePreview.test.ts` 22→0. 19 Sub-Type-spezifische Output-Casts (`as MCFrage` etc.) + 3 degenerierte Test-Casts. Entlarvte 3 Mapping-Drifts in `buildFragePreview.ts` (Spawn-Task `fix/buildFragePreview-field-name-drift` registriert).
- **L.c.7 (`af1687a`):** `korrektur.test.ts` 15→0 + ~10 `: any`-Variable-Annotationen. Defensive-Marker für Crash-Robustheits-Tests.
- **L.c.8 (`53e614c`+`b476e3d`):** `fragetypNormalizer.test.ts` 3→0 + Production-Nachbesserung `normalisiereDragDropBild` (L.c.1-Audit-Lücke: `frage: any`-Parameter + 5 Lambda-Annotationen). Refactor auf `unknown`-Param mit Type-Guards.
- **L.c.9 (`9a7617d`):** Test-Sammel (7 Files) 9→0. Mix aus Cast-Removal, Defensive-Marker, und gezielten Helper-Type-Konkretisierungen.
- **L.c.10 (`21d7947`+`aaf95ed`+`72706ab`+`75c4caf`):** Audit-Skript erweitert (`as any` + `: any` + `= any`, mit Kommentar-Filter und String-Literal-Filter; saubere Math `Total - Defensive >= 0`). 14 weitere `any`-Verwendungen aufgedeckt + adressiert (Production: `migriereZone.ts`-Trio, `BilanzERFrage.tsx`, `SharedFragenEditor.tsx`-Lambda; Tests: 4 in `autoKorrektur.test.ts`, 3 in `SuSAppHeaderContainer.test.tsx`, 2 Setter-Types). `BilanzERFrage.tsx::Antwort = any` durch `BilanzAntwort = Extract<...>` ersetzt. **CI-Gate aktiv:** `npm run lint:as-any` script in `ExamLab/package.json`, Build-Step `Audit any Use (Bundle L Gate)` vor `Build ExamLab` in `.github/workflows/deploy.yml`.
- **L.c.11 (`3ca12e7`):** `code-quality.md` Eintrag aktualisiert auf finalen Stand (alle 3 `any`-Token, CI-Gate, Defensive-Pattern).

**Audit-Stand finale Bundle L Gesamt-Bilanz:**
| Phase | Total `any` | Defensive | Δ |
|---|---|---|---|
| Pre-Bundle-L (Baseline) | 214 | 0 | — |
| L.a Merge | 96 | 14 | -103 |
| L.b Merge | 71 | 26 | -25 |
| **L.c Final** | **0** | **0** | **-71** |

(Defensive-Counter sind nicht kumulativ — L.c hat einige der L.a/L.b-Defensive-Marker durch saubere Refactors ersetzt; final stehen alle Casts entweder als sauber-typisiert oder als Inline-Defensive-Marker auf `as unknown as <Type>`-Form, die im neuen Audit-Skript nicht als `any` zählen.)

**Lehren (für `code-quality.md`/Memory):**

1. **Audit-Skript-Pattern muss `as any`, `: any` UND `= any` erfassen.** Das alte Skript zählte nur `as any` — Variable-Annotationen und Type-Aliase blieben unsichtbar. Bundle L.c hat das beim Cleanup von `buildFragePreview.test.ts`-Casts entdeckt: Tests waren auf `as any` aufgeräumt, aber `: any`-Annotationen blieben. Erweiterung ergab 14 weitere Stellen (Production + Test).

2. **`as any` versteckt Mapping-Drift sogar BEYOND L.b-M1.** L.c.6 entlarvte: `buildFragePreview.ts` schreibt Felder mit Namen, die nicht zu den entsprechenden Frage-Sub-Types passen (`pdfErlaubteWerkzeuge` vs `erlaubteWerkzeuge`, `musterloesung` vs `musterLoesung`, `untertyp: 'frei'` außerhalb der Type-Union). Production-Code könnte Editor-Preview-Werte falsch lesen — separater Spawn-Task. Bundle-L.b-Lehre („Quell-/Ziel-Form prüfen") gilt allgemein für jeden `as any`-Cleanup.

3. **`as unknown as <ConcreteType> /* Defensive: */` zählt nicht als `any`.** Das Audit-Skript erfasst `any` als Token, nicht `unknown`. Defensive-Casts auf konkrete Sub-Types sind explizit erlaubt (sind dokumentierte Type-Bypässe für Legacy-Daten / API-Boundary-Mismatch). Audit zählt nur **undokumentierte** `any`-Nutzungen.

4. **Pragmatic Hot-Fix vs Subagent-Round-Trip:** Bei Tasks mit ≤ 3 trivialen 1-Line-Substitutionen lohnt der Subagent-Spec/Quality-Review-Cycle nicht. Master-Direct-Edit + Self-Review ist für L.c.3, L.c.4, L.c.11 ~3-5× schneller. Subagent bleibt richtig für File-übergreifende Refactors (L.c.5+L.c.10) und grosse Test-Files (L.c.6+L.c.7).

**Folge-Cleanups (alle gemergt 01.05.2026):** `linksItems/rechtsItems` Dead-UI-Cleanup, `buildFragePreview` Field-Name-Drift, `VisualisierungFrage.untertyp` Vaporware-Removal — siehe oben „Post-Bundle-L Spawn-Task-Cleanups".

---

### Bundle L.b — poolConverter (Discriminated Union + FiBu-Konverter-Bugfix) ✅ MERGED

**Merge:** `9ed67db` auf `main` (29.04.2026). Branch `refactor/bundle-l-b-pool-converter` (gelöscht). 1127/1127 vitest (+14 vs L.a 1113), tsc + build clean.

**Geliefert (Type-Cleanup):**
- `packages/shared/src/types/pool-frage.ts` (neu, ~250 Zeilen) — `PoolFrage` als Discriminated Union mit 20 Sub-Types. `explain` und `img` als gemeinsame Base-Felder. **FiBu-Sub-Types modellieren das echte Pool-Rohformat**, nicht das Storage-Format (siehe M1-Fix unten).
- `packages/shared/src/types/pool-frage.test.ts` (neu, 9 Tests inkl. Discriminator-Narrowing, exhaustive-Switch, Pool-Rohformat).
- `ExamLab/src/types/pool.ts`: Fat-Union-Interface ersetzt durch Re-Export aus `@shared/types/pool-frage`.
- `ExamLab/src/utils/poolConverter.ts`: 19 → 0 `as any`. Discriminator-Narrowing in den Switch-Bodies. `erzeugeSnapshot` mit `'X' in poolFrage`-Guards.
- `ExamLab/src/utils/poolConverter.test.ts`: 7 → 0 `as any` plus 5 neue FiBu-Mapping-Tests.
- `ExamLab/src/services/poolSync.ts`: `berechneContentHash` mit `'X' in frage`-Guards. Field-Order stabil zu Apps-Script-Backend (Reviewer-Finding C1).

**Geliefert (M1-Fix — bestehender Konverter-Bug repariert):**
Die Reviewer-Recherche in `Uebungen/Uebungspools/config/bwl_fibu.js` hat aufgedeckt, dass das echte Pool-Format strukturell vom Storage-Format abweicht (`{soll, haben, betrag}` ≠ `BuchungssatzZeile{id, sollKonto, habenKonto, betrag}`). Der alte `as any`-Cast hat das maskiert; mit der typisierten Discriminated Union wird die Diskrepanz sichtbar. User-Entscheidung: nichts Kaputtes weiterziehen → Bug im selben Bundle repariert.
- **buchungssatz**: `correct[].soll/haben/betrag` → `buchungen[].sollKonto/habenKonto/betrag` (mit generierter ID). `konten[{nr,name}]` → `kontenauswahl.konten[]` (nur `nr`).
- **tkonto**: `konten[].correctSoll/correctHaben` zu `eintraege[]` mit Seiten-Markierung gemerged. `correctSaldo` direkt übernommen. `ab` → `anfangsbestand` mit `anfangsbestandVorgegeben = ab !== undefined`. `gegenkonten[]` → `kontenauswahl.konten[]`.
- **kontenbestimmung**: `aufgaben[].correct[{konto, seite}]` → `aufgaben[].erwarteteAntworten[{kontonummer, seite}]`.
- **bilanz**: `correct.{aktiven, passiven, bilanzsumme}` → strukturierte `BilanzERLoesung.bilanz.{aktivSeite, passivSeite, bilanzsumme}` mit Default-Gruppen.

Auswirkung: `fibuAutoKorrektur.ts:70-94` und `BuchungssatzFrage.tsx` lesen `frage.buchungen[i].sollKonto` — vor Bundle L.b war das immer `undefined` für Pool-importierte Buchungssätze, was zu "Soll-Konto falsch" für jede Antwort führte. Latent-Bug seit S107, jetzt behoben.

**Audit-Stand:** 96 → 71 (-25). 26 Defensive-Marker unverändert. 45 undokumentierte verbleiben (alle in L.c-Scope).

**Strategie-Entscheidung:** (a) Discriminated Union — gewählt, weil Pool-Format seit S107 stabil + klar `type`-diskriminiert.

**Reviewer-Findings adressiert:**
- C1 (Hash-Stabilität): Field-Order in `inhalt`-Object zurück zu Apps-Script-Reihenfolge (`apps-script-code.js:195`).
- C2 (Test-Type-Error nicht von tsc -b gefangen): `BilanzERLoesung`-Shape korrigiert. Cross-Project-Verifikation via `tsc -b ../packages/shared --force` zur Routine gemacht.
- M1 (FiBu Pool-Format-Mismatch): vollständig repariert wie oben beschrieben.
- M2 (Redundanz): `explain`/`img` aus 14 Sub-Types entfernt.
- M3 (Type-Bypass in case 'gruppe'): Defensive-Marker.

**Lehren:**
1. **Discriminated Union erfordert vor-Switch-Lesepfade auf `'X' in frage`-Guards.** Generischer Field-Access (wie in `erzeugeSnapshot`/`berechneContentHash`) klappt mit Fat-Union, bricht bei Discriminated Union. Common-Felder (`explain`, `img`) ins Base; Sub-Type-spezifische Felder mit `'X' in frage` defensiv prüfen.
2. **Hash-Stabilität: `JSON.stringify` respektiert Insertion-Order.** Wenn ein Konsument (hier Apps-Script-Backend) den Hash exakt reproduzieren muss, ist die Field-Reihenfolge im Object-Literal Teil der Vertrags-Schnittstelle. Kommentar `// REIHENFOLGE STABIL — siehe <Backend>` einfügen.
3. **`as any` versteckt nicht nur Type-Lücken, sondern auch Daten-Mapping-Bugs.** Beim Pool-FiBu-Import lautete der Cast formal `(poolFrage as any).correct ?? []` und schrieb das Pool-Objekt 1:1 ins Storage-Feld — strukturell falsch, aber zur Compile-Zeit unsichtbar. Beim as-any-Cleanup IMMER prüfen: was wird auf der anderen Seite des Casts erwartet? Ist die Daten-Form identisch?
4. **`tsc -b` aus ExamLab kaschiert Cross-Project-Errors in Test-Files.** Die L.a-Lehre (Lehre 2 oben) gilt auch für L.b — beim ersten Lauf hatten wir einen TS2353 in `pool-frage.test.ts:61` (BilanzStruktur-Shape falsch), den `cd ExamLab && npx tsc -b` mit Exit 0 verschluckt hat. Erst `npx tsc -b ../packages/shared --force` zeigte ihn. Routine: vor jedem L.x-Commit beide Befehle laufen lassen.

**Offen (User-Tasks für Merge-Freigabe):**
- Browser-E2E mit echten Logins, Schwerpunkte:
  - Pool-Sync-Dialog öffnen (LP-Fragensammlung) — Hash-Stabilität: kein "Update verfügbar"-Spam für unveränderte Pool-Fragen.
  - FiBu-Pool-Frage importieren (z.B. `bwl_fibu.js:bs01` als Buchungssatz, `kb01`/`tk01`/`bi01`) und in einer Prüfung an Test-SuS schalten.
  - SuS löst FiBu-Aufgaben → Auto-Korrektur muss korrekt bewerten (war vorher "Soll-Konto falsch" für jeden korrekten Eintrag, jetzt richtig).

---

### Bundle L.a — Mock-Helper + pflichtfeldValidation-Pilot ✅ MERGED

**Branch:** `refactor/bundle-l-a-mock-helper-pflichtfeld` (29.04.2026). 1113/1113 vitest (+15 vs main 1098), tsc + build clean.

**Geliefert:**
- `packages/shared/src/test-helpers/frageCoreMocks.ts` (neu, generischer `mockCoreFrage<T>`-Helper für 20 Sub-Types)
- `packages/shared/src/test-helpers/frageCoreMocks.test.ts` (11 Tests inkl. deterministische Defaults + Array-Instanz-pro-Aufruf)
- `ExamLab/src/__tests__/helpers/frageStorageMocks.ts` (neu, Storage-Wrapper delegiert an Core)
- `ExamLab/src/__tests__/helpers/frageStorageMocks.test.ts` (4 Tests)
- `scripts/audit-as-any.sh` (neu, 1-Zeilen-Defensive-Scan, `--strict`-Mode für CI-Gate)
- `pflichtfeldValidation.ts`: 24 → 0 `as any` (19 Sub-Funktion-Signaturen typisiert von `any` → konkrete Sub-Types, Switch-Casts entfernt durch TS-Discriminator-Narrowing, 14 Defensive-Casts für Legacy-Field-Aliases aus `buildFragePreview`)
- `pflichtfeldValidation.test.ts`: 79 → 0 `as any` (Migration auf `mockCoreFrage`, 12 Defensive-Marker)

**Audit-Stand:** 199 → 96 (-103). 26 Defensive-Marker dokumentiert. 70 undokumentierte verbleiben (alle in L.b/L.c-Scope).

**Lehren:**
1. **Plan-Defaults sind grobe Skizze, nicht Source-of-Truth.** Plan hatte ~14 von 20 Sub-Type-Defaults mit falschen Feldnamen oder fehlenden Pflichtfeldern (z.B. `hotspots` statt `bereiche`, `zonen` statt `zielzonen`, `maxDauerSek` statt `maxDauerSekunden`). Implementer-Subagent korrigierte alle gegen `fragen-core.ts`. **Regel für künftige Pläne:** Bei Type-erzeugenden Helpern den Plan explizit als „Skizze" markieren und darauf hinweisen, gegen die echten Type-Defs zu verifizieren.
2. **TS2352 in `tsc -b` mit EXIT=0 möglich.** Incrementelles Build kaschiert Errors aus Cross-Project-Files (nur tsc-Output prüfen, NICHT auf Exit-Code verlassen). Subagent + Quality-Reviewer hatten den TS2352 in Helper-Cast übersehen — beim nachgelagerten direkten tsc-Check erst sichtbar. Fix: `as Extract<...>` → `as unknown as Extract<...>`.
3. **Legacy-Field-Aliases in `pflichtfeldValidation` sind genuine Defensive-Pattern.** Validator wird mit Editor-State aus `buildFragePreview.ts` aufgerufen, der heterogene Form-State-Shapes synthetisiert (z.B. `tkAufgabentext`, `pdfErlaubteWerkzeuge`). 14 Defensive-Casts dokumentieren das. Removal erfordert separaten Refactor von `buildFragePreview` (Out-of-Scope für Bundle L; Follow-up als „Bundle M / future" notiert).

**Out of Scope (für L.b/L.c oder eigenes Bundle):**
- `buildFragePreview` Output-Canonicalization (würde Defensive-Casts in pflichtfeldValidation überflüssig machen)
- 70 weitere `as any` in poolConverter, fragetypNormalizer, PruefungFragenEditor, etc.

---

### Bundle K-Followup — Storage-Sub-Type-Hygiene ✅ MERGED

**Branch:** `refactor/bundle-k-followup` (29.04.2026). 1098/1098 vitest, tsc + build clean.

**Geliefert:**
- `fragen-storage.ts`: `export type *` durch explizite Helper-Re-Export-Liste ersetzt; 20 Storage-Sub-Types (`MCFrage = WithStorageBase<Core.MCFrage>` etc.) zentral exportiert. `Frage`-Union nutzt jetzt die zentralen Aliases statt inline `WithStorageBase<...>`.
- `FrageSummary.berechtigungen` von Inline-Type-Expression (`import('./auth').Berechtigung[]`) auf Top-Level-Import umgestellt.
- `autoKorrektur.ts`, `fibuAutoKorrektur.ts`, `KorrekturFrageVollansicht.tsx`: 23 lokale `Extract<Frage, {typ:'X'}>`-Aliase entfernt — direkt aus `fragen-storage` importiert.
- `DruckAnsicht.tsx`: 16 `frage as XFrage`-Casts im Typ-Dispatcher entfernt (TS-narrowing der Storage-Frage-Union liefert die korrekten Sub-Types automatisch). Kein `alsCoreFrage<T>`-Helper nötig.

**Item 3 (leereEingabenDetektor auf core) als obsolet eingestuft:** Der Wechsel würde alle Caller (8 SuS-Komponenten) auf Core-Frage-Casts zwingen, weil Storage's `tags: (string | Tag)[]` strukturell nicht zuweisbar ist an Core's `tags: string[]`. Der Helper liest weder `tags` noch `_recht`/`poolVersion` — semantisch ist der SuS-Pfad sauber.

**Lehre für künftige Type-Migrationen:** Wenn ein Storage-Type strukturell breiter ist als der Core-Type (z.B. erweiterter Tag-Union), ist der Storage-Type NICHT zuweisbar an Core. Helper, die nur Schnittmengen-Felder lesen, bleiben deshalb sinnvollerweise auf der Storage-Variante getypt — ein Wechsel auf Core braucht entweder Pick-basierte Schmal-Types oder Generic-Constraints, was die API verkompliziert.

---

### Bundle K — Type-Konsolidierung Frage Core + Storage ✅ MERGED

**Merge:** `de01e01` auf `main` (29.04.2026). 16 Commits Feature-Arbeit auf `refactor/type-konsolidierung-frage-core-storage` (Branch gelöscht). Audit-Files (Phase 0) post-Merge entfernt.

**Geliefert:**
- `packages/shared/src/types/fragen-core.ts` (kanonische Editor-Types in shared, 699 Z.)
- `ExamLab/src/types/fragen-storage.ts` (Storage-Erweiterung mit `WithStorageBase<T>`-Helper, 108 Z.)
- `ExamLab/src/types/auth.ts` re-exportet `Berechtigung`/`RechteStufe` aus `@shared/types/auth`
- Alte `packages/shared/src/types/fragen.ts` + `ExamLab/src/types/fragen.ts` gelöscht
- index.ts re-exportet nur fragen-core (single-export wegen TS2308-Ambiguität bei Dual-Export)

**Cut-Entscheidung umgesetzt:** `berechtigungen`/`geteilt`/`autor` in core (Editor-Felder), nur `_recht`/`poolVersion` storage-only. `tags: string[]` in core, `tags: (string|Tag)[]` in storage. Strukturelles Subtyping erlaubt Storage-Frage als Editor-Input ohne Mapping; an einer Stelle (`PruefungFragenEditor.poolSyncSlot`) Cast am Callback-Boundary nötig.

**E2E-Verifikation auf staging mit echten Logins:**
- LP-Fragensammlung lädt 2363 Fragen, Tags rendern, Filter funktionieren
- MC-Editor öffnet sauber: Pflichtfeld-Outlines violett, Pool-Info-Slot, Sharing-Badge
- prev/next-Navigation synchronisiert (S129-Regel intakt)
- SuS-Üben-Modus: MC-Frage Auto-Korrektur funktioniert, Musterlösung mit C9-Phase-2-Layout
- Privacy: SuS-UI rendert keine Storage-Felder (Pool-Info, Sharing fehlen wie erwartet)

**Lehren aus der Implementation (für künftige Type-Migrationen):**
1. **Audit-Pattern muss Extension- und inline-import-Varianten erfassen** — Phase-0-Audit `from '...types/fragen'` (single-quote-Ende) hat ~95 Files mit `.ts`-Extension verpasst (`from '../types/fragen.ts'`) und alle inline `import('...types/fragen').X`-Type-Expressions. Phase 5 musste die nachziehen. Künftig: Pattern-Set mit `'`, `.ts'`, `.tsx'`, `.js'` UND `import\\(['"`]` einbeziehen.
2. **Doppel-`export *` aus zwei strukturell-identischen Files erzeugt 78× TS2308** — TS resolviert duplicate symbols nicht silent zu „identisch", sondern droppt sie. Plan-Achtung-Fallback (single-export) war richtig.
3. **`fragen-storage` re-exportet via `export type *` Core-Sub-Type-Namen mit Core-Tags** — `MCFrage` etc. aus fragen-storage sind die Core-Variante (string-tags), nicht Storage. Storage-Caller die narrow Sub-Types brauchen, müssen `Extract<Frage, {typ:'mc'}>`-Aliase oder explizite `WithStorageBase<Core.MCFrage>`-Exports nutzen. Dokumentiert in 3 Files (autoKorrektur.ts, fibuAutoKorrektur.ts, KorrekturFrageVollansicht.tsx).
4. **Storage-Felder sind nicht in shared erlaubt** — `poolVersion?: unknown` darf NICHT in fragen-core wieder eingebaut werden, auch wenn ein TS-Fehler an einem Callback-Boundary „nur ein Feld" verlangt. Lösung ist Cast am Callback-Boundary (Spec Risiko-Mitigation #3), nicht Storage-Feld-Leak in Core.

**Tech-Debt aus Code-Review:** Erledigt durch Bundle K-Followup (siehe oben) — Items 1, 2, 4 umgesetzt; Item 3 (`leereEingabenDetektor` auf core) als obsolet eingestuft.

---

## Eintrittspunkte für nächste Session

Bundle L (a/b/c) abgeschlossen, Folge-Cleanups gemergt. Mögliche nächste Themen:

### Code-Vereinfachung — Legacy-Naming-Cleanup (ALS NÄCHSTES, Spec/Plan offen)

**Ziel:** Altlasten aus dem Code entfernen, Bezeichner an aktuelle Begriffe anpassen.

**Konkret identifiziert (Audit 01.05.2026):**
- `fragenbank` (291 Treffer: 132 src + 159 apps-script + 4 Filenames) → komplett legacy, soll auf `fragensammlung` umbenannt werden. UI-Begriff ist seit S99 „Fragensammlung".
- `pool` (344 Treffer als Identifier) → gemischt: manche legacy (Pool-Import-UI im LP-Editor), manche aktiv (Übungspools im Üben-Modus). Vor Implementation **Audit nötig** welche Stellen legacy sind.
- Weitere Stellen, die der User im Kopf hat — beim Brainstorming sammeln.

**Workflow vor Implementation:**
1. `superpowers:brainstorming` — Scope klären (welche Tokens? Filenames? Apps-Script-Endpoints? Storage-Felder?)
2. `superpowers:writing-plans` — Spec + Plan, mit Reviewer-Loop
3. Dann erst Implementation

**Risiko-Hinweise für Plan:**
- Apps-Script-Endpoints und Storage-Feldnamen sind Backend-Vertrag — Rename erfordert dual-Read-Phase oder Migration (analog Bundle K + L.b-Lehre „Schemas sind keine Roadmap")
- 159 Stellen in `apps-script-code.js` bedeutet Apps-Script-Deploy + Daten-Migration im Sheet ggf. nötig
- Storage-Schlüssel (z.B. `examlab-fragenbank-cache` IDB-Database-Name) sind sticky — Rename = neue DB, alte muss migriert oder gedroppt werden

**Hinweis:** Eine vorherige Session referenzierte Commits `868e01c`/`04a8648`/`758b192` als bereits-committed Spec+Plan. Diese existieren weder in `.git/objects/` noch in irgendeinem Branch (lokal oder remote) und auch nicht im Reflog. Spec+Plan müssen neu erstellt werden.

### Media-Phase-3-5 Dual-Write (groß, ~3-4 Sessions)
`MediaQuelle`-Type ist in shared definiert, aber Apps-Script kennt ihn nicht. Echte Migration: Backend liest+schreibt beide Formate (`bildUrl`/`pdfBase64` UND `MediaQuelle`), Frontend-Migrator existiert (`mediaQuelleMigrator.ts`). Apps-Script-Deploy nötig. Phase 6 (alte Felder weg, Daten-Migration) als separates Bundle danach.

---

## Aktiv offen

### Kleine Follow-Ups (nicht blockierend)

~~**G.d.1 Final-Review Follow-Ups** (aus S152)~~ — alle 3 Items im Restposten-Bundle 01.05.2026 erledigt (`preWarmKorrektur(pruefungId, email, signal?, sessionToken?)`-Signatur, Network-Error-Test, `setKorrekturStatus`-Cache-Doku-Kommentar in `apps-script-code.js`).

~~**autoSave-IDB-Race Restbestände** (S150-Sweep)~~ — beide Stellen im Restposten-Bundle 01.05.2026 erledigt (`cleanupNachAbgabe` als `async`, `App.tsx::durchfuehrungId`-Wechsel mit `await clearIndexedDB`/`await clearQueue`).

~~**FrageBase-Divergenz** (S159 Spawn-Task M2)~~ → durch Bundle K aufgelöst.

### Future Bundles (geplant)

- **Media-Phase-3-5 Dual-Write Migration** — `MediaQuelle`-Type ist in shared definiert (`packages/shared/src/types/mediaQuelle.ts`), aber Apps-Script kennt ihn nicht. Echte Migration ist eigenes Bundle in Bundle-J-Grösse: Backend liest+schreibt beide Formate (`bildUrl`/`pdfBase64` UND `MediaQuelle`), Frontend-Migrator ist bereits da (`mediaQuelleMigrator.ts`). ~3-4 Sessions, Apps-Script-Deploy nötig. Phase 6 (alte Felder weg, Daten-Migration) als separates Bundle danach.
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

## Letzter Stand auf main

### Bundle J — DnD-Bild Multi-Zone-Datenmodell (S160 + S161)

**Merges:** `eae1cec` (Migration) + `000de2e` (Cleanup) + S161 Apps-Script-Cleanup-Deploy.

- DragDrop-Bild-Datenmodell auf Multi-Zone (`korrekteLabels: string[]` pro Zone) und Multi-Label-Akzeptanz (Synonym-Listen).
- Pool-Tokens als `DragDropBildLabel{id, text}` mit Stack-Counter für Duplikate. Deterministische `stabilId(frageId, text, index)` Cross-Env-Hashes (TS+ESM-Mirror).
- Generic `felder`-Patch am `batchUpdateFragenMigrationEndpoint` (Erweiterung des C9-Endpoints) — nutzbar für künftige Migrationen.
- 28/28 dragdrop_bild-Fragen migriert (5 BWL + 10 Recht + 12 VWL + 1 Demo `einr-dd-kontinente`).
- **Apps-Script 3× deployed:** Phase 4 (LOESUNGS_FELDER + Privacy-Test), Phase 9.0 (generic `felder`-Patch), S161-Cleanup (`pruefeAntwortServer_` Multi-Label-Match).
- **Browser-E2E (S161):** LP+SuS mit echten Logins, Security-Check, kritische Pfade, verwandte Fragetypen, Mobile/iPad Stack-Mechanik geprüft.
- **Lückentext Phase 8 E2E (S161):** Browser-Test mit echten Logins (LP-Pfade Editor + Bulk-Toggle, SuS-Pfade Freitext + Dropdown, Security-Invarianten Network-Tab) abgeschlossen.
- **Tests:** 1098 vitest passes, tsc/build clean.
- **Cleanup auf main** (vorgezogen statt 12.05.): `korrektesLabel?:` aus `DragDropBildZielzone` weg in 3 Type-Files, Dual-Read-Pfade entfernt, `zoneKorrektBelegt`-Helper raus, Demo-Frage `einr-dd-kontinente` aufs neue Format. Scheduled-Task `bundle-j-cleanup-check` deaktiviert.

**Memory-Detail:** `project_s158_bundle_j_specplan.md` (Spec+Plan) · `project_s159_bundle_j_phase_1_8.md` (Phase 1-8) · `project_s160_bundle_j_komplett.md` (Migration+Cleanup) · `project_s161_bundle_j_lueckentext_e2e.md` (E2E+Deploy)

---

## Bundle J Browser-E2E Test-Plan (Referenz für DnD-Bild-Regressionen)

In S161 abgeschlossen — Test-Plan-Details bleiben als Referenz für künftige DnD-Bild-Regressionen.

<details>
<summary>Test-Plan-Details (Referenz)</summary>

### Setup
- Tab-Gruppe mit LP (`wr.test@gymhofwil.ch`) + SuS (`wr.test@stud.gymhofwil.ch`).
- Test-Prüfung: Einrichtungsprüfung mit DnD-Bild-Frage `einr-dd-kontinente`.
- Stichprobe-Migration via `node upload.mjs --ids=<5-10 IDs>` vor dem E2E.

### Zu testende Änderungen

| # | Änderung | Erwartetes Verhalten | Regressions-Risiko |
|---|----------|---------------------|-------------------|
| 1 | LP-Editor Multi-Zone-Frage | Bilanz-Schema mit 2× `Aktiva`-Zonen + 2 `Aktiva`-Pool-Tokens speicherbar | Editor crasht bei alten Fragen |
| 2 | LP-Editor Multi-Label | Zone akzeptiert `['Marketing-Mix', '4P']` | Chip-Input verliert Daten |
| 3 | SuS-Stack-Counter | Pool zeigt `Aktiva ×2`, Counter dekrementiert beim Drop | Stack verschwindet falsch |
| 4 | SuS-Korrektur Multi-Zone | 2 `Aktiva`-Tokens in 2 `Aktiva`-Zonen → beide korrekt | Eine Zone fälschlich falsch |
| 5 | Bestand-Frage (vor Mig) | Frage öffnen + lösen wie vorher (Demo-Frage `einr-dd-kontinente`) | Antwort orphaned |
| 6 | Bestand-Frage (nach Mig) | Frage öffnen + lösen wie vorher (1:1-Mapping) | Antwort orphaned |

### Security-Check

- SuS-API-Response: keine `korrekteLabels`, kein `korrektesLabel`.
- SuS-API-Response: `labels` hat `id+text` (IDs sind base32-Hashes).
- LP-API-Response: `korrekteLabels` vollständig (LP-Editor / Korrektur).

### Kritische Pfade (regression-prevention.md §1.3)

- SuS lädt Üben-Modus mit DnD-Frage.
- LP Korrektur-Vollansicht für DnD-Frage.
- LP Druck-Ansicht (`/lp/druck`).
- SuS-Heartbeat speichert `zuordnungen`.
- SuS-Abgabe persistiert.

### Regressions-Tests (verwandte Fragetypen)

- Hotspot, Bildbeschriftung.
- Sortierung, Zuordnung.
- FiBu-Tabellen-Eingabe (Buchungssatz, T-Konto, Bilanz/ER).

### Mobile / iPad-Test (Stack-Touch-Mechanik)

- Tap-to-Select auf Stack `Soll ×3`.
- Tap auf Zone → Counter dekrementiert.
- Bei Counter = 0: Stack verschwindet aus Pool.
- Tap auf platzierten Token → entfernt, Counter +1.
- Touch-Targets ≥ 44×44px.
- `touchAction: 'none'` auf interaktiven Elementen.

</details>

---

## Historie

| Session | Datum | Inhalt | Memory |
|---|---|---|---|
| S161 | ~Apr/Mai 26 | Bundle J Browser-E2E + Lückentext Phase 8 E2E + Apps-Script-Cleanup-Deploy | `project_s161_bundle_j_lueckentext_e2e.md` |
| S160 | 28.04.26 | Bundle J KOMPLETT auf main + Cleanup vorgezogen | `project_s160_bundle_j_komplett.md` |
| S159 | 28.04.26 | Bundle J Phase 1-8 auf Branch | `project_s159_bundle_j_phase_1_8.md` |
| S158 | 28.04.26 | Bundle J Spec + Plan | `project_s158_bundle_j_specplan.md` |
| S157 | 28.04.26 | Bundle H Editor-UX-Feinschliff (Violett-Pflichtfeld + 4 Vereinfachungen + SuS-Tastatur) | `project_s157_bundle_h_phasen_0_4.md` |
| S156 | 28.04.26 | Bundle H Spec + Plan | `project_s156_bundle_h_plan.md` |
| S155 | 27.04.26 | Bundle G.f.2 (Skeleton-Pattern für DurchfuehrenDashboard + FragenBrowser) | `project_s155_bundle_g_f_2.md` |
| S154 | 27.04.26 | Bundle G.e (Fragensammlung-Virtualisierung) + G.f (LP-Startseite Skeleton) | `project_s154_bundle_g_e_f.md` |
| S153 | 27.04.26 | Bundle G.d.2 (IDB-Cache Klassenlisten + Gruppen) | `project_s153_bundle_g_d_2.md` |
| S152 | 27.04.26 | Bundle G.d.1 (4 Hebel: Lobby-Polling, schalteFrei Pre-Warm, Korrektur-Cache, SuS-Warteraum) | `project_s152_bundle_g_d_1.md` · `..._plan.md` |
| S151 | 27.04.26 | Bundle G.d/e/f Specs (4 Specs reviewer-approved) | `project_s151_bundle_g_specs.md` |
| S150 | 27.04.26 | autoSave-IDB-Race-Fix (Folge-Hotfix S149) | `project_s150_autosave_idb_race.md` |
| S149 | 27.04.26 | Bundle G.c (LP-Login Pre-Fetch + Logout-Cleanup, IDB-Race-Hotfix) | `project_s149_bundle_gc.md` |
| S148 | 26.04.26 | Bundle G.b (Editor-Nachbar + Anhang-PDF-Prefetch, frontend-only) | `project_s148_bundle_gb.md` |
| S147 | 26.04.26 | Bundle G.a (Server-Cache-Pre-Warming, 4 Trigger) | `project_s147_bundle_ga.md` |
| S146 | 26.04.26 | Bundle E (Übungsstart-Latenz N=10 cold 4'322ms→1'036ms) + Repo-Cleanup | `project_s146_bundle_e.md` |
| S145 | 24.04.26 | Auth-Session-Restore-Fix (Standalone-Üben-Refresh) | `project_s145_auth_fix.md` |
| S144 | 24.04.26 | Lückentext Phase 7 Migration (253/253 Fragen) | `project_s144_lueckentext_phase7.md` |
| S142 | 24.04.26 | Bildeditor-Bundle + Lückentext-Modus Phase 1-6 | `project_s142_bildeditor_lueckentext.md` · `..._lueckentext_modus.md` |
| S141 | 24.04.26 | Altlasten-Bundle (Audio raus aus Einführung, AdminFragenbank weg, useResizableHandle) | `project_s141_altlasten_bundle.md` |
| S140 | 24.04.26 | Bundle F1 (Probleme-Dashboard) + F2 (Bugfix-Bundle, Audio-Fragetyp deaktiviert) | inline MEMORY.md |
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
| 12.04. | 91–92 | Code-Vereinfachung (Adapter-Hook Refactoring), Save-Resilienz |
| 13.04. | 93–97 | Browser-Test Bugfixes, FiBu-Fixes, Bild-Upload, Deep Links + React Router |
| 13.04. | 98–104 | UX-Bundles 1–8 (Quick Wins, Favoriten-Redesign, Übungs-Themen, Layout-Umbau, Bildfragen-Editor, Design-System, UX-Harmonisierung) |
| 14.04. | 105–107 | C11+C9+Wording, E1 FiBu-Fix + Feedback-System, Rename Pruefung→ExamLab + Kontenrahmen 2850 |
| 14.–22.04. | 108–136 | C9 Phase 1–4 Migration (2412 Fragen), KI-Kalibrierung, Detaillierte Lösungen |

---

## Architektur (etabliert in S66–S92, weiterhin gültig)

- **Adapter-Hook Pattern:** `useFrageAdapter(frageId)` abstrahiert Prüfungs-/Übungs-Store
- **Fragetypen-Registry:** `shared/fragetypenRegistry.ts` (EINE Kopie, nicht zwei)
- **Shared UI:** `ui/BaseDialog.tsx`, `ui/Button.tsx`
- **Antwort-Normalizer:** `utils/normalizeAntwort.ts`
- **FrageModeContext:** `context/FrageModeContext.tsx`
- **SuS-Navigation:** Kein Start-Screen, direkt Üben-Tab. Tabs „Üben"/„Prüfen" in Kopfzeile.
- **kursId-Format:** `{gefaess}-{fach}-{klassen}` wenn `gefaess≠fach`, sonst `{gefaess}-{klassen}` (ohne Schuljahr)
- **Shared-Editoren:** `packages/shared/src/editor/` auf **Repo-Root**, nicht in ExamLab. Vite-Alias `@shared` mappt von ExamLab via `../packages/shared/src` (S156-Lehre).

## Security (alle erledigt ✅)

- Rollen-Bypass → `restoreSession()` validiert E-Mail-Domain
- Timer-Manipulation → Server-seitige Validierung
- Rate Limiting → 4 SuS-Endpoints (10–15/min)
- Cross-Exam Token Reuse → verhindert
- Prompt Injection → Inputs in `<user_data>` gewrappt
- Session-Lock → Neuer Login invalidiert alten Token
- IDB-Privacy nach Logout → `tx.oncomplete`-await vor Hard-Nav (S149-Lehre)
