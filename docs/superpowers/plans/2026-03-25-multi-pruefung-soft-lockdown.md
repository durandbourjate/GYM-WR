# Multi-Prüfungs-Dashboard + Soft-Lockdown — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LP kann mehrere Prüfungen parallel in einem Tab überwachen + SEB-unabhängige Lockdown-Sicherheit in 3 Stufen (Locker/Standard/Streng) mit automatischer Geräteerkennung.

**Architecture:** Soft-Lockdown als neuer `useLockdown`-Hook (SuS-Seite), der Copy/Paste, Vollbild, DevTools und Verstoss-Zähler verwaltet. Multi-Dashboard als Wrapper um bestehendes `DurchfuehrenDashboard`, das mehrere `pruefungId`s parallel pollt und im Live-Monitoring zusammenführt. Backend-Erweiterungen minimal: neue Felder in Heartbeat + 2 neue Endpoints.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Vite, Google Apps Script

**Spec:** `docs/superpowers/specs/2026-03-25-multi-pruefung-soft-lockdown-design.md`

---

## Dateiübersicht

### Neue Dateien

| Datei | Verantwortung |
|-------|---------------|
| `src/types/lockdown.ts` | Types für Kontrollstufe, Verstoss, Gerät |
| `src/hooks/useLockdown.ts` | Zentral-Hook: Vollbild, Copy/Paste, DevTools, Verstoss-Zähler, Sperre |
| `src/hooks/useGeraetErkennung.ts` | Geräteerkennung (Laptop/Tablet) + Fullscreen-Capability |
| `src/components/VerstossOverlay.tsx` | SuS-Warnung bei Verstoss (Overlay) |
| `src/components/SperreOverlay.tsx` | SuS-Sperre bei max Verstössen |
| `src/components/lp/KontrollStufeSelect.tsx` | Segmented Control für LP (Locker/Standard/Streng) |
| `src/components/lp/MultiDurchfuehrenDashboard.tsx` | Multi-Prüfungs-Container mit zusammengefasstem Monitoring |

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/types/monitoring.ts` | `SchuelerStatus` + `HeartbeatResponse` erweitern |
| `src/types/pruefung.ts` | `PruefungsConfig.kontrollStufe` Feld |
| `src/types/antworten.ts` | `Unterbrechung.typ` erweitern |
| `src/hooks/usePruefungsMonitoring.ts` | Heartbeat-Felder erweitern, Verstösse mitsenden |
| `src/components/Layout.tsx` | `useLockdown` Hook einbinden |
| `src/components/Startbildschirm.tsx` | Vollbild-Trigger beim Start |
| `src/components/lp/AktivPhase.tsx` | Neue Spalten, Entsperren-Button, Verstoss-Tooltip |
| `src/components/lp/VorbereitungPhase.tsx` | KontrollStufeSelect einbauen |
| `src/components/lp/DurchfuehrenDashboard.tsx` | Multi-Prüfungs-Routing |
| `src/components/App.tsx` | `?ids=` URL-Parameter |
| `src/services/pruefungApi.ts` | Heartbeat erweitern + neue Endpoints |
| `apps-script-code.js` | heartbeat + ladeMonitoring erweitern, 2 neue Endpoints |

---

## Task 1: Lockdown-Types + Geräteerkennung

**Files:**
- Create: `src/types/lockdown.ts`
- Create: `src/hooks/useGeraetErkennung.ts`

- [ ] **Step 1: Types erstellen**

```typescript
// src/types/lockdown.ts
export type KontrollStufe = 'locker' | 'standard' | 'streng'
export type GeraetTyp = 'laptop' | 'tablet' | 'unbekannt'

export interface Verstoss {
  zeitpunkt: string
  typ: 'tab-wechsel' | 'copy-versuch' | 'vollbild-verlassen' | 'split-view'
  dauer_sekunden?: number
}

export interface LockdownState {
  kontrollStufe: KontrollStufe       // von LP gesetzt
  effektiveKontrollStufe: KontrollStufe  // nach Geräte-Downgrade
  geraet: GeraetTyp
  vollbildAktiv: boolean
  vollbildUnterstuetzt: boolean
  verstossZaehler: number
  maxVerstoesse: number
  gesperrt: boolean
  verstoesse: Verstoss[]
}
```

- [ ] **Step 2: Geräteerkennung-Hook erstellen**

```typescript
// src/hooks/useGeraetErkennung.ts
import { useState, useEffect } from 'react'
import type { GeraetTyp } from '../types/lockdown'

function erkenneGeraet(): GeraetTyp {
  const ua = navigator.userAgent
  // iPad mit Desktop-UA erkennen (iPadOS 13+)
  if (/iPad|iPhone|iPod/.test(ua)) return 'tablet'
  if (navigator.maxTouchPoints > 1 && /Mac/.test(ua)) return 'tablet'
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return 'tablet'
  return 'laptop'
}

function vollbildUnterstuetzt(): boolean {
  return !!(
    document.documentElement.requestFullscreen ||
    (document.documentElement as any).webkitRequestFullscreen
  )
}

