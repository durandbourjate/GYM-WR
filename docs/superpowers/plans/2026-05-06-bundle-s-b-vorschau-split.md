# Bundle S.b — VorschauTab-Split Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mechanische Strategy-Extraktion von `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx` (643 Z.) in Folder-Pattern (`VorschauTab/index.tsx` als Dispatcher + Sub-Dateien pro Vorschau-Strategy + 1 util + 1 Anhang-Komponente), ohne Verhaltensänderung.

**Architecture:** Folder-Pattern aus Master-Spec Sektion 4: Datei wird zu einem Folder mit `index.tsx` als Dispatcher. Caller-Imports byte-identisch via Folder-Resolution. Cutover-Strategie analog Bundle S.a: erst Folder mit allen Sub-Dateien anlegen (alte Datei wins Resolution), dann in einem Cutover-Commit die alte Datei löschen UND den einen Caller mit expliziter `.tsx`-Extension fixen (sonst transient broken state).

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4, vitest 3, ESLint 9.

**Bezug:**
- Master-Spec: [`docs/superpowers/specs/2026-05-06-bundle-s-niedrig-risiko-datei-splits-design.md`](../specs/2026-05-06-bundle-s-niedrig-risiko-datei-splits-design.md) (Sektion 5.2)
- Vorgänger-Plan (Pattern-Referenz): [`docs/superpowers/plans/2026-05-06-bundle-s-a-renderer-splits.md`](./2026-05-06-bundle-s-a-renderer-splits.md)
- Pattern-Referenz on disk: `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht/` (Folder identical depth, S.a-merged — Pfade aus dort sind kanonisch).

**Sub-File-Anzahl:** Master-Spec Sektion 5.2 nennt „13 Sub-Files". Reale Zerlegung: **14 Sub-Files** (Spec-Tabelle untercountet — wahrscheinlich `zeitbedarf.ts` zählt als Sub-File, aber `index.tsx` selbst auch — kommt auf Zählweise an). Tatsächlich erforderlich für vollständige Strategy-Extraktion: 1 `index.tsx` (Main + interner FrageVorschau-Dispatcher) + 1 `zeitbedarf.ts` (pure utility) + 1 `AnhangMedien.tsx` (Sub-Comp mit Lightbox-State) + 11 `<Fragetyp>Vorschau.tsx`. Die Diskrepanz ist explizit dokumentiert; Spec-Compliance bleibt erhalten (Folder-Pattern, byte-identische Caller-Imports).

**Vitest-Baseline (Stand 2026-05-06 nach Bundle-S.a-Merge):** **1253 passed | 4 todo (1257 total)**, 161 Test Files, 1 skipped. Erwartung: nach S.b unverändert (drift = 0 für mechanische Refactors).

**Hotspot-Bilanz Ziel:** Files >500 Z. **15 → 14** (VorschauTab.tsx 643 raus).

**Path-Tiefen-Konvention (CRITICAL):** Sub-Files in `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/` liegen **6 Levels** unter `ExamLab/src/`. D.h. relative Pfade aus den Sub-Files (NICHT aus `index.tsx`-Geschwistern, sondern aus der Sub-Datei selbst):
- `../../../../../types/...` → `src/types/` (5 ups + `types/`)
- `../../../../../utils/...` → `src/utils/` (5 ups + `utils/`)
- `../../../../MediaAnhang...` → `src/components/MediaAnhang.tsx` (4 ups + `MediaAnhang`)
- `../DruckAnsicht` → `composer/DruckAnsicht/` (1 up + Folder, da Geschwister im selben `composer/`)

Empirisch verifiziert via `DruckAnsicht/AufgabengruppeDruck.tsx` (S.a-merged). **Verfasser des Plans (rev1) hatte 1 Level zu wenig.** Fix in Rev2 angewendet, alle Code-Blöcke + Audit-Notiz unten benutzen die korrigierten 5-/4-up-Pfade.

Original-Datei VorschauTab.tsx (`composer/VorschauTab.tsx`, **1 Level höher** als die Sub-Files) verwendet 4 ups statt 5; diese Original-Pfade NICHT 1:1 in die Sub-Files kopieren.

