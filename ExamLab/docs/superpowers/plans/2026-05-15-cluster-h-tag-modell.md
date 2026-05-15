# Cluster H — Tag-Modell-Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migration der Frage-Tags von `string[]` zu eigenständigen Tag-Object-Entitäten mit Verwaltungs-UI, ohne Datenverlust und mit Rollback-Sicherheit über `tagsLegacy`-Spalte.

**Architecture:** Neues Backend-Sheet `Tags` (Apps-Script-Spreadsheet) mit 6 CRUD-Endpoints + 1 Migrations-Endpoint. Frontend bekommt `tagsStore` (Zustand) als Cache-Layer + Service-Wrapper + 2 neue Komponenten (TagPicker für Editor, TagsListe für Verwaltungs-Tab). Migration läuft One-Shot, alte `tags: string[]`-Spalte bleibt als `tagsLegacy` 2 Wochen für Rollback. 9 Hybrid-Code-Stellen werden gleichzeitig auf saubere `tagsStore`-Lookups umgestellt.

**Tech Stack:**
- Apps-Script (Backend), JavaScript ES5-kompatibel
- React 19 + TypeScript + Zustand (Frontend)
- Vitest (Tests)
- Tailwind CSS v4 (Styling, dark-mode bg-Paare)
- Lucide-Icons (Tag-Icons)

**Spec-Referenz:** `ExamLab/docs/superpowers/specs/2026-05-15-cluster-h-tag-modell-design.md`

---

## File Structure

### Neue Dateien

| Pfad | Verantwortung |
|------|---------------|
| `packages/shared/src/types/tag.ts` | `Tag`-Interface + `TagFarbe`-Type |
| `ExamLab/src/services/tagsApi.ts` | Service-Wrapper (1:1 Backend-Endpoints) |
| `ExamLab/src/store/tagsStore.ts` | Zustand-Store mit Cache + Selektoren |
| `ExamLab/src/store/tagsStore.test.ts` | Vitest für Store |
| `packages/shared/src/editor/components/TagPicker.tsx` | Tag-Picker-Komponente für Frage-Editor |
| `packages/shared/src/editor/components/TagPicker.test.tsx` | Vitest |
| `ExamLab/src/components/lp/einstellungen/tags/TagsTab.tsx` | Verwaltungs-Tab Container |
| `ExamLab/src/components/lp/einstellungen/tags/TagsListe.tsx` | Liste mit Verwendungs-Anzahl |
| `ExamLab/src/components/lp/einstellungen/tags/TagEditModal.tsx` | Umbenennen + Farbe-Picker |
| `ExamLab/src/components/lp/einstellungen/tags/MergeTagsModal.tsx` | Mergen-Confirm |
| `ExamLab/src/components/lp/einstellungen/tags/TagFarbeChip.tsx` | Farb-Chip-Komponente (re-use Editor + Tab) |

### Modifizierte Dateien

| Pfad | Änderung |
|------|----------|
| `packages/shared/src/types/fragen-core.ts` | `tags: string[]` → `tags?: string[]` (legacy) + `tagIds: string[]` |
| `ExamLab/apps-script-code.js` | +Tags-Sheet-Init, +6 Endpoints, +Migrations-Endpoint, +`pruefeAdminOderFehler_`, `parseFrage`, `frageZuRow_`, `SCHREIBENDE_ACTIONS` |
| `ExamLab/src/utils/tabRegistry.ts` | +Tab-Definition `{id: 'tags', surface: 'einstellungen', ...}` |
| `ExamLab/src/store/fragensammlungStore.ts` | `ladeSummaries` triggert parallel `tagsStore.ladeAlleTags` |
| `ExamLab/src/services/fragensammlungApi.ts` | `speichereFrage` schreibt `tagIds` (statt `tags`) |
| `ExamLab/src/hooks/useFragenFilter.ts` Z.159, 199 | Hybrid-Check raus, `tagsStore.getById()`-Lookup |
| `ExamLab/src/utils/sucheAdapter.ts` Z.118 | dito |
| `ExamLab/src/components/lp/vorbereitung/composer/AbschnitteTab.tsx` Z.70 | dito |
| `ExamLab/src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx` Z.87 | dito |
| `ExamLab/src/components/ueben/SuSAnalyse.tsx` Z.59 | dito |
| `ExamLab/src/components/lp/ueben/AnalyseDashboard.tsx` Z.33 | dito |
| `ExamLab/src/components/ueben/admin/settings/AllgemeinTab.tsx` Z.30 | dito |
| `ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx` Z.59 | dito |
| `ExamLab/src/hooks/ueben/useThemenKomputationen.ts` Z.97 | dito |
| `ExamLab/src/components/settings/einstellungen/AdminTab.tsx` | +Wartungs-Sektion mit „Tag-Migration starten"-Button (temporär für Phase 1) |
| `packages/shared/src/editor/SharedFragenEditor.tsx` (oder MetadataSection) | TagPicker integrieren statt String-Tag-Edit |

---

## Phasen-Übersicht

| Phase | Inhalt | Ergebnis | Geschätzt |
|-------|--------|----------|-----------|
| **Phase 0** | Backend-Setup + Frontend-API + Types | API live, Frontend hat Wrapper, kein UI | 1 Tag |
| **Phase 1** | One-Shot-Migration | Tags-Sheet befüllt, Fragen haben `tagIds`, alte UI funktioniert | 0.5 Tag |
| **Phase 2** | Read/Write-Pfade umstellen + UI live | TagPicker im Editor, Verwaltungs-Tab, alte Hybrid-Code raus | 1.5 Tage |
| **Phase 3** | Cleanup (nach 2 Wochen Live-Betrieb) | `tagsLegacy` raus, Frontend-Fallback raus | 0.5 Tag |

**Pre-Commit-Checkliste vor jedem Commit (siehe `ExamLab/HANDOFF.md`):**
```bash
cd ExamLab
npx vitest run
npx tsc --noEmit
npm run build
npm run lint:as-any && npm run lint:no-alert && npm run lint:musterloesung && npm run lint:wire-contract
```

**Branch-Strategie:** Feature-Branch `feature/cluster-h-tag-modell` von `preview`. Push in mehreren Commits, am Ende Merge in `preview`. E2E auf preview-Deploy. Dann `preview` → `main` (fast-forward).

**Wire-Vertrag-Konformität:** Neue Apps-Script-Cases (`apiListTags`, `apiCreateTag`, `apiUpdateTag`, `apiArchiveTag`, `apiMergeTags`, `apiHardDeleteTag`, `apiMigriereTagsZuObjects`) MÜSSEN exakt zu Frontend-Aufrufen matchen, sonst schlägt `npm run lint:wire-contract` fehl.

---

# Phase 0 — Backend-Setup + Frontend-API + Types

Ziel: Backend-Endpoints live, Frontend-Wrappers + Store + Types vorhanden, aber **noch nicht im UI verwendet**. Nach Phase 0 funktioniert das alte System unverändert.

## Task 0.1: Branch + Worktree-Setup

**Files:** keine

- [ ] **Step 1: Feature-Branch von preview erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout preview
git pull origin preview
git checkout -b feature/cluster-h-tag-modell
```

- [ ] **Step 2: Branch-Status verifizieren**

```bash
git branch -vv
# Erwartet: * feature/cluster-h-tag-modell <hash> [neu]
```

---

## Task 0.2: Tag-Type-Definition (shared)

**Files:**
- Create: `packages/shared/src/types/tag.ts`

- [ ] **Step 1: Type-Datei schreiben**

```ts
// packages/shared/src/types/tag.ts

export type TagFarbe = 'slate' | 'red' | 'amber' | 'emerald' | 'sky' | 'violet' | 'pink' | 'stone';

export const TAG_FARBEN: TagFarbe[] = ['slate', 'red', 'amber', 'emerald', 'sky', 'violet', 'pink', 'stone'];

export interface Tag {
  id: string;             // UUID v4 (vom Backend via Utilities.getUuid())
  name: string;           // ohne Whitespace-Padding, case-preserving
  farbe: TagFarbe;        // Tailwind-Farb-Token
  archiviert: boolean;    // Soft-Delete
  erstelltAm: string;     // ISO-8601
  erstelltVon: string;    // LP-Email
}
```

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc --noEmit
# Erwartet: keine Fehler
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/tag.ts
git commit -m "Cluster H Phase 0: Tag-Type-Definition in packages/shared"
```

---

## Task 0.3: Frage-Type-Erweiterung (shared)

**Files:**
- Modify: `packages/shared/src/types/fragen-core.ts`

- [ ] **Step 1: tags + tagIds-Felder einfügen**

In der `Frage`-Interface (oder `BasisFrage`-Interface, je nach Codebase-Audit-Ergebnis):

