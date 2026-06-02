import { useCallback } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { HotspotFrage as HotspotFrageType } from '../../types/fragen-storage'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { toAssetUrl } from '../../utils/assetUrl.ts'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'
import { istZoneWohlgeformt } from '../../utils/zonen/migriereZone.ts'
import { istPunktInPolygon } from '../../utils/zonen/polygon.ts'
import { useSrAnsage } from '../../hooks/a11y/useSrAnsage.ts'
import { boundingBox, zentroid, positionsPhrase } from '../../utils/a11y/bildPosition.ts'

interface Props {
  frage: HotspotFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function HotspotFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  // Error-Boundary: Zonen müssen im neuen Format (punkte[]) vorliegen
  const zonenUngueltig =
    Array.isArray(frage.bereiche) && frage.bereiche.length > 0 &&
    frage.bereiche.some(b => !istZoneWohlgeformt(b))
  if (zonenUngueltig) {
    return (
      <div className="p-4 rounded border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
        Diese Frage konnte nicht geladen werden. Bitte LP informieren.
      </div>
    )
  }
  if (modus === 'loesung') {
    return <HotspotLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <HotspotAufgabe frage={frage} />
}

function HotspotAufgabe({ frage }: { frage: HotspotFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const bildQuelle = ermittleBildQuelle(frage)
  const { ansage, ansageText } = useSrAnsage()

  const geklickt: { x: number; y: number }[] =
    antwort?.typ === 'hotspot' ? antwort.klicks : []

  /** Shared placement logic — used by mouse handler and keyboard region buttons. */
  const setzeMarker = useCallback((pos: { x: number; y: number }) => {
    if (disabled) return
    let neueKlicks: { x: number; y: number }[]
    if (frage.mehrfachauswahl) {
      neueKlicks = [...geklickt, pos]
    } else {
      neueKlicks = [pos]
    }
    onAntwort({ typ: 'hotspot', klicks: neueKlicks })
  }, [disabled, frage.mehrfachauswahl, geklickt, onAntwort])

  const handleKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setzeMarker({ x, y })
  }, [disabled, setzeMarker])

