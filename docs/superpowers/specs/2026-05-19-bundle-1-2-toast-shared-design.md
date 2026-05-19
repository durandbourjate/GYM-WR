# Bundle 1+2 — Toast nach packages/shared + Lint-Gates für Planer

**Datum:** 2026-05-19
**Status:** Spec, ready for review
**Treiber:** UP-5 (Toast-Harmonisierung) + UP-6 (`packages/shared` als Planer-Dependency aktivieren), Vorbereitung Backend-Migration ab Aug 2026.

## Motivation

Der Unterrichtsplaner hat 54 `alert()`-Aufrufe (UX-blockierend, unprofessionell) und 80 `any`-Token (51 `as any` + 29 `: any` + 0 `= any`) ohne CI-Gate. Das ExamLab-Skript `audit-as-any.sh` erfasst alle drei Token zusammen — die im Plan zu migrierende Stellenzahl ist 80, nicht 51. ExamLab hat beide Probleme bereits gelöst (Bundle L: as-any 214→0, Bundle R: alert→Toast). Der Planer hat dafür heute keine `@gymhofwil/shared`-Dependency und das Root-Repo nutzt keine npm-Workspaces — drei Sub-Pakete werden manuell mit `npm ci` initialisiert.

Ohne Harmonisierung in diesem Bundle entstehen bei der Backend-Migration (peaknetworks-Supabase ab Aug 2026 für ExamLab) doppelte Implementierungen für API-Client, Auth-Handler und Error-Handling. Toast ist die UX-Grundlage für API-Fehler-Surfacing und wird Cross-Tool gebraucht.

**Sekundärer Nutzen:** Planer ist heute nicht produktiv im Einsatz → niedriges Regressions-Risiko, ideales Fenster für strukturelle Bereinigung.

## Architektur-Endzustand

- **`packages/shared`** wird kanonische Quelle für Toast-System. Erster echter UI-Component-Eintrag dort (heute nur Editor/Frage-Domäne).
- **Root `package.json`** definiert npm-Workspaces über `packages/shared`, `ExamLab`, `Unterrichtsplaner`. Ein einziges `npm install` im Root initialisiert alles + symlinkt `@gymhofwil/shared` in beide Apps.
- **Beide Apps** importieren `useToast`, `useToastStore`, `ToastContainer` aus `@gymhofwil/shared` (flacher Public-API-Pfad, kein Subdir-Detail).
- **Planer** hat 0× `alert()`, 0× undokumentierte `any`-Token (alle 80 Stellen entweder echt typisiert oder mit `/* Defensive: ... */`-Marker dokumentiert) und CI-Gates `lint:no-alert` + `lint:as-any` strict aktiviert (analog ExamLab).
- **ExamLab** funktional identisch wie heute, nur Imports zeigen auf `@gymhofwil/shared`. Tests + bestehende Lint-Gates unverändert grün.

### Modul-Grenzen

```
packages/shared/src/
  toast/
    toastStore.ts       # 60 LOC, von ExamLab übernommen
    useToast.ts         # 21 LOC, von ExamLab übernommen
    ToastContainer.tsx  # 47 LOC, von ExamLab übernommen
    index.ts            # Barrel
  index.ts              # ergänzt um: export * from './toast'
```

ExamLab-Files `src/store/toastStore.ts`, `src/hooks/useToast.ts`, `src/components/shared/ToastContainer.tsx` werden **gelöscht** (Voll-Migration, keine Bridge).

### Was bleibt unverändert

- Toast-API-Form (Methoden `error`/`success`/`info`/`warning`/`dismiss`, Severity-Typen, Auto-Hide-Verhalten 4000ms, sticky-Default für errors) — kein Breaking Change in der Schnittstelle.
- ExamLab-Apps-Script-Vertrag — Bundle berührt kein Backend.
- Planer-Datenmodell, Stores, Routing — keine Änderungen ausser Toast-Mount + alert-Ersatz.

## Phasen-Plan

Ein Feature-Branch `feature/bundle-1-2-toast-shared-harmonisierung`. Jede Phase ein bis mehrere atomare Commits. Vor jedem Phasen-Abschluss: tsc + Tests + Build grün.

### Phase 1 — npm-Workspaces aktivieren

