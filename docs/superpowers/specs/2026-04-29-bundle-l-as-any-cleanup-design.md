# Spec — Bundle L: `as any`-Cleanup

**Datum:** 2026-04-29
**Bundle:** L (Phasen L.a / L.b / L.c)
**Geschätzte Sessions:** 3 (eine pro Phase)
**Backend-Risiko:** keiner — kein Apps-Script-Deploy nötig

---

## Ziel

Eliminierung aller 214 `as any`-Stellen aus dem ExamLab-Repo (`ExamLab/src/` + `packages/shared/src/`) durch:

1. Saubere Type-Parametrisierung (Discriminator-Switches, Frage-Union als Input-Type) für Production-Code.
2. Test-Mock-Helper-Funktion für untyped Test-Daten.
3. Dokumentierte Defensive-Test-Casts (`as unknown as Frage`) für bewusst kaputte Inputs.

**Bezug zu Bundle K-Followup (29.04.2026):** Bundle K hat 23 `Extract<Frage,…>`-Aliase und 16 `frage as XFrage`-Casts in der Frage-Type-Hierarchie eliminiert. Bundle L erweitert das auf alle übrigen `as any`-Stellen — diese sind eine andere Klasse (Discriminator-Casts, Defensive-Field-Access, Mock-Daten), aber dieselbe Wurzel: untypisierte Surface, die Refactor-Sicherheit blockiert.

**Drei systematische Probleme, die gelöst werden:**

1. **Refactor-Risiko:** `as any` ist unsichtbar für den Compiler. Bei Type-Änderungen werden alte Stellen nicht erkannt → Production-Bugs (vgl. S130-Hotfix `postJson<KalibrierungsStatistik>` → `Object.values(undefined)` crashte UI).
2. **Falsche Sicherheit:** Tests sind grün, weil TypeScript nicht prüft. Bug-Klasse versteckt sich.
3. **Kein einheitliches Test-Mock-Pattern:** Aktuell 149 Test-Stellen mit `as any` → kein Vorbild für neue Tests, jede Datei improvisiert.

---

## Architektur

### Datei-Layout

**Neu erstellt:**

```
packages/shared/src/test-helpers/frageCoreMocks.ts         (NEU — Helper für Core-Frage)
ExamLab/src/__tests__/helpers/frageStorageMocks.ts         (NEU — Helper für Storage-Frage, delegiert an Core)
scripts/audit-as-any.sh                                    (NEU — Audit + CI-Gate)
```

**Modifiziert (Phase L.a):**

```
packages/shared/src/editor/pflichtfeldValidation.ts        (24 → 0 as any)
packages/shared/src/editor/pflichtfeldValidation.test.ts   (79 → 0 as any, außer dokumentierte Defensive)
```

**Modifiziert (Phase L.b):**

```
ExamLab/src/utils/poolConverter.ts                         (19 → 0 as any)
ExamLab/src/utils/poolConverter.test.ts                    (7 → 0 as any)
```

**Modifiziert (Phase L.c):**

```
ExamLab/src/utils/ueben/fragetypNormalizer.ts              (6 → 0 as any)
ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx  (6 → 0)
ExamLab/src/store/fragenbankStore.ts                       (3 → 0)
ExamLab/src/components/lp/vorbereitung/composer/VorschauTab.tsx  (2 → 0)
+ 9 weitere Production-Files (je 1 Stelle)
+ 15 Test-Files (~85 Test-Stellen) — siehe Audit-Output Phase L.a-Start
```

### Helper-API

**Core-Helper (`packages/shared/src/test-helpers/frageCoreMocks.ts`):**

