import { useGruppenStore } from '../store/gruppenStore'

export default function GruppenAuswahl() {
  const { gruppen, waehleGruppe, ladeStatus } = useGruppenStore()

  if (ladeStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Gruppen werden geladen...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center dark:text-white">Gruppe wählen</h2>
        {gruppen.length === 0 && ladeStatus === 'fertig' && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p className="text-3xl mb-3">🔒</p>
            <p className="font-medium dark:text-white mb-1">Keine Gruppe zugeordnet</p>
            <p className="text-sm">Du bist noch keiner Übungsgruppe zugeordnet. Bitte wende dich an deine Lehrperson.</p>
          </div>
        )}
        <div className="space-y-3">
          {gruppen.map((gruppe) => (
            <button
              key={gruppe.id}
              onClick={() => waehleGruppe(gruppe.id)}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium dark:text-white">{gruppe.name}</div>
              <div className="text-sm text-gray-500">
                {gruppe.typ === 'gym' ? 'Schule' : 'Familie'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