**Pre-Commit-Audit-Befund (Master-Direct-Bash):**
- 1 Caller `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx:23` — `import VorschauTab from './composer/VorschauTab.tsx'` mit **expliziter `.tsx`-Extension** (S.a-Lehre #2: bricht Folder-Resolution, MUSS im Cutover-Commit zu `'./composer/VorschauTab'` gedroppt werden).
- VorschauTab importiert: `useState` (React), Types aus `pruefung.ts` + `fragen-storage`, Helpers aus `kontenrahmen.ts`/`zeit.ts`/`fachUtils.ts`/`textFormatierung.tsx`, Components `MediaAnhang.tsx` + `DruckAnsicht`. Keine `@shared`-Imports relevant für die Vorschau-Sub-Dateien (alle Sub-Vorschauen brauchen nur Storage-Types).
- Sub-Strukturen im Original (Funktionen mit `^function` ab Z. 178):
  - `schaetzeZeitbedarf` (Z. 178-193, ~16 Z.) — pure utility, 2× verwendet (im Main + im FrageVorschau-Dispatcher)
  - `FrageVorschau` (Z. 196-270, ~75 Z.) — Dispatcher pro Frage
  - `MCVorschau` (Z. 272-298)
  - `FreitextVorschau` (Z. 300-310)
  - `LueckentextVorschau` (Z. 312-331)
  - `ZuordnungVorschau` (Z. 333-359)
  - `RichtigFalschVorschau` (Z. 361-385)
  - `BerechnungVorschau` (Z. 387-416)
  - `BuchungssatzVorschau` (Z. 418-450)
  - `TKontoVorschau` (Z. 452-489)
  - `KontenbestimmungVorschau` (Z. 491-534)
  - `BilanzERVorschau` (Z. 536-574)
  - `AufgabengruppeVorschau` (Z. 576-609)
  - `AnhangMedien` (Z. 612-643) — verwendet `useState` für Lightbox

---

## Phase 0 — Branch-Setup & Audit

### Task 0.1: Branch-Status verifizieren

**Files:** keine

- [ ] **Step 1: Branch + Repo-Stand bestätigen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git branch --show-current
git status
git log --oneline -3
```

Expected:
- Branch: `refactor/bundle-s-b-vorschau-split` (vom Master abgeleitet, fresh nach S.a-Merge)
- `git status` clean (oder nur untracked Files ausserhalb von ExamLab/)
- HEAD ist auf oder nach `ad70bed` (S.a Merge-Commit)

**Falls Branch noch nicht existiert** (cold-start):
```bash
git checkout main && git pull --ff-only
git checkout -b refactor/bundle-s-b-vorschau-split
```

- [ ] **Step 2: Remote-Push (für spätere PR + Subagent-Sichtbarkeit)**

```bash
git push -u origin refactor/bundle-s-b-vorschau-split
```

Expected: Branch wird auf GitHub angelegt.

### Task 0.2: Pages-Deploy-Vorbedingung

**Files:** keine (User-Action)

- [ ] **Step 1: User bestätigt grünen Pages-Deploy auf main** (per Spec Sektion 7.2). User öffnet GitHub Actions UI für `main` und meldet, dass der letzte Pages-Deploy grün ist. Falls `cancelled` oder `failure`: per Hand re-run und auf grün warten BEVOR Phase 1 startet.

(Beim Master-Subagent: dieser Step ist user-pending; bei Subagent-Implementation überspringen, der Master fragt vor Merge nochmal.)

### Task 0.3: Baseline-Verifikation

**Files:** keine (read-only)

- [ ] **Step 1: Vitest-Baseline bestätigen**

```bash
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
```

Expected: `Test Files  161 passed | 1 skipped (162)` und `Tests  1253 passed | 4 todo (1257)`. Falls Drift: aktuellen Count notieren als neue Baseline für Phase-Verifikation.

- [ ] **Step 2: tsc-Baseline**

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-b-tsc-baseline.log
```

Expected: Exit 0, **Output-Inspektion** (per Memory `feedback_tsc_b_exit_misleading.md`): keine TS-Errors-Lines. Falls TS-Errors trotz Exit 0: STOP, Master ist auf inkrementellem Build-Müll, `git clean -xfd ExamLab/dist ExamLab/.tsbuildinfo` und retry.

- [ ] **Step 3: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```

Expected: Exit 0 für alle drei.

- [ ] **Step 4: Build-Baseline**

```bash
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: `✓ built in …`. Keine Errors.

### Task 0.4: Closure-/Free-Identifier-Audit für VorschauTab.tsx

**Files:** Read-only Analyse von `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx`

- [ ] **Step 1: Imports inspizieren**

```bash
sed -n '1,15p' ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx
```

Notieren:
- `useState` (React)
- Types: `PruefungsConfig`, `Frage`, `FrageAnhang`, `MCFrage`, `FreitextFrage`, `LueckentextFrage`, `ZuordnungFrage`, `RichtigFalschFrage`, `BerechnungFrage`, `BuchungssatzFrage`, `TKontoFrage`, `KontenbestimmungFrage`, `BilanzERFrage`, `AufgabengruppeFrage`
- Helper: `kontoLabel`, `formatDatum`, `typLabel`, `fachbereichFarbe`, `formatFragetext`
- Components: `MediaAnhang`, `DruckAnsicht`

- [ ] **Step 2: Funktions-Längen-Übersicht (Konsolidations-Check)**

```bash
awk '/^function /{name=$2; start=NR} /^}$/{if(start){print NR-start " " name; start=0}}' ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx
```

Expected: Liste mit ~14 Funktionen. **Default-Entscheidung:** alle Vorschau-Funktionen bleiben separat (Pattern-Konsistenz mit S.a). Konsolidieren NICHT — auch wenn `FreitextVorschau` <15 Z. ist.

- [ ] **Step 3: Free-Identifier-Scan pro Sub-Funktion**

Für jede Sub-Funktion (`MCVorschau`, `FreitextVorschau`, ..., `AufgabengruppeVorschau`, `AnhangMedien`) prüfen:
- Welche Imports werden direkt verwendet?
- Wird `kontoLabel` (TKontoVorschau, BilanzERVorschau)? → Import `from '../../../../../utils/kontenrahmen.ts'` (5 ups, da Sub-File 1 Level tiefer als Original)
- Wird `useState` (nur AnhangMedien)? → Import `from 'react'`
- Wird `MediaAnhang` (nur AnhangMedien)? → Import `from '../../../../MediaAnhang.tsx'` (4 ups, byte-identisch-Extension `.tsx` wie im Original)

Expected: keine impliziten Closure-Captures aus dem File-Scope. Alle Sub-Funktionen sind self-contained Renderer ohne shared mutable state.

- [ ] **Step 4: `schaetzeZeitbedarf`-Verwendungen**

```bash
grep -n "schaetzeZeitbedarf" ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx
```

Expected: 3 Treffer (Definition Z. 178 + 2 Calls Z. 30 in Main + Z. 200 in FrageVorschau-Dispatcher). Wird `zeitbedarf.ts` als pure utility ausgelagert und vom `index.tsx` importiert (1 Re-Use im Main, 1 im FrageVorschau-Dispatcher).

- [ ] **Step 5: Reviewer-Rec — `util` vs `zeitbedarf` Naming**

Master-Spec (Sektion 5.2) nennt die Utility-Datei `zeitbedarf.ts` (nicht `util.ts`). Begründung: nur 1 Funktion mit klarem Domain-Namen → präziser Filename ist besser als generisches `util.ts`. **Folge dem Spec.**

- [ ] **Step 6: Audit-Ergebnis als un-committete Notiz** (für Implementer-Subagent in Phase 1.1):

```bash
cat > /tmp/bundle-s-b-audit.md <<'EOF'
# VorschauTab — Audit-Notizen für Phase 1.1

## Helper-Verteilung
- `zeitbedarf.ts` (pure util): `schaetzeZeitbedarf` (Z. 178-193). Verwendet von index (Main + FrageVorschau-Dispatcher).
- `index.tsx` (Main + FrageVorschau-Dispatcher): VorschauTab-Default + interner FrageVorschau-Dispatcher (Inline, NICHT separater Sub-File).
- 11 Strategy-Sub-Files: `MCVorschau`, `FreitextVorschau`, `LueckentextVorschau`, `ZuordnungVorschau`, `RichtigFalschVorschau`, `BerechnungVorschau`, `BuchungssatzVorschau`, `TKontoVorschau`, `KontenbestimmungVorschau`, `BilanzERVorschau`, `AufgabengruppeVorschau`.
- `AnhangMedien.tsx` (Sub-Comp): Lightbox-State, MediaAnhang-Import.

## Free-Identifier-Findings pro Sub-Funktion
- MCVorschau: nur `frage` (kein File-Scope) — keine externen Helper.
- FreitextVorschau: nur `frage` — keine externen Helper.
- LueckentextVorschau: nur `frage` — keine externen Helper.
- ZuordnungVorschau: nur `frage` — keine externen Helper.
- RichtigFalschVorschau: nur `frage` — keine externen Helper.
- BerechnungVorschau: nur `frage` — keine externen Helper.
- BuchungssatzVorschau: nur `frage` — keine externen Helper.
- TKontoVorschau: nutzt `kontoLabel` aus `kontenrahmen` → Import einbauen.
- KontenbestimmungVorschau: nur `frage` — keine externen Helper.
- BilanzERVorschau: nutzt `kontoLabel` aus `kontenrahmen` → Import einbauen.
- AufgabengruppeVorschau: nur `frage` — keine externen Helper.
- AnhangMedien: nutzt `useState` (React) + `MediaAnhang` (Component-Import) → beide Imports einbauen.

## index.tsx behält
- VorschauTab default-export
- FrageVorschau (Dispatcher, intern in index.tsx)
- Imports: useState, alle Storage-Types, formatDatum, typLabel, fachbereichFarbe, formatFragetext, DruckAnsicht
- Imports zusätzlich: schaetzeZeitbedarf aus './zeitbedarf', AnhangMedien aus './AnhangMedien', alle 11 Vorschau-Komponenten aus jeweiligen Sub-Files

## Inline-Render-Pfade (KEIN separater Sub-File)
- `frage.typ === 'visualisierung'` (Z. 251-257): inline JSX (Stub-Hinweis) im FrageVorschau-Dispatcher belassen
- `frage.typ === 'pdf'` (Z. 258-267): inline JSX (Stub-Hinweis) im FrageVorschau-Dispatcher belassen

## Path-Tiefe (CRITICAL — 5 ups vom neuen Folder VorschauTab/, NICHT 4 wie im Original)
- Sub-Files liegen in `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/<File>.tsx`
- 5 ups → `ExamLab/src/`. Pfade aus Sub-Files:
  - `../../../../../types/pruefung.ts`
  - `../../../../../types/fragen-storage` (Original hat keine Extension)
  - `../../../../../utils/kontenrahmen.ts`
  - `../../../../../utils/zeit.ts`
  - `../../../../../utils/fachUtils.ts`
  - `../../../../../utils/textFormatierung.tsx`
  - `../../../../MediaAnhang.tsx` (4 ups, weil MediaAnhang in `src/components/`)
  - `../DruckAnsicht` (Geschwister-Folder)
- Verifiziert via `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht/AufgabengruppeDruck.tsx` (S.a-merged Sibling, Pattern kanonisch).

## Trivial-Konsolidations-Entscheidung
- Default: alle 11 Vorschauen separat (Pattern-Konsistenz mit S.a). Nicht konsolidieren.
EOF
```

Datei NICHT committen (`/tmp` ist git-ignored). Phase-1.1-Implementer liest sie.

---

## Phase 1 — VorschauTab-Extraktion

### Task 1.1: Folder-Skeleton anlegen (alle 14 Sub-Dateien, alte Datei bleibt)

**Files:**
- Create folder: `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/`
- Create files (14):
  - `index.tsx` — VorschauTab default-export + FrageVorschau-Dispatcher (intern)
  - `zeitbedarf.ts` — `schaetzeZeitbedarf` (pure utility)
  - `AnhangMedien.tsx` — Lightbox-Komponente mit `useState`
  - `MCVorschau.tsx`
  - `FreitextVorschau.tsx`
  - `LueckentextVorschau.tsx`
  - `ZuordnungVorschau.tsx`
  - `RichtigFalschVorschau.tsx`
  - `BerechnungVorschau.tsx`
  - `BuchungssatzVorschau.tsx`
  - `TKontoVorschau.tsx`
  - `KontenbestimmungVorschau.tsx`
  - `BilanzERVorschau.tsx`
  - `AufgabengruppeVorschau.tsx`
- Old file unchanged: `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx` (643 Z., bleibt!)

- [ ] **Step 1: Audit-Notizen lesen** (`/tmp/bundle-s-b-audit.md` aus Task 0.4 Step 6).

- [ ] **Step 2: Original-Datei in Editor öffnen** für 1:1-Body-Übernahme. WICHTIG: kein Re-Formatting, kein Refactor, keine Logic-Änderung — byte-identische Bodies.

- [ ] **Step 3: `zeitbedarf.ts` erstellen**

```ts
import type { Frage } from '../../../../../types/fragen-storage'

/** Schaetzt den Zeitbedarf einer Frage in Minuten basierend auf Typ und Punktzahl */
export function schaetzeZeitbedarf(frage: Frage): number {
  switch (frage.typ) {
    case 'mc': return Math.max(1, Math.ceil(frage.punkte * 0.5))
    case 'richtigfalsch': return Math.max(1, Math.ceil(frage.punkte * 0.5))
    case 'freitext': return Math.max(2, frage.punkte * 2)
    case 'lueckentext': return Math.max(1, frage.punkte)
    case 'zuordnung': return Math.max(1, frage.punkte)
    case 'berechnung': return Math.max(2, frage.punkte * 2)
    case 'buchungssatz': return Math.max(3, frage.punkte * 1.5)
    case 'tkonto': return Math.max(5, frage.punkte * 2)
    case 'kontenbestimmung': return Math.max(2, frage.punkte)
    case 'bilanzstruktur': return Math.max(10, frage.punkte * 3)
    case 'aufgabengruppe': return Math.max(5, frage.punkte * 2)
    default: return frage.punkte
  }
}
```

(Body byte-identisch zu Original Z. 178-193, mit `export` statt internal-only.)

- [ ] **Step 4: Pro Vorschau-Funktion eine eigene Datei** erstellen mit folgendem Pattern:

```tsx
import type { MCFrage } from '../../../../../types/fragen-storage'

export default function MCVorschau({ frage }: { frage: MCFrage }) {
  // ... unveränderter Body aus Original Z. 273-298
}
```

Dasselbe für die 10 anderen Sub-Files. **Wichtige Imports pro File** (alle Type-Imports aus `'../../../../../types/fragen-storage'`, 5 ups):
- **MCVorschau**: nur `MCFrage`
- **FreitextVorschau**: nur `FreitextFrage`
- **LueckentextVorschau**: nur `LueckentextFrage`
- **ZuordnungVorschau**: nur `ZuordnungFrage`
- **RichtigFalschVorschau**: nur `RichtigFalschFrage`
- **BerechnungVorschau**: nur `BerechnungFrage`
- **BuchungssatzVorschau**: nur `BuchungssatzFrage`
- **TKontoVorschau**: `TKontoFrage` **+ `import { kontoLabel } from '../../../../../utils/kontenrahmen.ts'`**
- **KontenbestimmungVorschau**: nur `KontenbestimmungFrage`
- **BilanzERVorschau**: `BilanzERFrage` **+ `import { kontoLabel } from '../../../../../utils/kontenrahmen.ts'`**
- **AufgabengruppeVorschau**: nur `AufgabengruppeFrage`

Path-Tiefe vom neuen Folder `VorschauTab/`: `../../../../../types/fragen-storage` und `../../../../../utils/kontenrahmen.ts` (**5 levels up**, NICHT 4 — verifiziert via S.a-Sibling `DruckAnsicht/AufgabengruppeDruck.tsx`). Bei Unsicherheit `ls ../../../../../types/fragen-storage.ts` aus dem Sub-File-Folder testen.

- [ ] **Step 5: `AnhangMedien.tsx` erstellen** (Sub-Component mit Lightbox-State)

```tsx
import { useState } from 'react'
import type { FrageAnhang } from '../../../../../types/fragen-storage'
import MediaAnhang from '../../../../MediaAnhang.tsx'

/** Zeigt alle Medien-Anhänge inline an */
export default function AnhangMedien({ anhaenge }: { anhaenge: FrageAnhang[] }) {
  // ... unveränderter Body aus Original Z. 613-642
  // (state, lightboxAnhang, JSX inkl. Lightbox-Overlay)
}
```

**Wichtig — Path-Tiefe:** Das Original `VorschauTab.tsx` liegt direkt in `composer/` und nutzt für `MediaAnhang` 3 ups (`'../../../MediaAnhang.tsx'`). Die Sub-Dateien des neuen Folders `composer/VorschauTab/` liegen **1 Level tiefer** als das Original. Daher 1 zusätzlicher `../`:
- Type-Imports aus `src/types/`: **5 ups** (`'../../../../../types/...'`)
- MediaAnhang aus `src/components/`: **4 ups** (`'../../../../MediaAnhang.tsx'`)

`MediaAnhang.tsx`-Extension wird im Original explizit gesetzt — hier byte-identisch übernehmen.

- [ ] **Step 6: `index.tsx` schreiben** als Main-Komponente + FrageVorschau-Dispatcher

```tsx
import { useState } from 'react'
import type { PruefungsConfig } from '../../../../../types/pruefung.ts'
import type { Frage, MCFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage, RichtigFalschFrage, BerechnungFrage, BuchungssatzFrage, TKontoFrage, KontenbestimmungFrage, BilanzERFrage, AufgabengruppeFrage } from '../../../../../types/fragen-storage'
import { formatDatum } from '../../../../../utils/zeit.ts'
import { typLabel, fachbereichFarbe } from '../../../../../utils/fachUtils.ts'
import { formatFragetext } from '../../../../../utils/textFormatierung.tsx'
import DruckAnsicht from '../DruckAnsicht'
import { schaetzeZeitbedarf } from './zeitbedarf'
import AnhangMedien from './AnhangMedien'
import MCVorschau from './MCVorschau'
import FreitextVorschau from './FreitextVorschau'
import LueckentextVorschau from './LueckentextVorschau'
import ZuordnungVorschau from './ZuordnungVorschau'
import RichtigFalschVorschau from './RichtigFalschVorschau'
import BerechnungVorschau from './BerechnungVorschau'
import BuchungssatzVorschau from './BuchungssatzVorschau'
import TKontoVorschau from './TKontoVorschau'
import KontenbestimmungVorschau from './KontenbestimmungVorschau'
import BilanzERVorschau from './BilanzERVorschau'
import AufgabengruppeVorschau from './AufgabengruppeVorschau'

interface Props {
  pruefung: PruefungsConfig
  fragenMap: Record<string, Frage>
  fragenGeladen?: boolean
  onSuSVorschau: () => void
}

export default function VorschauTab({ pruefung, fragenMap, fragenGeladen = true, onSuSVorschau }: Props) {
  // ... Body byte-identisch aus Original Z. 18-175
}

/** Read-only Vorschau einer einzelnen Frage wie SuS sie sehen */
function FrageVorschau({ frage, nummer }: { frage: Frage; nummer: number }) {
  // ... Body byte-identisch aus Original Z. 196-270
  // (verwendet alle 11 Vorschau-Komponenten, AnhangMedien, schaetzeZeitbedarf)
}
```

**Wichtig:**
- `index.tsx` ist Sub-File des neuen Folders `composer/VorschauTab/` (1 Level tiefer als Original) → alle Type-/Util-Imports brauchen **5 ups** (`'../../../../../types/...'`, `'../../../../../utils/...'`).
- Extensions byte-identisch zum Original: `.ts` für `pruefung`/`zeit`/`fachUtils`/`kontenrahmen`, `.tsx` für `textFormatierung`. `fragen-storage`-Import hat keine Extension im Original, hier weglassen.
- `DruckAnsicht`-Import-Pfad: `../DruckAnsicht` (1 Level rauf, dann auf `DruckAnsicht/` Folder — der durch S.a aktiv ist; KEIN `.tsx`-Suffix wegen Folder-Resolution).
- `MediaAnhang` wird in `index.tsx` NICHT mehr direkt importiert (nur in `AnhangMedien.tsx` Sub-File).
- `kontoLabel` wird in `index.tsx` NICHT importiert (nur in `TKontoVorschau`/`BilanzERVorschau`-Sub-Files).
- `import type { FrageAnhang }` wird in `index.tsx` NICHT mehr gebraucht (nur in `AnhangMedien.tsx`).
- Imports byte-identisch reduziert auf das, was `index.tsx` selbst verwendet (Main + FrageVorschau-Dispatcher).

- [ ] **Step 7: tsc + build verifizieren** (alte Datei gewinnt Resolution, also testet das nur die neuen Dateien on-disk):

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-b-tsc-skeleton.log
```

Expected: Exit 0, **Output-Inspektion**: keine TS-Errors-Lines. Falls TS-Errors in den neuen Dateien (z.B. wrong import path): fixen, bevor Commit.

```bash
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: `✓ built in …`.

- [ ] **Step 8: Status check vor Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git status -s | grep VorschauTab
```

Expected: 14 neue Dateien unter `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/` (alle als `??` untracked oder `A` added). Alte `VorschauTab.tsx` NICHT in der Liste (unverändert).

- [ ] **Step 9: Commit**

```bash
git add ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/
git status   # sicherstellen: NUR neue Dateien, alte unverändert
git commit -m "Bundle S.b Phase 1.1: VorschauTab/ Folder-Skeleton mit 14 Sub-Dateien"
```

### Task 1.2: Cutover — Caller-Edit + alte Datei löschen (atomarer Commit)

**Files:**
- Modify: `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx:23` (Extension droppen)
- Delete: `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx`

- [ ] **Step 1: Caller-Edit — `.tsx`-Extension droppen**

In `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx`:

Vorher (Z. 23):
```ts
import VorschauTab from './composer/VorschauTab.tsx'
```

Nachher:
```ts
import VorschauTab from './composer/VorschauTab'
```

Per Edit-Tool (single-line-Replace, `old_string` ist die ganze Zeile inkl. exact whitespace).

- [ ] **Step 2: Alte VorschauTab-Datei löschen**

```bash
git rm ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx
```

- [ ] **Step 3: tsc verifizieren**

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-b-tsc-cutover.log
```

Expected: Exit 0, keine TS-Errors. Vite-Resolution geht jetzt auf `VorschauTab/index.tsx`. Falls Errors:
- Caller hat noch alte Extension → Step 1 nicht durchgeführt? `grep -n "VorschauTab" PruefungsComposer.tsx` prüfen.
- TS findet `VorschauTab/index.tsx` nicht → import-paths in `index.tsx` falsch? Audit-Notizen Z. „Path-Tiefe" prüfen.

- [ ] **Step 4: Build verifizieren**

```bash
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: `✓ built in …`.

- [ ] **Step 5: Vitest verifizieren**

```bash
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
```

Expected: **exakt** gleicher Count wie Baseline (1253 passed | 4 todo | 1 skipped). **Falls Drift (auch nur ±1 Test):** STOP. Mechanische Refactors haben 0 Drift-Toleranz. Hotfix auf S.b-Branch (kein Self-Approve), Ursache analysieren, dann erneut. Bei Unklarheit User eskalieren. (S.a-Lehre #4)

- [ ] **Step 6: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```

Expected: Exit 0 für alle drei.

- [ ] **Step 7: ESLint volles Set**

```bash
cd ExamLab && npm run lint
```

Expected: keine neuen Errors/Warnings (Pre-existing OK, Bundle S.b führt keine ein).

- [ ] **Step 8: Commit**

```bash
git add ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx
git commit -m "Bundle S.b Phase 1.2: Cutover — alte VorschauTab.tsx geloescht, Caller-Extension gedroppt, Folder aktiv"
```

### Task 1.3: Browser-E2E-Spot-Check Vorschau-Pfad

**Files:** keine (Browser-Test auf staging)

- [ ] **Step 1: Branch nach `origin/preview` Force-Pushen** (per `feedback_preview_forcepush.md` Pre-Check):

```bash
# Pre-Check: hat preview eigene Commits (nicht in main)?
git log origin/preview ^origin/main --oneline
```

- Wenn leer (preview ist strikt hinter main): Force-Push sicher.
- Wenn Treffer: STOP — preview hat Work-in-Progress, nicht überschreiben. User fragen.

```bash
git push origin refactor/bundle-s-b-vorschau-split:preview --force-with-lease
```

Expected: Push success. Pages-Workflow läuft an.

- [ ] **Step 2: Auf Pages-Deploy warten**

User-Aufgabe: in GitHub Actions UI auf grünen Staging-Deploy warten (~1.5–3 Min). Master-Subagent fragt User zu „Staging grün?" bevor er den Browser-Test startet.

- [ ] **Step 3: Service-Worker-Cache zurücksetzen** (per `feedback_service_worker_cache_wire_bundle.md`):

In Chrome DevTools auf staging URL: Application Tab → Service Workers → `Unregister`, Storage → `Clear site data`, dann Reload.

- [ ] **Step 4: Mit echtem LP-Login einloggen** (per `feedback_echte_logins.md` — kein Demo-Modus). User ist `wr.test@gymhofwil.ch` (oder konfigurierter Test-LP).

- [ ] **Step 5: LP → Vorbereitung → eine Multi-Fragetyp-Prüfung öffnen → Vorschau-Tab**

Erwartung: VorschauTab rendert mit
- Zusammenfassungsleiste (Titel, Fragen-Anzahl, Punkte, Prüfungsdauer, Geschätzte Zeit)
- Buttons „Druckbare Ansicht" + „Interaktive SuS-Vorschau" sichtbar
- Prüfungs-ID + URL-Code-Box
- Pro Abschnitt: Header + Frage-Vorschauen

- [ ] **Step 6: Stichprobe Vorschau-Komponenten** (für jede vorhandene Fragetyp-Sub-Komponente):
  - **MC**: Optionen mit Buchstaben A/B/C/D, Radio-/Checkbox-Indikator (je nach `mehrfachauswahl`)
  - **RichtigFalsch**: Aussagen mit Richtig/Falsch-Buttons (disabled)
  - **Freitext**: leeres Textarea mit Placeholder, Zeilen je nach `laenge`
  - **Lückentext**: Text mit Input-Lücken
  - **Zuordnung**: 2-Spalten-Grid mit Begriff/Zuordnung-Selects (disabled)
  - **Berechnung**: Ergebnis-Inputs + ggf. Rechenweg-Textarea
  - **Buchungssatz**: Geschäftsfall-Text + leere Buchungstabelle
  - **TKonto**: Konten-Liste mit „Soll/Haben"-Headern + Saldo-Footer (`kontoLabel`-Lookup)
  - **Kontenbestimmung**: Tabelle mit Modus-aware Spalten (Konto/Kategorie/Buchungsseite)
  - **BilanzER**: Konten-Tabelle mit Saldi + Hinweis-Text
  - **Aufgabengruppe**: Teilaufgaben-Liste mit a)/b)/c)-Buchstaben
  - **AnhangMedien** (falls Frage Anhänge hat): Bild-Anhang + Lightbox-Klick öffnet Overlay

