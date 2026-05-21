# SuS-Lernziele-UX — Üben nach Lernziel — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Schüler:innen können im SuS-Bereich von ExamLab nach einzelnen Lernzielen üben — über einen Header-Einstieg und ein Unterthema-Icon, mit einer Lernziel-Karte, die Fortschritt zeigt und genau die Fragen des Lernziels startet.

**Architecture:** Reiner Client-Filter, keine Backend-Änderung. `lernziel.fragenIds` (vom Backend berechnet) + die ohnehin geladenen Fragen → gefilterte Liste → bestehendes `starteSession(fragenOverride)`. Das tote `lernzieleOffen` in `AppShell` wird verdrahtet; das bestehende `LernzieleAkkordeon` / `LernzieleMiniModal` bekommen Master-Detail (Liste ↔ Lernziel-Karte). Plus ein gebündelter Icon-Konsistenz-Schritt (LP/SuS).

**Tech Stack:** React 18 + TypeScript, Vite, Zustand-Stores, TailwindCSS, Lucide-React-Icons, vitest. Apps-Script-Backend bleibt unangetastet.

**Spec:** `docs/superpowers/specs/2026-05-21-sus-lernziele-ux-design.md` — bei Unklarheiten ist die Spec massgeblich.

**Konventionen (`.claude/rules/`):** TDD wo Logik vorhanden ist (@superpowers:test-driven-development). Vor jedem Commit `npx tsc -b` + betroffene vitest grün. Schweizer Hochdeutsch (`ss`, nicht `ß`). Domain-Begriffe deutsch, Programming-Primitives englisch. Keine neuen `as any`, keine Emojis im Produktivcode. Tests colocated als `*.test.tsx`.

---

## File Structure

**Neu:**
- `src/components/ueben/LernzielKarte.tsx` — Detailkarte eines Lernziels (Variante 3). Exportiert die reine Funktion `berechneKartenDaten` für Tests.
- `src/components/ueben/LernzielKarte.test.tsx` — Unit-Tests.
- `src/components/ueben/dashboard/SchwierigkeitIcon.tsx` — wählt `SignalLow/Medium/High` nach Stufe 1–3.

**Modifiziert:**
- `src/components/shared/header/AppHeader.tsx` — optionaler `onLernziele`-Prop + Flag-Button (nur SuS-genutzt).
- `src/components/sus/SuSAppHeaderContainer.tsx` — `onLernziele` durchreichen.
- `src/components/ueben/layout/AppShell.tsx` — `onLernziele` → `setLernzieleOffen(true)`; Akkordeon-`onLernzielUeben`-Handler.
- `src/store/ueben/uebungsStore.ts` — neue Action `starteLernzielSession`.
- `src/components/ueben/LernzieleAkkordeon.tsx` — Lernziele klickbar, Master-Detail mit `LernzielKarte`, `onLernzielUeben`-Prop; gilt für `LernzieleAkkordeon` UND `LernzieleMiniModal` (gleiche Datei).
- `src/components/ueben/Dashboard.tsx` — `LernzieleMiniModal`-`onLernzielUeben`-Handler; Unterthema-Icon-Verdrahtung.
- `src/components/ueben/dashboard/themaDetailHelpers.tsx` — `Chip` optionale Lernziele-Icon-Props; `label` auf `ReactNode`.
- `src/components/ueben/dashboard/ThemaDetailView.tsx` — Unterthema-Chips mit Flag-Icon; Schwierigkeit `⭐` → `SchwierigkeitIcon`.
- `src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx` + `KompaktZeile.tsx` — `Target` → `Flag`.
- SuS-Fortschritt-Analyse (`SuSAnalyse.tsx`, Pfad in Task 10 verifizieren) — Mastery-`Star` → `CircleCheck`.
- `src/components/ueben/SuSHilfePanel.tsx` — Hilfe-Legende: Schwierigkeits-Icon an das neue Signal-Icon angleichen (Task 11).

**Type-Hinweis:** `LernzieleAkkordeon` importiert `Lernziel` aus `../../types/pool`, `mastery.ts` aus `@shared/types/fragen-core`. Beim Coden den Type verwenden, den `lernzielStatus()` erwartet (`@shared/types/fragen-core` — trägt `fragenIds`). Falls `types/pool` nur re-exportiert, ist beides identisch — kurz verifizieren, nicht annehmen.

---

## Phase 1 — Header-Einstieg verdrahten

