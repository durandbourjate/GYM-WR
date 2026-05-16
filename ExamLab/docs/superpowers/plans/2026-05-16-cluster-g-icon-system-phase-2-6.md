# Cluster G — Icon-System Phase 2-6 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Konsequente Icon-System-Migration: Lucide-Icons in Header/Navigation, Aktion-Toolbars, Status/Domain, Fragetypen-Listen — plus Lint-Gates die Re-Introduction von Emojis/Inline-SVGs verhindern.

**Architecture:** Phase 1 (Foundation) ist bereits LIVE (`lucide-react` installiert, `CustomIcons.tsx` + `FragetypIcon.tsx` mit `FRAGETYP_ICON_MAP` existieren). Phase 2-6 migrieren konsumierende Surfaces sequentiell — Header, Toolbar-Icons, Status/Domain-Emojis, Fragetyp-Listen — dann Lint-Gates am Ende.

**Tech Stack:** lucide-react v1.14 (installed), React 19, TypeScript, Tailwind v4 (currentColor + dark:-Varianten). Lint-Gates als grep-Scripts analog `scripts/audit-wire-contract.mjs`.

**Quellen:**
- Spec: `ExamLab/docs/superpowers/specs/2026-05-11-cluster-g-icon-system-design.md`
- Phase-1-Output: `ExamLab/src/components/ui/icons/{CustomIcons,FragetypIcon}.tsx`
- Audit (16.05.2026): 467 Emoji-Matches in 145 Files, 12 Icon-Inline-SVG-Files (12 weitere SVGs sind Content-SVGs für PDF/Zeichnen/Hotspot — Out-of-Scope per Spec §10)

---

## File Structure

### Modifizierte Dateien (Phase 2 — Header & Navigation)
- `ExamLab/src/components/ui/TabBar.tsx` — Tabs erweitern um optionales `icon`-Prop
- `ExamLab/src/config/appNavigation.ts` — 5 Top-Tabs (Favoriten/Prüfen/Üben/Fragensammlung/Papierkorb) bekommen Lucide-Icons
- `ExamLab/src/components/Layout.tsx` — User-Menü/Einstellungen/Hilfe-Buttons auf Lucide
- `ExamLab/src/components/SuSHilfeButton.tsx` — `HelpCircle` statt Inline-SVG

### Modifizierte Dateien (Phase 3 — Aktion-Icons)
12 Icon-Inline-SVG-Files migrieren (Content-SVGs bleiben):
- `Layout.tsx`, `Startbildschirm.tsx`, `AbgabeBestaetigung.tsx`, `AbgabeDialog.tsx`, `Button.tsx` (ui)
- `MaterialPanel.tsx`, `AbschnitteTab.tsx`, `DetailKarte.tsx`, `KompaktZeile.tsx`
- `SharedFragenEditor.tsx` (packages/shared)
- Plus: 2 weitere mit Toolbar-Icons (PDFToolbar/ZeichnenToolbar — nur die Icon-SVGs, nicht die Canvas-SVGs)

### Modifizierte Dateien (Phase 4 — Status & Domain)
Top-Surfaces mit den häufigsten UI-Emojis (Test-Daten + Demo-Files bleiben aus Scope):
- `Toast`-Container (CheckCircle2/AlertTriangle/AlertCircle/Info statt Text/Emoji)
- `MaterialPanel.tsx` (📄📝🔗🎬 → FileText/Link/Video/Mic)
- `FavoritenTab.tsx`, `Favoriten`-List-Komponenten (📍📝🎯❓ → Star/ClipboardList/Target/HelpCircle)
- `ProblemmeldungZeile.tsx`, `LernzielTab.tsx` (🔴💡 → AlertCircle/Lightbulb)
- Stufen-Kontrolle (🟢🟡🔴 → `Circle filled` mit Color-Tokens)
- `LobbyPhase.tsx`, `AktivPhase.tsx`, `BeendetPhase.tsx`, `DurchfuehrenDashboard.tsx`
- `ExcelImport.tsx`, `AdminTab.tsx`, `AdminThemensteuerung.tsx`, `KorrekturEinsicht.tsx`
- `SuSHilfePanel.tsx`, `LernzieleAkkordeon.tsx`, `MaterialienSection.tsx`
- `gamification.ts` (Strings mit Emojis)

### Modifizierte Dateien (Phase 5 — FragetypIcon)
5 Surfaces mit Fragetyp-Listen bekommen `<FragetypIcon typ={...} />`:
- `FragenBrowser` (KompaktZeile + DetailKarte) — vor Titel
- `PruefungsComposer` Frageliste
- `useben` Pool-Auswahl
- `KorrekturUebersicht`
- Fragentyp-Filter-Dropdown

