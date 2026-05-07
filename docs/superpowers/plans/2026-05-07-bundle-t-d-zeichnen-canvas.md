# Bundle T.d — ZeichnenCanvas Hook-Extraktion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ZeichnenCanvas.tsx` (804 Z., **hoch-Risiko**) per 4 Hook-Extraktionen zerlegen, ohne Verhaltensänderung. Ziel: ~440 Z. im Hauptfile (Master-Spec-Ziel <500). Hotspot-Bilanz Files >500 Z. **10 → 9**.

**Architecture:** 1 cross-cutting Hook (`useDebounce` flach in `src/hooks/`) + 3 file-lokale Hooks (`useCanvasSetup`, `useTextOverlay`, `useStiftRendering`) im existing `zeichnen/`-Sub-Folder. Pointer-Handler bleiben im Hauptfile als Komposition. Hybrid-Tests: Vitest für pure Hooks (useDebounce + berechneDimensionen + useTextOverlay-State-Machine), Browser-E2E für RAF + iOS-Focus + Outside-Click.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest. Bundle-T-Master-Spec Sektion 4.1 (cross-cutting + file-lokal Hook-Konvention).

**Spec:** [`docs/superpowers/specs/2026-05-07-bundle-t-d-zeichnen-canvas-design.md`](../specs/2026-05-07-bundle-t-d-zeichnen-canvas-design.md)

**Master-Spec:** [`docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md`](../specs/2026-05-06-bundle-t-hooks-splits-design.md), Sektion 5.1

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Branch:** `feature/bundle-t-d-zeichnen-canvas` (bereits angelegt von main + Spec auf Branch committed: `925283a`)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output prüfen (Lehre `feedback_tsc_b_exit_misleading`)

---

## Phase 0: Branch-Setup

### Task 0.1: Branch sicherstellen

- [ ] **Step 1: Branch checkout**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout feature/bundle-t-d-zeichnen-canvas
git pull origin feature/bundle-t-d-zeichnen-canvas
```

Expected: `On branch feature/bundle-t-d-zeichnen-canvas`. Wenn `pull` "no upstream" sagt → erster Push folgt nach Phase 1.

(Memory-Regel `feedback_subagent_shell_context`: Implementer-Subagents sollen explizit auf den Branch schalten — Master-Shell-Context wird nicht automatisch durchgegeben.)

---

## File Map

### Neue Files

| Datei | Größe | Verantwortung |
|---|---:|---|
| `ExamLab/src/hooks/useDebounce.ts` | ~14 Z. | Generischer Debounce-Wrapper (cross-cutting Utility) |
| `ExamLab/src/hooks/useDebounce.test.ts` | ~70 Z. | Vitest fake-timers (3 Tests) |
| `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts` | ~50 Z. | canvasRef + containerRef + hintergrundbild + Dimensionen |
| `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts` | ~50 Z. | Vitest für `berechneDimensionen` (4 Tests) |
| `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts` | ~120 Z. | Text-Overlay-State + Auto-Focus + Outside-Click + Blur-Suppress |
| `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx` | ~80 Z. | Vitest renderHook State-Machine (4 Tests) |
| `ExamLab/src/components/fragetypen/zeichnen/useStiftRendering.ts` | ~75 Z. | Stift-Buffer + rAF-Loop + starteRendering/stoppeRendering |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` | 804 Z. | ~440 Z. | Komposition der 4 Hooks + Pointer-Handler + Render-Loop + JSX |

### Pre-existing Behavior NOT addressed (Out-of-Scope-Hinweis)

`onPNGExport`-Prop von `ZeichnenCanvas` wird heute nirgends im Source aufgerufen — die `onPNGExportRef`/`exportiereRef`-Spiegel existieren als Vorbereitung, aber kein Code löst tatsächlich `onPNGExport(...)` aus. Das ist **pre-existing** (kein Bundle-T.d-Refactor-Bug); ZeichnenFrage.tsx hat den `onPNGExport`-Callback registriert, der aber nicht getriggert wird. Kein Scope für T.d. Plan bewahrt das byte-identisch (Refs werden weiter geschrieben, nie gelesen).

### Reihenfolge (Risiko-aufsteigend)

1. **Phase 1**: `useDebounce` + Tests (kleinste Cut, cross-cutting)
2. **Phase 2**: `useCanvasSetup` + `berechneDimensionen`-Tests
3. **Phase 3**: `useTextOverlay` + Tests
4. **Phase 4**: `useStiftRendering` (kein Test)
5. **Phase 5**: `ZeichnenCanvas.tsx`-Refactor (atomar)
6. **Phase 6**: Lint-Gates + Build
7. **Phase 7**: Browser-E2E auf staging (User-manual)
8. **Phase 8**: Final Code-Reviewer + HANDOFF + Memory + Merge

---

## Phase 1: `useDebounce` Hook (cross-cutting)

### Task 1.1: Hook implementieren

**Files:**
- Create: `ExamLab/src/hooks/useDebounce.ts`

- [ ] **Step 1: Hook-File schreiben (1:1-Move aus ZeichnenCanvas.tsx Z. 88-101)**