**Änderungen:**

1. Root `package.json` erweitern:
   ```json
   {
     "name": "gym-wr-duy",
     "private": true,
     "workspaces": ["packages/shared", "Unterrichtsplaner", "ExamLab"],
     "scripts": {
       "setup": "npm install"
     }
   }
   ```
   Bestehende `setup:shared`/`setup:examlab`/`setup:planer`-Skripte entfernen.

2. `Unterrichtsplaner/package.json` Dependency hinzufügen: `"@gymhofwil/shared": "*"`.

3. `ExamLab/package.json` Dependency hinzufügen: `"@gymhofwil/shared": "*"`. (Verifiziert: ExamLab hat heute **keinen** Shared-Dep-Eintrag — der Import-Pfad `@gymhofwil/shared` funktioniert vermutlich heute nicht oder über Build-Time-Resolution. Bundle muss explizit den Dep-Eintrag setzen, sonst bricht Phase 2.)

4. `.github/workflows/deploy.yml` — drei separate `npm ci`-Steps durch einen Root-`npm ci` ersetzen. CI-Order bleibt durch Hoisting korrekt. Zusätzlich: `cache-dependency-path:` muss von den drei Sub-Lockfiles auf das neue Root-`package-lock.json` umgestellt werden.

5. Sub-Lockfiles (`packages/shared/package-lock.json`, `Unterrichtsplaner/package-lock.json`, `ExamLab/package-lock.json`) löschen — Workspaces erzeugen ein Root-Lockfile.

**Verifikation Phase 1:**
- `npm install` im Root läuft ohne Fehler.
- `npm ls react` zeigt eine einzige React-Version (Hoisting korrekt, keine Doppel-Instanz).
- `cd Unterrichtsplaner && npm run build` durchläuft.
- `cd ExamLab && npm run ci-check` durchläuft (227 Test-Files grün, tsc -b grün).
- GitHub-Actions-CI auf Branch-Push grün.

**Risiko-Hotspots:**
- React-Doppel-Instanz bei fehlender Peer-Resolution → `npm ls react` als Gate.
- Vite-PWA-Plugin im Planer reagiert empfindlich auf node_modules-Layout → expliziter Dev-Server-Smoke-Test.

### Phase 2 — Toast nach Shared + ExamLab-Voll-Migration

**Änderungen in `packages/shared`:**

1. Neuer Subdir `packages/shared/src/toast/` mit den drei Files (von ExamLab unverändert kopiert) + `index.ts`:
   ```ts
   export { useToastStore } from './toastStore'
   export type { Toast, ToastVariant } from './toastStore'
   export { useToast } from './useToast'
   export { ToastContainer } from './ToastContainer'
   ```

2. `packages/shared/src/index.ts` ergänzen: `export * from './toast'`.

3. `packages/shared/package.json` devDeps ergänzen: `vitest` (für 3 Smoke-Tests).

4. Drei Smoke-Tests in `packages/shared/src/toast/__tests__/toast.test.ts`:
   - `useToastStore.getState().add('error', 'msg')` pusht Toast.
   - `toastApi.error('msg')` hat `sticky: true` per Default.
   - `useToast()` returnt referenzgleiche Objekte über zwei Render (Stabilität für useEffect-Deps).

**ExamLab-Migration der Konsumenten:**

Drei Import-Patterns (in Phase 2 vor sed-Run gegenchecken):
- `from '@/store/toastStore'` → `from '@gymhofwil/shared'`
- `from '@/hooks/useToast'` → `from '@gymhofwil/shared'`
- `import ToastContainer from '@/components/shared/ToastContainer'` → `import { ToastContainer } from '@gymhofwil/shared'`

Systematischer sed-Run + Default→Named-Import-Korrektur für ToastContainer:

```bash
cd ExamLab
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/hooks/useToast'|from '@gymhofwil/shared'|g" \
  -e "s|from '@/store/toastStore'|from '@gymhofwil/shared'|g" \
  {} +
# ToastContainer-Default-Import manuell zu Named (nur App.tsx oder vergleichbar)
```

**Löschungen:**
- `ExamLab/src/store/toastStore.ts`
- `ExamLab/src/hooks/useToast.ts`
- `ExamLab/src/components/shared/ToastContainer.tsx`

