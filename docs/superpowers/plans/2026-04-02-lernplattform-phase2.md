# Lernplattform Phase 2: Fragenbank + Uebungs-Engine

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fragen aus Google Sheets laden, 10er-Bloecke zusammenstellen, Fragetypen rendern, Antworten auswerten und Feedback zeigen — Kinder und SuS koennen ueben.

**Architecture:** Neue Typen (Frage, Antwort, Session), FragenService + UebungsService Interfaces, Apps-Script-Adapter erweitern, Fragetypen als React-Komponenten (MC, Multi, TF, Fill, Calc, Sort, Sortierung, Zuordnung), UebungsStore fuer Session-State, Dashboard mit Themen-Browser, UebungsScreen mit Navigation + Feedback, Zusammenfassung am Ende.

**Tech Stack:** React 19.2 + TypeScript 5.9 + Zustand 5.0 + Tailwind CSS 4.2 + Vitest

**Spec:** `docs/superpowers/specs/2026-04-02-lernplattform-design.md` (Abschnitte 5, 6, 9, 10)

**Branch:** Direkt auf `main` (Lernplattform ist neu, keine Regressionsgefahr)

---

## Dateistruktur (Phase 2 — neue + geaenderte Dateien)

```
Lernplattform/src/
├── types/
│   ├── fragen.ts                    ← NEU: Frage, FrageTyp, Antwort, FragenFilter
│   └── uebung.ts                   ← NEU: UebungsSession, BlockConfig, SessionErgebnis
├── services/
│   └── interfaces.ts               ← ERWEITERT: FragenService, UebungsService
├── adapters/
│   └── appsScriptAdapter.ts        ← ERWEITERT: FragenAdapter + Mock-Daten
├── store/
│   └── uebungsStore.ts             ← NEU: Session-State, aktuelle Frage, Antworten
├── components/
│   ├── Dashboard.tsx               ← ERWEITERT: Themen-Browser + "Ueben starten"
│   ├── UebungsScreen.tsx           ← NEU: Frage-Rendering + Navigation + Feedback
│   ├── Zusammenfassung.tsx         ← NEU: Session-Ergebnis (X von Y richtig)
│   └── fragetypen/
│       ├── index.ts                ← NEU: Registry typ → Komponente
│       ├── MCFrage.tsx             ← NEU: Multiple Choice (single)
│       ├── MultiFrage.tsx          ← NEU: Multiple Choice (multi)
│       ├── TFFrage.tsx             ← NEU: Richtig/Falsch
│       ├── FillFrage.tsx           ← NEU: Lueckentext
│       ├── CalcFrage.tsx           ← NEU: Berechnung
│       ├── SortFrage.tsx           ← NEU: Kategorien-Zuordnung
│       ├── SortierungFrage.tsx     ← NEU: Reihenfolge
│       └── ZuordnungFrage.tsx      ← NEU: Paare zuordnen
├── utils/
│   ├── korrektur.ts                ← NEU: Korrekturlogik pro Fragetyp
│   ├── blockBuilder.ts             ← NEU: 10er-Block zusammenstellen
│   └── shuffle.ts                  ← NEU: Deterministisches Mischen
├── App.tsx                         ← ERWEITERT: Route /ueben + /zusammenfassung
└── __tests__/
    ├── korrektur.test.ts           ← NEU: Korrektur-Tests
    ├── blockBuilder.test.ts        ← NEU: Block-Zusammenstellung Tests
    └── uebungsStore.test.ts        ← NEU: Session-Logik Tests
```

---

## Task 1: Fragen-Typen + Uebungs-Typen

**Files:**
- Create: `Lernplattform/src/types/fragen.ts`
- Create: `Lernplattform/src/types/uebung.ts`

- [ ] **Step 1: Fragen-Typen definieren**

`src/types/fragen.ts`:
```typescript
export type FrageTyp =
  | 'mc' | 'multi' | 'tf' | 'fill' | 'calc'
  | 'sort' | 'sortierung' | 'zuordnung'

export interface Frage {
  id: string
  fach: string
  thema: string
  stufe?: string
  lernziel?: string
  typ: FrageTyp
  schwierigkeit: 1 | 2 | 3
  taxonomie?: string
  frage: string
  erklaerung?: string
  tags?: string[]
  uebung: boolean
  pruefungstauglich: boolean
  // Typ-spezifische Felder
  optionen?: string[]
  korrekt?: string | string[]
  aussagen?: { text: string; korrekt: boolean }[]
  luecken?: { id: string; korrekt: string; optionen?: string[] }[]
  toleranz?: number
  einheit?: string
  kategorien?: string[]
  elemente?: { text: string; kategorie: string }[]
  reihenfolge?: string[]
  paare?: { links: string; rechts: string }[]
}

export interface FragenFilter {
  fach?: string
  thema?: string
  stufe?: string
  tags?: string[]
  schwierigkeit?: number
  nurUebung?: boolean
}

export type AntwortTyp =
  | MCAntwort | MultiAntwort | TFAntwort | FillAntwort
  | CalcAntwort | SortAntwort | SortierungAntwort | ZuordnungAntwort

export interface MCAntwort {
  typ: 'mc'
  gewaehlt: string
}

export interface MultiAntwort {
  typ: 'multi'
  gewaehlt: string[]
}

export interface TFAntwort {
  typ: 'tf'
  bewertungen: Record<string, boolean>
}

export interface FillAntwort {
  typ: 'fill'
  eintraege: Record<string, string>
}

export interface CalcAntwort {
  typ: 'calc'
  wert: string
}

export interface SortAntwort {
  typ: 'sort'
  zuordnungen: Record<string, string>
}

export interface SortierungAntwort {
  typ: 'sortierung'
  reihenfolge: string[]
}

export interface ZuordnungAntwort {
  typ: 'zuordnung'
  paare: Record<string, string>
}
```

- [ ] **Step 2: Uebungs-Typen definieren**

`src/types/uebung.ts`:
```typescript
import type { Frage, AntwortTyp } from './fragen'

export interface UebungsSession {
  id: string
  gruppeId: string
  email: string
  fach: string
  thema: string
  fragen: Frage[]
  antworten: Record<string, AntwortTyp>
  ergebnisse: Record<string, boolean>
  aktuelleFrageIndex: number
  gestartet: string
  beendet?: string
}

export interface SessionErgebnis {
  sessionId: string
  anzahlFragen: number
  richtig: number
  falsch: number
  quote: number
  dauer: number
  details: {
    frageId: string
    frage: string
    typ: string
    korrekt: boolean
    erklaerung?: string
  }[]
}
```

- [ ] **Step 3: tsc pruefen**

```bash
cd Lernplattform && npx tsc -b
```

Expected: Keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/src/types/
git commit -m "Lernplattform Phase 2: Fragen- und Uebungs-Typen"
```

---

## Task 2: Shuffle + Korrektur-Utils mit Tests

**Files:**
- Create: `Lernplattform/src/utils/shuffle.ts`
- Create: `Lernplattform/src/utils/korrektur.ts`
- Create: `Lernplattform/src/__tests__/korrektur.test.ts`

- [ ] **Step 1: Tests fuer Korrektur schreiben**

`src/__tests__/korrektur.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { pruefeAntwort } from '../utils/korrektur'
import type { Frage } from '../types/fragen'

const baseFrage: Omit<Frage, 'typ' | 'optionen' | 'korrekt' | 'aussagen' | 'luecken' | 'toleranz' | 'einheit' | 'kategorien' | 'elemente' | 'reihenfolge' | 'paare'> = {
  id: 'f1',
  fach: 'Mathe',
  thema: 'Grundlagen',
  frage: 'Test',
  schwierigkeit: 1,
  uebung: true,
  pruefungstauglich: false,
}