```typescript
// ExamLab/src/hooks/useDebounce.ts
import { useCallback, useRef } from 'react'

/**
 * Debounce-Wrapper für Callbacks. Multiple Aufrufe innerhalb `delay` ms collapsen
 * zu einem Aufruf nach Ende der Pause.
 *
 * Byte-identisch zum vormaligen inline-Helper in ZeichnenCanvas.tsx.
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

- [ ] **Step 2: tsc-Check**

Run: `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log`
Expected: PASS (no new errors related to useDebounce.ts)

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/hooks/useDebounce.ts
git commit -m "Bundle T.d Phase 1.1: useDebounce Hook (cross-cutting Utility)"
```

### Task 1.2: Tests schreiben

**Files:**
- Create: `ExamLab/src/hooks/useDebounce.test.ts`

- [ ] **Step 1: Test-File schreiben**

```typescript
// ExamLab/src/hooks/useDebounce.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('feuert callback einmal nach delay-Ablauf', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 400))

    act(() => result.current())
    expect(fn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('multi-call innerhalb delay-Window collapsed zu einem Aufruf', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 400))

    act(() => result.current())
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => result.current())
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(fn).not.toHaveBeenCalled()  // Reset bei zweitem Call

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(fn).toHaveBeenCalledTimes(1)  // Erst nach komplettem 400ms-Window
  })

  it('passt args an callback durch', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce<(x: number, y: string) => void>(fn, 100))

    act(() => result.current(42, 'test'))
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(fn).toHaveBeenCalledWith(42, 'test')
  })
})
```

- [ ] **Step 2: Tests ausführen**

Run: `cd ExamLab && npx vitest run src/hooks/useDebounce.test.ts`
Expected: PASS — 3 Tests grün

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/hooks/useDebounce.test.ts
git commit -m "Bundle T.d Phase 1.2: useDebounce Tests (3 Tests, fake-timers)"
```

---

## Phase 2: `useCanvasSetup` Hook (file-lokal)

### Task 2.1: Hook implementieren

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts`

- [ ] **Step 1: Hook-File schreiben**

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
 * Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 123-145.
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

- [ ] **Step 2: tsc-Check**

Run: `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log`
Expected: PASS (no new errors)

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts
git commit -m "Bundle T.d Phase 2.1: useCanvasSetup Hook + berechneDimensionen export"
```

### Task 2.2: Tests schreiben

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts`

- [ ] **Step 1: Test-File schreiben**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts
import { describe, it, expect } from 'vitest'
import type { CanvasConfig } from '../../../types/fragen-storage'
import { GROESSE_PRESETS } from './ZeichnenTypes'
import { berechneDimensionen } from './useCanvasSetup'

describe('berechneDimensionen', () => {
  it('preset=auto + Hintergrundbild → naturalWidth/Height', () => {
    const config: CanvasConfig = { groessePreset: 'auto' }
    const img = { naturalWidth: 1200, naturalHeight: 800 } as HTMLImageElement
    expect(berechneDimensionen(config, img)).toEqual({ breite: 1200, hoehe: 800 })
  })

  it('preset != auto + valid Preset → GROESSE_PRESETS[preset]', () => {
    const config: CanvasConfig = { groessePreset: 'mittel' }
    expect(berechneDimensionen(config, null)).toEqual(GROESSE_PRESETS['mittel'])
  })

  it('preset undefined + custom breite/hoehe → custom Dimensionen', () => {
    const config: CanvasConfig = { breite: 1024, hoehe: 768 }
    expect(berechneDimensionen(config, null)).toEqual({ breite: 1024, hoehe: 768 })
  })

  it('kein Preset, keine Dimensionen → Fallback mittel', () => {
    const config: CanvasConfig = {}
    expect(berechneDimensionen(config, null)).toEqual(GROESSE_PRESETS['mittel'])
  })

  it('preset=auto + kein Hintergrundbild → Fallback mittel', () => {
    const config: CanvasConfig = { groessePreset: 'auto' }
    expect(berechneDimensionen(config, null)).toEqual(GROESSE_PRESETS['mittel'])
  })
})
```

- [ ] **Step 2: Tests ausführen**

Run: `cd ExamLab && npx vitest run src/components/fragetypen/zeichnen/useCanvasSetup.test.ts`
Expected: PASS — 5 Tests grün

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts
git commit -m "Bundle T.d Phase 2.2: berechneDimensionen Tests (5 Tests, alle 4 Branches + auto-ohne-Bild)"
```

---

## Phase 3: `useTextOverlay` Hook (file-lokal)

