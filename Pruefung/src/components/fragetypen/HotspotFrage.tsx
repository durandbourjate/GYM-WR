import { useCallback } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { HotspotFrage as HotspotFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'

interface Props {
  frage: HotspotFrageType
}

export default function HotspotFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)

  const aktuelleAntwort = antworten[frage.id]
  const geklickt: { x: number; y: number }[] =
    aktuelleAntwort?.typ === 'hotspot' ? aktuelleAntwort.geklickt : []

  const handleKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (abgegeben) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    let neueKlicks: { x: number; y: number }[]
    if (frage.mehrfachauswahl) {
      neueKlicks = [...geklickt, { x, y }]
    } else {
      neueKlicks = [{ x, y }]
    }
    setAntwort(frage.id, { typ: 'hotspot', geklickt: neueKlicks })
  }, [abgegeben, frage.id, frage.mehrfachauswahl, geklickt, setAntwort])

  function handleZuruecksetzen() {
    if (abgegeben) return
    setAntwort(frage.id, { typ: 'hotspot', geklickt: [] })
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

      {/* Bild mit Klickbereichen */}
      <div className={`relative inline-block ${!abgegeben && geklickt.length === 0 ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`}>
        <div
          className={`relative ${abgegeben ? 'cursor-not-allowed opacity-75' : 'cursor-crosshair'}`}
          onClick={handleKlick}
        >
          <img
            src={frage.bildUrl}
            alt="Hotspot-Bild"
            className="max-w-full rounded-lg select-none"
            style={{ objectFit: 'contain' }}
            draggable={false}
          />

          {/* Klick-Marker */}
          {geklickt.map((pos, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-800 shadow-md pointer-events-none"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            />
          ))}
        </div>
      </div>

      {/* Zuruecksetzen-Button */}
      {!abgegeben && geklickt.length > 0 && (
        <button
          onClick={handleZuruecksetzen}
          className="self-start px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
        >
          Auswahl zurucksetzen
        </button>
      )}
    </div>
  )
}