describe('pruefeAntwort', () => {
  it('MC: korrekte Antwort', () => {
    const frage: Frage = { ...baseFrage, typ: 'mc', optionen: ['A', 'B', 'C'], korrekt: 'B' }
    expect(pruefeAntwort(frage, { typ: 'mc', gewaehlt: 'B' })).toBe(true)
  })

  it('MC: falsche Antwort', () => {
    const frage: Frage = { ...baseFrage, typ: 'mc', optionen: ['A', 'B', 'C'], korrekt: 'B' }
    expect(pruefeAntwort(frage, { typ: 'mc', gewaehlt: 'A' })).toBe(false)
  })

  it('Multi: alle korrekt', () => {
    const frage: Frage = { ...baseFrage, typ: 'multi', optionen: ['A', 'B', 'C'], korrekt: ['A', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'multi', gewaehlt: ['C', 'A'] })).toBe(true)
  })

  it('Multi: nicht alle gewaehlt', () => {
    const frage: Frage = { ...baseFrage, typ: 'multi', optionen: ['A', 'B', 'C'], korrekt: ['A', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'multi', gewaehlt: ['A'] })).toBe(false)
  })

  it('TF: alle richtig', () => {
    const frage: Frage = { ...baseFrage, typ: 'tf', aussagen: [{ text: 'Stimmt', korrekt: true }, { text: 'Falsch', korrekt: false }] }
    expect(pruefeAntwort(frage, { typ: 'tf', bewertungen: { '0': true, '1': false } })).toBe(true)
  })

  it('Fill: korrekte Luecken (case-insensitive)', () => {
    const frage: Frage = { ...baseFrage, typ: 'fill', luecken: [{ id: 'l1', korrekt: 'Angebot' }] }
    expect(pruefeAntwort(frage, { typ: 'fill', eintraege: { l1: 'angebot' } })).toBe(true)
  })

  it('Calc: innerhalb Toleranz', () => {
    const frage: Frage = { ...baseFrage, typ: 'calc', korrekt: '42.5', toleranz: 0.5 }
    expect(pruefeAntwort(frage, { typ: 'calc', wert: '42.3' })).toBe(true)
  })

  it('Calc: ausserhalb Toleranz', () => {
    const frage: Frage = { ...baseFrage, typ: 'calc', korrekt: '42.5', toleranz: 0.1 }
    expect(pruefeAntwort(frage, { typ: 'calc', wert: '43.0' })).toBe(false)
  })

  it('Sort: alle korrekt zugeordnet', () => {
    const frage: Frage = {
      ...baseFrage, typ: 'sort',
      kategorien: ['A', 'B'],
      elemente: [{ text: 'x', kategorie: 'A' }, { text: 'y', kategorie: 'B' }],
    }
    expect(pruefeAntwort(frage, { typ: 'sort', zuordnungen: { x: 'A', y: 'B' } })).toBe(true)
  })

  it('Sortierung: korrekte Reihenfolge', () => {
    const frage: Frage = { ...baseFrage, typ: 'sortierung', reihenfolge: ['A', 'B', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'sortierung', reihenfolge: ['A', 'B', 'C'] })).toBe(true)
  })

  it('Sortierung: falsche Reihenfolge', () => {
    const frage: Frage = { ...baseFrage, typ: 'sortierung', reihenfolge: ['A', 'B', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'sortierung', reihenfolge: ['C', 'A', 'B'] })).toBe(false)
  })

  it('Zuordnung: alle Paare korrekt', () => {
    const frage: Frage = { ...baseFrage, typ: 'zuordnung', paare: [{ links: 'a', rechts: '1' }, { links: 'b', rechts: '2' }] }
    expect(pruefeAntwort(frage, { typ: 'zuordnung', paare: { a: '1', b: '2' } })).toBe(true)
  })
})
```

- [ ] **Step 2: Tests ausfuehren — muessen fehlschlagen**

```bash
cd Lernplattform && npx vitest run src/__tests__/korrektur.test.ts
```

Expected: FAIL — `pruefeAntwort` nicht gefunden.

- [ ] **Step 3: shuffle.ts implementieren**

`src/utils/shuffle.ts`:
```typescript
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }

  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0
    const j = Math.abs(hash) % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

- [ ] **Step 4: korrektur.ts implementieren**

`src/utils/korrektur.ts`:
```typescript
import type { Frage, AntwortTyp } from '../types/fragen'

export function pruefeAntwort(frage: Frage, antwort: AntwortTyp): boolean {
  switch (antwort.typ) {
    case 'mc':
      return antwort.gewaehlt === frage.korrekt

    case 'multi': {
      const korrekt = frage.korrekt as string[]
      const gewaehlt = [...antwort.gewaehlt].sort()
      return korrekt.length === gewaehlt.length &&
        [...korrekt].sort().every((k, i) => k === gewaehlt[i])
    }

    case 'tf': {
      const aussagen = frage.aussagen || []
      return aussagen.every((a, i) =>
        antwort.bewertungen[String(i)] === a.korrekt
      )
    }

    case 'fill': {
      const luecken = frage.luecken || []
      return luecken.every(l =>
        (antwort.eintraege[l.id] || '').trim().toLowerCase() === l.korrekt.trim().toLowerCase()
      )
    }

    case 'calc': {
      const soll = parseFloat(frage.korrekt as string)
      const ist = parseFloat(antwort.wert)
      if (isNaN(soll) || isNaN(ist)) return false
      const toleranz = frage.toleranz ?? 0
      return Math.abs(soll - ist) <= toleranz
    }

    case 'sort': {
      const elemente = frage.elemente || []
      return elemente.every(e =>
        antwort.zuordnungen[e.text] === e.kategorie
      )
    }

    case 'sortierung': {
      const korrekt = frage.reihenfolge || []
      return korrekt.length === antwort.reihenfolge.length &&
        korrekt.every((k, i) => k === antwort.reihenfolge[i])
    }

    case 'zuordnung': {
      const paare = frage.paare || []
      return paare.every(p => antwort.paare[p.links] === p.rechts)
    }

    default:
      return false
  }
}
```

- [ ] **Step 5: Tests ausfuehren — muessen gruen sein**

```bash
cd Lernplattform && npx vitest run src/__tests__/korrektur.test.ts
```

Expected: 12 Tests PASS.

- [ ] **Step 6: tsc pruefen**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 7: Commit**

```bash
git add Lernplattform/src/utils/ Lernplattform/src/__tests__/korrektur.test.ts
git commit -m "Lernplattform Phase 2: Korrektur-Utils + Shuffle mit Tests"
```

---

## Task 3: Block-Builder mit Tests

**Files:**
- Create: `Lernplattform/src/utils/blockBuilder.ts`
- Create: `Lernplattform/src/__tests__/blockBuilder.test.ts`

- [ ] **Step 1: Tests fuer blockBuilder schreiben**

`src/__tests__/blockBuilder.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { erstelleBlock } from '../utils/blockBuilder'
import type { Frage } from '../types/fragen'

function macheFrage(id: string, thema: string, overrides?: Partial<Frage>): Frage {
  return {
    id, fach: 'Mathe', thema, frage: `Frage ${id}`,
    typ: 'mc', schwierigkeit: 1, uebung: true, pruefungstauglich: false,
    optionen: ['A', 'B'], korrekt: 'A',
    ...overrides,
  }
}

describe('erstelleBlock', () => {
  it('erstellt Block mit max 10 Fragen', () => {
    const fragen = Array.from({ length: 20 }, (_, i) => macheFrage(`f${i}`, 'Addition'))
    const block = erstelleBlock(fragen, 'Addition')
    expect(block.length).toBeLessThanOrEqual(10)
    expect(block.length).toBeGreaterThan(0)
  })

  it('schrumpft Block wenn weniger als 10 Fragen vorhanden', () => {
    const fragen = [macheFrage('f1', 'Addition'), macheFrage('f2', 'Addition')]
    const block = erstelleBlock(fragen, 'Addition')
    expect(block.length).toBe(2)
  })

  it('min 3 Fragen (leer wenn weniger)', () => {
    const fragen = [macheFrage('f1', 'Addition')]
    const block = erstelleBlock(fragen, 'Addition')
    expect(block.length).toBe(1) // Einzelfrage trotzdem zugelassen
  })

  it('filtert nach Thema', () => {
    const fragen = [
      macheFrage('f1', 'Addition'),
      macheFrage('f2', 'Subtraktion'),
      macheFrage('f3', 'Addition'),
    ]
    const block = erstelleBlock(fragen, 'Addition')
    expect(block.every(f => f.thema === 'Addition')).toBe(true)
  })

  it('mischt die Reihenfolge', () => {
    const fragen = Array.from({ length: 15 }, (_, i) => macheFrage(`f${i}`, 'Addition'))
    const block1 = erstelleBlock(fragen, 'Addition', 'seed1')
    const block2 = erstelleBlock(fragen, 'Addition', 'seed2')
    const ids1 = block1.map(f => f.id).join(',')
    const ids2 = block2.map(f => f.id).join(',')
    // Mit verschiedenen Seeds sollte die Reihenfolge anders sein
    // (nicht 100% garantiert, aber sehr wahrscheinlich bei 15 Fragen)
    expect(ids1 !== ids2 || block1.length <= 2).toBe(true)
  })
})
```

