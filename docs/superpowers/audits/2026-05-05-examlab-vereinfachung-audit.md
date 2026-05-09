# ExamLab Vereinfachungs-Audit (2026-05-05)

> Read-only Audit zur Faktenbasis vor Cleanup-Bundles. Spec: [`docs/superpowers/specs/2026-05-05-examlab-vereinfachung-audit-design.md`](../specs/2026-05-05-examlab-vereinfachung-audit-design.md).
> Tooling: [`scripts/audit-tokens.sh`](../../../scripts/audit-tokens.sh) (reproduzierbar).

## Zusammenfassung

- **Begriffs-Legacy ist überschaubar.** `fragenbank` (152 Treffer) ist klarer Rename-Kandidat → `fragensammlung`. `pool` (373 Treffer) ist gemischt, aber legitime Pool-Konzepte bleiben — nur Fachbereich-Ordner `lp/fragenbank/PoolBadges` etc. brauchen Klarstellung der Bedeutung.
- **`action`/`aktion`-Mix ist die teuerste Inkonsistenz.** API-Vertrag mischt englisches `action` (HTTP-Body-Property) mit deutschem `aktion` (interne Variablen, `LP_AKTIONEN`-Konstante). Innerhalb `apps-script-code.js` mehrfach in einer einzigen Funktion sichtbar. Empfehlung: nur Bezeichner vereinheitlichen, der API-Wire-Wert bleibt.
- **`musterlosung`/`musterloesung`/`musterLoesung` — drei Schreibweisen für ein Konzept**, alle in `packages/shared/src/types/fragen-core.ts`. Apps-Script-Sheet-Spalte heisst `musterlosung` (ohne `e`). Field-Drift mit Backend-Vertrag.
- **Code-vs-UI-Umlauts sind eine etablierte Konvention**: Identifier ohne Umlaut (`pruefung`, `schueler`, `uebung`), UI-Strings + Comments mit Umlaut (`Prüfung`, `Schüler`, `Üben`). Audit findet **keine Verstösse** gegen diese Konvention.
- **Pattern-Divergenz konzentriert sich auf 4 Bereiche**: API-Wrapper (5 Varianten), Store-Action-Naming (English vs. Deutsch in einer Datei), Error-Handling (alert/setError/silent — inkonsistent), Test-Locations (3 parallele Verzeichnisse). Cache-Strategien dagegen homogen (S149-Pattern dokumentiert + verbreitet).
- **17 Files >500 Z., davon 5 mit niedrigem Risiko split-bar**, 6 mit mittlerem Risiko (Hook-Extraktion nötig). Kein einzelnes File ist „untouchable" — aber `LPStartseite`, `PDFSeite`, `Dashboard` brauchen vorab State-Untersuchung.
- **112 Apps-Script-Endpoints + 40 `lernplattform*`-Prefix** = 152 Total. Dispatcher-Pattern ist konsistent (zentrales `LP_AKTIONEN`-Guard), redundante Per-Endpoint-Auth-Checks könnten zurückgebaut werden.
- **Geschätzter Roadmap-Aufwand**: 4–6 Cleanup-Bundles (M, N, O, P, Q, optional R) à 1–3 Sessions, total ~8–14 Sessions. Reihenfolge: erst Begriffe, dann Pattern-Vereinheitlichung, dann Datei-Splits, parallel Field-Drift in eigenem Bundle.
- **Kritischste Risiken**: Bundle für `musterlosung`-Vereinheitlichung berührt Apps-Script-Storage-Vertrag (Daten-Migration nötig). Datei-Splits von `LPStartseite`/`PDFSeite` brauchen Test-Coverage-Audit zuerst.

---

## A1 — Begriffs-Inventar

> Quelle: [`scripts/audit-tokens.sh`](../../../scripts/audit-tokens.sh) (case-sensitive, word-boundary).

### A1.1 Haupt-Tokens

| Token | src prod | src test | shared prod | shared test | apps-script | Total | UI-Begriff | Klassifikation | Empfehlung |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| `fragenbank` | 10 | 11 | 0 | 0 | 76 | **97** | Fragensammlung | **legacy** | Rename → `fragensammlung` |
| `Fragenbank` | 21 | 5 | 0 | 0 | 23 | **49** | Fragensammlung | **legacy** | Rename → `Fragensammlung` |
| `FRAGENBANK` | 0 | 0 | 0 | 0 | 6 | **6** | — | **legacy** (Apps-Script-Konstante `FRAGENBANK_ID`) | Rename → `FRAGENSAMMLUNG_ID` (Storage-ID-Wert bleibt) |
| `pool` | 53 | 29 | 25 | 1 | 11 | **119** | Pool/Übungspool | **gemischt** | Disambiguieren — siehe unten |
| `Pool` | 149 | 28 | 46 | 4 | 25 | **252** | Pool/Übungspool | **gemischt** | Disambiguieren |
| `POOL` | 1 | 0 | 0 | 0 | 1 | **2** | — | **aktiv** (`POOL_META`, `POOL_BASE_URL` Pool-Config-Globale) | belassen |
| `pruefung` | 308 | 68 | 0 | 0 | 11 | **387** | Prüfen/Prüfung | **aktiv** (Identifier-Kontext) | belassen — Code-Konvention ohne Umlaut |
| `Prüfung` | 190 | 4 | 3 | 0 | 57 | **254** | Prüfung | **aktiv** (UI-Strings, Comments) | belassen |
| `Pruefung` | 19 | 4 | 2 | 0 | 10 | **35** | — | **aktiv** (PascalCase: `PruefungsConfig`, `PruefungFragenEditor`) | belassen |
| `uebung`/`ueben` | 474 | 136 | 0 | 0 | 9 | **619** | Üben/Übung | **aktiv** (Identifier) | belassen |
| `übung` (lowercase) | 13 | 0 | 0 | 0 | 0 | **13** | Übung | **aktiv** (Comments only) | belassen |
| `schueler` | 228 | 1 | 0 | 0 | 7 | **236** | SuS/Schüler | **aktiv** (Identifier) | belassen — Code-Konvention |
| `Schüler` | 16 | 7 | 0 | 0 | 7 | **30** | Schüler | **aktiv** (UI-Strings) | belassen |
| `sus` | 158 | 90 | 0 | 0 | 13 | **261** | SuS | **aktiv** (URL-Pfad-Token) | belassen |
| `SuS` | 303 | 49 | 36 | 0 | 81 | **469** | SuS | **aktiv** (Display, Konstanten) | belassen |
| `lehrer` | 0 | 1 | 0 | 0 | 0 | **1** | LP/Lehrperson | — | belassen (Test-Datei einziger Treffer) |
| `aktion` | 30 | 5 | 26 | 0 | 49 | **110** | — | **gemischt** | Vereinheitlichen — siehe A1.3 |
| `action` | 80 | 7 | 0 | 0 | 22 | **109** | — | **gemischt** | Vereinheitlichen — siehe A1.3 |
| `frage` / `Frage` | 2289 | 498 | 373 | 44 | 549 | **3753** | Frage | **aktiv** | belassen |
| `question` | 1 | 0 | 0 | 0 | 0 | **1** | Frage | **legacy/Versehen** | Rename → `frage` (1 Stelle) |
| `korrekt` / `Korrekt` | 586 | 235 | 131 | 24 | 89 | **1065** | Korrektur/korrekt | **aktiv** | belassen |
| `loesung` | 72 | 120 | 19 | 0 | 16 | **227** | Lösung | **aktiv** (Identifier) | belassen — Code-Konvention |
| `musterloesung` | 4 | 37 | 23 | 3 | 7 | **74** | Musterlösung | **aktiv** | siehe A4.2 — Drift mit `musterlosung`/`musterLoesung` |
| `Lösung` (Umlaut) | 15 | 2 | 2 | 1 | 7 | **27** | Lösung | **aktiv** (UI/Comments) | belassen |
| `bewertungsraster` | 66 | 66 | 38 | 8 | 22 | **200** | Bewertungsraster | **aktiv** | belassen |

