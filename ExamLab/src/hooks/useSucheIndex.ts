import { useMemo } from 'react'
import { useStammdatenStore } from '../store/stammdatenStore'
import { useConfigsListStore } from '../store/configsListStore'
import { useFragensammlungStore } from '../store/fragensammlungStore'
import { useAuthStore } from '../store/authStore'
import { tabsFuerSurface } from '../utils/tabRegistry'
import { filtereTestdatenWennDeaktiviert } from '../utils/testdaten/filter'
import type { SucheIndex } from '../types/suche'

/**
 * Liefert den Such-Index aus 4 Source-Stores + Tab-Registry, Cluster-F-Filter
 * (testdatenSichtbar) wird pro Quelle angewendet.
 *
 * Cluster F: `filtereTestdatenWennDeaktiviert` matched per OR über
 * (kursId, klasse, userEmail, id-Prefix 'test-'). Pro Quelle wirkt:
 * - kurse: id + klassen (KursDefinition hat beide)
 * - configs: id + klasse (PruefungsConfig hat beide)
 * - fragen: nur id-Prefix (FrageSummary hat keine kursId/klasse/userEmail)
 */
export function useSucheIndex(): SucheIndex {
  const user = useAuthStore(s => s.user)
  const stammdaten = useStammdatenStore(s => s.stammdaten)
  const lpProfil = useStammdatenStore(s => s.lpProfil)
  const istAdminFn = useStammdatenStore(s => s.istAdmin)
  const configs = useConfigsListStore(s => s.configs)
  const fragen = useFragensammlungStore(s => s.summaries)

  // istAdminFn ist im Produktiv-Store immer eine Funktion; in Test-Mocks
  // kann sie fehlen — Fallback auf false.
  const istAdmin = typeof istAdminFn === 'function' ? istAdminFn(user?.email) : false
  const testdatenSichtbar = lpProfil?.testdatenSichtbar ?? false

  return useMemo(() => {
    const ctx = { istAdmin }
    const einstellungenTabs = tabsFuerSurface('einstellungen', ctx)
    const hilfeTabs = tabsFuerSurface('hilfe', ctx)

    const kurseGefiltert = filtereTestdatenWennDeaktiviert(stammdaten?.kurse ?? [], testdatenSichtbar)
    const configsGefiltert = filtereTestdatenWennDeaktiviert(configs ?? [], testdatenSichtbar)
    const fragenGefiltert = filtereTestdatenWennDeaktiviert(fragen ?? [], testdatenSichtbar)

    return {
      einstellungenTabs,
      hilfeTabs,
      kurse: kurseGefiltert,
      pruefungen: configsGefiltert.filter(c => c.typ !== 'formativ'),
      uebungen: configsGefiltert.filter(c => c.typ === 'formativ'),
      fragen: fragenGefiltert,
    }
  }, [istAdmin, stammdaten, configs, fragen, testdatenSichtbar])
}
