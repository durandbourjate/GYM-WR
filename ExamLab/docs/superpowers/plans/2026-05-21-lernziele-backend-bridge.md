# Lernziele-Backend-Bridge — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editor und SuS-Anzeige teilen einen Lernziel-Store; ein im Editor erstelltes Lernziel inkl. Unterthema erscheint im SuS-Akkordeon mit korrektem Fortschritts-Status.

**Architecture:** Der `Lernziele`-Tab in `FRAGENSAMMLUNG_ID` wird der einzige Store mit kanonischem 8-Spalten-Schema. Sieben Apps-Script-Endpoints werden header-basiert auf diesen Tab umgebaut, der Editor (`LernzielTab`) bekommt die Unterthema-Ebene, ein Einmal-Migrationsskript führt die `Lehrplanziele`-Altdaten zusammen. Die drei `Lernziel`-Typen werden auf einen geteilten Typ vereinheitlicht.

**Tech Stack:** React/TypeScript/Vite (Frontend), Google Apps Script (Backend, V8-Runtime), Google Sheets (Datenspeicher).

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-21-lernziele-backend-bridge-design.md`

---

## Verifikation — gemischtes Projekt

Anders als reine Apps-Script-Projekte hat dieses Projekt zwei Schichten mit unterschiedlichen Gates:

- **Frontend** (`packages/shared`, `ExamLab/src/...`): `npx tsc -b` + `npx vitest run` + `npm run build` (jeweils aus `ExamLab/`). TDD gilt — Task 5 (Gruppierungs-Pure-Function) ist klassisches Test-First.
- **Apps-Script** (`apps-script-code.js`, `scripts/migrate-lernziele-bridge.js`): läuft nicht lokal. Gate = `node --check <datei>` (Syntax) + Code-Review. Laufzeit-Verifikation über den operativen Runbook (Teil B): `DRY_RUN`, Logger, Browser-E2E.

`tsc -b` ist CI-äquivalent (NICHT `tsc --noEmit`).

---

## File Structure

| Datei | Verantwortung |
|---|---|
| `packages/shared/src/types/fragen-core.ts` | **Modify.** Der eine geteilte `Lernziel`-Typ. |
| `ExamLab/src/types/pool.ts` | **Modify.** `Lernziel` re-exportiert den geteilten Typ. |
| `ExamLab/apps-script-code.js` | **Modify.** 6 Endpoints umgebaut + Helfer (`LERNZIEL_HEADERS`, `lernzielHeaderMap_`, `holeLernzieleSheet_`, `baueFragenProLernziel_`). |
| `ExamLab/src/utils/lernzieleGruppierung.ts` | **Create.** Pure-Function `gruppiereLernziele` (Fach→Thema→Unterthema). |
| `ExamLab/src/utils/lernzieleGruppierung.test.ts` | **Create.** Unit-Tests dazu. |
| `ExamLab/src/components/ueben/LernzieleAkkordeon.tsx` | **Modify.** Nutzt `gruppiereLernziele` + geteilten Typ. |
| `ExamLab/src/components/settings/LernzielTab.tsx` | **Modify.** Unterthema-Feld, 3-Ebenen-Gruppierung, Soft-Delete-Filter, geteilter Typ. |
| `ExamLab/scripts/migrate-lernziele-bridge.js` | **Create.** Einmal-Migration, `DRY_RUN`-Default. |

---

# TEIL A — Code-Implementierung (Subagent-ausführbar)

---

## Task 1: Geteilter `Lernziel`-Typ

Heute gibt es drei `Lernziel`-Typen (lokal in `LernzielTab`, in `types/pool`, in `@shared/types/fragen-core`). Dieser Task macht den `@shared`-Typ zum einzigen.

**Files:**
- Modify: `packages/shared/src/types/fragen-core.ts` (bestehender `Lernziel`-Typ)
- Modify: `ExamLab/src/types/pool.ts` (bestehender `Lernziel`-Typ ~Z. 64)

- [ ] **Step 1: `Lernziel` in `fragen-core.ts` zum kanonischen Typ machen**

Finde den bestehenden `export interface Lernziel` in `packages/shared/src/types/fragen-core.ts`. Stelle sicher, dass er exakt diese Form hat (Felder ergänzen, die fehlen — `unterthema`, `aktiv`, `poolId`):

```ts
/** Lernziel — geteilter Typ für Editor, SuS-Anzeige und Pool-Import. */
export interface Lernziel {
  id: string
  fach: string
  thema: string
  unterthema?: string
  text: string
  bloom: string
  poolId?: string
  aktiv?: boolean
  /** Berechnet (nicht gespeichert): von uebenLadeLernzieleV2 befüllt. */
  fragenIds?: string[]
}
```

- [ ] **Step 2: `types/pool.ts` auf den geteilten Typ umstellen**

Ersetze in `ExamLab/src/types/pool.ts` die lokale `export interface Lernziel { ... }` durch einen Re-Export:

```ts
export type { Lernziel } from '@shared/types/fragen-core'
```

- [ ] **Step 3: tsc prüfen**

Run: `cd ExamLab && npx tsc -b`
Expected: grün. Falls Fehler auftauchen (Konsumenten, die ein entferntes Feld wie `ebene` nutzen) — diese Stellen auf den geteilten Typ anpassen. `LernzielTab` wird in Task 6 umgestellt; falls hier schon `ebene`-Fehler in `LernzielTab` auftreten, in Task 6 mitlösen und hier `// @ts-expect-error`-frei lassen, indem nur die Typ-Datei + pool.ts geändert werden. Erwartung: additive Optional-Felder brechen nichts.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/fragen-core.ts ExamLab/src/types/pool.ts
git commit -m "refactor(lernziele): ein geteilter Lernziel-Typ