```ts
import type { Frage } from '../types/fragen-core'

type FrageTyp = Frage['typ']

/**
 * Erzeugt eine vollständig typisierte Mock-Frage für Tests im Core/Editor-Layer.
 * Defaults sind generisch und deterministisch — Tests setzen nur die test-relevanten
 * Felder via `overrides`.
 *
 * Verwendung in Tests in `packages/shared/src/editor/`. ExamLab-Tests verwenden
 * `mockFrage` aus `ExamLab/src/__tests__/helpers/frageStorageMocks.ts`.
 */
export function mockCoreFrage<T extends FrageTyp>(
  typ: T,
  overrides?: Partial<Extract<Frage, { typ: T }>>
): Extract<Frage, { typ: T }>
```

**Storage-Helper (`ExamLab/src/__tests__/helpers/frageStorageMocks.ts`):**

```ts
import type { Frage } from '../../types/fragen-storage'
import { mockCoreFrage } from '@shared/test-helpers/frageCoreMocks'

/**
 * Storage-Variante des Mock-Helpers. Delegiert an `mockCoreFrage` und ergänzt
 * Storage-spezifische Defaults (kein `_recht`, `tags: []`, `poolVersion`
 * undefined). Tests in ExamLab nutzen diesen Helper.
 */
export function mockFrage<T extends Frage['typ']>(
  typ: T,
  overrides?: Partial<Extract<Frage, { typ: T }>>
): Extract<Frage, { typ: T }>
```

**Default-Werte (gemeinsam für alle Sub-Types in `mockCoreFrage`):**

| Feld | Default | Begründung |
|---|---|---|
| `id` | `'test-frage'` | deterministisch, Override für Identitäts-Tests |
| `version` | `1` | minimal valid |
| `erstelltAm` / `geaendertAm` | `new Date(0).toISOString()` (`'1970-01-01T00:00:00.000Z'`) | deterministisch, kein `Date.now()`-Drift in Tests |
| `fachbereich` | `'BWL'` | beliebig, Tests können überschreiben |
| `fach`, `thema` | `'Test'` | unauffällige Default-Strings |
| `unterthema` | `undefined` | optional |
| `semester`, `gefaesse`, `tags`, `verwendungen` | `[]` | leere Arrays |
| `bloom` | `'K1'` | minimal |
| `punkte` | `1` | minimal valid |
| `musterlosung` | `''` | leerer String |
| `bewertungsraster` | `[]` | leer |

**Sub-Type-spezifische Defaults:**

| Typ | Mindest-Defaults |
|---|---|
| `mc` | `fragetext: 'Test'`, `optionen: []`, `mehrfachauswahl: false` |
| `richtigfalsch` | `fragetext: 'Test'`, `aussagen: []` |
| `lueckentext` | `fragetext: 'Test'`, `luecken: []`, `lueckentextModus: 'freitext'` |
| `freitext` | `fragetext: 'Test'`, `erwarteteLänge: 'kurz'` |
| `zuordnung` | `fragetext: 'Test'`, `paare: []` |
| `berechnung` | `fragetext: 'Test'`, `ergebnisse: []` |
| `sortierung` | `fragetext: 'Test'`, `elemente: []` |
| `hotspot` | `fragetext: 'Test'`, `bildUrl: '/test.svg'`, `hotspots: []` |
| `bildbeschriftung` | `fragetext: 'Test'`, `bildUrl: '/test.svg'`, `marker: []` |
| `dragdrop_bild` | `fragetext: 'Test'`, `bildUrl: '/test.svg'`, `zonen: []`, `labels: []` |
| `buchungssatz` | `geschaeftsfall: 'Test'`, `geschaeftsfaelle: []`, `kontenauswahl: { … minimal … }` |
| `tkonto` | `aufgabentext: 'Test'`, `konten: []` |
| `kontenbestimmung` | `aufgabentext: 'Test'`, `aufgaben: []`, `kontenauswahl: { … }` |
| `bilanzstruktur` | `aufgabentext: 'Test'`, `modus: 'bilanz'`, `loesung: { … }` |
| `aufgabengruppe` | `kontext: 'Test'`, `teilaufgaben: []` |
| `pdf` / `audio` / `code` / `formel` / `visualisierung` | typ-spezifisch, je 2-3 Felder |

