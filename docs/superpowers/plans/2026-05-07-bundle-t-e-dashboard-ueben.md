# Bundle T.e — Dashboard-Üben Hook-Extraktion (Implementation Plan)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard.tsx (Üben-Bereich) von 930 Z. auf ~430 Z. (-54%) reduzieren durch 2 Hook-Extraktionen (`useDashboardLoad`, `useThemenKomputationen`) + 2 Komponenten-Splits (`ThemaDetailView`, `themaDetailHelpers`) — byte-identisches Verhalten.

**Architecture:** Strategie B (Pragmatisch) aus Spec. Daten-Loading + 8 Memos in Hooks; Inline-Komponenten in eigenen Sub-Folder `ueben/dashboard/`. Filter-State, UI-State, DeepLink-Effects bleiben im Body. Hook-Result-Destrukturierung (Lehre Bundle T.d) für stabile Identitäten.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Tailwind CSS v4, Vitest, @testing-library/react

**Spec:** `docs/superpowers/specs/2026-05-07-bundle-t-e-dashboard-ueben-design.md`

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Branch:** `feature/bundle-t-e-dashboard-ueben` (bereits angelegt, Commits `cba60d3` + `8b401cb`)

**Build-Check:** `cd ExamLab && npx tsc -b` — Output direkt prüfen, nicht nur Exit-Code (Lehre `feedback_tsc_b_exit_misleading.md`)

**Test:** `cd ExamLab && npx vitest run`

**Baseline (T.d):** 1302 vitest passes, alle Lint-Gates clean.

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `ExamLab/src/hooks/ueben/useDashboardLoad.ts` | Daten-Loading-Hook: 2 useState (alleFragen/laden) + 2 useEffect (Fortschritt+Auftraege parallel zu Fragen+Freischaltungen) |
| `ExamLab/src/hooks/ueben/useThemenKomputationen.ts` | 8 useMemo-Hook: themenMap, verfuegbareFaecher, sichtbareThemenListe, letzteUebungProThema, themenSektionen, themaDetail, gefilterteFragen, empfehlungen + `ThemenInfo`-Type-Export |
| `ExamLab/src/hooks/ueben/useThemenKomputationen.test.ts` | ~21 Vitest-Tests via renderHook, Mocks für 3 Funktions-Refs + authStore |
| `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx` | Inline-Funktion-Extraktion + Konstanten (SCHWIERIGKEIT_LABELS/STERNE/TYP_LABELS) |
| `ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx` | FilterSection, Chip, FortschrittsBalken, MasteryBadges |

### Modified Files

| File | Change |
|------|--------|
| `ExamLab/src/components/ueben/Dashboard.tsx` | 930 → ~430 Z.: 8 useMemo + 2 useEffect + 2 useState + 4 inline-Komponenten + `ThemenInfo`-Interface entfernt; Hook-Calls + 2 Imports hinzugefügt |

### Branch State

Aktueller Branch: `feature/bundle-t-e-dashboard-ueben` mit 2 Commits (Spec + Reviewer-Iteration). Implementation-Phasen committen weiter auf diesen Branch.

---

## Task 0: Branch + Baseline

- [ ] **Step 0.1: Branch verifizieren**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git status -sb
```
Expected: `## feature/bundle-t-e-dashboard-ueben` (kein detached HEAD), keine Uncommitted Changes.

- [ ] **Step 0.2: Baseline vitest run**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -20
```
Expected: 1302 passes (T.d-Baseline), 0 failures.

- [ ] **Step 0.3: Baseline tsc + lint**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5 && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir
```
Expected: Alle Gates clean.

---

## Task 1: `themaDetailHelpers.tsx` extrahieren

Mechanische Extraktion der 4 lokalen UI-Komponenten am Ende von Dashboard.tsx (Z. 855-930). Byte-identisch — kein Test, weil reine UI.

**Files:**
- Create: `ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx`

- [ ] **Step 1.1: Sub-Folder + File anlegen**

Inhalt der neuen Datei (byte-identische Übernahme aus Dashboard.tsx Z. 855-930 mit Imports):

