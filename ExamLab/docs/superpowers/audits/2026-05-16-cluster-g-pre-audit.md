# Cluster G Pre-Audit (2026-05-16)

**Branch:** `feature/cluster-g-icon-system-phase-2-6`
**Sub-Task 1** — Pre-Audit-Schritt vor Phase 2-6 Implementation.
**Referenz:** `../specs/2026-05-11-cluster-g-icon-system-design.md` + `../plans/2026-05-16-cluster-g-icon-system-phase-2-6.md`.

Dieses Audit liefert die Daten-Baseline (Bundle-Größen, Emoji-Inventar, Inline-SVG-Inventar, FRAGETYP_ICON_MAP-Verifikation), die in Phase 2 (Bundle-Analyse), Phase 3 (Inline-SVG-Migration), Phase 4 (Emoji-Replacement) und Phase 5 (FragetypIcon-Hookup) als Referenz dient.

---

## 1. Bundle-Baseline (vor Phase 2)

Gemessen via `npm run build` aus `ExamLab/`. Production-Build mit Vite + Rollup, danach Workbox PWA-Generation.

### Hotspot-Chunks (>100 KB)

| Chunk | Größe | Gzipped | Anmerkung |
|---|---:|---:|---|
| `pdf.worker.min-*.mjs` | 1239.05 KB | — | pdfjs-Worker, third-party (out-of-scope für Icon-System) |
| `LPStartseite-*.js` | 852.31 KB | 213.13 KB | Haupt-Dashboard LP — Hotspot-Target für Phase 2 Bundle-Reduktion |
| `Layout-*.js` | 591.32 KB | 156.36 KB | Shared-Layout inkl. Header + Sidebar |
| `xlsx-CNerDvZX.js` | 429.19 KB | 142.94 KB | Lazy-loaded XLSX-Import (out-of-scope) |
| `pdf-vkbVaD7t.js` | 405.70 KB | 120.30 KB | pdfjs-Client (out-of-scope) |
| `index-*.js` (largest) | 295.10 KB | 91.34 KB | Shared-Vendor-Chunk |
| `katex-*.js` (×2) | 259.52 KB | 77.04 KB | KaTeX-Bundle (out-of-scope) |
| `index-*.js` | 198.13 KB | 64.21 KB | Vendor-Chunk |
| `EinstellungenPanel-*.js` | 163.99 KB | 45.26 KB | LP-Settings-Panel |
| `PruefungsComposer-*.js` | 104.54 KB | 23.59 KB | LP-Composer |

### Sekundärchunks (50–100 KB)

| Chunk | Größe | Gzipped |
|---|---:|---:|
| `AppUeben-*.js` | 86.01 KB | 23.50 KB |
| `index-*.js` | 85.08 KB | 33.71 KB |
| `index-*.js` | 51.59 KB | 17.98 KB |
| `HilfeSeite-*.js` | 51.15 KB | 15.76 KB |
| `TestBadge-*.js` | 49.21 KB | 15.17 KB |
| `index-*.js` | 48.96 KB | 16.39 KB |
| `index-*.js` | 45.54 KB | 19.36 KB |

### Total-Metriken

- **PWA precache:** 256 entries, 5297.83 KiB (~5.30 MB)
- **CSS-Bundles:**
  - `index-*.css`: 132.91 KB / 19.64 KB gzip
  - `LPStartseite-*.css`: 30.39 KB / 8.07 KB gzip
- **Build-Warning:** "Some chunks are larger than 500 kB after minification" — trifft auf `LPStartseite`, `Layout` und `pdf.worker.min` zu.

### Phase-2-Targets

- **Primärziel:** LPStartseite-Chunk reduzieren via Tree-Shaking-Check der lucide-Imports (Spec §11 Performance-Budget: <850 KB für LPStartseite, <5.30 MB PWA-Total).
- **Sekundärziel:** Layout-Chunk (591 KB) bei Icon-Migration prüfen — Header/Sidebar nutzt mehrere SVGs (siehe Inline-SVG-Inventar §3).

---

## 2. Emoji-Inventar

**Baseline:** 467 Matches in 145 Files (16.05.2026, identisch zu Spec-Annahme).

Erfasst via Python-Regex über `ExamLab/src/**/*.{ts,tsx}` + `packages/shared/src/**/*.{ts,tsx}`. Regex deckt Misc-Symbols, Dingbats, Pictographs, Symbols-and-Pictographs, plus die drei Spezial-Codepoints `✨ ⁉ ‼` ab.

