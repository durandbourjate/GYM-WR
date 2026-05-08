# Bundle W — uebungsStore Pure-Logic-Cut

**Datum:** 2026-05-08
**Branch (geplant):** `bundle-w/uebungsstore-cuts`
**Phase:** 4 (Hoch-Risiko-Files aus Vereinfachungs-Audit)
**Sub-Bundle:** 3/3 der Phase-4-Hoch-Risiko-Trio (nach Bundle U `useDrawingEngine`, Bundle V `PDFSeite`)

---

## 1 · Kontext & Ziel

### Target-Datei
`ExamLab/src/store/ueben/uebungsStore.ts` — **684 Zeilen**, Hoch-Risiko (Lösungs-Merge im Korrektur-Pfad + Server-Korrektur-Auto-Retry + Session-Historien-Persistenz).

### Logische Bereiche im File
| Zeilen | Bereich | Charakter |
|---|---|---|
| 18–102 | `mergeLoesungInFrage` + `mergeLoesungen` (~85 Z.) | **Pure**, hoch testbar |
| 104–134 | Historien-Persistenz: Type `GespeichertesErgebnis` + `HISTORIE_KEY` + `MAX_HISTORIE` + `ladeHistorie` + `speichereHistorie` (~30 Z.) | **Pure** + localStorage-IO |
| 136–173 | `UebungsState`-Interface (~38 Z.) | Type-Definition (bleibt) |
| 175–684 | Store-Body mit 18 Aktionen (~510 Z.) | Stateful (Zustand) (bleibt) |

### Konsumenten-Surface
7 React-Konsumenten des Stores:
- `AppUeben.tsx`, `Dashboard.tsx`, `UebungsScreen.tsx`, `UebungsEinsicht.tsx`, `Zusammenfassung.tsx`, `AppShell.tsx`, `useFrageAdapter.ts`

### Bestehende Test-Files (bleiben grün, Korrektheits-Backup)
- `src/tests/uebungsStoreLoesungsPreload.test.ts` — testet `starteSession` + `loesungenPreloaded`-Map (deckt `mergeLoesungen` indirekt ab)
- `src/tests/uebungsStorePruefen.test.ts` — testet `pruefeAntwortJetzt`-Pfad (deckt `mergeLoesungInFrage`-Output indirekt ab)

### Ziel-Metriken
- `uebungsStore.ts` schrumpft **684 → ~535 Zeilen** (gerade aus Hotspot raus, >500-Schwelle Master-Spec).
- Hotspot-Bilanz Files >500 Z. (ohne `data/`+`test/`): **10 → 9**.
- Damit ist das **letzte Hoch-Risiko-File** der Audit-Phase 4 abgeschlossen.

---

## 2 · Architektur & Files

### Cut-Strategie: Pure-Logic-Cut (Bundle U/V-Stil)

Reine Logik wandert in pure Files unter `utils/ueben/`. Der Zustand-Store bleibt einer (kein Slice-Pattern), Konsumenten-Surface unverändert (bis auf 1 Type-Import-Pfad).

### 3 neue Pure-Logic-Files

Alle in `ExamLab/src/utils/ueben/` — konsistent zu existierenden Pure-Modulen wie `korrektur.ts`, `mastery.ts`, `fragetext.ts`, `blockBuilder.ts`.

| Datei | Zeilen ca. | Quelle | Inhalt |
|---|---|---|---|
| `loesungsMerge.ts` | ~85 | uebungsStore.ts Z. 18–102 | `mergeLoesungInFrage(frage, slice) → Frage` + `mergeLoesungen(fragen, loesungen) → { fragen, preloaded }` byte-identisch |
| `historie.ts` | ~40 | uebungsStore.ts Z. 104–134 | `export type GespeichertesErgebnis` + `HISTORIE_KEY` + `MAX_HISTORIE` + `ladeHistorie()` + `speichereHistorie(historie)` byte-identisch |
| `ergebnisBerechnung.ts` | ~35 | uebungsStore.ts Z. 625–653 | Pure `berechneErgebnis(session: UebungsSession \| null) → SessionErgebnis` |