### Neue Dateien (Phase 6 — Lint-Gates)
- `scripts/audit-no-emoji.mjs` — grep nach Emoji-Codepoints, exit 1 wenn nicht-baseline
- `scripts/audit-no-inline-svg.mjs` — grep nach `<svg`-Tags außerhalb von Whitelist-Pfaden
- `scripts/no-emoji-baseline.json` — Allowlist für Test-Daten/Demo-Files
- `ExamLab/package.json` — neue Scripts `lint:no-emoji` + `lint:no-inline-svg`
- `ExamLab/scripts/ci-check.sh` — Gates ergänzen

### Out-of-Scope (per Spec §10)
- Content-SVGs für PDF-Annotation/Zeichnen-Canvas/Hotspot-Bilder/T-Konto-Render — bleiben Inline-SVG
- Daten-Files (`einrichtungsFragen.ts`, `einrichtungsUebungFragen.ts`, `demoKorrektur.ts`) — Emojis bleiben (didaktischer Frage-Inhalt)
- Test-Strings (`tests/*.test.tsx`) — Emojis bleiben (Test-Fixtures)
- Animierte Icons / Storybook / PWA-Favicon

---

## Sub-Task 1 — Pre-Audit + Bundle-Baseline (~0.5h)

**Files:**
- Create: `ExamLab/docs/superpowers/audits/2026-05-16-cluster-g-pre-audit.md`

### Steps

- [ ] **Step 1.1: Bundle-Baseline messen vor Phase 2**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run build 2>&1 | grep -E "kB|gzip" | sort -k2 -h > /tmp/bundle-baseline.txt
```

Notiere im Audit-Doc: aktuelle LPStartseite-Chunk-Größe (~851KB), Total-PWA-Size (5.30 MB).

- [ ] **Step 1.2: Surface-Inventar erstellen**

Python-Script lokal ausführen:
```python
import re, os
from collections import Counter
emoji_re = re.compile(r'[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U00002300-\U000023FF✨⁉‼]')
files = Counter()
emojis = Counter()
for root in ['ExamLab/src', 'packages/shared/src']:
  for dirpath, dirnames, filenames in os.walk(root):
    if 'node_modules' in dirpath: continue
    for f in filenames:
      if not (f.endswith('.ts') or f.endswith('.tsx')): continue
      path = os.path.join(dirpath, f)
      content = open(path, encoding='utf-8').read()
      matches = emoji_re.findall(content)
      if matches:
        files[path] = len(matches)
        for m in matches: emojis[m] += 1
```

Dokumentiere im Audit-Doc:
- TOP-15 Emoji-Codepoints mit Counts
- Files-Liste sortiert nach Count
- Welche Files sind „UI" (in-scope) vs „Test-Data" (out-of-scope)?

Erwartete Baseline aus 16.05.2026: ~467 Matches in 145 Files. UI-relevant ~380.

- [ ] **Step 1.3: Inline-SVG-Audit**

```bash
grep -rln "<svg" --include="*.ts" --include="*.tsx" ExamLab/src packages/shared/src 2>/dev/null | grep -v "ui/icons/"
```

24 Files. Im Audit-Doc kategorisieren:
- **Icon-SVGs** (in-scope für Phase 3): ~12 Files (Layout/Startbildschirm/AbgabeBestaetigung/AbgabeDialog/Button/MaterialPanel/AbschnitteTab/DetailKarte/KompaktZeile/SuSHilfeButton/SharedFragenEditor + 2-3 weitere)
- **Content-SVGs** (out-of-scope): 12 Files (PDF/Zeichnen/Hotspot/TKonto/MCFrage/Buchungssatz)

- [ ] **Step 1.4: FRAGETYP_ICON_MAP-Verifikation**

```bash
grep -E "^export type FrageTyp\|^export type Fragetyp" packages/shared/src/types/fragen-core.ts
```

Lies die `Frage`-Union und Fragetyp-Discriminator. Verifiziere dass alle 20 Werte in `FRAGETYP_ICON_MAP` (ExamLab/src/components/ui/icons/FragetypIcon.tsx) mappen — TS-Compiler sollte das eigentlich erzwingen, aber Spec §13 nennt das explizit als Pre-Step. Drift hier aufdecken, nicht später.

Expected: 20/20 match, kein Drift.

- [ ] **Step 1.5: Commit Audit-Doc**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/docs/superpowers/audits/2026-05-16-cluster-g-pre-audit.md
git commit -m "Cluster G Pre-Audit: Emoji/SVG-Inventar + Bundle-Baseline"
```

---

## Sub-Task 2 — Phase 2: Header & Navigation (~1h)

