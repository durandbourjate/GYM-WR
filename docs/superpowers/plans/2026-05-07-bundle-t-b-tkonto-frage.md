# Bundle T.b — TKontoFrage Komponenten-Split Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `TKontoFrage.tsx` (763 Z., mittel-Risiko) per Komponenten-Split (`<KontoEingabeForm>` + `<KontoSeite>` + `<TKontoLoesungAnsicht>`) und file-lokales `tkontoUtils.ts` zerlegen, ohne Verhaltensänderung. Ziel-Bilanz: ~200 Z. im Hauptfile (<500 Master-Spec-Ziel).

**Architecture:** Sub-Folder `fragetypen/tkonto/` analog `fragetypen/zeichnen/`. State bleibt im Parent (`TKontoAufgabe`), Children sind dumb-Komponenten mit Callback-Props. `tkontoUtils.ts` enthält alle pure Functions (Decimal-Konvertierung, Greedy-Match, Pro-Konto-Bewertung) + den `brd`-Border-Helper + `KontoEingabe`/`SusEintrag`/`EintragStatus`/`KontoBewertung`-Types. Verhalten 1:1 erhalten — Refactor ohne Wire-Vertrag-Touch, ohne Render-Änderung.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Vitest. Konvention pro Bundle-T-Master-Spec Sektion 4.1 (file-lokale Hooks/Utils).

**Spec:** [`docs/superpowers/specs/2026-05-07-bundle-t-b-tkonto-frage-design.md`](../specs/2026-05-07-bundle-t-b-tkonto-frage-design.md)

**Master-Spec:** [`docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md`](../specs/2026-05-06-bundle-t-hooks-splits-design.md), Sektion 6.2 (T.b-Hypothese)

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Branch:** `feature/bundle-t-b-tkonto-frage` (bereits angelegt + Spec auf Branch committed: `db4cb85` + `09c66f9`)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output prüfen, nicht nur Exit-Code (Lehre `feedback_tsc_b_exit_misleading`).

**Tests:** `cd ExamLab && npx vitest run`

---

## Pre-Audit: Source-Inventar TKontoFrage.tsx (763 Z., gegrept 2026-05-07)

### Top-Level Helpers (Z. 18-135) — wandern nach `tkontoUtils.ts`

| Z. | Symbol | Art | Cut |
|---|---|---|---|
| 18-21 | `brd(wert, ro): string` | Border-Klasse-Helper | → `tkontoUtils.ts` |
| 24-26 | `neueId(): string` | UUID-Wrapper | → `tkontoUtils.ts` |
| 28-33 | `EintragZeile` | Interface | → `tkontoUtils.ts` |
| 35-50 | `KontoEingabe` | Interface | → `tkontoUtils.ts` |
| 52-54 | `leereZeile(): EintragZeile` | Factory | → `tkontoUtils.ts` |
| 56-73 | `leereKontoEingabe(id): KontoEingabe` | Factory | → `tkontoUtils.ts` |
| 76-104 | `zuAntwort(konten): TKontoAntwort` | Pure (parseFloat/parseInt) | → `tkontoUtils.ts` |
| 107-135 | `vonAntwort(antwort, frageDefs): KontoEingabe[]` | Pure (mit Legacy-Cast Z. 119-122) | → `tkontoUtils.ts` (Cast wird durch Optional-Felder im Type ersetzt) |

### TKontoAufgabe-Body (Z. 144-559) — wird neu strukturiert

| Z. | Inhalt | Cut |
|---|---|---|
| 144-160 | useFrageAdapter + useState + frage.id-Reload-useEffect | bleibt in TKontoFrage.tsx (TKontoAufgabe-Sub) |
| 162-206 | 6 Update-Funktionen (`aktualisiere`, `deepCopy`, `eintragAendern`, `zeileHinzufuegen`, `zeileEntfernen`, `feldAendern`) | bleibt |
| 208-247 | Render-Frame: Badges, Aufgabentext, Geschäftsfälle | bleibt |
| 249-547 | Konten-Loop mit komplettem Konto-Render | → `<KontoEingabeForm>` (Z. 254-547 inkl. Header + 2× Seiten-Body) |
| 290-353 | Kopfzeile Soll/Haben + Z/A links+rechts (~63 Z.) | → `<KontoSeite>`-interner Header |
| 356-394 | AB-Zeile links+rechts | → `<KontoSeite>`-interner AB-Block |
| 397-509 | Buchungszeilen-Map links+rechts (~110 Z., **Doppel-Code**) | → `<KontoSeite>`-Body |
| 512-543 | Saldo-Zeile links+rechts | → `<KontoSeite>`-interner Saldo-Block |
| 550-557 | Feedback-Section (Üben-Modus) | bleibt |

### TKontoLoesung-Body (Z. 561-763) — wandert nach `TKontoLoesungAnsicht.tsx`

| Z. | Inhalt | Cut |
|---|---|---|
| 563-567 | `SusEintrag`, `EintragStatus` Types | → `tkontoUtils.ts` |
| 569-591 | `matcheEintraege(korrekt, sus)` Pure-Function | → `tkontoUtils.ts` |
| 593-611 | `alleKontenKorrekt`-Vorab-Berechnung | → wird durch `bewerteKonto` ersetzt (Single Source of Truth) |
| 613-732 | Loesungs-Render-Body | → `TKontoLoesungAnsicht.tsx` (mit `bewerteKonto` statt Inline-Loop) |
| 736-763 | `EintragBadge`-Helper-Komponente | → `TKontoLoesungAnsicht.tsx` (lokal) |

---

## File Map

### Neue Files

| Datei | Größe-Schätzung | Verantwortung |
|---|---:|---|
| `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts` | ~125 Z. | Pure Functions + Types + `brd` |
| `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts` | ~85 Z. | Vitest, 23 Tests |
| `ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx` | ~120-140 Z. | 1 Seite (links\|rechts): Beschriftung+Z/A+AB+Buchungszeilen+Saldo |
| `ExamLab/src/components/fragetypen/tkonto/KontoEingabeForm.tsx` | ~80-100 Z. | 1 Konto: Header + 2× `<KontoSeite>` |
| `ExamLab/src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx` | ~150 Z. | Loesungsmodus + lokaler `EintragBadge` |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/components/fragetypen/TKontoFrage.tsx` | 763 Z. | ~200 Z. | Wrapper-Dispatcher + `TKontoAufgabe`-Sub. Imports umgestellt, alle externen Helpers raus |

### Bilanz

- 763 → ~200 Z. (Hauptfile, **<500 Z. Master-Spec-Ziel ✓**)
- Hotspot-Bilanz Files >500 Z.: **12 → 11**
- 5 neue Files in `tkonto/` Sub-Folder

---

## Phase 1: tkontoUtils.ts mit TDD

### Task 1.1: Folder + Util-File-Skeleton mit Types

**Files:**
- Create: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts`

- [ ] **Step 1: Folder erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
mkdir -p src/components/fragetypen/tkonto
```

- [ ] **Step 2: tkontoUtils.ts mit Types + Factory-Helpers schreiben**

```typescript
// ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { Antwort } from '../../../types/antworten.ts'

// === Types ===

export interface EintragZeile {
  id: string
  gegenkonto: string
  betrag: string
  gfNr: string // Geschäftsfall-Nummer
}

export interface KontoEingabe {
  id: string
  beschriftungLinks: string
  beschriftungRechts: string
  kontenkategorie: string
  sollHaben: string              // Legacy (nicht mehr im UI)
  zunahmeAbnahme: string         // Legacy (nicht mehr im UI)
  zunahmeAbnahmeLinks: string
  zunahmeAbnahmeRechts: string
  anfangsbestandLinks: string
  anfangsbestandRechts: string
  eintraegeLinks: EintragZeile[]
  eintraegeRechts: EintragZeile[]
  saldoLinks: string
  saldoRechts: string
}

export type TKontoAntwort = Extract<Antwort, { typ: 'tkonto' }>

export type SusEintrag = { gegenkonto: string; betrag: number }

export type EintragStatus =
  | { art: 'korrekt'; gegenkonto: string; betrag: number }
  | { art: 'falsch'; gegenkonto: string; betrag: number; hinweis: string }
  | { art: 'fehlend'; gegenkonto: string; betrag: number }

export interface KontoBewertung {
  linksStatus: EintragStatus[]
  rechtsStatus: EintragStatus[]
  alleLinksOk: boolean
  alleRechtsOk: boolean
  saldoBalanciert: boolean
  kontoKorrekt: boolean
}

// === Border-Klasse: violett wenn leer + nicht readOnly ===

export function brd(wert: string, readOnly: boolean): string {
  if (readOnly) return 'border-slate-300 dark:border-slate-600'
  return !wert ? 'border-violet-400 dark:border-violet-500' : 'border-slate-300 dark:border-slate-600'
}

// === Factory-Helpers ===

export function neueId(): string {
  return crypto.randomUUID()
}

export function leereZeile(): EintragZeile {
  return { id: neueId(), gegenkonto: '', betrag: '', gfNr: '' }
}

