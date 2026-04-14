# Fortschritt pro Mitglied + Lernziele — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LP kann den Fortschritt aller SuS einer Gruppe analysieren; SuS sehen dynamische Lernziel-Checkliste basierend auf ihrem Mastery-Fortschritt.

**Architecture:** Ansatz A (schlankes Backend). Neuer Endpoint liefert Rohdaten aller SuS einer Gruppe; Frontend aggregiert. Lernziele in dediziertem Sheet-Tab (Gym: zentral in Fragenbank, Familie: pro Gruppe). Bestehendes shared `Lernziel`-Interface wird erweitert.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand (Frontend), Google Apps Script + Google Sheets (Backend)

**Spec:** `docs/superpowers/specs/2026-04-05-fortschritt-lernziele-design.md`

---

## File Map

### Backend (Apps Script)
| File | Action | Responsibility |
|------|--------|---------------|
| `Lernplattform/apps-script/lernplattform-backend.js` | Modify | +2 case-Einträge in doPost, +3 neue Funktionen |

### Shared Types
| File | Action | Responsibility |
|------|--------|---------------|
| `packages/shared/src/types/fragen.ts` | Modify (L572-580) | Lernziel-Interface erweitern |

### Frontend Types
| File | Action | Responsibility |
|------|--------|---------------|
| `Lernplattform/src/types/fortschritt.ts` | Modify | +SessionEintrag, +LernzielStatus |

### Frontend Services/Adapters
| File | Action | Responsibility |
|------|--------|---------------|
| `Lernplattform/src/services/interfaces.ts` | Modify | +FortschrittService Interface |
| `Lernplattform/src/adapters/appsScriptAdapter.ts` | Modify | +AppsScriptFortschrittAdapter Klasse |

### Frontend Store
| File | Action | Responsibility |
|------|--------|---------------|
| `Lernplattform/src/store/fortschrittStore.ts` | Modify | +Gruppen-Daten, +Lernziele, +Selektoren |

### Frontend Utils
| File | Action | Responsibility |
|------|--------|---------------|
| `Lernplattform/src/utils/mastery.ts` | Modify | +lernzielStatus() |

### Frontend Components
| File | Action | Responsibility |
|------|--------|---------------|
| `Lernplattform/src/components/admin/AdminDashboard.tsx` | Modify (L95) | +gruppeId Prop durchreichen |
| `Lernplattform/src/components/admin/AdminKindDetail.tsx` | Modify (komplett) | Backend-Anbindung statt leere Arrays |
| `Lernplattform/src/components/layout/AppShell.tsx` | Modify (L119-151) | Lernziele-Panel dynamisch |

### Tests
| File | Action | Responsibility |
|------|--------|---------------|
| `Lernplattform/src/__tests__/mastery.test.ts` | Modify | +lernzielStatus Tests |
| `Lernplattform/src/__tests__/fortschrittStore.test.ts` | Create | Selektoren + Aggregation |

---

## Task 0: Feature-Branch erstellen

- [ ] **Step 1: Branch erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull
git checkout -b feature/fortschritt-lernziele
```

---

## Task 1: Shared Types erweitern

**Files:**
- Modify: `packages/shared/src/types/fragen.ts` (suche `export interface Lernziel`)
- Modify: `Lernplattform/src/types/fortschritt.ts`

- [ ] **Step 1: Lernziel-Interface erweitern**

In `packages/shared/src/types/fragen.ts`, suche `export interface Lernziel` und ersetze:

```typescript
export interface Lernziel {
  id: string
  fach: string
  poolId?: string       // optional machen (war required)
  thema: string
  text: string
  bloom: string
  aktiv?: boolean       // optional machen (war required)
  fragenIds?: string[]  // NEU
}
```

- [ ] **Step 2: SessionEintrag + LernzielStatus zu fortschritt.ts hinzufügen**

In `Lernplattform/src/types/fortschritt.ts` am Ende:

```typescript
export interface SessionEintrag {
  sessionId: string
  email: string
  fach: string
  thema: string
  datum: string
  anzahlFragen: number
  richtig: number
}

export type LernzielStatus = 'offen' | 'inArbeit' | 'gefestigt' | 'gemeistert'
```

- [ ] **Step 3: TSC prüfen**

Run: `cd Lernplattform && npx tsc -b`
Expected: PASS (keine Breaking Changes, da Felder optional gemacht)

Run: `cd ExamLab && npx tsc -b`
Expected: PASS (shared types werden dort auch verwendet)

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/fragen.ts Lernplattform/src/types/fortschritt.ts
git commit -m "types: Lernziel erweitern + SessionEintrag/LernzielStatus"
```

---

## Task 2: Mastery-Utils erweitern (TDD)

**Files:**
- Modify: `Lernplattform/src/utils/mastery.ts`
- Modify: `Lernplattform/src/__tests__/mastery.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

In `Lernplattform/src/__tests__/mastery.test.ts` neue Test-Section hinzufügen:

```typescript
import { lernzielStatus } from '../utils/mastery'
import type { FragenFortschritt } from '../types/fortschritt'
import type { Lernziel } from '@shared/types/fragen'