**Verifikation Phase 2:**
- `cd ExamLab && npx tsc -b` grün.
- `cd ExamLab && npx vitest run` grün (1994+ Tests, Toast-Konsumenten testen indirekt mit).
- `cd ExamLab && npm run build` grün.
- Alle 9 bestehenden ExamLab-Lint-Gates clean.
- Browser-Smoke-Test (Tab-Gruppe-Pattern): LP- + SuS-Login, Einrichtungsprüfung. Trigger einen Toast (z.B. fehlgeschlagener Heartbeat oder Form-Validation) — Toast erscheint top-right mit korrekter Severity-Farbe.

**Risiko-Hotspots:**
- `useToast`-Stabilität in `useEffect`-Deps: durch Phase-2.5-Test (Identity über zwei Render) verifiziert.
- Pfad-Aliasing `@/...` in ExamLab tsconfig — neue Imports umgehen das Aliasing korrekt.
- 114 grep-Treffer ≠ 114 echte Imports (Definitionen + Kommentare mit eingeschlossen). Vor sed-Run präzisieren mit `grep -E "^import.*useToast|^import.*toastStore"`.

### Phase 3 — Planer-Touch (alert + as-any + Lint-Gates)

**3.1 Toast in Planer einbauen:**

1. Root-Component (`Unterrichtsplaner/src/App.tsx` oder vergleichbar) ergänzen:
   ```tsx
   import { ToastContainer } from '@gymhofwil/shared'
   // im JSX, sibling zum Main-Content:
   <ToastContainer />
   ```

2. Planer `tailwind.config.ts` (anlegen falls fehlend) Content-Scope erweitern:
   ```ts
   content: [
     './src/**/*.{ts,tsx,html}',
     '../packages/shared/src/**/*.{ts,tsx}',
   ]
   ```
   Sonst rendert Toast unsichtbar (Tailwind-Klassen nicht generiert).

**3.2 `alert()` → Toast-Migration (54 Stellen):**

Pro-Datei-Audit. Severity-Mapping-Heuristik:
- "Fehler", "konnte nicht", "ungültig" → `toast.error()`
- "Gespeichert", "Erfolgreich", "Importiert" → `toast.success()`
- "Hinweis", "Information" → `toast.info()`
- "Achtung", "Warnung", "Vorsicht" → `toast.warning()`

**Wichtig:** `alert()` ist blockierend, `toast()` non-blocking. Bei Code-Pattern `alert('Bitte zuerst speichern'); return;` bleibt das Verhalten korrekt — der `return` läuft sofort, Toast erscheint asynchron. `confirm()`-Aufrufe werden **nicht angefasst** — User-Frage muss blockierend bleiben (separate Bundle-Idee wenn React-Modal gewünscht).

Vor Phase-3-Start wird zusätzlich `grep -rn "confirm(" Unterrichtsplaner/src/` gezählt — die Zahl der verbleibenden `confirm()`-Aufrufe bleibt als bewusster Code-Smell-Indikator im Out-of-Scope-Abschnitt dokumentiert, damit später entschieden werden kann, ob ein React-Modal-Bundle nötig wird.

Verteilung der 54 Aufrufe (aus Audit):
- `SettingsPanel.tsx` 29× (Kurs/Fach-Verwaltung)
- `PlannerTabs.tsx` 9×
- `TaFPanel.tsx` 4×
- `KursImportButton.tsx` 3×
- `shared.tsx` 2×, `ZoomMultiYearView.tsx` 2×, `SequencePanel.tsx` 2×
- `SubjectsEditor.tsx` 1×, `GCalSection.tsx` 1×, `DetailsTab.tsx` 1×

**3.3 `any`-Token-Migration (80 Stellen total: 51 `as any` + 29 `: any`):**

Das ExamLab-Skript `audit-as-any.sh` zählt alle drei Token-Formen (`as any` + `: any` + `= any`). Im Planer sind das heute 80 Stellen — alle müssen entweder echt typisiert oder mit `/* Defensive: ... */`-Marker dokumentiert sein.