export function leereKontoEingabe(id: string): KontoEingabe {
  return {
    id,
    beschriftungLinks: '',
    beschriftungRechts: '',
    kontenkategorie: '',
    sollHaben: '',
    zunahmeAbnahme: '',
    zunahmeAbnahmeLinks: '',
    zunahmeAbnahmeRechts: '',
    anfangsbestandLinks: '',
    anfangsbestandRechts: '',
    eintraegeLinks: [leereZeile()],
    eintraegeRechts: [leereZeile()],
    saldoLinks: '',
    saldoRechts: '',
  }
}

// === Pure Functions (zuAntwort/vonAntwort/matcheEintraege/bewerteKonto) folgen in Tasks 1.2-1.5 ===
```

- [ ] **Step 3: Build-Check (sollte clean compilieren)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors. Wenn Errors: bitte vor Fortfahren beheben.

- [ ] **Step 4: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts
git commit -m "Bundle T.b Phase 1.1: tkontoUtils.ts Skeleton mit Types + Factory-Helpers + brd"
```

---

### Task 1.2: zuAntwort + Tests (TDD)

**Files:**
- Create: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts`
- Modify: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts`

- [ ] **Step 1: Tests für zuAntwort schreiben**

```typescript
// ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts
import { describe, it, expect } from 'vitest'
import { zuAntwort, leereKontoEingabe, leereZeile } from './tkontoUtils'
import type { KontoEingabe } from './tkontoUtils'

describe('zuAntwort', () => {
  function konto(overrides: Partial<KontoEingabe> = {}): KontoEingabe {
    return { ...leereKontoEingabe('k1'), ...overrides }
  }

  it('parsed leere Beträge als 0', () => {
    const k = konto({ eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '', gfNr: '' }] })
    const a = zuAntwort([k])
    expect(a.konten[0].eintraegeLinks[0].betrag).toBe(0)
  })

  it('parsed Decimal-Beträge als float', () => {
    const k = konto({ eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '3.50', gfNr: '' }] })
    const a = zuAntwort([k])
    expect(a.konten[0].eintraegeLinks[0].betrag).toBe(3.5)
  })

  it('parsed gfNr als optionales Int', () => {
    const k1 = konto({ eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '0', gfNr: '5' }] })
    const k2 = konto({ id: 'k2', eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '0', gfNr: '' }] })
    expect(zuAntwort([k1]).konten[0].eintraegeLinks[0].gfNr).toBe(5)
    expect(zuAntwort([k2]).konten[0].eintraegeLinks[0].gfNr).toBeUndefined()
  })

  it('emittiert saldo nur wenn links oder rechts gesetzt', () => {
    const k1 = konto()  // beide saldo leer
    const k2 = konto({ id: 'k2', saldoLinks: '100' })
    const k3 = konto({ id: 'k3', saldoRechts: '50' })
    expect(zuAntwort([k1]).konten[0].saldo).toBeUndefined()
    expect(zuAntwort([k2]).konten[0].saldo).toEqual({ betragLinks: 100, betragRechts: 0 })
    expect(zuAntwort([k3]).konten[0].saldo).toEqual({ betragLinks: 0, betragRechts: 50 })
  })

  it('strippt leere Beschriftungs-Felder zu undefined', () => {
    const k = konto()  // alle Strings leer
    const a = zuAntwort([k])
    expect(a.konten[0].beschriftungLinks).toBeUndefined()
    expect(a.konten[0].beschriftungRechts).toBeUndefined()
    expect(a.konten[0].kontenkategorie).toBeUndefined()
  })
})
```

- [ ] **Step 2: Tests laufen lassen — sollten failen mit "zuAntwort is not a function"**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/tkonto/tkontoUtils.test.ts
```
Expected: 5 FAIL — `zuAntwort is not exported`

- [ ] **Step 3: zuAntwort in tkontoUtils.ts implementieren**

Append to `tkontoUtils.ts`:

```typescript
/** Konvertiert die interne Eingabe ins Antwort-Format für den Store */
export function zuAntwort(konten: KontoEingabe[]): TKontoAntwort {
  return {
    typ: 'tkonto' as const,
    konten: konten.map((k) => ({
      id: k.id,
      beschriftungLinks: k.beschriftungLinks || undefined,
      beschriftungRechts: k.beschriftungRechts || undefined,
      kontenkategorie: k.kontenkategorie || undefined,
      sollHaben: k.sollHaben || undefined,
      zunahmeAbnahme: k.zunahmeAbnahme || undefined,
      zunahmeAbnahmeLinks: k.zunahmeAbnahmeLinks || undefined,
      zunahmeAbnahmeRechts: k.zunahmeAbnahmeRechts || undefined,
      eintraegeLinks: k.eintraegeLinks.map((e) => ({
        gegenkonto: e.gegenkonto,
        betrag: parseFloat(e.betrag) || 0,
        gfNr: e.gfNr ? parseInt(e.gfNr) : undefined,
      })),
      eintraegeRechts: k.eintraegeRechts.map((e) => ({
        gegenkonto: e.gegenkonto,
        betrag: parseFloat(e.betrag) || 0,
        gfNr: e.gfNr ? parseInt(e.gfNr) : undefined,
      })),
      saldo: (k.saldoLinks || k.saldoRechts) ? {
        betragLinks: parseFloat(k.saldoLinks) || 0,
        betragRechts: parseFloat(k.saldoRechts) || 0,
      } : undefined,
    })),
  }
}
```

**Hinweis:** Wenn `TKontoAntwort['konten'][0]` heute keine optionalen Legacy-Felder (`sollHaben?`, `zunahmeAbnahme?`, `zunahmeAbnahmeLinks?`, `zunahmeAbnahmeRechts?`) hat, müssen sie im Type ergänzt werden. Lies dazu `ExamLab/src/types/antworten.ts` (oder wo `Antwort['typ'] === 'tkonto'`-Variante definiert ist) und füge die Optional-Felder dort an, wenn sie fehlen. Damit entfällt der heutige `Record<string, unknown>`-Cast in `vonAntwort`.

- [ ] **Step 4: Tests laufen lassen — sollten passen**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/tkonto/tkontoUtils.test.ts
```
Expected: 5 PASS

- [ ] **Step 5: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts ExamLab/src/types/antworten.ts
git commit -m "Bundle T.b Phase 1.2: zuAntwort + 5 Tests, Legacy-Felder als Optional in TKontoAntwort"
```

---

### Task 1.3: vonAntwort + Tests (TDD)

**Files:**
- Modify: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts`
- Modify: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts`

- [ ] **Step 1: Tests für vonAntwort schreiben (mit typed Test-Helpers)**

**Wichtig:** KEINE `as any`-Casts. Bundle-L.c-CI-Gate `lint:as-any` (`audit-as-any.sh` matcht `as any`/`: any`/`= any`) würde sie fangen. Stattdessen typed Helper-Block oben in `tkontoUtils.test.ts` einfügen:

```typescript
// Imports + Helpers oben in tkontoUtils.test.ts (vor describe-Blöcken)
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { TKontoAntwort } from './tkontoUtils'

/** Typed Stub für ein Konto-Definition. Implementer: Wenn TS Pflicht-Felder reklamiert,
 *  aus ExamLab/src/types/fragen-storage.ts (Type TKontoFrage.konten[0]) ergänzen. */
function frageKontoStub(overrides: Partial<TKontoFrageType['konten'][0]> = {}): TKontoFrageType['konten'][0] {
  const base = {
    id: 'k1',
    kontonummer: '1000',
    eintraege: [],
  } as TKontoFrageType['konten'][0]
  return { ...base, ...overrides }
}

function susKontoStub(overrides: Partial<TKontoAntwort['konten'][0]> = {}): TKontoAntwort['konten'][0] {
  const base = {
    id: 'k1',
    eintraegeLinks: [],
    eintraegeRechts: [],
  } as TKontoAntwort['konten'][0]
  return { ...base, ...overrides }
}
```

`as TKontoFrageType['konten'][0]` (Type-Cast auf konkreten Type) wird vom Audit-Skript NICHT gefangen — nur `as any`. Sicher fürs CI-Gate.

Append `vonAntwort`-Tests:

```typescript
import { vonAntwort } from './tkontoUtils'

