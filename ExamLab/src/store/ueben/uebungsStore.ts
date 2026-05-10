import { create } from 'zustand'
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort, Selbstbewertung } from '../../types/antworten'
import type { UebungsSession, SessionErgebnis, SessionModus, ThemaQuelle } from '../../types/ueben/uebung'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { erstelleSessionBlock } from '../../utils/ueben/sessionBlockBau'
import { pruefeClientseitig } from '../../utils/ueben/pruefeClientseitig'
import { ladeLoesungenViaPreload } from '../../utils/ueben/loesungsPreloadFetch'
import { pruefeAntwort } from '../../utils/ueben/korrektur'
import { normalisiereDragDropBild } from '../../utils/ueben/fragetypNormalizer'
import { mergeLoesungen } from '../../utils/ueben/loesungsMerge'
import { istSelbstbewertbar } from '../../utils/ueben/fragetypGruppen'
import { ladeHistorie, speichereHistorie, MAX_HISTORIE, type GespeichertesErgebnis } from '../../utils/ueben/historie'
import { berechneErgebnis as berechneErgebnisPure } from '../../utils/ueben/ergebnisBerechnung'
import type { PruefResultat } from '../../types/ueben/pruefResultat'
import { normalizeAntwort } from '../../utils/normalizeAntwort'
import { useUebenFortschrittStore } from './fortschrittStore'

interface UebungsState {
  session: UebungsSession | null
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  feedbackSichtbar: boolean
  letzteAntwortKorrekt: boolean | null
  /** Server-seitige Prüfung läuft gerade (Üben-Modus, Phase 2) */
  speichertPruefung: boolean
  /** Fehler-Text bei fehlgeschlagener Server-Prüfung — UI zeigt Retry-Banner */
  pruefFehler: string | null
  /** Musterlösung vom Server (wird bei Selbstbewertung + optional auto-Korrektur geliefert) */
  letzteMusterloesung: string | null
  /** Pro-Frage-Map: hat die Lösung (via Pre-Load) oder nicht (Fallback auf Server) */
  loesungenPreloaded: Record<string, boolean>
  /** Session-Historie für Übungs-Einsicht */
  historie: GespeichertesErgebnis[]

  starteSession: (gruppeId: string, email: string, fach: string, thema: string, fragenOverride?: Frage[], modus?: SessionModus, quellen?: ThemaQuelle[], freiwillig?: boolean) => Promise<void>
  beantworte: (antwort: unknown) => void
  beantworteById: (frageId: string, antwort: Antwort) => void
  /** Zwischenstand ohne Korrektur speichern (für Multi-Feld-Fragetypen + Üben-Modus) */
  speichereZwischenstandById: (frageId: string, antwort: Antwort) => void
  /** Üben-Modus: explizit "Antwort prüfen" — ruft Server-Endpoint uebenPruefeAntwort */
  pruefeAntwortJetzt: (frageId: string) => Promise<void>
  /** Üben-Modus: SuS-Selbstbewertung für Freitext/Visualisierung/PDF/Audio/Code */
  selbstbewertenById: (frageId: string, bewertung: Selbstbewertung) => void
  naechsteFrage: () => void
  vorherigeFrage: () => void
  ueberspringen: () => void
  toggleUnsicher: () => void
  toggleUnsicherById: (frageId: string) => void
  istUnsicher: () => boolean
  istSessionFertig: () => boolean
  berechneErgebnis: () => SessionErgebnis
  beendeSession: () => void
  aktuelleFrage: () => Frage | null
  kannZurueck: () => boolean
  ladeHistorie: () => void
}

