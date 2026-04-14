# Deep Links, Home-Startseite & React Router — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ExamLab's handbuilt hash routing with React Router (BrowserRouter), add a Home dashboard with favorites/activity, and extend the favorites system to include app locations with drag & drop sorting.

**Architecture:** BrowserRouter with `basename` for GitHub Pages. Role-based route trees (LP vs SuS). The existing `lpNavigationStore` is replaced by React Router state (`useParams`, `useNavigate`). A `404.html` at repo root handles direct URL access on GitHub Pages. `@dnd-kit` (already installed) handles drag & drop.

**Tech Stack:** React Router v7, React 19, TypeScript, Zustand, Tailwind CSS v4, @dnd-kit (already installed), Vite 7, Vitest

**Spec:** `docs/superpowers/specs/2026-04-13-deep-links-home-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/router/Router.tsx` | Top-level BrowserRouter + route definitions |
| `src/router/AuthGuard.tsx` | Redirect to /login with returnTo, role-mismatch guard |
| `src/router/LPRoutes.tsx` | All LP route definitions (nested) |
| `src/router/SuSRoutes.tsx` | All SuS route definitions (nested) |
| `src/router/hashMigration.ts` | One-time `#/...` → `/...` redirect |
| `src/components/lp/Home.tsx` | Home dashboard (5 sections) |
| `src/components/lp/Home.test.tsx` | Tests for Home |
| `src/components/settings/FavoritenTab.tsx` | Favorites management in settings |
| `src/store/favoritenStore.ts` | Standalone favorites store (extracted from lpNavigationStore) |
| `src/store/favoritenStore.test.ts` | Tests for favorites store |
| `src/store/lpUIStore.ts` | Renamed remnant of lpNavigationStore (UI-only state) |
| `404.html` | Repo-root 404 redirect for GitHub Pages |

### Modified Files
| File | Changes |
|------|---------|
| `src/main.tsx` | Wrap app in BrowserRouter |
| `src/App.tsx` | Replace role-based if/else with Router outlet, remove `?ids=` handling |
| `src/index.html` | Add 404 decoder script |
| `src/AppUeben.tsx` | Accept Router-based navigation instead of callback props |
| `src/store/lpNavigationStore.ts` | Gradually remove → rename to lpUIStore.ts |
| `src/store/ueben/navigationStore.ts` | Remove (replaced by SuS routes) |
| `src/components/lp/LPStartseite.tsx` | Remove hash listener, consume route params |
| `src/components/lp/LPHeader.tsx` | Use `<Link>` instead of store actions |
| `vite.config.ts` | SW version bump |
| `.github/workflows/deploy.yml` | Copy 404.html to `_site/` root |
| `package.json` | Add `react-router-dom` |

---

## Phase 1: React Router Foundation

### Task 1.1: Install react-router-dom and create branch

**Files:**
- Modify: `ExamLab/package.json`

- [ ] **Step 1: Create feature branch**
```bash
cd ExamLab && git checkout -b feature/a1-deep-links-router
```

- [ ] **Step 2: Install react-router-dom**
```bash
npm install react-router-dom
```

- [ ] **Step 3: Verify TypeScript types are included**
```bash
npx tsc -b
```
Expected: PASS (react-router-dom v7 ships its own types)

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json
git commit -m "Phase 1.1: Install react-router-dom"
```

---

### Task 1.2: Create 404.html and index.html decoder

**Files:**
- Create: `404.html` (repo root)
- Modify: `ExamLab/index.html`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create 404.html at repo root**

```html
<!-- /404.html -->
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Weiterleitung...</title>
  <script>
    (function() {
      var l = window.location;
      var base = '/GYM-WR-DUY/ExamLab/';
      if (l.pathname.startsWith(base) && l.pathname !== base) {
        var route = l.pathname.slice(base.length);
        l.replace(
          l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
          base + '?p=/' + encodeURIComponent(route) +
          (l.search ? '&q=' + encodeURIComponent(l.search.slice(1)) : '') +
          l.hash
        );
      }
    })();
  </script>
</head>
<body>
  <h1>Seite nicht gefunden</h1>
  <p><a href="/GYM-WR-DUY/">Zur Startseite</a></p>
</body>
</html>
```

- [ ] **Step 2: Add decoder script to index.html**

In `ExamLab/index.html`, add before `<script type="module" src="/src/main.tsx">`:

```html
<script>
  // Decode 404.html redirect (GitHub Pages SPA workaround)
  (function() {
    var params = new URLSearchParams(window.location.search);
    var p = params.get('p');
    if (p) {
      var path = decodeURIComponent(p);
      var q = params.get('q');
      var search = q ? '?' + decodeURIComponent(q) : '';
      window.history.replaceState(null, '', path + search + window.location.hash);
    }
  })();
