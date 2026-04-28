# Bundle J — DnD-Bild Multi-Zone-Datenmodell Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the DragDropBild question type from single-label-per-zone to multi-label/multi-zone data model, with backward-compatible normalizers and a one-shot bestand migration.

**Architecture:** Dual-Read-Pattern via central `normalisiereDragDropBild` (Frage) + `normalisiereDragDropAntwort` (Antwort), called at all 14 read entry points. `stabilId(frageId, text, index)` deterministic hash shared between Frontend (`stabilId.ts`) and Migration script (`stabilId.mjs`) — no orphan answers across migration boundary. Apps-Script `LOESUNGS_FELDER_` extended to bereinige both old and new fields. Bestand migration analog C9 Phase 4 via `batchUpdateFragenMigration` endpoint.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap (Frontend), Apps Script V8 (Backend), Node ESM (Migration scripts), Vitest + React Testing Library (Tests).

**Spec:** `docs/superpowers/specs/2026-04-28-bundle-j-dragdrop-multi-zone-design.md` (rev3, approved).

---

## File Structure

### Created files

| Pfad | Verantwortung |
|---|---|
| `packages/shared/src/util/stabilId.ts` | TS deterministic hash `(frageId, text, index) → 8-char base32` |
| `packages/shared/src/util/stabilId.mjs` | ESM mirror for Node migration scripts |
| `packages/shared/src/util/stabilId.test.ts` | Cross-environment determinism + collision tests |
| `ExamLab/src/utils/dragdropAntwortMigration.test.ts` | Antwort-Normalizer text→id mapping tests |
| `ExamLab/src/tests/DragDropBildEditorMultiZone.test.tsx` | Editor: Chip-Add/Remove, Pool-Duplikate, Konsistenz-Hinweise, Migrations-Adapter |
| `ExamLab/src/tests/DragDropBildFrageStacks.test.tsx` | SuS-Renderer: Stack-Counter, deterministic Stack-Pick, Pool-Empty bei letzter Platzierung |
| `ExamLab/scripts/audit-bundle-j/zaehleDragDropFragen.mjs` | Audit-Skript |
| `ExamLab/scripts/audit-bundle-j/README.md` | Audit-Skript-Bedienung |
| `ExamLab/scripts/migrate-dragdrop-multi-zone/dump.mjs` | Sheet-Dump aller `dragdrop_bild` Fragen |
| `ExamLab/scripts/migrate-dragdrop-multi-zone/migrate.mjs` | Transform old → new format |
| `ExamLab/scripts/migrate-dragdrop-multi-zone/upload.mjs` | Batch-Upload via `batchUpdateFragenMigration` |
| `ExamLab/scripts/migrate-dragdrop-multi-zone/SESSION-PROTOCOL.md` | Schrittfolge (analog C9) |
| `ExamLab/scripts/migrate-dragdrop-multi-zone/README.md` | Bedienung + Voraussetzungen |
| `ExamLab/scripts/migrate-dragdrop-multi-zone/package.json` | Dependencies (`undici` für fetch, `@noble/hashes` für SHA-1) |

### Modified files

