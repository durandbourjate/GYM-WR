# Bundle BB — HilfeSeite + EinstellungenPanel Doppel-Cut Plan

**Spec:** `docs/superpowers/specs/2026-05-09-bundle-bb-hilfeseite-einstellungen-design.md`
**Branch:** `bundle-bb/hilfeseite-einstellungen` (von `origin/main` `fc8f191`)
**Working dir:** `ExamLab/`

## Phase A: HilfeSeite (906 → ≤120 Z.)

### Step A.1 — Layout-Helper extrahieren
- [ ] Erstelle `src/components/lp/hilfe/layoutHelpers.tsx` mit Named Exports `Titel`, `Untertitel`, `Text`, `Schritt`, `Hinweis` — Body byte-identisch.

### Step A.2 — Tab-Sektion-Files erstellen
Für jede der 10 Tab-Sektionen: Default-Export-Function-Komponente in eigenem File, byte-identische JSX-Body, Imports `Titel/Untertitel/Text/Schritt/Hinweis` aus `./layoutHelpers`.
- [ ] `hilfe/HilfeEinstieg.tsx`
- [ ] `hilfe/HilfeUeben.tsx`
- [ ] `hilfe/HilfePruefung.tsx`
- [ ] `hilfe/HilfeFragen.tsx`
- [ ] `hilfe/HilfeZusammenarbeit.tsx`
- [ ] `hilfe/HilfeKI.tsx`
- [ ] `hilfe/HilfeDurchfuehrung.tsx`
- [ ] `hilfe/HilfeKorrektur.tsx`
- [ ] `hilfe/HilfeBloom.tsx` — enthält `HilfeBloom` (default) + `BloomStufe` (lokal, nicht exportiert)
- [ ] `hilfe/HilfeFAQ.tsx` — enthält `HilfeFAQ` (default) + `FAQItem` (lokal)

### Step A.3 — HilfeSeite.tsx reduzieren
- [ ] Entferne alle Tab-Sektion-Bodies + Layout-Helper aus HilfeSeite.tsx
- [ ] Imports aus `./hilfe/*`
- [ ] Behalte Wrapper + Tab-Switch + ResizableSidebar
- [ ] Verifikation: `wc -l` zeigt ≤120 Z.

### Step A.4 — Build/Lint
- [ ] `npx tsc -b` clean
- [ ] `npm run lint:as-any` 0
- [ ] `npm run lint:no-alert` 0
- [ ] `npx vitest run` 1512 passed (drift = 0)

### Step A.5 — Commit
```
git add ExamLab/src/components/lp/HilfeSeite.tsx ExamLab/src/components/lp/hilfe/
git commit -m "Bundle BB Phase A: HilfeSeite 906 → <120 Z. via 11 Sub-Files"
```

## Phase B: EinstellungenPanel (607 → ≤150 Z.)

### Step B.1 — Shared Felder extrahieren
- [ ] Erstelle `src/components/settings/einstellungen/sharedFelder.tsx` mit Named Exports `CheckboxChip`, `SettingsField`. Body byte-identisch.

### Step B.2 — Inline-Editoren extrahieren
- [ ] Erstelle `src/components/settings/einstellungen/InlineEditoren.tsx` mit Named Exports `InlineKursEditor`, `InlineTextEditor`. Body byte-identisch.

### Step B.3 — ProfilTab extrahieren
- [ ] Erstelle `src/components/settings/einstellungen/ProfilTab.tsx`. Default-Export `ProfilTab`. Imports: `CheckboxChip` aus `./sharedFelder`, `useStammdatenStore` aus `../../../store/stammdatenStore`, Types aus `../../../types/stammdaten`.

### Step B.4 — AdminTab extrahieren
- [ ] Erstelle `src/components/settings/einstellungen/AdminTab.tsx`. Default-Export `AdminTab`. Imports: `SettingsField` aus `./sharedFelder`, `InlineKursEditor` + `InlineTextEditor` aus `./InlineEditoren`, `useStammdatenStore` + Types.

### Step B.5 — EinstellungenPanel.tsx reduzieren
- [ ] Entferne ProfilTab, AdminTab, InlineKursEditor, InlineTextEditor, CheckboxChip, SettingsField aus EinstellungenPanel.tsx
- [ ] Imports aus `./einstellungen/ProfilTab` + `./einstellungen/AdminTab`
- [ ] Behalte Default-Export, Tab-State, Tab-Bar, ResizableSidebar
- [ ] Verifikation: `wc -l` zeigt ≤150 Z.

### Step B.6 — Build/Lint
- [ ] `npx tsc -b` clean
- [ ] `npm run lint:as-any` 0
- [ ] `npm run lint:no-alert` 0
- [ ] `npm run lint:no-tests-dir` clean
- [ ] `npx vitest run` 1512 passed

### Step B.7 — Vite build
- [ ] `npx vite build` grün, PWA OK

### Step B.8 — Commit
```
git add ExamLab/src/components/settings/EinstellungenPanel.tsx ExamLab/src/components/settings/einstellungen/
git commit -m "Bundle BB Phase B: EinstellungenPanel 607 → <150 Z. via 4 Sub-Files"
```

## Phase C: Browser-E2E

- [ ] Push `bundle-bb/hilfeseite-einstellungen` als preview (force-with-lease nach `git log preview ^local` Check)
- [ ] Warten bis Pages-Deploy fertig (~2 min)
- [ ] LP-Tab `staging`: Hilfe-Sidebar → 10 Tabs durchklicken
- [ ] LP-Tab `staging`: Einstellungen-Sidebar → Profil + Admin Tabs
- [ ] SuS-Tab `staging`: Smoke-Test Login + Übung-Liste sichtbar
- [ ] Konsole-Check: 0 Errors auf beiden Tabs

## Phase D: Merge + HANDOFF

- [ ] `git checkout main && git pull origin main`
- [ ] `git merge --no-ff bundle-bb/hilfeseite-einstellungen`
- [ ] HANDOFF-Eintrag „Bundle BB" oben einfügen (Spec/Plan-Pfad, Hotspot-Bilanz 3→1)
- [ ] Memory-Update: `project_bundle_bb_komplett.md` neu, MEMORY.md Index-Eintrag
- [ ] `git push origin main`
- [ ] Lokal + remote Branch löschen