**Files:**
- Modify: `ExamLab/src/config/appNavigation.ts` — Tab-Config erweitern um optionales `icon`
- Modify: `ExamLab/src/components/ui/TabBar.tsx` — Icon-Render bei optionalem `icon`-Prop
- Modify: `ExamLab/src/components/SuSHilfeButton.tsx` — HelpCircle statt Inline-SVG
- Modify: `ExamLab/src/components/Layout.tsx` — User-Menü/Einstellungen/Hilfe wenn dort Icons sind
- Test: `ExamLab/src/components/ui/TabBar.test.tsx` (existing erweitern)

### Steps

- [ ] **Step 2.1: TabBar-Test schreiben (TDD)**

In `ExamLab/src/components/ui/TabBar.test.tsx` neuen Case ergänzen — **wichtig: async-Callback, weil `await import`**:
```ts
it('rendert Icon vor Label wenn icon-Prop gesetzt', async () => {
  const { Star } = await import('lucide-react')
  render(<TabBar tabs={[{key: 't1', label: 'Favoriten', icon: Star}]} active="t1" onChange={vi.fn()} />)
  expect(screen.getByText('Favoriten')).toBeInTheDocument()
  expect(screen.getByText('Favoriten').closest('button')?.querySelector('svg')).toBeInTheDocument()
})
```
Alternativ: `import { Star } from 'lucide-react'` ganz oben im Test-File, dann sync-Test.

Run: `npx vitest run ExamLab/src/components/ui/TabBar.test.tsx` — Expected: FAIL (icon-Prop noch nicht im Type).

- [ ] **Step 2.2: TabBar erweitern**

`TabBar.tsx` Tab-Type erweitern:
```ts
interface Tab {
  key: string
  label: string
  icon?: ComponentType<LucideProps>  // optional, gesetzt aus appNavigation
}
```

In `renderTab(tab)` JSX:
```tsx
<button>
  {tab.icon && <tab.icon className="w-4 h-4 mr-1.5 inline-block" aria-hidden />}
  {tab.label}
</button>
```

Run: `npx vitest run ExamLab/src/components/ui/TabBar.test.tsx` — Expected: PASS.

- [ ] **Step 2.3: appNavigation Icons setzen**

In `ExamLab/src/config/appNavigation.ts`:
```ts
import { Star, SearchCheck, Dumbbell, List, Trash2 } from 'lucide-react'
// ...
{ key: 'favoriten', label: 'Favoriten', icon: Star, ... },
{ key: 'pruefen', label: 'Prüfen', icon: SearchCheck, ... },
{ key: 'ueben', label: 'Üben', icon: Dumbbell, ... },
{ key: 'fragensammlung', label: 'Fragensammlung', icon: List, ... },
{ key: 'papierkorb', label: 'Papierkorb', icon: Trash2, ... },
```

Falls in `appNavigation.ts` bereits Emojis sind (z.B. `label: '🎯 Üben'`), Emoji rauswerfen, Label sauber.

- [ ] **Step 2.4: SuSHilfeButton + Layout — Inline-SVG → Lucide**

`ExamLab/src/components/SuSHilfeButton.tsx`: Inline-SVG suchen, durch `<HelpCircle className="w-5 h-5" />` ersetzen.

`ExamLab/src/components/Layout.tsx`: User-Menü-Initialen-Badge bleibt (Spec sagt: Initialen-Fallback OK), aber Settings + Hilfe-Buttons (falls Emojis ❓ oder Inline-SVGs): durch `Settings`/`HelpCircle` ersetzen.

- [ ] **Step 2.5: Local-Verifikation**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run ExamLab/src/components/ui/TabBar.test.tsx
npx tsc --noEmit
```

Expected: alle tests grün, tsc clean.

- [ ] **Step 2.6: Commit**

```bash
git add ExamLab/src/components/ui/TabBar.tsx \
        ExamLab/src/components/ui/TabBar.test.tsx \
        ExamLab/src/config/appNavigation.ts \
        ExamLab/src/components/SuSHilfeButton.tsx \
        ExamLab/src/components/Layout.tsx
