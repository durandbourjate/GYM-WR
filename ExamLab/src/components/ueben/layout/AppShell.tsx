import { useState, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useUebenAuthStore } from '../../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import { useUebenUebungsStore } from '../../../store/ueben/uebungsStore'
import { useUebenFortschrittStore } from '../../../store/ueben/fortschrittStore'
import { useSuSNavigation } from '../../../hooks/ueben/useSuSNavigation'
import { lernzielStatus as _lernzielStatus } from '../../../utils/ueben/mastery'
import LernzieleAkkordeon from '../LernzieleAkkordeon'
import SuSHilfePanel from '../SuSHilfePanel'
import { SuSAppHeaderContainer } from '../../sus/SuSAppHeaderContainer'

interface Props {
  children: ReactNode
  /** Callback: Zurück zur ExamLab-Startseite (verlässt Üben-Modus) */
  onExamLabHome?: () => void
  /** Callback: Tab-Wechsel zwischen Üben/Prüfen */
  onModusWechsel?: (modus: 'ueben' | 'pruefen') => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AppShell({ children, onExamLabHome: _onExamLabHome, onModusWechsel: _onModusWechsel }: Props) {
  const { user } = useUebenAuthStore()
  const { aktiveGruppe } = useUebenGruppenStore()
  const { zuDashboard, zurueck } = useSuSNavigation()

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
      <SuSAppHeaderContainer
        onHilfe={() => { setHilfeOffen(true); setLernzieleOffen(false) }}
        onZurueck={
          aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'gruppenAuswahl' && aktiveGruppe
            ? (istInUebung ? navigiereZuDashboard : zurueck)
            : undefined
        }
      />

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
  // Neue Header-L2-Routen: bleiben im Dashboard (Body-Tab wechselt via Dashboard.tsx useEffect)
  if (pathname.startsWith('/sus/ueben/fortschritt')) return 'dashboard'
  if (pathname.startsWith('/sus/ueben/ergebnisse')) return 'dashboard'
  if (pathname.startsWith('/sus/ueben/kurs/')) return 'dashboard'
  if (pathname.match(/^\/sus\/ueben\/[^/]+/)) return 'uebung'
  if (pathname.startsWith('/sus/ueben')) return 'dashboard'
  if (pathname.startsWith('/sus/gruppen')) return 'gruppenAuswahl'
  if (pathname.startsWith('/sus/login')) return 'login'
  return 'dashboard'
}
