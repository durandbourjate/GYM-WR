import { useState, type ReactNode } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useGruppenStore } from '../../store/gruppenStore'
import { useNavigationStore } from '../../store/navigationStore'
import { useUebungsStore } from '../../store/uebungsStore'
import { useTheme } from '../../hooks/useTheme'
import { useLernKontext } from '../../hooks/useLernKontext'
import { t } from '../../utils/anrede'

interface Props {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  const { user, abmelden } = useAuthStore()
  const { gruppen, aktiveGruppe, gruppeAbwaehlen } = useGruppenStore()
  const { aktuellerScreen, zurueck, kannZurueck, navigiere } = useNavigationStore()
  const { istDark, toggleTheme } = useTheme()
  const { anrede } = useLernKontext()

  const [hilfeOffen, setHilfeOffen] = useState(false)
  const istAngemeldet = !!user
  const istAdmin = user?.rolle === 'admin'
  const zeigeHeader = istAngemeldet && aktuellerScreen !== 'login'
  const istInUebung = aktuellerScreen === 'uebung' || aktuellerScreen === 'ergebnis'

  const navigiereZuDashboard = () => {
    // Session beenden/nullen wenn in Übung
    if (istInUebung) {
      useUebungsStore.setState({ session: null })
    }
    navigiere('dashboard')
  }

  if (!zeigeHeader) return <>{children}</>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Zurück-Button */}
          {kannZurueck() && aktuellerScreen !== 'dashboard' && (
            <button
              onClick={istInUebung ? navigiereZuDashboard : zurueck}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zurück"
            >
              <span className="text-lg dark:text-white">&#8592;</span>
            </button>
          )}

          {/* Home-Button (nur wenn nicht auf Dashboard) */}
          {aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'gruppenAuswahl' && (
            <button
              onClick={navigiereZuDashboard}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zum Dashboard"
            >
              <span className="text-lg">&#127968;</span>
            </button>
          )}

          <div>
            <h1 className="text-base font-bold dark:text-white">Übungstool</h1>
            {aktiveGruppe && gruppen.length > 1 ? (
              <button
                onClick={() => {
                  if (istInUebung) useUebungsStore.setState({ session: null })
                  gruppeAbwaehlen()
                  navigiere('gruppenAuswahl')
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                title="Gruppe wechseln"
              >
                {aktiveGruppe.name} &#8227;
              </button>
            ) : aktiveGruppe ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">{aktiveGruppe.name}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hilfe-Button */}
          <button
            onClick={() => setHilfeOffen(!hilfeOffen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Hilfe"
          >
            <span className="text-lg">?</span>
          </button>

          {/* Admin-Button */}
          {istAdmin && aktuellerScreen !== 'admin' && (
            <button
              onClick={() => navigiere('admin')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 min-h-[36px]"
            >
              Admin
            </button>
          )}

          {/* Theme-Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={istDark ? 'Light Mode' : 'Dark Mode'}
          >
            <span className="text-lg">{istDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}</span>
          </button>

          {/* User-Info + Abmelden */}
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">{user?.vorname}</span>
          <button
            onClick={abmelden}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {t('abmelden', anrede)}
          </button>
        </div>
      </header>

      {/* Hilfe-Panel */}
      {hilfeOffen && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
          <div className="max-w-2xl mx-auto text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold dark:text-white">Hilfe</h3>
              <button onClick={() => setHilfeOffen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">x</button>
            </div>
            <p>Wähle ein Thema aus und bearbeite Übungsfragen mit sofortigem Feedback.</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><strong>Mastery-Stufen:</strong></div>
              <div />
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 inline-block" /> Neu</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Üben</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Gefestigt</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Gemeistert</div>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