```tsx
// ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx
import type React from 'react'
import type { ThemenFortschritt } from '../../../types/ueben/fortschritt'

export function FilterSection({ titel, emoji, children, onToggleAlle }: {
  titel: string; emoji: string; children: React.ReactNode; onToggleAlle: () => void
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {emoji} {titel}
        </h4>
        <button
          onClick={onToggleAlle}
          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 transition-colors"
        >
          Alle ⇄
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}

export function Chip({ label, count, aktiv, farbe, onClick }: {
  label: string; count?: number; aktiv: boolean; farbe: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors cursor-pointer select-none ${
        !aktiv
          ? 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          : ''
      }`}
      style={aktiv
        ? { backgroundColor: farbe, color: '#fff', borderColor: farbe }
        : undefined
      }
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] font-mono ${aktiv ? 'opacity-80' : 'text-slate-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

export function FortschrittsBalken({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  const gemeistertPct = (fortschritt.gemeistert / fortschritt.gesamt) * 100
  const gefestigtPct = (fortschritt.gefestigt / fortschritt.gesamt) * 100
  const uebenPct = (fortschritt.ueben / fortschritt.gesamt) * 100

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex mt-2">
      {gemeistertPct > 0 && <div className="bg-green-500 h-2" style={{ width: `${gemeistertPct}%` }} />}
      {gefestigtPct > 0 && <div className="bg-blue-400 h-2" style={{ width: `${gefestigtPct}%` }} />}
      {uebenPct > 0 && <div className="bg-yellow-400 h-2" style={{ width: `${uebenPct}%` }} />}
    </div>
  )
}

export function MasteryBadges({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  return (
    <div className="flex items-center gap-1 text-xs">
      {fortschritt.gemeistert > 0 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{fortschritt.gemeistert}</span>}
      {fortschritt.gefestigt > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{fortschritt.gefestigt}</span>}
      {fortschritt.ueben > 0 && <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">{fortschritt.ueben}</span>}
      {fortschritt.neu > 0 && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">{fortschritt.neu}</span>}
    </div>
  )
}
```

- [ ] **Step 1.2: tsc-Gate**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```
Expected: clean (neue Datei kompiliert; Dashboard.tsx hat noch lokale Definitionen, daher Konflikt nicht möglich, weil das neue File noch nicht importiert wird).

- [ ] **Step 1.3: vitest sanity**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -5
```
Expected: 1302 passes (unverändert, neue Datei wird noch nicht importiert).

- [ ] **Step 1.4: Commit**

```bash
git add ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx
git commit -m "$(cat <<'EOF'
Bundle T.e Phase 1: themaDetailHelpers.tsx extrahiert

4 lokale UI-Komponenten (FilterSection, Chip, FortschrittsBalken,
MasteryBadges) in eigenes File im neuen dashboard/-Sub-Folder.
Byte-identisch zu Dashboard.tsx Z. 855-930. Noch nicht importiert.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `ThemaDetailView.tsx` extrahieren

Mechanische Extraktion der inline-Funktion `ThemaDetailView` aus Dashboard.tsx (function-Definition ab Z. 728) inkl. Konstanten + `ThemaDetailProps`-Interface. Helper-Komponenten via Import aus `themaDetailHelpers.tsx` (Task 1).

`ThemenInfo`-Type wird **temporär lokal** in ThemaDetailView.tsx deklariert (Hook-File aus Task 4 existiert noch nicht). In Task 4.8 wird der lokale Type durch Import aus `useThemenKomputationen` ersetzt.

**Files:**
- Create: `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx`

- [ ] **Step 2.1: File anlegen**

```tsx
// ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx
import type { Frage } from '../../../types/ueben/fragen'
import type { ThemenFortschritt } from '../../../types/ueben/fortschritt'
import { berechneSterne, sterneText } from '../../../utils/ueben/gamification'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'
import { FilterSection, Chip, FortschrittsBalken, MasteryBadges } from './themaDetailHelpers'

// TEMPORÄR: wird in Task 4.8 durch Import aus useThemenKomputationen ersetzt
interface ThemenInfo {
  fach: string
  thema: string
  unterthemen: string[]
  fragen: Frage[]
  fortschritt: ThemenFortschritt
}

const SCHWIERIGKEIT_LABELS: Record<number, string> = { 1: 'Einfach', 2: 'Mittel', 3: 'Schwer' }
const SCHWIERIGKEIT_STERNE: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

const TYP_LABELS: Record<string, string> = {
  mc: 'Multiple Choice', multi: 'Multi', tf: 'Richtig/Falsch', fill: 'Lückentext', calc: 'Berechnung',
  sort: 'Zuordnung', sortierung: 'Sortierung', zuordnung: 'Paare',
  open: 'Freitext', formel: 'Formel', pdf: 'PDF-Annotation',
  buchungssatz: 'Buchungssatz', tkonto: 'T-Konto', bilanz: 'Bilanz', kontenbestimmung: 'Kontenbestimmung',
  hotspot: 'Hotspot', bildbeschriftung: 'Bildbeschriftung', dragdrop_bild: 'Drag & Drop',
  gruppe: 'Aufgabengruppe', zeichnen: 'Zeichnen', audio: 'Audio', code: 'Code',
  richtigfalsch: 'Richtig/Falsch', lueckentext: 'Lückentext', berechnung: 'Berechnung',
  freitext: 'Freitext', visualisierung: 'Zeichnen', bilanzstruktur: 'Bilanz',
  aufgabengruppe: 'Aufgabengruppe',
}

interface ThemaDetailProps {
  themaDetail: ThemenInfo
  gefilterteFragen: Frage[]
  unterthemaFilter: Set<string>
  schwierigkeitFilter: Set<number>
  typFilter: Set<string>
  onToggleUnterthema: (v: string) => void
  onToggleSchwierigkeit: (v: number) => void
  onToggleTyp: (v: string) => void
  onToggleAlleUnterthemen: () => void
  onToggleAlleSchwierigkeiten: () => void
  onToggleAlleTypen: () => void
  onZurueck: () => void
  onStarte: () => void
  fachFarben: Record<string, string>
}

export function ThemaDetailView({
  themaDetail, gefilterteFragen,
  unterthemaFilter, schwierigkeitFilter, typFilter,
  onToggleUnterthema, onToggleSchwierigkeit, onToggleTyp,
  onToggleAlleUnterthemen, onToggleAlleSchwierigkeiten, onToggleAlleTypen,
  onZurueck, onStarte, fachFarben,
}: ThemaDetailProps) {
  const farbe = getFachFarbe(themaDetail.fach, fachFarben)
  // Immer alle 3 Schwierigkeitsstufen anzeigen (Pool-Fragen haben diff 1-3)
  const verfuegbareSchwierigkeiten = [1, 2, 3]
  const verfuegbareTypen = [...new Set(themaDetail.fragen.map(f => f.typ))].sort()
  const filterAktiv = unterthemaFilter.size > 0 || schwierigkeitFilter.size > 0 || typFilter.size > 0

  return (
    <div className="space-y-4">
      {/* Header mit Zurück */}
      <div className="flex items-center gap-3">
        <button
          onClick={onZurueck}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          ←
        </button>
        <div>
          <h3 className="text-lg font-bold dark:text-white">{themaDetail.thema}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: farbe }} />
            <span>{themaDetail.fach}</span>
            <span>·</span>
            <span>{themaDetail.fragen.length} Fragen</span>
          </div>
        </div>
      </div>

      {/* Fortschritt */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <FortschrittsBalken fortschritt={themaDetail.fortschritt} />
        <div className="flex justify-between mt-2">
          <MasteryBadges fortschritt={themaDetail.fortschritt} />
          <span className="text-sm">{sterneText(berechneSterne(themaDetail.fortschritt.quote))}</span>
        </div>
      </div>

      {/* Unterthema-Chips */}
      {themaDetail.unterthemen.length > 0 && (
        <FilterSection
          titel="Unterthemen"
          emoji="📚"
          onToggleAlle={onToggleAlleUnterthemen}
        >
          {themaDetail.unterthemen.map(ut => {
            const anzahl = themaDetail.fragen.filter(f => (f as { unterthema?: string }).unterthema === ut).length
            return (
              <Chip
                key={ut}
                label={ut}
                count={anzahl}
                aktiv={unterthemaFilter.has(ut)}
                farbe={farbe}
                onClick={() => onToggleUnterthema(ut)}
              />
            )
          })}
        </FilterSection>
      )}

      {/* Schwierigkeits-Chips */}
      <FilterSection titel="Schwierigkeit" emoji="📊" onToggleAlle={onToggleAlleSchwierigkeiten}>
        {verfuegbareSchwierigkeiten.map(s => {
          const anzahl = themaDetail.fragen.filter(f => (f.schwierigkeit ?? 2) === s).length
          return (
            <Chip
              key={s}
              label={`${SCHWIERIGKEIT_STERNE[s] || '⭐'} ${SCHWIERIGKEIT_LABELS[s] || `Stufe ${s}`}`}
              count={anzahl}
              aktiv={schwierigkeitFilter.has(s)}
              farbe={farbe}
              onClick={() => onToggleSchwierigkeit(s)}
            />
          )
        })}
      </FilterSection>

      {/* Fragetyp-Chips */}
      {verfuegbareTypen.length > 0 && (
        <FilterSection titel="Fragetyp" emoji="✏️" onToggleAlle={onToggleAlleTypen}>
          {verfuegbareTypen.map(t => {
            const anzahl = themaDetail.fragen.filter(f => f.typ === t).length
            return (
              <Chip
                key={t}
                label={TYP_LABELS[t] || t}
                count={anzahl}
                aktiv={typFilter.has(t)}
                farbe={farbe}
                onClick={() => onToggleTyp(t)}
              />
            )
          })}
        </FilterSection>
      )}

      {/* Info-Balken + Start-Button */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {filterAktiv
              ? `${gefilterteFragen.length} von ${themaDetail.fragen.length} Fragen ausgewählt`
              : `${themaDetail.fragen.length} Fragen verfügbar`
            }
          </span>
          <button
            onClick={onStarte}
            disabled={gefilterteFragen.length === 0}
            className="px-6 py-2.5 rounded-xl font-semibold text-white transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: gefilterteFragen.length > 0 ? farbe : undefined }}
          >
            Übung starten
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2.2: tsc-Gate**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```
Expected: clean.

- [ ] **Step 2.3: vitest sanity**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -5
```
Expected: 1302 passes.

- [ ] **Step 2.4: Commit**

```bash
git add ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx
git commit -m "$(cat <<'EOF'
Bundle T.e Phase 2: ThemaDetailView.tsx extrahiert

Inline-Funktion (Dashboard.tsx Z. 709-851) + 3 Konstanten
(SCHWIERIGKEIT_LABELS, SCHWIERIGKEIT_STERNE, TYP_LABELS) in
eigenes File. Byte-identisch. Helper-Komponenten via Import aus
themaDetailHelpers. Lokaler ThemenInfo-Type temporär — wird in
Phase 4 durch Import aus useThemenKomputationen ersetzt.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `useDashboardLoad` Hook + Caller-Wiring

Hook ohne Vitest (Master-Spec §4.2: 4× Store-Async-Orchestration). Direkt nach Hook-Erstellung wird Dashboard.tsx integriert (kleinster atomischer Schritt).

**Files:**
- Create: `ExamLab/src/hooks/ueben/useDashboardLoad.ts`
- Modify: `ExamLab/src/components/ueben/Dashboard.tsx` (2 useState + 2 useEffect entfernen, Hook-Call hinzufügen)

- [ ] **Step 3.1: Hook-File anlegen**

```typescript
// ExamLab/src/hooks/ueben/useDashboardLoad.ts
import { useEffect, useState } from 'react'
import type { Frage } from '../../types/ueben/fragen'
import type { Gruppe } from '../../types/ueben/gruppen'
import { useUebenFortschrittStore } from '../../store/ueben/fortschrittStore'
import { useUebenAuftragStore } from '../../store/ueben/auftragStore'
import { useThemenSichtbarkeitStore } from '../../store/ueben/themenSichtbarkeitStore'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'

export interface DashboardLoadResult {
  alleFragen: Frage[]
  laden: boolean
}

/**
 * Daten-Loading für SuS-Dashboard. Kapselt 2 separate useEffect's:
 * - Effekt A: Fortschritt + Auftraege (parallel)
 * - Effekt B: Fragen + Freischaltungen (parallel)
 *
 * Beide Effekte triggern unabhängig auf aktiveGruppe-Wechsel — die
 * heutige parallele Trigger-Sequenz ist beobachtbares Verhalten und
 * darf NICHT zu einem useEffect mit Promise.all konsolidiert werden
 * (Master-Spec §7, Lehre `feedback_memo_deps_trigger_vs_compute`).
 *
 * Store-Action-Identitäten sind über Zustand stabil — direkte Nutzung
 * in useEffect-Deps ohne Memo-Drift-Risiko.
 */
export function useDashboardLoad(aktiveGruppe: Gruppe | null): DashboardLoadResult {
  const ladeFortschritt = useUebenFortschrittStore(s => s.ladeFortschritt)
  const ladeAuftraege = useUebenAuftragStore(s => s.ladeAuftraege)
  const ladeFreischaltungen = useThemenSichtbarkeitStore(s => s.ladeFreischaltungen)

  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    ladeFortschritt()
    if (aktiveGruppe) ladeAuftraege(aktiveGruppe.id)
  }, [ladeFortschritt, ladeAuftraege, aktiveGruppe])

  useEffect(() => {
    if (!aktiveGruppe) return
    const ladeThemen = async () => {
      setLaden(true)
      const fragen = await uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
      setAlleFragen(fragen)
      setLaden(false)
    }
    ladeThemen()
    ladeFreischaltungen(aktiveGruppe.id)
  }, [aktiveGruppe, ladeFreischaltungen])

  return { alleFragen, laden }
}
```

- [ ] **Step 3.2: tsc-Gate**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```
Expected: clean (Hook-File kompiliert isoliert).

- [ ] **Step 3.3: Dashboard.tsx — Hook integrieren**

In `ExamLab/src/components/ueben/Dashboard.tsx`:

**(a) Store-Destructuring reduzieren (Z. 63-67)** — `ladeFortschritt`, `ladeAuftraege`, `ladeFreischaltungen` aus Destructuring entfernen, weil sie jetzt im Hook gerufen werden. NICHT entfernen: `getThemenFortschritt`, `fortschritte`, `lernziele`, `auftraege`, `freischaltungen`, `getStatus`, `getAktiveUnterthemen` (in `useThemenKomputationen` benötigt).

Heute Z. 63-67:
```typescript
const { ladeFortschritt, getThemenFortschritt, fortschritte, lernziele } = useUebenFortschrittStore()
const { ladeAuftraege, auftraege } = useUebenAuftragStore()
const { openUebung } = useSuSNavigation()
const { sichtbareFaecher, fachFarben } = useUebenKontext()
const { freischaltungen, ladeFreischaltungen, getStatus, getAktiveUnterthemen } = useThemenSichtbarkeitStore()
```

Neu:
```typescript
const { getThemenFortschritt, fortschritte, lernziele } = useUebenFortschrittStore()
const { auftraege } = useUebenAuftragStore()
const { openUebung } = useSuSNavigation()
const { sichtbareFaecher, fachFarben } = useUebenKontext()
const { freischaltungen, getStatus, getAktiveUnterthemen } = useThemenSichtbarkeitStore()
```

**(b) Hook importieren (oben)**:

```typescript
import { useDashboardLoad } from '../../hooks/ueben/useDashboardLoad'
```

**(c) State + 2 useEffect ersetzen (Z. 69-70 + 131-146)**:

Entfernen:
```typescript
const [alleFragen, setAlleFragen] = useState<Frage[]>([])
const [laden, setLaden] = useState(true)
// ... Z. 131-146:
useEffect(() => {
  ladeFortschritt()
  if (aktiveGruppe) ladeAuftraege(aktiveGruppe.id)
}, [ladeFortschritt, ladeAuftraege, aktiveGruppe])

useEffect(() => {
  if (!aktiveGruppe) return
  const ladeThemen = async () => { /* ... */ }
  ladeThemen()
  ladeFreischaltungen(aktiveGruppe.id)
}, [aktiveGruppe, ladeFreischaltungen])
```

Ersetzen mit:
```typescript
const { alleFragen, laden } = useDashboardLoad(aktiveGruppe)
```

(Position: nach den Store-Destructurings, vor dem `eingeklappteFaecher`-useState.)

- [ ] **Step 3.4: tsc-Gate**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```
Expected: clean. Falls Errors zu `setAlleFragen`/`setLaden` — alle Caller (es gibt keine ausser den entfernten useEffects) prüfen.

- [ ] **Step 3.5: vitest sanity**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -5
```
Expected: 1302 passes (kein neuer Test, kein Bruch).

- [ ] **Step 3.6: Commit**

```bash
git add ExamLab/src/hooks/ueben/useDashboardLoad.ts ExamLab/src/components/ueben/Dashboard.tsx
git commit -m "$(cat <<'EOF'
Bundle T.e Phase 3: useDashboardLoad Hook + Dashboard-Wiring

Hook kapselt 2 useState (alleFragen/laden) + 2 unabhängige
useEffect's (Fortschritt+Auftraege; Fragen+Freischaltungen) byte-
identisch. Dashboard.tsx: 2 useState + 2 useEffect + 3 Store-
Action-Destructurings entfernt; ein Hook-Call ersetzt die 18
Source-Zeilen.

Kein Test (Master-Spec §4.2: Async-Store-Orchestration).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `useThemenKomputationen` Hook + Tests (TDD)

Test-first wegen Master-Spec §4.2 (pure Komputation → Vitest-Pflicht). Tests werden vor Hook geschrieben, weil sie die heutige Memo-Logik exerzieren — der Hook ist dann die Extraktion, die die Tests passen lassen muss.

**Files:**
- Create: `ExamLab/src/hooks/ueben/useThemenKomputationen.ts`
- Create: `ExamLab/src/hooks/ueben/useThemenKomputationen.test.ts`
- Modify: `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx` (lokalen ThemenInfo-Type durch Import ersetzen)
- Modify: `ExamLab/src/components/ueben/Dashboard.tsx` (8 useMemo + ThemenInfo-Interface entfernen, Hook-Call hinzufügen)

### 4.A — Hook-Skeleton + Type-Export

- [ ] **Step 4.1: Hook-File-Skeleton anlegen** (nur Types + leere Implementation)

```typescript
// ExamLab/src/hooks/ueben/useThemenKomputationen.ts
import { useMemo } from 'react'
import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt, ThemenFortschritt } from '../../types/ueben/fortschritt'
import type { Auftrag, Empfehlung } from '../../types/ueben/auftrag'
import type { ThemenFreischaltung, ThemenStatus } from '../../types/ueben/themenSichtbarkeit'
import type { GruppenEinstellungen } from '../../types/ueben/settings'
import type { UebenAuthUser } from '../../types/ueben/auth'
import { useAuthStore } from '../../store/authStore'
import { berechneEmpfehlungen } from '../../utils/ueben/empfehlungen'
import { poolTitel } from '../../utils/poolTitelMapping'

export interface ThemenInfo {
  fach: string
  thema: string
  unterthemen: string[]
  fragen: Frage[]
  fortschritt: ThemenFortschritt
}

export interface ThemenKomputationenInputs {
  // Stamm-Daten
  alleFragen: Frage[]
  fortschritte: Record<string, FragenFortschritt>
  auftraege: Auftrag[]
  user: UebenAuthUser | null
  freischaltungen: ThemenFreischaltung[]
  einstellungen: GruppenEinstellungen | null
  sichtbareFaecher: string[]

  // UI-State
  aktiverFach: string | null
  aktivesThema: string | null
  alleThemenAnzeigen: boolean
  suchtext: string
  unterthemaFilter: Set<string>
  schwierigkeitFilter: Set<number>
  typFilter: Set<string>
  sortierung: 'alphabetisch' | 'zuletztGeuebt'

  // Store-Selektoren (Funktions-Refs, stabil über Zustand)
  getThemenFortschritt: (fragen: Frage[]) => ThemenFortschritt
  getStatus: (fach: string, thema: string) => ThemenStatus
  getAktiveUnterthemen: (fach: string, thema: string) => string[] | null
}

export interface ThemenKomputationenResult {
  themenMap: Record<string, ThemenInfo[]>
  verfuegbareFaecher: string[]
  sichtbareThemenListe: ThemenInfo[]
  letzteUebungProThema: Map<string, string>
  themenSektionen: {
    aktuelle: ThemenInfo[]
    faecherSortiert: [string, ThemenInfo[]][]
    weitere: ThemenInfo[]
  }
  themaDetail: ThemenInfo | null
  gefilterteFragen: Frage[]
  empfehlungen: Empfehlung[]
}

export function useThemenKomputationen(inputs: ThemenKomputationenInputs): ThemenKomputationenResult {
  // Implementation in Step 4.3 (alle 8 useMemo's byte-identisch aus Dashboard.tsx)
  throw new Error('not implemented')
}
```

- [ ] **Step 4.2: tsc-Gate für Skeleton**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```
Expected: clean.

### 4.B — Tests schreiben (failing first)

- [ ] **Step 4.3: Test-File anlegen**

```typescript
// ExamLab/src/hooks/ueben/useThemenKomputationen.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useThemenKomputationen, type ThemenKomputationenInputs } from './useThemenKomputationen'
import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt, ThemenFortschritt } from '../../types/ueben/fortschritt'
import type { Auftrag, Empfehlung } from '../../types/ueben/auftrag'

// Module-level mocks
vi.mock('../../store/authStore', () => ({
  useAuthStore: { getState: vi.fn(() => ({ istDemoModus: false })) },
}))

vi.mock('../../utils/ueben/empfehlungen', () => ({
  berechneEmpfehlungen: vi.fn(() => [] as Empfehlung[]),
}))

vi.mock('../../utils/poolTitelMapping', () => ({
  poolTitel: vi.fn(() => null),
}))

import { useAuthStore } from '../../store/authStore'
import { berechneEmpfehlungen } from '../../utils/ueben/empfehlungen'
import { poolTitel } from '../../utils/poolTitelMapping'

// Helpers
const leererFortschritt: ThemenFortschritt = { gesamt: 0, gemeistert: 0, gefestigt: 0, ueben: 0, neu: 0, quote: 0 }

const fragenFortschritt = (override: Partial<FragenFortschritt> = {}): FragenFortschritt => ({
  fragenId: 'f1',
  versuche: 0,
  korrekteVersuche: 0,
  letzterVersuch: null,
  mastery: 'neu',
  ...override,
})

const mockFrage = (override: Partial<Frage> = {}): Frage => ({
  id: 'f1',
  fach: 'Mathe',
  thema: 'Algebra',
  typ: 'mc',
  schwierigkeit: 2,
  fragetext: 'Test-Frage',
  ...override,
} as Frage)

const baseInputs = (override: Partial<ThemenKomputationenInputs> = {}): ThemenKomputationenInputs => ({
  alleFragen: [],
  fortschritte: {},
  auftraege: [],
  user: null,
  freischaltungen: [],
  einstellungen: null,
  lernziele: [],
  sichtbareFaecher: [],
  aktiverFach: null,
  aktivesThema: null,
  alleThemenAnzeigen: false,
  suchtext: '',
  unterthemaFilter: new Set(),
  schwierigkeitFilter: new Set(),
  typFilter: new Set(),
  sortierung: 'alphabetisch',
  getThemenFortschritt: vi.fn(() => leererFortschritt),
  getStatus: vi.fn(() => 'aktiv' as const),
  getAktiveUnterthemen: vi.fn(() => null),
  ...override,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuthStore.getState).mockReturnValue({ istDemoModus: false } as ReturnType<typeof useAuthStore.getState>)
  vi.mocked(poolTitel).mockReturnValue(null)
  vi.mocked(berechneEmpfehlungen).mockReturnValue([])
})

describe('useThemenKomputationen — themenMap', () => {
  it('non-Demo blendet Einrichtungstest-Fragen aus', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Einrichtungstest' }),
      mockFrage({ id: 'f2', fach: 'Mathe', thema: 'Algebra' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap).toEqual({ Mathe: expect.arrayContaining([
      expect.objectContaining({ thema: 'Algebra' }),
    ]) })
    expect(result.current.themenMap.Mathe).toHaveLength(1)
  })

  it('Demo-Modus zeigt Einrichtungstest-Fragen', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({ istDemoModus: true } as ReturnType<typeof useAuthStore.getState>)
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Einrichtungstest' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap.Mathe).toEqual(expect.arrayContaining([
      expect.objectContaining({ thema: 'Einrichtungstest' }),
    ]))
  })

  it('Pool-Mapping ersetzt thema durch poolTitel', () => {
    vi.mocked(poolTitel).mockReturnValue('Marketing-Mix-Pool')
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Wirtschaft', thema: 'OriginalThema', poolId: 'pool-x:variant' } as Frage & { poolId: string }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap.Wirtschaft).toEqual(expect.arrayContaining([
      expect.objectContaining({ thema: 'Marketing-Mix-Pool' }),
    ]))
  })

  it('sichtbareFaecher-Filter blendet andere Fächer aus', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f2', fach: 'Geographie', thema: 'Klima' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      sichtbareFaecher: ['Mathe'],
    })))
    expect(Object.keys(result.current.themenMap)).toEqual(['Mathe'])
  })

  it('mehrere Fächer/Themen werden korrekt gruppiert', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f2', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f3', fach: 'Mathe', thema: 'Geometrie' }),
      mockFrage({ id: 'f4', fach: 'Wirtschaft', thema: 'BWL' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap.Mathe).toHaveLength(2) // Algebra + Geometrie
    expect(result.current.themenMap.Wirtschaft).toHaveLength(1)
  })
})

