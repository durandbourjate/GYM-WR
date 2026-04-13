import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.ts'
import { useLPNavigationStore } from '../../store/lpUIStore.ts'
import ThemeToggle from '../ThemeToggle.tsx'
import FeedbackButton from '../shared/FeedbackButton.tsx'
import Tooltip from '../ui/Tooltip.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import { APP_VERSION } from '../../version'


type Modus = 'pruefung' | 'uebung' | 'fragensammlung'

interface Props {
  titel?: string
  untertitel?: string
  zurueck?: () => void
  statusText?: string
  aktionsButtons?: React.ReactNode
  modus?: Modus
  onModusChange?: (m: Modus) => void
  onFragensammlung?: () => void
  onHilfe?: () => void
  onEinstellungen?: () => void
  fragensammlungOffen?: boolean
  hilfeOffen?: boolean
  /** Breadcrumb-Pfad, z.B. [{label: 'Prüfen'}, {label: 'Einrichtungsprüfung'}] */
  breadcrumbs?: { label: string; aktion?: () => void }[]
}

const HEADER_TABS = [
  { id: 'favoriten', label: 'Favoriten' },
  { id: 'pruefung', label: 'Prüfen' },
  { id: 'uebung', label: 'Üben' },
  { id: 'fragensammlung', label: 'Fragensammlung' },
]

export default function LPHeader({ untertitel, zurueck, statusText, aktionsButtons, modus, onModusChange, onFragensammlung, onHilfe, onEinstellungen, fragensammlungOffen, hilfeOffen, breadcrumbs }: Props) {
  const abmelden = useAuthStore((s) => s.abmelden)
  const navigate = useNavigate()
  const location = useLocation()

  // ESC-Handler: schliesst oberstes Panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Escape') return
      if (fragensammlungOffen && onFragensammlung) onFragensammlung()
      else if (hilfeOffen && onHilfe) onHilfe()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [fragensammlungOffen, hilfeOffen, onFragensammlung, onHilfe])

  const buttonClass = 'px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer'

  // Dashboard-Modus: Tabs werden angezeigt
  const istDashboard = modus !== undefined && onModusChange !== undefined
  const istFavoritenAktiv = location.pathname === '/favoriten'

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2.5 sticky top-0 z-[60]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {zurueck && (
            <Tooltip text="Zurück zur Übersicht" position="bottom">
              <button onClick={zurueck} className={buttonClass}>
                ← Zurück
              </button>
            </Tooltip>
          )}
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/favoriten')}
                className="text-lg font-bold text-slate-800 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                ExamLab
              </button>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{APP_VERSION}</span>
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 ml-2 text-sm text-slate-600 dark:text-slate-300">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-slate-300 dark:text-slate-600">›</span>
                      {crumb.aktion ? (
                        <button onClick={crumb.aktion} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
            </div>
            {untertitel && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{untertitel}</p>
            )}
          </div>
          {statusText && (
            <span className="text-sm text-green-600 dark:text-green-400">{statusText}</span>
          )}

          {/* Tabs im Dashboard-Modus (nicht bei Sub-Pages mit Zurück-Button) */}
          {istDashboard && !zurueck && (
            <div className="ml-4">
              <TabBar
                tabs={HEADER_TABS}
                activeTab={istFavoritenAktiv ? 'favoriten' : (modus ?? 'pruefung')}
                onTabChange={(id) => {
                  if (id === 'favoriten') {
                    navigate('/favoriten');
                  } else {
                    onModusChange(id as Modus);
                  }
                }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {aktionsButtons}
          {onFragensammlung && !(istDashboard && !zurueck) && (
            <Tooltip text="Fragensammlung öffnen" position="bottom">
              <button onClick={onFragensammlung} className={buttonClass}>Fragensammlung</button>
            </Tooltip>
          )}
          {onEinstellungen && (
            <Tooltip text="Einstellungen" position="bottom">
              <button onClick={onEinstellungen} className={buttonClass}>⚙</button>
            </Tooltip>
          )}
          {onHilfe && (
            <Tooltip text="Hilfe & Anleitungen" position="bottom">
              <button onClick={onHilfe} className={buttonClass}>Hilfe</button>
            </Tooltip>
          )}
          <FeedbackButton
            variant="icon"
            context={{
              rolle: 'lp',
              ort: `lp-${useLPNavigationStore.getState().modus}`,
              modus: useLPNavigationStore.getState().modus === 'uebung' ? 'ueben' : useLPNavigationStore.getState().modus === 'fragensammlung' ? 'fragensammlung' : 'pruefen',
              bildschirm: useLPNavigationStore.getState().ansicht === 'composer' ? 'composer' : 'dashboard',
              appVersion: typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'dev',
            }}
          />
          <ThemeToggle />
          <Tooltip text="Von ExamLab abmelden" position="bottom">
            <button
              onClick={abmelden}
              className="px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Abmelden
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
