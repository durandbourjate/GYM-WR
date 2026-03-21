import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import { demoFragen } from '../../data/demoFragen.ts'
import { fachbereichFarbe, typLabel } from '../../utils/fachbereich.ts'
import type { Frage, Fachbereich, BloomStufe } from '../../types/fragen.ts'
import FragenEditor from './frageneditor/FragenEditor.tsx'
import FragenImport from './FragenImport.tsx'
import BatchExportDialog from './BatchExportDialog.tsx'

interface Props {
  onHinzufuegen: (frageIds: string[]) => void
  onEntfernen?: (frageId: string) => void
  onSchliessen: () => void
  bereitsVerwendet: string[]
  /** Wenn gesetzt, wird der Editor für diese Frage sofort geöffnet */
  initialEditFrageId?: string
  /** Titel der Ziel-Prüfung (für die Ziel-Leiste) */
  zielPruefungTitel?: string
  /** Titel des Ziel-Abschnitts (für die Ziel-Leiste) */
  zielAbschnittTitel?: string
}

type Sortierung = 'thema' | 'bloom' | 'punkte' | 'typ' | 'id'
type Gruppierung = 'keine' | 'fachbereich' | 'thema' | 'typ' | 'bloom'

const SEITEN_GROESSE = 30

/** Pool-Badges: Zeigt Quelle und Status von Pool-Fragen */
function PoolBadges({ frage }: { frage: Frage }) {
  if (frage.quelle !== 'pool') return null
  return (
    <span className="inline-flex gap-1">
      {frage.poolUpdateVerfuegbar && (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse">
          Update
        </span>
      )}
      {frage.pruefungstauglich ? (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          Prüfungstauglich
        </span>
      ) : frage.poolGeprueft ? (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
          Pool ✓
        </span>
      ) : (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
          Pool / ungeprüft
        </span>
      )}
    </span>
  )
}

