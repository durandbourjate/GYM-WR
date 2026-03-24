import { useEffect, useState } from 'react'
import { usePruefungStore } from './store/pruefungStore.ts'
import { useAuthStore } from './store/authStore.ts'
import { einrichtungsPruefung } from './data/einrichtungsPruefung.ts'
import { einrichtungsFragen } from './data/einrichtungsFragen.ts'
import { apiService } from './services/apiService.ts'
import type { Frage } from './types/fragen.ts'
import type { PruefungsConfig } from './types/pruefung.ts'
import LoginScreen from './components/LoginScreen.tsx'
import Startbildschirm from './components/Startbildschirm.tsx'
import Layout from './components/Layout.tsx'
import FragenUebersicht from './components/FragenUebersicht.tsx'
import AbgabeZusammenfassung from './components/AbgabeZusammenfassung.tsx'
import DurchfuehrenDashboard from './components/lp/DurchfuehrenDashboard.tsx'
import LPStartseite from './components/lp/LPStartseite.tsx'
import ThemeToggle from './components/ThemeToggle.tsx'
import KorrekturListe from './components/sus/KorrekturListe.tsx'
import KorrekturEinsicht from './components/sus/KorrekturEinsicht.tsx'

// Theme-Store importieren damit er initialisiert wird
import './store/themeStore.ts'

/** Registry eingebauter Prüfungen (lokal im Bundle, kein Backend nötig) */
const EINGEBAUTE_PRUEFUNGEN: Record<string, { config: PruefungsConfig; fragen: Frage[] }> = {
  'einrichtung-sf-wr-27a28f': { config: einrichtungsPruefung, fragen: einrichtungsFragen },
}

function ladeEingebautePruefung(id: string): { config: PruefungsConfig; fragen: Frage[] } | null {
  return EINGEBAUTE_PRUEFUNGEN[id] ?? null
}

