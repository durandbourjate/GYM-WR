import { create } from 'zustand'
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort, Selbstbewertung } from '../../types/antworten'
import { getFragetext } from '../../utils/ueben/fragetext'
import type { UebungsSession, SessionErgebnis, SessionModus, ThemaQuelle } from '../../types/ueben/uebung'
import type { MasteryStufe } from '../../types/ueben/fortschritt'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from '../../utils/ueben/blockBuilder'
import { istDauerbaustelle } from '../../utils/ueben/mastery'
import { pruefeAntwort } from '../../utils/ueben/korrektur'
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'
import type { LoesungsMap, LoesungsSlice } from '../../types/ueben/loesung'
import { normalizeAntwort } from '../../utils/normalizeAntwort'
import { useUebenFortschrittStore } from './fortschrittStore'

/**
 * Merged einen LoesungsSlice in eine Frage-Kopie. Mutiert NICHT die
 * Original-Frage; liefert ein neues Objekt mit kombinierten Feldern.
 *
 * Listen-Felder (optionen[], luecken[], etc.): Merge per id — der
 * gemischte Client-Array wird um die Lösungs-Attribute ergänzt.
 * Reihenfolgen-kritische Felder (elemente[], paare[]) werden aus
 * dem Slice übernommen (überschreibt gemischte Client-Version).
 */
function mergeLoesungInFrage(frage: Frage, slice: LoesungsSlice | undefined): Frage {
  if (!slice) return frage
  const merged: Record<string, unknown> = { ...frage }

  // Top-level einfache Felder (gemeinsam + typSpezifisch)
  if (slice.musterlosung !== undefined) merged.musterlosung = slice.musterlosung
  if (slice.bewertungsraster !== undefined) merged.bewertungsraster = slice.bewertungsraster
  if (slice.korrekteFormel !== undefined) merged.korrekteFormel = slice.korrekteFormel
  if (slice.korrekt !== undefined) merged.korrekt = slice.korrekt
  if (slice.buchungen !== undefined) merged.buchungen = slice.buchungen
  if (slice.korrektBuchung !== undefined) merged.korrektBuchung = slice.korrektBuchung
  if (slice.sollEintraege !== undefined) merged.sollEintraege = slice.sollEintraege
  if (slice.habenEintraege !== undefined) merged.habenEintraege = slice.habenEintraege
  if (slice.loesung !== undefined) merged.loesung = slice.loesung

  // Reihenfolgen-kritisch: Lösung überschreibt Mischung
  if (slice.elemente !== undefined) merged.elemente = slice.elemente
  if (slice.paare !== undefined) merged.paare = slice.paare

  // Listen-Felder per id mergen
  type IdItem = { id?: string }
  const mergeById = (base: unknown, patches: IdItem[] | undefined): unknown => {
    if (!Array.isArray(base) || !patches) return base
    const patchMap = new Map<string, IdItem>()
    for (const p of patches) if (p && p.id) patchMap.set(p.id, p)
    return base.map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return item
      const withId = item as IdItem
      const patch = withId.id ? patchMap.get(withId.id) : undefined
      return patch ? { ...withId, ...patch } : item
    })
  }

  if (slice.optionen) merged.optionen = mergeById(merged.optionen, slice.optionen)
  if (slice.aussagen) merged.aussagen = mergeById(merged.aussagen, slice.aussagen)
  if (slice.luecken) merged.luecken = mergeById(merged.luecken, slice.luecken)
  if (slice.ergebnisse) merged.ergebnisse = mergeById(merged.ergebnisse, slice.ergebnisse)
  if (slice.konten) merged.konten = mergeById(merged.konten, slice.konten)
  if (slice.bilanzEintraege) merged.bilanzEintraege = mergeById(merged.bilanzEintraege, slice.bilanzEintraege)
  if (slice.aufgaben) merged.aufgaben = mergeById(merged.aufgaben, slice.aufgaben)
  if (slice.labels) merged.labels = mergeById(merged.labels, slice.labels)
  if (slice.beschriftungen) merged.beschriftungen = mergeById(merged.beschriftungen, slice.beschriftungen)
  if (slice.zielzonen) merged.zielzonen = mergeById(merged.zielzonen, slice.zielzonen)
  if (slice.bereiche) merged.bereiche = mergeById(merged.bereiche, slice.bereiche)
  if (slice.hotspots) merged.hotspots = mergeById(merged.hotspots, slice.hotspots)

  return merged as unknown as Frage
}

/**
 * Merged die Lösungs-Map in die Frage-Liste. Aufgabengruppen erhalten
 * sowohl ihren eigenen Slice als auch die Slices ihrer Teilaufgaben
 * (flache Map-Lookup).
 */
