# Bundle AA — Design-Spec: AktivPhase + BilanzERFrage (Mittel-Risiko Cuts)

**Datum:** 2026-05-09
**Bundle-Typ:** Phase-5+ Hotspot-Reduction (Mittel-Risiko-Bucket)
**Risiko:** Mittel — beide ~80-160 Z. Cut nötig, mit Tests verifizieren
**Sub-Bundles:** 2 unabhängige Phasen (A + B), jeweils eigener Commit

## Kontext

Nach Bundle Z (PruefungsComposer 526→454, ZeichnenCanvas 518→466) bleiben 5 Hotspot-Files >500 Z. Davon **AktivPhase (573)** und **BilanzERFrage (589)** beide im mittel-Risiko-Bucket (Live-State / Fibu-Logik).

**Ziel:** Beide Files unter 500 Z. → Hotspot-Bilanz **5 → 3**.

## § 1 — Phase A: AktivPhase (573 → ≤450)

**File:** `ExamLab/src/components/lp/durchfuehrung/AktivPhase.tsx`

### Cut-Strategie

#### A.1 — `ZeitzuschlagInline`-Komponente (~110 Z. JSX-Cut)
- **Ziel:** Inline-Sub-Komponente Z. 414-523 in eigene Datei
- **Neu:** `ExamLab/src/components/lp/durchfuehrung/ZeitzuschlagInline.tsx` (~125 Z.)
- **Pattern:** Sub-Komponente in eigene Datei (Bundle-T.b/Y/Z)
- **Props:** `{email, zuschlagMin, basisEndeMs, jetzt, istAktiv, onAendern}` (6 Property Props-Interface)
- **State + Verhalten byte-identisch** zu Original Z. 425-523 (3 Branch-Returns: kein-Zuschlag, Editor, Overtime, Zuschlag-gesetzt)
- **Tests:** 5 Vitest mit @testing-library/react: kein-Zuschlag → +5 Click, Editor-Edit → Enter speichert, Editor-Edit → Escape verwirft, Overtime-Countdown rendert, +5-Button incrementiert.

#### A.2 — Helpers raus (~50 Z. Move)
- **Ziel:** 5 Pure-Funktionen am Bottom in eigenes Modul
- **Neu:** `ExamLab/src/components/lp/durchfuehrung/aktivPhaseHelpers.tsx` (~70 Z.)
- **Funktionen:** `statusReihenfolge`, `filterLabel`, `verstossTooltip`, `stufeIcon`, `statusBadge`
- **Pattern:** Pure-Helper-Move ohne Re-Export-Bridge (Bundle-U/W)
- **Tests:** 4 Vitest: statusReihenfolge alle 5 statuses + default, filterLabel alle 4 Filter, verstossTooltip leer + mit-Verstössen, stufeIcon locker/streng/default. (statusBadge JSX-Render-only, kein Test.)

### Erwartete Reduktion
- 110 (ZeitzuschlagInline) + 50 (Helpers) = **~160 Z. raus**
- Plus 5 Z. Imports rein → **netto ~155 Z. Reduktion**
- 573 → **~418 Z.** ✅ deutlich unter 500

### Risiken
- AktivPhase ist Live-State der laufenden Pruefung — Regression betrifft Pruefung-Durchführung ⚠️
- ZeitzuschlagInline hat 3 Render-Branches + lokalen Editor-State — alle Pfade müssen testbar bleiben
- Pure-Helper-Funktionen sind erstaunlich risikofrei (kein State, kein Side-Effect)

### Browser-E2E Pfade (Phase A)
1. LP login → Aktive Pruefung in Durchführen-Tab → Tabelle rendert
2. Filter (Alle/Aktiv/Abgegeben) → Tabelle aktualisiert
3. Sortierung-Dropdown → Tabelle aktualisiert
4. Status-Badge sichtbar pro SuS-Status

## § 2 — Phase B: BilanzERFrage (589 → ≤400)

**File:** `ExamLab/src/components/fragetypen/BilanzERFrage.tsx`

### Cut-Strategie

#### B.1 — `BilanzERLoesung` mit Helpers (~210 Z. Cut)
- **Ziel:** Kompletter Lösungs-Modus (Z. 379-537 main + Z. 539-589 Helpers) in eigene Datei
- **Neu:** `ExamLab/src/components/fragetypen/BilanzERLoesung.tsx` (~230 Z.)
- **Pattern:** Render-Sub-Komponente mit Mode-Split (Bundle-T.b/Y/Z)
- **Inhalt der Datei:**
  - `BilanzERLoesung` (Hauptkomponente) — Lösungs-Modus mit Korrekt-Vergleich
  - `BilanzSeiteRender` (Sub-Helper) — rendert Aktiv/Passiv-Seite
  - `KontoZeileAnzeige` (Sub-Helper) — rendert eine Konto-Zeile mit Saldo
  - `erwarteterGewinnVerlust` (Pure-Funktion) — berechnet Gewinn/Verlust aus letzter Stufe
