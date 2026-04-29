import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SharedFragenEditor from '@shared/editor/SharedFragenEditor'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import type { LueckentextFrage } from '@shared/types/fragen-core'

const baseConfig: EditorConfig = {
  benutzer: { email: 'test@gymhofwil.ch', fachschaft: 'WR' },
  verfuegbareGefaesse: ['SF'],
  verfuegbareSemester: ['S1'],
  zeigeFiBuTypen: false,
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

const baseServices: EditorServices = {
  istKIVerfuegbar: () => false,
  istUploadVerfuegbar: () => false,
}

function renderEditor(props: {
  frage: LueckentextFrage | null
  onSpeichern?: (...args: unknown[]) => void
  onAbbrechen?: () => void
}) {
  const onSpeichern = props.onSpeichern ?? vi.fn()
  const onAbbrechen = props.onAbbrechen ?? vi.fn()
  const utils = render(
    <EditorProvider config={baseConfig} services={baseServices}>
      <SharedFragenEditor
        frage={props.frage}
        onSpeichern={onSpeichern as (frage: Parameters<typeof onSpeichern>[0]) => void as never}
        onAbbrechen={onAbbrechen}
      />
    </EditorProvider>,
  )
  return { ...utils, onSpeichern, onAbbrechen }
}

describe('SharedFragenEditor — Bundle H Save-Hook', () => {
  it('öffnet PflichtfeldDialog beim Speichern wenn Pflicht-Feld leer', () => {
    // Lückentext mit gültigem Platzhalter (passt validiereFrage), aber luecken=[] (failed validierePflichtfelder)
    const frage: LueckentextFrage = {
      id: 'q1',
      typ: 'lueckentext',
      version: 1,
      erstelltAm: '2026-01-01T00:00:00Z',
      geaendertAm: '2026-01-01T00:00:00Z',
      fachbereich: 'BWL',
      fach: 'BWL',
      thema: 'Test',
      semester: ['S1'],
      gefaesse: ['SF'],
      bloom: 'K2',
      tags: [],
      punkte: 1,
      musterlosung: '',
      bewertungsraster: [],
      zeitbedarf: 60,
      verwendungen: [],
      quelle: 'manuell',
      autor: 'test@gymhofwil.ch',
      geteilt: 'privat',
      fragetext: 'Frage?',
      textMitLuecken: 'Test {{1}}',
      luecken: [],
      lueckentextModus: 'freitext',
    }
    renderEditor({ frage })
    const speicherBtns = screen.getAllByRole('button', { name: 'Speichern' })
    fireEvent.click(speicherBtns[speicherBtns.length - 1])
    expect(screen.getByText(/Pflichtfelder leer/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }),
    ).toBeInTheDocument()
  })

  it('speichert mit pruefungstauglich=false nach Pflicht-Dialog-Bestätigung', async () => {
    // Selbe invalid Lückentext wie oben (luecken=[] → pflicht-leer)
    const frage: LueckentextFrage = {
      id: 'q1',
      typ: 'lueckentext',
      version: 1,
      erstelltAm: '2026-01-01T00:00:00Z',
      geaendertAm: '2026-01-01T00:00:00Z',
      fachbereich: 'BWL',
      fach: 'BWL',
      thema: 'Test',
      semester: ['S1'],
      gefaesse: ['SF'],
      bloom: 'K2',
      tags: [],
      punkte: 1,
      musterlosung: '',
      bewertungsraster: [],
      zeitbedarf: 60,
      verwendungen: [],
      quelle: 'manuell',
      autor: 'test@gymhofwil.ch',
      geteilt: 'privat',
      fragetext: 'Frage?',
      textMitLuecken: 'Test {{1}}',
      luecken: [],
      lueckentextModus: 'freitext',
    }
    const { onSpeichern } = renderEditor({ frage })
    const speicherBtns = screen.getAllByRole('button', { name: 'Speichern' })
    fireEvent.click(speicherBtns[speicherBtns.length - 1])
    // Dialog ist offen
    expect(screen.getByText(/Pflichtfelder leer/)).toBeInTheDocument()
    // Im Dialog auf "Speichern (nicht prüfungstauglich)" klicken
    fireEvent.click(
      screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }),
    )
    // onSpeichern wird aufgerufen mit pruefungstauglich=false
    await waitFor(() => {
      expect(onSpeichern).toHaveBeenCalled()
    })
    const gespeicherteFrage = (onSpeichern as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      pruefungstauglich: boolean
    }
    expect(gespeicherteFrage.pruefungstauglich).toBe(false)
  })

  it('speichert mit pruefungstauglich=true wenn alle Pflichten + Empfohlen erfüllt', async () => {
    // Lückentext mit Platzhalter UND luecken[0].korrekteAntworten[0] gefüllt
    // → pflichtErfuellt=true, empfohlenErfuellt=true (Lückentext hat keine empfohlen-Felder)
    // → kein Dialog, direkter Speichern, pruefungstauglich=true
    const frage: LueckentextFrage = {
      id: 'q2',
      typ: 'lueckentext',
      version: 1,
      erstelltAm: '2026-01-01T00:00:00Z',
      geaendertAm: '2026-01-01T00:00:00Z',
      fachbereich: 'BWL',
      fach: 'BWL',
      thema: 'Test',
      semester: ['S1'],
      gefaesse: ['SF'],
      bloom: 'K2',
      tags: [],
      punkte: 1,
      musterlosung: '',
      bewertungsraster: [],
      zeitbedarf: 60,
      verwendungen: [],
      quelle: 'manuell',
      autor: 'test@gymhofwil.ch',
      geteilt: 'privat',
      fragetext: 'Frage?',
      textMitLuecken: 'Test {{1}}',
      luecken: [{ id: '1', korrekteAntworten: ['Welt'], caseSensitive: false }],
      lueckentextModus: 'freitext',
    }
    const { onSpeichern } = renderEditor({ frage })
    const speicherBtns = screen.getAllByRole('button', { name: 'Speichern' })
    fireEvent.click(speicherBtns[speicherBtns.length - 1])
    // Kein Dialog erwartet — direkt onSpeichern
    await waitFor(() => {
      expect(onSpeichern).toHaveBeenCalled()
    })
    const gespeicherteFrage = (onSpeichern as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      pruefungstauglich: boolean
    }
    expect(gespeicherteFrage.pruefungstauglich).toBe(true)
  })

  it.todo('öffnet DoppelteLabelDialog bei DnD-Bild mit doppelten Zonen-Labels')
  it.todo('speichert mit pruefungstauglich=false automatisch wenn nur Empfohlen leer (kein Dialog)')
})
