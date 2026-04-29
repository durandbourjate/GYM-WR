# Bundle L: `as any`-Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminierung aller 214 `as any`-Stellen aus `ExamLab/src/` + `packages/shared/src/` durch typed Mock-Helpers für Tests und saubere Discriminator-Switches in Production. Drei sequenzielle Phase-Bundles (L.a/L.b/L.c), jede auf eigenem Branch mit eigenem Merge.

**Architecture:** Mock-Helper-Trennung (Architektur B aus Spec): `packages/shared/src/test-helpers/frageCoreMocks.ts` für Core-Frage, `ExamLab/src/__tests__/helpers/frageStorageMocks.ts` für Storage-Frage. Production-Refactor durch Sub-Funktion-Signatur-Verbesserung (z.B. `validiereMC(frage: MCFrage)` statt `(frage: any)`) — danach entfällt der `as any` im aufrufenden Switch automatisch dank TS-Discriminator-Narrowing. Defensive-Tests behalten Type-Bruch via `as unknown as <Type>` mit Inline-`Defensive`-Marker.

**Tech Stack:** TypeScript 5.x (strict), Vitest 4.x, React 19, packages/shared (`@shared` Vite-Alias), ExamLab (Vite + PWA).

**Spec-Referenz:** [docs/superpowers/specs/2026-04-29-bundle-l-as-any-cleanup-design.md](../specs/2026-04-29-bundle-l-as-any-cleanup-design.md)

**Bundle-K-Followup-Lehre (29.04.2026):** Storage's `tags: (string | Tag)[]` ist nicht zuweisbar an Core's `tags: string[]`. Helper-Trennung Core/Storage löst das vorab.

---

## Phase L.a — Mock-Helper + pflichtfeldValidation-Pilot

**Branch:** `refactor/bundle-l-a-mock-helper-pflichtfeld`
**Scope:** 103 `as any`-Stellen + Helper + Audit-Skript
**Sessions:** 1

### Task L.a.0: Branch + Baseline-Audit

**Files:** keine (nur Setup)

- [ ] **Step 1: Branch erstellen**

```bash
git checkout main
git pull
git checkout -b refactor/bundle-l-a-mock-helper-pflichtfeld
```

- [ ] **Step 2: Baseline-Audit dokumentieren**

```bash
# Repo-weit
grep -rn "as any" ExamLab/src/ packages/shared/src/ 2>/dev/null | wc -l
# Erwartung: 214

# pflichtfeldValidation-Files
grep -c "as any" packages/shared/src/editor/pflichtfeldValidation.ts
# Erwartung: 24
grep -c "as any" packages/shared/src/editor/pflichtfeldValidation.test.ts
# Erwartung: 79
```

Notiere die Zahlen — werden in Task L.a.10 verifiziert.

---

### Task L.a.1: Audit-Skript

**Files:**
- Create: `scripts/audit-as-any.sh`

- [ ] **Step 1: Skript schreiben**

```bash
#!/usr/bin/env bash
# Audit-Skript für as-any-Stellen.
# Konvention: Defensive-Casts haben Marker `Defensive` in derselben Zeile wie der Cast (1-Zeilen-Scan).
# Aufruf: ./scripts/audit-as-any.sh [--strict]
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Alle as-any-Stellen
TOTAL=$(grep -rn "as any" ExamLab/src/ packages/shared/src/ 2>/dev/null | wc -l | tr -d ' ')

# Defensive: Inline-Marker in derselben Zeile (akzeptiert auch as unknown as)
DEFENSIVE=$(grep -rEn "as (unknown as |any).*Defensive" ExamLab/src/ packages/shared/src/ 2>/dev/null | wc -l | tr -d ' ')

UNDOKUMENTIERT=$((TOTAL - DEFENSIVE))

echo "as-any-Audit:"
echo "  Total:                 $TOTAL"
echo "  Defensive (OK):        $DEFENSIVE"
echo "  Undokumentiert (FAIL): $UNDOKUMENTIERT"

if [[ "${1:-}" == "--strict" && "$UNDOKUMENTIERT" -gt 0 ]]; then
  echo "FAIL: $UNDOKUMENTIERT undokumentierte as-any-Stellen"
  exit 1
fi
```

- [ ] **Step 2: Ausführbar + Run**

```bash
chmod +x scripts/audit-as-any.sh
./scripts/audit-as-any.sh
# Erwartung: Total: 214, Defensive: 0, Undokumentiert: 214 (Baseline)
```

- [ ] **Step 3: Commit**

```bash
git add scripts/audit-as-any.sh
git commit -m "Bundle L.a: Audit-Skript für as-any-Stellen (Baseline 214)"
```

---

### Task L.a.2: Mock-Helper Test-Datei (TDD - Tests zuerst)

**Files:**
- Create: `packages/shared/src/test-helpers/frageCoreMocks.test.ts`

- [ ] **Step 1: Failing Tests schreiben (deckt alle 20 Sub-Types ab)**

```ts
import { describe, it, expect } from 'vitest'
import { mockCoreFrage } from './frageCoreMocks'
import type { Frage } from '../types/fragen-core'

const ALLE_TYPEN: Array<Frage['typ']> = [
  'mc', 'freitext', 'zuordnung', 'lueckentext', 'visualisierung',
  'richtigfalsch', 'berechnung', 'buchungssatz', 'tkonto', 'kontenbestimmung',
  'bilanzstruktur', 'aufgabengruppe', 'pdf', 'sortierung', 'hotspot',
  'bildbeschriftung', 'audio', 'dragdrop_bild', 'code', 'formel',
]

describe('mockCoreFrage', () => {
  it('liefert für jeden der 20 Sub-Types eine vollständig typisierte Frage', () => {
    for (const typ of ALLE_TYPEN) {
      const frage = mockCoreFrage(typ)
      expect(frage.typ).toBe(typ)
      expect(typeof frage.id).toBe('string')
      expect(frage.id.length).toBeGreaterThan(0)
      expect(typeof frage.version).toBe('number')
      expect(typeof frage.fachbereich).toBe('string')
      expect(typeof frage.fach).toBe('string')
      expect(typeof frage.thema).toBe('string')
      expect(Array.isArray(frage.tags)).toBe(true)
      expect(Array.isArray(frage.semester)).toBe(true)
      expect(Array.isArray(frage.gefaesse)).toBe(true)
      expect(Array.isArray(frage.bewertungsraster)).toBe(true)
      expect(Array.isArray(frage.verwendungen)).toBe(true)
      expect(typeof frage.bloom).toBe('string')
      expect(typeof frage.punkte).toBe('number')
    }
  })

  it('Defaults sind deterministisch (kein Date.now-Drift)', () => {
    const a = mockCoreFrage('mc')
    const b = mockCoreFrage('mc')
    expect(a.erstelltAm).toBe(b.erstelltAm)
    expect(a.geaendertAm).toBe(b.geaendertAm)
  })

  it('overrides überschreiben Defaults', () => {
    const f = mockCoreFrage('mc', { fragetext: 'Custom', punkte: 5 })
    expect(f.fragetext).toBe('Custom')
    expect(f.punkte).toBe(5)
  })

  it('overrides ergänzen Sub-Type-spezifische Felder', () => {
    const mc = mockCoreFrage('mc', { optionen: [{ id: 'a', text: 'A', korrekt: true }] })
    expect(mc.optionen).toHaveLength(1)
    expect(mc.optionen[0].text).toBe('A')
  })

  it('mc default hat optionen: []', () => {
    expect(mockCoreFrage('mc').optionen).toEqual([])
  })

  it('richtigfalsch default hat aussagen: []', () => {
    expect(mockCoreFrage('richtigfalsch').aussagen).toEqual([])
  })

  it('lueckentext default hat luecken: [] und lueckentextModus: freitext', () => {
    const f = mockCoreFrage('lueckentext')
    expect(f.luecken).toEqual([])
    expect(f.lueckentextModus).toBe('freitext')
  })

  it('hotspot default hat bildUrl + hotspots: []', () => {
    const f = mockCoreFrage('hotspot')
    expect(f.bildUrl).toBeTruthy()
    expect(f.hotspots).toEqual([])
  })

  it('dragdrop_bild default hat zonen + labels: []', () => {
    const f = mockCoreFrage('dragdrop_bild')
    expect(f.zonen).toEqual([])
    expect(f.labels).toEqual([])
  })

  it('TypeScript: return-type ist narrowed auf den passenden Sub-Type', () => {
    // Compile-time Test: dieser Block muss tsc-kompilieren ohne Cast
    const mc = mockCoreFrage('mc')
    const optionen: typeof mc.optionen = mc.optionen
    expect(Array.isArray(optionen)).toBe(true)
  })
})
```

