import type { ReactNode } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useGruppenStore } from '../../store/gruppenStore'
import { useNavigationStore } from '../../store/navigationStore'
import { useTheme } from '../../hooks/useTheme'
import { useLernKontext } from '../../hooks/useLernKontext'
import { t } from '../../utils/anrede'

interface Props {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  const { user, abmelden } = useAuthStore()
  const { aktiveGruppe } = useGruppenStore()
  const { aktuellerScreen, zurueck, kannZurueck, navigiere } = useNavigationStore()
  const { istDark, toggleTheme } = useTheme()
  const { anrede } = useLernKontext()

  const istAngemeldet = !!user
  const istAdmin = user?.rolle === 'admin'
  const zeigeHeader = istAngemeldet && aktuellerScreen !== 'login'

  if (!zeigeHeader) return <>{children}</>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Zurück-Button */}
          {kannZurueck() && aktuellerScreen !== 'dashboard' && (
            <button
              onClick={zurueck}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zurück"
            >
              <span className="text-lg dark:text-white">&#8592;</span>
            </button>
          )}

          {/* Home-Button (nur wenn nicht auf Dashboard) */}
          {aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'gruppenAuswahl' && (
            <button
              onClick={() => navigiere('dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zum Dashboard"
            >
              <span className="text-lg">&#127968;</span>
            </button>
          )}

          <div>
            <h1 className="text-base font-bold dark:text-white">Lernplattform</h1>
            {aktiveGruppe && <span className="text-xs text-gray-500 dark:text-gray-400">{aktiveGruppe.name}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {children}
    </div>
  )
}
