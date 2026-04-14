/**
 * Feste Zuordnung: Pool-ID → bereinigter Anzeige-Titel.
 * Wird im SuS-Dashboard und in der Fragensammlung verwendet,
 * um Pool-Fragen konsistent nach Pool zu gruppieren.
 *
 * Pool-ID = erster Teil von poolId (vor dem Doppelpunkt),
 * z.B. "bwl_einfuehrung" aus "bwl_einfuehrung:w01"
 */
export const POOL_TITEL: Record<string, string> = {
  // BWL
  bwl_einfuehrung: 'Grundlagen der Betriebswirtschaftslehre',
  bwl_fibu: 'Finanzbuchhaltung (FIBU)',
  bwl_marketing: 'Markt- und Leistungsanalyse',
  bwl_stratfuehrung: 'Strategische Unternehmensführung',
  bwl_unternehmensmodell: 'Unternehmensmodell – Umweltsphären & Anspruchsgruppen',

  // Recht
  recht_arbeitsrecht: 'Arbeitsrecht',
  recht_einfuehrung: 'Grundsätze der Rechtsordnung',
  recht_einleitungsartikel: 'Rechtsquellen und Rechtsgrundsätze',
  recht_grundrechte: 'Menschenrechte und Grundrechte',
  recht_mietrecht: 'Mietrecht',
  recht_or_at: 'OR AT – Vertragslehre',
  recht_personenrecht: 'Personenrecht',
  recht_prozessrecht: 'Prozessrecht',
  recht_sachenrecht: 'Sachenrecht',
  recht_strafrecht: 'Strafrecht',

  // VWL
  vwl_arbeitslosigkeit: 'Arbeitslosigkeit & Armut',
  vwl_beduerfnisse: 'Bedürfnisse, Knappheit & Produktionsfaktoren',
  vwl_bip: 'Bruttoinlandprodukt (BIP)',
  vwl_geld: 'Geld, Geldpolitik und Finanzmärkte',
  vwl_konjunktur: 'Konjunktur und Konjunkturpolitik',
  vwl_markteffizienz: 'Markteffizienz',
  vwl_menschenbild: 'Ökonomisches Menschenbild',
  vwl_sozialpolitik: 'Sozialpolitik und Sozialversicherungen',
  vwl_staatsverschuldung: 'Staatsverschuldung',
  vwl_steuern: 'Steuern und Staatseinnahmen',
  vwl_wachstum: 'Wirtschaftswachstum',

  // Informatik
  informatik_kryptographie: 'Kryptographie',
}

/** Gibt den bereinigten Pool-Titel für eine Pool-ID zurück */
export function poolTitel(poolMetaId: string): string | null {
  return POOL_TITEL[poolMetaId.toLowerCase()] ?? null
}
