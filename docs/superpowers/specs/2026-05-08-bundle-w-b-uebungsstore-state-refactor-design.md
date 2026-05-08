# Bundle W.b — uebungsStore State-Refactor

**Datum:** 2026-05-08
**Branch (geplant):** `bundle-w-b/uebungsstore-state-refactor`
**Phase:** Folge-Cut nach Bundle W (uebungsStore endete bei 540 Z. — knapp über Master-Spec-Schwelle <500)
**Sub-Bundle:** Direkter Folge-Cut, kein neues Audit-Phasen-Sub-Bundle

---

## 1 · Kontext & Ziel

### Target-Datei
`ExamLab/src/store/ueben/uebungsStore.ts` — **540 Zeilen** nach Bundle W (Pure-Logic-Cut von loesungsMerge/historie/ergebnisBerechnung).

Bundle W cuttete pure data-logic. Übrig sind die zwei async-stateful Methoden mit verbleibender pure Sub-Logik plus eine duplizierte Konstante:

| Bereich | Zeilen | Charakter |
|---|---|---|
| `starteSession` Z. 70–181 (~111 Z.) | Z. 90–109 mastery + block-switch (~20 Z.) | **Pure** (gegen `fortschritte` + Args) |
| `starteSession` Z. 116–139 lösungs-preload (~24 Z.) | gesamt | **Async-pure** (gegen `ladeLoesungenApi` + injected `user`) |
| `pruefeAntwortJetzt` Z. 246–368 (~122 Z.) | Z. 264–284 client-fast-path (~22 Z.) | **Pure mit isolierter Side-Effect-Zeile** (`fortschritt.antwortVerarbeiten` bleibt im Store) |
| `pruefeAntwortJetzt` Z. 263 + `selbstbewertenById` Z. 382 | `istSelbstbewertbar`-Konstante (Array-Literal **dupliziert**) | Klassifikations-Konstante |

### Konsumenten-Surface
**Unverändert.** Public API von `useUebenUebungsStore` bleibt byte-identisch — alle 4 Cuts sind interne Helper-Extraktionen ohne Caller-Edits.

### Bestehende Test-Files (bleiben grün, Korrektheits-Backup)
- `src/tests/uebungsStoreLoesungsPreload.test.ts` — testet `starteSession`-Pfad (deckt `erstelleSessionBlock`-Output + `ladeLoesungenViaPreload`-Wiring indirekt ab)
- `src/tests/uebungsStorePruefen.test.ts` — testet `pruefeAntwortJetzt`-Pfad (deckt `pruefeClientseitig`-Wiring + Server-Pfad-Wiring indirekt ab)

### Ziel-Metriken
- `uebungsStore.ts` schrumpft **540 → ~481 Zeilen** (16 Z. unter <500-Schwelle Master-Spec).
- Hotspot-Bilanz Files >500 Z. (ohne `data/`+`test/`): **10 → 9** (nach Bundle W blieb der Wert bei 10 — dieses Bundle realisiert den eigentlichen Hotspot-Cut).
- Bundle-W-Spawn-Task `istSelbstbewertbar`-Konstante wird thematisch zu Cut 2 gebündelt (siehe § 9 Begründung).

---

## 2 · Architektur & Files

### Cut-Strategie: Pure-Logic-Cut (Bundle U/V/W-Pattern fortgesetzt)

Reine Logik wandert nach `utils/ueben/`. Async-Orchestration (try/catch, dynamic-imports von `authStore`/`uebenKorrekturApi`, set()-Calls, Auth-Retry-Logik) bleibt im Store. Side-Effects auf andere Stores (`useUebenFortschrittStore.getState().antwortVerarbeiten`) bleiben im Store-Action — der Helper liefert nur das pure Result-Objekt zurück.

### 4 neue Files in `ExamLab/src/utils/ueben/`

Konsistent zu existierenden Pure-Modulen (`korrektur.ts`, `mastery.ts`, `fragetext.ts`, `blockBuilder.ts`, Bundle-W-Cuts `loesungsMerge.ts`/`historie.ts`/`ergebnisBerechnung.ts`).

| Datei | Z. ca. | Quelle | Inhalt |
|---|---|---|---|
| `fragetypGruppen.ts` | ~10 | uebungsStore.ts Z. 263 + Z. 382 (dupliziert) | `SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][]` + `istSelbstbewertbar(typ): boolean` |
| `sessionBlockBau.ts` | ~45 | uebungsStore.ts Z. 90–109 | `erstelleSessionBlock({alleFragen, fach, thema, modus, quellen, fortschritte}) → { block, mastery }` |
| `pruefeClientseitig.ts` | ~35 | uebungsStore.ts Z. 264–284 (Pre-Load-Fast-Path-Body) | `pruefeClientseitig({session, frage, normalized}) → { korrekt, sessionUpdates, letzteMusterloesung }` |
| `loesungsPreloadFetch.ts` | ~35 | uebungsStore.ts Z. 116–139 | `async ladeLoesungenViaPreload({block, gruppeId, fachbereich, user}) → Promise<LoesungsMap>` |

### 4 neue Test-Files (alle co-located)