| Pfad | Was sich ändert |
|---|---|
| `packages/shared/src/types/fragen.ts` (~Z. 613-635) | `DragDropBildLabel` neu, `korrekteLabels`/`legacyLabels`/`korrektesLabel` deprecated |
| `ExamLab/src/types/antworten.ts` (Z. 42) | Kommentar: `Record<labelId, zoneId>` (semantisch neu, Type bleibt `Record<string, string>`) |
| `ExamLab/src/utils/ueben/fragetypNormalizer.ts` (Z. 258-271) | `normalisiereDragDropBild` erweitern + `normalisiereDragDropAntwort` neu |
| `ExamLab/src/utils/dragdropBildUtils.ts` | `gruppiereStacks`-Helper neu |
| `ExamLab/src/utils/autoKorrektur.ts` (~Z. 485-510) | `korrigiereDragDropBild` Multi-Label-Match + Normalizer-Aufruf |
| `ExamLab/src/utils/autoKorrektur.test.ts` | Multi-Zone, Multi-Label, Mix, Distraktor-Tests |
| `ExamLab/src/utils/ueben/korrektur.ts` (Z. 226-230) | Üben-Korrektur: Normalizer-Aufruf + Multi-Label-Match |
| `ExamLab/src/utils/antwortStatus.ts` (Z. 142-149) | `istBeantwortet`-Detektor: Normalizer-Aufruf |
| `ExamLab/src/utils/poolConverter.ts` (Z. 550-580) | `filter` statt `find` für Multi-Label |
| `ExamLab/src/utils/poolConverter.test.ts` | Pool-Multi-Label-Test |
| `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx` | Stack-Counter + deterministische ID-Auswahl + Antwort-Normalizer |
| `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` (Z. 535) | Normalizer-Aufruf am Top des dragdrop_bild-Branch |
| `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` (Z. 734) | Normalizer-Aufruf |
| `ExamLab/src/store/ueben/uebungsStore.ts` (Z. 65) | `mergeById` setzt voraus dass Caller normalisiert hat — Comment + Caller-Update |
| `ExamLab/src/services/autoSave.ts` | IDB-Restore-Pfad: Antwort-Normalizer-Aufruf (Pfad #15, Spec Risiko #10) |
| `packages/shared/src/editor/typen/DragDropBildEditor.tsx` | Chip-Input pro Zone, Pool-Duplikate, Konsistenz-Hinweise, DoppelteLabelDialog entfernt, Mount-Adapter |
| `packages/shared/src/editor/SharedFragenEditor.tsx` (Z. 465) | `key={frage.id}`-Prop für DragDropBild-Editor (S129-Lehre) |
| `packages/shared/src/editor/fragenFactory.ts` (Z. 280-290) | Default für neue Frage: `labels: []` (DragDropBildLabel[]), `korrekteLabels: ['Label 1']` |
| `ExamLab/apps-script-code.js` (Z. 2200-2700, 8223) | `LOESUNGS_FELDER_` erweitert, S122-Type-Guard, Korrektur-Spiegel, Demo-Frage Format, Test-Shim |
| `ExamLab/src/__tests__/regression/securityInvarianten.test.ts` (Z. 130-140) | `korrekteLabels` + Legacy-Bereinigung + Label-ID-Determinismus |
| `ExamLab/HANDOFF.md` | Bundle-J-Status pro Phase |

---

## Branch Strategy

Feature-Branch (regression-prevention.md Hard-Stop-Regel 1): `feature/bundle-j-dragdrop-multi-zone`. Direkt-Commit auf `main` verboten. Browser-E2E + LP-Freigabe vor Merge.

---

## Phase 0 — Setup & Audit

### Task 1: Branch + Audit-Skript

**Files:**
- Create: `ExamLab/scripts/audit-bundle-j/zaehleDragDropFragen.mjs`
- Create: `ExamLab/scripts/audit-bundle-j/README.md`

- [ ] **Step 1: Branch anlegen**

```bash
cd "10 Github/GYM-WR-DUY"
git checkout main && git pull
git checkout -b feature/bundle-j-dragdrop-multi-zone
```

- [ ] **Step 2: Audit-Skript schreiben**

`ExamLab/scripts/audit-bundle-j/zaehleDragDropFragen.mjs`:

```js
#!/usr/bin/env node
// Audit Bundle J — zählt dragdrop_bild-Fragen für Migrations-Scope
import { request } from 'undici'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const AUDIT_TOKEN = process.env.AUDIT_TOKEN
if (!APPS_SCRIPT_URL || !AUDIT_TOKEN) {
  console.error('Setze APPS_SCRIPT_URL und AUDIT_TOKEN in der Umgebung.')
  process.exit(1)
}

const { body } = await request(APPS_SCRIPT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ action: 'dumpFragen', token: AUDIT_TOKEN }),
})
const data = await body.json()
if (!data.success) {
  console.error('API-Fehler:', data.error)
  process.exit(1)
}

const dnd = data.data.filter(f => f.typ === 'dragdrop_bild')
let multiZoneBug = 0
const multiZoneIds = []
for (const f of dnd) {
  const labelCounts = new Map()
  for (const z of (f.zielzonen ?? [])) {
    const k = (z.korrektesLabel ?? '').trim().toLowerCase()
    if (!k) continue
    labelCounts.set(k, (labelCounts.get(k) ?? 0) + 1)
  }
  if ([...labelCounts.values()].some(n => n > 1)) {
    multiZoneBug++
    multiZoneIds.push(f.id)
  }
}
const distraktoren = dnd.filter(f => (f.labels?.length ?? 0) > (f.zielzonen?.length ?? 0))

console.log(`DragDrop-Bild-Fragen total: ${dnd.length}`)
console.log(`  Multi-Zone-Bug heute (≥2 Zonen identisches korrektesLabel): ${multiZoneBug}`)
console.log(`  Mit Distraktoren (labels.length > zielzonen.length): ${distraktoren.length}`)
console.log()
console.log(`Multi-Zone-Bug-Fragen-IDs (LP-Re-Edit nach Migration nötig):`)
for (const id of multiZoneIds) console.log(`  ${id}`)
console.log()
console.log(`Hinweis: Aktive Üben-Sessions + Antworten in laufenden Prüfungen`)
console.log(`manuell prüfen via Apps-Script Editor (Sheets "Übungssessions" / "Antworten").`)
```

- [ ] **Step 3: README mit Bedienung schreiben**

`ExamLab/scripts/audit-bundle-j/README.md`:

```markdown
# Audit Bundle J — DragDrop-Bild-Fragen

## Voraussetzungen

- Node 20+
- Apps-Script-URL der aktuellen Bereitstellung
- Admin-Token (siehe Apps Script Properties → AUDIT_TOKEN)

## Ausführung

\```bash
export APPS_SCRIPT_URL='https://script.google.com/macros/s/.../exec'
export AUDIT_TOKEN='...'
cd ExamLab/scripts/audit-bundle-j
node zaehleDragDropFragen.mjs
\```

## Output

- Total dragdrop_bild-Fragen
- Multi-Zone-Bug-Kandidaten (LP-Re-Edit nach Migration)
- Distraktor-Statistik
- IDs der betroffenen Fragen (zur LP-Kommunikation)

## Manueller Zusatz-Check

Aktive Üben-Sessions + Antworten in laufenden Prüfungen müssen manuell im
Apps Script Editor geprüft werden (Sheets `Übungssessions`, `Antworten`).
Dies bestimmt den optimalen Migrations-Zeitpunkt (Sektion 10.3 der Spec).
```

- [ ] **Step 4: Skript NICHT ausführen, nur committen** (User führt aus, sobald APPS_SCRIPT_URL bekannt ist)

```bash
git add ExamLab/scripts/audit-bundle-j/
git commit -m "Bundle J Phase 0: Audit-Skript für DragDrop-Bild-Bestand"
```

- [ ] **Step 5: User-Task dokumentieren**

In HANDOFF.md unter `## Bundle J User-Tasks` ergänzen:

```markdown
- [ ] Audit-Skript ausführen (env: APPS_SCRIPT_URL, AUDIT_TOKEN)
  - Output zur Phase-Plan-Schätzung verwenden
  - Multi-Zone-Bug-IDs an LP für Re-Edit-Liste kommunizieren
```

---

## Phase 1 — Foundation: stabilId + Types

### Task 2: stabilId TS-Implementation

**Files:**
- Create: `packages/shared/src/util/stabilId.ts`
- Create: `packages/shared/src/util/stabilId.test.ts`

- [ ] **Step 1: Test schreiben**

`packages/shared/src/util/stabilId.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { stabilId } from './stabilId'

describe('stabilId', () => {
  it('liefert deterministische ID für gleichen Input', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Aktiva', 0)
    expect(a).toBe(b)
    expect(a).toHaveLength(8)
  })

  it('unterschiedliche Indizes liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Aktiva', 1)
    expect(a).not.toBe(b)
  })

  it('unterschiedliche Texte liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Passiva', 0)
    expect(a).not.toBe(b)
  })

  it('unterschiedliche Frage-IDs liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-2', 'Aktiva', 0)
    expect(a).not.toBe(b)
  })

  it('Output ist nur a-z2-7 (base32, lowercase)', () => {
    const id = stabilId('frage-1', 'Test 123', 0)
    expect(id).toMatch(/^[a-z2-7]{8}$/)
  })
})
```

- [ ] **Step 2: Test ausführen → FAIL**

```bash
cd ExamLab && npx vitest run packages/shared/src/util/stabilId.test.ts
```

Erwartet: FAIL — Modul existiert nicht.

- [ ] **Step 3: stabilId implementieren**

`packages/shared/src/util/stabilId.ts`:

```ts
/**
 * Deterministischer Hash für stabile Label-IDs in DnD-Bild-Fragen.
 *
 * Aufgerufen mit (frageId, text, index): identische Inputs liefern immer dieselbe
 * 8-char base32-ID. Frontend-Normalizer (Mount) und Migrations-Skript (One-Shot)
 * importieren denselben Algorithmus, damit Pre-Migration-SuS-Antworten
 * (text-keyed) auch nach Migration via ID-Lookup auflösbar bleiben.
 *
 * Algorithmus: SHA-1 über `${frageId}|${text}|${index}`, erste 5 Bytes als
 * base32 (RFC 4648, lowercase ohne Padding).
 */
export function stabilId(frageId: string, text: string, index: number): string {
  const input = `${frageId}|${text}|${index}`
  const hash = sha1(input)
  return base32Lower(hash.slice(0, 5))  // 5 Bytes → 8 base32-Zeichen
}

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

function base32Lower(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += BASE32_ALPHABET[(value >> bits) & 31]
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  return out
}

function sha1(input: string): Uint8Array {
  // Minimal SHA-1 Implementation — synchroner Hash für deterministische IDs
  // Quelle: simplified RFC 3174 reference implementation
  const enc = new TextEncoder().encode(input)
  const len = enc.length
  const blockBytes = 64
  const totalBlocks = Math.floor((len + 9 + blockBytes - 1) / blockBytes)
  const buf = new Uint8Array(totalBlocks * blockBytes)
  buf.set(enc)
  buf[len] = 0x80
  const bits = BigInt(len) * 8n
  // length-suffix big-endian 64-bit
  for (let i = 0; i < 8; i++) {
    buf[buf.length - 1 - i] = Number((bits >> BigInt(i * 8)) & 0xffn)
  }
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  for (let bk = 0; bk < totalBlocks; bk++) {
    const w = new Array<number>(80)
    for (let i = 0; i < 16; i++) {
      const off = bk * blockBytes + i * 4
      w[i] = ((buf[off] << 24) | (buf[off+1] << 16) | (buf[off+2] << 8) | buf[off+3]) >>> 0
    }
    for (let i = 16; i < 80; i++) {
      const v = w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16]
      w[i] = ((v << 1) | (v >>> 31)) >>> 0
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let i = 0; i < 80; i++) {
      let f, k
      if (i < 20) { f = (b & c) | ((~b) & d); k = 0x5a827999 }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1 }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc }
      else { f = b ^ c ^ d; k = 0xca62c1d6 }
      const tmp = ((((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0)
      e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = tmp
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0
  }
  const out = new Uint8Array(20)
  const w = [h0, h1, h2, h3, h4]
  for (let i = 0; i < 5; i++) {
    out[i*4]   = (w[i] >>> 24) & 0xff
    out[i*4+1] = (w[i] >>> 16) & 0xff
    out[i*4+2] = (w[i] >>> 8)  & 0xff
    out[i*4+3] =  w[i]         & 0xff
  }
  return out
}
```

- [ ] **Step 4: Test ausführen → PASS**

```bash
cd ExamLab && npx vitest run packages/shared/src/util/stabilId.test.ts
```

Erwartet: 5/5 Tests grün.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/util/stabilId.ts packages/shared/src/util/stabilId.test.ts
git commit -m "Bundle J Phase 1.1: stabilId-TS-Helper für deterministische Label-IDs"
```

### Task 3: stabilId ESM-Mirror

**Files:**
- Create: `packages/shared/src/util/stabilId.mjs`

- [ ] **Step 1: ESM-Mirror schreiben (gleicher Algorithmus, kein TS-Import)**

`packages/shared/src/util/stabilId.mjs`:

```js
// ESM-Mirror von stabilId.ts für Node-Migrations-Skripte.
// MUSS byte-identische Outputs zur TS-Variante liefern.

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

export function stabilId(frageId, text, index) {
  const input = `${frageId}|${text}|${index}`
  const hash = sha1(input)
  return base32Lower(hash.slice(0, 5))
}

function base32Lower(bytes) {
  let bits = 0, value = 0, out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += BASE32_ALPHABET[(value >> bits) & 31]
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function sha1(input) {
  const enc = new TextEncoder().encode(input)
  const len = enc.length
  const blockBytes = 64
  const totalBlocks = Math.floor((len + 9 + blockBytes - 1) / blockBytes)
  const buf = new Uint8Array(totalBlocks * blockBytes)
  buf.set(enc)
  buf[len] = 0x80
  const bits = BigInt(len) * 8n
  for (let i = 0; i < 8; i++) buf[buf.length - 1 - i] = Number((bits >> BigInt(i * 8)) & 0xffn)
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  for (let bk = 0; bk < totalBlocks; bk++) {
    const w = new Array(80)
    for (let i = 0; i < 16; i++) {
      const off = bk * blockBytes + i * 4
      w[i] = ((buf[off] << 24) | (buf[off+1] << 16) | (buf[off+2] << 8) | buf[off+3]) >>> 0
    }
    for (let i = 16; i < 80; i++) {
      const v = w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16]
      w[i] = ((v << 1) | (v >>> 31)) >>> 0
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let i = 0; i < 80; i++) {
      let f, k
      if (i < 20) { f = (b & c) | ((~b) & d); k = 0x5a827999 }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1 }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc }
      else { f = b ^ c ^ d; k = 0xca62c1d6 }
      const tmp = ((((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0)
      e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = tmp
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0
  }
  const out = new Uint8Array(20)
  const w = [h0, h1, h2, h3, h4]
  for (let i = 0; i < 5; i++) {
    out[i*4]   = (w[i] >>> 24) & 0xff
    out[i*4+1] = (w[i] >>> 16) & 0xff
    out[i*4+2] = (w[i] >>> 8)  & 0xff
    out[i*4+3] =  w[i]         & 0xff
  }
  return out
}
```

- [ ] **Step 2: Cross-Environment-Test ergänzen**

In `packages/shared/src/util/stabilId.test.ts` am Ende:

```ts
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'

it('TS- und MJS-Variante liefern byte-identische IDs', () => {
  const cases = [
    ['frage-1', 'Aktiva', 0],
    ['frage-2', 'Soll', 5],
    ['fr-with-äöü', 'Spezial', 99],
  ] as const
  const tsResults = cases.map(([f, t, i]) => stabilId(f, t, i))

  const tmpScript = '/tmp/stabilId-mjs-check.mjs'
  writeFileSync(tmpScript, `
    import { stabilId } from '${process.cwd()}/../packages/shared/src/util/stabilId.mjs'
    const cases = ${JSON.stringify(cases)}
    for (const [f, t, i] of cases) console.log(stabilId(f, t, i))
  `)
  try {
    const out = execSync(`node ${tmpScript}`, { encoding: 'utf8' }).trim().split('\n')
    expect(out).toEqual(tsResults)
  } finally {
    unlinkSync(tmpScript)
  }
})
```

- [ ] **Step 3: Tests ausführen → 6/6 PASS**

```bash
cd ExamLab && npx vitest run packages/shared/src/util/stabilId.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/util/stabilId.mjs packages/shared/src/util/stabilId.test.ts
git commit -m "Bundle J Phase 1.2: stabilId-ESM-Mirror + Cross-Environment-Test"
```

### Task 4: Type-Erweiterung

**Files:**
- Modify: `packages/shared/src/types/fragen.ts` (Z. 613-635)

- [ ] **Step 1: Aktuellen Stand lesen**

```bash
cd "10 Github/GYM-WR-DUY"
sed -n '610,635p' packages/shared/src/types/fragen.ts
```

- [ ] **Step 2: Types ersetzen**

In `packages/shared/src/types/fragen.ts` Z. 613-632 ersetzen durch:

```ts
// === DRAG & DROP AUF BILDER ===

export interface DragDropBildZielzone {
  id: string
  form: 'rechteck' | 'polygon'
  punkte: { x: number; y: number }[]   // Prozent 0-100, ≥3 Punkte (Rechteck = 4)
  /**
   * Akzeptierte Label-Texte für diese Zone (Synonyme).
   * Min. 1 Eintrag Pflicht. Match per `text.trim().toLowerCase()`.
   */
  korrekteLabels: string[]
  /** @deprecated Bundle J Cleanup-Bundle entfernt das. Dual-Read im Migrations-Fenster. */
  korrektesLabel?: string
  /** Teilerklärung (C9): welches Label hierhin gehört und warum. */
  erklaerung?: string
}

export interface DragDropBildLabel {
  /** Stabile Instanz-ID, generiert via `stabilId(frageId, text, index)` oder Editor-Random beim Anlegen. */
  id: string
  text: string
}

export interface DragDropBildFrage extends FrageBase {
  typ: 'dragdrop_bild'
  fragetext: string
  bildUrl: string
  /** @deprecated Phase 6 entfernt. Jetzt verwenden: `bild`. */
  bildDriveFileId?: string
  /** Neue kanonische Bild-Referenz (Dual-Write Phase 3-5, Pflicht ab Phase 6). */
  bild?: MediaQuelle
  zielzonen: DragDropBildZielzone[]
  /** Pool-Tokens mit IDs. Duplikate erlaubt (Multi-Zone-Tokens). */
  labels: DragDropBildLabel[]
  /** @deprecated Bundle J Cleanup-Bundle entfernt das. Dual-Read im Migrations-Fenster. */
  legacyLabels?: string[]
}
```

- [ ] **Step 3: TypeScript-Check ausführen**

```bash
cd ExamLab && npx tsc -b
```

Erwartet: viele Compile-Fehler in Pfaden, die `frage.labels` als `string[]` lesen oder `zone.korrektesLabel` setzen. Diese werden in Phase 2-8 nacheinander gefixt.

- [ ] **Step 4: TODO-Liste der Compile-Fehler in HANDOFF.md festhalten**

```markdown
## Bundle J Phase 1.3 — Compile-Fehler nach Type-Erweiterung

(Liste aus tsc -b Output)
```

- [ ] **Step 5: Commit (mit known-fail-tsc, wird in Phase 2-8 grün)**

```bash
git add packages/shared/src/types/fragen.ts ExamLab/HANDOFF.md
git commit -m "Bundle J Phase 1.3: DragDropBild-Type-Erweiterung (korrekteLabels + DragDropBildLabel)

tsc -b ist absichtlich rot bis Phase 8 abgeschlossen — alle 15 Lese-Pfade
(14 aus Spec 5.2.1 + IDB-Restore aus 5.2.2) brauchen Normalizer-Aufruf
bevor sie auf neuem Type kompilieren. Mitigationen-Reihenfolge in Spec
Sektion 5.2.1."
```

> **⚠ Implementer-Hinweis:** `npx tsc -b` wird in Phasen 2-7 rot bleiben — das ist beabsichtigt. NICHT versuchen vorzeitig zu fixen indem `as any`-Casts eingestreut werden. Die roten Stellen werden Pfad-für-Pfad in Phase 5-8 durch Normalizer-Aufrufe ersetzt. Erst Task 26 erwartet wieder grünes `tsc -b`.

---

## Phase 2 — Frage-Normalizer

### Task 5: normalisiereDragDropBild Test

**Files:**
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.test.ts` (oder neu falls fehlt)

- [ ] **Step 1: Test-Datei prüfen / anlegen**

```bash
ls ExamLab/src/utils/ueben/fragetypNormalizer.test.ts || \
  echo '// vitest tests for fragetypNormalizer' > ExamLab/src/utils/ueben/fragetypNormalizer.test.ts
```

- [ ] **Step 2: Tests schreiben**

In `ExamLab/src/utils/ueben/fragetypNormalizer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalisiereDragDropBild } from './fragetypNormalizer'
import { stabilId } from '../../../../packages/shared/src/util/stabilId'

describe('normalisiereDragDropBild', () => {
  it('Pre-Migration-Frage: string[]-Pool wird zu DragDropBildLabel[] mit stabilen IDs', () => {
    const alt = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: ['Aktiva', 'Passiva', 'Aktiva'],
      zielzonen: [
        { id: 'z1', korrektesLabel: 'Aktiva' },
        { id: 'z2', korrektesLabel: 'Passiva' },
      ],
    }
    const out = normalisiereDragDropBild(alt)
    expect(out.labels).toHaveLength(3)
    expect(out.labels[0].id).toBe(stabilId('f1', 'Aktiva', 0))
    expect(out.labels[2].id).toBe(stabilId('f1', 'Aktiva', 2))
    expect(out.labels[0].id).not.toBe(out.labels[2].id)  // Multi-Zone: unterschiedliche IDs trotz gleichem Text
  })

  it('Post-Migration-Frage: DragDropBildLabel[]-Pool bleibt unverändert', () => {
    const neu = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: [{ id: 'abc', text: 'Aktiva' }, { id: 'def', text: 'Passiva' }],
      zielzonen: [
        { id: 'z1', korrekteLabels: ['Aktiva'] },
        { id: 'z2', korrekteLabels: ['Passiva'] },
      ],
    }
    const out = normalisiereDragDropBild(neu)
    expect(out.labels[0].id).toBe('abc')
    expect(out.zielzonen[0].korrekteLabels).toEqual(['Aktiva'])
  })

  it('gemischte Migrations-Übergangs-Form: Pre + Post Felder gleichzeitig', () => {
    const mix = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: [{ id: 'abc', text: 'Aktiva' }, 'Passiva'],  // gemischt
      zielzonen: [
        { id: 'z1', korrekteLabels: ['Aktiva'], korrektesLabel: 'Aktiva' },
        { id: 'z2', korrektesLabel: 'Passiva' },  // nur Legacy
      ],
    }
    const out = normalisiereDragDropBild(mix)
    expect(out.labels[0].id).toBe('abc')
    expect(out.labels[1].id).toBe(stabilId('f1', 'Passiva', 1))
    expect(out.zielzonen[0].korrekteLabels).toEqual(['Aktiva'])  // bevorzugt korrekteLabels
    expect(out.zielzonen[1].korrekteLabels).toEqual(['Passiva']) // Fallback auf korrektesLabel
  })

  it('leere Zone: korrekteLabels = []', () => {
    const f = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: [],
      zielzonen: [{ id: 'z1' }],  // weder korrekteLabels noch korrektesLabel
    }
    const out = normalisiereDragDropBild(f)
    expect(out.zielzonen[0].korrekteLabels).toEqual([])
  })
})
```

- [ ] **Step 3: Test ausführen → FAIL**

```bash
cd ExamLab && npx vitest run src/utils/ueben/fragetypNormalizer.test.ts
```

Erwartet: FAIL — Funktion liefert noch nicht das erwartete Format.

### Task 6: normalisiereDragDropBild Implementation

**Files:**
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.ts`

- [ ] **Step 1: Aktuelle DragDrop-Normalizer-Stelle lesen**

```bash
sed -n '255,275p' ExamLab/src/utils/ueben/fragetypNormalizer.ts
```

- [ ] **Step 2: Funktion ergänzen / ersetzen**

In `ExamLab/src/utils/ueben/fragetypNormalizer.ts` (am ehemaligen Ort der bestehenden DnD-Normalizer-Funktion oder anhängen):

```ts
import { stabilId } from '../../../../packages/shared/src/util/stabilId'
import type { DragDropBildFrage, DragDropBildLabel, DragDropBildZielzone } from '../../../../packages/shared/src/types/fragen'

export function normalisiereDragDropBild(frage: any): DragDropBildFrage {
  const labels: DragDropBildLabel[] = (frage.labels ?? []).map((l: any, i: number) => {
    if (typeof l === 'string') {
      return { id: stabilId(frage.id, l, i), text: l }
    }
    if (l && typeof l === 'object' && typeof l.text === 'string') {
      return { id: l.id ?? stabilId(frage.id, l.text, i), text: l.text }
    }
    return { id: stabilId(frage.id, '', i), text: '' }
  })
  const zielzonen: DragDropBildZielzone[] = (frage.zielzonen ?? []).map((z: any) => ({
    ...z,
    korrekteLabels: Array.isArray(z.korrekteLabels) && z.korrekteLabels.length > 0
      ? z.korrekteLabels.map((s: string) => String(s))
      : z.korrektesLabel
        ? [String(z.korrektesLabel)]
        : [],
  }))
  return { ...frage, labels, zielzonen }
}
```

- [ ] **Step 3: Tests ausführen → 4/4 PASS**

```bash
cd ExamLab && npx vitest run src/utils/ueben/fragetypNormalizer.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/utils/ueben/fragetypNormalizer.ts ExamLab/src/utils/ueben/fragetypNormalizer.test.ts
git commit -m "Bundle J Phase 2: normalisiereDragDropBild — Frage-Normalizer mit stabilId"
```

---

## Phase 3 — Antwort-Normalizer

### Task 7: normalisiereDragDropAntwort Tests

**Files:**
- Create: `ExamLab/src/utils/dragdropAntwortMigration.test.ts`

- [ ] **Step 1: Test schreiben**

```ts
import { describe, expect, it } from 'vitest'
import { normalisiereDragDropAntwort } from './ueben/fragetypNormalizer'
import type { DragDropBildFrage } from '../../../packages/shared/src/types/fragen'

const frage: DragDropBildFrage = {
  id: 'f1',
  typ: 'dragdrop_bild',
  fragetext: 'Test',
  bildUrl: '',
  punkte: 4,
  zielzonen: [
    { id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'] },
    { id: 'z2', form: 'rechteck', punkte: [], korrekteLabels: ['Passiva'] },
  ],
  labels: [
    { id: 'lid-aktiva', text: 'Aktiva' },
    { id: 'lid-passiva', text: 'Passiva' },
  ],
} as any

describe('normalisiereDragDropAntwort', () => {
  it('Pre-Migration-Antwort: text-keyed → id-keyed', () => {
    const antwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 'Aktiva': 'z1', 'Passiva': 'z2' } }
    const out = normalisiereDragDropAntwort(antwort, frage)
    expect(out.zuordnungen).toEqual({ 'lid-aktiva': 'z1', 'lid-passiva': 'z2' })
  })

  it('Post-Migration-Antwort: id-keyed bleibt unverändert', () => {
    const antwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 'lid-aktiva': 'z1' } }
    const out = normalisiereDragDropAntwort(antwort, frage)
    expect(out.zuordnungen).toEqual({ 'lid-aktiva': 'z1' })
  })

  it('case-insensitive Text-Match', () => {
    const antwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 'aktiva': 'z1' } }
    const out = normalisiereDragDropAntwort(antwort, frage)
    expect(out.zuordnungen).toEqual({ 'lid-aktiva': 'z1' })
  })

  it('unbekannter Key (weder ID noch Text-Match): defensiv ignoriert', () => {
    const antwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 'Etwas Anderes': 'z1' } }
    const out = normalisiereDragDropAntwort(antwort, frage)
    expect(out.zuordnungen).toEqual({})
  })

  it('leere zuordnungen: leeres Output', () => {
    const antwort = { typ: 'dragdrop_bild' as const, zuordnungen: {} }
    const out = normalisiereDragDropAntwort(antwort, frage)
    expect(out.zuordnungen).toEqual({})
  })
})
```

- [ ] **Step 2: Test ausführen → FAIL** (Funktion existiert nicht)

```bash
cd ExamLab && npx vitest run src/utils/dragdropAntwortMigration.test.ts
```

### Task 8: normalisiereDragDropAntwort Implementation

**Files:**
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.ts`

