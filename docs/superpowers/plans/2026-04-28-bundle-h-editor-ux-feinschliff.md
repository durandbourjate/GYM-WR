# Bundle H — Editor-UX Feinschliff Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editor-Vereinheitlichung (Violett-Pflichtfeld-System), 4 typ-spezifische Vereinfachungen, SuS-Tastaturnavigation, Schülercode-UI ausblenden — gemäss Spec [2026-04-28-editor-ux-feinschliff-design.md](../specs/2026-04-28-editor-ux-feinschliff-design.md) rev3.

**Architecture:** Zentraler Validation-Helper in `packages/shared/src/editor/pflichtfeldValidation.ts`. Editor-Komponenten konsumieren ihn pro Frageform. Save-Path-Hook im `SharedFragenEditor` triggert Bestätigungsdialog für Pflicht-leer und Drag&Drop-Doppellabel — beide via `BaseDialog`. Tastatur-Handler in `UebungsScreen.tsx` erweitert um Enter/Cmd+Enter mit Whitelist `data-no-enter-submit`. Audit-Skripte in `ExamLab/scripts/audit-bundle-h/` zählen Bestand vor Merge.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap (PWA). Tests: vitest + jsdom. Drag&Drop: `@dnd-kit/core` v6.3.1.

**Branch:** `feature/editor-ux-feinschliff-bundle-h` (Feature-Branch ab `main`).

---

## Wichtige Spec-Anpassungen aus Plan-Vorbereitungs-Audit

Der Code-Audit vor dem Plan hat zwei Spec-Annahmen korrigiert:

1. **Audio ist bereits aus `FrageTypAuswahl.tsx` entfernt** — Die `KATEGORIEN`-Konstante (Zeilen 16–40) führt 'audio' nicht mehr. Spec-Sektion 2 reduziert sich auf Verifikation + Bestand-Sweep + KI-Backend-Check.
2. **Vitest-Glob ist `src/**/*.test.{ts,tsx}`** — Tests für Editoren in `packages/shared/src/editor/typen/` werden NICHT geladen. Plan-Workaround: Tests in `src/components/lp/frageneditor/__tests__/` ablegen ODER Vitest-Config erweitern. Wir wählen **Erweiterung der Globs** (Phase 0 Task) als saubere Lösung.

---

## File Structure

### Neu zu erstellen

| Pfad | Verantwortung |
|---|---|
| `ExamLab/packages/shared/src/editor/pflichtfeldValidation.ts` | Zentrale Pflicht/Empfohlen-Validation pro Fragetyp + Default-Branch + Defensiv-Behandlung |
| `ExamLab/packages/shared/src/editor/pflichtfeldValidation.test.ts` | Unit-Tests pro Fragetyp + Defensiv-Pfade |
| `ExamLab/packages/shared/src/editor/components/PflichtfeldDialog.tsx` | Bestätigungsdialog für Pflicht-leer (nutzt BaseDialog) |
| `ExamLab/packages/shared/src/editor/components/DoppelteLabelDialog.tsx` | Bestätigungsdialog für Drag&Drop-Bild-Doppel-Labels |
| `ExamLab/packages/shared/src/editor/components/PruefungstauglichBadge.tsx` | Editor-Header-Badge mit Klick-zu-erstem-leerem-Feld |
| `ExamLab/packages/shared/src/editor/components/BulkPasteModal.tsx` | Wiederverwendbares Bulk-Paste-Modal (Sortierung) |
| `ExamLab/scripts/audit-bundle-h/zaehleAudioFragen.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/zaehleDuplizierteDragDropLabels.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/zaehleDuplizierteDragDropZonen.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/zaehleEmpfohlenLeere.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/README.md` | Anleitung |

### Zu modifizieren

| Pfad | Änderung |
|---|---|
| `ExamLab/vitest.config.ts` | Globs um `packages/shared/src/**/*.test.{ts,tsx}` erweitern |
| `ExamLab/packages/shared/src/editor/SharedFragenEditor.tsx` | Save-Path-Hook + Validation-Aufruf + Dialog-Integration + Pruefungstauglich-Badge im Header |
| `ExamLab/packages/shared/src/editor/components/FrageTypAuswahl.tsx` | Verifikation Audio-Filter, ggf. Sentry-Log für unbekannte Typen |
| `ExamLab/packages/shared/src/editor/typen/MCEditor.tsx` | Pflichtfeld-Outline pro Option |
| `ExamLab/packages/shared/src/editor/typen/RichtigFalschEditor.tsx` | Pflichtfeld-Outline |
| `ExamLab/packages/shared/src/editor/typen/LueckentextEditor.tsx` | Indigo/Emerald → Violett umstellen |
| `ExamLab/packages/shared/src/editor/typen/SortierungEditor.tsx` | Komplett umbauen auf MC-Pattern + Bulk-Paste |
| `ExamLab/packages/shared/src/editor/typen/ZuordnungEditor.tsx` | Pflichtfeld-Outline |
| `ExamLab/packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` | x/y-Number-Inputs raus, Section-Header-Hinweis, `toAssetUrl`-Verifikation |
| `ExamLab/packages/shared/src/editor/typen/DragDropBildEditor.tsx` | Form-Indicator + Punkte-Count weg, Doppellabel-Detection, Pflichtfeld-Outline |
| `ExamLab/packages/shared/src/editor/typen/HotspotEditor.tsx` | Form-Indicator + Punkte-Count weg, Pflichtfeld-Outline |
| `ExamLab/src/components/ueben/UebungsScreen.tsx` | Tastatur-Handler erweitern (Enter, Cmd+Enter, Lücken-Check) |
| `ExamLab/src/components/fragetypen/FreitextFrage.tsx` | `data-no-enter-submit` auf Tiptap-Wrapper |
| `ExamLab/src/components/fragetypen/FormelFrage.tsx` | `data-no-enter-submit` falls Spike es vorgibt |
| `ExamLab/src/components/fragetypen/CodeFrage.tsx` | `data-no-enter-submit` falls Spike es vorgibt |
| `ExamLab/src/components/LoginScreen.tsx` | Code-Input + Code-Button entfernen (Zeilen 231–246) |
| `ExamLab/src/components/ueben/LoginScreen.tsx` | Code-Input + Code-Button entfernen |
| `ExamLab/src/store/authStore.ts` | Kommentar an `anmeldenMitCode` (Zeile 163) |
| `ExamLab/src/store/ueben/authStore.ts` | Kommentar an `anmeldenMitCode` (Zeile 56) |
| `ExamLab/HANDOFF.md` | S156-Eintrag |

---

## Test-Strategie über Phasen

- **TDD-Pattern pro Editor-Modifikation:** Test zuerst (rot) → Implementation (grün) → Refactor → Commit.
- **Vitest** für Unit + Component (jsdom).
- **E2E** in Phase 13 mit echten Logins gemäss [regression-prevention.md](../../../.claude/rules/regression-prevention.md) Phase 3.

---

## Phase 0 — Vorbedingungen (Spike, Audits, Branch-Setup)

### Task 0.1: Feature-Branch anlegen + Vitest-Config erweitern

**Files:**
- Modify: `ExamLab/vitest.config.ts`

- [ ] **Step 1: Branch anlegen**

```bash
cd "10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git checkout -b feature/editor-ux-feinschliff-bundle-h
```

- [ ] **Step 2: vitest.config.ts erweitern**

Lies die Datei. Erweitere `test.include`:

```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test-setup.ts'],
  include: [
    'src/**/*.test.{ts,tsx}',
    'packages/shared/src/**/*.test.{ts,tsx}',
  ],
}
```

- [ ] **Step 3: Smoke-Test mit dummy-Test**

Erstelle `ExamLab/packages/shared/src/editor/__smoke__.test.ts` mit `it('vitest picks up shared package', () => expect(true).toBe(true))`. Run: `cd ExamLab && npx vitest run packages/shared`. Erwartet: 1 Test grün. Lösche danach den Smoke-Test.