### 3 neue Test-Files (alle co-located)

Co-located neben Source — analog Bundle U/V (`drawingReducer.test.ts` neben `drawingReducer.ts`).

| Datei | Vitest-Cases |
|---|---|
| `utils/ueben/loesungsMerge.test.ts` | 12 |
| `utils/ueben/historie.test.ts` | 5 |
| `utils/ueben/ergebnisBerechnung.test.ts` | 7 |
| **Vitest-Drift gesamt** | **+24** (Baseline 1430 → 1454) |

### 1 Caller-Edit ausserhalb des Stores

`ExamLab/src/components/ueben/UebungsEinsicht.tsx` Z. 2:
```diff
- import { useUebenUebungsStore, type GespeichertesErgebnis } from '../../store/ueben/uebungsStore'
+ import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
+ import { type GespeichertesErgebnis } from '../../utils/ueben/historie'
```

Begründung: Der Type wandert mit dem Owner (`historie.ts`). Konsument importiert direkt vom Owner. Kein Re-Export-Smell im Store. Bundle U Lehre: „Dead-Surface-Removal statt Re-Export-Stub".

### uebungsStore.ts-Änderungen

- 3 neue Imports oben (siehe § 3).
- Z. 18–102, 104–134, 625–653 entfernt.
- Store-Action `berechneErgebnis` wird zum 1-Zeiler-Delegator.
- Public-Surface des `useUebenUebungsStore`-Hook unverändert.

---

## 3 · Datenfluss & Typ-Konsequenzen

### Import-Bewegungen (zusammenfassend)

**Aus uebungsStore.ts ENTFERNT (Imports oben):**
```ts
import { getFragetext } from '../../utils/ueben/fragetext'    // wandert nach ergebnisBerechnung.ts
```
(Andere oben aufgeführten Imports bleiben, da der Store-Body weiter z.B. `Frage`, `Antwort`, `LoesungsMap`, `UebungsSession` braucht.)

**Aus uebungsStore.ts NEU IMPORTIERT (oben):**
```ts
import { mergeLoesungen } from '../../utils/ueben/loesungsMerge'
import {
  ladeHistorie,
  speichereHistorie,
  MAX_HISTORIE,
  type GespeichertesErgebnis,
} from '../../utils/ueben/historie'
import { berechneErgebnis as berechneErgebnisPure } from '../../utils/ueben/ergebnisBerechnung'
```

### Naming-Konflikt-Klärung (kritische Subtilität)

#### `ladeHistorie` (Top-Level vs. Store-Action)

Im aktuellen File gibt es ZWEI `ladeHistorie`:
1. **Top-Level-Funktion** Z. 120 (`function ladeHistorie(): GespeichertesErgebnis[] { ... }`) → wandert nach `historie.ts`.
2. **Store-Action** Z. 608 (`ladeHistorie: () => { set({ historie: ladeHistorie() }) }`) → bleibt im Store-Body.

Im Action-Body Z. 608 wird `ladeHistorie()` durch JavaScript-Scoping als die **Top-Level-Funktion** aufgelöst (Closure auf Modul-Scope), nicht als Store-Action-Selbstreferenz. Nach Cut wird `ladeHistorie` aus dem Import oben aufgelöst — gleicher Effekt, byte-identisch funktional.

**Spec-Anforderung an Implementer:** Import `ladeHistorie` (nicht aliased) im Store-File einführen. Reviewer prüft Scope-Auflösung.

#### `berechneErgebnis` (Top-Level vs. Store-Action)

Hier wäre Shadow-Konflikt destruktiv: Wenn die pure Function unter Namen `berechneErgebnis` importiert würde, bliebe der Store-Action-Body `() => berechneErgebnis(get().session)` ambig. **Aliased-Import zwingend:**

```ts
import { berechneErgebnis as berechneErgebnisPure } from '../../utils/ueben/ergebnisBerechnung'
```

