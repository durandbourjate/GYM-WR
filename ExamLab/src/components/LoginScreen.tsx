import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
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
  const anmeldenMitCode = useAuthStore((s) => s.anmeldenMitCode)
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
  const [zeigeFallback, setZeigeFallback] = useState(false)
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
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

  const [codeWirdValidiert, setCodeWirdValidiert] = useState(false)

  // Name aus E-Mail ableiten: vorname.nachname → Vorname Nachname
  function nameAusEmail(emailStr: string): string {
    const teil = emailStr.split('@')[0] || ''
    return teil.split('.').map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ')
  }

  async function handleCodeLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (code.length !== 4 || !email.trim()) {
      setFehler('Bitte E-Mail und 4-stellige Schüler-ID eingeben.')
      return
    }
    // E-Mail normalisieren: wenn nur Vorname eingegeben → @stud.gymhofwil.ch anhängen
    let volleEmail = email.trim().toLowerCase()
    if (!volleEmail.includes('@')) {
      volleEmail = `${volleEmail}@${config.susDomain}`
    }
    if (!volleEmail.endsWith(`@${config.susDomain}`) && !volleEmail.endsWith(`@${config.lpDomain}`)) {
      setFehler(`Bitte verwenden Sie Ihre Schul-E-Mail (@${config.susDomain}).`)
      return
    }

    // Backend-Validierung wenn konfiguriert
    if (apiService.istKonfiguriert()) {
      setCodeWirdValidiert(true)
      setFehler(null)
      const pruefungId = new URLSearchParams(window.location.search).get('id') || ''
      const result = await apiService.validiereSchuelercode(volleEmail, code, pruefungId)
      setCodeWirdValidiert(false)

      if (result === null) {
        // Netzwerkfehler → Fallback auf lokale Anmeldung
        console.warn('[Login] Backend nicht erreichbar — Fallback auf lokale Code-Anmeldung')
        anmeldenMitCode(code, nameAusEmail(volleEmail), volleEmail)
        return
      }
      if (!result.success) {
        setFehler(result.error ?? 'Code ungültig oder E-Mail nicht in Klassenliste.')
        return
      }
      // Backend hat validiert: Name aus Klassenliste verwenden
      const validierterName = result.vorname && result.name
        ? `${result.vorname} ${result.name}`
        : nameAusEmail(volleEmail)
      anmeldenMitCode(code, validierterName, volleEmail, result.sessionToken)
    } else {
      // Kein Backend → direkt anmelden
      anmeldenMitCode(code, nameAusEmail(volleEmail), volleEmail)
    }
  }

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

        {/* Separator */}
        {istProduktion && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 dark:text-slate-500">oder</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
        )}

        {/* Fallback: Schülercode (Toggle oder direkt wenn kein Google) */}
        {!zeigeFallback && istProduktion && (
          <button
            onClick={() => setZeigeFallback(true)}
            className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Anmeldung mit Schüler-ID
          </button>
        )}

        {(zeigeFallback || !istProduktion) && (
          <form onSubmit={handleCodeLogin} className="space-y-3">
            {!istProduktion && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Google-Login nicht konfiguriert. Anmeldung mit Schüler-ID:
              </p>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Schul-E-Mail
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`vorname.nachname@${config.susDomain}`}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Nur der Teil vor @ genügt (z.B. «vorname.nachname»). Dein Name wird daraus übernommen.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Schüler-ID (4-stellig)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 tabular-nums tracking-widest text-center text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={code.length !== 4 || !email.trim() || codeWirdValidiert}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {codeWirdValidiert ? 'Code wird geprüft…' : 'Anmelden'}
            </button>
          </form>
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
