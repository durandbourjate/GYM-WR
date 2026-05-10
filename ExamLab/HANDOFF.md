# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Letzter Stand auf main

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
