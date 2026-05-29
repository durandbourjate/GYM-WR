import type { RefObject } from 'react'

interface Props {
  cssLeft: number
  cssTop: number
  text: string
  setText: (v: string) => void
  abschliessen: (abbruch: boolean) => void
  abschliessenViaBlur: () => void
  inputRef: RefObject<HTMLInputElement | null>
  aktiveFarbe: string
}

/**
 * Overlay-Input über dem Canvas für Text-Annotation.
 * Stoppt Pointer/Touch/Click-Propagation, damit der Canvas darunter nicht reagiert.
 */
export function TextOverlayInput({
  cssLeft,
  cssTop,
  text,
  setText,
  abschliessen,
  abschliessenViaBlur,
  inputRef,
  aktiveFarbe,
}: Props): React.JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${cssLeft}%`,
        top: `${cssTop}%`,
        zIndex: 20,
      }}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="sentences"
        aria-label="Text eingeben"
        value={text}
        onChange={e => setText(e.target.value)}
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            abschliessen(false)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            abschliessen(true)
          }
          e.stopPropagation()
        }}
        onBlur={abschliessenViaBlur}
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
  )
}
