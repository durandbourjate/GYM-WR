---
title: Cluster E.3–E.5 — Favoriten-Backend-Sync + Star-Toggle + Picker
date: 2026-05-17
status: Spec-Review ausstehend
verwandt: Cluster E (2026-05-11), Cluster E.2 (2026-05-17 Typografie), Cluster F (Testdaten + LPProfil-Pattern)
ausgegliedert_aus: 2026-05-11-cluster-e-konsistenz-design.md (Phase 4–6)
---

# Cluster E.3–E.5 — Favoriten-Backend-Sync + Star-Toggle + Favoriten-Picker

## 1. Zweck

LP-Favoriten werden heute via `zustand/persist` im localStorage gespeichert (`favoritenStore.ts`). Das hat zwei Schwächen: (1) Favoriten sind nicht cross-device sichtbar — wer am iPad startet und am Mac weiterarbeitet, muss alles neu setzen. (2) Bei Browser-Cache-Reset oder neuem Profil sind alle Favoriten weg.

Backend-Sync auf `LPProfil.favoriten` (existierende Apps-Script-Persistenz im `LP-Profile`-Sheet) löst beides: Favoriten reisen mit dem LP-Login mit. Bonus aus dem Refactor: konsistenter Pfad mit anderen LP-Settings (Kursliste, Fachschaft, Testdaten-Sichtbarkeit) die bereits via `stammdatenStore.lpProfil` cross-device synchronisiert sind.

Bundle umfasst drei thematisch verwandte Sub-Cluster:
- **E.3** Favoriten-Backend-Sync (Infrastruktur)
- **E.4** Star-Toggle in Tab-Headers (UI-Surface 1)
- **E.5** Favoriten-Picker als Modal mit Tab-Registry (UI-Surface 2)

E.4 und E.5 sind kleine UI-Adds (~40 + ~150 Zeilen) die direkt auf E.3 aufbauen. Combined Spec/Plan/Implementation spart 1 Apps-Script-Deploy + 1 E2E-Runde + 2× Brainstorming.

## 2. Begriffe