**Bei komplexen Sub-Types** (`buchungssatz`, `tkonto`, `kontenbestimmung`, `bilanzstruktur`): wenn ein sinnvoller Default nicht eindeutig ist, dokumentieren wir das in der Helper-Datei und Test-Caller müssen den Default explizit überschreiben.

**Storage-Helper-Defaults zusätzlich:**
- `_recht`: undefined (kein Default — Tests die das brauchen, setzen explizit)
- `poolVersion`: undefined
- `tags: (string | Tag)[]` mit Default `[]` — strukturell zuweisbar an Core's `string[]`-Default

### Audit-Skript

**`scripts/audit-as-any.sh`:**

```bash
#!/usr/bin/env bash
# Audit-Skript für as-any-Stellen. Liefert Counts, kategorisiert in:
# - undokumentiert (FAIL)
# - dokumentierte Defensive-Tests (OK, gezählt aber nicht gefailed)
#
# Aufruf: ./scripts/audit-as-any.sh [--strict]
# Mit --strict: Exit-Code 1 wenn undokumentierte > 0
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Alle as-any-Stellen, ohne node_modules
TOTAL=$(grep -rn "as any" ExamLab/src/ packages/shared/src/ 2>/dev/null | wc -l)

# Defensive-Tests (vorangestellter Kommentar oder gleiche Zeile)
DEFENSIVE=$(grep -rn "as unknown as.*// Defensive\|// Defensive" ExamLab/src/ packages/shared/src/ 2>/dev/null | wc -l)

UNDOKUMENTIERT=$((TOTAL - DEFENSIVE))

echo "as-any-Audit:"
echo "  Total:                $TOTAL"
echo "  Defensive (OK):       $DEFENSIVE"
echo "  Undokumentiert (FAIL): $UNDOKUMENTIERT"

if [[ "${1:-}" == "--strict" && "$UNDOKUMENTIERT" -gt 0 ]]; then
  echo "FAIL: $UNDOKUMENTIERT undokumentierte as-any-Stellen"
  exit 1
fi
```

In Phase L.a etabliert. Phase L.c integriert es in den `package.json`-Lint-Script (`"lint:as-any": "./scripts/audit-as-any.sh --strict"`).

---

## Phasen-Schnitt

### Phase L.a — Mock-Helper + pflichtfeldValidation-Pilot

**Branch:** `refactor/bundle-l-a-mock-helper-pflichtfeld`

**Scope:** 103 `as any`-Stellen + Helper-Aufbau

| Datei | Stellen vorher | Stellen nachher |
|---|---|---|
| `packages/shared/src/test-helpers/frageCoreMocks.ts` (neu) | — | 0 |
| `ExamLab/src/__tests__/helpers/frageStorageMocks.ts` (neu) | — | 0 |
| `packages/shared/src/test-helpers/frageCoreMocks.test.ts` (neu) | — | 0 |
| `packages/shared/src/editor/pflichtfeldValidation.ts` | 24 | 0 |
| `packages/shared/src/editor/pflichtfeldValidation.test.ts` | 79 | 0 (außer Defensive) |
| `scripts/audit-as-any.sh` (neu) | — | — |

**Done-Definition:**
- 0 undokumentierte `as any` in den 5 Files
- Helper-Tests (~10) grün, decken alle 20 Sub-Types ab
- 1098+N vitest, tsc -b clean, build clean
- Browser-E2E auf staging mit echten Logins für 7 Editor-Sub-Types (MC/RF/Lückentext/Sortierung/Zuordnung/Bildbeschriftung/DragDropBild) — Pflichtfeld-Outline-Verhalten unverändert
- Code-Review-Skill grün
- HANDOFF.md aktualisiert

### Phase L.b — poolConverter

**Branch:** `refactor/bundle-l-b-pool-converter`

**Scope:** 26 Stellen + Pool-Frage-Type-Strategie-Entscheidung

