import { useState } from 'react'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { usePruefungsMonitoring } from '../hooks/usePruefungsMonitoring.ts'
import { istImSEB } from '../services/sebService.ts'
import Timer from './Timer.tsx'
import VerbindungsStatus from './VerbindungsStatus.tsx'
import AutoSaveIndikator from './AutoSaveIndikator.tsx'
import FragenNavigation from './FragenNavigation.tsx'
import AbgabeDialog from './AbgabeDialog.tsx'
import ThemeToggle from './ThemeToggle.tsx'
import MCFrage from './fragetypen/MCFrage.tsx'
import FreitextFrage from './fragetypen/FreitextFrage.tsx'
import LueckentextFrage from './fragetypen/LueckentextFrage.tsx'
import type { MCFrage as MCFrageType, FreitextFrage as FreitextFrageType, LueckentextFrage as LueckentextFrageType } from '../types/fragen.ts'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const aktuelleFrageIndex = usePruefungStore((s) => s.aktuelleFrageIndex)
  const markierungen = usePruefungStore((s) => s.markierungen)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const naechsteFrage = usePruefungStore((s) => s.naechsteFrage)
  const vorherigeFrage = usePruefungStore((s) => s.vorherigeFrage)
  const toggleMarkierung = usePruefungStore((s) => s.toggleMarkierung)
  const [zeigAbgabeDialog, setZeigAbgabeDialog] = useState(false)
  const [sebWarnungGeschlossen, setSebWarnungGeschlossen] = useState(false)

  // Monitoring: Auto-Save (lokal + remote), Heartbeat, Focus-Detection, Online/Offline
  usePruefungsMonitoring()

  if (!config || fragen.length === 0) return null

  const aktuelleFrage = fragen[aktuelleFrageIndex]
  const istMarkiert = aktuelleFrage ? !!markierungen[aktuelleFrage.id] : false

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* SEB-Warnung */}
      {config.sebErforderlich && !istImSEB() && !sebWarnungGeschlossen && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Diese Prüfung sollte im Safe Exam Browser (SEB) geschrieben werden. Du verwendest einen normalen Browser.
          </p>
          <button
            onClick={() => setSebWarnungGeschlossen(true)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 text-lg leading-none cursor-pointer"
            title="Warnung schliessen"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header — alle Steuerungen */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 py-2 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Links: Zurück / Frage X/Y / Weiter */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={vorherigeFrage}
              disabled={aktuelleFrageIndex === 0}
              title="Vorherige Frage"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              &larr;
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300 tabular-nums min-w-[4rem] text-center font-medium">
              {aktuelleFrageIndex + 1} / {fragen.length}
            </span>
            <button
              onClick={naechsteFrage}
              disabled={aktuelleFrageIndex === fragen.length - 1}
              title="Nächste Frage"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              &rarr;
            </button>
          </div>

          {/* Mitte: Timer + AutoSave */}
          <div className="flex items-center gap-2">
            <AutoSaveIndikator />
            <Timer />
          </div>

          {/* Rechts: Markieren + Abgeben + Status + Theme */}
          <div className="flex items-center gap-1.5">
            {aktuelleFrage && (
              <button
                onClick={() => toggleMarkierung(aktuelleFrage.id)}
                title={istMarkiert ? 'Markierung entfernen' : 'Als unsicher markieren'}
                className={`px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer hidden sm:flex items-center gap-1
                  ${istMarkiert
                    ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                    : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span>?</span>
                <span className="hidden md:inline">{istMarkiert ? 'Markiert' : 'Unsicher'}</span>
              </button>
            )}

            {!abgegeben && (
              <button
                onClick={() => setZeigAbgabeDialog(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 dark:bg-slate-600 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Abgeben
              </button>
            )}

            <VerbindungsStatus />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: Markieren-Button */}
        {aktuelleFrage && (
          <div className="sm:hidden mt-1.5 flex items-center gap-2">
            <button
              onClick={() => toggleMarkierung(aktuelleFrage.id)}
              className={`px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer flex items-center gap-1
                ${istMarkiert
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                  : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                }
              `}
            >
              <span>?</span>
              <span>{istMarkiert ? 'Markiert' : 'Unsicher'}</span>
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {config.titel}
            </span>
          </div>
        )}
      </header>

      {/* Main */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-auto">
          {user && (
            <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
              {user.email && user.email !== 'demo@example.com' && (
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
              )}
            </div>
          )}
          <FragenNavigation />
        </aside>

        {/* Fragenbereich */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {aktuelleFrage && renderFrage(aktuelleFrage)}

            {/* Mobile Navigation (Kacheln) */}
            <div className="md:hidden mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <FragenNavigation />
            </div>
          </div>
        </main>
      </div>

      {/* Abgabe-Dialog */}
      {zeigAbgabeDialog && (
        <AbgabeDialog onSchliessen={() => setZeigAbgabeDialog(false)} />
      )}
    </div>
  )
}

function renderFrage(frage: MCFrageType | FreitextFrageType | LueckentextFrageType | { typ: string }) {
  switch (frage.typ) {
    case 'mc':
      return <MCFrage frage={frage as MCFrageType} />
    case 'freitext':
      return <FreitextFrage frage={frage as FreitextFrageType} />
    case 'lueckentext':
      return <LueckentextFrage frage={frage as LueckentextFrageType} />
    default:
      return (
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-center">
          Fragetyp «{frage.typ}» wird in einer späteren Phase implementiert.
        </div>
      )
  }
}
