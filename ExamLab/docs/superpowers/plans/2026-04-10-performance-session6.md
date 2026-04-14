# Session 6 — Performance + Problem-Melden Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LP-Ladezeit drastisch reduzieren (IndexedDB-Cache), Skeleton-UIs einbauen, Feedback-Kontext automatisch erweitern, Hintergrund-Prefetching.

**Architecture:** IndexedDB Stale-While-Revalidate Cache für Fragenbank (grösster Bottleneck), Skeleton-Komponenten für sofortige visuelle Rückmeldung, erweiterter FeedbackContext mit Auto-Population aus Stores.

**Tech Stack:** React 19, TypeScript, Zustand, IndexedDB (native API), Vite, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-04-10-performance-session6-design.md`

**Branch:** `feature/performance-features` (Basis: `feature/ux-polish-session5`)

---

## File Structure

### Neue Dateien
| Datei | Verantwortung |
|-------|---------------|
| `src/services/fragenbankCache.ts` | IndexedDB Cache-Layer für Fragenbank (Summaries + Details) |
| `src/components/lp/LPSkeleton.tsx` | Skeleton-UI für LP-Dashboard beim Laden |

### Geänderte Dateien
| Datei | Änderung |
|-------|----------|
| `src/store/fragenbankStore.ts` | Stale-While-Revalidate in `lade()`, Cache-Invalidierung in Mutationen, `clearCache()` in `reset()` |
| `src/components/lp/LPStartseite.tsx` | Skeleton einbinden, Sync-Guard, Prefetch-Trigger |
| `src/components/sus/SuSStartseite.tsx` | Skeleton erweitern mit Karten-Platzhaltern |
| `src/components/shared/FeedbackModal.tsx` | `FeedbackContext` erweitern, neue Felder im Payload |
| `src/components/lp/LPHeader.tsx` | FeedbackButton-Kontext erweitern |
| `src/components/ueben/layout/AppShell.tsx` | FeedbackButton-Kontext erweitern |
| `src/components/lp/korrektur/KorrekturFragenAnsicht.tsx` | FeedbackButton-Kontext erweitern |
| `src/components/sus/KorrekturEinsicht.tsx` | FeedbackButton-Kontext erweitern |
| `src/components/Startbildschirm.tsx` | FeedbackButton-Kontext erweitern |

---

## Task 1: Branch erstellen

**Files:** keine

- [ ] **Step 1: Neuen Feature-Branch erstellen**

```bash
cd ExamLab
git checkout feature/ux-polish-session5
git checkout -b feature/performance-features
```

- [ ] **Step 2: Build verifizieren**

```bash
npx tsc -b && npx vitest run && npm run build
```

Expected: Alles grün (209+ Tests)

- [ ] **Step 3: Commit (leer, Branch-Marker)**

Kein Commit nötig — Branch existiert.

---

## Task 2: IndexedDB Cache-Layer (`fragenbankCache.ts`)

**Files:**
- Create: `src/services/fragenbankCache.ts`

- [ ] **Step 1: Cache-Service erstellen**

```typescript
// src/services/fragenbankCache.ts
import type { Frage, FrageSummary } from '../types/fragen.ts'

const IDB_NAME = 'examlab-fragenbank-cache'
const IDB_VERSION = 1
const STORE_SUMMARIES = 'summaries'
const STORE_DETAILS = 'details'
const STORE_META = 'meta'

// Cache-Gültigkeit: 10 Minuten (Multi-Teacher)
const CACHE_MAX_AGE_MS = 10 * 60 * 1000

interface CacheMeta {
  key: string
  timestamp: string
  count: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_SUMMARIES)) {
        db.createObjectStore(STORE_SUMMARIES)
      }
      if (!db.objectStoreNames.contains(STORE_DETAILS)) {
        db.createObjectStore(STORE_DETAILS)
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Summaries aus Cache lesen. Gibt null zurück wenn Cache leer oder abgelaufen. */
export async function getCachedSummaries(): Promise<FrageSummary[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_SUMMARIES, STORE_META], 'readonly')

    // Meta prüfen
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), 'summaries')
    if (!meta || !isCacheValid(meta)) return null

    // Daten laden
    const data = await idbGet<FrageSummary[]>(tx.objectStore(STORE_SUMMARIES), 'data')
    return data || null
  } catch {
    return null
  }
}

