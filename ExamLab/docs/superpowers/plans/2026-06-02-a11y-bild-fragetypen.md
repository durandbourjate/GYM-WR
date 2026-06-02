# a11y Bild-Fragetypen — Implementierungs-Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tastatur- und Screenreader-Bedienbarkeit für die drei Bild-Fragetypen (Hotspot, DragDrop-Bild, PDF-Annotation), rein additiv, ohne Touch/Pointer/Antwort-State zu verändern.

**Architecture:** Drei geteilte a11y-Bausteine (`aktivierbar`-Util, `useBildKoordinatenCursor`, `useSrAnsage`), auf die die drei Fragetyp-Komponenten aufsetzen. Jeder Tastatur-Pfad ruft dieselben bestehenden Handler/`onAntwort`. PDF-Freihand erhält die Text-Notiz als gleichwertige Alternative.

**Tech Stack:** React 19 + TypeScript + Vitest + @testing-library/react + Tailwind (`sr-only`). Spec: `docs/superpowers/specs/2026-06-02-a11y-bild-fragetypen-design.md`.

**Constraints (aus Spec §4, nicht verletzen):** (1) rein additiv; (2) Antwort-State/Korrektur/Storage unverändert; (3) kein Lösungs-Leak (neutrale Labels, `:focus-visible`). Bezug: `.claude/rules/bilder-in-pools.md` (Touch/44px), `.claude/rules/regression-prevention.md` (PDF = kritischer Prüfungs-Pfad).

---

## File Structure

**Neu:**
- `src/utils/a11y/aktivierbar.ts` — reine Util: Keyboard-Aktivierungs-Props (`role`/`tabIndex`/`onKeyDown`) für `<div>`-Controls. + `aktivierbar.test.ts`.
- `src/hooks/a11y/useSrAnsage.tsx` — `aria-live="polite"`-Ansage-Hook (`ansage(text)` + `ansageText`). + `useSrAnsage.test.tsx`.
- `src/hooks/a11y/useBildKoordinatenCursor.ts` — Pfeil-Cursor für Bild-Koordinaten (x/y %). + `useBildKoordinatenCursor.test.ts`.
- `src/components/fragetypen/pdf/PDFAnmerkungsliste.tsx` — SR-Panel: Liste aller Annotationen einer Seite + Löschen. + `PDFAnmerkungsliste.test.tsx`.

**Modifiziert:**
- `src/components/fragetypen/DragDropBildFrage.tsx` (`DragDropBildAufgabe`, Z. 48–285) + neu `DragDropBildFrage.test.tsx`.
- `src/components/fragetypen/HotspotFrage.tsx` (`HotspotAufgabe`, Z. 37–137) + neu `HotspotFrage.test.tsx`.
- `src/components/fragetypen/pdf/PDFSeite.tsx` (Z. 37–421) + neu `PDFSeite.a11y.test.tsx`.

**Phasen / Reihenfolge:** Phase 1 (Bausteine) → Phase 2 (DragDropBild) → Phase 3 (Hotspot) → Phase 4 (PDF, zuletzt wegen Prüfungs-Risiko) → Phase 5 (Verifikation & Merge-Gate). Jede Phase ist eigenständig grün/committbar; PDF kann bei Bedarf separat gemergt werden.

---

## Phase 1 — Geteilte Bausteine

### Task 1: `aktivierbar`-Util

