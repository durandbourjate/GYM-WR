# Media-Phase 6 — Design Spec

**Datum:** 2026-05-09
**Branch:** `media-phase-6` (basierend auf `preview` = Pre-Phase-6 Cleanup)
**Ziel:** Letztes großes Bundle der Media-Migration. Vorarbeit für Type-Removal + Sheet-Migration.

---

## 1 · Ausgangslage (Post-Pre-Phase-6-Cleanup)

**Was schon erledigt ist:**
- Phase 1+2: MediaQuelle-Type + Storage-Format definiert
- Phase 3: Apps-Script SAVE für PDF (`mq_ergaenzeMediaQuelle_` als Read-Defense)
- Phase 4.a/4.b: optional/deferred (Editor-State-Refactor)
- Phase 5: 4 Frontend-Renderer auf `ermittleBildQuelle`/`ermittlePdfQuelle` (PDFKorrektur, PDFFrage, PDFAnnotationAnzeige, VorschauTab)
- Pre-Phase-6 Cleanup (heute): S1 Orphan-Delete, S4 Pool-Konverter Dual-Write, S3 Demo-Daten Dual-Write

**Was Phase 6 noch zu machen hat (laut Phase-3-5-Spec § 9):**
1. Sheet-Daten-Migration via `admin:migrierMediaQuelle` — bestehende Sheet-Rows ergänzen MediaQuelle-Felder. **User-Action** (Apps-Script-Endpoint exists, dryRun-Default).
2. Type-Cleanup: `bildUrl`/`pdfBase64`/`pdfDriveFileId`/`pdfUrl`/`pdfDateiname`/`bildDriveFileId` aus `packages/shared/src/types/fragen-core.ts` entfernen.
3. Apps-Script `mq_ergaenzeMediaQuelle_` Read-Defense rückbauen (oder als Safety-Net behalten).
4. Apps-Script `typenSpezifischeFelder` Schreib-Pfad: nur noch `bild`/`pdf` schreiben.
5. Editor-Code (Validator + Factory + buildFragePreview) auf MediaQuelle umstellen.

**Hindernis:** Type-Cleanup blockt auf Editor-Schreib-Pfad. Editor schreibt aktuell `bildUrl: string` als Pflichtfeld in `fragenFactory.ts` (Z. 247/260/280) und `buildFragePreview.ts` (Z. 149/153/159). Solange Editor `bildUrl` schreibt, kann das Feld nicht aus dem Type weg — sonst tsc-Fehler in 8+ Stellen + Editor schreibt undefined-Felder.

---

## 2 · Architektur-Entscheidungen

### 2.1 Sub-Bundle-Aufteilung — Risiko-Sortierung

| Sub-Bundle | Inhalt | Risiko | Reihenfolge |
|------------|--------|--------|-------------|
| **6.a** | `pflichtfeldValidation.ts` Read über Resolver statt direkt `frage.bildUrl` | Niedrig (Read-Refactor) | **Heute** |
| **6.b** | `buildFragePreview.ts` + `fragenFactory.ts` Dual-Write `bild`/`pdf` zusätzlich zu Alt-Feldern | Niedrig-Mittel (Editor-Schreib-Pfad) | **Heute** |
| **6.c** | Editor-State-Refactor: `bildUrl: string` → `bild: MediaQuelle \| null` als Editor-State (entspricht Phase 4.a/4.b) | Hoch (Editor-UX, viele Files) | **Spawn-Task** (eigenes Bundle, Voraussetzung für Type-Removal) |
| **6.d** | Type-Removal `bildUrl`/`pdfUrl` etc. aus `fragen-core.ts` + alle Konsumenten | Hoch (Compile-Cascade) | **Spawn-Task** (nach 6.c) |
| **6.e** | Apps-Script `parseFrage`/`typenSpezifischeFelder` Schreib-Pfad nur noch MediaQuelle | Mittel (Wire-Vertrag) | **Spawn-Task** (parallel zu 6.d) |
| **6.f** | Sheet-Daten-Migration via `admin:migrierMediaQuelle` | Mittel (LIVE-Daten) | **User-Action** (separat, vor 6.c–6.e) |

**Heute (diese Session) deckt nur 6.a + 6.b ab** — niedrig-Risiko, isoliert, bereitet Type-Removal vor ohne ihn zu erzwingen. Die schweren Sub-Bundles 6.c–6.e bekommen eigene Spec/Plan/E2E-Loops.

### 2.2 Why klein-anfangen statt All-In-One

- Pre-Phase-6 Cleanup hat schon kleine Sub-Bundles bewährt (S1+S3+S4).
- Memory-Lehre „Bundle-CC: hoch-Risiko-Klassifikation ≠ hoch-Risiko-Cut" — aber hier ist Type-Cleanup wirklich hoch-Risiko (8+ Konsumenten).
- Memory-Lehre „Service-Worker-Cache nach Wire-Vertrag-Bundles" — Apps-Script-Schreib-Pfad-Änderung ist Wire-Vertrag.
- Risiko-Mitigation: kleine Bundles können separat gerollt werden, wenn ein Sub-Bundle bricht.

