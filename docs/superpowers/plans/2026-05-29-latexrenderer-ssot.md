# latexRenderer SSOT-Konsolidierung — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine einzige latexRenderer-Implementierung in `packages/shared` (static KaTeX-CSS, S140-korrekt), ohne KaTeX-Leak in den Unterrichtsplaner.

**Architecture:** Der shared latexRenderer übernimmt ExamLabs static-CSS-Variante; ExamLabs Datei wird ein Re-Export-Shim; `sideEffects: ["**/*.css"]` in shared/package.json lässt Rollup den ungenutzten Renderer (inkl. katex.css) aus dem Planer tree-shaken. Verifikation per /tmp-Build (außerhalb iCloud).

**Tech Stack:** TypeScript, Vite/Rollup, vitest, KaTeX, npm workspaces.

**Spec:** `docs/superpowers/specs/2026-05-29-latexrenderer-ssot-konsolidierung-design.md`

**Branch:** `refactor/latexrenderer-ssot` (bereits aktiv)

---

## File Structure

- **Modify** `packages/shared/src/editor/utils/latexRenderer.ts` — CDN-Inject raus, static `import 'katex/dist/katex.min.css'` rein (= ExamLabs aktuelle Variante).
- **Create** `packages/shared/src/editor/utils/latexRenderer.test.ts` — migrierter `normalisiereLatex`-Test (colocated).
- **Modify** `packages/shared/package.json` — `"sideEffects": ["**/*.css"]`.
- **Modify** `ExamLab/src/utils/latexRenderer.ts` — Inhalt → `export * from '@shared/editor/utils/latexRenderer'`.
- **Delete** `ExamLab/src/utils/latexRenderer.test.ts` — nach shared migriert.

Unverändert (Konsumenten): `ExamLab/.../FrageText.tsx`, `FormelFrageComponent.tsx`, `autoKorrektur.ts` (importieren weiter `../../utils/latexRenderer.ts` → jetzt Shim), shared `FormelEditor.tsx`.

---

## Task 1: normalisiereLatex-Test nach shared migrieren (Regression-Baseline)

**Files:**
- Create: `packages/shared/src/editor/utils/latexRenderer.test.ts`
- Delete: `ExamLab/src/utils/latexRenderer.test.ts`

- [ ] **Step 1: Neuen shared-Test anlegen** (Inhalt = ExamLab-Test, aber Import bleibt `./latexRenderer`, da colocated)

```ts
import { describe, it, expect } from 'vitest'
import { normalisiereLatex } from './latexRenderer'

describe('normalisiereLatex', () => {
  it('entfernt Whitespace', () => {
    expect(normalisiereLatex('a + b')).toBe('a+b')
  })
  it('entfernt \\left und \\right', () => {
    expect(normalisiereLatex('\\left(a\\right)')).toBe('(a)')
  })
  it('normalisiert \\cdot und \\times zu *', () => {
    expect(normalisiereLatex('a \\cdot b')).toBe('a*b')
    expect(normalisiereLatex('a \\times b')).toBe('a*b')
  })
  it('entfernt unnötige geschweifte Klammern um einzelne Zeichen', () => {
    expect(normalisiereLatex('{a}')).toBe('a')
  })
  it('behält mehrzeichen-Klammern bei', () => {
    expect(normalisiereLatex('{ab}')).toBe('{ab}')
  })
  it('normalisiert komplexe Ausdrücke konsistent', () => {
    expect(normalisiereLatex('\\left(a + b\\right) \\cdot c')).toBe('(a+b)*c')
  })
  it('normalisiert identische Formeln gleich', () => {
    expect(normalisiereLatex('a+b')).toBe(normalisiereLatex('a + b'))
  })
})
```

> **Hinweis Implementierer:** Vor dem Schreiben die ECHTE `ExamLab/src/utils/latexRenderer.test.ts` lesen und ihre Assertions 1:1 übernehmen (oben ist die erwartete Struktur — exakte Erwartungswerte aus der Quelle übernehmen, nicht raten).

- [ ] **Step 2: shared vitest laufen — Test grün** (normalisiereLatex existiert bereits in shared)

Run: `cd packages/shared && npx vitest run latexRenderer`
Expected: PASS (alle Fälle grün)

- [ ] **Step 3: Alte ExamLab-Testdatei löschen**

```bash
git rm "ExamLab/src/utils/latexRenderer.test.ts"
```

