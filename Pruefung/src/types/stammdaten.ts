/**
 * Stammdaten — Schulweite Konfiguration (Admin-verwaltet).
 * Ersetzt hardcoded Werte in fachUtils.ts, useFragenFilter.ts, etc.
 */

export interface KursDefinition {
  id: string          // z.B. 'sf-wr-29c'
  name: string        // z.B. 'SF WR 29c'
  fach: string        // z.B. 'Wirtschaft & Recht'
  fachschaft: string  // z.B. 'WR'
  gefaess: string     // z.B. 'SF'
  klassen: string[]   // z.B. ['29c']
}

export interface FachDefinition {
  id: string          // z.B. 'wr'
  kuerzel: string     // z.B. 'WR'
  name: string        // z.B. 'Wirtschaft & Recht'
  fachbereich?: string // z.B. 'WR' (für Farbzuordnung)
}

export interface FachschaftDefinition {
  id: string          // z.B. 'wr'
  kuerzel: string     // z.B. 'WR'
  name: string        // z.B. 'Wirtschaft & Recht'
  faecherIds: string[] // Zugehörige Fach-IDs
  fachbereichTags?: { name: string; farbe: string }[] // z.B. VWL, BWL, Recht
}

export interface Stammdaten {
  admins: string[]                    // E-Mails der Admins
  klassen: string[]                   // z.B. ['27a', '28bc29fs', '29c', '30s']
  kurse: KursDefinition[]
  faecher: FachDefinition[]
  gefaesse: string[]                  // z.B. ['SF', 'EWR', 'EF', 'GF']
  fachschaften: FachschaftDefinition[]
}

/** Favorisierter App-Ort (Screen + Parameter für Direktlinks) */
export interface AppOrt {
  id: string                          // Unique ID (generiert)
  titel: string                       // z.B. "SF WR 29c — Analyse"
  screen: 'pruefung' | 'uebung' | 'fragensammlung'
  params: Record<string, string>      // z.B. { configId: 'abc', tab: 'analyse' }
  erstelltAm: string                  // ISO timestamp
}

/** LP-Profil: Eigene Kurs-/Fachzuordnung */
export interface LPProfil {
  email: string
  kursIds: string[]
  fachschaftIds: string[]
  gefaesse: string[]
  favoriten?: AppOrt[]                // Account-verknüpfte Favoriten
}

/** Default-Stammdaten (Gym Hofwil) — Fallback wenn Backend nicht erreichbar */
export const DEFAULT_STAMMDATEN: Stammdaten = {
  admins: ['yannick.durand@gymhofwil.ch'],
  klassen: ['27a', '28bc29fs', '28c', '28f', '29c', '29f', '29fs', '30s'],
  kurse: [
    { id: 'sf-wr-29c', name: 'SF WR 29c', fach: 'Wirtschaft & Recht', fachschaft: 'WR', gefaess: 'SF', klassen: ['29c'] },
    { id: 'sf-wr-28bc29fs', name: 'SF WR 28bc29fs', fach: 'Wirtschaft & Recht', fachschaft: 'WR', gefaess: 'SF', klassen: ['28bc29fs'] },
    { id: 'sf-wr-27a28f', name: 'SF WR 27a28f', fach: 'Wirtschaft & Recht', fachschaft: 'WR', gefaess: 'SF', klassen: ['27a', '28f'] },
    { id: 'in-28c', name: 'IN 28c', fach: 'Informatik', fachschaft: 'IN', gefaess: 'GF', klassen: ['28c'] },
    { id: 'in-29f', name: 'IN 29f', fach: 'Informatik', fachschaft: 'IN', gefaess: 'GF', klassen: ['29f'] },
    { id: 'in-30s', name: 'IN 30s', fach: 'Informatik', fachschaft: 'IN', gefaess: 'GF', klassen: ['30s'] },
  ],
  faecher: [
    { id: 'wr', kuerzel: 'WR', name: 'Wirtschaft & Recht', fachbereich: 'WR' },
    { id: 'in', kuerzel: 'IN', name: 'Informatik', fachbereich: 'IN' },
    { id: 'de', kuerzel: 'DE', name: 'Deutsch' },
    { id: 'fr', kuerzel: 'FR', name: 'Französisch' },
    { id: 'en', kuerzel: 'EN', name: 'Englisch' },
    { id: 'ma', kuerzel: 'MA', name: 'Mathematik' },
    { id: 'bi', kuerzel: 'BI', name: 'Biologie' },
    { id: 'ch', kuerzel: 'CH', name: 'Chemie' },
    { id: 'ph', kuerzel: 'PH', name: 'Physik' },
    { id: 'gs', kuerzel: 'GS', name: 'Geschichte' },
    { id: 'gg', kuerzel: 'GG', name: 'Geografie' },
    { id: 'bg', kuerzel: 'BG', name: 'Bildnerisches Gestalten' },
    { id: 'mu', kuerzel: 'MU', name: 'Musik' },
    { id: 'sp', kuerzel: 'SP', name: 'Sport' },
    { id: 'pl', kuerzel: 'PL', name: 'Philosophie' },
    { id: 'la', kuerzel: 'LA', name: 'Latein' },
  ],
  gefaesse: ['SF', 'EF', 'EWR', 'GF', 'FF'],
  fachschaften: [
    {
      id: 'wr', kuerzel: 'WR', name: 'Wirtschaft & Recht',
      faecherIds: ['wr'],
      fachbereichTags: [
        { name: 'VWL', farbe: '#f97316' },
        { name: 'BWL', farbe: '#3b82f6' },
        { name: 'Recht', farbe: '#22c55e' },
      ],
    },
    { id: 'in', kuerzel: 'IN', name: 'Informatik', faecherIds: ['in'] },
    { id: 'de', kuerzel: 'DE', name: 'Deutsch', faecherIds: ['de'] },
    { id: 'fr', kuerzel: 'FR', name: 'Französisch', faecherIds: ['fr'] },
    { id: 'en', kuerzel: 'EN', name: 'Englisch', faecherIds: ['en'] },
    { id: 'ma', kuerzel: 'MA', name: 'Mathematik', faecherIds: ['ma'] },
    { id: 'bi', kuerzel: 'BI', name: 'Biologie', faecherIds: ['bi'] },
    { id: 'ch', kuerzel: 'CH', name: 'Chemie', faecherIds: ['ch'] },
    { id: 'ph', kuerzel: 'PH', name: 'Physik', faecherIds: ['ph'] },
    { id: 'gs', kuerzel: 'GS', name: 'Geschichte', faecherIds: ['gs'] },
    { id: 'gg', kuerzel: 'GG', name: 'Geografie', faecherIds: ['gg'] },
    { id: 'bg', kuerzel: 'BG', name: 'Bildnerisches Gestalten', faecherIds: ['bg'] },
    { id: 'mu', kuerzel: 'MU', name: 'Musik', faecherIds: ['mu'] },
    { id: 'sp', kuerzel: 'SP', name: 'Sport', faecherIds: ['sp'] },
    { id: 'pl', kuerzel: 'PL', name: 'Philosophie', faecherIds: ['pl'] },
    { id: 'la', kuerzel: 'LA', name: 'Latein', faecherIds: ['la'] },
  ],
}