**Konkrete Rename-Kandidaten (A1.1):**

1. **`fragenbank` → `fragensammlung`** (alle Schreibweisen, ~152 Treffer src+shared, ~105 Apps-Script):
   - 3 Service/Store-Files: `fragenbankApi.ts`, `fragenbankCache.ts`, `fragenbankStore.ts` → Datei-Rename
   - 1 Komponentenordner: `ExamLab/src/components/lp/fragenbank/` → Datei-Rename
   - Apps-Script-Konstante `FRAGENBANK_ID` (Storage-ID-Value bleibt unverändert, nur Konstanten-Name)
   - Apps-Script-Variable `var fragenbank = SpreadsheetApp.openById(...)` → `var fragensammlung = ...`
   - Tests: 16 Test-Files referenzieren `fragenbank/`-Pfade → mit-renamen
   - Cache-Keys (IDB-DB-Name `examlab-fragenbank-cache`): **STORAGE-MIGRATION** falls Schlüssel umbenannt — entweder Migration schreiben oder Schlüssel aus Pragmatismus belassen

2. **`question` → `frage`** (1 Stelle, trivial)

### A1.2 Umlaut-Varianten

**Konvention:** Identifier ohne Umlaut (`pruefung`, `schueler`, `uebung`, `loesung`), UI-Strings + Comments mit Umlaut (`Prüfung`, `Schüler`, `Übung`, `Lösung`).

**Befund:** Audit findet **keine Verstösse** gegen diese Konvention. Stichproben:

| Token | Identifier-Kontext (no-umlaut) | UI/Comment-Kontext (umlaut) | Konvention eingehalten? |
|---|---|---|---|
| `pruefung` / `Prüfung` | `PruefungsConfig`, `pruefung-state`, `pruefung-backup` (IDB DB) | `'Prüfung laden'`, `// Prüfung beendet` | ✅ |
| `schueler` / `Schüler` | `interface Schueler`, `schueler: SchuelerStatus[]` | `<th>Schüler</th>`, `// Schüler-ID-Eingabe` | ✅ |
| `uebung` / `Übung` | `useUebenStore`, `uebungsStore.ts` | `'Übung durchführen'` (Tab-Label) | ✅ |
| `loesung` / `Lösung` | `musterloesung`, `loesungStore` | `'Korrekte Lösung mit Rechenweg'` | ✅ |

