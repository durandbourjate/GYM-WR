/**
 * Hook für Filter-, Sortier- und Gruppierungslogik der Fragenbank.
 * Extrahiert aus FragenBrowser.tsx.
 */
import { useState, useMemo, useEffect } from 'react'
import { gruppenKey } from '../components/lp/fragenbank/fragenbrowser/gruppenHelfer.ts'
import type { Gruppierung } from '../components/lp/fragenbank/fragenbrowser/gruppenHelfer.ts'
import type { Frage, FrageSummary, Fachbereich, BloomStufe } from '../types/fragen.ts'

/** Typ der sowohl für Frage als auch FrageSummary funktioniert (Filter braucht nur diese Felder) */
type FilterbareFrage = Frage | FrageSummary
import { poolTitel } from '../utils/poolTitelMapping'
import { schulFachbereiche } from '../utils/fachUtils'

export type Sortierung = 'thema' | 'bloom' | 'punkte' | 'typ' | 'id'
export type FilterQuelle = 'alle' | 'meine' | 'fachschaft' | 'schule' | 'pool'
export type FilterPoolStatus = 'alle' | 'ungeprueft' | 'pool_geprueft' | 'pruefungstauglich' | 'update'
export type FilterKontext = 'alle' | 'schule' | 'privat'

const SCHUL_FACHBEREICHE = schulFachbereiche()

const SEITEN_GROESSE = 30

/** Extrahiert Pool-Thema (Pool-Titel) und Unterthema (Topic-Label) für Pool-Fragen.
 *  Pool-Fragen im alten Format haben thema=Topic-Label und kein unterthema.
 *  Erkennung über quellReferenz "Pool: ...", poolId, oder quelle='pool' */
/** Pool-Themen-Mapping: Pool-Titel aus fester Tabelle, Topic-Label als Unterthema */
function poolThemenMapping(f: FilterbareFrage): { thema: string; unterthema: string } {
  const hatUnterthema = !!f.unterthema

  // Pool-Fragen: über poolId identifizieren und Titel aus Mapping-Tabelle
  if (!hatUnterthema && f.poolId) {
    const poolMetaId = (f.poolId || '').split(':')[0]
    const titel = poolTitel(poolMetaId)
    if (titel) {
      return { thema: titel, unterthema: f.thema }
    }
  }

  return { thema: f.thema, unterthema: f.unterthema || '' }
}

interface FragenFilterErgebnis {
  // Filter-State + Setter
  suchtext: string
  setSuchtext: (v: string) => void
  filterFachbereich: Fachbereich | ''
  setFilterFachbereich: (v: Fachbereich | '') => void
  filterTyp: string
  setFilterTyp: (v: string) => void
  filterBloom: BloomStufe | ''
  setFilterBloom: (v: BloomStufe | '') => void
  filterThema: string
  setFilterThema: (v: string) => void
  filterUnterthema: string
  setFilterUnterthema: (v: string) => void
  filterQuelle: FilterQuelle
  setFilterQuelle: (v: FilterQuelle) => void
  filterPoolStatus: FilterPoolStatus
  setFilterPoolStatus: (v: FilterPoolStatus) => void
  filterMitAnhang: boolean
  setFilterMitAnhang: (v: boolean) => void
  filterKontext: FilterKontext
  setFilterKontext: (v: FilterKontext) => void

  // Ansicht-State + Setter
  sortierung: Sortierung
  setSortierung: (v: Sortierung) => void
  gruppierung: Gruppierung
  setGruppierung: (v: Gruppierung) => void
  aufgeklappteGruppen: Set<string>
  setAufgeklappteGruppen: React.Dispatch<React.SetStateAction<Set<string>>>
  angezeigteMenge: number
  setAngezeigteMenge: React.Dispatch<React.SetStateAction<number>>
  kompaktModus: boolean
  setKompaktModus: (v: boolean) => void

  // Berechnete Werte
  verfuegbareThemen: [string, number][]
  verfuegbareUnterthemen: [string, number][]
  gefilterteFragen: FilterbareFrage[]
  sortierteFragen: FilterbareFrage[]
  gruppierteAnzeige: { key: string; label: string; fragen: FilterbareFrage[] }[]
  stats: { fachbereiche: Map<string, number>; typen: Map<string, number>; gesamt: number }
  alleStats: { fachbereiche: Map<string, number>; typen: Map<string, number>; gesamt: number }
  aktiveFilter: number

  // Aktionen
  filterZuruecksetzen: () => void
  seitenGroesse: number
}

