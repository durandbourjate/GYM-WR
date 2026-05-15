/**
 * Cluster D Phase 3a — Integration-Tests für den Batch-Modus des SharedFragenEditor.
 *
 * Tests:
 *  - Banner wird gerendert wenn `batchMode` gesetzt
 *  - Non-batch-bare Sections (Fragetyp/Fragetext/Bewertungsraster) sind weggeblendet
 *  - „Auf N Fragen anwenden"-Button statt „Speichern"
 *  - `onBatchSave` kriegt leeres Patch wenn nichts dirty
 *  - `onBatchSave` kriegt nur das geänderte Feld
 *
 * Memory-Pattern „Backward-Compat absolut" wird per Smoke-Test verifiziert:
 *  - Ohne `batchMode` rendert der Editor weiter Fragetyp/Fragetext (Single-Edit-Pfad).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SharedFragenEditor from './SharedFragenEditor'
import { EditorProvider } from './EditorContext'
import type { EditorConfig, EditorServices } from './types'

// --- Provider-Setup --------------------------------------------------------

function renderInProvider(ui: React.ReactNode) {
  const config: EditorConfig = {
    // fachschaft 'WR' uppercase — sonst rendert MetadataSection nur einen readOnly-Fach-Input (Fallback).
    benutzer: { email: 'lp@example.test', fachschaft: 'WR' },
    verfuegbareGefaesse: ['SF', 'EF', 'EWR', 'GF'],
    verfuegbareSemester: ['1', '2', '3', '4'],
    zeigeFiBuTypen: false,
    features: { kiAssistent: false, anhangUpload: false, bewertungsraster: false, sharing: false, poolSync: false, performance: false },
  }
  const services: EditorServices = {
    istKIVerfuegbar: () => false,
    istUploadVerfuegbar: () => false,
  }
  return render(
    <EditorProvider config={config} services={services}>{ui}</EditorProvider>,
  )
}

// --- Tests -----------------------------------------------------------------

describe('SharedFragenEditor — Batch-Modus (Cluster D Phase 3a)', () => {
  it('rendert BatchEditorBanner wenn batchMode gesetzt', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 47, sichtbareCount: 12 }}
        onBatchSave={vi.fn()}
      />,
    )
    expect(screen.getByText(/Batch-Bearbeitung von 47 Fragen/)).toBeTruthy()
    expect(screen.getByText(/nur 12 im aktuellen Filter sichtbar/)).toBeTruthy()
  })

  it('Header-Titel "Fragen batch-bearbeiten" statt "Neue Frage erstellen"', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={vi.fn()}
      />,
    )
    expect(screen.getByText('Fragen batch-bearbeiten')).toBeTruthy()
    expect(screen.queryByText('Neue Frage erstellen')).toBeNull()
  })

  it('Save-Button-Label "Auf N Fragen anwenden" im Batch-Modus', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 12, sichtbareCount: 12 }}
        onBatchSave={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /Auf 12 Fragen anwenden/ })).toBeTruthy()
    // „Speichern"-Single-Edit-Button gibt's nicht
    expect(screen.queryByRole('button', { name: /^Speichern$/ })).toBeNull()
  })

  it('Fragetyp- und Fragetext-Sections sind im Batch-Modus ausgeblendet', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={vi.fn()}
      />,
    )
    // Fragetext-Abschnitt (FragetextSection rendert <Abschnitt titel="Fragetext *">) — fehlt im Batch.
    expect(screen.queryByText('Fragetext *')).toBeNull()
    // Fragetyp-Abschnitt — fehlt im Batch.
    expect(screen.queryByText('Fragetyp')).toBeNull()
  })

  it('onBatchSave bekommt leeren Patch wenn nichts geändert wurde', () => {
    const onBatchSave = vi.fn()
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={onBatchSave}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Auf 5 Fragen anwenden/ }))
    expect(onBatchSave).toHaveBeenCalledTimes(1)
    expect(onBatchSave).toHaveBeenCalledWith({}, 'hinzufuegen')
  })

  it('onBatchSave überträgt nur dirty fachbereich (nicht den initial-Wert)', () => {
    const onBatchSave = vi.fn()
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={onBatchSave}
      />,
    )
    // Fach ändern → dirty-Flag wird gesetzt
    const fachSelect = screen.getByDisplayValue('VWL') as HTMLSelectElement
    fireEvent.change(fachSelect, { target: { value: 'BWL' } })

    fireEvent.click(screen.getByRole('button', { name: /Auf 5 Fragen anwenden/ }))
    expect(onBatchSave).toHaveBeenCalledWith({ fachbereich: 'BWL' }, 'hinzufuegen')
  })

  it('onBatchSave überträgt nur dirty bloom', () => {
    const onBatchSave = vi.fn()
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={onBatchSave}
      />,
    )
    // Bloom-Select hat einen <option> mit value="K4" — wir suchen das select via Label
    const bloomSelects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    // 2 Selects in dem Render: Fach (VWL/BWL/Recht) + Bloom (K1-K6).
    const bloomSelect = bloomSelects.find((s) =>
      Array.from(s.options).some((o) => o.value === 'K3'),
    )
    expect(bloomSelect).toBeTruthy()
    fireEvent.change(bloomSelect!, { target: { value: 'K4' } })
    fireEvent.click(screen.getByRole('button', { name: /Auf 5 Fragen anwenden/ }))
    expect(onBatchSave).toHaveBeenCalledWith({ bloom: 'K4' }, 'hinzufuegen')
  })
})

describe('SharedFragenEditor — Single-Edit-Modus (Backward-Compat)', () => {
  it('ohne batchMode rendert "Neue Frage erstellen" + Fragetext-Section', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    expect(screen.getByText('Neue Frage erstellen')).toBeTruthy()
    expect(screen.getByText('Fragetext *')).toBeTruthy()
    expect(screen.getByText('Fragetyp')).toBeTruthy()
    // Banner-Text darf NICHT auftauchen
    expect(screen.queryByText(/Batch-Bearbeitung von/)).toBeNull()
  })

  it('Save-Button-Label "Speichern" im Single-Edit-Modus', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /^Speichern$/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /anwenden/i })).toBeNull()
  })
})
