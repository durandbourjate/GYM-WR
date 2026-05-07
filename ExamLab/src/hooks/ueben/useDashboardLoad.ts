import { useEffect, useState } from 'react'
import type { Frage } from '../../types/ueben/fragen'
import type { Gruppe } from '../../types/ueben/gruppen'
import { useUebenFortschrittStore } from '../../store/ueben/fortschrittStore'
import { useUebenAuftragStore } from '../../store/ueben/auftragStore'
import { useThemenSichtbarkeitStore } from '../../store/ueben/themenSichtbarkeitStore'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'

export interface DashboardLoadResult {
  alleFragen: Frage[]
  laden: boolean
}

/**
 * Daten-Loading für SuS-Dashboard. Kapselt 2 separate useEffect's:
 * - Effekt A: Fortschritt + Auftraege (parallel)
 * - Effekt B: Fragen + Freischaltungen (parallel)
 *
 * Beide Effekte triggern unabhängig auf aktiveGruppe-Wechsel — die
 * heutige parallele Trigger-Sequenz ist beobachtbares Verhalten und
 * darf NICHT zu einem useEffect mit Promise.all konsolidiert werden
 * (Master-Spec §7, Lehre `feedback_memo_deps_trigger_vs_compute`).
 *
 * Store-Action-Identitäten sind über Zustand stabil — direkte Nutzung
 * in useEffect-Deps ohne Memo-Drift-Risiko.
 */
export function useDashboardLoad(aktiveGruppe: Gruppe | null): DashboardLoadResult {
  const ladeFortschritt = useUebenFortschrittStore(s => s.ladeFortschritt)
  const ladeAuftraege = useUebenAuftragStore(s => s.ladeAuftraege)
  const ladeFreischaltungen = useThemenSichtbarkeitStore(s => s.ladeFreischaltungen)

  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    ladeFortschritt()
    if (aktiveGruppe) ladeAuftraege(aktiveGruppe.id)
  }, [ladeFortschritt, ladeAuftraege, aktiveGruppe])

  useEffect(() => {
    if (!aktiveGruppe) return
    const ladeThemen = async () => {
      setLaden(true)
      const fragen = await uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
      setAlleFragen(fragen)
      setLaden(false)
    }
    ladeThemen()
    ladeFreischaltungen(aktiveGruppe.id)
  }, [aktiveGruppe, ladeFreischaltungen])

  return { alleFragen, laden }
}