  function handleZuruecksetzen() {
    if (disabled) return
    onAntwort({ typ: 'hotspot', klicks: [] })
  }

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
        {frage.mehrfachauswahl && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            Mehrfachauswahl
          </span>
        )}
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Bild mit Klickbereichen — feste Container-Breite, damit SVGs ohne explizite width-Attribute
          (nur viewBox) sichtbar sind statt auf 0 zu kollabieren */}
      <div className={`relative block w-full max-w-2xl ${!disabled && geklickt.length === 0 ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`}>
        <div
          className={`relative overflow-hidden w-full ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-crosshair'}`}
          onClick={handleKlick}
        >
          {bildQuelle && (
            <img
              src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)}
              alt="Hotspot-Bild"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          )}

          {/* Klick-Marker */}
          {geklickt.map((pos, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-800 shadow-md pointer-events-none"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            />
          ))}

          {/* SR-Pfad: transparente fokussierbare Region-Buttons — pointer-events:none damit
              Mausklicks auf das Bild fallen. Keyboard-Fokus + onKeyDown bleiben aktiv. */}
          {(frage.bereiche ?? []).map((b, i) => {
            const bb = boundingBox(b.punkte ?? [])
            const c = zentroid(b.punkte ?? [])
            const n = (frage.bereiche ?? []).length
            return (
              <button
                key={b.id}
                type="button"
                aria-label={`Bereich ${i + 1} von ${n}, ${positionsPhrase(c)}`}
                disabled={disabled}
                tabIndex={0}
                className="absolute bg-transparent border-0 p-0 m-0 focus:outline-2 focus:outline-violet-500"
                style={{
                  left: `${bb.x}%`,
                  top: `${bb.y}%`,
                  width: `${bb.breite}%`,
                  height: `${bb.hoehe}%`,
                  minWidth: '44px',
                  minHeight: '44px',
                  pointerEvents: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setzeMarker(c)
                    ansage(frage.mehrfachauswahl
                      ? `Markierung ${geklickt.length + 1} gesetzt`
                      : 'Markierung gesetzt')
                  }
                }}
              />
            )
          })}
        </div>
      </div>

      {/* SR aria-live-Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ansageText}</div>

      {/* Zuruecksetzen-Button */}
      {!disabled && geklickt.length > 0 && (
        <button
          onClick={handleZuruecksetzen}
          className="self-start px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
        >
          Auswahl zurucksetzen
        </button>
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

function HotspotLoesung({ frage, antwort }: { frage: HotspotFrageType; antwort: Antwort | null }) {
  const bildQuelle = ermittleBildQuelle(frage)
  const klicks: { x: number; y: number }[] =
    antwort?.typ === 'hotspot' ? antwort.klicks : []

  // Pool-Import-Konvention: punktzahl > 0 = korrekter Bereich. Wenn alle punktzahl > 0,
  // gibt es keine Distraktoren und alle gelten als korrekt.
  const bereiche = Array.isArray(frage.bereiche) ? frage.bereiche : []
  const punkteBereiche = bereiche.filter(b => (b.punktzahl ?? 0) > 0)
  const korrekteBereiche = punkteBereiche.length > 0 ? punkteBereiche : bereiche
  const korrekteIds = new Set(korrekteBereiche.map(b => b.id))

  // Pro Klick: getroffen? Welcher Bereich?
  const klickStatus = klicks.map((k) => {
    const getroffenerBereich = bereiche.find(b => istPunktInPolygon(k, b.punkte ?? []))
    const istKorrekt = getroffenerBereich != null && korrekteIds.has(getroffenerBereich.id)
    return { klick: k, istKorrekt }
  })

  // Pro Bereich: wurde getroffen?
  const bereichStatus = new Map<string, boolean>()
  for (const b of bereiche) {
    bereichStatus.set(b.id, klicks.some(k => istPunktInPolygon(k, b.punkte ?? [])))
  }

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

      {/* Bild mit Polygon-Overlay (SVG) + Klick-Markern */}
      <div className="relative block w-full max-w-2xl">
        <div className="relative overflow-hidden w-full">
          {bildQuelle && (
            <img
              src={mediaQuelleZuImgSrc(bildQuelle, toAssetUrl)}
              alt="Hotspot-Bild"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          )}

          {/* SVG-Overlay: Polygone + Klick-Kreise. viewBox 0-100 weil Koordinaten in Prozent */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {bereiche.map((b) => {
              const istKorrekt = korrekteIds.has(b.id)
              const getroffen = bereichStatus.get(b.id) === true
              // Korrekt & getroffen -> satt grün
              // Korrekt & verpasst -> gestricheltes grün
              // Distraktor -> grau
              const stroke = istKorrekt ? (getroffen ? '#16a34a' : '#16a34a') : '#64748b'
              const fill = istKorrekt ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.1)'
              const points = (b.punkte ?? []).map(p => `${p.x},${p.y}`).join(' ')
              return (
                <polygon
                  key={b.id}
                  points={points}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={0.5}
                  strokeDasharray={istKorrekt && !getroffen ? '2,1.5' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
            {klickStatus.map((k, i) => (
              <circle
                key={i}
                cx={k.klick.x}
                cy={k.klick.y}
                r={1.6}
                fill={k.istKorrekt ? '#16a34a' : '#dc2626'}
                stroke="white"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
                data-klick-status={k.istKorrekt ? 'korrekt' : 'falsch'}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Bereich-Liste mit Status + Erklärungen */}
      <div className="flex flex-col gap-2">
        {bereiche.map((b) => {
          const istKorrekt = korrekteIds.has(b.id)
          const getroffen = bereichStatus.get(b.id) === true
          let status: 'getroffen' | 'verpasst' | 'falsch-getroffen' | 'distraktor-ignoriert'
          if (istKorrekt && getroffen) status = 'getroffen'
          else if (istKorrekt && !getroffen) status = 'verpasst'
          else if (!istKorrekt && getroffen) status = 'falsch-getroffen'
          else status = 'distraktor-ignoriert'

          const rahmen =
            status === 'getroffen'
              ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
              : status === 'verpasst' || status === 'falsch-getroffen'
                ? 'border-red-600 bg-red-50 dark:bg-red-950/20'
                : 'border-slate-300 dark:border-slate-600'

          const statusText =
            status === 'getroffen'
              ? '\u2713 Getroffen'
              : status === 'verpasst'
                ? '\u2717 Nicht getroffen'
                : status === 'falsch-getroffen'
                  ? '\u2717 Faelschlicherweise geklickt'
                  : '\u2013 Nicht korrekt (richtigerweise ignoriert)'

          const statusColor =
            status === 'getroffen'
              ? 'text-green-700 dark:text-green-400'
              : status === 'verpasst' || status === 'falsch-getroffen'
                ? 'text-red-700 dark:text-red-400'
                : 'text-slate-600 dark:text-slate-400'

          return (
            <div
              key={b.id}
              data-bereich-id={b.id}
              data-status={status}
              className={`p-3 rounded-lg border-2 ${rahmen}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800 dark:text-slate-100">{b.label}</span>
                <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
              </div>
              {b.erklaerung && (
                <div className="mt-1.5 pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400">
                  {'\u{1F4A1}'} {b.erklaerung}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
