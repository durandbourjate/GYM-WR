# Bundle S.c — Utils-Splits Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mechanische Strategy-Extraktion von 2 Utility-Files (`utils/poolConverter.ts` 744 Z. + `utils/fibuAutoKorrektur.ts` 600 Z.) in Folder-Pattern (`<File>/index.ts` als Re-Export-Hub + Sub-Dateien pro Strategy/Helper), ohne Verhaltensänderung.

**Architecture:** Folder-Pattern aus Master-Spec Sektion 4 (gleicher Pattern wie S.a/S.b): jede Datei wird zu einem Folder mit `index.ts` als Default- und Re-Export-Hub. Caller-Imports byte-identisch via Folder-Resolution.

**Tech Stack:** React 19, TypeScript, Vite 7, vitest 3, ESLint 9.

**Bezug:**
- Master-Spec: [`docs/superpowers/specs/2026-05-06-bundle-s-niedrig-risiko-datei-splits-design.md`](../specs/2026-05-06-bundle-s-niedrig-risiko-datei-splits-design.md) (Sektion 5.3)
- Vorgänger-Plan (Pattern-Referenz): [`docs/superpowers/plans/2026-05-06-bundle-s-a-renderer-splits.md`](./2026-05-06-bundle-s-a-renderer-splits.md), [`docs/superpowers/plans/2026-05-06-bundle-s-b-vorschau-split.md`](./2026-05-06-bundle-s-b-vorschau-split.md)
- Pattern-Referenz on disk für utils-Sub-Folders: `ExamLab/src/utils/ueben/` und `ExamLab/src/utils/zonen/` (existing 2-up-pattern verifiziert).

**Vitest-Baseline (Stand 2026-05-06 nach Bundle-S.a-Merge, vor S.b/S.c):** **1253 passed | 4 todo (1257 total)**, 161 Test Files, 1 skipped. Erwartung: nach S.c unverändert (drift = 0 für mechanische Refactors). Hinweis: S.c branched off `main` parallel zu S.b; S.b-Merge ändert die Baseline NICHT (selbe vitest-Counts).

**Hotspot-Bilanz Ziel:** Files >500 Z. **15 → 13** (poolConverter 744 + fibuAutoKorrektur 600 raus). Wenn S.b auch gemerged ist: 14 → 12. Beide Pfade führen zum Master-Spec-Ziel (17 → 12 nach komplettem Bundle S).

**Sub-File-Anzahl:** Master-Spec Sektion 5.3 nennt "~10 Sub-Files" (ungefähr-Schätzung mit "Detail-Schnitt in Phase-Audit"). Realer Bedarf nach Audit:
- **poolConverter/: 10 Sub-Files** (1 `index.ts` + 1 `konstanten.ts` + 1 `helpers.ts` + 1 `punkte.ts` + 1 `zeitbedarf.ts` + 1 `snapshot.ts` + 4 `konvertiereX.ts` Bucket-Strategy-Files)
- **fibuAutoKorrektur/: 6 Sub-Files** (per Master-Spec Sektion 5.3.2)
- **Total: 16 Sub-Files**

Begründung der 10 (statt minimaler 4) Files für poolConverter: das `konvertierePoolFrage`-Switch hat 19 Cases × ~25 Z. = ~510 Z. allein im Body. Wenn nur Helpers extrahiert werden, bleibt `index.ts` borderline 500 Z. — Hotspot-Bilanz nicht erreicht. Bucket-Pattern (4 `konvertiereX.ts` nach Domain: Standard/Bild/Fibu/Aufgabengruppe) split den Switch auf, sodass kein einzelnes File >300 Z. ist.

**Pre-Commit-Audit-Befund (Master-Direct-Bash):**

`utils/poolConverter.ts` (744 Z.):
- Imports: `'../types/pool'`, `'../types/fragen-storage'` (1 up vom Original, **2 ups** von Sub-Files).
- Exports (7): `mapFachbereich`, `mapBloom`, `berechnePunkte`, `schaetzeZeitbedarf`, `konvertierePoolBild`, `erzeugeSnapshot`, `konvertierePoolFrage`.
- Private Helpers: `genId`, `jetzt`, `POOL_IMG_BASE_URL`-Constant.
- Externe Caller (2): `poolConverter.test.ts:2` (importiert `konvertierePoolFrage`) + `services/poolSync.ts:20` (importiert `konvertierePoolFrage`, `erzeugeSnapshot`, `konvertierePoolBild`). **Keine expliziten Extension-Imports** — Folder-Resolution funktioniert ohne Caller-Edit.

`utils/fibuAutoKorrektur.ts` (600 Z.):
- Imports: `'../types/fragen-storage'`, `'../types/antworten'`, `'./kontenrahmen'` (sibling).
- Exports (6): `korrigiereBuchungssatz`, `korrigiereTKonto`, `korrigiereKontenbestimmung`, `korrigiereBilanzER`, `KorrekturErgebnis` (Interface), `KorrekturDetail` (Interface).
- Private Helpers: `bewerteBuchungVereinfacht`, `bewerteTKontoEintraege`, `norm`, `kontenSetGleich`, `gleicheReihenfolge`. Plus internal Types `BilanzAntwortSeite`, `BilanzAntwort`.
- Externe Caller (1): `utils/autoKorrektur.ts:19+23+24` (importiert die 4 Korrektur-Fns + die 2 Type-Interfaces). **Keine expliziten Extension-Imports.**

**Path-Tiefen-Konvention (CRITICAL):** Sub-Files in `ExamLab/src/utils/<NAME>/<sub>.ts` liegen **3 Levels** unter `ExamLab/src/`. D.h. relative Pfade aus den Sub-Files (NICHT aus index.ts der Parent-Files):
- `../../types/...` → `src/types/` (2 ups)
- `../<sibling-util>` → `src/utils/<sibling>` (1 up)
- `./X` → Geschwister im selben Folder
- Originale `poolConverter.ts`/`fibuAutoKorrektur.ts` (1 Level höher) verwenden 1 up; **NICHT 1:1 in Sub-Files kopieren** — 1 zusätzlicher `../`.

Empirisch verifiziert via:
- `ExamLab/src/utils/ueben/fragetypNormalizer.ts:6` — `'../../types/ueben/fragen'` (2 ups)
- `ExamLab/src/utils/zonen/migriereZone.ts:1` — `'../../types/fragen-storage'` (2 ups) + `'./polygon'` (sibling)

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
- Branch: `refactor/bundle-s-c-utils-splits` (von main, parallel zu S.b)
- HEAD ist auf oder nach `ad70bed` (S.a Merge-Commit)