### 2.3 Self-Review-Modus für 6.a + 6.b (niedrig-Risiko)

Wie Pre-Phase-6 Cleanup. 6.c–6.e bekommen Reviewer-Loop wenn sie kommen.

---

## 3 · Sub-Bundle 6.a: Validator-Resolver-Migration

### 3.1 Was geändert wird

`packages/shared/src/editor/pflichtfeldValidation.ts`:
- Z. 194: `const bildOk = strNonEmpty(frage.bildUrl)` → `const bildOk = ermittleBildQuelle(frage) !== null`
- Z. 226: gleicher Pattern
- Z. 266: gleicher Pattern
- Z. 473: `const pdfOk = strNonEmpty(frage.pdfDriveFileId) || strNonEmpty(frage.pdfUrl) || strNonEmpty(frage.pdfBase64)` → `const pdfOk = ermittlePdfQuelle(frage) !== null`

### 3.2 Warum

- **Konsistenz:** Renderer (Phase 5) lesen über Resolver. Validator macht das auch — entkoppelt Pflichtfeld-Check vom internen Type-Schema.
- **Future-proof:** Wenn Alt-Felder in Phase 6.d entfernt werden, funktioniert Validator weiter (Resolver hat eigenes `AltBildFrage`/`AltPdfFrage`-Interface).
- **Niedriges Risiko:** Validator ist Read-only, kein Wire-Vertrag-Effekt.

### 3.3 DoD

- [ ] 4 Stellen in `pflichtfeldValidation.ts` umgestellt
- [ ] tsc -b clean
- [ ] vitest grün (`pflichtfeldValidation.test.ts` bestehende Tests)
- [ ] +2 Vitest-Cases: Validator akzeptiert Frage mit `bild: MediaQuelle` ohne `bildUrl`; Validator akzeptiert PDF-Frage mit `pdf: MediaQuelle` ohne Alt-Felder

---

## 4 · Sub-Bundle 6.b: Editor-Dual-Write

### 4.1 Was geändert wird

**`packages/shared/src/editor/fragenFactory.ts`** (3 Bild-Sub-Types: hotspot, bildbeschriftung, dragdrop_bild, ~Z. 247/260/280):
- Aktuell: liest `typDaten.bildUrl` als String, schreibt `bildUrl` ins Frage-Objekt.
- Neu: schreibt zusätzlich `bild: MediaQuelle` via Migrator (`bildQuelleAus({bildUrl})`). Dual-Write wie S3/S4.

**`packages/shared/src/editor/buildFragePreview.ts`** (Z. 149/153/159):
- Aktuell: `{ ...basis, bildUrl: s.bildUrl, bereiche: s.hsBereiche }` — schreibt nur `bildUrl`.
- Neu: zusätzlich `bild: bildQuelleAus({bildUrl: s.bildUrl}) ?? undefined` Dual-Write.

**PDF-Pendant in `fragenFactory.ts` und `buildFragePreview.ts`** (falls vorhanden) — gleicher Pattern.

### 4.2 Warum

- **Vorbereitet Type-Removal:** Wenn 6.d kommt und `bildUrl` aus dem Type entfernt, kann Editor-Schreib-Pfad einfach den `bildUrl`-Write entfernen — `bild` ist schon da.
- **Future Apps-Script-Migration sicher:** Apps-Script `parseFrage` liest beide Felder. Wenn 6.e Apps-Script auf nur-`bild` umstellt, kann Editor weiter Frontend-konsistent schreiben.
- **Konsistent zu Pool-Konverter (S4) und Demo-Daten (S3):** alle Schreib-Pfade machen Dual-Write.

### 4.3 DoD

- [ ] `fragenFactory.ts`: 3 Bild-Cases + ggf. PDF-Case Dual-Write
- [ ] `buildFragePreview.ts`: 3 Bild-Stellen Dual-Write
- [ ] tsc -b clean
- [ ] vitest 1517 → 1517+N (`buildFragePreview.test.ts` bestehende 22 Tests + neue für `bild`-Output)
- [ ] Bestehende Editor-Tests grün

---

## 5 · DoD für Bundle (heute)

- [ ] vitest passed (Drift-Bilanz dokumentieren)
- [ ] tsc -b clean
- [ ] 4× lint clean (lint:as-any 0, lint:no-alert 0, lint:no-tests-dir clean, lint:musterloesung Baseline)
- [ ] vite build grün
- [ ] Browser-E2E auf Staging mit echten LP+SuS-Logins:
  - LP: Pruefen-Tab + Composer-Editor öffnet (Pflichtfeld-Validator nicht broken)
  - SuS: Übung-Start (Renderer nicht broken)
  - 0 NEUE Console-Errors

---

## 6 · Was NICHT in dieser Session