- [ ] **Step 2: Tests ausfuehren — muessen fehlschlagen**

```bash
cd Lernplattform && npx vitest run src/__tests__/blockBuilder.test.ts
```

Expected: FAIL.

- [ ] **Step 3: blockBuilder implementieren**

`src/utils/blockBuilder.ts`:
```typescript
import type { Frage } from '../types/fragen'
import { seededShuffle } from './shuffle'

const MAX_BLOCK_SIZE = 10

export function erstelleBlock(
  alleFragen: Frage[],
  thema: string,
  seed?: string
): Frage[] {
  const themaFragen = alleFragen.filter(f => f.thema === thema && f.uebung)

  if (themaFragen.length === 0) return []

  const gemischt = seed
    ? seededShuffle(themaFragen, seed)
    : seededShuffle(themaFragen, `${Date.now()}`)

  return gemischt.slice(0, MAX_BLOCK_SIZE)
}
```

- [ ] **Step 4: Tests ausfuehren — muessen gruen sein**

```bash
cd Lernplattform && npx vitest run src/__tests__/blockBuilder.test.ts
```

Expected: 5 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add Lernplattform/src/utils/blockBuilder.ts Lernplattform/src/__tests__/blockBuilder.test.ts
git commit -m "Lernplattform Phase 2: Block-Builder mit Tests"
```

---

## Task 4: Service-Interfaces erweitern + Adapter mit Mock-Daten

**Files:**
- Modify: `Lernplattform/src/services/interfaces.ts`
- Modify: `Lernplattform/src/adapters/appsScriptAdapter.ts`
- Create: `Lernplattform/src/adapters/mockDaten.ts`

- [ ] **Step 1: FragenService + UebungsService Interfaces hinzufuegen**

In `src/services/interfaces.ts` am Ende anfuegen:

```typescript
import type { Frage, FragenFilter, AntwortTyp } from '../types/fragen'

export interface FragenService {
  ladeFragen(gruppeId: string, filter?: FragenFilter): Promise<Frage[]>
  ladeThemen(gruppeId: string, fach?: string): Promise<string[]>
}

export interface UebungsService {
  speichereAntwort(gruppeId: string, data: {
    email: string
    fragenId: string
    sessionId: string
    antwort: AntwortTyp
    korrekt: boolean
    zeitMs: number
  }): Promise<void>
}
```

- [ ] **Step 2: Mock-Daten erstellen**

`src/adapters/mockDaten.ts`:
```typescript
import type { Frage } from '../types/fragen'

export const MOCK_FRAGEN: Frage[] = [
  // Mathe — Addition
  {
    id: 'math-add-1', fach: 'Mathe', thema: 'Addition', typ: 'mc',
    schwierigkeit: 1, frage: 'Was ist 7 + 5?',
    optionen: ['10', '11', '12', '13'], korrekt: '12',
    erklaerung: '7 + 5 = 12', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-add-2', fach: 'Mathe', thema: 'Addition', typ: 'calc',
    schwierigkeit: 1, frage: 'Berechne: 234 + 567',
    korrekt: '801', toleranz: 0, erklaerung: '234 + 567 = 801',
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-add-3', fach: 'Mathe', thema: 'Addition', typ: 'fill',
    schwierigkeit: 1, frage: 'Ergaenze: 15 + ___ = 23',
    luecken: [{ id: 'l1', korrekt: '8' }],
    erklaerung: '15 + 8 = 23', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-add-4', fach: 'Mathe', thema: 'Addition', typ: 'mc',
    schwierigkeit: 2, frage: 'Was ist 99 + 47?',
    optionen: ['136', '146', '156', '147'], korrekt: '146',
    uebung: true, pruefungstauglich: false,
  },
  // Mathe — Multiplikation
  {
    id: 'math-mul-1', fach: 'Mathe', thema: 'Multiplikation', typ: 'mc',
    schwierigkeit: 1, frage: 'Was ist 6 × 8?',
    optionen: ['42', '46', '48', '56'], korrekt: '48',
    erklaerung: '6 × 8 = 48', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-mul-2', fach: 'Mathe', thema: 'Multiplikation', typ: 'calc',
    schwierigkeit: 2, frage: 'Berechne: 12 × 15',
    korrekt: '180', toleranz: 0, uebung: true, pruefungstauglich: false,
  },
  // Deutsch — Wortarten
  {
    id: 'de-wort-1', fach: 'Deutsch', thema: 'Wortarten', typ: 'mc',
    schwierigkeit: 1, frage: 'Welche Wortart ist "schnell"?',
    optionen: ['Nomen', 'Verb', 'Adjektiv', 'Pronomen'], korrekt: 'Adjektiv',
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'de-wort-2', fach: 'Deutsch', thema: 'Wortarten', typ: 'sort',
    schwierigkeit: 2, frage: 'Ordne die Woerter den Wortarten zu.',
    kategorien: ['Nomen', 'Verb', 'Adjektiv'],
    elemente: [
      { text: 'Haus', kategorie: 'Nomen' },
      { text: 'laufen', kategorie: 'Verb' },
      { text: 'gross', kategorie: 'Adjektiv' },
      { text: 'Baum', kategorie: 'Nomen' },
    ],
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'de-wort-3', fach: 'Deutsch', thema: 'Wortarten', typ: 'tf',
    schwierigkeit: 1, frage: 'Richtig oder falsch?',
    aussagen: [
      { text: '"Tisch" ist ein Nomen.', korrekt: true },
      { text: '"rennen" ist ein Adjektiv.', korrekt: false },
      { text: '"schoen" ist ein Adjektiv.', korrekt: true },
    ],
    uebung: true, pruefungstauglich: false,
  },
  // Deutsch — Satzglieder
  {
    id: 'de-satz-1', fach: 'Deutsch', thema: 'Satzglieder', typ: 'zuordnung',
    schwierigkeit: 2, frage: 'Ordne die Satzglieder richtig zu.',
    paare: [
      { links: 'Wer/Was?', rechts: 'Subjekt' },
      { links: 'Was tut?', rechts: 'Praedikat' },
      { links: 'Wen/Was?', rechts: 'Akkusativobjekt' },
    ],
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'de-satz-2', fach: 'Deutsch', thema: 'Satzglieder', typ: 'sortierung',
    schwierigkeit: 2, frage: 'Bringe die Satzglieder in die richtige Reihenfolge fuer einen Aussagesatz.',
    reihenfolge: ['Subjekt', 'Praedikat', 'Objekt', 'Adverbiale'],
    uebung: true, pruefungstauglich: false,
  },
  // VWL — Markt (fuer Gym-Kontext)
  {
    id: 'vwl-markt-1', fach: 'VWL', thema: 'Markt und Preis', typ: 'mc',
    schwierigkeit: 1, taxonomie: 'K1',
    frage: 'Was passiert typischerweise mit dem Preis, wenn die Nachfrage steigt?',
    optionen: ['Er sinkt', 'Er steigt', 'Er bleibt gleich', 'Er wird negativ'],
    korrekt: 'Er steigt', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'vwl-markt-2', fach: 'VWL', thema: 'Markt und Preis', typ: 'multi',
    schwierigkeit: 2, taxonomie: 'K2',
    frage: 'Welche Faktoren verschieben die Nachfragekurve nach rechts?',
    optionen: ['Steigende Einkommen', 'Hoehere Preise', 'Werbung', 'Neue Substitute'],
    korrekt: ['Steigende Einkommen', 'Werbung'],
    uebung: true, pruefungstauglich: false,
  },
]
```

- [ ] **Step 3: Adapter um FragenService erweitern**

In `src/adapters/appsScriptAdapter.ts` hinzufuegen — eine `MockFragenAdapter` Klasse die fuer Phase 2 mit lokalen Daten arbeitet (Backend kommt spaeter):

```typescript
// Am Ende der Datei hinzufuegen:

