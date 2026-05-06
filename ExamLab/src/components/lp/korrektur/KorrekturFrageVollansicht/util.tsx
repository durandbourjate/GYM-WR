import type { Frage } from '../../../../types/fragen-storage'

/** Haupttext der Frage je nach Typ */
export function frageHaupttext(frage: Frage): string {
  switch (frage.typ) {
    case 'buchungssatz':
      return frage.geschaeftsfall
    case 'tkonto':
    case 'kontenbestimmung':
    case 'bilanzstruktur':
      return frage.aufgabentext
    case 'aufgabengruppe':
      return frage.kontext
    default:
      return (frage as { fragetext: string }).fragetext ?? ''
  }
}

/** Platzhalter für fehlende Antwort */
export function KeineAntwort() {
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-sm italic text-slate-400 dark:text-slate-500">Keine Antwort</span>
    </div>
  )
}
