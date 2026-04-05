import { useState, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useGruppenStore } from '../../store/gruppenStore'
import { useNavigationStore } from '../../store/navigationStore'
import { useUebungsStore } from '../../store/uebungsStore'
import { useFortschrittStore } from '../../store/fortschrittStore'
import { useTheme } from '../../hooks/useTheme'
import { useLernKontext } from '../../hooks/useLernKontext'
import { lernzielStatus } from '../../utils/mastery'
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
  const [lernzieleOffen, setLernzieleOffen] = useState(false)
  const { lernziele, ladeLernziele, fortschritte } = useFortschrittStore()
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
      useUebungsStore.setState({ session: null })
    }
    navigiere('dashboard')
  }

  if (!zeigeHeader) return <>{children}</>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Zurück-Button */}
          {kannZurueck() && aktuellerScreen !== 'dashboard' && (
            <button
              onClick={istInUebung ? navigiereZuDashboard : zurueck}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zurück"
            >
              <span className="text-lg dark:text-white">&#8592;</span>
            </button>
          )}

          {/* Home-Button (nur wenn nicht auf Dashboard) */}
          {aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'gruppenAuswahl' && (
            <button
              onClick={navigiereZuDashboard}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Gruppe wechseln"
              >
                {aktiveGruppe.name} &#8227;
              </button>
            ) : aktiveGruppe ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">{aktiveGruppe.name}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lernziele-Button */}
          {aktuellerScreen === 'dashboard' && (
            <button
              onClick={() => { setLernzieleOffen(!lernzieleOffen); setHilfeOffen(false) }}
              className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center ${lernzieleOffen ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
              title="Lernziele"
            >
              <span className="text-lg">&#127937;</span>
            </button>
          )}

          {/* Hilfe-Button */}
          <button
            onClick={() => { setHilfeOffen(!hilfeOffen); setLernzieleOffen(false) }}
            className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center ${hilfeOffen ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
            title="Hilfe"
          >
            <span className="text-lg">?</span>
          </button>

          {/* Admin-Button */}
          {istAdmin && aktuellerScreen !== 'admin' && (
            <button
              onClick={() => navigiere('admin')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 min-h-[36px]"
            >
              Admin
            </button>
          )}

          {/* Theme-Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={istDark ? 'Light Mode' : 'Dark Mode'}
          >
            <span className="text-lg">{istDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}</span>
          </button>

          {/* User-Info + Abmelden */}
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">{user?.vorname}</span>
          <button
            onClick={abmelden}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {t('abmelden', anrede)}
          </button>
        </div>
      </header>

      {/* Hilfe-Panel */}
      {hilfeOffen && (
        <div className="bg-slate-50 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="max-w-2xl mx-auto text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold dark:text-white">Hilfe</h3>
              <button onClick={() => setHilfeOffen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">x</button>
            </div>
            <p>Wähle ein Thema aus und bearbeite Übungsfragen mit sofortigem Feedback.</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><strong>Mastery-Stufen:</strong></div>
              <div />
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300 inline-block" /> Neu</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Üben</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Gefestigt</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Gemeistert</div>
            </div>
          </div>
        </div>
      )}

      {/* Lernziele-Panel */}
      {lernzieleOffen && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3">
          <div className="max-w-2xl mx-auto text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold dark:text-white">&#127937; Lernziele</h3>
              <button onClick={() => setLernzieleOffen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">x</button>
            </div>

            {lernziele.length > 0 ? (
              <>
                {Object.entries(
                  lernziele.reduce<Record<string, typeof lernziele>>((acc, lz) => {
                    if (!acc[lz.fach]) acc[lz.fach] = []
                    acc[lz.fach].push(lz)
                    return acc
                  }, {})
                ).map(([fach, fachLernziele]) => (
                  <div key={fach}>
                    <h4 className="font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-2 mb-1">{fach}</h4>
                    <div className="space-y-1">
                      {fachLernziele
                        .map(lz => ({ lz, status: lernzielStatus(lz, fortschritte) }))
                        .sort((a, b) => {
                          const order = { offen: 0, inArbeit: 1, gefestigt: 2, gemeistert: 3 }
                          return order[a.status] - order[b.status]
                        })
                        .map(({ lz, status }) => (
                          <div key={lz.id} className="flex items-start gap-2">
                            <span className="mt-0.5 text-sm">
                              {status === 'gemeistert' ? '\u2705' : status === 'gefestigt' ? '\uD83D\uDD35' : status === 'inArbeit' ? '\uD83D\uDFE1' : '\u2B1C'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className={status === 'gemeistert' ? 'line-through text-slate-400' : ''}>{lz.text}</span>
                              <span className="ml-1 text-xs text-slate-400">{lz.bloom}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <p>Bearbeite die Themen im Dashboard, um deine Lernziele zu erreichen.</p>
                <div className="text-xs space-y-1">
                  <p>Dein Ziel: Fragen auf <strong className="text-green-600 dark:text-green-400">Gemeistert</strong> bringen.</p>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300 inline-block" /> Neu</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Ueben</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Gefestigt</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Gemeistert</div>
                  </div>
                  <p className="text-slate-400 mt-2 italic">Lernziele werden von der Lehrperson definiert.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