- [ ] **Step 2: Run — muss failen**

```bash
cd ExamLab && npx vitest run ../packages/shared/src/test-helpers/frageCoreMocks.test.ts
# Erwartung: FAIL — `mockCoreFrage` not exported / module not found
```

---

### Task L.a.3: mockCoreFrage Implementation

**Files:**
- Create: `packages/shared/src/test-helpers/frageCoreMocks.ts`

- [ ] **Step 1: Helper implementieren**

```ts
import type {
  Frage, FrageBase,
  MCFrage, FreitextFrage, ZuordnungFrage, LueckentextFrage, VisualisierungFrage,
  RichtigFalschFrage, BerechnungFrage, BuchungssatzFrage, TKontoFrage,
  KontenbestimmungFrage, BilanzERFrage, AufgabengruppeFrage, PDFFrage,
  SortierungFrage, HotspotFrage, BildbeschriftungFrage, AudioFrage,
  DragDropBildFrage, CodeFrage, FormelFrage,
} from '../types/fragen-core'

type FrageTyp = Frage['typ']

// Skalare Defaults — Arrays werden in `baseDefaults()` separat erzeugt, damit jeder
// Mock-Aufruf eigene Array-Instanzen bekommt (kein Shared-Reference-Bug).
const FRAGE_BASE_DEFAULTS: Omit<FrageBase, 'tags' | 'semester' | 'gefaesse' | 'verwendungen'> = {
  id: 'test-frage',
  version: 1,
  erstelltAm: new Date(0).toISOString(),
  geaendertAm: new Date(0).toISOString(),
  fachbereich: 'BWL',
  fach: 'Test',
  thema: 'Test',
  bloom: 'K1',
  punkte: 1,
  musterlosung: '',
  bewertungsraster: [],
}

function baseDefaults(): FrageBase {
  return {
    ...FRAGE_BASE_DEFAULTS,
    tags: [],
    semester: [],
    gefaesse: [],
    verwendungen: [],
  }
}

const SUB_DEFAULTS: { [K in FrageTyp]: Omit<Extract<Frage, { typ: K }>, keyof FrageBase | 'typ'> } = {
  mc: { fragetext: 'Test-Frage', optionen: [], mehrfachauswahl: false } as Omit<MCFrage, keyof FrageBase | 'typ'>,
  richtigfalsch: { fragetext: 'Test-Frage', aussagen: [] } as Omit<RichtigFalschFrage, keyof FrageBase | 'typ'>,
  freitext: { fragetext: 'Test-Frage' } as Omit<FreitextFrage, keyof FrageBase | 'typ'>,
  lueckentext: { fragetext: 'Test-Frage', luecken: [], lueckentextModus: 'freitext' } as Omit<LueckentextFrage, keyof FrageBase | 'typ'>,
  zuordnung: { fragetext: 'Test-Frage', paare: [] } as Omit<ZuordnungFrage, keyof FrageBase | 'typ'>,
  visualisierung: { fragetext: 'Test-Frage' } as Omit<VisualisierungFrage, keyof FrageBase | 'typ'>,
  berechnung: { fragetext: 'Test-Frage', ergebnisse: [] } as Omit<BerechnungFrage, keyof FrageBase | 'typ'>,
  sortierung: { fragetext: 'Test-Frage', elemente: [] } as Omit<SortierungFrage, keyof FrageBase | 'typ'>,
  hotspot: { fragetext: 'Test-Frage', bildUrl: '/test.svg', hotspots: [] } as Omit<HotspotFrage, keyof FrageBase | 'typ'>,
  bildbeschriftung: { fragetext: 'Test-Frage', bildUrl: '/test.svg', labels: [] } as Omit<BildbeschriftungFrage, keyof FrageBase | 'typ'>,
  dragdrop_bild: { fragetext: 'Test-Frage', bildUrl: '/test.svg', zonen: [], labels: [] } as Omit<DragDropBildFrage, keyof FrageBase | 'typ'>,
  buchungssatz: { geschaeftsfall: 'Test', geschaeftsfaelle: [], kontenauswahl: { kontenrahmen: '2853', erlaubteKategorien: ['aktiv', 'passiv', 'aufwand', 'ertrag'] } } as Omit<BuchungssatzFrage, keyof FrageBase | 'typ'>,
  tkonto: { aufgabentext: 'Test', konten: [] } as Omit<TKontoFrage, keyof FrageBase | 'typ'>,
  kontenbestimmung: { aufgabentext: 'Test', aufgaben: [], kontenauswahl: { kontenrahmen: '2853', erlaubteKategorien: ['aktiv', 'passiv', 'aufwand', 'ertrag'] } } as Omit<KontenbestimmungFrage, keyof FrageBase | 'typ'>,
  bilanzstruktur: { aufgabentext: 'Test', modus: 'bilanz', loesung: { typ: 'bilanz', struktur: { aktiva: [], passiva: [] }, kontenMitSaldi: [] } } as Omit<BilanzERFrage, keyof FrageBase | 'typ'>,
  aufgabengruppe: { kontext: 'Test', teilaufgaben: [] } as Omit<AufgabengruppeFrage, keyof FrageBase | 'typ'>,
  pdf: { fragetext: 'Test', pdfUrl: '/test.pdf' } as Omit<PDFFrage, keyof FrageBase | 'typ'>,
  audio: { fragetext: 'Test', maxDauerSek: 60 } as Omit<AudioFrage, keyof FrageBase | 'typ'>,
  code: { fragetext: 'Test', sprache: 'python', startCode: '' } as Omit<CodeFrage, keyof FrageBase | 'typ'>,
  formel: { fragetext: 'Test', erwarteterAusdruck: '' } as Omit<FormelFrage, keyof FrageBase | 'typ'>,
}

/**
 * Erzeugt eine vollständig typisierte Mock-Frage für Tests im Core/Editor-Layer.
 * Defaults sind generisch und deterministisch — Tests setzen nur die test-relevanten
 * Felder via `overrides`.
 *
 * Verwendung: Tests in `packages/shared/src/editor/`. ExamLab-Tests verwenden
 * `mockFrage` aus `ExamLab/src/__tests__/helpers/frageStorageMocks.ts`.
 *
 * Defensive-Tests die `null`/`undefined`/`{}` an typed-Funktionen übergeben, nutzen
 * `as unknown as Frage /* Defensive: ... */` direkt, NICHT diesen Helper.
 */
export function mockCoreFrage<T extends FrageTyp>(
  typ: T,
  overrides?: Partial<Extract<Frage, { typ: T }>>
): Extract<Frage, { typ: T }> {
  const base = baseDefaults()
  const subDefaults = SUB_DEFAULTS[typ]
  return {
    ...base,
    ...subDefaults,
    typ,
    ...(overrides ?? {}),
  } as Extract<Frage, { typ: T }>
}
```

