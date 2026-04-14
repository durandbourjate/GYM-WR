# Pool-Prüfungstool-Brücke — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronisation von Übungspool-Fragen und Lernzielen ins Prüfungstool mit Review-Status-Tracking und KI-Lernziel-Integration.

**Architecture:** Frontend-gesteuerte Sync-Logik fetcht Pool-JS-Configs von GitHub Pages, berechnet Delta gegen bestehende Fragenbank, und importiert via Apps Script Batch-Endpoints. Zwei unabhängige Review-Flags (Pool-geprüft, Prüfungstauglich) ermöglichen gestuftes Quality-Gating. Lernziele aus Pools werden in separatem Sheet gespeichert und für KI-Fragengenerierung genutzt.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind v4 (Frontend), Google Apps Script (Backend), Claude API (KI-Generierung)

**Spec:** `docs/superpowers/specs/2026-03-20-pool-pruefungstool-bruecke-design.md`

---

## File Structure

### Neue Dateien
| Datei | Verantwortung |
|-------|---------------|
| `ExamLab/src/services/poolSync.ts` | Fetch Pool-Configs, Parse, Delta-Berechnung, Content-Hash |
| `ExamLab/src/utils/poolConverter.ts` | Typ-Konvertierung Pool→Prüfungstool (7 Fragetypen) |
| `ExamLab/src/types/pool.ts` | Pool-spezifische Typen (PoolFrageSnapshot, PoolMeta, PoolFrage, etc.) |
| `ExamLab/src/components/lp/PoolSyncDialog.tsx` | Sync-Dialog mit Fortschritt und Vorschau |
| `Uebungen/Uebungspools/config/index.json` | Maschinenlesbarer Pool-Index |

### Modifizierte Dateien
| Datei | Änderung |
|-------|----------|
| `ExamLab/src/types/fragen.ts` | Neue Felder auf FrageBase (poolId, Review-Flags, Hash, lernzielIds) |
| `ExamLab/src/components/lp/FragenBrowser.tsx` (~786 Z.) | Badges + Filter (Quelle, Status) |
| `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` (~1212 Z.) | Pool-Info-Leiste, Absegnen-Button, Update-Vergleich |
| `ExamLab/src/components/lp/LPStartseite.tsx` (~300 Z.) | Sync-Button |
| `ExamLab/src/services/apiService.ts` (~766 Z.) | 4 neue API-Methoden |
| `ExamLab/src/components/lp/frageneditor/useKIAssistent.ts` (~80 Z.) | Neue Aktion "generiereFrageZuLernziel" |
| `ExamLab/apps-script-code.js` (~3000 Z.) | 4 neue Endpoints + Lernziele-Sheet |
| 26× `Uebungen/Uebungspools/config/*.js` | `reviewed: false` pro Frage |

---

## Task 1: Pool-Typen und FrageBase-Erweiterung

**Files:**
- Create: `ExamLab/src/types/pool.ts`
- Modify: `ExamLab/src/types/fragen.ts`

- [ ] **Step 1: Neue Datei `pool.ts` mit Pool-spezifischen Typen erstellen**

```typescript
// ExamLab/src/types/pool.ts

/** Snapshot einer Pool-Frage für Vergleich im Update-Dialog */
export interface PoolFrageSnapshot {
  fragetext: string
  typ: string
  optionen?: unknown[]
  korrekt?: unknown
  erklaerung?: string
  musterlosung?: string
  spezifisch?: unknown
}

/** Pool-Meta aus POOL_META global */
export interface PoolMeta {
  id: string
  fach: string
  title: string
  meta?: string
  color?: string
  lernziele: string[]
}

/** Topic-Eintrag aus TOPICS global */
export interface PoolTopic {
  label: string
  short: string
  lernziele: string[]
}

/** Einzelne Pool-Frage (Rohformat aus JS-Config) */
export interface PoolFrage {
  id: string
  topic: string
  type: 'mc' | 'multi' | 'tf' | 'fill' | 'calc' | 'sort' | 'open'
  diff: number
  tax: string
  q: string
  reviewed?: boolean
  // Typ-spezifisch
  options?: { v: string; t: string }[]
  correct?: string | string[] | boolean
  explain?: string
  blanks?: { answer: string; alts?: string[] }[]
  rows?: { label: string; answer: number; tolerance: number; unit?: string }[]
  categories?: string[]
  items?: { t: string; cat: number }[]
  sample?: string
}

/** Geparstes Pool-Config-Ergebnis */
export interface PoolConfig {
  meta: PoolMeta
  topics: Record<string, PoolTopic>
  questions: PoolFrage[]
}

/** Eintrag in config/index.json */
export interface PoolIndexEintrag {
  id: string
  file: string
  fach: string
  title: string
}

/** Lernziel für Lernziele-Sheet */
export interface Lernziel {
  id: string
  fach: string
  poolId: string
  thema: string
  text: string
  bloom: string
  aktiv: boolean
}

/** Sync-Ergebnis pro Pool */
export interface PoolSyncErgebnis {
  poolId: string
  poolTitle: string
  neu: number
  aktualisiert: number
  unveraendert: number
  fehler?: string
}
```

- [ ] **Step 2: FrageBase in fragen.ts erweitern**

In `ExamLab/src/types/fragen.ts` nach Zeile 57 (nach `geteiltVon`) einfügen:

```typescript
  // Pool-Sync (importierte Fragen aus Übungspools)
  poolId?: string                     // Compound-Key '{pool}:{frage}', z.B. 'vwl_bip:d01'
  poolGeprueft?: boolean              // Review-Status in Pool-Quelle
  pruefungstauglich?: boolean         // Separat abgesegnet im Prüfungstool
  poolContentHash?: string            // SHA-256 für Änderungserkennung
  poolUpdateVerfuegbar?: boolean      // true wenn Pool-Version neuer
  poolVersion?: import('./pool').PoolFrageSnapshot
  lernzielIds?: string[]              // Referenzen auf Lernziel-Einträge
```