export function useGeraetErkennung() {
  const [geraet] = useState<GeraetTyp>(erkenneGeraet)
  const [hatVollbild] = useState(vollbildUnterstuetzt)

  return { geraet, vollbildUnterstuetzt: hatVollbild }
}

export { erkenneGeraet }
```

- [ ] **Step 3: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`
Expected: Keine Fehler (neue Dateien noch nicht importiert)

- [ ] **Step 4: Commit**

```bash
git add src/types/lockdown.ts src/hooks/useGeraetErkennung.ts
git commit -m "feat(lockdown): Types + Geräteerkennung-Hook"
```

---

## Task 2: useLockdown-Hook (Kern)

**Files:**
- Create: `src/hooks/useLockdown.ts`

- [ ] **Step 1: Hook erstellen**

```typescript
// src/hooks/useLockdown.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import type { KontrollStufe, Verstoss, LockdownState, GeraetTyp } from '../types/lockdown'
import { useGeraetErkennung } from './useGeraetErkennung'

function berechneEffektiveStufe(stufe: KontrollStufe, geraet: GeraetTyp): KontrollStufe {
  if (geraet === 'tablet' && stufe === 'streng') return 'standard'
  return stufe
}

interface UseLockdownOptions {
  kontrollStufe: KontrollStufe
  maxVerstoesse?: number
  aktiv: boolean // false = Prüfung nicht gestartet oder bereits abgegeben
}

export function useLockdown({ kontrollStufe, maxVerstoesse = 3, aktiv }: UseLockdownOptions): LockdownState & {
  registriereVerstoss: (typ: Verstoss['typ'], dauer?: number) => void
  entsperre: () => void
  starteVollbild: () => Promise<boolean>
  neueVerstoesseSeitLetztemSync: () => Verstoss[]
} {
  const { geraet, vollbildUnterstuetzt } = useGeraetErkennung()
  const effektiv = berechneEffektiveStufe(kontrollStufe, geraet)

  const [verstossZaehler, setVerstossZaehler] = useState(0)
  const [gesperrt, setGesperrt] = useState(false)
  const [verstoesse, setVerstoesse] = useState<Verstoss[]>([])
  const [vollbildAktiv, setVollbildAktiv] = useState(false)
  const letzterSyncIndex = useRef(0)

  // Verstoss registrieren
  const registriereVerstoss = useCallback((typ: Verstoss['typ'], dauer?: number) => {
    if (!aktiv || gesperrt) return

    const verstoss: Verstoss = {
      zeitpunkt: new Date().toISOString(),
      typ,
      ...(dauer !== undefined ? { dauer_sekunden: dauer } : {}),
    }
    setVerstoesse(prev => [...prev, verstoss])

    // Nur bestimmte Typen zählen
    const zaehlt = typ === 'tab-wechsel' || typ === 'vollbild-verlassen' || typ === 'split-view'
    if (zaehlt) {
      setVerstossZaehler(prev => {
        const neu = prev + 1
        if (neu >= maxVerstoesse) setGesperrt(true)
        return neu
      })
    }
  }, [aktiv, gesperrt, maxVerstoesse])

  // LP-Entsperrung
  const entsperre = useCallback(() => {
    setGesperrt(false)
    setVerstossZaehler(0)
  }, [])

  // Verstoesse seit letztem Sync (für Heartbeat)
  const neueVerstoesseSeitLetztemSync = useCallback(() => {
    const neue = verstoesse.slice(letzterSyncIndex.current)
    letzterSyncIndex.current = verstoesse.length
    return neue
  }, [verstoesse])

  // Vollbild starten
  const starteVollbild = useCallback(async (): Promise<boolean> => {
    if (!vollbildUnterstuetzt) return false
    try {
      const el = document.documentElement
      if (el.requestFullscreen) await el.requestFullscreen()
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen()
      return true
    } catch {
      return false
    }
  }, [vollbildUnterstuetzt])

  // === Copy/Paste blockieren (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'locker') return

    function blockiere(e: Event) {
      e.preventDefault()
      registriereVerstoss('copy-versuch')
    }

    document.addEventListener('copy', blockiere)
    document.addEventListener('paste', blockiere)
    document.addEventListener('cut', blockiere)
    return () => {
      document.removeEventListener('copy', blockiere)
      document.removeEventListener('paste', blockiere)
      document.removeEventListener('cut', blockiere)
    }
  }, [aktiv, effektiv, registriereVerstoss])

  // === Rechtsklick blockieren (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'locker') return

    function blockiere(e: Event) { e.preventDefault() }
    document.addEventListener('contextmenu', blockiere)
    return () => document.removeEventListener('contextmenu', blockiere)
  }, [aktiv, effektiv])

  // === DevTools-Shortcuts blockieren (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'locker') return

    function handleKeydown(e: KeyboardEvent) {
      // F12
      if (e.key === 'F12') { e.preventDefault(); return }
      // Ctrl+Shift+I/J/C (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault(); return
      }
      // Cmd+Option+I/J/C (Mac)
      if (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault(); return
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [aktiv, effektiv])

  // === Vollbild-Überwachung (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'locker' || !vollbildUnterstuetzt) return

    function handleFullscreenChange() {
      const istVollbild = !!document.fullscreenElement
      setVollbildAktiv(istVollbild)
      if (!istVollbild) {
        registriereVerstoss('vollbild-verlassen')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [aktiv, effektiv, vollbildUnterstuetzt, registriereVerstoss])

  // === Split-View-Erkennung (iPad, Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'locker' || geraet !== 'tablet') return

    const originalBreite = window.innerWidth

    function handleResize() {
      const aktuelleBreite = window.innerWidth
      if (aktuelleBreite < originalBreite * 0.9) {
        registriereVerstoss('split-view')
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [aktiv, effektiv, geraet, registriereVerstoss])

  // === iPad CSS-Massnahmen (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'locker') return

    document.body.style.webkitTouchCallout = 'none'
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'

    return () => {
      document.body.style.webkitTouchCallout = ''
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
    }
  }, [aktiv, effektiv])

  return {
    kontrollStufe,
    effektiveKontrollStufe: effektiv,
    geraet,
    vollbildAktiv,
    vollbildUnterstuetzt,
    verstossZaehler,
    maxVerstoesse,
    gesperrt,
    verstoesse,
    registriereVerstoss,
    entsperre,
    starteVollbild,
    neueVerstoesseSeitLetztemSync,
  }
}
```

