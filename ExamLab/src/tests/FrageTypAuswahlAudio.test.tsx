import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import FrageTypAuswahl from '@shared/editor/components/FrageTypAuswahl'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'

const baseConfig: EditorConfig = {
  benutzer: { email: 'test@gymhofwil.ch' },
  verfuegbareGefaesse: [],
  verfuegbareSemester: [],
  zeigeFiBuTypen: true,
  lpListe: [],
  features: {
    kiAssistent: false,
    anhangUpload: false,
    bewertungsraster: false,
    sharing: false,
    poolSync: false,
    performance: false,
  },
}

const baseServices = {} as EditorServices

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <EditorProvider config={baseConfig} services={baseServices}>
      {children}
    </EditorProvider>
  )
}

describe('FrageTypAuswahl — Audio-Regression (S140)', () => {
  it('Typ-Auswahl enthält keinen Audio-Button', () => {
    render(
      <Wrapper>
        <FrageTypAuswahl typ="mc" setTyp={vi.fn()} gesperrt={false} />
      </Wrapper>,
    )
    expect(screen.queryByRole('button', { name: /Audio/i })).not.toBeInTheDocument()
  })

  it('alle anderen Hauptkategorien-Typen sind sichtbar (Sanity-Check)', () => {
    render(
      <Wrapper>
        <FrageTypAuswahl typ="mc" setTyp={vi.fn()} gesperrt={false} />
      </Wrapper>,
    )
    expect(screen.getByRole('button', { name: /Multiple Choice/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Freitext/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lückentext/i })).toBeInTheDocument()
  })
})
