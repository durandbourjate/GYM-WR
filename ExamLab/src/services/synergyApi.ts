import { getJson } from './apiClient'

// Typen — Spalten gemäss tatsächlichen Google Sheets

export interface ZentralerKurs {
  kursId: string
  label: string
  fach: string
  gefaess: string
  lpEmail: string
  klassen: string
  aktiv: string
}

export interface StundenplanEintrag {
  kursId: string
  wochentag: string
  lektionen: string
  zeit: string
  raum: string
  halbklasse: string
  semester: string
  phasen: string
  raum_s1: string
  raum_s2: string
  bemerkung: string
}

export interface Schueler {
  name: string
  vorname: string
  email: string
  klasse: string
  schuelerId: string
  geschlecht: string
}

export interface TafPhase {
  phase: string
  startKW: string
  endKW: string
  schuljahr: string
  bemerkung: string
}

export interface KursDetails {
  kurs: ZentralerKurs
  schueler: Schueler[]
  stundenplan: StundenplanEintrag[]
  phasen: TafPhase[]
}

export interface Schuljahr {
  ferien: Array<{ label: string; startKW: string; endKW: string; schuljahr: string; tage: string }>
  sonderwochen: Array<{ kw: string; label: string; gymLevel: string; schuljahr: string; typ: string }>
  semester: Array<{ kursId: string; semester: string; startKW: string; endKW: string; schuljahr: string; faecher: string }>
  phasen: TafPhase[]
}

export interface Beurteilungsregel {
  label: string
  deadline: string
  minNoten: string
  semester: string
  stufe: string
  wochenlektionen: string
  bemerkung: string
}

export interface LehrplanDaten {
  lehrplanziele: Array<{ id: string; ebene: string; parentId: string; fach: string; gefaess: string; semester: string; thema: string; text: string; bloom: string }>
  beurteilungsregeln: Beurteilungsregel[]
}

// API-Funktionen
export async function ladeKurse(email: string): Promise<ZentralerKurs[]> {
  const result = await getJson<{ kurse: ZentralerKurs[] }>('ladeKurse', { email })
  return result?.kurse ?? []
}

export async function ladeKursDetails(email: string, kursId: string): Promise<KursDetails | null> {
  return getJson<KursDetails>('ladeKursDetails', { email, kursId })
}

export async function ladeSchuljahr(email: string): Promise<Schuljahr | null> {
  return getJson<Schuljahr>('ladeSchuljahr', { email })
}

export async function ladeLehrplan(email: string, fach?: string, gefaess?: string): Promise<LehrplanDaten | null> {
  return getJson<LehrplanDaten>('ladeLehrplan', { email, fach: fach ?? '', gefaess: gefaess ?? '' })
}