**Falls Branch noch nicht existiert** (cold-start):
```bash
git checkout main && git pull --ff-only
git checkout -b refactor/bundle-s-c-utils-splits
```

- [ ] **Step 2: Remote-Push (für spätere PR + Subagent-Sichtbarkeit)**

```bash
git push -u origin refactor/bundle-s-c-utils-splits
```

### Task 0.2: Pages-Deploy-Vorbedingung

**Files:** keine (User-Action)

- [ ] **Step 1: User bestätigt grünen Pages-Deploy auf main** vor Final-Push (nicht für Skeleton-Phase nötig). Per Master-Spec Sektion 7.2: max. 1 Bundle-S-Merge in flight. Wenn S.b ungemerged ist, S.c-Merge erst NACH S.b-Merge.

### Task 0.3: Baseline-Verifikation

**Files:** keine (read-only)

- [ ] **Step 1: Vitest-Baseline bestätigen**

```bash
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
```

Expected: `Test Files  161 passed | 1 skipped (162)` und `Tests  1253 passed | 4 todo (1257)`. Falls Drift: aktuellen Count notieren als neue Baseline.

- [ ] **Step 2: tsc-Baseline + Output-Inspektion**

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-c-tsc-baseline.log
```

Expected: Exit 0, keine TS-Errors-Lines. Falls TS-Errors trotz Exit 0: `git clean -xfd ExamLab/dist ExamLab/.tsbuildinfo` und retry.

- [ ] **Step 3: Lint-Gates + Build**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: alle exit 0, build `✓ built in …`.

### Task 0.4: Closure-/Strategy-Audit für poolConverter.ts

**Files:** Read-only Analyse.

- [ ] **Step 1: Free-Identifier-Scan pro Case** (besonders der `basis`-Closure)

`konvertierePoolFrage` baut ein `basis`-Object (Z. 251-294) und spreadet es in jeden Case-Body. Jeder extrahierte Case-Body braucht entweder `basis` als Argument oder die einzelnen Helper-Imports (`berechnePunkte`, `schaetzeZeitbedarf`, `mapFachbereich`, `mapBloom`, `konvertierePoolBild`, `genId`, `jetzt`).

Strategie: Cases werden in Strategy-Funktionen mit Signatur `function konvertiereX(poolFrage: PoolFrage, basis: BasisFelder): XFrage` extrahiert. `BasisFelder`-Type wird in `index.ts` definiert (oder in einer privaten `basis.ts`).

- [ ] **Step 2: Audit-Notiz für Implementer schreiben**

```bash
cat > /tmp/bundle-s-c-poolConverter-audit.md <<'EOF'
# poolConverter — Audit-Notizen für Phase 1.1

## Ziel-Layout (10 Sub-Files in utils/poolConverter/)
1. `index.ts` — Re-Exports (mapFachbereich, mapBloom, berechnePunkte, schaetzeZeitbedarf, konvertierePoolBild, erzeugeSnapshot, konvertierePoolFrage) + main `konvertierePoolFrage` (basis-builder + dispatcher) (~250 Z.)
2. `konstanten.ts` — `POOL_IMG_BASE_URL` constant + `genId`/`jetzt` private helpers (~25 Z.)
3. `helpers.ts` — `mapFachbereich` + `mapBloom` + `konvertierePoolBild` (~60 Z.)
4. `punkte.ts` — `berechnePunkte` (~50 Z.)
5. `zeitbedarf.ts` — `schaetzeZeitbedarf` (~50 Z.)
6. `snapshot.ts` — `erzeugeSnapshot` (~45 Z.)
7. `konvertiereStandard.ts` — Cases: mc, multi, tf, fill, calc, sort, open, sortierung, formel, code, zeichnen (11 Cases, ~280 Z.)
8. `konvertiereBild.ts` — Cases: hotspot, bildbeschriftung, dragdrop_bild (3 Cases, ~150 Z.)
9. `konvertiereFibu.ts` — Cases: bilanz, buchungssatz, tkonto, kontenbestimmung (4 Cases, ~180 Z.)
10. `konvertiereAufgabengruppe.ts` — Cases: gruppe + default-fallback (~50 Z.)

## index.ts Struktur
```ts
import type { Frage, ... } from '../../types/fragen-storage'
import type { PoolFrage, PoolMeta, PoolTopic, PoolFrageSnapshot } from '../../types/pool'
import { POOL_IMG_BASE_URL, genId, jetzt } from './konstanten'
import { mapFachbereich, mapBloom, konvertierePoolBild } from './helpers'
import { berechnePunkte } from './punkte'
import { schaetzeZeitbedarf } from './zeitbedarf'
import { erzeugeSnapshot } from './snapshot'
import { konvertiereStandard } from './konvertiereStandard'
import { konvertiereBild } from './konvertiereBild'
import { konvertiereFibu } from './konvertiereFibu'
import { konvertiereAufgabengruppe } from './konvertiereAufgabengruppe'

// Re-exports for external consumers
export { mapFachbereich, mapBloom, konvertierePoolBild } from './helpers'
export { berechnePunkte } from './punkte'
export { schaetzeZeitbedarf } from './zeitbedarf'
export { erzeugeSnapshot } from './snapshot'
export { POOL_IMG_BASE_URL } from './konstanten'

// Type used by strategy files
export interface BasisFelder { /* alle 22+ Felder von basis-Objekt aus Original Z. 251-294 */ }

export function konvertierePoolFrage(...): Frage {
  const basis: BasisFelder = { ... }   // Original Z. 251-294 unverändert
  switch (poolFrage.type) {
    case 'mc':
    case 'multi':
    case 'tf':
    case 'fill':
    case 'calc':
    case 'sort':
    case 'open':
    case 'sortierung':
    case 'formel':
    case 'code':
    case 'zeichnen':
      return konvertiereStandard(poolFrage, basis)
    case 'hotspot':
    case 'bildbeschriftung':
    case 'dragdrop_bild':
      return konvertiereBild(poolFrage, basis)
    case 'bilanz':
    case 'buchungssatz':
    case 'tkonto':
    case 'kontenbestimmung':
      return konvertiereFibu(poolFrage, basis)
    case 'gruppe':
    default:
      return konvertiereAufgabengruppe(poolFrage, basis)
  }
}
```

## Strategy-File-Pattern
Jedes `konvertiereX.ts` exportiert eine Funktion mit `switch` über die ihr zugewiesenen Cases:
```ts
import type { Frage, ... } from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'  // oder ./basis falls extrahiert
import { genId } from './konstanten'
import { berechnePunkte } from './punkte'  // bei Bedarf
// (POOL_IMG_BASE_URL bei Bild-Cases)

export function konvertiereStandard(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    case 'mc': { /* Original Z. 300-316 unverändert */ }
    // ...
  }
}
```