- [ ] **Step 2: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`
Expected: Keine Fehler

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLockdown.ts
git commit -m "feat(lockdown): useLockdown-Hook mit Copy/Paste, Vollbild, DevTools, Verstoss-Zähler"
```

---

## Task 3: SuS-Overlays (Warnung + Sperre)

**Files:**
- Create: `src/components/VerstossOverlay.tsx`
- Create: `src/components/SperreOverlay.tsx`

- [ ] **Step 1: VerstossOverlay erstellen**

```typescript
// src/components/VerstossOverlay.tsx
import type { Verstoss } from '../types/lockdown'

interface Props {
  verstoss: Verstoss
  verstossZaehler: number
  maxVerstoesse: number
  onZurueck: () => void
}

const VERSTOSS_LABELS: Record<Verstoss['typ'], string> = {
  'tab-wechsel': 'Tab-Wechsel erkannt',
  'copy-versuch': 'Kopieren/Einfügen blockiert',
  'vollbild-verlassen': 'Vollbild verlassen',
  'split-view': 'Split-View erkannt',
}

export function VerstossOverlay({ verstoss, verstossZaehler, maxVerstoesse, onZurueck }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
      <div className="text-center text-white max-w-md px-6">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-3">
          {VERSTOSS_LABELS[verstoss.typ] || 'Verstoss erkannt'}
        </h2>
        <p className="text-red-300 font-semibold text-lg mb-4">
          Dieser Verstoss wurde protokolliert ({verstossZaehler} von {maxVerstoesse})
        </p>
        <p className="text-gray-300 mb-2">
          Das Verlassen der Prüfung ist nicht erlaubt.
        </p>
        <p className="text-gray-300 mb-6">
          Bei {maxVerstoesse} Verstössen wird die Prüfung gesperrt
          <br />und muss von der Lehrperson freigeschaltet werden.
        </p>
        <button
          onClick={onZurueck}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          Zurück zur Prüfung
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: SperreOverlay erstellen**

```typescript
// src/components/SperreOverlay.tsx
export function SperreOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
      <div className="text-center text-white max-w-md px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-3">Prüfung gesperrt</h2>
        <p className="text-red-300 font-semibold text-lg mb-4">
          Zu viele Verstösse
        </p>
        <p className="text-gray-300 mb-2">
          Deine Prüfung wurde gesperrt.
        </p>
        <p className="text-gray-300 mb-2">
          Wende dich an die Lehrperson zur Freischaltung.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Deine bisherigen Antworten sind gespeichert.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 4: Commit**

```bash
git add src/components/VerstossOverlay.tsx src/components/SperreOverlay.tsx
git commit -m "feat(lockdown): SuS-Overlays für Verstoss-Warnung und Sperre"
```

---

## Task 4: Lockdown in Layout + Startbildschirm integrieren

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/components/Startbildschirm.tsx`

- [ ] **Step 1: Layout.tsx — useLockdown einbinden**

In `Layout.tsx` den `useLockdown`-Hook einbinden. Der Hook braucht die `kontrollStufe` aus der Config.

Hinzufügen nach den bestehenden Hook-Aufrufen (`usePruefungsMonitoring`, `useTabKonflikt`):

```typescript
import { useLockdown } from '../hooks/useLockdown'
import { VerstossOverlay } from './VerstossOverlay'
import { SperreOverlay } from './SperreOverlay'
import type { KontrollStufe } from '../types/lockdown'

