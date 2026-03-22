/**
 * Hook für Filter-, Sortier- und Gruppierungslogik der Fragenbank.
 * Extrahiert aus FragenBrowser.tsx.
 */
import { useState, useMemo, useEffect } from 'react'
import { gruppenKey } from '../components/lp/fragenbrowser/gruppenHelfer.ts'
import type { Gruppierung } from '../components/lp/fragenbrowser/gruppenHelfer.ts'
import type { Frage, Fachbereich, BloomStufe } from '../types/fragen.ts'

export type Sortierung = 'thema' | 'bloom' | 'punkte' | 'typ' | 'id'
export type FilterQuelle = 'alle' | 'meine' | 'pool'
export type FilterPoolStatus = 'alle' | 'ungeprueft' | 'pool_geprueft' | 'pruefungstauglich' | 'update'

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
  filterQuelle: FilterQuelle
  setFilterQuelle: (v: FilterQuelle) => void
  filterPoolStatus: FilterPoolStatus
  setFilterPoolStatus: (v: FilterPoolStatus) => void

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
  const [filterQuelle, setFilterQuelle] = useState<FilterQuelle>('alle')
  const [filterPoolStatus, setFilterPoolStatus] = useState<FilterPoolStatus>('alle')

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

  // Verfügbare Themen (für Filter-Dropdown)
  const verfuegbareThemen = useMemo(() => {
    const themen = new Map<string, number>()
    for (const f of alleFragen) {
      const key = f.thema + (f.unterthema ? ` \u203A ${f.unterthema}` : '')
      themen.set(key, (themen.get(key) || 0) + 1)
    }
    return Array.from(themen.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [alleFragen])

  // Filtern
  const gefilterteFragen = useMemo(() => {
    return alleFragen.filter((f) => {
      if (filterFachbereich && f.fachbereich !== filterFachbereich) return false
      if (filterTyp && f.typ !== filterTyp) return false
      if (filterBloom && f.bloom !== filterBloom) return false
      if (filterThema) {
        const key = f.thema + (f.unterthema ? ` \u203A ${f.unterthema}` : '')
        if (key !== filterThema && f.thema !== filterThema) return false
      }
      // Quelle-Filter (zusammengelegt: Meine = mein Autor, Pool = aus Pool)
      if (filterQuelle === 'meine' && userEmail && f.autor && f.autor !== userEmail) return false
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
      if (suchtext) {
        const text = suchtext.toLowerCase()
        const fragetext = 'fragetext' in f ? (f as { fragetext: string }).fragetext : ''
        return (
          f.id.toLowerCase().includes(text) ||
          f.thema.toLowerCase().includes(text) ||
          fragetext.toLowerCase().includes(text) ||
          (f.unterthema || '').toLowerCase().includes(text) ||
          f.tags.some((t) => t.toLowerCase().includes(text))
        )
      }
      return true
    })
  }, [alleFragen, filterFachbereich, filterTyp, filterBloom, filterThema, filterQuelle, filterPoolStatus, suchtext, userEmail])

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
  const aktiveFilter = [filterFachbereich, filterTyp, filterBloom, filterThema, suchtext, filterQuelle !== 'alle' ? filterQuelle : '', filterPoolStatus !== 'alle' ? filterPoolStatus : ''].filter(Boolean).length

  function filterZuruecksetzen(): void {
    setSuchtext('')
    setFilterFachbereich('')
    setFilterTyp('')
    setFilterBloom('')
    setFilterThema('')
    setFilterQuelle('alle')
    setFilterPoolStatus('alle')
  }

  return {
    suchtext, setSuchtext,
    filterFachbereich, setFilterFachbereich,
    filterTyp, setFilterTyp,
    filterBloom, setFilterBloom,
    filterThema, setFilterThema,
    filterQuelle, setFilterQuelle,
    filterPoolStatus, setFilterPoolStatus,
    sortierung, setSortierung,
    gruppierung, setGruppierung,
    aufgeklappteGruppen, setAufgeklappteGruppen,
    angezeigteMenge, setAngezeigteMenge,
    kompaktModus, setKompaktModus,
    verfuegbareThemen,
    gefilterteFragen,
    sortierteFragen,
    gruppierteAnzeige,
    stats,
    aktiveFilter,
    filterZuruecksetzen,
    seitenGroesse: SEITEN_GROESSE,
  }
}