</script>
```

- [ ] **Step 3: Update deploy.yml to copy 404.html**

In `.github/workflows/deploy.yml`, after the site assembly step that creates `_site/`, add:

```yaml
      - name: Copy 404.html for SPA routing
        run: cp 404.html _site/404.html
```

- [ ] **Step 4: Verify build still works**
```bash
cd ExamLab && npm run build
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
cd .. && git add 404.html ExamLab/index.html .github/workflows/deploy.yml
git commit -m "Phase 1.2: Add 404.html redirect + index.html decoder for GitHub Pages BrowserRouter"
```

---

### Task 1.3: Create Router shell with BrowserRouter

**Files:**
- Create: `ExamLab/src/router/Router.tsx`
- Create: `ExamLab/src/router/AuthGuard.tsx`
- Create: `ExamLab/src/router/LPRoutes.tsx`
- Create: `ExamLab/src/router/SuSRoutes.tsx`
- Create: `ExamLab/src/router/hashMigration.ts`
- Modify: `ExamLab/src/main.tsx`
- Modify: `ExamLab/src/App.tsx`

This is the biggest task. The approach: wrap the existing App.tsx content in Router, keeping existing rendering logic intact. Navigation still goes through lpNavigationStore (compatibility layer). We're NOT changing component rendering yet — just adding the Router shell.

- [ ] **Step 1: Create hashMigration.ts**

```typescript
// src/router/hashMigration.ts
/**
 * One-time migration: convert old hash-based bookmarks (#/pruefung/abc)
 * to path-based URLs (/pruefung/abc) for BrowserRouter.
 * Call once at app start, before Router mounts.
 */
let migrated = false
export function migrateHashBookmarks(basePath: string): void {
  if (migrated) return // Guard gegen mehrfache Ausführung (HMR)
  migrated = true
  const hash = window.location.hash
  if (hash.startsWith('#/')) {
    const path = hash.slice(1) // '#/pruefung/abc' → '/pruefung/abc'
    window.history.replaceState(null, '', basePath + path.slice(1))
  }
}
```

- [ ] **Step 2: Create AuthGuard.tsx**

```typescript
// src/router/AuthGuard.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface AuthGuardProps {
  children: React.ReactNode
  erlaubteRolle: 'lp' | 'sus'
}

