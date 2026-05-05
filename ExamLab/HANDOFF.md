# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Letzter Stand auf main

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