describe('useThemenKomputationen — verfuegbareFaecher', () => {
  it('sortiert alphabetisch', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Wirtschaft', thema: 'BWL' }),
      mockFrage({ id: 'f2', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f3', fach: 'Deutsch', thema: 'Grammatik' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.verfuegbareFaecher).toEqual(['Deutsch', 'Mathe', 'Wirtschaft'])
  })
})

describe('useThemenKomputationen — sichtbareThemenListe', () => {
  it('freischaltungen-leer-Fallback zeigt alle Themen', () => {
    const fragen: Frage[] = [mockFrage({ fach: 'M', thema: 'A' })]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [],
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(1)
  })

  it('status-Filter zeigt nur aktiv + abgeschlossen wenn Freischaltungen existieren', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
    ]
    const getStatus = vi.fn((fach: string, thema: string) =>
      thema === 'A' ? ('aktiv' as const) : ('nicht_freigeschaltet' as const)
    )
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [{ gruppeId: 'g', fach: 'M', thema: 'A', status: 'aktiv' }] as ThemenKomputationenInputs['freischaltungen'],
      getStatus,
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(1)
    expect(result.current.sichtbareThemenListe[0].thema).toBe('A')
  })

  it('alleThemenAnzeigen true zeigt auch nicht-freigeschaltete', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
    ]
    const getStatus = vi.fn(() => 'nicht_freigeschaltet' as const)
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [{ gruppeId: 'g', fach: 'M', thema: 'A', status: 'aktiv' }] as ThemenKomputationenInputs['freischaltungen'],
      alleThemenAnzeigen: true,
      getStatus,
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(2)
  })

  it('suchtext matcht Thema-Name', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'Algebra' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'Geometrie' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      suchtext: 'algebra',
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(1)
    expect(result.current.sichtbareThemenListe[0].thema).toBe('Algebra')
  })
})

