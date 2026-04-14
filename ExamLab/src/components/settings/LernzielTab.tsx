import { useState, useEffect, useMemo } from 'react'
import { postJson } from '../../services/apiClient'

interface Lernziel {
  id: string
  fach: string
  thema: string
  text: string
  bloom: string
  ebene?: string
}

interface Props {
  email: string
}

const BLOOM_STUFEN = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']

/**
 * Lernziel-Editor: Vollständige CRUD-Verwaltung aller Lernziele.
 * Tab in den Einstellungen.
 */
export default function LernzielTab({ email }: Props) {
  const [lernziele, setLernziele] = useState<Lernziel[]>([])
  const [ladeStatus, setLadeStatus] = useState<'idle' | 'laden' | 'fertig' | 'fehler'>('idle')
  const [fehler, setFehler] = useState<string | null>(null)

  // Filter-State
  const [suchtext, setSuchtext] = useState('')
  const [filterFach, setFilterFach] = useState<string>('')
  const [filterBloom, setFilterBloom] = useState<string>('')

  // Edit-State
  const [editId, setEditId] = useState<string | null>(null)
  const [editDaten, setEditDaten] = useState<Partial<Lernziel>>({})

  // Neu-Erstellen-State
  const [zeigeNeu, setZeigeNeu] = useState(false)
  const [neuDaten, setNeuDaten] = useState<Partial<Lernziel>>({ fach: '', thema: '', text: '', bloom: 'K2' })

  // Speicher-Status
  const [speicherStatus, setSpeicherStatus] = useState<string | null>(null)

  // Einklapp-State (Default: alles eingeklappt). Key für Thema: `${fach}::${thema}`.
  const [expandedFaecher, setExpandedFaecher] = useState<Set<string>>(new Set())
  const [expandedThemen, setExpandedThemen] = useState<Set<string>>(new Set())
  const filterAktiv = Boolean(suchtext || filterFach || filterBloom)

  function toggleFach(fach: string) {
    setExpandedFaecher(prev => {
      const next = new Set(prev)
      if (next.has(fach)) next.delete(fach); else next.add(fach)
      return next
    })
  }
  function toggleThema(key: string) {
    setExpandedThemen(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  // Laden
  useEffect(() => {
    if (!email) return
    ladeLernziele()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  async function ladeLernziele() {
    setLadeStatus('laden')
    try {
      const result = await postJson<{ lernziele: Lernziel[] }>('ladeLernziele', { email, callerEmail: email })
      setLernziele(result?.lernziele || [])
      setLadeStatus('fertig')
    } catch (err) {
      setFehler(String(err))
      setLadeStatus('fehler')
    }
  }

  // Fächer aus Daten extrahieren
  const verfuegbareFaecher = useMemo(() => {
    const set = new Set(lernziele.map(l => l.fach).filter(Boolean))
    return Array.from(set).sort()
  }, [lernziele])

  // Gefilterte Lernziele
  const gefiltert = useMemo(() => {
    return lernziele.filter(l => {
      if (filterFach && l.fach !== filterFach) return false
      if (filterBloom && l.bloom !== filterBloom) return false
      if (suchtext) {
        const s = suchtext.toLowerCase()
        if (!l.text.toLowerCase().includes(s) && !l.thema.toLowerCase().includes(s) && !l.fach.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [lernziele, filterFach, filterBloom, suchtext])

  // Gruppiert nach Fach → Thema
  const gruppiert = useMemo(() => {
    const map = new Map<string, Map<string, Lernziel[]>>()
    for (const lz of gefiltert) {
      const fach = lz.fach || 'Ohne Fach'
      const thema = lz.thema || 'Ohne Thema'
      if (!map.has(fach)) map.set(fach, new Map())
      const themaMap = map.get(fach)!
      if (!themaMap.has(thema)) themaMap.set(thema, [])
      themaMap.get(thema)!.push(lz)
    }
    return map
  }, [gefiltert])

  // === CRUD-Operationen ===

  async function erstelleLernziel() {
    if (!neuDaten.text || !neuDaten.fach) return
    setSpeicherStatus('Speichere...')
    try {
      const result = await postJson<{ erfolg: boolean; id: string }>('speichereLernziel', {
        email,
        lernziel: neuDaten,
      })
      if (result?.erfolg) {
        setLernziele(prev => [...prev, { ...neuDaten, id: result.id } as Lernziel])
        setNeuDaten({ fach: neuDaten.fach, thema: '', text: '', bloom: 'K2' })
        setSpeicherStatus('✓ Erstellt')
        setTimeout(() => setSpeicherStatus(null), 2000)
      }
    } catch (err) {
      setSpeicherStatus('Fehler: ' + String(err))
    }
  }

  async function aktualisiereLernziel() {
    if (!editId || !editDaten.text) return
    setSpeicherStatus('Speichere...')
    try {
      const result = await postJson<{ erfolg: boolean }>('aktualisiereLernziel', {
        email, callerEmail: email,
        lernziel: { id: editId, ...editDaten },
      })
      if (result?.erfolg) {
        setLernziele(prev => prev.map(l => l.id === editId ? { ...l, ...editDaten } : l))
        setEditId(null)
        setEditDaten({})
        setSpeicherStatus('✓ Gespeichert')
        setTimeout(() => setSpeicherStatus(null), 2000)
      }
    } catch (err) {
      setSpeicherStatus('Fehler: ' + String(err))
    }
  }

  async function loescheLernziel(id: string) {
    if (!confirm('Lernziel wirklich löschen?')) return
    setSpeicherStatus('Lösche...')
    try {
      const result = await postJson<{ erfolg: boolean }>('loescheLernziel', {
        email, callerEmail: email,
        lernzielId: id,
      })
      if (result?.erfolg) {
        setLernziele(prev => prev.filter(l => l.id !== id))
        setSpeicherStatus('✓ Gelöscht')
        setTimeout(() => setSpeicherStatus(null), 2000)
      }
    } catch (err) {
      setSpeicherStatus('Fehler: ' + String(err))
    }
  }

  function startEdit(lz: Lernziel) {
    setEditId(lz.id)
    setEditDaten({ fach: lz.fach, thema: lz.thema, text: lz.text, bloom: lz.bloom })
  }

  if (ladeStatus === 'laden') {
    return <div className="p-4 text-slate-500 dark:text-slate-400">Lernziele werden geladen...</div>
  }
  if (ladeStatus === 'fehler') {
    return <div className="p-4 text-red-600 dark:text-red-400">Fehler: {fehler}</div>
  }

  return (
    <div className="space-y-4">
      {/* Status-Anzeige */}
      {speicherStatus && (
        <div className={`text-sm px-3 py-1.5 rounded-lg ${speicherStatus.startsWith('✓') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : speicherStatus.startsWith('Fehler') ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
          {speicherStatus}
        </div>
      )}

      {/* Filter-Leiste */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={suchtext}
          onChange={e => setSuchtext(e.target.value)}
          placeholder="Suchen..."
          className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600 min-w-[200px]"
        />
        <select value={filterFach} onChange={e => setFilterFach(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600">
          <option value="">Alle Fächer</option>
          {verfuegbareFaecher.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={filterBloom} onChange={e => setFilterBloom(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600">
          <option value="">Alle Bloom-Stufen</option>
          {BLOOM_STUFEN.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
          {gefiltert.length} von {lernziele.length} Lernzielen
        </span>
      </div>

      {/* Neues Lernziel erstellen */}
      <div className="border rounded-xl dark:border-slate-700 overflow-hidden">
        <button
          onClick={() => setZeigeNeu(!zeigeNeu)}
          className="w-full px-4 py-3 text-left text-sm font-medium bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
        >
          <span className="dark:text-white">+ Neues Lernziel erstellen</span>
          <span className={`text-slate-600 dark:text-slate-300 transition-transform ${zeigeNeu ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {zeigeNeu && (
          <div className="p-4 space-y-3 border-t dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300">Fach *</label>
                <input
                  value={neuDaten.fach || ''}
                  onChange={e => setNeuDaten({ ...neuDaten, fach: e.target.value })}
                  placeholder="z.B. VWL, BWL, Recht"
                  className="w-full px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600"
                  list="fach-vorschlaege"
                />
                <datalist id="fach-vorschlaege">
                  {verfuegbareFaecher.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300">Bloom-Stufe</label>
                <select
                  value={neuDaten.bloom || 'K2'}
                  onChange={e => setNeuDaten({ ...neuDaten, bloom: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600"
                >
                  {BLOOM_STUFEN.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-300">Thema</label>
              <input
                value={neuDaten.thema || ''}
                onChange={e => setNeuDaten({ ...neuDaten, thema: e.target.value })}
                placeholder="z.B. Konjunktur, Kaufvertrag"
                className="w-full px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-300">Lernziel-Text *</label>
              <textarea
                value={neuDaten.text || ''}
                onChange={e => setNeuDaten({ ...neuDaten, text: e.target.value })}
                placeholder="Die SuS können..."
                rows={2}
                className="w-full px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600"
              />
            </div>
            <button
              onClick={erstelleLernziel}
              disabled={!neuDaten.text || !neuDaten.fach}
              className="px-4 py-2 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-lg text-sm font-medium disabled:opacity-50 min-h-[36px]"
            >
              Erstellen
            </button>
          </div>
        )}
      </div>

      {/* Lernziel-Liste gruppiert */}
      {Array.from(gruppiert.entries()).map(([fach, themaMap]) => {
        const fachOffen = filterAktiv || expandedFaecher.has(fach)
        const fachAnzahl = Array.from(themaMap.values()).reduce((sum, l) => sum + l.length, 0)
        return (
        <div key={fach} className="border rounded-xl dark:border-slate-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleFach(fach)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
          >
            <h3 className="font-semibold text-sm dark:text-white">{fach}</h3>
            <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{fachAnzahl}</span>
              <span className={`transition-transform ${fachOffen ? 'rotate-180' : ''}`}>▾</span>
            </span>
          </button>
          {fachOffen && Array.from(themaMap.entries()).map(([thema, lzListe]) => {
            const themaKey = `${fach}::${thema}`
            const themaOffen = filterAktiv || expandedThemen.has(themaKey)
            return (
            <div key={thema} className="border-b dark:border-slate-700 last:border-0">
              <button
                type="button"
                onClick={() => toggleThema(themaKey)}
                className="w-full px-4 py-1.5 bg-slate-25 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-left"
              >
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{thema}</span>
                <span className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{lzListe.length}</span>
                  <span className={`transition-transform ${themaOffen ? 'rotate-180' : ''}`}>▾</span>
                </span>
              </button>
              {themaOffen && lzListe.map(lz => (
                <div key={lz.id} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 flex items-start gap-3 group">
                  {editId === lz.id ? (
                    // Edit-Modus
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input value={editDaten.fach || ''} onChange={e => setEditDaten({ ...editDaten, fach: e.target.value })} className="px-2 py-1 border rounded text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600" placeholder="Fach" />
                        <input value={editDaten.thema || ''} onChange={e => setEditDaten({ ...editDaten, thema: e.target.value })} className="px-2 py-1 border rounded text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600" placeholder="Thema" />
                        <select value={editDaten.bloom || 'K2'} onChange={e => setEditDaten({ ...editDaten, bloom: e.target.value })} className="px-2 py-1 border rounded text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600">
                          {BLOOM_STUFEN.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <textarea value={editDaten.text || ''} onChange={e => setEditDaten({ ...editDaten, text: e.target.value })} rows={2} className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                      <div className="flex gap-2">
                        <button onClick={aktualisiereLernziel} className="px-3 py-1 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded text-xs font-medium">Speichern</button>
                        <button onClick={() => { setEditId(null); setEditDaten({}) }} className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs">Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    // Anzeige-Modus
                    <>
                      <span className="shrink-0 mt-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {lz.bloom}
                      </span>
                      <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{lz.text}</p>
                      <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(lz)} className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 text-xs" title="Bearbeiten">✏️</button>
                        <button onClick={() => loescheLernziel(lz.id)} className="p-1 text-slate-600 dark:text-slate-300 hover:text-red-500 text-xs" title="Löschen">🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            )
          })}
        </div>
        )
      })}

      {gefiltert.length === 0 && ladeStatus === 'fertig' && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">
          {lernziele.length === 0 ? 'Noch keine Lernziele vorhanden.' : 'Keine Lernziele gefunden.'}
        </p>
      )}
    </div>
  )
}
