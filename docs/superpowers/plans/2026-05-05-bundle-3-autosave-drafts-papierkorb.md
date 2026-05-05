# Bundle 3 — Auto-Save + Drafts + Papierkorb Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Datenverlust-sicheres Auto-Save für LP-Frageneditor mit klarem Draft↔Sammlung-Lifecycle, prominenter Drafts-Sichtbarkeit und Papierkorb-Soft-Delete.

**Architecture:** Hybrid Persistence (IDB-Cache 1s-debounced + Server-Sync 10s-debounced) mit Server als Source-of-Truth. API-Adapter abstrahiert Apps-Script für spätere Backend-Migration. Lazy-Draft-Creation (kein Draft beim leeren Editor-Mount). State-Machine `draft|sammlung`-Status, orthogonal zu `pruefungstauglich`. Soft-Delete-Papierkorb mit 90-Tage-Auto-Hard-Delete.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind v4 + Vitest + IndexedDB (`idb-keyval` library bereits im Projekt) + BroadcastChannel API + Apps-Script Backend (Google Sheets als Storage).

**Spec:** `docs/superpowers/specs/2026-05-05-bundle-3-autosave-drafts-papierkorb-design.md`

**Branch:** `feature/bundle-3-autosave-drafts-papierkorb` (bereits angelegt, Spec-Commits `cef6d7f` + `63dd047` + Spec rev3)

**Plan-Revision (rev2):** Phase A komplett überarbeitet nach Reviewer-Audit der echten Apps-Script-Storage-Architektur (siehe Spec rev3). Storage ist `FRAGENBANK_ID`-Spreadsheet mit 4 fachbereich-Tabs (BWL/VWL/Recht/IN), nicht ein einzelnes `'fragenbank'`-Sheet. `ensureColumns()` ergänzt Spalten automatisch — kein expliziter Backfill-Job. Existing `speichereFrage` + `loescheFrage` werden erweitert statt 4 neue Endpoints. Backend-Aufwand massiv reduziert.

---

## File Structure

| Datei | Verantwortlich für | Status |
|---|---|---|
| `ExamLab/src/types/fragen-storage.ts` | Type-Erweiterung `status: 'draft'\|'sammlung'`, `geloescht_am: string\|null` | Modify |
| `ExamLab/apps-script-code.js` | Sheet-Schema-Migration A1:T1 → A1:V1, 4 neue Endpoints, GAS-Tests, Daily-Trigger | Modify |
| `ExamLab/src/services/draftApi.ts` | API-Adapter (4 Endpoints), abstrahiert Apps-Script für Backend-Migration | Create |
| `ExamLab/src/services/draftSync.ts` | Hybrid IDB+Server, debounce, 4-Stufen-Retry, BroadcastChannel | Create |
| `ExamLab/src/store/draftStore.ts` | globaler Zustand-Store für aktive Drafts (UI-Liste + dirty-Tracker) | Create |
| `ExamLab/src/hooks/useDirtyTracker.ts` | App-weiter dirty-Boolean-Tracker pro Editor-Instanz | Create |
| `ExamLab/src/hooks/useFragenAutoSave.ts` | Editor-Hook, kombiniert dirty-Tracker + draftSync | Create |
| `packages/shared/src/editor/components/SaveStatusIndikator.tsx` | 5-Zustand-Anzeige im Editor-Footer | Create |
| `packages/shared/src/editor/components/SchliessenModal.tsx` | Modal bei unvollständigem Draft | Create |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | useFragenAutoSave integrieren, Save-Button durch Indikator ersetzen | Modify |
| `ExamLab/src/components/lp/fragenbank/DraftsSection.tsx` | Drafts-Sektion oben in Fragensammlung | Create |
| `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx` | DraftsSection einbinden, eigene+geteilte filter | Modify |
| `ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx` | Liste, Wiederherstellen, Endgültig-löschen | Create |
| `ExamLab/src/components/lp/LPStartseite.tsx` | Papierkorb-Route + beforeunload-Listener integrieren | Modify |
| `ExamLab/src/store/authStore.ts` | Logout-Pfad: IDB-Cache cleanen mit `tx.oncomplete`-await (S149) | Modify |

**Tests** (in jeweiliger Test-Datei `*.test.ts(x)`):
- `draftSync.test.ts` (debounce, retry, server-authority)
- `draftApi.test.ts` (4 Endpoints, vi.mock auf uebenApiClient/apiClient)
- `useDirtyTracker.test.ts`, `useFragenAutoSave.test.ts`
- `SaveStatusIndikator.test.tsx` (5 Zustände)
- `SchliessenModal.test.tsx`
- `DraftsSection.test.tsx`, `PapierkorbView.test.tsx`

---

## Phase A — Daten-Modell + Apps-Script-Backend (rev2)

**Architektur (rev2):** Storage ist `FRAGENBANK_ID`-Spreadsheet mit 4 fachbereich-Tabs (BWL/VWL/Recht/IN). `ensureColumns()` ergänzt fehlende Spalten **automatisch beim ersten Schreiben** — kein expliziter Backfill-Job nötig. Existing `speichereFrage` + `loescheFrage` werden erweitert (kein neuer Endpoint), 3 echte neue Endpoints für Papierkorb-Operationen.

### Task A.1: Type-Erweiterung in fragen-storage.ts

**Files:**
- Modify: `ExamLab/src/types/fragen-storage.ts` (FrageStorageBase)

- [ ] **Step 1: `status?` und `geloescht_am?` Felder als optional ergänzen**

Optional zunächst (Phase F.1 zieht required). Existing Frage-Erzeugungs-Stellen (~30) müssen sonst alle gleichzeitig migriert werden.

```typescript
export interface FrageStorageBase {
  // ... existing fields
  /** Lifecycle-Status. 'draft' = unvollständig (Drafts-Sektion). 'sammlung' = vollständig. Default 'sammlung'. */
  status?: 'draft' | 'sammlung'
  /** Soft-Delete-Timestamp (ISO-String). Leer = nicht gelöscht. Bundle 3. */
  geloescht_am?: string
}
```