describe('useThemenKomputationen — letzteUebungProThema', () => {
  it('leerer fortschritte → leere Map', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs()))
    expect(result.current.letzteUebungProThema.size).toBe(0)
  })

  it('neuester Versuch pro Thema gewinnt', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'A' }),
    ]
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: fragenFortschritt({ fragenId: 'f1', letzterVersuch: '2026-05-01T10:00:00Z' }),
      f2: fragenFortschritt({ fragenId: 'f2', letzterVersuch: '2026-05-05T10:00:00Z' }),
    }
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      fortschritte,
    })))
    expect(result.current.letzteUebungProThema.get('M|A')).toBe('2026-05-05T10:00:00Z')
  })

  it('mehrere Themen werden separat gespeichert', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
    ]
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: fragenFortschritt({ fragenId: 'f1', letzterVersuch: '2026-05-01T10:00:00Z' }),
      f2: fragenFortschritt({ fragenId: 'f2', letzterVersuch: '2026-05-05T10:00:00Z' }),
    }
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      fortschritte,
    })))
    expect(result.current.letzteUebungProThema.size).toBe(2)
  })
})

describe('useThemenKomputationen — themenSektionen', () => {
  it('teilt in aktuelle/faecherSortiert/weitere auf', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
      mockFrage({ id: 'f3', fach: 'M', thema: 'C' }),
    ]
    const getStatus = vi.fn((fach: string, thema: string) => {
      if (thema === 'A') return 'aktiv' as const
      if (thema === 'B') return 'abgeschlossen' as const
      return 'nicht_freigeschaltet' as const
    })
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [{ gruppeId: 'g', fach: 'M', thema: 'A', status: 'aktiv' }] as ThemenKomputationenInputs['freischaltungen'],
      alleThemenAnzeigen: true, // damit weitere durchkommen
      getStatus,
    })))
    expect(result.current.themenSektionen.aktuelle).toHaveLength(1)
    expect(result.current.themenSektionen.aktuelle[0].thema).toBe('A')
    expect(result.current.themenSektionen.faecherSortiert).toHaveLength(1)
    expect(result.current.themenSektionen.weitere).toHaveLength(1)
  })

  it('sortierung "zuletztGeuebt" sortiert nach letzteUebungProThema absteigend', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'Alt' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'Neu' }),
    ]
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: fragenFortschritt({ fragenId: 'f1', letzterVersuch: '2026-05-01T10:00:00Z' }),
      f2: fragenFortschritt({ fragenId: 'f2', letzterVersuch: '2026-05-05T10:00:00Z' }),
    }
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      fortschritte,
      sortierung: 'zuletztGeuebt',
      getStatus: vi.fn(() => 'aktiv' as const),
    })))
    expect(result.current.themenSektionen.aktuelle[0].thema).toBe('Neu')
    expect(result.current.themenSektionen.aktuelle[1].thema).toBe('Alt')
  })
})