/** Overlay-Panel zum Durchsuchen und Auswählen von Fragen aus der Fragenbank */
export default function FragenBrowser({ onHinzufuegen, onEntfernen, onSchliessen, bereitsVerwendet, initialEditFrageId, zielPruefungTitel, zielAbschnittTitel }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const panelRef = useRef<HTMLDivElement>(null)
  const listeRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen, damit Overlay unterhalb des Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  // Resizable Panel
  const [panelBreite, setPanelBreite] = useState(1008)

  const handleZiehStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelBreite
    function onMove(ev: MouseEvent) {
      const diff = startX - ev.clientX
      setPanelBreite(Math.max(600, Math.min(startW + diff, window.innerWidth * 0.9)))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelBreite])

  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig'>('laden')

  // Set für schnellen Lookup der bereits verwendeten Fragen
  const bereitsVerwendetSet = useMemo(() => new Set(bereitsVerwendet), [bereitsVerwendet])

  // Filter
  const [suchtext, setSuchtext] = useState('')
  const [filterFachbereich, setFilterFachbereich] = useState<Fachbereich | ''>('')
  const [filterTyp, setFilterTyp] = useState<string>('')
  const [filterBloom, setFilterBloom] = useState<BloomStufe | ''>('')
  const [filterThema, setFilterThema] = useState('')
  const [filterQuelle, setFilterQuelle] = useState<'alle' | 'meine' | 'pool'>('alle')
  const [filterPoolStatus, setFilterPoolStatus] = useState<'alle' | 'ungeprueft' | 'pool_geprueft' | 'pruefungstauglich' | 'update'>('alle')

  // Editor / Import
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editFrage, setEditFrage] = useState<Frage | null>(null)
  const [zeigImport, setZeigImport] = useState(false)
  const [zeigBatchExport, setZeigBatchExport] = useState(false)
  const [loeschKandidat, setLoeschKandidat] = useState<Frage | null>(null)

  // Ansicht
  const [sortierung, setSortierung] = useState<Sortierung>('thema')
  const [gruppierung, setGruppierung] = useState<Gruppierung>('fachbereich')
  const [aufgeklappteGruppen, setAufgeklappteGruppen] = useState<Set<string>>(new Set())
  const [angezeigteMenge, setAngezeigteMenge] = useState(SEITEN_GROESSE)
  const [kompaktModus, setKompaktModus] = useState(false)

  // Fragen laden
  useEffect(() => {
    async function lade(): Promise<void> {
      if (istDemoModus || !apiService.istKonfiguriert()) {
        setAlleFragen(demoFragen)
        setLadeStatus('fertig')
        return
      }

      if (!user) return
      const result = await apiService.ladeFragenbank(user.email)
      if (result && result.length > 0) {
        // Duplikate entfernen (Backend könnte gleiche ID mehrfach liefern)
        const gesehen = new Set<string>()
        const eindeutig = result.filter((f) => {
          if (gesehen.has(f.id)) {
            console.warn(`[FragenBrowser] Duplikat-ID übersprungen: ${f.id}`)
            return false
          }
          gesehen.add(f.id)
          return true
        })
        setAlleFragen(eindeutig)
      } else {
        console.warn('[FragenBrowser] Backend-Fragen nicht ladbar — zeige Demo-Fragen')
        setAlleFragen(demoFragen)
      }
      setLadeStatus('fertig')
    }
    lade()
  }, [user, istDemoModus])

  // Wenn initialEditFrageId gesetzt, Editor sofort öffnen sobald Fragen geladen
  useEffect(() => {
    if (ladeStatus === 'fertig' && initialEditFrageId) {
      const frage = alleFragen.find((f) => f.id === initialEditFrageId)
      if (frage) {
        setEditFrage(frage)
        setZeigEditor(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — Nur beim ersten Laden ausführen
  }, [ladeStatus])

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
      const key = f.thema + (f.unterthema ? ` › ${f.unterthema}` : '')
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
        const key = f.thema + (f.unterthema ? ` › ${f.unterthema}` : '')
        if (key !== filterThema && f.thema !== filterThema) return false
      }
      // Quelle-Filter (zusammengelegt: Meine = mein Autor, Pool = aus Pool)
      if (filterQuelle === 'meine' && user && f.autor && f.autor !== user.email) return false
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
  }, [alleFragen, filterFachbereich, filterTyp, filterBloom, filterThema, filterQuelle, filterPoolStatus, suchtext, user])

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

  /** Ein Klick: Frage hinzufügen oder entfernen */
  function toggleFrageInPruefung(frageId: string): void {
    if (bereitsVerwendetSet.has(frageId)) {
      onEntfernen?.(frageId)
    } else {
      onHinzufuegen([frageId])
    }
  }

  function toggleGruppe(key: string): void {
    setAufgeklappteGruppen((prev) => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }

  function filterZuruecksetzen(): void {
    setSuchtext('')
    setFilterFachbereich('')
    setFilterTyp('')
    setFilterBloom('')
    setFilterThema('')
    setFilterQuelle('alle')
    setFilterPoolStatus('alle')
  }

  async function handleFrageGespeichert(neueFrage: Frage): Promise<void> {
    // Zur lokalen Liste hinzufügen
    setAlleFragen((prev) => {
      const ohneAlt = prev.filter((f) => f.id !== neueFrage.id)
      return [...ohneAlt, neueFrage]
    })
    setZeigEditor(false)
    setEditFrage(null)

    // Ans Backend senden (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.speichereFrage(user.email, neueFrage)
      if (!ok) {
        console.warn('[FragenBrowser] Frage lokal hinzugefügt, aber Backend-Speichern fehlgeschlagen')
      }
    }
  }

  async function handleImportFragen(importierteFragen: Frage[]): Promise<void> {
    // Zur lokalen Liste hinzufügen
    setAlleFragen((prev) => [...prev, ...importierteFragen])
    setZeigImport(false)

    // Ans Backend senden (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      for (const frage of importierteFragen) {
        const ok = await apiService.speichereFrage(user.email, frage)
        if (!ok) {
          console.warn(`[FragenBrowser] Import: Backend-Speichern fehlgeschlagen für ${frage.id}`)
        }
      }
    }
  }

  async function handleFrageLoeschen(): Promise<void> {
    if (!loeschKandidat) return
    // Lokal entfernen
    setAlleFragen(prev => prev.filter(f => f.id !== loeschKandidat.id))
    const frage = loeschKandidat
    setLoeschKandidat(null)
    // Backend löschen (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.loescheFrage(user.email, frage.id, frage.fachbereich)
      if (!ok) {
        console.warn('[FragenBrowser] Frage lokal gelöscht, aber Backend-Löschen fehlgeschlagen')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-none">
      {/* Backdrop */}
      <div className="absolute left-0 right-0 bottom-0 bg-black/40 pointer-events-auto" style={{ top: headerH }} onClick={onSchliessen} />

      {/* Panel (rechts) */}
      <div ref={panelRef} className="absolute right-0 bottom-0 bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto overflow-hidden" style={{ top: headerH, width: panelBreite, maxWidth: '90vw' }} onWheel={(e) => e.stopPropagation()}>
        {/* Drag-Handle zum Resize */}
        <div
          onMouseDown={handleZiehStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-slate-400/50 active:bg-slate-400/70 transition-colors"
          title="Breite anpassen"
        />
        {/* Header — Scroll an Fragen-Liste weiterleiten */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700" onWheel={(e) => { listeRef.current?.scrollBy(0, e.deltaY) }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Fragenbank
              </h2>
              {ladeStatus === 'fertig' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {stats.gesamt} Frage{stats.gesamt !== 1 ? 'n' : ''}
                  {aktiveFilter > 0 && ` (${aktiveFilter} Filter aktiv)`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditFrage(null); setZeigEditor(true) }}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Neue Frage erstellen"
              >
                + Neue Frage
              </button>
              <button
                onClick={() => setZeigBatchExport(true)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Mehrere Fragen in Pools exportieren"
              >
                ↑ Pool-Export
              </button>
              <button
                onClick={() => setZeigImport(true)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Fragen via KI aus Text importieren"
              >
                Import via KI
              </button>
              <button
                onClick={() => {
                  const json = JSON.stringify(gefilterteFragen, null, 2)
                  const blob = new Blob([json], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const datum = new Date().toISOString().slice(0, 10)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `fragenbank_export_${datum}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Alle gefilterten Fragen als JSON exportieren"
              >
                Export
              </button>
              <button
                onClick={onSchliessen}
                className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

          {/* Ziel-Leiste */}
          {zielPruefungTitel && (
            <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-3 text-sm text-green-700 dark:text-green-300">
              Ziel: <strong>{zielPruefungTitel}</strong>
              {zielAbschnittTitel && <> → {zielAbschnittTitel}</>}
            </div>
          )}

          {/* Suche */}
          <input
            type="text"
            value={suchtext}
            onChange={(e) => { setSuchtext(e.target.value); setAngezeigteMenge(SEITEN_GROESSE) }}
            placeholder="Suche nach ID, Thema, Fragetext, Tags..."
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          {/* Filter-Zeile */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <select
              value={filterFachbereich}
              onChange={(e) => { setFilterFachbereich(e.target.value as Fachbereich | ''); setAngezeigteMenge(SEITEN_GROESSE) }}
              className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="">Fachbereich</option>
              <option value="VWL">VWL ({stats.fachbereiche.get('VWL') ?? 0})</option>
              <option value="BWL">BWL ({stats.fachbereiche.get('BWL') ?? 0})</option>
              <option value="Recht">Recht ({stats.fachbereiche.get('Recht') ?? 0})</option>
            </select>
            <select
              value={filterTyp}
              onChange={(e) => { setFilterTyp(e.target.value); setAngezeigteMenge(SEITEN_GROESSE) }}
              className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="">Typ</option>
              <option value="mc">MC ({stats.typen.get('mc') ?? 0})</option>
              <option value="freitext">Freitext ({stats.typen.get('freitext') ?? 0})</option>
              <option value="lueckentext">Lückentext ({stats.typen.get('lueckentext') ?? 0})</option>
              <option value="zuordnung">Zuordnung ({stats.typen.get('zuordnung') ?? 0})</option>
              <option value="richtigfalsch">Richtig/Falsch ({stats.typen.get('richtigfalsch') ?? 0})</option>
              <option value="berechnung">Berechnung ({stats.typen.get('berechnung') ?? 0})</option>
              <option value="buchungssatz">Buchungssatz ({stats.typen.get('buchungssatz') ?? 0})</option>
              <option value="tkonto">T-Konto ({stats.typen.get('tkonto') ?? 0})</option>
              <option value="kontenbestimmung">Kontenbestimmung ({stats.typen.get('kontenbestimmung') ?? 0})</option>
              <option value="bilanzstruktur">Bilanz/ER ({stats.typen.get('bilanzstruktur') ?? 0})</option>
              <option value="aufgabengruppe">Aufgabengruppe ({stats.typen.get('aufgabengruppe') ?? 0})</option>
            </select>
            <select
              value={filterBloom}
              onChange={(e) => { setFilterBloom(e.target.value as BloomStufe | ''); setAngezeigteMenge(SEITEN_GROESSE) }}
              className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="">Bloom</option>
              {['K1', 'K2', 'K3', 'K4', 'K5', 'K6'].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {/* Quellen-Filter (Alle / Meine / Pool) */}
            <select
              value={filterQuelle}
              onChange={(e) => { setFilterQuelle(e.target.value as typeof filterQuelle); if (e.target.value === 'meine') setFilterPoolStatus('alle'); setAngezeigteMenge(SEITEN_GROESSE) }}
              className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="alle">Alle Quellen</option>
              <option value="meine">Meine</option>
              <option value="pool">Pool</option>
            </select>

            {filterQuelle !== 'meine' && (
              <select
                value={filterPoolStatus}
                onChange={(e) => { setFilterPoolStatus(e.target.value as typeof filterPoolStatus); setAngezeigteMenge(SEITEN_GROESSE) }}
                className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="alle">Alle Status</option>
                <option value="ungeprueft">Ungeprüft</option>
                <option value="pool_geprueft">Pool ✓</option>
                <option value="pruefungstauglich">Prüfungstauglich</option>
                <option value="update">Update verfügbar</option>
              </select>
            )}

            {verfuegbareThemen.length > 1 && (
              <select
                value={filterThema}
                onChange={(e) => { setFilterThema(e.target.value); setAngezeigteMenge(SEITEN_GROESSE) }}
                className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer max-w-[180px]"
              >
                <option value="">Thema</option>
                {verfuegbareThemen.map(([thema, anzahl]) => (
                  <option key={thema} value={thema}>{thema} ({anzahl})</option>
                ))}
              </select>
            )}

            {/* Separator */}
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />

            {/* Gruppierung */}
            <select
              value={gruppierung}
              onChange={(e) => { setGruppierung(e.target.value as Gruppierung); setAufgeklappteGruppen(new Set()) }}
              className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="keine">Keine Gruppierung</option>
              <option value="fachbereich">Nach Fachbereich</option>
              <option value="thema">Nach Thema</option>
              <option value="typ">Nach Typ</option>
              <option value="bloom">Nach Bloom-Stufe</option>
            </select>

            {/* Sortierung */}
            <select
              value={sortierung}
              onChange={(e) => setSortierung(e.target.value as Sortierung)}
              className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="thema">Sort: Thema</option>
              <option value="id">Sort: ID</option>
              <option value="bloom">Sort: Bloom</option>
              <option value="punkte">Sort: Punkte ↓</option>
              <option value="typ">Sort: Typ</option>
            </select>

            {/* Kompakt-Toggle */}
            <button
              onClick={() => setKompaktModus(!kompaktModus)}
              className={`text-xs px-2 py-1.5 rounded-lg border transition-colors cursor-pointer
                ${kompaktModus
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              title={kompaktModus ? 'Detailansicht' : 'Kompaktansicht'}
            >
              {kompaktModus ? '☰' : '▤'}
            </button>

            {/* Filter zurücksetzen */}
            {aktiveFilter > 0 && (
              <button
                onClick={filterZuruecksetzen}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-auto"
              >
                Filter ×
              </button>
            )}
          </div>
        </div>

        {/* Fragen-Liste */}
        <div ref={listeRef} className="flex-1 overflow-auto">
          {ladeStatus === 'laden' && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Fragenbank wird geladen...
            </p>
          )}

          {ladeStatus === 'fertig' && gefilterteFragen.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Keine Fragen gefunden.
            </p>
          )}

          {ladeStatus === 'fertig' && gefilterteFragen.length > 0 && (
            <div>
              {gruppierteAnzeige.map((gruppe) => {
                const istAufgeklappt = gruppierung === 'keine' || aufgeklappteGruppen.has(gruppe.key)
                const inPruefungInGruppe = gruppe.fragen.filter((f) => bereitsVerwendetSet.has(f.id)).length

                return (
                  <div key={gruppe.key || '_alle'}>
                    {/* Gruppen-Header */}
                    {gruppierung !== 'keine' && (
                      <div
                        className="sticky top-0 z-10 flex items-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600 cursor-pointer select-none"
                        onClick={() => toggleGruppe(gruppe.key)}
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-4">
                          {istAufgeklappt ? '▼' : '▶'}
                        </span>
                        <span className={`text-sm font-semibold ${gruppenLabelFarbe(gruppe.key, gruppierung)}`}>
                          {gruppenLabel(gruppe.key, gruppierung)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {gruppe.fragen.length}
                          {inPruefungInGruppe > 0 && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">({inPruefungInGruppe} in Prüfung)</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Fragen in Gruppe */}
                    {istAufgeklappt && (
                      <div className={kompaktModus ? '' : 'px-4 py-2 space-y-1.5'}>
                        {gruppe.fragen.map((frage) => (
                          kompaktModus
                            ? <KompaktZeile
                                key={frage.id}
                                frage={frage}
                                istInPruefung={bereitsVerwendetSet.has(frage.id)}
                                onToggle={() => toggleFrageInPruefung(frage.id)}
                                onEdit={() => { setEditFrage(frage); setZeigEditor(true) }}
                                zeigeGruppierung={gruppierung}
                              />
                            : <DetailKarte
                                key={frage.id}
                                frage={frage}
                                istInPruefung={bereitsVerwendetSet.has(frage.id)}
                                onToggle={() => toggleFrageInPruefung(frage.id)}
                                onEdit={() => { setEditFrage(frage); setZeigEditor(true) }}
                                onLoeschen={() => setLoeschKandidat(frage)}
                              />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* "Mehr laden" wenn keine Gruppierung */}
              {gruppierung === 'keine' && angezeigteMenge < sortierteFragen.length && (
                <div className="px-5 py-4 text-center">
                  <button
                    onClick={() => setAngezeigteMenge((p) => p + SEITEN_GROESSE)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Weitere {Math.min(SEITEN_GROESSE, sortierteFragen.length - angezeigteMenge)} von {sortierteFragen.length} laden
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fragen-Editor Overlay */}
      {zeigEditor && (
        <FragenEditor
          frage={editFrage}
          onSpeichern={handleFrageGespeichert}
          onAbbrechen={() => { setZeigEditor(false); setEditFrage(null) }}
        />
      )}

      {/* Lösch-Bestätigung (pointer-events-auto nötig weil Eltern-Container pointer-events-none hat) */}
      {loeschKandidat && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 pointer-events-auto" onClick={() => setLoeschKandidat(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold dark:text-white mb-2">Frage löschen?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <strong>{loeschKandidat.id}</strong> · {loeschKandidat.fachbereich} · {typLabel(loeschKandidat.typ)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {'fragetext' in loeschKandidat
                ? (loeschKandidat as { fragetext: string }).fragetext?.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120)
                : ''}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLoeschKandidat(null)}
                className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={handleFrageLoeschen}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Overlay */}
      {zeigImport && (
        <FragenImport
          onImportiert={handleImportFragen}
          onSchliessen={() => setZeigImport(false)}
        />
      )}

      {/* Batch-Export Overlay */}
      {zeigBatchExport && (
        <BatchExportDialog
          fragen={gefilterteFragen}
          onSchliessen={() => setZeigBatchExport(false)}
          onErfolg={(updates) => {
            // Pool-IDs in lokaler Fragenliste aktualisieren
            setAlleFragen(prev => prev.map(f => {
              const upd = updates.find(u => u.frageId === f.id)
              if (!upd) return f
              return { ...f, poolId: upd.poolId, quelle: 'pool' as const, poolContentHash: upd.poolContentHash }
            }))
          }}
        />
      )}
    </div>
  )
}

// === SUB-KOMPONENTEN ===

/** Kompakte Zeile für grosse Listen */
function KompaktZeile({ frage, istInPruefung, onToggle, onEdit, zeigeGruppierung }: {
  frage: Frage
  istInPruefung: boolean
  onToggle: () => void
  onEdit: () => void
  zeigeGruppierung: Gruppierung
}) {
  return (
    <div
      onClick={onEdit}
      className={`flex items-center gap-2 px-5 py-1.5 text-sm border-b transition-colors cursor-pointer
        ${istInPruefung
          ? 'border-l-4 border-l-green-500 border-b-slate-100 dark:border-b-slate-700/50 bg-green-50/50 dark:bg-green-900/10'
          : 'border-l-4 border-l-transparent border-b-slate-100 dark:border-b-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30'
        }`}
    >
      {/* +/– Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={`w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center shrink-0 transition-colors cursor-pointer
          ${istInPruefung
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        title={istInPruefung ? 'Aus Prüfung entfernen' : 'Zur Prüfung hinzufügen'}
      >
        {istInPruefung ? '–' : '+'}
      </button>

      {/* ID */}
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 w-28 truncate shrink-0">
        {frage.id}
      </span>

      {/* Fachbereich-Badge (nur wenn nicht nach Fachbereich gruppiert) */}
      {zeigeGruppierung !== 'fachbereich' && (
        <span className={`px-1 py-0.5 text-[10px] rounded shrink-0 ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
      )}
      <PoolBadges frage={frage} />

      {/* Typ */}
      <span className="text-[10px] px-1 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded shrink-0">
        {typLabel(frage.typ)}
      </span>

      {/* Bloom + Punkte */}
      <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
        {frage.bloom} · {frage.punkte}P.
      </span>

      {/* Thema */}
      <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">
        {frage.thema}{frage.unterthema ? ` › ${frage.unterthema}` : ''}
      </span>

      {istInPruefung && (
        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded shrink-0 font-medium">
          ✓ In Prüfung
        </span>
      )}
    </div>
  )
}

/** Detaillierte Karte mit Fragetext-Vorschau */
function DetailKarte({ frage, istInPruefung, onToggle, onEdit, onLoeschen }: {
  frage: Frage
  istInPruefung: boolean
  onToggle: () => void
  onEdit: () => void
  onLoeschen: () => void
}) {
  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''

  return (
    <div
      onClick={onEdit}
      className={`p-3 rounded-lg border transition-colors cursor-pointer group
        ${istInPruefung
          ? 'border-l-4 border-l-green-500 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* +/– Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer
            ${istInPruefung
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          title={istInPruefung ? 'Aus Prüfung entfernen' : 'Zur Prüfung hinzufügen'}
        >
          {istInPruefung ? '–' : '+'}
        </button>
        <div className="flex-1 min-w-0">
          {/* ID + Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {frage.id}
            </span>
            <span className={`px-1.5 py-0.5 text-xs rounded ${fachbereichFarbe(frage.fachbereich)}`}>
              {frage.fachbereich}
            </span>
            <PoolBadges frage={frage} />
            <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              {typLabel(frage.typ)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {frage.bloom} · {frage.punkte}P.
            </span>
            {istInPruefung && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-medium">
                ✓ In Prüfung
              </span>
            )}
          </div>

          {/* Fragetext (gekürzt) */}
          {fragetext && (
            <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
              {fragetext.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 200)}
            </p>
          )}

          {/* Thema + Tags + Sharing */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {frage.thema}{frage.unterthema ? ` › ${frage.unterthema}` : ''}
            </span>
            {frage.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded"
              >
                {tag}
              </span>
            ))}
            {frage.geteilt === 'schule' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                Geteilt{frage.geteiltVon ? ` · ${frage.geteiltVon}` : ''}
              </span>
            )}
          </div>
        </div>
        {/* Löschen-Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onLoeschen() }}
          className="self-start p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
          title="Frage löschen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  )
}

// === HILFSFUNKTIONEN ===

function gruppenKey(frage: Frage, gruppierung: Gruppierung): string {
  switch (gruppierung) {
    case 'fachbereich': return frage.fachbereich
    case 'thema': return frage.thema
    case 'typ': return frage.typ
    case 'bloom': return frage.bloom
    default: return ''
  }
}

function gruppenLabel(key: string, gruppierung: Gruppierung): string {
  if (gruppierung === 'typ') return typLabel(key)
  return key
}

function gruppenLabelFarbe(key: string, gruppierung: Gruppierung): string {
  if (gruppierung === 'fachbereich') {
    switch (key) {
      case 'VWL': return 'text-orange-700 dark:text-orange-300'
      case 'BWL': return 'text-blue-700 dark:text-blue-300'
      case 'Recht': return 'text-green-700 dark:text-green-300'
    }
  }
  return 'text-slate-700 dark:text-slate-200'
}

