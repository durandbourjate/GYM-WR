import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.ts'
import { initializeGoogleAuth, renderGoogleButton, CLIENT_ID } from '../services/authService.ts'
import ThemeToggle from './ThemeToggle.tsx'
import { useSchulConfig } from '../store/schulConfigStore.ts'
import LoginLayout from './shared/LoginLayout.tsx'

export default function LoginScreen() {
  const { config } = useSchulConfig()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const anmelden = useAuthStore((s) => s.anmelden)
  const demoStarten = useAuthStore((s) => s.demoStarten)
  const fehler = useAuthStore((s) => s.fehler)
  const setFehler = useAuthStore((s) => s.setFehler)
  const ladeStatus = useAuthStore((s) => s.ladeStatus)

  // Nach Login: Redirect zur returnTo-URL oder rollen-basierte Home
  useEffect(() => {
    if (!user) return
    const returnTo = searchParams.get('returnTo')
    if (returnTo) {
      navigate(decodeURIComponent(returnTo), { replace: true })
    } else {
      navigate(user.rolle === 'lp' ? '/favoriten' : '/sus', { replace: true })
    }
  }, [user, navigate, searchParams])

  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [googleGeladen, setGoogleGeladen] = useState(false)

  const istProduktion = !!CLIENT_ID

  // Google Identity Services initialisieren
  useEffect(() => {
    if (!istProduktion) return

    // Warten bis das GIS-Script geladen ist
    const check = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(check)
        setGoogleGeladen(true)
        initializeGoogleAuth(
          (payload) => {
            const domain = payload.email.split('@')[1]
            if (domain !== config.susDomain && domain !== config.lpDomain) {
              setFehler(`Bitte verwenden Sie Ihre Schul-E-Mail (@${config.susDomain} oder @${config.lpDomain}).`)
              return
            }
            anmelden(payload)
          },
          (error) => setFehler(error),
        )
      }
    }, 100)

    // Timeout nach 10s
    const timeout = setTimeout(() => {
      clearInterval(check)
      if (!googleGeladen) {
        setGoogleGeladen(false)
      }
    }, 10000)

    return () => {
      clearInterval(check)
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — Einmalige Initialisierung, anmelden/setFehler sind stabil, googleGeladen wuerde Loop verursachen
  }, [istProduktion])

  // Google-Button rendern wenn bereit
  useEffect(() => {
    if (googleGeladen && googleButtonRef.current) {
      renderGoogleButton(googleButtonRef.current)
    }
  }, [googleGeladen])

  return (
    <LoginLayout>
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 dark:bg-slate-200 rounded-2xl flex items-center justify-center">
            <span className="text-white dark:text-slate-800 text-2xl font-bold">{config.schulKuerzel}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            ExamLab
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {config.schulName}
          </p>
        </div>

        {/* Lade-Indikator während Login (verhindert Flackern) */}
        {ladeStatus === 'laden' && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 text-center">
            Anmeldung läuft...
          </div>
        )}

        {/* Fehlermeldung */}
        {fehler && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {fehler}
          </div>
        )}

        {/* Google Sign-In Button */}
        {istProduktion && (
          <div className="mb-4">
            <div ref={googleButtonRef} className="flex justify-center" />
            {!googleGeladen && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                Google-Login wird geladen...
              </p>
            )}
          </div>
        )}

        {!istProduktion && (
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400 text-center">
            Im Dev-Modus nur Demo-Login verfügbar (kein Google-Client-ID konfiguriert).
          </p>
        )}

        {/* Demo-Modus */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-2">Demo ohne Login starten</p>
          <div className="flex gap-2">
            <button
              onClick={() => demoStarten('sus')}
              className="flex-1 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Als Schüler/in
            </button>
            <button
              onClick={() => demoStarten('lp')}
              className="flex-1 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Als Lehrperson
            </button>
          </div>
        </div>
      </div>
    </LoginLayout>
  )
}