- [ ] **Step 3: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS (keine Typfehler)

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/types/pool.ts ExamLab/src/types/fragen.ts
git commit -m "Pool-Brücke: Typen für Pool-Sync und FrageBase-Erweiterung"
```

---

## Task 2: Pool-Index und reviewed-Feld

**Files:**
- Create: `Uebungen/Uebungspools/config/index.json`
- Modify: 26× `Uebungen/Uebungspools/config/*.js`

- [ ] **Step 1: config/index.json erstellen**

```json
[
  {"id":"bwl_einfuehrung","file":"bwl_einfuehrung.js","fach":"BWL","title":"Einführung BWL"},
  {"id":"bwl_fibu","file":"bwl_fibu.js","fach":"BWL","title":"Finanzbuchhaltung"},
  {"id":"bwl_marketing","file":"bwl_marketing.js","fach":"BWL","title":"Marketing"},
  {"id":"bwl_stratfuehrung","file":"bwl_stratfuehrung.js","fach":"BWL","title":"Strategie & Führung"},
  {"id":"bwl_unternehmensmodell","file":"bwl_unternehmensmodell.js","fach":"BWL","title":"Unternehmensmodell"},
  {"id":"recht_arbeitsrecht","file":"recht_arbeitsrecht.js","fach":"Recht","title":"Arbeitsrecht"},
  {"id":"recht_einfuehrung","file":"recht_einfuehrung.js","fach":"Recht","title":"Einführung Recht"},
  {"id":"recht_einleitungsartikel","file":"recht_einleitungsartikel.js","fach":"Recht","title":"Einleitungsartikel"},
  {"id":"recht_grundrechte","file":"recht_grundrechte.js","fach":"Recht","title":"Grundrechte"},
  {"id":"recht_mietrecht","file":"recht_mietrecht.js","fach":"Recht","title":"Mietrecht"},
  {"id":"recht_or_at","file":"recht_or_at.js","fach":"Recht","title":"OR AT"},
  {"id":"recht_personenrecht","file":"recht_personenrecht.js","fach":"Recht","title":"Personenrecht"},
  {"id":"recht_prozessrecht","file":"recht_prozessrecht.js","fach":"Recht","title":"Prozessrecht"},
  {"id":"recht_sachenrecht","file":"recht_sachenrecht.js","fach":"Recht","title":"Sachenrecht"},
  {"id":"recht_strafrecht","file":"recht_strafrecht.js","fach":"Recht","title":"Strafrecht"},
  {"id":"vwl_arbeitslosigkeit","file":"vwl_arbeitslosigkeit.js","fach":"VWL","title":"Arbeitslosigkeit"},
  {"id":"vwl_beduerfnisse","file":"vwl_beduerfnisse.js","fach":"VWL","title":"Bedürfnisse"},
  {"id":"vwl_bip","file":"vwl_bip.js","fach":"VWL","title":"BIP"},
  {"id":"vwl_geld","file":"vwl_geld.js","fach":"VWL","title":"Geld"},
  {"id":"vwl_konjunktur","file":"vwl_konjunktur.js","fach":"VWL","title":"Konjunktur"},
  {"id":"vwl_markteffizienz","file":"vwl_markteffizienz.js","fach":"VWL","title":"Markteffizienz"},
  {"id":"vwl_menschenbild","file":"vwl_menschenbild.js","fach":"VWL","title":"Menschenbild"},
  {"id":"vwl_sozialpolitik","file":"vwl_sozialpolitik.js","fach":"VWL","title":"Sozialpolitik"},
  {"id":"vwl_staatsverschuldung","file":"vwl_staatsverschuldung.js","fach":"VWL","title":"Staatsverschuldung"},
  {"id":"vwl_steuern","file":"vwl_steuern.js","fach":"VWL","title":"Steuern"},
  {"id":"vwl_wachstum","file":"vwl_wachstum.js","fach":"VWL","title":"Wachstum"}
]
```

Hinweis: `informatik_Kryptographie.html` wird nicht aufgenommen (HTML-Format, nicht JS-Config).

- [ ] **Step 2: reviewed: false in alle 26 JS-Configs einfügen**

Für jede der 26 `.js`-Dateien: In jedem Frage-Objekt im `QUESTIONS`-Array nach dem `tax:`-Feld `reviewed:false,` einfügen.

Pattern pro Frage (Beispiel vwl_bip.js):
```javascript
// Vorher:
{id:"d01",topic:"definition",type:"mc",diff:1,tax:"K1",
// Nachher:
{id:"d01",topic:"definition",type:"mc",diff:1,tax:"K1",reviewed:false,
```

Automatisierung via Script empfohlen — es sind hunderte Fragen über 26 Dateien. Regex: Ersetze `tax:"K[1-6]",` durch `tax:"K[1-6]",reviewed:false,` (nur wenn `reviewed` noch nicht vorhanden).

- [ ] **Step 3: Stichproben-Prüfung**

Öffne 3 verschiedene Pool-Configs und prüfe ob `reviewed:false` korrekt eingefügt wurde — nicht in Kommentaren, nicht doppelt, immer nach `tax:`.

- [ ] **Step 4: Commit**

```bash
git add Uebungen/Uebungspools/config/
git commit -m "Pool-Brücke: index.json + reviewed-Feld in allen 26 Pools"
```

---

## Task 3: Pool-Converter (Typ-Konvertierung)

**Files:**
- Create: `ExamLab/src/utils/poolConverter.ts`

- [ ] **Step 1: poolConverter.ts erstellen**

```typescript
// ExamLab/src/utils/poolConverter.ts
import type { Frage, MCFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage, RichtigFalschFrage, BerechnungFrage, Fachbereich, BloomStufe } from '../types/fragen'
import type { PoolFrage, PoolMeta, PoolTopic } from '../types/pool'

/** Konvertiert eine Pool-Frage ins Prüfungstool-Format */
export function konvertierePoolFrage(
  poolFrage: PoolFrage,
  poolMeta: PoolMeta,
  topics: Record<string, PoolTopic>,
  lernzielIds: string[]
): Frage {
  const now = new Date().toISOString()
  const poolId = `${poolMeta.id}:${poolFrage.id}`

  // Basis-Felder (gemeinsam für alle Typen)
  const basis = {
    id: poolId, // Verwende compound key als ID
    version: 1,
    erstelltAm: now,
    geaendertAm: now,
    fachbereich: mapFachbereich(poolMeta.fach),
    thema: topics[poolFrage.topic]?.label || poolFrage.topic,
    unterthema: '',
    semester: [],
    gefaesse: [] as string[],
    bloom: mapBloom(poolFrage.tax),
    tags: [],
    punkte: berechnePunkte(poolFrage),
    musterlosung: poolFrage.explain || poolFrage.sample || '',
    bewertungsraster: [],
    verwendungen: [],
    zeitbedarf: schaetzeZeitbedarf(poolFrage),
    quelle: 'pool' as const,
    quellReferenz: `Pool: ${poolMeta.title}`,
    poolId,
    poolGeprueft: poolFrage.reviewed || false,
    pruefungstauglich: false,
    poolContentHash: '', // Wird vom Caller gesetzt
    poolUpdateVerfuegbar: false,
    lernzielIds,
    autor: 'pool-import',
    geteilt: 'privat' as const,
  }

  switch (poolFrage.type) {
    case 'mc':
      return konvertiereMC(poolFrage, basis, false)
    case 'multi':
      return konvertiereMC(poolFrage, basis, true)
    case 'tf':
      return konvertiereTF(poolFrage, basis)
    case 'fill':
      return konvertiereFill(poolFrage, basis)
    case 'calc':
      return konvertiereCalc(poolFrage, basis)
    case 'sort':
      return konvertiereSort(poolFrage, basis)
    case 'open':
      return konvertiereOpen(poolFrage, basis)
    default:
      // Fallback: Freitext mit Fragetext
      return { ...basis, typ: 'freitext', fragetext: poolFrage.q, laenge: 'mittel' } as FreitextFrage
  }
}

function konvertiereMC(pf: PoolFrage, basis: Record<string, unknown>, mehrfach: boolean): MCFrage {
  const optionen = (pf.options || []).map(opt => ({
    id: opt.v,
    text: opt.t,
    korrekt: mehrfach
      ? (Array.isArray(pf.correct) ? pf.correct.includes(opt.v) : false)
      : opt.v === pf.correct,
  }))
  return { ...basis, typ: 'mc', fragetext: pf.q, optionen, mehrfachauswahl: mehrfach, zufallsreihenfolge: true } as MCFrage
}

function konvertiereTF(pf: PoolFrage, basis: Record<string, unknown>): RichtigFalschFrage {
  return {
    ...basis,
    typ: 'richtigfalsch',
    fragetext: pf.q,
    aussagen: [{ id: 'a1', text: pf.q, korrekt: pf.correct === true, erklaerung: pf.explain }],
  } as RichtigFalschFrage
}

function konvertiereFill(pf: PoolFrage, basis: Record<string, unknown>): LueckentextFrage {
  const luecken = (pf.blanks || []).map((b, i) => ({
    id: `l${i}`,
    korrekteAntworten: [b.answer, ...(b.alts || [])],
    caseSensitive: false,
  }))
  return { ...basis, typ: 'lueckentext', fragetext: pf.q, textMitLuecken: pf.q, luecken } as LueckentextFrage
}

function konvertiereCalc(pf: PoolFrage, basis: Record<string, unknown>): BerechnungFrage {
  const ergebnisse = (pf.rows || []).map((r, i) => ({
    id: `e${i}`,
    label: r.label,
    korrekt: r.answer,
    toleranz: r.tolerance,
    einheit: r.unit || '',
  }))
  return { ...basis, typ: 'berechnung', fragetext: pf.q, ergebnisse, rechenwegErforderlich: false } as BerechnungFrage
}