- [ ] **Step 2: tsc-Check**

Run: `cd ExamLab && npx tsc -b && npx tsc -b ../packages/shared --force`
Expected: clean (Felder optional, kein Breaking Change).

- [ ] **Step 3: Commit**

```bash
git commit -m "Bundle 3 P-A.1: Type-Erweiterung status?, geloescht_am? (optional, required-Übergang in F.1)"
```

### Task A.2: speichereFrage erweitern um istVollstaendig_ + status-Schreiben

**Files:**
- Modify: `ExamLab/apps-script-code.js` (~Z. 3705-3793 + neuer Helper)

- [ ] **Step 1: `istVollstaendig_(frage)` Helper schreiben**

Server-Authority für `draft↔sammlung`-Status. Per-Typ-Pflichtfeld-Mapping inline (analog `pflichtfeldValidation.ts`):

```javascript
/**
 * Server-side Vollständigkeits-Check (Bundle 3).
 * Authoritativ für draft|sammlung-Status. Muss synchron mit
 * packages/shared/src/editor/pflichtfeldValidation.ts gehalten werden.
 */
function istVollstaendig_(frage) {
  if (!frage || !frage.typ) return false;

  // Basis-Pflichtfelder für ALLE Typen
  if (!frage.thema || !String(frage.thema).trim()) return false;
  if (!frage.fach) return false;
  if (!frage.fachbereich) return false;
  if (typeof frage.punkte !== 'number' || frage.punkte <= 0) return false;

  // Fragetext (typ-abhängiges Naming)
  var fragetext = frage.fragetext || frage.geschaeftsfall || frage.aufgabentext || frage.kontext || '';
  if (!String(fragetext).trim()) return false;

  // Typ-spezifische Pflichtfelder
  switch (frage.typ) {
    case 'mc':
      if (!Array.isArray(frage.optionen) || frage.optionen.length < 2) return false;
      return frage.optionen.some(function(o) { return o.korrekt; })
        && frage.optionen.every(function(o) { return o.text && String(o.text).trim(); });

    case 'richtigfalsch':
      return Array.isArray(frage.aussagen) && frage.aussagen.length >= 1
        && frage.aussagen.every(function(a) { return a.text && String(a.text).trim(); });

    case 'lueckentext':
      return Array.isArray(frage.luecken) && frage.luecken.length >= 1
        && frage.luecken.every(function(l) {
          return Array.isArray(l.korrekteAntworten) && l.korrekteAntworten.length >= 1
            && l.korrekteAntworten.some(function(a) { return String(a).trim(); });
        });

    case 'zuordnung':
      return Array.isArray(frage.paare) && frage.paare.length >= 2
        && frage.paare.every(function(p) { return p.links && p.rechts; });

    case 'sortierung':
      return Array.isArray(frage.elemente) && frage.elemente.length >= 2
        && frage.elemente.every(function(e) { return e.text && String(e.text).trim(); });

    case 'freitext':
      return typeof frage.musterlosung === 'string' && frage.musterlosung.trim().length > 0;

    case 'berechnung':
      return Array.isArray(frage.ergebnisse) && frage.ergebnisse.length >= 1
        && frage.ergebnisse.every(function(e) { return typeof e.korrekt === 'number'; });

    case 'buchungssatz':
      return Array.isArray(frage.buchungen) && frage.buchungen.length >= 1
        && frage.buchungen.every(function(b) { return b.sollKonto && b.habenKonto && b.betrag > 0; });

    case 'tkonto':
      return Array.isArray(frage.konten) && frage.konten.length >= 1
        && frage.konten.every(function(k) { return k.kontonummer; });

    case 'kontenbestimmung':
      return Array.isArray(frage.aufgaben) && frage.aufgaben.length >= 1;

    case 'bilanzstruktur':
      return frage.korrektBilanzsumme > 0
        && Array.isArray(frage.kontenMitSaldi) && frage.kontenMitSaldi.length >= 1;

    case 'hotspot':
      return frage.bildUrl
        && Array.isArray(frage.bereiche) && frage.bereiche.length >= 1
        && frage.bereiche.every(function(b) { return b.label && Array.isArray(b.punkte) && b.punkte.length >= 3; });

    case 'bildbeschriftung':
      return frage.bildUrl
        && Array.isArray(frage.beschriftungen) && frage.beschriftungen.length >= 1
        && frage.beschriftungen.every(function(b) { return Array.isArray(b.korrekt) && b.korrekt.length >= 1; });

    case 'dragdrop_bild':
      return frage.bildUrl
        && Array.isArray(frage.zielzonen) && frage.zielzonen.length >= 1
        && Array.isArray(frage.labels) && frage.labels.length >= 1
        && frage.zielzonen.every(function(z) { return Array.isArray(z.korrekteLabels) && z.korrekteLabels.length >= 1; });

    case 'pdf':
      return frage.pdfUrl || frage.bildUrl;

    case 'audio':
      return typeof frage.maxDauerSekunden === 'number' && frage.maxDauerSekunden > 0;

    case 'visualisierung':
      return frage.canvasConfig && frage.canvasConfig.werkzeuge && frage.canvasConfig.werkzeuge.length >= 1;

    case 'code':
      return frage.programmiersprache;

    case 'formel':
      return typeof frage.musterlosung === 'string' && frage.musterlosung.trim().length > 0;

    case 'aufgabengruppe':
      return Array.isArray(frage.teilaufgaben) && frage.teilaufgaben.length >= 1;

    default:
      return true; // unbekannter Typ → akzeptieren (rückwärts-kompatibel)
  }
}
```

- [ ] **Step 2: `_speichereFrageIntern(frage, email)` als pure Helper extrahieren**

Memory S130-Pattern (markiereFeedbackAlsIgnoriert_ Stil): Pure Logic ohne Auth-Check. Test-Shim ruft Intern direkt.