| Datei | Vitest-Cases |
|---|---|
| `utils/ueben/fragetypGruppen.test.ts` | 3 |
| `utils/ueben/sessionBlockBau.test.ts` | 6 |
| `utils/ueben/pruefeClientseitig.test.ts` | 5 |
| `utils/ueben/loesungsPreloadFetch.test.ts` | 4 |
| **Vitest-Drift gesamt** | **+18** (Baseline 1454 → 1472) |

### 0 Caller-Edits ausserhalb des Stores

Alle 4 Cuts sind interne Helper-Extraktionen — keine Konsument-Files werden angefasst. Begründung: die Helper werden ausschliesslich im Store-Body verwendet. (Im Gegensatz zu Bundle W, wo `GespeichertesErgebnis`-Type von einem Konsument importiert wurde.)

### uebungsStore.ts-Änderungen

- 4 neue Imports oben (siehe § 3).
- Z. 90–109 ersetzt durch Helper-Aufruf (~3 Z.).
- Z. 116–139 ersetzt durch Auth-Read + Helper-Aufruf (~5 Z., dynamic-import bleibt).
- Z. 263 + Z. 382 nutzen `istSelbstbewertbar(frage.typ)` statt Array-Inline-Literal.
- Z. 264–284 ersetzt durch Helper-Aufruf + Side-Effect-Block + `set()`-Call (~12 Z.).
- Public-Surface des `useUebenUebungsStore`-Hook unverändert.

---

## 3 · Datenfluss & Typ-Konsequenzen

### Import-Bewegungen (zusammenfassend)

**Aus uebungsStore.ts NEU IMPORTIERT (oben, ergänzend zu bestehenden Imports):**
```ts
import { istSelbstbewertbar } from '../../utils/ueben/fragetypGruppen'
import { erstelleSessionBlock } from '../../utils/ueben/sessionBlockBau'
import { pruefeClientseitig } from '../../utils/ueben/pruefeClientseitig'
import { ladeLoesungenViaPreload } from '../../utils/ueben/loesungsPreloadFetch'
```

Bestehende Imports aus Bundle W (`mergeLoesungen`, `ladeHistorie`, `speichereHistorie`, `MAX_HISTORIE`, `GespeichertesErgebnis`, `berechneErgebnisPure`) bleiben unverändert.

`pruefeAntwort` (aus `utils/ueben/korrektur`) bleibt — wird im Store-Body weiter im `beantworteById`-Pfad genutzt (Z. 216).

### Cut 1: `fragetypGruppen.ts` — `SELBSTBEWERTBARE_TYPEN` + `istSelbstbewertbar`

**Vorher (uebungsStore.ts, dupliziert):**
```ts
// Z. 263 (in pruefeAntwortJetzt):
const istSelbstbewertbar = ['freitext', 'visualisierung', 'pdf', 'audio', 'code'].includes(frage.typ)

// Z. 382 (in selbstbewertenById):
const istSelbstbewertbar = ['freitext', 'visualisierung', 'pdf', 'audio', 'code'].includes(basis.typ)
```

**Nachher (utils/ueben/fragetypGruppen.ts):**
```ts
import type { Frage } from '../../types/ueben/fragen'

/**
 * Frage-Typen, deren Antwort vom SuS selbst bewertet wird (anstatt automatisch
 * via Server gegen Musterlösung). Genutzt im Üben-Modus zur Pfad-Auswahl
 * (clientseitige Auto-Korrektur vs. Self-Assessment-UI).
 */
export const SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][] = [
  'freitext',
  'visualisierung',
  'pdf',
  'audio',
  'code',
]

export function istSelbstbewertbar(typ: Frage['typ']): boolean {
  return SELBSTBEWERTBARE_TYPEN.includes(typ)
}
```

**Nachher (uebungsStore.ts, beide Stellen):**
```ts
// Z. 263:
if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar(frage.typ)) {
  // ... fast-path body
}

// Z. 382:
const antwort = istSelbstbewertbar(basis.typ)
  ? ({ ...basis, selbstbewertung: bewertung } as Antwort)
  : basis
```

**Saving:** Inline-Variable Z. 263 entfällt (-1 Z.), Bedingung wird zur Helper-Aufruf-Form. Z. 382 analog. Netto-Saving: -3 Z. + 1 Import = **-2 Z.** (Hauptnutzen: DRY + Testability + Single-Source-of-Truth für die Liste).

### Cut 2: `sessionBlockBau.ts` — `erstelleSessionBlock`

**Vorher (uebungsStore.ts Z. 90–109, im starteSession-Body):**
```ts
const fortschritte = useUebenFortschrittStore.getState().fortschritte
const mastery: Record<string, MasteryStufe> = {}
for (const f of alleFragen) {
  mastery[f.id] = fortschritte[f.id]?.mastery || 'neu'
}

let block: Frage[]
if (modus === 'mix' && quellen) {
  block = erstelleMixBlock(alleFragen, quellen, { mastery })
} else if (modus === 'repetition') {
  const dauerBau = new Set<string>()
  for (const [id, fp] of Object.entries(fortschritte)) {
    if (istDauerbaustelle(fp.versuche, fp.richtig)) dauerBau.add(id)
  }
  block = erstelleRepetitionsBlock(alleFragen, mastery, dauerBau)
} else {
  block = erstelleBlock(alleFragen, thema, { mastery })
}
```

