# Übungsmodus-Korrektur-Flow Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SuS-Üben-Modus stoppt sofortige Auto-Korrektur bei jeder Eingabe-Änderung. Stattdessen: explizit "Antwort prüfen"-Button, dann (a) Auto-Korrektur + Musterlösung ODER (b) Musterlösung + Selbstbewertungs-Buttons "richtig / teilweise / falsch". Pool-Pattern.

**Architecture:** Trennung der Store-Actions: `speichereZwischenstandById` (existiert, wird nun verlinkt) für Eingabe-Updates · `pruefeAntwortJetzt` (neu) für expliziten Prüf-Klick · `selbstbewertenById` (neu) für Selbstbewertungs-Wahl. Adapter-Hook `useFrageAdapter` ändert seine `disabled`-Semantik: nicht mehr "ist eine Antwort vorhanden", sondern "ist die Frage geprüft". Neue Shared-Komponenten `UebenAktionsLeiste` + `SelbstbewertungsDialog` werden im Üben-Wrapper gerendert.

**Tech Stack:** React 19 + TypeScript + Zustand + Vitest

**Audit-Befund:** Siehe Session-Kontext 2026-04-17 (Bundle A2 Audit). Zentrale Root Cause: `useFrageAdapter.ts:55-59` ruft sofort `uebenBeantworteById()` → `pruefeAntwort()` (`uebungsStore.ts:152-178`).

**Branch:** `feature/ueben-zwischenstand-flow`

**Pruefungs-Modus bleibt unangetastet.** Alle Änderungen sind hinter `useFrageMode().mode === 'ueben'` Check.

---

## File Structure

| Datei | Rolle | Status |
|---|---|---|
| `ExamLab/src/store/ueben/uebungsStore.ts` | Neue Actions `pruefeAntwortJetzt`, `selbstbewertenById`; bestehende `beantworteById` deprecaten/entfernen | modify |
| `ExamLab/src/store/ueben/uebungsStore.test.ts` | Tests für neue Actions | modify |
| `ExamLab/src/hooks/useFrageAdapter.ts` | `onAntwort` ruft `speichereZwischenstandById` statt `beantworteById`; `disabled`-Semantik ändert auf `istGeprueft` | modify |
| `ExamLab/src/utils/ueben/korrektur.ts` | `istSelbstbewertungstyp(typ)` exportieren | modify |
| `ExamLab/src/components/ueben/uebung/UebenAktionsLeiste.tsx` | "Prüfen"-Button → nach Prüfung "Weiter"-Button | **create** |
| `ExamLab/src/components/ueben/uebung/UebenAktionsLeiste.test.tsx` | Komponententests | **create** |
| `ExamLab/src/components/ueben/uebung/SelbstbewertungsDialog.tsx` | Musterlösungs-Anzeige + 3 Buttons | **create** |
| `ExamLab/src/components/ueben/uebung/SelbstbewertungsDialog.test.tsx` | Tests | **create** |
| `ExamLab/src/components/ueben/uebung/QuizActions.tsx` | Aktionsleiste durch neue Komponenten ersetzen | modify |
| `ExamLab/src/components/fragetypen/MCFrage.tsx` | Spot-Fix: Optionen-Label A/B/C aus Index | modify |
| `ExamLab/src/components/fragetypen/BildbeschriftungFrage.tsx` | Spot-Fix: Input-Width `w-auto max-w-[200px]` | modify |

**Verworfen (Scope):**
- Audio-Selbstbewertung: später, wenn iPhone-Bug B2 gefixt
- Code/Visualisierung: gleiche Selbstbewertung wie Freitext, kein Sondercode
- Globale Tastatur-Shortcuts (Space=Weiter): explizit ausgeschlossen, weil aktuell der Eingabe-Blocker

---

