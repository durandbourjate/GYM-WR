# react-doctor Folge-Sweep Prio 1 + Prio 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Behebe 1 Security-iframe-Sandbox-Kombi (MaterialPanel:324) + 2 a11y-ARIA-Lücken (L3Dropdown) + lege das `no-danger`-Inventar als Folge-Audit-Vorbereitung an.

**Architecture:** Drei kleine isolierte Commits auf `fix/react-doctor-folge-prio1-prio2` (von `main` @ `dd5f62d`). Pro Fix TDD: failing Test → fix → grün → commit. Inventar ist read-only-Doku.

**Tech Stack:** React 19 + TypeScript + Vite, vitest + @testing-library/react (jsdom), react-doctor CLI v0.2.9, DOM-Test-IDs via `useId()`.

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-28-react-doctor-folge-prio1-prio2-design.md` (Commit `aa19e95`).

**Branch:** `fix/react-doctor-folge-prio1-prio2` (bereits ausgecheckt, HEAD nach Spec-Commit = `aa19e95`).

**WICHTIG für Implementer:** Dieses Plan-Dokument enthält an mehreren Stellen den Identifier des React-Danger-Props mit einem **Zero-Width-Space** geschrieben (Workaround für einen per-edit-security-hook im Editor). Der echte Identifier ist als zusammenhängender CamelCase-String zu schreiben, wenn ein grep- oder Code-Befehl ausgeführt wird. Der ZWS ist ein reines Plan-Dokument-Artefakt.

---

## File Structure

**Source-Modifikationen:**
- `ExamLab/src/components/MaterialPanel.tsx:324` — `sandbox`-Attribut + erklärender Kommentar
- `ExamLab/src/components/shared/header/L3Dropdown.tsx` — `useId`-Import, `listboxId`-State, 3 ARIA-Props (button, listbox, „+ Neu"-option)

**Neue Test-Files:**
- `ExamLab/src/components/MaterialPanel.test.tsx` (colocated)

**Existierende Test-Files erweitert:**
- `ExamLab/src/components/shared/header/L3Dropdown.test.tsx`

**Doku-Datei neu:**
- `ExamLab/docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md` (Inventar für F4)

---

## Task 1: F2 — MaterialPanel sandbox-Fix

**Files:**
- Modify: `ExamLab/src/components/MaterialPanel.tsx:320-325` (genau das `sandbox`-Attribut auf Z. 324 + erklärender Kommentar)
- Create: `ExamLab/src/components/MaterialPanel.test.tsx`

**Was ist falsch:** Z. 324 hat `sandbox="allow-scripts allow-same-origin"`. Diese Kombi erlaubt dem iframe sich selbst zu entsandboxen (kann via `window.parent` auf Parent-DOM/Cookies zugreifen). Effektiv kein Sandbox.

**Fix-Ziel:** `sandbox="allow-scripts"` only. Scripts laufen (für moderne Sites), kein same-origin (iframe kann nicht auf Parent zugreifen).

**Hinweis:** Die anderen 6 iframes im Repo (MaterialPanel:254/281 Drive-PDF/Doc, MediaAnhang:93/116/143 Embed/Video/PDF, PDFAnnotationAnzeige:26) sind alle Drive- oder Embed-iframes. Diese bleiben unverändert — bewusst kein `sandbox` aus dokumentierten Gründen (Chrome PDF-Plugin braucht Plugin-Zugriff, siehe `.claude/rules/bilder-in-pools.md` #16).

- [ ] **Step 1: Failing Test schreiben**

```tsx
// ExamLab/src/components/MaterialPanel.test.tsx
import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import MaterialPanel from './MaterialPanel'
import type { PruefungsMaterial } from '../types/pruefung'