WICHTIG bei Strategy-Files:
- Zirkulärer Import von `BasisFelder` Type aus `./index` ist OK in TS (Type-Imports werden zur Compile-Zeit erased; cycle ist Type-only). Falls TS dennoch klagt: `BasisFelder` in eigene `basis.ts` extrahieren.
- Cases mit `genId` brauchen `from './konstanten'`.
- Cases mit `POOL_IMG_BASE_URL` (hotspot, bildbeschriftung, dragdrop_bild) brauchen `from './konstanten'`.
- Cases mit `berechnePunkte` (gruppe) brauchen `from './punkte'`.

## Path-Tiefe (CRITICAL)
- Sub-Files liegen in `utils/poolConverter/<file>.ts`.
- 2 ups → `src/`. Pfade aus Sub-Files:
  - `'../../types/fragen-storage'` (no extension wie Original)
  - `'../../types/pool'` (no extension wie Original)
  - `'./<sibling>'` für poolConverter-interne Imports (kein up nötig)
- Original `poolConverter.ts` ist 1 Level höher, nutzt `'../types/...'` (1 up). Sub-Files brauchen 1 zusätzlichen `../`.

## Test-File-Behandlung
- `ExamLab/src/utils/poolConverter.test.ts` bleibt unverändert (colocated mit Folder).
- Test importiert `from './poolConverter'` (no extension) → Folder-Resolution → `poolConverter/index.ts`. ✓
EOF
```

### Task 0.5: Closure-Audit für fibuAutoKorrektur.ts

- [ ] **Step 1: Audit-Notiz schreiben**

```bash
cat > /tmp/bundle-s-c-fibuAutoKorrektur-audit.md <<'EOF'
# fibuAutoKorrektur — Audit-Notizen für Phase 2.1

## Ziel-Layout (6 Sub-Files in utils/fibuAutoKorrektur/, per Master-Spec 5.3.2)
1. `index.ts` — Re-Exports der 4 Korrektur-Funktionen + 2 Type-Interfaces (KorrekturErgebnis, KorrekturDetail) (~30 Z.)
2. `buchungssatz.ts` — `korrigiereBuchungssatz` (export) + `bewerteBuchungVereinfacht` (private) (~95 Z.)
3. `tkonto.ts` — `korrigiereTKonto` (export) + `bewerteTKontoEintraege` (private) (~125 Z.)
4. `kontenbestimmung.ts` — `korrigiereKontenbestimmung` (~55 Z.)
5. `bilanzER.ts` — `korrigiereBilanzER` (export) + private types BilanzAntwortSeite/BilanzAntwort (~285 Z.)
6. `util.ts` — `norm`, `kontenSetGleich`, `gleicheReihenfolge` (private utilities used by bilanzER) (~25 Z.)

## index.ts Struktur
```ts
export type { KorrekturErgebnis, KorrekturDetail } from './buchungssatz'  // oder zentralisieren
export { korrigiereBuchungssatz } from './buchungssatz'
export { korrigiereTKonto } from './tkonto'
export { korrigiereKontenbestimmung } from './kontenbestimmung'
export { korrigiereBilanzER } from './bilanzER'
```

WICHTIG bei Type-Re-Exports: `KorrekturErgebnis`/`KorrekturDetail` werden in 4 Strategy-Files VERWENDET (return-types). Beste Lösung: Types in EINER Datei definieren (z.B. `index.ts` selbst oder `types.ts`) und in alle 4 Strategy-Files importieren.

**Empfehlung:** Types in `index.ts` definieren als Re-Export-Hub, ABER Strategy-Files importieren NICHT von `./index` (Zirkularität). Stattdessen eigene `types.ts`:
```ts
// utils/fibuAutoKorrektur/types.ts
export interface KorrekturErgebnis { ... }
export interface KorrekturDetail { ... }
```
Dann `index.ts` re-exportiert + Strategy-Files importieren `from './types'`.

→ Zusätzliches 7. File `types.ts`. **Sub-File-Anzahl: 7** (vs. 6 in Master-Spec). Begründung: Type-Sharing ohne Zirkularität. Spec-Compliance bleibt — die Master-Spec erlaubt `(6 Sub-Files)` als Schätzung.

## Imports pro Sub-File
- `buchungssatz.ts`: `'../../types/fragen-storage'` (BuchungssatzZeile, BuchungssatzFrage), `'./types'` (KorrekturErgebnis/Detail)
- `tkonto.ts`: `'../../types/fragen-storage'` (TKontoEintrag, TKontoFrage), `'../../types/antworten'` (Antwort, für `Extract<Antwort, ...>`), `'./types'`
- `kontenbestimmung.ts`: `'../../types/fragen-storage'` (KontenbestimmungFrage), `'./types'`
- `bilanzER.ts`: `'../../types/fragen-storage'` (BilanzERFrage), `'./util'` (norm, kontenSetGleich, gleicheReihenfolge), `'./types'`
- `util.ts`: keine externen Imports (pure)
- `types.ts`: keine externen Imports
- `tkonto.ts` + `kontenbestimmung.ts` brauchen `'../kontenrahmen'` (sibling-util `findKonto`) — `tkonto.ts` Z. 181 nutzt `findKonto`.

Verify: `grep "findKonto" ExamLab/src/utils/fibuAutoKorrektur.ts` zeigt nur 1 Treffer in `korrigiereTKonto`. → nur `tkonto.ts` braucht `'../kontenrahmen'`.

## Path-Tiefe (CRITICAL)
- Sub-Files in `utils/fibuAutoKorrektur/<file>.ts`.
- `'../../types/...'` (2 ups) für Types.
- `'../kontenrahmen'` (1 up) für sibling util — Original-Import `'./kontenrahmen'` braucht 1 zusätzlichen `../` in Sub-Files.

