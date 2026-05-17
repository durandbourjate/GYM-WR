import { Star } from 'lucide-react'
import { useFavoritenStore } from '../../store/favoritenStore'
import type { Favorit } from '../../types/favorit'

interface Props {
  tabId: string
  surface: 'einstellungen' | 'hilfe'
  label: string
  icon?: string
}

/**
 * Star-Toggle für Tab-Headers (Cluster E.4).
 * Klick togglet den Tab als Favorit mit typ='einstellungen-tab' oder 'hilfe-tab'.
 */
export function TabStarToggle({ tabId, surface, label, icon }: Props) {
  const istFav = useFavoritenStore(s => s.istFavorit(tabId))
  const toggle = useFavoritenStore(s => s.toggleFavorit)
  const typ: Favorit['typ'] = surface === 'einstellungen' ? 'einstellungen-tab' : 'hilfe-tab'

  return (
    <button
      onClick={() => toggle({ typ, ziel: tabId, label, icon })}
      aria-label={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      className="text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
    >
      <Star
        className={`w-5 h-5 ${istFav ? 'fill-current text-amber-500' : ''}`}
        aria-hidden="true"
      />
    </button>
  )
}