```ts
// VORHER:
tags: string[];

// NACHHER:
/** @deprecated Cluster H Phase 3 entfernt — bis dahin koexistiert mit tagIds für Rollback */
tags?: string[];
/** Tag-Object-Referenzen (Cluster H, ab Phase 1) */
tagIds: string[];
```

- [ ] **Step 2: Build + tsc**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
# Erwartet: TypeScript-Fehler an allen 9+ Hybrid-Stellen (das ist beabsichtigt — Phase 2 fixt die)
```

**Hinweis:** Wenn der Build/tsc explodiert, ist das OK. Wir sind im Übergang. Optional: `tagIds` initial auch als `tagIds?: string[]` markieren, damit Code übergangsweise kompiliert. Plan-Phase-Empfehlung: optional, weil Phase 1 sofort befüllt.

- [ ] **Step 3: Commit (auch wenn tsc Warnings zeigt)**

```bash
git add packages/shared/src/types/fragen-core.ts
git commit -m "Cluster H Phase 0: Frage.tagIds + tags als legacy markiert"
```

---

## Task 0.4: Apps-Script — Admin-Helper

**Files:**
- Modify: `ExamLab/apps-script-code.js`

Audit zeigt: Admin-Check ist heute pro-Endpoint inline (`if (!lpInfo || lpInfo.rolle !== 'admin')`). Cluster H zentralisiert das.

- [ ] **Step 1: Helper am Anfang der Admin-Sektion einfügen**

Pfad-Hinweis: in der Nähe der bestehenden `getLPInfo()`-Definition (Zeile ~430).

```javascript
/**
 * Cluster H Phase 0: Zentrale Admin-Pruefung für destruktive Endpoints.
 * Returns null wenn OK, sonst jsonResponse mit Fehler.
 */
function pruefeAdminOderFehler_(lpInfo) {
  if (!lpInfo) {
    return jsonResponse({ error: 'Nicht authentifiziert' });
  }
  if (lpInfo.rolle !== 'admin') {
    return jsonResponse({ error: 'Nur fuer Admins' });
  }
  return null;
}
```

- [ ] **Step 2: Manueller Check im Apps-Script-Editor**

```bash
# Apps-Script läuft online — nach Deploy testen.
# Hier nur Lokal-Save + Commit.
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: pruefeAdminOderFehler_ Helper"
```

---

## Task 0.5: Apps-Script — Tags-Sheet-Init-Helper

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Helper-Funktion einfügen (in Nähe von Configs-Sheet-Code)**

```javascript
var TAGS_SHEET_NAME = 'Tags';
var TAGS_HEADER = ['id', 'name', 'farbe', 'archiviert', 'erstelltAm', 'erstelltVon'];

/**
 * Cluster H Phase 0: Init Tags-Sheet falls nicht vorhanden.
 * Wird beim ersten Tag-API-Call aufgerufen + von Migration.
 */
