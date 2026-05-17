# Cluster E.3–E.5 Favoriten-Backend-Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LP-Favoriten von localStorage zu Backend-`LPProfil.favoriten` migrieren (E.3), Star-Toggle in 20 Tab-Headers (E.4), Favoriten-Picker-Modal mit Tab-Registry (E.5).

**Architecture:** Backend = source of truth. `favoritenStore` wird thin Facade über `stammdatenStore.lpProfil.favoriten` (KEIN Subscriber — zwei explizite Trigger). Optimistic Update + Server-Refetch bei Save-Error. Demo-Mode bleibt frontend-only.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind, Vitest, Lucide-Icons. Apps-Script-Backend unverändert (existierende `ladeLPProfil`/`speichereLPProfil`-Endpoints).

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-17-cluster-e-3-bis-e-5-favoriten-design.md`

**Workflow-Konventionen (Pflicht jede Phase):**
- Vor Push: `cd ExamLab && npm run ci-check` (matched CI 1:1)
- Push-Reihenfolge: preview-first, dann main (pre-push-hook erzwingt ci-check)
- Working-dir: `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY`
- Commit-Messages mit `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

---

## File Structure

### Neue Files
| Pfad | Verantwortung | Grösse |
|---|---|---|
| `ExamLab/src/types/favorit.ts` | `Favorit`-Interface, isoliert für no-circular-import | ~10 Z. |
| `ExamLab/src/components/lp/TabStarToggle.tsx` | Star-Button für Tab-Header (E.4) | ~45 Z. |
| `ExamLab/src/components/lp/TabStarToggle.test.tsx` | Unit-Tests für TabStarToggle | ~80 Z. |
| `ExamLab/src/components/lp/FavoritenPicker.tsx` | Modal mit Tab-Registry-Liste (E.5) | ~160 Z. |
| `ExamLab/src/components/lp/FavoritenPicker.test.tsx` | Unit-Tests für Picker | ~120 Z. |

### Geänderte Files
| Pfad | Änderung | Phase |
|---|---|---|
| `ExamLab/src/store/favoritenStore.ts` | `persist` raus, Type-Re-Export, neue Actions | 1 + 2 |
| `ExamLab/src/store/favoritenStore.test.ts` | persist-v1→v2-Tests droppen, neue Backend-Tests | 2 |
| `ExamLab/src/types/stammdaten.ts` | `LPProfil.favoriten`: `AppOrt[]` → `Favorit[]`, `AppOrt`-Type löschen | 1 |
| `ExamLab/src/store/stammdatenStore.ts` | `ladeLPProfil` defensive Legacy-Drop | 1 |
| `ExamLab/src/store/stammdatenStore.test.ts` | Test für Legacy-Drop (falls Datei existiert; sonst neu) | 1 |
| `ExamLab/src/hooks/useLPDashboardData.ts` | Z. 73-89 Migrator → `ladeAusBackend()`-Trigger | 1 + 3 |
| `ExamLab/src/tests/LPStartseite.test.tsx` | Test für `favoritenStore.ladeAusBackend`-Aufruf nach Login | 3 |
| `ExamLab/src/components/lp/Favoriten.tsx` | Skeleton während `favoritenStore.ladeStatus === 'laeuft'` | 3 |
| `ExamLab/src/components/lp/hilfe/layoutHelpers.tsx` | `<TitelMitStern>`-Wrapper für Hilfe-Tab-Headers | 5 |
| 10× `ExamLab/src/components/lp/hilfe/*.tsx` Tab-Files | `<Titel>` → `<TitelMitStern tabId=... titel=...>` | 5 |
| 10× `ExamLab/src/components/settings/*Tab.tsx` Tab-Files | `<TabStarToggle>` neben dem Tab-Header-Titel | 5 |
| `ExamLab/src/components/settings/FavoritenTab.tsx` | „+ Tab-Favorit hinzufügen"-Button + Picker-Wiring | 6 |

### Unangetastet (bewusst)
- `ExamLab/apps-script-code.js` — `ladeLPProfilEndpoint` + `speichereLPProfilEndpoint` funktionieren bereits korrekt mit dem neuen `Favorit[]`-Schema (Backend speichert JSON-Blob, kein Schema-Validierung)
- `ExamLab/src/store/authStore.ts` Demo-Seed Z. 210-217 — Entscheidung #9: Demo-Pfad bleibt frontend-only, kein Konflikt mit Backend-Sync
- `ExamLab/src/components/settings/FavoritenTab.tsx` `<NavigationsBaum>` (Z. 87-103) — bleibt für App-Ort-Hinzufügen; Picker ist nur für Tab-Surfaces

---

## Phase 1: Foundation — Atomic Type-Switch

**Ziel:** `Favorit`-Type isoliert, `LPProfil.favoriten` umtypisiert, alle Konsumenten in EINEM Commit aktualisiert (sonst kein tsc-clean).

**Files:**
- Create: `ExamLab/src/types/favorit.ts`
- Modify: `ExamLab/src/store/favoritenStore.ts`
- Modify: `ExamLab/src/types/stammdaten.ts`
- Modify: `ExamLab/src/store/stammdatenStore.ts`
- Modify: `ExamLab/src/hooks/useLPDashboardData.ts:73-89`
- Modify/Create: `ExamLab/src/store/stammdatenStore.test.ts` (Legacy-Drop-Test)

- [ ] **Step 1: AppOrt-Audit — verifiziere die einzige Konsument-Stelle**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -rn "AppOrt\|f\.titel\|f\.screen\|f\.params" ExamLab/src --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected output: nur 3 Files
- `ExamLab/src/types/stammdaten.ts` (Type-Definition)
- `ExamLab/src/hooks/useLPDashboardData.ts` (Migrator Z. 73-89)
- `ExamLab/src/store/favoritenStore.ts` (Test-Daten in alter onRehydrateStorage-Migration)

Falls weitere Treffer → STOPP und ergänze diese in Phase 1 mit.

- [ ] **Step 2: Test für stammdatenStore-Legacy-Drop schreiben (failing)**

Check first: `ls "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/src/store/stammdatenStore.test.ts"`. Falls nicht vorhanden, neu erstellen.

