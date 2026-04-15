# Bundle 13 Cluster I — Üben-Übungen Tab-Architektur — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flache Navigation im LP-Üben-Bereich: Kurs-Tabs direkt in der oberen Tab-Leiste neben "Übungen", Entfall der AdminDashboard-Zwischentabs, Fachfreischaltung pro Kurs in Einstellungen.

**Architecture:** Tab-Leisten-Logik aus der überladenen `LPStartseite.tsx` (1200+ Z.) in eine eigene Komponente `UebenTabLeiste.tsx` extrahieren. Kurs-Auswahl via URL-Param `/uebung/kurs/:kursId` mit localStorage-Fallback. `AdminDashboard` rendert direkt Themensteuerung; Übersicht-Seite wird entfernt. Neue Fach-Chip-Sektion im FaecherTab schreibt in existierendes `GruppenEinstellungen.sichtbareFaecher`.

**Tech Stack:** React 19 + TypeScript + React Router v6 + Zustand + Tailwind CSS v4 + Vitest

**Spec:** `ExamLab/docs/superpowers/specs/2026-04-15-bundle13-cluster-i-design.md`

**Branch:** `feature/bundle13-cluster-i` (bereits erstellt, Spec committet)

---

## File Structure

| Datei | Rolle | Status |
|---|---|---|
| `ExamLab/src/router/Router.tsx` | Neue Route `/uebung/kurs/:kursId` | modify |
| `ExamLab/src/components/lp/uebung/UebenTabLeiste.tsx` | Eigenständige Tab-Leiste (Übung durchführen / Übungen / Kurs-Tabs / Analyse) | **create** |
| `ExamLab/src/components/lp/uebung/UebenTabLeiste.test.tsx` | Unit-Tests (vitest + @testing-library) | **create** |
| `ExamLab/src/components/lp/LPStartseite.tsx` | Tab-Rendering ersetzt durch `<UebenTabLeiste>`, URL-Sync, localStorage | modify |
| `ExamLab/src/components/ueben/admin/AdminDashboard.tsx` | Interne Tabs entfernen, direkt AdminThemensteuerung | modify |
| `ExamLab/src/components/ueben/admin/AdminUebersicht.tsx` | **Löschen** | delete |
| `ExamLab/src/components/lp/UebungsToolView.tsx` | Gruppen-Info-Bar entfernen, Kurs-ID als Prop empfangen | modify |
| `ExamLab/src/components/ueben/admin/settings/FaecherTab.tsx` | Sektion "Freigeschaltete Fächer pro Kurs" ergänzen | modify |

**Verworfen (Scope):**
- Overflow-Dropdown bei >10 Kursen (nicht nötig bei aktuell max. 8 Kursen)
- Kein-Kurs-Ansicht Überarbeitung (bleibt bestehende UebungsToolView-Leerstand)

---

## Task 1: Router — neue Kurs-Route

**Files:**
- Modify: `ExamLab/src/router/Router.tsx`

**Rationale:** Deep-Link-fähige URL `/uebung/kurs/:kursId` erzeugt `useParams()`-Context, den LPStartseite konsumiert.

- [ ] **Step 1: Route hinzufügen**

In `ExamLab/src/router/Router.tsx` — nach bestehender `/uebung/analyse`-Route:

```tsx
<Route path="/uebung/kurs/:kursId" element={<LPGuard><LPFlow /></LPGuard>} />
```

- [ ] **Step 2: tsc + bestehende Tests prüfen**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Expected: Alle 246 Tests grün.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/router/Router.tsx
git commit -m "Bundle 13 I-1: Route /uebung/kurs/:kursId"
```

---

## Task 2: UebenTabLeiste — Komponente + Tests

**Files:**
- Create: `ExamLab/src/components/lp/uebung/UebenTabLeiste.tsx`
- Create: `ExamLab/src/components/lp/uebung/UebenTabLeiste.test.tsx`

**Rationale:** Tab-Logik aus LPStartseite in gekapselte Komponente. Rendert inline Kurs-Tabs wenn "Übungen" aktiv.

**Props-Design:**
```ts
interface UebenTabLeisteProps {
  /** Aktueller Sub-Modus */
  aktiv: 'durchfuehren' | 'uebungen' | 'analyse'
  /** Aktiv-Kurs (nur relevant wenn aktiv='uebungen') */
  aktiverKursId?: string
  /** Liste der verfügbaren Kurse */
  gruppen: Array<{ id: string; name: string }>
  /** Handler — nav zur passenden URL via Parent */
  onDurchfuehren: () => void
  onUebungen: () => void
  onAnalyse: () => void
  onKursWaehle: (kursId: string) => void
}
```

- [ ] **Step 1: Test-File erstellen — inaktiv Übungen**

Create `ExamLab/src/components/lp/uebung/UebenTabLeiste.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UebenTabLeiste } from './UebenTabLeiste'