- [ ] **Step 2: Tests run — muss alle passen**

```bash
npx vitest run ../packages/shared/src/test-helpers/frageCoreMocks.test.ts
# Erwartung: 10/10 PASS
```

- [ ] **Step 3: tsc check**

```bash
npx tsc -b
# Erwartung: 0 Fehler
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/test-helpers/
git commit -m "Bundle L.a: mockCoreFrage Helper + Tests (20 Sub-Types)"
```

**Wenn ein Sub-Type-Default tsc-Fehler wirft (Pflichtfeld fehlt):** Pflichtfelder aus `packages/shared/src/types/fragen-core.ts` für den Sub-Type prüfen, im `SUB_DEFAULTS` ergänzen, Test re-run. Nicht alle Sub-Types haben gut definierbare Defaults — wenn unklar, Default mit Minimum-Werten + Kommentar.

---

### Task L.a.4: Storage-Helper

**Files:**
- Create: `ExamLab/src/__tests__/helpers/frageStorageMocks.ts`
- Create: `ExamLab/src/__tests__/helpers/frageStorageMocks.test.ts`

- [ ] **Step 1: Failing Test schreiben**

```ts
// frageStorageMocks.test.ts
import { describe, it, expect } from 'vitest'
import { mockFrage } from './frageStorageMocks'

describe('mockFrage (Storage)', () => {
  it('liefert Storage-Frage mit leerem tags-Array', () => {
    const f = mockFrage('mc')
    expect(f.typ).toBe('mc')
    expect(Array.isArray(f.tags)).toBe(true)
    expect(f.tags).toHaveLength(0)
  })

  it('hat kein _recht / poolVersion default', () => {
    const f = mockFrage('mc')
    expect(f._recht).toBeUndefined()
    expect(f.poolVersion).toBeUndefined()
  })

  it('overrides funktionieren', () => {
    const f = mockFrage('mc', { fragetext: 'Custom' })
    expect(f.fragetext).toBe('Custom')
  })
})
```

- [ ] **Step 2: Run — fail**

```bash
cd ExamLab && npx vitest run src/__tests__/helpers/frageStorageMocks.test.ts
# Erwartung: FAIL — module not found
```

- [ ] **Step 3: Implementation**

```ts
// frageStorageMocks.ts
import type { Frage } from '../../types/fragen-storage'
import { mockCoreFrage } from '@shared/test-helpers/frageCoreMocks'

/**
 * Storage-Variante des Mock-Helpers. Delegiert an `mockCoreFrage` und liefert
 * eine Storage-Frage (strukturell kompatibel — Storage's `tags: (string | Tag)[]`
 * akzeptiert leere Arrays von Core's `string[]`).
 *
 * Verwendung: Tests in `ExamLab/src/`. Tests in `packages/shared/` nutzen
 * direkt `mockCoreFrage`.
 */
export function mockFrage<T extends Frage['typ']>(
  typ: T,
  overrides?: Partial<Extract<Frage, { typ: T }>>
): Extract<Frage, { typ: T }> {
  // Core liefert mit tags: string[]. Storage akzeptiert (string | Tag)[]
  // strukturell — leeres Array ist zuweisbar. Sub-Type-Felder sind identisch.
  const core = mockCoreFrage(typ, overrides as never)
  return core as unknown as Extract<Frage, { typ: T }>
}
```

- [ ] **Step 4: Run — pass + tsc**

```bash
npx vitest run src/__tests__/helpers/frageStorageMocks.test.ts
# Erwartung: 3/3 PASS
npx tsc -b
# Erwartung: 0 Fehler
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/__tests__/helpers/
git commit -m "Bundle L.a: mockFrage Storage-Helper (delegiert an mockCoreFrage)"
```

---

### Task L.a.5: pflichtfeldValidation Sub-Funktionen typisieren

**Files:**
- Modify: `packages/shared/src/editor/pflichtfeldValidation.ts`

**Strategie:** Alle 20 Sub-Funktionen (`validiereMC`, `validiereRichtigFalsch`, ..., `validiereAufgabengruppe`) bekommen statt `frage: any` einen konkreten Sub-Type. Dann fallen die `as any` im Switch-Body automatisch.

- [ ] **Step 1: Imports erweitern**

```ts
// Top of file — ersetze:
import type { Frage } from '../types/fragen-core'

// durch:
import type {
  Frage,
  MCFrage, RichtigFalschFrage, LueckentextFrage, SortierungFrage,
  ZuordnungFrage, BildbeschriftungFrage, DragDropBildFrage, HotspotFrage,
  FreitextFrage, BerechnungFrage, BuchungssatzFrage, TKontoFrage,
  KontenbestimmungFrage, BilanzERFrage, VisualisierungFrage, PDFFrage,
  CodeFrage, FormelFrage, AufgabengruppeFrage,
} from '../types/fragen-core'
```

- [ ] **Step 2: Sub-Funktion-Signaturen ändern**

Für jede der 19 Sub-Funktionen (alle außer `validierePflichtfelder` selbst): `frage: any` → konkreter Sub-Type.

Beispiel für `validiereRichtigFalsch`:
```ts
// Vorher (Z. 86)
function validiereRichtigFalsch(frage: any): ValidationResult {

// Nachher
function validiereRichtigFalsch(frage: RichtigFalschFrage): ValidationResult {
```

Mapping:
- `validiereMC` → `MCFrage`
- `validiereRichtigFalsch` → `RichtigFalschFrage`
- `validiereLueckentext` → `LueckentextFrage`
- `validiereSortierung` → `SortierungFrage`
- `validiereZuordnung` → `ZuordnungFrage`
- `validiereBildbeschriftung` → `BildbeschriftungFrage`
- `validiereDragDropBild` → `DragDropBildFrage`
- `validiereHotspot` → `HotspotFrage`
- `validiereFreitext` → `FreitextFrage`
- `validiereBerechnung` → `BerechnungFrage`
- `validiereBuchungssatz` → `BuchungssatzFrage`
- `validiereTKonto` → `TKontoFrage`
- `validiereKontenbestimmung` → `KontenbestimmungFrage`
- `validiereBilanzstruktur` → `BilanzERFrage`
- `validiereVisualisierung` → `VisualisierungFrage`
- `validierePDF` → `PDFFrage`
- `validiereCode` → `CodeFrage`
- `validiereFormel` → `FormelFrage`
- `validiereAufgabengruppe` → `AufgabengruppeFrage` (zweiter Parameter `ebene` bleibt)