function konvertiereSort(pf: PoolFrage, basis: Record<string, unknown>): ZuordnungFrage {
  const paare = (pf.items || []).map(item => ({
    links: item.t,
    rechts: (pf.categories || [])[item.cat] || '',
  }))
  return { ...basis, typ: 'zuordnung', fragetext: pf.q, paare, zufallsreihenfolge: true } as ZuordnungFrage
}

function konvertiereOpen(pf: PoolFrage, basis: Record<string, unknown>): FreitextFrage {
  return {
    ...basis,
    typ: 'freitext',
    fragetext: pf.q,
    laenge: 'mittel',
    musterlosung: pf.sample || pf.explain || '',
  } as FreitextFrage
}

// === Hilfsfunktionen ===

function mapFachbereich(fach: string): Fachbereich {
  const map: Record<string, Fachbereich> = { VWL: 'VWL', BWL: 'BWL', Recht: 'Recht', Informatik: 'Informatik' }
  return map[fach] || 'VWL'
}

function mapBloom(tax: string): BloomStufe {
  const valid = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']
  return valid.includes(tax) ? (tax as BloomStufe) : 'K1'
}

function berechnePunkte(pf: PoolFrage): number {
  switch (pf.type) {
    case 'mc': case 'tf': return 1
    case 'multi': return 2
    case 'fill': return (pf.blanks?.length || 1)
    case 'calc': return (pf.rows?.length || 1) * 2
    case 'sort': return Math.ceil((pf.items?.length || 2) / 2)
    case 'open': return 4
    default: return 1
  }
}

function schaetzeZeitbedarf(pf: PoolFrage): number {
  switch (pf.type) {
    case 'mc': case 'tf': return 1
    case 'multi': return 2
    case 'fill': return 2
    case 'calc': return 4
    case 'sort': return 3
    case 'open': return 5
    default: return 2
  }
}

/** Erzeugt einen PoolFrageSnapshot aus einer Pool-Frage */
export function erzeugeSnapshot(pf: PoolFrage): import('../types/pool').PoolFrageSnapshot {
  return {
    fragetext: pf.q,
    typ: pf.type,
    optionen: pf.options,
    korrekt: pf.correct,
    erklaerung: pf.explain,
    musterlosung: pf.sample,
    spezifisch: pf.blanks || pf.rows || (pf.categories ? { categories: pf.categories, items: pf.items } : undefined),
  }
}
```

- [ ] **Step 2: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/utils/poolConverter.ts
git commit -m "Pool-Brücke: Typ-Konvertierung Pool→Prüfungstool (7 Fragetypen)"
```

---

## Task 4: Pool-Sync-Service

**Files:**
- Create: `ExamLab/src/services/poolSync.ts`

- [ ] **Step 1: poolSync.ts erstellen**

Ref: Spec Sektion 3 (Sync-Mechanismus), Sektion 3.3 (Content-Hash), Sektion 3.5 (JS-Parsing).

```typescript
// ExamLab/src/services/poolSync.ts
import type { Frage } from '../types/fragen'
import type { PoolConfig, PoolFrage, PoolIndexEintrag, PoolSyncErgebnis, Lernziel } from '../types/pool'
import { konvertierePoolFrage, erzeugeSnapshot } from '../utils/poolConverter'

// GitHub Pages Base-URL (dieselbe Domain, relativ)
const POOL_BASE_URL = import.meta.env.VITE_POOL_BASE_URL
  || 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/config'

/** Lädt den Pool-Index von GitHub Pages */
export async function ladePoolIndex(): Promise<PoolIndexEintrag[]> {
  const res = await fetch(`${POOL_BASE_URL}/index.json`)
  if (!res.ok) throw new Error(`Pool-Index nicht erreichbar (${res.status})`)
  return res.json()
}

/** Lädt und parst eine einzelne Pool-Config */
export async function ladePoolConfig(dateiname: string): Promise<PoolConfig> {
  const res = await fetch(`${POOL_BASE_URL}/${dateiname}`)
  if (!res.ok) throw new Error(`Pool ${dateiname} nicht erreichbar (${res.status})`)
  const jsText = await res.text()

  // Prüfe ob es tatsächlich JS ist (nicht HTML-Fehlerseite)
  if (jsText.trimStart().startsWith('<!') || jsText.trimStart().startsWith('<html')) {
    throw new Error(`Pool ${dateiname}: HTML statt JS erhalten (vermutlich 404)`)
  }

  // Sandboxed Parsing — kein Zugriff auf echtes window
  const sandbox: Record<string, unknown> = {}
  try {
    const fn = new Function('window', jsText)
    fn(sandbox)
  } catch (e) {
    throw new Error(`Pool ${dateiname}: Parse-Fehler — ${e instanceof Error ? e.message : String(e)}`)
  }

  const meta = sandbox.POOL_META as PoolConfig['meta']
  const topics = sandbox.TOPICS as PoolConfig['topics']
  const questions = sandbox.QUESTIONS as PoolConfig['questions']

  if (!meta?.id || !questions?.length) {
    throw new Error(`Pool ${dateiname}: Ungültige Struktur (POOL_META oder QUESTIONS fehlen)`)
  }

  return { meta, topics: topics || {}, questions }
}

/** SHA-256 Content-Hash über alle inhaltlich relevanten Felder */
export async function berechneContentHash(frage: PoolFrage): Promise<string> {
  const inhalt = {
    q: frage.q,
    type: frage.type,
    explain: frage.explain,
    options: frage.options,
    correct: frage.correct,
    blanks: frage.blanks,
    rows: frage.rows,
    categories: frage.categories,
    items: frage.items,
    sample: frage.sample,
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(inhalt))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Extrahiert Lernziele aus einem Pool */
export function extrahiereLernziele(config: PoolConfig): Lernziel[] {
  const lernziele: Lernziel[] = []

  // Pool-Level Lernziele
  config.meta.lernziele?.forEach((text, i) => {
    lernziele.push({
      id: `${config.meta.id}_pool_${i}`,
      fach: config.meta.fach,
      poolId: config.meta.id,
      thema: '_pool',
      text,
      bloom: extrahiereBloom(text),
      aktiv: true,
    })
  })

  // Topic-Level Lernziele
  for (const [key, topic] of Object.entries(config.topics)) {
    topic.lernziele?.forEach((text, i) => {
      lernziele.push({
        id: `${config.meta.id}_${key}_${i}`,
        fach: config.meta.fach,
        poolId: config.meta.id,
        thema: key,
        text,
        bloom: extrahiereBloom(text),
        aktiv: true,
      })
    })
  }

  return lernziele
}

/** Extrahiert Bloom-Stufe aus Lernziel-Text, z.B. "(K2)" am Ende */
function extrahiereBloom(text: string): string {
  const match = text.match(/\(K([1-6])\)\s*$/)
  return match ? `K${match[1]}` : ''
}

/** Findet Lernziel-IDs für eine Frage basierend auf Topic-Zugehörigkeit */
export function findeLernzielIds(poolId: string, topic: string, lernziele: Lernziel[]): string[] {
  return lernziele
    .filter(lz => lz.poolId === poolId && (lz.thema === topic || lz.thema === '_pool'))
    .map(lz => lz.id)
}

/** Delta-Berechnung: vergleicht Pool-Fragen mit bestehendem Fragenbank-Bestand */
export async function berechneDelta(
  poolConfigs: PoolConfig[],
  bestehendeFragenMap: Map<string, Frage>
): Promise<{
  neueFragen: Frage[]
  aktualisierteFragen: { frage: Frage; poolVersion: PoolFrage }[]
  unveraendert: number
  lernziele: Lernziel[]
  ergebnisse: PoolSyncErgebnis[]
}> {
  const neueFragen: Frage[] = []
  const aktualisierteFragen: { frage: Frage; poolVersion: PoolFrage }[] = []
  let unveraendert = 0
  const alleLernziele: Lernziel[] = []
  const ergebnisse: PoolSyncErgebnis[] = []

  for (const config of poolConfigs) {
    const lernziele = extrahiereLernziele(config)
    alleLernziele.push(...lernziele)

    let poolNeu = 0
    let poolAktualisiert = 0
    let poolUnveraendert = 0

    for (const poolFrage of config.questions) {
      const compoundId = `${config.meta.id}:${poolFrage.id}`
      const hash = await berechneContentHash(poolFrage)
      const lzIds = findeLernzielIds(config.meta.id, poolFrage.topic, lernziele)
      const bestehend = bestehendeFragenMap.get(compoundId)

      if (!bestehend) {
        // Neue Frage
        const konvertiert = konvertierePoolFrage(poolFrage, config.meta, config.topics, lzIds)
        konvertiert.poolContentHash = hash
        neueFragen.push(konvertiert)
        poolNeu++
      } else if (bestehend.poolContentHash !== hash) {
        // Geänderte Frage — nicht überschreiben, nur Flag setzen
        aktualisierteFragen.push({ frage: bestehend, poolVersion: poolFrage })
        poolAktualisiert++
      } else {
        poolUnveraendert++
      }
    }

    unveraendert += poolUnveraendert
    ergebnisse.push({
      poolId: config.meta.id,
      poolTitle: config.meta.title,
      neu: poolNeu,
      aktualisiert: poolAktualisiert,
      unveraendert: poolUnveraendert,
    })
  }

  return { neueFragen, aktualisierteFragen, unveraendert, lernziele: alleLernziele, ergebnisse }
}
```

