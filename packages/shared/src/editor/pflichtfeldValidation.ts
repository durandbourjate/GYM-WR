import type { Frage } from '../types/fragen'

export type FeldStatus = 'pflicht-leer' | 'empfohlen-leer' | 'ok'

export interface ValidationResult {
  pflichtErfuellt: boolean
  empfohlenErfuellt: boolean
  felderStatus: Record<string, FeldStatus>
  pflichtLeerFelder: string[]
  empfohlenLeerFelder: string[]
}

const DEFAULT_OK: ValidationResult = {
  pflichtErfuellt: true,
  empfohlenErfuellt: true,
  felderStatus: {},
  pflichtLeerFelder: [],
  empfohlenLeerFelder: [],
}

const DEFAULT_KONSERVATIV: ValidationResult = {
  ...DEFAULT_OK,
  empfohlenErfuellt: false,
}

function strNonEmpty(s: unknown): boolean {
  return typeof s === 'string' && s.trim().length > 0
}

export function validierePflichtfelder(frage: Frage | null | undefined): ValidationResult {
  if (!frage || typeof frage !== 'object') return DEFAULT_OK

  try {
    switch ((frage as any).typ) {
      case 'mc':
        return validiereMC(frage as any)
      case 'audio':
        return DEFAULT_OK
      default:
        console.warn(`[pflichtfeldValidation] Unbekannter typ: ${(frage as any).typ}`)
        return DEFAULT_KONSERVATIV
    }
  } catch (err) {
    console.error('[pflichtfeldValidation] crash:', err)
    return DEFAULT_OK
  }
}

function validiereMC(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const optionen = Array.isArray(frage.optionen) ? frage.optionen : []
  const mind2 = optionen.filter((o: any) => strNonEmpty(o?.text)).length >= 2
  const eineKorrekt = optionen.some((o: any) => o?.korrekt === true)
  const erklaerungenAlle = optionen.length > 0 && optionen.every((o: any) => strNonEmpty(o?.erklaerung))

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!mind2) pflichtLeer.push('Mind. 2 Optionen mit Text')
  if (!eineKorrekt) pflichtLeer.push('Mind. 1 korrekte Option markiert')

  const empfohlenLeer: string[] = []
  if (!erklaerungenAlle) empfohlenLeer.push('Erklärung pro Option')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      optionen: mind2 && eineKorrekt ? 'ok' : 'pflicht-leer',
      erklaerungen: erklaerungenAlle ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}
