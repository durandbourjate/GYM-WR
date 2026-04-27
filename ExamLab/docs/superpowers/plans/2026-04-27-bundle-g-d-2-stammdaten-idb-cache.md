# Bundle G.d.2 — Stammdaten-IDB-Cache — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Klassenlisten und Üben-Gruppen (inkl. Mitglieder pro Gruppe) beim Login fire-and-forget in IndexedDB cachen, sodass Folge-Aufrufe (Vorbereitungs-Tab, Üben-Kurs-Auswahl) instant statt 2–3 s rendern. Beim Logout werden alle 3 IDB-Datenbanken (Fragenbank + Klassenlisten + Gruppen) parallel und transaktions-sicher geleert.

**Architecture:** Direkte Replikation des G.c-Pattern (Fragenbank-Cache) für 2 weitere Datentypen. Pro Datentyp: ein `*Cache.ts`-Modul (IDB-Stores `data` + `meta` mit TTL-Validierung) plus ein zugehöriger Zustand-Store, der intern Cache-First arbeitet. `authStore.anmelden` triggert Pre-Fetch fire-and-forget, `authStore.abmelden` wartet auf `Promise.all` aller `reset()`-Aufrufe (Privacy-Garantie aus S149-Lehre via `tx.oncomplete`-await). Frontend-only — kein neuer Backend-Endpoint, kein Apps-Script-Deploy nötig.

**Tech Stack:** React 19 + TypeScript strict + Zustand + Vitest + jsdom + fake-indexeddb (neu als devDep für Cache-Unit-Tests).

**Spec:** [`docs/superpowers/specs/2026-04-27-bundle-g-d-2-stammdaten-idb-cache-design.md`](../specs/2026-04-27-bundle-g-d-2-stammdaten-idb-cache-design.md)

**Vorbild (Pattern):** Bundle G.c (S149) — `fragenbankCache.ts` + `fragenbankStore.reset()` + `authStore.ts` Pre-Fetch/Cleanup. Letzte Lehre: `tx.oncomplete`-await ist Pflicht vor Hard-Nav.

---

## File Structure

| Datei | Art | Zeilen ca. | Verantwortung |
|---|---|---|---|
| `ExamLab/package.json` | EDIT | +1 | `fake-indexeddb` als devDependency |
| `ExamLab/src/test-setup.ts` | EDIT | +1 | `import 'fake-indexeddb/auto'` (globaler IDB-Mock für vitest) |
| `ExamLab/src/services/klassenlistenCache.ts` | NEU | ~100 | IDB-Cache (data + meta) für `KlassenlistenEintrag[]`, TTL 24 h, `tx.oncomplete`-await im Clear |
| `ExamLab/src/services/gruppenCache.ts` | NEU | ~150 | IDB-Cache mit 3 Stores (`gruppen`, `mitglieder`, `meta`); Mitglieder-Map keyed by gruppeId; Clear awaitet alle 3 |
| `ExamLab/src/store/klassenlistenStore.ts` | NEU | ~80 | Cache-First Zustand-Store (`daten`, `ladeStatus`, `lade`, `reset`); ersetzt lokales `useState` in `VorbereitungPhase` |
| `ExamLab/src/store/ueben/gruppenStore.ts` | EDIT | +60/-10 | Cache-First in `ladeGruppen` + `waehleGruppe`; `force?: boolean` an `ladeGruppen`; neue async `reset()` |
| `ExamLab/src/store/authStore.ts` | EDIT | +12 | LP `anmelden`: Pre-Fetch Klassenlisten + Gruppen; SuS `anmeldenMitCode`: Pre-Fetch Gruppen; `abmelden`: `Promise.all` über 3 `reset()` |
| `ExamLab/src/components/lp/vorbereitung/VorbereitungPhase.tsx` | EDIT | +6/-15 | `klassenlistenStore` statt lokalem `useState`+`apiService.ladeKlassenlisten` |
| `ExamLab/src/tests/klassenlistenCache.test.ts` | NEU | ~110 | 6 Cases: round-trip, TTL-abgelaufen, clear, silent-fail, meta-timestamp, TTL-Konstante |
| `ExamLab/src/tests/gruppenCache.test.ts` | NEU | ~140 | 8 Cases: gruppen round-trip, mitglieder round-trip per ID, 2-IDs-getrennt, TTL, clear-alle-Stores, silent-fail |
| `ExamLab/src/tests/klassenlistenStore.test.ts` | NEU | ~120 | 5 Cases: Cache-Hit, Cache-Miss, force, reset awaitet clear, API-Fehler |
| `ExamLab/src/tests/gruppenStoreCache.test.ts` | NEU | ~140 | 5 neue Cases: ladeGruppen-Cache-Hit, Cache-Miss-Write, waehleGruppe-Cache-Hit, reset awaitet, Auto-Select-Logic bleibt unverändert |
| `ExamLab/src/tests/authStoreLoginPrefetch.test.ts` | EDIT | +60 | 3 neue Cases: LP-anmelden feuert 3 Pre-Fetch, anmeldenMitCode feuert nur Gruppen, abmelden awaitet Promise.all |

**Bewusst nicht angetastet:**
- `ExamLab/src/store/ueben/authStore.ts` (`useUebenAuthStore`) — Üben-Standalone-Login. Spec referenziert nur `authStore.ts` (Prüfungs-Auth). Üben-Standalone-User profitiert beim 2. Mount transparent (Cache-Write nach API-Call). Keine Scope-Erweiterung.
- `apiService.ladeKlassenlisten` / `uebenGruppenAdapter.ladeGruppen` / `uebenGruppenAdapter.ladeMitglieder` — Adapter bleiben unverändert; Caching liegt eine Schicht darüber.
- Apps-Script Backend — kein Deploy nötig (Spec § 407–416 „Was wir explizit NICHT machen").
- `demoStarten()` — eigener Code-Pfad; ruft `anmelden()` nicht auf, deshalb kein Demo-Guard nötig.

---

## Globale Annahmen für den Implementer

1. **Working Directory:** Plan-Phase und Branch-Erstellung passieren vom Repo-Root (`/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY`). Build/Test-Befehle laufen aus `ExamLab/`.
2. **Branch:** `feature/bundle-g-d-2-stammdaten-idb-cache` direkt von `main` (Vorgänger G.d.1 ist gemergt, Commit `6aa16f3`).
3. **Test-Baseline:** ~743 vitest grün vor Beginn (S152 G.d.1-Stand). Alle neuen Tests sind additiv, bestehende dürfen NICHT brechen — insbesondere die `gruppenStore`-Bestandstests (Auto-Select, localStorage-Letzte-Gruppe).
4. **TDD diszipliniert:** Pro Cache-/Store-Modul erst Tests schreiben (failing), dann Code, dann grün, dann Commit. Keine Sammel-Commits.
5. **Frequent Commits:** Jeder fertige Sub-Schritt (Test + Implementierung passend) → eigener Commit mit klarer Botschaft, Prefix `G.d.2:`.
6. **Naming-Convention für Konsole-Warnungen:** `console.warn('[G.d.2] …', e)` damit Pre-Fetch-Fehler in der Browser-DevTools eindeutig zuordenbar sind (analog `[G.c]` aus Vorgänger).
7. **Keine Linting-Eingriffe in fremden Code.** Wenn beim Editieren ein Bestand-Block neu formatiert werden möchte: lassen. Nur das ändern, was der Task verlangt.
8. **Abhängigkeit zwischen Tasks 1 und 2:** unabhängig (zwei verschiedene Cache-Dateien). Tasks 3 und 4 haben Abhängigkeit auf Task 1 bzw. 2. Tasks 5/6/7 hängen an Tasks 3 und 4. Task 8 hängt an Task 3. Task 9 erst nach 1–8. Die Reihenfolge im Plan ist die empfohlene; bei Subagent-Dispatch dürfen Tasks 1+2 parallel laufen.

---

## Task 0: Branch & Setup

**Files:** `ExamLab/package.json`, `ExamLab/src/test-setup.ts`, neuer Branch

- [ ] **Step 1: Branch erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull
git checkout -b feature/bundle-g-d-2-stammdaten-idb-cache
```

Expected: Clean working tree auf neuem Branch ab `main` (Commit `6aa16f3` oder neuer).

- [ ] **Step 2: Baseline-Verify**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3 && npx vitest run --reporter=basic 2>&1 | tail -5 && npm run build 2>&1 | tail -3
```

Expected: tsc clean, alle Tests grün — Anzahl notieren (Plan rechnet mit ~743 Baseline). build erfolgreich. Falls die Zahl abweicht: kein Showstopper, aber für die finale Erfolgs-Prüfung verwenden.

- [ ] **Step 3: `fake-indexeddb` installieren**

```bash
cd ExamLab && npm install --save-dev fake-indexeddb
```

Expected: `package.json` enthält `"fake-indexeddb": "^X.Y.Z"` unter `devDependencies`. `package-lock.json` aktualisiert.

**Hintergrund:** jsdom hat kein eingebautes IndexedDB. Ohne fake-indexeddb crashen die neuen Cache-Unit-Tests mit `ReferenceError: indexedDB is not defined`. Die Library ist die De-facto-Standardlösung (~250k DL/Woche), MIT-lizenziert, klein (~50 KB).

- [ ] **Step 4: `test-setup.ts` erweitern**

Aktuelle Datei (`ExamLab/src/test-setup.ts`):
```ts
import '@testing-library/jest-dom'
```

Erweitern auf:
```ts
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
```

`fake-indexeddb/auto` registriert globale `indexedDB`/`IDBKeyRange`-Polyfills auf `globalThis` — vor dem ersten Modul-Import.

- [ ] **Step 5: Verify Setup**

```bash
cd ExamLab && npx vitest run --reporter=basic 2>&1 | tail -5
```

Expected: Wieder ~743 grün. (Bestehende Tests dürfen sich nicht ändern — fake-indexeddb wird nur dort genutzt, wo IDB explizit aufgerufen wird.) Bei Bruch: prüfen ob ein bestehender Test indexedDB-Polyfill mit eigenen Mocks kollidiert — wahrscheinlich nicht, aber ggf. das setupFile lokal überschreiben.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/package.json ExamLab/package-lock.json ExamLab/src/test-setup.ts
git commit -m "G.d.2: fake-indexeddb als devDep + globaler IDB-Polyfill in test-setup"
```

---

## Task 1: `klassenlistenCache.ts` (TDD)

**Files:**
- Create: `ExamLab/src/services/klassenlistenCache.ts`
- Create: `ExamLab/src/tests/klassenlistenCache.test.ts`

- [ ] **Step 1: Test-Datei schreiben (failing)**

Create `ExamLab/src/tests/klassenlistenCache.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedKlassenlisten,
  setCachedKlassenlisten,
  clearKlassenlistenCache,
} from '../services/klassenlistenCache'
import type { KlassenlistenEintrag } from '../services/klassenlistenApi'

