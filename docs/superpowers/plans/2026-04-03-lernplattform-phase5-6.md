# Lernplattform Phase 5+6 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shared Fragenbank (Google Sheets statt JSON), Kontext-Trennung Gym/Familie, Admin-Settings-Panel, Offline-PWA.

**Architecture:** Settings-First Ansatz. Parallel: Shared Types + Backend-Endpoints + Fragenbank-Endpoint. Dann LernKontextProvider + Fragenbank-Adapter. Dann Admin-UI + Dashboard-Anbindung. Dann Offline-PWA. Feature-Branch `feature/lernplattform-phase5-6`.

**Tech Stack:** React 19, TypeScript 5.9, Zustand, Tailwind CSS 4, Vite 7, Google Apps Script, IndexedDB (`idb-keyval`), `vite-plugin-pwa` (Workbox)

**Spec:** `docs/superpowers/specs/2026-04-03-lernplattform-phase5-6-shared-design.md`

**Hinweise:**
- Shared Library enthaelt vorerst NUR Types. Utils/Components (FrageText, KontenSelect, markdown, kontenrahmen) werden erst mit dem Shared Editor extrahiert (spaetere Session).
- Pruefungstool Path Alias wird erst in der Shared-Editor-Session konfiguriert.
- MitgliederTab nutzt bestehende Adapter-Methoden (`einladen`, `entfernen`, `generiereCode` existieren bereits in `appsScriptAdapter.ts`).

---

## Task 1: Feature-Branch + Shared Types

**Files:**
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types/fragen.ts`
- Create: `packages/shared/src/types/auth.ts`
- Create: `packages/shared/src/index.ts`
- Modify: `Lernplattform/tsconfig.app.json`
- Modify: `Lernplattform/vite.config.ts`

- [ ] **Step 1: Feature-Branch erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout -b feature/lernplattform-phase5-6
```

- [ ] **Step 2: packages/shared/ Grundstruktur erstellen**

`packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Kanonische Frage-Types aus Pruefung kopieren**

`packages/shared/src/types/fragen.ts` — Kopiere `FrageBase`, `Fachbereich`, `BloomStufe`, `Bewertungskriterium`, `Verwendung`, `FrageAnhang` und alle Fragetyp-Interfaces aus `Pruefung/src/types/fragen.ts`. Diese werden die Single Source of Truth. Exportiere Union-Type `Frage`.

- [ ] **Step 4: Shared Auth-Types**

`packages/shared/src/types/auth.ts`:
```typescript
export type Rolle = 'admin' | 'lernend'

export interface AuthUser {
  email: string
  name: string
  vorname: string
  nachname: string
  rolle: Rolle
  sessionToken: string
  loginMethode: 'google' | 'code'
}
```

- [ ] **Step 5: Index-Datei**

`packages/shared/src/index.ts`:
```typescript
export * from './types/fragen'
export * from './types/auth'
```

- [ ] **Step 6: TypeScript Path Alias in Lernplattform**

`Lernplattform/tsconfig.app.json` — `baseUrl` + `paths` hinzufuegen:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../packages/shared/src/*"]
    }
  }
}
```

`Lernplattform/vite.config.ts` — `resolve.alias` hinzufuegen:
```typescript
import path from 'path'

export default defineConfig({
  // ...bestehende config...
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../packages/shared/src')
    }
  },
})
```

- [ ] **Step 7: Build verifizieren**

```bash
cd Lernplattform && npx tsc -b && npm run build
```

Erwartet: Gruen.

- [ ] **Step 8: Commit**

```bash
git add packages/shared/ Lernplattform/tsconfig.app.json Lernplattform/vite.config.ts
git commit -m "Shared Library Grundgeruest (types, tsconfig, path alias)"
```

---

## Task 2: Settings-Datenmodell + Store + Backend-Endpoints

**Files:**
- Create: `Lernplattform/src/types/settings.ts`
- Create: `Lernplattform/src/store/settingsStore.ts`
- Create: `Lernplattform/src/__tests__/settingsStore.test.ts`
- Modify: `Lernplattform/apps-script/lernplattform-backend.js`
- Modify: `Lernplattform/src/adapters/appsScriptAdapter.ts`

- [ ] **Step 1: GruppenEinstellungen Type**

`Lernplattform/src/types/settings.ts`:
```typescript
export interface GruppenEinstellungen {
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>
  fachFarben: Record<string, string>
}

export const DEFAULT_GYM: GruppenEinstellungen = {
  anrede: 'sie', feedbackStil: 'sachlich',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
}

export const DEFAULT_FAMILIE: GruppenEinstellungen = {
  anrede: 'du', feedbackStil: 'ermutigend',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
}

export function defaultEinstellungen(typ: 'gym' | 'familie'): GruppenEinstellungen {
  return typ === 'familie' ? { ...DEFAULT_FAMILIE } : { ...DEFAULT_GYM }
}
```

