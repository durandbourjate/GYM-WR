# Lernplattform Phase 1: Grundgerüst + Auth + Gruppen

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lauffähige React-App mit Google OAuth Login, Gruppen-System und Basis-Routing — die Fundamente für alle weiteren Phasen.

**Architecture:** Neue React-App `Lernplattform/` im bestehenden Monorepo. Auth-Code wird aus Prüfungstool portiert (nicht importiert — eigene Kopie, da Rollen-Logik anders). Apps Script Backend wird um Gruppen-Endpoints erweitert. Service-Layer mit austauschbarem Adapter-Pattern.

**Tech Stack:** React 19.2 + TypeScript 5.9 + Vite 7.3 + Zustand 5.0 + Tailwind CSS 4.2 + Vitest

**Spec:** `docs/superpowers/specs/2026-04-02-lernplattform-design.md`

**Branch:** `feature/lernplattform-phase1`

---

## Dateistruktur (Phase 1)

```
Lernplattform/
├── index.html                      # HTML-Shell + Google OAuth Script + CSP
├── package.json                    # Dependencies (subset von Pruefung)
├── tsconfig.json                   # TypeScript config
├── tsconfig.app.json               # App-spezifische TS config
├── vite.config.ts                  # Vite + Tailwind + PWA
├── .env.example                    # Env-Var Dokumentation
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    # React-Einstiegspunkt
│   ├── App.tsx                     # Router + Auth-Guard
│   ├── index.css                   # Tailwind imports
│   ├── types/
│   │   ├── auth.ts                 # AuthUser, Rolle, GooglePayload
│   │   └── gruppen.ts              # Gruppe, Mitglied
│   ├── services/
│   │   ├── interfaces.ts           # Alle Service-Interfaces (Backend-agnostisch)
│   │   ├── authService.ts          # Google OAuth Init + JWT Decode
│   │   └── apiClient.ts            # HTTP-Kommunikation mit Apps Script
│   ├── adapters/
│   │   └── appsScriptAdapter.ts    # Apps-Script-Implementation der Interfaces
│   ├── store/
│   │   ├── authStore.ts            # Zustand Store: Auth-State + Login/Logout
│   │   └── gruppenStore.ts         # Zustand Store: Gruppen + aktive Gruppe
│   ├── components/
│   │   ├── LoginScreen.tsx         # Google-Button + Code-Login
│   │   ├── Dashboard.tsx           # Platzhalter (Phase 2 füllt)
│   │   ├── GruppenAuswahl.tsx      # Gruppe wählen (wenn >1)
│   │   └── AdminLayout.tsx         # Admin-Shell (Platzhalter)
│   └── __tests__/
│       ├── authStore.test.ts       # Auth-Logik Tests
│       ├── gruppenStore.test.ts    # Gruppen-Logik Tests
│       └── apiClient.test.ts       # API-Client Tests
└── vitest.config.ts                # Test-Config
```

---

## Task 1: Projekt-Scaffolding

**Files:**
- Create: `Lernplattform/package.json`
- Create: `Lernplattform/tsconfig.json`
- Create: `Lernplattform/tsconfig.app.json`
- Create: `Lernplattform/vite.config.ts`
- Create: `Lernplattform/vitest.config.ts`
- Create: `Lernplattform/index.html`
- Create: `Lernplattform/.env.example`
- Create: `Lernplattform/src/main.tsx`
- Create: `Lernplattform/src/index.css`
- Create: `Lernplattform/src/App.tsx`
- Create: `Lernplattform/public/favicon.svg`

- [ ] **Step 1: package.json erstellen**

```json
{
  "name": "lernplattform",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.1.4",
    "jsdom": "^29.0.1",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 2: TypeScript configs erstellen**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsBuildInfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Vite config erstellen**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/GYM-WR-DUY/Lernplattform/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 4: index.html erstellen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://accounts.google.com https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://accounts.google.com;
    connect-src 'self' https://script.google.com https://script.googleusercontent.com https://accounts.google.com;
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    frame-src 'self' https://accounts.google.com;
  " />
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
  <title>Lernplattform</title>
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5: Einstiegsdateien erstellen**

`src/index.css`:
```css
@import "tailwindcss";
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx` (Platzhalter):
```tsx
export default function App() {
  return <div className="p-8 text-xl">Lernplattform — Phase 1</div>
}
```

`.env.example`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
VITE_BASE_PATH=/GYM-WR-DUY/Lernplattform/
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">📚</text></svg>
```

- [ ] **Step 6: npm install + verify build**

```bash
cd Lernplattform && npm install && npx tsc -b && npm run build
```

Expected: Build succeeds, `dist/` created.

- [ ] **Step 7: Commit**

```bash
git add Lernplattform/
git commit -m "Lernplattform Phase 1: Projekt-Scaffolding (React 19 + Vite + Tailwind)"
```

---

## Task 2: TypeScript-Typen

**Files:**
- Create: `Lernplattform/src/types/auth.ts`
- Create: `Lernplattform/src/types/gruppen.ts`

- [ ] **Step 1: Auth-Typen definieren**