**Empfehlung:** Konvention dokumentieren in `.claude/rules/code-quality.md` (z.B. „Identifier ohne Umlaut, UI-Strings mit Umlaut"). Kein Bundle-Bedarf.

### A1.3 Englisch/Deutsch-Mix

**Befund:** Mehrere konkrete Mix-Stellen, dominante davon ist `action`/`aktion`.

#### A1.3.1 `action` vs. `aktion` (HTTP-API-Vertrag)

| Stelle | Variante | Kontext |
|---|---|---|
| `ExamLab/src/services/*.ts` (12+ Files) | `payload = { action: 'speichereFrage', ... }` | Englisches Property im POST-Body |
| `ExamLab/apps-script-code.js:1037` | `const action = e.parameter.action` | Englisches Property beim Lesen |
| `ExamLab/apps-script-code.js:218,265,360` | `function rateLimitCheck_(aktion, email, ...)` | Deutsche Variable in interner Helper-Funktion |
| `ExamLab/apps-script-code.js:1149` | `var LP_AKTIONEN = [...]` | Deutsche Konstante, deutscher Plural |
| `ExamLab/apps-script-code.js:1167` | `var SUS_AKTIONEN = [...]` | dito |
| `ExamLab/apps-script-code.js:1176` | `var SCHREIBENDE_AKTIONEN = LP_AKTIONEN.concat([...])` | dito |
| `ExamLab/src/services/fragenbankApi.ts:76` | `aktion: string` | Frontend-Type-Field heisst aktion |

**Wirkung:** Liest man `apps-script-code.js`, sieht man in der gleichen Funktion `body.action` und `LP_AKTIONEN.indexOf(action)`. Das ist verwirrend, aber **stabil** — der Wire-Wert ist `action`, der englische Property-Name ist API-Vertrag.

**Empfehlung:**
- **Wire-Wert (HTTP-Body) bleibt `action`** — Apps-Script-Vertrag, Migration zu deutsch wäre Breaking-Change.
- Interne Apps-Script-Variable von `aktion` → `action` umbenennen (49 Stellen, mechanisch).
- `LP_AKTIONEN`/`SUS_AKTIONEN`/`SCHREIBENDE_AKTIONEN` → `LP_ACTIONS`/`SUS_ACTIONS`/`SCHREIBENDE_ACTIONS`. Oder umgekehrt vereinheitlichen auf deutsch und nur `body.action` als API-Vertrag belassen.
- **Pragmatic-Vorschlag**: Apps-Script-intern auf `action` (englisch) → ist konsistent mit `body.action` und Frontend-Service-Naming. ~84 Treffer mechanisch.

#### A1.3.2 Andere Englisch/Deutsch-Mixes

| Stelle | Englisch | Deutsch | Empfehlung |
|---|---|---|---|
| Sheet-Spalten | `id`, `typ`, `category`, `comment`, `status`, `frageTyp`, `feedbackId`, `appVersion`, `kiOutputJson`, `inputJson`, `diffScore`, `qualifiziert`, `wichtig` | `fachbereich`, `pruefungId`, `frageId`, `zeitstempel`, `ort`, `erledigt`, `aktion`, `lpEmail`, `rolle` | belassen — Backend-Vertrag |
| Button-Labels | (selten English im UI) | dominant deutsch | belassen |
| `submit` vs. `senden` | gemischt im Code | belassen — Industrie-Standard |
| `id`, `data`, `error` | universal | universal | belassen |

**Empfehlung:** Sheet-Spalten-Naming nicht anfassen (Storage-Vertrag). Button-Label-Konsistenz im Frontend ist okay (deutsch).

---

## A2 — Pattern-Divergenz

> Manuell auditiert via Subagent, 10 Patterns + 1 Bonus.

### A2.1 API-Wrapper-Pattern

**Befund:** Service-Module unwrappen die Apps-Script-Response inkonsistent. Es existieren parallel ein dedizierter `unwrap()`-Helper UND inline Null-Check-Patterns.

| Stelle | Variante | Auffälligkeit | Empfehlung |
|---|---|---|---|
| `kalibrierungApi.ts:55-70` | `unwrap<T>()` Helper (defensive) | Returnt `null` wenn `success`, `data` oder Response-Struktur fehlt; keine Exception | **Preferred** für Read-only-Bulk-Operationen |
| `draftApi.ts:16-24` | `unwrap<T>()` Helper (strict) | Wirft Error wenn Response falsy oder `success===false`; Action-Kontext in Message | **Preferred** für LP-Writes (Bundle-3-Pattern) |
| `fragenbankApi.ts:6-34` | Inline `data?.configs ?? []` | Manueller Null-Coalescing mit Defaults; kein Throw | Acceptable für Read-only-Listen |
| `poolApi.ts:6-12` | Direkter `postJson<T>` Cast, kein unwrap | Verlässt sich auf TS-Hint; Response-Shape leakt zu Caller | Inkonsistent — vereinheitlichen |
| `poolApi.ts:45-62` | Manueller try/catch + JSON-parse | Verbose, fängt Network-Errors lokal | OK für komplexen Fallback (fetch vs. postJson) |

**Empfehlung:** Strict-`unwrap<T>(response, action)` für alle LP-Write-APIs (kalibrierungApi/draftApi-Pattern). Silent-null-Return für Read-only-Bulk-Ops.

### A2.2 Cache-Strategien

**Befund:** IDB-Cache-Clearing-Pfade sind weitgehend homogen — S149-Pattern (`tx.oncomplete`-await) ist verbreitet dokumentiert.

| Stelle | Variante | Bewertung |
|---|---|---|
| `autoSave.ts:71-82` | `tx.oncomplete` + Promise-wrap | ✅ Korrekt |
| `draftCache.ts:21-45` | Sequential `del()` mit await; finaler aggregate-tx | ✅ Korrekt |
| `fragenbankCache.ts:105-124` | `tx.oncomplete` + Promise-wrap | ✅ Korrekt, dokumentiert S149 |
| `autoSave.ts:100-110` | Aggregate-tx-clear mit `tx.oncomplete` | ✅ Korrekt |

**Empfehlung:** Kein Bundle-Bedarf. Konvention ist etabliert. Optional: `retryQueue`-Cleanup verifizieren (separater Spawn-Task).

### A2.3 Store-Konventionen (Zustand)

**Befund:** Action-Naming ist inkonsistent — Mix aus englischem `set*/toggle/reset` und deutschem `setze*/zuruecksetzen`.

| Store | Variante | Empfehlung |
|---|---|---|
| `authStore.ts` | Mix: `logout()` + `zuruecksetzen()` | Auf eine Konvention, z.B. `resetAuthState()` |
| `draftStore.ts` | Konsistent deutsch: `registriere()`, `setzeDirty()`, `setzeStatus()` | Acceptable, sauberer Stil |
| `pruefungStore.ts` | Mix: `setAntwort()`, `toggleMarkierung()`, `navigiere()`, `zuruecksetzen()` | `zuruecksetzen()` → `reset()` |
| `lpUIStore.ts` | Mix: `setModus()`, `setListenTab()`, `toggleHilfe()`, `zurueck()` | Vereinheitlichen |

**Empfehlung:** Eine Konvention pro Store (English `set/toggle/reset` ODER deutsche Verben). **Bundle-Vorschlag**: Pragmatic auf English `set*/toggle*/reset` vereinheitlichen — passt zum Zustand-Ecosystem.

### A2.4 Hook-Konventionen

**Befund:** Cleanup-Patterns mehrheitlich korrekt; Dependency-Disziplin variiert. Keine systematischen Verstösse erkennbar.

**Empfehlung:** ESLint-`exhaustive-deps`-Regel aktivieren falls noch nicht aktiv. Kein eigenes Bundle nötig.

### A2.5 Komponenten-Struktur

**Befund:** Top-Level-Verzeichnisse (`lp/`, `sus/`, `ueben/`, `fragetypen/`, `settings/`, `shared/`) sind sauber getrennt, keine Cross-Boundary-Imports gefunden. PascalCase-Filenames durchgehend konsistent.

**Empfehlung:** **Kein Divergenz-Befund.**

### A2.6 Fragetyp-Adapter

**Befund:** Registry-getrieben (`FRAGETYP_KOMPONENTEN`-Record in `fragetypenRegistry.ts:28-47`). 18 Typen sauber gemappt. Validation hat parallelen Switch (Z. 38-71 in `pflichtfeldValidation.ts`) — getrennte Concern, akzeptabel.

**Empfehlung:** **Kein Divergenz-Befund.** Registry beibehalten.

### A2.7 Validation/Pflichtfeld

**Befund:** Komplett zentralisiert in `packages/shared/src/editor/pflichtfeldValidation.ts`. Keine parallelen Validierungen.

**Empfehlung:** **Kein Divergenz-Befund.**

### A2.8 Apps-Script-Dispatcher

**Befund:** Zentrales `LP_AKTIONEN`-Guard (Z. 1144-1176) plus redundante Per-Endpoint-`istZugelasseneLP()`-Checks (Z. 1284, 1332, 1477, …). Belt-and-suspenders, aber redundant.

**Empfehlung:** Per-Endpoint-Checks zurückbauen falls zentrales Guard statisch gegen alle `LP_AKTIONEN`-Einträge verifiziert ist. **Risiko mittel** — Security-Audit nötig vor Rückbau.

### A2.9 Error-Handling

**Befund:** Inkonsistente Error-Surface-Patterns. Mischung aus `alert()`, `setError`-State und silent `console.error`.

| Stelle | Variante | Empfehlung |
|---|---|---|
| `BeispieleListe.tsx`, `MitgliederTab.tsx` | `alert('Speichern fehlgeschlagen')` | Toast oder inline `setError` |
| `LueckentextBulkToggle.tsx` | `setError(e.message)` + inline-render | **Preferred** |
| `PapierkorbView.tsx` | `window.alert('Fehler beim Wiederherstellen: …')` | Acceptable für destruktive Ops |
| `ErrorBoundary.tsx`, `Layout.tsx` | `console.error()` + Fallback-UI | Acceptable (Boundary-Rolle) |
| `LoginScreen.tsx`, `SuSStartseite.tsx` | nur `console.error()` | **Problem** — User sieht nichts |

**Empfehlung:** Inline `setError` + Toast-Notification als Standard. `alert()` nur für destruktive Ops. Niemals silent-fail.

### A2.10 Test-Patterns

**Befund:** Tests in **drei Verzeichnissen** mit überlappenden Zwecken:

| Verzeichnis | Anzahl | Typ | Empfehlung |
|---|---:|---|---|
| `src/__tests__/` | 20 | Legacy Unit/Integration-Mix | **Konsolidieren** — entweder colocated oder nach `tests/` |
| `src/tests/` | 92 | Modern Integration/Service | **Behalten** — Integration-Hub |
| `src/components/__tests__/` | (Sub-Dir) | Component-spezifisch | **Mergen** in colocated `*.test.tsx` |
| Colocated `*.test.tsx` | 154 | Unit-Tests neben Code | **Behalten** — Standard |

**Empfehlung:** `__tests__/` retiren. Colocated Unit-Tests + `src/tests/` Integration-Hub. Test-Layer-Strategie in CONTRIBUTING dokumentieren.

### A2.11 (Bonus) Mock-Helpers

**Befund:** Doppelte Helper-Trees:
- `packages/shared/src/test-helpers/frageCoreMocks.ts` (Bundle L.a, Core-Type-Mocks)
- `ExamLab/src/__tests__/helpers/frageStorageMocks.ts` (Bundle L.a, Storage-Type-Mocks)

Zwei klare Layers — **kein Divergenz-Befund**, sauber getrennt.

---

## A3 — Datei-Hotspots (Files >500 Z.)

> 17 Files auditiert via Subagent. Reihenfolge nach Splitt-Risiko (niedrig → hoch).

### Niedrig-Risiko-Splits (5 Files)

| File | Z. | Empfehlung |
|---|---:|---|
| `KorrekturFrageVollansicht.tsx` | 846 | Sub-Renderer pro Fragetyp (Basic/Financial/Media) in `KorrekturFrageAnzeigen.tsx` extrahieren. Stateless. → ~400 Z. main |
| `DruckAnsicht.tsx` | 810 | `DruckFragenRender.tsx` (15 Type-Cases) + `<DruckAbschnitt>` extrahieren. → ~350 Z. |
| `poolConverter.ts` | 744 | `fachMapping.ts` + `punkte.ts` + `questionConverters/` (10 Module). → ~350 Z. |
| `VorschauTab.tsx` | 643 | `<VorschauSummary>`, `<VorschauAbschnitt>`, `<VorschauFrage>` extrahieren. → ~350 Z. |
| `fibuAutoKorrektur.ts` | 600 | `buchungssatzKorrektur.ts` + `tkontoKorrektur.ts` + `scoringUtils.ts`. → ~150 Z. Facade |
| `EinstellungenPanel.tsx` | 607 | **Kein Split** — bereits sauber als Tab-Dispatcher. |

### Mittel-Risiko-Splits (Hook-Extraktion nötig, 6 Files)

| File | Z. | Empfehlung |
|---|---:|---|
| `LPStartseite.tsx` | 1058 | `useConfigFiltering()`, `useEinrichtungSync()`, `<DashboardContentLayout>`. **Risiko**: tiefe Filter-State-Abhängigkeiten. |
| `Dashboard.tsx` (Üben) | 930 | `useLernpfadData()`, `useThemenKomputationen()`, `<FachSektion>`. **Risiko**: 5 useEffect mit Inter-Deps + preWarm-Trigger. |
| `FragenBrowser.tsx` | 768 | `useFragenFilterEngine()`, `useFragenEditorSync()`. **Risiko**: AutoSave + draft-sync-Coupling. |
| `ZeichnenCanvas.tsx` | 804 | `useTextOverlay()`, `useCanvasSetup()`. **Risiko**: Canvas-RAF-Loop + iOS-Focus-Handling. |
| `DurchfuehrenDashboard.tsx` | 677 | `useMonitoringData()`. **Risiko**: Phase-State synchron mit URL halten. |
| `TKontoFrage.tsx` | 763 | `<KontoEingabeForm>` + `tkontoUtils.ts`. **Risiko**: Saldo-Decimal-Präzision. |

### Hoch-Risiko / Untouchable (3 Files)

| File | Z. | Empfehlung |
|---|---:|---|
| `PDFSeite.tsx` | 950 | **Vor Split: Coordinate-System-Audit** (relX/relY, cssX/cssY, zoom). Text-Overlay-iOS-Focus mit rAF. → erst State-Untersuchung in eigener Session, dann Plan. |
| `useDrawingEngine.ts` | 752 | Reducer-Logic ist pure und konzentriert; `render()`/`exportierePNG()` zu `drawCommandRender.ts`. Reducer in Hook lassen. |
| `uebungsStore.ts` | 684 | `LoesungsMerger` zu `loesung/merger.ts`. Store-Core in Place lassen. |

### Spezialfälle

| File | Z. | Empfehlung |
|---|---:|---|
| `HilfeSeite.tsx` | 906 | Already clean Dispatcher. **Lazy-load** Sub-Komponenten via `React.lazy()`. |
| `ConfigTab.tsx` | 747 | Form-Sections als Sub-Components extrahieren. → ~450 Z. |

**Total Refactor-Yield (geschätzt):** 3'000–4'500 Zeilen extrahierter Module aus ~12'500 Z. Hotspot-Code.

---

## A4 — Apps-Script-Schema-Drift

### A4.1 Endpoint-Inventar

**Total:** 152 dispatcher-Cases (112 Top-Level + 40 `lernplattform*`-Prefix).

**Kategorie-Übersicht:**

| Kategorie | Anzahl | Beispiele | IDOR-Schutz |
|---|---:|---|---|
| **Lade-Endpoints** | ~25 | `ladePruefung`, `ladeFragenbank`, `ladeKorrektur`, `monitoring` | LP-Guard via `LP_AKTIONEN` |
| **CRUD Frage** | 8 | `speichereFrage`, `loescheFrage`, `dupliziereFrage`, `stelleWiederHer`, `hardDeleteFrage`, `listePapierkorb`, `ladeFrageDetail` | Owner-Check (Bundle 3) |
| **CRUD Pruefung** | 6 | `ladePruefung`, `duplizierePruefung`, `loeschePruefung`, `beendePruefung`, `resetPruefung`, `setzeBerechtigungen` | LP-Guard |
| **Korrektur** | 8 | `starteKorrektur`, `ladeKorrektur*`, `korrekturFortschritt`, `korrekturFreigeben`, `speichereKorrekturZeile` | LP-Guard |
| **Migration/Batch** | 6 | `holeAlleFragenFuerMigration`, `batchUpdateFragenMigration`, `batchUpdateLueckentextMigration`, `bulkSetzeLueckentextModus`, `migriereFachbereich` | Admin-only |
| **Pool-Import** | 4 | `importierePoolFragen`, `loescheAllePoolFragen`, `schreibePoolAenderung`, `batchImportFragen` | LP-Guard |
| **Lernziele** | 6 | `importiereLernziele`, `importiereLehrplanziele`, `ladeLernziele`, `speichereLernziel`, `aktualisiereLernziel`, `loescheLernziel` | LP-Guard |
| **Lernplattform** (Übungspool-Backend) | 40 | `lernplattformLogin`, `lernplattformLadeFragen`, `lernplattformPruefeAntwort`, … | Token-basiert (eigenes Auth-System) |
| **Klassenlisten/Synergy** | 8 | `ladeKlassenlisten`, `ladeKurse`, `ladeKursDetails`, `ladeSchuljahr`, `ladeLehrplan`, `ladeStammdaten`, `setzeTeilnehmer`, `sendeEinladungen` | LP-Guard + Synergy-Auth |
| **SuS-Aktionen** | 4 | `speichereAntworten`, `heartbeat`, `validiereSchuelercode`, `ladeAktivePruefungenFuerSuS` | Session-Token |
| **KI/AI** | 6 | `kiAssistent`, `kalibrierungsEinstellungen`, `kalibrierungsStatistik`, KI-Feedback-CRUD | LP-Guard |
| **Misc** | 21 | `monitoring`, `sebAusnahmeErlauben`, `entsperreSuS`, `setzeKontrollStufe`, `sendeNachricht`, `uploadAnhang`, `uploadMaterial`, `ladeDriveFile`, `ladeNachrichten`, … | LP-Guard / Custom |

**Befund:** Endpoint-Inventar ist gross aber strukturiert. Naming-Konsistenz: 95%+ camelCase-deutsch (`ladeXxx`, `speichereXxx`, `loescheXxx`, `aktualisiereXxx`). Ausnahmen: `monitoring` (englisch, 1 Wort), `heartbeat` (englisch, technical term), `holeAlleFragenFuerMigration` (deutsche Verb-Form).

**Empfehlung:** Endpoint-Naming akzeptieren, kein Rename-Bundle nötig. Optional: Endpoint-Inventar als `docs/api-inventory.md` festhalten + bei jedem neuen Endpoint pflegen (Doku-Aufgabe).

### A4.2 Field-Drift

**Befund:** Konkrete Drift-Stellen zwischen Frontend-Type und Apps-Script-Sheet-Spalte.

| Konzept | Apps-Script Sheet-Spalte | Frontend-Type Schreibweisen | Status |
|---|---|---|---|
| **Musterlösung (text)** | `musterlosung` (Z. 2188, 2864, 3835, 4451, 5604, 9381) | `musterlosung: string` (fragen-core.ts:42, :400) | ✅ konsistent (no `e`) |
| **Musterlösung (Bild)** | (kein Sheet-Spalten-Match — JSON-Field) | `musterloesungBild?: string` (fragen-core.ts:176, :455) | ⚠️ Anderes Konzept, anderes Naming-Schema (`musterloesung` MIT `e`) |
| **Musterlösung (PDF-Annot)** | (JSON-Field) | `musterloesungAnnotationen?: PDFAnnotation[]` (fragen-core.ts:549) | ⚠️ wieder anderes Naming |
| **Musterlösung (Code-Frage)** | (JSON-Field, in CodeFrage type-spezifisch) | `musterLoesung?: string` (fragen-core.ts:440, :663) | ⚠️ PascalCase, anderes Schema |
| **Bewertungsraster** | `bewertungsraster` | `bewertungsraster: Bewertungskriterium[]` | ✅ konsistent |
| **PDF-Werkzeuge** | (JSON-Field `erlaubteWerkzeuge`) | `erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]` | ✅ konsistent |
| **Punkte** | `punkte` | `punkte: number` | ✅ konsistent |
| **Fachbereich** | `fachbereich` | `fachbereich: Fachbereich` (Type) | ✅ konsistent |
| **Tags** | `tags` (JSON-Array) | `tags: (string \| Tag)[]` (Storage), `tags: string[]` (Core) | ✅ Storage erweitert, dokumentiert |
| **Status (Bundle 3)** | `status` | `status?: 'draft' \| 'sammlung'` | ✅ Bundle-3-Schema |
| **Geloescht_am (Bundle 3)** | `geloescht_am` | `geloescht_am?: string` | ✅ |

**Hauptbefund:** Konzeptuelle Drift nur bei `musterlösung`-Familie (3 unterschiedliche Schreibweisen). Alle anderen Felder sind konsistent.

**Konkrete Bug-Risiken durch Drift (ähnlich Bundle L.b poolConverter-Lehre):**
- Wenn jemand `frage.musterloesung` schreibt (mit `e`), liest aber `frage.musterlosung` (ohne `e`), bleibt Backend-Vertrag verletzt → Daten gehen verloren oder doppelt geschrieben.
- **`as any`-Versteck**: TS würde es zwar fangen, aber bei `as any`-Casts (z.B. in Migrations- oder Konverter-Code) wäre der Drift unsichtbar.

**Empfehlung:**
- **Audit auf Lese-Stellen** der drei Schreibweisen — sicherstellen dass jede konsistent ist.
- **Sprachregelung**: `musterlosung` ist der Apps-Script-Backend-Vertrag (historisch ohne `e`, vermutlich Tippfehler-zur-Konvention-erstarrt). Nicht ändern.
- **Frontend-Layer**: Entweder alle drei auf `musterlosung` (ohne `e`) zusammenführen oder zumindest dokumentieren warum `Bild`/`Annotationen`/`Code` davon abweichen.
- **Bundle-Vorschlag**: Eigenes Bundle (Bundle P unten) zur `musterlosung`-Konsolidierung — Risiko hoch, weil Backend-Vertrag berührt wird.

---

## Sprach-Strategie (User-Entscheidung 05.05.2026)

**Entscheidung:** **Option A — Hybrid-Konvention beibehalten, nur Inkonsistenzen aufräumen.** Volle Migration zu English (B) oder Deutsch (C) wurde verworfen.

**Begründung:** Codebase folgt bereits einer 90%-sauberen Hybrid-Konvention (siehe Tabelle unten). Der Mehrwert vollständiger Migration (geschätzt 20+ Sessions, Daten-Migrations-Risiko) steht in keinem Verhältnis zum Aufwand.

| Bereich | Sprache | Beispiele | Begründung |
|---------|---------|-----------|------------|
| **Domain-Entitäten** | Deutsch | `Frage`, `Pruefung`, `Schueler`, `Lehrer`, `Korrektur`, `Lernziel`, `Fachbereich`, `Bewertungsraster`, `Musterloesung`, `Aufgabengruppe`, `Lückentext` | Bildungs-Domain ist deutsch, keine sauberen englischen Übersetzungen |
| **UI-Strings + Comments** | Deutsch (mit Umlaut) | „Prüfung laden", „Schüler", „Lösung" | Lehrer-User, deutsche Schule |
| **Identifier-Form von Domain-Wörtern** | Deutsch ohne Umlaut | `pruefung`, `schueler`, `loesung`, `musterloesung` | Cross-Tool-Portabilität (Filenames, IDB-Keys, URLs) |
| **Technische Primitives** | Englisch | `id`, `data`, `error`, `success`, `dispatch`, `subscribe`, `cache`, `reset`, `clear` | Programming-Universalsprache |
| **Programming-Konvention-Präfixe** | Englisch | `set*`, `get*`, `toggle*`, `use*`, `on*`, `handle*` | React/Zustand-Ecosystem |
| **HTTP-API-Vertrag** | Englisch | `action`, `body`, `payload`, `params` | HTTP-Standard |
| **Sheet-Spalten** | Mix (Backend-Vertrag) | `id`/`typ`/`status` vs. `fachbereich`/`pruefungId`/`zeitstempel` | Storage-Vertrag, sticky |

**Auswirkung auf Roadmap:** Bundles N (action/aktion), O (Store-Naming) und R (Error-Handling) bleiben sinnvoll, weil sie die Hybrid-Konvention durchsetzen — nicht ändern. Neu hinzu kommt **Bundle V (Sprach-Konvention dokumentieren)** als Annex zu Bundle N: schreibt die obige Tabelle in `.claude/rules/code-quality.md`, damit künftige Sessions nicht erneut driften.

**Künftige Re-Evaluation:** Bei der **Backend-Migration weg von Apps-Script** (HANDOFF: „Backend-Migration weg von Apps-Script — langfristig, strategisch") ist der natürliche Re-Entry-Point für vollständige Vereinheitlichung — dann wäre der Daten-Migrations-Aufwand sowieso anstehend, und Sheet-Spalten + Endpoint-Naming könnten in einem Schritt mit-vereinheitlicht werden.

---

## Cleanup-Roadmap

### Vorgeschlagene Bundles

#### Bundle M — Fragenbank → Fragensammlung (Mechanischer Rename)

**Scope:** A1.1 Hauptbefund — `fragenbank`-Family komplett auf `fragensammlung` umbenennen.

- 3 Service/Store-Files rename: `fragenbankApi.ts` → `fragensammlungApi.ts`, etc.
- 1 Komponentenordner: `lp/fragenbank/` → `lp/fragensammlung/`
- ~152 Frontend-Treffer src+shared (mechanisch via grep+rename + Suche-und-Ersetze in Imports)
- ~105 Apps-Script-Treffer (`FRAGENBANK_ID` → `FRAGENSAMMLUNG_ID`, `var fragenbank` → `var fragensammlung`)
- 16 Test-Files mit-renamen
- IDB-DB-Name `examlab-fragenbank-cache` als pragmatische Ausnahme belassen (oder Migration mit-bauen)

**Aufwand:** **S** (1 Session) — TDD-typischer Rename-Workflow + Branch-Test + Apps-Script-Deploy.

**Risiko:** **mech-rename** — niedrig, falls IDB-Storage-Key-Migration sauber gelöst.

**Abhängigkeiten:** keine (frühest priorisierbar).

**Test-Plan:** Vitest 1234 + tsc + build clean; LP-Browser-E2E (Fragensammlung lädt + speichert) + IDB-Inspector vorher/nachher.

---

#### Bundle N — `action`/`aktion` Apps-Script-Vereinheitlichung

**Scope:** A1.3.1 — Apps-Script-interne deutsche `aktion`-Bezeichner auf englisches `action` migrieren (Wire-Wert bleibt).

- ~84 Treffer in `apps-script-code.js` (variable, parameter, Konstanten)
- `LP_AKTIONEN` → `LP_ACTIONS`, `SUS_AKTIONEN` → `SUS_ACTIONS`, `SCHREIBENDE_AKTIONEN` → `SCHREIBENDE_ACTIONS`
- `function rateLimitCheck_(aktion, ...)` → `(action, ...)`
- Frontend-Type-Field `aktion: string` (in `fragenbankApi.ts:76`) angleichen
- Sheet-Spalte `aktion` (in `feedback`-Sheet) **bleibt** (Storage-Vertrag)

**Aufwand:** **S** (1 Session) — mechanisch.

**Risiko:** **mech-rename** — niedrig.

**Abhängigkeiten:** keine.

**Test-Plan:** Apps-Script `clasp push` + alle GAS-Tests; Frontend Vitest; Browser-E2E auf jeder Endpoint-Kategorie (Lade, Schreiben, KI, Migration).

---

#### Bundle O — Store-Action-Naming-Vereinheitlichung

**Scope:** A2.3 — Mix `setze*/zuruecksetzen` vs. `set*/reset` vereinheitlichen.

- 4 Stores betroffen: `authStore`, `pruefungStore`, `lpUIStore`, optional `draftStore`
- Vorschlag: **English** (`set/toggle/reset`) — passt zum Zustand-Ecosystem
- Caller-Migration: ~50–100 Stellen (Komponenten, Tests)

**Aufwand:** **M** (2 Sessions) — pro Store eigener Commit + Caller-Update + Tests.

**Risiko:** **refactor** — mittel (Caller verstreut).

**Abhängigkeiten:** keine.

**Test-Plan:** Vitest + LP-/SuS-Browser-E2E auf alle betroffenen Flows (Login, Logout, Prüfung-Navigation, Hilfe-Toggle).

---

#### Bundle P — `musterlosung` Field-Drift-Konsolidierung *(erhöhtes Risiko)*

**Scope:** A4.2 Hauptbefund — drei Schreibweisen für Musterlösung-Konzepte konsolidieren.

- **Status quo dokumentieren** in `code-quality.md`: warum `musterlosung` (no e) der Backend-Vertrag ist und wann `musterloesung` (mit e) bzw. `musterLoesung` (PascalCase) gelten
- **Optional**: Frontend-Felder `musterloesungBild`/`musterloesungAnnotationen`/`musterLoesung` auf einheitliches `musterlosung*` umstellen → zieht Storage-Schreib-Pfade nach sich → Backend-Migration nötig
- **Sicherer**: Field-Drift-Check-Script (`scripts/audit-musterloesung.sh`) committen, Status quo bleibt

**Aufwand:** **M** (Doku-only) bis **L** (3-4 Sessions, Backend-Migration).

**Risiko:** **backend-migration** wenn Schema umbenannt — hoch. **akzeptieren+dokumentieren** — niedrig.

**Abhängigkeiten:** Bundle M (vorzugsweise nach Fragensammlung-Rename).

**Test-Plan**: Bei Migration: Stichprobe von 30 Fragen (ähnlich Bundle J), dann Full-Run, dann Browser-E2E + Korrektur-Pfad-Verifikation.

---

#### Bundle Q — Test-Verzeichnis-Konsolidierung (`__tests__/` retiren)

**Scope:** A2.10 — `src/__tests__/` (20 Files) auflösen.

- Pro File entscheiden: zu colocated `*.test.tsx` oder zu `src/tests/integration/`
- `src/components/__tests__/` → in colocated mergen
- CONTRIBUTING.md ergänzen mit Test-Layer-Strategie
- ESLint-Regel oder Pre-Commit-Hook: keine neuen Tests in `__tests__/`

**Aufwand:** **S** (1 Session, mechanisch).

**Risiko:** **mech-rename** — niedrig.

**Abhängigkeiten:** keine.

**Test-Plan:** Vitest grün + Visual-Inspect der Test-Reports (alle Tests laufen).

---

#### Bundle R — Error-Handling-Vereinheitlichung

**Scope:** A2.9 — `alert()`, `console.error`, `setError` vereinheitlichen.

- ~10–15 `alert()`-Stellen identifizieren
- Zentralen Toast-Mechanismus etablieren (oder existierenden Pattern nutzen)
- Silent-`console.error()`-only-Stellen auf User-Feedback ergänzen
- Konvention dokumentieren in `code-quality.md`

**Aufwand:** **M** (2 Sessions).

**Risiko:** **refactor** — mittel (UI-Verhalten ändert sich, A/B-Verifizierung pro Stelle).

**Abhängigkeiten:** keine.

**Test-Plan:** Pro betroffener Komponente: Browser-E2E mit echtem Login, Error-Pfad provozieren (Network-Drop), User-Feedback prüfen.

---

#### Bundle S — Datei-Hotspots Niedrig-Risiko-Splits (5 Files)

**Scope:** A3 Niedrig-Risiko — Files mit klar abgegrenzten Sub-Modulen splitten.

- `KorrekturFrageVollansicht.tsx` (846 Z.) → Renderer-Module
- `DruckAnsicht.tsx` (810 Z.) → Print-Renderer
- `poolConverter.ts` (744 Z.) → Mapping + Konverter-Module
- `VorschauTab.tsx` (643 Z.) → Sub-Components
- `fibuAutoKorrektur.ts` (600 Z.) → Domain-Module

**Aufwand:** **M** (2-3 Sessions, je ~30-45 min pro File + Tests).

**Risiko:** **refactor** — niedrig (Sub-Renderer sind stateless).

**Abhängigkeiten:** keine.

**Test-Plan:** Vitest grün + Browser-E2E der Korrektur-, Druck-, Vorschau- und FiBu-Pfade.

---

#### Bundle T — Datei-Hotspots Mittel-Risiko-Splits (Hooks)

**Scope:** A3 Mittel-Risiko — 6 Files mit Hook-Extraktion.

- `LPStartseite.tsx` → `useConfigFiltering()` + `useEinrichtungSync()` + Layout-Component
- `Dashboard.tsx` (Üben) → `useLernpfadData()` + `useThemenKomputationen()` + `<FachSektion>`
- `FragenBrowser.tsx` → `useFragenFilterEngine()` + `useFragenEditorSync()`
- `ZeichnenCanvas.tsx` → `useTextOverlay()` + `useCanvasSetup()`
- `DurchfuehrenDashboard.tsx` → `useMonitoringData()`
- `TKontoFrage.tsx` → `<KontoEingabeForm>` + `tkontoUtils.ts`

**Aufwand:** **L** (4 Sessions, je ~1 File pro Session).

**Risiko:** **refactor** — mittel (Hook-State-Disziplin, Test-Coverage-Sicherung).

**Abhängigkeiten:** Bundle M (Fragensammlung-Rename) für `FragenBrowser`-Touchpunkt; Bundle O (Store-Naming) für `LPStartseite`.

**Test-Plan:** Pro File: Vitest + Browser-E2E aller betroffenen Flows.

---

#### Bundle V — Sprach-Konvention dokumentieren *(Annex zu Bundle N)*

**Scope:** Hybrid-Sprach-Konvention (siehe Sprach-Strategie-Abschnitt) als Rule-File festhalten, damit künftige Sessions konsistent bleiben.

- Tabelle aus „Sprach-Strategie" als Section in `.claude/rules/code-quality.md`
- Beispiele für „Domain ist deutsch, Programming ist englisch"-Anwendung
- Hinweis auf Re-Evaluation bei Backend-Migration

**Aufwand:** **S** (15-30 min, im selben Branch wie Bundle N).

**Risiko:** **doku-only** — null.

**Abhängigkeiten:** Bundle N (parallel oder Annex).

---

#### Bundle U *(optional, nicht blockierend)* — Hoch-Risiko-Splits

**Scope:** A3 Hoch-Risiko — `PDFSeite.tsx` State-Untersuchung + sicherer Split.

- Eigene Brainstorming-Session vorgelagert (Coordinate-System, Touch-Handling, iOS-Focus-Pfade)
- Erst Test-Coverage-Audit, dann Plan, dann Split

**Aufwand:** **L** (4-6 Sessions).

**Risiko:** **refactor** — hoch.

**Abhängigkeiten:** Bundle T (Hook-Extraction-Erfahrung).

---

### Empfohlene Reihenfolge

```
Phase 1 — Mechanische Renames (S, niedrig-Risiko, parallelisierbar):
  Bundle M (Fragenbank → Fragensammlung)
  Bundle N (action/aktion in Apps-Script) + Bundle V (Sprach-Konvention dokumentieren)
  Bundle Q (__tests__/-Konsolidierung)

Phase 2 — Strukturelle Cleanups (M, mittel-Risiko):
  Bundle O (Store-Action-Naming)
  Bundle R (Error-Handling)
  Bundle S (Niedrig-Risiko-Datei-Splits)

Phase 3 — Field-Drift + Tiefen-Refactor (L, höher-Risiko):
  Bundle P (musterlosung Field-Drift)  ← Doku-Variante zuerst
  Bundle T (Mittel-Risiko-Datei-Splits + Hooks)

Phase 4 — Optional / strategisch:
  Bundle U (PDFSeite Hoch-Risiko-Split)
```

**Rationale:**
- **Phase 1 zuerst**, weil mechanisch + niedrig-Risiko + macht spätere Refactors lesbarer (umbenannter Code, keine `aktion`-Verwirrung mehr).
- **Phase 2** erst wenn Naming sauber ist — vermeidet Konflikte mit Phase 1 (z.B. Store-Rename + Action-Rename gleichzeitig wäre Merge-Hölle).
- **Phase 3** als eigenständig — Field-Drift hat eigenes Risiko-Profil (Backend-Vertrag), Datei-Splits brauchen Test-Coverage-Vorbereitung.
- **Phase 4** rein optional und nach UX-Feedback aus Phase 2/3 priorisieren.

### Abhängigkeitsgraph

```
M ─┐
N ─┼─→ O ─→ T (Mittel-Risiko-Splits)
Q ─┘    │
        ├─→ R
        ├─→ S
        └─→ P (oder eigenständig nach M)
                 │
                 └─→ U (optional)
```

---

## Audit-Lebensdauer

Dieses Dokument ist ein **Snapshot vom 2026-05-05**. Token-Counts veralten nach jedem Cleanup-Bundle.

**Re-Run nach jedem Bundle:**
```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-$(date +%F).md
diff /tmp/audit-tokens-*.md
```

Empfehlung: Bundle M zuerst, dann Audit re-run, dann mit Phase 2 weiter.