## External-Caller-Verhalten
- `utils/autoKorrektur.ts:19+23+24` importiert `from './fibuAutoKorrektur'` (no extension) → Folder-Resolution → `fibuAutoKorrektur/index.ts`. ✓ Kein Caller-Edit nötig.
EOF
```

---

## Phase 1 — poolConverter-Extraktion

### Task 1.1: Folder-Skeleton anlegen (10 Sub-Dateien, alte Datei bleibt)

**Files:**
- Create folder: `ExamLab/src/utils/poolConverter/`
- Create files (10):
  - `index.ts` — Re-Exports + main `konvertierePoolFrage` (basis + dispatcher)
  - `konstanten.ts` — `POOL_IMG_BASE_URL` + `genId` + `jetzt`
  - `helpers.ts` — `mapFachbereich` + `mapBloom` + `konvertierePoolBild`
  - `punkte.ts` — `berechnePunkte`
  - `zeitbedarf.ts` — `schaetzeZeitbedarf`
  - `snapshot.ts` — `erzeugeSnapshot`
  - `konvertiereStandard.ts` — 11 Cases (mc, multi, tf, fill, calc, sort, open, sortierung, formel, code, zeichnen)
  - `konvertiereBild.ts` — 3 Cases (hotspot, bildbeschriftung, dragdrop_bild)
  - `konvertiereFibu.ts` — 4 Cases (bilanz, buchungssatz, tkonto, kontenbestimmung)
  - `konvertiereAufgabengruppe.ts` — gruppe + default-fallback
- Old file unchanged: `ExamLab/src/utils/poolConverter.ts` (744 Z., bleibt!)

- [ ] **Step 1: Audit-Notiz lesen** (`/tmp/bundle-s-c-poolConverter-audit.md`).

- [ ] **Step 2: Original-Datei für Referenz öffnen** (alle 744 Zeilen). Body-byte-identische Übernahme.

- [ ] **Step 3: `konstanten.ts` erstellen**

```ts
export const POOL_IMG_BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'

/** Erzeugt eine UUID v4 (kryptografisch einfach, ohne externe Abhängigkeit) */
export function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Erstellt das ISO-Datum für jetzt */
export function jetzt(): string {
  return new Date().toISOString()
}
```

(Bodies byte-identisch zu Original Z. 31, 155-161, 164-166, mit `export` versehen.)

- [ ] **Step 4: `helpers.ts` erstellen** — Bodies byte-identisch aus Original Z. 36-47 (`mapFachbereich`), 50-60 (`mapBloom`), 169-182 (`konvertierePoolBild`). `konvertierePoolBild` braucht `genId` + `POOL_IMG_BASE_URL` von `./konstanten`, sowie Type `FrageAnhang` aus `'../../types/fragen-storage'`.

```ts
import type { FrageAnhang, Fachbereich, BloomStufe } from '../../types/fragen-storage'
import { POOL_IMG_BASE_URL, genId } from './konstanten'

export function mapFachbereich(fach: string): Fachbereich {
  // Body byte-identisch Z. 36-47
}

export function mapBloom(tax: string): BloomStufe {
  // Body byte-identisch Z. 50-60
}

export function konvertierePoolBild(img: { src: string; alt?: string }): FrageAnhang {
  // Body byte-identisch Z. 169-182
}
```

- [ ] **Step 5: `punkte.ts` erstellen** — Body byte-identisch Z. 63-106.

```ts
import type { PoolFrage } from '../../types/pool'

/** Berechnet die Standardpunktzahl für einen Fragetyp */
export function berechnePunkte(pf: PoolFrage): number {
  // Body byte-identisch Z. 64-105
}
```

- [ ] **Step 6: `zeitbedarf.ts` erstellen** — Body byte-identisch Z. 109-152.

```ts
import type { PoolFrage } from '../../types/pool'

/** Schätzt den Zeitbedarf in Minuten für eine Pool-Frage */
export function schaetzeZeitbedarf(pf: PoolFrage): number {
  // Body byte-identisch Z. 110-151
}
```

- [ ] **Step 7: `snapshot.ts` erstellen** — Body byte-identisch Z. 190-225.

```ts
import type { PoolFrage, PoolFrageSnapshot } from '../../types/pool'

/**
 * Erzeugt einen PoolFrageSnapshot für Änderungserkennung.
 * Wird beim Import und beim Update-Vergleich verwendet.
 */
export function erzeugeSnapshot(poolFrage: PoolFrage): PoolFrageSnapshot {
  // Body byte-identisch Z. 191-224
}
```

- [ ] **Step 8: `index.ts` schreiben** — Re-Exports + main dispatcher

```ts
import type {
  Frage,
  Fachbereich,
  BloomStufe,
  Bewertungskriterium,
  Verwendung,
  FrageAnhang,
} from '../../types/fragen-storage'
import type { PoolFrage, PoolMeta, PoolTopic } from '../../types/pool'

import { POOL_IMG_BASE_URL, genId, jetzt } from './konstanten'
import { mapFachbereich, mapBloom, konvertierePoolBild } from './helpers'
import { berechnePunkte } from './punkte'
import { schaetzeZeitbedarf } from './zeitbedarf'
import { konvertiereStandard } from './konvertiereStandard'
import { konvertiereBild } from './konvertiereBild'
import { konvertiereFibu } from './konvertiereFibu'
import { konvertiereAufgabengruppe } from './konvertiereAufgabengruppe'

// Public API re-exports (preserves caller compatibility — services/poolSync.ts importiert konvertierePoolFrage, erzeugeSnapshot, konvertierePoolBild)
export { mapFachbereich, mapBloom, konvertierePoolBild } from './helpers'
export { berechnePunkte } from './punkte'
export { schaetzeZeitbedarf } from './zeitbedarf'
export { erzeugeSnapshot } from './snapshot'
export { POOL_IMG_BASE_URL } from './konstanten'

/** Felder, die ALLE konvertierten Fragen teilen — wird vom konvertierePoolFrage-Dispatcher gebaut und in jede Strategy gespreaded. */
export interface BasisFelder {
  id: string
  version: number
  erstelltAm: string
  geaendertAm: string
  fachbereich: Fachbereich
  fach: string
  thema: string
  unterthema: string
  semester: string[]
  gefaesse: string[]
  bloom: BloomStufe
  tags: string[]
  punkte: number
  musterlosung: string
  bewertungsraster: Bewertungskriterium[]
  schwierigkeit: number
  verwendungen: Verwendung[]
  zeitbedarf: number
  quelle: 'pool'
  quellReferenz: string
  autor: string
  geteilt: 'schule'
  poolId: string
  poolGeprueft: boolean
  pruefungstauglich: boolean
  poolContentHash: string
  poolUpdateVerfuegbar: boolean
  lernzielIds: string[]
  anhaenge?: FrageAnhang[]
}

/**
 * Konvertiert eine Pool-Frage ins ExamLab-Format.
 *
 * @param poolFrage  - Die Rohfrage aus dem Pool
 * @param poolMeta   - Pool-Metadaten (id, title, fach)
 * @param topics     - Topic-Map für Thema-Lookup
 * @param lernzielIds - Zugeordnete Lernziel-IDs (vom Caller)
 * @returns          Fertige Frage im ExamLab-Format
 */