// Im Komponenten-Body:
const kontrollStufe = (config?.kontrollStufe as KontrollStufe) || 'standard'
const lockdown = useLockdown({
  kontrollStufe,
  aktiv: !!config && !abgegeben,
})

// Verstoss-Overlay State
const [zeigeVerstossOverlay, setZeigeVerstossOverlay] = useState(false)
const [letzterVerstoss, setLetzterVerstoss] = useState<Verstoss | null>(null)
const vorherigerZaehler = useRef(0)

// Bei neuem Verstoss: Overlay zeigen
useEffect(() => {
  if (lockdown.verstossZaehler > vorherigerZaehler.current && lockdown.verstossZaehler < lockdown.maxVerstoesse) {
    setLetzterVerstoss(lockdown.verstoesse[lockdown.verstoesse.length - 1])
    setZeigeVerstossOverlay(true)
  }
  vorherigerZaehler.current = lockdown.verstossZaehler
}, [lockdown.verstossZaehler])

// Im JSX, vor dem bestehenden Return:
{lockdown.gesperrt && <SperreOverlay />}
{zeigeVerstossOverlay && letzterVerstoss && !lockdown.gesperrt && (
  <VerstossOverlay
    verstoss={letzterVerstoss}
    verstossZaehler={lockdown.verstossZaehler}
    maxVerstoesse={lockdown.maxVerstoesse}
    onZurueck={() => setZeigeVerstossOverlay(false)}
  />
)}
```

- [ ] **Step 2: Startbildschirm.tsx — Vollbild beim Start**

Im `handleStart()` Vollbild triggern wenn Kontrollstufe ≥ Standard und Gerät es unterstützt:

```typescript
import { erkenneGeraet } from '../hooks/useGeraetErkennung'

// Im handleStart():
async function handleStart() {
  // Vollbild bei Standard/Streng auf Laptop
  const stufe = config.kontrollStufe || 'standard'
  const geraet = erkenneGeraet()
  if (stufe !== 'locker' && geraet === 'laptop') {
    try {
      const el = document.documentElement
      if (el.requestFullscreen) await el.requestFullscreen()
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen()
    } catch { /* SuS hat abgelehnt — wird als Verstoss geloggt via fullscreenchange */ }
  }

  if (wiederhergestellt) {
    setPhase('pruefung')
  } else {
    pruefungStarten(config, fragen)
  }
}
```

- [ ] **Step 3: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx src/components/Startbildschirm.tsx
git commit -m "feat(lockdown): Integration in Layout (Overlays) + Vollbild beim Start"
```

---

## Task 5: Types erweitern (Config + Monitoring + Heartbeat)

**Files:**
- Modify: `src/types/pruefung.ts`
- Modify: `src/types/monitoring.ts`
- Modify: `src/types/antworten.ts`

- [ ] **Step 1: PruefungsConfig erweitern**

In `src/types/pruefung.ts`, im `PruefungsConfig` Interface (nach `sebAusnahmen`):

```typescript
  kontrollStufe?: 'locker' | 'standard' | 'streng'  // Default: 'standard'
```

- [ ] **Step 2: SchuelerStatus erweitern**

In `src/types/monitoring.ts`, im `SchuelerStatus` Interface (nach `browserInfo`):

```typescript
  geraet?: 'laptop' | 'tablet' | 'unbekannt'
  vollbild?: boolean
  kontrollStufe?: 'locker' | 'standard' | 'streng'
  verstossZaehler?: number
  gesperrt?: boolean
  verstoesse?: Array<{ zeitpunkt: string; typ: string; dauer_sekunden?: number }>
```

- [ ] **Step 3: HeartbeatResponse erweitern**

In `src/types/monitoring.ts`, im `HeartbeatResponse` Interface:

```typescript
  kontrollStufeOverride?: 'locker' | 'standard' | 'streng'
  entsperrt?: boolean
```

- [ ] **Step 4: Unterbrechung-Typ erweitern**

In `src/types/antworten.ts`, den Unterbrechung-Typ erweitern:

```typescript
export interface Unterbrechung {
  zeitpunkt: string;
  dauer_sekunden: number;
  typ: 'heartbeat-ausfall' | 'focus-verloren' | 'seb-warnung' | 'tab-wechsel' | 'copy-versuch' | 'vollbild-verlassen' | 'split-view';
}
```

- [ ] **Step 5: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 6: Commit**

```bash
git add src/types/pruefung.ts src/types/monitoring.ts src/types/antworten.ts
git commit -m "feat(lockdown): Types erweitert (Config, Monitoring, Heartbeat)"
```

---

## Task 6: Heartbeat + API erweitern

**Files:**
- Modify: `src/services/pruefungApi.ts`
- Modify: `src/hooks/usePruefungsMonitoring.ts`

- [ ] **Step 1: pruefungApi.ts — Heartbeat-Felder erweitern**

Die bestehende `heartbeat()`-Funktion erweitern um neue Felder:

```typescript
export async function heartbeat(
  pruefungId: string,
  email: string,
  aktuelleFrage?: number,
  beantworteteFragen?: number,
  lockdownMeta?: {
    geraet: string
    vollbild: boolean
    kontrollStufe: string
    verstossZaehler: number
    gesperrt: boolean
    neusteVerstoesse: Array<{ zeitpunkt: string; typ: string; dauer_sekunden?: number }>
  }
): Promise<HeartbeatResponse> {
  // ... bestehender Code, im body zusätzlich:
  // ...(lockdownMeta ? { lockdownMeta } : {}),
}
```

- [ ] **Step 2: Neue API-Funktionen hinzufügen**

```typescript
// In pruefungApi.ts oder als eigenes lockdownApi.ts

export async function entsperreSuS(
  pruefungId: string, email: string, schuelerEmail: string
): Promise<{ success: boolean }> {
  return postJson('entsperreSuS', { pruefungId, email, schuelerEmail })
}

export async function setzeKontrollStufe(
  pruefungId: string, email: string, schuelerEmail: string, stufe: string
): Promise<{ success: boolean }> {
  return postJson('setzeKontrollStufe', { pruefungId, email, schuelerEmail, stufe })
}
```

- [ ] **Step 3: usePruefungsMonitoring.ts — Lockdown-Daten im Heartbeat senden**

Im Heartbeat-Effect (Zeile ~106-148) die Lockdown-Daten mitsenden. Der Hook bekommt die Lockdown-State als Parameter oder über einen globalen Ref.

Ansatz: `usePruefungsMonitoring` akzeptiert optionalen `lockdownRef`:

```typescript
// Im Heartbeat-Call:
const lockdownState = lockdownRef?.current
const response = await apiService.heartbeat(
  config.id, user.email, aktuelleFrageIndex, beantworteteFragen,
  lockdownState ? {
    geraet: lockdownState.geraet,
    vollbild: lockdownState.vollbildAktiv,
    kontrollStufe: lockdownState.effektiveKontrollStufe,
    verstossZaehler: lockdownState.verstossZaehler,
    gesperrt: lockdownState.gesperrt,
    neusteVerstoesse: lockdownState.neueVerstoesseSeitLetztemSync(),
  } : undefined
)

// Antwort auswerten: LP-Override
if (response.kontrollStufeOverride) {
  // Lockdown-Stufe anpassen (via Callback)
}
if (response.entsperrt) {
  // Entsperren (via Callback)
}
```

- [ ] **Step 4: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 5: Commit**

```bash
git add src/services/pruefungApi.ts src/hooks/usePruefungsMonitoring.ts
git commit -m "feat(lockdown): Heartbeat + API um Lockdown-Daten erweitert"
```

---

## Task 7: Apps Script Backend erweitern

**Files:**
- Modify: `apps-script-code.js`

**Wichtig:** Nach Änderungen muss der User den Code manuell in den Apps Script Editor kopieren + bestehende Bereitstellung aktualisieren (NICHT neue erstellen).

- [ ] **Step 1: heartbeat-Funktion erweitern**

In der `heartbeat()`-Funktion (Zeile ~899) die neuen Felder speichern:

```javascript
// Neue Spalten im Antworten-Sheet:
// geraet, vollbild, kontrollStufe, verstossZaehler, gesperrt, verstoesse

// Im Update-Block:
if (body.lockdownMeta) {
  setColumnValue(sheet, rowIndex, headers, 'geraet', body.lockdownMeta.geraet)
  setColumnValue(sheet, rowIndex, headers, 'vollbild', String(body.lockdownMeta.vollbild))
  setColumnValue(sheet, rowIndex, headers, 'kontrollStufe', body.lockdownMeta.kontrollStufe)
  setColumnValue(sheet, rowIndex, headers, 'verstossZaehler', body.lockdownMeta.verstossZaehler)
  setColumnValue(sheet, rowIndex, headers, 'gesperrt', String(body.lockdownMeta.gesperrt))

  // Verstoesse append (nicht überschreiben)
  if (body.lockdownMeta.neusteVerstoesse?.length > 0) {
    const bestehende = safeJsonParse(getColumnValue(sheet, rowIndex, headers, 'verstoesse'), [])
    const alle = [...bestehende, ...body.lockdownMeta.neusteVerstoesse]
    setColumnValue(sheet, rowIndex, headers, 'verstoesse', JSON.stringify(alle))
  }
}

// Antwort erweitern: kontrollStufeOverride + entsperrt prüfen
var kontrollStufeOverride = getColumnValue(sheet, rowIndex, headers, 'kontrollStufeOverride') || null
var entsperrt = getColumnValue(sheet, rowIndex, headers, 'entsperrt') === 'true'
if (entsperrt) {
  // Reset nach Lesen
  setColumnValue(sheet, rowIndex, headers, 'entsperrt', '')
}
// In Response aufnehmen:
// kontrollStufeOverride, entsperrt
```

- [ ] **Step 2: ladeMonitoring erweitern**

In `ladeMonitoring()` (Zeile ~1581) die neuen Felder zurückgeben:

```javascript
// Pro Schüler zusätzlich:
geraet: row.geraet || 'unbekannt',
vollbild: row.vollbild === 'true',
kontrollStufe: row.kontrollStufe || '',
verstossZaehler: Number(row.verstossZaehler) || 0,
gesperrt: row.gesperrt === 'true',
verstoesse: safeJsonParse(row.verstoesse, []),
```

- [ ] **Step 3: Neue Endpoints hinzufügen**

```javascript
// entsperreSuS
case 'entsperreSuS': {
  if (!email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur LP' })
  const sheet = findAntwortenSheet(body.pruefungId)
  if (!sheet) return jsonResponse({ error: 'Sheet nicht gefunden' })
  const data = getSheetData(sheet)
  const row = data.findIndex(r => r.email === body.schuelerEmail)
  if (row < 0) return jsonResponse({ error: 'SuS nicht gefunden' })
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  setColumnValue(sheet, row + 2, headers, 'entsperrt', 'true')
  setColumnValue(sheet, row + 2, headers, 'gesperrt', 'false')
  setColumnValue(sheet, row + 2, headers, 'verstossZaehler', '0')
  return jsonResponse({ success: true })
}

// setzeKontrollStufe
case 'setzeKontrollStufe': {
  if (!email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur LP' })
  const sheet = findAntwortenSheet(body.pruefungId)
  if (!sheet) return jsonResponse({ error: 'Sheet nicht gefunden' })
  const data = getSheetData(sheet)
  const row = data.findIndex(r => r.email === body.schuelerEmail)
  if (row < 0) return jsonResponse({ error: 'SuS nicht gefunden' })
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  setColumnValue(sheet, row + 2, headers, 'kontrollStufeOverride', body.stufe)
  return jsonResponse({ success: true })
}
```

- [ ] **Step 4: speichereConfig erweitern**

In `speichereConfig()` das Feld `kontrollStufe` aufnehmen (analog zu `zeitModus`).

- [ ] **Step 5: Commit**

```bash
git add apps-script-code.js
git commit -m "feat(lockdown): Apps Script — Heartbeat + Monitoring + 2 neue Endpoints"
```

---

## Task 8: LP-Seite — KontrollStufeSelect + VorbereitungPhase

**Files:**
- Create: `src/components/lp/KontrollStufeSelect.tsx`
- Modify: `src/components/lp/VorbereitungPhase.tsx`

- [ ] **Step 1: KontrollStufeSelect erstellen**

```typescript
// src/components/lp/KontrollStufeSelect.tsx
import type { KontrollStufe } from '../../types/lockdown'

interface Props {
  value: KontrollStufe
  onChange: (stufe: KontrollStufe) => void
  disabled?: boolean
  disabledStufen?: KontrollStufe[] // z.B. ['streng'] auf iPad
}

const STUFEN: { key: KontrollStufe; label: string; icon: string; beschreibung: string }[] = [
  { key: 'locker', label: 'Locker', icon: '🟢', beschreibung: 'Nur Logging + Warnung' },
  { key: 'standard', label: 'Standard', icon: '🟡', beschreibung: 'Copy/Paste-Block, Vollbild, 3 Verstösse → Sperre' },
  { key: 'streng', label: 'Streng', icon: '🔴', beschreibung: 'Sofort-Pause bei Verstoss, SEB empfohlen' },
]

export function KontrollStufeSelect({ value, onChange, disabled, disabledStufen = [] }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        Kontrollstufe
      </label>
      <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
        {STUFEN.map((s) => {
          const istDisabled = disabled || disabledStufen.includes(s.key)
          const istAktiv = value === s.key
          return (
            <button
              key={s.key}
              onClick={() => !istDisabled && onChange(s.key)}
              disabled={istDisabled}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                istAktiv
                  ? 'bg-blue-600 text-white'
                  : istDisabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
              } ${s.key !== 'locker' ? 'border-l border-slate-300 dark:border-slate-600' : ''}`}
            >
              {s.icon} {s.label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {STUFEN.find(s => s.key === value)?.beschreibung}
      </p>
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
        ℹ️ Auf iPads wird die Stufe automatisch angepasst (kein Vollbild möglich).
      </p>
    </div>
  )
}
```

- [ ] **Step 2: VorbereitungPhase.tsx — KontrollStufeSelect einbauen**

Nach dem Zeitzuschlag-Bereich (oder nach der Kursauswahl) einfügen:

```typescript
import { KontrollStufeSelect } from './KontrollStufeSelect'
import type { KontrollStufe } from '../../types/lockdown'

// Im State:
const [kontrollStufe, setKontrollStufe] = useState<KontrollStufe>(
  (config.kontrollStufe as KontrollStufe) || 'standard'
)

// Handler:
function handleKontrollStufeChange(stufe: KontrollStufe) {
  setKontrollStufe(stufe)
  onConfigUpdate?.({ kontrollStufe: stufe })
}

// Im JSX (nach Teilnehmer-Auswahl, vor "Weiter zur Lobby"):
<KontrollStufeSelect
  value={kontrollStufe}
  onChange={handleKontrollStufeChange}
