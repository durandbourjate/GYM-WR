# Lernplattform Editor Integration (Phase 5b) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lernplattform-Admins können Fragen erstellen/bearbeiten — gleiche Editoren wie im Prüfungstool, via SharedFragenEditor mit LP-spezifischem Provider.

**Architecture:** LernplattformEditorProvider (Config+Services) → SharedFragenEditor (shared) + Type-Adapter (Lernplattform-Frage ↔ shared-Frage) + Backend-Endpoint zum Speichern.

**Tech Stack:** React 19, TypeScript, Zustand, `@shared/editor/SharedFragenEditor`, Apps Script Backend

**Spec:** `docs/superpowers/specs/2026-04-04-lernplattform-editor-integration-design.md`

**Vorgänger:** Phase 5a (SharedFragenEditor mit Slot-Props in `packages/shared/src/editor/`)

---

## Übersicht der Tasks

| # | Task | Dateien | Abhängig von |
|---|------|---------|-------------|
| 1 | Type-Adapter (toSharedFrage / fromSharedFrage) + Tests | `adapters/frageAdapter.ts`, `__tests__/frageAdapter.test.ts` | — |
| 2 | LernplattformEditorProvider | `components/admin/LernplattformEditorProvider.tsx` | — |
| 3 | Navigation: adminFragenbank Screen | `store/navigationStore.ts`, `components/AdminLayout.tsx` | — |
| 4 | AdminFragenbank (Fragen-Liste + Editor-Modal) | `components/admin/AdminFragenbank.tsx` | 1, 2, 3 |
| 5 | Backend: lernplattformSpeichereFrage | `apps-script/lernplattform-backend.js`, `adapters/appsScriptAdapter.ts` | — |
| 6 | Verdrahten + E2E-Verifikation | Diverse | 1–5 |

Tasks 1, 2, 3, 5 sind unabhängig und können parallel implementiert werden.

---

### Task 1: Type-Adapter + Tests

**Files:**
- Create: `Lernplattform/src/adapters/frageAdapter.ts`
- Create: `Lernplattform/src/__tests__/frageAdapter.test.ts`

**Context:** Lernplattform hat ein flaches `Frage`-Interface, shared hat ein Inheritance-basiertes System. Die Typ-Namen unterscheiden sich:

| LP Typ | Shared Typ |
|--------|-----------|
| `mc` | `mc` |
| `multi` | `mc` (mit `mehrfachauswahl: true`) |
| `tf` | `richtigfalsch` |
| `fill` | `lueckentext` |
| `calc` | `berechnung` |
| `sort` / `sortierung` | `sortierung` |
| `open` | `freitext` |
| `zeichnen` | `visualisierung` |
| `bilanz` | `bilanzstruktur` |
| `gruppe` | `aufgabengruppe` |

Strukturelle Unterschiede:
- MC: LP `optionen: string[]` + `korrekt: string | string[]` → Shared `optionen: MCOption[]` (mit `{id, text, korrekt}`)
- Lueckentext: LP `luecken.korrekt` → Shared `luecken.korrekteAntworten`
- Fragetext: LP `frage` → Shared `fragetext`
- Fachbereich: LP `fach` → Shared `fachbereich`
- Bloom: LP `taxonomie` → Shared `bloom`

- [ ] **Step 1: Write tests for typ mapping**

```typescript
// Lernplattform/src/__tests__/frageAdapter.test.ts
import { describe, it, expect } from 'vitest'
import { toSharedFrage, fromSharedFrage } from '../adapters/frageAdapter'

describe('frageAdapter', () => {
  describe('toSharedFrage', () => {
    it('mappt MC-Frage korrekt', () => { ... })
    it('mappt multi → mc mit mehrfachauswahl', () => { ... })
    it('mappt tf → richtigfalsch', () => { ... })
    it('mappt fill → lueckentext mit korrekteAntworten', () => { ... })
    it('mappt open → freitext', () => { ... })
    it('mappt calc → berechnung', () => { ... })
    it('mappt zeichnen → visualisierung', () => { ... })
    it('mappt bilanz → bilanzstruktur', () => { ... })
    it('mappt frage → fragetext', () => { ... })
    it('mappt fach → fachbereich', () => { ... })
  })

  describe('fromSharedFrage', () => {
    it('mappt shared MC zurück zu LP-Format', () => { ... })
    it('bewahrt schwierigkeit wenn vorhanden', () => { ... })
    it('setzt uebung: true, pruefungstauglich: false', () => { ... })
  })

  describe('roundtrip', () => {
    it('LP → shared → LP bewahrt alle Felder', () => { ... })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd Lernplattform && npx vitest run src/__tests__/frageAdapter.test.ts
```

