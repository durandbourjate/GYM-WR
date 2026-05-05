# Bundle 2 — Editor-Komfort Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drei UX-Verbesserungen im LP-Frageneditor: Lernziel-Auto-Reset bei Fachwechsel, Themen-Autocomplete, Zonennamen für DnD-Bild + Bildbeschriftung.

**Architecture:** Drei unabhängige additive Features. Type-Erweiterung in `packages/shared/src/types/fragen-core.ts` (zwei optionale `label`-Felder), Apps-Script-Privacy-Strip-Erweiterung, Frontend-UI in 6-8 Stellen. Phasen-Reihenfolge: zuerst Type + Backend (Phase 1, weil Privacy-Vertrag muss vor Frontend-`label`-Schreiben deployed sein), dann Frontend pro Bug (Phasen 2-4), dann Browser-E2E + Merge.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Vitest. Apps-Script (Google) für Backend.

**Spec:** `docs/superpowers/specs/2026-05-04-bundle-2-editor-komfort-design.md`

**Branch:** `feature/bundle-2-editor-komfort` (bereits angelegt, Spec-Commits `b208d2c` + `fcc3ad2`)

---

## File Structure

| Datei | Verantwortlich für | Status |
|---|---|---|
| `packages/shared/src/types/fragen-core.ts` | Type-Definitionen (BildbeschriftungLabel, DragDropBildZielzone) | Modify |
| `ExamLab/apps-script-code.js` | Privacy-Strip in `bereinigeFrageFuerSuS_` (LOESUNGS_FELDER_) + Test-Shim | Modify |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | setFachbereich-Wrapper für Lernziel-Reset + Lernziel-Reload-Effect | Modify |
| `packages/shared/src/editor/components/LernzielWaehler.tsx` | Reset-Banner mit Auto-Hide-Timer (Prop) | Modify |
| `packages/shared/src/editor/sections/MetadataSection.tsx` | datalist-Anbindung für Thema-Input | Modify |
| `ExamLab/src/hooks/useThemenVorschlaege.ts` | Memo-Selector über fragenbankStore.summaries (dedupe + fach-filter) | Create |
| `ExamLab/src/hooks/useThemenVorschlaege.test.ts` | Unit-Test für Selector | Create |
| `packages/shared/src/editor/typen/HotspotEditor.tsx` | Keine Änderung (label schon vorhanden) | — |
| `packages/shared/src/editor/typen/DragDropBildEditor.tsx` | Zonennamen-Input pro Zielzone (echter Editor — `ExamLab/.../DragDropBildEditor.tsx` ist nur Re-Export-Stub) | Modify |
| `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` | Zonennamen-Input pro Beschriftung (echter Editor, ExamLab-Variante ist Stub) | Modify |
| `packages/shared/src/editor/types.ts` | `EditorServices`-Erweiterung: `ladeThemen?: (fachbereich: string) => string[]` | Modify |
| `ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx` | `ladeThemen`-Service-Implementation via `useThemenVorschlaege`-Hook | Modify |
| `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` | Zone-Header mit `label`-Fallback (DnD/Bildbeschriftung) | Modify |

---

## Phase 1 — Type-Erweiterung + Apps-Script-Privacy

**Ziel:** Datenmodell + Backend-Privacy-Strip vorbereiten, BEVOR Frontend `label` schreibt. Reihenfolge wichtig: Apps-Script muss zuerst deployed sein, sonst landet `label` ungesichert in SuS-Response.

### Task 1.1: Type-Erweiterung BildbeschriftungLabel + DragDropBildZielzone

**Files:**
- Modify: `packages/shared/src/types/fragen-core.ts:587-595` (BildbeschriftungLabel) und `:618-629` (DragDropBildZielzone)

- [ ] **Step 1: Edit BildbeschriftungLabel — `label?: string` ergänzen**

```typescript
export interface BildbeschriftungLabel {
  id: string
  position: { x: number; y: number }
  korrekt: string[]
  caseSensitive?: boolean
  erklaerung?: string
  /** Optional LP-Übersicht-Name. Privacy: in bereinigeFrageFuerSuS_ gestripped. */
  label?: string
}
```

- [ ] **Step 2: Edit DragDropBildZielzone — `label?: string` ergänzen**

```typescript
export interface DragDropBildZielzone {
  id: string
  form: 'rechteck' | 'polygon'
  punkte: { x: number; y: number }[]
  korrekteLabels: string[]
  erklaerung?: string
  /** Optional LP-Übersicht-Name. Privacy: in bereinigeFrageFuerSuS_ gestripped. */
  label?: string
}
```

- [ ] **Step 3: tsc-Check (Cross-Project)**

