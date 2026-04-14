# Buchhaltungs-Fragetypen & Aufgabengruppen — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new accounting question types (Buchungssatz, T-Konto, Kontenbestimmung, Bilanz/ER) and a generic task-grouping concept to the Prüfungsplattform.

**Architecture:** Modular approach — each question type gets its own editor, renderer, and auto-correction logic. Shared FiBu infrastructure (KMU chart of accounts, account-select component) is built first. The Aufgabengruppe is a generic platform concept extending FrageBase.

**Tech Stack:** React 19, TypeScript 5.9, Zustand 5, Tailwind CSS 4, Tiptap 2.25, Vite 7, Google Apps Script backend.

**Spec:** `docs/superpowers/specs/2026-03-21-buchhaltung-fragetypen-design.md`

**Note:** No test framework is configured. Type safety is enforced via TypeScript. Manual testing via dev server (`npm run dev`). Auto-correction logic should be pure functions for future unit testing.

---

## File Structure

### New Files

```
src/data/kontenrahmen-kmu.json               — KMU chart of accounts (static JSON)
src/utils/kontenrahmen.ts                     — Load/search/filter functions for chart of accounts
src/utils/fibuAutoKorrektur.ts                — Pure auto-correction functions for all FiBu types
src/components/shared/KontenSelect.tsx        — Reusable account-select dropdown component

src/components/fragetypen/BuchungssatzFrage.tsx   — Student view: journal entry
src/components/fragetypen/TKontoFrage.tsx         — Student view: T-accounts
src/components/fragetypen/KontenbestimmungFrage.tsx — Student view: account identification
src/components/fragetypen/BilanzERFrage.tsx        — Student view: balance sheet / income statement
src/components/fragetypen/AufgabengruppeFrage.tsx  — Student view: task group wrapper

src/components/lp/frageneditor/BuchungssatzEditor.tsx   — Teacher editor
src/components/lp/frageneditor/TKontoEditor.tsx         — Teacher editor
src/components/lp/frageneditor/KontenbestimmungEditor.tsx — Teacher editor
src/components/lp/frageneditor/BilanzEREditor.tsx        — Teacher editor
src/components/lp/frageneditor/AufgabengruppeEditor.tsx  — Teacher editor
src/components/lp/frageneditor/KIFiBuButtons.tsx        — KI action buttons for FiBu types
```

### Modified Files

```
src/types/fragen.ts:187                       — Add 5 interfaces + extend Frage union
src/types/antworten.ts:28-35                  — Add 4 Antwort union members
src/components/lp/frageneditor/editorUtils.ts:3,7-10    — Extend FrageTyp union + typKuerzel mapping
src/components/Layout.tsx:410-428             — Add 5 cases to renderFrage switch
src/components/lp/frageneditor/FragenEditor.tsx:296-360  — Add 5 cases to type dispatch
src/components/lp/composer/VorschauTab.tsx:156-163,238-243 — Add preview + time estimates
src/components/lp/KorrekturFrageZeile.tsx:28-36          — Add scoring cases
src/components/lp/KorrekturSchuelerZeile.tsx:29-72       — Add answer display cases
src/components/lp/FragenBrowser.tsx:440-449               — Add filter options
src/components/lp/frageneditor/useKIAssistent.ts:5-27    — Add new AktionKeys
src/components/lp/frageneditor/KITypButtons.tsx           — Add FiBu KI button imports/exports
apps-script-code.js:359-411,556-573                       — Add parsing + extraction cases
src/utils/exportUtils.ts                                  — Add export formatting for new types
```

---

## Task 1: Shared Infrastructure — KMU-Kontenrahmen

**Files:**
- Create: `src/data/kontenrahmen-kmu.json`
- Create: `src/utils/kontenrahmen.ts`

- [ ] **Step 1: Create the KMU chart of accounts JSON**

Create `src/data/kontenrahmen-kmu.json` with the standard Swiss KMU accounts. Include all major account groups:
- 1xxx: Aktiven (UV + AV)
- 2xxx: Passiven (kf. FK + lf. FK + EK)
- 3xxx: Betriebsertrag aus Lieferungen/Leistungen
- 4xxx: Aufwand Material/Waren
- 5xxx: Personalaufwand
- 6xxx: Übriger betrieblicher Aufwand
- 7xxx: Betrieblicher Nebenerfolg
- 8xxx: Ausserordentlicher Erfolg
- 9xxx: Abschluss

Structure per entry:
```json
{
  "konten": [
    { "nummer": "1000", "name": "Kasse", "kategorie": "aktiv", "gruppe": "Umlaufvermögen", "untergruppe": "Flüssige Mittel" },
    { "nummer": "1020", "name": "Bank", "kategorie": "aktiv", "gruppe": "Umlaufvermögen", "untergruppe": "Flüssige Mittel" },
    ...
  ]
}
```

Include approximately 60-80 commonly used accounts (not the full 1000+ possible accounts). Focus on accounts relevant for Gymnasium-level teaching.

- [ ] **Step 2: Create utility functions**

Create `src/utils/kontenrahmen.ts`:

```typescript
import kontenrahmenData from '../data/kontenrahmen-kmu.json'

export interface KontoEintrag {
  nummer: string
  name: string
  kategorie: 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'
  gruppe: string
  untergruppe?: string
}

/** All accounts from the KMU chart */
export const alleKonten: KontoEintrag[] = kontenrahmenData.konten

/** Find account by number */
export function findKonto(nummer: string): KontoEintrag | undefined {
  return alleKonten.find(k => k.nummer === nummer)
}

/** Search accounts by number or name (for autocomplete) */
export function sucheKonten(query: string, eingeschraenkt?: string[]): KontoEintrag[] {
  const pool = eingeschraenkt
    ? alleKonten.filter(k => eingeschraenkt.includes(k.nummer))
    : alleKonten
  if (!query) return pool
  const q = query.toLowerCase()
  return pool.filter(k =>
    k.nummer.startsWith(q) || k.name.toLowerCase().includes(q)
  )
}

/** Get display label: "1000 Kasse" */
export function kontoLabel(nummer: string): string {
  const k = findKonto(nummer)
  return k ? `${k.nummer} ${k.name}` : nummer
}

/** Group accounts by kategorie */
export function kontenNachKategorie(nummern: string[]): Record<string, KontoEintrag[]> {
  const result: Record<string, KontoEintrag[]> = {}
  for (const nr of nummern) {
    const k = findKonto(nr)
    if (k) {
      ;(result[k.kategorie] ??= []).push(k)
    }
  }
  return result
}
```

- [ ] **Step 3: Verify build**

Run: `cd ExamLab && npm run build`
Expected: Build succeeds, JSON is bundled.

- [ ] **Step 4: Commit**

```bash
git add src/data/kontenrahmen-kmu.json src/utils/kontenrahmen.ts
git commit -m "feat(pruefung): add KMU chart of accounts + utility functions"
```

---

## Task 2: Shared Infrastructure — KontenSelect Component

**Files:**
- Create: `src/components/shared/KontenSelect.tsx`

- [ ] **Step 1: Create the reusable KontenSelect component**

Create `src/components/shared/KontenSelect.tsx`:

```typescript
import { useState, useRef, useEffect } from 'react'
import { sucheKonten, kontoLabel, type KontoEintrag } from '../../utils/kontenrahmen'
import type { KontenauswahlConfig } from '../../types/fragen'

interface Props {
  value: string                    // Selected account number
  onChange: (nummer: string) => void
  config: KontenauswahlConfig
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function KontenSelect({ value, onChange, config, placeholder, disabled, className }: Props) {
  // eingeschraenkt → simple dropdown
  // voll → searchable autocomplete with filtered results
  // State: open/closed, search query, filtered results
  // Keyboard navigation: arrow keys, enter, escape
  // Display: "1000 Kasse" format
  // Dark mode support via Tailwind dark: classes
}
```

Key behaviors:
- **Eingeschränkt**: Standard `<select>` dropdown with the configured accounts
- **Voll**: Input field with dropdown list, filters as user types, shows "Nummer Name" format
- Click outside or Escape closes the dropdown
- Arrow keys navigate, Enter selects
- Show account category as subtle badge (aktiv/passiv/aufwand/ertrag)
- Minimum touch target 44x44px

- [ ] **Step 2: Verify build + visual check**

Run: `cd ExamLab && npm run dev`
(Component not yet integrated — just verify it compiles)

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/KontenSelect.tsx
git commit -m "feat(pruefung): add reusable KontenSelect component"
```

---

## Task 3: Type Definitions — All FiBu Types + Aufgabengruppe

**Files:**
- Modify: `src/types/fragen.ts:187`
- Modify: `src/types/antworten.ts:28-35`

- [ ] **Step 1: Add FiBu interfaces to fragen.ts**

Add before the `Frage` union (before line 187):

```typescript
// === SHARED FIBU ===

export type Kontenkategorie = 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'

export interface KontenauswahlConfig {
  modus: 'eingeschraenkt' | 'voll'
  konten?: string[]  // Only for 'eingeschraenkt'
}

// === BUCHUNGSSATZ ===

export interface BuchungsKonto {
  kontonummer: string
  betrag: number
}

export interface SollHabenZeile {
  id: string
  sollKonten: BuchungsKonto[]
  habenKonten: BuchungsKonto[]
  buchungstext?: string
}

export interface BuchungssatzFrage extends FrageBase {
  typ: 'buchungssatz'
  geschaeftsfall: string
  buchungen: SollHabenZeile[]
  kontenauswahl: KontenauswahlConfig
}

// === T-KONTO ===

export interface TKontoEintrag {
  seite: 'soll' | 'haben'
  gegenkonto: string
  betrag: number
  buchungstext?: string
}

export interface TKontoDefinition {
  id: string
  kontonummer: string
  anfangsbestand?: number
  anfangsbestandVorgegeben: boolean
  eintraege: TKontoEintrag[]
  saldo: { betrag: number; seite: 'soll' | 'haben' }
}

export interface TKontoBewertung {
  beschriftungSollHaben: boolean
  kontenkategorie: boolean
  zunahmeAbnahme: boolean
  buchungenKorrekt: boolean
  saldoKorrekt: boolean
}

export interface TKontoFrage extends FrageBase {
  typ: 'tkonto'
  aufgabentext: string
  geschaeftsfaelle?: string[]
  konten: TKontoDefinition[]
  kontenauswahl: KontenauswahlConfig
  bewertungsoptionen: TKontoBewertung
}