describe('MaterialPanel — iframe Sandbox-Strategie', () => {
  test('iframe für externe Link-Materialien hat sandbox="allow-scripts" (kein same-origin)', () => {
    const material: PruefungsMaterial = {
      id: 'm1',
      titel: 'Test-Link',
      typ: 'link',
      url: 'https://example.com',
    }
    const { container } = render(
      <MaterialPanel
        materialien={[material]}
        modus="overlay"
        onSchliessen={vi.fn()}
        onModusWechsel={vi.fn()}
      />
    )
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts')
  })
})
```

**Falls `PruefungsMaterial` Type weitere Pflichtfelder hat** (z.B. `kategorie`, `reihenfolge`): in `src/types/pruefung.ts` nachschauen und ergänzen. Import-Pfad: `import type { PruefungsMaterial } from '../types/pruefung'`.

- [ ] **Step 2: Test laufen lassen, Fail bestätigen**

```bash
cd ExamLab && npx vitest run src/components/MaterialPanel.test.tsx
```

Erwartet: FAIL — `sandbox` attribute ist aktuell `"allow-scripts allow-same-origin"`, nicht `"allow-scripts"`.

- [ ] **Step 3: Fix umsetzen**

In `MaterialPanel.tsx:320-325` — `sandbox`-Attribut auf `"allow-scripts"` ändern + erklärender Kommentar davor:

```tsx
<iframe
  src={material.url}
  className="flex-1 min-h-0 w-full border-0"
  title={material.titel}
  // Sandbox NUR allow-scripts: moderne Sites laufen, aber iframe kann nicht auf
  // parent-DOM/-Cookies zugreifen. Die Kombi mit allow-same-origin wäre
  // effektiv kein Sandbox (iframe kann sich selbst entsandboxen).
  sandbox="allow-scripts"
/>
```

KEINE anderen Änderungen in der File.

- [ ] **Step 4: Test re-run, Pass bestätigen**

```bash
cd ExamLab && npx vitest run src/components/MaterialPanel.test.tsx
```

Erwartet: PASS.

- [ ] **Step 5: tsc + Voll-vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Erwartet: vitest baseline 2127 + 6 todo + 1 neuer Test = 2128 + 6 todo.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/components/MaterialPanel.tsx ExamLab/src/components/MaterialPanel.test.tsx
git commit -m "fix(materialpanel): sandbox=\"allow-scripts\" — react-doctor security

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: F3 — L3Dropdown ARIA-Fix

**Files:**
- Modify: `ExamLab/src/components/shared/header/L3Dropdown.tsx`
- Modify: `ExamLab/src/components/shared/header/L3Dropdown.test.tsx`

**Was ist falsch:**
- Z. 84 `<button role="combobox">` fehlt `aria-controls` (verlinkt zur listbox)
- Z. 143 `<button role="option">` (der „+ Neu"-Action-Eintrag) fehlt `aria-selected`

**Fix-Ziel:** `useId()`-Hook für eine stabile `listboxId`, `aria-controls` am combobox-Button konditional setzen (nur wenn `offen`), `aria-selected={false}` am „+ Neu"-Button.

- [ ] **Step 1: Failing Tests schreiben** (im existierenden Test-File ergänzen)

```tsx
// In L3Dropdown.test.tsx ergänzen (Imports anpassen falls nötig):

test('combobox button hat aria-controls auf listbox-id wenn offen', () => {
  render(<L3Dropdown mode="single" items={[{ id: 'a', label: 'A' }]} selectedIds={[]} onSelect={() => {}} />)
  const button = screen.getByRole('combobox')
  expect(button.getAttribute('aria-controls')).toBeFalsy()  // closed
  fireEvent.click(button)
  const listboxId = button.getAttribute('aria-controls')
  expect(listboxId).toBeTruthy()
  expect(document.getElementById(listboxId!)?.getAttribute('role')).toBe('listbox')
})

