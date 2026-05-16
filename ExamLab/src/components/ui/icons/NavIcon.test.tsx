import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  NavIcon,
  iconStringToComponent,
  iconStringToCanonicalKey,
  LUCIDE_KEY_MAP,
  EMOJI_TO_KEY,
} from './NavIcon'

describe('iconStringToCanonicalKey', () => {
  it('Lucide-Key wird unverändert zurückgegeben', () => {
    expect(iconStringToCanonicalKey('ClipboardList')).toBe('ClipboardList')
    expect(iconStringToCanonicalKey('Star')).toBe('Star')
  })

  it('Legacy-Emoji wird in canonical Key übersetzt', () => {
    expect(iconStringToCanonicalKey('📝')).toBe('ClipboardList')
    expect(iconStringToCanonicalKey('⭐')).toBe('Star')
    expect(iconStringToCanonicalKey('❓')).toBe('HelpCircle')
  })

  it('Variant-Selector-Form wird auch erkannt', () => {
    expect(iconStringToCanonicalKey('👁️')).toBe('Eye')
    expect(iconStringToCanonicalKey('👁')).toBe('Eye')
    expect(iconStringToCanonicalKey('⚙️')).toBe('Settings')
    expect(iconStringToCanonicalKey('⚙')).toBe('Settings')
  })

  it('Unbekannter String returnt null', () => {
    expect(iconStringToCanonicalKey('🦄')).toBe(null)
    expect(iconStringToCanonicalKey('Foobar')).toBe(null)
    expect(iconStringToCanonicalKey('')).toBe(null)
  })
})

describe('iconStringToComponent', () => {
  it('liefert Komponente für Lucide-Key', () => {
    expect(iconStringToComponent('ClipboardList')).toBe(LUCIDE_KEY_MAP.ClipboardList)
  })

  it('liefert Komponente für Legacy-Emoji', () => {
    expect(iconStringToComponent('📝')).toBe(LUCIDE_KEY_MAP.ClipboardList)
  })

  it('liefert null für unbekannten String', () => {
    expect(iconStringToComponent('🦄')).toBe(null)
  })
})

describe('LUCIDE_KEY_MAP + EMOJI_TO_KEY Coverage', () => {
  it('jeder Wert in EMOJI_TO_KEY ist Key in LUCIDE_KEY_MAP', () => {
    for (const key of Object.values(EMOJI_TO_KEY)) {
      expect(LUCIDE_KEY_MAP).toHaveProperty(key)
    }
  })
})

describe('NavIcon (Render)', () => {
  it('rendert Lucide-Icon für Lucide-Key', () => {
    const { container } = render(<NavIcon icon="ClipboardList" />)
    expect(container.querySelector('svg.lucide-clipboard-list')).toBeTruthy()
  })

  it('rendert Lucide-Icon für Legacy-Emoji (Backwards-Compat)', () => {
    const { container } = render(<NavIcon icon="📝" />)
    expect(container.querySelector('svg.lucide-clipboard-list')).toBeTruthy()
  })

  it('rendert User-Custom-String als <span>', () => {
    render(<NavIcon icon="🦄" />)
    expect(screen.getByText('🦄')).toBeInTheDocument()
  })

  it('rendert nichts wenn icon leer', () => {
    const { container } = render(<NavIcon icon="" />)
    expect(container.firstChild).toBeNull()
  })

  it('rendert nichts wenn icon undefined', () => {
    const { container } = render(<NavIcon icon={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('übergibt className an Lucide-Icon', () => {
    const { container } = render(<NavIcon icon="Star" className="w-6 h-6 text-yellow-500" />)
    const svg = container.querySelector('svg.lucide-star')
    expect(svg?.getAttribute('class')).toMatch(/w-6/)
    expect(svg?.getAttribute('class')).toMatch(/text-yellow-500/)
  })

  it('setzt aria-hidden auf Lucide-Icons', () => {
    const { container } = render(<NavIcon icon="Star" />)
    const svg = container.querySelector('svg.lucide-star')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