- [ ] **Step 1: Funktion ergänzen**

```ts
type DragDropBildAntwort = { typ: 'dragdrop_bild'; zuordnungen: Record<string, string> }

export function normalisiereDragDropAntwort(
  antwort: DragDropBildAntwort,
  frage: DragDropBildFrage,
): DragDropBildAntwort {
  const labelById = new Map(frage.labels.map(l => [l.id, l]))
  const labelByText = new Map<string, string>()
  for (const l of frage.labels) {
    const k = (l.text ?? '').trim().toLowerCase()
    if (k && !labelByText.has(k)) labelByText.set(k, l.id)
  }
  const out: Record<string, string> = {}
  for (const [key, zoneId] of Object.entries(antwort.zuordnungen ?? {})) {
    if (labelById.has(key)) {
      out[key] = zoneId
    } else {
      const id = labelByText.get(key.trim().toLowerCase())
      if (id) out[id] = zoneId
    }
  }
  return { ...antwort, zuordnungen: out }
}
```

- [ ] **Step 2: Tests ausführen → 5/5 PASS**

```bash
cd ExamLab && npx vitest run src/utils/dragdropAntwortMigration.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/utils/ueben/fragetypNormalizer.ts ExamLab/src/utils/dragdropAntwortMigration.test.ts
git commit -m "Bundle J Phase 3: normalisiereDragDropAntwort — Pre-Migration-Text-Keys auf ID-Keys"
```

---

## Phase 4 — Apps-Script Backend

### Task 9: LOESUNGS_FELDER_ + S122-Type-Guard

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 2200-2700)

- [ ] **Step 1: Stelle finden**

```bash
grep -n "subFelder.*korrektesLabel" ExamLab/apps-script-code.js
```

- [ ] **Step 2: LOESUNGS_FELDER_-Eintrag erweitern**

Suche `{ feld: 'zielzonen', subFelder: ['korrektesLabel', 'erklaerung'] }` und ersetze durch:

```js
{ feld: 'zielzonen', subFelder: ['korrektesLabel', 'korrekteLabels', 'erklaerung'] },
```

- [ ] **Step 3: S122-Type-Guard verifizieren oder einfügen**

Stelle suchen:

```bash
grep -n "f\.labels\s*=\s*f\.labels\.map\|frage\.labels\.map\|labels\.map.*Object.assign" ExamLab/apps-script-code.js
```

**Fall A — Stelle vorhanden:** Type-Guard prüfen und ggf. ergänzen:

```js
f.labels = (f.labels || []).map(function(l) {
  if (typeof l !== 'object' || l === null) return l;  // string durchreichen — S122
  var c = Object.assign({}, l);
  delete c.zoneId;  // legacy field, falls vorhanden
  return c;
});
```

**Fall B — Stelle existiert noch nicht:** In `bereinigeFrageFuerSuS_` (nach `LOESUNGS_FELDER_.arrays`-Loop, vor `return f`) NEU einfügen — Pool-Items bekommen sonst keinerlei Bereinigung, IDs bleiben lesbar (was OK ist), aber S122-Heterogen-Mix-Bug wäre eine Falle bei künftigen Änderungen:

```js
if (f.typ === 'dragdrop_bild' && Array.isArray(f.labels)) {
  f.labels = f.labels.map(function(l) {
    if (typeof l !== 'object' || l === null) return l;
    return Object.assign({}, l);  // shallow copy, kein delete
  });
}
```

**Wichtig:** Test in Task 10 (`testDragDropMultiZonePrivacy_`) verlangt `typeof bereinigtPre.labels[0] === 'string'`. Dieser Assert läuft nur grün, wenn der Type-Guard tatsächlich existiert — entweder bestehend (Fall A) oder neu eingefügt (Fall B). Test ist dann nicht zirkulär.

Falls `f` ein Deep-Copy via `JSON.parse(JSON.stringify(...))` ist (üblich), ist die `Object.assign`-Schleife strenggenommen Verschwendung — der Type-Guard schützt aber gegen künftige Refactors. Defensive Disziplin.

- [ ] **Step 4: Commit ohne Tests (Tests folgen in Task 10)**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle J Phase 4.1: LOESUNGS_FELDER_ erweitert um korrekteLabels + S122-Type-Guard"
```

### Task 10: testDragDropMultiZonePrivacy_ Test-Shim

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Test-Shim ergänzen**

Am Ende der Test-Shim-Sektion (analog `testC9Privacy_`) hinzufügen:

```js
function testDragDropMultiZonePrivacy_() {
  function assert_(cond, msg) { if (!cond) throw new Error('FAIL: ' + msg); }
  var fragePost = {
    typ: 'dragdrop_bild',
    zielzonen: [
      { id: 'z1', korrekteLabels: ['Aktiva'], erklaerung: 'foo' },
      { id: 'z2', korrekteLabels: ['Passiva'] },
    ],
    labels: [{ id: 'lid-1', text: 'Aktiva' }, { id: 'lid-2', text: 'Passiva' }],
  };
  var bereinigtPost = bereinigeFrageFuerSuS_(fragePost);
  assert_(!bereinigtPost.zielzonen[0].korrekteLabels, 'korrekteLabels entfernt (post-migration)');
  assert_(!bereinigtPost.zielzonen[0].erklaerung, 'erklaerung entfernt im Prüfen-Modus');
  assert_(bereinigtPost.labels.length === 2, 'labels bleiben (Text wird angezeigt)');
  assert_(bereinigtPost.labels[0].text === 'Aktiva', 'Text bleibt');
  assert_(bereinigtPost.labels[0].id === 'lid-1', 'ID bleibt');

  var fragePre = {
    typ: 'dragdrop_bild',
    zielzonen: [
      { id: 'z1', korrektesLabel: 'Aktiva', erklaerung: 'foo' },
    ],
    labels: ['Aktiva', 'Passiva'],  // string[]
  };
  var bereinigtPre = bereinigeFrageFuerSuS_(fragePre);
  assert_(!bereinigtPre.zielzonen[0].korrektesLabel, 'Legacy korrektesLabel entfernt');
  assert_(typeof bereinigtPre.labels[0] === 'string', 'Legacy string-labels durchgereicht (S122-Guard)');

  var frageMix = {
    typ: 'dragdrop_bild',
    zielzonen: [
      { id: 'z1', korrekteLabels: ['Aktiva'], korrektesLabel: 'Aktiva', erklaerung: 'foo' },
    ],
    labels: [{ id: 'a', text: 'Aktiva' }, 'Passiva'],  // gemischt
  };
  var bereinigtMix = bereinigeFrageFuerSuS_(frageMix);
  assert_(!bereinigtMix.zielzonen[0].korrekteLabels, 'beide Felder entfernt (mix)');
  assert_(!bereinigtMix.zielzonen[0].korrektesLabel, 'beide Felder entfernt (mix)');
  assert_(bereinigtMix.labels.length === 2, 'labels bleiben in mix');
  return 'OK';
}

function testDragDropMultiZonePrivacy() {  // public wrapper für GAS-Editor
  return testDragDropMultiZonePrivacy_();
}
```

- [ ] **Step 2: Apps-Script-Datei TypeScript-frei prüfen** (Apps-Script ist V8 ohne TS-Build)

- [ ] **Step 3: User-Task: GAS-Editor Smoke-Test**

In HANDOFF.md ergänzen:

```markdown
- [ ] User-Task: Apps-Script Editor öffnen → `testDragDropMultiZonePrivacy` ausführen → erwartet `OK`
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js ExamLab/HANDOFF.md
git commit -m "Bundle J Phase 4.2: testDragDropMultiZonePrivacy Test-Shim für Backend-Bereinigung"
```

### Task 11: Apps-Script-Korrektur-Spiegel

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 2668-2672)

- [ ] **Step 1: Stelle finden**

```bash
sed -n '2660,2680p' ExamLab/apps-script-code.js
```

- [ ] **Step 2: Backend-Korrektur prüfen**

Wenn Apps-Script eine eigene DnD-Korrektur-Funktion hat, mit Multi-Label-Match anpassen. Falls die Korrektur reines Frontend-Recht ist (Apps-Script speichert nur Antworten), keine Änderung nötig — als Kommentar dokumentieren:

```js
// Bundle J: DragDrop-Korrektur läuft nur im Frontend (autoKorrektur.ts).
// Backend speichert nur die ID-keyed Antworten (zuordnungen). Migration des
// Antwort-Schemas durch normalisiereDragDropAntwort am Read-Eintrittspunkt.
```

- [ ] **Step 3: Demo-Frage `einr-dd-kontinente` aktualisieren**

```bash
grep -n "einr-dd-kontinente" ExamLab/apps-script-code.js
```

Demo-Frage `labels: ['Nordamerika',...]` (string[]) bleibt funktional dank Frontend-Normalizer — in einem Kommentar markieren dass sie im Cleanup-Bundle aufs neue Format gehoben wird.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle J Phase 4.3: Apps-Script-Korrektur-Spiegel + Demo-Frage-Markierung"
```

### Task 12: User-Deploy Apps-Script

- [ ] **Step 1: User-Task in HANDOFF.md**

```markdown
## Bundle J Phase 4 — User-Tasks

- [ ] Apps-Script Bereitstellung erstellen (neue Version mit korrekteLabels in LOESUNGS_FELDER_)
- [ ] Bereitstellungs-URL notieren
- [ ] testDragDropMultiZonePrivacy im GAS-Editor ausführen → `OK`
```

