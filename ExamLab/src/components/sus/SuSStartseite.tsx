import { useState, useEffect, Suspense, lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUebenAuthStore } from '../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { uebenApiClient } from '../../services/ueben/apiClient'
import { useSuSNavigation } from '../../hooks/ueben/useSuSNavigation'
import ThemeToggle from '../ThemeToggle'
import KorrekturListe from './KorrekturListe'
import KorrekturEinsicht from './KorrekturEinsicht'
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

/**
 * Startseite für SuS: Tab-Navigation zwischen Üben und Prüfen.
 * - Üben (Default): Gruppen → Dashboard → Übungen (= AppUeben)
 * - Prüfen: Warteraum für Prüfungen + Korrektur-Einsicht
 *
 * Der Modus wird aus der URL abgeleitet (/sus/pruefen = Prüfen, alles andere = Üben).
 */
export default function SuSStartseite({ onKorrekturWaehle: _onKorrekturWaehle }: { onKorrekturWaehle: (id: string) => void }) {
  const user = useAuthStore(s => s.user)
  const pruefungAbmelden = useAuthStore(s => s.abmelden)
  const { zuPruefen, zuDashboard } = useSuSNavigation()

  // Modus aus URL ableiten
  const location = useLocation()
  const modus = location.pathname.startsWith('/sus/pruefen') ? 'pruefen' as const : 'ueben' as const

  const [korrekturId, setKorrekturId] = useState<string | null>(null)
  const [loginBridged, setLoginBridged] = useState(false)

  // Vollständiges Abmelden: Prüfungs-Auth + Üben-Auth + Gruppen-Store
  function abmelden() {
    useUebenAuthStore.getState().abmelden()
    useUebenGruppenStore.setState({ gruppen: [], aktiveGruppe: null, mitglieder: [], ladeStatus: 'idle' })
    setLoginBridged(false)
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          {/* Skeleton-Header — nie blank zeigen */}
          <div className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
            </div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin h-6 w-6 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full mb-3" />
            <p className="text-sm text-slate-400 dark:text-slate-500">Verbinde...</p>
          </div>
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
        <AppUeben onZurueck={zuPruefen} onModusWechsel={(m) => m === 'pruefen' ? zuPruefen() : zuDashboard()} />
      </Suspense>
    )
  }

  // === Prüfen-Modus ===
  if (korrekturId) {
    return <KorrekturEinsicht pruefungId={korrekturId} onZurueck={() => setKorrekturId(null)} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div>
            <button onClick={zuDashboard} className="text-base font-bold dark:text-white hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">ExamLab</button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.name} · Schüler/in
            </p>
          </div>

          {/* Tabs: Üben | Prüfen */}
          <nav className="flex items-center gap-1 ml-4">
            <button
              onClick={zuDashboard}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Üben
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              Prüfen
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={abmelden}
            className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Aktive Prüfungen (pollt Backend) */}
        {user?.email && <AktivePruefungen email={user.email} />}
        <KorrekturListe onWaehle={(id) => setKorrekturId(id)} />
      </main>
    </div>
  )
}