- [ ] **Step 2: Settings Store Test (TDD)**

`Lernplattform/src/__tests__/settingsStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../store/settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ einstellungen: null, ladeStatus: 'idle' })
  })

  it('setzt Defaults fuer Gym', () => {
    useSettingsStore.getState().setzeDefaults('gym')
    const e = useSettingsStore.getState().einstellungen!
    expect(e.anrede).toBe('sie')
    expect(e.feedbackStil).toBe('sachlich')
  })

  it('setzt Defaults fuer Familie', () => {
    useSettingsStore.getState().setzeDefaults('familie')
    const e = useSettingsStore.getState().einstellungen!
    expect(e.anrede).toBe('du')
    expect(e.feedbackStil).toBe('ermutigend')
  })

  it('aktualisiert einzelne Felder', () => {
    useSettingsStore.getState().setzeDefaults('gym')
    useSettingsStore.getState().aktualisiereEinstellungen({ anrede: 'du' })
    expect(useSettingsStore.getState().einstellungen!.anrede).toBe('du')
    expect(useSettingsStore.getState().einstellungen!.feedbackStil).toBe('sachlich')
  })
})
```

- [ ] **Step 3: Test ausfuehren → FAIL**

```bash
cd Lernplattform && npx vitest run src/__tests__/settingsStore.test.ts
```

- [ ] **Step 4: Settings Store implementieren**

`Lernplattform/src/store/settingsStore.ts`:
```typescript
import { create } from 'zustand'
import type { GruppenEinstellungen } from '../types/settings'
import { defaultEinstellungen } from '../types/settings'

interface SettingsState {
  einstellungen: GruppenEinstellungen | null
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  setzeDefaults: (typ: 'gym' | 'familie') => void
  setzeEinstellungen: (e: GruppenEinstellungen) => void
  aktualisiereEinstellungen: (partial: Partial<GruppenEinstellungen>) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  einstellungen: null,
  ladeStatus: 'idle',

  setzeDefaults: (typ) => {
    set({ einstellungen: defaultEinstellungen(typ), ladeStatus: 'fertig' })
  },
  setzeEinstellungen: (e) => {
    set({ einstellungen: e, ladeStatus: 'fertig' })
  },
  aktualisiereEinstellungen: (partial) => {
    const aktuell = get().einstellungen
    if (!aktuell) return
    set({ einstellungen: { ...aktuell, ...partial } })
  },
}))
```

- [ ] **Step 5: Tests gruen**

```bash
cd Lernplattform && npx vitest run src/__tests__/settingsStore.test.ts
```

Erwartet: 3 Tests PASS.

- [ ] **Step 6: Apps Script — Settings-Endpoints**

In `Lernplattform/apps-script/lernplattform-backend.js`:
- Im `doPost` Dispatcher: `lernplattformLadeEinstellungen` und `lernplattformSpeichereEinstellungen` registrieren
- `lernplattformLadeEinstellungen(body)`: Liest `einstellungen`-Spalte aus Gruppen-Registry. Gibt Defaults zurueck wenn Spalte leer/fehlt.
- `lernplattformSpeichereEinstellungen(body)`: Admin-Check (email vs. adminEmail). Erstellt `einstellungen`-Spalte falls nicht vorhanden. Schreibt JSON. Bei Fehler: `fehler('Nur Admins...')`.

- [ ] **Step 7: Frontend-Adapter erweitern**

In `Lernplattform/src/adapters/appsScriptAdapter.ts`, zwei Methoden zur `AppsScriptGruppenAdapter` Klasse hinzufuegen:

```typescript
async ladeEinstellungen(gruppeId: string): Promise<GruppenEinstellungen> {
  const response = await apiClient.post<{ success: boolean; data: GruppenEinstellungen }>(
    'lernplattformLadeEinstellungen', { gruppeId }, this.getToken()
  )
  return response?.data || defaultEinstellungen('gym')
}

async speichereEinstellungen(gruppeId: string, einstellungen: GruppenEinstellungen, email: string): Promise<void> {
  const response = await apiClient.post<{ success: boolean; error?: string }>(
    'lernplattformSpeichereEinstellungen', { gruppeId, einstellungen, email }, this.getToken()
  )
  if (response && !response.success) throw new Error(response.error || 'Speichern fehlgeschlagen')
}
```

- [ ] **Step 8: Build + alle Tests verifizieren**

```bash
cd Lernplattform && npx tsc -b && npx vitest run
```

- [ ] **Step 9: Commit**

```bash
git add Lernplattform/src/types/settings.ts Lernplattform/src/store/settingsStore.ts Lernplattform/src/__tests__/settingsStore.test.ts Lernplattform/apps-script/lernplattform-backend.js Lernplattform/src/adapters/appsScriptAdapter.ts
git commit -m "Settings-Datenmodell + Store + Backend-Endpoints (Laden/Speichern)"
```