- [ ] **Step 3: Innerhalb Sub-Funktionen — `frage.<feld> as any`-Aufrufe entfernen**

Wenn nach Schritt 2 noch Casts in Sub-Funktion-Bodies sind (z.B. `(a: any)` in Array-Maps), prüfen ob konkrete Element-Types verfügbar sind:
```ts
// Vorher
const mitText = aussagen.filter((a: any) => strNonEmpty(a?.text))

// Nachher (RichtigFalschFrage's aussagen-Element-Type ist bekannt)
const mitText = aussagen.filter(a => strNonEmpty(a?.text))
```

Falls Element-Type wegen `Array.isArray(...)`-Pattern verloren geht, Type-Guard nachhelfen:
```ts
const aussagen: RichtigFalschFrage['aussagen'] = Array.isArray(frage.aussagen) ? frage.aussagen : []
```

- [ ] **Step 4: tsc + bestehende Tests**

```bash
cd ExamLab && npx tsc -b
# Erwartung: 0 Fehler

npx vitest run ../packages/shared/src/editor/pflichtfeldValidation.test.ts
# Erwartung: alle Tests grün (Tests sind noch as any — wir refactorn die in L.a.7)
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/editor/pflichtfeldValidation.ts
git commit -m "Bundle L.a: pflichtfeldValidation Sub-Funktionen typisiert (any → Sub-Type)"
```

---

### Task L.a.6: pflichtfeldValidation Switch-Casts entfernen

**Files:**
- Modify: `packages/shared/src/editor/pflichtfeldValidation.ts:30-84`

- [ ] **Step 1: Switch-Body anpassen**

```ts
// Vorher (Z. 30-84, 22 as any-Stellen)
export function validierePflichtfelder(frage: Frage | null | undefined): ValidationResult {
  if (!frage || typeof frage !== 'object') return DEFAULT_OK
  try {
    switch ((frage as any).typ) {
      case 'mc':
        return validiereMC(frage as any)
      ...
      default:
        console.warn(`[pflichtfeldValidation] Unbekannter typ: ${(frage as any).typ}`)
        return DEFAULT_KONSERVATIV
    }
  } catch (err) { ... }
}

// Nachher
export function validierePflichtfelder(frage: Frage | null | undefined): ValidationResult {
  if (!frage || typeof frage !== 'object') return DEFAULT_OK
  try {
    switch (frage.typ) {
      case 'mc': return validiereMC(frage)
      case 'richtigfalsch': return validiereRichtigFalsch(frage)
      case 'lueckentext': return validiereLueckentext(frage)
      case 'sortierung': return validiereSortierung(frage)
      case 'zuordnung': return validiereZuordnung(frage)
      case 'bildbeschriftung': return validiereBildbeschriftung(frage)
      case 'dragdrop_bild': return validiereDragDropBild(frage)
      case 'hotspot': return validiereHotspot(frage)
      case 'freitext': return validiereFreitext(frage)
      case 'berechnung': return validiereBerechnung(frage)
      case 'buchungssatz': return validiereBuchungssatz(frage)
      case 'tkonto': return validiereTKonto(frage)
      case 'kontenbestimmung': return validiereKontenbestimmung(frage)
      case 'bilanzstruktur': return validiereBilanzstruktur(frage)
      case 'visualisierung':
        return validiereVisualisierung(frage)
      case 'pdf': return validierePDF(frage)
      case 'code': return validiereCode(frage)
      case 'formel': return validiereFormel(frage)
      case 'aufgabengruppe': return validiereAufgabengruppe(frage)
      case 'audio': return DEFAULT_OK
      default: {
        // 'zeichnen' war Legacy-Variante von 'visualisierung' — TypeScript fängt
        // den Case nicht in der Frage-Union ab; default deckt unbekannte Strings.
        const unbekannterTyp = (frage as { typ?: unknown }).typ
        console.warn(`[pflichtfeldValidation] Unbekannter typ: ${String(unbekannterTyp)}`)
        return DEFAULT_KONSERVATIV
      }
    }
  } catch (err) {
    console.error('[pflichtfeldValidation] crash:', err)
    return DEFAULT_OK
  }
}
```

**Anmerkung:** Der `'zeichnen'`-Case (Z. 64) war ein Legacy-Typ, der nicht in der `Frage`-Union ist. Wir entfernen ihn aus dem Switch und fangen ihn im `default`-Branch über die `console.warn` ab. Falls Daten mit `typ: 'zeichnen'` im Repository existieren, würden sie jetzt als „unbekannt" geloggt — das ist gewünscht, weil `zeichnen` kein gültiger Frage-Typ mehr ist.

- [ ] **Step 2: tsc + Tests**

```bash
npx tsc -b
# Erwartung: 0 Fehler — Discriminator-Narrowing funktioniert
npx vitest run ../packages/shared/src/editor/pflichtfeldValidation.test.ts
# Erwartung: Tests grün
```

- [ ] **Step 3: Audit**

```bash
grep -c "as any" packages/shared/src/editor/pflichtfeldValidation.ts
# Erwartung: 0
```

Hinweis: Der `(frage as { typ?: unknown }).typ`-Cast im default-Branch ist KEIN `as any` (sondern `as { typ?: unknown }`) und wird vom grep nicht erfasst.

Falls noch echte `as any` übrig: prüfen welche Sub-Funktion sie braucht, und ob die Funktion-Signatur weiter typisiert werden kann.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/editor/pflichtfeldValidation.ts
git commit -m "Bundle L.a: pflichtfeldValidation Switch-Casts entfernt (24 → 0 as any)"
```

---

### Task L.a.7: pflichtfeldValidation.test.ts auf mockCoreFrage migrieren

**Files:**
- Modify: `packages/shared/src/editor/pflichtfeldValidation.test.ts`

**Scope:** 79 `as any`-Stellen. Pattern-Sweep:
1. **Inline-Frage-Literale** (`{ id: 'x', typ: 'mc', ... } as any`) → `mockCoreFrage('mc', { ...overrides })`
2. **Defensive `null`/`undefined`/`{}` calls** (`validierePflichtfelder(null as any)`) → `validierePflichtfelder(null as unknown as Frage /* Defensive: ... */)`
3. **Field-Override-Kaputtmacher** (`optionen: null` als bewusst-falscher-Wert, der trotz Type strict bleibt) → `mockCoreFrage('mc', { optionen: null as unknown as MCOption[] /* Defensive: ... */ })`

- [ ] **Step 1: Import-Header ändern**

```ts
// Top of file — füge hinzu:
import { mockCoreFrage } from '../test-helpers/frageCoreMocks'
import type { Frage, MCFrage, MCOption /* + weitere */ } from '../types/fragen-core'
```

- [ ] **Step 2: Pattern-1 (Inline-Literale) systematisch ersetzen**

Pro Test-Block: jedes `{ id: 'x', typ: 'X', ... } as any` zu `mockCoreFrage('X', {...overrides})` umbauen. Beispiel:

```ts
// Vorher
const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q' } as any)