**Files:**
- Create: `src/utils/a11y/aktivierbar.ts`
- Test: `src/utils/a11y/aktivierbar.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect, vi } from 'vitest'
import { aktivierbar } from './aktivierbar.ts'

function fakeKey(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as React.KeyboardEvent
}

describe('aktivierbar', () => {
  it('liefert role=button + tabIndex 0', () => {
    const p = aktivierbar(() => {})
    expect(p.role).toBe('button'); expect(p.tabIndex).toBe(0)
  })
  it('Enter und Space lösen onAktivieren aus + preventDefault', () => {
    const fn = vi.fn(); const p = aktivierbar(fn)
    const e1 = fakeKey('Enter'); p.onKeyDown(e1); expect(fn).toHaveBeenCalledTimes(1); expect(e1.preventDefault).toHaveBeenCalled()
    const e2 = fakeKey(' '); p.onKeyDown(e2); expect(fn).toHaveBeenCalledTimes(2)
  })
  it('andere Tasten tun nichts', () => {
    const fn = vi.fn(); aktivierbar(fn).onKeyDown(fakeKey('a')); expect(fn).not.toHaveBeenCalled()
  })
  it('disabled: tabIndex -1, keine Aktivierung', () => {
    const fn = vi.fn(); const p = aktivierbar(fn, { disabled: true })
    expect(p.tabIndex).toBe(-1); p.onKeyDown(fakeKey('Enter')); expect(fn).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run, verify FAIL** — `npx vitest run src/utils/a11y/aktivierbar.test.ts` → FAIL (Modul fehlt).

- [ ] **Step 3: Implement**

```ts
import type { KeyboardEvent } from 'react'

/** Macht ein nicht-natives Control (z.B. <div>) per Tastatur bedienbar.
 *  Rein additiv neben bestehende onClick/Pointer-Handler verwenden. */
export function aktivierbar(
  onAktivieren: () => void,
  opts: { disabled?: boolean } = {},
): { role: 'button'; tabIndex: number; onKeyDown: (e: KeyboardEvent) => void } {
  return {
    role: 'button',
    tabIndex: opts.disabled ? -1 : 0,
    onKeyDown: (e) => {
      if (opts.disabled) return
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAktivieren() }
    },
  }
}
```

- [ ] **Step 4: Run, verify PASS** — `npx vitest run src/utils/a11y/aktivierbar.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git add src/utils/a11y/ && git commit -m "feat(a11y): aktivierbar-Util für Tastatur-Aktivierung"`

### Task 2: `useSrAnsage`-Hook

**Files:**
- Create: `src/hooks/a11y/useSrAnsage.tsx`
- Test: `src/hooks/a11y/useSrAnsage.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSrAnsage } from './useSrAnsage.tsx'

describe('useSrAnsage', () => {
  it('ansage() setzt ansageText', () => {
    const { result } = renderHook(() => useSrAnsage())
    expect(result.current.ansageText).toBe('')
    act(() => result.current.ansage('«Konjunktur» in Zone 2 platziert'))
    expect(result.current.ansageText).toBe('«Konjunktur» in Zone 2 platziert')
  })
})
```

- [ ] **Step 2: Run, verify FAIL** — `npx vitest run src/hooks/a11y/useSrAnsage.test.tsx`.

- [ ] **Step 3: Implement**

```tsx
import { useCallback, useState } from 'react'

/** Lokale aria-live="polite"-Ansage (eine Instanz pro aktiver Frage; kein globaler Singleton). */
export function useSrAnsage() {
  const [ansageText, setAnsageText] = useState('')
  const ansage = useCallback((t: string) => setAnsageText(t), [])
  return { ansage, ansageText }
}
```

Konsument rendert: `<div aria-live="polite" aria-atomic="true" className="sr-only">{ansageText}</div>`

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git add src/hooks/a11y/useSrAnsage.* && git commit -m "feat(a11y): useSrAnsage (aria-live)"`

### Task 3: `useBildKoordinatenCursor`-Hook