- **`LPProfil`:** Account-spezifisches Settings-Objekt pro LP (Email-keyed). Schon vorhanden in `stammdatenStore.lpProfil`. Felder: `email`, `kursIds`, `fachschaftIds`, `gefaesse`, optional `favoriten`, `testdatenSichtbar`.
- **`Favorit`:** Frontend-Type aus `favoritenStore.ts` (Cluster E Foundation): `{typ, ziel, label, icon?, sortierung}`. Diskriminator `typ` unterscheidet App-Orte (`'ort'`) von Inhalten (`'pruefung'`, `'uebung'`, `'frage'`, `'einstellungen-tab'`, `'hilfe-tab'`).
- **`AppOrt`:** Alter Type aus `stammdaten.ts` (`{id, titel, screen, params, erstelltAm}`). Wird durch `Favorit` ersetzt — kein Konsument mehr nach dieser Spec.
- **`stammdatenStore`:** Existierender Zustand-Store mit `lpProfil` + `ladeLPProfil` + `speichereLPProfil`. Backend-Schreib-Endpoint `speichereLPProfil` schreibt das KOMPLETTE LP-Profil als JSON-Blob in eine Sheet-Zeile — partial updates müssen client-side den Profil-State mergen.
- **`favoritenStore`:** Existierender Zustand-Store mit Favoriten-State + Actions. Nach E.3 thin facade über `stammdatenStore.lpProfil.favoriten` ohne eigenen Persist-Layer.
- **Tab-Registry:** Existierende Cluster-E.1-Foundation in `src/utils/tabRegistry.ts`. Liefert `tabsFuerSurface('einstellungen' | 'hilfe', ctx)` mit `{id, surface, titel, icon, ...}`. Quelle für E.4 + E.5.
- **Optimistic Update:** UI/Store-State wird sofort aktualisiert. Backend-Save fire-and-forget. Bei Fehler: Server-Refetch reset den Store zur Server-Wahrheit (kein client-side Rollback-Buffer).

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **`LPProfil.favoriten` von `AppOrt[]` zu `Favorit[]` umtypisieren.** | `AppOrt` ist Pre-Cluster-E-Datenstruktur, nirgends mehr aktiv konsumiert. `Favorit` ist der etablierte Type mit Discriminator. Nicht-in-Produktion erlaubt breaking-Backend-Wire-Vertrag-Änderung ohne Migration. |
| 2 | **`favoritenStore` bleibt API-Facade, hat selbst keinen Persist-Layer mehr.** | 9+ bestehende Component-Konsumenten (`useFavoritenStore()`) müssen nicht angepasst werden. Klare Aktions-API (toggleFavorit/istFavorit/updateSortierung) bleibt erhalten. Implementation delegiert an `stammdatenStore`. |
| 3 | **Backend = Source of Truth. Frontend-Store ist Read-Through-Cache.** | Konsistent mit `stammdatenStore`-Pattern. Bei Konflikten (z.B. zwei Tabs, verschiedene Geräte) ist Backend-State final. Kein Multi-Master-Sync nötig. |
| 4 | **Optimistic Update + Server-Refetch on Error (kein Client-Rollback).** | Pre-Edit-State-Buchhaltung entfällt → ~30 Z. weniger Code. Refetch ist nach Backend-Migration <100ms = günstig. Während Apps-Script-Phase: Refetch ~1.5s nach Fehler ist akzeptabel weil Fehler selten. |
| 5 | **Kein Migration-Code von localStorage zu Backend.** | Nicht in Produktion. Bestehende `examlab-favoriten`-localStorage-Einträge sind Test-State der Dev-User. Beim ersten App-Start nach Update ist Backend-State leer → Dev-Users fügen Favoriten einmal neu hinzu. Spart ~30 Z. Code + 4 Edge-Case-Tests. |
| 6 | **Loading-Skeleton während initial Backend-Load (~1.5-2s).** | Kein Cache, kein Flackern. Konsistent mit anderen Backend-loaded Surfaces (tagsStore, schulConfigStore). |
| 7 | **Save schickt das KOMPLETTE LPProfil-Objekt, nicht nur das `favoriten`-Feld.** | Apps-Script-Endpoint `speichereLPProfilEndpoint` schreibt das ganze Profil als JSON-Blob in eine Sheet-Zelle. Field-Level-Patch erfordert Backend-Endpoint-Erweiterung. Out of scope. |
| 8 | **Combined Spec/Plan/Implementation E.3+E.4+E.5.** | Tightly coupled (gleicher Store, gleiche API). Einzeln-Bundling wäre 3× Spec/Plan-Overhead ohne technischen Mehrwert. |

## 4. Daten-Modell

### 4.1 `LPProfil` (`src/types/stammdaten.ts` Änderung)

**Vorher:**
```ts
export interface LPProfil {
  email: string
  kursIds: string[]
  fachschaftIds: string[]
  gefaesse: string[]
  favoriten?: AppOrt[]
  testdatenSichtbar?: boolean
}
```

**Nachher:**
```ts
import type { Favorit } from '../store/favoritenStore'

export interface LPProfil {
  email: string
  kursIds: string[]
  fachschaftIds: string[]
  gefaesse: string[]
  favoriten?: Favorit[]  // E.3: cross-device sync
  testdatenSichtbar?: boolean
}
```

`AppOrt`-Type wird aus `stammdaten.ts` entfernt (kein Konsument mehr — falls Code-Audit überraschende Konsumenten findet, separater Cleanup vor E.3-Start).

### 4.2 `Favorit` (`src/store/favoritenStore.ts` unverändert)

Bestehender Type bleibt wie heute. Backwards-Compat: `icon` ist `string | undefined`, Lucide-Component-Name als String seit v2-Migration.