describe('lernzielStatus', () => {
  const lz: Lernziel = { id: 'LZ-1', fach: 'BWL', thema: 'Bilanz', text: 'Test', bloom: 'K3', fragenIds: ['f1', 'f2', 'f3'] }

  it('gibt offen zurück wenn alle Fragen neu', () => {
    expect(lernzielStatus(lz, {})).toBe('offen')
  })

  it('gibt inArbeit zurück wenn mindestens eine Frage geübt', () => {
    const fp: Record<string, FragenFortschritt> = {
      f1: { fragenId: 'f1', email: 'a@b.ch', versuche: 1, richtig: 1, richtigInFolge: 1, sessionIds: ['s1'], letzterVersuch: '', mastery: 'ueben' }
    }
    expect(lernzielStatus(lz, fp)).toBe('inArbeit')
  })

  it('gibt gefestigt zurück wenn >=50% gefestigt/gemeistert', () => {
    const fp: Record<string, FragenFortschritt> = {
      f1: { fragenId: 'f1', email: 'a@b.ch', versuche: 5, richtig: 5, richtigInFolge: 5, sessionIds: ['s1', 's2'], letzterVersuch: '', mastery: 'gemeistert' },
      f2: { fragenId: 'f2', email: 'a@b.ch', versuche: 3, richtig: 3, richtigInFolge: 3, sessionIds: ['s1'], letzterVersuch: '', mastery: 'gefestigt' }
    }
    expect(lernzielStatus(lz, fp)).toBe('gefestigt')
  })

  it('gibt gemeistert zurück wenn alle Fragen gemeistert', () => {
    const fp: Record<string, FragenFortschritt> = {
      f1: { fragenId: 'f1', email: 'a@b.ch', versuche: 5, richtig: 5, richtigInFolge: 5, sessionIds: ['s1', 's2'], letzterVersuch: '', mastery: 'gemeistert' },
      f2: { fragenId: 'f2', email: 'a@b.ch', versuche: 5, richtig: 5, richtigInFolge: 5, sessionIds: ['s1', 's2'], letzterVersuch: '', mastery: 'gemeistert' },
      f3: { fragenId: 'f3', email: 'a@b.ch', versuche: 5, richtig: 5, richtigInFolge: 5, sessionIds: ['s1', 's2'], letzterVersuch: '', mastery: 'gemeistert' }
    }
    expect(lernzielStatus(lz, fp)).toBe('gemeistert')
  })

  it('behandelt Lernziel ohne fragenIds als offen', () => {
    const lzOhne: Lernziel = { id: 'LZ-2', fach: 'BWL', thema: 'X', text: 'Test', bloom: 'K1' }
    expect(lernzielStatus(lzOhne, {})).toBe('offen')
  })
})
```

- [ ] **Step 2: Tests ausführen — müssen fehlschlagen**

Run: `cd Lernplattform && npx vitest run src/__tests__/mastery.test.ts`
Expected: FAIL — `lernzielStatus` ist nicht definiert

- [ ] **Step 3: Implementierung in mastery.ts**

Am Ende von `Lernplattform/src/utils/mastery.ts`:

```typescript
import type { Lernziel } from '@shared/types/fragen'
import type { LernzielStatus } from '../types/fortschritt'

export function lernzielStatus(
  lernziel: Lernziel,
  fortschritte: Record<string, FragenFortschritt>
): LernzielStatus {
  const ids = lernziel.fragenIds
  if (!ids || ids.length === 0) return 'offen'

  let gemeistert = 0
  let gefestigtOderBesser = 0
  let geuebt = 0

  for (const id of ids) {
    const fp = fortschritte[id]
    if (!fp) continue
    switch (fp.mastery) {
      case 'gemeistert': gemeistert++; gefestigtOderBesser++; geuebt++; break
      case 'gefestigt': gefestigtOderBesser++; geuebt++; break
      case 'ueben': geuebt++; break
    }
  }

  if (gemeistert === ids.length) return 'gemeistert'
  if (gefestigtOderBesser / ids.length >= 0.5) return 'gefestigt'
  if (geuebt > 0) return 'inArbeit'
  return 'offen'
}
```

**Hinweis:** Der `import type { FragenFortschritt }` existiert bereits am Dateianfang.

- [ ] **Step 4: Tests ausführen — müssen grün sein**

Run: `cd Lernplattform && npx vitest run src/__tests__/mastery.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Lernplattform/src/utils/mastery.ts Lernplattform/src/__tests__/mastery.test.ts
git commit -m "feat: lernzielStatus Funktion + Tests"
```

---

## Task 3: FortschrittService Interface + Adapter

**Files:**
- Modify: `Lernplattform/src/services/interfaces.ts`
- Modify: `Lernplattform/src/adapters/appsScriptAdapter.ts`

- [ ] **Step 1: Interface definieren**

Am Ende von `Lernplattform/src/services/interfaces.ts`:

```typescript
import type { Lernziel } from '@shared/types/fragen'
import type { FragenFortschritt, SessionEintrag } from '../types/fortschritt'