```tsx
// ExamLab/src/store/stammdatenStore.test.ts (neu oder erweitert)
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStammdatenStore } from './stammdatenStore'

// Mock postJson
vi.mock('../services/apiClient', () => ({
  postJson: vi.fn(),
}))
import { postJson } from '../services/apiClient'

describe('stammdatenStore.ladeLPProfil — Cluster E.3 Legacy-Drop', () => {
  beforeEach(() => {
    useStammdatenStore.setState({ lpProfil: null, stammdaten: useStammdatenStore.getState().stammdaten })
    vi.mocked(postJson).mockReset()
  })

  it('droppt Legacy-AppOrt-Favoriten (kein typ-Feld)', async () => {
    vi.mocked(postJson).mockResolvedValue({
      profil: {
        email: 'lp@test.ch',
        kursIds: [],
        fachschaftIds: [],
        gefaesse: [],
        favoriten: [
          { id: 'old-1', titel: 'Alt', screen: 'pruefung', params: { configId: 'x' }, erstelltAm: '2026-01-01' },
        ],
      },
    })
    await useStammdatenStore.getState().ladeLPProfil('lp@test.ch')
    expect(useStammdatenStore.getState().lpProfil?.favoriten).toEqual([])
  })

  it('akzeptiert neue Favorit-Shape', async () => {
    vi.mocked(postJson).mockResolvedValue({
      profil: {
        email: 'lp@test.ch',
        kursIds: [],
        fachschaftIds: [],
        gefaesse: [],
        favoriten: [
          { typ: 'ort', ziel: '/a', label: 'A', sortierung: 0 },
        ],
      },
    })
    await useStammdatenStore.getState().ladeLPProfil('lp@test.ch')
    const fav = useStammdatenStore.getState().lpProfil?.favoriten
    expect(fav).toHaveLength(1)
    expect(fav?.[0].ziel).toBe('/a')
  })
})
```

- [ ] **Step 3: Test laufen lassen → muss fail (noch keine Legacy-Drop-Logik)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/store/stammdatenStore.test.ts
```

Expected: 1 fail (Legacy-Drop-Test), 1 pass (new-shape-Test trivial true)

- [ ] **Step 4: `src/types/favorit.ts` erstellen**

```ts
// ExamLab/src/types/favorit.ts
/**
 * Favorit — Account-verknüpfter Eintrag in LPProfil.favoriten (cross-device).
 * Diskriminator `typ` unterscheidet App-Orte von Inhalten.
 * Cluster E.3 (17.05.2026): aus favoritenStore.ts extrahiert, um circular import
 * `stammdaten.ts ← favoritenStore.ts ← stammdaten.ts` zu vermeiden.
 */
export interface Favorit {
  typ: 'ort' | 'pruefung' | 'uebung' | 'frage' | 'einstellungen-tab' | 'hilfe-tab'
  ziel: string       // Route-Pfad oder Config-ID
  label: string      // Anzeigename
  icon?: string      // Lucide-Component-Name (canonical seit v2 17.05.2026)
  sortierung: number
}
```

- [ ] **Step 5: `favoritenStore.ts` — Re-Export für Backwards-Compat**

In `ExamLab/src/store/favoritenStore.ts`:
- Z. 9-17: das alte `export interface Favorit { ... }` ERSETZEN durch:

```ts
import { iconStringToCanonicalKey } from '../components/ui/icons/NavIcon'
import type { Favorit } from '../types/favorit'

// Re-Export für Backwards-Compat (9+ Konsumenten importieren von hier)
export type { Favorit } from '../types/favorit'
```

(Phase 2 ändert weitere Teile des Stores. Hier nur die Type-Auslagerung.)

- [ ] **Step 6: `LPProfil.favoriten` Type umstellen + `AppOrt` löschen**

In `ExamLab/src/types/stammdaten.ts`:
1. Am Datei-Anfang: `import type { Favorit } from './favorit'` ergänzen.
2. Interface `AppOrt` (Z. 41-47) komplett löschen inkl. JSDoc-Block.
3. `LPProfil.favoriten?: AppOrt[]` → `favoriten?: Favorit[]  // E.3: cross-device sync`

- [ ] **Step 7: `useLPDashboardData.ts` Migrator entfernen**

In `ExamLab/src/hooks/useLPDashboardData.ts`:
- Z. 73-89 (kompletter `.then((..)=>{...})`-Block der AppOrt→Favorit migriert) ERSETZEN durch:

```ts
      ladeLPProfil(user.email).then(() => {
        // Cluster E.3: Hydrate favoritenStore aus LPProfil.favoriten (Server-State)
        useFavoritenStore.getState().ladeAusBackend()
      })
```

NOTE: `ladeAusBackend()` existiert noch nicht. tsc wird das melden. Wir lösen es in Phase 2. Damit Phase 1 trotzdem tsc-clean ist, definieren wir es als no-op in Phase 1 in favoritenStore.ts:

In `ExamLab/src/store/favoritenStore.ts` zur Interface ergänzen:
```ts
interface FavoritenStore {
  ...
  ladeAusBackend: () => Promise<void>  // Phase 2: echte Logik
  ...
}
```
und im `create<...>()(persist(...))`-Body als no-op:
```ts
ladeAusBackend: async () => { /* Phase 2: hydrate aus stammdatenStore */ },
```

- [ ] **Step 8: `stammdatenStore.ts` Legacy-Drop ergänzen**

In `ExamLab/src/store/stammdatenStore.ts` Z. 72-81 (`ladeLPProfil`-Action) ergänzen vor `set({ lpProfil: profil })`:

```ts
  ladeLPProfil: async (email: string) => {
    try {
      const result = await postJson<{ profil: LPProfil }>('ladeLPProfil', { callerEmail: email })
      if (result?.profil) {
        const profil = result.profil
        // Cluster E.3: Drop legacy AppOrt-favoriten (kein Migration-Code, siehe Entscheidung #5).
        // Heuristik: alter AppOrt-Type hat `id` aber kein `typ`/`ziel`.
        if (Array.isArray(profil.favoriten) && profil.favoriten.length > 0) {
          const first = profil.favoriten[0] as { typ?: string; ziel?: string }
          if (!('typ' in first) || !first.typ || !first.ziel) {
            profil.favoriten = []
          }
        }
        set({ lpProfil: profil })
      }
    } catch (error) {
      console.error('[Stammdaten] LP-Profil Fehler:', error)
    }
  },
```

- [ ] **Step 9: vitest laufen lassen — Legacy-Drop-Test muss grün, alles andere darf nicht brechen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/store/stammdatenStore.test.ts
```

Expected: alle Tests grün.

- [ ] **Step 10: tsc -b — muss clean sein**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b
```

Expected: kein Output, exit 0.

- [ ] **Step 11: ci-check (Pflicht vor Push)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run ci-check 2>&1 | tail -10
```

Expected: `✅` aller 8 lint-Gates, vitest 1890+ grün, build clean.

- [ ] **Step 12: Commit + Push preview, dann main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Cluster E.3 Phase 1: Favorit-Type-Auslagerung + LPProfil-Type-Switch (Atomic)

Atomic-Bundle für tsc-clean Type-Migration:
- src/types/favorit.ts NEU: Favorit-Interface isoliert (no circular import)
- favoritenStore.ts: Re-Export Favorit aus types/favorit (Backwards-Compat
  für 9+ Konsumenten), no-op ladeAusBackend (Phase 2 echte Logik)
- stammdaten.ts: LPProfil.favoriten AppOrt[] -> Favorit[], AppOrt-Type
  geloescht
- stammdatenStore.ts: ladeLPProfil defensive Legacy-Drop fuer
  Pre-E.3-Daten (Dev-User-Test-State, akzeptabel weil nicht in Produktion)
- useLPDashboardData.ts: Migrator-Block (Z. 73-89) ersetzt durch
  favoritenStore.ladeAusBackend()-Trigger
- stammdatenStore.test.ts NEU/erweitert: Legacy-Drop-Test (2 Cases)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin HEAD:preview
git push origin main
```