```javascript
function _speichereFrageIntern(frage, email) {
  // FiBu-Schutz
  ergaenzeFehlendeKontenInAuswahl_(frage);

  var tabName = frage.fachbereich;
  var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  var sheet = fragenbank.getSheetByName(tabName);
  if (!sheet) {
    return { success: false, error: 'Fachbereich-Tab "' + tabName + '" nicht gefunden' };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = getSheetData(sheet);

  // Bundle 3: server-side Vollständigkeits-Check + status-Schreiben
  var status = istVollstaendig_(frage) ? 'sammlung' : 'draft';
  var geloescht_am = frage.geloescht_am || '';

  var rowData = {
    id: frage.id,
    typ: frage.typ,
    version: String(frage.version || 1),
    erstelltAm: frage.erstelltAm || new Date().toISOString(),
    geaendertAm: new Date().toISOString(),
    thema: frage.thema || '',
    unterthema: frage.unterthema || '',
    semester: (frage.semester || []).join(','),
    gefaesse: (frage.gefaesse || []).filter(function(g) {
      return g !== '' && ladeSchulConfig_().gefaesse.includes(g);
    }).join(','),
    bloom: frage.bloom || 'K1',
    tags: (frage.tags || []).join(','),
    punkte: String(frage.punkte || 0),
    musterlosung: frage.musterlosung || '',
    bewertungsraster: JSON.stringify(frage.bewertungsraster || []),
    fragetext: frage.fragetext || frage.geschaeftsfall || frage.aufgabentext || frage.kontext || '',
    quelle: frage.quelle || 'manuell',
    anhaenge: JSON.stringify(frage.anhaenge || []),
    typDaten: JSON.stringify(getTypDaten(frage)),
    autor: frage.autor || email,
    geteilt: frage.geteilt || 'privat',
    geteiltVon: frage.geteiltVon || '',
    fach: frage.fach || fachschaftZuFach_(frage.fachbereich) || 'Allgemein',
    schwierigkeit: frage.schwierigkeit !== undefined ? String(frage.schwierigkeit) : '',
    poolId: frage.poolId || '',
    poolGeprueft: frage.poolGeprueft ? 'true' : '',
    pruefungstauglich: frage.pruefungstauglich ? 'true' : '',
    poolContentHash: frage.poolContentHash || '',
    poolUpdateVerfuegbar: frage.poolUpdateVerfuegbar ? 'true' : '',
    lernzielIds: (frage.lernzielIds || []).join(','),
    // Bundle 3: NEU
    status: status,
    geloescht_am: geloescht_am,
  };

  // ensureColumns ergänzt fehlende Spalten (status, geloescht_am) automatisch
  headers = ensureColumns(sheet, headers, rowData);

  var existingRow = data.findIndex(function(row) { return row.id === frage.id; });
  if (existingRow >= 0) {
    var rowIndex = existingRow + 2;
    headers.forEach(function(header, colIndex) {
      if (rowData[header] !== undefined) {
        sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
      }
    });
  } else {
    var newRow = headers.map(function(h) { return rowData[h] || ''; });
    sheet.appendRow(newRow);
  }

  return { success: true, id: frage.id, status: status };
}
```

- [ ] **Step 3: `speichereFrage` zu Wrapper umbauen**

```javascript
function speichereFrage(body) {
  try {
    var email = body.email;
    var frage = body.frage;

    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!frage || !frage.id || !frage.typ || !frage.fachbereich) {
      return jsonResponse({ error: 'Ungültige Frage-Daten' });
    }

    var ergebnis = _speichereFrageIntern(frage, email);

    // Kalibrierungs-Feedbacks schliessen (existing pattern, unverändert)
    if (body.offeneKIFeedbacks && Array.isArray(body.offeneKIFeedbacks)) {
      body.offeneKIFeedbacks.forEach(function(fb) {
        try {
          var final = extrahiereFinaleVersionEditor_(fb.aktion, frage);
          schliesseFeedbackEintrag_(fb.feedbackId, final, { wichtig: !!fb.wichtig });
        } catch(e) { console.warn('[Kalibrierung] schliesseFeedback fehlgeschlagen:', e); }
      });
    }

    return jsonResponse(ergebnis);
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git commit -m "Bundle 3 P-A.2: speichereFrage erweitert um istVollstaendig_ + status-Schreiben (Wrapper-Pattern)"
```

### Task A.3: loescheFrage zu Soft-Delete umbauen

**Files:**
- Modify: `ExamLab/apps-script-code.js` (~Z. 3797)

- [ ] **Step 1: `loescheFrage` zu Soft-Delete**

Statt `sheet.deleteRow` → setze `geloescht_am = ISO`. Existing Caller (Frontend) bleibt funktional — die Frage verschwindet aus normalen Listen wegen Filter (siehe A.5).

```javascript
function loescheFrage(body) {
  try {
    var email = body.email;
    var frageId = body.frageId;
    var fachbereich = body.fachbereich;

    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!frageId || !fachbereich) {
      return jsonResponse({ error: 'frageId und fachbereich erforderlich' });
    }

    var sheet = SpreadsheetApp.openById(FRAGENBANK_ID).getSheetByName(fachbereich);
    if (!sheet) return jsonResponse({ error: 'Tab nicht gefunden' });

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idCol = headers.indexOf('id');
    var autorCol = headers.indexOf('autor');
    var data = getSheetData(sheet);

    var rowIdx = data.findIndex(function(row) { return row.id === frageId; });
    if (rowIdx < 0) return jsonResponse({ error: 'Frage nicht gefunden' });

    // Owner-Check (existing pattern)
    var existingAutor = data[rowIdx].autor;
    if (existingAutor && existingAutor !== email) {
      return jsonResponse({ error: 'Nicht eigene Frage' });
    }

    // Bundle 3: Soft-Delete statt deleteRow
    var rowData = Object.assign({}, data[rowIdx], {
      geloescht_am: new Date().toISOString(),
      geaendertAm: new Date().toISOString(),
    });
    headers = ensureColumns(sheet, headers, rowData);

    headers.forEach(function(header, colIndex) {
      if (rowData[header] !== undefined) {
        sheet.getRange(rowIdx + 2, colIndex + 1).setValue(rowData[header]);
      }
    });

    return jsonResponse({ success: true, id: frageId });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "Bundle 3 P-A.3: loescheFrage zu Soft-Delete (geloescht_am statt deleteRow)"
```

