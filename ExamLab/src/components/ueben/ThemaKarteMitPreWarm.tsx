import type { ComponentProps } from 'react'
import { ThemaKarte } from './ThemaKarte'
import { useDebouncedHover } from '../../hooks/useDebouncedHover'

type ThemaKarteProps = ComponentProps<typeof ThemaKarte>

interface Props extends Omit<ThemaKarteProps, 'onMouseEnter' | 'onMouseLeave'> {
  onPreWarm: () => void
}

/**
 * Bundle G.a — Wrapper für ThemaKarte, der useDebouncedHover hostet.
 * Vermeidet Hook-Aufruf in `.map()`-Schleifen (Hooks-Regel-Verletzung).
 */
export function ThemaKarteMitPreWarm({ onPreWarm, ...rest }: Props) {
  const hover = useDebouncedHover(300, onPreWarm)
  return (
    <ThemaKarte
      {...rest}
      onMouseEnter={hover.onMouseEnter}
      onMouseLeave={hover.onMouseLeave}
    />
  )
}
