# UP-8 — Synergy-Config aus dem Source-Code lösen — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die hardcodierten `APPS_SCRIPT_URL` + `LP_EMAIL` aus `synergyService.ts` und `pruefungBridge.ts` in einen globalen, zur Laufzeit über ein Einstellungs-UI setzbaren Zustand-Store verlagern.

**Architecture:** Neuer Zustand-Store mit `persist`-Middleware (globaler localStorage-Key `synergy-config`). Eine neue Einstellungs-Sektion schreibt die Config; die beiden Service-Module lesen sie zur Aufruf-Zeit via `getState()`; die UI-Konsumenten gaten reaktiv über einen Selektor-Hook. Keine Migration (Planer nicht im Betrieb).

**Tech Stack:** React 19, TypeScript, Zustand 5 (`persist`-Middleware), vitest, @testing-library, Tailwind.

**Spec:** `Unterrichtsplaner/docs/superpowers/specs/2026-05-20-up8-synergy-config-design.md`

**Branch:** `feature/up8-synergy-config` (bereits angelegt, Spec dort committet).

**Skills:** @superpowers:test-driven-development für Task 1 + Task 2 (reine Logik, echter Red→Green-Zyklus).

---

## ⚠️ Voraussetzung vor der Umsetzung

UP-8 braucht das vitest-Setup aus **UP-7**. UP-7 liegt auf **PR #3** und ist noch nicht in `main`.
**Vor dem Start dieses Plans:**
1. PR #3 nach `main` mergen (inkl. `git push origin main:preview`-Sync).
2. `feature/up8-synergy-config` auf das aktualisierte `main` rebasen:
   `git checkout feature/up8-synergy-config && git rebase main`
3. `cd Unterrichtsplaner && npm test` muss laufen (die UP-7-27-Tests grün) — erst dann mit Task 1 beginnen.

---

## File Structure

**Neu:**
- `Unterrichtsplaner/src/store/synergyConfigStore.ts` — Zustand-Store + `istSynergyKonfiguriert`-Prädikat + `useSynergyKonfiguriert`-Hook.
- `Unterrichtsplaner/src/store/synergyConfigStore.test.ts` — Tests für Store + Prädikat.
- `Unterrichtsplaner/src/utils/synergyConfigValidation.ts` — reine `validateSynergyConfig`-Funktion.
- `Unterrichtsplaner/src/utils/synergyConfigValidation.test.ts` — Tests dazu.
- `Unterrichtsplaner/src/components/settings/SynergyConfigSection.tsx` — Config-Eingabe-UI.

**Geändert:**
- `Unterrichtsplaner/src/services/synergyService.ts` — Konstanten raus, Store-Read.
- `Unterrichtsplaner/src/services/pruefungBridge.ts` — Konstanten raus, Store-Read.
- `Unterrichtsplaner/src/components/SettingsPanel.tsx` — `SynergyConfigSection` einhängen.
- `Unterrichtsplaner/src/components/settings/KursImportButton.tsx` — reaktives Gating.
- `Unterrichtsplaner/src/components/settings/NotenStandSection.tsx` — reaktives Gating + Hinweistext.
- `Unterrichtsplaner/src/hooks/useSynergyData.ts` — reaktiver Config-Guard.
- `Unterrichtsplaner/HANDOFF.md` — UP-8 als erledigt markieren.

Alle Pfade relativ zum Repo-Root. Befehle laufen aus `Unterrichtsplaner/`, sofern nicht anders angegeben.

---

## Task 1: `synergyConfigStore` — Store + Prädikat (TDD)

**Files:**
- Create: `Unterrichtsplaner/src/store/synergyConfigStore.ts`
- Create: `Unterrichtsplaner/src/store/synergyConfigStore.test.ts`

- [ ] **Step 1: Store anlegen**

`src/store/synergyConfigStore.ts`:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SynergyConfigState {
  appsScriptUrl: string
  lpEmail: string
  setConfig: (patch: Partial<{ appsScriptUrl: string; lpEmail: string }>) => void
}

export const useSynergyConfigStore = create<SynergyConfigState>()(
  persist(
    (set) => ({
      appsScriptUrl: '',
      lpEmail: '',
      setConfig: (patch) => set(patch),
    }),
    { name: 'synergy-config', version: 1 },
  ),
)

