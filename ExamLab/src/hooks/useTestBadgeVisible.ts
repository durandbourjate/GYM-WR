import { useStammdatenStore } from '../store/stammdatenStore'
import { istTestdaten, type TestdatenKandidat } from '../utils/testdaten/filter'

/**
 * Liefert true wenn (a) record zu Testdaten gehört UND (b) LP `testdatenSichtbar=true` hat.
 * Konsumenten zeigen <TestBadge /> bei true. Listen-Integration kommt in F.4.
 */
export function useTestBadgeVisible(record: TestdatenKandidat): boolean {
  const sichtbar = useStammdatenStore(s => s.lpProfil?.testdatenSichtbar ?? false)
  if (!sichtbar) return false
  return istTestdaten(record)
}