- [ ] **Step 4: Commit**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/vitest.config.ts
git commit -m "build(examlab): vitest globs extended to packages/shared"
```

---

### Task 0.2: Tastatur-Spike (5 Min Browser-Verifikation)

**Files:** Keine (Spike-Notizen werden inline in Plan-Task 5.1 dokumentiert)

- [ ] **Step 1: Dev-Server starten**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npm run dev
```

- [ ] **Step 2: SuS-Üben mit Freitext + Lückentext + Formel + Code-Frage öffnen**

Login mit `wr.test@stud.gymhofwil.ch`, „Einrichtungsprüfung" Übung starten.

- [ ] **Step 3: In jeder Frage DevTools-Console öffnen, in Eingabefeld klicken, eingeben:**

```js
const el = document.activeElement
console.log({tag: el.tagName, ce: el.isContentEditable, type: el.type, parents: el.closest('[data-no-enter-submit]')?.tagName})
```

Notiere für jeden Editor:
- Freitext (Tiptap): erwartet `ce: true`
- Lückentext-Antwort: erwartet `tag: 'INPUT', type: 'text'`
- Formel: ?
- Code: ?

- [ ] **Step 4: Spike-Resultate in Plan-Task 5.1 inline dokumentieren**

Ergänze in dieser Plan-Datei direkt unter Task 5.1 ein Block „**Spike-Resultate (2026-04-28):**" mit den 4 Befunden. Damit wandert die Erkenntnis in die Implementation und ist nicht verloren.

- [ ] **Step 5: Kein Commit nötig** (Plan-Datei wird in Task 0.7 final-committed)

---

### Task 0.3: Audio-Sweep über Codebase

**Files:** Keine (Sweep-Resultate werden inline in Plan-Task 4.1 dokumentiert)

- [ ] **Step 1: Sweep ausführen**

```bash
cd "10 Github/GYM-WR-DUY"
grep -rn "'audio'\|\"audio\"" ExamLab/src/ ExamLab/packages/shared/src/ apps-script-code.js 2>/dev/null > /tmp/audio-sweep.txt
wc -l /tmp/audio-sweep.txt
cat /tmp/audio-sweep.txt
```

- [ ] **Step 2: Klassifiziere Treffer**

Pro Treffer entscheiden:
- **„Type-Definition"** (z.B. `types/fragen.ts:51`) → bleibt
- **„Renderer/Editor"** (z.B. `AudioFrage.tsx`, `AudioEditor.tsx`) → bleibt (für späteren Re-Aktivierung)
- **„Liste der zulässigen Typen"** → muss gefiltert werden
- **„Selbstbewertbar-Liste"** → entscheiden ob Audio-Selbstbewertung im SuS-Üben sichtbar bleibt

- [ ] **Step 3: KI-Klassifikations-Backend-Sweep**

```bash
grep -n "klassifiziere\|fragetypen\|FRAGETYPEN" "10 Github/GYM-WR-DUY/apps-script-code.js" | head -30
```

Wenn der Endpoint `klassifiziereFrage` eine Whitelist von zulässigen Typen führt: prüfen ob `'audio'` enthalten und entfernen.

- [ ] **Step 4: Sweep-Resultate in Plan-Task 4.1 dokumentieren**

Ergänze in der Plan-Datei unter Task 4.1 einen Block „**Audio-Sweep-Resultate (2026-04-28):**" mit Listen pro Kategorie.

- [ ] **Step 5: Kein Commit** (siehe Task 0.7)

---

### Task 0.4: Audit-Skripte-Gerüst anlegen

**Files:**
- Create: `ExamLab/scripts/audit-bundle-h/README.md`
- Create: `ExamLab/scripts/audit-bundle-h/_helper.mjs`

- [ ] **Step 1: Bestehendes Skript-Pattern lesen**

Lies `ExamLab/scripts/migrate-teilerklaerungen/dump.mjs` (oder `export-einrichtung.mjs`). Verstehe: env-Vars, Sheet-Read-Pattern, Output-Format.

- [ ] **Step 2: Helper-Modul anlegen**

`ExamLab/scripts/audit-bundle-h/_helper.mjs`:

```javascript
// Geteilter Helper: lädt alle Fragen via dump-Endpoint des Apps-Scripts
import { fetch } from 'undici'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const EMAIL = process.env.MIGRATION_EMAIL

if (!APPS_SCRIPT_URL || !EMAIL) {
  console.error('Setze APPS_SCRIPT_URL und MIGRATION_EMAIL env-Variablen.')
  process.exit(1)
}

export async function ladeAlleFragen() {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'dumpFragenbank', email: EMAIL }),
  })
  const json = await res.json()
  if (!json.success) throw new Error('dumpFragenbank failed: ' + json.error)
  return json.data.fragen ?? []
}
```

- [ ] **Step 3: README anlegen**

`ExamLab/scripts/audit-bundle-h/README.md`:

```markdown
# Audit-Skripte Bundle H

Vor Merge auszuführen. Liefern Bestand-Statistik damit User informierte Decision treffen kann.

## Setup

```bash
export APPS_SCRIPT_URL='https://script.google.com/...'
export MIGRATION_EMAIL='wr.test@gymhofwil.ch'
```

## Skripte

- `node zaehleAudioFragen.mjs` — erwartet 0
- `node zaehleDuplizierteDragDropLabels.mjs` — erwartet 0
- `node zaehleDuplizierteDragDropZonen.mjs` — Multi-Zone-Bug-Detection
- `node zaehleEmpfohlenLeere.mjs` — pro Typ Anzahl

## Ausführung

```bash
cd ExamLab/scripts/audit-bundle-h
node zaehleAudioFragen.mjs
node zaehleDuplizierteDragDropLabels.mjs
node zaehleDuplizierteDragDropZonen.mjs
node zaehleEmpfohlenLeere.mjs
```
```

- [ ] **Step 4: Commit**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/scripts/audit-bundle-h/
git commit -m "scripts(examlab): audit-bundle-h gerüst (helper + readme)"
```

---

### Task 0.5: 4 Audit-Skripte schreiben

**Files:**
- Create: `ExamLab/scripts/audit-bundle-h/zaehleAudioFragen.mjs`
- Create: `ExamLab/scripts/audit-bundle-h/zaehleDuplizierteDragDropLabels.mjs`
- Create: `ExamLab/scripts/audit-bundle-h/zaehleDuplizierteDragDropZonen.mjs`
- Create: `ExamLab/scripts/audit-bundle-h/zaehleEmpfohlenLeere.mjs`

- [ ] **Step 1: zaehleAudioFragen.mjs**

```javascript
import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const audio = fragen.filter(f => f.typ === 'audio')
console.log(`Audio-Fragen: ${audio.length}`)
if (audio.length > 0) {
  console.log('IDs:', audio.map(f => f.id).join(', '))
}
process.exit(audio.length === 0 ? 0 : 1)
```

- [ ] **Step 2: zaehleDuplizierteDragDropLabels.mjs**

```javascript
import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const dndFragen = fragen.filter(f => f.typ === 'dragdrop_bild')
const betroffen = dndFragen.filter(f => {
  const labels = (f.labels ?? []).map(l => (typeof l === 'string' ? l : l.text ?? '').trim()).filter(Boolean)
  const set = new Set(labels)
  return set.size !== labels.length
})
console.log(`DragDrop-Fragen mit doppelten Pool-Labels: ${betroffen.length} von ${dndFragen.length}`)
betroffen.forEach(f => console.log(`  - ${f.id}: ${(f.labels ?? []).join(', ')}`))
```

- [ ] **Step 3: zaehleDuplizierteDragDropZonen.mjs (Multi-Zone-Bug-Detection)**

```javascript
import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const dndFragen = fragen.filter(f => f.typ === 'dragdrop_bild')
const betroffen = dndFragen.filter(f => {
  const labels = (f.zielzonen ?? []).map(z => (z.korrektesLabel ?? '').trim()).filter(Boolean)
  const set = new Set(labels)
  return set.size !== labels.length
})
console.log(`DragDrop-Fragen mit Multi-Zone-Bug (selber korrektesLabel in 2+ Zonen): ${betroffen.length} von ${dndFragen.length}`)
betroffen.forEach(f => {
  const counts = {}
  ;(f.zielzonen ?? []).forEach(z => { counts[z.korrektesLabel] = (counts[z.korrektesLabel] ?? 0) + 1 })
  const dups = Object.entries(counts).filter(([, n]) => n > 1).map(([l, n]) => `${l}×${n}`).join(', ')
  console.log(`  - ${f.id}: ${dups}`)
})
console.log(`\nWenn > 0: User entscheidet ob Bundle J vorzuziehen.`)
```

- [ ] **Step 4: zaehleEmpfohlenLeere.mjs**

```javascript
import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const stats = {}
for (const f of fragen) {
  stats[f.typ] = stats[f.typ] ?? { total: 0, empfohlenLeer: 0 }
  stats[f.typ].total++
  // Vereinfachte Heuristik pro Typ (Plan-Task: später aus pflichtfeldValidation.ts importieren)
  if (f.typ === 'mc' && (f.optionen ?? []).every(o => !o.erklaerung)) stats[f.typ].empfohlenLeer++
  if (f.typ === 'richtigfalsch' && (f.aussagen ?? []).every(a => !a.erklaerung)) stats[f.typ].empfohlenLeer++
  // Weitere Typen erst NACH Phase 1 hinzufügen, wenn pflichtfeldValidation existiert
}
console.log('Bestand mit leeren Empfohlen-Feldern (Heuristik-Pre-Phase-1):')
Object.entries(stats).forEach(([typ, s]) => console.log(`  ${typ}: ${s.empfohlenLeer} / ${s.total}`))
```

- [ ] **Step 5: Commit**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/scripts/audit-bundle-h/
git commit -m "scripts(examlab): 4 audit skripte für bundle h"
```