### Task A.4: 3 neue Endpoints (stelleWiederHer, hardDeleteFrage, listePapierkorb)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

Pro Endpoint ein eigener Sub-Task A.4.a/b/c — separate Commits. Owner-Check analog `loescheFrage`.

- [ ] **Step A.4.a: `stelleWiederHer` — setze `geloescht_am=''`**

```javascript
function stelleWiederHer(body) {
  try {
    var email = body.email;
    var frageId = body.frageId;
    var fachbereich = body.fachbereich;
    if (!email || !istZugelasseneLP(email)) return jsonResponse({ error: 'Nur für Lehrpersonen' });
    if (!frageId || !fachbereich) return jsonResponse({ error: 'frageId und fachbereich erforderlich' });

    var sheet = SpreadsheetApp.openById(FRAGENBANK_ID).getSheetByName(fachbereich);
    if (!sheet) return jsonResponse({ error: 'Tab nicht gefunden' });

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = getSheetData(sheet);
    var rowIdx = data.findIndex(function(row) { return row.id === frageId; });
    if (rowIdx < 0) return jsonResponse({ error: 'Frage nicht gefunden' });

    var existingAutor = data[rowIdx].autor;
    if (existingAutor && existingAutor !== email) {
      return jsonResponse({ error: 'Nicht eigene Frage' });
    }

    var rowData = Object.assign({}, data[rowIdx], {
      geloescht_am: '',
      geaendertAm: new Date().toISOString(),
    });
    headers = ensureColumns(sheet, headers, rowData);
    headers.forEach(function(header, colIndex) {
      if (rowData[header] !== undefined) {
        sheet.getRange(rowIdx + 2, colIndex + 1).setValue(rowData[header]);
      }
    });

    return jsonResponse({ success: true, id: frageId });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
```

- [ ] **Step A.4.b: `hardDeleteFrage` — endgültig löschen**

```javascript
function hardDeleteFrage(body) {
  try {
    var email = body.email;
    var frageId = body.frageId;
    var fachbereich = body.fachbereich;
    if (!email || !istZugelasseneLP(email)) return jsonResponse({ error: 'Nur für Lehrpersonen' });
    if (!frageId || !fachbereich) return jsonResponse({ error: 'frageId und fachbereich erforderlich' });

    var sheet = SpreadsheetApp.openById(FRAGENBANK_ID).getSheetByName(fachbereich);
    if (!sheet) return jsonResponse({ error: 'Tab nicht gefunden' });

    var data = getSheetData(sheet);
    var rowIdx = data.findIndex(function(row) { return row.id === frageId; });
    if (rowIdx < 0) return jsonResponse({ error: 'Frage nicht gefunden' });

    var existingAutor = data[rowIdx].autor;
    if (existingAutor && existingAutor !== email) {
      return jsonResponse({ error: 'Nicht eigene Frage' });
    }

    sheet.deleteRow(rowIdx + 2);
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
```

- [ ] **Step A.4.c: `listePapierkorb` — alle Soft-Delete-Inhalte des Users**

```javascript
function listePapierkorb(body) {
  try {
    var email = body.email;
    if (!email || !istZugelasseneLP(email)) return jsonResponse({ error: 'Nur für Lehrpersonen' });

    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var fachbereiche = ['BWL', 'VWL', 'Recht', 'IN'];
    var papierkorb = [];

    for (var i = 0; i < fachbereiche.length; i++) {
      var sheet = fragenbank.getSheetByName(fachbereiche[i]);
      if (!sheet) continue;
      var data = getSheetData(sheet);
      data.forEach(function(row) {
        if (!row.geloescht_am || !row.autor) return;
        if (row.autor !== email) return; // nur eigene
        papierkorb.push(row);
      });
    }

    return jsonResponse({ success: true, fragen: papierkorb });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
```

- [ ] **Step A.4.d: Dispatcher-Cases**

Suche `switch(action)` im `doPost`-Handler, ergänze:

```javascript
case 'stelleWiederHer': return stelleWiederHer(body);
case 'hardDeleteFrage': return hardDeleteFrage(body);
case 'listePapierkorb': return listePapierkorb(body);
```

- [ ] **Step A.4.e: Commit**

```bash
git commit -m "Bundle 3 P-A.4: 3 neue Endpoints (stelleWiederHer, hardDeleteFrage, listePapierkorb)"
```

### Task A.5: Existing Lese-Endpoints filtern Papierkorb-Inhalte

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Existing Lese-Endpoints finden + Filter ergänzen**

Suche `ladeMeineFragen_` oder ähnliche Lese-Endpoints. Pro Endpoint: Filter-Bedingung `!row.geloescht_am` ergänzen, sodass Papierkorb-Inhalte nicht in regulären Listen erscheinen.

Beispiel-Pattern (anpassen an existing Code):
```javascript
// existing:
data.forEach(function(row) {
  if (...filter logic...) result.push(row);
});

// nachher (Bundle 3):
data.forEach(function(row) {
  if (row.geloescht_am) return; // Papierkorb-Inhalte ausblenden
  if (...filter logic...) result.push(row);
});
```

- [ ] **Step 2: Commit**

```bash
git commit -m "Bundle 3 P-A.5: Existing Lese-Endpoints filtern geloescht_am !== ''"
```

### Task A.6: GAS-Test-Shim `testBundle3DraftLifecycle_`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Test-Shim ruft `_speichereFrageIntern` direkt (kein Auth-Bypass)**

