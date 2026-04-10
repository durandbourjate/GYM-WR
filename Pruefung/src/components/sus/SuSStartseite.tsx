import { useState, useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useUebenAuthStore } from '../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { uebenApiClient } from '../../services/ueben/apiClient'
import ThemeToggle from '../ThemeToggle'
import KorrekturListe from './KorrekturListe'
import KorrekturEinsicht from './KorrekturEinsicht'
import Tooltip from '../ui/Tooltip'
import AktivePruefungen from './AktivePruefungen'

// AppUeben lazy laden — mit Retry bei Cache-Mismatch (neues Deployment)
const AppUeben = lazy(() =>
  import('../../AppUeben').catch(() => {
    // Chunk-Hash stimmt nicht (altes Cache) → Seite neu laden
    window.location.reload()
    return { default: () => null } as never
  })
)

const LP_AUTH_KEY = 'ueben-auth'

type SuSModus = 'start' | 'ueben' | 'pruefen'

/**
 * Startseite für SuS: Wahl zwischen Üben und Prüfen.
 * - Üben: Gruppen → Dashboard → Übungen (= AppUeben)
 * - Prüfen: Warteraum für Prüfungen + Korrektur-Einsicht
 */
export default function SuSStartseite({ onKorrekturWaehle: _onKorrekturWaehle }: { onKorrekturWaehle: (id: string) => void }) {
  const user = useAuthStore(s => s.user)
  const pruefungAbmelden = useAuthStore(s => s.abmelden)
  const [modus, setModus] = useState<SuSModus>('start')
  const [korrekturId, setKorrekturId] = useState<string | null>(null)
  const [loginBridged, setLoginBridged] = useState(false)

  // Vollständiges Abmelden: Prüfungs-Auth + Üben-Auth + Gruppen-Store
  function abmelden() {
    useUebenAuthStore.getState().abmelden()
    useUebenGruppenStore.setState({ gruppen: [], aktiveGruppe: null, mitglieder: [], ladeStatus: 'idle' })
    setLoginBridged(false)
    setModus('start')
    pruefungAbmelden()
  }

  // Login-Bridging: Pruefung-Auth → Üben-Auth synchronisieren
  useEffect(() => {
    if (!user?.email || loginBridged) return

    async function bridgeLogin() {
      try {
        console.log('[SuSStartseite] Login-Bridge starten für', user!.email)
        const response = await uebenApiClient.post<{
          success: boolean
          data: { sessionToken: string }
        }>('lernplattformLogin', {
          email: user!.email,
          name: user!.name || user!.email,
        })

        if (!response || !response.data?.sessionToken) {
          console.error('[SuSStartseite] Login-Bridge fehlgeschlagen — keine gültige Antwort:', response)
          setLoginBridged(true)
          return
        }

        const sessionToken = response.data.sessionToken
        console.log('[SuSStartseite] Login-Bridge erfolgreich, Token erhalten')
        const lpUser = {
          email: user!.email,
          name: user!.name || user!.email,
          vorname: user!.name?.split(' ')[0] || '',
          nachname: user!.name?.split(' ').slice(1).join(' ') || '',
          rolle: 'lernend' as const,
          sessionToken,
          loginMethode: 'google' as const,
        }
        localStorage.setItem(LP_AUTH_KEY, JSON.stringify(lpUser))
        useUebenAuthStore.setState({
          user: lpUser,
          istAngemeldet: true,
          ladeStatus: 'fertig',
        })
        setLoginBridged(true)
      } catch (error) {
        console.error('[SuSStartseite] Login-Bridge Fehler:', error)
        setLoginBridged(true)
      }
    }
    bridgeLogin()
  }, [user?.email, user?.name, loginBridged])

  if (modus === 'ueben') {
    // Warten bis Login-Bridge fertig, dann AppUeben laden
    if (!loginBridged) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">Übungen werden verbunden...</p>
        </div>
      )
    }
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          {/* Skeleton-Header damit kein Ladeblitz entsteht */}
          <div className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-slate-500 dark:text-slate-400 mb-8">Üben wird geladen...</p>
            {/* Karten-Platzhalter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-2" />
                  <div className="h-8 w-full bg-slate-100 dark:bg-slate-600 rounded animate-pulse mt-3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <AppUeben onZurueck={() => setModus('start')} />
      </Suspense>
    )
  }

  if (modus === 'pruefen') {
    if (korrekturId) {
      return <KorrekturEinsicht pruefungId={korrekturId} onZurueck={() => setKorrekturId(null)} />
    }
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Tooltip text="Zurück zur Startseite">
              <button onClick={() => setModus('start')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <span className="text-lg dark:text-white">&#8592;</span>
              </button>
            </Tooltip>
            <button onClick={() => { setModus('start'); setKorrekturId(null) }} className="text-lg font-bold dark:text-white hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
              ExamLab
            </button>
            <span className="text-slate-300 dark:text-slate-600">›</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Prüfungen & Korrekturen</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-sm text-slate-500 dark:text-slate-400">{user?.name}</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          <KorrekturListe onWaehle={(id) => setKorrekturId(id)} />
        </main>
      </div>
    )
  }

  // Startseite: Üben / Prüfen Auswahl
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <button onClick={() => { setModus('start'); setKorrekturId(null) }} className="text-lg font-bold dark:text-white hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
          ExamLab
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-sm text-slate-500 dark:text-slate-400">{user?.name}</span>
          <Tooltip text="Abmelden">
            <button
              onClick={abmelden}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Abmelden
            </button>
          </Tooltip>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center w-full">
          {/* Aktive Prüfungen/Übungen (pollt Backend) */}
          {user?.email && <AktivePruefungen email={user.email} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
          {/* Üben */}
          <button
            onClick={() => setModus('ueben')}
            className="group p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Üben</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Übungen zu deinen Themen starten, Fortschritt verfolgen und Lernziele erreichen.
            </p>
          </button>

          {/* Prüfen */}
          <button
            onClick={() => setModus('pruefen')}
            className="group p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-xl transition-all cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Prüfen</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Prüfungen starten und abgeschlossene Korrekturen einsehen.
            </p>
          </button>
        </div>
        </div>
      </main>
    </div>
  )
}
