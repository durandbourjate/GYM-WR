# Bundle V — PDFSeite Pure-Cut + Hook-Extraktion

**Datum:** 2026-05-08
**Status:** Draft (vor Spec-Review)
**Vorgänger:** Bundle U (useDrawingEngine Pure-Logic-Cut, Merge `c79747c` 2026-05-08)
**Roadmap:** Phase 4 des Vereinfachungs-Audits ([`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md), Bundle-V im Audit als „PDFSeite Hoch-Risiko-Split (950 Z., 17 Props, DOM-Selection + PDF.js + Canvas)" gerahmt).

## 1. Kontext

`ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` (950 Zeilen) ist der zweite von drei verbleibenden Hoch-Risiko-Files aus dem Audit (nach `useDrawingEngine.ts` 752 Z. — Bundle U gemergt — und vor `uebungsStore.ts` 684 Z. — Bundle W in Folge-Session).

PDFSeite.tsx ist eine React-Component mit:
- 17 Props (Werkzeug, Annotationen, Callbacks, readOnly-Flag),
- 14 useState/useRef-Deklarationen für Canvas-Refs, Selection-State, Overlay-State, Drawing-State,
- 8 useCallbacks (handleMouseUp, handleClick, handleKommentarSave, handleTextSave, handleDoubleClick, handleTextEditSave, handleDrawStart/Move/End),
- 2 useEffects (PDF-Render-Trigger, Canvas-Resize),
- 6 SVG-Render-Funktionen (Highlight/Label/Kommentar/Freihand/Text + Switch-Dispatcher),
- 5 Pure-DOM-Helpers (Selection→TextRange, Span-Rect-Geometry).

Es existieren **keine** Vitest-Tests für die Datei oder ihre Sub-Funktionen — jede Verhalts-Drift bei Cut wäre nur durch Browser-E2E erkennbar.

PDFSeite.tsx wird ausschliesslich von `PDFViewer.tsx:115` konsumiert (1 Caller) — kein API-Drift-Risiko. Der Sub-Folder `pdf/` enthält neben PDFSeite.tsx noch `PDFViewer.tsx` (150 Z.), `PDFToolbar.tsx` (410 Z.), `usePDFRenderer.ts` (119 Z.), `usePDFAnnotations.ts` (120 Z.), `PDFTypes.ts` (41 Z., re-exports + lokale Types), `PDFKommentarPopover.tsx` (30 Z.), `PDFKategorieChooser.tsx` (30 Z.). Bundle V berührt nur PDFSeite.tsx — neue Sub-Files landen in einem neuen Sub-Folder `pdf/seite/` (analog Bundle-U `zeichnen/`-Pattern war Top-Level-Co-Location, aber `pdf/` hat bereits 8 Files Top-Level → Sub-Folder hält die Übersicht).

## 2. Ziel

`PDFSeite.tsx` von 950 Z. auf **<500 Z.** reduzieren (raus aus Hotspot-Set), **2 Pure-Logic-Sub-Files** + **2 Hook-Sub-Files** extrahieren, **alle 4** mit Vitest-Tests versehen. Hotspot-Bilanz Code-Files (>500 Z., ohne data/test) **11 → 10**. Coverage-Lücke schliessen: erstmals Tests für PDF-Selection-DOM-Logic, SVG-Annotation-Rendering, Drag-Math, Text-Edit-State.

## 3. Scope

### In Scope

| Sub | File | heute | nachher | Verantwortung |
|---|---|---:|---:|---|
| Modify | `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` | 950 Z. | ~480 Z. | Component-Body: Props-Destructure, 4× Layer-Refs, 2× useEffect (Render+Resize), `textLayerSpans` JSX-Map, `handleMouseUp`/`handleKategorieSelect`/`handleClick`/`handleKommentarSave`/`handleTextSave`, JSX (4 Layer + 4 Overlays/Popovers), cursor-Computation |
| New | `ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.ts` | – | ~95 Z. | `erzeugeId`, `findeSpanRects`, `leseTextauswahl`, `findeSpanRectsRelativ`, `berechneFallbackRects`, `SimpleRect`-Interface |
| New | `ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.test.ts` | – | ~180 Z. | Vitest mit jsdom-DOM-Fixture (~10 Tests) |
| New | `ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.tsx` | – | ~220 Z. | `renderSVGOverlay` + `renderHighlight` + `renderLabel` + `renderKommentarMarker` + `renderFreihand` + `renderTextAnnotation` |
| New | `ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx` | – | ~150 Z. | Vitest via `@testing-library/react` `render` (~8 Tests) |
| New | `ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.tsx` | – | ~70 Z. | Hook: `editierendeAnnotation` State + `handleDoubleClick` + `handleTextEditSave` + `EditInput`-JSX als ReactNode-Return-Property (siehe §4.4). Endung `.tsx`, weil der Hook JSX konstruiert. |
| New | `ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.test.tsx` | – | ~120 Z. | Vitest via `renderHook` + Mock-Annotation (~5 Tests) |
| New | `ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.ts` | – | ~155 Z. | Hook: `dragRef` + `istZeichnung` + `zeichnungsPfad` + `handleDrawStart` + `handleDrawMove` + `handleDrawEnd` (Drag-Text + Drag-Freihand + Freihand-Draw vereint) |
| New | `ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.test.ts` | – | ~120 Z. | Vitest für Drag-Math + State-Transitions (~5 Tests, Canvas-2D-Aufrufe via Browser-E2E abgedeckt) |

### Out of Scope

- `uebungsStore.ts` (684 Z.) — separates Bundle W, eigene Spec
- Andere Files in `pdf/` (PDFViewer, PDFToolbar, usePDFRenderer, usePDFAnnotations, PDFTypes, PDFKommentarPopover, PDFKategorieChooser) — alle unverändert
- `handleClick` mit 5-Tool-Branches (Radierer/Auswahl/Text/Kommentar) — bleibt in PDFSeite, kein Cut (es ist Routing-Logik, keine eigene Domain)
- Verhaltensänderungen (auch keine Performance-Optimierungen, keine Memoisierungs-Verbesserungen)
- Apps Script / Backend / Wire-Vertrag / persistierter `PDFAnnotation`-JSON-Vertrag — alle unangetastet
- 17 Props der Component — keine Reduktion, keine Default-Werte ändern
- Inline-IIFE für Lösch-Button (Z. 651–670) — bleibt in PDFSeite, byte-identisch
- Vitest für `PDFSeite.tsx` selbst — Integration zwischen Sub-Files via Browser-E2E (jsdom hat keine Canvas-2D + kein PDF.js)

## 4. Architektur

### 4.1 Datei-Struktur

```
ExamLab/src/components/fragetypen/pdf/                       # existing
├── PDFSeite.tsx                                             ← Modify (950 → ~480 Z.)
├── PDFViewer.tsx                                            (existing, unverändert)
├── PDFToolbar.tsx                                           (existing, unverändert)
├── PDFTypes.ts                                              (existing, unverändert)
├── PDFKategorieChooser.tsx                                  (existing, unverändert)
├── PDFKommentarPopover.tsx                                  (existing, unverändert)
├── usePDFAnnotations.ts                                     (existing, unverändert)
├── usePDFRenderer.ts                                        (existing, unverändert)
└── seite/                                                   ← New Sub-Folder
    ├── pdfSelection.ts                                      ← New
    ├── pdfSelection.test.ts                                 ← New
    ├── pdfAnnotationenSVG.tsx                               ← New
    ├── pdfAnnotationenSVG.test.tsx                          ← New
    ├── usePDFTextEdit.tsx                                   ← New
    ├── usePDFTextEdit.test.tsx                              ← New
    ├── usePDFDrawing.ts                                     ← New
    └── usePDFDrawing.test.ts                                ← New
```

Sub-Folder-Konvention: Pure-Logic-Files mit Prefix `pdf*`, Hooks mit Prefix `use*`. Tests neben Source (Heuristik B aus Bundle Q). `.tsx` für Files, die JSX/React.ReactNode emittieren oder Component/Hook sind, der JSX zurückgibt.

### 4.2 `pdfSelection.ts` API

Pure-Functions, keine React-Imports.

```typescript
// ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.ts
import type { PDFTextRange, PDFSeitenInfo } from '../PDFTypes.ts'

export interface SimpleRect { x: number; y: number; w: number; h: number }

export function erzeugeId(): string
export function findeSpanRects(
  container: HTMLDivElement, startOffset: number, endOffset: number,
): DOMRect[]
export function leseTextauswahl(container: HTMLDivElement): PDFTextRange | null
export function findeSpanRectsRelativ(
  container: HTMLDivElement, startOffset: number, endOffset: number,
  containerBreite: number, containerHoehe: number,
): SimpleRect[]
export function berechneFallbackRects(
  textRange: PDFTextRange, seitenInfo: PDFSeitenInfo,
): SimpleRect[]
```

Byte-identisch von Z. 32–95 + Z. 916–950 in PDFSeite.tsx übernommen. `_containerBreite`/`_containerHoehe` Underscore-Prefix (unused) bleibt aus Konsistenz mit Original.

### 4.3 `pdfAnnotationenSVG.tsx` API

```typescript
// ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.tsx
import type {
  PDFAnnotation, PDFHighlightAnnotation, PDFKommentarAnnotation,
  PDFFreihandAnnotation, PDFLabelAnnotation, PDFTextAnnotation,
} from '../PDFTypes.ts'
import type { PDFSeitenInfo, ZoomStufe } from '../PDFTypes.ts'
import { findeSpanRectsRelativ, berechneFallbackRects } from './pdfSelection.ts'
import type { SimpleRect } from './pdfSelection.ts'

export function renderSVGOverlay(
  annotationen: PDFAnnotation[],
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
  zoom: ZoomStufe,
  selectedAnnotationId?: string | null,
): React.ReactNode[]

// Sub-Renderer (intern, nicht exportiert):
//   renderHighlight, renderLabel, renderKommentarMarker, renderFreihand, renderTextAnnotation
```

Byte-identisch von Z. 697–912 übernommen. Nur 1 Public-Export (`renderSVGOverlay`); Sub-Renderer bleiben modul-intern, weil sie nur intern aufgerufen werden.

### 4.4 `usePDFTextEdit.ts` API

```typescript
// ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.tsx
import { useState, useCallback, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { PDFAnnotation, PDFTextAnnotation, PDFSeitenInfo } from '../PDFTypes.ts'

interface UsePDFTextEditParams {
  readOnly: boolean | undefined
  seitenInfo: PDFSeitenInfo | null
  annotationen: PDFAnnotation[]
  containerRef: RefObject<HTMLDivElement>
  onAnnotationEditieren: ((id: string, updates: Partial<PDFAnnotation>) => void) | undefined
}

interface UsePDFTextEditResult {
  /** True während ein Text-Annotation-Edit aktiv ist (für andere Hooks/Callbacks). */
  istEditierend: boolean
  /** Doppelklick-Handler für PDFSeite-Container — startet Edit, sonst no-op. */
  handleDoubleClick: (e: React.MouseEvent) => void
  /** Edit aktiv beenden (z. B. wenn Klick aussen passiert) — von handleClick aus aufgerufen. */
  beendeEdit: () => void
  /** ReactNode für Edit-Input-Overlay (oder null, wenn nicht editierend). */
  editOverlay: ReactNode
}

export function usePDFTextEdit(params: UsePDFTextEditParams): UsePDFTextEditResult
```

**`editOverlay`-Pattern**: Hook gibt fertige JSX als ReactNode zurück, statt Sub-Komponente zu sein. Das vermeidet zusätzliche React-Tree-Tiefe und ist Bundle-T.d-Pattern (`useTextOverlay` aus Bundle T.d). PDFSeite.tsx rendert `{editOverlay}` an Stelle des bisherigen `{editierendeAnnotation && (...)}`-IIFE.

**`istEditierend`** wird von PDFSeite.tsx in `handleClick` (Z. 244) konsumiert (Auswahl-Branch beendet Edit). `beendeEdit` ist die Bridge dafür.

**`textEditInputRef`** ist Hook-internal (im Hook-Body via `useRef<HTMLInputElement>(null)` deklariert, nur im Edit-Input-JSX als `ref={textEditInputRef}` referenziert). PDFSeite.tsx hält keine Referenz auf das Input-Element mehr. Auto-Focus via `setTimeout(() => textEditInputRef.current?.focus(), 30)` bleibt im Hook (byte-identisch).

### 4.5 `usePDFDrawing.ts` API

```typescript
// ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.ts
import { useRef, useCallback } from 'react'
import type { RefObject } from 'react'
import type {
  PDFAnnotation, PDFFreihandAnnotation, PDFTextAnnotation, PDFSeitenInfo,
  PDFToolbarWerkzeug,
} from '../PDFTypes.ts'
import { erzeugeId } from './pdfSelection.ts'

interface UsePDFDrawingParams {
  readOnly: boolean | undefined
  aktivesWerkzeug: PDFToolbarWerkzeug
  seitenNr: number
  aktiveFarbe: string
  seitenInfo: PDFSeitenInfo | null
  annotationen: PDFAnnotation[]
  selectedAnnotation: string | null
  containerRef: RefObject<HTMLDivElement>
  zeichenCanvasRef: RefObject<HTMLCanvasElement>
  onAnnotationHinzufuegen: (a: PDFAnnotation) => void
  onAnnotationEditieren: ((id: string, updates: Partial<PDFAnnotation>) => void) | undefined
}

interface UsePDFDrawingResult {
  handleDrawStart: (e: React.PointerEvent) => void
  handleDrawMove: (e: React.PointerEvent) => void
  handleDrawEnd: () => void
}

export function usePDFDrawing(params: UsePDFDrawingParams): UsePDFDrawingResult
```

Byte-identische Übernahme von Z. 132–134 (Refs) + Z. 377–516 (3 useCallbacks). Dep-Arrays werden 1:1 von Original übernommen — Per-Phase-Reviewer prüft Dep-für-Dep.

**Keine Aufspaltung Drag/Freihand**: Beide teilen `dragRef` als Discriminator und sind im Original in einem Pointer-Down/Move/Up-Triple verschachtelt. Aufspaltung würde Race-Möglichkeiten an der Pointer-Event-Reihenfolge eröffnen.

### 4.6 PDFSeite.tsx Konsum

```typescript
// PDFSeite.tsx (Auszug, ~480 Z. final)
import { renderSVGOverlay } from './seite/pdfAnnotationenSVG.tsx'
import { leseTextauswahl, erzeugeId } from './seite/pdfSelection.ts'
import { usePDFTextEdit } from './seite/usePDFTextEdit.tsx'
import { usePDFDrawing } from './seite/usePDFDrawing.ts'

export function PDFSeite({ /* 17 Props */ }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const zeichenCanvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [seitenInfo, setSeitenInfo] = useState<PDFSeitenInfo | null>(null)

  // ... Popover/Overlay states bleiben (kommentarPopover, textOverlay, kategorieChooser) ...

  // Bundle-T.d-Hook-Result-Destrukturierungs-Pattern (PFLICHT, sonst Render-Identity-Drift):
  const { istEditierend, handleDoubleClick, beendeEdit, editOverlay } = usePDFTextEdit({
    readOnly, seitenInfo, annotationen, containerRef, onAnnotationEditieren,
  })
  const { handleDrawStart, handleDrawMove, handleDrawEnd } = usePDFDrawing({
    readOnly, aktivesWerkzeug, seitenNr, aktiveFarbe, seitenInfo, annotationen,
    selectedAnnotation, containerRef, zeichenCanvasRef,
    onAnnotationHinzufuegen, onAnnotationEditieren,
  })

  // ... handleMouseUp/handleClick/handleKommentarSave/handleTextSave bleiben hier ...
  // handleClick ruft `if (istEditierend) beendeEdit()` statt direkt setEditierendeAnnotation(null) ...

  const svgContent = seitenInfo ? renderSVGOverlay(
    annotationen, seitenInfo, textLayerRef.current, zoom, selectedAnnotation
  ) : null

  return (
    <div ref={containerRef} ... onDoubleClick={handleDoubleClick}
      onPointerDown={handleDrawStart} onPointerMove={handleDrawMove}>
      {/* 4 Layer + 3 Popover/Overlays bleiben */}
      {editOverlay}
    </div>
  )
}
```

## 5. Test-Strategie

### 5.1 Vitest

| File | Test-Approach | Tests |
|---|---|---|
| `pdfSelection.ts` | jsdom-DOM-Fixture: `<div><span data-offset="0">foo</span><span data-offset="3">bar</span></div>` rendern (`document.body.innerHTML = ...`); `getBoundingClientRect` per `Object.defineProperty` mit deterministischen Werten mocken. `leseTextauswahl` mit Fake-Selection-Range über `window.getSelection()`-Stub. Edge-Cases: leere Selection, Range-Out-of-Bounds, Span-Übersprung. | ~10 |
| `pdfAnnotationenSVG.tsx` | `@testing-library/react` `render(<svg>{renderSVGOverlay(...)}</svg>)`, dann `container.querySelector('[data-annotation-id="..."]')` für jeden Annotation-Typ. Pro Typ: 1 Default-Render-Test + 1 Selected-Branch-Test (wo zutreffend: Freihand, Text). Highlight/Label gegen Mock-textLayer + Fallback-Pfad. | ~8 |
| `usePDFTextEdit.tsx` | `@testing-library/react` `renderHook(() => usePDFTextEdit({...}))`. Tests: Idle-State (`istEditierend === false`, `editOverlay === null`); `handleDoubleClick` auf nicht-Text-Annotation = no-op; `handleDoubleClick` auf Text-Annotation setzt State; `beendeEdit` resettet; `handleTextEditSave` ruft `onAnnotationEditieren` mit getrimmtem Text. | ~5 |
| `usePDFDrawing.ts` | `@testing-library/react` `renderHook` + Mock-PointerEvents via `act`. Tests (nur **Drag-Math** + State-Transitions): Drag-Start auf nicht-selektierter Annotation = no-op; Drag-Start auf Text-Annotation setzt `dragRef`; Drag-Move auf Text ruft `onAnnotationEditieren` mit verschobener Position; Drag-Move auf Freihand verschiebt alle Punkte; Drag-End räumt `dragRef` + `data-drag-orig-punkte` auf. **Canvas-`ctx.lineTo`-Aufrufe** und **Freihand-Strich-Pfad** = Browser-E2E. | ~5 |

**Vitest-Drift-Toleranz:** ≥ +25, Ziel 1401 → 1429 (10 + 8 + 5 + 5 = 28). 0 Failures.

### 5.2 Browser-E2E (alle 11 Pfade auf staging mit echtem LP-Login)

Vor E2E: SW-unregister + caches.delete + reload (Memory-Lehre Bundle N).

| # | Pfad | Phase mit Pflicht-Verifikation |
|---|---|---|
| 1 | PDF mit ≥2 Seiten laden, Seite 1 + 2 rendern | Phase 5 |
| 2 | Highlighter → Text auswählen → Highlight erscheint | Phase 5 |
| 3 | Label → Text auswählen → KategorieChooser → Auswahl → farbiges Label | Phase 5 |
| 4 | Kommentar → klicken → Popover → speichern → 💬-Marker | Phase 5 |
| 5 | Freihand → zeichnen → SVG-Pfad nach Pointer-Up | Phase 4 + Phase 5 |
| 6 | Text → klicken → Input → eingeben + Enter → SVG-Text | Phase 5 |
| 7 | Doppelklick auf Text-Annotation → Edit-Input → Enter → Text aktualisiert | Phase 3 + Phase 5 |
| 8 | Auswahl + Drag Text-Annotation → Position aktualisiert | Phase 4 + Phase 5 |
| 9 | Auswahl + Drag Freihand-Annotation → alle Punkte verschoben | Phase 4 + Phase 5 |
| 10 | Auswahl + Lösch-Button → Annotation entfernt | Phase 5 |
| 11 | Radierer → Klick auf Annotation → entfernt | Phase 5 |

## 6. Phasen + Reviewer-Pattern

| Phase | Inhalt | Risk | Reviewer | Browser-E2E |
|---|---|---|---|---|
| **0** | Plan-Reviewer-Iteration auf separatem Plan-Dokument (`docs/superpowers/plans/2026-05-08-bundle-v-pdfseite-split.md`) | – | Plan-Reviewer | – |
| **1** | `pdfSelection.ts` Cut + 10 Vitest. tsc + vitest + lint clean | niedrig | Per-Phase Code-Reviewer | – |
| **2** | `pdfAnnotationenSVG.tsx` Cut + 8 Vitest. tsc + vitest + lint + build clean | niedrig | Per-Phase Code-Reviewer | – |
| **3** | `usePDFTextEdit.tsx` Cut + 5 Vitest. tsc + vitest + lint + build clean | mittel | Per-Phase Code-Reviewer | Pfad 7 |
| **4** | `usePDFDrawing.ts` Cut + 5 Vitest. tsc + vitest + lint + build clean | hoch | Per-Phase Code-Reviewer | Pfade 5+8+9 |
| **5** | Final Code-Reviewer auf gesamten Diff + Browser-E2E **alle 11 Pfade** auf staging | – | Final-Reviewer | Pfade 1–11 |
| **6** | HANDOFF-Eintrag + Memory-Update + `git log preview ^main`-Check (Preview-Force-Push-Regel) + Merge in main + preview→main reset + Branch-Cleanup | – | – | – |

Pro Phase: atomic Commit. Reviewer-Iterationen können Re-Commits auf gleicher Phase auslösen.

## 7. Risiken

| # | Risiko | Mitigation |
|---|---|---|
| 1 | **Hook-Result-Destrukturierung** (Bundle T.d-Lehre): `const drawing = usePDFDrawing(...)` invalidiert pro Render | PDFSeite.tsx **destrukturiert** in stabile Namen. Per-Phase-Reviewer prüft. |
| 2 | **Closure-Capture-Bugs** beim Hook-Move (Drawing-Hook 11 Dep-Slots über 3 useCallbacks: handleDrawStart=6, handleDrawMove=2, handleDrawEnd=3; TextEdit-Hook 6 Dep-Slots über 2 useCallbacks: handleDoubleClick=4, handleTextEditSave=2) | Byte-identische Dep-Array-Übernahme. Per-Phase Reviewer 1:1-Mapping-Check. |
| 3 | **`containerRef`-Sharing** über Hook-Grenze (für `data-drag-orig-punkte`-Mutation in Drag-Move) | Hook-Param `containerRef: RefObject<HTMLDivElement>`. Mutation byte-identisch im Hook. |
| 4 | **Drag-State + Freihand-State** in einer State-Maschine — Aufspaltung würde Race auslösen | Zusammen in `usePDFDrawing` lassen, kein Sub-Cut. |
| 5 | **Service-Worker-Cache** (Bundle N-Lehre) | E2E-Vorlauf: SW-unregister + caches.delete + reload, dokumentiert in Phase 5. |
| 6 | **Keine bestehenden Tests** für PDFSeite | Neue Vitest-Tests (~28) als Safety-Net. Browser-E2E auf staging als finale Verifikation. |
| 7 | **`onAnnotationEditieren?`-Optional-Chain** in Drag-Branch | byte-identisch übernehmen, kein Defaulting im Hook. |
| 8 | **TypeScript-Casts** (`as PDFTextAnnotation`, `as Partial<PDFAnnotation>`, `as PDFFreihandAnnotation`) | byte-identisch im Hook übernehmen. Alle sind sub-type-discriminating Casts auf `PDFAnnotation` Discriminated-Union, nicht `as any`. |
| 9 | **Cross-File-Dep** zwischen `pdfSelection` und `pdfAnnotationenSVG` (`findeSpanRectsRelativ` import) | Single-Direction-Import, kein Zyklus. |
| 10 | **`tsc -b` EXIT=0 trotz Type-Errors** (Bundle L-Lehre) | Per-Phase: tsc-Output direkt prüfen, nicht nur Exit-Code. |
| 11 | **`textLayerSpans` JSX-Inline-Map** (Z. 160-178) bleibt in PDFSeite.tsx — kein Cut, weil eng an `seitenInfo + zoom` gekoppelt | Bestätigt im Scope §3 (Out of Scope). |
| 12 | **Inline-IIFE Lösch-Button** (Z. 651-670) bleibt in PDFSeite.tsx | Bestätigt im Scope §3 (Out of Scope). |

## 8. Definition of Done

- ✅ `PDFSeite.tsx` <500 Z. (raus aus Hotspot, Files >500 Z. **11 → 10**)
- ✅ vitest +25..+30 (1401 → ~1429), 0 Failures, 0 neue Warnings
- ✅ tsc -b clean (mit Output-Inspection, **nicht** nur Exit-Code)
- ✅ 4× lint clean (`as-any`, `no-tests-dir`, `no-alert`, `musterloesung`)
- ✅ build clean
- ✅ Browser-E2E 11/11 Pfade ✅ auf staging mit echtem LP-Login, 0 Console-Errors
- ✅ Per-Phase Reviewer (4×) + Final-Reviewer: APPROVED
- ✅ Plan-Reviewer (mind. 1 Iteration): APPROVED
- ✅ HANDOFF-Eintrag + Memory-Update mit neuen Lehren (sofern entstanden)
- ✅ `git log preview ^main` Check vor Merge (Preview-Force-Push-Regel)
- ✅ Merge in main + preview→main reset + Branch lokal+remote gelöscht
