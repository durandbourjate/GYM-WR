import { useState } from 'react'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import AdminUebersicht from './AdminUebersicht'
import AdminKindDetail from './AdminKindDetail'
import AdminThemaDetail from './AdminThemaDetail'
import AdminAuftraege from './AdminAuftraege'
import AdminThemensteuerung from './AdminThemensteuerung'
// AdminFragenbank entfernt — Fragenbank ist über LPHeader erreichbar

interface AdminDashboardProps {
  onZuUeben?: () => void
  onFachKlick?: () => void
}

type AdminAnsicht =
  | { typ: 'uebersicht' }
  | { typ: 'auftraege' }
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

  const istHauptTab = ansicht.typ === 'uebersicht' || ansicht.typ === 'auftraege' || ansicht.typ === 'themensteuerung'

  return (
    <div>
      {/* Breadcrumb bei Detail-Ansichten */}
      {!istHauptTab && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button onClick={zurueck} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
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
          <div className="max-w-7xl mx-auto px-6 flex gap-4">
            <button
              onClick={() => setAnsicht({ typ: 'uebersicht' })}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${ansicht.typ === 'uebersicht' ? 'border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setAnsicht({ typ: 'auftraege' })}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${ansicht.typ === 'auftraege' ? 'border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Aufträge
            </button>
            <button
              onClick={() => setAnsicht({ typ: 'themensteuerung' })}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${ansicht.typ === 'themensteuerung' ? 'border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Themen
            </button>
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
        {ansicht.typ === 'auftraege' && <AdminAuftraege />}
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