---

## Task 3: Backend — Fragenbank aus Sheets laden + Adapter umstellen

**Files:**
- Modify: `Lernplattform/apps-script/lernplattform-backend.js`
- Modify: `Lernplattform/src/adapters/appsScriptAdapter.ts`
- Delete: `Lernplattform/src/adapters/poolDaten.ts`
- Delete: `Lernplattform/src/adapters/mockDaten.ts`
- Delete: `Lernplattform/src/adapters/mockMitgliederDaten.ts`

- [ ] **Step 1: Backend — lernplattformLadeFragen aus Sheets**

In `lernplattform-backend.js`, bestehende `lernplattformLadeFragen` Funktion ersetzen. Neue Version:
- Liest `fragebankSheetId` aus Gruppen-Registry fuer die gegebene `gruppeId`
- Oeffnet dieses Sheet, liest alle Fragen (Header-Zeile → Spalten-Mapping → JSON-Objekte)
- JSON-Felder (beginnen mit `[` oder `{`) automatisch parsen
- Gibt `erfolg(fragen)` zurueck

- [ ] **Step 2: Frontend-Adapter — fragenAdapter umschreiben**

In `appsScriptAdapter.ts`:
- `MockFragenAdapter`, `KombinierterFragenAdapter`, `PoolFragenAdapter` Import + Klassen ENTFERNEN
- Import von `poolDaten.ts` und `mockDaten.ts` ENTFERNEN
- Neue `AppsScriptFragenAdapter` Klasse:

```typescript
class AppsScriptFragenAdapter implements FragenService {
  private cache: Map<string, Frage[]> = new Map()

  async ladeFragen(gruppeId: string, filter?: FragenFilter): Promise<Frage[]> {
    let fragen = this.cache.get(gruppeId)
    if (!fragen) {
      const response = await apiClient.post<{ success: boolean; data: Frage[] }>(
        'lernplattformLadeFragen', { gruppeId }, this.getToken()
      )
      fragen = response?.data || []
      this.cache.set(gruppeId, fragen)
    }
    let result = [...fragen]
    if (filter?.fach) result = result.filter(f => f.fach === filter.fach)
    if (filter?.thema) result = result.filter(f => f.thema === filter.thema)
    if (filter?.schwierigkeit) result = result.filter(f => f.schwierigkeit === filter.schwierigkeit)
    return result
  }

  async ladeThemen(gruppeId: string, fach?: string): Promise<string[]> {
    const fragen = await this.ladeFragen(gruppeId)
    let gefiltert = fragen
    if (fach) gefiltert = gefiltert.filter(f => f.fach === fach)
    return [...new Set(gefiltert.map(f => f.thema))]
  }

  invalidateCache(gruppeId?: string) {
    if (gruppeId) this.cache.delete(gruppeId)
    else this.cache.clear()
  }

  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('lernplattform-auth')
      return stored ? JSON.parse(stored).sessionToken : undefined
    } catch { return undefined }
  }
}

export const fragenAdapter: FragenService = new AppsScriptFragenAdapter()
```

- [ ] **Step 3: Alte Adapter loeschen**

```bash
rm Lernplattform/src/adapters/poolDaten.ts
rm Lernplattform/src/adapters/mockDaten.ts
rm Lernplattform/src/adapters/mockMitgliederDaten.ts
```

- [ ] **Step 4: Tote Imports fixen**

```bash
cd Lernplattform && npx tsc -b
```

Alle Compile-Fehler durch entfernte Imports fixen. Betroffen:
- `appsScriptAdapter.ts` (alte Imports)
- Tests die `MOCK_FRAGEN` oder `PoolFragenAdapter` direkt importieren → Mock via `vi.mock()` auf den neuen Adapter umstellen

- [ ] **Step 5: Tests anpassen und ausfuehren**

Tests die `MOCK_FRAGEN` direkt nutzen: Ersetze durch lokale Test-Fixtures (inline Frage-Objekte). Tests die `fragenAdapter` nutzen: Mock via `vi.mock('../adapters/appsScriptAdapter')`.

```bash
cd Lernplattform && npx vitest run && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A Lernplattform/
git commit -m "Fragenbank-Adapter: JSON -> Google Sheets (poolDaten/mockDaten entfernt)"
```

---

## Task 4: LernKontextProvider + Anrede-System

**Files:**
- Create: `Lernplattform/src/context/LernKontextProvider.tsx`
- Create: `Lernplattform/src/hooks/useLernKontext.ts`
- Create: `Lernplattform/src/utils/anrede.ts`
- Create: `Lernplattform/src/utils/fachFarben.ts`
- Create: `Lernplattform/src/__tests__/anrede.test.ts`
- Create: `Lernplattform/src/__tests__/fachFarben.test.ts`
- Modify: `Lernplattform/src/App.tsx`