| Datei | Stellen vorher | Stellen nachher |
|---|---|---|
| `ExamLab/src/utils/poolConverter.ts` | 19 | 0 |
| `ExamLab/src/utils/poolConverter.test.ts` | 7 | 0 (außer Defensive) |

**Pool-Frage-Type-Strategie:** offen für Implementierungs-Plan dieser Phase.
Mögliche Optionen (im Plan zu bewerten):
- **(a)** `PoolFrage`-Discriminated-Union neu definieren (`packages/shared/src/types/pool-frage.ts`)
- **(b)** Type-Guards (`isPoolFrageMC(pf): pf is PoolFrageMC`) per Sub-Type, kein zentraler Union-Type
- **(c)** Schema-Validator (`zod`) am Pool-Eingangspunkt, danach typed flow

**Done-Definition:**
- 0 undokumentierte `as any` in den 2 Files
- Pool-Frage-Type-Strategie umgesetzt + dokumentiert
- vitest+tsc+build grün
- Code-Review-Skill grün

### Phase L.c — Restliche Production + Tests

**Branch:** `refactor/bundle-l-c-rest`

**Scope:** ~85 Stellen verstreut über ~22 Files + Audit-Skript-CI-Integration

**Strategie:** mechanischer Sweep, pro Datei kurz prüfen ob Helper-Pattern (Test-Datei) oder Type-Parametrisierung (Production) anwendbar ist.

**Liste wird zu Phase-L.c-Start neu aus Audit gezogen** (Stand kann sich durch L.a/L.b verschieben — z.B. werden Casts in `fragetypNormalizer.ts` ggf. durch L.b-Type-Guards überflüssig).

**Done-Definition:**
- 0 undokumentierte `as any` repo-weit (Audit-Skript läuft mit `--strict` und passt)
- `npm run lint:as-any` als CI-Gate aktiviert
- HANDOFF + `code-quality.md` aktualisiert (Eintrag „aktuell 58 Stellen — nicht erhöhen" wird durch „0 Production, alle Defensive-Tests dokumentiert" ersetzt)
- Code-Review-Skill grün

---

## Migrations-Pattern

### Klasse 1: Discriminator-Switch ohne Narrowing

**Vorher:**
```ts
function validierePflichtfelder(frage: unknown): Result {
  switch ((frage as any).typ) {
    case 'mc': return validiereMC(frage as any)
    case 'richtigfalsch': return validiereRichtigFalsch(frage as any)
    // …
  }
}
```

**Nachher:**
```ts
function validierePflichtfelder(frage: Frage): Result {
  switch (frage.typ) {
    case 'mc': return validiereMC(frage)              // frage: MCFrage
    case 'richtigfalsch': return validiereRichtigFalsch(frage)  // frage: RichtigFalschFrage
    // …
  }
}
```

**Sub-Funktion-Signatur:** `validiereMC(frage: MCFrage)` statt `validiereMC(frage: any)`.

**Caller-Anpassung:** Wenn Caller `unknown` übergibt, muss er erst auf `Frage` narrowen (Type Guard `isFrage(x): x is Frage`).

### Klasse 2: Defensive Feld-Zugriff auf untyped Daten

**Vorher (Pool-Frage in poolConverter):**
```ts
function poolPunkte(pf: any): number {
  switch (pf.typ) {
    case 'mc':
      return ((pf as any).correct?.length ?? 1) * 2
    // …
  }
}
```

**Nachher Option (a) — PoolFrage-Union:**
```ts
type PoolFrageMC = { typ: 'mc'; correct?: string[]; /* … */ }
type PoolFrage = PoolFrageMC | PoolFrageRF | /* … */

function poolPunkte(pf: PoolFrage): number {
  switch (pf.typ) {
    case 'mc':
      return (pf.correct?.length ?? 1) * 2
  }
}
```

