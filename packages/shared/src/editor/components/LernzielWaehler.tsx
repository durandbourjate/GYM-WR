/**
 * LernzielWähler — Multi-Select mit Suche, Fach/Thema-Gruppierung und Neu-erstellen.
 * Ersetzt die einfache Checkbox-Liste in MetadataSection.
 */
import { useState, useMemo, useEffect } from 'react'
import type { Lernziel, BloomStufe } from '../../types/fragen-core'

interface LernzielWaehlerProps {
  lernziele: Lernziel[]
  gewaehlteIds: string[]
  onToggle: (id: string) => void
  /** Neues Lernziel erstellen — wenn undefined, wird "Neu"-Button nicht angezeigt */
  onNeuErstellen?: (lernziel: Omit<Lernziel, 'id'>) => Promise<string | null>
  /** Aktueller Fachbereich der Frage (Vorauswahl beim Erstellen) */
  aktuellerFachbereich?: string
  ladend?: boolean
  /** Counter-Increment triggert den Reset-Hinweis-Banner für 5s. undefined = kein Hinweis. */
  zeigeResetHinweis?: number
}

interface NeuFormState {
  fach: string
  thema: string
  bloom: string
  text: string
}

const BLOOM_STUFEN: BloomStufe[] = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']
const BLOOM_LABELS: Record<string, string> = {
  K1: 'Wissen', K2: 'Verstehen', K3: 'Anwenden',
  K4: 'Analysieren', K5: 'Synthese', K6: 'Beurteilen',
}

