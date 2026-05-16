import { AlertTriangle } from 'lucide-react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { AudioFrage as AudioFrageType } from '../../types/fragen-storage'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'

interface Props {
  frage: AudioFrageType
}

/**
 * SuS-Ansicht: Audio-Aufnahme-Fragetyp.
 *
 * S140: Aufnahme-/Upload-Funktionalität ist temporär deaktiviert. Grund: Base64-Audio
 * im Antwort-Payload sprengt das Google-Sheets-Zell-Limit (~50k Zeichen), was
 * speichereAntworten systematisch scheitern liess und zu verlorenen Abgaben führte.
 * Bestehende Aufnahmen (aus der Zeit vor der Deaktivierung) werden weiter abgespielt.
 * Wird nach der Backend-Migration auf Edge-Runtime reaktiviert.
 */
export default function AudioFrage({ frage }: Props) {
  const { antwort, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const bestehendeAufnahme = antwort?.typ === 'audio' ? antwort : null
  const audioUrl = bestehendeAufnahme?.aufnahmeUrl ?? null

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Info-Box: Audio temporär deaktiviert */}
      <div className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1 inline-flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Audio-Aufnahmen sind temporär deaktiviert
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Der Audio-Upload ist wegen einer geplanten Backend-Migration aktuell nicht verfügbar.
          Diese Frage wird bei der Bewertung übersprungen. Die Funktion kommt nach der Migration
          zurück.
        </p>
      </div>

      {/* Bestehende Aufnahme (falls vorhanden, z.B. aus früherer Prüfung) */}
      {audioUrl && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Bestehende Aufnahme:</p>
          <audio controls controlsList="nodownload noplaybackrate" src={audioUrl} className="w-full" preload="metadata" />
        </div>
      )}

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
