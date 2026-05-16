import {
  ClipboardList, BarChart3, Eye, Target, Play, TrendingUp, BookOpen, Settings,
  User, GraduationCap, Star, Wrench, MapPin, HelpCircle, FileText,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * NavIcon — Cluster G Spawn-Task (16.05.2026).
 *
 * `iconStringToComponent` mappt persistierte Emoji-Strings (aus appNavigation
 * und favoritenStore — Persist-State von User-Favoriten) auf Lucide-Komponenten.
 * Unbekannte Strings fallen auf String-Render zurück (`null` Return).
 *
 * Refactor: vorher in `FavoritenTab.tsx` und `lp/Favoriten.tsx` dupliziert.
 *
 * `NavIcon` Render-Helper: Icon-String → Lucide-Komponente (falls bekannt) sonst
 * String unverändert (z.B. unbekannte User-Custom-Strings).
 */
export function iconStringToComponent(s: string): ComponentType<LucideProps> | null {
  switch (s) {
    case '📝': return ClipboardList
    case '📊': return BarChart3
    case '👁️': case '👁': return Eye
    case '🎯': return Target
    case '▶️': case '▶': return Play
    case '📈': return TrendingUp
    case '📚': return BookOpen
    case '⚙️': case '⚙': return Settings
    case '👤': return User
    case '🎓': return GraduationCap
    case '⭐': case '☆': return Star
    case '🔧': return Wrench
    case '📍': return MapPin
    case '❓': return HelpCircle
    case '📄': return FileText
    default: return null
  }
}

interface NavIconProps {
  icon?: string
  className?: string
}

export function NavIcon({ icon, className = 'w-4 h-4 inline-block' }: NavIconProps) {
  if (!icon) return null
  const Comp = iconStringToComponent(icon)
  if (Comp) return <Comp className={className} />
  return <span>{icon}</span>
}
