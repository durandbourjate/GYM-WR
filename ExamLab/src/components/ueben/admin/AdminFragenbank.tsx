import { useState, useEffect, useCallback, useMemo } from 'react'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import { useUebenFortschrittStore } from '../../../store/ueben/fortschrittStore'
import { uebenFragenAdapter } from '../../../adapters/ueben/appsScriptAdapter'
import type { Frage } from '../../../types/ueben/fragen'
import { getFragetext } from '../../../utils/ueben/fragetext'

// Lazy-Import für SharedFragenEditor + Provider (nur wenn Editor offen)
import UebenEditorProvider from './UebenEditorProvider'
import SharedFragenEditor from '@shared/editor/SharedFragenEditor'

const FACH_FARBEN: Record<string, string> = {
  VWL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  BWL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Recht: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Informatik: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  Andere: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

// Intensivere Farben für aktiven (ausgewählten) Fach-Button
const FACH_FARBEN_AKTIV: Record<string, string> = {
  VWL: 'bg-orange-500 text-white dark:bg-orange-600 dark:text-white ring-2 ring-orange-300',
  BWL: 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white ring-2 ring-blue-300',
  Recht: 'bg-green-500 text-white dark:bg-green-600 dark:text-white ring-2 ring-green-300',
  Informatik: 'bg-slate-500 text-white dark:bg-slate-600 dark:text-white ring-2 ring-slate-300',
  Andere: 'bg-purple-500 text-white dark:bg-purple-600 dark:text-white ring-2 ring-purple-300',
}

interface AdminFragenbankProps {
  initialFach?: string
}

export default function AdminFragenbank({ initialFach }: AdminFragenbankProps = {}) {
  const { aktiveGruppe } = useUebenGruppenStore()
  const { lernziele, ladeLernziele } = useUebenFortschrittStore()
  const [fragen, setFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(false)
  const [filterLernziele, setFilterLernziele] = useState<'alle' | 'mit' | 'ohne'>('alle')
  const [fehler, setFehler] = useState<string | null>(null)
  const [editorOffen, setEditorOffen] = useState(false)
  const [aktiveFrage, setAktiveFrage] = useState<Frage | null>(null)
  const [filterFach, setFilterFach] = useState<string>(initialFach ?? '')
  const [filterThema, setFilterThema] = useState<string>('')
  const [filterUnterthema, setFilterUnterthema] = useState<string>('')
  const [filterTyp, setFilterTyp] = useState<string>('')
  const [suchtext, setSuchtext] = useState('')
  const [speichern, setSpeichern] = useState(false)

  // Fragen laden
  const ladeFragen = useCallback(async () => {
    if (!aktiveGruppe) return
    setLaden(true)
    setFehler(null)
    try {
      const result = await uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
      setFragen(result)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fragen laden fehlgeschlagen')
    } finally {
      setLaden(false)
    }
  }, [aktiveGruppe])

  useEffect(() => { ladeFragen() }, [ladeFragen])
  useEffect(() => { if (aktiveGruppe) ladeLernziele(aktiveGruppe.id) }, [aktiveGruppe, ladeLernziele])

  // Lernziel-ID → Text Mapping für Chips
  const lzMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const lz of lernziele) map.set(lz.id, lz.text)
    return map
  }, [lernziele])

  // Neue Frage erstellen
  function neueFrageErstellen() {
    setAktiveFrage(null)
    setEditorOffen(true)
  }

  // Bestehende Frage bearbeiten
  function frageBearbeiten(frage: Frage) {
    setAktiveFrage(frage)
    setEditorOffen(true)
  }

  // Frage löschen (Bestätigung erfolgt im Aufrufer — Editor oder Listenansicht)
  async function frageLoeschen(frage: Frage) {
    if (!aktiveGruppe) return
    try {
      await uebenFragenAdapter.loescheFrage(aktiveGruppe.id, frage.id, frage.fachbereich)
      uebenFragenAdapter.invalidateCache(aktiveGruppe.id)
      await ladeFragen()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Löschen fehlgeschlagen')
    }
  }

  // Speichern-Handler — Frage kommt direkt im shared-Format, keine Konvertierung nötig
  async function handleSpeichern(frage: Frage) {
    if (!aktiveGruppe) return
    setSpeichern(true)
    try {
      await uebenFragenAdapter.speichereFrage(aktiveGruppe.id, frage)
      // Cache invalidieren und neu laden
      uebenFragenAdapter.invalidateCache(aktiveGruppe.id)
      await ladeFragen()
      setEditorOffen(false)
      setAktiveFrage(null)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSpeichern(false)
    }
  }

  // Filter-Optionen aus Daten ableiten (hierarchisch: Fach → Thema → Unterthema)
  const faecher = [...new Set(fragen.map(f => f.fach))].sort()
  const themen = [...new Set(
    fragen
      .filter(f => !filterFach || f.fach === filterFach)
      .map(f => f.thema)
      .filter(Boolean)
  )].sort()
  const unterthemen = [...new Set(
    fragen
      .filter(f => (!filterFach || f.fach === filterFach) && (!filterThema || f.thema === filterThema))
      .map(f => (f as { unterthema?: string }).unterthema)
      .filter(Boolean)
  )].sort() as string[]
  const typen = [...new Set(fragen.map(f => f.typ))].sort()

  const gefilterteFragen = fragen.filter(f => {
    if (filterFach && f.fach !== filterFach) return false
    if (filterThema && f.thema !== filterThema) return false
    if (filterUnterthema && (f as { unterthema?: string }).unterthema !== filterUnterthema) return false
    if (filterTyp && f.typ !== filterTyp) return false
    if (suchtext) {
      const s = suchtext.toLowerCase()
      const text = getFragetext(f)?.toLowerCase() ?? ''
      const thema = f.thema?.toLowerCase() ?? ''
      const unterthema = ((f as { unterthema?: string }).unterthema ?? '').toLowerCase()
      if (!text.includes(s) && !thema.includes(s) && !unterthema.includes(s)) return false
    }
    if (filterLernziele === 'mit' && (!(f as { lernzielIds?: string[] }).lernzielIds?.length)) return false
    if (filterLernziele === 'ohne' && ((f as { lernzielIds?: string[] }).lernzielIds?.length ?? 0) > 0) return false
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">
            Fragensammlung
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {fragen.length} Fragen{filterFach ? ` (${gefilterteFragen.length} angezeigt)` : ''}
          </p>
        </div>
        <button
          onClick={neueFrageErstellen}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-100 text-sm font-medium min-h-[44px]"
        >
          + Neue Frage
        </button>
      </div>

      {/* Filter */}
      <div className="space-y-3 mb-4">
        {/* Suchfeld */}
        <input
          type="text"
          value={suchtext}
          onChange={(e) => setSuchtext(e.target.value)}
          placeholder="Fragen durchsuchen..."
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-slate-500"
        />

        {/* Fach-Filter */}
        {faecher.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setFilterFach(''); setFilterThema(''); setFilterUnterthema('') }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !filterFach
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              Alle Fächer
            </button>
            {faecher.map(fach => (
              <button
                key={fach}
                onClick={() => { setFilterFach(fach === filterFach ? '' : fach); setFilterThema(''); setFilterUnterthema('') }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterFach === fach
                    ? FACH_FARBEN_AKTIV[fach] || 'bg-slate-800 text-white dark:bg-white dark:text-slate-800'
                    : FACH_FARBEN[fach] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {fach}
              </button>
            ))}
          </div>
        )}

        {/* Thema + Unterthema + Typ Filter */}
        <div className="flex gap-2 flex-wrap">
          {themen.length > 1 && (
            <select
              value={filterThema}
              onChange={(e) => { setFilterThema(e.target.value); setFilterUnterthema('') }}
              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">Alle Themen</option>
              {themen.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {filterThema && unterthemen.length > 0 && (
            <select
              value={filterUnterthema}
              onChange={(e) => setFilterUnterthema(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">Alle Unterthemen</option>
              {unterthemen.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {typen.length > 1 && (
            <select
              value={filterTyp}
              onChange={(e) => setFilterTyp(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">Alle Typen</option>
              {typen.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {/* Lernziele-Filter */}
          {lernziele.length > 0 && (
            <select
              value={filterLernziele}
              onChange={(e) => setFilterLernziele(e.target.value as 'alle' | 'mit' | 'ohne')}
              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="alle">Lernziele</option>
              <option value="mit">Mit Lernziele</option>
              <option value="ohne">Ohne Lernziele</option>
            </select>
          )}
          {(filterFach || filterThema || filterUnterthema || filterTyp || suchtext || filterLernziele !== 'alle') && (
            <button
              onClick={() => { setFilterFach(''); setFilterThema(''); setFilterUnterthema(''); setFilterTyp(''); setSuchtext(''); setFilterLernziele('alle') }}
              className="px-2 py-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      {laden && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          Fragen werden geladen...
        </div>
      )}

      {fehler && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <p className="text-red-700 dark:text-red-400 text-sm">{fehler}</p>
          <button onClick={ladeFragen} className="text-red-600 underline text-sm mt-1">
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Fragen-Liste */}
      {!laden && gefilterteFragen.length === 0 && !fehler && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-3">📝</p>
          <p>Noch keine Fragen vorhanden.</p>
          <button onClick={neueFrageErstellen} className="text-slate-600 dark:text-slate-400 underline text-sm mt-2">
            Erste Frage erstellen
          </button>
        </div>
      )}

      {!laden && gefilterteFragen.length > 0 && (
        <div className="space-y-2">
          {gefilterteFragen.map(frage => (
            <button
              key={frage.id}
              onClick={() => frageBearbeiten(frage)}
              className="w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-white truncate">
                    {getFragetext(frage) || '(Kein Fragetext)'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${FACH_FARBEN[frage.fachbereich] || 'bg-slate-100 text-slate-600'}`}>
                      {frage.fachbereich}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {frage.typ}
                    </span>
                    {frage.thema && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        · {frage.thema}{(frage as { unterthema?: string }).unterthema ? ` › ${(frage as { unterthema?: string }).unterthema}` : ''}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {'★'.repeat(frage.schwierigkeit ?? 2)}{'☆'.repeat(3 - (frage.schwierigkeit ?? 2))}
                    </span>
                    {/* Lernziel-Chips */}
                    {((frage as { lernzielIds?: string[] }).lernzielIds ?? []).length > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500" title={
                        ((frage as { lernzielIds?: string[] }).lernzielIds ?? []).map(id => lzMap.get(id) || id).join('\n')
                      }>
                        🏁 {(frage as { lernzielIds?: string[] }).lernzielIds!.length}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Frage "${getFragetext(frage)?.substring(0, 60) || frage.id}" wirklich löschen?`)) {
                      frageLoeschen(frage)
                    }
                  }}
                  className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 text-sm transition-colors cursor-pointer p-1"
                >
                  🗑
                </button>
                <span className="text-slate-300 dark:text-slate-600 text-lg">›</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Editor Modal (Overlay) */}
      {editorOffen && (
        <UebenEditorProvider>
          <SharedFragenEditor
            frage={aktiveFrage}
            onSpeichern={handleSpeichern}
            onAbbrechen={() => {
              setEditorOffen(false)
              setAktiveFrage(null)
            }}
            onLoeschen={async (frage) => {
              await frageLoeschen(frage)
              setEditorOffen(false)
              setAktiveFrage(null)
            }}
          />
          {speichern && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
              <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-4 shadow-xl">
                <p className="text-sm dark:text-white">Wird gespeichert...</p>
              </div>
            </div>
          )}
        </UebenEditorProvider>
      )}
    </div>
  )
}