export interface FortschrittService {
  ladeGruppenFortschritt(gruppeId: string): Promise<{
    fortschritte: FragenFortschritt[]
    sessions: SessionEintrag[]
  }>
  ladeLernziele(gruppeId: string): Promise<Lernziel[]>
  speichereLernziel(gruppeId: string, lernziel: Lernziel): Promise<{ id: string }>
}
```

- [ ] **Step 2: Adapter implementieren**

Am Ende von `Lernplattform/src/adapters/appsScriptAdapter.ts`:

```typescript
import type { Lernziel } from '@shared/types/fragen'
import type { FragenFortschritt, SessionEintrag } from '../types/fortschritt'
import type { FortschrittService } from '../services/interfaces'

class AppsScriptFortschrittAdapter implements FortschrittService {
  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('lernplattform-auth')
      return stored ? JSON.parse(stored).sessionToken : undefined
    } catch { return undefined }
  }

  private getEmail(): string | undefined {
    try {
      const stored = localStorage.getItem('lernplattform-auth')
      return stored ? JSON.parse(stored).email : undefined
    } catch { return undefined }
  }

  async ladeGruppenFortschritt(gruppeId: string): Promise<{
    fortschritte: FragenFortschritt[]
    sessions: SessionEintrag[]
  }> {
    const response = await apiClient.post<{
      success: boolean
      data: { fortschritte: FragenFortschritt[]; sessions: SessionEintrag[] }
      error?: string
    }>('lernplattformLadeGruppenFortschritt', { gruppeId, email: this.getEmail() }, this.getToken())

    if (!response?.success) throw new Error(response?.error || 'Fortschritt laden fehlgeschlagen')
    return response.data
  }

  async ladeLernziele(gruppeId: string): Promise<Lernziel[]> {
    const response = await apiClient.post<{
      success: boolean
      data: Lernziel[]
      error?: string
    }>('lernplattformLadeLernzieleV2', { gruppeId, email: this.getEmail() }, this.getToken())

    return response?.data || []
  }

  async speichereLernziel(gruppeId: string, lernziel: Lernziel): Promise<{ id: string }> {
    const response = await apiClient.post<{
      success: boolean
      data: { id: string }
      error?: string
    }>('lernplattformSpeichereLernziel', { gruppeId, lernziel, email: this.getEmail() }, this.getToken())

    if (!response?.success) throw new Error(response?.error || 'Lernziel speichern fehlgeschlagen')
    return response.data
  }
}

export const fortschrittAdapter: FortschrittService = new AppsScriptFortschrittAdapter()
```

- [ ] **Step 3: TSC prüfen**

Run: `cd Lernplattform && npx tsc -b`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/src/services/interfaces.ts Lernplattform/src/adapters/appsScriptAdapter.ts
git commit -m "feat: FortschrittService Interface + AppsScript-Adapter"
```

---

## Task 4: FortschrittStore erweitern (TDD)

**Files:**
- Modify: `Lernplattform/src/store/fortschrittStore.ts`
- Create: `Lernplattform/src/__tests__/fortschrittStore.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

Neue Datei `Lernplattform/src/__tests__/fortschrittStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useFortschrittStore } from '../store/fortschrittStore'
import type { FragenFortschritt } from '../types/fortschritt'

const makeFP = (fragenId: string, email: string, mastery: string): FragenFortschritt => ({
  fragenId, email, versuche: 5, richtig: 3, richtigInFolge: 3,
  sessionIds: ['s1'], letzterVersuch: '2026-04-05', mastery: mastery as any,
})

