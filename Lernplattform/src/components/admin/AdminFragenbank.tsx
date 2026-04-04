import { useState, useEffect, useCallback } from 'react'
import { useGruppenStore } from '../../store/gruppenStore'
import { fragenAdapter } from '../../adapters/appsScriptAdapter'
import type { Frage } from '../../types/fragen'
import { getFragetext } from '../../utils/fragetext'

// Lazy-Import für SharedFragenEditor + Provider (nur wenn Editor offen)
import LernplattformEditorProvider from './LernplattformEditorProvider'
import SharedFragenEditor from '@shared/editor/SharedFragenEditor'

const FACH_FARBEN: Record<string, string> = {
  VWL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  BWL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Recht: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Informatik: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export default function AdminFragenbank() {
  const { aktiveGruppe } = useGruppenStore()
  const [fragen, setFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [editorOffen, setEditorOffen] = useState(false)
  const [aktiveFrage, setAktiveFrage] = useState<Frage | null>(null)
  const [filterFach, setFilterFach] = useState<string>('')
  const [filterThema, setFilterThema] = useState<string>('')
  const [filterTyp, setFilterTyp] = useState<string>('')
  const [suchtext, setSuchtext] = useState('')
  const [speichern, setSpeichern] = useState(false)

  // Fragen laden
  const ladeFragen = useCallback(async () => {
    if (!aktiveGruppe) return
    setLaden(true)
    setFehler(null)
    try {
      const result = await fragenAdapter.ladeFragen(aktiveGruppe.id)
      setFragen(result)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fragen laden fehlgeschlagen')
    } finally {
      setLaden(false)
    }
  }, [aktiveGruppe])

  useEffect(() => { ladeFragen() }, [ladeFragen])

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

  // Speichern-Handler — Frage kommt direkt im shared-Format, keine Konvertierung nötig
  async function handleSpeichern(frage: Frage) {
    if (!aktiveGruppe) return
    setSpeichern(true)
    try {
      await fragenAdapter.speichereFrage(aktiveGruppe.id, frage)
      // Cache invalidieren und neu laden
      fragenAdapter.invalidateCache(aktiveGruppe.id)
      await ladeFragen()
      setEditorOffen(false)
      setAktiveFrage(null)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSpeichern(false)
    }
  }

  // Filter-Optionen aus Daten ableiten
  const faecher = [...new Set(fragen.map(f => f.fach))].sort()
  const themen = [...new Set(fragen.filter(f => !filterFach || f.fach === filterFach).map(f => f.thema).filter(Boolean))].sort()
  const typen = [...new Set(fragen.map(f => f.typ))].sort()

  const gefilterteFragen = fragen.filter(f => {
    if (filterFach && f.fach !== filterFach) return false
    if (filterThema && f.thema !== filterThema) return false
    if (filterTyp && f.typ !== filterTyp) return false
    if (suchtext) {
      const s = suchtext.toLowerCase()
      const text = getFragetext(f)?.toLowerCase() ?? ''
      const thema = f.thema?.toLowerCase() ?? ''
      if (!text.includes(s) && !thema.includes(s)) return false
    }
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">
            Fragenbank
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fragen.length} Fragen{filterFach ? ` (${gefilterteFragen.length} angezeigt)` : ''}
          </p>
        </div>
        <button
          onClick={neueFrageErstellen}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium min-h-[44px]"
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
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
        />

        {/* Fach-Filter */}
        {faecher.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setFilterFach(''); setFilterThema('') }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !filterFach
                  ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Alle Fächer
            </button>
            {faecher.map(fach => (
              <button
                key={fach}
                onClick={() => { setFilterFach(fach === filterFach ? '' : fach); setFilterThema('') }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterFach === fach
                    ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                    : FACH_FARBEN[fach] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {fach}
              </button>
            ))}
          </div>
        )}

        {/* Thema + Typ Filter */}
        <div className="flex gap-2 flex-wrap">
          {themen.length > 1 && (
            <select
              value={filterThema}
              onChange={(e) => setFilterThema(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">Alle Themen</option>
              {themen.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {typen.length > 1 && (
            <select
              value={filterTyp}
              onChange={(e) => setFilterTyp(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">Alle Typen</option>
              {typen.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {(filterFach || filterThema || filterTyp || suchtext) && (
            <button
              onClick={() => { setFilterFach(''); setFilterThema(''); setFilterTyp(''); setSuchtext('') }}
              className="px-2 py-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      {laden && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">📝</p>
          <p>Noch keine Fragen vorhanden.</p>
          <button onClick={neueFrageErstellen} className="text-blue-600 underline text-sm mt-2">
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
              className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-white truncate">
                    {getFragetext(frage) || '(Kein Fragetext)'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${FACH_FARBEN[frage.fachbereich] || 'bg-gray-100 text-gray-600'}`}>
                      {frage.fachbereich}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {frage.typ}
                    </span>
                    {frage.thema && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        · {frage.thema}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {'★'.repeat(frage.schwierigkeit ?? 2)}{'☆'.repeat(3 - (frage.schwierigkeit ?? 2))}
                    </span>
                  </div>
                </div>
                <span className="text-gray-300 dark:text-gray-600 text-lg">›</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Editor Modal (Overlay) */}
      {editorOffen && (
        <LernplattformEditorProvider>
          <SharedFragenEditor
            frage={aktiveFrage}
            onSpeichern={handleSpeichern}
            onAbbrechen={() => {
              setEditorOffen(false)
              setAktiveFrage(null)
            }}
          />
          {speichern && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
              <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-4 shadow-xl">
                <p className="text-sm dark:text-white">Wird gespeichert...</p>
              </div>
            </div>
          )}
        </LernplattformEditorProvider>
      )}
    </div>
  )
}