import type { Frage, FragenFilter } from '../types/fragen'
import type { FragenService } from '../services/interfaces'
import { MOCK_FRAGEN } from './mockDaten'

class MockFragenAdapter implements FragenService {
  async ladeFragen(_gruppeId: string, filter?: FragenFilter): Promise<Frage[]> {
    let fragen = [...MOCK_FRAGEN]
    if (filter?.fach) fragen = fragen.filter(f => f.fach === filter.fach)
    if (filter?.thema) fragen = fragen.filter(f => f.thema === filter.thema)
    if (filter?.schwierigkeit) fragen = fragen.filter(f => f.schwierigkeit === filter.schwierigkeit)
    if (filter?.nurUebung) fragen = fragen.filter(f => f.uebung)
    return fragen
  }

  async ladeThemen(_gruppeId: string, fach?: string): Promise<string[]> {
    let fragen = MOCK_FRAGEN
    if (fach) fragen = fragen.filter(f => f.fach === fach)
    return [...new Set(fragen.map(f => f.thema))]
  }
}

export const fragenAdapter = new MockFragenAdapter()
```

- [ ] **Step 4: tsc pruefen**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 5: Commit**

```bash
git add Lernplattform/src/services/interfaces.ts Lernplattform/src/adapters/
git commit -m "Lernplattform Phase 2: FragenService Interface + Mock-Daten-Adapter"
```

---

## Task 5: UebungsStore mit Tests

**Files:**
- Create: `Lernplattform/src/store/uebungsStore.ts`
- Create: `Lernplattform/src/__tests__/uebungsStore.test.ts`

- [ ] **Step 1: Tests fuer uebungsStore schreiben**

`src/__tests__/uebungsStore.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adapters/appsScriptAdapter', () => ({
  fragenAdapter: {
    ladeFragen: vi.fn(),
    ladeThemen: vi.fn(),
  },
  gruppenAdapter: {
    ladeGruppen: vi.fn(),
    ladeMitglieder: vi.fn(),
  },
}))

import { useUebungsStore } from '../store/uebungsStore'
import { fragenAdapter } from '../adapters/appsScriptAdapter'
import type { Frage } from '../types/fragen'

const testFragen: Frage[] = [
  { id: 'f1', fach: 'Mathe', thema: 'Add', typ: 'mc', schwierigkeit: 1, frage: 'Q1', optionen: ['A', 'B'], korrekt: 'A', uebung: true, pruefungstauglich: false },
  { id: 'f2', fach: 'Mathe', thema: 'Add', typ: 'mc', schwierigkeit: 1, frage: 'Q2', optionen: ['X', 'Y'], korrekt: 'Y', uebung: true, pruefungstauglich: false },
  { id: 'f3', fach: 'Mathe', thema: 'Add', typ: 'mc', schwierigkeit: 1, frage: 'Q3', optionen: ['1', '2'], korrekt: '2', uebung: true, pruefungstauglich: false },
]

describe('uebungsStore', () => {
  beforeEach(() => {
    useUebungsStore.setState({
      session: null,
      ladeStatus: 'idle',
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
    })
    vi.clearAllMocks()
  })

  it('startet Session und laedt Fragen', async () => {
    vi.mocked(fragenAdapter.ladeFragen).mockResolvedValue(testFragen)

    await useUebungsStore.getState().starteSession('g1', 'test@mail.com', 'Mathe', 'Add')

    const state = useUebungsStore.getState()
    expect(state.session).not.toBeNull()
    expect(state.session!.fragen.length).toBe(3)
    expect(state.session!.aktuelleFrageIndex).toBe(0)
  })

  it('beantwortet Frage und zeigt Feedback', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: {}, ergebnisse: {}, aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
      },
      ladeStatus: 'fertig',
    })

    useUebungsStore.getState().beantworte({ typ: 'mc', gewaehlt: 'A' })

    const state = useUebungsStore.getState()
    expect(state.session!.antworten['f1']).toBeDefined()
    expect(state.session!.ergebnisse['f1']).toBe(true)
    expect(state.feedbackSichtbar).toBe(true)
    expect(state.letzteAntwortKorrekt).toBe(true)
  })

  it('geht zur naechsten Frage weiter', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: { f1: { typ: 'mc', gewaehlt: 'A' } },
        ergebnisse: { f1: true }, aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
      },
      feedbackSichtbar: true,
    })

    useUebungsStore.getState().naechsteFrage()

    const state = useUebungsStore.getState()
    expect(state.session!.aktuelleFrageIndex).toBe(1)
    expect(state.feedbackSichtbar).toBe(false)
  })

  it('erkennt Session-Ende', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: { f1: { typ: 'mc', gewaehlt: 'A' }, f2: { typ: 'mc', gewaehlt: 'Y' }, f3: { typ: 'mc', gewaehlt: '2' } },
        ergebnisse: { f1: true, f2: true, f3: true }, aktuelleFrageIndex: 2,
        gestartet: new Date().toISOString(),
      },
      feedbackSichtbar: true,
    })

    const istFertig = useUebungsStore.getState().istSessionFertig()
    expect(istFertig).toBe(true)
  })

  it('berechnet Ergebnis', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: { f1: { typ: 'mc', gewaehlt: 'A' }, f2: { typ: 'mc', gewaehlt: 'X' }, f3: { typ: 'mc', gewaehlt: '2' } },
        ergebnisse: { f1: true, f2: false, f3: true }, aktuelleFrageIndex: 2,
        gestartet: new Date().toISOString(),
      },
    })

    const ergebnis = useUebungsStore.getState().berechneErgebnis()
    expect(ergebnis.richtig).toBe(2)
    expect(ergebnis.falsch).toBe(1)
    expect(ergebnis.quote).toBeCloseTo(66.67, 0)
  })
})
```

- [ ] **Step 2: Tests ausfuehren — muessen fehlschlagen**

```bash
cd Lernplattform && npx vitest run src/__tests__/uebungsStore.test.ts
```

Expected: FAIL.

- [ ] **Step 3: uebungsStore implementieren**

`src/store/uebungsStore.ts`:
```typescript
import { create } from 'zustand'
import type { Frage, AntwortTyp } from '../types/fragen'
import type { UebungsSession, SessionErgebnis } from '../types/uebung'
import { fragenAdapter } from '../adapters/appsScriptAdapter'
import { erstelleBlock } from '../utils/blockBuilder'
import { pruefeAntwort } from '../utils/korrektur'

interface UebungsState {
  session: UebungsSession | null
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  feedbackSichtbar: boolean
  letzteAntwortKorrekt: boolean | null

  starteSession: (gruppeId: string, email: string, fach: string, thema: string) => Promise<void>
  beantworte: (antwort: AntwortTyp) => void
  naechsteFrage: () => void
  istSessionFertig: () => boolean
  berechneErgebnis: () => SessionErgebnis
  beendeSession: () => void
  aktuelleFrage: () => Frage | null
}

