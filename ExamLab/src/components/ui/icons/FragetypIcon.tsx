import type { LucideProps } from 'lucide-react'
import { FRAGETYP_ICON_MAP, type Fragetyp } from './fragetypIconMap'

interface FragetypIconProps extends LucideProps {
  typ: Fragetyp
}

/**
 * Rendert das Icon eines Fragetyps. Graceful Fallback: null wenn Typ
 * zur Runtime nicht im MAP (defensive — TS-Compiler garantiert eigentlich Vollständigkeit).
 *
 * Map + Type leben in `./fragetypIconMap.ts` (only-export-components-Regel).
 */
export function FragetypIcon({ typ, ...props }: FragetypIconProps) {
  const Icon = FRAGETYP_ICON_MAP[typ]
  if (!Icon) return null
  return <Icon {...props} />
}
