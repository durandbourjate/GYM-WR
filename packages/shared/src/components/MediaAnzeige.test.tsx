import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MediaAnzeige from '@shared/components/MediaAnzeige'

const fakeResolver = (p: string) => `/ExamLab/${p}`

describe('MediaAnzeige', () => {
  it('rendert <img> für image/*', () => {
    render(
      <MediaAnzeige
        quelle={{ typ: 'drive', driveFileId: 'abc', mimeType: 'image/png' }}
        appResolver={fakeResolver}
        alt="x"
      />,
    )
    const img = screen.getByAltText('x') as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img.src).toContain('lh3.googleusercontent.com/d/abc')
  })

  it('rendert <iframe> für application/pdf', () => {
    const { container } = render(
      <MediaAnzeige
        quelle={{ typ: 'drive', driveFileId: 'abc', mimeType: 'application/pdf' }}
        appResolver={fakeResolver}
      />,
    )
    const iframe = container.querySelector('iframe')
    expect(iframe?.src).toContain('drive.google.com/file/d/abc/preview')
  })

  it('rendert <audio> für audio/*', () => {
    const { container } = render(
      <MediaAnzeige
        quelle={{ typ: 'extern', url: 'https://x/a.mp3', mimeType: 'audio/mpeg' }}
        appResolver={fakeResolver}
      />,
    )
    expect(container.querySelector('audio')).toBeTruthy()
  })

  it('rendert <video> für video/*', () => {
    const { container } = render(
      <MediaAnzeige
        quelle={{ typ: 'extern', url: 'https://x/v.mp4', mimeType: 'video/mp4' }}
        appResolver={fakeResolver}
      />,
    )
    expect(container.querySelector('video')).toBeTruthy()
  })

  it('Fallback-Badge für unbekannte MIME', () => {
    const { container } = render(
      <MediaAnzeige
        quelle={{ typ: 'drive', driveFileId: 'abc', mimeType: 'application/zip' }}
        appResolver={fakeResolver}
      />,
    )
    expect(container.textContent).toContain('Datei')
  })

  it('Pool-Bild: Cross-Site-URL', () => {
    render(
      <MediaAnzeige
        quelle={{ typ: 'pool', poolPfad: 'img/x.svg', mimeType: 'image/svg+xml' }}
        appResolver={fakeResolver}
        alt="pool"
      />,
    )
    const img = screen.getByAltText('pool') as HTMLImageElement
    expect(img.src).toContain('Uebungen/Uebungspools/img/x.svg')
  })

  it('Inline-Bild: data:-URL', () => {
    render(
      <MediaAnzeige
        quelle={{ typ: 'inline', base64: 'iVBOR', mimeType: 'image/png' }}
        appResolver={fakeResolver}
        alt="inline"
      />,
    )
    const img = screen.getByAltText('inline') as HTMLImageElement
    expect(img.src).toBe('data:image/png;base64,iVBOR')
  })
})
