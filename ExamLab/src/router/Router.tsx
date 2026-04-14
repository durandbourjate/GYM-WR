import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { migrateHashBookmarks } from './hashMigration'
import { lazy, Suspense } from 'react'

// Bestehende Komponenten (alle haben default export)
const App = lazy(() => import('../App'))
const LoginScreen = lazy(() => import('../components/LoginScreen'))
const LPStartseite = lazy(() => import('../components/lp/LPStartseite'))
const Favoriten = lazy(() => import('../components/lp/Favoriten'))

const basePath = import.meta.env.BASE_URL

// Hash-Migration einmalig beim Laden (alte #/... Lesezeichen → /...)
migrateHashBookmarks(basePath)

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <p className="text-slate-500 dark:text-slate-400">Wird geladen...</p>
    </div>
  )
}

/**
 * Root-Redirect: Leitet je nach Rolle auf die richtige Startseite um.
 */
function RootRedirect() {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.rolle === 'lp' ? '/favoriten' : '/sus'} replace />
}

/**
 * LP-Guard: Prüft ob eingeloggt und LP-Rolle. Sonst Redirect.
 */
function LPGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) {
    // returnTo für Deep Links wird in LoginScreen gelesen
    return <Navigate to="/login" replace />
  }
  if (user.rolle !== 'lp') {
    return <Navigate to="/sus" replace />
  }
  return <>{children}</>
}

/**
 * SuS-Flow: Rendert App.tsx (enthält die komplette Prüfungs/Übungs-Logik).
 * App.tsx liest ?id= und ?ids= intern und entscheidet was gezeigt wird.
 */
function SuSFlow() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  )
}

/**
 * LP-Flow: Rendert LPStartseite mit URL-Sync.
 */
function LPFlow() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LPStartseite />
    </Suspense>
  )
}

/**
 * Home-Flow: Rendert Home-Dashboard.
 */
function FavoritenFlow() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Favoriten />
    </Suspense>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        {/* Root → Redirect basiert auf Rolle */}
        <Route path="/" element={<RootRedirect />} />

        {/* Login */}
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <LoginScreen />
          </Suspense>
        } />

        {/* LP-Bereich: Alle Routes rendern LPStartseite (mit URL-Sync) */}
        <Route path="/favoriten" element={<LPGuard><FavoritenFlow /></LPGuard>} />
        <Route path="/pruefung" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/pruefung/tracker" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/pruefung/monitoring" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/pruefung/:configId" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/pruefung/:configId/korrektur" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/pruefung/:configId/monitoring" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/uebung" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/uebung/durchfuehren" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/uebung/analyse" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/uebung/:configId" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/fragensammlung" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/fragensammlung/:frageId" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/einstellungen" element={<LPGuard><LPFlow /></LPGuard>} />
        <Route path="/einstellungen/:tab" element={<LPGuard><LPFlow /></LPGuard>} />

        {/* SuS-Bereich: Spezifische Routes für Deep Links + Browser-History */}
        <Route path="/sus" element={<SuSFlow />} />
        <Route path="/sus/ueben" element={<SuSFlow />} />
        <Route path="/sus/ueben/ergebnis" element={<SuSFlow />} />
        <Route path="/sus/ueben/:themaId" element={<SuSFlow />} />
        <Route path="/sus/pruefen" element={<SuSFlow />} />
        <Route path="/sus/pruefung" element={<SuSFlow />} />
        <Route path="/sus/korrektur/:pruefungId" element={<SuSFlow />} />
        <Route path="/sus/admin" element={<SuSFlow />} />
        <Route path="/sus/gruppen" element={<SuSFlow />} />

        {/* Catch-all → Root-Redirect */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