- [ ] **Step 2: Commit (Wartezustand für Deploy)**

```bash
git add ExamLab/HANDOFF.md
git commit --allow-empty -m "Bundle J Phase 4.4: User-Task Apps-Script-Deploy markiert"
```

---

## Phase 5 — Korrektur-Pfade Update (alle 15 Pfade — 14 aus Spec 5.2.1 + IDB-Restore aus 5.2.2)

### Task 13: dragdropBildUtils — gruppiereStacks-Helper

**Files:**
- Modify: `ExamLab/src/utils/dragdropBildUtils.ts`
- Modify: `ExamLab/src/utils/dragdropBildUtils.test.ts` (oder neu)

- [ ] **Step 1: Test schreiben**

```ts
import { describe, expect, it } from 'vitest'
import { gruppiereStacks, naechsteFreieLabelId } from './dragdropBildUtils'

describe('gruppiereStacks', () => {
  it('gruppiert Pool-Tokens nach Text mit Counter und Resten', () => {
    const labels = [
      { id: 'a', text: 'Aktiva' },
      { id: 'b', text: 'Aktiva' },
      { id: 'c', text: 'Passiva' },
    ]
    const zuordnungen = { 'a': 'z1' }  // 'a' platziert
    const stacks = gruppiereStacks(labels, zuordnungen)
    expect(stacks).toEqual([
      { text: 'Aktiva', anzahl: 1, freieIds: ['b'] },
      { text: 'Passiva', anzahl: 1, freieIds: ['c'] },
    ])
  })

  it('Stacks mit anzahl=0 werden gefiltert', () => {
    const labels = [{ id: 'a', text: 'Aktiva' }]
    const zuordnungen = { 'a': 'z1' }
    expect(gruppiereStacks(labels, zuordnungen)).toEqual([])
  })
})

describe('naechsteFreieLabelId', () => {
  it('liefert kleinsten Index unter freien IDs', () => {
    const labels = [
      { id: 'a', text: 'Aktiva' },
      { id: 'b', text: 'Aktiva' },
      { id: 'c', text: 'Aktiva' },
    ]
    expect(naechsteFreieLabelId(labels, 'Aktiva', { 'a': 'z1' })).toBe('b')
    expect(naechsteFreieLabelId(labels, 'Aktiva', { 'a': 'z1', 'b': 'z2' })).toBe('c')
    expect(naechsteFreieLabelId(labels, 'Aktiva', { 'a': 'z1', 'b': 'z2', 'c': 'z3' })).toBeNull()
  })
})
```

- [ ] **Step 2: Test ausführen → FAIL**

- [ ] **Step 3: Helper implementieren**

In `ExamLab/src/utils/dragdropBildUtils.ts`:

```ts
import type { DragDropBildLabel } from '../../../packages/shared/src/types/fragen'

export interface DragDropBildStack {
  text: string
  anzahl: number
  freieIds: string[]
}

/**
 * Gruppiert Pool-Tokens nach Text und filtert platzierte heraus.
 * Output ist die SuS-Pool-Anzeige (Stack mit Counter).
 */
export function gruppiereStacks(
  labels: DragDropBildLabel[],
  zuordnungen: Record<string, string>,
): DragDropBildStack[] {
  const map = new Map<string, string[]>()
  for (const l of labels) {
    if (zuordnungen[l.id]) continue  // bereits platziert → nicht im Stack
    if (!map.has(l.text)) map.set(l.text, [])
    map.get(l.text)!.push(l.id)
  }
  return [...map.entries()]
    .map(([text, freieIds]) => ({ text, anzahl: freieIds.length, freieIds }))
    .filter(s => s.anzahl > 0)
}

/**
 * Deterministische ID-Auswahl: kleinster Index in `labels` mit gegebenem Text,
 * dessen ID nicht in `zuordnungen` vorkommt.
 */
export function naechsteFreieLabelId(
  labels: DragDropBildLabel[],
  text: string,
  zuordnungen: Record<string, string>,
): string | null {
  for (const l of labels) {
    if (l.text === text && !zuordnungen[l.id]) return l.id
  }
  return null
}
```