// Nachher
const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: 'q' }))
```

Bei Tests mit inkompletten Frage-Objekten (kein `optionen`-Array): Helper liefert leeres `[]` als Default, Test verhalten ändert sich nicht.

- [ ] **Step 3: Pattern-2 (Defensive ganz-Objekt-Casts)**

```ts
// Vorher
expect(validierePflichtfelder(null as any).pflichtErfuellt).toBe(true)
expect(validierePflichtfelder(undefined as any).pflichtErfuellt).toBe(true)
expect(() => validierePflichtfelder(undefined as any)).not.toThrow()
expect(() => validierePflichtfelder({} as any)).not.toThrow()

// Nachher
expect(validierePflichtfelder(null as unknown as Frage /* Defensive: null-input */).pflichtErfuellt).toBe(true)
expect(validierePflichtfelder(undefined as unknown as Frage /* Defensive: undefined-input */).pflichtErfuellt).toBe(true)
expect(() => validierePflichtfelder(undefined as unknown as Frage /* Defensive: */)).not.toThrow()
expect(() => validierePflichtfelder({} as unknown as Frage /* Defensive: leeres Objekt */)).not.toThrow()
```

- [ ] **Step 4: Pattern-3 (Field-Override-Kaputtmacher)**

```ts
// Vorher
const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q', optionen: null } as any)

// Nachher
const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: 'q', optionen: null as unknown as MCOption[] /* Defensive: bewusst null */ }))
```

- [ ] **Step 5: Run Tests + tsc**

```bash
npx vitest run ../packages/shared/src/editor/pflichtfeldValidation.test.ts
# Erwartung: alle Tests grün
npx tsc -b
# Erwartung: 0 Fehler
```

- [ ] **Step 6: Audit**

```bash
grep -c "as any" packages/shared/src/editor/pflichtfeldValidation.test.ts
# Erwartung: 0

# Defensive sollten jetzt sichtbar sein
grep -c "Defensive" packages/shared/src/editor/pflichtfeldValidation.test.ts
# Erwartung: ~10-15 (alle Pattern-2 + Pattern-3)
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/editor/pflichtfeldValidation.test.ts
git commit -m "Bundle L.a: pflichtfeldValidation.test auf mockCoreFrage + Defensive-Marker (79 → 0 as any)"
```

---

### Task L.a.8: Audit-Skript-Run + Verifikation

**Files:** keine (nur Verifikation)

- [ ] **Step 1: Audit**

```bash
./scripts/audit-as-any.sh
# Erwartung:
# Total: ~111 (= 214 - 103)
# Defensive: ~10-15 (Pattern-2/3-Stellen aus L.a.7)
# Undokumentiert: ~100 (= L.b + L.c noch offen)
```

- [ ] **Step 2: tsc -b**

```bash
cd ExamLab && npx tsc -b
# Erwartung: 0 Fehler
```

- [ ] **Step 3: Vollständiger vitest-Run**

```bash
npx vitest run
# Erwartung: 1098+N grün (N = Helper-Tests, ~13 neue)
```

- [ ] **Step 4: Build**

```bash
npm run build
# Erwartung: clean, keine Warnings außer dem bekannten chunk-size-Warning
```

---

### Task L.a.9: Browser-E2E auf staging mit echten Logins

**Voraussetzung:** Phase L.a-Branch nach `origin/preview` force-pushed (siehe Lehre `feedback_preview_forcepush.md`).

- [ ] **Step 1: Preview-Push**

```bash
# Vor force-push: prüfen ob preview Work-in-Progress hat
git log preview ^refactor/bundle-l-a-mock-helper-pflichtfeld --oneline
# Wenn leer: safe zu force-pushen
git push origin refactor/bundle-l-a-mock-helper-pflichtfeld:preview --force
```

- [ ] **Step 2: User-Tab-Gruppe vorbereiten**

User loggt in zwei Tabs ein:
- Tab 1: LP = `wr.test@gymhofwil.ch`
- Tab 2: SuS = `wr.test@stud.gymhofwil.ch`

Claude erstellt Tab-Gruppe via `tabs_context_mcp` mit `createIfEmpty: true`, wartet auf User-„kannst loslegen"-Bestätigung.

- [ ] **Step 3: Test-Plan im Chat dokumentieren**

```
## Test-Plan: Bundle L.a — Pflichtfeld-Outline
### Zu testende Sub-Types
| # | Sub-Type | Erwartetes Verhalten |
|---|----------|----------------------|
| 1 | mc | Violett-Outline auf leerem fragetext, optionen, korrekt-Markierung |
| 2 | richtigfalsch | Violett-Outline auf aussagen wenn <2 mit text |
| 3 | lueckentext | Violett-Outline auf leerem Lücken-Array |
| 4 | sortierung | Violett-Outline auf < 2 Elementen |
| 5 | zuordnung | Violett-Outline auf < 2 Paaren |
| 6 | bildbeschriftung | Violett-Outline auf bildUrl + leerem labels |
| 7 | dragdrop_bild | Violett-Outline auf bildUrl + leeren zonen/labels |
### Security-Check
- [ ] LP-Editor lädt Frage aus Fragensammlung — kein 4xx
- [ ] tsc-changes haben keine Render-Regression
### Betroffene kritische Pfade
- [ ] LP-Editor mit jeder der 7 Sub-Types öffnen
```

- [ ] **Step 4: Test ausführen**

Claude testet pro Sub-Type:
1. LP-Editor öffnen, leere Frage anlegen oder bestehende öffnen
2. Pflichtfeld-Outline-Verhalten prüfen (violett bei leeren Feldern, weg bei gefüllten)
3. Frage speichern, prev/next-Navigation prüfen (wegen S129-Lehre)

Bei Abweichung: pflichtfeldValidation.ts diagnostizieren (vermutlich Default-Wert in `mockCoreFrage` zu lax oder Sub-Funktion-Cast hat sich an Logik ausgewirkt).

- [ ] **Step 5: Test-Ergebnis dokumentieren**

```
## Test-Ergebnis L.a (Browser-E2E)
- ✅ MC: Violett-Outline korrekt
- ...
- (Pro Sub-Type ein Eintrag)
```

---

### Task L.a.10: HANDOFF + Code-Review + Merge

- [ ] **Step 1: HANDOFF.md aktualisieren**

In `ExamLab/HANDOFF.md` einen neuen Block oben einfügen:

```markdown
### Bundle L.a — Mock-Helper + pflichtfeldValidation-Pilot ✅ MERGED

**Merge:** `<commit>` auf `main` (29.04.2026 / Datum). 1098+13 vitest, tsc + build clean.

