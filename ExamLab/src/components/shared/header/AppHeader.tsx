import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TabKaskade } from './TabKaskade'
import { GlobalSuche } from './GlobalSuche'
import { OptionenMenu } from './OptionenMenu'
import FeedbackModal, { type FeedbackContext } from '../FeedbackModal'
import type { Rolle, TabKaskadeConfig } from './types'
import type { SucheErgebnis } from '../../../hooks/useGlobalSuche.shared'
import { APP_VERSION } from '../../../version'
import { useViewport } from '../../../hooks/useViewport'
import { useGlobalZurueck } from '../../../hooks/useGlobalZurueck'

interface Props {
  rolle: Rolle
  benutzerName: string
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onHilfe: () => void
  feedbackContext: FeedbackContext
  onAbmelden: () => void
  onEinstellungen?: () => void
  kaskadeConfig: TabKaskadeConfig
  suchen: string
  onSuchen: (s: string) => void
  sucheErgebnis: SucheErgebnis
  // Detail-Modus
  onZurueck?: () => void
  breadcrumbs?: { label: string; aktion?: () => void }[]
  aktionsButtons?: React.ReactNode
  statusText?: string
  untertitel?: string
}

export function AppHeader(props: Props) {
  const navigate = useNavigate()
  const tier = useViewport()
  const { canGoBack, goBack } = useGlobalZurueck()
  const [feedbackOffen, setFeedbackOffen] = useState(false)

  // Zurück-Button sichtbar wenn Parent explizit onZurueck setzt (Detail-Modus)
  // ODER wenn der aktuelle Pfad eine Sub-Route ist (globaler Zurück-Button).
  // Parent-Prop hat Vorrang: bewahrt bestehende Detail-Modus-Logik.
  const zeigeZurueck = props.onZurueck !== undefined || canGoBack
  const handleZurueck = props.onZurueck ?? goBack

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 sticky top-0 z-[60]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate(props.rolle === 'sus' ? '/sus/ueben' : '/favoriten')}
            className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            ExamLab
          </button>
          {tier === 'desktop' && <span className="text-[10px] text-slate-400">{APP_VERSION}</span>}
          {zeigeZurueck && (
            <button
              type="button"
              onClick={handleZurueck}
              className="px-2 py-1 text-sm text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              ← Zurück
            </button>
          )}
          {props.breadcrumbs && props.breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
              {props.breadcrumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-slate-300">›</span>
                  {c.aktion ? (
                    <button type="button" onClick={c.aktion} className="hover:text-slate-900 cursor-pointer">{c.label}</button>
                  ) : (
                    <span className="font-medium text-slate-900 dark:text-slate-100">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {props.statusText && (
            <span className="text-sm text-green-600 dark:text-green-400">{props.statusText}</span>
          )}
        </div>
        <TabKaskade config={props.kaskadeConfig} />
        <div className="flex items-center gap-2 flex-shrink-0">
          {props.aktionsButtons}
          <GlobalSuche suchen={props.suchen} onSuchen={props.onSuchen} ergebnis={props.sucheErgebnis} />
          <OptionenMenu
            rolle={props.rolle}
            benutzerName={props.benutzerName}
            theme={props.theme}
            onThemeToggle={props.onThemeToggle}
            onHilfe={props.onHilfe}
            onFeedback={() => setFeedbackOffen(true)}
            onAbmelden={props.onAbmelden}
            onEinstellungen={props.onEinstellungen}
          />
        </div>
      </div>
      <FeedbackModal
        isOpen={feedbackOffen}
        onClose={() => setFeedbackOffen(false)}
        context={props.feedbackContext}
      />
    </header>
  )
}