export const useUebenUebungsStore = create<UebungsState>((set, get) => ({
  session: null,
  ladeStatus: 'idle',
  feedbackSichtbar: false,
  letzteAntwortKorrekt: null,
  speichertPruefung: false,
  pruefFehler: null,
  letzteMusterloesung: null,
  loesungenPreloaded: {},
  historie: ladeHistorie(),

  starteSession: async (gruppeId, email, fach, thema, fragenOverride, modus = 'standard', quellen, freiwillig = false) => {
    set({ ladeStatus: 'laden' })

    try {
      // Fragen laden — bei Mix/Repetition alle Fragen der Gruppe
      let alleFragen: Frage[]
      if (fragenOverride) {
        alleFragen = fragenOverride
      } else if (modus === 'mix' || modus === 'repetition') {
        alleFragen = await uebenFragenAdapter.ladeFragen(gruppeId)
      } else {
        alleFragen = await uebenFragenAdapter.ladeFragen(gruppeId, { fach, thema })
      }

      // Bundle J Pfad #8: DnD-Bild-Fragen vor Merge normalisieren — sonst
      // kollidiert mergeById-Pattern mit string[]-vs-DragDropBildLabel[]-Mix.
      alleFragen = alleFragen.map(f =>
        f.typ === 'dragdrop_bild' ? normalisiereDragDropBild(f) : f
      )

      const fortschritte = useUebenFortschrittStore.getState().fortschritte
      const { block } = erstelleSessionBlock({
        alleFragen, fach, thema, modus, quellen, fortschritte,
      })

      if (block.length === 0) {
        set({ ladeStatus: 'fehler' })
        return
      }

      // Lösungs-Preload via separatem Endpoint (Bundle Ü).
      // Bei Erfolg: Lösungen in Frage-Objekte mergen, clientseitige Korrektur möglich.
      // Bei Fehler oder Lücken: pro-Frage-Fallback auf pruefeAntwortJetzt().
      const { useUebenAuthStore } = await import('./authStore')
      const loesungen = await ladeLoesungenViaPreload({
        block, gruppeId, fachbereich: fach, user: useUebenAuthStore.getState().user,
      })

      const { fragen: blockMitLoesung, preloaded } = mergeLoesungen(block, loesungen)

      const session: UebungsSession = {
        id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        gruppeId, email, fach, thema,
        modus,
        quellen,
        fragen: blockMitLoesung,
        antworten: {},
        ergebnisse: {},
        aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
        unsicher: new Set(),
        uebersprungen: new Set(),
        score: 0,
        freiwillig,
      }

      set({
        session,
        ladeStatus: 'fertig',
        feedbackSichtbar: false,
        letzteAntwortKorrekt: null,
        loesungenPreloaded: preloaded,
      })

      // Bundle G.a — lastUsedThema persistieren für Pre-Warm-Trigger B
      if (modus === 'standard' && fach && thema && block.length > 0) {
        try {
          localStorage.setItem(
            `examlab.lastUsedThema.${gruppeId}.${fach}`,
            thema,
          )
        } catch {
          // localStorage nicht verfügbar / quota — silently ignore
        }
      }
    } catch {
      set({ ladeStatus: 'fehler' })
    }
  },

  beantworte: (antwort) => {
    const session = get().session
    if (!session) return

    const frage = session.fragen[session.aktuelleFrageIndex]
    if (!frage) return

    get().beantworteById(frage.id, normalizeAntwort(antwort))
  },

  beantworteById: (frageId, antwort) => {
    const session = get().session
    if (!session) return

    const frage = session.fragen.find(f => f.id === frageId)
    if (!frage) return

    const normalized = normalizeAntwort(antwort)

    // Pro-Frage-Branch: Pre-Load vorhanden → clientseitig; sonst Server-Fallback.
    const preloaded = get().loesungenPreloaded[frageId] === true
    if (!preloaded) {
      // Antwort als Zwischenstand speichern + Server-Korrektur anstossen
      set({
        session: {
          ...session,
          zwischenstande: { ...(session.zwischenstande ?? {}), [frageId]: normalized },
        },
      })
      void get().pruefeAntwortJetzt(frageId)
      return
    }

    const korrekt = pruefeAntwort(frage, normalized)

    if (!session.freiwillig) {
      useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, korrekt, session.id)
    }

    set({
      session: {
        ...session,
        antworten: { ...session.antworten, [frageId]: normalized },
        ergebnisse: { ...session.ergebnisse, [frageId]: korrekt },
        score: session.score + (korrekt ? 1 : 0),
      },
      feedbackSichtbar: true,
      letzteAntwortKorrekt: korrekt,
    })
  },

  speichereZwischenstandById: (frageId, antwort) => {
    const session = get().session
    if (!session) return
    // Nur lokalen Zwischenstand merken — keine Korrektur, kein Locking
    set({
      session: {
        ...session,
        zwischenstande: { ...(session.zwischenstande ?? {}), [frageId]: normalizeAntwort(antwort) },
      },
    })
  },

  pruefeAntwortJetzt: async (frageId) => {
    const state = get()
    const session = state.session
    if (!session) return
    const frage = session.fragen.find(f => f.id === frageId)
    if (!frage) return

    // Antwort: Zwischenstand bevorzugen, sonst bereits gespeicherte antwort
    const antwort = session.zwischenstande?.[frageId] ?? session.antworten[frageId]
    if (antwort === undefined) return

    const normalized = normalizeAntwort(antwort)

    // Bundle Ü: Wenn Lösung vorgeladen ist, clientseitig korrigieren (instant).
    // Selbstbewertungstypen (freitext/audio/visualisierung/pdf/code) haben zwar
    // musterlosung im Slice, aber pruefeAntwort() liefert für sie kein sinnvolles
    // Boolean — für die muss der Server-Pfad laufen (liefert selbstbewertung:true).
    if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar(frage.typ)) {
      const result = pruefeClientseitig({ session, frage, normalized })
      if (!session.freiwillig) {
        useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, result.korrekt, session.id)
      }
      set({
        session: { ...session, ...result.sessionUpdates },
        speichertPruefung: false,
        pruefFehler: null,
        feedbackSichtbar: true,
        letzteAntwortKorrekt: result.korrekt,
        letzteMusterloesung: result.letzteMusterloesung,
      })
      return
    }

    // Sofort speichertPruefung markieren (synchron, vor jedem await), damit die UI
    // den Spinner rendert bevor der erste Micro-Task läuft.
    set({ speichertPruefung: true, pruefFehler: null })

    try {
      // Server-Call vorbereiten: Token aus authStore lesen (session hat nur email).
      // Dynamic-Import verhindert Zirkular-Imports (Service nutzt apiClient, der evtl.
      // indirekt Store-Typen sieht).
      const { useUebenAuthStore } = await import('./authStore')
      const user = useUebenAuthStore.getState().user
      const token = user?.sessionToken || ''

      const { pruefeAntwortApi } = await import('../../services/uebenKorrekturApi')
      const callApi = (tok: string): Promise<PruefResultat> => pruefeAntwortApi({
        gruppeId: session.gruppeId,
        frageId,
        antwort: normalized,
        email: session.email,
        token: tok,
        // fachbereich-Hint: spart Server ~75% Sheet-Reads (1 Tab statt 4)
        fachbereich: frage.fachbereich,
      })

      // Bug 8b: bei Auth-Fehler einmaliger Auto-Retry mit
      // sessionWiederherstellen. Token im Memory kann nach langer
      // Tab-Inaktivität stale sein (Backend-Cache-TTL oder Session-Lock).
      // sessionWiederherstellen lädt aus localStorage + revalidiert gegen
      // Backend, dann wird der frische Token für den Retry verwendet.
      let res: PruefResultat
      try {
        res = await callApi(token)
      } catch (authErr) {
        const authMsg = authErr instanceof Error ? authErr.message : ''
        if (authMsg !== 'Nicht authentifiziert') throw authErr
        await useUebenAuthStore.getState().sessionWiederherstellen()
        const refreshed = useUebenAuthStore.getState().user?.sessionToken
        if (!refreshed) throw new Error('Sitzung abgelaufen — bitte neu anmelden')
        res = await callApi(refreshed)
      }

      // Auto-korrigierbare Fragen: `res.korrekt` ist boolean.
      // Selbstbewertungs-Typen: `res.selbstbewertung` ist true, korrekt bleibt undefined
      // (die Bewertung erfolgt später über `selbstbewertenById`).
      const istAuto = typeof res.korrekt === 'boolean'
      const korrekt = istAuto ? res.korrekt! : null

      // Fortschritt nur bei auto-korrigierbaren Antworten + nicht-freiwillig speichern.
      // Selbstbewertung triggert Fortschritt erst im `selbstbewertenById`-Pfad.
      if (istAuto && !session.freiwillig) {
        useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, korrekt!, session.id)
      }

      // Aktuellen Store-State erneut lesen (session könnte extern mutiert worden sein).
      const aktuelleSession = get().session
      if (!aktuelleSession) {
        set({ speichertPruefung: false })
        return
      }

      set({
        session: istAuto
          ? {
              ...aktuelleSession,
              antworten: { ...aktuelleSession.antworten, [frageId]: normalized },
              ergebnisse: { ...aktuelleSession.ergebnisse, [frageId]: korrekt! },
              score: aktuelleSession.score + (korrekt ? 1 : 0),
            }
          : {
              // Selbstbewertung: nur Antwort merken, ergebnisse/score bleiben unverändert.
              ...aktuelleSession,
              antworten: { ...aktuelleSession.antworten, [frageId]: normalized },
            },
        speichertPruefung: false,
        pruefFehler: null,
        letzteAntwortKorrekt: korrekt,
        letzteMusterloesung: res.musterlosung ?? null,
        feedbackSichtbar: istAuto,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Prüfung fehlgeschlagen'
      set({ speichertPruefung: false, pruefFehler: msg })
    }
  },

  selbstbewertenById: (frageId, bewertung) => {
    const session = get().session
    if (!session) return
    const frage = session.fragen.find(f => f.id === frageId)
    if (!frage) return

    const roh = session.zwischenstande?.[frageId] ?? session.antworten[frageId]
    if (roh === undefined) return
    const basis = normalizeAntwort(roh)

    // Selbstbewertung in die Antwort schreiben — nur sinnvoll bei selbstbewerteten Typen.
    // Bei anderen Typen (Sicherheitsnetz): bewertung wird nur in ergebnisse gespeichert.
    const antwort = istSelbstbewertbar(basis.typ)
      ? ({ ...basis, selbstbewertung: bewertung } as Antwort)
      : basis

    const korrekt = bewertung === 'korrekt'

    if (!session.freiwillig) {
      useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, korrekt, session.id)
    }

    set({
      session: {
        ...session,
        antworten: { ...session.antworten, [frageId]: antwort },
        ergebnisse: { ...session.ergebnisse, [frageId]: korrekt },
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
      letzteMusterloesung: null,
      pruefFehler: null,
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
      letzteMusterloesung: null,
      pruefFehler: null,
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
      letzteMusterloesung: null,
      pruefFehler: null,
    })
  },

  toggleUnsicher: () => {
    const session = get().session
    if (!session) return

    const frage = session.fragen[session.aktuelleFrageIndex]
    if (!frage) return

    get().toggleUnsicherById(frage.id)
  },

  toggleUnsicherById: (frageId) => {
    const session = get().session
    if (!session) return

    const neueUnsicher = new Set(session.unsicher)
    if (neueUnsicher.has(frageId)) {
      neueUnsicher.delete(frageId)
    } else {
      neueUnsicher.add(frageId)
    }

    set({ session: { ...session, unsicher: neueUnsicher } })
  },

  istUnsicher: () => {
    const session = get().session
    if (!session) return false
    const frage = session.fragen[session.aktuelleFrageIndex]
    return frage ? session.unsicher.has(frage.id) : false
  },

  ladeHistorie: () => {
    set({ historie: ladeHistorie() })
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

  berechneErgebnis: () => berechneErgebnisPure(get().session),

  beendeSession: () => {
    const session = get().session
    if (session) {
      const beendet = new Date().toISOString()
      set({ session: { ...session, beendet } })
      // Ergebnis in Historie speichern
      const ergebnis = get().berechneErgebnis()
      const eintrag: GespeichertesErgebnis = {
        sessionId: session.id,
        fach: session.fach,
        thema: session.thema,
        datum: beendet,
        anzahlFragen: ergebnis.anzahlFragen,
        richtig: ergebnis.richtig,
        quote: ergebnis.quote,
        dauer: ergebnis.dauer,
        details: ergebnis.details,
      }
      const neueHistorie = [eintrag, ...get().historie].slice(0, MAX_HISTORIE)
      set({ historie: neueHistorie })
      speichereHistorie(neueHistorie)
    }
  },

  aktuelleFrage: () => {
    const session = get().session
    if (!session) return null
    return session.fragen[session.aktuelleFrageIndex] ?? null
  },
}))
