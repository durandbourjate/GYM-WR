import { useStammdatenStore } from '../store/stammdatenStore'
import { TEST_KLASSE_ID, TEST_KURS_ID } from '../utils/testdaten/identifikation'

export interface TestdatenStatus {
  initialisiert: boolean
}

/**
 * Inferenz ohne neuen Backend-Endpoint: Testdaten gelten als initialisiert,
 * wenn die Marker-Klasse + Marker-Kurs in Stammdaten vorhanden sind. F.2
 * `seedTestdatenStammdaten_` legt beide an, `loescheAlleTestdaten_` entfernt
 * sie wieder.
 */
export function useTestdatenStatus(): TestdatenStatus {
  const stammdaten = useStammdatenStore(s => s.stammdaten)
  if (!stammdaten) return { initialisiert: false }
  const hatKlasse = stammdaten.klassen.includes(TEST_KLASSE_ID)
  const hatKurs = stammdaten.kurse.some(k => k.id === TEST_KURS_ID)
  return { initialisiert: hatKlasse && hatKurs }
}