- [ ] **Step 1: Anrede-Utility Test (TDD)**

`Lernplattform/src/__tests__/anrede.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { t } from '../utils/anrede'

describe('anrede', () => {
  it('gibt Sie-Form zurueck', () => {
    expect(t('richtig', 'sie')).toBe('Korrekt.')
    expect(t('falsch', 'sie')).toBe('Leider nicht korrekt.')
  })
  it('gibt Du-Form zurueck', () => {
    expect(t('richtig', 'du')).toBe('Super, richtig!')
    expect(t('falsch', 'du')).toContain('nicht ganz')
  })
})
```

- [ ] **Step 2: Test → FAIL**

```bash
cd Lernplattform && npx vitest run src/__tests__/anrede.test.ts
```

- [ ] **Step 3: Anrede-Utility implementieren**

`Lernplattform/src/utils/anrede.ts`:
```typescript
const texte = {
  richtig:    { sie: 'Korrekt.',                     du: 'Super, richtig!' },
  falsch:     { sie: 'Leider nicht korrekt.',         du: 'Hmm, nicht ganz. Versuch es nochmal!' },
  weiter:     { sie: 'Weiter',                        du: 'Weiter' },
  beenden:    { sie: 'Uebung beenden',                du: 'Fertig!' },
  willkommen: { sie: 'Willkommen',                    du: 'Hallo' },
  nochmal:    { sie: 'Erneut ueben',                  du: 'Nochmal!' },
  tipp:       { sie: 'Hinweis anzeigen',              du: 'Tipp zeigen' },
  leer:       { sie: 'Keine Aufgaben verfuegbar.',    du: 'Noch keine Aufgaben da.' },
  abmelden:   { sie: 'Abmelden',                      du: 'Tschuess!' },
  geschafft:  { sie: 'Uebung abgeschlossen.',         du: 'Geschafft!' },
  unsicher:   { sie: 'Als unsicher markieren',         du: 'Bin mir unsicher' },
  skip:       { sie: 'Ueberspringen',                 du: 'Ueberspringen' },
} as const

export type AnredeKey = keyof typeof texte
export function t(key: AnredeKey, anrede: 'sie' | 'du'): string {
  return texte[key][anrede]
}
```

- [ ] **Step 4: Anrede-Test → PASS**

- [ ] **Step 5: Fachfarben-Utility + Test**

`Lernplattform/src/__tests__/fachFarben.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getFachFarbe } from '../utils/fachFarben'

describe('fachFarben', () => {
  it('gibt Standard-Farbe zurueck', () => {
    expect(getFachFarbe('VWL', {})).toBe('#f97316')
    expect(getFachFarbe('BWL', {})).toBe('#3b82f6')
  })
  it('gibt konfigurierte Farbe zurueck', () => {
    expect(getFachFarbe('VWL', { VWL: '#ff0000' })).toBe('#ff0000')
  })
  it('gibt Fallback fuer unbekanntes Fach', () => {
    expect(getFachFarbe('Deutsch', {})).toBe('#6b7280')
  })
})
```

`Lernplattform/src/utils/fachFarben.ts`:
```typescript
const STANDARD_FARBEN: Record<string, string> = {
  VWL: '#f97316', BWL: '#3b82f6', Recht: '#22c55e', Informatik: '#6b7280',
}

export function setzeFachFarben(fachFarben: Record<string, string>): void {
  const root = document.documentElement
  const merged = { ...STANDARD_FARBEN, ...fachFarben }
  for (const [fach, farbe] of Object.entries(merged)) {
    root.style.setProperty(`--c-${fach.toLowerCase()}`, farbe)
  }
}

export function getFachFarbe(fach: string, fachFarben: Record<string, string>): string {
  return fachFarben[fach] || STANDARD_FARBEN[fach] || '#6b7280'
}
```

- [ ] **Step 6: Tests gruen**

```bash
cd Lernplattform && npx vitest run src/__tests__/anrede.test.ts src/__tests__/fachFarben.test.ts
```

- [ ] **Step 7: LernKontextProvider**