const sampleEintraege: KlassenlistenEintrag[] = [
  { klasse: '27a', kurs: 'WR3', email: 'a@stud.gymhofwil.ch', name: 'Aebi', vorname: 'Alex' },
  { klasse: '28b', kurs: 'WR2', email: 'b@stud.gymhofwil.ch', name: 'Berger', vorname: 'Bea' },
]

describe('G.d.2 — klassenlistenCache', () => {
  beforeEach(async () => {
    // fake-indexeddb-Reset zwischen Tests: vollständig löschen
    await clearKlassenlistenCache()
  })

  it('round-trip: setCachedKlassenlisten + getCachedKlassenlisten', async () => {
    await setCachedKlassenlisten(sampleEintraege)
    const back = await getCachedKlassenlisten()
    expect(back).toEqual(sampleEintraege)
  })

  it('returns null wenn Cache leer', async () => {
    const back = await getCachedKlassenlisten()
    expect(back).toBeNull()
  })

  it('returns null wenn TTL abgelaufen (Meta-Timestamp manuell auf vor 25 h gesetzt)', async () => {
    await setCachedKlassenlisten(sampleEintraege)
    // Meta-Timestamp manuell zurücksetzen via direkten IDB-Zugriff
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('examlab-klassenlisten-cache', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['meta'], 'readwrite')
        const store = tx.objectStore('meta')
        const oldIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        store.put({ key: 'data', timestamp: oldIso, count: sampleEintraege.length }, 'data')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    const back = await getCachedKlassenlisten()
    expect(back).toBeNull()
  })

  it('clearKlassenlistenCache leert data + meta', async () => {
    await setCachedKlassenlisten(sampleEintraege)
    await clearKlassenlistenCache()
    const back = await getCachedKlassenlisten()
    expect(back).toBeNull()
  })

  it('setCachedKlassenlisten ist silent-fail bei IDB-Fehler', async () => {
    const original = indexedDB.open
    // Spy auf indexedDB.open der einen Error wirft
    const spy = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('IDB defekt')
    })
    await expect(setCachedKlassenlisten(sampleEintraege)).resolves.toBeUndefined()
    spy.mockRestore()
    void original
  })

  it('Meta-Timestamp wird beim Schreiben gesetzt (round-trip prüft Speicherung)', async () => {
    const before = Date.now()
    await setCachedKlassenlisten(sampleEintraege)
    const back = await getCachedKlassenlisten()
    expect(back).not.toBeNull()
    // Indirekter Test: Cache muss beim sofortigen Lesen gültig sein (TTL > 0)
    expect(Date.now() - before).toBeLessThan(24 * 60 * 60 * 1000)
  })
})
```

- [ ] **Step 2: Test laufen lassen — alle 6 sollen failen**

```bash
cd ExamLab && npx vitest run src/tests/klassenlistenCache.test.ts 2>&1 | tail -15
```

Expected: Alle 6 Tests FAIL — Module `../services/klassenlistenCache` existiert noch nicht. Fehler ist `Failed to resolve import` oder ähnlich.

- [ ] **Step 3: `klassenlistenCache.ts` schreiben**

Create `ExamLab/src/services/klassenlistenCache.ts`:

```ts
// src/services/klassenlistenCache.ts
import type { KlassenlistenEintrag } from './klassenlistenApi'

const IDB_NAME = 'examlab-klassenlisten-cache'
const IDB_VERSION = 1
const STORE_DATA = 'data'
const STORE_META = 'meta'

// Cache-Gültigkeit: 24 h (Stammdaten ändern sich selten; LP hat Refresh-Button für Sofort-Invalidierung)
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

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
      if (!db.objectStoreNames.contains(STORE_DATA)) db.createObjectStore(STORE_DATA)
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Cached Klassenlisten lesen. null bei leerem oder abgelaufenem Cache. */
export async function getCachedKlassenlisten(): Promise<KlassenlistenEintrag[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DATA, STORE_META], 'readonly')
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), 'data')
    if (!meta || !isCacheValid(meta)) return null
    const data = await idbGet<KlassenlistenEintrag[]>(tx.objectStore(STORE_DATA), 'data')
    return data || null
  } catch {
    return null
  }
}

/** Klassenlisten in Cache schreiben. Fehler werden silent ignoriert. */
export async function setCachedKlassenlisten(eintraege: KlassenlistenEintrag[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DATA, STORE_META], 'readwrite')
    tx.objectStore(STORE_DATA).put(eintraege, 'data')
    tx.objectStore(STORE_META).put({
      key: 'data',
      timestamp: new Date().toISOString(),
      count: eintraege.length,
    } satisfies CacheMeta, 'data')
  } catch {
    // Silent — App funktioniert ohne Cache
  }
}

/** Klassenlisten-Cache leeren (Logout / Refresh).
 * Wartet auf tx.oncomplete — kritisch beim Logout, weil window.location.href
 * direkt danach den Page-Unload triggert (S149-Lehre, safety-pwa.md).
 */
export async function clearKlassenlistenCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DATA, STORE_META], 'readwrite')
    tx.objectStore(STORE_DATA).clear()
    tx.objectStore(STORE_META).clear()
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
    })
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

- [ ] **Step 4: Tests laufen lassen — alle grün**

```bash
cd ExamLab && npx vitest run src/tests/klassenlistenCache.test.ts 2>&1 | tail -10
```

Expected: 6/6 PASS.

Bei TTL-Test-Failure: prüfen ob Meta-Update wirklich vor `getCachedKlassenlisten` committed ist (`tx.oncomplete`-await im Test). Bei silent-fail-Failure: prüfen ob `vi.spyOn` korrekt zurückgesetzt wurde (Mock greift nur einmal).

- [ ] **Step 5: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/services/klassenlistenCache.ts ExamLab/src/tests/klassenlistenCache.test.ts
git commit -m "G.d.2: klassenlistenCache (IDB) + 6 Unit-Tests"
```

---

## Task 2: `gruppenCache.ts` (TDD)

**Files:**
- Create: `ExamLab/src/services/gruppenCache.ts`
- Create: `ExamLab/src/tests/gruppenCache.test.ts`

- [ ] **Step 1: Test-Datei schreiben (failing)**

Create `ExamLab/src/tests/gruppenCache.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedGruppen, setCachedGruppen,
  getCachedMitglieder, setCachedMitglieder,
  clearGruppenCache,
} from '../services/gruppenCache'
import type { Gruppe, Mitglied } from '../types/ueben/gruppen'

const g1: Gruppe = {
  id: 'g1', name: 'Klasse 27a', typ: 'gym', adminEmail: 'lp@gymhofwil.ch',
  fragebankSheetId: 'sheet1', analytikSheetId: 'an1', mitglieder: [],
}
const g2: Gruppe = { ...g1, id: 'g2', name: 'Klasse 28b' }