Run: `cd ExamLab && npx tsc -b && npx tsc -b ../packages/shared --force`
Expected: keine Errors. Memory-Lehre L.b: tsc -b kann EXIT=0 trotz Errors haben — daher beide Befehle laufen lassen + Output direkt prüfen.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/fragen-core.ts
git commit -m "Bundle 2 P1.1: Type-Erweiterung label?: string für DnD + Bildbeschriftung"
```

### Task 1.2: Apps-Script LOESUNGS_FELDER_ erweitern

**Files:**
- Modify: `ExamLab/apps-script-code.js:2206-2207` (LOESUNGS_FELDER_-Tabelle)

- [ ] **Step 1: Edit LOESUNGS_FELDER_-Block**

Suche `LOESUNGS_FELDER_` und finde den Block mit `feld: 'zielzonen'` und `feld: 'beschriftungen'`. Ersetze:

```javascript
// vorher (Z. 2205-2206 aktuell, verifiziert per sed):
{ feld: 'beschriftungen', subFelder: ['korrekt', 'erklaerung'] },
{ feld: 'zielzonen', subFelder: ['korrekteLabels', 'erklaerung'] },

// nachher:
{ feld: 'beschriftungen', subFelder: ['korrekt', 'erklaerung', 'label'] },
{ feld: 'zielzonen', subFelder: ['korrekteLabels', 'erklaerung', 'label'] },
```

Hotspot-Stelle (`feld: 'bereiche'`, Z. 2207) bleibt UNVERÄNDERT — Hotspot-`label` ist Aufgabenstellung, nicht Lösungs-Hint.

**Hinweis:** Spec listete `'caseSensitive'` als zusätzliches Sub-Feld für `beschriftungen`. Audit-Verifikation zeigt: aktueller Code strippt `caseSensitive` nicht (war auch vor Bundle 2 schon nicht in der Liste) und es ist eine Bewertungsregel (case-sensitive matching), KEINE Lösungs-Information. Plan-Korrektur: `caseSensitive` NICHT in Strip-Liste ergänzen — nur `label`.

- [ ] **Step 2: Test-Shim `testBundle2Privacy_` schreiben**

Suche im File die Test-Shim-Sektion (z.B. nach `testC9Privacy_` von Bundle C9). Füge dahinter:

```javascript
function testBundle2Privacy_() {
  Logger.log('=== Bundle 2 Privacy-Test ===')

  // DragDrop-Bild: label muss aus zielzonen[] gestripped werden
  var ddFrage = {
    typ: 'dragdrop_bild',
    bildUrl: 'test.png',
    zielzonen: [
      { id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'], label: 'Aktiva-Zone', erklaerung: 'soll' },
    ],
    labels: [{ id: 'l1', text: 'Aktiva' }],
  };
  var ddBereinigt = bereinigeFrageFuerSuS_(ddFrage, {});
  if (ddBereinigt.zielzonen[0].label !== undefined) {
    throw new Error('FAIL DnD: label sollte gestripped sein, ist aber: ' + ddBereinigt.zielzonen[0].label);
  }
  if (ddBereinigt.zielzonen[0].korrekteLabels !== undefined) {
    throw new Error('FAIL DnD: korrekteLabels sollte ebenfalls gestripped sein');
  }
  Logger.log('  ✓ DnD-Bild label + korrekteLabels gestripped');

  // Bildbeschriftung: label muss aus beschriftungen[] gestripped werden
  var bbFrage = {
    typ: 'bildbeschriftung',
    bildUrl: 'test.png',
    beschriftungen: [
      { id: 'b1', position: { x: 50, y: 50 }, korrekt: ['Eingang'], label: 'Eingang-Zone', erklaerung: 'soll', caseSensitive: false },
    ],
  };
  var bbBereinigt = bereinigeFrageFuerSuS_(bbFrage, {});
  if (bbBereinigt.beschriftungen[0].label !== undefined) {
    throw new Error('FAIL Bildbeschriftung: label sollte gestripped sein, ist aber: ' + bbBereinigt.beschriftungen[0].label);
  }
  if (bbBereinigt.beschriftungen[0].korrekt !== undefined) {
    throw new Error('FAIL Bildbeschriftung: korrekt sollte ebenfalls gestripped sein');
  }
  Logger.log('  ✓ Bildbeschriftung label + korrekt gestripped');

  // Hotspot: label MUSS BLEIBEN (Aufgabenstellung)
  var hsFrage = {
    typ: 'hotspot',
    bildUrl: 'test.png',
    bereiche: [
      { id: 'h1', form: 'rechteck', punkte: [], label: 'Konjunkturindikator', punktzahl: 1, erklaerung: 'wegen X' },
    ],
    mehrfachauswahl: false,
  };
  var hsBereinigt = bereinigeFrageFuerSuS_(hsFrage, {});
  if (hsBereinigt.bereiche[0].label !== 'Konjunkturindikator') {
    throw new Error('FAIL Hotspot: label sollte UNVERÄNDERT bleiben, ist aber: ' + hsBereinigt.bereiche[0].label);
  }
  Logger.log('  ✓ Hotspot label bleibt sichtbar (Aufgabenstellung)');

  Logger.log('=== Bundle 2 Privacy-Test bestanden ===');
}
```

- [ ] **Step 3: Public-Wrapper `testBundle2Privacy` (ohne underscore) für GAS-UI**

Suche analog wie für `testC9Privacy_` der Wrapper aussieht und füge analog hinzu. Üblicherweise:

```javascript
function testBundle2Privacy() { return testBundle2Privacy_(); }
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle 2 P1.2: Apps-Script LOESUNGS_FELDER_ erweitert + Privacy-Test-Shim"
```

- [ ] **Step 5: USER-TASK — Apps-Script-Deploy + Privacy-Test ausführen**

User muss manuell:
1. `ExamLab/apps-script-code.js` in Google Apps Script Editor laden (Copy-Paste)
2. `testBundle2Privacy` im GAS-Editor ausführen → muss alle 3 Checks bestehen (Logs: „✓ DnD-Bild...", „✓ Bildbeschriftung...", „✓ Hotspot...", „=== Bundle 2 Privacy-Test bestanden ===")
3. Wenn alle 3 ✓: Neue Bereitstellung deployen
4. URL gleich (Web-App-URL ist stabil)

User bestätigt Deploy mit „Apps-Script deployed". Dann weiter zu Phase 2.

---

## Phase 2 — Bug 6 Frontend (Zielzonen-Namen)

### Task 2.1: DragDropBildEditor — Zonennamen-Input

**Files:**
- Modify: `packages/shared/src/editor/typen/DragDropBildEditor.tsx` (echte Editor-Datei; `ExamLab/.../DragDropBildEditor.tsx` ist 2-Zeilen-Re-Export-Stub und wird NICHT angefasst)

- [ ] **Step 1: Datei lesen, Zone-Render-Stelle finden**

Suche nach `zielzonen.map` oder `zielzone.id` oder Header-Render pro Zone in `packages/shared/src/editor/typen/DragDropBildEditor.tsx`. Identifiziere den Render-Block für eine einzelne Zone (üblicherweise eine Card/Panel mit Polygon-Editor + korrekteLabels-Chips). Der Setter heißt typischerweise `setZielzonen(prev => prev.map(z => z.id === id ? {...z, label: ...} : z))`.

- [ ] **Step 2: Zonennamen-Input ergänzen**

Direkt unter dem Zone-Header (oder in der Header-Zeile, je nach Layout) ein Input einfügen:

```tsx
<input
  type="text"
  value={zielzone.label ?? ''}
  onChange={(e) => updateZielzone(zielzone.id, { ...zielzone, label: e.target.value || undefined })}
  placeholder="Zonenname (optional, z.B. 'Aktiva')"
  className="text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
/>
```

`updateZielzone` heißt in der Datei vermutlich anders — adoptiere den existing Pattern. Falls es `setZielzonen(prev => prev.map(z => z.id === id ? {...z, label} : z))` ist: nutze das.

`label: e.target.value || undefined` — leerer String wird zu undefined, damit das optionale Feld sauber bleibt (kein leerer String im Storage).

- [ ] **Step 3: Visuelle Verifikation per Read**

Lies die geänderte Datei und prüfe ob das Input syntactisch + style-konsistent zu anderen Inputs ist. Kein Tests-Run hier, weil kein neuer Test (UI-only).

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/frageneditor/DragDropBildEditor.tsx
git commit -m "Bundle 2 P2.1: Zonennamen-Input in DragDropBildEditor"
```

### Task 2.2: BildbeschriftungEditor — Zonennamen-Input

**Files:**
- Modify: `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` (echte Editor-Datei; ExamLab-Variante ist Stub)

- [ ] **Step 1: Datei lesen, Zone-Render-Stelle finden**

Suche nach `beschriftungen.map` oder `beschriftung.id` in `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` für den Per-Zone-Render-Block. Existing Header zeigt vermutlich „Label N: …" — dieses ändern auf `label || \`Marker N\`` oder ergänzen mit Zonennamen-Input über dem korrekt-Chips-Block.

- [ ] **Step 2: Zonennamen-Input ergänzen**

Analog Task 2.1, aber auf `beschriftung.label`:

```tsx
<input
  type="text"
  value={beschriftung.label ?? ''}
  onChange={(e) => updateBeschriftung(beschriftung.id, { ...beschriftung, label: e.target.value || undefined })}
  placeholder="Zonenname (optional, z.B. 'Eingang')"
  className="text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
/>
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/lp/frageneditor/BildbeschriftungEditor.tsx
git commit -m "Bundle 2 P2.2: Zonennamen-Input in BildbeschriftungEditor"
```

### Task 2.3: KorrekturFrageVollansicht — Zone-Header mit label-Fallback

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1: Render-Stellen für DragDrop-Bild und Bildbeschriftung finden**

Suche nach:
- `zielzonen` oder `dragdrop_bild` Render-Block
- `beschriftungen` oder `bildbeschriftung` Render-Block

Aktuell rendern beide vermutlich „Zone N" (mit N = index+1) als Header.

- [ ] **Step 2: Header-Format auf `label`-Fallback ändern**

Für DnD-Bild Zone-Header:

```tsx
<span className="font-medium text-slate-800 dark:text-slate-100">
  {zielzone.label || `Zone ${idx + 1}`}
</span>
```

Für Bildbeschriftung-Zone-Header analog:

```tsx
<span className="font-medium text-slate-800 dark:text-slate-100">
  {beschriftung.label || `Marker ${idx + 1}`}
</span>
```

(„Marker" oder was die existierende Bezeichnung ist — wenn aktuell „Zone" verwendet, dann das beibehalten.)

- [ ] **Step 3: tsc + bestehende Tests grün**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: alle bestehenden Tests grün, kein neuer Test in dieser Task (rein cosmetic Render-Change).

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx
git commit -m "Bundle 2 P2.3: Zone-Header mit label-Fallback in Korrektur-Vollansicht"
```

---

## Phase 3 — Bug 3 (Themen-Autocomplete)

### Task 3.1: Hook `useThemenVorschlaege` (TDD)

**Files:**
- Create: `ExamLab/src/hooks/useThemenVorschlaege.ts`
- Test: `ExamLab/src/hooks/useThemenVorschlaege.test.ts`

- [ ] **Step 1: Failing Test schreiben**

```typescript
// ExamLab/src/hooks/useThemenVorschlaege.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useThemenVorschlaege } from './useThemenVorschlaege'

vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: (selector: (s: { summaries: Array<{ thema: string; fachbereich: string }> }) => unknown) =>
    selector({
      summaries: [
        { thema: 'Konjunktur', fachbereich: 'VWL' },
        { thema: 'Konjunktur', fachbereich: 'VWL' }, // Duplikat
        { thema: 'Inflation', fachbereich: 'VWL' },
        { thema: 'Buchungssatz', fachbereich: 'BWL' },
        { thema: '', fachbereich: 'VWL' }, // leer, soll rausgefiltert werden
      ],
    }),
}))

