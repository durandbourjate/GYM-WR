import { useNavigate } from 'react-router-dom'
import { TabKaskade } from './TabKaskade'
import { GlobalSuche } from './GlobalSuche'
import { OptionenMenu } from './OptionenMenu'
import type { Rolle, TabKaskadeConfig } from './types'
import type { SucheErgebnis } from '../../../hooks/useGlobalSuche.shared'
import { APP_VERSION } from '../../../version'
import { useViewport } from '../../../hooks/useViewport'

interface Props {
  rolle: Rolle
  benutzerName: string
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onHilfe: () => void
  onFeedback: () => void
  onAbmelden: () => void
  onEinstellungen?: () => void
  kaskadeConfig: TabKaskadeConfig
  suchen: string
  onSuchen: (s: string) => void
  sucheErgebnis: SucheErgebnis
}

export function AppHeader(props: Props) {
  const navigate = useNavigate()
  const tier = useViewport()
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
        </div>
        <TabKaskade config={props.kaskadeConfig} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <GlobalSuche suchen={props.suchen} onSuchen={props.onSuchen} ergebnis={props.sucheErgebnis} />
          <OptionenMenu
            rolle={props.rolle}
            benutzerName={props.benutzerName}
            theme={props.theme}
            onThemeToggle={props.onThemeToggle}
            onHilfe={props.onHilfe}
            onFeedback={props.onFeedback}
            onAbmelden={props.onAbmelden}
            onEinstellungen={props.onEinstellungen}
          />
        </div>
      </div>
    </header>
  )
}
