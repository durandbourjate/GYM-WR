# Bundle T.d — ZeichnenCanvas Hook-Extraktion (Sub-Spec)

**Datum:** 2026-05-07
**Status:** Draft (vor Spec-Review)
**Master-Spec:** [`2026-05-06-bundle-t-hooks-splits-design.md`](2026-05-06-bundle-t-hooks-splits-design.md)
**Vorgänger:** Bundle T.c (FragenBrowser Hook-Extraktion + Body-Komponenten, Merge `7a9d339` 2026-05-07)

## 1. Kontext

Aus der Master-Spec von Bundle T (2026-05-06): T.d zerlegt `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` (804 Z., **hoch-Risiko**) per Hook-Extraktion ohne Verhaltensänderung. T.d ist das vierte Sub-Bundle und der erste hoch-Risiko-File (Pause-Punkt nach T.c wurde durchlaufen). Master-Spec Sektion 5.1 (Mini-Pre-Audit) hat 4 Hooks vorgeschlagen: `useDebounce` (cross-cutting) + `useTextOverlay` + `useCanvasSetup` + `useStiftRendering`.

Hauptrisiko-Cluster: rAF-basierte Stift-Render-Loop (Session-50-Performance-Pattern), iOS-Canvas-Focus-rAF (Z. 377-388), Outside-Click-Listener mit `capture: true` (Z. 391-412). Diese 3 Cluster müssen **byte-identisch** bleiben — Verhaltens-Drift bricht Tablet-Use-Cases auf SuS-Geräten.

`zeichnen/`-Sub-Folder existiert bereits (5 Files: `ZeichnenCanvas.tsx`, `ZeichnenToolbar.tsx`, `ZeichnenTypes.ts`, `useDrawingEngine.ts`, `usePointerEvents.ts`). Co-Location-Pattern für die 3 file-lokalen Hooks etabliert.

## 2. Ziel

`ZeichnenCanvas.tsx` von 804 Z. auf **~440 Z.** reduzieren (Master-Spec-Ziel <500 Z.), Hotspot-Bilanz Files >500 Z. **10 → 9**, ohne Verhaltensänderung. 4 Hooks extrahieren mit klarer Verantwortungsteilung. `useDebounce` als wiederverwendbare cross-cutting Utility nach `src/hooks/useDebounce.ts` auslagern (Master-Spec 4.1, heute inline Z. 88-101).

## 3. Scope

### In Scope

| Sub | File | heute | nachher | Verantwortung |
|---|---|---:|---:|---|
| Modify | `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` | 804 Z. | ~440 Z. | Komposition der 4 Hooks + Engine-Setup + Pointer-Handler (handleStart/Move/End) + Auto-Save + Render-Loop-Effect + Tastatur-Shortcut + JSX |
| New | `ExamLab/src/hooks/useDebounce.ts` | – | ~14 Z. | Generischer Debounce-Wrapper (cross-cutting Utility, byte-identisch zu Z. 88-101 inline) |
| New | `ExamLab/src/hooks/useDebounce.test.ts` | – | ~70 Z. | Vitest fake-timers für Debounce-Verhalten |
| New | `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts` | – | ~50 Z. | `canvasRef` + `containerRef` + `hintergrundbild`-State + `berechneDimensionen` (export für Tests) |
| New | `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts` | – | ~50 Z. | Vitest für `berechneDimensionen` (4 Branches: auto+bild, preset, custom, fallback) |
| New | `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts` | – | ~120 Z. | Text-Overlay-State-Machine + `inputRef` + `sichtbarRef` + `geoeffnetRef` + Auto-Focus-rAF + Outside-Click-Listener |
| New | `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx` | – | ~80 Z. | Vitest renderHook für State-Machine (oeffnen → setText → abschliessen-mit-Commit, abschliessen-mit-abbrechen) |
| New | `ExamLab/src/components/fragetypen/zeichnen/useStiftRendering.ts` | – | ~75 Z. | `stiftBufferRef` + `stiftMetaRef` + `rafIdRef` + `istAktivRef` + rAF-Loop + Cleanup-Effect + `starteRendering`/`stoppeRendering` |

### Out of Scope