export function AuthGuard({ children, erlaubteRolle }: AuthGuardProps) {
  const user = useAuthStore(s => s.user)
  const location = useLocation()

  // Nicht eingeloggt → Login mit Return-URL
  if (!user) {
    const returnTo = location.pathname + location.search
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  // Rollen-Mismatch → zur eigenen Home
  if (user.rolle !== erlaubteRolle) {
    const home = user.rolle === 'lp' ? '/home' : '/sus'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 3: Create LPRoutes.tsx (shell — delegates to existing components)**

```typescript
// src/router/LPRoutes.tsx
import { Route, Routes, Navigate } from 'react-router-dom'
import { AuthGuard } from './AuthGuard'
import { lazy, Suspense } from 'react'

// Phase 1: LPStartseite rendert alles intern (bestehendes Verhalten)
// Phase 2 wird diese Routes aufbrechen in einzelne Komponenten
const LPStartseite = lazy(() => import('../components/lp/LPStartseite'))

function LPFallback() {
  return <div className="flex items-center justify-center min-h-screen text-gray-500">Wird geladen...</div>
}

export function LPRoutes() {
  return (
    <AuthGuard erlaubteRolle="lp">
      <Suspense fallback={<LPFallback />}>
        {/* Phase 1: Alle LP-Routes delegieren an LPStartseite.
            LPStartseite liest weiterhin aus lpNavigationStore.
            In Phase 2 werden diese Routes einzelne Komponenten rendern. */}
        <Routes>
          <Route path="home" element={<LPStartseite />} />
          <Route path="pruefung/*" element={<LPStartseite />} />
          <Route path="uebung/*" element={<LPStartseite />} />
          <Route path="fragensammlung/*" element={<LPStartseite />} />
          <Route path="einstellungen/*" element={<LPStartseite />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </AuthGuard>
  )
}
```

- [ ] **Step 4: Create SuSRoutes.tsx (shell — delegates to existing components)**

```typescript
// src/router/SuSRoutes.tsx
import { Route, Routes, Navigate, useSearchParams } from 'react-router-dom'
import { AuthGuard } from './AuthGuard'
import { lazy, Suspense } from 'react'

// Phase 1: Bestehende Komponenten
const SuSStartseite = lazy(() => import('../components/sus/SuSStartseite'))

function SuSFallback() {
  return <div className="flex items-center justify-center min-h-screen text-gray-500">Wird geladen...</div>
}

export function SuSRoutes() {
  return (
    <AuthGuard erlaubteRolle="sus">
      <Suspense fallback={<SuSFallback />}>
        <Routes>
          <Route path="/" element={<SuSStartseite />} />
          <Route path="ueben/*" element={<SuSStartseite />} />
          <Route path="pruefung" element={<SuSStartseite />} />
          <Route path="korrektur/:pruefungId" element={<SuSStartseite />} />
          <Route path="*" element={<Navigate to="/sus" replace />} />
        </Routes>
      </Suspense>
    </AuthGuard>
  )
}
```

- [ ] **Step 5: Create Router.tsx**

```typescript
// src/router/Router.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LPRoutes } from './LPRoutes'
import { SuSRoutes } from './SuSRoutes'
import { migrateHashBookmarks } from './hashMigration'
import { lazy, Suspense } from 'react'

const LoginScreen = lazy(() => import('../components/LoginScreen'))

const basePath = import.meta.env.BASE_URL // Vite stellt das aus vite.config.ts bereit

// Hash-Migration einmalig beim Laden
migrateHashBookmarks(basePath)

function RootRedirect() {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.rolle === 'lp' ? '/home' : '/sus'} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={
          <Suspense fallback={<div />}>
            <LoginScreen />
          </Suspense>
        } />
        {/* LP-Bereich: LPRoutes bekommt /* und routet intern */}
        <Route path="/*" element={<LPRoutes />} />
        {/* SuS-Bereich */}
        <Route path="/sus/*" element={<SuSRoutes />} />
        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Update main.tsx to use Router**

Replace the current `App` import with `AppRouter`:

```typescript
// src/main.tsx
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AppRouter } from './router/Router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
          Wird geladen...
        </div>
      }>
        <AppRouter />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
```

- [ ] **Step 7: Update App.tsx — keep as LP entry but remove top-level routing**

The existing `App.tsx` currently handles auth check + role routing + exam loading. In Phase 1, we keep App.tsx as the LP controller but the Router handles role dispatching. App.tsx is now rendered INSIDE LPRoutes/SuSRoutes, not at the top level.

**Important:** This is the most delicate step. The key change is that `App.tsx` no longer checks `user.rolle` for routing — the Router already did that. But `App.tsx` still handles `?id=` for exam loading and the LP/SuS conditional rendering. 

In Phase 1, `LPStartseite` continues to read from `lpNavigationStore` internally. The Router provides the URL shell, but internal navigation still works the old way. We add a `useEffect` that syncs the current URL path to `lpNavigationStore` state (compatibility bridge):

Add to `LPStartseite.tsx` (after existing hash setup, lines ~46-61):

```typescript
import { useLocation } from 'react-router-dom'

// Phase 1 Compatibility: Sync URL → lpNavigationStore
const location = useLocation()
useEffect(() => {
  // Bridge: URL-Pfad in alten Store synchronisieren
  const path = location.pathname
  if (path.startsWith('/pruefung')) {
    setModus('pruefung')
  } else if (path.startsWith('/uebung')) {
    setModus('uebung')
  } else if (path.startsWith('/fragensammlung')) {
    setModus('fragensammlung')
  } else if (path.startsWith('/einstellungen')) {
    setZeigEinstellungen(true)
  }
  // In Phase 2 wird dieser Bridge entfernt
}, [location.pathname])
```

And remove the `hashchange` listener and `navigiereZuHash()` call on mount.

- [ ] **Step 8: Bump SW version in vite.config.ts**

In `vite.config.ts`, add a comment-based version to force SW update:

```typescript
// In the VitePWA config, add to workbox:
workbox: {
  // ... existing config
  // Force SW update when switching from hash to path routing
  additionalManifestEntries: [
    { url: 'router-v1', revision: '1' }
  ],
}
```

- [ ] **Step 9: Verify everything compiles**
```bash
npx tsc -b && npm run build
```
Expected: PASS

- [ ] **Step 10: Run existing tests**
```bash
npx vitest run
```
Expected: All 209 tests pass. Some tests may need a Router wrapper — fix if needed.

- [ ] **Step 11: Commit**
```bash
git add -A
git commit -m "Phase 1.3: BrowserRouter shell with AuthGuard, LPRoutes, SuSRoutes, hash migration"
```

---

## Phase 2: LP Route Migration

### Task 2.1: Sync lpNavigationStore from URL (full compatibility bridge)

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`
- Modify: `ExamLab/src/store/lpNavigationStore.ts`

The goal: URL is now source of truth for top-level navigation. `lpNavigationStore` reads from URL instead of being the source. `bauHash()` and `navigiereZuHash()` are replaced by a `useEffect` that syncs URL → store.

- [ ] **Step 1: Add useNavigate wrapper to lpNavigationStore**

Add a hook `useLPNavigation()` that wraps store actions with `useNavigate()`:

```typescript
// src/hooks/useLPNavigation.ts
import { useNavigate } from 'react-router-dom'
import { useLPNavigationStore } from '../store/lpNavigationStore'

export function useLPNavigation() {
  const navigate = useNavigate()
  
  const navigiereZuComposer = (titel: string, configId: string) => {
    navigate(`/pruefung/${configId}`)
  }
  
  const zurueckZumDashboard = () => {
    // Explizite Route statt navigate(-1), da Deep-Link-User sonst die App verlassen
    navigate('/pruefung')
  }
  
  const setModus = (modus: 'pruefung' | 'uebung' | 'fragensammlung') => {
    const pfade = {
      pruefung: '/pruefung',
      uebung: '/uebung',
      fragensammlung: '/fragensammlung',
    }
    navigate(pfade[modus])
  }
  
  const navigiereZuEinstellungen = (tab?: string) => {
    navigate(tab ? `/einstellungen/${tab}` : '/einstellungen')
  }
  
  const navigiereZuKorrektur = (configId: string) => {
    navigate(`/pruefung/${configId}/korrektur`)
  }
  
  const navigiereZuMonitoring = (configId: string) => {
    navigate(`/pruefung/${configId}/monitoring`)
  }
  
  const navigiereZuFrageneditor = (frageId: string) => {
    navigate(`/fragensammlung/${frageId}`)
  }

  return {
    navigiereZuComposer,
    zurueckZumDashboard,
    setModus,
    navigiereZuEinstellungen,
    navigiereZuKorrektur,
    navigiereZuMonitoring,
    navigiereZuFrageneditor,
    navigate,
  }
}
```

- [ ] **Step 2: Remove hash routing from lpNavigationStore**

Remove from `lpNavigationStore.ts`:
- `bauHash()` function
- `navigiereZuHash()` function
- `aktualisiereHash()` function
- All calls to `window.history.replaceState`
- All `setTimeout(() => get().aktualisiereHash(), 0)` calls

Keep:
- Type definitions (`LPModus`, `LPAnsicht`, etc.)
- `ansichtHistory` (for nested navigation within Composer)
- `zeigHilfe`, `zeigEinstellungen` (overlay state)
- `composerKey` (for force re-mount)
- Favoriten (will be extracted in Phase 3)

- [ ] **Step 3: Remove hashchange listener from LPStartseite.tsx**

Remove the `useEffect` that sets up `window.addEventListener('hashchange', ...)` and the initial `navigiereZuHash()` call on mount.

- [ ] **Step 4: Replace store-based navigiere calls with useLPNavigation**

Search all files that call `useLPNavigationStore` actions for navigation and replace with `useLPNavigation()` hook. Key files:
- `LPStartseite.tsx` — `setModus`, `navigiereZuComposer`
- `LPHeader.tsx` — tab switching, settings
- `TrackerSection.tsx` — link to correction
- All list components that open a Composer

Use grep to find all callsites:
```bash
grep -rn "navigiereZuComposer\|setModus\|zurueckZumDashboard\|setZeigEinstellungen" src/
```

Replace each with the `useLPNavigation()` equivalent.

- [ ] **Step 5: Verify tsc + tests + build**
```bash
npx tsc -b && npx vitest run && npm run build
```
Expected: All pass

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "Phase 2.1: Replace hash routing with useLPNavigation hook, remove bauHash/navigiereZuHash"
```

---

### Task 2.2: Split LPRoutes into individual route components

**Files:**
- Modify: `ExamLab/src/router/LPRoutes.tsx`
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

Now that navigation goes through React Router, each route renders its specific component directly instead of LPStartseite routing internally.

- [ ] **Step 1: Update LPRoutes.tsx with actual component mapping**

```typescript
// src/router/LPRoutes.tsx — updated
import { Route, Routes, Navigate } from 'react-router-dom'
import { AuthGuard } from './AuthGuard'
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('../components/lp/Home'))
const LPStartseite = lazy(() => import('../components/lp/LPStartseite'))
const PruefungsComposer = lazy(() => import('../components/lp/vorbereitung/PruefungsComposer'))
const TrackerSection = lazy(() => import('../components/lp/TrackerSection'))
// KorrekturDashboard ist default export, aber re-exportiert als named in index.ts
const KorrekturDashboard = lazy(() => import('../components/lp/korrektur/KorrekturDashboard'))
const DurchfuehrenDashboard = lazy(() => import('../components/lp/durchfuehrung/DurchfuehrenDashboard'))
// MultiDurchfuehrenDashboard ist named export → Wrapper nötig
const MultiDurchfuehrenDashboard = lazy(() =>
  import('../components/lp/durchfuehrung/MultiDurchfuehrenDashboard').then(m => ({ default: m.MultiDurchfuehrenDashboard }))
)
const FragenBrowser = lazy(() => import('../components/lp/fragenbank/FragenBrowser'))
const AnalyseDashboard = lazy(() => import('../components/lp/ueben/AnalyseDashboard'))
const EinstellungenPanel = lazy(() => import('../components/settings/EinstellungenPanel'))

