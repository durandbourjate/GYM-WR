import DOMPurify from 'dompurify'
import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Freitext-Antwort (B52: HTML korrekt rendern wenn formatiert) */
export default function FreitextAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'freitext' }> | undefined }) {
  if (!antwort?.text) return <KeineAntwort />
  const istHTML = antwort.formatierung === 'html' || antwort.text.includes('<p>')
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      {istHTML ? (
        <div
          className="text-sm text-slate-700 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(antwort.text) }}
        />
      ) : (
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{antwort.text}</p>
      )}
    </div>
  )
}