`src/types/auth.ts`:
```typescript
export type Rolle = 'admin' | 'lernend' | 'unbekannt'

export interface AuthUser {
  email: string
  name: string
  vorname: string
  nachname: string
  bild?: string
  rolle: Rolle
  sessionToken?: string
  loginMethode: 'google' | 'code'
}

export interface GooglePayload {
  email: string
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}

export interface CodeLoginResponse {
  erfolg: boolean
  email?: string
  name?: string
  fehler?: string
}
```

- [ ] **Step 2: Gruppen-Typen definieren**

`src/types/gruppen.ts`:
```typescript
export interface Gruppe {
  id: string
  name: string
  typ: 'privat' | 'schule'
  adminEmail: string
  fragebankSheetId: string
  analytikSheetId: string
  mitglieder: string[]           // E-Mail-Adressen (aus Registry, on-demand aktualisiert)
}

export interface Mitglied {
  email: string
  name: string
  rolle: 'admin' | 'lernend'
  code?: string
  beigetreten: string
}
```

- [ ] **Step 3: tsc prüfen**

```bash
cd Lernplattform && npx tsc -b
```

Expected: Keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/src/types/
git commit -m "Lernplattform Phase 1: Auth- und Gruppen-Typen"
```

---

## Task 3: Service-Interfaces + API-Client

**Files:**
- Create: `Lernplattform/src/services/interfaces.ts`
- Create: `Lernplattform/src/services/apiClient.ts`
- Create: `Lernplattform/src/__tests__/apiClient.test.ts`

- [ ] **Step 1: Service-Interfaces definieren**

`src/services/interfaces.ts`:
```typescript
import type { AuthUser, GooglePayload, CodeLoginResponse } from '../types/auth'
import type { Gruppe, Mitglied } from '../types/gruppen'

export interface AuthServiceInterface {
  initializeGoogleAuth(onSuccess: (payload: GooglePayload) => void, onError: (error: string) => void): void
  renderGoogleButton(element: HTMLElement): void
  revokeGoogleAuth(email: string): Promise<void>
  decodeJwt(token: string): GooglePayload | null
}

export interface GruppenService {
  ladeGruppen(email: string): Promise<Gruppe[]>
  erstelleGruppe(gruppe: Omit<Gruppe, 'fragebankSheetId' | 'analytikSheetId'>): Promise<Gruppe>
  ladeMitglieder(gruppeId: string): Promise<Mitglied[]>
  einladen(gruppeId: string, email: string, name: string): Promise<void>
  entfernen(gruppeId: string, email: string): Promise<void>
  generiereCode(gruppeId: string, email: string): Promise<string>
  validiereCode(code: string): Promise<CodeLoginResponse>
}

export interface SessionService {
  generiereSessionToken(email: string): Promise<string>
  validiereSessionToken(token: string, email: string): Promise<boolean>
}
```

- [ ] **Step 2: Test für apiClient schreiben**

`src/__tests__/apiClient.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClient } from '../services/apiClient'

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient('https://fake-script.google.com/exec')
    global.fetch = vi.fn()
  })

  it('sendet POST mit action und sessionToken', async () => {
    const mockResponse = { success: true, data: { id: '123' } }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await client.post('ladeGruppen', { email: 'test@gmail.com' }, 'token-123')

    expect(fetch).toHaveBeenCalledWith(
      'https://fake-script.google.com/exec',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'ladeGruppen',
          sessionToken: 'token-123',
          email: 'test@gmail.com',
        }),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('gibt null zurück bei Netzwerkfehler', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const result = await client.post('ladeGruppen', { email: 'test@gmail.com' })

    expect(result).toBeNull()
  })

  it('gibt null zurück bei Timeout', async () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})) // never resolves

    const result = await client.post('test', {}, undefined, 50) // 50ms timeout

    expect(result).toBeNull()
  })

  it('serialisiert Write-Requests in Queue', async () => {
    const callOrder: number[] = []
    let callCount = 0

    vi.mocked(fetch).mockImplementation(async () => {
      const myCall = ++callCount
      await new Promise(r => setTimeout(r, 10))
      callOrder.push(myCall)
      return { ok: true, json: () => Promise.resolve({ success: true }) } as Response
    })

    const p1 = client.postQueued('action1', {})
    const p2 = client.postQueued('action2', {})

    await Promise.all([p1, p2])

    expect(callOrder).toEqual([1, 2]) // Sequentiell, nicht parallel
  })
})
```

- [ ] **Step 3: Test ausführen — muss fehlschlagen**

```bash
cd Lernplattform && npx vitest run src/__tests__/apiClient.test.ts
```

Expected: FAIL — `ApiClient` nicht gefunden.

- [ ] **Step 4: apiClient implementieren**

`src/services/apiClient.ts`:
```typescript
export class ApiClient {
  private url: string
  private writeQueue: Promise<unknown> = Promise.resolve()

  constructor(url: string) {
    this.url = url
  }

  istKonfiguriert(): boolean {
    return !!this.url
  }

