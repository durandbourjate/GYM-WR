import { Star } from 'lucide-react'

/**
 * C9 Phase 3 Task 24 — Editor-Preview für KI-Musterlösungs-Responses.
 *
 * Rendert das normalisierte Ergebnis aus `generiereMusterloesung` (Backend Task 22,
 * Frontend-Normalizer Task 23) und lässt die LP pro Teilerklärung entscheiden, ob
 * der KI-Text in `frage.<feld>[i].erklaerung` übernommen wird.
 *
 * Design-Entscheidungen (Spec §12 + Plan Step 24.5):
 *  - Default-Policy: KI-Text wird NUR in leere Felder übernommen. Wenn bereits eine
 *    LP-gepflegte Erklärung existiert, ist die Checkbox unchecked + Hinweis sichtbar.
 *  - Pro-Zeile-Override: LP kann Checkbox manuell aktivieren → überschreibt existierende
 *    Erklärung. Oder den vorgeschlagenen Text inline anpassen.
 *  - Halluzinierte IDs (nicht im Sub-Array der aktuellen Frage) werden angezeigt aber
 *    können NICHT übernommen werden (Checkbox disabled).
 */
import { useMemo, useState } from 'react'
import {
  normalisiereMusterloesungsAntwort,
  type MusterloesungsTeilerklaerung,
} from '../musterloesungNormalizer'

export interface KIMusterloesungPreviewPayload {
  musterloesung: string
  teilerklaerungen: MusterloesungsTeilerklaerung[]
}

export interface KIMusterloesungPreviewProps {
  /** Rohes Daten-Objekt aus `ki.ergebnisse.generiereMusterloesung?.daten`. */
  rawDaten: unknown
  /**
   * Map von Sub-Element-ID zu Anzeige-Info. Fehlen Einträge, gilt die Teilerklärung
   * als halluziniert (Checkbox disabled). Wenn bestehendeErklaerung gesetzt → unchecked default.
   */
  elementeInfo?: Record<string, { label: string; bestehendeErklaerung: string }>
  onUebernehmen: (payload: KIMusterloesungPreviewPayload) => void
  onVerwerfen: () => void
  /** Stern-Toggle (Kalibrierung-Feedback). */
  wichtig?: boolean
  onWichtigToggle?: () => void
}

interface TeilerklaerungState {
  feld: MusterloesungsTeilerklaerung['feld']
  id: string
  text: string
  uebernehmen: boolean
  /** true wenn die ID nicht in elementeInfo ist — Zeile disabled. */
  halluziniert: boolean
  /** true wenn für diese ID bereits eine LP-Erklärung existiert. */
  lpGepflegt: boolean
}

export function KIMusterloesungPreview({
  rawDaten,
  elementeInfo = {},
  onUebernehmen,
  onVerwerfen,
  wichtig,
  onWichtigToggle,
}: KIMusterloesungPreviewProps) {
  const normalisiert = useMemo(() => normalisiereMusterloesungsAntwort(rawDaten), [rawDaten])

  const [musterloesung, setMusterloesung] = useState(normalisiert.musterloesung)
  const [teilerklaerungen, setTeilerklaerungen] = useState<TeilerklaerungState[]>(() =>
    normalisiert.teilerklaerungen.map((t) => {
      const info = elementeInfo[t.id]
      const halluziniert = !info
      const lpGepflegt = !!(info && info.bestehendeErklaerung.trim().length > 0)
      return {
        feld: t.feld,
        id: t.id,
        text: t.text,
        uebernehmen: !halluziniert && !lpGepflegt,
        halluziniert,
        lpGepflegt,
      }
    }),
  )

  function setZeile(i: number, patch: Partial<TeilerklaerungState>) {
    setTeilerklaerungen((prev) => prev.map((z, idx) => (idx === i ? { ...z, ...patch } : z)))
  }

  function handleUebernehmen() {
    onUebernehmen({
      musterloesung,
      teilerklaerungen: teilerklaerungen
        .filter((z) => z.uebernehmen)
        .map(({ feld, id, text }) => ({ feld, id, text })),
    })
  }

  return (
    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg space-y-3">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        KI-Vorschlag
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Musterlösung
        </span>
        <textarea
          value={musterloesung}
          onChange={(e) => setMusterloesung(e.target.value)}
          rows={3}
          className="input-field resize-y text-sm"
          aria-label="Musterlösung"
        />
      </label>

      {teilerklaerungen.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Teilerklärungen pro Sub-Element
          </div>
          <ul className="space-y-2">
            {teilerklaerungen.map((z, i) => {
              const info = elementeInfo[z.id]
              const label = info?.label ?? z.id
              const uebernehmenLabel = `übernehmen: ${label}`
              const teilLabel = `Teilerklärung ${label}`
              return (
                <li
                  key={z.id}
                  className={`flex gap-2 items-start p-2 rounded border ${
                    z.halluziniert
                      ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={z.uebernehmen}
                    disabled={z.halluziniert}
                    onChange={(e) => setZeile(i, { uebernehmen: e.target.checked })}
                    aria-label={uebernehmenLabel}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {label}
                    </div>
                    <input
                      type="text"
                      value={z.text}
                      onChange={(e) => setZeile(i, { text: e.target.value })}
                      aria-label={teilLabel}
                      className="input-field text-xs w-full"
                    />
                    {z.lpGepflegt && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                        Bereits vorhandene Erklärung (LP-gepflegt): «{info?.bestehendeErklaerung}»
                      </div>
                    )}
                    {z.halluziniert && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400">
                        ID nicht in aktueller Frage — kann nicht übernommen werden.
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="flex gap-2 pt-1 items-center">
        <button
          type="button"
          onClick={handleUebernehmen}
          title="Ausgewählte Teile in die Frage übernehmen"
          className="px-3 py-1 text-xs font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Übernehmen
        </button>
        <button
          type="button"
          onClick={onVerwerfen}
          title="Vorschlag verwerfen"
          className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          Verwerfen
        </button>
        {onWichtigToggle && (
          <button
            type="button"
            onClick={onWichtigToggle}
            className={
              wichtig
                ? 'text-amber-500 hover:text-amber-600 text-lg leading-none cursor-pointer'
                : 'text-slate-400 hover:text-amber-400 text-lg leading-none cursor-pointer'
            }
            title={
              wichtig
                ? 'Als wichtiges Trainings-Beispiel markiert (Klick = entfernen)'
                : 'Als wichtig markieren — fliesst priorisiert in künftige KI-Vorschläge'
            }
            aria-label={wichtig ? 'Stern entfernen' : 'Als wichtig markieren'}
          >
            <Star className={`w-5 h-5 ${wichtig ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
