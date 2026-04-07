const texte = {
  richtig:    { sie: 'Korrekt.',                     du: 'Super, richtig!' },
  falsch:     { sie: 'Leider nicht korrekt.',         du: 'Hmm, nicht ganz. Versuch es nochmal!' },
  weiter:     { sie: 'Weiter',                        du: 'Weiter' },
  beenden:    { sie: 'Übung beenden',                 du: 'Fertig!' },
  willkommen: { sie: 'Willkommen',                    du: 'Hallo' },
  nochmal:    { sie: 'Erneut üben',                   du: 'Nochmal!' },
  tipp:       { sie: 'Hinweis anzeigen',              du: 'Tipp zeigen' },
  leer:       { sie: 'Keine Aufgaben verfügbar.',     du: 'Noch keine Aufgaben da.' },
  abmelden:   { sie: 'Abmelden',                      du: 'Tschüss!' },
  geschafft:  { sie: 'Übung abgeschlossen.',          du: 'Geschafft!' },
  unsicher:   { sie: 'Als unsicher markieren',         du: 'Bin mir unsicher' },
  skip:       { sie: 'Überspringen',                  du: 'Überspringen' },
} as const

export type AnredeKey = keyof typeof texte
export function t(key: AnredeKey, anrede: 'sie' | 'du'): string {
  return texte[key][anrede]
}