  async post<T = unknown>(
    action: string,
    payload: Record<string, unknown>,
    sessionToken?: string,
    timeoutMs = 30000
  ): Promise<T | null> {
    if (!this.url) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const body = JSON.stringify({
        action,
        ...(sessionToken ? { sessionToken } : {}),
        ...payload,
      })

      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body,
        signal: controller.signal,
      })

      if (!response.ok) return null
      return await response.json() as T
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  async postQueued<T = unknown>(
    action: string,
    payload: Record<string, unknown>,
    sessionToken?: string,
    timeoutMs = 30000
  ): Promise<T | null> {
    const result = new Promise<T | null>((resolve) => {
      this.writeQueue = this.writeQueue.then(async () => {
        const res = await this.post<T>(action, payload, sessionToken, timeoutMs)
        resolve(res)
      }).catch(() => {
        resolve(null)
      })
    })
    return result
  }

  async get<T = unknown>(
    action: string,
    params: Record<string, string>,
    sessionToken?: string,
    timeoutMs = 30000
  ): Promise<T | null> {
    if (!this.url) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const urlParams = new URLSearchParams({ action, ...params })
      if (sessionToken) urlParams.set('sessionToken', sessionToken)

      const response = await fetch(`${this.url}?${urlParams}`, {
        signal: controller.signal,
      })

      if (!response.ok) return null
      return await response.json() as T
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}

// Singleton-Instanz
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''
export const apiClient = new ApiClient(APPS_SCRIPT_URL)
```

- [ ] **Step 5: Tests ausführen — müssen grün sein**

```bash
cd Lernplattform && npx vitest run src/__tests__/apiClient.test.ts
```

Expected: 4 Tests PASS.

- [ ] **Step 6: tsc prüfen**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 7: Commit**

```bash
git add Lernplattform/src/services/ Lernplattform/src/__tests__/apiClient.test.ts
git commit -m "Lernplattform Phase 1: Service-Interfaces + API-Client mit Tests"
```

---

## Task 4: Auth-Service + Auth-Store

**Files:**
- Create: `Lernplattform/src/services/authService.ts`
- Create: `Lernplattform/src/store/authStore.ts`
- Create: `Lernplattform/src/__tests__/authStore.test.ts`

- [ ] **Step 1: authService erstellen**

`src/services/authService.ts`:
```typescript
import type { GooglePayload } from '../types/auth'

export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
          revoke: (email: string, callback: () => void) => void
        }
      }
    }
  }
}

export function initializeGoogleAuth(
  onSuccess: (payload: GooglePayload) => void,
  onError: (error: string) => void
): void {
  if (!window.google?.accounts?.id) {
    onError('Google Identity Services nicht geladen')
    return
  }
  if (!CLIENT_ID) {
    onError('VITE_GOOGLE_CLIENT_ID nicht konfiguriert')
    return
  }

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response: { credential?: string }) => {
      if (!response.credential) {
        onError('Kein Credential erhalten')
        return
      }
      const payload = decodeJwt(response.credential)
      if (!payload) {
        onError('JWT konnte nicht dekodiert werden')
        return
      }
      onSuccess(payload)
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  })
}

export function renderGoogleButton(element: HTMLElement): void {
  if (!window.google?.accounts?.id) return

  window.google.accounts.id.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    width: 320,
    locale: 'de',
  })
}

export function revokeGoogleAuth(email: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.google?.accounts?.id) {
      resolve()
      return
    }
    window.google.accounts.id.revoke(email, () => resolve())
  })
}

export function decodeJwt(token: string): GooglePayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return {
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
    }
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Test für authStore schreiben**

`src/__tests__/authStore.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock apiClient vor dem Import
vi.mock('../services/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    istKonfiguriert: () => true,
  },
}))

import { useAuthStore } from '../store/authStore'
import { apiClient } from '../services/apiClient'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      istAngemeldet: false,
      ladeStatus: 'idle',
      fehler: null,
    })
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('hat initialen Zustand', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.istAngemeldet).toBe(false)
    expect(state.ladeStatus).toBe('idle')
  })

  it('meldet User per Google OAuth an', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { sessionToken: 'tok-123' },
    })

    await useAuthStore.getState().anmeldenMitGoogle({
      email: 'kind@gmail.com',
      name: 'Test Kind',
      given_name: 'Test',
      family_name: 'Kind',
      picture: 'https://example.com/pic.jpg',
    })

    const state = useAuthStore.getState()
    expect(state.istAngemeldet).toBe(true)
    expect(state.user?.email).toBe('kind@gmail.com')
    expect(state.user?.rolle).toBe('lernend') // Default für unbekannte Domain
    expect(state.user?.sessionToken).toBe('tok-123')
  })

  it('erkennt Admin-Rolle wenn Backend bestätigt', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        success: true,
        data: { sessionToken: 'tok-456' },
      })

    // Admin wird über Gruppen-Zugehörigkeit bestimmt, nicht Domain
    await useAuthStore.getState().anmeldenMitGoogle({
      email: 'papa@gmail.com',
      name: 'Papa Test',
      given_name: 'Papa',
      family_name: 'Test',
    })

    const state = useAuthStore.getState()
    expect(state.istAngemeldet).toBe(true)
    // Rolle wird erst nach Gruppen-Laden bestimmt (in Phase 1: default lernend)
    expect(state.user?.rolle).toBe('lernend')
  })

  it('speichert Session in localStorage', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { sessionToken: 'tok-789' },
    })

    await useAuthStore.getState().anmeldenMitGoogle({
      email: 'kind@gmail.com',
      name: 'Test Kind',
      given_name: 'Test',
      family_name: 'Kind',
    })

    const stored = localStorage.getItem('lernplattform-auth')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.email).toBe('kind@gmail.com')
  })

  it('stellt Session aus localStorage wieder her', async () => {
    const storedUser = {
      email: 'kind@gmail.com',
      name: 'Test Kind',
      vorname: 'Test',
      nachname: 'Kind',
      rolle: 'lernend',
      sessionToken: 'tok-stored',
      loginMethode: 'google',
    }
    localStorage.setItem('lernplattform-auth', JSON.stringify(storedUser))

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { gueltig: true },
    })

    await useAuthStore.getState().sessionWiederherstellen()

    const state = useAuthStore.getState()
    expect(state.istAngemeldet).toBe(true)
    expect(state.user?.email).toBe('kind@gmail.com')
  })

  it('verwirft ungültige Session', async () => {
    localStorage.setItem('lernplattform-auth', JSON.stringify({
      email: 'kind@gmail.com',
      sessionToken: 'abgelaufen',
    }))

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { gueltig: false },
    })

    await useAuthStore.getState().sessionWiederherstellen()

    const state = useAuthStore.getState()
    expect(state.istAngemeldet).toBe(false)
    expect(localStorage.getItem('lernplattform-auth')).toBeNull()
  })

  it('meldet User ab und räumt auf', () => {
    useAuthStore.setState({
      user: { email: 'kind@gmail.com', name: 'Test', vorname: 'Test', nachname: 'Kind', rolle: 'lernend', loginMethode: 'google' },
      istAngemeldet: true,
    })
    localStorage.setItem('lernplattform-auth', '{}')

    useAuthStore.getState().abmelden()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.istAngemeldet).toBe(false)
    expect(localStorage.getItem('lernplattform-auth')).toBeNull()
  })
})
```

