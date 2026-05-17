import { useState, useMemo } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import BaseDialog from '../ui/BaseDialog'
import { TAB_REGISTRY, type TabDefinition } from '../../utils/tabRegistry'
import { useFavoritenStore } from '../../store/favoritenStore'
import { useStammdatenStore } from '../../store/stammdatenStore'
import { NavIcon } from '../ui/icons/NavIcon'
import type { Favorit } from '../../types/favorit'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Modal-Picker für Favoriten-Hinzufügen aus Tab-Registry (Cluster E.5).
 * Listet alle Einstellungen- + Hilfe-Tabs alphabetisch, mit Filter-Input.
 * Bereits-Favorit-Tabs sind als „Bereits Favorit" markiert. Click triggert
 * toggleFavorit. Modal bleibt offen (Multi-Add), schliesst via „Fertig" oder ESC.
 */
export function FavoritenPicker({ open, onClose }: Props) {
  const [filter, setFilter] = useState('')
  const istFavorit = useFavoritenStore(s => s.istFavorit)
  const toggleFavorit = useFavoritenStore(s => s.toggleFavorit)
  const lpProfil = useStammdatenStore(s => s.lpProfil)
  const istAdmin = useStammdatenStore(s => s.istAdmin)(lpProfil?.email)

  const tabs = useMemo(() => {
    const ctx = { istAdmin }
    const sichtbar = TAB_REGISTRY.filter(t => t.sichtbar?.(ctx) ?? true)
    const filtered = filter
      ? sichtbar.filter(t => t.titel.toLowerCase().includes(filter.toLowerCase()))
      : sichtbar
    return [...filtered].sort((a, b) => a.titel.localeCompare(b.titel, 'de'))
  }, [filter, istAdmin])

  if (!open) return null

  function handleAdd(tab: TabDefinition) {
    const typ: Favorit['typ'] = tab.surface === 'einstellungen' ? 'einstellungen-tab' : 'hilfe-tab'
    toggleFavorit({ typ, ziel: tab.id, label: tab.titel, icon: tab.icon })
  }

  return (
    <BaseDialog open={open} onClose={onClose} title="Favorit hinzufügen">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Tab suchen..."
            aria-label="Suche Tabs"
            className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
          />
        </div>

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {tabs.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">Keine Tabs gefunden.</p>
          ) : (
            tabs.map(tab => {
              const istFav = istFavorit(tab.id)
              return (
                <div
                  key={`${tab.surface}-${tab.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {tab.icon && (
                    <span className="inline-flex items-center text-slate-500 dark:text-slate-400">
                      <NavIcon icon={tab.icon} className="w-4 h-4" />
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{tab.titel}</p>
                    <p className="text-xs text-slate-400">{tab.surface === 'einstellungen' ? 'Einstellungen' : 'Hilfe'}</p>
                  </div>
                  {istFav ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 px-2 py-1">
                      <Check className="w-4 h-4" aria-hidden="true" />
                      Bereits Favorit
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(tab)}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-md transition-colors cursor-pointer"
                      aria-label={`${tab.titel} hinzufügen`}
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      Hinzufügen
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </BaseDialog>
  )
}
