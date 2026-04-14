# Pool-Rück-Sync — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable bidirectional sync — write question changes back to pool config files and export new questions into existing pools via GitHub API.

**Architecture:** Frontend detects diffs between edited questions and their pool snapshots, presents a field-level diff dialog, then sends selected changes to Apps Script. Apps Script acts as proxy: fetches the pool JS file from GitHub, applies targeted regex-based edits, and commits the updated file via GitHub API PUT.

**Tech Stack:** React 19 + TypeScript + Zustand (frontend), Google Apps Script (backend), GitHub Contents API (storage)

**Spec:** `docs/superpowers/specs/2026-03-21-pool-rueck-sync-design.md`

**Note:** No test framework is set up in this project. Verification is done via `npm run build` (TypeScript compilation) and manual browser testing.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `ExamLab/src/utils/poolExporter.ts` | Reverse type mapping: Frage → PoolFrage format (Gegenstück zu poolConverter.ts) |
| `ExamLab/src/components/lp/RueckSyncDialog.tsx` | Two-mode modal: Update-Diff with checkboxes / Export with pool+topic selection |

### Modified Files
| File | Changes |
|------|---------|
| `ExamLab/src/services/poolSync.ts` (275 Z.) | Add `berechneRueckSyncDiff()` + `ladePoolIndex()` re-export for pool list |
| `ExamLab/src/services/apiService.ts` (833 Z.) | Add `schreibePoolAenderung()` method |
| `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` (1329 Z.) | Add "↑ An Pool" / "↑ In Pool exportieren" buttons + dialog trigger |
| `ExamLab/src/components/lp/FragenBrowser.tsx` (856 Z.) | Add "↑ Pool-Export" batch button |
| `ExamLab/apps-script-code.js` (2206 Z.) | New `schreibePoolAenderung` action + GitHub API helper functions |

---

## Task 1: poolExporter.ts — Reverse Type Mapping

**Files:**
- Create: `ExamLab/src/utils/poolExporter.ts`
- Reference: `ExamLab/src/utils/poolConverter.ts` (forward mapping), `ExamLab/src/types/fragen.ts`, `ExamLab/src/types/pool.ts`

- [ ] **Step 1: Create poolExporter.ts with type mapping function**

```typescript
// ExamLab/src/utils/poolExporter.ts
// Konvertierung Prüfungstool → Pool-Format (Gegenstück zu poolConverter.ts)

import type { Frage, MCFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage, RichtigFalschFrage, BerechnungFrage } from '../types/fragen';

interface PoolFrageExport {
  id: string;
  topic: string;
  type: 'mc' | 'multi' | 'tf' | 'fill' | 'calc' | 'sort' | 'open';
  diff: number;
  tax: string;
  reviewed: boolean;
  q: string;
  explain?: string;
  sample?: string;
  options?: Array<{ v: string; t: string }>;
  correct?: string | string[] | boolean;
  blanks?: Array<{ answer: string; alts?: string[] }>;
  rows?: Array<{ label: string; answer: number; tolerance: number; unit?: string }>;
  categories?: string[];
  items?: Array<{ t: string; cat: number }>;
}

/**
 * Konvertiert eine Prüfungstool-Frage ins Pool-Format.
 * Wirft Error bei VisualisierungFrage (nicht exportierbar).
 */
export function konvertiereZuPoolFormat(frage: Frage, topic: string, poolFrageId?: string): PoolFrageExport {
  if (frage.typ === 'visualisierung') {
    throw new Error('VisualisierungFragen können nicht in Pools exportiert werden.');
  }

  const basis: PoolFrageExport = {
    id: poolFrageId || frage.id,
    topic,
    type: mapTypZuPool(frage),
    diff: frage.schwierigkeit || 2,
    tax: frage.bloom || 'K2',
    reviewed: frage.poolGeprueft ?? false,
    q: frage.fragetext,
  };

  // Musterlosung-Mapping: open → sample, rest → explain
  if (frage.typ === 'freitext') {
    basis.sample = frage.musterlosung || '';
  } else {
    basis.explain = frage.musterlosung || '';
  }

  // Typ-spezifische Felder
  switch (frage.typ) {
    case 'mc': {
      const mc = frage as MCFrage;
      basis.options = mc.optionen.map((o, i) => ({
        v: String.fromCharCode(65 + i), // A, B, C, D...
        t: o.text,
      }));
      if (mc.mehrfachauswahl) {
        basis.type = 'multi';
        basis.correct = mc.optionen
          .map((o, i) => o.korrekt ? String.fromCharCode(65 + i) : null)
          .filter((v): v is string => v !== null);
      } else {
        basis.type = 'mc';
        const idx = mc.optionen.findIndex(o => o.korrekt);
        basis.correct = idx >= 0 ? String.fromCharCode(65 + idx) : 'A';
      }
      break;
    }
    case 'freitext':
      basis.type = 'open';
      break;
    case 'lueckentext': {
      const lt = frage as LueckentextFrage;
      basis.type = 'fill';
      basis.q = lt.textMitLuecken || frage.fragetext;
      basis.blanks = lt.luecken.map(l => ({
        answer: l.korrekteAntworten[0] || '',
        ...(l.korrekteAntworten.length > 1 ? { alts: l.korrekteAntworten.slice(1) } : {}),
      }));
      break;
    }
    case 'zuordnung': {
      const zu = frage as ZuordnungFrage;
      basis.type = 'sort';
      // Paare → categories + items
      const cats = [...new Set(zu.paare.map(p => p.rechts))];
      basis.categories = cats;
      basis.items = zu.paare.map(p => ({
        t: p.links,
        cat: cats.indexOf(p.rechts),
      }));
      break;
    }
    case 'richtigfalsch': {
      const rf = frage as RichtigFalschFrage;
      basis.type = 'tf';
      // Pool-TF hat nur eine Aussage (q = Aussage, correct = boolean)
      if (rf.aussagen.length === 1) {
        basis.q = rf.aussagen[0].text;
        basis.correct = rf.aussagen[0].korrekt;
      } else {
        // Mehrere Aussagen: q bleibt Fragetext, erste Aussage als correct
        basis.correct = rf.aussagen[0]?.korrekt ?? true;
      }
      break;
    }
    case 'berechnung': {
      const be = frage as BerechnungFrage;
      basis.type = 'calc';
      basis.rows = be.ergebnisse.map(e => ({
        label: e.bezeichnung || '',
        answer: e.korrekt,
        tolerance: e.toleranz || 0,
        ...(e.einheit ? { unit: e.einheit } : {}),
      }));
      break;
    }
  }

  return basis;
}

function mapTypZuPool(frage: Frage): PoolFrageExport['type'] {
  switch (frage.typ) {
    case 'mc': return (frage as MCFrage).mehrfachauswahl ? 'multi' : 'mc';
    case 'freitext': return 'open';
    case 'lueckentext': return 'fill';
    case 'zuordnung': return 'sort';
    case 'richtigfalsch': return 'tf';
    case 'berechnung': return 'calc';
    default: throw new Error(`Typ ${frage.typ} nicht exportierbar`);
  }
}

/**
 * Serialisiert eine PoolFrage als JS-Objekt-String (unquoted keys, Pool-Format).
 */
export function serialisierePoolFrage(pf: PoolFrageExport): string {
  const lines: string[] = [];
  lines.push(`  {id: "${pf.id}", topic: "${pf.topic}", type: "${pf.type}", diff: ${pf.diff}, tax: "${pf.tax}", reviewed: ${pf.reviewed},`);

  // Fragetext (mehrzeilig escapen)
  lines.push(`    q: ${JSON.stringify(pf.q)},`);

  // Typ-spezifische Felder
  if (pf.options) {
    lines.push(`    options: [`);
    pf.options.forEach((o, i) => {
      const comma = i < pf.options!.length - 1 ? ',' : '';
      lines.push(`      {v: "${o.v}", t: ${JSON.stringify(o.t)}}${comma}`);
    });
    lines.push(`    ],`);
  }

  if (pf.correct !== undefined) {
    if (Array.isArray(pf.correct)) {
      lines.push(`    correct: [${pf.correct.map(c => `"${c}"`).join(', ')}],`);
    } else if (typeof pf.correct === 'boolean') {
      lines.push(`    correct: ${pf.correct},`);
    } else {
      lines.push(`    correct: "${pf.correct}",`);
    }
  }

  if (pf.blanks) {
    lines.push(`    blanks: [`);
    pf.blanks.forEach((b, i) => {
      const alts = b.alts?.length ? `, alts: [${b.alts.map(a => JSON.stringify(a)).join(', ')}]` : '';
      const comma = i < pf.blanks!.length - 1 ? ',' : '';
      lines.push(`      {answer: ${JSON.stringify(b.answer)}${alts}}${comma}`);
    });
    lines.push(`    ],`);
  }

  if (pf.rows) {
    lines.push(`    rows: [`);
    pf.rows.forEach((r, i) => {
      const unit = r.unit ? `, unit: "${r.unit}"` : '';
      const comma = i < pf.rows!.length - 1 ? ',' : '';
      lines.push(`      {label: ${JSON.stringify(r.label)}, answer: ${r.answer}, tolerance: ${r.tolerance}${unit}}${comma}`);
    });
    lines.push(`    ],`);
  }

  if (pf.categories) {
    lines.push(`    categories: [${pf.categories.map(c => JSON.stringify(c)).join(', ')}],`);
  }

  if (pf.items) {
    lines.push(`    items: [`);
    pf.items.forEach((item, i) => {
      const comma = i < pf.items!.length - 1 ? ',' : '';
      lines.push(`      {t: ${JSON.stringify(item.t)}, cat: ${item.cat}}${comma}`);
    });
    lines.push(`    ],`);
  }

  // Erklärung / Musterlösung
  if (pf.sample) {
    lines.push(`    sample: ${JSON.stringify(pf.sample)},`);
  }
  if (pf.explain) {
    lines.push(`    explain: ${JSON.stringify(pf.explain)}`);
  }

  // Letztes Komma entfernen
  const lastLine = lines[lines.length - 1];
  if (lastLine.endsWith(',')) {
    lines[lines.length - 1] = lastLine.slice(0, -1);
  }

  lines.push(`  }`);
  return lines.join('\n');
}
```

