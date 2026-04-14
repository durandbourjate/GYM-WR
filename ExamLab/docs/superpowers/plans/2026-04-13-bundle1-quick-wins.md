# Bundle 1 — Quick Wins: Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6 isolierte UI-Korrekturen in ExamLab umsetzen (Labels, Layout, Icons entfernen).

**Architecture:** Reine UI-Änderungen in bestehenden Komponenten. Kein neuer State, keine neuen Dateien, keine API-Änderungen. Jede Task ist unabhängig.

**Wichtig:** Dateien unter `packages/shared/` liegen im Repo-Root, NICHT unter `ExamLab/`. Git-Befehle für diese Dateien vom Repo-Root ausführen oder relative Pfade verwenden (`../packages/shared/...`).

**Tech Stack:** React 19 + TypeScript + Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-04-13-bundle1-quick-wins-design.md`

---

### Task 1: N17 — "Fachbereich" → "Fach" im Dropdown

**Files:**
- Modify: `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx:339`

- [ ] **Step 1: Erstelle Feature Branch**

```bash
cd ExamLab && git checkout -b feature/bundle1-quick-wins
```

- [ ] **Step 2: Ändere das Label**

In `FragenBrowserHeader.tsx` Zeile 339:
```tsx
// ALT:
<option value="fachbereich">Fachbereich</option>
// NEU:
<option value="fachbereich">Fach</option>
```

- [ ] **Step 3: Build-Check**

```bash
npx tsc -b && npx vitest run && npm run build
```
Erwartet: Alles grün (reine String-Änderung).

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx
git commit -m "N17: Dropdown-Label 'Fachbereich' → 'Fach'"
```

---

### Task 2: N18 — Icons bei Fragetypen entfernen

**Files:**
- Modify: `packages/shared/src/editor/components/FrageTypAuswahl.tsx:8-12,14-45,95-96`

- [ ] **Step 1: Interface anpassen**

In `FrageTypAuswahl.tsx` Zeile 8-12 — `icon` Feld entfernen:
```tsx
// ALT:
interface Kategorie {
  label: string
  icon: string
  typen: FrageTyp[]
}

// NEU:
interface Kategorie {
  label: string
  typen: FrageTyp[]
}
```

- [ ] **Step 2: Icons aus KATEGORIEN entfernen**

In `FrageTypAuswahl.tsx` Zeilen 14-45 — alle Zeilen die mit `icon:` beginnen entfernen (enthalten Unicode-Escapes wie `'\u{1F4DD}'`):
```tsx
const KATEGORIEN: Kategorie[] = [
  {
    label: 'Text & Sprache',
    typen: ['freitext', 'lueckentext', 'audio'],
  },
  {
    label: 'Auswahl & Zuordnung',
    typen: ['mc', 'richtigfalsch', 'zuordnung', 'sortierung'],
  },
  {
    label: 'Bilder & Medien',
    typen: ['hotspot', 'bildbeschriftung', 'dragdrop_bild', 'visualisierung', 'pdf'],
  },
  {
    label: 'MINT',
    typen: ['berechnung', 'code', 'formel'],
  },
  {
    label: 'Buchhaltung',
    typen: ['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur'],
  },
  {
    label: 'Struktur',
    typen: ['aufgabengruppe'],
  },
]
```

- [ ] **Step 3: Rendering anpassen**

In `FrageTypAuswahl.tsx` Zeile 96:
```tsx
// ALT:
{kat.icon} {kat.label}
// NEU:
{kat.label}
```

- [ ] **Step 4: Build-Check**

```bash
npx tsc -b && npx vitest run && npm run build
```
Erwartet: Alles grün.

- [ ] **Step 5: Commit**

```bash
cd .. && git add packages/shared/src/editor/components/FrageTypAuswahl.tsx
git commit -m "N18: Icons bei Fragetyp-Kategorien entfernt"
```

---

### Task 3: N10 — Übungs-Themen-Labels umbenennen

**Files:**
- Modify: `src/components/ueben/admin/AdminThemensteuerung.tsx:245-255`

- [ ] **Step 1: Labels ändern**

