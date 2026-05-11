import { describe, it, expect } from 'vitest'
import {
  TEST_KURS_ID, TEST_KLASSE_ID, TEST_ID_PREFIX, TEST_EMAIL_REGEX,
  TEST_LP_EMAIL, TEST_SUS_EMAILS, istTestEmail,
} from './identifikation'

describe('Testdaten-Konstanten', () => {
  it('IDs entsprechen Spec', () => {
    expect(TEST_KURS_ID).toBe('test-kurs-01')
    expect(TEST_KLASSE_ID).toBe('test-klasse-01')
    expect(TEST_ID_PREFIX).toBe('test-')
  })

  it('TEST_SUS_EMAILS hat 20 Einträge inkl. wr.test', () => {
    expect(TEST_SUS_EMAILS).toHaveLength(20)
    expect(TEST_SUS_EMAILS).toContain('wr.test@stud.gymhofwil.ch')
  })

  it('TEST_LP_EMAIL ist wr.test@gymhofwil.ch', () => {
    expect(TEST_LP_EMAIL).toBe('wr.test@gymhofwil.ch')
  })
})

describe('TEST_EMAIL_REGEX', () => {
  it('matcht Test-SuS-Emails', () => {
    expect(TEST_EMAIL_REGEX.test('wr.test@stud.gymhofwil.ch')).toBe(true)
    expect(TEST_EMAIL_REGEX.test('anna.testschueler1@stud.gymhofwil.ch')).toBe(true)
    expect(TEST_EMAIL_REGEX.test('sven.testschueler19@stud.gymhofwil.ch')).toBe(true)
  })

  it('matcht NICHT echte SuS-Emails (auch wenn "test" im Namen vorkommt)', () => {
    expect(TEST_EMAIL_REGEX.test('test.normaluser@stud.gymhofwil.ch')).toBe(false)
    expect(TEST_EMAIL_REGEX.test('martin.testermann@stud.gymhofwil.ch')).toBe(false)
    expect(TEST_EMAIL_REGEX.test('protest@stud.gymhofwil.ch')).toBe(false)
  })

  it('matcht NICHT die LP-Test-Email (anders als SuS-Test-Email)', () => {
    expect(TEST_EMAIL_REGEX.test('wr.test@gymhofwil.ch')).toBe(false)
  })
})

describe('istTestEmail', () => {
  it('Helper-Wrapper über Regex + LP-Email-Check', () => {
    expect(istTestEmail('wr.test@stud.gymhofwil.ch')).toBe(true)
    expect(istTestEmail('wr.test@gymhofwil.ch')).toBe(true)
    expect(istTestEmail('echt@gymhofwil.ch')).toBe(false)
    expect(istTestEmail(undefined)).toBe(false)
    expect(istTestEmail(null)).toBe(false)
    expect(istTestEmail('')).toBe(false)
  })
})