**Files:**
- Create: `src/hooks/a11y/useBildKoordinatenCursor.ts`
- Test: `src/hooks/a11y/useBildKoordinatenCursor.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBildKoordinatenCursor } from './useBildKoordinatenCursor.ts'

function key(k: string, shift = false) { return { key: k, shiftKey: shift, preventDefault: vi.fn() } as unknown as React.KeyboardEvent }

describe('useBildKoordinatenCursor', () => {
  it('Pfeil bewegt um 2 %, Shift um 0,5 %', () => {
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren: vi.fn() }))
    act(() => result.current.onKeyDown(key('ArrowRight')))
    expect(result.current.pos.x).toBe(52)
    act(() => result.current.onKeyDown(key('ArrowRight', true)))
    expect(result.current.pos.x).toBeCloseTo(52.5)
  })
  it('clamp 0–100', () => {
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren: vi.fn(), start: { x: 99, y: 1 } }))
    act(() => result.current.onKeyDown(key('ArrowRight'))); act(() => result.current.onKeyDown(key('ArrowRight')))
    expect(result.current.pos.x).toBe(100)
    act(() => result.current.onKeyDown(key('ArrowUp'))); act(() => result.current.onKeyDown(key('ArrowUp')))
    expect(result.current.pos.y).toBe(0)
  })
  it('Enter platziert an aktueller Position', () => {
    const onPlatzieren = vi.fn()
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren, start: { x: 30, y: 40 } }))
    act(() => result.current.onKeyDown(key('Enter')))
    expect(onPlatzieren).toHaveBeenCalledWith({ x: 30, y: 40 })
  })
  it('disabled: kein Move, kein Platzieren', () => {
    const onPlatzieren = vi.fn()
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren, disabled: true }))
    act(() => result.current.onKeyDown(key('ArrowRight'))); act(() => result.current.onKeyDown(key('Enter')))
    expect(result.current.pos.x).toBe(50); expect(onPlatzieren).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import { useState, useCallback } from 'react'
import type { KeyboardEvent } from 'react'

const STANDARD_SCHRITT = 2     // % pro Pfeildruck
const FEIN_SCHRITT = 0.5       // % mit Shift
const clamp = (v: number) => Math.max(0, Math.min(100, v))

export function useBildKoordinatenCursor(opts: {
  onPlatzieren: (pos: { x: number; y: number }) => void
  disabled?: boolean
  start?: { x: number; y: number }
}) {
  const [pos, setPos] = useState(opts.start ?? { x: 50, y: 50 })
  const [aktiv, setAktiv] = useState(false)
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (opts.disabled) return
    const s = e.shiftKey ? FEIN_SCHRITT : STANDARD_SCHRITT
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, x: clamp(p.x - s) })); break
      case 'ArrowRight': e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, x: clamp(p.x + s) })); break
      case 'ArrowUp':    e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, y: clamp(p.y - s) })); break
      case 'ArrowDown':  e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, y: clamp(p.y + s) })); break
      case 'Enter': case ' ': e.preventDefault(); opts.onPlatzieren(pos); break
    }
  }, [opts, pos])
  return { pos, aktiv, onKeyDown }
}
```

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(a11y): useBildKoordinatenCursor (Pfeil-Cursor 2%/0.5%)"`

---

## Phase 2 — DragDrop-Bild

### Task 4: Pool-Chips tastaturbedienbar

**Files:** Modify `src/components/fragetypen/DragDropBildFrage.tsx` (Pool-Stacks Z. 226–247) · Create `src/components/fragetypen/DragDropBildFrage.test.tsx`

- [ ] **Step 1: Failing test** (mock `useFrageAdapter` wie in `RichtigFalschFrage.test.tsx`; `makeFrage()` mit `labels`+`zielzonen`):

```tsx
it('Pool-Chip ist per Tastatur fokussierbar und Enter wählt aus', async () => {
  render(<DragDropBildFrage frage={makeFrage()} />)
  const chip = screen.getByRole('button', { name: /Konjunktur/ })
  expect(chip).toHaveAttribute('tabindex', '0')
  fireEvent.keyDown(chip, { key: 'Enter' })
  expect(chip).toHaveAttribute('aria-pressed', 'true')
})
```

- [ ] **Step 2: Run, verify FAIL** (Chip ist noch kein `button`).
- [ ] **Step 3: Implement** — Pool-Stack-`<div>` (Z. 226) zusätzlich `{...aktivierbar(() => tapStack(s.text), { disabled })}` spreaden. `aria-pressed` bleibt. Import `aktivierbar` ergänzen.
- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(a11y): DragDropBild Pool-Chips tastaturbedienbar"`

### Task 5: Zonen-Refactor (group + Platzieren-Button + Entfernen-Chips) + Fokus + SR

**Files:** Modify `DragDropBildFrage.tsx` (Zonen Z. 168–209) · Test ergänzen.

