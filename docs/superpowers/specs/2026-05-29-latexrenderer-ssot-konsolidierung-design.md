# latexRenderer SSOT-Konsolidierung — Design

**Datum:** 2026-05-29
**Status:** Design (approved)
**Branch:** `refactor/latexrenderer-ssot`
**Scope:** Monorepo (packages/shared + ExamLab; Planer als Verifikations-Gegenprobe)

## Problem

Es existieren zwei funktional identische `latexRenderer`-Implementierungen, die nur in der KaTeX-CSS-Lade-Strategie divergieren:

| Datei | CSS-Strategie | Genutzt von |
|---|---|---|
| `packages/shared/src/editor/utils/latexRenderer.ts` | CDN-`<link>`-Injektion (`cdn.jsdelivr.net/npm/katex@0.16.21`), lazy via `injiziereKatexCSS()` | shared `FormelEditor` (→ in ExamLab via `@shared` im LP-Editor) |
| `ExamLab/src/utils/latexRenderer.ts` | **static** `import 'katex/dist/katex.min.css'` (S140 Ticket 2) | ExamLab `FrageText`, `FormelFrageComponent`, `autoKorrektur` |

Der Rest beider Dateien (`ladeKatex`, `istKatexGeladen`, `getKatex`, `ladeKatexAsync`, `renderLatexSync`, `verarbeiteLatex`, `normalisiereLatex`) ist **byte-identisch** außer Kommentaren.

### Folgen der Drift

1. **Doppeltes KaTeX-Laden in ExamLab:** Im selben App-Kontext sind beide Renderer aktiv — der CDN-Renderer (via `FormelEditor`, LP-Editor) und der static-Renderer (via `FrageText`/`FormelFrage`, SuS-Anzeige + Korrektur). Resultat: KaTeX-CSS wird potenziell zweimal geladen (CDN + gebündelt), und es existieren **zwei getrennte `katexModule`-Instanzen** (jede Datei hat ihr eigenes Modul-Singleton).
2. **S140-Regression-Risiko im Editor-Pfad:** Der shared/CDN-Renderer hat genau das Problem, das S140 Ticket 2 für den ExamLab-Pfad behob: async-CDN-CSS kann hinter dem JS-Render liegen → Wurzelzeichen/Brüche mit Fallback-Fonts → falsche Glyph-Metrik → Layout-Bruch. Der `FormelEditor` (LP) ist diesem Risiko weiterhin ausgesetzt.
3. **Wartungslast:** Zwei Kopien derselben Render-/Normalisierungslogik müssen synchron gehalten werden.

### Historischer Kontext (#7)

Ein früherer Konsolidierungsversuch (Session SPÄT-7) scheiterte: die Vereinheitlichung auf static `katex.min.css` im shared-Renderer leakte 59 KaTeX-Font-Assets + Precache in das **Planer**-Dist. Root-Cause: `packages/shared/package.json` hatte kein `sideEffects`-Feld → Rollup konnte den `@gymhofwil/shared`-Barrel nicht tree-shaken → der Planer (importiert nur `useToast`) zog den ganzen Editor-Graph inkl. des erreichbaren latexRenderer mit, und dessen top-level CSS-Side-Effect leakte. Der Versuch wurde revertiert. Lehre: **Das `sideEffects`-Feld muss korrekt gesetzt sein, bevor ein top-level CSS-Import im shared-Barrel landet.**

## Ziel & Scope

**In Scope:** Eine einzige latexRenderer-Implementierung (SSOT) in `packages/shared`, mit der S140-korrekten static-CSS-Strategie, ohne KaTeX-Leak in den Planer.