- [ ] **Step 2: Verify build**

Run: `cd ExamLab && npm run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/utils/poolExporter.ts
git commit -m "Pool-Rück-Sync: poolExporter.ts — Reverse type mapping Prüfung→Pool"
```

---

## Task 2: berechneRueckSyncDiff in poolSync.ts

**Files:**
- Modify: `ExamLab/src/services/poolSync.ts` (275 Z.)
- Reference: `ExamLab/src/types/pool.ts` (PoolFrageSnapshot)

- [ ] **Step 1: Add RueckSyncDiffFeld type and berechneRueckSyncDiff function**

Add at end of `poolSync.ts`:

```typescript
// --- Rück-Sync Diff ---

export interface RueckSyncDiffFeld {
  feld: string;        // Anzeigename (z.B. "Fragetext", "Erklärung")
  poolFeld: string;    // Pool-Feldname (z.B. "q", "explain")
  alt: unknown;        // Wert im Pool (aus Snapshot)
  neu: unknown;        // Aktueller Wert im Prüfungstool
}

/**
 * Vergleicht eine bearbeitete Frage mit ihrem Pool-Snapshot.
 * Gibt nur geänderte Felder zurück (für Feld-für-Feld-Dialog).
 */
export function berechneRueckSyncDiff(frage: Frage, snapshot: PoolFrageSnapshot): RueckSyncDiffFeld[] {
  const diffs: RueckSyncDiffFeld[] = [];

  // Fragetext
  if (frage.fragetext !== snapshot.fragetext) {
    diffs.push({ feld: 'Fragetext', poolFeld: 'q', alt: snapshot.fragetext, neu: frage.fragetext });
  }

  // Erklärung/Musterlösung
  if (frage.musterlosung !== (snapshot.musterlosung || snapshot.erklaerung || '')) {
    diffs.push({ feld: 'Erklärung', poolFeld: frage.typ === 'freitext' ? 'sample' : 'explain', alt: snapshot.musterlosung || snapshot.erklaerung || '', neu: frage.musterlosung });
  }

  // Bloom (aus erweitertem Snapshot, falls vorhanden)
  if ((snapshot as any).bloom && frage.bloom !== (snapshot as any).bloom) {
    diffs.push({ feld: 'Bloom-Stufe', poolFeld: 'tax', alt: (snapshot as any).bloom, neu: frage.bloom });
  }

  // Schwierigkeit
  if ((snapshot as any).schwierigkeit !== undefined && frage.schwierigkeit !== (snapshot as any).schwierigkeit) {
    diffs.push({ feld: 'Schwierigkeit', poolFeld: 'diff', alt: (snapshot as any).schwierigkeit, neu: frage.schwierigkeit });
  }

  // Typ-spezifisch: Optionen, korrekte Antwort, etc.
  if (snapshot.optionen && JSON.stringify(getOptionen(frage)) !== JSON.stringify(snapshot.optionen)) {
    diffs.push({ feld: 'Optionen', poolFeld: 'options', alt: snapshot.optionen, neu: getOptionen(frage) });
  }

  if (snapshot.korrekt !== undefined && JSON.stringify(getKorrekt(frage)) !== JSON.stringify(snapshot.korrekt)) {
    diffs.push({ feld: 'Korrekte Antwort', poolFeld: 'correct', alt: snapshot.korrekt, neu: getKorrekt(frage) });
  }

  if (snapshot.spezifisch !== undefined) {
    const aktuellesSpez = getSpezifisch(frage);
    if (JSON.stringify(aktuellesSpez) !== JSON.stringify(snapshot.spezifisch)) {
      diffs.push({ feld: 'Typ-spezifische Daten', poolFeld: 'spezifisch', alt: snapshot.spezifisch, neu: aktuellesSpez });
    }
  }

  return diffs;
}

// Hilfsfunktionen für Vergleich
function getOptionen(frage: Frage): unknown[] | undefined {
  if (frage.typ === 'mc') return (frage as MCFrage).optionen.map(o => ({ text: o.text, korrekt: o.korrekt }));
  if (frage.typ === 'richtigfalsch') return (frage as RichtigFalschFrage).aussagen.map(a => ({ text: a.text, korrekt: a.korrekt }));
  return undefined;
}

function getKorrekt(frage: Frage): unknown {
  if (frage.typ === 'mc') {
    const mc = frage as MCFrage;
    if (mc.mehrfachauswahl) return mc.optionen.filter(o => o.korrekt).map((_, i) => String.fromCharCode(65 + i));
    return String.fromCharCode(65 + mc.optionen.findIndex(o => o.korrekt));
  }
  if (frage.typ === 'richtigfalsch') return (frage as RichtigFalschFrage).aussagen[0]?.korrekt;
  return undefined;
}

function getSpezifisch(frage: Frage): unknown {
  switch (frage.typ) {
    case 'lueckentext': return (frage as LueckentextFrage).luecken;
    case 'berechnung': return (frage as BerechnungFrage).ergebnisse;
    case 'zuordnung': return (frage as ZuordnungFrage).paare;
    default: return undefined;
  }
}
```