> **Wichtig (Spec §10.3):** `onDrop`/`onDragOver`/`onDragLeave` bleiben am Zonen-Container (jetzt `role="group"`). Der flächige Platzieren-Button (`absolute inset-0`, `aria-label="In Zone N platzieren"`, `{...aktivierbar(() => handleZoneKlick(zone.id), { disabled })}`) ist ein Geschwister; die platzierten Chips bleiben darüber (höherer z-index) und werden selbst Buttons (`{...aktivierbar(() => entfernen(lid), { disabled })}`, `aria-label="«{text}» entfernen"`). **Keine verschachtelten Buttons.**

- [ ] **Step 1: Failing tests**
  - Zone hat `role="group"` mit Namen „Zone …".
  - Enter auf Platzieren-Button platziert das ausgewählte Label (→ `onAntwort` mit `zuordnungen`).
  - Enter auf platziertem Chip entfernt es.
  - **Kein verschachtelter Button:** `within(zoneGroup).getByRole('button', {name:/platzieren/i})` und die Chip-Buttons sind **Geschwister** (kein `button` als Vorfahre eines `button`).
  - **Fokus-Management:** nach Platzieren liegt `document.activeElement` auf der Zone/dem Platzieren-Button, nicht auf `<body>`.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — Zonen-`<div>` → `role="group"` + `aria-label="Zone {n} ({belegt|leer})"`; Drop-Handler bleiben dort. Darin: `<button className="absolute inset-0" aria-label … {...aktivierbar(...)} />` (hinter den Chips) + Chips als Buttons. `useSrAnsage` einbinden, `ansage()` bei platzieren/entfernen, `ansageText`-Region rendern. Fokus nach Aktion via `ref` auf den Platzieren-Button setzen.
- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Verify additiv** — `npx vitest run src/tests/DragDropBildFrageOutline.test.tsx` (bestehender Test bleibt grün → Maus/Drop unberührt).
- [ ] **Step 6: Commit** — `git commit -m "feat(a11y): DragDropBild Zonen keyboard + Fokus + SR-Ansage"`

---

## Phase 3 — Hotspot

### Task 6: Region-Overlays (SR-Pfad)

**Files:** Modify `src/components/fragetypen/HotspotFrage.tsx` (`HotspotAufgabe`, Bild-Block Z. 92–116) · Create `src/components/fragetypen/HotspotFrage.test.tsx`

> Helper: `zentroid(punkte)` + `positionsPhrase(zentroid)` → 3×3-Raster (Spec §10.2): vertikal {oben|Mitte|unten} × horizontal {links|Mitte|rechts}. In `src/utils/a11y/bildPosition.ts` (+ Test) oder inline; bevorzugt eigenes Util mit Test.

- [ ] **Step 1: Failing tests**
  - Pro `bereich` ein `button` mit `aria-label` „Bereich i von n, {position}" — **enthält NICHT** `bereich.label` (No-Leak-Zahn-Test).
  - Overlay-Button hat `pointer-events: none` (style) und `tabIndex 0`.
  - Enter platziert Marker im Zentroid → `onAntwort({typ:'hotspot', klicks:[{x,y}]})` mit Zentroid-Koordinaten.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — Über dem Bild je `bereich` ein transparenter `<button>` an der Bounding-Box (`left/top/width/height` aus `zoneBBox`-Äquivalent, Muster wie DragDropBild Z. 185–188), `style={{ pointerEvents:'none' }}`, `aria-label` neutral+Position, `onKeyDown` Enter/Space → `handleKlick`-Logik mit Zentroid. `useSrAnsage` für „Markierung gesetzt". Marker-Rendering (Z. 108) unverändert.
- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(a11y): Hotspot Region-Auswahl (SR-Pfad, pointer-events:none)"`

### Task 7: Pfeil-Cursor (sehender Tastatur-Pfad) + Fokus

**Files:** Modify `HotspotFrage.tsx` (Bild-Container Z. 93–96) · Test ergänzen.