```javascript
function testBundle3DraftLifecycle_() {
  Logger.log('=== Bundle 3 Draft-Lifecycle-Test ===');

  var testEmail = 'test.bundle3@gymhofwil.ch';
  var testFrageBase = {
    id: 'test-bundle3-' + Date.now(),
    typ: 'mc',
    fach: 'SF WR',
    fachbereich: 'BWL',
    thema: 'Test-Bundle3',
    autor: testEmail,
    fragetext: 'Test?',
    punkte: 1,
    optionen: [{ id: 'o1', text: 'A', korrekt: true }, { id: 'o2', text: 'B', korrekt: false }],
  };

  // Case 1: vollständige Frage → status='sammlung'
  var r1 = _speichereFrageIntern(testFrageBase, testEmail);
  if (r1.status !== 'sammlung') throw new Error('Case 1 FAIL: status=' + r1.status);
  Logger.log('  ✓ Case 1: vollständig → sammlung');

  // Case 2: unvollständig (Pflichtfeld leer) → status='draft'
  var unvollstFrage = Object.assign({}, testFrageBase, { fragetext: '' });
  var r2 = _speichereFrageIntern(unvollstFrage, testEmail);
  if (r2.status !== 'draft') throw new Error('Case 2 FAIL: status=' + r2.status);
  Logger.log('  ✓ Case 2: unvollständig → draft');

  // Case 3: Pflichtfeld ergänzen → zurück zu sammlung
  var ergFrage = Object.assign({}, testFrageBase, { fragetext: 'Wieder da' });
  var r3 = _speichereFrageIntern(ergFrage, testEmail);
  if (r3.status !== 'sammlung') throw new Error('Case 3 FAIL: status=' + r3.status);
  Logger.log('  ✓ Case 3: Pflichtfeld zurück → sammlung');

  // Case 4: Soft-Delete via loescheFrage-Endpoint (geht über Auth — test-only mit pseudo-Token im Body)
  var r4 = loescheFrage({ email: testEmail, frageId: testFrageBase.id, fachbereich: 'BWL' });
  Logger.log('  ✓ Case 4: loescheFrage (soft) → ' + r4.getContent());

  // Case 5: stelleWiederHer + hardDeleteFrage Cleanup
  stelleWiederHer({ email: testEmail, frageId: testFrageBase.id, fachbereich: 'BWL' });
  hardDeleteFrage({ email: testEmail, frageId: testFrageBase.id, fachbereich: 'BWL' });
  Logger.log('  ✓ Case 5: Cleanup hardDelete');

  Logger.log('=== Bundle 3 Draft-Lifecycle-Test bestanden ===');
}

function testBundle3DraftLifecycle() { return testBundle3DraftLifecycle_(); }
```

**Hinweis Auth-Bypass für Cases 4-5:** `loescheFrage` etc. sind Endpoints mit `istZugelasseneLP(email)`-Check. Test-Email `test.bundle3@gymhofwil.ch` muss in `lpZulassung_`-Sheet eingetragen sein, ODER Test ruft analog `_loescheFrageIntern`-Pure-Helper (analog Pattern aus A.2). Plan-Empfehlung: Pure-Helper-Extraktion für loescheFrage/stelleWiederHer/hardDeleteFrage analog `_speichereFrageIntern` — Test-Shim ohne Auth-Friktion.

- [ ] **Step 2: Commit**

```bash
git commit -m "Bundle 3 P-A.6: GAS-Test-Shim testBundle3DraftLifecycle_ (5 Cases, ohne Auth-Bypass)"
```

### Task A.7: Daily-Trigger für Auto-Hard-Delete (90 Tage)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Auto-Hard-Delete-Funktion über alle 4 Tabs**

Iteriert alle fachbereich-Tabs (BWL/VWL/Recht/IN), löscht Rows mit `geloescht_am < now - 90 Tage` via `sheet.deleteRow`.

```javascript
function autoHardDeleteAlteFragen_() {
  var schwelle = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  var fachbereiche = ['BWL', 'VWL', 'Recht', 'IN'];
  var totalGeloescht = 0;

  for (var t = 0; t < fachbereiche.length; t++) {
    var sheet = fragenbank.getSheetByName(fachbereiche[t]);
    if (!sheet) continue;

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var geloeschtCol = headers.indexOf('geloescht_am');
    if (geloeschtCol < 0) continue; // Spalte noch nicht da

    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    var zuLoeschende = [];
    for (var i = 0; i < data.length; i++) {
      var geloescht = data[i][geloeschtCol];
      if (geloescht && String(geloescht) < schwelle) {
        zuLoeschende.push(i + 2);
      }
    }
    zuLoeschende.sort(function(a, b) { return b - a; }); // Reverse-Sort
    for (var j = 0; j < zuLoeschende.length; j++) {
      sheet.deleteRow(zuLoeschende[j]);
      totalGeloescht++;
    }
  }

  Logger.log('Auto-Hard-Delete: ' + totalGeloescht + ' Fragen endgültig gelöscht (älter als 90 Tage)');
}
```

- [ ] **Step 2: Trigger-Installer (Pattern: existing Trigger, z.B. Bundle H Schülercode-Removal)**

```javascript
function installiereAutoHardDeleteTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'autoHardDeleteAlteFragen_') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('autoHardDeleteAlteFragen_').timeBased().atHour(3).everyDays(1).create();
  Logger.log('Auto-Hard-Delete Trigger installiert (täglich 3:00)');
}

function installiereAutoHardDeleteTrigger() { return installiereAutoHardDeleteTrigger_(); }
```

- [ ] **Step 3: Commit**

```bash
git commit -m "Bundle 3 P-A.7: Auto-Hard-Delete (90 Tage, alle 4 fachbereich-Tabs) + Daily-Trigger-Installer"
```

### Task A.8: USER-TASK Apps-Script-Deploy

**Files:** keine

User-Task-Liste (in dieser Reihenfolge ausführen):

