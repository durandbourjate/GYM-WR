import { useState, useCallback, useRef, useEffect } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import { demoFragen } from '../../data/demoFragen.ts'
import type { Frage } from '../../types/fragen.ts'
import type { PruefungsConfig, PruefungsAbschnitt } from '../../types/pruefung.ts'

import ThemeToggle from '../ThemeToggle.tsx'
import FragenBrowser from './FragenBrowser.tsx'
import SuSVorschau from './SuSVorschau.tsx'
import ConfigTab from './composer/ConfigTab.tsx'
import AbschnitteTab from './composer/AbschnitteTab.tsx'
import VorschauTab from './composer/VorschauTab.tsx'
import AnalyseTab from './composer/AnalyseTab.tsx'

interface Props {
  config: PruefungsConfig | null
  onZurueck: () => void
}

type ComposerTab = 'config' | 'abschnitte' | 'vorschau' | 'analyse'

const leerePruefung: PruefungsConfig = {
  id: '',
  titel: '',
  klasse: '',
  gefaess: 'SF',
  semester: 'S4',
  fachbereiche: [],
  datum: new Date().toISOString().split('T')[0],
  typ: 'summativ',
  modus: 'pruefung',
  dauerMinuten: 45,
  gesamtpunkte: 0,
  erlaubteKlasse: '',
  sebErforderlich: false,
  abschnitte: [],
  zufallsreihenfolgeFragen: false,
  ruecknavigation: true,
  zeitanzeigeTyp: 'countdown',
  autoSaveIntervallSekunden: 30,
  heartbeatIntervallSekunden: 10,
  korrektur: { aktiviert: false, modus: 'batch' },
  feedback: { zeitpunkt: 'nach-review', format: 'in-app-und-pdf', detailgrad: 'vollstaendig' },
  freigeschaltet: true,
  zeitverlaengerungen: {},
}