function LPFallback() {
  return <div className="flex items-center justify-center min-h-screen text-gray-500">Wird geladen...</div>
}

export function LPRoutes() {
  return (
    <AuthGuard erlaubteRolle="lp">
      <Suspense fallback={<LPFallback />}>
        <Routes>
          {/* Home */}
          <Route path="home" element={<Home />} />
          
          {/* Prüfungen */}
          <Route path="pruefung">
            <Route index element={<LPStartseite initialModus="pruefung" />} />
            <Route path="tracker" element={<TrackerSection />} />
            <Route path="monitoring" element={<MultiDurchfuehrenDashboard />} />
            <Route path=":configId" element={<PruefungsComposer />} />
            <Route path=":configId/korrektur" element={<KorrekturDashboard />} />
            <Route path=":configId/monitoring" element={<DurchfuehrenDashboard />} />
          </Route>
          
          {/* Übungen */}
          <Route path="uebung">
            <Route index element={<LPStartseite initialModus="uebung" />} />
            <Route path="durchfuehren" element={<DurchfuehrenDashboard />} />
            <Route path="analyse" element={<AnalyseDashboard />} />
            <Route path=":configId" element={<PruefungsComposer />} />
          </Route>
          
          {/* Fragensammlung */}
          <Route path="fragensammlung">
            <Route index element={<FragenBrowser />} />
            <Route path=":frageId" element={<FragenBrowser />} />
          </Route>
          
          {/* Einstellungen */}
          <Route path="einstellungen">
            <Route index element={<EinstellungenPanel />} />
            <Route path=":tab" element={<EinstellungenPanel />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </AuthGuard>
  )
}
```

**Note:** The actual component names may differ slightly. Check each import path by looking at what LPStartseite currently conditionally renders. The key principle: each `<Route>` renders the component that LPStartseite currently shows for that `modus + ansicht` combination.

- [ ] **Step 2: Add `useParams()` to components that need configId**

Components like `PruefungsComposer`, `KorrekturView`, `DurchfuehrenDashboard` currently get `configId` from `lpNavigationStore.aktiveConfigId`. Add `useParams()`:

```typescript
import { useParams } from 'react-router-dom'

function PruefungsComposer() {
  const { configId } = useParams<{ configId: string }>()
  // Use configId from URL instead of store
  // ...
}
```

- [ ] **Step 3: Simplify LPStartseite to only render list views**

`LPStartseite` no longer needs to switch between Composer/Dashboard/Fragenbank/Einstellungen. It becomes the list-view component for Prüfungen and Übungen. Accept an `initialModus` prop:

```typescript
interface LPStartseiteProps {
  initialModus?: 'pruefung' | 'uebung'
}
```

Remove all conditional rendering that checks `ansicht === 'composer'` or `zeigEinstellungen` — those are now separate routes.

- [ ] **Step 4: Verify tsc + tests + build**
```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "Phase 2.2: Split LP routes into individual components, useParams for configId"
```

---

## Phase 3: Home Dashboard + Favorites

### Task 3.1: Create favoritenStore (extract from lpNavigationStore)

**Files:**
- Create: `ExamLab/src/store/favoritenStore.ts`
- Create: `ExamLab/src/store/favoritenStore.test.ts`
- Modify: `ExamLab/src/store/lpNavigationStore.ts` (remove favoriten code)

- [ ] **Step 1: Write failing test for favoritenStore**

```typescript
// src/store/favoritenStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useFavoritenStore } from './favoritenStore'

describe('favoritenStore', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
    localStorage.clear()
  })

  it('fügt einen Ort-Favoriten hinzu', () => {
    const { toggleFavorit } = useFavoritenStore.getState()
    toggleFavorit({
      typ: 'ort',
      ziel: '/fragensammlung',
      label: 'Fragensammlung',
      sortierung: 0,
    })
    const favoriten = useFavoritenStore.getState().favoriten
    expect(favoriten).toHaveLength(1)
    expect(favoriten[0].typ).toBe('ort')
    expect(favoriten[0].ziel).toBe('/fragensammlung')
  })

  it('entfernt einen bestehenden Favoriten per Toggle', () => {
    const { toggleFavorit } = useFavoritenStore.getState()
    const fav = { typ: 'ort' as const, ziel: '/fragensammlung', label: 'Fragensammlung', sortierung: 0 }
    toggleFavorit(fav)
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    toggleFavorit(fav)
    expect(useFavoritenStore.getState().favoriten).toHaveLength(0)
  })

  it('sortiert Favoriten nach sortierung', () => {
    const { toggleFavorit } = useFavoritenStore.getState()
    toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A', sortierung: 2 })
    toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B', sortierung: 1 })
    const sorted = selectFavoritenSortiert(useFavoritenStore.getState())
    expect(sorted[0].label).toBe('B')
    expect(sorted[1].label).toBe('A')
  })

  it('aktualisiert Sortierung per updateSortierung', () => {
    const store = useFavoritenStore.getState()
    store.toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A', sortierung: 0 })
    store.toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B', sortierung: 1 })
    store.updateSortierung(['/b', '/a']) // neue Reihenfolge
    const sorted = useFavoritenStore.getState().favoritenSortiert
    expect(sorted[0].ziel).toBe('/b')
    expect(sorted[1].ziel).toBe('/a')
  })

  it('prüft istFavorit korrekt', () => {
    const store = useFavoritenStore.getState()
    store.toggleFavorit({ typ: 'pruefung', ziel: 'abc123', label: 'Test', sortierung: 0 })
    expect(store.istFavorit('abc123')).toBe(true)
    expect(store.istFavorit('xyz789')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npx vitest run src/store/favoritenStore.test.ts
```
Expected: FAIL (module not found)

- [ ] **Step 3: Implement favoritenStore**

```typescript
// src/store/favoritenStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Favorit {
  typ: 'ort' | 'pruefung' | 'uebung' | 'frage'
  ziel: string       // Route-Pfad oder Config-ID
  label: string
  icon?: string
  sortierung: number
}

// Selector (ausserhalb des Stores, für sortierte Ansicht):
export const selectFavoritenSortiert = (state: FavoritenStore) =>
  [...state.favoriten].sort((a, b) => a.sortierung - b.sortierung)

interface FavoritenStore {
  favoriten: Favorit[]
  
  // Actions
  toggleFavorit: (fav: Omit<Favorit, 'sortierung'> & { sortierung?: number }) => void
  istFavorit: (ziel: string) => boolean
  updateSortierung: (zielReihenfolge: string[]) => void
  reset: () => void
}

export const useFavoritenStore = create<FavoritenStore>()(
  persist(
    (set, get) => ({
      favoriten: [],
      
      toggleFavorit: (fav) => {
        const { favoriten } = get()
        const exists = favoriten.find(f => f.ziel === fav.ziel)
        if (exists) {
          set({ favoriten: favoriten.filter(f => f.ziel !== fav.ziel) })
        } else {
          const maxSort = favoriten.reduce((max, f) => Math.max(max, f.sortierung), -1)
          set({
            favoriten: [
              ...favoriten,
              { ...fav, sortierung: fav.sortierung ?? maxSort + 1 },
            ],
          })
        }
      },
      
      istFavorit: (ziel) => {
        return get().favoriten.some(f => f.ziel === ziel)
      },
      
      updateSortierung: (zielReihenfolge) => {
        const { favoriten } = get()
        const updated = favoriten.map(f => ({
          ...f,
          sortierung: zielReihenfolge.indexOf(f.ziel),
        }))
        set({ favoriten: updated })
      },
      
      reset: () => set({ favoriten: [] }),
    }),
    {
      name: 'examlab-favoriten',
    }
  )
)
```

- [ ] **Step 4: Run tests**
```bash
npx vitest run src/store/favoritenStore.test.ts
```
Expected: All pass

- [ ] **Step 5: Add migration for old AppOrt[] format**

Der alte localStorage-Key `'lp-favoriten'` enthält `AppOrt[]` mit Feldern `id`, `titel`, `screen`, `params: { configId, tab }`, `erstelltAm`. Der neue Store nutzt `Favorit[]` mit `typ`, `ziel`, `label`, `sortierung`. In `favoritenStore.ts` beim Initialisieren prüfen ob alte Daten vorliegen und migrieren:

```typescript
// In persist config, onRehydrateStorage:
onRehydrateStorage: () => (state) => {
  // Migration: alte AppOrt[] → Favorit[]
  const alteDaten = localStorage.getItem('lp-favoriten')
  if (alteDaten && state && state.favoriten.length === 0) {
    try {
      const alte = JSON.parse(alteDaten) as Array<{ titel: string; screen: string; params?: { configId: string } }>
      const migriert: Favorit[] = alte.map((a, i) => ({
        typ: a.params?.configId ? (a.screen as Favorit['typ']) : 'ort',
        ziel: a.params?.configId ?? `/${a.screen}`,
        label: a.titel,
        sortierung: i,
      }))
      state.favoriten = migriert
      localStorage.removeItem('lp-favoriten') // Alte Daten aufräumen
    } catch { /* ignorieren */ }
  }
}
```

- [ ] **Step 6: Remove favoriten code from lpNavigationStore**

Remove from `lpNavigationStore.ts`:
- `favoriten` state field
- `toggleFavorit`, `toggleFavoritById`, `istFavorit`, `favoritenSyncMitBackend`
- `AppOrt` interface
- localStorage key `'lp-favoriten'` persistence

Update all imports that used `useLPNavigationStore(s => s.favoriten)` to use `useFavoritenStore`.

- [ ] **Step 7: Verify tsc + tests + build**
```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 8: Commit**
```bash
git add -A
git commit -m "Phase 3.1: Extract favoritenStore with extended Favorit model + AppOrt migration"
```

---

### Task 3.2: Build Home dashboard component

**Files:**
- Create: `ExamLab/src/components/lp/Home.tsx`
- Create: `ExamLab/src/components/lp/Home.test.tsx`

- [ ] **Step 1: Write test for Home component**

```typescript
// src/components/lp/Home.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

// Mock stores
vi.mock('../../store/favoritenStore', () => ({
  useFavoritenStore: vi.fn(() => ({
    favoritenSortiert: [
      { typ: 'ort', ziel: '/fragensammlung', label: 'Fragensammlung', sortierung: 0 },
    ],
  })),
}))

describe('Home', () => {
  it('rendert die 5 Sektionen', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText('Favoriten')).toBeDefined()
    expect(screen.getByText('Offene Korrekturen')).toBeDefined()
    expect(screen.getByText('Anstehende Prüfungen')).toBeDefined()
    expect(screen.getByText('Letzte Prüfungen')).toBeDefined()
    expect(screen.getByText('Letzte Übungen')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npx vitest run src/components/lp/Home.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement Home component**

**Wichtig:** Es gibt keinen `usePruefungConfigStore`. Configs werden aktuell direkt in `LPStartseite.tsx` per API geladen (lokaler `configs` State, Zeile 64). Für die Home-Seite muss die Config-Lade-Logik zuerst in einen shared Hook extrahiert werden (z.B. `useConfigs()` in `src/hooks/useConfigs.ts`), damit Home und LPStartseite dieselben Daten teilen, ohne sie doppelt zu laden.

Build `Home.tsx` with 5 sections. Favoriten section uses `selectFavoritenSortiert(useFavoritenStore())`. Other sections use den neuen `useConfigs()` Hook to derive:
- **Offene Korrekturen:** configs where status = 'abgeschlossen' and not all corrections done
- **Anstehende Prüfungen:** configs where datum > today
- **Letzte Prüfungen/Übungen:** configs sorted by datum descending, limit 5

Each section item links via `<Link to={...}>` from react-router-dom.

Keep the component under 300 lines. If sections are complex, extract to sub-components (`HomeFavoriten.tsx`, `HomeOffeneKorrekturen.tsx`, etc.).

- [ ] **Step 4: Run tests**
```bash
npx vitest run src/components/lp/Home.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "Phase 3.2: Home dashboard with Favoriten, offene Korrekturen, anstehende/letzte Prüfungen/Übungen"
```

---

### Task 3.3: Add Favoriten-Tab to Einstellungen

**Files:**
- Create: `ExamLab/src/components/settings/FavoritenTab.tsx`
- Modify: `ExamLab/src/components/settings/EinstellungenPanel.tsx` (add tab)
- Modify: `ExamLab/src/store/lpNavigationStore.ts` (add `'favoriten'` to `EinstellungenTab` type + `gueltigesTabs` validation)

- [ ] **Step 1: Implement FavoritenTab with DnD sorting**

Uses `@dnd-kit/core` + `@dnd-kit/sortable` (already installed) for drag & drop reordering. Shows:
- All current favoriten as sortable list items
- Dropdown to add App-Orte (predefined list of all routes)
- ✕ button to remove items

```typescript
// src/components/settings/FavoritenTab.tsx
import { useFavoritenStore } from '../../store/favoritenStore'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
// ... implementation
```

- [ ] **Step 2: Add 'favoriten' tab to EinstellungenPanel**

Add to the existing `EinstellungenTab` type: `'profil' | 'lernziele' | 'favoriten' | 'admin'`

Add a new tab button in the tab bar and render `<FavoritenTab />` when selected.

If the URL is `/einstellungen/favoriten`, read `tab` from `useParams()`.

- [ ] **Step 3: Verify tsc + tests + build**
```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "Phase 3.3: FavoritenTab in Einstellungen with @dnd-kit drag & drop sorting"
```

---

## Phase 4: SuS-Üben Route Migration

### Task 4.1: Replace useUebenNavigationStore with SuS routes

**Files:**
- Modify: `ExamLab/src/router/SuSRoutes.tsx`
- Modify: `ExamLab/src/AppUeben.tsx`
- Modify: `ExamLab/src/store/ueben/navigationStore.ts`

- [ ] **Step 1: Update SuSRoutes with actual components**

```typescript
// src/router/SuSRoutes.tsx — updated
<Routes>
  <Route path="/" element={<SuSStartseite />} />
  <Route path="ueben" element={<UebenDashboard />} />
  <Route path="ueben/:themaId" element={<UebungsSession />} />
  <Route path="ueben/ergebnis" element={<Zusammenfassung />} />
  <Route path="pruefung" element={<PruefungsFlow />} />
  <Route path="korrektur/:pruefungId" element={<KorrekturEinsicht />} />
  <Route path="*" element={<Navigate to="/sus" replace />} />
</Routes>
```

- [ ] **Step 2: Replace screen-based navigation in AppUeben with useNavigate**

Current: `navigiere('dashboard')` → In-memory state change
New: `navigate('/sus/ueben')` → URL change

Create a `useSuSNavigation()` hook similar to `useLPNavigation()`.

- [ ] **Step 3: Remove or minimize useUebenNavigationStore**

Keep only state that's not URL-representable (like `deepLinkThema` which is transient).

- [ ] **Step 4: Verify tsc + tests + build**
```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "Phase 4.1: SuS-Üben routes replace useUebenNavigationStore screen-based navigation"
```

---

## Phase 5: Cleanup

### Task 5.1: Rename lpNavigationStore to lpUIStore

**Files:**
- Rename: `src/store/lpNavigationStore.ts` → `src/store/lpUIStore.ts`
- Modify: All files importing from lpNavigationStore

- [ ] **Step 1: Rename file and update imports**

```bash
grep -rn "lpNavigationStore" src/ --include="*.ts" --include="*.tsx" | wc -l
```

Rename file, update all imports. The store should now contain ONLY:
- `zeigHilfe` (overlay state)
- `composerKey` (force re-mount)
- `ansichtHistory` (if still needed for nested navigation)
- Any filter/sort state that's transient

- [ ] **Step 2: Verify tsc + tests + build**
```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "Phase 5.1: Rename lpNavigationStore to lpUIStore (UI-only state)"
```

---

### Task 5.2: Remove old ?ids= logic and clean up App.tsx

**Files:**
- Modify: `ExamLab/src/App.tsx`

- [ ] **Step 1: Remove ?ids= handling from App.tsx**

The `pruefungIdsAusUrl` parsing and the conditional `MultiDurchfuehrenDashboard` render can be removed — this is now at `/pruefung/monitoring`.

- [ ] **Step 2: Clean up App.tsx**

After Router handles role-based routing, App.tsx can be significantly simplified. It should only handle:
- `?id=` for SuS exam loading
- `?reset=true` emergency cleanup
- `?demo=` mode

- [ ] **Step 3: Verify tsc + tests + build**
```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "Phase 5.2: Remove ?ids= legacy flow, simplify App.tsx"
```

---

### Task 5.3: Add route navigation tests

**Files:**
- Create: `ExamLab/src/router/Router.test.tsx`

- [ ] **Step 1: Write route tests**

```typescript
// src/router/Router.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

describe('Routing', () => {
  it('redirects unauthenticated users to /login', () => {
    // Mock authStore with null user
    render(
      <MemoryRouter initialEntries={['/pruefung']}>
        <AppRouter />
      </MemoryRouter>
    )
    // Expect redirect to /login with returnTo
  })

  it('redirects LP from SuS routes to /home', () => {
    // Mock authStore with LP user
    // Navigate to /sus
    // Expect redirect to /home
  })

  it('redirects SuS from LP routes to /sus', () => {
    // Mock authStore with SuS user
    // Navigate to /pruefung
    // Expect redirect to /sus
  })

  it('handles hash migration', () => {
    // Set window.location.hash = '#/pruefung/abc'
    // Expect replaceState to /pruefung/abc
  })
})
```

- [ ] **Step 2: Run tests**
```bash
npx vitest run src/router/Router.test.tsx
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "Phase 5.3: Route navigation tests (auth guard, role mismatch, hash migration)"
```

---

### Task 5.4: Update HANDOFF.md and final verification

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: Update HANDOFF.md with new session entry**

Document:
- React Router migration complete
- New route structure
- Home dashboard added
- Favoriten-System extended
- Files changed
- Breaking changes (old hash URLs redirect automatically)

- [ ] **Step 2: Full verification**
```bash
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 3: Browser test with `npm run preview`**

Test plan:
- [ ] Load `/` → redirects to `/home` (LP) or `/sus` (SuS)
- [ ] Load `/pruefung` → Prüfungsliste
- [ ] Load `/pruefung/tracker` → Tracker (not caught by `:configId`)
- [ ] Load `/home` → Home dashboard with 5 sections
- [ ] Load `/einstellungen/favoriten` → Favoriten-Tab
- [ ] Click Favorit → navigiert zum Ziel
- [ ] Browser Back/Forward → works correctly
- [ ] Bookmark `/pruefung/abc123` → works after refresh (404.html trick)
- [ ] Old hash bookmark `#/pruefung` → migrated to `/pruefung`
- [ ] Unknown URL `/xyz` → redirects to `/home`
- [ ] Light/Dark Mode → both work

- [ ] **Step 4: Final commit**
```bash
git add -A
git commit -m "Phase 5.4: HANDOFF.md update, A1 Deep Links + Home complete"
```

- [ ] **Step 5: Ready for LP-Test + Merge**

Melde dem User: Bereit für Browser-Test und LP-Freigabe.
