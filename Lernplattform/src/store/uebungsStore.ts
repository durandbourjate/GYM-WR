import { create } from 'zustand'
import type { Frage, AntwortTyp } from '../types/fragen'
import type { UebungsSession, SessionErgebnis } from '../types/uebung'
import { fragenAdapter } from '../adapters/appsScriptAdapter'
import { erstelleBlock } from '../utils/blockBuilder'
import { pruefeAntwort } from '../utils/korrektur'

interface UebungsState {
  session: UebungsSession | null
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  feedbackSichtbar: boolean
  letzteAntwortKorrekt: boolean | null

  starteSession: (gruppeId: string, email: string, fach: string, thema: string) => Promise<void>
  beantworte: (antwort: AntwortTyp) => void
  naechsteFrage: () => void
  istSessionFertig: () => boolean
  berechneErgebnis: () => SessionErgebnis
  beendeSession: () => void
  aktuelleFrage: () => Frage | null
}

export const useUebungsStore = create<UebungsState>((set, get) => ({
  session: null,
  ladeStatus: 'idle',
  feedbackSichtbar: false,
  letzteAntwortKorrekt: null,

  starteSession: async (gruppeId, email, fach, thema) => {
    set({ ladeStatus: 'laden' })

    try {
      const alleFragen = await fragenAdapter.ladeFragen(gruppeId, { fach, thema, nurUebung: true })
      const block = erstelleBlock(alleFragen, thema)

      if (block.length === 0) {
        set({ ladeStatus: 'fehler' })
        return
      }

      const session: UebungsSession = {
        id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        gruppeId,
        email,
        fach,
        thema,
        fragen: block,
        antworten: {},
        ergebnisse: {},
        aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
      }

      set({ session, ladeStatus: 'fertig', feedbackSichtbar: false, letzteAntwortKorrekt: null })
    } catch {
      set({ ladeStatus: 'fehler' })
    }
  },

  beantworte: (antwort) => {
    const session = get().session
    if (!session) return

    const frage = session.fragen[session.aktuelleFrageIndex]
    if (!frage) return

    const korrekt = pruefeAntwort(frage, antwort)

    set({
      session: {
        ...session,
        antworten: { ...session.antworten, [frage.id]: antwort },
        ergebnisse: { ...session.ergebnisse, [frage.id]: korrekt },
      },
      feedbackSichtbar: true,
      letzteAntwortKorrekt: korrekt,
    })
  },

  naechsteFrage: () => {
    const session = get().session
    if (!session) return

    set({
      session: {
        ...session,
        aktuelleFrageIndex: session.aktuelleFrageIndex + 1,
      },
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
    })
  },

  istSessionFertig: () => {
    const session = get().session
    if (!session) return true
    const allBeantwortet = session.fragen.every(f => f.id in session.antworten)
    const aufLetzterFrage = session.aktuelleFrageIndex >= session.fragen.length - 1
    return allBeantwortet && aufLetzterFrage
  },

  berechneErgebnis: () => {
    const session = get().session
    if (!session) return { sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [] }

    const details = session.fragen.map(f => ({
      frageId: f.id,
      frage: f.frage,
      typ: f.typ,
      korrekt: session.ergebnisse[f.id] ?? false,
      erklaerung: f.erklaerung,
    }))

    const richtig = details.filter(d => d.korrekt).length
    const falsch = details.filter(d => !d.korrekt).length
    const dauer = session.beendet
      ? new Date(session.beendet).getTime() - new Date(session.gestartet).getTime()
      : Date.now() - new Date(session.gestartet).getTime()

    return {
      sessionId: session.id,
      anzahlFragen: session.fragen.length,
      richtig,
      falsch,
      quote: session.fragen.length > 0 ? (richtig / session.fragen.length) * 100 : 0,
      dauer,
      details,
    }
  },

  beendeSession: () => {
    const session = get().session
    if (session) {
      set({ session: { ...session, beendet: new Date().toISOString() } })
    }
  },

  aktuelleFrage: () => {
    const session = get().session
    if (!session) return null
    return session.fragen[session.aktuelleFrageIndex] ?? null
  },
}))