export default function PruefungsComposer({ config, onZurueck }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [pruefung, setPruefung] = useState<PruefungsConfig>(config ?? { ...leerePruefung })
  const [tab, setTab] = useState<ComposerTab>('config')
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'speichern' | 'erfolg' | 'fehler'>('idle')
  const [zeigFragenBrowser, setZeigFragenBrowser] = useState(false)
  const [zielAbschnittIndex, setZielAbschnittIndex] = useState<number>(0)
  const [initialEditFrageId, setInitialEditFrageId] = useState<string | undefined>(undefined)
  const [loeschDialog, setLoeschDialog] = useState<{ index: number; titel: string } | null>(null)
  const [zeigSuSVorschau, setZeigSuSVorschau] = useState(false)

  const loeschDialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(loeschDialog ? loeschDialogRef : { current: null })

  // Autosave: Refs für Vergleich und Debounce
  const vorherigePruefungRef = useRef<string>(JSON.stringify(config ?? leerePruefung))
  const hasChangedRef = useRef(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'gespeichert'>('idle')

  // Fragen-Map laden
  const [fragenMap, setFragenMap] = useState<Record<string, Frage>>({})
  const [fragenGeladen, setFragenGeladen] = useState(false)
  useEffect(() => {
    async function ladeFragen(): Promise<void> {
      let fragen: Frage[]
      if (istDemoModus || !apiService.istKonfiguriert()) {
        fragen = demoFragen
      } else if (user) {
        fragen = await apiService.ladeFragenbank(user.email) ?? []
      } else {
        return
      }
      const map: Record<string, Frage> = {}
      for (const f of fragen) map[f.id] = f
      setFragenMap(map)
      setFragenGeladen(true)
    }
    ladeFragen()
  }, [istDemoModus, user])

  // Autosave-Effekt: 3 Sekunden Debounce
  useEffect(() => {
    const aktuellerJSON = JSON.stringify(pruefung)
    if (aktuellerJSON === vorherigePruefungRef.current) return

    // Beim allerersten Unterschied merken, dass sich etwas geändert hat
    if (!hasChangedRef.current) {
      hasChangedRef.current = true
      vorherigePruefungRef.current = aktuellerJSON
      return
    }

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!pruefung.titel.trim()) return

      await handleSpeichernIntern()
      vorherigePruefungRef.current = JSON.stringify(pruefung)
      setAutoSaveStatus('gespeichert')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pruefung])

  const gesamtFragen = pruefung.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)

  function updatePruefung(partial: Partial<PruefungsConfig>): void {
    setPruefung((prev) => ({ ...prev, ...partial }))
  }

  function updateAbschnitt(index: number, partial: Partial<PruefungsAbschnitt>): void {
    setPruefung((prev) => {
      const abschnitte = [...prev.abschnitte]
      abschnitte[index] = { ...abschnitte[index], ...partial }
      return { ...prev, abschnitte }
    })
  }

  function addAbschnitt(): void {
    const nr = pruefung.abschnitte.length + 1
    const neuerAbschnitt: PruefungsAbschnitt = {
      titel: `Teil ${String.fromCharCode(64 + nr)}: Neuer Abschnitt`,
      beschreibung: '',
      fragenIds: [],
    }
    updatePruefung({ abschnitte: [...pruefung.abschnitte, neuerAbschnitt] })
  }

  function removeAbschnitt(index: number): void {
    setLoeschDialog({ index, titel: pruefung.abschnitte[index].titel })
  }

  function bestaetigeLoeschen(): void {
    if (!loeschDialog) return
    const abschnitte = pruefung.abschnitte.filter((_, i) => i !== loeschDialog.index)
    updatePruefung({ abschnitte })
    setLoeschDialog(null)
  }

  function moveAbschnitt(index: number, richtung: 'hoch' | 'runter'): void {
    const abschnitte = [...pruefung.abschnitte]
    const newIndex = richtung === 'hoch' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= abschnitte.length) return
    ;[abschnitte[index], abschnitte[newIndex]] = [abschnitte[newIndex], abschnitte[index]]
    updatePruefung({ abschnitte })
  }

  function removeFrageAusAbschnitt(abschnittIndex: number, frageId: string): void {
    const abschnitt = pruefung.abschnitte[abschnittIndex]
    updateAbschnitt(abschnittIndex, {
      fragenIds: abschnitt.fragenIds.filter((id) => id !== frageId),
    })
  }

  function moveFrageInAbschnitt(abschnittIndex: number, frageIndex: number, richtung: 'hoch' | 'runter'): void {
    const abschnitt = pruefung.abschnitte[abschnittIndex]
    const ids = [...abschnitt.fragenIds]
    const newIndex = richtung === 'hoch' ? frageIndex - 1 : frageIndex + 1
    if (newIndex < 0 || newIndex >= ids.length) return
    ;[ids[frageIndex], ids[newIndex]] = [ids[newIndex], ids[newIndex === frageIndex ? newIndex : frageIndex]]
    // Korrekte Swap-Logik
    const idsKopie = [...abschnitt.fragenIds]
    ;[idsKopie[frageIndex], idsKopie[newIndex]] = [idsKopie[newIndex], idsKopie[frageIndex]]
    updateAbschnitt(abschnittIndex, { fragenIds: idsKopie })
  }

  const handleFragenHinzufuegen = useCallback((frageIds: string[]) => {
    const abschnitt = pruefung.abschnitte[zielAbschnittIndex]
    if (!abschnitt) return
    const neueIds = frageIds.filter((id) => !abschnitt.fragenIds.includes(id))
    updateAbschnitt(zielAbschnittIndex, {
      fragenIds: [...abschnitt.fragenIds, ...neueIds],
    })
    // Browser bleibt offen nach dem Hinzufügen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pruefung.abschnitte, zielAbschnittIndex])

  const handleFrageEntfernen = useCallback((frageId: string) => {
    // Frage aus allen Abschnitten entfernen
    setPruefung((prev) => ({
      ...prev,
      abschnitte: prev.abschnitte.map((a) => ({
        ...a,
        fragenIds: a.fragenIds.filter((id) => id !== frageId),
      })),
    }))
  }, [])

  /** Interne Speicher-Logik (wiederverwendbar für Autosave und manuelles Speichern) */
  async function handleSpeichernIntern(): Promise<boolean> {
    const zuSpeichern = { ...pruefung }
    if (!zuSpeichern.id) {
      zuSpeichern.id = generiereId(zuSpeichern)
    }
    if (!zuSpeichern.erlaubteKlasse) {
      zuSpeichern.erlaubteKlasse = zuSpeichern.klasse
    }

    if (istDemoModus || !apiService.istKonfiguriert()) {
      await new Promise((r) => setTimeout(r, 300))
      setPruefung(zuSpeichern)
      return true
    }

    const ok = await apiService.speichereConfig(user!.email, zuSpeichern)
    if (ok) {
      setPruefung(zuSpeichern)
    }
    return ok
  }

  async function handleSpeichern(): Promise<void> {
    setSpeicherStatus('speichern')
    const ok = await handleSpeichernIntern()
    if (ok) {
      vorherigePruefungRef.current = JSON.stringify(pruefung)
      setSpeicherStatus('erfolg')
      setTimeout(() => setSpeicherStatus('idle'), 2000)
    } else {
      setSpeicherStatus('fehler')
      setTimeout(() => setSpeicherStatus('idle'), 3000)
    }
  }

  function toggleFachbereich(fb: string): void {
    const fachbereiche = pruefung.fachbereiche.includes(fb)
      ? pruefung.fachbereiche.filter((f) => f !== fb)
      : [...pruefung.fachbereiche, fb]
    updatePruefung({ fachbereiche })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onZurueck}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {config ? 'Prüfung bearbeiten' : 'Neue Prüfung'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {speicherStatus === 'erfolg' && (
              <span className="text-sm text-green-600 dark:text-green-400">Gespeichert ✓</span>
            )}
            {speicherStatus === 'fehler' && (
              <span className="text-sm text-red-600 dark:text-red-400">Fehler beim Speichern</span>
            )}
            {autoSaveStatus === 'gespeichert' && speicherStatus === 'idle' && (
              <span className="text-sm text-green-600 dark:text-green-400">Automatisch gespeichert ✓</span>
            )}
            <div className="flex flex-col items-end gap-0.5">
              <button
                onClick={handleSpeichern}
                disabled={speicherStatus === 'speichern' || !pruefung.titel.trim()}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {speicherStatus === 'speichern' ? 'Speichern...' : 'Speichern'}
              </button>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Auto-Speichern aktiv</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto mt-2 flex gap-1">
          {([
            { key: 'config' as ComposerTab, label: 'Einstellungen' },
            { key: 'abschnitte' as ComposerTab, label: `Abschnitte & Fragen (${gesamtFragen})` },
            { key: 'vorschau' as ComposerTab, label: 'Vorschau' },
            { key: 'analyse' as ComposerTab, label: 'Analyse' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => t.key !== 'analyse' || gesamtFragen > 0 ? setTab(t.key) : undefined}
              disabled={t.key === 'analyse' && gesamtFragen === 0}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer
                ${tab === t.key
                  ? 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-b-0 border-slate-200 dark:border-slate-700'
                  : t.key === 'analyse' && gesamtFragen === 0
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        {tab === 'config' && (
          <ConfigTab pruefung={pruefung} updatePruefung={updatePruefung} toggleFachbereich={toggleFachbereich} />
        )}
        {tab === 'abschnitte' && (
          <AbschnitteTab
            pruefung={pruefung}
            fragenMap={fragenMap}
            onAddAbschnitt={addAbschnitt}
            onRemoveAbschnitt={removeAbschnitt}
            onMoveAbschnitt={moveAbschnitt}
            onUpdateAbschnitt={updateAbschnitt}
            onRemoveFrage={removeFrageAusAbschnitt}
            onMoveFrage={moveFrageInAbschnitt}
            onFragenBrowser={(abschnittIndex) => {
              setZielAbschnittIndex(abschnittIndex)
              setZeigFragenBrowser(true)
            }}
            onEditFrage={(frageId) => {
              setInitialEditFrageId(frageId)
              setZeigFragenBrowser(true)
            }}
          />
        )}
        {tab === 'vorschau' && <VorschauTab pruefung={pruefung} fragenMap={fragenMap} onSuSVorschau={() => setZeigSuSVorschau(true)} />}
        {tab === 'analyse' && (
          <AnalyseTab pruefung={pruefung} fragenMap={fragenMap} fragenGeladen={fragenGeladen} />
        )}
      </main>

      {/* Fragen-Browser Overlay */}
      {zeigFragenBrowser && (
        <FragenBrowser
          onHinzufuegen={handleFragenHinzufuegen}
          onEntfernen={handleFrageEntfernen}
          onSchliessen={() => { setZeigFragenBrowser(false); setInitialEditFrageId(undefined) }}
          bereitsVerwendet={pruefung.abschnitte.flatMap((a) => a.fragenIds)}
          initialEditFrageId={initialEditFrageId}
        />
      )}

      {/* SuS-Vorschau Overlay */}
      {zeigSuSVorschau && (
        <SuSVorschau
          config={pruefung}
          onSchliessen={() => setZeigSuSVorschau(false)}
        />
      )}

      {/* Lösch-Bestätigungsdialog */}
      {loeschDialog && (
        <div ref={loeschDialogRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              Abschnitt löschen?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Abschnitt &laquo;{loeschDialog.titel}&raquo; wirklich löschen? Die enthaltenen Fragen werden aus der Prüfung entfernt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLoeschDialog(null)}
                className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={bestaetigeLoeschen}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-medium text-sm"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function generiereId(config: PruefungsConfig): string {
  const klasse = config.klasse.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10)
  const datum = config.datum.replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6)
  return `${klasse}-${datum}-${rand}`
}