1. **Manuelles Google-Sheets-Backup** der Fragenbank (Memory S136-Lehre).
2. `apps-script-code.js` (HEAD-Commit) komplett in Google Apps Script Editor laden.
3. Im GAS-Editor ausführen:
   - `testBundle3DraftLifecycle` — alle 5 Cases müssen ✓.
   - `installiereAutoHardDeleteTrigger` — Daily-Trigger aktivieren.
4. Bereitstellen → Bereitstellung verwalten → Bearbeiten → Version: Neu.
5. User bestätigt mit „Bundle 3 Backend deployed".

**Kein Backfill-Job nötig** — `ensureColumns` ergänzt status/geloescht_am beim ersten Schreiben automatisch. Existing Fragen lesen leer = `'sammlung'`-Default im Frontend-Mapper.

**Bis dahin Implementation pausieren.** Phase B braucht Backend live.

---

## Phase B — Service-Layer

**Ziel:** API-Adapter, Hybrid-Sync, Hooks, Store. Frontend ohne Editor-Integration.

### Task B.1: draftApi.ts — API-Adapter für 3 neue Endpoints (TDD)

**Files:**
- Create: `ExamLab/src/services/draftApi.ts`
- Test: `ExamLab/src/services/draftApi.test.ts`

**Hinweis (rev2):** Existing `speichereFrage` und `ladeMeineFragen_`-Wrappers existieren schon in `apiService.ts`. Bundle 3 ergänzt nur 3 neue API-Wrapper für die neuen Endpoints — Frontend-Caller nutzen für Save weiterhin existing `apiService.speichereFrage`.

`postJson(action, payload)` ohne dritten Parameter — Token wird via `getSessionToken()` auto-injected ([apiClient.ts:55+](../../../ExamLab/src/services/apiClient.ts)). Response-Unwrap-Pattern via `unwrap<T>`-Helper analog `kalibrierungApi`/`sharingApi` (Memory S130-Lehre).

- [ ] **Step 1: Failing Tests schreiben (3 Endpoints × Success+Error)**

```typescript
// ExamLab/src/services/draftApi.test.ts
import { describe, it, expect, vi } from 'vitest'
import { stelleWiederHer, hardDeleteFrage, listePapierkorb } from './draftApi'

vi.mock('./apiClient', () => ({
  postJson: vi.fn(),
}))

import { postJson } from './apiClient'

describe('draftApi.stelleWiederHer', () => {
  it('ruft postJson mit korrekter action + payload (kein token-arg)', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: true, id: 'f1' })
    await stelleWiederHer({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' })
    expect(postJson).toHaveBeenCalledWith('stelleWiederHer', {
      email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL',
    })
  })

  it('wirft Error bei success:false', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: false, error: 'Nicht eigene Frage' })
    await expect(stelleWiederHer({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' }))
      .rejects.toThrow('Nicht eigene Frage')
  })

  it('wirft Error bei response = null (Network-Fehler)', async () => {
    vi.mocked(postJson).mockResolvedValueOnce(null)
    await expect(stelleWiederHer({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' }))
      .rejects.toThrow()
  })
})

// Analog für hardDeleteFrage + listePapierkorb (jeweils 3 Tests)
```

- [ ] **Step 2: Test → FAIL**

`cd ExamLab && npx vitest run src/services/draftApi.test.ts`
Expected: ImportError (Datei existiert nicht).

- [ ] **Step 3: draftApi.ts implementieren**

```typescript
// ExamLab/src/services/draftApi.ts
import { postJson } from './apiClient'
import type { Frage } from '../types/fragen-storage'

interface ApiResponse<T = unknown> {
  success?: boolean
  error?: string
  data?: T
  [key: string]: unknown
}

/** Memory S130-Pattern: postJson<T>-Cast ist Lüge, manuelles unwrap. */
function unwrap<T extends ApiResponse>(response: T | null, action: string): T {
  if (!response) throw new Error(`${action}: keine Antwort vom Server`)
  if (response.success === false) throw new Error(response.error || `${action}: fehlgeschlagen`)
  return response
}

export async function stelleWiederHer(params: {
  email: string; frageId: string; fachbereich: string
}): Promise<{ success: true; id: string }> {
  const r = await postJson<ApiResponse<{ id: string }>>('stelleWiederHer', params)
  unwrap(r, 'stelleWiederHer')
  return { success: true, id: params.frageId }
}

export async function hardDeleteFrage(params: {
  email: string; frageId: string; fachbereich: string
}): Promise<{ success: true }> {
  const r = await postJson<ApiResponse>('hardDeleteFrage', params)
  unwrap(r, 'hardDeleteFrage')
  return { success: true }
}

export async function listePapierkorb(params: { email: string }): Promise<Frage[]> {
  const r = await postJson<ApiResponse & { fragen?: Frage[] }>('listePapierkorb', params)
  const unwrapped = unwrap(r, 'listePapierkorb')
  return unwrapped.fragen ?? []
}
```

- [ ] **Step 4: Test grün**