**Nachher Option (b) — Type-Guards:**
```ts
function isPoolFrageMC(pf: unknown): pf is PoolFrageMC {
  return typeof pf === 'object' && pf !== null && (pf as any).typ === 'mc'
}

function poolPunkte(pf: unknown): number {
  if (isPoolFrageMC(pf)) return (pf.correct?.length ?? 1) * 2
  // …
}
```

Phase L.b wählt zwischen (a) und (b).

### Klasse 3: Echter Type-Bypass

**Vorher:**
```ts
<FrageEditor performance={performance as any} />
```

**Nachher (Prop-Type weiten):**
```ts
// In FrageEditor: interface Props { performance?: PerformanceData | null }
<FrageEditor performance={performance} />
```

**Oder (satisfies wo Strukturen genau matchen):**
```ts
<FrageEditor performance={performance satisfies PerformanceData} />
```

### Klasse 4: Test-Mock

**Vorher:**
```ts
const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q', optionen: null } as any)
```

**Nachher:**
```ts
const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: 'q', optionen: null as any }))
//   ^                                                               ^
//   Helper liefert vollständige Type-konforme Mock-Frage             optionen: null bleibt bewusster Kaputt-Wert
```

### Klasse 5: Defensive-Test-Cast

**Vorher:**
```ts
expect(() => validierePflichtfelder(null as any)).not.toThrow()
expect(() => validierePflichtfelder({} as any)).not.toThrow()
```

**Nachher:**
```ts
// Defensive: bewusst kaputter Input, prüft Robustheit gegen undefined/leere Objekte
expect(() => validierePflichtfelder(null as unknown as Frage)).not.toThrow()
expect(() => validierePflichtfelder({} as unknown as Frage)).not.toThrow()
```

Form `as unknown as Frage` (statt `as any`) macht den bewussten Type-Bruch explizit. Vorangestellter Kommentar `// Defensive: …` macht es für das Audit-Skript erkennbar.

---

## Risiken und Mitigationen

### R1: Helper-API skaliert nicht auf alle 20 Sub-Types

Bei komplexen Fragetypen (`BilanzERFrage`, `BuchungssatzFrage`) sind Pflichtfelder mehrstufig. Defaults schwer sinnvoll zu wählen.

**Mitigation:** Pilot in Phase L.a deckt 7 Sub-Types ab (MC/RF/Lücken/Sortierung/Zuordnung/Bildbeschriftung/DragDropBild — die in pflichtfeldValidation behandelten Typen). Wenn ein Default für komplexe Sub-Types unklar bleibt, dokumentieren in Helper-Datei + Test-Caller überschreibt explizit.

### R2: Discriminator-Narrowing klappt nicht überall

TS-narrowing funktioniert nur, wenn Input-Type sauber als `Frage`-Union typed ist. Funktionen mit `any`/`unknown`-Input müssen erst auf `Frage` gezogen werden.

**Mitigation:** Bei jedem Cast-Entfernung: Input-Type prüfen. Falls nicht diskriminierbar → Type Guard (`function isFrage(x): x is Frage`) am Eintrittspunkt einfügen.

### R3: Pool-Frage-Type-Strategie offen (Phase L.b)

Pool-Format ist nicht Storage/Core. Aktuell `(pf as any).correct`. Drei Optionen mit Trade-offs.

**Mitigation:** Im Implementations-Plan von L.b bewerten, nicht jetzt entscheiden. L.a beeinflusst diese Wahl nicht — Helper-Pattern ist orthogonal zum Pool-Format.

### R4: Logik-Regression durch Type-Refactor

Falls eine `as any`-Stelle einen echten Logik-Bug versteckt (z.B. greift auf falsches Feld zu), kann der Fix beim sauberen Typing einen Test brechen oder UI-Verhalten ändern.

**Mitigation:**
- Pro Phase volle vitest + tsc + build.
- Phase L.a hat Browser-E2E auf staging mit echten Logins (Pflichtfeld-Outline ist UI-sichtbar).
- Phase L.b: kein E2E nötig (interner Pool-Konverter, kein Render-Pfad).
- Phase L.c: pro Datei einzeln betrachten — bei Render-relevanten Files (FrageRenderer, UebungsScreen) zusätzlicher Spot-Check.