(Falls preview-Push fehlschlägt mit Konflikt: `git fetch origin && git rebase origin/preview` und nochmal probieren.)

---

## Phase 2: favoritenStore Refactor

**Ziel:** `persist` raus, neue Actions (`ladeAusBackend`, optimistic-update mit Server-Refetch), Demo-Mode-Pfad korrekt.

**Files:**
- Modify: `ExamLab/src/store/favoritenStore.ts`
- Modify: `ExamLab/src/store/favoritenStore.test.ts`

- [ ] **Step 1: Bestehende `favoritenStore.test.ts`-Tests bereinigen + neue Tests schreiben**

In `ExamLab/src/store/favoritenStore.test.ts`:
1. Drop kompletten `describe('persist-Migration v1 → v2', ...)`-Block (Z. 9-57) — ohne `persist` keine Migration-Tests mehr.
2. Ergänze nach den existierenden Basistests:

```tsx
import { useStammdatenStore } from './stammdatenStore'
import { useToastStore } from './toastStore'

describe('favoritenStore — Backend-Sync (Cluster E.3)', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
    useStammdatenStore.setState({ lpProfil: null })
  })

  it('ladeAusBackend hydratet aus stammdatenStore.lpProfil', async () => {
    useStammdatenStore.setState({
      lpProfil: {
        email: 'lp@test.ch',
        kursIds: [],
        fachschaftIds: [],
        gefaesse: [],
        favoriten: [{ typ: 'ort', ziel: '/a', label: 'A', sortierung: 0 }],
      },
    })
    await useFavoritenStore.getState().ladeAusBackend()
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    expect(useFavoritenStore.getState().favoriten[0].ziel).toBe('/a')
    expect(useFavoritenStore.getState().ladeStatus).toBe('fertig')
  })

  it('ladeAusBackend bei fehlendem lpProfil setzt leere Liste', async () => {
    await useFavoritenStore.getState().ladeAusBackend()
    expect(useFavoritenStore.getState().favoriten).toEqual([])
    expect(useFavoritenStore.getState().ladeStatus).toBe('fertig')
  })

  it('toggleFavorit Demo-Mode: kein lpProfil → kein speichereLPProfil-Call', async () => {
    const speichereSpy = vi.spyOn(useStammdatenStore.getState(), 'speichereLPProfil')
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    expect(speichereSpy).not.toHaveBeenCalled()
  })

  it('toggleFavorit mit lpProfil ruft speichereLPProfil mit komplettem Profil + neuer Liste', async () => {
    const lpProfil = {
      email: 'lp@test.ch',
      kursIds: ['k1'],
      fachschaftIds: ['f1'],
      gefaesse: ['SF'],
      favoriten: [],
    }
    useStammdatenStore.setState({ lpProfil })
    const speichereSpy = vi.spyOn(useStammdatenStore.getState(), 'speichereLPProfil').mockResolvedValue(true)

    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })

    expect(speichereSpy).toHaveBeenCalledOnce()
    const arg = speichereSpy.mock.calls[0][0]
    expect(arg.kursIds).toEqual(['k1'])  // andere Felder erhalten
    expect(arg.favoriten).toHaveLength(1)
    expect(arg.favoriten?.[0].ziel).toBe('/a')
  })

  it('toggleFavorit bei Save-Fehler triggert Toast + Refetch', async () => {
    const lpProfil = { email: 'lp@test.ch', kursIds: [], fachschaftIds: [], gefaesse: [], favoriten: [] }
    useStammdatenStore.setState({ lpProfil })
    vi.spyOn(useStammdatenStore.getState(), 'speichereLPProfil').mockResolvedValue(false)
    const ladeLPSpy = vi.spyOn(useStammdatenStore.getState(), 'ladeLPProfil').mockResolvedValue()
    const toastSpy = vi.spyOn(useToastStore.getState(), 'add')

    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })

    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error' }))
    expect(ladeLPSpy).toHaveBeenCalledWith('lp@test.ch')
  })
})
```

- [ ] **Step 2: Tests laufen lassen → müssen fail**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/store/favoritenStore.test.ts
```

Expected: 5 neue Tests fail.

- [ ] **Step 3: `favoritenStore.ts` Refactor — `persist` raus**

`ExamLab/src/store/favoritenStore.ts` komplett ersetzen durch:

```ts
import { create } from 'zustand'
import type { Favorit } from '../types/favorit'
import { useStammdatenStore } from './stammdatenStore'
import { useToastStore } from './toastStore'

// Re-Export für Backwards-Compat (9+ Konsumenten importieren von hier)
export type { Favorit } from '../types/favorit'

/** Selector: Favoriten sortiert nach sortierung-Feld */
export function selectFavoritenSortiert(state: { favoriten: Favorit[] }): Favorit[] {
  return [...state.favoriten].sort((a, b) => a.sortierung - b.sortierung)
}

interface FavoritenStore {
  favoriten: Favorit[]
  ladeStatus: 'idle' | 'laeuft' | 'fertig' | 'fehler'

  // Actions
  ladeAusBackend: () => Promise<void>
  toggleFavorit: (fav: Omit<Favorit, 'sortierung'> & { sortierung?: number }) => Promise<void>
  istFavorit: (ziel: string) => boolean
  updateSortierung: (zielReihenfolge: string[]) => Promise<void>
  entferneFavorit: (ziel: string) => Promise<void>
  reset: () => void
}

