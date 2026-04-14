import { useState, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useUebenAuthStore } from '../../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import { useAuthStore } from '../../../store/authStore'
import { useUebenUebungsStore } from '../../../store/ueben/uebungsStore'
import { useUebenFortschrittStore } from '../../../store/ueben/fortschrittStore'
import { useUebenTheme } from '../../../hooks/ueben/useTheme'
import { useSuSNavigation } from '../../../hooks/ueben/useSuSNavigation'
import { lernzielStatus as _lernzielStatus } from '../../../utils/ueben/mastery'
import LernzieleAkkordeon from '../LernzieleAkkordeon'
import FeedbackButton from '../../shared/FeedbackButton'
import Tooltip from '../../ui/Tooltip'
import SuSHilfePanel from '../SuSHilfePanel'

interface Props {
  children: ReactNode
  /** Callback: Zurück zur ExamLab-Startseite (verlässt Üben-Modus) */
  onExamLabHome?: () => void
  /** Callback: Tab-Wechsel zwischen Üben/Prüfen */
  onModusWechsel?: (modus: 'ueben' | 'pruefen') => void
}

export default function AppShell({ children, onExamLabHome, onModusWechsel }: Props) {
  const { user, abmelden: uebenAbmelden } = useUebenAuthStore()
  const pruefungAbmelden = useAuthStore(s => s.abmelden)

  // Vollständiges Abmelden: Üben-Auth + Gruppen + Prüfungs-Auth
  function abmelden() {
    uebenAbmelden()
    useUebenGruppenStore.setState({ gruppen: [], aktiveGruppe: null, mitglieder: [], ladeStatus: 'idle' })
    pruefungAbmelden()
  }
  const { gruppen, aktiveGruppe, gruppeAbwaehlen } = useUebenGruppenStore()
  const { zuDashboard, zuAdmin, zuGruppenAuswahl, zurueck } = useSuSNavigation()
  const { istDark, toggleTheme } = useUebenTheme()

  // Screen aus URL ableiten
  const location = useLocation()
  const aktuellerScreen = ermittleScreen(location.pathname)

  const [hilfeOffen, setHilfeOffen] = useState(false)
  const [lernzieleOffen, setLernzieleOffen] = useState(false)
  const { lernziele, ladeLernziele, fortschritte } = useUebenFortschrittStore()
  const istAngemeldet = !!user

  // Lernziele beim App-Start laden
  useEffect(() => {
    if (aktiveGruppe?.id) ladeLernziele(aktiveGruppe.id)
  }, [aktiveGruppe?.id, ladeLernziele])
  const istAdmin = user?.rolle === 'admin'
  const zeigeHeader = istAngemeldet && aktuellerScreen !== 'login'
  const istInUebung = aktuellerScreen === 'uebung' || aktuellerScreen === 'ergebnis'

  const navigiereZuDashboard = () => {
    // Session beenden/nullen wenn in Übung
    if (istInUebung) {
      useUebenUebungsStore.setState({ session: null })
    }
    zuDashboard()
  }

  if (!zeigeHeader) return <>{children}</>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Zurück-Button — nur wenn aktive Gruppe vorhanden (sonst nur Abmelden) */}
          {aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'gruppenAuswahl' && aktiveGruppe && (
            <Tooltip text="Zurück" position="bottom">
              <button
                onClick={istInUebung ? navigiereZuDashboard : zurueck}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <span className="text-lg dark:text-white">&#8592;</span>
              </button>
            </Tooltip>
          )}

          {/* Home-Button (nur wenn nicht auf Dashboard und Gruppe vorhanden) */}
          {aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'gruppenAuswahl' && aktiveGruppe && (
            <Tooltip text="Zum Dashboard" position="bottom">
              <button
                onClick={navigiereZuDashboard}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <span className="text-lg">&#127968;</span>
              </button>
            </Tooltip>
          )}

          <div>
            {onExamLabHome ? (
              <button onClick={onExamLabHome} className="text-base font-bold dark:text-white hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                ExamLab
              </button>
            ) : (
              <h1 className="text-base font-bold dark:text-white">ExamLab</h1>
            )}
            {/* Rollenbezeichnung unter ExamLab — wie bei LP-Header */}
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              {user?.name || user?.vorname}
              {' · '}
              {istAdmin ? 'Admin' : 'Schüler/in'}
              {aktiveGruppe && gruppen.length > 1 ? (
                <>
                  {' — '}
                  <button
                    onClick={() => {
                      if (istInUebung) useUebenUebungsStore.setState({ session: null })
                      gruppeAbwaehlen()
                      zuGruppenAuswahl()
                    }}
                    className="hover:text-slate-600 dark:hover:text-slate-300 underline"
                  >
                    {aktiveGruppe.name} &#8227;
                  </button>
                </>
              ) : aktiveGruppe ? (
                <> — {aktiveGruppe.name}</>
              ) : null}
            </p>
          </div>

          {/* Tabs: Üben | Prüfen — nur auf Dashboard/Nicht-Übung anzeigen */}
          {onModusWechsel && !istInUebung && (
            <nav className="flex items-center gap-1 ml-4">
              <button
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
              >
                Üben
              </button>
              <button
                onClick={() => onModusWechsel('pruefen')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Prüfen
              </button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Lernziele-Button */}
          {aktuellerScreen === 'dashboard' && (
            <Tooltip text="Lernziele" position="bottom">
              <button
                onClick={() => { setLernzieleOffen(!lernzieleOffen); setHilfeOffen(false) }}
                className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center ${lernzieleOffen ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
              >
                <span className="text-lg">&#127937;</span>
              </button>
            </Tooltip>
          )}

          {/* Hilfe-Button */}
          <Tooltip text="Hilfe" position="bottom">
            <button
              onClick={() => { setHilfeOffen(!hilfeOffen); setLernzieleOffen(false) }}
              className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center ${hilfeOffen ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
            >
              <span className="text-lg">?</span>
            </button>
          </Tooltip>

          {/* Admin-Button */}
          {istAdmin && aktuellerScreen !== 'admin' && (
            <button
              onClick={zuAdmin}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 min-h-[36px]"
            >
              Admin
            </button>
          )}

          {/* Trennstrich */}
          <span className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />

          {/* Feedback-Button */}
          <FeedbackButton
            variant="icon"
            context={{
              rolle: user?.rolle === 'admin' ? 'lp' : 'sus',
              ort: aktuellerScreen === 'uebung' ? 'frage-ueben' : 'uebungstool',
              modus: 'ueben',
              bildschirm: aktuellerScreen,
              gruppeId: aktiveGruppe?.id,
              appVersion: typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'dev',
            }}
          />

          {/* Theme-Toggle */}
          <Tooltip text={istDark ? 'Light Mode' : 'Dark Mode'} position="bottom">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <span className="text-lg">{istDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}</span>
            </button>
          </Tooltip>

          {/* Abmelden (immer ganz rechts) */}
          <button
            onClick={abmelden}
            className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Abmelden
          </button>
        </div>
      </header>

      {/* Hilfe-Panel (Slide-over) */}
      {hilfeOffen && <SuSHilfePanel onSchliessen={() => setHilfeOffen(false)} />}

      {/* Lernziele-Panel — Akkordeon nach Pool-Vorbild */}
      {lernzieleOffen && (
        <LernzieleAkkordeon
          lernziele={lernziele}
          fortschritte={fortschritte}
          onSchliessen={() => setLernzieleOffen(false)}
          onThemaUeben={(thema) => {
            setLernzieleOffen(false)
            // Deep-Link-Thema im Store setzen, dann zum Dashboard navigieren
            import('../../../store/ueben/navigationStore').then(m => {
              m.useUebenNavigationStore.getState().setDeepLinkThema(thema)
            })
            zuDashboard()
          }}
        />
      )}

      {children}
    </div>
  )
}

/** Leitet den Screen-Typ aus dem URL-Pfad ab */
function ermittleScreen(pathname: string): string {
  if (pathname.startsWith('/sus/admin')) return 'admin'
  if (pathname.startsWith('/sus/ueben/ergebnis')) return 'ergebnis'
  if (pathname.match(/^\/sus\/ueben\/[^/]+/)) return 'uebung'
  if (pathname.startsWith('/sus/ueben')) return 'dashboard'
  if (pathname.startsWith('/sus/gruppen')) return 'gruppenAuswahl'
  if (pathname.startsWith('/sus/login')) return 'login'
  return 'dashboard'
}
