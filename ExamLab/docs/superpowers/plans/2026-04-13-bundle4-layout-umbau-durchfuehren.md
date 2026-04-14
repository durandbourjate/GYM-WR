# Bundle 4: Layout-Umbau Durchführen — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suchfeld in die Tab-Zeile verschieben (rechtsbündig), CTA-Buttons in die Filterzeile verschieben und einheitlich als primary stylen.

**Architecture:** Rein visuelle Änderungen in LPStartseite.tsx und FragenBrowserHeader.tsx. Keine Logik-Änderungen. Shared `Button`-Komponente verwenden statt inline Styles.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shared `Button` component

**Spec:** `docs/superpowers/specs/2026-04-13-bundle4-layout-umbau-durchfuehren-design.md`

**Voraussetzung:** `cursor-pointer` fehlt in Button.tsx Base-Classes. In Task 2 Step 1 wird Button.tsx um `cursor-pointer` ergänzt, damit alle Button-Varianten korrekte Cursor-Darstellung haben.

---

### Task 1: Prüfen — Suchfeld in Tab-Zeile verschieben

**Files:**
- Modify: `src/components/lp/LPStartseite.tsx` (Prüfen-Block ~Zeile 609-715)

**Aktuell:** Tab-Zeile (Prüfungen/Analyse) in eigenem `div`, darunter ein `<div className="space-y-2">` mit Suchfeld+Sort-Dropdown und darunter die Filter-Zeile.

**Ziel:** Tab-Zeile und Suchfeld auf EINER Zeile. Sort-Dropdown wandert in die Filter-Zeile. Der `space-y-2`-Wrapper bleibt (enthält weiterhin die Filter-Zeile).

- [ ] **Step 1: Tab-Zeile umbauen — Suchfeld integrieren**

Die Tab-Zeile (~Zeile 611-635) von:
```tsx
<div className="px-6 pt-4">
  <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
    {/* Prüfungen-Tab */}
    {/* Analyse-Tab */}
  </div>
</div>
```

Zu:
```tsx
<div className="px-6 pt-4">
  <div className="flex items-center justify-between gap-4">
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
      {/* Prüfungen-Tab — unverändert */}
      {/* Analyse-Tab — unverändert */}
    </div>
    <input
      type="text"
      placeholder="Suche nach Titel, Klasse oder ID..."
      value={suchtext}
      onChange={(e) => setSuchtext(e.target.value)}
      className="input-field max-w-xs flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
    />
  </div>
</div>
```

- [ ] **Step 2: Altes Suchfeld + Sort-Dropdown Zeile entfernen**

Innerhalb des `<div className="space-y-2">`-Wrappers (~Zeile 684): Das innere `<div className="flex items-center gap-3">` entfernen (enthält `<input>` + `<select>`). Den `space-y-2`-Wrapper BEHALTEN — er enthält weiterhin die Filter-Zeile darunter.

- [ ] **Step 3: Sort-Dropdown in Filter-Zeile verschieben**

Das `<select>` für Sortierung in die Filter-Zeile (~Zeile 703) einfügen, VOR dem CTA-Button (der in Task 2 kommt). Die Filter-Zeile enthält aktuell Fach-Buttons + Gefäss-Buttons + Status-Buttons. Sort-Dropdown am Ende der Filter-Zeile (vor dem CTA) einfügen.

In der Filter-Zeile (`<div className="flex items-center gap-1.5 flex-wrap">`):
Nach dem letzten Status-Button und vor dem schliessenden `</div>` einfügen:
```tsx
<span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
<select
  value={sortierung}
  onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
>
  <option value="datum">Neueste zuerst</option>
  <option value="titel">Nach Titel</option>
  <option value="klasse">Nach Klasse</option>
</select>
```

- [ ] **Step 4: tsc + vitest prüfen**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: Alles grün

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/LPStartseite.tsx
git commit -m "Bundle 4: Prüfen — Suchfeld in Tab-Zeile, Sort in Filter-Zeile"
```

---

### Task 2: Prüfen — CTA-Button in Filterzeile + primary Style

**Files:**
- Modify: `src/components/lp/LPStartseite.tsx` (~Zeile 410-425 + Filter-Zeile)

- [ ] **Step 1: Button.tsx — `cursor-pointer` ergänzen + Import in LPStartseite**

In `src/components/ui/Button.tsx` (~Zeile 36), `cursor-pointer` zu den Base-Classes hinzufügen:
```tsx
className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer
```

Dann in LPStartseite.tsx importieren:
```tsx
import Button from '../ui/Button.tsx'
```

- [ ] **Step 2: aktionsButtons für Prüfen entfernen**

In der `aktionsButtons`-Prop (~Zeile 410-425), den `modus === 'pruefung'`-Fall entfernen. Stattdessen `undefined` für Prüfen liefern:
```tsx
aktionsButtons={
  modus === 'uebung' ? (
    <button onClick={handleNeueUebung} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
      + Neue Übung
    </button>
  ) : undefined
}
```

- [ ] **Step 3: CTA-Button in Prüfen-Filterzeile einfügen**

Am Ende der Filter-Zeile (nach dem Sort-Dropdown aus Task 1), mit `ml-auto` für rechtsbündig:
```tsx
<Button variant="primary" size="sm" onClick={handleNeue} className="ml-auto whitespace-nowrap">
  + Neue Prüfung