---

### Task 0.6: 4 Audit-Skripte ausführen + Resultate notieren

**Files:** Keine (Resultate werden in Plan-Risiken-Sektion oder HANDOFF.md notiert)

- [ ] **Step 1: env-Variablen setzen + Skripte ausführen**

User-Anweisung: setze `APPS_SCRIPT_URL` und `MIGRATION_EMAIL`. Führe alle 4 Skripte aus.

- [ ] **Step 2: Resultate prüfen**

Erwartet:
- `zaehleAudioFragen` = 0
- `zaehleDuplizierteDragDropLabels` = 0
- `zaehleDuplizierteDragDropZonen` ≥ 0 (zur Information)
- `zaehleEmpfohlenLeere` ≥ 0 (zur Information)

Wenn `zaehleDuplizierteDragDropZonen > 5` oder ähnliche Schwelle: User-Entscheidung ob Bundle J vorzuziehen.

- [ ] **Step 3: Resultate in Plan-Datei dokumentieren**

Direkt in dieser Plan-Datei am Ende einen Block „**Audit-Resultate (Datum, User-Notizen):**" einfügen.

- [ ] **Step 4: Kein Commit** (siehe Task 0.7)

---

### Task 0.7: Plan-Updates committen

- [ ] **Step 1: Plan-Datei staged**

```bash
cd "10 Github/GYM-WR-DUY"
git add docs/superpowers/plans/2026-04-28-bundle-h-editor-ux-feinschliff.md
git status
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs(examlab): plan updates aus phase 0 (spike + audio sweep + audit results)"
```

---

## Phase 1 — Pflichtfeld-Validation-Helper (TDD)

### Task 1.1: Test-Datei mit Default-Branch + Defensiv-Pfaden

**Files:**
- Create: `ExamLab/packages/shared/src/editor/pflichtfeldValidation.test.ts`

- [ ] **Step 1: Test-Datei mit 5 initialen Tests**

```typescript
import { describe, it, expect } from 'vitest'
import { validierePflichtfelder } from './pflichtfeldValidation'

describe('validierePflichtfelder — Defensiv-Verhalten', () => {
  it('liefert pflichtErfuellt=true für unbekannten typ (kein Save-Block)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mcc' as any, fragetext: 'q' })
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)  // konservativ
  })

  it('liefert ok bei null/undefined-Frage (worst-case)', () => {
    const r = validierePflichtfelder(null as any)
    expect(r.pflichtErfuellt).toBe(true)
  })

  it('crasht nicht bei null in Array-Feld (mc.optionen=null)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q', optionen: null as any })
    expect(r).toBeDefined()
    expect(r.pflichtErfuellt).toBe(false)  // ≥2 Optionen Pflicht, hier 0
  })

  it('liefert immer string-keys in felderStatus', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q' })
    expect(typeof r.felderStatus).toBe('object')
  })

  it('throws nie', () => {
    expect(() => validierePflichtfelder(undefined as any)).not.toThrow()
  })
})
```

- [ ] **Step 2: Test ausführen, FAIL erwartet**

```bash
cd ExamLab
npx vitest run packages/shared/src/editor/pflichtfeldValidation.test.ts
```

Erwartet: alle 5 Tests rot, weil `pflichtfeldValidation.ts` noch nicht existiert.

---

### Task 1.2: Helper-Skelett + Default-Branch

**Files:**
- Create: `ExamLab/packages/shared/src/editor/pflichtfeldValidation.ts`

- [ ] **Step 1: Skelett anlegen**

```typescript
import type { Frage } from '../../types/fragen'

export type FeldStatus = 'pflicht-leer' | 'empfohlen-leer' | 'ok'

export interface ValidationResult {
  pflichtErfuellt: boolean
  empfohlenErfuellt: boolean
  felderStatus: Record<string, FeldStatus>
  pflichtLeerFelder: string[]  // Klartext-Liste für Dialog
  empfohlenLeerFelder: string[]
}

const DEFAULT_RESULT: ValidationResult = {
  pflichtErfuellt: true,
  empfohlenErfuellt: true,
  felderStatus: {},
  pflichtLeerFelder: [],
  empfohlenLeerFelder: [],
}

export function validierePflichtfelder(frage: Frage | null | undefined): ValidationResult {
  if (!frage || typeof frage !== 'object') return DEFAULT_RESULT

  try {
    switch (frage.typ) {
      case 'mc': return validiereMC(frage as any)
      // weitere cases — siehe Tasks 1.3–1.5
      default:
        console.warn(`[pflichtfeldValidation] Unbekannter typ: ${frage.typ}`)
        return { ...DEFAULT_RESULT, empfohlenErfuellt: false }  // konservativ
    }
  } catch (err) {
    console.error('[pflichtfeldValidation] crash:', err)
    return DEFAULT_RESULT
  }
}

// Stubs für die spezifischen Validatoren
function validiereMC(frage: any): ValidationResult {
  const fragetextOk = typeof frage.fragetext === 'string' && frage.fragetext.trim().length > 0
  const optionen = Array.isArray(frage.optionen) ? frage.optionen : []
  const mind2 = optionen.filter((o: any) => o?.text?.trim()).length >= 2
  const eineKorrekt = optionen.some((o: any) => o?.korrekt === true)
  const erklaerungenAlle = optionen.length > 0 && optionen.every((o: any) => o?.erklaerung?.trim())

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!mind2) pflichtLeer.push('Mind. 2 Optionen mit Text')
  if (!eineKorrekt) pflichtLeer.push('Mind. 1 korrekte Option markiert')

  const empfohlenLeer: string[] = []
  if (!erklaerungenAlle) empfohlenLeer.push('Erklärung pro Option')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      optionen: mind2 && eineKorrekt ? 'ok' : 'pflicht-leer',
      erklaerungen: erklaerungenAlle ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}
```

- [ ] **Step 2: Test ausführen**

```bash
npx vitest run packages/shared/src/editor/pflichtfeldValidation.test.ts
```