- [ ] **Step 3: Test ausführen — muss fehlschlagen**

```bash
cd Lernplattform && npx vitest run src/__tests__/authStore.test.ts
```

Expected: FAIL — `useAuthStore` nicht gefunden.

- [ ] **Step 4: authStore implementieren**

`src/store/authStore.ts`:
```typescript
import { create } from 'zustand'
import type { AuthUser, GooglePayload, Rolle } from '../types/auth'
import { apiClient } from '../services/apiClient'

const STORAGE_KEY = 'lernplattform-auth'

interface AuthState {
  user: AuthUser | null
  istAngemeldet: boolean
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  fehler: string | null

  anmeldenMitGoogle: (payload: GooglePayload) => Promise<void>
  anmeldenMitCode: (code: string) => Promise<void>
  sessionWiederherstellen: () => Promise<void>
  abmelden: () => void
  setzeRolle: (rolle: Rolle) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  istAngemeldet: false,
  ladeStatus: 'idle',
  fehler: null,

  anmeldenMitGoogle: async (payload: GooglePayload) => {
    set({ ladeStatus: 'laden', fehler: null })

    try {
      // Session-Token vom Backend holen
      const response = await apiClient.post<{ success: boolean; data: { sessionToken: string } }>(
        'lernplattformLogin',
        { email: payload.email, name: payload.name }
      )

      const sessionToken = response?.data?.sessionToken || undefined

      const user: AuthUser = {
        email: payload.email,
        name: payload.name || payload.email,
        vorname: payload.given_name || '',
        nachname: payload.family_name || '',
        bild: payload.picture,
        rolle: 'lernend', // Default — wird nach Gruppen-Laden aktualisiert
        sessionToken,
        loginMethode: 'google',
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      set({ user, istAngemeldet: true, ladeStatus: 'fertig' })
    } catch {
      set({ ladeStatus: 'fehler', fehler: 'Anmeldung fehlgeschlagen' })
    }
  },

  anmeldenMitCode: async (code: string) => {
    set({ ladeStatus: 'laden', fehler: null })

    try {
      const response = await apiClient.post<{
        success: boolean
        data: { email: string; name: string; sessionToken: string }
        error?: string
      }>('lernplattformCodeLogin', { code })

      if (!response?.success || !response.data) {
        set({ ladeStatus: 'fehler', fehler: response?.error || 'Ungültiger Code' })
        return
      }

      const { email, name, sessionToken } = response.data
      const user: AuthUser = {
        email,
        name,
        vorname: name.split(' ')[0] || '',
        nachname: name.split(' ').slice(1).join(' ') || '',
        rolle: 'lernend',
        sessionToken,
        loginMethode: 'code',
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      set({ user, istAngemeldet: true, ladeStatus: 'fertig' })
    } catch {
      set({ ladeStatus: 'fehler', fehler: 'Code-Login fehlgeschlagen' })
    }
  },

  sessionWiederherstellen: async () => {
    const gespeichert = localStorage.getItem(STORAGE_KEY)
    if (!gespeichert) return

    try {
      const user = JSON.parse(gespeichert) as AuthUser
      if (!user.email || !user.sessionToken) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }

      // Token beim Backend validieren
      const response = await apiClient.post<{ success: boolean; data: { gueltig: boolean } }>(
        'lernplattformValidiereToken',
        { email: user.email, sessionToken: user.sessionToken }
      )

      if (response?.data?.gueltig) {
        set({ user, istAngemeldet: true, ladeStatus: 'fertig' })
      } else {
        localStorage.removeItem(STORAGE_KEY)
        set({ user: null, istAngemeldet: false })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  abmelden: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null, istAngemeldet: false, ladeStatus: 'idle', fehler: null })
  },

  setzeRolle: (rolle: Rolle) => {
    const user = get().user
    if (!user) return
    const aktualisiert = { ...user, rolle }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aktualisiert))
    set({ user: aktualisiert })
  },
}))
```