git commit -m "Cluster G Phase 2: Header & Navigation mit Lucide-Icons"
```

KEIN Push (Controller pusht am Ende).

---

## Sub-Task 3 — Phase 3: Aktion-Icons (Inline-SVG → Lucide) (~3h)

**Files (12 Icon-SVG-Files migrieren):**
- `ExamLab/src/components/Startbildschirm.tsx`
- `ExamLab/src/components/AbgabeBestaetigung.tsx`
- `ExamLab/src/components/AbgabeDialog.tsx`
- `ExamLab/src/components/Layout.tsx` (falls noch nicht in Phase 2 berührt)
- `ExamLab/src/components/ui/Button.tsx`
- `ExamLab/src/components/MaterialPanel.tsx`
- `ExamLab/src/components/lp/vorbereitung/composer/AbschnitteTab.tsx`
- `ExamLab/src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx`
- `ExamLab/src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx`
- `ExamLab/src/components/fragetypen/pdf/PDFToolbar.tsx` (nur Toolbar-Icons, nicht Canvas-SVG)
- `ExamLab/src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx` (nur Toolbar-Icons)
- `packages/shared/src/editor/SharedFragenEditor.tsx`

### Steps

- [ ] **Step 3.0: Pre-Step — Grep nach noch-vorhandenen `<svg`-Tags in Phase-2-Files**

```bash
grep -l "<svg" ExamLab/src/components/{Layout,SuSHilfeButton,Startbildschirm,AbgabeBestaetigung,AbgabeDialog}.tsx packages/shared/src/editor/SharedFragenEditor.tsx 2>/dev/null
```

Wenn Phase 2 manche dieser Files schon migriert hat, sind sie nicht mehr in dem Output → Doppel-Arbeit vermeiden.

- [ ] **Step 3.1: Mapping-Tabelle aus existing Inline-SVGs bauen**

Pro File: jede `<svg>...</svg>`-Stelle inspizieren, das gemeinte Icon identifizieren, Lucide-Äquivalent aus Spec §5.2-5.3 wählen.

**Aktion-Icon-Mapping-Tabelle (aus Spec §5.2):**

| Aktion | Lucide | Default | Hover |
|---|---|---|---|
| Duplizieren | `Copy` | `text-slate-500` | `text-violet-600` |
| Löschen | `Trash2` | `text-slate-500` | `text-red-600` |
| Bearbeiten | `Pencil` (oder `SquarePen`) | `text-slate-500` | `text-violet-600` |
| Speichern | `Save` | `text-slate-500` | `text-violet-600` |
| Schließen | `X` | `text-slate-500` | `text-red-600` |
| Bestätigen | `Check` | `text-green-500` | `text-green-600` |
| Hinzufügen | `Plus` | `text-slate-500` | `text-violet-600` |
| Filter | `SlidersHorizontal` | `text-slate-500` | `text-violet-600` |
| Sortieren | `ArrowUpDown` | `text-slate-500` | `text-violet-600` |
| Aktualisieren | `RefreshCw` | `text-slate-500` | `text-violet-600` |
| Mehr | `MoreHorizontal` | `text-slate-500` | `text-violet-600` |
| Download | `Download` | `text-slate-500` | `text-violet-600` |
| Upload | `Upload` | `text-slate-500` | `text-violet-600` |
| Anzeigen | `Eye` | `text-slate-500` | `text-violet-600` |
| Verbergen | `EyeOff` | `text-slate-500` | `text-violet-600` |
| Drag-Handle | `GripVertical` | `text-slate-400` | `text-slate-600` |

Beispiel: `KompaktZeile.tsx` hat heute Inline-SVG für Trash + Duplicate. Migration:
```diff
- <svg viewBox="..."><path d="..."/></svg>  // Trash
+ <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />

- <svg viewBox="..."><path d="..."/></svg>  // Duplicate
+ <Copy className="w-4 h-4 text-slate-500 hover:text-violet-600" />
```

**Workflow pro File:**
1. Inline-SVG-Stelle finden (grep `<svg` + Kontext lesen)
2. Lucide-Komponente aus Spec wählen
3. Import erweitern: `import { Trash2, Copy } from 'lucide-react'`
4. JSX ersetzen
5. Default-Farbe + Hover aus Spec §5.2 (`text-slate-500 hover:text-violet-600` etc.)

- [ ] **Step 3.2: Per-File-Loop — 12 Files migrieren**

Pro File einzeln machen (kein big-bang). Reihenfolge: kleinste/einfachste zuerst:
1. `SuSHilfeButton.tsx` (1 SVG) — wenn nicht schon in Phase 2 done
2. `Button.tsx` (1-2 SVG)
3. `AbgabeBestaetigung.tsx`, `AbgabeDialog.tsx`, `Startbildschirm.tsx`
4. `KompaktZeile.tsx`, `DetailKarte.tsx` (Toolbar-Icons)
5. `MaterialPanel.tsx`, `AbschnitteTab.tsx`
6. `Layout.tsx` (falls noch übrig)
7. `PDFToolbar.tsx`, `ZeichnenToolbar.tsx` (nur Toolbar — NICHT die strukturellen Canvas-SVGs)
8. `SharedFragenEditor.tsx` (Toolbar-Icons im Editor-Header)

Pro File:
- Existing Test-Setup laufen lassen vor + nach (Tests dürfen nicht regression)
- Visuelle Bauteile (z.B. dark-mode-Farbpaare) beibehalten

- [ ] **Step 3.3: Verifikation nach jedem File**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run <changed-file-test>
npx tsc --noEmit
```

