import type { SchulConfig } from '../types/schulConfig'

export function istGueltigesGefaess(wert: string, config: SchulConfig): boolean {
  return wert !== '' && config.gefaesse.includes(wert)
}