- [ ] **Step 2: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/services/poolSync.ts
git commit -m "Pool-Brücke: Sync-Service (Fetch, Parse, Delta, Hash)"
```

---

## Task 5: Apps Script Backend (4 neue Endpoints)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

Referenz: Bestehende `speichereFrage`-Funktion (Zeile ~476) für Sheet-Schreibmuster und `doPost`-Routing (Zeile ~18).

- [ ] **Step 1: Lernziele-Sheet-Konstante und Routing ergänzen**

Am Anfang der Datei (nach den bestehenden Konstanten wie `FRAGENBANK_ID`):
```javascript
// Lernziele-Sheet (gleiche Spreadsheet wie Fragenbank, neuer Tab)
const LERNZIELE_TAB = 'Lernziele';
```

In `doPost`-Routing (nach den bestehenden case-Einträgen):
```javascript
case 'importierePoolFragen': return importierePoolFragen(body);
case 'importiereLernziele': return importiereLernziele(body);
case 'ladeLernziele': return ladeLernziele(body);
```

Im KI-Assistent-Routing (bestehender `kiAssistent` case):
```javascript
case 'generiereFrageZuLernziel': return generiereFrageZuLernziel(daten);
```

- [ ] **Step 2: importierePoolFragen Endpoint**

```javascript
function importierePoolFragen(body) {
  const { email, fragen } = body;
  if (!fragen || !Array.isArray(fragen)) {
    return jsonResponse({ error: 'fragen-Array erforderlich' });
  }

  const fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  let importiert = 0;
  let aktualisiert = 0;
  const fehler = [];

  for (const frage of fragen) {
    try {
      const tabName = frage.fachbereich;
      let sheet = fragenbank.getSheetByName(tabName);
      if (!sheet) {
        sheet = fragenbank.insertSheet(tabName);
        // Header setzen
        const headers = ['id','typ','version','erstelltAm','geaendertAm','thema','unterthema',
          'semester','gefaesse','bloom','tags','punkte','musterlosung','bewertungsraster',
          'fragetext','quelle','anhaenge','typDaten','autor','geteilt','geteiltVon',
          'poolId','poolGeprueft','pruefungstauglich','poolContentHash','poolUpdateVerfuegbar',
          'poolVersion','lernzielIds'];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }

      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const data = sheet.getLastRow() > 1
        ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
        : [];

      // Suche nach bestehender poolId
      const poolIdCol = headers.indexOf('poolId');
      const idCol = headers.indexOf('id');
      const existingRow = data.findIndex(row =>
        (poolIdCol >= 0 && row[poolIdCol] === frage.poolId) ||
        (idCol >= 0 && row[idCol] === frage.id)
      );

      const rowData = erstelleRowData(frage, email);

      if (existingRow >= 0) {
        // Update: nur Pool-Sync-Felder aktualisieren (nicht Inhalt überschreiben)
        const rowIndex = existingRow + 2;
        ['poolUpdateVerfuegbar', 'poolVersion', 'poolGeprueft', 'poolContentHash'].forEach(field => {
          const colIdx = headers.indexOf(field);
          if (colIdx >= 0 && rowData[field] !== undefined) {
            sheet.getRange(rowIndex, colIdx + 1).setValue(rowData[field]);
          }
        });
        aktualisiert++;
      } else {
        // Neue Frage einfügen
        const newRow = headers.map(h => rowData[h] !== undefined ? rowData[h] : '');
        sheet.appendRow(newRow);
        importiert++;
      }
    } catch (e) {
      fehler.push(`${frage.id}: ${e.message}`);
    }
  }

  return jsonResponse({ erfolg: true, importiert, aktualisiert, fehler });
}

function erstelleRowData(frage, email) {
  return {
    id: frage.id,
    typ: frage.typ,
    version: String(frage.version || 1),
    erstelltAm: frage.erstelltAm || new Date().toISOString(),
    geaendertAm: new Date().toISOString(),
    thema: frage.thema || '',
    unterthema: frage.unterthema || '',
    semester: (frage.semester || []).join(','),
    gefaesse: (frage.gefaesse || []).join(','),
    bloom: frage.bloom || '',
    tags: (frage.tags || []).join(','),
    punkte: String(frage.punkte || 0),
    musterlosung: frage.musterlosung || '',
    bewertungsraster: JSON.stringify(frage.bewertungsraster || []),
    fragetext: frage.fragetext || '',
    quelle: frage.quelle || 'pool',
    anhaenge: JSON.stringify(frage.anhaenge || []),
    typDaten: JSON.stringify(getTypDaten(frage)),
    autor: frage.autor || email,
    geteilt: frage.geteilt || 'privat',
    geteiltVon: frage.geteiltVon || '',
    poolId: frage.poolId || '',
    poolGeprueft: String(frage.poolGeprueft || false),
    pruefungstauglich: String(frage.pruefungstauglich || false),
    poolContentHash: frage.poolContentHash || '',
    poolUpdateVerfuegbar: String(frage.poolUpdateVerfuegbar || false),
    poolVersion: frage.poolVersion ? JSON.stringify(frage.poolVersion) : '',
    lernzielIds: (frage.lernzielIds || []).join(','),
  };
}
```

- [ ] **Step 3: importiereLernziele + ladeLernziele Endpoints**

```javascript
function importiereLernziele(body) {
  const { lernziele } = body;
  if (!lernziele || !Array.isArray(lernziele)) {
    return jsonResponse({ error: 'lernziele-Array erforderlich' });
  }

  const fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  let sheet = fragenbank.getSheetByName(LERNZIELE_TAB);
  if (!sheet) {
    sheet = fragenbank.insertSheet(LERNZIELE_TAB);
    sheet.getRange(1, 1, 1, 7).setValues([['id','fach','poolId','thema','text','bloom','aktiv']]);
  }

  const headers = ['id','fach','poolId','thema','text','bloom','aktiv'];
  const data = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    : [];
  const existingIds = new Set(data.map(row => row[0]));

  let neu = 0;
  let aktualisiert = 0;

  for (const lz of lernziele) {
    const row = [lz.id, lz.fach, lz.poolId, lz.thema, lz.text, lz.bloom, String(lz.aktiv !== false)];
    const existingIdx = data.findIndex(r => r[0] === lz.id);

    if (existingIdx >= 0) {
      // Update
      sheet.getRange(existingIdx + 2, 1, 1, headers.length).setValues([row]);
      aktualisiert++;
    } else {
      sheet.appendRow(row);
      neu++;
    }
  }

  return jsonResponse({ erfolg: true, neu, aktualisiert });
}