/** Summaries in Cache schreiben. Fehler werden silent ignoriert. */
export async function setCachedSummaries(summaries: FrageSummary[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_SUMMARIES, STORE_META], 'readwrite')
    tx.objectStore(STORE_SUMMARIES).put(summaries, 'data')
    tx.objectStore(STORE_META).put({
      key: 'summaries',
      timestamp: new Date().toISOString(),
      count: summaries.length,
    } satisfies CacheMeta, 'summaries')
  } catch {
    // Silent — App funktioniert ohne Cache
  }
}

/** Details aus Cache lesen. Gibt null zurück wenn leer/abgelaufen. */
export async function getCachedDetails(): Promise<Frage[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DETAILS, STORE_META], 'readonly')
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), 'details')
    if (!meta || !isCacheValid(meta)) return null
    const data = await idbGet<Frage[]>(tx.objectStore(STORE_DETAILS), 'data')
    return data || null
  } catch {
    return null
  }
}

/** Details in Cache schreiben. */
export async function setCachedDetails(details: Frage[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DETAILS, STORE_META], 'readwrite')
    tx.objectStore(STORE_DETAILS).put(details, 'data')
    tx.objectStore(STORE_META).put({
      key: 'details',
      timestamp: new Date().toISOString(),
      count: details.length,
    } satisfies CacheMeta, 'details')
  } catch {
    // Silent
  }
}

/** Gesamten Fragenbank-Cache leeren (Logout, Invalidierung). */
export async function clearFragenbankCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_SUMMARIES, STORE_DETAILS, STORE_META], 'readwrite')
    tx.objectStore(STORE_SUMMARIES).clear()
    tx.objectStore(STORE_DETAILS).clear()
    tx.objectStore(STORE_META).clear()
  } catch {
    // Silent
  }
}

// --- Helpers ---

function isCacheValid(meta: CacheMeta): boolean {
  const age = Date.now() - new Date(meta.timestamp).getTime()
  return age < CACHE_MAX_AGE_MS
}

