import { useState, useEffect, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUebenAuthStore } from '../../store/ueben/authStore'
import { uebenApiClient } from '../../services/ueben/apiClient'
import { useSuSNavigation } from '../../hooks/ueben/useSuSNavigation'
import { lazyMitRetry } from '../../utils/lazyMitRetry'
import KorrekturListe from './KorrekturListe'
import KorrekturEinsicht from './KorrekturEinsicht'
import AktivePruefungen from './AktivePruefungen'
import { SuSAppHeaderContainer } from './SuSAppHeaderContainer'

// AppUeben lazy laden — bei Chunk-Hash-Mismatch nach Deploy automatischer Page-Reload.
const AppUeben = lazyMitRetry(() => import('../../AppUeben'))

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
  const istDemoModus = useAuthStore(s => s.istDemoModus)
  const { zuPruefen, zuDashboard } = useSuSNavigation()

  // Modus aus URL ableiten
  const location = useLocation()
  const modus = location.pathname.startsWith('/sus/pruefen') ? 'pruefen' as const : 'ueben' as const

  const [korrekturId, setKorrekturId] = useState<string | null>(null)
  const [loginBridged, setLoginBridged] = useState(false)

  // Login-Bridging: Pruefung-Auth → Üben-Auth synchronisieren
  useEffect(() => {
    if (!user?.email || loginBridged) return
    // Im Demo-Modus keine Backend-Bridge — der Üben-Flow nutzt lokale Demo-Daten
    if (istDemoModus) { setLoginBridged(true); return }

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
  }, [user?.email, user?.name, loginBridged, istDemoModus])

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
      <SuSAppHeaderContainer
        onHilfe={() => {}}
      />

      <main className="max-w-7xl mx-auto p-6">
        {/* Aktive Prüfungen (pollt Backend) */}
        {user?.email && <AktivePruefungen email={user.email} />}
        <KorrekturListe onWaehle={(id) => setKorrekturId(id)} />
      </main>
    </div>
  )
}