**Geliefert:**
- `packages/shared/src/test-helpers/frageCoreMocks.ts` (neu, 20 Sub-Type-Defaults)
- `ExamLab/src/__tests__/helpers/frageStorageMocks.ts` (neu, delegiert)
- `scripts/audit-as-any.sh` (neu, 1-Zeilen-Defensive-Scan)
- `pflichtfeldValidation.ts`: 24 → 0 as any (Sub-Funktion-Signaturen + Switch-Narrowing)
- `pflichtfeldValidation.test.ts`: 79 → 0 as any (~12 Defensive-Marker)

**Audit-Stand:** 214 → 111 (Repo-weit). L.b + L.c noch offen.

**Browser-E2E:** 7 Editor-Sub-Types Pflichtfeld-Outline auf staging mit echten Logins verifiziert.
```

- [ ] **Step 2: code-reviewer-Skill dispatchen**

```
Use Agent tool with subagent_type=superpowers:code-reviewer
Prompt: "Bundle L.a — Mock-Helper + pflichtfeldValidation-Pilot. Review against:
- Spec: docs/superpowers/specs/2026-04-29-bundle-l-as-any-cleanup-design.md
- Plan: docs/superpowers/plans/2026-04-29-bundle-l-as-any-cleanup.md (Phase L.a, Tasks L.a.0-L.a.10)
- Lehren: code-quality.md, regression-prevention.md
Branch: refactor/bundle-l-a-mock-helper-pflichtfeld"
```

- [ ] **Step 3: Findings adressieren** (Loop max 3x bis approved)

- [ ] **Step 4: Commit + Merge auf main**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle L.a: HANDOFF aktualisiert"

git checkout main
git merge --no-ff refactor/bundle-l-a-mock-helper-pflichtfeld -m "Merge Bundle L.a — Mock-Helper + pflichtfeldValidation"
git push
git branch -d refactor/bundle-l-a-mock-helper-pflichtfeld
git push origin --delete refactor/bundle-l-a-mock-helper-pflichtfeld 2>/dev/null || true
```

---

## Phase L.b — poolConverter

**Branch:** `refactor/bundle-l-b-pool-converter`
**Scope:** 26 `as any`-Stellen
**Sessions:** 1

### Task L.b.0: Branch + Pool-Frage-Type-Strategie entscheiden

**Files:** keine (nur Setup + Mini-Brainstorm)

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull
git checkout -b refactor/bundle-l-b-pool-converter
```

- [ ] **Step 2: poolConverter-Funktion-Analyse**

```bash
# Welche Felder werden auf welche Sub-Types zugegriffen?
grep -E "(pf as any)\.\w+" ExamLab/src/utils/poolConverter.ts | sort -u
```

Notiere die Pattern. Beispielausschnitt aus aktuellem Code:
- `(pf as any).correct` (auf MC-artige)
- `(pf as any).geschaeftsfaelle` (auf Buchungssatz/Kontenbestimmung)
- `(pf as any).aufgaben`
- `(pf as any).kontenMitSaldi` (auf Bilanz)
- `(pf as any).teil`

- [ ] **Step 3: Strategie wählen** (Mini-Brainstorm — User-Konsultation)

Drei Optionen aus Spec:
- **(a) PoolFrage-Discriminated-Union** in `packages/shared/src/types/pool-frage.ts`
- **(b) Per-Sub-Type Type-Guards** (`isPoolFrageMC` etc.)
- **(c) Schema-Validator (zod) am Pool-Eingangspunkt**

**Empfehlung:** (a) wenn die Pool-Frage-Struktur klar diskriminiert ist (`typ`-Discriminator wie bei Storage-Frage). (b) wenn Pool-Format heterogen / driftiger ist. (c) overkill für diesen Scope.

User-Frage am Anfang von L.b: „Pool-Format ist (laut Audit) {a/b/c} — welche Strategie passt?". Danach Entscheidung dokumentieren.

- [ ] **Step 4: Commit Setup-Notiz**

(Ggf. ein leerer Commit oder Notiz im PR-Body.)

---

### Task L.b.1: PoolFrage-Type definieren (Strategie a) ODER Type-Guards (Strategie b)

**Files (bei Strategie a):**
- Create: `packages/shared/src/types/pool-frage.ts`
- Tests: `packages/shared/src/types/pool-frage.test.ts`

**Files (bei Strategie b):**
- Create: `ExamLab/src/utils/pool/typGuards.ts`
- Tests: `ExamLab/src/utils/pool/typGuards.test.ts`

- [ ] **Step 1: Failing Tests schreiben (Beispiel Strategie a)**

```ts
// pool-frage.test.ts (bei Strategie a)
import { describe, it, expectTypeOf } from 'vitest'
import type { PoolFrage, PoolFrageMC } from './pool-frage'

describe('PoolFrage discriminated union', () => {
  it('PoolFrageMC ist Sub-Type von PoolFrage', () => {
    const mc: PoolFrageMC = { typ: 'mc', correct: ['a'], optionen: [] }
    const p: PoolFrage = mc
    expect(p.typ).toBe('mc')
  })
  // ...
})
```

- [ ] **Step 2: Type-Definition implementieren**

```ts
// pool-frage.ts (bei Strategie a)
export interface PoolFrageBase {
  id: string
  fragetext: string
  punkte?: number
}

export interface PoolFrageMC extends PoolFrageBase {
  typ: 'mc'
  correct?: string[]
  optionen: { id: string; text: string }[]
}

// ... weitere Sub-Types analog ...

export type PoolFrage = PoolFrageMC | PoolFrageRF | /* ... */
```

Felder werden aus Pool-Format-Audit (Step 2 von L.b.0) extrahiert.

- [ ] **Step 3: tsc + Tests**

```bash
npx tsc -b
npx vitest run ../packages/shared/src/types/pool-frage.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/pool-frage*
git commit -m "Bundle L.b: PoolFrage Discriminated Union Type"
```

---

### Task L.b.2: poolConverter.ts auf neuen Type migrieren

**Files:**
- Modify: `ExamLab/src/utils/poolConverter.ts`

- [ ] **Step 1: Import**

```ts
import type { PoolFrage } from '@shared/types/pool-frage'
// oder bei Strategie b:
import { isPoolFrageMC, isPoolFrageRF, /* ... */ } from './pool/typGuards'
```

- [ ] **Step 2: Funktion-Signaturen anpassen**

Funktionen wie `poolPunkte(pf: any): number` → `poolPunkte(pf: PoolFrage): number`.

- [ ] **Step 3: Body-Casts entfernen**

```ts
// Vorher
case 'mc':
  return ((pf as any).correct?.length ?? 1) * 2

// Nachher (bei a)
case 'mc':
  return (pf.correct?.length ?? 1) * 2
```

- [ ] **Step 4: Run Tests**

```bash
npx vitest run src/utils/poolConverter.test.ts
# Erwartung: alle Tests grün (Tests sind noch as any — wird in L.b.3 refactored)
```

- [ ] **Step 5: Audit**

```bash
grep -c "as any" ExamLab/src/utils/poolConverter.ts
# Erwartung: 0
```

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/utils/poolConverter.ts
git commit -m "Bundle L.b: poolConverter Production auf PoolFrage-Type (19 → 0 as any)"
```

---

### Task L.b.3: poolConverter.test.ts migrieren

**Files:**
- Modify: `ExamLab/src/utils/poolConverter.test.ts`