Add required imports at top of file:
```typescript
import type { Frage, MCFrage, RichtigFalschFrage, LueckentextFrage, BerechnungFrage, ZuordnungFrage } from '../types/fragen';
import type { PoolFrageSnapshot } from '../types/pool';
```

Additionally, extend `erzeugeSnapshot()` in `poolConverter.ts` to include `bloom` and `schwierigkeit`:

```typescript
// In erzeugeSnapshot(), add to the returned object:
bloom: poolFrage.tax || 'K2',
schwierigkeit: poolFrage.diff || 2,
```

And extend `PoolFrageSnapshot` in `pool.ts`:
```typescript
bloom?: string;
schwierigkeit?: number;
```

- [ ] **Step 2: Verify build**

Run: `cd ExamLab && npm run build`

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/services/poolSync.ts
git commit -m "Pool-Rück-Sync: berechneRueckSyncDiff — Feld-für-Feld Vergleich"
```

---

## Task 3: apiService.ts — schreibePoolAenderung

**Files:**
- Modify: `ExamLab/src/services/apiService.ts` (833 Z.)

- [ ] **Step 1: Add schreibePoolAenderung method**

Add after `importiereLernziele` method (around line 267):

```typescript
  /** Schreibt Änderungen an Pool-Fragen zurück via GitHub API */
  async schreibePoolAenderung(
    email: string,
    poolDatei: string,
    aenderungen: Array<{
      poolFrageId: string | null;
      typ: 'update' | 'export';
      felder: Record<string, unknown>;
    }>
  ): Promise<{
    erfolg: boolean;
    aktualisiert: number;
    exportiert: number;
    commitSha: string;
    neueHashes: Record<string, string>;
    exportierteIds: Record<string, string>;
    fehler: string[];
  } | null> {
    if (!APPS_SCRIPT_URL) return null
    try {
      const payload = JSON.stringify({
        action: 'schreibePoolAenderung',
        email,
        poolDatei,
        aenderungen,
      })
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      })
      if (!response.ok) return null
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) { console.error('[API] schreibePoolAenderung:', data.error); return null }
        return data
      } catch { return null }
    } catch (error) {
      console.error('[API] schreibePoolAenderung: Netzwerkfehler:', error)
      return null
    }
  },
```

- [ ] **Step 2: Verify build**

Run: `cd ExamLab && npm run build`

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/services/apiService.ts
git commit -m "Pool-Rück-Sync: apiService.schreibePoolAenderung Endpoint"
```

---

## Task 4: Apps Script Backend — schreibePoolAenderung

**Files:**
- Modify: `ExamLab/apps-script-code.js` (2206 Z.)

This is the most complex task. It needs: doPost dispatch, GitHub API helpers, JS parsing, and the main endpoint.

- [ ] **Step 1: Add doPost dispatch case**

In the `switch (action)` block (around line 53–101), add:
```javascript
    case 'schreibePoolAenderung':
      return schreibePoolAenderung(body);
```

- [ ] **Step 2: Add GitHub API helper functions**

Add at end of file (after last function):

```javascript
// === GitHub API Helpers ===

function githubApiRequest(method, path, payload) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN nicht konfiguriert');

  const options = {
    method: method,
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GymHofwil-Pruefungsplattform'
    },
    muteHttpExceptions: true
  };

  if (payload) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }

  const url = 'https://api.github.com' + path;
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code >= 400) {
    throw new Error('GitHub API ' + code + ': ' + (body.message || 'Unbekannter Fehler'));
  }

  return body;
}

function githubGetFile(pfad) {
  return githubApiRequest('GET', '/repos/durandbourjate/GYM-WR-DUY/contents/' + pfad);
}

function githubPutFile(pfad, content, sha, message) {
  return githubApiRequest('PUT', '/repos/durandbourjate/GYM-WR-DUY/contents/' + pfad, {
    message: message,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    sha: sha,
    branch: 'main'
  });
}
```

- [ ] **Step 3: Add JS-Parsing helper functions**