- [ ] **Step 1: Failing tests**
  - Bild-Container hat `tabIndex 0`, `role="application"`, `aria-label` mit Anleitung.
  - Pfeiltaste zeigt das Fadenkreuz (`aktiv`), Enter platziert an Cursor-Pos → `onAntwort`.
  - Nach „Zurücksetzen" liegt Fokus auf dem Bild-Container (nicht `<body>`).
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — `useBildKoordinatenCursor({ disabled, onPlatzieren: pos => handleKlick-Logik(pos) })`; Container `tabIndex=0 role="application" aria-label=… onKeyDown={cursor.onKeyDown}` (zusätzlich zum bestehenden `onClick`); Fadenkreuz-`<div>` bei `cursor.aktiv` an `cursor.pos` (pointer-events:none). Reset-Button: `ref` + `.focus()` nach Reset.
- [ ] **Step 4: Run, verify PASS** + `:focus-visible`-Styles (nur Tastatur sichtbar). Hinweis: `role="application"` am Container fängt Pfeiltasten aus dem SR-Virtual-Cursor ab (gewollt für den Cursor-Pfad) — im Browser-Test (Task 11) bestätigen, dass **beide** Pfade (Region-Overlays aus Task 6 **und** Pfeil-Cursor) unter VoiceOver erreichbar bleiben.
- [ ] **Step 5: Commit** — `git commit -m "feat(a11y): Hotspot Pfeil-Cursor + Fokus-Management"`

---

## Phase 4 — PDF-Annotation (Prüfungstool, zuletzt)

### Task 8: `PDFAnmerkungsliste`-Komponente

**Files:** Create `src/components/fragetypen/pdf/PDFAnmerkungsliste.tsx` + `PDFAnmerkungsliste.test.tsx`

- [ ] **Step 1: Failing test** — rendert eine Liste (`role="list"`) aus `annotationen`, jeder Eintrag beschreibt Typ + Ziel + hat „Löschen"-Button; Klick/Enter ruft `onAnnotationLoeschen(id)`; nach Löschen Fokus auf nächsten Eintrag bzw. Überschrift.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — Props `{ annotationen: PDFAnnotation[]; onLoeschen: (id)=>void; readOnly?: boolean }`. Pro Annotation lesbarer Text je `werkzeug` („Textmarker auf «…»", „Kommentar: …", „Text-Anmerkung «…»", „Freihand-Zeichnung", „Etikett …"). `<ul role="list">` mit `<li>` + „Löschen"-`<button>`. Bei `readOnly` keine Lösch-Buttons. Fokus-Management nach Löschen via Index-Ref.
- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(a11y): PDFAnmerkungsliste (Review + Löschen, SR-tauglich)"`

### Task 9: PDFSeite — Liste mounten + Toolbar-ARIA + Text/Kommentar-Cursor

**Files:** Modify `src/components/fragetypen/pdf/PDFSeite.tsx` · ggf. `PDFViewer.tsx` (Mount-Punkt prüfen) · `src/components/fragetypen/pdf/PDFToolbar.tsx` (ARIA) · Create `PDFSeite.a11y.test.tsx`

- [ ] **Step 1: Mount-Punkt = `PDFViewer`** (Reviewer-Empfehlung, kurz gegenprüfen) — `PDFViewer.tsx` filtert `annotationen` bereits **pro Seite** (≈ Z. 119) und hält `onAnnotationLoeschen` zentral. Darum die `PDFAnmerkungsliste` in `PDFViewer` mounten (Liste über **alle** Seiten = bessere SR-Review-Fläche), nicht in der per-Seite-`PDFSeite`. Mount-Punkt im Code verifizieren, dann umsetzen.
- [ ] **Step 2: Failing tests** — Toolbar-Buttons haben `type="button"`+`aria-label`+`aria-pressed` fürs aktive Werkzeug; bei aktivem Text/Kommentar-Werkzeug bewegt Pfeil den Cursor auf der Seite und Enter öffnet das bestehende Text-Overlay/Popover an Cursor-Pos.
- [ ] **Step 3: Run, verify FAIL.**
- [ ] **Step 4: Implement** — `PDFAnmerkungsliste` neben dem Canvas mounten (additiv). Toolbar-ARIA ergänzen (verifizieren was schon da ist). `useBildKoordinatenCursor` am fokussierbaren Seiten-Container für `aktivesWerkzeug ∈ {text, kommentar}` → bei Enter `setTextOverlay`/`setKommentarPopover` an Cursor-Pos (relX/relY aus Cursor statt Maus). Kommentar-Popover Fokusfalle ergänzen.
- [ ] **Step 5: Run, verify PASS.**
- [ ] **Step 6: Commit** — `git commit -m "feat(a11y): PDFSeite Anmerkungsliste + Toolbar-ARIA + Text/Kommentar-Cursor"`