### Task 1: Lernziele-Button in den SuS-Header

**Files:**
- Modify: `src/components/shared/header/AppHeader.tsx`
- Modify: `src/components/sus/SuSAppHeaderContainer.tsx`
- Modify: `src/components/ueben/layout/AppShell.tsx:55-62` (Header-Aufruf), `:32` (State)
- Test: `src/components/ueben/layout/AppShell.test.tsx` (neu oder erweitert)

- [ ] **Step 1: Failing test schreiben**

In `AppShell.test.tsx`: rendere `AppShell` als angemeldeter SuS auf dem Dashboard-Screen. Test: ein Button mit `aria-label`/Name „Lernziele" ist im Header sichtbar; nach Klick erscheint das `LernzieleAkkordeon` (z. B. Überschrift „Alle Lernziele" bzw. der Leer-Zustand). Bestehende `AppShell`-Test-Mocks für die Stores als Vorlage nehmen; `useUebenFortschrittStore` mit ≥1 Lernziel mocken.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/layout/AppShell.test.tsx`
Expected: FAIL — kein „Lernziele"-Button.

- [ ] **Step 3: Implementieren**

`AppHeader.tsx`: optionalen Prop `onLernziele?: () => void` ergänzen. Wenn gesetzt, einen **neuen, eigenständigen Icon-Button** in die rechte Aktions-Gruppe der Kopfzeile einfügen (~Z. 91-101, beim Suchfeld / `⋮`-`OptionenMenu`) — Lucide `Flag` + `aria-label="Lernziele"` + `title="Lernziele"`. **Wichtig:** `onHilfe`, Theme-Toggle und Abmelden liegen im `⋮`-`OptionenMenu`-Dropdown, NICHT als eigene Header-Buttons — es gibt also keinen „Hilfe-Button" zum Danebenstellen. Der Lernziele-Button ist bewusst eigenständig und sichtbar (Spec §5.1; der Test in Step 1 verlangt einen sichtbaren Button). Styling am nächstliegenden echten Header-Button orientieren: dem `← Zurück`-Button (`AppHeader.tsx:63-71`). Vor dem Coden `AppHeader.tsx` lesen, um die rechte Aktions-Gruppe und das Zurück-Button-Styling zu sehen. LP-Nutzung bleibt unberührt (Prop optional, ohne `onLernziele` kein Button).

`SuSAppHeaderContainer.tsx`: `onLernziele?: () => void` in `Props` (Z. 21-29) ergänzen, in der Destrukturierung (Z. 31-38) aufnehmen, an `<AppHeader>` (Z. 84-101) durchreichen.

`AppShell.tsx`: am `<SuSAppHeaderContainer>`-Aufruf (Z. 55) ergänzen: `onLernziele={() => { setLernzieleOffen(true); setHilfeOffen(false) }}`. (`onHilfe` setzt schon `setLernzieleOffen(false)` — symmetrisch.)

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/layout/AppShell.test.tsx`
Expected: PASS. Dann `cd ExamLab && npx tsc -b` — clean (prüft, dass die `AppHeader`-Prop-Erweiterung keine LP-Aufrufer bricht).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/AppHeader.tsx ExamLab/src/components/sus/SuSAppHeaderContainer.tsx ExamLab/src/components/ueben/layout/AppShell.tsx ExamLab/src/components/ueben/layout/AppShell.test.tsx
git commit -m "feat(lernziele): Header-Button öffnet das Lernziele-Akkordeon"
```

---

## Phase 2 — Lernziel-Karte + Üben-Action

### Task 2: Store-Action `starteLernzielSession`

**Files:**
- Modify: `src/store/ueben/uebungsStore.ts` (Interface `UebungsState` ~Z. 35, Action-Block ~Z. 69)
- Test: `src/store/ueben/uebungsStore.test.ts` (erweitern; falls nicht vorhanden, neu)

- [ ] **Step 1: Failing test schreiben**

Test `starteLernzielSession`: `uebenFragenAdapter.ladeFragen` mocken (gibt z. B. 5 Fragen mit IDs `f1..f5`), Lernziel mit `fragenIds: ['f2','f4']`. Stores (`useUebenGruppenStore`, `useUebenAuthStore`, `useThemenSichtbarkeitStore`) mocken. `get().starteSession` spionieren. Assert: `starteSession` wird mit `fragenOverride` aufgerufen, der exakt `f2` + `f4` enthält (nicht `f1/f3/f5`), mit `lernziel.fach`/`lernziel.thema`, `modus='standard'`. Zweiter Test: `getStatus → 'nicht_freigeschaltet'` ⇒ `freiwillig === true`.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/store/ueben/uebungsStore.test.ts`
Expected: FAIL — `starteLernzielSession` existiert nicht.

