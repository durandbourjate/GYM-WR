import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { BildbeschriftungFrage as BildbeschriftungFrageType, BildbeschriftungLabel } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { toAssetUrl } from '../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'
import { ZoneLabel } from '@shared/ui/ZoneLabel'

interface Props {
  frage: BildbeschriftungFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function BildbeschriftungFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <BildbeschriftungLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <BildbeschriftungAufgabe frage={frage} />
}

function BildbeschriftungAufgabe({ frage }: { frage: BildbeschriftungFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const bildQuelle = ermittleBildQuelle(frage)

  const eintraege: Record<string, string> =
    antwort?.typ === 'bildbeschriftung' ? antwort.eintraege : {}

  function handleEingabe(beschriftungId: string, text: string) {
    if (disabled) return
    const neueEintraege = { ...eintraege, [beschriftungId]: text }
    onAntwort({ typ: 'bildbeschriftung', eintraege: neueEintraege })
  }

  const alleAusgefuellt = (frage.beschriftungen ?? []).every(b => (eintraege[b.id] ?? '').trim() !== '')

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
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {(frage.beschriftungen ?? []).length} {(frage.beschriftungen ?? []).length === 1 ? 'Label' : 'Labels'}
        </span>
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Bild mit Labels — feste Container-Breite, damit SVGs ohne explizite width-Attribute
          (nur viewBox) sichtbar sind statt auf 0 zu kollabieren */}
      <div className={`relative block w-full max-w-2xl ${!disabled && !alleAusgefuellt ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`}>
        <div className="relative overflow-hidden w-full">
          {bildQuelle && (
            <img
              src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)}
              alt="Bildbeschriftung"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          )}

          {/* Label-Eingabefelder */}
          {(frage.beschriftungen ?? []).map((beschriftung, i) => (
            <div
              key={beschriftung.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${beschriftung.position.x}%`,
                top: `${beschriftung.position.y}%`,
              }}
            >
              {/* Nummern-Marker */}
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shadow-md z-10">
                {i + 1}
              </div>
              <input
                type="text"
                value={eintraege[beschriftung.id] ?? ''}
                onChange={(e) => handleEingabe(beschriftung.id, e.target.value)}
                disabled={disabled}
                placeholder={`Label ${i + 1}`}
                className={`min-w-[120px] max-w-[220px] w-auto px-2 py-1 text-sm rounded border shadow-sm
                  bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                  border-slate-300 dark:border-slate-600
                  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
                  ${disabled ? 'opacity-75 cursor-not-allowed' : ''}
                `}
              />
            </div>
          ))}
        </div>
      </div>

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

function istLabelKorrekt(label: BildbeschriftungLabel, eingabe: string): boolean {
  const trimmed = eingabe.trim()
  if (!trimmed) return false
  const korrekt = Array.isArray(label.korrekt) ? label.korrekt : []
  if (korrekt.length === 0) return false
  return korrekt.some(ka => trimmed.toLowerCase() === ka.trim().toLowerCase())
}

function BildbeschriftungLoesung({ frage, antwort }: { frage: BildbeschriftungFrageType; antwort: Antwort | null }) {
  const bildQuelle = ermittleBildQuelle(frage)
  const eintraege: Record<string, string> =
    antwort?.typ === 'bildbeschriftung' ? antwort.eintraege : {}

  const beschriftungen = frage.beschriftungen ?? []

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

      {/* Bild mit positionierten ZoneLabels */}
      <div className="relative block w-full max-w-2xl">
        <div className="relative overflow-hidden w-full">
          {bildQuelle && (
            <img
              src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)}
              alt="Bildbeschriftung"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          )}

          {beschriftungen.map((b, i) => {
            const eingabe = eintraege[b.id] ?? ''
            const istKorrekt = istLabelKorrekt(b, eingabe)
            const korrekteAntwort = b.korrekt?.[0] ?? ''
            return (
              <div
                key={b.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${b.position.x}%`, top: `${b.position.y}%` }}
              >
                {/* Nummern-Marker */}
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shadow-md z-10">
                  {i + 1}
                </div>
                <ZoneLabel
                  variant={istKorrekt ? 'korrekt' : 'falsch'}
                  susAntwort={eingabe || undefined}
                  korrekteAntwort={korrekteAntwort}
                  placeholder="leer gelassen"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Erklärungen pro Beschriftung */}
      {beschriftungen.some(b => !!b.erklaerung) && (
        <div className="flex flex-col gap-2">
          {beschriftungen.map((b, i) => {
            if (!b.erklaerung) return null
            return (
              <div
                key={b.id}
                className="pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400"
              >
                {'\u{1F4A1}'} <strong>Label {i + 1}:</strong> {b.erklaerung}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
