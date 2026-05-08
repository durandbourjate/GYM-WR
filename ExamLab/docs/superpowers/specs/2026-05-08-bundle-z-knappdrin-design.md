# Bundle Z — Design-Spec: PruefungsComposer + ZeichnenCanvas (Knapp-drin Cuts)

**Datum:** 2026-05-08
**Bundle-Typ:** Phase-5+ Hotspot-Reduction (Knapp-drin-Bucket)
**Risiko:** Niedrig (jeweils ~30-50 Z. Cut, beide Files <30 Z. über 500-Hotspot-Schwelle)
**Sub-Bundles:** 2 unabhängige Phasen (Z.a + Z.b), jeweils eigener Commit

## Kontext

Nach Bundle Y (Layout 570 → 482) bleiben 7 Hotspot-Files >500 Z. Davon sind **PruefungsComposer (526)** und **ZeichnenCanvas (518)** beide nur ~20-30 Z. über der Schwelle. HANDOFF.md klassifiziert beide als „Knapp-drin: kleiner Cut reicht".

**Ziel:** Beide Files unter 500 Z. → Hotspot-Bilanz **7 → 5**.

## § 1 — Phase Z.a: PruefungsComposer (526 → ≤480)

**File:** `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx`

### Cut-Strategie

Drei kleine, unabhängige Cuts:

#### Z.a.1 — `useFragenStats`-Hook (~15 Z. Cut)
- **Ziel:** Tracker-Stats-Loading (Z. 86-101 Original) in Hook auslagern
- **Neu:** `ExamLab/src/hooks/useFragenStats.ts` (~25 Z.)
- **Pattern:** Self-contained Hook (Bundle Y), `apiService.ladeTrackerDaten` + `aggregiereFragenPerformance`-Wrapper, Demo-Mode-Fallback inline
- **Konsumenten:** PruefungsComposer ersetzt 16 Z. State+Effect durch 1 Hook-Call

#### Z.a.2 — `LoeschDialoge.tsx`-Komponente (~62 Z. JSX-Cut)
- **Ziel:** Beide BaseDialog-Blöcke (Z. 454-516 Original = Abschnitt-Lösch + Pruefung-Lösch) in Sub-Komponente
- **Neu:** `ExamLab/src/components/lp/vorbereitung/composer/LoeschDialoge.tsx` (~85 Z.)
- **Pattern:** Render-Sub-Komponente mit Props-Bündel (Bundle T.b)
- **Props:**
  ```
  loeschDialog: { index: number; titel: string } | null
  setLoeschDialog: (v: ...) => void
  bestaetigeLoeschen: () => void
  zeigLoeschPruefung: boolean
  setZeigLoeschPruefung: (v: boolean) => void
  pruefungTyp: 'summativ' | 'formativ'
  pruefungTitel: string
  loescht: boolean
  handleLoeschePruefung: () => Promise<void>
  ```
- **JSX byte-identisch** zu Original Z. 454-516 (Tailwind-Klassen, Strings, Verhalten unverändert)

#### Z.a.3 — `generiereId` Pure-Helper (~6 Z. Move)
- **Ziel:** Hoisted bottom-Helper Z. 521-526 nach `composer/composerHelpers.ts`
- **Neu:** `ExamLab/src/components/lp/vorbereitung/composer/composerHelpers.ts` (~10 Z. inkl. Type-Import)
- **Tests:** 3 Vitest-Cases (klasse-special-chars, datum-stripping, rand-suffix-länge)

### Erwartete Reduktion
- 16 (Hook) + 62 (Dialoge) + 6 (Helper) = **~84 Z. raus**
- Plus 5 Z. Imports rein → **netto ~79 Z. Reduktion**
- 526 → **~447 Z.** ✅ deutlich unter 500

### Tests neu
- `useFragenStats.test.ts`: 3 Cases (demo-mode → demo-tracker, no-user → leer, success → aggregiert)
- `composerHelpers.test.ts`: 3 Cases für `generiereId`

### Risiken
- **Auto-Save / handleSpeichernIntern bleibt INLINE** — nicht im Cut-Scope (zu viel Refs/Closures, höher-Risiko)
- BaseDialog-Props-Surface stabil (bestehende Tests im Repo nutzen BaseDialog direkt)
- LP-Workflow „Prüfung erstellen → speichern → löschen" muss unverändert funktionieren

### Browser-E2E Pfade (Phase Z.a)
1. LP login → Prüfung neu anlegen → Titel + Klasse setzen → Auto-Save (3s) → Status „Automatisch gespeichert ✓"
2. Prüfung-Lösch-Button → Dialog öffnet → Abbrechen → Dialog zu
3. Prüfung-Lösch-Button → Dialog öffnet → Endgültig löschen → Spinner → onZurueck-Navigation

## § 2 — Phase Z.b: ZeichnenCanvas (518 → ≤470)

**File:** `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx`

### Cut-Strategie

