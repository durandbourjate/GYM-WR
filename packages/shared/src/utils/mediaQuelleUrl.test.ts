import { describe, it, expect } from 'vitest'
import { mediaQuelleZuImgSrc, mediaQuelleZuIframeSrc } from '@shared/utils/mediaQuelleUrl'

const fakeAppResolver = (p: string) => `/ExamLab/${p}`

describe('mediaQuelleZuImgSrc', () => {
  it('Drive: baut lh3.googleusercontent-URL', () => {
    const url = mediaQuelleZuImgSrc(
      { typ: 'drive', driveFileId: 'abc', mimeType: 'image/png' },
      fakeAppResolver,
    )
    expect(url).toBe('https://lh3.googleusercontent.com/d/abc')
  })

  it('Pool: baut Uebungspools-URL (hardcoded, Cross-Site)', () => {
    const url = mediaQuelleZuImgSrc(
      { typ: 'pool', poolPfad: 'img/foo.svg', mimeType: 'image/svg+xml' },
      fakeAppResolver,
    )
    expect(url).toBe('https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/img/foo.svg')
  })

  it('App: delegiert an resolver', () => {
    const url = mediaQuelleZuImgSrc(
      { typ: 'app', appPfad: 'demo-bilder/x.svg', mimeType: 'image/svg+xml' },
      fakeAppResolver,
    )
    expect(url).toBe('/ExamLab/demo-bilder/x.svg')
  })

  it('Extern: unverändert', () => {
    const url = mediaQuelleZuImgSrc(
      { typ: 'extern', url: 'https://ex.com/x.jpg', mimeType: 'image/jpeg' },
      fakeAppResolver,
    )
    expect(url).toBe('https://ex.com/x.jpg')
  })

  it('Inline: baut data:-URL', () => {
    const url = mediaQuelleZuImgSrc(
      { typ: 'inline', base64: 'iVBOR', mimeType: 'image/png' },
      fakeAppResolver,
    )
    expect(url).toBe('data:image/png;base64,iVBOR')
  })
})

describe('mediaQuelleZuIframeSrc', () => {
  it('Drive-PDF: /preview-URL', () => {
    expect(
      mediaQuelleZuIframeSrc(
        { typ: 'drive', driveFileId: 'abc', mimeType: 'application/pdf' },
        fakeAppResolver,
      ),
    ).toBe('https://drive.google.com/file/d/abc/preview')
  })

  it('Inline-PDF: data:...', () => {
    expect(
      mediaQuelleZuIframeSrc(
        { typ: 'inline', base64: 'JVBERi', mimeType: 'application/pdf' },
        fakeAppResolver,
      ),
    ).toBe('data:application/pdf;base64,JVBERi')
  })

  it('App: delegiert', () => {
    expect(
      mediaQuelleZuIframeSrc(
        { typ: 'app', appPfad: 'materialien/x.pdf', mimeType: 'application/pdf' },
        fakeAppResolver,
      ),
    ).toBe('/ExamLab/materialien/x.pdf')
  })
})
