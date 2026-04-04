import { create } from 'zustand'
import type { Frage } from '../types/fragen'
import type { AntwortTyp } from '../types/antworten'
import { getFragetext } from '../utils/fragetext'
import type { UebungsSession, SessionErgebnis } from '../types/uebung'
import { fragenAdapter } from '../adapters/appsScriptAdapter'
import { erstelleBlock } from '../utils/blockBuilder'
import { pruefeAntwort } from '../utils/korrektur'
import { useFortschrittStore } from './fortschrittStore'

interface UebungsState {
  session: UebungsSession | null
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  feedbackSichtbar: boolean
  letzteAntwortKorrekt: boolean | null

  starteSession: (gruppeId: string, email: string, fach: string, thema: string) => Promise<void>
  beantworte: (antwort: AntwortTyp) => void
  naechsteFrage: () => void
  vorherigeFrage: () => void
  ueberspringen: () => void
  toggleUnsicher: () => void
  istUnsicher: () => boolean
  istSessionFertig: () => boolean
  berechneErgebnis: () => SessionErgebnis
  beendeSession: () => void
  aktuelleFrage: () => Frage | null
  kannZurueck: () => boolean
}

export const useUebungsStore = create<UebungsState>((set, get) => ({
  session: null,
  ladeStatus: 'idle',
  feedbackSichtbar: false,
  letzteAntwortKorrekt: null,

  starteSession: async (gruppeId, email, fach, thema) => {
    set({ ladeStatus: 'laden' })

    try {
      const alleFragen = await fragenAdapter.ladeFragen(gruppeId, { fach, thema })

      const fortschritte = useFortschrittStore.getState().fortschritte
      const mastery: Record<string, import('../types/fortschritt').MasteryStufe> = {}
      for (const f of alleFragen) {
        mastery[f.id] = fortschritte[f.id]?.mastery || 'neu'
      }

      const block = erstelleBlock(alleFragen, thema, { mastery })

      if (block.length === 0) {
        set({ ladeStatus: 'fehler' })
        return
      }

      const session: UebungsSession = {
        id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        gruppeId, email, fach, thema,
        fragen: block,
        antworten: {},
        ergebnisse: {},
        aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
        unsicher: new Set(),
        uebersprungen: new Set(),
        score: 0,
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

    useFortschrittStore.getState().antwortVerarbeiten(frage.id, session.email, korrekt, session.id)

    set({
      session: {
        ...session,
        antworten: { ...session.antworten, [frage.id]: antwort },
        ergebnisse: { ...session.ergebnisse, [frage.id]: korrekt },
        score: session.score + (korrekt ? 1 : 0),
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

  vorherigeFrage: () => {
    const session = get().session
    if (!session || session.aktuelleFrageIndex <= 0) return

    const vorherigerIndex = session.aktuelleFrageIndex - 1
    const vorherigeFrage = session.fragen[vorherigerIndex]
    const hatAntwort = vorherigeFrage && vorherigeFrage.id in session.antworten

    set({
      session: { ...session, aktuelleFrageIndex: vorherigerIndex },
      feedbackSichtbar: hatAntwort,
      letzteAntwortKorrekt: hatAntwort ? (session.ergebnisse[vorherigeFrage.id] ?? null) : null,
    })
  },

  ueberspringen: () => {
    const session = get().session
    if (!session) return

    const frage = session.fragen[session.aktuelleFrageIndex]
    if (!frage) return

    const neueUebersprungen = new Set(session.uebersprungen)
    neueUebersprungen.add(frage.id)

    set({
      session: {
        ...session,
        aktuelleFrageIndex: session.aktuelleFrageIndex + 1,
        uebersprungen: neueUebersprungen,
      },
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
    })
  },

  toggleUnsicher: () => {
    const session = get().session
    if (!session) return

    const frage = session.fragen[session.aktuelleFrageIndex]
    if (!frage) return

    const neueUnsicher = new Set(session.unsicher)
    if (neueUnsicher.has(frage.id)) {
      neueUnsicher.delete(frage.id)
    } else {
      neueUnsicher.add(frage.id)
    }

    set({ session: { ...session, unsicher: neueUnsicher } })
  },

  istUnsicher: () => {
    const session = get().session
    if (!session) return false
    const frage = session.fragen[session.aktuelleFrageIndex]
    return frage ? session.unsicher.has(frage.id) : false
  },

  kannZurueck: () => {
    const session = get().session
    return session ? session.aktuelleFrageIndex > 0 : false
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
