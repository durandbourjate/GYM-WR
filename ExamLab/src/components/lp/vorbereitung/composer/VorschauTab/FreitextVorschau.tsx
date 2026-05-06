import type { FreitextFrage } from '../../../../../types/fragen-storage'

export default function FreitextVorschau({ frage }: { frage: FreitextFrage }) {
  const zeilen = frage.laenge === 'kurz' ? 3 : frage.laenge === 'lang' ? 10 : 5
  return (
    <textarea
      disabled
      placeholder={frage.hilfstextPlaceholder || 'Antwort eingeben...'}
      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 resize-none"
      rows={zeilen}
    />
  )
}