- [ ] **Step 1: Test-Mocks auf typed-Pool-Frage**

```ts
// Vorher
const f = { typ: 'mc', correct: ['a'] } as any

// Nachher (Strategie a)
const f: PoolFrage = { id: 't', fragetext: '', typ: 'mc', correct: ['a'], optionen: [] }
```

Bei Strategie b: weiterhin Type-Guard im Test verwenden.

- [ ] **Step 2: tsc + Tests**

```bash
npx tsc -b
npx vitest run src/utils/poolConverter.test.ts
# Erwartung: alle Tests grün
```

- [ ] **Step 3: Audit**

```bash
grep -c "as any" ExamLab/src/utils/poolConverter.test.ts
# Erwartung: 0
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/utils/poolConverter.test.ts
git commit -m "Bundle L.b: poolConverter.test auf typed PoolFrage (7 → 0 as any)"
```

---

### Task L.b.4: Verifikation + HANDOFF + Code-Review + Merge

- [ ] **Step 1: Audit**

```bash
./scripts/audit-as-any.sh
# Erwartung:
# Total: ~85 (= 111 - 26)
# Undokumentiert: ~75
```

- [ ] **Step 2: tsc + vitest + build**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
# Erwartung: alles grün
```

- [ ] **Step 3: HANDOFF + code-reviewer + Merge analog L.a.10**

```bash
git checkout main && git merge --no-ff refactor/bundle-l-b-pool-converter -m "Merge Bundle L.b — poolConverter"
git push
```

---

## Phase L.c — Restliche Production + Tests + CI-Gate

**Branch:** `refactor/bundle-l-c-rest`
**Scope:** ~85 `as any`-Stellen verstreut + CI-Integration
**Sessions:** 1

### Task L.c.0: Branch + Audit-Liste neu ziehen

**Files:** keine

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull
git checkout -b refactor/bundle-l-c-rest
```

- [ ] **Step 2: Audit-Liste**

```bash
grep -rcn "as any" ExamLab/src/ packages/shared/src/ 2>/dev/null | grep -v ":0$" | sort -t: -k2 -rn
```

Erwartete Liste (Stand vor L.a, kann sich durch L.a/L.b verschoben haben):

**Production:**
- `ExamLab/src/utils/ueben/fragetypNormalizer.ts` (6)
- `ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx` (6)
- `ExamLab/src/store/fragenbankStore.ts` (3)
- `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx` (2)
- `packages/shared/src/editor/typen/HotspotEditor.tsx` (1)
- `packages/shared/src/editor/typen/DragDropBildEditor.tsx` (1)
- `ExamLab/src/components/ueben/UebungsScreen.tsx` (1)
- `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` (1)
- `ExamLab/src/components/FrageRenderer.tsx` (1)

**Tests:**
- `packages/shared/src/editor/buildFragePreview.test.ts` (22)
- `ExamLab/src/utils/ueben/korrektur.test.ts` (15)
- `ExamLab/src/utils/ueben/fragetypNormalizer.test.ts` (3)
- `ExamLab/src/__tests__/media/MediaUpload.test.tsx` (2)
- 11 Tests (je 1 Stelle): siehe Audit-Output

Gesamt erwartet: ~85.

- [ ] **Step 3: Notiz im PR-Body / Plan-Update**

Falls die Liste signifikant abweicht (z.B. L.a/L.b haben Stellen entfernt die wir hier zählten), Liste in PR-Description aktualisieren.

---

### Task L.c.1-L.c.9: Pro-Datei mechanischer Sweep (Production)

**Strategie pro Datei:** Lesen → Pattern erkennen → eine der 5 Klassen anwenden → tsc/vitest grün → commit.

Jede Datei = ein eigener Task mit demselben Schema. Hier nur ein **Template** mit Beispiel — gleiches Schema für jede der 9 Production-Dateien.

#### Template Task L.c.X: <Datei>

**Files:** Modify: `<Pfad>`

- [ ] **Step 1: Lesen + Pattern-Klassifikation**

```bash
grep -n "as any" <Pfad>
```

Pro Stelle: welche der 5 Klassen aus Spec?
- Klasse 1 (Discriminator-Switch): refactor wie L.a Tasks 5+6
- Klasse 2 (Untyped-Field-Access): Type-Guard oder konkreter Type
- Klasse 3 (Type-Bypass): Prop-Type weiten / `satisfies`
- Klasse 4 (Test-Mock): Mock-Helper
- Klasse 5 (Defensive): Inline-Marker

- [ ] **Step 2: Refactor**

(Konkreter Code-Patch entsprechend Klasse.)

- [ ] **Step 3: Verifikation**

```bash
npx tsc -b && npx vitest run -- <relativer-Test-Pfad>
```

- [ ] **Step 4: Commit**

```bash
git add <Pfad>
git commit -m "Bundle L.c: <Datei> as-any-Cleanup (N → 0)"
```

#### Beispiel Task L.c.1: fragetypNormalizer.ts

**Files:** Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.ts`

Stand: 6 `as any`-Stellen, defensive Field-Access auf normalisierte Frage-Daten + 3 Discriminator-Switches.

- [ ] **Step 1: Pattern-Audit**

Z. 39, 41, 43: `normalisiereRichtigFalsch(frage as any) as Frage` → Klasse 1
Z. 236, 237, 240: `Array.isArray((b as any).punkte) && (b as any).punkte.every(...)` → Klasse 2 (untyped Hotspot-Bereich-Element)

- [ ] **Step 2: Klasse-1-Refactor (Z. 39-43)**

Sub-Funktionen `normalisiereRichtigFalsch`, `normalisiereSortierung`, `normalisiereZuordnung` auf konkrete Sub-Types typisieren. Aufrufer braucht dann keinen Cast.

- [ ] **Step 3: Klasse-2-Refactor (Z. 236-240)**

Type-Guard für Polygon-Punkt-Array:
```ts
function isPunktArray(x: unknown): x is { x: number; y: number }[] {
  return Array.isArray(x) && x.every(p => typeof p?.x === 'number' && typeof p?.y === 'number')
}
// im Body:
punkte: isPunktArray(b.punkte) ? b.punkte.map(p => ({ x: normalisiereKoordinate(p.x), y: normalisiereKoordinate(p.y) })) : []
```

- [ ] **Step 4: tsc + Tests**

- [ ] **Step 5: Commit**

```bash
git commit -m "Bundle L.c: fragetypNormalizer.ts (6 → 0 as any)"
```

**Analog für die übrigen 8 Production-Dateien** — jede in eigenem Task mit eigenem Commit. Bei `PruefungFragenEditor.tsx` (6 Stellen): genauer prüfen — `performance={performance as any}` und `f as any as Frage` sind Klasse 3 (Prop-Type weiten oder Editor-Prop-API verbessern). Wenn Refactor-Kosten zu hoch (Prop-Mismatch in 5+ Komponenten), Defensive-Marker als Notlösung.

---

### Task L.c.10-L.c.18: Pro-Datei Tests-Sweep

Analog wie L.c.1-L.c.9, aber für Test-Dateien. Pattern-Sweep meistens Klasse 4 (Mock-Helper).

**Test-Dateien:**
- `packages/shared/src/editor/buildFragePreview.test.ts` (22) — größte Test-Datei, kann eigene Task sein
- `ExamLab/src/utils/ueben/korrektur.test.ts` (15)
- `ExamLab/src/utils/ueben/fragetypNormalizer.test.ts` (3)
- `ExamLab/src/__tests__/media/MediaUpload.test.tsx` (2)
- 11 weitere Test-Dateien (je 1 Stelle) — können in einem Sammel-Task abgehandelt werden

**Anmerkung zu Klasse-5-Häufigkeit in Tests:** Defensive-Tests (`null/undefined`-Calls) sind in Test-Dateien häufig. Pro Datei ggf. 1-3 Defensive-Marker erwartbar. Der `// Defensive: …`-Inline-Kommentar ist Pflicht, sonst FAIL im Audit.

