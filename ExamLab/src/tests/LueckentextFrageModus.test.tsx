import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import LueckentextFrage from '../components/fragetypen/LueckentextFrage.tsx'
import type { LueckentextFrage as LTType } from '../types/fragen-storage'

// Hooks am Modul-Level mocken — der Aufgabe-Renderer braucht useFrageAdapter und
// usePruefungStore, hier reicht ein minimaler Stub damit die Inputs/Selects gerendert
// werden (keine Interaktion im Test).
vi.mock('../hooks/useFrageAdapter.ts', () => ({
  useFrageAdapter: () => ({
    antwort: null,
    onAntwort: () => {},
    speichereZwischenstand: null,
    onPruefen: null,
    onSelbstbewerten: null,
    disabled: false,
    hatZwischenstand: false,
    istGeprueft: false,
    feedbackSichtbar: false,
    korrekt: null,
    markiertAlsUnsicher: false,
    toggleUnsicher: () => {},
    speichertPruefung: false,
    pruefFehler: null,
    letzteMusterloesung: null,
  }),
}))

vi.mock('../store/pruefungStore.ts', () => ({
  usePruefungStore: (sel: (s: { config: { rechtschreibpruefung: boolean; rechtschreibSprache: string } }) => unknown) =>
    sel({ config: { rechtschreibpruefung: true, rechtschreibSprache: 'de' } }),
}))

const baseFrage: LTType = {
  id: 'f1',
  typ: 'lueckentext',
  version: 1,
  erstelltAm: '2026-04-24',
  geaendertAm: '2026-04-24',
  fachbereich: 'BWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K1',
  tags: [],
  tagIds: [],
  punkte: 1,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Test',
  textMitLuecken: 'Hauptstadt = {{0}}',
  luecken: [{
    id: 'l0',
    korrekteAntworten: ['Bern'],
    dropdownOptionen: ['Bern', 'Zürich', 'Basel', 'Genf', 'Luzern'],
    caseSensitive: false,
  }],
} as LTType

describe('LueckentextFrage — lueckentextModus-Dispatch', () => {
  it('rendert Texteingabe wenn Modus freitext (trotz vorhandener dropdownOptionen)', () => {
    const frage = { ...baseFrage, lueckentextModus: 'freitext' as const }
    render(<LueckentextFrage frage={frage} modus="aufgabe" />)
    expect(document.querySelector('input[type="text"]')).not.toBeNull()
    expect(document.querySelector('select')).toBeNull()
  })

  it('rendert Dropdown wenn Modus dropdown', () => {
    const frage = { ...baseFrage, lueckentextModus: 'dropdown' as const }
    render(<LueckentextFrage frage={frage} modus="aufgabe" />)
    expect(document.querySelector('select')).not.toBeNull()
    expect(document.querySelector('input[type="text"]')).toBeNull()
  })

  it('Fallback: rendert Freitext wenn Modus dropdown aber dropdownOptionen leer', () => {
    const frage = {
      ...baseFrage,
      lueckentextModus: 'dropdown' as const,
      luecken: [{ ...baseFrage.luecken[0], dropdownOptionen: [] }],
    }
    render(<LueckentextFrage frage={frage} modus="aufgabe" />)
    expect(document.querySelector('input[type="text"]')).not.toBeNull()
    expect(document.querySelector('select')).toBeNull()
  })
})
