/**
 * Single source of truth für Testdaten-Identifikatoren.
 * MUSS synchron mit gleichen Konstanten in `apps-script-code.js` sein —
 * siehe Cluster F Spec §5.1 Single Source of Truth Backend ↔ Frontend.
 */

export const TEST_KURS_ID = 'test-kurs-01'
export const TEST_KLASSE_ID = 'test-klasse-01'
export const TEST_ID_PREFIX = 'test-'

/** Matcht SuS-Test-Emails: `wr.test@stud.gymhofwil.ch` oder `<name>.testschuelerN@stud.gymhofwil.ch`. */
export const TEST_EMAIL_REGEX = /^(wr\.test|[a-z]+\.testschueler\d+)@stud\.gymhofwil\.ch$/

export const TEST_LP_EMAIL = 'wr.test@gymhofwil.ch'

/** 20 Test-SuS gemäss Spec §4.5. */
export const TEST_SUS_EMAILS: readonly string[] = [
  'wr.test@stud.gymhofwil.ch',
  'anna.testschueler1@stud.gymhofwil.ch',
  'beat.testschueler2@stud.gymhofwil.ch',
  'clara.testschueler3@stud.gymhofwil.ch',
  'david.testschueler4@stud.gymhofwil.ch',
  'eva.testschueler5@stud.gymhofwil.ch',
  'felix.testschueler6@stud.gymhofwil.ch',
  'greta.testschueler7@stud.gymhofwil.ch',
  'hans.testschueler8@stud.gymhofwil.ch',
  'ina.testschueler9@stud.gymhofwil.ch',
  'jonas.testschueler10@stud.gymhofwil.ch',
  'karin.testschueler11@stud.gymhofwil.ch',
  'lukas.testschueler12@stud.gymhofwil.ch',
  'mara.testschueler13@stud.gymhofwil.ch',
  'noah.testschueler14@stud.gymhofwil.ch',
  'olivia.testschueler15@stud.gymhofwil.ch',
  'pia.testschueler16@stud.gymhofwil.ch',
  'quentin.testschueler17@stud.gymhofwil.ch',
  'rosa.testschueler18@stud.gymhofwil.ch',
  'sven.testschueler19@stud.gymhofwil.ch',
] as const

/**
 * Helper: prüft ob eine Email zu einem Test-Account gehört (SuS oder LP).
 * Tolerant gegen undefined/null/empty.
 */
export function istTestEmail(email: string | undefined | null): boolean {
  if (!email) return false
  if (email === TEST_LP_EMAIL) return true
  return TEST_EMAIL_REGEX.test(email)
}