### 4.3 `favoritenStore` Refactor

**Removed:**
- `persist`-Middleware
- `version`, `migrate`, `onRehydrateStorage`
- localStorage-Cleanup-Logik (Migration `lp-favoriten` → `examlab-favoriten`)

**Added:**
```ts
interface FavoritenStore {
  favoriten: Favorit[]
  ladeStatus: 'idle' | 'laeuft' | 'fertig' | 'fehler'

  // Read-only (computed from stammdatenStore via subscriber)
  // OR direct mirror via setState in subscriber.

  // Actions
  ladeAusBackend: () => void  // Hydratet aus stammdatenStore.lpProfil
  toggleFavorit: (...) => Promise<void>  // optimistic + speichereLPProfil
  istFavorit: (ziel: string) => boolean
  updateSortierung: (zielReihenfolge: string[]) => Promise<void>
  entferneFavorit: (ziel: string) => Promise<void>
  reset: () => void
}
```

**Subscriber-Pattern:** `favoritenStore` subscribed via `stammdatenStore.subscribe()` auf Änderungen von `lpProfil.favoriten`. Wenn das Backend-Load oder ein anderer Tab die Favoriten ändert, spiegelt favoritenStore das automatisch.

**Action-Pattern (Beispiel `toggleFavorit`):**
```ts
toggleFavorit: async (fav) => {
  const { favoriten } = get()
  const exists = favoriten.find(f => f.ziel === fav.ziel)
  const next = exists
    ? favoriten.filter(f => f.ziel !== fav.ziel)
    : [...favoriten, { ...fav, sortierung: maxSort + 1 }]

  // Optimistic
  set({ favoriten: next })

  // Persist via stammdatenStore (komplettes LPProfil + neue Favoriten-Liste)
  const { lpProfil, speichereLPProfil } = useStammdatenStore.getState()
  if (!lpProfil) return  // nicht eingeloggt — nichts zu speichern
  const ok = await speichereLPProfil({ ...lpProfil, favoriten: next })
  if (!ok) {
    // Error: refetch from server
    useToastStore.getState().add({ kind: 'error', text: 'Favorit konnte nicht synchronisiert werden — wird neu geladen' })
    await useStammdatenStore.getState().ladeLPProfil(lpProfil.email)
    // Subscriber spiegelt neue Backend-Wahrheit
  }
}
```

### 4.4 `stammdatenStore` Änderungen

Keine direkten Änderungen. `speichereLPProfil` funktioniert bereits korrekt mit komplettem Profil-Objekt inkl. neuem `favoriten`-Feld.

Optional: Type-Check beim `ladeLPProfil`-Response — wenn Backend ein altes `AppOrt[]`-Array liefert (von vor Cluster-E.3), wird `favoriten` mit `[]` initialisiert statt einem Type-Fehler. Defensive-Pattern:

```ts
ladeLPProfil: async (email: string) => {
  ...
  if (result?.profil) {
    // E.3: Drop legacy AppOrt-favoriten (kein Migration-Code, siehe Entscheidung #5)
    const profil = result.profil
    if (Array.isArray(profil.favoriten) && profil.favoriten.length > 0) {
      const first = profil.favoriten[0]
      if (!first.typ || !first.ziel) {
        // Legacy AppOrt format detected — drop
        profil.favoriten = []
      }
    }
    set({ lpProfil: profil })
  }
}
```

Drop-on-load-Pattern statt Migration: Dev-User mit Legacy-Daten verlieren ihre Test-Favoriten beim ersten Load. Akzeptabel weil nicht-in-Produktion.

## 5. UI-Komponenten

### 5.1 `<TabStarToggle>` (E.4, NEU)

**Pfad:** `src/components/lp/TabStarToggle.tsx`
**Grösse:** ~40 Zeilen
**Props:** `{ tabId: string, surface: 'einstellungen' | 'hilfe', label: string, icon?: string }`