function mergeLoesungen(
  fragen: Frage[],
  loesungen: LoesungsMap,
): { fragen: Frage[]; preloaded: Record<string, boolean> } {
  const preloaded: Record<string, boolean> = {}
  const merged = fragen.map((f) => {
    const frageSlice = loesungen[f.id]
    preloaded[f.id] = frageSlice !== undefined
    let out = mergeLoesungInFrage(f, frageSlice)
    const outWithTa = out as Frage & { teilaufgaben?: Frage[] }
    if (Array.isArray(outWithTa.teilaufgaben)) {
      outWithTa.teilaufgaben = outWithTa.teilaufgaben.map((ta: Frage) => {
        const taSlice = loesungen[ta.id]
        preloaded[ta.id] = taSlice !== undefined
        return mergeLoesungInFrage(ta, taSlice)
      })
      out = outWithTa
    }
    return out
  })
  return { fragen: merged, preloaded }
}

/** Persistiertes Session-Ergebnis für die Übungs-Einsicht */
export interface GespeichertesErgebnis {
  sessionId: string
  fach: string
  thema: string
  datum: string
  anzahlFragen: number
  richtig: number
  quote: number
  dauer: number
  details: SessionErgebnis['details']
}

const HISTORIE_KEY = 'ueben-session-historie'
const MAX_HISTORIE = 50

function ladeHistorie(): GespeichertesErgebnis[] {
  try {
    const raw = localStorage.getItem(HISTORIE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GespeichertesErgebnis[]
    // Migration: Antworten in gespeicherten Details auf einheitliches Format normalisieren.
    // GespeichertesErgebnis enthält keine rohen Antwort-Objekte, aber zukünftige Formate
    // könnten sie enthalten — hier als Sicherheitsnetz für ältere localStorage-Einträge.
    return parsed
  } catch { return [] }
}

function speichereHistorie(historie: GespeichertesErgebnis[]) {
  try { localStorage.setItem(HISTORIE_KEY, JSON.stringify(historie.slice(0, MAX_HISTORIE))) } catch { /* quota */ }
}

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
  /** Üben-Modus: explizit "Antwort prüfen" — ruft Server-Endpoint lernplattformPruefeAntwort */
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

      const fortschritte = useUebenFortschrittStore.getState().fortschritte
      const mastery: Record<string, MasteryStufe> = {}
      for (const f of alleFragen) {
        mastery[f.id] = fortschritte[f.id]?.mastery || 'neu'
      }

      // Block erstellen je nach Modus
      let block: Frage[]
      if (modus === 'mix' && quellen) {
        block = erstelleMixBlock(alleFragen, quellen, { mastery })
      } else if (modus === 'repetition') {
        // Dauerbaustellen ermitteln
        const dauerBau = new Set<string>()
        for (const [id, fp] of Object.entries(fortschritte)) {
          if (istDauerbaustelle(fp.versuche, fp.richtig)) dauerBau.add(id)
        }
        block = erstelleRepetitionsBlock(alleFragen, mastery, dauerBau)
      } else {
        block = erstelleBlock(alleFragen, thema, { mastery })
      }

      if (block.length === 0) {
        set({ ladeStatus: 'fehler' })
        return
      }

      // Lösungs-Preload via separatem Endpoint (Bundle Ü).
      // Bei Erfolg: Lösungen in Frage-Objekte mergen, clientseitige Korrektur möglich.
      // Bei Fehler oder Lücken: pro-Frage-Fallback auf pruefeAntwortJetzt().
      let loesungen: LoesungsMap = {}
      try {
        const { useUebenAuthStore } = await import('./authStore')
        const user = useUebenAuthStore.getState().user
        if (user?.sessionToken) {
          const fragenIds = block.map((f) => f.id)
          for (const f of block) {
            const ta = (f as Frage & { teilaufgaben?: Frage[] }).teilaufgaben
            if (Array.isArray(ta)) for (const t of ta) fragenIds.push(t.id)
          }
          loesungen = await ladeLoesungenApi({
            gruppeId,
            fragenIds,
            email: user.email,
            token: user.sessionToken,
            fachbereich: fach,
          })
        }
      } catch (e) {
        console.warn('[uebungsStore] Lösungs-Preload fehlgeschlagen:', e)
      }

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
    const istSelbstbewertbar = ['freitext', 'visualisierung', 'pdf', 'audio', 'code'].includes(frage.typ)
    if (state.loesungenPreloaded[frageId] === true && !istSelbstbewertbar) {
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
        speichertPruefung: false,
        pruefFehler: null,
        feedbackSichtbar: true,
        letzteAntwortKorrekt: korrekt,
        // musterlosung ist bereits in frage.musterlosung gemerged (mergeLoesungInFrage)
        letzteMusterloesung: frage.musterlosung ?? null,
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
      const res = await pruefeAntwortApi({
        gruppeId: session.gruppeId,
        frageId,
        antwort: normalized,
        email: session.email,
        token,
        // fachbereich-Hint: spart Server ~75% Sheet-Reads (1 Tab statt 4)
        fachbereich: frage.fachbereich,
      })

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
    const istSelbstbewertbar = ['freitext', 'visualisierung', 'pdf', 'audio', 'code'].includes(basis.typ)
    const antwort = istSelbstbewertbar
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