function idbGet<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}
```

- [ ] **Step 2: TypeScript prüfen**

```bash
npx tsc -b
```

Expected: 0 Errors

- [ ] **Step 3: Commit**

```bash
git add src/services/fragenbankCache.ts
git commit -m "feat: IndexedDB Cache-Layer für Fragenbank"
```

---

## Task 3: Stale-While-Revalidate in fragenbankStore

**Files:**
- Modify: `src/store/fragenbankStore.ts:1-344`

- [ ] **Step 1: Import hinzufügen**

Am Anfang der Datei (nach Zeile 3):

```typescript
import {
  getCachedSummaries, setCachedSummaries,
  getCachedDetails, setCachedDetails,
  clearFragenbankCache
} from '../services/fragenbankCache.ts'
```

- [ ] **Step 2: `cacheInvalid` Flag zum Store hinzufügen**

In `FragenbankStore` Interface (nach Zeile 23, vor `ladeSummaries`):

```typescript
/** True wenn lokale Mutationen den Cache invalidiert haben */
_cacheInvalid: boolean
```

Im Store-Initializer (nach `status: 'idle'`):

```typescript
_cacheInvalid: false,
```

- [ ] **Step 3: `lade()` mit Cache-Support umschreiben**

Die `lade()` Funktion (Zeile 136–213) ersetzen durch:

```typescript
lade: async (email: string, force = false) => {
  const { status, _cacheInvalid } = get()
  if (status === 'summary_laden' || status === 'detail_laden') return
  if ((status === 'fertig' || status === 'summary_fertig') && !force) return

  set({ status: 'summary_laden' })

  // --- Stale-While-Revalidate: Cache zuerst ---
  if (!force && !_cacheInvalid) {
    const cachedSummaries = await getCachedSummaries()
    if (cachedSummaries && cachedSummaries.length > 0) {
      // Cache-Hit: sofort anzeigen
      const gesehen = new Set<string>()
      const eindeutig = cachedSummaries.filter((s: FrageSummary) => {
        if (gesehen.has(s.id)) return false
        gesehen.add(s.id)
        return true
      })
      set({
        summaries: eindeutig,
        summaryMap: bauSummaryMap(eindeutig),
        status: 'summary_fertig',
      })

      // Cached Details auch laden wenn vorhanden
      const cachedDetails = await getCachedDetails()
      if (cachedDetails && cachedDetails.length > 0) {
        const dGesehen = new Set<string>()
        const dEindeutig = cachedDetails.filter((f: Frage) => {
          if (dGesehen.has(f.id)) return false
          dGesehen.add(f.id)
          return true
        })
        set({
          fragen: dEindeutig,
          fragenMap: bauFragenMap(dEindeutig),
          detailCache: bauFragenMap(dEindeutig),
          status: 'fertig',
        })
      }

      // Hintergrund-Revalidierung: Server-Daten holen OHNE Status zu ändern
      // (kein ladeSummaries() aufrufen, da das status auf 'summary_laden' setzt → UI-Flicker)
      ladeFragenbankSummary(email).then(serverSummaries => {
        if (!serverSummaries) return
        const sGesehen = new Set<string>()
        const sEindeutig = serverSummaries.filter((s: FrageSummary) => {
          if (sGesehen.has(s.id)) return false
          sGesehen.add(s.id)
          return true
        })
        // Nur updaten wenn sich was geändert hat (Anzahl als Heuristik)
        const currentCount = get().summaries.length
        if (sEindeutig.length !== currentCount) {
          set({ summaries: sEindeutig, summaryMap: bauSummaryMap(sEindeutig) })
        }
        setCachedSummaries(sEindeutig)
        // Details auch im Hintergrund aktualisieren
        get().ladeAlleDetails(email)
      })
      return
    }
  }

  // --- Kein Cache: normal vom Server laden ---
  set({ _cacheInvalid: false })

  const summaryResult = await ladeFragenbankSummary(email)
  if (summaryResult) {
    const gesehen = new Set<string>()
    const eindeutig = summaryResult.filter((s: FrageSummary) => {
      if (gesehen.has(s.id)) return false
      gesehen.add(s.id)
      return true
    })
    set({
      summaries: eindeutig,
      summaryMap: bauSummaryMap(eindeutig),
      status: 'summary_fertig',
    })
    // In Cache schreiben
    setCachedSummaries(eindeutig)
    // Details im Hintergrund
    get().ladeAlleDetails(email)
    return
  }

  // Fallback: Alles auf einmal
  const result = await ladeFragenbank(email)
  if (result) {
    const gesehen = new Set<string>()
    const eindeutig = result.filter((f: Frage) => {
      if (gesehen.has(f.id)) return false
      gesehen.add(f.id)
      return true
    })
    const summaries: FrageSummary[] = eindeutig.map(f => ({
      id: f.id, typ: f.typ, fachbereich: f.fachbereich,
      thema: f.thema, unterthema: f.unterthema,
      fragetext: (f as any).fragetext?.substring(0, 200) || '',
      bloom: f.bloom, punkte: f.punkte, tags: f.tags,
      quelle: f.quelle, autor: f.autor, erstelltVon: f.autor,
      erstelltAm: f.erstelltAm, geteilt: f.geteilt, geteiltVon: f.geteiltVon,
      poolId: f.poolId, poolGeprueft: f.poolGeprueft,
      pruefungstauglich: f.pruefungstauglich,
      poolUpdateVerfuegbar: f.poolUpdateVerfuegbar,
      hatAnhang: Array.isArray(f.anhaenge) && f.anhaenge.length > 0,
      hatMaterial: false, fach: f.fach, berechtigungen: f.berechtigungen,
      _recht: f._recht, lernzielIds: f.lernzielIds,
      semester: f.semester, gefaesse: f.gefaesse,
    }))
    set({
      fragen: eindeutig, fragenMap: bauFragenMap(eindeutig),
      detailCache: bauFragenMap(eindeutig),
      summaries, summaryMap: bauSummaryMap(summaries),
      status: 'fertig',
    })
    // Cache befüllen
    setCachedSummaries(summaries)
    setCachedDetails(eindeutig)
  } else {
    set({ status: 'fehler' })
  }
},
```

- [ ] **Step 4: `ladeSummaries()` — Cache schreiben nach Server-Load**

In `ladeSummaries` (Zeile 68–90), nach dem `set({...})` auf Zeile 82–86 hinzufügen:

```typescript
// Cache aktualisieren
setCachedSummaries(eindeutig)
```

- [ ] **Step 5: `ladeAlleDetails()` — Cache schreiben**

In `ladeAlleDetails` (Zeile 111–134), nach dem `set({...})` auf Zeile 125–131 hinzufügen:

```typescript
// Cache aktualisieren
setCachedDetails(eindeutig)
```

- [ ] **Step 6: Cache-Invalidierung in Mutationen**

Am Ende von `aktualisiereFrage` (vor dem `})` auf Zeile 261):

```typescript
// Cache als invalid markieren
set(state => ({ ...state, _cacheInvalid: true }))
```

Hinweis: Dies muss als separater `set`-Aufruf NACH dem Haupt-`set` passieren, da die bestehende Funktion einen grossen `set`-Block mit return hat. Alternativ `_cacheInvalid: true` direkt im bestehenden return-Objekt auf Zeile 254–260 hinzufügen.

Am Ende von `entferneFrage` (gleiches Muster, im return-Objekt Zeile 270–276):

```typescript
_cacheInvalid: true,
```

Am Ende von `fuegeFragenHinzu` (im return-Objekt Zeile 316–321):

```typescript
_cacheInvalid: true,
```

- [ ] **Step 7: `reset()` — Cache leeren**

In `reset()` (Zeile 334–343), nach `set({...})`:

```typescript
reset: () => {
  set({
    summaries: [],
    summaryMap: {},
    detailCache: {},
    fragen: [],
    fragenMap: {},
    status: 'idle',
    _cacheInvalid: false,
  })
  // IndexedDB-Cache leeren (z.B. bei Logout/User-Wechsel)
  clearFragenbankCache()
},
```

- [ ] **Step 8: TypeScript + Tests prüfen**

```bash
npx tsc -b && npx vitest run
```

Expected: 0 Errors, 209+ Tests grün

- [ ] **Step 9: Commit**

```bash
git add src/store/fragenbankStore.ts
git commit -m "feat: Stale-While-Revalidate IndexedDB-Cache für Fragenbank"
```

---

## Task 4: LP-Skeleton + Sync-Guard + Prefetch

**Files:**
- Create: `src/components/lp/LPSkeleton.tsx`
- Modify: `src/components/lp/LPStartseite.tsx:194-239`

- [ ] **Step 1: LPSkeleton erstellen**

```typescript
// src/components/lp/LPSkeleton.tsx

