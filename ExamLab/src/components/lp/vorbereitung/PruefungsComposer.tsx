import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { TabBar } from '../../ui/TabBar'
import { useAuthStore } from '../../../store/authStore.ts'
import { useSchulConfig } from '../../../store/schulConfigStore.ts'
import { istGueltigesGefaess } from '../../../utils/gefaessUtils.ts'
import { useFragensammlungStore } from '../../../store/fragensammlungStore.ts'
import { useLPNavigationStore } from '../../../store/lpUIStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { preWarmFragen } from '../../../services/preWarmApi'
import { demoFragen } from '../../../data/demoFragen.ts'
import { useFragenStats } from '../../../hooks/useFragenStats'
import { useAutoSavePruefung } from '../../../hooks/useAutoSavePruefung'
import type { Frage } from '../../../types/fragen-storage'
import type { PruefungsConfig, PruefungsAbschnitt } from '../../../types/pruefung.ts'

import { LPAppHeaderContainer } from '../LPAppHeaderContainer'
import FragenBrowser from '../fragensammlung/FragenBrowser.tsx'
import HilfeSeite from '../HilfeSeite.tsx'
import SuSVorschau from './SuSVorschau.tsx'
import ConfigTab from './composer/ConfigTab.tsx'
import AbschnitteTab from './composer/AbschnitteTab.tsx'
import VorschauTab from './composer/VorschauTab'
import AnalyseTab from './composer/AnalyseTab.tsx'
import { LoeschDialoge } from './composer/LoeschDialoge'
import { generiereId } from './composer/composerHelpers'

interface Props {
  config: PruefungsConfig | null
  onZurueck: () => void
  onDuplizieren?: (config: PruefungsConfig) => void
}

type ComposerTab = 'config' | 'abschnitte' | 'vorschau' | 'analyse'

import { leerePruefung, leereUebung } from './configVorlagen'
export { leereUebung }

