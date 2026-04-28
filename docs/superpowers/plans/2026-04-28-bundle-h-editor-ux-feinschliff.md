# Bundle H — Editor-UX Feinschliff Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editor-Vereinheitlichung (Violett-Pflichtfeld-System), 4 typ-spezifische Vereinfachungen, SuS-Tastaturnavigation, Schülercode-UI ausblenden — gemäss Spec [2026-04-28-editor-ux-feinschliff-design.md](../specs/2026-04-28-editor-ux-feinschliff-design.md) rev3.

**Architecture:** Neuer Validation-Helper `validierePflichtfelder` in `packages/shared/src/editor/pflichtfeldValidation.ts` neben dem bestehenden `validiereFrage` (`packages/shared/src/editor/fragenValidierung.ts:34`). Save-Path-Hook `handleSpeichern` in `packages/shared/src/editor/SharedFragenEditor.tsx:625` triggert Bestätigungsdialoge bei Pflicht-leer und Drag&Drop-Doppellabel — beide als **inline Tailwind-Modals** in `packages/shared/src/editor/components/` (kein Cross-Package-Import von `ExamLab/src/components/ui/BaseDialog`). Tastatur-Handler in `ExamLab/src/components/ueben/UebungsScreen.tsx:57` erweitert um Enter/Cmd+Enter mit Whitelist `data-no-enter-submit`. Audit-Skripte in `ExamLab/scripts/audit-bundle-h/` nutzen den existierenden `holeAlleFragenFuerMigration`-Endpoint (Pattern aus `scripts/migrate-teilerklaerungen/dump.mjs`).

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap (PWA). Tests: vitest + jsdom. Drag&Drop: `@dnd-kit/core` v6.3.1 + `@dnd-kit/sortable` v10.

**Branch:** `feature/editor-ux-feinschliff-bundle-h` (Feature-Branch ab `main`).

---

## Pfad-Realität (Korrekturen aus Plan-Vorbereitungs-Audit)

Der Plan-Reviewer hat aufgedeckt, dass die ersten Plan-Pfade falsch waren. Bash-verifizierte Realität:

| Spec/Plan-Annahme | Realität |
|---|---|
| `ExamLab/packages/shared/...` | Existiert nicht. **`packages/shared/...`** liegt auf **Repo-Root-Ebene** (`10 Github/GYM-WR-DUY/packages/shared/`). |
| Vite-Alias `@shared` | `../packages/shared/src` (von `ExamLab/` aus, also Repo-Root) |
| `ExamLab/src/components/lp/frageneditor/MCEditor.tsx` aktiv | Ist nur **Re-Export-Stub**: `export { default } from '@shared/editor/typen/MCEditor'`. Echte Implementierung in `packages/shared/src/editor/typen/MCEditor.tsx`. |
| `SharedFragenEditor` | Existiert in `packages/shared/src/editor/SharedFragenEditor.tsx`. `PruefungFragenEditor.tsx` (`ExamLab/src/components/lp/frageneditor/`) ist dünner Wrapper. |
| `bereinigeFrageBeimSpeichern` | Existiert nicht als separate Funktion. Save-Logik direkt in `handleSpeichern` (SharedFragenEditor.tsx:625). |
| `validiereFrage` als Pflichtfeld-Validator | Existiert (fragenValidierung.ts:34), liefert `string[]` mit harten Errors. **NICHT** erweitern — neuer separater `validierePflichtfelder` daneben. |
| Audio aus `FrageTypAuswahl` filtern | **Bereits raus** (Kommentar S140 in `packages/shared/src/editor/components/FrageTypAuswahl.tsx:13`). Phase 4 reduziert auf Regression-Test + KI-Backend-Sweep. |
| `dumpFragenbank`-Endpoint | Existiert nicht. Existing: `holeAlleFragenFuerMigration` (Body `{action, email}`, Header `text/plain`, Response `{data: [...]}`). Pattern in `ExamLab/scripts/migrate-teilerklaerungen/dump.mjs`. |
| BaseDialog importieren in `packages/shared` | Cross-Package-Import zurück nach `ExamLab/src/` ist Architektur-Verletzung. **Dialoge inline mit Tailwind-Modal** in `packages/shared/src/editor/components/`. |
| Bildbeschriftung-Frage-Feld `labels[]` | Heisst tatsächlich `beschriftungen: BildbeschriftungLabel[]` (`packages/shared/src/types/fragen.ts:600`). Pro Item: `position: {x,y}`, `korrekt: string[]`, `caseSensitive?`, `erklaerung?`. |

---

## Dependency-Graph

**Sequentiell (muss warten):**
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 (4 Editoren MC/RF/Lückentext/Zuordnung)
Phase 6 (Hotspot, DnD-Bild Form-Indicator)
   → Phase 9 (DnD-Bild Pool-Dedupe + Doppellabel)   [GLEICHE DATEI: DragDropBildEditor.tsx]
Phase 12 (Reminder-Task) → Phase 13.4 Step 5 (Push)
```

**Parallel (innerhalb Phase / verschiedene Dateien):**
- 3.1, 3.2, 3.3, 3.5 (4 Editoren independent)
- Phase 6 + Phase 7 + Phase 8 (verschiedene Editoren)
- 11.1 + 11.2 (verschiedene LoginScreens)
- 1.3, 1.4, 1.5 (wenn als getrennte Test-Files; sonst sequenziell selber File)

**Direct-Mode (NICHT subagent-fähig):**
- Phase 0.2 (Tastatur-Spike — Browser-Aktion)
- Phase 0.6 (Audit-Skripte ausführen — User-env-Variablen)
- Phase 13.2 (E2E-Test mit echten Logins — Tab-Gruppe)
- Phase 13.4 Step 4 (User-Freigabe abwarten)

**Subagent-Recursion-Lehre (S154):** Sub-Master darf nicht selbst dispatchen. Wenn Phase 3 als Bundle dispatcht wird, fallen die 4 Implementer auf Direct-Mode + Self-Review zurück.

---

## File Structure

### Neu zu erstellen

| Pfad | Verantwortung |
|---|---|
| `packages/shared/src/editor/pflichtfeldValidation.ts` | Zentrale Pflicht/Empfohlen-Klassifizierung pro Fragetyp + Default-Branch + Defensiv-Behandlung |
| `packages/shared/src/editor/pflichtfeldValidation.test.ts` | Unit-Tests pro Fragetyp + Defensiv-Pfade |
| `packages/shared/src/editor/components/PflichtfeldDialog.tsx` | Inline-Modal für Pflicht-leer-Bestätigung |
| `packages/shared/src/editor/components/PflichtfeldDialog.test.tsx` | Tests |
| `packages/shared/src/editor/components/DoppelteLabelDialog.tsx` | Inline-Modal für Drag&Drop-Bild-Doppel-Labels |
| `packages/shared/src/editor/components/DoppelteLabelDialog.test.tsx` | Tests |
| `packages/shared/src/editor/components/PruefungstauglichBadge.tsx` | Editor-Header-Badge mit Klick-zu-Feld |
| `packages/shared/src/editor/components/PruefungstauglichBadge.test.tsx` | Tests |
| `packages/shared/src/editor/components/BulkPasteModal.tsx` | Inline-Modal für Sortierung-Bulk-Paste |
| `packages/shared/src/editor/components/BulkPasteModal.test.tsx` | Tests |
| `ExamLab/src/utils/ueben/leereEingabenDetektor.ts` | Helper „ist diese SuS-Eingabe leer?" pro Fragetyp |
| `ExamLab/src/utils/ueben/leereEingabenDetektor.test.ts` | Tests |
| `ExamLab/scripts/audit-bundle-h/_helper.mjs` | Geteilter Audit-Skript-Helper (Endpoint, Auth) |
| `ExamLab/scripts/audit-bundle-h/zaehleAudioFragen.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/zaehleDuplizierteDragDropLabels.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/zaehleDuplizierteDragDropZonen.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/zaehleEmpfohlenLeere.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-h/README.md` | Anleitung |

### Zu modifizieren

| Pfad | Änderung |
|---|---|
| `ExamLab/vitest.config.ts` | Globs erweitern um `../packages/shared/src/**/*.test.{ts,tsx}` (Repo-Root) |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | `handleSpeichern` (Z. 625) erweitern: Validation-Aufruf + Dialog-States + `pruefungstauglich`-Auto-Setzen + Doppellabel-Detection. Header: `PruefungstauglichBadge`. |
| `packages/shared/src/editor/components/FrageTypAuswahl.tsx` | Verifikation Audio-Filter, ggf. Default-Branch-Sentry-Log für unbekannte Typen aus KI-Klassifikation |
| `packages/shared/src/editor/typen/MCEditor.tsx` | Pflichtfeld-Outline pro Option |
| `packages/shared/src/editor/typen/RichtigFalschEditor.tsx` | Pflichtfeld-Outline |
| `packages/shared/src/editor/typen/LueckentextEditor.tsx` | Indigo/Emerald-Klassen → Violett |
| `packages/shared/src/editor/typen/SortierungEditor.tsx` | Komplett umbauen auf MC-Pattern + Drag-Reorder + Bulk-Paste |
| `packages/shared/src/editor/typen/ZuordnungEditor.tsx` | Pflichtfeld-Outline |
| `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` | x/y-Number-Inputs raus, Section-Header-Hinweis, Pflichtfeld-Outline |
| `packages/shared/src/editor/typen/DragDropBildEditor.tsx` | Form-Indicator + Punkte-Count weg, Pflichtfeld-Outline (Phase 6); Pool-Dedupe + Doppellabel-Detection (Phase 9) |
| `packages/shared/src/editor/typen/HotspotEditor.tsx` | Form-Indicator + Punkte-Count weg, Pflichtfeld-Outline |
| `ExamLab/src/components/ueben/UebungsScreen.tsx` | Tastatur-Handler erweitern (Enter, Cmd+Enter, Lücken-Check) |
| `ExamLab/src/components/fragetypen/FreitextFrage.tsx` | `data-no-enter-submit` auf Tiptap-Wrapper |
| `ExamLab/src/components/fragetypen/FormelFrage.tsx` | `data-no-enter-submit` falls Spike es vorgibt |
| `ExamLab/src/components/fragetypen/CodeFrage.tsx` | `data-no-enter-submit` falls Spike es vorgibt |
| `ExamLab/src/components/fragetypen/MCFrage.tsx` | Zone-Outline auf leeren Eingaben (Phase 10) |
| `ExamLab/src/components/fragetypen/RichtigFalschFrage.tsx` | Zone-Outline (Phase 10) |
| `ExamLab/src/components/fragetypen/LueckentextFrage.tsx` | Zone-Outline (Phase 10) |
| `ExamLab/src/components/fragetypen/ZuordnungFrage.tsx` | Zone-Outline (Phase 10) |
| `ExamLab/src/components/fragetypen/BildbeschriftungFrage.tsx` | Zone-Outline (Phase 10) |
| `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx` | Zone-Outline + Pool-Dedupe (SuS) (Phase 10) |
| `ExamLab/src/components/fragetypen/BerechnungFrage.tsx` | Zone-Outline (Phase 10) |
| `ExamLab/src/components/LoginScreen.tsx` | Code-Input + Code-Button entfernen (Z. 35–246, conditional auf `code`-State) |
| `ExamLab/src/components/ueben/LoginScreen.tsx` | Code-Login-Block entfernen (Z. 10–91, conditional auf `codeLogin`/`code`-State) |
| `ExamLab/src/store/authStore.ts` | Kommentar an `anmeldenMitCode` |
| `ExamLab/src/store/ueben/authStore.ts` | Kommentar an `anmeldenMitCode` |
| `ExamLab/HANDOFF.md` | S156-Eintrag |

---

## Phase 0 — Vorbedingungen (Spike, Audits, Branch-Setup)

### Task 0.1: Feature-Branch + Vitest-Config-Erweiterung

**Files:**
- Modify: `ExamLab/vitest.config.ts`

- [ ] **Step 1: Branch anlegen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git checkout -b feature/editor-ux-feinschliff-bundle-h
```

