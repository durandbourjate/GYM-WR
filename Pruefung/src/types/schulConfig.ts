export interface SchulConfig {
  schulName: string
  schulKuerzel: string
  logoUrl: string
  lpDomain: string
  susDomain: string
  faecher: string[]
  gefaesse: string[]
  querschnittsTags: { name: string; farbe: string }[]
  semesterModell: {
    regel: { anzahl: number; label: string }
    taf: { anzahl: number; label: string }
  }
  fachschaftsTags: Record<string, { name: string; farbe: string }[]>
}

export const DEFAULT_SCHUL_CONFIG: SchulConfig = {
  schulName: 'Gymnasium Hofwil',
  schulKuerzel: 'GH',
  logoUrl: '',
  lpDomain: 'gymhofwil.ch',
  susDomain: 'stud.gymhofwil.ch',
  faecher: [
    'Deutsch', 'Französisch', 'Englisch', 'Italienisch', 'Spanisch', 'Latein',
    'Mathematik', 'Biologie', 'Chemie', 'Physik',
    'Geschichte', 'Geografie',
    'Wirtschaft & Recht', 'Informatik',
    'Bildnerisches Gestalten', 'Musik', 'Sport',
    'Philosophie', 'Pädagogik/Psychologie', 'Religionslehre',
  ],
  gefaesse: ['SF', 'EF', 'EWR', 'GF', 'FF'],
  querschnittsTags: [
    { name: 'BNE', farbe: '#10b981' },
    { name: 'Digitalität', farbe: '#6366f1' },
    { name: 'Transversalität', farbe: '#8b5cf6' },
    { name: 'Interdisziplinär', farbe: '#ec4899' },
  ],
  semesterModell: {
    regel: { anzahl: 8, label: 'S1–S8' },
    taf: { anzahl: 10, label: 'S1–S10' },
  },
  fachschaftsTags: {
    WR: [
      { name: 'VWL', farbe: '#f97316' },
      { name: 'BWL', farbe: '#3b82f6' },
      { name: 'Recht', farbe: '#22c55e' },
    ],
  },
}