- [ ] **Step 3: Implement frageAdapter.ts**

```typescript
// Lernplattform/src/adapters/frageAdapter.ts
import type { Frage as SharedFrage, MCOption, Fachbereich, BloomStufe } from '@shared/types/fragen'
import type { Frage as LernFrage, FrageTyp } from '../types/fragen'

const TYP_LP_ZU_SHARED: Record<string, string> = {
  mc: 'mc', multi: 'mc', tf: 'richtigfalsch', fill: 'lueckentext',
  calc: 'berechnung', sort: 'sortierung', sortierung: 'sortierung',
  open: 'freitext', zeichnen: 'visualisierung', bilanz: 'bilanzstruktur',
  gruppe: 'aufgabengruppe',
  // Identisch: buchungssatz, tkonto, kontenbestimmung, hotspot,
  // bildbeschriftung, dragdrop_bild, formel, pdf, audio, code, zuordnung
}

const TYP_SHARED_ZU_LP: Record<string, string> = {
  richtigfalsch: 'tf', lueckentext: 'fill', berechnung: 'calc',
  freitext: 'open', visualisierung: 'zeichnen', bilanzstruktur: 'bilanz',
  aufgabengruppe: 'gruppe',
}

export function toSharedFrage(lf: LernFrage): SharedFrage { ... }
export function fromSharedFrage(sf: SharedFrage, original?: LernFrage): LernFrage { ... }
```

**Wichtig:** `fromSharedFrage` akzeptiert optional die Original-LP-Frage, um Felder zu bewahren die shared nicht kennt (z.B. `schwierigkeit`, `stufe`, `lernziel`).

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd Lernplattform && npx vitest run src/__tests__/frageAdapter.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add Lernplattform/src/adapters/frageAdapter.ts Lernplattform/src/__tests__/frageAdapter.test.ts
git commit -m "feat(LP): Type-Adapter toSharedFrage/fromSharedFrage mit Tests"
```

---

### Task 2: LernplattformEditorProvider

**Files:**
- Create: `Lernplattform/src/components/admin/LernplattformEditorProvider.tsx`

- [ ] **Step 1: Create Provider**

```typescript
// Lernplattform/src/components/admin/LernplattformEditorProvider.tsx
import { useMemo, type ReactNode } from 'react'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import { useAuthStore } from '../../store/authStore'

interface Props { children: ReactNode }

export default function LernplattformEditorProvider({ children }: Props) {
  const user = useAuthStore(s => s.user)

  const config: EditorConfig = useMemo(() => ({
    benutzer: { email: user?.email ?? '', name: user?.name },
    verfuegbareGefaesse: [],
    verfuegbareSemester: [],
    zeigeFiBuTypen: true,  // Alle 20 Typen verfügbar
    features: {
      kiAssistent: false,
      anhangUpload: false,
      bewertungsraster: false,
      sharing: false,
      poolSync: false,
      performance: false,
    },
  }), [user])

  const services: EditorServices = useMemo(() => ({
    istKIVerfuegbar: () => false,
    istUploadVerfuegbar: () => false,
  }), [])

  return <EditorProvider config={config} services={services}>{children}</EditorProvider>
}
```

- [ ] **Step 2: tsc check**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 3: Commit**

```bash
git add Lernplattform/src/components/admin/LernplattformEditorProvider.tsx
git commit -m "feat(LP): LernplattformEditorProvider (alle Features off)"
```

---

### Task 3: Navigation erweitern

**Files:**
- Modify: `Lernplattform/src/store/navigationStore.ts` (Zeile 3-9: ScreenTyp)
- Modify: `Lernplattform/src/components/AdminLayout.tsx`

- [ ] **Step 1: ScreenTyp erweitern**

In `navigationStore.ts`, `'adminFragenbank'` zu ScreenTyp hinzufügen:

```typescript
export type ScreenTyp =
  | 'login'
  | 'gruppenAuswahl'
  | 'dashboard'
  | 'uebung'
  | 'ergebnis'
  | 'admin'
  | 'adminFragenbank'   // NEU