- **Props (BilanzERLoesung):** `{frage: BilanzERFrageType, antwort: StoreAntwort | null}` (2 Properties, byte-identisch zum Original-Aufruf)
- **JSX byte-identisch** zu Original Z. 413-537 (Tailwind-Klassen, Strings, Verhalten unverändert)
- **Tests:** Bestehende `BilanzERFrageLoesung.test.tsx` (134 Z.) muss weiterhin grün bleiben — kein Test-Edit, nur File-Move

### Erwartete Reduktion
- 210 (Lösungs-Modus + Helpers) = **~210 Z. raus**
- Plus 1 Z. Import rein → **netto ~209 Z. Reduktion**
- 589 → **~380 Z.** ✅ deutlich unter 500

### Risiken
- BilanzERLoesung ist isolierter Branch-Render (`if (modus === 'loesung')`) — kein State-Sharing mit Aufgabe-Modus, sicher zu extrahieren ✅
- 2 Helper-Komponenten (BilanzSeiteRender, KontoZeileAnzeige) sind nur in Loesung verwendet — ko-lokale Migration sinnvoll
- `erwarteterGewinnVerlust` ist Pure-Funktion ohne Side-Effects
- `kategorieBadge`/`kategorieLabel`-Konstanten (Z. 158-167) bleiben in Source weil von KontenTabelle (Aufgabe-Pfad) verwendet

### Browser-E2E Pfade (Phase B)
1. SuS Login → Übung mit BilanzER-Frage starten → Aufgabe-Modus rendert (Bilanz/ER-Inputs)
2. SuS gibt Antwort ein → Antwort prüfen → Lösungsmodus rendert
3. Lösungs-Rahmen zeigt Korrekt-Bilanz + ER mit Vergleich SuS-Antwort
4. Konto-Erläuterungen + Musterloesung sichtbar

## § 3 — Verifikations-Gates

- vitest: 1498 → ~1507 (+9: 5 ZeitzuschlagInline + 4 aktivPhaseHelpers; bestehende BilanzERFrageLoesung.test.tsx unverändert)
- tsc -b: clean
- lint:as-any (Total 0): clean
- lint:no-alert: 0 Treffer
- lint:no-tests-dir: 0 Treffer
- lint:musterloesung: Drift = 0
- vite build: grün

## § 4 — Definition of Done

- [ ] Phase A.1: ZeitzuschlagInline + Tests committed
- [ ] Phase A.2: aktivPhaseHelpers + Tests committed
- [ ] Phase B.1: BilanzERLoesung committed + bestehende Tests grün
- [ ] Beide Files unter 500 Z. (verifiziert via `wc -l`)
- [ ] Alle Verifikations-Gates grün
- [ ] Push preview, GitHub Pages staging deploy grün
- [ ] Browser-E2E mit echten LP+SuS-Logins
- [ ] Merge in main, HANDOFF-Update, Memory-Update

## § 5 — Architektur-Patterns (etabliert/wieder-verwendet)

- **Render-Sub-Komponente in eigene Datei** (Bundle-T.b/Y/Z) — JSX-Cut zu File mit Props-Bündel
- **Pure-Helper-Move ohne Re-Export-Bridge** (Bundle-U/W/Z) — wenn Pre-Cut-Grep zeigt: nur Source hat den Helper
- **Modus-Branch-Cut bei polymorpher Komponente** (neu Bundle-AA) — `BilanzERFrage` mit `modus`-Prop hat 2 Top-Level-Branches; Lösungs-Branch + zugehörige Helpers in eigene Datei

## § 6 — Out of Scope

- Bilanz/ER-Editor-Komponenten (BilanzUI, BilanzSeiteUI, ERUI, KontoRow, KontenTabelle) bleiben in Source — eng verzahnt mit Aufgabe-State, eigenes Bundle wert
- Tabellen-Body in AktivPhase (Tabellenzeilen-JSX, Z. 184-322) bleibt in Source — eng verzahnt mit Sortierung+Filter+Konfig-Updates
- weitere 3 Hotspot-Files (HilfeSeite 906, ConfigTab 747, EinstellungenPanel 607) — eigene Bundles
