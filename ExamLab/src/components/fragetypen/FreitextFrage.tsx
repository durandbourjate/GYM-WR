import { Suspense } from 'react'
import DOMPurify from 'dompurify'
import { lazyMitRetry } from '../../utils/lazyMitRetry.ts'
import type { FreitextFrage as FreitextFrageType } from '../../types/fragen-storage'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { MusterloesungsBlock } from '@shared/ui/MusterloesungsBlock'

// @tiptap (~40-70 kB) lebt ausschliesslich in FreitextAufgabe. Per lazyMitRetry
// wird dieser Editor ein eigener async-Chunk und erst geladen, wenn eine
// Freitext-Aufgabe interaktiv gerendert wird — statt synchron im Layout-Chunk
// (SuS-Prüfungsdurchführung) mitzureisen. lazyMitRetry kapselt Chunk-Reload nach
// Deploy (gecachtes index.html zeigt auf alte Hashes → einmaliger Reload).
const FreitextAufgabe = lazyMitRetry(() => import('./FreitextAufgabe.tsx'))

interface Props {
  frage: FreitextFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function FreitextFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <FreitextLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return (
    <Suspense fallback={<FreitextAufgabeLadeplatzhalter />}>
      <FreitextAufgabe frage={frage} />
    </Suspense>
  )
}

/** Platzhalter während der tiptap-Chunk lädt — gleiche min-height wie der Editor,
 *  damit beim Nachladen kein Layout-Sprung entsteht. */
function FreitextAufgabeLadeplatzhalter() {
  return (
    <div className="flex flex-col gap-4">
      <div className="tiptap-editor w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl min-h-[120px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
        <span className="text-sm text-slate-400 dark:text-slate-500">Editor wird geladen…</span>
      </div>
    </div>
  )
}

function FreitextLoesung({ frage, antwort }: { frage: FreitextFrageType; antwort: Antwort | null }) {
  const text = antwort?.typ === 'freitext' ? antwort.text : ''
  const selbstbewertung = antwort?.typ === 'freitext' ? antwort.selbstbewertung : undefined
  const istKorrekt = selbstbewertung === 'korrekt'
  const variant: 'korrekt' | 'falsch' = istKorrekt ? 'korrekt' : 'falsch'
  const rahmen = istKorrekt
    ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
    : 'border-red-600 bg-red-50 dark:bg-red-950/20'

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
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

      {/* SuS-Antwort in Read-Only-Rahmen */}
      <div className={`w-full border-2 rounded-xl p-4 ${rahmen}`}>
        <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
          Deine Antwort
        </div>
        {text ? (
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-sm"
            // SuS-Quill/Tiptap-Output ist nicht garantiert sanitisiert (Editor
            // erlaubt theoretisch HTML-Eingabe). DOMPurify entfernt <script>,
            // on*-Handler und javascript:-URLs.
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
          />
        ) : (
          <p className="text-slate-500 italic text-sm">Keine Antwort abgegeben.</p>
        )}
      </div>

      {/* Musterloesungs-Block */}
      {frage.musterlosung && (
        <MusterloesungsBlock variant={variant}>
          <p>{frage.musterlosung}</p>
        </MusterloesungsBlock>
      )}
    </div>
  )
}