</Button>
```

- [ ] **Step 4: Empty-State Button umstellen**

Den Empty-State Button (~Zeile 670) von inline `<button>` auf:
```tsx
<Button variant="primary" size="md" onClick={handleNeue}>
  + Neue Prüfung erstellen
</Button>
```

- [ ] **Step 5: tsc + vitest prüfen**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: Alles grün

- [ ] **Step 6: Commit**

```bash
git add src/components/lp/LPStartseite.tsx
git commit -m "Bundle 4: Prüfen — CTA in Filterzeile + Button primary"
```

---

### Task 3: Üben — Suchfeld in Tab-Zeile + CTA in Filterzeile

**Files:**
- Modify: `src/components/lp/LPStartseite.tsx` (Üben-Block ~Zeile 439-520)

Identisches Pattern wie Task 1+2, aber für den Üben-Block.

**Hinweis:** Nach Task 1+2 haben sich die Zeilennummern verschoben. Die Üben-Tabs starten aktuell bei ~Zeile 439.

- [ ] **Step 1: Üben Tab-Zeile umbauen — Suchfeld integrieren**

Die Tab-Zeile (~Zeile 439-472) analog zu Task 1 umbauen:
```tsx
<div className="px-6 pt-4">
  <div className="flex items-center justify-between gap-4">
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
      {/* Durchführen-Tab — unverändert */}
      {/* Übungen-Tab — unverändert */}
      {/* Analyse-Tab — unverändert */}
    </div>
    <input
      type="text"
      placeholder="Suche nach Titel, Klasse oder ID..."
      value={suchtext}
      onChange={(e) => setSuchtext(e.target.value)}
      className="input-field max-w-xs flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
    />
  </div>
</div>
```

- [ ] **Step 2: Altes Suchfeld + Sort-Dropdown Zeile entfernen**

Das `<div className="flex items-center gap-3">` mit Suchfeld + Sort (~Zeile 498-515) entfernen. Den `space-y-2`-Wrapper BEHALTEN (enthält die Filter-Zeile).

- [ ] **Step 3: Sort-Dropdown + CTA in Üben-Filterzeile einfügen**

Analog zu Task 1 Step 3 + Task 2 Step 3: Sort-Dropdown und CTA-Button am Ende der Filter-Zeile:
```tsx
<span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
<select
  value={sortierung}
  onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
>
  <option value="datum">Neueste zuerst</option>
  <option value="titel">Nach Titel</option>
  <option value="klasse">Nach Klasse</option>
</select>
<Button variant="primary" size="sm" onClick={handleNeueUebung} className="ml-auto whitespace-nowrap">
  + Neue Übung
</Button>
```

- [ ] **Step 4: aktionsButtons für Üben entfernen**

In der `aktionsButtons`-Prop den Üben-Fall entfernen. Da Prüfen schon in Task 2 entfernt wurde, wird die ganze Prop zu `undefined`:
```tsx
aktionsButtons={undefined}
```
Oder die Prop komplett weglassen.

- [ ] **Step 5: Empty-State Button umstellen**

Den Empty-State Button (~Zeile 496) auf:
```tsx
<Button variant="primary" size="md" onClick={handleNeueUebung}>
  + Neue Übung erstellen
</Button>
```

- [ ] **Step 6: tsc + vitest prüfen**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: Alles grün

- [ ] **Step 7: Commit**

```bash
git add src/components/lp/LPStartseite.tsx
git commit -m "Bundle 4: Üben — Suchfeld in Tab-Zeile, CTA in Filterzeile"
```

---

### Task 4: FragenBrowserHeader — "+Neue Frage" Button primary

**Files:**
- Modify: `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx` (~Zeile 105-115)

- [ ] **Step 1: Button-Import hinzufügen**

```tsx
import Button from '../../../ui/Button.tsx'
```

- [ ] **Step 2: "+Neue Frage" Button ersetzen**

Von (~Zeile 107-111):
```tsx
<button
  onClick={onNeueFrageErstellen}
  className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
>
  + Neue Frage
</button>
```

Zu:
```tsx
<Button variant="primary" size="sm" onClick={onNeueFrageErstellen}>
  + Neue Frage
</Button>
```

- [ ] **Step 3: tsc + vitest + build prüfen**

Run: `cd ExamLab && npx tsc -b && npx vitest run && npm run build`
Expected: Alles grün

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx
git commit -m "Bundle 4: Fragensammlung — +Neue Frage als Button primary"
```

---

### Task 5: Finaler Build + HANDOFF aktualisieren

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Finaler Build**

Run: `cd ExamLab && npx tsc -b && npx vitest run && npm run build`
Expected: Alles grün

- [ ] **Step 2: HANDOFF.md aktualisieren**

Session 101 Eintrag hinzufügen mit erledigten Arbeiten (N15, N16). Bundle 4 in der offenen Tabelle als ✅ markieren.

- [ ] **Step 3: Commit + Push**

```bash
git add -A
git commit -m "Bundle 4: Layout-Umbau Durchführen (N15, N16)"
git push
```