- `useDrawingEngine.ts` (752 Z.) — Bundle U Hoch-Risiko, eigenes Bundle, nur konsumiert
- `usePointerEvents.ts` — existing, intakt, nur konsumiert
- `ZeichnenToolbar.tsx` / `ZeichnenTypes.ts` — existing, unverändert
- Verhaltensänderungen (Render-Output, Side-Effect-Reihenfolge, Timing-Konstanten bleiben byte-identisch)
- Apps Script / Backend / Wire-Vertrag — komplett unangetastet
- `useDebounce`-Konsumenten ausserhalb `ZeichnenCanvas` — heute nur intern, sonstige Files konsumieren `useDebouncedHover` o.ä. (separate Helpers)
- Render-Body-Komponenten-Cuts (z.B. `<TextOverlayInput>` als JSX-Komponente) — YAGNI, JSX bleibt im Hauptfile

## 4. Architektur

### 4.1 Datei-Struktur

```
ExamLab/src/hooks/                                           # cross-cutting, flach
└── useDebounce.ts                                           ← New
    useDebounce.test.ts                                      ← New

ExamLab/src/components/fragetypen/zeichnen/                  # file-lokal Sub-Folder (existing)
├── ZeichnenCanvas.tsx                                       ← Modify (804 → ~440 Z.)
├── ZeichnenToolbar.tsx                                      (existing, unverändert)
├── ZeichnenTypes.ts                                         (existing, unverändert)
├── useDrawingEngine.ts                                      (existing, unverändert)
├── usePointerEvents.ts                                      (existing, unverändert)
├── useCanvasSetup.ts                                        ← New
├── useCanvasSetup.test.ts                                   ← New
├── useTextOverlay.ts                                        ← New
├── useTextOverlay.test.tsx                                  ← New
└── useStiftRendering.ts                                     ← New
```

Cross-cutting `useDebounce` flach in `src/hooks/` (Master-Spec 4.1). File-lokale Hooks in `zeichnen/`-Sub-Folder neben Konsument.

### 4.2 `useDebounce` Service-API

```typescript
// ExamLab/src/hooks/useDebounce.ts
import { useCallback, useRef } from 'react'

/**
 * Debounce-Wrapper für Callbacks. Multiple Aufrufe innerhalb `delay` ms collapsen
 * zu einem Aufruf nach Ende der Pause.
 *
 * **Byte-identisch zum vormaligen inline-Helper in `ZeichnenCanvas.tsx` (Z. 88-101).**
 *
 * @example
 *   const debouncedSave = useDebounce(saveFn, 400);
 *   debouncedSave();  // einmaliger Aufruf nach 400ms ohne weitere Calls
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay],
  )
}
```

**Migration für ZeichnenCanvas.tsx**: `import { useDebounce } from '../../../hooks/useDebounce'` ersetzt inline-Definition. Die Verwendung (Z. 330-335) bleibt unverändert.

### 4.3 `useCanvasSetup` Service-API

```typescript
// ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts
import { useEffect, useRef, useState } from 'react'
import type { CanvasConfig } from '../../../types/fragen-storage'
import { GROESSE_PRESETS } from './ZeichnenTypes'

/**
 * Berechnet logische Canvas-Dimensionen aus CanvasConfig.
 * Pure function — exportiert für Vitest-Coverage.
 *
 * Reihenfolge:
 *   1. preset='auto' + Hintergrundbild → naturalWidth/naturalHeight
 *   2. preset!='auto' und valid → GROESSE_PRESETS[preset]
 *   3. config.breite + config.hoehe → custom
 *   4. Fallback → GROESSE_PRESETS['mittel']
 */
export function berechneDimensionen(
  canvasConfig: CanvasConfig,
  hintergrundbild: HTMLImageElement | null,
): { breite: number; hoehe: number } {
  const preset = canvasConfig.groessePreset

  if (preset === 'auto' && hintergrundbild) {
    return { breite: hintergrundbild.naturalWidth, hoehe: hintergrundbild.naturalHeight }
  }

  if (preset && preset !== 'auto' && GROESSE_PRESETS[preset]) {
    return GROESSE_PRESETS[preset]
  }

  if (canvasConfig.breite && canvasConfig.hoehe) {
    return { breite: canvasConfig.breite, hoehe: canvasConfig.hoehe }
  }

  return GROESSE_PRESETS['mittel']
}

interface UseCanvasSetupResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  hintergrundbild: HTMLImageElement | null
  logischeBreite: number
  logischeHoehe: number
}

/**
 * Bündelt Canvas-Refs + Hintergrundbild-Loading + Dimensions-Berechnung.
 *
 * - `hintergrundbild` wird per `new Image()` async geladen sobald
 *   `canvasConfig.hintergrundbild` sich ändert. Bei null/undef → null state.
 * - Dimensions werden bei jedem Render aus aktuellem hintergrundbild berechnet
 *   (kein Memo — `berechneDimensionen` ist trivial).
 */
export function useCanvasSetup({ canvasConfig }: { canvasConfig: CanvasConfig }): UseCanvasSetupResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hintergrundbild, setHintergrundbild] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!canvasConfig.hintergrundbild) {
      setHintergrundbild(null)
      return
    }
    const img = new Image()
    img.onload = () => setHintergrundbild(img)
    img.src = canvasConfig.hintergrundbild
  }, [canvasConfig.hintergrundbild])

  const { breite: logischeBreite, hoehe: logischeHoehe } = berechneDimensionen(canvasConfig, hintergrundbild)

  return { canvasRef, containerRef, hintergrundbild, logischeBreite, logischeHoehe }
}
```

