// Punkt auf dem Canvas
export interface Point {
  x: number;
  y: number;
  druck?: number; // 0.0-1.0, nur bei Stifteingabe
}

// Eindeutige ID pro Command (Timestamp-basiert)
export type CommandId = string;

// Alle Zeichenbefehle als Discriminated Union
export type DrawCommand =
  | { id: CommandId; typ: 'stift'; punkte: Point[]; farbe: string; breite: number; gestrichelt?: boolean }
  | { id: CommandId; typ: 'linie'; von: Point; bis: Point; farbe: string; breite: number; gestrichelt?: boolean }
  | { id: CommandId; typ: 'pfeil'; von: Point; bis: Point; farbe: string; breite: number; gestrichelt?: boolean }
  | { id: CommandId; typ: 'rechteck'; von: Point; bis: Point; farbe: string; breite: number; gefuellt: boolean; gestrichelt?: boolean }
  | { id: CommandId; typ: 'ellipse'; von: Point; bis: Point; farbe: string; breite: number; gefuellt: boolean; gestrichelt?: boolean }
  | { id: CommandId; typ: 'text'; position: Point; text: string; farbe: string; groesse: number; rotation?: 0 | 90 | 180 | 270; fett?: boolean }
  | { id: CommandId; typ: 'radierer'; punkte: Point[]; breite: number };

// Aktives Werkzeug
export type Tool = 'auswahl' | 'stift' | 'linie' | 'pfeil' | 'rechteck' | 'ellipse' | 'text' | 'radierer';

// Canvas-Gesamtzustand
export interface CanvasState {
  commands: DrawCommand[];
  redoStack: DrawCommand[];
  aktiverCommand: DrawCommand | null;
  selektierterCommand: CommandId | null;
}

// Toolbar-Orientierung
export type ToolbarLayout = 'horizontal' | 'vertikal';

// Standard-Farben: kräftige Farben für Text/Linien + Pastell-Farben zum Markieren
export const STANDARD_FARBEN = [
  '#000000', // Schwarz (Default)
  '#DC2626', // Rot kräftig
  '#2563EB', // Blau kräftig
  '#16A34A', // Grün kräftig
  '#F59E0B', // Orange/Amber
  '#FEF08A', // Gelb Pastell
  '#FBCFE8', // Rosa Pastell
  '#BAE6FD', // Hellblau Pastell
  '#BBF7D0', // Hellgrün Pastell
];

// Grössen-Presets
export const GROESSE_PRESETS: Record<string, { breite: number; hoehe: number }> = {
  klein: { breite: 600, hoehe: 400 },
  mittel: { breite: 800, hoehe: 600 },
  gross: { breite: 1200, hoehe: 800 },
};

// Max Undo-Tiefe
export const MAX_UNDO_TIEFE = 50;

// Command-ID generieren
export function generiereCommandId(): CommandId {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