Drei Strategien pro Stelle:
1. **Echter Type-Guard-Fix** (bevorzugt): Type-Predicate-Function einführen, z.B. `function isLessonCell(c: WeekData): c is LessonCell { return c.type === 1 }`. Dann `(c as any).note` → `c.note` nach Guard.
2. **Schmaler Cast mit Marker** (ExamLab-Pattern):
   ```ts
   const evt = e as unknown as LessonEvent /* Defensive: Event-Discriminator aus Backend, Runtime-Check über e.type erfolgt vor Zugriff */
   ```
3. **Bug-Fund** (Memory-Regel "as any versteckt Bugs"): Falls Cast einen echten Type-Mismatch versteckt — erst Mapping-Bug fixen, dann Cast entfernen.

Schätzung: ~30% echter Fix, ~65% Defensive-Marker, ~5% Bug-Fund.

Top-Konzentrationen (aus Audit):
- `ZoomYearView.tsx` Z.250, 276–435 (≈9 Stellen, Event-Type-Guards)
- `WeekRows.tsx` Z.124, 129, 213–219 (≈7 Stellen, Event-Type-Guards)
- `ExcelImport.tsx` Z.174 (1 Enum-Cast)
- Verbleibende ~34 Stellen über andere Files verteilt — pro File ein gemeinsamer Type-Guard möglich.

**3.4 Lint-Gates aktivieren:**

**3.4.0 Skript-Refactor (Pflicht, vor 3.4.1):** Verifiziert — `scripts/audit-as-any.sh` hat `SOURCES=(ExamLab/src packages/shared/src)` hardcoded (Z.25); `scripts/audit-no-alert.sh` hat `ExamLab/src` hardcoded (Z.16). Beide Skripte werden erweitert um einen `--target=<dir>`-Parameter, der die hardcodierten `SOURCES` überschreibt. Default-Verhalten bleibt unverändert (Backwards-Compat für ExamLab-Aufrufe), neuer Aufruf von Planer-Seite nutzt `--target=Unterrichtsplaner/src`. Tests: `bash scripts/audit-as-any.sh --target=Unterrichtsplaner/src` muss vor und nach Migration funktionieren.

**3.4.1** `Unterrichtsplaner/package.json` scripts ergänzen:
   ```json
   "lint:as-any": "../scripts/audit-as-any.sh --strict --target=Unterrichtsplaner/src",
   "lint:no-alert": "../scripts/audit-no-alert.sh --strict --target=Unterrichtsplaner/src"
   ```

**3.4.2** `.github/workflows/deploy.yml` zwei neue Steps (sowohl im production- als auch im staging-Block, Memory-Regel "CI-Gates auf BEIDEN Workflow-Hälften"):
   ```yaml
   - name: Audit `any` Use (Planer)
     working-directory: Unterrichtsplaner
     run: npm run lint:as-any
   - name: Audit alert() Use (Planer)
     working-directory: Unterrichtsplaner
     run: npm run lint:no-alert --if-present
   ```
   `--if-present` für `lint:no-alert` ist temporäre Übergangshilfe (analog ExamLab Bundle R). Nach erfolgreichem Merge auf main wird `--if-present` in einem Folge-Commit entfernt — siehe Out-of-Scope.

**3.5 Version + HANDOFF:**

- `Unterrichtsplaner/src/version.ts` → `v3.106`
- `Unterrichtsplaner/HANDOFF.md` UP-5 + UP-6 als ✅ markiert + neue „Letzte Sessions"-Sektion für 19.05.2026.
- Bestehender HANDOFF-Nachzug-Commit (`bc763ac` auf `docs/handoff-v3.105-nachzug`) in den Feature-Branch mergen oder cherry-picken.

**Verifikation Phase 3:**
- `cd Unterrichtsplaner && npx tsc -b` grün.
- `cd Unterrichtsplaner && npm run build` grün.
- `npm run lint:as-any` grün (0 undokumentierte Stellen).
- `npm run lint:no-alert` grün (0 Stellen).
- **Manueller Browser-Test:** Dev-Server starten, pro betroffener Datei mindestens einen Trigger durchklicken:
  - SettingsPanel: Kurs anlegen + Fach löschen → Toast erscheint mit korrekter Severity.
  - PlannerTabs: Tab umbenennen + Tab löschen (confirm bleibt blockierend, Toast nur für Erfolg).
  - TaFPanel, KursImportButton, ZoomMultiYearView, SequencePanel, SubjectsEditor, GCalSection, DetailsTab: je 1 Trigger.