Erwartet: 5/5 grün.

- [ ] **Step 3: Commit**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/packages/shared/src/editor/pflichtfeldValidation.ts \
        ExamLab/packages/shared/src/editor/pflichtfeldValidation.test.ts
git commit -m "feat(examlab): pflichtfeldValidation skelett mit MC + defensiv"
```

---

### Task 1.3: Validatoren für RF + Lückentext + Sortierung + Zuordnung

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/pflichtfeldValidation.ts`
- Modify: `ExamLab/packages/shared/src/editor/pflichtfeldValidation.test.ts`

- [ ] **Step 1: Tests pro Typ schreiben (jeweils 3 Cases: alle erfüllt, pflicht-leer, empfohlen-leer)**

Pattern pro Typ — Beispiel RF:

```typescript
describe('validierePflichtfelder — richtigfalsch', () => {
  const minimalGueltig = {
    id: 'r1', typ: 'richtigfalsch', fragetext: 'q',
    aussagen: [{ id: 'a1', text: 'a', korrekt: true, erklaerung: 'e' }],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(minimalGueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer wenn kein Aussage-Text', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, aussagen: [{ id: 'a1', text: '', korrekt: true }] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer wenn Erklärung fehlt', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, aussagen: [{ id: 'a1', text: 'a', korrekt: true }] } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})
```

Analog für `lueckentext`, `sortierung`, `zuordnung`. Pflicht/Empfohlen-Definition aus Spec-Sektion 1 Tabelle.

- [ ] **Step 2: Tests laufen lassen, ROT**

Erwartet: alle neuen Tests rot, weil cases im switch noch fehlen.

- [ ] **Step 3: Validatoren `validiereRF`, `validiereLueckentext`, `validiereSortierung`, `validiereZuordnung` implementieren**

Implementierung folgt MC-Muster. Wichtig:
- Lückentext: pro Lücke je nach `modus` (`'freitext'` braucht ≥1 `korrekteAntworten`, `'dropdown'` braucht ≥2 `dropdownOptionen` + ≥1 als korrekt markiert)
- Sortierung: ≥2 Elemente Pflicht
- Zuordnung: ≥2 Paare beidseitig befüllt

- [ ] **Step 4: Tests grün**

```bash
npx vitest run packages/shared/src/editor/pflichtfeldValidation.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/packages/shared/src/editor/pflichtfeldValidation.ts \
        ExamLab/packages/shared/src/editor/pflichtfeldValidation.test.ts
git commit -m "feat(examlab): pflichtfeldValidation für rf/lueckentext/sortierung/zuordnung"
```

---

### Task 1.4: Validatoren für Bildbeschriftung + Drag&Drop + Hotspot + Freitext + Berechnung

**Files:** wie Task 1.3.

- [ ] **Step 1: Tests pro Typ (3 Cases je)**

Pflicht-Definitionen aus Spec-Sektion 1.

- [ ] **Step 2: ROT-Phase**

- [ ] **Step 3: Implementation**

Wichtig:
- Bildbeschriftung: `bildUrl` Pflicht, ≥1 Marker mit `position` und `korrekt: string[]` mit ≥1 Eintrag.
- Drag&Drop-Bild: `bildUrl` Pflicht, ≥1 Zone mit `korrektesLabel`, alle `korrektesLabel` müssen in `labels`-Pool vorkommen.
- Hotspot: `bildUrl` Pflicht, ≥1 Bereich.
- Freitext: nur `fragetext` Pflicht, `musterloesung` und `bewertungsraster` empfohlen.
- Berechnung: `fragetext` + `korrekteAntwort` Pflicht.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): pflichtfeldValidation für bild/drag/hotspot/freitext/berechnung"
```

---

### Task 1.5: Validatoren für FiBu + restliche Typen + Aufgabengruppe (rekursiv) + Audio (n/a)

**Files:** wie Task 1.3.

- [ ] **Step 1: Tests**

FiBu-Typen (Buchungssatz, T-Konto, BilanzER, Kontenbestimmung): `fragetext` + Lösungs-Daten Pflicht.
Visualisierung, PDF, Code, Formel, Zeichnen: gemäss Spec-Tabelle (Zeilen 102–108).
Aufgabengruppe (rekursiv, max. 3 Ebenen): Test mit verschachtelter Aufgabengruppe + Tiefen-Limit-Test.
Audio: `pflichtErfuellt=true, empfohlenErfuellt=true` — Pass-through.

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

Aufgabengruppe-Implementation:

```typescript
function validiereAufgabengruppe(frage: any, ebene = 0): ValidationResult {
  if (ebene >= 3) {
    console.warn(`[pflichtfeldValidation] Aufgabengruppen-Tiefe > 3, breche ab`)
    return DEFAULT_RESULT
  }
  const fragetextOk = typeof frage.fragetext === 'string' && frage.fragetext.trim()
  const teilaufgaben = Array.isArray(frage.teilaufgaben) ? frage.teilaufgaben : []
  if (teilaufgaben.length === 0) {
    return { ...DEFAULT_RESULT, pflichtErfuellt: false, pflichtLeerFelder: ['Mind. 1 Teilaufgabe'] }
  }
  const sub = teilaufgaben.map((t: any) =>
    t.typ === 'aufgabengruppe' ? validiereAufgabengruppe(t, ebene + 1) : validierePflichtfelder(t)
  )
  return {
    pflichtErfuellt: fragetextOk && sub.every(s => s.pflichtErfuellt),
    empfohlenErfuellt: sub.every(s => s.empfohlenErfuellt),
    felderStatus: { fragetext: fragetextOk ? 'ok' : 'pflicht-leer' },
    pflichtLeerFelder: [...(fragetextOk ? [] : ['Frage-Text']), ...sub.flatMap(s => s.pflichtLeerFelder)],
    empfohlenLeerFelder: sub.flatMap(s => s.empfohlenLeerFelder),
  }
}
```

- [ ] **Step 4: Tests grün — Gesamt-Suite läuft**

```bash
cd ExamLab
npx vitest run packages/shared/src/editor/pflichtfeldValidation.test.ts
```

Erwartet: alle Tests grün, Coverage über alle 19 Typen.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): pflichtfeldValidation komplett mit aufgabengruppe (rekursiv, max 3 ebenen)"
```

---

## Phase 2 — Save-Path-Hook + Bestätigungsdialoge

### Task 2.1: PflichtfeldDialog-Komponente (TDD)

**Files:**
- Create: `ExamLab/packages/shared/src/editor/components/PflichtfeldDialog.tsx`
- Create: `ExamLab/packages/shared/src/editor/components/PflichtfeldDialog.test.tsx`

- [ ] **Step 1: Test schreiben**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PflichtfeldDialog from './PflichtfeldDialog'