Store-Action-Body delegiert klar:
```ts
berechneErgebnis: () => berechneErgebnisPure(get().session),
```

### Kontrollfluss `berechneErgebnis` (vorher → nachher)

**Vorher** (uebungsStore.ts Z. 625–653, Store-Action mit no-arg-Signatur):
```ts
berechneErgebnis: () => {
  const session = get().session
  if (!session) return { sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [] }
  const details = session.fragen.map(f => ({ ... }))
  const richtig = details.filter(d => d.korrekt).length
  const falsch = details.filter(d => !d.korrekt && !d.uebersprungen).length
  const dauer = session.beendet
    ? new Date(session.beendet).getTime() - new Date(session.gestartet).getTime()
    : Date.now() - new Date(session.gestartet).getTime()
  return { sessionId: session.id, anzahlFragen: session.fragen.length, richtig, falsch, quote: ..., dauer, details }
},
```

**Nachher** (`utils/ueben/ergebnisBerechnung.ts`, pure):
```ts
import type { Frage } from '../../types/ueben/fragen'
import type { UebungsSession, SessionErgebnis } from '../../types/ueben/uebung'
import { getFragetext } from './fragetext'

export function berechneErgebnis(session: UebungsSession | null): SessionErgebnis {
  if (!session) return { sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [] }
  // … byte-identischer Body wie vorher …
  return { sessionId: session.id, anzahlFragen: session.fragen.length, richtig, falsch, quote, dauer, details }
}
```

**Nachher** (uebungsStore.ts Store-Action, 1-Zeiler-Delegator):
```ts
berechneErgebnis: () => berechneErgebnisPure(get().session),
```

Konsumenten-Surface (`Zusammenfassung.tsx` ruft `berechneErgebnis()` no-arg) **unverändert**. `beendeSession` Store-Aktion ruft intern weiter `get().berechneErgebnis()` (Store-Action) — auch unverändert.

### `historie`-Initialwert + `beendeSession`-Aufruf

Aktueller Store-Body Z. 184 (`historie: ladeHistorie()`) und Z. 673–675 (`speichereHistorie(neueHistorie)`) bleiben byte-identisch — die Aufrufe lösen sich nach Cut auf den Import oben auf. Kein Body-Edit nötig.

---

## 4 · Test-Strategie

### `loesungsMerge.test.ts` — 12 Vitest-Cases

| # | Test-Fall | Source-Branch |
|---|---|---|
| 1 | `mergeLoesungInFrage(f, undefined)` → `f` byte-identisch | Z. 28 early return |
| 2 | Top-Level-Felder (sammel-test): `musterlosung` + `bewertungsraster` + `korrekteFormel` + `korrekt` + `buchungen` + `korrektBuchung` + `sollEintraege` + `habenEintraege` + `loesung` werden gesetzt | Z. 32–40 |
| 3 | Reihenfolgen-Felder `elemente` und `paare` ÜBERSCHREIBEN Original-Werte | Z. 43–44 |
| 4 | Listen-Merge per id: `optionen` (Beispiel-Patch zu Mix-Frage) | Z. 60 |
| 5 | Listen-Merge per id: alle 11 anderen Listen-Felder (`aussagen`, `luecken`, `ergebnisse`, `konten`, `bilanzEintraege`, `aufgaben`, `labels`, `beschriftungen`, `zielzonen`, `bereiche`, `hotspots`) — sammel-test je 1 Beispiel-Patch | Z. 61–71 |
| 6 | `mergeById`: Item ohne `id`-Property → unverändert zurück | Z. 53–56 |
| 7 | `mergeById`: `null`-Item in Liste → unverändert zurück | Z. 53 |
| 8 | `mergeById`: Patch ohne `id` ignoriert (nicht in patchMap) | Z. 51 |
| 9 | Immutability: Original-Frage-Objekt nicht mutiert (deep-equality nach Merge) | impliziter Spread |
| 10 | `mergeLoesungen` mit leerer LoesungsMap → alle `preloaded[id] = false` | Z. 87–88 |
| 11 | `mergeLoesungen` mit Frage mit `teilaufgaben`: TA-Slices werden gemerged + `preloaded[ta.id]` getrackt | Z. 91–98 |
| 12 | `mergeLoesungen` Mix: einige Fragen preloaded, andere nicht — preloaded-Map korrekt | Z. 84–101 |

