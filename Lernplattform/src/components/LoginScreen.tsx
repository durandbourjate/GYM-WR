import { useRef, useEffect, useState } from 'react'
import { initializeGoogleAuth, renderGoogleButton } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'

export default function LoginScreen() {
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [codeLogin, setCodeLogin] = useState(false)
  const [code, setCode] = useState('')
  const { anmeldenMitGoogle, anmeldenMitCode, ladeStatus, fehler } = useAuthStore()
  const { istDark, toggleTheme } = useTheme()
  const [hilfeOffen, setHilfeOffen] = useState(false)

  useEffect(() => {
    initializeGoogleAuth(
      (payload) => anmeldenMitGoogle(payload),
      (error) => console.error('Auth-Fehler:', error)
    )

    if (googleButtonRef.current) {
      renderGoogleButton(googleButtonRef.current)
    }
  }, [anmeldenMitGoogle])

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length >= 6) {
      anmeldenMitCode(code)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      {/* Dark/Light Toggle (oben rechts) */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        title={istDark ? 'Light Mode' : 'Dark Mode'}
      >
        {istDark ? '☀️' : '🌙'}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2 dark:text-white">Übungstool</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Anmelden um zu üben</p>

        {/* Hilfe/Info */}
        <button
          onClick={() => setHilfeOffen(!hilfeOffen)}
          className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4 inline-flex items-center gap-1"
        >
          {hilfeOffen ? '▾' : '▸'} Was ist das Übungstool?
        </button>
        {hilfeOffen && (
          <div className="mb-6 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/20 text-left text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <p className="mb-2">Das Übungstool ermöglicht dir, Übungsfragen zu deinen Fächern zu bearbeiten — mit sofortigem Feedback und Fortschrittsverfolgung.</p>
            <p>Melde dich mit deinem Schulkonto (Google) oder einem Code an, den du von deiner Lehrperson erhalten hast.</p>
          </div>
        )}

        {!codeLogin ? (
          <>
            <div ref={googleButtonRef} className="flex justify-center mb-4" />
            <button
              onClick={() => setCodeLogin(true)}
              className="text-sm text-gray-400 hover:text-gray-600 mt-2"
            >
              Mit Code anmelden
            </button>
          </>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Code eingeben"
              className="w-full text-center text-2xl tracking-widest border-2 border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-white dark:bg-gray-700 dark:text-white focus:border-slate-500 focus:outline-none"
              maxLength={6}
              autoFocus
            />
            <button
              type="submit"
              disabled={code.length < 6 || ladeStatus === 'laden'}
              className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium disabled:opacity-50 hover:bg-slate-900 dark:hover:bg-slate-100"
            >
              {ladeStatus === 'laden' ? 'Wird geprüft...' : 'Anmelden'}
            </button>
            <button
              type="button"
              onClick={() => { setCodeLogin(false); setCode('') }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Zurück zu Google-Login
            </button>
          </form>
        )}

        {fehler && (
          <p className="mt-4 text-red-500 text-sm">{fehler}</p>
        )}

        {/* Demo-Links */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2">Demo ohne Login starten</p>
          <div className="flex gap-2">
            <a
              href="?demo=kind"
              className="flex-1 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-center"
            >
              Als Kind
            </a>
            <a
              href="?demo=eltern"
              className="flex-1 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-center"
            >
              Als Elternteil
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