`Lernplattform/src/context/LernKontextProvider.tsx`:
```typescript
import { createContext, useEffect, type ReactNode } from 'react'
import { useGruppenStore } from '../store/gruppenStore'
import { useSettingsStore } from '../store/settingsStore'
import { gruppenAdapter } from '../adapters/appsScriptAdapter'
import { setzeFachFarben } from '../utils/fachFarben'
import type { GruppenEinstellungen } from '../types/settings'

export interface LernKontext {
  typ: 'gym' | 'familie'
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>
  fachFarben: Record<string, string>
  einstellungen: GruppenEinstellungen | null
}

const DEFAULT_KONTEXT: LernKontext = {
  typ: 'gym', anrede: 'sie', feedbackStil: 'sachlich',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
  einstellungen: null,
}

export const LernKontextContext = createContext<LernKontext>(DEFAULT_KONTEXT)

export function LernKontextProvider({ children }: { children: ReactNode }) {
  const { aktiveGruppe } = useGruppenStore()
  const { einstellungen, setzeEinstellungen, setzeDefaults } = useSettingsStore()

  useEffect(() => {
    if (!aktiveGruppe) return
    let cancelled = false
    gruppenAdapter.ladeEinstellungen(aktiveGruppe.id)
      .then(e => { if (!cancelled) setzeEinstellungen(e) })
      .catch(() => { if (!cancelled) setzeDefaults(aktiveGruppe.typ) })
    return () => { cancelled = true }
  }, [aktiveGruppe, setzeEinstellungen, setzeDefaults])

  useEffect(() => {
    if (einstellungen?.fachFarben) setzeFachFarben(einstellungen.fachFarben)
  }, [einstellungen?.fachFarben])

  const kontext: LernKontext = einstellungen && aktiveGruppe
    ? {
        typ: aktiveGruppe.typ, anrede: einstellungen.anrede,
        feedbackStil: einstellungen.feedbackStil,
        sichtbareFaecher: einstellungen.sichtbareFaecher,
        sichtbareThemen: einstellungen.sichtbareThemen,
        fachFarben: einstellungen.fachFarben, einstellungen,
      }
    : DEFAULT_KONTEXT

  return <LernKontextContext.Provider value={kontext}>{children}</LernKontextContext.Provider>
}
```

- [ ] **Step 8: useLernKontext Hook**

`Lernplattform/src/hooks/useLernKontext.ts`:
```typescript
import { useContext } from 'react'
import { LernKontextContext } from '../context/LernKontextProvider'
export function useLernKontext() { return useContext(LernKontextContext) }
```

- [ ] **Step 9: In App.tsx einbinden**

`<LernKontextProvider>` um den `<AppShell>` Block wrappen (ueberall wo `aktiveGruppe` vorhanden ist).

- [ ] **Step 10: Build + Tests**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 11: Commit**

```bash
git add Lernplattform/src/context/ Lernplattform/src/hooks/useLernKontext.ts Lernplattform/src/utils/anrede.ts Lernplattform/src/utils/fachFarben.ts Lernplattform/src/App.tsx Lernplattform/src/__tests__/anrede.test.ts Lernplattform/src/__tests__/fachFarben.test.ts
git commit -m "LernKontextProvider + Anrede-System + Fachfarben-Utility"
```

---

## Task 5: Dashboard + Quiz an LernKontext anbinden

**Files:**
- Modify: `Lernplattform/src/components/Dashboard.tsx`
- Modify: `Lernplattform/src/components/uebung/FeedbackPanel.tsx`
- Modify: `Lernplattform/src/components/uebung/QuizActions.tsx`
- Modify: `Lernplattform/src/components/Zusammenfassung.tsx`
- Modify: `Lernplattform/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Dashboard — FACH_FARBEN durch Kontext ersetzen**

In `Dashboard.tsx`:
- Import: `import { useLernKontext } from '../hooks/useLernKontext'` + `import { getFachFarbe } from '../utils/fachFarben'`
- `const { sichtbareFaecher, sichtbareThemen, fachFarben } = useLernKontext()`
- `FACH_FARBEN` Konstante ENTFERNEN
- Fach-Badge-Farbe via inline style (NICHT Tailwind JIT — dynamische Hex-Werte funktionieren nicht mit Tailwind JIT):
  ```typescript
  const farbe = getFachFarbe(fach, fachFarben)
  // In JSX:
  style={{ backgroundColor: farbe + '1a', color: farbe, borderColor: farbe + '4d' }}
  ```
- Filter-Logik erweitern: Wenn `sichtbareFaecher.length > 0`, nur diese zeigen. Analog `sichtbareThemen`.

- [ ] **Step 2: FeedbackPanel — Anrede-Texte**

In `FeedbackPanel.tsx`:
```typescript
import { useLernKontext } from '../../hooks/useLernKontext'
import { t } from '../../utils/anrede'

export default function FeedbackPanel({ korrekt, erklaerung }: Props) {
  const { anrede } = useLernKontext()
  return (
    <div className={...}>
      <div className="font-medium mb-1">
        {korrekt
          ? <span className="text-green-700 dark:text-green-300">&#10003; {t('richtig', anrede)}</span>
          : <span className="text-red-700 dark:text-red-300">&#10007; {t('falsch', anrede)}</span>
        }
      </div>
      {erklaerung && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{erklaerung}</p>}
    </div>
  )
}
```

- [ ] **Step 3: QuizActions + Zusammenfassung — Anrede-Texte**

Alle hardcodierten User-facing Button-Texte durch `t(key, anrede)` ersetzen:
- `QuizActions.tsx`: "Uebung beenden" → `t('beenden', anrede)`, "Als unsicher markieren" → `t('unsicher', anrede)`
- `Zusammenfassung.tsx`: "Erneut ueben" → `t('nochmal', anrede)`, Ergebnis-Texte

- [ ] **Step 4: AppShell — Willkommen + Abmelden**

In `AppShell.tsx`: Willkommens-Gruss und Abmelden-Button via `t('willkommen', anrede)` / `t('abmelden', anrede)`.

- [ ] **Step 5: Build + Tests**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add Lernplattform/src/components/
git commit -m "Dashboard + Quiz an LernKontext angebunden (Anrede, dynamische Farben, Filter)"
```

