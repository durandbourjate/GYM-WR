import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import { initializeGoogleAuth, renderGoogleButton, CLIENT_ID } from '../services/authService.ts'
import ThemeToggle from './ThemeToggle.tsx'

export default function LoginScreen() {
  const anmelden = useAuthStore((s) => s.anmelden)
  const anmeldenMitCode = useAuthStore((s) => s.anmeldenMitCode)
  const demoStarten = useAuthStore((s) => s.demoStarten)
  const fehler = useAuthStore((s) => s.fehler)
  const setFehler = useAuthStore((s) => s.setFehler)

  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [zeigeFallback, setZeigeFallback] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
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
            if (domain !== 'stud.gymhofwil.ch' && domain !== 'gymhofwil.ch') {
              setFehler('Bitte verwenden Sie Ihre Schul-E-Mail (@stud.gymhofwil.ch oder @gymhofwil.ch).')
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

  async function handleCodeLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (code.length !== 4 || !name.trim() || !email.trim()) {
      setFehler('Bitte E-Mail, Namen und 4-stelligen Code eingeben.')
      return
    }
    // E-Mail normalisieren: wenn nur Vorname eingegeben → @stud.gymhofwil.ch anhängen
    let volleEmail = email.trim().toLowerCase()
    if (!volleEmail.includes('@')) {
      volleEmail = `${volleEmail}@stud.gymhofwil.ch`
    }
    if (!volleEmail.endsWith('@stud.gymhofwil.ch') && !volleEmail.endsWith('@gymhofwil.ch')) {
      setFehler('Bitte verwenden Sie Ihre Schul-E-Mail (@stud.gymhofwil.ch).')
      return
    }

    // Backend-Validierung wenn konfiguriert
    if (apiService.istKonfiguriert()) {
      setCodeWirdValidiert(true)
      setFehler(null)
      const result = await apiService.validiereSchuelercode(volleEmail, code)
      setCodeWirdValidiert(false)

      if (result === null) {
        // Netzwerkfehler → Fallback auf lokale Anmeldung
        console.warn('[Login] Backend nicht erreichbar — Fallback auf lokale Code-Anmeldung')
        anmeldenMitCode(code, name.trim(), volleEmail)
        return
      }
      if (!result.success) {
        setFehler(result.error ?? 'Code ungültig oder E-Mail nicht in Klassenliste.')
        return
      }
      // Backend hat validiert: Name aus Klassenliste verwenden
      const validierterName = result.vorname && result.name
        ? `${result.vorname} ${result.name}`
        : name.trim()
      anmeldenMitCode(code, validierterName, volleEmail)
    } else {
      // Kein Backend → direkt anmelden
      anmeldenMitCode(code, name.trim(), volleEmail)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 dark:bg-slate-200 rounded-2xl flex items-center justify-center">
            <span className="text-white dark:text-slate-800 text-2xl font-bold">WR</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            Prüfungsplattform
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gymnasium Hofwil
          </p>
        </div>

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
            Anmeldung mit Schülercode
          </button>
        )}

        {(zeigeFallback || !istProduktion) && (
          <form onSubmit={handleCodeLogin} className="space-y-3">
            {!istProduktion && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Google-Login nicht konfiguriert. Anmeldung mit Schülercode:
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
                placeholder="vorname.nachname@stud.gymhofwil.ch"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Nur der Teil vor @ genügt (z.B. «vorname.nachname»)
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vorname Nachname"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Schülercode (4-stellig)
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
              disabled={code.length !== 4 || !name.trim() || !email.trim() || codeWirdValidiert}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {codeWirdValidiert ? 'Code wird geprüft…' : 'Anmelden'}
            </button>
          </form>
        )}

        {/* Demo-Modus */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={demoStarten}
            className="w-full text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Demo ohne Login starten
          </button>
        </div>
      </div>
    </div>
  )
}