### R5: Bundle-K-Followup-Lehre — `tags`-Type-Asymmetrie

Storage's `tags: (string | Tag)[]` ist nicht zuweisbar an Core's `tags: string[]`. Cross-Layer-Mock würde scheitern.

**Mitigation:** Helper-Trennung (Architektur B) löst das vorab. shared-Tests nutzen `mockCoreFrage`, ExamLab-Tests nutzen `mockFrage` (Storage). Cross-Layer-Calls sind selten; falls nötig: `as unknown as CoreFrage` mit Kommentar `// Defensive: Storage→Core narrowing für Layer-Boundary-Test`.

### R6: Tests werden langsamer durch Helper-Aufruf

`mockCoreFrage('mc', {...})` ist ein Function-Call statt Object-Literal. Bei 79 Stellen in einer Datei rechnerisch ~79 zusätzliche Function-Calls pro Test-Run.

**Mitigation:** Helper macht reine Object-Konstruktion (`{ ...defaults, ...overrides }`) — keine I/O, keine Closures. Performance-Impact unter 1ms pro Aufruf, gesamt < 100ms pro Datei. Akzeptabel.

---

## Verifikation

### Pro Phase

| Check | L.a | L.b | L.c |
|---|---|---|---|
| `tsc -b` (ExamLab + shared) | ✓ | ✓ | ✓ |
| `vitest run` (1098+ grün) | ✓ | ✓ | ✓ |
| `npm run build` clean | ✓ | ✓ | ✓ |
| Audit: `as any` in Phase-Files = 0 (außer dokumentierte Defensive) | ✓ | ✓ | ✓ |
| Audit: Repo-weit Baseline = post-Phase-Stand | ✓ ≤ 111 | ✓ ≤ 85 | ✓ = nur Defensive |
| Browser-E2E (staging, echte Logins) | ✓ Pflichtfeld-Outline 7 Typen | — | nur bei Render-Files |
| Code-Review-Skill | ✓ | ✓ | ✓ |
| HANDOFF aktualisiert | ✓ | ✓ | ✓ |

### Done-Definition Bundle L gesamt (nach L.c)

- 0 undokumentierte `as any` repo-weit (`scripts/audit-as-any.sh --strict` exit 0)
- Defensive-Tests mit Form `as unknown as <Type>` + `// Defensive: …`-Kommentar
- Mock-Helper-API in `packages/shared/src/test-helpers/` + `ExamLab/src/__tests__/helpers/` etabliert + dokumentiert
- `package.json::scripts::lint:as-any` als CI-Gate (verhindert künftige Regression)
- HANDOFF.md + `.claude/rules/code-quality.md` aktualisiert (Schwelle ersetzt durch CI-Gate-Hinweis)

---

## Out of Scope

- **Strikte Defensive-Test-Type-Sicherheit:** `as unknown as Frage` ist ein bewusster Type-Bruch. Tests die `null`/`{}` an typed-Funktionen übergeben, sind per Definition kein Type-Safety-Showcase. Wir machen sie nur via Kommentar erkennbar.
- **Tests-Refactor Richtung Property-Based oder Test-Fixtures:** der Mock-Helper ist kein Fixture-Framework. Tests die wirklich elaborate Setup brauchen (z.B. `fragenbankStore`-Tests mit 100 Fragen), nutzen weiter manuelle Setup-Funktionen.
- **Apps-Script-Code:** `apps-script-code.js` ist V8-JS ohne TypeScript, hat keine `as any`-Stellen (auch keine Möglichkeit dazu). Out of Scope.
- **third-party-Type-Definitionen:** falls externe Bibliotheken `as any`-Workarounds nötig machen (z.B. wegen fehlender `.d.ts`-Files), bleiben diese mit Kommentar `// External: <Library> hat keine korrekten Types`.
