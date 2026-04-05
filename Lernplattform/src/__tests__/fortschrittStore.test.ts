import { describe, it, expect, beforeEach } from 'vitest'
import { useFortschrittStore } from '../store/fortschrittStore'

describe('fortschrittStore', () => {
  beforeEach(() => {
    useFortschrittStore.setState({ fortschritte: {} })
    localStorage.clear()
  })

  it('hat leeren Anfangszustand', () => {
    expect(useFortschrittStore.getState().fortschritte).toEqual({})
  })

  it('erstellt neuen Fortschritt bei erster richtiger Antwort', () => {
    useFortschrittStore.getState().antwortVerarbeiten('f1', 'test@mail.com', true, 's1')

    const f = useFortschrittStore.getState().fortschritte['f1']
    expect(f).toBeDefined()
    expect(f.versuche).toBe(1)
    expect(f.richtig).toBe(1)
    expect(f.richtigInFolge).toBe(1)
    expect(f.mastery).toBe('ueben')
  })

  it('erstellt neuen Fortschritt bei erster falscher Antwort', () => {
    useFortschrittStore.getState().antwortVerarbeiten('f1', 'test@mail.com', false, 's1')

    const f = useFortschrittStore.getState().fortschritte['f1']
    expect(f.versuche).toBe(1)
    expect(f.richtig).toBe(0)
    expect(f.richtigInFolge).toBe(0)
    expect(f.mastery).toBe('ueben')
  })

  it('baut Mastery ueber mehrere Antworten auf', () => {
    const store = useFortschrittStore.getState()
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')

    const f = useFortschrittStore.getState().fortschritte['f1']
    expect(f.richtigInFolge).toBe(3)
    expect(f.mastery).toBe('gefestigt')
  })

  it('setzt richtigInFolge bei Fehler zurueck', () => {
    const store = useFortschrittStore.getState()
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')
    store.antwortVerarbeiten('f1', 'test@mail.com', false, 's1')

    const f = useFortschrittStore.getState().fortschritte['f1']
    expect(f.richtigInFolge).toBe(0)
    expect(f.mastery).toBe('ueben')
  })

  it('persistiert in localStorage', () => {
    useFortschrittStore.getState().antwortVerarbeiten('f1', 'test@mail.com', true, 's1')

    const stored = localStorage.getItem('lernplattform-fortschritt')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed['f1']).toBeDefined()
  })

  it('laedt aus localStorage', async () => {
    const data = {
      f1: {
        fragenId: 'f1', email: 'test@mail.com', versuche: 3, richtig: 3,
        richtigInFolge: 3, sessionIds: ['s1'], letzterVersuch: '2026-04-03', mastery: 'gefestigt',
      },
    }
    localStorage.setItem('lernplattform-fortschritt', JSON.stringify(data))

    await useFortschrittStore.getState().ladeFortschritt()

    const f = useFortschrittStore.getState().fortschritte['f1']
    expect(f.mastery).toBe('gefestigt')
    expect(f.richtigInFolge).toBe(3)
  })

  it('gibt Mastery fuer Frage zurueck', () => {
    useFortschrittStore.getState().antwortVerarbeiten('f1', 'test@mail.com', true, 's1')

    expect(useFortschrittStore.getState().getMastery('f1')).toBe('ueben')
    expect(useFortschrittStore.getState().getMastery('f99')).toBe('neu')
  })

  it('berechnet Themen-Fortschritt', () => {
    const store = useFortschrittStore.getState()
    // f1: 3x richtig → gefestigt
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')
    store.antwortVerarbeiten('f1', 'test@mail.com', true, 's1')
    // f2: 1x richtig → ueben
    store.antwortVerarbeiten('f2', 'test@mail.com', true, 's1')

    const thema = useFortschrittStore.getState().getThemenFortschritt(
      [{ id: 'f1', fach: 'Mathe', thema: 'Add' }, { id: 'f2', fach: 'Mathe', thema: 'Add' }, { id: 'f3', fach: 'Mathe', thema: 'Add' }] as import('../types/fragen').Frage[]
    )

    expect(thema.gesamt).toBe(3)
    expect(thema.gefestigt).toBe(1)
    expect(thema.ueben).toBe(1)
    expect(thema.neu).toBe(1)
  })
})

describe('fortschrittStore Gruppen-Selektoren', () => {
  beforeEach(() => {
    useFortschrittStore.setState({
      fortschritte: {},
      gruppenFortschritt: {
        'gruppe-1': [
          { fragenId: 'f1', email: 'alice@test.ch', versuche: 5, richtig: 5, richtigInFolge: 5, sessionIds: ['s1', 's2'], letzterVersuch: '2026-04-05', mastery: 'gemeistert' },
          { fragenId: 'f2', email: 'alice@test.ch', versuche: 3, richtig: 1, richtigInFolge: 0, sessionIds: ['s1'], letzterVersuch: '2026-04-05', mastery: 'ueben' },
          { fragenId: 'f1', email: 'bob@test.ch', versuche: 3, richtig: 3, richtigInFolge: 3, sessionIds: ['s1'], letzterVersuch: '2026-04-05', mastery: 'gefestigt' },
        ]
      },
      gruppenSessions: {
        'gruppe-1': [
          { sessionId: 's1', email: 'alice@test.ch', fach: 'BWL', thema: 'Bilanz', datum: '2026-04-05', anzahlFragen: 10, richtig: 7 },
        ]
      },
      lernziele: [],
    })
    localStorage.clear()
  })

  it('getFortschrittFuerSuS filtert nach Email', () => {
    const result = useFortschrittStore.getState().getFortschrittFuerSuS('gruppe-1', 'alice@test.ch')
    expect(result).toHaveLength(2)
    expect(result.every(fp => fp.email === 'alice@test.ch')).toBe(true)
  })

  it('getFortschrittFuerSuS gibt leeres Array für unbekannte Gruppe', () => {
    const result = useFortschrittStore.getState().getFortschrittFuerSuS('nope', 'alice@test.ch')
    expect(result).toHaveLength(0)
  })

  it('getSessionsFuerSuS filtert nach Email', () => {
    const result = useFortschrittStore.getState().getSessionsFuerSuS('gruppe-1', 'alice@test.ch')
    expect(result).toHaveLength(1)
  })

  it('getSessionsFuerSuS gibt leeres Array für unbekannte Email', () => {
    const result = useFortschrittStore.getState().getSessionsFuerSuS('gruppe-1', 'nobody@test.ch')
    expect(result).toHaveLength(0)
  })
})