describe('useThemenVorschlaege', () => {
  it('liefert Themen aus dem Fachbereich, dedupliziert + sortiert + leer-frei', () => {
    const { result } = renderHook(() => useThemenVorschlaege('VWL'))
    expect(result.current).toEqual(['Inflation', 'Konjunktur'])
  })

  it('liefert leeres Array wenn Fachbereich keine Treffer hat', () => {
    const { result } = renderHook(() => useThemenVorschlaege('Recht'))
    expect(result.current).toEqual([])
  })

  it('liefert leeres Array wenn fachbereich undefined', () => {
    const { result } = renderHook(() => useThemenVorschlaege(undefined))
    expect(result.current).toEqual([])
  })
})
```

- [ ] **Step 2: Test laufen lassen → muss FAIL**

Run: `cd ExamLab && npx vitest run src/hooks/useThemenVorschlaege.test.ts`
Expected: FAIL — file existiert noch nicht.

- [ ] **Step 3: Hook implementieren**

```typescript
// ExamLab/src/hooks/useThemenVorschlaege.ts
import { useMemo } from 'react'
import { useFragenbankStore } from '../store/fragenbankStore'

/**
 * Liefert dedupliziertes, alphabetisch sortiertes Array aller Themen
 * der Fragensammlung im gegebenen Fachbereich. Leere Themen werden gefiltert.
 *
 * Verwendung: HTML <datalist> für Themen-Autocomplete im Frageneditor.
 */