function ladeLernziele(body) {
  const { fach } = body || {};
  const fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  const sheet = fragenbank.getSheetByName(LERNZIELE_TAB);
  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({ lernziele: [] });
  }

  const headers = ['id','fach','poolId','thema','text','bloom','aktiv'];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

  const lernziele = data
    .map(row => ({
      id: row[0], fach: row[1], poolId: row[2], thema: row[3],
      text: row[4], bloom: row[5], aktiv: row[6] === 'true',
    }))
    .filter(lz => !fach || lz.fach === fach);

  return jsonResponse({ lernziele });
}
```

- [ ] **Step 4: generiereFrageZuLernziel KI-Endpoint**

Im bestehenden `kiAssistent`-Function-Switch-Block hinzufügen:

```javascript
case 'generiereFrageZuLernziel': {
  const { lernziel, bloom, thema, fragetyp } = daten;
  const prompt = `Du bist ein erfahrener Wirtschafts- und Rechtslehrerr am Schweizer Gymnasium.
Erstelle eine Prüfungsfrage zum folgenden Lernziel:

**Lernziel:** ${lernziel}
**Bloom-Stufe:** ${bloom}
**Themenbereich:** ${thema}
**Gewünschter Fragetyp:** ${fragetyp}

Die Frage soll:
- Dem Bloom-Niveau entsprechen (${bloom})
- Für eine summative Prüfung am Gymnasium geeignet sein
- Schweizer Kontext verwenden (CHF, Schweizer Institutionen, Schweizer Recht)
- Klar und eindeutig formuliert sein

Antworte im JSON-Format:
{
  "fragetext": "...",
  "musterlosung": "...",
  "punkte": <Zahl>,
  "schwierigkeit": <1-3>,
  ${fragetyp === 'mc' ? '"optionen": [{"text": "...", "korrekt": true/false}, ...],' : ''}
  ${fragetyp === 'richtigfalsch' ? '"aussagen": [{"text": "...", "korrekt": true/false, "erklaerung": "..."}, ...],' : ''}
  ${fragetyp === 'lueckentext' ? '"textMitLuecken": "... {0} ... {1} ...", "luecken": [{"korrekteAntworten": ["..."]}, ...],' : ''}
  ${fragetyp === 'berechnung' ? '"ergebnisse": [{"label": "...", "korrekt": <Zahl>, "toleranz": <Zahl>, "einheit": "..."}],' : ''}
  "bewertungsraster": [{"beschreibung": "...", "punkte": <Zahl>}, ...]
}`;

  const response = callClaudeAPI(prompt);
  return jsonResponse({ ergebnis: JSON.parse(response) });
}
```

- [ ] **Step 5: Bestehende ladeFragen erweitern**

In der bestehenden `ladeFragenbank`-Funktion: Die neuen Spalten werden automatisch mitgeladen, da die Funktion dynamisch alle Spalten liest. Prüfe, dass die Rückgabe die neuen Felder korrekt parsed:

Im Mapping-Bereich (wo Zeilen zu Objekten konvertiert werden) — suche die Funktion die Sheet-Zeilen zu Frage-Objekten mappt (typischerweise in `ladeFragenbank` oder einer Helper-Funktion wie `parseFrage` / `parseRow`). Dort die neuen Pool-Felder im Basis-Objekt ergänzen:

```javascript
// Pool-Felder (am Ende des Basis-Objekts ergänzen)
poolId: row[headers.indexOf('poolId')] || '',
poolGeprueft: row[headers.indexOf('poolGeprueft')] === 'true',
pruefungstauglich: row[headers.indexOf('pruefungstauglich')] === 'true',
poolContentHash: row[headers.indexOf('poolContentHash')] || '',
poolUpdateVerfuegbar: row[headers.indexOf('poolUpdateVerfuegbar')] === 'true',
poolVersion: safeParseJSON(row[headers.indexOf('poolVersion')]),
lernzielIds: (row[headers.indexOf('lernzielIds')] || '').split(',').filter(Boolean),
```

Wobei `safeParseJSON` eine bestehende oder neue Helper-Funktion ist:
```javascript
function safeParseJSON(str) {
  if (!str) return undefined;
  try { return JSON.parse(str); } catch { return undefined; }
}
```

**Wichtig:** Ohne diese Ergänzung werden Pool-Felder zwar gespeichert, aber beim Laden nicht zurückgegeben — Badges und Update-Erkennung würden nicht funktionieren.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Pool-Brücke: 4 neue Backend-Endpoints (Import, Lernziele, KI)"
```

**Wichtig:** Nach diesem Commit: `apps-script-code.js` in den Apps Script Editor kopieren und neue Bereitstellung erstellen. Ausserdem muss das Lernziele-Tab im Fragenbank-Sheet manuell angelegt werden (Header-Zeile wird beim ersten Import automatisch erstellt, aber das Tab muss existieren). Alternativ: beim ersten `importiereLernziele`-Aufruf wird das Tab automatisch erstellt (Code oben handhabt das).

---

## Task 6: API-Service-Erweiterung (Frontend)

**Files:**
- Modify: `ExamLab/src/services/apiService.ts`

- [ ] **Step 1: 3 neue Methoden in apiService.ts ergänzen**

Nach den bestehenden Methoden (z.B. nach `speichereFrage`) einfügen. Wichtig: `apiService` ist ein Object-Literal (kein `this`), und alle POST-Requests verwenden `Content-Type: text/plain` (wegen CORS/Apps Script). Das bestehende Pattern aus `speichereFrage` übernehmen:

```typescript
/** Batch-Import von Pool-Fragen */
async importierePoolFragen(email: string, fragen: Frage[]): Promise<{ erfolg: boolean; importiert: number; aktualisiert: number; fehler: string[] } | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    const payload = JSON.stringify({ action: 'importierePoolFragen', email, fragen })
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })
    if (!response.ok) return null
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) { console.error('[API] importierePoolFragen:', data.error); return null }
      return data
    } catch { return null }
  } catch (error) {
    console.error('[API] importierePoolFragen: Netzwerkfehler:', error)
    return null
  }
},

/** Batch-Import von Lernzielen */
async importiereLernziele(lernziele: import('../types/pool').Lernziel[]): Promise<{ erfolg: boolean; neu: number; aktualisiert: number } | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    const payload = JSON.stringify({ action: 'importiereLernziele', lernziele })
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })
    if (!response.ok) return null
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) { console.error('[API] importiereLernziele:', data.error); return null }
      return data
    } catch { return null }
  } catch (error) {
    console.error('[API] importiereLernziele: Netzwerkfehler:', error)
    return null
  }
},

/** Lernziele laden (optional nach Fach gefiltert) */
async ladeLernziele(fach?: string): Promise<import('../types/pool').Lernziel[]> {
  if (!APPS_SCRIPT_URL) return []
  try {
    const payload = JSON.stringify({ action: 'ladeLernziele', fach })
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })
    if (!response.ok) return []
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return data?.lernziele || []
    } catch { return [] }
  } catch {
    return []
  }
},
```

Hinweis: `generiereFrageZuLernziel` läuft über den bestehenden `kiAssistent`-Endpoint und braucht keine eigene Methode — wird über `useKIAssistent` aufgerufen.