In `AdminThemensteuerung.tsx` Zeilen 253-254:
```tsx
// ALT:
{eintrag.status === 'aktiv' ? (istPartiell ? 'z.T. aktiv' : 'Aktiv') :
 eintrag.status === 'abgeschlossen' ? 'Abgeschl.' : 'Nicht freig.'}

// NEU:
{eintrag.status === 'aktiv' ? (istPartiell ? 'z.T. aktuell' : 'Aktuell') :
 eintrag.status === 'abgeschlossen' ? 'Freigegeben' : null}
```

- [ ] **Step 2: Badge für nicht-freigeschaltet entfernen**

Das `null` aus Step 1 rendert nichts im Span, aber der Span selbst (mit Styling Zeilen 245-252) bleibt. Das gesamte Badge soll für `nicht_freigeschaltet` entfallen. Dafür die Logik umstrukturieren — den Span nur rendern wenn Status `aktiv` oder `abgeschlossen` ist:

```tsx
// Die Zeilen 245-257 ersetzen mit:
{(eintrag.status === 'aktiv' || eintrag.status === 'abgeschlossen') && (
  <span className={`text-xs px-2 py-0.5 rounded-full ${
    eintrag.status === 'aktiv'
      ? (istPartiell
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300')
      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
  }`}>
    {eintrag.status === 'aktiv'
      ? (istPartiell ? 'z.T. aktuell' : 'Aktuell')
      : 'Freigegeben'}
  </span>
)}
```

Hinweis: Die Zeilen 245-257 sind in einem IIFE `(() => { ... })()` gewrappt. Dieses IIFE kann vereinfacht werden zu einem direkten Conditional.

- [ ] **Step 3: Grep nach weiteren Übungs-Labels**

```bash
grep -rn "'Aktiv'\|'aktiv'\|'Abgeschl\.\|'Nicht freig\." src/components/ueben/ --include="*.tsx"
```
Erwartet: Nur AdminThemensteuerung.tsx. Falls weitere Stellen → auch anpassen.

- [ ] **Step 4: Build-Check**

```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ueben/admin/AdminThemensteuerung.tsx
git commit -m "N10: Übungs-Labels 'Aktiv'→'Aktuell', 'Abgeschl.'→'Freigegeben'"
```

---

### Task 4: N13 — Fach-Farbpunkt nach links (SuS ThemaKarte)

**Files:**
- Modify: `src/components/ueben/ThemaKarte.tsx:112-117`

- [ ] **Step 1: Farbpunkt vor den Themennamen verschieben**

In `ThemaKarte.tsx` Zeilen 112-117:
```tsx
// ALT:
<div className="flex items-start justify-between gap-2 mb-2">
  <span className="font-semibold dark:text-white text-sm leading-tight">{thema}</span>
  {!istAktiv && !istGesperrt && (
    <span className="shrink-0 w-3 h-3 rounded-full mt-1" style={{ backgroundColor: farbe }} />
  )}
</div>

// NEU:
<div className="flex items-start gap-2 mb-2">
  {!istAktiv && !istGesperrt && (
    <span className="shrink-0 w-3 h-3 rounded-full mt-1" style={{ backgroundColor: farbe }} />
  )}
  <span className="font-semibold dark:text-white text-sm leading-tight">{thema}</span>
</div>
```

Änderungen: (a) `justify-between` entfernt (nicht mehr nötig wenn Punkt links ist), (b) Farbpunkt-Span vor den Titel verschoben.

- [ ] **Step 2: Build-Check**

```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ueben/ThemaKarte.tsx
git commit -m "N13: Fach-Farbpunkt links vom Themennamen (SuS-Ansicht)"
```

---

### Task 5: N3 — Fragensammlung-Button auf Dashboard ausblenden

**Files:**
- Modify: `src/components/lp/LPHeader.tsx:128-132`

- [ ] **Step 1: Bedingung erweitern**

In `LPHeader.tsx` Zeilen 128-132 — Button nur rendern wenn Tabs NICHT sichtbar sind:
```tsx
// ALT:
{onFragensammlung && (
  <Tooltip text="Fragensammlung öffnen" position="bottom">
    <button onClick={onFragensammlung} className={buttonClass}>Fragensammlung</button>
  </Tooltip>
)}

// NEU:
{onFragensammlung && !(istDashboard && !zurueck) && (
  <Tooltip text="Fragensammlung öffnen" position="bottom">
    <button onClick={onFragensammlung} className={buttonClass}>Fragensammlung</button>
  </Tooltip>
)}
```

Logik: `!(istDashboard && !zurueck)` = Button nur wenn Tabs nicht sichtbar. Tabs werden gezeigt bei `istDashboard && !zurueck` (Zeile 108). Genau dann verstecken wir den Button.

- [ ] **Step 2: Prüfe ob `istDashboard` und `zurueck` als Props verfügbar sind**

Diese werden bereits in der Komponente verwendet (Zeile 108). Keine neuen Props nötig.

- [ ] **Step 3: Build-Check**

```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/LPHeader.tsx
git commit -m "N3: Fragensammlung-Button nur auf Sub-Pages (nicht doppelt auf Dashboard)"
```

---

### Task 6: N5+N6 — Bildvorschau entfernen, Textbutton neben URL

**Files:**
- Modify: `packages/shared/src/editor/components/BildUpload.tsx:105-123` (Vorschau entfernen)
- Modify: `packages/shared/src/editor/components/BildUpload.tsx:165-178` (URL-Zeile erweitern)
- **Nicht anfassen:** Zeilen 124-164 (Upload-Dropzone bleibt unverändert)

- [ ] **Step 1: Bildvorschau-Block entfernen**

In `BildUpload.tsx` Zeilen 105-123 komplett entfernen:
```tsx
// ENTFERNEN:
{/* Vorschau wenn Bild vorhanden */}
{bildUrl && (
  <div className="relative inline-block">
    <img ... />
    <button ... >×</button>
  </div>
)}
```

- [ ] **Step 2: URL-Zeile erweitern mit "Bild entfernen" und "(Bild geladen)"**

In `BildUpload.tsx` die URL-Zeile (Zeilen 165-178) ersetzen:
```tsx
{/* URL-Eingabe als Alternative + Bild-Aktionen */}
<div className="flex items-center gap-2">
  <span className="text-xs text-slate-400 dark:text-slate-500">oder</span>
  <input
    type="text"
    value={bildUrl.startsWith('data:') ? '' : bildUrl}
    onChange={(e) => {
      setBildUrl(e.target.value)
      setBildDriveFileId?.(undefined)
    }}
    className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
    placeholder="Bild-URL einfügen (https://...)"
  />
  {bildUrl && bildUrl.startsWith('data:') && (
    <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">(Bild geladen)</span>
  )}
  {bildUrl && (
    <button
      type="button"
      onClick={handleEntfernen}
      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 whitespace-nowrap cursor-pointer"
    >
      Bild entfernen
    </button>
  )}
</div>
```

Änderungen: (a) "(Bild geladen)" bei Data-URL-Uploads, (b) "Bild entfernen" Textbutton rechts, nur wenn bildUrl gesetzt.

- [ ] **Step 3: Build-Check**

```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd .. && git add packages/shared/src/editor/components/BildUpload.tsx
git commit -m "N5+N6: Bildvorschau entfernt, 'Bild entfernen' neben URL-Feld"
```

---

### Task 7: Finale Prüfung + Merge-Vorbereitung

- [ ] **Step 1: Gesamter Build-Check**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```
Erwartet: Alles grün.

- [ ] **Step 2: Browser-Test gemäss Testplan**

Gemäss Spec-Testplan alle 6 Änderungen im Browser verifizieren (Light + Dark Mode).

- [ ] **Step 3: HANDOFF.md aktualisieren**

Session-Eintrag mit erledigten Tasks, geänderten Dateien, offenen Punkten.

- [ ] **Step 4: User-Freigabe abwarten, dann Merge**

```bash
git checkout main && git merge feature/bundle1-quick-wins && git push
git branch -d feature/bundle1-quick-wins
```