---

## Task 6: Admin-Settings-Panel

**Files:**
- Create: `Lernplattform/src/components/admin/AdminSettings.tsx`
- Create: `Lernplattform/src/components/admin/settings/AllgemeinTab.tsx`
- Create: `Lernplattform/src/components/admin/settings/FaecherTab.tsx`
- Create: `Lernplattform/src/components/admin/settings/FarbenTab.tsx`
- Create: `Lernplattform/src/components/admin/settings/MitgliederTab.tsx`
- Modify: `Lernplattform/src/components/admin/AdminDashboard.tsx`

- [ ] **Step 1: AdminSettings Tab-Container**

`AdminSettings.tsx` — 4 Tabs (Allgemein, Faecher & Themen, Farben, Mitglieder). Segment-Control-Style Navigation oben. Rendert aktiven Tab.

- [ ] **Step 2: AllgemeinTab**

`settings/AllgemeinTab.tsx`:
- Liest `useSettingsStore()` + `useGruppenStore()` + `useAuthStore()`
- Zeigt: Gruppenname (readonly), Typ (readonly)
- Toggle: Anrede (Sie ↔ Du), Feedback-Stil (Sachlich ↔ Ermutigend)
- "Speichern"-Button:
  1. `aktualisiereEinstellungen(changes)` → Store sofort updaten (optimistic)
  2. `gruppenAdapter.speichereEinstellungen(gruppeId, einstellungen, email)` → Backend
  3. Bei Fehler: `setzeEinstellungen(vorher)` → Rollback + Fehler-Toast

- [ ] **Step 3: FaecherTab**

`settings/FaecherTab.tsx`:
- Laedt alle Fragen via `fragenAdapter.ladeFragen(gruppeId)` → extrahiert verfuegbare Faecher + Themen mit Fragen-Count
- Checkbox pro Fach mit "X Fragen" Badge
- Aufklappbar: Themen pro Fach mit Checkboxen
- Default: alle an (leer in Settings = alle sichtbar). Checkbox deaktivieren = Fach zu `sichtbareFaecher` hinzufuegen
- Speichern-Button wie AllgemeinTab (optimistic + rollback)

- [ ] **Step 4: FarbenTab**

`settings/FarbenTab.tsx`:
- Pro sichtbarem Fach: `<input type="color" value={getFachFarbe(fach, fachFarben)}>` + Reset-Button
- Vorschau: Inline-Badge `<span style={{ backgroundColor: farbe, color: '#fff' }}>{fach}</span>`
- Speichern-Button

- [ ] **Step 5: MitgliederTab**

`settings/MitgliederTab.tsx`:
- Laedt Mitglieder via `useGruppenStore().mitglieder`
- Liste: Name, E-Mail, Admin-Badge
- Einladen: E-Mail-Input + "Einladen"-Button → `gruppenAdapter.einladen(gruppeId, email, name)`
- Entfernen: Button mit `window.confirm()` (kein Modal noetig im Admin) → `gruppenAdapter.entfernen(gruppeId, email)`
- Code generieren (nur Familie): Button → `gruppenAdapter.generiereCode(gruppeId, email)` → Code anzeigen

- [ ] **Step 6: AdminDashboard — Einstellungen-Tab**

In `AdminDashboard.tsx`:
- `AdminAnsicht` Union: `| { typ: 'einstellungen' }`
- Tab-Button "Einstellungen" in Tab-Leiste
- `{ansicht.typ === 'einstellungen' && <AdminSettings />}`

- [ ] **Step 7: Build + Tests**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add Lernplattform/src/components/admin/
git commit -m "Admin-Settings-Panel (4 Tabs: Allgemein, Faecher, Farben, Mitglieder)"
```

---

## Task 7: Offline-PWA (IndexedDB + Service Worker)

**Files:**
- Create: `Lernplattform/src/utils/indexedDB.ts`
- Create: `Lernplattform/src/utils/offlineQueue.ts`
- Create: `Lernplattform/src/utils/syncManager.ts`
- Create: `Lernplattform/src/__tests__/offlineQueue.test.ts`
- Modify: `Lernplattform/vite.config.ts`
- Modify: `Lernplattform/package.json`
- Modify: `Lernplattform/src/store/fortschrittStore.ts`
- Modify: `Lernplattform/src/App.tsx`

- [ ] **Step 1: Dependencies installieren**

```bash
cd Lernplattform && npm install idb-keyval && npm install -D vite-plugin-pwa
```

- [ ] **Step 2: IndexedDB Wrapper**

`Lernplattform/src/utils/indexedDB.ts`:
```typescript
import { get, set, clear } from 'idb-keyval'
import type { Frage } from '../types/fragen'
import type { FragenFortschritt } from '../types/fortschritt'
import type { GruppenEinstellungen } from '../types/settings'