/** Cluster E.3: Backend-Sync via stammdatenStore (kein eigener Persist mehr). */
export const useFavoritenStore = create<FavoritenStore>()((set, get) => ({
  favoriten: [],
  ladeStatus: 'idle',

  ladeAusBackend: async () => {
    set({ ladeStatus: 'laeuft' })
    const profil = useStammdatenStore.getState().lpProfil
    set({ favoriten: profil?.favoriten ?? [], ladeStatus: 'fertig' })
  },

  toggleFavorit: async (fav) => {
    const { favoriten } = get()
    const exists = favoriten.find(f => f.ziel === fav.ziel)
    const maxSort = favoriten.reduce((max, f) => Math.max(max, f.sortierung), -1)
    const next: Favorit[] = exists
      ? favoriten.filter(f => f.ziel !== fav.ziel)
      : [...favoriten, { ...fav, sortierung: fav.sortierung ?? maxSort + 1 }]

    // Optimistic: Frontend sofort
    set({ favoriten: next })

    // Persist (skip in Demo-Mode wenn kein lpProfil)
    const { lpProfil, speichereLPProfil, ladeLPProfil } = useStammdatenStore.getState()
    if (!lpProfil) return

    const ok = await speichereLPProfil({ ...lpProfil, favoriten: next })
    if (!ok) {
      useToastStore.getState().add({
        kind: 'error',
        text: 'Favorit konnte nicht synchronisiert werden — wird neu geladen',
      })
      await ladeLPProfil(lpProfil.email)
      await get().ladeAusBackend()
    }
  },

  istFavorit: (ziel) => get().favoriten.some(f => f.ziel === ziel),

  updateSortierung: async (zielReihenfolge) => {
    const { favoriten } = get()
    const next = favoriten.map(f => ({
      ...f,
      sortierung: zielReihenfolge.indexOf(f.ziel),
    }))
    set({ favoriten: next })

    const { lpProfil, speichereLPProfil, ladeLPProfil } = useStammdatenStore.getState()
    if (!lpProfil) return

    const ok = await speichereLPProfil({ ...lpProfil, favoriten: next })
    if (!ok) {
      useToastStore.getState().add({
        kind: 'error',
        text: 'Reihenfolge konnte nicht synchronisiert werden — wird neu geladen',
      })
      await ladeLPProfil(lpProfil.email)
      await get().ladeAusBackend()
    }
  },

  entferneFavorit: async (ziel) => {
    const next = get().favoriten.filter(f => f.ziel !== ziel)
    set({ favoriten: next })

    const { lpProfil, speichereLPProfil, ladeLPProfil } = useStammdatenStore.getState()
    if (!lpProfil) return

    const ok = await speichereLPProfil({ ...lpProfil, favoriten: next })
    if (!ok) {
      useToastStore.getState().add({
        kind: 'error',
        text: 'Favorit konnte nicht entfernt werden — wird neu geladen',
      })
      await ladeLPProfil(lpProfil.email)
      await get().ladeAusBackend()
    }
  },

  reset: () => set({ favoriten: [], ladeStatus: 'idle' }),
}))
```

- [ ] **Step 4: Tests laufen lassen → müssen alle grün sein**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/store/favoritenStore.test.ts
```

Expected: alle grün (Basistests + 5 neue Backend-Tests).

- [ ] **Step 5: Full ci-check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run ci-check 2>&1 | tail -10
```

Expected: alle 8 lint-Gates clean, vitest grün.

- [ ] **Step 6: Commit + Push preview, dann main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Cluster E.3 Phase 2: favoritenStore Refactor (persist raus, Backend-Sync)

- persist-Middleware komplett entfernt (alle v1->v2 + lp-favoriten->
  examlab-favoriten Migrationen gestrichen)
- ladeAusBackend(): synchroner Hydrate aus stammdatenStore.lpProfil
- toggleFavorit/updateSortierung/entferneFavorit: optimistic + komplettes
  LPProfil-Save via stammdatenStore.speichereLPProfil
- Bei Save-Fehler: Toast + Refetch via ladeLPProfil + ladeAusBackend
  (kein client-side Rollback, Server-State ist Wahrheit)
- Demo-Mode-Pfad (kein lpProfil): Optimistic-Set bleibt, kein Save-Call
- favoritenStore.test.ts: persist-Tests droppt, 5 neue Backend-Tests

KEIN Subscriber (Entscheidung #3): zwei explizite Trigger
(App-Mount + Error-Refetch). Phase 3 wired App-Mount.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin HEAD:preview
git push origin main
```

---

## Phase 3: App-Mount Backend-Load + Skeleton

**Ziel:** Nach LP-Login werden Favoriten aus Backend gehydraet. Skeleton zeigt Loading.

**Files:**
- Modify: `ExamLab/src/hooks/useLPDashboardData.ts` (Phase 1 hatte schon den Trigger; verifizieren)
- Modify: `ExamLab/src/components/lp/Favoriten.tsx` (Skeleton-Karten in Favoriten-Sektion)
- Modify: `ExamLab/src/tests/LPStartseite.test.tsx` (Test für `ladeAusBackend`-Aufruf)

- [ ] **Step 1: Verifiziere useLPDashboardData-Trigger (sollte aus Phase 1 da sein)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -A2 "ladeLPProfil(user.email).then" ExamLab/src/hooks/useLPDashboardData.ts
```

Expected output enthält:
```ts
ladeLPProfil(user.email).then(() => {
  useFavoritenStore.getState().ladeAusBackend()
})
```

Falls nicht → ergänzen (analog Phase 1 Step 7).

- [ ] **Step 2: Test in LPStartseite.test.tsx erweitern (oder neuer useLPDashboardData-Test)**

In `ExamLab/src/tests/LPStartseite.test.tsx` oder neu `src/hooks/useLPDashboardData.test.tsx`:

```tsx
// Zusätzlicher Test
it('ruft favoritenStore.ladeAusBackend nach ladeLPProfil-Erfolg', async () => {
  // Setup wie bestehende LP-Login-Tests
  const ladeBackendSpy = vi.spyOn(useFavoritenStore.getState(), 'ladeAusBackend')
  // ... render LPStartseite mit echtem LP-User ...
  await waitFor(() => {
    expect(ladeBackendSpy).toHaveBeenCalled()
  })
})
```

(Detaillierte Test-Struktur richtet sich nach existierendem LPStartseite-Test-Setup. Wenn `ladeLPProfil` dort schon mit `vi.fn(() => Promise.resolve())` gemockt ist (siehe `LPStartseite.test.tsx:72`), reicht ein Assertion auf `useFavoritenStore`-Spy.)

- [ ] **Step 3: Skeleton in `Favoriten.tsx` (innerhalb Favoriten-Sektion)**

In `ExamLab/src/components/lp/Favoriten.tsx`:
- Import ergänzen: `import { useFavoritenStore } from '../../store/favoritenStore'` (existiert schon)
- Nach Z. 28 (`rawFavoriten = useFavoritenStore(s => s.favoriten)`) ergänzen:
  ```ts
  const favoritenLadeStatus = useFavoritenStore(s => s.ladeStatus)
  ```
- Z. 120 (`<Sektion titel="Favoriten" leer={favoriten.length === 0} ...`) anpassen:

```tsx
{/* Favoriten — Klick navigiert direkt ins Ziel */}
<Sektion titel="Favoriten" leer={favoritenLadeStatus === 'fertig' && favoriten.length === 0} leerText="Noch keine Favoriten gesetzt. In den Einstellungen oder per Stern-Icon hinzufügen.">
  {favoritenLadeStatus === 'laeuft' ? (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="flex-shrink-0 h-[58px] w-[140px] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse" />
      ))}
    </div>
  ) : (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {favoriten.map(fav => (
        ...bestehender Code...
      ))}
    </div>
  )}
</Sektion>
```

- [ ] **Step 4: ci-check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run ci-check 2>&1 | tail -10
```

Expected: alles grün.

- [ ] **Step 5: Commit + Push preview**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Cluster E.3 Phase 3: App-Mount ladeAusBackend + Favoriten-Skeleton

- Favoriten.tsx: 3 Skeleton-Karten waehrend favoritenStore.ladeStatus=
  'laeuft' (Tailwind animate-pulse, h-[58px] w-[140px])
- Leer-Text erscheint erst nach ladeStatus='fertig' (nicht waehrend
  Loading verwirrend "Noch keine Favoriten" zeigen)