- [ ] **Step 2: vitest.config.ts erweitern**

Aktuell: `include: ['src/**/*.test.{ts,tsx}']` (relativ zu `ExamLab/`). Erweitern um Repo-Root `packages/shared`:

```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test-setup.ts'],
  include: [
    'src/**/*.test.{ts,tsx}',
    '../packages/shared/src/**/*.test.{ts,tsx}',
  ],
}
```

- [ ] **Step 3: Smoke-Test mit dummy-Test**

Erstelle `packages/shared/src/editor/__smoke__.test.ts` mit `it('vitest picks up shared package', () => expect(true).toBe(true))`. Run: `cd ExamLab && npx vitest run`. Erwartet: 1 zusätzlicher Test grün, vorhandene Tests weiterhin grün. Lösche danach den Smoke-Test.

- [ ] **Step 4: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/vitest.config.ts
git commit -m "build(examlab): vitest globs erweitert auf repo-root packages/shared"
```

---

### Task 0.2: Tastatur-Spike (5 Min Browser-Verifikation)

> **🛑 Direct-Mode-Pflicht** — kann nicht delegiert werden.
> **🛑 Phase 5 Eintrittsbedingung** — Spike-Resultate müssen committed sein, bevor Phase 5 startet.

**Files:** keine (Resultate werden in Plan-Datei am Ende dokumentiert)

- [ ] **Step 1: Dev-Server starten**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run dev
```

- [ ] **Step 2: SuS-Üben mit den 4 Spezial-Editor-Fragetypen öffnen**

Login mit echtem SuS-Account (`wr.test@stud.gymhofwil.ch`), „Einrichtungsprüfung" Übung starten. Pro Editor-Frage:
- Freitext (Tiptap)
- Lückentext (input)
- Formel (KaTeX/MathLive — falls in der Übung enthalten)
- Code (Monaco/CodeMirror — falls in der Übung enthalten)

- [ ] **Step 3: In jeder Frage in DevTools-Console eingeben**

```js
const el = document.activeElement
console.log({tag: el.tagName, ce: el.isContentEditable, type: el.type, parent: el.closest('[data-no-enter-submit]')?.tagName})
```

Notiere die 4 Befunde.

- [ ] **Step 4: Spike-Resultate in Plan-Datei dokumentieren**

In dieser Plan-Datei am Ende den Block „Spike-Resultate Tastatur" mit den Befunden befüllen.

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add docs/superpowers/plans/2026-04-28-bundle-h-editor-ux-feinschliff.md
git commit -m "docs(examlab): tastatur-spike resultate in bundle-h plan"
```

---

### Task 0.3: Audio-Sweep über Codebase

**Files:** keine (Resultate in Plan-Task 4.1 inline)

- [ ] **Step 1: Sweep ausführen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -rn "'audio'\|\"audio\"" ExamLab/src/ packages/shared/src/ apps-script-code.js 2>/dev/null > /tmp/audio-sweep-bundle-h.txt
wc -l /tmp/audio-sweep-bundle-h.txt
cat /tmp/audio-sweep-bundle-h.txt
```

- [ ] **Step 2: Klassifiziere Treffer**

Erwartete Kategorien:
- **Type-Definition / Factory** (`fragenFactory.ts`, `editorUtils.ts:3`, `types/fragen.ts:51`) → bleibt
- **SuS-Renderer** (`AudioFrage.tsx`) → bleibt (zeigt Info-Box statt Recorder, S140)
- **LP-Editor** (`AudioEditor.tsx`) → bleibt (für Re-Aktivierung)
- **`SharedFragenEditor.tsx:743-744`** Type-Daten-Build → bleibt (defensiv)
- **`AufgabengruppeEditor.tsx:15, 300`** — Sub-Typen-Liste — sollte audio raus? **Entscheidung in 4.1.**
- **`TypEditorDispatcher.tsx:773`** switch-case — bleibt (defensiv für Bestand)

- [ ] **Step 3: KI-Klassifikations-Backend-Sweep**

```bash
grep -n "klassifiziereFrage\|fragetypen\|FRAGETYPEN" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/apps-script-code.js" | head -30
```

Wenn der Endpoint `klassifiziereFrage` eine Whitelist von zulässigen Typen führt: prüfen ob `'audio'` enthalten und in 4.1 ggf. entfernen.

- [ ] **Step 4: Sweep-Resultate in Plan-Task 4.1 dokumentieren**

In dieser Plan-Datei unter Task 4.1 einen Block „Audio-Sweep-Resultate" mit Listen pro Kategorie befüllen.

- [ ] **Step 5: Kein separater Commit** (zusammen mit 0.7)

---

### Task 0.4: Audit-Skript-Gerüst

**Files:**
- Create: `ExamLab/scripts/audit-bundle-h/README.md`
- Create: `ExamLab/scripts/audit-bundle-h/_helper.mjs`

- [ ] **Step 1: Bestehendes Skript-Pattern lesen**

Lies `ExamLab/scripts/migrate-teilerklaerungen/dump.mjs`. Verstehe: env-Vars, Endpoint, Body, Headers, redirect.

- [ ] **Step 2: Helper-Modul anlegen**

`ExamLab/scripts/audit-bundle-h/_helper.mjs`:

```javascript
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL

if (!APPS_SCRIPT_URL || !MIGRATION_EMAIL) {
  console.error('FEHLER: APPS_SCRIPT_URL und MIGRATION_EMAIL env-Variablen setzen.')
  process.exit(1)
}

export async function ladeAlleFragen() {
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'holeAlleFragenFuerMigration', email: MIGRATION_EMAIL }),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`Apps-Script HTTP ${r.status}`)
  const json = await r.json()
  if (json.error) throw new Error(`Apps-Script: ${json.error}`)
  if (!Array.isArray(json.data)) throw new Error('Response data ist kein Array')
  return json.data
}
```

- [ ] **Step 3: README anlegen**

`ExamLab/scripts/audit-bundle-h/README.md`:

````markdown
# Audit-Skripte Bundle H

Vor Merge auszuführen. Liefern Bestand-Statistik damit User informierte Decision treffen kann.

## Setup

```bash
export APPS_SCRIPT_URL='https://script.google.com/macros/s/.../exec'
export MIGRATION_EMAIL='wr.test@gymhofwil.ch'
```

## Ausführung

```bash
cd ExamLab/scripts/audit-bundle-h
node zaehleAudioFragen.mjs
node zaehleDuplizierteDragDropLabels.mjs
node zaehleDuplizierteDragDropZonen.mjs
node zaehleEmpfohlenLeere.mjs
```

## Erwartete Resultate

- `zaehleAudioFragen.mjs` = 0
- `zaehleDuplizierteDragDropLabels.mjs` = 0
- `zaehleDuplizierteDragDropZonen.mjs` ≥ 0 (zur Information; wenn > 5: User-Decision Bundle J vorziehen)
- `zaehleEmpfohlenLeere.mjs` ≥ 0 (zur Information)
````

- [ ] **Step 4: Helper testen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/scripts/audit-bundle-h"
# Mit echten env-Variablen
node -e "import('./_helper.mjs').then(m => m.ladeAlleFragen()).then(arr => console.log('OK', arr.length, 'Fragen'))"
```

Erwartet: „OK <N> Fragen". Wenn nicht: Endpoint-Pattern in `_helper.mjs` korrigieren.

- [ ] **Step 5: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
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
  return new Set(labels).size !== labels.length
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
  return new Set(labels).size !== labels.length
})
console.log(`DragDrop-Fragen mit Multi-Zone-Bug (selber korrektesLabel in 2+ Zonen): ${betroffen.length} von ${dndFragen.length}`)
betroffen.forEach(f => {
  const counts = {}
  ;(f.zielzonen ?? []).forEach(z => { counts[z.korrektesLabel] = (counts[z.korrektesLabel] ?? 0) + 1 })
  const dups = Object.entries(counts).filter(([, n]) => n > 1).map(([l, n]) => `${l}×${n}`).join(', ')
  console.log(`  - ${f.id}: ${dups}`)
})
console.log(`\nWenn > 0: User entscheidet ob Bundle J vorzuziehen (Datenmodell-Migration).`)
```

- [ ] **Step 4: zaehleEmpfohlenLeere.mjs (Pre-Phase-1-Heuristik, später aufrüstbar)**

```javascript
import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const stats = {}
for (const f of fragen) {
  stats[f.typ] = stats[f.typ] ?? { total: 0, empfohlenLeer: 0 }
  stats[f.typ].total++
  // Heuristik vor Phase 1 — wird nach Phase 1 ergänzt durch validierePflichtfelder
  if (f.typ === 'mc' && Array.isArray(f.optionen) && f.optionen.every(o => !o?.erklaerung)) stats[f.typ].empfohlenLeer++
  if (f.typ === 'richtigfalsch' && Array.isArray(f.aussagen) && f.aussagen.every(a => !a?.erklaerung)) stats[f.typ].empfohlenLeer++
  if (f.typ === 'freitext' && !f.musterloesung) stats[f.typ].empfohlenLeer++
}
console.log('Bestand mit leeren Empfohlen-Feldern (Heuristik, MC/RF/Freitext):')
Object.entries(stats).sort((a, b) => b[1].empfohlenLeer - a[1].empfohlenLeer).forEach(([typ, s]) => {
  console.log(`  ${typ}: ${s.empfohlenLeer} / ${s.total}`)
})
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/scripts/audit-bundle-h/
git commit -m "scripts(examlab): 4 audit-skripte für bundle h"
```

---

### Task 0.6: 4 Audit-Skripte ausführen + Resultate notieren

> **🛑 Direct-Mode-Pflicht** — User-env-Variablen-Setup nötig.

