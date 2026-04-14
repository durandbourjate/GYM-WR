import { useEffect, useRef, useCallback } from 'react'
import { usePruefungStore } from '../../../store/pruefungStore.ts'
import { useFragenbankStore } from '../../../store/fragenbankStore.ts'
import { demoFragen } from '../../../data/demoFragen.ts'
import type { PruefungsConfig } from '../../../types/pruefung.ts'
import type { Frage } from '../../../types/fragen.ts'
import Layout from '../../Layout.tsx'

interface Props {
  config: PruefungsConfig
  onSchliessen: () => void
}

/**
 * SuS-Vorschau: Zeigt die Prüfung exakt so an, wie die SuS sie sehen.
 * Nutzt die echten SuS-Komponenten (Layout).
 *
 * Überspringt den Startbildschirm und zeigt direkt die Fragen.
 * Der pruefungStore wird temporär mit den Vorschau-Daten befüllt
 * und beim Schliessen wiederhergestellt.
 */
export default function SuSVorschau({ config, onSchliessen }: Props) {
  // Store-Snapshot sichern beim Mounten, wiederherstellen beim Unmounten
  const storeSnapshotRef = useRef<Record<string, unknown> | null>(null)
  const gestartetRef = useRef(false)

  // Fragen auflösen: zuerst aus Fragenbank, Fallback auf demoFragen
  const vorschauResolved = useRef(resolveVorschauFragen(config))

  useEffect(() => {
    // Aktuellen Store-State sichern
    const state = usePruefungStore.getState()
    storeSnapshotRef.current = {
      config: state.config,
      fragen: state.fragen,
      alleFragen: state.alleFragen,
      aktuelleFrageIndex: state.aktuelleFrageIndex,
      phase: state.phase,
      antworten: state.antworten,
      markierungen: state.markierungen,
      startzeit: state.startzeit,
      abgegeben: state.abgegeben,
    }

    // Direkt starten — Startbildschirm überspringen
    if (!gestartetRef.current) {
      gestartetRef.current = true
      usePruefungStore.getState().pruefungStarten(
        { ...config, freigeschaltet: true },
        vorschauResolved.current.navigationsFragen,
        vorschauResolved.current.alleFragen,
      )
    }

    return () => {
      // Store wiederherstellen beim Unmounten
      if (storeSnapshotRef.current) {
        usePruefungStore.setState(storeSnapshotRef.current)
      }
    }
  }, [config])

  // Escape-Taste zum Schliessen
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onSchliessen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSchliessen])

  // Abgabe abfangen — in der Vorschau zurück zur Bearbeitung
  const abgabeAbfangenRef = useRef(false)
  useEffect(() => {
    const unsub = usePruefungStore.subscribe((state) => {
      if ((state.abgegeben || state.phase === 'abgegeben') && !abgabeAbfangenRef.current) {
        abgabeAbfangenRef.current = true
        onSchliessen()
      }
    })
    return unsub
  }, [onSchliessen])

  const handleZurueck = useCallback(() => {
    onSchliessen()
  }, [onSchliessen])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Vorschau-Banner */}
      <div className="flex-shrink-0 bg-red-600 dark:bg-red-700 text-white px-4 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wide uppercase">
            Vorschau
          </span>
          <span className="text-sm text-red-100">
            So sehen Ihre SuS die Prüfung
          </span>
        </div>
        <button
          onClick={handleZurueck}
          className="px-4 py-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
        >
          Zurück zur Bearbeitung
        </button>
      </div>

      {/* Inhalt */}
      <div className="flex-1 overflow-auto">
        <Layout />
      </div>
    </div>
  )
}

/** Löst die Fragen-IDs aus der Config gegen die Fragenbank auf (Fallback: demoFragen) */
function resolveVorschauFragen(config: PruefungsConfig): { navigationsFragen: Frage[]; alleFragen: Frage[] } {
  // Zuerst Fragenbank versuchen, dann demoFragen als Fallback
  const fragenbankMap = useFragenbankStore.getState().fragenMap
  const demoMap = new Map(demoFragen.map((f) => [f.id, f]))

  function findeFrage(id: string): Frage | undefined {
    return fragenbankMap[id] || demoMap.get(id)
  }

  const navigationsFragen: Frage[] = []
  const alleFragen: Frage[] = []
  const hinzugefuegt = new Set<string>()
  for (const abschnitt of config.abschnitte) {
    for (const id of abschnitt.fragenIds) {
      const frage = findeFrage(id)
      if (frage && !hinzugefuegt.has(id)) {
        navigationsFragen.push(frage)
        alleFragen.push(frage)
        hinzugefuegt.add(id)
        // Aufgabengruppen: Teilaufgaben nur in alleFragen
        if (frage.typ === 'aufgabengruppe' && 'teilaufgabenIds' in frage) {
          for (const tid of (frage as { teilaufgabenIds: string[] }).teilaufgabenIds) {
            const teilfrage = findeFrage(tid)
            if (teilfrage && !hinzugefuegt.has(tid)) {
              alleFragen.push(teilfrage)
              hinzugefuegt.add(tid)
            }
          }
        }
      }
    }
  }
  return { navigationsFragen, alleFragen }
}
