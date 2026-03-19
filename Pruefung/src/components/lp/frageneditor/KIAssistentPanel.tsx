import { useState, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import type { MCOption } from '../../../types/fragen.ts'
import type { FrageTyp } from './editorUtils.ts'
import type { Fachbereich, BloomStufe } from '../../../types/fragen.ts'

type AktionKey = 'generiereFragetext' | 'verbessereFragetext' | 'pruefeMusterloesung' | 'generiereOptionen'

interface AktionErgebnis {
  daten: Record<string, unknown> | null
  fehler: string | null
}

/** Hook: KI-Assistent-Logik (API-Aufrufe, Lade-/Ergebnisstatus) */
export function useKIAssistent() {
  const user = useAuthStore((s) => s.user)
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

  const verfuegbar = apiService.istKonfiguriert()

  return { ladeAktion, ergebnisse, ausfuehren, verwerfen, verfuegbar }
}

// === Inline KI-Buttons für einzelne Abschnitte ===

interface KIFragetextButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  typ: FrageTyp
  fachbereich: Fachbereich
  thema: string
  unterthema: string
  bloom: BloomStufe
  fragetext: string
  onSetFragetext: (text: string) => void
  onSetMusterlosung: (text: string) => void
}

/** Inline-Buttons "Generieren" und "Verbessern" neben dem Fragetext */
export function KIFragetextButtons({
  ki, typ, fachbereich, thema, unterthema, bloom, fragetext,
  onSetFragetext, onSetMusterlosung,
}: KIFragetextButtonsProps) {
  if (!ki.verfuegbar) return null

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mt-2">
        <InlineAktionButton
          label="Generieren"
          hinweis={!thema.trim() ? 'Thema nötig' : undefined}
          disabled={!thema.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'generiereFragetext'}
          onClick={() => ki.ausfuehren('generiereFragetext', { fachbereich, thema, unterthema, typ, bloom })}
        />
        <InlineAktionButton
          label="Verbessern"
          hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'verbessereFragetext'}
          onClick={() => ki.ausfuehren('verbessereFragetext', { fragetext })}
        />
      </div>

      {ki.ergebnisse.generiereFragetext && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.generiereFragetext}
          vorschauKey="fragetext"
          zusatzKey="musterlosung"
          onUebernehmen={() => {
            const d = ki.ergebnisse.generiereFragetext?.daten
            if (d) {
              if (typeof d.fragetext === 'string') onSetFragetext(d.fragetext)
              if (typeof d.musterlosung === 'string') onSetMusterlosung(d.musterlosung)
            }
            ki.verwerfen('generiereFragetext')
          }}
          onVerwerfen={() => ki.verwerfen('generiereFragetext')}
        />
      )}

      {ki.ergebnisse.verbessereFragetext && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.verbessereFragetext}
          vorschauKey="fragetext"
          zusatzKey="aenderungen"
          onUebernehmen={() => {
            const d = ki.ergebnisse.verbessereFragetext?.daten
            if (d && typeof d.fragetext === 'string') onSetFragetext(d.fragetext)
            ki.verwerfen('verbessereFragetext')
          }}
          onVerwerfen={() => ki.verwerfen('verbessereFragetext')}
        />
      )}
    </div>
  )
}

interface KIMusterlosungButtonProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  musterlosung: string
  onSetMusterlosung: (text: string) => void
}

/** Inline-Button "Prüfen" neben der Musterlösung */
export function KIMusterlosungButton({ ki, fragetext, musterlosung, onSetMusterlosung }: KIMusterlosungButtonProps) {
  if (!ki.verfuegbar) return null

  return (
    <div className="space-y-2">
      <div className="mt-2">
        <InlineAktionButton
          label="Prüfen"
          hinweis={!fragetext.trim() || !musterlosung.trim() ? 'Fragetext + Musterlösung nötig' : undefined}
          disabled={!fragetext.trim() || !musterlosung.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'pruefeMusterloesung'}
          onClick={() => ki.ausfuehren('pruefeMusterloesung', { fragetext, musterlosung })}
        />
      </div>

      {ki.ergebnisse.pruefeMusterloesung && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.pruefeMusterloesung}
          vorschauKey="bewertung"
          zusatzKey="verbesserteLosung"
          onUebernehmen={() => {
            const d = ki.ergebnisse.pruefeMusterloesung?.daten
            if (d && typeof d.verbesserteLosung === 'string') onSetMusterlosung(d.verbesserteLosung)
            ki.verwerfen('pruefeMusterloesung')
          }}
          onVerwerfen={() => ki.verwerfen('pruefeMusterloesung')}
        />
      )}
    </div>
  )
}

interface KIMCOptionenButtonProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  optionen: MCOption[]
  onSetOptionen: (optionen: MCOption[]) => void
}

/** Inline-Button "Optionen generieren" neben den MC-Optionen */
export function KIMCOptionenButton({ ki, fragetext, optionen, onSetOptionen }: KIMCOptionenButtonProps) {
  if (!ki.verfuegbar) return null

  return (
    <div className="space-y-2">
      <div className="mt-2">
        <InlineAktionButton
          label="Optionen generieren"
          hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'generiereOptionen'}
          onClick={() => ki.ausfuehren('generiereOptionen', { fragetext })}
        />
      </div>

      {ki.ergebnisse.generiereOptionen && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.generiereOptionen}
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
            const d = ki.ergebnisse.generiereOptionen?.daten
            if (d && Array.isArray(d.optionen)) {
              const neueOptionen: MCOption[] = (d.optionen as Array<{ text: string; korrekt: boolean }>).map((o, i) => ({
                id: String.fromCharCode(97 + i),
                text: o.text,
                korrekt: o.korrekt,
              }))
              const merged = neueOptionen.length >= optionen.length
                ? neueOptionen
                : [...neueOptionen, ...optionen.slice(neueOptionen.length)]
              onSetOptionen(merged)
            }
            ki.verwerfen('generiereOptionen')
          }}
          onVerwerfen={() => ki.verwerfen('generiereOptionen')}
        />
      )}
    </div>
  )
}

// === Hilfskomponenten ===

function InlineAktionButton({ label, hinweis, disabled, ladend, onClick }: {
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
        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer inline-flex items-center gap-1.5
          ${disabled
            ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
      >
        {ladend ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Wird generiert...</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </button>
      {hinweis && !ladend && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{hinweis}</p>
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
      {zusatzKey && typeof ergebnis.daten[zusatzKey] === 'string' && ergebnis.daten[zusatzKey] && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          {ergebnis.daten[zusatzKey] as string}
        </p>
      )}
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