export function konvertierePoolFrage(
  poolFrage: PoolFrage,
  poolMeta: PoolMeta,
  topics: Record<string, PoolTopic>,
  lernzielIds: string[] = [],
): Frage {
  const now = jetzt()
  const topic = topics[poolFrage.topic]
  const thema = poolMeta.title || topic?.label || poolFrage.topic
  const unterthema = topic?.label ?? poolFrage.topic

  const basis: BasisFelder = {
    // Body byte-identisch zu Original Z. 252-294 (das `basis`-Object)
    id: genId(),
    version: 1,
    erstelltAm: now,
    geaendertAm: now,
    fachbereich: mapFachbereich(poolMeta.fach),
    fach: poolMeta.fach || 'Allgemein',
    thema,
    unterthema,
    semester: [],
    gefaesse: [],
    bloom: mapBloom(poolFrage.tax),
    tags: [poolFrage.topic, `diff:${poolFrage.diff}`],
    punkte: berechnePunkte(poolFrage),
    musterlosung: poolFrage.explain ?? ('sample' in poolFrage ? poolFrage.sample : undefined) ?? '',
    bewertungsraster: [],
    schwierigkeit: poolFrage.diff,
    verwendungen: [],
    zeitbedarf: schaetzeZeitbedarf(poolFrage),
    quelle: 'pool',
    quellReferenz: `Pool: ${poolMeta.title}`,
    autor: 'pool-import',
    geteilt: 'schule',
    poolId: `${poolMeta.id}:${poolFrage.id}`,
    poolGeprueft: poolFrage.reviewed ?? false,
    pruefungstauglich: false,
    poolContentHash: '',
    poolUpdateVerfuegbar: false,
    lernzielIds,
    ...(poolFrage.img ? { anhaenge: [konvertierePoolBild(poolFrage.img)] } : {}),
  }

  switch (poolFrage.type) {
    case 'mc':
    case 'multi':
    case 'tf':
    case 'fill':
    case 'calc':
    case 'sort':
    case 'open':
    case 'sortierung':
    case 'formel':
    case 'code':
    case 'zeichnen':
      return konvertiereStandard(poolFrage, basis)
    case 'hotspot':
    case 'bildbeschriftung':
    case 'dragdrop_bild':
      return konvertiereBild(poolFrage, basis)
    case 'bilanz':
    case 'buchungssatz':
    case 'tkonto':
    case 'kontenbestimmung':
      return konvertiereFibu(poolFrage, basis)
    case 'gruppe':
    default:
      return konvertiereAufgabengruppe(poolFrage, basis)
  }
}
```

**Wichtig:**
- `BasisFelder` Type wird HIER definiert + exportiert. Strategy-Files importieren `from './index'`, dies ist Type-only-Cycle (TS erlaubt).
- `basis`-Object-Build ist BYTE-IDENTISCH zu Original Z. 252-294 (mit Type-Annotation `BasisFelder` zusätzlich, was reine TS-Annotation ist).
- Re-Exports: alle 7 ursprünglich-public Symbols bleiben aus `'./index'`-Pfad importierbar.

- [ ] **Step 9: `konvertiereStandard.ts` erstellen**

```ts
import type { Frage, MCFrage, FreitextFrage, ZuordnungFrage, LueckentextFrage, RichtigFalschFrage, BerechnungFrage, SortierungFrage, FormelFrage, CodeFrage, VisualisierungFrage } from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId } from './konstanten'

export function konvertiereStandard(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    case 'mc': {
      // Body byte-identisch zu Original Z. 300-316 (jetzt mit `basis` als Argument statt File-Scope-Closure)
    }
    case 'multi': { /* Z. 321-340 */ }
    case 'tf': { /* Z. 345-360 */ }
    case 'fill': { /* Z. 366-380 */ }
    case 'calc': { /* Z. 386-402 */ }
    case 'sort': { /* Z. 408-422 */ }
    case 'open': { /* Z. 427-437 */ }
    case 'sortierung': { /* Z. 443-456 */ }
    case 'formel': { /* Z. 461-470 */ }
    case 'code': { /* Z. 568-578 */ }
    case 'zeichnen': { /* Z. 581-588 */ }
  }
  // Unreachable per type-narrowing in dispatcher; aber TS verlangt Return:
  throw new Error(`konvertiereStandard called with non-standard type: ${(poolFrage as { type: string }).type}`)
}
```

**Body-Mapping pro Case** (alle `...basis` werden BYTE-IDENTISCH übernommen — der Argument `basis` ersetzt nur den File-Scope-Lookup):

Original code (z.B. Z. 307-315 für 'mc'):
```ts
const frage: MCFrage = {
  ...basis,
  typ: 'mc',
  fragetext: poolFrage.q,
  optionen,
  mehrfachauswahl: false,
  zufallsreihenfolge: true,
}
return frage
```

→ unverändert in `konvertiereStandard.ts`. Nur die umgebende `case 'mc': { ... }`-Block-Struktur und der Fn-Wrapper sind neu.

- [ ] **Step 10: `konvertiereBild.ts` erstellen** — 3 Cases (hotspot, bildbeschriftung, dragdrop_bild) byte-identisch aus Original Z. 476-563.

```ts
import type { Frage, HotspotFrage, HotspotBereich, BildbeschriftungFrage, DragDropBildFrage } from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId, POOL_IMG_BASE_URL } from './konstanten'

export function konvertiereBild(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    case 'hotspot': { /* Body byte-identisch Z. 477-505 */ }
    case 'bildbeschriftung': { /* Z. 511-526 */ }
    case 'dragdrop_bild': { /* Z. 532-563 */ }
  }
  throw new Error(`konvertiereBild called with non-bild type: ${(poolFrage as { type: string }).type}`)
}
```

- [ ] **Step 11: `konvertiereFibu.ts` erstellen** — 4 Cases (bilanz, buchungssatz, tkonto, kontenbestimmung) byte-identisch aus Original Z. 593-708.

```ts
import type { Frage, BilanzERFrage, BuchungssatzFrage, TKontoFrage, KontenbestimmungFrage } from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId } from './konstanten'

export function konvertiereFibu(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    case 'bilanz': { /* Z. 593-620 */ }
    case 'buchungssatz': { /* Z. 625-642 */ }
    case 'tkonto': { /* Z. 647-682 */ }
    case 'kontenbestimmung': { /* Z. 687-708 */ }
  }
  throw new Error(`konvertiereFibu called with non-fibu type: ${(poolFrage as { type: string }).type}`)
}
```

- [ ] **Step 12: `konvertiereAufgabengruppe.ts` erstellen** — gruppe + default-fallback byte-identisch aus Original Z. 711-743.

```ts
import type { Frage, AufgabengruppeFrage, FreitextFrage } from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId } from './konstanten'
import { berechnePunkte } from './punkte'