### `historie.test.ts` — 5 Vitest-Cases

| # | Test-Fall | Source-Branch |
|---|---|---|
| 1 | `ladeHistorie()` ohne localStorage-Eintrag → `[]` | Z. 123 (early-return-`if (!raw)`) |
| 2 | `ladeHistorie()` mit korrupten JSON → `[]` (catch-Pfad) | Z. 129 catch |
| 3 | `ladeHistorie()` mit gültigem JSON-Array → parsed Array zurück | Z. 124 |
| 4 | `speichereHistorie([…51 items])` → trimt auf 50 (`MAX_HISTORIE`) | Z. 133 + MAX_HISTORIE |
| 5 | `speichereHistorie` mit localStorage-Quota-Error → silent (catch) | Z. 133 catch |

**Setup:** jsdom liefert `localStorage`. Test #5 nutzt `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })`. `beforeEach`: `localStorage.clear()`.

### `ergebnisBerechnung.test.ts` — 7 Vitest-Cases

| # | Test-Fall | Source-Branch |
|---|---|---|
| 1 | `null`-Session → Default-`SessionErgebnis` mit `sessionId:''` etc. | Z. 627 |
| 2 | Leere `fragen[]` → `quote: 0` (Div-by-zero-Branch) | Z. 649 |
| 3 | Alle korrekt → `quote: 100`, `richtig === fragen.length`, `falsch: 0` | Z. 639–640 |
| 4 | Mix korrekt+falsch → `quote ≈ 33.33`, `richtig=1`, `falsch=2` (`toBeCloseTo`) | Z. 639–640 |
| 5 | Übersprungene Frage zählt nicht als falsch (`!d.uebersprungen`) | Z. 640 |
| 6 | `unsicher`-Set wird in `details.unsicher` propagiert; `uebersprungen`-Set ebenso | Z. 635–636 |
| 7 | `session.beendet` gesetzt → `dauer = beendet - gestartet`; ohne `beendet` → `Date.now() - gestartet` (`vi.useFakeTimers`) | Z. 641–643 |

**Setup:** Test-Helper `erzeugeSession({ fragen, antworten, ergebnisse, unsicher, uebersprungen, beendet?, gestartet? }) → UebungsSession`. `vi.useFakeTimers()` für Test #7-Branch ohne `beendet`. Mock-Frage über minimal `{ id, typ, frage, fachbereich, ... } as unknown as Frage` (analog Bundle T-Tests).

### Drift + Lint-Gates pro Phase

| Phase | Vitest-Drift | Cumulativ |
|---|---|---|
| Phase 1 (loesungsMerge) | +12 | 1430 → 1442 |
| Phase 2 (historie) | +5 | 1442 → 1447 |
| Phase 3 (ergebnisBerechnung) | +7 | 1447 → 1454 |

Pro Phase grün: tsc -b, vite build, 4 Lint-Gates (`lint:as-any`, `lint:no-alert`, `lint:no-tests-dir`, `lint:musterloesung`).

---

## 5 · Phasen-Plan

### Phase 1 — `loesungsMerge.ts` extrahieren

**Schritte:**
1. Erstelle `ExamLab/src/utils/ueben/loesungsMerge.ts` — `mergeLoesungInFrage` + `mergeLoesungen` byte-identisch + Type-Imports (`Frage`, `LoesungsMap`, `LoesungsSlice`).
2. Erstelle `ExamLab/src/utils/ueben/loesungsMerge.test.ts` — 12 Vitest-Cases.
3. Edit `ExamLab/src/store/ueben/uebungsStore.ts`:
   - Import oben hinzufügen: `import { mergeLoesungen } from '../../utils/ueben/loesungsMerge'`.
   - Z. 18–102 entfernen.
   - `starteSession`-Aufruf an `mergeLoesungen(block, loesungen)` Z. 257 bleibt unverändert.
