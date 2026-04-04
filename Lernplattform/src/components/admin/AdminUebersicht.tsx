import { useGruppenStore } from '../../store/gruppenStore'

interface Props {
  onKindKlick: (email: string, name: string) => void
}

export default function AdminUebersicht({ onKindKlick }: Props) {
  const { mitglieder, aktiveGruppe } = useGruppenStore()
  const lernende = mitglieder.filter(m => m.rolle === 'lernend')
  const admins = mitglieder.filter(m => m.rolle === 'admin')

  if (mitglieder.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p className="text-4xl mb-3">👥</p>
        <p>Noch keine Mitglieder in dieser Gruppe.</p>
        <p className="text-sm mt-1">Mitglieder können im Tab «Einstellungen → Mitglieder» hinzugefügt werden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gruppen-Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold dark:text-white mb-2">{aktiveGruppe?.name}</h3>
        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{lernende.length} Lernende</span>
          <span>{admins.length} Admin{admins.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Lernende */}
      {lernende.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Lernende ({lernende.length})
          </h4>
          <div className="space-y-2">
            {lernende.map((mitglied) => (
              <button
                key={mitglied.email}
                onClick={() => onKindKlick(mitglied.email, mitglied.name)}
                className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 min-h-[48px]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium dark:text-white">{mitglied.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{mitglied.email}</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admins */}
      {admins.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Admins ({admins.length})
          </h4>
          <div className="space-y-2">
            {admins.map((mitglied) => (
              <div
                key={mitglied.email}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
              >
                <span className="font-medium dark:text-white">{mitglied.name}</span>
                <span className="text-xs text-gray-400 ml-2">{mitglied.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
