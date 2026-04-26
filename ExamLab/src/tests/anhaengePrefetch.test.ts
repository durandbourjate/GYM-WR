import { describe, it, expect } from 'vitest'
import type { FrageAnhang } from '../types/fragen'
import { pdfPrefetchUrls } from '../utils/anhaengePrefetch'

const mkAnhang = (over: Partial<FrageAnhang>): FrageAnhang => ({
  id: over.id ?? 'a',
  driveFileId: over.driveFileId ?? 'drive-id',
  dateiname: over.dateiname ?? 'datei',
  mimeType: over.mimeType ?? 'application/pdf',
  groesseBytes: over.groesseBytes ?? 0,
  ...(over as object),
})

describe('pdfPrefetchUrls', () => {
  it('liefert die drivePreviewUrl für den ersten PDF-Anhang', () => {
    const urls = pdfPrefetchUrls([
      mkAnhang({ driveFileId: 'pdf-1', mimeType: 'application/pdf' }),
    ])
    expect(urls).toEqual(['https://drive.google.com/file/d/pdf-1/preview'])
  })

  it('ignoriert Bilder, Audio und Video', () => {
    const urls = pdfPrefetchUrls([
      mkAnhang({ driveFileId: 'img', mimeType: 'image/png' }),
      mkAnhang({ driveFileId: 'aud', mimeType: 'audio/mpeg' }),
      mkAnhang({ driveFileId: 'vid', mimeType: 'video/mp4' }),
    ])
    expect(urls).toEqual([])
  })

  it('liefert nur den ersten PDF wenn mehrere PDFs vorhanden', () => {
    const urls = pdfPrefetchUrls([
      mkAnhang({ driveFileId: 'pdf-1', mimeType: 'application/pdf' }),
      mkAnhang({ driveFileId: 'pdf-2', mimeType: 'application/pdf' }),
    ])
    expect(urls).toEqual(['https://drive.google.com/file/d/pdf-1/preview'])
  })

  it('PDF nach Bild: ignoriert Bild, prefetcht PDF', () => {
    const urls = pdfPrefetchUrls([
      mkAnhang({ driveFileId: 'img', mimeType: 'image/png' }),
      mkAnhang({ driveFileId: 'pdf', mimeType: 'application/pdf' }),
    ])
    expect(urls).toEqual(['https://drive.google.com/file/d/pdf/preview'])
  })

  it('leeres Array: leere URL-Liste', () => {
    expect(pdfPrefetchUrls([])).toEqual([])
  })

  it('undefined: leere URL-Liste', () => {
    expect(pdfPrefetchUrls(undefined)).toEqual([])
  })

  it('PDF ohne driveFileId: kein Prefetch', () => {
    const urls = pdfPrefetchUrls([
      { id: 'a', driveFileId: '', dateiname: 'x', mimeType: 'application/pdf', groesseBytes: 0 } as FrageAnhang,
    ])
    expect(urls).toEqual([])
  })
})
