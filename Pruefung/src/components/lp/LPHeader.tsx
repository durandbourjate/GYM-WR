import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { useLPNavigationStore } from '../../store/lpNavigationStore.ts'
import ThemeToggle from '../ThemeToggle.tsx'
import FeedbackButton from '../shared/FeedbackButton.tsx'
import Tooltip from '../ui/Tooltip.tsx'
import { APP_VERSION } from '../../version'
import type { AppOrt } from '../../types/stammdaten.ts'

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
  /** Klick auf ExamLab-Logo/Titel → zum Dashboard */
  onHome?: () => void
}

const TABS: { key: Modus; label: string }[] = [
  { key: 'pruefung', label: 'Prüfen' },
  { key: 'uebung', label: 'Üben' },
  { key: 'fragensammlung', label: 'Fragensammlung' },
]

export default function LPHeader({ titel, untertitel, zurueck, statusText, aktionsButtons, modus, onModusChange, onFragensammlung, onHilfe, onEinstellungen, fragensammlungOffen, hilfeOffen, breadcrumbs, onHome }: Props) {
  const abmelden = useAuthStore((s) => s.abmelden)

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
              {onHome ? (
                <button onClick={onHome} className="text-lg font-bold text-slate-800 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                  ExamLab
                </button>
              ) : (
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {istDashboard ? 'ExamLab' : (titel || 'ExamLab')}
                </h1>
              )}
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{APP_VERSION}</span>
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 ml-2 text-sm text-slate-500 dark:text-slate-400">
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
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg ml-4">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => onModusChange(t.key)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    modus === t.key
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {aktionsButtons}
          {onFragensammlung && (
            <Tooltip text="Fragensammlung öffnen" position="bottom">
              <button onClick={onFragensammlung} className={buttonClass}>Fragensammlung</button>
            </Tooltip>
          )}
          <FavoritenDropdown />
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
            context={{ rolle: 'lp', ort: 'lp-allgemein', modus: 'pruefen', bildschirm: 'header' }}
          />
          <ThemeToggle />
          <Tooltip text="Von ExamLab abmelden" position="bottom">
            <button
              onClick={abmelden}
              className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Abmelden
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}

/** Favoriten-Dropdown: Zeigt gespeicherte App-Orte mit Direktlinks */
function FavoritenDropdown() {
  const favoriten = useLPNavigationStore(s => s.favoriten)
  const toggleFavorit = useLPNavigationStore(s => s.toggleFavorit)
  const [offen, setOffen] = useState(false)
  const [kopiert, setKopiert] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Ausserhalb klicken → schliessen
  useEffect(() => {
    if (!offen) return
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [offen])

  function kopiereLink(ort: AppOrt): void {
    const url = `${window.location.origin}${window.location.pathname}#/${ort.screen}/${ort.params.configId || ''}`
    navigator.clipboard.writeText(url).catch(() => {
      const input = document.createElement('input')
      input.value = url; document.body.appendChild(input); input.select()
      document.execCommand('copy'); document.body.removeChild(input)
    })
    setKopiert(ort.id)
    setTimeout(() => setKopiert(null), 2000)
  }

  function navigiereZu(ort: AppOrt): void {
    const hash = `#/${ort.screen}/${ort.params.configId || ''}`
    window.location.hash = hash
    setOffen(false)
  }

  const anzeigeLabel = (ort: AppOrt): string => {
    if (ort.titel) return ort.titel
    const prefix = ort.screen === 'uebung' ? 'Übung' : ort.screen === 'fragensammlung' ? 'Fragensammlung' : 'Prüfung'
    return `${prefix} ${ort.params.configId?.slice(0, 8) || ''}…`
  }

  return (
    <div ref={ref} className="relative">
      <Tooltip text={`Favoriten (${favoriten.length})`} position="bottom">
        <button
          onClick={() => setOffen(o => !o)}
          className={`px-2 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
            favoriten.length > 0
              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {favoriten.length > 0 ? '⭐' : '☆'}
        </button>
      </Tooltip>

      {offen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-[70] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Favoriten {favoriten.length > 0 && <span className="text-slate-400 font-normal">({favoriten.length})</span>}
            </h3>
          </div>

          {favoriten.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              Noch keine Favoriten. Klicke ☆ auf einer Prüfung oder Übung.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {favoriten.map(ort => (
                <div
                  key={ort.id}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                >
                  <button
                    onClick={() => navigiereZu(ort)}
                    className="flex-1 text-left text-sm text-slate-700 dark:text-slate-200 truncate cursor-pointer"
                    title={anzeigeLabel(ort)}
                  >
                    <span className="text-xs text-slate-400 dark:text-slate-500 mr-1.5">
                      {ort.screen === 'uebung' ? '📝' : ort.screen === 'fragensammlung' ? '📚' : '📋'}
                    </span>
                    {anzeigeLabel(ort)}
                  </button>
                  <button
                    onClick={() => kopiereLink(ort)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Link kopieren"
                  >
                    {kopiert === ort.id ? '✓' : '🔗'}
                  </button>
                  <button
                    onClick={() => toggleFavorit(ort)}
                    className="text-xs text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Entfernen"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
