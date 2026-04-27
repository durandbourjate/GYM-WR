import { create } from 'zustand'
import type { Frage, FrageSummary } from '../types/fragen.ts'
import { ladeFragenbank, ladeFragenbankSummary, ladeFrageDetail } from '../services/fragenbankApi.ts'
import {
  getCachedSummaries, setCachedSummaries,
  getCachedDetails, setCachedDetails,
  clearFragenbankCache
} from '../services/fragenbankCache.ts'

/**
 * Progressive Loading:
 * 1. ladeSummaries() → schnell (~500KB), UI sofort interaktiv
 * 2. ladeAlleDetails() → im Hintergrund, füllt detailCache
 * 3. ladeDetail() → on-demand für einzelne Fragen
 */

type FragenbankStatus = 'idle' | 'summary_laden' | 'summary_fertig' | 'detail_laden' | 'fertig' | 'fehler'

interface FragenbankStore {
  /** Leichtgewichtige Summaries für Listenansicht + Filter */
  summaries: FrageSummary[]
  summaryMap: Record<string, FrageSummary>
  /** Vollständige Fragen (on-demand oder nach Background-Prefetch) */
  detailCache: Record<string, Frage>
  /** Legacy: Alle Fragen (gefüllt nach Prefetch) */
  fragen: Frage[]
  fragenMap: Record<string, Frage>
  status: FragenbankStatus
  _cacheInvalid: boolean

  /** Summaries laden (schnell, für Listenansicht) */
  ladeSummaries: (email: string, force?: boolean) => Promise<void>
  /** Einzelne Frage mit allen Details laden */
  ladeDetail: (email: string, frageId: string, fachbereich: string) => Promise<Frage | null>
  /** Alle Details im Hintergrund laden (bestehender Endpoint) */
  ladeAlleDetails: (email: string) => Promise<void>
  /** Legacy: Alles auf einmal laden (Fallback) */
  lade: (email: string, force?: boolean) => Promise<void>

  /** Einzelne Frage im lokalen State aktualisieren (nach Speichern/Import) */
  aktualisiereFrage: (frage: Frage) => void
  /** Frage entfernen (nach Löschen) */
  entferneFrage: (frageId: string) => void
  /** Mehrere Fragen hinzufügen (z.B. nach Pool-Import) */
  fuegeFragenHinzu: (neueFragen: Frage[]) => void
  /** Komplette Fragenbank ersetzen (z.B. nach Refresh) */
  setFragen: (fragen: Frage[]) => void
  /** Detail aus Cache holen (synchron, null wenn nicht geladen) */
  getDetail: (frageId: string) => Frage | null
  /** Zurücksetzen beim Logout (await für IDB-Commit-Garantie vor Hard-Nav) */
  reset: () => Promise<void>
}

function bauFragenMap(fragen: Frage[]): Record<string, Frage> {
  const map: Record<string, Frage> = {}
  for (const f of fragen) map[f.id] = f
  return map
}

function bauSummaryMap(summaries: FrageSummary[]): Record<string, FrageSummary> {
  const map: Record<string, FrageSummary> = {}
  for (const s of summaries) map[s.id] = s
  return map
}