Lernziel in @shared/types/fragen-core wird der kanonische Typ
(unterthema, aktiv, poolId ergänzt); types/pool re-exportiert ihn."
```

---

## Task 2: Backend-Helfer + Editor-CRUD-Endpoints umhängen

Vier Editor-Endpoints werden vom `Lehrplanziele`-Sheet auf den `Lernziele`-Tab in `FRAGENSAMMLUNG_ID` umgehängt, alle header-basiert. Dazu kommen drei geteilte Helfer.

**Files:**
- Modify: `ExamLab/apps-script-code.js` — Helfer + `ladeLernziele` (~Z. 6995), `speichereLernzielEndpoint` (~Z. 7064), `aktualisiereLernzielEndpoint` (~Z. 7097), `loescheLernzielEndpoint` (~Z. 7134)

> Hinweis: Die genauen Funktionsnamen über den Dispatcher (`apps-script-code.js` doGet/doPost-Switch) für die Aktionen `ladeLernziele` / `speichereLernziel` / `aktualisiereLernziel` / `loescheLernziel` verifizieren. Der bestehende Helfer `getSheetData(sheet)` liefert Zeilen-Objekte, gekeyt nach exaktem Header-Namen. `LERNZIELE_TAB` (= `'Lernziele'`) und `FRAGENSAMMLUNG_ID` sind bestehende Konstanten.

- [ ] **Step 1: Geteilte Helfer einfügen**

Füge direkt vor `ladeLernziele` (oder im Lernziele-Abschnitt) ein:

```js
// Kanonisches Schema des Lernziele-Tabs (FRAGENSAMMLUNG_ID).
var LERNZIEL_HEADERS = ['id', 'fach', 'thema', 'unterthema', 'text', 'bloom', 'poolId', 'aktiv'];

/** Header-Namen → 0-basierter Spaltenindex. Schützt gegen leeres Sheet (S130). */
function lernzielHeaderMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  var headers = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];
  var map = {};
  for (var i = 0; i < headers.length; i++) map[headers[i]] = i;
  return map;
}

/** Öffnet (oder erstellt) den Lernziele-Tab mit kanonischem Header. */
function holeLernzieleSheet_(ss) {
  var sheet = ss.getSheetByName(LERNZIELE_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(LERNZIELE_TAB);
    sheet.getRange(1, 1, 1, LERNZIEL_HEADERS.length).setValues([LERNZIEL_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
```

- [ ] **Step 2: `ladeLernziele` ersetzen**

Ersetze den kompletten Funktionsrumpf durch (nur `Lernziele`-Tab, header-basiert, Lehrplanziele-Zweig fällt weg):

```js
function ladeLernziele(body) {
  try {
    var email = body.email;
    var fachFilter = body.fach || '';
    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var ss = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);
    var sheet = ss.getSheetByName(LERNZIELE_TAB);
    if (!sheet) return jsonResponse({ lernziele: [] });

    var data = getSheetData(sheet);
    var lernziele = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      if (fachFilter && row.fach !== fachFilter) continue;
      lernziele.push({
        id: row.id,
        fach: row.fach || '',
        thema: row.thema || '',
        unterthema: row.unterthema || '',
        text: row.text || '',
        bloom: row.bloom || '',
        poolId: row.poolId || '',
        aktiv: String(row.aktiv) !== 'false',
      });
    }
    return jsonResponse({ lernziele: lernziele });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
```

- [ ] **Step 3: `speichereLernzielEndpoint` ersetzen**

```js
function speichereLernzielEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var lz = body.lernziel;
    if (!lz || !lz.text || !lz.fach) {
      return jsonResponse({ error: 'Lernziel-Text und Fach sind Pflichtfelder' });
    }
    var ss = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);
    var sheet = holeLernzieleSheet_(ss);
    var col = lernzielHeaderMap_(sheet);

    var id = 'lz-' + (lz.fach || 'allg').toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now();
    var werte = {
      id: id, fach: lz.fach || '', thema: lz.thema || '', unterthema: lz.unterthema || '',
      text: lz.text, bloom: lz.bloom || 'K2', poolId: '', aktiv: 'true'
    };
    var maxIdx = 0;
    for (var k in col) { if (col[k] > maxIdx) maxIdx = col[k]; }
    var row = [];
    for (var c = 0; c <= maxIdx; c++) row.push('');
    for (var key in werte) { if (col[key] !== undefined) row[col[key]] = werte[key]; }
    sheet.appendRow(row);

    auditLog_('speichereLernziel:CREATE', email, { lernzielId: id, fach: lz.fach });
    return jsonResponse({ erfolg: true, id: id });
  } catch (e) {
    return jsonResponse({ error: 'Lernziel speichern: ' + e.message });
  }
}
```

- [ ] **Step 4: `aktualisiereLernzielEndpoint` ersetzen**

```js
function aktualisiereLernzielEndpoint(body) {
  try {
    var email = body.email || body.callerEmail;
    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var lz = body.lernziel;
    if (!lz || !lz.id) return jsonResponse({ error: 'Lernziel-ID fehlt' });

    var ss = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);
    var sheet = ss.getSheetByName(LERNZIELE_TAB);
    if (!sheet) return jsonResponse({ error: 'Lernziele-Tab nicht gefunden' });
    var col = lernzielHeaderMap_(sheet);
    if (col['id'] === undefined) return jsonResponse({ error: 'Lernziele-Tab ohne id-Spalte' });
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][col['id']]) === String(lz.id)) {
        var felder = ['fach', 'thema', 'unterthema', 'text', 'bloom'];
        for (var f = 0; f < felder.length; f++) {
          var name = felder[f];
          if (lz[name] !== undefined && col[name] !== undefined) {
            sheet.getRange(i + 1, col[name] + 1).setValue(lz[name]);
          }
        }
        auditLog_('aktualisiereLernziel:UPDATE', email, { lernzielId: lz.id });
        return jsonResponse({ erfolg: true, id: lz.id });
      }
    }
    return jsonResponse({ error: 'Lernziel nicht gefunden: ' + lz.id });
  } catch (e) {
    return jsonResponse({ error: 'Lernziel aktualisieren: ' + e.message });
  }
}
```

- [ ] **Step 5: `loescheLernzielEndpoint` ersetzen (Soft-Delete)**

```js
function loescheLernzielEndpoint(body) {
  try {
    var email = body.email || body.callerEmail;
    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var lernzielId = body.lernzielId;
    if (!lernzielId) return jsonResponse({ error: 'Lernziel-ID fehlt' });

    var ss = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);
    var sheet = ss.getSheetByName(LERNZIELE_TAB);
    if (!sheet) return jsonResponse({ error: 'Lernziele-Tab nicht gefunden' });
    var col = lernzielHeaderMap_(sheet);
    if (col['id'] === undefined || col['aktiv'] === undefined) {
      return jsonResponse({ error: 'Lernziele-Tab ohne id/aktiv-Spalte' });
    }
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][col['id']]) === String(lernzielId)) {
        sheet.getRange(i + 1, col['aktiv'] + 1).setValue('false');
        auditLog_('loescheLernziel:SOFTDELETE', email, { lernzielId: lernzielId });
        return jsonResponse({ erfolg: true });
      }
    }
    return jsonResponse({ error: 'Lernziel nicht gefunden: ' + lernzielId });
  } catch (e) {
    return jsonResponse({ error: 'Lernziel löschen: ' + e.message });
  }
}
```

- [ ] **Step 6: Syntax prüfen + Commit**

Run: `node --check "ExamLab/apps-script-code.js"`
Expected: kein Output, Exit-Code 0.

```bash
git add ExamLab/apps-script-code.js
git commit -m "feat(lernziele): Editor-CRUD auf Lernziele-Tab umhängen

