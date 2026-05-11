# Cluster A — Bug-Fixes Fragensammlung & Problemmeldungen

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6 Bugs (8 Sub-Issues) aus User-Test-Sweep 11.05.2026 beheben. Konsumiert G+E Foundation (Icons + TYPO).

**Architecture:** Two-Phase-Bundle:
- **A.1 (Frontend-only)**: Bugs 1-5 + `optimisticDelete`-Helper + Bug 6a defensive Display + Bug 6b Live-Verifikation. Kein Apps-Script-Touch.
- **A.2 (Apps-Script + Frontend)**: Bug 6c Löschen-Funktion mit neuem Backend-Endpoint `loescheProblemmeldung` (vorbild `loescheKIFeedback:13724`). User-Action: Apps-Script-Deploy.

**Tech Stack:** React 19 + TS + Vite + Vitest + Apps-Script. Konsumiert: `lucide-react`-Icons + `IconAbc`/`IconAB` + `TYPO`-Tokens (Foundation).

---

## Pre-Audit-Befunde (auflöst Spec §10 Offene Punkte)

| Frage | Befund | Konsequenz |
|---|---|---|
| Bug 1 Race-ID | Apps-Script generiert IDs. Lokaler Rollback mit gleicher ID nutzt `fuegeFragenHinzu` (unshift). Keine Konflikt-Quelle erkennbar. | Rollback einfach: vor Delete Detail aus Store cachen, bei Fail wieder hinzufügen. |
| Bug 3 max-height | `40vh` per Spec § 6, alternative `60vh`. | Default `40vh` mit `overflow-y-auto`, in Plan-Phase visuell verifiziert. |
| Bug 6a Backend-Schema | `Problemmeldung.comment` (Frontend Type + Apps-Script-Read-Spalte). Send-Side ist **externes Apps-Script** (separater URL, Black Box). | Defensive: `comment` korrekt rendern auch bei leer + alias-mapping `Kommentar` in `problemmeldungenColIdx_` Read. |
| Bug 6c Permission | Spec sagt unklar. Vorbild `loescheKIFeedback` lässt nur Owner löschen (lpEmail == row.lpEmail). | Plan: **Admin-only** initial (sicherer). User kann später erweitern. |
| `optimisticDelete`-Helper | Existiert nicht. Spec verlangt generic Helper. | Neu schreiben in `src/utils/optimisticDelete.ts` + Tests. |
| `Select.tsx` UI | Existiert nicht. Spec deutet auf neue Komponente. | Plan: **keine** neue Select-Komponente — nur focus-Klassen im existing `<select>` Element ändern (`indigo` → `violet`). Vermeidet Scope-Creep. |
| `useDeepLink` Pfad | `ExamLab/src/components/settings/problemmeldungen/useDeepLink.ts` existiert. Funktional Source-OK. | Bug 6b: nur Live-Test, vermutlich kein Code-Fix nötig. Falls Live broken: dort fixen. |

## File-Struktur

**Neue Files (A.1):**
- `ExamLab/src/utils/optimisticDelete.ts` — generic Helper
- `ExamLab/src/utils/optimisticDelete.test.ts`

**Modifizierte Files (A.1):**
- `ExamLab/src/hooks/useFragenAktionen.ts` — Optimistic-Delete-Pattern mit Rollback (Bug 1)
- `ExamLab/src/components/lp/fragensammlung/DraftsSection.tsx` — Header-Style + Scroll-Container (Bug 2, 3)
- `ExamLab/src/components/settings/EinstellungenPanel.tsx` — `ladeGruppen()`-Call (Bug 4)
- `ExamLab/src/store/ueben/gruppenStore.ts` — Idempotenz-Guard (Bug 4)
- `ExamLab/src/components/fragetypen/LueckentextFrage.tsx` — Brand-Violet focus (Bug 5)
- `ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx` — Display "(Kein Text)" wenn leer (Bug 6a)
- `ExamLab/apps-script-code.js` — `problemmeldungenColIdx_`-Alias `Kommentar` (Bug 6a defensive, falls Sende-Schema differiert)