- LPStartseite-Test (oder useLPDashboardData-Test) verifiziert dass
  ladeAusBackend nach LP-Login getriggert wird

Bereit fuer Browser-E2E: LP-Login -> Skeleton sichtbar ~1.5s ->
Favoriten erscheinen aus Backend.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin HEAD:preview
```

- [ ] **Step 6: Browser-E2E auf Staging**

User-Aufgabe (manuell, mit echtem LP-Login auf `wr.test`):
1. Open preview-Deployment-URL mit `?cb=<timestamp>` (Cache-Buster gegen HTTP-Cache)
2. Login als LP
3. Verifizieren: Favoriten-Sektion zeigt erst Skeleton (3 graue Karten, pulsierend) → nach ~1.5s erscheinen die Favoriten aus Backend
4. Console + Network checken: keine 500er, kein React-Error-#185

Falls Browser-E2E fail → diagnostizieren + fix-commit, dann erneut testen.

- [ ] **Step 7: Push main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push origin main
```

---

## Phase 4: TabStarToggle Komponente

**Ziel:** Wiederverwendbare Star-Toggle-Komponente für Tab-Headers (vorbereitend für Phase 5).

**Files:**
- Create: `ExamLab/src/components/lp/TabStarToggle.tsx`
- Create: `ExamLab/src/components/lp/TabStarToggle.test.tsx`

- [ ] **Step 1: Test schreiben (failing)**

```tsx
// ExamLab/src/components/lp/TabStarToggle.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabStarToggle } from './TabStarToggle'
import { useFavoritenStore } from '../../store/favoritenStore'

describe('TabStarToggle', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
  })

  it('rendert Outlined-Star wenn nicht Favorit', () => {
    render(<TabStarToggle tabId="profil" surface="einstellungen" label="Profil" />)
    const button = screen.getByRole('button', { name: /Zu Favoriten hinzufügen/i })
    expect(button.querySelector('svg.lucide-star')).toBeTruthy()
    expect(button.querySelector('svg')?.classList.contains('fill-current')).toBe(false)
  })

  it('rendert Filled-Star wenn Favorit', () => {
    useFavoritenStore.setState({
      favoriten: [{ typ: 'einstellungen-tab', ziel: 'profil', label: 'Profil', sortierung: 0 }],
    })
    render(<TabStarToggle tabId="profil" surface="einstellungen" label="Profil" />)
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg?.classList.contains('fill-current')).toBe(true)
  })

  it('toggelt Favorit beim Klick (einstellungen-Surface)', () => {
    const toggleSpy = vi.spyOn(useFavoritenStore.getState(), 'toggleFavorit')
    render(<TabStarToggle tabId="profil" surface="einstellungen" label="Profil" icon="User" />)
    fireEvent.click(screen.getByRole('button'))
    expect(toggleSpy).toHaveBeenCalledWith({
      typ: 'einstellungen-tab', ziel: 'profil', label: 'Profil', icon: 'User',
    })
  })

  it('toggelt Favorit beim Klick (hilfe-Surface)', () => {
    const toggleSpy = vi.spyOn(useFavoritenStore.getState(), 'toggleFavorit')
    render(<TabStarToggle tabId="einstieg" surface="hilfe" label="Erste Schritte" />)
    fireEvent.click(screen.getByRole('button'))
    expect(toggleSpy).toHaveBeenCalledWith({
      typ: 'hilfe-tab', ziel: 'einstieg', label: 'Erste Schritte', icon: undefined,
    })
  })

  it('aria-label wechselt je nach Favorit-Zustand', () => {
    const { rerender } = render(<TabStarToggle tabId="x" surface="einstellungen" label="X" />)
    expect(screen.getByRole('button', { name: /Zu Favoriten hinzufügen/i })).toBeTruthy()

    useFavoritenStore.setState({
      favoriten: [{ typ: 'einstellungen-tab', ziel: 'x', label: 'X', sortierung: 0 }],
    })
    rerender(<TabStarToggle tabId="x" surface="einstellungen" label="X" />)
    expect(screen.getByRole('button', { name: /Aus Favoriten entfernen/i })).toBeTruthy()
  })
})
```

- [ ] **Step 2: Tests laufen lassen → müssen fail (Komponente existiert nicht)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/components/lp/TabStarToggle.test.tsx
```

Expected: alle 5 fail mit "Cannot find module".

- [ ] **Step 3: TabStarToggle implementieren**

```tsx
// ExamLab/src/components/lp/TabStarToggle.tsx
import { Star } from 'lucide-react'
import { useFavoritenStore } from '../../store/favoritenStore'
import type { Favorit } from '../../types/favorit'

interface Props {
  tabId: string
  surface: 'einstellungen' | 'hilfe'
  label: string
  icon?: string
}

/**
 * Star-Toggle für Tab-Headers (Cluster E.4).
 * Klick togglet den Tab als Favorit mit typ='einstellungen-tab' oder 'hilfe-tab'.
 */
export function TabStarToggle({ tabId, surface, label, icon }: Props) {
  const istFav = useFavoritenStore(s => s.istFavorit(tabId))
  const toggle = useFavoritenStore(s => s.toggleFavorit)
  const typ: Favorit['typ'] = surface === 'einstellungen' ? 'einstellungen-tab' : 'hilfe-tab'

  return (
    <button
      onClick={() => toggle({ typ, ziel: tabId, label, icon })}
      aria-label={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      className="text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
    >
      <Star
        className={`w-5 h-5 ${istFav ? 'fill-current text-amber-500' : ''}`}
        aria-hidden="true"
      />
    </button>
  )
}
```

- [ ] **Step 4: Tests laufen lassen → alle grün**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/components/lp/TabStarToggle.test.tsx
```

Expected: 5/5 pass.

- [ ] **Step 5: ci-check + Commit + Push (preview, dann main)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run ci-check 2>&1 | tail -10
```

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Cluster E.4 Phase 4: TabStarToggle-Komponente

Wiederverwendbarer Star-Button fuer Tab-Headers. Liest istFavorit aus
favoritenStore, klickt toggleFavorit mit typ='einstellungen-tab' oder
'hilfe-tab'. Inaktiv = outlined slate-400, hover/aktiv = filled amber-500
(Projekt-Farb-Token analog Tags).

5 TDD-Tests: rendering on/off, click-handler beide Surfaces,
aria-label-Wechsel.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin HEAD:preview
git push origin main
```

---

## Phase 5: TabStarToggle Einbindung in 20 Tab-Headers

**Ziel:** Jeder der 10 Einstellungen- und 10 Hilfe-Tabs hat den Star-Toggle neben dem Tab-Titel.

NOTE: Spec sagte 7+10=17, aber Tab-Registry (`src/utils/tabRegistry.ts`) listet 10 Einstellungen-Tabs (profil, lernziele, favoriten, problemmeldungen, uebungen, fragensammlung, testdaten, tags, admin, ki-kalibrierung) + 10 Hilfe-Tabs. Total **20**.

**Files:**
- Modify: `ExamLab/src/components/lp/hilfe/layoutHelpers.tsx` (TitelMitStern-Wrapper)
- Modify: 10× Hilfe-Tab-Komponenten (ändere `<Titel>` zu `<TitelMitStern>`)
- Modify: 10× Einstellungen-Tab-Komponenten (Star-Toggle neben Header einfügen)

- [ ] **Step 1: `TitelMitStern`-Wrapper in `layoutHelpers.tsx`**

Ergänze in `ExamLab/src/components/lp/hilfe/layoutHelpers.tsx`:

```tsx
import { TabStarToggle } from '../TabStarToggle'

/**
 * Titel mit Star-Toggle rechts (für Hilfe-Tabs, Cluster E.4).
 * Replaced <Titel> in Tab-Komponenten die Favoriten-Toggle haben sollen.
 */
export function TitelMitStern({ tabId, children }: { tabId: string; children: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100`}>{children}</h2>
      <TabStarToggle tabId={tabId} surface="hilfe" label={children} />
    </div>
  )
}
```

- [ ] **Step 2: 10 Hilfe-Tab-Komponenten umstellen**

Liste der Files (alle in `ExamLab/src/components/lp/hilfe/`):

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -l "<Titel>" ExamLab/src/components/lp/hilfe/*.tsx
```

