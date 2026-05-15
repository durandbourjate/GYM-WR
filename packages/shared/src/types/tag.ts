export type TagFarbe = 'slate' | 'red' | 'amber' | 'emerald' | 'sky' | 'violet' | 'pink' | 'stone';

export const TAG_FARBEN: TagFarbe[] = ['slate', 'red', 'amber', 'emerald', 'sky', 'violet', 'pink', 'stone'];

export interface Tag {
  id: string;             // UUID v4 (vom Backend via Utilities.getUuid())
  name: string;           // ohne Whitespace-Padding, case-preserving
  farbe: TagFarbe;        // Tailwind-Farb-Token
  archiviert: boolean;    // Soft-Delete
  erstelltAm: string;     // ISO-8601
  erstelltVon: string;    // LP-Email
}