4. **Verify:** `npm run typecheck` (tsc -b output direkt prüfen, nicht nur Exit-Code), `npm test` +12 vitest, `npm run lint:as-any` / `npm run lint:no-alert` / `npm run lint:no-tests-dir` / `npm run lint:musterloesung` clean, `npm run build` clean.
5. **Per-Phase-Reviewer:** spec-compliance + code-quality APPROVED (Subagent-Dispatch mit präzisem Phase-1-Diff-Brief).

### Phase 2 — `historie.ts` extrahieren

**Schritte:**
1. Erstelle `ExamLab/src/utils/ueben/historie.ts` — exportiert: `type GespeichertesErgebnis`, `HISTORIE_KEY`, `MAX_HISTORIE`, `ladeHistorie`, `speichereHistorie` byte-identisch.
2. Erstelle `ExamLab/src/utils/ueben/historie.test.ts` — 5 Vitest-Cases.
3. Edit `ExamLab/src/store/ueben/uebungsStore.ts`:
   - Imports oben hinzufügen: `import { ladeHistorie, speichereHistorie, MAX_HISTORIE, type GespeichertesErgebnis } from '../../utils/ueben/historie'`.
   - Z. 104–134 entfernen.
   - Body-Aufrufe (`historie: ladeHistorie()` Z. 184, `speichereHistorie(neueHistorie)` Z. 675, `slice(0, MAX_HISTORIE)` Z. 673) bleiben byte-identisch — Scope löst auf Import auf.
4. Edit `ExamLab/src/components/ueben/UebungsEinsicht.tsx` Z. 2: Type-Import von `'../../store/ueben/uebungsStore'` auf `'../../utils/ueben/historie'` umstellen (siehe Diff in § 2).
5. **Verify:** tsc -b clean, +5 vitest, 4 Lint-Gates clean, vite build clean.
6. **Per-Phase-Reviewer** APPROVED.

### Phase 3 — `ergebnisBerechnung.ts` extrahieren

**Schritte:**
1. Erstelle `ExamLab/src/utils/ueben/ergebnisBerechnung.ts` — pure `berechneErgebnis(session: UebungsSession | null): SessionErgebnis` byte-identisch + Imports (`UebungsSession`, `SessionErgebnis`, `getFragetext`).
2. Erstelle `ExamLab/src/utils/ueben/ergebnisBerechnung.test.ts` — 7 Vitest-Cases.
3. Edit `ExamLab/src/store/ueben/uebungsStore.ts`:
   - Aliased-Import oben: `import { berechneErgebnis as berechneErgebnisPure } from '../../utils/ueben/ergebnisBerechnung'`.
   - Store-Action-Body Z. 625–653 → 1-Zeiler `berechneErgebnis: () => berechneErgebnisPure(get().session),`.
   - `getFragetext`-Import oben entfernen, falls keine andere Store-Stelle ihn nutzt (`grep getFragetext uebungsStore.ts` post-edit).
4. **Verify:** tsc -b clean, +7 vitest, 4 Lint-Gates clean, vite build clean. **`uebungsStore.ts` ≤ 535 Zeilen** (`wc -l` Check).
5. **Per-Phase-Reviewer** APPROVED.

### Phase 4 — Final Verification + Merge

1. **Final Code-Reviewer** auf gesamte Branch APPROVED FOR MERGE.
2. Browser-E2E auf staging mit echtem SuS-Login (siehe § 6).
3. `HANDOFF.md` Bundle-W-Eintrag schreiben (analog Bundle V/U-Format).
4. Vor Force-Push prüfen: `git log preview ^bundle-w/uebungsstore-cuts` (Memory-Lehre `feedback_preview_forcepush.md`).
5. `git push --force-with-lease origin bundle-w/uebungsstore-cuts:preview` (Memory-Lehre Bundle N: SW unregister + caches.delete + reload vor E2E).
6. Merge `bundle-w/uebungsstore-cuts` → main.
7. Branch lokal+remote löschen.

