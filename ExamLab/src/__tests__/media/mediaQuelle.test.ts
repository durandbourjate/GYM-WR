import { describe, it, expect } from 'vitest'
import {
  istDriveQuelle,
  istPoolQuelle,
  istAppQuelle,
  istExternQuelle,
  istInlineQuelle,
  type MediaQuelle,
} from '@shared/types/mediaQuelle'

describe('MediaQuelle Type-Guards', () => {
  it('istDriveQuelle erkennt Drive-Quelle', () => {
    const q: MediaQuelle = { typ: 'drive', driveFileId: 'abc', mimeType: 'image/png' }
    expect(istDriveQuelle(q)).toBe(true)
    expect(istPoolQuelle(q)).toBe(false)
  })

  it('istPoolQuelle erkennt Pool-Quelle (Uebungspools)', () => {
    const q: MediaQuelle = { typ: 'pool', poolPfad: 'img/foo.svg', mimeType: 'image/svg+xml' }
    expect(istPoolQuelle(q)).toBe(true)
  })

  it('istAppQuelle erkennt App-lokales Asset (ExamLab/public/)', () => {
    const q: MediaQuelle = { typ: 'app', appPfad: 'demo-bilder/europa.svg', mimeType: 'image/svg+xml' }
    expect(istAppQuelle(q)).toBe(true)
    expect(istPoolQuelle(q)).toBe(false)
  })

  it('istExternQuelle erkennt externe URL', () => {
    const q: MediaQuelle = { typ: 'extern', url: 'https://example.com/x.png', mimeType: 'image/png' }
    expect(istExternQuelle(q)).toBe(true)
  })

  it('istInlineQuelle erkennt Base64', () => {
    const q: MediaQuelle = { typ: 'inline', base64: 'iVBOR', mimeType: 'image/png' }
    expect(istInlineQuelle(q)).toBe(true)
  })
})