export const useFragenbankStore = create<FragenbankStore>((set, get) => ({
  summaries: [],
  summaryMap: {},
  detailCache: {},
  fragen: [],
  fragenMap: {},
  status: 'idle',
  _cacheInvalid: false,

  ladeSummaries: async (email: string, force = false) => {
    const { status } = get()
    if (status === 'summary_laden' || (status !== 'idle' && !force)) return

    set({ status: 'summary_laden' })
    const result = await ladeFragenbankSummary(email)
    if (result) {
      // Duplikate entfernen
      const gesehen = new Set<string>()
      const eindeutig = result.filter((s: FrageSummary) => {
        if (gesehen.has(s.id)) return false
        gesehen.add(s.id)
        return true
      })
      set({
        summaries: eindeutig,
        summaryMap: bauSummaryMap(eindeutig),
        status: 'summary_fertig',
      })
      setCachedSummaries(eindeutig)
    } else {
      set({ status: 'fehler' })
    }
  },

  ladeDetail: async (email: string, frageId: string, fachbereich: string) => {
    // Erst im Cache schauen
    const cached = get().detailCache[frageId]
    if (cached) return cached

    // Auch in fragen (Legacy/Prefetch) schauen
    const legacy = get().fragenMap[frageId]
    if (legacy) return legacy

    // Vom Backend laden
    const frage = await ladeFrageDetail(email, frageId, fachbereich)
    if (frage) {
      set(state => ({
        detailCache: { ...state.detailCache, [frageId]: frage },
      }))
    }
    return frage
  },

  ladeAlleDetails: async (email: string) => {
    const { status } = get()
    // Nur starten wenn Summaries geladen und Details noch nicht da
    if (status !== 'summary_fertig') return

    set({ status: 'detail_laden' })
    const result = await ladeFragenbank(email)
    if (result) {
      const gesehen = new Set<string>()
      const eindeutig = result.filter((f: Frage) => {
        if (gesehen.has(f.id)) return false
        gesehen.add(f.id)
        return true
      })
      const fragenMap = bauFragenMap(eindeutig)
      set({
        fragen: eindeutig,
        fragenMap,
        detailCache: fragenMap,
        status: 'fertig',
      })
      setCachedDetails(eindeutig)
    }
    // Bei Fehler bleiben wir auf summary_fertig — UI funktioniert weiterhin
  },

  lade: async (email: string, force = false) => {
    const { status, _cacheInvalid } = get()
    if (status === 'summary_laden' || status === 'detail_laden') return
    if ((status === 'fertig' || status === 'summary_fertig') && !force) return

    set({ status: 'summary_laden' })

    // --- Stale-While-Revalidate: Cache zuerst ---
    if (!force && !_cacheInvalid) {
      const cachedSummaries = await getCachedSummaries()
      if (cachedSummaries && cachedSummaries.length > 0) {
        const gesehen = new Set<string>()
        const eindeutig = cachedSummaries.filter((s: FrageSummary) => {
          if (gesehen.has(s.id)) return false
          gesehen.add(s.id)
          return true
        })
        set({
          summaries: eindeutig,
          summaryMap: bauSummaryMap(eindeutig),
          status: 'summary_fertig',
        })

        // Cached Details auch laden wenn vorhanden
        const cachedDetails = await getCachedDetails()
        if (cachedDetails && cachedDetails.length > 0) {
          const dGesehen = new Set<string>()
          const dEindeutig = cachedDetails.filter((f: Frage) => {
            if (dGesehen.has(f.id)) return false
            dGesehen.add(f.id)
            return true
          })
          set({
            fragen: dEindeutig,
            fragenMap: bauFragenMap(dEindeutig),
            detailCache: bauFragenMap(dEindeutig),
            status: 'fertig',
          })
        }

        // Hintergrund-Revalidierung: Server-Daten holen OHNE Status zu ändern (kein UI-Flicker)
        ladeFragenbankSummary(email).then(serverSummaries => {
          if (!serverSummaries) return
          const sGesehen = new Set<string>()
          const sEindeutig = serverSummaries.filter((s: FrageSummary) => {
            if (sGesehen.has(s.id)) return false
            sGesehen.add(s.id)
            return true
          })
          const currentCount = get().summaries.length
          if (sEindeutig.length !== currentCount) {
            set({ summaries: sEindeutig, summaryMap: bauSummaryMap(sEindeutig) })
          }
          setCachedSummaries(sEindeutig)
          // Details auch im Hintergrund aktualisieren
          get().ladeAlleDetails(email)
        })
        return
      }
    }

    // --- Kein Cache: normal vom Server laden ---
    set({ _cacheInvalid: false })

    const summaryResult = await ladeFragenbankSummary(email)
    if (summaryResult) {
      const gesehen = new Set<string>()
      const eindeutig = summaryResult.filter((s: FrageSummary) => {
        if (gesehen.has(s.id)) return false
        gesehen.add(s.id)
        return true
      })
      set({
        summaries: eindeutig,
        summaryMap: bauSummaryMap(eindeutig),
        status: 'summary_fertig',
      })
      setCachedSummaries(eindeutig)
      get().ladeAlleDetails(email)
      return
    }

    // Fallback: Alles auf einmal laden (alter Weg)
    const result = await ladeFragenbank(email)
    if (result) {
      const gesehen = new Set<string>()
      const eindeutig = result.filter((f: Frage) => {
        if (gesehen.has(f.id)) return false
        gesehen.add(f.id)
        return true
      })
      // Summaries aus vollen Fragen ableiten
      const summaries: FrageSummary[] = eindeutig.map(f => ({
        id: f.id,
        typ: f.typ,
        fachbereich: f.fachbereich,
        thema: f.thema,
        unterthema: f.unterthema,
        fragetext: (f as any).fragetext?.substring(0, 200) || '',
        bloom: f.bloom,
        punkte: f.punkte,
        tags: f.tags,
        quelle: f.quelle,
        autor: f.autor,
        erstelltVon: f.autor,
        erstelltAm: f.erstelltAm,
        geteilt: f.geteilt,
        geteiltVon: f.geteiltVon,
        poolId: f.poolId,
        poolGeprueft: f.poolGeprueft,
        pruefungstauglich: f.pruefungstauglich,
        poolUpdateVerfuegbar: f.poolUpdateVerfuegbar,
        hatAnhang: Array.isArray(f.anhaenge) && f.anhaenge.length > 0,
        hatMaterial: false,
        fach: f.fach,
        berechtigungen: f.berechtigungen,
        _recht: f._recht,
        lernzielIds: f.lernzielIds,
        semester: f.semester,
        gefaesse: f.gefaesse,
      }))
      set({
        fragen: eindeutig,
        fragenMap: bauFragenMap(eindeutig),
        detailCache: bauFragenMap(eindeutig),
        summaries,
        summaryMap: bauSummaryMap(summaries),
        status: 'fertig',
      })
      setCachedSummaries(summaries)
      setCachedDetails(eindeutig)
    } else {
      set({ status: 'fehler' })
    }
  },

  aktualisiereFrage: (frage: Frage) => {
    set(state => {
      const fragen = state.fragen.map(f => f.id === frage.id ? frage : f)
      if (!state.fragenMap[frage.id]) fragen.unshift(frage)
      const fragenMap = bauFragenMap(fragen)

      // Summary aktualisieren
      const summary: FrageSummary = {
        id: frage.id,
        typ: frage.typ,
        fachbereich: frage.fachbereich,
        thema: frage.thema,
        unterthema: frage.unterthema,
        fragetext: (frage as any).fragetext?.substring(0, 200) || '',
        bloom: frage.bloom,
        punkte: frage.punkte,
        tags: frage.tags,
        quelle: frage.quelle,
        autor: frage.autor,
        erstelltVon: frage.autor,
        erstelltAm: frage.erstelltAm,
        geteilt: frage.geteilt,
        geteiltVon: frage.geteiltVon,
        poolId: frage.poolId,
        poolGeprueft: frage.poolGeprueft,
        pruefungstauglich: frage.pruefungstauglich,
        poolUpdateVerfuegbar: frage.poolUpdateVerfuegbar,
        hatAnhang: Array.isArray(frage.anhaenge) && frage.anhaenge.length > 0,
        hatMaterial: false,
        fach: frage.fach,
        berechtigungen: frage.berechtigungen,
        _recht: frage._recht,
        lernzielIds: frage.lernzielIds,
        semester: frage.semester,
        gefaesse: frage.gefaesse,
      }
      const summaries = state.summaries.map(s => s.id === frage.id ? summary : s)
      if (!state.summaryMap[frage.id]) summaries.unshift(summary)

      return {
        fragen,
        fragenMap,
        detailCache: { ...state.detailCache, [frage.id]: frage },
        summaries,
        summaryMap: bauSummaryMap(summaries),
        _cacheInvalid: true,
      }
    })
  },

  entferneFrage: (frageId: string) => {
    set(state => {
      const fragen = state.fragen.filter(f => f.id !== frageId)
      const summaries = state.summaries.filter(s => s.id !== frageId)
      const detailCache = { ...state.detailCache }
      delete detailCache[frageId]
      return {
        fragen,
        fragenMap: bauFragenMap(fragen),
        summaries,
        summaryMap: bauSummaryMap(summaries),
        detailCache,
        _cacheInvalid: true,
      }
    })
  },

  fuegeFragenHinzu: (neueFragen: Frage[]) => {
    set(state => {
      const fragen = [...neueFragen, ...state.fragen]
      const neueSummaries: FrageSummary[] = neueFragen.map(f => ({
        id: f.id,
        typ: f.typ,
        fachbereich: f.fachbereich,
        thema: f.thema,
        unterthema: f.unterthema,
        fragetext: (f as any).fragetext?.substring(0, 200) || '',
        bloom: f.bloom,
        punkte: f.punkte,
        tags: f.tags,
        quelle: f.quelle,
        autor: f.autor,
        erstelltVon: f.autor,
        erstelltAm: f.erstelltAm,
        geteilt: f.geteilt,
        geteiltVon: f.geteiltVon,
        poolId: f.poolId,
        poolGeprueft: f.poolGeprueft,
        pruefungstauglich: f.pruefungstauglich,
        poolUpdateVerfuegbar: f.poolUpdateVerfuegbar,
        hatAnhang: Array.isArray(f.anhaenge) && f.anhaenge.length > 0,
        hatMaterial: false,
        fach: f.fach,
        berechtigungen: f.berechtigungen,
        _recht: f._recht,
        lernzielIds: f.lernzielIds,
        semester: f.semester,
        gefaesse: f.gefaesse,
      }))
      const summaries = [...neueSummaries, ...state.summaries]
      const neueDetails: Record<string, Frage> = {}
      for (const f of neueFragen) neueDetails[f.id] = f
      return {
        fragen,
        fragenMap: bauFragenMap(fragen),
        summaries,
        summaryMap: bauSummaryMap(summaries),
        detailCache: { ...state.detailCache, ...neueDetails },
        _cacheInvalid: true,
      }
    })
  },

  setFragen: (fragen: Frage[]) => {
    set({ fragen, fragenMap: bauFragenMap(fragen), status: 'fertig' })
  },

  getDetail: (frageId: string) => {
    const state = get()
    return state.detailCache[frageId] || state.fragenMap[frageId] || null
  },

  reset: async () => {
    set({
      summaries: [],
      summaryMap: {},
      detailCache: {},
      fragen: [],
      fragenMap: {},
      status: 'idle',
      _cacheInvalid: false,
    })
    await clearFragenbankCache()
  },
}))