```javascript
// === Pool-JS-Parsing ===

/**
 * Findet ein Frage-Objekt im JS-String anhand der ID.
 * Gibt {start, end} Positionen zurück.
 */
function findeFrageImJS(jsContent, frageId) {
  // Suche id: "frageId" (mit oder ohne Leerzeichen)
  const idPattern = new RegExp('id:\\s*["\']' + frageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']');
  const idMatch = idPattern.exec(jsContent);
  if (!idMatch) return null;

  // Rückwärts zum öffnenden { suchen
  let start = idMatch.index;
  while (start > 0 && jsContent[start] !== '{') start--;

  // Vorwärts zum schliessenden } mit Bracket-Matching
  let depth = 0;
  let end = start;
  for (let i = start; i < jsContent.length; i++) {
    if (jsContent[i] === '{') depth++;
    if (jsContent[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  return { start, end, text: jsContent.substring(start, end) };
}

/**
 * Ersetzt ein einzelnes Feld innerhalb eines Frage-Objekt-Strings.
 * Verwendet Bracket-Depth-Counting für Arrays/Objects (sicher bei verschachtelten Strukturen).
 */
function ersetzeFeldImObjekt(objektText, feldName, neuerWert) {
  var feldPattern = new RegExp(feldName + ':\\s*');
  var match = feldPattern.exec(objektText);

  if (!match) {
    // Feld existiert nicht → vor dem letzten } einfügen
    var letzteKlammer = objektText.lastIndexOf('}');
    var vorher = objektText.substring(0, letzteKlammer).trimEnd();
    var komma = vorher.endsWith(',') ? '' : ',';
    return vorher + komma + '\n    ' + feldName + ': ' + serialisiereWert(neuerWert) + '\n  }';
  }

  var wertStart = match.index + match[0].length;
  var wertEnde = findeWertEnde(objektText, wertStart);
  return objektText.substring(0, wertStart) + serialisiereWert(neuerWert) + objektText.substring(wertEnde);
}

/**
 * Findet das Ende eines JS-Werts ab einer Position.
 * Bracket-Depth-Counting für verschachtelte Arrays/Objects.
 */
function findeWertEnde(text, start) {
  var ch = text.charAt(start);

  // String: suche schliessendes "
  if (ch === '"') {
    for (var i = start + 1; i < text.length; i++) {
      if (text.charAt(i) === '\\') { i++; continue; }
      if (text.charAt(i) === '"') return i + 1;
    }
    return text.length;
  }

  // Array oder Object: Bracket-Depth-Counting
  if (ch === '[' || ch === '{') {
    var close = ch === '[' ? ']' : '}';
    var depth = 0;
    for (var i = start; i < text.length; i++) {
      if (text.charAt(i) === '"') { // Strings überspringen
        for (i++; i < text.length; i++) {
          if (text.charAt(i) === '\\') { i++; continue; }
          if (text.charAt(i) === '"') break;
        }
        continue;
      }
      if (text.charAt(i) === ch) depth++;
      if (text.charAt(i) === close) { depth--; if (depth === 0) return i + 1; }
    }
    return text.length;
  }

  // Number, Boolean: bis zum nächsten Trennzeichen
  for (var i = start; i < text.length; i++) {
    if (',\n\r}'.indexOf(text.charAt(i)) >= 0) return i;
  }
  return text.length;
}

function serialisiereWert(wert) {
  if (typeof wert === 'string') return JSON.stringify(wert);
  if (typeof wert === 'number' || typeof wert === 'boolean') return String(wert);
  if (Array.isArray(wert)) {
    // Für einfache Arrays: kompakt
    if (wert.length === 0) return '[]';
    if (typeof wert[0] === 'string') return '[' + wert.map(v => JSON.stringify(v)).join(', ') + ']';
    // Für Objekt-Arrays: mehrzeilig
    const items = wert.map(item => {
      const pairs = Object.entries(item).map(([k, v]) => k + ': ' + serialisiereWert(v));
      return '      {' + pairs.join(', ') + '}';
    });
    return '[\n' + items.join(',\n') + '\n    ]';
  }
  return JSON.stringify(wert);
}

/**
 * Berechnet SHA-256 Content-Hash.
 * WICHTIG: Exakt gleiche Logik wie berechneContentHash() im Frontend (poolSync.ts).
 * Felder die undefined sind werden von JSON.stringify weggelassen — keine Fallbacks verwenden!
 */
function berechnePoolContentHash(frage) {
  // Gleiche Feld-Reihenfolge wie im Frontend
  var obj = {};
  obj.q = frage.q;
  obj.type = frage.type;
  obj.explain = frage.explain;
  obj.options = frage.options;
  obj.correct = frage.correct;
  obj.blanks = frage.blanks;
  obj.rows = frage.rows;
  obj.categories = frage.categories;
  obj.items = frage.items;
  obj.sample = frage.sample;
  // JSON.stringify droppt undefined keys automatisch — identisch zum Frontend-Verhalten
  var hashInput = JSON.stringify(obj);
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, hashInput, Utilities.Charset.UTF_8);
  return rawHash.map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

/**
 * Extrahiert Frage-Felder aus einem JS-Objekt-String (für Hash nach Update).
 * Parsed das Frage-Objekt per eval-ähnlichem Approach.
 */
function extrahiereFrageFelder(objektText) {
  // Einfaches Key-Value-Parsing für die Hash-relevanten Felder
  var felder = {};
  var feldNamen = ['q', 'type', 'explain', 'options', 'correct', 'blanks', 'rows', 'categories', 'items', 'sample'];
  for (var i = 0; i < feldNamen.length; i++) {
    var name = feldNamen[i];
    var pattern = new RegExp(name + ':\\s*');
    var match = pattern.exec(objektText);
    if (match) {
      var start = match.index + match[0].length;
      var ch = objektText.charAt(start);
      if (ch === '"') {
        // String-Wert: bis zum nächsten unescaped "
        var end = start + 1;
        while (end < objektText.length && !(objektText.charAt(end) === '"' && objektText.charAt(end - 1) !== '\\')) end++;
        try { felder[name] = JSON.parse(objektText.substring(start, end + 1)); } catch(e) {}
      } else if (ch === '[') {
        // Array: Bracket-Matching
        var depth = 0; var end = start;
        for (var j = start; j < objektText.length; j++) {
          if (objektText.charAt(j) === '[') depth++;
          if (objektText.charAt(j) === ']') { depth--; if (depth === 0) { end = j + 1; break; } }
        }
        try { felder[name] = JSON.parse(objektText.substring(start, end).replace(/(\w+)\s*:/g, '"$1":')); } catch(e) {}
      } else if (ch === 't' || ch === 'f') {
        felder[name] = ch === 't';
      } else if (!isNaN(parseInt(ch))) {
        felder[name] = parseFloat(objektText.substring(start).match(/[\d.]+/)[0]);
      }
    }
  }
  return felder;
}

/**
 * Generiert eine neue Frage-ID für Export.
 * Scannt bestehende IDs im QUESTIONS-Array.
 */
function generiereNeueFrageId(jsContent, topicKey) {
  const prefix = topicKey.charAt(0);
  // Alle bestehenden IDs mit diesem Prefix finden
  const idPattern = new RegExp('id:\\s*["\'](' + prefix + '\\d+)["\']', 'g');
  let maxNum = 0;
  let match;
  while ((match = idPattern.exec(jsContent)) !== null) {
    const num = parseInt(match[1].substring(prefix.length), 10);
    if (num > maxNum) maxNum = num;
  }
  const neueNummer = maxNum + 1;
  return prefix + (neueNummer < 10 ? '0' : '') + neueNummer;
}
```

