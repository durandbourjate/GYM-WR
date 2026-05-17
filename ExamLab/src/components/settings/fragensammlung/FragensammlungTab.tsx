import LueckentextBulkToggle from './LueckentextBulkToggle'
import { TYPO } from '../../../styles/typografie'
import { TabStarToggle } from '../../lp/TabStarToggle'

interface Props {
  email: string
  istAdmin: boolean
}

/**
 * Settings-Tab „Fragensammlung": globale Defaults für Fragetypen.
 *
 * Aktuell nur Lückentext-Bulk-Toggle. Geplante künftige Sektionen:
 *  - Metadaten-Felder (Semester, Quartale, Anzahl Jahre, Gefässe)
 *  - Andere Fragetyp-Settings
 */
export default function FragensammlungTab({ email, istAdmin }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100`}>Fragensammlung</h2>
        <TabStarToggle tabId="fragensammlung" surface="einstellungen" label="Fragensammlung" />
      </div>
      <section>
        <h3 className={`${TYPO.h2} mb-2 text-slate-700 dark:text-slate-200`}>
          Lückentext-Fragen
        </h3>
        <LueckentextBulkToggle email={email} istAdmin={istAdmin} />
      </section>
    </div>
  )
}
