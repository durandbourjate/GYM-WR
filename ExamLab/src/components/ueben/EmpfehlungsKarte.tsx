import type { Empfehlung } from '../../types/ueben/auftrag'
import { getFachFarbe } from '../../utils/ueben/fachFarben'

interface EmpfehlungsKarteProps {
  empfehlung: Empfehlung
  fachFarben: Record<string, string>
  onStarte: () => void
}

const TYP_CONFIG: Record<Empfehlung['typ'], { icon: string; label: string; bgLight: string; bgDark: string; borderLight: string; borderDark: string }> = {
  auftrag: {
    icon: '📋',
    label: 'Auftrag',
    bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/20',
    borderLight: 'border-blue-200', borderDark: 'dark:border-blue-800',
  },
  luecke: {
    icon: '🎯',
    label: 'Empfohlen',
    bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20',
    borderLight: 'border-amber-200', borderDark: 'dark:border-amber-800',
  },
  festigung: {
    icon: '💪',
    label: 'Festigung',
    bgLight: 'bg-green-50', bgDark: 'dark:bg-green-900/20',
    borderLight: 'border-green-200', borderDark: 'dark:border-green-800',
  },
}

export function EmpfehlungsKarte({ empfehlung, fachFarben, onStarte }: EmpfehlungsKarteProps) {
  const config = TYP_CONFIG[empfehlung.typ]
  const farbe = getFachFarbe(empfehlung.fach, fachFarben)

  return (
    <button
      onClick={onStarte}
      className={`w-full text-left p-4 rounded-xl shadow-sm border min-h-[48px] transition-shadow hover:shadow-md cursor-pointer
        ${config.bgLight} ${config.bgDark} ${config.borderLight} ${config.borderDark}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{config.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {config.label}
            </span>
            {empfehlung.fach && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: farbe }}
              >
                {empfehlung.fach}
              </span>
            )}
          </div>
          <div className="font-medium dark:text-white text-sm">{empfehlung.titel}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{empfehlung.beschreibung}</div>
        </div>
        <span className="text-slate-400 dark:text-slate-500 text-lg shrink-0 mt-1">→</span>
      </div>
    </button>
  )
}