### Task 3.1: Hook implementieren

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts`

- [ ] **Step 1: Hook-File schreiben**

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
  /** Wird aufgerufen wenn der User den Text bestätigt (Enter/Blur mit Inhalt). text ist bereits getrimmt. */
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
 * - Auto-Focus (sofort + 50ms-Fallback-Timer für iOS/Tablet)
 * - Outside-Click-Listener (capture: true, mit setTimeout(0)-Initial-Tick-Skip)
 * - Blur-Suppress in ersten 400ms nach Öffnen (Browser-Click-auf-Canvas-Blur ignorieren)
 *
 * Hook ist decoupled von Drawing-Engine: onCommit bekommt nur Text + Position.
 *
 * Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 169-178, 346-412.
 */
export function useTextOverlay({ onCommit }: UseTextOverlayOptions): UseTextOverlayResult {
  const [state, setState] = useState<TextOverlayState>(TEXT_OVERLAY_LEER)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const sichtbarRef = useRef<boolean>(false)
  const geoeffnetRef = useRef<number>(0)

  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

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

- [ ] **Step 2: tsc-Check**

Run: `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log`
Expected: PASS (no new errors)

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts
git commit -m "Bundle T.d Phase 3.1: useTextOverlay Hook (State-Machine + Auto-Focus + Outside-Click + Blur-Suppress)"
```

### Task 3.2: Tests schreiben

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx`

- [ ] **Step 1: Test-File schreiben**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTextOverlay } from './useTextOverlay'

describe('useTextOverlay', () => {
  it('startet unsichtbar', () => {
    const { result } = renderHook(() => useTextOverlay({ onCommit: vi.fn() }))
    expect(result.current.sichtbar).toBe(false)
    expect(result.current.text).toBe('')
  })

  it('oeffnen setzt sichtbar=true und Position', () => {
    const { result } = renderHook(() => useTextOverlay({ onCommit: vi.fn() }))

    act(() => {
      result.current.oeffnen({ logischX: 100, logischY: 200, cssLeft: 25, cssTop: 50 })
    })

    expect(result.current.sichtbar).toBe(true)
    expect(result.current.cssLeft).toBe(25)
    expect(result.current.cssTop).toBe(50)
    expect(result.current.text).toBe('')
  })

  it('setText aktualisiert text', () => {
    const { result } = renderHook(() => useTextOverlay({ onCommit: vi.fn() }))

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('Hallo')
    })

    expect(result.current.text).toBe('Hallo')
  })

  it('abschliessen mit Inhalt → onCommit mit getrimmtem Text + Position', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useTextOverlay({ onCommit }))

    act(() => {
      result.current.oeffnen({ logischX: 100, logischY: 200, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('  Hallo Welt  ')
    })
    act(() => {
      result.current.abschliessen(false)
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith({ text: 'Hallo Welt', logischX: 100, logischY: 200 })
    expect(result.current.sichtbar).toBe(false)
  })

  it('abschliessen mit abbrechen=true → kein onCommit, sichtbar=false', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useTextOverlay({ onCommit }))

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('Test')
    })
    act(() => {
      result.current.abschliessen(true)
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.sichtbar).toBe(false)
  })

  it('abschliessen mit leerem Text → kein onCommit', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useTextOverlay({ onCommit }))

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('   ')
    })
    act(() => {
      result.current.abschliessen(false)
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.sichtbar).toBe(false)
  })

  it('onCommit-Callback-Identity-Wechsel wird via Ref aktualisiert', () => {
    const onCommit1 = vi.fn()
    const onCommit2 = vi.fn()
    const { result, rerender } = renderHook(
      ({ cb }: { cb: (p: { text: string; logischX: number; logischY: number }) => void }) => useTextOverlay({ onCommit: cb }),
      { initialProps: { cb: onCommit1 } },
    )

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('A')
    })
    rerender({ cb: onCommit2 })
    act(() => {
      result.current.abschliessen(false)
    })

    expect(onCommit1).not.toHaveBeenCalled()
    expect(onCommit2).toHaveBeenCalledTimes(1)
    expect(onCommit2).toHaveBeenCalledWith({ text: 'A', logischX: 0, logischY: 0 })
  })
})
```

- [ ] **Step 2: Tests ausführen**

Run: `cd ExamLab && npx vitest run src/components/fragetypen/zeichnen/useTextOverlay.test.tsx`
Expected: PASS — 7 Tests grün

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx
git commit -m "Bundle T.d Phase 3.2: useTextOverlay Tests (7 Tests inkl. Ref-Spiegel-Verifikation)"
```

---

## Phase 4: `useStiftRendering` Hook (file-lokal, kein Vitest)

### Task 4.1: Hook implementieren

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/useStiftRendering.ts`

- [ ] **Step 1: Hook-File schreiben**

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
 * Performance-Pattern (Session 50): Pointer-Move-Events füllen stiftBufferRef
 * direkt (kein State-Update); rAF-Loop liest den Buffer pro Frame und ruft
 * renderMitPreview(ctx, previewCmd). Verhindert Re-Render pro Pointer-Event
 * bei schnellem Zeichnen auf Tablet.
 *
 * Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 188-263.
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

- [ ] **Step 2: tsc-Check**