#### Beispiel Task L.c.10: buildFragePreview.test.ts

- [ ] **Step 1: Pattern-Audit (22 Stellen)**

```bash
grep -n "as any" packages/shared/src/editor/buildFragePreview.test.ts
```

Erwartung: alle 22 sind Klasse 4 (`buildFragePreview({ ... }) as any`-am-Test-Ende).

- [ ] **Step 2: Sweep**

```ts
// Vorher
const result = buildFragePreview({
  id: 'x', typ: 'mc', /* ... */
}) as any

// Nachher
const result = buildFragePreview(mockCoreFrage('mc', { /* overrides */ }))
```

- [ ] **Step 3: tsc + vitest**

- [ ] **Step 4: Commit**

```bash
git commit -m "Bundle L.c: buildFragePreview.test (22 → 0 as any)"
```

---

### Task L.c.19: CI-Gate aktivieren

**Files:**
- Modify: `package.json` (im Repo-Root)
- Modify: `.github/workflows/<ci-file>.yml` (falls vorhanden — sonst Skript-Verweis in README)

- [ ] **Step 1: Repo-Root package.json**

```bash
# Aktuell prüfen
cat package.json | grep -A 5 '"scripts"'
```

```json
// In package.json scripts ergänzen:
"lint:as-any": "./scripts/audit-as-any.sh --strict"
```

- [ ] **Step 2: Optional CI-Integration**

Falls `.github/workflows/test.yml` o.ä. existiert: `npm run lint:as-any`-Step ergänzen.

- [ ] **Step 3: Run lokal**

```bash
npm run lint:as-any
# Erwartung: exit 0, Total = nur Defensive
```

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/
git commit -m "Bundle L.c: CI-Gate für as-any-Audit (--strict)"
```

---

### Task L.c.20: code-quality.md aktualisieren

**Files:**
- Modify: `.claude/rules/code-quality.md`

- [ ] **Step 1: Stale-Note ersetzen**

```bash
grep -n "aktuell 58 Stellen" .claude/rules/code-quality.md
```

```markdown
# Vorher (Z. ~13)
- Kein neues `as any` einführen (aktuell 58 Stellen — nicht erhöhen)

# Nachher
- Kein neues `as any` einführen. CI-Gate (`scripts/audit-as-any.sh --strict`) lehnt undokumentierte Stellen ab. Defensive-Tests mit Inline-Marker `/* Defensive: ... */` sind erlaubt.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/code-quality.md
git commit -m "Bundle L.c: code-quality.md as-any-Eintrag aktualisiert (CI-Gate statt Schwelle)"
```

---

### Task L.c.21: Final-Verifikation + HANDOFF + Code-Review + Merge

- [ ] **Step 1: Audit final**

```bash
./scripts/audit-as-any.sh --strict
# Erwartung: exit 0, Total = nur Defensive (~30-40)
```

- [ ] **Step 2: Full vitest + tsc + build**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
# Erwartung: alles grün
```

- [ ] **Step 3: HANDOFF.md final-Block**

```markdown
### Bundle L — `as any`-Cleanup KOMPLETT ✅ MERGED

**Merges:** L.a (`<commit>`) + L.b (`<commit>`) + L.c (`<commit>`).

**Resultat:** 214 → ~30-40 (nur dokumentierte Defensive-Tests). CI-Gate aktiv.

**Geliefert:**
- Mock-Helper-Infrastruktur (`mockCoreFrage` + `mockFrage`)
- Audit-Skript + CI-Gate (`npm run lint:as-any`)
- Pflichtfeld-Validation, Pool-Converter, Fragetyp-Normalizer + 8 weitere Production-Files type-clean
- 16+ Test-Dateien auf Helper migriert
- code-quality.md auf CI-Gate-Hinweis aktualisiert

**Lehren:** [werden während Implementation gesammelt — siehe code-quality.md Updates]
```

- [ ] **Step 4: code-reviewer-Skill für Phase L.c**

```
Use Agent tool with subagent_type=superpowers:code-reviewer
Prompt: "Bundle L.c — Restliche Production + Tests + CI-Gate. Review against:
- Spec: docs/superpowers/specs/2026-04-29-bundle-l-as-any-cleanup-design.md
- Plan: docs/superpowers/plans/2026-04-29-bundle-l-as-any-cleanup.md (Phase L.c, Tasks L.c.0-L.c.21)
Branch: refactor/bundle-l-c-rest"
```

- [ ] **Step 5: Findings adressieren**

- [ ] **Step 6: Merge auf main**

```bash
git checkout main && git merge --no-ff refactor/bundle-l-c-rest -m "Merge Bundle L.c — Rest + CI-Gate (Bundle L komplett)"
git push
git branch -d refactor/bundle-l-c-rest
```

---

## Bundle L Done-Definition

- [ ] 0 undokumentierte `as any` repo-weit (CI-Gate `npm run lint:as-any` exit 0)
- [ ] Defensive-Tests mit Form `as unknown as <Type>` + `/* Defensive: ... */`-Inline-Kommentar
- [ ] Mock-Helper-API in shared + ExamLab etabliert + dokumentiert
- [ ] CI-Gate aktiv (verhindert künftige Regression)
- [ ] HANDOFF.md aktualisiert nach jedem Phase-Merge
- [ ] code-quality.md Stale-Note ersetzt
- [ ] 1098+13 vitest grün, tsc -b clean, build clean

---

## Risiko-Mitigationen (aus Spec)

- **R1 Helper-API skaliert nicht** → Pilot in L.a deckt 7 Sub-Types ab; bei komplexen Sub-Types Test-Caller explizit überschreiben
- **R2 Discriminator-Narrowing** → Type-Guards (`isFrage`) am Eintrittspunkt
- **R3 Pool-Frage-Type-Strategie** → Mini-Brainstorm in L.b.0
- **R4 Logik-Regression** → Browser-E2E in L.a, vitest in jeder Phase
- **R5 tags-Asymmetrie** → Helper-Trennung Core/Storage in L.a.3+L.a.4
- **R6 Test-Performance** → Helper ist reine Object-Konstruktion, < 1ms pro Aufruf

---

## Out of Scope (aus Spec)

- Strikte Defensive-Test-Type-Sicherheit
- Tests-Refactor Richtung Property-Based / Test-Fixtures
- `apps-script-code.js` (kein TypeScript)
- third-party Type-Definitionen
