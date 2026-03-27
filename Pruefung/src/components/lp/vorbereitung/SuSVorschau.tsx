import { useState, useEffect, useRef, useCallback } from 'react'
import { usePruefungStore } from '../../../store/pruefungStore.ts'
import { demoFragen } from '../../../data/demoFragen.ts'
import type { PruefungsConfig } from '../../../types/pruefung.ts'
import type { Frage } from '../../../types/fragen.ts'
import Startbildschirm from '../../Startbildschirm.tsx'
import Layout from '../../Layout.tsx'

interface Props {
  config: PruefungsConfig
  onSchliessen: () => void
}

/**
 * SuS-Vorschau: Zeigt die Prüfung exakt so an, wie die SuS sie sehen.
 * Nutzt die echten SuS-Komponenten (Startbildschirm + Layout).
 *
 * Der pruefungStore wird temporär mit den Vorschau-Daten befüllt
 * und beim Schliessen wiederhergestellt.
 */
export default function SuSVorschau({ config, onSchliessen }: Props) {
  const [phase, setPhase] = useState<'start' | 'pruefung'>('start')

  // Store-Snapshot sichern beim Mounten, wiederherstellen beim Unmounten
  const storeSnapshotRef = useRef<Record<string, unknown> | null>(null)

  // Fragen für die Vorschau auflösen (aus demoFragen)
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

    return () => {
      // Store wiederherstellen beim Unmounten
      if (storeSnapshotRef.current) {
        usePruefungStore.setState(storeSnapshotRef.current)
      }
    }
  }, [])

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

  // Prüfung in der Vorschau starten — befüllt den globalen Store
  const handleStart = useCallback(() => {
    usePruefungStore.getState().pruefungStarten(
      { ...config, freigeschaltet: true },
      vorschauResolved.current.navigationsFragen,
      vorschauResolved.current.alleFragen,
    )
    setPhase('pruefung')
  }, [config])

  // Abgabe abfangen — in der Vorschau einfach zurück zum Start
  useEffect(() => {
    if (phase !== 'pruefung') return

    const unsub = usePruefungStore.subscribe((state) => {
      if (state.abgegeben || state.phase === 'abgegeben') {
        // Zurück zum Start statt echte Abgabe
        setPhase('start')
      }
    })
    return unsub
  }, [phase])

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
          onClick={onSchliessen}
          className="px-4 py-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
        >
          Vorschau schliessen
        </button>
      </div>

      {/* Inhalt */}
      <div className="flex-1 overflow-auto">
        {phase === 'start' && (
          <VorschauStartbildschirm
            config={config}
            fragen={vorschauResolved.current.navigationsFragen}
            onStart={handleStart}
          />
        )}
        {phase === 'pruefung' && <Layout />}
      </div>
    </div>
  )
}

/**
 * Wrapper um den Startbildschirm für die Vorschau.
 * Nutzt den echten Startbildschirm, fängt aber den Start-Click ab.
 */
function VorschauStartbildschirm({
  config,
  fragen,
  onStart,
}: {
  config: PruefungsConfig
  fragen: Frage[]
  onStart: () => void
}) {
  // Den echten Startbildschirm rendern, aber den pruefungStarten-Call abfangen
  // Wir überschreiben pruefungStarten temporär
  useEffect(() => {
    const original = usePruefungStore.getState().pruefungStarten
    usePruefungStore.setState({
      pruefungStarten: (_config, _fragen, _alleFragen) => {
        onStart()
      },
    })
    return () => {
      usePruefungStore.setState({ pruefungStarten: original })
    }
  }, [onStart])

  return (
    <Startbildschirm
      config={{ ...config, freigeschaltet: true }}
      fragen={fragen}
      wiederhergestellt={false}
    />
  )
}

/** Löst die Fragen-IDs aus der Config gegen die demoFragen auf */
function resolveVorschauFragen(config: PruefungsConfig): { navigationsFragen: Frage[]; alleFragen: Frage[] } {
  const fragenMap = new Map(demoFragen.map((f) => [f.id, f]))
  const navigationsFragen: Frage[] = []
  const alleFragen: Frage[] = []
  const hinzugefuegt = new Set<string>()
  for (const abschnitt of config.abschnitte) {
    for (const id of abschnitt.fragenIds) {
      const frage = fragenMap.get(id)
      if (frage && !hinzugefuegt.has(id)) {
        navigationsFragen.push(frage)
        alleFragen.push(frage)
        hinzugefuegt.add(id)
        // Aufgabengruppen: Teilaufgaben nur in alleFragen
        if (frage.typ === 'aufgabengruppe' && 'teilaufgabenIds' in frage) {
          for (const tid of (frage as { teilaufgabenIds: string[] }).teilaufgabenIds) {
            const teilfrage = fragenMap.get(tid)
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