**Migration für ZeichnenCanvas.tsx**: Z. 123-145 (3× useRef + 1× useState + Image-Load-useEffect + berechneDimensionen-Aufruf) ersetzt durch:

```typescript
const { canvasRef, containerRef, hintergrundbild, logischeBreite, logischeHoehe } = useCanvasSetup({ canvasConfig })
```

### 4.4 `useTextOverlay` Service-API

```typescript
// ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts
import { useCallback, useEffect, useRef, useState } from 'react'

interface TextOverlayState {
  sichtbar: boolean
  logischX: number
  logischY: number
  cssLeft: number
  cssTop: number
  text: string
}

const TEXT_OVERLAY_LEER: TextOverlayState = {
  sichtbar: false,
  logischX: 0,
  logischY: 0,
  cssLeft: 0,
  cssTop: 0,
  text: '',
}

interface UseTextOverlayOptions {
  /** Wird aufgerufen wenn der User den Text bestätigt (Enter/Blur mit Inhalt). */
  onCommit: (params: { text: string; logischX: number; logischY: number }) => void
}

interface UseTextOverlayResult {
  // Read-State (für JSX)
  sichtbar: boolean
  cssLeft: number
  cssTop: number
  text: string

  // Write-API
  setText: (text: string) => void
  oeffnen: (params: { logischX: number; logischY: number; cssLeft: number; cssTop: number }) => void
  abschliessen: (abbrechen?: boolean) => void
  /** Spezial-Variante für JSX-onBlur — ignoriert Blur in den ersten 400ms nach Öffnen. */
  abschliessenViaBlur: () => void

  // Refs (für JSX + usePointerEvents-Guard)
  inputRef: React.RefObject<HTMLInputElement | null>
  sichtbarRef: React.RefObject<boolean>
}

/**
 * Text-Overlay-State-Machine für ZeichnenCanvas.
 *
 * Verantwortlich für:
 * - State-Lifecycle (oeffnen → typing → abschliessen)
 * - Auto-Focus-rAF (iOS/Tablet-Workaround: sofort + 50ms-Fallback-Timer)
 * - Outside-Click-Listener (capture: true, mit setTimeout(0)-Initial-Tick-Skip)
 * - Blur-Suppress in ersten 400ms nach Öffnen (Browser-Click-auf-Canvas-Blur ignorieren)
 *
 * Hook ist **decoupled von Drawing-Engine**: `onCommit` bekommt nur Text + Position.
 * Der Caller (ZeichnenCanvas) ruft `engine.addCommand` mit aktuellen Style-Props.
 *
 * **Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 169-412:**
 * - 50ms Auto-Focus-Fallback-Timer
 * - 400ms Blur-Suppress-Window
 * - 150ms setTimeout in `abschliessenViaBlur` vor `abschliessen(false)`
 * - `pointerdown` mit `capture: true` als Outside-Click-Listener
 * - `setTimeout(0)` für Outside-Click-Listener-Registration (Initial-Click-Skip)
 */
export function useTextOverlay({ onCommit }: UseTextOverlayOptions): UseTextOverlayResult {
  const [state, setState] = useState<TextOverlayState>(TEXT_OVERLAY_LEER)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const sichtbarRef = useRef<boolean>(false)
  const geoeffnetRef = useRef<number>(0)

  // onCommit-Ref-Spiegel gegen Stale-Closure
  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

  // sichtbar-Spiegel (für usePointerEvents-Guard)
  useEffect(() => {
    sichtbarRef.current = state.sichtbar
  }, [state.sichtbar])

  const oeffnen = useCallback(
    (params: { logischX: number; logischY: number; cssLeft: number; cssTop: number }) => {
      setState({
        sichtbar: true,
        logischX: params.logischX,
        logischY: params.logischY,
        cssLeft: params.cssLeft,
        cssTop: params.cssTop,
        text: '',
      })
    },
    [],
  )

  const setText = useCallback((text: string) => {
    setState(prev => ({ ...prev, text }))
  }, [])

  const abschliessen = useCallback((abbrechen = false) => {
    setState(prev => {
      if (!prev.sichtbar) return prev

      if (!abbrechen && prev.text.trim().length > 0) {
        onCommitRef.current({
          text: prev.text.trim(),
          logischX: prev.logischX,
          logischY: prev.logischY,
        })
      }

      return TEXT_OVERLAY_LEER
    })
  }, [])

  const abschliessenViaBlur = useCallback(() => {
    if (Date.now() - geoeffnetRef.current < 400) return
    setTimeout(() => abschliessen(false), 150)
  }, [abschliessen])

  // Auto-Focus mit iOS-rAF-Fallback
  useEffect(() => {
    if (state.sichtbar && inputRef.current) {
      geoeffnetRef.current = Date.now()
      inputRef.current.focus()
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [state.sichtbar])

  // Outside-Click-Listener
  useEffect(() => {
    if (!state.sichtbar) return

    function handleAussenklick(e: PointerEvent) {
      const input = inputRef.current
      if (!input) return
      if (input.closest('div')?.contains(e.target as Node)) return
      abschliessen(false)
    }

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleAussenklick, { capture: true })
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handleAussenklick, { capture: true })
    }
  }, [state.sichtbar, abschliessen])

  return {
    sichtbar: state.sichtbar,
    cssLeft: state.cssLeft,
    cssTop: state.cssTop,
    text: state.text,
    setText,
    oeffnen,
    abschliessen,
    abschliessenViaBlur,
    inputRef,
    sichtbarRef,
  }
}
```