```tsx
export function TabStarToggle({ tabId, surface, label, icon }: Props) {
  const istFav = useFavoritenStore(s => s.istFavorit(tabId))
  const toggle = useFavoritenStore(s => s.toggleFavorit)
  const typ: Favorit['typ'] = surface === 'einstellungen' ? 'einstellungen-tab' : 'hilfe-tab'
  return (
    <button
      onClick={() => toggle({ typ, ziel: tabId, label, icon })}
      aria-label={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      className="text-slate-400 hover:text-yellow-500 transition-colors"
    >
      <Star className={`w-5 h-5 ${istFav ? 'fill-current text-yellow-500' : ''}`} />
    </button>
  )
}
```

**Integration:** Wird in `EinstellungenPanel.tsx` (7 Tabs) + `HilfeSeite.tsx` (10 Tabs) im Tab-Header eingebunden — neben dem TYPO.h1-Titel.

Pattern aus Spec §5.3:
```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className={TYPO.h1}>{tab.titel}</h2>
  <TabStarToggle tabId={tab.id} surface={tab.surface} label={tab.titel} icon={tab.icon} />
</div>
```

### 5.2 `<FavoritenPicker>` Modal (E.5, NEU)

**Pfad:** `src/components/lp/FavoritenPicker.tsx`
**Grösse:** ~150 Zeilen
**Props:** `{ isOpen: boolean, onClose: () => void }`

**Aufbau:**
- BaseDialog mit Titel „Favorit hinzufügen"
- Tab-Bar oben: 2 Tabs „Einstellungen" + „Hilfe" (Surface-Filter)
- Suchfeld im Header für Titel-Substring-Filter
- Liste der Tabs aus Tab-Registry (`tabsFuerSurface('einstellungen', ctx)` + `tabsFuerSurface('hilfe', ctx)`)
- Pro Tab-Item: Icon (Lucide), Titel, Surface-Badge, „+ Hinzufügen"-Button (oder „✓ Bereits Favorit" disabled)
- Sortierung: alphabetisch nach Titel
- Bereits-Favorit-Zustand: `useFavoritenStore(s => s.istFavorit(tab.id))`

**Click-Handler:** ruft `toggleFavorit({ typ, ziel: tab.id, label: tab.titel, icon: tab.icon })`. Modal bleibt offen (Multi-Add möglich). Schliesst via „Fertig"-Button oder ESC.

**Tab-Registry-Konsum:** `ctx` muss `LpKontext` enthalten (von `useLpKontext()`). Picker nutzt nur Tabs mit `surface !== 'hidden'`.

### 5.3 Favoriten-Tab Erweiterung (`FavoritenTab.tsx`)

**Bestehende Komponente** — bekommt einen neuen Button „+ Favorit hinzufügen" oberhalb der Liste. Klick öffnet `<FavoritenPicker>`. State `pickerOpen` lokal.

### 5.4 Loading-Skeleton (`Favoriten.tsx` Erweiterung)

`Favoriten.tsx` rendert die Favoriten-Liste (heute z.B. in `LPStartseite`). Während `favoritenStore.ladeStatus === 'laeuft'` zeigt sie 3 Skeleton-Karten (Tailwind `animate-pulse`-Pattern).

Bei `ladeStatus === 'fehler'`: leerer Bereich + Toast wurde schon getriggert von `ladeLPProfil`. Optional Inline-Retry-Button.

## 6. Phasierung

Phasen sind sequentiell, je 1 Commit. Jede Phase tsc-clean + vitest-grün + ci-check-grün.

### Phase 1 — Foundation (E.3 Step 1)
- `LPProfil.favoriten` Type-Wechsel `AppOrt[]` → `Favorit[]` in `stammdaten.ts`
- `AppOrt`-Type entfernen falls keine Konsumenten (Code-Audit vor Commit)
- `ladeLPProfil` defensive-Drop für Legacy-Format
- Vitest-Update für stammdatenStore-Tests

