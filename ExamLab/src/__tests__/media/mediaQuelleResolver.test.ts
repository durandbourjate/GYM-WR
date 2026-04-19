import { describe, it, expect } from 'vitest'
import { ermittleBildQuelle, ermittlePdfQuelle, ermittleAnhangQuelle } from '@shared/utils/mediaQuelleResolver'

describe('ermittleBildQuelle', () => {
  it('bevorzugt neues bild-Feld', () => {
    const q = ermittleBildQuelle({
      bild: { typ: 'drive', driveFileId: 'NEU', mimeType: 'image/png' },
      bildUrl: 'https://alt.example.com/x.png',
    })
    expect(q).toEqual({ typ: 'drive', driveFileId: 'NEU', mimeType: 'image/png' })
  })

  it('fällt auf bildUrl zurück wenn kein bild-Feld', () => {
    const q = ermittleBildQuelle({ bildUrl: 'img/foo.svg' })
    expect(q).toEqual({ typ: 'pool', poolPfad: 'img/foo.svg', mimeType: 'image/svg+xml' })
  })

  it('fällt auf bildDriveFileId zurück', () => {
    const q = ermittleBildQuelle({ bildUrl: '', bildDriveFileId: 'abc' })
    expect(q?.typ).toBe('drive')
  })

  it('null bei gar keiner Quelle', () => {
    expect(ermittleBildQuelle({ bildUrl: '' })).toBeNull()
  })
})

describe('ermittlePdfQuelle', () => {
  it('bevorzugt neues pdf-Feld', () => {
    const q = ermittlePdfQuelle({
      pdf: { typ: 'drive', driveFileId: 'NEU', mimeType: 'application/pdf' },
      pdfBase64: 'ALT',
    })
    expect(q?.typ).toBe('drive')
  })

  it('fällt auf pdfBase64 zurück', () => {
    const q = ermittlePdfQuelle({ pdfBase64: 'JVBE' })
    expect(q).toEqual({ typ: 'inline', base64: 'JVBE', mimeType: 'application/pdf', dateiname: undefined })
  })

  it('fällt auf pdfUrl zurück (Pool)', () => {
    const q = ermittlePdfQuelle({ pdfUrl: 'pool-bilder/doc.pdf' })
    expect(q?.typ).toBe('pool')
  })

  it('null wenn keine Quelle', () => {
    expect(ermittlePdfQuelle({})).toBeNull()
  })
})

describe('ermittleAnhangQuelle', () => {
  it('bevorzugt neues quelle-Feld', () => {
    const q = ermittleAnhangQuelle({
      id: 'x',
      quelle: { typ: 'drive', driveFileId: 'NEU', mimeType: 'image/png' },
      driveFileId: 'ALT',
      dateiname: 'x.png',
      mimeType: 'image/png',
    })
    if (q?.typ === 'drive') expect(q.driveFileId).toBe('NEU')
  })

  it('fällt auf driveFileId zurück', () => {
    const q = ermittleAnhangQuelle({
      id: 'x',
      driveFileId: 'abc',
      dateiname: 'x.png',
      mimeType: 'image/png',
    })
    expect(q?.typ).toBe('drive')
  })
})