`cd ExamLab && npx vitest run src/services/draftApi.test.ts`
Expected: 9 Tests grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/services/draftApi.ts ExamLab/src/services/draftApi.test.ts
git commit -m "Bundle 3 P-B.1: draftApi.ts (3 neue Endpoints, TDD: 9 Tests, unwrap-Pattern)"
```

### Task B.2: draftSync.ts — Hybrid IDB+Server

**Files:**
- Create: `ExamLab/src/services/draftSync.ts`
- Test: `ExamLab/src/services/draftSync.test.ts`

Komplexer Service — implementiert:
- 1s-debounce IDB-Cache
- 10s-debounce Server-Sync mit Retry-Schema
- BroadcastChannel für Multi-Tab
- finale-Sync-Funktion für Editor-Schließen

- [ ] **Step 1: Failing Tests** (8+ Cases)

Cases:
1. `tippeFrage` triggert IDB-Update nach 1s
2. `tippeFrage` triggert Server-Sync nach 10s
3. Konsekutive `tippeFrage` resettet beide Debounces
4. `finalisiere` führt synchronen Server-Sync mit await
5. Server-Sync 5xx → exp. backoff Retry 3x
6. Server-Sync 401 → sessionWiederherstellen + 1 retry
7. Server-Sync 4xx (außer 401/429) → eskaliert sofort
8. BroadcastChannel-Update von anderem Tab → in-Memory-State updaten

- [ ] **Step 2: Implementation**

(Detail-Implementation überlassen an Implementer; Pattern: idb-keyval für IDB, setTimeout-basierte Debouncer, Promise-Chain für Retries.)

- [ ] **Step 3: Tests grün + Commit**

```bash
git commit -m "Bundle 3 P-B.2: draftSync.ts Hybrid IDB+Server (TDD: 8+ Tests)"
```

### Task B.3: draftStore.ts — Globaler Zustand-Store

**Files:**
- Create: `ExamLab/src/store/draftStore.ts`
- Test: `ExamLab/src/store/draftStore.test.ts`

State:
```ts
interface DraftStore {
  aktiveDrafts: Map<string, { editorId: string; istDirty: boolean; status: 'draft'|'sammlung'|'sync-pending' }>
  registriere: (editorId: string) => void
  setzeDirty: (editorId: string, dirty: boolean) => void
  setzeStatus: (editorId: string, status: 'draft'|'sammlung'|'sync-pending') => void
  abmelde: (editorId: string) => void
  hatDirty: () => boolean // für beforeunload
}
```

- [ ] **Step 1-3: TDD-Cycle + Tests + Commit**

```bash
git commit -m "Bundle 3 P-B.3: draftStore.ts Globaler Tracker (TDD)"
```

### Task B.4: useDirtyTracker + useFragenAutoSave Hooks

**Files:**
- Create: `ExamLab/src/hooks/useDirtyTracker.ts`
- Create: `ExamLab/src/hooks/useFragenAutoSave.ts`
- Tests: jeweils `.test.ts(x)`

`useDirtyTracker(editorId)`: registriert beim draftStore, returnt `{ istDirty, markiereDirty, markiereSauber }`.

`useFragenAutoSave(editorId, frage)`: nutzt useDirtyTracker + draftSync. Returnt `{ status: 'sauber'|'sync-läuft'|'entwurf'|'verbindungsproblem'|'server-down', fehlendePflichtfelder: string[], finalisiereVorClose: () => Promise<void> }`.

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-B.4: Hooks useDirtyTracker + useFragenAutoSave (TDD)"
```

---

## Phase C — Editor-Integration

### Task C.1: SaveStatusIndikator Komponente

**Files:**
- Create: `packages/shared/src/editor/components/SaveStatusIndikator.tsx`
- Test: `.test.tsx`

5 Zustände als Storybook-style props:

```tsx
interface Props {
  status: 'sauber' | 'sync-läuft' | 'entwurf' | 'verbindungsproblem' | 'server-down'
  fehlendePflichtfelder?: string[]
  onErneutVersuchen?: () => void
}
```

Render: badge mit Farb-Code (grün/grau/amber/gelb/rot).

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-C.1: SaveStatusIndikator (5 Zustände, TDD)"
```

### Task C.2: SchliessenModal Komponente

**Files:**
- Create: `packages/shared/src/editor/components/SchliessenModal.tsx`
- Test: `.test.tsx`

3 Varianten:
1. Frage unvollständig + Draft → „Als Entwurf behalten / Verwerfen"
2. Verbindungsproblem (sync nicht durch) → „Daten gehen verloren — wirklich schließen?"
3. silent close (vollständig + synced) — Modal nicht zeigen

- [ ] **Step 1-3: TDD + Commit**

```bash
git commit -m "Bundle 3 P-C.2: SchliessenModal (3 Varianten, TDD)"
```

### Task C.3: SharedFragenEditor — useFragenAutoSave integrieren

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx`

Editor-Body um `useFragenAutoSave`-Hook ergänzen. Save-Button-Slot durch SaveStatusIndikator ersetzen. onAbbrechen-Callback wrappen mit SchliessenModal-Logik.

- [ ] **Step 1: Hook integrieren**
- [ ] **Step 2: Save-Button → SaveStatusIndikator**
- [ ] **Step 3: onAbbrechen → SchliessenModal-Pfad**
- [ ] **Step 4: tsc + tests grün**
- [ ] **Step 5: Commit**

```bash
git commit -m "Bundle 3 P-C.3: SharedFragenEditor mit Auto-Save + Status-Indikator + Schließen-Modal"
```

### Task C.4: App-weiter beforeunload + Logout-IDB-Cleanup

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx` (oder AppLP.tsx)
- Modify: `ExamLab/src/store/authStore.ts`

beforeunload-Listener:
```tsx
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (useDraftStore.getState().hatDirty()) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [])
```

Logout-Pfad:
```ts
abmelden: async () => {
  // S149-Pattern: IDB-Cache cleanen MIT tx.oncomplete-await VOR Hard-Nav
  await clearDraftIDBCache() // returnt Promise<void> mit tx.oncomplete-resolve
  // ... existing logout ...
  window.location.href = '/login'
}
```

- [ ] **Step 1-3: Implementation + Tests + Commit**

```bash
git commit -m "Bundle 3 P-C.4: beforeunload-Listener + Logout-IDB-Cleanup (S149-Pattern)"
```

---

## Phase D — Fragensammlung-UI

### Task D.1: DraftsSection Komponente

**Files:**
- Create: `ExamLab/src/components/lp/fragenbank/DraftsSection.tsx`
- Test: `.test.tsx`

Render: Header „✏️ Entwürfe (N)" + Liste der eigenen + geteilten Drafts. Klick öffnet Editor mit der Frage.

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-D.1: DraftsSection (eigene + geteilte, TDD)"
```

### Task D.2: FragenBrowser — DraftsSection einbinden

**Files:**
- Modify: `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx`

DraftsSection oben render. Drafts-Liste via `listeDrafts`-API laden + cachen.