### Phase 2 — favoritenStore Refactor (E.3 Step 2)
- `persist`-Middleware raus
- `ladeAusBackend`, `ladeStatus` ergänzen
- `toggleFavorit`/`updateSortierung`/`entferneFavorit` async + optimistic + speichereLPProfil-Delegation + Error-Refetch
- Subscriber zu stammdatenStore.lpProfil.favoriten
- `favoritenStore.test.ts` Update: Mock stammdatenStore, teste Optimistic-Path + Error-Refetch-Path

### Phase 3 — App-Mount Backend-Load (E.3 Step 3)
- In existing LP-Login-Flow (`LPStartseite.tsx` oder `App.tsx`): nach `ladeLPProfil(email)` Erfolg → `favoritenStore.ladeAusBackend()` triggern
- Falls via Subscriber: kein expliziter Trigger nötig, nur subscriber-Setup in Store-Init
- `Favoriten.tsx` Loading-Skeleton (~15 Z.)
- Browser-E2E: LP-Login → Skeleton sichtbar → Favoriten erscheinen nach ~1.5s

### Phase 4 — TabStarToggle Komponente (E.4 Step 1)
- `src/components/lp/TabStarToggle.tsx` neu
- Unit-Test: toggle on/off, label, icon-State, aria-label

### Phase 5 — TabStarToggle Einbindung (E.4 Step 2)
- 7 Tabs in EinstellungenPanel + 10 Tabs in HilfeSeite bekommen `<TabStarToggle>` im Header
- Snapshot-Tests aktualisieren
- Browser-E2E: 1 Tab favorisieren, Reload, Favorit persistiert via Backend

### Phase 6 — FavoritenPicker Modal (E.5)
- `src/components/lp/FavoritenPicker.tsx` neu
- Wiring in `FavoritenTab.tsx` (Button + State)
- Unit-Tests: Picker rendert Tabs aus Registry, click triggert toggleFavorit, bereits-Favorit ist disabled, Filter funktioniert
- Browser-E2E: Picker öffnen → Tab hinzufügen → Modal bleibt offen → 2. Tab hinzufügen → Fertig → 2 neue Favoriten sichtbar

### Phase 7 — Browser-E2E Cross-Device
- 2 Browser-Tabs LP-Login wr.test (gleiche Email)
- Tab 1: Favorit togglen
- Tab 2: Reload (oder manuell `ladeLPProfil()` triggern)
- Erwartung: Favorit erscheint in Tab 2

## 7. Test-Strategie

### Unit-Tests (vitest, neu/erweitert)
| File | Coverage |
|---|---|
| `favoritenStore.test.ts` (erweitert) | toggleFavorit-optimistic, error-refetch, subscriber-sync, ladeStatus-transitions |
| `TabStarToggle.test.tsx` (neu) | rendering on/off, click-handler, aria-label, label-prop |
| `FavoritenPicker.test.tsx` (neu) | renders all tabs from registry, click toggles, disabled-state for existing favs, filter by title |
| `stammdatenStore.test.ts` (erweitert) | ladeLPProfil drops legacy AppOrt favoriten |

### Browser-E2E (manuell auf Staging, jeweils mit `?cb=<ts>` Cache-Buster)
1. LP-Login → Loading-Skeleton sichtbar → Favoriten erscheinen (Backend-Load)
2. Tab favorisieren via Star-Toggle → Reload → Favorit persistiert
3. Tab via Picker hinzufügen → Modal bleibt offen → 2. Tab → Fertig
4. Cross-Device: 2 Browser-Tabs (gleiche LP-Email), Toggle in Tab 1, Reload Tab 2 → sichtbar
5. Backend-Fehler-Simulation (z.B. DevTools-Network offline) → Toast „Sync fehlgeschlagen" + Refetch
6. Drag&Drop-Sortierung (falls bestehend) → updateSortierung speichert via Backend

