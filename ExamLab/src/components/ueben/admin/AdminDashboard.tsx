import { useState } from 'react'
import { TabBar } from '../../ui/TabBar'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import AdminUebersicht from './AdminUebersicht'
import AdminKindDetail from './AdminKindDetail'
import AdminThemaDetail from './AdminThemaDetail'
import AdminThemensteuerung from './AdminThemensteuerung'
// AdminAuftraege entfernt (Bundle 8) — Aufträge werden in LearningView verwaltet.
// Store bleibt bestehen für SuS-Anzeige im Dashboard.
// AdminFragenbank entfernt — Fragenbank ist über LPHeader erreichbar

interface AdminDashboardProps {
  onZuUeben?: () => void
  onFachKlick?: () => void
}

type AdminAnsicht =
  | { typ: 'uebersicht' }
  | { typ: 'themensteuerung' }
  | { typ: 'kind'; email: string; name: string }
  | { typ: 'thema'; email: string; name: string; fach: string; thema: string }

export default function AdminDashboard({ onZuUeben: _onZuUeben, onFachKlick }: AdminDashboardProps) {
  const { aktiveGruppe } = useUebenGruppenStore()
  const [ansicht, setAnsicht] = useState<AdminAnsicht>({ typ: 'uebersicht' })

  const zurueck = () => {
    if (ansicht.typ === 'thema') {
      setAnsicht({ typ: 'kind', email: ansicht.email, name: ansicht.name })
    } else {
      setAnsicht({ typ: 'uebersicht' })
    }
  }

  const istHauptTab = ansicht.typ === 'uebersicht' || ansicht.typ === 'themensteuerung'

  return (
    <div>
      {/* Breadcrumb bei Detail-Ansichten */}
      {!istHauptTab && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button onClick={zurueck} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center">
              &#8592;
            </button>
            <h2 className="text-lg font-bold dark:text-white">
              {ansicht.typ === 'kind' && ansicht.name}
              {ansicht.typ === 'thema' && `${ansicht.name} — ${ansicht.thema}`}
            </h2>
          </div>
        </div>
      )}

      {/* Tab-Leiste */}
      {istHauptTab && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-2">
            <TabBar
              tabs={[
                { id: 'uebersicht', label: 'Übersicht' },
                { id: 'themensteuerung', label: 'Themen' },
              ]}
              activeTab={ansicht.typ}
              onTabChange={(id) => setAnsicht({ typ: id as 'uebersicht' | 'themensteuerung' })}
              size="md"
            />
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        {ansicht.typ === 'uebersicht' && (
          <AdminUebersicht
            onKindKlick={(email, name) => setAnsicht({ typ: 'kind', email, name })}
            onFachKlick={onFachKlick ? () => onFachKlick() : undefined}
          />
        )}
        {ansicht.typ === 'kind' && (
          <AdminKindDetail
            gruppeId={aktiveGruppe?.id || ''}
            email={ansicht.email}
            name={ansicht.name}
            onThemaKlick={(fach, thema) => setAnsicht({ typ: 'thema', email: ansicht.email, name: ansicht.name, fach, thema })}
          />
        )}
        {ansicht.typ === 'themensteuerung' && <AdminThemensteuerung />}
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