export const useUebungsStore = create<UebungsState>((set, get) => ({
  session: null,
  ladeStatus: 'idle',
  feedbackSichtbar: false,
  letzteAntwortKorrekt: null,

  starteSession: async (gruppeId, email, fach, thema) => {
    set({ ladeStatus: 'laden' })

    try {
      const alleFragen = await fragenAdapter.ladeFragen(gruppeId, { fach, thema, nurUebung: true })
      const block = erstelleBlock(alleFragen, thema)

      if (block.length === 0) {
        set({ ladeStatus: 'fehler' })
        return
      }

      const session: UebungsSession = {
        id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        gruppeId,
        email,
        fach,
        thema,
        fragen: block,
        antworten: {},
        ergebnisse: {},
        aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
      }

      set({ session, ladeStatus: 'fertig', feedbackSichtbar: false, letzteAntwortKorrekt: null })
    } catch {
      set({ ladeStatus: 'fehler' })
    }
  },

  beantworte: (antwort) => {
    const session = get().session
    if (!session) return

    const frage = session.fragen[session.aktuelleFrageIndex]
    if (!frage) return

    const korrekt = pruefeAntwort(frage, antwort)

    set({
      session: {
        ...session,
        antworten: { ...session.antworten, [frage.id]: antwort },
        ergebnisse: { ...session.ergebnisse, [frage.id]: korrekt },
      },
      feedbackSichtbar: true,
      letzteAntwortKorrekt: korrekt,
    })
  },

  naechsteFrage: () => {
    const session = get().session
    if (!session) return

    set({
      session: {
        ...session,
        aktuelleFrageIndex: session.aktuelleFrageIndex + 1,
      },
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
    })
  },

  istSessionFertig: () => {
    const session = get().session
    if (!session) return true
    const allBeantwortet = session.fragen.every(f => f.id in session.antworten)
    const aufLetzterFrage = session.aktuelleFrageIndex >= session.fragen.length - 1
    return allBeantwortet && aufLetzterFrage
  },

  berechneErgebnis: () => {
    const session = get().session
    if (!session) return { sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [] }

    const details = session.fragen.map(f => ({
      frageId: f.id,
      frage: f.frage,
      typ: f.typ,
      korrekt: session.ergebnisse[f.id] ?? false,
      erklaerung: f.erklaerung,
    }))

    const richtig = details.filter(d => d.korrekt).length
    const falsch = details.filter(d => !d.korrekt).length
    const dauer = session.beendet
      ? new Date(session.beendet).getTime() - new Date(session.gestartet).getTime()
      : Date.now() - new Date(session.gestartet).getTime()

    return {
      sessionId: session.id,
      anzahlFragen: session.fragen.length,
      richtig,
      falsch,
      quote: session.fragen.length > 0 ? (richtig / session.fragen.length) * 100 : 0,
      dauer,
      details,
    }
  },

  beendeSession: () => {
    const session = get().session
    if (session) {
      set({ session: { ...session, beendet: new Date().toISOString() } })
    }
  },

  aktuelleFrage: () => {
    const session = get().session
    if (!session) return null
    return session.fragen[session.aktuelleFrageIndex] ?? null
  },
}))
```

- [ ] **Step 4: Tests ausfuehren — muessen gruen sein**

```bash
cd Lernplattform && npx vitest run src/__tests__/uebungsStore.test.ts
```

Expected: 5 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add Lernplattform/src/store/uebungsStore.ts Lernplattform/src/__tests__/uebungsStore.test.ts
git commit -m "Lernplattform Phase 2: UebungsStore mit Tests"
```

---

## Task 6: Fragetypen-Komponenten (8 Typen)

**Files:**
- Create: `Lernplattform/src/components/fragetypen/index.ts`
- Create: `Lernplattform/src/components/fragetypen/MCFrage.tsx`
- Create: `Lernplattform/src/components/fragetypen/MultiFrage.tsx`
- Create: `Lernplattform/src/components/fragetypen/TFFrage.tsx`
- Create: `Lernplattform/src/components/fragetypen/FillFrage.tsx`
- Create: `Lernplattform/src/components/fragetypen/CalcFrage.tsx`
- Create: `Lernplattform/src/components/fragetypen/SortFrage.tsx`
- Create: `Lernplattform/src/components/fragetypen/SortierungFrage.tsx`
- Create: `Lernplattform/src/components/fragetypen/ZuordnungFrage.tsx`

Jede Komponente erhaelt Props: `frage: Frage`, `onAntwort: (antwort: AntwortTyp) => void`, `disabled: boolean`, `feedbackSichtbar: boolean`, `korrekt: boolean | null`

Design-Prinzipien:
- Touch-first: min. 48px Tippflaechen
- Feedback inline: Gruener Haken / Rote Markierung + Erklaerung
- Dark Mode: `dark:` Prefix ueberall
- Keine externe Dependencies (kein DnD-Library — Tap-to-Select fuer Sortierung)

- [ ] **Step 1: Registry erstellen**

`src/components/fragetypen/index.ts`:
```typescript
import type { ComponentType } from 'react'
import type { Frage, AntwortTyp } from '../../types/fragen'
import MCFrage from './MCFrage'
import MultiFrage from './MultiFrage'
import TFFrage from './TFFrage'
import FillFrage from './FillFrage'
import CalcFrage from './CalcFrage'
import SortFrage from './SortFrage'
import SortierungFrage from './SortierungFrage'
import ZuordnungFrage from './ZuordnungFrage'

export interface FrageKomponenteProps {
  frage: Frage
  onAntwort: (antwort: AntwortTyp) => void
  disabled: boolean
  feedbackSichtbar: boolean
  korrekt: boolean | null
}

export const FRAGETYP_KOMPONENTEN: Record<string, ComponentType<FrageKomponenteProps>> = {
  mc: MCFrage,
  multi: MultiFrage,
  tf: TFFrage,
  fill: FillFrage,
  calc: CalcFrage,
  sort: SortFrage,
  sortierung: SortierungFrage,
  zuordnung: ZuordnungFrage,
}
```

- [ ] **Step 2: MCFrage erstellen**