```

- [ ] **Step 2: AdminLayout mit Tabs**

AdminLayout.tsx erweitern: Einfache Tab-Navigation (Gruppe / Fragenbank). Bei Klick auf "Fragenbank" → `navigiere('adminFragenbank')`. Aktueller `'admin'`-Screen zeigt Gruppeninhalt, `'adminFragenbank'`-Screen zeigt AdminFragenbank.

- [ ] **Step 3: App.tsx / Layout-Router anpassen**

Prüfen wo `aktuellerScreen === 'admin'` gerendert wird und `'adminFragenbank'` hinzufügen.

```bash
grep -rn "aktuellerScreen.*admin\|'admin'" Lernplattform/src/
```

Dort die AdminFragenbank-Komponente einbinden.

- [ ] **Step 4: tsc + Tests**

```bash
cd Lernplattform && npx tsc -b && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add Lernplattform/src/store/navigationStore.ts Lernplattform/src/components/AdminLayout.tsx [weitere geänderte Dateien]
git commit -m "feat(LP): adminFragenbank Navigation + Admin-Tabs"
```

---

### Task 4: AdminFragenbank (Hauptkomponente)

**Files:**
- Create: `Lernplattform/src/components/admin/AdminFragenbank.tsx`

**Abhängig von:** Task 1 (frageAdapter), Task 2 (Provider), Task 3 (Navigation)

- [ ] **Step 1: Erstelle AdminFragenbank**

Struktur:
1. **Fragen-Liste** — Fragen der aktuellen Gruppe laden (via `fragenAdapter.ladeFragen`)
2. **Neu-Button** — Öffnet SharedFragenEditor als Modal
3. **Bearbeiten-Klick** — Öffnet SharedFragenEditor mit bestehender Frage
4. **Speichern-Handler** — `fromSharedFrage()` → `speichereFrage()` API-Call

```typescript
// Lernplattform/src/components/admin/AdminFragenbank.tsx
import { useState, useEffect } from 'react'
import SharedFragenEditor from '@shared/editor/SharedFragenEditor'
import type { Frage as SharedFrage } from '@shared/types/fragen'
import LernplattformEditorProvider from './LernplattformEditorProvider'
import { toSharedFrage, fromSharedFrage } from '../../adapters/frageAdapter'
import { appsScriptFragenAdapter } from '../../adapters/appsScriptAdapter'
import { useGruppenStore } from '../../store/gruppenStore'
import type { Frage } from '../../types/fragen'

export default function AdminFragenbank() {
  const gruppe = useGruppenStore(s => s.aktiveGruppe)
  const [fragen, setFragen] = useState<Frage[]>([])
  const [editorOffen, setEditorOffen] = useState(false)
  const [aktiveFrage, setAktiveFrage] = useState<Frage | null>(null)

  // Fragen laden
  useEffect(() => {
    if (!gruppe) return
    appsScriptFragenAdapter.ladeFragen(gruppe.id, {}).then(setFragen)
  }, [gruppe])

  function handleSpeichern(sharedFrage: SharedFrage) {
    const lpFrage = fromSharedFrage(sharedFrage, aktiveFrage ?? undefined)
    // TODO: API-Call speichereFrage (Task 5)
    setEditorOffen(false)
  }

  return (
    <div>
      <h2>Fragenbank ({fragen.length} Fragen)</h2>
      <button onClick={() => { setAktiveFrage(null); setEditorOffen(true) }}>+ Neue Frage</button>
      {/* Fragen-Liste mit Bearbeiten-Button */}
      {editorOffen && (
        <LernplattformEditorProvider>
          <SharedFragenEditor
            frage={aktiveFrage ? toSharedFrage(aktiveFrage) : null}
            onSpeichern={handleSpeichern}
            onAbbrechen={() => setEditorOffen(false)}
          />
        </LernplattformEditorProvider>
      )}
    </div>
  )
}
```

- [ ] **Step 2: tsc check**

```bash
cd Lernplattform && npx tsc -b
```

- [ ] **Step 3: Commit**

```bash
git add Lernplattform/src/components/admin/AdminFragenbank.tsx
git commit -m "feat(LP): AdminFragenbank mit SharedFragenEditor"
```

---

### Task 5: Backend-Endpoint + Frontend-Adapter

**Files:**
- Modify: `Lernplattform/apps-script/lernplattform-backend.js`
- Modify: `Lernplattform/src/adapters/appsScriptAdapter.ts`

- [ ] **Step 1: Backend-Handler implementieren**

In `lernplattform-backend.js`, neuen Case im Switch (nach `lernplattformLadeFragen`):

```javascript
case 'lernplattformSpeichereFrage':
  return lernplattformSpeichereFrage(body);