**Nachher (utils/ueben/sessionBlockBau.ts):**
```ts
import type { Frage } from '../../types/ueben/fragen'
import type { SessionModus, ThemaQuelle } from '../../types/ueben/uebung'
import type { MasteryStufe, FragenFortschritt } from '../../types/ueben/fortschritt'
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from './blockBuilder'
import { istDauerbaustelle } from './mastery'

interface ErstelleSessionBlockArgs {
  alleFragen: Frage[]
  fach: string
  thema: string
  modus: SessionModus
  quellen: ThemaQuelle[] | undefined
  fortschritte: Record<string, FragenFortschritt>
}

export function erstelleSessionBlock(
  args: ErstelleSessionBlockArgs,
): { block: Frage[]; mastery: Record<string, MasteryStufe> } {
  const { alleFragen, thema, modus, quellen, fortschritte } = args

  const mastery: Record<string, MasteryStufe> = {}
  for (const f of alleFragen) {
    mastery[f.id] = fortschritte[f.id]?.mastery || 'neu'
  }

  let block: Frage[]
  if (modus === 'mix' && quellen) {
    block = erstelleMixBlock(alleFragen, quellen, { mastery })
  } else if (modus === 'repetition') {
    const dauerBau = new Set<string>()
    for (const [id, fp] of Object.entries(fortschritte)) {
      if (istDauerbaustelle(fp.versuche, fp.richtig)) dauerBau.add(id)
    }
    block = erstelleRepetitionsBlock(alleFragen, mastery, dauerBau)
  } else {
    block = erstelleBlock(alleFragen, thema, { mastery })
  }

  return { block, mastery }
}
```

**Nachher (uebungsStore.ts, im starteSession-Body):**
```ts
const fortschritte = useUebenFortschrittStore.getState().fortschritte
const { block } = erstelleSessionBlock({
  alleFragen, fach, thema, modus, quellen, fortschritte,
})
```