### Task 10: PDFSeite — Freihand→Text-Notiz-Umlenkung

**Files:** Modify `PDFSeite.tsx` · Test ergänzen.

- [ ] **Step 1: Failing test** — bei `aktivesWerkzeug === 'freihand'` und Tastatur-Fokus erscheint ein Hinweis „Zeichnen ist per Tastatur nicht verfügbar — nutze die Text-Notiz" (`role="note"`/sichtbar), kein Crash, keine Pointer-Änderung.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — additiver Hinweis-Block, nur Tastatur-Kontext; lenkt auf Text-Werkzeug. Kein neues Antwort-Schema.
- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(a11y): PDF Freihand→Text-Notiz-Hinweis (Alternative)"`

---

## Phase 5 — Verifikation & Merge-Gate

### Task 11: Gates, Browser/Staging-E2E, Security, Handoff

- [ ] **Gates:** `npx tsc -b` · `npx vitest run` (alle neuen + bestehenden grün) · `npm run build` · `npm run ci-check` (inkl. react-doctor — **keine neuen a11y-Errors**, idealerweise weniger Warnings).
- [ ] **Browser/Staging-E2E** (jsdom deckt SR/Fokus/Layout NICHT ab):
  - Tastatur-Durchlauf DragDropBild + Hotspot (beide Pfade) + PDF: Tab-Reihenfolge, Enter/Space, Hotspot-Pfeil-Cursor, Fokus-Ringe (`:focus-visible`) in **Light + Dark**. Werkzeuge: Preview-Snapshot (a11y-Baum), preview_eval (Key-Events), Screenshot (Fokus-Ringe).
  - **PDF voller Regression-Prevention-Lauf** (`.claude/rules/regression-prevention.md`): echter LP+SuS-Login, PDF-Fragetyp end-to-end — setzen / löschen / Abgabe / Korrektur. Verwandte Fragetypen der Bild/Medien-Gruppe gegentesten.
  - Optional: VoiceOver-Lauf (Mac).
- [ ] **Security/Integrität (Phase 4 der regression-prevention):** Korrektheit identisch Maus- vs. Tastatur-Pfad; **No-Leak** im DOM/aria der SuS-Sicht (kein Antwort-Label in fokussierbaren Elementen); keine neue Persistenz sensibler Daten; PDF-Prüfungsintegrität unverändert.
- [ ] **HANDOFF.md** aktualisieren (a11y-Feature LIVE/Status); Merge-Gate erst nach LP-Freigabe; **kein** Direkt-Commit auf `main`.

---

## Hinweise für Implementierende

- **TDD strikt:** erst Test (rot), dann minimale Implementierung (grün), dann Commit. Skill `@superpowers:test-driven-development`.
- **Rein additiv:** niemals bestehende `onClick`/`onPointer`/`onDrag`-Handler entfernen oder umbauen — nur ergänzen.
- **No-Leak ist eine Zahn-Invariante:** der Test „Region-`aria-label` enthält nicht das Antwort-Label" muss in Task 6 rot werden, wenn jemand das Label durchreicht.
- **PDF ist exam-kritisch:** Phase 4 nicht vor Phase 1–3 grün; Phase 4 nur mit dem vollen Browser-Protokoll mergen.
- **Test-Mock-Form (tsc-Falle):** Für die neuen colocated Komponenten-Tests die **untypisierte** `useFrageAdapter`-Mock-Form aus `RichtigFalschFrage.test.tsx` kopieren — NICHT als `FrageAdapterResult` typisieren (wie `DragDropBildFrageOutline.test.tsx`), sonst verlangt `tsc -b` alle 14 Felder und der Build bricht.
- Sprach-Konvention (`code-quality.md` §Sprach-Konvention): Domain deutsch (`ansage`, `bereich`, `zone`), Programming-Primitives englisch (`role`, `tabIndex`, `onKeyDown`).