describe('fortschrittStore Gruppen-Selektoren', () => {
  beforeEach(() => {
    useFortschrittStore.setState({
      gruppenFortschritt: {
        'gruppe-1': [
          makeFP('f1', 'alice@test.ch', 'gemeistert'),
          makeFP('f2', 'alice@test.ch', 'ueben'),
          makeFP('f1', 'bob@test.ch', 'gefestigt'),
        ]
      },
      gruppenSessions: {
        'gruppe-1': [
          { sessionId: 's1', email: 'alice@test.ch', fach: 'BWL', thema: 'Bilanz', datum: '2026-04-05', anzahlFragen: 10, richtig: 7 },
        ]
      },
      lernziele: [],
    })
  })

  it('getFortschrittFuerSuS filtert nach Email', () => {
    const result = useFortschrittStore.getState().getFortschrittFuerSuS('gruppe-1', 'alice@test.ch')
    expect(result).toHaveLength(2)
    expect(result.every(fp => fp.email === 'alice@test.ch')).toBe(true)
  })

  it('getFortschrittFuerSuS gibt leeres Array für unbekannte Gruppe', () => {
    const result = useFortschrittStore.getState().getFortschrittFuerSuS('nope', 'alice@test.ch')
    expect(result).toHaveLength(0)
  })

  it('getSessionsFuerSuS filtert nach Email', () => {
    const result = useFortschrittStore.getState().getSessionsFuerSuS('gruppe-1', 'alice@test.ch')
    expect(result).toHaveLength(1)
  })

  it('getSessionsFuerSuS gibt leeres Array für unbekannte Email', () => {
    const result = useFortschrittStore.getState().getSessionsFuerSuS('gruppe-1', 'nobody@test.ch')
    expect(result).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Tests ausführen — müssen fehlschlagen**

Run: `cd Lernplattform && npx vitest run src/__tests__/fortschrittStore.test.ts`
Expected: FAIL — `gruppenFortschritt`, `getFortschrittFuerSuS` etc. existieren nicht

- [ ] **Step 3: Store erweitern**

In `Lernplattform/src/store/fortschrittStore.ts` das Interface und den Store erweitern:

Neue Imports am Anfang:
```typescript
import type { SessionEintrag } from '../types/fortschritt'
import type { Lernziel } from '@shared/types/fragen'
import { fortschrittAdapter } from '../adapters/appsScriptAdapter'
```

Interface erweitern (nach `getThemenFortschritt`):
```typescript
  // Admin-Daten
  gruppenFortschritt: Record<string, FragenFortschritt[]>
  gruppenSessions: Record<string, SessionEintrag[]>
  lernziele: Lernziel[]

  // Admin-Actions
  ladeGruppenFortschritt: (gruppeId: string) => Promise<void>
  ladeLernziele: (gruppeId: string) => Promise<void>

  // Selektoren
  getFortschrittFuerSuS: (gruppeId: string, email: string) => FragenFortschritt[]
  getSessionsFuerSuS: (gruppeId: string, email: string) => SessionEintrag[]
```

Store-Body erweitern (nach `getThemenFortschritt`):
```typescript
  gruppenFortschritt: {},
  gruppenSessions: {},
  lernziele: [],

  ladeGruppenFortschritt: async (gruppeId) => {
    if (get().gruppenFortschritt[gruppeId]) return // cached
    try {
      const { fortschritte, sessions } = await fortschrittAdapter.ladeGruppenFortschritt(gruppeId)
      set({
        gruppenFortschritt: { ...get().gruppenFortschritt, [gruppeId]: fortschritte },
        gruppenSessions: { ...get().gruppenSessions, [gruppeId]: sessions },
      })
    } catch { /* Fehler ignorieren — UI zeigt leere Daten */ }
  },

  ladeLernziele: async (gruppeId) => {
    try {
      const lernziele = await fortschrittAdapter.ladeLernziele(gruppeId)
      set({ lernziele })
    } catch { /* Fehler ignorieren */ }
  },

  getFortschrittFuerSuS: (gruppeId, email) => {
    return (get().gruppenFortschritt[gruppeId] || []).filter(fp => fp.email === email)
  },

  getSessionsFuerSuS: (gruppeId, email) => {
    return (get().gruppenSessions[gruppeId] || []).filter(s => s.email === email)
  },
```

- [ ] **Step 4: Tests ausführen — müssen grün sein**

Run: `cd Lernplattform && npx vitest run src/__tests__/fortschrittStore.test.ts`
Expected: PASS

- [ ] **Step 5: Alle Tests ausführen**

Run: `cd Lernplattform && npx vitest run`
Expected: Alle bestehenden + neuen Tests PASS

- [ ] **Step 6: Commit**

```bash
git add Lernplattform/src/store/fortschrittStore.ts Lernplattform/src/__tests__/fortschrittStore.test.ts
git commit -m "feat: fortschrittStore mit Gruppen-Daten + Selektoren + Tests"
```

---

## Task 5: Backend — `lernplattformLadeGruppenFortschritt`

**Files:**
- Modify: `Lernplattform/apps-script/lernplattform-backend.js`

- [ ] **Step 1: Case-Eintrag in doPost hinzufügen**

Nach Zeile 150 (`case 'lernplattformLadeFortschritt'`):

```javascript
    case 'lernplattformLadeGruppenFortschritt':
      return lernplattformLadeGruppenFortschritt(body);
```

- [ ] **Step 2: Funktion implementieren**

Nach der bestehenden `lernplattformLadeFortschritt`-Funktion (nach Zeile ~1175):

```javascript
function lernplattformLadeGruppenFortschritt(body) {
  var gruppeId = body.gruppeId;
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);

    // Admin-Check: Rolle im Mitglieder-Tab prüfen
    var mitgliederSheet = ss.getSheetByName('Mitglieder');
    if (!mitgliederSheet) return jsonResponse({ success: false, error: 'Mitglieder-Tab fehlt' });
    var mitgliederDaten = mitgliederSheet.getDataRange().getValues();
    var mitgliederHeaders = mitgliederDaten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var rolleIdx = mitgliederHeaders.indexOf('rolle');
    var emailIdx = mitgliederHeaders.indexOf('email');
    var istAdmin = false;
    var mitgliederEmails = [];
    for (var m = 1; m < mitgliederDaten.length; m++) {
      var mEmail = String(mitgliederDaten[m][emailIdx] || '').toLowerCase().trim();
      mitgliederEmails.push(mEmail);
      if (mEmail === email && String(mitgliederDaten[m][rolleIdx]) === 'admin') {
        istAdmin = true;
      }
    }
    if (!istAdmin) return jsonResponse({ success: false, error: 'Keine Berechtigung' });

    // Fortschritt laden + nach Mitgliedern filtern
    var fortschrittSheet = ss.getSheetByName('Fortschritt');
    var fortschritte = [];
    if (fortschrittSheet) {
      var fpDaten = fortschrittSheet.getDataRange().getValues();
      if (fpDaten.length >= 2) {
        var fpHeaders = fpDaten[0].map(function(h) { return String(h).toLowerCase().trim(); });
        for (var i = 1; i < fpDaten.length; i++) {
          var fpEmail = String(fpDaten[i][0]).toLowerCase().trim();
          if (mitgliederEmails.indexOf(fpEmail) === -1) continue;
          var sessionIdsRaw = String(fpDaten[i][fpHeaders.indexOf('sessionids')] || '');
          fortschritte.push({
            email: fpEmail,
            fragenId: String(fpDaten[i][fpHeaders.indexOf('fragenid')]),
            versuche: Number(fpDaten[i][fpHeaders.indexOf('versuche')]),
            richtig: Number(fpDaten[i][fpHeaders.indexOf('richtig')]),
            richtigInFolge: Number(fpDaten[i][fpHeaders.indexOf('richtiginfolge')]),
            mastery: String(fpDaten[i][fpHeaders.indexOf('mastery')]),
            letzterVersuch: String(fpDaten[i][fpHeaders.indexOf('letzterversuch')]),
            sessionIds: sessionIdsRaw ? sessionIdsRaw.split(',').map(function(s) { return s.trim(); }) : [],
          });
        }
      }
    }

    // Sessions laden + nach Mitgliedern filtern
    var sessionsSheet = ss.getSheetByName('Sessions');
    var sessions = [];
    if (sessionsSheet) {
      var sesDaten = sessionsSheet.getDataRange().getValues();
      if (sesDaten.length >= 2) {
        var sesHeaders = sesDaten[0].map(function(h) { return String(h).toLowerCase().trim(); });
        for (var j = 1; j < sesDaten.length; j++) {
          var sesEmail = String(sesDaten[j][sesHeaders.indexOf('email')] || '').toLowerCase().trim();
          if (mitgliederEmails.indexOf(sesEmail) === -1) continue;
          sessions.push({
            sessionId: String(sesDaten[j][sesHeaders.indexOf('sessionid')]),
            email: sesEmail,
            fach: String(sesDaten[j][sesHeaders.indexOf('fach')] || ''),
            thema: String(sesDaten[j][sesHeaders.indexOf('thema')] || ''),
            datum: String(sesDaten[j][sesHeaders.indexOf('datum')] || ''),
            anzahlFragen: Number(sesDaten[j][sesHeaders.indexOf('anzahlfragen')] || 0),
            richtig: Number(sesDaten[j][sesHeaders.indexOf('richtig')] || 0),
          });
        }
      }
    }

    return jsonResponse({ success: true, data: { fortschritte: fortschritte, sessions: sessions } });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Gruppenfortschritt laden: ' + e.message });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add Lernplattform/apps-script/lernplattform-backend.js
git commit -m "feat: Backend lernplattformLadeGruppenFortschritt Endpoint"
```

---

## Task 6: Backend — `lernplattformLadeLernzieleV2` + `lernplattformSpeichereLernziel`

**Files:**
- Modify: `Lernplattform/apps-script/lernplattform-backend.js`

- [ ] **Step 1: Case-Einträge in doPost hinzufügen**

Nach dem in Task 5 hinzugefügten Case:

```javascript
    case 'lernplattformLadeLernzieleV2':
      return lernplattformLadeLernzieleV2(body);
    case 'lernplattformSpeichereLernziel':
      return lernplattformSpeichereLernziel(body);
```

- [ ] **Step 2: LadeLernzieleV2 implementieren**

```javascript
function lernplattformLadeLernzieleV2(body) {
  var gruppeId = body.gruppeId;
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    // Gym: Lernziele aus FRAGENBANK, Familie: aus Gruppen-Sheet
    var sheetId = gruppe.typ === 'familie' ? gruppe.fragebankSheetId : FRAGENBANK_ID;
    var ss = SpreadsheetApp.openById(sheetId);
    var lzSheet = ss.getSheetByName('Lernziele');

    if (!lzSheet) return jsonResponse({ success: true, data: [] });

    var daten = lzSheet.getDataRange().getValues();
    if (daten.length < 2) return jsonResponse({ success: true, data: [] });

    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var lernziele = [];

    for (var i = 1; i < daten.length; i++) {
      var fragenIdsRaw = String(daten[i][headers.indexOf('fragenids')] || '');
      lernziele.push({
        id: String(daten[i][headers.indexOf('id')]),
        text: String(daten[i][headers.indexOf('text')]),
        fach: String(daten[i][headers.indexOf('fach')]),
        thema: String(daten[i][headers.indexOf('thema')] || ''),
        bloom: String(daten[i][headers.indexOf('bloom')] || 'K2'),
        fragenIds: fragenIdsRaw ? fragenIdsRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
      });
    }

    return jsonResponse({ success: true, data: lernziele });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Lernziele laden: ' + e.message });
  }
}
```

- [ ] **Step 3: SpeichereLernziel implementieren**

```javascript
function lernplattformSpeichereLernziel(body) {
  var gruppeId = body.gruppeId;
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  // Admin-Check (header-basiert, nicht hardcoded)
  var ssGruppe = SpreadsheetApp.openById(gruppe.fragebankSheetId);
  var mitgSheet = ssGruppe.getSheetByName('Mitglieder');
  if (!mitgSheet) return jsonResponse({ success: false, error: 'Mitglieder-Tab fehlt' });
  var mitgDaten = mitgSheet.getDataRange().getValues();
  var mitgHeaders = mitgDaten[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var mitgEmailIdx = mitgHeaders.indexOf('email');
  var mitgRolleIdx = mitgHeaders.indexOf('rolle');
  var istAdmin = false;
  for (var m = 1; m < mitgDaten.length; m++) {
    if (String(mitgDaten[m][mitgEmailIdx]).toLowerCase().trim() === email && String(mitgDaten[m][mitgRolleIdx]) === 'admin') {
      istAdmin = true; break;
    }
  }
  if (!istAdmin) return jsonResponse({ success: false, error: 'Keine Berechtigung' });

  var lz = body.lernziel;
  if (!lz || !lz.id || !lz.text || !lz.fach) {
    return jsonResponse({ success: false, error: 'Lernziel-Daten unvollständig' });
  }

  try {
    var sheetId = gruppe.typ === 'familie' ? gruppe.fragebankSheetId : FRAGENBANK_ID;
    var ss = SpreadsheetApp.openById(sheetId);
    var lzSheet = ss.getSheetByName('Lernziele');

    // Tab erstellen falls nicht vorhanden
    if (!lzSheet) {
      lzSheet = ss.insertSheet('Lernziele');
      lzSheet.appendRow(['id', 'text', 'fach', 'thema', 'bloom', 'fragenIds']);
    }

    var daten = lzSheet.getDataRange().getValues();
    var fragenIdsStr = (lz.fragenIds || []).join(', ');

    // Bestehend → Update
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][0]) === lz.id) {
        var zeile = i + 1;
        lzSheet.getRange(zeile, 1, 1, 6).setValues([[lz.id, lz.text, lz.fach, lz.thema || '', lz.bloom || 'K2', fragenIdsStr]]);
        return jsonResponse({ success: true, data: { id: lz.id } });
      }
    }

    // Neu → Append
    lzSheet.appendRow([lz.id, lz.text, lz.fach, lz.thema || '', lz.bloom || 'K2', fragenIdsStr]);
    return jsonResponse({ success: true, data: { id: lz.id } });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Lernziel speichern: ' + e.message });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/apps-script/lernplattform-backend.js
git commit -m "feat: Backend LadeLernzieleV2 + SpeichereLernziel Endpoints"
```

**Hinweis an User:** Nach Task 5+6 muss der Code in den Apps Script Editor kopiert und neu bereitgestellt werden.

---

## Task 7: AdminKindDetail mit Backend-Daten

**Files:**
- Modify: `Lernplattform/src/components/admin/AdminDashboard.tsx:95`
- Modify: `Lernplattform/src/components/admin/AdminKindDetail.tsx` (komplett)

- [ ] **Step 1: gruppeId Prop in AdminDashboard durchreichen**

In `AdminDashboard.tsx`, Zeile 95 ändern von:

```typescript
<AdminKindDetail
  email={ansicht.email}
  name={ansicht.name}
  onThemaKlick={(fach, thema) => setAnsicht({ typ: 'thema', email: ansicht.email, name: ansicht.name, fach, thema })}
/>
```

zu:

```typescript
<AdminKindDetail
  gruppeId={aktiveGruppe?.id || ''}
  email={ansicht.email}
  name={ansicht.name}
  onThemaKlick={(fach, thema) => setAnsicht({ typ: 'thema', email: ansicht.email, name: ansicht.name, fach, thema })}
/>
```

**Hinweis:** `aktiveGruppe` muss aus `useGruppenStore` importiert sein — prüfen ob bereits vorhanden in AdminDashboard.

- [ ] **Step 2: AdminKindDetail komplett neu schreiben**

Die Datei `AdminKindDetail.tsx` komplett ersetzen:

```typescript
import { useEffect, useMemo } from 'react'
import { useFortschrittStore } from '../../store/fortschrittStore'
import { istDauerbaustelle } from '../../utils/mastery'
import { fragenAdapter } from '../../adapters/appsScriptAdapter'
import type { Frage } from '../../types/fragen'
import { useState } from 'react'

interface Props {
  gruppeId: string
  email: string
  name: string
  onThemaKlick: (fach: string, thema: string) => void
}

export default function AdminKindDetail({ gruppeId, email, name, onThemaKlick }: Props) {
  const { ladeGruppenFortschritt, getFortschrittFuerSuS, getSessionsFuerSuS } = useFortschrittStore()
  const [fragen, setFragen] = useState<Frage[]>([])

  useEffect(() => {
    ladeGruppenFortschritt(gruppeId)
    fragenAdapter.ladeFragen(gruppeId).then(setFragen).catch(() => {})
  }, [gruppeId, ladeGruppenFortschritt])

  const fortschritte = useFortschrittStore(s => s.getFortschrittFuerSuS(gruppeId, email))
  const sessions = useFortschrittStore(s => s.getSessionsFuerSuS(gruppeId, email))

  // Fragen-Lookup
  const fragenMap = useMemo(() => {
    const map: Record<string, Frage> = {}
    for (const f of fragen) map[f.id] = f
    return map
  }, [fragen])

  // Letzte 7 Tage
  const siebeTage = useMemo(() => {
    const grenze = new Date()
    grenze.setDate(grenze.getDate() - 7)
    return sessions.filter(s => new Date(s.datum) >= grenze)
  }, [sessions])

  // Dauerbaustellen
  const dauerbaustellen = useMemo(() =>
    fortschritte.filter(fp => istDauerbaustelle(fp.versuche, fp.richtig)),
  [fortschritte])

  // Mastery nach Fach → Thema
  const fachThemen = useMemo(() => {
    const result: Record<string, Record<string, { gesamt: number; gemeistert: number; gefestigt: number; ueben: number; neu: number }>> = {}
    for (const fp of fortschritte) {
      const frage = fragenMap[fp.fragenId]
      if (!frage) continue
      const { fach, thema } = frage
      if (!result[fach]) result[fach] = {}
      if (!result[fach][thema]) result[fach][thema] = { gesamt: 0, gemeistert: 0, gefestigt: 0, ueben: 0, neu: 0 }
      result[fach][thema].gesamt++
      switch (fp.mastery) {
        case 'gemeistert': result[fach][thema].gemeistert++; break
        case 'gefestigt': result[fach][thema].gefestigt++; break
        case 'ueben': result[fach][thema].ueben++; break
        default: result[fach][thema].neu++; break
      }
    }
    return result
  }, [fortschritte, fragenMap])

  const gesamtFragen = siebeTage.reduce((s, ses) => s + ses.anzahlFragen, 0)
  const gesamtRichtig = siebeTage.reduce((s, ses) => s + ses.richtig, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-xl font-bold dark:text-white">{name}</h2>

      {/* Session-Statistik letzte 7 Tage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-3 dark:text-white">Letzte 7 Tage</h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold dark:text-white">{siebeTage.length}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">Sessions</span>
          </div>
          <div>
            <span className="text-2xl font-bold dark:text-white">{gesamtFragen}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">Fragen</span>
          </div>
          <div>
            <span className="text-2xl font-bold dark:text-white">
              {gesamtFragen > 0 ? Math.round((gesamtRichtig / gesamtFragen) * 100) : 0}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">richtig</span>
          </div>
        </div>
      </div>

      {/* Dauerbaustellen */}
      {dauerbaustellen.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
          <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Dauerbaustellen</h3>
          <div className="space-y-1">
            {dauerbaustellen.map(fp => {
              const frage = fragenMap[fp.fragenId]
              return (
                <div key={fp.fragenId} className="text-sm text-yellow-700 dark:text-yellow-300">
                  {frage ? `${frage.fach} — ${frage.thema}` : fp.fragenId}: {fp.richtig}/{fp.versuche} richtig ({Math.round((fp.richtig / fp.versuche) * 100)}%)
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Themen nach Fach */}
      {Object.entries(fachThemen).map(([fach, themen]) => (
        <div key={fach}>
          <h3 className="text-lg font-semibold mb-3 dark:text-white">{fach}</h3>
          <div className="space-y-2">
            {Object.entries(themen).map(([thema, stats]) => {
              const quote = stats.gesamt > 0 ? ((stats.gemeistert + stats.gefestigt) / stats.gesamt) * 100 : 0
              return (
                <button
                  key={thema}
                  onClick={() => onThemaKlick(fach, thema)}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium dark:text-white">{thema}</span>
                    <span className="text-sm text-gray-500">{Math.round(quote)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden flex">
                    {stats.gemeistert > 0 && <div className="bg-green-500 h-2" style={{ width: `${(stats.gemeistert / stats.gesamt) * 100}%` }} />}
                    {stats.gefestigt > 0 && <div className="bg-blue-400 h-2" style={{ width: `${(stats.gefestigt / stats.gesamt) * 100}%` }} />}
                    {stats.ueben > 0 && <div className="bg-yellow-400 h-2" style={{ width: `${(stats.ueben / stats.gesamt) * 100}%` }} />}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    {stats.gemeistert > 0 && <span className="text-green-600">{stats.gemeistert} gemeistert</span>}
                    {stats.gefestigt > 0 && <span className="text-blue-500">{stats.gefestigt} gefestigt</span>}
                    {stats.ueben > 0 && <span className="text-yellow-600">{stats.ueben} üben</span>}
                    {stats.neu > 0 && <span>{stats.neu} neu</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Leer-Zustand */}
      {fortschritte.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">&#128203;</p>
          <p>Noch keine Übungsdaten vorhanden.</p>
        </div>
      )}

      {/* Session-Historie */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Sessions</h3>
          <div className="space-y-2">
            {[...sessions].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()).slice(0, 20).map((ses) => (
              <div key={ses.sessionId} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                <div>
                  <span className="font-medium dark:text-white">{ses.fach} — {ses.thema}</span>
                  <span className="text-sm text-gray-400 ml-2">{new Date(ses.datum).toLocaleDateString('de-CH')}</span>
                </div>
                <span className={`font-medium ${ses.anzahlFragen > 0 && ses.richtig / ses.anzahlFragen >= 0.7 ? 'text-green-600' : ses.anzahlFragen > 0 && ses.richtig / ses.anzahlFragen >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {ses.richtig}/{ses.anzahlFragen}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: TSC prüfen**

Run: `cd Lernplattform && npx tsc -b`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Lernplattform/src/components/admin/AdminDashboard.tsx Lernplattform/src/components/admin/AdminKindDetail.tsx
git commit -m "feat: AdminKindDetail mit Backend-Daten (Fortschritt + Sessions)"
```

---

## Task 8: Lernziele-Panel dynamisch (SuS-Ansicht)

**Files:**
- Modify: `Lernplattform/src/components/layout/AppShell.tsx:119-151`

- [ ] **Step 1: Imports + Daten laden**

Am Anfang von AppShell.tsx die nötigen Imports hinzufügen:

```typescript
import { useFortschrittStore } from '../../store/fortschrittStore'
import { useGruppenStore } from '../../store/gruppenStore'
import { lernzielStatus } from '../../utils/mastery'
```

Im Komponenten-Body:

```typescript
const { lernziele, ladeLernziele, fortschritte } = useFortschrittStore()
const { aktiveGruppe } = useGruppenStore()

useEffect(() => {
  if (aktiveGruppe?.id) ladeLernziele(aktiveGruppe.id)
}, [aktiveGruppe?.id, ladeLernziele])
```

- [ ] **Step 2: Panel-Inhalt ersetzen**

Den statischen Panel-Inhalt (Zeilen 119-151) ersetzen:

```typescript
{lernzieleOffen && (
  <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3">
    <div className="max-w-2xl mx-auto text-sm text-gray-700 dark:text-gray-300 space-y-2">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold dark:text-white">&#127937; Lernziele</h3>
        <button onClick={() => setLernzieleOffen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">x</button>
      </div>

      {lernziele.length > 0 ? (
        <>
          {/* Nach Fach gruppiert */}
          {Object.entries(
            lernziele.reduce<Record<string, typeof lernziele>>((acc, lz) => {
              if (!acc[lz.fach]) acc[lz.fach] = []
              acc[lz.fach].push(lz)
              return acc
            }, {})
          ).map(([fach, fachLernziele]) => (
            <div key={fach}>
              <h4 className="font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-2 mb-1">{fach}</h4>
              <div className="space-y-1">
                {fachLernziele
                  .map(lz => ({ lz, status: lernzielStatus(lz, fortschritte) }))
                  .sort((a, b) => {
                    const order = { offen: 0, inArbeit: 1, gefestigt: 2, gemeistert: 3 }
                    return order[a.status] - order[b.status]
                  })
                  .map(({ lz, status }) => (
                    <div key={lz.id} className="flex items-start gap-2">
                      <span className="mt-0.5 text-sm">
                        {status === 'gemeistert' ? '✅' : status === 'gefestigt' ? '🔵' : status === 'inArbeit' ? '🟡' : '⬜'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={status === 'gemeistert' ? 'line-through text-gray-400' : ''}>{lz.text}</span>
                        <span className="ml-1 text-xs text-gray-400">{lz.bloom}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <p>Bearbeite die Übungsthemen im Dashboard, um deine Lernziele zu erreichen.</p>
          <div className="text-xs space-y-1">
            <p>Dein Ziel: Möglichst viele Fragen auf <strong className="text-green-600 dark:text-green-400">Gemeistert</strong> bringen.</p>
            <div className="grid grid-cols-2 gap-1 mt-2">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 inline-block" /> Neu</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Üben</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Gefestigt</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Gemeistert</div>
            </div>
            <p className="text-gray-400 mt-2 italic">Lernziele werden von der Lehrperson definiert.</p>
          </div>
        </>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: TSC prüfen**

Run: `cd Lernplattform && npx tsc -b`
Expected: PASS

- [ ] **Step 4: Alle Tests**

Run: `cd Lernplattform && npx vitest run`
Expected: PASS

Run: `cd Lernplattform && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Lernplattform/src/components/layout/AppShell.tsx
git commit -m "feat: Lernziele-Panel dynamisch aus Backend"
```

---

## Task 9: Verifikation + HANDOFF

- [ ] **Step 1: Volle Verifikation**

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
cd ../Pruefung && npx tsc -b && npx vitest run && npm run build
```

Expected: Alles grün

- [ ] **Step 2: HANDOFF.md aktualisieren**

`Lernplattform/HANDOFF.md` aktualisieren mit:
- Neue Endpoints dokumentieren
- Lernziele-Tab-Struktur beschreiben
- Offene Punkte aktualisieren (E2E-Test bleibt, Backend-Fortschritt erledigt, Lernziele erledigt)
- Hinweis: Apps Script muss neu deployed werden

- [ ] **Step 3: Commit**

```bash
git add Lernplattform/HANDOFF.md
git commit -m "docs: HANDOFF aktualisiert (Fortschritt + Lernziele)"
```

- [ ] **Step 4: User informieren**

Dem User mitteilen:
1. Apps Script Code muss in den Editor kopiert werden
2. Neue Bereitstellung erstellen
3. Lernziele-Tab muss manuell im Sheet erstellt werden (Spalten: id, text, fach, thema, bloom, fragenIds) — oder wird automatisch beim ersten `speichereLernziel` erstellt
4. E2E-Browser-Test steht noch aus