export function useThemenVorschlaege(fachbereich: string | undefined): string[] {
  const summaries = useFragenbankStore((s) => s.summaries)
  return useMemo(() => {
    if (!fachbereich) return []
    const themen = new Set<string>()
    for (const s of summaries) {
      if (s.fachbereich === fachbereich && s.thema && s.thema.trim()) {
        themen.add(s.thema.trim())
      }
    }
    return Array.from(themen).sort((a, b) => a.localeCompare(b, 'de'))
  }, [summaries, fachbereich])
}
```

- [ ] **Step 4: Test laufen lassen → muss PASS**

Run: `cd ExamLab && npx vitest run src/hooks/useThemenVorschlaege.test.ts`
Expected: alle 3 Tests grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/hooks/useThemenVorschlaege.ts ExamLab/src/hooks/useThemenVorschlaege.test.ts
git commit -m "Bundle 2 P3.1: useThemenVorschlaege Hook (TDD: 3 Tests)"
```

### Task 3.2: EditorServices-Erweiterung + MetadataSection-datalist

**Architektur-Entscheidung (rev2):** `fachbereich` ist interner State von SharedFragenEditor (Z. 172). Der Caller (PruefungFragenEditor) hat keinen Zugriff auf den aktuellen Fachbereich der editierten Frage — bei Fachwechsel im Editor würden vorgereichte fixe Vorschläge stale bleiben. Lösung: existing `EditorServices`-Pattern nutzen (siehe `services.ladeLernziele` als Vorlage). Service-Funktion `ladeThemen(fachbereich) => string[]` wird vom Caller injiziert, intern in SharedFragenEditor mit aktuellem `fachbereich`-State aufgerufen.