- ExamLab parallel weiterhin grün (keine Re-Regression).

**Risiko-Hotspots:**
- Tailwind-Content-Scope vergessen → unsichtbarer Toast. Browser-Test fängt das.
- `confirm()` vs. `alert()` korrekt unterscheiden — pro Stelle prüfen.
- `as any`-Migration ohne Test-Coverage → manuelles Durchklicken nach jedem File-Touch.

## Cross-Cutting Verifikation vor Merge

- **Lint-Gates auf beiden Seiten:** `cd ExamLab && npm run lint:as-any && npm run lint:no-alert` UND `cd Unterrichtsplaner && npm run lint:as-any && npm run lint:no-alert` — alle 4 grün.
- **`npm ls react` im Root:** Eine einzige React-Version (Workspace-Hoisting korrekt).
- **CI grün:** GitHub-Actions-Workflow durchläuft inkl. neuer Planer-Gates auf production- + staging-Block.
- **ExamLab-Browser-Test:** Tab-Gruppen-Test analog `regression-prevention.md` — 1 SuS-Login + 1 LP-Login, Einrichtungsprüfung durchklicken, mindestens 1 Toast-Trigger.
- **Planer-Browser-Test:** 9 Trigger-Pfade dokumentiert in 3.5 — alle abgehakt.

## Rollback-Plan

- Git-Tag `v-pre-bundle-1-2` direkt vor Merge auf main.
- Phase 2 bricht ExamLab → `git revert <merge-commit>` materialisiert Toast-Source wieder in `ExamLab/src/`, Workspaces bleiben aktiv.
- Phase 3 bricht Planer → File-revert auf die 9 betroffenen Files, Workspaces + Toast-Shared bleiben.

## Out-of-Scope (YAGNI)

Explizit nicht in diesem Bundle:
- Toast-Tests umfassend ausbauen — nur 3 Smoke-Tests in shared.
- `confirm()` durch React-Modal ersetzen — separates Bundle wenn überhaupt nötig.
- Weitere ExamLab-Lint-Gates für Planer (`lint:typo-tokens`, `lint:no-emoji`, `lint:musterloesung`, `lint:wire-contract`, `lint:no-inline-svg`, `lint:storybook-coverage`, `lint:no-tests-dir`) — UP-7-Folge-Bundle.
- vitest-Setup im Planer (UP-7).
- `generateColorVariants` aus Planer nach Shared (UP-6 zweiter Teil — UI-Tokens werden in eigenem Bundle harmonisiert).
- Apps-Script-URL aus Config (UP-8).
- ExamLab `package-lock.json`-Migration auf Workspaces falls hier nicht trivial — separates Wartungs-Bundle.
- `--if-present` aus `lint:no-alert`-Step in `deploy.yml` rausnehmen (nach erfolgreichem Bundle-Merge in einem Folge-Commit).
- `confirm()`-Aufrufe im Planer durch React-Modal ersetzen (Audit-Zähler-Output aus 3.2 entscheidet ob nötig).

## Verifizierte Faktenlage + verbleibende Annahmen

Während Spec-Review bestätigt:
- `ExamLab/package.json` hat **keinen** `@gymhofwil/shared`-Dep heute. Phase 1.3 ergänzt den Eintrag (Pflicht, nicht „falls fehlt").
- `scripts/audit-as-any.sh` hat `SOURCES=(ExamLab/src packages/shared/src)` hardcoded (Z.25); `scripts/audit-no-alert.sh` hat `ExamLab/src` hardcoded (Z.16). Phase 3.4.0 ist Pflicht-Refactor auf `--target=<dir>`-Parameter.
- Token-Zählung im Planer: 51 `as any` + 29 `: any` + 0 `= any` = 80 Token total (das Audit-Skript sieht alle drei zusammen).

In Phase 2 vor sed-Run zu präzisieren:
- Subagent-Bericht „114 useToast-Konsumenten" enthält Definitionen + Kommentar-Treffer. Echte Import-Zahl wird in Phase 2 mit `grep -E "^import.*useToast|^import.*toastStore"` präzisiert.