- [ ] **Step 3.4: Commit nach allen Files (1 Commit pro Bundle, max 2-3 Bundles)**

```bash
git add <files>
git commit -m "Cluster G Phase 3: Aktion-Icons in Toolbars + Listen auf Lucide"
```

---

## Sub-Task 4 — Phase 4: Status & Domain (Emojis → Lucide) (~4-5h)

**Files (~20 UI-Files mit den häufigsten Emojis):**

Fokus auf UI-Surfaces — NICHT auf Daten/Test-Files. Top-Files (Emoji-Count > 5):
- `ExamLab/src/components/lp/durchfuehrung/LobbyPhase.tsx` (14)
- `ExamLab/src/components/lp/durchfuehrung/AktivPhase.tsx` (7)
- `ExamLab/src/components/lp/durchfuehrung/BeendetPhase.tsx` (7)
- `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` (7)
- `ExamLab/src/components/sus/KorrekturEinsicht.tsx` (11)
- `ExamLab/src/components/ueben/LernzieleAkkordeon.tsx` (14)
- `ExamLab/src/components/ueben/SuSHilfePanel.tsx` (10)
- `ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx` (6)
- `ExamLab/src/components/ueben/admin/settings/AllgemeinTab.tsx` (5)
- `ExamLab/src/components/lp/vorbereitung/composer/materialien/MaterialienSection.tsx` (10)
- `ExamLab/src/components/lp/fragensammlung/ExcelImport.tsx` (6)
- `ExamLab/src/components/settings/einstellungen/AdminTab.tsx` (8)
- `ExamLab/src/components/settings/FavoritenTab.tsx` (7)
- `ExamLab/src/components/settings/LernzielTab.tsx` (6)
- `ExamLab/src/components/MaterialPanel.tsx` (falls noch nicht in Phase 3 erwischt)
- `ExamLab/src/utils/ueben/gamification.ts` (10) — Strings, vorsichtig
- Toast-Container (falls existing — sonst neue Datei)

### Steps

- [ ] **Step 4.1: Emoji-Mapping-Tabelle**

Aus Spec §5.3 + §5.4:
| Emoji | Lucide | Farbe |
|---|---|---|
| ✓ ✅ | `Check` oder `CheckCircle2` | `green-500` |
| ✗ ✕ ❌ | `X` oder `XCircle` | `red-500` |
| ⚠ ⚠️ | `AlertTriangle` | `yellow-500` |
| 💡 | `Lightbulb` | `yellow-500` |
| 🔴 | `AlertCircle` filled | `red-500` |
| 🟢 🟡 🔴 | `Circle` filled | green/yellow/red-500 |
| 📄 📋 | `FileText` / `ClipboardList` | `slate-500` |
| 🔒 | `Lock` | `slate-500` |
| ☆ ⭐ | `Star` | `yellow-500` |
| ⏱ ⏰ | `Clock` | `slate-500` |
| 📝 | `ClipboardList` oder `Edit` | `slate-500` |
| 🎓 | `GraduationCap` | `slate-500` |
| 🎯 | `Target` | `slate-500` |
| 🏁 | `Flag` | `slate-500` |
| 🔗 | `Link` | `slate-500` |
| 🎬 | `Video` | `slate-500` |
| 🎤 | `Mic` | `slate-500` |
| ❓ | `HelpCircle` | `slate-500` |
| ❗ ‼ | `AlertCircle` | `red-500` |

Tabelle in den Plan-Audit-Doc übernehmen für Referenz beim Implementation.

- [ ] **Step 4.2: Per-File-Loop — TOP-7 Files zuerst**

Reihenfolge nach Emoji-Count absteigend. Pro File:
1. Alle Emoji-Vorkommen identifizieren (`grep` der Tabelle oben)
2. Pro Emoji: passende Lucide-Komponente einfügen
3. Bei Emoji in String-Konstante: String aufteilen, JSX-Komponente einbauen
4. Bei Emoji in Frage-Inhalt (didaktisch): IM PLATZ LASSEN — out-of-scope

Beispiel `LernzieleAkkordeon.tsx`:
```diff
- <span>✅ Erreicht</span>
+ <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Erreicht</span>
```

- [ ] **Step 4.3: gamification.ts (Strings)**

`utils/ueben/gamification.ts` enthält Emoji-Strings die als Text im UI angezeigt werden. Pro String: entscheiden ob Inhalt-Emoji bleiben darf (z.B. Belohnungs-Sticker `🏆`) oder durch Komponente ersetzt werden muss (z.B. Status-Indikatoren). Bei Unsicherheit: lassen + dokumentieren als Allow-Item für Sub-Task 6 Baseline.