export default function LPSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header-Platzhalter */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="flex gap-2 ml-auto">
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tab-Platzhalter */}
      <div className="px-6 pt-4">
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>

        {/* Karten-Platzhalter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-2" />
              <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: LPStartseite — Skeleton einbinden**

Import am Anfang der Datei:

```typescript
import LPSkeleton from './LPSkeleton'
```

Im JSX-Return, VOR dem eigentlichen Dashboard-Inhalt (dort wo aktuell die leere Seite gezeigt wird während `ladeStatus !== 'fertig'`):

```typescript
if (ladeStatus === 'laden') return <LPSkeleton />
```

Falls `ladeStatus` den Wert `'laden'` nicht hat, prüfen welcher Wert während des Ladens verwendet wird und anpassen. Aktuell: kein expliziter `ladeStatus`-State für "laden" — der Default ist `undefined`/initial. Ggf. `setLadeStatus('laden')` am Anfang von `lade()` setzen.

- [ ] **Step 3: Sync-Guard einbauen**

In `LPStartseite.tsx`, im `useEffect` (Zeile 218–225), den Sync-Block ersetzen:

```typescript
// Einrichtungsprüfung/-übung: nur einmal pro Session syncen
const SYNC_DONE_KEY = 'examlab-sync-done'
if (!sessionStorage.getItem(SYNC_DONE_KEY)) {
  Promise.all([
    syncEinrichtungsPruefung(user.email, configResult),
    syncEinrichtungsUebung(user.email, configResult),
  ]).then(async () => {
    sessionStorage.setItem(SYNC_DONE_KEY, '1')
    // Configs nur neu laden wenn Sync was geändert haben könnte
    const neueConfigs = await apiService.ladeAlleConfigs(user.email)
    if (neueConfigs) setConfigs(neueConfigs)
  }).catch(err => {
    console.warn('[LP] Sync fehlgeschlagen, wird beim nächsten Mount erneut versucht:', err)
    // SYNC_DONE_KEY bewusst NICHT setzen → nächster Mount versucht erneut
  })
}
```

- [ ] **Step 4: Prefetch-Trigger einbauen**

In `LPStartseite.tsx`, nach `setLadeStatus('fertig')` (Zeile 236):

```typescript
// Hintergrund-Prefetch für Fragenbank-Details
const schedulePrefetch = () => {
  const fbState = useFragenbankStore.getState()
  if (fbState.status === 'summary_fertig') {
    fbState.ladeAlleDetails(user.email)
  }
}
if ('requestIdleCallback' in window) {
  requestIdleCallback(schedulePrefetch)
} else {
  setTimeout(schedulePrefetch, 2000)
}
```

- [ ] **Step 5: TypeScript + Tests prüfen**

```bash
npx tsc -b && npx vitest run
```

Expected: 0 Errors, 209+ Tests grün

- [ ] **Step 6: Commit**

```bash
git add src/components/lp/LPSkeleton.tsx src/components/lp/LPStartseite.tsx
git commit -m "feat: LP-Skeleton + Sync-Guard + Prefetch-Trigger"
```

---

## Task 5: SuS-Skeleton erweitern

**Files:**
- Modify: `src/components/sus/SuSStartseite.tsx:103-117`

- [ ] **Step 1: Skeleton um Karten-Platzhalter erweitern**

In `SuSStartseite.tsx`, das bestehende Skeleton (Zeile 103–117) erweitern. Nach dem bestehenden animate-pulse Header, Karten hinzufügen:

```tsx
{/* Karten-Platzhalter */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
  {[1, 2, 3, 4].map(i => (
    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
      <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-2" />
      <div className="h-8 w-full bg-slate-100 dark:bg-slate-600 rounded animate-pulse mt-3" />
    </div>
  ))}
</div>
```

- [ ] **Step 2: TypeScript prüfen**

```bash
npx tsc -b
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sus/SuSStartseite.tsx
git commit -m "feat: SuS-Skeleton mit Karten-Platzhaltern"
```

---

## Task 6: FeedbackContext erweitern + Auto-Population

**Files:**
- Modify: `src/components/shared/FeedbackModal.tsx:6-13, 62-84`
- Modify: `src/components/lp/LPHeader.tsx:139-141`
- Modify: `src/components/ueben/layout/AppShell.tsx:140-142`
- Modify: `src/components/lp/korrektur/KorrekturFragenAnsicht.tsx:245-252`
- Modify: `src/components/sus/KorrekturEinsicht.tsx:105-107, 219-222`
- Modify: `src/components/Startbildschirm.tsx:140, 208`

- [ ] **Step 1: FeedbackContext Interface erweitern**

In `FeedbackModal.tsx`, Zeile 6–13 ersetzen:

```typescript
export interface FeedbackContext {
  rolle: 'lp' | 'sus'
  ort: string
  pruefungId?: string
  frageId?: string
  frageText?: string
  zusatzinfo?: string
  // Automatisch befüllt
  frageTyp?: string
  modus?: 'pruefen' | 'ueben' | 'fragensammlung'
  bildschirm?: string
  appVersion?: string
  gruppeId?: string
}
```

- [ ] **Step 2: Neue Felder im Payload mitschicken**

In `FeedbackModal.tsx`, die `URLSearchParams` (Zeile 62–73) erweitern:

```typescript
const params = new URLSearchParams({
  source: 'pruefung',
  rolle: context.rolle,
  ort: context.ort,
  typ,
  category,
  comment: comment.trim(),
  pruefungId: context.pruefungId || '',
  frageId: context.frageId || '',
  frageText: (context.frageText || '').replace(/<[^>]*>/g, '').substring(0, 200),
  zusatzinfo: context.zusatzinfo || '',
  // Neue Felder
  frageTyp: context.frageTyp || '',
  modus: context.modus || '',
  bildschirm: context.bildschirm || '',
  appVersion: context.appVersion || (typeof __BUILD_TIMESTAMP__ === 'string' ? __BUILD_TIMESTAMP__ : ''),
  gruppeId: context.gruppeId || '',
})
```

Hinweis: `__BUILD_TIMESTAMP__` ist bereits in `vite.config.ts:26` definiert und in `vite-env.d.ts` deklariert — keine Änderung nötig.

- [ ] **Step 3: LPHeader — Kontext erweitern**

In `LPHeader.tsx`, Zeile 141 ändern:

```typescript
context={{ rolle: 'lp', ort: 'lp-allgemein', modus: 'pruefen', bildschirm: 'header' }}
```

- [ ] **Step 4: AppShell (Üben) — Kontext erweitern**

In `AppShell.tsx`, Zeile 142 ändern:

```typescript
context={{ rolle: user?.rolle === 'admin' ? 'lp' : 'sus', ort: 'uebungstool', modus: 'ueben', bildschirm: 'dashboard' }}
```

- [ ] **Step 5: KorrekturFragenAnsicht — Kontext erweitern**

In `KorrekturFragenAnsicht.tsx`, Zeile 248–252, `frageTyp` hinzufügen:

```typescript
context={{
  rolle: 'lp',
  ort: 'korrektur-frage',
  frageId: aktiveFrage.id,
  frageText: fragetext,
  frageTyp: aktiveFrage.typ,
  modus: 'pruefen',
  bildschirm: 'korrektur',
}}
```

- [ ] **Step 6: KorrekturEinsicht — Kontext erweitern**

In `KorrekturEinsicht.tsx`:
- Zeile 107: `context={{ rolle: 'sus', ort: 'einsicht-allgemein', pruefungId, modus: 'pruefen', bildschirm: 'einsicht' }}`
- Zeile 222: Analog `modus: 'pruefen'`, `bildschirm: 'einsicht-frage'` hinzufügen

- [ ] **Step 7: Startbildschirm — Kontext erweitern**

In `Startbildschirm.tsx`:
- Zeile 140: `context={{ rolle: 'sus', ort: 'warteraum', modus: 'pruefen', bildschirm: 'warteraum' }}`
- Zeile 208: `context={{ rolle: 'sus', ort: 'startbildschirm', bildschirm: 'start' }}`

- [ ] **Step 8: TypeScript + Tests prüfen**

```bash
npx tsc -b && npx vitest run
```

Expected: 0 Errors, 209+ Tests grün

- [ ] **Step 9: Commit**

```bash
git add src/components/shared/FeedbackModal.tsx src/components/lp/LPHeader.tsx src/components/ueben/layout/AppShell.tsx src/components/lp/korrektur/KorrekturFragenAnsicht.tsx src/components/sus/KorrekturEinsicht.tsx src/components/Startbildschirm.tsx
git commit -m "feat: FeedbackContext erweitert mit frageTyp, modus, bildschirm, appVersion"
```

---

## Task 7: Finaler Build + Verifizierung

**Files:** keine neuen

- [ ] **Step 1: Vollständiger Build**

```bash
npx tsc -b && npx vitest run && npm run build
```

Expected: Alles grün

- [ ] **Step 2: HANDOFF.md aktualisieren**

Session 78 Eintrag mit:
- Branch: `feature/performance-features`
- Neue Dateien: `fragenbankCache.ts`, `LPSkeleton.tsx`
- Geänderte Dateien (9 Dateien)
- Verifiziert: tsc + Tests + Build
- Offen: Browser-Test im Preview, LP-Ladezeit messen

- [ ] **Step 3: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "HANDOFF: Session 78 — Performance + Problem-Melden dokumentiert"
git push -u origin feature/performance-features
```

---

## Zusammenfassung

| Task | Was | Dateien | Abhängigkeit |
|------|-----|---------|-------------|
| 1 | Branch erstellen | — | — |
| 2 | IndexedDB Cache-Layer | `fragenbankCache.ts` (neu) | — |
| 3 | Stale-While-Revalidate im Store | `fragenbankStore.ts` | Task 2 |
| 4 | LP-Skeleton + Sync-Guard + Prefetch | `LPSkeleton.tsx` (neu), `LPStartseite.tsx` | Task 3 |
| 5 | SuS-Skeleton erweitern | `SuSStartseite.tsx` | — |
| 6 | FeedbackContext erweitern | 6 Dateien | — |
| 7 | Finaler Build + HANDOFF | `HANDOFF.md` | Alle |

**Parallelisierbar:** Tasks 2+5+6 sind unabhängig. Tasks 3→4 sind sequentiell.
