import { useUebungsStore } from '../store/uebungsStore'
import { FRAGETYP_KOMPONENTEN } from './fragetypen'

export default function UebungsScreen() {
  const { session, feedbackSichtbar, letzteAntwortKorrekt, beantworte, naechsteFrage, istSessionFertig, beendeSession, aktuelleFrage } = useUebungsStore()

  if (!session) return null

  const frage = aktuelleFrage()
  if (!frage) return null

  const Komponente = FRAGETYP_KOMPONENTEN[frage.typ]
  const istBeantwortet = frage.id in session.antworten
  const fortschritt = Object.keys(session.antworten).length
  const gesamt = session.fragen.length

  const handleWeiter = () => {
    if (istSessionFertig()) {
      beendeSession()
    } else {
      naechsteFrage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fortschrittsbalken */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {session.fach} — {session.thema}
          </span>
          <span className="text-sm font-medium dark:text-white">
            {fortschritt}/{gesamt}
          </span>
        </div>
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${(fortschritt / gesamt) * 100}%` }}
          />
        </div>
      </div>

      {/* Frage */}
      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium
              ${frage.schwierigkeit === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}
              ${frage.schwierigkeit === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
              ${frage.schwierigkeit === 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : ''}
            `}>
              {frage.schwierigkeit === 1 ? 'Einfach' : frage.schwierigkeit === 2 ? 'Mittel' : 'Schwer'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{frage.typ.toUpperCase()}</span>
          </div>

          <h2 className="text-lg font-medium mb-4 dark:text-white">{frage.frage}</h2>

          {Komponente ? (
            <Komponente
              frage={frage}
              onAntwort={beantworte}
              disabled={istBeantwortet}
              feedbackSichtbar={feedbackSichtbar}
              korrekt={letzteAntwortKorrekt}
            />
          ) : (
            <p className="text-gray-500">Fragetyp "{frage.typ}" nicht unterstuetzt.</p>
          )}
        </div>

        {/* Weiter-Button */}
        {feedbackSichtbar && (
          <button
            onClick={handleWeiter}
            className="w-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-xl py-3 font-medium min-h-[48px]"
          >
            {istSessionFertig() ? 'Ergebnis anzeigen' : 'Weiter'}
          </button>
        )}
      </main>
    </div>
  )
}
