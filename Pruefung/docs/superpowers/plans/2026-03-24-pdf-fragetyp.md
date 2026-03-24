# PDF-Fragetyp Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a PDF annotation question type where students highlight, comment, draw and label on PDF documents in the browser.

**Architecture:** PDF.js renders pages into canvases. SVG overlays handle highlights/markers (DOM-clickable). A per-page Canvas handles freehand drawing via the existing `useDrawingEngine`. Text selection uses PDF.js text layer with character-offset anchoring.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + pdfjs-dist (new)

**Spec:** `docs/superpowers/specs/2026-03-24-pdf-fragetyp-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/components/fragetypen/pdf/PDFTypes.ts` | Re-export shared types + component-local types (PDFRenderState, etc.) |
| `src/components/fragetypen/pdf/usePDFRenderer.ts` | Load PDF.js, render pages, manage text layer |
| `src/components/fragetypen/pdf/usePDFAnnotations.ts` | Annotation CRUD, global undo/redo stack (50 steps) |
| `src/components/fragetypen/pdf/PDFViewer.tsx` | Scroll container, lazy-renders pages via IntersectionObserver |
| `src/components/fragetypen/pdf/PDFSeite.tsx` | Single page: PDF canvas + text layer + SVG overlay + freehand canvas |
| `src/components/fragetypen/pdf/PDFToolbar.tsx` | Toolbar: werkzeuge, farben, undo/redo, zoom, annotation count |
| `src/components/fragetypen/pdf/PDFKommentarPopover.tsx` | Positioned popover for comment input |
| `src/components/fragetypen/pdf/PDFKategorieChooser.tsx` | Dropdown for label assignment after text selection |
| `src/components/fragetypen/PDFFrage.tsx` | SuS view: fragetext + toolbar + viewer, auto-save |
| `src/components/lp/frageneditor/PDFEditor.tsx` | LP editor: PDF upload, werkzeug checkboxes, kategorien editor, musterlösung |
| `src/components/lp/PDFKorrektur.tsx` | Correction: read-only PDF with annotations, summary, LP grading, KI suggestion |

### Modified Files

| File | Change |
|------|--------|
| `src/types/fragen.ts` | Add PDFFrage, PDFAnnotation (discriminated union), PDFKategorie, PDFAnnotationsWerkzeug, PDFTextRange. Extend Frage union. |
| `src/types/antworten.ts` | Add `{ typ: 'pdf'; annotationen: PDFAnnotation[] }` to Antwort union |
| `src/components/lp/frageneditor/editorUtils.ts:3,11` | Add `'pdf'` to FrageTyp, `pdf: 'pdf'` to typKuerzel |
| `src/utils/fachbereich.ts` | Add `case 'pdf': return 'PDF'` to typLabel() |
| `src/utils/fragenFactory.ts:50-62,65+` | Add pdf case to TypSpezifischeDaten + erstelleFrageObjekt() |
| `src/utils/fragenValidierung.ts` | Add pdf validation (PDF vorhanden, min 1 werkzeug, max 2 PDF-Fragen pro Prüfung) |
| `src/utils/exportUtils.ts` | Add `case 'pdf'` to antwortAlsText() |
| `src/components/Layout.tsx:17-28,425+` | Import PDFFrage, add `case 'pdf'` routing |
| `src/components/lp/frageneditor/sections/TypEditorDispatcher.tsx:575+` | Add `{typ === 'pdf' && <PDFEditor ... />}` |
| `src/components/lp/frageneditor/FragenEditor.tsx` | Add PDF state variables + type button |
| `src/components/lp/KorrekturSchuelerZeile.tsx:122,254` | Add pdf case in antwortAlsText() + PDFKorrektur routing |
| `src/components/lp/KorrekturPDFAnsicht.tsx:117` | Add pdf case for print view |
| `apps-script-code.js` | Add `korrigierePDFAnnotation()` endpoint |
| `package.json` | Add `pdfjs-dist` dependency |

### Notes on Files NOT Modified

| File | Reason |
|------|--------|
| `store/pruefungStore.ts` | `setAntwort()` is generic (`Record<string, Antwort>`) — no type-specific case needed |
| `KorrekturDashboard.tsx` | Dispatches to `KorrekturSchuelerZeile` which handles per-type routing — no dashboard changes needed |

---

## Task 1: Types & Dependency

**Files:**
- Modify: `src/types/fragen.ts`
- Modify: `src/types/antworten.ts`
- Modify: `src/components/lp/frageneditor/editorUtils.ts`
- Modify: `package.json`

- [ ] **Step 1: Install pdfjs-dist**

```bash
cd Pruefung && npm install pdfjs-dist
```

- [ ] **Step 2: Add PDF types to fragen.ts**

Add after the `AufgabengruppeFrage` interface (before `export type Frage = ...`):

```typescript
// === PDF-ANNOTATION ===

export type PDFAnnotationsWerkzeug = 'highlighter' | 'kommentar' | 'freihand' | 'label'
export type PDFToolbarWerkzeug = PDFAnnotationsWerkzeug | 'radierer' | 'auswahl'

export interface PDFKategorie {
  id: string
  label: string
  farbe: string
  beschreibung?: string
}

export interface PDFTextRange {
  startOffset: number
  endOffset: number
  text: string
}

interface PDFAnnotationBase {
  id: string
  seite: number
  zeitstempel: string
}

export interface PDFHighlightAnnotation extends PDFAnnotationBase {
  werkzeug: 'highlighter'
  textRange: PDFTextRange
  farbe: string
}

export interface PDFKommentarAnnotation extends PDFAnnotationBase {
  werkzeug: 'kommentar'
  position: { x: number; y: number }
  kommentarText: string
}

export interface PDFFreihandAnnotation extends PDFAnnotationBase {
  werkzeug: 'freihand'
  zeichnungsDaten: string
  farbe: string
}

export interface PDFLabelAnnotation extends PDFAnnotationBase {
  werkzeug: 'label'
  textRange: PDFTextRange
  kategorieId: string
  farbe: string
}

export type PDFAnnotation =
  | PDFHighlightAnnotation
  | PDFKommentarAnnotation
  | PDFFreihandAnnotation
  | PDFLabelAnnotation

export interface PDFFrage extends FrageBase {
  typ: 'pdf'
  fragetext: string
  pdfDriveFileId: string
  pdfBase64?: string
  pdfDateiname: string
  seitenAnzahl: number
  kategorien?: PDFKategorie[]
  erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]
  musterloesungAnnotationen?: PDFAnnotation[]
}
```

- [ ] **Step 3: Extend Frage union**

In the `export type Frage = ...` line, add `| PDFFrage` at the end.

- [ ] **Step 4: Add PDF answer type to antworten.ts**

Add to the `Antwort` union type:

```typescript
| { typ: 'pdf'; annotationen: import('./fragen').PDFAnnotation[] }
```

- [ ] **Step 5: Add to editorUtils.ts**