---

## 6 · Browser-E2E

10 Pfade auf staging mit echtem SuS-Login (Memory-Lehre `feedback_echte_logins.md`: keine Demo-Modi). SW-Cache vorab via `caches.delete()` + `unregister()` + reload zurücksetzen.

| # | Pfad | Stresst Cut |
|---|---|---|
| 1 | SuS-Login + Üben-Dashboard rendert (5 Tabs) | Smoke (Hotspot ohne Errors) |
| 2 | Übungs-Session starten (Fach + Thema) | `starteSession` + `mergeLoesungen` (P1) |
| 3 | MC-Frage instant-beantworten (preload-Pfad) | `mergeLoesungInFrage` Top-Level + `optionen`-Listen-Merge (P1) |
| 4 | DragDrop-Bild-Frage beantworten | `mergeLoesungInFrage` `zielzonen` + Normalisierung (P1) |
| 5 | Lückentext-Frage beantworten | `mergeLoesungInFrage` `luecken` + `ergebnisse` (P1) |
| 6 | Selbstbewertung Freitext (server-Pfad ohne preload) | `pruefeAntwortJetzt` Server-Branch — kein direkter Cut, Smoke gegen Naming-Konflikt |
| 7 | Übung beenden + Zusammenfassung sichtbar | `berechneErgebnis` Delegator (P3) |
| 8 | Übungs-Einsicht-Tab → letzte Session sichtbar | `GespeichertesErgebnis`-Type-Import + `ladeHistorie` (P2) |
| 9 | Mehrere Sessions abschliessen → DevTools `localStorage.getItem('ueben-session-historie')` zeigt korrekten Trim auf 50 | `speichereHistorie` (P2) |
| 10 | 0 Console-Errors-Check (cross-cutting) | Cross-cutting |

**Mindest-Manual bei Auto-E2E-Block** (Bundle V Lehre: pre-existing FrageModeProvider-Error in PruefungsComposer-Vorschau-Chunk könnte auch hier durchschlagen): Pfade 1+2+7+8+10. Vitest-Coverage (24 neue Tests + 2 bestehende Store-Tests) + 4× Reviewer als Sicherungsnetz für Pfade 3–6+9 (analog Bundle U/V-Pattern).

---

## 7 · Definition of Done

### Pro Phase
- [ ] Vitest grün mit Drift exakt wie geplant (P1+12, P2+5, P3+7)
- [ ] tsc -b clean (Output direkt geprüft, Memory-Lehre `feedback_tsc_b_exit_misleading`)
- [ ] 4 Lint-Gates clean: `lint:as-any` / `lint:no-alert` / `lint:no-tests-dir` / `lint:musterloesung`
- [ ] vite build erfolgreich (~3s, PWA generateSW OK)
- [ ] Per-Phase Spec-Compliance-Reviewer + Code-Quality-Reviewer APPROVED

### Final
- [ ] Final Code-Reviewer (Branch komplett) APPROVED FOR MERGE
- [ ] `uebungsStore.ts` ≤ 535 Zeilen (gerade aus Hotspot raus, >500-Schwelle)
- [ ] Hotspot-Bilanz Files >500 Z.: 10 → 9
- [ ] Browser-E2E Mindest-Pfade 1+2+7+8+10 ✅ mit echtem SuS-Login
- [ ] HANDOFF.md `Bundle W` Eintrag mit Verifikation, Lehren, Spawn-Tasks
- [ ] 2 bestehende Tests grün: `uebungsStoreLoesungsPreload.test.ts` + `uebungsStorePruefen.test.ts`

---

## 8 · Risiken & Mitigationen

