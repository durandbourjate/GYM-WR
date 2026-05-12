import { useMemo } from 'react'
import type { PruefungsConfig } from '../types/pruefung'
import { filtereTestdatenWennDeaktiviert } from '../utils/testdaten/filter'

export interface UseLPConfigFilteringInputs {
  configs: PruefungsConfig[]
  suchtext: string
  filterFach: string[]
  filterTyp: string | null
  filterGefaess: string | null
  sortierung: 'datum' | 'titel' | 'klasse'
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  /** Cluster F.4: Wenn false, werden Test-Configs (id-prefix oder klasse) raus-gefiltert. */
  testdatenSichtbar: boolean
}

export interface UseLPConfigFilteringResult {
  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  summativeConfigs: PruefungsConfig[]
  gefilterteConfigs: PruefungsConfig[]
  formativeConfigs: PruefungsConfig[]
  gefilterteUebungen: PruefungsConfig[]
  letzteFuenf: PruefungsConfig[]
  hatAktiveFilter: boolean
}

export function useLPConfigFiltering(inputs: UseLPConfigFilteringInputs): UseLPConfigFilteringResult {
  const { configs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus, testdatenSichtbar } = inputs

  const hatAktiveFilter = suchtext.length > 0 || filterFach.length > 0 || filterTyp !== null || filterGefaess !== null || filterStatus !== 'aktiv'

  // Verfügbare Fachbereiche und Gefässe dynamisch aus configs
  const verfuegbareFachbereiche = useMemo(() => {
    const faecher = new Set<string>()
    for (const c of configs) for (const fb of c.fachbereiche) faecher.add(fb)
    return [...faecher].sort()
  }, [configs])

  const verfuegbareGefaesse = useMemo(() => {
    const gefaesse = new Set<string>()
    for (const c of configs) if (c.gefaess) gefaesse.add(c.gefaess)
    return [...gefaesse].sort()
  }, [configs])

  // Generische Filter-Funktion für Configs (Prüfungen + Übungen)
  function filtereConfigs(basisConfigs: PruefungsConfig[]): PruefungsConfig[] {
    // Cluster F.4: Testdaten-Filter VOR allen anderen Filtern (single point of entry für alle LP-Listen)
    let result = filtereTestdatenWennDeaktiviert([...basisConfigs], testdatenSichtbar)
    // Status-Filter (Archiv)
    if (filterStatus === 'aktiv') {
      result = result.filter(c => !c.beendetUm)
    } else if (filterStatus === 'archiviert') {
      result = result.filter(c => !!c.beendetUm)
    }
    // Suche
    if (suchtext) {
      const q = suchtext.toLowerCase()
      result = result.filter(c =>
        c.titel.toLowerCase().includes(q) ||
        c.klasse.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    }
    // Fachbereich
    if (filterFach.length > 0) {
      result = result.filter(c => filterFach.some(f => c.fachbereiche.includes(f)))
    }
    // Typ
    if (filterTyp) {
      result = result.filter(c => c.typ === filterTyp)
    }
    // Gefäss
    if (filterGefaess) {
      result = result.filter(c => c.gefaess === filterGefaess)
    }
    // Sortierung
    result.sort((a, b) => {
      if (sortierung === 'datum') return b.datum.localeCompare(a.datum)
      if (sortierung === 'titel') return a.titel.localeCompare(b.titel)
      return a.klasse.localeCompare(b.klasse)
    })
    return result
  }

  // Gefilterte Prüfungen (summativ)
  const summativeConfigs = useMemo(() => configs.filter(c => c.typ !== 'formativ'), [configs])
  const gefilterteConfigs = useMemo(() => filtereConfigs(summativeConfigs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summativeConfigs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus])

  // Gefilterte Übungen (formativ)
  const formativeConfigs = useMemo(() => configs.filter(c => c.typ === 'formativ'), [configs])
  const gefilterteUebungen = useMemo(() => filtereConfigs(formativeConfigs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formativeConfigs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus])

  // Letzte 5 (nach Datum, nur ohne aktive Filter)
  const letzteFuenf = useMemo(() => {
    if (hatAktiveFilter || summativeConfigs.length <= 5) return []
    return [...summativeConfigs].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 5)
  }, [summativeConfigs, hatAktiveFilter])

  return {
    verfuegbareFachbereiche,
    verfuegbareGefaesse,
    summativeConfigs,
    gefilterteConfigs,
    formativeConfigs,
    gefilterteUebungen,
    letzteFuenf,
    hatAktiveFilter,
  }
}