**Files:**
- Modify: `packages/shared/src/editor/types.ts` (EditorServices-Interface erweitern)
- Modify: `packages/shared/src/editor/sections/MetadataSection.tsx` (datalist)
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx` (Service-Aufruf + Prop an MetadataSection)
- Modify: `ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx` (Service-Implementation via Hook)

- [ ] **Step 1: EditorServices erweitern**

In `packages/shared/src/editor/types.ts`, im `EditorServices`-Interface (Z. ~52-70):

```ts
export interface EditorServices {
  // ... existing
  ladeLernziele?: (gefaess: string, fachbereich: string) => Promise<Lernziel[]>
  // NEU:
  /** Liefert Themen-Vorschläge für Autocomplete im Frageneditor, fach-gefiltert. */
  ladeThemen?: (fachbereich: string) => string[]
}
```

- [ ] **Step 2: MetadataSection datalist-Anbindung**

`packages/shared/src/editor/sections/MetadataSection.tsx`: Props-Interface ergänzen + Thema-Input erweitern.

```tsx
interface Props {
  // ... existing props
  themenVorschlaege?: string[]
}

// Im JSX, beim Thema-Input:
<input
  type="text"
  value={thema}
  onChange={(e) => setThema(e.target.value)}
  list={themenVorschlaege?.length ? `themen-vorschlaege-${fachbereich}` : undefined}
  // ... bestehende className/disabled/etc
/>
{themenVorschlaege && themenVorschlaege.length > 0 && (
  <datalist id={`themen-vorschlaege-${fachbereich}`}>
    {themenVorschlaege.map((t) => (
      <option key={t} value={t} />
    ))}
  </datalist>
)}
```

`fachbereich` ist bereits Prop in MetadataSection.

- [ ] **Step 3: SharedFragenEditor — Service-Aufruf mit aktuellem State**

In `packages/shared/src/editor/SharedFragenEditor.tsx`, irgendwo nach dem `fachbereich`-useState (Z. 172):

```tsx
// Themen-Vorschläge per Service holen — sieht aktuellen fachbereich-State
const themenVorschlaege = services.ladeThemen?.(fachbereich) ?? []
```

(Kein `useMemo` nötig — der ExamLab-Hook intern memoized bereits).

Bei `<MetadataSection ...>`-Aufruf Prop weitergeben:

```tsx
<MetadataSection
  // ... existing
  themenVorschlaege={themenVorschlaege}
/>
```

- [ ] **Step 4: PruefungFragenEditor — Service-Implementation**

In `ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx`, im `services`-Objekt (analog zu `ladeLernziele`-Implementation Z. ~99-105):

```tsx
import { useThemenVorschlaege } from '../../../hooks/useThemenVorschlaege'

// Im Component-Body:
// Hook ruft sich für jeden fachbereich neu auf — wir wrappen in eine stable callable
// (oder rufen direkt in services.ladeThemen mit dem fachbereich-Arg).
// Pattern A (Recommended): direkter Aufruf via Closure
const ladeThemen = useCallback((fachbereich: string) => {
  // useThemenVorschlaege ist ein Hook und kann nicht in Callbacks aufgerufen werden.
  // Lösung: Hook außerhalb aufrufen mit dynamischem fachbereich.
  // Da wir dynamischen fachbereich brauchen, geht das nicht direkt.
  // ...
}, [])
```

WICHTIG: React-Hooks dürfen nur top-level aufgerufen werden, nicht in Callbacks. Daher folgender Pattern:

```tsx
// In PruefungFragenEditor:
import { useFragenbankStore } from '../../../store/fragenbankStore'
import { useMemo, useCallback } from 'react'

// Im Component:
const summaries = useFragenbankStore((s) => s.summaries)

const ladeThemen = useCallback((fachbereich: string): string[] => {
  if (!fachbereich) return []
  const themen = new Set<string>()
  for (const s of summaries) {
    if (s.fachbereich === fachbereich && s.thema && s.thema.trim()) {
      themen.add(s.thema.trim())
    }
  }
  return Array.from(themen).sort((a, b) => a.localeCompare(b, 'de'))
}, [summaries])