- [ ] **Step 2: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/services/apiService.ts
git commit -m "Pool-Brücke: API-Client-Methoden für Pool-Import und Lernziele"
```

---

## Task 7: Sync-Dialog-Komponente

**Files:**
- Create: `ExamLab/src/components/lp/PoolSyncDialog.tsx`

- [ ] **Step 1: PoolSyncDialog.tsx erstellen**

```tsx
// ExamLab/src/components/lp/PoolSyncDialog.tsx
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { ladePoolIndex, ladePoolConfig, berechneDelta } from '../../services/poolSync'
import { erzeugeSnapshot } from '../../utils/poolConverter'
import { apiService } from '../../services/apiService'
import type { Frage } from '../../types/fragen'
import type { PoolConfig, PoolSyncErgebnis } from '../../types/pool'

interface Props {
  offen: boolean
  onSchliessen: () => void
  bestehendeFragen: Frage[]
  onImportAbgeschlossen: () => void  // Callback um Fragenbank neu zu laden
}

type SyncPhase = 'idle' | 'laden' | 'vorschau' | 'importieren' | 'fertig' | 'fehler'

export default function PoolSyncDialog({ offen, onSchliessen, bestehendeFragen, onImportAbgeschlossen }: Props) {
  const user = useAuthStore(s => s.user)
  const [phase, setPhase] = useState<SyncPhase>('idle')
  const [fortschritt, setFortschritt] = useState('')
  const [ergebnisse, setErgebnisse] = useState<PoolSyncErgebnis[]>([])
  const [neuAnzahl, setNeuAnzahl] = useState(0)
  const [updateAnzahl, setUpdateAnzahl] = useState(0)
  const [unveraendertAnzahl, setUnveraendertAnzahl] = useState(0)
  const [fehlerText, setFehlerText] = useState('')
  // Delta-Daten für Import
  const [importDaten, setImportDaten] = useState<{ neueFragen: Frage[]; lernziele: unknown[] } | null>(null)

  const startSync = useCallback(async () => {
    setPhase('laden')
    setFehlerText('')

    try {
      // 1. Index laden
      setFortschritt('Lade Pool-Index...')
      const index = await ladePoolIndex()

      // 2. Alle Pools laden
      const configs: PoolConfig[] = []
      const poolFehler: PoolSyncErgebnis[] = []

      for (let i = 0; i < index.length; i++) {
        const eintrag = index[i]
        setFortschritt(`Lade Pool ${i + 1}/${index.length}: ${eintrag.title}...`)
        try {
          const config = await ladePoolConfig(eintrag.file)
          configs.push(config)
        } catch (e) {
          poolFehler.push({
            poolId: eintrag.id,
            poolTitle: eintrag.title,
            neu: 0, aktualisiert: 0, unveraendert: 0,
            fehler: e instanceof Error ? e.message : String(e),
          })
        }
      }

      // 3. Delta berechnen
      setFortschritt('Berechne Änderungen...')
      const fragenMap = new Map(
        bestehendeFragen
          .filter(f => f.poolId)
          .map(f => [f.poolId!, f])
      )
      const delta = await berechneDelta(configs, fragenMap)

      // Ergebnis setzen
      setErgebnisse([...delta.ergebnisse, ...poolFehler])
      setNeuAnzahl(delta.neueFragen.length)
      setUpdateAnzahl(delta.aktualisierteFragen.length)
      setUnveraendertAnzahl(delta.unveraendert)
      setImportDaten({ neueFragen: delta.neueFragen, lernziele: delta.lernziele })

      // Für aktualisierte Fragen: poolUpdateVerfuegbar + poolVersion setzen
      for (const { frage, poolVersion } of delta.aktualisierteFragen) {
        frage.poolUpdateVerfuegbar = true
        frage.poolVersion = erzeugeSnapshot(poolVersion)
      }

      setPhase('vorschau')
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : String(e))
      setPhase('fehler')
    }
  }, [bestehendeFragen])

  const handleImport = useCallback(async () => {
    if (!importDaten || !user) return
    setPhase('importieren')

    try {
      setFortschritt('Importiere Fragen...')
      const fragenResult = await apiService.importierePoolFragen(user.email, importDaten.neueFragen)
      if (!fragenResult?.erfolg) {
        throw new Error('Fragen-Import fehlgeschlagen')
      }

      setFortschritt('Importiere Lernziele...')
      await apiService.importiereLernziele(importDaten.lernziele as import('../../types/pool').Lernziel[])

      setPhase('fertig')
      onImportAbgeschlossen()
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : String(e))
      setPhase('fehler')
    }
  }, [importDaten, user, onImportAbgeschlossen])

  if (!offen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Pools synchronisieren</h2>

        {phase === 'idle' && (
          <div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Übungspools von GitHub Pages laden und mit der Fragenbank abgleichen.
              Neue Fragen werden importiert, geänderte Fragen als "Update verfügbar" markiert.
            </p>
            <div className="flex gap-3">
              <button onClick={startSync}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500">
                Synchronisierung starten
              </button>
              <button onClick={onSchliessen}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {phase === 'laden' && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300">{fortschritt}</p>
          </div>
        )}

        {phase === 'vorschau' && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/30 rounded p-3 text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{neuAnzahl}</div>
                <div className="text-sm text-green-600 dark:text-green-500">Neue Fragen</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-3 text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{updateAnzahl}</div>
                <div className="text-sm text-blue-600 dark:text-blue-500">Updates verfügbar</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{unveraendertAnzahl}</div>
                <div className="text-sm text-slate-500">Unverändert</div>
              </div>
            </div>

            {/* Pro-Pool Aufschlüsselung */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700">
                Details pro Pool ({ergebnisse.length} Pools)
              </summary>
              <div className="mt-2 max-h-48 overflow-auto">
                {ergebnisse.map(e => (
                  <div key={e.poolId} className="flex items-center gap-2 py-1 text-sm border-b border-slate-100 dark:border-slate-700">
                    <span className="flex-1 dark:text-slate-300">{e.poolTitle}</span>
                    {e.fehler ? (
                      <span className="text-red-500 text-xs">{e.fehler}</span>
                    ) : (
                      <>
                        {e.neu > 0 && <span className="text-green-600 dark:text-green-400">+{e.neu}</span>}
                        {e.aktualisiert > 0 && <span className="text-blue-600 dark:text-blue-400">↻{e.aktualisiert}</span>}
                        {e.neu === 0 && e.aktualisiert === 0 && <span className="text-slate-400">✓</span>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>

            <div className="flex gap-3">
              {neuAnzahl > 0 && (
                <button onClick={handleImport}
                  className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500">
                  {neuAnzahl} Fragen importieren
                </button>
              )}
              <button onClick={onSchliessen}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                {neuAnzahl === 0 ? 'Schliessen' : 'Abbrechen'}
              </button>
            </div>
          </div>
        )}

        {phase === 'importieren' && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300">{fortschritt}</p>
          </div>
        )}

        {phase === 'fertig' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-lg font-medium dark:text-white mb-2">Synchronisierung abgeschlossen</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {neuAnzahl} Fragen importiert, {updateAnzahl} Updates markiert
            </p>
            <button onClick={onSchliessen}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500">
              Schliessen
            </button>
          </div>
        )}

        {phase === 'fehler' && (
          <div>
            <p className="text-red-500 mb-4">{fehlerText}</p>
            <div className="flex gap-3">
              <button onClick={startSync}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500">
                Erneut versuchen
              </button>
              <button onClick={onSchliessen}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                Schliessen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/lp/PoolSyncDialog.tsx
git commit -m "Pool-Brücke: Sync-Dialog mit Fortschritt und Vorschau"
```

---

## Task 8: LPStartseite — Sync-Button einbauen

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

- [ ] **Step 1: State und Import ergänzen**

Am Anfang von `LPStartseite.tsx`:
```typescript
import PoolSyncDialog from './PoolSyncDialog'
```

Im Component-Body (neben bestehenden State-Hooks):
```typescript
const [zeigSyncDialog, setZeigSyncDialog] = useState(false)
```

- [ ] **Step 2: Sync-Button in Header einfügen**

Im `ansichtsButtons`-Prop von `<LPHeader>` (neben "+ Neue Prüfung"):
```tsx
<button
  onClick={() => setZeigSyncDialog(true)}
  title="Übungspools synchronisieren"
  className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
>
  ↻ Pools sync
</button>
```

- [ ] **Step 3: PoolSyncDialog im JSX einfügen**

Am Ende des Component-Returns (vor dem schliessenden Fragment/div):
```tsx
<PoolSyncDialog
  offen={zeigSyncDialog}
  onSchliessen={() => setZeigSyncDialog(false)}
  bestehendeFragen={alleFragen}
  onImportAbgeschlossen={() => {
    // Fragenbank neu laden
    ladeFragen()
  }}
/>
```

Hinweis: `alleFragen` und `ladeFragen` müssen ggf. aus dem Kontext verfügbar gemacht werden — prüfe ob die LPStartseite bereits Zugriff auf die Fragenbank hat (via Props, Store oder API-Call).

- [ ] **Step 4: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "Pool-Brücke: Sync-Button auf LP-Startseite"
```

---

## Task 9: FragenBrowser — Badges und Filter

**Files:**
- Modify: `ExamLab/src/components/lp/FragenBrowser.tsx`

Achtung: Datei ist bereits 786 Zeilen — Änderungen gezielt und minimal halten.

- [ ] **Step 1: Badge-Komponente für Pool-Status hinzufügen**

Am Anfang der Datei (nach Imports, vor dem Hauptcomponent) eine lokale Helper-Funktion:

```tsx
function PoolBadges({ frage }: { frage: Frage }) {
  if (frage.quelle !== 'pool') return null
  return (
    <span className="inline-flex gap-1">
      {frage.poolUpdateVerfuegbar && (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse">
          Update
        </span>
      )}
      {frage.pruefungstauglich ? (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          Prüfungstauglich
        </span>
      ) : frage.poolGeprueft ? (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
          Pool ✓
        </span>
      ) : (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
          Pool / ungeprüft
        </span>
      )}
    </span>
  )
}
```

- [ ] **Step 2: Filter-State ergänzen**

Im Hauptcomponent, neben den bestehenden Filter-States:
```typescript
const [filterQuelle, setFilterQuelle] = useState<'alle' | 'eigene' | 'pool'>('alle')
const [filterPoolStatus, setFilterPoolStatus] = useState<'alle' | 'ungeprueft' | 'pool_geprueft' | 'pruefungstauglich' | 'update'>('alle')
```

- [ ] **Step 3: Filter-Dropdowns im UI einfügen**

Im Filter-Bereich (nach den bestehenden Dropdowns, z.B. nach Bloom-Filter):

```tsx
{/* Quelle */}
<select value={filterQuelle} onChange={e => setFilterQuelle(e.target.value as typeof filterQuelle)}
  className="px-2 py-1 text-sm border border-slate-300 rounded dark:border-slate-600 dark:bg-slate-700 dark:text-white">
  <option value="alle">Alle Quellen</option>
  <option value="eigene">Eigene</option>
  <option value="pool">Pool</option>
</select>

{/* Pool-Status (nur sichtbar wenn Quelle = pool oder alle) */}
{filterQuelle !== 'eigene' && (
  <select value={filterPoolStatus} onChange={e => setFilterPoolStatus(e.target.value as typeof filterPoolStatus)}
    className="px-2 py-1 text-sm border border-slate-300 rounded dark:border-slate-600 dark:bg-slate-700 dark:text-white">
    <option value="alle">Alle Status</option>
    <option value="ungeprueft">Ungeprüft</option>
    <option value="pool_geprueft">Pool ✓</option>
    <option value="pruefungstauglich">Prüfungstauglich</option>
    <option value="update">Update verfügbar</option>
  </select>
)}
```

- [ ] **Step 4: Filter-Logik in useMemo ergänzen**

Im bestehenden `useMemo` für gefilterte Fragen (wo Fachbereich, Typ, Bloom gefiltert werden) ergänzen:

```typescript
// Quelle-Filter
if (filterQuelle === 'eigene') {
  gefiltert = gefiltert.filter(f => f.quelle !== 'pool')
} else if (filterQuelle === 'pool') {
  gefiltert = gefiltert.filter(f => f.quelle === 'pool')
}

// Pool-Status-Filter
if (filterPoolStatus !== 'alle') {
  gefiltert = gefiltert.filter(f => {
    if (f.quelle !== 'pool') return false
    switch (filterPoolStatus) {
      case 'ungeprueft': return !f.poolGeprueft && !f.pruefungstauglich
      case 'pool_geprueft': return f.poolGeprueft && !f.pruefungstauglich
      case 'pruefungstauglich': return f.pruefungstauglich
      case 'update': return f.poolUpdateVerfuegbar
      default: return true
    }
  })
}
```

- [ ] **Step 5: PoolBadges in KompaktZeile und DetailKarte einbauen**

In `KompaktZeile` (nach dem Fachbereich-Badge):
```tsx
<PoolBadges frage={frage} />
```

In `DetailKarte` (nach dem Fachbereich-Badge):
```tsx
<PoolBadges frage={frage} />
```

- [ ] **Step 6: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/lp/FragenBrowser.tsx
git commit -m "Pool-Brücke: Badges + Filter (Quelle, Status) im FragenBrowser"
```

---

## Task 10: FragenEditor — Pool-Info, Absegnen, Update-Vergleich

**Files:**
- Modify: `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx`

Achtung: Datei ist bereits 1212 Zeilen (über Limit). Änderungen minimal halten — kein neuer Abschnitt über 50 Zeilen. Bei Bedarf Update-Vergleich als eigene Komponente extrahieren.

- [ ] **Step 1: Pool-Info-Leiste am Anfang des Editors einfügen**

Im Editor-JSX, direkt nach dem Header/Titel-Bereich (und vor den Abschnitten):

```tsx
{/* Pool-Info für importierte Fragen */}
{frage?.quelle === 'pool' && frage.poolId && (
  <div className="mx-4 mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-300">
        Importiert aus Pool: <strong>{frage.quellReferenz || frage.poolId}</strong>
      </span>
      <div className="flex gap-2">
        {!frage.pruefungstauglich && (
          <button
            onClick={() => {
              // Setze pruefungstauglich und speichere
              const aktualisiert = { ...frage, pruefungstauglich: true, geaendertAm: new Date().toISOString() }
              onSpeichern(aktualisiert)
            }}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Prüfungstauglich ✓
          </button>
        )}
        {frage.pruefungstauglich && (
          <span className="px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded">
            ✓ Prüfungstauglich
          </span>
        )}
      </div>
    </div>

    {/* Update-Vergleich */}
    {frage.poolUpdateVerfuegbar && frage.poolVersion && (
      <PoolUpdateVergleich
        frage={frage}
        onUebernehmen={() => {
          // Pool-Version übernehmen → muss Frage-Felder aktualisieren
          // Vereinfacht: poolUpdateVerfuegbar zurücksetzen
          onSpeichern({ ...frage, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() })
        }}
        onIgnorieren={() => {
          onSpeichern({ ...frage, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() })
        }}
      />
    )}
  </div>
)}
```

- [ ] **Step 2: PoolUpdateVergleich als eigene Komponente erstellen**

Neue Datei `ExamLab/src/components/lp/frageneditor/PoolUpdateVergleich.tsx`:

```tsx
import { useState } from 'react'
import type { Frage } from '../../../types/fragen'

interface Props {
  frage: Frage
  onUebernehmen: () => void
  onIgnorieren: () => void
}

export default function PoolUpdateVergleich({ frage, onUebernehmen, onIgnorieren }: Props) {
  const [offen, setOffen] = useState(false)
  const pv = frage.poolVersion

  if (!pv) return null

  return (
    <div className="mt-2 border-t border-slate-200 dark:border-slate-600 pt-2">
      <button
        onClick={() => setOffen(!offen)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
      >
        <span className="animate-pulse">●</span>
        Pool-Update verfügbar — {offen ? 'zuklappen' : 'vergleichen'}
      </button>

      {offen && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium text-slate-500 dark:text-slate-400 mb-1">Aktuelle Version</div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                {'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''}
              </div>
            </div>
            <div>
              <div className="font-medium text-slate-500 dark:text-slate-400 mb-1">Pool-Version</div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 whitespace-pre-wrap">
                {pv.fragetext}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onUebernehmen}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Übernehmen
            </button>
            <button onClick={onIgnorieren}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Ignorieren
            </button>
            <button onClick={() => setOffen(false)}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Vergleich zuklappen — editiere die Frage manuell, die Pool-Version bleibt über den Vergleich-Link erreichbar">
              Manuell anpassen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Import in FragenEditor.tsx**

```typescript
import PoolUpdateVergleich from './PoolUpdateVergleich'
```

- [ ] **Step 4: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/frageneditor/FragenEditor.tsx ExamLab/src/components/lp/frageneditor/PoolUpdateVergleich.tsx
git commit -m "Pool-Brücke: Pool-Info, Absegnen-Button, Update-Vergleich im Editor"
```

---

## Task 11: KI-Assistent — Lernziel-Generierung

**Files:**
- Modify: `ExamLab/src/components/lp/frageneditor/useKIAssistent.ts`
- Modify: `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` (Button im UI)

- [ ] **Step 1: Neue Aktion in useKIAssistent.ts**

Im `AktionKey`-Union-Typ ergänzen:
```typescript
| 'generiereFrageZuLernziel'
```

- [ ] **Step 2: Lernziel-Button im FragenEditor**

Im KI-Assistenten-Bereich des FragenEditors einen neuen Button ergänzen. Dieser braucht Zugriff auf Lernziele — lade sie via `apiService.ladeLernziele()`:

```tsx
{/* Lernziel-basierte Generierung */}
<button
  onClick={async () => {
    // Lernziele laden (bei erstem Klick)
    if (!lernziele.length) {
      const lz = await apiService.ladeLernziele(fachbereich)
      setLernziele(lz)
    }
    setZeigLernzielDialog(true)
  }}
  title="Frage zu einem Lernziel generieren lassen"
  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
>
  🎯 Lernziel → Frage
</button>
```

Dazu State:
```typescript
const [lernziele, setLernziele] = useState<import('../../../types/pool').Lernziel[]>([])
const [zeigLernzielDialog, setZeigLernzielDialog] = useState(false)
const [gewaehlterLernzielId, setGewaehlterLernzielId] = useState('')
```

Und ein einfacher Dialog (inline oder als eigene Komponente wenn >50 Zeilen):
```tsx
{zeigLernzielDialog && (
  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600">
    <label className="block text-sm font-medium mb-1 dark:text-white">Lernziel auswählen:</label>
    <select
      value={gewaehlterLernzielId}
      onChange={e => setGewaehlterLernzielId(e.target.value)}
      className="w-full px-2 py-1 text-sm border border-slate-300 rounded mb-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
    >
      <option value="">— Lernziel wählen —</option>
      {lernziele.map(lz => (
        <option key={lz.id} value={lz.id}>{lz.text} ({lz.bloom})</option>
      ))}
    </select>
    <div className="flex gap-2">
      <button
        disabled={!gewaehlterLernzielId || ladeAktion === 'generiereFrageZuLernziel'}
        onClick={() => {
          const lz = lernziele.find(l => l.id === gewaehlterLernzielId)
          if (lz) {
            ausfuehren('generiereFrageZuLernziel', {
              lernziel: lz.text, bloom: lz.bloom || bloom,
              thema: lz.thema, fragetyp: typ,
            })
          }
        }}
        className="px-3 py-1 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-600"
      >
        {ladeAktion === 'generiereFrageZuLernziel' ? 'Generiert...' : 'Generieren'}
      </button>
      <button onClick={() => setZeigLernzielDialog(false)}
        className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
        Abbrechen
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 3: KI-Ergebnis in Editor-Felder übernehmen**

Im bestehenden Ergebnis-Handling (wo KI-Ergebnisse angezeigt werden), für die neue Aktion die generierten Felder in den Editor-State übertragen.

- [ ] **Step 4: Build prüfen**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/frageneditor/useKIAssistent.ts ExamLab/src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "Pool-Brücke: KI-Lernziel-Generierung im FragenEditor"
```

---

## Task 12: Integration-Test und HANDOFF aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: Manueller E2E-Test**

Checkliste:
1. `cd ExamLab && npm run dev` → App startet
2. LP-Login → LP-Startseite zeigt "↻ Pools sync" Button
3. Klick auf Sync → Dialog öffnet, "Synchronisierung starten" klicken
4. Fortschritt: Pools werden geladen (26 Stück)
5. Vorschau: Anzahl neue Fragen, Updates, unverändert
6. "Importieren" klicken → Fragen werden gespeichert
7. Fragenbank öffnen → Pool-Fragen mit Badges sichtbar
8. Filter "Quelle: Pool" → zeigt nur Pool-Fragen
9. Pool-Frage öffnen → Info-Leiste + "Prüfungstauglich"-Button
10. "Prüfungstauglich ✓" klicken → Badge wechselt zu grün
11. KI-Assistent → "🎯 Lernziel → Frage" → Lernziel auswählen → Frage generieren

- [ ] **Step 2: HANDOFF.md aktualisieren**

Pool-Brücke-Feature in "Letzte Änderungen" und "Was funktioniert" ergänzen:

```markdown
### Pool-Brücke (Datum)
- Pool-Sync: 26 Übungspools → Fragenbank importieren (Batch via Apps Script)
- Zwei Review-Flags: poolGeprueft (aus Pool) + pruefungstauglich (LP-Absegnung)
- Badges im FragenBrowser: Pool/ungeprüft (rot), Pool ✓ (gelb), Prüfungstauglich (grün), Update (blau)
- Filter: Quelle (Alle/Eigene/Pool), Status (Ungeprüft/Pool ✓/Prüfungstauglich/Update)
- Update-Vergleich: Aufklappbarer Vergleich im Editor, Übernehmen/Ignorieren/Manuell anpassen
- Lernziel-Datenbank: Lernziele aus Pools in separatem Sheet, KI-Generierung zu Lernzielen
- 4 neue Backend-Endpoints: importierePoolFragen, importiereLernziele, ladeLernziele, generiereFrageZuLernziel
```

Neue Einträge in Verzeichnisstruktur:
```
│   ├── services/
│   │   ├── poolSync.ts               — Pool-Fetch, Parse, Delta, Hash
│   ├── utils/
│   │   ├── poolConverter.ts          — Typ-Konvertierung Pool→Prüfungstool
│   ├── types/
│   │   ├── pool.ts                    — Pool-spezifische TypeScript-Typen
│   ├── components/
│   │   ├── lp/
│   │   │   ├── PoolSyncDialog.tsx    — Sync-UI mit Fortschritt und Vorschau
│   │   │   ├── frageneditor/
│   │   │   │   ├── PoolUpdateVergleich.tsx — Update-Vergleich im Editor
```

- [ ] **Step 3: Commit + Push**

```bash
git add -A
git commit -m "Pool-Brücke: Integration abgeschlossen, HANDOFF aktualisiert"
git push
```

**Wichtig — Manuelle Schritte nach Push:**
1. `apps-script-code.js` in Apps Script Editor kopieren
2. Neue Bereitstellung erstellen (Stift → Neue Version)
3. Lernziele-Tab wird beim ersten Sync automatisch erstellt
4. Neue Spalten im Fragenbank-Sheet werden beim ersten Import automatisch ergänzt (bestehende Zeilen haben leere Werte für die neuen Spalten)