- [ ] **Step 4: Tests ausführen → 4/4 PASS**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/dragdropBildUtils.ts ExamLab/src/utils/dragdropBildUtils.test.ts
git commit -m "Bundle J Phase 5.1: gruppiereStacks + naechsteFreieLabelId Helper für SuS-Pool"
```

### Task 14: Pfad #3 — autoKorrektur.ts (Auto-Korrektur)

**Files:**
- Modify: `ExamLab/src/utils/autoKorrektur.ts` (~Z. 485-510)
- Modify: `ExamLab/src/utils/autoKorrektur.test.ts`

- [ ] **Step 1: Tests schreiben**

In `autoKorrektur.test.ts` neue Tests anhängen:

```ts
describe('korrigiereDragDropBild — Bundle J Multi-Zone + Multi-Label', () => {
  it('Multi-Zone: 3 Aktiva-Zonen, 3 Aktiva-Tokens, alle korrekt unabhängig der Reihenfolge', () => {
    const f: DragDropBildFrage = {
      id: 'f1',
      typ: 'dragdrop_bild',
      fragetext: '',
      bildUrl: '',
      punkte: 3,
      zielzonen: [
        { id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'] },
        { id: 'z2', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'] },
        { id: 'z3', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'] },
      ],
      labels: [
        { id: 'L1', text: 'Aktiva' },
        { id: 'L2', text: 'Aktiva' },
        { id: 'L3', text: 'Aktiva' },
      ],
    } as any
    const a = { typ: 'dragdrop_bild' as const, zuordnungen: { 'L1': 'z2', 'L2': 'z3', 'L3': 'z1' } }
    const r = korrigiereDragDropBild(f, a)
    expect(r.erreichtePunkte).toBe(3)
  })

  it('Multi-Label: Zone akzeptiert mehrere Synonyme', () => {
    const f: DragDropBildFrage = {
      id: 'f2',
      typ: 'dragdrop_bild',
      fragetext: '',
      bildUrl: '',
      punkte: 1,
      zielzonen: [{ id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['Marketing-Mix', '4P'] }],
      labels: [{ id: 'L1', text: '4P' }],
    } as any
    const a = { typ: 'dragdrop_bild' as const, zuordnungen: { 'L1': 'z1' } }
    expect(korrigiereDragDropBild(f, a).erreichtePunkte).toBe(1)
  })

  it('Distraktor in Zone (kein Match) → falsch', () => {
    const f: DragDropBildFrage = {
      id: 'f3',
      typ: 'dragdrop_bild',
      fragetext: '',
      bildUrl: '',
      punkte: 1,
      zielzonen: [{ id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'] }],
      labels: [{ id: 'L1', text: 'Saldo' }],
    } as any
    const a = { typ: 'dragdrop_bild' as const, zuordnungen: { 'L1': 'z1' } }
    expect(korrigiereDragDropBild(f, a).erreichtePunkte).toBe(0)
  })

  it('Pre-Migration-Frage (string[]-Pool, korrektesLabel): Normalizer macht es kompatibel', () => {
    const fAlt: any = {
      id: 'f4',
      typ: 'dragdrop_bild',
      fragetext: '',
      bildUrl: '',
      punkte: 1,
      zielzonen: [{ id: 'z1', korrektesLabel: 'Aktiva' }],
      labels: ['Aktiva'],
    }
    const fNorm = normalisiereDragDropBild(fAlt)
    const aAlt = { typ: 'dragdrop_bild' as const, zuordnungen: { 'Aktiva': 'z1' } }
    const aNorm = normalisiereDragDropAntwort(aAlt, fNorm)
    expect(korrigiereDragDropBild(fNorm, aNorm).erreichtePunkte).toBe(1)
  })
})
```

- [ ] **Step 2: Tests ausführen → FAIL**

- [ ] **Step 3: Korrektur-Funktion ersetzen**

In `ExamLab/src/utils/autoKorrektur.ts` `korrigiereDragDropBild` ersetzen:

```ts
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from './ueben/fragetypNormalizer'

function korrigiereDragDropBild(
  frageRaw: DragDropBildFrage,
  antwortRaw: Extract<Antwort, { typ: 'dragdrop_bild' }>,
): KorrekturErgebnis {
  const frage = normalisiereDragDropBild(frageRaw)
  const antwort = normalisiereDragDropAntwort(antwortRaw, frage)
  const labelMap = new Map(frage.labels.map(l => [l.id, l]))
  const punkteProZone = frage.punkte / Math.max(1, frage.zielzonen.length)
  const details: KorrekturDetail[] = []

  for (const zone of frage.zielzonen) {
    const platzierteTexte: string[] = Object.entries(antwort.zuordnungen)
      .filter(([, zid]) => zid === zone.id)
      .map(([lid]) => labelMap.get(lid)?.text ?? '')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const sollSet = new Set(zone.korrekteLabels.map(s => s.trim().toLowerCase()))
    const korrekt = platzierteTexte.some(t => sollSet.has(t.toLowerCase()))
    const anzeigeZone = zone.korrekteLabels.join(' / ')

    details.push({
      bezeichnung: `Zone: ${anzeigeZone}`,
      korrekt,
      erreicht: korrekt ? punkteProZone : 0,
      max: punkteProZone,
      kommentar: korrekt
        ? undefined
        : platzierteTexte.length
          ? `Zugeordnet: ${platzierteTexte.join(', ')}`
          : 'Nicht zugeordnet',
    })
  }
  const erreich = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(erreich * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}
```

- [ ] **Step 4: Tests ausführen → alle PASS (inkl. neue + Bestand)**

```bash
cd ExamLab && npx vitest run src/utils/autoKorrektur.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/autoKorrektur.ts ExamLab/src/utils/autoKorrektur.test.ts
git commit -m "Bundle J Phase 5.2 (Pfad 3): autoKorrektur.korrigiereDragDropBild Multi-Zone+Multi-Label"
```

### Task 15: Pfad #4 — Üben-Korrektur (`utils/ueben/korrektur.ts`)

**Files:**
- Modify: `ExamLab/src/utils/ueben/korrektur.ts` (~Z. 226-230)

- [ ] **Step 1: Stelle inspizieren + Aufruf-Pattern verifizieren**

```bash
sed -n '215,250p' ExamLab/src/utils/ueben/korrektur.ts
grep -n "korrigiereDragDropBild\|dragdrop_bild" ExamLab/src/utils/ueben/korrektur.ts
```

Entscheidungs-Tabelle nach Output:

| Befund | Aktion |
|---|---|
| `korrektur.ts` ruft `autoKorrektur.korrigiereDragDropBild` direkt → bereits durch Task 14 abgedeckt | Step 2 ist No-Op. Step 3 verifiziert via Test. |
| `korrektur.ts` hat **eigene** Korrektur-Logik mit `frage.zielzonen[*].korrektesLabel`-Lookup | Step 2 spiegelt Pattern aus Task 14 (Frage- + Antwort-Normalizer + Multi-Label-Match-Schleife) |

- [ ] **Step 2: Falls eigene Logik vorhanden — Pattern aus Task 14 spiegeln**

```ts
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from './fragetypNormalizer'

// Im DnD-Branch:
const frage = normalisiereDragDropBild(frageRaw)
const antwort = normalisiereDragDropAntwort(antwortRaw, frage)
const labelMap = new Map(frage.labels.map(l => [l.id, l]))
for (const zone of frage.zielzonen) {
  const platzierteTexte = Object.entries(antwort.zuordnungen)
    .filter(([, zid]) => zid === zone.id)
    .map(([lid]) => (labelMap.get(lid)?.text ?? '').trim())
    .filter(Boolean)
  const sollSet = new Set(zone.korrekteLabels.map(s => s.trim().toLowerCase()))
  const korrekt = platzierteTexte.some(t => sollSet.has(t.toLowerCase()))
  // … restliche Üben-spezifische Logik (Erklärung-Anzeige etc.)
}
```

- [ ] **Step 3: Bestehende Tests ausführen** (vor + nach Änderung gleich grün)

```bash
cd ExamLab && npx vitest run src/utils/ueben/
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/utils/ueben/korrektur.ts
git commit -m "Bundle J Phase 5.3 (Pfad 4): Üben-Korrektur via Normalizer + Multi-Label" || \
  git commit --allow-empty -m "Bundle J Phase 5.3 (Pfad 4): Üben-Korrektur No-Op (delegiert an autoKorrektur Task 14)"
```

### Task 16: Pfad #5 — antwortStatus

**Files:**
- Modify: `ExamLab/src/utils/antwortStatus.ts` (~Z. 142)

- [ ] **Step 1: Stelle finden**

```bash
grep -n "dragdrop_bild" ExamLab/src/utils/antwortStatus.ts
```

- [ ] **Step 2: Normalizer-Aufruf einbauen — Frage UND Antwort**

```ts
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from './ueben/fragetypNormalizer'

// In istDnDBildBeantwortet (oder analog):
function istDnDBildBeantwortet(frageRaw: DragDropBildFrage, antwortRaw: any): boolean {
  if (antwortRaw?.typ !== 'dragdrop_bild') return false
  const frage = normalisiereDragDropBild(frageRaw)
  const antwort = normalisiereDragDropAntwort(antwortRaw, frage)
  return Object.keys(antwort.zuordnungen ?? {}).length > 0
}
```

**Begründung Antwort-Normalizer:** Spec Sektion 5.2.2 nennt Pfad 5 explizit als Aufruf-Stelle. Heute reicht die Key-Anzahl für Detection — wenn aber später jemand `labelMap.get(lid)?.text`-Lookup ergänzt (z.B. „Hat SuS in Zone X etwas?"), crasht es bei Pre-Migration-Antwort silent. Defensive Disziplin gegen künftige Regression.

- [ ] **Step 3: Tests ausführen** (vorhandene Tests in `antwortStatus.test.ts`, falls existent)

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/utils/antwortStatus.ts
git commit -m "Bundle J Phase 5.4 (Pfad 5): antwortStatus.istBeantwortet via Frage+Antwort-Normalizer"
```

### Task 17: Pfad #6 — KorrekturFrageVollansicht

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` (~Z. 535)

- [ ] **Step 1: Stelle finden**

```bash
grep -n "dragdrop_bild\|korrektesLabel\|frage.labels" ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx
```

- [ ] **Step 2: Normalizer-Aufruf**

Im dragdrop_bild-Branch (Switch oder if):

```tsx
const dndFrage = useMemo(
  () => frage.typ === 'dragdrop_bild' ? normalisiereDragDropBild(frage) : null,
  [frage.id, frage.typ],
)
const dndAntwort = useMemo(
  () => dndFrage && antwort?.typ === 'dragdrop_bild' ? normalisiereDragDropAntwort(antwort, dndFrage) : null,
  [dndFrage, antwort],
)

// dndFrage und dndAntwort statt frage/antwort verwenden im DnD-Render
```

Multi-Label-Anzeige für Soll: `dndFrage.zielzonen[i].korrekteLabels.join(' oder ')`.

- [ ] **Step 3: Browser-Smoke-Test (manuell beim User später)**

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx
git commit -m "Bundle J Phase 5.5 (Pfad 6): KorrekturFrageVollansicht via Normalizer"
```

### Task 18: Pfad #7 — DruckAnsicht

**Files:**
- Modify: `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` (~Z. 734)

- [ ] **Step 1: Normalizer-Aufruf** analog Task 17.

- [ ] **Step 2: Multi-Label-Anzeige** in Druck-Layout (`zone.korrekteLabels.join(' / ')`).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx
git commit -m "Bundle J Phase 5.6 (Pfad 7): DruckAnsicht via Normalizer + Multi-Label"
```

### Task 18b: Pfad #15 — IDB-Restore für SuS-Antworten

**Files:**
- Modify: `ExamLab/src/services/autoSave.ts` ODER `ExamLab/src/store/pruefungStore.ts` (je nach Subject-Befund — siehe Step 1)

**Begründung (Spec Risiko #10):** Persistierte SuS-Antworten in IndexedDB (`pruefung-backup.antworten`-Store) sind Pre-Migration text-keyed (`{ 'Aktiva': 'z1' }`). Nach Frontend-Deploy lesen Korrektur und Renderer den Schlüssel als wäre es eine `labelId` → orphaned. Restore-Eintrittspunkt MUSS Antwort-Normalizer aufrufen. Spec Sektion 5.2.2 nennt diese Stelle ausdrücklich.

- [ ] **Step 1: Subject finden — wo wandert IDB-Antwort in State zurück?**

```bash
# Wer ruft die Restore-Funktion?
grep -rn "loadFromIndexedDB\|restoreFromIndexedDB\|getAntworten" ExamLab/src/
# Antworten-Property-Setter im Store?
grep -rn "setAntworten\|antworten:" ExamLab/src/store/
```

Entscheidungs-Tabelle:

| Befund Step 1 | Subject |
|---|---|
| `loadFromIndexedDB` hat aktive Caller, Caller geben Frage-Kontext mit | Caller-Pattern (siehe Step 2 Variante B) |
| `loadFromIndexedDB` hat keine Caller (potenziell tot, S129-Lehre) | Store-Restore-Pfad direkt (e.g. `pruefungStore.restoreFromBackup` o.ä.) |
| Restore läuft über `clearIndexedDB`-Pattern (S149-Vorbild) — separate Funktion | Diese Stelle |

⚠ Wichtig: Falls `loadFromIndexedDB` tot ist (S129 „tote Code-Pfade") **NICHT** dort einbauen — das wäre ein Fix in totem Pfad. Stattdessen die echte aktive Restore-Stelle finden.

- [ ] **Step 2: Antwort-Normalizer am echten Restore-Pfad einbauen**

**Variante A — In `loadFromIndexedDB` direkt** (nur falls Funktion lebt UND Frage-Liste verfügbar):

```ts
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from '../utils/ueben/fragetypNormalizer'

// Signatur erweitert um aktuelleFragen:
export async function loadFromIndexedDB(pruefungId: string, aktuelleFragen: Frage[]) {
  const antworten = await idbStore.get(pruefungId)
  for (const [fid, antwort] of Object.entries(antworten ?? {})) {
    if (antwort?.typ !== 'dragdrop_bild') continue
    const frage = aktuelleFragen.find(f => f.id === fid)
    if (!frage || frage.typ !== 'dragdrop_bild') continue
    const frageNorm = normalisiereDragDropBild(frage)
    antworten[fid] = normalisiereDragDropAntwort(antwort, frageNorm)
  }
  return antworten
}
```

**Variante B — Im Caller** (üblicherer Fall, wenn `loadFromIndexedDB` nur `pruefungId` kennt):

```ts
// In pruefungStore.restoreFromBackup (oder wer-auch-immer der Caller ist):
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from '../../utils/ueben/fragetypNormalizer'

const antworten = await loadFromIndexedDB(pruefungId)
const fragen = get().fragen  // aus Zustand
for (const [fid, antwort] of Object.entries(antworten)) {
  if (antwort?.typ === 'dragdrop_bild') {
    const f = fragen.find(x => x.id === fid)
    if (f && f.typ === 'dragdrop_bild') {
      antworten[fid] = normalisiereDragDropAntwort(antwort, normalisiereDragDropBild(f))
    }
  }
}
set({ antworten })
```

Welche Variante? **Wahrscheinlich B**, weil `loadFromIndexedDB` typischerweise keine Frage-Liste kennt (separation-of-concerns: Storage-Service kennt nur Bytes). Step 1 entscheidet.

**Vorbild S149:** `clearIndexedDB` wurde dort um `tx.oncomplete`-await ergänzt — gleiche Datei, ähnliches Pattern. Lohnt sich kurz `git log -p ExamLab/src/services/autoSave.ts` zu lesen für Code-Stil.

- [ ] **Step 3: Test ergänzen** in `dragdropAntwortMigration.test.ts`:

```ts
it('IDB-Restore mappt Pre-Migration-text-keyed zuordnungen auf id-keyed', () => {
  const idbAntwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 'Aktiva': 'z1' } }
  const aktuelleFrage: any = {
    id: 'f1', typ: 'dragdrop_bild',
    zielzonen: [{ id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'] }],
    labels: [{ id: 'sid-aktiva', text: 'Aktiva' }],
  }
  const out = normalisiereDragDropAntwort(idbAntwort, aktuelleFrage)
  expect(out.zuordnungen).toEqual({ 'sid-aktiva': 'z1' })
})
```

(Test prüft Normalizer-Verhalten, nicht IDB-Glue — Caller-Test wäre Integration und passt zu E2E.)

- [ ] **Step 4: Tests ausführen → PASS**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/services/autoSave.ts ExamLab/src/store/pruefungStore.ts ExamLab/src/utils/dragdropAntwortMigration.test.ts
git commit -m "Bundle J Phase 5.6b (Pfad 15): IDB-Restore via Antwort-Normalizer

Behebt Spec Risiko #10: Pre-Migration text-keyed SuS-Antworten in IndexedDB
würden nach Frontend-Deploy orphan, weil Korrektur/Renderer mit ID-Keys arbeiten.
Restore-Eintrittspunkt mappt jetzt am Lese-Zeitpunkt." || \
git commit --allow-empty -m "Bundle J Phase 5.6b: IDB-Restore — keine Änderung nötig (Normalizer-Aufruf bereits in Pfad 8 uebungsStore)"
```

- [ ] **Step 3: Test ergänzen** in `dragdropAntwortMigration.test.ts` (oder neu `autoSave.test.ts`):

```ts
it('IDB-Restore mappt Pre-Migration-text-keyed zuordnungen auf id-keyed', () => {
  const idbAntwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 'Aktiva': 'z1' } }
  const aktuelleFrage: any = {
    id: 'f1', typ: 'dragdrop_bild',
    zielzonen: [{ id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['Aktiva'] }],
    labels: [{ id: 'sid-aktiva', text: 'Aktiva' }],
  }
  const out = normalisiereDragDropAntwort(idbAntwort, aktuelleFrage)
  expect(out.zuordnungen).toEqual({ 'sid-aktiva': 'z1' })
})
```

- [ ] **Step 4: Tests ausführen → PASS**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/services/autoSave.ts ExamLab/src/utils/dragdropAntwortMigration.test.ts
git commit -m "Bundle J Phase 5.6b (Pfad 15): autoSave-IDB-Restore via Antwort-Normalizer

Behebt Spec Risiko #10: Pre-Migration text-keyed SuS-Antworten in IndexedDB
würden nach Frontend-Deploy orphan, weil Korrektur/Renderer mit ID-Keys arbeiten.
Restore-Eintrittspunkt mappt jetzt am Lese-Zeitpunkt."
```

### Task 19: Pfad #8 — uebungsStore.mergeById

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts` (~Z. 65)

- [ ] **Step 1: Stelle + Caller finden**

```bash
sed -n '55,85p' ExamLab/src/store/ueben/uebungsStore.ts
grep -n "mergeById\|labels:" ExamLab/src/store/ueben/uebungsStore.ts
grep -rn "uebungsStore" ExamLab/src/ | grep -i "ladeFragen\|setFragen\|addFragen\|merge" | head -10
```

Erwartet: 1-2 Eintrittspunkte (z.B. `ladeFragen`, `setFragen`, `addToCache`). Diese sind die Stellen die normalisieren müssen.

- [ ] **Step 2: Caller-Update — Normalizer vor Eintritt in Store**

`mergeById(merged.labels, slice.labels)` setzt voraus dass beide Seiten `DragDropBildLabel[]` mit `id` sind. Vor Merge MUSS jede DnD-Frage durch `normalisiereDragDropBild` laufen — am Eintrittspunkt der Store-Action:

```ts
import { normalisiereDragDropBild } from '../../utils/ueben/fragetypNormalizer'

// In jedem Eintrittspunkt der Fragen reinholt (aus Schritt 1 Output):
const normalisierteFragen = neueFragen.map(f =>
  f.typ === 'dragdrop_bild' ? normalisiereDragDropBild(f) : f
)
// dann normalisierteFragen weiter in mergeById / setFragen
```

- [ ] **Step 3: Tests ausführen** (vorhandene `uebungsStore.test.ts`)

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/store/ueben/uebungsStore.ts
git commit -m "Bundle J Phase 5.7 (Pfad 8): uebungsStore normalisiert DnD-Fragen vor Merge"
```

---

## Phase 6 — Pool-Konverter

### Task 20: poolConverter filter statt find

**Files:**
- Modify: `ExamLab/src/utils/poolConverter.ts` (Z. 550-580)
- Modify: `ExamLab/src/utils/poolConverter.test.ts`

- [ ] **Step 1: Test schreiben**

In `poolConverter.test.ts` ergänzen:

```ts
describe('Pool-Konverter — DragDrop-Bild Multi-Label (Bundle J)', () => {
  it('alle Pool-Labels mit zone-Match landen in zone.korrekteLabels', () => {
    const poolFrage = {
      typ: 'dragdrop_bild',
      q: 'Test',
      img: { src: 'test.svg' },
      zones: [{ id: 'z1', x: 0, y: 0, w: 50, h: 50 }],
      labels: [
        { id: 'l1', text: '4P', zone: 'z1' },
        { id: 'l2', text: 'Marketing-Mix', zone: 'z1' },
        { id: 'l3', text: 'Distraktor' },  // ohne zone
      ],
    }
    const out = konvertierePoolFrageZuPruefung(poolFrage as any, 'subject')
    expect(out.typ).toBe('dragdrop_bild')
    expect((out as any).zielzonen[0].korrekteLabels).toEqual(['4P', 'Marketing-Mix'])
    expect((out as any).labels).toHaveLength(3)
    expect((out as any).labels[0].id).toBe('l1')
    expect((out as any).labels[2].text).toBe('Distraktor')
  })
})
```

- [ ] **Step 2: Test ausführen → FAIL**

- [ ] **Step 3: Konverter-Code ersetzen**

In `poolConverter.ts` Z. 550-580 den case `'dragdrop_bild'` ersetzen durch:

```ts
case 'dragdrop_bild': {
  const poolLabels = poolFrage.labels ?? []
  const zielzonen = (poolFrage.zones ?? []).map(zone => ({
    id: zone.id || genId(),
    form: 'rechteck' as const,
    punkte: [
      { x: zone.x, y: zone.y },
      { x: zone.x + zone.w, y: zone.y },
      { x: zone.x + zone.w, y: zone.y + zone.h },
      { x: zone.x, y: zone.y + zone.h },
    ],
    korrekteLabels: poolLabels
      .filter(l => l.zone === zone.id)
      .map(l => (l.text ?? '').trim())
      .filter(t => t.length > 0),
  }))
  const labels = poolLabels.map(l => ({
    id: l.id ?? genId(),
    text: l.text ?? '',
  }))
  const bildUrl = poolFrage.img ? POOL_IMG_BASE_URL + poolFrage.img.src : ''
  const frage: DragDropBildFrage = {
    ...basis,
    typ: 'dragdrop_bild',
    fragetext: poolFrage.q,
    bildUrl,
    zielzonen,
    labels,
  }
  return frage
}
```

- [ ] **Step 4: Tests ausführen → PASS**

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/poolConverter.ts ExamLab/src/utils/poolConverter.test.ts
git commit -m "Bundle J Phase 6 (Pfad 9): poolConverter filter statt find — bilder-in-pools.md Regel 5 erfüllt"
```

---

## Phase 7 — SuS-Renderer (Stacks)

### Task 21: DragDropBildFrage Stack-UI Tests

**Files:**
- Create: `ExamLab/src/tests/DragDropBildFrageStacks.test.tsx`

- [ ] **Step 1: Tests schreiben**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DragDropBildFrage } from '../components/fragetypen/DragDropBildFrage'

const baseFrage = {
  id: 'f1',
  typ: 'dragdrop_bild' as const,
  fragetext: 'Test',
  bildUrl: '/test.svg',
  punkte: 3,
  zielzonen: [
    { id: 'z1', form: 'rechteck' as const, punkte: [{x:0,y:0},{x:50,y:0},{x:50,y:50},{x:0,y:50}], korrekteLabels: ['Soll'] },
    { id: 'z2', form: 'rechteck' as const, punkte: [{x:50,y:0},{x:100,y:0},{x:100,y:50},{x:50,y:50}], korrekteLabels: ['Soll'] },
    { id: 'z3', form: 'rechteck' as const, punkte: [{x:0,y:50},{x:50,y:50},{x:50,y:100},{x:0,y:100}], korrekteLabels: ['Soll'] },
  ],
  labels: [
    { id: 's1', text: 'Soll' },
    { id: 's2', text: 'Soll' },
    { id: 's3', text: 'Soll' },
    { id: 'h1', text: 'Haben' },
  ],
}

describe('DragDropBildFrage — Stack-UI', () => {
  it('Stack mit ≥2 Instanzen zeigt Counter', () => {
    render(<DragDropBildFrage frage={baseFrage as any} antwort={undefined} onAntwort={() => {}} />)
    expect(screen.getByText(/Soll/)).toBeInTheDocument()
    expect(screen.getByText(/×3/)).toBeInTheDocument()  // 3 Soll-Tokens
  })

  it('Stack mit 1 Instanz zeigt KEINEN Counter', () => {
    render(<DragDropBildFrage frage={baseFrage as any} antwort={undefined} onAntwort={() => {}} />)
    const habenChip = screen.getByText('Haben')
    expect(habenChip.parentElement?.textContent).not.toMatch(/×/)  // kein ×1
  })

  it('Tap auf Stack platziert kleinste freie ID; Counter dekrementiert', () => {
    let captured: any = null
    render(<DragDropBildFrage frage={baseFrage as any} antwort={{typ:'dragdrop_bild', zuordnungen:{}} as any} onAntwort={(a) => { captured = a }} />)
    const sollChip = screen.getByTestId('pool-stack-Soll')
    fireEvent.click(sollChip)
    const zone1 = screen.getByTestId('zone-z1')
    fireEvent.click(zone1)
    expect(captured.zuordnungen).toEqual({ 's1': 'z1' })
  })

  it('Bei letzter Platzierung verschwindet Stack aus Pool', () => {
    const antwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 's1': 'z1', 's2': 'z2', 's3': 'z3' } }
    render(<DragDropBildFrage frage={baseFrage as any} antwort={antwort as any} onAntwort={() => {}} />)
    expect(screen.queryByTestId('pool-stack-Soll')).toBeNull()
    expect(screen.getByTestId('pool-stack-Haben')).toBeInTheDocument()
  })

  it('Token zurück in Pool: Counter inkrementiert', () => {
    let captured: any = null
    const antwort = { typ: 'dragdrop_bild' as const, zuordnungen: { 's1': 'z1', 's2': 'z2' } }
    render(<DragDropBildFrage frage={baseFrage as any} antwort={antwort as any} onAntwort={(a) => { captured = a }} />)
    // Stack 'Soll' zeigt jetzt ×1 (s3 noch frei)
    expect(screen.getByText(/×1/)).toBeInTheDocument()
    // Klick auf platzierten Token in Zone 1 → entfernt
    const platzierterChip = screen.getByTestId('platziert-s1')
    fireEvent.click(platzierterChip)
    // captured zuordnungen sollte 's1' nicht mehr enthalten
    expect(captured.zuordnungen.s1).toBeUndefined()
  })
})
```

- [ ] **Step 2: Test ausführen → FAIL**

```bash
cd ExamLab && npx vitest run src/tests/DragDropBildFrageStacks.test.tsx
```

### Task 22: DragDropBildFrage Component Implementation

**Files:**
- Modify: `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx`

- [ ] **Step 1: Aktuelle Component lesen**

- [ ] **Step 2: Component erweitern**

Wesentliche Änderungen:

```tsx
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from '../../utils/ueben/fragetypNormalizer'
import { gruppiereStacks, naechsteFreieLabelId } from '../../utils/dragdropBildUtils'

export function DragDropBildFrage({ frage: frageRaw, antwort: antwortRaw, onAntwort, modus }: Props) {
  const frage = useMemo(() => normalisiereDragDropBild(frageRaw), [frageRaw.id])
  const antwort = useMemo(
    () => antwortRaw?.typ === 'dragdrop_bild'
      ? normalisiereDragDropAntwort(antwortRaw, frage)
      : { typ: 'dragdrop_bild' as const, zuordnungen: {} },
    [antwortRaw, frage],
  )

  const stacks = useMemo(() => gruppiereStacks(frage.labels, antwort.zuordnungen), [frage.labels, antwort.zuordnungen])
  const labelMap = useMemo(() => new Map(frage.labels.map(l => [l.id, l])), [frage.labels])

  // Tap-to-Select Mechanik:
  const [ausgewaehlteLabelId, setAusgewaehlt] = useState<string | null>(null)

  const tapStack = (text: string) => {
    const id = naechsteFreieLabelId(frage.labels, text, antwort.zuordnungen)
    if (id) setAusgewaehlt(id)
  }
  const tapZone = (zoneId: string) => {
    if (!ausgewaehlteLabelId) return
    onAntwort({
      typ: 'dragdrop_bild',
      zuordnungen: { ...antwort.zuordnungen, [ausgewaehlteLabelId]: zoneId },
    })
    setAusgewaehlt(null)
  }
  const removeAusZone = (labelId: string) => {
    const neu = { ...antwort.zuordnungen }
    delete neu[labelId]
    onAntwort({ typ: 'dragdrop_bild', zuordnungen: neu })
  }

  return (
    <div>
      {/* Bild + Zonen-Overlay (bestehend) */}
      <div data-testid="zonen-container">
        {frage.zielzonen.map(z => {
          const platzierteIds = Object.entries(antwort.zuordnungen)
            .filter(([, zid]) => zid === z.id)
            .map(([lid]) => lid)
          return (
            <div key={z.id} data-testid={`zone-${z.id}`} onClick={() => tapZone(z.id)}>
              {platzierteIds.map(lid => (
                <span
                  key={lid}
                  data-testid={`platziert-${lid}`}
                  onClick={(e) => { e.stopPropagation(); removeAusZone(lid) }}
                >
                  {labelMap.get(lid)?.text}
                </span>
              ))}
            </div>
          )
        })}
      </div>
      {/* Pool mit Stacks */}
      <div data-testid="pool">
        {stacks.map(s => (
          <button
            key={s.text}
            data-testid={`pool-stack-${s.text}`}
            onClick={() => tapStack(s.text)}
            aria-pressed={s.freieIds.includes(ausgewaehlteLabelId ?? '')}
          >
            {s.text}{s.anzahl > 1 ? ` ×${s.anzahl}` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
```

(Zu beachten: bestehender Pool-Dedupe-Code aus Bundle H Phase 9.2 wird entfernt — `gruppiereStacks` ersetzt ihn.)

- [ ] **Step 3: Tests ausführen → 5/5 PASS**

```bash
cd ExamLab && npx vitest run src/tests/DragDropBildFrageStacks.test.tsx
```

- [ ] **Step 4: Bestehende DnD-Tests prüfen → keine Regression**

```bash
cd ExamLab && npx vitest run src/tests/DragDropBild
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/fragetypen/DragDropBildFrage.tsx ExamLab/src/tests/DragDropBildFrageStacks.test.tsx
git commit -m "Bundle J Phase 7 (Pfad 2): SuS-Renderer mit Stack-Counter + deterministischer ID-Auswahl"
```

---

## Phase 8 — LP-Editor

### Task 23: DragDropBildEditor Multi-Zone-Tests

**Files:**
- Create: `ExamLab/src/tests/DragDropBildEditorMultiZone.test.tsx`

- [ ] **Step 1: Tests schreiben** (Chip-Add/Remove, Pool-Duplikate, Konsistenz-Hinweise, Migrations-Adapter)

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DragDropBildEditor } from '../../../packages/shared/src/editor/typen/DragDropBildEditor'

describe('DragDropBildEditor — Bundle J Multi-Zone', () => {
  it('Chip-Add per Enter pro Zone', async () => {
    let frage: any = { id: 'f1', typ: 'dragdrop_bild', zielzonen: [{ id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: [] }], labels: [] }
    const onChange = vi.fn((f) => { frage = f })
    render(<DragDropBildEditor frage={frage} onChange={onChange} />)
    const input = screen.getByTestId('zone-z1-chip-input')
    await userEvent.type(input, 'Aktiva{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      zielzonen: [expect.objectContaining({ korrekteLabels: ['Aktiva'] })],
    }))
  })

  it('Pool-Duplikate erlaubt (kein Dedupe)', async () => {
    let frage: any = { id: 'f1', typ: 'dragdrop_bild', zielzonen: [], labels: [] }
    const onChange = vi.fn((f) => { frage = f })
    render(<DragDropBildEditor frage={frage} onChange={onChange} />)
    const poolInput = screen.getByTestId('pool-chip-input')
    await userEvent.type(poolInput, 'Aktiva{Enter}Aktiva{Enter}')
    expect(frage.labels).toHaveLength(2)
    expect(frage.labels[0].text).toBe('Aktiva')
    expect(frage.labels[1].text).toBe('Aktiva')
    expect(frage.labels[0].id).not.toBe(frage.labels[1].id)
  })

  it('Konsistenz-Hinweis: Zone akzeptiert Text, Pool hat 0 Treffer', () => {
    const frage: any = {
      id: 'f1', typ: 'dragdrop_bild',
      zielzonen: [{ id: 'z1', korrekteLabels: ['Soll'] }],
      labels: [{ id: 'a', text: 'Aktiva' }],
    }
    render(<DragDropBildEditor frage={frage} onChange={() => {}} />)
    expect(screen.getByText(/Zone 1 akzeptiert 'Soll', Pool hat 0/)).toBeInTheDocument()
  })

  it('Migrations-Adapter: alte Frage (string[]-Pool) wird auf Multi-Zone-Modell hochgezogen', () => {
    const altFrage: any = {
      id: 'f1', typ: 'dragdrop_bild',
      zielzonen: [{ id: 'z1', korrektesLabel: 'Aktiva' }],
      labels: ['Aktiva', 'Passiva'],
    }
    render(<DragDropBildEditor frage={altFrage} onChange={() => {}} />)
    // Editor zeigt Chip 'Aktiva' in Zone 1
    expect(screen.getByTestId('zone-z1-chip-Aktiva')).toBeInTheDocument()
    // Pool zeigt 2 Chips
    expect(screen.getAllByTestId(/^pool-chip-/)).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Test ausführen → FAIL**

### Task 24: DragDropBildEditor Implementation

**Files:**
- Modify: `packages/shared/src/editor/typen/DragDropBildEditor.tsx`

- [ ] **Step 1: Aktuellen Editor analysieren**

- [ ] **Step 2: Editor refactorn**

Kernänderungen:
1. **Migrations-Adapter beim Mount** — `useState`-Init normalisiert die Frage einmalig.
2. **Pro Zone Chip-Input** — eine Tag-Komponente (z.B. `react-tag-input`-style) statt Text-Input.
3. **Pool-Tag-Input** — gleiche Komponente, IDs werden beim Hinzufügen via `crypto.randomUUID().slice(0, 8)` generiert.
4. **DoppelteLabelDialog import + Aufruf entfernen.**
5. **Pool-Dedupe-Warnung entfernen.**
6. **Konsistenz-Hinweise** — `useMemo` über `labels` × `zielzonen`, rendert Hinweis-Liste unter Editor.

Skizze:

```tsx
import { useMemo, useState } from 'react'
import { normalisiereDragDropBild } from '../../../../ExamLab/src/utils/ueben/fragetypNormalizer'

export function DragDropBildEditor({ frage: frageRaw, onChange }: Props) {
  const [state, setState] = useState(() => normalisiereDragDropBild(frageRaw))

  const updateZone = (zoneId: string, korrekteLabels: string[]) => {
    const neu = { ...state, zielzonen: state.zielzonen.map(z => z.id === zoneId ? { ...z, korrekteLabels } : z) }
    setState(neu)
    onChange(neu)
  }
  const addPoolLabel = (text: string) => {
    const t = text.trim()
    if (!t) return
    const neu = { ...state, labels: [...state.labels, { id: crypto.randomUUID().slice(0, 8), text: t }] }
    setState(neu)
    onChange(neu)
  }
  const removePoolLabel = (id: string) => {
    const neu = { ...state, labels: state.labels.filter(l => l.id !== id) }
    setState(neu)
    onChange(neu)
  }

  const konsistenzHinweise = useMemo(() => {
    const zonenTexte = new Map<string, number>()  // text(lower) → Anzahl Zonen die es akzeptieren
    for (const z of state.zielzonen) {
      for (const l of z.korrekteLabels) {
        const k = l.trim().toLowerCase()
        if (!k) continue
        zonenTexte.set(k, (zonenTexte.get(k) ?? 0) + 1)
      }
    }
    const poolTexte = new Map<string, number>()
    for (const l of state.labels) {
      const k = l.text.trim().toLowerCase()
      if (!k) continue
      poolTexte.set(k, (poolTexte.get(k) ?? 0) + 1)
    }
    const hinweise: string[] = []
    for (const [text, zonenCnt] of zonenTexte) {
      const poolCnt = poolTexte.get(text) ?? 0
      if (poolCnt < zonenCnt) hinweise.push(`Zone akzeptiert '${text}', Pool hat ${poolCnt} (gebraucht: ${zonenCnt})`)
      if (poolCnt > zonenCnt) hinweise.push(`Pool hat ${poolCnt}× '${text}', ${zonenCnt} Zonen akzeptieren es (= ${poolCnt - zonenCnt} Distraktoren)`)
    }
    for (const [text, cnt] of poolTexte) {
      if (!zonenTexte.has(text)) hinweise.push(`Pool-Token '${text}' (${cnt}×) passt zu keiner Zone`)
    }
    return hinweise
  }, [state.zielzonen, state.labels])

  return (
    <div>
      {/* Bild-Upload (bestehend) */}
      {/* Zonen-Liste mit Chip-Input pro Zone */}
      {state.zielzonen.map((z, i) => (
        <div key={z.id}>
          <label>Zone {i + 1}: korrekte Labels</label>
          <ChipInput
            data-testid={`zone-${z.id}-chip-input`}
            chips={z.korrekteLabels}
            onChange={(chips) => updateZone(z.id, [...new Set(chips.map(s => s.trim()).filter(Boolean))])}
          />
        </div>
      ))}
      {/* Pool */}
      <div>
        <label>Pool (Duplikate erlaubt)</label>
        <ChipInput data-testid="pool-chip-input" chips={state.labels.map(l => l.text)} onAdd={addPoolLabel} onRemove={(idx) => removePoolLabel(state.labels[idx].id)} />
      </div>
      {/* Konsistenz-Hinweise */}
      {konsistenzHinweise.length > 0 && (
        <ul>
          {konsistenzHinweise.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}
    </div>
  )
}
```

(Wenn `ChipInput` noch nicht existiert, eigene mini-Komponente im selben File — Tag-Input-Pattern aus Bundle H BulkPasteModal wiederverwenden.)

- [ ] **Step 3: SharedFragenEditor mit `key={frage.id}`**

In `packages/shared/src/editor/SharedFragenEditor.tsx` Z. 465 sicherstellen:

```tsx
{frage.typ === 'dragdrop_bild' && (
  <DragDropBildEditor key={frage.id ?? 'neu'} frage={frage} onChange={onChange} />
)}
```

- [ ] **Step 4: DoppelteLabelDialog entfernen**

```bash
grep -rn "DoppelteLabelDialog" packages/shared/src/editor/
```

Imports + Usage in DragDropBildEditor entfernen. Komponente selbst kann erstmal stehen bleiben (wird im Cleanup-Bundle gelöscht).

- [ ] **Step 5: Tests ausführen → 4/4 PASS**

```bash
cd ExamLab && npx vitest run src/tests/DragDropBildEditorMultiZone.test.tsx
```

- [ ] **Step 6: fragenFactory anpassen**

In `packages/shared/src/editor/fragenFactory.ts` Z. 280-290:

```ts
case 'dragdrop_bild':
  return {
    ...basis,
    typ: 'dragdrop_bild',
    fragetext: '',
    bildUrl: '',
    zielzonen: [],
    labels: [],  // DragDropBildLabel[] statt string[]
  }
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/editor/typen/DragDropBildEditor.tsx packages/shared/src/editor/SharedFragenEditor.tsx packages/shared/src/editor/fragenFactory.ts ExamLab/src/tests/DragDropBildEditorMultiZone.test.tsx
git commit -m "Bundle J Phase 8 (Pfad 1+10): LP-Editor Chip-Input, Pool-Duplikate, Konsistenz-Hinweise

- DoppelteLabelDialog entfernt (Multi-Zone ist jetzt Feature)
- Bundle-H-Pool-Dedupe-Warnung entfernt
- Migrations-Adapter beim Mount via normalisiereDragDropBild
- key={frage.id}-Prop für Re-Mount bei Frage-Wechsel (S129)
- fragenFactory schreibt direkt neues Format"
```

### Task 25: securityInvarianten erweitern

**Files:**
- Modify: `ExamLab/src/__tests__/regression/securityInvarianten.test.ts` (~Z. 130-140)

- [ ] **Step 1: Tests ergänzen**

```ts
describe('DragDrop-Bild Privacy (Bundle J)', () => {
  it('korrekteLabels wird für SuS-Prüfen entfernt', async () => {
    const frage = {
      typ: 'dragdrop_bild',
      zielzonen: [{ id: 'z1', korrekteLabels: ['Aktiva'], erklaerung: 'foo' }],
      labels: [{ id: 'a', text: 'Aktiva' }],
    }
    const bereinigt = await rufeBackendBereinigung(frage, { modus: 'pruefen' })
    expect(bereinigt.zielzonen[0].korrekteLabels).toBeUndefined()
    expect(bereinigt.zielzonen[0].erklaerung).toBeUndefined()
  })

  it('korrektesLabel (Legacy) wird ebenfalls entfernt', async () => {
    const frage = {
      typ: 'dragdrop_bild',
      zielzonen: [{ id: 'z1', korrektesLabel: 'Aktiva' }],
      labels: ['Aktiva'],
    }
    const bereinigt = await rufeBackendBereinigung(frage, { modus: 'pruefen' })
    expect(bereinigt.zielzonen[0].korrektesLabel).toBeUndefined()
  })

  it('Label-IDs enthalten kein Zone-Pattern (kein Lösungs-Leak)', () => {
    const frage = {
      id: 'f1', typ: 'dragdrop_bild', labels: ['Aktiva', 'Passiva'],
      zielzonen: [{ id: 'z1', korrektesLabel: 'Aktiva' }, { id: 'z2', korrektesLabel: 'Passiva' }],
    }
    const norm = normalisiereDragDropBild(frage)
    for (const l of norm.labels) {
      expect(l.id).not.toMatch(/zone|z\d/i)
    }
  })
})
```

(`rufeBackendBereinigung` ist eine Hilfs-Mock-Funktion, die die Apps-Script-Bereinigungs-Logik im Frontend simuliert; falls vorhanden, sonst Helper analog Bestand erstellen.)

- [ ] **Step 2: Tests ausführen → PASS**

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/__tests__/regression/securityInvarianten.test.ts
git commit -m "Bundle J Phase 8.5: securityInvarianten erweitert um korrekteLabels-Bereinigung + ID-Determinismus"
```

### Task 26: TypeScript-Build prüfen

- [ ] **Step 1: Vollständigen Build laufen lassen**

```bash
cd ExamLab && npx tsc -b
```

Erwartet: 0 Fehler. Falls noch Compile-Fehler übrig, in HANDOFF-Liste prüfen + fixen.

- [ ] **Step 2: Vitest-Vollsuite**

```bash
cd ExamLab && npx vitest run
```

Erwartet: alle bestehenden Tests grün + ~20 neue grün → ≥1100 total.

- [ ] **Step 3: Build**

```bash
cd ExamLab && npm run build
```

Erwartet: erfolgreich.

- [ ] **Step 4: Commit (falls Anpassungen nötig waren)**

```bash
git add -A && git commit -m "Bundle J: tsc + vitest + build grün nach allen Pfad-Updates" || true
```

---

## Phase 9 — Migrations-Skript

### Task 27: Migration-Skript-Setup

**Files:**
- Create: `ExamLab/scripts/migrate-dragdrop-multi-zone/package.json`
- Create: `ExamLab/scripts/migrate-dragdrop-multi-zone/README.md`

- [ ] **Step 1: package.json**

```json
{
  "name": "migrate-dragdrop-multi-zone",
  "type": "module",
  "private": true,
  "scripts": {
    "dump": "node dump.mjs",
    "migrate": "node migrate.mjs",
    "upload": "node upload.mjs"
  },
  "dependencies": {
    "undici": "^7.0.0"
  }
}
```

- [ ] **Step 2: README**

`ExamLab/scripts/migrate-dragdrop-multi-zone/README.md`:

```markdown
# Bundle J — DragDrop-Bild Multi-Zone Migration

## Voraussetzungen

- Apps-Script-Deploy mit `batchUpdateFragenMigration`-Endpoint UND erweitertem `LOESUNGS_FELDER_`
- Frontend-Deploy mit Normalizer (Phase 1-8)
- Sheet-Backup vor Migration (User-Manual)
- Env: `APPS_SCRIPT_URL`, `MIGRATION_EMAIL`, `MIGRATION_TOKEN`

## Schritte

\```bash
cd ExamLab/scripts/migrate-dragdrop-multi-zone
npm install
node dump.mjs > fragen.json
node migrate.mjs fragen.json > migriert.json
# Stichprobe (erste 10 Fragen):
head -c 5000 migriert.json | node upload.mjs --dry-run
# Manuelle Verifikation, dann Full-Run:
node upload.mjs migriert.json
\```

Siehe `SESSION-PROTOCOL.md` für die Schritt-für-Schritt-Bedienung.
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/scripts/migrate-dragdrop-multi-zone/package.json ExamLab/scripts/migrate-dragdrop-multi-zone/README.md
git commit -m "Bundle J Phase 9.1: Migrations-Skript-Setup + README"
```

### Task 28: dump.mjs

**Files:**
- Create: `ExamLab/scripts/migrate-dragdrop-multi-zone/dump.mjs`

- [ ] **Step 1: Dump-Skript schreiben** (analog C9 dump.mjs)

```js
#!/usr/bin/env node
import { request } from 'undici'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN
if (!APPS_SCRIPT_URL || !MIGRATION_TOKEN) {
  console.error('Setze APPS_SCRIPT_URL und MIGRATION_TOKEN.')
  process.exit(1)
}

const { body } = await request(APPS_SCRIPT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ action: 'dumpFragen', token: MIGRATION_TOKEN }),
})
const data = await body.json()
if (!data.success) {
  console.error('API-Fehler:', data.error)
  process.exit(1)
}
const dnd = data.data.filter(f => f.typ === 'dragdrop_bild')
console.error(`Gedumpt: ${dnd.length} dragdrop_bild-Fragen`)
process.stdout.write(JSON.stringify(dnd, null, 2))
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/scripts/migrate-dragdrop-multi-zone/dump.mjs
git commit -m "Bundle J Phase 9.2: dump.mjs"
```

### Task 29: migrate.mjs

**Files:**
- Create: `ExamLab/scripts/migrate-dragdrop-multi-zone/migrate.mjs`

- [ ] **Step 1: Skript schreiben**

```js
#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { stabilId } from '../../../packages/shared/src/util/stabilId.mjs'

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Usage: node migrate.mjs <fragen.json>')
  process.exit(1)
}
const fragen = JSON.parse(readFileSync(inputPath, 'utf8'))

const migriert = fragen.map(f => {
  if (f.typ !== 'dragdrop_bild') return f
  // Zonen
  const zielzonen = (f.zielzonen ?? []).map(z => {
    const out = { ...z }
    if (!Array.isArray(out.korrekteLabels) || out.korrekteLabels.length === 0) {
      out.korrekteLabels = z.korrektesLabel ? [z.korrektesLabel] : []
    }
    delete out.korrektesLabel  // Legacy-Feld entfernen
    return out
  })
  // Pool
  let labels
  if (Array.isArray(f.labels) && f.labels.length > 0 && typeof f.labels[0] === 'string') {
    labels = f.labels.map((text, i) => ({ id: stabilId(f.id, text, i), text }))
  } else {
    labels = (f.labels ?? []).map((l, i) => {
      if (l && typeof l === 'object' && typeof l.text === 'string') {
        return { id: l.id ?? stabilId(f.id, l.text, i), text: l.text }
      }
      return { id: stabilId(f.id, '', i), text: '' }
    })
  }
  return {
    ...f,
    zielzonen,
    labels,
    pruefungstauglich: false,  // LP muss bestätigen
  }
})

console.error(`Migriert: ${migriert.length} Fragen`)
process.stdout.write(JSON.stringify(migriert, null, 2))
```

- [ ] **Step 2: Smoke-Test mit Mock-Frage**

```bash
echo '[{"id":"f1","typ":"dragdrop_bild","zielzonen":[{"id":"z1","korrektesLabel":"Aktiva"}],"labels":["Aktiva","Passiva"]}]' \
  | node ExamLab/scripts/migrate-dragdrop-multi-zone/migrate.mjs /dev/stdin
```

Erwartet: `korrekteLabels: ['Aktiva']`, `labels: [{id, text:'Aktiva'}, {id, text:'Passiva'}]`, `pruefungstauglich: false`.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/scripts/migrate-dragdrop-multi-zone/migrate.mjs
git commit -m "Bundle J Phase 9.3: migrate.mjs — Transform old → new mit stabilId"
```

### Task 30: upload.mjs

**Files:**
- Create: `ExamLab/scripts/migrate-dragdrop-multi-zone/upload.mjs`

- [ ] **Step 1: Skript schreiben**

```js
#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { request } from 'undici'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL
const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN
if (!APPS_SCRIPT_URL || !MIGRATION_EMAIL || !MIGRATION_TOKEN) {
  console.error('Setze APPS_SCRIPT_URL, MIGRATION_EMAIL, MIGRATION_TOKEN.')
  process.exit(1)
}

const inputPath = process.argv[2]
const dryRun = process.argv.includes('--dry-run')
if (!inputPath) { console.error('Usage: node upload.mjs <migriert.json> [--dry-run]'); process.exit(1) }
const fragen = JSON.parse(readFileSync(inputPath, 'utf8'))

const BATCH_SIZE = 50
let success = 0, fehler = 0
for (let i = 0; i < fragen.length; i += BATCH_SIZE) {
  const batch = fragen.slice(i, i + BATCH_SIZE)
  if (dryRun) {
    console.log(`[DRY-RUN] Batch ${i / BATCH_SIZE + 1}: ${batch.length} Fragen`)
    success += batch.length
    continue
  }
  const { body } = await request(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'batchUpdateFragenMigration',
      email: MIGRATION_EMAIL,
      token: MIGRATION_TOKEN,
      updates: batch.map(f => ({
        id: f.id,
        felder: { zielzonen: f.zielzonen, labels: f.labels, pruefungstauglich: f.pruefungstauglich },
      })),
    }),
  })
  const data = await body.json()
  if (data.success) {
    success += batch.length
    console.error(`Batch ${i / BATCH_SIZE + 1}: ${batch.length} OK`)
  } else {
    fehler += batch.length
    console.error(`Batch ${i / BATCH_SIZE + 1}: FEHLER`, data.error)
  }
  await new Promise(r => setTimeout(r, 500))  // Rate-Limit
}
console.error(`\nTotal: ${success} erfolgreich, ${fehler} Fehler`)
process.exit(fehler > 0 ? 1 : 0)
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/scripts/migrate-dragdrop-multi-zone/upload.mjs
git commit -m "Bundle J Phase 9.4: upload.mjs — Batch-Upload via batchUpdateFragenMigration"
```

### Task 31: SESSION-PROTOCOL.md

**Files:**
- Create: `ExamLab/scripts/migrate-dragdrop-multi-zone/SESSION-PROTOCOL.md`

- [ ] **Step 1: Protokoll schreiben**

```markdown
# Bundle J Migrations-Session

## Pre-Run-Checklist

- [ ] Apps-Script-Deploy mit korrekteLabels-LOESUNGS_FELDER + batchUpdateFragenMigration aktiv?
- [ ] Frontend-Deploy mit Normalizer aktiv? (Verify: `git log feature/bundle-j-... --oneline`)
- [ ] Sheet-Backup gemacht? (Datei → Kopie erstellen → benennen `Backup-vor-Bundle-J-YYYY-MM-DD`)
- [ ] Aktive Üben-Sessions geprüft? (siehe Audit-Skript)
- [ ] Aktive Prüfungen? (Wenn ja: Migration verschieben)
- [ ] Env-Variablen gesetzt? (APPS_SCRIPT_URL, MIGRATION_EMAIL, MIGRATION_TOKEN)

## Schritt 1: Dump

\```bash
node dump.mjs > fragen.json
\```

Output prüfen: Anzahl Fragen entspricht Audit-Erwartung.

## Schritt 2: Migrate

\```bash
node migrate.mjs fragen.json > migriert.json
\```

Output prüfen:
- Stichprobe `head migriert.json`: korrekteLabels = [korrektesLabel-Wert], pruefungstauglich=false, labels haben IDs.
- Eine bekannte Frage manuell verifizieren (z.B. Frage aus Audit-Liste).

## Schritt 3: Stichprobe-Upload (5-10 Fragen)

\```bash
head -c 8000 migriert.json | jq '.[0:5]' > stichprobe.json
node upload.mjs stichprobe.json
\```

Im LP-Frontend prüfen: Frage öffnen, Editor zeigt neues Format, `pruefungstauglich=false`.

## Schritt 4: Verifikation Stichprobe

- LP-Editor: Frage hat Chip-Input pro Zone, Pool zeigt Tokens mit IDs.
- SuS-Üben: Frage rendert mit Stack-Counter (falls Pool Duplikate enthält).
- LP-Korrektur: Multi-Label-Anzeige sichtbar.

## Schritt 5: Full-Run

Wenn Stichprobe OK:

\```bash
node upload.mjs migriert.json
\```

Output: `Total: N erfolgreich, 0 Fehler`.

## Schritt 6: Re-Dump-Verifikation

\```bash
node dump.mjs > fragen-nach.json
diff <(jq -S 'sort_by(.id)' fragen.json) <(jq -S 'sort_by(.id)' fragen-nach.json) | head -50
\```

Erwartet: Differenzen nur in `korrekteLabels` (neu), `labels` (Format), `pruefungstauglich` (false), `korrektesLabel` (entfernt).

## Schritt 7: User-Tasks-Liste an LP

Multi-Zone-Bug-Fragen aus Audit-Output → LP muss Pool ergänzen damit Multi-Zone-Token-Anzahl stimmt. IDs an LP kommunizieren.
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/scripts/migrate-dragdrop-multi-zone/SESSION-PROTOCOL.md
git commit -m "Bundle J Phase 9.5: SESSION-PROTOCOL für Migrations-Session"
```

---

## Phase 10 — Migration-Run + E2E

### Task 32: Stichprobe-Run (User-Task)

- [ ] **Step 1: User führt Stichprobe-Run aus**

In HANDOFF.md ergänzen:

```markdown
- [ ] Stichprobe-Migration (5-10 Fragen) gemäss SESSION-PROTOCOL Schritt 3-4 durchführen
- [ ] Verifikation in LP-Editor + SuS-Üben + LP-Korrektur
- [ ] Bei Fehlern: Issue-Liste, Skript fixen, neu starten
```

- [ ] **Step 2: Wartemarker im Plan**

### Task 33: Browser-E2E Test-Plan

- [ ] **Step 1: Test-Plan in HANDOFF.md schreiben** (regression-prevention.md Phase 3.0)

```markdown
## Bundle J Browser-E2E Test-Plan

### Setup
- Tab-Gruppe mit LP (wr.test@gymhofwil.ch) + SuS (wr.test@stud.gymhofwil.ch)
- Test-Prüfung: Einrichtungspruefung mit DnD-Bild-Frage

### Zu testende Aenderungen

| # | Aenderung | Erwartetes Verhalten | Regressions-Risiko |
|---|-----------|---------------------|-------------------|
| 1 | LP-Editor Multi-Zone-Frage | Bilanz-Schema mit 2× 'Aktiva'-Zonen + 2 'Aktiva'-Pool-Tokens speicherbar | Editor crasht bei alten Fragen |
| 2 | LP-Editor Multi-Label | Zone akzeptiert ['Marketing-Mix', '4P'] | Chip-Input verliert Daten |
| 3 | SuS-Stack-Counter | Pool zeigt 'Aktiva ×2', Counter dekrementiert beim Drop | Stack verschwindet falsch |
| 4 | SuS-Korrektur Multi-Zone | 2 'Aktiva'-Tokens in 2 'Aktiva'-Zonen → beide korrekt | Eine Zone fälschlich falsch |
| 5 | Bestand-Frage (vor Mig) | Frage öffnen + lösen wie vorher | Antwort orphaned |
| 6 | Bestand-Frage (nach Mig) | Frage öffnen + lösen wie vorher (1:1-Mapping) | Antwort orphaned |

### Security-Check

- [ ] SuS-API-Response: keine korrekteLabels, kein korrektesLabel
- [ ] SuS-API-Response: labels hat id+text (kein Lösungs-Hint im id-Pattern)
- [ ] LP-API-Response: korrekteLabels vollständig

### Kritische Pfade
- [ ] SuS lädt Üben-Modus mit DnD-Frage
- [ ] LP Korrektur-Vollansicht für DnD-Frage
- [ ] LP Druck-Ansicht
- [ ] SuS-Heartbeat speichert Zuordnung
- [ ] SuS-Abgabe persistiert

### Regressions-Tests (verwandte Fragetypen)
- [ ] Hotspot, Bildbeschriftung (gleiche Bild-Pattern)
- [ ] Sortierung, Zuordnung (Drag-verwandt)
- [ ] FiBu-Tabellen-Eingabe (Buchungssatz, T-Konto, Bilanz/ER)

### Mobile / iPad-Test (PFLICHT für Stack-Touch-Mechanik)
- [ ] iPad oder Chrome-DevTools-Mobile-Simulation: Tap-to-Select auf Stack `Soll ×3`
- [ ] Tap auf Zone → Counter dekrementiert auf ×2
- [ ] Bei Counter = 0: Stack verschwindet aus Pool
- [ ] Tap auf platzierten Token in Zone → entfernt, Counter +1
- [ ] Touch-Targets ≥ 44×44px (Spec/`bilder-in-pools.md` Regel 19)
- [ ] `touchAction: 'none'` auf interaktiven Elementen während Tap (kein Browser-Scroll dabei)
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle J Phase 10.1: Browser-E2E Test-Plan"
```

### Task 34: Browser-E2E Durchführen (User + Claude)

- [ ] **Step 1: Tab-Gruppe erstellen** (Claude via mcp__Claude_in_Chrome__tabs_context_mcp)
- [ ] **Step 2: User loggt ein** in beide Tabs
- [ ] **Step 3: Claude testet entlang Test-Plan** mit Screenshots/Console-Logs
- [ ] **Step 4: Bei Issues: Fix → re-run E2E**
- [ ] **Step 5: Ergebnis in HANDOFF.md dokumentieren**

### Task 35: Full-Run-Migration (User-Task)

- [ ] **Step 1: User führt Full-Run aus** (gemäss SESSION-PROTOCOL Schritt 5-6)
- [ ] **Step 2: Re-Dump-Verifikation**
- [ ] **Step 3: User-Tasks-Liste an LP** (Multi-Zone-Bug-Fragen für Re-Edit)
- [ ] **Step 4: Stand in HANDOFF.md dokumentieren**

---

## Phase 11 — Merge + Cleanup-Reminder

### Task 36: Merge-Gate

- [ ] **Step 1: Pre-Merge-Checklist** (regression-prevention.md Phase 5)

```bash
cd ExamLab && npx tsc -b           # erwartet: 0 Fehler
cd ExamLab && npx vitest run        # erwartet: ≥1100 grün
cd ExamLab && npm run build         # erwartet: erfolgreich
```

- [ ] **Step 2: Browser-E2E-Ergebnisse + Security-Verifikation in HANDOFF dokumentiert?**
- [ ] **Step 3: LP-Freigabe einholen**

### Task 37: Merge nach main

- [ ] **Step 1: Merge**

```bash
git checkout main && git pull
git merge --no-ff feature/bundle-j-dragdrop-multi-zone -m "Bundle J: DnD-Bild Multi-Zone-Datenmodell auf main"
git push origin main
```

- [ ] **Step 2: Branch löschen**

```bash
git branch -d feature/bundle-j-dragdrop-multi-zone
git push origin --delete feature/bundle-j-dragdrop-multi-zone
```

### Task 38: Cleanup-Reminder

- [ ] **Step 1: ScheduleWakeup**

In Claude-Code-Session:

```text
mcp__scheduled-tasks__create_scheduled_task name=bundle-j-cleanup-check
delay=14_days
prompt="Bundle J ist seit ~2 Wochen auf main. Prüfe Migrations-Stabilität:
1. Audit-Skript erneut ausführen — sind alle Bestand-Fragen migriert (kein korrektesLabel mehr)?
2. Falls ja: Cleanup-Bundle starten — Dual-Read-Pfade entfernen, korrektesLabel/legacyLabels aus Types raus.
3. Falls nein: Restbestand identifizieren, Migration nachfahren oder LP-Tasks generieren."
```

- [ ] **Step 2: HANDOFF.md final updaten**

```markdown
## Bundle J — KOMPLETT auf main (YYYY-MM-DD)

- Merge-Commit: <SHA>
- Tests: NNNN vitest grün
- Cleanup-Reminder: bundle-j-cleanup-check (in 2 Wochen)
- Multi-Zone-Bug-Fragen-LP-Re-Edit: <Anzahl> Fragen offen, IDs in <Datei>
```

- [ ] **Step 3: Memory aktualisieren**

In `~/.claude/projects/.../memory/MEMORY.md`:

```markdown
- **[S<n> Bundle J auf main](project_s<n>_bundle_j.md)** — DnD-Bild Multi-Zone-Datenmodell. Merge `<sha>`. Datenmodell: korrekteLabels: string[] + DragDropBildLabel{id,text}. Normalizer-Pattern an 15 Pfaden (14 Lese + IDB-Restore), stabilId Cross-Environment. Bestand-Migration via batchUpdateFragenMigration. <Anzahl> Tests (vorher 1082).
```

---

## Verifikations-Übersicht

Nach jeder Phase laufen diese Checks:

```bash
cd ExamLab && npx tsc -b            # TypeScript
cd ExamLab && npx vitest run         # Vitest
cd ExamLab && npm run build          # Build
```

Phase-spezifisch (zusätzlich):

| Phase | Zusatz-Verify |
|---|---|
| 1 | `vitest run util/stabilId` |
| 2 | `vitest run utils/ueben/fragetypNormalizer` |
| 3 | `vitest run utils/dragdropAntwortMigration` |
| 4 | User: GAS-Editor `testDragDropMultiZonePrivacy` → `OK` |
| 5 | `vitest run` (autoKorrektur, dragdropBildUtils, etc.) |
| 6 | `vitest run utils/poolConverter` |
| 7 | `vitest run tests/DragDropBildFrageStacks` |
| 8 | `vitest run tests/DragDropBildEditorMultiZone` + `securityInvarianten` |
| 9 | Smoke-Run `migrate.mjs` mit Mock-Input |
| 10 | Browser-E2E mit echten Logins (Test-Plan in Task 33) |
| 11 | Merge-Gate-Checks alle grün |

---

## Risiken & Mitigationen pro Task (Quick-Reference)

- **Task 4 (Type-Erweiterung):** absichtlich roter `tsc -b` bis Phase 8. Mitigation: HANDOFF-Liste der Compile-Fehler verfolgen.
- **Task 22 (SuS-Renderer):** Mobile-Touch-Verhalten. Mitigation: Bestehende DnD-Touch-Tests + manueller iPad-Test in Phase 10.
- **Task 24 (Editor):** großer Refactor. Mitigation: Migrations-Adapter-Tests (Task 23) decken Migrations-Verhalten ab.
- **Task 29 (migrate.mjs):** stabilId muss Cross-Environment matchen. Mitigation: Cross-Env-Test in Task 3.
- **Task 35 (Full-Run):** kann mid-run abbrechen. Mitigation: `batchUpdateFragenMigration` ist idempotent (Task-Resume möglich via Re-Run mit Skip-bereits-Migrierten).
