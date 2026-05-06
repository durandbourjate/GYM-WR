import { describe, it, expect } from 'vitest'
import { bildQuelleAus, pdfQuelleAus, anhangQuelleAus } from '@shared/utils/mediaQuelleMigrator'

describe('bildQuelleAus', () => {
  it('erkennt Drive-ID aus bildDriveFileId', () => {
    const q = bildQuelleAus({ bildUrl: '', bildDriveFileId: 'abc123' })
    expect(q).toEqual({ typ: 'drive', driveFileId: 'abc123', mimeType: 'image/png' })
  })

  it('erkennt Drive-ID aus lh3.googleusercontent-URL', () => {
    const q = bildQuelleAus({ bildUrl: 'https://lh3.googleusercontent.com/d/xyz' })
    expect(q?.typ).toBe('drive')
    if (q?.typ === 'drive') expect(q.driveFileId).toBe('xyz')
  })

  it('erkennt Drive-ID aus drive.google.com-URL', () => {
    const q = bildQuelleAus({ bildUrl: 'https://drive.google.com/file/d/ABC/view' })
    expect(q?.typ).toBe('drive')
    if (q?.typ === 'drive') expect(q.driveFileId).toBe('ABC')
  })

  it('erkennt Pool-Pfad (img/...)', () => {
    const q = bildQuelleAus({ bildUrl: 'img/konjunktur.svg' })
    expect(q).toEqual({ typ: 'pool', poolPfad: 'img/konjunktur.svg', mimeType: 'image/svg+xml' })
  })

  it('erkennt Pool-Pfad (pool-bilder/...)', () => {
    const q = bildQuelleAus({ bildUrl: 'pool-bilder/foo.png' })
    expect(q).toEqual({ typ: 'pool', poolPfad: 'pool-bilder/foo.png', mimeType: 'image/png' })
  })

  it('erkennt App-lokales Asset (./demo-bilder/... und ./materialien/...)', () => {
    const q1 = bildQuelleAus({ bildUrl: './demo-bilder/europa.svg' })
    expect(q1).toEqual({ typ: 'app', appPfad: 'demo-bilder/europa.svg', mimeType: 'image/svg+xml' })
    const q2 = bildQuelleAus({ bildUrl: '/materialien/x.png' })
    expect(q2).toEqual({ typ: 'app', appPfad: 'materialien/x.png', mimeType: 'image/png' })
  })

  it('erkennt Inline base64 (data:image/...)', () => {
    const q = bildQuelleAus({ bildUrl: 'data:image/png;base64,iVBOR' })
    expect(q).toEqual({ typ: 'inline', base64: 'iVBOR', mimeType: 'image/png' })
  })

  it('erkennt externe URL', () => {
    const q = bildQuelleAus({ bildUrl: 'https://example.com/bild.jpg' })
    expect(q).toEqual({ typ: 'extern', url: 'https://example.com/bild.jpg', mimeType: 'image/jpeg' })
  })

  it('null bei fehlender Quelle', () => {
    expect(bildQuelleAus({ bildUrl: '', bildDriveFileId: '' })).toBeNull()
    expect(bildQuelleAus({})).toBeNull()
  })
})

describe('pdfQuelleAus', () => {
  it('erkennt pdfBase64', () => {
    const q = pdfQuelleAus({ pdfBase64: 'JVBERi0x', pdfDateiname: 'doc.pdf' })
    expect(q).toEqual({ typ: 'inline', base64: 'JVBERi0x', mimeType: 'application/pdf', dateiname: 'doc.pdf' })
  })

  it('erkennt pdfDriveFileId', () => {
    const q = pdfQuelleAus({ pdfDriveFileId: 'abc', pdfDateiname: 'x.pdf' })
    expect(q).toEqual({ typ: 'drive', driveFileId: 'abc', mimeType: 'application/pdf', dateiname: 'x.pdf' })
  })

  it('erkennt pdfUrl App-lokal (./materialien/...)', () => {
    const q = pdfQuelleAus({ pdfUrl: './materialien/doc.pdf', pdfDateiname: 'doc.pdf' })
    expect(q).toEqual({ typ: 'app', appPfad: 'materialien/doc.pdf', mimeType: 'application/pdf', dateiname: 'doc.pdf' })
  })

  it('erkennt pdfUrl Pool (pool-bilder/...)', () => {
    const q = pdfQuelleAus({ pdfUrl: 'pool-bilder/doc.pdf' })
    expect(q?.typ).toBe('pool')
  })

  it('erkennt externe pdfUrl', () => {
    const q = pdfQuelleAus({ pdfUrl: 'https://example.com/doc.pdf' })
    expect(q).toEqual({ typ: 'extern', url: 'https://example.com/doc.pdf', mimeType: 'application/pdf' })
  })

  it('null wenn keine Quelle', () => {
    expect(pdfQuelleAus({})).toBeNull()
  })
})

describe('anhangQuelleAus', () => {
  it('nimmt mimeType + dateiname 1:1', () => {
    const q = anhangQuelleAus({ id: 'x', driveFileId: 'abc', dateiname: 'x.png', mimeType: 'image/png' })
    expect(q).toEqual({ typ: 'drive', driveFileId: 'abc', mimeType: 'image/png', dateiname: 'x.png' })
  })

  it('infert mimeType aus dateiname wenn nicht gesetzt', () => {
    const q = anhangQuelleAus({ id: 'x', driveFileId: 'abc', dateiname: 'foo.pdf' })
    expect(q?.mimeType).toBe('application/pdf')
  })

  it('fällt auf application/octet-stream bei völlig fehlenden Infos', () => {
    const q = anhangQuelleAus({ id: 'x', driveFileId: 'abc' })
    expect(q?.mimeType).toBe('application/octet-stream')
  })

  it('null wenn weder driveFileId noch base64 noch url', () => {
    expect(anhangQuelleAus({ id: 'x' })).toBeNull()
  })
})