describe('useThemenKomputationen — themaDetail', () => {
  it('aktivesThema null → null', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs()))
    expect(result.current.themaDetail).toBeNull()
  })

  it('findet Thema in sichtbareThemenListe', () => {
    const fragen: Frage[] = [mockFrage({ fach: 'M', thema: 'Algebra' })]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      aktivesThema: 'Algebra',
    })))
    expect(result.current.themaDetail?.thema).toBe('Algebra')
  })

  it('nicht gefundenes Thema → null', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      aktivesThema: 'Existiert-nicht',
    })))
    expect(result.current.themaDetail).toBeNull()
  })
})

describe('useThemenKomputationen — gefilterteFragen', () => {
  it('themaDetail null → leer', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs()))
    expect(result.current.gefilterteFragen).toEqual([])
  })

  it('alle 3 Filter aktiv reduzieren Liste', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A', schwierigkeit: 1, typ: 'mc' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'A', schwierigkeit: 2, typ: 'mc' }),
      mockFrage({ id: 'f3', fach: 'M', thema: 'A', schwierigkeit: 1, typ: 'freitext' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      aktivesThema: 'A',
      schwierigkeitFilter: new Set([1]),
      typFilter: new Set(['mc']),
    })))
    expect(result.current.gefilterteFragen).toHaveLength(1)
    expect(result.current.gefilterteFragen[0].id).toBe('f1')
  })
})

