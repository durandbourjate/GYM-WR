export interface SynergyConfigValidation {
  urlError?: string
  emailError?: string
}

/** Prüft URL + E-Mail der Synergy-Config. Leeres Ergebnis = gültig. */
export function validateSynergyConfig(url: string, email: string): SynergyConfigValidation {
  const result: SynergyConfigValidation = {}

  const u = url.trim()
  if (u === '') {
    result.urlError = 'URL darf nicht leer sein.'
  } else if (!u.startsWith('https://')) {
    result.urlError = 'URL muss mit https:// beginnen.'
  } else {
    try {
      new URL(u)
    } catch {
      result.urlError = 'URL ist nicht gültig.'
    }
  }

  const e = email.trim()
  if (e === '') {
    result.emailError = 'E-Mail darf nicht leer sein.'
  } else if (!e.includes('@')) {
    result.emailError = 'E-Mail muss ein @ enthalten.'
  }

  return result
}
