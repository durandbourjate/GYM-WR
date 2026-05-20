# UP-7 — vitest-Setup + Unit-Tests für den Unterrichtsplaner

**Datum:** 2026-05-20
**Status:** Design — zur Umsetzung freigegeben
**Bezug:** `HANDOFF.md` → Offene Punkte UP-7

## 1. Kontext & Motivation

Der Unterrichtsplaner hat aktuell **0 automatisierte Tests** und keine Test-Infrastruktur
in den Dependencies. Das Schwesterprojekt ExamLab im selben Monorepo hat ein
ausgereiftes vitest-Setup mit ~2000 Tests. Reine Logik-Utils des Planers
(Notenvorgaben-Tracking nach MiSDV, HK-Rotation, Farb-Ableitung) sind dadurch
ungeschützt gegen Regressionen.

UP-7 legt das Test-Fundament und deckt die drei im HANDOFF benannten Logik-Module ab.

## 2. Ziel & Scope

### In Scope
- vitest-Test-Infrastruktur im Planer, strukturell parallel zu ExamLab.
- Unit-Tests für drei Dateien (alle exportierten reinen Funktionen):
  - `src/data/categories.ts` → `generateColorVariants`
  - `src/utils/gradeRequirements.ts` → `getGymStufe`, `getGradeRequirements`,
    `getCourseGroups`, `countAssessments`, `checkGradeRequirements`
  - `src/utils/hkRotation.ts` → `getHKGroup`, `getHKSchedule`
- CI-Anbindung: `npm test` als Gate in `deploy.yml` (Production + Staging) **und**
  im `.githooks/pre-push`-Hook.
- Minimaler Bugfix in `generateColorVariants` (siehe §4.3).

### Nicht in Scope
- Coverage-Reporting (`vitest --coverage`).
- Tests für `autoSuggest.ts`, `solTotal.ts`, `colors.ts` — spätere Tasks.
- Komponenten-Tests (React). Das Setup ist dafür vorbereitet, liefert aber keine.

## 3. Entscheidungen (aus dem Brainstorming)

| # | Entscheidung | Begründung |
|---|---|---|
| D1 | Scope = die 3 benannten Dateien, **vollständig** (alle exportierten reinen Funktionen) | Klar abgegrenzt, deckt die nicht-triviale Logik (MiSDV-Regeln, Schuljahr-Mathematik, Alternation) ab |
| D2 | Test-Setup = **volle ExamLab-Parität** (jsdom + testing-library) | Konsistenz im Monorepo; sofort bereit für künftige Komponenten-Tests |
| D3 | CI-Gate = `deploy.yml` **und** `pre-push` | Ein Test, der nicht gated, veraltet; maximaler Regressionsschutz |
| D4 | `generateColorVariants`-Bug wird **in UP-7 mitgefixt** | Der Test deckt den Bug zwangsläufig auf; Fix ist 3 Zeilen in derselben Datei |

## 4. Architektur

### 4.1 Test-Infrastruktur

**`Unterrichtsplaner/package.json`:**
- Neue `devDependencies` (Versionen identisch zu ExamLab):
  `vitest@^4.1.2`, `jsdom@^29.0.1`, `@testing-library/react@^16.3.2`,
  `@testing-library/jest-dom@^6.9.1`. (`@vitejs/plugin-react` ist bereits vorhanden.)
- Neue `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`.

**Neue Datei `Unterrichtsplaner/vitest.config.ts`** — gespiegelt von ExamLab,
reduziert auf das, was der Planer braucht:
- Import: `import { defineConfig } from 'vitest/config'` — **nicht** aus `vite`.
  Nur `vitest/config` liefert den getypten `test`-Schlüssel; mit `vite`s
  `defineConfig` würde `tsc -b` an der Config fehlschlagen. Plus
  `import react from '@vitejs/plugin-react'`.
- Plugin `@vitejs/plugin-react`.
- `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'],
  include: ['src/**/*.test.{ts,tsx}'] }`.
