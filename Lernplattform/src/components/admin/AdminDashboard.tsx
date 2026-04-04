import { useState } from 'react'
import { useGruppenStore } from '../../store/gruppenStore'
import AdminUebersicht from './AdminUebersicht'
import AdminKindDetail from './AdminKindDetail'
import AdminThemaDetail from './AdminThemaDetail'
import AdminAuftraege from './AdminAuftraege'
import AdminSettings from './AdminSettings'
import AdminFragenbank from './AdminFragenbank'

interface AdminDashboardProps {
  onZuUeben?: () => void
}

type AdminAnsicht =
  | { typ: 'uebersicht' }
  | { typ: 'auftraege' }
  | { typ: 'einstellungen' }
  | { typ: 'fragenbank' }
  | { typ: 'kind'; email: string; name: string }
  | { typ: 'thema'; email: string; name: string; fach: string; thema: string }

export default function AdminDashboard({ onZuUeben: _onZuUeben }: AdminDashboardProps) {
  const { aktiveGruppe } = useGruppenStore()
  const [ansicht, setAnsicht] = useState<AdminAnsicht>({ typ: 'uebersicht' })

  const zurueck = () => {
    if (ansicht.typ === 'thema') {
      setAnsicht({ typ: 'kind', email: ansicht.email, name: ansicht.name })
    } else {
      setAnsicht({ typ: 'uebersicht' })
    }
  }

  const istHauptTab = ansicht.typ === 'uebersicht' || ansicht.typ === 'auftraege' || ansicht.typ === 'einstellungen' || ansicht.typ === 'fragenbank'

  return (
    <div>
      {/* Breadcrumb / Titel */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!istHauptTab && (
              <button onClick={zurueck} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
                &#8592;
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold dark:text-white">
                {istHauptTab && 'Admin-Dashboard'}
                {ansicht.typ === 'kind' && ansicht.name}
                {ansicht.typ === 'thema' && `${ansicht.name} — ${ansicht.thema}`}
              </h2>
              {aktiveGruppe && <span className="text-xs text-gray-500">{aktiveGruppe.name}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tab-Leiste */}
      {istHauptTab && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-6 flex gap-4">
            <button
              onClick={() => setAnsicht({ typ: 'uebersicht' })}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${ansicht.typ === 'uebersicht' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setAnsicht({ typ: 'auftraege' })}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${ansicht.typ === 'auftraege' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Auftraege
            </button>
            <button
              onClick={() => setAnsicht({ typ: 'fragenbank' })}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${ansicht.typ === 'fragenbank' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Fragenbank
            </button>
            <button
              onClick={() => setAnsicht({ typ: 'einstellungen' })}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${ansicht.typ === 'einstellungen' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Einstellungen
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-6">
        {ansicht.typ === 'uebersicht' && (
          <AdminUebersicht
            onKindKlick={(email, name) => setAnsicht({ typ: 'kind', email, name })}
          />
        )}
        {ansicht.typ === 'kind' && (
          <AdminKindDetail
            email={ansicht.email}
            name={ansicht.name}
            onThemaKlick={(fach, thema) => setAnsicht({ typ: 'thema', email: ansicht.email, name: ansicht.name, fach, thema })}
          />
        )}
        {ansicht.typ === 'auftraege' && <AdminAuftraege />}
        {ansicht.typ === 'fragenbank' && <AdminFragenbank />}
        {ansicht.typ === 'einstellungen' && <AdminSettings />}
        {ansicht.typ === 'thema' && (
          <AdminThemaDetail
            email={ansicht.email}
            name={ansicht.name}
            fach={ansicht.fach}
            thema={ansicht.thema}
          />
        )}
      </main>
    </div>
  )
}