| Risiko | L | I | Mitigation |
|---|---|---|---|
| `mergeLoesungInFrage` Listen-Merge subtil verändert (silent korrektur-falsch) | niedrig | hoch | Byte-identisch übernehmen + 12 Tests + bestehende `uebungsStoreLoesungsPreload.test.ts` |
| `ladeHistorie`-Naming-Scope-Konflikt (Top-Level-Funktion vs. Store-Action gleich benannt) | niedrig | mittel | § 3 dokumentiert ausdrücklich Scope-Auflösung; Reviewer prüft |
| `berechneErgebnis` Public-Surface bricht (Konsument bricht) | niedrig | mittel | Aliased-Import `berechneErgebnisPure` + Store-Action bleibt no-arg |
| `GespeichertesErgebnis` Type-Import in `UebungsEinsicht.tsx` vergessen | niedrig | hoch | Phase-2-Step 4 explizit + tsc blockt Merge |
| Vitest-Drift weicht vom Plan ab | mittel | niedrig | Pro-Phase-Tracking (+12 / +5 / +7) im DoD |
| Browser-E2E pre-existing Auto-Block (Bundle V Lehre) | mittel | niedrig | Vitest-Coverage als Sicherungsnetz; Mindest-Manual reicht |
| `getFragetext`-Import-Cleanup vergessen → unused-import-Lint-Warning | niedrig | niedrig | Phase 3 Step 3 explizit prüfen + lint blockt CI |
| Store-Body-Aufrufe nach Cut greifen nicht mehr auf richtigen Scope (`historie: ladeHistorie()` etc.) | niedrig | hoch | § 3 dokumentiert Scope-Auflösung; tsc + bestehende Tests blockt Merge |

---

## 9 · Out-of-Scope / Spawn-Tasks (für nächste Sessions)

- **Bonus-Cut `istSelbstbewertbar`-Konstante:** Liste `['freitext', 'visualisierung', 'pdf', 'audio', 'code']` ist im Store dupliziert (`pruefeAntwortJetzt` Z. 379 + `selbstbewertenById` Z. 498). Domain-Bezug „Frage-Typ-Klassifikation" passt nicht zu den 3 Hauptcuts. **Spawn-Task:** `utils/ueben/fragetypGruppen.ts` mit `SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][]`.
- **Test-Migration:** `src/tests/uebungsStorePruefen.test.ts` + `uebungsStoreLoesungsPreload.test.ts` zu co-located (`store/ueben/uebungsStore*.test.ts`) verschieben — analog Bundle Q-Heuristik B.
- **Phase-5+-Hotspot-Roadmap:** `uebungsStore.ts` ist letztes Hoch-Risiko-File aus Phase 4 Audit. Nach Bundle W ist Phase 4 abgeschlossen. Phase-5-Scoping (z.B. `pruefeAntwortJetzt`-Async-Helper-Extraction, oder andere Dimensionen aus Vereinfachungs-Audit) offen.

---

## Anhang A — Konsumenten-Surface vor/nach Cut

| Konsument | Was wird genutzt | Vor Bundle W | Nach Bundle W |
|---|---|---|---|
| `AppUeben.tsx` | Store-Routing | unverändert | unverändert |
| `Dashboard.tsx` | `useUebenUebungsStore`-State | unverändert | unverändert |
| `UebungsScreen.tsx` | `useUebenUebungsStore`-Actions | unverändert | unverändert |
| `Zusammenfassung.tsx` | `useUebenUebungsStore`-Actions inkl. `berechneErgebnis()` no-arg | `berechneErgebnis()` aufgerufen | **unverändert** (Store-Action bleibt) |
| `UebungsEinsicht.tsx` | `useUebenUebungsStore` + `GespeichertesErgebnis`-Type | Type aus Store-File | **Type aus `utils/ueben/historie`** (1 Caller-Edit) |
| `AppShell.tsx` | Layout | unverändert | unverändert |
| `useFrageAdapter.ts` | Store-State | unverändert | unverändert |