const services = useMemo(() => ({
  // ... existing services like ladeLernziele
  ladeThemen,
}), [/* existing deps */, ladeThemen])
```

**Hinweis Hook vs. Closure:** Der `useThemenVorschlaege`-Hook aus Task 3.1 ist gut für Test-Isolation, aber im PruefungFragenEditor brauchen wir die Funktion mit dynamischem `fachbereich`-Argument. Inline-Closure mit `useFragenbankStore` ist hier idiomatisch. Hook bleibt im Plan für eventuelle direkte UI-Verwendung an anderer Stelle (z.B. wenn LP-Filter-UI später Themen-Autocomplete braucht).

- [ ] **Step 5: tsc + alle Tests grün**

Run: `cd ExamLab && npx tsc -b && npx tsc -b ../packages/shared --force && npx vitest run`
Expected: clean, alle Tests grün.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/editor/types.ts packages/shared/src/editor/sections/MetadataSection.tsx packages/shared/src/editor/SharedFragenEditor.tsx ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx
git commit -m "Bundle 2 P3.2: Themen-Autocomplete via EditorServices-ladeThemen + datalist"
```

---

## Phase 4 — Bug 2 (Lernziel-Auto-Reset)

### Task 4.1: LernzielWaehler — Reset-Banner-Prop

**Files:**
- Modify: `packages/shared/src/editor/components/LernzielWaehler.tsx`

- [ ] **Step 1: Banner-Prop + Auto-Hide-Effect ergänzen**

**Import-Note:** LernzielWaehler hat aktuell nur `useState, useMemo`-Import. `useEffect` muss zum Import hinzugefügt werden (`import { useState, useMemo, useEffect } from 'react'`).

**Prop-Pattern:** Banner wird vom Caller (SharedFragenEditor) als Counter `number | undefined` übergeben — jeder Counter-Increment triggert den Effect (neue Number-Referenz). Daher `zeigeResetHinweis?: number` (nicht boolean).

```tsx
interface Props {
  // ... existing props
  /** Counter-Increment triggert den Reset-Hinweis-Banner für 5s. undefined = kein Hinweis. */
  zeigeResetHinweis?: number
}

export function LernzielWaehler({ zeigeResetHinweis, ...props }: Props) {
  // ... existing logic

  const [bannerSichtbar, setBannerSichtbar] = useState(false)

  useEffect(() => {
    if (!zeigeResetHinweis) return
    setBannerSichtbar(true)
    const timer = setTimeout(() => setBannerSichtbar(false), 5000)
    return () => clearTimeout(timer)
  }, [zeigeResetHinweis])

  return (
    <div>
      {bannerSichtbar && (
        <div role="status" className="mb-2 p-2 rounded text-xs bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          Lernziele wurden bei Fachwechsel zurückgesetzt.
        </div>
      )}
      {/* ... existing render */}
    </div>
  )
}
```

- [ ] **Step 2: tsc-Check**

Run: `cd ExamLab && npx tsc -b ../packages/shared --force`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/editor/components/LernzielWaehler.tsx
git commit -m "Bundle 2 P4.1: LernzielWaehler Reset-Banner-Prop mit 5s Auto-Hide"
```

### Task 4.2: SharedFragenEditor — setFachbereich-Wrapper + Lernziel-Reload-Fix

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx` (drei Edit-Stellen)

**Wichtig (rev2):** Der existing useEffect für Lernziele-Load (Z. 615-625) hat einen Early-Return-Guard `if (!services.ladeLernziele || lernziele.length > 0) return`. Wenn nur `[fachbereich]` als deps ergänzt wird, läuft der Effect zwar erneut bei Fachwechsel — aber `lernziele.length > 0` ist immer noch true (alte Liste vom alten Fach) → Early-Return → keine Neuladung. Daher muss der setFachbereich-Wrapper ZUSÄTZLICH `setLernziele([])` triggern, damit der nachfolgende Effect die Liste neu lädt.

- [ ] **Step 1: setFachbereich-Wrapper ergänzen (drei Setter-Calls)**

Aktuell: `const [fachbereich, setFachbereich] = useState<Fachbereich>(...)` (Z. ~172).

Ändere zu:

```tsx
const [fachbereich, setFachbereichRaw] = useState<Fachbereich>(
  frage?.fachbereich ?? defaultFachbereich(config.benutzer.fachschaft) as Fachbereich
)
const [resetBanner, setResetBanner] = useState<number>(0) // counter, jeder Increment triggert Banner-Reset

const setFachbereich = useCallback((neu: Fachbereich) => {
  setFachbereichRaw((prev) => {
    if (prev !== neu) {
      // Fachwechsel: drei Resets nötig
      setLernzielIds([])           // (a) Aktuelle Lernziel-Auswahl der Frage leeren
      setLernziele([])             // (b) Lernziel-LISTE leeren — sonst greift Early-Return im useEffect
      setResetBanner((c) => c + 1) // (c) Banner-Counter triggern
    }
    return neu
  })
}, [])
```