/** Reine Prüfung, ob die Synergy-Config vollständig gesetzt ist. */
export function istSynergyKonfiguriert(state: { appsScriptUrl: string; lpEmail: string }): boolean {
  return state.appsScriptUrl.trim() !== '' && state.lpEmail.trim() !== ''
}

/** Reaktiver Hook: true, sobald URL + E-Mail gesetzt sind. */
export function useSynergyKonfiguriert(): boolean {
  return useSynergyConfigStore(istSynergyKonfiguriert)
}
```

- [ ] **Step 2: Testdatei schreiben**

`src/store/synergyConfigStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSynergyConfigStore, istSynergyKonfiguriert } from './synergyConfigStore'

describe('synergyConfigStore', () => {
  beforeEach(() => {
    useSynergyConfigStore.setState({ appsScriptUrl: '', lpEmail: '' })
  })

  it('startet mit leeren Feldern', () => {
    const s = useSynergyConfigStore.getState()
    expect(s.appsScriptUrl).toBe('')
    expect(s.lpEmail).toBe('')
  })

  it('setConfig setzt ein einzelnes Feld, ohne das andere zu loeschen', () => {
    useSynergyConfigStore.getState().setConfig({ appsScriptUrl: 'https://x.test' })
    expect(useSynergyConfigStore.getState().appsScriptUrl).toBe('https://x.test')
    expect(useSynergyConfigStore.getState().lpEmail).toBe('')
    useSynergyConfigStore.getState().setConfig({ lpEmail: 'a@b.ch' })
    expect(useSynergyConfigStore.getState().appsScriptUrl).toBe('https://x.test')
    expect(useSynergyConfigStore.getState().lpEmail).toBe('a@b.ch')
  })
})

describe('istSynergyKonfiguriert', () => {
  it('false wenn beide Felder leer sind', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: '', lpEmail: '' })).toBe(false)
  })
  it('false wenn nur ein Feld gesetzt ist', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: 'https://x.test', lpEmail: '' })).toBe(false)
    expect(istSynergyKonfiguriert({ appsScriptUrl: '', lpEmail: 'a@b.ch' })).toBe(false)
  })
  it('false bei reinen Whitespace-Werten', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: '   ', lpEmail: '   ' })).toBe(false)
  })
  it('true wenn beide Felder gesetzt sind', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: 'https://x.test', lpEmail: 'a@b.ch' })).toBe(true)
  })
})
```

- [ ] **Step 3: Tests laufen lassen**

Run: `npx vitest run src/store/synergyConfigStore.test.ts`
Expected: PASS — alle Tests grün (Store + Prädikat sind in Step 1 bereits korrekt angelegt; dies ist ein Charakterisierungs-Lauf des frisch geschriebenen Codes).

- [ ] **Step 4: tsc verifizieren**

Run: `npx tsc -b`
Expected: Exit 0.

- [ ] **Step 5: Commit**

```bash
git add Unterrichtsplaner/src/store/synergyConfigStore.ts Unterrichtsplaner/src/store/synergyConfigStore.test.ts
git commit -m "feat(planer): synergyConfigStore — globaler Config-Store"
```

---

## Task 2: `validateSynergyConfig` — Validierungs-Funktion (TDD)

**Files:**
- Create: `Unterrichtsplaner/src/utils/synergyConfigValidation.ts`
- Create: `Unterrichtsplaner/src/utils/synergyConfigValidation.test.ts`

- [ ] **Step 1: Testdatei zuerst schreiben**

`src/utils/synergyConfigValidation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateSynergyConfig } from './synergyConfigValidation'

