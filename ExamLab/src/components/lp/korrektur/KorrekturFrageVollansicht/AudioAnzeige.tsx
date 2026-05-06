import type { Antwort } from '../../../../types/antworten'
import AudioPlayer from '../../../AudioPlayer.tsx'
import { KeineAntwort } from './util'

/** Audio-Antwort */
export default function AudioAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'audio' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  const src = antwort.aufnahmeUrl
  if (!src) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
        Aufnahme ({antwort.dauer ? `${Math.round(antwort.dauer)}s` : '–'})
      </span>
      <AudioPlayer src={src} />
    </div>
  )
}
