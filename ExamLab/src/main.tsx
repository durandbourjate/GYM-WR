import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AppRouter } from './router/Router.tsx'
import { ToastContainer } from '@gymhofwil/shared'

// SPA-Redirect-Decode (GitHub-Pages-404.html → BrowserRouter). Vormals Inline-<script>
// in index.html; ins gebündelte Entry-Modul gezogen, damit die CSP kein 'unsafe-inline'
// in script-src mehr braucht. Läuft vor createRoot().render(), also bevor der Router die
// URL liest → die korrigierte Route ist beim ersten Render bereits gesetzt.
{
  const params = new URLSearchParams(window.location.search)
  const p = params.get('p')
  if (p) {
    const base = window.location.pathname
    const route = decodeURIComponent(p)
    // Route an Base-Path anhängen (ohne doppelten Slash)
    const fullPath = base.replace(/\/$/, '') + route
    const q = params.get('q')
    const search = q ? '?' + decodeURIComponent(q) : ''
    window.history.replaceState(null, '', fullPath + search + window.location.hash)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
      <ToastContainer />
    </ErrorBoundary>
  </StrictMode>,
)