**Default-Entscheidung Args-Shape:** Sowohl `fach`-Parameter (aktuell intern nicht genutzt — nur `thema`/`modus`/`quellen`) als auch `mastery`-Result-Field (Store-Body verwendet die Map aktuell nicht weiter) werden in Helper-Signature **standardmässig beibehalten**. Begründung:
1. **Args:** `fach` gehört semantisch zur "Session-Konfig" und macht Test-Cases lesbar (`erstelleSessionBlock({fach: 'wr', thema: 'Doppelte-Buchhaltung', modus: 'standard', ...})` ist klarer als ohne).
2. **Result:** `mastery`-Mit-Rückgabe macht Helper-Output-Shape vollständig + testbar (Test #5 prüft die mastery-Map direkt) — kostet 1 Zeile im Helper.

**Plan-Reviewer-Override:** Falls der Plan-Reviewer YAGNI flaggt (`fach` ist tot oder `mastery`-Field unbenutzt), können beide entfernt werden — neutral für Korrektheit, Tests müssen dann angepasst werden. Default in Plan = Beibehalten.

**Saving:** Z. 91–109 entfallen (~19 Z.) → ersetzt durch 4 Z. Helper-Aufruf. Netto: **-15 Z.** + 1 Import = **-14 Z.**

### Cut 3: `pruefeClientseitig.ts` — `pruefeClientseitig`

**Vorher (uebungsStore.ts Z. 264–284, im pruefeAntwortJetzt-Body):**
```ts
if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar(frage.typ)) {
  const korrekt = pruefeAntwort(frage, normalized)
  if (!session.freiwillig) {
    useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, korrekt, session.id)
  }
  set({
    session: {
      ...session,
      antworten: { ...session.antworten, [frageId]: normalized },
      ergebnisse: { ...session.ergebnisse, [frageId]: korrekt },
      score: session.score + (korrekt ? 1 : 0),
    },
    speichertPruefung: false,
    pruefFehler: null,
    feedbackSichtbar: true,
    letzteAntwortKorrekt: korrekt,
    letzteMusterloesung: frage.musterlosung ?? null,
  })
  return
}
```

**Nachher (utils/ueben/pruefeClientseitig.ts):**
```ts
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import type { UebungsSession } from '../../types/ueben/uebung'
import { pruefeAntwort } from './korrektur'

interface PruefeClientseitigArgs {
  session: UebungsSession
  frage: Frage
  normalized: Antwort
}

export interface PruefeClientseitigResult {
  korrekt: boolean
  sessionUpdates: Pick<UebungsSession, 'antworten' | 'ergebnisse' | 'score'>
  letzteMusterloesung: string | null
}

/**
 * Clientseitige Korrektur via Pre-Load-Lösung (Bundle Ü-Pfad).
 * Reine Berechnung — Side-Effects (Fortschritt-Tracking, set()-Call) bleiben im Store-Action.
 */
export function pruefeClientseitig(args: PruefeClientseitigArgs): PruefeClientseitigResult {
  const { session, frage, normalized } = args
  const korrekt = pruefeAntwort(frage, normalized)
  return {
    korrekt,
    sessionUpdates: {
      antworten: { ...session.antworten, [frage.id]: normalized },
      ergebnisse: { ...session.ergebnisse, [frage.id]: korrekt },
      score: session.score + (korrekt ? 1 : 0),
    },
    letzteMusterloesung: frage.musterlosung ?? null,
  }
}
```

**Nachher (uebungsStore.ts, im pruefeAntwortJetzt-Body):**
```ts
if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar(frage.typ)) {
  const result = pruefeClientseitig({ session, frage, normalized })
  if (!session.freiwillig) {
    useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, result.korrekt, session.id)
  }
  set({
    session: { ...session, ...result.sessionUpdates },
    speichertPruefung: false,
    pruefFehler: null,
    feedbackSichtbar: true,
    letzteAntwortKorrekt: result.korrekt,
    letzteMusterloesung: result.letzteMusterloesung,
  })
  return
}
```

**Hinweis zur Side-Effect-Aufteilung:** Der Helper bleibt rein-funktional. Die Fortschritt-Side-Effect (`useUebenFortschrittStore.getState().antwortVerarbeiten`) bleibt **explizit** im Store-Action, weil:
1. Cross-Store-Calls sollen sichtbar im Store-Body bleiben (nicht in pure utils versteckt).
2. Der Helper wird Vitest-tetbar ohne Mock-Setup für `useUebenFortschrittStore`.

**Saving:** Z. 264–284 (21 Z. inkl. fast-path-Body) ersetzt durch 12 Z. neuen Body. Netto: **-9 Z.** + 1 Import = **-8 Z.**

(Korrektur zur ursprünglichen Schätzung von -22 Z.: der `if (!session.freiwillig)`-Block + `set()`-Call bleiben nötig im Store-Action, lediglich die innere `pruefeAntwort`-Computation + sessionUpdates wandern. Kleinere Saving als initial geplant — siehe § 8 Risiken.)

### Cut 4: `loesungsPreloadFetch.ts` — `ladeLoesungenViaPreload`

**Vorher (uebungsStore.ts Z. 116–139, im starteSession-Body):**
```ts
let loesungen: LoesungsMap = {}
try {
  const { useUebenAuthStore } = await import('./authStore')
  const user = useUebenAuthStore.getState().user
  if (user?.sessionToken) {
    const fragenIds = block.map((f) => f.id)
    for (const f of block) {
      const ta = (f as Frage & { teilaufgaben?: Frage[] }).teilaufgaben
      if (Array.isArray(ta)) for (const t of ta) fragenIds.push(t.id)
    }
    loesungen = await ladeLoesungenApi({
      gruppeId,
      fragenIds,
      email: user.email,
      token: user.sessionToken,
      fachbereich: fach,
    })
  }
} catch (e) {
  console.warn('[uebungsStore] Lösungs-Preload fehlgeschlagen:', e)
}
```

**Nachher (utils/ueben/loesungsPreloadFetch.ts):**
```ts
import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsMap } from '../../types/ueben/loesung'
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'

interface LadeLoesungenViaPreloadArgs {
  block: Frage[]
  gruppeId: string
  fachbereich: string
  user: { email: string; sessionToken: string } | null
}

/**
 * Lädt Musterlösungen aller Fragen (inkl. Teilaufgaben) im Block via separatem
 * Endpoint (Bundle Ü). Bei fehlendem User oder API-Fehler: leere Map zurück
 * (Caller fällt auf Server-Korrektur pro Frage zurück).
 */
export async function ladeLoesungenViaPreload(
  args: LadeLoesungenViaPreloadArgs,
): Promise<LoesungsMap> {
  const { block, gruppeId, fachbereich, user } = args
  if (!user?.sessionToken) return {}

  const fragenIds = block.map((f) => f.id)
  for (const f of block) {
    const ta = (f as Frage & { teilaufgaben?: Frage[] }).teilaufgaben
    if (Array.isArray(ta)) for (const t of ta) fragenIds.push(t.id)
  }

  try {
    return await ladeLoesungenApi({
      gruppeId,
      fragenIds,
      email: user.email,
      token: user.sessionToken,
      fachbereich,
    })
  } catch (e) {
    console.warn('[uebungsStore] Lösungs-Preload fehlgeschlagen:', e)
    return {}
  }
}
```

**Nachher (uebungsStore.ts, im starteSession-Body):**
```ts
const { useUebenAuthStore } = await import('./authStore')
const user = useUebenAuthStore.getState().user ?? null
const loesungen = await ladeLoesungenViaPreload({
  block, gruppeId, fachbereich: fach, user,
})
```

**Hinweis zum dynamic-import:** Der `await import('./authStore')` bleibt **explizit im Store-Body** (nicht im Helper), weil dynamic-imports auf andere Stores idiomatisch zum Store-Pattern gehören und nicht in pure utils versteckt werden sollten. Der Helper bekommt `user` als Parameter — clean Dependency-Injection.

**Saving:** Z. 116–139 (24 Z.) ersetzt durch 5 Z. Block. Netto: **-19 Z.** + 1 Import = **-18 Z.**

### Cut-Saving-Total

| Cut | Saving (Body) | Import-Kosten | Netto |
|---|---|---|---|
| 1 (`fragetypGruppen`) | -3 Z. | +1 Z. | **-2 Z.** |
| 2 (`sessionBlockBau`) | -15 Z. | +1 Z. | **-14 Z.** |
| 3 (`pruefeClientseitig`) | -9 Z. | +1 Z. | **-8 Z.** |
| 4 (`loesungsPreloadFetch`) | -19 Z. | +1 Z. | **-18 Z.** |
| **Total** | **-46 Z.** | **+4 Z.** | **-42 Z.** |

**Erwarteter Endwert: 540 - 42 = 498 Z.** ⚠️

**Kritische Re-Evaluation:** Die initiale Schätzung von 481 Z. war zu optimistisch (Cut 3 spart -8 statt -22, weil Side-Effect-Aufteilung Code im Store-Action belässt). Mit 498 Z. landen wir **knapp** unter der 500-Schwelle (2 Z. Margin) — rein technisch erfolgreich, aber Margin sehr eng.

**Mitigation für robustere Margin:** Falls Reviewer/User nach Code-Review konkretere Saving-Schätzung wünscht, oder Margin zu eng erscheint: Cut 5 (Server-Response-Verarbeitung Z. 326–363, ~10 Z. Saving) als optional in Plan einplanen, vor Final-Verify-Step entscheiden basierend auf tatsächlich gemessener Zeilenzahl nach Cuts 1–4.

**Empfehlung in Spec:** Cuts 1–4 implementieren, dann **`wc -l` messen**. Bei <495 Z.: ✅ done. Bei 495–500 Z.: Cut 5 nachschieben (Server-Response). Bei >500 Z.: Plan-Reviewer + User konsultieren.

---

## 4 · Test-Strategie

### `fragetypGruppen.test.ts` — 3 Vitest-Cases

| # | Test-Fall |
|---|---|
| 1 | `istSelbstbewertbar('freitext')` → `true` (Sammel-Test alle 5 Selbst-Typen) |
| 2 | `istSelbstbewertbar('mc')` → `false` (Sammel-Test nicht-Selbst-Typen) |
| 3 | `SELBSTBEWERTBARE_TYPEN` ist `readonly` (TypeScript compile-time + as-const-Spread-Test) |

### `sessionBlockBau.test.ts` — 6 Vitest-Cases

| # | Test-Fall |
|---|---|
| 1 | `modus='standard'` → ruft `erstelleBlock` mit korrektem `thema` + `mastery` |
| 2 | `modus='mix'` mit `quellen` → ruft `erstelleMixBlock` |
| 3 | `modus='repetition'` mit Dauerbaustellen-Frage in `fortschritte` → `dauerBau`-Set enthält Frage-ID |
| 4 | `modus='repetition'` ohne Dauerbaustellen → leeres `dauerBau`-Set, `erstelleRepetitionsBlock` aufgerufen |
| 5 | `mastery`-Map wird aus `fortschritte[id].mastery` gefüllt; fehlende IDs default `'neu'` |
| 6 | Leere `alleFragen[]` → leerer Block, leere mastery-Map (kein Crash) |

**Setup:** Mock `erstelleBlock`/`erstelleMixBlock`/`erstelleRepetitionsBlock` via `vi.mock('./blockBuilder')`. Mock `istDauerbaustelle` via `vi.mock('./mastery')`. `afterEach`: `vi.restoreAllMocks()` (Bundle-W-Pattern).

### `pruefeClientseitig.test.ts` — 5 Vitest-Cases

| # | Test-Fall |
|---|---|
| 1 | `pruefeAntwort` returns `true` → result.korrekt: true, sessionUpdates.score = old + 1 |
| 2 | `pruefeAntwort` returns `false` → result.korrekt: false, score unverändert |
| 3 | `frage.musterlosung` gesetzt → `letzteMusterloesung` propagiert |
| 4 | `frage.musterlosung` undefined → `letzteMusterloesung: null` |
| 5 | `sessionUpdates.antworten` und `.ergebnisse` enthalten neuen frageId-Eintrag (immutable spread) |

**Setup:** Mock `pruefeAntwort` via `vi.mock('./korrektur')`. Mock-Frage: `{ id: 'q1', typ: 'mc', musterlosung: 'A' } as unknown as Frage` (Bundle T-Pattern).

### `loesungsPreloadFetch.test.ts` — 4 Vitest-Cases

| # | Test-Fall |
|---|---|
| 1 | `user: null` → returns `{}` ohne API-Call (early-return) |
| 2 | `user.sessionToken` gesetzt + API success → returns LoesungsMap; `ladeLoesungenApi` aufgerufen mit `block.map(f.id)` |
| 3 | Block enthält Frage mit `teilaufgaben` → `fragenIds` enthält sowohl Top-Level-IDs als auch Teilaufgaben-IDs |
| 4 | API wirft Error → returns `{}` + `console.warn` aufgerufen |

**Setup:** Mock `ladeLoesungenApi` via `vi.mock('../../services/uebenLoesungsApi')`. Spy auf `console.warn` für Test #4.

### Drift + Lint-Gates pro Phase

| Phase | Vitest-Drift | Cumulativ |
|---|---|---|
| Phase 1 (`fragetypGruppen` + 2 Use-Site-Edits) | +3 | 1454 → 1457 |
| Phase 2 (`sessionBlockBau` + starteSession-Edit) | +6 | 1457 → 1463 |
| Phase 3 (`pruefeClientseitig` + pruefeAntwortJetzt-Edit) | +5 | 1463 → 1468 |
| Phase 4 (`loesungsPreloadFetch` + starteSession-Edit) | +4 | 1468 → 1472 |

Pro Phase grün: `tsc -b`, `vite build`, 4 Lint-Gates (`lint:as-any`, `lint:no-alert`, `lint:no-tests-dir`, `lint:musterloesung`).

**`wc -l uebungsStore.ts` Tracking pro Phase:**
- P1 Ende: 540 - 2 = 538 Z.
- P2 Ende: 538 - 14 = 524 Z.
- P3 Ende: 524 - 8 = 516 Z.
- P4 Ende: 516 - 18 = **498 Z.** (Margin 2 unter 500 — siehe § 3 Mitigation falls darüber)

---

## 5 · Phasen-Plan

### Phase 1 — `fragetypGruppen.ts` extrahieren + 2 Use-Sites umstellen

**Schritte:**
1. Erstelle `ExamLab/src/utils/ueben/fragetypGruppen.ts` mit `SELBSTBEWERTBARE_TYPEN` + `istSelbstbewertbar(typ)`.
2. Erstelle `ExamLab/src/utils/ueben/fragetypGruppen.test.ts` — 3 Vitest-Cases.
3. Edit `ExamLab/src/store/ueben/uebungsStore.ts`:
   - Import oben hinzufügen: `import { istSelbstbewertbar } from '../../utils/ueben/fragetypGruppen'`.
   - Z. 263 Inline-Variable + Use-Site umstellen auf `!istSelbstbewertbar(frage.typ)`.
   - Z. 382 Inline-Variable + Use-Site umstellen auf `istSelbstbewertbar(basis.typ)`.
4. **Verify:** `npm run typecheck` (tsc -b output direkt prüfen, Memory-Lehre `feedback_tsc_b_exit_misleading`), `npm test` +3 vitest, 4 Lint-Gates clean, `npm run build` clean. **`wc -l uebungsStore.ts` ≤ 538.**
5. **Per-Phase-Reviewer:** spec-compliance + code-quality APPROVED.

### Phase 2 — `sessionBlockBau.ts` extrahieren

**Schritte:**
1. Erstelle `ExamLab/src/utils/ueben/sessionBlockBau.ts` mit `erstelleSessionBlock(args) → { block, mastery }`.
2. Erstelle `ExamLab/src/utils/ueben/sessionBlockBau.test.ts` — 6 Vitest-Cases.
3. Edit `ExamLab/src/store/ueben/uebungsStore.ts`:
   - Import oben hinzufügen.
   - Z. 90–109 ersetzen durch `fortschritte`-Read + `erstelleSessionBlock`-Aufruf + `block`-Destructure (~4 Z.).
   - Imports `MasteryStufe` + `erstelleBlock`/`erstelleMixBlock`/`erstelleRepetitionsBlock`/`istDauerbaustelle` aus uebungsStore.ts entfernen, **falls** keine andere Store-Stelle sie nutzt (`grep`-Verifikation nach Edit).
4. **Verify:** tsc -b clean, +6 vitest, 4 Lint-Gates clean, vite build clean. **`wc -l uebungsStore.ts` ≤ 524.**
5. **Per-Phase-Reviewer** APPROVED.

### Phase 3 — `pruefeClientseitig.ts` extrahieren

**Schritte:**
1. Erstelle `ExamLab/src/utils/ueben/pruefeClientseitig.ts` mit pure `pruefeClientseitig(args) → PruefeClientseitigResult`.
2. Erstelle `ExamLab/src/utils/ueben/pruefeClientseitig.test.ts` — 5 Vitest-Cases.
3. Edit `ExamLab/src/store/ueben/uebungsStore.ts`:
   - Import oben hinzufügen.
   - Z. 264–284 ersetzen durch Helper-Aufruf + Side-Effect-Block + `set()`-Call (~12 Z.).
4. **Verify:** tsc -b clean, +5 vitest, 4 Lint-Gates clean. `pruefeAntwort`-Import bleibt im Store (Z. 9), wird weiter in `beantworteById` genutzt (Z. 216). **`wc -l uebungsStore.ts` ≤ 516.**
5. **Per-Phase-Reviewer** APPROVED.

### Phase 4 — `loesungsPreloadFetch.ts` extrahieren

**Schritte:**
1. Erstelle `ExamLab/src/utils/ueben/loesungsPreloadFetch.ts` mit `async ladeLoesungenViaPreload(args) → Promise<LoesungsMap>`.
2. Erstelle `ExamLab/src/utils/ueben/loesungsPreloadFetch.test.ts` — 4 Vitest-Cases.
3. Edit `ExamLab/src/store/ueben/uebungsStore.ts`:
   - Import oben hinzufügen.
   - Z. 116–139 ersetzen durch dynamic-import + Helper-Aufruf (~5 Z.).
   - `ladeLoesungenApi`-Import aus uebungsStore.ts entfernen, falls keine andere Store-Stelle ihn nutzt (`grep`-Verifikation).
   - `LoesungsMap`-Type-Import bleibt (wird woanders im Store verwendet — `grep`-Verifikation).
4. **Verify:** tsc -b clean, +4 vitest, 4 Lint-Gates clean, vite build clean. **`wc -l uebungsStore.ts` ≤ 500** (Ziel; bei knapper Margin Cut 5 erwägen siehe § 3).
5. **Per-Phase-Reviewer** APPROVED.

### Phase 5 — Final Verification + Merge

1. **Final Code-Reviewer** auf gesamte Branch APPROVED FOR MERGE.
2. Browser-E2E auf staging mit echtem SuS-Login (siehe § 6).
3. `HANDOFF.md` Bundle-W.b-Eintrag schreiben (analog Bundle V/U/W-Format).
4. Vor Force-Push prüfen: `git log preview ^bundle-w-b/uebungsstore-state-refactor` (Memory-Lehre `feedback_preview_forcepush.md`).
5. `git push --force-with-lease origin bundle-w-b/uebungsstore-state-refactor:preview` (Memory-Lehre Bundle N: SW unregister + caches.delete + reload vor E2E).
6. Merge `bundle-w-b/uebungsstore-state-refactor` → main.
7. Branch lokal+remote löschen.

---

## 6 · Browser-E2E

10 Pfade auf staging mit echtem SuS-Login (Memory-Lehre `feedback_echte_logins.md`: keine Demo-Modi). SW-Cache vorab via `caches.delete()` + `unregister()` + reload zurücksetzen.

| # | Pfad | Stresst Cut |
|---|---|---|
| 1 | SuS-Login + Üben-Dashboard rendert (5 Tabs) | Smoke (Hotspot ohne Errors) |
| 2 | Übungs-Session starten (`modus='standard'`) | `erstelleSessionBlock` (P2) + `ladeLoesungenViaPreload` (P4) |
| 3 | Übungs-Session starten (`modus='mix'` mit 2 Quellen) | `erstelleSessionBlock` mix-Branch (P2) |
| 4 | Übungs-Session starten (`modus='repetition'` mit Dauerbaustellen) | `erstelleSessionBlock` repetition-Branch (P2) |
| 5 | MC-Frage instant-beantworten (preload-Pfad) | `pruefeClientseitig` (P3), `istSelbstbewertbar` Use-Site (P1) |
| 6 | Selbstbewertung Freitext (server-Pfad ohne preload) | `istSelbstbewertbar`-Branch (P1), Server-Pfad bleibt unverändert |
| 7 | Übung beenden + Zusammenfassung sichtbar | Bundle-W `berechneErgebnis` (Smoke) |
| 8 | Verbindungsproblem (Server-API offline simulieren) → Pre-Load schlägt fehl | `ladeLoesungenViaPreload` catch-Pfad (P4): Block läuft trotzdem mit leerer LoesungsMap |
| 9 | Frage mit Teilaufgaben starten (Aufgabengruppe) | `ladeLoesungenViaPreload` teilaufgaben-Branch (P4) |
| 10 | 0 Console-Errors-Check (cross-cutting) | Cross-cutting |

**Mindest-Manual bei Auto-E2E-Block** (Bundle V Lehre): Pfade 1+2+5+6+10. Vitest-Coverage (18 neue Tests + 2 bestehende Store-Tests) als Sicherungsnetz für Pfade 3,4,7,8,9.

---

## 7 · Definition of Done

### Pro Phase
- [ ] Vitest grün mit Drift exakt wie geplant (P1+3, P2+6, P3+5, P4+4)
- [ ] tsc -b clean (Output direkt geprüft, Memory-Lehre `feedback_tsc_b_exit_misleading`)
- [ ] 4 Lint-Gates clean: `lint:as-any` / `lint:no-alert` / `lint:no-tests-dir` / `lint:musterloesung`
- [ ] vite build erfolgreich (~3s, PWA generateSW OK)
- [ ] Per-Phase Spec-Compliance-Reviewer + Code-Quality-Reviewer APPROVED
- [ ] `wc -l uebungsStore.ts` entspricht Tracking-Wert pro Phase (siehe § 4)

### Final
- [ ] Final Code-Reviewer (Branch komplett) APPROVED FOR MERGE
- [ ] `uebungsStore.ts` ≤ 500 Zeilen (≤ 498 erwartet; bei 495–500 Cut 5 erwogen; siehe § 3)
- [ ] Hotspot-Bilanz Files >500 Z.: 10 → 9
- [ ] Browser-E2E Mindest-Pfade 1+2+5+6+10 ✅ mit echtem SuS-Login
- [ ] HANDOFF.md `Bundle W.b` Eintrag mit Verifikation, Lehren, Spawn-Tasks
- [ ] 2 bestehende Tests grün: `uebungsStoreLoesungsPreload.test.ts` + `uebungsStorePruefen.test.ts`
- [ ] **Bundle-W-Spawn-Task `istSelbstbewertbar`** abgeschlossen (Cut 1) — Memory-Eintrag `project_bundle_w_komplett.md` aktualisieren

---

## 8 · Risiken & Mitigationen

| Risiko | L | I | Mitigation |
|---|---|---|---|
| Endwert >500 Z. (Margin <2 zu eng) | mittel | hoch | Pro-Phase `wc -l`-Tracking in DoD; Cut 5 (Server-Response, ~10 Z.) als Reserve in § 3 dokumentiert |
| `pruefeClientseitig` ändert subtil sessionUpdate-Spread-Order (Antwort wird überschrieben) | niedrig | hoch | byte-identische Spread-Reihenfolge in Helper; Test #5 prüft `sessionUpdates.antworten` enthält neuen Eintrag |
| `erstelleSessionBlock` ändert subtil mastery-Default (`'neu'` vs. anderer Wert) | niedrig | mittel | byte-identische `\|\| 'neu'`-Logik; Test #5 prüft fehlende ID → `'neu'` |
| `ladeLoesungenViaPreload` catch-Branch verändert Behaviour bei API-Error | niedrig | hoch | byte-identischer `console.warn` + `return {}`; Test #4 |
| Helper-Args-Object-Destructuring vs. Positional-Args bricht type inference | niedrig | mittel | Args-Interface explizit deklariert; tsc -b blockt Merge |
| Side-Effect (`fortschritt.antwortVerarbeiten`) versehentlich in Helper migriert | niedrig | hoch | § 3 Cut 3 dokumentiert ausdrücklich Side-Effect-Aufteilung; Test setzt KEIN fortschrittStore-Mock auf |
| Dynamic-Import (`./authStore`) versehentlich in Helper migriert | niedrig | mittel | § 3 Cut 4 dokumentiert ausdrücklich; Helper-Signature nimmt `user` als Parameter |
| Bestehende `uebungsStorePruefen.test.ts` bricht (z.B. Test mockt `pruefeAntwort` direkt) | niedrig | hoch | Tests laufen pro Phase; Cut 3 macht `pruefeAntwort` weiterhin direkt importierbar in Bestandstest |
| Browser-E2E pre-existing Auto-Block (Bundle V Lehre) | mittel | niedrig | Vitest-Coverage als Sicherungsnetz; Mindest-Manual reicht |
| `LoesungsMap`-Type-Import in store nach Cut 4 nicht mehr genutzt → unused-import-Lint | niedrig | niedrig | grep-Verifikation in Phase 4 Step 3 |

---

## 9 · Out-of-Scope / Spawn-Tasks (für nächste Sessions)

- **Test-Migration:** `src/tests/uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts` zu co-located (`store/ueben/uebungsStore*.test.ts`) verschieben — analog Bundle Q-Heuristik B. Bundle W hat den Spawn-Task notiert; bleibt nach Bundle W.b weiter offen.
- **Final-Code-Reviewer-Pass für Bundle W:** Wenn Org-Usage-Limit zurückgesetzt ist. Bundle W endete im Self-Review-Modus.
- **Server-Response-Verarbeitung Cut (optional Cut 5):** `pruefeAntwortJetzt` Z. 326–363 (~10 Z. Saving). Reserve falls Bundle-W.b-Margin nach P4 zu eng (siehe § 3).
- **Future-Hotspot-Roadmap:** Nach Bundle W.b ist Phase-4-Audit (Hoch-Risiko-Files) plus dieser Folge-Cut abgeschlossen. Hotspot-Bilanz von ursprünglich 17 (vor Bundle S) auf 9 reduziert. Phase-5-Scoping (z.B. weitere Komponenten-Cuts oder andere Dimensionen aus Vereinfachungs-Audit) offen.

### Begründung Bundle-W-Spawn-Task `istSelbstbewertbar` jetzt eingebündelt (statt separater Session)

Bundle W spec § 9 markierte die Konstante als Spawn-Task mit Begründung "Domain-Bezug 'Frage-Typ-Klassifikation' passt nicht zu den 3 Hauptcuts". Bundle W's Cuts waren `loesungsMerge`/`historie`/`ergebnisBerechnung` — pure data-logic. Bundle W.b's Cut 3 (`pruefeClientseitig`) **nutzt die Konstante intern**: ohne vorherige Extraktion müsste der Helper-Aufruf-Site weiter Inline-Array-Literal nutzen oder den Helper auf Side-Effect-Pfad mitnehmen. Saubere Sequenz: Konstante in Cut 1 zuerst extrahieren, Cut 3 nutzt sie von Anfang an.

---

## Anhang A — Konsumenten-Surface vor/nach Cut

**Unverändert** für alle 7 React-Konsumenten:
- `AppUeben.tsx`, `Dashboard.tsx`, `UebungsScreen.tsx`, `UebungsEinsicht.tsx`, `Zusammenfassung.tsx`, `AppShell.tsx`, `useFrageAdapter.ts`

Public-API von `useUebenUebungsStore` ist byte-identisch. Alle 4 Cuts sind interne Helper-Extraktionen. Kein Caller-Edit notwendig.

---

## Anhang B — Vergleich Bundle W vs. Bundle W.b Cut-Strategien

| Aspekt | Bundle W (gemerged 2026-05-08) | Bundle W.b (diese Spec) |
|---|---|---|
| Quelle | uebungsStore.ts 684 Z. | uebungsStore.ts 540 Z. |
| Ziel | ≤ 540 Z. ✅ erreicht | ≤ 500 Z. (Margin 2) |
| Cuts | 3 Pure-Data (loesungsMerge / historie / ergebnisBerechnung) | 3 Pure-Logic + 1 Konstante (sessionBlockBau / pruefeClientseitig / loesungsPreloadFetch + fragetypGruppen) |
| Caller-Edits | 1 (`UebungsEinsicht.tsx`) | 0 |
| Vitest-Drift | +24 | +18 |
| Side-Effect-Aufteilung | Keine (alle Cuts pure) | Cut 3 explizit (fortschritt.antwortVerarbeiten bleibt im Store-Action) |
| Async-Helper | Keine | Cut 4 (`ladeLoesungenViaPreload`) async-aber-pure |
| Hotspot-Bilanz-Beitrag | 0 (uebungsStore blieb >500) | 1 (uebungsStore <500 ✅) |