**Modifizierte Files (A.2):**
- `ExamLab/apps-script-code.js` — neuer Endpoint `loescheProblemmeldung` (Bug 6c)
- `ExamLab/src/services/problemmeldungenApi.ts` — `loescheProblemmeldung`-Call
- `ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx` — Trash-Icon + Confirm-Modal (Bug 6c)

---

## Phase A.1: Frontend-Only Bugs (1, 2, 3, 4, 5, 6a, 6b)

### Task A.1.0: Feature-Branch + Sync

- [ ] **Step 1: Branch anlegen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull origin main
git checkout -b feature/cluster-a-bugfixes
```

### Task A.1.1: `optimisticDelete`-Helper — TDD (Bug 1, Bug 6c später)

- [ ] **Step 1: Test schreiben**

```ts
// ExamLab/src/utils/optimisticDelete.test.ts
import { describe, it, expect, vi } from 'vitest'
import { optimisticDelete } from './optimisticDelete'

describe('optimisticDelete', () => {
  it('Happy Path: optimisticRemove → backendCall → onSuccess', async () => {
    const optimisticRemove = vi.fn()
    const backendCall = vi.fn().mockResolvedValue(undefined)
    const rollback = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    await optimisticDelete({ optimisticRemove, backendCall, rollback, onSuccess, onError })

    expect(optimisticRemove).toHaveBeenCalledOnce()
    expect(backendCall).toHaveBeenCalledOnce()
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(rollback).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('Error-Pfad: optimisticRemove → backendCall throws → rollback + onError', async () => {
    const error = new Error('network')
    const optimisticRemove = vi.fn()
    const backendCall = vi.fn().mockRejectedValue(error)
    const rollback = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    await optimisticDelete({ optimisticRemove, backendCall, rollback, onSuccess, onError })

    expect(optimisticRemove).toHaveBeenCalledOnce()
    expect(rollback).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(error)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('Call-Reihenfolge: remove vor backend, rollback vor onError', async () => {
    const order: string[] = []
    await optimisticDelete({
      optimisticRemove: () => { order.push('remove') },
      backendCall: async () => { order.push('backend'); throw new Error('x') },
      rollback: () => { order.push('rollback') },
      onSuccess: () => { order.push('success') },
      onError: () => { order.push('error') },
    })
    expect(order).toEqual(['remove', 'backend', 'rollback', 'error'])
  })
})
```

- [ ] **Step 2: FAIL bestätigen**

Run: `cd ExamLab && npx vitest run src/utils/optimisticDelete.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: optimisticDelete.ts implementieren**

```ts
// ExamLab/src/utils/optimisticDelete.ts
/**
 * Generischer Optimistic-Delete-Pattern mit Error-Recovery.
 *
 * Ablauf:
 * 1. `optimisticRemove()` — UI sofort entfernt (vor Backend-Call)
 * 2. `await backendCall()` — Backend persistiert
 * 3a. Bei Erfolg: `onSuccess()` — z.B. Toast-Success
 * 3b. Bei Fehler: `rollback()` + `onError(err)` — z.B. Eintrag wieder einfügen + Toast-Error mit Retry
 *
 * Caller injiziert Toast-API über `onSuccess`/`onError`, Helper bleibt entkoppelt.
 *
 * @example
 * const detail = useFragensammlungStore.getState().detailCache.get(id)
 * await optimisticDelete({
 *   optimisticRemove: () => store.entferneFrage(id),
 *   backendCall: () => apiService.loescheFrage(email, id, fachbereich),
 *   rollback: () => { if (detail) store.fuegeFragenHinzu([detail]) },
 *   onSuccess: () => toast.success('Entwurf gelöscht'),
 *   onError: () => toast.error('Konnte nicht gelöscht werden — bitte erneut versuchen'),
 * })
 */
export async function optimisticDelete({
  optimisticRemove,
  backendCall,
  rollback,
  onSuccess,
  onError,
}: {
  optimisticRemove: () => void
  backendCall: () => Promise<void>
  rollback: () => void
  onSuccess: () => void
  onError: (err: Error) => void
}): Promise<void> {
  optimisticRemove()
  try {
    await backendCall()
    onSuccess()
  } catch (err) {
    rollback()
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}
```

- [ ] **Step 4: PASS verifizieren**

Run: `cd ExamLab && npx vitest run src/utils/optimisticDelete.test.ts`
Expected: 3/3 PASS.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/optimisticDelete.ts ExamLab/src/utils/optimisticDelete.test.ts
git commit -m "$(cat <<'EOF'
ExamLab: optimisticDelete-Helper mit Error-Recovery (Cluster A)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task A.1.2: Bug 1 — Entwurf-Delete mit Rollback

**Files:** `ExamLab/src/hooks/useFragenAktionen.ts:44-56`

- [ ] **Step 1: Aktuellen Code lesen**

Run: `cd ExamLab && grep -n "bestaetigenLoeschen\|entferneFrage" src/hooks/useFragenAktionen.ts`

- [ ] **Step 2: bestaetigenLoeschen umschreiben**

Pre-Read aus Store: `detailCache.get(loeschId)` als Snapshot vor Delete. Wenn nicht in Cache → mache `loescheBestaetigung` ohne Rollback-Fähigkeit (nur Toast-Warnung).

Pattern:
```ts
import { optimisticDelete } from '@/utils/optimisticDelete'
import { useToast } from '@/hooks/useToast'

// in der Hook-Definition:
const toast = useToast()

async function bestaetigenLoeschen(/* args */) {
  const store = useFragensammlungStore.getState()
  const detailSnapshot = store.detailCache.get(loeschId)
  // … existing context …

  await optimisticDelete({
    optimisticRemove: () => store.entferneFrage(loeschId),
    backendCall: () => apiService.loescheFrage(email, loeschId, fachbereich),
    rollback: () => {
      if (detailSnapshot) store.fuegeFragenHinzu([detailSnapshot])
    },
    onSuccess: () => toast.success('Entwurf gelöscht'),
    onError: () => toast.error('Konnte nicht gelöscht werden — bitte erneut versuchen'),
  })
}
```

- [ ] **Step 3: Vorhandene Tests prüfen**

Run: `cd ExamLab && find src -name 'useFragenAktionen.test.*'`
Falls kein Test existiert: ein neuer Smoke-Test mit Mock-Toast + Mock-Backend wäre wertvoll (TDD-Bonus). Optional. **Nicht-Blocker** für diese Phase.

- [ ] **Step 4: Verifikation**

Run: `cd ExamLab && npm test 2>&1 | tail -5 && npx tsc -b 2>&1 | tail -3`
Expected: keine neuen FAILs.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/hooks/useFragenAktionen.ts
git commit -m "$(cat <<'EOF'
ExamLab: Bug 1 — Entwurf-Löschen mit Rollback bei Backend-Fehler (Cluster A)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task A.1.3: Bug 2 + 3 — DraftsSection Header + Scroll-Container

**Files:** `ExamLab/src/components/lp/fragensammlung/DraftsSection.tsx`

- [ ] **Step 1: Aktuellen Header lesen**

Run: `cd ExamLab && head -100 src/components/lp/fragensammlung/DraftsSection.tsx`

- [ ] **Step 2: Header-Style auf Themen-Style angleichen**

Bug 2 Fix — Header-Wrapper-Klasse ersetzen:
- Alt: `px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-700` (kein bg, kein sticky)
- Neu: `sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2`
- Header-Button-Text: nutze `TYPO.h2` (importiert aus `@/styles/typografie`) statt `text-sm font-semibold`. Falls Tailwind-Klassen-Resolution-Konflikt: erst `TYPO.h2` einbauen + visuell prüfen.

Bug 3 Fix — Body-Container (ausgeklappt):
- Im Inner-Container der Drafts-Items (nach Toggle) ergänze: `max-h-[40vh] overflow-y-auto`

- [ ] **Step 3: Lucide-Chevrons aus Foundation einbauen**

Replace existing Toggle-Icon mit:
```tsx
import { ChevronDown, ChevronRight } from 'lucide-react'
// ...
{istAusgeklappt
  ? <ChevronDown className="w-4 h-4 text-slate-500" />
  : <ChevronRight className="w-4 h-4 text-slate-500" />}
```

- [ ] **Step 4: Verifikation**

Run: `cd ExamLab && npm test 2>&1 | tail -3 && npx tsc -b 2>&1 | tail -3`
Expected: keine FAILs.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/fragensammlung/DraftsSection.tsx
git commit -m "$(cat <<'EOF'
ExamLab: Bug 2+3 — DraftsSection sticky Header + max-h-40vh Scroll-Container (Cluster A)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task A.1.4: Bug 4 — ladeGruppen Idempotenz + EinstellungenPanel-Mount

**Files:** `ExamLab/src/store/ueben/gruppenStore.ts:32-78`, `ExamLab/src/components/settings/EinstellungenPanel.tsx`, `ExamLab/src/components/ueben/admin/AdminSettings.tsx:34`

- [ ] **Step 1: gruppenStore.ladeGruppen — Idempotenz-Guard**

Am Anfang der `ladeGruppen`-Action:
```ts
const state = get()
if (state.ladeStatus === 'laden') return  // bereits am Laden
if (state.ladeStatus === 'fertig' && !opts?.force) return  // bereits geladen
```

Signature ggf. erweitern: `ladeGruppen(opts?: { force?: boolean })`.

- [ ] **Step 2: EinstellungenPanel-Mount**

In `EinstellungenPanel.tsx` useEffect (nach `ladeStammdaten`/`ladeLPProfil`):
```ts
useGruppenStore.getState().ladeGruppen()
```
Idempotent dank Guard aus Step 1.

- [ ] **Step 3: AdminSettings useEffect bleibt als Backup**

Existing Code (`AdminSettings.tsx:33-35`) bleibt unverändert — Guard sorgt für no-op.

- [ ] **Step 4: Verifikation + Commit**

Run: `cd ExamLab && npm test 2>&1 | tail -3 && npx tsc -b 2>&1 | tail -3`

```bash
git add ExamLab/src/store/ueben/gruppenStore.ts ExamLab/src/components/settings/EinstellungenPanel.tsx
git commit -m "$(cat <<'EOF'
ExamLab: Bug 4 — ladeGruppen Idempotenz-Guard + Mount in EinstellungenPanel (Cluster A)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task A.1.5: Bug 5 — Lückentext focus-Color violet statt indigo

**Files:** `ExamLab/src/components/fragetypen/LueckentextFrage.tsx:121-164`

- [ ] **Step 1: indigo → violet**

In Tags `<select>` und `<input>` jeweils `focus:border-indigo-500` → `focus:border-violet-500`. Zusätzlich `focus:ring-2 focus:ring-violet-500 outline-none` ergänzen für definierten Focus-Ring (Safari-kompatibel).

Bei `<select>`: zusätzlich `appearance-none bg-white dark:bg-slate-800 cursor-pointer` für brand-konformes Aussehen (Browser-Default-Pfeil bleibt aber sichtbar — alternativ: kein appearance-none, nur focus-Ring ändern).

- [ ] **Step 2: Verifikation + Commit**

Run: `cd ExamLab && npm test 2>&1 | tail -3 && npx tsc -b 2>&1 | tail -3`

```bash
git add ExamLab/src/components/fragetypen/LueckentextFrage.tsx
git commit -m "$(cat <<'EOF'
ExamLab: Bug 5 — Lückentext focus-Color violet statt indigo (Cluster A)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task A.1.6: Bug 6a — Defensive Display + Backend-Alias

**Files:** `ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx:60-62`, `ExamLab/apps-script-code.js` (problemmeldungenColIdx_)

- [ ] **Step 1: Frontend Display**

In `ProblemmeldungZeile.tsx` Zeile mit `{meldung.comment && <p>...{meldung.comment}</p>}` ersetzen durch:
```tsx
<p className="text-sm text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-wrap break-words">
  {meldung.comment?.trim() || <span className="italic text-slate-400">(Kein Text)</span>}
</p>
```

- [ ] **Step 2: Apps-Script `problemmeldungenColIdx_`-Alias `Kommentar`**

Run: `cd ExamLab && grep -n "problemmeldungenColIdx_\|function problemmeldungenColIdx" apps-script-code.js | head -5`

Erwartet: Lookup-Helper ~Z. 732. Im Mapping-Block die Alias-Liste für `comment` ergänzen so dass `Kommentar`/`COMMENT`/`text` auch erkannt werden (defensive falls externes Sende-Apps-Script andere Header schreibt).

**Beispiel-Pattern:**
```js
function problemmeldungenColIdx_(headers, name) {
  const normalized = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = {
    comment: ['comment', 'kommentar', 'text', 'message', 'inhalt'],
    // ... etc.
  };
  const candidates = aliases[normalized] || [normalized];
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (candidates.includes(h)) return i;
  }
  return -1;
}
```

Falls die existing Funktion eine andere Signatur hat: adaptieren.

**Apps-Script-Deploy nötig?** Wenn `problemmeldungenColIdx_` schon im Backend aktiv ist und Alias-Mapping nur defensiv ist, dann ja — der Cluster-A.2-Deploy bündelt das mit dem 6c-Endpoint.

- [ ] **Step 3: Verifikation + Commit**

```bash
git add ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Bug 6a — Problemmeldung Display (Kein Text)-Fallback + Apps-Script alias-mapping (Cluster A)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task A.1.7: Bug 6b — useDeepLink Live-Verifikation

Audit hat ergeben: Route + Hook + Render-Bedingung existieren funktional. Bug ist möglicherweise nur Live-Symptom.

- [ ] **Step 1: Smoke-Test ohne Code-Änderung**

Lokal `npm run dev` starten, mit LP-Login → Einstellungen → Problemmeldungen → eine Meldung mit `frageId`-Ziel öffnen → in URL prüfen ob `/fragensammlung/<id>` navigiert wird.

**Falls funktioniert:** Bug-Fix nicht nötig. Notiere in HANDOFF.

**Falls broken:** Stack-Trace in Console prüfen + im selben Bundle fixen. Plan-Phase darf hier Live-Befund nachpflegen.

- [ ] **Step 2: Wenn nicht broken → kein Commit, weiter zu A.1.8**

### Task A.1.8: A.1-Verifikation + Push zu Preview

- [ ] **Step 1: Verification-Gates**

Run:
```bash
cd ExamLab
npm test 2>&1 | tail -5
npx tsc -b 2>&1 | tail -5
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract
npm run build 2>&1 | tail -5
```

- [ ] **Step 2: Stop-Punkt nach A.1**

A.1 ist Frontend-only. Hier können wir bereits zu preview + main pushen, oder direkt mit A.2 weitermachen. **Empfehlung:** Wenn A.2 in derselben Session kommt: nicht zu preview pushen, sondern beide zusammen.

---

## Phase A.2: Bug 6c — Löschen-Funktion (Apps-Script + Frontend)

### Task A.2.1: Apps-Script `loescheProblemmeldung` Endpoint

**Files:** `ExamLab/apps-script-code.js`

- [ ] **Step 1: Vorbild `loescheKIFeedback` lesen**

Run: `cd ExamLab && sed -n '13720,13760p' apps-script-code.js`
Erwartet: Function-Body mit `istZugelasseneLP`, `LockService`, header-Lookup, `sheet.deleteRow(i+1)`, `auditLog_`.

- [ ] **Step 2: Neuer Endpoint `loescheProblemmeldung(body)`**

Analog `loescheKIFeedback`, aber:
- Auth: **Admin-only**. `if (!Stammdaten.admins.includes(body.email)) throw new Error('Nur Admins')`.
  - Stammdaten-Source-Audit: wie greifen wir auf Admins zu? Plan-Phase prüft (vermutlich `ladeStammdaten_` oder konstantes Array). Falls Admin-Liste nur in Frontend Stammdaten ist: Endpoint nutzt explizite Admin-Email-Liste (z.B. `['yannick.durand@gymhofwil.ch']`) oder ruft `ladeStammdaten_().admins`.
- ID-Suche im Sheet via `findIndex` auf Spalte `id`.
- `sheet.deleteRow(rowIdx + 2)` (1-based + Header-Zeile).
- `auditLog_` falls Pattern existiert.
- Return: `{ ok: true }` oder `{ ok: false, error: '...' }`.

- [ ] **Step 3: doPost-Router-Case**

In `apps-script-code.js` doPost ergänzen (Action-Mapper Zeile findet sich bei `case 'toggleProblemmeldung'`):
```js
case 'loescheProblemmeldung': return jsonResponse(loescheProblemmeldung(body));
```

- [ ] **Step 4: Wire-Contract-Audit auf neue Action**

Run: `cd ExamLab && npm run lint:wire-contract 2>&1 | tail -5`
Expected: 60/0 (war 59/0 vor F.1, jetzt neue Action `loescheProblemmeldung`).

- [ ] **Step 5: Commit Apps-Script-Änderung**

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Apps-Script loescheProblemmeldung-Endpoint (Admin-only, Cluster A.2)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task A.2.2: Frontend Service + UI

**Files:** `ExamLab/src/services/problemmeldungenApi.ts`, `ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx`

- [ ] **Step 1: Service-Function**

In `problemmeldungenApi.ts` ergänzen analog `toggleProblemmeldung`:
```ts
export async function loescheProblemmeldung(email: string, id: string): Promise<void> {
  await postJson<{ ok: boolean }>('loescheProblemmeldung', { email, id })
}
```

- [ ] **Step 2: UI Trash-Button + Confirm-Modal**

In `ProblemmeldungZeile.tsx`:
- Trash-Icon (`Trash2` aus `lucide-react`) rechts neben „Öffnen"-Button. Nur sichtbar wenn `istAdmin === true`.
- onClick öffnet Confirm-Modal: „Problemmeldung löschen? Nicht rückgängig zu machen."
- Bei Bestätigung: `optimisticDelete`-Helper anwenden:
  ```ts
  await optimisticDelete({
    optimisticRemove: () => store.entferneProblemmeldung(meldung.id),
    backendCall: () => loescheProblemmeldung(email, meldung.id),
    rollback: () => store.fuegeProblemmeldungHinzu(meldung),
    onSuccess: () => toast.success('Problemmeldung gelöscht'),
    onError: () => toast.error('Konnte nicht gelöscht werden — bitte erneut versuchen'),
  })
  ```

- [ ] **Step 3: Store-Hooks falls fehlend**

`problemmeldungenStore.entferneProblemmeldung(id)` + `fuegeProblemmeldungHinzu(meldung)` müssen existieren oder ergänzt werden. Plan-Phase grep prüft.

- [ ] **Step 4: Verifikation + Commit**

```bash
git add ExamLab/src/services/problemmeldungenApi.ts ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx [+ ggf. Store-Datei]
git commit -m "$(cat <<'EOF'
ExamLab: Bug 6c — Problemmeldung-Löschen UI + Service (Cluster A.2)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Definition of Done

### A.1 DoD:
- [ ] `optimisticDelete`-Helper + 3 Tests grün
- [ ] Bug 1: Entwurf-Löschen mit Rollback (try/catch + Toast-API)
- [ ] Bug 2+3: DraftsSection sticky Header + max-h-40vh Scroll-Container
- [ ] Bug 4: gruppenStore Idempotenz + EinstellungenPanel-Mount
- [ ] Bug 5: Lückentext focus-Ring violet-500
- [ ] Bug 6a: ProblemmeldungZeile Defensive Display + Apps-Script alias-mapping
- [ ] Bug 6b: Live-verifiziert oder fixed
- [ ] vitest baseline +3 = 1564 PASSED
- [ ] tsc + 5× lint + build clean

### A.2 DoD:
- [ ] Apps-Script `loescheProblemmeldung` Endpoint (Admin-only)
- [ ] doPost-Case neu
- [ ] Wire-Contract 60/0
- [ ] Frontend `loescheProblemmeldung`-Service
- [ ] UI: Trash-Icon + Confirm-Modal + `optimisticDelete`-Aufruf
- [ ] **User-Action: Apps-Script-Deploy** ✓
- [ ] Browser-E2E mit Yannick-Admin-Login: Trash-Icon klickbar, Modal öffnet, Löschen funktioniert

## Out-of-Scope (explizit)

- Soft-Delete-Workflow für Entwürfe (Papierkorb)
- Bulk-Lösch für Problemmeldungen (Cluster D Pattern)
- Problemmeldung-Status-Workflow (gelesen/in-Bearbeitung/erledigt)
- `useDeepLink` für nicht-Frage-Ziele (nur frageId-Pfad ist Bug 6b Scope)
