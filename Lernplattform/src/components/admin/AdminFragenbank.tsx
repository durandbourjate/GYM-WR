import { useState, useEffect, useCallback } from 'react'
import { useGruppenStore } from '../../store/gruppenStore'
import { fragenAdapter } from '../../adapters/appsScriptAdapter'
import { toSharedFrage, fromSharedFrage } from '../../adapters/frageAdapter'
import type { Frage } from '../../types/fragen'
import type { Frage as SharedFrage } from '@shared/types/fragen'

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

  // Speichern-Handler
  async function handleSpeichern(sharedFrage: SharedFrage) {
    if (!aktiveGruppe) return
    setSpeichern(true)
    try {
      const lpFrage = fromSharedFrage(sharedFrage, aktiveFrage ?? undefined)
      // speichereFrage wird in Task 5 zum Adapter hinzugefügt
      const adapter = fragenAdapter as { speichereFrage?: (gruppeId: string, frage: Frage) => Promise<unknown> }
      if (adapter.speichereFrage) {
        await adapter.speichereFrage(aktiveGruppe.id, lpFrage)
      }
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

  // Filter
  const faecher = [...new Set(fragen.map(f => f.fach))].sort()
  const gefilterteFragen = filterFach
    ? fragen.filter(f => f.fach === filterFach)
    : fragen

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

      {/* Fach-Filter */}
      {faecher.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterFach('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !filterFach
                ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Alle
          </button>
          {faecher.map(fach => (
            <button
              key={fach}
              onClick={() => setFilterFach(fach === filterFach ? '' : fach)}
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
                    {frage.frage || '(Kein Fragetext)'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${FACH_FARBEN[frage.fach] || 'bg-gray-100 text-gray-600'}`}>
                      {frage.fach}
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
                      {'★'.repeat(frage.schwierigkeit)}{'☆'.repeat(3 - frage.schwierigkeit)}
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
            frage={aktiveFrage ? toSharedFrage(aktiveFrage) : null}
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
