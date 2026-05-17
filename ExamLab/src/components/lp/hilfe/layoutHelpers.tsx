import type { ReactNode } from 'react'
import { TYPO } from '../../../styles/typografie'
import { TabStarToggle } from '../TabStarToggle'

export function Titel({ children }: { children: ReactNode }) {
  return <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100 mb-3`}>{children}</h2>
}

/**
 * Titel mit Star-Toggle rechts (Cluster E.4 — für Hilfe-Tabs).
 * Ersetzt <Titel> in Tab-Komponenten die Favoriten-Toggle haben sollen.
 */
export function TitelMitStern({ tabId, children }: { tabId: string; children: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100`}>{children}</h2>
      <TabStarToggle tabId={tabId} surface="hilfe" label={children} />
    </div>
  )
}

export function Untertitel({ children }: { children: ReactNode }) {
  return <h3 className={`${TYPO.h2} text-slate-700 dark:text-slate-200 mt-5 mb-2`}>{children}</h3>
}

export function Text({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">{children}</p>
}

export function Schritt({ nr, children }: { nr: number; children: ReactNode }) {
  return (
    <div className="flex gap-3 mb-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs font-bold flex items-center justify-center">
        {nr}
      </span>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">{children}</div>
    </div>
  )
}

export function Hinweis({ children }: { children: ReactNode }) {
  // Neutrale Slate-Box — Blau ist für KI-Elemente reserviert (Design-System)
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-start gap-2">
      <span className="text-slate-400 shrink-0 mt-0.5">ⓘ</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