Setter-Stabilität: `setLernzielIds`, `setLernziele`, `setResetBanner` sind alle React-`useState`-Setter — referenz-stabil, müssen nicht in deps.

`setLernzielIds` und `setLernziele` müssen existieren — kurz im File suchen + verifizieren der Namen.

- [ ] **Step 2: Lernziel-Load-Effect Fachbereich-Dep ergänzen**

Suche den `useEffect` mit `services.ladeLernziele`-Aufruf (Z. ~615-625 verifiziert per sed).

Aktuell:
```tsx
useEffect(() => {
  if (!services.ladeLernziele || lernziele.length > 0) return
  let abgebrochen = false
  setLernzieleLadend(true)
  services.ladeLernziele(config.benutzer?.email ?? '', fachbereich)
    .then(lz => { if (!abgebrochen && lz) setLernziele(lz) })
    .catch(e => console.warn('[SharedFragenEditor] Lernziele laden fehlgeschlagen:', e))
    .finally(() => { if (!abgebrochen) setLernzieleLadend(false) })
  return () => { abgebrochen = true }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // Nur einmal beim Mount laden
```

Ändere `deps`-Array von `[]` auf `[fachbereich]`:

```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [fachbereich]) // Bei Mount UND bei Fachwechsel laden (lernziele wird vorher in setFachbereich-Wrapper geleert)
```

eslint-disable-Comment beibehalten (mehrere Closures ungetracked, das ist OK weil setter-stable).

**Funktions-Verifikation der Reset-Kette bei Fachwechsel:**
1. User wechselt Fach → `setFachbereich(neu)` aufgerufen
2. Wrapper: `setLernziele([])` → State-Update queued
3. Wrapper: `setLernzielIds([])` → State-Update queued
4. Wrapper: `setFachbereichRaw(neu)` → State-Update queued
5. React re-rendert mit neuem fachbereich-State + lernziele=[]
6. useEffect sieht neuen `fachbereich` in deps → läuft erneut
7. Guard: `lernziele.length > 0` = false → Early-Return übersprungen
8. `services.ladeLernziele(email, neu)` läuft → setzt `setLernziele(lz)` für neuen Fachbereich

- [ ] **Step 3: LernzielWaehler-Aufruf — Banner-Prop weitergeben**

Suche `<LernzielWaehler` im File und ergänze:

```tsx
<LernzielWaehler
  // ... existing props
  zeigeResetHinweis={resetBanner > 0 ? resetBanner : undefined}
/>
```

Der Counter-Pattern via `resetBanner > 0 ? resetBanner : undefined` triggert den `useEffect` im LernzielWaehler bei jedem Increment (neue Number-Referenz).

- [ ] **Step 4: tsc + Tests grün**

Run: `cd ExamLab && npx tsc -b && npx tsc -b ../packages/shared --force && npx vitest run`
Expected: clean. Bestehende Tests sollten grün bleiben (Wrapper ist transparent für Initial-Render-Pfad).

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/editor/SharedFragenEditor.tsx
git commit -m "Bundle 2 P4.2: setFachbereich-Wrapper für Lernziel-Reset + useEffect-dep + lernziele-Liste-Clear"
```

---

## Phase 5 — Browser-E2E + Merge

### Task 5.1: Pre-Merge-Checks

**Files:** keine

- [ ] **Step 1: Full Vitest + tsc + build**

Run:
```bash
cd ExamLab
npx tsc -b
npx tsc -b ../packages/shared --force
npx vitest run
npm run build
npm run lint:as-any
```

Expected: alle clean, lint:as-any 0/0/0.

- [ ] **Step 2: HANDOFF.md aktualisieren**

Bundle 2 als „Letzter Stand auf main" oben einfügen, analog Bundle 1 (siehe `HANDOFF.md` aktueller Top-Block für Format-Vorlage).

```markdown
### Bundle 2 — Editor-Komfort ✅ MERGED (TT.05.2026)

3 UX-Features, alle additiv (kein Breaking Change, keine Daten-Migration).