describe('PflichtfeldDialog', () => {
  it('zeigt Klartext-Liste der Pflicht-leer-Felder', () => {
    render(<PflichtfeldDialog open onAbbrechen={vi.fn()} onSpeichern={vi.fn()} pflichtLeerFelder={['Frage-Text', 'Mind. 2 Optionen']} />)
    expect(screen.getByText(/Frage-Text/)).toBeInTheDocument()
    expect(screen.getByText(/Mind. 2 Optionen/)).toBeInTheDocument()
  })
  it('Default-Button ist Abbrechen (autoFocus)', () => {
    render(<PflichtfeldDialog open onAbbrechen={vi.fn()} onSpeichern={vi.fn()} pflichtLeerFelder={['x']} />)
    expect(screen.getByRole('button', { name: /Abbrechen/i })).toHaveFocus()
  })
  it('Speichern-Button ruft onSpeichern', () => {
    const onSpeichern = vi.fn()
    render(<PflichtfeldDialog open onAbbrechen={vi.fn()} onSpeichern={onSpeichern} pflichtLeerFelder={['x']} />)
    fireEvent.click(screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }))
    expect(onSpeichern).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Komponente**

```tsx
import { useEffect, useRef } from 'react'
import BaseDialog from '../../../../src/components/ui/BaseDialog'  // Pfad relativ vom packages/shared aus

interface Props {
  open: boolean
  pflichtLeerFelder: string[]
  onSpeichern: () => void
  onAbbrechen: () => void
}

export default function PflichtfeldDialog({ open, pflichtLeerFelder, onSpeichern, onAbbrechen }: Props) {
  const abbrechenRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (open) abbrechenRef.current?.focus() }, [open])

  return (
    <BaseDialog
      open={open}
      onClose={onAbbrechen}
      title={`${pflichtLeerFelder.length} Pflichtfelder leer`}
      footer={
        <>
          <button onClick={onSpeichern} className="px-3 py-1.5 rounded bg-violet-600 text-white">
            Speichern (nicht prüfungstauglich)
          </button>
          <button ref={abbrechenRef} onClick={onAbbrechen} className="px-3 py-1.5 rounded border border-slate-300">
            Abbrechen
          </button>
        </>
      }
    >
      <p>Diese Frage hat folgende Pflichtfelder leer und wird als nicht prüfungstauglich gespeichert:</p>
      <ul className="list-disc pl-5 mt-2">
        {pflichtLeerFelder.map(f => <li key={f}>{f}</li>)}
      </ul>
    </BaseDialog>
  )
}
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/packages/shared/src/editor/components/PflichtfeldDialog.tsx \
        ExamLab/packages/shared/src/editor/components/PflichtfeldDialog.test.tsx
git commit -m "feat(examlab): PflichtfeldDialog mit BaseDialog + autoFocus auf Abbrechen"
```

---

### Task 2.2: DoppelteLabelDialog-Komponente (TDD)

**Files:**
- Create: `ExamLab/packages/shared/src/editor/components/DoppelteLabelDialog.tsx`
- Create: `ExamLab/packages/shared/src/editor/components/DoppelteLabelDialog.test.tsx`

- [ ] **Step 1–4: TDD-Pattern wie Task 2.1**

Spezifika:
- Props: `doppelteLabels: { label: string; zonenIndices: number[] }[]`
- Anzeige: pro doppeltem Label welche Zonen-Indices betroffen
- Klartext-Erklärung: „Im Übungs-Modus wird eine dieser Zonen falsch ausgewertet"

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): DoppelteLabelDialog mit Erklärung des Korrektur-Bugs"
```

---

### Task 2.3: PruefungstauglichBadge

**Files:**
- Create: `ExamLab/packages/shared/src/editor/components/PruefungstauglichBadge.tsx`
- Create: `ExamLab/packages/shared/src/editor/components/PruefungstauglichBadge.test.tsx`

- [ ] **Step 1–5: TDD-Pattern**

Props: `pruefungstauglich: boolean`, `empfohlenLeerFelder: string[]`, `onClickLeeresFeld?: (feldName: string) => void`.
Render-Logik: wenn `!pruefungstauglich` → roter Badge mit Tooltip + erste Klartext-Liste der leeren Felder.

```bash
git commit -am "feat(examlab): PruefungstauglichBadge mit Klick-zu-Feld"
```

---

### Task 2.4: SharedFragenEditor — Save-Hook integrieren

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/SharedFragenEditor.tsx`

- [ ] **Step 1: Test für neuen Save-Flow**

`SharedFragenEditor.test.tsx` (falls neu, sonst erweitern):

```tsx
it('öffnet PflichtfeldDialog bei Pflicht-leer beim Speichern-Klick', async () => {
  const onSpeichern = vi.fn()
  const fragePflichtLeer = { id: 'x', typ: 'mc', fragetext: '', optionen: [] }  // Pflicht-leer
  render(<SharedFragenEditor frage={fragePflichtLeer} onSpeichern={onSpeichern} ... />)
  fireEvent.click(screen.getByRole('button', { name: /Speichern/i }))
  expect(await screen.findByText(/Pflichtfelder leer/)).toBeInTheDocument()
  expect(onSpeichern).not.toHaveBeenCalled()
})

it('speichert mit pruefungstauglich=false nach Bestätigung', async () => {
  const onSpeichern = vi.fn()
  // ... setup wie oben
  fireEvent.click(screen.getByRole('button', { name: /Speichern/i }))
  fireEvent.click(await screen.findByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }))
  expect(onSpeichern).toHaveBeenCalledWith(expect.objectContaining({ pruefungstauglich: false }), expect.anything())
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: SharedFragenEditor erweitern**

In `SharedFragenEditor.tsx`:

```tsx
import { validierePflichtfelder } from './pflichtfeldValidation'
import PflichtfeldDialog from './components/PflichtfeldDialog'
import DoppelteLabelDialog from './components/DoppelteLabelDialog'
import PruefungstauglichBadge from './components/PruefungstauglichBadge'

function SharedFragenEditor({ frage, onSpeichern, ... }) {
  const [pflichtDialogOpen, setPflichtDialogOpen] = useState(false)
  const [doppelDialogOpen, setDoppelDialogOpen] = useState(false)
  const validation = useMemo(() => validierePflichtfelder(aktuelleFrage), [aktuelleFrage])
  const doppelteLabels = useMemo(() => detektiereDoppelteLabels(aktuelleFrage), [aktuelleFrage])

  function handleSpeichern() {
    if (doppelteLabels.length > 0) {
      setDoppelDialogOpen(true)
      return
    }
    if (!validation.pflichtErfuellt) {
      setPflichtDialogOpen(true)
      return
    }
    speichereJetzt()
  }

  function speichereJetzt() {
    const fragezuSpeichern = {
      ...aktuelleFrage,
      pruefungstauglich: validation.pflichtErfuellt && validation.empfohlenErfuellt,
    }
    onSpeichern(fragezuSpeichern)
  }

  return (
    <>
      <PruefungstauglichBadge pruefungstauglich={...} empfohlenLeerFelder={validation.empfohlenLeerFelder} />
      {/* bestehender Editor-Body */}
      <PflichtfeldDialog
        open={pflichtDialogOpen}
        pflichtLeerFelder={validation.pflichtLeerFelder}
        onSpeichern={() => { setPflichtDialogOpen(false); speichereJetzt() }}
        onAbbrechen={() => setPflichtDialogOpen(false)}
      />
      <DoppelteLabelDialog
        open={doppelDialogOpen}
        doppelteLabels={doppelteLabels}
        onSpeichern={() => { setDoppelDialogOpen(false); speichereJetzt() }}
        onAbbrechen={() => setDoppelDialogOpen(false)}
      />
    </>
  )
}

function detektiereDoppelteLabels(frage: any): Array<{ label: string; zonenIndices: number[] }> {
  if (frage?.typ !== 'dragdrop_bild') return []
  const map = new Map<string, number[]>()
  ;(frage.zielzonen ?? []).forEach((z: any, i: number) => {
    const l = (z.korrektesLabel ?? '').trim()
    if (!l) return
    if (!map.has(l)) map.set(l, [])
    map.get(l)!.push(i)
  })
  return [...map.entries()].filter(([, idx]) => idx.length > 1).map(([label, zonenIndices]) => ({ label, zonenIndices }))
}
```

- [ ] **Step 4: Tests grün + tsc -b**

```bash
cd ExamLab
npx vitest run
npx tsc -b
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): SharedFragenEditor save-hook mit Pflichtfeld + DoppelLabel Dialogen + PruefungstauglichBadge"
```

---

## Phase 3 — Editoren konsumieren Validation-Helper

> **Wichtig:** Diese Phase enthält 8 unabhängige Tasks (1 pro Editor). Per subagent-driven-development parallel dispatchbar.

### Task 3.1: MCEditor — Pflichtfeld-Outlines

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/typen/MCEditor.tsx`
- Create: `ExamLab/packages/shared/src/editor/typen/MCEditor.test.tsx`

- [ ] **Step 1: Test mit leerem MC-State**

