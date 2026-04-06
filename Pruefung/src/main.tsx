import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx'

// Unified Build: Immer App.tsx laden (enthält Rollen-basiertes Routing für LP + SuS)
const AppComponent = lazy(() => import('./App'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <p className="text-slate-500">Wird geladen...</p>
        </div>
      }>
        <AppComponent />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