describe('UebenTabLeiste', () => {
  const noop = () => {}
  const gruppen = [
    { id: 'sf-wr-29c', name: 'SF WR 29c' },
    { id: 'in-28c', name: 'IN 28c' },
  ]

  it('rendert Haupttabs ohne Kurs-Tabs wenn Übungen inaktiv', () => {
    render(
      <UebenTabLeiste
        aktiv="durchfuehren"
        gruppen={gruppen}
        onDurchfuehren={noop}
        onUebungen={noop}
        onAnalyse={noop}
        onKursWaehle={noop}
      />
    )
    expect(screen.getByRole('button', { name: /Übung durchführen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Übungen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Analyse/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SF WR 29c/i })).not.toBeInTheDocument()
  })

  it('rendert Kurs-Tabs wenn Übungen aktiv', () => {
    render(
      <UebenTabLeiste
        aktiv="uebungen"
        aktiverKursId="sf-wr-29c"
        gruppen={gruppen}
        onDurchfuehren={noop}
        onUebungen={noop}
        onAnalyse={noop}
        onKursWaehle={noop}
      />
    )
    expect(screen.getByRole('button', { name: /SF WR 29c/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /IN 28c/i })).toBeInTheDocument()
  })

  it('Klick auf Kurs-Tab ruft onKursWaehle mit kursId', async () => {
    const onKursWaehle = vi.fn()
    render(
      <UebenTabLeiste
        aktiv="uebungen"
        aktiverKursId="sf-wr-29c"
        gruppen={gruppen}
        onDurchfuehren={noop}
        onUebungen={noop}
        onAnalyse={noop}
        onKursWaehle={onKursWaehle}
      />
    )
    screen.getByRole('button', { name: /IN 28c/i }).click()
    expect(onKursWaehle).toHaveBeenCalledWith('in-28c')
  })

  it('markiert aktiven Kurs-Tab', () => {
    render(
      <UebenTabLeiste
        aktiv="uebungen"
        aktiverKursId="sf-wr-29c"
        gruppen={gruppen}
        onDurchfuehren={noop}
        onUebungen={noop}
        onAnalyse={noop}
        onKursWaehle={noop}
      />
    )
    const aktiv = screen.getByRole('button', { name: /SF WR 29c/i })
    expect(aktiv.className).toMatch(/filter-btn-active/)
  })

  it('rendert keine Kurs-Tabs wenn gruppen leer', () => {
    render(
      <UebenTabLeiste
        aktiv="uebungen"
        gruppen={[]}
        onDurchfuehren={noop}
        onUebungen={noop}
        onAnalyse={noop}
        onKursWaehle={noop}
      />
    )
    expect(screen.queryByRole('button', { name: /SF WR 29c/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen (Datei existiert nicht)**

```bash
cd ExamLab && npx vitest run src/components/lp/uebung/UebenTabLeiste.test.tsx
```
Expected: FAIL mit "Failed to resolve import './UebenTabLeiste'".

- [ ] **Step 3: Komponente implementieren**

Create `ExamLab/src/components/lp/uebung/UebenTabLeiste.tsx`:

```tsx
interface Gruppe {
  id: string
  name: string
}

export interface UebenTabLeisteProps {
  aktiv: 'durchfuehren' | 'uebungen' | 'analyse'
  aktiverKursId?: string
  gruppen: Gruppe[]
  onDurchfuehren: () => void
  onUebungen: () => void
  onAnalyse: () => void
  onKursWaehle: (kursId: string) => void
}

const tabBase = 'px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer'
const tabAktiv = 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
const tabInaktiv = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
// Kurs-Tab-Stil nutzt .filter-btn (S110 Hover/Active-System)
const kursBase = 'filter-btn'
const kursAktiv = 'filter-btn-active'

export function UebenTabLeiste({
  aktiv, aktiverKursId, gruppen,
  onDurchfuehren, onUebungen, onAnalyse, onKursWaehle,
}: UebenTabLeisteProps) {
  const uebungenOffen = aktiv === 'uebungen'

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
      <button
        onClick={onDurchfuehren}
        className={`${tabBase} ${aktiv === 'durchfuehren' ? tabAktiv : tabInaktiv}`}
      >
        Übung durchführen
      </button>

      <button
        onClick={onUebungen}
        className={`${tabBase} ${uebungenOffen ? tabAktiv : tabInaktiv}`}
      >
        Übungen
      </button>

      {/* Kurs-Tabs — nur wenn "Übungen" aktiv */}
      {uebungenOffen && gruppen.map(g => {
        const istAktiv = g.id === aktiverKursId
        return (
          <button
            key={g.id}
            onClick={() => onKursWaehle(g.id)}
            className={`${kursBase} ${istAktiv ? kursAktiv : ''}`}
          >
            {g.name}
          </button>
        )
      })}

      <button
        onClick={onAnalyse}
        className={`${tabBase} ${aktiv === 'analyse' ? tabAktiv : tabInaktiv}`}
      >
        Analyse
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Tests ausführen — müssen passen**

```bash
cd ExamLab && npx vitest run src/components/lp/uebung/UebenTabLeiste.test.tsx
```
Expected: 5 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/uebung/UebenTabLeiste.tsx ExamLab/src/components/lp/uebung/UebenTabLeiste.test.tsx
git commit -m "Bundle 13 I-2: UebenTabLeiste mit Kurs-Tabs"
```

---

## Task 3: LPStartseite — Integration UebenTabLeiste + URL-Sync

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

**Rationale:** Bestehende 3-Tab-Leiste (Zeilen ~432–478) ersetzen durch UebenTabLeiste. URL lesen/schreiben via react-router `useParams` + `useNavigate`.

**Kontext:**
- State `uebungsTab: 'durchfuehren' | 'uebungen' | 'analyse'` existiert bereits
- Neu: `aktiverKursId: string | undefined` aus `useParams<{ kursId }>()`
- useEffect: aktiverKursId → localStorage `examlab-ueben-letzter-kurs`

- [ ] **Step 1: Imports + Hooks hinzufügen**

Oberhalb des bestehenden Imports in `LPStartseite.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { UebenTabLeiste } from './uebung/UebenTabLeiste'
```

**Achtung:** `useNavigate` ist ggf. schon importiert. Prüfen.

- [ ] **Step 2: Kurs-ID aus URL + localStorage-Fallback**

Innerhalb der Komponente, nach bestehenden useAuthStore/useUebenGruppenStore-Hooks:

```tsx
const navigate = useNavigate()
const { kursId: urlKursId } = useParams<{ kursId?: string }>()
const gruppen = useUebenGruppenStore(s => s.gruppen)

// Abgeleiteter Zustand: aktiver Kurs (URL > localStorage > erste Gruppe)
const aktiverKursId = urlKursId
const aktiverKurs = gruppen.find(g => g.id === aktiverKursId)

// Bei ungültiger URL-ID: Redirect auf ersten Kurs oder /uebung
useEffect(() => {
  if (modus !== 'uebung' || uebungsTab !== 'uebungen') return
  if (urlKursId && !aktiverKurs && gruppen.length > 0) {
    // Unbekannte ID → auf ersten Kurs + Toast
    navigate(`/uebung/kurs/${gruppen[0].id}`, { replace: true })
    // TODO: Toast-System — aktuell console.warn
    console.warn(`[Üben] Kurs "${urlKursId}" nicht gefunden, auf ${gruppen[0].id} umgeleitet`)
  }
}, [urlKursId, aktiverKurs, gruppen, modus, uebungsTab, navigate])

// localStorage: letzter Kurs speichern
useEffect(() => {
  if (aktiverKursId) {
    localStorage.setItem('examlab-ueben-letzter-kurs', aktiverKursId)
  }
}, [aktiverKursId])
```

- [ ] **Step 3: Tab-Leiste ersetzen**

Zeilen ~437–470 (die drei Button-Blöcke mit Tab-Stil) komplett ersetzen durch:

```tsx
<UebenTabLeiste
  aktiv={uebungsTab === 'uebungen' ? 'uebungen' : uebungsTab === 'analyse' ? 'analyse' : 'durchfuehren'}
  aktiverKursId={aktiverKursId}
  gruppen={gruppen}
  onDurchfuehren={() => {
    setUebungsTab('durchfuehren')
    navigate('/uebung/durchfuehren')
  }}
  onUebungen={() => {
    setUebungsTab('uebungen')
    // letzten Kurs oder ersten nehmen
    const letzter = localStorage.getItem('examlab-ueben-letzter-kurs')
    const zielId = gruppen.find(g => g.id === letzter)?.id ?? gruppen[0]?.id
    if (zielId) {
      navigate(`/uebung/kurs/${zielId}`)
    } else {
      navigate('/uebung')
    }
  }}
  onAnalyse={() => {
    setUebungsTab('analyse')
    navigate('/uebung/analyse')
  }}
  onKursWaehle={(kursId) => {
    setUebungsTab('uebungen')
    navigate(`/uebung/kurs/${kursId}`)
  }}
/>
```

- [ ] **Step 4: UebungsToolView mit aktiver Gruppe aufrufen**

Zeile ~482: `{uebungsTab === 'uebungen' && <UebungsToolView ... />}` anpassen, damit Gruppen-Wahl auf `aktiverKursId` synchronisiert ist:

```tsx
{uebungsTab === 'uebungen' && (
  <UebungsToolView
    aktiverKursId={aktiverKursId}
    onFachKlick={() => setModus('fragensammlung')}
  />
)}
```

**Hinweis:** `aktiverKursId` ist neue Prop an UebungsToolView — siehe Task 6.

- [ ] **Step 5: URL → setUebungsTab synchronisieren (beim Laden/Refresh)**

Damit ein Refresh auf `/uebung/kurs/...` den richtigen Tab aktiviert:

```tsx
useEffect(() => {
  if (modus !== 'uebung') return
  const pfad = window.location.pathname
  if (pfad.startsWith('/uebung/kurs/')) setUebungsTab('uebungen')
  else if (pfad === '/uebung/analyse') setUebungsTab('analyse')
  else if (pfad === '/uebung/durchfuehren') setUebungsTab('durchfuehren')
  // Fallback /uebung bleibt 'durchfuehren' (Default)
}, [modus])
```

Alternative: useLocation statt window.location. Falls useLocation bereits importiert → nutzen.

- [ ] **Step 6: tsc + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Expected: alles grün.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "Bundle 13 I-3: LPStartseite nutzt UebenTabLeiste + URL-Sync"
```

---

## Task 4: UebungsToolView — aktiverKursId-Prop, Info-Bar entfernen

**Files:**
- Modify: `ExamLab/src/components/lp/UebungsToolView.tsx`

**Rationale:** Gruppen-Info-Bar (Zeilen ~215–237) entfällt. Aktive Gruppe kommt von LPStartseite via Prop. Sync zum Store via `waehleGruppe(kursId)` bei Prop-Wechsel.

- [ ] **Step 1: Prop ergänzen**

```tsx
interface UebungsToolViewProps {
  onFachKlick?: () => void
  /** Aktiver Kurs aus URL (LPStartseite) — synchronisiert Store bei Wechsel */
  aktiverKursId?: string
}

export default function UebungsToolView({ onFachKlick, aktiverKursId }: UebungsToolViewProps = {}) {
```

- [ ] **Step 2: Gruppe im Store synchronisieren**

Nach bestehenden Hooks:

```tsx
useEffect(() => {
  if (aktiverKursId && aktiveGruppe?.id !== aktiverKursId) {
    void waehleGruppe(aktiverKursId)
  }
}, [aktiverKursId, aktiveGruppe, waehleGruppe])
```

`waehleGruppe` existiert schon im Store.

- [ ] **Step 3: Gruppen-Info-Bar entfernen**

Zeilen ~214–237 (der `<div>` mit "Gruppen-Info-Bar") löschen. `<AdminDashboard ... />` bleibt.

Vorher:
```tsx
<UebenKontextProvider>
  <div className="relative">
    {/* Gruppen-Info-Bar */}
    <div className="bg-white dark:bg-slate-800 border-b ...">
      ... Kurs-Dropdown, Mitglieder-Stats ...
    </div>
    <AdminDashboard onFachKlick={onFachKlick} />
  </div>
</UebenKontextProvider>
```

Nachher:
```tsx
<UebenKontextProvider>
  <AdminDashboard onFachKlick={onFachKlick} />
</UebenKontextProvider>
```

`handleGruppeWaehlen` wird danach vermutlich unused → entfernen oder `// eslint-disable-next-line` wenn referenziert.

- [ ] **Step 4: tsc + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/UebungsToolView.tsx
git commit -m "Bundle 13 I-4: UebungsToolView konsumiert aktiverKursId-Prop"
```

---

## Task 5: AdminDashboard — interne Tabs entfernen

**Files:**
- Modify: `ExamLab/src/components/ueben/admin/AdminDashboard.tsx`

**Rationale:** Tabs "Übersicht"/"Themen" entfallen. Rendert direkt AdminThemensteuerung + Detail-Views (Kind/Thema mit Breadcrumb).

- [ ] **Step 1: AdminAnsicht-Type anpassen**

`typ: 'uebersicht'` und `typ: 'themensteuerung'` zu einer Haupt-Ansicht konsolidieren:

```tsx
type AdminAnsicht =
  | { typ: 'haupt' }  // war: uebersicht | themensteuerung
  | { typ: 'kind'; email: string; name: string }
  | { typ: 'thema'; email: string; name: string; fach: string; thema: string }
```

- [ ] **Step 2: Initialer State + zurueck**

```tsx
const [ansicht, setAnsicht] = useState<AdminAnsicht>({ typ: 'haupt' })

const zurueck = () => {
  if (ansicht.typ === 'thema') {
    setAnsicht({ typ: 'kind', email: ansicht.email, name: ansicht.name })
  } else {
    setAnsicht({ typ: 'haupt' })
  }
}

const istHauptTab = ansicht.typ === 'haupt'
```

- [ ] **Step 3: Tab-Leiste entfernen**

Den gesamten `{istHauptTab && (<div ... TabBar ... />)}`-Block löschen (Zeilen ~54–69).

- [ ] **Step 4: Render-Logik vereinfachen**

```tsx
<main className="max-w-7xl mx-auto p-6">
  {ansicht.typ === 'haupt' && <AdminThemensteuerung />}
  {ansicht.typ === 'kind' && (
    <AdminKindDetail
      gruppeId={aktiveGruppe?.id || ''}
      email={ansicht.email}
      name={ansicht.name}
      onThemaKlick={(fach, thema) => setAnsicht({ typ: 'thema', email: ansicht.email, name: ansicht.name, fach, thema })}
    />
  )}
  {ansicht.typ === 'thema' && (
    <AdminThemaDetail
      email={ansicht.email}
      name={ansicht.name}
      fach={ansicht.fach}
      thema={ansicht.thema}
    />
  )}
</main>
```

**Achtung:** `AdminKindDetail` wird von `onKindKlick` aufgerufen — das passiert bisher nur aus `AdminUebersicht`. Mit Entfall von AdminUebersicht muss der Zugang zu `AdminKindDetail` neu überlegt werden. **Option:** `AdminThemensteuerung` zeigt pro Thema nur Themen-Navigation, nicht pro Kind. Kind-Detail war früher nur aus Übersicht → wird über Einstellungen→Mitglieder erreichbar (falls Detail überhaupt gebraucht wird).

**Entscheidung:** `AdminKindDetail` + `AdminThemaDetail` bleiben im Code (nicht gelöscht), aber Entry-Points werden mit Task 5b prüfen. Falls keine Einstiegsmöglichkeit mehr → löschen in Follow-up.

- [ ] **Step 5: Import AdminUebersicht entfernen**

Die `import AdminUebersicht from './AdminUebersicht'`-Zeile löschen.

- [ ] **Step 6: tsc + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```
Expected: grün. Falls Fehler wegen nicht verwendeter Props (onZuUeben, onFachKlick) → Props im Interface lassen aber mit `_` prefix wie bisher.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/ueben/admin/AdminDashboard.tsx
git commit -m "Bundle 13 I-5: AdminDashboard ohne interne Tabs"
```

---

## Task 6: AdminUebersicht löschen

**Files:**
- Delete: `ExamLab/src/components/ueben/admin/AdminUebersicht.tsx`

**Rationale:** Inhalt (Mitglieder-Stats) ist redundant mit Einstellungen→Mitglieder. Datei wird nirgends mehr importiert (nach Task 5).

- [ ] **Step 1: Prüfen dass keine Importe mehr existieren**

```bash
cd ExamLab && grep -rn "AdminUebersicht" src/ --include="*.tsx" --include="*.ts"
```
Expected: Keine Treffer (ausser in der Datei selbst).

- [ ] **Step 2: Datei löschen**

```bash
git rm ExamLab/src/components/ueben/admin/AdminUebersicht.tsx
```

- [ ] **Step 3: tsc + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git commit -m "Bundle 13 I-6: AdminUebersicht gelöscht (Inhalt in Einstellungen)"
```

---

## Task 7: FaecherTab — Fachfreischaltung pro Kurs

**Files:**
- Modify: `ExamLab/src/components/ueben/admin/settings/FaecherTab.tsx`

**Rationale:** Pro Gruppe eine Zeile mit Fach-Chips zum Toggeln. Schreibt in `GruppenEinstellungen.sichtbareFaecher`.

**Vorab — Store prüfen:**
- `useUebenSettingsStore` hat `aktualisiereEinstellungen(gruppeId, patch)` (seit S112, debounced save)
- `useUebenSettingsStore.getState().einstellungen` liefert nur Settings der aktiven Gruppe ODER Map pro Gruppe? → **Beim Bau identifizieren.** Falls nur aktive Gruppe: Der Editor muss alle Gruppen-Settings parallel laden.

- [ ] **Step 1: FaecherTab.tsx lesen und Struktur verstehen**

```bash
cd ExamLab && cat src/components/ueben/admin/settings/FaecherTab.tsx
```

Identifiziere wo neue Sektion "Freigeschaltete Fächer pro Kurs" passt (am Ende der bestehenden Inhalte).

- [ ] **Step 2: Settings-Ladepfad prüfen**

```bash
cd ExamLab && grep -n "einstellungen\|einstellungenMap" src/store/ueben/settingsStore.ts | head -20
```

Bestätige: Sind Einstellungen aller Gruppen im Store (z.B. als Map), oder nur eine aktive? Falls nur eine aktive → `ladeEinstellungenAlleGruppen()` o.ä. implementieren (eigener Step).

- [ ] **Step 3: Fachfreischaltungs-Komponente**

Als Sub-Komponente in `FaecherTab.tsx`:

```tsx
interface FachfreischaltungZeileProps {
  gruppe: { id: string; name: string; fachschaft?: string }
  sichtbareFaecher: string[]  // aktuelle sichtbare Fächer dieser Gruppe
  verfuegbareFaecher: string[]  // aus Fachschaft
  onToggle: (fach: string) => void
}

function FachfreischaltungZeile({ gruppe, sichtbareFaecher, verfuegbareFaecher, onToggle }: FachfreischaltungZeileProps) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[160px]">
        {gruppe.name}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {verfuegbareFaecher.length === 0 ? (
          <span className="text-xs text-slate-400 italic">Keine Fächer in Fachschaft definiert</span>
        ) : verfuegbareFaecher.map(fach => {
          const aktiv = sichtbareFaecher.includes(fach)
          return (
            <button
              key={fach}
              onClick={() => onToggle(fach)}
              className={`filter-btn ${aktiv ? 'filter-btn-active' : ''}`}
              title={aktiv ? `${fach} deaktivieren` : `${fach} aktivieren`}
            >
              {fach} {aktiv ? '✓' : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Sektion in FaecherTab integrieren**

Am Ende des bestehenden FaecherTab-Renders:

```tsx
{/* Freigeschaltete Fächer pro Kurs (Bundle 13 I, 2026-04-15) */}
<div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
    Freigeschaltete Fächer pro Kurs
  </h3>
  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
    Welche Fächer die SuS im jeweiligen Kurs sehen. Leer lassen = alle Fächer der Fachschaft sichtbar.
  </p>
  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
    {gruppen.map(gruppe => {
      const einstellungen = einstellungenProGruppe[gruppe.id] ?? { sichtbareFaecher: [] }
      // Fachschaft-Fächer aus Stammdaten
      const fs = stammdaten.fachschaften.find(f => f.kuerzel === gruppe.fachschaft)
      const verfuegbar = fs?.fachbereichTags?.map(t => t.name) ?? []
      return (
        <FachfreischaltungZeile
          key={gruppe.id}
          gruppe={gruppe}
          sichtbareFaecher={einstellungen.sichtbareFaecher}
          verfuegbareFaecher={verfuegbar}
          onToggle={(fach) => {
            const neu = einstellungen.sichtbareFaecher.includes(fach)
              ? einstellungen.sichtbareFaecher.filter(f => f !== fach)
              : [...einstellungen.sichtbareFaecher, fach]
            aktualisiereEinstellungenFuerGruppe(gruppe.id, { sichtbareFaecher: neu })
          }}
        />
      )
    })}
  </div>
</div>
```

- [ ] **Step 5: Settings-Store anpassen (nur falls Map nicht existiert)**

Falls Schritt 2 ergab: Store hat nur aktive Gruppe → Store erweitern mit `einstellungenProGruppe: Record<string, GruppenEinstellungen>` + `aktualisiereEinstellungenFuerGruppe(gruppeId, patch)`. Andernfalls Step überspringen.

**Wichtig:** Bestehender `aktualisiereEinstellungen` bleibt unverändert für die aktive-Gruppe-UI.

- [ ] **Step 6: tsc + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/ueben/admin/settings/FaecherTab.tsx ExamLab/src/store/ueben/settingsStore.ts
git commit -m "Bundle 13 I-7: Fachfreischaltung pro Kurs in Einstellungen"
```

---

## Task 8: Browser-Test + End-to-End-Verifikation

**Files:** keine Änderung, nur Testing.

**Rationale:** Alle bisherigen Tasks haben UI-Änderungen die im Browser verifiziert werden müssen (Regression-Prevention-Regel).

- [ ] **Step 1: Dev-Server starten**

```bash
cd ExamLab && npm run dev
```

- [ ] **Step 2: Test-Plan durchgehen (Chrome-in-Chrome, Demo-LP)**

**Tab-Leiste-Verhalten:**
- [ ] `/uebung/durchfuehren` → Tab-Leiste: [Durchführen*] [Übungen] [Analyse], keine Kurs-Tabs
- [ ] Klick auf "Übungen" → URL wird `/uebung/kurs/<id>`, Kurs-Tabs erscheinen
- [ ] Klick auf anderen Kurs-Tab → URL wechselt, Inhalt wechselt zu Themensteuerung
- [ ] Klick auf "Analyse" → URL `/uebung/analyse`, Kurs-Tabs verschwinden
- [ ] Browser-Refresh auf `/uebung/kurs/<id>` → Tab-Leiste zeigt Kurs aktiv, Themen sichtbar

**Deep-Link:**
- [ ] URL `/uebung/kurs/unknown-id` → Redirect auf ersten Kurs, Console-Warnung
- [ ] URL `/uebung/kurs/<id>` manuell nach Refresh → richtige Ansicht

**Fachfreischaltung:**
- [ ] Einstellungen → Übungen → Fächer → Sektion "Freigeschaltete Fächer pro Kurs" sichtbar
- [ ] Chip-Toggle speichert (Netzwerk-Tab: speichereEinstellungen-Request)
- [ ] Nach Refresh: Einstellung erhalten

**Dark Mode + Responsive:**
- [ ] Dark Mode Tab-Leiste + Chips sichtbar
- [ ] Viele Kurse (simulieren: Demo-Gruppen doppeln via Store) → flex-wrap funktioniert

- [ ] **Step 3: Alle 246 Tests + Build**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```
Expected: Alles grün.

- [ ] **Step 4: HANDOFF aktualisieren**

`ExamLab/HANDOFF.md` — Session-Eintrag ergänzen mit Cluster-I-Resultaten.

- [ ] **Step 5: Commit HANDOFF**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle 13 I-8: HANDOFF-Update nach Cluster I"
```

---

## Rollout

1. **Feature-Branch:** `feature/bundle13-cluster-i` (bereits erstellt)
2. **Staging-Push:** `git push origin feature/bundle13-cluster-i:preview --force-with-lease`
3. **User-Freigabe** auf Staging
4. **Merge nach main:** `git checkout main && git merge feature/bundle13-cluster-i && git push`
5. **Branch aufräumen:** `git branch -d feature/bundle13-cluster-i`

## Offen am Ende des Plans

- AdminKindDetail / AdminThemaDetail: bei Bedarf in Follow-up prüfen, ob noch erreichbar
- Evtl. Toast-System für "Kurs nicht gefunden" (aktuell console.warn) — separate Session