### Top-20 Codepoints

| Emoji | Codepoint | Count | Lucide-Empfehlung |
|---|---|---:|---|
| ✓ | U+2713 | 81 | `Check` (oder `CheckCircle2` mit Outline für „erfolg") |
| ⚠ | U+26A0 | 33 | `AlertTriangle` |
| ✗ | U+2717 | 29 | `X` (oder `XCircle` mit Outline für „fehler") |
| 💡 | U+1F4A1 | 29 | `Lightbulb` |
| ✕ | U+2715 | 25 | `X` (Close-Icon, identisch zu ✗ visuell — kontext-abhängig) |
| 🏁 | U+1F3C1 | 16 | `Flag` oder `FlagTriangleRight` |
| 📄 | U+1F4C4 | 13 | `FileText` |
| 📋 | U+1F4CB | 12 | `ClipboardList` (oder `Clipboard` für leere Variante) |
| 🔒 | U+1F512 | 9 | `Lock` |
| ✅ | U+2705 | 9 | `CheckCircle2` (gefüllt — Status-Indikator) |
| 🟡 | U+1F7E1 | 9 | `Circle` mit yellow-fill oder `CircleDot` |
| ☆ | U+2606 | 8 | `Star` (outline) |
| ⏱ | U+23F1 | 8 | `Timer` oder `Stopwatch` |
| 📝 | U+1F4DD | 7 | `FileEdit` oder `Pencil` |
| 🎓 | U+1F393 | 7 | `GraduationCap` |
| ★ | U+2605 | 7 | `Star` (filled — `fill="currentColor"`) |
| 🌙 | U+1F319 | 7 | `Moon` |
| ✏ | U+270F | 7 | `Pencil` oder `Edit` |
| 🔴 | U+1F534 | 7 | `Circle` mit red-fill oder `CircleDot` |
| 🎯 | U+1F3AF | 6 | `Target` |

**Konzeptionelle Drift:** Distinction ✓/✗/✕/✅ — drei verschiedene Codepoints für „check"-Semantik (81+9 = 90 Treffer) und zwei für „X" (29+25 = 54). Phase 4 sollte:
- `✓` und `✅` einheitlich auf `Check` bzw. `CheckCircle2` mappen je nach Status-Kontext.
- `✗` und `✕` einheitlich auf `X` bzw. `XCircle` mappen, mit klarer Trennung zwischen „Close-Button" (`✕`) und „Negativ-Status" (`✗`).

### Top-30 Files (sortiert nach Count)

| File | Count | Scope |
|---|---:|---|
| `ExamLab/src/data/einrichtungsFragen.ts` | 31 | **OUT** (didaktischer Frage-Inhalt) |
| `ExamLab/src/data/einrichtungsUebungFragen.ts` | 27 | **OUT** (didaktischer Frage-Inhalt) |
| `ExamLab/src/components/ueben/LernzieleAkkordeon.tsx` | 14 | IN (Phase 4) |
| `ExamLab/src/components/lp/durchfuehrung/LobbyPhase.tsx` | 14 | IN (Phase 4) |
| `ExamLab/src/components/sus/KorrekturEinsicht.tsx` | 11 | IN (Phase 4) |
| `ExamLab/src/config/appNavigation.ts` | 10 | IN (Phase 4) |
| `ExamLab/src/utils/ueben/gamification.ts` | 10 | IN (Phase 4) — Gamification-Badges (Stars/Trophies) prüfen ob Lucide-Mapping passt |
| `ExamLab/src/components/ueben/SuSHilfePanel.tsx` | 10 | IN (Phase 4) |
| `ExamLab/src/components/lp/vorbereitung/composer/materialien/MaterialienSection.tsx` | 10 | IN (Phase 4) |
| `ExamLab/src/components/settings/einstellungen/AdminTab.tsx` | 8 | IN (Phase 4) |
| `ExamLab/src/data/demoKorrektur.ts` | 8 | **OUT** (Demo-Daten) |
| `ExamLab/src/components/settings/FavoritenTab.tsx` | 7 | IN (Phase 4) |
| `ExamLab/src/components/lp/durchfuehrung/BeendetPhase.tsx` | 7 | IN (Phase 4) |
| `ExamLab/src/components/lp/durchfuehrung/AktivPhase.tsx` | 7 | IN (Phase 4) |
| `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` | 7 | IN (Phase 4) |
| `ExamLab/src/tests/AntwortZeile.test.tsx` | 6 | **OUT** (Test-Fixture) |
| `ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx` | 6 | IN (Phase 4) |
| `ExamLab/src/components/settings/LernzielTab.tsx` | 6 | IN (Phase 4) |
| `ExamLab/src/components/lp/fragensammlung/ExcelImport.tsx` | 6 | IN (Phase 4) |
| `ExamLab/src/components/ueben/admin/settings/AllgemeinTab.tsx` | 5 | IN (Phase 4) |
| `ExamLab/src/components/lp/Favoriten.tsx` | 5 | IN (Phase 4) |
| `ExamLab/src/components/shared/header/OptionenMenu.tsx` | 5 | IN (Phase 4) |
| `packages/shared/src/editor/components/AnhangEditor.tsx` | 5 | IN (Phase 4) |
| `ExamLab/src/tests/RichtigFalschFrageLoesung.test.tsx` | 4 | **OUT** (Test-Fixture) |
| `ExamLab/src/components/MediaAnhang.tsx` | 4 | IN (Phase 4) |
| `ExamLab/src/components/ueben/Dashboard.tsx` | 4 | IN (Phase 4) |
| `ExamLab/src/components/ueben/ThemaKarte.tsx` | 4 | IN (Phase 4) |
| `ExamLab/src/components/ueben/UebungsEinsicht.tsx` | 4 | IN (Phase 4) |
| `ExamLab/src/components/settings/kiKalibrierung/StatistikKarten.tsx` | 4 | IN (Phase 4) |
| `ExamLab/src/components/lp/korrektur/KorrekturFrageZeile.tsx` | 4 | IN (Phase 4) |

**Scope-Klassifikation:**
- **IN-Scope (Phase 4 Targets):** 26 von Top-30 Files — bilden ~58% (102 / ~177 in Top-30) der Emoji-Hotspot-Matches.
- **OUT-of-Scope (per Spec §10 + Plan Sub-Task 4):**
  - `einrichtungsFragen.ts` (31), `einrichtungsUebungFragen.ts` (27), `demoKorrektur.ts` (8) — didaktischer Frage-Inhalt + Demo-Daten (66 Matches insgesamt)
  - `AntwortZeile.test.tsx` (6), `RichtigFalschFrageLoesung.test.tsx` (4) — Test-Fixtures (10 Matches)
  - **Total OUT-of-Scope in Top-30: 76 Matches** (~16% der 467 Total-Matches)
- **Restliche 115 Files** (Tail) müssen in Phase 4 inkrementell durchgegangen werden; viele dürften nur 1–3 Matches haben (insgesamt ~290 Matches).

---

## 3. Inline-SVG-Inventar

**Baseline:** 24 Files mit `<svg>`-Tags außerhalb von `ExamLab/src/components/ui/icons/`. Gefiltert via `grep -rln "<svg"`.

### Icon-SVGs (13 Files, IN-SCOPE für Phase 3)

Toolbar-Icons, Status-Indicators, Button-Glyphen — ersetzbar durch lucide-react oder CustomIcons.

| File | Notiz |
|---|---|
| `ExamLab/src/components/Startbildschirm.tsx` | Login-/Dashboard-Icons |
| `ExamLab/src/components/AbgabeBestaetigung.tsx` | Status-Icon (Bestätigung) |
| `ExamLab/src/components/Layout.tsx` | Header/Sidebar-Icons (Layout-Chunk 591 KB!) |
| `ExamLab/src/components/AbgabeDialog.tsx` | Dialog-Icons |
| `ExamLab/src/components/SuSHilfeButton.tsx` | Button-Glyph |
| `ExamLab/src/components/ui/Button.tsx` | Generic Button-Slot — vorsichtig prüfen ob SVG `children`-API ist (dann ggf. IN/TBD) |
| `ExamLab/src/components/MaterialPanel.tsx` | Material-Icons |
| `ExamLab/src/components/lp/vorbereitung/composer/AbschnitteTab.tsx` | Composer-Toolbar |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx` | Frage-Karte Icons |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx` | Listen-Row Icons |
| `ExamLab/src/components/fragetypen/pdf/PDFToolbar.tsx` | Nur Toolbar-Icons (Zoom/Rotate/Page-Nav). PDF-Canvas-SVG bleibt OUT. |
| `ExamLab/src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx` | Nur Toolbar-Icons (Pinsel/Radierer/Text). Zeichnen-Canvas-SVG bleibt OUT. |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | Editor-Toolbar |

### Content-SVGs (11 Files, OUT-OF-SCOPE per Spec §10)

Strukturelle SVGs für Render-Inhalt (Buchungen, Hotspots, T-Konten, PDF-Seiten, DragDrop-Zonen). Werden NICHT migriert, da sie funktionale Geometrie/Layout-SVGs sind, keine Icons.

| File | Inhalt |
|---|---|
| `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/HotspotAnzeige.tsx` | Hotspot-Visualisierung mit Klickzonen |
| `ExamLab/src/components/fragetypen/MCFrage.tsx` | MC-Auswahl-Visualisierung (vermutlich Radio/Checkbox-Glyphen — TBD) |
| `ExamLab/src/components/fragetypen/HotspotFrage.tsx` | Hotspot-Bild mit interaktiven Zonen |
| `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx` | Drop-Zonen-Overlay |
| `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` | PDF-Annotation-Layer |
| `ExamLab/src/components/fragetypen/BuchungssatzFrage.tsx` | Buchungs-Pfeile/Linien |
| `ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx` | **TEST-FILE** (OUT) |
| `ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx` | T-Konto-Linien (Geometrie) |
| `packages/shared/src/editor/typen/HotspotEditor.tsx` | Hotspot-Editor Zonen-Overlay |
| `packages/shared/src/editor/typen/DragDropBildEditor.tsx` | DragDrop-Editor Drop-Zonen |
| `packages/shared/src/editor/components/ZonenOverlay.tsx` | Geteilter Zonen-Overlay-Renderer |

**TBD-Hinweis:** `MCFrage.tsx` enthält möglicherweise Radio/Checkbox-Icon-SVGs neben Content-SVGs (z.B. Auswahl-Marker). Phase-3-Subtask sollte File konkret reviewen und ggf. Icons (z.B. `CircleDot` / `Square`) migrieren, während Geometrie-SVGs bleiben.

**Plan-Spec-Konsistenz:** Plan-Liste nannte 12 Icon + 12 Content (24 total). Effektive Zählung: 13 Icon + 11 Content (24 total). Differenz: `Button.tsx` als IN klassifiziert (Plan-Liste hatte ihn ebenfalls), `pdfAnnotationenSVG.test.tsx` als OUT klassifiziert weil Test-File (per Plan-Sub-Task-4 Out-of-Scope-Regel für Test-Files). Tests-File-Behandlung: in Spec §10 explizit ausgeschlossen wäre Idealfall — als OUT geführt.

---

## 4. FRAGETYP_ICON_MAP-Verifikation

**Quelle der Wahrheit:** `packages/shared/src/types/fragen-core.ts:701` — `export type Frage = MC | Freitext | Zuordnung | Lueckentext | Visualisierung | RichtigFalsch | Berechnung | Buchungssatz | TKonto | Kontenbestimmung | BilanzER | Aufgabengruppe | PDF | Sortierung | Hotspot | Bildbeschriftung | Audio | DragDropBild | Code | Formel`.

### Fragetyp-Discriminator-Strings (20)

Extrahiert aus `typ: '...'`-Discriminator-Definitionen in `fragen-core.ts`:

1. `mc` (Z.150, MCFrage)
2. `freitext` (Z.169, FreitextFrage)
3. `zuordnung` (Z.195, ZuordnungFrage)
4. `lueckentext` (Z.202, LueckentextFrage)
5. `visualisierung` (Z.210, VisualisierungFrage)
6. `richtigfalsch` (Z.243, RichtigFalschFrage)
7. `berechnung` (Z.256, BerechnungFrage)
8. `buchungssatz` (Z.308, BuchungssatzFrage)
9. `tkonto` (Z.341, TKontoFrage)
10. `kontenbestimmung` (Z.366, KontenbestimmungFrage)
11. `bilanzstruktur` (Z.422, BilanzERFrage — Mapping-Hinweis: Type-Name ≠ Discriminator)
12. `aufgabengruppe` (Z.500, AufgabengruppeFrage)
13. `pdf` (Z.576, PDFFrage)
14. `sortierung` (Z.589, SortierungFrage)
15. `hotspot` (Z.608, HotspotFrage)
16. `bildbeschriftung` (Z.631, BildbeschriftungFrage)
17. `audio` (Z.641, AudioFrage)
18. `dragdrop_bild` (Z.670, DragDropBildFrage)
19. `code` (Z.684, CodeFrage)
20. `formel` (Z.694, FormelFrage)

### FRAGETYP_ICON_MAP Keys

Aus `ExamLab/src/components/ui/icons/FragetypIcon.tsx` Z.20–41:

| Key | Lucide/Custom-Icon |
|---|---|
| `mc` | `ListChecks` |
| `richtigfalsch` | `ToggleLeft` |
| `berechnung` | `Calculator` |
| `formel` | `Sigma` |
| `pdf` | `FileText` |
| `audio` | `AudioLines` |
| `sortierung` | `ArrowUpDown` |
| `code` | `Code` |
| `bildbeschriftung` | `ImageIcon` |
| `dragdrop_bild` | `Move` |
| `hotspot` | `MousePointerClick` |
| `zuordnung` | `ArrowRightLeft` |
| `aufgabengruppe` | `Package` |
| `bilanzstruktur` | `Columns2` |
| `visualisierung` | `Brush` |
| `kontenbestimmung` | `FileSearch` |
| `freitext` | `IconAbc` |
| `lueckentext` | `IconAB` |
| `buchungssatz` | `IconAn` |
| `tkonto` | `IconTKonto` |

### Drift-Verifikation

**Ergebnis: 20/20 match, kein Drift.**

- `Record<Fragetyp, ComponentType<LucideProps>>` (Z.20) erzwingt TS-seitig Vollständigkeit; jeder fehlende Schlüssel produziert Compile-Error.
- `Fragetyp = Frage['typ']` (Z.12) leitet alle Discriminators direkt aus der Union ab — Single source of truth bleibt `fragen-core.ts:701`.
- Subtiler Hinweis für Phase 5: `bilanzstruktur` ist Discriminator-String von `BilanzERFrage` (Type-Name ≠ Discriminator-Wert). Bei Fragetyp-Filter-Logik in Phase 5 darauf achten dass das UI-Label „BilanzER" bleiben kann, während die `typ`-Property `bilanzstruktur` heißt.

**Phase 5 Pre-Step-Fix erforderlich:** Nein.

---

## 5. Findings-Zusammenfassung

| Befund | Status |
|---|---|
| Bundle-Baseline gemessen | LPStartseite 852 KB (gzip 213 KB), Layout 591 KB (gzip 156 KB), PWA 5298 KiB / 256 entries |
| Emoji-Inventar | 467 Matches / 145 Files (identisch zu 16.05.-Annahme) |
| Top-20 Emoji-Codepoints | dokumentiert mit Lucide-Empfehlungen |
| Top-30 Files mit Scope-Klassifikation | 26 IN / 4 OUT — OUT-Matches: 76 (~16%) |
| ✓/✗/✕/✅-Disambiguierung | Phase-4-Spec sollte 2-Variant-Rule etablieren (Status vs Close) |
| Inline-SVG-Inventar | 24 Files: 13 Icon (IN Phase 3) + 11 Content (OUT) |
| TBD-File | `MCFrage.tsx` — Phase-3 muss Icon-vs-Content-SVGs konkret reviewen |
| FRAGETYP_ICON_MAP-Drift | **Kein Drift** (20/20 match), TS-Compiler erzwingt Vollständigkeit |
| `bilanzstruktur` ≠ `BilanzER` | Subtiler Hinweis für Phase 5: Discriminator-String ist `bilanzstruktur` |

**Plan-Spec-Diff:**
- Plan-Liste nannte 12+12 Icon/Content-SVGs → effektiv 13+11. `pdfAnnotationenSVG.test.tsx` wurde im Plan unter Content-SVGs gelistet, ist aber Test-File und damit per Plan-Sub-Task-4 Out-of-Scope-Regel zusätzlich als Test ausgeschlossen.

**Keine kritischen Drifts.** Sub-Task 1 kann als DONE reportet werden. Phase 2 (Bundle-Analyse + Tree-Shaking-Audit) kann starten.

---

## 6. Bundle-Baseline-Daten (TXT)

```
dist/assets/AnalyseDashboard-DMaMptVh.js                 11.52 kB │ gzip:   3.80 kB
dist/assets/App-CfrqKJjV.js                              41.10 kB │ gzip:  11.29 kB
dist/assets/AppUeben-DwV3a25y.js                         86.01 kB │ gzip:  23.50 kB
dist/assets/CodeBlock-O-w-3KIY.js                         3.71 kB │ gzip:   1.42 kB
dist/assets/EinstellungenPanel-DFA10eFI.js              163.99 kB │ gzip:  45.26 kB
dist/assets/Favoriten-CJ_fVnML.js                         7.54 kB │ gzip:   2.38 kB
dist/assets/HilfeSeite-91-F4IM7.js                       51.15 kB │ gzip:  15.75 kB
dist/assets/LPStartseite-BtA3diES.css                    30.39 kB │ gzip:   8.07 kB
dist/assets/LPStartseite-Cb5AnI2W.js                    852.31 kB │ gzip: 213.12 kB
dist/assets/Layout-BFa7tjTJ.js                          591.32 kB │ gzip: 156.35 kB
dist/assets/LoginScreen-DMY5sIZG.js                       4.28 kB │ gzip:   1.75 kB
dist/assets/PapierkorbView-BcTP4R_A.js                    4.89 kB │ gzip:   1.83 kB
dist/assets/PruefungsComposer-NBiZlUKd.js               104.54 kB │ gzip:  23.59 kB
dist/assets/ResizableSidebar-Buv5onps.js                  5.57 kB │ gzip:   2.07 kB
dist/assets/TestBadge-CJz9ih3k.js                        49.21 kB │ gzip:  15.17 kB
dist/assets/einrichtungsFragen-h9ETeFNy.js               28.20 kB │ gzip:   7.70 kB
dist/assets/index-BV_A6IZF.js                            85.08 kB │ gzip:  33.71 kB
dist/assets/index-BXX2igV0.css                          132.91 kB │ gzip:  19.64 kB
dist/assets/index-BcgsVkuV.js                           295.10 kB │ gzip:  91.35 kB
dist/assets/index-BmnlxHjh.js                            29.19 kB │ gzip:   9.74 kB
dist/assets/index-BsB657dE.js                           198.13 kB │ gzip:  64.21 kB
dist/assets/index-ByUrqjvB.js                             3.08 kB │ gzip:   1.36 kB
dist/assets/index-C2JCf_N-.js                            45.54 kB │ gzip:  19.36 kB
dist/assets/index-C6r1F-JP.js                            27.59 kB │ gzip:  12.47 kB
dist/assets/index-CX_61fY8.js                            48.96 kB │ gzip:  16.39 kB
dist/assets/index-CoxOfA7v.js                            41.14 kB │ gzip:  16.96 kB
dist/assets/index-D7_IHpaz.js                            51.59 kB │ gzip:  17.98 kB
dist/assets/index-DQowDsDP.js                            29.05 kB │ gzip:  11.86 kB
dist/assets/index-Hxzdi64o.js                            14.41 kB │ gzip:   6.28 kB
dist/assets/index-_ek7gf0Y.js                             7.60 kB │ gzip:   3.33 kB
dist/assets/index-kSeGKVPq.js                            26.39 kB │ gzip:   8.82 kB
dist/assets/katex-BWB6Gtzj.js                           259.52 kB │ gzip:  77.04 kB
dist/assets/katex-BzTkCl_B.js                           259.52 kB │ gzip:  77.04 kB
dist/assets/pdf-vkbVaD7t.js                             405.70 kB │ gzip: 120.30 kB
dist/assets/pdf.worker.min-B_fnEKel.mjs               1,239.05 kB
dist/assets/pdf.worker.min-DNtBUNEu.js                    0.09 kB │ gzip:   0.11 kB
dist/assets/schulConfigStore-B_nHS7jZ.js                  2.66 kB │ gzip:   1.42 kB
dist/assets/themeStore-Cgei_YK8.js                        0.68 kB │ gzip:   0.40 kB
dist/assets/uebenKorrekturApi-CwezFij2.js                 0.33 kB │ gzip:   0.24 kB
dist/assets/xlsx-CNerDvZX.js                            429.19 kB │ gzip: 142.94 kB
dist/index.html                                           2.28 kB │ gzip:   0.99 kB
dist/manifest.webmanifest                                 0.32 kB
dist/registerSW.js                                        0.17 kB
```

KaTeX-Font-Assets (woff/woff2/ttf, 60 Dateien, jeweils 4–64 KB) sind in obiger Liste weggelassen — sind alle aus `katex@x.x` und liegen außerhalb der Cluster-G-Scope.

PWA-Workbox-Summary:
```
PWA v1.2.0
mode      generateSW
precache  256 entries (5297.83 KiB)
files generated
  dist/sw.js
  dist/workbox-66610c77.js
```