- [ ] **Step 5: Tests ausführen — müssen grün sein**

```bash
cd Lernplattform && npx vitest run src/__tests__/authStore.test.ts
```

Expected: 6 Tests PASS.

- [ ] **Step 6: tsc prüfen**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 7: Commit**

```bash
git add Lernplattform/src/services/authService.ts Lernplattform/src/store/authStore.ts Lernplattform/src/__tests__/authStore.test.ts
git commit -m "Lernplattform Phase 1: Auth-Service + Auth-Store mit Tests"
```

---

## Task 5: Gruppen-Store + Adapter

**Files:**
- Create: `Lernplattform/src/adapters/appsScriptAdapter.ts`
- Create: `Lernplattform/src/store/gruppenStore.ts`
- Create: `Lernplattform/src/__tests__/gruppenStore.test.ts`

- [ ] **Step 1: Test für gruppenStore schreiben**

`src/__tests__/gruppenStore.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adapters/appsScriptAdapter', () => ({
  gruppenAdapter: {
    ladeGruppen: vi.fn(),
    ladeMitglieder: vi.fn(),
    erstelleGruppe: vi.fn(),
    einladen: vi.fn(),
    generiereCode: vi.fn(),
  },
}))

import { useGruppenStore } from '../store/gruppenStore'
import { gruppenAdapter } from '../adapters/appsScriptAdapter'
import type { Gruppe } from '../types/gruppen'

const testGruppe: Gruppe = {
  id: 'familie-test',
  name: 'Familie Test',
  typ: 'privat',
  adminEmail: 'papa@gmail.com',
  fragebankSheetId: 'sheet-1',
  analytikSheetId: 'sheet-2',
  mitglieder: ['papa@gmail.com', 'kind@gmail.com'],
}

describe('gruppenStore', () => {
  beforeEach(() => {
    useGruppenStore.setState({
      gruppen: [],
      aktiveGruppe: null,
      mitglieder: [],
      ladeStatus: 'idle',
    })
    vi.clearAllMocks()
  })

  it('lädt Gruppen für E-Mail', async () => {
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')

    const state = useGruppenStore.getState()
    expect(state.gruppen).toHaveLength(1)
    expect(state.gruppen[0].id).toBe('familie-test')
  })

  it('setzt aktive Gruppe automatisch wenn nur eine vorhanden', async () => {
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')

    expect(useGruppenStore.getState().aktiveGruppe?.id).toBe('familie-test')
  })

  it('setzt aktive Gruppe NICHT automatisch wenn mehrere vorhanden', async () => {
    const zweiteGruppe: Gruppe = { ...testGruppe, id: 'schule-test', name: 'Schule' }
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe, zweiteGruppe])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')

    expect(useGruppenStore.getState().aktiveGruppe).toBeNull()
  })

  it('wechselt aktive Gruppe', async () => {
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe])
    vi.mocked(gruppenAdapter.ladeMitglieder).mockResolvedValue([
      { email: 'kind@gmail.com', name: 'Kind', rolle: 'lernend', beigetreten: '2026-04-02' },
    ])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')
    await useGruppenStore.getState().waehleGruppe('familie-test')

    const state = useGruppenStore.getState()
    expect(state.aktiveGruppe?.id).toBe('familie-test')
    expect(state.mitglieder).toHaveLength(1)
  })

  it('erkennt Admin-Rolle aus Gruppen-Daten', () => {
    useGruppenStore.setState({ aktiveGruppe: testGruppe })

    const istAdmin = useGruppenStore.getState().istAdmin('papa@gmail.com')
    const istNichtAdmin = useGruppenStore.getState().istAdmin('kind@gmail.com')

    expect(istAdmin).toBe(true)
    expect(istNichtAdmin).toBe(false)
  })
})
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

```bash
cd Lernplattform && npx vitest run src/__tests__/gruppenStore.test.ts
```

Expected: FAIL.

- [ ] **Step 3: appsScriptAdapter implementieren**

`src/adapters/appsScriptAdapter.ts`:
```typescript
import { apiClient } from '../services/apiClient'
import type { Gruppe, Mitglied } from '../types/gruppen'
import type { GruppenService } from '../services/interfaces'

