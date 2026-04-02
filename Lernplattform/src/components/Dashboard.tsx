import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGruppenStore } from '../store/gruppenStore'
import { useUebungsStore } from '../store/uebungsStore'
import { fragenAdapter } from '../adapters/appsScriptAdapter'

interface ThemenMap {
  [fach: string]: string[]
}

export default function Dashboard() {
  const { user, abmelden } = useAuthStore()
  const { aktiveGruppe } = useGruppenStore()
  const { starteSession } = useUebungsStore()
  const [themen, setThemen] = useState<ThemenMap>({})
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    if (!aktiveGruppe) return
    const ladeThemen = async () => {
      setLaden(true)
      const alleFragen = await fragenAdapter.ladeFragen(aktiveGruppe.id, { nurUebung: true })
      const map: ThemenMap = {}
      for (const f of alleFragen) {
        if (!map[f.fach]) map[f.fach] = []
        if (!map[f.fach].includes(f.thema)) map[f.fach].push(f.thema)
      }
      setThemen(map)
      setLaden(false)
    }
    ladeThemen()
  }, [aktiveGruppe])

  const handleStarte = (fach: string, thema: string) => {
    if (!aktiveGruppe || !user) return
    starteSession(aktiveGruppe.id, user.email, fach, thema)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold dark:text-white">Lernplattform</h1>
          {aktiveGruppe && <span className="text-sm text-gray-500">{aktiveGruppe.name}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{user?.vorname || user?.email}</span>
          {user?.bild && <img src={user.bild} alt="" className="w-8 h-8 rounded-full" />}
          <button onClick={abmelden} className="text-sm text-gray-400 hover:text-gray-600">Abmelden</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Hallo {user?.vorname || 'dort'}!
        </h2>

        {laden ? (
          <p className="text-gray-500">Themen werden geladen...</p>
        ) : Object.keys(themen).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-gray-500">
            <p>Noch keine Uebungsfragen vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(themen).map(([fach, themenListe]) => (
              <div key={fach}>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">{fach}</h3>
                <div className="grid gap-2">
                  {themenListe.map((thema) => (
                    <button
                      key={thema}
                      onClick={() => handleStarte(fach, thema)}
                      className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 min-h-[48px]"
                    >
                      <span className="font-medium dark:text-white">{thema}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