- [ ] **Step 7: Browser-Console-Check**

DevTools → Console: keine neuen Errors/Warnings (pre-existing Service-Worker-Warnings OK).

- [ ] **Step 8: Falls Issue gefunden** — Hotfix-Commit auf S.b-Branch pushen, NICHT auf main.

(Falls Bundle S.b an einem Punkt landet wo Phase 1.3 nicht durchgeführt werden kann — z.B. keine staging-Daten mit Multi-Fragetyp-Prüfung —, im Final-Verification-Bericht explizit notieren mit Begründung. Unit-Tests + tsc decken Byte-Identität, aber visuelle Stichprobe ist Spec-Anforderung Sektion 7.3.)

---

## Phase 2 — Bundle-Finalize

### Task 2.1: Final-Verifikation

**Files:** keine (alle Gates)

- [ ] **Step 1: Komplettes lokales Gate-Set**

```bash
cd ExamLab && npx tsc -b --noEmit
cd ExamLab && npm run build 2>&1 | tail -5
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
cd ExamLab && npm run lint:as-any
cd ExamLab && npm run lint:no-alert
cd ExamLab && npm run lint:no-tests-dir
cd ExamLab && npm run lint
```

Expected: alle exit 0; vitest 1253 passed | 4 todo (1257).

- [ ] **Step 2: Hotspot-Bilanz verifizieren**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
find ExamLab/src packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs wc -l 2>/dev/null | awk '$1>=500 {print}' | sort -rn | head -20
```

Expected: `VorschauTab.tsx` aus der Liste verschwunden. `poolConverter.ts` und `fibuAutoKorrektur.ts` weiterhin drin (Bundle S.c-Targets). Anzahl >500-Files: **15 → 14**.

- [ ] **Step 3: Caller-Imports nicht-default-Drift prüfen**

```bash
git diff main..HEAD -- '*.ts' '*.tsx' | grep -E "^[+-].*import.*VorschauTab" | head -10
```

Expected: 1× `-` für die Original-Caller-Zeile mit `.tsx`-Extension, 1× `+` für die neue Zeile ohne Extension. Alles andere wäre unerwarteter Caller-Drift.

```bash
git diff main..HEAD -- 'ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx'
```

Expected: nur 1 geänderte Zeile (`VorschauTab.tsx` → `VorschauTab`). Falls weitere Diffs in PruefungsComposer.tsx: STOP, ungewollte Änderung.

### Task 2.2: HANDOFF.md aktualisieren

**Files:** Modify: `HANDOFF.md` (im Repo-Root) **oder** `ExamLab/HANDOFF.md` — den realen Pfad per `ls` verifizieren.

- [ ] **Step 1: HANDOFF.md aktuelle Sektion lesen**

```bash
ls -la HANDOFF.md ExamLab/HANDOFF.md 2>&1
sed -n '1,40p' ExamLab/HANDOFF.md
```

(Repo hat 2 HANDOFF-Files: ExamLab/HANDOFF.md ist der ExamLab-spezifische, Repo-Root-HANDOFF ist ein Aggregat. Bundle S.a-Eintrag stand in `ExamLab/HANDOFF.md` — denselben Pfad nutzen.)

- [ ] **Step 2: Neuen Eintrag** für Bundle S.b oben einfügen (vor Bundle S.a-Eintrag), nach Pattern S.a:

```markdown
### Bundle S.b — VorschauTab-Split ✅ READY FOR MERGE (2026-05-06)