**Migration für ZeichnenCanvas.tsx**:

Hook-Aufruf mit Destrukturierung in stabile Namen (Hook-Result-Object hat sonst Re-Render-Identity → callback deps invalidieren):

```typescript
const {
  sichtbar: textOverlaySichtbar,
  cssLeft: textOverlayCssLeft,
  cssTop: textOverlayCssTop,
  text: textOverlayText,
  setText: textOverlaySetText,
  oeffnen: textOverlayOeffnen,
  abschliessen: textOverlayAbschliessen,
  abschliessenViaBlur: textOverlayAbschliessenViaBlur,
  inputRef: textOverlayInputRef,
  sichtbarRef: textOverlaySichtbarRef,
} = useTextOverlay({
  onCommit: ({ text, logischX, logischY }) => {
    engine.addCommand({
      typ: 'text',
      position: { x: logischX, y: logischY },
      text,
      farbe: aktiveFarbe,
      groesse: textGroesse,
      rotation: textRotation || undefined,
      fett: textFett || undefined,
    } as Omit<DrawCommand, 'id'>)
    onTextCommitRef.current?.()
  },
})
```

(Wichtig: `onCommit` empfängt `text` bereits getrimmt aus dem Hook — `prev.text.trim()` passiert intern.)

handleStart case 'text' (mit destrukturiertem Namen):
```typescript
case 'text': {
  const cssLeft = (punkt.x / logischeBreite) * 100
  const cssTop = ((punkt.y - 18) / logischeHoehe) * 100
  textOverlayOeffnen({ logischX: punkt.x, logischY: punkt.y, cssLeft, cssTop })
  break
}
```

JSX:
```typescript
{textOverlaySichtbar && (
  <div style={{ position: 'absolute', left: `${textOverlayCssLeft}%`, top: `${textOverlayCssTop}%`, zIndex: 20 }} ...>
    <input
      ref={textOverlayInputRef}
      value={textOverlayText}
      onChange={e => textOverlaySetText(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); textOverlayAbschliessen(false) }
        else if (e.key === 'Escape') { e.preventDefault(); textOverlayAbschliessen(true) }
        e.stopPropagation()
      }}
      onBlur={textOverlayAbschliessenViaBlur}
      ...
    />
  </div>
)}
```

usePointerEvents-Guard:
```typescript
usePointerEvents({
  ...
  textOverlaySichtbarRef,  // destrukturierter Ref-Name, stable identity
  ...
})
```

### 4.5 `useStiftRendering` Service-API