ladeLernziele/speichereLernziel/aktualisiereLernziel auf den Lernziele-
Tab in FRAGENSAMMLUNG_ID umgestellt, header-basiert, mit unterthema.
loescheLernziel ist jetzt Soft-Delete (aktiv=false)."
```

---

## Task 3: `uebenSpeichereLernziel` Korruptions-Bug fixen

`uebenSpeichereLernziel` schreibt heute 6 Spalten positionsbasiert — bei einem 8-Spalten-Tab landen Werte in falschen Spalten. Header-basiert ersetzen.

**Files:**
- Modify: `ExamLab/apps-script-code.js` — `uebenSpeichereLernziel` (~Z. 12576)

- [ ] **Step 1: `uebenSpeichereLernziel` ersetzen**

```js
function uebenSpeichereLernziel(body) {
  var auth = istGruppenAdmin_(body, body.gruppeId);
  if (!auth) {
    auditLog_('speichereLernziel:DENIED', (body.email || ''), { gruppeId: body.gruppeId });
    return jsonResponse({ success: false, error: 'Keine Berechtigung' });
  }
  var gruppe = auth.gruppe;
  var lz = body.lernziel;
  if (!lz || !lz.id || !lz.text || !lz.fach) {
    return jsonResponse({ success: false, error: 'Lernziel-Daten unvollständig' });
  }
  try {
    var sheetId = gruppe.typ === 'familie' ? gruppe.fragensammlungSheetId : FRAGENSAMMLUNG_ID;
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = holeLernzieleSheet_(ss);
    var col = lernzielHeaderMap_(sheet);
    var data = sheet.getDataRange().getValues();

    var werte = {
      id: lz.id, fach: lz.fach, thema: lz.thema || '', unterthema: lz.unterthema || '',
      text: lz.text, bloom: lz.bloom || 'K2', poolId: lz.poolId || '',
      aktiv: lz.aktiv === false ? 'false' : 'true'
    };

    // Bestehend → Update (header-basiert)
    for (var i = 1; i < data.length; i++) {
      if (col['id'] !== undefined && String(data[i][col['id']]) === String(lz.id)) {
        for (var key in werte) {
          if (col[key] !== undefined) sheet.getRange(i + 1, col[key] + 1).setValue(werte[key]);
        }
        auditLog_('speichereLernziel:UPDATE', auth.email, { gruppeId: body.gruppeId, lernzielId: lz.id });
        return jsonResponse({ success: true, data: { id: lz.id } });
      }
    }

    // Neu → Append (header-basiert)
    var maxIdx = 0;
    for (var k in col) { if (col[k] > maxIdx) maxIdx = col[k]; }
    var row = [];
    for (var c = 0; c <= maxIdx; c++) row.push('');
    for (var key2 in werte) { if (col[key2] !== undefined) row[col[key2]] = werte[key2]; }
    sheet.appendRow(row);
    auditLog_('speichereLernziel:CREATE', auth.email, { gruppeId: body.gruppeId, lernzielId: lz.id });
    return jsonResponse({ success: true, data: { id: lz.id } });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Lernziel speichern: ' + e.message });
  }
}
```

- [ ] **Step 2: Syntax prüfen + Commit**

Run: `node --check "ExamLab/apps-script-code.js"` → Exit-Code 0.

```bash
git add ExamLab/apps-script-code.js
git commit -m "fix(lernziele): uebenSpeichereLernziel header-basiert statt positionsbasiert