1. **Bug 2 — Lernziel-Auto-Reset bei Fachwechsel** (`<commit>`): SharedFragenEditor setFachbereich-Wrapper triggert `setLernzielIds([])` + Reset-Banner in LernzielWaehler (5s Auto-Hide). useEffect-deps ergänzt für Lernziel-Reload pro Fach.
2. **Bug 3 — Themen-Autocomplete** (`<commit>`): Native HTML datalist mit deduplizierten Themen aus `useFragenbankStore.summaries`, fach-gefiltert via neuem Hook `useThemenVorschlaege`.
3. **Bug 6 — Zonennamen-Feld für DnD-Bild + Bildbeschriftung** (`<commit>`): `label?: string` auf DragDropBildZielzone + BildbeschriftungLabel. Editor-Input pro Zone, Korrektur-Vollansicht zeigt label als Header (Fallback „Zone N"). SuS-stripping via Apps-Script LOESUNGS_FELDER_ — Hotspot bleibt unverändert (label = Aufgabenstellung).

Apps-Script-Deploy nötig (1 Bereitstellung). 4 neue Tests.
```

- [ ] **Step 3: Commit HANDOFF + Push feature branch**

```bash
git add ExamLab/HANDOFF.md
git commit -m "HANDOFF: Bundle 2 dokumentiert"
git push -u origin feature/bundle-2-editor-komfort
git push origin +feature/bundle-2-editor-komfort:preview
```

### Task 5.2: Browser-E2E auf Staging

**Files:** keine

- [ ] **Step 1: Staging-Build abwarten (~2-3 min)**

GitHub Actions deployed `preview` Branch automatisch.

- [ ] **Step 2: Browser-Test-Plan**

Mit echten Logins (LP `wr.test@gymhofwil.ch`) — Tab-Gruppe via `tabs_context_mcp`:

| # | Test-Pfad | Erwartung |
|---|---|---|
| 1 | LP-Editor: neue Frage anlegen, Fach wählen → Lernziel-Dropdown leer (Reset-Banner sichtbar 5s) | ✓ Banner + Liste leer |
| 2 | LP-Editor: nach Reset 1× Lernziel auswählen, dann Fach erneut wechseln → Auswahl wieder leer | ✓ Reset-Wiederholung |
| 3 | LP-Editor: Thema-Input klicken → Browser zeigt datalist-Vorschläge der bereits existierenden VWL-Themen | ✓ Vorschlagsliste sichtbar |
| 4 | LP-Editor: Thema „Konj" tippen → Browser filtert auf „Konjunktur"-Variante | ✓ Adaptive Filterung |
| 5 | LP-Editor: DnD-Bild-Frage öffnen, neue Zone hinzufügen → Zonennamen-Input sichtbar | ✓ Input sichtbar |
| 6 | LP-Editor: Zonenname „Aktiva" eintragen, speichern → Frage in Sammlung sichtbar | ✓ persistiert |
| 7 | LP-Korrektur Vollansicht: Zone-Header zeigt „Aktiva" statt „Zone 1" | ✓ Header korrekt |
| 8 | SuS-Modus (Tab 2: SuS-Login): DnD-Bild-Frage starten → Network-Tab inspect → Response enthält KEIN `label` in `zielzonen[]` | ✓ Privacy intakt |
| 9 | SuS-Modus: Hotspot-Frage öffnen → Network-Tab inspect → Response enthält `label` in `bereiche[]` (Aufgabenstellung sichtbar) | ✓ Hotspot unverändert |

- [ ] **Step 3: User-Bestätigung warten**

User testet die 9 Pfade und gibt Freigabe. Bei Bug → Hotfix-Round, Push, retest.

### Task 5.3: Merge → main + Cleanup

**Files:** keine

- [ ] **Step 1: Merge zu main (no-ff)**

```bash
git checkout main
git merge --no-ff feature/bundle-2-editor-komfort -m "Merge feature/bundle-2-editor-komfort (Bundle 2: Editor-Komfort)"
```

- [ ] **Step 2: Push + Branch-Cleanup**

```bash
git push origin main
git branch -d feature/bundle-2-editor-komfort
git push origin --delete feature/bundle-2-editor-komfort
```

- [ ] **Step 3: Memory-Update**

Neue file `project_bundle_2_editor_komfort.md` im Memory-Pfad anlegen + MEMORY.md Index ergänzen (analog Bundle 1).

---

## Verifikation

- `tsc -b` clean (ExamLab + shared force)
- `vitest run` alle bestehenden Tests grün, neue Tests grün (≥3 für Bundle 2)
- `lint:as-any` 0/0/0
- `npm run build` clean
- Browser-E2E mit echten Logins: 9 Pfade aus Task 5.2 Step 2 alle ✓
- Apps-Script-Privacy-Test (`testBundle2Privacy`) im GAS-Editor: 3 Checks ✓

## Aufwand-Schätzung

- **Phasen:** 5 (P1 Backend, P2 Bug 6, P3 Bug 3, P4 Bug 2, P5 E2E + Merge)
- **Tasks:** 11 (P1: 2, P2: 3, P3: 2, P4: 2, P5: 3)
- **Steps total:** ~50 (jeder Task hat 3-5 Steps)
- **Commits:** ~8 atomare + 1 Merge-Commit
- **Sessions:** 1 (Bundle als single-session machbar)
- **Apps-Script-Deploys:** 1 (Phase 1, vor Frontend-Phasen)