```typescript
// ExamLab/src/components/fragetypen/zeichnen/useStiftRendering.ts
import { useCallback, useEffect, useRef } from 'react'
import type { DrawCommand, Point } from './ZeichnenTypes'

interface StiftMeta {
  id: string
  farbe: string
  breite: number
  gestrichelt?: boolean
}

interface UseStiftRenderingOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  /** Engine-Render-Funktion mit optionalem Preview-Command */
  renderMitPreview: (ctx: CanvasRenderingContext2D, previewCmd: DrawCommand | null) => void
}

interface UseStiftRenderingResult {
  stiftBufferRef: React.MutableRefObject<Point[]>
  stiftMetaRef: React.MutableRefObject<StiftMeta | null>
  /** Read-only-Ref für Render-Loop-Guard (true wenn rAF aktiv) */
  istAktivRef: React.RefObject<boolean>
  starteRendering: () => void
  stoppeRendering: () => void
}

/**
 * rAF-basiertes Stift-Preview-Rendering ohne React-State-Updates.
 *
 * **Performance-Pattern (Session 50):** Pointer-Move-Events füllen `stiftBufferRef`
 * direkt (kein State-Update); rAF-Loop liest den Buffer pro Frame und ruft
 * `renderMitPreview(ctx, previewCmd)`. Verhindert Re-Render pro Pointer-Event
 * bei schnellem Zeichnen auf Tablet.
 *
 * **Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 188-263:**
 * - Synchroner `istAktivRef.current` Check vor Start (Race-Prevention)
 * - DPR-Skalierung im rAF-Frame
 * - Weisser fillRect vor jedem Frame (Hintergrund-Reset)
 * - Cleanup bei Unmount: `cancelAnimationFrame` + `istAktivRef = false`
 */
export function useStiftRendering({
  canvasRef,
  renderMitPreview,
}: UseStiftRenderingOptions): UseStiftRenderingResult {
  const stiftBufferRef = useRef<Point[]>([])
  const stiftMetaRef = useRef<StiftMeta | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const istAktivRef = useRef<boolean>(false)

  const renderMitPreviewRef = useRef(renderMitPreview)
  renderMitPreviewRef.current = renderMitPreview

  const starteRendering = useCallback(() => {
    if (istAktivRef.current) return
    istAktivRef.current = true

    const cvs: HTMLCanvasElement | null = canvasRef.current
    if (!cvs) return
    const context: CanvasRenderingContext2D | null = cvs.getContext('2d')
    if (!context) return

    const c = context
    const el = cvs
    const dpr = window.devicePixelRatio || 1

    function frame() {
      if (!istAktivRef.current) return

      const meta = stiftMetaRef.current
      const punkte = stiftBufferRef.current

      const previewCmd: DrawCommand | null =
        meta && punkte.length > 0
          ? { id: meta.id, typ: 'stift', punkte, farbe: meta.farbe, breite: meta.breite, gestrichelt: meta.gestrichelt }
          : null

      c.save()
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, el.width, el.height)
      c.restore()

      c.save()
      c.scale(dpr, dpr)
      renderMitPreviewRef.current(c, previewCmd)
      c.restore()

      rafIdRef.current = requestAnimationFrame(frame)
    }

    rafIdRef.current = requestAnimationFrame(frame)
  }, [canvasRef])

  const stoppeRendering = useCallback(() => {
    istAktivRef.current = false
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      istAktivRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return { stiftBufferRef, stiftMetaRef, istAktivRef, starteRendering, stoppeRendering }
}
```

**Migration für ZeichnenCanvas.tsx**:

Hook-Aufruf mit Destrukturierung in stabile Namen (gleiche Begründung wie `useTextOverlay` — Result-Object-Identity wechselt pro Render):

```typescript
const {
  stiftBufferRef,
  stiftMetaRef,
  istAktivRef: stiftIstAktivRef,
  starteRendering: starteStiftRendering,
  stoppeRendering: stoppeStiftRendering,
} = useStiftRendering({
  canvasRef,
  renderMitPreview: engine.renderMitPreview,
})
```

handleStart case 'stift':
```typescript
case 'stift': {
  const id = generiereCommandId()
  stiftBufferRef.current = [punkt]
  stiftMetaRef.current = {
    id,
    farbe: aktiveFarbe,
    breite: stiftBreite,
    gestrichelt: stiftGestrichelt || undefined,
  }
  starteStiftRendering()
  break
}
```

handleMove case 'stift':
```typescript
case 'stift': {
  stiftBufferRef.current.push(punkt)
  break
}
```