### Tests die NICHT geschrieben werden
- Migration-Tests (kein Migration-Code, siehe Entscheidung #5)
- Multi-Tab-Race-Tests (Optimistic + Refetch behandelt das funktional, Test-Aufwand zu hoch für YAGNI)
- Performance-Tests (vor Backend-Migration sinnlos; Apps-Script-Latenz dominiert)

## 8. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| `AppOrt`-Konsument übersehen → tsc-Fehler nach Type-Switch | Niedrig (grep schnell) | Niedrig (Build-Time) | Phase 1: vor Type-Switch `grep -rn "AppOrt"` exhaustiv |
| Subscriber-Sync von stammdatenStore zu favoritenStore re-render-loop | Mittel | Hoch (React #185) | useShallow-Pattern. Vitest-Test mit Multi-Update-Szenario. Memory-Lehre `feedback_zustand_selector_useshallow.md` |
| User klickt schnell mehrfach (race) | Hoch im UX | Niedrig (last-write-wins) | Optimistic + Refetch ist designt für genau diesen Fall. Komplette Liste pro Save → letzter Save gewinnt natürlicherweise |
| Backend-Save-Fehler beim ersten Login (kein LP-Profil im Backend) | Niedrig | Mittel (User sieht Toast) | speichereLPProfil legt LP-Profil-Zeile an wenn nicht vorhanden (Backend-Endpoint Z. 12793). Funktioniert bereits. |
| User mit altem Browser-localStorage `examlab-favoriten` (Test-Daten) verliert Favoriten | Hoch (jeder Dev-User) | Niedrig (Test-Daten) | Bewusste Design-Entscheidung #5. Dev-User fügen Favoriten einmal neu hinzu. |
| Apps-Script-Latenz bei sehr häufigem Toggle (Spam-Click) | Mittel | Mittel (Backend hinkt hinterher) | Keine Mitigation auf E.3-Ebene. Backend-Migration löst das. Optional debounce wenn relevant. |

## 9. Out of Scope

- Migration-Code von localStorage zu Backend (Entscheidung #5)
- LPProfil Field-Level-Patch-Endpoint (Backend-Endpoint-Erweiterung)
- Drag&Drop-Sortierung der Favoriten (falls heute nicht im Store, separat)
- Multi-Tab-Sync via BroadcastChannel/storage-Events (Refetch reicht für jetzt)
- Defer-able tier-Debates aus E.2 (I-1 Hallo-Vorname, I-2 AdminLayout)
- `appNavigation.ts` Persist-Migration auf Lucide-Keys (separater Spawn-Task)
- Storybook für Favoriten-Komponenten (Cluster G Spec §13)

## 10. Erfolgs-Kriterien

- `favoritenStore` hat keine `persist`-Middleware mehr
- LP-Favoriten überleben Browser-Cache-Reset (Backend-Load nach Re-Login)
- Cross-Device-Sync: Favorit-Änderung in Browser A ist nach Re-Login in Browser B sichtbar
- 17 Tab-Headers haben `<TabStarToggle>` (7 EinstellungenPanel + 10 HilfeSeite)
- Favoriten-Picker öffnet, listet alle Tabs aus Registry, fügt hinzu/entfernt
- vitest grün, alle 8 lint-Gates clean, tsc -b + vite build clean
- Browser-E2E 6 Test-Cases auf Staging mit echtem LP-Login ✅

## 11. Verwandte Spec-Sektionen

- `2026-05-11-cluster-e-konsistenz-design.md` §5.4 — Foundation-Idee
- `2026-05-17-cluster-e-2-typografie-design.md` — TYPO-Tokens (von TabStarToggle-Integration benutzt)
- `project_cluster_f_3_komplett.md` — TestdatenTab-Pattern für LPProfil-Reads (Vorbild)