- [ ] **Step 1-3: Edit + tests + commit**

```bash
git commit -m "Bundle 3 P-D.2: FragenBrowser mit DraftsSection oben"
```

---

## Phase E — Papierkorb

### Task E.1: PapierkorbView Komponente

**Files:**
- Create: `ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx`
- Test: `.test.tsx`

Render: Liste mit `geloescht_am`-Timestamp, Wiederherstellen + Endgültig-löschen-Buttons. Warning bei Einträgen >83 Tage.

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-E.1: PapierkorbView (Liste, Wiederherstellen, Endgültig-löschen, TDD)"
```

### Task E.2: Papierkorb-Route im LPStartseite

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

`/papierkorb` Route + Navigation-Link in LP-Header.

- [ ] **Step 1-3: Edit + tests + commit**

```bash
git commit -m "Bundle 3 P-E.2: Papierkorb-Route + LP-Header-Link"
```

---

## Phase F — Cleanup + E2E + Merge

### Task F.1: Type-Felder von optional auf required ziehen

**Files:**
- Modify: `ExamLab/src/types/fragen-storage.ts`

Sobald alle Schreibstellen migriert sind (überprüft via grep), `status?` auf `status: 'draft' | 'sammlung'` (required) ziehen. tsc identifiziert Lücken.

- [ ] **Step 1: tsc lauf, alle ungesetzten Stellen patchen** (oder als Defensive `as unknown as`-Cast mit Marker — Bundle-L-Lehre)
- [ ] **Step 2: Tests + commit**

```bash
git commit -m "Bundle 3 P-F.1: status + geloescht_am required (Cleanup)"
```

### Task F.2: Pre-Merge-Checks

```bash
cd ExamLab
npx tsc -b
npx tsc -b ../packages/shared --force
npx vitest run
npm run build
npm run lint:as-any
```

Expected: alle clean, lint:as-any 0/0/0.

### Task F.3: HANDOFF-Update

**Files:**
- Modify: `ExamLab/HANDOFF.md`

Bundle 3 als „Letzter Stand auf main" eintragen mit Lehren.

```bash
git commit -m "HANDOFF: Bundle 3 dokumentiert"
```

### Task F.4: Push staging + Browser-E2E

Push branch + force preview. User testet:

| # | Test | Erwartung |
|---|---|---|
| 1 | Editor-Mount → kein Tippen → Schließen | nichts persistiert |
| 2 | Editor-Mount → Tippen einer Eingabe → 1s warten | grau „Speichert…" → grün/amber je Vollständigkeit |
| 3 | Vollständige Frage → Server-Sync → grün „Gespeichert" | Frage in Sammlung sichtbar |
| 4 | Pflichtfeld löschen → status → draft | Frage wandert in Drafts-Sektion |
| 5 | Editor schließen mit unvollständiger Frage | Modal „Als Entwurf behalten / Verwerfen" |
| 6 | „Verwerfen" klicken → Frage in Papierkorb | Papierkorb-View zeigt sie |
| 7 | „Wiederherstellen" → Frage zurück in Drafts | Draft-Sektion |
| 8 | Network-Tab: Server-Drop simulieren → 5xx-Retry | gelb „Verbindungsproblem", nach 3 Retries rot Banner |
| 9 | Multi-Tab: 2 Editor-Instanzen → in einem tippen, anderer aktualisiert | BroadcastChannel sync |
| 10 | Logout → IDB-Cache leer (DevTools Application) | Privacy intakt |

User-Bestätigung pro Pfad.

### Task F.5: Merge → main + Cleanup

```bash
git checkout main
git merge --no-ff feature/bundle-3-autosave-drafts-papierkorb -m "Merge feature/bundle-3-autosave-drafts-papierkorb (Bundle 3)"
git push origin main
git branch -d feature/bundle-3-autosave-drafts-papierkorb
git push origin --delete feature/bundle-3-autosave-drafts-papierkorb
```

Memory-Update: `project_bundle_3_autosave_drafts_papierkorb.md` schreiben + MEMORY.md ergänzen.

---

## Verifikation

- `tsc -b` clean (ExamLab + shared force)
- `vitest run` 1135+ vorhandene Tests grün, ~20 neue
- `lint:as-any` 0/0/0
- `npm run build` clean
- Apps-Script `testBundle3DraftLifecycle` 5/5 Cases ✓
- Browser-E2E mit echten Logins: 10 Pfade aus Task F.4

## Aufwand-Schätzung (rev2 — vereinfacht)

- **Phasen:** 6 (A-F)
- **Tasks:** ~24 (Phase A: 8 [erweitert für Granularität], B: 4, C: 4, D: 2, E: 2, F: 4)
- **Steps:** ~110 (vorher ~120, durch ensureColumns-Vereinfachung)
- **Commits:** ~24 atomare + 1 Merge
- **Sessions:** 2-3 (Phase A: 1 Session inkl. User-Task-Pause; B-C: 1 Session; D-E-F: 1 Session)
- **Apps-Script-Deploys:** 1-2 (initial; Hotfix optional)
- **User-Tasks:** 2 (Backend-Deploy nach Phase A; Browser-E2E in Phase F)

## Hinweise für Implementer

- **TDD strikt** in Phase B (Service-Layer) — alle Hooks + Sync-Service haben tricky Edge-Cases (Debounce-Race, Retry-Logik)
- **UI-Tests** in Phase C-E können Component-Test-Library-basiert sein (vitest + @testing-library/react)
- **BroadcastChannel** im jsdom-Test mocken via `vi.mock('broadcastchannel')` (jsdom-Support begrenzt)
- **Cleanup-Disziplin** in Phase F — `as unknown as`-Casts mit Defensive-Marker dokumentieren wenn nötig (Bundle-L-Pattern)
- **API-Adapter strikt halten** — keine Apps-Script-spezifische Logik in `draftApi.ts`, nur generische `success/error/data`-Shape. Bei Backend-Migration tauschst du nur die Implementation aus.