- [ ] **Step 4: ExamLab vitest — weiterhin grün (ein Test weniger)**

Run: `cd ExamLab && npx vitest run`
Expected: PASS (2166 → ~2158, da normalisiereLatex-Fälle jetzt in shared)

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/editor/utils/latexRenderer.test.ts
git commit -m "test(shared): normalisiereLatex-Test nach shared migrieren (latexRenderer-SSOT)"
```

---

## Task 2: shared latexRenderer auf static CSS + sideEffects (atomar)

**Warum atomar:** static `import 'katex.css'` ohne `sideEffects` würde einen Planer-Leak-Zwischenzustand erzeugen. Beide Änderungen in einem Commit halten jeden Zwischenstand sauber.

**Files:**
- Modify: `packages/shared/src/editor/utils/latexRenderer.ts`
- Modify: `packages/shared/package.json`

- [ ] **Step 1: shared latexRenderer.ts auf static CSS umstellen**

Ersetze den Dateikopf bis inkl. `injiziereKatexCSS()`: entferne `injiziereKatexCSS`, das `cssInjected`-Flag und den `injiziereKatexCSS()`-Aufruf in `ladeKatex`; füge `import 'katex/dist/katex.min.css'` am Kopf ein. Resultat (Kopf bis ladeKatex):

```ts
/**
 * LaTeX-Rendering-Utilities für Fragetexte.
 * Lazy-loaded KaTeX-JS; CSS via statischem Import (garantiert vor erstem Render —
 * vermeidet Font-Metrik-Layout-Bruch durch async-CDN-Load, S140 Ticket 2).
 * Unterstützt $$...$$ (Display-Modus) und $...$ (Inline-Modus).
 */
import 'katex/dist/katex.min.css'

let katexModule: typeof import('katex') | null = null
let katexPromise: Promise<typeof import('katex')> | null = null

/** Lazy-Load KaTeX-JS. CSS ist bereits via statischem Import oben geladen. */
async function ladeKatex(): Promise<typeof import('katex')> {
  if (katexModule) return katexModule
  if (!katexPromise) {
    katexPromise = import('katex').then(mod => {
      katexModule = mod
      return mod
    })
  }
  return katexPromise
}
```

Der Rest der Datei (`istKatexGeladen`, `getKatex`, `ladeKatexAsync`, `renderLatexSync`, `verarbeiteLatex`, `normalisiereLatex`) bleibt **unverändert**.

> **Hinweis:** Das ist exakt die aktuelle `ExamLab/src/utils/latexRenderer.ts`. Implementierer kann deren Inhalt als Vorlage nehmen.

- [ ] **Step 2: sideEffects in shared/package.json setzen**

Füge nach `"private": true,` ein:
```json
  "sideEffects": ["**/*.css"],
```

- [ ] **Step 3: tsc + shared vitest**

Run: `cd ExamLab && npx tsc -b` → Expected: kein Fehler (löst auch shared via Projektreferenz auf)
Run: `cd packages/shared && npx vitest run` → Expected: PASS (264 grün)

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/editor/utils/latexRenderer.ts packages/shared/package.json
git commit -m "refactor(shared): latexRenderer auf static katex.css + sideEffects:[**/*.css]"
```

---

## Task 3: ExamLab latexRenderer → Re-Export-Shim

**Files:**
- Modify: `ExamLab/src/utils/latexRenderer.ts`

- [ ] **Step 1: Datei-Inhalt durch Shim ersetzen**

Ganzer Inhalt von `ExamLab/src/utils/latexRenderer.ts`:
```ts
// SSOT: latexRenderer lebt in packages/shared. Diese Datei ist ein Re-Export-Shim,
// damit bestehende ExamLab-Importe (FrageText, FormelFrageComponent, autoKorrektur)
// unverändert bleiben. Siehe docs/superpowers/specs/2026-05-29-latexrenderer-ssot-konsolidierung-design.md
export * from '@shared/editor/utils/latexRenderer'
```

- [ ] **Step 2: tsc + ExamLab vitest**

