# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Letzter Stand auf main

### Bundle CC — ConfigTab MaterialienSection-Cut ✅ MERGED (2026-05-09)

Branch `bundle-cc/configtab`. **Sechstes (und letztes) Sub-Bundle der Phase-5+ Hotspot-Reduction-Roadmap** (nach X/Y/Z/AA/BB). **Single-Cut der MaterialienSection** (447 Z.) + Helpers (10 Z.) in neuen Sub-Folder `materialien/`. ConfigTab **747 → 285 Z. (-62%)**. **Hotspot-Bilanz Files >500 Z. (ohne data/test): 1 → 0** ✅ — **Phase-5+ Hotspot-Reduction-Roadmap KOMPLETT**.

**Was geliefert:**
- `ExamLab/src/components/lp/vorbereitung/composer/materialien/materialienHelpers.ts` (~9 Z.) — Named Exports `formatGroesse`, `MAX_MATERIAL_GROESSE`, `ERLAUBTE_TYPEN`. Pure Konstanten + Helper.
- `ExamLab/src/components/lp/vorbereitung/composer/materialien/MaterialienSection.tsx` (~456 Z.) — Default Export. Byte-identische Sub-Komponente mit komplettem Datei-Upload-State (10 useState, 3 useCallback, async handleUpload mit dynamic-import authStore). Imports: `Section`+`Field` aus `../ComposerUI.tsx`, `apiService`+`parseVideoUrl`+Helpers via `../../../../../`-Pfad-Anpassung um eine Tiefe.
- `ExamLab/src/components/lp/vorbereitung/composer/ConfigTab.tsx` (747 → 285 Z., -462 Z., -62%): MaterialienSection + Helpers raus, Default-Import als Drop-In-Replacement. Imports von `useState`/`useRef`/`useCallback`/`PruefungsMaterial`/`apiService`/`parseVideoUrl` entfernt (nicht mehr benötigt).

**Verifikation:**
- vitest **1523 passed | 4 todo | 1 skipped** (drift =0).
- tsc -b clean.
- 4 Lint-Gates clean (musterloesung-Drift unverändert aus pre-existing untracked Test-Files, nicht aus Bundle CC).
- vite build grün (~3s, PWA generateSW OK, 256 Cache-Entries).

**Hotspot-Bilanz Files >500 Z. (ohne data/test): 1 → 0** ✅ — **Phase-5+ KOMPLETT**.

**Browser-E2E:** Mit echtem LP-Login auf `staging` durchgeführt:
- LP-Pfade ✅: Pruefen-Tab → Einführungsprüfung Bearbeiten → Composer „Einstellungen"-Tab → 4 Sections sichtbar (Grunddaten/Prüfungsparameter/Optionen/Rechtschreibprüfung) → MaterialienSection mit 2 bestehenden PDFs („Amtliche Witzsammlung" + „OR-Auszug") → „+ Material hinzufügen"-Button → Add-Form öffnet mit autoFocus-Titel + Typ-Dropdown (PDF-Link/Datei-Upload/Video/Rich-Text/Text/Link) + URL-Field + Abbrechen/Hinzufügen-Buttons.
- 0 Console-Errors.

**Reviewer:** Self-Review-Modus. Trotz HANDOFF-Klassifikation „hoch-Risiko" war Cut Low-Risk: MaterialienSection ist isolierte Sub-Komponente mit 2-Props-Interface, kein State-Sharing mit ConfigTab. Bundle-BB-Lehre 1 (Größe ≠ Risiko) bestätigt zum zweiten Mal.

**Architektur-Patterns (etabliert/wieder-verwendet):**
- **Sub-Komponenten-Cut** (Bundle T.b/BB): isolierte state-rich Sub-Komponente mit Props-Interface in eigenes Default-Export-File.
- **Helpers-Co-Location** (Bundle Z/AA): pure Helpers + Konstanten zusammen mit der Sub-Komponente in Sub-Folder, nicht in shared/.
- **Größe ≠ Risiko bei isolierter Sub-Komponente** (Bundle BB Lehre 1, jetzt zwei Mal bestätigt): MaterialienSection trotz 447 Z. + Datei-Upload-State Low-Risk via byte-identischem Move.

**Lehren neu (Bundle CC):**
- **Phase-5+ Hotspot-Reduction-Roadmap KOMPLETT** in 6 Sub-Bundles (X/Y/Z/AA/BB/CC) über 2 Tage. Pattern bewährt: Single-Cut für isolierte Sub-Komponenten, Doppel-Cut für 2 unabhängige Hotspots, Tab-Sektion-Cut für static content. Gesamt-Reduktion: BatchExportDialog 535→436, Layout 570→482, PruefungsComposer 526→454, ZeichnenCanvas 518→466, AktivPhase 573→420, BilanzERFrage 589→376, HilfeSeite 906→102, EinstellungenPanel 607→123, ConfigTab 747→285. **Total: ~5571 → 3144 Zeilen Hauptdatei-Code (-2427 Z., -44%)**.

**Spawn-Tasks (post-CC):**
- 2 untracked Test-Files (`uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts`) sollten in einem eigenen Test-Pflege-Bundle reviewed werden (musterloesung-Drift + Bundle-Zugehörigkeit klären).
- Optional: weitere Modularisierung von ConfigTab (4 Sections in eigene Sub-Files) wenn Composer-spezifischer Refactor ansteht — Hotspot ist aber bereits unter 500.

**Out of Scope:**
- Auflösung der 4 ConfigTab-Sections in eigene Sub-Files (würde ConfigTab auf ~80 Z. reduzieren) — nicht nötig für Hotspot-Removal.

**Merge:** `1b33746`.

**Cleanup post-CC (selbe Session):** Untracked Test-Duplikate `src/tests/uebungsStorePruefen.test.ts` + `src/tests/uebungsStoreLoesungsPreload.test.ts` gelöscht (waren veraltete Duplikate der bereits committed Co-Located Tests in `src/store/ueben/`). vitest 1523→1512, `lint:musterloesung` Drift +8 → 0 (alle 6 Tokens auf Baseline). Files waren untracked, kein Commit nötig.

---

### Bundle BB — HilfeSeite + EinstellungenPanel Doppel-Cut ✅ MERGED (2026-05-09)

Branch `bundle-bb/hilfeseite-einstellungen`. **Fünftes Sub-Bundle der Phase-5+ Hotspot-Reduction-Roadmap** (nach Bundle X/Y/Z/AA). **Doppel-Cut Mittel-Risiko + Hoch-Risiko-Static**: HilfeSeite **906 → 102 Z. (-89%)** + EinstellungenPanel **607 → 123 Z. (-80%)**. **Hotspot-Bilanz Files >500 Z. (ohne data/test): 3 → 1** ✅ — beide Files raus aus dem Set. Verbleibend: ConfigTab (747) als Bundle CC reserviert.

**Was geliefert (Phase A — HilfeSeite):**
- `ExamLab/src/components/lp/hilfe/layoutHelpers.tsx` (~35 Z.) — 5 Named Exports `Titel`/`Untertitel`/`Text`/`Schritt`/`Hinweis`. JSX byte-identisch.
- 10 Tab-Sektion-Files (jeweils Default-Export, Tab-Inhalt byte-identisch):
  - `HilfeEinstieg.tsx` (~52 Z.), `HilfeUeben.tsx` (~49 Z.), `HilfePruefung.tsx` (~34 Z.)
  - `HilfeFragen.tsx` (~130 Z.), `HilfeZusammenarbeit.tsx` (~46 Z.), `HilfeKI.tsx` (~90 Z.)
  - `HilfeDurchfuehrung.tsx` (~63 Z.), `HilfeKorrektur.tsx` (~54 Z.)
  - `HilfeBloom.tsx` (~129 Z., enthält Default + lokale `BloomStufe`-Sub-Komponente mit `useState`-Toggle)
  - `HilfeFAQ.tsx` (~133 Z., enthält Default + lokale `FAQItem`-Sub-Komponente mit `useState`-Toggle)
- `ExamLab/src/components/lp/HilfeSeite.tsx` (906 → 102 Z., -804 Z., -89%): Wrapper + Tab-Switch + ResizableSidebar bleibt; alle Tab-Sektionen + Layout-Helper raus.

**Was geliefert (Phase B — EinstellungenPanel):**
- `ExamLab/src/components/settings/einstellungen/sharedFelder.tsx` (~53 Z.) — Named Exports `CheckboxChip` + `SettingsField`. JSX/Logik byte-identisch.
- `ExamLab/src/components/settings/einstellungen/InlineEditoren.tsx` (~77 Z.) — Named Exports `InlineKursEditor` + `InlineTextEditor` (Inline-CRUD-Forms). Type-Imports aus `../../../types/stammdaten`.
- `ExamLab/src/components/settings/einstellungen/ProfilTab.tsx` (~117 Z.) — Default-Export. LP-Profil mit 3 CheckboxChip-Listen (Fachschaften/Kurse/Gefässe) + `speichereLPProfil`-Action. `useStammdatenStore.getState().fehler` Zugriff erhalten.
- `ExamLab/src/components/settings/einstellungen/AdminTab.tsx` (~242 Z.) — Default-Export. 4 CRUD-Sektionen für Gefässe/Kurse/Fachschaften/Fächer mit Inline-Editoren + `useCallback`-`speichern` + `bearbeitungsModus`-State.
- `ExamLab/src/components/settings/EinstellungenPanel.tsx` (607 → 123 Z., -484 Z., -80%): Tab-Bar + Tab-Switch + ResizableSidebar bleibt; ProfilTab+AdminTab+Inline-Editoren+Shared-Felder raus.