const PREFIX = 'lp-'

export const db = {
  async getFragen(gruppeId: string): Promise<Frage[] | undefined> {
    return get(`${PREFIX}fragen-${gruppeId}`)
  },
  async setFragen(gruppeId: string, fragen: Frage[]): Promise<void> {
    await set(`${PREFIX}fragen-${gruppeId}`, fragen)
  },
  async getFortschritt(): Promise<Record<string, FragenFortschritt> | undefined> {
    return get(`${PREFIX}fortschritt`)
  },
  async setFortschritt(data: Record<string, FragenFortschritt>): Promise<void> {
    await set(`${PREFIX}fortschritt`, data)
  },
  async getEinstellungen(gruppeId: string): Promise<GruppenEinstellungen | undefined> {
    return get(`${PREFIX}settings-${gruppeId}`)
  },
  async setEinstellungen(gruppeId: string, data: GruppenEinstellungen): Promise<void> {
    await set(`${PREFIX}settings-${gruppeId}`, data)
  },
  async clearAll(): Promise<void> { await clear() },
}
```

- [ ] **Step 3: Offline-Queue (Test first)**

`Lernplattform/src/__tests__/offlineQueue.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { enqueue, getQueue, clearQueue, removeFromQueue } from '../utils/offlineQueue'

// Mock idb-keyval mit in-memory Map
const store = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: (key: string) => Promise.resolve(store.get(key)),
  set: (key: string, val: unknown) => { store.set(key, val); return Promise.resolve() },
}))

describe('offlineQueue', () => {
  beforeEach(() => { store.clear() })

  it('enqueue und getQueue', async () => {
    await enqueue('test', { foo: 'bar' })
    const q = await getQueue()
    expect(q).toHaveLength(1)
    expect(q[0].action).toBe('test')
    expect(q[0].payload).toEqual({ foo: 'bar' })
  })

  it('removeFromQueue', async () => {
    await enqueue('a', {})
    await enqueue('b', {})
    const q = await getQueue()
    await removeFromQueue(q[0].id)
    expect(await getQueue()).toHaveLength(1)
  })

  it('clearQueue', async () => {
    await enqueue('a', {})
    await clearQueue()
    expect(await getQueue()).toHaveLength(0)
  })
})
```

- [ ] **Step 4: Offline-Queue implementieren**

`Lernplattform/src/utils/offlineQueue.ts`:
```typescript
import { get, set } from 'idb-keyval'

interface QueueItem {
  id: string
  action: string
  payload: Record<string, unknown>
  timestamp: string
}

const QUEUE_KEY = 'lp-offline-queue'

export async function enqueue(action: string, payload: Record<string, unknown>): Promise<void> {
  const queue = await getQueue()
  queue.push({ id: crypto.randomUUID(), action, payload, timestamp: new Date().toISOString() })
  await set(QUEUE_KEY, queue)
}

export async function getQueue(): Promise<QueueItem[]> {
  return (await get(QUEUE_KEY)) || []
}

export async function clearQueue(): Promise<void> { await set(QUEUE_KEY, []) }

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue()
  await set(QUEUE_KEY, queue.filter(item => item.id !== id))
}
```

- [ ] **Step 5: Tests → PASS**

```bash
cd Lernplattform && npx vitest run src/__tests__/offlineQueue.test.ts
```

- [ ] **Step 6: Sync-Manager**

`Lernplattform/src/utils/syncManager.ts`:
```typescript
import { getQueue, removeFromQueue } from './offlineQueue'
import { apiClient } from '../services/apiClient'

let syncing = false

export function initSyncManager(): void {
  window.addEventListener('online', () => flushQueue())
}

export async function flushQueue(): Promise<void> {
  if (syncing || !navigator.onLine) return
  syncing = true
  try {
    const queue = await getQueue()
    for (const item of queue) {
      try {
        const token = getTokenFromStorage()
        await apiClient.post(item.action, item.payload, token)
        await removeFromQueue(item.id)
      } catch { break }
    }
  } finally { syncing = false }
}

