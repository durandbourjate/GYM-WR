import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'

export default function GruppenAuswahl() {
  const { gruppen, waehleGruppe, ladeStatus } = useUebenGruppenStore()

  if (ladeStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500">Gruppen werden geladen...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center dark:text-white">Gruppe wählen</h2>
        {gruppen.length === 0 && ladeStatus === 'fertig' && (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
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
              className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="font-medium dark:text-white">{gruppe.name}</div>
              <div className="text-sm text-slate-500">
                {gruppe.typ === 'gym' ? 'Schule' : 'Familie'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