**Verifikation:**
- vitest **1523 passed | 4 todo | 1 skipped** (drift =0 vs Pre-BB-Baseline 1523, +11 vs Bundle-AA-Baseline 1512 stammt aus 2 untracked Test-Files vor Bundle BB).
- tsc -b clean.
- 4 Lint-Gates clean: `lint:as-any` (Total 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` clean, `lint:musterloesung` Drift +8 stammt aus pre-existing untracked Test-Files (`uebungsStorePruefen.test.ts`+`uebungsStoreLoesungsPreload.test.ts`), nicht aus Bundle BB. Verifikation via `git stash -u`: Bundle BB selbst zeigt 0 Drift.
- vite build grün (~3s, PWA generateSW OK, 256 Cache-Entries).
- Bestehende Tests grün — keine Regression.

**Hotspot-Bilanz Files >500 Z. (ohne data/test): 3 → 1** ✅. Verbleibend: ConfigTab (747) als Bundle CC reserviert.

**Browser-E2E:** Mit echten LP+SuS-Logins auf `staging` durchgeführt:
- LP-Pfade ✅: Hilfe-Sidebar öffnen / Tabs durchklicken: Erste Schritte → KI-Assistent (komplexe Tabelle + Hinweis-Box) → Bloom-Taxonomie (Stateful Accordion: K1 expand) → FAQ (Stateful Toggle: erste Frage öffnen). Einstellungen-Sidebar öffnen / ProfilTab (Fachschaften/Kurse/Gefässe sichtbar) / Tab-Wechsel zu Favoriten + zurück / Problemmeldungen-Badge "(4)" funktioniert.
- SuS-Pfade ✅: Hallo wr! / Empfohlenes Thema VWL / Filter Alle/BWL/Recht/VWL / Aktuelle Themen-Karten + BWL-Sektion sichtbar.
- 0 Console-Errors auf beiden Tabs (verifiziert via `read_console_messages onlyErrors:true`).

**Reviewer:** Self-Review-Modus (analog Bundle Z+AA) — kompakte Spec, kein 2-Iter-Reviewer-Loop. Bundle BB ist trotz Größe niedrig-Risiko: HilfeSeite reines Static Content, EinstellungenPanel Sub-Komponenten ohne Cross-State.

**Architektur-Patterns (etabliert/wieder-verwendet):**
- **Tab-Sektion-Cut** (Bundle T.f LPStartseite, 1043→382): static content in Tab-Switch-Renderern → 1 Sub-File pro Tab + 1 Layout-Helper-File mit Named Exports.
- **Sub-Komponenten-Cut** (Bundle T.b TKontoFrage, 763→155): state-rich Sub-Komponenten (ProfilTab/AdminTab) als Default-Export in eigenes File, Hauptdatei nur noch Tab-Switch.
- **Lokale Helper im Tab-File** (neu Bundle BB) — `BloomStufe` und `FAQItem` mit `useState` bleiben **innerhalb** ihres Parent-Tab-Files (`HilfeBloom.tsx` / `HilfeFAQ.tsx`), nicht extracted. Keine Cross-File-Re-Use, also intern lokal halten.
- **Doppel-Cut in 1 Bundle** (Bundle Z/AA): zwei unabhängige Files mit Spec-Plan-Reviewer-Overhead 1× statt 2×.

**Lehren neu (Bundle BB):**
- **Hoch-Risiko-Klassifikation in HANDOFF nicht immer = hoch-Risiko-Cut** — HilfeSeite (906 Z., war als „hoch-Risiko" gemerged-Spawn-Task gelistet) zeigt: Größe ≠ Risiko. Wenn Inhalt rein static ist mit Tab-Switch-Pattern, ist der Cut byte-mechanisch und Low-Risk trotz Größe. Pre-Cut-Audit (`grep -n "^function\|^const.*=.*=>\|^export"`) zur Risk-Bewertung empfehlenswert.
- **untracked Test-Files vor Bundle Spawn nicht ignorieren** — pre-existing untracked Test-Files (von vorherigen Sessions) tragen zu lint:musterloesung-Drift bei. Gut: `git stash -u` vor Audit, um Drift-Quelle zu isolieren. Empfehlung: Bei Bundle-Start prüfen ob Untracked-Files noch Bundle-relevant sind.
- **Bei `Write`-Tool-Fehler "File not yet read" Read-Tool-Roundtrip ist nötig** — auch wenn man Sektionen via Read schon abgedeckt hat, kann der Tool-State bei Re-Write die Read-Validation neu prüfen. 5-Zeilen-Read als günstiger Workaround.

**Spawn-Tasks (post-Bundle-BB):**
- **Bundle CC: ConfigTab (747)** — letzter Hotspot >500 Z. (Code-Files). Hoch-Risiko wegen MaterialienSection mit Datei-Upload-State und composer-spezifischer Form-Logik.
- 2 untracked Test-Files (`uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts`) sind weiterhin vorhanden und sollten in einem eigenen Test-Pflege-Bundle reviewed werden (musterloesung-Drift + Bundle-Zugehörigkeit klären).

**Out of Scope:**
- Konsolidierung von ProfilTab/AdminTab in eine gemeinsame Form-Logik (eigene Architektur-Diskussion wert).
- AdminTab CRUD-Sektionen-Dedup (4× ähnliche Sektionen für Gefässe/Kurse/Fachschaften/Fächer könnten via `<CRUDSection>`-Generic gebündelt werden — eigenes Bundle wert).

**Merge:** `4f53910`.

---

### Bundle AA — AktivPhase + BilanzERFrage Mittel-Risiko-Cuts ✅ MERGED (2026-05-09)

Branch `bundle-aa/mittelrisiko`. **Viertes Sub-Bundle der Phase-5+ Hotspot-Reduction-Roadmap** (nach Bundle X/Y/Z). **Doppel-Cut der zwei mittel-Risiko Files**: AktivPhase **573 → 420 Z. (-26.7%)** + BilanzERFrage **589 → 376 Z. (-36.2%)**. **Hotspot-Bilanz Files >500 Z. (ohne data/test): 5 → 3** ✅ — beide Files raus aus dem Set. +14 neue Vitest-Tests (1498 → 1512).

**Was geliefert (Phase A — AktivPhase):**
- `ExamLab/src/components/lp/durchfuehrung/ZeitzuschlagInline.tsx` (~125 Z.) — Sub-Komponente mit 4 Render-Branches (kein-Zuschlag/Editor/Overtime/Zuschlag-gesetzt). 6-Property Props-Interface. JSX byte-identisch zum Original.
- `ExamLab/src/components/lp/durchfuehrung/ZeitzuschlagInline.test.tsx` (~70 Z.) — **5 Vitest** mit @testing-library/react: kein-Zuschlag → +5, Editor öffnen, Enter speichert, Escape verwirft, Overtime-Countdown.
- `ExamLab/src/components/lp/durchfuehrung/aktivPhaseHelpers.tsx` (~57 Z.) — 5 Pure-Helper (`statusReihenfolge`, `filterLabel`, `verstossTooltip`, `stufeIcon`, `statusBadge`) + 2 Type-Re-Exports (`Sortierung`, `QuickFilter`).
- `ExamLab/src/components/lp/durchfuehrung/aktivPhaseHelpers.test.ts` (~67 Z.) — **9 Vitest**: 4 Helper × 1-3 Cases (statusBadge JSX-Render-only ohne Test).
- `ExamLab/src/components/lp/durchfuehrung/AktivPhase.tsx` (573 → 420 Z., -153 Z., -26.7%):
  - 110 Z. ZeitzuschlagInline-Block raus → 1 Import.
  - 50 Z. Helper-Block raus → Multi-Import.

**Was geliefert (Phase B — BilanzERFrage):**
- `ExamLab/src/components/fragetypen/BilanzERLoesung.tsx` (~218 Z.) — kompletter Lösungs-Modus inkl. Sub-Helper:
  - `BilanzERLoesung` (Hauptkomponente) — Lösungsmodus mit Korrekt-Vergleich (Bilanz + ER).
  - `BilanzSeiteRender` (Sub-Helper) — Aktiv/Passiv-Seite mit Konten.
  - `KontoZeileAnzeige` (Sub-Helper) — Konto-Zeile mit Saldo.
  - `erwarteterGewinnVerlust` (Pure-Funktion) — Gewinn/Verlust aus letzter Stufe.
- `ExamLab/src/components/fragetypen/BilanzERFrage.tsx` (589 → 376 Z., -213 Z., -36.2%):
  - Komplette LOESUNGSMODUS-Sektion (Z. 379-589) raus → 1 Import.
  - Bestehende `BilanzERFrageLoesung.test.tsx` (134 Z.) ohne Edit grün geblieben (verwendet Default-Export `BilanzERFrage` mit `modus="loesung"`-Prop).

**Verifikation:**
- vitest **1512 passed | 4 todo | 1 skipped** (drift +14 vs Bundle-Z-Baseline 1498: +5 ZeitzuschlagInline + 9 aktivPhaseHelpers).
- tsc -b clean.
- 4 Lint-Gates clean: `lint:as-any` (Total 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir`, `lint:musterloesung` (Baseline-Drift = 0).
- vite build grün (~3s, PWA generateSW OK, 256 Cache-Entries).
- Bestehende Tests grün — keine Regression.

**Hotspot-Bilanz Files >500 Z. (ohne data/test): 5 → 3** ✅. Verbleibend: HilfeSeite (906), ConfigTab (747), EinstellungenPanel (607).

**Browser-E2E:** Mit echten LP+SuS-Logins auf `staging` durchgeführt _(siehe Test-Sektion)_.

**Reviewer:** Self-Review-Modus (analog Bundle Z) — kompakte Spec, kein 2-Iter-Reviewer-Loop. Mittel-Risiko-Status nicht durch zusätzliche Reviewer-Iterationen abgedeckt, sondern durch:
- Vitest-Coverage für ZeitzuschlagInline (5 Tests, 4 Render-Branches)
- Vitest-Coverage für aktivPhaseHelpers (9 Tests, 4/5 Funktionen)
- Bestehende BilanzERFrageLoesung-Test-Suite (134 Z.) als Regression-Sicherheitsnetz für Lösungsmodus-Cut.

**Architektur-Patterns (etabliert/wieder-verwendet):**
- **Render-Sub-Komponente in eigene Datei** (Bundle-T.b/Y/Z) — `<ZeitzuschlagInline>` mit 6-Props isoliert state-rich Editor-Sub-Komponente.
- **Pure-Helper-Move ohne Re-Export-Bridge** (Bundle-U/W/Z) — 5 Helper sind isoliert, kein zweiter Caller.
- **Modus-Branch-Cut bei polymorpher Komponente** (neu Bundle-AA) — `BilanzERFrage` mit `modus`-Prop hat 2 Top-Level-Branches; Lösungs-Branch + zugehörige Sub-Helper in eigene Datei. Aufgabe-Branch + zugehörige Editor-Sub-Komponenten bleiben in Source.
- **Co-Location von Sub-Helpern bei Modus-Cut** — `BilanzSeiteRender` + `KontoZeileAnzeige` + `erwarteterGewinnVerlust` sind nur in Lösungs-Modus verwendet → Move zusammen mit `BilanzERLoesung` in dieselbe neue Datei (kein eigenes Helper-Modul nötig).

**Lehren neu (Bundle AA):**
- **Mittel-Risiko Doppel-Cut bewährt sich** — wie Bundle Z (Knapp-drin Doppel-Cut), funktioniert Doppel-Cut auch für mittel-Risiko-Files wenn die Cuts unabhängig sind. Test-Coverage pro Cut macht das Risiko handhabbar.
- **Modus-Branch-Cut ist sicherster Cut bei polymorphen Komponenten** — wenn Komponente einen `modus`-Prop hat und beide Branches komplett unabhängige State-Welten haben, ist die Modus-Branch-Auslagerung byte-identisch ohne State-Sharing-Risiko. Bestehende Tests bleiben grün ohne Edit (sie testen die Default-Export-Wrapper, der intern an die Sub-Komponente delegiert).

**Spawn-Tasks (post-Bundle-AA):**
- **Bundle BB+: EinstellungenPanel (607)** — letztes mittel-Risiko File, dann nur noch hoch-Risiko übrig.
- **Bundle Mega: HilfeSeite (906) + ConfigTab (747)** — hoch-Risiko, grösste Files.
- BilanzUI/ERUI/KontoRow/KontenTabelle (Aufgabe-Pfad ~250 Z.) in BilanzERFrage könnten in eigenes File ausgelagert werden — eigenes Bundle bei nächster Gelegenheit, BilanzERFrage ist aktuell schon unter 500 ✅.

**Out of Scope:**
- Bilanz/ER-Editor-Komponenten in BilanzERFrage (Aufgabe-Modus ~250 Z.) — eng verzahnt mit useFrageAdapter-State, eigenes Bundle wert.
- Tabellen-Body in AktivPhase (Tabellenzeilen-JSX, ~140 Z.) — eng verzahnt mit Sortierung+Filter+Konfig-Updates, eigenes Bundle wert.

**Merge:** `fc8f191`.

---

### Bundle Z — PruefungsComposer + ZeichnenCanvas Knapp-drin Cuts ✅ MERGED (2026-05-08)

Branch `bundle-z/knappdrin`. **Drittes Sub-Bundle der Phase-5+ Hotspot-Reduction-Roadmap** (nach Bundle X BatchExportDialog + Bundle Y Layout). **Doppel-Cut der zwei „Knapp-drin"-Files** aus HANDOFF Spawn-Tasks: PruefungsComposer **526 → 454 Z. (-13.7%)** + ZeichnenCanvas **518 → 466 Z. (-10%)**. **Hotspot-Bilanz Files >500 Z. (ohne data/test): 7 → 5** ✅ — beide Files raus aus dem Set. +10 neue Vitest-Tests (1488 → 1498).

**Was geliefert (Phase A — PruefungsComposer):**
- `ExamLab/src/hooks/useFragenStats.ts` (~35 Z.) — Self-contained Hook (Bundle-Y-Pattern). Liest `user`+`istDemoModus` aus authStore selectors. Demo-Mode-Fallback inline, sonst `apiService.ladeTrackerDaten` + `aggregiereFragenPerformance`. Returns `Map<string, FragenPerformance>`.
- `ExamLab/src/hooks/useFragenStats.test.ts` (~89 Z.) — **5 Vitest** mit Closure-Ref-Mock-Pattern: demo-mode → demo-tracker, api-not-configured → demo, no-user → leer, success → aggregiert, tracker-null → leer.
- `ExamLab/src/components/lp/vorbereitung/composer/LoeschDialoge.tsx` (~94 Z.) — Render-Sub-Komponente (Bundle-T.b-Pattern). Bündelt beide Lösch-Dialoge (Abschnitt + Pruefung) in 1 Komponente mit 9-Property-Props-Interface. JSX byte-identisch zu Original.
- `ExamLab/src/components/lp/vorbereitung/composer/composerHelpers.ts` (~12 Z.) — Pure-Helper `generiereId(config)`. Move ohne Re-Export-Bridge (kein anderer Caller bekannt).
- `ExamLab/src/components/lp/vorbereitung/composer/composerHelpers.test.ts` (~41 Z.) — **3 Vitest**: special-chars-strip + slice(10), datum-stripping, base36-suffix-länge.
- `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx` (526 → 454 Z., -72 Z., -13.7%):
  - 16 Z. Tracker-State+useEffect → 1 `useFragenStats()` Hook-Call.
  - 62 Z. zwei BaseDialog-Blöcke → 1 `<LoeschDialoge>` JSX-Aufruf.
  - 6 Z. `generiereId`-Helper-Removal (Move).
  - 2 Imports raus (`BaseDialog`, `erstelleDemoTrackerDaten`/`aggregiereFragenPerformance`/`FragenPerformance`-type), 2 rein (`useFragenStats`, `LoeschDialoge`/`generiereId`).

**Was geliefert (Phase B — ZeichnenCanvas):**
- `ExamLab/src/components/fragetypen/zeichnen/cursorFuerTool.ts` (~18 Z.) — Pure-Helper-Move. Switch über `Tool`-Union liefert CSS-Cursor-String.
- `ExamLab/src/components/fragetypen/zeichnen/cursorFuerTool.test.ts` (~25 Z.) — **2 Vitest**: alle 8 Tools verifizieren + Fallback-Default für unbekannte.
- `ExamLab/src/components/fragetypen/zeichnen/TextOverlayInput.tsx` (~79 Z.) — Render-Sub-Komponente (Bundle-T.b-Pattern). 8-Property-Props-Interface. JSX/Inline-Styles/Event-Handlers byte-identisch zu Original. KEIN Vitest (reines JSX, durch Browser-E2E gedeckt).
- `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` (518 → 466 Z., -52 Z., -10%):
  - 13 Z. lokale `cursorFuerTool`-Funktion → import + Helper-Aufruf.
  - 50 Z. Text-Overlay-JSX → 10 Z. `<TextOverlayInput>` JSX.
  - 2 Imports rein (`cursorFuerTool`, `TextOverlayInput`).

**Verifikation:**
- vitest **1498 passed | 4 todo | 1 skipped** (drift +10 vs Bundle-Y-Baseline 1488: +5 useFragenStats, +3 generiereId, +2 cursorFuerTool).
- tsc -b clean.
- 4 Lint-Gates clean: `lint:as-any` (Total 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir`, `lint:musterloesung` (Baseline-Drift = 0).
- vite build grün (~3s, PWA generateSW OK, 256 Cache-Entries).
- Bestehende Tests grün — keine Regression.

**Hotspot-Bilanz Files >500 Z. (ohne data/test): 7 → 5** ✅. Verbleibend: HilfeSeite (906), ConfigTab (747), EinstellungenPanel (607), BilanzERFrage (589), AktivPhase (573).

**Browser-E2E:** Mit echten LP+SuS-Logins auf `staging` durchgeführt:
- LP-Pfade ✅: Pruefung-Composer öffnen / Titel+Klasse Eingabe / Auto-Save speichert (Pruefung erscheint in Liste) / Edit-Mode mit existierender Prüfung (Lösch-Link sichtbar) / Lösch-Dialog erscheint mit korrektem Titel+Body+Buttons / Abbrechen schliesst Dialog ohne Action / Endgültig löschen löscht + navigiert via onZurueck zurück zur Liste.
- SuS-Pfade ✅: Übung mit Zeichnen-Frage (Bedürfnisse VWL, Zeichnen-Filter) öffnet Canvas mit Toolbar / Stift-Tool zeichnet Diagonal-Strich / Text-Tool öffnet TextOverlayInput mit blauer Border / Enter speichert „Test Z" auf Canvas / Escape verwirft Eingabe (Text NICHT gespeichert).
- 0 Console-Errors auf beiden Tabs.

**Reviewer:** Self-Review-Modus (analog Bundle W) — kompakte Spec, kein 2-Iter-Reviewer-Loop bei Low-Risk-Knapp-drin-Cuts. Pre-Cut-Verifikation: Pre-Cut-Greps gegen Doppel-Caller bestätigt (kein Re-Export-Bridge nötig).

**Architektur-Patterns (etabliert/wieder-verwendet):**
- **Render-Sub-Komponente mit Props-Bündel** (Bundle-T.b/Y) — `<LoeschDialoge>` mit 9-Props internalisiert beide Dialog-Branches; `<TextOverlayInput>` mit 8-Props internalisiert Overlay+Input.
- **Self-contained Hook mit authStore-Selectors** (Bundle-Y) — `useFragenStats` liest user/demoMode via Selectors, kein Argument-passing.
- **Pure-Helper-Move ohne Re-Export-Bridge** (Bundle-U/W) — `generiereId` und `cursorFuerTool` sind isoliert, kein zweiter Caller.
- **Doppel-Cut in 1 Bundle** — 2 unabhängige Files in derselben Phase-Bundle-Kapsel zusammengefasst (Knapp-drin-Bucket-Pattern, neue Bundle-Z-Konvention).

**Lehren neu (Bundle Z):**
- **Knapp-drin-Bucket-Bundle-Pattern bewährt** — Wenn 2 Files <30 Z. über Hotspot-Schwelle sind, lohnt 1 kombiniertes Bundle mit 2 Phasen statt 2 separate Bundles. Spec/Plan/Reviewer-Overhead 1× statt 2×, beide Files in einem E2E-Run getestet.
- **Pure-Helper-Move mit Mock-spread Edge-Case** — `mkConfig`-Test-Helper: bei `as unknown as Type`-Cast leicht zu vergessen, `...overrides` ins Object-Literal zu spreaden. Symptom: Test schlägt fehl weil Default-Klasse statt Override-Klasse benutzt wird. 30s-Fix; aber zeigt: Test-Helper sollte spreaden + cast separat halten.

**Spawn-Tasks (post-Bundle-Z):**
- **Bundle AA+: AktivPhase (573) / BilanzERFrage (589) / EinstellungenPanel (607)** — mittel-Risiko-Bucket.
- **Bundle Mega: HilfeSeite (906) + ConfigTab (747)** — hoch-Risiko, grösste Files.
- Auto-Save-Hook in PruefungsComposer (handleSpeichernIntern + Auto-Save-Effect, ~75 Z.) — eigenes Bundle bei nächster Gelegenheit.

**Out of Scope:**
- handleSpeichernIntern Auto-Save in PruefungsComposer (zu viel Closure/Ref-State).
- handleStart/Move/End Pointer-State-Machine in ZeichnenCanvas (Bundle T.d hat bereits Pointer-Events ausgelagert, Switch bleibt).

**Merge:** `888c4ff`.

---

### Bundle Y — Layout Pruefungs-Recovery Hook-Cut ✅ MERGED (2026-05-08)

Branch `bundle-y/layout-recovery-cut`. **Zweites Sub-Bundle der Phase-5+ Hotspot-Reduction-Roadmap** (nach Bundle X BatchExportDialog). **Layout.tsx 570 → 482 Zeilen (-15.4%)** via Hook-Cut nach `hooks/usePruefungsRecovery.ts` + Render-Sub-Komponente `components/PruefungsRecoveryStatus.tsx` + Bonus-Removal der 2 Wochen alten localStorage-Migration-IIFE. **Hotspot-Bilanz Files >500 Z. (ohne data/test): 8 → 7** — Layout.tsx aus dem Set raus. +8 neue Vitest-Tests (1480 → 1488).

**Was geliefert (1 Hook-File + 1 Test-File + 1 Sub-Komponente + Component-Edit, 0 Caller-Edits):**
- `ExamLab/src/hooks/usePruefungsRecovery.ts` (~79 Z.) — Pure-State-Hook mit Side-Effect-Aufteilung-Pattern (Bundle-W.b). Returns `{ status: 'idle' | 'loading' | 'failed' }`. Kapselt:
  - URL-Parsing via `useMemo` (search-param `id` aus `window.location.search`).
  - Trigger-Bedingung mit `recoveryAttempted`-Guard (verhindert Doppel-Aufruf bei Re-Render).
  - 10s-Timeout via `Promise.race` mit `RECOVERY_TIMEOUT_MS = 10_000` Konstante.
  - `apiService.ladePruefung`-Aufruf + Store-Mutation via `usePruefungsStore.getState().setPruefung(...)`.
  - `console.error`-Logging im catch-Pfad.
  - JSDoc dokumentiert Side-Effect-Aufteilung explizit (Reset-Aktion bleibt im Konsumenten).
- `ExamLab/src/hooks/usePruefungsRecovery.test.ts` (~154 Z.) — **8 Vitest-Tests** mit **Closure-Ref-Mock-Pattern** (analog `useFragenAutoSave.test.tsx`):
  - module-level mutable Refs (`configRef`/`fragenRef`/`userRef`) im `beforeEach` zurückgesetzt
  - `vi.fn()` via Closure referenziert + überleben Mocks-Reset
  - statisches `import` für den getesteten Hook nach allen `vi.mock`-Calls
  - **Kein** `vi.resetModules + dynamic-import` (Plan-Reviewer-Iter-1 dokumentierte fragility)
  - Tests: idle / failed-no-url / failed-no-user / success-mit-durchfuehrungId / success-ohne-durchfuehrungId / api-result-null → failed / api-throws → failed+console.error / recoveryAttempted-Guard rerender → 1× API-Call.
- `ExamLab/src/components/PruefungsRecoveryStatus.tsx` (~43 Z.) — Render-Sub-Komponente mit Status-Switch + Reset-Action (DRY-Wrapper für loading/failed-Branch). Tailwind-Klassen byte-identisch zu Layout.tsx Z. 226-253 Original. Default-export. Props: `{ status: 'loading' | 'failed' }`. Bundle-T.b-Pattern.
- `ExamLab/src/components/Layout.tsx` (570 → 482 Z., -88 Z., -15.4%):
  - Imports: 2 raus (`apiService`, `resolveFragenFuerPruefung`), 2 rein (`usePruefungsRecovery`, `PruefungsRecoveryStatus`).
  - **Bonus-Cut:** localStorage-Migration-IIFE Z. 32-43 ersatzlos gelöscht (M3, 2 Wochen alt seit Migration-Commit `16f4b4f` 24.04.2026 — Sunset-Comment-Removal).
  - Recovery-State+Effect Z. 176-220 → 1 Hook-Call-Zeile.
  - Recovery-Render-Block Z. 222-255 → 1 `<PruefungsRecoveryStatus status={...} />`-JSX-Zeile.
  - Body Z. 167-482 (Header + Sidebar + Main + Banner + Overlays) **byte-identisch zur Source**, nur shifted up.

**Verifikation:**
- vitest **1488 passed | 4 todo | 1 skipped** (drift +8 vs Bundle-X-Baseline 1480, exakt zwischen Plan-Forecast `+7 oder +8`).
- tsc -b clean (Output direkt geprüft, Memory `feedback_tsc_b_exit_misleading`).
- 4 Lint-Gates clean: `lint:as-any` (Total 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir`/`audit-test-locations`, `lint:musterloesung` (Baseline-Drift = 0).
- vite build grün (~3s, PWA generateSW OK, 256 Cache-Entries).
- Bestehende Tests grün — keine Regression.

**Hotspot-Bilanz Files >500 Z. (ohne data/test): 8 → 7** ✅. Verbleibend: HilfeSeite (906), ConfigTab (747), EinstellungenPanel (607), BilanzERFrage (589), AktivPhase (573), PruefungsComposer (526), ZeichnenCanvas (518).

**Browser-E2E SKIPPED** (low-risk Hook-Cut). Begründung:
- Layout ist props-less, kein Caller-Edit-Risiko (2 Caller verifiziert: `App.tsx:354` + `SuSVorschau.tsx:112`).
- Recovery-Pfad nur via Reload+URL-id+missing-Store-State triggerbar (selten in E2E).
- vitest 8 Tests decken State-Maschine vollständig + alle 9 Recovery-Pfade aus Spec § 3.
- Cumulative-Reviewer hat byte-equivalence am Source-Byte-Level verifiziert.
- Falls Bug-Report: Spawn-Task „Browser-E2E manuell mit F5-Recovery-Flow".

**Reviewer:** Spec-Reviewer ✅ (1. Pass + advisory rev2-Empfehlung `lint:no-alert` vorab verifiziert). Plan-Reviewer (2 Iterationen): Iter-1 fand 3 actionable Issues (Worktree-Konflikt, Mock-Pattern fragil, Commit-Hash-Step). Iter-2 ✅ APPROVED nach rev2 + minor file-map cleanup. Per-Phase Spec-Compliance ✅ (Phase 1, 2, 3 unabhängig). Per-Phase Code-Quality ✅ (Phase 1 APPROVED FOR MERGE; Phase 2 trivial geskippt; Phase 3 cumulativ APPROVED FOR MERGE über alle 3 Phasen). Final Code-Reviewer skipbar (kumulativer Phase-3-Reviewer hat alle 9 Spec-§3-Pfade byte-equivalent verifiziert + Definition-of-Done § 7 Checkliste komplett).

**Architektur-Patterns (etabliert/bestätigt):**
- **Side-Effect-Aufteilung als Pattern für Hook-Cuts** (Bundle-W.b) — Hook macht State-Maschine + API-Call + Store-Mutation via `getState()`. Reset-Aktion (`window.confirm + reset + reload`) bleibt im Konsumenten. Pattern macht Hook isoliert vitest-testbar ohne Browser-Mock.
- **Self-contained Hook mit Store-getState-Pattern** (`useFragenAutoSave.ts`-Vorbild bestätigt) — Hook konsumiert Stores via Selectors für Read, ruft `getState()` für Write.
- **Render-Sub-Komponente mit Status-Prop für JSX-Cuts** (Bundle-T.b-Pattern bestätigt) — `<PruefungsRecoveryStatus status={...} />` internalisiert beide Branches mit DRY-Wrapper. 1 Komponente mit Switch statt 2 separate.
- **Closure-Ref-Mock-Pattern für Hook-Tests** — module-level mutable Refs (`configRef`/`fragenRef`/`userRef`) werden im `beforeEach` zurückgesetzt, mock-Factories schliessen über sie. **Kein** `vi.resetModules + dynamic-import` (Plan-Reviewer-Iter-1-Lehre: dynamic-Pattern ist fragil).
- **Dead-Code-Removal als Bonus-Cut** (Bundle-W.b-Twin-Cleanup-Pattern) — Migration-IIFE mit Sunset-Comment ist natürlicher Anlass für Removal beim ohnehin-laufenden Cut-Bundle.

**Lehren neu (Bundle Y):**
- **Closure-Ref-Mock-Pattern für Hook-Tests bevorzugen** über `vi.doMock + vi.resetModules + dynamic import`. Module-level mutable Refs in mock-factories closures sind robuster: `beforeEach` resettet, `vi.fn()` werden via Closure referenziert + überleben Mocks-Reset, statisches `import` für den getesteten Hook nach allen `vi.mock`-Calls. Plan-Reviewer-Iter-1 fand das dynamic-Pattern fragil; Closure-Ref lief beim Implementer first-try-grün ohne Mock-Setup-Debugging.
- **Spec-Plan-Test-Drift bei Test-Listen aktiv prüfen** — Spec § 2 listete 7 Test-Cases inkl. `recoveryAttempted-Guard`; Plan ersetzte den still mit `success-ohne-durchfuehrungId`-Test; Code-Quality-Reviewer fand das durch Spec-vs-Plan-vs-Code-Vergleich. Beide Tests sind nützlich → 8. Test als Phase-1-Fix nachgereicht. **Pre-Plan-Verify-Schritt:** bei Test-Listen-Übernahme aus Spec ins Plan diff-byte-equivalent prüfen, sonst silent drift möglich.
- **lint:no-alert-Audit-Pattern beachten:** Match-Pattern in `scripts/audit-no-alert.sh` ist `\balert\(|window\.alert\(` — `window.confirm` ist NICHT Teil des Patterns (Spec rev2 vorab verifiziert). Vor Spec-Risk-Tabellen Plan-Phase-Aufwand mit 30s-grep ggü. eslint/script verifizieren.

**Spawn-Tasks (post-Bundle-Y):**
- **Bundle Z+: AktivPhase (573) / BilanzERFrage (589) / EinstellungenPanel (607)** — mittel-Risiko (Live-State / Fibu-Logik / Settings-Panel).
- **Bundle Mega: HilfeSeite (906) + ConfigTab (747)** — hoch-Risiko, grösste Files.
- **Knapp-drin: PruefungsComposer (526) + ZeichnenCanvas (518)** — kleiner Cut reicht.
- **`[Layout]`-Log-Tag-Refresh** in `usePruefungsRecovery.ts` Z. 64+71 (jetzt vom Hook nicht mehr von Layout aus geloggt — minor, byte-equivalence-erhaltend gehalten).
- **Browser-E2E manuell mit F5-Recovery-Flow** falls Bug-Report zu Bundle Y auftaucht.

**Out of Scope (Phase 5+ Roadmap):**
- 7 verbleibende Hotspot-Files in eigenen Bundles (s. Spawn-Tasks).
- Header-JSX-Cut (~80 Z.) / Banner-JSX-Cut (~50 Z.) / Material-Modus-Hook (~15 Z.) / Verstoss-Overlay-Hook (~13 Z.) — alle bewusst nicht in Bundle Y enthalten.
- Phase 5+ Roadmap bleibt offen, Reihenfolge nach Risiko-Profil + User-Priorität.

**Merge:** `6479448`.

---

### Bundle X — BatchExportDialog Pure-Logic-Cut ✅ MERGED (2026-05-08)

Branch `bundle-x/batchexport-logic`. **Erstes Sub-Bundle der Phase-5+ Hotspot-Reduction-Roadmap** (nach Phase-4-Audit-Abschluss durch Bundle U+V+W+W.b). **BatchExportDialog.tsx 535 → 436 Zeilen (-18.5%)** via Pure-Logic-Cut nach `utils/batchExportLogic.ts`. **Hotspot-Bilanz Files >500 Z. (ohne data/test): 9 → 8** — BatchExportDialog aus dem Set raus. +8 neue Vitest-Tests (1472 → 1480).

**Was geliefert (1 Helper-File + 1 Test-File + Component-Edit, 0 Caller-Edits):**
- `ExamLab/src/utils/batchExportLogic.ts` (~169 Z.) — exportiert:
  - `erstelleAutoZuweisungen({gewaehlteIds, exportierbar, pools}) → { zuweisungen, benoetigteTopicPools }` — pure Auto-Zuweisung-Map-Bau aus Fachbereich-Match. `benoetigteTopicPools: string[]` als Result-Field damit Component die `ladeTopicsFuerPool`-State-Mutation ausserhalb fahren kann.
  - `async fuehreBatchExportAus({zuweisungen, fragen, pools, email, onFortschritt}) → Promise<{ ergebnisse, erfolgreiche }>` — Pool-Gruppierung + per-Pool-API-Aufruf + Result-Mapping byte-identisch von BatchExportDialog Z. 170-256. `onFortschritt`-Callback (DI) statt direkt setState.
  - 3 Type-Exports: `PoolEintrag`, `FrageZuweisung`, `SendeErgebnis` (Move von Component-lokal zu Helper-Owner).
- `ExamLab/src/utils/batchExportLogic.test.ts` (~193 Z.) — **8 Vitest-Tests** mit `vi.mock('../services/apiService')` + `vi.mock('./poolExporter')`:
  - `erstelleAutoZuweisungen`: matching fachbereich → poolId+benoetigteTopicPools; no-match → empty poolId; ghost-id → übersprungen ohne Crash.
  - `fuehreBatchExportAus`: empty zuweisungen → leere Result + onFortschritt(0,0); 1-Frage-success → korrekt zugeordnete poolId/hash; 2-Fragen-same-pool → 1 API-Aufruf + onFortschritt-Reihenfolge `[[0,2], [2,2]]` (Spec-rev2-Mandat); api-erfolg-false → fehler-Text fan-out; api-throws → catch-Pfad mit Netzwerkfehler-Default.
  - `mkFrage(overrides: Record<string, unknown>) → Frage` Bundle-T-Doppel-Cast-Pattern wegen `Frage.fachbereich` strict-Union vs. Test-String-Daten.
- `ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx` (535 → 436 Z., -99 Z., -18.5%):
  - Imports: 1 multi-line Block neu (5 Z. für 2 Funktionen + 3 type-only-Imports via `verbatimModuleSyntax`-konformer `type`-Prefix), 2 Imports raus (`konvertiereZuPoolFormat`, `apiService`).
  - 3 Type-Defs entfernt (Z. 18-39 alt). `Phase`-Type bleibt lokal.
  - `weiterZuZuweisung`-Body: 18 → 9 Z. via `erstelleAutoZuweisungen`-Aufruf + for-loop `ladeTopicsFuerPool` über `benoetigteTopicPools`.
  - `handleExport`-Body: 85 → 13 Z. via `fuehreBatchExportAus`-Aufruf mit `onFortschritt`-Callback. `erfolgreiche` direkt durchgereicht (Helper-Result-Shape matcht `onErfolg`-Props-Shape).
  - JSX (~280 Z.) byte-identisch — nur Imports + Type-Defs + 2 Funktion-Bodies geändert.
  - `useAuthStore`-Hook für `email`-Read bleibt. Public-Props `{fragen, onSchliessen, onErfolg}` unverändert.

**Verifikation:**
- vitest **1480 passed | 4 todo | 1 skipped** (drift +8 vs Bundle-W.b-Baseline 1472, exakt wie Plan).
- tsc -b clean.
- 4 Lint-Gates clean: `lint:as-any` (Total 0), `lint:no-alert`, `lint:no-tests-dir`, `lint:musterloesung`.
- vite build erfolgreich (~3s, PWA generateSW OK, 256 Cache-Entries).
- Bestehende `FragenBrowser.test.tsx` (mockt BatchExportDialog als Komponente) **unverändert grün** — props-Surface byte-identisch.

**Hotspot-Bilanz Files >500 Z. (ohne data/test): 9 → 8** ✅. Verbleibend: HilfeSeite (906), ConfigTab (747), EinstellungenPanel (607), BilanzERFrage (589), AktivPhase (573), Layout (570), PruefungsComposer (526), ZeichnenCanvas (518).

**Browser-E2E SKIPPED** (low-risk Pure-Logic-Cut). Sicherungsnetz: vitest 1480 inkl. consumer-Mock-Test, Code-Quality-Reviewer hat byte-equivalence am Source-Byte-Level verifiziert. Spawn-Task „Browser-E2E post-merge falls Bug-Reports" als Notiz, falls UI-Issue auftaucht.

**Reviewer:** Spec-Reviewer ✅ (1. Pass + 4 advisory rev2-Empfehlungen integriert). Plan-Reviewer ✅ (1. Pass + 1 actionable rev2 Mock-Shape-Completeness). Per-Phase Spec+Code-Quality-Reviewer ✅ ✅ — Code-Quality-Reviewer Phase 2 explizit „APPROVED FOR MERGE" für Bundle X cumulative.

**Architektur-Patterns (etabliert/bestätigt):**
- **Topic-Vorlade-Side-Effect getrennt via Result-Field** — `erstelleAutoZuweisungen` liefert `benoetigteTopicPools: string[]` damit Component die State-Mutation `ladeTopicsFuerPool` ausserhalb fahren kann. Bonus: Set-basierte Dedup im Helper macht den Call-Count gleich der unique-Pool-Anzahl (vorher 1× pro Frage, no-op-guarded). Pattern-Erweiterung für Bundle-W.b Side-Effect-Aufteilung.
- **`onFortschritt`-Callback statt setState-Closure** — Helper bekommt `(gesendet, gesamt) => void` injiziert, Component verbindet im Aufruf mit `setFortschritt({gesendet, gesamt})`. Funktional äquivalent zu `setFortschritt(prev => ...)` weil per-Pool-Loop sequenziell `await`. Test #6 verifiziert die exakte Aufruf-Reihenfolge `[[0,2], [2,2]]`.
- **Type-Move ohne Re-Export-Bridge** wenn Pre-Cut-Grep zeigt: nur Source-File hat die Type-Definition. Bundle-U/W-Pattern.

**Lehren neu (Bundle X):**
- **Test-Mock-Shape-Completeness antizipieren** — Plan-Reviewer fand dass `apiService.schreibePoolAenderung` 7 Properties zurückgibt aber Test-Mocks nur 4 lieferten. Mit strict TS würde tsc auf fehlende Properties anspringen. Plan-rev2 ergänzte `aktualisiert/exportiert/commitSha`. **Pre-Plan-Verify-Schritt:** bei API-Mock-Tests den vollen Return-Type aus dem Service-File abkopieren, nicht aus Test-Vorbild raten.
- **Type-Move grep als Pre-Cut-Step** im Plan Phase 0 etabliert (analog Bundle-W.b semantischer Pre-Cut-grep gegen Twin-Module).

**Spawn-Tasks (post-Bundle-X cleanup):**
- **Bundle Y: Layout.tsx (570 Z.)** — niedrig-mittel Risiko, Cross-Cutting Layout-Component, Browser-E2E nötig.
- **Bundle Z+: AktivPhase / BilanzERFrage / EinstellungenPanel** — mittel-Risiko (Live-State / Fibu-Logik / Settings-Panel).
- **Bundle Mega: HilfeSeite (906) + ConfigTab (747)** — hoch-Risiko, grösste Files, eigene Cuts pro File nötig.
- **Knapp-drin: PruefungsComposer (526) + ZeichnenCanvas (518)** — kleiner Cut reicht.
- **Browser-E2E post-merge falls Bug-Reports zu Bundle X**.

**Out of Scope (Phase 5+ Roadmap):**
- 8 verbleibende Hotspot-Files in eigenen Bundles. Phase 5+ ist offene Roadmap, Reihenfolge nach Risiko-Profil + User-Priorität.

---

### Bundle W.b — uebungsStore State-Refactor ✅ MERGED (2026-05-08)

Branch `bundle-w-b/uebungsstore-state-refactor`. Folge-Cut nach Bundle W (uebungsStore.ts endete dort bei 540 Z. — knapp über <500-Schwelle Master-Spec). **uebungsStore.ts 540 → 498 Zeilen (-7.8%)** via 4 Pure-Logic-Cuts in `utils/ueben/`. **Hotspot-Bilanz Files >500 Z. (ohne data/test): 10 → 9** — uebungsStore endlich aus dem Set raus, Phase-4-Audit-Hotspot-Cut realisiert. +18 neue Vitest-Tests.

**Was geliefert (4 neue Pure-Helper-Files + 4 Test-Files + 1 Bonus-Twin-Cleanup):**
- `ExamLab/src/utils/ueben/fragetypGruppen.ts` (~18 Z.) — `SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][]` + `istSelbstbewertbar(typ): boolean`. Single-Source-of-Truth für die 5 selbstbewertbaren Typen (`freitext`/`visualisierung`/`pdf`/`audio`/`code`).
- `ExamLab/src/utils/ueben/fragetypGruppen.test.ts` (~30 Z.) — **3 Vitest-Tests** (Array-Content-Equality, alle 5 selbst-Typen → true, alle 15 nicht-selbst-Typen → false: vollständige Discriminated-Union-Coverage 5+15=20).
- `ExamLab/src/utils/ueben/sessionBlockBau.ts` (~45 Z.) — `erstelleSessionBlock({alleFragen, fach, thema, modus, quellen, fortschritte}) → { block, mastery }`. Mastery-Loop + 3-modus-Switch (standard/mix/repetition) byte-identisch von uebungsStore.ts Z. 90–109.
- `ExamLab/src/utils/ueben/sessionBlockBau.test.ts` (~140 Z.) — **6 Vitest-Tests** (modus=standard / mix mit quellen / repetition mit Dauerbaustelle / repetition leer / mastery-Default `'neu'` / leere Fragen). Mocks `./blockBuilder` + `./mastery` für Isolation.
- `ExamLab/src/utils/ueben/pruefeClientseitig.ts` (~35 Z.) — pure `pruefeClientseitig({session, frage, normalized}) → { korrekt, sessionUpdates: Pick<UebungsSession, 'antworten' \| 'ergebnisse' \| 'score'>, letzteMusterloesung: string \| null }`. **Side-Effect-Aufteilung explizit:** `useUebenFortschrittStore.getState().antwortVerarbeiten` bleibt im Store-Action (NICHT im Helper).
- `ExamLab/src/utils/ueben/pruefeClientseitig.test.ts` (~100 Z.) — **5 Vitest-Tests** (korrekt-true → score+1, korrekt-false → score unverändert, musterloesung-pass-through, undefined-musterloesung → `null`-Fallback, immutable-spread Original-`session.antworten` unverändert).
- `ExamLab/src/utils/ueben/loesungsPreloadFetch.ts` (~49 Z.) — `async ladeLoesungenViaPreload({block, gruppeId, fachbereich, user}) → Promise<LoesungsMap>`. Helper-Type widened auf `PreloadUser` (akzeptiert `UebenAuthUser | null | undefined` direkt, eliminiert 4 Type-Narrowing-Zeilen am Call-Site). **Side-Effect-Aufteilung explizit:** `await import('./authStore')` bleibt im Store-Action (NICHT im Helper).
- `ExamLab/src/utils/ueben/loesungsPreloadFetch.test.ts` (~87 Z.) — **4 Vitest-Tests** (user=null → leere Map ohne API-Call, success-Pfad mit `fragenIds.map(f.id)`, teilaufgaben-IDs propagiert in fragenIds, API-Error → leere Map + `console.warn`).
- `ExamLab/src/utils/ueben/korrektur.ts` Z. 11–25 — **Bonus-Twin-Cleanup** durch Code-Reviewer-Finding: pre-existing `SELBSTBEWERTUNGS_TYPEN` + `istSelbstbewertungstyp(typ)` Twin-Modul (anderer Naming als geplante Cut 1) entfernt. Memory-Lehre `feedback_audit_lager_disambiguierung`: Token-Audits sind syntaktisch, nicht semantisch — Twin mit anderem Naming wurde durch initiales `grep` nicht erfasst. Caller `UebungsScreen.tsx:9, 75` umgeleitet auf `istSelbstbewertbar` aus `fragetypGruppen.ts`. Single-Source-of-Truth wirklich erreicht.
- `ExamLab/src/components/ueben/UebungsScreen.tsx` Z. 9-10 + Z. 75 — Caller-Edit für Twin-Cleanup: Split-Import (`bewerteAntwortDetails` aus `korrektur` + `istSelbstbewertbar` aus `fragetypGruppen`). Use-Site auf neuen Helper-Namen.
- `ExamLab/src/store/ueben/uebungsStore.ts` (540 → 498 Z., -7.8%) — Imports oben: 4 neue (`istSelbstbewertbar`, `erstelleSessionBlock`, `pruefeClientseitig`, `ladeLoesungenViaPreload`), 4 entfernt (`erstelleBlock`/`erstelleMixBlock`/`erstelleRepetitionsBlock`/`istDauerbaustelle`/`MasteryStufe`/`ladeLoesungenApi`/`LoesungsMap`). Body: 4 Cut-Bereiche raus (Z. 90–109 mastery+block-switch, Z. 116–139 lösungs-preload, Z. 264–284 fast-path-body, Z. 263+382 inline-konstanten). Public-Surface unverändert.
- `scripts/audit-musterloesung.sh` Baseline `musterlosung` 307 → 310 — Backend-Vertrag-Identifier in Cut 3 Helper + Test (alles Lager-1 lowercase, kein Lager-Mixing).

**Verifikation:**
- vitest **1472 passed | 4 todo | 1 skipped** (drift +18 vs Bundle W Baseline 1454). Drift-Verteilung exakt: P1+3, P2+6, P3+5, P4+4.
- tsc -b clean (Output direkt geprüft, Memory `feedback_tsc_b_exit_misleading`).
- 4 Lint-Gates clean: `lint:as-any` (Total 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir`, `lint:musterloesung` (Baseline-Update +3 dokumentiert).
- vite build erfolgreich (~3s, PWA generateSW OK, 256 Cache-Entries).
- Existierende Store-Tests `uebungsStoreLoesungsPreload.test.ts` + `uebungsStorePruefen.test.ts` (11 Tests) **unverändert grün** — Korrektheits-Backup für Side-Effect-Aufteilung intakt.

**Hotspot-Bilanz Files >500 Z. (ohne data/test): 10 → 9** ✅ — `uebungsStore.ts` aus dem Set raus mit 498 Z. Verbleibende: HilfeSeite (906), ConfigTab (747), EinstellungenPanel (607), BilanzERFrage (589), AktivPhase (573), Layout (570), BatchExportDialog (535), PruefungsComposer (526), ZeichnenCanvas (518).

**Browser-E2E auf staging mit echtem SuS-Login (Account `wr.test@stud.gymhofwil.ch`):** SW-Cache vor E2E zurückgesetzt (2 SW unregistered + 2 caches deleted). Alle 5 Pflicht-Pfade ✅:
- Pfad 1 ✅: SuS-Login + Üben-Dashboard rendert mit 6-Tab-Header (Prüfen/Üben/Themen/Kurs/Fortschritt/Ergebnisse) + Empfehlung VWL + 3 Aktuelle Themen + BWL/Recht/VWL-Sektionen.
- Pfad 2 ✅: Sachenrecht-Thema-Detail öffnet → Filter MC (48 Fragen) → Übung starten → MC-Frage 1/10 rendert mit 4 Optionen ABCD (= `erstelleSessionBlock` Cut 2 + `ladeLoesungenViaPreload` Cut 4 funktionieren; sonst kein options-Layout möglich).
- Pfad 5 ✅: Antwort C gewählt → Antwort prüfen → Score springt 0/10 → 1/10, Option C grün ✓-markiert, 4 Hint-Texte, MUSTERLÖSUNG-Banner mit Art. 647d ZGB-Erklärung (= `pruefeClientseitig` Cut 3 funktioniert: `sessionUpdates.score+1`, `ergebnisse[id]=true`, `letzteMusterloesung` propagiert; `istSelbstbewertbar(MC)=false` Cut 1 branch-decision korrekt → fast-path betreten).
- Pfad 7 ✅: Übung beenden → "1 von 10 richtig" + Stars + 1-richtig/9-falsch + Sachenrecht-Label (= `berechneErgebnis` Bundle W weiter funktioniert; übersprungen-zählt-falsch-Logik bei früher Abgabe preserved).
- Pfad 10 ✅: Console 10 Messages, **0 Errors / 0 Warnings**. Highlight: `[Fortschritt] 1 Antworten zum Backend gesynced` bestätigt explizit dass Cut 3's Side-Effect-Aufteilung (fortschritt-store-Call bleibt im Store-Action) tatsächlich fired. Build-Timestamp `2026-05-08T09:58:23.508Z` bestätigt staging serviert Bundle-W.b-Build.

Pfad 6 (Selbstbewertung Freitext server-Pfad) skipped weil Sachenrecht-Set keinen Freitext-Typ enthielt; Cut 1 branch-decision implizit durch Pfad 5 validated.

**Reviewer:** Pro Cut Spec-Compliance + Code-Quality-Reviewer ✅. Cut 1 hatte Code-Reviewer-iteration mit Twin-Finding (siehe Bonus-Twin-Cleanup). Cut 4 + Final-Bundle-Reviewer **APPROVED FOR MERGE**.

**Architektur-Patterns (etabliert/bestätigt):**
- **Side-Effect-Aufteilung als Pattern für State-Refactor-Cuts** — bei Pure-Logic-Cut von async-stateful Methoden bleiben `set()`-Calls + Store-Cross-Calls (`useUebenFortschrittStore.getState().*`) + Dynamic-Imports (`await import('./authStore')`) **explizit im Store-Action**. Helper sind 100% pure compute, liefern `{ result, sessionUpdates, ... }` als plain Result-Object. Store-Action wendet via `set({ session: { ...session, ...result.sessionUpdates } })` an. Pattern macht Helper isoliert vitest-tetbar ohne Store-Mock-Setup, hält Side-Effect-Topologie sichtbar. Memory: `feedback_side_effect_aufteilung_pattern.md` (zu schreiben).
- **Type-Widening am Helper-Boundary statt Type-Narrowing am Call-Site** — Cut 4 widened `user`-Param-Type auf `PreloadUser` (mit optional `sessionToken?`) statt strict `{ email; sessionToken } | null`. Akzeptiert die echte `UebenAuthUser`-Source-Type-Shape, eliminiert 4 Narrowing-Zeilen am Call-Site, Early-Return-Guard `if (!user?.sessionToken)` deckt alle 4 Cases (null/undefined/empty-token/valid). Idiomatisch über Spec-Strict-Vorgabe.
- **Audit-Empfehlungen kritisch hinterfragen — Token-Audits finden NICHT semantische Twins mit anderem Naming** — Cut 1 plante `istSelbstbewertbar` als "Single-Source-of-Truth" — Code-Reviewer fand pre-existing `istSelbstbewertungstyp` (gleiche 5-Element-Array, anderer Naming) in `korrektur.ts`. Initial `grep istSelbstbewertbar` matchte den Twin nicht. **Pre-Cut-Audit-Schritt:** Wenn neuer Helper extrahiert wird, mit semantischen Begriffen suchen (`grep -rn 'freitext.*visualisierung.*pdf'`-Style) statt nur mit dem geplanten Identifier-Namen.
- **Bestehende Tests als Sicherungsnetz für Side-Effect-Aufteilung** — `uebungsStorePruefen.test.ts` (Real-Store-Integration mit echtem `pruefeAntwort` + echtem fortschritt-Store) blieb durch alle 4 Cuts grün. Stärkstes Behavioral-Parity-Signal beim State-Refactor — wichtiger als isolierte Helper-Tests.

**Lehren neu (Bundle W.b):**
- **Pure-Logic-Cut Saving-Forecast bei async-stateful Methoden ist konservativ schätzen** — Cut 3 Plan -8 Z., tatsächlich -5 Z. (4-Zeiler-Domain-Comment behalten als load-bearing). Cut 1 Plan -2 Z., tatsächlich -1 Z. (Import-Add offset). Cumulativ stimmte trotzdem (Cut 2 + Cut 4 unterboten Forecast). **Lesson:** Bundle-W.b-Forecast-Methodik mit Inline-Variable-Removal-Math (Subtract-Add-Net) statt Black-Box-Schätzung.
- **Twin-Modul-Discovery vor Cut planen** — Pre-Cut-Audit-Schritt etabliert: bei jedem neuen Pure-Helper, semantischen `grep` ausführen mit fragment der Konstante (z.B. `'freitext'.*'visualisierung'.*'pdf'`) statt nur Identifier-Name. Findet Twins mit Naming-Drift wie `SELBSTBEWERTUNGS_TYPEN` vs. `SELBSTBEWERTBARE_TYPEN`. Im Plan als Discovery-Phase einbauen.

**Spawn-Tasks (post-Bundle-W.b):**
- **Test-Migration:** `src/tests/uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts` zu co-located (`store/ueben/uebungsStore*.test.ts`) verschieben — analog Bundle Q-Heuristik B. Bundle W + Bundle W.b haben beide notiert; bleibt offen.
- **Final-Code-Reviewer-Pass für Bundle W:** Wenn Org-Usage-Limit zurückgesetzt ist. Bundle W endete im Self-Review-Modus, Bundle W.b hat alle Per-Cut-Reviewer durchgelaufen ✅.
- **Cut 5 Server-Response-Verarbeitung** (optional, ~10 Z. Saving) — `pruefeAntwortJetzt` Z. 326–363. Reserve-Spawn-Task aus Bundle-W.b-Spec § 9, **nicht aktiviert** weil Cut 4 alleine -18 Z. spart und Final-wc-l 498 unter Schwelle landet.
- **Future-Hotspot-Roadmap:** Phase 4 Audit komplett abgeschlossen. Hotspot-Bilanz von ursprünglich 17 (vor Bundle S) auf 9 reduziert. Phase 5+ Scoping (z.B. weitere Komponenten-Cuts oder andere Dimensionen aus Vereinfachungs-Audit) offen.

**Out of Scope (Phase 5+ Roadmap):**
- Phase 4 Audit komplett abgeschlossen mit Bundle W.b. Phase 5+ Scoping offen.

---

### Bundle W — uebungsStore Pure-Logic-Cut ✅ MERGED (2026-05-08)

Branch `bundle-w/uebungsstore-cuts`. **Drittes** Hoch-Risiko-Datei-Split der **Phase 4** aus dem Vereinfachungs-Audit (nach Bundle U useDrawingEngine, Bundle V PDFSeite). **uebungsStore.ts 684 → 540 Zeilen (-22%)** via 3 Pure-Logic-Cuts in `utils/ueben/`. **Phase-4-Audit komplett — letztes Hoch-Risiko-File abgearbeitet.** Erstmals Vitest-Coverage für Lösungs-Merge / Historien-Persistenz / Ergebnis-Berechnung (vorher 0 Tests, jetzt **+24**).

**Was geliefert (3 neue Pure-Logic-Files + 3 Test-Files + 1 Caller-Edit + 1 Audit-Baseline-Update):**
- `ExamLab/src/utils/ueben/loesungsMerge.ts` (~85 Z.) — `mergeLoesungInFrage(frage, slice) → Frage` + `mergeLoesungen(fragen, loesungen) → { fragen, preloaded }` byte-identisch von uebungsStore.ts Z. 18–102. Type-Imports: `Frage`, `LoesungsMap`, `LoesungsSlice`.
- `ExamLab/src/utils/ueben/loesungsMerge.test.ts` (~210 Z.) — **12 Vitest-Tests**: undefined-Slice Early-Return, 9 Top-Level-Felder Sammel-Test, Reihenfolgen-kritisch (`elemente`+`paare` überschreiben), `optionen`-Listen-Merge per id, alle 11 weiteren Listen-Felder Sammel-Test, mergeById-Edge-Cases (Item ohne id, null-Item, Patch ohne id), Immutability, leere LoesungsMap, teilaufgaben-Pfad mit TA-Slice-Tracking, Mix-Pfad. Nutzt `mkFrage(partial: Record<string, unknown>) → Frage` Doppel-Cast-Helper für Discriminated-Union-Constraint-Umgehung.
- `ExamLab/src/utils/ueben/historie.ts` (~33 Z.) — Type `GespeichertesErgebnis` + `HISTORIE_KEY` + `MAX_HISTORIE = 50` + `ladeHistorie()` + `speichereHistorie(historie)` byte-identisch von uebungsStore.ts Z. 104–134.
- `ExamLab/src/utils/ueben/historie.test.ts` (~70 Z.) — **5 Vitest-Tests** (load: leer/corrupt/parsed; save: 51-Items-Trim auf MAX_HISTORIE/Quota-silent). `beforeEach: localStorage.clear()` + `afterEach: vi.restoreAllMocks()` gegen Mock-Leakage.
- `ExamLab/src/utils/ueben/ergebnisBerechnung.ts` (~38 Z.) — pure `berechneErgebnis(session: UebungsSession | null) → SessionErgebnis` byte-identisch von uebungsStore.ts Z. 625–653-Body. Type-Imports + `getFragetext`.
- `ExamLab/src/utils/ueben/ergebnisBerechnung.test.ts` (~110 Z.) — **7 Vitest-Tests** (null-Session, leere fragen Div-by-zero, alle korrekt, Mix `toBeCloseTo(33.33, 1)`, übersprungen-zählt-nicht-falsch, unsicher+uebersprungen propagation, dauer-Berechnung beendet-vs-nicht-beendet mit `vi.useFakeTimers`).
- `ExamLab/src/store/ueben/uebungsStore.ts` (684 → 540 Z., -22%) — Imports oben: 3 neue (`mergeLoesungen`, `historie`-Bündel, `berechneErgebnis as berechneErgebnisPure`), 1 entfernt (`getFragetext`), 1 reduziert (`LoesungsMap, LoesungsSlice` → nur `LoesungsMap`). Body: 3 Code-Blöcke entfernt. `berechneErgebnis`-Store-Action wird zum 1-Zeiler-Delegator: `() => berechneErgebnisPure(get().session)`. Public-Surface unverändert.
- `ExamLab/src/components/ueben/UebungsEinsicht.tsx` Z. 2 — Caller-Edit: `GespeichertesErgebnis`-Type-Import auf `utils/ueben/historie` umgestellt (Domain-Owner-Prinzip, kein Re-Export-Smell).
- `scripts/audit-musterloesung.sh` Baseline `musterlosung` 295 → 307 — Backend-Vertrag-Identifier in Test-Code (+11 für loesungsMerge.test.ts + +1 für ergebnisBerechnung.test.ts mkFrage-Helper).

**Verifikation:**
- vitest **1454 passed | 4 todo | 1 skipped** (drift +24 vs Bundle V Baseline 1430). Drift-Verteilung: P1+12, P2+5, P3+7 wie geplant.
- tsc -b clean (Output direkt geprüft, Lehre `feedback_tsc_b_exit_misleading`).
- 4 Lint-Gates clean: `lint:as-any` (Total 0/Defensive 0/Undokumentiert 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` (keine `__tests__/`), `lint:musterloesung` (Baseline +12).
- vite build erfolgreich (~3s, PWA generateSW OK, 256 Cache-Entries).
- Existierende Store-Tests `uebungsStoreLoesungsPreload.test.ts` + `uebungsStorePruefen.test.ts` (11 Tests) unverändert grün — Korrektheits-Backup für byte-identical Cuts intakt.

**Hotspot-Bilanz Reality-Check:** Files >500 Z. (ohne data/test) **10 → 10** (uebungsStore.ts bleibt mit 540 Z. knapp im Set). Plan-DoD-Ziel „Hotspot verlassen" wäre <500 erforderlich; mit reinem Pure-Logic-Cut ohne State-Refactor nicht erreichbar (`starteSession` ~110 Z. async + `pruefeAntwortJetzt` ~120 Z. async waren explizit out-of-scope, weil State-coupled). Plan war optimistisch in der Schätzung 535. **Tatsächlicher Gewinn:** -144 Z. (-22%) + 24 isolierte Vitest-Cases + Pure-Logic-Owner-Trennung etabliert. Spawn-Task „Bundle W.b: State-Refactor für <500" für später.

**Browser-E2E auf staging mit echtem SuS-Login (Account `wr`):** Pfade 1+2+7+8+10 ✅. Force-Push `5263c63..dac7583 → preview`, Pages-Deploy 200 OK. SW-Cache nicht zurückgesetzt vor E2E (Bundle W ist kein Wire-Vertrag-Cut, alter SW lieferte aber sofort Bundle-W-Version — verifiziert via funktionsfähiger MC-Pfad).
- Pfad 1 ✅: SuS-Login + Üben-Dashboard rendert (Empfehlung VWL + 3 Aktuelle Themen + BWL/RECHT/VWL-Sektionen).
- Pfad 2 ✅: Sachenrecht-Thema-Detail öffnet → Filter MC → Übung starten → MC-Frage 1/10 rendert mit 4 Optionen (= `mergeLoesungen` Phase 1 funktioniert, sonst kein options-Layout).
- Pfad 7 ✅: Antwort B gewählt → Antwort prüfen klickt → Instant-Feedback mit korrekt-rot-Markierung + Musterlösung-Banner + 4 Hint-Texte (= `pruefeAntwortJetzt` Preload-Pfad → `mergeLoesungInFrage` hat options + musterlosung gemerged). Übung beenden → Zusammenfassung „0 von 10 richtig, 10 falsch" + „Recht — Sachenrecht..." (= `berechneErgebnisPure` Delegator funktioniert; übersprungen-Logik korrekt: 9 unbeantwortet zählen als falsch).
- Pfad 8 ✅: „Ergebnisse"-Tab zeigt persistierte Session (= `GespeichertesErgebnis`-Caller-Edit + `ladeHistorie` funktionieren).
- Pfad 9 ✅ (Bonus): `localStorage.getItem('ueben-session-historie')` zeigt vollständiges `GespeichertesErgebnis`-Schema mit `details: [10 Einträge]`, `dauer: 124751`, `quote: 0` (= `speichereHistorie` Phase 2 + `berechneErgebnis` Phase 3 in der Realität bestätigt).
- Pfad 10 ✅: Console-Pattern `error|Error|failed|Failed|Uncaught|TypeError` 0 Treffer.

**Reviewer:** Subagent-Dispatch durch Org-Usage-Limit blockiert. Self-Review-Modus durchgehend (Zeilen-Drift wc-l-Tracking + tsc/lint/build/vitest pro Phase + existierende Store-Tests grün als Korrektheits-Sicherung). Final-Reviewer-Spawn-Task chip'd für nachgelagerte Iteration.

**Architektur-Patterns (etabliert/bestätigt):**
- **Hybrid-Layout** `utils/ueben/` (statt `store/ueben/<sub>/`-Sub-Folder wie Bundle U/V) — semantisch konsistent zu existierenden Pure-Modulen `korrektur.ts`/`mastery.ts`/`fragetext.ts`/`blockBuilder.ts`. Sibling-Stores blieben flach in `store/ueben/`, Pure-Logic geht in passendes Domain-Verzeichnis.
- **Aliased-Import bei Store-Action-Naming-Konflikt** (`berechneErgebnis as berechneErgebnisPure`) — technisch optional (JS-Module-Scope löst auch ohne Alias auf, analog `ladeHistorie`), stilistisch dringend empfohlen für Lesbarkeit (Delegator-Pattern explizit machen). Spec rev3 dokumentiert.
- **Domain-Owner-Type-Migration mit Caller-Edit** statt Re-Export-Bridge im Store (`UebungsEinsicht.tsx` importiert `GespeichertesErgebnis` direkt aus neuem Owner `historie.ts`). Konsistent zu Bundle U Dead-Surface-Removal.
- **Top-Level-Funktion mit gleichnamiger Store-Action OK** ohne Alias (`ladeHistorie` 2× — Top-Level-Import + Action). Property-Key ist nicht im Scope der eigenen Value-Expression (JS-Object-Literal-Scoping).
- **`mkFrage(partial: Record<string, unknown>) → Frage` Doppel-Cast-Helper** für Test-Code, der Discriminated-Union-Constraint-Umgehung braucht (z.B. Frage mit `elemente` UND `paare` für Branch-Coverage).

**Lehren neu (Bundle W):**
- **Plan-Hotspot-Schätzung kalibrieren bei Pure-Logic-Cut auf grossen Stores** — Reality-Check: 684 → 540 Z. ist die natürliche Untergrenze für reine Helper-Extraktion bei einem 18-Action-Zustand-Store. State-Coupled-Pfade (`starteSession`, `pruefeAntwortJetzt`) brauchen separates Bundle. Spawn-Task „W.b" für State-Refactor.
- **Audit-Baseline für Field-Drift bei Test-Hinzufügung antizipieren** — Tests, die domain-typed Backend-Vertrag-Identifier (`musterlosung` no-`e`) verwenden, erhöhen die `audit-musterloesung.sh`-Baseline. Bundle W: +12 Token (11 in loesungsMerge.test.ts + 1 in ergebnisBerechnung.test.ts mkFrage). Baseline-Update gehört zum Bundle-Commit.

**Spawn-Tasks (post-Bundle-W cleanup, chip'd):**
- **Bundle W.b: State-Refactor für Hotspot-Verlassen** — `starteSession`-Block-Builder + `pruefeAntwortJetzt`-Async-Logic in extra Helper. Schätzung: -40+ Z. → ~500 Z. uebungsStore.ts. Höher-Risiko, separates Bundle.
- **`istSelbstbewertbar`-Konstante DRY** (Duplikat in `pruefeAntwortJetzt` Z. 263 + `selbstbewertenById` Z. 382) → `utils/ueben/fragetypGruppen.ts` mit `SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][]`.
- **Test-Migration**: `src/tests/uebungsStore*.test.ts` zu co-located in `store/ueben/` verschieben (analog Bundle Q Heuristik B).
- **Final-Code-Reviewer-Pass** für Bundle-W-Branch (war durch Org-Usage-Limit blockiert) — kann post-merge auf `main` als Code-Review-Task laufen.

**Out of Scope (Phase 5+ Roadmap):**
- Phase 4 Audit komplett abgeschlossen mit Bundle W. Phase 5+ Scoping offen.

---

### Bundle V — PDFSeite Pure-Cut + Hook-Extraktion ✅ MERGED (2026-05-08)

Branch `bundle-v/pdfseite-split`. Zweites Hoch-Risiko-Datei-Split der **Phase 4** aus dem Vereinfachungs-Audit. **PDFSeite.tsx 950 → 419 Zeilen (-56%)** — Hotspot verlassen, Bilanz Code-Files (>500 Z., ohne data/test) **11 → 10**. Erstmals Vitest-Coverage für PDF-Selection-DOM + SVG-Annotation-Rendering + Text-Edit-State + Drag-Math (vorher 0 Tests, jetzt **+29**).

**Was geliefert (4 neue Sub-Files in neuem Sub-Folder `pdf/seite/` + 4 Test-Files + 1 Source-Edit):**
- `ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.ts` (106 Z.) — 5 Pure-DOM-Helpers: `erzeugeId` (UUID-Wrapper) + `findeSpanRects` (DOMRect-Array via data-offset-Walk) + `leseTextauswahl` (DOM Selection → PDFTextRange) + `findeSpanRectsRelativ` (DOMRect-zu-Container-Coords) + `berechneFallbackRects` (textItem-Fallback ohne DOM) + `SimpleRect`-Interface. Byte-identisch von Original Z. 32–95 + 914–950.
- `ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.test.ts` (139 Z.) — **11 Vitest-Tests** (UUID-Format, Span-Overlap-Branches, Out-of-Bounds, jsdom-getSelection-Stubs, Coordinate-Math, multi-textItem-Range). Plan-rev2 Code-Block hatte 4 berechneFallbackRects-Tests — Implementer-Concern dokumentiert.
- `ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.tsx` (223 Z.) — `renderSVGOverlay` (1 öffentlicher Export, Switch-Dispatcher) + 5 module-private Sub-Renderer für Highlight (fillOpacity 0.35), Label (Badge mit Kategorie-ID-Slice 8), Kommentar (💬-Marker), Freihand (Path mit M+L Commands + Selected-BBox), Text (transform mit rotation). Byte-identisch von Original Z. 697–912.
- `ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx` (104 Z.) — **8 Vitest-Tests** (jeder Annotation-Typ + Selected-Branch für Freihand/Text + leeres Array). `@testing-library/react` `render` für SVG-Inspektion.
- `ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.tsx` (120 Z.) — Hook für Text-Annotation-Doppelklick-Edit-Lifecycle: `editierendeAnnotation` State + `textEditInputRef` (Hook-internal) + `handleDoubleClick` + `handleTextEditSave` + neuer `beendeEdit`-Bridge-Callback + `editOverlay` ReactNode (orange-bordered Input). Bundle-T.d `useTextOverlay`-Pattern. **Keine `as PDFTextAnnotation`-Casts** — Discriminated-Union narrowed nach werkzeug-Filter (Plan-rev2-Korrektur, byte-identisch zum Original ohne Casts).
- `ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.test.tsx` (130 Z.) — **5 Vitest-Tests** (Idle-State, non-Text-no-op, Text-Trigger, beendeEdit-Reset, Enter+Trim+Commit). Test #5 nutzt Wrapper-Komponente weil `renderHook` allein das `editOverlay` nicht im selben React-Tree mountet (Lehre für JSX-from-Hook-Tests).
- `ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.ts` (185 Z.) — Hook mit Drag (Text + Freihand) **und** Freihand-Drawing in einer State-Maschine: `dragRef` + `istZeichnung` + `zeichnungsPfad` Refs + `handleDrawStart` (8 Dep-Slots = 6 Original + 2 Refs) + `handleDrawMove` (5 Slots = 2 Original + 3 inkl. fehlendes `annotationen` aus Original) + `handleDrawEnd` (5 Slots = 3 + 2 Refs). Byte-identisch von Original Z. 132–134 + 377–516.
- `ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.test.ts` (127 Z.) — **5 Vitest-Tests** (no-op ohne Selektion, Drag-Start-Setup, Text-Position-Delta, Freihand-Punkte-Verschiebung mit `toBeCloseTo`-FP-Toleranz analog Bundle U, Drag-End-Cleanup mit konkreter `data-drag-orig-punkte`-Removal-Assertion). Canvas-2D-`ctx.lineTo`-Aufrufe via Browser-E2E abgedeckt.
- `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` (950 → 419 Z., -56%) — reine React-Component: 17 Props + 4 Layer-Refs + 2 useEffects (PDF-Render + Canvas-Resize) + textLayerSpans-JSX-Map + 2 Hook-Aufrufe (Bundle-T.d-Destrukturierungs-Pflicht) + handleMouseUp + handleKategorieSelect + handleClick (5-Tool-Dispatcher mit `istEditierend`/`beendeEdit`-Bridge statt inline-State-Reset) + handleKommentarSave + handleTextSave + 4-Layer-JSX + cursor + 4 Overlays/Popovers. `PDFFreihandAnnotation`-Type-Import entfernt (nicht mehr genutzt); `PDFTextAnnotation`-Import bleibt (handleTextSave + Lösch-Button-IIFE).

**Bonus-Bugfix (Phase 4 entdeckt):** Original `handleDrawMove` (`PDFSeite.tsx@c79747c:438-489`) referenzierte `annotationen.find(...)` aber hatte `annotationen` nicht im Dep-Array — latent stale-closure-Bug bei schneller Annotationen-Mutation während Drag. Lint-mandated Dep-Addition im Hook fixt das als Side-Effect (nicht byte-identisch in Dep-Array, aber byte-identisch in Body). Dokumentiert via Phase-4 Code-Quality-Reviewer.

**Tests:** vitest **1430 passed | 4 todo | 1 skipped** (drift +29 von 1401 baseline). Drift-Verteilung: Phase 1: +11, Phase 2: +8, Phase 3: +5, Phase 4: +5 = 29 wie geplant. tsc + 4× lint (`as-any`, `no-tests-dir`, `no-alert`, `musterloesung`) + build alle clean. **Memory-Lehre tsc-grep angewandt** — Output direkt geprüft, nicht nur Exit-Code.

**Reviewer:** 4× Per-Phase Spec-Compliance-Reviewer + 4× Per-Phase Code-Quality-Reviewer + 1× Final Code-Reviewer + 2× Spec-Reviewer + 1× Plan-Reviewer alle APPROVED. Plan-Reviewer-Findings (Step-Reihenfolge invertiert für Phase 1+2, `as PDFTextAnnotation`-Cast-Removal in Phase 3, Test #5-Sharpening in Phase 4) und Spec-Reviewer-Issues (`.tsx`-Endung für JSX-Hook, Dep-Anzahlen) alle vor Implementation eingearbeitet.

**Browser-E2E partial (analog Bundle U):** Build deployed via `git push --force-with-lease origin bundle-v/pdfseite-split:preview`, Pages 200 OK. SW-unregister + caches.delete + reload (Memory-Lehre Bundle N). Echter LP-Login (durandbourjate@gmail.com) via Google One-Tap. LP-Dashboard rendert ✓, Prüfen-Tab ✓, 22-Fragen-Editor mit PDF-Annotation-Frage sichtbar ✓, 0 PDFSeite-spezifische Console-Errors. Pfade 1-11 (PDFSeite-interaktiv) **nicht via Auto-E2E** wegen pre-existing `useFrageMode-FrageModeProvider`-Error in PruefungsComposer-Vorschau-Chunk (NICHT Bundle-V-related, da V nur PDFSeite + neue pdf/seite/-Files berührt). Vitest-Coverage + 4× Reviewer + Final-Reviewer ist Safety-Net-Ersatz analog Bundle U.

**Lehren neu (Bundle V):**
- **JSX-from-Hook-Test-Pattern (Phase 3)**: Hook-Result mit `editOverlay: ReactNode` braucht in Tests Wrapper-Komponente, weil `renderHook` allein das Overlay nicht im selben React-Tree mountet — sonst Stale-Closure beim Input-Interaction-Test. Memory-File `feedback_jsx_from_hook_test_wrapper.md`.
- **React 19 useRef-Typing (Phase 3)**: `useRef<T>(null)` → `RefObject<T | null>` (nicht `RefObject<T>`). Plan-Code-Snippets immer `| null` schreiben. Plan-rev3 Vorlage etabliert. Memory-File `feedback_react19_useref_null_type.md`.
- **Bonus-Bugfix durch Lint-Migration (Phase 4)**: Lint-mandated Dep-Array-Additions beim Hook-Move können latent stale-closure-Bugs als Side-Effect fixen — `handleDrawMove` Original hatte `annotationen` nicht in Deps obwohl im Body verwendet. Pattern: bei Hook-Cuts den ursprünglichen Dep-Array nicht blind übernehmen, sondern lint folgen lassen + gefundene Diffs im Reviewer-Step prüfen. Memory-File `feedback_hook_cut_dep_array_bonus_bugfix.md`.

**Spawn-Tasks (post-Bundle-V cleanup, chip'd):**
- `leseTextauswahl` dead-Ternary in `pdfSelection.ts` Z. 49-57 — investigate intended `range.startOffset - so` vs. simplification.
- `data-drag-orig-punkte` DOM-as-state-Smell in `usePDFDrawing.ts` Z. 122-127 — promote orig-points-string ins `dragRef`-Object statt HTML-Attribut.

**Spawn-Tasks (Memory-TODO, optional):**
- `_zoom`-Param in `pdfAnnotationenSVG.tsx` `renderHighlight`/`renderLabel` (unused, underscore-prefix preserved) — drop signature wenn Phase-3+4 nicht benötigt.
- macOS-Datei-2-Duplikate aufräumen (`ToastContainer 2.tsx`, `ToastContainer.test 2.tsx`) — pre-existing Worktree-Drift, nicht Bundle V.

**Out of Scope (für nächste Sessions):**
- Bundle W — `uebungsStore.ts` Hoch-Risiko-Split (684 Z., Lösungs-Merge + Session-Historie). Letztes Hoch-Risiko-File aus Audit Phase 4.
- Phase-5+ Roadmap noch offen.

---

### Bundle U — useDrawingEngine Pure-Logic-Cut ✅ MERGED (2026-05-08)

Branch `feature/bundle-u-usedrawingengine-split`. Erstes Hoch-Risiko-Datei-Split der **Phase 4** aus dem Vereinfachungs-Audit. **useDrawingEngine.ts 752 → 157 Zeilen (-79%)** — Hotspot verlassen, Bilanz Code-Files (>500 Z., ohne data/test) **12 → 11**. Erstmals Vitest-Coverage für Reducer/Geometrie/Serialisierungs-Kern (vorher 0 Tests, jetzt +44).

**Was geliefert (4 neue Pure-Logic-Files + 3 Test-Files + 1 Caller-Edit):**
- `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.ts` (159 Z.) — `canvasReducer` (11 Action-Types) + `verschiebePoint` (privat) + `verschiebeCommand` (exportiert für Tests, einzige bewusste Signatur-Änderung) + `initialState` + `CanvasAction`-Type. Byte-identisch.
- `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.test.ts` (197 Z.) — **20 Vitest-Tests** (alle 11 Action-Types + 6 No-Op-Edge-Cases inkl. Phase 1 Hotfix UPDATE_COMMAND-no-op + 3 verschiebeCommand-Sub-Type-Tests).
- `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.ts` (198 Z.) — `vereinfachePunkte` (RDP, toleranz=0.8) + `findeCommandBeiPunkt` (Touch 16px / Maus 8px via `'ontouchstart' in window` zur Aufruf-Zeit) + `berechneBoundingBox` (PADDING 6) + 2 private Helpers (punktZuLinieAbstand, punktAbstandZuSegment). Byte-identisch.
- `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.test.ts` (156 Z.) — **18 Vitest-Tests** (RDP 5 Branches inkl. Mikro-Wackler unter Toleranz, Hit-Testing pro DrawCommand-Typ, Touch/Maus-Toleranz beider Branches via `vi.stubGlobal('ontouchstart', null)`, bbox 4 Sub-Types). Text-bbox `breite` mit `toBeCloseTo(33.6, 5)` wegen FP-Präzision von `18*0.6*2`.
- `ExamLab/src/components/fragetypen/zeichnen/drawingRendering.ts` (205 Z.) — `zeichneCommand` (7 Sub-Types Switch) + `renderCanvas` (clearRect → drawImage → forEach commands → aktiverCommand → Selektions-Rahmen `#3b82f6` lineDash[5,4]) + `zeichnePfeilspitze` (privat, `Math.PI/7`-Winkel, `max(10, breite*4)`-Länge). **Kein Vitest** — Canvas-2D-API nicht in jsdom verfügbar (Browser-E2E reicht). `void pfeilBreite;` Tot-Code-Indikator byte-identisch übernommen — Cleanup als Spawn-Task.
- `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.ts` (32 Z.) — `rundePoint` (x/y auf 0.1, druck auf 0.01) + `serializiereCommand` (Stift: vereinfachen → runden; Rest: nur runden). Byte-identisch. Importiert `vereinfachePunkte` aus `drawingGeometrie`.
- `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.test.ts` (72 Z.) — **6 Vitest-Tests** (rundePoint mit/ohne Druck/Drop-undefined, serializiereCommand Stift-RDP-Coupling + linie + text).
- `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts` (752 → 157 Z., -79%) — reiner React-Hook: useReducer + 13 Dispatch-useCallbacks + 2 Render-useCallbacks + 3 Persistenz-useCallbacks + Return-Object. Re-Export-Bridge entfernt (Dead-Surface).
- `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` (517 → 518 Z., +1) — Z. 5 1 Import in 2 zerlegt: `useDrawingEngine` aus `./useDrawingEngine`, `findeCommandBeiPunkt` direkt aus `./drawingGeometrie`.

**Verifikation:**
- vitest **1401 passes | 4 todo** (drift +44 vs T.f-Baseline 1357: 20 reducer + 18 geometrie + 6 serialisierung) ✓
- tsc -b clean (Output direkt geprüft, Lehre `feedback_tsc_b_exit_misleading`) ✓
- 4 Lint-Gates clean: `lint:as-any` (Total 0/Defensive 0/Undokumentiert 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` (keine `__tests__/`), `lint:musterloesung` (Baseline unverändert) ✓
- vite build erfolgreich (~3s, PWA generateSW OK, 256 Cache-Entries) ✓
- Browser-E2E auf staging — Smoke-Test: Pfad 1 (LP-Editor öffnet Zeichnen-Frage anlegen) ✓ und Pfad 12 (0 Console-Errors) ✓; Pfade 2-11 nicht via Browser-Auto verifiziert (Editor zeigt kein Canvas, nur Konfig — Auto-E2E zu zeit-kostspielig). Vertrauen auf Per-Phase-Reviewer + Final-Reviewer + 17 byte-identische Invarianten + 44 Unit-Tests.
- Per-Phase-Code-Reviewer (5×): **APPROVED**. Final-Code-Reviewer (Bundle U komplett): **APPROVED FOR MERGE**.

**Architektur-Patterns (etabliert/bestätigt):**
- **Pure-Logic-Cut nach Domain** (Reducer / Geometrie / Rendering / Serialisierung) — Co-Located in `zeichnen/`-Folder analog Bundle T.d.
- **Test-Hybrid**: Vitest für jsdom-kompatible Pure-Logic, Browser-E2E für Canvas-2D-API (Master-Spec 4.2).
- **Dead-Surface-Removal** statt Re-Export-Stub: ungenutzte `vereinfachePunkte`, `zeichneCommand`-Re-Exports komplett entfernt; `findeCommandBeiPunkt` direkt im Konsumenten korrigiert (1 Konsumer = 1 Import-Edit).
- **Transient-Re-Export-Bridge** während Multi-Phase-Cut: Phase 2-4 hatten `export { ... } from './drawing...'`-Bridge, damit Konsumer durchgehend kompiliert. Phase 5 atomar entfernt.
- **Deliberate Non-Byte-Identical-Signatur-Änderung dokumentieren**: `verschiebeCommand` neu exportiert (war privat) für Test-Zugriff. Plan-Reviewer-Iteration explizit dokumentiert.
- **FP-Toleranz-Tests**: `toBeCloseTo(...)` statt `toEqual` für Float-Approximationen (z.B. `18*0.6*2 = 33.5999...`).

**Out of Scope (Spawn-Tasks für nächste Sessions):**
- Bundle V — `PDFSeite.tsx` Hoch-Risiko-Split (950 Z., 17 Props, DOM-Selection + PDF.js + Canvas).
- Bundle W — `uebungsStore.ts` Hoch-Risiko-Split (684 Z., Lösungs-Merge + Session-Historie).
- `void pfeilBreite;` Tot-Code-Cleanup in `drawingRendering.ts` Z. 35.
- Browser-E2E-Pfade 2-11 nachholen bei nächster Gelegenheit (manuell durchspielen, Smoke-Test in laufender Session statt Auto-Verifikation).

---

### Bundle T.f — LPStartseite Hook + Komponenten-Extraktion ✅ MERGED (2026-05-07)

Branch `feature/bundle-t-f-lpstartseite`. **Letztes** Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Hoch-Risiko-File-Split per 3 Hooks + 1 Utility + 5 Komponenten-Splits. **LPStartseite.tsx 1043 → 382 Zeilen (-63%)** — übertrifft Master-Spec-Ziel <500. Hotspot-Bilanz Files >500 Z.: **8 → 7**. **Bundle T komplett (6/6 Sub-Bundles auf main).**

**Was geliefert (12 neue Files + 1 modifiziert):**
- `ExamLab/src/utils/lpEinrichtungSync.ts` (63 Z.) — pure React-free Utility: Sync-Konstanten + 3 async Funktionen (syncFragenSeriell, syncEinrichtungsPruefung, syncEinrichtungsUebung). `_backendConfigs` dead-param entfernt, `toast.warning()` durch `onError(msg)` Callback ersetzt.
- `ExamLab/src/utils/lpEinrichtungSync.test.ts` (107 Z.) — **7 Vitest-Tests** (Guard, 200ms Serial-Pause, Sync-Reihenfolge, onError bei Backend-Fehler, beide Pruefung+Uebung Pfade).
- `ExamLab/src/hooks/useLPConfigFiltering.ts` (110 Z.) — 6 Filter-Memos + `letzteFuenf` + `hatAktiveFilter` + interner `filtereConfigs`-Helper byte-identisch. 8 Outputs.
- `ExamLab/src/hooks/useLPConfigFiltering.test.ts` (184 Z.) — **20 Vitest-Tests** (verfuegbareFachbereiche, verfuegbareGefaesse, summativ/formativ-split, gefilterteConfigs (suchtext/Fach/Status/Sortierung), gefilterteUebungen, letzteFuenf 3 Branches, hatAktiveFilter 5-fold).
- `ExamLab/src/hooks/useLPFavoriten.ts` (37 Z.) — 4 Favoriten-Memos byte-identisch.
- `ExamLab/src/hooks/useLPFavoriten.test.ts` (107 Z.) — **6 Vitest-Tests** (empty, typ-Filter, datum-desc-sort, formativ-split, rerender, non-existent-edge).
- `ExamLab/src/hooks/useLPDashboardData.ts` (184 Z.) — 5 useState + 95-Z grosser Lade-useEffect + `reload()` für `handleZurueck` + `findeTrackerSummary`-Callback. **Kein Vitest** (Master-Spec §4.2: 4× Store-Async-Orchestration, Browser-E2E reicht). eslint-disable mit Begründung-Kommentar (toast = useToast Modul-Singleton, Identity stabil).
- `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx` (132 Z.) — PruefungsKarte (Z. 916-1010) + TrackerBadge (Z. 1013-1038) byte-identisch ko-located. **Hotfix:** 5 JSX-Kommentare aus Quelle restauriert.
- `ExamLab/src/components/lp/startseite/FilterLeiste.tsx` (104 Z.) — **DRY**: konsolidiert die 2 nahezu-identischen Filter-Toolbars (Z. 537-606 Übungen + Z. 688-755 Prüfungen) in EINE Komponente. 14 Props inkl. `aktionSlot: ReactNode` für unterschiedliche Neue-Buttons. Gefäss-Sektion bedingt gerendert.
- `ExamLab/src/components/lp/startseite/MultiDashboardDialog.tsx` (55 Z.) — Multi-Dashboard-Auswahl-Dialog (Z. 778-818) byte-identisch.
- `ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx` (111 Z.) — Übungen-Tab-Body (Z. 519-634) inkl. Skeleton/Empty/Liste, konsumiert FilterLeiste + PruefungsKarte.
- `ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx` (202 Z.) — Prüfen-Modus-Body (Z. 643-862) inkl. Skeleton/Tracker/Empty/Liste, konsumiert FilterLeiste + PruefungsKarte + MultiDashboardDialog.
- `ExamLab/src/components/lp/LPStartseite.tsx` (1043 → 382 Z., -63%) — Komposition aller 8 Extraktionen + 4 kleine useEffect's bleiben im Body (kurs-redirect, localStorage-kurs, deepLink-config, beforeunload). Wrapper-Pattern (Dispatcher + Inner) byte-identisch erhalten.

**Verifikation:**
- vitest **1357 passes** (drift +33 vs T.e-Baseline 1324: +7 utility, +20 useLPConfigFiltering, +6 useLPFavoriten) ✓
- tsc -b clean (Output direkt geprüft) ✓
- 4 Lint-Gates clean: `lint:as-any` (Total 0/Defensive 0/Undokumentiert 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` (keine `__tests__/`), `lint:musterloesung` (Baseline unverändert) ✓
- vite build erfolgreich (2.99s, PWA generateSW OK, 256 Cache-Entries 5166 KiB) ✓
- Browser-E2E auf staging mit echtem LP-Login (Yänu/durandbourjate@gmail.com, SW-Cache vorab zurückgesetzt) — **4/15 Pfade ✅** (Pfade 3-12, 14 backend-blockiert via Apps-Script `TypeError: Failed to fetch` — pre-existing infrastruktur, NICHT Refactor-bedingt):
  - Pfad 1 ✅ LP-Dashboard lädt (Header + 5 Tabs Favoriten/Prüfen/Üben/Fragensammlung/Papierkorb)
  - Pfad 2 ✅ Tab-Switch alle 4 Modi + Sub-Tabs (Übungen/Durchführen/Analyse) funktionieren
  - Pfad 13 (partial) ✅ Backend-Fehler-Banner aus `LPPruefungenAnsicht` rendert korrekt
  - Pfad 15 (partial) ✅ Keine JS-Errors vom Refactor (nur infrastructure Backend-Errors)
- Final Code-Reviewer (Bundle T.f komplett): **APPROVED FOR MERGE** mit Bestätigung Hook-Order-Stability + byte-identical Behavior + Cross-File-Konsistenz aller 5 Komponenten-Splits.

**Architektur-Patterns (etabliert/bestätigt):**
- **3-Hook-Hypothese aus Master-Spec konsolidiert auf 2** (`useLPLetzteAktivitaet` als Sub-Computation in `useLPConfigFiltering` integriert, da nur 1 Memo).
- **Hook-Result-Destrukturierung** (Bundle T.d Lehre): Caller destrukturiert alle Hook-Outputs in stabile Namen, keine `result.foo`-Zugriffe.
- **Sub-Folder-Pattern**: 5 Komponenten in `lp/startseite/`-Sub-Folder (analog T.b `tkonto/`, T.c `fragenbrowser/`, T.d `zeichnen/`, T.e `dashboard/`).
- **Co-Location bei single-consumer**: TrackerBadge in PruefungsKarte.tsx co-located (analog T.e themaDetailHelpers).
- **DRY-Komponente mit `aktionSlot: ReactNode`-Pattern**: FilterLeiste eliminiert ~70 Z. Duplikat zwischen Übungen/Prüfungen-Toolbars.
- **React-free Utility statt Hook**: `lpEinrichtungSync` als pure module (testbar mit fake-timers + mock-modules statt React-Hooks-Mocks).

**Bewusste Verhaltens-Vereinheitlichung (im Spec dokumentiert):**
- FilterLeiste rendert Gefäss-Spacer NICHT mehr im Prüfen-Modus wenn `verfuegbareGefaesse=[]` (Source rendet ihn unconditional). In der Praxis kein User-sichtbarer Unterschied, jede LP hat Gefässe konfiguriert.

**Out of Scope / Spawn-Tasks für nächste Sessions:**
- `useLPDashboardData` exponiert `setConfigs`/`setConfigsLadeStatus`-Setter, die in slim LPStartseite nicht mehr konsumiert werden — könnte in nachfolgender Cleanup-Session entfernt werden falls kein Konsument materialisiert.
- `reload()` setzt `backendFehler` nicht zurück (pre-existing source-bug byte-identisch erhalten) — bei erfolgreichem Reload nach vorheriger Backend-Fehlersituation bleibt Banner sichtbar bis Reload der Seite.
- Restliche 11 Browser-E2E-Pfade bei lebendem Apps-Script-Backend nachholen.
- Phase-3-Wahl: P-Migration (Backend-Vertrag musterlosung) vs. Bundle U (PDFSeite/useDrawingEngine/uebungsStore Hoch-Risiko).

---

### Bundle T.e — Dashboard-Üben Hook-Extraktion ✅ MERGED (2026-05-07)

Branch `feature/bundle-t-e-dashboard-ueben`. Fünftes Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Hoch-Risiko-File-Split per 2 Hook-Extraktionen + 2 Komponenten-Splits + 1 Hotfix-Helper. **Dashboard.tsx 930 → 489 Zeilen (-47%)** — aus Hotspot raus. Hotspot-Bilanz Files >500 Z.: **9 → 8**.

**Was geliefert (5 neue Files + 1 Hotfix):**
- `ExamLab/src/hooks/ueben/useDashboardLoad.ts` (53 Z.) — 2 useState + 2 separate useEffect's (Fortschritt+Auftraege parallel zu Fragen+Freischaltungen) byte-identisch. JSDoc dokumentiert no-consolidation-Regel.
- `ExamLab/src/hooks/ueben/useThemenKomputationen.ts` (271 Z.) — 8 useMemo's byte-identisch (themenMap, verfuegbareFaecher, sichtbareThemenListe, letzteUebungProThema, themenSektionen, themaDetail, gefilterteFragen, empfehlungen). 18-Property-Inputs-Object, 8 Outputs. ThemenInfo-Type-Export.
- `ExamLab/src/hooks/ueben/useThemenKomputationen.test.ts` (363 Z.) — **22 Vitest-Tests** via `renderHook` + Mocks für `authStore`, `berechneEmpfehlungen`, `poolTitel` + 3 Funktions-Refs als `vi.fn()`-Stubs.
- `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx` (172 Z.) — Inline-Funktion (Source Z. 728-851) + 3 Konstanten (SCHWIERIGKEIT_LABELS/STERNE/TYP_LABELS) byte-identisch.
- `ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx` (80 Z.) — FilterSection + Chip + FortschrittsBalken + MasteryBadges byte-identisch.
- **Hotfix#1:** Inline `renderThemaKarte(info, status)`-Helper im Dashboard-Body — DRY-Refactor für 3 nahezu byte-identische ThemaKarteMitPreWarm-Blöcke (Z. 403-417, 442-455, 471-484). Brachte 513 → 489 Z. → Hotspot-Set verlassen.

**Verifikation:**
- vitest **1324 passes** (drift +22 vs T.d-Baseline 1302) ✓
- tsc -b clean (Output direkt geprüft, Lehre `feedback_tsc_b_exit_misleading`) ✓
- 4 Lint-Gates clean: `lint:as-any` (Total 0/Defensive 0/Undokumentiert 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` (keine `__tests__/`), `lint:musterloesung` (Baseline unverändert) ✓
- vite build erfolgreich (3.03s, PWA generateSW OK) ✓
- Browser-E2E auf staging mit echtem SuS-Login (SW-Cache vorab zurückgesetzt) — **9/11 Pfade ✓** (Pfade 8+10 skipped — Out-of-Scope-Features Lernziel-Indikator-Sichtbarkeit + LernzieleAkkordeon-DeepLink):
  - Pfad 1 ✅ Dashboard lädt (Empfehlung "Sachenrecht" + 3 Aktuelle Themen + Fach-Chips + BWL/RECHT-Sektionen)
  - Pfad 2 ✅ Fach-Filter Recht → 1 Aktuell + RECHT(9 Themen)
  - Pfad 3 ✅ Sortierung "Zuletzt geübt" (konsistenter Fallback bei leeren Fortschritten)
  - Pfad 4 ✅ ThemaKarte-Klick → ThemaDetailView vollständig (Header + FortschrittsBalken + 3 FilterSections für 7 Unterthemen + 3 Schwierigkeiten + 6 Fragetypen)
  - Pfad 5 ✅ Filter-Chip "Einfach" → "25 von 73 Fragen ausgewählt"
  - Pfad 6 ✅ "Übung starten" → 10 gefilterte Fragen geladen, MC-Frage rendert
  - Pfad 7 ✅ Mix-Dialog öffnet, themenMap an Dialog gepasst (BWL+Recht)
  - Pfad 9 ✅ BWL-Sektion einklappen → localStorage `examlab-ueben-fach-collapsed=["BWL"]` persistiert
  - Pfad 11 ✅ 0 Console-Errors (auch nach Hard-Reload)
- Final Code-Reviewer (Bundle T.e komplett): **APPROVED FOR MERGE** mit Bestätigung byte-identical Behavior + Hotspot-Bilanz 9 → 8.

**Architektur-Patterns (etabliert/bestätigt):**
- **Hook-Result-Destrukturierung** (Bundle T.d Lehre): Caller destrukturiert 6/8 Outputs (`letzteUebungProThema` + `sichtbareThemenListe` werden hook-intern konsumiert, nicht im Body) — keine `result.foo`-Zugriffe.
- **Bonus-Befund:** `sichtbareThemenListe`-Memo deps korrigiert (zusätzlich `getAktiveUnterthemen` + `getThemenFortschritt`, die im Source closure-bound aber missing-dep waren). Korrektheit verbessert ohne Verhaltensänderung (Zustand-Selektoren stabil).
- **Hybrid-Sub-Folder-Pattern**: Daten-Hooks in `src/hooks/ueben/` flach, UI-Komponenten in `src/components/ueben/dashboard/`-Sub-Folder analog T.b/T.d.
- **Inline-`renderThemaKarte`-Closure-Helper**: kein eigenes Komponenten-File, kein Props-Interface — DRY innerhalb der Hauptkomponente (closure über fachFarben/lernziele/Setter/Helper). Passt zur Strategy-B-Out-of-Scope-Linie zu FachSektion (kein Komponenten-Split).

**Plan-Deviation (justified, dokumentiert):**
- Test-Fixtures: 4 Type-Field-Korrekturen weil Plan-Spec mit Draft-Names schrieb (`FragenFortschritt.korrekteVersuche` vs. real `richtig`+`richtigInFolge`+`sessionIds`+`email`; `UebenAuthUser.rolle` `'sus'` vs. real `'admin'|'lernend'|'unbekannt'`; `ThemenFreischaltung.gruppeId` vs. real Felder; `ThemenFortschritt` ohne `fach`/`thema`).
- `getAktiveUnterthemen`-Return-Type: `string[] | null` → `string[] | undefined` (real Store-Signatur).

**Out of Scope (für nächste Sessions):**
- Bundle T.f — LPStartseite (1043 Z., letztes Sub-Bundle aus Bundle T)
- `themenMap`-Frage-Objekt-Mutation (Source-Code-Pattern): `(f as { unterthema?: string }).unterthema = themaRaw` — pre-existing, byte-identisch beibehalten. Spawn-Task-Kandidat falls Cleanup gewünscht.
- Pfad 8 (Lernziel-Mini-Modal) + Pfad 10 (DeepLinkAkkordeon) — vitest-Coverage deckt die Logik ab; Browser-Sichtbarkeit bei Test-User nicht erreichbar (skipped, kein Regress).

---

### Bundle T.d — ZeichnenCanvas Hook-Extraktion ✅ MERGED (2026-05-07)

Branch `feature/bundle-t-d-zeichnen-canvas`. Viertes Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Erstes hoch-Risiko-File-Split per 4 Hook-Extraktionen. **ZeichnenCanvas.tsx 804 → 517 Zeilen (-36%)** — Hotspot-Set verlassen (technisch knapp >500, aber Master-Spec-Range <600 für hoch-komplexe Files erfüllt). Hotspot-Bilanz Files >500 Z.: **10 → 9**.

**Was geliefert (4 neue Hooks + 3 Test-Files):**
- `ExamLab/src/hooks/useDebounce.ts` (27 Z.) — cross-cutting Debounce-Utility, byte-identisch zum vormaligen inline-Helper
- `ExamLab/src/hooks/useDebounce.test.ts` (59 Z.) — 3 Vitest-Tests mit fake-timers (single-call, multi-call-collapse, args-passthrough)
- `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts` (68 Z.) — `canvasRef` + `containerRef` + `hintergrundbild`-State + Dimensionen, exportiert pure function `berechneDimensionen`
- `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts` (61 Z.) — 5 Vitest-Tests für `berechneDimensionen` (alle 4 Branches + `auto`-ohne-Bild Edge-Case)
- `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts` (154 Z.) — Text-Overlay-State-Machine + Auto-Focus-rAF (50ms iOS-Fallback) + Outside-Click-Listener (capture: true, setTimeout(0) Tick-Skip) + Blur-Suppress (400ms Window + 150ms Delay), decoupled von Drawing-Engine via `onCommit({ text, logischX, logischY })`-Callback
- `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx` (117 Z.) — 7 Vitest-Tests inkl. Ref-Spiegel-Verifikation für Callback-Identity-Wechsel
- `ExamLab/src/components/fragetypen/zeichnen/useStiftRendering.ts` (106 Z.) — rAF-basiertes Stift-Preview-Rendering ohne React-State (Session-50-Performance-Pattern), kein Vitest (Master-Spec §4.2 Test-Hybrid: RAF + Canvas-API → Browser-E2E-only)

**Verifikation:**
- vitest **1302 passes** (drift +15 vs T.c-Baseline 1287, exakt wie Plan vorhersagte) ✓
- tsc -b clean (Output direkt geprüft, Lehre `feedback_tsc_b_exit_misleading`) ✓
- 4 Lint-Gates clean: `lint:as-any` (Total 0/Defensive 0/Undokumentiert 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` (keine `__tests__/`), `lint:musterloesung` (Baseline unverändert) ✓
- vite build erfolgreich (2.99s, PWA generateSW OK) ✓
- Browser-E2E auf staging mit echten Logins (Yänu/durandbourjate@gmail.com als WR-LP, SW-Cache vorab zurückgesetzt) — **10/11 Pfade ✅** (Pfad 8 iPad-Focus skipped, kein iPad verfügbar):
  - Pfad 1 ✅ LP-Editor öffnet (Fragensammlung → Filter Typ=Zeichnen → Marketing-Mix-Frage → Editor mit ZEICHNEN-KONFIGURATION + AutoSave-Status "✓ Gespeichert")
  - Pfad 2 ✅ SuS-Üben Canvas lädt (Üben → Markt- und Leistungsanalyse → Fragetyp Zeichnen Filter → Übung starten → Canvas + Toolbar)
  - Pfad 3 ✅ Stift-Werkzeug zeichnet (diagonale Linie nach left_click_drag)
  - Pfad 4 ✅ Multi-Strich (X-Form sichtbar, Buffer-Reset zwischen Strichen funktioniert)
  - Pfad 5 ✅ Text-Werkzeug normal (Klick → Overlay mit Auto-Focus → "Hallo" tippen → Enter → Text-Command auf Canvas)
  - Pfad 6 ✅ Text-Werkzeug Outside-Click (Klick → Overlay → "Outside" tippen → Klick außerhalb → Overlay zu, Text als Command)
  - Pfad 7 ✅ Text-Werkzeug Escape (Klick → Overlay → "Verwerfen" tippen → Escape → Overlay zu, Text NICHT übernommen)
  - Pfad 9 ✅ Tastatur-Delete (Auswahl-Werkzeug → Klick auf "Hallo" → gestrichelte Selektion → Delete-Taste → "Hallo" gelöscht)
  - Pfad 10 ✅ Auto-Save-Indikator "Auto-Save aktiv" sichtbar während Editieren
  - Pfad 11 ✅ 0 Console-Errors über alle Pfade
- Final Code-Reviewer (komplett Bundle T.d): **APPROVED FOR MERGE** mit Bestätigung byte-identical Behavior für alle 5 Timing-Invarianten (50/400/150ms + capture/setTimeout(0))

**Architektur-Patterns etabliert:**
- **Cross-cutting `useDebounce` flach in `src/hooks/`** (Master-Spec §4.1)
- **File-lokale Hooks im `zeichnen/`-Sub-Folder** (Master-Spec §4.1)
- **Decoupled-Callback-Pattern für State-Machines**: `useTextOverlay` empfängt nur `onCommit({ text, logischX, logischY })`, Caller bildet den Engine-Closure separat. Verhindert Hook-Coupling an Drawing-Engine-Internals.
- **Ref-Spiegel-Pattern für stable Callback-Identity**: `onCommitRef.current = onCommit` am Top des Hook-Body (NICHT in useEffect). Test #7 in `useTextOverlay.test.tsx` verifiziert via `rerender({cb: onCommit2})`.
- **Hook-Result-Destrukturierung in stabile Namen**: Reviewer-Iteration-1-Lehre. Hook-Result-Object wechselt Identity pro Render → `useCallback`-Deps invalidieren → `usePointerEvents` re-attached pro Render. Lösung: `const { starteRendering: starteStiftRendering } = useStiftRendering(...)` und in Deps `starteStiftRendering` (stabile useCallback-Referenz).
- **Pure-Function-Export für isolierte Test-Coverage**: `berechneDimensionen` als named export aus `useCanvasSetup.ts` testbar ohne renderHook-Lifecycle.
- **rAF-Loop ohne Vitest** (Master-Spec §4.2 Test-Hybrid): RAF + Canvas-API in jsdom unzuverlässig → Browser-E2E-only mit echten Logins.

**Spawn-Tasks (optional, out-of-scope für T.d — Pre-existing):**
- `onPNGExport`-Prop von ZeichnenCanvas wird nirgends im Source aufgerufen — die `onPNGExportRef`/`exportiereRef`-Spiegel sind toter Code. Pre-existing seit Session-vor-T.d, bewahrt byte-identisch.
- `useDebounce` hat keine cleanup-on-unmount + Re-Erstellung bei `fn`-Identity-Wechsel. Sibling `useDebouncedHover.ts` löst beides via `callbackRef`-Pattern + Cleanup-Effect. Bei künftigen Konsumenten von `useDebounce` evaluieren ob das Pattern adoptiert wird.
- Render-Loop `useEffect`-Deps `[engine.state, engine, hintergrundbild]`: `engine` wechselt Identity pro Render → handleStart/Move/End re-create + `usePointerEvents` re-attach pro Render. Byte-identisch zu Source — pre-existing characteristic. Bei Pointer-Event-Jitter auf Production-Tablets eigenes Bundle für Engine-Identity-Stabilisierung.

**Out of Scope (für nächste Sessions):**
- Bundle T.e — Dashboard-Üben (930 Z., hoch-Risiko, 5 useEffect Inter-Deps + 14 useState + 8 useMemo)
- Bundle T.f — LPStartseite (1043 Z., hoch-Risiko, Filter-State-Deps + Wrapper-Pattern Dispatcher+Inner)
- Pause-Punkt nach T.f: Phase-3-Wahl P-Migration (Backend-Daten-Migration `musterlosung` → `musterloesung`) vs. Bundle U (PDFSeite Hoch-Risiko)

---

### Bundle T.c — FragenBrowser Hook-Extraktion + Body-Komponenten ✅ MERGED (2026-05-07)

Branch `feature/bundle-t-c-fragen-browser`. Drittes Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Mittel-Risiko-File-Split per 2 Hook-Extraktionen + 2 Komponenten-Splits. **FragenBrowser.tsx 768 → 253 Zeilen (-67%)** — Hotspot-Set verlassen, Master-Spec-Ziel <500 Z. erreicht. Hotspot-Bilanz Files >500 Z.: **11 → 10**.

**Was geliefert (4 neue Files):**
- `ExamLab/src/hooks/useFragenAktionen.ts` (99 Z.) — Backend-Async-Handler-Cluster (importieren/duplizieren/löschen) + `loeschKandidat`-State
- `ExamLab/src/hooks/useFragenEditor.tsx` (NB: `.tsx` wegen JSX im autoSaveAdapter-Memo, 232 Z.) — Editor-State + AutoSave-Coupling + Schliessen-Modal mit **un-delete-Race-Mitigation in Service-API gekapselt** (`modalVerwerfen()` byte-identisch zu source Z. 295-308: 2× `draftSyncCancelPending` flanking `await apiService.loescheFrage`). 13 Service-API-Methods. `liveFrage` privat (NICHT im Result-Interface — Single-Source-of-Truth).
- `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx` (133 Z.) — Gemeinsamer Render-Body inline + overlay. Eliminiert ~150 Z. Duplikat aus heutiger inline-Branch + overlay-Branch.
- `ExamLab/src/components/lp/fragensammlung/fragenbrowser/LoeschBestaetigungsDialog.tsx` (50 Z.) — Custom Modal-Bestätigungs-Dialog (heutige Inline-JSX Z. 511-540).

**Verifikation:**
- vitest **1287 passes** (drift = 0 vs T.b-Baseline 1287, kein neuer Test, kein Bruch) ✓
- tsc -b clean ✓
- 4 Lint-Gates clean: `lint:as-any` (Total 0/Defensive 0/Undokumentiert 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` (keine `__tests__/`), `lint:musterloesung` (Baseline unverändert) ✓
- vite build erfolgreich (3.02s, PWA generateSW OK) ✓
- Browser-E2E auf staging mit echtem LP-Login (`wr.test@gymhofwil.ch`, SW-Cache vorab zurückgesetzt) — kritische Pfade verifiziert:
  - **Pfad 1 ✅** LP-Editor öffnen — Klick auf Frage → Detail-Spinner → Editor mit "✓ Gespeichert"-Status
  - **Pfad 2 ✅** Auto-Save-Pfad — Tippen → SaveStatusIndikator zeigt "Speichert..." → wieder "✓ Gespeichert" (Hook + Caller-Wiring funktioniert: onTippe → setLiveFrage + draftSyncTippe → useFragenAutoSave-status update)
  - **Pfad 3 ✅** SchliessenModal — "Änderungen noch nicht gesichert"-Modal triggert bei verbindungsproblem-Status (un-delete-Race-Mitigation aktiv via `modalVerwerfen()`-Service-API)
  - **Pfad 10 ✅** 0 Console-Errors
  - Pfade 4-9 nicht direkt getestet, Hook-Logic durch 1287 vitest + Pfade 1+2+3 abgedeckt
- Final Code-Reviewer (Bundle T.c komplett): **APPROVED for merge** mit Bestätigung byte-identical Behavior + un-delete-Race-Mitigation byte-identisch zu source.

**Architektur-Patterns etabliert:**
- **Service-API-Encapsulation für race-anfällige Hooks**: `useFragenEditor.modalVerwerfen()` kapselt 2× `cancelPending` flanking `await loescheFrage` zentral. Caller hat keinen Zugriff auf `liveFrage`/`setLiveFrage`. JSDoc warnt explizit "Beide cancelPending-Aufrufe sind ESSENZIELL — nicht entfernen".
- **Privacy-Pattern für Hook-State**: Bei Hook-Cuts mit race-anfälligen Mitigation-Patterns das State-Variable NICHT im Result-Interface exposen. Nur Service-Methods raus.
- **Body-Komponenten-Cut für Render-Duplikat**: Bei 2 nahezu identischen Render-Branches (inline vs overlay) eine gemeinsame `<Body>`-Komponente extrahieren mit `filter`-Pass-through-Object (statt 32 einzelne Filter-Props).
- **Close-First für Backend-Loop-Modals**: Modal-State synchron schliessen VOR `void aktion()`-Async-Loop, um UX-Wait zu vermeiden.

**Spawn-Tasks (optional, out-of-scope für T.c):**
- `nachbarCallbacks` + `nachbarFuerPrefetch` haben identische `findIndex`-Logik (heute byte-identisch, nicht Bundle-T.c-Regress) — Mini-Refactor möglich
- Modal-Backdrop-Click-Bubble-Effekt (Klick auf SchliessenModal-Abbrechen schliesst auch ResizableSidebar) — Pre-existing UI-Detail, kein T.c-Refactor-Bug

**Out of Scope (für nächste Sessions):**
- **Pause-Punkt nach T.c (Master-Spec 8.3):** Zwischen-Reflexion empfohlen — hat sich Hook-Naming bewährt? Test-Hybrid-Schwelle nachjustieren?
- Bundle T.d — ZeichnenCanvas (804 Z., hoch-Risiko, iOS-Canvas-Focus-rAF)
- Bundle T.e — Dashboard-Üben (930 Z., hoch-Risiko, 5 useEffect Inter-Deps)
- Bundle T.f — LPStartseite (1043 Z., hoch-Risiko, Filter-State-Deps)

---

### Bundle T.b — TKontoFrage Komponenten-Split ✅ MERGED (2026-05-07)

Branch `feature/bundle-t-b-tkonto-frage`. Zweites Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Mittel-Risiko-File-Split per Komponenten-Split + file-lokales Util. **TKontoFrage.tsx 763 → 155 Zeilen (-80%)** — Hotspot-Set verlassen, Master-Spec-Ziel <500 Z. erreicht. Hotspot-Bilanz Files >500 Z.: **12 → 11**.

**Was geliefert (5 neue Files in `tkonto/`-Sub-Folder analog `zeichnen/`):**
- `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts` (191 Z.) — Pure Functions: `brd`, `neueId`, `leereZeile`, `leereKontoEingabe`, `zuAntwort`, `vonAntwort`, `matcheEintraege`, `bewerteKonto` + Types `EintragZeile`, `KontoEingabe`, `TKontoAntwort`, `SusEintrag`, `EintragStatus`, `KontoBewertung`
- `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts` (232 Z.) — **23 vitest tests** (5 zuAntwort + 6 vonAntwort + 7 matcheEintraege + 5 bewerteKonto), TDD-Style
- `ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx` (181 Z.) — symmetrische `seite="links"|"rechts"`-Komponente. Eliminiert ~110 Z. links/rechts-Duplikation aus Source Z. 397-509. Cell-Borders ersetzen die heutigen 4 Grid-Container-Borders (Plan-Reviewer-Iteration-1-Fix).
- `ExamLab/src/components/fragetypen/tkonto/KontoEingabeForm.tsx` (91 Z.) — Konto-Header (Kontoname + Kontenkategorie-Select + 4-Color-Badge) + flat `grid grid-cols-2` mit 2× `<KontoSeite>`. Outer-Grid OHNE Border-Klassen (Cell-Borders carry Row-Trennlinien).
- `ExamLab/src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx` (158 Z.) — Loesungsmodus-Ansicht + lokaler `EintragBadge`-Helper. **Single-Source-of-Truth-Refactor:** `bewerteKonto`-Aufruf ersetzt doppelte Inline-Loops aus Source (Z. 597-611 alleKontenKorrekt + Z. 639-655 Pro-Konto-Render).

**Type-System-Improvement (Phase 1.2):** `ExamLab/src/types/antworten.ts` — 4 optionale Legacy-Felder (`sollHaben?`, `zunahmeAbnahme?`, `zunahmeAbnahmeLinks?`, `zunahmeAbnahmeRechts?`) + `gfNr?: number` auf `eintraegeLinks/Rechts`-Items. **Eliminiert** die 4 `(eingabe as Record<string, unknown>).sollHaben as string`-Casts aus Source Z. 119-122 sowie 2 `as ReturnType<typeof zuAntwort>`-Krücken aus Z. 152/158. Pure additiv — kein Wire-Vertrag-Bruch.

**Verifikation:**
- vitest **1287 passes** (drift +23 vs T.a-Baseline 1264) ✓
- tsc -b clean (Output direkt geprüft, nicht nur Exit-Code) ✓
- 4 Lint-Gates clean: `lint:as-any` (Total 0/Defensive 0/Undokumentiert 0), `lint:no-alert` (0 Treffer), `lint:no-tests-dir` (keine `__tests__/`), `lint:musterloesung` (Baseline unverändert) ✓
- vite build erfolgreich (2.79s, PWA generateSW OK) ✓
- Browser-E2E auf staging (echter LP-Login `wr.test@gymhofwil.ch`, SW-Cache vorab zurückgesetzt): LP-Dashboard rendert + 0 Console-Errors + Fragensammlung-Filter T-Konto liefert 7 Treffer ✓ (visuelle Konto-Karten-Verifikation user-confirmed)
- Final Code-Reviewer (Bundle T.b komplett): **APPROVED for merge** mit Bestätigung byte-identical Behavior, 0 Critical/Important Issues.

**Plan-Deviation (justified):** Phase-1.4-Test "NICHT toleriert Decimal-Diff ≥ 0.01" verwendet `100`/`100.02` statt Plan-`100.01`/`100.02` wegen IEEE-754-Instabilität (`100.02 - 100.01 ≈ 0.0099 < 0.01`). In Commit-Message dokumentiert.

**Architektur-Konvention propagiert:** Sub-Folder-Pattern für `>450-Z.-Komponenten-Splits` etabliert weiter (Bundle S.b/S.c → Bundle T.b). Cell-Border-Pattern statt Grid-Container-Border bei Single-Grid-Migration mit Sub-Komponenten.

**Spawn-Tasks (optional, out-of-scope für T.b — alle Pre-existing Patterns):**
- `betrag === 0`-Stripping in `zuAntwort`/`vonAntwort` (legitimer 0-Wert wird zu `''` collapsed)
- `parseFloat(x) || 0` silent-coerciert garbage-input zu 0
- `brd`-Helper ungetestet (trivial 4-Branch, könnte Mini-Test bekommen)
- Anfangsbestand-Persistierung — heute gar nicht in `TKontoAntwort` serialisiert (Round-Trip-Test Z. 95-97 dokumentiert das)

**Out of Scope (für nächste Sessions):**
- Bundle T.c — `FragenBrowser.tsx` (768 Z.) Hook-Extraktion (`useFragenFilterEngine` + `useFragenEditorSync`). Master-Spec Sektion 6.3 hat Audit-Hypothese.
- Bundle T.d — ZeichnenCanvas (804 Z., hoch-Risiko)
- Bundle T.e — Dashboard-Üben (930 Z., hoch-Risiko)
- Bundle T.f — LPStartseite (1043 Z., hoch-Risiko)
- 5 unrelated WIP-Files (FragenBrowserHeader-Modifikation + 2 stale composer/-Files + 2 macOS-Duplikate) — vor Merge gestasht, User entscheidet nachher

---

### Bundle T.a — DurchfuehrenDashboard Hook-Extraktion ✅ MERGED (2026-05-07)

Branch `feature/bundle-t-a-durchfuehren-dashboard`. Erstes Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Mittel-Risiko-File-Split per Hook-Extraktion. **DurchfuehrenDashboard.tsx 677 → 464 Zeilen (-31%)** — Hotspot-Set verlassen.

**Was geliefert:**
- 4 neue Files (3 Hooks + 1 Pure-Util):
  - `ExamLab/src/utils/durchfuehrenMonitoringMapper.ts` (52 Z., pure mapping) + 11 Vitest-Tests (103 Z.)
  - `ExamLab/src/hooks/useDurchfuehrenMonitoring.ts` (92 Z., daten-polling + auto-refresh + 3-fehler-banner + abortcontroller)
  - `ExamLab/src/hooks/useDurchfuehrenLoad.ts` (116 Z., once-load abgaben+fragen+config + demo-modus + periodic-config-refresh)
  - `ExamLab/src/hooks/useDurchfuehrenPhasenTab.ts` (85 Z., activetab + phase-auto-forward + url-sync + prewarmkorrektur-trigger)
- Phase-useState-Pattern in DurchfuehrenDashboard etabliert (löst Hook-Input-Zirkularität: Hooks brauchen `phase`, aber `phase` kommt aus `bestimmePhase(config, daten.schueler)` = Output von Load+Monitoring → useState + Sync-Effect bricht den Zyklus).
- Bug-Fix Bonus: 3-Fehler-Verbindungs-Banner war im Original durch stale-closure-Capture (`ladeStatus !== 'laden'` permanent false) **de facto wirkungslos**. Refactor mit Ref-Pattern fixt das ohne Refetch-Bursts (Hotfix-Commit `4c3e51a`).
- Test-Hybrid umgesetzt: Pure-Util mit 11 Tests, 3 Hooks ohne Unit-Tests (async-store-orchestration, Browser-E2E reicht). Source-Scan-Tests (Hebel A + Trigger 1/2/3) auf `useDurchfuehren*.ts?raw` umgeleitet.

**Verifikation:**
- vitest **1264 passes** (drift=0 vs Baseline 1253 + 11 neue Mapper-Tests) ✓
- tsc + build clean ✓
- lint:as-any 0/0/0 + lint:no-alert 0 ✓
- Browser-E2E auf staging mit echtem LP-Login: **Pfade 1, 3a, 6, 7 ✓**
  - Pfad 1: DurchfuehrenDashboard lädt mit Tab-Bar + Live-Indicator + Polling
  - Pfad 3a: Tab-Klick auf Auswertung triggert `ladeKorrektur` (preWarmKorrektur-Path)
  - Pfad 6: URL `?tab=lobby` direct → activeTab='lobby' (useState-Initial korrekt)
  - Pfad 7: 3× Refresh-Klicks → AbortController abgebrochen, 0 Frontend-Crash trotz 503-Apps-Script-Quota-Bursts
  - Network-Polling verifiziert: monitoring/ladeNachrichten/ladeEinzelConfig/ladeAbgaben/ladeKorrektur
  - 0 Console-Errors während gesamter Session
- Final Code-Reviewer (Bundle T.a komplett): **APPROVED**, mit Bonus-Hinweis zum 3-Fehler-Banner-Bugfix.

**Bug-Fix-Disclosure (Browser-Verhaltensänderung):** Der 3-Fehler-Verbindungs-Banner war im Original wirkungslos. Nach T.a feuert er korrekt nach 3 Polling-Misses. User könnte mehr Banner-Sichtungen bei Netzwerk-Schwierigkeiten erleben.

**Nicht im Browser getestet (Continuation-Tests, brauchen echte Pruefung mit SuS-Logins, nicht durchgespielt):**
- Pfad 2: Vollständige Phasen-Übergänge Vorbereitung→Lobby→Aktiv→Beendet
- Pfad 3b/3c: preWarmKorrektur bei phase=beendet, Direct-Mount bei beendet+freigeschaltet+!urlTab
- Pfad 4: 3-Fehler-Verbindungs-Banner via Network-Throttling
- Pfad 5: "Neue Durchführung"-Button-Reset

Refactor ist semantisch byte-identisch (per Reviewer-Bestätigung + Diff), Continuation-Pfade sollten identisches Verhalten zeigen wie auf main (vor T.a). Hotfix-Cherry-Pick falls Probleme.

**Out of Scope (für nächste Session):**
- T.a Spawn-Tasks (Memory-TODO):
  - `setDaten`-Leak in useDurchfuehrenMonitoring (TODO Z.14): durch `resetDaten(pruefungId)` oder `onPruefungReset`-Callback ersetzen, Direct-Setter-Leak vermeiden — relevant ab T.f wenn phase-useState-Pattern propagiert
  - `_nachrichten` Dead-Code-Verdacht (set, aber nicht gelesen) — separater Spawn-Task post-merge
- Untracked-Files-Drift im Repo (nicht von T.a verursacht):
  - `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx` (modified-not-staged auf main bestätigt)
  - `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx`, `VorschauTab.tsx` (untracked — vermutlich Bundle-S-Reste)
  - 2× `* 2.tsx`-macOS-Duplikate (Memory-Workflow-Regel: aufräumen)

**Spec/Plan:**
- Master-Spec: `docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md` (auf main, Bundle T Sektion 3 + 6.1)
- T.a Plan: `docs/superpowers/plans/2026-05-06-bundle-t-a-durchfuehren-dashboard.md` (rev2 commit `abe8b54`, jetzt auf main)

**Nächste Schritte:**
- T.b (TKontoFrage 763 Z. → `<KontoEingabeForm>` + `tkontoUtils.ts`)
- T.c (FragenBrowser 768 Z. → `useFragenFilterEngine` + `useFragenEditorSync`)
- Pause-Punkt nach T.c laut Master-Spec Sektion 8.3 für Zwischen-Reflexion.

**3 neue Lehren für Memory:**
1. **`tsc -b 2>&1 | grep "error TS"`** statt `tail -5` — Implementer-Subagent übersah TS2352-Plan-Code-Bug, weil tail nur Footer zeigte.
2. **Naming-Vermeidung via thematisches Prefix**: `useMonitoringData` würde mit existierendem `usePruefungsMonitoring` (SuS-Auto-Save in völlig anderem Bereich) kollidieren. `useDurchfuehren*`-Prefix passt zur Domain.
3. **phase-useState-Pattern für Hook-Input-Zirkularität**: Wenn alle 3+ Hooks `phase` als Input brauchen, aber `phase` aus Hook-Outputs (config+daten) kommt — `useState<Phase>('default')` + Sync-Effect statt phaseRef-Bridge.

---

### Bundle T — Master-Spec für Hook-Extraktion (6 mittel-Risiko-Files) ✅ MERGED (2026-05-06)

Branch `spec/bundle-t-master`. Reine Brainstorming + Spec-Phase, kein Code-Change. Phase-3-Tiefen-Refactor aus Audit-Roadmap (2026-05-05). Bundle T zerlegt 6 Mittel-Risiko-File-Hotspots per Hook-Extraktion in 6 Sub-Bundles T.a–T.f, je 1 File, Risiko-aufsteigend.

**Was geliefert:**
- Master-Spec `docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md` mit Architektur-Konvention (Hook-Ablage, Test-Hybrid, Pre-Audit-Tiefe, DoD), 6 Sub-Bundle-Definitionen, Mini-Pre-Audit für 3 hoch-R-Files (T.d ZeichnenCanvas, T.e Dashboard-Üben, T.f LPStartseite), Risiko-Strategie und Roadmap.
- **Sub-Bundles** (Risiko-aufsteigend):

| Sub | File | Z. | Audit-Hook-Hypothese |
|---|---|---:|---|
| T.a | DurchfuehrenDashboard.tsx | 677 | Phasen-+URL-State-Hook (Naming pro writing-plans, NICHT `useMonitoringData` wegen Kollision mit `usePruefungsMonitoring`) |
| T.b | TKontoFrage.tsx | 763 | `<KontoEingabeForm>` + lokal `tkontoUtils.ts` |
| T.c | FragenBrowser.tsx | 768 | `useFragenFilterEngine`, `useFragenEditorSync` |
| T.d | ZeichnenCanvas.tsx | 804 | `useTextOverlay`, `useCanvasSetup`, `useStiftRendering`, `useDebounce`-Auslagerung |
| T.e | Dashboard.tsx (Üben) | 930 | `useLernpfadData`, `useThemenKomputationen`, `useFragenFilter`/`<FragenFilterPanel>`, `<FachSektion>` |
| T.f | LPStartseite.tsx | 1043 | `useLPConfigFiltering`, `useLPFavoriten`, `useLPLetzteAktivitaet`, ggf. `<DashboardContentLayout>` (YAGNI-Kandidat) |

**Architektur-Entscheidungen (in Spec dokumentiert):**
- Hook-Ablage: etablierte Konvention (`src/hooks/useLP*` flach für LP, `src/hooks/ueben/` für Üben, file-lokal für fragetyp-spezifische Hooks)
- Test-Strategie Hybrid: pure-Logic-Hooks bekommen Vitest co-located, Wrapper-Hooks nicht
- Pre-Audit differenziert: Mini-Audit nur für hoch-R-Files in Master-Spec, mittel-R-Files erst in writing-plans
- DoD pro Sub-Bundle: Bundle-S/L-Standard (vitest grün, tsc clean, lint:as-any/no-alert clean, Browser-E2E echte Logins, Code-Reviewer APPROVED)

**Spec-Review:**
- spec-document-reviewer-Subagent: **Approved** beim ersten Pass. Alle Behauptungen gegen Repo verifiziert (Datei-Zeilen 677/763/768/804/930/1043, Hook-Konvention, `useDebounce` fehlt, `usePruefungsMonitoring`-Naming-Konflikt).
- Advisory-Recommendations eingearbeitet (Commit `2aa08dd`): T.e State-Inventar von 5 auf vollständige 14 useStates erweitert, zusätzlicher Cut `useFragenFilter`/`<FragenFilterPanel>` für Filter-Cluster ergänzt, T.d useRef-Zahl korrigiert (14 → 18).

**Out of Scope:**
- Implementation pro Sub-Bundle (eigene Sessions T.a–T.f mit writing-plans + executing-plans)
- Bundle U (PDFSeite-Hoch-Risiko, eigenes Bundle nach T)
- Bundle P-Migration (Sheet-Spalten-Migration, separat)
- HilfeSeite.tsx (906 Z., Audit empfiehlt React.lazy-Strategie statt Hook-Extraktion)
- Konvergenz Pruefen/Üben-Fragetypen (Adapter-Hook-Pattern aus 2026-04-12-Plan, separat falls je gewünscht)

**Nächster Schritt:** writing-plans für T.a (DurchfuehrenDashboard) auf neuem Branch `feature/bundle-t-a-durchfuehren-dashboard`.

---

### Bundle P-Doku — `musterlosung` Field-Drift dokumentiert + eingefroren ✅ MERGED (2026-05-06)

Merge `d059ebb` auf main. Branch `feature/bundle-p-musterloesung-doku` gelöscht (lokal+remote). Aufwärm-Bundle aus Audit-Roadmap-Phase 3.

**Was geliefert:**
- `scripts/audit-musterloesung.sh` mit Per-Token-Baseline (6 Tokens: musterlosung 295, Musterlosung 0, musterloesung 70, Musterloesung 14, musterLoesung 12, MusterLoesung 0). Parallele Arrays statt `declare -A` (bash 3.2 macOS-kompatibel). `--strict`-Modus für CI.
- `lint:musterloesung` in `ExamLab/package.json` (alphabetisch zwischen `lint:as-any` und `lint:no-alert`).
- CI-Gate auf Production (`--if-present` für chicken-and-egg) + Staging in `.github/workflows/deploy.yml`.
- Sektion „Field-Drift: Musterlösung" in `.claude/rules/code-quality.md` mit drei Identifier-Lagern + PascalCase-Anti-Match-Hinweis.

**Lokale Verifikation:**
- audit no-args + `--strict` ohne Drift ✅
- Drift-Injection-Test: 2 Tokens korrekt erkannt ✅
- vitest 1253 passes, tsc clean, build clean ✅

**Out of Scope:** Bundle P-Migration (Sheet-Spalten-Migration `musterlosung` → einheitliches Schreibmuster, Backend-Vertrag betroffen) — separates Bundle, ähnliches Risikoprofil wie Bundle J.

**Spec/Plan:**
- Spec: `docs/superpowers/specs/2026-05-06-bundle-p-musterloesung-doku-design.md`
- Plan: `docs/superpowers/plans/2026-05-06-bundle-p-musterloesung-doku-plan.md`

---

### Bundle S.c — Utils-Splits (poolConverter + fibuAutoKorrektur) ✅ MERGED (2026-05-06)

Branch `refactor/bundle-s-c-utils-splits`. 5 Commits seit S.a-Merge `ad70bed`. Drittes und letztes Sub-Bundle aus Bundle S — achtes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). Master-Spec Sektion 5.3.

**Was geliefert:**
- `ExamLab/src/utils/poolConverter.ts` (744 Z.) → Folder mit 10 Sub-Dateien (1 `index.ts` Re-Export-Hub + `BasisFelder`-Interface + `konvertierePoolFrage`-Bucket-Dispatcher + 5 Helper-Files (konstanten, helpers, punkte, zeitbedarf, snapshot) + 4 Bucket-Strategy-Files (Standard 11 Cases, Bild 3, Fibu 4, Aufgabengruppe gruppe+default))
- `ExamLab/src/utils/fibuAutoKorrektur.ts` (600 Z.) → Folder mit 7 Sub-Dateien (1 `index.ts` Re-Export-Hub + 1 `types.ts` zentral + 1 `util.ts` für Bilanz/ER + 4 Strategy-Files: buchungssatz/tkonto/kontenbestimmung/bilanzER)
- Caller-Imports byte-identisch — `git diff main..HEAD` zeigt 0 Caller-Änderungen
- Plan: `docs/superpowers/plans/2026-05-06-bundle-s-c-utils-splits.md` (rev1, Reviewer-NIT-Cleanup)

**Hotspot-Bilanz Files >500 Z.:** 2 raus (poolConverter 744 + fibuAutoKorrektur 600). Bundle S komplett (S.a+S.b+S.c kumuliert): **17 → 12** Master-Spec-Ziel ✅

**Verifikation:**
- vitest **1253 passed | 4 todo (1257 total)** — drift = 0 ✅
- tsc -b clean, build clean
- lint:as-any 0 / lint:no-alert 0 / lint:no-tests-dir clean
- Spec-Compliance-Reviewer-Subagent: APPROVED (alle 17 Sub-Files byte-identisch, Bucket-Routing 19+default korrekt, Bundle-L.b-Defensive-Cast preserviert)

**Browser-E2E auf staging (combined preview, echte LP+SuS-Logins, SW-Cache vorab zurückgesetzt):**
- ✅ Standard-Bucket via SuS Pool-MC-Frage komplett durchgespielt (Frage rendert + Korrektur mit Feedback pro Option + Musterlösung). Console: 0 Errors
- Bild-Bucket + Fibu-Bucket + fibuAutoKorrektur: nicht direkt getestet (analog S.a-LP-Korrektur-Strategie); stützt sich auf Reviewer-byte-identity + tsc/vitest

**Phase-4-Security-Check:** Bundle ist reiner Refactor ohne Wire-Vertrag-/API-Body-Berührung.

**Sub-Commits:**
- `889b5b7` Plan rev1
- `0386cda` Phase 1.1: poolConverter/ Folder-Skeleton (10 Sub-Dateien)
- `41b509b` Phase 2.1: fibuAutoKorrektur/ Folder-Skeleton (7 Sub-Dateien)
- `39a2f4d` Phase 1.2: poolConverter Cutover
- `5ac0f98` Phase 2.2: fibuAutoKorrektur Cutover

**Lehren:**
- **Bucket-Pattern als Antwort auf Spec-Vague-"3-4 Files"** — Audit fand: monolithisches `konvertierePoolFrage`-Switch ist ~510 Z. allein. Lösung: 4 Bucket-Files nach Domain (Standard/Bild/Fibu/Aufgabengruppe). Total 10 statt 4 — aber alle <300 Z.
- **Type-only Zirkular-Import funktioniert in TS** — `BasisFelder` aus `./index` in 4 Bucket-Files importieren ist sicher (TS erased `import type` zur Compile-Zeit).
- **Defensive-Cast (Bundle L.b-Lehre) byte-identisch übernommen** — `konvertiereAufgabengruppe.ts` hat `as unknown as PoolFrage`-Cast inkl. Defensive-Comment 1:1 aus Original.

**Folge:**
- Bundle S komplett — Phase 2 Cleanup-Roadmap abgeschlossen.
- Phase 3 (Bundle P musterlosung Field-Drift, Bundle T Hooks-Splits) und Phase 4 (Bundle U PDFSeite) in Folge-Sessions.
- Branch lokal+remote löschen 1 Woche nach Merge.

---

### Bundle S.b — VorschauTab-Split ✅ MERGED (2026-05-06)

Branch `refactor/bundle-s-b-vorschau-split`. 2 Implementation-Commits + Plan-Commit. Zweites Sub-Bundle aus Bundle S — siebtes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). Folgt direkt auf Bundle S.a (`ad70bed`).

**Was geliefert:**
- `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx` (643 Z.) → Folder mit 14 Sub-Dateien (1 `index.tsx` Dispatcher mit `VorschauTab`-Default + interner `FrageVorschau`-Dispatcher + 1 `zeitbedarf.ts` mit `schaetzeZeitbedarf` exported + 1 `AnhangMedien.tsx` mit Lightbox-State + 11 `<Fragetyp>Vorschau.tsx`: MC, Freitext, Lueckentext, Zuordnung, RichtigFalsch, Berechnung, Buchungssatz, TKonto, Kontenbestimmung, BilanzER, Aufgabengruppe)
- 1 minimal-Caller-Edit: `PruefungsComposer.tsx:23` — `.tsx`-Extension gedroppt wegen Folder-Resolution (S.a-Lehre #2)
- Folder-Pattern + Cutover-Strategie wie S.a, byte-identische Bodies (drift=0 reviewer-bestätigt)
- Plan: `docs/superpowers/plans/2026-05-06-bundle-s-b-vorschau-split.md` (rev2 nach Reviewer-Findings: 5-up Path-Tiefe für `types/`/`utils/` aus Sub-Files, 4-up für `MediaAnhang`)

**Hotspot-Bilanz (Files >500 Z. im Bundle-Scope):** **15 → 14** ✅ (VorschauTab.tsx 643 raus). Bundle-S.c-Targets (poolConverter 744, fibuAutoKorrektur 600) noch dabei.

**Verifikation:**
- vitest **1253 passed | 4 todo (1257 total)** — drift = 0 ✅
- tsc -b clean (force-mode + Output-Inspektion), build clean
- lint:as-any 0 / lint:no-alert 0 / lint:no-tests-dir clean
- Spec-Compliance-Reviewer-Subagent: APPROVED (alle 14 Sub-Files byte-identisch zu Original verifiziert, Path-Tiefen korrekt, Skeleton-Dormancy bestätigt)

**Browser-E2E:** offen — Master pusht S.b nach `origin/preview`, User testet auf staging mit echtem LP-Login (Vorschau-Tab öffnen, alle 11 Vorschau-Komponenten + AnhangMedien-Lightbox stichprobe, Console-Errors-Check). Pages-Deploy-Vorbedingung auf main (grüner Pages-Run) vor PR-Merge prüfen.

**Phase-4-Security-Check:** Bundle ist reiner Refactor ohne Wire-Vertrag-/API-Body-/Session-Token-/Response-Filter-Berührung. Folder-Resolution-Mechanik ist build-tool-intern.

**Sub-Commits:**
- `e93da3c` Plan rev2 (mit korrigierten Path-Tiefen nach Reviewer-Findings)
- `c7d6d4d` Phase 1.1: VorschauTab/ Folder-Skeleton mit 14 Sub-Dateien
- `fdc79e1` Phase 1.2: Cutover — alte Datei + Caller-Extension

**Lehre für S.c:** Vor Plan-Schreibung empirisch Path-Tiefe via S.a-Sibling verifizieren (`grep "from '\\.\\." DruckAnsicht/<file>.tsx`). Plan-Author hatte 1-Level-off-by-one in Rev1; Reviewer fing es ab. Für S.c (Folder unter `utils/`) entsprechend selbst empirisch testen statt aus Memory ableiten.

**Browser-E2E auf staging (combined preview, echte LP-Logins, SW-Cache vorab zurückgesetzt):**
- ✅ LP-Vorschau-Tab: 11 Vorschau-Komponenten (MC einfach + multi, RichtigFalsch, Freitext kurz/mittel, Lückentext, Zuordnung, Berechnung, Buchungssatz, KontenbestimmungVorschau modus-aware, BilanzER mit kontoLabel-Lookup, Aufgabengruppe) + 2 inline-Stubs (Visualisierung 🖌, PDF-Annotation 📄) visuell verifiziert. Console: 0 Errors

**Folge:**
- Bundle S.c (poolConverter 744 + fibuAutoKorrektur 600) — siehe oben (gleichzeitig gemerged)

---

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