Run: `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log`
Expected: PASS (no new errors)

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/useStiftRendering.ts
git commit -m "Bundle T.d Phase 4.1: useStiftRendering Hook (rAF-Loop + Buffer-Refs, byte-identisch zu Source)"
```

---

## Phase 5: `ZeichnenCanvas.tsx` Refactor (atomar)

**Wichtig:** Diese Phase ist ein einziger atomarer Commit. Kein partial-rewrite.

### Task 5.1: ZeichnenCanvas.tsx neu schreiben

**Files:**
- Modify: `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx`

- [ ] **Step 1: File neu schreiben (komplettes File ersetzen)**

Komplette neue Version (mit Erläuterungs-Kommentaren für Reviewer; im File ohne diese Meta-Kommentare zu schreiben):

```typescript
import { useEffect, useRef, useCallback } from 'react'
import type { CanvasConfig } from '../../../types/fragen-storage'
import type { Tool, DrawCommand, Point } from './ZeichnenTypes'
import { generiereCommandId } from './ZeichnenTypes'
import { useDrawingEngine, findeCommandBeiPunkt } from './useDrawingEngine'
import { usePointerEvents } from './usePointerEvents'
import { useDebounce } from '../../../hooks/useDebounce'
import { useCanvasSetup } from './useCanvasSetup'
import { useTextOverlay } from './useTextOverlay'
import { useStiftRendering } from './useStiftRendering'

interface ZeichnenCanvasProps {
  canvasConfig: CanvasConfig
  aktivesTool: Tool
  aktiveFarbe: string
  stiftBreite?: number
  stiftGestrichelt?: boolean
  textRotation?: 0 | 90 | 180 | 270
  textGroesse?: number
  textFett?: boolean
  initialDaten?: string
  onDatenChange: (daten: string) => void
  onPNGExport: (png: string) => void
  disabled: boolean
  onEngineActions?: (actions: {
    undo: () => void
    redo: () => void
    allesLoeschen: () => void
    kannUndo: boolean
    kannRedo: boolean
    updateCommand: (id: string, updates: Partial<DrawCommand>) => void
    selektierterCommand: string | null
    commands: DrawCommand[]
  }) => void
  /** Wird nach dem Abschliessen eines Text-Overlays aufgerufen (Reset für Rotation etc.) */
  onTextCommit?: () => void
}

