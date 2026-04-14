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
    // Grundlagenfächer (notenrelevant)
    { id: 'de', kuerzel: 'D', name: 'Deutsch' },
    { id: 'fr', kuerzel: 'F', name: 'Französisch' },
    { id: 'en', kuerzel: 'E', name: 'Englisch' },
    { id: 'ma', kuerzel: 'M', name: 'Mathematik' },
    { id: 'bi', kuerzel: 'B', name: 'Biologie' },
    { id: 'ch', kuerzel: 'C', name: 'Chemie' },
    { id: 'ph', kuerzel: 'P', name: 'Physik' },
    { id: 'gs', kuerzel: 'G', name: 'Geschichte' },
    { id: 'gg', kuerzel: 'GG', name: 'Geografie' },
    { id: 'bg', kuerzel: 'BG', name: 'Bildnerisches Gestalten' },
    { id: 'mu', kuerzel: 'MU', name: 'Musik' },
    { id: 'sp', kuerzel: 'SP', name: 'Sport' },
    { id: 'wr', kuerzel: 'WR', name: 'Wirtschaft & Recht', fachbereich: 'WR' },
    { id: 'in', kuerzel: 'IN', name: 'Informatik', fachbereich: 'IN' },
    { id: 'rl', kuerzel: 'RL', name: 'Religionslehre' },
    // Schwerpunktfächer
    { id: 'bc-sf', kuerzel: 'BC!', name: 'Biologie/Chemie Schwerpunktfach' },
    { id: 'bg-sf', kuerzel: 'BG!', name: 'Bildnerisches Gestalten Schwerpunktfach' },
    { id: 'mu-sf', kuerzel: 'MU!', name: 'Musik Schwerpunktfach' },
    { id: 'ppp-sf', kuerzel: 'PPP!', name: 'Pädagogik Psychologie Philosophie Schwerpunktfach' },
    { id: 's-sf', kuerzel: 'S!', name: 'Spanisch Schwerpunktfach' },
    { id: 'wr-sf', kuerzel: 'WR!', name: 'Wirtschaft & Recht Schwerpunktfach', fachbereich: 'WR' },
    // Ergänzungsfächer
    { id: 'bi-ef', kuerzel: 'B!!', name: 'Biologie Ergänzungsfach' },
    { id: 'ch-ef', kuerzel: 'C!!', name: 'Chemie Ergänzungsfach' },
    { id: 'gs-ef', kuerzel: 'G!!', name: 'Geschichte Ergänzungsfach' },
    { id: 'gg-ef', kuerzel: 'GG!!', name: 'Geografie Ergänzungsfach' },
    { id: 'in-ef', kuerzel: 'IN!!', name: 'Informatik Ergänzungsfach', fachbereich: 'IN' },
    { id: 'mu-ef', kuerzel: 'MU!!', name: 'Musik Ergänzungsfach' },
    { id: 'ph-ef', kuerzel: 'P!!', name: 'Physik Ergänzungsfach' },
    { id: 'pl-ef', kuerzel: 'PH!!', name: 'Philosophie Ergänzungsfach' },
    { id: 'pp-ef', kuerzel: 'PP!!', name: 'Pädagogik Psychologie Ergänzungsfach' },
    { id: 'rl-ef', kuerzel: 'RL!!', name: 'Religionslehre Ergänzungsfach' },
    { id: 'sp-ef', kuerzel: 'SP!!', name: 'Sport Ergänzungsfach' },
    { id: 'wr-ef', kuerzel: 'WR!!', name: 'Wirtschaft & Recht Ergänzungsfach', fachbereich: 'WR' },
    { id: 'bg-ef', kuerzel: 'BG!!', name: 'Bildnerisches Gestalten Ergänzungsfach' },
    // Weitere
    { id: 'ks', kuerzel: 'KS', name: 'Klassenstunde' },
    { id: 'il', kuerzel: 'IL', name: 'Individuelles Lernen Profil Hofwil' },
  ],
  gefaesse: ['SF', 'EF', 'EWR', 'GF', 'FF', 'TAF'],
  fachschaften: [
    {
      id: 'wr', kuerzel: 'WR', name: 'Wirtschaft & Recht',
      faecherIds: ['wr', 'wr-sf', 'wr-ef'],
      fachbereichTags: [
        { name: 'VWL', farbe: '#f97316' },
        { name: 'BWL', farbe: '#3b82f6' },
        { name: 'Recht', farbe: '#22c55e' },
      ],
    },
    { id: 'in', kuerzel: 'IN', name: 'Informatik', faecherIds: ['in', 'in-ef'] },
    { id: 'de', kuerzel: 'D', name: 'Deutsch', faecherIds: ['de'] },
    { id: 'fr', kuerzel: 'F', name: 'Französisch', faecherIds: ['fr'] },
    { id: 'en', kuerzel: 'E', name: 'Englisch', faecherIds: ['en'] },
    { id: 'ma', kuerzel: 'M', name: 'Mathematik', faecherIds: ['ma'] },
    { id: 'bi', kuerzel: 'B', name: 'Biologie', faecherIds: ['bi', 'bi-ef', 'bc-sf'] },
    { id: 'ch', kuerzel: 'C', name: 'Chemie', faecherIds: ['ch', 'ch-ef'] },
    { id: 'ph', kuerzel: 'P', name: 'Physik', faecherIds: ['ph', 'ph-ef'] },
    { id: 'gs', kuerzel: 'G', name: 'Geschichte', faecherIds: ['gs', 'gs-ef'] },
    { id: 'gg', kuerzel: 'GG', name: 'Geografie', faecherIds: ['gg', 'gg-ef'] },
    { id: 'bg', kuerzel: 'BG', name: 'Bildnerisches Gestalten', faecherIds: ['bg', 'bg-sf', 'bg-ef'] },
    { id: 'mu', kuerzel: 'MU', name: 'Musik', faecherIds: ['mu', 'mu-sf', 'mu-ef'] },
    { id: 'sp', kuerzel: 'SP', name: 'Sport', faecherIds: ['sp', 'sp-ef'] },
    { id: 'rl', kuerzel: 'RL', name: 'Religionslehre', faecherIds: ['rl', 'rl-ef'] },
    { id: 'ppp', kuerzel: 'PPP', name: 'Pädagogik Psychologie Philosophie', faecherIds: ['ppp-sf', 'pp-ef', 'pl-ef'] },
    { id: 's', kuerzel: 'S', name: 'Spanisch', faecherIds: ['s-sf'] },
  ],
}