- [ ] **Step 3: Implementieren**

In `UebungsState` ergänzen: `starteLernzielSession: (lernziel: Lernziel) => Promise<void>`. Implementierung (self-contained, liest andere Stores via `getState()` — Muster wie das bestehende `starteSession`):

```ts
starteLernzielSession: async (lernziel) => {
  const gruppe = useUebenGruppenStore.getState().aktiveGruppe
  const user = useUebenAuthStore.getState().user
  if (!gruppe || !user) return
  const alleFragen = await uebenFragenAdapter.ladeFragen(gruppe.id)
  const ids = new Set(lernziel.fragenIds ?? [])
  const gefilterte = alleFragen.filter(f => ids.has(f.id))
  const { getStatus, freischaltungen } = useThemenSichtbarkeitStore.getState()
  const freiwillig = freischaltungen.length > 0
    && getStatus(lernziel.fach, lernziel.thema) === 'nicht_freigeschaltet'
  await get().starteSession(
    gruppe.id, user.email, lernziel.fach, lernziel.thema,
    gefilterte, 'standard', undefined, freiwillig,
  )
},
```

Imports ergänzen: `useUebenGruppenStore`, `useThemenSichtbarkeitStore`, `Lernziel`-Type. `useUebenAuthStore` wird in `starteSession` schon dynamisch importiert — hier statischer Import oben ist sauberer; prüfen, dass kein Circular-Import entsteht (sonst dynamisch wie in `starteSession`).

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/store/ueben/uebungsStore.test.ts` → PASS. Dann `cd ExamLab && npx tsc -b`.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/store/ueben/uebungsStore.ts ExamLab/src/store/ueben/uebungsStore.test.ts
git commit -m "feat(lernziele): starteLernzielSession — Client-Filter auf fragenIds"
```

### Task 3: Komponente `LernzielKarte`

**Files:**
- Create: `src/components/ueben/LernzielKarte.tsx`
- Test: `src/components/ueben/LernzielKarte.test.tsx`

- [ ] **Step 1: Failing test schreiben**

Tests für die exportierte reine Funktion `berechneKartenDaten(lernziel, fortschritte)`:
- Lernziel mit `fragenIds:['a','b','c','d']`, `fortschritte` mit `a:gemeistert, b:gefestigt, c:ueben` (d fehlt) ⇒ `buckets = {gemeistert:1, gefestigt:1, ueben:1, neu:1}`, `total:4`, `nichtSicher:2` (`neu+ueben`), `letzterVersuch` = grösster Timestamp.
- `fragenIds` leer/undefined ⇒ `total:0`.
Render-Tests: Status `gemeistert` ⇒ Lucide `Trophy` sichtbar; Status `inArbeit` ⇒ kein `Trophy`. `total === 0` ⇒ „Üben"-Button hat `disabled`.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/LernzielKarte.test.tsx`
Expected: FAIL — Datei existiert nicht.

- [ ] **Step 3: Implementieren**

`LernzielKarte.tsx`. Props: `{ lernziel: Lernziel; fortschritte: Record<string, FragenFortschritt>; onUeben: (lernziel: Lernziel) => void; onZurueck: () => void }`.

Exportierte reine Funktion (Berechnung = Testkern):

```ts
export function berechneKartenDaten(
  lernziel: Lernziel,
  fortschritte: Record<string, FragenFortschritt>,
) {
  const ids = lernziel.fragenIds ?? []
  const buckets = { gemeistert: 0, gefestigt: 0, ueben: 0, neu: 0 }
  let letzterVersuch: string | null = null
  for (const id of ids) {
    const fp = fortschritte[id]
    const stufe = fp?.mastery ?? 'neu'
    buckets[stufe]++
    if (fp?.letzterVersuch && (!letzterVersuch || fp.letzterVersuch > letzterVersuch)) {
      letzterVersuch = fp.letzterVersuch
    }
  }
  return {
    total: ids.length,
    buckets,
    status: lernzielStatus(lernziel, fortschritte),
    nichtSicher: buckets.neu + buckets.ueben,
    letzterVersuch,
  }
}
```