export function konvertiereAufgabengruppe(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    case 'gruppe': { /* Body byte-identisch Z. 711-730 */ }
    default: { /* Body byte-identisch Z. 732-742 (Freitext-Fallback mit console.warn) */ }
  }
}
```

- [ ] **Step 13: tsc + build verifizieren**

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-c-tsc-pool-skeleton.log
grep -E "error TS" /tmp/bundle-s-c-tsc-pool-skeleton.log || echo "OK: no TS errors"
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: 0 errors. Falls Errors:
- Wrong import path → 2-ups vs 1-up beachten.
- Type-only-Cycle ungültig → `BasisFelder` in `basis.ts` extrahieren statt aus `./index` importieren.
- Byte-identity-Drift → original case-bodies neu kopieren.

- [ ] **Step 14: Status check + Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git status -s | grep poolConverter
```

Expected: 10 neue Files in `ExamLab/src/utils/poolConverter/`. Alte `poolConverter.ts` unverändert.

```bash
git add ExamLab/src/utils/poolConverter/
git commit -m "Bundle S.c Phase 1.1: poolConverter/ Folder-Skeleton mit 10 Sub-Dateien"
```

### Task 1.2: Cutover poolConverter — alte Datei löschen

**Files:**
- Delete: `ExamLab/src/utils/poolConverter.ts`

(Kein Caller-Edit nötig — keine externen Caller mit `.ts`-Extension; Folder-Resolution funktioniert direkt.)

- [ ] **Step 1: Datei löschen**

```bash
git rm ExamLab/src/utils/poolConverter.ts
```

- [ ] **Step 2: Verifikations-Suite**

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-c-tsc-pool-cutover.log
cd ExamLab && npm run build 2>&1 | tail -5
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
cd ExamLab && npm run lint
```

Expected:
- tsc 0 errors
- build clean
- vitest **exakt** 1253 passed | 4 todo | 1 skipped (drift = 0). **Bei Drift STOP + Hotfix.**
- lint exit 0

- [ ] **Step 3: Commit**

```bash
git commit -m "Bundle S.c Phase 1.2: Cutover — alte poolConverter.ts geloescht, Folder aktiv"
```

---

## Phase 2 — fibuAutoKorrektur-Extraktion

### Task 2.1: Folder-Skeleton anlegen (7 Sub-Dateien, alte Datei bleibt)

**Files:**
- Create folder: `ExamLab/src/utils/fibuAutoKorrektur/`
- Create files (7):
  - `index.ts` — Re-Exports
  - `types.ts` — `KorrekturErgebnis` + `KorrekturDetail` Interfaces (zentral, vermeidet Zirkularität)
  - `buchungssatz.ts` — `korrigiereBuchungssatz` + `bewerteBuchungVereinfacht`
  - `tkonto.ts` — `korrigiereTKonto` + `bewerteTKontoEintraege`
  - `kontenbestimmung.ts` — `korrigiereKontenbestimmung`
  - `bilanzER.ts` — `korrigiereBilanzER` + private types BilanzAntwortSeite/BilanzAntwort
  - `util.ts` — `norm` + `kontenSetGleich` + `gleicheReihenfolge`
- Old file unchanged: `ExamLab/src/utils/fibuAutoKorrektur.ts` (600 Z., bleibt!)

- [ ] **Step 1: Audit-Notiz lesen** (`/tmp/bundle-s-c-fibuAutoKorrektur-audit.md`).

- [ ] **Step 2: `types.ts` erstellen** (zentrale Type-Definitionen)

```ts
export interface KorrekturErgebnis {
  erreichtePunkte: number
  maxPunkte: number
  details: KorrekturDetail[]
}

export interface KorrekturDetail {
  bezeichnung: string
  korrekt: boolean
  erreicht: number
  max: number
  kommentar?: string
}
```

(Bodies byte-identisch zu Original Z. 12-24.)

- [ ] **Step 3: `util.ts` erstellen** — pure Helper byte-identisch Z. 304-320

```ts
/** Normalisiert einen String für Vergleiche (lowercase, trimmed) */
export function norm(s: string): string {
  return s.toLowerCase().trim()
}

/** Prüft ob zwei Konten-Sets die gleichen Nummern enthalten (reihenfolge-unabhängig) */
export function kontenSetGleich(a: string[], b: string[]): boolean {
  // Body byte-identisch Z. 309-313
}

/** Prüft ob zwei Arrays in gleicher Reihenfolge sind */
export function gleicheReihenfolge(a: string[], b: string[]): boolean {
  // Body byte-identisch Z. 317-319
}
```

- [ ] **Step 4: `buchungssatz.ts` erstellen** — `korrigiereBuchungssatz` + `bewerteBuchungVereinfacht`

```ts
import type { BuchungssatzZeile, BuchungssatzFrage } from '../../types/fragen-storage'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

/** U2: Auto-correct a Buchungssatz answer (vereinfachtes Format) */
export function korrigiereBuchungssatz(
  frage: BuchungssatzFrage,
  antwortBuchungen: { id: string; sollKonto: string; habenKonto: string; betrag: number }[]
): KorrekturErgebnis {
  // Body byte-identisch zu Original Z. 35-83
}

/** Score: 1/3 je Soll-Konto, Haben-Konto, Betrag */
function bewerteBuchungVereinfacht(
  erwartet: BuchungssatzZeile,
  eingabe: { sollKonto: string; habenKonto: string; betrag: number }
): number {
  // Body byte-identisch zu Original Z. 90-97
}
```

- [ ] **Step 5: `tkonto.ts` erstellen** — `korrigiereTKonto` + `bewerteTKontoEintraege`

```ts
import type { TKontoEintrag, TKontoFrage } from '../../types/fragen-storage'
import type { Antwort } from '../../types/antworten'
import { findKonto } from '../kontenrahmen'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

/** Bewerte T-Konto-Einträge: Vergleich Musterlösung vs. Eingabe (reihenfolge-unabhängig) */
function bewerteTKontoEintraege(
  erwartet: TKontoEintrag[],
  eingabe: {
    eintraegeLinks: { gegenkonto: string; betrag: number }[]
    eintraegeRechts: { gegenkonto: string; betrag: number }[]
  }
): number {
  // Body byte-identisch zu Original Z. 108-142
}

