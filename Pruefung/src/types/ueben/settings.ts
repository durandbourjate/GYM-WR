export interface GruppenEinstellungen {
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>
  fachFarben: Record<string, string>
}

export const DEFAULT_GYM: GruppenEinstellungen = {
  anrede: 'sie', feedbackStil: 'sachlich',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
}

export const DEFAULT_FAMILIE: GruppenEinstellungen = {
  anrede: 'du', feedbackStil: 'ermutigend',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
}

export function defaultEinstellungen(typ: 'gym' | 'familie'): GruppenEinstellungen {
  return typ === 'familie' ? { ...DEFAULT_FAMILIE } : { ...DEFAULT_GYM }
}