Branch `refactor/bundle-s-b-vorschau-split` (auch auf `origin/preview` für Staging-E2E gepusht). 2 Implementation-Commits + Doku-Commit. Zweites Sub-Bundle aus Bundle S — siebtes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05).

**Was geliefert:**
- `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx` (643 Z.) → Folder mit 14 Sub-Dateien (1 `index.tsx` Dispatcher mit FrageVorschau + 1 `zeitbedarf.ts` mit `schaetzeZeitbedarf` + 1 `AnhangMedien.tsx` mit Lightbox-State + 11 `<Fragetyp>Vorschau.tsx`)
- 1 minimal-Caller-Edit: `PruefungsComposer.tsx:23` — `.tsx`-Extension gedroppt wegen Folder-Resolution
- Folder-Pattern wie S.a, byte-identische Bodies

**Hotspot-Bilanz (Files >500 Z.):** **15 → 14** ✅

**Verifikation:**
- vitest **1253 passed | 4 todo (1257 total)** — drift = 0 ✅
- tsc -b clean, build clean
- lint:as-any 0/0/0, lint:no-alert clean, lint:no-tests-dir clean

**Browser-E2E auf staging (echte LP-Logins, Service-Worker-Cache vorab zurückgesetzt):**
- ✅ LP-Vorschau-Pfad: 11 Vorschau-Komponenten + AnhangMedien-Lightbox visuell verifiziert. Console nach Reload: 0 Errors