**Out of Scope (separate Tasks):**
- **kontenrahmen-Konsolidierung** — blockiert durch eine fachliche Daten-Drift: ExamLab `data/kontenrahmen-kmu.json` (78 Konten, von der Anzeige genutzt) vs. shared `kontenrahmenDaten.ts` (62 Konten, von den Editoren via DI genutzt). Bidirektional divergent (11 nur-shared inkl. „4000 Materialaufwand", „2170 Umsatzsteuer", „8900 Steuern"; 27 nur-ExamLab). Erfordert eine fachliche Festlegung der maßgeblichen Kontenliste durch die Lehrperson, bevor eine Code-Konsolidierung sinnvoll ist. → Eigener Task.

## Ist-Zustand (Nutzer-Graph)

- shared `latexRenderer` (CDN) ← shared `FormelEditor` ← ExamLab `components/lp/frageneditor/FormelEditor.tsx` (Re-Export-Shim) — LP-Editor-Pfad.
- ExamLab `latexRenderer` (static) ← `FrageText.tsx`, `FormelFrageComponent.tsx`, `autoKorrektur.ts` — SuS-Anzeige + Auto-Korrektur.
- **Planer:** importiert latexRenderer **nicht** (nur `useToast`/`ToastContainer` aus shared). Verifiziert: aktueller Planer-Bundle enthält keinen `katex`-String. Vite tree-shakt den Editor-Graph bereits, weil der shared-Renderer aktuell keinen top-level Side-Effect hat.

## Design

### 1. SSOT in shared, static CSS

`packages/shared/src/editor/utils/latexRenderer.ts` wird der einzige Renderer:
- Die CDN-Variante (`injiziereKatexCSS()`, `cssInjected`-Flag, `link`-Erzeugung) wird **entfernt** und durch `import 'katex/dist/katex.min.css'` am Dateikopf ersetzt (ExamLabs S140-Variante).
- Die öffentliche API bleibt **unverändert**: `istKatexGeladen`, `getKatex`, `ladeKatexAsync`, `renderLatexSync`, `normalisiereLatex`. `ladeKatex` lädt nur noch das KaTeX-JS lazy (CSS ist via static Import bereits da).

### 2. ExamLab-Renderer wird Re-Export-Shim

`ExamLab/src/utils/latexRenderer.ts` wird zu:
```ts
export * from '@shared/editor/utils/latexRenderer'
```
Damit bleiben die 3 ExamLab-Importeure (`FrageText`, `FormelFrageComponent`, `autoKorrektur`) **unverändert**. Muster konsistent mit bestehenden Shims (z.B. `KontenSelect`, `FormelEditor`).

### 3. sideEffects-Absicherung

`packages/shared/package.json` erhält:
```json
"sideEffects": ["**/*.css"]
```
Semantik: JS-Module sind side-effect-frei (tree-shakeable), CSS-Imports sind Side-Effects. Folge:
- **Planer** (nutzt latexRenderer nicht): Rollup erkennt latexRenderer-JS als ungenutzt → entfernt es **inkl.** seines `import 'katex.css'` → kein KaTeX im Planer-Bundle.
- **ExamLab** (nutzt latexRenderer): Renderer bleibt → `katex.css` wird **einmal** gebündelt (statt heute CDN + static doppelt).

`["**/*.css"]` statt `false`, weil shared echte CSS-Side-Effect-Imports tragen kann (defensiver als `false`; `false` würde behaupten, *gar nichts* habe Side-Effects).

### 4. Test-Migration

`ExamLab/src/utils/latexRenderer.test.ts` (testet `normalisiereLatex`, 8 Fälle) wird nach `packages/shared/src/editor/utils/latexRenderer.test.ts` verschoben (colocated zur echten Implementierung; konform zur Test-Layer-Strategie „testet @shared-Code → colocate in packages/shared").

**Definition of Done für diesen Schritt:** Die neue Datei `packages/shared/src/editor/utils/latexRenderer.test.ts` existiert und ist in der shared-vitest-Suite grün; die alte ExamLab-Datei ist gelöscht (kein Duplikat).

## Bundle-Verhalten & Verifikation (Pflicht, Beid-App)

Die Verifikation ist der Kern dieses Tasks — sie adressiert genau den Punkt, den #7 übersah. Builds **nach `/tmp`** (außerhalb des iCloud-synchronisierten Projektverzeichnisses, da dort dist-Altartefakte `rm` überleben und Messungen verfälschen).

1. **Planer KaTeX-frei (kritisch):** `vite build` Planer nach /tmp → `grep -c katex` im Bundle = **0**. Beweist: kein Leak.
2. **ExamLab katex.css einmal:** `vite build` ExamLab nach /tmp → genau ein `latexRenderer-*.css` mit KaTeX-`@font-face`; Formel-/katex-Chunks intakt; kein doppeltes Laden.
3. **vitest alle 3 Suites grün** (shared inkl. migriertem Test, ExamLab, Planer).
4. **Browser-Smoke ExamLab:**
   - Formel-**Anzeige**: SuS-/Übungs-Formelfrage → KaTeX-Glyphen korrekt (Wurzel/Bruch-Metrik).
   - Formel-**Editor**: LP `FormelEditor` → Live-Vorschau rendert korrekt (der Pfad, der bisher CDN nutzte → jetzt static, sollte gleich/besser sein).
   - Keine Console-Errors, kein fehlgeschlagener CDN-Request mehr.

## Risiken & Mitigation

| Risiko | Mitigation |
|---|---|
| **Planer-KaTeX-Leak (#7-Wiederholung)** | `sideEffects: ["**/*.css"]` ist der **load-bearing** Fix, **nicht** der Import-Graph allein: latexRenderer ist zwar nicht direkt im Barrel (`index.ts`), aber `FormelEditor` (und ~30 weitere Editor-Komponenten) **sind** im Barrel, und `FormelEditor` importiert latexRenderer transitiv — der Planer-`useToast`-Import zieht diese Kette also zur Modul-Auflösungszeit mit. Erst `sideEffects` erlaubt Rollup, die erreichbare-aber-ungenutzte Kette zu tree-shaken. **Das echte Gate ist der /tmp-Build-Grep (Verifikation Schritt 1), nicht der Import-Graph.** Falls der Grep doch KaTeX zeigt: den CSS-Import in ein explizit als side-effectful deklariertes Submodul isolieren bzw. die `sideEffects`-Glob justieren — **nicht** „aus Barrel entfernen" (würde die transitive Reach über `FormelEditor` nicht durchtrennen). |
| **Formel-Render-Regression** | vitest `latexRenderer.test.ts` + Browser-Smoke beider Formel-Pfade. |
| **CSP:** static CSS entfernt die CDN-Abhängigkeit | Eher Verbesserung (kein externes `style-src`/`font-src cdn.jsdelivr.net` mehr nötig). CSP-Allowlist nach Merge prüfen/verschlanken (Folge, nicht blockierend). |
| **iCloud-dist-Artefakte verfälschen Messung** | Alle Bundle-Messungen nach `/tmp` bauen. |

## Erwartetes Ergebnis

- Eine latexRenderer-Quelle, eine `katexModule`-Instanz, eine CSS-Lademethode (static).
- ExamLab: kein doppeltes KaTeX-Laden mehr; LP-FormelEditor profitiert von S140-Fix.
- Planer: unverändert KaTeX-frei (verifiziert, nicht angenommen).

## Implementierungs-Nachtrag (2026-05-29, nach Verifikation) — Ansatz A korrigiert

**Ansatz A (static `katex.css` IM shared latexRenderer, abgesichert per `sideEffects`) wurde während der Umsetzung empirisch WIDERLEGT.**

- Ein top-level `import 'katex/dist/katex.min.css'` im shared latexRenderer leakt die 59 KaTeX-Font-Assets in JEDE App, die den shared-Barrel importiert — auch den Planer (nur `useToast`). **Unabhängig von `sideEffects`:** sowohl `["**/*.css"]` als auch `false` getestet, beide leakten 59 Font-Dateien. Grund: Vites CSS-Asset-**Emit** läuft getrennt vom JS-Tree-Shaking — sobald das `katex.css` im Modulgraph verarbeitet wird, kopiert Vite die referenzierten Fonts ins dist, bevor/unabhängig davon, ob der Code später getreeshakt wird. `sideEffects` steuert nur das JS-Tree-Shaking, nicht den Asset-Emit.

- **Finale (umgesetzte) Lösung:** shared latexRenderer ist **rein-JS** (nur Render-Logik, KEIN CSS-Import). Das static `katex.css` (S140-korrekte Font-Metrik) wird **app-lokal in den ExamLab-Shims** geladen: `ExamLab/src/utils/latexRenderer.ts` (deckt FrageText/FormelFrage/autoKorrektur) + `ExamLab/src/components/lp/frageneditor/FormelEditor.tsx` (deckt LP-Editor). **Kein `sideEffects`-Feld nötig** — der Leak-Schutz kommt vollständig daraus, dass der shared Renderer rein-JS und damit tree-shakebar ist.

- **Verifiziert (/tmp-Builds + Browser-Smoke):** Planer 0 KaTeX-Assets · ExamLab 62 Fonts + katex.css (eigener lazy `katex-*.css`-Chunk, keine SuS-Erstladungs-Belastung) · KaTeX rendert visuell korrekt (`\frac{a}{b}+\sqrt{c}` → a/b+√c, Font-Metrik korrekt) · ExamLab ci-check alle Gates grün · Planer tsc/vitest/build grün.

**Lehre (ergänzt #7):** Ein shared-Modul im Barrel-erreichbaren Graph darf KEINEN top-level CSS-Import tragen, dessen Assets nur eine Teilmenge der Apps braucht — der Asset-Emit lässt sich nicht per `sideEffects` weg-tree-shaken. CSS-Imports gehören an die app-lokalen Konsum-Stellen, nicht in den geteilten Barrel.