export default function App() {
  const phase = usePruefungStore((s) => s.phase)
  const config = usePruefungStore((s) => s.config)
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [pruefungsConfig, setPruefungsConfig] = useState<PruefungsConfig | null>(null)
  const [pruefungsFragen, setPruefungsFragen] = useState<Frage[]>([])
  const [wiederhergestellt, setWiederhergestellt] = useState(false)
  const [ladeFehler, setLadeFehler] = useState<string | null>(null)
  const [korrekturId, setKorrekturId] = useState<string | null>(null)

  // Prüfungs-ID aus URL lesen (?id=...)
  const pruefungIdAusUrl = new URLSearchParams(window.location.search).get('id')

  // Prüfung laden wenn User eingeloggt ist
  useEffect(() => {
    if (!user) return

    async function ladePruefung(): Promise<void> {
      // Session-Recovery: Store hat bereits config + Fragen → nicht neu laden
      const storeFragen = usePruefungStore.getState().fragen
      if (config && config.id === pruefungIdAusUrl && phase !== 'start' && storeFragen && storeFragen.length > 0) {
        setWiederhergestellt(true)
        usePruefungStore.getState().setPhase('start')
        return
      }

      // Backend konfiguriert + Prüfungs-ID vorhanden + kein Demo → vom Backend laden
      if (apiService.istKonfiguriert() && pruefungIdAusUrl && !istDemoModus) {
        try {
          const result = await apiService.ladePruefung(pruefungIdAusUrl, user!.email)
          if (result) {
            const resolvedFragen = resolveFragenFuerPruefung(result.config, result.fragen)
            setPruefungsConfig(result.config)
            setPruefungsFragen(resolvedFragen)

            if (config && config.id === result.config.id && phase !== 'start') {
              setWiederhergestellt(true)
              usePruefungStore.getState().setPhase('start')
            }
            return
          }
        } catch (error) {
          console.error('[App] Backend-Fehler beim Laden:', error)
          // Nicht crashen — Fehler anzeigen, aber NICHT auf eingebaute Prüfungen zurückfallen
          // (sonst umgeht der Schüler die Freischaltung)
        }

        setLadeFehler('Prüfung konnte nicht geladen werden. Bitte URL prüfen oder Lehrperson kontaktieren.')
        return
      }

      // Eingebaute Prüfungen auch ohne Backend laden
      if (pruefungIdAusUrl && !istDemoModus) {
        const eingebaut = ladeEingebautePruefung(pruefungIdAusUrl)
        if (eingebaut) {
          const resolvedFragen = resolveFragenFuerPruefung(eingebaut.config, eingebaut.fragen)
          setPruefungsConfig(eingebaut.config)
          setPruefungsFragen(resolvedFragen)
          return
        }
      }

      // Fallback: Im Demo-Modus die Einrichtungsprüfung laden (statt alte demoPruefung)
      const resolvedConfig = { ...einrichtungsPruefung, freigeschaltet: true }
      const resolvedFragen = resolveFragenFuerPruefung(resolvedConfig, einrichtungsFragen)
      setPruefungsConfig(resolvedConfig)
      setPruefungsFragen(resolvedFragen)

      if (config && config.id === resolvedConfig.id && phase !== 'start') {
        setWiederhergestellt(true)
        // Immer zum Startbildschirm zurück, damit User entscheiden kann
        usePruefungStore.getState().setPhase('start')
      }
    }

    ladePruefung()
  // eslint-disable-next-line react-hooks/exhaustive-deps — config/phase absichtlich ausgeschlossen: Laden nur bei User/URL-Wechsel, nicht bei State-Aenderung
  }, [user, istDemoModus, pruefungIdAusUrl])

  // Auth-Gate: Kein User → Login-Screen
  if (!user) {
    return <LoginScreen />
  }

  // LP-Modus: mit ?id= → Durchführen (Tabs), ohne → Startseite (Composer/Verwaltung)
  if (user.rolle === 'lp') {
    if (pruefungIdAusUrl) {
      return <DurchfuehrenDashboard pruefungId={pruefungIdAusUrl} />
    }
    return <LPStartseite />
  }

  // SuS ohne Prüfungs-ID: Korrektur-Einsicht
  if (user.rolle === 'sus' && !pruefungIdAusUrl && !istDemoModus && apiService.istKonfiguriert()) {
    if (korrekturId) {
      return <KorrekturEinsicht pruefungId={korrekturId} onZurueck={() => setKorrekturId(null)} />
    }
    return <KorrekturListe onWaehle={setKorrekturId} />
  }

  // Ladefehler
  if (ladeFehler) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xl">!</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 mb-4">{ladeFehler}</p>
          <button
            onClick={() => { setLadeFehler(null); useAuthStore.getState().abmelden() }}
            className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    )
  }

  // Prüfung wird geladen
  if (!pruefungsConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Prüfung wird geladen...</p>
      </div>
    )
  }

  // Routing nach Phase
  switch (phase) {
    case 'start':
      return (
        <Startbildschirm
          config={pruefungsConfig}
          fragen={pruefungsFragen}
          wiederhergestellt={wiederhergestellt}
        />
      )
    case 'pruefung':
      return <Layout />
    case 'uebersicht':
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <FragenUebersicht />
        </div>
      )
    case 'abgegeben':
      return <AbgabeBestaetigung />
    default:
      return null
  }
}

/** Löst die Fragen-IDs aus den Abschnitten auf */
function resolveFragenFuerPruefung(config: PruefungsConfig, alleFragen: Frage[]): Frage[] {
  const fragenMap = new Map(alleFragen.map((f) => [f.id, f]))
  const result: Frage[] = []
  for (const abschnitt of config.abschnitte) {
    for (const id of abschnitt.fragenIds) {
      const frage = fragenMap.get(id)
      if (frage) result.push(frage)
    }
  }
  return result
}

function AbgabeBestaetigung() {
  const user = useAuthStore((s) => s.user)
  const abmelden = useAuthStore((s) => s.abmelden)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)
  const [zeigeZusammenfassung, setZeigeZusammenfassung] = useState(false)

  if (zeigeZusammenfassung) {
    return <AbgabeZusammenfassung onZurueck={() => setZeigeZusammenfassung(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <button
            onClick={abmelden}
            title="Abmelden"
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Abmelden
          </button>
        )}
      </div>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 dark:bg-slate-300 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Prüfung abgegeben
        </h1>
        {user && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {user.name} {user.email && user.email !== 'demo@example.com' ? `(${user.email})` : ''}
          </p>
        )}
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Ihre Antworten wurden gespeichert. Sie können das Fenster schliessen.
        </p>
        {/* Antworten nur im Demo-Modus sofort einsehbar — im echten Betrieb entscheidet die LP über Korrektur-Einsicht */}
        {istDemoModus && (
          <button
            onClick={() => setZeigeZusammenfassung(true)}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer mb-4"
          >
            Meine Antworten ansehen
          </button>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Bei Fragen wenden Sie sich an Ihre Lehrperson.
        </p>
      </div>
    </div>
  )
}
