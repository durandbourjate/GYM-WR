import { useEffect, useCallback, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useLernenAuthStore } from '../../store/lernen/authStore'
import { useLernenGruppenStore } from '../../store/lernen/gruppenStore'
import { lernenApiClient } from '../../services/lernen/apiClient'
import { LernKontextProvider } from '../../context/lernen/LernKontextProvider'
import AdminDashboard from '../lernen/admin/AdminDashboard'

const LP_AUTH_KEY = 'lernplattform-auth'

/**
 * Wrapper der die Lernen-Stores mit dem Prüfungstool-User initialisiert
 * und das AdminDashboard rendert.
 *
 * Schritte:
 * 1. LP-Login auf dem LP-Backend (lernplattformLogin) → Session-Token holen
 * 2. Token + User in localStorage + Zustand-Store schreiben
 * 3. Gruppen laden
 * 4. AdminDashboard rendern
 */
export default function UebungsToolView() {
  const pruefungUser = useAuthStore(s => s.user)
  const { gruppen, aktiveGruppe, ladeGruppen, waehleGruppe, ladeStatus } = useLernenGruppenStore()
  const [loginStatus, setLoginStatus] = useState<'idle' | 'laden' | 'fertig' | 'fehler'>('idle')

  // LP-Login auf dem LP-Backend ausführen um einen gültigen Session-Token zu bekommen
  useEffect(() => {
    if (!pruefungUser?.email || loginStatus !== 'idle') return
    setLoginStatus('laden')

    async function login() {
      try {
        const response = await lernenApiClient.post<{
          success: boolean
          data: { sessionToken: string }
        }>('lernplattformLogin', {
          email: pruefungUser!.email,
          name: pruefungUser!.name || pruefungUser!.email,
        })

        const sessionToken = response?.data?.sessionToken || ''

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
        useLernenAuthStore.setState({
          user: lpUser,
          istAngemeldet: true,
          ladeStatus: 'fertig',
        })

        setLoginStatus('fertig')
      } catch {
        setLoginStatus('fehler')
      }
    }
    login()
  }, [pruefungUser?.email, pruefungUser?.name, loginStatus])

  // Gruppen laden nachdem Login fertig
  useEffect(() => {
    if (loginStatus === 'fertig' && pruefungUser?.email && ladeStatus === 'idle') {
      ladeGruppen(pruefungUser.email)
    }
  }, [loginStatus, pruefungUser?.email, ladeStatus, ladeGruppen])

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
  if (loginStatus === 'idle' || loginStatus === 'laden' || ladeStatus === 'laden' || ladeStatus === 'idle') {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 dark:text-slate-400">
          {loginStatus === 'laden' ? 'Übungstool wird verbunden...' : 'Gruppen werden geladen...'}
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
            Das Übungstool-Backend konnte nicht erreicht werden.
          </p>
          <button
            onClick={() => setLoginStatus('idle')}
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
            Keine Übungsgruppen gefunden. Erstelle eine Gruppe im Übungstool.
          </p>
        </div>
      </div>
    )
  }

  // Gruppenauswahl (bei mehreren Gruppen)
  if (!aktiveGruppe) {
    return (
      <div className="max-w-3xl mx-auto p-6">
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
                {g.typ === 'familie' ? 'Familie' : 'Schule'} · {g.mitglieder.length} Mitglieder
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // AdminDashboard mit Gruppen-Kontext
  return (
    <LernKontextProvider>
      <div className="relative">
        {/* Gruppen-Wechsler wenn mehrere Gruppen */}
        {gruppen.length > 1 && (
          <div className="max-w-5xl mx-auto px-6 pt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Gruppe:</span>
            <select
              value={aktiveGruppe.id}
              onChange={e => handleGruppeWaehlen(e.target.value)}
              className="text-sm px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md dark:text-slate-200"
            >
              {gruppen.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
        <AdminDashboard />
      </div>
    </LernKontextProvider>
  )
}
