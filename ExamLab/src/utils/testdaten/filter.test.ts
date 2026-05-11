import { describe, it, expect } from 'vitest'
import { istTestdaten, filtereTestdatenWennDeaktiviert } from './filter'

describe('istTestdaten', () => {
  it('matched kursId-Treffer', () => {
    expect(istTestdaten({ kursId: 'test-kurs-01' })).toBe(true)
    expect(istTestdaten({ kursId: 'sf-wr-29c' })).toBe(false)
  })

  it('matched klasse-Treffer', () => {
    expect(istTestdaten({ klasse: 'test-klasse-01' })).toBe(true)
    expect(istTestdaten({ klasse: '29c' })).toBe(false)
  })

  it('matched userEmail-Treffer (SuS-Pattern)', () => {
    expect(istTestdaten({ userEmail: 'wr.test@stud.gymhofwil.ch' })).toBe(true)
    expect(istTestdaten({ userEmail: 'anna.testschueler1@stud.gymhofwil.ch' })).toBe(true)
    expect(istTestdaten({ userEmail: 'echt@stud.gymhofwil.ch' })).toBe(false)
  })

  it('matched id-Prefix `test-`', () => {
    expect(istTestdaten({ id: 'test-pruefung-01' })).toBe(true)
    expect(istTestdaten({ id: 'echte-pruefung' })).toBe(false)
  })

  it('false bei leerem Object', () => {
    expect(istTestdaten({})).toBe(false)
  })

  it('false bei nur undefined Feldern', () => {
    expect(istTestdaten({ kursId: undefined, klasse: undefined, userEmail: undefined, id: undefined })).toBe(false)
  })

  it('OR-Logik: ein einziger Match reicht', () => {
    expect(istTestdaten({ kursId: 'echt-kurs', id: 'test-foo' })).toBe(true)
  })
})

describe('filtereTestdatenWennDeaktiviert', () => {
  const records = [
    { id: 'a-1', kursId: 'test-kurs-01' },
    { id: 'a-2', kursId: 'sf-wr-29c' },
    { id: 'test-b', kursId: 'sf-wr-29c' },
    { id: 'c', userEmail: 'echt@stud.gymhofwil.ch' },
    { id: 'd', userEmail: 'wr.test@stud.gymhofwil.ch' },
  ]

  it('lässt alle durch wenn testdatenSichtbar=true', () => {
    expect(filtereTestdatenWennDeaktiviert(records, true)).toEqual(records)
  })

  it('filtert Test-Records raus wenn testdatenSichtbar=false', () => {
    const ergebnis = filtereTestdatenWennDeaktiviert(records, false)
    expect(ergebnis.map(r => r.id)).toEqual(['a-2', 'c'])
  })

  it('leeres Array → leer', () => {
    expect(filtereTestdatenWennDeaktiviert([], false)).toEqual([])
    expect(filtereTestdatenWennDeaktiviert([], true)).toEqual([])
  })
})