Erwartete Files (10): `EinstiegTab.tsx`, `FragenTab.tsx`, `PruefungTab.tsx`, `DurchfuehrungTab.tsx`, `KorrekturTab.tsx`, `UebenTab.tsx`, `KITab.tsx`, `BloomTab.tsx`, `ZusammenarbeitTab.tsx`, `FaqTab.tsx`.

Für jedes File:
- Import `TitelMitStern` ergänzen statt `Titel` (aus selbem layoutHelpers).
- `<Titel>Titel-Text</Titel>` → `<TitelMitStern tabId="X">Titel-Text</TitelMitStern>` mit X aus `tabRegistry.ts` (z.B. `einstieg`, `fragen`, `pruefung`, ...).

Mapping aus Tab-Registry:
| File | tabId |
|---|---|
| EinstiegTab.tsx | `einstieg` |
| FragenTab.tsx | `fragen` |
| PruefungTab.tsx | `pruefung` |
| DurchfuehrungTab.tsx | `durchfuehrung` |
| KorrekturTab.tsx | `korrektur` |
| UebenTab.tsx | `ueben` |
| KITab.tsx | `ki` |
| BloomTab.tsx | `bloom` |
| ZusammenarbeitTab.tsx | `zusammenarbeit` |
| FaqTab.tsx | `faq` |

- [ ] **Step 3: 10 Einstellungen-Tab-Komponenten ergänzen**

Files in `ExamLab/src/components/settings/` mit Tab-Header. Audit:

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -l "TYPO.h1\|TYPO.display" ExamLab/src/components/settings/*Tab.tsx
```

Pro Tab-File:
1. Import: `import { TabStarToggle } from '../lp/TabStarToggle'`
2. Im Tab-Header `<h1 className={TYPO.h1}>...` Pattern umwickeln:

```tsx
<div className="flex items-center justify-between mb-3">
  <h1 className={TYPO.h1}>Mein Profil</h1>
  <TabStarToggle tabId="profil" surface="einstellungen" label="Mein Profil" icon="User" />
</div>
```

Mapping aus Tab-Registry:
| File (Beispiele, individuell prüfen) | tabId | label |
|---|---|---|
| `ProfilTab.tsx` (oder ähnlich) | `profil` | `Mein Profil` |
| `LernzieleTab.tsx` | `lernziele` | `Lernziele` |
| `FavoritenTab.tsx` | `favoriten` | `Favoriten` |
| `ProblemmeldungenTab.tsx` | `problemmeldungen` | `Problemmeldungen` |
| `UebungenTab.tsx` | `uebungen` | `Übungen` |
| `FragensammlungTab.tsx` | `fragensammlung` | `Fragensammlung` |
| `TestdatenTab.tsx` | `testdaten` | `Testdaten` |
| `TagsTab.tsx` | `tags` | `Tags` (icon=`Tag`) |
| `AdminTab.tsx` | `admin` | `Admin` |
| `KIKalibrierungTab.tsx` | `ki-kalibrierung` | `KI-Kalibrierung` |

**Falls eine Tab-Datei keinen sichtbaren H1-Titel hat** (z.B. weil sie sich nahtlos in den Tab-Wrapper einbettet) → in solchen Fällen einen neuen Header-Block einfügen oder den Tab-Wrapper auf TitelMitStern-Pattern umstellen. Implementer-Judgement.

- [ ] **Step 4: vitest + ci-check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run ci-check 2>&1 | tail -15
```

Expected: alle Lint-Gates clean, vitest grün. Falls existierende Snapshot-Tests fail → snapshot regenerieren mit `vitest run -u`, dann manuell prüfen dass die Diff nur den Star-Button hinzufügt.

- [ ] **Step 5: Commit + Push preview**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Cluster E.4 Phase 5: TabStarToggle Einbindung in 20 Tab-Headers

- layoutHelpers.tsx: TitelMitStern-Wrapper fuer Hilfe-Tabs
- 10 Hilfe-Tab-Files: <Titel> -> <TitelMitStern tabId=...>
- 10 Einstellungen-Tab-Files: TabStarToggle neben TYPO.h1-Header

20 Tab-IDs aus tabRegistry.ts:
- Einstellungen: profil, lernziele, favoriten, problemmeldungen,
  uebungen, fragensammlung, testdaten, tags, admin, ki-kalibrierung
- Hilfe: einstieg, fragen, pruefung, durchfuehrung, korrektur,
  ueben, ki, bloom, zusammenarbeit, faq

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin HEAD:preview
```

- [ ] **Step 6: Browser-E2E auf Staging**

User-Aufgabe (manuell, echter LP-Login):
1. LP-Login auf preview-URL mit `?cb=<ts>`
2. Einstellungen öffnen → 10 Tabs durchklicken → Star ist sichtbar im Header jedes Tabs
3. 2 beliebige Tabs favorisieren (z.B. „Tags", „Testdaten")
4. Reload mit `?cb=<ts>`
5. Favoriten-Sektion auf Startseite zeigt die 2 Tabs als Favoriten
6. Hilfe öffnen → 10 Tabs durchklicken → Star sichtbar; 1 Hilfe-Tab favorisieren → Reload → bleibt
7. Console + Network checken: keine Errors, jeder Toggle-Klick erzeugt 1 `speichereLPProfil`-POST (~1.5s)

- [ ] **Step 7: Push main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push origin main
```

---

## Phase 6: FavoritenPicker Modal

**Ziel:** Modal das alle Tabs aus Tab-Registry zeigt + Hinzufügen-Klick triggert Favorit-Toggle.

**Files:**
- Create: `ExamLab/src/components/lp/FavoritenPicker.tsx`
- Create: `ExamLab/src/components/lp/FavoritenPicker.test.tsx`
- Modify: `ExamLab/src/components/settings/FavoritenTab.tsx` (Button + State)

- [ ] **Step 1: FavoritenPicker-Tests schreiben (failing)**

```tsx
// ExamLab/src/components/lp/FavoritenPicker.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FavoritenPicker } from './FavoritenPicker'
import { useFavoritenStore } from '../../store/favoritenStore'
import { useStammdatenStore } from '../../store/stammdatenStore'

describe('FavoritenPicker', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
    useStammdatenStore.setState({
      stammdaten: { ...useStammdatenStore.getState().stammdaten, admins: ['lp@test.ch'] },
    })
  })

  it('rendert nichts wenn isOpen=false', () => {
    const { container } = render(<FavoritenPicker isOpen={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('rendert Einstellungen- und Hilfe-Tabs aus Registry', () => {
    render(<FavoritenPicker isOpen onClose={() => {}} />)
    // Stichprobe — Tabs aus Registry sollten erscheinen
    expect(screen.getByText('Mein Profil')).toBeTruthy()
    expect(screen.getByText('Erste Schritte')).toBeTruthy()
  })

  it('zeigt "Bereits Favorit" Status für existierende Favoriten', () => {
    useFavoritenStore.setState({
      favoriten: [{ typ: 'einstellungen-tab', ziel: 'profil', label: 'Mein Profil', sortierung: 0 }],
    })
    render(<FavoritenPicker isOpen onClose={() => {}} />)
    expect(screen.getByText(/Bereits Favorit/i)).toBeTruthy()
  })

  it('Klick auf Hinzufügen-Button triggert toggleFavorit', () => {
    const toggleSpy = vi.spyOn(useFavoritenStore.getState(), 'toggleFavorit')
    render(<FavoritenPicker isOpen onClose={() => {}} />)
    // Erster Tab in Liste (alphabetisch sortiert) — wir suchen einen Hinzufuegen-Button
    const firstAdd = screen.getAllByRole('button', { name: /Hinzufügen/i })[0]
    fireEvent.click(firstAdd)
    expect(toggleSpy).toHaveBeenCalled()
  })

  it('Filter-Eingabe reduziert die Liste', () => {
    render(<FavoritenPicker isOpen onClose={() => {}} />)
    const input = screen.getByRole('textbox', { name: /Suche/i })
    fireEvent.change(input, { target: { value: 'profil' } })
    // Andere Tabs verschwinden, "Mein Profil" bleibt
    expect(screen.getByText('Mein Profil')).toBeTruthy()
    expect(screen.queryByText('Erste Schritte')).toBeNull()
  })
})
```

- [ ] **Step 2: Tests laufen lassen → fail (Komponente fehlt)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/components/lp/FavoritenPicker.test.tsx
```

Expected: alle 5 fail mit "Cannot find module".

- [ ] **Step 3: FavoritenPicker implementieren**

```tsx
// ExamLab/src/components/lp/FavoritenPicker.tsx
import { useState, useMemo } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { BaseDialog } from '../ui/BaseDialog'
import { TAB_REGISTRY, type TabDefinition } from '../../utils/tabRegistry'
import { useFavoritenStore } from '../../store/favoritenStore'
import { useStammdatenStore } from '../../store/stammdatenStore'
import { NavIcon } from '../ui/icons/NavIcon'
import type { Favorit } from '../../types/favorit'

interface Props {
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal-Picker für Favoriten-Hinzufügen aus Tab-Registry (Cluster E.5).
 * Listet alle Einstellungen- + Hilfe-Tabs alphabetisch, mit Filter-Input.
 * Bereits-Favorit-Tabs sind disabled. Click triggert toggleFavorit.
 * Modal bleibt offen (Multi-Add), schliesst via "Fertig"-Button oder ESC.
 */