/** Auto-Korrektur für T-Konto-Fragen */
export function korrigiereTKonto(
  frage: TKontoFrage,
  antwortKonten: Extract<Antwort, { typ: 'tkonto' }>['konten']
): KorrekturErgebnis {
  // Body byte-identisch zu Original Z. 149-224
}
```

- [ ] **Step 6: `kontenbestimmung.ts` erstellen** — `korrigiereKontenbestimmung`

```ts
import type { KontenbestimmungFrage } from '../../types/fragen-storage'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

/** Auto-Korrektur für Kontenbestimmung-Fragen */
export function korrigiereKontenbestimmung(
  frage: KontenbestimmungFrage,
  antwortAufgaben: Record<string, { antworten: { kontonummer?: string; kategorie?: string; seite?: string }[] }>
): KorrekturErgebnis {
  // Body byte-identisch zu Original Z. 233-280
}
```

- [ ] **Step 7: `bilanzER.ts` erstellen** — `korrigiereBilanzER` + private types BilanzAntwortSeite/BilanzAntwort

```ts
import type { BilanzERFrage } from '../../types/fragen-storage'
import { norm, kontenSetGleich, gleicheReihenfolge } from './util'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

type BilanzAntwortSeite = {
  // byte-identisch Z. 285-288
}

type BilanzAntwort = {
  // byte-identisch Z. 290-301
}

/** Auto-Korrektur für Bilanz/ER-Fragen */
export function korrigiereBilanzER(
  frage: BilanzERFrage,
  antwort: BilanzAntwort
): KorrekturErgebnis {
  // Body byte-identisch zu Original Z. 326-599
}
```

- [ ] **Step 8: `index.ts` schreiben** als Re-Export-Hub

```ts
export type { KorrekturErgebnis, KorrekturDetail } from './types'
export { korrigiereBuchungssatz } from './buchungssatz'
export { korrigiereTKonto } from './tkonto'
export { korrigiereKontenbestimmung } from './kontenbestimmung'
export { korrigiereBilanzER } from './bilanzER'
```

(~6 Lines.)

- [ ] **Step 9: tsc + build verifizieren**

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-c-tsc-fibu-skeleton.log
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 10: Status check + Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git status -s | grep fibuAutoKorrektur

git add ExamLab/src/utils/fibuAutoKorrektur/
git commit -m "Bundle S.c Phase 2.1: fibuAutoKorrektur/ Folder-Skeleton mit 7 Sub-Dateien"
```

### Task 2.2: Cutover fibuAutoKorrektur — alte Datei löschen

**Files:**
- Delete: `ExamLab/src/utils/fibuAutoKorrektur.ts`

- [ ] **Step 1: Datei löschen**

```bash
git rm ExamLab/src/utils/fibuAutoKorrektur.ts
```

- [ ] **Step 2: Verifikations-Suite**

```bash
cd ExamLab && npx tsc -b --noEmit 2>&1 | tee /tmp/bundle-s-c-tsc-fibu-cutover.log
cd ExamLab && npm run build 2>&1 | tail -5
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```

Expected:
- tsc 0 errors
- build clean
- vitest **exakt** 1253 passed | 4 todo | 1 skipped (drift = 0). **Bei Drift STOP + Hotfix.**
- lint exit 0

- [ ] **Step 3: Commit**

```bash
git commit -m "Bundle S.c Phase 2.2: Cutover — alte fibuAutoKorrektur.ts geloescht, Folder aktiv"
```

### Task 2.3: Browser-E2E-Spot-Check (poolConverter + fibuAutoKorrektur)

**Files:** keine (Browser-Test auf staging)

- [ ] **Step 1: Branch-Setup für Staging**

```bash
# Pre-Check: hat preview eigene Commits (nicht in main)?
git log origin/preview ^origin/main --oneline
```

- Wenn S.b auf preview ist (Force-Push aus S.b-Phase): preview hat WIP. STOP — User muss S.b zuerst auf main mergen ODER S.c-Test verschieben.
- Wenn leer (preview = main): Force-Push S.c-Branch zu preview sicher.

```bash
git push origin refactor/bundle-s-c-utils-splits:preview --force-with-lease
```

(Dieser Step ist nur möglich nach S.b-Merge oder wenn S.b und S.c sequenziell getestet werden.)

- [ ] **Step 2: Service-Worker-Cache zurücksetzen + LP-Login** (per `feedback_service_worker_cache_wire_bundle.md` + `feedback_echte_logins.md`).

- [ ] **Step 3: poolConverter-Pfad — SuS-Üben → Pool-Frage** (per Master-Spec Sektion 7.3):
  - Pool-Frage starten + abgeben pro Fragetyp-Kategorie:
    - 1× MC (oder TF) — Standard-Bucket
    - 1× Hotspot (oder DragDropBild) — Bild-Bucket
    - 1× Buchungssatz (oder BilanzER) — Fibu-Bucket
  - Erwartung: Pool-Frage rendert wie zuvor, Antwort wird gespeichert, Auto-Korrektur (falls aktiv) liefert plausible Ergebnisse.

- [ ] **Step 4: fibuAutoKorrektur-Pfad — LP-Korrektur mit AutoKorrektur**:
  - Eine bestehende Prüfung mit FiBu-Abgaben öffnen (oder per LP-Vorschau eine Test-Prüfung anlegen):
    - 1× Buchungssatz Auto-Korrektur — `korrigiereBuchungssatz` Path
    - 1× T-Konto Auto-Korrektur — `korrigiereTKonto` Path
    - 1× Kontenbestimmung Auto-Korrektur — `korrigiereKontenbestimmung` Path
    - 1× BilanzER Auto-Korrektur — `korrigiereBilanzER` Path
  - Erwartung: AutoKorrekturDetails-Box rendert, Punkte plausibel, keine Console-Errors.

- [ ] **Step 5: Browser-Console-Check**

DevTools → Console: keine neuen Errors/Warnings.

- [ ] **Step 6: Falls Issue gefunden** — Hotfix-Commit auf S.c-Branch pushen, NICHT auf main.

(Falls Browser-E2E nicht durchführbar — z.B. weil S.b noch unmerged auf preview ist —, im Final-Verification-Bericht explizit notieren mit Begründung. Vitest + tsc decken Byte-Identität ab; visuelle Stichprobe ist Spec-Anforderung Sektion 7.3 die User später nachholt.)

---

## Phase 3 — Bundle-Finalize

### Task 3.1: Final-Verifikation

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

Expected: `poolConverter.ts` und `fibuAutoKorrektur.ts` aus der Liste verschwunden.

- [ ] **Step 3: Caller-Imports byte-identisch**