Behebt Daten-Korruption: positionsbasiertes 6-Spalten-setValues schrieb
Werte in falsche Spalten, sobald der Tab 8 Spalten hatte."
```

---

## Task 4: `uebenLadeLernzieleV2` — `fragenIds` frisch berechnen

`uebenLadeLernzieleV2` berechnet `fragenIds` neu aus den `lernzielIds`-Spalten der Fragen-Tabs und filtert soft-gelöschte Lernziele.

**Files:**
- Modify: `ExamLab/apps-script-code.js` — `uebenLadeLernzieleV2` (~Z. 12529)

> `getFragensammlungTabs_()` ist eine bestehende Funktion (liefert die Fragen-Tab-Namen). Die alte `uebenLadeLernziele` V1 (~Z. 12380) bleibt unverändert — ein Cleanup ist nicht Teil dieses Plans.

- [ ] **Step 1: Helfer `baueFragenProLernziel_` einfügen**

Direkt vor `uebenLadeLernzieleV2`:

```js
/** Scannt die Fragen-Tabs einer Fragensammlung → Map Lernziel-ID → [Fragen-IDs]. */
function baueFragenProLernziel_(ss) {
  var map = {};
  // getFragensammlungTabs_() liefert die Tab-Namen der Haupt-Fragensammlung.
  // Für familie-Gruppen mit eigener fragensammlungSheetId kann die Liste
  // unvollständig sein — bewusst akzeptiert (Editor verwaltet nur die Haupt-Sammlung).
  var tabs = getFragensammlungTabs_();
  for (var t = 0; t < tabs.length; t++) {
    var sheet = ss.getSheetByName(tabs[t]);
    if (!sheet) continue;
    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;
    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var idIdx = headers.indexOf('id');
    var lzIdx = headers.indexOf('lernzielIds');
    if (idIdx < 0 || lzIdx < 0) continue;
    for (var i = 1; i < daten.length; i++) {
      var frageId = String(daten[i][idIdx] || '');
      if (!frageId) continue;
      var raw = String(daten[i][lzIdx] || '');
      if (!raw) continue;
      var ids = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      for (var j = 0; j < ids.length; j++) {
        if (!map[ids[j]]) map[ids[j]] = [];
        map[ids[j]].push(frageId);
      }
    }
  }
  return map;
}
```

- [ ] **Step 2: `uebenLadeLernzieleV2` ersetzen**

```js
function uebenLadeLernzieleV2(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!uebenValidiereToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }
  var gruppeId = body.gruppeId;
  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function (g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var sheetId = gruppe.typ === 'familie' ? gruppe.fragensammlungSheetId : FRAGENSAMMLUNG_ID;
    var ss = SpreadsheetApp.openById(sheetId);
    var lzSheet = ss.getSheetByName('Lernziele');
    if (!lzSheet) return jsonResponse({ success: true, data: [] });

    var daten = lzSheet.getDataRange().getValues();
    if (daten.length < 2) return jsonResponse({ success: true, data: [] });

    var headers = daten[0].map(function (h) { return String(h).toLowerCase().trim(); });
    var idIdx = headers.indexOf('id');
    var aktivIdx = headers.indexOf('aktiv');
    var utIdx = headers.indexOf('unterthema');
    var textIdx = headers.indexOf('text');
    var fachIdx = headers.indexOf('fach');
    var themaIdx = headers.indexOf('thema');
    var bloomIdx = headers.indexOf('bloom');

    var fragenProLernziel = baueFragenProLernziel_(ss);

    var lernziele = [];
    for (var i = 1; i < daten.length; i++) {
      if (aktivIdx >= 0 && String(daten[i][aktivIdx]) === 'false') continue; // Soft-Delete
      var lzId = String(daten[i][idIdx]);
      lernziele.push({
        id: lzId,
        text: String(daten[i][textIdx]),
        fach: String(daten[i][fachIdx]),
        thema: themaIdx >= 0 ? String(daten[i][themaIdx] || '') : '',
        unterthema: utIdx >= 0 ? String(daten[i][utIdx] || '') : '',
        bloom: bloomIdx >= 0 ? String(daten[i][bloomIdx] || 'K2') : 'K2',
        fragenIds: fragenProLernziel[lzId] || [],
      });
    }
    return jsonResponse({ success: true, data: lernziele });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Lernziele V2 laden: ' + e.message });
  }
}
```

- [ ] **Step 3: Syntax prüfen + Commit**

Run: `node --check "ExamLab/apps-script-code.js"` → Exit-Code 0.

```bash
git add ExamLab/apps-script-code.js
git commit -m "feat(lernziele): uebenLadeLernzieleV2 berechnet fragenIds frisch

fragenIds wird aus den lernzielIds-Spalten der Fragen-Tabs aufgebaut
statt aus einer (oft leeren) gespeicherten Spalte gelesen. Soft-
gelöschte Lernziele (aktiv=false) werden serverseitig gefiltert."
```

---

## Task 5: `gruppiereLernziele` Pure-Function + Tests

Die Fach→Thema→Unterthema-Gruppierung wird als getestete Pure-Function gebaut und von Akkordeon (Refactor) und Editor (neu) genutzt. Klassisches TDD.

**Files:**
- Create: `ExamLab/src/utils/lernzieleGruppierung.ts`
- Create: `ExamLab/src/utils/lernzieleGruppierung.test.ts`
- Modify: `ExamLab/src/components/ueben/LernzieleAkkordeon.tsx`

- [ ] **Step 1: Failing-Test schreiben**

`ExamLab/src/utils/lernzieleGruppierung.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { gruppiereLernziele } from './lernzieleGruppierung'
import type { Lernziel } from '@shared/types/fragen-core'