- `resolve: { dedupe: ['react', 'react-dom', 'zustand'] }` — Parität zu ExamLab.
  Notwendig, weil npm-Workspaces alle Deps auf eine einzige Root-`node_modules`
  hoisten; `dedupe` sichert Single-Instance von React/zustand, sobald (künftig)
  Komponenten-Tests dazukommen.
- **Kein** `define`-Block — die Planer-`vite.config.ts` definiert keine Build-Globals.
- **Kein** `@shared`-Alias / kein `packages/shared`-Include — der Planer nutzt
  `@shared` nicht.

**Neue Datei `Unterrichtsplaner/src/test-setup.ts`:**
- `import '@testing-library/jest-dom'`.
- **Ohne** `fake-indexeddb` — der Planer nutzt localStorage, kein IndexedDB.

**`tsconfig.node.json`:** `vitest.config.ts` in `include` aufnehmen (analog
`vite.config.ts`). Die Typen für den `test`-Schlüssel kommen über den
`vitest/config`-Import selbst — kein zusätzlicher `types`-Eintrag nötig. Bei der
Umsetzung `tsc -b` explizit gegen die neue Config verifizieren, bevor „clean"
angenommen wird.

**Konvention:** Testdateien importieren `describe/it/expect` explizit aus `vitest`
(ExamLab-Konvention). Dadurch ist trotz `globals: true` **keine** Änderung an
`tsconfig.app.json` (`types`) nötig — `tsc -b` bleibt ohne Zusatz-Typen grün.

### 4.2 Testdateien (colocated, ExamLab-Konvention)

Jede Testdatei liegt direkt neben ihrer Quelldatei.

**`src/data/categories.test.ts` — `generateColorVariants(hex)`**
- Deterministische Hex-Mathematik: bekannte Eingabe → exakt erwartete `bg`/`fg`/`border`.
- Dunkle Farbe `#000000` → `bg #e6e6e6`, `fg #000000`, `border #4c4c4c`.
- Satte Farben mit 255-Kanal (`#ff0000`, `#ffffff`) → `bg`-Kanäle auf 255 geclampt,
  Ergebnis ist gültiger 7-stelliger Hex (verifiziert den Fix aus §4.3).
- Einstellige Hex-Kanäle werden korrekt auf 2 Stellen gepolstert (`padStart`).

**`src/utils/gradeRequirements.test.ts`**
- `getGymStufe`: Klassennamen-Parsing — `'29c'`→GYM1, `'28bc29fs'`→GYM2
  (erstes 2-stelliges Match), `'27a28f'`→GYM3, GYM4, GYM5 (TaF, diff −1),
  kein Match→`UNKNOWN`, `maturaYear`-Override.
- `getGradeRequirements`: GYM1 liefert 3 Vorgaben, GYM2–5 liefert 2;
  `weeklyLessons > 3` hebt das Jahreszeugnis-Minimum von 3 auf 4.
- `getCourseGroups`: Gruppierung nach `cls`+`typ`, `weeklyLessons` = Summe `les`,
  `kursIds`-Deduplizierung.
- `countAssessments`: zählt `blockCategory === 'ASSESSMENT'` und Fallback
  `lesson.type === 4`; Semesterfilter (1 / 2 / year) über `s2StartIndex`;
  Lektionen ohne `title` werden ignoriert.
- `checkGradeRequirements`: Status `ok` / `warning` (count = min−1) / `critical`;
  Sortierung critical→warning→ok; Custom-`AssessmentRule[]` überschreiben Defaults;
  `UNKNOWN`-Gruppen werden übersprungen.

**`src/utils/hkRotation.test.ts`**
- `getHKGroup`: A/B-Alternation nach Anzahl Teaching-Weeks; `overrides[key]` hat
  Vorrang; `startGroup` `'A'`/`'B'` kehrt das Muster um; Ferien-/Event-Wochen
  (`type` 5/6) zählen nicht; unbekannte Woche → `startGroup`.
- `getHKSchedule`: ein Eintrag pro Woche in `WEEK_ORDER`, `isOverride`-Flag korrekt.