handleEnd case 'stift':
```typescript
case 'stift': {
  stoppeStiftRendering()
  stiftBufferRef.current.push(punkt)
  const meta = stiftMetaRef.current
  if (meta && stiftBufferRef.current.length > 0) {
    engine.addCommand({
      typ: 'stift',
      punkte: stiftBufferRef.current,
      farbe: meta.farbe,
      breite: meta.breite,
      gestrichelt: meta.gestrichelt,
    } as Omit<DrawCommand, 'id'>)
  }
  stiftBufferRef.current = []
  stiftMetaRef.current = null
  break
}
```

Render-Loop-Guard (Z. 282 in source):
```typescript
useEffect(() => {
  if (stiftIstAktivRef.current) return  // ← byte-identisch zu Source, nur Ref-Name geändert
  ...
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [engine.state, engine, hintergrundbild])  // refs (canvasRef, stiftIstAktivRef) NICHT in deps — byte-identisch zu Source
```

## 5. Verhalten

### 5.1 Bewahrte Invarianten (byte-identisch)

| # | Invariante | Quelle | Migration |
|---|---|---|---|
| 1 | `useDebounce(fn, 400)` für Auto-Save | Z. 330-335 | unverändert, nur Import-Pfad |
| 2 | iOS-Auto-Focus 50ms-Fallback | Z. 377-388 | in `useTextOverlay` |
| 3 | Blur-Suppress 400ms-Window | Z. 770-774 | in `useTextOverlay.abschliessenViaBlur` |
| 4 | Blur-Delay 150ms vor `abschliessen` | Z. 774 | in `useTextOverlay.abschliessenViaBlur` |
| 5 | Outside-Click `capture: true` | Z. 405, 410 | in `useTextOverlay` |
| 6 | Outside-Click `setTimeout(0)` Initial-Tick-Skip | Z. 404 | in `useTextOverlay` |
| 7 | Pen-Active synchronous-write Race-Prevention | Z. 207-208 | in `useStiftRendering.starteRendering` |
| 8 | DPR-Skalierung im rAF-Frame | Z. 217, 236 | in `useStiftRendering` |
| 9 | Weisser fillRect vor jedem rAF-Frame | Z. 230-233 | in `useStiftRendering` |
| 10 | Render-Loop-Guard (`istAktivRef.current` skip) | Z. 282 | in ZeichnenCanvas, liest destrukturierten `stiftIstAktivRef` |
| 11 | `letzterPunktRef` für Auswahl-Drag | Z. 180 | bleibt in ZeichnenCanvas (eng mit handleStart/Move gekoppelt) |
| 12 | Engine-Actions-Reporting useEffect | Z. 155-166 | bleibt in ZeichnenCanvas |
| 13 | Tastatur-Delete-Shortcut | Z. 676-692 | bleibt in ZeichnenCanvas |
| 14 | initialDaten → engine.ladeDaten useEffect | Z. 269-274 | bleibt in ZeichnenCanvas |
| 15 | onTextCommit Reset-Callback nach Text-Commit | Z. 363 | in ZeichnenCanvas via Ref-Spiegel |

### 5.2 Was bleibt in ZeichnenCanvas.tsx

- `interface ZeichnenCanvasProps` + Default-Werte
- `useDrawingEngine`-Aufruf
- Engine-Actions-Reporting-Effect (Z. 155-166)
- `onTextCommitRef`-Spiegel (Z. 125-126)
- `letzterPunktRef` (Z. 180)
- `initialDaten`-Load-Effect (Z. 269-274)
- Render-Loop-Effect (Z. 280-303, mit `stiftIstAktivRef`-Guard)
- `useDebounce` für Auto-Save (Z. 324-340)
- `handleStart` / `handleMove` / `handleEnd` (umgeschrieben für destrukturierte `textOverlayOeffnen` + `starteStiftRendering`/`stoppeStiftRendering`/`stiftBufferRef`/`stiftMetaRef`)
- `usePointerEvents`-Aufruf
- `cursorFuerTool`-Helper
- DPR-Berechnung für Canvas-Attribute
- Tastatur-Shortcut-Effect (Z. 676-692)
- JSX (mit Text-Overlay als `{textOverlaySichtbar && ...}` mittels destrukturierter Namen)
- `exportiereCanvasAlsPNG`-Hilfsfunktion (Z. 801-804, exportiert)

### 5.3 Was wandert raus