describe('vonAntwort', () => {
  const frageDefs: TKontoFrageType['konten'] = [
    frageKontoStub({ id: 'k1', kontonummer: '1000' }),
    frageKontoStub({ id: 'k2', kontonummer: '2000' }),
  ]

  it('antwort=undefined → leere Konten', () => {
    const result = vonAntwort(undefined, frageDefs)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('k1')
    expect(result[0].beschriftungLinks).toBe('')
    expect(result[0].eintraegeLinks).toHaveLength(1)
    expect(result[0].eintraegeLinks[0].gegenkonto).toBe('')
  })

  it('Round-Trip: vonAntwort(zuAntwort(x)) ≈ x modulo Eintrag-IDs + anfangsbestand-Felder', () => {
    const original = [
      leereKontoEingabe('k1'),
      { ...leereKontoEingabe('k2'), saldoLinks: '100', eintraegeLinks: [{ id: 'z1', gegenkonto: 'A', betrag: '50', gfNr: '3' }] },
    ]
    const result = vonAntwort(zuAntwort(original), frageDefs)
    // anfangsbestandLinks/Rechts werden in zuAntwort nicht serialisiert → bleiben '' nach Round-Trip
    expect(result[0].id).toBe('k1')
    expect(result[1].saldoLinks).toBe('100')
    expect(result[1].eintraegeLinks[0].gegenkonto).toBe('A')
    expect(result[1].eintraegeLinks[0].betrag).toBe('50')
    expect(result[1].eintraegeLinks[0].gfNr).toBe('3')
    // anfangsbestand-Drift dokumentiert (heute nicht persistiert)
    expect(result[0].anfangsbestandLinks).toBe('')
    expect(result[1].anfangsbestandLinks).toBe('')
  })

  it('Saldo-Werte als String restauriert', () => {
    const ant = zuAntwort([{ ...leereKontoEingabe('k1'), saldoLinks: '100', saldoRechts: '50' }])
    const result = vonAntwort(ant, [frageDefs[0]])
    expect(result[0].saldoLinks).toBe('100')
    expect(result[0].saldoRechts).toBe('50')
  })

  it('Konten matched per id, nicht Index', () => {
    const ant = zuAntwort([{ ...leereKontoEingabe('k2'), saldoLinks: '999' }])
    const result = vonAntwort(ant, frageDefs)  // frageDefs hat k1, k2
    expect(result[0].id).toBe('k1')
    expect(result[0].saldoLinks).toBe('')  // k1 hat keine Antwort
    expect(result[1].id).toBe('k2')
    expect(result[1].saldoLinks).toBe('999')
  })

  it('leere Eintragslisten → [leereZeile()]', () => {
    const ant: TKontoAntwort = {
      typ: 'tkonto',
      konten: [susKontoStub({ id: 'k1' })]
    }
    const result = vonAntwort(ant, [frageDefs[0]])
    expect(result[0].eintraegeLinks).toHaveLength(1)
    expect(result[0].eintraegeLinks[0].gegenkonto).toBe('')
  })

  it('Legacy-Felder sollHaben/zunahmeAbnahme* werden gelesen wenn vorhanden, sonst empty', () => {
    const ant: TKontoAntwort = {
      typ: 'tkonto',
      konten: [susKontoStub({
        id: 'k1',
        sollHaben: 'soll',
        zunahmeAbnahmeLinks: '+Zunahme',
      })]
    }
    const result = vonAntwort(ant, [frageDefs[0]])
    expect(result[0].sollHaben).toBe('soll')
    expect(result[0].zunahmeAbnahmeLinks).toBe('+Zunahme')
    expect(result[0].zunahmeAbnahme).toBe('')  // nicht in Antwort, fallback empty
  })
})
```

Importiere `TKontoAntwort` mit `import type { TKontoAntwort } from './tkontoUtils'` falls noch nicht.

- [ ] **Step 2: Tests laufen — failen erwartet**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/tkonto/tkontoUtils.test.ts
```
Expected: 6 FAIL

- [ ] **Step 3: vonAntwort implementieren**

Append to `tkontoUtils.ts`:

```typescript
/** Initialisiert die Konten aus einer bestehenden Antwort */
export function vonAntwort(
  antwort: TKontoAntwort | undefined,
  frageDefs: TKontoFrageType['konten'],
): KontoEingabe[] {
  return frageDefs.map((def) => {
    const eingabe = antwort?.konten.find((k) => k.id === def.id)
    if (!eingabe) return leereKontoEingabe(def.id)
    return {
      id: def.id,
      beschriftungLinks: eingabe.beschriftungLinks ?? '',
      beschriftungRechts: eingabe.beschriftungRechts ?? '',
      kontenkategorie: eingabe.kontenkategorie ?? '',
      sollHaben: eingabe.sollHaben ?? '',
      zunahmeAbnahme: eingabe.zunahmeAbnahme ?? '',
      zunahmeAbnahmeLinks: eingabe.zunahmeAbnahmeLinks ?? '',
      zunahmeAbnahmeRechts: eingabe.zunahmeAbnahmeRechts ?? '',
      anfangsbestandLinks: '',
      anfangsbestandRechts: '',
      eintraegeLinks: eingabe.eintraegeLinks.length > 0
        ? eingabe.eintraegeLinks.map((e) => ({ id: neueId(), gegenkonto: e.gegenkonto, betrag: e.betrag ? String(e.betrag) : '', gfNr: e.gfNr ? String(e.gfNr) : '' }))
        : [leereZeile()],
      eintraegeRechts: eingabe.eintraegeRechts.length > 0
        ? eingabe.eintraegeRechts.map((e) => ({ id: neueId(), gegenkonto: e.gegenkonto, betrag: e.betrag ? String(e.betrag) : '', gfNr: e.gfNr ? String(e.gfNr) : '' }))
        : [leereZeile()],
      saldoLinks: eingabe.saldo?.betragLinks ? String(eingabe.saldo.betragLinks) : '',
      saldoRechts: eingabe.saldo?.betragRechts ? String(eingabe.saldo.betragRechts) : '',
    }
  })
}
```

**Hinweis:** Keine `Record<string, unknown>`-Casts mehr — die Legacy-Felder sind dank Task-1.2-Type-Erweiterung jetzt direkt zugreifbar.

- [ ] **Step 4: Tests laufen — passen erwartet**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/tkonto/tkontoUtils.test.ts
```
Expected: 11 PASS (5 zuAntwort + 6 vonAntwort)

- [ ] **Step 5: tsc -b + lint:as-any clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
cd .. && npm run lint:as-any
```
Expected: 0 errors für tsc, lint:as-any clean (audit-as-any.sh-Output prüfen — keine neuen Casts)

- [ ] **Step 6: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/
git commit -m "Bundle T.b Phase 1.3: vonAntwort + 6 Tests inkl. Round-Trip + Legacy-Field-Lese-Pfad"
```

---

### Task 1.4: matcheEintraege + Tests (TDD)

**Files:**
- Modify: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts`
- Modify: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts`

- [ ] **Step 1: Tests für matcheEintraege schreiben**

Append to `tkontoUtils.test.ts`:

```typescript
import { matcheEintraege } from './tkontoUtils'
import type { SusEintrag } from './tkontoUtils'