describe('validateSynergyConfig', () => {
  it('akzeptiert eine gueltige URL + E-Mail (leeres Fehler-Objekt)', () => {
    expect(validateSynergyConfig('https://script.google.com/macros/s/abc/exec', 'lp@gymhofwil.ch')).toEqual({})
  })
  it('meldet leere URL', () => {
    expect(validateSynergyConfig('', 'lp@gymhofwil.ch').urlError).toBeDefined()
  })
  it('meldet URL ohne https://', () => {
    expect(validateSynergyConfig('http://x.test', 'lp@gymhofwil.ch').urlError).toBeDefined()
  })
  it('meldet nicht-parsebare URL', () => {
    expect(validateSynergyConfig('https://', 'lp@gymhofwil.ch').urlError).toBeDefined()
  })
  it('meldet leere E-Mail', () => {
    expect(validateSynergyConfig('https://x.test', '').emailError).toBeDefined()
  })
  it('meldet E-Mail ohne @', () => {
    expect(validateSynergyConfig('https://x.test', 'invalid').emailError).toBeDefined()
  })
  it('toleriert umgebenden Whitespace', () => {
    expect(validateSynergyConfig('  https://x.test  ', '  lp@gymhofwil.ch  ')).toEqual({})
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `npx vitest run src/utils/synergyConfigValidation.test.ts`
Expected: FAIL — `validateSynergyConfig` existiert noch nicht.

- [ ] **Step 3: Funktion implementieren**

`src/utils/synergyConfigValidation.ts`:
```ts
export interface SynergyConfigValidation {
  urlError?: string
  emailError?: string
}

/** Prüft URL + E-Mail der Synergy-Config. Leeres Ergebnis = gültig. */
export function validateSynergyConfig(url: string, email: string): SynergyConfigValidation {
  const result: SynergyConfigValidation = {}

  const u = url.trim()
  if (u === '') {
    result.urlError = 'URL darf nicht leer sein.'
  } else if (!u.startsWith('https://')) {
    result.urlError = 'URL muss mit https:// beginnen.'
  } else {
    try {
      new URL(u)
    } catch {
      result.urlError = 'URL ist nicht gültig.'
    }
  }

  const e = email.trim()
  if (e === '') {
    result.emailError = 'E-Mail darf nicht leer sein.'
  } else if (!e.includes('@')) {
    result.emailError = 'E-Mail muss ein @ enthalten.'
  }

  return result
}
```

- [ ] **Step 4: Test laufen lassen — muss grün sein**

Run: `npx vitest run src/utils/synergyConfigValidation.test.ts`
Expected: PASS — alle 7 Tests grün.

- [ ] **Step 5: tsc verifizieren**

Run: `npx tsc -b`
Expected: Exit 0.

- [ ] **Step 6: Commit**

```bash
git add Unterrichtsplaner/src/utils/synergyConfigValidation.ts Unterrichtsplaner/src/utils/synergyConfigValidation.test.ts
git commit -m "feat(planer): validateSynergyConfig — Eingabe-Validierung"
```

---

## Task 3: `SynergyConfigSection` — Config-UI + Einbindung

**Files:**
- Create: `Unterrichtsplaner/src/components/settings/SynergyConfigSection.tsx`
- Modify: `Unterrichtsplaner/src/components/SettingsPanel.tsx`

- [ ] **Step 1: `SynergyConfigSection.tsx` anlegen**

`src/components/settings/SynergyConfigSection.tsx`:
```tsx
import { useState } from 'react'
import { useToast } from '@gymhofwil/shared'
import { Section } from './shared'
import { useSynergyConfigStore, useSynergyKonfiguriert } from '../../store/synergyConfigStore'
import { validateSynergyConfig } from '../../utils/synergyConfigValidation'

export function SynergyConfigSection() {
  const toast = useToast()
  const appsScriptUrl = useSynergyConfigStore((s) => s.appsScriptUrl)
  const lpEmail = useSynergyConfigStore((s) => s.lpEmail)
  const setConfig = useSynergyConfigStore((s) => s.setConfig)
  const konfiguriert = useSynergyKonfiguriert()

  const [urlInput, setUrlInput] = useState(appsScriptUrl)
  const [emailInput, setEmailInput] = useState(lpEmail)
  const [urlError, setUrlError] = useState<string | undefined>(undefined)
  const [emailError, setEmailError] = useState<string | undefined>(undefined)

  const handleSave = () => {
    const { urlError: ue, emailError: ee } = validateSynergyConfig(urlInput, emailInput)
    setUrlError(ue)
    setEmailError(ee)
    if (ue || ee) return
    setConfig({ appsScriptUrl: urlInput.trim(), lpEmail: emailInput.trim() })
    toast.success('Synergy-Konfiguration gespeichert')
  }

  return (
    <Section title="🔗 Synergy-Verbindung">
      <div className="space-y-3">
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {konfiguriert
            ? '✓ Konfiguriert — Kurs-Import und Noten-Stand sind aktiv.'
            : 'Nicht konfiguriert. Apps-Script-URL und LP-E-Mail eintragen, um Kurs-Import und Noten-Stand zu aktivieren.'}
        </p>

        <label className="block">
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>Apps-Script-URL</span>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full mt-0.5 px-2 py-1 rounded text-[12px]"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          {urlError && <span className="text-[11px] text-red-400">{urlError}</span>}
        </label>

        <label className="block">
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>Lehrperson-E-Mail</span>
          <input
            type="text"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="vorname.name@gymhofwil.ch"
            className="w-full mt-0.5 px-2 py-1 rounded text-[12px]"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          {emailError && <span className="text-[11px] text-red-400">{emailError}</span>}
        </label>

        <button
          onClick={handleSave}
          className="px-3 py-1 rounded text-[12px] font-medium cursor-pointer"
          style={{ background: 'var(--text-link)', color: '#fff' }}
        >
          Speichern
        </button>
      </div>
    </Section>
  )
}
```

Hinweis: Styling-Tokens (`var(--bg-primary)`, `var(--text-link)`, `text-[12px]`, `Section`) sind aus `KursImportButton.tsx` / `NotenStandSection.tsx` übernommen — konsistent halten.

- [ ] **Step 2: `SynergyConfigSection` in `SettingsPanel.tsx` importieren**

In `src/components/SettingsPanel.tsx` bei den bestehenden Settings-Imports (in der Nähe von `import { NotenStandSection } from './settings/NotenStandSection'` und `import { KursImportButton } from './settings/KursImportButton'`) ergänzen:
```tsx
import { SynergyConfigSection } from './settings/SynergyConfigSection';
```

- [ ] **Step 3: `SynergyConfigSection` rendern**

In `src/components/SettingsPanel.tsx` die Zeile `<NotenStandSection />` suchen. **Direkt davor** einfügen:
```tsx
      <SynergyConfigSection />
```
Resultat — die Config-Sektion steht unmittelbar vor der Noten-Stand-Sektion:
```tsx
      <SynergyConfigSection />

      <NotenStandSection />
```

- [ ] **Step 4: tsc + Tests + Build verifizieren**

Run: `npx tsc -b`
Expected: Exit 0.
Run: `npm test`
Expected: grün (UP-7-Tests + Task-1/2-Tests).
Run: `npm run build`
Expected: Build erfolgreich.

- [ ] **Step 5: Commit**

```bash
git add Unterrichtsplaner/src/components/settings/SynergyConfigSection.tsx Unterrichtsplaner/src/components/SettingsPanel.tsx
git commit -m "feat(planer): SynergyConfigSection — Config-Eingabe in den Einstellungen"
```

---

## Task 4: Service-Refactor — Config aus dem Store lesen

`synergyService.ts` und `pruefungBridge.ts` verlieren die Modul-Konstanten und lesen die Config zur Aufruf-Zeit aus dem Store. `istKonfiguriert()` bleibt vorerst (Task 5 entfernt es) — neu über den Store implementiert, damit dieser Commit tsc-clean ist und die Konsumenten unverändert funktionieren.

**Files:**
- Modify: `Unterrichtsplaner/src/services/synergyService.ts`
- Modify: `Unterrichtsplaner/src/services/pruefungBridge.ts`

- [ ] **Step 1: `synergyService.ts` — Konstanten ersetzen**

Am Dateianfang den Import ergänzen (nach dem Kopfkommentar):
```ts
import { useSynergyConfigStore, istSynergyKonfiguriert } from '../store/synergyConfigStore'
```
Die Zeilen `// PLACEHOLDER: ...`, `const APPS_SCRIPT_URL = '...'`, `// LP-E-Mail ...` und `const LP_EMAIL = '...'` **ersatzlos entfernen**. `const CACHE_TTL_MS = ...` bleibt.

- [ ] **Step 2: `synergyService.ts` — `fetchFromBackend` auf Store umstellen**

Die Funktion `fetchFromBackend` so anpassen:
```ts
async function fetchFromBackend<T>(action: string, params: Record<string, string> = {}): Promise<T | null> {
  const { appsScriptUrl, lpEmail } = useSynergyConfigStore.getState()
  if (!appsScriptUrl || !lpEmail) return null
  try {
    const url = new URL(appsScriptUrl)
    url.searchParams.set('action', action)
    url.searchParams.set('email', lpEmail)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url.toString())
    if (!res.ok) return null
    return await res.json() as T
  } catch { return null }
}
```

- [ ] **Step 3: `synergyService.ts` — `istKonfiguriert` auf Store umstellen**

Die bestehende `istKonfiguriert`-Funktion ersetzen durch:
```ts
export function istKonfiguriert(): boolean {
  return istSynergyKonfiguriert(useSynergyConfigStore.getState())
}
```

- [ ] **Step 4: `pruefungBridge.ts` — Konstanten ersetzen**

Am Dateianfang (nach dem Kopfkommentar) ergänzen:
```ts
import { useSynergyConfigStore, istSynergyKonfiguriert } from '../store/synergyConfigStore'
```
Die Zeilen `const APPS_SCRIPT_URL = '...'` und `const LP_EMAIL = '...'` ersatzlos entfernen. `CACHE_TTL_MS`, `CACHE_KEY_PRUEFUNGEN`, `CACHE_KEY_NOTENSTAND` bleiben.

- [ ] **Step 5: `pruefungBridge.ts` — `ladePruefungsDaten` auf Store umstellen**

Den Anfang von `ladePruefungsDaten` so anpassen (Guard + URL-Aufbau):
```ts
export async function ladePruefungsDaten(): Promise<{ badges: PruefungBadge[]; notenStand: NotenStandInfo[] } | null> {
  const { appsScriptUrl, lpEmail } = useSynergyConfigStore.getState()
  if (!appsScriptUrl || !lpEmail) return null

  try {
    const url = new URL(appsScriptUrl)
    url.searchParams.set('action', 'ladeTrackerDaten')
    url.searchParams.set('email', lpEmail)
    // ... Rest der Funktion unverändert ...
```
Der restliche Funktionskörper (Response-Parsing, Badge-/NotenStand-Transformation, `setCache`, `return`) bleibt unverändert.

- [ ] **Step 6: `pruefungBridge.ts` — `istKonfiguriert` auf Store umstellen**

Die bestehende `istKonfiguriert`-Funktion ersetzen durch:
```ts
export function istKonfiguriert(): boolean {
  return istSynergyKonfiguriert(useSynergyConfigStore.getState())
}
```

- [ ] **Step 7: tsc + Build verifizieren**

Run: `npx tsc -b`
Expected: Exit 0 — keine Konstanten mehr, keine ungenutzten Importe.
Run: `npm run build`
Expected: Build erfolgreich.

- [ ] **Step 8: Commit**

```bash
git add Unterrichtsplaner/src/services/synergyService.ts Unterrichtsplaner/src/services/pruefungBridge.ts
git commit -m "refactor(planer): Synergy-Services lesen Config aus dem Store"
```

---

## Task 5: Konsumenten-Reaktivität + `istKonfiguriert`-Exports entfernen

Die drei Konsumenten gaten künftig reaktiv über `useSynergyKonfiguriert()`. Danach importiert nichts mehr `istKonfiguriert` — die Exports werden aus beiden Services entfernt. Alles in einem Commit, damit jeder Zwischenzustand tsc-clean ist.

**Files:**
- Modify: `Unterrichtsplaner/src/components/settings/KursImportButton.tsx`
- Modify: `Unterrichtsplaner/src/components/settings/NotenStandSection.tsx`
- Modify: `Unterrichtsplaner/src/hooks/useSynergyData.ts`
- Modify: `Unterrichtsplaner/src/services/synergyService.ts`
- Modify: `Unterrichtsplaner/src/services/pruefungBridge.ts`

- [ ] **Step 1: `KursImportButton.tsx` umstellen**

Den Import `import { istKonfiguriert } from '../../services/pruefungBridge';` (Zeile 4) **ersetzen** durch:
```ts
import { useSynergyKonfiguriert } from '../../store/synergyConfigStore';
```
In der Komponente `KursImportButton`, direkt nach `const toast = useToast();`, einfügen:
```ts
  const konfiguriert = useSynergyKonfiguriert();
```
Die Zeile `if (!istKonfiguriert()) return null;` ändern zu:
```ts
  if (!konfiguriert) return null;
```
(Der Hook steht damit vor dem Early-Return — React-Hooks-Regel erfüllt, `code-quality.md` S130.)

- [ ] **Step 2: `NotenStandSection.tsx` umstellen**

Den Import `import { istKonfiguriert } from '../../services/pruefungBridge';` (Zeile 4) **ersetzen** durch:
```ts
import { useSynergyKonfiguriert } from '../../store/synergyConfigStore';
```
Die Zeile `import type { NotenStandInfo } from '../../services/pruefungBridge';` bleibt unverändert.
In der Komponente `NotenStandSection`, direkt nach `const { notenStand, loading, error, cacheAge, refresh } = useSynergyData();`, einfügen:
```ts
  const konfiguriert = useSynergyKonfiguriert();
```
Die Zeile `if (!istKonfiguriert()) {` ändern zu `if (!konfiguriert) {`. Im zugehörigen Hinweistext den jetzt falschen Satz anpassen:
```tsx
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Nicht konfiguriert. Apps-Script-URL und LP-E-Mail in der Sektion „Synergy-Verbindung" eintragen.
        </p>
```

- [ ] **Step 3: `useSynergyData.ts` umstellen**

Den Import-Block aus `../services/pruefungBridge` so ändern, dass `istKonfiguriert` entfällt:
```ts
import {
  ladePruefungsDaten,
  getPruefungsCacheAlter,
  type PruefungBadge,
  type NotenStandInfo,
} from '../services/pruefungBridge';
import { useSynergyKonfiguriert } from '../store/synergyConfigStore';
```
In `useSynergyData`, nach den `useState`-Zeilen und vor `const laden = ...`, einfügen:
```ts
  const konfiguriert = useSynergyKonfiguriert();
```
Die `laden`-`useCallback` so ändern, dass sie den reaktiven Wert nutzt und in den Deps führt:
```ts
  const laden = useCallback(async () => {
    if (!konfiguriert) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ladePruefungsDaten();
      if (result) {
        setBadges(result.badges);
        setNotenStand(result.notenStand);
      }
      setCacheAge(getPruefungsCacheAlter());
    } catch {
      setError('Prüfungsdaten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [konfiguriert]);
```
Das bestehende `useEffect(() => { laden(); }, [laden]);` bleibt — es läuft dadurch erneut, sobald die Config gesetzt wird (`konfiguriert` flippt → `laden` neu → Effect neu). Damit lädt der Noten-Stand nach dem Speichern **ohne Reload**.

- [ ] **Step 4: `istKonfiguriert`-Export aus `synergyService.ts` entfernen**

Die gesamte `istKonfiguriert`-Funktion (in Task 4 Step 3 auf den Store umgestellt) **löschen**. Falls `istSynergyKonfiguriert` dadurch im Import ungenutzt wird, den Import auf `import { useSynergyConfigStore } from '../store/synergyConfigStore'` reduzieren.

- [ ] **Step 5: `istKonfiguriert`-Export aus `pruefungBridge.ts` entfernen**

Die gesamte `istKonfiguriert`-Funktion **löschen**. Falls `istSynergyKonfiguriert` dadurch ungenutzt wird, den Import auf `import { useSynergyConfigStore } from '../store/synergyConfigStore'` reduzieren.

- [ ] **Step 6: Audit — kein `istKonfiguriert` mehr übrig**

Run: `grep -rn "istKonfiguriert" Unterrichtsplaner/src`
Expected: keine Treffer.

- [ ] **Step 7: tsc + Tests + Build verifizieren**

Run: `npx tsc -b`
Expected: Exit 0.
Run: `npm test`
Expected: grün.
Run: `npm run build`
Expected: Build erfolgreich.

- [ ] **Step 8: Commit**

```bash
git add Unterrichtsplaner/src/components/settings/KursImportButton.tsx Unterrichtsplaner/src/components/settings/NotenStandSection.tsx Unterrichtsplaner/src/hooks/useSynergyData.ts Unterrichtsplaner/src/services/synergyService.ts Unterrichtsplaner/src/services/pruefungBridge.ts
git commit -m "refactor(planer): Synergy-Konsumenten gaten reaktiv ueber den Store"
```

---

## Task 6: HANDOFF aktualisieren + Gesamt-Verifikation

**Files:**
- Modify: `Unterrichtsplaner/HANDOFF.md`

- [ ] **Step 1: Gesamt-Verifikation**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc Exit 0; `npm test` grün (UP-7-Tests + die neuen UP-8-Tests); Build erfolgreich.

- [ ] **Step 2: Audit — keine hardcodierten Werte mehr**

Run (aus dem Repo-Root): `grep -rn "APPS_SCRIPT_URL\|LP_EMAIL\|script.google.com/macros" Unterrichtsplaner/src`
Expected: keine Treffer (die Konstanten und die hardcodierte URL sind vollständig entfernt).

- [ ] **Step 3: `HANDOFF.md` aktualisieren**

In `Unterrichtsplaner/HANDOFF.md`:
- In der Tabelle „Offene Punkte" die Zeile **UP-8** als erledigt markieren (Stil wie UP-5/UP-6: `~~UP-8~~` + `**… ✅ erledigt …**`, Priorität-Spalte auf `erledigt`).
- Unter „Letzte Sessions" einen Eintrag für UP-8 ergänzen (gleiche Struktur wie die übrigen Einträge): globaler `synergyConfigStore`, Config-UI `SynergyConfigSection` in den Einstellungen, Service-Refactor (`synergyService` + `pruefungBridge` lesen aus dem Store), reaktives Gating der Konsumenten, hardcodierte `APPS_SCRIPT_URL` + `LP_EMAIL` entfernt.
- Header/Versionszeile nur anfassen, falls die HANDOFF-Konvention das vorsieht (UP-8 ist kein UI-Versions-Bump — analog UP-7 vermutlich keine Änderung).

- [ ] **Step 4: Commit**

```bash
git add Unterrichtsplaner/HANDOFF.md
git commit -m "docs(planer): HANDOFF — UP-8 erledigt (Synergy-Config aus Store)"
```

---

## Browser-Test-Plan (vor dem Merge — Pflicht, `regression-prevention.md`)

UP-8 ändert echtes UI. Nach Task 6, vor dem Merge nach `main`, im Browser (`npm run dev` oder `npm run preview`) prüfen:

| # | Schritt | Erwartung |
|---|---------|-----------|
| 1 | Frischer Zustand (localStorage-Key `synergy-config` leer / nicht vorhanden), Einstellungen öffnen | Sektion „Synergy-Verbindung" sichtbar mit Hinweis „Nicht konfiguriert"; `KursImportButton` (📥 Sheet) ausgeblendet; „Noten-Stand" zeigt den Nicht-konfiguriert-Hinweis |
| 2 | Ungültige URL (`http://x`) + gültige E-Mail eintragen, Speichern | Inline-Fehler an der URL, kein Toast, Config **nicht** gespeichert |
| 3 | Gültige URL (`https://…/exec`) + gültige E-Mail eintragen, Speichern | Erfolgs-Toast; Status wechselt auf „✓ Konfiguriert" — **ohne Reload**; `KursImportButton` erscheint; „Noten-Stand" wechselt auf die Daten-Ansicht |
| 4 | Seite neu laden | Config aus localStorage wiederhergestellt, weiterhin „✓ Konfiguriert" |
| 5 | Konsole | keine Errors |

---

## Abschluss

Nach Task 6 ist der Branch `feature/up8-synergy-config` fertig: Synergy-Config liegt in einem globalen Store, ist über die Einstellungen setzbar, die Services lesen sie zur Laufzeit, die Konsumenten reagieren reaktiv, und es gibt keine hardcodierten `APPS_SCRIPT_URL` / `LP_EMAIL` mehr. Merge nach `main` über den regulären Workflow (`deployment-workflow.md`) — **inkl. Browser-Test** (oben) und `git push origin main:preview`-Sync.