#### Z.b.1 — `TextOverlayInput.tsx`-Komponente (~50 Z. JSX-Cut)
- **Ziel:** Text-Overlay-Render-JSX (Z. 459-509 Original) in Sub-Komponente
- **Neu:** `ExamLab/src/components/fragetypen/zeichnen/TextOverlayInput.tsx` (~70 Z.)
- **Pattern:** Render-Sub-Komponente mit Props (Bundle T.b)
- **Props:**
  ```
  cssLeft: number
  cssTop: number
  text: string
  setText: (v: string) => void
  abschliessen: (abbruch: boolean) => void
  abschliessenViaBlur: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  aktiveFarbe: string
  ```
- **JSX byte-identisch** zu Original Z. 459-509 (alle inline-Styles, alle event-handler unverändert)

#### Z.b.2 — `cursorFuerTool`-Helper (~13 Z. Move)
- **Ziel:** Pure switch-Funktion Z. 400-412 in eigenes Modul
- **Neu:** `ExamLab/src/components/fragetypen/zeichnen/cursorFuerTool.ts` (~16 Z.)
- **Tests:** 1 Vitest-Case mit Tool-→-Cursor-Mapping (alle 8 Tools verifizieren)

### Erwartete Reduktion
- 50 (Overlay) + 13 (Cursor-Helper) = **~63 Z. raus**
- Plus 2 Z. Imports rein → **netto ~61 Z. Reduktion**
- 518 → **~457 Z.** ✅ deutlich unter 500

### Tests neu
- `cursorFuerTool.test.ts`: 1 Case mit allen 8 Tools (auswahl/stift/linie/pfeil/rechteck/ellipse/text/radierer)
- `TextOverlayInput.tsx`: KEIN Vitest (reines JSX, durch Browser-E2E in Bundle T.d-Pfaden gedeckt)

### Risiken
- Text-Overlay ist iPad/Touch-kritisch — Touch-Event-stopPropagation-Cascade muss unverändert bleiben
- Bundle T.d hat ZeichnenCanvas bereits getestet (10/11 Pfade, Pfad 8 iPad skipped)
- Keine externen Caller bekannt für `cursorFuerTool` (lokal definiert)

### Browser-E2E Pfade (Phase Z.b)
1. LP login → Übung mit Zeichnen-Frage → Zeichnen öffnen → Stift → 1 Strich → Strich erscheint
2. Werkzeug → Text → Klick auf Canvas → Overlay erscheint mit Input-Fokus → Text tippen → Enter → Text auf Canvas
3. Werkzeug → Text → Klick → Overlay → Escape → kein Text gespeichert
4. Werkzeug → Auswahl-Tool → Cursor wechselt zu `default`

## § 3 — Verifikations-Gates

- vitest: 1488 → ~1495 (+7: 3 useFragenStats + 3 generiereId + 1 cursorFuerTool)
- tsc -b: clean
- lint:as-any (Total 0): clean
- lint:no-alert: 0 Treffer
- lint:no-tests-dir: 0 Treffer
- lint:musterloesung: Drift = 0
- vite build: grün

## § 4 — Definition of Done

- [ ] Bundle Z.a Phase-1: useFragenStats + Tests committed
- [ ] Bundle Z.a Phase-2: LoeschDialoge + Composer-Edit committed
- [ ] Bundle Z.a Phase-3: composerHelpers + Tests + Composer-Edit committed
- [ ] Bundle Z.b Phase-4: cursorFuerTool + Tests + Canvas-Edit committed
- [ ] Bundle Z.b Phase-5: TextOverlayInput + Canvas-Edit committed
- [ ] Beide Files unter 500 Z. (verifiziert via `wc -l`)
- [ ] Alle Verifikations-Gates grün
- [ ] Push preview, GitHub Pages staging deploy grün
- [ ] Browser-E2E mit echten LP+SuS-Logins (Pfade 1-7)
- [ ] Merge in main, HANDOFF-Update, Memory-Update

## § 5 — Architektur-Patterns (etabliert/wieder-verwendet)

- **Render-Sub-Komponente mit Props-Bündel** (Bundle T.b/Y) — JSX-Cut zu eigener Komponente
- **Self-contained Hook mit Store-getState** (Bundle Y) — Hook für API-Call+State, Caller bleibt clean
- **Pure-Helper-Move ohne Re-Export-Bridge** (Bundle U/W) — wenn Pre-Cut-Grep zeigt: nur Source hat den Helper

## § 6 — Out of Scope

- handleSpeichernIntern Auto-Save-Hook in PruefungsComposer (zu viel Closure/Ref-State, eigenes Bundle wert)
- handleStart/handleMove/handleEnd-State-Machine in ZeichnenCanvas (kohärenter Block, Bundle T.d hat Pointer-Events bereits ausgelagert)
- weitere 5 Hotspot-Files (HilfeSeite 906, ConfigTab 747, EinstellungenPanel 607, BilanzERFrage 589, AktivPhase 573) — eigene Bundles