export function FavoritenPicker({ isOpen, onClose }: Props) {
  const [filter, setFilter] = useState('')
  const istFavorit = useFavoritenStore(s => s.istFavorit)
  const toggleFavorit = useFavoritenStore(s => s.toggleFavorit)
  const lpProfil = useStammdatenStore(s => s.lpProfil)
  const stammdaten = useStammdatenStore(s => s.stammdaten)
  const istAdmin = lpProfil ? stammdaten.admins.includes(lpProfil.email) : false

  const tabs = useMemo(() => {
    const ctx = { istAdmin }
    const sichtbar = TAB_REGISTRY.filter(t => t.sichtbar?.(ctx) ?? true)
    const filtered = filter
      ? sichtbar.filter(t => t.titel.toLowerCase().includes(filter.toLowerCase()))
      : sichtbar
    return [...filtered].sort((a, b) => a.titel.localeCompare(b.titel, 'de'))
  }, [filter, istAdmin])

  if (!isOpen) return null

  function handleAdd(tab: TabDefinition) {
    const typ: Favorit['typ'] = tab.surface === 'einstellungen' ? 'einstellungen-tab' : 'hilfe-tab'
    toggleFavorit({ typ, ziel: tab.id, label: tab.titel, icon: tab.icon })
  }

  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} title="Favorit hinzufügen">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Tab suchen..."
            aria-label="Suche Tabs"
            className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
          />
        </div>

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {tabs.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">Keine Tabs gefunden.</p>
          ) : (
            tabs.map(tab => {
              const istFav = istFavorit(tab.id)
              return (
                <div
                  key={`${tab.surface}-${tab.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {tab.icon && (
                    <span className="inline-flex items-center text-slate-500 dark:text-slate-400">
                      <NavIcon icon={tab.icon} className="w-4 h-4" />
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{tab.titel}</p>
                    <p className="text-xs text-slate-400">{tab.surface === 'einstellungen' ? 'Einstellungen' : 'Hilfe'}</p>
                  </div>
                  {istFav ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 px-2 py-1">
                      <Check className="w-4 h-4" aria-hidden="true" />
                      Bereits Favorit
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(tab)}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-md transition-colors cursor-pointer"
                      aria-label={`${tab.titel} hinzufügen`}
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      Hinzufügen
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </BaseDialog>
  )
}
```

NOTE: `BaseDialog`-Prop-Signature kann abweichen — prüfen mit:
```bash
head -30 ExamLab/src/components/ui/BaseDialog.tsx
```

Falls Props anders heissen (`open` vs `isOpen`, `onSchliessen` vs `onClose`, `titel` vs `title`) → entsprechend anpassen.

- [ ] **Step 4: Tests laufen lassen → alle grün**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/components/lp/FavoritenPicker.test.tsx
```

Expected: 5/5 pass.

- [ ] **Step 5: FavoritenTab.tsx — Picker-Wiring**

In `ExamLab/src/components/settings/FavoritenTab.tsx`:
1. Import ergänzen: `import { FavoritenPicker } from '../lp/FavoritenPicker'`
2. Im Komponenten-Body State + Button ergänzen, vor der NavigationsBaum-Section (Z. 78):

```tsx
const [pickerOpen, setPickerOpen] = useState(false)
```

3. Vor `<div>` Z. 78 (App-Struktur als Baum), ergänze:

```tsx
{/* Picker für Einstellungen-/Hilfe-Tabs (Cluster E.5) */}
<div className="border-t border-slate-200 dark:border-slate-700 pt-4">
  <button
    onClick={() => setPickerOpen(true)}
    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-md transition-colors cursor-pointer"
  >
    <Plus className="w-4 h-4" aria-hidden="true" />
    Tab-Favorit hinzufügen
  </button>
</div>

<FavoritenPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
```

4. Import `Plus` ergänzen aus `lucide-react`.

- [ ] **Step 6: ci-check**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
npm run ci-check 2>&1 | tail -10
```

- [ ] **Step 7: Commit + Push preview**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Cluster E.5 Phase 6: FavoritenPicker Modal + FavoritenTab-Wiring

- FavoritenPicker.tsx neu (~160 Z.): BaseDialog mit Tab-Liste aus
  tabRegistry, Such-Filter, alphabetisch sortiert, Bereits-Favorit-State
  mit Lucide Check (kein Emoji), Hinzufuegen-Button mit toggleFavorit.
  Modal bleibt offen fuer Multi-Add.
- FavoritenTab.tsx: "+ Tab-Favorit hinzufuegen"-Button oeffnet Picker.
  NavigationsBaum (App-Orte) bleibt unangetastet.
- 5 TDD-Tests fuer Picker.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin HEAD:preview
```

- [ ] **Step 8: Browser-E2E auf Staging**

User-Aufgabe:
1. LP-Login + Cache-Buster
2. Einstellungen → Favoriten-Tab
3. „+ Tab-Favorit hinzufügen"-Button klicken → Picker öffnet
4. Suche „prof" eingeben → nur „Mein Profil" sichtbar
5. „Hinzufügen" klicken → Button wechselt zu „Bereits Favorit" mit Lucide-Check
6. Suche löschen → 2. Tab hinzufügen
7. „Fertig"-Button → Modal schliesst
8. Auf Favoriten-Sektion in LPStartseite checken: beide Tabs sichtbar als Favoriten

- [ ] **Step 9: Push main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push origin main
```

---

## Phase 7: Browser-E2E Cross-Device + Final-Verifikation

**Ziel:** Erfolgs-Kriterien aus Spec §10 verifizieren.

**Kein Commit-Bedarf** — nur manuelle Verifikation.

- [ ] **Step 1: Cross-Device-Test mit 2 Browser-Tabs**

User-Aufgabe (mit echtem LP-Login `wr.test`):

Tab 1:
1. LP-Login + Cache-Buster
2. Favorisiere einen Einstellungen-Tab (z.B. „Tags") via TabStarToggle

Tab 2:
3. LP-Login (gleiche Email) + Cache-Buster
4. Erwartung: „Tags" erscheint sofort als Favorit auf Startseite (Backend-Load nach Login)

Falls Tab 2 schon vorher offen war:
5. Reload mit Cache-Buster
6. „Tags" sollte erscheinen

- [ ] **Step 2: Erfolgs-Kriterien-Sweep aus Spec §10**

User-Checkliste:
- [ ] `favoritenStore` hat keine `persist`-Middleware mehr (Code-Inspektion)
- [ ] LP-Favoriten überleben Browser-Cache-Reset (DevTools → Application → Clear Storage → Reload → Favoriten kommen aus Backend)
- [ ] Cross-Device-Sync (Step 1) ✅
- [ ] 20 Tab-Headers haben `<TabStarToggle>` — visuell jeden Tab kurz anklicken
- [ ] Favoriten-Picker öffnet, listet alle Tabs, fügt hinzu/entfernt ✅
- [ ] vitest grün ✅ (aus Phase-Push-Hooks)
- [ ] alle 8 lint-Gates clean ✅
- [ ] tsc -b + vite build clean ✅
- [ ] Browser-E2E 6 Test-Cases ✅

- [ ] **Step 3: Backend-Fehler-Test (Optional aber empfohlen)**

User-Aufgabe:
1. DevTools → Network → „Offline" aktivieren
2. Favorit togglen
3. Erwartung: Optimistic UI-Update sofort + Toast „Sync fehlgeschlagen — wird neu geladen"
4. Network wieder aktivieren
5. Reload → finaler Stand entspricht Backend (kann der pre-offline-State sein)

- [ ] **Step 4: HANDOFF + MEMORY-Update**

Nach E2E erfolgreich:
- HANDOFF.md neuer Top-Block für Cluster E.3-E.5 KOMPLETT
- MEMORY.md Hot-Picks aktualisieren (E.3-E.5 von „nächstes" zu „LIVE")
- Neue Memory-File `project_cluster_e_3_bis_e_5_komplett.md`
- Memory-Lehren falls neu entdeckt während Implementation

Commit + Push (analog Cluster H Phase 3 Pattern).

- [ ] **Step 5: Spawn-Task — `appNavigation.ts` Persist-Migration**

Da `favoritenStore` jetzt Backend-Sync hat, ist der pragmatische `NavIcon`-Helper (Emoji→Lucide-Mapping bei Render) noch akzeptabel, aber langfristig sauberer wäre eine Persist-Migration auf Lucide-Component-Keys (existierender Spawn-Task aus Memory). E.3-E.5 macht das NICHT, aber lohnt sich als Folge-Task.

---

## Erfolgs-Kriterien (aus Spec §10, hier nochmal als Plan-Sanity-Check)

- ✅ `favoritenStore` hat keine `persist`-Middleware mehr
- ✅ LP-Favoriten überleben Browser-Cache-Reset (Backend-Load nach Re-Login)
- ✅ Cross-Device-Sync: Favorit-Änderung in Browser A ist nach Re-Login in Browser B sichtbar
- ✅ 20 Tab-Headers haben `<TabStarToggle>` (10 EinstellungenPanel + 10 HilfeSeite)
- ✅ Favoriten-Picker öffnet, listet alle Tabs aus Registry, fügt hinzu/entfernt
- ✅ vitest grün, alle 8 lint-Gates clean, tsc -b + vite build clean
- ✅ Browser-E2E 6 Test-Cases auf Staging mit echtem LP-Login

---

## Risiken (aus Spec §8) — Plan-Mitigation-Checkliste

| Risiko | Plan-Mitigation |
|---|---|
| `AppOrt`-Konsument übersehen → tsc-Fehler | Phase 1 Step 1 macht den Audit, Phase 1 ist atomic-bundle |
| Subscriber-Race | Architektur ohne Subscriber (Spec Entscheidung #3) |
| User klickt schnell (race) | toggleFavorit sendet KOMPLETTE Liste → last-write-wins natürlich |
| Backend-Save-Fehler beim ersten Login | speichereLPProfilEndpoint legt LP-Profil-Zeile an wenn nicht vorhanden (bereits getestet) |
| Dev-User verliert lokale Favoriten | Bewusste Entscheidung #5 — Phase 7 Step 4 Memory-Lehre falls jemand das bemängelt |
| Apps-Script-Latenz bei Spam-Toggle | Keine Mitigation auf E.3-Ebene. Backend-Migration löst das. |
