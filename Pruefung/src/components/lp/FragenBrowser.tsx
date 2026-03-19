import { useState, useEffect, useMemo, useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import { demoFragen } from '../../data/demoFragen.ts'
import { fachbereichFarbe, typLabel } from '../../utils/fachbereich.ts'
import type { Frage, Fachbereich, BloomStufe } from '../../types/fragen.ts'
import FragenEditor from './frageneditor/FragenEditor.tsx'
import FragenImport from './FragenImport.tsx'

interface Props {
  onHinzufuegen: (frageIds: string[]) => void
  onSchliessen: () => void
  bereitsVerwendet: string[]
}

type Sortierung = 'thema' | 'bloom' | 'punkte' | 'typ' | 'id'
type Gruppierung = 'keine' | 'fachbereich' | 'thema' | 'typ' | 'bloom'

const SEITEN_GROESSE = 30

/** Overlay-Panel zum Durchsuchen und Auswählen von Fragen aus der Fragenbank */
export default function FragenBrowser({ onHinzufuegen, onSchliessen, bereitsVerwendet }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())

  // Filter
  const [suchtext, setSuchtext] = useState('')
  const [filterFachbereich, setFilterFachbereich] = useState<Fachbereich | ''>('')
  const [filterTyp, setFilterTyp] = useState<string>('')
  const [filterBloom, setFilterBloom] = useState<BloomStufe | ''>('')
  const [filterThema, setFilterThema] = useState('')
  const [filterBesitzer, setFilterBesitzer] = useState<'alle' | 'meine'>('alle')

  // Editor / Import
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editFrage, setEditFrage] = useState<Frage | null>(null)
  const [zeigImport, setZeigImport] = useState(false)

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
      if (filterBesitzer === 'meine' && user && f.autor && f.autor !== user.email) return false
      if (filterThema) {
        const key = f.thema + (f.unterthema ? ` › ${f.unterthema}` : '')
        if (key !== filterThema && f.thema !== filterThema) return false
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
  }, [alleFragen, filterFachbereich, filterTyp, filterBloom, filterThema, filterBesitzer, suchtext, user])

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
  const aktiveFilter = [filterFachbereich, filterTyp, filterBloom, filterThema, suchtext, filterBesitzer !== 'alle' ? filterBesitzer : ''].filter(Boolean).length

  function toggleAuswahl(id: string): void {
    setAusgewaehlt((prev) => {
      const neu = new Set(prev)
      if (neu.has(id)) neu.delete(id)
      else neu.add(id)
      return neu
    })
  }

  function alleInGruppeToggle(fragen: Frage[]): void {
    setAusgewaehlt((prev) => {
      const neu = new Set(prev)
      const verfuegbar = fragen.filter((f) => !bereitsVerwendet.includes(f.id))
      const alleAusgewaehlt = verfuegbar.every((f) => neu.has(f.id))
      if (alleAusgewaehlt) {
        verfuegbar.forEach((f) => neu.delete(f.id))
      } else {
        verfuegbar.forEach((f) => neu.add(f.id))
      }
      return neu
    })
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
    setFilterBesitzer('alle')
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

  function handleHinzufuegen(): void {
    onHinzufuegen(Array.from(ausgewaehlt))
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onSchliessen} />

      {/* Panel (rechts) */}
      <div ref={panelRef} className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
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
                onClick={() => setZeigImport(true)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Fragen via KI aus Text importieren"
              >
                Import via KI
              </button>
              <button
                onClick={() => { setEditFrage(null); setZeigEditor(true) }}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Neue Frage erstellen"
              >
                + Neue Frage
              </button>
              {ausgewaehlt.size > 0 && (
                <button
                  onClick={handleHinzufuegen}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {ausgewaehlt.size} hinzufügen
                </button>
              )}
              <button
                onClick={onSchliessen}
                className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

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
            {/* Besitzer-Filter */}
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setFilterBesitzer('alle')}
                className={`text-xs px-2 py-1.5 transition-colors cursor-pointer ${
                  filterBesitzer === 'alle'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterBesitzer('meine')}
                className={`text-xs px-2 py-1.5 transition-colors cursor-pointer border-l border-slate-300 dark:border-slate-600 ${
                  filterBesitzer === 'meine'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Meine
              </button>
            </div>

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
        <div className="flex-1 overflow-auto">
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
                const verfuegbarInGruppe = gruppe.fragen.filter((f) => !bereitsVerwendet.includes(f.id))
                const ausgewaehltInGruppe = verfuegbarInGruppe.filter((f) => ausgewaehlt.has(f.id))

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
                        </span>

                        {/* Gruppe komplett auswählen */}
                        {istAufgeklappt && verfuegbarInGruppe.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); alleInGruppeToggle(gruppe.fragen) }}
                            className="ml-auto text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {ausgewaehltInGruppe.length === verfuegbarInGruppe.length ? 'Alle abwählen' : 'Alle wählen'}
                          </button>
                        )}
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
                                istVerwendet={bereitsVerwendet.includes(frage.id)}
                                istAusgewaehlt={ausgewaehlt.has(frage.id)}
                                onToggle={() => toggleAuswahl(frage.id)}
                                onEdit={() => { setEditFrage(frage); setZeigEditor(true) }}
                                zeigeGruppierung={gruppierung}
                              />
                            : <DetailKarte
                                key={frage.id}
                                frage={frage}
                                istVerwendet={bereitsVerwendet.includes(frage.id)}
                                istAusgewaehlt={ausgewaehlt.has(frage.id)}
                                onToggle={() => toggleAuswahl(frage.id)}
                                onEdit={() => { setEditFrage(frage); setZeigEditor(true) }}
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

      {/* Import Overlay */}
      {zeigImport && (
        <FragenImport
          onImportiert={handleImportFragen}
          onSchliessen={() => setZeigImport(false)}
        />
      )}
    </div>
  )
}

