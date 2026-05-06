import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MediaUpload from '@shared/components/MediaUpload'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'

const config = {
  benutzer: { name: 'Test', email: 'test@x' },
  verfuegbareGefaesse: [],
  verfuegbareSemester: [],
  zeigeFiBuTypen: false,
  features: {},
} as unknown as EditorConfig /* Defensive: Test-Mock — leeres features-Objekt reicht für MediaUpload-Test */

const services = {
  istUploadVerfuegbar: () => false,
  istKIVerfuegbar: () => false,
  uploadAnhang: vi.fn(),
} as unknown as EditorServices /* Defensive: Test-Mock — uploadAnhang-Signatur reicht für MediaUpload-Test */

function wrap(el: ReactNode) {
  return (
    <EditorProvider config={config} services={services}>
      {el}
    </EditorProvider>
  )
}

describe('MediaUpload', () => {
  it('zeigt Dropzone wenn keine Quelle', () => {
    render(wrap(<MediaUpload quelle={null} setQuelle={() => {}} akzeptiereMimeTypes={['image/*']} label="Bild" />))
    expect(screen.getByText(/hierher ziehen/i)).toBeTruthy()
  })

  it('zeigt Dateiname + Entfernen-Button bei bestehender Quelle', () => {
    const q = { typ: 'drive' as const, driveFileId: 'abc', mimeType: 'image/png', dateiname: 'bild.png' }
    render(wrap(<MediaUpload quelle={q} setQuelle={() => {}} akzeptiereMimeTypes={['image/*']} label="Bild" />))
    expect(screen.getByText(/bild\.png/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /entfernen/i })).toBeTruthy()
  })

  it('Drive-URL-Eingabe → drive-Quelle', () => {
    const setQuelle = vi.fn()
    render(wrap(<MediaUpload quelle={null} setQuelle={setQuelle} akzeptiereMimeTypes={['image/*']} label="Bild" />))
    const input = screen.getByPlaceholderText(/URL einfügen/i)
    fireEvent.change(input, { target: { value: 'https://lh3.googleusercontent.com/d/xyz' } })
    fireEvent.blur(input)
    expect(setQuelle).toHaveBeenCalledWith(expect.objectContaining({ typ: 'drive', driveFileId: 'xyz' }))
  })

  it('https-URL ohne Drive → extern-Quelle', () => {
    const setQuelle = vi.fn()
    render(wrap(<MediaUpload quelle={null} setQuelle={setQuelle} akzeptiereMimeTypes={['image/*']} label="Bild" />))
    const input = screen.getByPlaceholderText(/URL einfügen/i)
    fireEvent.change(input, { target: { value: 'https://ex.com/foo.png' } })
    fireEvent.blur(input)
    expect(setQuelle).toHaveBeenCalledWith({ typ: 'extern', url: 'https://ex.com/foo.png', mimeType: 'image/png' })
  })

  it('Entfernen-Button → setQuelle(null)', () => {
    const setQuelle = vi.fn()
    const q = { typ: 'drive' as const, driveFileId: 'abc', mimeType: 'image/png', dateiname: 'x.png' }
    render(wrap(<MediaUpload quelle={q} setQuelle={setQuelle} akzeptiereMimeTypes={['image/*']} label="Bild" />))
    fireEvent.click(screen.getByRole('button', { name: /entfernen/i }))
    expect(setQuelle).toHaveBeenCalledWith(null)
  })

  it('leerer URL-Input → setQuelle(null)', () => {
    const setQuelle = vi.fn()
    render(wrap(<MediaUpload quelle={null} setQuelle={setQuelle} akzeptiereMimeTypes={['image/*']} label="Bild" />))
    const input = screen.getByPlaceholderText(/URL einfügen/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(setQuelle).toHaveBeenCalledWith(null)
  })
})