Line 3 — add `'pdf'` to `FrageTyp` union:
```typescript
export type FrageTyp = '...' | 'pdf'
```

Line 11 — add to `typKuerzel`:
```typescript
pdf: 'pdf',
```

- [ ] **Step 6: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

Expected: No errors (new types are defined but not yet used).

- [ ] **Step 7: Commit**

```bash
git add src/types/fragen.ts src/types/antworten.ts src/components/lp/frageneditor/editorUtils.ts package.json package-lock.json
git commit -m "feat(pdf): add PDF question type definitions and pdfjs-dist dependency"
```

---

## Task 2: Registration in Existing Infrastructure

**Files:**
- Modify: `src/utils/fachbereich.ts`
- Modify: `src/utils/fragenFactory.ts`
- Modify: `src/utils/fragenValidierung.ts`
- Modify: `src/utils/exportUtils.ts`

- [ ] **Step 1: Add type label in fachbereich.ts**

In the `typLabel()` switch, add after `'visualisierung'`:
```typescript
case 'pdf': return 'PDF-Annotation'
```

- [ ] **Step 2: Add factory case in fragenFactory.ts**

Add to `TypSpezifischeDaten` union:
```typescript
| { typ: 'pdf'; fragetext: string; pdfDriveFileId: string; pdfBase64?: string;
    pdfDateiname: string; seitenAnzahl: number; kategorien?: PDFKategorie[];
    erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]; musterloesungAnnotationen?: PDFAnnotation[] }
```

Add import at top:
```typescript
import type { PDFFrage, PDFKategorie, PDFAnnotationsWerkzeug, PDFAnnotation } from '../types/fragen.ts'
```

Add case in `erstelleFrageObjekt()`:
```typescript
case 'pdf':
  return {
    ...basis,
    typ: 'pdf',
    fragetext: typDaten.fragetext.trim(),
    pdfDriveFileId: typDaten.pdfDriveFileId,
    pdfBase64: typDaten.pdfBase64,
    pdfDateiname: typDaten.pdfDateiname,
    seitenAnzahl: typDaten.seitenAnzahl,
    kategorien: typDaten.kategorien,
    erlaubteWerkzeuge: typDaten.erlaubteWerkzeuge,
    musterloesungAnnotationen: typDaten.musterloesungAnnotationen,
  } as PDFFrage
```

- [ ] **Step 3: Add validation in fragenValidierung.ts**

Add after the last type validation block:
```typescript
if (typ === 'pdf') {
  if (!params.pdfDriveFileId) fehler.push('Bitte PDF hochladen')
  if (!params.fragetext?.trim()) fehler.push('Fragestellung eingeben')
  if (!params.erlaubteWerkzeuge?.length) fehler.push('Mindestens ein Werkzeug auswählen')
}
```

Additionally, add a **cross-question validation** in the PruefungsComposer or wherever question-level validation is aggregated. When the LP adds questions to an exam, enforce:
```typescript
// Max 2 PDF-Fragen pro Prüfung (IndexedDB quota protection)
const pdfCount = pruefungsFragen.filter(f => f.typ === 'pdf').length
if (pdfCount > 2) fehler.push('Maximal 2 PDF-Fragen pro Prüfung (Speicherlimit)')
```

Read `fragenValidierung.ts` and the PruefungsComposer first to find the right location. Match existing parameter names.

- [ ] **Step 4: Add export case in exportUtils.ts**

In `antwortAlsText()`, add after the last case:
```typescript
case 'pdf': {
  const pdfAntwort = antwort as { typ: 'pdf'; annotationen: PDFAnnotation[] }
  const count = pdfAntwort.annotationen?.length ?? 0
  return count > 0 ? `(${count} PDF-Annotationen vorhanden)` : '(keine Annotationen)'
}
```

Add import at top:
```typescript
import type { PDFAnnotation } from '../types/fragen.ts'
```

- [ ] **Step 5: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/fachbereich.ts src/utils/fragenFactory.ts src/utils/fragenValidierung.ts src/utils/exportUtils.ts
git commit -m "feat(pdf): register PDF type in factory, validation, labels, export"
```

---

## Task 3: PDF.js Renderer Hook

**Files:**
- Create: `src/components/fragetypen/pdf/PDFTypes.ts`
- Create: `src/components/fragetypen/pdf/usePDFRenderer.ts`

- [ ] **Step 1: Create PDFTypes.ts**

```typescript
// Re-export shared types from canonical location
export type {
  PDFFrage, PDFAnnotation, PDFHighlightAnnotation, PDFKommentarAnnotation,
  PDFFreihandAnnotation, PDFLabelAnnotation, PDFKategorie,
  PDFAnnotationsWerkzeug, PDFToolbarWerkzeug, PDFTextRange,
} from '../../../types/fragen.ts'

// Component-local types
export interface PDFRenderState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  seitenAnzahl: number
  fehler?: string
}

export interface PDFSeitenInfo {
  breite: number
  hoehe: number
  textItems: PDFTextItem[]
}

export interface PDFTextItem {
  str: string
  startOffset: number  // Position im konkatienierten String
  endOffset: number
  transform: number[]  // PDF.js transform matrix for positioning
}

export const ZOOM_STUFEN = [0.75, 1, 1.25, 1.5] as const
export type ZoomStufe = typeof ZOOM_STUFEN[number]

export const STANDARD_HIGHLIGHT_FARBEN = [
  '#fde047', // yellow
  '#86efac', // green
  '#93c5fd', // blue
  '#fca5a5', // red
  '#c4b5fd', // purple
  '#fdba74', // orange
  '#67e8f9', // cyan
  '#f9a8d4', // pink
] as const
```

- [ ] **Step 2: Create usePDFRenderer.ts**

This hook manages PDF.js document loading and page rendering.

```typescript
import { useState, useCallback, useRef, useEffect } from 'react'
import type { PDFRenderState, PDFSeitenInfo, PDFTextItem } from './PDFTypes.ts'

// Lazy-load PDF.js
let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function ladePDFjs() {
  if (pdfjsLib) return pdfjsLib
  const lib = await import('pdfjs-dist')
  // Worker setup
  const workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  lib.GlobalWorkerOptions.workerSrc = workerSrc.default
  pdfjsLib = lib
  return lib
}