export function ZeichnenCanvas({
  canvasConfig,
  aktivesTool,
  aktiveFarbe,
  stiftBreite = 2,
  stiftGestrichelt = false,
  textRotation = 0,
  textGroesse = 18,
  textFett = false,
  initialDaten,
  onDatenChange,
  onPNGExport,
  disabled,
  onEngineActions,
  onTextCommit,
}: ZeichnenCanvasProps) {
  const onTextCommitRef = useRef(onTextCommit)
  onTextCommitRef.current = onTextCommit

  // Canvas-Setup: refs + Hintergrundbild + Dimensionen
  const { canvasRef, containerRef, hintergrundbild, logischeBreite, logischeHoehe } = useCanvasSetup({ canvasConfig })

  // Drawing Engine
  const engine = useDrawingEngine({
    hintergrundbild,
    breite: logischeBreite,
    hoehe: logischeHoehe,
  })

  // Stift-Rendering (rAF-Loop + Buffer)
  // Destrukturiert für stabile Callback-Identity (sonst re-attached usePointerEvents pro Render)
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

  // Text-Overlay (State-Machine + Auto-Focus + Outside-Click)
  // Destrukturiert: alle Callbacks/Refs sind useCallback/useRef → stabile Identity
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

  // Engine-Aktionen an Elternkomponente melden
  useEffect(() => {
    onEngineActions?.({
      undo: engine.undo,
      redo: engine.redo,
      allesLoeschen: engine.allesLoeschen,
      kannUndo: engine.kannUndo,
      kannRedo: engine.kannRedo,
      updateCommand: engine.updateCommand,
      selektierterCommand: engine.state.selektierterCommand,
      commands: engine.state.commands,
    })
  }, [engine.state.commands, engine.state.selektierterCommand, engine.undo, engine.redo, engine.allesLoeschen, engine.kannUndo, engine.kannRedo, engine.updateCommand, onEngineActions])

  // Zustand für Drag (Auswahl-Werkzeug)
  const letzterPunktRef = useRef<Point | null>(null)

  // Daten laden wenn initialDaten sich ändert (Fragen-Wechsel)
  useEffect(() => {
    if (initialDaten) {
      engine.ladeDaten(initialDaten)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDaten])

  // Render-Loop: bei State-Änderungen neu zeichnen.
  // Wenn die rAF-Loop aktiv ist, übernimmt sie das Rendering — kein doppeltes Zeichnen.
  // (deps byte-identisch zu Source: refs werden NICHT in deps geführt — Reviewer M4)
  useEffect(() => {
    if (stiftIstAktivRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    ctx.save()
    ctx.scale(dpr, dpr)
    engine.render(ctx)
    ctx.restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state, engine, hintergrundbild])

  // Auto-Save: debounced onDatenChange bei Commands-Änderung
  const onDatenChangeRef = useRef(onDatenChange)
  onDatenChangeRef.current = onDatenChange

  const serializiereRef = useRef(engine.serialisiere)
  serializiereRef.current = engine.serialisiere

  const debouncedSave = useDebounce(
    useCallback(() => {
      onDatenChangeRef.current(serializiereRef.current())
    }, []),
    400,
  )

  useEffect(() => {
    debouncedSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state.commands])

  // PNG-Export-Ref (von Parent über onPNGExport-Callback bedient)
  const exportiereRef = useRef(engine.exportierePNG)
  exportiereRef.current = engine.exportierePNG

  const onPNGExportRef = useRef(onPNGExport)
  onPNGExportRef.current = onPNGExport

  // Pointer-Event-Handler
  const handleStart = useCallback(
    (punkt: Point, _pointerType: string) => {
      letzterPunktRef.current = punkt

      switch (aktivesTool) {
        case 'auswahl': {
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt)
          engine.selektiere(gefunden)
          break
        }

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

        case 'radierer': {
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt)
          if (gefunden) engine.loescheById(gefunden)
          break
        }

        case 'linie': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'linie',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gestrichelt: stiftGestrichelt || undefined,
          }
          engine.updateAktiverCommand(cmd)
          break
        }

        case 'pfeil': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: 'pfeil',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gestrichelt: stiftGestrichelt || undefined,
          }
          engine.updateAktiverCommand(cmd)
          break
        }

        case 'rechteck':
        case 'ellipse': {
          const cmd: DrawCommand = {
            id: generiereCommandId(),
            typ: aktivesTool as 'rechteck' | 'ellipse',
            von: punkt,
            bis: punkt,
            farbe: aktiveFarbe,
            breite: stiftBreite,
            gefuellt: false,
            gestrichelt: stiftGestrichelt || undefined,
          }
          engine.updateAktiverCommand(cmd)
          break
        }

        case 'text': {
          const cssLeft = (punkt.x / logischeBreite) * 100
          const cssTop = ((punkt.y - 18) / logischeHoehe) * 100
          textOverlayOeffnen({ logischX: punkt.x, logischY: punkt.y, cssLeft, cssTop })
          break
        }
      }
    },
    [aktivesTool, aktiveFarbe, stiftBreite, stiftGestrichelt, engine, logischeBreite, logischeHoehe, starteStiftRendering, textOverlayOeffnen],
  )

  const handleMove = useCallback(
    (punkt: Point, _pointerType: string) => {
      switch (aktivesTool) {
        case 'auswahl': {
          if (engine.state.selektierterCommand === null) break
          const letzter = letzterPunktRef.current
          if (!letzter) break
          const dx = punkt.x - letzter.x
          const dy = punkt.y - letzter.y
          engine.verschiebeSelektierten(dx, dy)
          letzterPunktRef.current = punkt
          break
        }

        case 'stift': {
          stiftBufferRef.current.push(punkt)
          break
        }

        case 'radierer': {
          const gefunden = findeCommandBeiPunkt(engine.state.commands, punkt)
          if (gefunden) engine.loescheById(gefunden)
          break
        }

        case 'linie': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'linie') break
          engine.updateAktiverCommand({ ...aktiver, bis: punkt })
          break
        }

        case 'pfeil': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'pfeil') break
          engine.updateAktiverCommand({ ...aktiver, bis: punkt })
          break
        }

        case 'rechteck':
        case 'ellipse': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || (aktiver.typ !== 'rechteck' && aktiver.typ !== 'ellipse')) break
          engine.updateAktiverCommand({ ...aktiver, bis: punkt })
          break
        }

        case 'text':
          break
      }
    },
    [aktivesTool, engine],
  )

  const handleEnd = useCallback(
    (punkt: Point, _pointerType: string) => {
      switch (aktivesTool) {
        case 'auswahl': {
          letzterPunktRef.current = null
          break
        }

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

        case 'radierer':
          break

        case 'linie': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'linie') break
          engine.addCommand({ ...aktiver, bis: punkt } as Omit<DrawCommand, 'id'>)
          break
        }

        case 'pfeil': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || aktiver.typ !== 'pfeil') break
          engine.addCommand({ ...aktiver, bis: punkt } as Omit<DrawCommand, 'id'>)
          break
        }

        case 'rechteck':
        case 'ellipse': {
          const aktiver = engine.state.aktiverCommand
          if (!aktiver || (aktiver.typ !== 'rechteck' && aktiver.typ !== 'ellipse')) break
          engine.addCommand({ ...aktiver, bis: punkt } as unknown as Omit<DrawCommand, 'id'>)
          break
        }

        case 'text':
          break
      }
    },
    [aktivesTool, engine, stoppeStiftRendering],
  )

  // Pointer Events registrieren
  usePointerEvents({
    canvasRef,
    aktivesTool,
    breite: logischeBreite,
    hoehe: logischeHoehe,
    disabled,
    textOverlaySichtbarRef,
    onStart: handleStart,
    onMove: handleMove,
    onEnd: handleEnd,
  })

  // Cursor je nach Werkzeug
  function cursorFuerTool(tool: Tool): string {
    switch (tool) {
      case 'auswahl':   return 'default'
      case 'stift':     return 'crosshair'
      case 'linie':     return 'crosshair'
      case 'pfeil':     return 'crosshair'
      case 'rechteck':  return 'crosshair'
      case 'ellipse':   return 'crosshair'
      case 'text':      return 'text'
      case 'radierer':  return 'cell'
      default:          return 'default'
    }
  }

  // Canvas-Attribute (DPR-aware)
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
  const canvasBreite = Math.round(logischeBreite * dpr)
  const canvasHoehe = Math.round(logischeHoehe * dpr)

  // Tastatur-Shortcuts: Delete-Taste zum Löschen selektierter Elemente
  useEffect(() => {
    if (disabled) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ziel = e.target as HTMLElement
        if (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA') return
        if (engine.state.selektierterCommand !== null) {
          engine.loescheSelektierten()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, engine])

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      style={{ width: '100%', maxWidth: `${logischeBreite}px` }}
    >
      <canvas
        ref={canvasRef}
        width={canvasBreite}
        height={canvasHoehe}
        style={{
          width: '100%',
          maxWidth: `${logischeBreite}px`,
          height: 'auto',
          display: 'block',
          cursor: disabled ? 'not-allowed' : cursorFuerTool(aktivesTool),
          backgroundColor: '#ffffff',
        }}
        className="border-2 border-slate-300 dark:border-slate-600 rounded"
        aria-label="Zeichenfläche"
      />

      {textOverlaySichtbar && (
        <div
          style={{
            position: 'absolute',
            left: `${textOverlayCssLeft}%`,
            top: `${textOverlayCssTop}%`,
            zIndex: 20,
          }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <input
            ref={textOverlayInputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="sentences"
            value={textOverlayText}
            onChange={e => textOverlaySetText(e.target.value)}
            onPointerDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                textOverlayAbschliessen(false)
              } else if (e.key === 'Escape') {
                e.preventDefault()
                textOverlayAbschliessen(true)
              }
              e.stopPropagation()
            }}
            onBlur={textOverlayAbschliessenViaBlur}
            style={{
              fontSize: '18px',
              fontFamily: 'sans-serif',
              color: aktiveFarbe,
              background: 'rgba(255,255,255,0.95)',
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              padding: '4px 8px',
              minWidth: '140px',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            placeholder="Text eingeben..."
          />
        </div>
      )}
    </div>
  )
}

// Hilfsfunktion: Export-Trigger ohne imperatives Handle
export function exportiereCanvasAlsPNG(canvas: HTMLCanvasElement | null): string {
  if (!canvas) return ''
  return canvas.toDataURL('image/png')
}
```

- [ ] **Step 2: tsc + lint:as-any prüfen (kein neues `as any`-Drift)**

Run: `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log && npm run lint:as-any`
Expected: tsc-Output ohne neue Errors. lint:as-any Total 0/Defensive 0/Undokumentiert 0.

- [ ] **Step 3: Vollen Vitest-Run**

Run: `cd ExamLab && npx vitest run 2>&1 | tail -30`
Expected: PASS — 1287 (T.c-Baseline) +15 (3 useDebounce + 5 berechneDimensionen + 7 useTextOverlay) = **1302 Tests**, drift = +15

- [ ] **Step 4: Zeilenzahl verifizieren**

Run: `wc -l ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx`
Expected: ~440 Z. (Toleranz ±30 Z. — Master-Spec-Ziel <500)

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx
git commit -m "Bundle T.d Phase 5.1: ZeichnenCanvas.tsx schlank (804 → ~440 Z.) — Komposition der 4 Hooks"
```

---

## Phase 6: Lint-Gates + Build

### Task 6.1: Alle 4 Lint-Gates + Build

- [ ] **Step 1: lint:as-any**

Run: `cd ExamLab && npm run lint:as-any`
Expected: Total 0/Defensive 0/Undokumentiert 0

- [ ] **Step 2: lint:no-alert**

Run: `cd ExamLab && npm run lint:no-alert`
Expected: 0 Treffer

- [ ] **Step 3: lint:no-tests-dir**

Run: `cd ExamLab && npm run lint:no-tests-dir`
Expected: keine `__tests__/` Verzeichnisse

- [ ] **Step 4: lint:musterloesung**

Run: `cd ExamLab && npm run lint:musterloesung`
Expected: Baseline unverändert

- [ ] **Step 5: vite build**

Run: `cd ExamLab && npx vite build 2>&1 | tail -20`
Expected: Build erfolgreich, PWA generateSW OK

- [ ] **Step 6: Vollen vitest-Run final**

Run: `cd ExamLab && npx vitest run 2>&1 | tail -10`
Expected: 1302 Tests grün

- [ ] **Step 7: Commit (falls keine Änderungen, skip)**

Falls Lint-Gates Edits triggerten (sollte nicht), commit. Sonst Phase 6 Verification-Marker:
```bash
git commit --allow-empty -m "Bundle T.d Phase 6: Lint-Gates + Build verified"
```

---

## Phase 7: Browser-E2E auf staging (User-manual)

### Task 7.1: Staging-Branch aktualisieren

- [ ] **Step 1: Branch zu staging mergen**

```bash
git fetch origin staging
git checkout -B staging origin/staging
git merge feature/bundle-t-d-zeichnen-canvas
git push origin staging
git checkout feature/bundle-t-d-zeichnen-canvas
```

(Lokales `staging` wird hart von `origin/staging` rekonstruiert um stale-State zu vermeiden, dann gemerged.)

- [ ] **Step 2: Service-Worker-Cache reset (User-Browser)**

User-Action im Browser:
- DevTools öffnen → Application Tab
- Service Workers → "Unregister" für die staging-Domain
- Storage → "Clear site data"
- Hard Reload (Cmd+Shift+R)

(Memory-Regel `feedback_service_worker_cache_wire_bundle` — präventiv obwohl kein Wire-Vertrag berührt)

### Task 7.2: E2E-Pfade durchspielen (echte Logins, Memory-Regel `feedback_echte_logins`)

- [ ] **Pfad 1: LP-Editor öffnen + Zeichnen-Frage erstellen**
  - Login: `wr.test@gymhofwil.ch` (LP-Account)
  - Fragensammlung → Neue Frage → Typ "Zeichnen"
  - **Erwartung:** Canvas erscheint mit Default-Hintergrund, Toolbar sichtbar

- [ ] **Pfad 2: SuS-Üben Zeichnen-Frage öffnen**
  - Login: SuS-Test-Account
  - Üben → Fach mit Zeichnen-Frage → Frage öffnen
  - **Erwartung:** Canvas mit Hintergrundbild lädt, Dimensionen passen

- [ ] **Pfad 3: Stift-Performance**
  - Stift-Werkzeug aktivieren → schnell zeichnen (>20 Punkte/Sekunde)
  - **Erwartung:** Kein Re-Render-Lag, Strich erscheint flüssig, finalize bei pointerup

- [ ] **Pfad 4: Multi-Strich**
  - Strich 1 zeichnen → 1 Sekunde Pause → Strich 2 zeichnen
  - **Erwartung:** Buffer-Reset zwischen Strichen, beide Striche persistiert nach pointerup

- [ ] **Pfad 5: Text-Werkzeug normal-Pfad**
  - Text-Werkzeug → Klick auf Canvas → Overlay erscheint → Tippen "Hallo" → Enter
  - **Erwartung:** Text-Command sichtbar an Position, Overlay verschwunden

- [ ] **Pfad 6: Text-Werkzeug Outside-Click**
  - Text-Werkzeug → Klick → Overlay → Tippen "Test" → Klick ausserhalb auf Canvas
  - **Erwartung:** Overlay schliesst, Text als Command (weil Inhalt > 0)

- [ ] **Pfad 7: Text-Werkzeug Escape**
  - Text-Werkzeug → Klick → Overlay → Tippen "Verwerfen" → Escape
  - **Erwartung:** Overlay schliesst, Text NICHT übernommen

- [ ] **Pfad 8: Text-Werkzeug iOS-Focus** (falls iPad verfügbar)
  - Auf iPad-Simulator oder echtem iPad: Text-Werkzeug → Touch auf Canvas
  - **Erwartung:** Overlay erscheint UND virtuelle Tastatur erscheint (Auto-Focus funktioniert)

- [ ] **Pfad 9: Tastatur-Delete**
  - Auswahl-Werkzeug → Klick auf existierendes Element → Delete-Taste
  - **Erwartung:** Element gelöscht

- [ ] **Pfad 10: Auto-Save-Latenz** (LP-Editor)
  - Zeichnen → 400ms Pause → Network-Tab beobachten
  - **Erwartung:** Save-Request feuert nach Pause, nicht pro Pointer-Event

- [ ] **Pfad 11: Console-Errors**
  - Console öffnen während aller Pfade
  - **Erwartung:** 0 Errors über alle Pfade

### Task 7.3: User-Bestätigung im Chat

- [ ] **Step 1: User berichtet Pfad-Status zurück**

User antwortet im Chat: "Pfade 1-11 ✅" oder mit Liste defekter Pfade.

---

## Phase 8: Final Code-Reviewer + HANDOFF + Memory + Merge

### Task 8.1: Code-Reviewer-Subagent

- [ ] **Step 1: Subagent dispatchen**

Use `superpowers:code-reviewer` Subagent mit Branch-Diff (`git diff main..feature/bundle-t-d-zeichnen-canvas -- ExamLab/src/`):
- Verifizieren: byte-identical Behavior für 15 Invarianten aus Spec §5.1
- Verifizieren: Ref-Spiegel-Pattern korrekt für `onCommit`
- Verifizieren: keine neuen `as any`-Drifts
- Verifizieren: `stift.istAktivRef.current`-Guard im Render-Loop bleibt
- Verifizieren: Kein dead code (ungenutzte useRef, useState)
- APPROVED oder ❌ Issues → fix iterativ

### Task 8.2: HANDOFF-Eintrag

- [ ] **Step 1: HANDOFF.md aktualisieren**

Modify: `ExamLab/HANDOFF.md`

Neuer Eintrag oben unter "Letzter Stand auf main" (analog T.c-Format aus T.c-MERGE-Eintrag):

```markdown
### Bundle T.d — ZeichnenCanvas Hook-Extraktion ✅ MERGED (2026-05-07)

Branch `feature/bundle-t-d-zeichnen-canvas`. Viertes Sub-Bundle aus Bundle T (Master-Spec auf main `1be0f6a`). Erster hoch-Risiko-File-Split per 4 Hook-Extraktionen. **ZeichnenCanvas.tsx 804 → ~440 Zeilen (-45%)** — Hotspot-Set verlassen, Master-Spec-Ziel <500 Z. erreicht. Hotspot-Bilanz Files >500 Z.: **10 → 9**.

**Was geliefert (4 neue Hooks + Tests):**
- `ExamLab/src/hooks/useDebounce.ts` (~14 Z.) — cross-cutting Utility, byte-identisch zum vormaligen inline-Helper
- `ExamLab/src/hooks/useDebounce.test.ts` (~70 Z.) — 3 Vitest-Tests mit fake-timers
- `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts` (~50 Z.) — canvasRef + containerRef + hintergrundbild + Dimensionen, exportiert `berechneDimensionen` als pure function
- `ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts` (~50 Z.) — 5 Vitest-Tests für `berechneDimensionen` (alle Branches)
- `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts` (~120 Z.) — Text-Overlay-State-Machine + Auto-Focus-rAF + Outside-Click-Listener + Blur-Suppress, decoupled von Drawing-Engine via `onCommit`-Callback
- `ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx` (~80 Z.) — 7 Vitest-Tests inkl. Ref-Spiegel-Verifikation
- `ExamLab/src/components/fragetypen/zeichnen/useStiftRendering.ts` (~75 Z.) — rAF-basiertes Stift-Preview-Rendering ohne React-State (Session-50-Pattern)

**Verifikation:**
- vitest **1302 passes** (drift +15 vs T.c-Baseline 1287) ✓
- tsc -b clean (Output direkt geprüft) ✓
- 4 Lint-Gates clean ✓
- vite build erfolgreich, PWA generateSW OK ✓
- Browser-E2E auf staging mit echten LP+SuS-Logins, 11 Pfade (LP-Editor, SuS-Üben, Stift-Performance, Multi-Strich, Text-Werkzeug normal/Outside-Click/Escape/iOS-Focus, Tastatur-Delete, Auto-Save, 0 Console-Errors) ✓
- Final Code-Reviewer: **APPROVED for merge**

**Architektur-Patterns:**
- Cross-cutting `useDebounce` flach in `src/hooks/` (Master-Spec 4.1)
- File-lokale Hooks im existing `zeichnen/`-Sub-Folder (Master-Spec 4.1)
- Decoupled-Callback-Pattern für Text-Overlay (`onCommit({ text, logischX, logischY })` statt direktem Engine-Closure)
- Ref-Spiegel für Callback-Identity-Stabilität (`onCommitRef.current = onCommit`)
- rAF-Loop ohne Vitest (Master-Spec 4.2 Test-Hybrid: Browser-E2E-only)
- Pure-Function-Export (`berechneDimensionen`) für isolierte Test-Coverage trotz Hook-Wrapper

**Out of Scope (für nächste Sessions):**
- Bundle T.e — Dashboard-Üben (930 Z., hoch-Risiko)
- Bundle T.f — LPStartseite (1043 Z., hoch-Risiko)
```

- [ ] **Step 2: HANDOFF commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Bundle T.d: HANDOFF-Eintrag"
```

### Task 8.3: Merge auf main

- [ ] **Step 1: Branch auf staging zurückbauen (sicher per main)**

```bash
git checkout main
git pull origin main
git merge --no-ff feature/bundle-t-d-zeichnen-canvas -m "Merge Bundle T.d: ZeichnenCanvas Hook-Extraktion (804 → ~440 Z., -45%)"
git push origin main
```

- [ ] **Step 2: Branch löschen (lokal + remote)**

```bash
git branch -d feature/bundle-t-d-zeichnen-canvas
git push origin --delete feature/bundle-t-d-zeichnen-canvas
```

### Task 8.4: Memory-Update

- [ ] **Step 1: Memory-Eintrag schreiben**

In `~/.claude/projects/.../memory/`:

Neuer File: `project_bundle_t_d_komplett.md`
Update: `MEMORY.md` mit Eintrag analog T.c.

Mindestens dokumentieren:
- Hotspot-Bilanz 10 → 9
- 4 neue Hook-Files + 3 Test-Files
- Decoupled-Callback-Pattern für Text-Overlay als neuer Architektur-Lehre
- iOS-Focus-rAF Browser-E2E-Pfad als T.d-spezifischer Test-Pattern

---

## Verifikations-Zusammenfassung (für Reviewer)

| Check | Status |
|---|---|
| ZeichnenCanvas.tsx <500 Z. | _ ✓ / ✗ |
| Hotspot-Bilanz 10 → 9 | _ ✓ / ✗ |
| vitest +15 drift (1287 → 1302) | _ ✓ / ✗ |
| tsc -b clean | _ ✓ / ✗ |
| 4 Lint-Gates clean | _ ✓ / ✗ |
| vite build erfolgreich | _ ✓ / ✗ |
| Browser-E2E 11 Pfade ✓ | _ ✓ / ✗ |
| Code-Reviewer APPROVED | _ ✓ / ✗ |
| HANDOFF + Memory-Update | _ ✓ / ✗ |
| Branch lokal+remote gelöscht | _ ✓ / ✗ |