**Fixtures:** Funktionen, die typisierte Strukturen entgegennehmen (`Week[]`,
`LessonDetail`, `Course[]`, `AssessmentRule[]`), erhalten minimale Inline-Fixtures.
`getHKGroup`/`getHKSchedule` laufen gegen das echte statische `WEEKS`-Datenmodul
(`src/data/weeks.ts`) — Tests wählen bekannte Wochen.

### 4.3 Mini-Fix `generateColorVariants` (D4)

**Bug:** `bg` wird als `Math.round(kanal * 0.1 + 230)` berechnet — ohne Clamp.
Bei einem Farbkanal = 255 ergibt das 256; `(256).toString(16)` = `"100"`, was
`padStart(2, '0')` nicht kürzt → ein ungültiger 9-stelliger Hex-String
(`generateColorVariants('#ff0000')` → `bg: "#100e6e6"`). Betroffen sind alle
satten Farben mit einem 255-Kanal (reines Rot/Grün/Blau/Gelb/Cyan/Magenta/Weiss).
Der Browser verwirft die ungültige Farbe → der Hintergrund fehlt.

**Fix:** Den bestehenden `Math.round(kanal * 0.1 + 230)`-Ausdruck für
`bgR`/`bgG`/`bgB` in `Math.min(255, …)` wrappen. `border` nutzt denselben
Clamp-Mechanismus (`Math.min(255, …)`), aber mit anderen Koeffizienten — übernommen
wird nur das Clamp-Pattern, nicht die Formel. `fg` braucht keinen Clamp
(Maximalwert ≈ 153).

### 4.4 CI-Anbindung (D3)

**`.github/workflows/deploy.yml`:**
- Production-Block: neuer Step `Run vitest (Planer)` nach den bestehenden
  Planer-Lint-Steps, `working-directory: Unterrichtsplaner`, `run: npm test`.
- Staging-Block: neuer Step `Run vitest (Planer, staging)` nach den
  Staging-Audit-Steps (analog zur Platzierung im Production-Block),
  `working-directory: preview-src/Unterrichtsplaner`,
  `if: steps.checkout-preview.outcome == 'success'`.

**`.githooks/pre-push`:**
- Neuer Schritt nach dem `packages/shared`-Lock-Sync-Check und **vor** der
  ExamLab-`ci-check` (billigerer Check zuerst → fail-fast):
  `cd "$REPO_ROOT/Unterrichtsplaner" && npm test`, im Stil der bestehenden
  Schritte (`if ! …; then echo …; exit 1; fi`).

## 5. Verifikation

Abnahmekriterien:
- `cd Unterrichtsplaner && npm test` läuft grün; alle Verhaltensbereiche aus §4.2
  sind abgedeckt.
- `cd Unterrichtsplaner && npx tsc -b` ist clean (inkl. der neuen Test- und
  Config-Dateien).
- `cd Unterrichtsplaner && npm run build` läuft durch.
- `pre-push`-Hook lokal verifiziert: schlägt bei rotem Test fehl, lässt grünen Test
  durch.
- `deploy.yml`-CI grün auf `preview` und `main`.

## 6. Risiken & offene Punkte

- **Verhaltensänderung durch den Fix:** Der Clamp ändert die `bg`-Ausgabe von
  `generateColorVariants` für satte Farben. Das ist beabsichtigt (bisher ungültig).
  Bestehende Planer mit benutzerdefinierten Fachbereich-Farben sollten visuell
  kurz gegengeprüft werden — Standard-`WR_CATEGORIES` sind nicht betroffen (sie
  durchlaufen `generateColorVariants` nicht, ihre Varianten sind hartkodiert).
- **`pre-push`-Laufzeit:** Der Hook wird etwas länger; bewusst nur `npm test`
  (kein voller Planer-Build), da der Build bereits über `deploy.yml` abgedeckt ist.
- **Monorepo-Lockfile:** Neue devDependencies erfordern einen Root-`npm install`;
  das Root-`package-lock.json` muss mitcommittet werden.