function getTokenFromStorage(): string | undefined {
  try {
    const stored = localStorage.getItem('lernplattform-auth')
    return stored ? JSON.parse(stored).sessionToken : undefined
  } catch { return undefined }
}
```

- [ ] **Step 7: FortschrittStore — IndexedDB + Offline-Queue**

In `fortschrittStore.ts`:
- Import `db` und `enqueue`
- `speichereInLocalStorage` → auch `db.setFortschritt(fortschritte)` (async, fire-and-forget)
- `ladeFortschritt` → erst IndexedDB (`db.getFortschritt()`), Fallback localStorage
- `antwortVerarbeiten` → wenn offline (`!navigator.onLine`): nur lokal + `enqueue('lernplattformSpeichereFortschritt', payload)`

- [ ] **Step 8: Vite PWA Plugin konfigurieren**

`Lernplattform/vite.config.ts` — `VitePWA` Plugin hinzufuegen (wie in Pruefung):
- `registerType: 'autoUpdate'`
- Manifest: name, short_name, display: standalone, icons
- Workbox: `skipWaiting`, `clientsClaim`, `globPatterns`, `navigateFallback`
- Runtime-Caching fuer Bilder (CacheFirst)

- [ ] **Step 9: SyncManager in App.tsx**

Import + `initSyncManager()` im App-Start useEffect.

- [ ] **Step 10: Build + Tests**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 11: Commit**

```bash
git add -A Lernplattform/
git commit -m "Offline-PWA: IndexedDB, Offline-Queue, Sync-Manager, Service Worker"
```

---

## Task 8: Migration Pool-Daten + Aufraeumen

**Files:**
- Create: `Lernplattform/scripts/migratePoolsToSheets.mjs` (einmal-Script)
- Delete: `Lernplattform/public/pool-daten/`
- Delete: `Lernplattform/scripts/convertPools.mjs`
- Delete: `Lernplattform/scripts/output/`

- [ ] **Step 1: Migrations-Script erstellen**

`Lernplattform/scripts/migratePoolsToSheets.mjs`:
- Liest alle JSON-Dateien aus `public/pool-daten/`
- Fuer jede Frage: SHA-256 Content-Hash berechnen (gleiche Logik wie Pool-Bruecke)
- Vergleicht mit bestehenden Fragen in der Fragenbank (via ID oder Hash)
- Neue/fehlende Fragen: in Sheet einfuegen
- Duplikate: ueberspringen
- Ausgabe: "X Fragen importiert, Y Duplikate uebersprungen"

**Hinweis:** Dieses Script muss manuell ausgefuehrt werden und braucht Zugriff auf Google Sheets API (z.B. via Apps Script als separate Funktion oder als Node-Script mit google-auth). Kann auch als Apps-Script-Funktion implementiert werden.

- [ ] **Step 2: Migration ausfuehren**

User muss das Script ausfuehren und verifizieren dass alle Fragen in den Sheets sind.

- [ ] **Step 3: Pool-Daten + Konverter loeschen**

```bash
rm -rf Lernplattform/public/pool-daten/
rm -f Lernplattform/scripts/convertPools.mjs
rm -rf Lernplattform/scripts/output/
# Pruefen ob scripts/ leer ist
ls Lernplattform/scripts/ && rmdir Lernplattform/scripts/ 2>/dev/null || true
```

- [ ] **Step 4: Tote Imports + Build pruefen**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Migration: Pool-Daten in Sheets importiert, pool-daten/ + convertPools.mjs entfernt"
```

---

## Task 9: HANDOFF + Verifikation + User-Test

**Files:**
- Create/Modify: `Lernplattform/HANDOFF.md`

- [ ] **Step 1: HANDOFF.md aktualisieren**

Dokumentiere:
- Branch: `feature/lernplattform-phase5-6`
- Alle Tasks (1-8) mit Status
- Verifikations-Checkliste (aus Spec Abschnitt 10)
- Offene Punkte: Shared Editor (spaetere Session), Phase 7 Backend-Persistenz (teilweise durch Offline-PWA abgedeckt)
- **Wichtig:** User muss Apps Script Backend neu deployen (lernplattform-backend.js geaendert)
- **Wichtig:** `einstellungen`-Spalte wird automatisch beim ersten Speichern erstellt

- [ ] **Step 2: Vollstaendige Verifikation**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
```

Alle 3 muessen gruen sein.

- [ ] **Step 3: Commit**

```bash
git add Lernplattform/HANDOFF.md
git commit -m "HANDOFF aktualisiert (Phase 5+6 Summary)"
```

- [ ] **Step 4: User informieren — bereit fuer Test**

Zusammenfassung:
1. Apps Script Backend neu deployen (neue Bereitstellung im Editor)
2. Feature-Branch testen: `cd Lernplattform && npm run preview`
3. Verifizieren: Settings-Panel, Gym vs. Familie Kontext, Fragenbank aus Sheets, Offline
4. Nach Freigabe: `git checkout main && git merge feature/lernplattform-phase5-6 && git push`
