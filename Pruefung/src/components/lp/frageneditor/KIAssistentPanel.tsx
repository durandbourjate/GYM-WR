import { useState, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import type { MCOption } from '../../../types/fragen.ts'
import type { FrageTyp } from './editorUtils.ts'
import type { Fachbereich, BloomStufe } from '../../../types/fragen.ts'

interface Props {
  typ: FrageTyp
  fachbereich: Fachbereich
  thema: string
  unterthema: string
  bloom: BloomStufe
  fragetext: string
  musterlosung: string
  optionen: MCOption[]
  onSetFragetext: (text: string) => void
  onSetMusterlosung: (text: string) => void
  onSetOptionen: (optionen: MCOption[]) => void
}

type AktionKey = 'generiereFragetext' | 'verbessereFragetext' | 'pruefeMusterloesung' | 'generiereOptionen'

interface AktionErgebnis {
  daten: Record<string, unknown> | null
  fehler: string | null
}

/** Collapsible KI-Assistenz-Panel für den Frageneditor */
export default function KIAssistentPanel({
  typ, fachbereich, thema, unterthema, bloom,
  fragetext, musterlosung, optionen,
  onSetFragetext, onSetMusterlosung, onSetOptionen,
}: Props) {
  const user = useAuthStore((s) => s.user)
  const [offen, setOffen] = useState(false)
  const [ladeAktion, setLadeAktion] = useState<AktionKey | null>(null)
  const [ergebnisse, setErgebnisse] = useState<Partial<Record<AktionKey, AktionErgebnis>>>({})

  const ausfuehren = useCallback(async (aktion: AktionKey, daten: Record<string, unknown>) => {
    if (!user?.email) return
    setLadeAktion(aktion)
    setErgebnisse((prev) => ({ ...prev, [aktion]: undefined }))

    try {
      const result = await apiService.kiAssistent(user.email, aktion, daten)
      if (!result) {
        setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: null, fehler: 'Keine Antwort vom Server' } }))
      } else if ('error' in result && typeof result.error === 'string') {
        setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: null, fehler: result.error as string } }))
      } else {
        setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: result, fehler: null } }))
      }
    } catch {
      setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: null, fehler: 'Netzwerkfehler' } }))
    } finally {
      setLadeAktion(null)
    }
  }, [user?.email])

  function verwerfen(aktion: AktionKey): void {
    setErgebnisse((prev) => {
      const neu = { ...prev }
      delete neu[aktion]
      return neu
    })
  }

  if (!apiService.istKonfiguriert()) return null

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Toggle-Header */}
      <button
        onClick={() => setOffen(!offen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
      >
        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <span>KI-Assistent</span>
          <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500">
            Claude-Hilfe beim Fragenschreiben
          </span>
        </h3>
        <span className="text-slate-400 dark:text-slate-500 text-sm">
          {offen ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {offen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Fragetext generieren */}
          <AktionButton
            label="Fragetext generieren"
            hinweis={!thema.trim() ? 'Thema muss ausgefüllt sein' : undefined}
            disabled={!thema.trim() || ladeAktion !== null}
            ladend={ladeAktion === 'generiereFragetext'}
            onClick={() => ausfuehren('generiereFragetext', { fachbereich, thema, unterthema, typ, bloom })}
          />
          {ergebnisse.generiereFragetext && (
            <ErgebnisAnzeige
              ergebnis={ergebnisse.generiereFragetext}
              vorschauKey="fragetext"
              zusatzKey="musterlosung"
              onUebernehmen={() => {
                const d = ergebnisse.generiereFragetext?.daten
                if (d) {
                  if (typeof d.fragetext === 'string') onSetFragetext(d.fragetext)
                  if (typeof d.musterlosung === 'string') onSetMusterlosung(d.musterlosung)
                }
                verwerfen('generiereFragetext')
              }}
              onVerwerfen={() => verwerfen('generiereFragetext')}
            />
          )}

          {/* Fragetext verbessern */}
          <AktionButton
            label="Fragetext verbessern"
            hinweis={!fragetext.trim() ? 'Fragetext muss ausgefüllt sein' : undefined}
            disabled={!fragetext.trim() || ladeAktion !== null}
            ladend={ladeAktion === 'verbessereFragetext'}
            onClick={() => ausfuehren('verbessereFragetext', { fragetext })}
          />
          {ergebnisse.verbessereFragetext && (
            <ErgebnisAnzeige
              ergebnis={ergebnisse.verbessereFragetext}
              vorschauKey="fragetext"
              zusatzKey="aenderungen"
              onUebernehmen={() => {
                const d = ergebnisse.verbessereFragetext?.daten
                if (d && typeof d.fragetext === 'string') onSetFragetext(d.fragetext)
                verwerfen('verbessereFragetext')
              }}
              onVerwerfen={() => verwerfen('verbessereFragetext')}
            />
          )}

          {/* Musterlösung prüfen */}
          <AktionButton
            label="Musterlösung prüfen"
            hinweis={!fragetext.trim() || !musterlosung.trim() ? 'Fragetext + Musterlösung nötig' : undefined}
            disabled={!fragetext.trim() || !musterlosung.trim() || ladeAktion !== null}
            ladend={ladeAktion === 'pruefeMusterloesung'}
            onClick={() => ausfuehren('pruefeMusterloesung', { fragetext, musterlosung })}
          />
          {ergebnisse.pruefeMusterloesung && (
            <ErgebnisAnzeige
              ergebnis={ergebnisse.pruefeMusterloesung}
              vorschauKey="bewertung"
              zusatzKey="verbesserteLosung"
              onUebernehmen={() => {
                const d = ergebnisse.pruefeMusterloesung?.daten
                if (d && typeof d.verbesserteLosung === 'string') onSetMusterlosung(d.verbesserteLosung)
                verwerfen('pruefeMusterloesung')
              }}
              onVerwerfen={() => verwerfen('pruefeMusterloesung')}
            />
          )}

          {/* MC-Optionen generieren (nur bei MC-Typ) */}
          {typ === 'mc' && (
            <>
              <AktionButton
                label="MC-Optionen generieren"
                hinweis={!fragetext.trim() ? 'Fragetext muss ausgefüllt sein' : undefined}
                disabled={!fragetext.trim() || ladeAktion !== null}
                ladend={ladeAktion === 'generiereOptionen'}
                onClick={() => ausfuehren('generiereOptionen', { fragetext })}
              />
              {ergebnisse.generiereOptionen && (
                <ErgebnisAnzeige
                  ergebnis={ergebnisse.generiereOptionen}
                  vorschauKey="optionen"
                  renderVorschau={(daten) => {
                    const opts = daten.optionen as Array<{ text: string; korrekt: boolean }> | undefined
                    if (!Array.isArray(opts)) return null
                    return (
                      <ul className="space-y-1">
                        {opts.map((o, i) => (
                          <li key={i} className={`text-sm px-2 py-1 rounded ${o.korrekt ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-300'}`}>
                            {o.korrekt ? '\u2713 ' : '\u2717 '}{o.text}
                          </li>
                        ))}
                      </ul>
                    )
                  }}
                  onUebernehmen={() => {
                    const d = ergebnisse.generiereOptionen?.daten
                    if (d && Array.isArray(d.optionen)) {
                      const neueOptionen: MCOption[] = (d.optionen as Array<{ text: string; korrekt: boolean }>).map((o, i) => ({
                        id: String.fromCharCode(97 + i), // a, b, c, d
                        text: o.text,
                        korrekt: o.korrekt,
                      }))
                      // Bestehende Optionen beibehalten falls mehr als generiert
                      const merged = neueOptionen.length >= optionen.length
                        ? neueOptionen
                        : [...neueOptionen, ...optionen.slice(neueOptionen.length)]
                      onSetOptionen(merged)
                    }
                    verwerfen('generiereOptionen')
                  }}
                  onVerwerfen={() => verwerfen('generiereOptionen')}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// === Hilfskomponenten ===

function AktionButton({ label, hinweis, disabled, ladend, onClick }: {
  label: string
  hinweis?: string
  disabled: boolean
  ladend: boolean
  onClick: () => void
}) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer
          ${disabled
            ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
      >
        {ladend ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Wird generiert...
          </span>
        ) : (
          <span>{label}</span>
        )}
      </button>
      {hinweis && !ladend && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 ml-1">{hinweis}</p>
      )}
    </div>
  )
}

function ErgebnisAnzeige({ ergebnis, vorschauKey, zusatzKey, renderVorschau, onUebernehmen, onVerwerfen }: {
  ergebnis: AktionErgebnis
  vorschauKey: string
  zusatzKey?: string
  renderVorschau?: (daten: Record<string, unknown>) => React.ReactNode
  onUebernehmen: () => void
  onVerwerfen: () => void
}) {
  if (ergebnis.fehler) {
    return (
      <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">{ergebnis.fehler}</p>
        <button onClick={onVerwerfen} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1 cursor-pointer">
          Schliessen
        </button>
      </div>
    )
  }

  if (!ergebnis.daten) return null

  return (
    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg space-y-2">
      {/* Benutzerdefinierte Vorschau oder Standard-Text */}
      {renderVorschau ? (
        renderVorschau(ergebnis.daten)
      ) : (
        <>
          {typeof ergebnis.daten[vorschauKey] === 'string' && (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {ergebnis.daten[vorschauKey] as string}
            </p>
          )}
          {typeof ergebnis.daten[vorschauKey] === 'boolean' && (
            <p className={`text-sm font-medium ${ergebnis.daten[vorschauKey] ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {ergebnis.daten[vorschauKey] ? 'Korrekt' : 'Verbesserung nötig'}
            </p>
          )}
        </>
      )}
      {/* Zusatzinfo */}
      {zusatzKey && typeof ergebnis.daten[zusatzKey] === 'string' && ergebnis.daten[zusatzKey] && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          {ergebnis.daten[zusatzKey] as string}
        </p>
      )}
      {/* Aktionen */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onUebernehmen}
          className="px-3 py-1 text-xs font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Übernehmen
        </button>
        <button
          onClick={onVerwerfen}
          className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          Verwerfen
        </button>
      </div>
    </div>
  )
}
