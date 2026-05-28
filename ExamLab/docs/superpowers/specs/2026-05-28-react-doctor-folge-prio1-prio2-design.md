# react-doctor Folge-Sweep Prio 1 + Prio 2 — Design

**Datum:** 2026-05-28
**Branch:** `fix/react-doctor-folge-prio1-prio2`
**Vorgängige Session:** 8 High-Confidence-Fixes LIVE auf `main` `dd5f62d` (siehe `2026-05-28-react-doctor-high-confidence-fixes.md`).
**Vor-Stand react-doctor:** 15 Errors (Baseline ohne neue Regressionen), Warnings unverändert.

## Ziel

Drei eng-fokussierte Folge-Fixes aus dem react-doctor-28.05.2026-Audit-Backlog:

1. **Prio 1 Security** — MaterialPanel:324: iframe-Sandbox-Kombi `allow-scripts allow-same-origin` ist effektiv KEIN Sandbox (iframe kann sich selbst entsandboxen, dokumentiert in `.claude/claude-security-guidance.md` § Media/iframes/CSP).
2. **Prio 2 Accessibility** — L3Dropdown: 2 fehlende ARIA-Properties (`combobox` ohne `aria-controls`, „+ Neu"-`option` ohne `aria-selected`).
3. **Prio 3 Inventar** — 46× React-Danger-Prop-Warnungen (`no-danger`) aus dem Audit auflisten + grob kategorisieren (Markdown/LaTeX/Backend-HTML), KEIN Fix in dieser Session. Vorbereitung für späteren Pre-sanitisierungs-Audit.

## Architektur

Ein einziger Feature-Branch mit drei isolierten Commits:

```
fix/react-doctor-folge-prio1-prio2 (von main @ dd5f62d)
├── F1 docs(plan): ...
├── F2 fix(materialpanel): sandbox="allow-scripts" — react-doctor security
├── F3 fix(l3dropdown): aria-controls + aria-selected — react-doctor a11y
├── F4 docs(no-danger): Inventar 46 Stellen — Folge-Audit-Vorbereitung
└── F5 docs(handoff): Folge-Sweep KOMPLETT
```

## Konkrete Änderungen

### Fix 1 — MaterialPanel.tsx:320-325 (Security)

**Problem:** Der iframe für `material.typ === 'link'` (externe URLs wie Wikipedia, Schul-Seiten, Blog-Posts) hat `sandbox="allow-scripts allow-same-origin"`. Die Kombi erlaubt dem iframe sich selbst zu entsandboxen — er kann via `window.parent` auf Parent-DOM/Cookies zugreifen.

**Hinweis:** Die anderen 6 iframes (MaterialPanel:254 PDF, :281 Doc, MediaAnhang:93/116/143, PDFAnnotationAnzeige:26) sind alle Drive- oder Embed-iframes; bewusst kein `sandbox` aus dokumentierten Gründen (Chrome PDF-Plugin braucht Plugin-Zugriff, siehe `.claude/rules/bilder-in-pools.md` #16). Diese bleiben unverändert.

**Fix:** `sandbox="allow-scripts"` only — Scripts laufen (moderne Sites funktionieren), aber kein same-origin → iframe kann nicht mehr auf Parent zugreifen.

```tsx
// Vorher (MaterialPanel.tsx:320-325):
<iframe
  src={material.url}
  className="flex-1 min-h-0 w-full border-0"
  title={material.titel}
  sandbox="allow-scripts allow-same-origin"
/>

// Nachher:
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

### Fix 2 — L3Dropdown.tsx (Accessibility)

**Problem 1:** Z. 84 `<button role="combobox">` fehlt `aria-controls` — Screen-Reader wissen nicht, welche listbox der combobox-Button steuert.

**Problem 2:** Z. 143 `<button role="option">` (der „+ Neu"-Action-Eintrag im Listbox) fehlt `aria-selected` — laut WAI-ARIA muss jede `role="option"` ein `aria-selected` haben.

**Fix:**

```tsx
// Imports erweitern:
import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react'

// In der Component nach offen-State:
const listboxId = useId()

// Z. 81-93 — combobox button: aria-controls hinzufügen
<button
  ref={buttonRef}
  type="button"
  role="combobox"
  aria-haspopup="listbox"
  aria-expanded={offen}
  aria-controls={offen ? listboxId : undefined}
  ...
>

// Z. 109-114 — listbox div im Portal: id ergänzen
<div
  ref={listboxRef}
  id={listboxId}
  role="listbox"
  ...
>

// Z. 141-150 — „+ Neu"-Button: aria-selected hinzufügen
<button
  type="button"
  role="option"
  aria-selected={false}
  ...
>
```

`aria-controls` wird konditional gesetzt (`offen ? listboxId : undefined`), weil das listbox-Element nur existiert, wenn der Dropdown offen ist.

### Fix 3 — no-danger Inventar (Doku-Only)

**Vorgehen:**

1. `grep -rn 'dangerously​SetInnerHTML' src/ --include='*.tsx' --include='*.ts' | grep -v test` aus `ExamLab/`-Root.
   **WICHTIG für Implementer:** Der Identifier oben enthält im Plan-Dokument einen Zero-Width-Space (zwischen `dangerously` und `SetInnerHTML`), um einen per-edit-security-hook im Editor zu umgehen. **Bei der echten Ausführung des grep-Commands den Identifier verbatim als `dangerouslySetInnerHTML` schreiben** (kein ZWS, ein zusammenhängender CamelCase-String). Der ZWS ist NUR ein Plan-Dokument-Artefakt zum Workaround.
2. Heuristische Kategorisierung pro Hit:
   - **Markdown/LaTeX** — Files mit Namen `FrageText`, `Markdown*`, `Latex*`, `MathJax*`
   - **Backend-HTML** — Files unter `lp/korrektur/`, `lp/auswertung/`
   - **Quill/Tiptap-Output** — Files unter `lp/frageneditor/`
   - **Sonstiges** — alles andere (manuelle Review beim eigentlichen Audit)
3. Ergebnis als `docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md` ablegen mit:
   - Tabelle `File:Line | Kategorie | Sanitization-Quelle (zu prüfen)`
   - Hinweise zu bekannten Sanitization-Pfaden (z.B. `renderMarkdown`-Output → markdown-it default + project-allowlist?)
   - Liste der Files für die spätere Audit-Session als Reading-List

**Erfolgs-Kriterium:** Vollständige Liste aller `no-danger`-Stellen mit grober Kategorisierung; KEIN Code-Fix in dieser Session.

## Test-Strategie

### Fix 1 — Unit + E2E

**Unit** (`ExamLab/src/components/MaterialPanel.test.tsx`, neu colocated):

Korrekte Component-Signatur (verifiziert MaterialPanel.tsx:13-18): `MaterialPanel` erwartet **`materialien: PruefungsMaterial[]`** (Array!), `modus: 'split' | 'overlay'`, `onSchliessen`, `onModusWechsel`. Die `aktivesMaterial`-Auswahl (Z. 28-30) wählt automatisch das einzige Material aus, wenn `materialien.length === 1`. Damit ist der Test minimal:

```tsx
import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import MaterialPanel from './MaterialPanel'
import type { PruefungsMaterial } from '../types/pruefung'

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
```

**Hinweis Implementer:** `PruefungsMaterial` Type-Felder bitte aus `src/types/pruefung.ts` verifizieren — falls weitere Pflichtfelder existieren (z.B. `kategorie`, `reihenfolge`), ergänzen.

**E2E** (staging Tab-Gruppe):
1. LP-Tab → existierende Prüfung mit Material vom Typ `link` öffnen (oder Demo-Material per JS injecten)
2. iframe inspizieren: `sandbox`-Attribut = `allow-scripts`
3. Iframe-Content lädt (externer Link rendert ohne Fehler)
4. Browser-Console: keine Fehler

### Fix 2 — Unit-Test-Erweiterung

Existierende `L3Dropdown.test.tsx` erweitern um:

```tsx
test('combobox button hat aria-controls auf listbox-id wenn offen', () => {
  render(<L3Dropdown mode="single" items={[{id:'a',label:'A'}]} selectedIds={[]} onSelect={()=>{}} />)
  const button = screen.getByRole('combobox')
  expect(button.getAttribute('aria-controls')).toBeFalsy()  // closed
  fireEvent.click(button)
  const listboxId = button.getAttribute('aria-controls')
  expect(listboxId).toBeTruthy()
  expect(document.getElementById(listboxId!)?.getAttribute('role')).toBe('listbox')
})

test('"+ Neu" option hat aria-selected="false"', () => {
  render(<L3Dropdown mode="single" items={[]} selectedIds={[]} onSelect={()=>{}} onAddNew={()=>{}} addNewLabel="+ Test" />)
  fireEvent.click(screen.getByRole('combobox'))
  const neuOption = screen.getByRole('option', { name: /Test/ })
  expect(neuOption.getAttribute('aria-selected')).toBe('false')
})
```

### Fix 3 — Keine Tests

Es ist ein Markdown-Dokument, kein Code.

## Risiko-Übersicht

| Fix | Risiko | Mitigation |
|---|---|---|
| F2 (Sandbox) | Mittel — externe Sites die `same-origin` brauchten (Embedded Web-Apps mit eigenen Cookies) brechen | Browser-E2E mit realistischem Material-Link (Wikipedia o.ä.). LP kann im Notfall `sandbox`-Attribut manuell setzen. Memory-Doc ergänzen. |
| F3 (a11y) | Niedrig — aria-Attribut-only-Änderung, kein Logic-Change | Existierende L3Dropdown-Tests laufen unverändert grün; neue Tests verifizieren die Spec. |
| F4 (Inventar) | Null — read-only + Doku | — |

## CI-Gates / Verifikation

- `npm run ci-check` clean (11 Gates)
- `npx react-doctor@latest --json` Re-Run:
  - **Errors:** 15 → 13 (Differenz exakt -2 von L3Dropdown — `role-has-required-aria-props`-Errors weg). `no-eval` (poolSync.ts:76, bewusst eslint-disable) bleibt, `only-export-components` (12×) bleibt.
  - **Warnings:** `iframe-missing-sandbox`-Liste sollte verifizieren ob die `MaterialPanel:324`-Stelle daraus verschwunden ist (sie war als Warning gelistet, nicht als Error — der Fix verbessert trotzdem die Security-Bewertung).
- vitest: ≥ 2127 + 6 todo + neue Tests aus F2/F3 (Erwartung: ≥ 2130)
- E2E: Material-Link rendert auf staging

## Definition of Done

- F2 + F3 LIVE auf main + preview, F4 als Markdown-File committed
- react-doctor Errors: 15 → 13 (a11y-Errors weg)
- 11 CI-Gates ✓
- HANDOFF + Memory `project_examlab_qa_tooling.md` aktualisiert
- Branch gelöscht