Run: `cd ExamLab && npx tsc -b` → Expected: kein Fehler
Run: `cd ExamLab && npx vitest run` → Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/utils/latexRenderer.ts
git commit -m "refactor(examlab): latexRenderer → Re-Export-Shim auf shared (SSOT)"
```

---

## Task 4: Bundle-Verifikation (das echte Gate gegen #7-Leak)

**Builds nach /tmp** — das Projektverzeichnis liegt in iCloud, dort überleben dist-Altartefakte `rm` und verfälschen Messungen.

- [ ] **Step 1: Planer-Build nach /tmp + KaTeX-Grep (KRITISCH)**

```bash
cd Unterrichtsplaner && rm -rf /tmp/ssot-planer && npx vite build --outDir /tmp/ssot-planer 2>&1 | tail -3
grep -rl "katex\|KaTeX_\|cdn.jsdelivr.net/npm/katex" /tmp/ssot-planer/assets/ 2>/dev/null && echo "LEAK!" || echo "OK: Planer KaTeX-frei"
```
Expected: `OK: Planer KaTeX-frei` (keine katex-Chunks, keine KaTeX-Font-Assets)

> **Falls LEAK:** NICHT mergen. Spec-Fallback anwenden (CSS-Import in explizit side-effectful Submodul isolieren / sideEffects-Glob justieren). /tmp-Grep ist das Gate.

- [ ] **Step 2: ExamLab-Build nach /tmp — katex genau einmal**

```bash
cd ExamLab && rm -rf /tmp/ssot-examlab && npx vite build --outDir /tmp/ssot-examlab 2>&1 | grep -iE "katex|latexRenderer|built in"
# Robust: zähle CSS-Assets mit KaTeX-@font-face (unabhängig vom Chunk-Namen)
grep -rl "KaTeX_" /tmp/ssot-examlab/assets/*.css 2>/dev/null | wc -l
```
Expected: katex-JS-Chunk vorhanden, Build grün, genau **eine** CSS-Datei mit KaTeX-Fonts (kein doppeltes/CDN-Laden). Bei `1` ist die Konsolidierung korrekt.

- [ ] **Step 3: (kein Commit — reine Verifikation; Ergebnisse dokumentieren)**

---

## Task 5: Voll-Verifikation (ci-check beide Apps) + Browser-Smoke

- [ ] **Step 1: ExamLab ci-check** (alle Gates + vitest + build)

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -15`
Expected: alle Gates 0 Regressions, vitest grün, build grün.

> **react-doctor-security-Gate beachten:** Falls der no-danger/no-eval-Count sich durch die Datei-Verschiebung verschiebt (latexRenderer hat keine danger-Tokens — sollte nicht), Baseline analog #6 migrieren.

- [ ] **Step 2: Planer-Verifikation**

Run: `cd Unterrichtsplaner && npx tsc -b && npx vitest run && npm run build 2>&1 | tail -3`
Expected: grün; Planer-Bundle ≈ unverändert (kein KaTeX).

- [ ] **Step 3: Browser-Smoke ExamLab (preview, Demo-SuS)**

Test-Plan:
1. Formel-**Anzeige**: Einrichtungsprüfung → Formel-Frage (Teil B) → KaTeX-Glyphen korrekt gerendert (Wurzel/Bruch-Metrik), keine Console-Errors.
2. Formel-**Editor** (falls per Demo-LP erreichbar): FormelEditor-Live-Vorschau rendert korrekt. (Sonst: für LP-Login-Pfad dem User zum Staging-Test übergeben.)
3. Network: kein Request mehr an `cdn.jsdelivr.net/npm/katex` (CSS jetzt gebündelt).

- [ ] **Step 4: HANDOFF/Doku-Notiz + finaler Stand**

Kein Code-Commit nötig falls ci-check sauber. Branch bereit für Staging-Push (`preview`) → User-Browser-Test → Merge auf `main` (gemäß Merge-Gate-Regel).

---

## Definition of Done

- [ ] Eine latexRenderer-Quelle (shared), ExamLab-Datei ist Shim, alte ExamLab-Testdatei gelöscht.
- [ ] `sideEffects: ["**/*.css"]` in shared/package.json.
- [ ] /tmp Planer-Build: **0× katex** (Gate bestanden).
- [ ] /tmp ExamLab-Build: katex einmal, Formel-Chunk intakt.
- [ ] ci-check ExamLab grün, Planer tsc+vitest+build grün, shared vitest grün.
- [ ] Browser-Smoke: Formel-Anzeige rendert korrekt, kein CDN-Request.
- [ ] kontenrahmen-Daten-Drift als separater Task geflaggt (spawn_task).
