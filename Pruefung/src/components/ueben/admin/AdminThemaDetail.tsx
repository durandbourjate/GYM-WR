import type { Frage } from '../../../types/ueben/fragen'
import type { FragenFortschritt } from '../../../types/ueben/fortschritt'

interface Props {
  email: string
  name: string
  fach: string
  thema: string
}

export default function AdminThemaDetail({ email: _email, fach, thema }: Props) {
  // Platzhalter — Fortschritt-Daten werden in zukünftiger Phase aus Backend geladen
  const fortschritte: FragenFortschritt[] = []
  const themaFragen: Frage[] = []

  // Gesamt-Statistik
  const themaFortschritte = fortschritte.filter(fp =>
    themaFragen.some(f => f.id === fp.fragenId)
  )
  const gesamtVersuche = themaFortschritte.reduce((s, fp) => s + fp.versuche, 0)
  const gesamtRichtig = themaFortschritte.reduce((s, fp) => s + fp.richtig, 0)

  return (
    <div className="space-y-6">
      {/* Gesamt-Statistik */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-3 dark:text-white">{fach} — {thema}</h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold dark:text-white">{gesamtVersuche}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">Versuche</span>
          </div>
          <div>
            <span className="text-2xl font-bold dark:text-white">{gesamtRichtig}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">richtig</span>
          </div>
          <div>
            <span className="text-2xl font-bold dark:text-white">
              {gesamtVersuche > 0 ? Math.round((gesamtRichtig / gesamtVersuche) * 100) : 0}%
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">Quote</span>
          </div>
        </div>
      </div>

      {/* Einzelne Fragen */}
      <div>
        <h3 className="text-lg font-semibold mb-3 dark:text-white">Fragen im Detail</h3>
        <div className="space-y-2">
          {themaFragen.map((frage) => {
            const fp = themaFortschritte.find(f => f.fragenId === frage.id)

            return (
              <div key={frage.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm dark:text-white">{'fragetext' in frage ? (frage as { fragetext: string }).fragetext : frage.thema}</span>
                  <MasteryLabel mastery={fp?.mastery || 'neu'} />
                </div>

                {fp && fp.versuche > 0 ? (
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>{fp.versuche} Versuche</span>
                    <span>{fp.richtig} richtig ({Math.round((fp.richtig / fp.versuche) * 100)}%)</span>
                    <span>{fp.richtigInFolge}x in Folge</span>
                    <span>{fp.sessionIds.length} Session{fp.sessionIds.length !== 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Noch nicht bearbeitet</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MasteryLabel({ mastery }: { mastery: string }) {
  const farben: Record<string, string> = {
    gemeistert: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    gefestigt: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ueben: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    neu: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${farben[mastery] || farben.neu}`}>
      {mastery}
    </span>
  )
}
