# Bundle S.a — Renderer-Splits Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mechanische Strategy-Extraktion von 2 Renderer-Files (`KorrekturFrageVollansicht.tsx` + `DruckAnsicht.tsx`) in Folder-Pattern (`<File>/index.tsx` als Dispatcher + Sub-Dateien pro Strategy), ohne Verhaltensänderung.

**Architecture:** Folder-Pattern aus Master-Spec Sektion 4: jede Datei wird zu einem Folder mit `index.<ext>` als Dispatcher. Caller-Imports byte-identisch, weil Node/Vite-Folder-Resolution `<X>/index.tsx` auflöst, wenn `<X>.tsx` fehlt. Cutover-Strategie: zuerst Folder mit allen Sub-Dateien anlegen (während alte Datei noch existiert und die Resolution gewinnt), dann in einem zweiten Commit alte Datei löschen — verhindert Vite-Resolution-Race.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4, vitest 3, ESLint 9.

**Bezug:**
- Master-Spec: [`docs/superpowers/specs/2026-05-06-bundle-s-niedrig-risiko-datei-splits-design.md`](../specs/2026-05-06-bundle-s-niedrig-risiko-datei-splits-design.md)
- Audit: [`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md) (Branch `audit/examlab-vereinfachung`)

**Vitest-Baseline (Stand 2026-05-06 vor S.a-Start):** 161 Test Files, 1253 Tests passed, 4 todo, 1 skipped (1257 total). Erwartung: nach S.a unverändert.

---

## Phase 0 — Branch-Setup & Audit

### Task 0.1: Branch erstellen

**Files:** keine

- [ ] **Step 1: Auf Master-Spec-Branch wechseln und neuen Branch ableiten**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout refactor/bundle-s-master-spec
git checkout -b refactor/bundle-s-a-renderer-splits
git branch --show-current
```

Expected: `refactor/bundle-s-a-renderer-splits`. (Kein `pull` nötig — Master-Spec-Branch wurde gerade aus main abgeleitet und enthält nur Spec+Plan, keine offenen Remote-Änderungen.)

- [ ] **Step 2: Remote-Push (für spätere PR + Subagent-Sichtbarkeit)**

```bash
git push -u origin refactor/bundle-s-a-renderer-splits
```

Expected: Branch wird auf GitHub angelegt.

### Task 0.2: Baseline-Verifikation

**Files:** keine (read-only)

- [ ] **Step 1: Vitest-Baseline bestätigen**

```bash
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
```

Expected: `Test Files  161 passed | 1 skipped (162)` und `Tests  1253 passed | 4 todo (1257)`. Falls Drift: aktuellen Count notieren als neue Baseline für Phase-Verifikation.

- [ ] **Step 2: tsc-Baseline**

```bash
cd ExamLab && npx tsc -b --noEmit
```

Expected: Exit 0, keine Output-Lines (per Memory `feedback_tsc_b_exit_misleading.md` zusätzlich Output-Inspektion: keine TS-Errors).

- [ ] **Step 3: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```

Expected: Exit 0 für alle drei.

- [ ] **Step 4: Build-Baseline**

```bash
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: `✓ built in …`. Keine Errors.

### Task 0.3: Closure-Audit für KorrekturFrageVollansicht.tsx

**Files:** Read-only Analyse von `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1: Imports inspizieren**

```bash
sed -n '1,30p' ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx
```

Notieren: welche Types/Helper sind aus `@shared` vs lokal, welche werden in mehreren Anzeigen genutzt.

- [ ] **Step 2: Free-Identifier-Scan pro Anzeige-Funktion**

```bash
grep -n "^function .*Anzeige\|^function MusterloesungBox\|^function AutoKorrekturDetails\|^function frageHaupttext\|^function KeineAntwort" ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx
```

Für jede Anzeige-Funktion mental prüfen: ruft sie Top-Level-Helper auf? Verwendet sie äusseres `const`/`function` ausserhalb ihrer Body? Falls ja → Helper muss in `util.ts` oder mitgenommen werden.

- [ ] **Step 3: Trivial-Konsolidations-Check (Reviewer-Rec #4)**

```bash
awk '/^function .*Anzeige/{name=$2; start=NR} /^}$/{if(start){print NR-start " " name; start=0}}' ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx
```

Expected: Liste mit Zeilen-Längen pro Anzeige. Funktionen <20 Zeilen sind Konsolidations-Kandidaten. **Entscheidung:** dokumentieren in `_notes.md` oder als Kommentar im PR. Default: alle Anzeigen bleiben separat (Pattern-Konsistenz wichtiger als <20-Z-Regel). Konsolidieren nur, wenn 2+ Anzeigen exakt strukturgleich sind und sich Logik teilen.

- [ ] **Step 4: Audit-Ergebnis als un-committete Notiz festhalten** (für Subagent-Handoff in Phase 1.1)

```bash
cat > /tmp/bundle-s-a-audit-korrektur.md <<'EOF'
# KorrekturFrageVollansicht — Audit-Notizen

## Helper-Verteilung
- Top-Level (in util.ts): frageHaupttext (Z. 32-46), KeineAntwort (Z. 603-610)
- Pro Anzeige private: <hier ergaenzen>

## Free-Identifier-Findings pro Anzeige
- MCAnzeige: nutzt frageHaupttext? <ja/nein> — andere extern? <auflisten>
- ... pro Funktion eine Zeile

## Trivial-Konsolidations-Entscheidung
- <Default: alle bleiben separat. Falls 2+ exakt strukturgleich: hier dokumentieren>

## Geteilte Imports (mehrfach genutzt)
- z.B. KaTeX, Markdown-Renderer
EOF
```

Datei NICHT committen (`/tmp` ist git-ignored). Folge-Subagent liest sie in Phase 1.1.

### Task 0.4: Closure-Audit für DruckAnsicht.tsx

**Files:** Read-only Analyse von `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx`

- [ ] **Step 1: Imports + Top-Level-Konstanten**

```bash
sed -n '1,30p' ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx
grep -n "^const " ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx | head -10
```

Insbesondere prüfen: `BUCHSTABEN`-Konstante, `PDFHinweis`/`DigitalHinweis`/`ZeichenDruck`/`CodeDruck`/`FormelDruck` als Stub-Komponenten.

- [ ] **Step 2: Reviewer-Rec #2 — `util.ts` vs `hinweise.tsx` Entscheidung**

Im neuen Folder `DruckAnsicht/`:
- `util.ts` enthält **nur** pure Konstanten/Helper: `BUCHSTABEN` und ggf. weitere Funktionen.
- `hinweise.tsx` enthält die 5 Stub-Komponenten: `PDFHinweis`, `DigitalHinweis`, `ZeichenDruck`, `CodeDruck`, `FormelDruck`.

Begründung: `util.ts` ohne JSX bleibt clean (keine `.tsx`-Extension nötig); Stub-Komponenten sind UI und gehören in eine `.tsx`-Datei.

- [ ] **Step 3: Free-Identifier-Scan für `<Fragetyp>Druck`-Funktionen**

```bash
grep -n "^function .*Druck\b" ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx
```

Dependency: nutzt jede Druck-Funktion `BUCHSTABEN`? Gemeinsame Helper? Mental-Modell aufbauen.

- [ ] **Step 4: Audit-Ergebnis analog Task 0.3 Step 4** in `/tmp/bundle-s-a-audit-druck.md` festhalten (gleiche Struktur).

---

## Phase 1 — KorrekturFrageVollansicht-Extraktion

### Task 1.1: Folder-Skeleton anlegen (alle 21 Sub-Dateien, alte Datei bleibt)

**Files:**
- Create folder: `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/`
- Create files:
  - `index.tsx`
  - `util.ts`
  - `AutoKorrekturDetails.tsx`
  - `MusterloesungBox.tsx`
  - `MCAnzeige.tsx`
  - `RFAnzeige.tsx`
  - `FreitextAnzeige.tsx`
  - `BerechnungAnzeige.tsx`
  - `LueckentextAnzeige.tsx`
  - `ZuordnungAnzeige.tsx`
  - `BuchungssatzAnzeige.tsx`
  - `TKontoAnzeige.tsx`
  - `KontenbestimmungAnzeige.tsx`
  - `BilanzERAnzeige.tsx`
  - `FormelAnzeige.tsx`
  - `VisualisierungAnzeige.tsx`
  - `PDFAnnotationAnzeige.tsx`
  - `AudioAnzeige.tsx`
  - `CodeAnzeige.tsx`
  - `SortierungAnzeige.tsx`
  - `HotspotAnzeige.tsx`
  - `BildbeschriftungAnzeige.tsx`
  - `DragDropBildAnzeige.tsx`
- Old file unchanged: `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` (846 Z., bleibt!)

- [ ] **Step 1: Original-Datei für Referenz öffnen** (alle 846 Zeilen verfügbar haben)

- [ ] **Step 2: `util.ts` erstellen** — `frageHaupttext` (Z. 32-46) + `KeineAntwort` (Z. 603-610) verschieben (kopieren). Imports: nur was diese Helper brauchen (z.B. `Frage` aus `@shared/types/fragen-core`).

- [ ] **Step 3: Pro `<Fragetyp>Anzeige`-Funktion eine eigene Datei** erstellen:
  - Funktions-Code 1:1 aus Original kopieren — keine Logik-Änderung, keine Body-Anpassung.
  - **Imports explizit machen, was vorher implizit File-Scope war:**
    - Wenn die Funktion `frageHaupttext` aufruft → `import { frageHaupttext } from './util'` oben in der neuen Datei.
    - Wenn die Funktion `KeineAntwort` aufruft → `import { KeineAntwort } from './util'`.
    - Andere lokale Helper aus dem Original (falls in Audit gefunden) ebenso aus `./<Helper>` importieren.
    - Types aus `@shared/...` direkt importieren.
    - Externe Libs (KaTeX-Renderer, Markdown etc.) wie im Original importieren.
  - Default-Export: die Funktion. Beispiel `MCAnzeige.tsx`:
    ```tsx
    import type { MCFrage } from '@shared/types/fragen-core'
    import type { Antwort } from '@shared/types/durchfuehrung'

    export default function MCAnzeige({ frage, antwort }: { frage: MCFrage; antwort: Extract<Antwort, { typ: 'mc' }> | undefined }) {
      // ... unveränderter Body aus Z. 48-74
    }
    ```

- [ ] **Step 4: `MusterloesungBox.tsx` und `AutoKorrekturDetails.tsx`** analog (heaviest sub-comp ~118 Z., das volle Konstrukt mitnehmen).

- [ ] **Step 5: `index.tsx` schreiben** als Dispatcher. Skelett:

```tsx
import { useState } from 'react'  // falls noetig
import type { Frage } from '@shared/types/fragen-core'
import type { Antwort, KorrekturErgebnis } from '@shared/types/durchfuehrung'
import { frageHaupttext, KeineAntwort } from './util'
import MCAnzeige from './MCAnzeige'
import RFAnzeige from './RFAnzeige'
// ... alle 19 Anzeige-Imports
import AutoKorrekturDetails from './AutoKorrekturDetails'
import MusterloesungBox from './MusterloesungBox'

interface Props {
  // *** Props-Interface 1:1 aus Original-Datei kopieren — KEIN Inferieren neuer Props.
  //     Original hat Default-Export-Funktion `KorrekturFrageVollansicht({...}: Props)` ab Z. 760.
  //     Den exakten Props-Block aus Original übernehmen. ***
}

export default function KorrekturFrageVollansicht({ frage, antwort, autoErgebnis, ... }: Props) {
  // Body aus Original Z. 760-846 unverändert,
  // mit dem Unterschied dass dort wo z.B. <MCAnzeige .../> steht, der Import jetzt von './MCAnzeige' kommt.
  // (Im Original waren das alles lokale Top-Level-Funktionen, jetzt importierte Modules — Aufrufstellen unverändert.)
}
```

- [ ] **Step 6: tsc + build verifizieren** (alte Datei gewinnt Resolution, also testet das nur die neuen Dateien on-disk):

```bash
cd ExamLab && npx tsc -b --noEmit
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: 0 errors. Falls TS-Errors in den neuen Dateien: fixen, bevor Commit.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/
git status   # sicherstellen: NUR neue Dateien, alte unverändert
git commit -m "Bundle S.a Phase 1.1: KorrekturFrageVollansicht/ Folder-Skeleton mit 21 Sub-Dateien"
```

### Task 1.2: Cutover — alte Datei löschen, neue Folder aktivieren

**Files:**
- Delete: `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1: Alte Datei löschen**

```bash
git rm ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx
```

- [ ] **Step 2: tsc verifizieren**

```bash
cd ExamLab && npx tsc -b --noEmit
```

Expected: 0 errors. Vite-Resolution geht jetzt auf `KorrekturFrageVollansicht/index.tsx`.

- [ ] **Step 3: Build verifizieren**

```bash
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: `✓ built in …`.

- [ ] **Step 4: Vitest verifizieren**

```bash
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
```

Expected: **exakt** gleicher Count wie Baseline (1253 passed | 4 todo | 1 skipped). **Falls Drift (auch nur ±1 Test):** STOP. Mechanische Refactors haben 0 Drift-Toleranz. Hotfix auf S.a-Branch (kein Self-Approve), Ursache analysieren, dann erneut. Bei Unklarheit User eskalieren.

- [ ] **Step 5: Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```

Expected: Exit 0 für alle drei.

- [ ] **Step 6: Commit**

```bash
git commit -m "Bundle S.a Phase 1.2: Cutover — alte KorrekturFrageVollansicht.tsx geloescht, Folder aktiv"
```

### Task 1.3: Browser-E2E-Spot-Check Korrektur-Pfad

**Files:** keine (Browser-Test)

- [ ] **Step 1: Service-Worker-Cache zurücksetzen** (per `feedback_service_worker_cache_wire_bundle.md`):
  In Chrome DevTools auf staging URL: Application Tab → Service Workers → `Unregister`, Storage → `Clear site data`, dann Reload.

- [ ] **Step 2: Mit echtem LP-Login einloggen** (per `feedback_echte_logins.md` — kein Demo-Modus).

- [ ] **Step 3: Korrektur-View aufrufen**, eine bestehende Prüfung mit erledigten SuS-Abgaben öffnen.

- [ ] **Step 4: 1× MC-Frage-Korrektur prüfen**: KorrekturFrageVollansicht rendert; SuS-Antwort + korrekte Antwort sichtbar; Punkte-Anzeige stimmt.

- [ ] **Step 5: 1× komplexer Fragetyp** (BilanzER ODER Hotspot ODER DragDropBild): Vollansicht rendert ohne Console-Errors; MusterloesungBox öffnet beim Klick und zeigt korrekte Lösung.

- [ ] **Step 6: AutoKorrekturDetails-Komponente** prüfen (z.B. bei Buchungssatz oder TKonto): Ergebnis-Detail-Box rendert ohne Fehler.

- [ ] **Step 7: Browser-Console** auf Errors/Warnings checken. Erwartung: keine neuen Errors.

- [ ] **Step 8: Falls Issue gefunden** — als Hotfix-Commit auf S.a-Branch pushen, NICHT auf main.

---

## Phase 2 — DruckAnsicht-Extraktion

### Task 2.1: Folder-Skeleton anlegen (alle Sub-Dateien)

**Files:**
- Create folder: `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht/`
- Create files:
  - `index.tsx`
  - `util.ts` (Konstanten: `BUCHSTABEN`)
  - `hinweise.tsx` (5 Stubs: `PDFHinweis`, `DigitalHinweis`, `ZeichenDruck`, `CodeDruck`, `FormelDruck`)
  - `MCDruck.tsx`
  - `RichtigFalschDruck.tsx`
  - `FreitextDruck.tsx`
  - `LueckentextDruck.tsx`
  - `ZuordnungDruck.tsx`
  - `BerechnungDruck.tsx`
  - `BuchungssatzDruck.tsx`
  - `TKontoDruck.tsx`
  - `KontenbestimmungDruck.tsx`
  - `BilanzDruck.tsx`
  - `AufgabengruppeDruck.tsx` (inkl. `TeilaufgabeInhalt` als private Helper)
  - `SortierungDruck.tsx`
  - `HotspotDruck.tsx`
  - `BildbeschriftungDruck.tsx`
  - `DragDropBildDruck.tsx`
- Old file unchanged: `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` (810 Z., bleibt!)

- [ ] **Step 1: Original-Datei für Referenz öffnen** (alle 810 Zeilen).

- [ ] **Step 2: `util.ts` erstellen** — nur pure Konstanten, primär `BUCHSTABEN`:

```ts
export const BUCHSTABEN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
```

- [ ] **Step 3: `hinweise.tsx` erstellen** — alle 5 Stub-Hinweis-Komponenten 1:1 kopieren (Funktions-Bodies aus Original).

- [ ] **Step 4: Pro `<Fragetyp>Druck`-Funktion eigene Datei**, default-export, Imports nur was nötig (`BUCHSTABEN` aus `./util`, Types aus `@shared/...`).

- [ ] **Step 5: `AufgabengruppeDruck.tsx`** speziell — `TeilaufgabeInhalt` (Z. 564+) als private Funktion in derselben Datei, NICHT exportiert.

- [ ] **Step 6: `index.tsx` schreiben** — Main-Komponente + `DruckFrage` + `DruckAnhaenge` + `FrageInhalt`-Dispatcher (alle aus Original-Datei Z. 27-256). Imports der 16 Druck-Komponenten + Hinweis-Komponenten + util.

- [ ] **Step 7: tsc + build verifizieren**

```bash
cd ExamLab && npx tsc -b --noEmit
cd ExamLab && npm run build 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht/
git status
git commit -m "Bundle S.a Phase 2.1: DruckAnsicht/ Folder-Skeleton mit 18 Sub-Dateien (16 Druck + util + hinweise)"
```

### Task 2.2: Cutover — alte Datei löschen

**Files:**
- Delete: `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx`

- [ ] **Step 1: Datei löschen**

```bash
git rm ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx
```

- [ ] **Step 2: tsc + build + vitest + lint verifizieren** (gleicher Block wie Task 1.2):

```bash
cd ExamLab && npx tsc -b --noEmit
cd ExamLab && npm run build 2>&1 | tail -5
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```

Expected: alle exit 0, vitest **exakt** 1253 passed | 4 todo | 1 skipped. **Drift-Toleranz: 0** (siehe Task 1.2 Step 4) — bei Drift STOP + Hotfix, kein Self-Approve.

- [ ] **Step 3: Commit**

```bash
git commit -m "Bundle S.a Phase 2.2: Cutover — alte DruckAnsicht.tsx geloescht, Folder aktiv"
```

### Task 2.3: Browser-E2E-Spot-Check Druck-Pfad

**Files:** keine (Browser-Test)

- [ ] **Step 1: Service-Worker-Cache zurücksetzen + LP-Login** (siehe Task 1.3).

- [ ] **Step 2: LP → Vorbereitung → eine Multi-Fragetyp-Prüfung öffnen**.

- [ ] **Step 3: Drucken-Dialog öffnen** (Druck-Vorschau).

- [ ] **Step 4: Stichprobe mind. 4 Fragetypen** im PDF/Vorschau prüfen:
  - 1× MC: Antwort-Optionen mit BUCHSTABEN A-D, korrekte Formatierung
  - 1× RichtigFalsch: Aussagen-Liste rendert
  - 1× Berechnung: Formel + Einheit sichtbar
  - 1× Aufgabengruppe (heaviest): Sub-Aufgaben mit Punkten + Inhalt rendern

- [ ] **Step 5: Falls möglich** — alle 19 Fragetypen in einer Test-Prüfung haben und visuell durchscrollen.

- [ ] **Step 6: PDF-Output** (falls drucken auf PDF möglich) öffnen und visuell mit altem Stand vergleichen — kein Layout-Shift erwartet.

- [ ] **Step 7: Browser-Console-Check**.

- [ ] **Step 8: Falls Issue** — Hotfix auf S.a-Branch.

---

## Phase 3 — Bundle-Finalize

### Task 3.1: Final-Verifikation

**Files:** keine (alle Gates)

- [ ] **Step 1: Komplettes lokales Gate-Set**

```bash
cd ExamLab && npx tsc -b --noEmit
cd ExamLab && npm run build 2>&1 | tail -5
cd ExamLab && npx vitest run --reporter=default 2>&1 | tail -5
cd ExamLab && npm run lint:as-any
cd ExamLab && npm run lint:no-alert
cd ExamLab && npm run lint:no-tests-dir
cd ExamLab && npm run lint
```

Expected: alle exit 0; vitest 1253 passed | 4 todo (1257).

- [ ] **Step 2: Hotspot-Bilanz verifizieren**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
find ExamLab/src packages/shared/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1>=500 {print}' | sort -rn
```

Expected: `KorrekturFrageVollansicht.tsx` und `DruckAnsicht.tsx` aus der Liste verschwunden.

- [ ] **Step 3: Caller-Imports byte-identisch**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git log --oneline main..HEAD -- '*.ts' '*.tsx' | head -20
git diff main..HEAD -- '*.ts' '*.tsx' | grep -E "^[+-].*import.*KorrekturFrageVollansicht|^[+-].*import.*DruckAnsicht" | head -20
```

Expected: keine Diff-Lines mit `import.*KorrekturFrageVollansicht` oder `import.*DruckAnsicht` (Caller unverändert).

### Task 3.2: HANDOFF.md aktualisieren

**Files:** Modify: `HANDOFF.md` (im Repo-Root)

- [ ] **Step 1: HANDOFF.md aktuelle Sektion lesen**

```bash
sed -n '1,40p' HANDOFF.md
```

- [ ] **Step 2: Neuen Eintrag** für Bundle S.a Merge oben einfügen (nach Pattern voriger Bundles, z.B. Bundle R-Eintrag als Vorlage):

```markdown
## Bundle S.a — Renderer-Splits (S+1, 2026-05-06)

**Status:** Merged auf main, Commit `<hash>`.

**Was:** KorrekturFrageVollansicht.tsx (846 Z.) und DruckAnsicht.tsx (810 Z.) per Folder-Pattern in 39 Sub-Dateien zerlegt. Caller-Imports unverändert. Hotspot-Bilanz 17 → 15.

**Wie:** Folder mit `index.tsx` als Dispatcher; je Strategy eine Sub-Datei. Cutover-Strategie: erst Folder anlegen (während alte Datei noch wins), dann alte Datei löschen.

**Verifikation:** vitest 1253 (unverändert), tsc/build/lint clean. Browser-E2E LP-Korrektur + LP-Druck mit echten Logins ✅.

**Branch:** `refactor/bundle-s-a-renderer-splits` (gelöscht nach Merge).

**Lehren:** [falls Lehren während Implementation entstanden, hier listen]
```

- [ ] **Step 3: Stale Sektionen entfernen** (falls Bundle-3, Bundle-Q etc. noch oben stehen): nach unten ins „Erledigt"-Archiv schieben oder löschen.

- [ ] **Step 4: Commit**

```bash
git add HANDOFF.md
git commit -m "Bundle S.a Phase 3.2: HANDOFF.md mit Bundle-S.a-Eintrag"
```

### Task 3.3: PR auf main + Merge

**Files:** keine (GitHub-Operation)

- [ ] **Step 1: Push** (falls neue Commits seit Task 0.1):

```bash
git push origin refactor/bundle-s-a-renderer-splits
```

- [ ] **Step 2: Pages-Deploy-Vorbedingung prüfen** — User-Aufgabe: in GitHub Actions UI bestätigen, dass main einen aktuellen grünen Pages-Deploy hat. Falls letzter Run cancelled/failed: per Hand re-run und auf grün warten, BEVOR S.a gemerged wird.

- [ ] **Step 3: PR erstellen** (User entscheidet ob via gh CLI lokal oder GitHub-UI):

```bash
# Optional, falls gh-Auth vorhanden:
gh pr create --base main --head refactor/bundle-s-a-renderer-splits \
  --title "Bundle S.a: Renderer-Splits (KorrekturFrageVollansicht + DruckAnsicht)" \
  --body "$(cat <<'EOF'
## Summary

- KorrekturFrageVollansicht.tsx (846 Z.) → Folder mit 21 Sub-Dateien
- DruckAnsicht.tsx (810 Z.) → Folder mit 18 Sub-Dateien (16 Druck + util + hinweise)
- Caller-Imports byte-identisch (Folder-Resolution)
- Hotspot-Bilanz: Files >500 Z. **17 → 15**
- Phase 2 Cleanup-Audit-Roadmap fortgesetzt (Bundle S.b/S.c folgen)

## Verification

- vitest 1253 passed (unverändert)
- tsc/build/lint:as-any/lint:no-alert/lint:no-tests-dir clean
- Browser-E2E mit echten LP-Logins:
  - Korrektur-View MC + komplexer Fragetyp ✓
  - Druck-Vorschau Stichprobe MC/RichtigFalsch/Berechnung/Aufgabengruppe ✓

## Test plan

- [x] vitest grün
- [x] LP-Korrektur Browser-E2E
- [x] LP-Druck Browser-E2E
EOF
)"
```

- [ ] **Step 4: Code-Reviewer-Subagent dispatchen** vor Merge (siehe Subagent-Driven-Development-Skill für Reviewer-Pattern).

- [ ] **Step 5: Merge** auf main (User-Aktion). **Regulärer Merge-Commit (kein Squash)** — Pattern wie Bundle Q/R/N/M. Subject: `Merge Bundle S.a: Renderer-Splits (KorrekturFrageVollansicht + DruckAnsicht)`.

- [ ] **Step 6: Branch lokal+remote löschen** nach 1 Woche Beobachtung (per Memory `project_bundle_l_c_komplett.md` Pattern).

### Task 3.4: Memory-Eintrag schreiben

**Files:** Create: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_s_a_renderer_splits.md`

- [ ] **Step 1: Memory-File schreiben**

Vorlage:

```markdown
---
name: Bundle S.a Renderer-Splits auf main (2026-05-06)
description: KorrekturFrageVollansicht (846 Z.) und DruckAnsicht (810 Z.) per Folder-Pattern in 39 Sub-Dateien zerlegt. Phase-2-Cleanup fortgesetzt.
type: project
---

**Merge:** YYYY-MM-DD `<commit-hash>` auf main.

**Was:** Erstes Sub-Bundle aus Bundle S (Niedrig-Risiko-Datei-Splits). 2 Renderer-Files mechanisch nach `<File>/index.tsx + Strategy-Sub-Dateien`-Pattern zerlegt. Caller-Imports unverändert.

**Wie:** Cutover-Strategie: erst Folder mit allen Sub-Dateien anlegen (alte Datei gewinnt Resolution), dann alte Datei löschen (Folder gewinnt). Vermeidet Vite-Resolution-Race.

**Verifikation:** vitest 1253 passed (unverändert), tsc/build/lint clean. Browser-E2E mit echten LP-Logins für Korrektur-View + Druck-Vorschau ✅.

**Lehren:** [falls neue Lehren — z.B. unerwartete Closure-Capture, Vite-HMR-Verhalten beim Folder-Restructure].

**Folge:** Bundle S.b (VorschauTab) und S.c (poolConverter + fibuAutoKorrektur) als separate Sessions.
```

- [ ] **Step 2: MEMORY.md Index-Eintrag** ergänzen (eine Zeile unter ~150 Zeichen) — als oberster Eintrag der Bundle-Liste.

---

## Acceptance Criteria

- [ ] `KorrekturFrageVollansicht/` Folder existiert, alte Datei gelöscht
- [ ] `DruckAnsicht/` Folder existiert, alte Datei gelöscht
- [ ] Caller-Imports unverändert (`git diff main..HEAD` zeigt 0 Caller-Änderungen)
- [ ] Hotspot-Bilanz Files >500 Z.: **17 → 15**
- [ ] vitest **1253 passed | 4 todo** (oder aktuelle Baseline)
- [ ] tsc/build/lint:as-any/lint:no-alert/lint:no-tests-dir clean
- [ ] Browser-E2E LP-Korrektur ✓ und LP-Druck ✓ mit echten Logins
- [ ] Pages-Deploy nach Merge grün in GH Actions UI
- [ ] HANDOFF.md aktualisiert
- [ ] Memory-Eintrag geschrieben + MEMORY.md Index-Zeile ergänzt

---

## Risks Reminder (aus Spec Sektion 8)

- **Closure-Capture** in Sub-Komponenten: Free-Identifier-Scan in Audit-Phase 0.3/0.4 mitigiert.
- **Default-Export-Drift**: tsc/build verifiziert in Task 1.1 + 2.1 (Folder ist auf disk, aber inaktiv) und Task 1.2 + 2.2 (Folder aktiv).
- **Vite-Folder-Resolution-Race** (Reviewer-Rec #5): Cutover-Strategie (alte Datei bleibt, bis Folder vollständig ist; dann atomare Löschung) verhindert transientes Doppel-Aktiv-Stadium.
- **Pages-Deploy-Stau**: Task 3.3 Step 2 prüft Vorbedingung. S.b/S.c warten bis S.a sauber gemerged ist.
