import { useMemo } from 'react'
import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt, ThemenFortschritt } from '../../types/ueben/fortschritt'
import type { Auftrag, Empfehlung } from '../../types/ueben/auftrag'
import type { ThemenFreischaltung, ThemenStatus } from '../../types/ueben/themenSichtbarkeit'
import type { GruppenEinstellungen } from '../../types/ueben/settings'
import type { UebenAuthUser } from '../../types/ueben/auth'
import { useAuthStore } from '../../store/authStore'
import { berechneEmpfehlungen } from '../../utils/ueben/empfehlungen'
import { poolTitel } from '../../utils/poolTitelMapping'
import { useTagsStore } from '../../store/tagsStore'
import { istEinrichtungsfrage } from '../../utils/frageTagNamen'

export interface ThemenInfo {
  fach: string
  thema: string
  unterthemen: string[]
  fragen: Frage[]
  fortschritt: ThemenFortschritt
}

export interface ThemenKomputationenInputs {
  // Stamm-Daten
  alleFragen: Frage[]
  fortschritte: Record<string, FragenFortschritt>
  auftraege: Auftrag[]
  user: UebenAuthUser | null
  freischaltungen: ThemenFreischaltung[]
  einstellungen: GruppenEinstellungen | null
  sichtbareFaecher: string[]

  // UI-State
  aktiverFach: string | null
  aktivesThema: string | null
  alleThemenAnzeigen: boolean
  suchtext: string
  unterthemaFilter: Set<string>
  schwierigkeitFilter: Set<number>
  typFilter: Set<string>
  sortierung: 'alphabetisch' | 'zuletztGeuebt'

  // Store-Selektoren (Funktions-Refs, stabil über Zustand)
  getThemenFortschritt: (fragen: Frage[]) => ThemenFortschritt
  getStatus: (fach: string, thema: string) => ThemenStatus
  getAktiveUnterthemen: (fach: string, thema: string) => string[] | undefined
}

export interface ThemenKomputationenResult {
  themenMap: Record<string, ThemenInfo[]>
  verfuegbareFaecher: string[]
  sichtbareThemenListe: ThemenInfo[]
  letzteUebungProThema: Map<string, string>
  themenSektionen: {
    aktuelle: ThemenInfo[]
    faecherSortiert: [string, ThemenInfo[]][]
    weitere: ThemenInfo[]
  }
  themaDetail: ThemenInfo | null
  gefilterteFragen: Frage[]
  empfehlungen: Empfehlung[]
}