describe('matcheEintraege', () => {
  it('beide leer → []', () => {
    expect(matcheEintraege([], [])).toEqual([])
  })

  it('matched korrekt-Einträge Reihenfolge-unabhängig (greedy)', () => {
    const korrekt: SusEintrag[] = [{ gegenkonto: 'A', betrag: 100 }, { gegenkonto: 'B', betrag: 50 }]
    const sus: SusEintrag[] = [{ gegenkonto: 'B', betrag: 50 }, { gegenkonto: 'A', betrag: 100 }]
    const result = matcheEintraege(korrekt, sus)
    expect(result.every(s => s.art === 'korrekt')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('markiert fehlend wenn sus < korrekt', () => {
    const result = matcheEintraege([{ gegenkonto: 'A', betrag: 100 }], [])
    expect(result).toEqual([{ art: 'fehlend', gegenkonto: 'A', betrag: 100 }])
  })

  it('markiert falsch (überflüssig) wenn sus > korrekt', () => {
    const result = matcheEintraege([], [{ gegenkonto: 'X', betrag: 999 }])
    expect(result).toEqual([{ art: 'falsch', gegenkonto: 'X', betrag: 999, hinweis: 'Nicht erwartet' }])
  })

  it('toleriert Decimal-Diff < 0.01', () => {
    const result = matcheEintraege(
      [{ gegenkonto: 'A', betrag: 100.005 }],
      [{ gegenkonto: 'A', betrag: 100.01 }]  // diff 0.005 < 0.01
    )
    expect(result[0].art).toBe('korrekt')
  })

  it('NICHT toleriert Decimal-Diff ≥ 0.01', () => {
    const result = matcheEintraege(
      [{ gegenkonto: 'A', betrag: 100.01 }],
      [{ gegenkonto: 'A', betrag: 100.02 }]  // diff exakt 0.01
    )
    expect(result[0].art).toBe('fehlend')
    expect(result[1].art).toBe('falsch')
  })

  it('matched genau 1× pro korrekt-Eintrag (genutzt-Set bei Duplikaten)', () => {
    const result = matcheEintraege(
      [{ gegenkonto: 'A', betrag: 100 }],
      [{ gegenkonto: 'A', betrag: 100 }, { gegenkonto: 'A', betrag: 100 }]
    )
    expect(result.filter(s => s.art === 'korrekt')).toHaveLength(1)
    expect(result.filter(s => s.art === 'falsch')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Tests failen lassen**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/tkonto/tkontoUtils.test.ts
```
Expected: 7 FAIL

- [ ] **Step 3: matcheEintraege implementieren (1:1 aus heutigem TKontoFrage.tsx Z. 569-591)**

```typescript
export function matcheEintraege(korrekt: SusEintrag[], sus: SusEintrag[]): EintragStatus[] {
  // Greedy match: für jeden korrekten Eintrag einen passenden SuS-Eintrag finden (beide Felder match)
  const genutzt = new Set<number>()
  const status: EintragStatus[] = []
  for (const k of korrekt) {
    const idx = sus.findIndex(
      (s, i) => !genutzt.has(i) && s.gegenkonto === k.gegenkonto && Math.abs(s.betrag - k.betrag) < 0.01
    )
    if (idx >= 0) {
      genutzt.add(idx)
      status.push({ art: 'korrekt', gegenkonto: k.gegenkonto, betrag: k.betrag })
    } else {
      status.push({ art: 'fehlend', gegenkonto: k.gegenkonto, betrag: k.betrag })
    }
  }
  // Nicht-genutzte SuS-Einträge sind überflüssig
  sus.forEach((s, i) => {
    if (!genutzt.has(i)) {
      status.push({ art: 'falsch', gegenkonto: s.gegenkonto, betrag: s.betrag, hinweis: 'Nicht erwartet' })
    }
  })
  return status
}
```

- [ ] **Step 4: Tests passen lassen**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/tkonto/tkontoUtils.test.ts
```
Expected: 18 PASS (5+6+7)

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/
git commit -m "Bundle T.b Phase 1.4: matcheEintraege + 7 Tests (Greedy-Match, Decimal-Toleranz)"
```

---

### Task 1.5: bewerteKonto + Tests (TDD)

**Files:**
- Modify: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts`
- Modify: `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts`

- [ ] **Step 1: Tests für bewerteKonto schreiben (typed Helpers, keine `as any`)**

Append to `tkontoUtils.test.ts` (nutzt `frageKontoStub`/`susKontoStub` aus Task 1.3 Step 1):

```typescript
import { bewerteKonto } from './tkontoUtils'

describe('bewerteKonto', () => {
  it('alle korrekt → kontoKorrekt=true', () => {
    const konto = frageKontoStub({
      eintraege: [
        { gegenkonto: 'A', betrag: 100, seite: 'soll' },
        { gegenkonto: 'B', betrag: 50, seite: 'haben' },
      ],
    })
    const sus = susKontoStub({
      eintraegeLinks: [{ gegenkonto: 'A', betrag: 100 }],
      eintraegeRechts: [{ gegenkonto: 'B', betrag: 50 }],
    })
    const result = bewerteKonto(konto, sus)
    expect(result.kontoKorrekt).toBe(true)
    expect(result.alleLinksOk).toBe(true)
    expect(result.alleRechtsOk).toBe(true)
    expect(result.saldoBalanciert).toBe(true)
  })

  it('fehlend links → kontoKorrekt=false', () => {
    const konto = frageKontoStub({
      eintraege: [{ gegenkonto: 'A', betrag: 100, seite: 'soll' }],
    })
    const sus = susKontoStub()  // links leer
    const result = bewerteKonto(konto, sus)
    expect(result.kontoKorrekt).toBe(false)
    expect(result.alleLinksOk).toBe(false)
  })

  it('Saldo unbalanciert → kontoKorrekt=false', () => {
    const konto = frageKontoStub()
    const sus = susKontoStub({ saldo: { betragLinks: 100, betragRechts: 50 } })
    const result = bewerteKonto(konto, sus)
    expect(result.saldoBalanciert).toBe(false)
    expect(result.kontoKorrekt).toBe(false)
  })

  it('kein sus.saldo → saldoBalanciert=true (kein Saldo verlangt)', () => {
    const konto = frageKontoStub()
    const sus = susKontoStub()  // ohne saldo
    const result = bewerteKonto(konto, sus)
    expect(result.saldoBalanciert).toBe(true)
  })

  it('sus=undefined → kontoKorrekt=false (alle fehlend)', () => {
    const konto = frageKontoStub({
      eintraege: [{ gegenkonto: 'A', betrag: 100, seite: 'soll' }],
    })
    const result = bewerteKonto(konto, undefined)
    expect(result.kontoKorrekt).toBe(false)
    expect(result.alleLinksOk).toBe(false)
    expect(result.linksStatus[0].art).toBe('fehlend')
  })
})
```

- [ ] **Step 2: Tests failen lassen**

- [ ] **Step 3: bewerteKonto implementieren** (extrahiert aus heutigem TKontoLoesung Z. 597-611 + 639-655)

```typescript
export function bewerteKonto(
  konto: TKontoFrageType['konten'][0],
  sus: TKontoAntwort['konten'][0] | undefined,
): KontoBewertung {
  const korrektLinks = konto.eintraege.filter((e) => e.seite === 'soll')
  const korrektRechts = konto.eintraege.filter((e) => e.seite === 'haben')
  const susLinks: SusEintrag[] = Array.isArray(sus?.eintraegeLinks) ? sus!.eintraegeLinks : []
  const susRechts: SusEintrag[] = Array.isArray(sus?.eintraegeRechts) ? sus!.eintraegeRechts : []
  const linksStatus = matcheEintraege(korrektLinks, susLinks)
  const rechtsStatus = matcheEintraege(korrektRechts, susRechts)
  const alleLinksOk = linksStatus.every((s) => s.art === 'korrekt') && linksStatus.length === korrektLinks.length
  const alleRechtsOk = rechtsStatus.every((s) => s.art === 'korrekt') && rechtsStatus.length === korrektRechts.length
  const saldoBalanciert =
    !sus?.saldo ||
    Math.abs((sus.saldo.betragLinks ?? 0) - (sus.saldo.betragRechts ?? 0)) < 0.01
  const kontoKorrekt = alleLinksOk && alleRechtsOk && saldoBalanciert
  return { linksStatus, rechtsStatus, alleLinksOk, alleRechtsOk, saldoBalanciert, kontoKorrekt }
}
```

- [ ] **Step 4: Tests passen lassen**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/tkonto/tkontoUtils.test.ts
```
Expected: 23 PASS (5+6+7+5)

- [ ] **Step 5: tsc -b clean**

- [ ] **Step 6: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/
git commit -m "Bundle T.b Phase 1.5: bewerteKonto + 5 Tests (Single-Source-of-Truth für Pro-Konto-Bewertung)"
```

---

## Phase 2: KontoSeite.tsx

### Task 2.1: KontoSeite.tsx — symmetrische Seite-Komponente

**Files:**
- Create: `ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx`

- [ ] **Step 1: KontoSeite.tsx schreiben**

Die Komponente bekommt einen `seite: 'links' | 'rechts'`-Prop und schaltet damit zwischen den Doppel-Feldern (`beschriftungLinks/Rechts`, `eintraegeLinks/Rechts` etc.). Inhalt 1:1 aus heutigem TKontoFrage.tsx Z. 290-543, aber: das bestehende doppelte Markup wird zu **einem** Render-Block, der vom `seite`-Prop abhängt.

```typescript
// ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx
import KontenSelect from '../../shared/KontenSelect.tsx'
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { KontoEingabe } from './tkontoUtils'
import { brd } from './tkontoUtils'

interface KontoSeiteProps {
  seite: 'links' | 'rechts'
  konto: KontoEingabe
  def: TKontoFrageType['konten'][0]
  bewertungsoptionen: TKontoFrageType['bewertungsoptionen']
  hatGeschaeftsfaelle: boolean
  kontenauswahl: TKontoFrageType['kontenauswahl']
  readOnly: boolean
  onFeldAendern: (feld: keyof KontoEingabe, wert: string) => void
  onEintragAendern: (zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) => void
  onZeileHinzufuegen: () => void
  onZeileEntfernen: (zeileIdx: number) => void
}

export default function KontoSeite({
  seite, konto, def, bewertungsoptionen, hatGeschaeftsfaelle,
  kontenauswahl, readOnly,
  onFeldAendern, onEintragAendern, onZeileHinzufuegen, onZeileEntfernen,
}: KontoSeiteProps) {
  const opts = bewertungsoptionen
  const istLinks = seite === 'links'
  // Felder pro Seite auswählen
  const beschriftung = istLinks ? konto.beschriftungLinks : konto.beschriftungRechts
  const beschriftungFeld: keyof KontoEingabe = istLinks ? 'beschriftungLinks' : 'beschriftungRechts'
  const zunahmeAbnahme = istLinks ? konto.zunahmeAbnahmeLinks : konto.zunahmeAbnahmeRechts
  const zunahmeAbnahmeFeld: keyof KontoEingabe = istLinks ? 'zunahmeAbnahmeLinks' : 'zunahmeAbnahmeRechts'
  const anfangsbestand = istLinks ? konto.anfangsbestandLinks : konto.anfangsbestandRechts
  const anfangsbestandFeld: keyof KontoEingabe = istLinks ? 'anfangsbestandLinks' : 'anfangsbestandRechts'
  const eintraege = istLinks ? konto.eintraegeLinks : konto.eintraegeRechts
  const saldo = istLinks ? konto.saldoLinks : konto.saldoRechts
  const saldoFeld: keyof KontoEingabe = istLinks ? 'saldoLinks' : 'saldoRechts'
  const defaultBeschriftung = istLinks ? 'Soll' : 'Haben'

  // Cell-Borders: ersetzen die heutigen Row-Container-Borders aus 4 separaten Grids in TKontoFrage.tsx Z. 292/357/397/512
  // Heute: Kopfzeile-Grid hat `border-b-2 border-slate-800` → migriert auf cell-bottom-border
  //        AB-Grid hat `border-b border-slate-200` → migriert auf cell-bottom-border
  //        Buchungen-Grid: keine row-border
  //        Saldo-Grid hat `border-t-2 border-slate-800 mt-1 pt-2` → migriert auf cell-top-border
  const seitenBorderRight = istLinks ? 'border-r border-slate-800 dark:border-slate-300' : ''
  const padX = istLinks ? 'pr-2' : 'pl-2'

  return (
    <>
      {/* Kopfzeile: Beschriftung + Z/A — bottom-border 2px (war border-b-2 auf Grid-Container) */}
      <div className={`pb-1.5 ${padX} ${seitenBorderRight} border-b-2 border-b-slate-800 dark:border-b-slate-300`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {opts.beschriftungSollHaben ? (
            <select
              value={beschriftung}
              onChange={(e) => onFeldAendern(beschriftungFeld, e.target.value)}
              disabled={readOnly}
              className={`min-h-[28px] text-xs font-bold uppercase tracking-wider bg-transparent rounded border px-1 py-0.5 focus:outline-none text-slate-700 dark:text-slate-200 disabled:opacity-50 ${brd(beschriftung, readOnly)}`}
            >
              <option value="">Seite...</option>
              <option value="Soll">Soll</option>
              <option value="Haben">Haben</option>
            </select>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{defaultBeschriftung}</span>
          )}
          {opts.zunahmeAbnahme && (
            <select
              value={zunahmeAbnahme}
              onChange={(e) => onFeldAendern(zunahmeAbnahmeFeld, e.target.value)}
              disabled={readOnly}
              className={`min-h-[28px] text-xs rounded border bg-white px-1 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300 focus:outline-none disabled:opacity-50 ${brd(zunahmeAbnahme, readOnly)}`}
            >
              <option value="">+/−</option>
              <option value="+Zunahme">(+) Zunahme</option>
              <option value="-Abnahme">(−) Abnahme</option>
            </select>
          )}
        </div>
      </div>

      {/* Anfangsbestand-Zelle — bottom-border 1px slate-200 (war border-b auf Grid-Container) */}
      {def.anfangsbestand !== undefined && (
        <div className={`py-1.5 ${padX} ${seitenBorderRight} border-b border-b-slate-200 dark:border-b-slate-700`}>
          {istLinks && def.anfangsbestandVorgegeben ? (
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 px-1">
              <span className="text-xs italic">AB</span>
              <span className="font-mono">{def.anfangsbestand.toLocaleString('de-CH')}</span>
            </div>
          ) : (!istLinks && def.anfangsbestandVorgegeben) ? null : (
            <div className="flex items-center gap-1">
              <span className="text-xs italic text-slate-400 dark:text-slate-500">AB</span>
              <input
                type="number"
                value={anfangsbestand}
                onChange={(e) => onFeldAendern(anfangsbestandFeld, e.target.value)}
                disabled={readOnly}
                placeholder="0"
                className={`min-h-[36px] flex-1 rounded border bg-white px-2 py-1 text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(anfangsbestand, readOnly)}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Buchungszeilen-Map — keine row-border (war Grid-Container ohne border) */}
      <div className={`${padX} ${seitenBorderRight} py-2 space-y-1.5`}>
        {eintraege.map((z, zIdx) => (
          <div key={z.id} className="flex items-center gap-1">
            {hatGeschaeftsfaelle && (
              <input
                type="number"
                value={z.gfNr}
                onChange={(e) => onEintragAendern(zIdx, 'gfNr', e.target.value)}
                disabled={readOnly}
                placeholder="#"
                min="1"
                className={`min-h-[36px] w-10 rounded border bg-white px-1 py-1 text-xs text-center text-slate-700 dark:bg-slate-700 dark:text-slate-200 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(z.gfNr, readOnly)}`}
                title="Geschäftsfall-Nr."
              />
            )}
            <div className="flex-1 min-w-0">
              <KontenSelect
                value={z.gegenkonto}
                onChange={(nr) => onEintragAendern(zIdx, 'gegenkonto', nr)}
                config={kontenauswahl}
                placeholder="Gegenkonto"
                disabled={readOnly}
              />
            </div>
            <input
              type="number"
              value={z.betrag}
              onChange={(e) => onEintragAendern(zIdx, 'betrag', e.target.value)}
              disabled={readOnly}
              placeholder="CHF"
              min="0"
              step="0.01"
              className={`min-h-[36px] w-24 rounded border bg-white px-2 py-1 text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(z.betrag, readOnly)}`}
            />
            {!readOnly && eintraege.length > 1 && (
              <button type="button" onClick={() => onZeileEntfernen(zIdx)}
                className="min-h-[36px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors" title="Entfernen">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button type="button" onClick={onZeileHinzufuegen}
            className="mt-1 min-h-[36px] flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Zeile
          </button>
        )}
      </div>

      {/* Saldo-Zelle — top-border 2px slate-800 + mt-1 pt-2 (war border-t-2 auf Grid-Container) */}
      <div className={`${padX} ${seitenBorderRight} border-t-2 border-t-slate-800 dark:border-t-slate-300 mt-1 pt-2`}>
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saldo</span>
          <input
            type="number"
            value={saldo}
            onChange={(e) => onFeldAendern(saldoFeld, e.target.value)}
            disabled={readOnly}
            placeholder="CHF"
            min="0"
            step="0.01"
            className={`min-h-[36px] w-24 rounded border bg-white px-2 py-1 text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(saldo, readOnly)}`}
          />
        </div>
      </div>
    </>
  )
}
```

**Hinweis 1:** `<KontoSeite>` rendert ein React-Fragment mit **vier separaten Cells** (Kopfzeile, AB, Buchungszeilen, Saldo). `<KontoEingabeForm>` wird sie in einer `grid-cols-2`-Struktur platzieren, sodass die linke und rechte `<KontoSeite>` zusammen 8 Cells = 4 Reihen ergeben. Der `border-r`/`pl-2`-Trick ist im Fragment-Internal codiert.

**Hinweis 2:** Das heutige Markup hat einen leeren rechten AB-Block (Z. 378-393), wenn `def.anfangsbestandVorgegeben === true` — das ist das `(!istLinks && def.anfangsbestandVorgegeben) ? null` im Code oben. Das verhält sich byte-identisch.

- [ ] **Step 2: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors. (KontoSeite ist noch nicht gemountet — Komponente isoliert testet sich erst nach KontoEingabeForm-Wiring.)

- [ ] **Step 3: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx
git commit -m "Bundle T.b Phase 2.1: KontoSeite.tsx (links/rechts-symmetrische Seite-Komponente)"
```

---

## Phase 3: KontoEingabeForm.tsx

### Task 3.1: KontoEingabeForm.tsx — Komposition Header + 2× KontoSeite

**Files:**
- Create: `ExamLab/src/components/fragetypen/tkonto/KontoEingabeForm.tsx`

- [ ] **Step 1: KontoEingabeForm.tsx schreiben**

```typescript
// ExamLab/src/components/fragetypen/tkonto/KontoEingabeForm.tsx
import KontoSeite from './KontoSeite.tsx'
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { KontoEingabe } from './tkontoUtils'
import { brd } from './tkontoUtils'
import { kontoLabel } from '../../../utils/kontenrahmen.ts'

interface KontoEingabeFormProps {
  konto: KontoEingabe
  def: TKontoFrageType['konten'][0]
  bewertungsoptionen: TKontoFrageType['bewertungsoptionen']
  hatGeschaeftsfaelle: boolean
  kontenauswahl: TKontoFrageType['kontenauswahl']
  readOnly: boolean
  onFeldAendern: (feld: keyof KontoEingabe, wert: string) => void
  onEintragAendern: (seite: 'links' | 'rechts', zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) => void
  onZeileHinzufuegen: (seite: 'links' | 'rechts') => void
  onZeileEntfernen: (seite: 'links' | 'rechts', zeileIdx: number) => void
}

export default function KontoEingabeForm({
  konto, def, bewertungsoptionen, hatGeschaeftsfaelle, kontenauswahl, readOnly,
  onFeldAendern, onEintragAendern, onZeileHinzufuegen, onZeileEntfernen,
}: KontoEingabeFormProps) {
  const opts = bewertungsoptionen
  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {/* Konto-Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {kontoLabel(def.kontonummer)}
          </span>
          {opts.kontenkategorie && (
            <>
              <select
                value={konto.kontenkategorie}
                onChange={(e) => onFeldAendern('kontenkategorie', e.target.value)}
                disabled={readOnly}
                className={`min-h-[32px] rounded border bg-white px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200 focus:outline-none disabled:opacity-50 ${brd(konto.kontenkategorie, readOnly)}`}
              >
                <option value="">Kategorie...</option>
                <option value="aktiv">Aktiv</option>
                <option value="passiv">Passiv</option>
                <option value="aufwand">Aufwand</option>
                <option value="ertrag">Ertrag</option>
              </select>
              {konto.kontenkategorie && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  konto.kontenkategorie === 'aktiv' ? 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700' :
                  konto.kontenkategorie === 'passiv' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/15 dark:text-red-300 dark:border-red-800' :
                  konto.kontenkategorie === 'aufwand' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/15 dark:text-blue-300 dark:border-blue-800' :
                  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/15 dark:text-green-300 dark:border-green-800'
                }`}>
                  {konto.kontenkategorie.charAt(0).toUpperCase() + konto.kontenkategorie.slice(1)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* T-Form: Single Grid mit 4 Reihen (Kopfzeile, AB, Buchungen, Saldo) × 2 Spalten.
          KEINE row-borders auf Container — KontoSeite emittiert pro Cell die korrekten cell-borders. */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2">
          <KontoSeite
            seite="links"
            konto={konto} def={def}
            bewertungsoptionen={opts} hatGeschaeftsfaelle={hatGeschaeftsfaelle}
            kontenauswahl={kontenauswahl} readOnly={readOnly}
            onFeldAendern={onFeldAendern}
            onEintragAendern={(zIdx, feld, wert) => onEintragAendern('links', zIdx, feld, wert)}
            onZeileHinzufuegen={() => onZeileHinzufuegen('links')}
            onZeileEntfernen={(zIdx) => onZeileEntfernen('links', zIdx)}
          />
          <KontoSeite
            seite="rechts"
            konto={konto} def={def}
            bewertungsoptionen={opts} hatGeschaeftsfaelle={hatGeschaeftsfaelle}
            kontenauswahl={kontenauswahl} readOnly={readOnly}
            onFeldAendern={onFeldAendern}
            onEintragAendern={(zIdx, feld, wert) => onEintragAendern('rechts', zIdx, feld, wert)}
            onZeileHinzufuegen={() => onZeileHinzufuegen('rechts')}
            onZeileEntfernen={(zIdx) => onZeileEntfernen('rechts', zIdx)}
          />
        </div>
      </div>
    </div>
  )
}
```

**Hinweis Layout (kritisch — Plan-Reviewer Issue 1):** Die heutige Source hat **vier separate `grid grid-cols-2`-Container** in TKontoFrage.tsx mit jeweils eigenen Row-Borders:
- Z. 292: Kopfzeile-Grid mit `border-b-2 border-slate-800 dark:border-slate-300`
- Z. 357: AB-Grid mit `border-b border-slate-200 dark:border-slate-700` (conditional)
- Z. 397: Buchungen-Grid (keine Row-Border)
- Z. 512: Saldo-Grid mit `border-t-2 border-slate-800 dark:border-slate-300 mt-1 pt-2`

Bei der Migration zu **einem** flachen `grid grid-cols-2` mit Cells aus `<KontoSeite>` werden die row-spezifischen Border-Container aufgelöst. Damit das Layout byte-identisch bleibt, **müssen die Border-Klassen auf JEDE Cell migriert werden**:
- Kopfzeile-Cell: `border-b-2 border-b-slate-800 dark:border-b-slate-300` (auf links + rechts)
- AB-Cell: `border-b border-b-slate-200 dark:border-b-slate-700` (auf links + rechts, nur wenn def.anfangsbestand !== undefined)
- Buchungen-Cell: keine row-border
- Saldo-Cell: `border-t-2 border-t-slate-800 dark:border-t-slate-300 mt-1 pt-2` (auf links + rechts)

Das ist im obigen `KontoSeite.tsx`-Code (Task 2.1) bereits eingebaut. Der äußere Grid-Wrapper in `KontoEingabeForm.tsx` darf KEINE Border haben, sonst doppelte Linien.

- [ ] **Step 2: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/
git commit -m "Bundle T.b Phase 3.1: KontoEingabeForm.tsx (single-grid + cell-borders aus KontoSeite)"
```

---

## Phase 4: TKontoLoesungAnsicht.tsx

### Task 4.1: TKontoLoesungAnsicht.tsx mit lokalem EintragBadge

**Files:**
- Create: `ExamLab/src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx`

- [ ] **Step 1: TKontoLoesungAnsicht.tsx schreiben**

```typescript
// ExamLab/src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { Antwort } from '../../../types/antworten.ts'
import { renderMarkdown } from '../../../utils/markdown.ts'
import { fachbereichFarbe } from '../../../utils/fachUtils.ts'
import { kontoLabel } from '../../../utils/kontenrahmen.ts'
import { MusterloesungsBlock } from '@shared/ui/MusterloesungsBlock'
import { bewerteKonto } from './tkontoUtils'
import type { EintragStatus } from './tkontoUtils'

interface Props {
  frage: TKontoFrageType
  antwort: Antwort | null
}

export default function TKontoLoesungAnsicht({ frage, antwort }: Props) {
  const susKonten = antwort?.typ === 'tkonto' ? antwort.konten : []
  const konten = frage.konten ?? []
  // Vorab-Gesamtstatus für MusterloesungsBlock-Variante
  const alleKontenKorrekt = konten.every((konto, kontoIdx) => {
    const sus = susKonten.find((s) => s.id === konto.id) ?? susKonten[kontoIdx]
    return bewerteKonto(konto, sus).kontoKorrekt
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          T-Konto
        </span>
      </div>

      {/* Aufgabentext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Pro Konto eine T-Konto-Karte */}
      <div className="flex flex-col gap-4">
        {konten.map((konto, kontoIdx) => {
          const sus = susKonten.find((s) => s.id === konto.id) ?? susKonten[kontoIdx]
          const { linksStatus, rechtsStatus, saldoBalanciert, kontoKorrekt } = bewerteKonto(konto, sus)
          const rahmen = kontoKorrekt
            ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
            : 'border-red-600 bg-red-50 dark:bg-red-950/20'

          return (
            <div key={konto.id} className={`border-2 rounded-xl p-4 ${rahmen}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Konto {konto.kontonummer}
                  {kontoLabel(konto.kontonummer) && (
                    <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                      — {kontoLabel(konto.kontonummer)}
                    </span>
                  )}
                </span>
                <span className={`text-xs font-bold ${kontoKorrekt ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {kontoKorrekt ? '✓ Korrekt' : '✗ Falsch'}
                </span>
              </div>

              {/* T-Konto-Tabelle: Soll links, Haben rechts */}
              <div className="grid grid-cols-2 gap-0 border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-300 dark:border-slate-600">
                  Soll
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Haben
                </div>
                {Array.from({ length: Math.max(linksStatus.length, rechtsStatus.length, 1) }).map((_, i) => {
                  const l = linksStatus[i]
                  const r = rechtsStatus[i]
                  return (
                    <div key={i} className="contents">
                      <div className="px-3 py-1 text-xs border-r border-t border-slate-200 dark:border-slate-700">
                        {l ? <EintragBadge status={l} /> : <span className="text-slate-400">&nbsp;</span>}
                      </div>
                      <div className="px-3 py-1 text-xs border-t border-slate-200 dark:border-slate-700">
                        {r ? <EintragBadge status={r} /> : <span className="text-slate-400">&nbsp;</span>}
                      </div>
                    </div>
                  )
                })}
                {sus?.saldo && (
                  <div className="contents">
                    <div className={`px-3 py-1 text-xs border-r border-t-2 border-slate-400 dark:border-slate-500 ${saldoBalanciert ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-semibold`}>
                      Saldo: {(sus.saldo.betragLinks ?? 0).toFixed(2)}
                    </div>
                    <div className={`px-3 py-1 text-xs border-t-2 border-slate-400 dark:border-slate-500 ${saldoBalanciert ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-semibold`}>
                      Saldo: {(sus.saldo.betragRechts ?? 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Erwarteter Saldo */}
              {konto.saldo && (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Erwarteter Saldo: <span className="font-semibold text-green-700 dark:text-green-400">
                    {Number(konto.saldo.betrag ?? 0).toFixed(2)} ({konto.saldo.seite === 'soll' ? 'links' : 'rechts'})
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Musterloesung */}
      {frage.musterlosung && (
        <MusterloesungsBlock variant={alleKontenKorrekt ? 'korrekt' : 'falsch'} label="Musterloesung">
          <p>{frage.musterlosung}</p>
        </MusterloesungsBlock>
      )}
    </div>
  )
}

function EintragBadge({ status }: { status: EintragStatus }) {
  if (status.art === 'korrekt') {
    return (
      <span className="inline-flex items-center gap-2 text-green-700 dark:text-green-400">
        <span className="font-mono">{status.gegenkonto}</span>
        <span className="font-mono">{Number(status.betrag ?? 0).toFixed(2)}</span>
        <span aria-hidden>{'✓'}</span>
      </span>
    )
  }
  if (status.art === 'fehlend') {
    return (
      <span className="inline-flex items-center gap-2 text-red-700 dark:text-red-400">
        <span className="font-mono font-semibold">{status.gegenkonto}</span>
        <span className="font-mono font-semibold">{Number(status.betrag ?? 0).toFixed(2)}</span>
        <em className="text-xs not-italic text-red-700 dark:text-red-400">(fehlt)</em>
      </span>
    )
  }
  // 'falsch' = überflüssig
  return (
    <span className="inline-flex items-center gap-2 text-red-700 dark:text-red-400 line-through">
      <span className="font-mono">{status.gegenkonto}</span>
      <span className="font-mono">{Number(status.betrag ?? 0).toFixed(2)}</span>
      <em className="text-xs not-italic no-underline">({status.hinweis})</em>
    </span>
  )
}
```

- [ ] **Step 2: tsc -b clean**

- [ ] **Step 3: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx
git commit -m "Bundle T.b Phase 4.1: TKontoLoesungAnsicht.tsx + lokaler EintragBadge (bewerteKonto Single-Source)"
```

---

## Phase 5: TKontoFrage.tsx-Refactor

### Task 5.1: TKontoFrage.tsx schlanken

**Files:**
- Modify: `ExamLab/src/components/fragetypen/TKontoFrage.tsx`

- [ ] **Step 1: TKontoFrage.tsx neu schreiben**

Ersetze den **kompletten Inhalt** der Datei (763 Z. → ~200 Z.):

```typescript
// ExamLab/src/components/fragetypen/TKontoFrage.tsx
import { useState, useEffect } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { TKontoFrage as TKontoFrageType } from '../../types/fragen-storage'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import KontoEingabeForm from './tkonto/KontoEingabeForm.tsx'
import TKontoLoesungAnsicht from './tkonto/TKontoLoesungAnsicht.tsx'
import { vonAntwort, zuAntwort, leereZeile } from './tkonto/tkontoUtils'
import type { KontoEingabe } from './tkonto/tkontoUtils'

interface Props {
  frage: TKontoFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function TKontoFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <TKontoLoesungAnsicht frage={frage} antwort={antwortProp ?? null} />
  }
  return <TKontoAufgabe frage={frage} />
}

function TKontoAufgabe({ frage }: { frage: TKontoFrageType }) {
  const { antwort, onAntwort, speichereZwischenstand, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const gespeicherteAntwort = antwort?.typ === 'tkonto' ? antwort : undefined

  // Lokaler State statt Neuberechnung bei jedem Render (verhindert Cursor-Sprung bei Inputs)
  const [konten, setKontenLokal] = useState<KontoEingabe[]>(() =>
    vonAntwort(gespeicherteAntwort, frage.konten)
  )

  // Bei Fragenwechsel: State neu initialisieren
  useEffect(() => {
    const gespeichert = antwort?.typ === 'tkonto' ? antwort : undefined
    setKontenLokal(vonAntwort(gespeichert, frage.konten))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  function aktualisiere(neueKonten: KontoEingabe[]) {
    setKontenLokal(neueKonten)
    if (speichereZwischenstand) {
      speichereZwischenstand(zuAntwort(neueKonten))
    } else {
      onAntwort(zuAntwort(neueKonten))
    }
  }

  function deepCopy(): KontoEingabe[] {
    return konten.map((k) => ({
      ...k,
      eintraegeLinks: k.eintraegeLinks.map((e) => ({ ...e })),
      eintraegeRechts: k.eintraegeRechts.map((e) => ({ ...e })),
    }))
  }

  function eintragAendern(kontoIdx: number, seite: 'links' | 'rechts', zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    zeilen[zeileIdx] = { ...zeilen[zeileIdx], [feld]: wert }
    aktualisiere(kopie)
  }

  function zeileHinzufuegen(kontoIdx: number, seite: 'links' | 'rechts') {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    zeilen.push(leereZeile())
    aktualisiere(kopie)
  }

  function zeileEntfernen(kontoIdx: number, seite: 'links' | 'rechts', zeileIdx: number) {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    if (zeilen.length <= 1) return
    zeilen.splice(zeileIdx, 1)
    aktualisiere(kopie)
  }

  function feldAendern(kontoIdx: number, feld: keyof KontoEingabe, wert: string) {
    const kopie = deepCopy()
    Object.assign(kopie[kontoIdx], { [feld]: wert })
    aktualisiere(kopie)
  }

  const readOnly = disabled
  const hatGeschaeftsfaelle = !!frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          T-Konto
        </span>
      </div>

      {/* Aufgabentext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Geschäftsfälle */}
      {frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Geschäftsfälle</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            {frage.geschaeftsfaelle.map((gf, i) => (
              <li key={i}>{gf}</li>
            ))}
          </ol>
        </div>
      )}

      {/* T-Konten */}
      <div className="flex flex-col gap-6">
        {konten.map((konto, kIdx) => (
          <KontoEingabeForm
            key={konto.id}
            konto={konto}
            def={frage.konten[kIdx]}
            bewertungsoptionen={frage.bewertungsoptionen}
            hatGeschaeftsfaelle={hatGeschaeftsfaelle}
            kontenauswahl={frage.kontenauswahl}
            readOnly={readOnly}
            onFeldAendern={(feld, wert) => feldAendern(kIdx, feld, wert)}
            onEintragAendern={(seite, zIdx, feld, wert) => eintragAendern(kIdx, seite, zIdx, feld, wert)}
            onZeileHinzufuegen={(seite) => zeileHinzufuegen(kIdx, seite)}
            onZeileEntfernen={(seite, zIdx) => zeileEntfernen(kIdx, seite, zIdx)}
          />
        ))}
      </div>

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '✓ Richtig!' : '✗ Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Zeilen-Count prüfen**

```bash
wc -l ExamLab/src/components/fragetypen/TKontoFrage.tsx
```
Expected: ~180-220 Zeilen (Master-Spec-Ziel <500 ✓)

- [ ] **Step 3: tsc -b clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```
Expected: 0 errors. Wichtig: Output **direkt** prüfen, nicht nur Exit-Code (Lehre `feedback_tsc_b_exit_misleading`).

- [ ] **Step 4: vitest run**

```bash
cd ExamLab && npx vitest run
```
Expected: drift = +23 (alle 23 neuen tkontoUtils-Tests passen, alle bestehenden Tests bleiben grün)

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/fragetypen/TKontoFrage.tsx
git commit -m "Bundle T.b Phase 5.1: TKontoFrage.tsx schlank (763 → ~200 Z.) — Wrapper + State-Holder"
```

---

## Phase 5b: Lokaler vite-dev-Smoke-Test (Render-Verifikation)

### Task 5b.1: vite dev starten + T-Konto-Frage rendern

Zweck: Layout-Regression VOR staging-Deploy fangen (Lehre Plan-Review: Single-Grid-Migration kann Row-Borders verlieren).

- [ ] **Step 1: vite dev starten**

```bash
cd ExamLab && npx vite dev
```

- [ ] **Step 2: Browser öffnen, lokale URL aufrufen** (Standard `http://localhost:5173`)

- [ ] **Step 3: Demo-Modus mit T-Konto-Frage öffnen oder echten LP-Login**

- [ ] **Step 4: Visuell prüfen: Layout byte-identisch zu main**

- ✓ Soll/Haben-Trennlinie zwischen Kopfzeile und AB-Zeile (heute `border-b-2 border-slate-800`) sichtbar
- ✓ AB→Buchungen-Trennlinie (heute `border-b border-slate-200`) sichtbar
- ✓ Buchungen→Saldo-Trennlinie (heute `border-t-2 border-slate-800 mt-1 pt-2`) sichtbar
- ✓ Vertikale Soll/Haben-Trennlinie (`border-r border-slate-800`) durchgehend
- ✓ Konto-Header mit Kontenkategorie-Badge funktioniert
- ✓ Buchungszeilen Hinzufügen/Entfernen
- ✓ Dark-Mode-Variante: alle Borders sichtbar

- [ ] **Step 5: Console prüfen — 0 Errors**

- [ ] **Step 6: vite dev stoppen** (Ctrl+C)

Bei Layout-Regression: Code-Inspektion in `KontoSeite.tsx` Cell-Border-Klassen, fix, repeat. Erst nach grünem Smoke-Test zu Phase 6.

---

## Phase 6: Verifikations-Gates

### Task 6.1: Alle Lint-Gates

- [ ] **Step 1: lint:as-any**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY" && npm run lint:as-any
```
Expected: 0 (oder unverändert vs main — kein neues `as any`)

- [ ] **Step 2: lint:no-alert**

```bash
npm run lint:no-alert
```
Expected: clean

- [ ] **Step 3: lint:no-tests-dir**

```bash
npm run lint:no-tests-dir
```
Expected: clean

- [ ] **Step 4: lint:musterloesung**

```bash
npm run lint:musterloesung
```
Expected: clean (TKontoFrage-Read-Pfade sind unverändert)

- [ ] **Step 5: vitest full run**

```bash
cd ExamLab && npx vitest run
```
Expected: alle Tests grün, drift +23 dokumentiert

### Task 6.2: Build-Check

- [ ] **Step 1: vite build**

```bash
cd ExamLab && npx vite build
```
Expected: Successful build, kein Error

---

## Phase 7: Browser-E2E auf staging (echte Logins)

### Task 7.1: Service-Worker-Cache-Flush

- [ ] **Step 1: Push Branch** (falls noch nicht — staging-Deploy hängt am Branch-Push)

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push -u origin feature/bundle-t-b-tkonto-frage
```

- [ ] **Step 2: combined-staging-Branch update** (falls Workflow staging-Deploy via combined-staging)

Der genaue Pfad hängt vom CI-Setup ab (siehe HANDOFF.md/Workflow-Doku). Standard-Pfad bei diesem Repo:

```bash
git checkout combined-staging
git reset --hard origin/main
git merge feature/bundle-t-b-tkonto-frage --no-ff -m "combined-staging: T.b for E2E"
git push --force-with-lease origin combined-staging
git checkout feature/bundle-t-b-tkonto-frage
```

Warte auf Pages-Deploy (~3-5 Min, GitHub Actions prüfen).

- [ ] **Step 3: Browser öffnen + SW-Cache flushen**

URL: staging-URL aus HANDOFF/CI-Setup. In DevTools:
```javascript
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
caches.keys().then(ks => ks.forEach(k => caches.delete(k)))
location.reload(true)
```

### Task 7.2: LP-E2E-Pfade

- [ ] **Step 1: LP-Login mit echten Credentials**

Login als LP, navigiere zu Fragensammlung.

- [ ] **Step 2: T-Konto-Frage finden oder erstellen**

Nutze eine bestehende T-Konto-Frage (im Üben-Bereich) oder erstelle eine neue.

- [ ] **Step 3: Prüfung erstellen + durchführen + Lobby**

LP-Workflow:
1. Neue Prüfung mit T-Konto-Frage(n) erstellen
2. Lobby öffnen
3. Test-SuS-Account in zweitem Browser-Tab als SuS einloggen + beitreten
4. Prüfung starten

- [ ] **Step 4: SuS-Antwort eingeben**

Im SuS-Tab: T-Konto-Frage komplett ausfüllen (mehrere Konten, links + rechts, Saldo). Verifizieren:
- ✓ Buchungszeilen erscheinen links + rechts
- ✓ Hinzufügen/Entfernen-Buttons funktionieren
- ✓ Beträge persistieren bei Tab-Switch
- ✓ Saldo-Felder funktionieren
- ✓ Geschäftsfall-Nr.-Spalte erscheint wenn `frage.geschaeftsfaelle` gesetzt
- ✓ Kontenkategorie-Badge erscheint wenn `bewertungsoptionen.kontenkategorie`

- [ ] **Step 5: Prüfung beenden + Korrektur**

LP-Tab: Prüfung beenden, Korrektur-Ansicht öffnen. Verifizieren:
- ✓ Loesungsmodus zeigt T-Konto-Tabelle korrekt (Soll links / Haben rechts)
- ✓ Korrekte Einträge grün mit ✓
- ✓ Fehlende Einträge rot mit "(fehlt)"
- ✓ Überflüssige Einträge rot durchgestrichen mit "(Nicht erwartet)"
- ✓ Saldo-Zeile mit Balanciert-Status (grün wenn balanciert, rot wenn nicht)
- ✓ Erwarteter Saldo unten richtig formatiert
- ✓ Korrekt/Falsch-Header-Badge stimmt
- ✓ MusterloesungsBlock-Variante richtig (korrekt vs falsch)

- [ ] **Step 6: 0 Console-Errors**

DevTools Console prüfen — keine roten Errors.

### Task 7.3: SuS-Üben-E2E

- [ ] **Step 1: SuS-Login mit echten Credentials, Üben-Bereich**

- [ ] **Step 2: Übung mit T-Konto-Frage starten**

- [ ] **Step 3: Antwort eingeben + "Prüfen"**

Verifizieren:
- ✓ Feedback erscheint (✓ Richtig! oder ✗ Leider falsch.)
- ✓ Musterlösung wird angezeigt
- ✓ Navigation weiter funktioniert

### Task 7.4: Multi-Konten-Test

- [ ] **Step 1: T-Konto-Frage mit 3+ Konten in Übung verwenden**

Verifizieren:
- ✓ Alle Konten parallel ausgefüllt
- ✓ State persistiert pro Konto getrennt (kein Daten-Leakage)
- ✓ `feldAendern`/`eintragAendern`-Closures schliessen `kIdx` korrekt

---

## Phase 8: Code-Reviewer + Cleanup

### Task 8.1: Code-Reviewer-Subagent

- [ ] **Step 1: Code-Reviewer dispatchen**

Dispatch via `superpowers:code-reviewer` Subagent:

```
Branch: feature/bundle-t-b-tkonto-frage
Spec: docs/superpowers/specs/2026-05-07-bundle-t-b-tkonto-frage-design.md
Plan: docs/superpowers/plans/2026-05-07-bundle-t-b-tkonto-frage.md
DoD: Spec Sektion 7

Verifizieren:
- TKontoFrage.tsx <500 Z.
- 23 neue Tests in tkontoUtils.test.ts (drift +23)
- Keine `as any` Casts in tkonto/
- Verhalten byte-identisch (kein Logik-Drift)
- bewerteKonto extrahiert exakt heutige Inline-Berechnungen
- KontoSeite seite-Switch korrekt für alle Felder
- KontoEingabeForm-Komposition identisch zur heutigen Pro-Konto-Karte
```

- [ ] **Step 2: Reviewer-Findings fixen oder durchstreiten**

Bei Issues: fix + re-dispatch. Bei advisory Recommendations: bewerten + entscheiden.

- [ ] **Step 3: APPROVED-Status erreichen**

### Task 8.2: HANDOFF + Memory

- [ ] **Step 1: HANDOFF.md aktualisieren**

In `ExamLab/HANDOFF.md`: Bundle T.b-Eintrag mit Bilanz, Hotspot 12→11, Browser-E2E-Pfaden, neuen Lehren.

- [ ] **Step 2: Memory-Update**

In `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/`:
- Neuer Eintrag `project_bundle_t_b_komplett.md` (Schema analog `project_bundle_t_a_komplett.md`)
- Index-Eintrag in `MEMORY.md`
- Falls neue Lehren beim Refactor entstanden: in code-quality.md ergänzen

- [ ] **Step 3: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle T.b: HANDOFF-Eintrag"
```

### Task 8.3: Merge auf main

- [ ] **Step 1: Final Push Branch**

```bash
git push origin feature/bundle-t-b-tkonto-frage
```

- [ ] **Step 2: PR erstellen oder Direct-Merge**

```bash
git checkout main
git pull origin main
git merge --no-ff feature/bundle-t-b-tkonto-frage -m "Merge Bundle T.b: TKontoFrage Komponenten-Split (763 → ~200 Z.)"
git push origin main
```

- [ ] **Step 3: Branch lokal+remote löschen**

```bash
git branch -d feature/bundle-t-b-tkonto-frage
git push origin --delete feature/bundle-t-b-tkonto-frage
```

- [ ] **Step 4: combined-staging zurücksetzen**

```bash
git checkout combined-staging
git reset --hard origin/main
git push --force-with-lease origin combined-staging
git checkout main
```

- [ ] **Step 5: Final-Commit Memory + HANDOFF auf main pushen** (falls noch ausstehend)

```bash
git add -A
git commit -m "Bundle T.b: Memory + HANDOFF-Status final"
git push origin main
```

---

## Erfolgskriterien (Bilanz)

- [x] Spec + Plan reviewer-approved + auf Branch committed
- [ ] 23 neue Vitest-Tests grün (drift = +23)
- [ ] tsc -b clean
- [ ] 4 Lint-Gates clean (`lint:as-any`, `lint:no-alert`, `lint:no-tests-dir`, `lint:musterloesung`)
- [ ] vite build erfolgreich
- [ ] Browser-E2E mit echten LP+SuS-Logins ✓ (5 Pfade aus Spec 5.2)
- [ ] 0 Console-Errors
- [ ] Code-Reviewer-Subagent APPROVED
- [ ] TKontoFrage.tsx ~200 Z. (Master-Spec-Ziel <500 ✓)
- [ ] Hotspot-Bilanz: 12 → 11
- [ ] HANDOFF + Memory + main-Merge

## Risiken & Mitigationen

| Risiko | Mitigation |
|---|---|
| Decimal-Drift in `zuAntwort`/`vonAntwort` | Round-Trip-Test + 6 Decimal-Tests in `matcheEintraege` |
| `<KontoSeite>`-Symmetrie-Bug (Felder vertauscht) | Browser-E2E mit Multi-Konten-Frage; Tests prüfen beide Seiten getrennt |
| Layout-Drift durch Fragment-zu-Grid-Migration | Visuelle Prüfung: Rahmen, Trennlinien, Saldo-Top-Border identisch zu main |
| `as any`-Cast bei Legacy-Felder-Read | Type-Erweiterung `TKontoAntwort['konten'][0]` mit Optional-Feldern in Phase 1.2 |
| Service-Worker-Cache | SW-unregister + caches.delete + reload als Routine vor E2E |
| Subagent-Branch-Drift | Branch-Setup explizit in Subagent-Prompt + remote pushen vor Folge-Subagents |