function getOderErstelleTagsSheet_() {
  var configs = SpreadsheetApp.openById(CONFIGS_SHEET_ID); // Konstante existiert bereits
  var sheet = configs.getSheetByName(TAGS_SHEET_NAME);
  if (!sheet) {
    sheet = configs.insertSheet(TAGS_SHEET_NAME);
    sheet.getRange(1, 1, 1, TAGS_HEADER.length).setValues([TAGS_HEADER]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Liest alle Tag-Zeilen aus Sheet, parsed zu Tag-Objects.
 */
function ladeAlleTagsAusSheet_() {
  var sheet = getOderErstelleTagsSheet_();
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return []; // nur Header

  var header = values[0];
  var idIdx = header.indexOf('id');
  var nameIdx = header.indexOf('name');
  var farbeIdx = header.indexOf('farbe');
  var archivIdx = header.indexOf('archiviert');
  var erstelltAmIdx = header.indexOf('erstelltAm');
  var erstelltVonIdx = header.indexOf('erstelltVon');

  var tags = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[idIdx]) continue;
    tags.push({
      id: String(row[idIdx]),
      name: String(row[nameIdx] || ''),
      farbe: String(row[farbeIdx] || 'slate'),
      archiviert: row[archivIdx] === true || row[archivIdx] === 'TRUE',
      erstelltAm: String(row[erstelltAmIdx] || ''),
      erstelltVon: String(row[erstelltVonIdx] || ''),
    });
  }
  return tags;
}
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: Tags-Sheet-Init-Helper"
```

---

## Task 0.6: Apps-Script — `apiListTags`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
/**
 * Cluster H Phase 0: Liste alle Tags.
 * Default: nur nicht-archivierte. Admin kann inkludiereArchivierte=true setzen.
 */
function apiListTags(body) {
  var lpInfo = getLPInfo(body.email);
  if (!lpInfo) return jsonResponse({ error: 'Nicht authentifiziert' });

  var alleTags = ladeAlleTagsAusSheet_();
  var inkludiereArchivierte = body.inkludiereArchivierte === true && lpInfo.rolle === 'admin';
  var gefiltert = inkludiereArchivierte ? alleTags : alleTags.filter(function(t) { return !t.archiviert; });

  return jsonResponse({ ok: true, tags: gefiltert });
}
```

- [ ] **Step 2: Case im `doPost`-Router registrieren**

In der `LP_ACTIONS`-Liste hinzufügen + Switch-Case in `doPost` (siehe Zeile ~1273+).

```javascript
// LP_ACTIONS-Konstante erweitern:
var LP_ACTIONS = [
  'speichereFrage', /* ... bestehende ... */
  'apiListTags', 'apiCreateTag', 'apiUpdateTag',
  'apiArchiveTag', 'apiMergeTags', 'apiHardDeleteTag',
  'apiMigriereTagsZuObjects'
];

// Im Switch:
case 'apiListTags': return apiListTags(body);
```

- [ ] **Step 3: SCHREIBENDE_ACTIONS unverändert** (apiListTags ist read-only)

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: apiListTags Endpoint"
```

---

## Task 0.7: Apps-Script — `apiCreateTag` (mit Case-Insensitive Existenz-Check)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
/**
 * Cluster H Phase 0: Neuer Tag. Case-insensitive: existiert Tag mit gleichem Lowercase-Namen,
 * wird der existierende zurückgegeben (kein Duplikat).
 * Nutzt LockService für concurrent-safe Create.
 */
function apiCreateTag(body) {
  var lpInfo = getLPInfo(body.email);
  if (!lpInfo) return jsonResponse({ error: 'Nicht authentifiziert' });

  var name = String(body.name || '').trim();
  if (!name) return jsonResponse({ error: 'Name ist Pflicht' });

  var farbe = body.farbe || 'slate';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var alleTags = ladeAlleTagsAusSheet_();
    var existierend = alleTags.find(function(t) {
      return t.name.toLowerCase() === name.toLowerCase();
    });
    if (existierend) {
      return jsonResponse({ ok: true, tag: existierend, existierte: true });
    }

    var sheet = getOderErstelleTagsSheet_();
    var neuerTag = {
      id: Utilities.getUuid(),
      name: name,
      farbe: farbe,
      archiviert: false,
      erstelltAm: new Date().toISOString(),
      erstelltVon: lpInfo.email,
    };
    sheet.appendRow([
      neuerTag.id,
      neuerTag.name,
      neuerTag.farbe,
      neuerTag.archiviert,
      neuerTag.erstelltAm,
      neuerTag.erstelltVon,
    ]);
    cacheInvalidieren_();
    return jsonResponse({ ok: true, tag: neuerTag, existierte: false });
  } finally {
    lock.releaseLock();
  }
}
```

- [ ] **Step 2: Switch-Case + SCHREIBENDE_ACTIONS aufnehmen**

```javascript
// SCHREIBENDE_ACTIONS erweitern:
var SCHREIBENDE_ACTIONS = LP_ACTIONS.concat(['speichereAntworten']);
// (alle Tag-Endpoints sind in LP_ACTIONS, also automatisch drin)

// Im Switch:
case 'apiCreateTag': return apiCreateTag(body);
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: apiCreateTag mit LockService + case-insensitive Dedup"
```

---

## Task 0.8: Apps-Script — `apiUpdateTag`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
/**
 * Cluster H Phase 0: Tag editieren (Name oder Farbe). Jeder LP.
 */
function apiUpdateTag(body) {
  var lpInfo = getLPInfo(body.email);
  if (!lpInfo) return jsonResponse({ error: 'Nicht authentifiziert' });

  var id = String(body.id || '');
  if (!id) return jsonResponse({ error: 'id ist Pflicht' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getOderErstelleTagsSheet_();
    var values = sheet.getDataRange().getValues();
    var header = values[0];
    var idIdx = header.indexOf('id');
    var nameIdx = header.indexOf('name');
    var farbeIdx = header.indexOf('farbe');

    for (var i = 1; i < values.length; i++) {
      if (values[i][idIdx] === id) {
        if (body.name !== undefined) {
          var neuName = String(body.name).trim();
          if (!neuName) return jsonResponse({ error: 'Name darf nicht leer sein' });
          // Case-insensitive Existenz-Check (anderer Tag mit gleichem Namen)
          for (var j = 1; j < values.length; j++) {
            if (j !== i && String(values[j][nameIdx]).toLowerCase() === neuName.toLowerCase()) {
              return jsonResponse({ error: 'Tag mit diesem Namen existiert bereits' });
            }
          }
          sheet.getRange(i + 1, nameIdx + 1).setValue(neuName);
        }
        if (body.farbe !== undefined) {
          sheet.getRange(i + 1, farbeIdx + 1).setValue(body.farbe);
        }
        cacheInvalidieren_();
        // Tag neu lesen für Response
        var aktualisiertTag = ladeAlleTagsAusSheet_().find(function(t) { return t.id === id; });
        return jsonResponse({ ok: true, tag: aktualisiertTag });
      }
    }
    return jsonResponse({ error: 'Tag nicht gefunden' });
  } finally {
    lock.releaseLock();
  }
}
```

- [ ] **Step 2: Switch-Case**

```javascript
case 'apiUpdateTag': return apiUpdateTag(body);
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: apiUpdateTag mit Name-Conflict-Check"
```

---

## Task 0.9: Apps-Script — `apiArchiveTag` (Admin)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
function apiArchiveTag(body) {
  var lpInfo = getLPInfo(body.email);
  var fehler = pruefeAdminOderFehler_(lpInfo);
  if (fehler) return fehler;

  var id = String(body.id || '');
  if (!id) return jsonResponse({ error: 'id ist Pflicht' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getOderErstelleTagsSheet_();
    var values = sheet.getDataRange().getValues();
    var header = values[0];
    var idIdx = header.indexOf('id');
    var archivIdx = header.indexOf('archiviert');

    for (var i = 1; i < values.length; i++) {
      if (values[i][idIdx] === id) {
        sheet.getRange(i + 1, archivIdx + 1).setValue(true);
        cacheInvalidieren_();
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ error: 'Tag nicht gefunden' });
  } finally {
    lock.releaseLock();
  }
}
```

- [ ] **Step 2: Switch-Case + Commit**

```bash
# Switch-Case:
case 'apiArchiveTag': return apiArchiveTag(body);

git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: apiArchiveTag (Admin-only)"
```

---

## Task 0.10: Apps-Script — `apiHardDeleteTag` (Admin)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
/**
 * Cluster H Phase 0: Endgültig löschen. Wirft Fehler wenn Tag noch in Fragen referenced.
 * Iteriert alle Frage-Sheets (VWL, BWL, Recht, Informatik) + sucht in tagIds-Spalte.
 */
function apiHardDeleteTag(body) {
  var lpInfo = getLPInfo(body.email);
  var fehler = pruefeAdminOderFehler_(lpInfo);
  if (fehler) return fehler;

  var id = String(body.id || '');
  if (!id) return jsonResponse({ error: 'id ist Pflicht' });

  // Prüfe Verwendung in allen Frage-Sheets
  var verwendungsCount = zaehleTagVerwendung_(id);
  if (verwendungsCount > 0) {
    return jsonResponse({
      error: 'Tag wird noch von ' + verwendungsCount + ' Fragen verwendet. Erst archivieren oder Fragen umtaggen.'
    });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getOderErstelleTagsSheet_();
    var values = sheet.getDataRange().getValues();
    var header = values[0];
    var idIdx = header.indexOf('id');
    for (var i = 1; i < values.length; i++) {
      if (values[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        cacheInvalidieren_();
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ error: 'Tag nicht gefunden' });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper: zählt Verwendung einer tagId über alle Frage-Sheets.
 */
function zaehleTagVerwendung_(tagId) {
  var fachbereiche = ['VWL', 'BWL', 'Recht', 'Informatik']; // dynamisch ggf. aus Config holen
  var fragensammlung = SpreadsheetApp.openById(FRAGENSAMMLUNG_SHEET_ID); // Konstante existiert
  var count = 0;
  for (var f = 0; f < fachbereiche.length; f++) {
    var sheet = fragensammlung.getSheetByName(fachbereiche[f]);
    if (!sheet) continue;
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) continue;
    var header = values[0];
    var tagIdsIdx = header.indexOf('tagIds');
    if (tagIdsIdx < 0) continue;
    for (var i = 1; i < values.length; i++) {
      var ids = String(values[i][tagIdsIdx] || '').split(',').map(function(s) { return s.trim(); });
      if (ids.indexOf(tagId) >= 0) count++;
    }
  }
  return count;
}
```

- [ ] **Step 2: Switch-Case + Commit**

```bash
case 'apiHardDeleteTag': return apiHardDeleteTag(body);

git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: apiHardDeleteTag mit Verwendungs-Check"
```

---

## Task 0.11: Apps-Script — `apiMergeTags` (Admin)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
/**
 * Cluster H Phase 0: Mergen mehrerer Tags zu einem Master.
 * Schritt 1: alle Frage-Sheets durchgehen, in tagIds-Spalte mergedIds durch masterId ersetzen.
 * Schritt 2: mergedIds als archiviert markieren.
 */
function apiMergeTags(body) {
  var lpInfo = getLPInfo(body.email);
  var fehler = pruefeAdminOderFehler_(lpInfo);
  if (fehler) return fehler;

  var masterId = String(body.masterId || '');
  var mergedIds = body.mergedIds || [];
  if (!masterId || mergedIds.length === 0) {
    return jsonResponse({ error: 'masterId und mergedIds[] sind Pflicht' });
  }
  if (mergedIds.indexOf(masterId) >= 0) {
    return jsonResponse({ error: 'masterId darf nicht in mergedIds sein' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // länger weil Multi-Sheet-Update

  try {
    var fachbereiche = ['VWL', 'BWL', 'Recht', 'Informatik'];
    var fragensammlung = SpreadsheetApp.openById(FRAGENSAMMLUNG_SHEET_ID);
    var fragenAktualisiert = 0;

    for (var f = 0; f < fachbereiche.length; f++) {
      var sheet = fragensammlung.getSheetByName(fachbereiche[f]);
      if (!sheet) continue;
      var values = sheet.getDataRange().getValues();
      if (values.length <= 1) continue;
      var header = values[0];
      var tagIdsIdx = header.indexOf('tagIds');
      if (tagIdsIdx < 0) continue;

      // Sammle Updates für Batch-Schreiben
      var updates = []; // { row: number, neuTagIds: string }
      for (var i = 1; i < values.length; i++) {
        var ids = String(values[i][tagIdsIdx] || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        var modifiziert = false;
        var neueIds = [];
        var hasMaster = ids.indexOf(masterId) >= 0;

        for (var j = 0; j < ids.length; j++) {
          if (mergedIds.indexOf(ids[j]) >= 0) {
            modifiziert = true;
            if (!hasMaster && neueIds.indexOf(masterId) < 0) {
              neueIds.push(masterId);
              hasMaster = true;
            }
          } else {
            neueIds.push(ids[j]);
          }
        }

        if (modifiziert) {
          updates.push({ row: i + 1, neuTagIds: neueIds.join(',') });
          fragenAktualisiert++;
        }
      }

      // Batch-write
      for (var u = 0; u < updates.length; u++) {
        sheet.getRange(updates[u].row, tagIdsIdx + 1).setValue(updates[u].neuTagIds);
      }
    }

    // Mergte Tags archivieren
    var tagsSheet = getOderErstelleTagsSheet_();
    var tagsValues = tagsSheet.getDataRange().getValues();
    var tagsHeader = tagsValues[0];
    var idIdx = tagsHeader.indexOf('id');
    var archivIdx = tagsHeader.indexOf('archiviert');
    for (var k = 1; k < tagsValues.length; k++) {
      if (mergedIds.indexOf(String(tagsValues[k][idIdx])) >= 0) {
        tagsSheet.getRange(k + 1, archivIdx + 1).setValue(true);
      }
    }

    cacheInvalidieren_();
    return jsonResponse({ ok: true, fragenAktualisiert: fragenAktualisiert });
  } finally {
    lock.releaseLock();
  }
}
```

- [ ] **Step 2: Switch-Case + Commit**

```bash
case 'apiMergeTags': return apiMergeTags(body);

git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: apiMergeTags (Admin-only, multi-sheet update)"
```

---

## Task 0.12: Apps-Script — `apiMigriereTagsZuObjects` (One-Shot)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
/**
 * Cluster H Phase 1: Einmalige Migration String-Tags → Tag-Objects + tagIds.
 *
 * Idempotenz: Sheet darf nicht leer sein UND Fragen müssen tags enthalten.
 *             Sonst Fehler (verhindert Doppel-Lauf).
 *
 * Atomarität: Schreibt erst alle Tag-Objects komplett, dann iteriert Frage-Updates.
 *             Bei Crash zwischen den beiden Phasen: idempotent-Re-Run findet Tags-Sheet voll
 *             und gibt Fehler — manueller Eingriff (Tags-Sheet leeren) nötig.
 *             Plan-Phase-Risiko: dokumentiert, wird in Browser-E2E nicht getestet weil destruktiv.
 *
 * Apps-Script-Limit 6 min: Plan geht von <2000 Fragen aus. Audit zeigt keine konkreten Zahlen,
 *                          aber Schul-Datenbestand ist vermutlich 100-500 Fragen.
 *                          Bei Timeout: ggf. Batch-Variante in Folge-PR (siehe Spec §13).
 */
function apiMigriereTagsZuObjects(body) {
  var lpInfo = getLPInfo(body.email);
  var fehler = pruefeAdminOderFehler_(lpInfo);
  if (fehler) return fehler;

  var startTime = new Date().getTime();
  var fachbereiche = ['VWL', 'BWL', 'Recht', 'Informatik'];
  var fragensammlung = SpreadsheetApp.openById(FRAGENSAMMLUNG_SHEET_ID);

  // ===== Schritt 1: Idempotenz-Check =====
  var existierendeTags = ladeAlleTagsAusSheet_();
  if (existierendeTags.length > 0) {
    return jsonResponse({ error: 'Tags-Sheet ist nicht leer. Migration bereits gelaufen oder manueller Eingriff nötig.' });
  }

  // ===== Schritt 2: Alle Frage-Tags sammeln =====
  var alleStringTags = []; // { name: string, fachbereich: string, frageRow: number, frageId: string }
  var fragenSheetData = {}; // pro fachbereich die rohen Sheet-Daten

  for (var f = 0; f < fachbereiche.length; f++) {
    var fb = fachbereiche[f];
    var sheet = fragensammlung.getSheetByName(fb);
    if (!sheet) continue;
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) continue;
    var header = values[0];
    var tagsIdx = header.indexOf('tags');
    var idIdx = header.indexOf('id');
    if (tagsIdx < 0) continue;

    fragenSheetData[fb] = { sheet: sheet, values: values, header: header, tagsIdx: tagsIdx, idIdx: idIdx };

    for (var i = 1; i < values.length; i++) {
      var rawTags = String(values[i][tagsIdx] || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      for (var t = 0; t < rawTags.length; t++) {
        alleStringTags.push({
          name: rawTags[t],
          fachbereich: fb,
          frageRow: i + 1,
          frageId: String(values[i][idIdx])
        });
      }
    }
  }

  if (alleStringTags.length === 0) {
    return jsonResponse({ error: 'Keine String-Tags gefunden. Migration nicht nötig.' });
  }

  // ===== Schritt 3: Case-insensitive Dedup =====
  // Map: lowercase-name → { kanonName, casings: { casing → count } }
  var dedupMap = {};
  for (var k = 0; k < alleStringTags.length; k++) {
    var entry = alleStringTags[k];
    var key = entry.name.toLowerCase();
    if (!dedupMap[key]) {
      dedupMap[key] = { casings: {} };
    }
    dedupMap[key].casings[entry.name] = (dedupMap[key].casings[entry.name] || 0) + 1;
  }

  // Kanonischer Name = häufigstes Casing (Tie-Break: alphabetisch erstes)
  for (var lkey in dedupMap) {
    var casings = dedupMap[lkey].casings;
    var beste = null;
    var besteCount = 0;
    for (var casing in casings) {
      var count = casings[casing];
      if (count > besteCount || (count === besteCount && (beste === null || casing < beste))) {
        beste = casing;
        besteCount = count;
      }
    }
    dedupMap[lkey].kanonName = beste;
  }

  // ===== Schritt 4: Tag-Objects erstellen =====
  var tagsSheet = getOderErstelleTagsSheet_();
  var jetzt = new Date().toISOString();
  var nameZuId = {}; // lowercase-name → tag-id
  var neueTagsZeilen = [];
  for (var lname in dedupMap) {
    var id = Utilities.getUuid();
    nameZuId[lname] = id;
    neueTagsZeilen.push([
      id,
      dedupMap[lname].kanonName,
      'slate',  // Default-Farbe
      false,    // archiviert
      jetzt,
      'migration@system'
    ]);
  }
  if (neueTagsZeilen.length > 0) {
    tagsSheet.getRange(2, 1, neueTagsZeilen.length, TAGS_HEADER.length).setValues(neueTagsZeilen);
  }

  // ===== Schritt 5: Frage-Sheets aktualisieren — tagIds-Spalte hinzufügen + befüllen =====
  var fragenAktualisiert = 0;
  for (var f2 = 0; f2 < fachbereiche.length; f2++) {
    var fb2 = fachbereiche[f2];
    if (!fragenSheetData[fb2]) continue;
    var data = fragenSheetData[fb2];

    // Spalte tagIds hinzufügen falls nicht vorhanden
    var tagIdsIdx = data.header.indexOf('tagIds');
    if (tagIdsIdx < 0) {
      var neueSpalteIdx = data.header.length + 1;
      data.sheet.getRange(1, neueSpalteIdx).setValue('tagIds');
      tagIdsIdx = neueSpalteIdx - 1; // 0-basiert für values
    }

    // Pro Zeile: tagIds-Wert berechnen aus tags-Wert
    var updates = [];
    for (var ii = 1; ii < data.values.length; ii++) {
      var rawTags2 = String(data.values[ii][data.tagsIdx] || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      var ids = rawTags2.map(function(name) { return nameZuId[name.toLowerCase()]; }).filter(Boolean);
      updates.push({ row: ii + 1, value: ids.join(',') });
    }

    // Batch-Write
    for (var uu = 0; uu < updates.length; uu++) {
      data.sheet.getRange(updates[uu].row, tagIdsIdx + 1).setValue(updates[uu].value);
      fragenAktualisiert++;
    }

    // Spalte tags zu tagsLegacy umbenennen (für Rollback-Sicherheit)
    var tagsLegacyIdx = data.header.indexOf('tagsLegacy');
    if (tagsLegacyIdx < 0) {
      data.sheet.getRange(1, data.tagsIdx + 1).setValue('tagsLegacy');
    }
  }

  cacheInvalidieren_();
  var dauerMs = new Date().getTime() - startTime;
  return jsonResponse({
    ok: true,
    neueTags: neueTagsZeilen.length,
    fragenAktualisiert: fragenAktualisiert,
    dauerMs: dauerMs
  });
}
```

- [ ] **Step 2: Switch-Case + Commit**

```bash
case 'apiMigriereTagsZuObjects': return apiMigriereTagsZuObjects(body);

git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: apiMigriereTagsZuObjects (One-Shot, idempotent, atomar)"
```

---

## Task 0.13: Apps-Script — `parseFrage` und `frageZuRow_` aktualisieren

**Files:**
- Modify: `ExamLab/apps-script-code.js`

`parseFrage` muss `tagIds` lesen, `frageZuRow_` (oder Schreib-Pfad) muss `tagIds` schreiben. Während Phase-2-Übergangs lesen wir BEIDE und liefern beide an Frontend. Phase 3 entfernt `tags`/`tagsLegacy`.

- [ ] **Step 1: parseFrage erweitern**

In `parseFrage` (Zeile ~2962):

```javascript
// VORHER:
tags: (row.tags || '').split(',').map(s => s.trim()).filter(Boolean),

// NACHHER:
tags: (row.tagsLegacy || row.tags || '').split(',').map(function(s){return s.trim();}).filter(Boolean),
tagIds: (row.tagIds || '').split(',').map(function(s){return s.trim();}).filter(Boolean),
```

- [ ] **Step 2: Schreib-Pfad (`frageZuRow_` oder `speichereFrage`) erweitern**

Dort wo Frage zu Sheet-Zeile serialisiert wird: `tagIds.join(',')` in tagIds-Spalte schreiben. `tags`-Pfad bleibt unverändert (Legacy).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Cluster H Phase 0: parseFrage + Schreib-Pfad lesen/schreiben tagIds"
```

---

## Task 0.14: Apps-Script — Deploy

**Files:** keine (manueller Schritt)

- [ ] **Step 1: Code im Apps-Script-Editor öffnen**

```bash
# Via Apps-Script-IDE (https://script.google.com)
# Datei: ExamLab/apps-script-code.js → in Editor copy-pasten
# (Alternativ: clasp push falls eingerichtet)
```

- [ ] **Step 2: Neue Version deployen**

In Apps-Script-Editor: „Deploy" → „Manage deployments" → neue Version mit Beschreibung „Cluster H Phase 0: Tag-Endpoints + Migration".

- [ ] **Step 3: Smoke-Test mit Curl/Postman**

```bash
# Annahme: Web-App-URL bekannt
URL="https://script.google.com/macros/s/<DEPLOY_ID>/exec"
curl -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"action":"apiListTags","email":"<deine-email>"}'
# Erwartet: {"ok":true,"tags":[]}
```

- [ ] **Step 4: Cache nach Deploy invalidieren**

Im Apps-Script-Editor manuell aufrufen: `cacheInvalidieren_()` (über Run-Menu).

---

## Task 0.15: Frontend — `tagsApi.ts` Service-Wrapper

**Files:**
- Create: `ExamLab/src/services/tagsApi.ts`

- [ ] **Step 1: Service-Datei schreiben**

```ts
// ExamLab/src/services/tagsApi.ts
import { postJson } from './apiClient'; // existierender Helper
import type { Tag, TagFarbe } from '@shared/types/tag';

export async function listeTags(opts?: { inkludiereArchivierte?: boolean }): Promise<Tag[]> {
  const r = await postJson<{ tags: Tag[] }>('apiListTags', {
    inkludiereArchivierte: opts?.inkludiereArchivierte ?? false,
  });
  return r.tags;
}

export async function erstelleTag(input: { name: string; farbe?: TagFarbe }): Promise<{ tag: Tag; existierte: boolean }> {
  const r = await postJson<{ tag: Tag; existierte: boolean }>('apiCreateTag', input);
  return r;
}

export async function aktualisiereTag(input: { id: string; name?: string; farbe?: TagFarbe }): Promise<Tag> {
  const r = await postJson<{ tag: Tag }>('apiUpdateTag', input);
  return r.tag;
}

export async function archiviereTag(id: string): Promise<void> {
  await postJson('apiArchiveTag', { id });
}

export async function mergeTags(input: { masterId: string; mergedIds: string[] }): Promise<{ fragenAktualisiert: number }> {
  const r = await postJson<{ fragenAktualisiert: number }>('apiMergeTags', input);
  return r;
}

export async function hardDeleteTag(id: string): Promise<void> {
  await postJson('apiHardDeleteTag', { id });
}

export async function migriereTagsZuObjects(): Promise<{ neueTags: number; fragenAktualisiert: number; dauerMs: number }> {
  const r = await postJson<{ neueTags: number; fragenAktualisiert: number; dauerMs: number }>('apiMigriereTagsZuObjects', {});
  return r;
}
```

**Pfad-Hinweis:** `postJson` ist der existierende API-Client (Plan-Phase verifiziert exakten Import-Pfad — vermutlich `./apiClient` oder `../utils/api`).

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc --noEmit
# Erwartet: keine Fehler
```

- [ ] **Step 3: Wire-Contract-Lint**

```bash
cd ExamLab && npm run lint:wire-contract
# Erwartet: 7 neue Action-Pairs gematchet (apiListTags, apiCreateTag, ...)
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/services/tagsApi.ts
git commit -m "Cluster H Phase 0: tagsApi.ts Service-Wrapper"
```

---

## Task 0.16: Frontend — `tagsStore.ts` (Zustand-Store)

**Files:**
- Create: `ExamLab/src/store/tagsStore.ts`

- [ ] **Step 1: Store-Datei schreiben**

```ts
// ExamLab/src/store/tagsStore.ts
import { create } from 'zustand';
import type { Tag } from '@shared/types/tag';
import { listeTags } from '../services/tagsApi';

interface TagsState {
  tags: Tag[];
  geladen: boolean;
  ladend: boolean;
  fehler: string | null;
  ladeAlleTags: (opts?: { inkludiereArchivierte?: boolean }) => Promise<void>;
  upsertLokal: (tag: Tag) => void;
  entferneLokal: (id: string) => void;
  getById: (id: string) => Tag | undefined;
  getByIds: (ids: string[]) => Tag[];
  getByName: (name: string) => Tag | undefined;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  geladen: false,
  ladend: false,
  fehler: null,

  ladeAlleTags: async (opts) => {
    if (get().ladend) return;
    set({ ladend: true, fehler: null });
    try {
      const tags = await listeTags(opts);
      set({ tags, geladen: true, ladend: false });
    } catch (e) {
      set({ fehler: String(e), ladend: false });
    }
  },

  upsertLokal: (tag) => set((state) => {
    const idx = state.tags.findIndex((t) => t.id === tag.id);
    if (idx >= 0) {
      const neu = [...state.tags];
      neu[idx] = tag;
      return { tags: neu };
    }
    return { tags: [...state.tags, tag] };
  }),

  entferneLokal: (id) => set((state) => ({
    tags: state.tags.filter((t) => t.id !== id),
  })),

  getById: (id) => get().tags.find((t) => t.id === id),

  getByIds: (ids) => {
    const map = new Map(get().tags.map((t) => [t.id, t]));
    return ids.map((id) => map.get(id)).filter((t): t is Tag => Boolean(t));
  },

  getByName: (name) => {
    const lower = name.toLowerCase();
    return get().tags.find((t) => t.name.toLowerCase() === lower);
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/src/store/tagsStore.ts
git commit -m "Cluster H Phase 0: tagsStore Zustand-Store"
```

---

## Task 0.17: Frontend — `tagsStore.test.ts`

**Files:**
- Create: `ExamLab/src/store/tagsStore.test.ts`

- [ ] **Step 1: Test-Datei schreiben (TDD: failing first)**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTagsStore } from './tagsStore';
import type { Tag } from '@shared/types/tag';

vi.mock('../services/tagsApi', () => ({
  listeTags: vi.fn().mockResolvedValue([
    { id: 't1', name: 'aktuell', farbe: 'slate', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
    { id: 't2', name: 'schwer', farbe: 'red', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
  ]),
}));

describe('tagsStore', () => {
  beforeEach(() => {
    useTagsStore.setState({ tags: [], geladen: false, ladend: false, fehler: null });
  });

  it('ladeAlleTags füllt Store', async () => {
    await useTagsStore.getState().ladeAlleTags();
    expect(useTagsStore.getState().tags).toHaveLength(2);
    expect(useTagsStore.getState().geladen).toBe(true);
  });

  it('getById findet Tag', async () => {
    await useTagsStore.getState().ladeAlleTags();
    const tag = useTagsStore.getState().getById('t1');
    expect(tag?.name).toBe('aktuell');
  });

  it('getById gibt undefined für unbekannte id', async () => {
    await useTagsStore.getState().ladeAlleTags();
    expect(useTagsStore.getState().getById('xxx')).toBeUndefined();
  });

  it('getByIds filtert orphans raus', async () => {
    await useTagsStore.getState().ladeAlleTags();
    const result = useTagsStore.getState().getByIds(['t1', 'orphan', 't2']);
    expect(result.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('getByName ist case-insensitive', async () => {
    await useTagsStore.getState().ladeAlleTags();
    expect(useTagsStore.getState().getByName('AKTUELL')?.id).toBe('t1');
  });

  it('upsertLokal fügt neuen hinzu', async () => {
    await useTagsStore.getState().ladeAlleTags();
    const neu: Tag = { id: 't3', name: 'neu', farbe: 'sky', archiviert: false, erstelltAm: '2026-01-02', erstelltVon: 'a@b' };
    useTagsStore.getState().upsertLokal(neu);
    expect(useTagsStore.getState().tags).toHaveLength(3);
    expect(useTagsStore.getState().getById('t3')?.name).toBe('neu');
  });

  it('upsertLokal updated existierenden', async () => {
    await useTagsStore.getState().ladeAlleTags();
    const aktualisiert: Tag = { id: 't1', name: 'aktualisiert', farbe: 'pink', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' };
    useTagsStore.getState().upsertLokal(aktualisiert);
    expect(useTagsStore.getState().tags).toHaveLength(2);
    expect(useTagsStore.getState().getById('t1')?.name).toBe('aktualisiert');
  });

  it('entferneLokal entfernt nach id', async () => {
    await useTagsStore.getState().ladeAlleTags();
    useTagsStore.getState().entferneLokal('t1');
    expect(useTagsStore.getState().tags).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Test ausführen (sollte rot sein wenn tagsStore noch nicht existiert)**

```bash
cd ExamLab && npx vitest run src/store/tagsStore.test.ts
# Falls grün: tagsStore.ts war Task 0.16 — Test bestätigt es passt
# Falls rot: zurück zu Task 0.16 Implementierung fixen
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/store/tagsStore.test.ts
git commit -m "Cluster H Phase 0: tagsStore-Tests (8 Tests)"
```

---

## Task 0.18: Pre-Flight-Check Phase 0

**Files:** keine

- [ ] **Step 1: Alle Pre-Commit-Checks**

```bash
cd ExamLab
npx vitest run
npx tsc --noEmit
npm run build
npm run lint:as-any && npm run lint:no-alert && npm run lint:musterloesung && npm run lint:wire-contract
```

Erwartet: alles grün.

- [ ] **Step 2: Push Feature-Branch**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push -u origin feature/cluster-h-tag-modell
```

**Phase 0 abgeschlossen.** Backend live, Frontend hat API-Wrapper + Store + Tests, kein UI sichtbar.

---

# Phase 1 — One-Shot-Migration

Ziel: einmalig die Migration laufen lassen, verifizieren dass Tags-Sheet befüllt + Fragen `tagIds` haben.

## Task 1.1: Temp-Migrations-Button im AdminTab

**Files:**
- Modify: `ExamLab/src/components/settings/einstellungen/AdminTab.tsx`

- [ ] **Step 1: Wartungs-Sektion mit Button hinzufügen**

```tsx
// Am Ende des AdminTab-Bodies (vor dem schließenden Container):
import { migriereTagsZuObjects } from '../../../services/tagsApi';

// Innerhalb des Component-Bodies:
const [migrLaeuft, setMigrLaeuft] = useState(false);
const [migrErgebnis, setMigrErgebnis] = useState<{ neueTags: number; fragenAktualisiert: number; dauerMs: number } | null>(null);

async function handleMigrationStarten() {
  if (!confirm('Tag-Migration starten? Läuft nur einmal — Tags-Sheet muss leer sein.')) return;
  setMigrLaeuft(true);
  try {
    const r = await migriereTagsZuObjects();
    setMigrErgebnis(r);
  } catch (e) {
    alert('Fehler: ' + String(e));
  } finally {
    setMigrLaeuft(false);
  }
}

// JSX:
<section className="mt-8 p-4 border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
  <h3 className="text-lg font-bold mb-2">⚠ Cluster H — Tag-Migration (einmalig)</h3>
  <p className="text-sm mb-3">
    Migriert alle Frage-Tags (string[]) zu Tag-Object-Referenzen (tagIds[]).
    Idempotent — kann nur einmal laufen. Tags-Sheet wird befüllt.
  </p>
  <Button onClick={handleMigrationStarten} variant="primary" disabled={migrLaeuft} loading={migrLaeuft}>
    {migrLaeuft ? 'Läuft...' : 'Migration starten'}
  </Button>
  {migrErgebnis && (
    <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded">
      ✅ {migrErgebnis.neueTags} Tags erstellt, {migrErgebnis.fragenAktualisiert} Fragen aktualisiert ({migrErgebnis.dauerMs}ms)
    </div>
  )}
</section>
```

**Pfad-Hinweis:** Plan-Phase verifiziert konkreten Import-Pfad zu `Button`. Audit zeigte: `ExamLab/src/components/ui/Button.tsx`.

- [ ] **Step 2: Lint-Check (no-alert!)**

```bash
cd ExamLab && npm run lint:no-alert
# Wenn fehlschlägt: alert/confirm durch BaseDialog ersetzen
```

**Falls lint:no-alert die `confirm()`-Verwendung blockiert:** Alternative über `BaseDialog`-Modal:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);
// Button öffnet Modal, Modal hat „Bestätigen"-Button der `handleMigrationStartenOK` aufruft
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/settings/einstellungen/AdminTab.tsx
git commit -m "Cluster H Phase 1: Temp-Migrations-Button im AdminTab"
```

---

## Task 1.2: Browser-E2E Migration auf Test-Repo

**Files:** keine (manueller Test)

- [ ] **Step 1: Branch-Deploy nach preview**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push origin feature/cluster-h-tag-modell
# Merge per PR oder direkt:
git checkout preview && git merge --ff-only feature/cluster-h-tag-modell && git push origin preview
```

- [ ] **Step 2: Cache-Reset im Browser**

```js
// Im DevTools-Console auf https://durandbourjate.github.io/GYM-WR-DUY/staging/
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
```

Reload mit `?nocache=<timestamp>`.

- [ ] **Step 3: Login als Admin-LP, Migration starten**

- Login via echter LP-Email (Memory: `wr` oder andere mit `rolle=admin` in `Lehrpersonen`-Sheet)
- Einstellungen → Admin-Tab → „Migration starten" klicken
- Bestätigen
- Erwartet: Erfolgs-Box „X Tags erstellt, Y Fragen aktualisiert"

- [ ] **Step 4: Verifikation via Backend-Sheet**

- Apps-Script-Editor öffnen → Configs-Sheet → Tab `Tags` muss existieren mit X Zeilen
- Frage-Sheet (z.B. VWL) → neue Spalte `tagIds` befüllt, alte Spalte heisst jetzt `tagsLegacy`

- [ ] **Step 5: Verifikation: alte UI funktioniert noch**

- Eine Frage öffnen, Tags werden noch angezeigt (lesen aus `tagIds` via `tagsStore`-Lookup oder Hybrid noch via `tagsLegacy`).
- Frage speichern — keine Crashes.

**Phase 1 abgeschlossen.** Migration live, Daten in Tag-Object-Form.

---

# Phase 2 — Read/Write-Pfade umstellen + UI live

Ziel: alle 9 Hybrid-Code-Stellen sauber refaktorieren, TagPicker im Editor, Tag-Verwaltungs-Tab.

## Task 2.1: `fragensammlungStore` lädt parallel `tagsStore`

**Files:**
- Modify: `ExamLab/src/store/fragensammlungStore.ts`

- [ ] **Step 1: In `ladeSummaries`-Action `tagsStore.ladeAlleTags()` triggern**

```ts
import { useTagsStore } from './tagsStore';

// In ladeSummaries:
ladeSummaries: async () => {
  await Promise.all([
    /* bestehender summaries-Load */,
    useTagsStore.getState().ladeAlleTags(),
  ]);
}
```

- [ ] **Step 2: Test grün**

```bash
cd ExamLab && npx vitest run src/store/fragensammlungStore.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/store/fragensammlungStore.ts
git commit -m "Cluster H Phase 2: fragensammlungStore triggert tagsStore.ladeAlleTags"
```

---

## Task 2.2: 9 Hybrid-Code-Stellen umstellen

Alle 9 Stellen (Audit D13) ersetzen `typeof t === 'string' ? t : t.name` durch `tagsStore`-Lookup. Pattern:

```ts
// VORHER:
{frage.tags.map(t => typeof t === 'string' ? t : t.name)}

// NACHHER:
{useTagsStore.getState().getByIds(frage.tagIds).map(t => t.name)}
// oder mit Hook:
const tagNamen = useTagsStore(s => s.getByIds(frage.tagIds).map(t => t.name));
```

**Reihenfolge** (jede in eigenem Commit, je 5-10 Z. Änderung):

- [ ] **Step 1: `ExamLab/src/utils/sucheAdapter.ts:118`** — Such-Adapter
- [ ] **Step 2: `ExamLab/src/components/ueben/SuSAnalyse.tsx:59`** — SuS-Analyse
- [ ] **Step 3: `ExamLab/src/components/lp/ueben/AnalyseDashboard.tsx:33`** — LP-Analyse
- [ ] **Step 4: `ExamLab/src/components/lp/vorbereitung/composer/AbschnitteTab.tsx:70`** — Composer-Abschnitte
- [ ] **Step 5: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx:87`** — Detail-Karte
- [ ] **Step 6: `ExamLab/src/components/ueben/admin/settings/AllgemeinTab.tsx:30`** — Allgemein-Tab
- [ ] **Step 7: `ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx:59`** — Admin-Themen
- [ ] **Step 8: `ExamLab/src/hooks/ueben/useThemenKomputationen.ts:97`** — Themen-Hook
- [ ] **Step 9: `ExamLab/src/hooks/useFragenFilter.ts:159, 199`** — Filter-Hook (2 Stellen)

Pro Stelle:
1. Hybrid-Code raus, `tagsStore.getByIds()`-Lookup rein
2. Verifikation per `grep -n "typeof.*tags.*string\|t\.name"` an dieser Datei → 0 Treffer
3. Test grün
4. Commit pro Datei: `git commit -m "Cluster H Phase 2: <datei> auf tagsStore-Lookup umgestellt"`

- [ ] **Final-Step: Gesamt-Grep**

```bash
cd ExamLab && grep -rn "typeof.*tags.*string\|typeof.*=== 'string'" src/ | grep -v test | grep -v ".d.ts"
# Erwartet: 0 Treffer in Tag-Code (andere Stellen mit „typeof string" sind OK)
```

---

## Task 2.3: `speichereFrage`-Service schreibt `tagIds`

**Files:**
- Modify: `ExamLab/src/services/fragensammlungApi.ts`

- [ ] **Step 1: Im Service-Wrapper `tagIds` einsetzen**

```ts
// In speichereFrage / speichereFrageMitStatus:
const payload = {
  /* ... */,
  tagIds: frage.tagIds || [],
  // tags-Feld nicht mehr senden (Backend hat es als tagsLegacy umbenannt + ignoriert es)
};
```

- [ ] **Step 2: Vitest grün, tsc grün**

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/services/fragensammlungApi.ts
git commit -m "Cluster H Phase 2: speichereFrage schreibt tagIds"
```

---

## Task 2.4: TagFarbeChip-Komponente (re-use)

**Files:**
- Create: `ExamLab/src/components/lp/einstellungen/tags/TagFarbeChip.tsx`

- [ ] **Step 1: Chip-Komponente schreiben**

```tsx
import type { TagFarbe } from '@shared/types/tag';

const FARBE_KLASSEN: Record<TagFarbe, string> = {
  slate:   'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  red:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200',
  amber:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200',
  sky:     'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200',
  violet:  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200',
  pink:    'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200',
  stone:   'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200',
};

interface Props {
  farbe: TagFarbe;
  label: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function TagFarbeChip({ farbe, label, size = 'md', onClick }: Props) {
  const sizeKlassen = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center rounded-full ${FARBE_KLASSEN[farbe]} ${sizeKlassen} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/src/components/lp/einstellungen/tags/TagFarbeChip.tsx
git commit -m "Cluster H Phase 2: TagFarbeChip-Komponente"
```

---

## Task 2.5: TagPicker-Komponente (für Editor)

**Files:**
- Create: `packages/shared/src/editor/components/TagPicker.tsx`
- Create: `packages/shared/src/editor/components/TagPicker.test.tsx`

- [ ] **Step 1: Komponente schreiben**

```tsx
import { useState, useMemo } from 'react';
import { useTagsStore } from '@/store/tagsStore'; // Pfad-Anpassung im Plan-Detail
import { TagFarbeChip } from '@/components/lp/einstellungen/tags/TagFarbeChip';
import { erstelleTag } from '@/services/tagsApi';
import type { Tag } from '@shared/types/tag';

interface Props {
  tagIds: string[];
  onChange: (neueIds: string[]) => void;
  maxTags?: number;
}

export function TagPicker({ tagIds, onChange, maxTags = 8 }: Props) {
  const tags = useTagsStore((s) => s.tags);
  const upsertLokal = useTagsStore((s) => s.upsertLokal);
  const [suche, setSuche] = useState('');
  const [creating, setCreating] = useState(false);

  const gefiltert = useMemo(() => {
    const q = suche.toLowerCase().trim();
    if (!q) return tags.filter((t) => !t.archiviert);
    return tags.filter((t) => !t.archiviert && t.name.toLowerCase().includes(q));
  }, [tags, suche]);

  const exakterTreffer = gefiltert.find((t) => t.name.toLowerCase() === suche.toLowerCase().trim());
  const istBereitsAusgewaehlt = (id: string) => tagIds.includes(id);

  function toggleTag(id: string) {
    if (istBereitsAusgewaehlt(id)) {
      onChange(tagIds.filter((tid) => tid !== id));
    } else if (tagIds.length < maxTags) {
      onChange([...tagIds, id]);
    }
  }

  async function handleQuickErstellen() {
    if (!suche.trim() || creating) return;
    setCreating(true);
    try {
      const r = await erstelleTag({ name: suche.trim() });
      upsertLokal(r.tag);
      if (!istBereitsAusgewaehlt(r.tag.id) && tagIds.length < maxTags) {
        onChange([...tagIds, r.tag.id]);
      }
      setSuche('');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800">
      <input
        type="text"
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !exakterTreffer && suche.trim()) {
            e.preventDefault();
            handleQuickErstellen();
          }
        }}
        placeholder="Tag suchen oder neu anlegen..."
        className="w-full mb-2 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm"
      />
      <div className="max-h-48 overflow-y-auto">
        {gefiltert.map((t) => (
          <label key={t.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={istBereitsAusgewaehlt(t.id)}
              onChange={() => toggleTag(t.id)}
              className="w-4 h-4"
            />
            <TagFarbeChip farbe={t.farbe} label={t.name} size="sm" />
          </label>
        ))}
        {!exakterTreffer && suche.trim() && (
          <button
            onClick={handleQuickErstellen}
            disabled={creating || tagIds.length >= maxTags}
            className="w-full px-2 py-1 text-sm text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-left"
          >
            + "{suche.trim()}" anlegen
          </button>
        )}
      </div>
      {tagIds.length >= maxTags && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Maximal {maxTags} Tags pro Frage erreicht.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Tests schreiben**

```tsx
// TagPicker.test.tsx — minimal:
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TagPicker } from './TagPicker';
import { useTagsStore } from '@/store/tagsStore';

describe('TagPicker', () => {
  it('rendert Tag-Liste aus Store', () => {
    useTagsStore.setState({
      tags: [{ id: 't1', name: 'aktuell', farbe: 'slate', archiviert: false, erstelltAm: '', erstelltVon: '' }],
      geladen: true, ladend: false, fehler: null,
    });
    const { getByText } = render(<TagPicker tagIds={[]} onChange={vi.fn()} />);
    expect(getByText('aktuell')).toBeTruthy();
  });

  it('Quick-Erstellen zeigt Button bei keinem Treffer', () => {
    useTagsStore.setState({ tags: [], geladen: true, ladend: false, fehler: null });
    const { getByPlaceholderText, queryByText } = render(<TagPicker tagIds={[]} onChange={vi.fn()} />);
    fireEvent.change(getByPlaceholderText(/Tag suchen/), { target: { value: 'neu' } });
    expect(queryByText(/"neu" anlegen/)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Tests grün**

```bash
cd ExamLab && npx vitest run src/editor/components/TagPicker.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/editor/components/TagPicker.tsx packages/shared/src/editor/components/TagPicker.test.tsx
git commit -m "Cluster H Phase 2: TagPicker-Komponente + Tests"
```

---

## Task 2.6: Frage-Editor: TagPicker integrieren

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx` (oder die MetadataSection — Plan-Phase greppt exakt)

- [ ] **Step 1: TagPicker einbinden**

In der MetadataSection (oder wo Tag-Edit hingehört):

```tsx
import { TagPicker } from './components/TagPicker';

// JSX:
<div>
  <Label>Tags</Label>
  <TagPicker
    tagIds={frage.tagIds || []}
    onChange={(neueIds) => updateFrage({ tagIds: neueIds })}
  />
</div>
```

- [ ] **Step 2: Tests + Commit**

```bash
cd ExamLab && npx vitest run
npx tsc --noEmit
git add packages/shared/src/editor/
git commit -m "Cluster H Phase 2: TagPicker im Frage-Editor integriert"
```

---

## Task 2.7: Tab-Registry-Eintrag für Tags-Tab

**Files:**
- Modify: `ExamLab/src/utils/tabRegistry.ts`

- [ ] **Step 1: Tab-Definition hinzufügen**

```ts
// In TAB_REGISTRY-Array (nach 'admin' o.ä.):
{
  id: 'tags',
  surface: 'einstellungen',
  titel: 'Tags',
  route: '/einstellungen/tags',
  sichtbar: () => true, // jeder LP sieht die Tag-Verwaltung (Buttons sind admin-gated)
  icon: 'Tag', // Lucide
}
```

- [ ] **Step 2: Tests + Commit**

```bash
cd ExamLab && npx vitest run
git add ExamLab/src/utils/tabRegistry.ts
git commit -m "Cluster H Phase 2: Tab-Registry-Eintrag für Tags-Tab"
```

---

## Task 2.8: TagsTab + TagsListe (Verwaltungs-UI)

**Files:**
- Create: `ExamLab/src/components/lp/einstellungen/tags/TagsTab.tsx`
- Create: `ExamLab/src/components/lp/einstellungen/tags/TagsListe.tsx`

- [ ] **Step 1: TagsTab schreiben** (Container, Routing-Anbindung)

```tsx
import { TagsListe } from './TagsListe';
export function TagsTab() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tags</h2>
      <TagsListe />
    </div>
  );
}
```

- [ ] **Step 2: TagsListe schreiben** (Hauptlogik)

```tsx
import { useState, useMemo, useEffect } from 'react';
import { useTagsStore } from '../../../../store/tagsStore';
import { useFragensammlungStore } from '../../../../store/fragensammlungStore';
import { TagFarbeChip } from './TagFarbeChip';
import { TagEditModal } from './TagEditModal';
import { MergeTagsModal } from './MergeTagsModal';
import { archiviereTag, hardDeleteTag } from '../../../../services/tagsApi';
import { useIstAdmin } from '../../../../hooks/useIstAdmin'; // Plan-Phase: Hook ggf. neu

export function TagsListe() {
  const tags = useTagsStore((s) => s.tags);
  const ladeAlleTags = useTagsStore((s) => s.ladeAlleTags);
  const summaries = useFragensammlungStore((s) => s.summaries);
  const istAdmin = useIstAdmin();
  const [suche, setSuche] = useState('');
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeAuswahl, setMergeAuswahl] = useState<Set<string>>(new Set());
  const [zeigeArchivierte, setZeigeArchivierte] = useState(false);

  useEffect(() => {
    ladeAlleTags({ inkludiereArchivierte: istAdmin && zeigeArchivierte });
  }, [zeigeArchivierte, istAdmin, ladeAlleTags]);

  const verwendung = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of summaries) {
      for (const id of s.tagIds || []) {
        map[id] = (map[id] || 0) + 1;
      }
    }
    return map;
  }, [summaries]);

  const gefiltert = useMemo(() => {
    let l = tags;
    if (!zeigeArchivierte) l = l.filter((t) => !t.archiviert);
    if (suche) l = l.filter((t) => t.name.toLowerCase().includes(suche.toLowerCase()));
    return l.sort((a, b) => a.name.localeCompare(b.name));
  }, [tags, suche, zeigeArchivierte]);

  // ... Render: Suchfeld, optional „Archivierte zeigen"-Toggle, Liste mit Verwendungs-Anzahl + ⋮-Menu, Mergen-Modus mit Floating-Bar.
  // (Detaillierter JSX-Code je nach UI-Stil ~80-120 Z. — Plan-Phase liefert vollständig in Implementation.)
}
```

- [ ] **Step 3: useIstAdmin-Hook ggf. neu**

```ts
// ExamLab/src/hooks/useIstAdmin.ts
// Plan-Phase greppt exakt wie LP-Info bezogen wird
import { useAuthStore } from '../store/authStore';
export function useIstAdmin(): boolean {
  return useAuthStore((s) => s.lpInfo?.rolle === 'admin');
}
```

- [ ] **Step 4: Tests + Commit**

---

## Task 2.9: TagEditModal + MergeTagsModal

**Files:**
- Create: `ExamLab/src/components/lp/einstellungen/tags/TagEditModal.tsx`
- Create: `ExamLab/src/components/lp/einstellungen/tags/MergeTagsModal.tsx`

- [ ] **Step 1: TagEditModal** — BaseDialog mit Name-Input + Farb-Picker (8 Buttons mit TagFarbeChip)

- [ ] **Step 2: MergeTagsModal** — BaseDialog mit Master-Auswahl + Confirm

- [ ] **Step 3: Tests + Commits** (je ein Commit pro Modal)

---

## Task 2.10: globaleSuche (Cluster C) Tag-Adapter umstellen

**Files:**
- Modify: `ExamLab/src/utils/sucheAdapter.ts` (Tag-Such-Adapter, ~10 Z.)

- [ ] **Step 1: Falls Tag-Suche heute String-Match macht: auf `tagsStore`-Lookup umstellen**

(Bereits in Task 2.2 Step 1 erledigt — Verifikation hier nochmal explizit.)

- [ ] **Step 2: Browser-E2E**

Globale Suche im LP-Header → Tag-Name eintippen → Treffer.

- [ ] **Step 3: Commit (falls noch nicht in Task 2.2)**

---

## Task 2.11: Pre-Flight Phase 2 + Browser-E2E

**Files:** keine

- [ ] **Step 1: Alle Pre-Commit-Checks**

```bash
cd ExamLab
npx vitest run
npx tsc --noEmit
npm run build
npm run lint:as-any && npm run lint:no-alert && npm run lint:musterloesung && npm run lint:wire-contract
```

- [ ] **Step 2: Push + Merge nach preview**

```bash
git push origin feature/cluster-h-tag-modell
git checkout preview && git merge --ff-only feature/cluster-h-tag-modell && git push origin preview
```

- [ ] **Step 3: Browser-E2E (Live, echte Logins)** — Cache-Reset siehe oben

Alle 11 Test-Cases aus Spec §10.3 durchgehen:
- [ ] Migration in Test-Repo bereits gelaufen
- [ ] Picker-Verwendung
- [ ] Quick-Erstellen
- [ ] Tab-Übersicht
- [ ] Umbenennen
- [ ] Farbe ändern
- [ ] Archivieren (Admin)
- [ ] Mergen (Admin)
- [ ] Hard-Delete (Admin)
- [ ] Non-Admin sieht keine Admin-Buttons
- [ ] Konkurrierende Erstellung (2 Browser-Tabs)

- [ ] **Step 4: Merge preview → main (Fast-Forward)**

```bash
git checkout main && git merge --ff-only preview && git push origin main
```

**Phase 2 abgeschlossen.** Cluster H ist live. Alte Hybrid-Code-Stellen sind raus, neue UI funktioniert.

---

# Phase 3 — Cleanup (nach 2 Wochen)

Nicht in dieser Session — wartet auf 2 Wochen Live-Betrieb ohne Probleme. Plan-Detail in 2 Wochen separater Session.

## Task 3.1: tagsLegacy-Spalte raus (Backend)

- [ ] Spalte `tagsLegacy` aus allen Frage-Sheets entfernen (manueller Sheet-Edit oder Apps-Script-Endpoint)
- [ ] `parseFrage` lesen-Pfad entfernen (`row.tagsLegacy || ...`)
- [ ] Schreib-Pfad unverändert (schreibt eh nur tagIds)
- [ ] Commit

## Task 3.2: tags-Feld aus Frage-Type entfernen

- [ ] `packages/shared/src/types/fragen-core.ts`: `tags?: string[]`-Zeile löschen
- [ ] tsc-Check, alle Hybrid-Reste finden + fixen
- [ ] Commit

## Task 3.3: Migrations-Endpoint + Temp-Button entfernen

- [ ] `apiMigriereTagsZuObjects` aus Apps-Script entfernen
- [ ] `LP_ACTIONS`-Eintrag entfernen
- [ ] Temp-Migrations-Button aus AdminTab entfernen
- [ ] tagsApi.ts: `migriereTagsZuObjects`-Wrapper entfernen
- [ ] Commit + Apps-Script-Deploy

---

# Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Migration läuft länger als 6 min | Niedrig (geschätzt <500 Fragen) | Hoch | Spec §13: Batch-Variante als Folge-PR wenn Audit Zahl-Größe widerlegt. Plan-Phase greppt aktuelle Frage-Anzahl beim Apps-Script-Deploy. |
| Backend-Crash mitten in Migration | Sehr niedrig | Hoch | Idempotenz-Check verhindert Re-Run. Manueller Eingriff: Tags-Sheet leeren, neu starten. Dokumentiert. |
| Tag-Sheet-ID-Spalte: Race-Condition bei concurrent CreateTag | Niedrig | Mittel | LockService.getScriptLock() in apiCreateTag (Task 0.7). |
| 9 Hybrid-Stellen: vergessene Stelle | Mittel | Mittel | Final-Grep nach `typeof.*tags.*string` in Task 2.2 Final-Step. |
| Browser-Cache zeigt alte UI nach Phase-2-Deploy | Hoch | Niedrig | Cache-Reset-Snippet in Task 2.11 Step 3 + nocache-Buster. Memory-Lehre `feedback_service_worker_cache_wire_bundle.md`. |
| Frontend-Lookup mit Original-Casing scheitert | Niedrig | Niedrig | Spec §5.2 Schritt 9 — Lookup-Map-Keys lowercase. tagsStore.getByName ist case-insensitive. |
| Apps-Script Wire-Vertrag-Lint fehlschlägt | Mittel | Niedrig | Pro neue Action sofort prüfen via `npm run lint:wire-contract`. 7 neue Action-Pairs. |
| `useIstAdmin`-Hook fehlt | Hoch (existiert nicht laut Audit) | Niedrig | Task 2.8 Step 3 erstellt ihn neu. |

---

# Pattern-Referenzen

- **Wire-Contract-Audit:** `scripts/audit-wire-contract.mjs` — 7 neue Action-Pairs müssen matchen.
- **Memory-Lehren:**
  - `feedback_backend_read_paths_audit.md` — alle parseFrage-/Read-Pfade auditieren bei Schema-Erweiterung
  - `feedback_service_worker_cache_wire_bundle.md` — SW-Reset vor E2E nach Wire-Vertrag-Bundles
  - `feedback_status_inferenz_quelle_audit.md` — Marker-Wert-Audit vor Plan-Commit (siehe Task 0.10 Verwendungs-Zähler-Loop)
  - `feedback_destructive_action_cancel_pending.md` — destruktive Aktionen + pending Auto-Save Race
- **Cluster-C-Pattern:**
  - `configsListStore` als Vorbild für `tagsStore` (Cache-Layer, getById-Selektor)
  - ICON_MAP-Pattern für Lucide-Icons (Cluster G Phase 1)
- **Test-Pattern:** `draftStore.test.ts` als Vorbild (siehe Audit Punkt 18)