export function useThemenKomputationen(inputs: ThemenKomputationenInputs): ThemenKomputationenResult {
  // Cluster H Phase 2: Subscribe an tagsStore für Re-Compute bei Tag-Rename.
  // istEinrichtungsfrage() liest via getState(), tagsVersion ist nur Memo-Dep-Trigger.
  const tagsVersion = useTagsStore(s => s.tags)
  const {
    alleFragen,
    fortschritte,
    auftraege,
    user,
    freischaltungen,
    einstellungen,
    sichtbareFaecher,
    aktiverFach,
    aktivesThema,
    alleThemenAnzeigen,
    suchtext,
    unterthemaFilter,
    schwierigkeitFilter,
    typFilter,
    sortierung,
    getThemenFortschritt,
    getStatus,
    getAktiveUnterthemen,
  } = inputs

  // Themen-Infos: Fach → Thema → { unterthemen, fragen, fortschritt }
  const themenMap = useMemo(() => {
    const map: Record<string, ThemenInfo[]> = {}
    const fachThema: Record<string, Record<string, Frage[]>> = {}

    for (const f of alleFragen) {
      const themaRaw = f.thema || 'Allgemein'
      const poolId = (f as { poolId?: string }).poolId || ''
      const hatUnterthema = !!(f as { unterthema?: string }).unterthema

      // Einrichtungsfragen komplett ausblenden — ausser im Demo-Modus, wo sie der einzige Inhalt sind
      const istDemo = useAuthStore.getState().istDemoModus
      if (!istDemo) {
        if (istEinrichtungsfrage(f)) continue
        if (themaRaw === 'Einrichtung' || themaRaw === 'Einrichtungstest') continue
      }

      const fach = f.fach || 'Andere'

      let thema = themaRaw
      // Pool-Fragen: Pool-Titel aus fester Mapping-Tabelle, Topic-Label = Unterthema
      if (!hatUnterthema && poolId) {
        const poolMetaId = poolId.split(':')[0]
        const titel = poolTitel(poolMetaId)
        if (titel) {
          thema = titel
          ;(f as { unterthema?: string }).unterthema = themaRaw
        }
      }

      if (sichtbareFaecher.length > 0 && !sichtbareFaecher.includes(fach)) continue
      if (!fachThema[fach]) fachThema[fach] = {}
      if (!fachThema[fach][thema]) fachThema[fach][thema] = []
      fachThema[fach][thema].push(f)
    }

    for (const [fach, themen] of Object.entries(fachThema)) {
      map[fach] = Object.entries(themen).map(([thema, fragen]) => {
        const unterthemen = [...new Set(
          fragen.map(f => (f as { unterthema?: string }).unterthema).filter(Boolean)
        )].sort() as string[]
        return { fach, thema, unterthemen, fragen, fortschritt: getThemenFortschritt(fragen) }
      }).sort((a, b) => a.thema.localeCompare(b.thema))
    }
    return map
  }, [alleFragen, getThemenFortschritt, sichtbareFaecher, tagsVersion])

  const verfuegbareFaecher = useMemo(() => Object.keys(themenMap).sort(), [themenMap])

  // Sichtbare Themen (abhängig vom Fach-Filter + Sichtbarkeitsfilter)
  const sichtbareThemenListe = useMemo(() => {
    const alleFachThemen = aktiverFach ? (themenMap[aktiverFach] || []) : Object.values(themenMap).flat()

    // Wenn keine Freischaltungen existieren → alle anzeigen (Fallback)
    if (freischaltungen.length === 0) return alleFachThemen

    // Wenn "Alle Themen anzeigen" aktiv → alles zeigen
    if (alleThemenAnzeigen) return alleFachThemen

    // Nur aktive + abgeschlossene Themen anzeigen (nicht_freigeschaltet nur bei "Alle Themen")
    let gefiltert = alleFachThemen
      .filter(info => {
        const status = getStatus(info.fach, info.thema)
        return status === 'aktiv' || status === 'abgeschlossen'
      })
      .map(info => {
        // Unterthemen-Filter: Wenn nur bestimmte Unterthemen aktiv → Fragen filtern
        const aktiveUT = getAktiveUnterthemen(info.fach, info.thema)
        if (!aktiveUT || aktiveUT.length === 0) return info // Alle Unterthemen aktiv
        const gefilterteFragenLocal = info.fragen.filter(f => {
          const ut = (f as { unterthema?: string }).unterthema
          return !ut || aktiveUT.includes(ut) // Fragen ohne Unterthema immer zeigen
        })
        if (gefilterteFragenLocal.length === 0) return null // Keine Fragen übrig → Thema ausblenden
        const gefilteterteUnterthemen = info.unterthemen.filter(ut => aktiveUT.includes(ut))
        return { ...info, fragen: gefilterteFragenLocal, unterthemen: gefilteterteUnterthemen, fortschritt: getThemenFortschritt(gefilterteFragenLocal) }
      })
      .filter((info): info is ThemenInfo => info !== null)

    // Suchtext: Themen + Unterthemen + Fachtitel durchsuchen
    if (suchtext.trim()) {
      const lower = suchtext.toLowerCase().trim()
      gefiltert = (alleThemenAnzeigen ? alleFachThemen : gefiltert).filter(info =>
        info.thema.toLowerCase().includes(lower) ||
        info.fach.toLowerCase().includes(lower) ||
        info.unterthemen.some(ut => ut.toLowerCase().includes(lower)) ||
        info.fragen.some(f => ('fragetext' in f && typeof f.fragetext === 'string') ? f.fragetext.toLowerCase().includes(lower) : false)
      )
    }

    return gefiltert
  }, [themenMap, aktiverFach, freischaltungen, alleThemenAnzeigen, getStatus, suchtext, getAktiveUnterthemen, getThemenFortschritt])

  // Letzte Übung pro Thema (für Sortierung "Zuletzt geübt")
  const letzteUebungProThema = useMemo(() => {
    const map = new Map<string, string>() // "fach|thema" → ISO-Timestamp
    for (const f of Object.values(fortschritte)) {
      if (!f.letzterVersuch) continue
      for (const thema of sichtbareThemenListe) {
        const gehoertZuThema = thema.fragen.some(frage => frage.id === f.fragenId)
        if (gehoertZuThema) {
          const key = `${thema.fach}|${thema.thema}`
          const bisheriger = map.get(key)
          if (!bisheriger || f.letzterVersuch > bisheriger) {
            map.set(key, f.letzterVersuch)
          }
        }
      }
    }
    return map
  }, [sichtbareThemenListe, fortschritte])

  // Themen in Sektionen aufteilen (aktuelle, freigegebene nach Fach, weitere)
  const themenSektionen = useMemo(() => {
    const aktuelle: ThemenInfo[] = []
    const freigegebeneNachFach = new Map<string, ThemenInfo[]>()
    const weitere: ThemenInfo[] = []

    for (const t of sichtbareThemenListe) {
      const status = freischaltungen.length > 0 ? getStatus(t.fach, t.thema) : 'abgeschlossen'
      if (status === 'aktiv') {
        aktuelle.push(t)
      } else if (status === 'abgeschlossen') {
        const liste = freigegebeneNachFach.get(t.fach) ?? []
        liste.push(t)
        freigegebeneNachFach.set(t.fach, liste)
      } else if (status === 'nicht_freigeschaltet') {
        weitere.push(t)
      }
    }

    const sortiereFn = (a: ThemenInfo, b: ThemenInfo) => {
      if (sortierung === 'zuletztGeuebt') {
        const tA = letzteUebungProThema.get(`${a.fach}|${a.thema}`) ?? ''
        const tB = letzteUebungProThema.get(`${b.fach}|${b.thema}`) ?? ''
        if (tA !== tB) return tB.localeCompare(tA) // neueste zuerst
      }
      return a.thema.localeCompare(b.thema)
    }

    aktuelle.sort(sortiereFn)
    for (const [, themen] of freigegebeneNachFach) {
      themen.sort(sortiereFn)
    }
    weitere.sort(sortiereFn)

    const faecherSortiert = [...freigegebeneNachFach.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    return { aktuelle, faecherSortiert, weitere }
  }, [sichtbareThemenListe, freischaltungen, sortierung, letzteUebungProThema, getStatus])

  // Aktives Thema-Detail
  const themaDetail = useMemo(() => {
    if (!aktivesThema) return null
    return sichtbareThemenListe.find(t => t.thema === aktivesThema) || null
  }, [sichtbareThemenListe, aktivesThema])

  // Gefilterte Fragen im aktiven Thema.
  // Die Filter-Sets sind explizite Auswahlmengen: ein leeres Set bedeutet
  // "nichts ausgewählt" (0 Fragen), nicht "alles". Beim Öffnen eines Themas
  // werden sie in Dashboard.oeffneThema() mit allen vorhandenen Werten vorbefüllt.
  const gefilterteFragen = useMemo(() => {
    if (!themaDetail) return []
    return themaDetail.fragen.filter(f => {
      if (!unterthemaFilter.has((f as { unterthema?: string }).unterthema || '')) return false
      if (!schwierigkeitFilter.has(f.schwierigkeit ?? 2)) return false
      if (!typFilter.has(f.typ)) return false
      return true
    })
  }, [themaDetail, unterthemaFilter, schwierigkeitFilter, typFilter])

  // Empfehlungen (erweitert: Freischaltungen + LP-Fokus)
  const empfehlungen = useMemo<Empfehlung[]>(() => {
    if (!user || alleFragen.length === 0) return []
    return berechneEmpfehlungen(
      alleFragen, fortschritte, auftraege, user.email,
      freischaltungen, einstellungen || undefined,
    )
  }, [alleFragen, fortschritte, auftraege, user, freischaltungen, einstellungen])

  return {
    themenMap,
    verfuegbareFaecher,
    sichtbareThemenListe,
    letzteUebungProThema,
    themenSektionen,
    themaDetail,
    gefilterteFragen,
    empfehlungen,
  }
}