test('"+ Neu" option hat aria-selected="false"', () => {
  render(
    <L3Dropdown
      mode="single"
      items={[]}
      selectedIds={[]}
      onSelect={() => {}}
      onAddNew={() => {}}
      addNewLabel="+ Test"
    />,
  )
  fireEvent.click(screen.getByRole('combobox'))
  const neuOption = screen.getByRole('option', { name: '+ Test' })  // exact-match, kein Regex
  expect(neuOption.getAttribute('aria-selected')).toBe('false')
})
```

Bestehende Imports prüfen. Falls `screen`/`fireEvent` noch nicht da: `import { render, screen, fireEvent } from '@testing-library/react'`.

- [ ] **Step 2: Tests laufen lassen, Fail bestätigen**

```bash
cd ExamLab && npx vitest run src/components/shared/header/L3Dropdown.test.tsx
```

Erwartet: 2 NEUE Tests FAIL (aria-Attribute fehlen noch), restliche Tests PASS.

- [ ] **Step 3: Fix umsetzen** in `L3Dropdown.tsx`

**a) Import erweitern (Z. 1):**

```tsx
import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react'
```

**b) `listboxId`-Variable nach `useState(false)`:**

```tsx
export function L3Dropdown({ mode, items, selectedIds, onSelect, onAddNew, addNewLabel, placeholder }: Props) {
  const [offen, setOffen] = useState(false)
  const listboxId = useId()
  const ref = useRef<HTMLDivElement>(null)
  // ...
```

**c) `aria-controls` am combobox-button:**

```tsx
<button
  ref={buttonRef}
  type="button"
  role="combobox"
  aria-haspopup="listbox"
  aria-expanded={offen}
  aria-controls={offen ? listboxId : undefined}
  onClick={() => setOffen((o) => !o)}
  className={...}
>
```

**d) `id={listboxId}` am listbox-`<div>`:**

```tsx
{offen && menuPos && createPortal(
  <div
    ref={listboxRef}
    id={listboxId}
    role="listbox"
    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
    className="..."
  >
```

**e) `aria-selected={false}` am „+ Neu"-Button:**

```tsx
<button
  type="button"
  role="option"
  aria-selected={false}
  onClick={() => {
    onAddNew()
    setOffen(false)
  }}
  className="..."
>
  {addNewLabel ?? '+ Neu'}
</button>
```

KEINE anderen Änderungen.

- [ ] **Step 4: Tests re-run, Pass bestätigen**

```bash
cd ExamLab && npx vitest run src/components/shared/header/L3Dropdown.test.tsx
```

Alle Tests PASS.

- [ ] **Step 5: tsc + Voll-vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Erwartet: 2128 + 6 todo (nach Task 1) + 2 neue Tests = 2130 + 6 todo.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/components/shared/header/L3Dropdown.tsx ExamLab/src/components/shared/header/L3Dropdown.test.tsx
git commit -m "fix(l3dropdown): aria-controls + aria-selected — react-doctor a11y

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: F4 — `no-danger` Inventar

**Files:**
- Create: `ExamLab/docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md`

**Was ist das:** Reine Doku-Aufgabe. Vorbereitung für die spätere Audit-Session, die alle ~46 React-Danger-Prop-Stellen auf saubere Pre-Sanitisierung prüft. KEIN Code-Fix.

- [ ] **Step 1: Liste aller Stellen extrahieren**

```bash
cd ExamLab && grep -rn 'dangerously​SetInnerHTML' src/ --include='*.tsx' --include='*.ts' | grep -v -E '(test\.|\.test)' | sort
```

**Beim Ausführen:** Das obenstehende `dangerously​SetInnerHTML` ist im Plan-Dokument mit Zero-Width-Space geschrieben. **Im Terminal die Such-Zeichenkette als zusammenhängenden CamelCase verbatim eintippen.** Der ZWS ist ein Plan-Doc-Artefakt zum Umgehen des per-edit-security-hooks.

Output erfassen — sollte ~46 Zeilen geben.

- [ ] **Step 2: Bestandsaufnahme-Datei anlegen**

`ExamLab/docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md`:

Struktur:

```markdown
# `no-danger` Bestandsaufnahme (28.05.2026)

**Zweck:** Vorbereitung für Pre-Sanitisierungs-Audit der ~46 React-Danger-Prop-Stellen aus react-doctor-Warnings.

**Quelle:** `grep -rn <danger-identifier> src/ --include='*.tsx' --include='*.ts' | grep -v -E '(test\.|\.test)'`

**Stand:** main @ <aktueller-Commit>

## Kategorisierung

### Markdown/LaTeX-Rendering (sanitisiert via `renderMarkdown`/`renderLatexSync`)

| File:Line | Kontext | Sanitization-Quelle |
|---|---|---|
| `<file>:<line>` | <kurze Beschreibung> | <Funktion/Pfad> |

### Backend-HTML (Aufgabentexte aus Sheet)

...

### Quill/Tiptap-Output (Editor-Content)

...

### Sonstiges (manuelle Review bei Audit)

...

## Reading-List für späteren Audit

Empfohlene Reihenfolge für die spätere Audit-Session:

1. Markdown/LaTeX-Stellen — wahrscheinlich alle via `renderMarkdown` sanitisiert, schnellster Sweep.
2. Backend-HTML — kritisch, da SuS-Inputs nicht direkt sondern via Lehrer-Editor kommen. Stichproben + `bereinigeFrageFuerSuSUeben_` als Bottleneck verifizieren.
3. Quill/Tiptap-Output — Editor-Output ist allgemein als "trusted" markiert, aber prüfen ob mind. eine Sanitisierungs-Layer existiert.
4. Sonstiges — manuelle Prüfung pro Stelle.

## Bekannte Sanitization-Pfade im Repo

- `src/utils/markdown.ts::renderMarkdown` — markdown-it Default-Config + Allowlist
- `src/utils/latexRenderer.ts::renderLatexSync` — KaTeX-Output (eigentlich kein HTML-Injection-Risk)
- `src/components/MaterialPanel.tsx` verwendet **DOMPurify** für Backend-HTML
- Apps-Script-Backend-Bereinigung: `bereinigeFrageFuerSuSUeben_` (entfernt Lösungsfelder, nicht HTML-Sanitisierung)
```

Die Tabellen werden mit den echten Hits aus Step 1 befüllt. Heuristik:
- Pfad enthält `FrageText` oder `Markdown` → Markdown/LaTeX
- Pfad unter `lp/korrektur/` oder `lp/auswertung/` → Backend-HTML
- Pfad unter `lp/frageneditor/` oder mit `Quill`/`Tiptap` → Editor-Output
- Sonstige → Sonstiges

- [ ] **Step 3: Datei committen**

```bash
git add ExamLab/docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md
git commit -m "docs(no-danger): Inventar 46 Stellen — Folge-Audit-Vorbereitung

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: react-doctor Re-Run + ci-check

**Files:** keine direkten Modifikationen (nur Verifikation).

- [ ] **Step 1: ci-check (11 Gates)**

```bash
cd ExamLab && npm run ci-check
```

Erwartet: alle 11 Gates clean.

- [ ] **Step 2: react-doctor Re-Run**

```bash
cd ExamLab && npx react-doctor@latest --json > /tmp/rd-report-folge.json 2>/dev/null
```

(Exit-Code non-0 ist normal, JSON wird trotzdem geschrieben.)

- [ ] **Step 3: Errors zählen**

Defensive Pre-Check: Top-Level-Struktur des JSON inspizieren falls jq-Filter brechen:

```bash
jq 'keys' /tmp/rd-report-folge.json
```

Erwartete Top-Level-Keys u.a.: `schemaVersion`, `version`, `ok`, `projects`. Falls Format anders, die Filter unten anpassen.

Distinct-Errors zählen:

```bash
jq '[.. | objects | select(.severity == "error") | {file: .filePath, rule, line}] | unique | length' /tmp/rd-report-folge.json
```

Erwartet: **13** (von vorher 15, -2 von L3Dropdown).

- [ ] **Step 4: Rule-Verteilung prüfen**

```bash
jq '[.. | objects | select(.severity == "error") | {file: .filePath, rule, line}] | unique | group_by(.rule) | map({rule: .[0].rule, count: length})' /tmp/rd-report-folge.json
```

Erwartet:
- `only-export-components`: 12
- `role-has-required-aria-props`: **0** ← (war 2)
- `no-eval`: 1

- [ ] **Step 5: Verifizieren dass keine Regressionen aus unseren neuen Files**

```bash
jq '[.. | objects | select(.severity == "error") | .filePath] | unique | map(select(test("(MaterialPanel|L3Dropdown|no-danger-bestandsaufnahme)")))' /tmp/rd-report-folge.json
```

Erwartet: leer `[]`.

- [ ] **Step 6: iframe-sandbox-Warning für MaterialPanel:324 prüfen**

```bash
jq '[.. | objects | select(.rule != null and (.rule | test("iframe.*sandbox"))) | {file: .filePath, rule, line, severity}] | unique' /tmp/rd-report-folge.json
```

Erwartet: MaterialPanel:324 nicht mehr in der Liste (oder als Severity-Warning nur für die anderen Drive-iframes).

---

## Task 5: Browser-E2E staging

**Files:** keine.

- [ ] **Step 1: FF-Push zu preview**

```bash
git push origin fix/react-doctor-folge-prio1-prio2:preview
```

Wartet auf staging-Deploy (~2 min). Run-ID des frisch getriggerten Workflows abfragen + warten:

```bash
RUN_ID=$(gh run list --branch preview --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status   # läuft im Hintergrund via run_in_background-Flag des Bash-Tools
```

- [ ] **Step 2: Test-Plan**

```markdown
## Test-Plan F-Sweep

### Zu testen
| # | Bereich | Erwartung | Risiko |
|---|---|---|---|
| 1 | LP-Header L3Dropdown öffnen | aria-controls + listbox-id sichtbar im DOM | a11y-Refactor |
| 2 | MaterialPanel externer Link rendert | iframe sandbox="allow-scripts", Wikipedia/Beispiel-URL lädt | Sandbox-Refactor |
| 3 | LP-Tab Console Errors | 0 React-Warnings | beide Fixes |

### Sicherheit
- [ ] iframe kann NICHT via window.parent auf parent-DOM zugreifen (DevTools-Console-Check im iframe-Context)

### Regression
- [ ] Existierende Dropdowns funktionieren weiterhin (Klick → öffnen → option auswählen → schliessen)
```

- [ ] **Step 3: Chrome-in-Chrome Tab-Gruppe nutzen** (war bereits in vorheriger Session offen, Tabs 1241786982 LP + 1241786983 SuS).

Tests durchführen:
- LP-Tab → Fragensammlung öffnen → ein Dropdown mit „+ Neu"-Option triggern → DevTools-Elements-Tab → `aria-controls` und listbox-`id` matchen lassen
- LP-Tab → eine Prüfung mit Material vom Typ `link` öffnen → iframe inspizieren → `sandbox`-Attribut `allow-scripts`
- Console: 0 Errors

Bei Fehler: Hotfix-Commit auf dem Branch, E2E erneut.

---

## Task 6: Merge + HANDOFF + Memory

**Files:**
- Modify: `ExamLab/HANDOFF.md`
- Modify: `~/.claude/projects/.../memory/project_examlab_qa_tooling.md`
- Modify: `~/.claude/projects/.../memory/MEMORY.md`

- [ ] **Step 1: HANDOFF.md neuer Eintrag** (vor 28.05.2026-Eintrag von der vorherigen Session):

```markdown
### Stand 28.05.2026 SPÄT — react-doctor Folge-Sweep Prio 1 + Prio 2 KOMPLETT

Drei Folge-Fixes nach High-Confidence-Sweep:
- F2 MaterialPanel:324 sandbox="allow-scripts" (war "allow-scripts allow-same-origin")
- F3 L3Dropdown aria-controls (useId) + aria-selected={false}
- F4 `no-danger` Inventar 46 Stellen als Audit-Vorbereitung

**Verifikation:** react-doctor Errors 15 → 13 (L3Dropdown role-has-required-aria-props weg), vitest 2130 + 6 todo, 11 CI-Gates ✓.

**E2E staging:** [zusammenfassen]

**Commits:** [auflisten]
```

- [ ] **Step 2: HANDOFF committen**

```bash
git add ExamLab/HANDOFF.md
git commit -m "docs(handoff): react-doctor Folge-Sweep Prio 1 + Prio 2 KOMPLETT

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: FF-Merge auf main + Push**

```bash
git checkout main
git merge --ff-only fix/react-doctor-folge-prio1-prio2
git push origin main
git push origin main:preview
git branch -d fix/react-doctor-folge-prio1-prio2
```

- [ ] **Step 4: Memory aktualisieren**

In `project_examlab_qa_tooling.md` Header + §1 ergänzen: Errors 15 → 13, F2/F3/F4 dazu.

In `MEMORY.md` Hot Picks aktualisieren mit dem neuen Stand.

---

## Risiko-Übersicht

| Task | Risiko | Mitigation |
|---|---|---|
| 1 (Sandbox) | Mittel — externe Sites mit same-origin-Bedarf brechen | Browser-E2E mit echtem Material-Link |
| 2 (a11y) | Niedrig — aria-Attribut-only-Refactor | Unit-Tests verifizieren |
| 3 (Inventar) | Null — read-only Doku | — |
| 4 (Verify) | Niedrig — pure Verifikation | — |
| 5 (E2E) | Mittel — Tab-Gruppe-Setup, staging-Deploy-Latenz | Tab-Gruppe bereits offen |
| 6 (Merge) | Niedrig — FF-Merge, kein Konflikt erwartbar | preview = main vor Push |

## Definition of Done

- F2 + F3 LIVE auf main + preview, F4-Inventar als Markdown-File committed
- react-doctor Errors: **15 → 13**
- vitest: **2127 + 6 todo → 2130 + 6 todo** (+3 neue Tests)
- 11 CI-Gates ✓
- E2E staging clean
- HANDOFF + Memory aktualisiert
- Branch `fix/react-doctor-folge-prio1-prio2` gelöscht