```

Handler-Funktion:

```javascript
function lernplattformSpeichereFrage(body) {
  var token = body.token;
  var gruppeId = body.gruppeId;
  var frage = body.frage;

  // 1. Token validieren
  var session = validiereToken_(token);
  if (!session) return jsonResponse({ success: false, error: 'Nicht authentifiziert' });

  // 2. Gruppe laden, Admin-Berechtigung prüfen
  var registry = SpreadsheetApp.openById(REGISTRY_SHEET_ID);
  var gruppen = registry.getSheetByName('Gruppen');
  // ... gruppeId finden, adminEmail prüfen

  // 3. Fragenbank-Sheet der Gruppe öffnen
  var fragebankId = gruppeData.fragebankSheetId;
  var fragenbank = SpreadsheetApp.openById(fragebankId);

  // 4. Tab für frage.fach finden oder erstellen
  var tab = fragenbank.getSheetByName(frage.fach) || fragenbank.insertSheet(frage.fach);

  // 5. Header prüfen / erstellen
  // 6. Zeile für frage.id suchen → Update oder Append
  // 7. Alle Frage-Felder in Spalten schreiben (JSON für komplexe Felder)

  return jsonResponse({ success: true, id: frage.id });
}
```

**Orientierung:** Pruefung's `speichereFrage` in `apps-script-code.js` (Zeile ~2062) als Vorlage.

- [ ] **Step 2: Frontend-Adapter erweitern**

In `appsScriptAdapter.ts`, Methode zu `AppsScriptFragenAdapter` hinzufügen:

```typescript
async speichereFrage(gruppeId: string, frage: Frage): Promise<{ success: boolean; id: string }> {
  const response = await apiClient.post<{ success: boolean; id: string }>(
    'lernplattformSpeichereFrage',
    { gruppeId, frage },
    this.getToken()
  )
  if (!response?.success) throw new Error('Frage speichern fehlgeschlagen')
  this.invalidateCache(gruppeId)
  return response
}
```

- [ ] **Step 3: AdminFragenbank an Adapter anbinden**

In `AdminFragenbank.tsx`, `handleSpeichern` updaten:

```typescript
async function handleSpeichern(sharedFrage: SharedFrage) {
  const lpFrage = fromSharedFrage(sharedFrage, aktiveFrage ?? undefined)
  if (!gruppe) return
  await appsScriptFragenAdapter.speichereFrage(gruppe.id, lpFrage)
  // Fragen-Liste neu laden
  const aktualisiert = await appsScriptFragenAdapter.ladeFragen(gruppe.id, {})
  setFragen(aktualisiert)
  setEditorOffen(false)
}
```

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/apps-script/lernplattform-backend.js Lernplattform/src/adapters/appsScriptAdapter.ts Lernplattform/src/components/admin/AdminFragenbank.tsx
git commit -m "feat(LP): lernplattformSpeichereFrage Backend + Adapter"
```

**Wichtig:** User muss nach Code-Änderungen in apps-script eine neue Bereitstellung im Apps Script Editor erstellen.

---

### Task 6: Verifikation & Push

- [ ] **Step 1: Full verification**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
cd ExamLab && npx tsc -b && npx vitest run  # Keine Regressions
```

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Update HANDOFF.md**

Session-Eintrag für Phase 5b, nächste Schritte: Browser-Test, Branch mergen.