**Phase-4-Security-Check:** Bundle ist reiner Refactor ohne Wire-Vertrag-/API-Body-/Session-Token-/Response-Filter-Berührung. Folder-Resolution-Mechanik ist build-tool-intern.

**Sub-Commits:**
- `<hash>` Phase 1.1: VorschauTab/ Folder-Skeleton (14 Sub-Dateien)
- `<hash>` Phase 1.2: Cutover — alte Datei + Caller-Extension

**Folge:**
- Bundle S.c (poolConverter + fibuAutoKorrektur, ~10 Sub-Dateien) — gleiche Session ODER Folge-Session
```

(Hashes nach den Commits ergänzen.)

- [ ] **Step 3: Bundle S.a Sektion** im HANDOFF auf „MERGED" umschreiben falls noch „READY FOR MERGE" (falls in Vor-Phase versäumt). Nicht zwingend für S.b — wenn S.a-Sektion noch frischen Stand hat, einfach S.b-Eintrag oben drauf.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle S.b Phase 2.2: HANDOFF.md mit Bundle-S.b-Eintrag"
```

### Task 2.3: PR auf main + Merge

**Files:** keine (GitHub-Operation)

- [ ] **Step 1: Push** (falls neue Commits seit Task 0.1):

```bash
git push origin refactor/bundle-s-b-vorschau-split
```