**Files:** keine (Resultate in Plan-Datei „Audit-Resultate" am Ende)

- [ ] **Step 1: User-Anweisung**

Master-Implementer postet im Chat: „Bitte setze `APPS_SCRIPT_URL` und `MIGRATION_EMAIL` env-Variablen, führe folgende 4 Skripte aus, und melde mir die Outputs:"

```bash
cd ExamLab/scripts/audit-bundle-h
node zaehleAudioFragen.mjs
node zaehleDuplizierteDragDropLabels.mjs
node zaehleDuplizierteDragDropZonen.mjs
node zaehleEmpfohlenLeere.mjs
```

- [ ] **Step 2: Auf User-Antwort warten**

Wenn `zaehleDuplizierteDragDropZonen` > 5: User explizit fragen, ob Bundle J vorzuziehen ist.

- [ ] **Step 3: Resultate in Plan-Datei dokumentieren**

In dieser Plan-Datei am Ende den Block „Audit-Resultate" mit Datum + 4 Resultaten + User-Notizen befüllen.

- [ ] **Step 4: Commit (zusammen mit 0.7)**

---

### Task 0.7: Plan-Updates committen

- [ ] **Step 1: Plan staged**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add docs/superpowers/plans/2026-04-28-bundle-h-editor-ux-feinschliff.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs(examlab): plan updates aus phase 0 (audio sweep + audit results)"
```

---

## Phase 1 — Pflichtfeld-Validation-Helper (TDD)

### Task 1.1: Test-Skelett mit Defensiv-Pfaden + MC

**Files:**
- Create: `packages/shared/src/editor/pflichtfeldValidation.test.ts`

- [ ] **Step 1: Tests schreiben (defensiv + MC)**

```typescript
import { describe, it, expect } from 'vitest'
import { validierePflichtfelder } from './pflichtfeldValidation'

describe('validierePflichtfelder — Defensiv-Verhalten', () => {
  it('liefert pflichtErfuellt=true für unbekannten typ (kein Save-Block)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mcc' as any, fragetext: 'q' } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)  // konservativ
  })
  it('liefert ok bei null/undefined-Frage', () => {
    expect(validierePflichtfelder(null as any).pflichtErfuellt).toBe(true)
    expect(validierePflichtfelder(undefined as any).pflichtErfuellt).toBe(true)
  })
  it('crasht nicht bei null in Array-Feld (mc.optionen=null)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q', optionen: null } as any)
    expect(r).toBeDefined()
    expect(r.pflichtErfuellt).toBe(false)  // ≥2 Optionen Pflicht
  })
  it('liefert immer ein gültiges ValidationResult', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q' } as any)
    expect(typeof r.felderStatus).toBe('object')
    expect(Array.isArray(r.pflichtLeerFelder)).toBe(true)
  })
  it('throws nie', () => {
    expect(() => validierePflichtfelder(undefined as any)).not.toThrow()
    expect(() => validierePflichtfelder({} as any)).not.toThrow()
  })
})