- [ ] **Step 4.4: MaterialPanel.tsx — Material-Typ-Icons (Spec §5.4)**

```diff
- {material.typ === 'pdf' && '📄'}
- {material.typ === 'link' && '🔗'}
- {material.typ === 'video' && '🎬'}
+ {material.typ === 'pdf' && <FileText className="w-4 h-4" />}
+ {material.typ === 'link' && <Link className="w-4 h-4" />}
+ {material.typ === 'video' && <Video className="w-4 h-4" />}
```

- [ ] **Step 4.5: Verifikation nach jedem File-Bundle (3-4 Files)**

```bash
npx vitest run                          # alle Tests grün
npx tsc --noEmit                        # type-check
```

- [ ] **Step 4.6: 2-3 Commits in logischen Bundles**

```bash
git add <bundle>
git commit -m "Cluster G Phase 4a: Durchfuehrung-Phasen Emojis auf Lucide"
# etc.
```

---

## Sub-Task 5 — Phase 5: FragetypIcon einbinden (~2h)

**Files:**
- Modify: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx` — FragetypIcon vor Titel
- Modify: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx` — FragetypIcon im Header
- Modify: `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx` — Frageliste mit Icons
- Modify: `ExamLab/src/components/ueben/admin/*Pool*.tsx` — Übungs-Pool-Auswahl
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturUebersicht.tsx` (falls existing)
- Modify: Fragentyp-Filter-Dropdown (in FilterBar o.ä.)

### Steps

- [ ] **Step 5.1: KompaktZeile.tsx — Icon vor Titel**

Vor dem Multiple-Choice-Badge ein `<FragetypIcon typ={frage.typ} className="w-4 h-4 mr-1.5 text-slate-500" />`.

Layout: schau dass Zeilen-Layout nicht bricht (gap-1.5 zwischen Icon und nachfolgenden Badges).

- [ ] **Step 5.2: DetailKarte.tsx — Icon im Header**

Im Karten-Header neben dem Typ-Badge.

- [ ] **Step 5.3: PruefungsComposer Frageliste**

Suche existing Frageliste-Component, ergänze Icon-Prefix.

- [ ] **Step 5.4: Übungs-Pool-Auswahl + Korrektur-Übersicht**

Wenn existing — analog.

- [ ] **Step 5.5: Fragentyp-Filter-Dropdown**

Wenn das Dropdown Options pro Fragetyp rendert, Icon vor Option-Label.

- [ ] **Step 5.6: Test-Adaption**

Existing Tests laufen lassen. Falls KompaktZeile-Snapshot oder DOM-Asserts hinausreichen: anpassen, weil neues DOM-Element.

- [ ] **Step 5.7: Commit**

```bash
git add <files>
git commit -m "Cluster G Phase 5: FragetypIcon in 5 Surfaces"
```

---

## Sub-Task 6 — Phase 6: Lint-Gates (~1.5h)

**Files:**
- Create: `scripts/audit-no-emoji.mjs`
- Create: `scripts/audit-no-inline-svg.mjs`
- Create: `scripts/no-emoji-baseline.json` (Allowlist für Test-Daten + Demo-Files)
- Modify: `ExamLab/package.json` — `lint:no-emoji`, `lint:no-inline-svg`, `ci-check` ergänzen

### Steps

- [ ] **Step 6.1: `audit-no-emoji.mjs` schreiben (TDD)**

Test `scripts/audit-no-emoji.test.mjs`:
```js
import { describe, it, expect } from 'vitest'
import { auditFile } from './audit-no-emoji.mjs'

it('findet Emoji in TSX-Datei', () => {
  const result = auditFile('// hello 🎯', 'test.tsx', new Set())
  expect(result.violations).toHaveLength(1)
})

it('ignoriert allowlisted Datei', () => {
  const result = auditFile('// hello 🎯', 'src/data/einrichtungsFragen.ts', new Set(['src/data/einrichtungsFragen.ts']))
  expect(result.violations).toHaveLength(0)
})
```

`audit-no-emoji.mjs`:
```js
#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}✨⁉‼]/u

export function auditFile(content, path, allowlist) {
  if (allowlist.has(path)) return { violations: [] }
  const violations = []
  content.split('\n').forEach((line, idx) => {
    if (EMOJI_RE.test(line)) violations.push({ path, line: idx + 1, content: line.trim() })
  })
  return { violations }
}

