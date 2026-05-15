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

  // --- Hardening-Tests (Cluster D Phase 3a, post Sub-Task 5) ----------------

  it('I-1: kein Auto-Save-onTippe-Call im batchMode bei Feld-Änderung', () => {
    // Auch wenn Caller (irrtümlich) `autoSave` UND `batchMode` zusammen setzt —
    // der Watcher darf NICHT feuern, sonst sentinel-`neu-<uuid>`-Pseudo-Draft im LS.
    const autoSave = {
      statusSlot: <div />,
      onTippe: vi.fn(),
      onSchliessenVersuch: async () => ({ darfSchliessen: true }),
    }
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={vi.fn()}
        autoSave={autoSave}
      />,
    )
    // Trigger Feld-Änderung (Fach) — würde im Single-Mode onTippe auslösen.
    const fachSelect = screen.getByDisplayValue('VWL') as HTMLSelectElement
    fireEvent.change(fachSelect, { target: { value: 'BWL' } })
    expect(autoSave.onTippe).not.toHaveBeenCalled()
  })

  it('I-2: kein dirty-Flag wenn Bloom auf Initial-Wert "geändert" wird', () => {
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
    // Bloom-Select identifizieren (hat K3 als option)
    const bloomSelects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    const bloomSelect = bloomSelects.find((s) =>
      Array.from(s.options).some((o) => o.value === 'K3'),
    )
    expect(bloomSelect).toBeTruthy()
    // Auf Initial-Wert „K2" setzen (Default für neue Frage) — KEIN Diff.
    fireEvent.change(bloomSelect!, { target: { value: 'K2' } })
    fireEvent.click(screen.getByRole('button', { name: /Auf 5 Fragen anwenden/ }))
    // Erwartet: leerer Patch (bloom NICHT enthalten weil no-op-Change)
    expect(onBatchSave).toHaveBeenCalledWith({}, 'hinzufuegen')
  })

  it('I-3: tagIds aus frage-Prop leaken NICHT in Patch wenn User nichts ändert', () => {
    // frage mit pre-existing tagIds — User-Pfad: kein TagPicker-Touch.
    // Erwartet: tagsHinzufuegen NICHT im Patch (tagIds-dirty=false).
    const onBatchSave = vi.fn()
    renderInProvider(
      <SharedFragenEditor
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        frage={{ id: 'f1', tagIds: ['t1', 't2'] } as any /* Defensive: Test-Stub mit minimalem Frage-Mock — nur tagIds-Felder relevant */}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={onBatchSave}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Auf 5 Fragen anwenden/ }))
    expect(onBatchSave).toHaveBeenCalledTimes(1)
    const [patch] = onBatchSave.mock.calls[0]
    expect(patch.tagsHinzufuegen).toBeUndefined()
    expect(patch.tagsErsetzen).toBeUndefined()
    expect(patch.tagsEntfernen).toBeUndefined()
  })

  // --- Phase 3b BatchTagPicker-Integration ---------------------------------

  it('Phase 3b: BatchTagPicker mounted im batchMode wenn tagPickerSlot gegeben', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={vi.fn()}
        tagPickerSlot={({ tagIds }) => (
          <div data-testid="tagslot">tags={tagIds.join(',')}</div>
        )}
      />,
    )
    expect(screen.getByRole('radio', { name: /Hinzufügen/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Ersetzen/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Entfernen/i })).toBeInTheDocument()
    expect(screen.getByTestId('tagslot')).toBeInTheDocument()
  })

  it('Phase 3b: Tag-Modus-Wechsel zu "ersetzen" landet im Patch (mit tagIds gesetzt)', () => {
    const onBatchSave = vi.fn()
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        batchMode={{ count: 5, sichtbareCount: 5 }}
        onBatchSave={onBatchSave}
        tagPickerSlot={({ onChange }) => (
          <button data-testid="add-tag" onClick={() => onChange(['t1', 't2'])}>add</button>
        )}
      />,
    )
    fireEvent.click(screen.getByTestId('add-tag'))
    fireEvent.click(screen.getByRole('radio', { name: /Ersetzen/i }))
    fireEvent.click(screen.getByRole('button', { name: /Auf 5 Fragen anwenden/ }))
    expect(onBatchSave).toHaveBeenCalledTimes(1)
    expect(onBatchSave).toHaveBeenCalledWith({ tagsErsetzen: ['t1', 't2'] }, 'ersetzen')
  })

  it('Phase 3b: Single-Edit-Modus rendert KEINE BatchTagPicker-Radios (Backward-Compat)', () => {
    renderInProvider(
      <SharedFragenEditor
        frage={null}
        onSpeichern={vi.fn()}
        onAbbrechen={vi.fn()}
        tagPickerSlot={({ tagIds }) => (
          <div data-testid="tagslot">tags={tagIds.join(',')}</div>
        )}
      />,
    )
    expect(screen.queryByRole('radio', { name: /Hinzufügen|Ersetzen|Entfernen/i })).toBeNull()
    expect(screen.getByTestId('tagslot')).toBeInTheDocument()
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