describe('validierePflichtfelder — mc', () => {
  const minimalGueltig = {
    id: 'm1', typ: 'mc', fragetext: 'q',
    optionen: [
      { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
      { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
    ],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(minimalGueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne Frage-Text', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, fragetext: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder).toContain('Frage-Text')
  })
  it('pflicht-leer mit nur 1 Option', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, optionen: [minimalGueltig.optionen[0]] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne korrekt-markierte Option', () => {
    const r = validierePflichtfelder({
      ...minimalGueltig,
      optionen: minimalGueltig.optionen.map(o => ({ ...o, korrekt: false })),
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne Erklärungen', () => {
    const r = validierePflichtfelder({
      ...minimalGueltig,
      optionen: minimalGueltig.optionen.map(o => ({ ...o, erklaerung: '' })),
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})
```

- [ ] **Step 2: Tests laufen — alle ROT**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run ../packages/shared/src/editor/pflichtfeldValidation.test.ts
```

Erwartet: 10 Tests rot, weil Helper nicht existiert.

---

### Task 1.2: Helper-Skelett + MC-Validator

**Files:**
- Create: `packages/shared/src/editor/pflichtfeldValidation.ts`

- [ ] **Step 1: Implementation**

```typescript
import type { Frage } from '../types/fragen'

export type FeldStatus = 'pflicht-leer' | 'empfohlen-leer' | 'ok'

export interface ValidationResult {
  pflichtErfuellt: boolean
  empfohlenErfuellt: boolean
  felderStatus: Record<string, FeldStatus>
  pflichtLeerFelder: string[]
  empfohlenLeerFelder: string[]
}

const DEFAULT_OK: ValidationResult = {
  pflichtErfuellt: true,
  empfohlenErfuellt: true,
  felderStatus: {},
  pflichtLeerFelder: [],
  empfohlenLeerFelder: [],
}

const DEFAULT_KONSERVATIV: ValidationResult = {
  ...DEFAULT_OK,
  empfohlenErfuellt: false,
}

function strNonEmpty(s: unknown): boolean {
  return typeof s === 'string' && s.trim().length > 0
}

export function validierePflichtfelder(frage: Frage | null | undefined): ValidationResult {
  if (!frage || typeof frage !== 'object') return DEFAULT_OK

  try {
    switch ((frage as any).typ) {
      case 'mc': return validiereMC(frage as any)
      // weitere cases — Tasks 1.3–1.5
      case 'audio': return DEFAULT_OK  // Audio ausgeblendet, n/a
      default:
        console.warn(`[pflichtfeldValidation] Unbekannter typ: ${(frage as any).typ}`)
        return DEFAULT_KONSERVATIV
    }
  } catch (err) {
    console.error('[pflichtfeldValidation] crash:', err)
    return DEFAULT_OK
  }
}

function validiereMC(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const optionen = Array.isArray(frage.optionen) ? frage.optionen : []
  const mind2 = optionen.filter((o: any) => strNonEmpty(o?.text)).length >= 2
  const eineKorrekt = optionen.some((o: any) => o?.korrekt === true)
  const erklaerungenAlle = optionen.length > 0 && optionen.every((o: any) => strNonEmpty(o?.erklaerung))

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

- [ ] **Step 2: Tests grün**

```bash
npx vitest run ../packages/shared/src/editor/pflichtfeldValidation.test.ts
```

Erwartet: 10/10 grün.

- [ ] **Step 3: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add packages/shared/src/editor/pflichtfeldValidation.ts \
        packages/shared/src/editor/pflichtfeldValidation.test.ts
git commit -m "feat(examlab): pflichtfeldValidation skelett mit MC + defensiv (10 tests)"
```

---

### Task 1.3: RF + Lückentext + Sortierung + Zuordnung

**Files:**
- Modify: `packages/shared/src/editor/pflichtfeldValidation.ts`
- Modify: `packages/shared/src/editor/pflichtfeldValidation.test.ts`

- [ ] **Step 1: Tests pro Typ (3 Cases je)**

Pattern wie Task 1.1, pro Typ:
- alle erfüllt → `pflichtErfuellt=true, empfohlenErfuellt=true`
- pflicht-leer (z.B. Aussage ohne Text)
- empfohlen-leer (z.B. Erklärung fehlt)

Pflichten gemäss Spec-Sektion 1 Tabelle:
- **richtigfalsch:** `fragetext`, ≥1 Aussage mit Text, jede Aussage `korrekt`-flagged. Empfohlen: Erklärung pro Aussage.
- **lueckentext:** `fragetext`, `textMitLuecken`, pro Lücke: Freitext-Modus → ≥1 `korrekteAntworten`; Dropdown-Modus → ≥2 `dropdownOptionen` + ≥1 als korrekt markiert.
- **sortierung:** `fragetext`, ≥2 Elemente mit Text. Empfohlen: keine.
- **zuordnung:** `fragetext`, ≥2 Paare beidseitig befüllt. Empfohlen: keine.

- [ ] **Step 2: Tests laufen — neue ROT**

- [ ] **Step 3: Validatoren `validiereRF`, `validiereLueckentext`, `validiereSortierung`, `validiereZuordnung` implementieren + cases im switch**

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): pflichtfeldValidation für rf/lueckentext/sortierung/zuordnung"
```

---

### Task 1.4: Bildbeschriftung + Drag&Drop + Hotspot + Freitext + Berechnung

**Files:** wie 1.3.

- [ ] **Step 1: Tests** (3 Cases je)

Pflichten:
- **bildbeschriftung:** `fragetext`, `bildUrl`, ≥1 `beschriftungen[]`-Eintrag mit `position: {x,y}` + `korrekt: string[]` mit ≥1 Eintrag.
- **dragdrop_bild:** `fragetext`, `bildUrl`, ≥1 Zone mit `korrektesLabel`, alle `korrektesLabel` müssen im `labels`-Pool vorkommen.
- **hotspot:** `fragetext`, `bildUrl`, ≥1 Bereich.
- **freitext:** nur `fragetext` Pflicht. Empfohlen: `musterloesung`, `bewertungsraster`.
- **berechnung:** `fragetext`, `korrekteAntwort`. Empfohlen: `toleranz`, `einheit`, `erklaerung`.

- [ ] **Step 2–4:** ROT → Implementation → GRÜN

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): pflichtfeldValidation für bild/drag/hotspot/freitext/berechnung"
```

---

### Task 1.5: FiBu + restliche Typen + Aufgabengruppe (rekursiv)

**Files:** wie 1.3.

- [ ] **Step 1: Tests**

Pflichten:
- **buchungssatz / tkonto / kontenbestimmung / bilanzstruktur:** `fragetext` + Lösungs-Daten vollständig (typ-spezifisch — aus existing `validiereFrage`-Logik abschauen).
- **visualisierung:** `fragetext` + Konfig-Daten (typ-spezifisch).
- **pdf:** `fragetext` + `pdfUrl`. Empfohlen: Punkte.
- **code:** `fragetext` + `sprache`. Empfohlen: `musterloesung`, `testCases`.
- **formel:** `fragetext` + `korrekteFormel`. Empfohlen: Toleranz, Erklärung.
- **zeichnen:** `fragetext`. Empfohlen: `bewertungsraster`, Hintergrund.
- **aufgabengruppe:** `fragetext` + ≥1 Teilaufgabe. **Rekursiv** (max. 3 Ebenen, sonst Console-Warning + Pass-Through).

Test-Cases speziell:
- Aufgabengruppe 2 Ebenen, alle erfüllt
- Aufgabengruppe 1 Teilaufgabe pflicht-leer → `pflichtErfuellt=false` propagiert nach oben
- Aufgabengruppe 4 Ebenen → Pass-Through bei Tiefe ≥ 3

- [ ] **Step 2–4:** ROT → Implementation → GRÜN

Aufgabengruppe-Implementation:

```typescript
function validiereAufgabengruppe(frage: any, ebene = 0): ValidationResult {
  if (ebene >= 3) {
    console.warn(`[pflichtfeldValidation] Aufgabengruppen-Tiefe > 3, pass-through`)
    return DEFAULT_OK
  }
  const fragetextOk = strNonEmpty(frage.fragetext)
  const teilaufgaben = Array.isArray(frage.teilaufgaben) ? frage.teilaufgaben : []
  if (teilaufgaben.length === 0) {
    return {
      pflichtErfuellt: false,
      empfohlenErfuellt: true,
      felderStatus: { fragetext: fragetextOk ? 'ok' : 'pflicht-leer' },
      pflichtLeerFelder: [...(fragetextOk ? [] : ['Frage-Text']), 'Mind. 1 Teilaufgabe'],
      empfohlenLeerFelder: [],
    }
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

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): pflichtfeldValidation komplett (fibu/special/aufgabengruppe rekursiv)"
```

---

## Phase 2 — Save-Path-Hook + Bestätigungsdialoge

### Task 2.1: PflichtfeldDialog (inline Tailwind-Modal, TDD)

**Files:**
- Create: `packages/shared/src/editor/components/PflichtfeldDialog.tsx`
- Create: `packages/shared/src/editor/components/PflichtfeldDialog.test.tsx`

> **Hinweis:** Kein `BaseDialog`-Cross-Import. Inline-Modal mit Tailwind, ESC-Handler, Backdrop-Click-Close, autoFocus auf Abbrechen-Button.

- [ ] **Step 1: Tests schreiben**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PflichtfeldDialog from './PflichtfeldDialog'

describe('PflichtfeldDialog', () => {
  it('zeigt Klartext-Liste der Pflicht-leer-Felder', () => {
    render(<PflichtfeldDialog open onAbbrechen={vi.fn()} onSpeichern={vi.fn()} pflichtLeerFelder={['Frage-Text', 'Mind. 2 Optionen']} />)
    expect(screen.getByText('Frage-Text')).toBeInTheDocument()
    expect(screen.getByText('Mind. 2 Optionen')).toBeInTheDocument()
  })
  it('Default-Fokus auf Abbrechen', () => {
    render(<PflichtfeldDialog open onAbbrechen={vi.fn()} onSpeichern={vi.fn()} pflichtLeerFelder={['x']} />)
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveFocus()
  })
  it('Speichern-Button: explizites Label', () => {
    render(<PflichtfeldDialog open onAbbrechen={vi.fn()} onSpeichern={vi.fn()} pflichtLeerFelder={['x']} />)
    expect(screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i })).toBeInTheDocument()
  })
  it('Speichern-Klick ruft onSpeichern', () => {
    const onSpeichern = vi.fn()
    render(<PflichtfeldDialog open onAbbrechen={vi.fn()} onSpeichern={onSpeichern} pflichtLeerFelder={['x']} />)
    fireEvent.click(screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }))
    expect(onSpeichern).toHaveBeenCalledOnce()
  })
  it('Esc ruft onAbbrechen', () => {
    const onAbbrechen = vi.fn()
    render(<PflichtfeldDialog open onAbbrechen={onAbbrechen} onSpeichern={vi.fn()} pflichtLeerFelder={['x']} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onAbbrechen).toHaveBeenCalled()
  })
  it('open=false rendert nichts', () => {
    const { container } = render(<PflichtfeldDialog open={false} onAbbrechen={vi.fn()} onSpeichern={vi.fn()} pflichtLeerFelder={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Komponente**

```tsx
import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  pflichtLeerFelder: string[]
  onSpeichern: () => void
  onAbbrechen: () => void
}

export default function PflichtfeldDialog({ open, pflichtLeerFelder, onSpeichern, onAbbrechen }: Props) {
  const abbrechenRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    abbrechenRef.current?.focus()
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onAbbrechen() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onAbbrechen])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onAbbrechen() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-lg font-semibold mb-3">{pflichtLeerFelder.length} Pflichtfelder leer</h2>
        <p className="text-sm mb-2">Diese Frage wird als nicht prüfungstauglich gespeichert:</p>
        <ul className="list-disc pl-5 mb-4 text-sm">
          {pflichtLeerFelder.map(f => <li key={f}>{f}</li>)}
        </ul>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onSpeichern}
            className="px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-700"
          >
            Speichern (nicht prüfungstauglich)
          </button>
          <button
            ref={abbrechenRef}
            onClick={onAbbrechen}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/editor/components/PflichtfeldDialog.tsx \
        packages/shared/src/editor/components/PflichtfeldDialog.test.tsx
git commit -m "feat(examlab): PflichtfeldDialog inline-modal mit autoFocus auf Abbrechen"
```

---

### Task 2.2: DoppelteLabelDialog

**Files:**
- Create: `packages/shared/src/editor/components/DoppelteLabelDialog.tsx`
- Create: `packages/shared/src/editor/components/DoppelteLabelDialog.test.tsx`

- [ ] **Step 1–5: Pattern wie Task 2.1**

Spezifika:
- Props: `doppelteLabels: { label: string; zonenIndices: number[] }[]`
- Anzeige: pro Label welche Zonen-Indices betroffen
- Klartext-Erklärung: „Im Übungs-Modus wird eine dieser Zonen falsch ausgewertet — der Korrektur-Algorithmus erkennt nur eine Zone pro Label-String. Die Multi-Zone-Akzeptanz folgt in einem späteren Bundle."
- Default-Fokus: Abbrechen
- Button-Label: „Speichern (nicht prüfungstauglich)"

```bash
git commit -am "feat(examlab): DoppelteLabelDialog mit Erklärung des Korrektur-Bugs"
```

---

### Task 2.3: PruefungstauglichBadge

**Files:**
- Create: `packages/shared/src/editor/components/PruefungstauglichBadge.tsx`
- Create: `packages/shared/src/editor/components/PruefungstauglichBadge.test.tsx`

- [ ] **Step 1: Tests** (4 Cases)

```tsx
it('rendert nichts wenn pruefungstauglich=true', () => { ... container.firstChild === null })
it('rendert roten Badge wenn pruefungstauglich=false', () => { ... screen.getByText(/Nicht prüfungstauglich/i) })
it('zeigt Liste der empfohlen-leeren Felder als Tooltip', () => { ... })
it('Klick auf einen Listen-Eintrag ruft onClickLeeresFeld(feldName)', () => {
  const onClick = vi.fn()
  render(<PruefungstauglichBadge pruefungstauglich={false} empfohlenLeerFelder={['Erklärung pro Option']} onClickLeeresFeld={onClick} />)
  fireEvent.click(screen.getByText('Erklärung pro Option'))
  expect(onClick).toHaveBeenCalledWith('Erklärung pro Option')
})
```

- [ ] **Step 2–5: ROT → Implementation → GRÜN → Commit**

```bash
git commit -am "feat(examlab): PruefungstauglichBadge mit klickbaren empfohlen-leer-feldern"
```

---

### Task 2.4: SharedFragenEditor — Save-Hook integrieren

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx`
- Create: `packages/shared/src/editor/SharedFragenEditor.test.tsx` (oder existierenden erweitern)

- [ ] **Step 1: Echte Save-Logik lesen**

```bash
sed -n '620,760p' packages/shared/src/editor/SharedFragenEditor.tsx
```

Verstehe: aktueller Flow `handleSpeichern` → `validiereFrage` → `setFehler` (blockiert) oder `onSpeichern(neueFrage, meta)`.

- [ ] **Step 2: Tests schreiben**

```tsx
it('öffnet PflichtfeldDialog bei Pflicht-leer beim Speichern-Klick', async () => { ... })
it('speichert mit pruefungstauglich=false nach Pflicht-Dialog-Bestätigung', async () => { ... })
it('öffnet DoppelteLabelDialog bei DnD-Bild mit doppelten Zonen-Labels', async () => { ... })
it('speichert mit pruefungstauglich=false automatisch wenn nur Empfohlen leer (kein Dialog)', async () => { ... })
it('speichert mit pruefungstauglich=true wenn alle Pflichten + Empfohlen erfüllt', async () => { ... })
```

- [ ] **Step 3: ROT**

- [ ] **Step 4: SharedFragenEditor erweitern**

```tsx
import { validierePflichtfelder } from './pflichtfeldValidation'
import PflichtfeldDialog from './components/PflichtfeldDialog'
import DoppelteLabelDialog from './components/DoppelteLabelDialog'
import PruefungstauglichBadge from './components/PruefungstauglichBadge'

// State
const [pflichtDialogOpen, setPflichtDialogOpen] = useState(false)
const [doppelDialogOpen, setDoppelDialogOpen] = useState(false)

const validation = useMemo(
  () => validierePflichtfelder(buildAktuelleFrage()),  // existing builder
  [/* state-deps */]
)

const doppelteLabels = useMemo(() => detektiereDoppelteLabels(buildAktuelleFrage()), [/* deps */])

async function handleSpeichern(): Promise<void> {
  // bestehende validiereFrage-Errors-Block-Logik bleibt
  const errs = validiereFrage({ ... })
  if (errs.length > 0) { setFehler(errs); return }
  setFehler([])

  // NEU: Pre-Save-Dialoge
  if (doppelteLabels.length > 0) { setDoppelDialogOpen(true); return }
  if (!validation.pflichtErfuellt) { setPflichtDialogOpen(true); return }
  await speichereJetzt()
}

async function speichereJetzt(): Promise<void> {
  setSpeicherLaeuft(true)
  // existing build
  const neueFrage = { ...buildNeueFrage(), pruefungstauglich: validation.pflichtErfuellt && validation.empfohlenErfuellt }
  await onSpeichern(neueFrage, { /* meta */ })
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

// JSX-Erweiterung
<PruefungstauglichBadge
  pruefungstauglich={validation.pflichtErfuellt && validation.empfohlenErfuellt}
  empfohlenLeerFelder={validation.empfohlenLeerFelder}
/>
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
```

- [ ] **Step 5: Tests grün + tsc -b**

```bash
cd ExamLab
npx vitest run
npx tsc -b
```

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(examlab): SharedFragenEditor save-hook mit pflichtfeld+doppellabel dialogen + pruefungstauglich-badge"
```

---

## Phase 3 — Editoren konsumieren Validation-Helper (4 parallele Tasks)

> **Parallel-Dispatch:** 3.1, 3.2, 3.3, 3.5 — verschiedene Dateien, keine Konflikte.

### Task 3.1: MCEditor — Pflichtfeld-Outline auf Optionen-Section

**Files:**
- Modify: `packages/shared/src/editor/typen/MCEditor.tsx`
- Create: `packages/shared/src/editor/typen/MCEditor.test.tsx`

- [ ] **Step 1: Test**

```tsx
it('zeigt violetten Outline auf leerer Optionen-Section', () => {
  render(<MCEditor frage={{ id:'x', typ:'mc', fragetext:'', optionen:[] }} onUpdate={vi.fn()} />)
  expect(screen.getByTestId('mc-optionen-section').className).toContain('border-violet-400')
})
it('zeigt neutralen Outline wenn ≥2 Optionen + 1 korrekt', () => {
  const frage = { id:'x', typ:'mc', fragetext:'q', optionen:[{id:'1',text:'A',korrekt:true},{id:'2',text:'B',korrekt:false}] }
  render(<MCEditor frage={frage} onUpdate={vi.fn()} />)
  expect(screen.getByTestId('mc-optionen-section').className).toContain('border-slate-200')
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

```tsx
import { validierePflichtfelder } from '../pflichtfeldValidation'

const validation = validierePflichtfelder(frage)
const cls = (status: string) =>
  status === 'pflicht-leer' || status === 'empfohlen-leer'
    ? 'border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40'
    : 'border-slate-200 dark:border-slate-700'

// im JSX
<div data-testid="mc-optionen-section" className={`border ${cls(validation.felderStatus.optionen)} rounded-lg p-3`}>
  {/* Optionen-Mapping */}
</div>
```

- [ ] **Step 4: Tests grün + tsc -b**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): MCEditor pflichtfeld-violett-outlines"
```

---

### Task 3.2: RichtigFalschEditor

**Files:**
- Modify: `packages/shared/src/editor/typen/RichtigFalschEditor.tsx`
- Create: `packages/shared/src/editor/typen/RichtigFalschEditor.test.tsx`

- [ ] **Step 1–5: Pattern wie 3.1**

```bash
git commit -am "feat(examlab): RichtigFalschEditor pflichtfeld-violett-outlines"
```

---

### Task 3.3: LueckentextEditor — Indigo/Emerald → Violett + Outline

**Files:**
- Modify: `packages/shared/src/editor/typen/LueckentextEditor.tsx`
- Create: `packages/shared/src/editor/typen/LueckentextEditor.test.tsx`

- [ ] **Step 1: Test**

```tsx
it('Modus-Toggle nutzt Violett, nicht Indigo', () => {
  render(<LueckentextEditor frage={{ ... }} onUpdate={vi.fn()} />)
  expect(screen.getByRole('button', { name: /Freitext/i }).className).toContain('bg-violet-600')
  expect(screen.getByRole('button', { name: /Freitext/i }).className).not.toContain('bg-indigo')
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

In LueckentextEditor: `bg-indigo-100`/`bg-indigo-600`/`text-indigo-*` → `bg-violet-100`/`bg-violet-600`/`text-violet-*`. `bg-emerald-*` ebenso. Dropdown-Modus-Badge: weiterhin **Emerald-Akzent** behalten? **Spec-Sektion 1 Visual** sagt nur „Indigo+Emerald → Violett" — also alle auf Violett.

Plus: Pflichtfeld-Outline auf Lücken-Container (Pflicht-leer wenn ≥1 Lücke ohne `korrekteAntworten[0]`).

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): LueckentextEditor violett (indigo/emerald raus) + pflichtfeld-outline"
```

---

### Task 3.5: ZuordnungEditor

**Files:**
- Modify: `packages/shared/src/editor/typen/ZuordnungEditor.tsx`
- Create: `packages/shared/src/editor/typen/ZuordnungEditor.test.tsx`

- [ ] **Step 1–5: Pattern wie 3.1**

```bash
git commit -am "feat(examlab): ZuordnungEditor pflichtfeld-violett-outlines"
```

> **3.4 (SortierungEditor), 3.6 (BildbeschriftungEditor), 3.7 (DragDropBildEditor), 3.8 (HotspotEditor)** sind in Phase 3 vorgemerkt aber **NICHT ausgeführt** — sie werden in Phase 6, 7, 8, 9 mit-implementiert (dort werden Pflichtfeld-Outlines + jeweilige Vereinfachungen zusammen erledigt).

---

## Phase 4 — Audio-Status verifizieren

### Task 4.1: Audio bereits raus — Regression-Test + KI-Backend

> **Audio-Sweep-Resultate (aus 0.3, 28.04.2026 S157):** 35 Treffer.
>
> | Kategorie | Treffer | Action |
> |---|---|---|
> | **Type-Definition / Factory** (FrageTyp-Union, Antwort-Type, fragenFactory, types/fragen, antworten, excelImport, sichtbareTypen) | 11 | bleibt — Datenmodell stabil |
> | **SuS-Renderer** (`AudioFrage.tsx`, `MedienPlayer.tsx`) | 3 | bleibt — Bestand wird gerendert |
> | **LP-Editor defensiv** (`SharedFragenEditor.tsx`, `TypEditorDispatcher.tsx`) | 4 | bleibt — Re-Aktivierung möglich |
> | **`FrageTypAuswahl.tsx:13`** S140-Kommentar | 1 | bleibt — Typ ist bereits ausgefiltert |
> | **`AufgabengruppeEditor.tsx:15, 300`** Sub-Typen-Liste | 2 | **Decision: bleibt drin** — Aufgabengruppe darf weiterhin bestehende Audio-Sub-Typen rendern (Bestand bleibt), aber FrageTypAuswahl filtert beim Erstellen neuer Sub-Aufgaben (gleicher Code-Pfad). Kein Code-Change. |
> | **Korrektur** (`KorrekturFrageVollansicht`, `KorrekturFragenAnsicht`, `DruckAnsicht`) | 4 | bleibt — Bestand korrigierbar |
> | **Auto-Korrektur / Selbstbewertung** (`uebungsStore`, `antwortStatus`, `korrektur`) | 5 | bleibt — Selbstbewertbar-Liste ist korrekt |
> | **Tests** (`MediaAnzeige.test`, `sichtbareTypen.test`, `autoKorrektur.test`) | 3 | bleibt — Test-Sicherheit für Bestand |
> | **Apps-Script-Backend** (`apps-script-code.js`) | 8 (in code.js, nicht im Sweep gezählt) | bleibt — Backend kennt audio defensiv für Bestand. `klassifiziereFrage` (Z. 5873) klassifiziert NICHT auf einen Typ (sondern Fachbereich/Thema/Bloom/Tags), keine Audio-Whitelist nötig. `importiereFragen` (Z. 5894) listet Typen ohne `'audio'` — bereits korrekt. **Kein Backend-Deploy nötig.** |
>
> **Phase 4 reduziert auf:** Regression-Test in FrageTypAuswahl (Step 1+2). Step 3 (KI-Backend-Filter) entfällt.

**Files:**
- Modify: `packages/shared/src/editor/components/FrageTypAuswahl.tsx` (nur falls KI-Backend Audio liefert)
- Create: `packages/shared/src/editor/components/FrageTypAuswahl.test.tsx`

- [ ] **Step 1: Regression-Test**

```tsx
it('Typ-Auswahl enthält Audio NICHT', () => {
  render(<FrageTypAuswahl onSelect={vi.fn()} />)
  expect(screen.queryByText(/Audio/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Test grün (sollte schon)**

- [ ] **Step 3: KI-Backend-Reaction (falls 0.3 Step 3 Audio im Apps-Script gefunden hat)**

Im KI-Empfangs-Pfad (vermutlich `KIAssistentPanel.tsx` oder via `useKIAssistent.ts`): Whitelist auf Frontend-Seite gegen `'audio'`-Typ filtern. Falls Apps-Script `klassifiziereFrage` `audio` als möglichen Output enthält: dort entfernen + Apps-Script-Deploy. **Spec-Annahme „kein Backend-Deploy nötig" kippt dann.**

```typescript
// Im KI-Empfangs-Pfad
const VERFUEGBARE_TYPEN_FUER_KI = [/* alle ausser 'audio' */]
const validierterTyp = VERFUEGBARE_TYPEN_FUER_KI.includes(kiTyp) ? kiTyp : 'mc'  // Fallback
```

- [ ] **Step 4: Tests grün + tsc -b**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): audio-typ regression-test + ki-empfangs-filter (regression-schutz)"
```

---

## Phase 5 — Tastatur-Navigation SuS-Üben

### Task 5.1: UebungsScreen Enter/Cmd+Enter Hotkeys

> **🛑 Eintrittsbedingung:** Phase 0.2 Spike-Resultate müssen committed sein (Plan-Datei am Ende).
>
> **Spike-Resultate Tastatur (aus 0.2):**
>
> _Wird in Task 0.2 Step 4 inline befüllt._

**Files:**
- Modify: `ExamLab/src/components/ueben/UebungsScreen.tsx`
- Create: `ExamLab/src/components/ueben/UebungsScreen.test.tsx` (oder erweitern wenn vorhanden)

- [ ] **Step 1: Tests**

```tsx
import { render, fireEvent, screen } from '@testing-library/react'

describe('UebungsScreen Tastatur', () => {
  it('Enter ohne Eingabe-Fokus prüft die Antwort', () => {
    /* setup mit MC-Frage, Mock handlePruefen */
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(handlePruefen).toHaveBeenCalled()
  })
  it('Enter in Textarea fügt Newline (kein Submit)', () => {
    /* setup mit Freitext, Fokus in Textarea */
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(handlePruefen).not.toHaveBeenCalled()
  })
  it('Cmd+Enter prüft auch in Textarea', () => {
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })
    expect(handlePruefen).toHaveBeenCalled()
  })
  it('Lückentext: Enter mit offenen Lücken zeigt Hinweis, kein Submit', () => { /* ... */ })
  it('Enter wenn Feedback sichtbar → nächste Frage', () => { /* ... */ })
  it('Element mit data-no-enter-submit blockt Enter', () => { /* ... */ })
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Handler erweitern (UebungsScreen.tsx ab Z. 57)**

```tsx
const istNonSubmittableElement = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  if (el.tagName === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  if (el.closest('[data-no-enter-submit]')) return true
  return false
}

const handleKeyDown = useCallback((e: KeyboardEvent) => {
  // Bestehende Pfeile (Z. 57-79)
  if (e.key === 'ArrowLeft' && kannZurueck()) { e.preventDefault(); vorherigeFrage(); return }
  if (e.key === 'ArrowRight' && feedbackSichtbar) { e.preventDefault(); naechsteFrage(); return }
  if (e.key === 'ArrowRight' && !feedbackSichtbar && !(frage.id in session.antworten)) {
    e.preventDefault(); ueberspringen(); return
  }

  // Neu: Enter / Cmd+Enter
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
}, [/* deps */])
```

Helper `alleLueckenGefuellt` und `anzahlOffeneLuecken` als kleine inline Funktionen oder in `ExamLab/src/utils/ueben/lueckentext.ts`.

`setHinweis`-State + Inline-Hinweis-Toast (3 Sek auto-dismiss, simpler `useState` + `setTimeout` — kein globaler Toast nötig).

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): UebungsScreen Enter/Cmd+Enter mit textarea-whitelist + lückentext-check"
```

---

### Task 5.2: data-no-enter-submit auf Spezial-Editoren

**Files:** abhängig von Spike-Resultaten:
- Modify: `ExamLab/src/components/fragetypen/FreitextFrage.tsx` (Tiptap → ContentEditable, Spike sollte `ce: true` zeigen)
- Modify: `ExamLab/src/components/fragetypen/FormelFrage.tsx` (falls Spike es vorgibt)
- Modify: `ExamLab/src/components/fragetypen/CodeFrage.tsx` (falls Spike es vorgibt)

- [ ] **Step 1: Wrapper-Div mit Attribut**

In `FreitextFrage.tsx`:

```tsx
<div data-no-enter-submit>
  <EditorContent editor={editor} />
</div>
```

Analog in Formel + Code falls Spike „brauchen"-Indiz lieferte.

- [ ] **Step 2: Test in UebungsScreen.test.tsx erweitern**

Test 6 von 5.1 prüft das schon. Falls weitere Editor-spezifische Edge-Cases: hier ergänzen.

- [ ] **Step 3: Tests grün**

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(examlab): data-no-enter-submit auf spezial-editoren"
```

---

## Phase 6 — Drag&Drop-Bild + Hotspot: Form-Indicator + Punkte-Count weg + Pflichtfeld-Outlines

### Task 6.1: HotspotEditor

**Files:**
- Modify: `packages/shared/src/editor/typen/HotspotEditor.tsx`
- Create: `packages/shared/src/editor/typen/HotspotEditor.test.tsx`

- [ ] **Step 1: Tests**

```tsx
it('Bereichs-Liste zeigt kein Form-Icon und keine Punkte-Count', () => {
  const frage = { id:'x', typ:'hotspot', fragetext:'q', bildUrl:'/img.svg', bereiche:[{ id:'b1', form:'rechteck', punkte:[{x:0,y:0},{x:10,y:10}], label:'A', punktzahl:1 }] }
  render(<HotspotEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.queryByText('□')).not.toBeInTheDocument()
  expect(screen.queryByText('⬡')).not.toBeInTheDocument()
  // Punkte-Count
  expect(screen.queryByText('2')).not.toBeInTheDocument()
})
it('Pflichtfeld-Outline auf leerem Bereiche-Container', () => {
  render(<HotspotEditor frage={{ id:'x', typ:'hotspot', fragetext:'', bildUrl:'', bereiche:[] }} onUpdate={vi.fn()} />)
  expect(screen.getByTestId('hotspot-bereiche-section').className).toContain('border-violet-400')
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

In Bereichs-Liste die Spans für Form-Icon (`{form === 'rechteck' ? '□' : '⬡'}`) und Punkte-Count (`{bereich.punkte.length}`) entfernen. Plus Pflichtfeld-Outline gemäss `validierePflichtfelder`.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): HotspotEditor form-indicator + punkte-count weg + pflichtfeld-outline"
```

---

### Task 6.2: DragDropBildEditor — Form-Indicator + Punkte-Count weg + Pflichtfeld-Outline

> **🛑 Sequentielle Abhängigkeit:** Phase 9.1 modifiziert dieselbe Datei. Phase 6.2 muss vor 9.1 abgeschlossen + committed sein.

**Files:**
- Modify: `packages/shared/src/editor/typen/DragDropBildEditor.tsx`
- Create: `packages/shared/src/editor/typen/DragDropBildEditor.test.tsx`

- [ ] **Step 1–5:** Pattern wie 6.1.

```bash
git commit -am "feat(examlab): DragDropBildEditor form-indicator + punkte-count weg + pflichtfeld-outline"
```

---

## Phase 7 — Bildbeschriftung Koord-Felder weg + Pflichtfeld-Outline

### Task 7.1: BildbeschriftungEditor

**Files:**
- Modify: `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx`
- Create: `packages/shared/src/editor/typen/BildbeschriftungEditor.test.tsx`

- [ ] **Step 1: Tests**

```tsx
it('rendert keine x/y number-inputs pro Marker', () => {
  const frage = { id:'x', typ:'bildbeschriftung', fragetext:'q', bildUrl:'/img.svg',
                  beschriftungen:[{ id:'l1', position:{x:50,y:50}, korrekt:['Mitochondrium'] }] }
  render(<BildbeschriftungEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
})
it('zeigt Section-Header-Hinweis "kommagetrennt"', () => {
  /* ... */
  expect(screen.getByText(/kommagetrennt eingeben/i)).toBeInTheDocument()
})
it('Marker mit korrekt=[] zeigt violetten Antwort-Input', () => {
  const frage = { id:'x', typ:'bildbeschriftung', fragetext:'q', bildUrl:'/img.svg',
                  beschriftungen:[{ id:'l1', position:{x:50,y:50}, korrekt:[] }] }
  render(<BildbeschriftungEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.getByTestId('marker-l1-antworten').className).toContain('border-violet-400')
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

x/y `<input type="number">` raus. Section-Header über Marker-Liste: „Marker (Antworten kommagetrennt eingeben)". Pro Input nur Inhalt, kein Per-Option-Placeholder mehr.

`toAssetUrl(frage.bildUrl)`-Aufruf bleibt unverändert (S115-Regression-Schutz).

Pflichtfeld-Outline auf Antwort-Inputs leerer Marker.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): BildbeschriftungEditor x/y-inputs weg + section-hint + pflichtfeld-outline"
```

---

## Phase 8 — Sortierung MC-Pattern + Bulk-Paste

### Task 8.1: BulkPasteModal

**Files:**
- Create: `packages/shared/src/editor/components/BulkPasteModal.tsx`
- Create: `packages/shared/src/editor/components/BulkPasteModal.test.tsx`

- [ ] **Step 1–5: Pattern wie Task 2.1 (inline Tailwind-Modal)**

Props: `open`, `onClose`, `onUebernehmen: (zeilen: string[], modus: 'append' | 'replace') => void`.
Tests: Open/Close, Textarea-Input, Zeilen-Split, Modus-Radio, leere Zeilen verworfen, Esc → onClose.

```bash
git commit -am "feat(examlab): BulkPasteModal mit append/replace-modus"
```

---

### Task 8.2: SortierungEditor MC-Pattern + Drag-Reorder + Bulk-Paste

**Files:**
- Modify: `packages/shared/src/editor/typen/SortierungEditor.tsx`
- Create: `packages/shared/src/editor/typen/SortierungEditor.test.tsx`

- [ ] **Step 1: Tests**

```tsx
it('rendert Liste statt textarea', () => {
  const frage = { id:'x', typ:'sortierung', fragetext:'q', elemente:['A','B','C'] }
  render(<SortierungEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.queryByRole('textbox', { name: /elemente/i })).not.toBeInTheDocument()
  expect(screen.getAllByRole('textbox')).toHaveLength(3)
})
it('+ Element fügt einen Eintrag hinzu', () => { /* ... */ })
it('✕ entfernt einen Eintrag', () => { /* ... */ })
it('Drag-Handle reordert via @dnd-kit', async () => { /* fireEvent.dragStart/dragOver/drop */ })
it('Bulk-Paste-Knopf öffnet Modal', () => { /* ... */ })
it('Pflichtfeld-Outline bei <2 Elementen', () => {
  render(<SortierungEditor frage={{ id:'x', typ:'sortierung', fragetext:'q', elemente:['A'] } as any} onUpdate={vi.fn()} />)
  expect(screen.getByTestId('sortierung-section').className).toContain('border-violet-400')
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BulkPasteModal from '../components/BulkPasteModal'
import { validierePflichtfelder } from '../pflichtfeldValidation'

function SortableItem({ id, text, onChange, onLoeschen }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <span {...attributes} {...listeners} className="cursor-grab text-slate-400">⋮⋮</span>
      <input value={text} onChange={(e) => onChange(e.target.value)} className="flex-1 border rounded px-2 py-1" />
      <button onClick={onLoeschen} className="text-red-500">✕</button>
    </div>
  )
}

export default function SortierungEditor({ frage, onUpdate }) {
  const elemente = frage.elemente ?? []
  const [bulkOpen, setBulkOpen] = useState(false)
  const validation = validierePflichtfelder(frage)
  const sectionCls = validation.felderStatus.elemente === 'pflicht-leer'
    ? 'border-violet-400 ring-1 ring-violet-300'
    : 'border-slate-200'

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = elemente.findIndex(e => e === active.id)
      const newIdx = elemente.findIndex(e => e === over.id)
      onUpdate({ ...frage, elemente: arrayMove(elemente, oldIdx, newIdx) })
    }
  }

  return (
    <>
      <div data-testid="sortierung-section" className={`border ${sectionCls} rounded p-3`}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={elemente} strategy={verticalListSortingStrategy}>
            {elemente.map((e, i) => (
              <SortableItem
                key={e || `i-${i}`}
                id={e || `i-${i}`}
                text={e}
                onChange={(v) => onUpdate({ ...frage, elemente: elemente.map((el, j) => j === i ? v : el) })}
                onLoeschen={() => onUpdate({ ...frage, elemente: elemente.filter((_, j) => j !== i) })}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="flex gap-2 mt-2">
          <button onClick={() => onUpdate({ ...frage, elemente: [...elemente, ''] })} className="px-3 py-1 border rounded">+ Element</button>
          <button onClick={() => setBulkOpen(true)} className="px-3 py-1 border rounded">📋 Bulk einfügen</button>
        </div>
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
git commit -am "feat(examlab): SortierungEditor MC-pattern + dnd-reorder + bulk-paste + pflichtfeld-outline"
```

---

## Phase 9 — Drag&Drop-Bild Pool-Dedupe + Doppellabel-Detection

> **🛑 Sequentielle Abhängigkeit:** Erst nach Phase 6.2 (gleiche Datei).

### Task 9.1: DragDropBildEditor — Pool-Dedupe + Doppellabel-Warnung

**Files:**
- Modify: `packages/shared/src/editor/typen/DragDropBildEditor.tsx` (Erweiterung ggü. 6.2)

- [ ] **Step 1: Tests**

```tsx
it('Pool-Eingabe mit Doppel: zweiter wird verworfen + Warnung sichtbar', async () => {
  /* ... user gibt "Aktiva, Aktiva, Passiva" ein, Pool wird zu ["Aktiva","Passiva"], Warnung "Doppelter Eintrag entfernt" */
})
it('zeigt Doppellabel-Warnung wenn 2 Zonen identisches korrektesLabel haben', () => {
  const frage = { id:'x', typ:'dragdrop_bild', bildUrl:'/img.svg',
                  zielzonen:[{id:'z1',korrektesLabel:'Aktiva',form:'rechteck',punkte:[]},{id:'z2',korrektesLabel:'Aktiva',form:'rechteck',punkte:[]}],
                  labels:['Aktiva','Passiva'] }
  render(<DragDropBildEditor frage={frage as any} onUpdate={vi.fn()} />)
  expect(screen.getByText(/2 Zonen mit identischem Label/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

```tsx
// Pool-Eingabe: bei Add-Logic deduplizieren
function handlePoolInput(value: string) {
  const eingabe = value.split(',').map(t => t.trim()).filter(Boolean)
  const seen = new Set<string>()
  const dedup: string[] = []
  for (const l of eingabe) {
    if (seen.has(l)) continue
    seen.add(l)
    dedup.push(l)
  }
  onUpdate({ ...frage, labels: dedup })
  if (dedup.length < eingabe.length) setWarn('Doppelte Einträge im Pool wurden entfernt.')
}

// Doppellabel-Detection in Zone-Liste
const doppelteZonenLabels = useMemo(() => {
  const map = new Map<string, number[]>()
  ;(frage.zielzonen ?? []).forEach((z, i) => {
    const l = (z.korrektesLabel ?? '').trim()
    if (!l) return
    if (!map.has(l)) map.set(l, [])
    map.get(l)!.push(i + 1)  // 1-based für Anzeige
  })
  return [...map.entries()].filter(([, idx]) => idx.length > 1)
}, [frage.zielzonen])

// JSX
{doppelteZonenLabels.length > 0 && (
  <div className="border border-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded p-2 mb-2 text-sm">
    {doppelteZonenLabels.map(([label, zonen]) => (
      <div key={label}>
        ⚠ {zonen.length} Zonen mit identischem Label „{label}" (Zonen {zonen.join(', ')}). Im Übungs-Modus wird eine zwingend falsch ausgewertet.
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): DragDropBildEditor pool-dedupe + doppellabel-warnung"
```

---

### Task 9.2: SuS-Pool-Anzeige Dedupe (DragDropBildFrage)

**Files:**
- Modify: `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx`

- [ ] **Step 1: Pfad finden**

```bash
grep -n "labels\|frage\.labels" ExamLab/src/components/fragetypen/DragDropBildFrage.tsx | head
```

- [ ] **Step 2: Test**

```tsx
it('SuS-Pool-Tokens sind deduped (case-sensitive, getrimmt)', () => {
  const frage = { ..., labels:['Aktiva',' Aktiva ','Passiva'] }
  render(<DragDropBildFrage frage={frage as any} antwort={null} onAntworten={vi.fn()} />)
  expect(screen.getAllByRole('button', { name: /^Aktiva$/ })).toHaveLength(1)
})
```

- [ ] **Step 3: Implementation**

```tsx
const dedupedLabels = useMemo(() => 
  Array.from(new Set((frage.labels ?? []).map((l: string) => l.trim()).filter(Boolean))),
  [frage.labels]
)
```

(Pool-Render dann auf `dedupedLabels` statt `frage.labels`.)

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): DragDropBildFrage SuS-pool-dedupe"
```

---

## Phase 10 — SuS-Modus Zone-Outline-Pattern

### Task 10.1: leereEingabenDetektor-Helper

**Files:**
- Create: `ExamLab/src/utils/ueben/leereEingabenDetektor.ts`
- Create: `ExamLab/src/utils/ueben/leereEingabenDetektor.test.ts`

- [ ] **Step 1: Tests pro Typ**

```ts
import { describe, it, expect } from 'vitest'
import { istEingabeLeer } from './leereEingabenDetektor'

describe('istEingabeLeer', () => {
  it('mc: leer wenn keine Option markiert', () => {
    expect(istEingabeLeer({ typ: 'mc' } as any, undefined, 'gesamt')).toBe(true)
    expect(istEingabeLeer({ typ: 'mc' } as any, { typ: 'mc', auswahl: ['o1'] } as any, 'gesamt')).toBe(false)
  })
  it('lueckentext: pro Lücke', () => {
    const frage = { typ: 'lueckentext', luecken: [{id:'l1'},{id:'l2'}] } as any
    const ant = { typ: 'lueckentext', luecken: { l1: 'A', l2: '' } } as any
    expect(istEingabeLeer(frage, ant, { typ: 'lueckenIndex', idx: 0 })).toBe(false)
    expect(istEingabeLeer(frage, ant, { typ: 'lueckenIndex', idx: 1 })).toBe(true)
  })
  /* ... pro Typ */
})
```

- [ ] **Step 2–4: ROT → Implementation → GRÜN**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): leereEingabenDetektor mit tests pro fragetyp"
```

---

### Task 10.2: SuS-Renderer mit Zone-Outline (8 Tasks parallel)

> **Parallel-Dispatch:** 8 verschiedene Renderer-Komponenten.

**Files:** Pro Renderer:
- Modify: `ExamLab/src/components/fragetypen/MCFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/RichtigFalschFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/LueckentextFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/ZuordnungFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/BildbeschriftungFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/FreitextFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/BerechnungFrage.tsx`

Pro Renderer:

- [ ] **Step 1: Test**

```tsx
it('zeigt Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
  render(<MCFrage frage={{ ... }} antwort={null} feedbackSichtbar={false} onAntworten={vi.fn()} />)
  expect(screen.getByTestId('mc-input-area').className).toContain('border-violet-400')
})
it('Violett verschwindet nach Antwort prüfen', () => {
  render(<MCFrage frage={{ ... }} antwort={null} feedbackSichtbar={true} onAntworten={vi.fn()} />)
  expect(screen.getByTestId('mc-input-area').className).not.toContain('border-violet-400')
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

```tsx
import { istEingabeLeer } from '../../utils/ueben/leereEingabenDetektor'

const violettOutline = !feedbackSichtbar && istEingabeLeer(frage, antwort, 'gesamt')
  ? 'border-violet-400 ring-1 ring-violet-300'
  : 'border-slate-200'

<div data-testid={`${frage.typ}-input-area`} className={`border ${violettOutline} rounded p-3`}>
  {/* render */}
</div>
```

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit pro Renderer**

```bash
git commit -am "feat(examlab): <Typ>Frage SuS zone-outline auf leerer eingabe"
```

---

## Phase 11 — Schülercode-Login UI ausblenden (2 parallele Tasks)

### Task 11.0: Impact-Sweep `anmeldenMitCode`

**Files:** keine

- [ ] **Step 1: Sweep**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -rn "anmeldenMitCode" ExamLab/src/ packages/shared/src/ 2>/dev/null
```

- [ ] **Step 2: Klassifiziere Treffer**

Erwartet: 4 Treffer
- `ExamLab/src/components/LoginScreen.tsx:16` (useStore-Hook)
- `ExamLab/src/components/ueben/LoginScreen.tsx` (useStore-Hook)
- `ExamLab/src/store/authStore.ts:163` (Implementation)
- `ExamLab/src/store/ueben/authStore.ts:56` (Implementation)

Wenn weitere Treffer → entscheiden ob betroffen oder nicht.

- [ ] **Step 3: Kein Commit (info-only)**

---

### Task 11.1: Prüfungs-LoginScreen Code-UI raus

**Files:**
- Modify: `ExamLab/src/components/LoginScreen.tsx`
- Modify: `ExamLab/src/store/authStore.ts`

- [ ] **Step 1: Test**

```tsx
it('rendert keinen 4-stelligen Code-Input mehr', () => {
  render(<LoginScreen />)
  expect(screen.queryByPlaceholderText('1234')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Anmelden mit Code/i })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

In `LoginScreen.tsx`:
- `code`-State (Zeile 35), `codeWirdValidiert`-State (Zeile 86), `handleCodeLogin` (Zeile 94), Code-Input-Block (Zeile ~231–246), `<form onSubmit={handleCodeLogin}>` entfernen
- `apiService.validiereSchuelercode`-Aufruf bleibt (nicht in diesem Bundle)

In `authStore.ts:163`:

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
- Modify: `ExamLab/src/store/ueben/authStore.ts`

- [ ] **Step 1: Test**

```tsx
it('rendert keinen Code-Login-Pfad', () => {
  render(<UebenLoginScreen />)
  expect(screen.queryByText(/Mit Code anmelden/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: ROT**

- [ ] **Step 3: Implementation**

In `ueben/LoginScreen.tsx`:
- `codeLogin: boolean`-State (Zeile 10), `code`-State (Zeile 11), `handleCodeLogin` (Zeile ~25)
- Conditional `!codeLogin ? (...) : (...)` (Zeile 61) → nur den ersten Block (Google-Login) behalten, den `else`-Block (Code-Pfad) entfernen
- Button „Mit Code anmelden" (Zeile 65) entfernen

In `ueben/authStore.ts:56`: gleicher Kommentar-Block wie 11.1.

- [ ] **Step 4: Tests grün**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(examlab): ueben-loginscreen schuelercode-ui ausgeblendet"
```

---

### Task 11.3: Final-Sweep nach Removal

- [ ] **Step 1: Sweep**

```bash
grep -rn "anmeldenMitCode" ExamLab/src/components/ | grep -v "\.test\."
```

Erwartet: 0 Treffer in Produktions-UI-Code.

- [ ] **Step 2: Falls Treffer → in 11.1 oder 11.2 nachziehen**

---

## Phase 12 — Reminder-Plan-Task

### Task 12.1: scheduled-task für 2026-06-09 anlegen

> **🛑 Hard-Gate vor Phase 13.4 Step 5:** Push wird blockiert wenn Reminder nicht existiert.

**Files:** keine (System-Aktion via `mcp__scheduled-tasks__create_scheduled_task`)

- [ ] **Step 1: Task anlegen**

Per `mcp__scheduled-tasks__create_scheduled_task`:
- **trigger:** Datum `2026-06-09T09:00:00+02:00` einmalig
- **prompt:** „Schülercode-Login Code-Removal-Check (Bundle H Reminder, 2026-04-28). Bundle H hat die UI ausgeblendet, Backend-Code blieb. Prüfe (a) ob in den letzten 6 Wochen SuS-Anfragen wegen fehlendem Code-Login kamen (HANDOFF.md / Memory), (b) wenn nein: PR öffnen der `anmeldenMitCode` aus beiden authStores (`ExamLab/src/store/authStore.ts` + `ExamLab/src/store/ueben/authStore.ts`) entfernt + Tests anpasst. Spec: docs/superpowers/specs/2026-04-28-editor-ux-feinschliff-design.md Sektion 9."

- [ ] **Step 2: Verifikation via `mcp__scheduled-tasks__list_scheduled_tasks`**

Erwartet: 1 neuer Task mit Datum 2026-06-09.

---

## Phase 13 — E2E-Test + Merge-Vorbereitung

### Task 13.1: Test-Plan im Chat

**Files:** Chat-Output, danach in HANDOFF.md S156-Eintrag

Strukturiert pro [regression-prevention.md](../../../.claude/rules/regression-prevention.md) Phase 3.0:

```
## Test-Plan: Bundle H

### Zu testende Änderungen (3 Spalten)
| # | Änderung | Erwartetes Verhalten | Regressions-Risiko |
|---|----------|---------------------|-------------------|
| 1 | Pflichtfeld-Dialog | Pflicht-leer → Dialog → Speichern mit pruefungstauglich=false | Save-Path-Flow für andere Editoren bricht |
| ... | ... | ... | ... |

### Security-Check
- [ ] LP-Editor-Validation leakt keine Lösungsfelder an SuS
- [ ] Schülercode-Removal blockt nicht legitime Google-Logins
- [ ] Pool-Dedupe verändert kein Bestand-Datenmodell

### 5 kritische Pfade aus regression-prevention.md
1. **SuS lädt Prüfung** — Editor-Pflicht-Dialog darf nicht im SuS-Pfad triggern
2. **SuS Heartbeat + Auto-Save** — autoSave.ts unverändert?
3. **SuS Abgabe** — Tastatur-Hotkeys triggern keine Abgabe
4. **LP Monitoring** — pruefungstauglich-Status in Live-Liste sichtbar
5. **LP Korrektur** — Validation-Auto-pruefungstauglich propagiert nicht in laufende Prüfungen

### Regressions-Tests pro Fragetyp (alle 19 Typen)
- Test pro Typ in LP-Editor: anlegen, speichern (Pflicht-Dialog), pruefungstauglich-Badge
- Test pro Typ im SuS-Üben: leere Eingabe violett, Antwort prüfen
```

- [ ] **Step 1: Plan im Chat posten + dokumentieren**

---

### Task 13.2: Browser-E2E mit echten Logins

> **🛑 Direct-Mode-Pflicht** — Tab-Gruppe + User-Logins.

- [ ] **Step 1: Tab-Gruppe via Chrome-in-Chrome MCP**

`mcp__Claude_in_Chrome__tabs_context_mcp` mit `createIfEmpty: true`. User loggt sich ein:
- Tab 1: LP `wr.test@gymhofwil.ch`
- Tab 2: SuS `wr.test@stud.gymhofwil.ch`

Master postet: „Tab-Gruppe erstellt — bitte einloggen, dann ‚kannst loslegen' melden."

- [ ] **Step 2: LP-Editor-Pfade testen**

Pro 8 betroffene Fragetypen + 4 Phase-3-Outline-Editoren:
- Frage anlegen, Pflicht-Felder violett bestätigen
- Felder füllen, Violett verschwindet
- Pflicht-leer + Speichern-Klick → Bestätigungsdialog (Default Abbrechen!)
- „Speichern (nicht prüfungstauglich)" → speichert mit Badge
- Audio-Typ ist nicht im Dropdown
- Drag&Drop-Bild: 2 Zonen mit identischem Label → Doppellabel-Warnung beim Speichern
- Sortierung: Bulk-Paste-Knopf öffnet Modal, 5 Zeilen einfügen, übernehmen
- Bildbeschriftung-Bild lädt unter `/sus/ueben/`-Route (toAssetUrl-Invariante)

- [ ] **Step 3: SuS-Üben-Pfade testen**

- Lückentext-Frage: leere Lücken violett, Cmd+Enter prüft, Enter mit offenen Lücken → Hinweis-Toast
- Freitext: Enter im Tiptap fügt Newline (kein Submit), Cmd+Enter prüft
- Bildbeschriftung: Marker per Klick erstellt, getippte Antwort entfernt Violett
- Drag&Drop-Bild: Token wandert in Zone, Pool-Dedupe sichtbar, Zone-Outline weg
- Schülercode-Login-Button NICHT sichtbar — beide Pfade

- [ ] **Step 4: 5 kritische Pfade testen** (siehe 13.1)

- [ ] **Step 5: Resultate im Chat + HANDOFF.md dokumentieren**

---

### Task 13.3: Audit-Skripte final

- [ ] **Step 1: Skripte erneut laufen lassen** (gleicher Setup wie 0.6)

- [ ] **Step 2: Resultate vergleichen mit Phase-0-Lauf**

Erwartet: Audio = 0, DragDrop-Pool-Dupes = 0 (durch 9.1 verhindert für neue Fragen).

---

### Task 13.4: HANDOFF.md + Merge

- [ ] **Step 1: HANDOFF.md S156-Eintrag**

Pattern aus Memory (siehe Bundle G.f.2 / S155):

```markdown
## S156 (2026-04-28) — Bundle H: Editor-UX Feinschliff

**Merge-Commit:** `<hash>`
**Branch:** `feature/editor-ux-feinschliff-bundle-h` → `main`

### Änderungen
- Violett-Pflichtfeld-System (3 Stufen) in 8 Editoren
- Bestätigungsdialoge (Pflicht-leer + DnD-Doppellabel)
- Sortierung MC-Pattern + Bulk-Paste
- Bildbeschriftung x/y-Inputs raus
- Hotspot + DnD: Form-Indicator + Punkte-Count weg
- SuS-Tastatur Enter/Cmd+Enter
- SuS Zone-Outline auf leeren Eingaben
- Schülercode-UI ausgeblendet (beide LoginScreens)

### Tests
- vitest: <N> tests grün (vorher 827)
- E2E: <Status>
- Audit-Skripte: Audio=<N>, DnD-Pool-Dupes=<N>, DnD-Zonen-Dupes=<N>, Empfohlen-Leer=<N>

### Out of Scope
- Bundle I — Performance-Audit (LP-Üben 20s, SuS-Login 25s)
- Bundle J — DnD-Bild Multi-Zone-Datenmodell
- Schülercode-Code-Removal: Reminder-Task `<id>` für 2026-06-09 angelegt
```

- [ ] **Step 2: Final-Tests**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b
npx vitest run
npm run build
```

Alle drei grün.

- [ ] **Step 3: Pre-Merge-Checklist (Hard-Stops)**

```bash
# Reminder-Task existiert?
mcp__scheduled-tasks__list_scheduled_tasks
# Erwartet: 1 Task für 2026-06-09 — sonst zurück zu Phase 12.1
```

- [ ] **Step 4: User-Freigabe abwarten (Hard-Stop)**

Master postet im Chat:

> „Bereit für LP-Test. Browser-Test-Ergebnisse: <…>. Security-Check: <…>. Audit-Skripte-Resultate: <…>. Reminder-Task angelegt: <ID>. Bitte Freigabe bestätigen mit ‚Merge OK' oder Änderungen anfordern."

Master wartet auf User-Antwort. **NICHT mergen ohne explizites „Merge OK" oder „Freigabe".**

- [ ] **Step 5: Merge nach Freigabe**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git merge --no-ff feature/editor-ux-feinschliff-bundle-h -m "$(cat <<'EOF'
ExamLab Bundle H: Editor-UX Feinschliff (Spec rev3)

Violett-Pflichtfeld-System, Bestätigungsdialoge, Sortierung-MC-Pattern,
Bildbeschriftung-Cleanup, Audio-Filter-Verifikation, SuS-Tastaturnavigation,
Schülercode-UI ausgeblendet (Code für Re-Aktivierung erhalten).

Out of Scope: Bundle I (Performance), Bundle J (Multi-Zone-Datenmodell).
Reminder für Schülercode-Code-Removal: 2026-06-09.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Push + Branch-Cleanup**

```bash
git push origin main
git branch -d feature/editor-ux-feinschliff-bundle-h
```

---

## Audit-Resultate

> _Wird in Phase 0.6 Step 3 befüllt._

| Skript | Resultat | Datum | User-Notiz |
|---|---|---|---|
| zaehleAudioFragen.mjs | TBD | TBD | |
| zaehleDuplizierteDragDropLabels.mjs | TBD | TBD | |
| zaehleDuplizierteDragDropZonen.mjs | TBD | TBD | |
| zaehleEmpfohlenLeere.mjs | TBD | TBD | |

---

## Spike-Resultate Tastatur

> Befüllt 28.04.2026 S157 via Source-Code-Analyse + Browser-Verifikation der renderer-Komponenten. (Browser-Klick auf "Gemischte Übung" reagierte nicht — wahrscheinlich Service-Worker-Cache-Lag — daher Source-derived; Source ist deterministisch und vollständig.)

| Editor | activeElement-tag | isContentEditable | Multi-Line-Eingabe? | `data-no-enter-submit` nötig? |
|---|---|---|---|---|
| **FreitextFrage** ([FreitextFrage.tsx:238](ExamLab/src/components/fragetypen/FreitextFrage.tsx)) | `DIV` (Tiptap `<EditorContent>`) | `true` | ✓ Ja (Paragraphen) | **JA** — Wrapper `.tiptap-editor` markieren |
| **Lückentext-Antwort-Input** ([LueckentextFrage.tsx:141](ExamLab/src/components/fragetypen/LueckentextFrage.tsx)) | `INPUT` (`type="text"`) | `false` | ✗ Nein (Single-Line) | NEIN — Enter triggert „Antwort prüfen" sicher |
| **Formel-Editor** ([FormelFrageComponent.tsx:215](ExamLab/src/components/fragetypen/FormelFrageComponent.tsx)) | `INPUT` (`type="text"`) | `false` | ✗ Nein (Single-Line LaTeX) | NEIN — Enter triggert „Antwort prüfen" |
| **Code-Editor** ([CodeFrageComponent.tsx:149-170](ExamLab/src/components/fragetypen/CodeFrageComponent.tsx)) | `DIV` (CodeMirror internes contenteditable) | `true` | ✓ Ja (Code-Newlines essenziell) | **JA** — Wrapper `containerRef`-Div markieren |

**Verifizierte Belege aus Source:**
- Freitext: `<EditorContent editor={editor} />` aus `@tiptap/react` — Tiptap rendert `<div contenteditable="true" class="ProseMirror">` intern. `tiptap-editor`-Wrapper-Div ist Z. 221 (className-Block). Für `data-no-enter-submit`: dort hinzufügen.
- Lückentext: `<input ...>` Z. 141 — Standard Single-Line.
- Formel: `<input ref={inputRef} type="text" ...>` Z. 215 — Standard Single-Line LaTeX.
- Code: CodeMirror-Container `<div ref={containerRef} ...>` Z. 149-170 — CodeMirror-Initialisierung (Editor-Lazy-Load) erzeugt internes `cm-editor > cm-content[contenteditable]`. Für `data-no-enter-submit`: am `containerRef`-Div ergänzen.

**Phase 5 Implementation-Konsequenz:**
- 2 Renderer (Freitext, Code) brauchen `data-no-enter-submit` auf ihrem Editor-Wrapper.
- 2 Renderer (Lückentext, Formel) brauchen es NICHT.
- UebungsScreen-Tastatur-Handler: `el.closest('[data-no-enter-submit]')`-Check schliesst Tiptap+CodeMirror aus, Lückentext+Formel-Inputs lösen Enter→„Antwort prüfen" aus.
- Cmd+Enter (universell „Antwort prüfen", auch in Whitelist) bleibt Spec-konform.