export function useFragenFilter(
  alleFragen: FilterbareFrage[],
  userEmail: string | undefined,
  ladeStatus: 'laden' | 'fertig',
  istDemoModus: boolean = false,
): FragenFilterErgebnis {
  // Filter
  const [suchtext, setSuchtext] = useState('')
  const [filterFachbereich, setFilterFachbereich] = useState<Fachbereich | ''>('')
  const [filterTyp, setFilterTyp] = useState<string>('')
  const [filterBloom, setFilterBloom] = useState<BloomStufe | ''>('')
  const [filterThema, setFilterThema] = useState('')
  const [filterUnterthema, setFilterUnterthema] = useState('')
  const [filterQuelle, setFilterQuelle] = useState<FilterQuelle>('alle')
  const [filterPoolStatus, setFilterPoolStatus] = useState<FilterPoolStatus>('alle')
  const [filterMitAnhang, setFilterMitAnhang] = useState(false)
  const [filterKontext, setFilterKontext] = useState<FilterKontext>('alle')

  // Ansicht
  const [sortierung, setSortierung] = useState<Sortierung>('thema')
  const [gruppierung, setGruppierung] = useState<Gruppierung>('fachbereich')
  const [aufgeklappteGruppen, setAufgeklappteGruppen] = useState<Set<string>>(new Set())
  const [angezeigteMenge, setAngezeigteMenge] = useState(SEITEN_GROESSE)
  const [kompaktModus, setKompaktModus] = useState(false)

  // Alle Gruppen initial aufklappen
  useEffect(() => {
    if (ladeStatus === 'fertig' && aufgeklappteGruppen.size === 0) {
      const gruppen = new Set(alleFragen.map((f) => gruppenKey(f, gruppierung)))
      setAufgeklappteGruppen(gruppen)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — aufgeklappteGruppen absichtlich ausgeschlossen (wuerde Loop verursachen)
  }, [ladeStatus, alleFragen, gruppierung])

  // Verfügbare Themen — kaskadierend nach Fachbereich-Filter
  const verfuegbareThemen = useMemo(() => {
    const themen = new Map<string, number>()
    for (const f of alleFragen) {
      if (filterFachbereich && f.fachbereich !== filterFachbereich) continue
      const { thema } = poolThemenMapping(f)
      themen.set(thema, (themen.get(thema) || 0) + 1)
    }
    return Array.from(themen.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [alleFragen, filterFachbereich])

  // Verfügbare Unterthemen — kaskadierend nach Fachbereich + Thema
  const verfuegbareUnterthemen = useMemo(() => {
    const unterthemen = new Map<string, number>()
    for (const f of alleFragen) {
      if (filterFachbereich && f.fachbereich !== filterFachbereich) continue
      const mapped = poolThemenMapping(f)
      if (!mapped.unterthema) continue
      if (filterThema && mapped.thema !== filterThema) continue
      unterthemen.set(mapped.unterthema, (unterthemen.get(mapped.unterthema) || 0) + 1)
    }
    return Array.from(unterthemen.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [alleFragen, filterFachbereich, filterThema])

  // Filtern
  const gefilterteFragen = useMemo(() => {
    return alleFragen.filter((f) => {
      // Einrichtungsfragen ausblenden — ausser im Demo-Modus, wo sie der einzige Inhalt sind
      const tags = f.tags || []
      if (!istDemoModus && tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung')) return false

      // Schule/Privat-Filter
      if (filterKontext === 'schule' && !SCHUL_FACHBEREICHE.has(f.fachbereich)) return false
      if (filterKontext === 'privat' && SCHUL_FACHBEREICHE.has(f.fachbereich)) return false
      if (filterFachbereich && f.fachbereich !== filterFachbereich) return false
      if (filterTyp && f.typ !== filterTyp) return false
      if (filterBloom && f.bloom !== filterBloom) return false
      // Thema/Unterthema: Pool-Mapping anwenden
      const mapped = poolThemenMapping(f)
      if (filterThema && mapped.thema !== filterThema) return false
      if (filterUnterthema && mapped.unterthema !== filterUnterthema) return false
      // Quelle-Filter (zusammengelegt: Meine = mein Autor, Pool = aus Pool)
      if (filterQuelle === 'meine' && userEmail && f.autor && f.autor !== userEmail) return false
      if (filterQuelle === 'fachschaft' && f.geteilt !== 'fachschaft') return false
      if (filterQuelle === 'schule' && f.geteilt !== 'schule') return false
      if (filterQuelle === 'pool' && f.quelle !== 'pool') return false
      // Pool-Status-Filter
      if (filterPoolStatus !== 'alle') {
        if (f.quelle !== 'pool') return false
        switch (filterPoolStatus) {
          case 'ungeprueft': if (f.poolGeprueft || f.pruefungstauglich) return false; break
          case 'pool_geprueft': if (!f.poolGeprueft || f.pruefungstauglich) return false; break
          case 'pruefungstauglich': if (!f.pruefungstauglich) return false; break
          case 'update': if (!f.poolUpdateVerfuegbar) return false; break
        }
      }
      // Anhang-Filter (Summary hat hatAnhang boolean, Frage hat anhaenge Array)
      if (filterMitAnhang) {
        const hatAnhang = 'hatAnhang' in f ? (f as FrageSummary).hatAnhang : (Array.isArray((f as Frage).anhaenge) && (f as Frage).anhaenge!.length > 0)
        if (!hatAnhang) return false
      }
      if (suchtext) {
        const text = suchtext.toLowerCase()
        const fragetext = 'fragetext' in f ? (f as { fragetext: string }).fragetext : ''
        return (
          f.id.toLowerCase().includes(text) ||
          f.thema.toLowerCase().includes(text) ||
          fragetext.toLowerCase().includes(text) ||
          (f.unterthema || '').toLowerCase().includes(text) ||
          f.tags.some((t) => (typeof t === 'string' ? t : t.name).toLowerCase().includes(text))
        )
      }
      return true
    })
  }, [alleFragen, filterFachbereich, filterTyp, filterBloom, filterThema, filterUnterthema, filterQuelle, filterPoolStatus, filterMitAnhang, suchtext, userEmail, filterKontext, istDemoModus])

  // Sortieren
  const sortierteFragen = useMemo(() => {
    const sorted = [...gefilterteFragen]
    sorted.sort((a, b) => {
      switch (sortierung) {
        case 'thema': return a.thema.localeCompare(b.thema) || a.id.localeCompare(b.id)
        case 'bloom': return a.bloom.localeCompare(b.bloom) || a.id.localeCompare(b.id)
        case 'punkte': return b.punkte - a.punkte || a.id.localeCompare(b.id)
        case 'typ': return a.typ.localeCompare(b.typ) || a.id.localeCompare(b.id)
        case 'id': return a.id.localeCompare(b.id)
        default: return 0
      }
    })
    return sorted
  }, [gefilterteFragen, sortierung])

  // Gruppieren
  const gruppierteAnzeige = useMemo(() => {
    if (gruppierung === 'keine') {
      return [{ key: '', label: '', fragen: sortierteFragen.slice(0, angezeigteMenge) }]
    }

    const gruppenMap = new Map<string, FilterbareFrage[]>()
    for (const f of sortierteFragen) {
      const key = gruppenKey(f, gruppierung)
      if (!gruppenMap.has(key)) gruppenMap.set(key, [])
      gruppenMap.get(key)!.push(f)
    }

    // Gruppen sortieren
    const keys = Array.from(gruppenMap.keys()).sort()
    return keys.map((key) => ({
      key,
      label: key,
      fragen: gruppenMap.get(key)!,
    }))
  }, [sortierteFragen, gruppierung, angezeigteMenge])

  // Statistiken für Header (gefiltert — zeigt Anzahl der aktuell sichtbaren Fragen)
  const stats = useMemo(() => {
    const fachbereiche = new Map<string, number>()
    const typen = new Map<string, number>()
    for (const f of gefilterteFragen) {
      fachbereiche.set(f.fachbereich, (fachbereiche.get(f.fachbereich) || 0) + 1)
      typen.set(f.typ, (typen.get(f.typ) || 0) + 1)
    }
    return { fachbereiche, typen, gesamt: gefilterteFragen.length }
  }, [gefilterteFragen])

  // Ungefilterte Statistiken — für Dropdown-Optionen, damit alle Werte immer sichtbar bleiben
  const alleStats = useMemo(() => {
    const fachbereiche = new Map<string, number>()
    const typen = new Map<string, number>()
    for (const f of alleFragen) {
      fachbereiche.set(f.fachbereich, (fachbereiche.get(f.fachbereich) || 0) + 1)
      typen.set(f.typ, (typen.get(f.typ) || 0) + 1)
    }
    return { fachbereiche, typen, gesamt: alleFragen.length }
  }, [alleFragen])

  // Aktive Filter zählen
  const aktiveFilter = [filterFachbereich, filterTyp, filterBloom, filterThema, filterUnterthema, suchtext, filterQuelle !== 'alle' ? filterQuelle : '', filterPoolStatus !== 'alle' ? filterPoolStatus : '', filterMitAnhang ? 'anhang' : '', filterKontext !== 'alle' ? filterKontext : ''].filter(Boolean).length

  function filterZuruecksetzen(): void {
    setSuchtext('')
    setFilterFachbereich('')
    setFilterTyp('')
    setFilterBloom('')
    setFilterThema('')
    setFilterUnterthema('')
    setFilterQuelle('alle')
    setFilterPoolStatus('alle')
    setFilterMitAnhang(false)
    setFilterKontext('alle')
  }

  return {
    suchtext, setSuchtext,
    filterFachbereich, setFilterFachbereich,
    filterTyp, setFilterTyp,
    filterBloom, setFilterBloom,
    filterThema, setFilterThema,
    filterUnterthema, setFilterUnterthema,
    filterQuelle, setFilterQuelle,
    filterPoolStatus, setFilterPoolStatus,
    filterMitAnhang, setFilterMitAnhang,
    filterKontext, setFilterKontext,
    sortierung, setSortierung,
    gruppierung, setGruppierung,
    aufgeklappteGruppen, setAufgeklappteGruppen,
    angezeigteMenge, setAngezeigteMenge,
    kompaktModus, setKompaktModus,
    verfuegbareThemen,
    verfuegbareUnterthemen,
    gefilterteFragen,
    sortierteFragen,
    gruppierteAnzeige,
    stats,
    alleStats,
    aktiveFilter,
    filterZuruecksetzen,
    seitenGroesse: SEITEN_GROESSE,
  }
}
