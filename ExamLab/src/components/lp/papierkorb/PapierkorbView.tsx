/**
 * PapierkorbView — Bundle 3 Phase E.
 *
 * Listet eigene soft-deletete Fragen (geloescht_am !== '') des aktuellen LP.
 * Zwei Aktionen pro Eintrag: Wiederherstellen + Endgültig löschen.
 * Auto-Delete-Hinweis bei >83 Tage altem Eintrag (Backend löscht nach 90 Tagen).
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { useToast } from '../../../hooks/useToast'
import Button from '../../ui/Button'
import {
  listePapierkorb,
  stelleWiederHer,
  hardDeleteFrage,
} from '../../../services/draftApi'
import type { Frage } from '../../../types/fragen-storage'

type Ladestatus = 'idle' | 'laden' | 'fertig' | 'fehler'

const AUTO_DELETE_TAGE = 90
const WARNING_SCHWELLE_TAGE = 7

function tageBisAutoDelete(geloescht_am: string): number {
  const geloescht = new Date(geloescht_am).getTime()
  if (Number.isNaN(geloescht)) return AUTO_DELETE_TAGE
  const jetzt = Date.now()
  const tageVergangen = Math.floor(
    (jetzt - geloescht) / (1000 * 60 * 60 * 24),
  )
  return Math.max(0, AUTO_DELETE_TAGE - tageVergangen)
}

function formatGeloescht(geloescht_am: string): string {
  const geloescht = new Date(geloescht_am).getTime()
  if (Number.isNaN(geloescht)) return ''
  const jetzt = Date.now()
  const tageVergangen = Math.floor(
    (jetzt - geloescht) / (1000 * 60 * 60 * 24),
  )
  if (tageVergangen <= 0) return 'heute gelöscht'
  if (tageVergangen === 1) return 'vor 1 Tag gelöscht'
  if (tageVergangen < 30) return `vor ${tageVergangen} Tagen gelöscht`
  return `gelöscht am ${new Date(geloescht_am).toLocaleDateString('de-CH')}`
}

function snippet(text: string, max = 120): string {
  if (!text) return ''
  if (text.length <= max) return text
  return text.slice(0, max) + '…'
}

export default function PapierkorbView() {
  const toast = useToast()
  const ownEmail = useAuthStore((s) => s.user?.email) || ''
  const [fragen, setFragen] = useState<Frage[]>([])
  const [ladestatus, setLadestatus] = useState<Ladestatus>('idle')
  const [fehler, setFehler] = useState<string>('')

  const lade = useCallback(async () => {
    if (!ownEmail) {
      setLadestatus('fehler')
      setFehler('Keine E-Mail im Login-Context.')
      return
    }
    setLadestatus('laden')
    setFehler('')
    try {
      const result = await listePapierkorb({ email: ownEmail })
      setFragen(result)
      setLadestatus('fertig')
    } catch (e) {
      setLadestatus('fehler')
      setFehler(e instanceof Error ? e.message : String(e))
    }
  }, [ownEmail])

  useEffect(() => {
    void lade()
  }, [lade])

  const handleWiederherstellen = useCallback(
    async (frage: Frage) => {
      const titel = frage.thema || 'Unbenannte Frage'
      if (!window.confirm(`„${titel}" wiederherstellen?`)) return
      try {
        await stelleWiederHer({
          email: ownEmail,
          frageId: frage.id,
          fachbereich: frage.fachbereich,
        })
        setFragen((prev) => prev.filter((f) => f.id !== frage.id))
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        toast.error(`Fehler beim Wiederherstellen: ${msg}`)
      }
    },
    [ownEmail, toast],
  )

  const handleEndgueltigLoeschen = useCallback(
    async (frage: Frage) => {
      const titel = frage.thema || 'Unbenannte Frage'
      if (
        !window.confirm(
          `„${titel}" ENDGÜLTIG löschen? Kann nicht rückgängig gemacht werden.`,
        )
      )
        return
      try {
        await hardDeleteFrage({
          email: ownEmail,
          frageId: frage.id,
          fachbereich: frage.fachbereich,
        })
        setFragen((prev) => prev.filter((f) => f.id !== frage.id))
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        toast.error(`Fehler beim Löschen: ${msg}`)
      }
    },
    [ownEmail, toast],
  )

  // Loading
  if (ladestatus === 'laden' || ladestatus === 'idle') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Papierkorb</h1>
        <p className="text-gray-500">Wird geladen …</p>
      </div>
    )
  }

  // Fehler
  if (ladestatus === 'fehler') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Papierkorb</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700 font-medium mb-2">
            Fehler beim Laden des Papierkorbs
          </p>
          <p className="text-red-600 text-sm mb-3">{fehler}</p>
          <button
            type="button"
            onClick={() => void lade()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // Empty
  if (fragen.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Papierkorb</h1>
        <p className="text-gray-500">Der Papierkorb ist leer.</p>
        <p className="text-gray-400 text-sm mt-2">
          Gelöschte Fragen erscheinen hier und werden nach 90 Tagen automatisch
          endgültig entfernt.
        </p>
      </div>
    )
  }

  // Liste
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Papierkorb ({fragen.length})</h1>
      <p className="text-gray-500 text-sm mb-4">
        Gelöschte Fragen werden nach 90 Tagen automatisch endgültig entfernt.
      </p>
      <ul className="space-y-3">
        {fragen.map((frage) => {
          const tageBis = frage.geloescht_am
            ? tageBisAutoDelete(frage.geloescht_am)
            : AUTO_DELETE_TAGE
          const istWarnung = tageBis <= WARNING_SCHWELLE_TAGE
          return (
            <li
              key={frage.id}
              className="border border-gray-200 dark:border-slate-700 rounded p-4 bg-white dark:bg-slate-800"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-slate-100">
                    {frage.thema || 'Ohne Titel'}
                  </div>
                  {(() => {
                    // BuchungssatzFrage hat kein fragetext-Feld — defensiv lesen
                    const text = (frage as { fragetext?: string }).fragetext
                    return text ? (
                      <div className="text-sm text-gray-600 dark:text-slate-300 mt-1 truncate">
                        {snippet(text)}
                      </div>
                    ) : null
                  })()}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
                    <span>{frage.fachbereich}</span>
                    {frage.geloescht_am && (
                      <span>{formatGeloescht(frage.geloescht_am)}</span>
                    )}
                    {istWarnung && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 rounded font-medium">
                        Wird in {tageBis} {tageBis === 1 ? 'Tag' : 'Tagen'}{' '}
                        endgültig gelöscht
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-row gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleWiederherstellen(frage)}
                  >
                    Wiederherstellen
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => void handleEndgueltigLoeschen(frage)}
                  >
                    Endgültig löschen
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