class AppsScriptGruppenAdapter implements GruppenService {
  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('lernplattform-auth')
      if (!stored) return undefined
      return JSON.parse(stored).sessionToken
    } catch {
      return undefined
    }
  }

  async ladeGruppen(email: string): Promise<Gruppe[]> {
    const response = await apiClient.post<{ success: boolean; data: Gruppe[] }>(
      'lernplattformLadeGruppen',
      { email },
      this.getToken()
    )
    return response?.data || []
  }

  async erstelleGruppe(
    gruppe: Omit<Gruppe, 'fragebankSheetId' | 'analytikSheetId'>
  ): Promise<Gruppe> {
    const response = await apiClient.post<{ success: boolean; data: Gruppe }>(
      'lernplattformErstelleGruppe',
      { ...gruppe },
      this.getToken()
    )
    if (!response?.data) throw new Error('Gruppe konnte nicht erstellt werden')
    return response.data
  }

  async ladeMitglieder(gruppeId: string): Promise<Mitglied[]> {
    const response = await apiClient.post<{ success: boolean; data: Mitglied[] }>(
      'lernplattformLadeMitglieder',
      { gruppeId },
      this.getToken()
    )
    return response?.data || []
  }

  async einladen(gruppeId: string, email: string, name: string): Promise<void> {
    await apiClient.post(
      'lernplattformEinladen',
      { gruppeId, email, name },
      this.getToken()
    )
  }

  async entfernen(gruppeId: string, email: string): Promise<void> {
    await apiClient.post(
      'lernplattformEntfernen',
      { gruppeId, email },
      this.getToken()
    )
  }

  async generiereCode(gruppeId: string, email: string): Promise<string> {
    const response = await apiClient.post<{ success: boolean; data: { code: string } }>(
      'lernplattformGeneriereCode',
      { gruppeId, email },
      this.getToken()
    )
    if (!response?.data?.code) throw new Error('Code konnte nicht generiert werden')
    return response.data.code
  }

  async validiereCode(code: string) {
    const response = await apiClient.post<{
      success: boolean
      data: { email: string; name: string; sessionToken: string }
      error?: string
    }>('lernplattformCodeLogin', { code })

    return {
      erfolg: !!response?.success,
      email: response?.data?.email,
      name: response?.data?.name,
      fehler: response?.error,
    }
  }
}

export const gruppenAdapter = new AppsScriptGruppenAdapter()
```

- [ ] **Step 4: gruppenStore implementieren**

`src/store/gruppenStore.ts`:
```typescript
import { create } from 'zustand'
import type { Gruppe, Mitglied } from '../types/gruppen'
import { gruppenAdapter } from '../adapters/appsScriptAdapter'

interface GruppenState {
  gruppen: Gruppe[]
  aktiveGruppe: Gruppe | null
  mitglieder: Mitglied[]
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'

  ladeGruppen: (email: string) => Promise<void>
  waehleGruppe: (gruppeId: string) => Promise<void>
  istAdmin: (email: string) => boolean
}

