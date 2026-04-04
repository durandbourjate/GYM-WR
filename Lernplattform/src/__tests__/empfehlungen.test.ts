import { describe, it, expect } from 'vitest'
import { berechneEmpfehlungen } from '../utils/empfehlungen'
import type { Frage } from '../types/fragen'
import type { FragenFortschritt } from '../types/fortschritt'
import type { Auftrag } from '../types/auftrag'

const BASIS = {
  version: 1, erstelltAm: '', geaendertAm: '',
  fachbereich: 'VWL' as const, semester: [] as string[], gefaesse: [] as string[],
  bloom: 'K2' as const, tags: [] as string[], punkte: 1, musterlosung: '',
  bewertungsraster: [], verwendungen: [],
  schwierigkeit: 1,
}

function macheFrage(id: string, fach: string, thema: string): Frage {
  return {
    ...BASIS, id, fach, thema, typ: 'mc', fragetext: `Frage ${id}`,
    optionen: [
      { id: '1', text: 'A', korrekt: true },
      { id: '2', text: 'B', korrekt: false },
    ],
    mehrfachauswahl: false, zufallsreihenfolge: false,
  }
}

function macheFortschritt(fragenId: string, mastery: 'neu' | 'ueben' | 'gefestigt' | 'gemeistert', richtigInFolge = 0): FragenFortschritt {
  return {
    fragenId, email: 'test@mail.com', versuche: mastery === 'neu' ? 0 : 5,
    richtig: mastery === 'gemeistert' ? 5 : mastery === 'gefestigt' ? 3 : 1,
    richtigInFolge, sessionIds: ['s1'], letzterVersuch: '2026-04-03', mastery,
  }
}

describe('berechneEmpfehlungen', () => {
  const fragen: Frage[] = [
    macheFrage('f1', 'Mathe', 'Addition'),
    macheFrage('f2', 'Mathe', 'Addition'),
    macheFrage('f3', 'Mathe', 'Multiplikation'),
    macheFrage('f4', 'Deutsch', 'Wortarten'),
    macheFrage('f5', 'Deutsch', 'Wortarten'),
  ]

  it('empfiehlt aktiven Auftrag zuerst', () => {
    const auftraege: Auftrag[] = [{
      id: 'a1', gruppeId: 'g1', erstelltVon: 'admin@mail.com',
      zielEmail: ['test@mail.com'], titel: 'Mathe ueben',
      filter: { fach: 'Mathe', thema: 'Addition' },
      status: 'aktiv', erstelltAm: '2026-04-03',
    }]

    const empfehlungen = berechneEmpfehlungen(fragen, {}, auftraege, 'test@mail.com')
    expect(empfehlungen[0].typ).toBe('auftrag')
    expect(empfehlungen[0].thema).toBe('Addition')
  })

  it('empfiehlt groesste Luecke', () => {
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: macheFortschritt('f1', 'gemeistert', 5),
      f2: macheFortschritt('f2', 'gemeistert', 5),
      f3: macheFortschritt('f3', 'ueben', 0),
      f4: macheFortschritt('f4', 'ueben', 0),
      f5: macheFortschritt('f5', 'ueben', 1),
    }

    const empfehlungen = berechneEmpfehlungen(fragen, fortschritte, [], 'test@mail.com')
    // Groesste Luecke: Thema mit tiefstem Mastery
    expect(empfehlungen.some(e => e.typ === 'luecke')).toBe(true)
  })

  it('empfiehlt Festigung (Thema kurz vor gemeistert)', () => {
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: macheFortschritt('f1', 'gefestigt', 4),
      f2: macheFortschritt('f2', 'gefestigt', 3),
      f3: macheFortschritt('f3', 'ueben', 0),
      f4: macheFortschritt('f4', 'neu'),
      f5: macheFortschritt('f5', 'neu'),
    }

    const empfehlungen = berechneEmpfehlungen(fragen, fortschritte, [], 'test@mail.com')
    expect(empfehlungen.some(e => e.typ === 'festigung')).toBe(true)
  })

  it('gibt max 3 Empfehlungen', () => {
    const empfehlungen = berechneEmpfehlungen(fragen, {}, [], 'test@mail.com')
    expect(empfehlungen.length).toBeLessThanOrEqual(3)
  })

  it('gibt leere Liste wenn alle gemeistert', () => {
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: macheFortschritt('f1', 'gemeistert', 5),
      f2: macheFortschritt('f2', 'gemeistert', 5),
      f3: macheFortschritt('f3', 'gemeistert', 5),
      f4: macheFortschritt('f4', 'gemeistert', 5),
      f5: macheFortschritt('f5', 'gemeistert', 5),
    }

    const empfehlungen = berechneEmpfehlungen(fragen, fortschritte, [], 'test@mail.com')
    expect(empfehlungen.length).toBe(0)
  })
})