- [ ] **Step 2: Pages-Deploy-Vorbedingung prüfen** — User bestätigt, dass main einen aktuellen grünen Pages-Deploy hat. Falls letzter Run cancelled/failed: per Hand re-run und auf grün warten, BEVOR S.b gemerged wird.

- [ ] **Step 3: PR erstellen** (User entscheidet ob via gh CLI lokal oder GitHub-UI):

```bash
gh pr create --base main --head refactor/bundle-s-b-vorschau-split \
  --title "Bundle S.b: VorschauTab-Split (1 Renderer-File → 14 Sub-Dateien)" \
  --body "$(cat <<'EOF'
## Summary

- VorschauTab.tsx (643 Z.) → Folder mit 14 Sub-Dateien (1 `index.tsx` mit FrageVorschau-Dispatcher + 1 `zeitbedarf.ts` + 1 `AnhangMedien.tsx` + 11 `<Fragetyp>Vorschau.tsx`)
- Caller-Imports byte-identisch (Folder-Resolution); 1 minimal Caller-Edit (`PruefungsComposer.tsx:23` — `.tsx`-Extension gedroppt)
- Hotspot-Bilanz: Files >500 Z. **15 → 14**
- Phase 2 Cleanup-Audit-Roadmap fortgesetzt (Bundle S.c folgt)

## Verification

- vitest 1253 passed (unverändert)
- tsc/build/lint:as-any/lint:no-alert/lint:no-tests-dir clean
- Browser-E2E mit echten LP-Logins:
  - LP-Vorschau-Tab: 11 Vorschau-Komponenten + AnhangMedien-Lightbox ✓

## Test plan

- [x] vitest grün
- [x] LP-Vorschau-Tab Browser-E2E
EOF
)"
```