describe('useThemenKomputationen — empfehlungen', () => {
  it('user null → leer', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: [mockFrage()],
      user: null,
    })))
    expect(result.current.empfehlungen).toEqual([])
  })

  it('alleFragen leer → leer', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      user: { email: 'test@x', vorname: 'Test', nachname: 'User', rolle: 'sus' } as ThemenKomputationenInputs['user'],
    })))
    expect(result.current.empfehlungen).toEqual([])
  })
})
```

- [ ] **Step 4.4: Tests laufen — sollen FAILEN**

```bash
cd ExamLab && npx vitest run src/hooks/ueben/useThemenKomputationen.test.ts 2>&1 | tail -20
```
Expected: alle ~21 Tests FAIL mit "not implemented"-Error (weil Hook-Body nur `throw` ist).

### 4.C — Hook-Implementation byte-identisch aus Dashboard.tsx

- [ ] **Step 4.5: Hook-Body implementieren**

In `useThemenKomputationen.ts` den Skeleton-Body (Z. mit `throw new Error('not implemented')`) ersetzen durch byte-identische Übernahme der 8 useMemo's aus Dashboard.tsx Z. 166-353. Einzige Änderungen:

1. Inputs werden über das Inputs-Objekt destrukturiert (statt aus Closure-Scope).
2. `useAuthStore.getState().istDemoModus` bleibt non-reactive (kein subscribe).
3. Alle Deps der useMemo bleiben byte-identisch zu heute.
4. Result-Objekt am Ende.

Vollständiger Hook-Body:

```typescript
export function useThemenKomputationen(inputs: ThemenKomputationenInputs): ThemenKomputationenResult {
  const {
    alleFragen,
    fortschritte,
    auftraege,
    user,
    freischaltungen,
    einstellungen,
    sichtbareFaecher,
    aktiverFach,
    aktivesThema,
    alleThemenAnzeigen,
    suchtext,
    unterthemaFilter,
    schwierigkeitFilter,
    typFilter,
    sortierung,
    getThemenFortschritt,
    getStatus,
    getAktiveUnterthemen,
  } = inputs

  // Themen-Infos: Fach → Thema → { unterthemen, fragen, fortschritt }
  const themenMap = useMemo(() => {
    const map: Record<string, ThemenInfo[]> = {}
    const fachThema: Record<string, Record<string, Frage[]>> = {}

    for (const f of alleFragen) {
      const themaRaw = f.thema || 'Allgemein'
      const poolId = (f as { poolId?: string }).poolId || ''
      const hatUnterthema = !!(f as { unterthema?: string }).unterthema
      const tags = (f.tags || []) as (string | { name: string })[]

      // Einrichtungsfragen komplett ausblenden — ausser im Demo-Modus
      const istDemo = useAuthStore.getState().istDemoModus
      if (!istDemo) {
        if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung' || (typeof t === 'string' ? t : t.name) === 'einführung')) continue
        if (themaRaw === 'Einrichtung' || themaRaw === 'Einrichtungstest') continue
      }

      const fach = f.fach || 'Andere'

      let thema = themaRaw
      // Pool-Fragen: Pool-Titel aus fester Mapping-Tabelle
      if (!hatUnterthema && poolId) {
        const poolMetaId = poolId.split(':')[0]
        const titel = poolTitel(poolMetaId)
        if (titel) {
          thema = titel
          ;(f as { unterthema?: string }).unterthema = themaRaw
        }
      }

      if (sichtbareFaecher.length > 0 && !sichtbareFaecher.includes(fach)) continue
      if (!fachThema[fach]) fachThema[fach] = {}
      if (!fachThema[fach][thema]) fachThema[fach][thema] = []
      fachThema[fach][thema].push(f)
    }

    for (const [fach, themen] of Object.entries(fachThema)) {
      map[fach] = Object.entries(themen).map(([thema, fragen]) => {
        const unterthemen = [...new Set(
          fragen.map(f => (f as { unterthema?: string }).unterthema).filter(Boolean)
        )].sort() as string[]
        return { fach, thema, unterthemen, fragen, fortschritt: getThemenFortschritt(fragen) }
      }).sort((a, b) => a.thema.localeCompare(b.thema))
    }
    return map
  }, [alleFragen, getThemenFortschritt, sichtbareFaecher])

  const verfuegbareFaecher = useMemo(() => Object.keys(themenMap).sort(), [themenMap])

  // Sichtbare Themen
  const sichtbareThemenListe = useMemo(() => {
    const alleFachThemen = aktiverFach ? (themenMap[aktiverFach] || []) : Object.values(themenMap).flat()
    if (freischaltungen.length === 0) return alleFachThemen
    if (alleThemenAnzeigen) return alleFachThemen

    let gefiltert = alleFachThemen
      .filter(info => {
        const status = getStatus(info.fach, info.thema)
        return status === 'aktiv' || status === 'abgeschlossen'
      })
      .map(info => {
        const aktiveUT = getAktiveUnterthemen(info.fach, info.thema)
        if (!aktiveUT || aktiveUT.length === 0) return info
        const gefilterteFragenLocal = info.fragen.filter(f => {
          const ut = (f as { unterthema?: string }).unterthema
          return !ut || aktiveUT.includes(ut)
        })
        if (gefilterteFragenLocal.length === 0) return null
        const gefilterteUnterthemenLocal = info.unterthemen.filter(ut => aktiveUT.includes(ut))
        return { ...info, fragen: gefilterteFragenLocal, unterthemen: gefilterteUnterthemenLocal, fortschritt: getThemenFortschritt(gefilterteFragenLocal) }
      })
      .filter((info): info is ThemenInfo => info !== null)

    if (suchtext.trim()) {
      const lower = suchtext.toLowerCase().trim()
      gefiltert = (alleThemenAnzeigen ? alleFachThemen : gefiltert).filter(info =>
        info.thema.toLowerCase().includes(lower) ||
        info.fach.toLowerCase().includes(lower) ||
        info.unterthemen.some(ut => ut.toLowerCase().includes(lower)) ||
        info.fragen.some(f => ('fragetext' in f && typeof f.fragetext === 'string') ? f.fragetext.toLowerCase().includes(lower) : false)
      )
    }

    return gefiltert
  }, [themenMap, aktiverFach, freischaltungen, alleThemenAnzeigen, getStatus, suchtext, getAktiveUnterthemen, getThemenFortschritt])

  // Letzte Übung pro Thema
  const letzteUebungProThema = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of Object.values(fortschritte)) {
      if (!f.letzterVersuch) continue
      for (const thema of sichtbareThemenListe) {
        const gehoertZuThema = thema.fragen.some(frage => frage.id === f.fragenId)
        if (gehoertZuThema) {
          const key = `${thema.fach}|${thema.thema}`
          const bisheriger = map.get(key)
          if (!bisheriger || f.letzterVersuch > bisheriger) {
            map.set(key, f.letzterVersuch)
          }
        }
      }
    }
    return map
  }, [sichtbareThemenListe, fortschritte])

  // Themen-Sektionen
  const themenSektionen = useMemo(() => {
    const aktuelle: ThemenInfo[] = []
    const freigegebeneNachFach = new Map<string, ThemenInfo[]>()
    const weitere: ThemenInfo[] = []

    for (const t of sichtbareThemenListe) {
      const status = freischaltungen.length > 0 ? getStatus(t.fach, t.thema) : 'abgeschlossen'
      if (status === 'aktiv') {
        aktuelle.push(t)
      } else if (status === 'abgeschlossen') {
        const liste = freigegebeneNachFach.get(t.fach) ?? []
        liste.push(t)
        freigegebeneNachFach.set(t.fach, liste)
      } else if (status === 'nicht_freigeschaltet') {
        weitere.push(t)
      }
    }

    const sortiereFn = (a: ThemenInfo, b: ThemenInfo) => {
      if (sortierung === 'zuletztGeuebt') {
        const tA = letzteUebungProThema.get(`${a.fach}|${a.thema}`) ?? ''
        const tB = letzteUebungProThema.get(`${b.fach}|${b.thema}`) ?? ''
        if (tA !== tB) return tB.localeCompare(tA)
      }
      return a.thema.localeCompare(b.thema)
    }

    aktuelle.sort(sortiereFn)
    for (const [, themen] of freigegebeneNachFach) {
      themen.sort(sortiereFn)
    }
    weitere.sort(sortiereFn)

    const faecherSortiert = [...freigegebeneNachFach.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    return { aktuelle, faecherSortiert, weitere }
  }, [sichtbareThemenListe, freischaltungen, sortierung, letzteUebungProThema, getStatus])

  // Aktives Thema-Detail
  const themaDetail = useMemo(() => {
    if (!aktivesThema) return null
    return sichtbareThemenListe.find(t => t.thema === aktivesThema) || null
  }, [sichtbareThemenListe, aktivesThema])

  // Gefilterte Fragen im aktiven Thema
  const gefilterteFragen = useMemo(() => {
    if (!themaDetail) return []
    return themaDetail.fragen.filter(f => {
      if (unterthemaFilter.size > 0 && !unterthemaFilter.has((f as { unterthema?: string }).unterthema || '')) return false
      if (schwierigkeitFilter.size > 0 && !schwierigkeitFilter.has(f.schwierigkeit ?? 2)) return false
      if (typFilter.size > 0 && !typFilter.has(f.typ)) return false
      return true
    })
  }, [themaDetail, unterthemaFilter, schwierigkeitFilter, typFilter])

  // Empfehlungen
  const empfehlungen = useMemo(() => {
    if (!user || alleFragen.length === 0) return []
    return berechneEmpfehlungen(
      alleFragen, fortschritte, auftraege, user.email,
      freischaltungen, einstellungen || undefined,
    )
  }, [alleFragen, fortschritte, auftraege, user, freischaltungen, einstellungen])

  return {
    themenMap,
    verfuegbareFaecher,
    sichtbareThemenListe,
    letzteUebungProThema,
    themenSektionen,
    themaDetail,
    gefilterteFragen,
    empfehlungen,
  }
}
```

> **Hinweis Deps-Drift:** Im neuen Hook werden `getAktiveUnterthemen` und `getThemenFortschritt` als zusätzliche Deps in `sichtbareThemenListe` aufgenommen, weil sie im Hook-Body via `inputs.*` referenziert werden — heute waren sie über Closure stabil. Da die Store-Selektoren stabil sind (Zustand-Convention), erzeugt das keinen zusätzlichen Re-Compute.

- [ ] **Step 4.6: Tests laufen — alle PASSEN**

```bash
cd ExamLab && npx vitest run src/hooks/ueben/useThemenKomputationen.test.ts 2>&1 | tail -10
```
Expected: ~21 passes.

- [ ] **Step 4.7: Vollständiger vitest-Run**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -5
```
Expected: 1302 + ~21 = ~1323 passes.

### 4.D — Caller-Wiring in Dashboard.tsx + ThemaDetailView

- [ ] **Step 4.8: ThemaDetailView lokalen Type ersetzen**

In `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx`:

Entfernen (Z. 1-15 ungefähr):
```typescript
import type { ThemenFortschritt } from '../../../types/ueben/fortschritt'
// TEMPORÄR (...) Block
interface ThemenInfo { /* ... */ }
```

Ersetzen durch:
```typescript
import type { ThemenInfo } from '../../../hooks/ueben/useThemenKomputationen'
```

(Falls `ThemenFortschritt` noch anderswo gebraucht wird im File: prüfen — wahrscheinlich nicht, weil `themaDetail.fortschritt` schon den Type über `ThemenInfo` mitbringt.)

- [ ] **Step 4.9: Dashboard.tsx — Hook integrieren**

In `ExamLab/src/components/ueben/Dashboard.tsx`:

**(a) Import hinzufügen (oben):**
```typescript
import { useThemenKomputationen } from '../../hooks/ueben/useThemenKomputationen'
import { ThemaDetailView } from './dashboard/ThemaDetailView'
```

**(b) `interface ThemenInfo` löschen** (Z. 47-53 — wird jetzt aus Hook re-exportiert).

**(c) 8 useMemo-Blöcke entfernen** (Z. 166-353):
- `themenMap`-useMemo
- `verfuegbareFaecher`-useMemo
- `sichtbareThemenListe`-useMemo
- `letzteUebungProThema`-useMemo
- `themenSektionen`-useMemo
- `themaDetail`-useMemo
- `gefilterteFragen`-useMemo
- `empfehlungen`-useMemo

**(d) Hook-Aufruf einfügen** (an der Position, wo der erste useMemo war):

```typescript
const {
  themenMap,
  verfuegbareFaecher,
  sichtbareThemenListe,
  letzteUebungProThema,
  themenSektionen,
  themaDetail,
  gefilterteFragen,
  empfehlungen,
} = useThemenKomputationen({
  alleFragen,
  fortschritte,
  auftraege,
  user,
  freischaltungen,
  einstellungen,
  sichtbareFaecher,
  aktiverFach,
  aktivesThema,
  alleThemenAnzeigen,
  suchtext,
  unterthemaFilter,
  schwierigkeitFilter,
  typFilter,
  sortierung,
  getThemenFortschritt,
  getStatus,
  getAktiveUnterthemen,
})
```

> **Hinweis zu `letzteUebungProThema`:** Der Hook exportiert es (für Test-Coverage), der Caller destrukturiert es bewusst NICHT (kein Verbrauch im Body). Tests greifen via `result.current.letzteUebungProThema` direkt zu — kein `void`-Workaround nötig.

**(e) ThemaDetailView-Aufruf prüfen** (Z. 493-516): die existierende inline-Aufruf-JSX bleibt; nur Import-Pfad ist neu (Schritt (a)).

**(f) Inline-Funktion `ThemaDetailView` löschen** (Z. 709-851).

**(g) Inline-Funktionen löschen** (Z. 855-930): `FilterSection`, `Chip`, `FortschrittsBalken`, `MasteryBadges`.

**(h) Konstanten löschen** (Z. 32-45): `SCHWIERIGKEIT_LABELS`, `SCHWIERIGKEIT_STERNE`, `TYP_LABELS` (nur in ThemaDetailView.tsx benötigt).