// === KONTENBESTIMMUNG ===

export interface KontenAntwort {
  kontonummer?: string
  kategorie?: Kontenkategorie
  seite?: 'soll' | 'haben'
}

export interface Kontenaufgabe {
  id: string
  text: string
  erwarteteAntworten: KontenAntwort[]
}

export interface KontenbestimmungFrage extends FrageBase {
  typ: 'kontenbestimmung'
  aufgabentext: string
  modus: 'konto_bestimmen' | 'kategorie_bestimmen' | 'gemischt'
  aufgaben: Kontenaufgabe[]
  kontenauswahl: KontenauswahlConfig
}

// === BILANZ / ERFOLGSRECHNUNG ===

export interface KontoMitSaldo {
  kontonummer: string
  saldo: number
}

export interface BilanzGruppe {
  label: string
  konten: string[]
}

export interface BilanzStruktur {
  aktivSeite: { label: string; gruppen: BilanzGruppe[] }
  passivSeite: { label: string; gruppen: BilanzGruppe[] }
  bilanzsumme: number
}

export interface ERStufe {
  label: string
  aufwandKonten: string[]
  ertragKonten: string[]
  zwischentotal: number
}

export interface ERStruktur {
  stufen: ERStufe[]
}

export interface BilanzERLoesung {
  bilanz?: BilanzStruktur
  erfolgsrechnung?: ERStruktur
}

export interface BilanzERBewertung {
  seitenbeschriftung: boolean
  gruppenbildung: boolean
  gruppenreihenfolge: boolean
  kontenreihenfolge: boolean
  betraegeKorrekt: boolean
  zwischentotale: boolean
  bilanzsummeOderGewinn: boolean
  mehrstufigkeit: boolean
}

export interface BilanzERFrage extends FrageBase {
  typ: 'bilanzstruktur'
  aufgabentext: string
  modus: 'bilanz' | 'erfolgsrechnung' | 'beides'
  kontenMitSaldi: KontoMitSaldo[]
  loesung: BilanzERLoesung
  bewertungsoptionen: BilanzERBewertung
}

// === AUFGABENGRUPPE ===

export interface AufgabengruppeFrage extends FrageBase {
  typ: 'aufgabengruppe'
  kontext: string
  kontextAnhaenge?: FrageAnhang[]
  teilaufgabenIds: string[]
}
```

- [ ] **Step 2: Update the Frage union type**

Change line 187 from:
```typescript
export type Frage = MCFrage | FreitextFrage | ZuordnungFrage | LueckentextFrage | VisualisierungFrage | RichtigFalschFrage | BerechnungFrage;
```
to:
```typescript
export type Frage = MCFrage | FreitextFrage | ZuordnungFrage | LueckentextFrage | VisualisierungFrage | RichtigFalschFrage | BerechnungFrage | BuchungssatzFrage | TKontoFrage | KontenbestimmungFrage | BilanzERFrage | AufgabengruppeFrage;
```

- [ ] **Step 3: Add Antwort types to antworten.ts**

Add 4 new union members to the `Antwort` type (after line 35):

```typescript
  | { typ: 'buchungssatz'; buchungen: {
      id: string;
      sollKonten: { kontonummer: string; betrag: number }[];
      habenKonten: { kontonummer: string; betrag: number }[];
      buchungstext?: string;
    }[] }
  | { typ: 'tkonto'; konten: {
      id: string;
      beschriftungLinks?: string;
      beschriftungRechts?: string;
      kontenkategorie?: string;
      eintraegeLinks: { gegenkonto: string; betrag: number }[];
      eintraegeRechts: { gegenkonto: string; betrag: number }[];
      saldo?: { betrag: number; seite: 'links' | 'rechts' };
    }[] }
  | { typ: 'kontenbestimmung'; aufgaben: Record<string, {
      antworten: { kontonummer?: string; kategorie?: string; seite?: string }[];
    }> }
  | { typ: 'bilanzstruktur'; bilanz?: {
      linkeSeite: { label: string; gruppen: { label: string; konten: { nr: string; betrag: number }[] }[] };
      rechteSeite: { label: string; gruppen: { label: string; konten: { nr: string; betrag: number }[] }[] };
      bilanzsummeLinks?: number;
      bilanzsummeRechts?: number;
    };
    erfolgsrechnung?: {
      stufen: { label: string; konten: { nr: string; betrag: number }[]; zwischentotal?: number }[];
      gewinnVerlust?: number;
    } }