- [ ] **Step 4: Add main schreibePoolAenderung function**

```javascript
// === Pool-Rück-Sync Hauptfunktion ===

function schreibePoolAenderung(body) {
  const email = body.email;
  if (!email || !email.endsWith('@gymhofwil.ch')) {
    return jsonResponse({ erfolg: false, fehler: ['Nicht autorisiert'] });
  }

  const poolDatei = body.poolDatei;
  const aenderungen = body.aenderungen;

  if (!poolDatei || !aenderungen || !aenderungen.length) {
    return jsonResponse({ erfolg: false, fehler: ['Fehlende Parameter'] });
  }

  try {
    // 1. Pool-Datei von GitHub laden
    const pfad = 'Uebungen/Uebungspools/config/' + poolDatei;
    const githubFile = githubGetFile(pfad);
    const jsContent = Utilities.newBlob(Utilities.base64Decode(githubFile.content)).getDataAsString('UTF-8');
    const sha = githubFile.sha;

    let modifizierterContent = jsContent;
    let aktualisiert = 0;
    let exportiert = 0;
    const fehler = [];
    const neueHashes = {};
    const exportierteIds = {};

    for (const aenderung of aenderungen) {
      try {
        if (aenderung.typ === 'update') {
          // Bestehende Frage aktualisieren
          const fragePos = findeFrageImJS(modifizierterContent, aenderung.poolFrageId);
          if (!fragePos) {
            fehler.push('Frage ' + aenderung.poolFrageId + ' nicht gefunden im Pool');
            continue;
          }

          let objektText = fragePos.text;

          // Felder einzeln ersetzen
          for (const [feld, wert] of Object.entries(aenderung.felder)) {
            if (feld === 'spezifisch') continue; // Wird separat behandelt
            objektText = ersetzeFeldImObjekt(objektText, feld, wert);
          }

          modifizierterContent = modifizierterContent.substring(0, fragePos.start) + objektText + modifizierterContent.substring(fragePos.end);

          // Hash aus dem VOLLSTÄNDIGEN aktualisierten Frage-Objekt berechnen (nicht nur geänderte Felder)
          var aktualisiertePos = findeFrageImJS(modifizierterContent, aenderung.poolFrageId);
          var volleFelder = aktualisiertePos ? extrahiereFrageFelder(aktualisiertePos.text) : aenderung.felder;
          neueHashes[aenderung.poolFrageId] = berechnePoolContentHash(volleFelder);
          aktualisiert++;

        } else if (aenderung.typ === 'export') {
          // Neue Frage am Ende des QUESTIONS-Arrays einfügen
          const felder = aenderung.felder;

          // ID generieren falls nicht vorhanden
          const neueId = felder.id || generiereNeueFrageId(modifizierterContent, felder.topic || 'x');
          felder.id = neueId;

          // Serialisieren
          const neueFrageStr = serialisiereNeuePoolFrage(felder);

          // Vor dem letzten ]; einfügen
          const arrayEndPattern = /\n\s*\];?\s*$/;
          const arrayEndMatch = modifizierterContent.match(arrayEndPattern);
          if (!arrayEndMatch) {
            fehler.push('QUESTIONS-Array-Ende nicht gefunden');
            continue;
          }

          const insertPos = modifizierterContent.length - arrayEndMatch[0].length;
          // Komma nach letzter Frage sicherstellen
          const vorInsert = modifizierterContent.substring(0, insertPos).trimEnd();
          const brauchtKomma = !vorInsert.endsWith(',') && !vorInsert.endsWith('[');

          modifizierterContent = vorInsert + (brauchtKomma ? ',' : '') + '\n' + neueFrageStr + arrayEndMatch[0];

          neueHashes[neueId] = berechnePoolContentHash(felder);
          exportierteIds[aenderung.poolFrageId || 'new'] = neueId;
          exportiert++;
        }
      } catch (e) {
        fehler.push((aenderung.poolFrageId || 'export') + ': ' + e.message);
      }
    }

    if (aktualisiert === 0 && exportiert === 0) {
      return jsonResponse({ erfolg: false, fehler: fehler.length ? fehler : ['Keine Änderungen angewendet'] });
    }

    // 2. Commit via GitHub API
    const message = 'Pool-Sync: ' + poolDatei.replace('.js', '') + ' — ' +
      (aktualisiert > 0 ? aktualisiert + ' aktualisiert' : '') +
      (aktualisiert > 0 && exportiert > 0 ? ', ' : '') +
      (exportiert > 0 ? exportiert + ' neu' : '');

    const result = githubPutFile(pfad, modifizierterContent, sha, message);

    return jsonResponse({
      erfolg: true,
      aktualisiert,
      exportiert,
      commitSha: result.content.sha,
      neueHashes,
      exportierteIds,
      fehler
    });

  } catch (e) {
    if (e.message && e.message.includes('409')) {
      return jsonResponse({ erfolg: false, fehler: ['Pool wurde extern geändert. Bitte zuerst Pool-Sync (vorwärts) durchführen.'] });
    }
    return jsonResponse({ erfolg: false, fehler: [e.message || 'Unbekannter Fehler'] });
  }
}

function serialisiereNeuePoolFrage(felder) {
  const lines = [];
  lines.push('  {id: "' + felder.id + '", topic: "' + (felder.topic || '') + '", type: "' + (felder.type || 'mc') + '", diff: ' + (felder.diff || 2) + ', tax: "' + (felder.tax || 'K2') + '", reviewed: ' + (felder.reviewed || false) + ',');
  lines.push('    q: ' + JSON.stringify(felder.q || '') + ',');

  if (felder.options) {
    lines.push('    options: [');
    felder.options.forEach(function(o, i) {
      var comma = i < felder.options.length - 1 ? ',' : '';
      lines.push('      {v: "' + o.v + '", t: ' + JSON.stringify(o.t) + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.correct !== undefined) {
    if (Array.isArray(felder.correct)) {
      lines.push('    correct: [' + felder.correct.map(function(c) { return '"' + c + '"'; }).join(', ') + '],');
    } else if (typeof felder.correct === 'boolean') {
      lines.push('    correct: ' + felder.correct + ',');
    } else {
      lines.push('    correct: "' + felder.correct + '",');
    }
  }

  if (felder.blanks) {
    lines.push('    blanks: [');
    felder.blanks.forEach(function(b, i) {
      var alts = b.alts && b.alts.length ? ', alts: [' + b.alts.map(function(a) { return JSON.stringify(a); }).join(', ') + ']' : '';
      var comma = i < felder.blanks.length - 1 ? ',' : '';
      lines.push('      {answer: ' + JSON.stringify(b.answer) + alts + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.rows) {
    lines.push('    rows: [');
    felder.rows.forEach(function(r, i) {
      var unit = r.unit ? ', unit: "' + r.unit + '"' : '';
      var comma = i < felder.rows.length - 1 ? ',' : '';
      lines.push('      {label: ' + JSON.stringify(r.label) + ', answer: ' + r.answer + ', tolerance: ' + r.tolerance + unit + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.categories) {
    lines.push('    categories: [' + felder.categories.map(function(c) { return JSON.stringify(c); }).join(', ') + '],');
  }

  if (felder.items) {
    lines.push('    items: [');
    felder.items.forEach(function(item, i) {
      var comma = i < felder.items.length - 1 ? ',' : '';
      lines.push('      {t: ' + JSON.stringify(item.t) + ', cat: ' + item.cat + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.sample) lines.push('    sample: ' + JSON.stringify(felder.sample) + ',');
  if (felder.explain) lines.push('    explain: ' + JSON.stringify(felder.explain));

  // Letztes Komma entfernen
  var last = lines[lines.length - 1];
  if (last.endsWith(',')) lines[lines.length - 1] = last.slice(0, -1);

  lines.push('  }');
  return lines.join('\n');
}
```

