import type { Tool } from './ZeichnenTypes'

/**
 * Liefert den passenden CSS-Cursor für ein Zeichen-Werkzeug.
 */
export function cursorFuerTool(tool: Tool): string {
  switch (tool) {
    case 'auswahl':   return 'default'
    case 'stift':     return 'crosshair'
    case 'linie':     return 'crosshair'
    case 'pfeil':     return 'crosshair'
    case 'rechteck':  return 'crosshair'
    case 'ellipse':   return 'crosshair'
    case 'text':      return 'text'
    case 'radierer':  return 'cell'
    default:          return 'default'
  }
}