- **6.c Editor-State-Refactor (Phase 4.a/4.b)** — Editor-State `bildUrl: string` → `bild: MediaQuelle | null`. Touchiert ~12 Files (BildUpload, BildMitGenerator, HotspotEditor, BildbeschriftungEditor, DragDropBildEditor, PDFEditor, fragenFactory, buildFragePreview, SharedFragenEditor, etc.). **Spawn-Task** mit eigener Spec.
- **6.d Type-Removal** — `bildUrl`/`pdfUrl` etc. aus `fragen-core.ts`. **Voraussetzung: 6.c**. Spawn-Task.
- **6.e Apps-Script Schreib-Pfad-Cleanup** — `parseFrage`/`typenSpezifischeFelder` Alt-Spalten-Removal. **Spawn-Task**, parallel zu 6.d möglich (Apps-Script ist isoliert).
- **6.f Sheet-Daten-Migration** — `admin:migrierMediaQuelle` mit `dryRun: false` aufrufen (User-Action). **Vor 6.d/6.e nötig**, sonst alte Daten ohne MediaQuelle-Felder. Apps-Script-Endpoint ist fertig.

---

## 7 · Risiko + Rollback

**6.a + 6.b zusammen = niedrig-Mittel.** Reine Read-Refactor + Dual-Write-Erweiterung. Keine Wire-Vertrag-Änderung. Resolver hat eigenes Interface — funktioniert auch mit Alt-Daten.

**Rollback:** `git revert <sub-bundle>` pro Commit. 6.a isoliert, 6.b isoliert.

---

## 8 · Lehren aus Pre-Phase-6 Cleanup

- **Aufwärm-Bundle vor großem Bundle bewährt.** Heute 6.a+6.b als Aufwärm vor 6.c–6.f.
- **Sub-Bundle-Aufteilung nach Risiko-Klasse** — kleine vor große, isoliert vor cascade.
- **Service-Worker-Cache-Reset nur bei Wire-Vertrag-Änderung.** 6.a+6.b hat keinen → nicht erzwingen.

---

## 9 · Bonus: useFrageMode-Bug in SuSVorschau (Phase-6-Vorbereitung)

**Bug:** `SuSVorschau.tsx:112` rendert `<Layout />` ohne `<FrageModeProvider>` — Layout ruft Renderer auf, die `useFrageMode()` nutzen → ErrorBoundary triggert mit `useFrageMode muss innerhalb eines FrageModeProvider verwendet werden`.

**Existiert seit:** Bundle V Memory dokumentiert (PruefungsComposer-Vorschau-Pfad).

**Fix (1 File, 2 Zeilen):** `<Layout />` in `<FrageModeProvider mode="pruefung">` einwickeln. Pattern wie `App.tsx` Z. 354 + `AppUeben.tsx` Z. 210.

**Warum jetzt fixen:** 6.c+6.d+6.e+6.f Browser-E2E auf Staging brauchen Composer-Vorschau (= SuSVorschau) für End-to-End-Tests des Editor-State-Refactor. Ohne Fix bleiben diese E2E-Pfade blockiert.

**Risiko:** Niedrig. Reine Provider-Wrap-Änderung, kein Logic-Effekt. Nur Composer-Vorschau betroffen (App.tsx + AppUeben.tsx haben Provider bereits).

**DoD:**
- [x] FrageModeProvider import in SuSVorschau.tsx
- [x] `<Layout />` in `<FrageModeProvider mode="pruefung">` gewrappt
- [x] tsc -b clean
- [ ] Browser-E2E auf Staging: LP Composer → Vorschau-Tab → "Interaktive SuS-Vorschau" → SuSVorschau-Modal öffnet ohne ErrorBoundary

---

## 10 · 6.c Granularität (Folge-Sessions)

6.c ist zu groß für eine Session — wird in 6 Sub-Sub-Bundles aufgeteilt:

| Sub-Sub-Bundle | Dateien | Aufwand |
|----------------|---------|---------|
| 6.c.i | `BildUpload.tsx` (Editor-Komponente) | 1 Session |
| 6.c.ii | `BildMitGenerator.tsx` + `HotspotEditor.tsx` (Bild-Editoren) | 1 Session |
| 6.c.iii | `BildbeschriftungEditor.tsx` + `DragDropBildEditor.tsx` | 1 Session |
| 6.c.iv | `PDFEditor.tsx` (komplett, 4 Alt-Felder zu 1) | 1 Session |
| 6.c.v | `SharedFragenEditor.tsx` Mount-Refactor + `fragenFactory.ts`/`buildFragePreview.ts` Final-Cleanup | 1 Session |
| 6.c.vi | Cleanup + Audit aller Editor-Konsumenten (ggf. Cascade-Fixes) | 1 Session |

Jeweils eigener Spec + Plan + Reviewer-Loop + E2E. Out-of-Scope dieser Spec.

**Reihenfolge:** Per Risiko aufsteigend. BildUpload zuerst (kleinste isolierte Komponente), SharedFragenEditor als Mount-Refactor zuletzt.
