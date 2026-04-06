import { useState, useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useLernenAuthStore } from '../../store/lernen/authStore'
import { lernenApiClient } from '../../services/lernen/apiClient'
import ThemeToggle from '../ThemeToggle'
import KorrekturListe from './KorrekturListe'
import KorrekturEinsicht from './KorrekturEinsicht'
import Tooltip from '../ui/Tooltip'

// AppLernen lazy laden — mit Retry bei Cache-Mismatch (neues Deployment)
const AppLernen = lazy(() =>
  import('../../AppLernen').catch(() => {
    // Chunk-Hash stimmt nicht (altes Cache) → Seite neu laden
    window.location.reload()
    return { default: () => null } as never
  })
)

const LP_AUTH_KEY = 'lernplattform-auth'

type SuSModus = 'start' | 'ueben' | 'pruefen'

/**
 * Startseite für SuS: Wahl zwischen Üben und Prüfen.
 * - Üben: Gruppen → Dashboard → Übungen (= AppLernen)
 * - Prüfen: Warteraum für Prüfungen + Korrektur-Einsicht
 */
export default function SuSStartseite({ onKorrekturWaehle: _onKorrekturWaehle }: { onKorrekturWaehle: (id: string) => void }) {
  const user = useAuthStore(s => s.user)
  const abmelden = useAuthStore(s => s.abmelden)
  const [modus, setModus] = useState<SuSModus>('start')
  const [korrekturId, setKorrekturId] = useState<string | null>(null)
  const [loginBridged, setLoginBridged] = useState(false)

  // Login-Bridging: Pruefung-Auth → Lernen-Auth synchronisieren
  useEffect(() => {
    if (!user?.email || loginBridged) return

    async function bridgeLogin() {
      try {
        console.log('[SuSStartseite] Login-Bridge starten für', user!.email)
        const response = await lernenApiClient.post<{
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
        useLernenAuthStore.setState({
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
    // Warten bis Login-Bridge fertig, dann AppLernen laden
    if (!loginBridged) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">Übungen werden verbunden...</p>
        </div>
      )
    }
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">Üben wird geladen...</p>
        </div>
      }>
        <AppLernen onZurueck={() => setModus('start')} />
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
            <h1 className="text-lg font-bold dark:text-white">Prüfungen & Korrekturen</h1>
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
        <h1 className="text-lg font-bold dark:text-white">ExamLab</h1>
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
      </main>
    </div>
  )
}