- [ ] **Step 4: Code-Reviewer-Subagent dispatchen** vor Merge (siehe Subagent-Driven-Development-Skill für Reviewer-Pattern). Reviewer bekommt: Plan-Pfad + Spec-Pfad + Branch-Diff. Erwartet: APPROVED oder konkrete Findings.

- [ ] **Step 5: Merge** auf main (User-Aktion). **Regulärer Merge-Commit (kein Squash)** — Pattern wie S.a/Q/R/N/M. Subject: `Merge Bundle S.b: VorschauTab-Split`.

- [ ] **Step 6: Branch lokal+remote löschen** nach 1 Woche Beobachtung (per Memory `project_bundle_l_c_komplett.md` Pattern), oder direkt nach S.c-Merge (dann ist Bundle S komplett).

### Task 2.4: Memory-Eintrag schreiben

**Files:**
- Create: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_s_b_vorschau_split.md`
- Modify: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/MEMORY.md` (Index-Eintrag)

- [ ] **Step 1: Memory-File schreiben**

Vorlage:

```markdown
---
name: Bundle S.b VorschauTab-Split auf main (2026-05-06)
description: VorschauTab.tsx (643 Z.) per Folder-Pattern in 14 Sub-Dateien zerlegt. Zweites Sub-Bundle aus Bundle S, Phase-2-Cleanup-Roadmap-Fortsetzung.
type: project
---

**Stand:** YYYY-MM-DD Merge-Commit `<hash>` auf main.

**Was:** Zweites Sub-Bundle aus Bundle S (Niedrig-Risiko-Datei-Splits). VorschauTab → `index.tsx` (Main + FrageVorschau-Dispatcher) + `zeitbedarf.ts` (pure utility) + `AnhangMedien.tsx` (Lightbox) + 11 `<Fragetyp>Vorschau.tsx`. Caller-Imports byte-identisch (1 Edit für Extension-Drop in PruefungsComposer.tsx:23).

**Wie:** Folder-Pattern + Cutover-Strategie wie S.a. Master-Spec Sektion 5.2.

**Verifikation:**
- vitest 1253 passed (unverändert, drift=0)
- tsc/build/lint:as-any/lint:no-alert/lint:no-tests-dir clean
- Browser-E2E LP-Vorschau-Tab mit echten Logins ✅

**Hotspot-Bilanz Files >500 Z.: 15 → 14** ✅

**Lehren (falls neue):** [Hier während Implementation auftauchende Lehren ergänzen]

**Folge:**
- Branch lokal+remote löschen 1 Woche nach Merge (oder zusammen mit S.c-Branch)
- Bundle S.c (poolConverter + fibuAutoKorrektur) — eigene Session (oder gleicher Master-Run)
```