## Task 1: Store-Actions trennen

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`
- Modify: `ExamLab/src/store/ueben/uebungsStore.test.ts`

**Rationale:** `beantworteById` macht aktuell drei Dinge gleichzeitig (Speichern + Korrigieren + Lock). Wir splitten in:
- `speichereZwischenstandById(id, antwort)` — existiert (Z.180-187), unverändert
- `pruefeAntwortJetzt(id)` — **neu**: liest letzten Zwischenstand, ruft `pruefeAntwort()`, schreibt Ergebnis, setzt `istGeprueft = true`
- `selbstbewertenById(id, ergebnis)` — **neu**: schreibt SuS-Eigenbewertung als Ergebnis, setzt `istGeprueft = true`

`beantworteById` bleibt vorerst (Backwards Compat im Prüfungs-Modus, falls dort genutzt — checken in Step 1.0).

- [ ] **Step 1.0: Audit `beantworteById` Call-Sites**

```bash
grep -rn "beantworteById\|uebenBeantworteById" ExamLab/src/
```
Liste in Plan dokumentieren. Wenn nur Üben-Code: ersetzen wir's. Wenn auch Prüfung: lassen wir es stehen und ergänzen die zwei neuen.

- [ ] **Step 1.1: Action-Schnittstelle definieren**

In `uebungsStore.ts` Store-Interface ergänzen:
```ts
pruefeAntwortJetzt: (frageId: string) => void
selbstbewertenById: (frageId: string, ergebnis: 'korrekt' | 'teilweise' | 'falsch') => void
```

Im Session-State Feld `geprueft: Record<string, boolean>` ergänzen (oder `ergebnisse[id]?.geprueft` flag — entscheiden bei Implementation).

- [ ] **Step 1.2: Implementation**

`pruefeAntwortJetzt`:
- Liest `session.zwischenstand[id]` (oder `antworten[id]`)
- Ruft `pruefeAntwort(frage, antwort)` aus `utils/ueben/korrektur.ts`
- Schreibt `session.ergebnisse[id]` + `session.antworten[id]` + `session.feedbackSichtbar[id] = true` + `geprueft[id] = true`

`selbstbewertenById`:
- Setzt `session.ergebnisse[id] = { korrekt, art: 'selbstbewertung', ... }`
- `session.feedbackSichtbar[id] = true` + `geprueft[id] = true`

- [ ] **Step 1.3: Tests**

In `uebungsStore.test.ts` ergänzen:
- `speichereZwischenstandById` setzt **nicht** `geprueft` und triggert **keine** Korrektur
- `pruefeAntwortJetzt` ohne Zwischenstand → no-op (oder Default-Antwort?)
- `pruefeAntwortJetzt` mit Zwischenstand für MC → Ergebnis korrekt/falsch
- `selbstbewertenById('x', 'teilweise')` → ergebnis.korrekt-Halbpunktelogik

- [ ] **Step 1.4: Build + Test**

```bash
cd ExamLab && npx tsc -b && npx vitest run --reporter=verbose store/ueben
```

- [ ] **Step 1.5: Commit**

```
A2-1: Store-Actions pruefeAntwortJetzt + selbstbewertenById
```

---

## Task 2: Adapter-Hook umstellen

**Files:**
- Modify: `ExamLab/src/hooks/useFrageAdapter.ts`

**Rationale:** Im Üben-Modus darf `onAntwort` nicht mehr sofort korrigieren. `disabled` darf Inputs nicht mehr sperren nur weil eine Antwort gespeichert wurde — erst wenn geprüft.

- [ ] **Step 2.1: onAntwort umverdrahten**

In `useFrageAdapter.ts` (Zeile ~50-60): wenn `mode === 'ueben'`:
```ts
onAntwort: (a: Antwort) => uebenSpeichereZwischenstandById(frageId, a)
```
Statt vorher `uebenBeantworteById(frageId, a)`.

- [ ] **Step 2.2: disabled-Semantik ändern**

```ts
disabled: mode === 'ueben'
  ? frageId in (session?.geprueft ?? {})
  : frageId in (session?.antworten ?? {})  // Prüfungs-Modus unverändert