export const useGruppenStore = create<GruppenState>((set, get) => ({
  gruppen: [],
  aktiveGruppe: null,
  mitglieder: [],
  ladeStatus: 'idle',

  ladeGruppen: async (email: string) => {
    set({ ladeStatus: 'laden' })

    try {
      const gruppen = await gruppenAdapter.ladeGruppen(email)
      const aktiveGruppe = gruppen.length === 1 ? gruppen[0] : null

      set({ gruppen, aktiveGruppe, ladeStatus: 'fertig' })

      // Mitglieder laden wenn nur eine Gruppe
      if (aktiveGruppe) {
        const mitglieder = await gruppenAdapter.ladeMitglieder(aktiveGruppe.id)
        set({ mitglieder })
      }
    } catch {
      set({ ladeStatus: 'fehler' })
    }
  },

  waehleGruppe: async (gruppeId: string) => {
    const gruppe = get().gruppen.find(g => g.id === gruppeId)
    if (!gruppe) return

    set({ aktiveGruppe: gruppe })

    const mitglieder = await gruppenAdapter.ladeMitglieder(gruppeId)
    set({ mitglieder })
  },

  istAdmin: (email: string) => {
    const gruppe = get().aktiveGruppe
    if (!gruppe) return false
    return gruppe.adminEmail.toLowerCase() === email.toLowerCase()
  },
}))
```

- [ ] **Step 5: Tests ausführen — müssen grün sein**

```bash
cd Lernplattform && npx vitest run src/__tests__/gruppenStore.test.ts
```

Expected: 5 Tests PASS.

- [ ] **Step 6: Commit**

```bash
git add Lernplattform/src/adapters/ Lernplattform/src/store/gruppenStore.ts Lernplattform/src/__tests__/gruppenStore.test.ts
git commit -m "Lernplattform Phase 1: Gruppen-Store + Apps-Script-Adapter mit Tests"
```

---

## Task 6: UI-Komponenten (Login + Gruppen + Dashboard-Shell)

**Files:**
- Create: `Lernplattform/src/components/LoginScreen.tsx`
- Create: `Lernplattform/src/components/GruppenAuswahl.tsx`
- Create: `Lernplattform/src/components/Dashboard.tsx`
- Create: `Lernplattform/src/components/AdminLayout.tsx`
- Modify: `Lernplattform/src/App.tsx`

- [ ] **Step 1: LoginScreen erstellen**

`src/components/LoginScreen.tsx`:
```tsx
import { useRef, useEffect, useState } from 'react'
import { initializeGoogleAuth, renderGoogleButton } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export default function LoginScreen() {
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [codeLogin, setCodeLogin] = useState(false)
  const [code, setCode] = useState('')
  const { anmeldenMitGoogle, anmeldenMitCode, ladeStatus, fehler } = useAuthStore()

  useEffect(() => {
    initializeGoogleAuth(
      (payload) => anmeldenMitGoogle(payload),
      (error) => console.error('Auth-Fehler:', error)
    )

    if (googleButtonRef.current) {
      renderGoogleButton(googleButtonRef.current)
    }
  }, [anmeldenMitGoogle])

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length >= 6) {
      anmeldenMitCode(code)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2 dark:text-white">📚 Lernplattform</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Anmelden um zu üben</p>

        {!codeLogin ? (
          <>
            <div ref={googleButtonRef} className="flex justify-center mb-4" />
            <button
              onClick={() => setCodeLogin(true)}
              className="text-sm text-gray-400 hover:text-gray-600 mt-2"
            >
              Mit Code anmelden
            </button>
          </>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Code eingeben"
              className="w-full text-center text-2xl tracking-widest border-2 border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-white dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:outline-none"
              maxLength={6}
              autoFocus
            />
            <button
              type="submit"
              disabled={code.length < 6 || ladeStatus === 'laden'}
              className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium disabled:opacity-50"
            >
              {ladeStatus === 'laden' ? 'Wird geprüft...' : 'Anmelden'}
            </button>
            <button
              type="button"
              onClick={() => { setCodeLogin(false); setCode('') }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Zurück zu Google-Login
            </button>
          </form>
        )}

        {fehler && (
          <p className="mt-4 text-red-500 text-sm">{fehler}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: GruppenAuswahl erstellen**

`src/components/GruppenAuswahl.tsx`:
```tsx
import { useGruppenStore } from '../store/gruppenStore'

export default function GruppenAuswahl() {
  const { gruppen, waehleGruppe, ladeStatus } = useGruppenStore()

  if (ladeStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Gruppen werden geladen...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center dark:text-white">Gruppe wählen</h2>
        <div className="space-y-3">
          {gruppen.map((gruppe) => (
            <button
              key={gruppe.id}
              onClick={() => waehleGruppe(gruppe.id)}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium">{gruppe.name}</div>
              <div className="text-sm text-gray-500">
                {gruppe.typ === 'privat' ? '🏠 Privat' : '🏫 Schule'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Dashboard-Platzhalter erstellen**

`src/components/Dashboard.tsx`:
```tsx
import { useAuthStore } from '../store/authStore'
import { useGruppenStore } from '../store/gruppenStore'

export default function Dashboard() {
  const { user, abmelden } = useAuthStore()
  const { aktiveGruppe } = useGruppenStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold dark:text-white">📚 Lernplattform</h1>
          {aktiveGruppe && (
            <span className="text-sm text-gray-500">{aktiveGruppe.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.vorname || user?.email}</span>
          {user?.bild && (
            <img src={user.bild} alt="" className="w-8 h-8 rounded-full" />
          )}
          <button
            onClick={abmelden}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">
          Hallo {user?.vorname || 'dort'}! 👋
        </h2>
        <div className="bg-white rounded-xl p-6 shadow-sm text-gray-500">
          <p>Dashboard kommt in Phase 2.</p>
          <p className="mt-2 text-sm">
            Eingeloggt als: {user?.email}<br />
            Gruppe: {aktiveGruppe?.name || 'keine'}<br />
            Rolle: {user?.rolle}
          </p>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: AdminLayout-Platzhalter erstellen**

`src/components/AdminLayout.tsx`:
```tsx
import { useAuthStore } from '../store/authStore'
import { useGruppenStore } from '../store/gruppenStore'

export default function AdminLayout() {
  const { user } = useAuthStore()
  const { aktiveGruppe, mitglieder } = useGruppenStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-lg font-bold">📊 Admin-Dashboard</h1>
        <span className="text-sm text-gray-500">{aktiveGruppe?.name}</span>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Gruppe verwalten</h2>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 mb-4">Admin-Funktionen kommen in Phase 4–5.</p>
          <h3 className="font-medium mb-2">Mitglieder ({mitglieder.length})</h3>
          <ul className="space-y-1">
            {mitglieder.map((m) => (
              <li key={m.email} className="text-sm text-gray-600">
                {m.name} ({m.email}) — {m.rolle}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 5: App.tsx mit Routing + Auth-Guard**

`src/App.tsx`:
```tsx
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useGruppenStore } from './store/gruppenStore'
import LoginScreen from './components/LoginScreen'
import GruppenAuswahl from './components/GruppenAuswahl'
import Dashboard from './components/Dashboard'

export default function App() {
  const { user, istAngemeldet, sessionWiederherstellen, ladeStatus: authStatus } = useAuthStore()
  const { gruppen, aktiveGruppe, ladeGruppen, ladeStatus: gruppenStatus } = useGruppenStore()

  // Session wiederherstellen beim Start
  useEffect(() => {
    sessionWiederherstellen()
  }, [sessionWiederherstellen])

  // Gruppen laden nach Login
  useEffect(() => {
    if (istAngemeldet && user?.email) {
      ladeGruppen(user.email)
    }
  }, [istAngemeldet, user?.email, ladeGruppen])

  // Rolle aktualisieren basierend auf Gruppen-Daten
  useEffect(() => {
    if (aktiveGruppe && user?.email) {
      const istAdmin = aktiveGruppe.adminEmail.toLowerCase() === user.email.toLowerCase()
      if (istAdmin && user.rolle !== 'admin') {
        useAuthStore.getState().setzeRolle('admin')
      } else if (!istAdmin && user.rolle !== 'lernend') {
        useAuthStore.getState().setzeRolle('lernend')
      }
    }
  }, [aktiveGruppe, user?.email, user?.rolle])

  // Laden...
  if (authStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Wird geladen...</p>
      </div>
    )
  }

  // Nicht eingeloggt
  if (!istAngemeldet) {
    return <LoginScreen />
  }

  // Gruppen werden geladen
  if (gruppenStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Gruppen werden geladen...</p>
      </div>
    )
  }

  // Keine Gruppen → Hinweis
  if (gruppen.length === 0 && gruppenStatus === 'fertig') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold mb-2">Keine Gruppen</h2>
          <p className="text-gray-500 mb-4">
            Du bist noch keiner Gruppe zugeordnet. Bitte wende dich an deinen Lehrer oder Elternteil.
          </p>
          <button
            onClick={() => useAuthStore.getState().abmelden()}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Abmelden
          </button>
        </div>
      </div>
    )
  }

  // Mehrere Gruppen → Auswahl
  if (!aktiveGruppe) {
    return <GruppenAuswahl />
  }

  // Hauptansicht
  return <Dashboard />
}
```

- [ ] **Step 6: tsc + Build prüfen**

```bash
cd Lernplattform && npx tsc -b && npm run build
```

Expected: Beides grün.

- [ ] **Step 7: Commit**

```bash
git add Lernplattform/src/components/ Lernplattform/src/App.tsx
git commit -m "Lernplattform Phase 1: UI-Komponenten (Login, Gruppen, Dashboard-Shell)"
```

---

## Task 7: GitHub Actions Deploy erweitern

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Aktuelle deploy.yml lesen und verstehen**

Prüfe die aktuelle Struktur: welche Jobs, welche Build-Steps, wie wird `_site/` zusammengesetzt.

- [ ] **Step 2: Lernplattform-Build hinzufügen**

In der deploy.yml nach dem Pruefung-Build einen analogen Block für Lernplattform einfügen:

```yaml
# Lernplattform bauen
- name: Install Lernplattform dependencies
  working-directory: Lernplattform
  run: npm ci

- name: Build Lernplattform
  working-directory: Lernplattform
  env:
    VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
    VITE_APPS_SCRIPT_URL: ${{ secrets.VITE_APPS_SCRIPT_URL }}
    VITE_BASE_PATH: /GYM-WR-DUY/Lernplattform/
  run: |
    npx tsc -b
    npm run build
```

Zusätzlich: `cache-dependency-path` im Setup-Node-Step um `Lernplattform/package-lock.json` erweitern.

Und beim Zusammensetzen der `_site/`:

```yaml
- name: Copy Lernplattform
  run: cp -r Lernplattform/dist _site/Lernplattform
```

- [ ] **Step 3: tsc + Build lokal verifizieren**

```bash
cd Lernplattform && npx tsc -b && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Lernplattform Phase 1: GitHub Actions Deploy-Workflow erweitert"
```

---

## Task 8: Alle Tests + Build + Gesamtverifikation

- [ ] **Step 1: Alle Lernplattform-Tests ausführen**

```bash
cd Lernplattform && npx vitest run
```

Expected: Alle Tests (apiClient + authStore + gruppenStore) PASS.

- [ ] **Step 2: TypeScript-Check**

```bash
cd Lernplattform && npx tsc -b
```

Expected: Keine Fehler.

- [ ] **Step 3: Build**

```bash
cd Lernplattform && npm run build
```

Expected: `dist/` korrekt erstellt.

- [ ] **Step 4: Prüfungstool nicht kaputt**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

Expected: Alles grün — Prüfungstool unverändert.

- [ ] **Step 5: HANDOFF.md aktualisieren**

Neuen Session-Eintrag in `ExamLab/HANDOFF.md` (oder separates `Lernplattform/HANDOFF.md`) mit:
- Stand: Branch `feature/lernplattform-phase1`, tsc ✅, Tests ✅, Build ✅
- Was wurde gemacht (8 Tasks)
- Was fehlt (Phase 2: Fragenbank + Übungs-Engine)
- Apps Script Endpoints noch nicht implementiert (Backend kommt in Phase 2)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Lernplattform Phase 1: Gesamtverifikation + HANDOFF"
```

---

## Zusammenfassung Phase 1

| Task | Beschreibung | Tests |
|------|-------------|-------|
| 1 | Projekt-Scaffolding | Build ✅ |
| 2 | TypeScript-Typen | tsc ✅ |
| 3 | Service-Interfaces + API-Client | 4 Tests |
| 4 | Auth-Service + Auth-Store | 6 Tests |
| 5 | Gruppen-Store + Adapter | 5 Tests |
| 6 | UI-Komponenten | tsc + Build |
| 7 | GitHub Actions Deploy | Build |
| 8 | Gesamtverifikation | Alle Tests + Build |

**Resultat:** Lauffähige App mit Login (Google OAuth + Code), Gruppen-System, Auth-Guard. Platzhalter-Dashboard bereit für Phase 2 (Fragenbank + Übungs-Engine).

**Noch nicht implementiert (Backend):** Die Apps Script Endpoints (`lernplattformLogin`, `lernplattformLadeGruppen`, etc.) werden in Phase 2 zusammen mit der Fragenbank erstellt. Phase 1 Frontend ist bereit und funktioniert mit Mocks/Tests.