**(i) Ungenutzte Imports prüfen** — nach den Löschungen werden einige Top-Imports unused:
- `useMemo` (alle 8 Memos sind weg) — entfernen
- `useEffect` (nur 3 von 5 useEffect's bleiben, also bleiben) — behalten
- `useState` (12 von 14 useState bleiben) — behalten
- `useUebenSettingsStore` (nur in `empfehlungen`-Memo benutzt, jetzt im Hook) — bleibt im Body, weil `einstellungen` als Hook-Input gebraucht wird → weiter destrukturieren
- `useUebenAuthStore` — `user` bleibt im Body benutzt → behalten
- `poolTitel` (nur in `themenMap`-Memo benutzt, jetzt im Hook) — entfernen
- `berechneEmpfehlungen` (nur in `empfehlungen`-Memo benutzt) — entfernen
- `useAuthStore` (nur in `themenMap`-Memo benutzt) — entfernen
- `Empfehlung`-Type (jetzt aus Hook-Result implizit) — entfernen falls nirgendwo sonst benutzt

- [ ] **Step 4.10: tsc-Gate**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```
Expected: clean. Falls Errors: ungenutzte Imports prüfen, Hook-Call-Inputs vollständig?

- [ ] **Step 4.11: lint:as-any**

```bash
cd ExamLab && npm run lint:as-any 2>&1 | tail -5
```
Expected: clean (Total 0/Defensive 0/Undokumentiert 0).

- [ ] **Step 4.12: Vollständiger vitest**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -5
```
Expected: ~1323 passes.

- [ ] **Step 4.13: Build-Gate**

```bash
cd ExamLab && npm run build 2>&1 | tail -10
```
Expected: vite build erfolgreich (~3s), PWA generateSW OK, keine Errors.

- [ ] **Step 4.14: Dashboard.tsx Zeilenzahl prüfen**

```bash
wc -l ExamLab/src/components/ueben/Dashboard.tsx
```
Expected: ~430 Z. (±20 Z.). Falls deutlich abweichend: Source-Zeilen prüfen, ob alle Inline-Komponenten + Konstanten gelöscht sind.

- [ ] **Step 4.15: Commit**

```bash
git add ExamLab/src/hooks/ueben/useThemenKomputationen.ts ExamLab/src/hooks/ueben/useThemenKomputationen.test.ts ExamLab/src/components/ueben/Dashboard.tsx ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx
git commit -m "$(cat <<'EOF'
Bundle T.e Phase 4: useThemenKomputationen Hook + Tests + Caller-Wiring

Hook kapselt 8 useMemo's byte-identisch (themenMap, verfuegbareFaecher,
sichtbareThemenListe, letzteUebungProThema, themenSektionen, themaDetail,
gefilterteFragen, empfehlungen). 21 Vitest-Tests via renderHook + Mocks
für 3 Funktions-Refs + authStore + berechneEmpfehlungen + poolTitel.

Dashboard.tsx: 8 useMemo + ThemenInfo-Interface + 4 Inline-Komponenten +
3 Konstanten entfernt; Hook-Call mit 19-Property-Inputs-Object und
7-Property-Result-Destrukturierung. ThemaDetailView importiert ThemenInfo
aus Hook-Re-Export (lokaler temporärer Type aus Phase 2 entfernt).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Verifikations-Gates

- [ ] **Step 5.1: vitest run**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -10
```
Expected: ~1323 passes (Drift +21).

- [ ] **Step 5.2: tsc -b**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -10
```
Expected: clean. Output direkt prüfen — keine TS-Errors auch wenn Exit-Code 0 (Lehre `feedback_tsc_b_exit_misleading.md`).

- [ ] **Step 5.3: lint:as-any**

```bash
cd ExamLab && npm run lint:as-any 2>&1 | tail -5
```
Expected: Total 0 / Defensive 0 / Undokumentiert 0.

- [ ] **Step 5.4: lint:no-alert**

```bash
cd ExamLab && npm run lint:no-alert 2>&1 | tail -5
```
Expected: 0 Treffer.

- [ ] **Step 5.5: lint:no-tests-dir**

```bash
cd ExamLab && npm run lint:no-tests-dir 2>&1 | tail -5
```
Expected: keine `__tests__/`-Dirs.

- [ ] **Step 5.6: lint:musterloesung**

```bash
cd ExamLab && npm run lint:musterloesung 2>&1 | tail -5
```
Expected: Baseline unverändert.

- [ ] **Step 5.7: Build**

```bash
cd ExamLab && npm run build 2>&1 | tail -10
```
Expected: vite build erfolgreich, PWA generateSW OK, keine Errors.

---

## Task 6: Browser-E2E auf staging mit echtem SuS-Login

**Vorbereitung:** Branch nach staging deployen (separater PR oder direkt) — siehe HANDOFF.md für Staging-Deploy-Workflow. **Service-Worker-Cache vorab zurücksetzen** in der Browser-DevTools (Lehre `feedback_service_worker_cache_wire_bundle.md`):
1. DevTools → Application → Service Workers → Unregister
2. Application → Storage → Clear site data
3. Hard reload (Cmd+Shift+R)

Login mit echtem SuS-Account (NICHT Demo-Modus, Lehre `feedback_echte_logins.md`).

- [ ] **Step 6.1: Pfad 1 — SuS-Dashboard lädt**

Nach Login → Themen-Übersicht erscheint, Fach-Chips sichtbar, ggf. Empfehlungen-Sektion sichtbar.

- [ ] **Step 6.2: Pfad 2 — Fach-Filter**

Klick auf Fach-Chip → Themen-Liste filtert auf nur dieses Fach. Klick erneut → Filter zurückgesetzt.

- [ ] **Step 6.3: Pfad 3 — Sortierung**

Sortier-Dropdown von "A–Z" auf "Zuletzt geübt" wechseln → Reihenfolge ändert sich (zuletzt geübte Themen oben).

- [ ] **Step 6.4: Pfad 4 — ThemaKarte**

Klick auf eine ThemaKarte → ThemaDetailView lädt, Fortschritt sichtbar, Filter-Sektionen (Unterthemen/Schwierigkeit/Typ) sichtbar.

- [ ] **Step 6.5: Pfad 5 — Filter**

In Detail-View Filter-Chip aktivieren (z.B. Schwierigkeit "Einfach") → Counter "X von Y Fragen ausgewählt" ändert sich.

- [ ] **Step 6.6: Pfad 6 — Übung starten**

"Übung starten"-Button → Übung beginnt mit gefilterten Fragen.

- [ ] **Step 6.7: Pfad 7 — Mix-Dialog**

Zurück zu Themen-Übersicht → "Gemischte Übung"-Button → Dialog öffnet → 2 Themen wählen → "Starten" → Mix-Übung beginnt.

- [ ] **Step 6.8: Pfad 8 — Lernziel-Mini-Modal**

Auf einer ThemaKarte den Lernziele-Indikator klicken (falls Lernziele vorhanden) → Mini-Modal öffnet → "Üben" → Detail-View für jenes Thema.

- [ ] **Step 6.9: Pfad 9 — Fach-Sektion ein-/ausklappen**

Falls mehrere Fächer freigegeben: Klick auf Fach-Header in "Freigegebene Themen" → Sektion klappt zu. Reload Browser → State persistiert (localStorage `examlab-ueben-fach-collapsed`).

- [ ] **Step 6.10: Pfad 10 — Deep-Link**

Aus dem LernzieleAkkordeon (anderer Tab) ein Thema wählen → Dashboard navigiert direkt zur Detail-View des Themas.

- [ ] **Step 6.11: Pfad 11 — Console-Errors**

Während aller Pfade DevTools-Console offen halten. Erwartung: 0 Errors. Warnings sind OK falls pre-existing (Vorher/Nachher-Vergleich falls auffällig).

---

## Task 7: Code-Reviewer-Subagent

- [ ] **Step 7.1: Reviewer dispatchen**

Subagent-Type: `superpowers:code-reviewer` (oder general-purpose mit Review-Prompt).

**Review-Kontext:**
- Branch: `feature/bundle-t-e-dashboard-ueben`
- Spec: `docs/superpowers/specs/2026-05-07-bundle-t-e-dashboard-ueben-design.md`
- Master-Spec: `docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md`
- Diff: `git log --oneline main..HEAD` + `git diff main..HEAD -- ExamLab/src/`
- Kriterien:
  - Byte-identical Behavior aller 8 Memos (Hook-Body vs. Source-Memos)
  - Byte-identical Behavior beider useEffect's in `useDashboardLoad`
  - Byte-identical UI: ThemaDetailView, FilterSection, Chip, FortschrittsBalken, MasteryBadges
  - useMemo-Deps **byte-identisch** (keine vereinfacht/erweitert ausser Hook-Param-bedingt)
  - Hook-Result-Destrukturierung in stabile Namen
  - Test-Coverage entspricht Spec §5
  - Out-of-Scope-Items respektiert (kein useFragenFilter, kein FachSektion, byte-identische `themenMap`-Mutation, byte-identische `as`-Casts)

- [ ] **Step 7.2: Reviewer-Findings einarbeiten**

Falls Issues Found: Fixes pro Iteration committen mit Message `Bundle T.e Reviewer-Iteration-N: ...`. Re-dispatchen bis APPROVED.

---

## Task 8: HANDOFF + Memory-Update

- [ ] **Step 8.1: HANDOFF.md Eintrag**

In `ExamLab/HANDOFF.md` neuen Eintrag oben einfügen:

```markdown
### Bundle T.e — Dashboard-Üben Hook-Extraktion ✅ MERGED (2026-05-07 oder Datum)

Branch `feature/bundle-t-e-dashboard-ueben`. Fünftes Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Hoch-Risiko-File-Split per 2 Hooks + 2 Komponenten-Splits. **Dashboard.tsx 930 → ~430 Zeilen (-54%)** — aus Hotspot raus. Hotspot-Bilanz Files >500 Z.: **9 → 8**.

**Was geliefert (5 neue Files):**
- `ExamLab/src/hooks/ueben/useDashboardLoad.ts` — 2 useState + 2 useEffect (Daten-Loading), byte-identisch zu Source
- `ExamLab/src/hooks/ueben/useThemenKomputationen.ts` — 8 useMemo's + ThemenInfo-Type-Export
- `ExamLab/src/hooks/ueben/useThemenKomputationen.test.ts` — 21 Vitest-Tests
- `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx` — Inline-Funktion + 3 Konstanten
- `ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx` — 4 Helper-Komponenten

**Verifikation:**
- vitest 1323 (drift +21 vs T.d-Baseline) ✓
- tsc -b clean ✓
- 4 Lint-Gates clean ✓
- Browser-E2E: 11/11 Pfade ✓ mit echtem SuS-Login
- Code-Reviewer: APPROVED FOR MERGE
```

- [ ] **Step 8.2: Memory-Update**

`/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/MEMORY.md` + neue Topic-Datei `project_bundle_t_e_komplett.md` mit Lehren aus T.e (z.B. wenn beim Review unerwartete Punkte aufkommen).

- [ ] **Step 8.3: Commit HANDOFF + Memory**

```bash
git add ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
Bundle T.e: HANDOFF-Eintrag

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Merge-Vorbereitung

- [ ] **Step 9.1: Push branch**

```bash
git push -u origin feature/bundle-t-e-dashboard-ueben
```

- [ ] **Step 9.2: PR erstellen** (oder direkter Merge je nach Workflow)

Template-Inhalt:
- Title: "Merge Bundle T.e: Dashboard-Üben Hook-Extraktion (930 → ~430 Z., -54%)"
- Body: Spec-Link, Verifikations-Output, E2E-Log, Reviewer-Approval-Quote

- [ ] **Step 9.3: Nach Merge auf main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main && git pull --ff-only
git branch -d feature/bundle-t-e-dashboard-ueben
git push origin --delete feature/bundle-t-e-dashboard-ueben
```

---

## Erwartete Hotspot-Bilanz

Files >500 Z. nach T.e:
- T.d-Baseline: 9 Files
- Nach T.e: **8 Files** (Dashboard.tsx 930 → ~430)
- Nur noch T.f offen (LPStartseite, 1043 Z.)

---

## Pause-Punkt nach T.e

Empfohlene Reflexion vor T.f:
- Hat sich die 19-Property-Inputs-Konvention bewährt? (T.f hat ähnlich grosse Memo-Cluster)
- Test-Pflege-Aufwand für `useThemenKomputationen.test.ts` — bei Master-Spec-Änderungen synchronhalten
- Sub-Folder-Pattern `ueben/dashboard/` etabliert für künftige Komponenten-Splits