| Cluster | Hook | Source-Zeilen |
|---|---|---:|
| `useDebounce`-Helper | `src/hooks/useDebounce.ts` | 88-101 |
| Canvas-Refs + Hintergrundbild + Dimensionen | `useCanvasSetup` | 123-145 |
| Text-Overlay-State + Auto-Focus + Outside-Click + textAbschliessen | `useTextOverlay` | 169-178, 346-412 |
| Stift-Buffer + rAF-Loop + starteStiftRendering + stoppeStiftRendering | `useStiftRendering` | 188-263 |
| Cluster-Total | – | ~360 Z. |

## 6. Risiko-Analyse

### 6.1 iOS-Canvas-Focus-rAF (Risiko: hoch)

Source Z. 381-385: 50ms-Fallback-Timer für Tablet-Focus-Workaround. Browser-E2E muss auf realer iPad-Simulation oder echtem iPad verifizieren, dass:
- Text-Overlay öffnet bei Touch
- `<input>` empfängt Keyboard-Focus (virtuelle Tastatur erscheint)
- Erste Touch-Eingabe schreibt nicht versehentlich Outside-Click weiter

**Mitigation:** Hook-Implementation ist byte-identisch, plus zusätzlicher Browser-E2E-Pfad #5 (T.d-spezifisch).

### 6.2 useStiftRendering ohne Vitest (Risiko: mittel)

rAF-basiert + DOM-Canvas-API → nicht in jsdom testbar. Master-Spec 4.2 erlaubt das (Test-Hybrid: Browser-E2E-only).

**Mitigation:**
- Source-Code 1:1 in Hook übernommen, `istAktivRef`/`stiftBufferRef`/`stiftMetaRef`-Semantik byte-identisch
- Browser-E2E-Pfad #1 (T.d-spezifisch): SuS-Zeichnen-Frage öffnen, schnelles Stift-Zeichnen (>20 Punkte/Sekunde), prüfen dass kein Re-Render-Lag entsteht
- Browser-E2E-Pfad #2 (T.d-spezifisch): Multi-Strich-Sequenz: Strich 1 → kurze Pause → Strich 2 → Buffer-Reset zwischen Strichen verifizieren

### 6.3 Outside-Click capture-Mode (Risiko: niedrig)

`{ capture: true }` muss byte-identisch im add+remove erhalten bleiben — sonst event-listener-leak oder doppeltes Triggering.

**Mitigation:**
- Hook serialisiert add+remove-Symmetrie via Cleanup-Function
- Vitest-Test mit `userEvent.pointerDown` ausserhalb (covers state-machine-Pfad, nicht Browser-Event-Capture-Reihenfolge)

### 6.4 Closure-Stale-Read durch Engine-Cycling (Risiko: mittel)

`textAbschliessen`-Source greift direkt auf `engine.addCommand` zu (closure auf engine). Bei Hook-Cut wird das via `onCommit`-Callback zugeflossen — der Caller bildet den Closure.

**Mitigation:**
- `onCommitRef.current = onCommit` Ref-Spiegel im Hook, stabilisiert callback identity
- `useTextOverlay.abschliessen` referenziert `onCommitRef.current` statt `onCommit`
- Hook-Test: oeffnen → setText('A') → onCommit-Mock-Re-Definition → setText('B') → abschliessen → Mock #2 wird mit 'B' aufgerufen

### 6.5 Hook-Order-Bruch beim Refactor (Risiko: mittel)

ZeichnenCanvas hat heute lineare Hook-Reihenfolge: useRef → useState → useEffect → useState → useEffect → useDrawingEngine → useEffect → useState → useRef → useEffect → useRef × 5 → useCallback × 2 → useEffect → useRef × 4 → useDebounce → useEffect → useCallback → useRef → useEffect × 2 → useCallback × 3 → usePointerEvents → useEffect.

Beim Cut werden die Hook-Calls umgruppiert (Caller hat `useCanvasSetup → useDrawingEngine → useTextOverlay → useStiftRendering → useEffect ...`).

**Mitigation:**
- Phase-5-Refactor in einem atomaren Commit, kein partial-rewrite
- vitest run nach Cut: 0 React-Hook-Order-Warnings
- Browser-E2E erste Render-Frame fehlerfrei in Console

## 7. Test-Strategie