- [ ] **Step 2: MEMORY.md Index-Eintrag** ergänzen (1 Zeile <150 Zeichen) — als oberster Eintrag der ExamLab-Bundle-Liste, vor S.a-Eintrag:

```markdown
- **[Bundle S.b VorschauTab-Split auf main](project_bundle_s_b_vorschau_split.md)** — 06.05.2026 Merge `<hash>`. 2. Sub-Bundle aus Bundle S. VorschauTab.tsx (643 Z.) → 14 Sub-Files. drift=0, 15→14 Hotspots.
```

---

## Acceptance Criteria

- [ ] `VorschauTab/` Folder mit `index.tsx` Dispatcher existiert; alte `VorschauTab.tsx` gelöscht
- [ ] 14 Sub-Dateien (`index.tsx`, `zeitbedarf.ts`, `AnhangMedien.tsx`, 11 `<Fragetyp>Vorschau.tsx`)
- [ ] `PruefungsComposer.tsx:23` Caller hat `.tsx`-Extension gedroppt; sonst keine Caller-Änderungen
- [ ] Hotspot-Bilanz Files >500 Z.: **15 → 14**
- [ ] vitest **1253 passed | 4 todo** (oder aktuelle Baseline, drift=0)
- [ ] tsc/build/lint:as-any/lint:no-alert/lint:no-tests-dir clean
- [ ] Browser-E2E LP-Vorschau-Tab ✓ mit echten Logins (oder explizit notiert wenn nicht durchführbar)
- [ ] Pages-Deploy nach Merge grün in GH Actions UI
- [ ] HANDOFF.md aktualisiert
- [ ] Memory-Eintrag geschrieben + MEMORY.md Index-Zeile ergänzt

---

## Risks Reminder (aus Master-Spec Sektion 8 + S.a-Lehren)

- **Closure-Capture** in Sub-Komponenten: Free-Identifier-Scan in Audit-Phase 0.4 mitigiert. Per Audit-Befund: alle 11 Vorschau-Funktionen sind `frage`-only-pure (kein Closure auf File-Scope). Nur AnhangMedien hat eigenen useState-State (Lightbox), bleibt self-contained.
- **Default-Export-Drift**: tsc/build verifiziert in Task 1.1 Step 7 (Folder ist auf disk, aber inaktiv) und Task 1.2 Step 3 (Folder aktiv).
- **Vite-Folder-Resolution-Race** + **Explizite-Extension-Caller** (S.a-Lehre #2): 1 Caller mit `.tsx`-Extension wurde im Pre-Audit gefunden. Wird im Cutover-Commit (Task 1.2) atomar mitgeändert.
- **`util.<ext>`-Extension je nach Body** (S.a-Lehre #3): hier nicht relevant — `zeitbedarf.ts` ist klar `.ts` (kein JSX).
- **Drift-Toleranz null** (S.a-Lehre #4): bei vitest-Drift in Task 1.2 Step 5 STOP + Hotfix.
- **Pages-Deploy-Stau**: Task 0.2 + 2.3 Step 2 prüfen Vorbedingung.
- **Preview-Force-Push-Race** (Memory `feedback_preview_forcepush.md`): Task 1.3 Step 1 macht Pre-Check (`git log origin/preview ^origin/main`). Wenn preview Work-in-Progress hat: STOP, User fragen.
