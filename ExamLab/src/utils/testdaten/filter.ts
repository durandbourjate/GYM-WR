import {
  TEST_KURS_ID, TEST_KLASSE_ID, TEST_ID_PREFIX, TEST_EMAIL_REGEX,
} from './identifikation'

/** Record-Shape: alle Felder optional; wir prüfen jedes einzeln (OR-Logik). */
export interface TestdatenKandidat {
  kursId?: string
  klasse?: string
  userEmail?: string
  id?: string
}

/**
 * Prüft ob ein Record zu Testdaten gehört. OR-Logik: ein einziger Match reicht.
 * Single source of truth via `identifikation.ts`-Konstanten.
 */
export function istTestdaten(record: TestdatenKandidat): boolean {
  if (record.kursId === TEST_KURS_ID) return true
  if (record.klasse === TEST_KLASSE_ID) return true
  if (record.userEmail && TEST_EMAIL_REGEX.test(record.userEmail)) return true
  if (record.id && record.id.startsWith(TEST_ID_PREFIX)) return true
  return false
}

/**
 * Liste-Filter: gibt records gefiltert zurück.
 * - Wenn `testdatenSichtbar` true → records unverändert
 * - Wenn false → Test-Records werden raus-gefiltert
 *
 * Generisch — funktioniert mit jedem Record-Shape, das die TestdatenKandidat-Felder
 * (optional) hat.
 */
export function filtereTestdatenWennDeaktiviert<T extends TestdatenKandidat>(
  records: readonly T[],
  testdatenSichtbar: boolean,
): T[] {
  if (testdatenSichtbar) return [...records]
  return records.filter(r => !istTestdaten(r))
}