```bash
git diff main..HEAD -- '*.ts' '*.tsx' | grep -E "^[+-].*import.*poolConverter|^[+-].*import.*fibuAutoKorrektur" | head -20
```

Expected: KEINE Diff-Lines (Folder-Resolution fängt alle Caller-Imports auf, kein Caller-Edit nötig).

### Task 3.2: HANDOFF.md aktualisieren

**Files:** Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: Neuen Eintrag** für Bundle S.c oben einfügen, vor Bundle S.b/S.a:

```markdown
### Bundle S.c — Utils-Splits (poolConverter + fibuAutoKorrektur) ✅ READY FOR MERGE (2026-05-06)

Branch `refactor/bundle-s-c-utils-splits` (von main, parallel zu S.b). 4 Implementation-Commits + Plan-Commit. Drittes und letztes Sub-Bundle aus Bundle S — achtes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). Master-Spec Sektion 5.3.

**Was geliefert:**
- `ExamLab/src/utils/poolConverter.ts` (744 Z.) → Folder mit 10 Sub-Dateien (1 `index.ts` Re-Export-Hub mit `konvertierePoolFrage`-Dispatcher + 1 `konstanten.ts` + 1 `helpers.ts` + 1 `punkte.ts` + 1 `zeitbedarf.ts` + 1 `snapshot.ts` + 4 `konvertiereX.ts`-Bucket-Strategy: Standard/Bild/Fibu/Aufgabengruppe)
- `ExamLab/src/utils/fibuAutoKorrektur.ts` (600 Z.) → Folder mit 7 Sub-Dateien (1 `index.ts` Re-Export-Hub + 1 `types.ts` + 1 `buchungssatz.ts` + 1 `tkonto.ts` + 1 `kontenbestimmung.ts` + 1 `bilanzER.ts` + 1 `util.ts`)
- Caller-Imports byte-identisch (Folder-Resolution; keine externen Caller mit `.ts`-Extension)

**Hotspot-Bilanz (Files >500 Z.):** **<aktueller> → <-2>** ✅ (poolConverter 744 + fibuAutoKorrektur 600 raus). Bundle S komplett: 17 → 12 erreicht ✅.

**Verifikation:**
- vitest **1253 passed | 4 todo (1257 total)** — drift = 0 ✅
- tsc -b clean (force-mode), build clean
- lint:as-any 0 / lint:no-alert 0 / lint:no-tests-dir clean

**Browser-E2E:** offen — User testet auf staging (3× Pool-Frage-Pfade nach Bucket-Domain + 4× FiBu-AutoKorrektur-Pfade).

**Sub-Commits:**
- `<hash>` Plan
- `<hash>` Phase 1.1: poolConverter/ Folder-Skeleton (10 Sub-Dateien)
- `<hash>` Phase 1.2: poolConverter Cutover
- `<hash>` Phase 2.1: fibuAutoKorrektur/ Folder-Skeleton (7 Sub-Dateien)
- `<hash>` Phase 2.2: fibuAutoKorrektur Cutover

**Folge:**
- Bundle S komplett nach S.c-Merge — Phase 2 Cleanup-Roadmap abgeschlossen.
- Phase 3 (Bundle P musterlosung Field-Drift, Bundle T Hooks-Splits) und Phase 4 (Bundle U PDFSeite) folgen.
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle S.c: HANDOFF.md mit Bundle-S.c-Eintrag"
```

### Task 3.3: PR auf main + Merge

**Files:** keine (GitHub-Operation)

- [ ] **Step 1: Push + PR** analog S.b Task 2.3.

- [ ] **Step 2: Pages-Deploy-Vorbedingung** + S.b-Merge-Status — User-Aufgabe.

- [ ] **Step 3: Merge** auf main. Subject: `Merge Bundle S.c: Utils-Splits (poolConverter + fibuAutoKorrektur)`.

### Task 3.4: Memory-Eintrag schreiben

**Files:**
- Create: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_s_c_utils_splits.md`
- Modify: MEMORY.md Index-Eintrag

(Vorlage analog S.b memory.)

---

## Acceptance Criteria

- [ ] `utils/poolConverter/` Folder mit 10 Sub-Files, alte Datei gelöscht
- [ ] `utils/fibuAutoKorrektur/` Folder mit 7 Sub-Files, alte Datei gelöscht
- [ ] Caller-Imports byte-identisch (`git diff main..HEAD -- 'utils/autoKorrektur.ts' 'services/poolSync.ts' 'utils/poolConverter.test.ts'` zeigt 0 Caller-Änderungen)
- [ ] Hotspot-Bilanz Files >500 Z.: 2 Files raus
- [ ] vitest **1253 passed | 4 todo** (drift = 0)
- [ ] tsc/build/lint:as-any/lint:no-alert/lint:no-tests-dir clean
- [ ] Browser-E2E SuS-Pool-Frage + LP-AutoKorrektur ✓ (oder explizit notiert)
- [ ] HANDOFF.md aktualisiert
- [ ] Memory-Eintrag geschrieben + MEMORY.md Index-Zeile ergänzt

---

## Risks Reminder (aus Master-Spec Sektion 8 + S.a/S.b-Lehren)

- **`as any` versteckt Mapping-Bugs** (Bundle L.b-Lehre, code-quality.md): poolConverter hat 1 `as unknown as PoolFrage`-Defensive-Cast (Z. 717). Bei Extraktion in `konvertiereAufgabengruppe.ts`: Cast byte-identisch übernehmen, NICHT vereinfachen.
- **Type-only Zirkular-Import** (`BasisFelder` aus `./index`): TS erlaubt es, aber falls Build klagt: `BasisFelder` in eigene `basis.ts` extrahieren und beide `index.ts` und Strategy-Files importieren `from './basis'`. Plan rev2 falls nötig.
- **Drift-Toleranz null** (S.a-Lehre #4): bei vitest-Drift in Task 1.2/2.2 STOP + Hotfix.
- **Path-Tiefe** (S.b-Lehre): empirisch verifiziert via `utils/ueben/` und `utils/zonen/` — 2 ups statt Original-1-up.
- **Caller-Test-File** `poolConverter.test.ts` kolokalisiert mit Folder. Folder-Resolution greift; kein Test-File-Edit.
- **Pages-Deploy-Stau + S.b-S.c-Sequenz**: nur 1 Bundle-S-Merge in flight. S.c-Merge erst nach S.b-Merge.
- **Preview-Force-Push-Race** mit S.b: wenn S.b auf preview ist, S.c kann nicht parallel auf preview testen. User-Sequenz: S.b testen + mergen → S.c testen + mergen.
