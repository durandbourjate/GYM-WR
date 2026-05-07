// ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx
import type React from 'react'
import type { ThemenFortschritt } from '../../../types/ueben/fortschritt'

export function FilterSection({ titel, emoji, children, onToggleAlle }: {
  titel: string; emoji: string; children: React.ReactNode; onToggleAlle: () => void
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {emoji} {titel}
        </h4>
        <button
          onClick={onToggleAlle}
          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 transition-colors"
        >
          Alle ⇄
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}

export function Chip({ label, count, aktiv, farbe, onClick }: {
  label: string; count?: number; aktiv: boolean; farbe: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors cursor-pointer select-none ${
        !aktiv
          ? 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          : ''
      }`}
      style={aktiv
        ? { backgroundColor: farbe, color: '#fff', borderColor: farbe }
        : undefined
      }
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] font-mono ${aktiv ? 'opacity-80' : 'text-slate-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

export function FortschrittsBalken({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  const gemeistertPct = (fortschritt.gemeistert / fortschritt.gesamt) * 100
  const gefestigtPct = (fortschritt.gefestigt / fortschritt.gesamt) * 100
  const uebenPct = (fortschritt.ueben / fortschritt.gesamt) * 100

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex mt-2">
      {gemeistertPct > 0 && <div className="bg-green-500 h-2" style={{ width: `${gemeistertPct}%` }} />}
      {gefestigtPct > 0 && <div className="bg-blue-400 h-2" style={{ width: `${gefestigtPct}%` }} />}
      {uebenPct > 0 && <div className="bg-yellow-400 h-2" style={{ width: `${uebenPct}%` }} />}
    </div>
  )
}

export function MasteryBadges({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  return (
    <div className="flex items-center gap-1 text-xs">
      {fortschritt.gemeistert > 0 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{fortschritt.gemeistert}</span>}
      {fortschritt.gefestigt > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{fortschritt.gefestigt}</span>}
      {fortschritt.ueben > 0 && <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">{fortschritt.ueben}</span>}
      {fortschritt.neu > 0 && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">{fortschritt.neu}</span>}
    </div>
  )
}