```tsx
it('zeigt violetten Outline auf leerer Optionen-Section', () => {
  render(<MCEditor frage={{ id:'x', typ:'mc', fragetext:'', optionen:[] }} onUpdate={vi.fn()} />)
  expect(screen.getByTestId('mc-optionen-section')).toHaveClass('border-violet-400')
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

```tsx
import { validierePflichtfelder } from '../pflichtfeldValidation'
// ...
const validation = validierePflichtfelder(frage)
const optionenClass = validation.felderStatus.optionen === 'pflicht-leer'
  ? 'border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40'
  : 'border-slate-200 dark:border-slate-700'
// im JSX
<div data-testid="mc-optionen-section" className={`border ${optionenClass} rounded-lg p-3`}>
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): MCEditor pflichtfeld-violett-outlines"
```

---

### Task 3.2–3.8: Editoren analog

Wie Task 3.1, jeweils:
- 3.2: `RichtigFalschEditor`
- 3.3: `LueckentextEditor` (zusätzlich: Indigo+Emerald → Violett umstellen, siehe Spec-Sektion 1)
- 3.4: `SortierungEditor` (kommt später in Phase 8 separat)
- 3.5: `ZuordnungEditor`
- 3.6: `BildbeschriftungEditor` (Phase 7 — Koord-Felder weg + Outline)
- 3.7: `DragDropBildEditor` (Phase 9 — separat, wegen Doppellabel-Detection)
- 3.8: `HotspotEditor` (Phase 6 — Form-Indicator weg + Outline)

> Tasks 3.4, 3.6, 3.7, 3.8 sind in dieser Phase **vorgemerkt aber nicht ausgeführt** — sie werden in den jeweiligen Detail-Phasen 6-9 mit-implementiert.

In Phase 3 nur ausführen: **3.1 (MC), 3.2 (RF), 3.3 (Lückentext), 3.5 (Zuordnung)**.

---

## Phase 4 — Audio finalisieren

### Task 4.1: Audio-Filter-Verifikation + ggf. Backend-Filter

**Spike-Resultate aus Task 0.3 hier einsetzen:**

> _(wird in Task 0.3 Step 4 dokumentiert)_

- [ ] **Step 1: `FrageTypAuswahl.tsx` Test**

```tsx
it('zeigt typ "audio" nicht in der Auswahl', () => {
  render(<FrageTypAuswahl onSelect={vi.fn()} />)
  expect(screen.queryByText(/Audio/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Test grün (sollte schon)**

Audio ist bereits aus `KATEGORIEN` raus. Test ist Regression-Schutz.

- [ ] **Step 3: KI-Backend-Filter (falls Sweep-Resultat es nötig macht)**

Wenn Apps-Script `klassifiziereFrageEndpoint` Audio im Output ausgeben kann: Frontend-Filter im KI-Empfangs-Pfad ergänzen ODER Backend-Whitelist anpassen.

```typescript
// Im KI-Empfangs-Pfad (KIAssistentPanel.tsx oder ähnlich):
const VERFUEGBARE_TYPEN = [/* ... */]  // ohne 'audio'
const validierterTyp = VERFUEGBARE_TYPEN.includes(kiTyp) ? kiTyp : 'mc'  // Fallback
```

- [ ] **Step 4: Tests + tsc -b**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): audio aus typ-auswahl + ki-empfangs-filter (regression-schutz)"
```

---

## Phase 5 — Tastatur-Navigation SuS-Üben

### Task 5.1: UebungsScreen Tastatur-Erweiterung

**Files:**
- Modify: `ExamLab/src/components/ueben/UebungsScreen.tsx`

**Spike-Resultate (aus Task 0.2):**

> _(in Task 0.2 Step 4 inline dokumentiert)_

- [ ] **Step 1: Test für Tastatur-Handler**

`ExamLab/src/components/ueben/UebungsScreen.test.tsx` (falls neu):

```tsx
import { render, screen, fireEvent } from '@testing-library/react'

describe('UebungsScreen Tastatur', () => {
  it('Enter ohne Textarea-Fokus prüft die Antwort', () => {
    const handlePruefen = vi.fn()
    // ... setup mit MC-Frage
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(handlePruefen).toHaveBeenCalled()
  })
  it('Enter in Textarea fügt Newline (kein Submit)', () => {
    const handlePruefen = vi.fn()
    // ... setup mit Freitext-Frage, Fokus in Textarea
    const ta = screen.getByRole('textbox')
    fireEvent.keyDown(ta, { key: 'Enter' })
    expect(handlePruefen).not.toHaveBeenCalled()
  })
  it('Cmd+Enter prüft auch in Textarea', () => {
    // ...
    fireEvent.keyDown(ta, { key: 'Enter', metaKey: true })
    expect(handlePruefen).toHaveBeenCalled()
  })
  it('Lückentext: Enter mit offenen Lücken zeigt Hinweis, kein Submit', () => {
    // ...
  })
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Handler erweitern**

```tsx
const istNonSubmittableElement = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  if (el.tagName === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  if (el.closest('[data-no-enter-submit]')) return true
  return false
}

const handleKeyDown = useCallback((e: KeyboardEvent) => {
  // Bestehend
  if (e.key === 'ArrowLeft' && kannZurueck()) { e.preventDefault(); vorherigeFrage(); return }
  if (e.key === 'ArrowRight' && feedbackSichtbar) { e.preventDefault(); naechsteFrage(); return }
  if (e.key === 'ArrowRight' && !feedbackSichtbar && !(frage.id in session.antworten)) {
    e.preventDefault(); ueberspringen(); return
  }
  // Neu
  if (e.key === 'Enter') {
    const istCmd = e.metaKey || e.ctrlKey
    const isNonSubmit = istNonSubmittableElement(e.target)
    if (!isNonSubmit || istCmd) {
      e.preventDefault()
      if (feedbackSichtbar) { naechsteFrage(); return }
      if (frage.typ === 'lueckentext' && !alleLueckenGefuellt(frage, antwort)) {
        setHinweis(`Noch ${anzahlOffeneLuecken(frage, antwort)} Lücken offen`)
        return
      }
      handlePruefen()
    }
  }
}, [...])
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): UebungsScreen Enter/Cmd+Enter Hotkeys mit textarea-whitelist"
```

---

### Task 5.2: data-no-enter-submit auf Spezial-Editoren

**Files:**
- Modify: `ExamLab/src/components/fragetypen/FreitextFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/FormelFrage.tsx` (falls Spike es vorschreibt)
- Modify: `ExamLab/src/components/fragetypen/CodeFrage.tsx` (falls Spike es vorschreibt)

- [ ] **Step 1: Wrapper-Div mit Attribut**

In `FreitextFrage.tsx`:

```tsx
<div data-no-enter-submit>
  <EditorContent editor={editor} />
</div>
```

Analog in Formel + Code falls Spike „brauchen"-Indiz lieferte. Wenn Spike sagt „nicht nötig" — Task wird leer, im Plan dokumentieren und Commit überspringen.

- [ ] **Step 2: Test in UebungsScreen.test.tsx**

```tsx
it('FreitextFrage Tiptap fängt Enter, kein Submit-Trigger', () => {
  // ...
})
```

- [ ] **Step 3: Tests grün**

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(examlab): data-no-enter-submit auf spezial-editoren"
```

---

## Phase 6 — Drag&Drop-Bild + Hotspot: Form-Indicator + Punkte-Count weg

### Task 6.1: HotspotEditor Form-Indicator + Punkte-Count entfernen + Pflichtfeld-Outlines

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/typen/HotspotEditor.tsx`
- Create: `ExamLab/packages/shared/src/editor/typen/HotspotEditor.test.tsx`

- [ ] **Step 1: Test**

```tsx
it('zeigt nicht mehr Form-Icon und Punkte-Count in der Bereichs-Liste', () => {
  const frage = { id:'x', typ:'hotspot', fragetext:'q', bildUrl:'/img.svg', bereiche:[{ id:'b1', form:'rechteck', punkte:[{x:0,y:0},{x:10,y:10}], label:'A', punktzahl:1 }] }
  render(<HotspotEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.queryByText('□')).not.toBeInTheDocument()
  expect(screen.queryByText('2')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

In Bereichs-Liste die Spans für `{form === 'rechteck' ? '□' : '⬡'}` und `{bereich.punkte.length}` entfernen.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): HotspotEditor form-indicator und punkte-count weg"
```

---

### Task 6.2: DragDropBildEditor analog Form-Indicator + Punkte-Count weg

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/typen/DragDropBildEditor.tsx`
- Create: `ExamLab/packages/shared/src/editor/typen/DragDropBildEditor.test.tsx`

- [ ] **Step 1–5:** wie Task 6.1.

```bash
git commit -am "feat(examlab): DragDropBildEditor form-indicator und punkte-count weg"
```

---

## Phase 7 — Bildbeschriftung Koord-Felder weg

### Task 7.1: BildbeschriftungEditor Manual-Koord-Inputs raus

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/typen/BildbeschriftungEditor.tsx`
- Create: `ExamLab/packages/shared/src/editor/typen/BildbeschriftungEditor.test.tsx`

- [ ] **Step 1: Test**

```tsx
it('rendert keine x/y number-inputs pro Marker', () => {
  const frage = { id:'x', typ:'bildbeschriftung', fragetext:'q', bildUrl:'/img.svg', labels:[{ id:'l1', position:{x:50,y:50}, korrekt:['Mitochondrium'] }] }
  render(<BildbeschriftungEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
})

it('zeigt Section-Header-Hinweis "kommagetrennt"', () => {
  // ...
  expect(screen.getByText(/kommagetrennt eingeben/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

x/y `<input type="number">` raus. Section-Header über Marker-Liste: „Marker (Antworten kommagetrennt eingeben)". Pro Input nur Inhalt, kein per-Option-Placeholder mehr.

`toAssetUrl(frage.bildUrl)`-Verifikation: bestehender Code nicht ändern, nur sicherstellen dass das Helper-Aufruf nicht versehentlich entfernt wird.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): BildbeschriftungEditor x/y-inputs weg, section-header-hinweis"
```

---

## Phase 8 — Sortierung MC-Pattern + Bulk-Paste

### Task 8.1: BulkPasteModal-Komponente (TDD)

**Files:**
- Create: `ExamLab/packages/shared/src/editor/components/BulkPasteModal.tsx`
- Create: `ExamLab/packages/shared/src/editor/components/BulkPasteModal.test.tsx`

- [ ] **Step 1–5: TDD**

Props: `open`, `onClose`, `onUebernehmen: (zeilen: string[], modus: 'append' | 'replace') => void`.

Test-Cases: Open/Close, Textarea-Input, Zeilen-Split, Modus-Radio, leere Zeilen werden verworfen.

```bash
git commit -am "feat(examlab): BulkPasteModal mit append/replace-modus"
```

---

### Task 8.2: SortierungEditor MC-Pattern + Drag-Reorder

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/typen/SortierungEditor.tsx`
- Create: `ExamLab/packages/shared/src/editor/typen/SortierungEditor.test.tsx`

- [ ] **Step 1: Test**

```tsx
it('rendert Liste statt textarea', () => {
  const frage = { id:'x', typ:'sortierung', fragetext:'q', elemente:['A','B','C'] }
  render(<SortierungEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.queryByRole('textbox', { name: /elemente/i })).not.toBeInTheDocument()
  expect(screen.getAllByRole('textbox')).toHaveLength(3)  // 3 Inputs
})
it('+ Element fügt Eintrag hinzu', () => {
  // ...
})
it('Drag-Handle reordert', async () => {
  // dnd-kit-Test-Pattern
})
it('Bulk-Paste-Knopf öffnet Modal', () => {
  // ...
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import BulkPasteModal from '../components/BulkPasteModal'

function SortierungEditor({ frage, onUpdate }) {
  const elemente = frage.elemente ?? []
  const [bulkOpen, setBulkOpen] = useState(false)

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = elemente.indexOf(active.id)
      const newIdx = elemente.indexOf(over.id)
      onUpdate({ ...frage, elemente: arrayMove(elemente, oldIdx, newIdx) })
    }
  }

  return (
    <>
      <div>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={elemente} strategy={verticalListSortingStrategy}>
            {elemente.map((e, i) => <SortableItem key={e} id={e} text={e} onChange={(v) => /* update */} onLoeschen={() => /* delete */} />)}
          </SortableContext>
        </DndContext>
        <button onClick={() => onUpdate({ ...frage, elemente: [...elemente, ''] })}>+ Element</button>
        <button onClick={() => setBulkOpen(true)}>📋 Bulk einfügen</button>
      </div>
      <BulkPasteModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onUebernehmen={(zeilen, modus) => {
          onUpdate({ ...frage, elemente: modus === 'replace' ? zeilen : [...elemente, ...zeilen] })
          setBulkOpen(false)
        }}
      />
    </>
  )
}
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): SortierungEditor MC-pattern + drag-reorder + bulk-paste"
```

---

## Phase 9 — Drag&Drop-Bild Pool-Dedupe + Doppellabel-Detection

### Task 9.1: DragDropBildEditor — Pool-Dedupe + Doppellabel-Detection

**Files:**
- Modify: `ExamLab/packages/shared/src/editor/typen/DragDropBildEditor.tsx` (weiter modifiziert ggü. Task 6.2)

- [ ] **Step 1: Test**

```tsx
it('Pool-Eingabe mit Doppel: zweiter wird verworfen + Warnung', async () => {
  // ...
})
it('zeigt Doppellabel-Warnung wenn 2 Zonen identisches korrektesLabel haben', () => {
  const frage = { id:'x', typ:'dragdrop_bild', ..., zielzonen:[{korrektesLabel:'Aktiva'},{korrektesLabel:'Aktiva'}], labels:['Aktiva','Passiva'] }
  render(<DragDropBildEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.getByText(/2 Zonen mit identischem/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

Pool-Eingabe: bei Add-Logic deduplizieren mit Hinweis.
Doppellabel-Detection: in Zone-Liste, Render einer Warn-Section über den Zonen wenn Doppel detektiert.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): DragDropBildEditor pool-dedupe + doppellabel-warnung"
```

---

### Task 9.2: SuS-Pool-Anzeige Dedupe

**Files:**
- Modify: `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx` (oder wo SuS-Pool gerendert wird — vor Modifikation suchen)

- [ ] **Step 1: Pfad finden**

```bash
grep -rn "labels" ExamLab/src/components/fragetypen/DragDropBildFrage.tsx
```

- [ ] **Step 2: Test**

```tsx
it('Pool-Tokens sind deduped (case-sensitive, getrimmt)', () => {
  const frage = { ..., labels:['Aktiva',' Aktiva ','Passiva'] }
  render(<DragDropBildFrage frage={frage as any} ... />)
  expect(screen.getAllByRole('button', { name: /Aktiva/ })).toHaveLength(1)
})
```

- [ ] **Step 3: Implementation**

```tsx
const dedupedLabels = useMemo(() => 
  Array.from(new Set((frage.labels ?? []).map(l => l.trim()).filter(Boolean))),
  [frage.labels]
)
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): DragDropBildFrage SuS-pool-dedupe"
```

---

## Phase 10 — SuS-Modus Zone-Outline-Pattern

### Task 10.1: Zone-Outline auf leeren Antwort-Stellen pro Fragetyp

**Files:** mehrere — pro betroffener SuS-Renderer-Komponente

- Modify: `ExamLab/src/components/fragetypen/MCFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/RichtigFalschFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/LueckentextFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/ZuordnungFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/BildbeschriftungFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/FreitextFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/BerechnungFrage.tsx`

- [ ] **Step 1: Helper für „ist diese Eingabe leer?" pro Frage-Typ**

`ExamLab/src/utils/ueben/leereEingabenDetektor.ts`:

```typescript
import type { Frage } from '../../types/fragen'
import type { Antwort } from '../../types/antworten'

export function istEingabeLeer(frage: Frage, antwort: Antwort | undefined, kontext: 'gesamt' | { typ: 'lueckenIndex'; idx: number } | { typ: 'zoneId'; id: string } | { typ: 'markerId'; id: string }): boolean {
  // Implementation pro Typ
}
```

- [ ] **Step 2: Tests pro Typ**

`leereEingabenDetektor.test.ts` mit Cases pro Typ.

- [ ] **Step 3: Renderer-Komponenten erweitern**

Pro Renderer: `class={istEingabeLeer(...) ? 'border-violet-400 ring-1 ring-violet-300' : ''}` auf den Eingabe-Wrapper.

Wichtig: NUR vor `feedbackSichtbar`. Nach Antwort-Prüfen verschwindet Violett, Korrektur-Farben übernehmen.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): SuS zone-outline-violett auf leeren eingaben"
```

---

## Phase 11 — Schülercode-Login UI ausblenden

### Task 11.1: Prüfungs-LoginScreen Code-UI raus

**Files:**
- Modify: `ExamLab/src/components/LoginScreen.tsx` (Block Zeilen 231–246)
- Modify: `ExamLab/src/store/authStore.ts` (Kommentar an Zeile 163)

- [ ] **Step 1: Test**

```tsx
it('rendert keinen 4-stelligen Code-Input', () => {
  render(<LoginScreen />)
  expect(screen.queryByPlaceholderText('1234')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

Im LoginScreen: Block mit Code-Input + Code-Button entfernen. Im authStore: Kommentar an `anmeldenMitCode`:

```typescript
// S156 (Bundle H, 2026-04-28): UI ausgeblendet — Schülercode-Login nicht mehr aktiv.
// Code für mögliche Re-Aktivierung erhalten. Löschen frühestens nach 4-6 Wochen
// ohne SuS-Anfragen — siehe Reminder-Plan-Task 12.1 (Trigger-Datum 2026-06-09).
async anmeldenMitCode(...) { ... }
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): pruefungs-loginscreen schuelercode-ui ausgeblendet"
```

---

### Task 11.2: Standalone-Üben-LoginScreen Code-UI raus

**Files:**
- Modify: `ExamLab/src/components/ueben/LoginScreen.tsx`
- Modify: `ExamLab/src/store/ueben/authStore.ts` (Kommentar an Zeile 56)

- [ ] **Step 1–5:** wie Task 11.1.

```bash
git commit -am "feat(examlab): ueben-loginscreen schuelercode-ui ausgeblendet"
```

---

### Task 11.3: Audit grep nach Code-Removal

**Files:** Keine (Verifikations-Schritt)

- [ ] **Step 1: Sweep**

```bash
cd "10 Github/GYM-WR-DUY"
grep -rn "anmeldenMitCode" ExamLab/src/components/ | grep -v "\.test\."
```

Erwartet: 0 sichtbare UI-Pfade. Falls Treffer (ausser in Tests): Block übersehen → in 11.1 oder 11.2 nachziehen.

- [ ] **Step 2: Wenn 0 Treffer: nichts zu tun, Phase abgeschlossen**

---

## Phase 12 — Reminder-Plan-Task

### Task 12.1: scheduled-task für 2026-06-09 anlegen

**Files:** Keine (System-Aktion)

- [ ] **Step 1: Vor `git push origin main` ausführen**

Per `mcp__scheduled-tasks__create_scheduled_task` einmaliger Task:

- **trigger:** `date '2026-06-09T09:00:00Z'`
- **prompt:** „Schülercode-Login Code-Removal-Check. Bundle H (2026-04-28) hat die UI ausgeblendet, Backend-Code blieb. Prüfe (a) ob in den letzten 6 Wochen SuS-Anfragen wegen fehlendem Code-Login kamen (HANDOFF.md / Memory), (b) wenn nein: PR öffnen der `anmeldenMitCode` aus beiden authStores (`src/store/authStore.ts` + `src/store/ueben/authStore.ts`) entfernt + Tests anpasst. Spec-Ref: docs/superpowers/specs/2026-04-28-editor-ux-feinschliff-design.md Sektion 9."

- [ ] **Step 2: Verifikation via `mcp__scheduled-tasks__list_scheduled_tasks`**

Erwartet: 1 neuer Task mit Datum 2026-06-09.

---

## Phase 13 — E2E-Test + Merge-Vorbereitung

### Task 13.1: Test-Plan schreiben

**Files:** Direkt in HANDOFF.md oder im Chat

Gemäss [regression-prevention.md](../../../.claude/rules/regression-prevention.md) Phase 3.0. Tabelle mit Änderungen + erwartetem Verhalten + Regressions-Risiken.

---

### Task 13.2: Browser-E2E mit echten Logins

- [ ] **Step 1: Tab-Gruppe via `tabs_context_mcp`**

User loggt sich ein (LP `wr.test@gymhofwil.ch` + SuS `wr.test@stud.gymhofwil.ch`).

- [ ] **Step 2: LP-Editor-Pfade testen** (Spec Phase 13 Test-Strategie 1)

Pro Fragetyp: Anlegen, Pflicht-Felder violett, füllen, speichern (Dialog bei Pflicht-leer), `pruefungstauglich`-Badge.

- [ ] **Step 3: SuS-Üben-Pfade testen** (Test-Strategie 2)

Tastatur-Hotkeys, Lückentext-Hinweis, Drag&Drop-Pool-Dedupe, Bildbeschriftung, Schülercode-Button NICHT sichtbar.

- [ ] **Step 4: Regressions** (Test-Strategie 3)

5 kritische Pfade aus regression-prevention.md.

- [ ] **Step 5: Resultate dokumentieren**

In Chat + HANDOFF.md.

---

### Task 13.3: Audit-Skripte vor Merge ausführen

- [ ] **Step 1: Skripte-Lauf**

Wie Task 0.6 — diesmal final, mit aktuellem Code-Stand.

- [ ] **Step 2: Resultate vergleichen mit Phase-0-Lauf**

Erwartet: Audio = 0, DragDrop-Doppel = 0 (durch Task 9.1 verhindert für neue Fragen, Bestand evtl. >0 — User-Decision).

---

### Task 13.4: HANDOFF.md aktualisieren + Merge

- [ ] **Step 1: HANDOFF.md S156-Eintrag**

Pattern aus Memory (Bundle G.f.2 etc.). Wichtig: Phasen-Liste, Test-Status, Audit-Resultate, Out-of-Scope-Verweise (Bundle I, Bundle J, Schülercode-Removal-Reminder).

- [ ] **Step 2: Final-Tests**

```bash
cd ExamLab
npx tsc -b
npx vitest run
npm run build
```

Alle drei grün.

- [ ] **Step 3: Reminder-Task anlegen (Phase 12)**

Falls noch nicht erledigt.

- [ ] **Step 4: Merge mit User-Freigabe**

```bash
cd "10 Github/GYM-WR-DUY"
git checkout main
git merge --no-ff feature/editor-ux-feinschliff-bundle-h -m "ExamLab Bundle H: Editor-UX Feinschliff (Spec rev3)"
```

User muss explizit "Merge OK" geben (regression-prevention.md Phase 5).

- [ ] **Step 5: Push + Branch-Cleanup**

```bash
git push origin main
git branch -d feature/editor-ux-feinschliff-bundle-h
```

---

## Audit-Resultate (wird in Phase 0 ausgefüllt)

> _Datum, User-Notizen, Audit-Skript-Ergebnisse hier inline ablegen, damit Plan-Reader die Bestand-Realität sieht._

---

## Spike-Resultate Tastatur (wird in Phase 0.2 ausgefüllt)

> _Pro Editor: tag/ce/type-Befunde, Whitelist-Entscheidungen._