export default function LernzielWaehler({
  lernziele, gewaehlteIds, onToggle, onNeuErstellen,
  aktuellerFachbereich, ladend, zeigeResetHinweis,
}: LernzielWaehlerProps) {
  const [suchtext, setSuchtext] = useState('')
  const [zeigNeuForm, setZeigNeuForm] = useState(false)
  const [neuForm, setNeuForm] = useState<NeuFormState>({
    fach: aktuellerFachbereich || 'VWL',
    thema: '', bloom: 'K1', text: '',
  })
  // Freitext-Fallback wenn im Themen-Dropdown "Neu…" gewählt wird (Bundle 12 K-2)
  const [neuThemaEigen, setNeuThemaEigen] = useState(false)
  const [speichernd, setSpeichernd] = useState(false)
  const [aufgeklappt, setAufgeklappt] = useState<Set<string>>(new Set())
  const [bannerSichtbar, setBannerSichtbar] = useState(false)

  // Bundle 2 P4.1: Reset-Hinweis-Banner für 5s, getriggert durch Counter-Increment vom Caller.
  useEffect(() => {
    if (!zeigeResetHinweis) return
    setBannerSichtbar(true)
    const timer = setTimeout(() => setBannerSichtbar(false), 5000)
    return () => clearTimeout(timer)
  }, [zeigeResetHinweis])

  // Themen-Vorschläge aus bestehenden Lernzielen, gefiltert nach aktuell
  // gewähltem Fach im Formular (Bundle 12 K-2). Eindeutig + alphabetisch.
  const themenVorschlaege = useMemo(() => {
    const set = new Set<string>()
    for (const lz of lernziele) {
      if (lz.fach === neuForm.fach && lz.thema) set.add(lz.thema)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [lernziele, neuForm.fach])

  // Nur aktive Lernziele
  const aktiveLZ = useMemo(() => lernziele.filter(lz => lz.aktiv !== false), [lernziele])

  // Suchfilter
  const gefilterteLZ = useMemo(() => {
    if (!suchtext.trim()) return aktiveLZ
    const lower = suchtext.toLowerCase()
    return aktiveLZ.filter(lz =>
      lz.text.toLowerCase().includes(lower) ||
      lz.thema.toLowerCase().includes(lower) ||
      lz.fach.toLowerCase().includes(lower) ||
      lz.bloom?.toLowerCase().includes(lower)
    )
  }, [aktiveLZ, suchtext])

  // Gruppierung: Fach → Thema → Lernziele
  const gruppiert = useMemo(() => {
    const map = new Map<string, Map<string, Lernziel[]>>()
    for (const lz of gefilterteLZ) {
      const fach = lz.fach || 'Allgemein'
      const thema = lz.thema || 'Ohne Thema'
      if (!map.has(fach)) map.set(fach, new Map())
      const fachMap = map.get(fach)!
      if (!fachMap.has(thema)) fachMap.set(thema, [])
      fachMap.get(thema)!.push(lz)
    }
    return map
  }, [gefilterteLZ])

  // Beim Suchen alle Gruppen aufklappen
  const effektivAufgeklappt = suchtext.trim()
    ? new Set([...gruppiert.keys()].flatMap(fach => {
        const themen = gruppiert.get(fach)!
        return [fach, ...[...themen.keys()].map(t => `${fach}:${t}`)]
      }))
    : aufgeklappt

  function toggleGruppe(key: string) {
    setAufgeklappt(prev => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }

  async function handleNeuErstellen() {
    if (!onNeuErstellen || !neuForm.text.trim() || !neuForm.thema.trim()) return
    setSpeichernd(true)
    try {
      const id = await onNeuErstellen({
        fach: neuForm.fach,
        thema: neuForm.thema,
        bloom: neuForm.bloom,
        text: neuForm.text.trim(),
        aktiv: true,
      })
      if (id) {
        // Automatisch auswählen
        onToggle(id)
        setNeuForm({ fach: neuForm.fach, thema: '', bloom: 'K1', text: '' })
        setZeigNeuForm(false)
      }
    } finally {
      setSpeichernd(false)
    }
  }

  // Fachbereich-Farbe
  function fachFarbe(fach: string): string {
    switch (fach) {
      case 'VWL': return 'text-orange-600 dark:text-orange-400'
      case 'BWL': return 'text-blue-600 dark:text-blue-400'
      case 'Recht': return 'text-green-600 dark:text-green-400'
      case 'Informatik': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-slate-600 dark:text-slate-400'
    }
  }

  if (ladend) {
    return (
      <div className="mt-3">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Lernziele</label>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
          <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
          Lernziele werden geladen...
        </div>
      </div>
    )
  }

  if (!aktiveLZ.length && !onNeuErstellen) return null

  return (
    <div className="mt-3">
      {bannerSichtbar && (
        <div role="status" className="mb-2 p-2 rounded text-xs bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          Lernziele wurden bei Fachwechsel zurückgesetzt.
        </div>
      )}
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
        Lernziele {gewaehlteIds.length > 0 && (
          <span className="text-slate-400">({gewaehlteIds.length} zugeordnet)</span>
        )}
      </label>

      {/* Suchfeld */}
      {aktiveLZ.length > 5 && (
        <input
          type="text"
          value={suchtext}
          onChange={e => setSuchtext(e.target.value)}
          placeholder="Lernziele suchen..."
          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-md mb-2 bg-white dark:bg-slate-700 dark:text-white placeholder-slate-400"
        />
      )}

      {/* Gewählte Lernziele (Chips) */}
      {gewaehlteIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {gewaehlteIds.map(id => {
            const lz = lernziele.find(l => l.id === id)
            if (!lz) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-700"
              >
                <span className="max-w-[200px] truncate" title={lz.text}>{lz.text}</span>
                <button
                  onClick={() => onToggle(id)}
                  className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200 cursor-pointer"
                  title="Entfernen"
                >
                  ✕
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Gruppierte Liste */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-56 overflow-y-auto">
        {gruppiert.size === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 p-3 text-center">
            {suchtext ? 'Keine Lernziele gefunden' : 'Keine Lernziele vorhanden'}
          </p>
        )}
        {[...gruppiert.entries()].map(([fach, themenMap]) => (
          <div key={fach}>
            {/* Fach-Header */}
            <button
              onClick={() => toggleGruppe(fach)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[11px] font-semibold bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-600 cursor-pointer sticky top-0 z-10"
            >
              <span className="text-[9px] text-slate-400" style={{ transform: effektivAufgeklappt.has(fach) ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 150ms' }}>▶</span>
              <span className={fachFarbe(fach)}>{fach}</span>
              <span className="text-slate-400 font-normal">
                ({[...themenMap.values()].reduce((s, arr) => s + arr.length, 0)})
              </span>
            </button>

            {effektivAufgeklappt.has(fach) && [...themenMap.entries()].map(([thema, lzListe]) => (
              <div key={`${fach}:${thema}`}>
                {/* Thema-Header (nur wenn mehr als 1 Thema) */}
                {themenMap.size > 1 && (
                  <button
                    onClick={() => toggleGruppe(`${fach}:${thema}`)}
                    className="w-full flex items-center gap-1.5 px-4 py-1 text-left text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
                  >
                    <span className="text-[8px]" style={{ transform: effektivAufgeklappt.has(`${fach}:${thema}`) ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 150ms' }}>▶</span>
                    {thema} ({lzListe.length})
                  </button>
                )}

                {/* Lernziel-Items */}
                {(themenMap.size === 1 || effektivAufgeklappt.has(`${fach}:${thema}`)) && lzListe.map(lz => (
                  <label
                    key={lz.id}
                    className="flex items-start gap-2 px-4 py-1 text-[11px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <input
                      type="checkbox"
                      checked={gewaehlteIds.includes(lz.id)}
                      onChange={() => onToggle(lz.id)}
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-600"
                    />
                    <span className="dark:text-slate-300 flex-1">{lz.text}</span>
                    {lz.bloom && (
                      <span className="text-[9px] px-1 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded shrink-0" title={BLOOM_LABELS[lz.bloom] || lz.bloom}>
                        {lz.bloom}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Neu erstellen */}
      {onNeuErstellen && (
        <>
          {!zeigNeuForm ? (
            <button
              onClick={() => setZeigNeuForm(true)}
              className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 cursor-pointer"
            >
              + Neues Lernziel erstellen
            </button>
          ) : (
            <div className="mt-2 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-700/50">
              <p className="text-[11px] font-medium text-purple-800 dark:text-purple-300 mb-2">Neues Lernziel</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">Fach</label>
                  <select
                    value={neuForm.fach}
                    onChange={e => {
                      setNeuForm(prev => ({ ...prev, fach: e.target.value, thema: '' }))
                      setNeuThemaEigen(false)
                    }}
                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                  >
                    <option value="VWL">VWL</option>
                    <option value="BWL">BWL</option>
                    <option value="Recht">Recht</option>
                    <option value="Informatik">Informatik</option>
                    <option value="Allgemein">Allgemein</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">Bloom-Stufe</label>
                  <select
                    value={neuForm.bloom}
                    onChange={e => setNeuForm(prev => ({ ...prev, bloom: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                  >
                    {BLOOM_STUFEN.map(k => (
                      <option key={k} value={k}>{k} — {BLOOM_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Thema *</label>
                {themenVorschlaege.length > 0 && !neuThemaEigen ? (
                  <select
                    value={neuForm.thema}
                    onChange={e => {
                      if (e.target.value === '__neu__') {
                        setNeuThemaEigen(true)
                        setNeuForm(prev => ({ ...prev, thema: '' }))
                      } else {
                        setNeuForm(prev => ({ ...prev, thema: e.target.value }))
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">— Thema wählen —</option>
                    {themenVorschlaege.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__neu__">+ Neues Thema …</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={neuForm.thema}
                    onChange={e => setNeuForm(prev => ({ ...prev, thema: e.target.value }))}
                    placeholder="z.B. Marktgleichgewicht"
                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                    autoFocus={neuThemaEigen}
                  />
                )}
                {themenVorschlaege.length > 0 && neuThemaEigen && (
                  <button
                    onClick={() => { setNeuThemaEigen(false); setNeuForm(prev => ({ ...prev, thema: '' })) }}
                    className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    ← Aus Liste wählen
                  </button>
                )}
              </div>
              <div className="mt-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Lernziel-Text *</label>
                <textarea
                  value={neuForm.text}
                  onChange={e => setNeuForm(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Die SuS können..."
                  rows={2}
                  className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white resize-y"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleNeuErstellen}
                  disabled={speichernd || !neuForm.text.trim() || !neuForm.thema.trim()}
                  className="px-3 py-1 text-[11px] bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {speichernd ? 'Speichern...' : 'Erstellen'}
                </button>
                <button
                  onClick={() => setZeigNeuForm(false)}
                  className="px-3 py-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
        Lernziele aus der Fragensammlung
      </p>
    </div>
  )
}