```

- [ ] **Step 2.3: feedbackSichtbar nur nach Prüfung**

`feedbackSichtbar` in der Adapter-Rückgabe knüpfen an `geprueft[id]`. Im Üben: bevor SuS "Prüfen" drückt, NIE Lösung zeigen.

- [ ] **Step 2.4: Test**

```bash
cd ExamLab && npx vitest run hooks/useFrageAdapter
```

- [ ] **Step 2.5: Commit**

```
A2-2: useFrageAdapter speichert Zwischenstand statt zu korrigieren
```

---

## Task 3: UebenAktionsLeiste-Komponente

**Files:**
- Create: `ExamLab/src/components/ueben/uebung/UebenAktionsLeiste.tsx`
- Create: `ExamLab/src/components/ueben/uebung/UebenAktionsLeiste.test.tsx`

**Rationale:** Eine prominente Aktionsleiste unter jeder Frage im Üben-Modus. Vor Prüfung: "Antwort prüfen". Nach Prüfung: "Weiter zur nächsten Frage" + Status-Anzeige.

**Props:**
```ts
interface UebenAktionsLeisteProps {
  frageId: string
  hasZwischenstand: boolean
  istGeprueft: boolean
  istSelbstbewertungstyp: boolean
  onPruefen: () => void
  onWeiter: () => void
}
```

- [ ] **Step 3.1: Komponente bauen**

Layout:
- Vor Prüfung: violetter "Antwort prüfen"-Button (Button-Variante "primary"), disabled wenn `!hasZwischenstand`
- Nach Prüfung (auto-korrigiert): grüner ✅ / roter ❌ Status + grauer "Weiter"-Button
- Nach Prüfung (selbstbewertet): grauer "Weiter"-Button (Status zeigt der SelbstbewertungsDialog selbst)

- [ ] **Step 3.2: Tests**

- Renders "Antwort prüfen" wenn `!istGeprueft`
- Button disabled wenn `!hasZwischenstand`
- Klick auf "Antwort prüfen" → `onPruefen()`
- Renders "Weiter" wenn `istGeprueft`

- [ ] **Step 3.3: Commit**

```
A2-3: UebenAktionsLeiste-Komponente
```

---

## Task 4: SelbstbewertungsDialog-Komponente

**Files:**
- Create: `ExamLab/src/components/ueben/uebung/SelbstbewertungsDialog.tsx`
- Create: `ExamLab/src/components/ueben/uebung/SelbstbewertungsDialog.test.tsx`
- Modify: `ExamLab/src/utils/ueben/korrektur.ts` — `istSelbstbewertungstyp(typ)` exportieren

**Rationale:** Pool-Pattern: Musterlösung gross + 3 Buttons. SuS reflektiert seine Antwort.

- [ ] **Step 4.1: Helper exportieren**

In `utils/ueben/korrektur.ts`:
```ts
export function istSelbstbewertungstyp(typ: FrageTyp): boolean {
  return ['freitext', 'pdf', 'visualisierung', 'audio', 'code', 'zeichnen'].includes(typ)
}
```

- [ ] **Step 4.2: Dialog-Komponente**

Props:
```ts
interface SelbstbewertungsDialogProps {
  musterloesung: string  // Markdown/HTML
  onWahl: (ergebnis: 'korrekt' | 'teilweise' | 'falsch') => void
}
```

Layout:
- Box mit Überschrift "Musterlösung"
- Musterlösung als formatierter Text (FrageText-Komponente nutzen)
- Frage darunter: "Wie hast du geantwortet?"
- 3 Buttons:
  - ✅ Richtig (grün)
  - 🟡 Teilweise (amber)
  - ❌ Falsch (rot)
- Touch-Target ≥ 44px (`bilder-in-pools.md` Regel 19)

- [ ] **Step 4.3: Tests**

- Renders Musterlösung
- 3 Buttons sichtbar
- Klick auf "Richtig" → `onWahl('korrekt')`

- [ ] **Step 4.4: Commit**

```
A2-4: SelbstbewertungsDialog + istSelbstbewertungstyp
```

---

## Task 5: QuizActions umverdrahten

**Files:**
- Modify: `ExamLab/src/components/ueben/uebung/QuizActions.tsx`

**Rationale:** Der bestehende QuizActions-Container muss die neue Aktionsleiste rendern und den Flow "Prüfen → ggf. Selbstbewertung → Weiter" orchestrieren.

- [ ] **Step 5.1: State-Maschine**

```
state: 'eingabe' | 'auto-korrigiert' | 'selbstbewertung-offen' | 'selbstbewertet'
```
- `eingabe` + Klick "Prüfen" + Auto-Typ → `pruefeAntwortJetzt()` → `auto-korrigiert`
- `eingabe` + Klick "Prüfen" + Selbst-Typ → `selbstbewertung-offen`
- `selbstbewertung-offen` + Klick auf Wahl → `selbstbewertenById()` → `selbstbewertet`
- `auto-korrigiert` / `selbstbewertet` + Klick "Weiter" → `onNext()` (existiert)

- [ ] **Step 5.2: Render**

```tsx
{state === 'selbstbewertung-offen' && <SelbstbewertungsDialog .../>}
{state !== 'selbstbewertung-offen' && (
  <UebenAktionsLeiste .../>
)}
```

Bei `auto-korrigiert`/`selbstbewertet` zusätzlich Musterlösung anzeigen (bestehende Logik in QuizActions wahrscheinlich vorhanden — beibehalten).

- [ ] **Step 5.3: Test**

End-to-end Test in `QuizActions.test.tsx` falls vorhanden — ein Auto-Typ-Flow + ein Selbst-Typ-Flow.

- [ ] **Step 5.4: Commit**

```
A2-5: QuizActions Flow Prüfen → Selbstbewertung → Weiter
```

---

## Task 6: Spot-Fixes Fragetypen

**Files:**
- Modify: `ExamLab/src/components/fragetypen/MCFrage.tsx`
- Modify: `ExamLab/src/components/fragetypen/BildbeschriftungFrage.tsx`

- [ ] **Step 6.1: MC-Label A/B/C**

In `MCFrage.tsx:91`:
```tsx
{String.fromCharCode(65 + index)})  // 0→A, 1→B, ...
```
statt `option.id.toUpperCase()`. `index` aus `optionen.map((option, index) => ...)`.

- [ ] **Step 6.2: Bildbeschriftung Input-Breite**

In `BildbeschriftungFrage.tsx:88`:
```tsx
className={`w-auto min-w-[80px] max-w-[200px] px-2 py-1 text-sm rounded border ...`}
```

- [ ] **Step 6.3: Tests aktualisieren**

`MCFrage.test.tsx`: prüfen dass A/B/C gerendert wird (falls Test darauf prüft).

- [ ] **Step 6.4: Commit**

```
A2-6: MC A/B/C-Labels + Bildbeschriftung Input-Breite
```

---

## Task 7: Fragetyp-Komponenten — Sicherheits-Check

**Files (~14 Komponenten in `ExamLab/src/components/fragetypen/`):**
- MCFrage, RichtigFalschFrage, NumerischFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage, SortierungFrage, BildbeschriftungFrage, HotspotFrage, DragDropBildFrage, ZeichnenFrage, PDFFrage, VisualisierungFrage, CodeFrage, AudioFrage, BuchungssatzFrage, TKontoFrage, BilanzERFrage, KontenbestimmungFrage

**Rationale:** Jede Komponente ruft `onAntwort()` aus dem Adapter. Da Task 2 die Semantik verändert (nicht mehr sofort gesperrt + korrigiert), müssen wir in jeder Komponente prüfen, dass:
1. Inputs nicht selbst auf `disabled`-Prop bedingt sperren wenn antwortet wurde
2. Keine Komponente eigene "feedback anzeigen wenn beantwortet"-Logik hat, die Lösung zeigt bevor `geprueft`
3. Komponenten die `onAntwort` bei jedem Tastendruck callen (Freitext/Lückentext) sind ab jetzt OK, weil das nur Zwischenstand ist

- [ ] **Step 7.1: Audit-Lauf**

```bash
grep -ln "feedbackSichtbar\|onAntwort\|disabled" ExamLab/src/components/fragetypen/
```
Pro Komponente: Notiz im Plan ob Anpassung nötig.

- [ ] **Step 7.2: Anpassungen**

Pro betroffener Komponente: minimaler Diff (nur was wirklich nötig ist nach neuer Semantik).

- [ ] **Step 7.3: Test**

```bash
cd ExamLab && npx vitest run components/fragetypen
```

- [ ] **Step 7.4: Commit**

```
A2-7: Fragetypen-Komponenten an neue Adapter-Semantik anpassen
```

---

## Task 8: Browser-Test (echte Logins, Staging)

**Files:** keine — Verifikation.

Folgt `regression-prevention.md` Phase 3. Test-Plan **vor** dem Klicken im Chat aufschreiben.

### Test-Plan: A2 Übungsmodus-Korrektur-Flow

| # | Bug aus User-Test 17.04. | Erwartetes Verhalten | Regressions-Risiko |
|---|--------------------------|---------------------|-------------------|
| 1 | MC zeigt `OPT-0)` | Zeigt `A)`, `B)`, `C)`, `D)` | Sortierung der MC-Optionen (Test) |
| 2 | Freitext sofort falsch + Space=Weiter | Freitext-Eingabe geht; Space tippt Leerzeichen; "Prüfen" → Musterlösung + 3 Selbstbewertungs-Buttons | Tiptap Editor-Verhalten |
| 3 | Lückentext: kein Input, Lösung doppelt | Eingabe geht; "Prüfen" → Lösung + ✅/❌; nicht doppelt | Lückentext-Render-Logik |
| 4 | Zeichnen: Mausklick = falsch | Zeichnen geht ohne Korrektur; "Prüfen" → Musterzeichnung + Selbstbewertung | Zeichnen-Store + Pointer-Events |
| 5 | DragDrop: erstes Drop = falsch | Mehrfache Drops möglich; "Prüfen" → Auto-Korrektur + Musterlösung | DragDrop-Pointer-Events |
| 6 | Bildbeschriftung "4 labels" zu klein | Input ist auto-breit, max 200px | Wrapping bei langen Labels |

### Security-Check (Phase 4)

- [ ] SuS-Response enthält in `selbstbewertenById` KEINE Lösung vor SuS-Klick auf "Prüfen"
- [ ] LP-Modus (Pruefung) unverändert: `disabled` weiterhin = "antwortet"
- [ ] Keine neue Persistenz von Musterlösung in localStorage
- [ ] Keine neue Routine die Lösungsfelder vor Prüfung lädt

### Kritische Pfade (aus regression-prevention.md 1.3)

- [ ] Pfad 1 (SuS lädt Prüfung): unverändert — nur Üben-Modus betroffen
- [ ] Pfad 2 (Heartbeat + Auto-Save): unverändert — Üben hat eigenen Save-Pfad
- [ ] Pfad 3 (Abgabe): unverändert
- [ ] Pfad 4 (Monitoring): unverändert
- [ ] Pfad 5 (Korrektur): unverändert

### Verwandtschafts-Tests (Bild/Medien-Gruppe)

- [ ] Hotspot — kein gemeldeter Bug, aber gleiche Fragetyp-Klasse: Klicks setzen Marker, Prüfen → Auto-Korrektur
- [ ] PDF-Annotation — Selbst-Typ: Antwort kritzeln, Prüfen → Musterlösung + Selbstbewertung

---

## Task 9: HANDOFF.md aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] Session 116-Eintrag (oder welche Session-Nummer aktuell ist) mit:
  - Stand: A2 in Branch / auf Staging / auf main
  - Umgesetzt: Task 1-7 Liste
  - Verifikation: Test-Plan-Ergebnisse
  - Lehre: einklappen in `bilder-in-pools.md` falls neuer Bug-Typ

---

## Risiken

1. **`beantworteById` ist im Prüfungs-Modus genutzt** — Step 1.0 muss das prüfen. Falls ja: separate Code-Pfade. Falls nein: kann komplett ersetzt werden.
2. **`useFrageAdapter` wird auch von Pruefungs-Komponenten konsumiert** — `mode`-Check muss strikt sein, sonst kippt Pruefungs-Verhalten.
3. **Auto-Korrektur-Fragetypen mit "fertig"-Button-Logik** — Sortierung, FiBu könnten eigene Logik haben die im Konflikt steht. Step 7 fängt das ab.
4. **Tests mit `expect(...).toBeDisabled()` nach Antwort** — werden brechen, weil das neue Verhalten anders ist. Tests mit-anpassen, nicht überspringen.
5. **PDF-Annotation in Üben** — Übungstool nutzt PDF-Annotation? Falls ja: Selbstbewertung beim "Prüfen"-Klick. Falls nicht: kein Risiko.

---

## Quality Checklist (`qualitaet.md`)

- [ ] DRY: SelbstbewertungsDialog + UebenAktionsLeiste sind shared, nicht pro Fragetyp
- [ ] TypeScript strikt: Keine neuen `as any`
- [ ] Konsistenz: Nutzt bestehende `Button`-Komponente (`ui/Button.tsx`)
- [ ] LP/SuS-Trennung: nur Üben-Modus-Änderungen, Prüfungs-Modus unverändert
- [ ] Light/Dark Mode: alle neuen Komponenten mit `dark:`-Varianten
- [ ] Mobile: 44px Touch-Target

---

## Bezug auf Rules

- `regression-prevention.md` — Phase 3 Test-Plan + Phase 4 Security-Check verbindlich
- `qualitaet.md` — Vor/Während/Nach-Checkliste
- `bilder-in-pools.md` — Touch-Target ≥44px für Selbstbewertungs-Buttons
- `code-quality.md` — neue Dateien klein halten, keine Selektoren mit `.filter()`
- `design-system.md` — Buttons in Standard-Farben (violet=primary, grün/amber/rot=Selbstbewertung)