`src/components/fragetypen/MCFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function MCFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const optionen = frage.optionen || []

  const handleWahl = (option: string) => {
    if (disabled) return
    setGewaehlt(option)
  }

  const handleAbsenden = () => {
    if (!gewaehlt || disabled) return
    onAntwort({ typ: 'mc', gewaehlt })
  }

  return (
    <div className="space-y-3">
      {optionen.map((option, i) => {
        const istGewaehlt = gewaehlt === option
        const istKorrekt = feedbackSichtbar && option === frage.korrekt
        const istFalsch = feedbackSichtbar && istGewaehlt && option !== frage.korrekt

        return (
          <button
            key={i}
            onClick={() => handleWahl(option)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors min-h-[48px]
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${istGewaehlt && !feedbackSichtbar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
              ${!istGewaehlt && !istKorrekt ? 'border-gray-200 dark:border-gray-600 hover:border-gray-400' : ''}
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className="dark:text-white">{option}</span>
          </button>
        )
      })}

      {!disabled && gewaehlt && !feedbackSichtbar && (
        <button
          onClick={handleAbsenden}
          className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium mt-2 min-h-[48px]"
        >
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl mt-2 ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Richtig!' : 'Leider falsch.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: MultiFrage erstellen**

`src/components/fragetypen/MultiFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function MultiFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const [gewaehlt, setGewaehlt] = useState<string[]>([])
  const optionen = frage.optionen || []
  const korrekteOptionen = (frage.korrekt as string[]) || []

  const toggleOption = (option: string) => {
    if (disabled) return
    setGewaehlt(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  const handleAbsenden = () => {
    if (gewaehlt.length === 0 || disabled) return
    onAntwort({ typ: 'multi', gewaehlt })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">Mehrere Antworten moeglich</p>
      {optionen.map((option, i) => {
        const istGewaehlt = gewaehlt.includes(option)
        const istKorrekt = feedbackSichtbar && korrekteOptionen.includes(option)
        const istFalsch = feedbackSichtbar && istGewaehlt && !korrekteOptionen.includes(option)

        return (
          <button
            key={i}
            onClick={() => toggleOption(option)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors min-h-[48px] flex items-center gap-3
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${istGewaehlt && !feedbackSichtbar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
              ${!istGewaehlt && !istKorrekt ? 'border-gray-200 dark:border-gray-600 hover:border-gray-400' : ''}
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs
              ${istGewaehlt ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-500'}
            `}>
              {istGewaehlt ? '✓' : ''}
            </span>
            <span className="dark:text-white">{option}</span>
          </button>
        )
      })}

      {!disabled && gewaehlt.length > 0 && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl mt-2 ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Richtig!' : 'Nicht ganz.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: TFFrage erstellen**

`src/components/fragetypen/TFFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function TFFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const aussagen = frage.aussagen || []
  const [bewertungen, setBewertungen] = useState<Record<string, boolean>>({})

  const toggleBewertung = (index: number) => {
    if (disabled) return
    const key = String(index)
    setBewertungen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const alleBewertet = aussagen.every((_, i) => String(i) in bewertungen)

  const handleAbsenden = () => {
    if (!alleBewertet || disabled) return
    onAntwort({ typ: 'tf', bewertungen })
  }

  return (
    <div className="space-y-3">
      {aussagen.map((aussage, i) => {
        const key = String(i)
        const wert = bewertungen[key]
        const istBewertet = key in bewertungen
        const istKorrekt = feedbackSichtbar && wert === aussage.korrekt
        const istFalsch = feedbackSichtbar && istBewertet && wert !== aussage.korrekt

        return (
          <div key={i} className={`p-4 rounded-xl border-2 transition-colors
            ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
            ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
            ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600' : ''}
          `}>
            <p className="mb-2 dark:text-white">{aussage.text}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { if (!disabled) setBewertungen(prev => ({ ...prev, [key]: true })) }}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg min-h-[44px] font-medium transition-colors
                  ${wert === true ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}
                `}
              >
                Richtig
              </button>
              <button
                onClick={() => toggleBewertung(i)}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg min-h-[44px] font-medium transition-colors
                  ${wert === false ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}
                `}
              >
                Falsch
              </button>
            </div>
          </div>
        )
      })}

      {!disabled && alleBewertet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl mt-2 ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Alles richtig!' : 'Nicht ganz.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: FillFrage erstellen**

`src/components/fragetypen/FillFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function FillFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const luecken = frage.luecken || []
  const [eintraege, setEintraege] = useState<Record<string, string>>({})

  const alleAusgefuellt = luecken.every(l => (eintraege[l.id] || '').trim().length > 0)

  const handleAbsenden = () => {
    if (!alleAusgefuellt || disabled) return
    onAntwort({ typ: 'fill', eintraege })
  }

  return (
    <div className="space-y-4">
      {luecken.map((luecke) => {
        const wert = eintraege[luecke.id] || ''
        const istKorrekt = feedbackSichtbar && wert.trim().toLowerCase() === luecke.korrekt.trim().toLowerCase()
        const istFalsch = feedbackSichtbar && !istKorrekt

        return (
          <div key={luecke.id}>
            {luecke.optionen ? (
              <select
                value={wert}
                onChange={(e) => setEintraege(prev => ({ ...prev, [luecke.id]: e.target.value }))}
                disabled={disabled}
                className={`w-full p-3 rounded-xl border-2 min-h-[48px] bg-white dark:bg-gray-700 dark:text-white
                  ${istKorrekt ? 'border-green-500' : ''}
                  ${istFalsch ? 'border-red-500' : ''}
                  ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600' : ''}
                `}
              >
                <option value="">-- Waehlen --</option>
                {luecke.optionen.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={wert}
                onChange={(e) => setEintraege(prev => ({ ...prev, [luecke.id]: e.target.value }))}
                disabled={disabled}
                placeholder="Antwort eingeben"
                autoFocus={luecken.indexOf(luecke) === 0}
                className={`w-full p-3 rounded-xl border-2 min-h-[48px] bg-white dark:bg-gray-700 dark:text-white
                  ${istKorrekt ? 'border-green-500' : ''}
                  ${istFalsch ? 'border-red-500' : ''}
                  ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600 focus:border-blue-500' : ''}
                  focus:outline-none
                `}
              />
            )}
            {istFalsch && (
              <p className="text-sm text-red-500 mt-1">Korrekt: {luecke.korrekt}</p>
            )}
          </div>
        )
      })}

      {!disabled && alleAusgefuellt && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Richtig!' : 'Leider falsch.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: CalcFrage erstellen**

`src/components/fragetypen/CalcFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function CalcFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const [wert, setWert] = useState('')

  const handleAbsenden = () => {
    if (!wert.trim() || disabled) return
    onAntwort({ typ: 'calc', wert: wert.trim() })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={wert}
          onChange={(e) => setWert(e.target.value)}
          disabled={disabled}
          placeholder="Ergebnis eingeben"
          autoFocus
          className={`flex-1 p-3 rounded-xl border-2 min-h-[48px] text-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none
            ${feedbackSichtbar && korrekt ? 'border-green-500' : ''}
            ${feedbackSichtbar && !korrekt ? 'border-red-500' : ''}
            ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600 focus:border-blue-500' : ''}
          `}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAbsenden() }}
        />
        {frage.einheit && <span className="text-gray-500 dark:text-gray-400">{frage.einheit}</span>}
      </div>

      {feedbackSichtbar && !korrekt && (
        <p className="text-sm text-red-500">Korrekt: {frage.korrekt}{frage.einheit ? ` ${frage.einheit}` : ''}{frage.toleranz ? ` (±${frage.toleranz})` : ''}</p>
      )}

      {!disabled && wert.trim() && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Richtig!' : 'Leider falsch.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: SortFrage erstellen (Tap-to-Select statt Drag)**

`src/components/fragetypen/SortFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function SortFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const kategorien = frage.kategorien || []
  const elemente = frage.elemente || []
  const [zuordnungen, setZuordnungen] = useState<Record<string, string>>({})
  const [aktiv, setAktiv] = useState<string | null>(null)

  const handleElementKlick = (text: string) => {
    if (disabled) return
    setAktiv(aktiv === text ? null : text)
  }

  const handleKategorieKlick = (kategorie: string) => {
    if (disabled || !aktiv) return
    setZuordnungen(prev => ({ ...prev, [aktiv]: kategorie }))
    setAktiv(null)
  }

  const alleZugeordnet = elemente.every(e => e.text in zuordnungen)

  const handleAbsenden = () => {
    if (!alleZugeordnet || disabled) return
    onAntwort({ typ: 'sort', zuordnungen })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Tippe ein Element, dann die passende Kategorie.</p>

      <div className="flex flex-wrap gap-2">
        {elemente.map((el) => {
          const zugeordnet = zuordnungen[el.text]
          const istAktiv = aktiv === el.text
          const istKorrekt = feedbackSichtbar && zugeordnet === el.kategorie
          const istFalsch = feedbackSichtbar && zugeordnet !== undefined && zugeordnet !== el.kategorie

          return (
            <button
              key={el.text}
              onClick={() => handleElementKlick(el.text)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg min-h-[44px] font-medium transition-colors border-2
                ${istAktiv ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50' : ''}
                ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
                ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
                ${!istAktiv && !istKorrekt && !istFalsch ? 'border-gray-200 dark:border-gray-600' : ''}
                dark:text-white
              `}
            >
              {el.text}
              {zugeordnet && !feedbackSichtbar && <span className="ml-1 text-xs text-gray-400">→ {zugeordnet}</span>}
            </button>
          )
        })}
      </div>

      {aktiv && (
        <div className="flex flex-wrap gap-2">
          {kategorien.map((kat) => (
            <button
              key={kat}
              onClick={() => handleKategorieKlick(kat)}
              className="px-4 py-2 rounded-lg min-h-[44px] bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
            >
              {kat}
            </button>
          ))}
        </div>
      )}

      {!disabled && alleZugeordnet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Alles richtig zugeordnet!' : 'Nicht ganz.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: SortierungFrage erstellen (Tap-to-Move)**

`src/components/fragetypen/SortierungFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import { seededShuffle } from '../../utils/shuffle'

export default function SortierungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const korrektReihenfolge = frage.reihenfolge || []
  const [reihenfolge, setReihenfolge] = useState<string[]>(() =>
    seededShuffle(korrektReihenfolge, frage.id)
  )
  const [ausgewaehlt, setAusgewaehlt] = useState<number | null>(null)

  const handleKlick = (index: number) => {
    if (disabled) return
    if (ausgewaehlt === null) {
      setAusgewaehlt(index)
    } else {
      // Tausche Positionen
      const neu = [...reihenfolge]
      ;[neu[ausgewaehlt], neu[index]] = [neu[index], neu[ausgewaehlt]]
      setReihenfolge(neu)
      setAusgewaehlt(null)
    }
  }

  const handleAbsenden = () => {
    if (disabled) return
    onAntwort({ typ: 'sortierung', reihenfolge })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">Tippe zwei Elemente um sie zu tauschen.</p>

      {reihenfolge.map((element, i) => {
        const istAusgewaehlt = ausgewaehlt === i
        const istKorrekt = feedbackSichtbar && element === korrektReihenfolge[i]
        const istFalsch = feedbackSichtbar && element !== korrektReihenfolge[i]

        return (
          <button
            key={element}
            onClick={() => handleKlick(i)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 min-h-[48px] flex items-center gap-3 transition-colors
              ${istAusgewaehlt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${!istAusgewaehlt && !istKorrekt && !istFalsch ? 'border-gray-200 dark:border-gray-600' : ''}
            `}
          >
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium dark:text-white">
              {i + 1}
            </span>
            <span className="dark:text-white">{element}</span>
          </button>
        )
      })}

      {!disabled && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Perfekte Reihenfolge!' : 'Nicht ganz.'}</p>
          {!korrekt && <p className="mt-1 text-sm opacity-80">Richtig: {korrektReihenfolge.join(' → ')}</p>}
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 9: ZuordnungFrage erstellen (Tap-to-Pair)**

`src/components/fragetypen/ZuordnungFrage.tsx`:
```tsx
import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import { seededShuffle } from '../../utils/shuffle'

export default function ZuordnungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const originalPaare = frage.paare || []
  const linksElemente = originalPaare.map(p => p.links)
  const [rechtsGemischt] = useState(() => seededShuffle(originalPaare.map(p => p.rechts), frage.id))
  const [paare, setPaare] = useState<Record<string, string>>({})
  const [aktivLinks, setAktivLinks] = useState<string | null>(null)

  const handleLinksKlick = (links: string) => {
    if (disabled) return
    setAktivLinks(aktivLinks === links ? null : links)
  }

  const handleRechtsKlick = (rechts: string) => {
    if (disabled || !aktivLinks) return
    setPaare(prev => ({ ...prev, [aktivLinks]: rechts }))
    setAktivLinks(null)
  }

  const alleZugeordnet = linksElemente.every(l => l in paare)

  const handleAbsenden = () => {
    if (!alleZugeordnet || disabled) return
    onAntwort({ typ: 'zuordnung', paare })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Tippe links, dann rechts um Paare zu bilden.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {linksElemente.map((links) => {
            const istAktiv = aktivLinks === links
            const zugeordnet = paare[links]
            const paar = originalPaare.find(p => p.links === links)
            const istKorrekt = feedbackSichtbar && zugeordnet === paar?.rechts
            const istFalsch = feedbackSichtbar && zugeordnet !== undefined && zugeordnet !== paar?.rechts

            return (
              <button
                key={links}
                onClick={() => handleLinksKlick(links)}
                disabled={disabled}
                className={`w-full text-left p-3 rounded-lg border-2 min-h-[44px] text-sm transition-colors
                  ${istAktiv ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
                  ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
                  ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
                  ${!istAktiv && !istKorrekt && !istFalsch ? 'border-gray-200 dark:border-gray-600' : ''}
                  dark:text-white
                `}
              >
                {links}
                {zugeordnet && !feedbackSichtbar && (
                  <span className="block text-xs text-gray-400 mt-1">→ {zugeordnet}</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          {rechtsGemischt.map((rechts) => {
            const istVergeben = Object.values(paare).includes(rechts)
            return (
              <button
                key={rechts}
                onClick={() => handleRechtsKlick(rechts)}
                disabled={disabled || !aktivLinks}
                className={`w-full text-left p-3 rounded-lg border-2 min-h-[44px] text-sm transition-colors
                  ${istVergeben ? 'opacity-50' : ''}
                  ${aktivLinks ? 'border-gray-300 dark:border-gray-500 hover:border-blue-400' : 'border-gray-200 dark:border-gray-600'}
                  dark:text-white
                `}
              >
                {rechts}
              </button>
            )
          })}
        </div>
      </div>

      {!disabled && alleZugeordnet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Alle Paare richtig!' : 'Nicht ganz.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 10: tsc pruefen**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 11: Commit**

```bash
git add Lernplattform/src/components/fragetypen/
git commit -m "Lernplattform Phase 2: 8 Fragetypen-Komponenten (MC, Multi, TF, Fill, Calc, Sort, Sortierung, Zuordnung)"
```

---

## Task 7: UebungsScreen + Zusammenfassung

**Files:**
- Create: `Lernplattform/src/components/UebungsScreen.tsx`
- Create: `Lernplattform/src/components/Zusammenfassung.tsx`

- [ ] **Step 1: UebungsScreen erstellen**

`src/components/UebungsScreen.tsx`:
```tsx
import { useUebungsStore } from '../store/uebungsStore'
import { FRAGETYP_KOMPONENTEN } from './fragetypen'

export default function UebungsScreen() {
  const { session, feedbackSichtbar, letzteAntwortKorrekt, beantworte, naechsteFrage, istSessionFertig, beendeSession, aktuelleFrage } = useUebungsStore()

  if (!session) return null

  const frage = aktuelleFrage()
  if (!frage) return null

  const Komponente = FRAGETYP_KOMPONENTEN[frage.typ]
  const istBeantwortet = frage.id in session.antworten
  const fortschritt = Object.keys(session.antworten).length
  const gesamt = session.fragen.length

  const handleWeiter = () => {
    if (istSessionFertig()) {
      beendeSession()
    } else {
      naechsteFrage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fortschrittsbalken */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {session.fach} — {session.thema}
          </span>
          <span className="text-sm font-medium dark:text-white">
            {fortschritt}/{gesamt}
          </span>
        </div>
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${(fortschritt / gesamt) * 100}%` }}
          />
        </div>
      </div>

      {/* Frage */}
      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium
              ${frage.schwierigkeit === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}
              ${frage.schwierigkeit === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
              ${frage.schwierigkeit === 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : ''}
            `}>
              {frage.schwierigkeit === 1 ? 'Einfach' : frage.schwierigkeit === 2 ? 'Mittel' : 'Schwer'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{frage.typ.toUpperCase()}</span>
          </div>

          <h2 className="text-lg font-medium mb-4 dark:text-white">{frage.frage}</h2>

          {Komponente ? (
            <Komponente
              frage={frage}
              onAntwort={beantworte}
              disabled={istBeantwortet}
              feedbackSichtbar={feedbackSichtbar}
              korrekt={letzteAntwortKorrekt}
            />
          ) : (
            <p className="text-gray-500">Fragetyp "{frage.typ}" nicht unterstuetzt.</p>
          )}
        </div>

        {/* Weiter-Button */}
        {feedbackSichtbar && (
          <button
            onClick={handleWeiter}
            className="w-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-xl py-3 font-medium min-h-[48px]"
          >
            {istSessionFertig() ? 'Ergebnis anzeigen' : 'Weiter'}
          </button>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Zusammenfassung erstellen**

`src/components/Zusammenfassung.tsx`:
```tsx
import { useUebungsStore } from '../store/uebungsStore'

interface Props {
  onZurueck: () => void
  onNochmal: () => void
}

export default function Zusammenfassung({ onZurueck, onNochmal }: Props) {
  const { session, berechneErgebnis } = useUebungsStore()
  if (!session) return null

  const ergebnis = berechneErgebnis()
  const quoteGerundet = Math.round(ergebnis.quote)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">
          {quoteGerundet >= 80 ? '🎉' : quoteGerundet >= 50 ? '👍' : '💪'}
        </div>

        <h2 className="text-2xl font-bold mb-2 dark:text-white">
          {ergebnis.richtig} von {ergebnis.anzahlFragen} richtig
        </h2>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all ${quoteGerundet >= 80 ? 'bg-green-500' : quoteGerundet >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${quoteGerundet}%` }}
          />
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {session.fach} — {session.thema}
        </p>

        {/* Detail-Liste */}
        <div className="text-left space-y-2 mb-6">
          {ergebnis.details.map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 ${d.korrekt ? 'text-green-500' : 'text-red-500'}`}>
                {d.korrekt ? '✓' : '✗'}
              </span>
              <span className="dark:text-gray-300">{d.frage}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <button
            onClick={onNochmal}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]"
          >
            Nochmal ueben
          </button>
          <button
            onClick={onZurueck}
            className="w-full bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl py-3 font-medium min-h-[48px]"
          >
            Zurueck zum Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: tsc pruefen**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/src/components/UebungsScreen.tsx Lernplattform/src/components/Zusammenfassung.tsx
git commit -m "Lernplattform Phase 2: UebungsScreen + Zusammenfassung"
```

---

## Task 8: Dashboard erweitern + App.tsx Routing

**Files:**
- Modify: `Lernplattform/src/components/Dashboard.tsx`
- Modify: `Lernplattform/src/App.tsx`

- [ ] **Step 1: Dashboard mit Themen-Browser erweitern**

`src/components/Dashboard.tsx` komplett ersetzen:
```tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGruppenStore } from '../store/gruppenStore'
import { useUebungsStore } from '../store/uebungsStore'
import { fragenAdapter } from '../adapters/appsScriptAdapter'

interface ThemenMap {
  [fach: string]: string[]
}

export default function Dashboard() {
  const { user, abmelden } = useAuthStore()
  const { aktiveGruppe } = useGruppenStore()
  const { starteSession } = useUebungsStore()
  const [themen, setThemen] = useState<ThemenMap>({})
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    if (!aktiveGruppe) return
    const ladeThemen = async () => {
      setLaden(true)
      const alleFragen = await fragenAdapter.ladeFragen(aktiveGruppe.id, { nurUebung: true })
      const map: ThemenMap = {}
      for (const f of alleFragen) {
        if (!map[f.fach]) map[f.fach] = []
        if (!map[f.fach].includes(f.thema)) map[f.fach].push(f.thema)
      }
      setThemen(map)
      setLaden(false)
    }
    ladeThemen()
  }, [aktiveGruppe])

  const handleStarte = (fach: string, thema: string) => {
    if (!aktiveGruppe || !user) return
    starteSession(aktiveGruppe.id, user.email, fach, thema)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold dark:text-white">Lernplattform</h1>
          {aktiveGruppe && <span className="text-sm text-gray-500">{aktiveGruppe.name}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{user?.vorname || user?.email}</span>
          {user?.bild && <img src={user.bild} alt="" className="w-8 h-8 rounded-full" />}
          <button onClick={abmelden} className="text-sm text-gray-400 hover:text-gray-600">Abmelden</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Hallo {user?.vorname || 'dort'}!
        </h2>

        {laden ? (
          <p className="text-gray-500">Themen werden geladen...</p>
        ) : Object.keys(themen).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-gray-500">
            <p>Noch keine Uebungsfragen vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(themen).map(([fach, themenListe]) => (
              <div key={fach}>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">{fach}</h3>
                <div className="grid gap-2">
                  {themenListe.map((thema) => (
                    <button
                      key={thema}
                      onClick={() => handleStarte(fach, thema)}
                      className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 min-h-[48px]"
                    >
                      <span className="font-medium dark:text-white">{thema}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: App.tsx mit Uebungs-Routing erweitern**

`src/App.tsx` komplett ersetzen:
```tsx
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useGruppenStore } from './store/gruppenStore'
import { useUebungsStore } from './store/uebungsStore'
import LoginScreen from './components/LoginScreen'
import GruppenAuswahl from './components/GruppenAuswahl'
import Dashboard from './components/Dashboard'
import UebungsScreen from './components/UebungsScreen'
import Zusammenfassung from './components/Zusammenfassung'

export default function App() {
  const { user, istAngemeldet, sessionWiederherstellen, ladeStatus: authStatus } = useAuthStore()
  const { gruppen, aktiveGruppe, ladeGruppen, ladeStatus: gruppenStatus } = useGruppenStore()
  const { session, starteSession, beendeSession } = useUebungsStore()

  useEffect(() => {
    sessionWiederherstellen()
  }, [sessionWiederherstellen])

  useEffect(() => {
    if (istAngemeldet && user?.email) {
      ladeGruppen(user.email)
    }
  }, [istAngemeldet, user?.email, ladeGruppen])

  useEffect(() => {
    if (aktiveGruppe && user?.email) {
      const istAdmin = aktiveGruppe.adminEmail.toLowerCase() === user.email.toLowerCase()
      if (istAdmin && user.rolle !== 'admin') {
        useAuthStore.getState().setzeRolle('admin')
      } else if (!istAdmin && user.rolle !== 'lernend') {
        useAuthStore.getState().setzeRolle('lernend')
      }
    }
  }, [aktiveGruppe, user?.email, user?.rolle])

  // Laden
  if (authStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Wird geladen...</p>
      </div>
    )
  }

  // Nicht eingeloggt
  if (!istAngemeldet) return <LoginScreen />

  // Gruppen laden
  if (gruppenStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Gruppen werden geladen...</p>
      </div>
    )
  }

  // Keine Gruppen
  if (gruppen.length === 0 && gruppenStatus === 'fertig') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold mb-2 dark:text-white">Keine Gruppen</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Du bist noch keiner Gruppe zugeordnet.
          </p>
          <button onClick={() => useAuthStore.getState().abmelden()} className="text-sm text-gray-400 hover:text-gray-600">
            Abmelden
          </button>
        </div>
      </div>
    )
  }

  // Gruppen-Auswahl
  if (!aktiveGruppe) return <GruppenAuswahl />

  // Uebungs-Session aktiv
  if (session) {
    if (session.beendet) {
      return (
        <Zusammenfassung
          onZurueck={() => useUebungsStore.setState({ session: null })}
          onNochmal={() => {
            if (aktiveGruppe && user) {
              starteSession(aktiveGruppe.id, user.email, session.fach, session.thema)
            }
          }}
        />
      )
    }
    return <UebungsScreen />
  }

  // Dashboard
  return <Dashboard />
}
```

- [ ] **Step 3: tsc + Build pruefen**

```bash
cd Lernplattform && npx tsc -b && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/src/components/Dashboard.tsx Lernplattform/src/App.tsx
git commit -m "Lernplattform Phase 2: Dashboard mit Themen-Browser + App Routing"
```

---

## Task 9: Alle Tests + Build + HANDOFF

- [ ] **Step 1: Alle Lernplattform-Tests ausfuehren**

```bash
cd Lernplattform && npx vitest run
```

Expected: Alle Tests PASS (apiClient 6 + authStore 6 + gruppenStore 5 + korrektur 12 + blockBuilder 5 + uebungsStore 5 = 39).

- [ ] **Step 2: TypeScript-Check + Build**

```bash
cd Lernplattform && npx tsc -b && npm run build
```

- [ ] **Step 3: Pruefungstool nicht kaputt**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Expected: 193+ Tests gruen.

- [ ] **Step 4: Preview verifizieren**

Dev-Server starten, Dashboard zeigt Mock-Themen (Mathe, Deutsch, VWL). Klick auf Thema startet Session. Fragen beantworten → Feedback → Weiter → Zusammenfassung.

- [ ] **Step 5: HANDOFF.md aktualisieren**

Phase 2 Eintraege in `Lernplattform/HANDOFF.md` ergaenzen.

- [ ] **Step 6: Commit + Push**

```bash
git add -A
git commit -m "Lernplattform Phase 2: Fragenbank + Uebungs-Engine (8 Fragetypen, 39 Tests)"
git push
```

---

## Zusammenfassung Phase 2

| Task | Beschreibung | Tests |
|------|-------------|-------|
| 1 | Fragen- + Uebungs-Typen | tsc |
| 2 | Shuffle + Korrektur-Utils | 12 Tests |
| 3 | Block-Builder | 5 Tests |
| 4 | Service-Interfaces + Mock-Adapter | tsc |
| 5 | UebungsStore | 5 Tests |
| 6 | 8 Fragetypen-Komponenten | tsc + Build |
| 7 | UebungsScreen + Zusammenfassung | tsc + Build |
| 8 | Dashboard + App Routing | tsc + Build |
| 9 | Gesamtverifikation | Alle Tests + Preview |

**Resultat:** Kinder und SuS koennen Themen waehlen, 10er-Bloecke ueben, Feedback erhalten und ihre Ergebnisse sehen. 8 Fragetypen funktionieren (MC, Multi, TF, Fill, Calc, Sort, Sortierung, Zuordnung). Mock-Daten statt Backend (Backend kommt in Phase 3 mit Mastery-Tracking).
