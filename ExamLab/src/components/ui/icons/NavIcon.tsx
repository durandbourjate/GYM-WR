import { iconStringToComponent } from './navIconMaps'

interface NavIconProps {
  icon?: string
  className?: string
}

/**
 * NavIcon-Render-Helper: Icon-Key → Lucide-Komponente (falls bekannt) sonst
 * String unverändert (z.B. unbekannte User-Custom-Strings).
 *
 * Persist-Schema + Map-Definitionen leben in `./navIconMaps.ts`.
 */
export function NavIcon({ icon, className = 'w-4 h-4 inline-block' }: NavIconProps) {
  if (!icon) return null
  const Comp = iconStringToComponent(icon)
  if (Comp) return <Comp className={className} aria-hidden="true" />
  return <span>{icon}</span>
}