// Main:
const ROOT = process.cwd()
const BASELINE = JSON.parse(readFileSync('scripts/no-emoji-baseline.json', 'utf-8'))
const ALLOWLIST = new Set(BASELINE.allowlist)
const files = execSync(`git ls-files '**/*.ts' '**/*.tsx'`).toString().split('\n').filter(Boolean)
let total = 0
files.forEach(p => {
  if (!existsSync(p)) return
  const content = readFileSync(p, 'utf-8')
  const r = auditFile(content, p, ALLOWLIST)
  total += r.violations.length
  r.violations.forEach(v => console.log(`${v.path}:${v.line}: ${v.content}`))
})
console.log(`\nno-emoji-Audit: ${total} violations (${ALLOWLIST.size} allowlisted files)`)
if (process.argv.includes('--strict') && total > 0) process.exit(1)
```

- [ ] **Step 6.2: `no-emoji-baseline.json` — Allowlist**

```json
{
  "comment": "Files where emojis are intentional (test data, demo content, didactic Frage-Inhalt)",
  "allowlist": [
    "ExamLab/src/data/einrichtungsFragen.ts",
    "ExamLab/src/data/einrichtungsUebungFragen.ts",
    "ExamLab/src/data/demoKorrektur.ts",
    "ExamLab/src/tests/AntwortZeile.test.tsx",
    "ExamLab/src/tests/MCFrageLoesung.test.tsx",
    "ExamLab/src/tests/RichtigFalschFrageLoesung.test.tsx",
    "ExamLab/src/tests/SortierungEditorPflicht.test.tsx"
  ]
}
```

**Pre-Audit anpassen:** zwischen Sub-Task 1 und 6 schauen welche Files trotz Phase 4 noch Emojis haben (z.B. gamification.ts wenn Belohnung-Emojis behalten werden) und ggf. zur Allowlist hinzufügen.

- [ ] **Step 6.3: `audit-no-inline-svg.mjs` schreiben**

Analog `audit-no-emoji.mjs`. Whitelist-Pfade:
- `ExamLab/src/components/ui/icons/` (Custom-Icons)
- `ExamLab/src/components/fragetypen/pdf/` (Content-SVGs PDF-Annotation)
- `ExamLab/src/components/fragetypen/zeichnen/` (Canvas-SVG)
- `ExamLab/src/components/fragetypen/HotspotFrage.tsx` (Hotspot-Bilder)
- `ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx` (T-Konto-Render)
- `ExamLab/src/components/fragetypen/BuchungssatzFrage.tsx`
- `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/HotspotAnzeige.tsx`
- `ExamLab/src/components/fragetypen/MCFrage.tsx`
- `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx`
- `packages/shared/src/editor/typen/HotspotEditor.tsx`
- `packages/shared/src/editor/typen/DragDropBildEditor.tsx`
- `packages/shared/src/editor/components/ZonenOverlay.tsx`

- [ ] **Step 6.4: `package.json`-Scripts ergänzen**

```diff
   "lint:wire-contract": "node ../scripts/audit-wire-contract.mjs --strict",
+  "lint:no-emoji": "node ../scripts/audit-no-emoji.mjs --strict",
+  "lint:no-inline-svg": "node ../scripts/audit-no-inline-svg.mjs --strict",
-  "ci-check": "npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract && npm test && npm run build"
+  "ci-check": "npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract && npm run lint:no-emoji && npm run lint:no-inline-svg && npm test && npm run build"
```

Memory: `feedback_ci_gate_if_present.md` — bei neuen Gates aufprovision steht: erst lokal `--if-present` für chicken-and-egg. Aber hier ist es nach allen Migrations-Phasen, deshalb strict-mode OK direkt.

- [ ] **Step 6.5: `npm run ci-check` ausführen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run ci-check
```

Expected: alle Gates grün. Wenn `lint:no-emoji` Violations findet → entscheiden ob Phase 4 nachbessern oder Allowlist erweitern.

- [ ] **Step 6.6: Commit**

```bash
git add scripts/audit-no-emoji.mjs \
        scripts/audit-no-inline-svg.mjs \
        scripts/no-emoji-baseline.json \
        ExamLab/package.json
git commit -m "Cluster G Phase 6: Lint-Gates no-emoji + no-inline-svg"
```

---

## Sub-Task 7 — Browser-E2E + HANDOFF (~1h)

### Steps

- [ ] **Step 7.1: Push preview**

```bash
git push origin <feature-branch>
```

- [ ] **Step 7.2: GitHub-Pages-Deploy abwarten**

```bash
gh run watch <run-id> --exit-status
```

- [ ] **Step 7.3: Browser-E2E mit echtem LP-Login (Memory `feedback_echte_logins.md`)**

URL: `https://durandbourjate.github.io/GYM-WR-DUY/staging/`. Cache-Reset + `?nocache=<ts>`.

