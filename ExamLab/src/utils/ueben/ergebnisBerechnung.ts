import type { UebungsSession, SessionErgebnis } from '../../types/ueben/uebung'
import { getFragetext } from './fragetext'

/**
 * Pure Berechnung des Session-Ergebnisses. Liefert ein Default-Objekt
 * für `null`-Sessions, sodass die aufrufende Store-Action keinen
 * speziellen Null-Pfad braucht.
 */
export function berechneErgebnis(session: UebungsSession | null): SessionErgebnis {
  if (!session) return { sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [] }

  const details = session.fragen.map(f => ({
    frageId: f.id,
    frage: getFragetext(f),
    typ: f.typ,
    korrekt: session.ergebnisse[f.id] ?? false,
    erklaerung: f.musterlosung,
    unsicher: session.unsicher.has(f.id),
    uebersprungen: session.uebersprungen.has(f.id),
  }))

  const richtig = details.filter(d => d.korrekt).length
  const falsch = details.filter(d => !d.korrekt && !d.uebersprungen).length
  const dauer = session.beendet
    ? new Date(session.beendet).getTime() - new Date(session.gestartet).getTime()
    : Date.now() - new Date(session.gestartet).getTime()

  return {
    sessionId: session.id,
    anzahlFragen: session.fragen.length,
    richtig, falsch,
    quote: session.fragen.length > 0 ? (richtig / session.fragen.length) * 100 : 0,
    dauer,
    details,
  }
}