- [ ] **Step 5: Verify no syntax errors in apps-script-code.js**

Run: `node -c ExamLab/apps-script-code.js`
Expected: No syntax errors

- [ ] **Step 6: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Pool-Rück-Sync: Backend — schreibePoolAenderung + GitHub API Integration"
```

---

## Task 5: RueckSyncDialog.tsx — Two-Mode Dialog

**Files:**
- Create: `ExamLab/src/components/lp/RueckSyncDialog.tsx`
- Reference: `ExamLab/src/components/lp/PoolSyncDialog.tsx` (341 Z., pattern)

- [ ] **Step 1: Create RueckSyncDialog with Update-Mode**

```typescript
// ExamLab/src/components/lp/RueckSyncDialog.tsx
// Zwei-Modus-Dialog: Update bestehender Pool-Fragen / Export neuer Fragen

import { useState, useEffect } from 'react';
import type { Frage } from '../../types/fragen';
import type { RueckSyncDiffFeld } from '../../services/poolSync';
import { berechneRueckSyncDiff, ladePoolIndex } from '../../services/poolSync';
import { konvertiereZuPoolFormat } from '../../utils/poolExporter';
import { apiService } from '../../services/apiService';
import { useAuthStore } from '../../store/authStore';

type Phase = 'diff' | 'pool-wahl' | 'senden' | 'fertig' | 'fehler';

interface Props {
  frage: Frage;
  offen: boolean;
  onSchliessen: () => void;
  onErfolg: (aktualiserteFrage: Partial<Frage>) => void;
}

interface PoolEintrag {
  id: string;
  file: string;
  fach: string;
  title: string;
  topics?: Record<string, { label: string }>;
}

