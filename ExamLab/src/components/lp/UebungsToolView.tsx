import { useEffect, useCallback, useState, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useUebenAuthStore } from '../../store/ueben/authStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { uebenApiClient } from '../../services/ueben/apiClient'
import { UebenKontextProvider } from '../../context/ueben/UebenKontextProvider'
import AdminDashboard from '../ueben/admin/AdminDashboard'
import { apiService } from '../../services/apiService'

const LP_AUTH_KEY = 'ueben-auth'

/**
 * Wrapper der die Üben-Stores mit dem ExamLab-User initialisiert
 * und das AdminDashboard rendert.
 *
 * Schritte:
 * 1. LP-Login auf dem Üben-Backend (lernplattformLogin) → Session-Token holen
 * 2. Token + User in localStorage + Zustand-Store schreiben
 * 3. Gruppen laden
 * 4. AdminDashboard rendern
 */
interface UebungsToolViewProps {
  onFachKlick?: () => void
}

export default function UebungsToolView({ onFachKlick }: UebungsToolViewProps = {}) {
  const pruefungUser = useAuthStore(s => s.user)
  const istDemoModus = useAuthStore(s => s.istDemoModus)
  const { gruppen, aktiveGruppe, ladeGruppen, waehleGruppe, ladeStatus } = useUebenGruppenStore()
  const storeMitglieder = useUebenGruppenStore(s => s.mitglieder)
  const [loginStatus, setLoginStatus] = useState<'idle' | 'laden' | 'fertig' | 'fehler'>('idle')
  const loginGestartetRef = useRef(false)

  // Demo-Modus: Kein Backend-Login nötig, Mock-Daten verwenden
  useEffect(() => {
    if (!istDemoModus || loginStatus !== 'idle') return
    const demoGruppe = {
      id: 'demo-gruppe', name: 'Demo-Klasse', typ: 'gym' as const,
      adminEmail: 'demo-lp@gymhofwil.ch', fragebankSheetId: 'demo',
      analytikSheetId: 'demo', mitglieder: ['demo-lp@gymhofwil.ch', 'demo.sus@stud.gymhofwil.ch'],
    }
    useUebenAuthStore.setState({
      user: {
        email: pruefungUser?.email || 'demo-lp@gymhofwil.ch',
        name: pruefungUser?.name || 'Demo LP',
        vorname: 'Demo', nachname: 'LP',
        rolle: 'admin', sessionToken: 'demo-token', loginMethode: 'google',
      },
      istAngemeldet: true, ladeStatus: 'fertig',
    })
    useUebenGruppenStore.setState({
      gruppen: [demoGruppe], aktiveGruppe: demoGruppe, ladeStatus: 'fertig',
      mitglieder: [
        { email: 'demo-lp@gymhofwil.ch', name: 'Demo LP', rolle: 'admin' as const, beigetreten: new Date().toISOString() },
        { email: 'demo.sus@stud.gymhofwil.ch', name: 'Demo SuS', rolle: 'lernend' as const, beigetreten: new Date().toISOString() },
      ],
    })
    setLoginStatus('fertig')
  }, [istDemoModus, loginStatus, pruefungUser?.email, pruefungUser?.name])

  // LP-Login auf dem Üben-Backend ausführen um einen gültigen Session-Token zu bekommen
  useEffect(() => {
    if (!pruefungUser?.email || loginStatus !== 'idle' || istDemoModus || !apiService.istKonfiguriert()) return
    if (loginGestartetRef.current) return
    loginGestartetRef.current = true
    setLoginStatus('laden')

    async function login() {
      try {
        console.log('[UebungsToolView] LP-Login starten für', pruefungUser!.email)
        const response = await uebenApiClient.post<{
          success: boolean
          data: { sessionToken: string }
        }>('lernplattformLogin', {
          email: pruefungUser!.email,
          name: pruefungUser!.name || pruefungUser!.email,
        })

        if (!response || !response.data?.sessionToken) {
          console.error('[UebungsToolView] LP-Login fehlgeschlagen — keine gültige Antwort:', response)
          setLoginStatus('fehler')
          return
        }

        const sessionToken = response.data.sessionToken
        console.log('[UebungsToolView] LP-Login erfolgreich, Token erhalten')

        // In localStorage schreiben (Adapter lesen von dort)
        const lpUser = {
          email: pruefungUser!.email,
          name: pruefungUser!.name || pruefungUser!.email,
          vorname: pruefungUser!.name?.split(' ')[0] || '',
          nachname: pruefungUser!.name?.split(' ').slice(1).join(' ') || '',
          rolle: 'admin' as const,
          sessionToken,
          loginMethode: 'google' as const,
        }
        localStorage.setItem(LP_AUTH_KEY, JSON.stringify(lpUser))

        // Zustand-Store aktualisieren
        useUebenAuthStore.setState({
          user: lpUser,
          istAngemeldet: true,
          ladeStatus: 'fertig',
        })

        setLoginStatus('fertig')
      } catch (error) {
        console.error('[UebungsToolView] LP-Login Fehler:', error)
        loginGestartetRef.current = false
        setLoginStatus('fehler')
      }
    }
    login()
  }, [pruefungUser?.email, pruefungUser?.name, loginStatus])

  // Gruppen laden nachdem Login fertig
  useEffect(() => {
    if (loginStatus === 'fertig' && pruefungUser?.email && (ladeStatus === 'idle' || (ladeStatus === 'fertig' && gruppen.length === 0))) {
      console.log('[UebungsToolView] Gruppen laden für', pruefungUser.email, '(ladeStatus:', ladeStatus, ')')
      ladeGruppen(pruefungUser.email)
    }
  }, [loginStatus, pruefungUser?.email, ladeStatus, gruppen.length, ladeGruppen])

  // Auto-Select bei genau 1 Gruppe
  useEffect(() => {
    if (ladeStatus === 'fertig' && gruppen.length === 1 && !aktiveGruppe) {
      waehleGruppe(gruppen[0].id)
    }
  }, [ladeStatus, gruppen, aktiveGruppe, waehleGruppe])

  const handleGruppeWaehlen = useCallback((gruppeId: string) => {
    waehleGruppe(gruppeId)
  }, [waehleGruppe])

  // Laden (Login oder Gruppen)
  if (loginStatus === 'idle' || loginStatus === 'laden' || ladeStatus === 'laden') {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 dark:text-slate-400">
          {loginStatus === 'laden' ? 'Übungen werden verbunden...' : 'Gruppen werden geladen...'}
        </p>
      </div>
    )
  }

  // Login-Fehler
  if (loginStatus === 'fehler') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-xl font-bold mb-2 dark:text-white">Verbindung fehlgeschlagen</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Das Backend konnte nicht erreicht werden.
          </p>
          <button
            onClick={() => { loginGestartetRef.current = false; setLoginStatus('idle') }}
            className="mt-4 px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // Keine Gruppen
  if (gruppen.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <p className="text-4xl mb-3">📚</p>
          <h2 className="text-xl font-bold mb-2 dark:text-white">Keine Gruppen</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Keine Übungsgruppen gefunden. Erstellen Sie eine Gruppe unter Üben.
          </p>
        </div>
      </div>
    )
  }

  // Gruppenauswahl (bei mehreren Gruppen)
  if (!aktiveGruppe) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-lg font-bold mb-4 dark:text-white">Gruppe wählen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gruppen.map(g => (
            <button
              key={g.id}
              onClick={() => handleGruppeWaehlen(g.id)}
              className="text-left p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="font-medium dark:text-white">{g.name}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {g.typ === 'familie' ? 'Familie' : 'Schule'}{g.mitglieder?.length ? ` · ${g.mitglieder.length} Mitglieder` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Mitglieder-Stats aus dem Store (haben Rollen-Info)
  const lernende = storeMitglieder.filter(m => m.rolle !== 'admin').length
  const admins = storeMitglieder.filter(m => m.rolle === 'admin').length

  // AdminDashboard mit Gruppen-Kontext
  return (
    <UebenKontextProvider>
      <div className="relative">
        {/* Gruppen-Info-Bar */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            {gruppen.length > 1 ? (
              <>
                <span className="text-sm text-slate-500 dark:text-slate-400">Gruppe:</span>
                <select
                  value={aktiveGruppe.id}
                  onChange={e => handleGruppeWaehlen(e.target.value)}
                  className="text-sm px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md dark:text-slate-200 font-medium"
                >
                  {gruppen.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{aktiveGruppe.name}</span>
            )}
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {lernende} Lernende · {admins} Admin{admins !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <AdminDashboard onFachKlick={onFachKlick} />
      </div>
    </UebenKontextProvider>
  )
}