/>
```

- [ ] **Step 3: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/KontrollStufeSelect.tsx src/components/lp/VorbereitungPhase.tsx
git commit -m "feat(lockdown): LP-Kontrollstufen-Auswahl in Vorbereitung"
```

---

## Task 9: LP-Monitoring — Verstoss-Spalte + Entsperren

**Files:**
- Modify: `src/components/lp/AktivPhase.tsx`

- [ ] **Step 1: Tabellen-Spalten anpassen**

Bestehende Spalten ersetzen mit neuer Reihenfolge:

```
Name | Status | Verstösse | Kontrolle | Gerät | Frage | Fortschritt
```

Im `<thead>`:
```tsx
<tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
  <th className="px-3 py-2">Name</th>
  <th className="px-3 py-2">Status</th>
  <th className="px-3 py-2">Verstösse</th>
  <th className="px-3 py-2">Kontrolle</th>
  <th className="px-3 py-2">Gerät</th>
  <th className="px-3 py-2">Frage</th>
  <th className="px-3 py-2">Fortschritt</th>
</tr>
```

- [ ] **Step 2: Verstoss-Zelle mit Tooltip + Entsperren**

```tsx
// Verstoss-Spalte pro SuS:
<td className="px-3 py-2">
  {s.gesperrt ? (
    <div className="flex items-center gap-2">
      <span className="text-red-600 font-bold cursor-help" title={verstossTooltip(s)}>
        🔒 {s.verstossZaehler}/{maxVerstoesse}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); handleEntsperren(s.email) }}
        className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-semibold"
      >
        Entsperren
      </button>
    </div>
  ) : s.verstossZaehler > 0 ? (
    <span
      className={`font-semibold cursor-help ${s.verstossZaehler >= 2 ? 'text-red-600' : 'text-amber-600'}`}
      title={verstossTooltip(s)}
    >
      ⚠️ {s.verstossZaehler}/{maxVerstoesse}
    </span>
  ) : (
    <span className="text-slate-400">—</span>
  )}
</td>

// Tooltip-Helper:
function verstossTooltip(s: SchuelerStatus): string {
  if (!s.verstoesse?.length) return 'Keine Verstösse'
  return s.verstoesse.map(v =>
    `${new Date(v.zeitpunkt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} — ${v.typ}${v.dauer_sekunden ? ` (${v.dauer_sekunden}s)` : ''}`
  ).join('\n')
}
```

- [ ] **Step 3: Entsperren-Handler**

```typescript
async function handleEntsperren(schuelerEmail: string) {
  await apiService.entsperreSuS(pruefungId, user.email, schuelerEmail)
  // Optimistic UI: lokaler State Update
  ladeDaten()
}
```

- [ ] **Step 4: Kontroll-Stufe + Gerät-Spalten**

```tsx
// Kontrolle-Spalte:
<td className="px-3 py-2 text-xs">
  {s.kontrollStufe === config.kontrollStufe ? (
    <span>{stufeIcon(s.kontrollStufe)} {s.kontrollStufe}</span>
  ) : (
    <span className="text-amber-700" title="Automatisch angepasst (Gerät)">
      {stufeIcon(config.kontrollStufe)}→{stufeIcon(s.kontrollStufe)} auto
    </span>
  )}
</td>

// Gerät-Spalte:
<td className="px-3 py-2 text-sm">
  {s.geraet === 'tablet' ? '📱 iPad' : s.geraet === 'laptop' ? '💻' : '—'}
</td>

// Helper:
function stufeIcon(stufe?: string): string {
  return stufe === 'locker' ? '🟢' : stufe === 'streng' ? '🔴' : '🟡'
}
```

- [ ] **Step 5: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 6: Commit**

```bash
git add src/components/lp/AktivPhase.tsx
git commit -m "feat(lockdown): LP-Monitoring mit Verstoss-Spalte, Gerät, Kontrollgrad, Entsperren"
```

---

## Task 10: Multi-Prüfungs-Dashboard

**Files:**
- Create: `src/components/lp/MultiDurchfuehrenDashboard.tsx`
- Modify: `src/components/App.tsx`
- Modify: `src/components/lp/DurchfuehrenDashboard.tsx`

- [ ] **Step 1: Multi-Dashboard Container erstellen**

```typescript
// src/components/lp/MultiDurchfuehrenDashboard.tsx
import { useState, useEffect, useCallback } from 'react'
import { DurchfuehrenDashboard } from './DurchfuehrenDashboard'
import * as apiService from '../../services/apiService'
import { useAuthStore } from '../../store/authStore'
import type { MonitoringDaten } from '../../types/monitoring'

interface Props {
  pruefungIds: string[]
}

export function MultiDurchfuehrenDashboard({ pruefungIds }: Props) {
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<'vorbereitung' | 'live' | 'ergebnisse' | 'korrektur'>('vorbereitung')
  const [selectedPruefung, setSelectedPruefung] = useState<string>(pruefungIds[0])
  const [monitoringDaten, setMonitoringDaten] = useState<Map<string, MonitoringDaten>>(new Map())

  // Paralleles Polling für Live-Monitoring
  const ladeAlleDaten = useCallback(async () => {
    if (!user) return
    const results = await Promise.allSettled(
      pruefungIds.map(id => apiService.ladeMonitoring(id, user.email))
    )
    const neueMap = new Map<string, MonitoringDaten>()
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) neueMap.set(pruefungIds[i], r.value)
    })
    setMonitoringDaten(neueMap)
  }, [pruefungIds, user])

  useEffect(() => {
    if (activeTab !== 'live') return
    ladeAlleDaten()
    const interval = setInterval(ladeAlleDaten, 5000)
    return () => clearInterval(interval)
  }, [activeTab, ladeAlleDaten])

  // Live-Tab: Zusammengefasstes Monitoring
  // Vorbereitung/Ergebnisse/Korrektur: Pro Prüfung (selectedPruefung)
  if (activeTab === 'live') {
    return (
      <div>
        {/* Tab-Navigation */}
        {/* Zusammenfassungs-Badges */}
        {/* Pro Prüfung gruppierte SuS-Liste */}
        {pruefungIds.map(id => {
          const daten = monitoringDaten.get(id)
          if (!daten) return null
          return (
            <PruefungsGruppe key={id} daten={daten} /* ... */ />
          )
        })}
      </div>
    )
  }

  // Andere Tabs: Einzelnes Dashboard
  return <DurchfuehrenDashboard pruefungId={selectedPruefung} />
}
```

Hinweis: Die PruefungsGruppe-Komponente extrahiert die SuS-Tabelle aus AktivPhase in eine wiederverwendbare Komponente.

- [ ] **Step 2: App.tsx — `?ids=` Parameter**

In `App.tsx` den Multi-Modus erkennen:

```typescript
const pruefungIdAusUrl = new URLSearchParams(window.location.search).get('id')
const pruefungIdsAusUrl = new URLSearchParams(window.location.search).get('ids')?.split(',').filter(Boolean)

// Routing:
if (user.rolle === 'lp') {
  if (pruefungIdsAusUrl && pruefungIdsAusUrl.length > 1) {
    return <MultiDurchfuehrenDashboard pruefungIds={pruefungIdsAusUrl} />
  }
  if (pruefungIdAusUrl) {
    return <DurchfuehrenDashboard pruefungId={pruefungIdAusUrl} />
  }
  return <LPStartseite />
}
```

- [ ] **Step 3: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/MultiDurchfuehrenDashboard.tsx src/components/App.tsx
git commit -m "feat(multi): Multi-Prüfungs-Dashboard mit zusammengefasstem Monitoring"
```

---

## Task 11: Integration + visibilitychange in Lockdown

**Files:**
- Modify: `src/hooks/usePruefungsMonitoring.ts`

- [ ] **Step 1: visibilitychange-Logik mit Lockdown verbinden**

Der bestehende `visibilitychange`-Handler (Zeile ~153-177) loggt nur als Unterbrechung. Im Lockdown-Modus soll er zusätzlich `registriereVerstoss` aufrufen.

Ansatz: Der Handler prüft ob eine `registriereVerstoss`-Callback vorhanden ist:

```typescript
// Im visibilitychange-Handler, nach dem bestehenden addUnterbrechung:
if (dauerSekunden >= 2) {
  addUnterbrechung({ zeitpunkt, dauer_sekunden: dauerSekunden, typ: 'focus-verloren' })
  // Lockdown-Verstoss registrieren wenn aktiv
  if (onTabWechsel) onTabWechsel(dauerSekunden)
}
```

Die `onTabWechsel`-Callback wird von Layout.tsx übergeben und ruft `lockdown.registriereVerstoss('tab-wechsel', dauer)` auf.

- [ ] **Step 2: `tsc -b` prüfen**

Run: `cd ExamLab && npx tsc -b`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePruefungsMonitoring.ts
git commit -m "feat(lockdown): visibilitychange mit Lockdown-Verstoss verbunden"
```

---

## Task 12: Abschluss — Build + Deploy-Test

- [ ] **Step 1: Vollständiger Build**

Run: `cd ExamLab && npx tsc -b && npm run build`
Expected: Keine Fehler

- [ ] **Step 2: Apps Script manuell aktualisieren**

Hinweis an User: `apps-script-code.js` in den Apps Script Editor kopieren → Bereitstellungen verwalten → bestehende Version aktualisieren (Stift-Icon). NICHT "Neue Bereitstellung" (ändert URL).

- [ ] **Step 3: HANDOFF.md aktualisieren**

Neue Session-Sektion in `ExamLab/HANDOFF.md` mit:
- Erledigte Tasks
- Geänderte Dateien
- Apps Script Änderungen (manuell kopieren!)
- Offene Punkte

- [ ] **Step 4: Commit + Push**

```bash
git add -A
git commit -m "feat: Multi-Prüfungs-Dashboard + Soft-Lockdown (3 Stufen)"
git push
```