const m1: Mitglied[] = [
  { email: 'a@stud.gymhofwil.ch', name: 'A.', rolle: 'lernend', beigetreten: '2026-04-01' },
]
const m2: Mitglied[] = [
  { email: 'b@stud.gymhofwil.ch', name: 'B.', rolle: 'lernend', beigetreten: '2026-04-02' },
]

describe('G.d.2 — gruppenCache', () => {
  beforeEach(async () => {
    await clearGruppenCache()
  })

  it('Gruppen round-trip', async () => {
    await setCachedGruppen([g1, g2])
    expect(await getCachedGruppen()).toEqual([g1, g2])
  })

  it('Gruppen leer → null', async () => {
    expect(await getCachedGruppen()).toBeNull()
  })

  it('Mitglieder pro gruppeId getrennt cachen', async () => {
    await setCachedMitglieder('g1', m1)
    await setCachedMitglieder('g2', m2)
    expect(await getCachedMitglieder('g1')).toEqual(m1)
    expect(await getCachedMitglieder('g2')).toEqual(m2)
  })

  it('Mitglieder unbekannte gruppeId → null', async () => {
    expect(await getCachedMitglieder('nonexistent')).toBeNull()
  })

  it('TTL abgelaufen (Gruppen-Meta manuell auf 25 h zurück) → null', async () => {
    await setCachedGruppen([g1])
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('examlab-gruppen-cache', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['meta'], 'readwrite')
        const oldIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        tx.objectStore('meta').put({ key: 'gruppen', timestamp: oldIso, count: 1 }, 'gruppen')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    expect(await getCachedGruppen()).toBeNull()
  })

  it('Mitglieder-TTL pro Gruppe abgelaufen → null nur für diese ID', async () => {
    await setCachedMitglieder('g1', m1)
    await setCachedMitglieder('g2', m2)
    // Nur g1-Meta auf 25 h zurücksetzen
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('examlab-gruppen-cache', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['meta'], 'readwrite')
        const oldIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        tx.objectStore('meta').put({ key: 'mitglieder:g1', timestamp: oldIso, count: 1 }, 'mitglieder:g1')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    expect(await getCachedMitglieder('g1')).toBeNull()
    expect(await getCachedMitglieder('g2')).toEqual(m2)
  })

  it('clearGruppenCache leert Gruppen + Mitglieder + Meta', async () => {
    await setCachedGruppen([g1])
    await setCachedMitglieder('g1', m1)
    await clearGruppenCache()
    expect(await getCachedGruppen()).toBeNull()
    expect(await getCachedMitglieder('g1')).toBeNull()
  })

  it('setCachedGruppen ist silent-fail bei IDB-Fehler', async () => {
    const spy = vi.spyOn(indexedDB, 'open').mockImplementation(() => { throw new Error('defekt') })
    await expect(setCachedGruppen([g1])).resolves.toBeUndefined()
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Tests failen lassen**

```bash
cd ExamLab && npx vitest run src/tests/gruppenCache.test.ts 2>&1 | tail -15
```

Expected: 8 Tests FAIL (Module fehlt).

- [ ] **Step 3: `gruppenCache.ts` implementieren**

Create `ExamLab/src/services/gruppenCache.ts`:

```ts
// src/services/gruppenCache.ts
import type { Gruppe, Mitglied } from '../types/ueben/gruppen'

const IDB_NAME = 'examlab-gruppen-cache'
const IDB_VERSION = 1
const STORE_GRUPPEN = 'gruppen'
const STORE_MITGLIEDER = 'mitglieder'  // Map<gruppeId, Mitglied[]> via key=gruppeId
const STORE_META = 'meta'

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

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
      if (!db.objectStoreNames.contains(STORE_GRUPPEN)) db.createObjectStore(STORE_GRUPPEN)
      if (!db.objectStoreNames.contains(STORE_MITGLIEDER)) db.createObjectStore(STORE_MITGLIEDER)
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getCachedGruppen(): Promise<Gruppe[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_GRUPPEN, STORE_META], 'readonly')
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), 'gruppen')
    if (!meta || !isCacheValid(meta)) return null
    const data = await idbGet<Gruppe[]>(tx.objectStore(STORE_GRUPPEN), 'data')
    return data || null
  } catch {
    return null
  }
}

export async function setCachedGruppen(gruppen: Gruppe[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_GRUPPEN, STORE_META], 'readwrite')
    tx.objectStore(STORE_GRUPPEN).put(gruppen, 'data')
    tx.objectStore(STORE_META).put({
      key: 'gruppen',
      timestamp: new Date().toISOString(),
      count: gruppen.length,
    } satisfies CacheMeta, 'gruppen')
  } catch {
    // Silent
  }
}

export async function getCachedMitglieder(gruppeId: string): Promise<Mitglied[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_MITGLIEDER, STORE_META], 'readonly')
    const metaKey = `mitglieder:${gruppeId}`
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), metaKey)
    if (!meta || !isCacheValid(meta)) return null
    const data = await idbGet<Mitglied[]>(tx.objectStore(STORE_MITGLIEDER), gruppeId)
    return data || null
  } catch {
    return null
  }
}

export async function setCachedMitglieder(gruppeId: string, mitglieder: Mitglied[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_MITGLIEDER, STORE_META], 'readwrite')
    tx.objectStore(STORE_MITGLIEDER).put(mitglieder, gruppeId)
    tx.objectStore(STORE_META).put({
      key: `mitglieder:${gruppeId}`,
      timestamp: new Date().toISOString(),
      count: mitglieder.length,
    } satisfies CacheMeta, `mitglieder:${gruppeId}`)
  } catch {
    // Silent
  }
}

/** Komplette Gruppen-IDB leeren (Logout). tx.oncomplete-await wegen Hard-Nav (S149). */
export async function clearGruppenCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_GRUPPEN, STORE_MITGLIEDER, STORE_META], 'readwrite')
    tx.objectStore(STORE_GRUPPEN).clear()
    tx.objectStore(STORE_MITGLIEDER).clear()
    tx.objectStore(STORE_META).clear()
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
    })
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

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/tests/gruppenCache.test.ts 2>&1 | tail -10
```

Expected: 8/8 PASS.

- [ ] **Step 5: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/services/gruppenCache.ts ExamLab/src/tests/gruppenCache.test.ts
git commit -m "G.d.2: gruppenCache (IDB, 3 Stores) + 8 Unit-Tests"
```

---

## Task 3: `klassenlistenStore.ts` (TDD)

**Files:**
- Create: `ExamLab/src/store/klassenlistenStore.ts`
- Create: `ExamLab/src/tests/klassenlistenStore.test.ts`

- [ ] **Step 1: Test-Datei schreiben**

Create `ExamLab/src/tests/klassenlistenStore.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { KlassenlistenEintrag } from '../services/klassenlistenApi'

// API-Schicht mocken — wir testen den Store, nicht das echte Backend
const ladeMock = vi.fn<[string], Promise<KlassenlistenEintrag[]>>()
vi.mock('../services/apiService', () => ({
  apiService: { ladeKlassenlisten: (email: string) => ladeMock(email) },
}))

const sample: KlassenlistenEintrag[] = [
  { klasse: '27a', email: 'a@stud.gymhofwil.ch', name: 'A.', vorname: 'Alex' },
]

import { useKlassenlistenStore } from '../store/klassenlistenStore'
import { clearKlassenlistenCache, setCachedKlassenlisten } from '../services/klassenlistenCache'

describe('G.d.2 — klassenlistenStore', () => {
  beforeEach(async () => {
    await clearKlassenlistenCache()
    useKlassenlistenStore.setState({ daten: null, ladeStatus: 'idle' })
    ladeMock.mockReset()
  })

  it('lade() Cache-Hit: liest aus IDB, ruft API NICHT', async () => {
    await setCachedKlassenlisten(sample)
    ladeMock.mockResolvedValue([])
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch')
    expect(useKlassenlistenStore.getState().daten).toEqual(sample)
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('fertig')
    expect(ladeMock).not.toHaveBeenCalled()
  })

  it('lade() Cache-Miss: API-Call + schreibt Cache', async () => {
    ladeMock.mockResolvedValue(sample)
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch')
    expect(ladeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
    expect(useKlassenlistenStore.getState().daten).toEqual(sample)
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('fertig')
    // Cache muss jetzt befüllt sein:
    const { getCachedKlassenlisten } = await import('../services/klassenlistenCache')
    expect(await getCachedKlassenlisten()).toEqual(sample)
  })

  it('lade({force:true}) ignoriert Cache, ruft IMMER API', async () => {
    await setCachedKlassenlisten(sample)
    ladeMock.mockResolvedValue([{ ...sample[0], name: 'NEU' }])
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch', { force: true })
    expect(ladeMock).toHaveBeenCalledTimes(1)
    expect(useKlassenlistenStore.getState().daten?.[0].name).toBe('NEU')
  })

  it('reset() leert State + awaitet clearKlassenlistenCache', async () => {
    await setCachedKlassenlisten(sample)
    useKlassenlistenStore.setState({ daten: sample, ladeStatus: 'fertig' })
    await useKlassenlistenStore.getState().reset()
    expect(useKlassenlistenStore.getState().daten).toBeNull()
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('idle')
    const { getCachedKlassenlisten } = await import('../services/klassenlistenCache')
    expect(await getCachedKlassenlisten()).toBeNull()
  })

  it('lade() API-Fehler: ladeStatus="fehler", State bleibt', async () => {
    ladeMock.mockRejectedValue(new Error('Backend down'))
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch')
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('fehler')
    expect(useKlassenlistenStore.getState().daten).toBeNull()
  })
})
```

- [ ] **Step 2: Tests failen**

```bash
cd ExamLab && npx vitest run src/tests/klassenlistenStore.test.ts 2>&1 | tail -10
```

Expected: 5 FAIL (Module fehlt).

- [ ] **Step 3: `klassenlistenStore.ts` implementieren**

Create `ExamLab/src/store/klassenlistenStore.ts`:

```ts
import { create } from 'zustand'
import type { KlassenlistenEintrag } from '../services/klassenlistenApi'
import { apiService } from '../services/apiService'
import {
  getCachedKlassenlisten,
  setCachedKlassenlisten,
  clearKlassenlistenCache,
} from '../services/klassenlistenCache'

type LadeStatus = 'idle' | 'laden' | 'fertig' | 'fehler'

interface KlassenlistenState {
  daten: KlassenlistenEintrag[] | null
  ladeStatus: LadeStatus

  /** Cache-First Laden. opts.force=true bypasst Cache. */
  lade: (email: string, opts?: { force?: boolean }) => Promise<void>
  /** Logout-Cleanup: leert State + IDB-Cache (await wegen Hard-Nav, S149). */
  reset: () => Promise<void>
}

export const useKlassenlistenStore = create<KlassenlistenState>((set) => ({
  daten: null,
  ladeStatus: 'idle',

  lade: async (email, opts) => {
    set({ ladeStatus: 'laden' })
    try {
      let daten: KlassenlistenEintrag[] | null = null
      if (!opts?.force) {
        daten = await getCachedKlassenlisten()
      }
      if (!daten) {
        daten = await apiService.ladeKlassenlisten(email)
        await setCachedKlassenlisten(daten)
      }
      set({ daten, ladeStatus: 'fertig' })
    } catch (err) {
      console.warn('[G.d.2] klassenlistenStore.lade fehlgeschlagen:', err)
      set({ ladeStatus: 'fehler' })
    }
  },

  reset: async () => {
    set({ daten: null, ladeStatus: 'idle' })
    await clearKlassenlistenCache()
  },
}))
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/tests/klassenlistenStore.test.ts 2>&1 | tail -10
```

Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/store/klassenlistenStore.ts ExamLab/src/tests/klassenlistenStore.test.ts
git commit -m "G.d.2: klassenlistenStore (Cache-First) + 5 Unit-Tests"
```

---

## Task 4: `gruppenStore.ts` Erweiterung (TDD)

**Files:**
- Modify: `ExamLab/src/store/ueben/gruppenStore.ts`
- Create: `ExamLab/src/tests/gruppenStoreCache.test.ts`

> **Wichtig:** Bestehende Tests des `gruppenStore` (falls vorhanden) dürfen NICHT brechen. Auto-Select-Logic (1 Gruppe → direkt aktiv, sonst letzte aus localStorage) und localStorage-Persistenz bleiben unverändert. Erweiterung ist additiv.

- [ ] **Step 1: Test-Datei schreiben**

Create `ExamLab/src/tests/gruppenStoreCache.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Gruppe, Mitglied } from '../types/ueben/gruppen'

const ladeGruppenMock = vi.fn<[string], Promise<Gruppe[]>>()
const ladeMitgliederMock = vi.fn<[string], Promise<Mitglied[]>>()

vi.mock('../adapters/ueben/appsScriptAdapter', () => ({
  uebenGruppenAdapter: {
    ladeGruppen: (email: string) => ladeGruppenMock(email),
    ladeMitglieder: (gruppeId: string) => ladeMitgliederMock(gruppeId),
  },
}))

import { useUebenGruppenStore } from '../store/ueben/gruppenStore'
import {
  clearGruppenCache,
  setCachedGruppen,
  setCachedMitglieder,
  getCachedGruppen,
} from '../services/gruppenCache'

const g1: Gruppe = {
  id: 'g1', name: 'Klasse 27a', typ: 'gym', adminEmail: 'lp@gymhofwil.ch',
  fragebankSheetId: 's1', analytikSheetId: 'a1', mitglieder: [],
}
const m1: Mitglied[] = [
  { email: 'a@stud.gymhofwil.ch', name: 'A.', rolle: 'lernend', beigetreten: '2026-04-01' },
]

describe('G.d.2 — gruppenStore Cache-Erweiterung', () => {
  beforeEach(async () => {
    await clearGruppenCache()
    try { localStorage.removeItem('ueben-letzte-gruppe-id') } catch {/* */}
    useUebenGruppenStore.setState({ gruppen: [], aktiveGruppe: null, mitglieder: [], ladeStatus: 'idle' })
    ladeGruppenMock.mockReset()
    ladeMitgliederMock.mockReset()
  })

  it('ladeGruppen() Cache-Hit: keine API-Calls, Auto-Select läuft trotzdem', async () => {
    await setCachedGruppen([g1])
    await setCachedMitglieder('g1', m1)
    ladeGruppenMock.mockResolvedValue([])
    ladeMitgliederMock.mockResolvedValue([])

    await useUebenGruppenStore.getState().ladeGruppen('lp@gymhofwil.ch')

    expect(ladeGruppenMock).not.toHaveBeenCalled()
    expect(ladeMitgliederMock).not.toHaveBeenCalled()
    const state = useUebenGruppenStore.getState()
    expect(state.gruppen).toEqual([g1])
    // Auto-Select bei genau 1 Gruppe:
    expect(state.aktiveGruppe?.id).toBe('g1')
    expect(state.mitglieder).toEqual(m1)
  })

  it('ladeGruppen() Cache-Miss: API + Cache-Write', async () => {
    ladeGruppenMock.mockResolvedValue([g1])
    ladeMitgliederMock.mockResolvedValue(m1)

    await useUebenGruppenStore.getState().ladeGruppen('lp@gymhofwil.ch')

    expect(ladeGruppenMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
    expect(ladeMitgliederMock).toHaveBeenCalledWith('g1')
    expect(await getCachedGruppen()).toEqual([g1])
  })

  it('ladeGruppen({force:true}) ignoriert Cache', async () => {
    await setCachedGruppen([g1])
    ladeGruppenMock.mockResolvedValue([{ ...g1, name: 'NEUER NAME' }])
    ladeMitgliederMock.mockResolvedValue([])

    await useUebenGruppenStore.getState().ladeGruppen('lp@gymhofwil.ch', { force: true })

    expect(ladeGruppenMock).toHaveBeenCalledTimes(1)
    expect(useUebenGruppenStore.getState().gruppen[0].name).toBe('NEUER NAME')
  })

  it('waehleGruppe() Cache-Hit: keine ladeMitglieder-API-Call', async () => {
    useUebenGruppenStore.setState({ gruppen: [g1], aktiveGruppe: null, mitglieder: [], ladeStatus: 'fertig' })
    await setCachedMitglieder('g1', m1)
    ladeMitgliederMock.mockResolvedValue([])

    await useUebenGruppenStore.getState().waehleGruppe('g1')

    expect(ladeMitgliederMock).not.toHaveBeenCalled()
    expect(useUebenGruppenStore.getState().mitglieder).toEqual(m1)
  })

  it('reset() leert State + awaitet clearGruppenCache', async () => {
    await setCachedGruppen([g1])
    useUebenGruppenStore.setState({ gruppen: [g1], aktiveGruppe: g1, mitglieder: m1, ladeStatus: 'fertig' })

    await useUebenGruppenStore.getState().reset()

    const state = useUebenGruppenStore.getState()
    expect(state.gruppen).toEqual([])
    expect(state.aktiveGruppe).toBeNull()
    expect(state.mitglieder).toEqual([])
    expect(state.ladeStatus).toBe('idle')
    expect(await getCachedGruppen()).toBeNull()
  })
})
```

- [ ] **Step 2: Tests failen**

```bash
cd ExamLab && npx vitest run src/tests/gruppenStoreCache.test.ts 2>&1 | tail -10
```

Expected: 5 FAIL (z.B. `reset is not a function`, `force` wird ignoriert, etc.).

- [ ] **Step 3: `gruppenStore.ts` editieren**

Aktuelles `ExamLab/src/store/ueben/gruppenStore.ts` ersetzen durch:

```ts
import { create } from 'zustand'
import type { Gruppe, Mitglied } from '../../types/ueben/gruppen'
import { uebenGruppenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import {
  getCachedGruppen, setCachedGruppen,
  getCachedMitglieder, setCachedMitglieder,
  clearGruppenCache,
} from '../../services/gruppenCache'

interface UebenGruppenState {
  gruppen: Gruppe[]
  aktiveGruppe: Gruppe | null
  mitglieder: Mitglied[]
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'

  ladeGruppen: (email: string, opts?: { force?: boolean }) => Promise<void>
  waehleGruppe: (gruppeId: string) => Promise<void>
  gruppeAbwaehlen: () => void
  istAdmin: (email: string) => boolean
  /** Logout-Cleanup: State leeren + IDB-Cache leeren (await wegen Hard-Nav, S149). */
  reset: () => Promise<void>
}

const LETZTE_GRUPPE_KEY = 'ueben-letzte-gruppe-id'

export const useUebenGruppenStore = create<UebenGruppenState>((set, get) => ({
  gruppen: [],
  aktiveGruppe: null,
  mitglieder: [],
  ladeStatus: 'idle',

  ladeGruppen: async (email: string, opts?: { force?: boolean }) => {
    set({ ladeStatus: 'laden' })

    try {
      // G.d.2 — Cache-First (sofern nicht force)
      let gruppen: Gruppe[] | null = null
      if (!opts?.force) gruppen = await getCachedGruppen()
      if (!gruppen) {
        gruppen = await uebenGruppenAdapter.ladeGruppen(email)
        await setCachedGruppen(gruppen)
      }

      // Auto-Select: 1 Gruppe → direkt aktiv, sonst letzte Gruppe aus localStorage
      let aktiveGruppe: Gruppe | null = null
      if (gruppen.length === 1) {
        aktiveGruppe = gruppen[0]
      } else if (gruppen.length > 1) {
        try {
          const letzteId = localStorage.getItem(LETZTE_GRUPPE_KEY)
          if (letzteId) {
            aktiveGruppe = gruppen.find(g => g.id === letzteId) || null
          }
        } catch { /* localStorage nicht verfügbar */ }
      }

      set({ gruppen, aktiveGruppe, ladeStatus: 'fertig' })

      if (aktiveGruppe) {
        try { localStorage.setItem(LETZTE_GRUPPE_KEY, aktiveGruppe.id) } catch { /* */ }
        try {
          // G.d.2 — Cache-First für Mitglieder
          let mitglieder: Mitglied[] | null = null
          if (!opts?.force) mitglieder = await getCachedMitglieder(aktiveGruppe.id)
          if (!mitglieder) {
            mitglieder = await uebenGruppenAdapter.ladeMitglieder(aktiveGruppe.id)
            await setCachedMitglieder(aktiveGruppe.id, mitglieder)
          }
          set({ mitglieder })
        } catch (err) {
          console.error('[GruppenStore] Mitglieder laden fehlgeschlagen:', err)
        }
      }
    } catch (err) {
      console.error('[GruppenStore] Gruppen laden fehlgeschlagen:', err)
      set({ ladeStatus: 'fehler' })
    }
  },

  waehleGruppe: async (gruppeId: string) => {
    const gruppe = get().gruppen.find(g => g.id === gruppeId)
    if (!gruppe) return

    set({ aktiveGruppe: gruppe })
    try { localStorage.setItem(LETZTE_GRUPPE_KEY, gruppeId) } catch { /* */ }

    try {
      // G.d.2 — Cache-First für Mitglieder bei Gruppen-Wechsel
      let mitglieder = await getCachedMitglieder(gruppeId)
      if (!mitglieder) {
        mitglieder = await uebenGruppenAdapter.ladeMitglieder(gruppeId)
        await setCachedMitglieder(gruppeId, mitglieder)
      }
      set({ mitglieder })
    } catch (err) {
      console.error('[GruppenStore] Mitglieder laden bei Gruppenwahl fehlgeschlagen:', err)
    }
  },

  gruppeAbwaehlen: () => {
    set({ aktiveGruppe: null, mitglieder: [] })
  },

  istAdmin: (email: string) => {
    const gruppe = get().aktiveGruppe
    if (!gruppe) return false
    return gruppe.adminEmail.toLowerCase() === email.toLowerCase()
  },

  reset: async () => {
    set({ gruppen: [], aktiveGruppe: null, mitglieder: [], ladeStatus: 'idle' })
    await clearGruppenCache()
  },
}))
```

**Wichtig:**
- `LETZTE_GRUPPE_KEY` und Auto-Select-Logic 1:1 erhalten — nur die Lade-Pfade um Cache-First erweitert.
- `force` wird durchgereicht zu **beiden** Cache-Lookups (Gruppen + Mitglieder) im selben Aufruf — Refresh-Pfad konsistent.
- `waehleGruppe` bekommt KEIN `force`-Argument (Spec § 309 lässt das offen, KISS-Pfad: User hat keinen Refresh-Button für Mitglieder; wenn doch, später ergänzen).

- [ ] **Step 4: Cache-Tests grün + bestehende Tests laufen**

```bash
cd ExamLab && npx vitest run src/tests/gruppenStoreCache.test.ts 2>&1 | tail -10
cd ExamLab && npx vitest run --reporter=basic 2>&1 | tail -5
```

Expected:
- gruppenStoreCache: 5/5 PASS
- Volle Suite: ~743 + 19 (6+8+5) bisher = ~762 grün; bestehende Tests dürfen sich NICHT ändern.

Bei Bruch eines bestehenden Tests: prüfen ob `useUebenGruppenStore`-Selektoren oder Setters durch das neue Interface inkompatibel werden — `reset` ist additiv, andere Methoden-Signaturen unverändert (außer `ladeGruppen` mit optionalem `opts`-Argument, das kein bestehender Caller setzt, also rückwärtskompatibel).

- [ ] **Step 5: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: clean. Bei TS-Fehler in Komponenten die `ladeGruppen` aufrufen: kein Aufrufer setzt aktuell ein zweites Argument (siehe `AppUeben.tsx:93`, `AdminSettings.tsx`), deshalb sollte die optionale Erweiterung sauber durchgehen.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/store/ueben/gruppenStore.ts ExamLab/src/tests/gruppenStoreCache.test.ts
git commit -m "G.d.2: gruppenStore Cache-First + reset() + 5 Unit-Tests"
```

---

## Task 5: `authStore.anmelden()` — LP-Login Pre-Fetch (3 Stores)

**Files:**
- Modify: `ExamLab/src/store/authStore.ts`
- Modify: `ExamLab/src/tests/authStoreLoginPrefetch.test.ts`

- [ ] **Step 1: Test-Erweiterung schreiben (failing)**

In `ExamLab/src/tests/authStoreLoginPrefetch.test.ts` an den vorhandenen Mocks ergänzen (oben, vor `import { useAuthStore }`):

```ts
const klassenlistenLadeMock = vi.fn(async () => {})
const klassenlistenResetMock = vi.fn(async () => {})
const gruppenLadeMock = vi.fn(async () => {})
const gruppenResetMock = vi.fn(async () => {})

vi.mock('../store/klassenlistenStore', () => ({
  useKlassenlistenStore: {
    getState: () => ({ lade: klassenlistenLadeMock, reset: klassenlistenResetMock }),
  },
}))

vi.mock('../store/ueben/gruppenStore', () => ({
  useUebenGruppenStore: {
    getState: () => ({ ladeGruppen: gruppenLadeMock, reset: gruppenResetMock }),
  },
}))
```

In `beforeEach` ergänzen:
```ts
klassenlistenLadeMock.mockClear()
klassenlistenResetMock.mockClear()
gruppenLadeMock.mockClear()
gruppenResetMock.mockClear()
```

Am Ende des `describe`-Blocks 3 neue Tests hinzufügen:

```ts
it('anmelden() (LP) feuert Pre-Fetch für Fragenbank + Klassenlisten + Gruppen', async () => {
  await useAuthStore.getState().anmelden(credential)
  expect(ladeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
  expect(klassenlistenLadeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
  expect(gruppenLadeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
})

it('anmelden() Pre-Fetch-Fehler werden silent geschluckt (kein Throw)', async () => {
  klassenlistenLadeMock.mockRejectedValueOnce(new Error('Backend down'))
  gruppenLadeMock.mockRejectedValueOnce(new Error('Backend down'))
  await expect(useAuthStore.getState().anmelden(credential)).resolves.toBeUndefined()
  await new Promise<void>((r) => setTimeout(r, 0)) // einmal ticken für Reject-Handler
})

it('abmelden() awaitet Promise.all der 3 reset()-Aufrufe vor window.location.href', async () => {
  let resolveK: (() => void) | undefined
  let resolveG: (() => void) | undefined
  klassenlistenResetMock.mockImplementationOnce(() => new Promise<void>((r) => { resolveK = r }))
  gruppenResetMock.mockImplementationOnce(() => new Promise<void>((r) => { resolveG = r }))

  let abgeschlossen = false
  const p = useAuthStore.getState().abmelden().then(() => { abgeschlossen = true })

  // Tick — abmelden darf NOCH NICHT durch sein, weil Promise.all hängt
  await new Promise<void>((r) => setTimeout(r, 0))
  expect(abgeschlossen).toBe(false)

  resolveK?.()
  resolveG?.()
  await p
  expect(abgeschlossen).toBe(true)
  expect(klassenlistenResetMock).toHaveBeenCalledTimes(1)
  expect(gruppenResetMock).toHaveBeenCalledTimes(1)
  expect(resetMock).toHaveBeenCalledTimes(1) // Fragenbank-reset auch
})
```

- [ ] **Step 2: Tests laufen — neue 3 sollen failen**

```bash
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts 2>&1 | tail -15
```

Expected: Bestand grün (~6 alt — die Datei testet G.c und enthält bereits Cases für Pre-Fetch/Reset), 3 neue FAIL (lade nicht mit klassenlistenStore aufgerufen, abmelden synchron etc.).

- [ ] **Step 3: `authStore.ts` editieren — Imports**

In `ExamLab/src/store/authStore.ts` direkt nach Zeile 8 (`import { useFragenbankStore } from './fragenbankStore.ts'`) ergänzen:

```ts
import { useKlassenlistenStore } from './klassenlistenStore.ts'
import { useUebenGruppenStore } from './ueben/gruppenStore.ts'
```

- [ ] **Step 4: Pre-Fetch in `anmelden()` (LP) ergänzen**

In `anmelden()` direkt nach dem bestehenden G.c-Block (aktuell Z. 142–144):

```ts
      // Bundle G.c — Fragenbank im Hintergrund vorladen, damit FragenBrowser instant rendert
      void useFragenbankStore.getState().lade(credential.email).catch((e) => {
        console.warn('[G.c] Fragenbank-Pre-Fetch fehlgeschlagen (silent):', e)
      })
```

ergänzen:

```ts
      // Bundle G.d.2 — Klassenlisten + Gruppen vorladen für instant Vorbereitungs-Tab + Üben-Kurs-Auswahl
      void useKlassenlistenStore.getState().lade(credential.email).catch((e) => {
        console.warn('[G.d.2] Klassenlisten-Pre-Fetch fehlgeschlagen (silent):', e)
      })
      void useUebenGruppenStore.getState().ladeGruppen(credential.email).catch((e) => {
        console.warn('[G.d.2] Gruppen-Pre-Fetch fehlgeschlagen (silent):', e)
      })
```

- [ ] **Step 5: `abmelden()` auf `Promise.all` umstellen**

Aktueller Block (Z. 199–215):

```ts
  abmelden: async () => {
    // Bundle G.c + S150-Hotfix — Frontend-Cache + IDB-Cache leeren bevor User wechselt.
    // … Kommentar bleibt …
    await useFragenbankStore.getState().reset()
    clearSession()
    await resetPruefungState()
    set({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
    if (typeof window !== 'undefined') {
      window.location.href = import.meta.env.BASE_URL + 'login'
    }
  },
```

ersetzen durch:

```ts
  abmelden: async () => {
    // Bundle G.c + G.d.2 + S150-Hotfix — Frontend-Cache + alle 3 IDB-Datenbanken leeren bevor User wechselt.
    // await ist kritisch: window.location.href triggert Page-Unload und bricht
    // in-flight IDB-Transaktionen ab (S149-Lehre, safety-pwa.md). Privacy-Garantie
    // hängt davon ab dass alle 3 reset()-Aufrufe vor der Hard-Nav committed sind.
    // Promise.all parallel — die 3 Datenbanken sind unabhängig, längste bestimmt
    // die Logout-Latenz (typisch ~50 ms).
    await Promise.all([
      useFragenbankStore.getState().reset(),
      useKlassenlistenStore.getState().reset(),
      useUebenGruppenStore.getState().reset(),
    ])
    clearSession()
    await resetPruefungState()
    set({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
    if (typeof window !== 'undefined') {
      window.location.href = import.meta.env.BASE_URL + 'login'
    }
  },
```

**Wichtig:**
- `Promise.all` parallel — keine Sequenz, weil Datenbanken unabhängig.
- `clearSession()` und `resetPruefungState()` bleiben SEQUENTIELL danach — sie haben Abhängigkeiten in den existierenden Code-Pfaden (S150-Hotfix).
- Reihenfolge im Code analog Spec § 173–177.

- [ ] **Step 6: tsc + neue Tests**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts 2>&1 | tail -10
```

Expected: tsc clean, alle Tests in dieser Datei PASS (Bestand + 3 neu). Implementer notiert die konkrete Zahl für die Erfolgs-Prüfung in Task 8.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/store/authStore.ts ExamLab/src/tests/authStoreLoginPrefetch.test.ts
git commit -m "G.d.2: LP-Login Pre-Fetch (3 Stores) + Logout Promise.all + 3 Tests"
```

---

## Task 6: `authStore.anmeldenMitCode()` — SuS-Login Pre-Fetch (nur Gruppen)

**Files:**
- Modify: `ExamLab/src/store/authStore.ts`
- Modify: `ExamLab/src/tests/authStoreLoginPrefetch.test.ts`

> **Hintergrund:** SuS hat keinen Zugriff auf Klassenlisten (LP-only). Nur `gruppenStore` macht Sinn — falls SuS nach der Prüfung in den Üben-Tab wechselt, sind die Gruppen warm. Spec Q3a-Entscheidung.

- [ ] **Step 1: Test-Case ergänzen**

In `ExamLab/src/tests/authStoreLoginPrefetch.test.ts` einen weiteren Test:

```ts
it('anmeldenMitCode() (SuS) feuert nur Gruppen-Pre-Fetch (NICHT Klassenlisten, NICHT Fragenbank)', async () => {
  await useAuthStore.getState().anmeldenMitCode('S123', 'Test SuS', 'sus@stud.gymhofwil.ch', 'tok')
  expect(gruppenLadeMock).toHaveBeenCalledWith('sus@stud.gymhofwil.ch')
  expect(klassenlistenLadeMock).not.toHaveBeenCalled()
  expect(ladeMock).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Test failt**

```bash
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts -t "anmeldenMitCode" 2>&1 | tail -10
```

Expected: FAIL — `gruppenLadeMock` nicht aufgerufen.

- [ ] **Step 3: `anmeldenMitCode()` editieren**

Aktuell (Z. 150–167):

```ts
  anmeldenMitCode: async (schuelerId: string, name: string, email: string, sessionToken?: string) => {
    const user: AuthUser = { /* … */ }
    await resetPruefungState()
    saveSession(user)
    saveDemoFlag(false)
    set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
  },
```

direkt vor dem schliessenden `},` ergänzen:

```ts
    // Bundle G.d.2 — SuS profitiert vom Gruppen-Pre-Fetch falls Wechsel in den Üben-Tab nach Prüfung.
    // KEIN Klassenlisten-Pre-Fetch (LP-only). KEIN Fragenbank-Pre-Fetch (LP-only).
    void useUebenGruppenStore.getState().ladeGruppen(email).catch((e) => {
      console.warn('[G.d.2] Gruppen-Pre-Fetch fehlgeschlagen (SuS, silent):', e)
    })
```

- [ ] **Step 4: tsc + Test grün**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
cd ExamLab && npx vitest run src/tests/authStoreLoginPrefetch.test.ts 2>&1 | tail -10
```

Expected: tsc clean, alle Tests in dieser Datei PASS (1 mehr als nach Task 5).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/store/authStore.ts ExamLab/src/tests/authStoreLoginPrefetch.test.ts
git commit -m "G.d.2: SuS-anmeldenMitCode Pre-Fetch nur Gruppen + 1 Test"
```

---

## Task 7: `VorbereitungPhase.tsx` — Component-Integration

**Files:**
- Modify: `ExamLab/src/components/lp/vorbereitung/VorbereitungPhase.tsx`

> **Ziel:** Lokales `useState<KlassenlistenSuS[]>` + `useCallback ladeKlassenlisten` durch Selektor auf `useKlassenlistenStore` ersetzen. Refresh-Button nutzt `force: true`.

- [ ] **Step 1: Lesen + Verstehen (Caller-Spots)**

Relevant in `VorbereitungPhase.tsx` (Z. 1–69 + 296–297):
- Z. 24: `const [rohDaten, setRohDaten] = useState<KlassenlistenSuS[]>([])`
- Z. 25: `const [ladeStatus, setLadeStatus] = useState<...>('idle')`
- Z. 26: `const [fehler, setFehler] = useState('')`
- Z. 48–67: `ladeKlassenlisten` useCallback
- Z. 69: `useEffect(() => { ladeKlassenlisten() }, [ladeKlassenlisten])`
- Z. 296–297: Refresh-Button-Handler

`KlassenlistenSuS` ist der UI-Type aus `KursAuswahl.tsx`; `KlassenlistenEintrag` ist der API-Type. Mapping (Z. 54–60) bleibt nötig — der Store hält API-Typen, die Komponente mappt für die UI.

- [ ] **Step 2: Imports ergänzen**

In den Top-Imports von `VorbereitungPhase.tsx`:

```ts
import { useKlassenlistenStore } from '../../../store/klassenlistenStore'
```

- [ ] **Step 3: State + Lade-Logic ersetzen**

Block Z. 24–67 ersetzen durch:

```tsx
  // G.d.2 — Klassenlisten via Cache-First Store statt lokalem useState.
  // Der Store cached die roh-API-Antwort; das UI-Mapping (KlassenlistenEintrag → KlassenlistenSuS)
  // bleibt hier, weil es UI-Concern ist (kurs-Default '—').
  const klassenlistenDaten = useKlassenlistenStore((s) => s.daten)
  const klassenlistenLadeStatus = useKlassenlistenStore((s) => s.ladeStatus)
  const klassenlistenLade = useKlassenlistenStore((s) => s.lade)
  const [fehler, setFehler] = useState('')

  const rohDaten: KlassenlistenSuS[] = useMemo(
    () => (klassenlistenDaten ?? []).map((e) => ({
      email: e.email,
      name: e.name,
      vorname: e.vorname,
      klasse: e.klasse,
      kurs: e.kurs || '—',
    })),
    [klassenlistenDaten]
  )
  const ladeStatus = klassenlistenLadeStatus
```

`ladeKlassenlisten` als kleiner Wrapper für die beiden Aufrufer (Refresh-Button + Mount-Effect):

```tsx
  const ladeKlassenlisten = useCallback(
    async (force = false) => {
      if (!user || !apiService.istKonfiguriert()) return
      setFehler('')
      try {
        await klassenlistenLade(user.email, force ? { force: true } : undefined)
        if (useKlassenlistenStore.getState().ladeStatus === 'fehler') {
          setFehler('Klassenlisten konnten nicht geladen werden.')
        }
      } catch (err) {
        setFehler(String(err))
      }
    },
    [user, klassenlistenLade]
  )
```

`useEffect`-Mount-Trigger (Z. 69) bleibt **strukturell**, aber an die neue Signatur angepasst:

```tsx
  useEffect(() => { ladeKlassenlisten() }, [ladeKlassenlisten])
```

(Der Store ist intern Cache-First — der `useEffect`-Aufruf bleibt unverändert, profitiert transparent.)

- [ ] **Step 4: Refresh-Button auf force umstellen**

Z. 296–297 ersetzen:

```tsx
              onClick={(e) => { e.stopPropagation(); ladeKlassenlisten(true) }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); ladeKlassenlisten(true) } }}
```

`true` → `force: true` → Cache-Bypass + frische Backend-Antwort.

- [ ] **Step 5: Imports + alte Setter aufräumen**

`apiService` bleibt im Top-Import (wird in `ladeKlassenlisten` über Store-Indirektion benutzt, aber die Komponente prüft `istKonfiguriert()` direkt).

`useState`-Import bleibt (für `fehler`-State).

Sanity-Check nach dem Edit:

```bash
cd ExamLab && grep -n "setLadeStatus\|setRohDaten" src/components/lp/vorbereitung/VorbereitungPhase.tsx
```

Expected: leer. Wenn doch Treffer: Edit unvollständig — entfernen.

- [ ] **Step 6: tsc + Build + Volle Tests**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
cd ExamLab && npx vitest run --reporter=basic 2>&1 | tail -5
cd ExamLab && npm run build 2>&1 | tail -3
```

Expected: tsc clean, alle Tests grün, build OK.

Bei TS-Fehler wegen unused-Variable: ggf. `setLadeStatus`/`setRohDaten` aus dem Bestand entfernt — sicherstellen dass die alten Setter komplett weg sind und keine Caller mehr referenzieren.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/lp/vorbereitung/VorbereitungPhase.tsx
git commit -m "G.d.2: VorbereitungPhase nutzt klassenlistenStore (Cache-First + force für Refresh)"
```

---

## Task 8: Voll-Verify

**Files:** keine

- [ ] **Step 1: Komplette Test-Suite + tsc + build**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3 && npx vitest run --reporter=basic 2>&1 | tail -5 && npm run build 2>&1 | tail -3
```

Expected:
- tsc: clean
- vitest: ~743 Baseline + 6 (klassenlistenCache) + 8 (gruppenCache) + 5 (klassenlistenStore) + 5 (gruppenStoreCache) + 4 (authStoreLoginPrefetch neu) = ~771 grün
- build: erfolgreich, keine Warnings ausser bekannten

Falls Tests brechen die nicht zu G.d.2 gehören: nicht überspielen — diagnostizieren. Häufige Ursachen:
1. `useFragenbankStore`-Mock-Konflikt mit neuem authStore-Mock-Setup → Test-Setup pro Datei prüfen
2. `localStorage`-State zwischen Tests → in beforeEach explizit löschen
3. fake-indexeddb-Datenbank-Reuse zwischen Tests → `clearXxxCache` in beforeEach

- [ ] **Step 2: Manuelle Inspektion auf häufige Fallen**

Suchen nach:

```bash
cd ExamLab && grep -n "useState<KlassenlistenSuS" src/components/lp/vorbereitung/VorbereitungPhase.tsx
```

Expected: leer (keinen lokalen State mehr).

```bash
cd ExamLab && grep -rn "useUebenGruppenStore" src/ | grep -v ".test." | wc -l
```

Expected: ≥ 13 Vorkommen (Caller unverändert).

```bash
cd ExamLab && grep -n "Promise.all" src/store/authStore.ts
```

Expected: 1 Treffer (in `abmelden()`).

- [ ] **Step 3: Commit (leer falls keine Änderung)**

Wenn keine Anpassung nötig: nichts committen, weiter zu Task 9.

---

## Task 9: Browser-E2E auf staging

**Files:** keine

- [ ] **Step 1: Test-Plan schreiben (in den Chat, nicht in eine Datei)**

Format wie in `regression-prevention.md` Phase 3.0:

```
## Test-Plan G.d.2 — Browser-E2E

### Trigger 1 — LP-Login frisch (kein Cache)
1. DevTools → Application → IndexedDB löschen (alle 3 examlab-* DBs)
2. LP-Login wr.test@gymhofwil.ch
3. Klick „Durchführen" auf eine Prüfung → Tab Vorbereitung
4. Erwartung: Klassenliste lädt 2–3 s (Cache-Miss erste Session)
5. Network-Tab: ladeKlassenlisten-Call sichtbar
6. IDB nach Render: examlab-klassenlisten-cache hat Daten in store=data

### Trigger 2 — LP Re-Login (Cache da)
1. Logout → Re-Login (NICHT Hard-Reload, weil sessionStorage gelöscht wäre)
   alternativ: Tab schließen + neu öffnen + Login
2. Klick „Durchführen" → Vorbereitung
3. Erwartung: Klassenliste rendert ≤300 ms (Cache-Hit)
4. Network-Tab: KEIN ladeKlassenlisten-Call beim Mount

### Trigger 3 — Refresh-Button (force)
1. Auf Vorbereitungs-Tab: „Neu laden"-Klick
2. Erwartung: Network-Call sichtbar, Klassenliste neu gefüllt

### Trigger 4 — SuS-Login + Üben-Tab
1. Cache leer
2. SuS-Login wr.test@stud.gymhofwil.ch (über Schülercode wenn nötig)
3. Klick auf Üben-Tab
4. Erwartung: Gruppen lädt 2–3 s (erste Session)
5. IDB: examlab-gruppen-cache hat Daten in stores gruppen + mitglieder

### Trigger 5 — SuS Re-Login Üben (Cache da)
1. Re-Login SuS (Tab neu öffnen, Cache nicht löschen)
2. Klick Üben-Tab
3. Erwartung: Gruppen rendert ≤300 ms

### Trigger 6 — Logout-Privacy
1. LP eingeloggt mit gefüllten Caches (siehe Trigger 1+ und Sammlung-Tab einmal öffnen für Fragenbank-Cache)
2. DevTools → Application → IndexedDB:
   - examlab-fragenbank-cache: Daten in summaries + details + meta
   - examlab-klassenlisten-cache: Daten in data + meta
   - examlab-gruppen-cache: Daten in gruppen + mitglieder + meta
3. „Abmelden" klicken
4. Auf /login zurück
5. DevTools → IDB: alle 3 Datenbanken haben LEERE Stores (alle key-Listen leer)
   → Privacy-Garantie für geteilte Schul-Geräte

### Regression-Checks (kritische Pfade aus regression-prevention.md)
- LP Monitoring nach Re-Login funktioniert (kein State stuck im Pre-Fetch)
- SuS-Prüfung-Heartbeat unverändert
- LP-Korrektur unverändert (nutzt anderen Store)
- Demo-Modus-Login → KEIN Pre-Fetch (anderer Code-Pfad), keine Crashes
- Üben-Standalone-Login (uebenAuthStore) → Cache füllt sich beim ersten Mount, kein Crash

### Security-Check
- IDB nach Logout LEER für alle 3 DBs (siehe Trigger 6)
- SuS sieht in keiner IDB Klassenlisten-Daten (Privacy: SuS triggert nie Klassenlisten-Pre-Fetch)
- Memory: useKlassenlistenStore.getState().daten === null nach Logout (Browser-Console)

### Latenz-Messung (Akzeptanz-Kriterium)
- Trigger 2 + 5: tatsächliche Render-Zeit der Dropdowns notieren (DevTools-Performance oder einfach „spürbar instant" als Mindeststandard ≤300 ms)
```

- [ ] **Step 2: Branch zu staging deployen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
# Pre-Push-Check (Memory-Regel feedback_preview_forcepush.md):
git log preview..HEAD --oneline | head -10
git log HEAD..preview --oneline | head -10
```

Wenn `preview` eindeutige Commits hat die NICHT auf `feature/...` sind: STOP und User fragen — niemals fremde preview-Arbeit überschreiben.

```bash
git push -u origin feature/bundle-g-d-2-stammdaten-idb-cache
git push origin feature/bundle-g-d-2-stammdaten-idb-cache:preview --force-with-lease
```

Auf staging-Deploy warten (~2 min). Bei Hänger: leerer Commit + Re-Push (Pattern aus G.b/G.c).

- [ ] **Step 3: Tab-Gruppe öffnen + Test**

User öffnet 2 Tabs:
- Tab A: LP-Login `wr.test@gymhofwil.ch`
- Tab B: SuS-Login `wr.test@stud.gymhofwil.ch`

Claude erstellt die Tab-Gruppe via `tabs_context_mcp` (createIfEmpty: true), wartet auf User-Bestätigung „kannst loslegen", dann:
- arbeitet Trigger 1–6 ab
- IDB-Inhalte vor/nach Logout in DevTools-Application-Panel inspizieren (Screenshot oder textuelle Beschreibung)
- Latenz-Messungen dokumentieren

- [ ] **Step 4: Ergebnisse in den Chat dokumentieren**

Für jeden Trigger und jeden Regression-Check: ✓ / ✗ mit Mess-Wert oder konkreter Beobachtung.

Bei Failure: Bug analysieren, Fix-Commit auf demselben Branch, Re-Deploy auf preview, Re-Test.

---

## Task 10: Merge nach `main`

> **Hard-Stop-Voraussetzungen** (aus `.claude/rules/regression-prevention.md`):
> - [ ] Browser-E2E (Task 9) durchgeführt mit Befund „alle Trigger erfolgreich, Privacy bestätigt"
> - [ ] Security-Check explizit positiv
> - [ ] User hat **explizit „Merge OK"** geschrieben
> - [ ] HANDOFF.md aktualisiert

- [ ] **Step 1: HANDOFF.md aktualisieren**

In `ExamLab/HANDOFF.md` an die „Aktueller Stand"-Sektion anhängen (Format wie S147–S152 in Memory zu ersehen):

```
S153 (DATUM-aktuell) — Bundle G.d.2 auf `main`
- 2 neue Cache-Module + 1 neuer Store + gruppenStore-Erweiterung + 4 authStore-Edits + 1 Component-Integration
- ~28 neue vitest grün, Baseline ~771 total
- 3 IDB-Datenbanken parallel beim Logout geleert (Privacy-Garantie)
- LP-Vorbereitungs-Tab + SuS-Üben-Tab auf Cache-Hit ≤300 ms (statt 2–3 s) — Mess-Werte aus Browser-E2E
- Next: G.e (Fragensammlung-Virtualisierung) oder G.f (LP-Startseite-Skeleton)
```

```bash
git add ExamLab/HANDOFF.md
git commit -m "G.d.2: HANDOFF.md S153 — Bundle G.d.2 Stammdaten-IDB-Cache"
```

- [ ] **Step 2: Merge**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull
git merge --no-ff feature/bundle-g-d-2-stammdaten-idb-cache -m "ExamLab G.d.2: Stammdaten-IDB-Cache (Klassenlisten + Gruppen)"
git push origin main
```

Expected: GitHub Actions deployed automatisch nach `main`.

- [ ] **Step 3: Branches aufräumen**

```bash
git branch -d feature/bundle-g-d-2-stammdaten-idb-cache
git push origin --delete feature/bundle-g-d-2-stammdaten-idb-cache
```

Wenn `git branch -d` mit „not fully merged" ablehnt: prüfen ob alle Commits auf main sind (`git log main --oneline | grep G.d.2 | wc -l`). Erst nach Verifikation `git branch -D` mit Begründung.

- [ ] **Step 4: Memory-Update**

Anlegen: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_s153_bundle_g_d_2.md` mit Stack analog zu `project_s149_bundle_gc.md` (~10 Zeilen Eckdaten + Mess-Werte).

`MEMORY.md`-Index-Eintrag ergänzen, eine Zeile, < 200 Zeichen, am sinnvollen Platz neben den anderen Bundle-G-Einträgen.

---

## Erfolgskriterien (Akzeptanz)

| Kriterium | Wert | Mess-Methode |
|---|---|---|
| Vitest-Tests grün | ~771 (Baseline + ~28) | `npx vitest run` |
| `tsc -b` clean | ja | `npx tsc -b` |
| `npm run build` erfolgreich | ja | `npm run build` |
| LP-Vorbereitungs-Tab Klassenliste (Cache-Hit) | ≤300 ms | Browser-DevTools Performance |
| SuS-Üben-Tab Kurs-Auswahl (Cache-Hit) | ≤300 ms | Browser |
| Logout: 3 IDB-Datenbanken alle leer | ja | DevTools → Application → IndexedDB |
| G.c Logout-Cleanup unverändert | Fragenbank-IDB nach Logout leer | DevTools |
| G.d.1 Polling unverändert | Lobby 5 s | DevTools Network |
| Bestehende `gruppenStore`-Tests grün | ja | vitest, vor/nach |
| Demo-Modus kein Pre-Fetch | bestätigt | Network-Tab beim demoStarten() |

## Anti-Patterns vermeiden

- **Kein `await`** auf Pre-Fetch in `anmelden`/`anmeldenMitCode` — würde Login-UX blockieren. `void` + `.catch` ist Pflicht.
- **Kein `Promise.all` ohne `await`** im `abmelden` — würde die Privacy-Garantie brechen. Hard-Nav muss erst NACH der Resolution feuern.
- **Kein zusätzlicher `clearXxxCache()`-Aufruf** im `abmelden` — `reset()` macht das schon (analog G.c).
- **Kein Pre-Fetch im `useUebenAuthStore`** (Üben-Standalone-Login). Spec ausgeklammert; Cache füllt sich beim Mount transparent.
- **Kein Pre-Fetch im `demoStarten()`** — Demo hat keine Backend-Verbindung.
- **Kein Override der `LETZTE_GRUPPE_KEY`-Auto-Select-Logic** — Erweiterung ist additiv.
- **Kein Cache-Invalidation auf Schreib-Operationen** (Spec Q2a — KISS, Refresh-Button reicht).
- **Kein Refactor von `useUebenGruppenStore`-Caller-Komponenten** — bestehende Aufrufe profitieren transparent durch Cache-First, keine Breite-Änderung nötig.
- **Kein Linting-Cleanup nebenbei** — wenn der Implementer beim Editieren toten Code oder Cleanup-Möglichkeiten sieht: separat dokumentieren als spawn_task, NICHT inline mit G.d.2.
- **Keine Erweiterung von `force` auf `waehleGruppe`** — KISS, Spec hat Refresh-Pfad für Mitglieder-Cache offen gelassen.
- **Kein parallel `set()` im Store** — Auto-Select-Logic ist sequentiell, gewollt (1 set für gruppen+aktiveGruppe+ladeStatus, dann separate set für mitglieder).

## Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Mitigation |
|---|---|---|
| fake-indexeddb inkompatibel mit React 19 / Vitest neue Version | gering | Bei Setup-Schritt direkt in Task 0 prüfen — Baseline läuft danach |
| Bestehende `gruppenStore`-Snapshots in anderen Tests brechen | mittel | Task 4 Step 4 explizit volle Suite laufen lassen |
| `VorbereitungPhase`-Refactor verändert Render-Verhalten subtil (z.B. wegen useMemo statt useState) | mittel | Browser-E2E Trigger 1+3 deckt das ab |
| Üben-Tab im LP-Admin-Modus (LP ist auch admin einer Gruppe) — Pre-Fetch trifft ihn doppelt | gering | beide Pre-Fetch-Pfade sind no-op-tolerant — duplicate `lade` updates State idempotent |
| Race: SuS macht Logout während gerade `setCachedMitglieder` läuft | gering | `clearGruppenCache` `tx.oncomplete`-await — hängt im Worst-Case kurz, aber leert konsistent |
| Apps-Script ändert Gruppen-Schema während Cache TTL gilt | sehr gering | TTL 24 h + Refresh-Button als Notnagel; Spec Q2a |