// === SUB-KOMPONENTEN ===

/** Kompakte Zeile für grosse Listen */
function KompaktZeile({ frage, istVerwendet, istAusgewaehlt, onToggle, onEdit, zeigeGruppierung }: {
  frage: Frage
  istVerwendet: boolean
  istAusgewaehlt: boolean
  onToggle: () => void
  onEdit: () => void
  zeigeGruppierung: Gruppierung
}) {
  return (
    <div
      onClick={() => !istVerwendet && onToggle()}
      className={`flex items-center gap-2 px-5 py-1.5 text-sm border-b border-slate-100 dark:border-slate-700/50 transition-colors
        ${istVerwendet
          ? 'opacity-35 cursor-not-allowed'
          : istAusgewaehlt
            ? 'bg-slate-100 dark:bg-slate-700 cursor-pointer'
            : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer'
        }`}
    >
      {/* Checkbox */}
      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0
        ${istAusgewaehlt
          ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200'
          : 'border-slate-400 dark:border-slate-500'
        }`}>
        {istAusgewaehlt && <span className="text-white dark:text-slate-800 text-[10px]">✓</span>}
      </div>

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

      {istVerwendet && (
        <span className="text-[10px] text-slate-400 italic shrink-0">verwendet</span>
      )}

      {/* Bearbeiten-Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        className="text-[10px] px-1.5 py-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors cursor-pointer shrink-0"
        title="Frage bearbeiten"
      >
        ✎
      </button>
    </div>
  )
}

/** Detaillierte Karte mit Fragetext-Vorschau */
function DetailKarte({ frage, istVerwendet, istAusgewaehlt, onToggle, onEdit }: {
  frage: Frage
  istVerwendet: boolean
  istAusgewaehlt: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''

  return (
    <div
      onClick={() => !istVerwendet && onToggle()}
      className={`p-3 rounded-lg border transition-colors
        ${istVerwendet
          ? 'opacity-35 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
          : istAusgewaehlt
            ? 'border-slate-800 dark:border-slate-200 bg-slate-100 dark:bg-slate-700 cursor-pointer'
            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0
          ${istAusgewaehlt
            ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200'
            : 'border-slate-400 dark:border-slate-500'
          }`}>
          {istAusgewaehlt && <span className="text-white dark:text-slate-800 text-xs">✓</span>}
        </div>

        <div className="flex-1 min-w-0">
          {/* ID + Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {frage.id}
            </span>
            <span className={`px-1.5 py-0.5 text-xs rounded ${fachbereichFarbe(frage.fachbereich)}`}>
              {frage.fachbereich}
            </span>
            <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              {typLabel(frage.typ)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {frage.bloom} · {frage.punkte}P.
            </span>
            {istVerwendet && (
              <span className="text-xs text-slate-400 italic">bereits verwendet</span>
            )}
            {/* Bearbeiten-Button */}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="ml-auto text-xs px-2 py-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors cursor-pointer shrink-0"
              title="Frage bearbeiten"
            >
              Bearbeiten
            </button>
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

