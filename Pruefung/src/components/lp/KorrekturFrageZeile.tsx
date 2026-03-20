import type { FragenBewertung } from '../../types/korrektur.ts'
import { effektivePunkte, quelleLabel } from '../../utils/korrekturUtils.ts'
import AudioRecorder from '../AudioRecorder.tsx'

interface Props {
  frageId: string
  fragetext: string
  fragenTyp: string
  antwortText: string
  bewertung: FragenBewertung
  onUpdate: (updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null }) => void
  onAudioUpload: (frageId: string, blob: Blob) => Promise<string | null>
}

/** Farbe für Quelle-Badge */
function quelleFarbe(quelle: FragenBewertung['quelle']): string {
  switch (quelle) {
    case 'auto': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    case 'ki': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'manuell': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'fehler': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }
}

/** Farbe für Fragentyp-Badge */
function fragenTypFarbe(typ: string): string {
  switch (typ) {
    case 'mc':
    case 'richtigfalsch':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    case 'freitext':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }
}

export default function KorrekturFrageZeile({
  frageId,
  fragetext,
  fragenTyp,
  antwortText,
  bewertung,
  onUpdate,
  onAudioUpload,
}: Props) {
  const aktuellePunkte = effektivePunkte(bewertung)
  const hatKiErgebnis = bewertung.quelle === 'ki' || bewertung.quelle === 'auto'

  // Wert im Eingabefeld: LP-Anpassung > KI-Vorschlag > leer
  const punkteWert = bewertung.lpPunkte ?? bewertung.kiPunkte ?? ''

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      bewertung.geprueft
        ? 'border-green-200 bg-green-50/30 dark:border-green-800/40 dark:bg-green-900/10'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
    }`}>
      {/* Zeile 1: ID, Typ, Quelle, Max-Punkte */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
          {frageId}
        </span>
        <span className={`inline-block px-1.5 py-0.5 text-xs rounded font-medium ${fragenTypFarbe(fragenTyp)}`}>
          {fragenTyp}
        </span>
        <span className={`inline-block px-1.5 py-0.5 text-xs rounded font-medium ${quelleFarbe(bewertung.quelle)}`}>
          {quelleLabel(bewertung.quelle)}
        </span>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          max. {bewertung.maxPunkte} Pkt.
        </span>
      </div>

      {/* Zeile 2: Fragetext (gekürzt) */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate" title={fragetext}>
        {fragetext}
      </p>

      {/* Zeile 3: Schülerantwort */}
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mb-3">
        <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-4 whitespace-pre-wrap">
          {antwortText || <span className="italic text-slate-400 dark:text-slate-500">Keine Antwort</span>}
        </p>
      </div>

      {/* Zeile 4: KI-Ergebnis (nur bei ki/auto) */}
      {hatKiErgebnis && bewertung.kiPunkte !== null && (
        <div className="mb-3 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">
              KI: {bewertung.kiPunkte}/{bewertung.maxPunkte} Pkt.
            </span>
            {bewertung.kiBegruendung && (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic truncate">
                {bewertung.kiBegruendung}
              </span>
            )}
          </div>
          {bewertung.kiFeedback && (
            <div className="rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/50 dark:border-amber-700/30 px-3 py-1.5">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {bewertung.kiFeedback}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Zeile 5: LP-Override */}
      <div className="flex flex-wrap items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        {/* Punkte-Eingabe */}
        <div className="flex items-center gap-1.5">
          <label htmlFor={`punkte-${frageId}`} className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Punkte:
          </label>
          <input
            id={`punkte-${frageId}`}
            type="number"
            min={0}
            max={bewertung.maxPunkte}
            step={0.5}
            value={punkteWert}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onUpdate({ lpPunkte: null })
              } else {
                const val = parseFloat(raw)
                if (!isNaN(val) && val >= 0 && val <= bewertung.maxPunkte) {
                  onUpdate({ lpPunkte: val })
                }
              }
            }}
            className="w-16 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-800 dark:text-slate-100 tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
          />
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            / {bewertung.maxPunkte}
          </span>
        </div>

        {/* Effektive Punkte Anzeige */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">=</span>
          <span className={`text-sm font-semibold tabular-nums ${
            aktuellePunkte === bewertung.maxPunkte
              ? 'text-green-600 dark:text-green-400'
              : aktuellePunkte === 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-700 dark:text-slate-200'
          }`}>
            {aktuellePunkte} Pkt.
          </span>
        </div>

        {/* Geprüft-Checkbox */}
        <label className="flex items-center gap-1.5 ml-auto cursor-pointer select-none">
          <input
            type="checkbox"
            checked={bewertung.geprueft}
            onChange={(e) => onUpdate({ geprueft: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 dark:bg-slate-700 cursor-pointer"
          />
          <span className="text-xs text-slate-600 dark:text-slate-300">Geprüft</span>
        </label>
      </div>

      {/* Kommentar */}
      <div className="mt-2">
        <textarea
          rows={2}
          value={bewertung.lpKommentar ?? ''}
          placeholder="Kommentar für SuS..."
          onChange={(e) => onUpdate({ lpKommentar: e.target.value || null })}
          className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 resize-none"
        />
      </div>

      {/* Audio-Kommentar */}
      <div className="mt-2">
        <AudioRecorder
          bestehendeAudioId={bewertung.audioKommentarId}
          kompakt
          onSpeichern={async (blob) => {
            const driveId = await onAudioUpload(frageId, blob)
            if (driveId) {
              onUpdate({ audioKommentarId: driveId })
            }
          }}
        />
      </div>
    </div>
  )
}