```

Note: Aufgabengruppe has no own Antwort type — answers are stored per Teilaufgabe.

- [ ] **Step 4: Update editorUtils.ts**

In `src/components/lp/frageneditor/editorUtils.ts`:

Update line 3 — extend `FrageTyp`:
```typescript
export type FrageTyp = 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'buchungssatz' | 'tkonto' | 'kontenbestimmung' | 'bilanzstruktur' | 'aufgabengruppe'
```

Update lines 7-10 — extend `typKuerzel` in `generiereFrageId()`:
```typescript
const typKuerzel: Record<string, string> = {
  mc: 'mc', freitext: 'ft', lueckentext: 'lt', zuordnung: 'zu',
  richtigfalsch: 'rf', berechnung: 'be',
  buchungssatz: 'bs', tkonto: 'tk', kontenbestimmung: 'kb',
  bilanzstruktur: 'bi', aufgabengruppe: 'ag',
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: Type errors in switch statements (exhaustive checks) — this is expected and will be fixed in later tasks.

- [ ] **Step 6: Commit**

```bash
git add src/types/fragen.ts src/types/antworten.ts src/components/lp/frageneditor/editorUtils.ts
git commit -m "feat(pruefung): add FiBu + Aufgabengruppe type definitions"
```

---

## Task 4: Buchungssatz — Student Component

**Files:**
- Create: `src/components/fragetypen/BuchungssatzFrage.tsx`

- [ ] **Step 1: Create the student-facing Buchungssatz component**

Create `src/components/fragetypen/BuchungssatzFrage.tsx`:

The component receives the question definition and current answer, renders:
1. Geschäftsfall text at the top
2. Table with columns: Soll-Konto | Betrag | Haben-Konto | Betrag | Text (opt.)
3. Each row uses `KontenSelect` for account dropdowns
4. Button "+ Buchungssatz" to add rows
5. Each Buchungssatz can have multiple Soll/Haben lines (for compound entries)
6. Auto-saves on every change via the provided `onAntwortChange` callback

Props pattern — follow existing components like `MCFrage.tsx`:
```typescript
interface Props {
  frage: BuchungssatzFrage
  antwort?: Extract<Antwort, { typ: 'buchungssatz' }>
  onAntwortChange: (antwort: Antwort) => void
  readOnly?: boolean
}
```

Styling: Tailwind classes, dark mode support, neutral color scheme.

- [ ] **Step 2: Register in Layout.tsx**

Add case in `src/components/Layout.tsx` at the switch statement (~line 410):

```typescript
case 'buchungssatz':
  return <BuchungssatzFrage frage={frage as BuchungssatzFrageType} ... />
```

Add the import at the top of the file.

- [ ] **Step 3: Verify build + visual test**

Run: `cd ExamLab && npm run dev`
Create a test question in the demo data or via the editor to verify rendering.

- [ ] **Step 4: Commit**

```bash
git add src/components/fragetypen/BuchungssatzFrage.tsx src/components/Layout.tsx
git commit -m "feat(pruefung): add Buchungssatz student component"
```

---

## Task 5: Buchungssatz — Editor Component

**Files:**
- Create: `src/components/lp/frageneditor/BuchungssatzEditor.tsx`
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx:296-360`

- [ ] **Step 1: Create the Buchungssatz editor**

Create `src/components/lp/frageneditor/BuchungssatzEditor.tsx`:

Editor UI:
1. Geschäftsfall textarea (Tiptap rich text)
2. Kontenauswahl config: Toggle eingeschränkt/voll + Konten-Picker
3. Musterlösung section: Same table layout as student view, but editable by LP
4. Add/remove Buchungssatz rows, add/remove Soll/Haben lines per row
5. Auto-generate musterlosung text from structured data

Props pattern — follow existing editors like `MCEditor.tsx`:
```typescript
interface Props {
  frage: BuchungssatzFrage
  onChange: (updates: Partial<BuchungssatzFrage>) => void
}
```

Keep under 500 lines (code quality rule).

- [ ] **Step 2: Register in FragenEditor.tsx**

Add case in the switch statement at ~line 296:
```typescript
case 'buchungssatz':
  return <BuchungssatzEditor frage={frage as BuchungssatzFrage} onChange={handleChange} />
```

Add to the type dropdown options and default values for new Buchungssatz questions.

- [ ] **Step 3: Verify build + test editor flow**

Run: `cd ExamLab && npm run dev`
Create a new Buchungssatz question in the editor, verify save/load.

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/frageneditor/BuchungssatzEditor.tsx src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "feat(pruefung): add Buchungssatz editor component"
```

---

## Task 6: Buchungssatz — Integration (Preview, Correction, Filter, Backend)

**Files:**
- Modify: `src/components/lp/composer/VorschauTab.tsx:156-163,238-243`
- Modify: `src/components/lp/KorrekturFrageZeile.tsx:28-36`
- Modify: `src/components/lp/KorrekturSchuelerZeile.tsx:29-72`
- Modify: `src/components/lp/FragenBrowser.tsx:440-449`
- Modify: `apps-script-code.js:359-411,556-573`
- Create: `src/utils/fibuAutoKorrektur.ts` (start with Buchungssatz)

- [ ] **Step 1: Add preview in VorschauTab.tsx**

Add at ~line 243:
```typescript
{frage.typ === 'buchungssatz' && <BuchungssatzVorschau frage={frage as BuchungssatzFrage} />}
```

Create a simple preview component inline or as a separate small component. Show the Geschäftsfall + table structure.

Add time estimate at ~line 156: `case 'buchungssatz': return 3` (3 minutes per Buchungssatz question).

- [ ] **Step 2: Add correction display in KorrekturSchuelerZeile.tsx**

Add case at ~line 66:
```typescript
case 'buchungssatz':
  // Display submitted Soll/Haben/Betrag table with correct/incorrect highlighting
```

- [ ] **Step 3: Add scoring in KorrekturFrageZeile.tsx**

Add case at ~line 28:
```typescript
case 'buchungssatz': return punkte  // Full points, auto-correctable
```

- [ ] **Step 4: Add filter option in FragenBrowser.tsx**

Add at ~line 449:
```html
<option value="buchungssatz">Buchungssatz ({stats.typen.get('buchungssatz') ?? 0})</option>
```

- [ ] **Step 5: Add backend parsing in apps-script-code.js**

Add case in the switch at ~line 359 (sheet→object):
```javascript
case 'buchungssatz':
  frage.geschaeftsfall = row.fragetext || ''
  frage.buchungen = safeJsonParse(row.typDaten, [])
  frage.kontenauswahl = safeJsonParse(row.kontenauswahl, { modus: 'voll' })
  break
```

Add case in `getTypDaten()` at ~line 556:
```javascript
case 'buchungssatz':
  return { geschaeftsfall: frage.geschaeftsfall, buchungen: frage.buchungen, kontenauswahl: frage.kontenauswahl }
```

- [ ] **Step 6: Create auto-correction utility (Buchungssatz)**

Create `src/utils/fibuAutoKorrektur.ts`:

```typescript
import type { BuchungssatzFrage, SollHabenZeile } from '../types/fragen'
import type { Antwort } from '../types/antworten'

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

/** Auto-correct a Buchungssatz answer against the expected solution */
export function korrigiereBuchungssatz(
  frage: BuchungssatzFrage,
  antwort: Extract<Antwort, { typ: 'buchungssatz' }>
): KorrekturErgebnis {
  // Compare each submitted Buchungssatz against expected
  // Order-independent matching (find best match)
  // Per-line: check Soll-Konten, Haben-Konten, Beträge
  // Return detailed results with partial points
}
```

Keep this as pure functions — no React, no side effects.

- [ ] **Step 7: Verify full flow**

Run: `cd ExamLab && npm run build`
Test: Create question → Preview → Take exam → Submit → View correction.

- [ ] **Step 8: Commit**

```bash
git add src/components/lp/composer/VorschauTab.tsx src/components/lp/KorrekturFrageZeile.tsx src/components/lp/KorrekturSchuelerZeile.tsx src/components/lp/FragenBrowser.tsx apps-script-code.js src/utils/fibuAutoKorrektur.ts
git commit -m "feat(pruefung): Buchungssatz integration (preview, correction, filter, backend)"
```

---

## Task 7: T-Konto — Student Component

**Files:**
- Create: `src/components/fragetypen/TKontoFrage.tsx`

- [ ] **Step 1: Create the T-Konto student component**

Create `src/components/fragetypen/TKontoFrage.tsx`:

Renders per T-Konto:
1. Account name + number header
2. Optional Kontenkategorie dropdown (if `bewertungsoptionen.kontenkategorie`)
3. T-shape: left side (Soll default) | right side (Haben default)
4. Soll/Haben labels as dropdowns (if `bewertungsoptionen.beschriftungSollHaben`) or fixed text
5. Anfangsbestand row (pre-filled or input)
6. Entry rows: KontenSelect (Gegenkonto) + Betrag input, per side
7. "+ Zeile" buttons per side
8. Saldo input at bottom
9. Multiple T-Konten stacked vertically

Use CSS Grid or Flexbox for the T-layout. Border styling for the characteristic T-shape.

- [ ] **Step 2: Register in Layout.tsx**

Add case: `case 'tkonto': return <TKontoFrage ... />`

- [ ] **Step 3: Verify build + visual test**

- [ ] **Step 4: Commit**

```bash
git add src/components/fragetypen/TKontoFrage.tsx src/components/Layout.tsx
git commit -m "feat(pruefung): add T-Konto student component"
```

---

## Task 8: T-Konto — Editor Component

**Files:**
- Create: `src/components/lp/frageneditor/TKontoEditor.tsx`
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx`

- [ ] **Step 1: Create the T-Konto editor**

Create `src/components/lp/frageneditor/TKontoEditor.tsx`:

Editor UI:
1. Aufgabentext (Tiptap)
2. Optional: Geschäftsfälle as text list
3. Kontenauswahl config
4. Bewertungsoptionen: 5 checkboxes (beschriftungSollHaben, kontenkategorie, zunahmeAbnahme, buchungenKorrekt, saldoKorrekt) with point allocation per criterion
5. T-Konten definition: Add/remove T-Konten, each with Kontonummer-Select, Anfangsbestand toggle + value, entry rows, expected Saldo (betrag + seite)

- [ ] **Step 2: Register in FragenEditor.tsx**

Add case + default values for new T-Konto questions.

- [ ] **Step 3: Verify build + test editor flow**

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/frageneditor/TKontoEditor.tsx src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "feat(pruefung): add T-Konto editor component"
```

---

## Task 9: T-Konto — Integration

**Files:**
- Modify: `src/components/lp/composer/VorschauTab.tsx`
- Modify: `src/components/lp/KorrekturFrageZeile.tsx`
- Modify: `src/components/lp/KorrekturSchuelerZeile.tsx`
- Modify: `src/components/lp/FragenBrowser.tsx`
- Modify: `apps-script-code.js`
- Modify: `src/utils/fibuAutoKorrektur.ts`

- [ ] **Step 1: Add preview, correction, filter, backend**

Same pattern as Task 6 but for T-Konto:
- Preview: T-shape rendering
- Time estimate: `case 'tkonto': return 5` (5 min per T-Konto question)
- Correction display: Show submitted T-Konten with correct/incorrect highlighting per criterion
- Filter: `<option value="tkonto">T-Konto (...)</option>`
- Backend: Parse `aufgabentext`, `konten`, `kontenauswahl`, `bewertungsoptionen`

- [ ] **Step 2: Add T-Konto auto-correction to fibuAutoKorrektur.ts**

```typescript
export function korrigiereTKonto(
  frage: TKontoFrage,
  antwort: Extract<Antwort, { typ: 'tkonto' }>
): KorrekturErgebnis {
  // Per T-Konto, per activated criterion:
  // - beschriftungSollHaben: check if Soll/Haben labels match expected
  // - kontenkategorie: check if category is correct
  // - zunahmeAbnahme: check if entries are on the correct side
  // - buchungenKorrekt: match entries (order-independent)
  // - saldoKorrekt: check betrag and seite
}
```

- [ ] **Step 3: Verify full flow + commit**

```bash
git add src/components/lp/composer/VorschauTab.tsx src/components/lp/KorrekturFrageZeile.tsx src/components/lp/KorrekturSchuelerZeile.tsx src/components/lp/FragenBrowser.tsx apps-script-code.js src/utils/fibuAutoKorrektur.ts
git commit -m "feat(pruefung): T-Konto integration (preview, correction, filter, backend)"
```

---

## Task 10: Kontenbestimmung — Full Implementation

**Files:**
- Create: `src/components/fragetypen/KontenbestimmungFrage.tsx`
- Create: `src/components/lp/frageneditor/KontenbestimmungEditor.tsx`
- Modify: All integration files (same pattern as Tasks 4-6)
- Modify: `src/utils/fibuAutoKorrektur.ts`

- [ ] **Step 1: Create student component**

Compact table: Geschäftsfall | Konto (dropdown) | Kategorie (dropdown) | Seite (dropdown).
Columns shown/hidden based on `modus`. 2 rows per Geschäftsfall.

- [ ] **Step 2: Create editor component**

Modus selection, Geschäftsfälle list editor, expected answers per fall.

- [ ] **Step 3: Register in FragenEditor.tsx + Layout.tsx**

- [ ] **Step 4: Add integration (preview, correction, filter, backend)**

Time estimate: `case 'kontenbestimmung': return 2` (2 min).

- [ ] **Step 5: Add auto-correction**

```typescript
export function korrigiereKontenbestimmung(
  frage: KontenbestimmungFrage,
  antwort: Extract<Antwort, { typ: 'kontenbestimmung' }>
): KorrekturErgebnis {
  // Per Aufgabe: check kontonummer, kategorie, seite (each optional based on modus)
}
```

- [ ] **Step 6: Verify + commit**

```bash
git add src/components/fragetypen/KontenbestimmungFrage.tsx src/components/lp/frageneditor/KontenbestimmungEditor.tsx src/components/lp/frageneditor/FragenEditor.tsx src/components/Layout.tsx src/components/lp/composer/VorschauTab.tsx src/components/lp/KorrekturFrageZeile.tsx src/components/lp/KorrekturSchuelerZeile.tsx src/components/lp/FragenBrowser.tsx apps-script-code.js src/utils/fibuAutoKorrektur.ts
git commit -m "feat(pruefung): add Kontenbestimmung question type (full)"
```

---

## Task 11: Bilanz/ER — Student Component

**Files:**
- Create: `src/components/fragetypen/BilanzERFrage.tsx`

- [ ] **Step 1: Create the Bilanz student component**

This is the most complex component. Split into sub-sections:

**Bilanz mode:**
- Two-column layout (left/right side)
- Side labels as dropdowns (Aktiven/Passiven)
- Groups with Freitext-Label, Konto-Dropdowns + Betrag inputs
- ↑↓ buttons for reordering groups and accounts
- "+ Konto", "+ Gruppe" buttons
- Group totals + Bilanzsumme inputs

**ER mode:**
- Single-column, multi-step layout
- Stufen with label, Aufwand/Ertrag-Konten, Zwischentotal
- "+ Stufe" button
- Gewinn/Verlust at bottom

**Beides mode:**
- Tabs or stacked: Bilanz above, ER below

Keep component under 500 lines — extract Bilanz and ER into separate sub-components if needed:
- `BilanzERFrage.tsx` (wrapper, ~100 lines)
- Inline: `BilanzSeite` component (per side)
- Inline: `ERStufenEditor` component (per step)

- [ ] **Step 2: Register in Layout.tsx**

- [ ] **Step 3: Verify build + visual test**

- [ ] **Step 4: Commit**

```bash
git add src/components/fragetypen/BilanzERFrage.tsx src/components/Layout.tsx
git commit -m "feat(pruefung): add Bilanz/ER student component"
```

---

## Task 12: Bilanz/ER — Editor Component

**Files:**
- Create: `src/components/lp/frageneditor/BilanzEREditor.tsx`
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx`

- [ ] **Step 1: Create the Bilanz/ER editor**

Editor UI:
1. Modus selection (bilanz / erfolgsrechnung / beides)
2. Konten mit Saldi: List of account + balance inputs (the "raw data" given to students)
3. Musterlösung: Same UI as student view, pre-filled by LP
4. Bewertungsoptionen: 8 checkboxes with point allocation
5. KontenSelect for adding accounts

Keep under 500 lines — extract sub-editors if needed.

- [ ] **Step 2: Register in FragenEditor.tsx**

- [ ] **Step 3: Verify + commit**

```bash
git commit -m "feat(pruefung): add Bilanz/ER editor component"
```

---

## Task 13: Bilanz/ER — Integration

**Files:**
- Modify: All integration files
- Modify: `src/utils/fibuAutoKorrektur.ts`

- [ ] **Step 1: Add preview, correction, filter, backend**

Time estimate: `case 'bilanzstruktur': return 10` (10 min).

- [ ] **Step 2: Add auto-correction**

```typescript
export function korrigiereBilanzER(
  frage: BilanzERFrage,
  antwort: Extract<Antwort, { typ: 'bilanzstruktur' }>
): KorrekturErgebnis {
  // Per activated criterion:
  // - seitenbeschriftung: check labels
  // - gruppenbildung: check group names
  // - gruppenreihenfolge: check group order
  // - kontenreihenfolge: check account order within groups
  // - betraegeKorrekt: check values
  // - zwischentotale: check group sums
  // - bilanzsummeOderGewinn: check total
  // - mehrstufigkeit (ER only): check step structure
}
```

This is the most complex auto-correction. Implement step by step, testing each criterion independently.

- [ ] **Step 3: Verify full flow + commit**

```bash
git commit -m "feat(pruefung): Bilanz/ER integration (preview, correction, filter, backend)"
```

---

## Task 14: Aufgabengruppe — Student Component

**Files:**
- Create: `src/components/fragetypen/AufgabengruppeFrage.tsx`

- [ ] **Step 1: Create the Aufgabengruppe student wrapper**

Create `src/components/fragetypen/AufgabengruppeFrage.tsx`:

Renders:
1. Group title
2. Kontext text (sticky/collapsible header)
3. Optional Kontext-Anhänge (images, PDFs)
4. Teilaufgaben labeled a), b), c) — each renders its own Fragetyp component
5. Navigation within the group

The component needs access to the Fragenbank to resolve `teilaufgabenIds` into actual Frage objects. Use the existing store/props pattern.

- [ ] **Step 2: Register in Layout.tsx**

Add case: `case 'aufgabengruppe': return <AufgabengruppeFrage ... />`

Special handling: When rendering an Aufgabengruppe, the Layout must:
- NOT render the Teilaufgaben as separate questions
- Let the Aufgabengruppe component handle sub-rendering
- **Recursion guard:** Disallow Aufgabengruppen inside Aufgabengruppen. If a `teilaufgabenId` points to another Aufgabengruppe, skip it or show an error.

- [ ] **Step 3: Verify + commit**

```bash
git commit -m "feat(pruefung): add Aufgabengruppe student component"
```

---

## Task 15: Aufgabengruppe — Editor Component

**Files:**
- Create: `src/components/lp/frageneditor/AufgabengruppeEditor.tsx`
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx`

- [ ] **Step 1: Create the Aufgabengruppe editor**

Editor UI:
1. Kontext-Textfeld (Tiptap rich text)
2. Kontext-Anhänge (reuse AnhangEditor)
3. Teilaufgaben management:
   - List of existing Teilaufgaben with titles
   - Button "Frage hinzufügen" → opens FragenBrowser to select existing questions
   - Button "Neue Teilaufgabe erstellen" → creates inline question
   - Reorder via ↑↓ buttons
   - Remove button per Teilaufgabe
4. Punkte: Auto-calculated sum

- [ ] **Step 2: Register in FragenEditor.tsx**

- [ ] **Step 3: Verify + commit**

```bash
git commit -m "feat(pruefung): add Aufgabengruppe editor component"
```

---

## Task 16: Aufgabengruppe — Integration

**Files:**
- Modify: All integration files

- [ ] **Step 1: Preview, correction, filter, backend**

- Preview: Show Kontext + Teilaufgaben-Titel list
- Time estimate: Sum of Teilaufgaben time estimates
- Correction: Block view with per-Teilaufgabe correction
- Filter: `<option value="aufgabengruppe">Aufgabengruppe (...)</option>`
- Backend: Parse `kontext`, `teilaufgabenIds`

- [ ] **Step 2: Update MonitoringDashboard**

The monitoring view tracks per-question progress. For Aufgabengruppen, show progress as fraction of completed Teilaufgaben (e.g., "3/4 Teilaufgaben beantwortet"). Modify `src/components/lp/MonitoringDashboard.tsx` to handle `typ: 'aufgabengruppe'`.

- [ ] **Step 3: Verify full flow + commit**

```bash
git add src/components/lp/composer/VorschauTab.tsx src/components/lp/KorrekturFrageZeile.tsx src/components/lp/KorrekturSchuelerZeile.tsx src/components/lp/FragenBrowser.tsx src/components/lp/MonitoringDashboard.tsx apps-script-code.js
git commit -m "feat(pruefung): Aufgabengruppe integration (preview, correction, filter, backend, monitoring)"
```

---

## Task 17: KI-Aktionen (alle FiBu-Typen)

**Files:**
- Modify: `src/components/lp/frageneditor/useKIAssistent.ts:5-27`
- Modify: `src/components/lp/frageneditor/KITypButtons.tsx`
- Modify: `apps-script-code.js` (kiAssistentEndpoint)

- [ ] **Step 1: Extend AktionKey type**

Add to the union at ~line 5:
```typescript
// Buchhaltung
| 'generiereKontenauswahl'
| 'generiereBuchungssaetze'
| 'pruefeBuchungssaetze'
| 'generiereTKonten'
| 'generiereKontenaufgaben'
| 'generiereBilanzStruktur'
| 'generiereFallbeispiel'
```

- [ ] **Step 2: Create KIFiBuButtons.tsx**

Create `src/components/lp/frageneditor/KIFiBuButtons.tsx` — new file following the pattern of `KITypButtons.tsx` (which handles Zuordnung, R/F, Lückentext, Berechnung). The new file handles Buchungssatz, T-Konto, Kontenbestimmung, Bilanz/ER button groups.

Export: `KIBuchungssatzButtons`, `KITKontoButtons`, `KIKontenbestimmungButtons`, `KIBilanzERButtons`

Each button group follows the existing pattern: `InlineAktionButton` + `ErgebnisAnzeige` from `KIBausteine.tsx`.

- [ ] **Step 3: Add backend handlers in apps-script-code.js**

In `kiAssistentEndpoint()`, add cases for the new action keys. Each calls Claude API with an appropriate system prompt for the FiBu domain.

Example prompt for `generiereKontenauswahl`:
```
Du bist ein Buchhaltungsexperte für Schweizer KMU (KMU-Kontenrahmen).
Gegeben ist folgender Geschäftsfall: {geschaeftsfall}
Schlage 8-12 Konten vor (die korrekten + plausible Distraktoren).
Antwort als JSON-Array: [{"nummer": "1000", "name": "Kasse"}, ...]
```

- [ ] **Step 4: Verify KI flow + commit**

```bash
git commit -m "feat(pruefung): add FiBu KI-Aktionen (Kontenvorschlag, Generierung, Prüfung)"
```

---

## Task 18: Export-Formatierung für neue Typen

**Files:**
- Modify: `src/utils/exportUtils.ts`

- [ ] **Step 1: Add export formatting for all new types**

Add cases for each new type in the export logic:
- **Buchungssatz**: Table "Soll | Haben | Betrag"
- **T-Konto**: T-shape as text (Soll-Seite | Haben-Seite)
- **Kontenbestimmung**: Table "Geschäftsfall | Konto | Kategorie | Seite"
- **Bilanz/ER**: Structured two-column text (Bilanz) or multi-step text (ER)
- **Aufgabengruppe**: Kontext + Teilaufgaben sequentially

- [ ] **Step 2: Commit**

```bash
git add src/utils/exportUtils.ts
git commit -m "feat(pruefung): add export formatting for FiBu + Aufgabengruppe types"
```

---

## Task 19: Final Integration & Cleanup

**Note on FragenEditor.tsx size:** `FragenEditor.tsx` is already ~1367 lines. Adding 5 new type cases will increase it further. If it exceeds 1500 lines during implementation, extract the type-switch logic into a separate `EditorTypeDispatch.tsx` helper before continuing. This is a known exception documented in code-quality.md.

- [ ] **Step 1: Full build check**

Run: `cd ExamLab && npm run build`
Fix any TypeScript errors or missing imports.

- [ ] **Step 2: Visual inspection of all new types**

Run dev server, create one question of each new type, verify:
- Editor works (create, save, reload)
- Student view renders correctly
- Preview tab shows question
- Correction view displays answer
- Filter dropdown includes new types
- Dark mode works for all new components

- [ ] **Step 3: Update HANDOFF.md**

Add a section documenting:
- New FiBu question types implemented
- Aufgabengruppe concept
- KMU-Kontenrahmen location
- Auto-correction approach (rule-based)
- Move "Buchhaltungs-Fragetyp" from "Offene Wünsche" to "Implemented"

- [ ] **Step 4: Add musterlosung auto-generation to all FiBu editors**

Ensure all FiBu editors (not just Buchungssatz) auto-generate the `musterlosung: string` field from the structured solution data. This text is shown in preview and export.

- T-Konto: "Bank: Soll 5'000, Haben 3'000, Saldo 2'000 (Soll)"
- Kontenbestimmung: "1. Kasse (aktiv, Soll), Warenertrag (ertrag, Haben)"
- Bilanz/ER: "Aktiven: UV 15'000, AV 25'000 / Passiven: FK 20'000, EK 20'000"

- [ ] **Step 5: Final commit + push**

```bash
git add src/components/lp/frageneditor/BuchungssatzEditor.tsx src/components/lp/frageneditor/TKontoEditor.tsx src/components/lp/frageneditor/KontenbestimmungEditor.tsx src/components/lp/frageneditor/BilanzEREditor.tsx src/components/lp/frageneditor/AufgabengruppeEditor.tsx
git commit -m "feat(pruefung): Buchhaltungs-Fragetypen + Aufgabengruppe — complete implementation"
git push
```

**Deferred:** Journal-Fragetyp (typ: `journal`) — Datenmodell und Implementation folgt in einer späteren Phase.
