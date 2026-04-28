/**
 * Strukturelle Typen — kompatibel mit sowohl @shared/types/fragen.LueckentextFrage
 * (ueben-Pfad) als auch ExamLab/src/types/fragen.LueckentextFrage (LP-Editor-Pfad).
 * Vermeidet doppelte Modul-Imports + cross-module-strict-Typenfehler.
 */
type LueckentextLikeFrage = {
  typ: string
  luecken?: { id: string }[]
}

type LueckentextLikeAntwort = {
  typ: string
  eintraege?: Record<string, string>
}

/**
 * Liefert die Anzahl der noch offenen (leeren) Lücken in einer Lückentext-Antwort.
 * Bei nicht-Lückentext-Fragen: 0. Bei Lückentext ohne Antwort: alle Lücken offen.
 *
 * Als „leer" zählt: undefined, null, '' oder reiner Whitespace.
 */
export function anzahlOffeneLuecken(
  frage: LueckentextLikeFrage,
  antwort: LueckentextLikeAntwort | null,
): number {
  if (frage.typ !== 'lueckentext') return 0
  const luecken = frage.luecken ?? []
  if (luecken.length === 0) return 0
  if (!antwort || antwort.typ !== 'lueckentext') return luecken.length
  const eintraege = antwort.eintraege ?? {}
  return luecken.filter(l => !(eintraege[l.id]?.trim())).length
}

/**
 * True, wenn alle Lücken einer Lückentext-Frage gefüllt sind (oder die Frage
 * kein Lückentext ist — dann gibt es nichts zu prüfen).
 */
export function alleLueckenGefuellt(
  frage: LueckentextLikeFrage,
  antwort: LueckentextLikeAntwort | null,
): boolean {
  return anzahlOffeneLuecken(frage, antwort) === 0
}
