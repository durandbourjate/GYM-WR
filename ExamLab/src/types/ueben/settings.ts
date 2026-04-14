export interface MasterySchwellwerte {
  gefestigt: number       // Richtig in Folge für "gefestigt" (default 3)
  gemeistert: number      // Richtig in Folge für "gemeistert" (default 5)
  gemeistertMinSessions: number  // Min. verschiedene Sessions für "gemeistert" (default 2)
}

export const DEFAULT_MASTERY_SCHWELLWERTE: MasterySchwellwerte = {
  gefestigt: 3, gemeistert: 5, gemeistertMinSessions: 2,
}

export interface GruppenEinstellungen {
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>
  fachFarben: Record<string, string>
  fokusThema?: { fach: string; thema: string }
  masterySchwellwerte?: MasterySchwellwerte
  maxAktiveThemen?: number
}

export const DEFAULT_GYM: GruppenEinstellungen = {
  anrede: 'sie', feedbackStil: 'sachlich',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
  maxAktiveThemen: 5,
}

export const DEFAULT_FAMILIE: GruppenEinstellungen = {
  anrede: 'du', feedbackStil: 'ermutigend',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
  maxAktiveThemen: 5,
}

export function defaultEinstellungen(typ: 'gym' | 'familie'): GruppenEinstellungen {
  return typ === 'familie' ? { ...DEFAULT_FAMILIE } : { ...DEFAULT_GYM }
}