JSX-Aufbau gemäss Spec §5.4 (Inhalt von oben nach unten): Zurück-Affordanz (`onZurueck`); Breadcrumb `fach › thema`; Lernziel-Text; Zeile mit Bloom-Badge (`lernziel.bloom`) + Status-Wort (`status`) + bei `status === 'gemeistert'` ein kleiner `Trophy` (Lucide); Fortschrittsbalken + „X / Y gemeistert" (X=`buckets.gemeistert`, Y=`total`); 4-Stufen-Aufschlüsselung mit farbigen Markern (gemeistert grün / gefestigt blau / ueben gelb / neu grau — gleiche Farben wie `LernzielStatusIcon` + `FortschrittsBalken`); Empfehlungs-Banner „`nichtSicher` Fragen noch nicht sicher" (bzw. bei `total>0 && nichtSicher===total` Einstiegs-Text); „Zuletzt geübt" relativ aus `letzterVersuch` (entfällt wenn `null`); „Üben"-Button → `onUeben(lernziel)`, `disabled` wenn `total === 0` (dann Hinweis „Noch keine Fragen mit diesem Lernziel verknüpft"). Light/Dark-Mode mit `dark:`-Klassen. Styling an `themaDetailHelpers`/`LernzieleAkkordeon` anlehnen (DRY — vorhandene Tailwind-Muster wiederverwenden).

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/LernzielKarte.test.tsx` → PASS. Dann `cd ExamLab && npx tsc -b`.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/LernzielKarte.tsx ExamLab/src/components/ueben/LernzielKarte.test.tsx
git commit -m "feat(lernziele): LernzielKarte mit Fortschritt + Pokal bei gemeistert"
```

---

## Phase 3 — Per-Lernziel-Klick in Akkordeon + Mini-Modal

### Task 4: `LernzieleAkkordeon` — Lernziele klickbar, Master-Detail

**Files:**
- Modify: `src/components/ueben/LernzieleAkkordeon.tsx`
- Test: `src/components/ueben/LernzieleAkkordeon.test.tsx` (neu oder erweitert)

- [ ] **Step 1: Failing test schreiben**

`LernzieleAkkordeon` mit ≥1 Fach/Thema/Lernziel rendern, Fach + Thema aufklappen. Test: Klick auf eine Lernziel-Zeile zeigt die `LernzielKarte` (Lernziel-Text + „Üben"-Button), die Lernziel-Liste verschwindet. Klick auf „Zurück" zeigt wieder die Liste. „Üben" auf der Karte ruft den `onLernzielUeben`-Prop mit dem Lernziel auf.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/LernzieleAkkordeon.test.tsx` → FAIL.

- [ ] **Step 3: Implementieren**

`Props` um `onLernzielUeben: (lz: Lernziel) => void` erweitern. Internen State `const [gewaehltesLernziel, setGewaehltesLernziel] = useState<Lernziel | null>(null)`. Ist er gesetzt, im Modal-Body statt der Fach-Liste `<LernzielKarte lernziel={gewaehltesLernziel} fortschritte={fortschritte} onUeben={onLernzielUeben} onZurueck={() => setGewaehltesLernziel(null)} />` rendern. In `renderLernzielListe` (Z. 48-65) jede Zeile klickbar machen (`role="button"`, `tabIndex`, `onClick`/`onKeyDown` → `setGewaehltesLernziel(lz)`); Bloom-Badge + Status-Icon bleiben. Der bestehende „Fragen zu «Thema» üben"-Button bleibt unverändert (Spec Entscheidung #10).

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/LernzieleAkkordeon.test.tsx` → PASS. `cd ExamLab && npx tsc -b` (erwartet Fehler bei den `LernzieleAkkordeon`-Aufrufern wegen neuem Pflicht-Prop — wird in Task 6 behoben; falls die Phasen einzeln tsc-clean sein müssen, `onLernzielUeben` zunächst optional `?` machen und in Task 6 auf Pflicht ziehen, ODER Task 4+6 als ein Commit bündeln).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/LernzieleAkkordeon.tsx ExamLab/src/components/ueben/LernzieleAkkordeon.test.tsx
git commit -m "feat(lernziele): Akkordeon — Lernziele klickbar, Master-Detail-Karte"
```

### Task 5: `LernzieleMiniModal` — Master-Detail

**Files:**
- Modify: `src/components/ueben/LernzieleAkkordeon.tsx` (`LernzieleMiniModal`, Z. 204-270)
- Test: `src/components/ueben/LernzieleAkkordeon.test.tsx` (erweitern)

- [ ] **Step 1: Failing test schreiben**

`LernzieleMiniModal` mit Lernzielen rendern. Test: Klick auf eine Lernziel-Zeile zeigt `LernzielKarte`; „Zurück" zeigt die Liste; „Üben" auf der Karte ruft `onLernzielUeben` auf.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/LernzieleAkkordeon.test.tsx` → FAIL.

- [ ] **Step 3: Implementieren**

`LernzieleMiniModal`-Props um `onLernzielUeben: (lz: Lernziel) => void` erweitern. Gleicher `gewaehltesLernziel`-State + Master-Detail wie Task 4. `renderLZ` (Z. 281-296) klickbar machen. Optionaler Prop `fokusUnterthema?: string` (für Task 8): ist er gesetzt, beim Öffnen die entsprechende Unterthema-Gruppe hervorheben/dorthin scrollen. Der bestehende `onUeben`-Thema-Button bleibt.

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/LernzieleAkkordeon.test.tsx` → PASS. `cd ExamLab && npx tsc -b` (Aufrufer in Dashboard — in Task 6).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/LernzieleAkkordeon.tsx ExamLab/src/components/ueben/LernzieleAkkordeon.test.tsx
git commit -m "feat(lernziele): Mini-Modal — Master-Detail-Karte"
```

### Task 6: Üben-Flow in `AppShell` + `Dashboard` verdrahten

**Files:**
- Modify: `src/components/ueben/layout/AppShell.tsx` (Akkordeon-Aufruf Z. 68-82)
- Modify: `src/components/ueben/Dashboard.tsx` (`LernzieleMiniModal`-Aufruf Z. 486-497)
- Test: `src/components/ueben/layout/AppShell.test.tsx` erweitern

- [ ] **Step 1: Failing test schreiben**

In `AppShell.test.tsx`: Akkordeon öffnen, Lernziel anklicken, „Üben" klicken — assert `useUebenUebungsStore.starteLernzielSession` wird mit dem Lernziel aufgerufen und das Akkordeon schliesst. Stores mocken.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/layout/AppShell.test.tsx` → FAIL.

- [ ] **Step 3: Implementieren**

`AppShell`: `useSuSNavigation` liefert auch `openUebung` (wie in `Dashboard`) — destrukturieren. `starteLernzielSession` aus `useUebenUebungsStore`. Am `<LernzieleAkkordeon>` ergänzen:
```tsx
onLernzielUeben={async (lz) => {
  setLernzieleOffen(false)
  await useUebenUebungsStore.getState().starteLernzielSession(lz)
  openUebung(lz.thema)
}}
```
`Dashboard`: am `<LernzieleMiniModal>` (Z. 486) analog `onLernzielUeben` ergänzen — `setLzMiniModal(null)`, `await starteLernzielSession(lz)`, `openUebung(lz.thema)`. `starteLernzielSession` aus `useUebenUebungsStore` beziehen.

Falls in Task 4/5 `onLernzielUeben` optional gemacht wurde: jetzt auf Pflicht ziehen.

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/layout/AppShell.test.tsx` → PASS. `cd ExamLab && npx tsc -b` → clean. `cd ExamLab && npx vitest run` (volle Suite) → grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/layout/AppShell.tsx ExamLab/src/components/ueben/Dashboard.tsx ExamLab/src/components/ueben/layout/AppShell.test.tsx
git commit -m "feat(lernziele): Üben-Flow — Karte startet Lernziel-Session"
```

---

## Phase 4 — Einstieg 2: Lernziele-Icon je Unterthema

### Task 7: `Chip` um optionales Lernziele-Icon erweitern

**Files:**
- Modify: `src/components/ueben/dashboard/themaDetailHelpers.tsx` (`Chip`, Z. 29-54)
- Test: `src/components/ueben/dashboard/themaDetailHelpers.test.tsx` (neu oder erweitert)

- [ ] **Step 1: Failing test schreiben**

`Chip` mit `onLernzieleKlick` + `lernzieleAnzahl: 3` ⇒ ein Flag-Icon-Element ist sichtbar; Klick darauf ruft `onLernzieleKlick`, NICHT `onClick` (Filter-Toggle). `Chip` ohne `onLernzieleKlick` ⇒ kein Icon. `lernzieleAnzahl: 0` ⇒ kein Icon.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/dashboard/themaDetailHelpers.test.tsx` → FAIL.

- [ ] **Step 3: Implementieren**

`Chip`-Props erweitern: `onLernzieleKlick?: () => void`, `lernzieleAnzahl?: number`. `label`-Typ von `string` auf `React.ReactNode` (für Task 11 nötig — hier mitziehen, additiv). Wenn `onLernzieleKlick` gesetzt UND `(lernzieleAnzahl ?? 0) > 0`: am Chip-Ende, durch eine Trennlinie abgesetzt, ein klickbares `Flag`-Icon (Lucide) rendern. Dessen Handler ruft `e.stopPropagation()` + `onLernzieleKlick()` — damit der Chip-`onClick` (Filter-Toggle) nicht feuert. `aria-label`/`title` „Lernziele".

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/dashboard/themaDetailHelpers.test.tsx` → PASS. `cd ExamLab && npx tsc -b` (alle `Chip`-Aufrufer in `ThemaDetailView` müssen mit `label: ReactNode` weiter kompilieren — Strings sind gültige ReactNodes).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx ExamLab/src/components/ueben/dashboard/themaDetailHelpers.test.tsx
git commit -m "feat(lernziele): Chip — optionales Lernziele-Icon"
```

### Task 8: Unterthema-Chips öffnen das Mini-Modal

**Files:**
- Modify: `src/components/ueben/dashboard/ThemaDetailView.tsx` (Unterthema-`FilterSection`, Z. 87-107)
- Modify: `src/components/ueben/Dashboard.tsx` — `lzMiniModal`-State um `fokusUnterthema` erweitern; `ThemaDetailView` braucht Zugriff auf die Lernziele-Anzahl je Unterthema
- Test: `src/components/ueben/dashboard/ThemaDetailView.test.tsx` (neu oder erweitert)

- [ ] **Step 1: Failing test schreiben**

`ThemaDetailView` mit einem Unterthema rendern, dem Lernziele zugeordnet sind. Test: das Unterthema-Chip zeigt das Flag-Icon; Klick auf das Icon ruft den neuen `onUnterthemaLernziele(unterthema)`-Prop; Klick auf den Chip-Körper ruft weiterhin `onToggleUnterthema`. Unterthema ohne Lernziele ⇒ kein Icon.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/dashboard/ThemaDetailView.test.tsx` → FAIL.

- [ ] **Step 3: Implementieren**

`ThemaDetailView`: neuer Prop `onUnterthemaLernziele?: (unterthema: string) => void` und `lernzieleProUnterthema?: Record<string, number>` (Map Unterthema → Anzahl Lernziele). Im Unterthema-`<Chip>` (Z. 96-104) `onLernzieleKlick={() => onUnterthemaLernziele?.(ut)}` + `lernzieleAnzahl={lernzieleProUnterthema?.[ut]}` durchreichen.

`Dashboard`: `lernzieleProUnterthema` für das aktive Thema aus `lernziele` ableiten (filtern auf `fach`/`thema`, nach `unterthema` zählen — analog zur `anzahlLernziele`-Logik in `renderThemaKarte`, Z. 254). `lzMiniModal`-State um `fokusUnterthema?: string` erweitern; `onUnterthemaLernziele` setzt `setLzMiniModal({ fach, thema, fokusUnterthema: ut })`. `fokusUnterthema` an `<LernzieleMiniModal fokusUnterthema={...}>` durchreichen (Prop aus Task 5).

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/dashboard/ThemaDetailView.test.tsx` → PASS. `cd ExamLab && npx tsc -b`.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx ExamLab/src/components/ueben/Dashboard.tsx ExamLab/src/components/ueben/dashboard/ThemaDetailView.test.tsx
git commit -m "feat(lernziele): Unterthema-Chips öffnen das Lernziele-Mini-Modal"
```

---

## Phase 5 — Icon-Konsistenz LP ↔ SuS

### Task 9: LP-Lernziele-Icon `Target` → `Flag`

**Files:**
- Modify: `src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx` (Import Z. 1, Nutzung ~Z. 100)
- Modify: `src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx` (Import Z. 1, Nutzung ~Z. 102)

- [ ] **Step 1: Ändern**

In beiden Dateien: `Target` aus dem `lucide-react`-Import durch `Flag` ersetzen; die `<Target … />`-Verwendung (Lernziele-Zähler-Badge) durch `<Flag … />` mit identischen Klassen/`aria-hidden`.

- [ ] **Step 2: Prüfen**

Run: `cd ExamLab && npx tsc -b` → clean. `cd ExamLab && npx vitest run src/components/lp/fragensammlung` → bestehende Tests grün (falls Snapshots, regenerieren).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/lp/fragensammlung/fragenbrowser/DetailKarte.tsx ExamLab/src/components/lp/fragensammlung/fragenbrowser/KompaktZeile.tsx
git commit -m "refactor(lernziele): LP-Lernziele-Icon auf Flag vereinheitlicht"
```

### Task 10: SuS-Mastery-Icon `Star` → `CircleCheck`

**Files:**
- Modify: SuS-Fortschritt-Analyse (`SuSAnalyse.tsx` — Pfad in Step 1 verifizieren).

- [ ] **Step 1: Stelle lokalisieren**

Run: `cd ExamLab && grep -rn "Star" src/components/ueben --include='*.tsx'`
Die Stelle finden, an der `Star` für „Gemeistert"/Mastery steht (laut Audit `SuSAnalyse.tsx`, 4-Icon-Dashboard mit `TrendingUp`/`Flame`/`Star`/`Pencil`). NUR diese eine Mastery-Stelle betrifft die Änderung — `Star` für andere Zwecke (Favorit, „Aktuelle Themen" in `Dashboard.tsx` Z. 438) NICHT anfassen.

- [ ] **Step 2: Ändern**

An der Mastery-„Gemeistert"-Stelle `Star` → `CircleCheck` (Import + Nutzung, gleiche Klassen). Hinweis: `SuSHilfePanel.tsx` dokumentiert Mastery mit farbigen Quadraten (kein `Star`) — dort ist für Task 10 nichts zu tun. Die `Star`-Stellen im Hilfe-Panel betreffen Schwierigkeit (Task 11) und Gamification (out of scope), nicht Mastery.

- [ ] **Step 3: Prüfen**

Run: `cd ExamLab && npx tsc -b` → clean. Betroffene Komponententests grün.

- [ ] **Step 4: Commit**

```bash
git add -- <SuSAnalyse-Datei>
git commit -m "refactor(lernziele): SuS-Mastery-Icon auf CircleCheck (Star = nur Favorit)"
```

### Task 11: Schwierigkeits-Icon — `⭐`-Emoji → Signal-Balken

**Files:**
- Create: `src/components/ueben/dashboard/SchwierigkeitIcon.tsx`
- Modify: `src/components/ueben/dashboard/ThemaDetailView.tsx` (`SCHWIERIGKEIT_STERNE` Z. 10, Schwierigkeits-`Chip`-Label Z. 110-124)
- Modify: `src/components/ueben/SuSHilfePanel.tsx` — Schwierigkeits-Legende.
- Test: `src/components/ueben/dashboard/SchwierigkeitIcon.test.tsx`

- [ ] **Step 1: Failing test schreiben**

`SchwierigkeitIcon` mit `stufe={1|2|3}` rendert `SignalLow`/`SignalMedium`/`SignalHigh`; Test prüft pro Stufe das erwartete Icon (z. B. via `data-testid` oder `aria-label` „Einfach/Mittel/Schwer").

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ExamLab && npx vitest run src/components/ueben/dashboard/SchwierigkeitIcon.test.tsx` → FAIL.

- [ ] **Step 3: Implementieren**

```tsx
// src/components/ueben/dashboard/SchwierigkeitIcon.tsx
import { SignalLow, SignalMedium, SignalHigh } from 'lucide-react'

const KARTE: Record<number, { Icon: typeof SignalLow; label: string }> = {
  1: { Icon: SignalLow, label: 'Einfach' },
  2: { Icon: SignalMedium, label: 'Mittel' },
  3: { Icon: SignalHigh, label: 'Schwer' },
}

export function SchwierigkeitIcon({ stufe, className }: { stufe: number; className?: string }) {
  const { Icon, label } = KARTE[stufe] ?? KARTE[2]
  return <Icon className={className ?? 'w-4 h-4'} aria-label={label} />
}
```

`ThemaDetailView`: `SCHWIERIGKEIT_STERNE` (Z. 10, `⭐`-Emoji) entfernen. Im Schwierigkeits-`Chip` (Z. 110-124) das `label` von `${SCHWIERIGKEIT_STERNE[s]} ${SCHWIERIGKEIT_LABELS[s]}` auf einen `ReactNode` umstellen: `<span className="inline-flex items-center gap-1"><SchwierigkeitIcon stufe={s} className="w-3.5 h-3.5" /> {SCHWIERIGKEIT_LABELS[s]}</span>`. (`Chip.label` akzeptiert seit Task 7 `ReactNode`.) Ausserdem in `src/components/ueben/SuSHilfePanel.tsx` die Schwierigkeits-Legende (heute mit `Star` dokumentiert) auf `SchwierigkeitIcon` umstellen — `grep -n "Star" src/components/ueben/SuSHilfePanel.tsx`, die Schwierigkeits-Stelle anpassen.

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ExamLab && npx vitest run src/components/ueben/dashboard/SchwierigkeitIcon.test.tsx` → PASS. Dann `cd ExamLab && npx tsc -b` + `npx vitest run` (volle Suite) → grün. **`lint:no-emoji`-Gate:** das Entfernen des `⭐`-Emojis senkt den Emoji-Count — das Audit-Skript `audit-no-emoji.mjs` meldet dann eine IMPROVEMENT und verlangt eine Baseline-Regeneration. Das ist KEIN Fehler: die Baseline mit dem `--baseline`-Flag des Audit-Skripts neu generieren, die regenerierte Baseline-Datei mit committen, dann das Gate erneut laufen lassen (muss clean sein).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/dashboard/SchwierigkeitIcon.tsx ExamLab/src/components/ueben/dashboard/SchwierigkeitIcon.test.tsx ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx ExamLab/src/components/ueben/SuSHilfePanel.tsx
# falls die no-emoji-Baseline regeneriert wurde, die Baseline-Datei mit hinzufügen
git commit -m "feat(lernziele): Schwierigkeit als Signal-Balken statt Stern-Emoji"
```

---

## Phase 6 — Verifikation

### Task 12: Volle Suite + Browser-E2E auf Staging

- [ ] **Step 1: Gesamt-Checks**

Run: `cd ExamLab && npx tsc -b && npx vitest run && npm run build`
Erwartet: alles grün. Lint-Gates (`ci-check`) clean.

- [ ] **Step 2: Browser-E2E auf Staging** (echte LP- + SuS-Logins, kein Demo-Modus — `.claude/rules/regression-prevention.md`). Tab-Gruppe nutzen. Vorher schriftlicher Test-Plan. Durchzuspielen (Spec §9):
  1. SuS-Login → Header-`Flag`-Button → Akkordeon öffnet.
  2. Lernziel anklicken → `LernzielKarte` erscheint inline mit Fortschritt → „Zurück".
  3. „Üben" auf der Karte → Session läuft mit genau den Fragen des Lernziels.
  4. Themen-Detail → Unterthema-`Flag`-Icon → Mini-Modal → Lernziel → Karte → Üben.
  5. Filter-Toggle des Unterthema-Chips (Klick neben dem Icon) funktioniert weiterhin.
  6. LP-Fragensammlung zeigt `Flag` statt `Target`; Schwierigkeit zeigt Signal-Balken.
  7. Light/Dark-Mode der `LernzielKarte`.
  8. Randfall: Lernziel ohne Fragen → „Üben" deaktiviert.

- [ ] **Step 3: HANDOFF.md aktualisieren, Merge-Gate** gemäss `.claude/rules/regression-prevention.md` Phase 5 (LP-Freigabe vor Merge auf `main`).

---

## Hinweise zur Phasen-Reihenfolge

- Phase 1 ist eigenständig nutzbar (Akkordeon erreichbar, zunächst mit Thema-Üben).
- Phase 2 (Karte + Action) ist Voraussetzung für Phase 3.
- Task 4/5 führen einen neuen Pflicht-Prop ein, dessen Aufrufer erst Task 6 liefert. Wenn jede Phase strikt tsc-clean committen muss: `onLernzielUeben` in Task 4/5 zunächst optional (`?`), in Task 6 auf Pflicht ziehen — ODER Task 4+5+6 als ein Commit bündeln. Entscheidung dem ausführenden Worker / Reviewer überlassen.
- Phase 5 (Icons) ist unabhängig und kann auch vor Phase 3/4 laufen.