export function usePDFRenderer() {
  const [state, setState] = useState<PDFRenderState>({ status: 'idle', seitenAnzahl: 0 })
  const docRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const seitenInfoCache = useRef<Map<number, PDFSeitenInfo>>(new Map())

  /** PDF laden (aus Base64 oder URL) */
  const ladePDF = useCallback(async (quelle: { base64?: string; url?: string }) => {
    setState({ status: 'loading', seitenAnzahl: 0 })
    try {
      const lib = await ladePDFjs()
      const daten = quelle.base64
        ? Uint8Array.from(atob(quelle.base64), c => c.charCodeAt(0))
        : undefined
      const doc = await lib.getDocument(daten ? { data: daten } : { url: quelle.url! }).promise
      docRef.current = doc
      seitenInfoCache.current.clear()
      setState({ status: 'ready', seitenAnzahl: doc.numPages })
    } catch (e) {
      setState({ status: 'error', seitenAnzahl: 0, fehler: String(e) })
    }
  }, [])

  /** Einzelne Seite in Canvas rendern */
  const rendereSeite = useCallback(async (
    seitenNr: number,
    canvas: HTMLCanvasElement,
    zoom: number,
  ): Promise<PDFSeitenInfo | null> => {
    const doc = docRef.current
    if (!doc) return null

    const page = await doc.getPage(seitenNr + 1) // PDF.js ist 1-basiert
    const viewport = page.getViewport({ scale: zoom * window.devicePixelRatio })

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = `${viewport.width / window.devicePixelRatio}px`
    canvas.style.height = `${viewport.height / window.devicePixelRatio}px`

    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise

    // Text-Items extrahieren (für Text-Layer + Selektion)
    const textContent = await page.getTextContent()
    let offset = 0
    const textItems: PDFTextItem[] = textContent.items
      .filter((item): item is import('pdfjs-dist').TextItem => 'str' in item)
      .map(item => {
        const ti: PDFTextItem = {
          str: item.str,
          startOffset: offset,
          endOffset: offset + item.str.length,
          transform: item.transform,
        }
        offset += item.str.length
        return ti
      })

    const info: PDFSeitenInfo = {
      breite: viewport.width / window.devicePixelRatio,
      hoehe: viewport.height / window.devicePixelRatio,
      textItems,
    }
    seitenInfoCache.current.set(seitenNr, info)
    return info
  }, [])

  /** Seiteninfo abrufen (gecacht) */
  const holeSeitenInfo = useCallback((seitenNr: number) => {
    return seitenInfoCache.current.get(seitenNr) ?? null
  }, [])

  /** Cleanup */
  useEffect(() => {
    return () => {
      docRef.current?.destroy()
      docRef.current = null
    }
  }, [])

  return { state, ladePDF, rendereSeite, holeSeitenInfo }
}
```

- [ ] **Step 3: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

Note: The `pdfjs-dist` import paths may need adjustment depending on the installed version. Check `node_modules/pdfjs-dist/` for actual export paths. The worker import `?url` suffix is a Vite-specific feature.

- [ ] **Step 4: Commit**

```bash
git add src/components/fragetypen/pdf/
git commit -m "feat(pdf): add PDFTypes and usePDFRenderer hook with PDF.js lazy-loading"
```

---

## Task 4: Annotation State Management

**Files:**
- Create: `src/components/fragetypen/pdf/usePDFAnnotations.ts`

- [ ] **Step 1: Create usePDFAnnotations.ts**

Note: Undo/redo stacks MUST be React state (not refs) so `kannUndo`/`kannRedo` trigger re-renders. Side effects (pushing to undo stack) MUST happen outside state updater functions to avoid double-execution in React Strict Mode.

```typescript
import { useState, useCallback } from 'react'
import type { PDFAnnotation } from './PDFTypes.ts'

interface UndoEintrag {
  typ: 'hinzufuegen' | 'loeschen' | 'editieren'
  annotation: PDFAnnotation
  vorher?: PDFAnnotation
}

const MAX_UNDO = 50

export function usePDFAnnotations(initialAnnotationen?: PDFAnnotation[]) {
  const [annotationen, setAnnotationen] = useState<PDFAnnotation[]>(initialAnnotationen ?? [])
  const [undoStack, setUndoStack] = useState<UndoEintrag[]>([])
  const [redoStack, setRedoStack] = useState<UndoEintrag[]>([])

  const pushUndo = useCallback((eintrag: UndoEintrag) => {
    setUndoStack(prev => {
      const next = [...prev, eintrag]
      return next.length > MAX_UNDO ? next.slice(1) : next
    })
    setRedoStack([])
  }, [])

  const hinzufuegen = useCallback((annotation: PDFAnnotation) => {
    setAnnotationen(prev => [...prev, annotation])
    pushUndo({ typ: 'hinzufuegen', annotation })
  }, [pushUndo])

  const loeschen = useCallback((id: string) => {
    let geloescht: PDFAnnotation | undefined
    setAnnotationen(prev => {
      geloescht = prev.find(a => a.id === id)
      return prev.filter(a => a.id !== id)
    })
    // Push after state update — geloescht is set synchronously in the updater
    if (geloescht) pushUndo({ typ: 'loeschen', annotation: geloescht })
  }, [pushUndo])

  const editieren = useCallback((id: string, updates: Partial<PDFAnnotation>) => {
    let vorher: PDFAnnotation | undefined
    setAnnotationen(prev => prev.map(a => {
      if (a.id !== id) return a
      vorher = a
      return { ...a, ...updates } as PDFAnnotation
    }))
    if (vorher) {
      pushUndo({ typ: 'editieren', annotation: { ...vorher, ...updates } as PDFAnnotation, vorher })
    }
  }, [pushUndo])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const eintrag = prev[prev.length - 1]
      const rest = prev.slice(0, -1)

      setRedoStack(r => [...r, eintrag])

      switch (eintrag.typ) {
        case 'hinzufuegen':
          setAnnotationen(a => a.filter(x => x.id !== eintrag.annotation.id))
          break
        case 'loeschen':
          setAnnotationen(a => [...a, eintrag.annotation])
          break
        case 'editieren':
          if (eintrag.vorher) {
            setAnnotationen(a => a.map(x => x.id === eintrag.vorher!.id ? eintrag.vorher! : x))
          }
          break
      }
      return rest
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const eintrag = prev[prev.length - 1]
      const rest = prev.slice(0, -1)

      setUndoStack(u => [...u, eintrag])

      switch (eintrag.typ) {
        case 'hinzufuegen':
          setAnnotationen(a => [...a, eintrag.annotation])
          break
        case 'loeschen':
          setAnnotationen(a => a.filter(x => x.id !== eintrag.annotation.id))
          break
        case 'editieren':
          setAnnotationen(a => a.map(x => x.id === eintrag.annotation.id ? eintrag.annotation : x))
          break
      }
      return rest
    })
  }, [])

  const kannUndo = undoStack.length > 0
  const kannRedo = redoStack.length > 0

  const fuerSeite = useCallback((seitenNr: number) => {
    return annotationen.filter(a => a.seite === seitenNr)
  }, [annotationen])

  return {
    annotationen, setAnnotationen,
    hinzufuegen, loeschen, editieren,
    undo, redo, kannUndo, kannRedo,
    fuerSeite,
  }
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/pdf/usePDFAnnotations.ts
git commit -m "feat(pdf): add usePDFAnnotations hook with global undo/redo stack"
```

---

## Task 5: PDF Toolbar

**Files:**
- Create: `src/components/fragetypen/pdf/PDFToolbar.tsx`

- [ ] **Step 1: Create PDFToolbar.tsx**

Pattern follows `ZeichnenToolbar.tsx`. Renders only werkzeuge from `erlaubteWerkzeuge`. Radierer always shown. Zoom dropdown.

```typescript
import { useState } from 'react'
import type { PDFAnnotationsWerkzeug, PDFToolbarWerkzeug, PDFKategorie, ZoomStufe } from './PDFTypes.ts'
import { ZOOM_STUFEN, STANDARD_HIGHLIGHT_FARBEN } from './PDFTypes.ts'