export default function PruefungsComposer({ config, onZurueck, onDuplizieren }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)
  const schulConfig = useSchulConfig((s) => s.config)

  const [pruefung, setPruefung] = useState<PruefungsConfig>(config ?? { ...leerePruefung })
  const [tab, setTab] = useState<ComposerTab>('config')
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'speichern' | 'erfolg' | 'fehler'>('idle')
  const [zeigFragenBrowser, setZeigFragenBrowser] = useState(false)
  const [zielAbschnittIndex, setZielAbschnittIndex] = useState<number>(0)
  const [initialEditFrageId, setInitialEditFrageId] = useState<string | undefined>(undefined)
  const [loeschDialog, setLoeschDialog] = useState<{ index: number; titel: string } | null>(null)
  const [zeigHilfe, setZeigHilfe] = useState(false)
  const [zeigSuSVorschau, setZeigSuSVorschau] = useState(false)
  const [zeigLoeschPruefung, setZeigLoeschPruefung] = useState(false)
  const [loescht, setLoescht] = useState(false)

  // Ref-Spiegel für aktuellen Zustand — verhindert stale Closures in Autosave-Timern
  const pruefungRef = useRef(pruefung)
  pruefungRef.current = pruefung
  const speichertRef = useRef(false)

  // Fragen-Map aus Store (wird beim Login parallel geladen)
  // detailCache wird zuerst gefüllt (on-demand), fragenMap nach Background-Prefetch
  const storeFragenMap = useFragensammlungStore(s => s.fragenMap)
  const storeDetailCache = useFragensammlungStore(s => s.detailCache)
  const storeStatus = useFragensammlungStore(s => s.status)

  // Im Demo-Modus: Demo-Fragen direkt nutzen, sonst Store (Detail-Cache hat Vorrang)
  const fragenMap = (istDemoModus || !apiService.istKonfiguriert())
    ? Object.fromEntries(demoFragen.map(f => [f.id, f]))
    : (Object.keys(storeFragenMap).length > 0 ? storeFragenMap : storeDetailCache)
  const fragenGeladen = (istDemoModus || !apiService.istKonfiguriert())
    ? true
    : (storeStatus === 'fertig' || storeStatus === 'summary_fertig' || storeStatus === 'detail_laden')

  // Falls Store noch nicht geladen: Laden anstossen (Fallback)
  useEffect(() => {
    if (!istDemoModus && apiService.istKonfiguriert() && user && storeStatus === 'idle') {
      useFragensammlungStore.getState().lade(user.email)
    }
  }, [istDemoModus, user, storeStatus])

  // Tracker-Daten laden für Fragen-Statistiken
  const fragenStats = useFragenStats()

  // Autosave-Hook: 3 Sekunden Debounce, JSON-Diff-Erkennung
  const { autoSaveStatus, markAsSaved, cancelTimer: cancelAutoSave } = useAutoSavePruefung({
    pruefung,
    onSave: () => handleSpeichernIntern(),
  })

  const gesamtFragen = pruefung.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)

  // Gesamtpunkte aus Fragen berechnen (wenn Fragen vorhanden)
  const berechnetePunkte = useMemo(() => {
    if (gesamtFragen === 0) return undefined
    let total = 0
    for (const abschnitt of pruefung.abschnitte) {
      for (const fid of abschnitt.fragenIds) {
        const frage = fragenMap[fid]
        if (frage) total += frage.punkte ?? 0
      }
    }
    return total
  }, [pruefung.abschnitte, fragenMap, gesamtFragen])

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

  function reorderFragenInAbschnitt(abschnittIndex: number, neueFragenIds: string[]): void {
    updateAbschnitt(abschnittIndex, { fragenIds: neueFragenIds })
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

  /** fragenMap aktualisieren wenn Frage im Browser erstellt/bearbeitet wird */
  const handleFrageAktualisiert = useCallback((frage: Frage) => {
    useFragensammlungStore.getState().aktualisiereFrage(frage)
  }, [])

  /** Interne Speicher-Logik (wiederverwendbar für Autosave und manuelles Speichern) */
  async function handleSpeichernIntern(): Promise<boolean> {
    // Guard: Verhindert parallele Saves (Race zwischen Autosave und manuellem Save)
    if (speichertRef.current) return true
    speichertRef.current = true

    try {
      // WICHTIG: pruefungRef.current statt pruefung — immer aktueller Zustand,
      // nicht der Closure-Snapshot vom Zeitpunkt der Timer-Erstellung
      const zuSpeichern = { ...pruefungRef.current }
      if (!zuSpeichern.id) {
        zuSpeichern.id = generiereId(zuSpeichern)
      }
      if (!zuSpeichern.erlaubteKlasse || zuSpeichern.erlaubteKlasse === '—' || zuSpeichern.erlaubteKlasse === '-') {
        zuSpeichern.erlaubteKlasse = zuSpeichern.klasse
      }
      if (!istGueltigesGefaess(zuSpeichern.gefaess, schulConfig)) {
        zuSpeichern.gefaess = schulConfig.gefaesse[0] ?? 'SF'
      }

      if (istDemoModus || !apiService.istKonfiguriert()) {
        await new Promise((r) => setTimeout(r, 300))
        setPruefung(zuSpeichern)
        markAsSaved(zuSpeichern)
        return true
      }

      const ok = await apiService.speichereConfig(user!.email, zuSpeichern)
      if (ok) {
        setPruefung(zuSpeichern)
        markAsSaved(zuSpeichern)

        // Bundle G.a Trigger A: Pre-Warm der fragenIds dieser Prüfung
        const fragenIds = (zuSpeichern.abschnitte ?? [])
          .flatMap((a) => a.fragenIds ?? [])
          .filter((id): id is string => typeof id === 'string')
        if (fragenIds.length > 0 && zuSpeichern.klasse) {
          const fachbereich = (zuSpeichern.fachbereiche ?? [])[0]
          void preWarmFragen(fragenIds, zuSpeichern.klasse, fachbereich)
        }
      }
      return ok
    } finally {
      speichertRef.current = false
    }
  }

  async function handleSpeichern(): Promise<void> {
    // Autosave-Timer abbrechen — manuelles Speichern hat Vorrang
    cancelAutoSave()
    setSpeicherStatus('speichern')
    const ok = await handleSpeichernIntern()
    if (ok) {
      // vorherigePruefungRef wird bereits in handleSpeichernIntern aktualisiert
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

  async function handleLoeschePruefung(): Promise<void> {
    if (!pruefung.id) {
      // Noch nicht gespeicherte Prüfung → einfach zurück
      onZurueck()
      return
    }
    setLoescht(true)
    if (istDemoModus || !apiService.istKonfiguriert()) {
      await new Promise((r) => setTimeout(r, 300))
      setLoescht(false)
      setZeigLoeschPruefung(false)
      onZurueck()
      return
    }
    const ok = await apiService.loeschePruefung(user!.email, pruefung.id)
    setLoescht(false)
    if (ok) {
      setZeigLoeschPruefung(false)
      onZurueck()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <LPAppHeaderContainer
        onHilfe={() => { setZeigFragenBrowser(false); setZeigHilfe(!zeigHilfe) }}
        onEinstellungen={() => {}}
        onZurueck={onZurueck}
        breadcrumbs={useLPNavigationStore.getState().breadcrumbs}
        statusText={
          speicherStatus === 'erfolg' ? 'Gespeichert'
          : speicherStatus === 'fehler' ? 'Fehler beim Speichern'
          : autoSaveStatus === 'gespeichert' && speicherStatus === 'idle' ? 'Automatisch gespeichert'
          : undefined
        }
        aktionsButtons={
          <div className="flex items-center gap-1">
            {config && onDuplizieren && (
              <button
                onClick={() => onDuplizieren(pruefung)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Duplizieren
              </button>
            )}
            <button
              onClick={handleSpeichern}
              disabled={speicherStatus === 'speichern' || !pruefung.titel.trim()}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {speicherStatus === 'speichern' ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2">
        <TabBar
          tabs={[
            { id: 'config', label: 'Einstellungen' },
            { id: 'abschnitte', label: `Abschnitte & Fragen (${gesamtFragen})` },
            { id: 'vorschau', label: 'Vorschau' },
            { id: 'analyse', label: 'Analyse', disabled: gesamtFragen === 0 },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as ComposerTab)}
          size="md"
        />
      </div>

      {/* Content */}
      <main className="p-6">
        {tab === 'config' && (
          <ConfigTab pruefung={pruefung} updatePruefung={updatePruefung} toggleFachbereich={toggleFachbereich} berechnetePunkte={berechnetePunkte} />
        )}
        {tab === 'abschnitte' && (
          <AbschnitteTab
            pruefung={pruefung}
            fragenMap={fragenMap}
            fragenGeladen={fragenGeladen}
            fragenStats={fragenStats}
            onAddAbschnitt={addAbschnitt}
            onRemoveAbschnitt={removeAbschnitt}
            onMoveAbschnitt={moveAbschnitt}
            onUpdateAbschnitt={updateAbschnitt}
            onRemoveFrage={removeFrageAusAbschnitt}
            onMoveFrage={moveFrageInAbschnitt}
            onReorderFragen={reorderFragenInAbschnitt}
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
        {tab === 'vorschau' && <VorschauTab pruefung={pruefung} fragenMap={fragenMap} fragenGeladen={fragenGeladen} onSuSVorschau={() => setZeigSuSVorschau(true)} />}
        {tab === 'analyse' && (
          <AnalyseTab pruefung={pruefung} fragenMap={fragenMap} fragenGeladen={fragenGeladen} />
        )}

        {/* Prüfung löschen — nur bei bestehender Prüfung */}
        {config && (
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setZeigLoeschPruefung(true)}
              className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer transition-colors"
            >
              {pruefung.typ === 'formativ' ? 'Übung löschen...' : 'Prüfung löschen...'}
            </button>
          </div>
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
          zielPruefungTitel={pruefung.titel || (pruefung.typ === 'formativ' ? 'Neue Übung' : 'Neue Prüfung')}
          zielAbschnittTitel={pruefung.abschnitte[zielAbschnittIndex]?.titel}
          onFrageAktualisiert={handleFrageAktualisiert}
        />
      )}

      {/* SuS-Vorschau Overlay */}
      {zeigSuSVorschau && (
        <SuSVorschau
          config={pruefung}
          onSchliessen={() => setZeigSuSVorschau(false)}
        />
      )}

      {/* Hilfe Overlay */}
      {zeigHilfe && (
        <HilfeSeite onSchliessen={() => setZeigHilfe(false)} />
      )}

      <LoeschDialoge
        loeschDialog={loeschDialog}
        onAbschnittAbbrechen={() => setLoeschDialog(null)}
        onAbschnittBestaetigen={bestaetigeLoeschen}
        zeigLoeschPruefung={zeigLoeschPruefung}
        pruefungTyp={pruefung.typ}
        pruefungTitel={pruefung.titel}
        loescht={loescht}
        onPruefungAbbrechen={() => setZeigLoeschPruefung(false)}
        onPruefungLoeschen={handleLoeschePruefung}
      />
    </div>
  )
}