| Hook | Vitest? | Browser-E2E? |
|---|---|---|
| `useDebounce` | **JA** — fake-timers, 3 Tests (single-call, multi-call-collapse, cleanup) | nein |
| `useCanvasSetup` (`berechneDimensionen`) | **JA** — pure function, 4 Tests (auto+bild, preset, custom, fallback) | nein |
| `useCanvasSetup` (Hook) | **NEIN** — Image-Load erfordert DOM-Mock; State-Pfad triv. | ja (LP-Editor + SuS-Üben Zeichnen-Frage öffnen) |
| `useTextOverlay` | **JA** — renderHook, 4 Tests (oeffnen, setText, abschliessen-mit-Commit, abschliessen-mit-abbrechen) | ja (iOS-Focus + Outside-Click + Blur) |
| `useStiftRendering` | **NEIN** — RAF + Canvas-API | ja (Stift-Performance + Multi-Strich) |
| `ZeichnenCanvas.tsx` | – (keine eigenen Tests, durch Hook-Tests + Browser-E2E abgedeckt) | ja (kompositorischer Pfad) |

### 7.1 Browser-E2E-Pfade (T.d-spezifisch, mit echten Logins)

Per Memory-Regel `feedback_echte_logins` — kein Demo-Modus.

1. **LP-Editor öffnen** + Zeichnen-Frage erstellen → Canvas erscheint mit Default-Hintergrund
2. **SuS-Üben Zeichnen-Frage** öffnen → Canvas mit Hintergrundbild lädt, Dimensionen korrekt
3. **Stift-Performance** schnelles Zeichnen (>20 Punkte/Sekunde) → kein Re-Render-Lag, finalize bei pointerup
4. **Multi-Strich** Strich 1 + Pause + Strich 2 → Buffer-Reset zwischen Strichen, beide Striche persistiert
5. **Text-Werkzeug normal** Klick → Overlay erscheint, Tastatur-Focus auf Input → Tippen → Enter → Text als Command sichtbar
6. **Text-Werkzeug Outside-Click** Klick → Overlay erscheint → Klick ausserhalb → Overlay schliesst, Text als Command (falls Inhalt) oder verworfen (falls leer)
7. **Text-Werkzeug Escape** Klick → Overlay → Tippen → Escape → Overlay schliesst, Text verworfen
8. **Text-Werkzeug iOS-Focus** (falls iPad verfügbar) — Touch öffnet Overlay + virtuelle Tastatur
9. **Tastatur-Delete** Auswahl-Werkzeug → Klick auf Element → Delete-Taste → Element gelöscht
10. **Auto-Save-Latenz** Zeichnen → 400ms Pause → onDatenChange triggert (verifizierbar via Network-Tab beim LP-Editor)
11. **Console-Errors** 0 Errors über alle Pfade

Service-Worker-Cache vor E2E zurücksetzen (Memory-Regel `feedback_service_worker_cache_wire_bundle`, hier präventiv obwohl kein Wire-Vertrag berührt wird).

## 8. Definition of Done

Nach Master-Spec §4.4 (Bundle-S/L-Standard):

- `cd ExamLab && npx vitest run` grün — drift +15 Tests (3 useDebounce + 5 berechneDimensionen + 7 useTextOverlay)
- `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` clean (Output direkt prüfen, Lehre `feedback_tsc_b_exit_misleading`)
- `cd ExamLab && npm run lint:as-any` clean (Total 0/Defensive 0/Undokumentiert 0)
- `cd ExamLab && npm run lint:no-alert` clean
- `cd ExamLab && npm run lint:no-tests-dir` clean
- `cd ExamLab && npm run lint:musterloesung` clean (Baseline unverändert)
- `cd ExamLab && npx vite build` erfolgreich
- Browser-E2E auf staging mit echten LP+SuS-Logins, Pfade 1-10 ✓
- Code-Reviewer-Subagent APPROVED
- HANDOFF.md-Eintrag + Memory-Update mit Lehren

## 9. Implementations-Reihenfolge (Risiko-aufsteigend)

1. **Phase 1**: `useDebounce` + Tests (kleinste Cut, cross-cutting, byte-identisch)
2. **Phase 2**: `useCanvasSetup` + `berechneDimensionen`-Tests (klare Verantwortung, pure-function-Tests)
3. **Phase 3**: `useTextOverlay` + Tests (komplexer State-Machine, aber decoupled von Engine)
4. **Phase 4**: `useStiftRendering` (rAF-basiert, kein Test, byte-identisch)
5. **Phase 5**: `ZeichnenCanvas.tsx`-Refactor (Komposition, atomarer Commit)
6. **Phase 6**: Lint-Gates + Build
7. **Phase 7**: Browser-E2E auf staging (User-manual)
8. **Phase 8**: Final Code-Reviewer + HANDOFF + Memory + Merge

Reihenfolge bewahrt das Bundle-S/L/T.a-T.c-Pattern: Hooks zuerst (mit Tests), Refactor des Hauptfiles als atomarer Commit am Ende.
