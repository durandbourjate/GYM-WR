import type { BilanzERFrage as BilanzERFrageType } from '../../types/fragen-storage'
import type { Antwort as StoreAntwort } from '../../types/antworten.ts'
import { BilanzERLoesung } from './BilanzERLoesung'
import BilanzERAufgabe from './BilanzERAufgabe'

interface Props {
  frage: BilanzERFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: StoreAntwort | null
}

/* ─── Hauptkomponente: delegiert je nach Modus ─── */
export default function BilanzERFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <BilanzERLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <BilanzERAufgabe frage={frage} />
}
