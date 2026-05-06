import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mediaQuelleZuArrayBuffer } from '@shared/utils/mediaQuelleBytes'

const fakeAppResolver = (p: string) => `/ExamLab/${p}`

describe('mediaQuelleZuArrayBuffer', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response),
    )
  })

  it('Inline: decodiert base64 direkt ohne fetch', async () => {
    // "PDF" in base64 = "UERG"
    const ab = await mediaQuelleZuArrayBuffer(
      { typ: 'inline', base64: 'UERG', mimeType: 'application/pdf' },
      fakeAppResolver,
    )
    expect(ab.byteLength).toBe(3)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('Drive: fetcht lh3-URL', async () => {
    await mediaQuelleZuArrayBuffer(
      { typ: 'drive', driveFileId: 'abc', mimeType: 'application/pdf' },
      fakeAppResolver,
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('lh3.googleusercontent.com/d/abc'))
  })

  it('App: fetcht via resolver', async () => {
    await mediaQuelleZuArrayBuffer(
      { typ: 'app', appPfad: 'materialien/x.pdf', mimeType: 'application/pdf' },
      fakeAppResolver,
    )
    expect(globalThis.fetch).toHaveBeenCalledWith('/ExamLab/materialien/x.pdf')
  })

  it('throws bei HTTP-Fehler', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: false, status: 404, statusText: 'NF' } as Response)
    await expect(
      mediaQuelleZuArrayBuffer(
        { typ: 'extern', url: 'https://x/y.pdf', mimeType: 'application/pdf' },
        fakeAppResolver,
      ),
    ).rejects.toThrow(/404/)
  })
})
