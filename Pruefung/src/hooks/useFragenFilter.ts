/**
 * Hook für Filter-, Sortier- und Gruppierungslogik der Fragenbank.
 * Extrahiert aus FragenBrowser.tsx.
 */
import { useState, useMemo, useEffect } from 'react'
import { gruppenKey } from '../components/lp/fragenbank/fragenbrowser/gruppenHelfer.ts'
import type { Gruppierung } from '../components/lp/fragenbank/fragenbrowser/gruppenHelfer.ts'
import type { Frage, Fachbereich, BloomStufe } from '../types/fragen.ts'

export type Sortierung = 'thema' | 'bloom' | 'punkte' | 'typ' | 'id'
export type FilterQuelle = 'alle' | 'meine' | 'fachschaft' | 'schule' | 'pool'
export type FilterPoolStatus = 'alle' | 'ungeprueft' | 'pool_geprueft' | 'pruefungstauglich' | 'update'
export type FilterKontext = 'alle' | 'schule' | 'privat'

const SCHUL_FACHBEREICHE = new Set(['VWL', 'BWL', 'Recht', 'Informatik'])

const SEITEN_GROESSE = 30

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
  gefilterteFragen: Frage[]
  sortierteFragen: Frage[]
  gruppierteAnzeige: { key: string; label: string; fragen: Frage[] }[]
  stats: { fachbereiche: Map<string, number>; typen: Map<string, number>; gesamt: number }
  aktiveFilter: number

  // Aktionen
  filterZuruecksetzen: () => void
  seitenGroesse: number
}

export function useFragenFilter(
  alleFragen: Frage[],
  userEmail: string | undefined,
  ladeStatus: 'laden' | 'fertig',
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

  // Verfügbare Themen (nur Thema, ohne Unterthema)
  const verfuegbareThemen = useMemo(() => {
    const themen = new Map<string, number>()
    for (const f of alleFragen) {
      themen.set(f.thema, (themen.get(f.thema) || 0) + 1)
    }
    return Array.from(themen.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [alleFragen])

  // Verfügbare Unterthemen (kaskadierend: nur passend zum gewählten Thema)
  const verfuegbareUnterthemen = useMemo(() => {
    const unterthemen = new Map<string, number>()
    for (const f of alleFragen) {
      if (!f.unterthema) continue
      if (filterThema && f.thema !== filterThema) continue
      unterthemen.set(f.unterthema, (unterthemen.get(f.unterthema) || 0) + 1)
    }
    return Array.from(unterthemen.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [alleFragen, filterThema])

  // Filtern
  const gefilterteFragen = useMemo(() => {
    return alleFragen.filter((f) => {
      // Schule/Privat-Filter
      if (filterKontext === 'schule' && !SCHUL_FACHBEREICHE.has(f.fachbereich)) return false
      if (filterKontext === 'privat' && SCHUL_FACHBEREICHE.has(f.fachbereich)) return false
      if (filterFachbereich && f.fachbereich !== filterFachbereich) return false
      if (filterTyp && f.typ !== filterTyp) return false
      if (filterBloom && f.bloom !== filterBloom) return false
      if (filterThema && f.thema !== filterThema) return false
      if (filterUnterthema && f.unterthema !== filterUnterthema) return false
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
      // Anhang-Filter
      if (filterMitAnhang && (!f.anhaenge || f.anhaenge.length === 0)) return false
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
  }, [alleFragen, filterFachbereich, filterTyp, filterBloom, filterThema, filterUnterthema, filterQuelle, filterPoolStatus, filterMitAnhang, suchtext, userEmail])

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

    const gruppenMap = new Map<string, Frage[]>()
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

  // Statistiken für Header
  const stats = useMemo(() => {
    const fachbereiche = new Map<string, number>()
    const typen = new Map<string, number>()
    for (const f of gefilterteFragen) {
      fachbereiche.set(f.fachbereich, (fachbereiche.get(f.fachbereich) || 0) + 1)
      typen.set(f.typ, (typen.get(f.typ) || 0) + 1)
    }
    return { fachbereiche, typen, gesamt: gefilterteFragen.length }
  }, [gefilterteFragen])

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
    aktiveFilter,
    filterZuruecksetzen,
    seitenGroesse: SEITEN_GROESSE,
  }
}