function lz(p: Partial<Lernziel>): Lernziel {
  return { id: 'x', fach: 'BWL', thema: 'T', text: 'txt', bloom: 'K2', ...p }
}

describe('gruppiereLernziele', () => {
  it('leere Eingabe → leeres Objekt', () => {
    expect(gruppiereLernziele([])).toEqual({})
  })

  it('Lernziel ohne unterthema landet in meta', () => {
    const g = gruppiereLernziele([lz({ id: 'a', fach: 'BWL', thema: 'Konjunktur' })])
    expect(g['BWL']['Konjunktur'].meta.map(l => l.id)).toEqual(['a'])
    expect(g['BWL']['Konjunktur'].unterthemen).toEqual({})
  })

  it('Lernziel mit unterthema landet unter unterthemen', () => {
    const g = gruppiereLernziele([lz({ id: 'b', thema: 'Konjunktur', unterthema: 'BIP' })])
    expect(g['BWL']['Konjunktur'].unterthemen['BIP'].map(l => l.id)).toEqual(['b'])
    expect(g['BWL']['Konjunktur'].meta).toEqual([])
  })

  it('fehlendes fach/thema → Fallback Andere/Allgemein', () => {
    const g = gruppiereLernziele([lz({ id: 'c', fach: '', thema: '' })])
    expect(g['Andere']['Allgemein'].meta.map(l => l.id)).toEqual(['c'])
  })

  it('mehrere Lernziele über Fächer/Themen/Unterthemen', () => {
    const g = gruppiereLernziele([
      lz({ id: '1', fach: 'BWL', thema: 'T1', unterthema: 'U1' }),
      lz({ id: '2', fach: 'BWL', thema: 'T1', unterthema: 'U1' }),
      lz({ id: '3', fach: 'BWL', thema: 'T1' }),
      lz({ id: '4', fach: 'VWL', thema: 'T2' }),
    ])
    expect(g['BWL']['T1'].unterthemen['U1'].map(l => l.id)).toEqual(['1', '2'])
    expect(g['BWL']['T1'].meta.map(l => l.id)).toEqual(['3'])
    expect(g['VWL']['T2'].meta.map(l => l.id)).toEqual(['4'])
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/utils/lernzieleGruppierung.test.ts`
Expected: FAIL — `gruppiereLernziele` existiert nicht.

- [ ] **Step 3: `gruppiereLernziele` implementieren**

`ExamLab/src/utils/lernzieleGruppierung.ts`:

```ts
import type { Lernziel } from '@shared/types/fragen-core'

export interface ThemaGruppe {
  /** Lernziele ohne Unterthema. */
  meta: Lernziel[]
  unterthemen: Record<string, Lernziel[]>
}
/** Fach → Thema → ThemaGruppe. */
export type LernzielGruppierung = Record<string, Record<string, ThemaGruppe>>

/** Gruppiert Lernziele nach Fach → Thema → Unterthema. */
export function gruppiereLernziele(lernziele: Lernziel[]): LernzielGruppierung {
  const result: LernzielGruppierung = {}
  for (const lz of lernziele) {
    const fach = lz.fach || 'Andere'
    const thema = lz.thema || 'Allgemein'
    if (!result[fach]) result[fach] = {}
    if (!result[fach][thema]) result[fach][thema] = { meta: [], unterthemen: {} }
    const gruppe = result[fach][thema]
    if (lz.unterthema) {
      if (!gruppe.unterthemen[lz.unterthema]) gruppe.unterthemen[lz.unterthema] = []
      gruppe.unterthemen[lz.unterthema].push(lz)
    } else {
      gruppe.meta.push(lz)
    }
  }
  return result
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/utils/lernzieleGruppierung.test.ts`
Expected: PASS (5 Tests).

- [ ] **Step 5: `LernzieleAkkordeon` auf den Helfer umstellen**

In `LernzieleAkkordeon.tsx`: Entferne die lokale `interface ThemaGruppe` und den inline `fachMap`-Aufbau (die `for (const lz of lernziele)`-Schleife). Ersetze durch:

```ts
import { gruppiereLernziele } from '../../utils/lernzieleGruppierung'
// ...
const fachMap = gruppiereLernziele(lernziele.filter(lz => lz.aktiv !== false))
```

Der restliche Render-Code (`faecher`, `fachMap[fach]`, `.meta`, `.unterthemen`) bleibt unverändert — die Struktur ist identisch.

- [ ] **Step 6: tsc + Tests + Commit**

Run: `cd ExamLab && npx tsc -b && npx vitest run src/utils/lernzieleGruppierung.test.ts`
Expected: tsc grün, 5 Tests grün.

```bash
git add ExamLab/src/utils/lernzieleGruppierung.ts ExamLab/src/utils/lernzieleGruppierung.test.ts ExamLab/src/components/ueben/LernzieleAkkordeon.tsx
git commit -m "feat(lernziele): gruppiereLernziele als geteilte Pure-Function

Fach→Thema→Unterthema-Gruppierung getestet extrahiert; LernzieleAkkordeon
nutzt sie statt inline-Logik."
```

---

## Task 6: `LernzielTab` — Unterthema-Ebene

Der Editor bekommt das `unterthema`-Feld, dreistufige Gruppierung und den Soft-Delete-Filter.

**Files:**
- Modify: `ExamLab/src/components/settings/LernzielTab.tsx`

- [ ] **Step 1: Typ + State umstellen**

> Vor dem Umstellen: `LernzielTab.tsx` nach jedem Feld der alten lokalen `interface Lernziel` durchsuchen (insb. ein evtl. verbliebenes `ebene`). Jeder Lesezugriff auf ein Feld, das der geteilte Typ nicht hat, wird ein `tsc -b`-Fehler (Step 5 fängt ihn) — diese Stellen mitentfernen.

- Entferne die lokale `interface Lernziel { ... }`. Importiere stattdessen: `import type { Lernziel } from '@shared/types/fragen-core'`.
- `neuDaten`-Initialwert um `unterthema: ''` ergänzen: `useState<Partial<Lernziel>>({ fach: '', thema: '', unterthema: '', text: '', bloom: 'K2' })`.
- In `startEdit`: `setEditDaten({ fach: lz.fach, thema: lz.thema, unterthema: lz.unterthema, text: lz.text, bloom: lz.bloom })`.
- Neuer State neben `expandedThemen`: `const [expandedUnterthemen, setExpandedUnterthemen] = useState<Set<string>>(new Set())` + eine `toggleUnterthema(key)`-Funktion analog `toggleThema`.

- [ ] **Step 2: Soft-Delete-Filter beim Laden**

In `ladeLernziele()`: `setLernziele((result?.lernziele || []).filter(l => l.aktiv !== false))`.

- [ ] **Step 3: `unterthema`-Eingabefelder ergänzen**

Im Erstellen-Formular nach dem Thema-Feld ein analoges Feld für `unterthema` einfügen (Freitext-Input, Label „Unterthema", optional, `placeholder="z.B. BIP, Inflation"`, schreibt `neuDaten.unterthema`). Im Bearbeiten-Formular (`editId === lz.id`-Zweig) das Grid um ein `unterthema`-Input erweitern (`editDaten.unterthema`).

- [ ] **Step 4: Dreistufige Gruppierung**

Ersetze die `gruppiert`-`useMemo` (heute `Map<string, Map<string, Lernziel[]>>`) durch:

```ts
import { gruppiereLernziele } from '../../utils/lernzieleGruppierung'
// ...
const gruppiert = useMemo(() => gruppiereLernziele(gefiltert), [gefiltert])
```

Passe den Render-Block an: Die äusserste Schleife iteriert `Object.entries(gruppiert)` (Fach). Die zweite Ebene iteriert die Themen. Die dritte Ebene rendert pro Thema **zuerst die `meta`-Lernziele** (ohne Unterthema, mit einer kleinen „Übergeordnet"-Überschrift wie im `LernzieleAkkordeon`), **dann je Unterthema** einen aufklappbaren Block (`expandedUnterthemen`, Key `\`${fach}::${thema}::${ut}\``) mit seinen Lernzielen. Die bestehende Lernziel-Zeilen-Darstellung (Bloom-Badge, Text, Bearbeiten/Löschen-Icons, Edit-Modus) wird pro Lernziel unverändert wiederverwendet — am besten in eine lokale `renderLernzielZeile(lz)`-Funktion ziehen, damit sie an beiden Stellen (meta + Unterthemen) gleich ist. Visuelle Referenz für die 3-Ebenen-Struktur: `LernzieleAkkordeon.tsx`.

- [ ] **Step 5: tsc + Build prüfen**

Run: `cd ExamLab && npx tsc -b && npm run build`
Expected: beide grün.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/components/settings/LernzielTab.tsx
git commit -m "feat(lernziele): LernzielTab mit Unterthema-Ebene

Editor erfasst unterthema, gruppiert Fach→Thema→Unterthema, filtert
soft-gelöschte Lernziele, nutzt den geteilten Lernziel-Typ."
```

---

## Task 7: Migrations-Skript

Einmal-Skript: führt `Lehrplanziele` in den `Lernziele`-Tab zusammen, dedupliziert, schreibt Frage-Referenzen um.

**Files:**
- Create: `ExamLab/scripts/migrate-lernziele-bridge.js`

- [ ] **Step 1: Skript schreiben**

```js
/**
 * MIGRATION: Lernziele-Backend-Bridge.
 *
 * Führt die Lehrplanziele-Altdaten (LEHRPLAN_SHEET_ID) in den Lernziele-Tab
 * (FRAGENSAMMLUNG_ID) zusammen, dedupliziert über (fach, text)-Exaktmatch und
 * schreibt die lernzielIds-Referenzen der Fragen auf die Survivor-IDs um.
 *
 * In ein Apps-Script-Projekt kopieren, das Zugriff auf BEIDE Tabellen hat,
 * und migriereLernzieleBridge() ausführen.
 *
 * SICHERHEIT: DRY_RUN ist DEFAULT (true). Vorher: Backup beider Tabellen.
 * Spec: ExamLab/docs/superpowers/specs/2026-05-21-lernziele-backend-bridge-design.md
 */

var DRY_RUN = true;  // <-- Auf false setzen für echtes Schreiben!

var MIG_FRAGENSAMMLUNG_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
var MIG_LEHRPLAN_ID = '1x3p_-_GjP25JvmCASh2TQSg0EhE0BD3MtHIy2xpo3Xo';
var MIG_TABS = ['BWL', 'VWL', 'Recht', 'Informatik'];
var MIG_HEADERS = ['id', 'fach', 'thema', 'unterthema', 'text', 'bloom', 'poolId', 'aktiv'];

function migriereLernzieleBridge() {
  var kombiniert = [];

  // 1. Bestehende Lernziele-Zeilen lesen (Quelle 'lernziele')
  var fragenSs = SpreadsheetApp.openById(MIG_FRAGENSAMMLUNG_ID);
  var lzSheet = fragenSs.getSheetByName('Lernziele');
  var ausLernziele = 0;
  if (lzSheet) {
    var lzRows = leseAlsObjekte_(lzSheet);
    for (var a = 0; a < lzRows.length; a++) {
      kombiniert.push(zuKanonisch_(lzRows[a], 'lernziele'));
      ausLernziele++;
    }
  }

  // 2. Lehrplanziele lesen (Quelle 'lehrplan')
  var ausLehrplan = 0;
  try {
    var lehrplanSheet = SpreadsheetApp.openById(MIG_LEHRPLAN_ID).getSheetByName('Lehrplanziele');
    if (lehrplanSheet) {
      var lpRows = leseAlsObjekte_(lehrplanSheet);
      for (var b = 0; b < lpRows.length; b++) {
        kombiniert.push(zuKanonisch_(lpRows[b], 'lehrplan'));
        ausLehrplan++;
      }
    }
  } catch (e) {
    Logger.log('Lehrplanziele nicht lesbar (übersprungen): ' + e.message);
  }

  // 3. Dedup über (fach, text)
  var gruppen = {};
  for (var c = 0; c < kombiniert.length; c++) {
    var lz = kombiniert[c];
    var key = (lz.fach || '') + '\u0000' + (lz.text || '');
    if (!gruppen[key]) gruppen[key] = [];
    gruppen[key].push(lz);
  }

  var survivors = [];
  var idRemap = {};   // verworfeneId → SurvivorId
  var merges = 0;
  for (var g in gruppen) {
    var liste = gruppen[g];
    var survivor = liste[0];
    for (var s = 1; s < liste.length; s++) {
      if (besser_(liste[s], survivor)) survivor = liste[s];
    }
    survivors.push(survivor);
    for (var d = 0; d < liste.length; d++) {
      if (liste[d].id !== survivor.id) {
        idRemap[liste[d].id] = survivor.id;
        merges++;
      }
    }
  }

  // 4. Frage-Referenzen umschreiben
  var refUmschreibungen = 0;
  for (var t = 0; t < MIG_TABS.length; t++) {
    var sheet = fragenSs.getSheetByName(MIG_TABS[t]);
    if (!sheet) continue;
    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;
    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var lzIdx = headers.indexOf('lernzielIds');
    if (lzIdx < 0) continue;
    for (var i = 1; i < daten.length; i++) {
      var raw = String(daten[i][lzIdx] || '');
      if (!raw) continue;
      var ids = raw.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      var neu = [];
      var gesehen = {};
      var geaendert = false;
      for (var j = 0; j < ids.length; j++) {
        var ziel = idRemap[ids[j]] || ids[j];
        if (ziel !== ids[j]) geaendert = true;
        if (!gesehen[ziel]) { gesehen[ziel] = true; neu.push(ziel); }
        else geaendert = true;
      }
      if (geaendert) {
        refUmschreibungen++;
        if (!DRY_RUN) sheet.getRange(i + 1, lzIdx + 1).setValue(neu.join(','));
      }
    }
  }

  // 5. Lernziele-Tab neu schreiben
  if (!DRY_RUN) {
    if (!lzSheet) {
      lzSheet = fragenSs.insertSheet('Lernziele');
    } else {
      lzSheet.clearContents();
    }
    var ausgabe = [MIG_HEADERS];
    for (var r = 0; r < survivors.length; r++) {
      var sv = survivors[r];
      ausgabe.push([sv.id, sv.fach, sv.thema, sv.unterthema, sv.text, sv.bloom, sv.poolId, sv.aktiv]);
    }
    lzSheet.getRange(1, 1, ausgabe.length, MIG_HEADERS.length).setValues(ausgabe);
    lzSheet.setFrozenRows(1);
  }

  // 6. Report
  Logger.log('=== MIGRATION Lernziele-Bridge — ' + (DRY_RUN ? 'DRY-RUN' : 'ECHT') + ' ===');
  Logger.log('Aus Lernziele-Tab gelesen: ' + ausLernziele);
  Logger.log('Aus Lehrplanziele gelesen: ' + ausLehrplan);
  Logger.log('Dedup-Merges (verworfene IDs): ' + merges);
  Logger.log('Survivor-Lernziele (finale Zeilen): ' + survivors.length);
  Logger.log('Fragen mit umgeschriebenen lernzielIds: ' + refUmschreibungen);
  if (DRY_RUN) Logger.log('DRY_RUN=true — nichts geschrieben. Auf false setzen für echt.');
}

/** Liest ein Sheet als Array von Objekten, gekeyt nach (getrimmtem) Header. */
function leseAlsObjekte_(sheet) {
  var daten = sheet.getDataRange().getValues();
  if (daten.length < 2) return [];
  var headers = daten[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < daten.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = daten[i][c];
    rows.push(obj);
  }
  return rows;
}

/** Mappt eine Roh-Zeile (Lernziele oder Lehrplanziele) auf das kanonische Schema. */
function zuKanonisch_(row, quelle) {
  var aktivRaw = row.aktiv;
  var aktiv = (aktivRaw === undefined || aktivRaw === '' || String(aktivRaw) !== 'false')
    ? 'true' : 'false';
  return {
    id: String(row.id || ''),
    fach: String(row.fach || ''),
    thema: String(row.thema || ''),
    unterthema: String(row.unterthema || ''),
    text: String(row.text || ''),
    bloom: String(row.bloom || ''),
    poolId: String(row.poolId || ''),
    aktiv: aktiv,
    _quelle: quelle,
  };
}

/** Survivor-Präferenz: native Lernziele-Zeile vor Lehrplan; sonst mehr gefüllte Felder. */
function besser_(kandidat, aktuell) {
  if (kandidat._quelle === 'lernziele' && aktuell._quelle !== 'lernziele') return true;
  if (kandidat._quelle !== 'lernziele' && aktuell._quelle === 'lernziele') return false;
  return gefuellt_(kandidat) > gefuellt_(aktuell);
}

function gefuellt_(lz) {
  var n = 0;
  if (lz.unterthema) n++;
  if (lz.bloom) n++;
  if (lz.poolId) n++;
  return n;
}
```

- [ ] **Step 2: Syntax prüfen + Commit**

Run: `node --check "ExamLab/scripts/migrate-lernziele-bridge.js"` → Exit-Code 0.

```bash
git add ExamLab/scripts/migrate-lernziele-bridge.js
git commit -m "feat(lernziele): Einmal-Migrationsskript Lernziele-Bridge

Führt Lehrplanziele in den Lernziele-Tab zusammen, dedupliziert über
(fach, text), schreibt lernzielIds-Referenzen der Fragen um. DRY_RUN-Default."
```

---

## Task 8: Finaler Gesamt-Check

**Files:** keine — nur Verifikation.

- [ ] **Step 1: Frontend-Gates**

Run: `cd ExamLab && npx tsc -b && npx vitest run && npm run build`
Expected: tsc grün, alle Tests grün (inkl. der 5 neuen `lernzieleGruppierung`-Tests), Build erfolgreich.

- [ ] **Step 2: Apps-Script-Syntax**

Run: `node --check "ExamLab/apps-script-code.js" && node --check "ExamLab/scripts/migrate-lernziele-bridge.js"`
Expected: kein Output, Exit-Code 0.

- [ ] **Step 3: Konsistenz-Durchsicht**

Lies die geänderten Endpoints in `apps-script-code.js` durch und prüfe: alle Lernziele-Zugriffe sind header-basiert (kein positionsbasiertes `setValues`/`getRange` auf feste Spaltennummern für den `Lernziele`-Tab), `loescheLernziel` setzt `aktiv=false` (kein `deleteRow`), `uebenLadeLernzieleV2` filtert `aktiv=false`.

---

# TEIL B — Operativer Runbook (👤 nur LP, nicht Subagent-ausführbar)

Deploy + Migration brauchen Google-Account + Apps-Script-Editor. Ein Wartungsfenster, **keine aktiven Prüfungen** (`deployment-workflow.md`).

## R1 — Vorbereitung

- [ ] Backup: Kopie der Fragensammlung-Tabelle (`FRAGENSAMMLUNG_ID`) **und** der Lehrplan-Tabelle (`LEHRPLAN_SHEET_ID`) erstellen (Datei → Kopie erstellen).
- [ ] Aktuelle Apps-Script-Bereitstellungs-Nummer notieren (für Rollback).

## R2 — Deploy (Backend + Frontend zusammen)

- [ ] Feature-Branch nach Browser-Verifikation + LP-Freigabe nach `main` mergen → GitHub Actions deployt das Frontend.
- [ ] `apps-script-code.js` ins Web-App-Apps-Script-Projekt übernehmen → **neue Bereitstellung** erstellen.
- [ ] Verifizieren, dass Frontend und Backend dieselbe Version sind.

## R3 — Migration

- [ ] `migrate-lernziele-bridge.js` in ein Apps-Script-Projekt kopieren, das Zugriff auf beide Tabellen hat.
- [ ] `migriereLernzieleBridge()` mit `DRY_RUN=true` ausführen → Protokolle lesen: Zeilen je Quelle, Dedup-Merges, Survivor-Zahl, Referenz-Umschreibungen. Plausibilität prüfen.
- [ ] `DRY_RUN` auf `false` setzen → `migriereLernzieleBridge()` ausführen.
- [ ] Im `Lernziele`-Tab kontrollieren: kanonischer Header, Zeilen vorhanden.

## R4 — E2E-Verifikation (echte Logins, kein Demo-Modus)

- [ ] **LP:** Einstellungen → Lernziele-Tab. Bisherige (migrierte) Lernziele sichtbar? Neues Lernziel mit Fach + Thema + **Unterthema** erstellen. Bearbeiten. Eines soft-löschen → verschwindet aus der Liste.
- [ ] **LP:** Eine Frage im Frageneditor mit dem neuen Lernziel verknüpfen (`LernzielWaehler`).
- [ ] **SuS:** Lernziele-Akkordeon öffnen → das neue Lernziel erscheint unter Fach → Thema → Unterthema.
- [ ] **SuS:** Die verknüpfte Frage üben → der Lernziel-Status wechselt von „offen" weg (Frisch-Berechnung von `fragenIds` wirkt).
- [ ] **Regression:** Pool-importierte Lernziele erscheinen weiter; ein Pool-Import (`importiereLernziele`) funktioniert.
- [ ] Console: keine Errors. Network: keine 4xx/5xx auf Lernziel-Endpoints.

## R5 — Abschluss

- [ ] HANDOFF.md aktualisieren. Bei Problemen: alte Apps-Script-Bereitstellung reaktivieren, Frontend via Revert-Commit zurückrollen.

---

## Offene Punkte

- `uebenLadeLernziele` V1 (`apps-script-code.js:12380`) bleibt unangetastet — ein Cleanup ist nicht Teil dieses Plans.
- `importiereLernziele` schreibt bereits header-basiert das kanonische 8-Spalten-Schema — keine Änderung nötig; in Task 8 Step 3 mit-durchsehen.
- Das Volumen der `Lehrplanziele`-Altdaten wird erst im Migrations-DRY-RUN (R3) sichtbar.