/**
 * Offizielle Fachkürzel gemäss Kürzelliste Gymnasium Hofwil SJ2025/26.
 * Mapping: Offizielles Kürzel → { fachId, gefaess }
 *
 * Schema: Kürzel ohne Suffix = GF, ! = SF, !! = EF, + = FF, t = TAF, -FF = FF
 */
export const FACHKUERZEL_MAP: Record<string, { fachId: string; gefaess: string }> = {
  // Grundlagenfächer
  'B': { fachId: 'bi', gefaess: 'GF' },
  'C': { fachId: 'ch', gefaess: 'GF' },
  'D': { fachId: 'de', gefaess: 'GF' },
  'E': { fachId: 'en', gefaess: 'GF' },
  'F': { fachId: 'fr', gefaess: 'GF' },
  'G': { fachId: 'gs', gefaess: 'GF' },
  'GG': { fachId: 'gg', gefaess: 'GF' },
  'M': { fachId: 'ma', gefaess: 'GF' },
  'P': { fachId: 'ph', gefaess: 'GF' },
  'BG': { fachId: 'bg', gefaess: 'GF' },
  'MU': { fachId: 'mu', gefaess: 'GF' },
  'SP': { fachId: 'sp', gefaess: 'GF' },
  'WR': { fachId: 'wr', gefaess: 'GF' },
  'IN': { fachId: 'in', gefaess: 'GF' },
  'RL': { fachId: 'rl', gefaess: 'GF' },
  'KS': { fachId: 'ks', gefaess: 'GF' },
  'IL': { fachId: 'il', gefaess: 'GF' },
  // Schwerpunktfächer (!)
  'BC!': { fachId: 'bc-sf', gefaess: 'SF' },
  'BG!': { fachId: 'bg-sf', gefaess: 'SF' },
  'MU!': { fachId: 'mu-sf', gefaess: 'SF' },
  'PPP!': { fachId: 'ppp-sf', gefaess: 'SF' },
  'S!': { fachId: 's-sf', gefaess: 'SF' },
  'WR!': { fachId: 'wr-sf', gefaess: 'SF' },
  // Ergänzungsfächer (!!)
  'B!!': { fachId: 'bi-ef', gefaess: 'EF' },
  'C!!': { fachId: 'ch-ef', gefaess: 'EF' },
  'G!!': { fachId: 'gs-ef', gefaess: 'EF' },
  'GG!!': { fachId: 'gg-ef', gefaess: 'EF' },
  'IN!!': { fachId: 'in-ef', gefaess: 'EF' },
  'MU!!': { fachId: 'mu-ef', gefaess: 'EF' },
  'P!!': { fachId: 'ph-ef', gefaess: 'EF' },
  'PH!!': { fachId: 'pl-ef', gefaess: 'EF' },
  'PP!!': { fachId: 'pp-ef', gefaess: 'EF' },
  'RL!!': { fachId: 'rl-ef', gefaess: 'EF' },
  'SP!!': { fachId: 'sp-ef', gefaess: 'EF' },
  'WR!!': { fachId: 'wr-ef', gefaess: 'EF' },
  'BG!!': { fachId: 'bg-ef', gefaess: 'EF' },
}

/** Offizielle Lehrpersonen-Kürzel (3 Buchstaben) → Name. Quelle: Kürzelliste SJ2025/26 */
export const LP_KUERZEL_MAP: Record<string, { vorname: string; nachname: string }> = {
  'DUY': { vorname: 'Yannick', nachname: 'Durand' },
  'STB': { vorname: 'Bernhard', nachname: 'Stübi' },
  'STN': { vorname: 'Niklaus', nachname: 'Streit' },
  'HEP': { vorname: 'Petra', nachname: 'Heck' },
  'HIC': { vorname: 'Christoph', nachname: 'Heiniger' },
}