interface Props {
  aktivesWerkzeug: PDFToolbarWerkzeug
  onWerkzeugWechsel: (w: PDFToolbarWerkzeug) => void
  erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]
  kategorien?: PDFKategorie[]
  aktiveFarbe: string
  onFarbeWechsel: (f: string) => void
  aktiveKategorieId?: string
  onKategorieWechsel?: (id: string) => void
  zoom: ZoomStufe
  onZoomWechsel: (z: ZoomStufe) => void
  kannUndo: boolean
  kannRedo: boolean
  onUndo: () => void
  onRedo: () => void
  annotationCount: number
  readOnly?: boolean
}

export function PDFToolbar(props: Props) {
  const {
    aktivesWerkzeug, onWerkzeugWechsel, erlaubteWerkzeuge, kategorien,
    aktiveFarbe, onFarbeWechsel, aktiveKategorieId, onKategorieWechsel,
    zoom, onZoomWechsel, kannUndo, kannRedo, onUndo, onRedo, annotationCount, readOnly,
  } = props
  const [farbDropdown, setFarbDropdown] = useState(false)
  const [zoomDropdown, setZoomDropdown] = useState(false)

  if (readOnly) return null

  const werkzeugBtn = (w: PDFToolbarWerkzeug, label: string, show: boolean = true) => {
    if (!show) return null
    const aktiv = aktivesWerkzeug === w
    return (
      <button
        key={w}
        onClick={() => onWerkzeugWechsel(w)}
        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
          aktiv
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title={label}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
      {/* Werkzeuge — auswahl is the default pointer/select mode (no annotation creation) */}
      {werkzeugBtn('auswahl', 'Auswahl')}
      {werkzeugBtn('highlighter', 'Highlighter', erlaubteWerkzeuge.includes('highlighter'))}
      {werkzeugBtn('kommentar', 'Kommentar', erlaubteWerkzeuge.includes('kommentar'))}
      {werkzeugBtn('freihand', 'Freihand', erlaubteWerkzeuge.includes('freihand'))}
      {werkzeugBtn('label', 'Label', erlaubteWerkzeuge.includes('label'))}
      {werkzeugBtn('radierer', 'Radierer')}

      {/* Farbauswahl (Highlighter/Freihand) */}
      {(aktivesWerkzeug === 'highlighter' || aktivesWerkzeug === 'freihand') && (
        <div className="relative ml-1">
          <button
            onClick={() => setFarbDropdown(v => !v)}
            className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600"
            style={{ backgroundColor: aktiveFarbe }}
          />
          {farbDropdown && (
            <div className="absolute top-8 left-0 z-30 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 flex gap-1 shadow-lg">
              {STANDARD_HIGHLIGHT_FARBEN.map(f => (
                <button
                  key={f}
                  onClick={() => { onFarbeWechsel(f); setFarbDropdown(false) }}
                  className={`w-6 h-6 rounded ${f === aktiveFarbe ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: f }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kategorie-Dropdown (Label-Werkzeug) */}
      {aktivesWerkzeug === 'label' && kategorien?.length && onKategorieWechsel && (
        <select
          value={aktiveKategorieId ?? ''}
          onChange={e => onKategorieWechsel(e.target.value)}
          className="ml-1 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800"
        >
          {kategorien.map(k => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
      )}

      {/* Separator */}
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Undo/Redo */}
      <button onClick={onUndo} disabled={!kannUndo} className="px-2 py-1 text-sm disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Rückgängig">↩</button>
      <button onClick={onRedo} disabled={!kannRedo} className="px-2 py-1 text-sm disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Wiederholen">↪</button>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Zoom */}
      <div className="relative">
        <button
          onClick={() => setZoomDropdown(v => !v)}
          className="px-2 py-1 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        >
          {Math.round(zoom * 100)}%
        </button>
        {zoomDropdown && (
          <div className="absolute top-8 right-0 z-30 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-1 shadow-lg">
            {ZOOM_STUFEN.map(z => (
              <button
                key={z}
                onClick={() => { onZoomWechsel(z); setZoomDropdown(false) }}
                className={`block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${z === zoom ? 'font-bold' : ''}`}
              >
                {Math.round(z * 100)}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Annotation count */}
      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
        {annotationCount} {annotationCount === 1 ? 'Annotation' : 'Annotationen'}
      </span>
    </div>
  )
}
```

`'auswahl'` is the default pointer mode — SuS can click/scroll the PDF without creating annotations. It's the initial tool state and also used for selecting existing annotations to view/delete them.

- [ ] **Step 2: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/pdf/PDFToolbar.tsx
git commit -m "feat(pdf): add PDFToolbar component"
```

---

## Task 6: PDF Page Component

**Files:**
- Create: `src/components/fragetypen/pdf/PDFSeite.tsx`
- Create: `src/components/fragetypen/pdf/PDFKommentarPopover.tsx`
- Create: `src/components/fragetypen/pdf/PDFKategorieChooser.tsx`

- [ ] **Step 1: Create PDFKommentarPopover.tsx**

Small popover component: positioned absolutely at click location, contains a textarea and save/cancel buttons.

```typescript
import { useState, useRef, useEffect } from 'react'

interface Props {
  position: { x: number; y: number }  // CSS pixels relative to page container
  initialText?: string
  onSave: (text: string) => void
  onCancel: () => void
}

export function PDFKommentarPopover({ position, initialText, onSave, onCancel }: Props) {
  const [text, setText] = useState(initialText ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { ref.current?.focus() }, [])

  return (
    <div
      className="absolute z-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-2 w-56"
      style={{ left: position.x, top: position.y }}
    >
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full h-20 text-sm border border-slate-200 dark:border-slate-600 rounded p-1 resize-none
                   bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        placeholder="Kommentar..."
      />
      <div className="flex justify-end gap-1 mt-1">
        <button onClick={onCancel} className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          Abbrechen
        </button>
        <button
          onClick={() => text.trim() && onSave(text.trim())}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={!text.trim()}
        >
          Speichern
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PDFKategorieChooser.tsx**

Dropdown that appears after text selection when label tool is active.

```typescript
import type { PDFKategorie } from './PDFTypes.ts'

interface Props {
  kategorien: PDFKategorie[]
  position: { x: number; y: number }
  onSelect: (kategorieId: string) => void
  onCancel: () => void
}

export function PDFKategorieChooser({ kategorien, position, onSelect, onCancel }: Props) {
  return (
    <div
      className="absolute z-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg py-1 min-w-40"
      style={{ left: position.x, top: position.y }}
    >
      {kategorien.map(k => (
        <button
          key={k.id}
          onClick={() => onSelect(k.id)}
          className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          title={k.beschreibung}
        >
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: k.farbe }} />
          {k.label}
        </button>
      ))}
      <button
        onClick={onCancel}
        className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        Abbrechen
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create PDFSeite.tsx**

This is the core component. Renders one PDF page with all layers. Handles text selection, click events for comments, and freehand drawing delegation.

Key responsibilities:
- Render PDF canvas via `usePDFRenderer.rendereSeite()`
- Build text layer from `textItems` (positioned `<span>` elements matching PDF coordinates)
- SVG overlay for highlights (colored `<rect>` elements over text spans) and comment markers
- Transparent canvas overlay for freehand (one `useDrawingEngine` instance)
- Handle `mouseup`/`touchend` for text selection → create highlight or label annotation
- Handle `click` for comment placement
- All coordinates stored as relative (0–1)

Implementation: Build layer by layer. Start with PDF canvas rendering, add text layer, then SVG overlay, then freehand canvas. Each layer is absolutely positioned within a relative container.

```typescript
interface Props {
  seitenNr: number
  zoom: ZoomStufe
  renderer: ReturnType<typeof usePDFRenderer>
  annotationen: PDFAnnotation[]
  aktivesWerkzeug: PDFToolbarWerkzeug
  aktiveFarbe: string
  kategorien?: PDFKategorie[]
  aktiveKategorieId?: string
  onAnnotationHinzufuegen: (a: PDFAnnotation) => void
  onAnnotationLoeschen: (id: string) => void
  readOnly?: boolean
}
```

This component will be ~250-350 lines. Key implementation sections:

**A) PDF Canvas rendering** — call `renderer.rendereSeite(seitenNr, canvasRef, zoom)` in `useEffect` when page becomes visible or zoom changes. Store returned `PDFSeitenInfo`.

**B) Text Layer** — map each `PDFTextItem` to a positioned `<span>`:
```typescript
// PDF.js transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
const left = item.transform[4] * zoom
const top = seitenHoehe - item.transform[5] * zoom  // PDF y is bottom-up
const fontSize = Math.abs(item.transform[3]) * zoom
```
Each span gets `data-offset={item.startOffset}` for text selection anchoring.

**C) Text selection handler** — on `mouseup`, read `window.getSelection()`, walk the Range's spans to compute `startOffset`/`endOffset` from `data-offset` attributes. Then create a highlight or label annotation:
```typescript
const handleTextSelection = () => {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || readOnly) return
  const range = sel.getRangeAt(0)
  // Walk spans in range to compute offsets...
  const textRange: PDFTextRange = { startOffset, endOffset, text: sel.toString() }
  if (aktivesWerkzeug === 'highlighter') {
    onAnnotationHinzufuegen({ id: crypto.randomUUID(), seite: seitenNr, werkzeug: 'highlighter', textRange, farbe: aktiveFarbe, zeitstempel: new Date().toISOString() })
  } else if (aktivesWerkzeug === 'label' && kategorien?.length) {
    setLabelPopup({ textRange, position: { x: ..., y: ... } })  // Show PDFKategorieChooser
  }
  sel.removeAllRanges()
}
```

**D) SVG overlay** — render highlights as semi-transparent `<rect>` elements positioned over the text spans. Comment markers as small circles with emoji. For each annotation on this page, compute visual position from text-layer span positions or stored relative coordinates.

**E) Freehand canvas** — instantiate `useDrawingEngine` per page. Convert relative (0-1) coordinates to/from pixel coordinates at current zoom. On stroke complete, create a `PDFFreihandAnnotation`. Data-size warning: check `JSON.stringify(zeichnungsDaten).length` against thresholds (40KB amber, 50KB red).

**F) Click handler** — for `'kommentar'` tool, `onClick` computes relative position `{ x: e.offsetX / breite, y: e.offsetY / hoehe }` and shows `PDFKommentarPopover`.

**G) Radierer** — on click/tap on an SVG annotation element, call `onAnnotationLoeschen(id)`.

**H) `'auswahl'` mode** — default pointer. No annotation creation. SuS can scroll, select text to copy, click existing annotations to view details.

- [ ] **Step 4: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/fragetypen/pdf/PDFSeite.tsx src/components/fragetypen/pdf/PDFKommentarPopover.tsx src/components/fragetypen/pdf/PDFKategorieChooser.tsx
git commit -m "feat(pdf): add PDFSeite component with text layer, SVG overlay, and sub-components"
```

---

## Task 7: PDF Viewer (Scroll Container)

**Files:**
- Create: `src/components/fragetypen/pdf/PDFViewer.tsx`

- [ ] **Step 1: Create PDFViewer.tsx**

Scroll container that renders all pages. Uses IntersectionObserver for lazy rendering (only visible pages + 1 buffer on each side).

```typescript
import { useRef, useState, useEffect } from 'react'
import { PDFSeite } from './PDFSeite.tsx'
import type { PDFAnnotation, PDFToolbarWerkzeug, PDFKategorie, ZoomStufe } from './PDFTypes.ts'

interface Props {
  renderer: ReturnType<typeof usePDFRenderer>
  seitenAnzahl: number
  zoom: ZoomStufe
  annotationen: PDFAnnotation[]
  aktivesWerkzeug: PDFToolbarWerkzeug
  aktiveFarbe: string
  kategorien?: PDFKategorie[]
  aktiveKategorieId?: string
  onAnnotationHinzufuegen: (a: PDFAnnotation) => void
  onAnnotationLoeschen: (id: string) => void
  readOnly?: boolean
}

export function PDFViewer(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sichtbareSeiten, setSichtbareSeiten] = useState<Set<number>>(new Set([0, 1]))

  // IntersectionObserver: track which page placeholders are visible
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        setSichtbareSeiten(prev => {
          const next = new Set(prev)
          for (const entry of entries) {
            const seite = Number(entry.target.getAttribute('data-seite'))
            if (entry.isIntersecting) {
              // Add this page + 1 buffer on each side
              next.add(seite)
              if (seite > 0) next.add(seite - 1)
              if (seite < props.seitenAnzahl - 1) next.add(seite + 1)
            }
          }
          return next
        })
      },
      { root: container, rootMargin: '200px' }
    )

    const sentinels = container.querySelectorAll('[data-seite]')
    sentinels.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [props.seitenAnzahl])

  return (
    <div ref={containerRef} className="overflow-auto bg-slate-200 dark:bg-slate-900 rounded-lg" style={{ maxHeight: '70vh' }}>
      <div className="flex flex-col items-center gap-4 p-4">
        {Array.from({ length: props.seitenAnzahl }, (_, i) => (
          <div key={i} data-seite={i} className="shadow-lg">
            {sichtbareSeiten.has(i) ? (
              <PDFSeite
                seitenNr={i}
                zoom={props.zoom}
                renderer={props.renderer}
                annotationen={props.annotationen.filter(a => a.seite === i)}
                aktivesWerkzeug={props.aktivesWerkzeug}
                aktiveFarbe={props.aktiveFarbe}
                kategorien={props.kategorien}
                aktiveKategorieId={props.aktiveKategorieId}
                onAnnotationHinzufuegen={props.onAnnotationHinzufuegen}
                onAnnotationLoeschen={props.onAnnotationLoeschen}
                readOnly={props.readOnly}
              />
            ) : (
              <div className="bg-white dark:bg-slate-800" style={{ height: 842 * props.zoom, width: 595 * props.zoom }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/pdf/PDFViewer.tsx
git commit -m "feat(pdf): add PDFViewer scroll container with lazy page rendering"
```

---

## Task 8: SuS-Ansicht (PDFFrage.tsx)

**Files:**
- Create: `src/components/fragetypen/PDFFrage.tsx`

- [ ] **Step 1: Create PDFFrage.tsx**

Main SuS component. Pattern follows `ZeichnenFrage.tsx`.

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { PDFFrage as PDFFrageTyp } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { usePDFRenderer } from './pdf/usePDFRenderer.ts'
import { usePDFAnnotations } from './pdf/usePDFAnnotations.ts'
import { PDFToolbar } from './pdf/PDFToolbar.tsx'
import { PDFViewer } from './pdf/PDFViewer.tsx'
import type { PDFToolbarWerkzeug, ZoomStufe, PDFAnnotation } from './pdf/PDFTypes.ts'
import { STANDARD_HIGHLIGHT_FARBEN } from './pdf/PDFTypes.ts'

interface Props {
  frage: PDFFrageTyp
}

const AUTOSAVE_DEBOUNCE_MS = 2000

export default function PDFFrage({ frage }: Props) {
  const antworten = usePruefungStore(s => s.antworten)
  const setAntwort = usePruefungStore(s => s.setAntwort)
  const abgegeben = usePruefungStore(s => s.abgegeben)

  const renderer = usePDFRenderer()
  const gespeicherteAntwort = antworten[frage.id]
  const initialAnnotationen = gespeicherteAntwort?.typ === 'pdf' ? gespeicherteAntwort.annotationen : []
  const { annotationen, hinzufuegen, loeschen, undo, redo, kannUndo, kannRedo } = usePDFAnnotations(initialAnnotationen)

  const [aktivesWerkzeug, setAktivesWerkzeug] = useState<PDFToolbarWerkzeug>('auswahl')
  const [aktiveFarbe, setAktiveFarbe] = useState(STANDARD_HIGHLIGHT_FARBEN[0])
  const [aktiveKategorieId, setAktiveKategorieId] = useState<string | undefined>(frage.kategorien?.[0]?.id)
  const [zoom, setZoom] = useState<ZoomStufe>(1)

  // PDF laden
  useEffect(() => {
    if (frage.pdfBase64) {
      renderer.ladePDF({ base64: frage.pdfBase64 })
    } else if (frage.pdfDriveFileId) {
      // URL from Drive — build via API
      renderer.ladePDF({ url: `/api/drive/${frage.pdfDriveFileId}` })
    }
  }, [frage.pdfDriveFileId, frage.pdfBase64])

  // Auto-Save (debounced)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (abgegeben) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setAntwort(frage.id, { typ: 'pdf', annotationen })
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(saveTimer.current)
  }, [annotationen, frage.id, setAntwort, abgegeben])

  return (
    <div className="space-y-4">
      {/* Fragetext */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Toolbar */}
      {!abgegeben && (
        <PDFToolbar
          aktivesWerkzeug={aktivesWerkzeug}
          onWerkzeugWechsel={setAktivesWerkzeug}
          erlaubteWerkzeuge={frage.erlaubteWerkzeuge}
          kategorien={frage.kategorien}
          aktiveFarbe={aktiveFarbe}
          onFarbeWechsel={setAktiveFarbe}
          aktiveKategorieId={aktiveKategorieId}
          onKategorieWechsel={setAktiveKategorieId}
          zoom={zoom}
          onZoomWechsel={setZoom}
          kannUndo={kannUndo}
          kannRedo={kannRedo}
          onUndo={undo}
          onRedo={redo}
          annotationCount={annotationen.length}
        />
      )}

      {/* PDF Viewer */}
      {renderer.state.status === 'loading' && (
        <div className="text-center py-8 text-slate-500">PDF wird geladen...</div>
      )}
      {renderer.state.status === 'error' && (
        <div className="text-center py-8 text-red-500">{renderer.state.fehler}</div>
      )}
      {renderer.state.status === 'ready' && (
        <PDFViewer
          renderer={renderer}
          seitenAnzahl={renderer.state.seitenAnzahl}
          zoom={zoom}
          annotationen={annotationen}
          aktivesWerkzeug={aktivesWerkzeug}
          aktiveFarbe={aktiveFarbe}
          kategorien={frage.kategorien}
          aktiveKategorieId={aktiveKategorieId}
          onAnnotationHinzufuegen={hinzufuegen}
          onAnnotationLoeschen={loeschen}
          readOnly={abgegeben}
        />
      )}
    </div>
  )
}
```

Note: `dangerouslySetInnerHTML` is used here following the existing pattern in other question types for rendering markdown. The input is from LP-authored content (trusted), not user input.

- [ ] **Step 2: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/PDFFrage.tsx
git commit -m "feat(pdf): add PDFFrage SuS view with auto-save"
```

---

## Task 9: Routing Integration

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/components/lp/KorrekturSchuelerZeile.tsx`
- Modify: `src/components/lp/KorrekturPDFAnsicht.tsx`

- [ ] **Step 1: Add PDF case in Layout.tsx**

Add import at the top (near other lazy/dynamic imports):
```typescript
import PDFFrage from './fragetypen/PDFFrage.tsx'
```

Add type import:
```typescript
import type { PDFFrage as PDFFrageTyp } from '../types/fragen.ts'
```

Add case in the rendering switch (after `case 'aufgabengruppe'` or `case 'visualisierung'`):
```typescript
case 'pdf':
  return <PDFFrage frage={frage as PDFFrageTyp} />
```

- [ ] **Step 2: Add PDF case in KorrekturSchuelerZeile.tsx**

In `antwortAlsText()` function, add after the last case:
```typescript
case 'pdf': {
  const pdfA = antwort as { typ: 'pdf'; annotationen: PDFAnnotation[] }
  const count = pdfA.annotationen?.length ?? 0
  return count > 0 ? `${count} Annotationen` : '(keine)'
}
```

Add import:
```typescript
import type { PDFAnnotation } from '../../types/fragen.ts'
```

- [ ] **Step 3: Add PDF case in KorrekturPDFAnsicht.tsx**

In the answer conversion function, add:
```typescript
case 'pdf': {
  const pdfA = antwort as { typ: 'pdf'; annotationen: PDFAnnotation[] }
  return `${pdfA.annotationen?.length ?? 0} PDF-Annotationen`
}
```

- [ ] **Step 4: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.tsx src/components/lp/KorrekturSchuelerZeile.tsx src/components/lp/KorrekturPDFAnsicht.tsx
git commit -m "feat(pdf): integrate PDF type into routing and correction views"
```

---

## Task 10: LP Editor

**Files:**
- Create: `src/components/lp/frageneditor/PDFEditor.tsx`
- Modify: `src/components/lp/frageneditor/sections/TypEditorDispatcher.tsx`
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx`

- [ ] **Step 1: Create PDFEditor.tsx**

LP editor for creating/editing PDF questions. Sections:
1. PDF Upload (drag & drop zone, file input, preview)
2. Werkzeug Checkboxes
3. Kategorien Editor (if label werkzeug active)
4. Musterlösung (embedded PDFViewer in edit mode)

Follow pattern from `ZeichnenEditor.tsx`. The editor receives and emits state via props from `TypEditorDispatcher`.

Key props to receive (check TypEditorDispatcher.tsx interface):
- `fragetext`, `onFragetextChange`
- PDF-specific: `pdfDriveFileId`, `pdfBase64`, `pdfDateiname`, `seitenAnzahl`, `kategorien`, `erlaubteWerkzeuge`, `musterloesungAnnotationen`
- Corresponding onChange handlers

Implementation notes:
- PDF upload uses `uploadApi.ts` → returns `driveFileId`
- After upload, render PDF with `usePDFRenderer` to get `seitenAnzahl`
- Generate Base64 fallback from the uploaded file via `FileReader.readAsDataURL()`
- Kategorien editor: list with add/remove/reorder, color picker from `STANDARD_HIGHLIGHT_FARBEN`
- Vorlagen dropdown with preset category sets
- **PDF replacement:** When LP uploads a new PDF, update `seitenAnzahl`. If `musterloesungAnnotationen` contains annotations with `seite >= neueSeitenAnzahl`, discard them and show a warning toast: "Musterlösung: X Annotationen auf entfernten Seiten gelöscht."
- **Freihand data-size warning:** After saving freihand annotations, check total `zeichnungsDaten` size per page. Show amber warning at 40KB, red at 50KB (same thresholds as Zeichnen-Fragetyp)

- [ ] **Step 2: Add to TypEditorDispatcher.tsx**

Add import:
```typescript
import PDFEditor from '../PDFEditor.tsx'
```

Add after the last `{typ === '...' && ...}` block:
```typescript
{typ === 'pdf' && (
  <PDFEditor
    fragetext={fragetext}
    onFragetextChange={onFragetextChange}
    pdfDriveFileId={pdfDriveFileId}
    // ... pass all PDF-specific props
  />
)}
```

Note: The exact props depend on the TypEditorDispatcher interface. Read the file carefully and add the necessary PDF props to the interface and pass them through.

- [ ] **Step 3: Add PDF state to FragenEditor.tsx**

Add state variables for PDF-specific fields:
```typescript
const [pdfDriveFileId, setPdfDriveFileId] = useState(frage?.typ === 'pdf' ? (frage as PDFFrageTyp).pdfDriveFileId : '')
const [pdfBase64, setPdfBase64] = useState(frage?.typ === 'pdf' ? (frage as PDFFrageTyp).pdfBase64 : undefined)
const [pdfDateiname, setPdfDateiname] = useState(frage?.typ === 'pdf' ? (frage as PDFFrageTyp).pdfDateiname : '')
const [seitenAnzahl, setSeitenAnzahl] = useState(frage?.typ === 'pdf' ? (frage as PDFFrageTyp).seitenAnzahl : 0)
const [kategorien, setKategorien] = useState(frage?.typ === 'pdf' ? (frage as PDFFrageTyp).kategorien ?? [] : [])
const [erlaubteWerkzeuge, setErlaubteWerkzeuge] = useState(frage?.typ === 'pdf' ? (frage as PDFFrageTyp).erlaubteWerkzeuge : ['highlighter', 'kommentar', 'freihand', 'label'] as PDFAnnotationsWerkzeug[])
const [musterloesungAnnotationen, setMusterloesungAnnotationen] = useState(frage?.typ === 'pdf' ? (frage as PDFFrageTyp).musterloesungAnnotationen ?? [] : [])
```

Add type button in the type selection area (look for the existing type buttons pattern):
```typescript
{ value: 'pdf', label: 'PDF' }
```

Pass PDF state to TypEditorDispatcher and include in handleSpeichern's typDaten for `case 'pdf'`.

- [ ] **Step 4: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/frageneditor/PDFEditor.tsx src/components/lp/frageneditor/sections/TypEditorDispatcher.tsx src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "feat(pdf): add LP editor with PDF upload, werkzeug config, and kategorien editor"
```

---

## Task 11: Korrektur-Ansicht

**Files:**
- Create: `src/components/lp/PDFKorrektur.tsx`
- Modify: `src/components/lp/KorrekturSchuelerZeile.tsx`

- [ ] **Step 1: Create PDFKorrektur.tsx**

Follows `ZeichnenKorrektur.tsx` pattern. Shows:
- Left: PDF with SuS annotations (read-only PDFViewer)
- Right: Summary (annotation counts), LP grading (Punkte, Kommentar, Audio), KI suggestion

```typescript
import { useState } from 'react'
import type { PDFFrage, PDFAnnotation } from '../../types/fragen.ts'
import { usePDFRenderer } from '../fragetypen/pdf/usePDFRenderer.ts'
import { PDFViewer } from '../fragetypen/pdf/PDFViewer.tsx'

interface Props {
  frage: PDFFrage
  antwort: { typ: 'pdf'; annotationen: PDFAnnotation[] }
  schuelerName: string
  pruefungId: string
  korrektur?: { punkte?: number; kommentar?: string }
  onKorrekturSpeichern: (punkte: number, kommentar: string) => void
}

export function PDFKorrektur({ frage, antwort, schuelerName, pruefungId, korrektur, onKorrekturSpeichern }: Props) {
  const renderer = usePDFRenderer()
  const [punkte, setPunkte] = useState(korrektur?.punkte ?? 0)
  const [kommentar, setKommentar] = useState(korrektur?.kommentar ?? '')
  const [kiVorschlag, setKiVorschlag] = useState<{ punkte: number; begruendung: string } | null>(null)
  const [kiLaeuft, setKiLaeuft] = useState(false)

  // PDF laden
  useEffect(() => {
    if (frage.pdfBase64) renderer.ladePDF({ base64: frage.pdfBase64 })
  }, [frage.pdfBase64])

  // Zusammenfassung
  const highlights = antwort.annotationen.filter(a => a.werkzeug === 'highlighter').length
  const labels = antwort.annotationen.filter(a => a.werkzeug === 'label').length
  const kommentare = antwort.annotationen.filter(a => a.werkzeug === 'kommentar').length
  const freihand = antwort.annotationen.filter(a => a.werkzeug === 'freihand').length

  // KI-Korrektur: render annotated pages as images (max 5, 150 DPI), send to Apps Script
  const starteKIKorrektur = async () => {
    setKiLaeuft(true)
    try {
      // 1. Determine which pages have annotations
      const seitenMitAnnotationen = [...new Set(antwort.annotationen.map(a => a.seite))].slice(0, 5)
      // 2. Render those pages to canvas, export as base64 PNG
      // 3. Call apiService.korrigierePDFAnnotation({ pdfBilder, annotationen, musterloesungAnnotationen, bewertungsraster, maxPunkte })
      // 4. Parse response
      // setKiVorschlag(response)
    } catch (e) {
      console.error('KI-Korrektur fehlgeschlagen:', e)
    } finally {
      setKiLaeuft(false)
    }
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Left: PDF with read-only annotations */}
      <div className="flex-1 min-w-0">
        {renderer.state.status === 'ready' && (
          <PDFViewer
            renderer={renderer}
            seitenAnzahl={renderer.state.seitenAnzahl}
            zoom={1}
            annotationen={antwort.annotationen}
            aktivesWerkzeug={'auswahl'}
            aktiveFarbe={'#fde047'}
            readOnly
            onAnnotationHinzufuegen={() => {}}
            onAnnotationLoeschen={() => {}}
          />
        )}
      </div>

      {/* Right: Sidebar */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Zusammenfassung */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-medium mb-2">{schuelerName}</h3>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            {highlights > 0 && <li>{highlights} Highlights</li>}
            {labels > 0 && <li>{labels} Labels</li>}
            {kommentare > 0 && <li>{kommentare} Kommentare</li>}
            {freihand > 0 && <li>{freihand} Freihand-Zeichnungen</li>}
          </ul>
        </div>

        {/* LP-Bewertung */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <h3 className="font-medium">Bewertung</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm">Punkte:</label>
            <input type="number" value={punkte} onChange={e => setPunkte(Number(e.target.value))} min={0} max={frage.punkte}
              className="w-16 border rounded px-2 py-1 text-sm" />
            <span className="text-sm text-slate-500">/ {frage.punkte}</span>
          </div>
          <textarea value={kommentar} onChange={e => setKommentar(e.target.value)} placeholder="Kommentar..."
            className="w-full h-20 text-sm border rounded p-2 resize-none" />
          <button onClick={() => onKorrekturSpeichern(punkte, kommentar)}
            className="w-full bg-blue-500 text-white text-sm py-1.5 rounded hover:bg-blue-600">
            Speichern
          </button>
        </div>

        {/* KI-Vorschlag */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-2">
          <h3 className="font-medium">KI-Vorschlag</h3>
          <button onClick={starteKIKorrektur} disabled={kiLaeuft}
            className="w-full bg-purple-500 text-white text-sm py-1.5 rounded hover:bg-purple-600 disabled:opacity-50">
            {kiLaeuft ? 'Analysiere...' : 'KI-Korrektur starten'}
          </button>
          {kiVorschlag && (
            <div className="text-sm space-y-1">
              <p><strong>{kiVorschlag.punkte}/{frage.punkte} Punkte</strong></p>
              <p className="text-slate-600 dark:text-slate-400">{kiVorschlag.begruendung}</p>
              <button onClick={() => { setPunkte(kiVorschlag.punkte); setKommentar(kiVorschlag.begruendung) }}
                className="text-xs text-blue-500 hover:underline">Übernehmen</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

Add missing imports at the top of the component:
```typescript
import { useState, useEffect } from 'react'
import { PDFViewer } from '../fragetypen/pdf/PDFViewer.tsx'
```
```

- [ ] **Step 2: Add routing in KorrekturSchuelerZeile.tsx**

Find the section where `ZeichnenKorrektur` is conditionally rendered (around line 254). Add similar block:

```typescript
if (frage.typ === 'pdf' && antwort?.typ === 'pdf') {
  return <PDFKorrektur frage={frage as PDFFrage} antwort={antwort} schuelerName={name} pruefungId={pruefungId} ... />
}
```

Add import:
```typescript
import { PDFKorrektur } from './PDFKorrektur.tsx'
```

- [ ] **Step 3: Verify build compiles**

```bash
cd Pruefung && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/PDFKorrektur.tsx src/components/lp/KorrekturSchuelerZeile.tsx
git commit -m "feat(pdf): add PDFKorrektur view with annotation summary and LP grading"
```

---

## Task 12: Apps Script KI-Korrektur

**Files:**
- Modify: `apps-script-code.js`

- [ ] **Step 1: Add korrigierePDFAnnotation function**

Follow the pattern of `korrigiereZeichnung()`. Add new function:

```javascript
function korrigierePDFAnnotation(params) {
  const { pdfBilder, annotationen, musterloesungAnnotationen, bewertungsraster, maxPunkte } = params

  const prompt = `Du bist Korrektur-Assistent für eine Prüfung am Gymnasium.

Aufgabe: Bewerte die PDF-Annotationen eines Schülers.

Bewertungsraster:
${JSON.stringify(bewertungsraster)}

Musterlösung (Annotationen):
${JSON.stringify(musterloesungAnnotationen)}

Schüler-Annotationen:
${JSON.stringify(annotationen)}

Maximale Punktzahl: ${maxPunkte}

Antworte mit JSON: { "punkte": <number>, "begruendung": "<text>" }`

  // Build messages array with images + text
  const messages = [{
    role: 'user',
    content: [
      ...pdfBilder.map(bild => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: bild }
      })),
      { type: 'text', text: prompt }
    ]
  }]

  return rufeClaudeAufMitBild(messages)
}
```

Add routing in the main `doPost()` or `doGet()` handler:
```javascript
case 'korrigierePDFAnnotation':
  return korrigierePDFAnnotation(params)
```

- [ ] **Step 2: Commit**

```bash
git add apps-script-code.js
git commit -m "feat(pdf): add korrigierePDFAnnotation Apps Script endpoint for KI grading"
```

Note: After committing, the Apps Script code must be manually copied to the Apps Script editor and a new deployment created.

---

## Task 13: Build & Smoke Test

- [ ] **Step 1: Run full build**

```bash
cd Pruefung && npm run build
```

Fix any build errors.

- [ ] **Step 2: Start dev server and smoke test**

```bash
cd Pruefung && npm run dev
```

Manual test checklist:
1. Open LP editor, select "PDF" type → editor renders
2. Upload a small PDF → preview shows with page count
3. Configure werkzeuge and kategorien
4. Save question → no errors
5. Open SuS view → PDF renders, toolbar shows
6. Test highlighter: select text → highlight appears
7. Test kommentar: click → popover → save → marker appears
8. Test freihand: draw on page → stroke persists
9. Test label: select text → category dropdown → labeled highlight
10. Test radierer: click annotation → deleted (undo works)
11. Test zoom: change zoom → annotations scale correctly
12. Test scroll: multi-page PDF → lazy loading works
13. Check auto-save: annotate → wait 2s → refresh → annotations persist

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "fix(pdf): build fixes and smoke test adjustments"
```

Only if there were fixes needed from the smoke test.
