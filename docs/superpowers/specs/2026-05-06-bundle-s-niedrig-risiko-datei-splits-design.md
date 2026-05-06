# Bundle S — Niedrig-Risiko-Datei-Splits (Master-Spec)

**Datum:** 2026-05-06
**Status:** Draft (vor Spec-Review)
**Bezug:** [`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md), Section A3 + Roadmap-Bundle-S

## 1. Kontext

ExamLab-Vereinfachungs-Audit (2026-05-05) identifiziert 17 Files >500 Zeilen, davon 5 mit niedrigem Refactor-Risiko. Roadmap-Phase 1 (Begriffe: Bundle M Fragenbank-Rename, N+V action/aktion, Q Test-Verzeichnisse) und Phase 2 Pattern-Vereinheitlichung (O Store-Naming, R Error-Handling) sind auf main. Bundle S schliesst Phase 2 ab durch mechanische Strategy-Extraktion in den 5 niedrig-Risiko-Hotspots. Phasen 3 (P Field-Drift, T Hooks-Splits) und 4 (U PDFSeite) folgen separat.

## 2. Ziel

Die 5 Niedrig-Risiko-File-Hotspots per Strategy-Extraktion in fokussierte Sub-Module zerlegen, **ohne Verhaltensänderung**. Hotspot-Bilanz **17 → 12 Files >500 Z.**

## 3. Scope

### In Scope

| File | Zeilen | Sub-Bundle |
|---|---:|---|
| `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` | 846 | S.a |
| `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` | 810 | S.a |
| `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx` | 643 | S.b |
| `ExamLab/src/utils/poolConverter.ts` | 744 | S.c |
| `ExamLab/src/utils/fibuAutoKorrektur.ts` | 600 | S.c |

### Out of Scope

- Logik-Änderungen, Rendering-Verhalten, Berechnungs-Resultate
- Test-Coverage-Aufbau für die ungetestet bleibenden 4 Files (eigenes Bundle)
- Hooks-Extraktion in mittel-Risiko-Files (Bundle T)
- Fragetyp-zentrische Feature-Folder-Reorganisation (eigenes Bundle T+)
- Apps-Script / Backend / Wire-Vertrag-Änderungen
- Audit der `musterlosung`/`musterloesung`/`musterLoesung`-Schreibweisen (Bundle P)

## 4. Splitting-Prinzip (Pattern für alle 5 Files)

Folder-Pattern, Strategy-pro-Datei, Caller-Imports unverändert.

### 4.1 Folder-Layout

```
<original-pfad>.<ext>            ENTFÄLLT
              ↓
<original-pfad>/                 NEU (Folder, Original-Pfad als Folder-Pfad)
  index.<ext>                    Dispatcher + Default-Export (= bisheriger Default)
  <Strategy>.<ext>               Pro Fragetyp / Sub-Konzept eine Datei
  util.<ext>                     Geteilte Helper, falls vorhanden
```

### 4.2 Caller-Vertrag

Import-Pfade bleiben byte-identisch. Folder-Resolution (Node, Vite) löst auf `/index.{ts,tsx}` auf. **Null Caller-Änderungen.**

```ts
// Vor und nach Bundle S identisch:
import KorrekturFrageVollansicht from '.../KorrekturFrageVollansicht'
```

### 4.3 Strategy-Definition

- **Renderer-Files** (Korrektur/Druck/Vorschau): jede `<Fragetyp>Anzeige` / `<Fragetyp>Druck` / `<Fragetyp>Vorschau` Funktion → eigene Sub-Datei.
- **Utils** (poolConverter/fibuAutoKorrektur): jede exportierte Top-Level-Funktion bzw. zentrale Strategy-Funktion → eigene Sub-Datei.

### 4.4 Naming-Konvention

Sub-Dateien tragen den Strategy-Namen genau (z.B. `MCAnzeige.tsx`, `BuchungssatzDruck.tsx`, `korrigiereBuchungssatz.ts`). Keine Pluralisierung, keine Fragetyp-Subfolder.

### 4.5 Helper-Verteilung

- Helper, der nur von einer Strategy genutzt wird → in derselben Sub-Datei (private Funktion).
- Helper, der von mehreren Strategies oder vom Dispatcher genutzt wird → `util.<ext>`.
- Konstanten wie `BUCHSTABEN`, `POOL_IMG_BASE_URL` → `util.<ext>`.

## 5. Sub-Bundles

### 5.1 S.a — Renderer-Splits (KorrekturFrageVollansicht + DruckAnsicht)

#### 5.1.1 KorrekturFrageVollansicht

Ziel-Layout (21 Sub-Files):

```
lp/korrektur/KorrekturFrageVollansicht/
  index.tsx                     Default-Export + Dispatcher (~60-80 Z. nach Split)
  util.ts                       frageHaupttext, KeineAntwort
  AutoKorrekturDetails.tsx
  MusterloesungBox.tsx          (heaviest sub, ~118 Z.)
  MCAnzeige.tsx
  RFAnzeige.tsx
  FreitextAnzeige.tsx
  BerechnungAnzeige.tsx
  LueckentextAnzeige.tsx
  ZuordnungAnzeige.tsx
  BuchungssatzAnzeige.tsx
  TKontoAnzeige.tsx
  KontenbestimmungAnzeige.tsx
  BilanzERAnzeige.tsx
  FormelAnzeige.tsx
  VisualisierungAnzeige.tsx
  PDFAnnotationAnzeige.tsx
  AudioAnzeige.tsx
  CodeAnzeige.tsx
  SortierungAnzeige.tsx
  HotspotAnzeige.tsx
  BildbeschriftungAnzeige.tsx
  DragDropBildAnzeige.tsx
```

#### 5.1.2 DruckAnsicht

Ziel-Layout (~16 Sub-Files):

```
lp/vorbereitung/composer/DruckAnsicht/
  index.tsx                     Main + DruckFrage + DruckAnhaenge + FrageInhalt-Dispatcher (~110-130 Z.)
  util.tsx                      BUCHSTABEN, ZeichenDruck, PDFHinweis, DigitalHinweis, CodeDruck, FormelDruck (Stub-Hinweise)
  MCDruck.tsx
  RichtigFalschDruck.tsx
  FreitextDruck.tsx
  LueckentextDruck.tsx
  ZuordnungDruck.tsx
  BerechnungDruck.tsx
  BuchungssatzDruck.tsx
  TKontoDruck.tsx
  KontenbestimmungDruck.tsx
  BilanzDruck.tsx
  AufgabengruppeDruck.tsx       (~270 Z. inkl. TeilaufgabeInhalt — bleibt zusammen)
  SortierungDruck.tsx
  HotspotDruck.tsx
  BildbeschriftungDruck.tsx
  DragDropBildDruck.tsx
```

`TeilaufgabeInhalt` bleibt im Modul `AufgabengruppeDruck.tsx` (private Helper, nur dort verwendet).

### 5.2 S.b — Vorschau-Split (VorschauTab)

Ziel-Layout (13 Sub-Files):

```
lp/vorbereitung/composer/VorschauTab/
  index.tsx                     Main + FrageVorschau-Dispatcher (~130-150 Z.)
  zeitbedarf.ts                 schaetzeZeitbedarf (pure utility)
  AnhangMedien.tsx
  MCVorschau.tsx
  FreitextVorschau.tsx
  LueckentextVorschau.tsx
  ZuordnungVorschau.tsx
  RichtigFalschVorschau.tsx
  BerechnungVorschau.tsx
  BuchungssatzVorschau.tsx
  TKontoVorschau.tsx
  KontenbestimmungVorschau.tsx
  BilanzERVorschau.tsx
  AufgabengruppeVorschau.tsx
```

### 5.3 S.c — Utils-Splits (poolConverter + fibuAutoKorrektur)

#### 5.3.1 poolConverter

Ziel-Layout (3-4 Sub-Files; finale Struktur in S.c-Audit-Phase):

```
utils/poolConverter/
  index.ts                      Re-Exports + main convert + mapFachbereich + mapBloom + POOL_IMG_BASE_URL
  punkte.ts                     berechnePunkte
  zeitbedarf.ts                 schaetzeZeitbedarf
  konvertierer.ts               Pool-Frage-zu-Frage-Konverter (Detail-Schnitt in Phase-Audit)
```

Test-File `poolConverter.test.ts` bleibt unverändert (Import-Pfad löst auf `index.ts`).

#### 5.3.2 fibuAutoKorrektur

Ziel-Layout (6 Sub-Files):

```
utils/fibuAutoKorrektur/
  index.ts                      Re-Exports der 4 Korrektur-Funktionen + KorrekturErgebnis/KorrekturDetail Interfaces
  buchungssatz.ts               korrigiereBuchungssatz + bewerteBuchungVereinfacht
  tkonto.ts                     korrigiereTKonto + bewerteTKontoEintraege
  kontenbestimmung.ts           korrigiereKontenbestimmung
  bilanzER.ts                   korrigiereBilanzER
  util.ts                       norm, kontenSetGleich, gleicheReihenfolge
```

## 6. Mikro-Workflow pro Sub-Bundle

Jedes Sub-Bundle (S.a, S.b, S.c) durchläuft 4 Phasen auf eigener Branch:

1. **Audit** (Lesen) — Strategy-Boundaries verifizieren, Closure-/Helper-Abhängigkeiten finden, finale Sub-File-Liste fixieren. Pro File ~10 min.
2. **Extraktion** (Code-Bewegung) — Sub-File anlegen, Strategy + private Helper verschieben, Imports im neuen `index` einfügen. Atomare Commits: pro Strategy oder pro File (Phase-Plan-Entscheid).
3. **Verifikation** — Lokal-Gates (Sektion 7.1), dann Browser-E2E-Spot-Check (Sektion 7.3).
4. **Merge** — PR auf main (kein preview-Force-Push, kein Apps-Script-Deploy), HANDOFF.md aktualisieren, Memory-Eintrag schreiben.

**Pro Sub-Bundle eigener Plan:** Master-Spec (dieses Dokument) gilt für alle 3. Plan für S.a wird sofort nach Spec-Approval geschrieben. Pläne für S.b und S.c folgen in den Folge-Sessions, basierend auf S.a-Erfahrung.

## 7. Verifikations-Strategie

### 7.1 Lokal-Gates (vor jedem Push)

| Gate | Erwartung |
|---|---|
| `npm run build` | clean (ExamLab + packages/shared) |
| `npx tsc -b --noEmit` | 0 errors (force-Routine wegen tsc-b-Quirk; siehe `feedback_tsc_b_exit_misleading.md`) |
| `npm run vitest -- run` | **1234 grün** (Bundle S ändert kein Test-Setup) |
| `npm run lint:as-any` | 0 Treffer |
| `npm run lint:no-alert` | 0 Treffer |
| `npm run lint:no-tests-dir` | 0 Treffer |
| `git diff --stat` | Spot-Check: nur Datei-Bewegung, kein Logik-Diff |

### 7.2 Pages-Deploy-Vorbedingung

Vor Start jedes Sub-Bundles: GH Actions UI prüfen, dass `main` einen **grünen** Pages-Deploy hat. Wenn der letzte Run `cancelled` ist (Concurrency-Cancel), per Hand `re-run` triggern und auf grün warten. Sub-Bundle-Merges nicht überlappen lassen — pro Zeitpunkt max. ein Bundle-S-Merge in flight.

### 7.3 Browser-E2E-Spot-Check pro Sub-Bundle

Echte LP+SuS-Logins, nicht Demo (siehe `feedback_echte_logins.md`). Service-Worker-Cache vor jedem E2E zurücksetzen (`unregister + caches.delete + reload`; siehe `feedback_service_worker_cache_wire_bundle.md`).

| Sub-Bundle | Pfad | Verifikation |
|---|---|---|
| **S.a — Korrektur** | LP-Korrektur-View | 2 Korrektur-Detail-Pfade: 1× MC + 1× komplexer Fragetyp (BilanzER oder Hotspot); Musterlösung-Box rendert; AutoKorrekturDetails ohne Fehler |
| **S.a — Druck** | LP-Vorbereitung → Drucken | Multi-Fragetyp-Prüfung drucken; Stichprobe MC + RichtigFalsch + Berechnung + Aufgabengruppe; PDF-Output visuell unverändert |
| **S.b — Vorschau** | LP-Vorbereitung → Vorschau-Tab | Gleiche Prüfung: alle Fragetyp-Vorschauen rendern; Zeitbedarf-Summe stimmt |
| **S.c — poolConverter** | SuS-Üben → Pool-Frage | Pool-Frage starten + abgeben pro Fragetyp-Kategorie (MC, Buchungssatz, BilanzER) |
| **S.c — fibuAutoKorrektur** | LP-Korrektur mit AutoKorrektur | 1× Buchungssatz, 1× TKonto, 1× Kontenbestimmung, 1× BilanzER; Auto-Ergebnis vergleichen |

## 8. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| **Closure-Capture in Sub-Komponenten** — Inner-Fn nutzt äusseren `const`/Helper | mittel | Build-Error / Subtle-Bug | Pro Strategy beim Verschieben Dependency-Audit (`grep` für freie Identifier); private Helper mitnehmen, geteilte in `util.<ext>` |
| **Default-Export ändert sich** — `index.tsx` exportiert nicht den ursprünglichen Default | niedrig | Caller-Crash | Smoke-Build verifiziert; `export default function` direkt im `index` |
| **Test-Drift bei poolConverter** | niedrig | vitest rot | Folder-Pattern erhält Pfad. Falls Test deep-import braucht: bewusst hinzufügen, nicht versteckt |
| **Pages-Deploy-Stau** | mittel (1× bekannt 2026-05-06) | Stale Live-Site, E2E gegen falsche Version | Pre-Start grünes main; max. 1 Bundle-S-Merge in flight |
| **Cross-Cutting-Imports** — Sub-Datei braucht Helper aus anderem Top-Level | mittel | Zirkuläre Imports | Audit-Phase pro File scannt explizit auf In-Folder vs. Out-of-Folder |
| **Files >500 nach Split** — `AufgabengruppeDruck.tsx` (~270 Z. inkl. `TeilaufgabeInhalt`) | niedrig | Hotspot-Bilanz nicht voll erreicht | Akzeptieren: 270 Z. unter 500-Schwelle. Falls trotzdem >500: weiteres Sub-Modul (`teilaufgabe.tsx`) |
| **Vite-HMR-Bugs nach Folder-Restructure** | niedrig | Lokales Devel-UX-Issue | Dev-Server-Restart nach Folder-Restructure ist Routine |
| **Pattern-Bruch in S.b/S.c nach S.a** | niedrig | Mid-Bundle-Pivot | Master-Spec fixiert Pattern; bei Pivot: Spec-Update + neuer Review |

**Rollback-Plan:** Atomare Commits ermöglichen `git revert` einer kompletten Strategy-Verschiebung. Branch lokal+remote bis 1 Woche nach Merge behalten.

## 9. Reihenfolge & Aufwand

| Sub-Bundle | Files | Sub-Files (geschätzt) | Branch | Aufwand |
|---|---|---:|---|---|
| **S.a** | KorrekturFrageVollansicht + DruckAnsicht | ~37 | `refactor/bundle-s-a-renderer-splits` | 1 Session |
| **S.b** | VorschauTab | ~13 | `refactor/bundle-s-b-vorschau-split` | 0.5 Session |
| **S.c** | poolConverter + fibuAutoKorrektur | ~10 | `refactor/bundle-s-c-utils-splits` | 0.5–1 Session |

Reihenfolge-Begründung: S.a etabliert das Folder-Pattern an 2 Renderer-Files (höchster Hebel). S.b bestätigt das Pattern. S.c migriert die strukturell anderen Utils zuletzt — dann ist das Pattern Routine.

## 10. Akzeptanz-Kriterien

- [ ] 5 Folder mit `index.{ts,tsx}` Dispatcher existieren (1× pro File aus Section 3 Tabelle)
- [ ] Caller-Imports byte-identisch (grep verifizierbar: keine Caller-Änderungen in `git log -p`)
- [ ] vitest **1234 grün** nach jedem Sub-Bundle
- [ ] `tsc -b`, `build`, `lint:as-any`, `lint:no-alert`, `lint:no-tests-dir` clean
- [ ] Browser-E2E-Spot-Check-Pfade aus Tabelle 7.3 alle ✓
- [ ] Pages-Deploy nach jedem Sub-Bundle-Merge grün
- [ ] HANDOFF.md + Memory-Eintrag pro Sub-Bundle
- [ ] Hotspot-Bilanz Files >500 Z. von **17 → 12** (verifizierbar via `find … -name '*.ts*' -exec wc -l {} \;`)

## 11. Anschluss

Nach Bundle S Merge aller 3 Sub-Bundles:
- Phase 2 Cleanup-Roadmap abgeschlossen.
- Phase 3: Bundle P (musterlosung Field-Drift) oder Bundle T (Mittel-Risiko-Hooks-Splits) wählen.
- Phase 4: Bundle U (PDFSeite Hoch-Risiko-Split) optional.
