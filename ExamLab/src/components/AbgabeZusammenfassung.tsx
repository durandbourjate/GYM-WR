import DOMPurify from 'dompurify'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { fachbereichFarbe } from '../utils/fachUtils.ts'
import { berechneAbschnittFortschritt } from '../utils/abschnitte.ts'
import type { Frage, MCFrage, LueckentextFrage, ZuordnungFrage } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

interface AbgabeZusammenfassungProps {
  onZurueck: () => void
}

export default function AbgabeZusammenfassung({ onZurueck }: AbgabeZusammenfassungProps) {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const alleFragen = usePruefungStore((s) => s.alleFragen)
  const antworten = usePruefungStore((s) => s.antworten)
  const user = useAuthStore((s) => s.user)

  if (!config) return null

  const { abschnitte: fortschrittAbschnitte, gesamtBeantwortet, gesamtFragen } =
    berechneAbschnittFortschritt(config, alleFragen, antworten)

  let globalIdx = 0

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 print:bg-white">
      {/* Header (versteckt beim Drucken) */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onZurueck}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            &larr; Zurück
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-700 dark:bg-slate-600 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors cursor-pointer"
          >
            Drucken / PDF
          </button>
        </div>
      </div>

      {/* Inhalt */}
      <div className="max-w-3xl mx-auto p-6 print:p-4 print:max-w-none">
        {/* Titel-Block */}
        <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 print:border-slate-300">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 print:text-black">
            {config.titel}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 dark:text-slate-400 print:text-slate-600">
            {user && (
              <span>{user.name}</span>
            )}
            <span>{gesamtBeantwortet} von {gesamtFragen} Fragen beantwortet</span>
            <span>{config.gesamtpunkte} Punkte möglich</span>
          </div>
        </div>

        {/* Abschnitte */}
        {config.abschnitte.map((abschnitt, abschnittIdx) => {
          const startIdx = globalIdx
          const fortschritt = fortschrittAbschnitte[abschnittIdx]

          return (
            <div key={abschnitt.titel} className="mb-8 print:mb-6 print:break-inside-avoid-page">
              {/* Abschnitt-Header */}
              <div className="mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 print:border-slate-300">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 print:text-black">
                  {abschnitt.titel}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                  {fortschritt.beantwortet}/{fortschritt.gesamt} beantwortet · {fortschritt.punkte} Punkte
                </p>
                {abschnitt.beschreibung && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 print:text-slate-500 mt-1 italic">
                    {abschnitt.beschreibung}
                  </p>
                )}
              </div>

              {/* Fragen */}
              <div className="flex flex-col gap-4 print:gap-3">
                {abschnitt.fragenIds.map((frageId, i) => {
                  const idx = startIdx + i
                  if (i === abschnitt.fragenIds.length - 1) globalIdx = idx + 1
                  const frage = fragen[idx]
                  if (!frage) return null
                  const antwort = antworten[frageId]

                  return (
                    <div
                      key={frageId}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-300 print:break-inside-avoid"
                    >
                      {/* Frage-Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded print:border print:border-slate-300 ${fachbereichFarbe(frage.fachbereich)}`}>
                              {frage.fachbereich}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                              {frage.punkte} P.
                            </span>
                            {!antwort && (
                              <span className="text-xs text-red-500 dark:text-red-400 print:text-red-600 font-medium">
                                Nicht beantwortet
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 print:text-black">
                            {(frage as MCFrage).fragetext}
                          </p>
                        </div>
                      </div>

                      {/* Antwort-Darstellung */}
                      <div className="ml-7">
                        {antwort ? (
                          <AntwortAnzeige frage={frage} antwort={antwort} />
                        ) : (
                          <p className="text-sm text-slate-400 dark:text-slate-500 print:text-slate-400 italic">
                            Keine Antwort eingegeben
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Footer (nur Print) */}
        <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-xs text-slate-400">
          <p>Erstellt am {new Date().toLocaleDateString('de-CH')} um {new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  )
}

/** Rendert die Antwort je nach Fragetyp */
function AntwortAnzeige({ frage, antwort }: { frage: Frage; antwort: Antwort }) {
  switch (antwort.typ) {
    case 'mc':
      return <MCAntwortAnzeige frage={frage as MCFrage} gewaehlteOptionen={antwort.gewaehlteOptionen} />
    case 'freitext':
      return <FreitextAntwortAnzeige text={antwort.text} />
    case 'lueckentext':
      return <LueckentextAntwortAnzeige frage={frage as LueckentextFrage} eintraege={antwort.eintraege} />
    case 'zuordnung':
      return <ZuordnungAntwortAnzeige frage={frage as ZuordnungFrage} zuordnungen={antwort.zuordnungen} />
    case 'richtigfalsch':
      return <RichtigFalschAntwortAnzeige bewertungen={antwort.bewertungen} />
    case 'berechnung':
      return <BerechnungAntwortAnzeige ergebnisse={antwort.ergebnisse} rechenweg={antwort.rechenweg} />
    default:
      return <p className="text-sm text-slate-400 italic">Anzeige nicht verfügbar</p>
  }
}

function MCAntwortAnzeige({ frage, gewaehlteOptionen }: { frage: MCFrage; gewaehlteOptionen: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      {frage.optionen.map((opt) => {
        const gewaehlt = gewaehlteOptionen.includes(opt.id)
        return (
          <div
            key={opt.id}
            className={`flex items-center gap-2 text-sm px-2.5 py-1.5 rounded ${
              gewaehlt
                ? 'bg-slate-100 dark:bg-slate-700 print:bg-slate-100 font-medium text-slate-800 dark:text-slate-100 print:text-black'
                : 'text-slate-500 dark:text-slate-400 print:text-slate-500'
            }`}
          >
            <span className={`w-4 h-4 rounded-sm border flex items-center justify-center text-xs ${
              gewaehlt
                ? 'border-slate-600 dark:border-slate-400 print:border-slate-600 bg-slate-600 dark:bg-slate-400 text-white dark:text-slate-800 print:bg-slate-600 print:text-white'
                : 'border-slate-300 dark:border-slate-600 print:border-slate-300'
            }`}>
              {gewaehlt && '\u2713'}
            </span>
            <span>{opt.text}</span>
          </div>
        )
      })}
    </div>
  )
}

function FreitextAntwortAnzeige({ text }: { text: string }) {
  // Prüfe ob HTML-Formatierung vorhanden
  const istHTML = /<[^>]+>/.test(text)

  if (istHTML) {
    return (
      <div
        className="text-sm text-slate-800 dark:text-slate-200 print:text-black bg-slate-50 dark:bg-slate-800 print:bg-slate-50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 prose-zusammenfassung"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
      />
    )
  }

  return (
    <p className="text-sm text-slate-800 dark:text-slate-200 print:text-black bg-slate-50 dark:bg-slate-800 print:bg-slate-50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 whitespace-pre-wrap">
      {text}
    </p>
  )
}

function LueckentextAntwortAnzeige({ frage, eintraege }: { frage: LueckentextFrage; eintraege: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-1.5">
      {frage.luecken.map((luecke, i) => {
        const wert = eintraege[luecke.id] || ''
        return (
          <div key={luecke.id} className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium min-w-[2rem]">
              {i + 1}.
            </span>
            <span className={`px-2.5 py-1 rounded border ${
              wert.trim()
                ? 'bg-slate-50 dark:bg-slate-800 print:bg-slate-50 border-slate-200 dark:border-slate-700 print:border-slate-300 text-slate-800 dark:text-slate-200 print:text-black'
                : 'border-dashed border-slate-300 dark:border-slate-600 print:border-slate-300 text-slate-400 dark:text-slate-500 italic'
            }`}>
              {wert.trim() || 'leer'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ZuordnungAntwortAnzeige({ frage, zuordnungen }: { frage: ZuordnungFrage; zuordnungen: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-1.5">
      {frage.paare.map((paar, i) => {
        const zugeordnet = zuordnungen[paar.links] || ''
        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black min-w-0 flex-1">
              {paar.links}
            </span>
            <span className="text-slate-400 dark:text-slate-500 print:text-slate-400">&rarr;</span>
            <span className={`min-w-0 flex-1 px-2.5 py-1 rounded border ${
              zugeordnet
                ? 'bg-slate-50 dark:bg-slate-800 print:bg-slate-50 border-slate-200 dark:border-slate-700 print:border-slate-300 text-slate-800 dark:text-slate-200 print:text-black'
                : 'border-dashed border-slate-300 dark:border-slate-600 print:border-slate-300 text-slate-400 dark:text-slate-500 italic'
            }`}>
              {zugeordnet || 'nicht zugeordnet'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function RichtigFalschAntwortAnzeige({ bewertungen }: { bewertungen: Record<string, boolean> }) {
  const eintraege = Object.entries(bewertungen)
  if (eintraege.length === 0) {
    return <p className="text-sm text-slate-400 italic">Keine Bewertungen abgegeben</p>
  }
  return (
    <div className="flex flex-col gap-1">
      {eintraege.map(([id, wert]) => (
        <div key={id} className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium min-w-[2rem]">
            {id}.
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            wert
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 print:text-green-700'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 print:text-red-700'
          }`}>
            {wert ? 'Richtig' : 'Falsch'}
          </span>
        </div>
      ))}
    </div>
  )
}

function BerechnungAntwortAnzeige({ ergebnisse, rechenweg }: { ergebnisse: Record<string, string>; rechenweg?: string }) {
  const eintraege = Object.entries(ergebnisse)
  return (
    <div className="flex flex-col gap-2">
      {eintraege.length > 0 && (
        <div className="flex flex-col gap-1">
          {eintraege.map(([id, wert]) => (
            <div key={id} className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">
                Ergebnis {id}:
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200 print:text-black">
                {wert || '–'}
              </span>
            </div>
          ))}
        </div>
      )}
      {rechenweg && (
        <div className="bg-slate-50 dark:bg-slate-800 print:bg-slate-50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300">
          <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mb-1 font-medium">Rechenweg:</p>
          <p className="text-sm text-slate-800 dark:text-slate-200 print:text-black whitespace-pre-wrap">{rechenweg}</p>
        </div>
      )}
    </div>
  )
}