export default function RueckSyncDialog({ frage, offen, onSchliessen, onErfolg }: Props) {
  const email = useAuthStore(s => s.user?.email) || '';
  const istUpdate = !!frage.poolId;

  // Update-Mode State
  const [diffs, setDiffs] = useState<RueckSyncDiffFeld[]>([]);
  const [gewaehlteFelder, setGewaehlteFelder] = useState<Set<string>>(new Set());

  // Export-Mode State
  const [pools, setPools] = useState<PoolEintrag[]>([]);
  const [gewaehlterPool, setGewaehlterPool] = useState('');
  const [gewaehltesTopic, setGewaehltesTopic] = useState('');

  // Shared State
  const [phase, setPhase] = useState<Phase>(istUpdate ? 'diff' : 'pool-wahl');
  const [fehlerText, setFehlerText] = useState('');
  const [ergebnis, setErgebnis] = useState<{ aktualisiert: number; exportiert: number } | null>(null);

  // Diff berechnen (Update-Modus)
  useEffect(() => {
    if (!offen || !istUpdate || !frage.poolVersion) return;
    const d = berechneRueckSyncDiff(frage, frage.poolVersion);
    setDiffs(d);
    setGewaehlteFelder(new Set(d.map(f => f.poolFeld)));
  }, [offen, frage, istUpdate]);

  // Pool-Liste laden (Export-Modus)
  useEffect(() => {
    if (!offen || istUpdate) return;
    ladePoolIndex().then(index => {
      setPools(index as PoolEintrag[]);
      // Vorselektieren nach Fachbereich
      const passend = index.find(p => p.fach?.toLowerCase() === frage.fachbereich?.toLowerCase());
      if (passend) setGewaehlterPool(passend.id);
    }).catch(() => setFehlerText('Pool-Index konnte nicht geladen werden'));
  }, [offen, istUpdate, frage.fachbereich]);

  const toggleFeld = (feld: string) => {
    setGewaehlteFelder(prev => {
      const neu = new Set(prev);
      if (neu.has(feld)) neu.delete(feld);
      else neu.add(feld);
      return neu;
    });
  };

  const handleSenden = async () => {
    setPhase('senden');
    try {
      if (istUpdate) {
        // Update: Gewählte Felder senden
        const poolId = frage.poolId!;
        const [poolName, frageId] = poolId.split(':');
        const poolDatei = poolName + '.js';

        const felder: Record<string, unknown> = {};
        for (const diff of diffs) {
          if (gewaehlteFelder.has(diff.poolFeld)) {
            if (diff.poolFeld === 'spezifisch') {
              // Typ-spezifische Felder auflösen
              const exported = konvertiereZuPoolFormat(frage, '', frageId);
              if (exported.blanks) felder.blanks = exported.blanks;
              if (exported.rows) felder.rows = exported.rows;
              if (exported.items) { felder.items = exported.items; felder.categories = exported.categories; }
              if (exported.options) felder.options = exported.options;
            } else {
              felder[diff.poolFeld] = diff.neu;
            }
          }
        }
        // reviewed-Status mitsenden wenn geändert
        if (frage.poolGeprueft !== undefined) felder.reviewed = frage.poolGeprueft;

        const result = await apiService.schreibePoolAenderung(email, poolDatei, [{
          poolFrageId: frageId,
          typ: 'update',
          felder
        }]);

        if (!result?.erfolg) {
          setFehlerText(result?.fehler?.join(', ') || 'Unbekannter Fehler');
          setPhase('fehler');
          return;
        }

        setErgebnis({ aktualisiert: result.aktualisiert, exportiert: 0 });
        onErfolg({
          poolContentHash: result.neueHashes[frageId] || frage.poolContentHash,
          poolUpdateVerfuegbar: false,
        });

      } else {
        // Export: Neue Frage in Pool
        const pool = pools.find(p => p.id === gewaehlterPool);
        if (!pool) { setFehlerText('Kein Pool gewählt'); setPhase('fehler'); return; }

        const exported = konvertiereZuPoolFormat(frage, gewaehltesTopic);
        // reviewed bei Export = false
        exported.reviewed = false;

        const result = await apiService.schreibePoolAenderung(email, pool.file || pool.id + '.js', [{
          poolFrageId: null,
          typ: 'export',
          felder: exported as unknown as Record<string, unknown>
        }]);

        if (!result?.erfolg) {
          setFehlerText(result?.fehler?.join(', ') || 'Unbekannter Fehler');
          setPhase('fehler');
          return;
        }

        const neuePoolId = Object.values(result.exportierteIds)[0];
        setErgebnis({ aktualisiert: 0, exportiert: result.exportiert });
        onErfolg({
          poolId: pool.id + ':' + neuePoolId,
          quelle: 'pool',
          poolContentHash: Object.values(result.neueHashes)[0],
        });
      }

      setPhase('fertig');
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : 'Netzwerkfehler');
      setPhase('fehler');
    }
  };

  if (!offen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">

        {/* Header */}
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          {istUpdate ? 'Änderungen an Pool zurückschreiben' : 'Frage in Pool exportieren'}
        </h2>

        {/* Update-Modus: Diff-Vorschau */}
        {phase === 'diff' && istUpdate && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Pool: <strong>{frage.poolId?.split(':')[0]}</strong> · Frage: <strong>{frage.poolId?.split(':')[1]}</strong>
            </p>
            {diffs.length === 0 ? (
              <p className="text-gray-500 py-4">Keine Unterschiede zum Pool gefunden.</p>
            ) : (
              <div className="space-y-3">
                {diffs.map(d => (
                  <label key={d.poolFeld} className="flex items-start gap-3 p-3 rounded border dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={gewaehlteFelder.has(d.poolFeld)}
                      onChange={() => toggleFeld(d.poolFeld)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm dark:text-white">{d.feld}</div>
                      <div className="text-xs text-gray-400 line-through mt-1 break-words">
                        {typeof d.alt === 'string' ? d.alt : JSON.stringify(d.alt)}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-400 mt-1 break-words">
                        {typeof d.neu === 'string' ? d.neu : JSON.stringify(d.neu)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Abbrechen</button>
              <button
                onClick={handleSenden}
                disabled={gewaehlteFelder.size === 0}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Zurückschreiben ({gewaehlteFelder.size} Felder)
              </button>
            </div>
          </>
        )}

        {/* Export-Modus: Pool + Topic Wahl */}
        {phase === 'pool-wahl' && !istUpdate && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Ziel-Pool</label>
                <select
                  value={gewaehlterPool}
                  onChange={e => { setGewaehlterPool(e.target.value); setGewaehltesTopic(''); }}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="">— Pool wählen —</option>
                  {pools.map(p => (
                    <option key={p.id} value={p.id}>{p.fach} · {p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Topic</label>
                <select
                  value={gewaehltesTopic}
                  onChange={e => setGewaehltesTopic(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={!gewaehlterPool}
                >
                  <option value="">— Topic wählen —</option>
                  {/* Topics werden vom Pool geladen — hier Platzhalter, wird in Step 2 ergänzt */}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Topics werden beim Laden des Pools verfügbar.
                </p>
              </div>
              {/* Vorschau */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                <div className="font-medium mb-2 dark:text-white">Vorschau (Pool-Format)</div>
                <div className="text-xs dark:text-gray-300"><strong>Typ:</strong> {frage.typ}</div>
                <div className="text-xs dark:text-gray-300"><strong>Bloom:</strong> {frage.bloom}</div>
                <div className="text-xs dark:text-gray-300"><strong>Fragetext:</strong> {frage.fragetext?.substring(0, 100)}...</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Abbrechen</button>
              <button
                onClick={handleSenden}
                disabled={!gewaehlterPool || !gewaehltesTopic}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Exportieren
              </button>
            </div>
          </>
        )}

        {/* Senden */}
        {phase === 'senden' && (
          <div className="py-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {istUpdate ? 'Schreibe Änderungen an Pool...' : 'Exportiere Frage in Pool...'}
            </p>
          </div>
        )}

        {/* Fertig */}
        {phase === 'fertig' && ergebnis && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-sm dark:text-gray-300">
              {ergebnis.aktualisiert > 0 && `${ergebnis.aktualisiert} Felder zurückgeschrieben.`}
              {ergebnis.exportiert > 0 && `Frage exportiert.`}
            </p>
            <p className="text-xs text-gray-400 mt-2">Änderungen sind in ~2 Min. auf GitHub Pages sichtbar.</p>
            <button onClick={onSchliessen} className="mt-4 px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700">
              Schliessen
            </button>
          </div>
        )}

        {/* Fehler */}
        {phase === 'fehler' && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">✗</div>
            <p className="text-sm text-red-600 dark:text-red-400">{fehlerText}</p>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300">Schliessen</button>
              <button onClick={() => setPhase(istUpdate ? 'diff' : 'pool-wahl')} className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700">
                Nochmal versuchen
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add topic loading for Export mode**

The Export mode needs to fetch the pool config to get available topics. Add a `useEffect` that loads the pool config when `gewaehlterPool` changes:

```typescript
// Add after the pools-loading useEffect
const [poolTopics, setPoolTopics] = useState<Record<string, { label: string }>>({});

useEffect(() => {
  if (!gewaehlterPool || istUpdate) return;
  const pool = pools.find(p => p.id === gewaehlterPool);
  if (!pool) return;
  const datei = pool.file || pool.id + '.js';
  import('../../services/poolSync').then(({ ladePoolConfig }) => {
    ladePoolConfig(datei).then(config => {
      setPoolTopics(config.topics);
    }).catch(() => setPoolTopics({}));
  });
}, [gewaehlterPool, pools, istUpdate]);
```

Replace the Topic-Dropdown placeholder with:
```typescript
{Object.entries(poolTopics).map(([key, topic]) => (
  <option key={key} value={key}>{topic.label}</option>
))}
```

- [ ] **Step 3: Verify build**

Run: `cd ExamLab && npm run build`

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/RueckSyncDialog.tsx
git commit -m "Pool-Rück-Sync: RueckSyncDialog — Diff-Vorschau + Export-Dialog"
```

---

## Task 6: FragenEditor — Buttons hinzufügen

**Files:**
- Modify: `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` (1329 Z.)

- [ ] **Step 1: Add import and state for RueckSyncDialog**

At top of FragenEditor.tsx, add:
```typescript
import RueckSyncDialog from '../RueckSyncDialog';
```

Add state variable (near other state declarations):
```typescript
const [rueckSyncOffen, setRueckSyncOffen] = useState(false);
```

- [ ] **Step 2: Add buttons in toolbar area**

Find the save/duplicate button area in the component. Add after the duplicate button:

```typescript
{/* Pool-Rück-Sync Buttons */}
{frage && frage.poolId && frage.poolVersion && (
  <button
    onClick={() => setRueckSyncOffen(true)}
    title="Änderungen an Pool zurückschreiben"
    className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
  >
    ↑ An Pool
  </button>
)}
{frage && !frage.poolId && frage.typ !== 'visualisierung' && (
  <button
    onClick={() => setRueckSyncOffen(true)}
    title="Frage in einen Übungspool exportieren"
    className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
  >
    ↑ In Pool exportieren
  </button>
)}
```

- [ ] **Step 3: Add RueckSyncDialog render**

At end of component JSX (before closing fragment/div), add:

```typescript
{frage && rueckSyncOffen && (
  <RueckSyncDialog
    frage={frage}
    offen={rueckSyncOffen}
    onSchliessen={() => setRueckSyncOffen(false)}
    onErfolg={(updates) => {
      // Frage-Daten aktualisieren und speichern
      const aktualisiert = { ...frage, ...updates, geaendertAm: new Date().toISOString() };
      onSpeichern(aktualisiert);
      setRueckSyncOffen(false);
    }}
  />
)}
```

- [ ] **Step 4: Verify build**

Run: `cd ExamLab && npm run build`

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "Pool-Rück-Sync: Buttons '↑ An Pool' / '↑ In Pool exportieren' im FragenEditor"
```

---

## Task 7: FragenBrowser — Batch-Export Button

**Files:**
- Modify: `ExamLab/src/components/lp/FragenBrowser.tsx` (856 Z.)

- [ ] **Step 1: Add batch export button in header**

Find the header area where "Pool synchronisieren" button is. Add nearby:

```typescript
<button
  onClick={() => {/* TODO: Batch-Export Dialog öffnen — Phase 2, erstmal Einzelexport fertigstellen */}}
  title="Mehrere Fragen in Pools exportieren"
  className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
>
  ↑ Pool-Export
</button>
```

Note: Der Batch-Export-Dialog ist ein Ergänzung nach dem Einzelexport. Der Button wird platziert, die Logik in einer zweiten Iteration implementiert. So kann der Einzelexport zuerst getestet werden.

- [ ] **Step 2: Verify build**

Run: `cd ExamLab && npm run build`

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/lp/FragenBrowser.tsx
git commit -m "Pool-Rück-Sync: Batch-Export Button im FragenBrowser (Platzhalter)"
```

---

## Task 8: Integration, Build & HANDOFF

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: Full build verification**

Run: `cd ExamLab && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Update HANDOFF.md**

Add new section under "Letzte Änderungen":

```markdown
### Änderungen (21.03.2026) — Pool-Rück-Sync

**Pool-Rück-Sync** (Bidirektionale Pool-Brücke):
- **↑ An Pool:** Button im FragenEditor für importierte Pool-Fragen — Feld-für-Feld Diff-Vorschau mit Checkboxen, gewählte Änderungen werden via GitHub API direkt in die Pool-Config-Datei committed
- **↑ In Pool exportieren:** Button für neue Fragen (ohne poolId) — Pool + Topic wählen, Frage wird im Pool-Format ans QUESTIONS-Array angehängt
- **Backend:** Neuer Apps Script Endpoint `schreibePoolAenderung` — GitHub API Proxy (GET file + manipulate + PUT commit)
- **JS-Parsing:** Gezielte Regex-basierte Frage-Ersetzung (keine Full-Parse) — minimale Git-Diffs, Kommentare bleiben erhalten
- **poolExporter.ts:** Reverse Type-Mapping (7 Prüfungstypen → 7 Pool-Typen, VisualisierungFrage ausgeschlossen)
- **Content-Hash:** Backend berechnet neuen Hash nach Schreiben → Frontend übernimmt (keine Hash-Divergenz)
- **Batch-Export:** Button im FragenBrowser platziert (Logik folgt in nächster Iteration)
- **Wichtig nach Push:** `apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung erstellen
- **Wichtig:** `GITHUB_TOKEN` als Script Property in Apps Script setzen (Fine-Grained PAT, contents:write)
```

Update "Offene Punkte":
- Pool-Rück-Sync von "offen" auf "erledigt (Einzel-Sync)" ändern
- Batch-Export als neuen offenen Punkt hinzufügen

- [ ] **Step 3: Commit everything**

```bash
git add -A
git commit -m "Pool-Rück-Sync: HANDOFF aktualisiert, Integration komplett"
```

- [ ] **Step 4: Push**

```bash
git push
```

---

## Setup-Hinweise (nach Deploy)

Der User muss nach dem Push folgende manuelle Schritte durchführen:

1. **GitHub PAT erstellen:**
   - GitHub → Settings → Developer Settings → Fine-Grained Personal Access Tokens
   - Repository: `durandbourjate/GYM-WR-DUY`
   - Permission: Contents → Read and Write
   - Token kopieren

2. **Apps Script konfigurieren:**
   - `apps-script-code.js` in Apps Script Editor kopieren
   - Neue Bereitstellung erstellen (Stift → Neue Version)
   - Projekteinstellungen → Skripteigenschaften → `GITHUB_TOKEN` = den kopierten Token

3. **Testen:**
   - Im Prüfungstool eine importierte Pool-Frage öffnen
   - Text ändern → "↑ An Pool" klicken
   - Diff-Vorschau prüfen → "Zurückschreiben"
   - GitHub-Repo prüfen: neuer Commit in der Pool-Datei