Verifikations-Liste:
- **LP-Header**: 5 Tabs (Favoriten/Prüfen/Üben/Fragensammlung/Papierkorb) mit Icons sichtbar
- **LP-Composer**: Frageliste zeigt FragetypIcon vor Titel
- **LP-FragenBrowser**: KompaktZeile + DetailKarte mit FragetypIcon
- **LP-MaterialPanel**: FileText/Link/Video-Icons statt Emojis
- **LP-Durchfuehren-Lobby/Aktiv/Beendet**: keine Emojis mehr
- **LP-Einstellungen Favoriten + Lernziele**: Icons statt Emojis
- **SuS-Login**: Übungs-Sicht ohne Emojis, Material-Icons, Stufen-Kontrolle mit Circle-Icons
- **Toast-Test**: Success/Warning/Error/Info zeigen Lucide-Icons

Bei sichtbarem Bug: Fix + Commit + Re-Deploy.

- [ ] **Step 7.4: Bundle-Größe Post-Phase-2-6**

```bash
npm run build 2>&1 | grep -E "kB|gzip" > /tmp/bundle-post.txt
diff /tmp/bundle-baseline.txt /tmp/bundle-post.txt
```

Erwartung: +~25-50KB gzipped (lucide-Icons). Über >100KB-Diff → in HANDOFF als Concern dokumentieren.

- [ ] **Step 7.5: HANDOFF-Update**

`ExamLab/HANDOFF.md` Sektion „📍 STAND" ergänzen:
- Cluster G Phase 2-6 LIVE
- Bundle-Größen-Delta
- Browser-E2E ✅
- Lint-Gates aktiv (no-emoji-baseline-Count)

`MEMORY.md` ergänzen — neue Lehren aus dem Cluster.

- [ ] **Step 7.6: Final Push + preview→main FF-Merge**

**Pre-Check (`feedback_preview_forcepush.md`):** vor FF-Merge sicherstellen dass preview keinen unbekannten Work-in-Progress hat:
```bash
git fetch origin
git log preview ^<feature-branch> --oneline  # MUSS leer sein, sonst nicht FF-mergen!
```

Wenn das nicht leer ist: preview hat Commits die der Feature-Branch nicht kennt → STOP, mit Controller klären.

```bash
git push origin <feature-branch>
git checkout preview && git merge --ff-only <feature-branch> && git push origin preview
git checkout main && git merge --ff-only preview && git push origin main
```

---

## Spawn-Tasks aus Cluster G (für Memory)

- **Storybook-Setup für Icon-Galerie** (Spec §13) — eigener Cluster
- **Visuelle Regression-Tests** vor/nach-Screenshots (Spec §12.2) — Out-of-Scope, eigener Cluster
- **Animierte Icons / Mikro-Interaktionen** (Spec §10) — Out-of-Scope
- **Icon-Sets pro Fach** (Spec §10) — Out-of-Scope
- **PWA-App-Icons / Favicon-Redesign** (Spec §10) — Out-of-Scope

---

## Memory-Patterns aktiv anwenden

| Pattern | Wo |
|---------|----|
| `feedback_sorgfalt.md` | Pre-Audit (Sub-Task 1) vor Implementation |
| `feedback_grep_anwesenheit_nicht_abwesenheit.md` | Sub-Task 1.4 FRAGETYP_ICON_MAP-Verifikation |
| `feedback_design_check_browser_e2e.md` | Sub-Task 7.3 Browser-E2E |
| `feedback_echte_logins.md` | Sub-Task 7.3 LP+SuS-Login |
| `feedback_pre_push_ci_check.md` | `npm run ci-check` vor jedem Push |
| `feedback_push_konflikt_rate.md` | 1 Push pro Sub-Task max |
| `feedback_ci_gate_if_present.md` | Sub-Task 6 Lint-Gate-Einführung |

---

## Architecture-Entscheidungen aus Spec (Quick-Ref)

| Spec § | Entscheidung |
|--------|--------------|
| §3 | Lucide-react + 5 Custom-Icons + FragetypIcon-Mapping (Phase 1 done) |
| §4.1 | Farb-Token: slate-500/violet-600/red-600/yellow-500/green-500 |
| §4.2 | Größen: xs=14, sm=16, md=20, lg=24 (currentColor) |
| §5.1-5.5 | Vollständiges Icon-Inventar (28 Header + 16 Aktion + 9 Status + 12 Domain + 20 Fragetypen) |
| §6 | Custom-Icons: viewBox 0 0 24 24, strokeWidth=2, currentColor |
| §7.3 | FRAGETYP_ICON_MAP TS-erzwungene Vollständigkeit |
| §10 | Out-of-Scope: Content-SVGs, Daten-Emojis, Storybook, Animations, PWA-Favicon |
| §12.4 | Lint-Gates als grep-Scripts (analog audit-wire-contract.mjs) |

---

**Plan complete. Bereit zur Ausführung via @superpowers:subagent-driven-development (7 Sub-Tasks).**
